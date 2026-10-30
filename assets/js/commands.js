/* What Symphony does herself, on this device, with no engine call: open and close parts of the site and Wonder
   Window's windows, start a live class (with the lesson on now in the calendar), say what is on today and what is
   next, move through a presentation (next, back, slide 5, reveal, notes, join code, draw, class feedback), a timer,
   our class's names (remember, pick someone fairly, read them, forget them), read the slide, the time, and opening a
   maker (lesson, worksheet, quiz or game) with the topic filled in so the teacher can press Make. Commands are matched
   in English and Malay; anything else is a question for her to answer. */
import { $, $$, esc, icon, bus } from './core.js?v=cdc164df';
import { timesUp } from './fx/timesup.js?v=cdc164df';
import { ENGINES } from './engines/registry.js?v=cdc164df';
import { pupils, namesIn, addPupils, clearPupils, showPick } from './pupils.js?v=cdc164df';
import { presenting, page } from './context.js?v=cdc164df';
import { sfx } from './fx/audio.js?v=cdc164df';
import { Voice } from './fx/voice.js?v=cdc164df';
import { settings } from './settings.js?v=cdc164df';
import { isAdmin } from './people.js?v=cdc164df';
import { startMaking, startClass, subjectName, guessSubject, soon } from './library.js?v=cdc164df';
import { store } from './core.js?v=cdc164df';

/* ---------------- where she can take you ---------------- */
const ENGINE_WORDS = { maths: 'maths reasoning|maths|math reasoning|math|which one doesn\'t belong|open middle', story: 'story spark|story|stories|creative writing', reading: 'reading ladder|reading|reading comprehension',
  science: 'science mystery|science|mystery', sound: 'sound journey|sound|sounds|journey', code: 'unplugged code|code|coding|robot|the robot|programming', steps: 'step by step|steps|step-by-step',
  escape: 'escape room|escape|the escape room', break: 'brain break|break|calm down|breathing', debate: 'big debate|debate|the debate' };
const TARGETS = [
  { id: 'home', hash: '#/today', name: 'Today', name_ms: 'Hari ini', rx: 'home|home page|homepage|the home page|main page|start page|today|today page|today s page|todays page|my day|dashboard|my dashboard|our dashboard|your lessons|my lessons|our lessons|laman utama|hari ini' },
  { id: 'calendar', hash: '#/calendar', name: 'the calendar', name_ms: 'kalendar', rx: 'calendar|my calendar|our calendar|calender|my calender|timetable|my timetable|our timetable|schedule|my schedule|planner|my planner|my week|this week|week|kalendar|kalendar saya|jadual|jadual waktu|jadual saya' },
  { id: 'subjects', hash: '#/subjects', name: 'My subjects', name_ms: 'Subjek saya', rx: 'my subjects|subjects|subject folders|folders|my folders|my files|files|library|my library|saved|saved lessons|my saved lessons|my stuff|my work|subjek|subjek saya|folder saya' },
  { id: 'create', hash: '#/create', name: 'Create', name_ms: 'Cipta', rx: 'create|create page|makers|the makers|maker|cipta' },
  { id: 'worksheet', hash: '#/worksheet', name: 'the Worksheet maker', name_ms: 'pembuat lembaran kerja', rx: 'worksheet maker|the worksheet maker|worksheets|my worksheets|worksheet page|pembuat lembaran kerja' },
  { id: 'quiz', hash: '#/quiz', name: 'the Quiz maker', name_ms: 'pembuat kuiz', rx: 'quiz maker|the quiz maker|quizzes|my quizzes|quiz page|board game|the board game|team quiz|pembuat kuiz' },
  { id: 'game', hash: '#/game', name: 'the Game maker', name_ms: 'pembuat permainan', rx: 'game maker|the game maker|games|my games|game page|pembuat permainan' },
  { id: 'starters', hash: '#/create/starters', name: 'the lesson starters', name_ms: 'pembuka pelajaran', rx: 'starters|lesson starters|starter|engines|lesson engines|all the engines|all engines|enjin' },
  { id: 'class', hash: '#/class', name: 'the Classroom', name_ms: 'Bilik darjah', rx: 'classroom|my classroom|class|live class|live classroom|class session|bilik darjah|kelas langsung' },
  { id: 'tools', hash: '#/tools', name: 'Class tools', name_ms: 'Alat kelas', rx: 'class tools|classroom tools|classroom management|class management|tools|toolbox|tool box|my tools|alat|alat kelas' },
  { id: 'explore', hash: '#/explore', name: 'Explore', name_ms: 'Teroka', rx: 'explore|explore page|teroka' },
  { id: 'settings', hash: '#/settings', name: 'Settings', name_ms: 'Tetapan', rx: 'settings|setting|my settings|preferences|reading support|reading settings|dyslexia settings|dyslexia font|dyslexic font|font settings|tetapan' },
  { id: 'help', hash: '#/help', name: 'Help', name_ms: 'Bantuan', rx: 'help|help page|guides|how to guides|bantuan' },
  { id: 'lkie', hash: '#/lkie', name: 'lkie.like', name_ms: 'lkie.like', rx: 'l ?kie ?like|lkie|lkielike|l k i e like|likey like|likee like|lickey like|licky like|lucky like|like like|lk like|lesson pack|lesson packs|the pack maker|pack maker' },
  { id: 'slides', hash: '#/slides', name: 'Slide Studio', name_ms: 'Slide Studio', rx: 'slide studio|slides studio|the slide studio|slide maker|slides|slide' },
  { id: 'play', hash: '#/play', name: 'Wonder Window', name_ms: 'Wonder Window', rx: 'wonder window|wonder windows|the wonder window|play area|the play area|tingkap ajaib' },
  { id: 'admin', hash: '#/admin', name: 'the dashboard', name_ms: 'papan pemuka', rx: 'admin|the admin|admin dashboard|reports?|the reports?|rabinder s dashboard|rabinders dashboard|papan pemuka' }
].concat(ENGINES.map((e) => ({ id: e.id, hash: '#/' + e.id, name: e.name, name_ms: e.name, rx: ENGINE_WORDS[e.id] || e.name.toLowerCase() })));
TARGETS.forEach((t) => { t.re = new RegExp('^(?:the )?(?:' + t.rx + ')(?: page| engine| enjin)?$'); });
/* Everyday words that open a page only after "open", "go to" and the like, so a question such as "help" or "tools"
   on its own still goes to Symphony. */
