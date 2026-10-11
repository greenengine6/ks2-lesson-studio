/* What Symphony does herself, on this device, with no engine call: open and close parts of the site and Wonder
   Window's windows, move through a presentation (next, back, slide 5, reveal, notes, join code, draw, class
   feedback), a timer, our class's names (remember, pick someone fairly, read them, forget them), read the slide,
   the time, and filling in a topic so the teacher can press Make. Commands are matched in English and Malay; anything
   else is a question for her to answer. */
import { $, $$, esc, icon, bus } from './core.js?v=7a165bee';
import { ENGINES } from './engines/registry.js?v=7a165bee';
import { pupils, namesIn, addPupils, clearPupils, showPick } from './pupils.js?v=7a165bee';
import { presenting, page } from './context.js?v=7a165bee';
import { sfx } from './fx/audio.js?v=7a165bee';
import { Voice } from './fx/voice.js?v=7a165bee';
import { settings } from './settings.js?v=7a165bee';

/* ---------------- where she can take you ---------------- */
const ENGINE_WORDS = { maths: 'maths reasoning|maths|math reasoning|math|which one doesn\'t belong|open middle', story: 'story spark|story|stories|creative writing', reading: 'reading ladder|reading|reading comprehension',
  science: 'science mystery|science|mystery', sound: 'sound journey|sound|sounds|journey', code: 'unplugged code|code|coding|robot|the robot|programming', steps: 'step by step|steps|step-by-step',
  escape: 'escape room|escape|the escape room', break: 'brain break|break|calm down|breathing', debate: 'big debate|debate|the debate' };
