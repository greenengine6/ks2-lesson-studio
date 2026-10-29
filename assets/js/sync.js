/* Teachers' activity reaches Rabinder by itself: nobody downloads or sends anything.

   Each device locks (encrypts) its new activity with the public key of Rabinder's dashboard, so only her dashboard
   can open it, and posts it to the inbox: a small Google Apps Script web app (CONFIG.inbox; the script is in
   inbox/Code.gs). It sends a few seconds after sign-in, every ten minutes, soon after a lesson is made or presented
   or feedback is saved, when the page is hidden, and when the internet comes back. If the device is offline, or the
   inbox is not switched on yet, nothing is lost: the activity waits on the device and goes next time.

   Rabinder's dashboard fetches the locked activity from the inbox, opens it on her device and adds it to her
   reports. Sending the same thing twice is harmless: every record has its own id. */
import { bus, CONFIG } from './core.js?v=de4f9a51';
import { evAll, evPutMany, kvGet, kvSet } from './idb.js?v=de4f9a51';
import { seal, unseal, importAdminPublic, cryptoOK } from './crypto.js?v=de4f9a51';
import { device } from './track.js?v=de4f9a51';
import { ADMIN, adminKey } from './people.js?v=de4f9a51';

export const INBOX = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(String(CONFIG.inbox || '')) ? CONFIG.inbox : '';
export const inboxOn = () => !!(INBOX && ADMIN && ADMIN.pub && cryptoOK);

const MARK = 'sync.mark', ROW = 'inbox.row', LAST = 'inbox.last', SENT = 'sync.sent';
const BOX_MAX = 40000;                    // characters per posted part (a sheet cell holds 50,000)
const EVERY = 10 * 60 * 1000, PAGE = 40;
const stamp = (e) => e.end || e.at || 0;
const order = (a, b) => stamp(a) - stamp(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const after = (e, m) => stamp(e) > m.t || (stamp(e) === m.t && e.id > m.id);
const offline = () => typeof navigator.onLine === 'boolean' && !navigator.onLine;

let pubKey = null, flying = null, again = false, soonT = 0, pulling = null;

async function post(body, keepalive) {
  const r = await fetch(INBOX, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow', credentials: 'omit', cache: 'no-store', keepalive: !!keepalive });
  const j = await r.json();
  if (!j || !j.ok) throw new Error((j && j.error) || 'inbox');
  return j;
}
function fromOf(list) { return { n: Array.from(new Set(list.map((e) => e.tn).filter(Boolean))).join(', ') || 'Teacher' }; }

/* Lock the waiting records into parts small enough for the inbox. */
async function parts(list) {
  if (!pubKey) pubKey = await importAdminPublic(ADMIN.pub);
  const out = [];
  let i = 0, n = Math.min(list.length, 300);
  while (i < list.length) {
    const size = Math.min(n, list.length - i), part = list.slice(i, i + size);
    const body = JSON.stringify(await seal(pubKey, JSON.stringify({ v: 1, kind: 'ks2-activity', from: fromOf(part), dev: device, at: Date.now(), events: part })));
    if (body.length > BOX_MAX && size > 1) { n = Math.max(1, Math.floor(size / 2)); continue; }
    const last = part[part.length - 1];
    out.push({ body: body.length > BOX_MAX ? '' : body, n: size, mark: { t: stamp(last), id: last.id } });   // a single record too big to send is skipped
    i += size;
  }
  return out;
}

/* Send everything recorded on this device since the last delivery (sessions are sent again as they grow). */
export function flush(o) {
  o = o || {};
  if (!inboxOn() || offline()) return Promise.resolve(0);
  if (flying) { again = true; return flying; }
  flying = (async () => {
    try {
      const m = (await kvGet(MARK)) || { t: 0, id: '' };
      const list = (await evAll()).filter((e) => e && e.id && e.k && e.r !== 'admin' && !e.imp && after(e, m)).sort(order);
      if (!list.length) return 0;
      const ps = await parts(list);
      let sent = 0;
      for (let k = 0; k < ps.length; k++) {
        if (o.keepalive && k > 0) break;                                   // a closing page can only carry one part
        if (ps[k].body) await post(ps[k].body, o.keepalive && ps[k].body.length < 60000);
        await kvSet(MARK, ps[k].mark);
        sent += ps[k].n;
      }
      await kvSet(SENT, { at: Date.now(), n: sent });
      return sent;
    } catch (e) { return -1; }
  })();
  return flying.then((r) => { flying = null; if (again) { again = false; soon(4000); } return r; });
}
function soon(ms) { clearTimeout(soonT); soonT = setTimeout(() => flush(), ms); }
export async function waiting() {
  const m = (await kvGet(MARK)) || { t: 0, id: '' };
  return (await evAll()).filter((e) => e && e.id && e.r !== 'admin' && !e.imp && after(e, m)).length;
}

export function initSync() {
  if (!inboxOn()) return;
  bus.on('who', (w) => { if (w && w.role) soon(4000); });
  bus.on('tracked', (ev) => { if (ev && /^(present|ticket|fb|gen|deck|play|ppt)$/.test(ev.k)) soon(15000); });
  setInterval(() => { if (!document.hidden) flush(); }, EVERY);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush({ keepalive: true }); });
  window.addEventListener('online', () => soon(3000));
  soon(8000);                                                             // anything left over from last time
}