const NAV_ONLY = /^(?:the )?(?:help|class|tools|create|maker|makers|week|files|saved|starter|setting|schedule|alat|kelas|cipta|bantuan|enjin)$/;
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
  if (/^(?:what(?:'s| is| s)|whats) (?:next|on next|coming next|up next|my next (?:lesson|class)|the next (?:lesson|class)|next (?:in|on) (?:my|the) (?:calendar|timetable|day))(?: today)?$|^(?:what|which) (?:lesson|class) is (?:next|now|on now)$|^(?:what am i|what are we|what do i) (?:teaching|have) (?:next|now)$|^(?:when is|when's|whens) my next (?:lesson|class)$|^now and next$|^(?:apa|kelas apa|pelajaran apa) (?:seterusnya|sekarang|selepas ini)$/.test(t)) return { k: 'next' };
  if (/^(?:what(?:'s| is| s)|whats) (?:on )?(?:today|my day|on my calendar|on my calendar today|in my calendar today|my timetable(?: today)?|today s timetable|todays timetable|my schedule(?: today)?|today s schedule|todays schedule|the plan for today|my plan for today)$|^(?:what do i have|what have i got|what am i teaching|what are we doing|what lessons do i have|what classes do i have|how many lessons do i have)(?: on)? today$|^(?:read|tell me|say) (?:my|today s|todays) (?:day|timetable|schedule|calendar)$|^(?:my day|today s lessons|todays lessons|my lessons today)$|^(?:apa jadual|jadual) (?:saya )?hari ini$|^apa (?:kelas|pelajaran) (?:saya )?hari ini$/.test(t)) return { k: 'day' };
  if (/^(?:start|begin|run|launch|mula|mulakan)(?: up)? (?:a |the |my |our )?(?:live )?(?:class|lesson live|live lesson|class session|classroom session|kelas)(?: now| live)?$|^(?:go|let's go|lets go) live$|^(?:mula|mulakan) kelas(?: sekarang)?$/.test(t)) return { k: 'startclass' };
  if ((m = /^(?:make|create|build|write|set|draft|buat|cipta|tulis|sediakan)(?: me| us)? (?:a |an |some )?(?:new |quick |short |fun )?(worksheets?|work sheets?|sheet|activity sheet|quiz|quizzes|quiz game|test|game|games|class game|lembaran kerja|kuiz|permainan)(?:(?: about| on| for| of| tentang| mengenai)? (.{2,80}))?$/.exec(t))) {
    const kind = /quiz|test|kuiz/.test(m[1]) ? 'quiz' : /game|permainan/.test(m[1]) ? 'game' : 'sheet';
    return { k: 'maker', kind, topic: (m[2] || '').replace(/^(?:the )/, '') };
  }
  if ((m = /^(?:make|create|plan|build|buat|cipta)(?: me| us)? (?:a |an |some )?(?:new )?(lesson pack|lesson|pack|slides|slide deck|slideshow|presentation|pelajaran|slaid)(?: about| on| for| tentang| mengenai)? (.{2,80})$/.exec(t))) return { k: 'make', slides: /slide|presentation/.test(m[1]), topic: m[2] };
  // "open Wonder Window", "show me the northern lights", or just the name of a page or window (longest words first,
  // so "show me Tokyo" is not read as "show" + "me Tokyo")
  const nav = NAV.exec(t);
  const want = (nav ? nav[1] : t).replace(/^(?:the|a|an) /, '').trim();
  const sc = SCENES.find((s) => s.re.test(want));
  if (sc) return { k: 'scene', id: sc.id, name: sc.name };
  if (!nav && NAV_ONLY.test(want)) return null;
  const tg = TARGETS.find((x) => x.re.test(want));
  if (tg) return { k: 'go', target: tg, word: want };
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
  if (page() !== 'home' && page() !== 'today') { location.hash = '#/'; return 'page'; }
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
      clearInterval(timerT); timerEl.classList.add('done'); timesUp({ voice: false });
      if (settings.voice) Voice.say(ms ? 'Masa sudah tamat!' : 'Time is up!', { lang: ms ? 'ms' : 'en-GB' });
      setTimeout(() => { if (timerEl.classList.contains('done')) timerEl.hidden = true; }, 12000);
    }
  };
  tick();
  timerT = setInterval(tick, 250);
}
/* Symphony's timer and name picker are the Class tools' own (one timer for the whole site, with the teacher's chosen
   loud end sound; one fair picker). The small timer above is kept only for a device where the tools cannot load. */
const presentHost = () => document.querySelector('.present:not([hidden]), .spresent:not([hidden])');
async function toolTimer(secs) {
  try {
    if (!secs) { const t = await import('./tools/timer.js?v=cdc164df'); if (typeof t.reset !== 'function') return false; t.reset(); setTimer(0); return true; }
    const m = await import('./tools/tools.js?v=cdc164df');
    if (typeof m.startTimer !== 'function') return false;
    const host = presentHost();
    m.startTimer(secs, { host, panel: !!host });
    setTimer(0);
    return true;
  } catch (e) { return false; }
}
async function toolPick(lang) {
  try {
    const m = await import('./tools/tools.js?v=cdc164df');
    if (typeof m.pickName !== 'function') throw new Error('no picker');
    return await m.pickName({ host: presentHost() || undefined });
  } catch (e) {
    if (!pupils().length) return '';
    showPick(lang);
    return 'shown';
  }
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

/* ---------------- the calendar: what is on, what is next, and starting the class on now ---------------- */
let calP = null;
const loadCal = () => (calP = calP || import('./calendar.js?v=cdc164df').catch(() => { calP = null; return null; }));
const toMins = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
const t12 = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); if (!m) return ''; const h = Number(m[1]); return (((h + 11) % 12) + 1) + ':' + m[2] + (h < 12 ? ' am' : ' pm'); };
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function dayWords(date, ms) {
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (date === ymd(t)) return ms ? 'esok' : 'tomorrow';
  const [y, mo, d] = String(date || '').split('-').map(Number);
  if (!y) return '';
  return (ms ? 'pada hari ' : 'on ') + new Date(y, mo - 1, d).toLocaleDateString(ms ? 'ms-MY' : 'en-GB', { weekday: 'long' });
}
const isReady = (x) => !!(x && (x.ready || (x.plan && Array.isArray(x.plan.items) && x.plan.items.length)));
function lessonWords(x) {
  if (!x) return '';
  if (x.kind === 'event') return x.title || '';
  return (x.year ? x.year + ' ' : '') + subjectName(x.subject || 'general', true) + (x.cls ? ' (' + x.cls + ')' : '') + (x.plan && x.plan.topic ? ', ' + x.plan.topic : '');
}
const noLessons = (ms) => say2(ms, 'Your calendar has no lessons yet. Add your lessons once on the Calendar page, and I can tell you what is on and what is next.', 'Kalendar anda belum ada kelas. Tambah kelas anda sekali di halaman Kalendar, dan saya boleh beritahu apa yang seterusnya.');
async function dayText(ms) {
  const cal = await loadCal();
  if (!cal || typeof cal.todayText !== 'function') return noLessons(ms);
  try { return cal.todayText(ms ? 'ms' : 'en') || noLessons(ms); } catch (e) { return noLessons(ms); }
}
async function nextText(ms) {
  const cal = await loadCal();
  if (!cal || typeof cal.nowNext !== 'function' || (typeof cal.hasTimetable === 'function' && !cal.hasTimetable())) return noLessons(ms);
  let nn = {};
  try { nn = cal.nowNext(new Date()) || {}; } catch (e) { nn = {}; }
  const out = [];
  if (nn.now) out.push(say2(ms, 'Now: ' + lessonWords(nn.now) + (nn.now.end ? ', until ' + t12(nn.now.end) : '') + '.', 'Sekarang: ' + lessonWords(nn.now) + (nn.now.end ? ', sehingga ' + t12(nn.now.end) : '') + '.'));
  let nx = nn.next, when = '';
  if (!nx && typeof cal.upcoming === 'function') {
    const today = ymd(new Date());
    try { nx = (cal.upcoming(10) || []).find((x) => x.kind === 'lesson' && x.date !== today) || null; } catch (e) { nx = null; }
    when = nx ? dayWords(nx.date, ms) : '';
  }
  if (nx) {
    const ready = nx.kind === 'lesson' ? (isReady(nx) ? say2(ms, ' The lesson is ready.', ' Pelajaran sudah sedia.') : say2(ms, ' Nothing is made for it yet.', ' Belum ada pelajaran untuknya.')) : '';
    out.push(say2(ms, 'Next: ' + lessonWords(nx) + ', ' + (when ? when + ' ' : '') + 'at ' + t12(nx.start) + '.', 'Seterusnya: ' + lessonWords(nx) + ', ' + (when ? when + ' ' : '') + 'pukul ' + t12(nx.start) + '.') + ready);
  } else if (!nn.now) out.push(say2(ms, 'There is nothing in your calendar for the rest of the week.', 'Tiada apa-apa dalam kalendar anda untuk minggu ini.'));
  return out.join(' ');
}
async function classNow(ms) {
  if (soon('class')) return say2(ms, 'The Classroom comes in the next update. For now, start presenting and press Join, and pupils can answer on their devices.', 'Bilik darjah akan datang dalam kemas kini seterusnya. Buat masa ini, mulakan pembentangan dan tekan Join.');
  try {
    const t = await import('./live/tasks.js?v=cdc164df');
    if (t && typeof t.classOn === 'function' && t.classOn()) { location.hash = '#/class'; return say2(ms, 'Your class is running. Here it is.', 'Kelas anda sedang berjalan. Ini dia.'); }
  } catch (e) { /* the Classroom is not on this device yet */ }
  let o = {};
  const cal = await loadCal();
  try {
    const nn = cal && typeof cal.nowNext === 'function' ? cal.nowNext(new Date()) || {} : {};
    const d = new Date(), mins = d.getHours() * 60 + d.getMinutes();
    const x = nn.now && nn.now.kind === 'lesson' ? nn.now : nn.next && nn.next.kind === 'lesson' && toMins(nn.next.start) - mins <= 15 ? nn.next : null;
    if (x) {
      const topic = x.plan && x.plan.topic ? x.plan.topic : '';
      o = { title: (topic || subjectName(x.subject || 'general')) + (x.cls ? ' · ' + x.cls : ''), subject: x.subject || '', year: x.year || '', date: x.date || '', slot: x.slotId || '', items: isReady(x) ? x.plan.items.slice() : [] };
    }
  } catch (e) { o = {}; }
  if (presenting()) press('Escape');
  startClass(o);
  return o.title ? say2(ms, 'Starting your class: ' + o.title + '. Pupils can join with the code on the screen.', 'Memulakan kelas anda: ' + o.title + '. Murid boleh sertai dengan kod pada skrin.') : say2(ms, 'Opening the Classroom. Press Start when you are ready.', 'Membuka Bilik darjah. Tekan Start apabila anda sedia.');
}
const MAKER_NAMES = { sheet: ['worksheet', 'lembaran kerja'], quiz: ['quiz', 'kuiz'], game: ['game', 'permainan'], slides: ['lesson', 'pelajaran'] };
function openMaker(kind, topic, ms) {
  const f = store.getJSON('ks2-engine.today.form.v1', {}) || {};
  topic = String(topic || '').replace(/[.?!]+$/, '').trim();
  const o = { kind, from: 'symphony' };
  if (topic) o.topic = topic.charAt(0).toUpperCase() + topic.slice(1);
  if (f.year) o.year = f.year;
  const subject = topic ? guessSubject(topic, f.year) : '';
  if (subject) o.subject = subject;
  if (presenting()) press('Escape');
  startMaking(o);
  const n = MAKER_NAMES[kind] || MAKER_NAMES.sheet;
  if (!topic) return say2(ms, 'Here is the ' + n[0] + ' maker. Type a topic, or tell me one.', 'Ini pembuat ' + n[1] + '. Taip topik, atau beritahu saya.');
  return say2(ms, 'I have written “' + o.topic + '” as the topic' + (subject ? ', in ' + subjectName(subject, true) : '') + '. Check the year group, then press Make.', 'Saya sudah tulis “' + o.topic + '” sebagai topik. Semak tahun, kemudian tekan Make.');
}
/* Runs a command; returns what Symphony says about it (a promise for the ones that look in the calendar). */
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
      return toolTimer(c.secs).then((ok) => {
        if (!ok) setTimer(c.secs, ms);
        return c.secs ? { text: say2(ms, 'Timer started: ' + (c.secs >= 60 ? (c.secs / 60) + (c.secs === 60 ? ' minute.' : ' minutes.') : c.secs + ' seconds.'), 'Pemasa dimulakan: ' + (c.secs >= 60 ? (c.secs / 60) + ' minit.' : c.secs + ' saat.')), short: true } : { text: say2(ms, 'Timer stopped.', 'Pemasa dihentikan.'), short: true };
      });
    case 'names': {
      if (!c.names.length) return { text: say2(ms, 'Tell me the first names, for example: remember our class, Aisyah, Wei Jie and Priya.', 'Beritahu saya nama pertama, contohnya: ingat kelas kita, Aisyah, Wei Jie dan Priya.') };
      const added = addPupils(c.names), all = pupils().length;
      return { text: added.length ? say2(ms, 'I will remember ' + added.join(', ') + '. Our class now has ' + all + (all === 1 ? ' name' : ' names') + ', kept on this device only.', 'Saya akan ingat ' + added.join(', ') + '. Kelas kita kini ada ' + all + ' nama, disimpan pada peranti ini sahaja.') : say2(ms, 'I know those names already.', 'Saya sudah tahu nama-nama itu.') };
    }
    case 'pick':
      return toolPick(lang).then((name) => (name ? { text: '', silent: true } : { text: say2(ms, 'I do not know your class yet. Say: remember our class, then the first names. Or add them in Settings, under Our class.', 'Saya belum kenal kelas anda. Sebut: ingat kelas kita, kemudian nama-nama pertama.') }));
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
      if (!c.slides) return { text: openMaker('slides', c.topic, ms) };
      const topic = c.topic.replace(/[.?!]+$/, '').trim();
      location.hash = '#/slides';
      setTimeout(() => fillTopic('#f-topic', topic), 300);
      return { text: say2(ms, 'I have written “' + topic + '” as the topic. Check the year group, then press Make my slides.', 'Saya sudah tulis “' + topic + '” sebagai topik. Semak tahun, kemudian tekan butang Make.') };
    }
    case 'maker': return { text: openMaker(c.kind, c.topic, ms) };
    case 'next': return nextText(ms).then((text) => ({ text }));
    case 'day': return dayText(ms).then((text) => ({ text }));
    case 'startclass': return classNow(ms).then((text) => ({ text }));
    case 'scene': location.hash = '#/play/' + c.id; bus.emit('play-scene', c.id); return { text: say2(ms, 'Opening ' + c.name + '.', 'Membuka ' + c.name + '.'), short: true };
    case 'go': {
      if (presenting()) press('Escape');
      // "the dashboard" is Rabinder's dashboard for the admin, and Today for everyone else
      const tg = c.target.id === 'home' && /dashboard/.test(c.word || '') && isAdmin() ? TARGETS.find((x) => x.id === 'admin') : c.target;
      location.hash = tg.hash;
      return { text: say2(ms, 'Opening ' + tg.name + '.', 'Membuka ' + tg.name_ms + '.'), short: true };
    }
    default: return null;
  }
}
/* For Symphony's instructions: what she can do by herself. */
export const COMMANDS_HELP = 'Teachers can also ask you to do things, and the site does them straight away: open a page (Today, the calendar, My subjects, Create, the lesson starters, the Classroom, Class tools, Explore, Wonder Window, Settings, Help, lkie.like, Slide Studio or any lesson engine) or a Wonder Window window; start a live class (with the lesson on now in their calendar); say what is on today and what is next; open a maker with the topic filled in (make a lesson, a worksheet, a quiz or a game about a topic); start or stop presenting, next slide, previous slide, go to slide 5, reveal the answers, notes, the join code, drawing, class feedback; a timer; remember our class (first names, kept on the device), pick someone fairly, read this slide; and the time. If they ask how, tell them to say, for example, "Hey Symphony, what is next?" or "Hey Symphony, make a quiz about fractions".';
export const escText = esc;
