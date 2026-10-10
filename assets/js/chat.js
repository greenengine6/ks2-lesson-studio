/* Symphony, the chat pop-up. Ask anything by typing or speaking (English or Malay); she answers in text and, when
   her voice is on, out loud. Her words also appear one at a time on a bright stage with a blinking marker and an
   underline that fits each word. Tapping the mic opens voice mode: everything else disappears, a glow along the
   bottom of the screen follows your voice while she listens, sweeps while she thinks and follows her words while she
   speaks, and her answer appears word by word as she says it. After she answers she listens again, until the mic is
   tapped or nothing is heard. Questions about her, the site, greetings and language changes are answered on the
   device; everything else needs the device to be connected. */
import { $, $$, esc, el, icon, store, bus, hasKey, askClaude, errorCopy, copyOut, CONFIG, MAIL_WRAP } from './core.js?v=51f31f48';
import { SYMPHONY_ABOUT, MINI } from './fx/symphony.js?v=51f31f48';
import { settings, paintSwitches } from './settings.js?v=51f31f48';
import { isAdmin, ADMIN_NAME } from './people.js?v=51f31f48';
import { briefing, downloadReport } from './admin.js?v=51f31f48';
import { track } from './track.js?v=51f31f48';
import { Voice } from './fx/voice.js?v=51f31f48';
import { Beam } from './fx/beam.js?v=51f31f48';
import { sfx } from './fx/audio.js?v=51f31f48';

