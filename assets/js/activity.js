/* One thing at a time for each teacher. While the engine is making something for her, or her live lesson is
   running, the other Make buttons wait and a second live lesson cannot start: in every tab on this device and,
   once the school relay is switched on, on her other devices too. Presenting, the Wonder Window and Symphony stay
   free, and small edits to the lesson she is teaching still work.

   - This device: a note in localStorage, renewed every 5 seconds by the tab doing the work. A tab that closes
     takes its note away; one that crashes is forgotten after 15 seconds (3 minutes for a live lesson, because
     browsers slow down the clocks of tabs in the background).
   - Her other devices: the school relay (inbox/Code.gs) keeps the same note for her, under a scrambled id (never
     her name), for two minutes or so at a time, and the device doing the work renews it. Other devices read the
     notes every 30 seconds, whenever the page comes back on screen, and just before a live lesson starts. If the
     school relay does not answer within 2.5 seconds, teaching goes ahead: this rule never stops a lesson.
   - A live lesson can be moved: "End it there and start here" ends the one on the other screen (it notices
     within half a minute) and starts a new one here. */
import { store, bus, CONFIG } from './core.js?v=a3c4a34d';
import { who } from './people.js?v=a3c4a34d';

const KEY = 'ks2-engine.activity.v1', DEV_KEY = 'ks2-engine.device.v1';
const TAB = Math.random().toString(36).slice(2, 10);
const WHATS = ['make', 'live'];
const STALE = { make: 15000, live: 180000 };
const REMOTE = { make: { ttl: 120, every: 30000 }, live: { ttl: 150, every: 25000 } };
const BEAT = 5000, ASK_WAIT = 2500, LOOK_EVERY = 30000;
const SCRIPT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;

const dev = (() => {
  let d = store.get(DEV_KEY);
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(d)) { d = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); store.set(DEV_KEY, d); }
  return d;
})();
const mine = new Map();                       // what → the note this tab holds
const lostFns = { make: [], live: [] };
let remote = { at: 0, acts: {}, k: '' };
const slot = () => who.id || who.role || 'device';
const inbox = () => (SCRIPT.test(String(CONFIG.inbox || '')) ? String(CONFIG.inbox) : '');
const emit = (why) => bus.emit('activity', why);

