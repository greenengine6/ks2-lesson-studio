/* Class tools: what every tool shares.
   - The teacher's tool settings (sound, volume, flash, voice…), kept per teacher on this device (mineKey).
   - The names to pick from: "Our class" (pupils.js), or, during a live class, the pupils who have joined.
   - Full screen for the board, and the top layer (so a picker or the alarm shows over a slide in full screen too).
   - The live-class hooks: when a class is live (the Classroom page), the timer, groups, signs and points also reach
     pupils' devices through live/tasks.js. When that is missing, nothing happens.
   - Icons and colours. */
import { $, esc, store, bus, icon, reduceMotion } from '../core.js?v=cdc164df';
import { mineKey } from '../library.js?v=cdc164df';
import { pupils } from '../pupils.js?v=cdc164df';
import { Live } from '../live/session.js?v=cdc164df';
import { SOUNDS } from './alarm.js?v=cdc164df';

/* ---------------- settings ---------------- */
const SET = 'ks2-engine.tools.v1';
export const DEF = {
  sound: 'bell', volume: 85, hall: false, flash: true, voice: true, repeat: false, tick: false, mute: false, sayName: true, lastSecs: 120,
  traffic: 0, trafficSet: 0, trafficLabels: null, custom: 'Quiet reading', now: '', next: '',
  noiseTarget: 'partner', noiseAlert: true, noiseBase: -62, groupMode: 'size', groupN: 3, dice: 1, sides: 6, source: 'class'
};
const clampN = (v, a, b, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, Math.round(n))) : d; };
export function prefs() {
  const v = store.getJSON(mineKey(SET), {}), o = Object.assign({}, DEF, v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  if (!SOUNDS.some((s) => s.id === o.sound)) o.sound = DEF.sound;
  o.volume = clampN(o.volume, 0, 100, DEF.volume);
  o.lastSecs = clampN(o.lastSecs, 5, 99 * 60 + 59, DEF.lastSecs);
  o.groupN = clampN(o.groupN, 2, 10, 3); o.dice = clampN(o.dice, 1, 3, 1);
  if (![6, 10, 12, 20].includes(Number(o.sides))) o.sides = 6;
  o.custom = String(o.custom || '').slice(0, 40) || DEF.custom;
  o.now = String(o.now || '').slice(0, 60); o.next = String(o.next || '').slice(0, 60);
  ['hall', 'flash', 'voice', 'repeat', 'tick', 'mute', 'sayName', 'noiseAlert'].forEach((k) => { o[k] = !!o[k]; });
  return o;
}
export function setPrefs(patch) {
  const v = Object.assign(prefs(), patch || {});
  store.setJSON(mineKey(SET), v);
  bus.emit('tools:prefs', v);
  return v;
}

/* ---------------- random, fair ---------------- */
export function randInt(n) { const b = new Uint32Array(1); crypto.getRandomValues(b); return n > 0 ? b[0] % n : 0; }
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
/* Nobody twice until everyone has had a turn: a shuffled bag kept for this tab. */
export function fairPick(list, key) {
  if (!list.length) return { name: '', left: 0 };
  let bag = [];
  try { bag = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (e) { bag = []; }
  bag = Array.isArray(bag) ? bag.filter((n) => list.includes(n)) : [];
  if (!bag.length) bag = shuffle(list.slice());
  const name = bag.pop();
  try { sessionStorage.setItem(key, JSON.stringify(bag)); } catch (e) { /* this visit only */ }
  return { name, left: bag.length };
}
export function bagLeft(key, list) {
  try { const b = JSON.parse(sessionStorage.getItem(key) || '[]'); return Array.isArray(b) ? b.filter((n) => list.includes(n)).length : 0; } catch (e) { return 0; }
}

/* ---------------- a live class (the Classroom page) ---------------- */
let tasksP = null;
export const liveOn = () => !!(Live && Live.on);
/* The module is fetched once, the first time a class is live (calls made meanwhile wait for the same fetch). */
function tasks() {
  if (!liveOn()) return Promise.resolve(null);
  if (!tasksP) tasksP = import('../live/tasks.js?v=cdc164df').catch(() => null);
  return tasksP;
}
/* Call a live/tasks.js function only while a class is live; quietly nothing otherwise. */
export async function liveCall(name, ...args) {
  const m = await tasks();
  if (!m || typeof m[name] !== 'function') return undefined;
  try {
    if (name !== 'classOn' && typeof m.classOn === 'function' && !m.classOn()) return undefined;
    return await m[name](...args);
  } catch (e) { return undefined; }
}
/* Pupils who have joined the live class: [{ pid, name }]. */
export async function namesHere() {
  const r = await liveCall('classPupils');
  return Array.isArray(r) ? r.filter((p) => p && p.name).map((p) => ({ pid: String(p.pid || ''), name: String(p.name).slice(0, 30) })).slice(0, 80) : [];
}
export const namesClass = () => pupils();
/* The list to pick from now: { list: [names], pids: { name: pid }, source: 'class' | 'here', here: count } */
export async function nameSource(want) {
  const here = await namesHere(), cls = namesClass();
  const useHere = here.length > 0 && (want === 'here' || (want !== 'class' && liveOn()));
  const pids = {};
  here.forEach((p) => { pids[p.name] = p.pid; });
  return { list: useHere ? here.map((p) => p.name) : cls, pids, source: useHere ? 'here' : 'class', here: here.length, cls: cls.length };
}

/* ---------------- layers and full screen ---------------- */
export const layer = () => document.fullscreenElement || document.webkitFullscreenElement || document.body;
/* The open Present mode screen (engines, Slide Studio, lkie.like), or null. */
export const presentHost = () => document.querySelector('.present:not([hidden]), .spresent:not([hidden])');
export const fsOK = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
/* A tool on the whole screen, for the board: render(stage, api) draws it and may return a cleanup function.
   Full screen when the browser allows it (and nothing else is full screen already); otherwise a fixed overlay. */
const boards = [];
export function boardOverlay(title, render, o) {
  o = o || {};
  const host = layer();
  const ov = document.createElement('div');
  ov.className = 'tl-board' + (o.cls ? ' ' + o.cls : '');
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', title);
  ov.innerHTML = '<div class="tl-board-top"><span class="tl-board-t">' + esc(title) + '</span><button type="button" class="tl-board-x" data-tl-board-x aria-label="Close full screen">' + icon('close') + '<span>Close</span></button></div><div class="tl-board-stage"></div>';
  host.appendChild(ov);
  const stage = $('.tl-board-stage', ov);
  let cleanup = null, closed = false, wentFull = false;
  const api = {
    el: ov, stage,
    close() {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('fullscreenchange', onFs);
      if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* fine */ } }
      const i = boards.indexOf(api); if (i >= 0) boards.splice(i, 1);
      if (wentFull && document.fullscreenElement === ov) { try { document.exitFullscreen().catch(() => {}); } catch (e) { /* fine */ } }
      ov.remove();
      if (o.onClose) o.onClose();
      bus.emit('tools:board', false);
    }
  };
  const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) { const top = boards[boards.length - 1]; if (top === api) { e.preventDefault(); e.stopPropagation(); api.close(); } } };
  const onFs = () => { if (wentFull && document.fullscreenElement !== ov) api.close(); };
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('fullscreenchange', onFs);
  ov.addEventListener('click', (e) => { if (e.target.closest('[data-tl-board-x]')) api.close(); });
  boards.push(api);
  cleanup = render(stage, api);
  if (!document.fullscreenElement && ov.requestFullscreen) {
    ov.requestFullscreen().then(() => { wentFull = true; }).catch(() => { /* a fixed overlay is fine */ });
  }
  setTimeout(() => { const x = $('[data-tl-board-x]', ov); if (x) x.focus({ preventScroll: true }); }, 40);
  bus.emit('tools:board', true);
  return api;
}
export const boardOpen = () => boards.length > 0;

