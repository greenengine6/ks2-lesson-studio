/* KS2 Lesson Engine: shared helpers, Claude connection, copying and small UI pieces. */
import { sfx } from './fx/audio.js?v=1e9e4bc0';

export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const str = (x) => (typeof x === 'string' ? x.trim() : x == null ? '' : typeof x === 'number' ? String(x) : '');
export const arr = (x) => (Array.isArray(x) ? x : []);
export const strs = (x, max) => arr(x).map(str).filter(Boolean).slice(0, max || 99);
export const num = (x, d) => { const n = Number(x); return Number.isFinite(n) ? n : d; };
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = () => window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* ---------------- icons (24px line icons) ---------------- */
export const I = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  slides: '<rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M8 20h8M12 16.5V20"/><path d="M7 9h6M7 12h4"/>',
  shapes: '<path d="M12 3.5 16.5 11h-9z"/><rect x="4" y="13.5" width="7" height="7" rx="1.4"/><circle cx="16.8" cy="17" r="3.6"/>',
  story: '<path d="M4 19.5 15.5 8l2.5 2.5L6.5 22H4z"/><path d="M14 9.5l2.5 2.5"/><path d="M17 3.5v2.5M15.75 4.75h2.5M20.5 7.5v1.6M19.7 8.3h1.6"/>',
  reading: '<path d="M3 6.4C6 4.9 9 4.9 12 6.9c3-2 6-2 9-.5v12.5c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6.9v12.5"/>',
  science: '<path d="M9.5 3.5h5"/><path d="M10.5 3.5v5.2L5 18.2a1.8 1.8 0 0 0 1.6 2.7h10.8a1.8 1.8 0 0 0 1.6-2.7l-5.5-9.5V3.5"/><path d="M7.6 14.5h8.8"/>',
  sound: '<path d="M4 9.5v5M8 7v10M12 4.5v15M16 7.5v9M20 10v4"/>',
  code: '<rect x="4" y="7" width="16" height="11" rx="3"/><path d="M12 3.5V7"/><circle cx="12" cy="3.2" r=".9" class="f"/><circle cx="9" cy="12.3" r="1.3" class="f"/><circle cx="15" cy="12.3" r="1.3" class="f"/><path d="M9.5 15.4h5M2 11v3M22 11v3"/>',
  steps: '<path d="M5 6h3M5 12h3M5 18h3"/><path d="M11.5 6h7.5M11.5 12h7.5M11.5 18h5"/><path d="M3 6l.9.9L5.5 5" stroke-width="1.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><circle cx="12" cy="15.2" r="1.4" class="f"/><path d="M12 16.4v1.8"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.7"/><circle cx="12" cy="15.2" r="1.4" class="f"/>',
  breath: '<path d="M3 9.5c3-2.4 5.6-2.4 8.6 0s5.6 2.4 9.4 0"/><path d="M3 14.5c3-2.4 5.6-2.4 8.6 0s5.6 2.4 9.4 0"/>',
  debate: '<path d="M4.8 4h8.4a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H8.6l-3.2 3v-3h-.6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M15.2 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-.6v2.8l-3-2.8h-4a2 2 0 0 1-2-2v-2.8"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  pack: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M7 21h10a2 2 0 0 0 2-2v-8"/><path d="M19.5 2.5v4M17.5 4.5h4"/>',
  wand: '<path d="M5 19l9-9M12 8l3 3"/><path d="M17 3v3M15.5 4.5h3M20 9v2M19 10h2M9 3v2M8 4h2"/>',
  play: '<path d="M8 5l11 7-11 7z" class="f"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5" class="f"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  turnL: '<path d="M9 7H5V3"/><path d="M5.6 7A8 8 0 1 1 4 12.5"/>',
  turnR: '<path d="M15 7h4V3"/><path d="M18.4 7A8 8 0 1 0 20 12.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  notes: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  pointer: '<path d="M5 3.5 18.5 10l-6 1.8L10 18z"/><path d="M14.5 16.5c1.6 1.2 3.4 1.6 5.5 1.2"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  heart: '<path d="M12 19.4C6.2 15.6 3.6 12.4 3.6 9c0-2.4 1.8-4.2 4.1-4.2 1.7 0 3 1 4.3 2.7 1.3-1.7 2.6-2.7 4.3-2.7 2.3 0 4.1 1.8 4.1 4.2 0 3.4-2.6 6.6-8.4 10.4z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  star: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
  vote: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  thumb: '<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7c1.5 0 2.5 1 2.2 2.5L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  plan: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM8.5 11h7M8.5 15h5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" class="f"/>',
  send: '<path d="M4.5 11.8 20 4.5l-4.6 15.2-3.7-6.4z"/><path d="M11.7 13.3 20 4.5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.9 2 5.1 2 7 0"/><path d="M9 9.5v.5M15 9.5v.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18 14h2.5"/>',
  board: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8 20l2-3.5M16 20l-2-3.5M7 9.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0"/>',
  pen: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.5 7.2l3 3"/>',
  marker: '<path d="M9 14.5 16.8 6.7a2 2 0 0 1 2.8 2.8L11.8 17.3z"/><path d="M9 14.5 7 16.5l2.5 2.5 2.3-1.7"/><path d="M4 21h7"/>',
  eraser: '<path d="M8.5 20H20"/><path d="M5.2 15.2 14.4 6a2 2 0 0 1 2.8 0l2.8 2.8a2 2 0 0 1 0 2.8L12 19.6H8.6z"/><path d="M9.6 10.8l4.6 4.6"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17.5l5.2-4.6 3.6 3.2 2.7-2.4L20 17.5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5 21 8v8l-5-2.5z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.9-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.5-8.5-7.5z"/><circle cx="7.6" cy="11" r="1.1" class="f"/><circle cx="10.4" cy="7.4" r="1.1" class="f"/><circle cx="14.6" cy="7.6" r="1.1" class="f"/>',
  type: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  pin: '<path d="M14.5 3.5l6 6-2.3.8-3.9 3.9.4 3.6-1.6 1.6-3.4-3.4L5 20.7 3.3 19l4.7-4.7-3.4-3.4 1.6-1.6 3.6.4 3.9-3.9z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  textsize: '<path d="M3 18 7.5 6 12 18M4.7 14h5.6"/><path d="M14 18l3-8 3 8M15 15.5h4"/>'
};
export const icon = (n, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>';

/* ---------------- storage (falls back to memory if blocked) ---------------- */
const mem = {};
export const store = {
  get(k) { try { const v = localStorage.getItem(k); return v == null ? (mem[k] || '') : v; } catch (e) { return mem[k] || ''; } },
  set(k, v) { mem[k] = v || ''; try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* memory only */ } },
  getJSON(k, d) { try { const v = JSON.parse(this.get(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } },
  setJSON(k, v) { try { this.set(k, JSON.stringify(v)); } catch (e) { /* too big or blocked */ } }
};

/* ---------------- tiny event bus ---------------- */
const handlers = {};
export const bus = {
  on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
  emit(ev, data) { (handlers[ev] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); }
};

/* ---------------- configuration (models live in index.html) ---------------- */
let cfg = {};
try { cfg = JSON.parse((document.getElementById('config') || {}).textContent || '{}'); } catch (e) { cfg = {}; }
export const CONFIG = Object.assign({
  api: 'https://api.anthropic.com/v1/messages',
  proxy: '/api/claude',
  mainModel: 'claude-sonnet-5-5',
  quickModel: 'claude-haiku-5-5'
}, cfg);

/* ---------------- teaching mode ---------------- */
const MODE_KEY = 'ks2-engine.mode.v1';
export const prefs = {
  get mode() { return store.get(MODE_KEY) === 'class' ? 'class' : 'online'; },
  set mode(m) { store.set(MODE_KEY, m === 'class' ? 'class' : 'online'); bus.emit('mode', this.mode); }
};
export function whereText(mode) {
  return mode === 'class'
    ? 'in a classroom. Pupils have mini whiteboards, talk partners and normal classroom equipment'
    : 'online in a live video lesson (Microsoft Teams, Zoom or Google Meet). Pupils are at home: they can type in the chat, unmute to talk, use reactions and hold paper up to the camera. They only have paper, pencils and everyday household items';
}
export const YEARS = ['Year 3', 'Year 4', 'Year 5', 'Year 6'];
export function ages(year) {
  return ({ 'Year 3': '7 to 8', 'Year 4': '8 to 9', 'Year 5': '9 to 10', 'Year 6': '10 to 11' })[year] || '7 to 11';
}

/* ---------------- engine connection ---------------- */
const KEY_STORE = 'ks2-lesson-studio.key.v1';      // same names as the first version, so saved keys keep working
const ACCESS_STORE = 'ks2-lesson-studio.access.v1';
let memKey = store.get(KEY_STORE);
let memAccess = store.get(ACCESS_STORE);
export const conn = { joinedNow: false, keyFromLink: false };

/* One-tap setup links. #key=sk-ant-… saves an API key on this device; #join=CODE saves a private-link code.
   Either way the secret is removed from the address bar straight away. */
(function readSetupLink() {
  const h = location.hash || '';
  const k = /(?:^#|&)key=(sk-ant-[A-Za-z0-9_-]{20,})(?:&|$)/.exec(h);
  const j = /(?:^#|&)join=([A-Za-z0-9_-]{16,128})(?:&|$)/.exec(h);
  if (!k && !j) return;
  if (k) { memKey = k[1]; memAccess = ''; store.set(KEY_STORE, memKey); store.set(ACCESS_STORE, ''); conn.keyFromLink = true; }
  else { memAccess = j[1]; store.set(ACCESS_STORE, memAccess); conn.joinedNow = true; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
})();

export const hasKey = () => !!(memAccess || memKey);
export const viaLink = () => !!memAccess;
export function setKey(v) { memKey = v; memAccess = ''; store.set(KEY_STORE, v); store.set(ACCESS_STORE, ''); bus.emit('key'); }
export function forgetKey() { memKey = ''; memAccess = ''; store.set(KEY_STORE, ''); store.set(ACCESS_STORE, ''); bus.emit('key'); }

export class AiError extends Error { constructor(code, message) { super(message || code); this.code = code; } }

export async function askClaude(prompt, o) {
  o = o || {};
  if (!o.key && !hasKey()) throw new AiError('no_key');
  const link = viaLink();
  const key = o.key || memKey;
  let res;
  try {
    res = await fetch(link && !o.key ? CONFIG.proxy : CONFIG.api, {
      method: 'POST', signal: o.signal,
      headers: link && !o.key
        ? { 'content-type': 'application/json', 'x-access-code': memAccess }
        : { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(Object.assign({ model: o.model || CONFIG.mainModel, max_tokens: o.maxTokens || 4000, stream: true, messages: o.messages || [{ role: 'user', content: prompt }] }, o.system ? { system: o.system } : {}))
    });
  } catch (e) { throw new AiError(e && e.name === 'AbortError' ? 'cancelled' : 'network'); }
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch (e) { /* not JSON */ }
    const msg = (body && body.error && body.error.message) || '';
    const etype = (body && body.error && body.error.type) || '';
    if (link && (etype === 'access_denied' || res.status === 401)) throw new AiError('bad_access', msg);
    if (link && (etype === 'not_configured' || etype === 'server_key_invalid')) throw new AiError('server_setup', msg);
    if (link && res.status === 404) throw new AiError('no_proxy', msg);
    if (res.status === 401) throw new AiError('bad_key', msg);
    if (res.status === 403) throw new AiError('forbidden', msg);
    if (res.status === 429) throw new AiError('rate_limited', msg);
    if (res.status === 529 || res.status === 503) throw new AiError('overloaded', msg);
    if (/credit balance|billing/i.test(msg)) throw new AiError('no_credit', msg);
    if (/model/i.test(msg) && (res.status === 404 || res.status === 400)) throw new AiError('model', msg);
    throw new AiError('upstream', msg || 'HTTP ' + res.status);
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', stop = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let cut;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, cut); buf = buf.slice(cut + 2);
        const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!data) continue;
        let ev;
        try { ev = JSON.parse(data); } catch (e) { continue; }
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') { text += ev.delta.text; if (o.onText) o.onText(text); }
        else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason) stop = ev.delta.stop_reason;
        else if (ev.type === 'error') throw new AiError(ev.error && ev.error.type === 'overloaded_error' ? 'overloaded' : 'upstream', ev.error && ev.error.message);
      }
    }
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError(e && e.name === 'AbortError' ? 'cancelled' : 'network');
  }
  if (!text.trim()) throw new AiError('empty');
  return { text, stop };
}
export function parseJSON(text) {
  let t = String(text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch (e) { /* try the outermost value */ }
  const firsts = ['{', '['].map((c) => t.indexOf(c)).filter((i) => i >= 0);
  const first = firsts.length ? Math.min.apply(null, firsts) : -1;
  const last = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (first >= 0 && last > first) { try { return JSON.parse(t.slice(first, last + 1)); } catch (e) { /* fall through */ } }
  throw new AiError('invalid_json');
}
export async function askJSON(prompt, o) {
  const r = await askClaude(prompt, o);
  if (r.stop === 'max_tokens') throw new AiError('truncated');
  return houseFix(parseJSON(r.text));
}

/* ---------------- the school's own words ----------------
   Rounding numbers is "rounding off" here. Every prompt asks for it, and everything the engine writes is tidied the
   same way: a key word "Round" becomes "Rounding off", and "Round 3,486 to the nearest 100" becomes
   "Round off 3,486 to the nearest 100". "Round up", "round down" and other rounds (a round shape) are left alone. */
export const HOUSE_WORDS = 'Rounding numbers is called “rounding off” at this school. Write “Round off 3,486 to the nearest 100”, “Rounding off to the nearest 10” and “3,486 rounded off to the nearest 100 is 3,500”, and use “rounding off” in key words and titles. Never call it just “round” or “rounding”.';
const ROUND_WORD = /^(?:to\s+)?round(?:ing)?$/i;
const ROUNDING_NUMBERS = /^([Rr])ounding(\s+(?:whole\s+|decimal\s+)?numbers?)$/;
const ROUND_NEAR = /\b([Rr])ound(ed|ing)?\b(?!\s+(?:off|up|down)\b)(?=(?:[^.?!\n]|\.(?=\d)){0,48}?\bto\s+(?:(?:the\s+)?nearest\b|(?:\d+|one|two|three|a)\s+(?:decimal|significant)\b))/g;
export function houseText(s) {
  if (typeof s !== 'string' || !/round/i.test(s)) return s;
  const t = s.trim();
  if (ROUND_WORD.test(t)) return (/^[A-Z]/.test(t) ? 'R' : 'r') + 'ounding off';
  const n = ROUNDING_NUMBERS.exec(t);
  if (n) return n[1] + 'ounding off' + n[2];
  return s.replace(ROUND_NEAR, (m, r, end) => r + 'ound' + (end || '') + ' off');
}
export function houseFix(v) {
  if (typeof v === 'string') return houseText(v);
  if (Array.isArray(v)) return v.map(houseFix);
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach((k) => { o[k] = houseFix(v[k]); }); return o; }
  return v;
}
export async function testConnection(key) {
  await askClaude('Reply with the single word OK.', { model: CONFIG.quickModel, maxTokens: 8, key });
}
/* What to say when this device has no engine key yet: teachers get it from their personal link; the admin from the
   site's one-tap setup link, or Connect. */
export function needKeyText() {
  const r = document.documentElement.getAttribute('data-who');
  if (r === 'teacher') return 'This device is not set up for lessons yet. Open the personal link Rabinder sent you once on this device, then sign in again.';
  if (r === 'admin') return 'The engine is not on for this device yet. Open the site’s one-tap setup link once on this device, or press Connect.';
  return 'This device is not set up yet. Open your personal link once on this device.';
}
export const NEED_KEY = 'This device is not set up yet. Open your personal link once on this device.';
export function errorCopy(code, what) {
  const thing = what || 'this';
  switch (code) {
    case 'no_key': return needKeyText();
    case 'bad_key': return 'That key did not work. Paste it again, or ask for a new setup link.';
    case 'forbidden': return 'This key is not allowed to do that. Ask the person who manages the key to check it.';
    case 'no_credit': return 'The engine account is out of credit. Ask the person who manages the key to top it up, then try again.';
    case 'rate_limited': return 'Too many requests at once. Wait a minute, then try again.';
    case 'overloaded': return 'The engine is very busy right now. Please try again in a minute.';
    case 'network': return 'Could not reach the engine. Check the internet connection and try again.';
    case 'model': return 'This page needs a small update (the engine model name) before it can make ' + thing + '.';
    case 'bad_access': return 'This private link is not valid any more. Ask for a new link and tap it once.';
    case 'server_setup': return 'The site is not fully set up yet: its key is missing or wrong on the server.';
    case 'no_proxy': return 'Private links only work on the main site address. Open the link exactly as it was sent.';
    case 'invalid_json': case 'truncated': case 'empty': return 'It came back incomplete. Please press the button again.';
    default: return 'Something went wrong while making ' + thing + '. Please try again.';
  }
}

/* ---------------- toast ---------------- */
let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('is-on');
  sfx('toast');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

/* ---------------- copying (rich text for email/Word/Teams, plain text fallback) ---------------- */
export const guard = { copying: false };   // lets the site's own Copy buttons through the copy protection
function copyEvent(html, text) {
  let ok = false;
  const h = (e) => { e.clipboardData.setData('text/html', html); e.clipboardData.setData('text/plain', text); e.preventDefault(); ok = true; };
  document.addEventListener('copy', h);
  guard.copying = true;
  try { document.execCommand('copy'); } catch (e) { /* blocked */ }
  guard.copying = false;
  document.removeEventListener('copy', h);
  return ok;
}
export function showFallback(text) {
  const box = $('#fb-text');
  box.textContent = text;
  $('#fallback').hidden = false;
  try { const r = document.createRange(); r.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignore */ }
  $('#fb-close').focus();
}
export function copyOut(html, text, okMsg) {
  const plain = () => {
    if (copyEvent(html, text)) { toast(okMsg); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(okMsg), () => showFallback(text));
    else showFallback(text);
  };
  if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
    try {
      const item = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) });
      navigator.clipboard.write([item]).then(() => toast(okMsg), plain);
      return;
    } catch (e) { /* fall through */ }
  }
  plain();
}
export const MAIL_WRAP = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#3D4852';

