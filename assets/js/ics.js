/* Calendar files (.ics) for the site: a teacher's timetable for her own phone, and homework or online-lesson times
   that pupils and parents add to theirs. Pure (no imports), so the pupils' pages can use it too.
   - Floating local times (no time zone): a phone in Malaysia reads 09:00 as 09:00 in Malaysia. X-WR-TIMEZONE tells
     Google Calendar the same.
   - RFC 5545: CRLF line ends, lines folded at 75 octets, text escaped (backslash, semicolon, comma, new line).
   - Homework is an all-day event on the day it is due, with a reminder at 6 pm the evening before (or a timed event
     when it is due at a set time); an online lesson has a reminder 10 minutes before. */

const SUBJECT_NAMES = {
  english: 'English', maths: 'Maths', science: 'Science', computing: 'Computing', history: 'History', geography: 'Geography', art: 'Art',
  dt: 'Design and technology', music: 'Music', pe: 'PE', pshe: 'PSHE', re: 'RE', bm: 'Bahasa Melayu', mandarin: 'Mandarin', french: 'French', spanish: 'Spanish', general: ''
};
export const subjectLabel = (id) => (Object.prototype.hasOwnProperty.call(SUBJECT_NAMES, id) ? SUBJECT_NAMES[id] : '');

const pad = (n) => String(n).padStart(2, '0');
const s = (x) => (typeof x === 'string' ? x.trim() : x == null ? '' : String(x).trim());
export const isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && (() => { const [y, m, dd] = d.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, dd)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === dd; })();
export const isTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export const isHttps = (u) => { try { const x = new URL(String(u)); return x.protocol === 'https:' && !!x.hostname; } catch (e) { return false; } };
export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
}
export const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
export const fromMin = (n) => pad(Math.floor(((n % 1440) + 1440) % 1440 / 60)) + ':' + pad(((n % 60) + 60) % 60);
const dOnly = (date) => date.replace(/-/g, '');
const dTime = (date, time) => dOnly(date) + 'T' + time.replace(':', '') + '00';
function stamp(now) {
  const t = now ? new Date(now) : new Date();
  return t.getUTCFullYear() + pad(t.getUTCMonth() + 1) + pad(t.getUTCDate()) + 'T' + pad(t.getUTCHours()) + pad(t.getUTCMinutes()) + pad(t.getUTCSeconds()) + 'Z';
}
const DAYS = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/* ---------------- text ---------------- */
export function escText(v) {
  return s(v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
}
/* Lines longer than 75 octets go on in a new line that starts with a space (a whole character never splits). */
const enc = typeof TextEncoder === 'function' ? new TextEncoder() : null;
const octets = (ch) => (enc ? enc.encode(ch).length : unescape(encodeURIComponent(ch)).length);
export function fold(line) {
  let out = '', cur = '', n = 0;
  for (const ch of line) {
    const b = octets(ch);
    if (n + b > 75) { out += cur + '\r\n '; cur = ''; n = 1; }
    cur += ch; n += b;
  }
  return out + cur;
}
const cleanUid = (u) => s(u).replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120) || ('e' + Date.now().toString(36));
/* The end time of a timed event: its own if it is later than the start, otherwise half an hour on (same day). */
const finishOf = (ev) => (isTime(ev.finish) && toMin(ev.finish) > toMin(ev.start) ? ev.finish : fromMin(Math.min(toMin(ev.start) + 30, 1439)));

/* ---------------- one event ----------------
   ev: { uid, title, desc, location, url, date: 'YYYY-MM-DD', end: last day for an all-day event (inclusive),
         allDay, start: 'HH:MM', finish: 'HH:MM', rrule: { byday: 1..7 (Monday is 1), until: 'YYYY-MM-DD' },
         exdates: ['YYYY-MM-DD'], recurrence: 'YYYY-MM-DD' (this event changes one date of the series with the same uid),
         alarm: { before: minutes } or { trigger: '-PT6H' }, alarmText } */