/* ---------------- this device ---------------- */
function readAll() { const v = store.getJSON(KEY, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function myRecord(all) { const k = slot(); return all[k] && typeof all[k] === 'object' ? all[k] : (all[k] = {}); }
const fresh = (w, x, now) => !!(x && typeof x === 'object' && now - (Number(x.beat) || 0) < STALE[w]);
/* Renew this tab's notes (every 5 seconds while it holds one). */
function beat() {
  const all = readAll(), p = myRecord(all), now = Date.now(), lost = [];
  WHATS.forEach((w) => {
    const m = mine.get(w), x = p[w];
    if (m) {
      if (!m.taking && fresh(w, x, now) && x.tab !== TAB) { lost.push([w, x]); return; }
      if (!m.taking && p.end && p.end[w] && p.end[w].at > m.at && p.end[w].tab !== TAB) { delete p.end[w]; lost.push([w, { label: '', where: 'tab' }]); return; }
      p[w] = { tab: TAB, dev, beat: now, at: m.at, label: m.label, ref: m.ref };
      if (p.end && p.end[w] && p.end[w].at <= m.at) delete p.end[w];
      m.taking = false;
    } else if (x && x.tab === TAB) delete p[w];
  });
  store.setJSON(KEY, all);
  lost.forEach(([w, x]) => lose(w, x));
}
/* Another tab changed the notes: did it take over (or ask to end) what this tab holds? Read only. */
function look() {
  if (!mine.size) return;
  const p = readAll()[slot()] || {}, now = Date.now();
  WHATS.forEach((w) => {
    const m = mine.get(w);
    if (!m || m.taking) return;
    const x = p[w];
    if (fresh(w, x, now) && x.tab !== TAB) lose(w, x);
    else if (p.end && p.end[w] && p.end[w].at > m.at && p.end[w].tab !== TAB) lose(w, { label: '', where: 'tab' });
  });
}
let beatT = 0;
function beating() { clearInterval(beatT); beatT = mine.size ? setInterval(beat, BEAT) : 0; }
function localNotes(now) {
  const p = readAll()[slot()] || {}, out = {};
  WHATS.forEach((w) => { const x = p[w]; if (fresh(w, x, now) && x.tab !== TAB) out[w] = x; });
  return out;
}

/* ---------------- her other devices (the school relay) ---------------- */
let kHash = '', kFor = '';
async function teacherKey() {
  const s = slot();
  if (kFor === s && kHash) return kHash;
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ks2-act|' + s)));
  kHash = Array.from(h.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join(''); kFor = s;
  return kHash;
}
function accept(j, k) {
  const now = Date.now(), acts = {};
  WHATS.forEach((w) => {
    const x = j && j.acts && j.acts[w];
    if (x && typeof x.dev === 'string' && Number(x.left) > 0) acts[w] = { dev: x.dev, at: Number(x.at) || 0, label: String(x.label || '').slice(0, 80), ref: String(x.ref || ''), until: now + Number(x.left) * 1000 };
  });
  remote = { at: now, acts, k };
  emit('remote');
  return acts;
}
async function remoteGet() {
  const url = inbox();
  if (!url || !who.role) return null;
  const k = await teacherKey();
  const r = await fetch(url + '?relay=ks2-act&k=' + k, { cache: 'no-store', credentials: 'omit', redirect: 'follow' });
  const j = await r.json();
  if (!j || !j.ok) throw new Error('relay');
  return accept(j, k);
}
async function remotePost(body) {
  const url = inbox();
  if (!url || !who.role) return null;
  const k = await teacherKey();
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ relay: 'ks2-act', k, dev }, body)), redirect: 'follow', credentials: 'omit', cache: 'no-store' });
  const j = await r.json();
  if (!j || !j.ok) throw new Error('relay');
  accept(j, k);
  return j;
}
function remoteNotes(now) {
  const out = {};
  if (!remote.k || remote.k !== kHash || kFor !== slot()) return out;
  WHATS.forEach((w) => { const x = remote.acts[w]; if (x && x.dev !== dev && x.until > now) out[w] = x; });
  return out;
}
function renew(w) {
  const m = mine.get(w);
  if (!m || !inbox()) return;
  clearTimeout(m.rt);
  if (!who.role) { m.rt = setTimeout(() => renew(w), 3000); return; }          // still signing in after a reload
  remotePost({ op: 'set', what: w, at: m.at, label: m.label, ref: m.ref, ttl: REMOTE[w].ttl, take: m.rtake ? 1 : 0 })
    .then((j) => {
      if (mine.get(w) !== m) return;
      m.rtake = false;
      if (j && j.held === false) lose(w, Object.assign({ where: 'device' }, remote.acts[w] || {}));
    })
    .catch(() => { /* the relay did not answer: the next round tries again */ })
    .finally(() => { if (mine.get(w) === m) m.rt = setTimeout(() => renew(w), REMOTE[w].every); });
}
let lookT = 0, lookedAt = 0;
function lookAround() {
  clearTimeout(lookT);
  if (!inbox() || !who.role) return;
  if (document.visibilityState !== 'hidden' && Date.now() - lookedAt > 4000) { lookedAt = Date.now(); remoteGet().catch(() => { /* fine */ }); }
  lookT = setTimeout(lookAround, LOOK_EVERY);
}

/* ---------------- what the rest of the site uses ---------------- */
/* This tab starts something. o: { take: end the same activity elsewhere and hold it here, ref: an id of the work } */
export function hold(what, label, o) {
  o = o || {};
  const old = mine.get(what);
  if (old) clearTimeout(old.rt);
  const m = { what, label: String(label || '').slice(0, 80), at: Date.now(), ref: String(o.ref || ''), taking: !!o.take, rtake: !!o.take, rt: 0 };
  mine.set(what, m);
  beat(); beating(); renew(what);
  emit('hold');
  return m;
}
export function release(m) {
  if (!m || mine.get(m.what) !== m) return;
  clearTimeout(m.rt); mine.delete(m.what);
  beat(); beating();
  if (inbox() && who.role) remotePost({ op: 'free', what: m.what }).catch(() => { /* it runs out by itself */ });
  emit('release');
}
function lose(w, by) {
  const m = mine.get(w);
  if (!m) return;
  clearTimeout(m.rt); mine.delete(w); beating();
  const all = readAll(), p = myRecord(all);
  if (p[w] && p[w].tab === TAB) delete p[w];
  if (p.end && p.end[w]) delete p.end[w];
  store.setJSON(KEY, all);
  if (inbox() && who.role) remotePost({ op: 'free', what: w }).catch(() => { /* only frees this device's own note */ });
  emit('lost');
  lostFns[w].forEach((fn) => { try { fn(by || null); } catch (e) { console.error(e); } });
}
/* fn(by) runs when another screen takes over `what` from this tab, or asks it to end. */
export function onLost(what, fn) { if (lostFns[what]) lostFns[what].push(fn); }
/* What stops `what` from starting now: { what, where: 'here' | 'tab' | 'device', label, at }, or null.
   Make: a live lesson anywhere (this tab too), or something being made in another tab or on another device.
   Live: a live lesson in another tab or on another device. */
