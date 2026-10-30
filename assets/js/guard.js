/* The engine guard: one set of rules for every button that uses the engine (each press is paid for by the school).

   1. Real presses only. Not a script, not a tap still travelling while a page opens, not a swipe or a fling that
      ends on a button, not the Enter key inside a text box.
   2. Rest. After a Make button makes something, that button rests for 5 minutes (each button on its own). A press
      that ends without a result gives the time back: the engine failed, or Stop was pressed in the first 15 seconds.
   3. Caps. Everything one person makes on this device, together: at most 15 an hour and 40 a day.
   4. Small edits (the lkie.like slide editor, a worksheet rewrite): one every 8 seconds, at most 40 an hour.
   5. Symphony's chat: one question every 3 seconds, at most 20 in 10 minutes and 150 a day.
   6. One thing at a time for each teacher (activity.js). While the engine is making something for her, or her live
      lesson is running, the other Make buttons wait: in this tab, her other tabs and, once the school relay is on,
      her other devices. Presenting, the Wonder Window and Symphony stay free.
   Reaching a cap is noted in the activity log, so Rabinder's dashboard shows who keeps hitting the limits.
   The numbers can be changed in index.html ("limits"). These rules live on each device; the hard ceiling is the
   monthly spend limit on the key itself. */
import { store, bus, CONFIG } from './core.js?v=cdc164df';
import { who } from './people.js?v=cdc164df';
import { track } from './track.js?v=cdc164df';
import { hold, release, blocker, makingElsewhere } from './activity.js?v=cdc164df';

const DEF = { rest: 5, hour: 15, day: 40, editGap: 8, editHour: 40, chatGap: 3, chatTen: 20, chatDay: 150 };
const C = Object.assign({}, DEF, (CONFIG && typeof CONFIG.limits === 'object' && CONFIG.limits) || {});
export const LIMITS = {
  restMin: C.rest, rest: C.rest * 60000, hour: C.hour, day: C.day,
  editGap: C.editGap * 1000, editHour: C.editHour, chatGap: C.chatGap * 1000, chatTen: C.chatTen, chatDay: C.chatDay
};
const KEY = 'ks2-engine.guard.v1', MIN = 60000, HOUR = 3600000, DAY = 864e5;
store.set('ks2-engine.cool.v1', '');     // the first, Slide-Studio-only version of the rest
store.set('ks2-engine.job.v1', '');      // the first, this-device-only version of "one thing at a time"

/* ---------------- what each person has done on this device ---------------- */
const slot = () => who.id || who.role || 'device';
function readAll() { const v = store.getJSON(KEY, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function mine(all, now) {
  const k = slot();
  const p = all[k] && typeof all[k] === 'object' ? all[k] : (all[k] = {});
  const ok = (t) => typeof t === 'number' && t <= now + MIN;            // a time from the future means the clock moved back
  p.rest = p.rest && typeof p.rest === 'object' ? p.rest : {};
  Object.keys(p.rest).forEach((n) => { const t = p.rest[n]; if (!ok(t) || now - t >= LIMITS.rest) delete p.rest[n]; });
  p.made = (Array.isArray(p.made) ? p.made : []).filter((t) => ok(t) && now - t < DAY + HOUR);
  p.edits = (Array.isArray(p.edits) ? p.edits : []).filter((t) => ok(t) && now - t < HOUR);
  p.chat = (Array.isArray(p.chat) ? p.chat : []).filter((t) => ok(t) && now - t < DAY + HOUR);
  return p;
}
const midnight = (now) => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); };
const tomorrow = (now) => { const d = new Date(now); d.setHours(24, 0, 0, 0); return d.getTime(); };
/* When the count of `ts` inside `span` falls below `cap` again (0 if it already is). */
function freeAt(ts, span, cap, now) {
  const w = ts.filter((t) => now - t < span).sort((a, b) => a - b);
  return w.length >= cap ? w[w.length - cap] + span : 0;
}

/* ---------------- one thing at a time ---------------- */
let job = null;
export const making = () => !!job || makingElsewhere();

/* ---------------- Make buttons ---------------- */
/* { ok } or { ok: false, why: 'busy' | 'live' | 'rest' | 'hour' | 'day', where, left: ms, span: ms }, plus todayLeft.
   busy: something is being made (where: 'here', 'tab' or 'device'); live: her live lesson is running. */