/* ---------------- Rabinder's side: fetch, open and add ---------------- */
async function getPage(since) {
  let r;
  try { r = await fetch(INBOX + '?since=' + since + '&limit=' + PAGE, { credentials: 'omit', cache: 'no-store', redirect: 'follow' }); }
  catch (e) { const er = new Error('network'); er.code = 'network'; throw er; }
  let j;
  try { j = await r.json(); } catch (e) { const er = new Error('access'); er.code = 'access'; throw er; }
  if (!j || !j.ok) { const er = new Error('inbox'); er.code = (j && j.error) || 'inbox'; throw er; }
  return j;
}
async function merge(batches) {
  const have = new Map((await evAll()).map((e) => [e.id, e]));
  const put = [], fresh = new Map(), now = Date.now();
  batches.forEach((d) => d.events.forEach((e) => {
    if (!e || !e.id || !e.k || !e.at || e.r === 'admin') return;
    const old = have.get(e.id);
    if (old && !old.imp) return;                                         // the original is on this device
    if (old && e.k !== 'session') return;                                // already here
    if (old && ((old.act || 0) > (e.act || 0) || ((old.act || 0) === (e.act || 0) && stamp(old) >= stamp(e)))) return;   // keep the longer session
    const ev = Object.assign({}, e, { imp: now, src: (d.dev && d.dev.id) || '' });
    have.set(e.id, ev); put.push(ev);
    if (!old) { const n = e.tn || 'Teacher'; fresh.set(n, (fresh.get(n) || 0) + 1); }
  }));
  if (put.length) await evPutMany(put);
  return { changed: put.length, fresh };
}
/* Fetch everything new in the inbox. Returns { off } | { locked } | { error } | { added, people, at }. */
export function pull() {
  if (!INBOX) return Promise.resolve({ off: true });
  if (!adminKey()) return Promise.resolve({ locked: true });
  if (pulling) return pulling;
  pulling = (async () => {
    const key = adminKey();
    let row = Math.max(1, Number(await kvGet(ROW)) || 1), bad = 0;
    const batches = [];
    try {
      for (let page = 0; page < 30; page++) {
        const j = await getPage(row);
        const rows = Array.isArray(j.rows) ? j.rows : [];
        for (const x of rows) {
          try {
            const data = JSON.parse(await unseal(key, JSON.parse(x.box)));
            if (data && data.kind === 'ks2-activity' && Array.isArray(data.events)) batches.push(data); else bad++;
          } catch (e) { bad++; }
          row = Math.max(row, Number(x.row) || row);
        }
        if (rows.length < PAGE || row >= (Number(j.last) || 0)) break;
      }
    } catch (e) {
      const info = Object.assign({}, (await kvGet(LAST)) || {}, { error: e.code || 'network', tried: Date.now() });
      await kvSet(LAST, info);
      if (!batches.length) return info;
    }
    const { fresh } = await merge(batches);
    await kvSet(ROW, row);
    const added = Array.from(fresh.values()).reduce((a, b) => a + b, 0);
    if (added) {
      const subs = (await kvGet('subs')) || [];
      fresh.forEach((n, from) => subs.push({ from, n, sent: Math.max(0, ...batches.map((b) => b.at || 0)), at: Date.now(), via: 'inbox' }));
      await kvSet('subs', subs.slice(-200));
    }
    const info = { at: Date.now(), tried: Date.now(), added, people: Array.from(fresh.keys()), bad, row };
    await kvSet(LAST, info);
    return info;
  })();
  return pulling.finally(() => { pulling = null; });
}
export async function lastPull() { return (await kvGet(LAST)) || null; }
export async function lastSent() { return (await kvGet(SENT)) || null; }
