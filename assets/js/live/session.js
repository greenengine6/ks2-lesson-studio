/* The teacher's side of a live lesson: one per browser tab, started from the Join button in Present mode.

   It makes the join details (QR code, link and a 6-digit code), listens for pupils joining and answering, and tells
   every pupil's device what is happening now (the class moment: react, vote, answer, show me, talk…). If the page
   reloads, the lesson carries on: the keys stay in this tab (sessionStorage) for up to 4 hours, and everything the
   pupils sent is read again from the relay. Pupils' names and answers stay on this screen only; nothing is saved
   to the device or sent to Rabinder's reports. */
import { CONFIG, bus } from '../core.js?v=b8e2dc0e';
import * as R from './relay.js?v=b8e2dc0e';

const SS = 'ks2-engine.live.v1', TTL = 4 * 3600e3;
export const Live = {
  on: false, starting: null, sid: '', k: '', code: '', link: '', tr: 'p', relay: null, key: null, pair: null, pub: '', title: '', at: 0,
  pupils: new Map(), locked: false, kicked: new Set(), mo: null, answers: new Map(), v: 0, status: 'off', err: '', codeOK: false
};
const L = Live;
const subs = new Set();
export function onLive(fn) { subs.add(fn); return () => subs.delete(fn); }
function changed(what) { subs.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } }); bus.emit('live', what); }

/* ---------------- where pupils join ---------------- */
export const joinPage = () => new URL('join/', location.href.split('#')[0]).href;
export const joinShort = () => joinPage().replace(/^https?:\/\//, '').replace(/\/$/, '');
const chan = (side) => R.channel(L.sid, side);

async function pickRelay() {
  const url = String(CONFIG.inbox || '');
  if (R.SCRIPT.test(url)) {
    const s = R.schoolRelay(url);
    try { if (await Promise.race([s.ping(), R.sleep(6000).then(() => false)])) return s; } catch (e) { /* not switched on for live lessons yet */ }
  }
  return R.publicRelay();
}
function save() {
  if (!L.on) { try { sessionStorage.removeItem(SS); } catch (e) { /* private mode */ } return; }
  R.keepPair(L.pair).then((pair) => {
    try { sessionStorage.setItem(SS, JSON.stringify({ sid: L.sid, k: L.k, code: L.code, tr: L.tr, pair, at: L.at, title: L.title, locked: L.locked, kicked: Array.from(L.kicked), v: L.v })); } catch (e) { /* full or private */ }
  });
}

/* ---------------- start, carry on after a reload, end ---------------- */
export function startLive(title) {
  if (title) L.title = String(title).slice(0, 120);
  if (L.on) { pushSoon(300); return Promise.resolve(L); }
  if (L.starting) return L.starting;
  L.starting = (async () => {
    try {
      L.relay = await pickRelay();
      L.tr = L.relay.kind === 'school' ? 's' : 'p';
      L.sid = R.rid(9);
      const raw = R.rand(16); L.k = R.b64u(raw); L.key = await R.lessonKey(raw);
      L.pair = await R.newPair(); L.pub = await R.pubOf(L.pair);
      L.code = R.newCode(); L.at = Date.now(); L.v = 0;
      L.pupils = new Map(); L.answers = new Map(); L.kicked = new Set(); L.locked = false; L.mo = null;
      go();
      await push();
      publishCode();
      return L;
    } finally { L.starting = null; }
  })();
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
    L.relay = L.tr === 's' && R.SCRIPT.test(String(CONFIG.inbox || '')) ? R.schoolRelay(CONFIG.inbox) : R.publicRelay();
    go();
    pushSoon(500);
  } catch (e) { try { sessionStorage.removeItem(SS); } catch (er) { /* ignore */ } }
}
let stopListen = null;
function go() {
  L.on = true; L.status = 'connecting'; L.err = '';
  L.link = joinPage() + '#' + R.joinHash({ tr: L.tr, sid: L.sid, k: L.k, pub: L.pub });
  save();
  stopListen = L.relay.listen(chan('p'), onUp, (st) => { if (st !== L.status) { L.status = st; changed('status'); } });
  changed('start');
}
export async function endLive() {
  if (!L.on) return;
  clearTimeout(pushT);
  const relay = L.relay, key = L.key, ch = chan('t');
  L.on = false; L.mo = null;
  if (stopListen) { stopListen(); stopListen = null; }
  save();
  changed('end');
  try { await R.post(relay, ch, await R.sealAll(key, { t: 'st', v: L.v + 1, at: Date.now(), end: true, title: L.title }), 2); } catch (e) { /* pupils' screens also time out by themselves */ }
  L.pupils = new Map(); L.answers = new Map();
}

/* ---------------- telling pupils' devices what is happening now ---------------- */
let pushT = 0, pushing = false, again = false;
export function pushSoon(ms) { if (!L.on) return; clearTimeout(pushT); pushT = setTimeout(push, ms == null ? 1200 : ms); }
async function push() {
  clearTimeout(pushT);
  if (!L.on) return;
  if (pushing) { again = true; return; }
  pushing = true;
  try {
    L.v += 1;
    const mo = L.mo ? Object.assign({}, L.mo, { left: L.mo.ends ? Math.max(0, Math.round((L.mo.ends - Date.now()) / 1000)) : 0 }) : null;
    if (mo) delete mo.ends;
    const st = { t: 'st', v: L.v, at: Date.now(), title: L.title, lock: L.locked, mo, seen: Array.from(L.pupils.keys()), kick: Array.from(L.kicked) };
    await R.post(L.relay, chan('t'), await R.sealAll(L.key, st));
    if (L.err) { L.err = ''; changed('status'); }
    save();
  } catch (e) {
    L.err = (e && e.code) || 'relay'; changed('status');
    pushSoon(5000);
  } finally {
    pushing = false;
    if (again) { again = false; pushSoon(400); }
  }
}
async function publishCode() {
  try {
    const ck = await R.codeKey(L.code);
    await R.post(L.relay, await R.codeChannel(L.code), await R.sealAll(ck, { sid: L.sid, k: L.k, pub: L.pub, tr: L.tr, at: Date.now() }));
    L.codeOK = true;
  } catch (e) { L.codeOK = false; }
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

/* ---------------- class moments ---------------- */
/* m: { kind, q, opts, qs, secs } */
export function setMoment(m) {
  if (!L.on) return '';
  L.mo = { id: R.rid(6), kind: m.kind, q: R.cleanText(m.q, 240), opts: Array.isArray(m.opts) ? m.opts.slice(0, 6).map((x) => R.cleanText(x, 90)) : null,
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
export function endMoment(id) { if (!L.on || !L.mo || (id && L.mo.id !== id)) return; L.mo = null; push(); changed('moment'); }
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
