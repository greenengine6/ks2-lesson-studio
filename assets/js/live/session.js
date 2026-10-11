/* The teacher's side of a live lesson: one per browser tab, started from the Join button in Present mode.

   It makes the join details (QR code, link and a 6-digit code), listens for pupils joining and answering, and tells
   every pupil's device what is happening now:
   - what is on the board (the slide's title), so pupils can follow along;
   - the slide's question, by itself: when a slide has a "how pupils respond" pill (vote, type it, show me, talk…),
     that question goes to every device as soon as the slide has been on the board for a moment. Coming back to a
     slide brings back the same question, with the answers already given. The teacher can switch this off in the
     Join screen; then a question only goes when she taps the pill;
   - a class moment the teacher opens (the pill's big screen, with a timer and Reveal), and class feedback.
   If the page reloads, the lesson carries on: the keys stay in this tab (sessionStorage) for up to 4 hours, and
   everything the pupils sent is read again from the relay. Pupils' names and answers stay on this screen only;
   nothing is saved to the device or sent to Rabinder's reports.
   One live lesson at a time for each teacher (activity.js): starting one here ends one left running elsewhere. */
import { CONFIG, bus, store, toast } from '../core.js?v=1e9e4bc0';
import * as R from './relay.js?v=1e9e4bc0';
import { hold, release, blocker, check, onLost } from '../activity.js?v=1e9e4bc0';

const SS = 'ks2-engine.live.v1', TTL = 4 * 3600e3, AUTO_KEY = 'ks2-engine.live-auto.v1';
const LIVE_KINDS = new Set(['react', 'vote', 'chat', 'waterfall', 'show', 'talk', 'think']);
export const Live = {
  on: false, starting: null, sid: '', k: '', code: '', link: '', tr: 'p', relay: null, key: null, pair: null, pub: '', title: '', at: 0,
  pupils: new Map(), locked: false, kicked: new Set(), mo: null, answers: new Map(), v: 0, status: 'off', err: '', codeOK: false,
  auto: store.get(AUTO_KEY) !== 'off', bk: '', bt: '', bm: null, autos: new Map(), send: 'idle', sentAt: 0, blocked: null
};
const L = Live;
const subs = new Set();
export function onLive(fn) { subs.add(fn); return () => subs.delete(fn); }
function changed(what) { subs.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } }); bus.emit('live', what); }

