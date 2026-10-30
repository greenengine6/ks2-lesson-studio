/* Symphony's voice: the only voice on the site. Everything read aloud (Symphony's chat, Brain Break, Sound Journey,
   Wonder Window and the "Hear it" greetings) is spoken here, so it is always her: a girl's voice, in English or
   Malay. It picks the best female voice the device has (a girl's voice first where there is one, such as Maisie on
   Edge) and never a man's voice while a woman's or girl's voice exists.

   Text is spoken one sentence at a time: the next starts only when the last one has finished, and nothing is cut
   off while it is still being spoken. Phones can still break speech off by themselves (the microphone handing the
   sound back, another sound, a notification), often without saying so, so each sentence is watched while it plays:
   if the voice goes quiet or its words stop moving, she carries on from the word she had reached. If the device
   cannot speak at all, or reading aloud is off, the words are still timed one by one, so Symphony's stage can show
   them.

   Her human voice (human.js): when the school's voice key is on this device, each sentence is spoken with a natural
   human voice made by a voice service, the next sentence being made while this one plays. If the service cannot
   answer in time, that sentence uses the device's voice, so she never goes quiet. Anything that names a pupil from
   the class list always uses the device's voice, so names never leave the device. Teachers choose her voice (a human
   voice, or one of this device's best voices) and her pace in Symphony's panel. */
import { fracWords } from '../fractions.js?v=49509700';
import * as Human from './human.js?v=49509700';

const OK = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const synth = OK ? window.speechSynthesis : null;
const MAXP = 160;                      // characters per spoken part (some browsers stop long parts after ~15 s)

