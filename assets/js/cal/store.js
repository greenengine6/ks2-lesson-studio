/* The calendar's data (one set for each teacher on this device) and what happens on each day.
   - A weekly timetable: each lesson comes back every week on its day, except dates she removes, school holidays,
     public holidays (when that switch is on) and, once term dates are set, days outside a term.
   - Events (one-off or weekly), homework, a plan for each lesson on each date (topic, things attached, note, taught),
     terms and school holidays.
   Everything is kept in this browser only, under the signed-in teacher (library.js mineKey). */
import { store, bus, uid, str } from '../core.js?v=af1c9ebd';
import { mineKey, subjectOf, subjectName, yearOf } from '../library.js?v=af1c9ebd';
import { isDate, isTime, isHttps, addDays, toMin, fromMin } from '../ics.js?v=af1c9ebd';
import { publicHolidaysOn } from './holidays.js?v=af1c9ebd';

const KEY = 'ks2-engine.cal.v1';
export const EVENT_KINDS = { meeting: 'Meeting', planning: 'Planning time', assessment: 'Assessment', event: 'School event', trip: 'Trip', holiday: 'Holiday', other: 'Other' };
export const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEF = { days: [1, 2, 3, 4, 5], start: '07:30', end: '15:30', len: 45, weekend: false, publicHolidays: true, remind: false, notify: false, setupDone: false };
const arr = (v) => (Array.isArray(v) ? v : []);
const clip = (v, n) => str(v).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, n);
const link = (v) => (isHttps(v) ? new URL(v).href.slice(0, 600) : '');

/* ---------------- dates ---------------- */
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const today = () => ymd(new Date());
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const asDate = (v) => (v instanceof Date ? ymd(v) : isDate(v) ? v : today());
export function isoDay(date) { const [y, m, d] = date.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return w === 0 ? 7 : w; }
export const weekStart = (date) => addDays(date, 1 - isoDay(date));
export const monthStart = (date) => date.slice(0, 8) + '01';
export function dateWords(date, o) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', Object.assign({ weekday: 'long', day: 'numeric', month: 'long' }, o || {}));
}
/* 9:00, 1:30 (the school day), or with am/pm when long. */
export function fmtTime(t, long) {
  if (!isTime(t)) return '';
  const [h, m] = t.split(':').map(Number), h12 = ((h + 11) % 12) + 1;
  return h12 + ':' + pad(m) + (long ? (h < 12 ? ' am' : ' pm') : '');
}
export const span = (a, b) => fmtTime(a) + (isTime(b) ? '–' + fmtTime(b) : '');

