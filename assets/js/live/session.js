/* The teacher's side of a live lesson (a class): one per browser tab, started from the Join button in Present mode or
   from the Classroom page.

   It makes the join details (QR code, link and a 6-digit code), listens for pupils joining and answering, and tells
   every pupil's device what is happening now:
   - what is on the board (the slide's title), so pupils can follow along;
   - the slide's question, by itself: when a slide has a "how pupils respond" pill (vote, type it, show me, talk…),
     that question goes to every device as soon as the slide has been on the board for a moment. Coming back to a
     slide brings back the same question, with the answers already given. The teacher can switch this off in the
     Join screen; then a question only goes when she taps the pill;
   - a class moment the teacher opens (the pill's big screen, with a timer and Reveal), and class feedback;
   - a task on every device (tasks.js): a live quiz question, a worksheet, a game. Big things (a worksheet, a game)
     travel once as a "blob" and the state only names it, so the relay is not asked to carry them again and again;
   - "Eyes on the board", the class tools (a timer, a work sign, groups, team points) and homework;
   - private messages to one pupil ("On my way", praise, a sticker, a reply), locked with the key that pupil and this
     screen share, so no other device can open them.
   Pupils send their answers, a raised hand ("I need help") and short private questions.
   If the page reloads, the lesson carries on: the keys and the task stay in this tab (sessionStorage) for up to 4
   hours, and everything the pupils sent is read again from the relay. Pupils' names and answers stay on this
   screen only; nothing is saved to the device or sent to Rabinder's reports.
   One live lesson at a time for each teacher (activity.js): starting one here ends one left running elsewhere. */
import { CONFIG, bus, store, toast } from '../core.js?v=af1c9ebd';
import * as R from './relay.js?v=af1c9ebd';
import { hold, release, blocker, check, onLost } from '../activity.js?v=af1c9ebd';