export function blocker(what) {
  const now = Date.now(), loc = localNotes(now), rem = remoteNotes(now);
  const other = (w) => {
    const x = loc[w];
    if (x) return { what: w, where: 'tab', label: x.label || '', at: Number(x.at) || 0 };
    const y = rem[w];
    return y ? { what: w, where: 'device', label: y.label || '', at: y.at || 0 } : null;
  };
  if (what === 'live') return other('live');
  if (what === 'make') {
    const lv = mine.get('live');
    if (lv) return { what: 'live', where: 'here', label: lv.label, at: lv.at };
    return other('live') || other('make');
  }
  return null;
}
/* The same, after asking the school relay (at most 2.5 seconds; if it does not answer, only this device counts). */
export async function check(what) {
  if (inbox() && who.role) {
    try { await Promise.race([remoteGet(), new Promise((r) => setTimeout(r, ASK_WAIT))]); } catch (e) { /* teaching goes ahead */ }
  }
  return blocker(what);
}
/* Something is being made in another tab or on another device (the Make buttons wait for it). */
export const makingElsewhere = () => { const b = blocker('make'); return !!(b && b.what === 'make'); };
/* Ask the other screen to end `what` (the header's "Live on another screen" button). */
export async function endElsewhere(what) {
  const all = readAll(), p = myRecord(all);
  p.end = p.end && typeof p.end === 'object' ? p.end : {};
  p.end[what] = { tab: TAB, at: Date.now() };
  store.setJSON(KEY, all);
  if (inbox() && who.role) { try { await remotePost({ op: 'end', what }); } catch (e) { /* tried */ } }
  emit('end-asked');
}
export const holding = (what) => mine.has(what);

/* ---------------- keeping up ---------------- */
window.addEventListener('storage', (e) => { if (e.key === KEY) { look(); emit('local'); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { lookedAt = 0; lookAround(); } });
/* A tab that closes takes its notes away (a reload with a live lesson takes them back straight after). */
window.addEventListener('pagehide', () => {
  if (!mine.size) return;
  const all = readAll(), p = myRecord(all), url = inbox();
  mine.forEach((m, w) => {
    if (p[w] && p[w].tab === TAB) delete p[w];
    if (url && kHash && kFor === slot() && navigator.sendBeacon) {
      try { navigator.sendBeacon(url, new Blob([JSON.stringify({ relay: 'ks2-act', k: kHash, dev, op: 'free', what: w })], { type: 'text/plain;charset=utf-8' })); } catch (e) { /* it runs out by itself */ }
    }
  });
  store.setJSON(KEY, all);
});
/* Signing in (or out) changes whose notes these are: move this tab's notes to the person now signed in. */
bus.on('who', () => {
  remote = { at: 0, acts: {}, k: '' }; kHash = ''; kFor = ''; lookedAt = 0;
  if (mine.size) {
    const all = readAll();
    Object.keys(all).forEach((k) => { const p = all[k]; if (p && typeof p === 'object') WHATS.forEach((w) => { if (p[w] && p[w].tab === TAB) delete p[w]; }); });
    store.setJSON(KEY, all);
    mine.forEach((m) => { m.taking = true; m.rtake = true; });
    beat(); mine.forEach((m, w) => renew(w));
  }
  setTimeout(lookAround, 300); emit('who');
});
setTimeout(lookAround, 1500);