function vevent(ev, dtstamp) {
  if (!ev || !isDate(ev.date)) return [];
  const allDay = !!ev.allDay || !isTime(ev.start);
  const L = ['BEGIN:VEVENT', 'UID:' + cleanUid(ev.uid) + '@ks2-lesson-engine', 'DTSTAMP:' + dtstamp];
  if (allDay) {
    const last = isDate(ev.end) && ev.end >= ev.date ? ev.end : ev.date;
    L.push('DTSTART;VALUE=DATE:' + dOnly(ev.date), 'DTEND;VALUE=DATE:' + dOnly(addDays(last, 1)));
  } else {
    L.push('DTSTART:' + dTime(ev.date, ev.start), 'DTEND:' + dTime(ev.date, finishOf(ev)));
  }
  if (ev.rrule && ev.rrule.byday >= 1 && ev.rrule.byday <= 7) {
    let r = 'RRULE:FREQ=WEEKLY;BYDAY=' + DAYS[ev.rrule.byday];
    if (isDate(ev.rrule.until)) r += ';UNTIL=' + (allDay ? dOnly(ev.rrule.until) : dOnly(ev.rrule.until) + 'T235959');
    L.push(r);
    const ex = (Array.isArray(ev.exdates) ? ev.exdates : []).filter(isDate);
    if (ex.length) {
      for (let i = 0; i < ex.length; i += 20) {
        const part = ex.slice(i, i + 20);
        L.push(allDay ? 'EXDATE;VALUE=DATE:' + part.map(dOnly).join(',') : 'EXDATE:' + part.map((d) => dTime(d, ev.start)).join(','));
      }
    }
  }
  if (isDate(ev.recurrence)) L.push(allDay ? 'RECURRENCE-ID;VALUE=DATE:' + dOnly(ev.recurrence) : 'RECURRENCE-ID:' + dTime(ev.recurrence, isTime(ev.seriesStart) ? ev.seriesStart : ev.start));
  L.push('SUMMARY:' + escText(ev.title || 'Event'));
  if (s(ev.desc)) L.push('DESCRIPTION:' + escText(ev.desc));
  if (s(ev.location)) L.push('LOCATION:' + escText(ev.location));
  if (isHttps(ev.url)) L.push('URL:' + new URL(ev.url).href);
  if (allDay && !ev.alarm) L.push('TRANSP:TRANSPARENT');
  if (ev.alarm) {
    const trig = ev.alarm.trigger && /^-?P(T\d+[HMS])+$|^-?P\d+D(T\d+[HMS])*$/.test(ev.alarm.trigger) ? ev.alarm.trigger : '-PT' + Math.max(0, Math.round(Number(ev.alarm.before) || 0)) + 'M';
    L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escText(ev.alarmText || ev.title || 'Reminder'), 'TRIGGER:' + trig, 'END:VALARM');
  }
  L.push('END:VEVENT');
  return L;
}
/* A whole calendar file from a list of events. o: { name (the calendar's name), now } */
export function icsEvents(events, o) {
  o = o || {};
  const dtstamp = stamp(o.now);
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KS2 Lesson Engine//Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escText(o.name || 'KS2 Lesson Engine'), 'X-WR-TIMEZONE:Asia/Kuala_Lumpur'];
  (Array.isArray(events) ? events : []).forEach((ev) => { vevent(ev, dtstamp).forEach((l) => L.push(l)); });
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}

/* ---------------- homework ----------------
   hw: { id, subject, cls, year, title, details, set, due, dueTime, link }. o.name: the pupil's own first name, on their
   own device only, so the title reads "Aisyah: Maths homework". */