/* ---------------- loading and saving ---------------- */
let cache = null, cacheKey = '';
function normLesson(l) {
  if (!l || typeof l !== 'object') return null;
  const day = Math.round(Number(l.day));
  if (!(day >= 1 && day <= 7) || !isTime(l.start)) return null;
  const end = isTime(l.end) && toMin(l.end) > toMin(l.start) ? l.end : fromMin(Math.min(toMin(l.start) + 45, 1439));
  return {
    id: clip(l.id, 40) || uid('l'), day, start: l.start, end, subject: subjectOf(l.subject) || 'general', cls: clip(l.cls, 40), year: yearOf(l.year),
    place: clip(l.place, 80), link: link(l.link), note: clip(l.note, 400), from: isDate(l.from) ? l.from : '', until: isDate(l.until) ? l.until : '',
    skip: arr(l.skip).filter(isDate).slice(-400)
  };
}
function normEvent(e) {
  if (!e || typeof e !== 'object' || !isDate(e.date)) return null;
  const allDay = !!e.allDay || !isTime(e.start);
  return {
    id: clip(e.id, 40) || uid('e'), kind: EVENT_KINDS[e.kind] ? e.kind : 'other', title: clip(e.title, 120) || EVENT_KINDS[e.kind] || 'Event', date: e.date,
    endDate: isDate(e.endDate) && e.endDate >= e.date && allDay ? e.endDate : '', allDay, start: allDay ? '' : e.start,
    end: allDay ? '' : (isTime(e.end) && toMin(e.end) > toMin(e.start) ? e.end : fromMin(Math.min(toMin(e.start) + 60, 1439))),
    weekly: !!e.weekly, until: isDate(e.until) ? e.until : '', place: clip(e.place, 80), link: link(e.link), note: clip(e.note, 400), skip: arr(e.skip).filter(isDate).slice(-400)
  };
}
export function normHomework(h) {
  if (!h || typeof h !== 'object' || !isDate(h.due)) return null;
  return {
    id: clip(h.id, 40) || uid('hw'), subject: subjectOf(h.subject) || 'general', cls: clip(h.cls, 40), year: yearOf(h.year), title: clip(h.title, 120), details: clip(h.details, 600),
    set: isDate(h.set) ? h.set : today(), due: h.due, dueTime: isTime(h.dueTime) ? h.dueTime : '', link: link(h.link), slotId: clip(h.slotId, 40)
  };
}
const normRange = (r, kind) => (r && isDate(r.start) && isDate(r.end) && r.end >= r.start ? { id: clip(r.id, 40) || uid(kind), name: clip(r.name, 80) || (kind === 't' ? 'Term' : 'School holiday'), start: r.start, end: r.end } : null);
function normPlan(p) {
  if (!p || typeof p !== 'object') return null;
  const o = { topic: clip(p.topic, 140), items: arr(p.items).map((x) => clip(x, 160)).filter((x) => /^[a-z]+:./.test(x)).slice(0, 12), note: clip(p.note, 600), taught: !!p.taught, at: Number(p.at) || Date.now() };
  return o.topic || o.items.length || o.note || o.taught ? o : null;
}
function normalize(v) {
  const d = v && typeof v === 'object' ? v : {};
  const settings = Object.assign({}, DEF, d.settings && typeof d.settings === 'object' ? d.settings : {});
  settings.days = arr(settings.days).map(Number).filter((n) => n >= 1 && n <= 7);
  if (!settings.days.length) settings.days = DEF.days.slice();
  if (!isTime(settings.start)) settings.start = DEF.start;
  if (!isTime(settings.end) || toMin(settings.end) <= toMin(settings.start)) settings.end = fromMin(Math.min(toMin(settings.start) + 480, 1439));
  settings.len = Math.max(10, Math.min(180, Math.round(Number(settings.len) || 45)));
  ['weekend', 'publicHolidays', 'remind', 'notify', 'setupDone'].forEach((k) => { settings[k] = !!settings[k]; });
  const plans = {};
  if (d.plans && typeof d.plans === 'object') Object.keys(d.plans).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}\|[\w-]{1,40}$/.test(k)) { const p = normPlan(d.plans[k]); if (p) plans[k] = p; } });
  const overrides = {};
  if (d.overrides && typeof d.overrides === 'object') Object.keys(d.overrides).forEach((k) => {
    const o = d.overrides[k];
    if (!/^\d{4}-\d{2}-\d{2}\|[\w-]{1,40}$/.test(k) || !o || typeof o !== 'object') return;
    const x = {};
    if (isTime(o.start)) x.start = o.start;
    if (isTime(o.end)) x.end = o.end;
    if (o.place != null) x.place = clip(o.place, 80);
    if (o.link != null) x.link = link(o.link);
    if (o.note != null) x.note = clip(o.note, 400);
    if (Object.keys(x).length) overrides[k] = x;
  });
  return {
    v: 1, settings,
    lessons: arr(d.lessons).map(normLesson).filter(Boolean).slice(0, 200),
    events: arr(d.events).map(normEvent).filter(Boolean).slice(0, 600),
    homework: arr(d.homework).map(normHomework).filter(Boolean).slice(-400),
    terms: arr(d.terms).map((r) => normRange(r, 't')).filter(Boolean).sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 12),
    holidays: arr(d.holidays).map((r) => normRange(r, 'h')).filter(Boolean).sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 60),
    plans, overrides
  };
}
export function data() {
  const k = mineKey(KEY);
  if (cache && cacheKey === k) return cache;
  cache = normalize(store.getJSON(k, null)); cacheKey = k;
  return cache;
}
export function save(d, what) {
  cache = normalize(d); cacheKey = mineKey(KEY);
  store.setJSON(cacheKey, cache);
  bus.emit('calendar', what || {});
  return cache;
}
export function mutate(fn, what) { const d = JSON.parse(JSON.stringify(data())); fn(d); return save(d, what); }
bus.on('who', () => { cache = null; bus.emit('calendar', { op: 'who' }); });
window.addEventListener('storage', (e) => { if (e.key && e.key === cacheKey) { cache = null; bus.emit('calendar', { op: 'storage' }); } });