/* ---------------- a short flash of colour when time is up (never with reduced motion) ---------------- */
export function flash(color) {
  const f = document.createElement('div');
  f.className = 'tl-flash' + (reduceMotion() ? ' still' : '');
  f.style.setProperty('--fc', color || '#5B52E6');
  f.setAttribute('aria-hidden', 'true');
  layer().appendChild(f);
  setTimeout(() => f.remove(), reduceMotion() ? 2600 : 2100);
}

/* ---------------- confetti (never with reduced motion) ---------------- */
export function confetti(host, colors) {
  if (reduceMotion()) return;
  host = host || layer();
  const box = document.createElement('div');
  box.className = 'tl-confetti'; box.setAttribute('aria-hidden', 'true');
  const cs = colors && colors.length ? colors : ['#F5A524', '#3584D6', '#2C9C96', '#9A55CF', '#E2558A', '#3B9A62'];
  let h = '';
  for (let i = 0; i < 46; i++) {
    const c = cs[i % cs.length], x = randInt(100), d = 1.4 + randInt(120) / 100, dl = randInt(40) / 100, r = randInt(360), w = 8 + randInt(8);
    h += '<i style="left:' + x + '%;background:' + c + ';width:' + w + 'px;height:' + Math.round(w * 0.45) + 'px;animation-duration:' + d + 's;animation-delay:' + dl + 's;--r:' + r + 'deg"></i>';
  }
  box.innerHTML = h;
  host.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

/* ---------------- icons (24px line icons, same style as core.js) ---------------- */
export const TI = {
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5M12 2v3"/>',
  stopwatch: '<circle cx="12" cy="14" r="7.5"/><path d="M12 10.5V14l2.2 1.6M10 2.5h4M12 2.5v4M18.4 6.6l1.6-1.6"/>',
  noise: '<path d="M4 9.5v5M8 7v10M12 4.5v15M16 7.5v9M20 10v4"/>',
  names: '<circle cx="9" cy="8.5" r="3.6"/><path d="M2.8 20.5a6.2 6.2 0 0 1 12.4 0"/><path d="M17.8 4.5l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z"/>',
  groups: '<circle cx="7" cy="8" r="2.6"/><circle cx="17" cy="8" r="2.6"/><circle cx="12" cy="14.5" r="2.6"/><path d="M2.5 15.5a4.5 4.5 0 0 1 6.6-3.9M21.5 15.5a4.5 4.5 0 0 0-6.6-3.9M7.6 21.5a4.4 4.4 0 0 1 8.8 0"/>',
  signs: '<rect x="4" y="3" width="16" height="11.5" rx="2.5"/><path d="M12 14.5v6.5M8.5 21h7M8 7.5h8M8 10.5h5"/>',
  points: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  traffic: '<rect x="8" y="2.5" width="8" height="19" rx="3"/><circle cx="12" cy="7" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="17" r="1.7"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" class="f"/><circle cx="15" cy="9" r="1.2" class="f"/><circle cx="12" cy="12" r="1.2" class="f"/><circle cx="9" cy="15" r="1.2" class="f"/><circle cx="15" cy="15" r="1.2" class="f"/>',
  nownext: '<rect x="3" y="6" width="8" height="12" rx="2"/><path d="M14 12h7M17.5 8.5 21 12l-3.5 3.5"/>',
  tools: '<path d="M14.5 6.5a3.6 3.6 0 0 0 4.8 4.8l-8.6 8.6a2.3 2.3 0 0 1-3.3-3.3z"/><path d="M5 3l2.5 2.5M3 5l2.5 2.5M4 4l3 3"/>',
  pill: '<rect x="3" y="8" width="18" height="8" rx="4"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  edit: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'
};
export const ti = (n, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (TI[n] || '') + '</svg>';
export const TOOLS = [
  { id: 'timer', name: 'Timer', sub: 'Count down, with a loud end sound' },
  { id: 'stopwatch', name: 'Stopwatch', sub: 'Count up, with laps' },
  { id: 'noise', name: 'Noise meter', sub: 'How loud the room is' },
  { id: 'names', name: 'Pick a name', sub: 'Fair: nobody twice' },
  { id: 'groups', name: 'Groups', sub: 'Random groups in a tap' },
  { id: 'signs', name: 'Work signs', sub: 'Silent work, partner talk and more' },
  { id: 'points', name: 'Class points', sub: 'Teams and their points' },
  { id: 'traffic', name: 'Traffic light', sub: 'Red, amber or green' },
  { id: 'dice', name: 'Dice', sub: 'Roll up to three dice' },
  { id: 'nownext', name: 'Now and next', sub: 'What is happening now, and next' }
];
export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
/* Team and group colours: base, a darker shade for words, a light one for backgrounds. */
export const COLOURS = [
  { name: 'Orange', c: '#F5A524', d: '#8A5300', l: '#FFF1D6' }, { name: 'Blue', c: '#3584D6', d: '#1F5FA6', l: '#E1EEFB' },
  { name: 'Teal', c: '#2C9C96', d: '#1A6B67', l: '#DDF2F0' }, { name: 'Purple', c: '#9A55CF', d: '#6E3A99', l: '#F1E6FA' },
  { name: 'Pink', c: '#E2558A', d: '#A83563', l: '#FBE4EE' }, { name: 'Copper', c: '#E07B2E', d: '#9C4E12', l: '#FDEBD9' },
  { name: 'Green', c: '#3B9A62', d: '#22693F', l: '#DFF2E6' }, { name: 'Red', c: '#D9534A', d: '#9E2F28', l: '#FBE2E0' }
];
export const colourOf = (hex) => COLOURS.find((x) => x.c.toLowerCase() === String(hex || '').toLowerCase()) || COLOURS[0];
export const fmt = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60), r = s % 60; return m + ':' + String(r).padStart(2, '0'); };