const SS = 'ks2-engine.live.v1', TTL = 4 * 3600e3, AUTO_KEY = 'ks2-engine.live-auto.v1';
const LIVE_KINDS = new Set(['react', 'vote', 'chat', 'waterfall', 'show', 'talk', 'think', 'cloud', 'traffic']);
export const Live = {
  on: false, starting: null, sid: '', k: '', code: '', link: '', tr: 'p', relay: null, key: null, pair: null, pub: '', title: '', at: 0,
  pupils: new Map(), locked: false, kicked: new Set(), mo: null, answers: new Map(), v: 0, status: 'off', err: '', codeOK: false,
  auto: store.get(AUTO_KEY) !== 'off', bk: '', bt: '', bm: null, autos: new Map(), send: 'idle', sentAt: 0, blocked: null,
  // tasks and the class
  tk: null, task: null, blobs: new Map(), eyes: false, tools: { timer: null, sign: null, groups: null, points: null }, hw: null, res: null,
  help: new Map(), asks: [], expect: new Map(), sent: 0, recv: 0,
  // the board's words and picture for devices, a pupil's answer or question shown big, devices locked, who left the page
  bw: '', bp: '', sp: null, dl: false, away: new Map()
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
/* What this tab keeps to carry on after a reload: the keys, the task and the class tools (never the pupils' names). */
function save() {
  if (!L.on) { try { sessionStorage.removeItem(SS); } catch (e) { /* private mode */ } return; }
  R.keepPair(L.pair).then((pair) => {
    const keep = { sid: L.sid, k: L.k, code: L.code, tr: L.tr, pair, at: L.at, title: L.title, locked: L.locked, kicked: Array.from(L.kicked), v: L.v,
      tk: L.tk, task: L.task, eyes: L.eyes, tools: L.tools, hw: L.hw, res: L.res, sent: L.sent, recv: L.recv, blobs: Array.from(L.blobs.entries()).slice(-4),
      dl: L.dl, away: Array.from(L.away.entries()) };
    try { sessionStorage.setItem(SS, JSON.stringify(keep)); }
    catch (e) { try { keep.blobs = []; sessionStorage.setItem(SS, JSON.stringify(keep)); } catch (er) { /* full or private */ } }
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
      resetClass();
      go(o.takeOver);
      await push();
      publishCode();
      return L;
    } finally { L.starting = null; }
  });
  return L.starting;
}
function resetClass() {
  L.tk = null; L.task = null; L.blobs = new Map(); L.eyes = false; L.tools = { timer: null, sign: null, groups: null, points: null }; L.hw = null; L.res = null;
  L.help = new Map(); L.asks = []; L.expect = new Map(); L.sent = 0; L.recv = 0;
  L.bw = ''; L.bp = ''; L.sp = null; L.dl = false; L.away = new Map();
}
async function resume() {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem(SS) || 'null'); } catch (e) { s = null; }
  if (!s || !s.sid || Date.now() - (s.at || 0) > TTL) { try { sessionStorage.removeItem(SS); } catch (e) { /* ignore */ } return; }
  try {
    L.sid = s.sid; L.k = s.k; L.code = s.code; L.tr = s.tr === 's' ? 's' : 'p'; L.at = s.at; L.title = s.title || ''; L.locked = !!s.locked; L.v = (s.v || 0) + 1;
    L.kicked = new Set(Array.isArray(s.kicked) ? s.kicked : []);
    resetClass();
    L.tk = s.tk || null; L.task = s.task || null; L.eyes = !!s.eyes; L.hw = s.hw || null; L.res = s.res || null;
    L.dl = !!s.dl; try { L.away = new Map(Array.isArray(s.away) ? s.away : []); } catch (e) { L.away = new Map(); }
    if (s.tools && typeof s.tools === 'object') L.tools = Object.assign(L.tools, s.tools);
    L.sent = Number(s.sent) || 0; L.recv = Number(s.recv) || 0;
    if (Array.isArray(s.blobs)) s.blobs.forEach((b) => { if (Array.isArray(b) && b[0] && b[1]) L.blobs.set(b[0], b[1]); });
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
  resetClass();
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

/* ---------------- how many messages this class has used (the free relay counts them per network) ---------------- */
async function post(ch, env, tries) {
  const parts = R.split(env).length;
  await R.post(L.relay, ch, env, tries);
  L.sent += parts;
  changed('budget');
}
/* { sent, recv, total, public }: total is what one network would have used if every pupil were on the same Wi-Fi. */
export function budget() { return { sent: L.sent, recv: L.recv, total: L.sent + L.recv, public: L.tr !== 's' }; }
/* About how many messages a task needs: one or two from this screen each step, one from each pupil each answer. */
export function estimate(steps, answersEach) {
  const n = Math.max(1, pupilsIn().length || 25);
  return Math.round(steps * 2 + steps * n * (answersEach || 1));
}

/* ---------------- telling pupils' devices what is happening now ---------------- */
let pushT = 0, pushing = false, again = false;
export function pushSoon(ms) { if (!L.on) return; clearTimeout(pushT); pushT = setTimeout(push, ms == null ? 1200 : ms); }
function sendState(s) { if (s !== L.send) { L.send = s; changed('send'); } }
function toolsNow() {
  const t = L.tools || {}, out = {};
  if (t.timer && t.timer.ends) { const left = Math.round((t.timer.ends - Date.now()) / 1000); if (left > -5) out.timer = { left: Math.max(0, left), secs: t.timer.secs || 0, paused: !!t.timer.paused }; }
  else if (t.timer && t.timer.paused) out.timer = { left: t.timer.left || 0, secs: t.timer.secs || 0, paused: true };
  if (t.sign) out.sign = t.sign;
  if (t.groups) out.groups = t.groups;
  if (t.points) out.points = t.points;
  return Object.keys(out).length ? out : null;
}
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
    let tk = null;
    if (L.tk) { tk = Object.assign({}, L.tk); if (tk.ends) { tk.left = Math.max(0, Math.round((tk.ends - Date.now()) / 1000)); delete tk.ends; } }
    const st = { t: 'st', v: L.v, at: Date.now(), title: L.title, bt: L.bt, lock: L.locked, mo, seen: Array.from(L.pupils.keys()), kick: Array.from(L.kicked) };
    if (tk) st.tk = tk;
    if (L.eyes) st.eyes = 1;
    const tools = toolsNow(); if (tools) st.tools = tools;
    if (L.hw) st.hw = L.hw;
    if (L.res) st.res = L.res;
    if (L.bw) st.bw = L.bw;
    if (L.bp) st.bp = L.bp;
    if (L.sp) st.sp = L.sp;
    if (L.dl) st.dl = 1;
    await post(chan('t'), await R.sealAll(L.key, st));
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
    await post(await R.codeChannel(L.code), await R.sealAll(ck, { sid: L.sid, k: L.k, pub: L.pub, tr: L.tr, at: Date.now() }));
    L.codeOK = true;
  } catch (e) {
    L.codeOK = false;
    if (n < 2) setTimeout(() => { if (L.on && L.sid === sid && !L.codeOK) publishCode(n + 1); }, (n + 1) * 45000);
  }
  changed('code');
}