/* ---------------- where pupils join ---------------- */
export const joinPage = () => new URL('join/', location.href.split('#')[0]).href;
export const joinShort = () => joinPage().replace(/^https?:\/\//, '').replace(/\/$/, '');
const chan = (side) => R.channel(L.sid, side);
const publicRelay = () => R.publicRelay(R.relayBase(CONFIG.liveRelay));

async function pickRelay() {
  const url = String(CONFIG.inbox || '');
  if (R.SCRIPT.test(url)) {
    const s = R.schoolRelay(url);
    try { if (await Promise.race([s.ping(), R.sleep(9000).then(() => false)])) return s; } catch (e) { /* not switched on for live lessons yet */ }
  }
  return publicRelay();
}
function save() {
  if (!L.on) { try { sessionStorage.removeItem(SS); } catch (e) { /* private mode */ } return; }
  R.keepPair(L.pair).then((pair) => {
    try { sessionStorage.setItem(SS, JSON.stringify({ sid: L.sid, k: L.k, code: L.code, tr: L.tr, pair, at: L.at, title: L.title, locked: L.locked, kicked: Array.from(L.kicked), v: L.v })); } catch (e) { /* full or private */ }
  });
}

/* ---------------- start, carry on after a reload, end ---------------- */
/* o.takeOver: end a live lesson left running on another screen and start here. */
export function startLive(title, o) {
  o = o || {};
  if (title) L.title = String(title).slice(0, 120);
  if (L.on) { pushSoon(300); return Promise.resolve(L); }
  if (L.starting) return L.starting;
  L.starting = Promise.resolve().then(async () => {      // (runs after L.starting is set, so a quick refusal clears it)
    try {
      const other = o.takeOver ? null : (blocker('live') || await check('live'));
      if (other) { L.blocked = other; changed('blocked'); const e = new Error('elsewhere'); e.code = 'elsewhere'; e.other = other; throw e; }
      L.blocked = null;
      L.relay = await pickRelay();
      L.tr = L.relay.kind === 'school' ? 's' : 'p';
      L.sid = R.rid(9);
      const raw = R.rand(16); L.k = R.b64u(raw); L.key = await R.lessonKey(raw);
      L.pair = await R.newPair(); L.pub = await R.pubOf(L.pair);
      L.code = R.newCode(); L.at = Date.now(); L.v = 0;
      L.pupils = new Map(); L.answers = new Map(); L.autos = new Map(); L.kicked = new Set(); L.locked = false; L.mo = null;
      go(o.takeOver);
      await push();
      publishCode();
      return L;
    } finally { L.starting = null; }
  });
  return L.starting;
}
async function resume() {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem(SS) || 'null'); } catch (e) { s = null; }
  if (!s || !s.sid || Date.now() - (s.at || 0) > TTL) { try { sessionStorage.removeItem(SS); } catch (e) { /* ignore */ } return; }
  try {
    L.sid = s.sid; L.k = s.k; L.code = s.code; L.tr = s.tr === 's' ? 's' : 'p'; L.at = s.at; L.title = s.title || ''; L.locked = !!s.locked; L.v = (s.v || 0) + 1;
    L.kicked = new Set(Array.isArray(s.kicked) ? s.kicked : []);
    L.key = await R.lessonKey(R.unb64u(L.k));
    L.pair = await R.loadPair(s.pair); L.pub = await R.pubOf(L.pair);
    L.relay = L.tr === 's' && R.SCRIPT.test(String(CONFIG.inbox || '')) ? R.schoolRelay(CONFIG.inbox) : publicRelay();
    go(true);
    pushSoon(500);
  } catch (e) { try { sessionStorage.removeItem(SS); } catch (er) { /* ignore */ } }
}
let stopListen = null, lockTicket = null;
function go(take) {
  L.on = true; L.status = 'connecting'; L.err = ''; L.send = 'idle';
  L.link = joinPage() + '#' + R.joinHash({ tr: L.tr, sid: L.sid, k: L.k, pub: L.pub });
  save();
  stopListen = L.relay.listen(chan('p'), onUp, (st) => { if (st !== L.status) { L.status = st; changed('status'); } });
  lockTicket = hold('live', L.title || 'Live lesson', { take: !!take, ref: L.sid });
  changed('start');
}
export async function endLive() {
  if (!L.on) return;
  clearTimeout(pushT);
  const relay = L.relay, key = L.key, ch = chan('t');
  L.on = false; L.mo = null; L.bk = ''; L.bt = ''; L.bm = null;
  if (stopListen) { stopListen(); stopListen = null; }
  release(lockTicket); lockTicket = null;
  save();
  changed('end');
  try { await R.post(relay, ch, await R.sealAll(key, { t: 'st', v: L.v + 1, at: Date.now(), end: true, title: L.title }), 2); } catch (e) { /* pupils' screens also time out by themselves */ }
  L.pupils = new Map(); L.answers = new Map(); L.autos = new Map();
}
/* Another screen took over (she started a live lesson there): this one ends. A copy of this very tab (the same
   lesson) just stops here quietly, without ending the lesson on pupils' devices. */
onLost('live', (by) => {
  if (!L.on) return;
  if (by && by.ref && by.ref === L.sid) { quiet(); return; }
  endLive(); toast('Your live lesson moved to another screen, so it has ended here.');
});
function quiet() {
  clearTimeout(pushT);
  L.on = false; L.mo = null;
  if (stopListen) { stopListen(); stopListen = null; }
  lockTicket = null;
  try { sessionStorage.removeItem(SS); } catch (e) { /* ignore */ }
  changed('end');
}
/* Reconnect the line to pupils at once (the Join screen's "Reconnect" button). */
export function reconnect() { if (stopListen && stopListen.retry) stopListen.retry(); pushSoon(200); }

/* ---------------- telling pupils' devices what is happening now ---------------- */
let pushT = 0, pushing = false, again = false;
export function pushSoon(ms) { if (!L.on) return; clearTimeout(pushT); pushT = setTimeout(push, ms == null ? 1200 : ms); }
function sendState(s) { if (s !== L.send) { L.send = s; changed('send'); } }
async function push() {
  clearTimeout(pushT);
  if (!L.on) return;
  if (pushing) { again = true; return; }
  pushing = true;
  sendState('sending');
  try {
    L.v += 1;
    const mo = L.mo ? Object.assign({}, L.mo, { left: L.mo.ends ? Math.max(0, Math.round((L.mo.ends - Date.now()) / 1000)) : 0 }) : null;
    if (mo) { delete mo.ends; delete mo.was; delete mo.sig; }
    const st = { t: 'st', v: L.v, at: Date.now(), title: L.title, bt: L.bt, lock: L.locked, mo, seen: Array.from(L.pupils.keys()), kick: Array.from(L.kicked) };
    await R.post(L.relay, chan('t'), await R.sealAll(L.key, st));
    if (L.err) { L.err = ''; changed('status'); }
    L.sentAt = Date.now(); sendState('sent');
    save();
  } catch (e) {
    const code = (e && e.code) || 'relay';
    L.err = code; changed('status');
    sendState(code === 'full' ? 'full' : 'retry');
    // never keep knocking on a relay that is busy or full: the public one blocks networks that do
    pushSoon(code === 'full' ? 120000 : code === 'busy' ? 20000 + Math.random() * 10000 : 5000);
  } finally {
    pushing = false;
    if (again) { again = false; pushSoon(400); }
  }
}
/* The 6-digit code: pupils who type it find the join details here. Tried again later (twice at most) if the
   relay was busy, so the QR code and the link work straight away whatever happens. */