const LANG_KEY = 'ks2-engine.symlang.v1';
const T = {
  en: {
    idle: 'Ask me anything', listen: 'Listening…', think: 'Thinking…', speak: 'Speaking…',
    place: 'Type a question, or tap the mic', send: 'Send', mic: 'Speak to Symphony', stopMic: 'Stop listening',
    hello: 'Hello! I am Symphony. Ask me anything, by typing or by tapping the mic. I can brainstorm lessons with you, explain things simply, or tell you about the planets, animals and the natural world.',
    stageHello: 'Hello, I am Symphony',
    hi: 'Hello! It is lovely to hear from you. What would you like to know?',
    site: 'This site has ten lesson engines, a Slide Studio and a Wonder Window play area. Pick an engine from the dock at the bottom, type your topic, and you get a class screen to share plus teacher notes. Press Present to share it on Teams, Zoom or Meet, with a magic pointer, a timer and your notes. You can also switch on Night mode, and collect feedback from your class for a report.',
    toEn: 'Of course. I will speak English. What would you like to know?',
    noKey: 'I can tell you about me and about this site right now. For anything else, this device needs setting up once: open the personal link Rabinder sent you.',
    micDenied: 'Please allow the microphone, then tap the mic again so I can hear you.',
    noMic: 'Speaking to me needs Chrome, Edge or Safari. You can still type your question.',
    noSpeech: 'I did not hear anything. Tap the mic and try again.',
    micNet: 'Voice needs an internet connection. You can type instead.',
    talkHint: 'Tap the mic to talk. She answers out loud, then listens again.',
    vmTap: 'Tap to talk', vmIdle: 'Say anything. I am listening when the glow moves.',
    voiceTrouble: 'This device would not let me speak just then. Tap “Say again” to hear it.',
    copy: 'Copy', again: 'Say again', copied: 'Copied. Paste it anywhere.', newChat: 'New chat',
    chips: [['Who are you?', 'ask'], ['Brainstorm a lesson', 'fill:Brainstorm a fun KS2 lesson about '], ['A fun fact about space', 'ask'], ['Explain fractions to a Year 3 class', 'ask'], ['What can this site do?', 'ask'], ['Cakap Melayu', 'lang:ms']]
  },
  ms: {
    idle: 'Tanya saya apa sahaja', listen: 'Sedang mendengar…', think: 'Sedang berfikir…', speak: 'Sedang bercakap…',
    place: 'Taip soalan, atau tekan mikrofon', send: 'Hantar', mic: 'Bercakap dengan Symphony', stopMic: 'Berhenti mendengar',
    hello: 'Hai! Saya Symphony. Tanyalah apa sahaja, dengan menaip atau menekan mikrofon. Saya boleh membantu merancang pelajaran, menerangkan sesuatu dengan mudah, atau bercerita tentang planet, haiwan dan alam semula jadi.',
    stageHello: 'Hai, saya Symphony',
    hi: 'Hai! Seronok mendengar daripada anda. Apa yang anda ingin tahu?',
    site: 'Laman ini ada sepuluh enjin pelajaran, Slide Studio dan ruang main Wonder Window. Pilih enjin dari dok di bawah, taip topik anda, dan anda akan mendapat skrin kelas serta nota guru. Tekan Present untuk berkongsi di Teams, Zoom atau Meet. Anda juga boleh menghidupkan mod malam dan mengumpul maklum balas kelas untuk laporan.',
    toMs: 'Baiklah, saya akan bercakap dalam bahasa Melayu. Apa yang anda ingin tahu?',
    noKey: 'Saya boleh bercerita tentang diri saya dan laman ini sekarang. Untuk soalan lain, peranti ini perlu disediakan sekali: buka pautan peribadi yang Rabinder hantar kepada anda.',
    micDenied: 'Sila benarkan mikrofon, kemudian tekan mikrofon sekali lagi supaya saya boleh mendengar anda.',
    noMic: 'Untuk bercakap dengan saya, gunakan Chrome, Edge atau Safari. Anda masih boleh menaip soalan.',
    noSpeech: 'Saya tidak dengar apa-apa. Tekan mikrofon dan cuba lagi.',
    micNet: 'Suara memerlukan sambungan internet. Anda boleh menaip.',
    talkHint: 'Tekan mikrofon untuk bercakap. Dia menjawab dengan suara, kemudian mendengar semula.',
    vmTap: 'Tekan untuk bercakap', vmIdle: 'Cakap apa sahaja. Saya mendengar apabila cahaya bergerak.',
    voiceTrouble: 'Peranti ini tidak membenarkan saya bercakap tadi. Tekan “Ulang” untuk mendengarnya.',
    copy: 'Salin', again: 'Ulang', copied: 'Disalin.', newChat: 'Sembang baharu',
    chips: [['Siapa awak?', 'ask'], ['Idea pelajaran', 'fill:Beri idea pelajaran KS2 yang seronok tentang '], ['Fakta menarik tentang angkasa', 'ask'], ['Apa yang laman ini boleh buat?', 'ask'], ['Speak English', 'lang:en']]
  }
};
const RX = {
  toMs: /\b(bahasa melayu|in malay|speak malay|cakap melayu|malay please)\b/i,
  toEn: /\b(in english|speak english|bahasa inggeris|cakap inggeris)\b/i,
  about: /\b(who|what)\s+(are|r)\s+(you|u)\b|\babout (you|yourself|symphony)\b|\byour name\b|\bintroduce yourself\b|\bwhy .*symphony\b|\bsiapa\s+(awak|kamu|anda|nama)\b|\bkenalkan diri\b|^\s*symphony\s*[?!.]*\s*$/i,
  site: /\bwhat can (this|the) (site|website|app|engine) do\b|\bhow (do i|to) use (this|the) (site|website|app)\b|\bapa (yang )?laman ini boleh\b/i,
  hi: /^\s*(hi|hello|hey|hiya|hai|helo|halo|assalamualaikum|selamat (pagi|petang|malam|tengah hari))( symphony)?[\s!.,]*$/i,
  report: /\b(report|reports|download|downloads|export|pdf|csv|spreadsheet|laporan|muat turun)\b/i,
  brief: /\b(briefing|brief me|summary|summarise|summarize|overview|update me|how (are|is|did) (my|the|our) (teachers?|staff|team|week|class(es)?)|how did (we|they|everyone) do|what happened (this|last) week|ringkasan|taklimat)\b/i
};

let lang = store.get(LANG_KEY) === 'ms' ? 'ms' : 'en';
let state = 'idle', busy = null, talk = false, rec = null, opened = false, greeted = false, lastFrom = 'text';
let adminDigest = '', adminSpoken = '', adminLabel = 'last 7 days';
const reportAction = () => ({ label: lang === 'ms' ? 'Muat turun laporan' : 'Download report', icon: 'download', fn: () => downloadReport() });
async function adminGreeting() {
  try { const b = await briefing(); adminDigest = b.digest; adminSpoken = b.spoken; adminLabel = b.label; } catch (e) { adminSpoken = ''; }
  const hello = lang === 'ms' ? 'Hai Admin. Saya sudah sediakan taklimat anda. ' : 'Hello Admin. I have your briefing ready. ';
  reply(hello + (adminSpoken || '') + (lang === 'ms' ? ' Tanya saya apa sahaja tentangnya, atau tekan Muat turun laporan.' : ' Ask me anything about it, or tap Download report.'), { action: reportAction() });
  stageLine(lang === 'ms' ? 'Hai Admin' : 'Hello Admin', 320);
}
const history = [];
let panel, fab, logEl, input, mic, stageWord, stageBar, stageWrap, statusEl, avatar;

