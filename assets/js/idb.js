/* One IndexedDB database for the site: "kv" keeps small values (such as the admin key, which stays a
   non-exportable CryptoKey) and "events" keeps the activity log that Rabinder's reports are built from.
   If IndexedDB is unavailable (some private windows), everything falls back to memory for this visit. */
const NAME = 'ks2-engine', VERSION = 2;
let conn = null;
const mem = { kv: new Map(), events: new Map() };

function open() {
  if (conn) return conn;
  conn = new Promise((res) => {
    let q;
    try { q = indexedDB.open(NAME, VERSION); } catch (e) { res(null); return; }
    q.onupgradeneeded = () => {
      const d = q.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      if (!d.objectStoreNames.contains('events')) d.createObjectStore('events', { keyPath: 'id' }).createIndex('at', 'at');
    };
    q.onsuccess = () => { const d = q.result; d.onversionchange = () => { d.close(); conn = null; }; res(d); };
    q.onerror = () => res(null);
    q.onblocked = () => res(null);
  });
  return conn;
}
function run(store, mode, make) {
  return open().then((d) => new Promise((res) => {
    if (!d) { res(undefined); return; }
    try {
      const t = d.transaction(store, mode), q = make(t.objectStore(store));
      if (mode === 'readonly') { q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }
      else { t.oncomplete = () => res(true); t.onerror = () => res(false); t.onabort = () => res(false); }
    } catch (e) { res(undefined); }
  }));
}
const live = async () => !!(await open());

export async function kvGet(k) { return (await live()) ? run('kv', 'readonly', (s) => s.get(k)) : mem.kv.get(k); }
export async function kvSet(k, v) { if (await live()) return run('kv', 'readwrite', (s) => s.put(v, k)); mem.kv.set(k, v); return true; }
export async function kvDel(k) { if (await live()) return run('kv', 'readwrite', (s) => s.delete(k)); mem.kv.delete(k); return true; }

export async function evPut(ev) { if (await live()) return run('events', 'readwrite', (s) => s.put(ev)); mem.events.set(ev.id, ev); return true; }
export async function evPutMany(list) {
  if (!(await live())) { list.forEach((ev) => mem.events.set(ev.id, ev)); return true; }
  return run('events', 'readwrite', (s) => { list.forEach((ev) => s.put(ev)); return s; });
}
export async function evAll() { if (await live()) return (await run('events', 'readonly', (s) => s.getAll())) || []; return Array.from(mem.events.values()); }
export async function evClear() { if (await live()) return run('events', 'readwrite', (s) => s.clear()); mem.events.clear(); return true; }