/* ---------------- choosing her voice ---------------- */
const words = (list) => new RegExp('\\b(' + list.join('|') + ')\\b', 'i');
const GIRL = words(['maisie', 'ana']);
const FEMALE = words([
  // English: Edge natural voices, Google, Apple, Windows
  'libby', 'sonia', 'mia', 'hollie', 'bella', 'abbi', 'olivia', 'jenny', 'aria', 'emma', 'ava', 'michelle', 'natasha', 'annette', 'carly', 'elsie', 'freya',
  'joanne', 'kim', 'tina', 'clara', 'molly', 'neerja', 'emily', 'leah', 'luna', 'rosa', 'yan', 'asilia', 'ezinne', 'imani', 'female', 'google us english',
  'martha', 'kate', 'serena', 'stephanie', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'nicky', 'allison', 'susan', 'zoe', 'catherine', 'isha',
  'joelle', 'noelle', 'hazel', 'zira', 'heera', 'linda', 'eva',
  // Malay and Indonesian
  'yasmin', 'amira', 'gadis', 'damayanti', 'google bahasa indonesia',
  // other languages, for the "Hear it" greetings
  'kyoko', 'nanami', 'aoi', 'mayu', 'shiori', 'haruka', 'ayumi', 'yuna', 'sunhi', 'seoyeon', 'heami', 'tingting', 'xiaoxiao', 'xiaoyi', 'xiaochen', 'xiaohan',
  'xiaomo', 'xiaoxuan', 'meijia', 'sinji', 'hiumaan', 'hsiaochen', 'hsiaoyu', 'huihui', 'yaoyao', 'hanhan', 'tracy', 'amelie', 'amélie', 'audrey', 'aurelie',
  'denise', 'eloise', 'celeste', 'coralie', 'julie', 'hortense', 'sylvie', 'anna', 'petra', 'marlene', 'katja', 'hedda', 'amala', 'elke', 'gisela', 'louisa',
  'maja', 'tanja', 'ingrid', 'helena', 'laura', 'elvira', 'monica', 'mónica', 'paulina', 'dalia', 'marisol', 'sabina', 'lucia', 'alice', 'federica', 'isabella',
  'elsa', 'palmira', 'luciana', 'francisca', 'joana', 'fernanda', 'raquel', 'thalita', 'maria', 'milena', 'svetlana', 'dariya', 'ekaterina', 'katya', 'irina',
  'zuzana', 'vlasta', 'sara', 'christel', 'melina', 'athina', 'carmit', 'hila', 'lekha', 'swara', 'kalpana', 'aditi', 'lana', 'gabrijela', 'tünde', 'noemi',
  'kanya', 'premwadee', 'achara', 'yelda', 'emel', 'seda', 'lesya', 'polina', 'linh', 'hoaimy', 'montserrat', 'alva', 'sofie', 'hillevi', 'nora', 'pernille',
  'iselin', 'zosia', 'agnieszka', 'ewa', 'ioana', 'alina', 'satu', 'noora', 'selma', 'ellen', 'colette', 'fenna', 'dena', 'zariyah', 'salma', 'hoda', 'mariam',
  'laila', 'amany', 'fatima', 'rana', 'sana', 'uzma', 'gul'
]);
const PLAIN_FEMALE = words(['flo', 'sandy', 'shelley']);   // older robotic voices: only if nothing better
const MALE = words([
  'male', 'man', 'boy', 'daniel', 'arthur', 'oliver', 'alex', 'aaron', 'tom', 'gordon', 'rishi', 'david', 'mark', 'george', 'ryan', 'thomas', 'guy', 'osman',
  'ardi', 'andika', 'william', 'alfie', 'elliot', 'ethan', 'noah', 'james', 'brian', 'christopher', 'eric', 'roger', 'steffan', 'andrew', 'davis', 'jason',
  'tony', 'liam', 'connor', 'duncan', 'luke', 'mitchell', 'chilemba', 'abeo', 'elimu', 'wayne', 'prabhat', 'ravi', 'hemant', 'kumar', 'prakash', 'madhur',
  'ken', 'sam', 'neil', 'darren', 'lee', 'evan', 'nathan', 'eddy', 'reed', 'rocko', 'otoya', 'ichiro', 'keita', 'kangkang', 'yunyang', 'yunxi', 'yunjian',
  'yunhao', 'injoon', 'hyunsu', 'pavel', 'dmitry', 'yuri', 'maxim', 'xander', 'majed', 'naayf', 'hamed', 'jorge', 'juan', 'diego', 'carlos', 'pablo', 'raul',
  'alvaro', 'luca', 'cosimo', 'giorgio', 'paul', 'stefan', 'conrad', 'killian', 'henri', 'remy', 'antoine', 'jean', 'nicolas', 'antonio', 'rafael', 'duarte',
  'filip', 'jakub', 'marek', 'lukas', 'magnus', 'mattias', 'finn', 'jon', 'niwat', 'tolga', 'ahmet', 'namminh'
]);
const NOVELTY = words(['albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'good news', 'jester', 'organ', 'superstar', 'trinoids', 'whisper',
  'wobble', 'zarvox', 'deranged', 'hysterical', 'princess', 'grandma', 'grandpa', 'junior', 'ralph', 'fred', 'bruce', 'kathy', 'agnes', 'vicki', 'victoria']);

function kindOf(v) {
  const n = (v && v.name) || '';
  if (!v) return 'unknown';
  if (NOVELTY.test(n)) return 'never';
  if (GIRL.test(n)) return 'girl';
  if (PLAIN_FEMALE.test(n)) return 'plain';
  if (FEMALE.test(n)) return 'female';
  if (MALE.test(n)) return 'male';
  return 'unknown';
}
const KIND_SCORE = { girl: 95, female: 85, unknown: 55, plain: 30, male: 5 };
const PITCH = { girl: 1, female: 1, unknown: 1.03, plain: 1, male: 1.3 };   // real voices keep their own pitch: shifting it is what sounds robotic