/* ---------------- big things travel once ---------------- */
/* A worksheet or a game goes to every device once, with an id; the state then only names that id. Devices that join
   later find it in the relay's history (the public relay keeps 12 hours, the school relay 6). Returns the id. */
export async function sendBlob(kind, data) {
  if (!L.on) throw new Error('not live');
  const id = R.rid(6);
  const env = await R.sealAll(L.key, { t: 'blob', id, kind: String(kind).slice(0, 12), data });
  L.blobs.set(id, { kind, at: Date.now() });
  await post(chan('t'), env, 4);
  save();
  return id;
}

/* ---------------- one pupil only ---------------- */
const join = R.joiner();
const keys = new Map();
const keyFor = (pub) => { if (!keys.has(pub)) keys.set(pub, R.sharedKey(L.pair.privateKey, pub, L.sid).catch(() => null)); return keys.get(pub); };
/* A private message to one pupil's device: { k: 'ack' | 'praise' | 'note' | 'sticker' | 'reply', text, s (sticker id), q (the question replied to) }. */
export async function sendTo(pid, obj) {
  const p = L.pupils.get(pid);
  if (!L.on || !p || !p.pub) return false;
  const key = await keyFor(p.pub);
  if (!key) return false;
  const msg = Object.assign({ t: 'pm', id: R.rid(5), at: Date.now() }, obj);
  try { await post(chan('t'), await R.sealTo(key, pid, msg)); changed({ pm: pid, k: obj.k }); return true; } catch (e) { return false; }
}
export async function ack(pid) {
  const h = L.help.get(pid);
  if (h) { h.ack = Date.now(); changed('help'); }
  return sendTo(pid, { k: 'ack', text: 'On my way!' });
}
export function helpQueue() { return Array.from(L.help.entries()).filter(([pid, h]) => h.on && L.pupils.has(pid)).sort((a, b) => a[1].at - b[1].at).map(([pid, h]) => ({ pid, name: nameOf(pid), at: h.at, ack: h.ack || 0 })); }
export const asks = () => L.asks.filter((a) => L.pupils.has(a.pid) || a.done);
export async function replyAsk(id, text) {
  const a = L.asks.find((x) => x.id === id);
  if (!a) return false;
  a.done = Date.now(); a.reply = R.cleanText(text, 200); changed('asks');
  return sendTo(a.pid, { k: 'reply', text: a.reply, q: R.cleanText(a.text, 120) });
}
export function doneAsk(id) { const a = L.asks.find((x) => x.id === id); if (a) { a.done = Date.now(); changed('asks'); } }

