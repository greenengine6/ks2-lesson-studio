/* Two extras for the teacher: reminders 5 minutes before each lesson while the site is open, and her whole calendar
   as an .ics file for her own phone (each lesson weekly until the end of the term, with a 5-minute reminder). */
import { toast } from '../core.js?v=de4f9a51';
import { sfx } from '../fx/audio.js?v=de4f9a51';
import { subjectName } from '../library.js?v=de4f9a51';
import { icsEvents, homeworkEvent, downloadText, addDays, isTime, toMin } from '../ics.js?v=de4f9a51';
import { PUBLIC_HOLIDAYS } from './holidays.js?v=de4f9a51';
import { data, daySchedule, weekStart, today, termOf, isoDay, occursOn, planKey, lessonTitle, fmtTime } from './store.js?v=de4f9a51';

/* ---------------- reminders ---------------- */
let timer = 0;
const SEEN = 'ks2-engine.cal.reminded.v1';
function seen() { try { return new Set(JSON.parse(sessionStorage.getItem(SEEN) || '[]')); } catch (e) { return new Set(); } }
function mark(set) { try { sessionStorage.setItem(SEEN, JSON.stringify(Array.from(set).slice(-60))); } catch (e) { /* fine */ } }
function check() {
  const s = data().settings;
  if (!s.remind) return;
  const d = new Date(), date = today(), t = d.getHours() * 60 + d.getMinutes(), done = seen();
  daySchedule(date).forEach((x) => {
    if (x.kind !== 'lesson' || !isTime(x.start)) return;
    const left = toMin(x.start) - t, key = x.id;
    if (left > 5 || left < 0 || done.has(key)) return;
    done.add(key);
    const msg = x.title + (x.plan && x.plan.topic ? ': ' + x.plan.topic : '') + (left ? ' starts in ' + left + (left === 1 ? ' minute' : ' minutes') : ' starts now') + ' (' + fmtTime(x.start, true) + ').';
    toast(msg); sfx('chime');
    if (s.notify && typeof Notification === 'function' && Notification.permission === 'granted') {
      try { new Notification('Next lesson', { body: msg, tag: 'ks2-' + key, silent: false }); } catch (e) { /* some browsers only allow it from a service worker */ }
    }
  });
  mark(done);
}
export function startReminders() {
  if (timer) return;
  timer = setInterval(check, 20000);
  setTimeout(check, 1500);
}

/* ---------------- her calendar as a file ---------------- */
export function teacherICS() {
  const d = data(), from = weekStart(today()), term = termOf(today(), d) || d.terms.find((x) => x.start > today()) || null;
  const until = term ? term.end : addDays(from, 7 * 12 - 1);
  const list = [];
  d.lessons.forEach((l) => {
    let first = addDays(from, l.day - 1);
    if (l.from && first < l.from) { while (first < l.from) first = addDays(first, 7); }
    const last = l.until && l.until < until ? l.until : until;
    if (first > last) return;
    const ex = [], changed = [];
    for (let dt = first; dt <= last; dt = addDays(dt, 7)) {
      if (!occursOn(l, dt)) { ex.push(dt); continue; }
      const p = d.plans[planKey(dt, l.id)], ov = d.overrides[planKey(dt, l.id)];
      if ((p && p.topic) || ov) changed.push(dt);
    }
    const desc = (x) => [x.note, x.place ? 'Room: ' + x.place : '', x.link ? 'Online class: ' + x.link : ''].filter(Boolean).join('\n');
    list.push({ uid: 'lesson-' + l.id, title: lessonTitle(l), desc: desc(l), location: l.place || (l.link ? 'Online' : ''), url: l.link, date: first, start: l.start, finish: l.end, rrule: { byday: l.day, until: last }, exdates: ex, alarm: { before: 5 } });
    changed.forEach((dt) => {
      const it = daySchedule(dt).find((x) => x.kind === 'lesson' && x.slotId === l.id);
      if (!it) return;
      list.push({ uid: 'lesson-' + l.id, recurrence: dt, seriesStart: l.start, title: it.title + (it.plan && it.plan.topic ? ': ' + it.plan.topic : ''), desc: desc(it), location: it.place || (it.link ? 'Online' : ''), url: it.link, date: dt, start: it.start, finish: it.end, alarm: { before: 5 } });
    });
  });
  d.events.forEach((e) => {
    if (e.weekly) {
      let first = e.date; while (first < from) first = addDays(first, 7);
      const last = e.until && e.until < until ? e.until : until;
      if (first > last) return;
      list.push({ uid: 'event-' + e.id, title: e.title, desc: e.note, location: e.place, url: e.link, date: first, allDay: e.allDay, start: e.start, finish: e.end, rrule: { byday: isoDay(e.date), until: last }, exdates: e.skip.filter((x) => x >= first && x <= last), alarm: e.allDay ? null : { before: 5 } });
    } else if ((e.endDate || e.date) >= from && e.date <= until) {
      list.push({ uid: 'event-' + e.id, title: e.title, desc: e.note, location: e.place, url: e.link, date: e.date, end: e.endDate, allDay: e.allDay, start: e.start, finish: e.end, alarm: e.allDay ? null : { before: 5 } });
    }
  });
  d.homework.filter((h) => h.due >= from && h.due <= until).forEach((h) => {
    const ev = homeworkEvent(h, {});
    if (ev) list.push(Object.assign(ev, { uid: 'teacher-' + ev.uid, title: 'Homework due: ' + subjectName(h.subject, true) + (h.cls ? ' ' + h.cls : '') + (h.title ? ' – ' + h.title : ''), alarm: null }));
  });
  d.holidays.filter((h) => h.end >= from && h.start <= until).forEach((h) => list.push({ uid: 'hol-' + h.id, title: h.name + ' (school holiday)', date: h.start, end: h.end, allDay: true }));
  if (d.settings.publicHolidays) PUBLIC_HOLIDAYS.filter((h) => h.date >= from && h.date <= until).forEach((h) => list.push({ uid: 'ph-' + h.date + '-' + h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), title: h.replacement ? h.name : h.name + ' (public holiday)', date: h.date, allDay: true }));
  return { text: icsEvents(list, { name: 'KS2 timetable' }), count: list.length, until };
}
export function downloadTeacherICS() {
  const d = data();
  if (!d.lessons.length && !d.events.length && !d.homework.length) { toast('There is nothing in your calendar to add yet.'); return false; }
  const f = teacherICS();
  downloadText(f.text, 'KS2 timetable.ics');
  toast('Saved “KS2 timetable.ics”. On an iPhone: open it, then tap Add All.');
  return true;
}
