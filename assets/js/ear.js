/* Symphony's ear: one speech recogniser for the whole site.

   capture() takes one question and waits for a real pause before deciding the speaker has finished (1.8 seconds, or
   3.5 with Patient listening), so nobody is cut off mid-thought; Stop sends it at once.

   Wake mode listens in the background for "Hey Symphony" (or a sentence that starts with "Symphony"). Everything
   else it hears is thrown away at once: it is never shown, kept or sent to the engine. After she answers, Patient
   listening keeps her ear open for a few seconds for a follow-up, and she only takes it if it is said to her (a
   question, a request, or her name); classroom chatter is ignored.

   Where the browser can turn speech into text on the device itself (newer Chrome), it does; otherwise the browser's
   own speech service does. The ear pauses while Symphony speaks (so she never answers herself) and while the tab is
   hidden, and wake mode switches itself off after 45 minutes without hearing her name. */
import { Voice } from './fx/voice.js?v=cdc164df';

const SRC = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const NAME = '(?:symphon(?:y|ie|ies|ee)|simfon(?:i|y)|symfon(?:i|y)|sinfoni(?:a)?|simphony|symphani|sym phony|sim phony)';
const WAKE = new RegExp('(?:^|[.!?]\\s+|\\b(?:hey|hi|hello|okay|ok|oi|hai|helo|halo|eh|yo|dear)[,\\s]+)' + NAME + '\\b[\\s,.!?]*', 'i');
const DIRECTED = /^(?:what|what's|whats|why|how|how's|who|who's|whose|when|where|which|can|could|would|will|is|are|was|were|do|does|did|should|tell|explain|show|give|open|close|go|next|previous|back|pick|choose|start|stop|set|make|read|say|repeat|again|remember|forget|reveal|add|save|list|find|search|play|turn|switch|please|thank|thanks|and|also|so|now|apa|kenapa|mengapa|bagaimana|siapa|bila|mana|boleh|tolong|buka|tutup|pilih|ingat|tunjuk|mula|terima kasih)\b|\b(?:you|your|symphony)\b|\?\s*$/i;
const PAUSE = { normal: 1800, patient: 3500 }, FIRST_WORDS = 8000, LONGEST = 60000, SLEEP = 45 * 60000;

export function findWake(t) {
  const s = String(t || '').trim(), m = WAKE.exec(s);
  return m ? { rest: s.slice(m.index + m[0].length).trim() } : null;
}
export const directed = (t) => DIRECTED.test(String(t || '').trim());
const tidy = (t) => String(t || '').replace(/\s+/g, ' ').trim();

const fns = {};
const emit = (ev, a) => (fns[ev] || []).forEach((fn) => { try { fn(a); } catch (e) { console.error(e); } });

let rec = null, starting = false, wakeOn = false, paused = false, lang = 'en-GB', patient = true;
let armed = null, ignoreBefore = 0, lastName = Date.now(), sessionAt = 0, quickEnds = 0, fails = 0, restartT = 0, local = null;

/* ---------------- the recogniser ---------------- */
async function useDevice(r) {
  // On-device speech (Chrome): nothing leaves the computer. Only used when the language is already installed.
  try {
    if (local === false || !('processLocally' in r) || typeof SRC.available !== 'function') return;
    const st = await SRC.available({ langs: [r.lang], processLocally: true });
    if (st === 'available') { r.processLocally = true; local = true; return; }
    local = false;
    if (st === 'downloadable' && typeof SRC.install === 'function') SRC.install({ langs: [r.lang], processLocally: true }).catch(() => {});
  } catch (e) { local = false; }
}
async function start() {
  if (!SRC || rec || starting || paused || document.hidden || (!wakeOn && !armed)) return;
  starting = true;
  let r;
  try { r = new SRC(); r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1; } catch (e) { starting = false; return; }
  await useDevice(r);
  if (rec || paused || (!wakeOn && !armed)) { starting = false; return; }
  r.onstart = () => { sessionAt = Date.now(); emit('state', state()); };
  r.onresult = (e) => { if (rec === r) heard(e); };
  r.onerror = (e) => { if (rec === r) trouble(e.error); };
  r.onend = () => { if (rec === r) ended(); };
  rec = r; ignoreBefore = 0;
  if (armed) { armed.prefix = armed.text || ''; armed.base = 0; armed.wake = false; }   // a new session: keep what was said
  try { r.start(); } catch (e) { rec = null; }
  starting = false;
  emit('state', state());
}
function halt() { const r = rec; if (!r) return; try { r.abort(); } catch (e) { /* ignore */ } }
function later(ms) { clearTimeout(restartT); restartT = setTimeout(start, ms); }
function ended() {
  rec = null;
  if (armed && armed.resolve && !armed.waiting) done();          // the browser stopped listening: send what we have
  const short = Date.now() - sessionAt < 1500;
  quickEnds = short ? quickEnds + 1 : 0;
  emit('state', state());
  if ((wakeOn || armed) && !paused) later(quickEnds > 2 ? 3000 : 300);
}
function trouble(err) {
  if (err === 'aborted' || err === 'no-speech') return;
  if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
    const was = wakeOn;
    wakeOn = false;
    if (armed) done(err === 'audio-capture' ? 'nomic' : 'denied');
    if (was) emit('off', err === 'audio-capture' ? 'nomic' : 'denied');
    return;
  }
  if (err === 'network' || err === 'language-not-supported') {
    fails++;
    if (armed && armed.resolve) done('network');
    if (fails >= 3 && wakeOn) { wakeOn = false; emit('off', 'network'); }
  }
}