async function publishCode(n) {
  n = n || 0;
  const sid = L.sid;
  try {
    const ck = await R.codeKey(L.code);
    await R.post(L.relay, await R.codeChannel(L.code), await R.sealAll(ck, { sid: L.sid, k: L.k, pub: L.pub, tr: L.tr, at: Date.now() }));
    L.codeOK = true;
  } catch (e) {
    L.codeOK = false;
    if (n < 2) setTimeout(() => { if (L.on && L.sid === sid && !L.codeOK) publishCode(n + 1); }, (n + 1) * 45000);
  }
  changed('code');
}

/* ---------------- what pupils send ---------------- */
const join = R.joiner();
const keys = new Map();
async function onUp(text) {
  const env = join(text);
  if (!env || !L.on) return;
  const pub = R.upPub(env);
  if (!pub) return;
  if (!keys.has(pub)) keys.set(pub, R.sharedKey(L.pair.privateKey, pub, L.sid).catch(() => null));
  const key = await keys.get(pub);
  if (!key) return;
  const m = await R.openUp(key, env);
  if (m && typeof m === 'object') take(m, pub);
}
function value(kind, v) {
  if (kind === 'chat' || kind === 'waterfall') return Array.isArray(v) ? v.slice(0, 6).map((x) => R.cleanText(x, 160)) : R.cleanText(v, 200);
  if (kind === 'show') return v && typeof v === 'object' && Array.isArray(v.d) ? { d: v.d.slice(0, 300), a: Number(v.a) > 0.5 && Number(v.a) < 3 ? Number(v.a) : 4 / 3 } : null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n < 10 ? n : null;
}
function take(m, pub) {
  const pid = String(m.p || '');
  if (!/^[A-Za-z0-9_-]{8,16}$/.test(pid) || L.kicked.has(pid)) return;
  let p = L.pupils.get(pid);
  if (p && p.pub !== pub) return;                         // another device using this pupil's id
  if (m.t === 'join') {
    const name = R.cleanName(m.n);
    if (!name) return;
    if (!p) {
      if (L.locked) return;
      p = { pid, pub, name, at: Date.now(), seen: Date.now(), left: false };
      L.pupils.set(pid, p);
    } else { p.name = name; p.seen = Date.now(); p.left = false; }
    pushSoon(); changed('pupils');
    return;
  }
  if (!p) return;
  p.seen = Date.now();
  if (m.t === 'bye') { p.left = true; changed('pupils'); return; }
  if (m.t === 'ans') {
    const id = String(m.m || '');
    if (!/^[A-Za-z0-9_-]{4,12}$/.test(id)) return;
    const kind = m.k === 'show' || m.k === 'chat' || m.k === 'waterfall' ? m.k : 'n';
    const v = value(kind, m.v);
    if (v == null || v === '' || (Array.isArray(v) && !v.some(Boolean))) return;
    if (!L.answers.has(id)) L.answers.set(id, new Map());
    const box = L.answers.get(id), prev = box.get(pid);
    box.set(pid, { v, at: Date.now(), n: prev ? prev.n + 1 : 1 });
    changed({ ans: id, pid, v, prev: prev ? prev.v : undefined });
  }
}