function wantOf(lang) {
  const l = String(lang || 'en-GB').toLowerCase().replace('_', '-');
  const b = l.split('-')[0], r = l.split('-')[1] || '';
  if (b === 'ms' || b === 'zsm' || b === 'may') return { base: 'ms', region: 'my', tag: 'ms-MY', key: 'ms' };
  if (!b || b === 'en') return { base: 'en', region: r || 'gb', tag: 'en-' + (r || 'gb').toUpperCase(), key: 'en-' + (r || 'gb') };
  return { base: b, region: r, tag: l, key: l };
}
function langOf(v) { const l = String((v && v.lang) || '').toLowerCase().replace('_', '-'); return { b: l.split('-')[0], r: l.split('-')[1] || '' }; }
function score(v, w) {
  const k = kindOf(v);
  if (k === 'never') return -1;
  const { b, r } = langOf(v);
  let lg;
  if (w.base === 'ms') lg = b === 'ms' ? 40 : b === 'id' ? 22 : b === 'en' ? (r === 'gb' ? 1 : 0) : -1;
  else if (w.base === 'en') lg = b !== 'en' ? -1 : r === w.region ? 8 : r === 'gb' ? 6 : /^(ie|au|nz|za)$/.test(r) ? 4 : r === 'us' ? 2 : 1;
  else lg = b === w.base ? (r && r === w.region ? 42 : 40) : b === 'en' ? (r === 'gb' ? 1 : 0) : -1;
  if (lg < 0) return -1;
  return KIND_SCORE[k] + lg + quality(v);
}

/* How natural a device voice sounds: neural and premium voices first, the old compact ones last. */
function quality(v) {
  const n = (v && v.name) || '', u = (v && v.voiceURI) || '';
  if (/eloquence|super-?compact/i.test(u)) return -10;
  return (/\b(natural|neural)\b/i.test(n) ? 16 : 0) + (/premium/i.test(n + ' ' + u) ? 15 : /enhanced/i.test(n + ' ' + u) ? 11 : 0) + (/online/i.test(n) ? 4 : 0) +
    (/google/i.test(n) ? 3 : 0) + (/compact/i.test(u) ? -2 : 0) + (v && v.localService ? 2 : 0);
}