/* ---------------- voice out: Symphony's voice (fx/voice.js), one part at a time ---------------- */
let sayGen = 0, lastSay = null, troubled = -1;
function say(text) {
  text = String(text || '').trim();
  if (!text) return;
  const g = sayGen;
  lastSay = Voice.say(text, {
    lang: lang === 'ms' ? 'ms' : 'en-GB', rate: lang === 'ms' ? 0.95 : 1, silent: !settings.voice,
    onStart: () => { if (g === sayGen && state !== 'listen') setState('speak'); },
    onWord: (w) => { if (g === sayGen) { showWord(w); vmWord(w); } },
    onTrouble: () => { if (g === sayGen && troubled !== g) { troubled = g; addMsg('sym', T[lang].voiceTrouble, { muted: true }); } }
  });
}
function hush() { sayGen++; lastSay = null; Voice.stop(); }
/* When the last part has been said: back to idle, and in a spoken conversation, listen again. */
async function afterSpeaking() {
  const g = sayGen, p = lastSay;
  if (p) await p;
  if (g !== sayGen || busy) return;
  setTimeout(() => {
    if (g !== sayGen || busy) return;
    if (state === 'speak') { setState('idle'); showWord(''); }
    if (talk && lastFrom === 'voice' && (vmOn || (panel && !panel.hidden))) listen();
  }, 350);
}

