/* The activity log behind Rabinder's reports. It records who is teaching (the name from the PIN sign-in), when
   and for how long (active time only: the page is open and someone used it in the last two minutes), which
   engines were used, lessons made and presented, and class feedback. It never records pupils' names or what
   anyone asks Symphony. sync.js sends it to Rabinder by itself, locked so only her dashboard can open it. */
import { store, bus, uid } from './core.js?v=de4f9a51';
import { evPut, evAll } from './idb.js?v=de4f9a51';

const DEV_KEY = 'ks2-engine.device.v1', SES_KEY = 'ks2-engine.ses.v1';
const TICK = 15000, IDLE = 120000;

function kindOf() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return 'Tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'Phone';
  return 'Laptop';
}
function browserOf() {
  const ua = navigator.userAgent || '';
  return /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
}
export const device = (() => {
  let d = store.getJSON(DEV_KEY, null);
  if (!d || !d.id) { d = { id: uid('d'), kind: kindOf(), browser: browserOf(), at: Date.now() }; store.setJSON(DEV_KEY, d); }
  return d;
})();

const me = { role: '', id: '', name: '' };
let ses = null, lastInput = Date.now(), lastTick = 0, timer = 0;
const ssGet = () => { try { return JSON.parse(sessionStorage.getItem(SES_KEY) || 'null'); } catch (e) { return null; } };
const ssSet = (v) => { try { if (v) sessionStorage.setItem(SES_KEY, JSON.stringify(v)); else sessionStorage.removeItem(SES_KEY); } catch (e) { /* private mode */ } };

function save() { if (ses) { evPut(Object.assign({}, ses)); ssSet({ id: ses.id, t: ses.t, at: ses.at, act: ses.act, views: ses.views }); } }
function tick() {
  if (!ses) return;
  const now = Date.now();
  const step = Math.min(now - lastTick, TICK * 2);
  lastTick = now;
  if (!document.hidden && now - lastInput < IDLE) ses.act += step;
  ses.end = now;
  save();
}
function begin() {
  const now = Date.now(), old = ssGet();
  if (old && old.t === me.id && old.id) ses = { id: old.id, k: 'session', at: old.at, end: now, act: old.act || 0, views: old.views || 0 };
  else ses = { id: uid('s'), k: 'session', at: now, end: now, act: 0, views: 0 };
  Object.assign(ses, { t: me.id, tn: me.name, r: me.role, dev: device.id, dk: device.kind, br: device.browser });
  lastTick = now; lastInput = now;
  save();
  clearInterval(timer);
  timer = setInterval(tick, TICK);
}
function finish() {
  if (!ses) return;
  tick();
  clearInterval(timer); timer = 0;
  ses = null; ssSet(null);
}

bus.on('who', (w) => {
  const changed = !w || w.id !== me.id || w.role !== me.role;
  if (!changed) return;
  finish();
  Object.assign(me, { role: (w && w.role) || '', id: (w && w.id) || '', name: (w && w.name) || '' });
  if (me.role) begin();
});
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => window.addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden) tick(); else { lastTick = Date.now(); } });
window.addEventListener('pagehide', tick);

/* Record one thing that happened. Fields stay small: engine id, title, year, timings, counts. */
export function track(k, f) {
  if (!me.role) return null;
  const ev = Object.assign({ id: uid('e'), at: Date.now(), k, t: me.id, tn: me.name, r: me.role, dev: device.id, ses: ses ? ses.id : '' }, f || {});
  evPut(ev);
  if (ses && k === 'view') { ses.views += 1; save(); }
  bus.emit('tracked', ev);
  return ev;
}
export const current = () => Object.assign({}, me);
export async function eventsFor(personId, since) {
  const all = await evAll();
  return all.filter((e) => e.t === personId && !e.imp && (!since || (e.end || e.at) >= since));
}