/* ---------------- what it hears ---------------- */
function textFrom(all, a) {
  const first = all[a.base] || '', w = findWake(first);          // "Hey Symphony" itself is never part of the question
  if (w) a.named = true;                                          // said to her by name: never mistaken for chatter
  return tidy([a.prefix || '', w ? w.rest : first].concat(all.slice(a.base + 1)).join(' '));
}
function heard(e) {
  const all = Array.from(e.results).map((r) => (r[0] && r[0].transcript) || '');
  if (armed) {
    if (armed.base == null) armed.base = e.resultIndex;
    const t = textFrom(all, armed);
    armed.text = t;
    if (armed.from === 'follow' && armed.named) { armed.from = 'wake'; lastName = Date.now(); emit('wake', t); }   // her name again: a fresh question
    if (t) { armed.waiting = false; emit('heard', t); if (armed.onInterim) armed.onInterim(t); }
    quiet();
    return;
  }
  if (!wakeOn) return;
  for (let i = Math.max(e.resultIndex, ignoreBefore); i < all.length; i++) {
    if (!findWake(all[i])) continue;
    lastName = Date.now();
    armed = { base: i, wake: true, text: '', waiting: true, from: 'wake', at: Date.now() };
    const t = textFrom(all, armed);
    armed.text = t;
    emit('wake', t);
    if (t) { armed.waiting = false; emit('heard', t); }
    quiet();
    return;
  }
}
/* The question ends after a real pause, not at the first breath. */
function quiet() {
  const a = armed;
  if (!a) return;
  clearTimeout(a.timer);
  const wait = a.waiting ? (a.from === 'follow' ? Math.max(0, a.until - Date.now()) : FIRST_WORDS) : PAUSE[patient ? 'patient' : 'normal'];
  a.timer = setTimeout(() => { if (armed === a) done(); }, Date.now() - a.at > LONGEST ? 0 : wait);
}
function done(error) {
  const a = armed;
  if (!a) return;
  clearTimeout(a.timer);
  armed = null;
  ignoreBefore = Infinity;                                   // words already heard are never looked at again
  if (rec) { const r = rec; try { r.stop(); } catch (e) { /* ignore */ } }   // a fresh start forgets them
  const text = tidy(a.text);
  if (a.resolve) { a.resolve({ text, error: error || (text ? '' : 'nothing') }); emit('state', state()); return; }
  if (a.from === 'follow' && !a.named && !directed(text)) { emit('state', state()); return; }   // chatter, not a question for her
  if (text || a.from === 'wake') emit('question', { text, from: a.from });
  emit('state', state());
}

/* ---------------- public ---------------- */
function state() { return { wake: wakeOn, listening: !!rec, armed: !!armed, paused, local: local === true }; }
export const Ear = {
  supported: !!SRC,
  on(ev, fn) { (fns[ev] = fns[ev] || []).push(fn); },
  get state() { return state(); },
  get wake() { return wakeOn; },
  setLang(l) { const nl = l === 'ms' ? 'ms-MY' : 'en-GB'; if (nl === lang) return; lang = nl; local = null; if (rec) halt(); },
  setPatient(v) { patient = !!v; },
  /* Listen in the background for "Hey Symphony". */
  setWake(on) {
    on = !!on && !!SRC;
    if (on === wakeOn) return;
    wakeOn = on; fails = 0; lastName = Date.now();
    if (on) { paused = Voice.speaking; start(); }
    else { if (armed && !armed.resolve) { clearTimeout(armed.timer); armed = null; } if (!armed) halt(); }
    emit('state', state());
  },
  /* One question, with a patient pause at the end. Resolves { text, error }. */
  capture(o) {
    o = o || {};
    if (!SRC) return Promise.resolve({ text: '', error: 'unsupported' });
    if (armed && armed.resolve) armed.resolve({ text: '', error: 'replaced' });
    if (armed) clearTimeout(armed.timer);
    paused = false;
    return new Promise((resolve) => {
      armed = { base: null, wake: false, text: '', waiting: true, from: 'tap', at: Date.now(), resolve, onInterim: o.onInterim };
      if (rec) { armed.base = null; ignoreBefore = Infinity; halt(); } else start();
      quiet();
      emit('state', state());
    });
  },
  /* Send what has been said so far (the speaker pressed Stop: they have finished). */
  finish() { if (armed) done(); },
  cancel() { if (armed && armed.resolve) { const a = armed; armed = null; clearTimeout(a.timer); a.resolve({ text: '', error: 'cancelled' }); } else if (armed) { clearTimeout(armed.timer); armed = null; } emit('state', state()); },
  /* After she answers: a few seconds for a follow-up, without her name, if it is said to her. */
  follow(ms) {
    if (!wakeOn || armed || !ms) return;
    armed = { base: null, wake: false, text: '', waiting: true, from: 'follow', at: Date.now(), until: Date.now() + ms };
    if (rec) { ignoreBefore = Infinity; halt(); } else start();
    quiet();
    emit('state', state());
  }
};

/* She never listens to herself: the ear pauses while she speaks. */
Voice.onSpeaking((on) => {
  if (on) { paused = true; if (rec && !(armed && armed.resolve)) halt(); }
  else { paused = false; if (wakeOn || armed) later(500); }
  emit('state', state());
});
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); else if (wakeOn || armed) later(300); });
  setInterval(() => { if (wakeOn && !armed && Date.now() - lastName > SLEEP) { Ear.setWake(false); emit('off', 'sleep'); } }, 60000);
}
