/* Symphony, the chat pop-up. Ask anything by typing or speaking (English or Malay); she answers in text and, when
   her voice is on, out loud. Her words also appear one at a time on a bright stage with a blinking marker and an
   underline that fits each word. Tapping the mic opens voice mode: everything else disappears, a glow along the
   bottom of the screen follows your voice while she listens, sweeps while she thinks and follows her words while she
   speaks, and her answer appears word by word as she says it. After she answers she listens again, until the mic is
   tapped or nothing is heard. Questions about her, the site, greetings and language changes are answered on the
   device; everything else needs the device to be connected.
   She listens patiently (ear.js): a real pause, not the first breath, ends what you say. With Hey Symphony on she
   listens in the background for her name and answers in a small bubble, even while you present; she carries out
   commands herself (commands.js: open and close pages and windows, next slide, reveal, a timer, pick someone from
   our class), and knows what is on the screen (context.js) so "explain this slide" works.
   Her answers come from the main engine model with her knowledge and web search (sym-brain.js): she checks facts on
   trusted education websites and shows the pages she used under her answer. */
import { $, $$, esc, el, icon, store, bus, hasKey, askClaude, errorCopy, copyOut, toast, CONFIG, MAIL_WRAP, HOUSE_WORDS, houseText } from './core.js?v=3c9d4698';
import { SYMPHONY_ABOUT, MINI } from './fx/symphony.js?v=3c9d4698';
import { settings, paintSwitches } from './settings.js?v=3c9d4698';
import { isAdmin, ADMIN_NAME } from './people.js?v=3c9d4698';
import { briefing, downloadReport } from './admin.js?v=3c9d4698';
import { track } from './track.js?v=3c9d4698';
import { Voice } from './fx/voice.js?v=3c9d4698';
import { Beam } from './fx/beam.js?v=3c9d4698';
import { sfx } from './fx/audio.js?v=3c9d4698';
import { chatState, chatStart, chatEnd, clockAt } from './guard.js?v=3c9d4698';
import { Ear } from './ear.js?v=3c9d4698';
import { parseCommand, runCommand, COMMANDS_HELP } from './commands.js?v=3c9d4698';
import { screenContext, presenting } from './context.js?v=3c9d4698';
import { pupils, pupilsHTML, setPupils, namesIn, showPick, clearPupils } from './pupils.js?v=3c9d4698';
import { Live, pupilsIn } from './live/session.js?v=3c9d4698';
import { brain, today, SEARCH_TOOL, searchOn, searchOff } from './sym-brain.js?v=3c9d4698';