export function homeworkTitle(hw, o) {
  const name = s(o && o.name).slice(0, 30), subj = subjectLabel(hw && hw.subject);
  return (name ? name + ': ' : '') + (subj ? subj + ' homework' : 'Homework') + (s(hw && hw.title) ? ' – ' + s(hw.title) : '');
}
export function homeworkEvent(hw, o) {
  if (!hw || !isDate(hw.due)) return null;
  const lines = [];
  if (s(hw.details)) lines.push(s(hw.details));
  if (s(hw.cls) || s(hw.year)) lines.push('Class: ' + [s(hw.cls), s(hw.year)].filter(Boolean).join(', '));
  if (isHttps(hw.link)) lines.push('Link: ' + hw.link);
  if (isDate(hw.set)) lines.push('Set on ' + hw.set);
  const timed = isTime(hw.dueTime);
  return {
    uid: 'hw-' + cleanUid(hw.id || hw.due + '-' + (hw.title || '')) + (o && o.name ? '-' + cleanUid(o.name).toLowerCase() : ''),
    title: homeworkTitle(hw, o), desc: lines.join('\n'), url: isHttps(hw.link) ? hw.link : '', date: hw.due,
    allDay: !timed, start: timed ? hw.dueTime : '', finish: timed ? fromMin(toMin(hw.dueTime) + 15) : '',
    alarm: timed ? { trigger: '-PT' + (toMin(hw.dueTime) + 360) + 'M' } : { trigger: '-PT6H' },
    alarmText: 'Homework due tomorrow: ' + homeworkTitle(hw, Object.assign({}, o, { name: '' }))
  };
}
export function icsHomework(hw, o) {
  const list = (Array.isArray(hw) ? hw : [hw]).map((h) => homeworkEvent(h, o)).filter(Boolean);
  return icsEvents(list, { name: (o && o.calName) || 'Homework', now: o && o.now });
}

/* ---------------- online lessons for pupils ----------------
   lessons: [{ id, date, start, end, subject, title, link, cls }] → each with a reminder 10 minutes before. */
export function lessonEvent(l, o) {
  if (!l || !isDate(l.date) || !isTime(l.start)) return null;
  const subj = subjectLabel(l.subject), name = s(o && o.name).slice(0, 30);
  return {
    uid: 'ls-' + cleanUid(l.id || l.date + '-' + l.start + '-' + (l.subject || '')) + (name ? '-' + cleanUid(name).toLowerCase() : ''),
    title: (name ? name + ': ' : '') + 'Online lesson' + (subj ? ': ' + subj : '') + (s(l.title) ? ' – ' + s(l.title) : ''),
    desc: [isHttps(l.link) ? 'Join: ' + l.link : '', s(l.cls) ? 'Class: ' + s(l.cls) : ''].filter(Boolean).join('\n'),
    location: isHttps(l.link) ? 'Online' : '', url: isHttps(l.link) ? l.link : '',
    date: l.date, start: l.start, finish: isTime(l.end) ? l.end : fromMin(toMin(l.start) + 45), alarm: { before: 10 }
  };
}
export function icsLessons(lessons, o) {
  const list = (Array.isArray(lessons) ? lessons : []).map((l) => lessonEvent(l, o)).filter(Boolean);
  return icsEvents(list, { name: (o && o.calName) || 'Online lessons', now: o && o.now });
}

/* ---------------- Google Calendar (for Android phones that do not open .ics files) ---------------- */
export function googleCalLink(ev) {
  if (!ev || !isDate(ev.date)) return '';
  let dates;
  if (ev.allDay || !isTime(ev.start)) dates = dOnly(ev.date) + '/' + dOnly(addDays(isDate(ev.end) && ev.end >= ev.date ? ev.end : ev.date, 1));
  else dates = dTime(ev.date, ev.start) + '/' + dTime(ev.date, finishOf(ev));
  const q = (k, v) => (s(v) ? '&' + k + '=' + encodeURIComponent(s(v).slice(0, 1500)) : '');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' + q('text', ev.title) + '&dates=' + dates + q('details', ev.desc) + q('location', ev.location) + '&ctz=Asia%2FKuala_Lumpur';
}

/* ---------------- saving a file on the device ---------------- */
export const safeFileName = (n) => s(n).replace(/[\u0000-\u001f\u007f/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) || 'calendar.ics';
export function downloadText(text, filename, type) {
  const blob = new Blob([text], { type: type || 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = safeFileName(filename); a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
  return true;
}