const TARGETS = [
  { id: 'home', hash: '#/', name: 'the home page', name_ms: 'laman utama', rx: 'home|home page|homepage|the home page|main page|start page|dashboard|my dashboard|our dashboard|your lessons|my lessons|our lessons|laman utama' },
  { id: 'lkie', hash: '#/lkie', name: 'lkie.like', name_ms: 'lkie.like', rx: 'l ?kie ?like|lkie|lkielike|l k i e like|likey like|likee like|lickey like|licky like|lucky like|like like|lk like|lesson pack|lesson packs|the pack maker|pack maker' },
  { id: 'slides', hash: '#/slides', name: 'Slide Studio', name_ms: 'Slide Studio', rx: 'slide studio|slides studio|the slide studio|slide maker|slides|slide' },
  { id: 'play', hash: '#/play', name: 'Wonder Window', name_ms: 'Wonder Window', rx: 'wonder window|wonder windows|the wonder window|play area|the play area|tingkap ajaib' },
  { id: 'admin', hash: '#/admin', name: 'the dashboard', name_ms: 'papan pemuka', rx: 'admin|the admin|admin dashboard|reports?|the reports?|rabinder s dashboard|rabinders dashboard|papan pemuka' }
].concat(ENGINES.map((e) => ({ id: e.id, hash: '#/' + e.id, name: e.name, name_ms: e.name, rx: ENGINE_WORDS[e.id] || e.name.toLowerCase() })));
TARGETS.forEach((t) => { t.re = new RegExp('^(?:the )?(?:' + t.rx + ')(?: page| engine| enjin)?$'); });
/* Wonder Window's windows register their own words (play.js), so new windows are opened by name too. */
const SCENES = [];
export function registerScenes(list) {
  list.forEach((s) => {
    const words = [s.name].concat(s.words || []).map((w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const i = SCENES.findIndex((x) => x.id === s.id);
    const item = { id: s.id, name: s.name, re: new RegExp('^(?:the )?(?:' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?: window| scene)?$') };
    if (i >= 0) SCENES[i] = item; else SCENES.push(item);
  });
}

/* ---------------- understanding the words ---------------- */
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, a: 1, an: 1, half: 0.5,
  satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9, sepuluh: 10 };
const num = (w) => (/^\d+(?:\.\d+)?$/.test(w) ? Number(w) : NUM[w] || 0);
export const lc = (t) => String(t || '').toLowerCase().replace(/[’`]/g, '\'').replace(/[^\p{L}\p{N}' :]+/gu, ' ').replace(/\s+/g, ' ').trim();
const NAV_WORDS = ['open', 'open up', 'see', 'go', 'go to', 'go back', 'go back to', 'back to', 'return to', 'show', 'show me', 'show us', 'take me to', 'take us to', 'start', 'launch', 'switch to', 'bring up', 'let\'s see', 'lets see', 'let\'s go to', 'lets go to', 'buka', 'pergi ke', 'kembali ke', 'tunjuk', 'tunjukkan'];
const NAV = new RegExp('^(?:' + NAV_WORDS.slice().sort((a, b) => b.length - a.length).join('|') + ')(?: the)? (.+)$');
const POLITE = /^(?:(?:hey |ok |okay |so |now |right |um |uh )*(?:symphony )?(?:(?:can|could|would|will) you (?:please )?|please |could we |can we |let's |lets |i want to |i'd like to |tolong |boleh (?:awak |kamu |anda )?|sila )*)/;
export function parseCommand(text) {
  const raw = String(text || '').trim();
  let t = lc(raw).replace(POLITE, '').replace(/(?: please| now| for me| thank you| thanks| tolong| ya)+$/, '').trim();
  if (!t || t.split(' ').length > 16) return null;
  let m;
  if (/^(?:stop|stop talking|be quiet|quiet|quiet please|shh+|hush|that's enough|thats enough|enough|cancel|never mind|nevermind|diam|berhenti|senyap)$/.test(t)) return { k: 'hush' };
  if (/^(?:stop listening|go to sleep|sleep|turn off hey symphony|switch off hey symphony|goodnight|good night|good bye|goodbye|bye|tidur|berhenti mendengar|selamat tinggal)$/.test(t)) return { k: 'sleep' };
  if (/^(?:next|next slide|next screen|next one|next page|go on|carry on|move on|forward|go forward|seterusnya|slaid seterusnya|skrin seterusnya)$/.test(t)) return { k: 'key', key: 'ArrowRight', say: 'next' };
  if (/^(?:previous|previous slide|previous screen|back|go back|go back one|back one|last slide|the slide before|sebelumnya|slaid sebelumnya|kembali)$/.test(t)) return { k: 'key', key: 'ArrowLeft', say: 'back' };
  if ((m = /^(?:go to |show |open |jump to |pergi ke |buka )?(?:slide|screen|page|slaid|skrin)(?: number| nombor)? (\d{1,2}|[a-z]+)$/.exec(t)) && num(m[1]) >= 1) return { k: 'goto', n: Math.round(num(m[1])) };
  if (/^(?:reveal|reveal it|reveal (?:the )?answers?|show (?:me |us )?(?:the )?answers?|what's the answer|whats the answer|show the next step|next step|tunjuk jawapan|dedahkan)$/.test(t)) return { k: 'key', key: 'r', say: 'reveal' };
  if (/^(?:show |hide |open |close )?(?:the |my )?(?:teacher |teacher's )?notes$/.test(t)) return { k: 'key', key: 'n', say: 'notes' };
  if (/^(?:start |open |show )?(?:the )?(?:class feedback|feedback|exit ticket|feedback faces)$/.test(t)) return { k: 'key', key: 'c', say: 'feedback' };
  if (/^(?:show |open )?(?:the )?(?:join|join code|join screen|qr|qr code|code to join)$|^let (?:the )?(?:children|pupils|class|kids) join$/.test(t)) return { k: 'key', key: 'j', say: 'join' };
  if (/^(?:start |turn on )?(?:drawing|draw|the pen|pen)$/.test(t)) return { k: 'key', key: 'd', say: 'draw' };
  if (/^(?:start presenting|present|present it|present this|present the lesson|present this lesson|show (?:this|it) to the class|mula membentang|bentangkan)$/.test(t)) return { k: 'present' };
  if (/^(?:stop presenting|end (?:the )?presentation|close (?:the )?presentation|exit (?:the )?presentation|exit|keluar)$/.test(t)) return { k: 'close', what: 'present' };
  if (/^(?:close|close (?:this|it|that|the window|the chat|this window)|shut (?:it|this)|tutup|tutup ini)$/.test(t)) return { k: 'close' };
  if ((m = /^(?:start |set |begin )?(?:a |an )?(?:timer|countdown|pemasa)(?: for| of)? ([\w.]+) (minutes?|mins?|seconds?|secs?|minit|saat)$/.exec(t)) || (m = /^(?:start |set )?(?:a |an )?([\w.]+)[ -](minutes?|mins?|seconds?|secs?|minit|saat)(?: timer| countdown)$/.exec(t))) {
    const n = num(m[1]), secs = /^(?:sec|saat)/.test(m[2]) ? n : n * 60;
    if (secs >= 5 && secs <= 3600) return { k: 'timer', secs: Math.round(secs) };
  }
  if (/^(?:stop|cancel|clear|end) (?:the )?(?:timer|countdown)$/.test(t)) return { k: 'timer', secs: 0 };
  if ((m = /^(?:remember|save|add|store|keep|ingat|simpan|tambah)(?: our| my| the| these| this)? (?:class|class list|pupils|children|kids|names|students|kelas|murid|nama)(?: names?| list)?(?: is| are| as)?[: ]+(.+)$/.exec(t))) {
    const at = raw.toLowerCase().indexOf(m[1].split(' ')[0]);
    return { k: 'names', names: namesIn(at >= 0 ? raw.slice(at) : m[1]) };
  }
  if (/^(?:pick|choose|select) (?:someone|somebody|a name|a pupil|a child|a person|a student|one|a kid|a learner)|^who(?:'s| is) (?:next|going next|turn)|^whose turn|^pilih (?:seorang|nama|murid|sesiapa)|^siapa seterusnya/.test(t)) return { k: 'pick' };
  if (/^(?:who(?:'s| is) in|read|list|say|tell me) (?:our|my|the) (?:class|names|class list|pupils)|^how many (?:pupils|children|names|kids|students)|^siapa (?:dalam )?kelas kita/.test(t)) return { k: 'list' };
  if (/^(?:forget|clear|delete|remove) (?:our|my|the|all the) (?:class|names|class list|pupils' names|pupils)$|^(?:padam|lupakan) (?:nama|kelas)/.test(t)) return { k: 'forget' };
  if (/^(?:read|read out|read aloud|say) (?:this|the) (?:slide|screen|page)|^what(?:'s| is) on (?:this|the) (?:slide|screen)|^baca (?:slaid|skrin)/.test(t)) return { k: 'read' };
  if (/^(?:what(?:'s| is) the time|what time is it|the time|pukul berapa(?: sekarang)?)$/.test(t)) return { k: 'time' };
  if ((m = /^(?:make|create|plan|build|buat|cipta)(?: me| us)? (?:a |an |some )?(?:new )?(lesson pack|lesson|pack|slides|slide deck|slideshow|presentation|pelajaran|slaid)(?: about| on| for| tentang| mengenai)? (.{2,80})$/.exec(t))) return { k: 'make', slides: /slide|presentation/.test(m[1]), topic: m[2] };
  // "open Wonder Window", "show me the northern lights", or just the name of a page or window (longest words first,
  // so "show me Tokyo" is not read as "show" + "me Tokyo")
  const nav = NAV.exec(t);
  const want = (nav ? nav[1] : t).replace(/^(?:the|a|an) /, '').trim();
  const sc = SCENES.find((s) => s.re.test(want));
  if (sc) return { k: 'scene', id: sc.id, name: sc.name };
  const tg = TARGETS.find((x) => x.re.test(want));
  if (tg) return { k: 'go', target: tg };
  return null;
}

/* ---------------- doing it ---------------- */
const PRESENT_BTN = { lkie: '#lk-actions [data-lk="present"]', slides: '#a-present' };
function press(key) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}
function gotoSlide(n) {
  const p = presenting();
  if (!p) return false;
  const want = Math.max(1, Math.min(p.n, n));
  let steps = want - p.i;
  const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
  steps = Math.abs(steps);
  for (let i = 0; i < steps; i++) press(key);
  return want;
}
function closeSomething() {
  const mo = $('.mo:not([hidden])'), lp = $('.livep:not([hidden])'), tk = $('.ticket:not([hidden])'), pick = $('.pick:not([hidden])');
  if (pick || mo || lp || tk) { press('Escape'); if (pick) pick.hidden = true; return 'that'; }
  if (presenting()) { press('Escape'); return 'present'; }
  if (page() === 'play') { location.hash = '#/'; return 'Wonder Window'; }
  if (page() !== 'home') { location.hash = '#/'; return 'page'; }
  return '';
}
/* ---------------- a timer anyone can start by voice ---------------- */
let timerEl = null, timerT = 0, timerEnd = 0;
const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function setTimer(secs, ms) {
  clearInterval(timerT);
  if (!secs) { if (timerEl) timerEl.hidden = true; return; }
  if (!timerEl) {
    timerEl = document.createElement('div');
    timerEl.className = 'sym-timer'; timerEl.hidden = true; timerEl.setAttribute('role', 'timer');
    timerEl.innerHTML = '<span class="st-i">' + icon('clock') + '</span><b class="st-t"></b><button type="button" class="st-x" aria-label="Stop the timer">' + icon('close') + '</button>';
    timerEl.querySelector('.st-x').addEventListener('click', () => setTimer(0));
    document.body.appendChild(timerEl);
  }
  timerEnd = Date.now() + secs * 1000;
  timerEl.hidden = false; timerEl.classList.remove('done');
  const tick = () => {
    const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
    timerEl.querySelector('.st-t').textContent = left ? mmss(left) : (ms ? 'Masa tamat!' : 'Time is up!');
    timerEl.classList.toggle('low', left > 0 && left <= 10);
    if (!left) {
      clearInterval(timerT); timerEl.classList.add('done'); sfx('chime');
      if (settings.voice) Voice.say(ms ? 'Masa sudah tamat!' : 'Time is up!', { lang: ms ? 'ms' : 'en-GB' });
      setTimeout(() => { if (timerEl.classList.contains('done')) timerEl.hidden = true; }, 12000);
    }
  };
  tick();
  timerT = setInterval(tick, 250);
}
function fillTopic(sel, topic) {
  const inp = $(sel);
  if (!inp) return false;
  inp.value = topic.charAt(0).toUpperCase() + topic.slice(1);
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.focus({ preventScroll: false });
  return true;
}
const say2 = (ms, en, my) => (ms ? my : en);
/* Runs a command; returns what Symphony says about it. */
export function runCommand(c, lang) {
  const ms = lang === 'ms';
  switch (c.k) {
    case 'hush': Voice.stop(); return { text: '', silent: true };
    case 'sleep': settings.wake = false; return { text: say2(ms, 'Okay. I have stopped listening for my name. Tap the mic or switch Hey Symphony on when you need me.', 'Baiklah. Saya berhenti mendengar nama saya. Tekan mikrofon apabila anda memerlukan saya.') };
    case 'key': {
      const p = presenting();
      if (!p) return { text: say2(ms, 'Start presenting first, then I can do that. Say “present”.', 'Mulakan pembentangan dahulu. Sebut “present”.') };
      press(c.key);
      const done = { next: ['Next.', 'Seterusnya.'], back: ['Back one.', 'Kembali.'], reveal: ['Here it is.', 'Ini dia.'], notes: ['Your notes.', 'Nota anda.'], feedback: ['Class feedback.', 'Maklum balas kelas.'], join: ['Here is how to join.', 'Ini cara untuk sertai.'], draw: ['Drawing is on.', 'Lukisan dihidupkan.'] }[c.say] || ['Done.', 'Siap.'];
      return { text: done[ms ? 1 : 0], short: true };
    }
    case 'goto': { const n = gotoSlide(c.n); return n ? { text: say2(ms, 'Slide ' + n + '.', 'Slaid ' + n + '.'), short: true } : { text: say2(ms, 'Start presenting first, then say which slide.', 'Mulakan pembentangan dahulu.') }; }
    case 'present': {
      if (presenting()) return { text: say2(ms, 'We are presenting already.', 'Kita sedang membentang.'), short: true };
      const sel = PRESENT_BTN[page()] || '#view-engine [data-act="present"]', b = $(sel);
      if (b && !b.closest('[hidden]') && !b.disabled) { b.click(); return { text: say2(ms, 'Here we go.', 'Mari kita mulakan.'), short: true }; }
      return { text: say2(ms, 'Open a lesson first, then say “present”.', 'Buka pelajaran dahulu, kemudian sebut “present”.') };
    }
    case 'close': {
      const what = closeSomething();
      return what ? { text: say2(ms, 'Closed.', 'Ditutup.'), short: true } : { text: say2(ms, 'There is nothing open to close.', 'Tiada apa-apa untuk ditutup.'), short: true };
    }
    case 'timer':
      setTimer(c.secs, ms);
      return c.secs ? { text: say2(ms, 'Timer started: ' + (c.secs >= 60 ? (c.secs / 60) + (c.secs === 60 ? ' minute.' : ' minutes.') : c.secs + ' seconds.'), 'Pemasa dimulakan: ' + (c.secs >= 60 ? (c.secs / 60) + ' minit.' : c.secs + ' saat.')), short: true } : { text: say2(ms, 'Timer stopped.', 'Pemasa dihentikan.'), short: true };
    case 'names': {
      if (!c.names.length) return { text: say2(ms, 'Tell me the first names, for example: remember our class, Aisyah, Wei Jie and Priya.', 'Beritahu saya nama pertama, contohnya: ingat kelas kita, Aisyah, Wei Jie dan Priya.') };
      const added = addPupils(c.names), all = pupils().length;
      return { text: added.length ? say2(ms, 'I will remember ' + added.join(', ') + '. Our class now has ' + all + (all === 1 ? ' name' : ' names') + ', kept on this device only.', 'Saya akan ingat ' + added.join(', ') + '. Kelas kita kini ada ' + all + ' nama, disimpan pada peranti ini sahaja.') : say2(ms, 'I know those names already.', 'Saya sudah tahu nama-nama itu.') };
    }
    case 'pick': {
      if (!pupils().length) return { text: say2(ms, 'I do not know your class yet. Say: remember our class, then the first names. Or tap Our class in my panel.', 'Saya belum kenal kelas anda. Sebut: ingat kelas kita, kemudian nama-nama pertama.') };
      showPick(lang);
      return { text: '', silent: true };
    }
    case 'list': {
      const l = pupils();
      if (!l.length) return { text: say2(ms, 'I do not know your class yet. Say: remember our class, then the first names.', 'Saya belum kenal kelas anda.') };
      return { text: say2(ms, 'Our class has ' + l.length + (l.length === 1 ? ' name: ' : ' names: ') + l.join(', ') + '.', 'Kelas kita ada ' + l.length + ' nama: ' + l.join(', ') + '.') };
    }
    case 'forget': clearPupils(); return { text: say2(ms, 'Done. I have forgotten the class list on this device.', 'Siap. Saya sudah lupakan senarai kelas pada peranti ini.') };
    case 'read': {
      const p = presenting();
      if (!p || !p.text) return { text: say2(ms, 'Start presenting first, then I can read the slide.', 'Mulakan pembentangan dahulu.') };
      return { text: p.text.replace(/\b\d+ \/ \d+\b/g, '').replace(/\s+/g, ' ').trim() };
    }
    case 'time': return { text: say2(ms, 'It is ' + new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }) + '.', 'Sekarang pukul ' + new Date().toLocaleTimeString('ms-MY', { hour: 'numeric', minute: '2-digit' }) + '.'), short: true };
    case 'make': {
      const topic = c.topic.replace(/[.?!]+$/, '').trim();
      location.hash = c.slides ? '#/slides' : '#/lkie';
      setTimeout(() => fillTopic(c.slides ? '#f-topic' : '#lk-topic', topic), c.slides ? 300 : 900);
      return { text: say2(ms, 'I have written “' + topic + '” as the topic. Check the year group, then press ' + (c.slides ? 'Make my slides.' : 'Make my lesson pack.'), 'Saya sudah tulis “' + topic + '” sebagai topik. Semak tahun, kemudian tekan butang Make.') };
    }
    case 'scene': location.hash = '#/play/' + c.id; bus.emit('play-scene', c.id); return { text: say2(ms, 'Opening ' + c.name + '.', 'Membuka ' + c.name + '.'), short: true };
    case 'go': {
      if (presenting()) press('Escape');
      location.hash = c.target.hash;
      return { text: say2(ms, 'Opening ' + c.target.name + '.', 'Membuka ' + c.target.name_ms + '.'), short: true };
    }
    default: return null;
  }
}
/* For Symphony's instructions: what she can do by herself. */
export const COMMANDS_HELP = 'Teachers can also ask you to do things, and the site does them straight away: open a page (home, lkie.like, Slide Studio, Wonder Window or any engine) or a Wonder Window window, start or stop presenting, next slide, previous slide, go to slide 5, reveal the answers, notes, the join code, drawing, class feedback, a timer, remember our class (first names, kept on the device), pick someone fairly, read this slide, and fill in a topic for a new lesson. If they ask how, tell them to say, for example, "Hey Symphony, next slide".';
export const escText = esc;