/* ---------------- what happens on a day ---------------- */
export function inTerm(date, d) { d = d || data(); return !d.terms.length || d.terms.some((t) => date >= t.start && date <= t.end); }
export function termOf(date, d) { d = d || data(); return d.terms.find((t) => date >= t.start && date <= t.end) || null; }
/* A holiday on this date: { name, kind: 'public' | 'school', change } or null. */
export function holidayOn(date, d) {
  d = d || data();
  const sch = d.holidays.find((h) => date >= h.start && date <= h.end);
  if (sch) return { name: sch.name, kind: 'school', id: sch.id };
  if (d.settings.publicHolidays) { const p = publicHolidaysOn(date); if (p.length) return { name: p.map((x) => x.name).join(' · '), kind: 'public', change: p.some((x) => x.change), state: p.some((x) => x.state) }; }
  return null;
}
export const planKey = (date, slotId) => date + '|' + slotId;
export function planFor(date, slotId) { return data().plans[planKey(date, slotId)] || null; }
export const occursOn = (l, date) => lessonOn(l, date, data());
function lessonOn(l, date, d) {
  return l.day === isoDay(date) && !l.skip.includes(date) && (!l.from || date >= l.from) && (!l.until || date <= l.until) && inTerm(date, d) && !holidayOn(date, d);
}
function eventOn(e, date) {
  if (e.skip.includes(date)) return false;
  if (e.weekly) return date >= e.date && isoDay(date) === isoDay(e.date) && (!e.until || date <= e.until);
  if (e.endDate) return date >= e.date && date <= e.endDate;
  return e.date === date;
}
export const lessonTitle = (l) => subjectName(l.subject, true) + (l.cls ? ' · ' + l.cls : l.year ? ' · ' + l.year : '');
function lessonItem(l, date, d) {
  const ov = d.overrides[planKey(date, l.id)] || {};
  const plan = d.plans[planKey(date, l.id)] || null;
  const hw = d.homework.filter((h) => h.slotId === l.id && h.set === date).map((h) => h.id);
  const start = ov.start || l.start, end = ov.end && toMin(ov.end) > toMin(start) ? ov.end : (toMin(l.end) > toMin(start) ? l.end : fromMin(Math.min(toMin(start) + 45, 1439)));
  const lk = ov.link != null ? ov.link : l.link;
  return {
    kind: 'lesson', id: planKey(date, l.id), slotId: l.id, date, start, end, title: lessonTitle(l), subject: l.subject, cls: l.cls, year: l.year,
    place: ov.place != null ? ov.place : l.place, link: lk, online: !!lk, note: ov.note != null ? ov.note : l.note, changed: !!Object.keys(ov).length,
    plan, ready: !!(plan && plan.items.length), taught: !!(plan && plan.taught), homework: hw
  };
}
export function daySchedule(date) {
  date = asDate(date);
  const d = data(), out = [];
  const hol = holidayOn(date, d);
  if (hol) out.push({ kind: 'holiday', id: date + '|h', date, allDay: true, start: '', end: '', title: hol.name, holiday: hol.kind, change: !!hol.change, subject: '' });
  d.lessons.forEach((l) => { if (lessonOn(l, date, d)) out.push(lessonItem(l, date, d)); });
  d.events.forEach((e) => {
    if (!eventOn(e, date)) return;
    out.push({ kind: 'event', id: planKey(date, e.id), slotId: e.id, date, allDay: e.allDay, start: e.start, end: e.end, title: e.title, eventKind: e.kind, place: e.place, link: e.link, online: !!e.link, note: e.note, weekly: e.weekly, subject: '' });
  });
  d.homework.forEach((h) => {
    if (h.due !== date) return;
    out.push({ kind: 'homework', id: h.id, slotId: h.slotId, date, allDay: !h.dueTime, start: h.dueTime, end: '', title: h.title || subjectName(h.subject, true) + ' homework', subject: h.subject, cls: h.cls, year: h.year, details: h.details, link: h.link, set: h.set, hw: h });
  });
  const rank = (x) => (x.kind === 'holiday' ? 0 : x.allDay ? (x.kind === 'event' ? 1 : 2) : 3);
  return out.sort((a, b) => rank(a) - rank(b) || (a.start && b.start ? toMin(a.start) - toMin(b.start) : 0) || (a.title < b.title ? -1 : 1));
}
/* Homework set on a date (shown as a small mark on that day). */
export const homeworkSetOn = (date) => data().homework.filter((h) => h.set === date);
/* The lesson or timed event happening now, and the next one today. */
export function nowNext(at) {
  const when = at instanceof Date ? at : new Date();
  const date = ymd(when), t = when.getHours() * 60 + when.getMinutes();
  const timed = daySchedule(date).filter((x) => (x.kind === 'lesson' || x.kind === 'event') && !x.allDay && isTime(x.start));
  const now = timed.find((x) => toMin(x.start) <= t && t < toMin(x.end || fromMin(toMin(x.start) + 30))) || null;
  const next = timed.find((x) => toMin(x.start) > t && x !== now) || null;
  return { now, next };
}
/* The next n lessons, events and homework, from now. */
export function upcoming(n, from) {
  const start = from instanceof Date ? from : new Date();
  const first = ymd(start), t = start.getHours() * 60 + start.getMinutes(), out = [];
  for (let i = 0; i < 70 && out.length < (n || 5); i++) {
    const date = addDays(first, i);
    daySchedule(date).forEach((x) => {
      if (x.kind === 'holiday') return;
      if (i === 0 && !x.allDay && isTime(x.start) && toMin(x.end || x.start) <= t) return;
      out.push(x);
    });
  }
  return out.slice(0, n || 5);
}
export const hasTimetable = () => data().lessons.length > 0;
/* Where a thing from My subjects is planned: [{ date, slotId, title }]. */
export function plannedFor(key) {
  const d = data(), out = [];
  Object.keys(d.plans).forEach((k) => {
    const p = d.plans[k];
    if (!p.items.includes(key)) return;
    const [date, slotId] = k.split('|'), l = d.lessons.find((x) => x.id === slotId);
    out.push({ date, slotId, title: l ? lessonTitle(l) : 'Lesson' });
  });
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
/* The next date (after `after`) on which this class has this subject again (any of its lessons), within 10 weeks:
   the natural day for homework to be due. */
export function nextDateOf(slotId, after) {
  const d = data(), l = d.lessons.find((x) => x.id === slotId);
  if (!l) return '';
  const same = d.lessons.filter((x) => x.subject === l.subject && (l.cls ? x.cls === l.cls : x.year === l.year));
  for (let i = 1; i <= 70; i++) { const date = addDays(after, i); if (same.some((x) => lessonOn(x, date, d))) return date; }
  return '';
}
/* ---------------- changes ---------------- */
export function setSettings(patch) { return mutate((d) => { Object.assign(d.settings, patch || {}); }, { op: 'settings' }); }
export function addLesson(l) { const n = normLesson(Object.assign({ id: uid('l') }, l)); if (!n) return null; mutate((d) => { d.lessons.push(n); }, { op: 'lesson' }); return n; }
export function updateLesson(id, patch) {
  let out = null;
  mutate((d) => { const i = d.lessons.findIndex((x) => x.id === id); if (i < 0) return; const n = normLesson(Object.assign({}, d.lessons[i], patch, { id })); if (n) { d.lessons[i] = n; out = n; } }, { op: 'lesson' });
  return out;
}
/* Remove a lesson: on one date only, or every week from a date (earlier weeks keep their plans). */
export function removeLesson(id, date, everyWeek) {
  mutate((d) => {
    const l = d.lessons.find((x) => x.id === id);
    if (!l) return;
    if (!everyWeek) { if (!l.skip.includes(date)) l.skip.push(date); delete d.plans[planKey(date, id)]; return; }
    const hasPast = Object.keys(d.plans).some((k) => k.endsWith('|' + id) && k.slice(0, 10) < date);
    if (hasPast && date) { l.until = addDays(date, -1); Object.keys(d.plans).forEach((k) => { if (k.endsWith('|' + id) && k.slice(0, 10) >= date) delete d.plans[k]; }); }
    else { d.lessons = d.lessons.filter((x) => x.id !== id); Object.keys(d.plans).forEach((k) => { if (k.endsWith('|' + id)) delete d.plans[k]; }); }
    Object.keys(d.overrides).forEach((k) => { if (k.endsWith('|' + id) && (!hasPast || k.slice(0, 10) >= date)) delete d.overrides[k]; });
  }, { op: 'lesson' });
}
/* Change one date of a lesson only (time, place, link, note). */
export function overrideLesson(date, id, patch) {
  mutate((d) => { d.overrides[planKey(date, id)] = Object.assign({}, d.overrides[planKey(date, id)] || {}, patch); }, { op: 'lesson' });
}
export function copyDay(fromDay, toDays) {
  mutate((d) => {
    const src = d.lessons.filter((l) => l.day === fromDay);
    toDays.forEach((day) => {
      if (day === fromDay) return;
      src.forEach((l) => {
        const clash = d.lessons.some((x) => x.day === day && toMin(x.start) < toMin(l.end) && toMin(l.start) < toMin(x.end));
        if (!clash) d.lessons.push(Object.assign({}, l, { id: uid('l'), day, skip: [] }));
      });
    });
  }, { op: 'lesson' });
}
export function addEvent(e) { const n = normEvent(Object.assign({ id: uid('e') }, e)); if (!n) return null; mutate((d) => { d.events.push(n); }, { op: 'event' }); return n; }
export function updateEvent(id, patch) {
  let out = null;
  mutate((d) => { const i = d.events.findIndex((x) => x.id === id); if (i < 0) return; const n = normEvent(Object.assign({}, d.events[i], patch, { id })); if (n) { d.events[i] = n; out = n; } }, { op: 'event' });
  return out;
}
export function removeEvent(id, date, everyWeek) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === id);
    if (!e) return;
    if (e.weekly && !everyWeek && date) { if (!e.skip.includes(date)) e.skip.push(date); return; }
    if (e.weekly && everyWeek && date && date > e.date) { e.until = addDays(date, -1); return; }
    d.events = d.events.filter((x) => x.id !== id);
  }, { op: 'event' });
}
export function setPlan(date, slotId, patch) {
  let out = null;
  mutate((d) => {
    const k = planKey(date, slotId), cur = d.plans[k] || { topic: '', items: [], note: '', taught: false };
    const p = normPlan(Object.assign({}, cur, patch, { at: Date.now() }));
    if (p) d.plans[k] = p; else delete d.plans[k];
    out = p;
  }, { op: 'plan', date, slotId });
  return out;
}
export function addHomework(h) { const n = normHomework(Object.assign({ id: uid('hw') }, h)); if (!n) return null; mutate((d) => { d.homework.push(n); }, { op: 'homework' }); return n; }
export function updateHomework(id, patch) {
  let out = null;
  mutate((d) => { const i = d.homework.findIndex((x) => x.id === id); if (i < 0) return; const n = normHomework(Object.assign({}, d.homework[i], patch, { id })); if (n) { d.homework[i] = n; out = n; } }, { op: 'homework' });
  return out;
}
export function removeHomework(id) { mutate((d) => { d.homework = d.homework.filter((x) => x.id !== id); }, { op: 'homework' }); }
export const homeworkById = (id) => data().homework.find((x) => x.id === id) || null;
export function setTerms(list) { mutate((d) => { d.terms = list; }, { op: 'terms' }); }
export function setSchoolHolidays(list) { mutate((d) => { d.holidays = list; }, { op: 'holidays' }); }
export const lessonById = (id) => data().lessons.find((x) => x.id === id) || null;
export const eventById = (id) => data().events.find((x) => x.id === id) || null;
