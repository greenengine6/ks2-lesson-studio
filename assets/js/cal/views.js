/* The calendar's views, drawn as HTML: Week (a time grid), Day (a list, best on phones), Month and Term. */
import { esc, icon } from '../core.js?v=3c9d4698';
import { subjectName, subjectColor } from '../library.js?v=3c9d4698';
import { isTime, addDays, toMin } from '../ics.js?v=3c9d4698';
import { data, daySchedule, homeworkSetOn, isoDay, weekStart, monthStart, today, nowMin, fmtTime, span, dateWords, DAY_SHORT, EVENT_KINDS, termOf } from './store.js?v=3c9d4698';

export const CI = {
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  hw: '<path d="M5 4.5h10.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h10.5"/><path d="M9 8.5h5"/>',
  pinmap: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  meeting: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.2c2.4.2 4.1 1.8 4.7 4.8"/>',
  assessment: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 3.5h6v3H9zM8.5 13l2.3 2.3 4.7-4.8"/>',
  trip: '<rect x="4" y="4.5" width="16" height="12.5" rx="2.5"/><path d="M4 11h16M8 17v2.5M16 17v2.5"/><circle cx="8" cy="14" r=".9" class="f"/><circle cx="16" cy="14" r=".9" class="f"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  term: '<path d="M4 5.5h16v14H4z"/><path d="M4 10h16M9 5.5v14"/>',
  door: '<path d="M6 20.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16"/><path d="M4 20.5h16"/><circle cx="14.5" cy="12.5" r=".9" class="f"/>',
  edit: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.5 7.2l3 3"/>'
};
export const ci = (n, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (CI[n] || '') + '</svg>';
const KIND_ICON = { meeting: ci('meeting'), planning: icon('plan'), assessment: ci('assessment'), event: icon('star'), trip: ci('trip'), holiday: icon('sun'), other: icon('info') };
export const kindIcon = (k) => KIND_ICON[k] || icon('info');

/* Which days of the week to show. */
export function weekDays() {
  const s = data().settings, days = s.weekend ? [1, 2, 3, 4, 5, 6, 7] : s.days.slice().sort();
  return days.length ? days : [1, 2, 3, 4, 5];
}
const shortDate = (date) => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
/* Short enough to sit beside the arrows: "Thu 29 Oct 2026", "26–30 Oct 2026", "28 Sept – 2 Oct 2026". */
export function rangeLabel(view, date) {
  if (view === 'day') return DAY_SHORT[isoDay(date)] + ' ' + shortDate(date) + ' ' + date.slice(0, 4);
  if (view === 'month') { const [y, m] = date.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
  if (view === 'term') { const t = termOf(date); return t ? t.name : 'The next 12 weeks'; }
  const days = weekDays(), ws = weekStart(date), a = addDays(ws, days[0] - 1), b = addDays(ws, days[days.length - 1] - 1);
  if (a.slice(0, 4) !== b.slice(0, 4)) return shortDate(a) + ' ' + a.slice(0, 4) + ' – ' + shortDate(b) + ' ' + b.slice(0, 4);
  if (a.slice(0, 7) === b.slice(0, 7)) return Number(a.slice(8)) + '–' + shortDate(b) + ' ' + b.slice(0, 4);
  return shortDate(a) + ' – ' + shortDate(b) + ' ' + b.slice(0, 4);
}
/* Hour marks in the week grid: "8 am", "12 pm". */
const hourLabel = (m) => { const h = Math.floor(m / 60) % 24; return (((h + 11) % 12) + 1) + (h < 12 ? ' am' : ' pm'); };
/* Very short subject names for narrow week columns (phones); the full name is in each block's label. */
const TINY = { english: 'Eng', maths: 'Maths', science: 'Sci', computing: 'ICT', history: 'Hist', geography: 'Geog', art: 'Art', dt: 'D&T', music: 'Music', pe: 'PE', pshe: 'PSHE', re: 'RE', bm: 'BM', mandarin: 'Mand', french: 'French', spanish: 'Span', general: 'All' };

/* ---------------- blocks ---------------- */
function itemSub(x) {
  if (x.kind === 'lesson') return x.plan && x.plan.topic ? esc(x.plan.topic) : (x.place ? esc(x.place) : x.online ? 'Online' : '');
  if (x.kind === 'event') return esc(EVENT_KINDS[x.eventKind] || '');
  return '';
}
function badges(x) {
  let b = '';
  if (x.kind === 'lesson') {
    if (x.ready) b += '<i class="cal-ok" title="A lesson is attached">' + icon('check') + '</i>';
    if (x.taught) b += '<i class="cal-taught" title="Taught">' + icon('star') + '</i>';
    if (x.online) b += '<i title="Online">' + icon('video') + '</i>';
    if (x.homework && x.homework.length) b += '<i title="Homework set">' + ci('hw') + '</i>';
  }
  return b ? '<span class="cal-bdg">' + b + '</span>' : '';
}
const colourOf = (x) => (x.kind === 'lesson' || x.kind === 'homework' ? subjectColor(x.subject) : x.kind === 'event' ? 'var(--cal-ev)' : 'var(--cal-hol)');
export const openAttr = (x) => 'data-copen="' + esc(x.kind + '~' + x.date + '~' + (x.kind === 'homework' ? x.id : x.slotId || '')) + '"';
function label(x) {
  const t = x.allDay || !isTime(x.start) ? '' : span(x.start, x.end) + ', ';
  if (x.kind === 'lesson') return t + x.title + (x.plan && x.plan.topic ? ', ' + x.plan.topic : '') + (x.ready ? ', ready' : '');
  if (x.kind === 'homework') return 'Homework due: ' + x.title;
  if (x.kind === 'holiday') return 'Holiday: ' + x.title;
  return t + x.title;
}
function chip(x) {
  const ic = x.kind === 'homework' ? ci('hw') : x.kind === 'holiday' ? icon('sun') : kindIcon(x.eventKind);
  const txt = x.kind === 'homework' ? 'Due: ' + (x.hw && x.hw.title ? x.hw.title : subjectName(x.subject, true)) : x.title;
  return '<button type="button" class="cal-chip k-' + x.kind + (x.holiday ? ' h-' + x.holiday : '') + '" ' + openAttr(x) + ' style="--c:' + colourOf(x) + '" aria-label="' + esc(label(x)) + '">' + ic + '<span>' + esc(txt) + '</span></button>';
}

/* Lay out overlapping items side by side: each gets a lane and the number of lanes in its group. */
function lanes(items) {
  const sorted = items.slice().sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(b.end) - toMin(a.end));
  let group = [], groupEnd = -1;
  const flush = () => { const n = Math.max(1, ...group.map((g) => g.lane + 1)); group.forEach((g) => { g.lanes = n; }); group = []; };
  const out = [];
  sorted.forEach((x) => {
    const s = toMin(x.start), e = Math.max(s + 15, toMin(x.end || x.start));
    if (s >= groupEnd && group.length) flush();
    const used = new Set(group.filter((g) => g.e > s).map((g) => g.lane));
    let lane = 0; while (used.has(lane)) lane++;
    const g = { x, s, e, lane, lanes: 1 };
    group.push(g); out.push(g);
    groupEnd = Math.max(groupEnd, e);
  });
  if (group.length) flush();
  return out;
}

/* ---------------- Week ---------------- */
export function weekHTML(date) {
  const d = data(), days = weekDays(), ws = weekStart(date), t0 = today();
  const dates = days.map((n) => addDays(ws, n - 1));
  const per = dates.map((dt) => daySchedule(dt));
  let lo = toMin(d.settings.start), hi = toMin(d.settings.end);
  per.forEach((list) => list.forEach((x) => { if (!x.allDay && isTime(x.start)) { lo = Math.min(lo, toMin(x.start)); hi = Math.max(hi, toMin(x.end || x.start) + 15); } }));
  lo = Math.max(0, Math.floor(lo / 60) * 60); hi = Math.min(1440, Math.ceil(hi / 60) * 60);
  const hours = []; for (let m = lo; m < hi; m += 60) hours.push(m);
  const head = dates.map((dt, i) => {
    const [y, mo, dd] = dt.split('-').map(Number), set = homeworkSetOn(dt).length;
    return '<button type="button" class="cal-wd' + (dt === t0 ? ' is-today' : '') + '" data-cgoday="' + dt + '" aria-label="' + esc(dateWords(dt)) + '"><b>' + DAY_SHORT[days[i]] + '</b><span>' + dd + '</span>' + (set ? '<i class="cal-set" title="Homework set this day">' + ci('hw') + '</i>' : '') + '</button>';
  }).join('');
  const allRow = dates.map((dt, i) => '<div class="cal-allc" data-date="' + dt + '">' + per[i].filter((x) => x.allDay || x.kind === 'homework').map(chip).join('') + '</div>').join('');
  const anyAll = per.some((l) => l.some((x) => x.allDay || x.kind === 'homework'));
  const cols = dates.map((dt, i) => {
    const timed = per[i].filter((x) => !x.allDay && isTime(x.start) && x.kind !== 'homework');
    const hol = per[i].find((x) => x.kind === 'holiday');
    const blocks = lanes(timed).map((g) => {
      const x = g.x, top = (g.s - lo) / 60, h = Math.max(0.42, (g.e - g.s) / 60);
      return '<button type="button" class="cal-blk k-' + x.kind + (x.ready ? ' is-ready' : '') + (x.taught ? ' is-taught' : '') + (g.e - g.s < 35 ? ' is-short' : '') + '" ' + openAttr(x) +
        ' style="--c:' + colourOf(x) + ';top:calc(' + top.toFixed(3) + ' * var(--hh));height:calc(' + h.toFixed(3) + ' * var(--hh) - 4px);left:calc(' + (g.lane / g.lanes * 100).toFixed(2) + '% + 3px);width:calc(' + (100 / g.lanes).toFixed(2) + '% - 6px)" aria-label="' + esc(label(x)) + '">' +
        '<b class="cal-blk-n">' + (x.kind === 'lesson'
          ? '<span class="cal-su"><span class="cal-su-f">' + esc(subjectName(x.subject, true)) + '</span><span class="cal-su-t">' + esc(TINY[x.subject] || subjectName(x.subject, true)) + '</span></span>' +
            (x.cls || x.year ? '<span class="cal-cl"><span class="cal-cl-d"> · </span>' + esc(x.cls || x.year) + '</span>' : '')
          : (x.kind === 'event' ? kindIcon(x.eventKind) : '') + esc(x.title)) + '</b>' +
        '<span class="cal-blk-r"><span class="cal-blk-t">' + esc(span(x.start, x.end)) + (itemSub(x) ? '<span class="cal-blk-s"> · ' + itemSub(x) + '</span>' : '') + '</span>' + badges(x) + '</span></button>';
    }).join('');
    const nm = dt === t0 && nowMin() >= lo && nowMin() <= hi ? '<div class="cal-now" style="top:calc(' + ((nowMin() - lo) / 60).toFixed(3) + ' * var(--hh))" aria-hidden="true"><i></i></div>' : '';
    return '<div class="cal-col' + (dt === t0 ? ' is-today' : '') + (hol ? ' is-hol' : '') + '" data-date="' + dt + '" data-lo="' + lo + '" role="group" aria-label="' + esc(dateWords(dt)) + '">' + blocks + nm + '</div>';
  }).join('');
  const times = hours.map((m) => '<span style="top:calc(' + ((m - lo) / 60) + ' * var(--hh))">' + hourLabel(m) + '</span>').join('');
  return '<div class="cal-wk" style="--days:' + dates.length + ';--rows:' + hours.length + '">' +
    '<div class="cal-wk-head"><span class="cal-gut"></span>' + head + '</div>' +
    (anyAll ? '<div class="cal-wk-all"><span class="cal-gut">All day</span>' + allRow + '</div>' : '') +
    '<div class="cal-wk-body"><div class="cal-times" aria-hidden="true">' + times + '</div><div class="cal-cols">' + cols + '</div></div></div>';
}

/* ---------------- Day ---------------- */
export function dayHTML(date) {
  const list = daySchedule(date), t0 = today(), isToday = date === t0, nm = nowMin();
  const all = list.filter((x) => x.allDay || x.kind === 'homework');
  const timed = list.filter((x) => !x.allDay && isTime(x.start) && x.kind !== 'homework');
  const set = homeworkSetOn(date);
  let h = '<div class="cal-day">';
  if (all.length) h += '<div class="cal-day-all">' + all.map(chip).join('') + '</div>';
  if (set.length) h += '<p class="cal-day-set">' + ci('hw') + 'Homework set today: ' + set.map((x) => esc(x.title || subjectName(x.subject, true))).join(', ') + '</p>';
  if (!timed.length) h += '<div class="cal-empty"><p>' + (list.some((x) => x.kind === 'holiday') ? 'No lessons: it is a holiday.' : 'Nothing on this day yet.') + '</p><div class="cal-empty-acts"><button type="button" class="btn small" data-cadd="lesson" data-date="' + date + '">' + icon('plus') + 'Add a lesson</button><button type="button" class="btn small" data-cadd="event" data-date="' + date + '">' + icon('plus') + 'Add an event</button></div></div>';
  let nowShown = !isToday;
  h += '<ol class="cal-agenda">';
  timed.forEach((x) => {
    if (!nowShown && toMin(x.start) > nm) { h += '<li class="cal-nowrow" aria-label="Now"><span>Now · ' + fmtTime(String(Math.floor(nm / 60)).padStart(2, '0') + ':' + String(nm % 60).padStart(2, '0'), true) + '</span></li>'; nowShown = true; }
    const live = isToday && toMin(x.start) <= nm && nm < toMin(x.end || x.start);
    h += '<li><button type="button" class="cal-ag k-' + x.kind + (live ? ' is-live' : '') + (x.ready ? ' is-ready' : '') + '" ' + openAttr(x) + ' style="--c:' + colourOf(x) + '" aria-label="' + esc(label(x)) + '">' +
      '<span class="cal-ag-t"><b>' + fmtTime(x.start) + '</b><small>' + fmtTime(x.end) + '</small></span>' +
      '<span class="cal-ag-m"><b>' + (x.kind === 'event' ? kindIcon(x.eventKind) : '') + esc(x.title) + '</b>' + (itemSub(x) ? '<small>' + itemSub(x) + '</small>' : '') + (live ? '<em>Now</em>' : '') + '</span>' + badges(x) + '</button></li>';
  });
  if (!nowShown && timed.length) h += '<li class="cal-nowrow" aria-label="Now"><span>Now · ' + fmtTime(String(Math.floor(nm / 60)).padStart(2, '0') + ':' + String(nm % 60).padStart(2, '0'), true) + '</span></li>';
  h += '</ol></div>';
  return h;
}

/* ---------------- Month ---------------- */
export function monthHTML(date) {
  const ms = monthStart(date), first = weekStart(ms), t0 = today(), month = ms.slice(0, 7), sch = data().settings;
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const dt = addDays(first, i);
    if (i >= 35 && dt.slice(0, 7) !== month) break;
    const list = daySchedule(dt), les = list.filter((x) => x.kind === 'lesson'), hw = list.filter((x) => x.kind === 'homework'), ev = list.filter((x) => x.kind === 'event'), hol = list.find((x) => x.kind === 'holiday');
    const dots = les.slice(0, 5).map((x) => '<i style="--c:' + subjectColor(x.subject) + '"' + (x.ready ? ' class="ok"' : '') + '></i>').join('') + (les.length > 5 ? '<small>+' + (les.length - 5) + '</small>' : '');
    const wd = isoDay(dt), off = !sch.days.includes(wd);
    cells += '<button type="button" class="cal-mc' + (dt.slice(0, 7) !== month ? ' is-out' : '') + (dt === t0 ? ' is-today' : '') + (hol ? ' is-hol' : '') + (off ? ' is-off' : '') + '" data-cgoday="' + dt + '" aria-label="' + esc(dateWords(dt) + (hol ? ', ' + hol.title : '') + ', ' + les.length + ' lessons' + (hw.length ? ', ' + hw.length + ' homework due' : '') + (ev.length ? ', ' + ev.length + ' events' : '')) + '">' +
      '<b>' + Number(dt.slice(8)) + '</b>' + (hol ? '<span class="cal-mh">' + esc(hol.title) + '</span>' : '') + '<span class="cal-md">' + dots + '</span>' +
      '<span class="cal-mx">' + (hw.length ? '<i title="Homework due">' + ci('hw') + hw.length + '</i>' : '') + (ev.length ? '<i title="Events">' + icon('star') + ev.length + '</i>' : '') + '</span></button>';
  }
  return '<div class="cal-mon"><div class="cal-mon-h">' + [1, 2, 3, 4, 5, 6, 7].map((n) => '<span>' + DAY_SHORT[n] + '</span>').join('') + '</div><div class="cal-mon-g">' + cells + '</div></div>';
}