export function makeState(name) {
  const now = Date.now(), p = mine(readAll(), now);
  const todayLeft = Math.max(0, LIMITS.day - p.made.filter((t) => t >= midnight(now)).length);
  if (job) return { ok: false, why: 'busy', where: 'here', left: 0, todayLeft };
  const b = blocker('make');
  if (b) return { ok: false, why: b.what === 'live' ? 'live' : 'busy', where: b.where, left: 0, todayLeft };
  const waits = [];
  if (p.rest[name]) waits.push({ why: 'rest', left: p.rest[name] + LIMITS.rest - now, span: LIMITS.rest });
  const h = freeAt(p.made, HOUR, LIMITS.hour, now);
  if (h) waits.push({ why: 'hour', left: h - now, span: HOUR });
  if (!todayLeft) waits.push({ why: 'day', left: tomorrow(now) - now, span: 0 });
  if (!waits.length) return { ok: true, why: '', left: 0, todayLeft };
  const w = waits.sort((a, b) => b.left - a.left)[0];
  return { ok: false, why: w.why, left: Math.max(1000, w.left), span: w.span, todayLeft };
}
/* The press is going ahead: start the rest and the count, and hold the "one at a time" lock. */
export function makeStart(name) {
  const now = Date.now(), all = readAll(), p = mine(all, now);
  p.rest[name] = now; p.made.push(now);
  store.setJSON(KEY, all);
  const inHour = p.made.filter((t) => now - t < HOUR).length, today = p.made.filter((t) => t >= midnight(now)).length;
  if (today >= LIMITS.day) noteLimit(name, 'day'); else if (inHour >= LIMITS.hour) noteLimit(name, 'hour');
  job = { name, at: now, note: hold('make', name) };
  paintAll();
  return { name, at: now };
}
/* outcome: 'ok' (it made something), 'error' (the engine could not finish) or 'stopped' (the person pressed Stop). */
export function makeEnd(ticket, outcome) {
  if (!ticket) return;
  if (job && job.at === ticket.at) { release(job.note); job = null; }
  const giveBack = outcome === 'error' || (outcome === 'stopped' && Date.now() - ticket.at < 15000);
  if (giveBack) {
    const all = readAll(), p = mine(all, Date.now());
    if (p.rest[ticket.name] === ticket.at) delete p.rest[ticket.name];
    const i = p.made.indexOf(ticket.at);
    if (i >= 0) p.made.splice(i, 1);
    store.setJSON(KEY, all);
  }
  paintAll();
}

/* ---------------- small edits ---------------- */
export function editState() {
  const now = Date.now(), p = mine(readAll(), now);
  if (making()) return { ok: false, why: 'busy', left: 0 };
  const last = p.edits.length ? Math.max.apply(null, p.edits) : 0;
  const waits = [];
  if (last && now - last < LIMITS.editGap) waits.push({ why: 'gap', left: last + LIMITS.editGap - now });
  const h = freeAt(p.edits, HOUR, LIMITS.editHour, now);
  if (h) waits.push({ why: 'hour', left: h - now });
  if (!waits.length) return { ok: true, why: '', left: 0 };
  const w = waits.sort((a, b) => b.left - a.left)[0];
  if (w.why === 'hour') noteLimit('edit', 'hour');
  return { ok: false, why: w.why, left: Math.max(1000, w.left) };
}
export function editStart() { const now = Date.now(), all = readAll(), p = mine(all, now); p.edits.push(now); store.setJSON(KEY, all); return now; }
export function editEnd(t, ok) {
  if (ok || !t) return;
  const all = readAll(), p = mine(all, Date.now()), i = p.edits.indexOf(t);
  if (i >= 0) { p.edits.splice(i, 1); store.setJSON(KEY, all); }
}

/* ---------------- Symphony's chat ---------------- */
export function chatState() {
  const now = Date.now(), p = mine(readAll(), now);
  const last = p.chat.length ? Math.max.apply(null, p.chat) : 0;
  if (!(p.chat.filter((t) => t >= midnight(now)).length < LIMITS.chatDay)) { noteLimit('chat', 'day'); return { ok: false, why: 'day', left: tomorrow(now) - now }; }
  const ten = freeAt(p.chat, 10 * MIN, LIMITS.chatTen, now);
  if (ten) { noteLimit('chat', 'ten'); return { ok: false, why: 'ten', left: ten - now }; }
  if (last && now - last < LIMITS.chatGap) return { ok: false, why: 'gap', left: last + LIMITS.chatGap - now };
  return { ok: true, why: '', left: 0 };
}
export function chatStart() { const now = Date.now(), all = readAll(), p = mine(all, now); p.chat.push(now); store.setJSON(KEY, all); return now; }
export function chatEnd(t, ok) {
  if (ok || !t) return;
  const all = readAll(), p = mine(all, Date.now()), i = p.chat.indexOf(t);
  if (i >= 0) { p.chat.splice(i, 1); store.setJSON(KEY, all); }
}

/* ---------------- noting limits for Rabinder (at most once per kind every 10 minutes) ---------------- */
const noted = new Map();
function noteLimit(what, why) {
  const k = what + ':' + why, now = Date.now();
  if (now - (noted.get(k) || 0) < 10 * MIN) return;
  noted.set(k, now);
  try { track('limit', { what, why }); } catch (e) { /* the log is best effort */ }
}