/* Turn note sections [{h, text|list|pairs|rows}] into email-friendly HTML and plain text. */
export function sectionsToCopy(title, sub, sections) {
  const H = (t) => '<p style="margin:14px 0 4px;font-weight:bold">' + esc(t) + '</p>';
  const UL = (xs) => '<ul style="margin:0;padding-left:20px">' + xs.map((x) => '<li style="margin:0 0 4px">' + esc(x) + '</li>').join('') + '</ul>';
  let html = '<div style="' + MAIL_WRAP + '"><p style="margin:0;font-size:17px;font-weight:bold">' + esc(title) + '</p>' + (sub ? '<p style="margin:2px 0 0;color:#6B7280">' + esc(sub) + '</p>' : '');
  const lines = [title, sub || ''];
  sections.forEach((s) => {
    if (!s) return;
    html += H(s.h);
    lines.push('', s.h.toUpperCase());
    if (s.text) { html += '<p style="margin:0">' + esc(s.text) + '</p>'; lines.push(s.text); }
    if (s.list && s.list.length) { html += s.ordered ? '<ol style="margin:0;padding-left:22px">' + s.list.map((x) => '<li style="margin:0 0 4px">' + esc(x) + '</li>').join('') + '</ol>' : UL(s.list); s.list.forEach((x, i) => lines.push((s.ordered ? (i + 1) + '. ' : '• ') + x)); }
    if (s.pairs && s.pairs.length) { html += UL(s.pairs.map((p) => p[0] + ': ' + p[1])); s.pairs.forEach((p) => lines.push('• ' + p[0] + ': ' + p[1])); }
  });
  html += '</div>';
  return { html, text: lines.filter((x, i) => !(i === 1 && !x)).join('\n') };
}

/* ---------------- fitting text inside fixed boxes ---------------- */
export function fitText(box, min) {
  if (!box) return;
  let f = 1;
  box.style.setProperty('--fs', '1');
  let guard = 0;
  while (box.scrollHeight > box.clientHeight + 1 && f > (min || 0.6) && guard++ < 20) {
    f = Math.round((f - 0.05) * 100) / 100;
    box.style.setProperty('--fs', String(f));
  }
}

/* ---------------- answer checking (escape-room codes etc.) ---------------- */
export function normAnswer(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[’']/g, "'").replace(/[,\s]+/g, '').replace(/[.!?]+$/, '').replace(/^the/, '');
}