/* ---------------- stage (one word at a time) ---------------- */
function showWord(w) {
  if (!stageWord) return;
  stageWord.textContent = String(w || '').replace(/[“”"()[\]]/g, '').toUpperCase();
  requestAnimationFrame(() => { stageBar.style.width = (stageWord.textContent ? stageWord.offsetWidth + 12 : 28) + 'px'; });
}
function stageLine(text, gap) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let i = 0;
  const step = () => { if (i < words.length) { showWord(words[i++]); setTimeout(step, gap || 260); } else setTimeout(() => { if (state === 'idle') showWord(''); }, 900); };
  step();
}
function setState(s) {
  state = s;
  if (!panel) return;
  panel.dataset.state = s;
  statusEl.textContent = T[lang][s] || T[lang].idle;
  const a = $('.sym', avatar); if (a) a.dataset.state = s === 'think' ? 'think' : s === 'speak' ? 'speak' : s === 'listen' ? 'listen' : 'idle';
  mic.setAttribute('aria-pressed', String(s === 'listen'));
  mic.setAttribute('aria-label', s === 'listen' ? T[lang].stopMic : T[lang].mic);
  if (s === 'think') showWord(lang === 'ms' ? 'Berfikir' : 'Thinking');
  if (s === 'listen') showWord(lang === 'ms' ? 'Mendengar' : 'Listening');
  vmPaint();
}

/* ---------------- voice mode: everything else hidden; her voice, the words and the glow ---------------- */
let vm = null, vmOn = false, vmIdx = 0, vmPulse = 0, vmPulseAt = 0, vmMeter = null;
const vmClean = (x) => String(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function vmLevel() {
  const now = performance.now();
  if (state === 'listen' && vmMeter) return vmMeter.level();
  if (state !== 'listen' && state !== 'speak') return 0;
  const p = Math.max(0, vmPulse - (now - vmPulseAt) / (state === 'speak' ? 420 : 700));
  return state === 'speak' ? p * (0.78 + 0.22 * Math.sin(now / 48)) : p;
}
function vmBuild() {
  if (vm) return;
  vm = el('div', 'vmode');
  vm.id = 'vmode'; vm.hidden = true;
  vm.setAttribute('role', 'dialog'); vm.setAttribute('aria-modal', 'true'); vm.setAttribute('aria-label', 'Talk to Symphony');
  vm.innerHTML = '<div class="vm-top"><span class="vm-ava">' + MINI() + '</span><b>Symphony</b>' +
    '<div class="seg vm-lang" role="group" aria-label="Language"><button type="button" data-vlang="en">English</button><button type="button" data-vlang="ms">Melayu</button></div>' +
    '<button type="button" class="vm-x" aria-label="Close voice mode">' + icon('close') + '</button></div>' +
    '<div class="vm-mid"><p class="vm-heard"></p><p class="vm-said" aria-live="polite"></p></div>' +
    '<div class="vm-foot"><p class="vm-st"></p><button type="button" class="vm-mic"><span class="vm-mic-i"></span></button></div>' +
    '<canvas class="vm-beam" aria-hidden="true"></canvas>';
  document.body.appendChild(vm);
  vm.beam = new Beam($('.vm-beam', vm), { type: 'mobile', level: vmLevel, sensitivity: 1, threshold: 0.03 });
  $('.vm-x', vm).addEventListener('click', vmClose);
  $('.vm-mic', vm).addEventListener('click', () => {
    if (state === 'listen' && rec) { try { rec.stop(); } catch (e) { /* ignore */ } return; }   // done talking: send it
    listen();                                                                                      // talk, or interrupt her
  });
  vm.addEventListener('click', (e) => { const b = e.target.closest('[data-vlang]'); if (b) { setLang(b.dataset.vlang); vmPaint(); } });
  vm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); vmClose(); } });
}
function vmPaint() {
  if (!vm || !vmOn) return;
  vm.dataset.state = state;
  $('.vm-st', vm).textContent = state === 'idle' ? T[lang].vmTap : (T[lang][state] || '');
  const b = $('.vm-mic', vm);
  b.setAttribute('aria-label', state === 'listen' ? T[lang].stopMic : T[lang].mic);
  $('.vm-mic-i', vm).innerHTML = icon(state === 'listen' ? 'stop' : 'mic');
  $$('[data-vlang]', vm).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.vlang === lang)));
  vm.beam.set({ processing: state === 'think' });
}
function vmHeard(t, final) { if (!vm || !vmOn) return; const h = $('.vm-heard', vm); h.textContent = t || ''; h.classList.toggle('final', !!final); }
function vmText(t) {
  if (!vm || !vmOn) return;
  const words = String(t || '').split(/\s+/).filter(Boolean);
  $('.vm-said', vm).innerHTML = words.map((w, i) => '<span class="' + (i < vmIdx ? 'on' : '') + (i === vmIdx - 1 ? ' now' : '') + '">' + esc(w) + '</span>').join(' ');
}
function vmWord(w) {
  vmPulse = 0.5 + Math.min(0.45, String(w).length * 0.055); vmPulseAt = performance.now();
  if (!vm || !vmOn) return;
  const box = $('.vm-said', vm), spans = box.children, c = vmClean(w);
  for (let j = vmIdx; j < Math.min(spans.length, vmIdx + 5); j++) {
    if (vmClean(spans[j].textContent) !== c) continue;
    for (let k = vmIdx; k <= j; k++) spans[k].classList.add('on');
    if (spans[vmIdx - 1]) spans[vmIdx - 1].classList.remove('now');
    spans[j].classList.add('now');
    vmIdx = j + 1;
    const top = spans[j].offsetTop - box.clientHeight * 0.45;
    if (top > box.scrollTop) box.scrollTop = top;
    return;
  }
}
/* On laptops the glow follows the microphone's real loudness; on phones (where the microphone belongs to speech
   recognition) it follows what the recogniser hears. */
async function vmMeterStart() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod|Android/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    if (!vmOn) { stream.getTracks().forEach((t) => t.stop()); return; }
    const C = window.AudioContext || window.webkitAudioContext, ac = new C(), an = ac.createAnalyser();
    an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    vmMeter = { stream, ac, level() { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.min(1, Math.sqrt(s / buf.length) * 5); } };
  } catch (e) { vmMeter = null; }
}
function vmMeterStop() { if (!vmMeter) return; vmMeter.stream.getTracks().forEach((t) => t.stop()); vmMeter.ac.close().catch(() => {}); vmMeter = null; }
function vmOpen() {
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) { note(T[lang].noMic); return false; }
  vmBuild();
  if (vmOn) return true;
  vmOn = true; vm.hidden = false;
  document.body.classList.add('vmode-on');
  bus.emit('vmode', true);
  vmIdx = 0; vmHeard(''); vmText('');
  vm.beam.resize(); vm.beam.start();
  vmPaint();
  vmMeterStart();
  return true;
}
function vmClose() {
  if (!vmOn) return;
  vmOn = false; talk = false;
  if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; }
  if (busy) { busy.abort(); busy = null; }
  hush();
  setState('idle');
  vm.hidden = true; vm.beam.stop(); vmMeterStop();
  document.body.classList.remove('vmode-on');
  bus.emit('vmode', false);
  sfx('close');
  if (panel && !panel.hidden && input) setTimeout(() => input.focus({ preventScroll: true }), 60);
}