/* ---------------- what pupils send ---------------- */
async function onUp(text) {
  const env = join(text);
  if (!env || !L.on) return;
  const pub = R.upPub(env);
  if (!pub) return;
  const key = await keyFor(pub);
  if (!key) return;
  const m = await R.openUp(key, env);
  if (m && typeof m === 'object') { L.recv += 1; take(m, pub); }
}
const isInt = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
function value(kind, v) {
  if (kind === 'chat' || kind === 'waterfall') return Array.isArray(v) ? v.slice(0, 6).map((x) => R.cleanText(x, 160)) : R.cleanText(v, 200);
  if (kind === 'show') return v && typeof v === 'object' && Array.isArray(v.d) ? { d: v.d.slice(0, 300), a: Number(v.a) > 0.5 && Number(v.a) < 3 ? Number(v.a) : 4 / 3 } : null;
  if (kind === 'cloud') { const w = R.cleanText(v, 30).replace(/\s+/g, ' ').split(' ').slice(0, 3).join(' '); return w || null; }
  if (kind === 'quiz') { if (typeof v === 'string') return R.cleanText(v, 80) || null; const n = Math.round(Number(v)); return isInt(n, 0, 5) ? n : null; }
  if (kind === 'sheet') {
    // one answer { i, a }, or several at once { b: [{ i, a }, …], done } (pupils' devices send them in batches)
    if (!v || typeof v !== 'object') return null;
    const one = (x) => {
      if (!x || typeof x !== 'object' || !isInt(Number(x.i), 0, 99)) return null;
      let a = x.a;
      if (a && typeof a === 'object' && Array.isArray(a.d)) a = { d: a.d.slice(0, 300), a: Number(a.a) > 0.5 && Number(a.a) < 3 ? Number(a.a) : 4 / 3 };
      else if (Array.isArray(a)) a = a.slice(0, 8).map((y) => Math.round(Number(y))).filter((y) => isInt(y, 0, 9));
      else if (typeof a === 'number') { a = Math.round(a); if (!isInt(a, 0, 9)) return null; }
      else a = R.cleanText(a, 300);
      return { i: Number(x.i), a };
    };
    const list = (Array.isArray(v.b) ? v.b.slice(0, 40) : [v]).map(one).filter(Boolean);
    return list.length || v.done ? { b: list, done: !!v.done } : null;
  }
  if (kind === 'game') { if (!v || typeof v !== 'object') return null; const s = Math.round(Number(v.s)); return isInt(s, 0, 1e7) ? { s, d: !!v.d } : null; }
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n < 10 ? n : null;
}
const KINDS_UP = new Set(['show', 'chat', 'waterfall', 'cloud', 'quiz', 'sheet', 'game']);
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
      p = { pid, pub, name, at: Date.now(), seen: Date.now(), left: false, drops: 0 };
      L.pupils.set(pid, p);
    } else { if (p.left) p.back = Date.now(); p.name = name; p.seen = Date.now(); p.left = false; }
    pushSoon(); changed('pupils');
    return;
  }
  if (!p) return;
  p.seen = Date.now();
  if (m.t === 'bye') { p.left = true; p.leftAt = Date.now(); p.drops = (p.drops || 0) + 1; const h = L.help.get(pid); if (h) h.on = false; changed('pupils'); return; }
  if (m.t === 'help') {
    const on = !!m.on, h = L.help.get(pid) || { on: false, at: 0, ack: 0 };
    if (on && !h.on) { h.at = Date.now(); h.ack = 0; }
    h.on = on; L.help.set(pid, h);
    changed({ help: pid, on });
    return;
  }
  if (m.t === 'away') {
    // a locked device left the class page (on) or came back (off, with how long it was away). n and tot are the
    // device's own running count and total, so a pair it skipped (one pair every 10 seconds at most) still counts.
    const on = !!m.on, a = L.away.get(pid) || { on: false, at: 0, n: 0, tot: 0, ms: 0, back: 0 };
    const n = Math.round(Number(m.n)), tot = Math.round(Number(m.tot)), ms = Math.round(Number(m.ms));
    if (Number.isFinite(n) && n >= 0 && n < 10000) a.n = Math.max(a.n, n);
    if (Number.isFinite(tot) && tot >= 0 && tot < 864e5) a.tot = Math.max(a.tot, tot);
    if (on) { if (!a.on) a.at = Date.now(); a.on = true; }
    else { a.on = false; a.back = Date.now(); if (Number.isFinite(ms) && ms >= 0 && ms < 864e5) a.ms = ms; }
    L.away.set(pid, a);
    save(); changed({ away: pid, on });
    return;
  }
  if (m.t === 'ask') {
    const id = String(m.id || ''), t = R.cleanText(m.text, 200);
    if (!/^[A-Za-z0-9_-]{4,12}$/.test(id) || !t || L.asks.some((a) => a.id === id)) return;
    if (L.asks.filter((a) => a.pid === pid && !a.done).length >= 3) return;      // three waiting questions each at most
    L.asks.push({ id, pid, text: t, at: Date.now(), done: 0 });
    if (L.asks.length > 120) L.asks.shift();
    changed({ ask: id, pid });
    return;
  }
  if (m.t === 'ans') {
    const id = String(m.m || '');
    if (!/^[A-Za-z0-9_-]{4,12}$/.test(id)) return;
    const kind = KINDS_UP.has(m.k) ? m.k : 'n';
    const v = value(kind, m.v);
    if (v == null || v === '' || (Array.isArray(v) && !v.some((x) => x !== '' && x != null))) return;
    if (!L.answers.has(id)) L.answers.set(id, new Map());
    const box = L.answers.get(id), prev = box.get(pid);
    if (kind === 'quiz') {
      if (prev) return;                                   // the first answer counts, like a buzzer
      box.set(pid, { v, at: Date.now(), n: 1 });
    } else if (kind === 'sheet') {
      // v is { b: [{ i, a }], done }: the pupil's answers so far, merged question by question
      const all = prev && prev.v && typeof prev.v === 'object' ? prev.v : {};
      v.b.forEach((x) => { all[x.i] = { a: x.a, at: Date.now() }; });
      if (v.done) all.done = Date.now();
      box.set(pid, { v: all, at: Date.now(), n: prev ? prev.n + 1 : 1 });
      changed({ ans: id, pid, v, kind, prev: prev ? prev.v : undefined });
      return;
    } else if (kind === 'game') {
      const best = prev && prev.v ? Math.max(prev.v.s || 0, v.s) : v.s;
      box.set(pid, { v: { s: best, d: !!(v.d || (prev && prev.v && prev.v.d)), last: v.s }, at: Date.now(), n: prev ? prev.n + 1 : 1 });
    } else box.set(pid, { v, at: Date.now(), n: prev ? prev.n + 1 : 1 });
    changed({ ans: id, pid, v, kind, prev: prev ? prev.v : undefined });
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
  if (m.ans) setExpect(id, m.ans);
  if (!L.answers.has(id)) L.answers.set(id, new Map());
  return mo;
}
const boardMoment = () => (L.auto && L.bm && LIVE_KINDS.has(L.bm.kind) ? slideMoment(L.bk, L.bm) : null);
/* Present screens call this (through the present kit) each time they draw a slide.
   s: { key, title, words, pic, moment: { kind, q, opts, qs, ans } or null } (ans, the expected answers, stays on this
   screen; words are only what pupils can see on the board; pic only a free Wikimedia picture) */