/* ---------------- Term ---------------- */
export function termHTML(date) {
  const d = data(), t = termOf(date) || d.terms.find((x) => x.end >= today()) || null;
  let start, end, title;
  if (t) { start = weekStart(t.start); end = t.end; title = esc(t.name) + ' <small>' + esc(shortDate(t.start) + ' – ' + shortDate(t.end) + ' ' + t.end.slice(0, 4)) + '</small>'; }
  else { start = weekStart(today()); end = addDays(start, 7 * 12 - 1); title = 'The next 12 weeks'; }
  let rows = '', n = 0;
  for (let ws = start; ws <= end && n < 20; ws = addDays(ws, 7), n++) {
    let les = 0, ready = 0, taught = 0, hw = 0; const hols = new Set();
    for (let i = 0; i < 7; i++) {
      daySchedule(addDays(ws, i)).forEach((x) => {
        if (x.kind === 'lesson') { les++; if (x.ready) ready++; if (x.taught) taught++; }
        else if (x.kind === 'homework') hw++;
        else if (x.kind === 'holiday') hols.add(x.title);
      });
    }
    const cur = ws === weekStart(today());
    rows += '<li><button type="button" class="cal-tw' + (cur ? ' is-now' : '') + '" data-cgoweek="' + ws + '"><span class="cal-tw-n"><b>Week ' + (n + 1) + '</b><small>' + esc(shortDate(ws) + ' – ' + shortDate(addDays(ws, 4))) + '</small></span>' +
      '<span class="cal-tw-bar" aria-hidden="true"><i style="width:' + (les ? Math.round(ready / les * 100) : 0) + '%"></i></span>' +
      '<span class="cal-tw-c">' + les + ' lessons · ' + ready + ' ready · ' + taught + ' taught' + (hw ? ' · ' + hw + ' homework' : '') + '</span>' +
      (hols.size ? '<span class="cal-tw-h">' + icon('sun') + esc(Array.from(hols).join(' · ')) + '</span>' : '') + '</button></li>';
  }
  return '<div class="cal-term"><h2 class="cal-term-h">' + title + '</h2>' + (!d.terms.length ? '<p class="fine">Add your term dates to see each term week by week. <button type="button" class="linkbtn" data-cadd="terms">Add term dates</button></p>' : '') + '<ol class="cal-tws">' + rows + '</ol></div>';
}