/* ---------------- the log ---------------- */
function addMsg(who, text, o) {
  o = o || {};
  const m = el('div', 'msg ' + (who === 'me' ? 'from-me' : 'from-sym') + (o.muted ? ' muted' : '') + (o.pending ? ' pending' : ''));
  m.innerHTML = '<div class="mt"></div>' + (o.action ? '<button type="button" class="btn small primary msg-act">' + icon(o.action.icon || 'download') + esc(o.action.label) + '</button>' : '') + (who === 'sym' && !o.muted ? '<div class="msg-tools" hidden><button type="button" data-copy>' + icon('copy') + esc(T[lang].copy) + '</button><button type="button" data-again>' + icon('volume') + esc(T[lang].again) + '</button></div>' : '');
  if (o.action) $('.msg-act', m).addEventListener('click', o.action.fn);
  const mt = $('.mt', m);
  mt.textContent = text;
  logEl.appendChild(m);
  logEl.scrollTop = logEl.scrollHeight;
  const api = {
    el: m,
    update(t) { mt.textContent = t; logEl.scrollTop = logEl.scrollHeight; },
    done() {
      m.classList.remove('pending');
      const tools = $('.msg-tools', m); if (!tools) return;
      tools.hidden = false;
      $('[data-copy]', tools).addEventListener('click', () => { const t = mt.textContent; copyOut('<div style="' + MAIL_WRAP + '"><p style="margin:0">' + esc(t) + '</p></div>', t, T[lang].copied); });
      $('[data-again]', tools).addEventListener('click', () => { Voice.unlock(); hush(); speakAll(mt.textContent); });
    }
  };
  if (!o.pending && who === 'sym') api.done();
  return api;
}
function speakAll(text) { say(text); afterSpeaking(); }
function reply(text, o) {
  o = o || {};
  vmIdx = 0; vmText(text);
  addMsg('sym', text, { muted: o.muted, action: o.action });
  if (!o.muted) history.push({ role: 'assistant', content: text });
  if (o.silent) { stageLine(text.split(/\s+/).slice(0, 8).join(' ')); return; }
  speakAll(text);
}
function note(text) { addMsg('sym', text, { muted: true }); stageLine(text.split(/\s+/).slice(0, 6).join(' ')); }