const WIKI_PIC = /^https:\/\/upload\.wikimedia\.org\/[^\s"'<>]{4,380}$/;
export function setBoard(s) {
  if (!L.on || !s) return;
  const key = String(s.key || ''), title = R.cleanText(s.title, 120), m = s.moment && s.moment.kind ? s.moment : null;
  const words = R.cleanText(s.words, 800), pic = WIKI_PIC.test(String(s.pic || '')) ? String(s.pic) : '';
  const same = key === L.bk && title === L.bt && words === L.bw && pic === L.bp && (m ? sigOf(m) : '') === (L.bm ? sigOf(L.bm) : '');
  if (same) return;
  L.bk = key; L.bt = title; L.bw = words; L.bp = pic; L.bm = m;
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
/* m: { kind, q, opts, qs, secs, ans }. Tapping the pill of the question already on pupils' devices opens that same
   question (the answers so far stay). ans (expected answers) never leaves this screen. */
export function setMoment(m) {
  if (!L.on) return '';
  const q = R.cleanText(m.q, 240);
  if (L.mo && L.mo.auto && L.mo.kind === m.kind && L.mo.q === q) {
    L.mo.auto = false; L.mo.was = 'auto'; L.mo.ends = m.secs ? Date.now() + m.secs * 1000 : 0;
    if (m.ans) setExpect(L.mo.id, m.ans);
    push(); changed('moment');
    return L.mo.id;
  }
  L.mo = { id: R.rid(6), kind: m.kind, q, opts: Array.isArray(m.opts) ? m.opts.slice(0, 6).map((x) => R.cleanText(x, 90)) : null,
    qs: Array.isArray(m.qs) ? m.qs.slice(0, 5).map((x) => R.cleanText(x, 160)) : null, ends: m.secs ? Date.now() + m.secs * 1000 : 0, open: true, rv: null };
  if (m.ans) setExpect(L.mo.id, m.ans);
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
export const allPupils = () => Array.from(L.pupils.values());
export const nameOf = (pid) => { const p = L.pupils.get(pid); return p ? p.name : 'Pupil'; };
/* What a right answer looks like, for marking (kept on this screen only):
   { right: index } for a vote; { texts: [...] } for a typed answer; { qs: ['', 'expected 2', …] } for several. */
export function setExpect(id, exp) { if (id && exp && typeof exp === 'object') L.expect.set(id, exp); }
export const expectFor = (id) => L.expect.get(id) || null;

/* ---------------- tasks on every device (tasks.js) ---------------- */
/* tk is what devices see now: { id, kind: 'quiz' | 'sheet' | 'game', … }. It is small: big parts travel as blobs.
   secs: a countdown, sent as the seconds left. */
export function setTask(tk, task) {
  if (!L.on) return;
  L.tk = tk ? Object.assign({}, tk, tk.secs ? { ends: Date.now() + tk.secs * 1000 } : {}) : null;
  if (task !== undefined) L.task = task;
  if (L.tk && L.tk.id && !L.answers.has(L.tk.id)) L.answers.set(L.tk.id, new Map());
  push(); changed('task');
}
export function updateTask(patch) {
  if (!L.on || !L.tk) return;
  if (patch.secs != null) { L.tk.ends = patch.secs ? Date.now() + patch.secs * 1000 : 0; delete patch.secs; }
  Object.assign(L.tk, patch);
  push(); changed('task');
}
export function clearTask() { if (!L.on) return; L.tk = null; L.task = null; L.res = null; push(); changed('task'); }
/* Per-pupil results that each device reads for itself only: { pid: [right 0/1, gained, total, place] } (a quiz)
   or { pid: { i: 1 | 0 } } (a worksheet's marks). */
export function setResults(res) { if (!L.on) return; L.res = res && typeof res === 'object' ? res : null; pushSoon(150); }      // the next push carries it (setTask and updateTask push at once)
export function setEyes(on) { if (!L.on) return; L.eyes = !!on; push(); changed('eyes'); }
/* Lock devices: the class page stays full screen where the browser allows it, its links are blocked, and a device
   that leaves the page tells the teacher. (A website cannot stop a phone opening other apps: school device
   management can.) */
export function setDeviceLock(on) { if (!L.on) return; L.dl = !!on; save(); push(); changed('dlock'); }
/* Who left the class page: { on, at, n, tot, ms, back } for a pupil, all of them, and how many times in all. */
export const awayOf = (pid) => L.away.get(pid) || null;
export const awayAll = () => Array.from(L.away.entries()).filter(([pid]) => L.pupils.has(pid)).map(([pid, a]) => Object.assign({ pid, name: nameOf(pid) }, a));
export const awayCount = () => Array.from(L.away.values()).reduce((n, a) => n + (a.n || 0), 0);
/* Something shown big on the board from the class view, for every device too: { k: 'q' | 'a', t: text } or null.
   Never a name. */
export function setSpot(sp) {
  if (!L.on) return;
  L.sp = sp && R.cleanText(sp.t, 300) ? { k: sp.k === 'q' ? 'q' : 'a', t: R.cleanText(sp.t, 300) } : null;
  pushSoon(200); changed('spot');
}
/* Class tools on pupils' devices: patch { timer: { secs, ends, paused, left } | null, sign: { id, word } | null,
   groups: [{ name, color, names: [...] , pids: [...] }] | null, points: [{ name, color, points }] | null }. */
export function setTools(patch) {
  if (!L.on || !patch) return;
  L.tools = Object.assign({}, L.tools, patch);
  pushSoon(250); changed('tools');
}
export function setHomework(hw) { if (!L.on) return; L.hw = hw || null; push(); changed('homework'); }

/* ---------------- the teacher's controls ---------------- */
export function setLock(on) { if (!L.on) return; L.locked = !!on; save(); push(); changed('lock'); }
export function kick(pid) {
  if (!L.on || !L.pupils.has(pid)) return;
  L.kicked.add(pid); L.pupils.delete(pid);
  L.answers.forEach((box) => box.delete(pid));
  L.help.delete(pid); L.asks = L.asks.filter((a) => a.pid !== pid);
  save(); push(); changed('pupils');
}
export function setTitle(t) { if (!L.on || !t || t === L.title) return; L.title = String(t).slice(0, 120); pushSoon(800); }

resume();