let voices = [], cache = {}, waited = 0;
const bad = new Set(), marks = new Set();         // voices that failed; voices that report each word as they say it
const vid = (v) => (v && (v.voiceURI || v.name)) || '';
function loadVoices() { try { voices = (synth && synth.getVoices()) || []; } catch (e) { voices = []; } cache = {}; return voices; }
if (OK) {
  loadVoices();
  try { synth.addEventListener('voiceschanged', loadVoices); } catch (e) { try { synth.onvoiceschanged = loadVoices; } catch (er) { /* ignore */ } }
}
/* Chrome lists its voices a moment after the page opens: wait for them (once), so her voice is right first time. */
let readyP = null;
function ready() {
  if (!OK || voices.length || Date.now() - waited < 30000) return Promise.resolve();
  if (!readyP) readyP = new Promise((res) => {
    let n = 0;
    const t = setInterval(() => { if (loadVoices().length || ++n >= 16) { clearInterval(t); readyP = null; if (!voices.length) waited = Date.now(); res(); } }, 100);
  });
  return readyP;
}
export function pick(lang) {
  if (!OK) return null;
  if (!voices.length) loadVoices();
  const w = wantOf(lang);
  if (w.key in cache) return cache[w.key];
  const c = (w.base === 'en' || w.base === 'ms') ? Human.choice(w.base) : '';
  if (c.startsWith('d:')) {
    const mine = voices.find((v) => vid(v) === c.slice(2) && !bad.has(vid(v)) && score(v, w) >= 0 && (langOf(v).b === w.base || (w.base === 'ms' && langOf(v).b === 'id')));
    if (mine) { cache[w.key] = mine; return mine; }
  }
  let best = null, top = -1;
  voices.forEach((v) => { if (bad.has(vid(v))) return; const s = score(v, w); if (s > top) { top = s; best = v; } });
  cache[w.key] = best;
  return best;
}
/* This device's best voices for a language, for the voice picker: women's and girls' voices, most natural first. */
export function devices(lang, n) {
  if (!OK) return [];
  if (!voices.length) loadVoices();
  const w = wantOf(lang);
  const seen = new Set();
  return voices.filter((v) => !bad.has(vid(v)) && score(v, w) >= 0 && (langOf(v).b === w.base || (w.base === 'ms' && langOf(v).b === 'id')) && /^(girl|female|unknown)$/.test(kindOf(v)))
    .sort((a, b) => score(b, w) - score(a, w))
    .filter((v) => { const k = String(v.name).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, n || 6)
    .map((v) => ({ id: vid(v), name: String(v.name).replace(/\s*\((Natural|Enhanced|Premium)\)/i, ' ($1)').replace(/^Microsoft\s+/i, '').replace(/\s+Online\s*/i, ' ').replace(/\s+-\s+.*$/, '').trim(), lang: v.lang, natural: quality(v) >= 11 }));
}
export function hasVoice(lang) {
  if (!OK) return false;
  if (!voices.length) loadVoices();
  const w = wantOf(lang);
  return voices.some((v) => { const b = langOf(v).b; return b === w.base || (w.base === 'ms' && b === 'id'); });
}

/* ---------------- speaking, one part at a time ---------------- */
function partsOf(text) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (!flat) return [];
  const pieces = [];
  (flat.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g) || [flat]).forEach((s) => {
    s = s.trim();
    while (s.length > MAXP) {
      const head = s.slice(0, MAXP);
      let cut = Math.max(head.lastIndexOf(', '), head.lastIndexOf('; '), head.lastIndexOf(': '), head.lastIndexOf(' – '), head.lastIndexOf(' - '));
      if (cut < 40) cut = head.lastIndexOf(' ');
      if (cut < 20) cut = MAXP - 1;
      pieces.push(s.slice(0, cut + 1).trim());
      s = s.slice(cut + 1).trim();
    }
    if (s) pieces.push(s);
  });
  const parts = [];                                   // a very short sentence joins the next one, so the speech flows
  pieces.forEach((s) => { const l = parts.length - 1; if (l >= 0 && parts[l].length < 30 && parts[l].length + 1 + s.length <= MAXP) parts[l] += ' ' + s; else parts.push(s); });
  return parts;
}
const wordsOf = (t) => String(t).split(/\s+/).filter(Boolean);
const wordMs = (w, rate) => (170 + Math.min(14, w.length) * 34) / Math.max(0.5, rate || 1);
const estimate = (p) => wordsOf(p.text).reduce((a, w) => a + wordMs(w, p.job.rate), 0);
const call = (fn, a) => { if (typeof fn === 'function') { try { fn(a); } catch (e) { /* ignore */ } } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const starts = (t) => { const out = [], re = /\S+/g; let m; while ((m = re.exec(t))) out.push(m.index); return out; };

const Q = [];
const GAP = 250;                                      // phones ignore speech that starts straight after a cancel
let cur = null, unlocked = false, lastCancel = 0, blipAt = 0, simT = 0, holdUntil = 0;
export const stats = { parts: 0, breaks: 0, mutes: 0, human: 0, fallback: 0 };

/* Whether Symphony is speaking out loud right now, for the sound engine to turn everything else down. */
const speakFns = [];
let speakingNow = false, speakOffT = 0;
function setSpeaking(v) {
  clearTimeout(speakOffT);
  if (v) { if (!speakingNow) { speakingNow = true; speakFns.forEach((fn) => call(fn, true)); } return; }
  speakOffT = setTimeout(() => { if (speakingNow && !cur && !Q.length) { speakingNow = false; speakFns.forEach((fn) => call(fn, false)); } }, 400);
}
export function onSpeaking(fn) { speakFns.push(fn); }

function hushBrowser() {
  if (!OK) return;
  try { synth.cancel(); lastCancel = Date.now(); } catch (e) { /* ignore */ }
}
function finish(job, ok) {
  if (job.over) return;
  job.over = true;
  if (ok && job.mute) call(job.onTrouble);
  job.resolve(ok);
}
function stopSim() { clearTimeout(simT); simT = 0; }
function clear(p) { clearTimeout(p.wd); clearTimeout(p.capT); clearTimeout(p.simT); clearInterval(p.hc); p.u = null; if (p.human) endHuman(p); }

function pump() {
  if (cur) return;
  let p = Q.shift();
  while (p && p.job.over) p = Q.shift();
  if (!p) { setSpeaking(false); return; }
  cur = p;
  stats.parts++;
  ahead(p);
  if (p.job.silent || p.job.mute) simulate(p, true);
  else if (humanOK(p)) speakHuman(p);
  else if (!OK) simulate(p, true);
  else speakPart(p);
}
function done(p) {
  if (cur !== p) return;
  clear(p); stopSim();
  cur = null;
  p.job.left -= 1;
  if (p.job.left <= 0) finish(p.job, true);
  setTimeout(pump, 0);
}
function mute(p) { clear(p); if (!p.job.mute) stats.mutes++; p.job.mute = true; simulate(p, true); }
/* Show the words one by one at a natural pace: alongside the speech when the browser does not report each word,
   or on their own when there is no sound. */
function simulate(p, owns) {
  stopSim();
  if (owns && !p.job.begun) { p.job.begun = true; call(p.job.onStart); }
  const ws = wordsOf(p.text);
  let i = 0;
  const step = () => {
    if (cur !== p) return;
    if (i >= ws.length) { simT = 0; if (owns) done(p); return; }
    const w = ws[i++];
    call(p.job.onWord, w);
    simT = setTimeout(step, wordMs(w, p.job.rate));
  };
  step();
}
function started(p) {
  if (p.started) return;
  p.started = true;
  p.t0 = p.markAt = Date.now();
  p.idle = 0;
  clearTimeout(p.wd);
  if (!p.job.begun) { p.job.begun = true; call(p.job.onStart); }
  p.capT = setTimeout(() => done(p), estimate(p) * 2.2 + 5000);           // never wait for ever if the end is not reported
  if (marks.has(vid(p.voice))) p.simT = setTimeout(() => { if (cur === p && !p.bound) simulate(p, false); }, 600);
  else simulate(p, false);                                               // time the words until the voice reports its own
  p.hc = setInterval(() => check(p), 250);
}
/* Watch the voice while it speaks. Phones can cut speech off without saying so (another sound, the microphone,
   a notification). If the browser goes quiet without finishing, or the words stop moving, carry on from the word
   it had reached. */
function check(p) {
  if (cur !== p || !p.u || document.hidden) return;
  let speaking = true, pending = false;
  try { speaking = !!synth.speaking; pending = !!synth.pending; } catch (e) { /* ignore */ }
  p.idle = !speaking && !pending ? (p.idle || 0) + 1 : 0;
  if (p.idle >= 4 || (p.bound && Date.now() - p.markAt > 2500)) broke(p);
}
const left = (p) => wordsOf(p.text.slice(p.at || 0)).length;            // words still to say, from the last one reached
function broke(p) {
  if (cur !== p) return;
  if (!p.bound) {                                                         // no word marks from this voice: judge by time
    const ws = starts(p.text), f = Math.min(1, (Date.now() - (p.t0 || Date.now())) / Math.max(1, estimate(p)));
    p.at = ws[Math.max(0, Math.floor(f * ws.length) - 1)] || 0;
  }
  if (left(p) <= 1 || (p.resumes || 0) >= 3) { done(p); return; }
  p.resumes = (p.resumes || 0) + 1;
  stats.breaks++;
  const rest = p.text.slice(p.at || 0).trim();
  clear(p); stopSim(); hushBrowser();
  Object.assign(p, { text: rest, at: 0, started: false, bound: false, retried: false });
  speakPart(p);
}
async function speakPart(p) {
  await ready();
  if (cur !== p) return;
  const wait = Math.max(GAP - (Date.now() - lastCancel), holdUntil - Date.now());
  if (wait > 0) { await sleep(wait); if (cur !== p) return; }
  const v = pick(p.job.lang), k = kindOf(v);
  let u;
  try { u = new SpeechSynthesisUtterance(p.text); } catch (e) { mute(p); return; }
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = wantOf(p.job.lang).tag;
  u.rate = Math.min(1.6, Math.max(0.5, (p.job.rate || 1) * Human.speed()));
  u.pitch = PITCH[k] || 1.1;
  u.volume = 1;
  p.u = u; p.voice = v; p.started = false; p.bound = false; p.at = 0;
  const mine = () => cur === p && p.u === u;
  u.onstart = () => { if (mine()) started(p); };
  u.onboundary = (e) => {
    if (!mine() || (e && e.name && e.name !== 'word')) return;
    started(p);
    p.bound = true; p.markAt = Date.now(); p.at = (e && e.charIndex) || 0;
    marks.add(vid(p.voice));
    if (simT) stopSim();
    const m = /^\S+/.exec(p.text.slice(p.at));
    if (m) call(p.job.onWord, m[0]);
  };
  u.onend = () => {
    if (!mine()) return;
    if (p.bound && left(p) >= 3) { broke(p); return; }                  // it stopped early: the phone was interrupted
    done(p);
  };
  u.onerror = (e) => { if (!mine()) return; if (p.started) broke(p); else failed(p, (e && e.error) || 'error'); };
  try { if (synth.paused) synth.resume(); } catch (e) { /* ignore */ }
  setSpeaking(true);
  try { synth.speak(u); } catch (e) { failed(p, 'speak'); return; }
  p.wd = setTimeout(() => stalled(p, u), v && v.localService === false ? 6000 : 3000);
}
function stalled(p, u) {
  if (cur !== p || p.u !== u || p.started) return;
  let talking = false;
  try { talking = synth.speaking && !synth.pending; } catch (e) { talking = false; }
  if (talking) { started(p); return; }                                   // it is speaking; the browser just did not say so
  if (!p.retried) {
    p.retried = true; clear(p); hushBrowser();
    if (p.voice && p.voice.localService === false) { bad.add(vid(p.voice)); cache = {}; }   // an online voice that did not answer: use the next best
    speakPart(p); return;
  }
  mute(p);                                                               // no sound right now: show the words instead
}
function failed(p, err) {
  clear(p);
  if (err === 'not-allowed') { mute(p); return; }                         // the browser wants a tap first
  if (!p.retried) {
    p.retried = true;
    if (p.voice && /network|synthesis|voice|language|unavailable/.test(err)) { bad.add(vid(p.voice)); cache = {}; }
    setTimeout(() => { if (cur === p) speakPart(p); }, 120);
    return;
  }
  mute(p);
}

/* ---------------- her human voice ---------------- */
let privateFn = null;
export function setPrivate(fn) { privateFn = fn; }
const isPrivate = (p) => { if (p.job.private) return true; try { return !!(privateFn && privateFn(p.text)); } catch (e) { return true; } };
const styleOf = (job) => job.style || (job.rate <= 0.89 ? 'calm' : job.rate < 0.97 ? 'story' : 'chat');
function humanOK(p) { return !p.human && !p.devicePart && !!Human.humanFor(p.job.lang) && !isPrivate(p); }
/* Start making this sentence and the next two, so each one is ready when the one before it ends. */
function ahead(p) {
  if (p.job.silent) return;
  [p].concat(Q.slice(0, 2)).forEach((x) => { if (!x.job.over && !x.job.silent && !x.job.mute && humanOK(x) && !x.blobP) { x.blobP = Human.prepare(x.text, x.job.lang, styleOf(x.job)); x.blobP.catch(() => {}); } });
}
let audio = null, audioUnlocked = false;
function audioEl() {
  if (!audio) { audio = new Audio(); audio.preload = 'auto'; audio.setAttribute('playsinline', ''); try { audio.preservesPitch = true; } catch (e) { /* ignore */ } }
  return audio;
}
/* A silent moment of sound, played on the first tap, so the phone lets her voice play later without a tap. */
function silentURL() {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
function unlockAudio() {
  if (audioUnlocked || !Human.ready()) return;
  audioUnlocked = true;
  try { const a = audioEl(), u = silentURL(); a.src = u; const r = a.play(); if (r && r.catch) r.catch(() => { audioUnlocked = false; }); setTimeout(() => URL.revokeObjectURL(u), 3000); } catch (e) { audioUnlocked = false; }
}
function endHuman(p) {
  clearInterval(p.ht); clearTimeout(p.hw);
  const a = audio;
  if (a && p.url && a.dataset.part === String(p.n)) { a.onplaying = a.onended = a.onerror = a.onpause = null; try { a.pause(); } catch (e) { /* ignore */ } }
  if (p.url) { const u = p.url; setTimeout(() => URL.revokeObjectURL(u), 1000); p.url = ''; }
  p.human = false;
}
/* This sentence in the device's voice instead (the service did not answer in time, or the phone would not play). */
function toDevice(p) {
  if (cur !== p) return;
  stats.fallback++;
  endHuman(p);
  p.devicePart = true;
  if (!OK) simulate(p, true); else speakPart(p);
}
let partN = 0;
async function speakHuman(p) {
  p.human = true; p.n = ++partN;
  const job = p.job;
  if (!p.blobP) { p.blobP = Human.prepare(p.text, job.lang, styleOf(job)); p.blobP.catch(() => {}); }
  p.hw = setTimeout(() => { if (cur === p && !p.started) toDevice(p); }, 9000);     // never wait long for the service
  let blob;
  try { blob = await p.blobP; } catch (e) { toDevice(p); return; }
  if (cur !== p || !p.human) return;
  const wait = holdUntil - Date.now();
  if (wait > 0) { await sleep(wait); if (cur !== p || !p.human) return; }
  const a = audioEl();
  p.url = URL.createObjectURL(blob);
  a.dataset.part = String(p.n);
  a.onplaying = () => {
    if (cur !== p || p.started) return;
    p.started = true; clearTimeout(p.hw);
    stats.human++;
    if (!job.begun) { job.begun = true; call(job.onStart); }
    timeWords(p, a);
  };
  a.onended = () => { if (cur === p) { flushWords(p); done(p); } };
  a.onerror = () => { if (cur === p && !p.started) toDevice(p); else if (cur === p) done(p); };
  a.src = p.url;
  try { a.playbackRate = Human.speed(); } catch (e) { /* ignore */ }
  setSpeaking(true);
  try { await a.play(); } catch (e) { if (cur === p && !p.started) toDevice(p); }
}
/* The words, shown as she says them: spread over the sound by length, with a little more time at punctuation. */
function timeWords(p, a) {
  const ws = wordsOf(p.text);
  const weight = ws.map((w) => w.length + 3 + (/[.!?…]["”’)]*$/.test(w) ? 7 : /[,;:]$/.test(w) ? 4 : 0));
  const total = weight.reduce((x, y) => x + y, 0) || 1;
  let acc = 0;
  p.wt = weight.map((x) => { const t = acc / total; acc += x; return t; });
  p.ws = ws; p.wi = 0;
  const tick = () => {
    if (cur !== p) { clearInterval(p.ht); return; }
    const d = a.duration && isFinite(a.duration) ? a.duration : estimate(p) / 1000;
    const f = Math.min(1, (a.currentTime || 0) / Math.max(0.2, d));
    while (p.wi < p.ws.length && p.wt[p.wi] <= f + 0.01) call(p.job.onWord, p.ws[p.wi++]);
  };
  tick();
  p.ht = setInterval(tick, 70);
}
function flushWords(p) { clearInterval(p.ht); if (p.ws) while (p.wi < p.ws.length) call(p.job.onWord, p.ws[p.wi++]); }

/* Say something in Symphony's voice. Resolves true when it has all been said, false if it was stopped.
   o: { lang: 'en' | 'ms' | any language tag, rate, style ('chat' | 'story' | 'calm', from the rate if not given),
   private (always the device's voice), silent (time the words without sound), onStart(), onWord(word),
   onTrouble() (the device would not speak, so the words were only shown) } */
export function say(text, o) {
  o = o || {};
  const parts = partsOf(fracWords(text, o.lang));
  return new Promise((resolve) => {
    if (!parts.length) { resolve(true); return; }
    const job = { lang: o.lang || 'en-GB', rate: o.rate || 1, style: o.style || '', private: !!o.private, silent: !!o.silent, onStart: o.onStart, onWord: o.onWord, onTrouble: o.onTrouble, left: parts.length, resolve, over: false, begun: false, mute: false };
    parts.forEach((t) => Q.push({ text: t, job }));
    if (!cur) pump();
    else if (Q.length <= 3) ahead(cur);
  });
}
export function stop() {
  const jobs = new Set(Q.map((p) => p.job));
  Q.length = 0;
  const had = cur;
  if (cur) { jobs.add(cur.job); clear(cur); cur = null; }
  stopSim();
  jobs.forEach((j) => finish(j, false));
  setSpeaking(false);
  let busy = false;
  try { busy = OK && (synth.speaking || synth.pending); } catch (e) { busy = false; }
  if (had || (busy && Date.now() - blipAt > 1500)) hushBrowser();   // leave the silent first-tap blip alone
}
/* Wait a moment before the next speech starts: after the microphone, phones need to switch their sound back. */
export function hold(ms) { holdUntil = Math.max(holdUntil, Date.now() + (ms || 0)); }
/* Phones only allow speech after a tap: speak a silent blip on the first tap anywhere, then all speech works. */
export function unlock() {
  unlockAudio();
  if (!OK || unlocked) return;
  unlocked = true;
  blipAt = Date.now();
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.rate = 2; u.lang = 'en-GB'; synth.speak(u); } catch (e) { /* ignore */ }
}
if (typeof window !== 'undefined') {
  const EV = ['pointerup', 'touchend', 'keydown', 'click'];
  const once = () => { unlock(); if ((!OK || unlocked) && (audioUnlocked || !Human.ready())) EV.forEach((t) => window.removeEventListener(t, once, true)); };
  EV.forEach((t) => window.addEventListener(t, once, { capture: true, passive: true }));
  Human.onChange(() => { cache = {}; if (Human.ready() && !audioUnlocked) EV.forEach((t) => window.addEventListener(t, once, { capture: true, passive: true })); });
}
if (OK) {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { if (synth.paused) synth.resume(); } catch (e) { /* ignore */ } } });
}

export const Voice = {
  get supported() { return OK || Human.ready(); },
  say, stop, pick, hasVoice, devices, unlock, hold, stats, onSpeaking, setPrivate, Human,
  get speaking() { return speakingNow; },
  get busy() { return !!cur || Q.length > 0; },
  /* The name of the voice she uses now for this language. */
  name(lang) {
    const h = Human.humanFor(lang || 'en-GB');
    if (h) { const v = Human.VOICES.find((x) => x.id === h); return v ? v.name : h; }
    const v = pick(lang || 'en-GB'); return v ? v.name : '';
  },
  human(lang) { return !!Human.humanFor(lang || 'en-GB'); },
  kind(lang) { return Human.humanFor(lang || 'en-GB') ? 'human' : kindOf(pick(lang || 'en-GB')); },
  /* Change her voice for a language: 'h:<human voice>' or 'd:<device voice id>'. */
  choose(lang, c) { Human.choose(lang, c); cache = {}; }
};