/* ---------------- what is on the board ---------------- */
/* A short, steady id for a slide's question, so coming back to the slide finds the same answers. */
function stableId(s) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  return 'q' + (h1 % 2176782336).toString(36) + (h2 % 1296).toString(36);
}
const sigOf = (m) => m.kind + '|' + R.cleanText(m.q, 240);
function slideMoment(key, m) {
  const sig = sigOf(m), id = stableId(L.sid + '|' + key + '|' + sig);
  let mo = L.autos.get(id);
  if (!mo) {
    mo = { id, kind: m.kind, q: R.cleanText(m.q, 240), opts: Array.isArray(m.opts) ? m.opts.slice(0, 6).map((x) => R.cleanText(x, 90)) : null,
      qs: Array.isArray(m.qs) ? m.qs.slice(0, 5).map((x) => R.cleanText(x, 160)) : null, ends: 0, open: true, rv: null, auto: true, sig };
    L.autos.set(id, mo);
  }
  if (!L.answers.has(id)) L.answers.set(id, new Map());
  return mo;
}
const boardMoment = () => (L.auto && L.bm && LIVE_KINDS.has(L.bm.kind) ? slideMoment(L.bk, L.bm) : null);
/* Present screens call this (through the present kit) each time they draw a slide.
   s: { key, title, moment: { kind, q, opts, qs } or null } */
export function setBoard(s) {
  if (!L.on || !s) return;
  const key = String(s.key || ''), title = R.cleanText(s.title, 120), m = s.moment && s.moment.kind ? s.moment : null;
  const same = key === L.bk && title === L.bt && (m ? sigOf(m) : '') === (L.bm ? sigOf(L.bm) : '');
  if (same) return;
  L.bk = key; L.bt = title; L.bm = m;
  if (!L.mo || L.mo.auto) L.mo = boardMoment();
  pushSoon(900);                // flicking through slides sends nothing until one stays on the board
  changed('board');
}
/* The Join screen's switch: send each slide's question by itself, or only when the teacher taps its pill. */
export function setAuto(on) {
  L.auto = !!on; store.set(AUTO_KEY, on ? '' : 'off');
  if (!L.on) { changed('auto'); return; }
  if (!L.mo || L.mo.auto) { L.mo = boardMoment(); pushSoon(300); }
  changed('auto');
}
/* The question on the board now, if it went to pupils' devices by itself (presentkit shows how many answered). */
export const boardQuestion = () => (L.on && L.mo && L.mo.auto ? L.mo : null);

/* ---------------- class moments the teacher opens ---------------- */
/* m: { kind, q, opts, qs, secs }. Tapping the pill of the question already on pupils' devices opens that same
   question (the answers so far stay). */
export function setMoment(m) {
  if (!L.on) return '';
  const q = R.cleanText(m.q, 240);
  if (L.mo && L.mo.auto && L.mo.kind === m.kind && L.mo.q === q) {
    L.mo.auto = false; L.mo.was = 'auto'; L.mo.ends = m.secs ? Date.now() + m.secs * 1000 : 0;
    push(); changed('moment');
    return L.mo.id;
  }
  L.mo = { id: R.rid(6), kind: m.kind, q, opts: Array.isArray(m.opts) ? m.opts.slice(0, 6).map((x) => R.cleanText(x, 90)) : null,
    qs: Array.isArray(m.qs) ? m.qs.slice(0, 5).map((x) => R.cleanText(x, 160)) : null, ends: m.secs ? Date.now() + m.secs * 1000 : 0, open: true, rv: null };
  L.answers.set(L.mo.id, new Map());
  push(); changed('moment');
  return L.mo.id;
}
export function updateMoment(patch) {
  if (!L.on || !L.mo) return;
  if (patch.secs != null) { L.mo.ends = patch.secs ? Date.now() + patch.secs * 1000 : 0; delete patch.secs; }
  Object.assign(L.mo, patch);
  push(); changed('moment');
}
/* Closing a moment: pupils' devices go back to the slide's own question (with the answers revealed, if they
   were), or to "look at the board". */
export function endMoment(id) {
  if (!L.on || !L.mo || (id && L.mo.id !== id)) return;
  if (L.mo.was === 'auto') { L.mo.auto = true; L.mo.ends = 0; delete L.mo.was; }
  L.mo = boardMoment();
  push(); changed('moment');
}
export const answersFor = (id) => L.answers.get(id) || new Map();
export const pupilsIn = () => Array.from(L.pupils.values()).filter((p) => !p.left);
export const nameOf = (pid) => { const p = L.pupils.get(pid); return p ? p.name : 'Pupil'; };

/* ---------------- the teacher's controls ---------------- */
export function setLock(on) { if (!L.on) return; L.locked = !!on; save(); push(); changed('lock'); }
export function kick(pid) {
  if (!L.on || !L.pupils.has(pid)) return;
  L.kicked.add(pid); L.pupils.delete(pid);
  L.answers.forEach((box) => box.delete(pid));
  save(); push(); changed('pupils');
}
export function setTitle(t) { if (!L.on || !t || t === L.title) return; L.title = String(t).slice(0, 120); pushSoon(800); }

resume();
