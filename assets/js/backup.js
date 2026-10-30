/* Back up and restore everything a teacher has made on this device, in one file (everything lives in this browser, so
   this keeps it safe and lets it move to another device). Kept: lessons, worksheets, quizzes, games, class summaries,
   folders, the calendar, class-tool settings, reading support and other preferences, and her own uploaded pictures.
   Never in the file: keys, PINs, sign-in data, pupils' names, activity logs. Restoring adds what is in the file to
   what is already here; it never deletes anything. */
import { bus } from './core.js?v=af1c9ebd';
import { kvGet, kvSet, kvKeys } from './idb.js?v=af1c9ebd';
import { who } from './people.js?v=af1c9ebd';

const ALLOW = [/^ks2-engine\.lkie\./, /^ks2-lesson-studio\.recent\.v1$/, /^ks2-engine\.saved\.v1$/, /^ks2-engine\.lib\./, /^ks2-engine\.cal\./, /^ks2-engine\.tools\./, /^ks2-engine\.points\./, /^ks2-engine\.reading\./,
  /^ks2-engine\.shelf\.pins\.v1$/, /^ks2-engine\.(mode|theme|sound|pointer|patient|symvoice|symspeed|symlang|wake)\.v1$/, /^ks2-engine\.today\.form\.v1$/];
const DENY = /bag|key|passkey|session|pupils|roster|\.me\.v|pinlock|guard|activity|device|\.live|voicecache|nosearch|cool|job|make\.v|eng\.open|class\.start|adminrange/;
const ok = (k) => typeof k === 'string' && ALLOW.some((r) => r.test(k)) && !DENY.test(k);
const BY_ID = new Set(['ks2-engine.lkie.packs.v1', 'ks2-lesson-studio.recent.v1', 'ks2-engine.lib.v1', 'ks2-engine.lib.folders.v1', 'ks2-engine.lkie.units.v1']);

const toData = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = () => res(''); r.readAsDataURL(b); });
async function fromData(u) { try { return await (await fetch(u)).blob(); } catch (e) { return null; } }

export async function makeBackup() {
  const local = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (ok(k)) local[k] = localStorage.getItem(k); }
  const db = {}, pics = {};
  for (const k of await kvKeys('lib:')) db[k] = await kvGet(k);
  for (const k of await kvKeys('pic:')) { const b = await kvGet(k); if (b instanceof Blob) { const d = await toData(b); if (d) pics[k] = d; } }
  const data = { app: 'ks2-lesson-engine', v: 1, at: new Date().toISOString(), by: who.name || '', local, db, pics };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const day = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return { blob, name: 'KS2 Lesson Engine backup - ' + day + '.json', things: Object.keys(db).length + countIn(local) };
}
function countIn(local) {
  let n = 0;
  try { n += (JSON.parse(local['ks2-engine.lkie.packs.v1'] || '[]') || []).length; } catch (e) { /* none */ }
  try { n += (JSON.parse(local['ks2-lesson-studio.recent.v1'] || '[]') || []).length; } catch (e) { /* none */ }
  try { const s = JSON.parse(local['ks2-engine.saved.v1'] || '{}') || {}; Object.values(s).forEach((l) => { n += Array.isArray(l) ? l.length : 0; }); } catch (e) { /* none */ }
  return n;
}
export function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
const parse = (s, d) => { try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } };
function mergeById(cur, add) {
  const a = Array.isArray(cur) ? cur : [], b = Array.isArray(add) ? add : [], seen = new Set(a.map((x) => x && x.id));
  return a.concat(b.filter((x) => x && x.id && !seen.has(x.id)));
}
/* Returns { added, kept, failed } or throws Error('not-backup'). */
export async function restoreBackup(file) {
  if (!file || file.size > 200e6) throw new Error('not-backup');
  const d = parse(await file.text(), null);
  if (!d || d.app !== 'ks2-lesson-engine' || d.v !== 1 || typeof d.local !== 'object') throw new Error('not-backup');
  let added = 0, failed = 0;
  for (const [k, v] of Object.entries(d.local || {})) {
    if (!ok(k) || typeof v !== 'string' || v.length > 8e6) continue;
    const cur = localStorage.getItem(k);
    let next = null;
    if (cur == null) next = v;
    else if (BY_ID.has(k)) { const m = mergeById(parse(cur, []), parse(v, [])); if (m.length !== parse(cur, []).length) next = JSON.stringify(m); }
    else if (k === 'ks2-engine.saved.v1') {
      const a = parse(cur, {}), b = parse(v, {}); let changed = false;
      Object.keys(b || {}).forEach((eid) => { const m = mergeById(a[eid], b[eid]); if (m.length !== (Array.isArray(a[eid]) ? a[eid].length : 0)) { a[eid] = m; changed = true; } });
      if (changed) next = JSON.stringify(a);
    } else if (k === 'ks2-engine.lib.place.v1') {
      const a = parse(cur, {}), b = parse(v, {}); next = JSON.stringify(Object.assign({}, b, a));
    }
    if (next != null) { try { localStorage.setItem(k, next); added += 1; } catch (e) { failed += 1; } }
  }
  for (const [k, v] of Object.entries(d.db || {})) { if (/^lib:/.test(k) && v && !(await kvGet(k))) { if (await kvSet(k, v)) added += 1; else failed += 1; } }
  for (const [k, v] of Object.entries(d.pics || {})) {
    if (!/^pic:[\w-]+$/.test(k) || typeof v !== 'string' || !/^data:image\//.test(v) || (await kvGet(k))) continue;
    const b = await fromData(v); if (b && (await kvSet(k, b))) added += 1; else failed += 1;
  }
  bus.emit('library', { op: 'restore' }); bus.emit('shelf');
  return { added, failed };
}