const LANG_KEY = 'ks2-engine.symlang.v1';
const T = {
  en: {
    idle: 'Ask me anything', listen: 'Listening…', think: 'Thinking…', search: 'Looking it up…', speak: 'Speaking…',
    place: 'Type a question, or tap the mic', send: 'Send', mic: 'Speak to Symphony', stopMic: 'Stop listening',
    hello: 'Hi! I’m Symphony. Ask me anything, by typing or by tapping the mic. I can brainstorm lessons with you, check facts on trusted websites, explain things simply, or tell you all about planets, animals and the natural world.',
    stageHello: 'Hi, I’m Symphony',
    hi: 'Hi! Lovely to hear from you. What shall we work on?',
    site: 'This site has ten lesson engines, a Slide Studio, lkie.like for whole lesson packs with worksheets in three tiers, and a Wonder Window play area. Pick an engine from the dock at the bottom, type your topic, and you get a class screen to share plus teacher notes. Press Present to share it on Teams, Zoom or Meet, with a magic pointer, a timer and your notes. You can also switch on Night mode, and collect feedback from your class for a report. Switch on Hey Symphony in my panel, then say “Hey Symphony, next slide” or “Hey Symphony, pick someone”, and I do it without you touching the screen.',
    toEn: 'Of course! I’ll speak English. What would you like to know?',
    noKey: 'Right now I can only tell you about me and this site, because this device isn’t connected to the engine yet. Open your personal link once on this device, and then I can answer anything.',
    noKeyAdmin: 'Right now I can only tell you about me and this site, because this device isn’t connected to the engine yet. Tap Connect at the top, or open the site’s setup link once on this device.',
    fillers: ['Let me check that for you.', 'Ooh, let me look that up.', 'Good one. Let me check.', 'Give me a second, I’ll find out.', 'Let me make sure I get that right.'],
    sources: 'Sources',
    vH: 'Her voice', vHuman: 'Human voices', vDevice: 'This device’s voices', vSpeed: 'Pace', vCalm: 'Calmer', vNormal: 'Normal', vLively: 'Livelier',
    vSample: 'Hi, I’m Symphony! Shall we make today’s lesson brilliant?', vNatural: 'Natural voice', vPlain: 'Device voice', vNone: 'This device has no voice of its own for this language.',
    vAddAdmin: 'For her natural human voice, add a voice key once in Connect.', vAddTeacher: 'For her natural human voice, ask Rabinder for a fresh personal link once the school has added a voice key.',
    vOpen: 'Open Connect', vAbout: 'Her human voice is made by a voice service (OpenAI) and is AI-generated. Pupils’ names are always spoken by this device’s own voice.',
    micDenied: 'Please allow the microphone, then tap the mic again so I can hear you.',
    noMic: 'Speaking to me needs Chrome, Edge or Safari. You can still type your question.',
    noSpeech: 'I didn’t hear anything. Tap the mic and try again.',
    micNet: 'Voice needs an internet connection. You can type instead.',
    talkHint: 'Tap the mic to talk. She answers out loud, then listens again.',
    vmTap: 'Tap to talk', vmIdle: 'Say anything. I’m listening when the glow moves.',
    voiceTrouble: 'This device wouldn’t let me speak just then. Tap “Say again” to hear it.',
    tooFast: 'One question at a time, please. Ask me again in a moment.',
    restTen: 'That was a lot of questions in a few minutes! Let’s take a little break. I can answer again at {at}.',
    restDay: 'We’ve talked a lot today! Let’s talk again tomorrow.',
    copy: 'Copy', again: 'Say again', copied: 'Copied. Paste it anywhere.', newChat: 'New chat',
    noMicDevice: 'I can’t find a microphone on this device.', wakeT: 'Hey Symphony', patientT: 'Patient', classT: 'Our class',
    yes: 'Yes? Say “Hey Symphony” and then your question.', heard: 'Listening…', follow: 'Anything else? I’m listening.',
    earOn: 'Listening for “Hey Symphony”. Tap to stop.', earTap: 'Hey Symphony: tap to start', earPaused: 'Hey Symphony (paused while I speak)',
    wakeDenied: 'Hey Symphony needs the microphone. Allow it in the browser, then switch Hey Symphony on again.', wakeNet: 'Hey Symphony needs an internet connection on this browser. It is off for now.',
    wakeSleep: 'I stopped listening for my name after 45 quiet minutes. Switch Hey Symphony on again when you need me.', wakeTouch: 'Hey Symphony works best on a laptop or classroom computer.',
    classH: 'Our class', classSave: 'Save', classPick: 'Pick someone', classLive: 'Add the pupils who joined', classClear: 'Clear the list', classSaved: 'Saved. {n} names, on this device only.', classEmpty: 'Add the first names first.',
    chips: [['Who are you?', 'ask'], ['Brainstorm a lesson', 'fill:Brainstorm a fun KS2 lesson about '], ['News for children today', 'ask'], ['A fun fact about space', 'ask'], ['Explain fractions to a Year 3 class', 'ask'], ['What can this site do?', 'ask'], ['Cakap Melayu', 'lang:ms']]
  },
  ms: {
    idle: 'Tanya saya apa sahaja', listen: 'Sedang mendengar…', think: 'Sedang berfikir…', search: 'Sedang mencari…', speak: 'Sedang bercakap…',
    place: 'Taip soalan, atau tekan mikrofon', send: 'Hantar', mic: 'Bercakap dengan Symphony', stopMic: 'Berhenti mendengar',
    hello: 'Hai! Saya Symphony. Tanyalah apa sahaja, dengan menaip atau menekan mikrofon. Saya boleh membantu merancang pelajaran, menyemak fakta di laman web yang dipercayai, menerangkan sesuatu dengan mudah, atau bercerita tentang planet, haiwan dan alam semula jadi.',
    stageHello: 'Hai, saya Symphony',
    hi: 'Hai! Seronok mendengar daripada anda. Apa yang anda ingin tahu?',
    site: 'Laman ini ada sepuluh enjin pelajaran, Slide Studio, lkie.like untuk pek pelajaran lengkap dengan lembaran kerja tiga tahap, dan ruang main Wonder Window. Pilih enjin dari dok di bawah, taip topik anda, dan anda akan mendapat skrin kelas serta nota guru. Tekan Present untuk berkongsi di Teams, Zoom atau Meet. Anda juga boleh menghidupkan mod malam dan mengumpul maklum balas kelas untuk laporan. Hidupkan Hey Symphony dalam panel saya, kemudian sebut “Hey Symphony, slaid seterusnya” atau “Hey Symphony, pilih seorang”.',
    toMs: 'Baiklah, saya akan bercakap dalam bahasa Melayu. Apa yang anda ingin tahu?',
    noKey: 'Buat masa ini saya hanya boleh bercerita tentang diri saya dan laman ini, kerana peranti ini belum disambungkan kepada enjin. Buka pautan peribadi anda sekali pada peranti ini, dan selepas itu saya boleh menjawab apa sahaja.',
    noKeyAdmin: 'Buat masa ini saya hanya boleh bercerita tentang diri saya dan laman ini, kerana peranti ini belum disambungkan kepada enjin. Tekan Connect di atas, atau buka pautan persediaan laman ini sekali pada peranti ini.',
    fillers: ['Sekejap, saya semak dulu.', 'Biar saya carikan.', 'Soalan yang bagus. Saya semak sekejap.', 'Tunggu sebentar, saya cari jawapannya.'],
    sources: 'Sumber',
    vH: 'Suaranya', vHuman: 'Suara manusia', vDevice: 'Suara peranti ini', vSpeed: 'Kelajuan', vCalm: 'Lebih tenang', vNormal: 'Biasa', vLively: 'Lebih ceria',
    vSample: 'Hai, saya Symphony! Jom kita jadikan pelajaran hari ini hebat!', vNatural: 'Suara semula jadi', vPlain: 'Suara peranti', vNone: 'Peranti ini tiada suara sendiri untuk bahasa ini.',
    vAddAdmin: 'Untuk suara manusianya yang semula jadi, tambah kunci suara sekali di Connect.', vAddTeacher: 'Untuk suara manusianya yang semula jadi, minta pautan peribadi baharu daripada Rabinder selepas sekolah menambah kunci suara.',
    vOpen: 'Buka Connect', vAbout: 'Suara manusianya dihasilkan oleh perkhidmatan suara (OpenAI) dan dijana oleh AI. Nama murid sentiasa disebut oleh suara peranti ini sendiri.',
    micDenied: 'Sila benarkan mikrofon, kemudian tekan mikrofon sekali lagi supaya saya boleh mendengar anda.',
    noMic: 'Untuk bercakap dengan saya, gunakan Chrome, Edge atau Safari. Anda masih boleh menaip soalan.',
    noSpeech: 'Saya tidak dengar apa-apa. Tekan mikrofon dan cuba lagi.',
    micNet: 'Suara memerlukan sambungan internet. Anda boleh menaip.',
    talkHint: 'Tekan mikrofon untuk bercakap. Dia menjawab dengan suara, kemudian mendengar semula.',
    vmTap: 'Tekan untuk bercakap', vmIdle: 'Cakap apa sahaja. Saya mendengar apabila cahaya bergerak.',
    voiceTrouble: 'Peranti ini tidak membenarkan saya bercakap tadi. Tekan “Ulang” untuk mendengarnya.',
    tooFast: 'Satu soalan pada satu masa, ya. Tanya saya lagi sebentar nanti.',
    restTen: 'Banyak soalan dalam beberapa minit! Mari kita berehat sebentar. Saya boleh menjawab lagi pada pukul {at}.',
    restDay: 'Kita sudah banyak berbual hari ini! Kita berbual lagi esok, ya.',
    copy: 'Salin', again: 'Ulang', copied: 'Disalin.', newChat: 'Sembang baharu',
    noMicDevice: 'Saya tidak menjumpai mikrofon pada peranti ini.', wakeT: 'Hey Symphony', patientT: 'Sabar', classT: 'Kelas kita',
    yes: 'Ya? Sebut “Hey Symphony” dan soalan anda.', heard: 'Sedang mendengar…', follow: 'Ada lagi? Saya mendengar.',
    earOn: 'Mendengar “Hey Symphony”. Tekan untuk berhenti.', earTap: 'Hey Symphony: tekan untuk mula', earPaused: 'Hey Symphony (berhenti sebentar semasa saya bercakap)',
    wakeDenied: 'Hey Symphony memerlukan mikrofon. Benarkannya dalam pelayar, kemudian hidupkan semula.', wakeNet: 'Hey Symphony memerlukan internet pada pelayar ini. Ia dimatikan buat masa ini.',
    wakeSleep: 'Saya berhenti mendengar nama saya selepas 45 minit senyap. Hidupkan semula Hey Symphony apabila perlu.', wakeTouch: 'Hey Symphony paling sesuai pada komputer riba atau komputer kelas.',
    classH: 'Kelas kita', classSave: 'Simpan', classPick: 'Pilih seorang', classLive: 'Tambah murid yang menyertai', classClear: 'Kosongkan senarai', classSaved: 'Disimpan. {n} nama, pada peranti ini sahaja.', classEmpty: 'Tambah nama pertama dahulu.',
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
let state = 'idle', busy = null, talk = false, capturing = false, opened = false, greeted = false, lastFrom = 'text';
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
let sayGen = 0, lastSay = null, troubled = -1, searching = false;
function say(text) {
  text = String(text || '').trim();
  if (!text) return;
  const g = sayGen;
  lastSay = Voice.say(text, {
    lang: lang === 'ms' ? 'ms' : 'en-GB', rate: lang === 'ms' ? 0.95 : 1, style: 'chat', silent: !settings.voice,
    onStart: () => { if (g === sayGen && state !== 'listen') setState(searching ? 'search' : 'speak'); },
    onWord: (w) => { if (g === sayGen) { showWord(w); vmWord(w); } },
    onTrouble: () => { if (g === sayGen && troubled !== g) { troubled = g; addMsg('sym', T[lang].voiceTrouble, { muted: true }); } }
  });
}
function hush() { sayGen++; lastSay = null; Voice.stop(); }
/* (searching is set while her web search runs, so the status says "Looking it up…" even while she says "let me check".) */
/* When the last part has been said: back to idle, and in a spoken conversation, listen again. */
async function afterSpeaking() {
  const g = sayGen, p = lastSay;
  if (p) await p;
  if (g !== sayGen || busy) return;
  setTimeout(() => {
    if (g !== sayGen || busy) return;
    if (state === 'speak') { setState('idle'); showWord(''); }
    if (lastFrom === 'wake') { wakeDone(); return; }
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
  const a = $('.sym', avatar); if (a) a.dataset.state = s === 'think' || s === 'search' ? 'think' : s === 'speak' ? 'speak' : s === 'listen' ? 'listen' : 'idle';
  mic.setAttribute('aria-pressed', String(s === 'listen'));
  mic.setAttribute('aria-label', s === 'listen' ? T[lang].stopMic : T[lang].mic);
  if (s === 'think') showWord(lang === 'ms' ? 'Berfikir' : 'Thinking');
  if (s === 'search') showWord(lang === 'ms' ? 'Mencari' : 'Searching');
  if (s === 'listen') showWord(lang === 'ms' ? 'Mendengar' : 'Listening');
  vmPaint();
  if (lastFrom === 'wake') bubState(s);
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
    if (state === 'listen' && capturing) { Ear.finish(); return; }                                  // done talking: send it
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
  vm.beam.set({ processing: state === 'think' || state === 'search' });
}
function vmHeard(t, final) { if (lastFrom === 'wake') bubHeard(t); if (!vm || !vmOn) return; const h = $('.vm-heard', vm); h.textContent = t || ''; h.classList.toggle('final', !!final); }
function vmText(t) {
  if (lastFrom === 'wake') bubSaid(t);
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
  if (capturing) Ear.cancel();
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
  let srcs = [];
  const api = {
    el: m,
    update(t) { mt.textContent = t; logEl.scrollTop = logEl.scrollHeight; },
    /* The pages she used, under her answer (never read aloud). */
    sources(list) {
      srcs = (list || []).filter((x) => /^https?:\/\//.test(x.url)).slice(0, 4);
      if (!srcs.length) return;
      const box = el('div', 'msg-src');
      box.innerHTML = '<span>' + icon('globe') + esc(T[lang].sources) + '</span>' + srcs.map((x) => '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(x.title || x.url) + '">' + esc(site(x.url)) + '</a>').join('');
      m.insertBefore(box, $('.msg-tools', m));
      logEl.scrollTop = logEl.scrollHeight;
    },
    done() {
      m.classList.remove('pending');
      const tools = $('.msg-tools', m); if (!tools) return;
      tools.hidden = false;
      $('[data-copy]', tools).addEventListener('click', () => {
        const t = mt.textContent;
        const links = srcs.map((x) => '<a href="' + esc(x.url) + '">' + esc(x.title || site(x.url)) + '</a>').join(' · ');
        copyOut('<div style="' + MAIL_WRAP + '"><p style="margin:0">' + esc(t) + '</p>' + (srcs.length ? '<p style="margin:10px 0 0;font-size:13px">' + esc(T[lang].sources) + ': ' + links + '</p>' : '') + '</div>',
          t + (srcs.length ? '\n\n' + T[lang].sources + ': ' + srcs.map((x) => x.url).join(' ') : ''), T[lang].copied);
      });
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
  if (o.silent) { stageLine(text.split(/\s+/).slice(0, 8).join(' ')); if (lastFrom === 'wake') wakeDone(); return; }
  speakAll(text);
}
function note(text) { addMsg('sym', text, { muted: true }); stageLine(text.split(/\s+/).slice(0, 6).join(' ')); }

/* ---------------- asking ---------------- */
/* Her instructions: the long part (who she is, how she talks, teaching and the whole KS2 curriculum, sym-brain.js) is
   the same every time, so the engine caches it; the moment (date, language, the screen, the admin's data) follows. */
function moment() {
  return today(lang) + ' Reply in ' + (lang === 'ms' ? 'Malay (Bahasa Melayu)' : 'English') + '. If the person writes in Malay, reply in Malay; if they write in English, reply in English. ' +
    (lastFrom === 'wake' ? 'You were just called with "Hey Symphony", probably in front of the class: answer in at most 3 short sentences. ' : '') +
    (lastFrom === 'voice' ? 'This is a spoken conversation: keep it natural and brief, as if you were talking face to face. ' : '') +
    '\n\nWhat is on the screen now (when the teacher says "this", "this slide" or "this page", they mean this):\n' + screenContext() +
    (pupils().length ? '\nThe class list on this device has ' + pupils().length + ' first names. You are not told them; never ask for them.' : '') +
    (isAdmin() && adminDigest ? '\n\nYou are now talking with ' + ADMIN_NAME + ', the admin (Head of Key Stage 2), who is signed in to her dashboard. Call her Rabinder. Here is the activity data her dashboard has worked out:\n' + adminDigest +
      '\n\nWhen she asks about her teachers, time logged, lessons, pupils or anything in this data, answer meticulously: think it through, use the exact numbers and names above, compare where useful, say what stands out and what she might do next. Never invent numbers or people that are not in the data; if the data cannot answer, say so plainly. Do not search the web for questions about this data. ' +
      'If she wants the full detail, tables, charts, a file, something to print or share, or everything at once, tell her the full report is ready and to tap Download report.' : '');
}
async function systemPrompt() {
  return [{ type: 'text', text: await brain(), cache_control: { type: 'ephemeral' } }, { type: 'text', text: moment() }];
}
/* The conversation so far, starting with something the person said. */
function convo() { const h = history.slice(-14); while (h.length && h[0].role !== 'user') h.shift(); return h; }
const join = (a, b) => a + (a && b && !/\s$/.test(a) && !/^\s/.test(b) ? ' ' : '') + b;
const site = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
function clean(t) {
  return houseText(String(t || '').replace(/```[\s\S]*?```/g, '').replace(/\*\*|__|`/g, '').replace(/^\s*#+\s*/gm, '').replace(/^\s*[-*•]\s+/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n{3,}/g, '\n\n').trim());
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
  track('chat', { via: lastFrom === 'wake' ? 'voice' : lastFrom, lang });
  // things she does herself, at once, with no engine call
  const cmd = parseCommand(text);
  if (cmd) {
    history.pop();
    let r = null;
    try { r = await runCommand(cmd, lang); } catch (e) { r = null; }
    if (r) {
      if (!r.text) { setState('idle'); if (lastFrom === 'wake') bubHide(900); return; }
      reply(r.text, { muted: true, silent: !!r.short && !!presenting() });
      return;
    }
  }
  if (isAdmin()) {
    try { const b = await briefing(); adminDigest = b.digest; adminSpoken = b.spoken; adminLabel = b.label; } catch (e) { /* keep the last one */ }
    if (RX.report.test(text)) { reply((lang === 'ms' ? 'Laporan anda untuk ' : 'Your full report for ') + adminLabel.toLowerCase() + (lang === 'ms' ? ' sudah sedia. Tekan Muat turun laporan.' : ' is ready, with every table and chart. Tap Download report.'), { action: reportAction() }); return; }
    if (RX.brief.test(text)) { reply(adminSpoken + (lang === 'ms' ? ' Untuk butiran penuh, tekan Muat turun laporan.' : ' For the full detail, tap Download report.'), { action: reportAction() }); return; }
    if (!hasKey() && !RX.about.test(text) && !RX.hi.test(text) && !RX.site.test(text) && !RX.toMs.test(text) && !RX.toEn.test(text)) { history.pop(); reply(T[lang].noKeyAdmin + (lang === 'ms' ? ' Saya masih boleh memberi taklimat anda: minta sahaja.' : ' I can still give you your briefing: just ask for it.'), { muted: true, action: reportAction() }); talk = false; return; }
  }
  if (RX.toMs.test(text)) { setLang('ms'); reply(T.ms.toMs); return; }
  if (RX.toEn.test(text)) { setLang('en'); reply(T.en.toEn); return; }
  if (RX.about.test(text)) { reply(SYMPHONY_ABOUT[lang]); return; }
  if (RX.hi.test(text)) { reply(T[lang].hi); return; }
  if (RX.site.test(text)) { reply(T[lang].site); return; }
  if (!hasKey()) { history.pop(); reply(isAdmin() ? T[lang].noKeyAdmin : T[lang].noKey, { muted: true }); talk = false; return; }
  // the engine guard: one question every few seconds, a short break after many, and a daily limit (guard.js)
  const g = chatState();
  if (!g.ok) {
    history.pop(); talk = false;
    if (g.why === 'gap') note(T[lang].tooFast);
    else reply(g.why === 'day' ? T[lang].restDay : T[lang].restTen.replace('{at}', clockAt(g.left)));
    return;
  }
  const asked = chatStart();
  const ctl = new AbortController();
  busy = ctl;
  setState('think');
  const m = addMsg('sym', '', { pending: true });
  let said = 0, filled = false;
  const cites = [];
  const feed = (raw) => {
    if (busy !== ctl) return;
    const t = clean(raw);
    if (searching && t.length > said) { searching = false; if (state === 'search') setState(Voice.speaking ? 'speak' : 'think'); }
    m.update(t);
    vmText(t);
    const re = /[^.!?…]+[.!?…]+["”’)]*\s+/g;
    re.lastIndex = said;
    let mm, end = said;
    while ((mm = re.exec(t))) end = re.lastIndex;
    if (end > said) { say(t.slice(said, end)); said = end; }
  };
  /* While she searches: "Looking it up…", and one natural line out loud if she has not started her answer yet. */
  const onTool = (ev) => {
    if (busy !== ctl || ev.name !== 'web_search' || ev.phase !== 'start') return;
    searching = true;
    setState('search');
    if (!filled && !said) { filled = true; const f = T[lang].fillers; say(f[Math.floor(Math.random() * f.length)]); }
  };
  const onCite = (c) => { if (c && c.url && !cites.some((x) => x.url === c.url)) cites.push({ url: c.url, title: String(c.title || '') }); };
  try {
    const system = await systemPrompt();
    let tools = searchOn() ? [SEARCH_TOOL] : [];
    let messages = convo(), text = '', r = null;
    for (let turn = 0; turn < 3; turn++) {
      try {
        const before = text;
        r = await askClaude('', { model: CONFIG.symModel || CONFIG.mainModel, maxTokens: 1200, system, messages, tools, signal: ctl.signal, onText: (t) => feed(join(before, t)), onTool, onCite });
      } catch (e) {
        if (e && e.code === 'no_search' && tools.length) { searchOff(); tools = []; turn--; continue; }   // search is off for this account
        throw e;
      }
      if (busy !== ctl) return;
      text = join(text, r.text);
      if (r.stop !== 'pause_turn') break;
      messages = messages.concat([{ role: 'assistant', content: r.blocks }]);                         // a long search paused: let her finish
    }
    searching = false;
    const out = clean(text);
    if (!out) throw Object.assign(new Error('empty'), { code: 'empty' });
    m.update(out); m.sources(cites); m.done(); vmText(out);
    history.push({ role: 'assistant', content: out });
    busy = null;
    chatEnd(asked, true);
    if (out.length > said) say(out.slice(said));
    afterSpeaking();
  } catch (e) {
    if (busy !== ctl) return;
    busy = null; searching = false;
    history.pop();
    m.el.remove();
    chatEnd(asked, e && e.code === 'cancelled');
    if (e && e.code === 'cancelled') { setState('idle'); return; }
    talk = false;
    note(errorCopy(e && e.code, 'an answer'));
    setState('idle');
  }
}

/* ---------------- voice in: patient listening (ear.js) ---------------- */
function listen() {
  Voice.unlock();
  if (!Ear.supported) { note(T[lang].noMic); return; }
  if (state === 'listen' && capturing) { talk = false; Ear.finish(); return; }     // done talking: send it now
  hush();
  if (busy) { busy.abort(); busy = null; }
  talk = true; capturing = true; lastFrom = 'voice';
  Ear.setLang(lang); Ear.setPatient(settings.patient);
  setState('listen'); sfx('listen'); vmHeard(''); vmIdx = 0; vmText('');
  Ear.capture({
    onInterim: (t) => {
      if (input) input.value = t;
      const w = t.split(' '); showWord(w[w.length - 1] || '');
      vmHeard(t); vmPulse = 0.7 + Math.random() * 0.3; vmPulseAt = performance.now();
    }
  }).then((r) => {
    capturing = false;
    Voice.hold(700);                                  // phones need a moment to hand the sound back from the microphone
    if (state === 'listen') setState('idle');
    if (r.text) { if (input) input.value = ''; ask(r.text, 'voice'); return; }
    talk = false; showWord(''); sfx('unlisten');
    const msg = r.error === 'denied' ? T[lang].micDenied : r.error === 'nothing' ? T[lang].noSpeech : r.error === 'network' ? T[lang].micNet : r.error === 'nomic' ? T[lang].noMicDevice : '';
    if (msg) { note(msg); vmHeard(msg); }
  });
}

/* ---------------- Hey Symphony: the background ear, the small bubble and the pill ---------------- */
let bub = null, bubT = 0, earEl = null;
const touchy = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
function bubBuild() {
  bub = el('div', 'sym-bub');
  bub.hidden = true; bub.setAttribute('role', 'status'); bub.setAttribute('aria-live', 'polite');
  bub.innerHTML = '<span class="sb-ava">' + MINI() + '</span><div class="sb-txt"><small class="sb-st"></small><p class="sb-heard"></p><p class="sb-said"></p></div>' +
    '<div class="sb-btns"><button type="button" class="sb-b" data-sb="stop" aria-label="Stop">' + icon('stop') + '</button><button type="button" class="sb-b" data-sb="open" aria-label="Open the chat">' + icon('chat') + '</button></div>';
  document.body.appendChild(bub);
  bub.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sb]');
    if (!b) return;
    if (b.dataset.sb === 'stop') { hush(); if (busy) { busy.abort(); busy = null; } Ear.cancel(); setState('idle'); bubHide(0); }
    else { bubHide(0); openChat(); }
  });
}
function bubShow() { if (vmOn || (panel && !panel.hidden)) return; if (!bub) bubBuild(); clearTimeout(bubT); bub.hidden = false; }
function bubState(s) {
  if (!bub || bub.hidden) return;
  bub.dataset.state = s;
  $('.sb-st', bub).textContent = s === 'listen' ? T[lang].heard : s === 'follow' ? T[lang].follow : (T[lang][s] || 'Symphony');
}
function bubHeard(t) { if (!bub || bub.hidden) return; $('.sb-heard', bub).textContent = t ? '“' + t + '”' : ''; }
function bubSaid(t) { if (!bub || bub.hidden) return; $('.sb-said', bub).textContent = t || ''; }
function bubHide(ms) { clearTimeout(bubT); bubT = setTimeout(() => { if (bub) bub.hidden = true; if (lastFrom === 'wake' && state !== 'think' && state !== 'search') lastFrom = 'text'; }, ms || 0); }
/* After she has answered: a few seconds for a follow-up (Patient listening), then the bubble goes. */
function wakeDone() {
  if (settings.wake && settings.patient && Ear.wake) { Ear.follow(9000); bubState('follow'); bubHide(9600); }
  else bubHide(4500);
}
function onWake(t) {
  if (!settings.wake) return;
  build();
  lastFrom = 'wake';
  hush();
  if (busy) { busy.abort(); busy = null; }
  bubShow(); bubSaid(''); bubHeard(t || ''); setState('listen');
  sfx('listen');
}
function onHeard(t) { if (lastFrom === 'wake') { bubShow(); bubHeard(t); if (state !== 'listen') setState('listen'); } }
function onQuestion(q) {
  if (!q.text) {                                           // only her name: she answers, then listens for the question
    lastFrom = 'wake'; bubShow(); setState('idle'); bubHeard(''); bubSaid(T[lang].yes);
    if (settings.voice) Voice.say(lang === 'ms' ? 'Ya?' : 'Yes?', { lang: lang === 'ms' ? 'ms' : 'en-GB' });
    setTimeout(() => { if (Ear.wake) { Ear.follow(8000); bubState('follow'); bubHide(8600); } }, 900);
    return;
  }
  lastFrom = 'wake'; bubShow();
  ask(q.text, 'wake');
}
function onEarOff(why) {
  if (settings.wake) settings.wake = false;
  const m = why === 'denied' ? T[lang].wakeDenied : why === 'network' ? T[lang].wakeNet : why === 'sleep' ? T[lang].wakeSleep : why === 'nomic' ? T[lang].noMicDevice : '';
  if (m) toast(m);
  earPaint();
}
function earPaint() {
  const on = settings.wake && Ear.supported;
  if (!on) { if (earEl) earEl.hidden = true; return; }
  if (!earEl) {
    earEl = el('button', 'sym-ear');
    earEl.type = 'button';
    earEl.innerHTML = '<i aria-hidden="true"></i><span></span>';
    earEl.addEventListener('click', () => { if (!Ear.wake) { Ear.setLang(lang); Ear.setWake(true); earPaint(); return; } settings.wake = false; toast(T[lang].wakeT + ': off'); });
    document.body.appendChild(earEl);
  }
  const st = Ear.state, label = !st.wake ? T[lang].earTap : st.paused ? T[lang].earPaused : T[lang].earOn;
  earEl.hidden = false;
  earEl.dataset.state = !st.wake ? 'tap' : st.armed ? 'armed' : st.paused ? 'paused' : st.listening ? 'on' : 'wait';
  $('span', earEl).textContent = !st.wake ? T[lang].earTap : T[lang].wakeT;
  earEl.setAttribute('aria-label', label); earEl.title = label;
}
/* The switch: on starts the background ear (the browser asks once for the microphone). */
async function wakeSwitch(on) {
  if (on && !Ear.supported) { settings.wake = false; toast(T[lang].noMic); return; }
  if (on && touchy()) toast(T[lang].wakeTouch);
  Ear.setLang(lang); Ear.setPatient(settings.patient);
  Ear.setWake(on);
  earPaint();
}
/* After a reload, the ear starts by itself only if the browser already allows the microphone; otherwise the pill
   says "tap to start", so the browser never asks out of the blue. */
async function micGranted() {
  try { const p = await navigator.permissions.query({ name: 'microphone' }); return p.state === 'granted'; } catch (e) { return false; }
}

/* ---------------- our class (pupils.js): first names on this device, and picking someone fairly ---------------- */
function classOpen(on) {
  const box = $('#symc-class', panel);
  if (!box) return;
  box.hidden = !on;
  if (!on) return;
  const vb = $('#symc-voices', panel); if (vb && !vb.hidden) voicesOpen(false);
  const ears = $('.symc-ears', panel);
  box.style.top = (ears ? ears.offsetTop + ears.offsetHeight + 4 : 150) + 'px';     // just under the switches
  const ms = lang === 'ms', live = Live.on && pupilsIn().length;
  box.innerHTML = '<div class="pc-head"><b>' + icon('smile') + esc(T[lang].classH) + '</b><button type="button" class="btn small icon" data-pc="x" aria-label="Close">' + icon('close') + '</button></div>' +
    pupilsHTML(ms) +
    '<div class="pc-acts"><button type="button" class="btn small primary" data-pc="save">' + icon('check') + esc(T[lang].classSave) + '</button><button type="button" class="btn small" data-pc="pick">' + icon('spark') + esc(T[lang].classPick) + '</button>' +
    (live ? '<button type="button" class="btn small" data-pc="live">' + icon('plus') + esc(T[lang].classLive) + '</button>' : '') + '<button type="button" class="linkbtn" data-pc="clear">' + esc(T[lang].classClear) + '</button></div>' +
    '<p class="fine pc-say">' + (ms ? 'Atau sebut: “Hey Symphony, ingat kelas kita: Aisyah, Wei Jie dan Priya.” Kemudian: “Hey Symphony, pilih seorang.”' : 'Or say: “Hey Symphony, remember our class: Aisyah, Wei Jie and Priya.” Then: “Hey Symphony, pick someone.”') + '</p>';
  const ta = $('.pc-names', box); if (ta) setTimeout(() => ta.focus(), 30);
}
function classAct(a) {
  const box = $('#symc-class', panel), ta = box && $('.pc-names', box);
  if (a === 'x') { classOpen(false); paintClassBtn(); return; }
  if (a === 'save' && ta) { const list = setPupils(namesIn(ta.value)); toast(T[lang].classSaved.replace('{n}', list.length)); classOpen(true); paintClassBtn(); return; }
  if (a === 'pick') { if (ta && namesIn(ta.value).length && namesIn(ta.value).join('|') !== pupils().join('|')) setPupils(namesIn(ta.value)); if (!pupils().length) { toast(T[lang].classEmpty); return; } showPick(lang); paintClassBtn(); return; }
  if (a === 'live' && ta) { const names = pupilsIn().map((p) => p.name).filter(Boolean); ta.value = namesIn([ta.value].concat(names).join('\n')).filter((n, i, all) => all.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i).join('\n'); return; }
  if (a === 'clear') { clearPupils(); classOpen(true); paintClassBtn(); }
}
/* ---------------- her voice: a human voice or one of this device's best voices, and her pace ---------------- */
const vLang = () => (lang === 'ms' ? 'ms' : 'en-GB');
function voiceNow() {
  if (Voice.human(vLang())) return 'h:' + Voice.Human.humanFor(vLang());
  const v = Voice.pick(vLang());
  return v ? 'd:' + (v.voiceURI || v.name) : '';
}
function voicesOpen(on) {
  const box = $('#symc-voices', panel);
  if (!box) return;
  box.hidden = !on;
  $('#symc-vpick', panel).setAttribute('aria-expanded', String(!!on));
  if (!on) return;
  classOpen(false);
  const ears = $('.symc-ears', panel);
  box.style.top = (ears ? ears.offsetTop + ears.offsetHeight + 4 : 150) + 'px';
  const t = T[lang], now = voiceNow(), key = Voice.Human.ready(), sp = Voice.Human.speedName();
  const opt = (id, name, note) => '<button type="button" class="vc-opt" data-vc="' + esc(id) + '" aria-pressed="' + (id === now) + '"><span class="vc-dot">' + icon(id === now ? 'check' : 'play') + '</span><span><b>' + esc(name) + '</b><small>' + esc(note) + '</small></span></button>';
  const dev = Voice.devices(vLang(), 6);
  box.innerHTML = '<div class="pc-head"><b>' + icon('volume') + esc(t.vH) + '</b><button type="button" class="btn small icon" data-vc-x aria-label="Close">' + icon('close') + '</button></div>' +
    (key ? '<p class="vc-sec">' + esc(t.vHuman) + '</p><div class="vc-list">' + Voice.Human.VOICES.map((v) => opt('h:' + v.id, v.name, lang === 'ms' ? v.ms : v.en)).join('') + '</div>' : '') +
    '<p class="vc-sec">' + esc(t.vDevice) + '</p>' + (dev.length ? '<div class="vc-list">' + dev.map((v) => opt('d:' + v.id, v.name, v.natural ? t.vNatural : t.vPlain)).join('') + '</div>' : '<p class="fine">' + esc(t.vNone) + '</p>') +
    '<p class="vc-sec">' + esc(t.vSpeed) + '</p><div class="seg vc-speed" role="group" aria-label="' + esc(t.vSpeed) + '">' +
    [['calm', t.vCalm], ['normal', t.vNormal], ['lively', t.vLively]].map(([k, n]) => '<button type="button" data-vc-speed="' + k + '" aria-pressed="' + (sp === k) + '">' + esc(n) + '</button>').join('') + '</div>' +
    (key ? '<p class="fine">' + esc(t.vAbout) + '</p>' : '<p class="fine">' + esc(isAdmin() ? t.vAddAdmin : t.vAddTeacher) + '</p>' + (isAdmin() ? '<p><button type="button" class="btn small" data-connect>' + icon('key') + esc(t.vOpen) + '</button></p>' : ''));
}
function voicesAct(e) {
  const box = $('#symc-voices', panel);
  if (e.target.closest('[data-vc-x]')) { voicesOpen(false); return true; }
  const o = e.target.closest('[data-vc]');
  if (o) { const id = o.dataset.vc; Voice.unlock(); hush(); Voice.choose(vLang(), id); voicesOpen(true); paintVoiceBtn(); refocus('[data-vc]', id, 'vc'); Voice.say(T[lang].vSample, { lang: vLang(), style: 'chat' }); return true; }
  const sp = e.target.closest('[data-vc-speed]');
  if (sp) { const k = sp.dataset.vcSpeed; Voice.unlock(); hush(); Voice.Human.setSpeed(k); voicesOpen(true); refocus('[data-vc-speed]', k, 'vcSpeed'); Voice.say(T[lang].vSample, { lang: vLang(), style: 'chat' }); return true; }
  if (e.target.closest('[data-connect]')) { voicesOpen(false); return false; }
  return !!(box && box.contains(e.target));
}
/* The sheet is redrawn after each choice: keep the keyboard on the button that was pressed. */
function refocus(sel, v, k) { const b = $$('#symc-voices ' + sel, panel).find((x) => x.dataset[k] === v); if (b) b.focus({ preventScroll: true }); }
function paintVoiceBtn() { const b = panel && $('#symc-vpick', panel); if (b) $('span', b).textContent = (Voice.name(vLang()) || T[lang].vH).replace(/\s*\(.*$/, '').split(' ').slice(0, 2).join(' '); }
function paintClassBtn() { const b = panel && $('#symc-class-b', panel); if (b) $('span', b).textContent = T[lang].classT + (pupils().length ? ' (' + pupils().length + ')' : ''); }

/* ---------------- open, close, language ---------------- */
function setLang(l) {
  lang = l === 'ms' ? 'ms' : 'en';
  store.set(LANG_KEY, lang === 'ms' ? 'ms' : '');
  Ear.setLang(lang);
  if (!panel) return;
  $$('[data-lang]', panel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  input.placeholder = T[lang].place;
  $('.symc-send', panel).setAttribute('aria-label', T[lang].send);
  $('#symc-new span').textContent = T[lang].newChat; $('#symc-new').title = T[lang].newChat; $('.symc-voice-t', panel).textContent = lang === 'ms' ? 'Suara' : 'Voice';
  $('.symc-fine', panel).textContent = T[lang].talkHint;
  $('.symc-wake-t', panel).textContent = T[lang].wakeT; $('.symc-pat-t', panel).textContent = T[lang].patientT;
  paintClassBtn();
  paintVoiceBtn();
  if ($('#symc-voices', panel) && !$('#symc-voices', panel).hidden) voicesOpen(true);
  paintChips();
  setState(state);
  Ear.setLang(lang); earPaint();
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
  if (capturing) Ear.cancel();
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
    '<button type="button" class="linkbtn symc-vpick" id="symc-vpick" aria-haspopup="dialog" aria-expanded="false" aria-label="Her voice">' + icon('volume') + '<span></span></button>' +
    '<button type="button" class="linkbtn symc-new" id="symc-new" title="New chat">' + icon('refresh') + '<span></span></button></div>' +
    '<div class="symc-opts symc-ears"><label class="symc-voice"><button type="button" class="lsw teal" role="switch" aria-checked="false" data-switch="wake" aria-label="Hey Symphony: listen for my name"><span class="lsw-handle"></span></button><span class="symc-wake-t">Hey Symphony</span></label>' +
    '<label class="symc-voice"><button type="button" class="lsw violet" role="switch" aria-checked="true" data-switch="patient" aria-label="Patient listening"><span class="lsw-handle"></span></button><span class="symc-pat-t">Patient</span></label>' +
    '<button type="button" class="linkbtn symc-new symc-class-b" id="symc-class-b">' + icon('smile') + '<span>Our class</span></button></div>' +
    '<div class="symc-stage" aria-hidden="true"><div class="sam"><span class="sam-tri"></span><div class="sam-line"><span class="sam-word" id="sam-word"></span><span class="sam-bar" id="sam-bar"></span></div></div></div>' +
    '<div class="symc-log" id="symc-log" aria-live="polite"></div>' +
    '<div class="symc-class" id="symc-class" hidden></div>' +
    '<div class="symc-class symc-voices" id="symc-voices" hidden role="dialog" aria-label="Her voice"></div>' +
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
  $('#symc-class-b').addEventListener('click', () => { const box = $('#symc-class', panel); classOpen(box.hidden); });
  $('#symc-vpick').addEventListener('click', () => { const box = $('#symc-voices', panel); voicesOpen(box.hidden); });
  Voice.Human.onChange(() => { paintVoiceBtn(); const box = $('#symc-voices', panel); if (box && !box.hidden) voicesOpen(true); });
  panel.addEventListener('click', (e) => {
    if (voicesAct(e)) return;
    const pc = e.target.closest('[data-pc]');
    if (pc) { classAct(pc.dataset.pc); return; }
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
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (!$('#symc-voices', panel).hidden) { voicesOpen(false); return; } if (!$('#symc-class', panel).hidden) { classOpen(false); return; } closeChat(); } });
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
  bus.on('who', (w) => { closeChat(); history.length = 0; if (logEl) logEl.innerHTML = ''; greeted = false; opened = false; adminDigest = ''; adminSpoken = ''; if (!w || !w.role) Ear.setWake(false); else if (settings.wake) wakeSwitch(true); earPaint(); });
  bus.on('wake', (on) => wakeSwitch(on));
  bus.on('patient', (v) => Ear.setPatient(v));
  bus.on('pupils', () => paintClassBtn());
  Ear.setPatient(settings.patient); Ear.setLang(lang);
  Ear.on('state', earPaint); Ear.on('wake', onWake); Ear.on('heard', onHeard); Ear.on('question', onQuestion); Ear.on('off', onEarOff);
  if (settings.wake) micGranted().then((ok) => { if (ok) wakeSwitch(true); else earPaint(); });
}