/* ---------------- real presses only ---------------- */
let landedAt = -1e9, lastScroll = -1e9, down = null;
const when = (e) => (e && e.timeStamp > 0 ? e.timeStamp : performance.now());      // when it happened, even if handled late
document.addEventListener('pointerdown', (e) => { down = { el: e.target, x: e.clientX, y: e.clientY, sy: window.scrollY, t: when(e) }; }, { capture: true, passive: true });
window.addEventListener('scroll', (e) => { lastScroll = when(e); }, { passive: true });
/* A page has just come on screen: for a moment nothing can be pressed, so the tap that opened it cannot press too. */
export function landed() { landedAt = performance.now(); down = null; }
/* True only for a person pressing `btn` on purpose. */
export function deliberate(e, btn) {
  const d = down;
  down = null;
  if (!e || !e.isTrusted || !btn) return false;
  const now = when(e);
  if (now - landedAt < 1200) return false;                                   // the page has only just opened (or it came before)
  if (e.detail === 0) return document.activeElement === btn;                  // Enter or Space on the button itself
  if (!d || !btn.contains(d.el) || now - d.t > 15000) return now - lastScroll > 250;
  return Math.hypot(e.clientX - d.x, e.clientY - d.y) < 14 && Math.abs(window.scrollY - d.sy) < 8;   // the finger did not slide
}
/* Enter inside a text box moves on to the next box (or closes the phone keyboard): it never presses Make. */
export function enterMovesOn(form) {
  form.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.key !== 'Enter' || e.isComposing || !t || t.tagName !== 'INPUT' || !/^(text|search|number|url|email)$/.test(t.type || 'text')) return;
    e.preventDefault();
    const boxes = Array.from(form.querySelectorAll('input, textarea, select')).filter((x) => !x.disabled && x.type !== 'hidden' && x.offsetParent !== null);
    const next = boxes[boxes.indexOf(t) + 1];
    if (next) next.focus(); else t.blur();
  });
}

/* ---------------- painting the buttons ---------------- */
export const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export const clockAt = (ms) => new Date(Date.now() + ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const CLOCK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
/* Plain words for why a Make button is waiting. */
export function waitText(s) {
  const there = s.where === 'tab' ? 'in another tab' : 'on another screen';
  if (s.why === 'live') return s.where === 'here' ? 'One thing at a time: your live lesson is still running. End it (the Live button at the top) to make something new.'
    : 'One thing at a time: your live lesson is running ' + there + '. End it there, or with the Live button at the top.';
  if (s.why === 'busy') return s.where === 'tab' || s.where === 'device' ? 'One thing at a time: something is being made for you ' + there + '. This wakes up when it is ready.'
    : 'One thing at a time: this wakes up when the other one is ready.';
  if (s.why === 'rest') return 'Each Make button rests for ' + LIMITS.restMin + ' minutes after it makes something. Ready again at ' + clockAt(s.left) + '.';
  if (s.why === 'hour') return 'That is ' + LIMITS.hour + ' things made in the last hour, the most for one hour. Ready again at ' + clockAt(s.left) + '.';
  if (s.why === 'day') return 'That is ' + LIMITS.day + ' things made today, the most for one day. Ready again tomorrow.';
  return '';
}
const watched = new Map();
/* Keep `btn` in step with the rules for `o.name`.
   o: { name, label, icon (svg inner markup), fine (element for the small print), idle (its usual text),
        busy: () => its own job is running, plain: only enable or disable it, after: (state) => extra painting } */
export function watch(btn, o) {
  if (!btn) return;
  watched.set(btn, o);
  paint(btn, o);
  tick();
}
function paint(b, o) {
  if (!b.isConnected) { watched.delete(b); return false; }
  if (o.busy && o.busy()) return false;
  const s = makeState(o.name), wait = !s.ok, resting = wait && s.why !== 'busy' && s.why !== 'live';
  b.disabled = wait;
  if (o.plain) { b.title = wait ? waitText(s) : ''; if (o.after) o.after(s); return wait; }
  b.classList.toggle('resting', resting);
  b.classList.toggle('waiting', s.why === 'busy' || s.why === 'live');
  const svg = b.querySelector('svg'), span = b.querySelector('span');
  if (svg && o.icon) { const g = resting ? 'clock' : 'main'; if (svg.dataset.g !== g) { svg.innerHTML = resting ? CLOCK : o.icon; svg.dataset.g = g; } }
  if (span) span.textContent = s.why === 'busy' ? 'Making something else…' : s.why === 'live' ? 'Live lesson running' : s.why === 'day' ? 'Ready again tomorrow' : wait ? 'Ready again in ' + clock(s.left) : o.label;
  b.style.setProperty('--rest', resting && s.span ? Math.min(1, Math.max(0, 1 - s.left / s.span)).toFixed(4) : '0');
  if (o.fine) o.fine.textContent = wait ? waitText(s) : (o.idle || '') + (s.todayLeft <= 5 ? ' ' + s.todayLeft + ' left today.' : '');
  if (o.after) o.after(s);
  return wait;
}
let timer = 0;
export function paintAll() {
  let any = false;
  watched.forEach((o, b) => { if (paint(b, o)) any = true; });
  return any;
}
function tick() {
  clearTimeout(timer);
  if (paintAll() || making()) timer = setTimeout(tick, 1000);
}
window.addEventListener('storage', (e) => { if (e.key === KEY) tick(); });
bus.on('who', () => setTimeout(tick, 0));
bus.on('activity', () => setTimeout(tick, 0));
export const repaint = tick;