/* ---------------- asking ---------------- */
function systemPrompt() {
  return 'You are Symphony, a warm, cheerful girl who lives inside the KS2 Lesson Engine, a teaching website made by Rabinder Kaur, Head of Key Stage 2 at a primary school in England. ' +
    'You speak English and Malay. You were named Symphony because of your musical voice. You talk with teachers, and with children aged 7 to 11 who are watching or joining in. ' +
    'Answer any question helpfully: brainstorming lessons and activities, explaining ideas simply, facts about planet Earth, nature, animals, birds and space, maths, reading and writing, and how to use this website. ' +
    'Your reply is read aloud, so write plain spoken sentences: no markdown, no asterisks, no bullet symbols, no headings, no emojis, no links. Keep it short, 2 to 5 sentences, unless someone asks for a list, a plan or ideas; then give up to 5 short numbered sentences such as "One, ..." and keep each one brief. ' +
    'Use British English spelling. If the person writes in Malay, reply in Malay (Bahasa Melayu). The current reply language is ' + (lang === 'ms' ? 'Malay' : 'English') + '. ' +
    'For children be kind, simple and encouraging, and keep everything suitable for primary school. Never ask for personal details such as full names, addresses, phone numbers or photos; if someone shares them, gently say you do not need them. ' +
    'If someone asks who you are, say you are Symphony, the helper in the KS2 Lesson Engine, a girl who speaks English and Malay and was named for her musical voice. ' +
    'The site has ten lesson engines (Maths Reasoning, Story Spark, Reading Ladder, Science Mystery, Sound Journey, Unplugged Code, Step-by-Step, Escape Room, Brain Break, Big Debate), Slide Studio for slides and a PowerPoint download, the Wonder Window play area, Present mode with a magic pointer, timer and teacher notes, Night mode, and class feedback reports.' +
    (isAdmin() && adminDigest ? '\n\nYou are now talking with ' + ADMIN_NAME + ', the admin (Head of Key Stage 2), who is signed in to her dashboard. Call her Rabinder. Here is the activity data her dashboard has worked out:\n' + adminDigest +
      '\n\nWhen she asks about her teachers, time logged, lessons, pupils or anything in this data, answer meticulously: think it through, use the exact numbers and names above, compare where useful, say what stands out and what she might do next. Never invent numbers or people that are not in the data; if the data cannot answer, say so plainly. ' +
      'If she wants the full detail, tables, charts, a file, something to print or share, or everything at once, tell her the full report is ready and to tap Download report.' : '');
}
function clean(t) {
  return String(t || '').replace(/```[\s\S]*?```/g, '').replace(/\*\*|__|`/g, '').replace(/^\s*#+\s*/gm, '').replace(/^\s*[-*•]\s+/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
}
async function ask(text, from) {
  text = String(text || '').trim();
  if (!text) return;
  lastFrom = from || 'text';
  if (lastFrom !== 'voice') talk = false;
  hush();
  if (busy) { busy.abort(); busy = null; }
  addMsg('me', text);
  vmHeard(text, true); vmIdx = 0; vmText('');
  if (!vmOn) sfx('send');
  history.push({ role: 'user', content: text });
  track('chat', { via: lastFrom, lang });
  if (isAdmin()) {
    try { const b = await briefing(); adminDigest = b.digest; adminSpoken = b.spoken; adminLabel = b.label; } catch (e) { /* keep the last one */ }
    if (RX.report.test(text)) { reply((lang === 'ms' ? 'Laporan anda untuk ' : 'Your full report for ') + adminLabel.toLowerCase() + (lang === 'ms' ? ' sudah sedia. Tekan Muat turun laporan.' : ' is ready, with every table and chart. Tap Download report.'), { action: reportAction() }); return; }
    if (RX.brief.test(text) || !hasKey()) { reply(adminSpoken + (lang === 'ms' ? ' Untuk butiran penuh, tekan Muat turun laporan.' : ' For the full detail, tap Download report.'), { action: reportAction() }); return; }
  }
  if (RX.toMs.test(text)) { setLang('ms'); reply(T.ms.toMs); return; }
  if (RX.toEn.test(text)) { setLang('en'); reply(T.en.toEn); return; }
  if (RX.about.test(text)) { reply(SYMPHONY_ABOUT[lang]); return; }
  if (RX.hi.test(text)) { reply(T[lang].hi); return; }
  if (RX.site.test(text)) { reply(T[lang].site); return; }
  if (!hasKey()) { history.pop(); reply(T[lang].noKey, { muted: true }); talk = false; return; }
  const ctl = new AbortController();
  busy = ctl;
  setState('think');
  const m = addMsg('sym', '', { pending: true });
  let said = 0;
  const feed = (raw) => {
    const t = clean(raw);
    m.update(t);
    vmText(t);
    const re = /[^.!?…]+[.!?…]+["”’)]*\s+/g;
    re.lastIndex = said;
    let mm, end = said;
    while ((mm = re.exec(t))) end = re.lastIndex;
    if (end > said) { say(t.slice(said, end)); said = end; }
  };
  try {
    const r = await askClaude('', { model: CONFIG.quickModel, maxTokens: 700, system: systemPrompt(), messages: history.slice(-14), signal: ctl.signal, onText: feed });
    if (busy !== ctl) return;
    const out = clean(r.text);
    m.update(out); m.done(); vmText(out);
    history.push({ role: 'assistant', content: out });
    busy = null;
    if (out.length > said) say(out.slice(said));
    afterSpeaking();
  } catch (e) {
    if (busy !== ctl) return;
    busy = null;
    history.pop();
    m.el.remove();
    if (e && e.code === 'cancelled') { setState('idle'); return; }
    talk = false;
    note(errorCopy(e && e.code, 'an answer'));
    setState('idle');
  }
}

/* ---------------- voice in ---------------- */
function listen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  Voice.unlock();
  if (!SR) { note(T[lang].noMic); return; }
  if (state === 'listen' && rec) { talk = false; try { rec.stop(); } catch (e) { /* ignore */ } return; }
  hush();
  if (busy) { busy.abort(); busy = null; }
  talk = true;
  let finalText = '';
  try {
    rec = new SR();
    rec.lang = lang === 'ms' ? 'ms-MY' : 'en-GB';
    rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
  } catch (e) { note(T[lang].noMic); return; }
  rec.onstart = () => { setState('listen'); sfx('listen'); vmHeard(''); vmIdx = 0; vmText(''); };
  rec.onspeechstart = () => { vmPulse = 0.55; vmPulseAt = performance.now(); };
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
    input.value = (finalText + ' ' + interim).replace(/\s+/g, ' ').trim();
    const w = input.value.split(' '); showWord(w[w.length - 1] || '');
    vmHeard(input.value); vmPulse = 0.7 + Math.random() * 0.3; vmPulseAt = performance.now();
  };
  rec.onerror = (e) => {
    talk = false;
    Voice.hold(700);
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { note(T[lang].micDenied); vmHeard(T[lang].micDenied); }
    else if (e.error === 'no-speech') { note(T[lang].noSpeech); vmHeard(T[lang].noSpeech); }
    else if (e.error === 'network') { note(T[lang].micNet); vmHeard(T[lang].micNet); }
  };
  rec.onend = () => {
    const t = (finalText || input.value).trim();
    rec = null;
    Voice.hold(700);                                  // phones need a moment to hand the sound back from the microphone
    if (state === 'listen') setState('idle');
    if (t) { input.value = ''; ask(t, 'voice'); } else { showWord(''); sfx('unlisten'); }
  };
  try { rec.start(); } catch (e) { talk = false; setState('idle'); }
}

/* ---------------- open, close, language ---------------- */
function setLang(l) {
  lang = l === 'ms' ? 'ms' : 'en';
  store.set(LANG_KEY, lang === 'ms' ? 'ms' : '');
  if (!panel) return;
  $$('[data-lang]', panel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  input.placeholder = T[lang].place;
  $('.symc-send', panel).setAttribute('aria-label', T[lang].send);
  $('#symc-new span').textContent = T[lang].newChat; $('.symc-voice-t', panel).textContent = lang === 'ms' ? 'Suara' : 'Voice';
  $('.symc-fine', panel).textContent = T[lang].talkHint;
  paintChips();
  setState(state);
}
function paintChips() {
  $('#symc-chips').innerHTML = T[lang].chips.map(([t, a]) => '<button type="button" data-chip="' + esc(a) + '">' + esc(t) + '</button>').join('');
}
export function openChat(o) {
  o = o || {};
  build();
  const first = !opened;
  opened = true;
  if (panel.hidden) sfx('open');
  panel.hidden = false;
  fab.setAttribute('aria-expanded', 'true');
  document.body.classList.add('symc-open');
  if (o.brief && isAdmin()) { Voice.unlock(); greeted = true; adminGreeting(); }
  else if (o.about) { Voice.unlock(); hush(); addMsg('me', lang === 'ms' ? 'Siapa awak, Symphony?' : 'Who are you, Symphony?'); history.push({ role: 'user', content: lang === 'ms' ? 'Siapa awak?' : 'Who are you?' }); reply(SYMPHONY_ABOUT[lang]); greeted = true; }
  else if (first && !greeted) { greeted = true; if (isAdmin()) adminGreeting(); else { addMsg('sym', T[lang].hello); stageLine(T[lang].stageHello, 300); } }
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setTimeout(() => input.focus(), 60);
}
export function closeChat() {
  vmClose();
  if (!panel || panel.hidden) return;
  sfx('close');
  panel.hidden = true;
  talk = false;
  if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; }
  if (busy) { busy.abort(); busy = null; }
  hush();
  setState('idle');
  fab.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('symc-open');
  fab.focus();
}
function build() {
  if (panel) return;
  panel = el('div', 'symc');
  panel.id = 'symc'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'symc-h');
  panel.innerHTML = '<div class="symc-card">' +
    '<header class="symc-head"><span class="symc-ava">' + MINI() + '</span><div class="symc-id"><h2 id="symc-h">Symphony</h2><p class="symc-st" id="symc-st"></p></div>' +
    '<button type="button" class="btn small icon" id="symc-x" aria-label="Close">' + icon('close') + '</button></header>' +
    '<div class="symc-opts"><div class="seg symc-lang" role="group" aria-label="Language"><button type="button" data-lang="en" aria-pressed="true">English</button><button type="button" data-lang="ms" aria-pressed="false">Melayu</button></div>' +
    '<label class="symc-voice"><button type="button" class="lsw rose" role="switch" aria-checked="true" data-switch="voice" aria-label="Read answers aloud"><span class="lsw-handle"></span></button><span class="symc-voice-t">Voice</span></label>' +
    '<button type="button" class="linkbtn symc-new" id="symc-new">' + icon('refresh') + '<span></span></button></div>' +
    '<div class="symc-stage" aria-hidden="true"><div class="sam"><span class="sam-tri"></span><div class="sam-line"><span class="sam-word" id="sam-word"></span><span class="sam-bar" id="sam-bar"></span></div></div></div>' +
    '<div class="symc-log" id="symc-log" aria-live="polite"></div>' +
    '<div class="symc-chips" id="symc-chips"></div>' +
    '<form class="symc-bar" id="symc-form" novalidate><button type="button" class="symc-mic" id="symc-mic" aria-pressed="false">' + icon('mic') + '</button>' +
    '<input type="text" id="symc-in" autocomplete="off" enterkeyhint="send" maxlength="600"><button type="submit" class="symc-send">' + icon('send') + '</button></form>' +
    '<p class="symc-fine"></p></div>';
  document.body.appendChild(panel);
  logEl = $('#symc-log'); input = $('#symc-in'); mic = $('#symc-mic'); stageWord = $('#sam-word'); stageBar = $('#sam-bar'); statusEl = $('#symc-st'); avatar = $('.symc-ava', panel); stageWrap = $('.symc-stage', panel);
  $('#symc-x').addEventListener('click', closeChat);
  $('#symc-new').addEventListener('click', () => { hush(); if (busy) { busy.abort(); busy = null; } history.length = 0; logEl.innerHTML = ''; addMsg('sym', T[lang].hello); stageLine(T[lang].stageHello, 300); setState('idle'); });
  $('#symc-form').addEventListener('submit', (e) => { e.preventDefault(); Voice.unlock(); const t = input.value; input.value = ''; ask(t, 'text'); });
  mic.addEventListener('click', () => { Voice.unlock(); if (vmOpen()) listen(); });
  panel.addEventListener('click', (e) => {
    const l = e.target.closest('[data-lang]');
    if (l) { setLang(l.dataset.lang); return; }
    const c = e.target.closest('[data-chip]');
    if (!c) return;
    Voice.unlock();
    const a = c.dataset.chip;
    if (a.startsWith('fill:')) { input.value = a.slice(5); input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (er) { /* ignore */ } }
    else if (a.startsWith('lang:')) ask(c.textContent, 'text');
    else ask(c.textContent, 'text');
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeChat(); } });
  setLang(lang);
  setState('idle');
  showWord('');
  paintSwitches();
}
export function initChat() {
  fab = el('button', 'sym-fab');
  fab.type = 'button'; fab.id = 'sym-fab';
  fab.setAttribute('aria-label', 'Ask Symphony'); fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<span class="fab-orb">' + MINI() + '</span><span class="fab-t"><b>Ask Symphony</b><small>Voice or text</small></span>';
  document.body.appendChild(fab);
  fab.addEventListener('click', () => { if (panel && !panel.hidden) closeChat(); else openChat(); });
  bus.on('symphony', (o) => openChat(o || {}));
  bus.on('present', (on) => { fab.classList.toggle('away', !!on); if (on) closeChat(); });
  bus.on('header', (h) => fab.classList.toggle('tone-dark', !!h));
  bus.on('voice', (v) => { if (!v) hush(); });
  bus.on('who', () => { closeChat(); history.length = 0; if (logEl) logEl.innerHTML = ''; greeted = false; opened = false; adminDigest = ''; adminSpoken = ''; });
}
