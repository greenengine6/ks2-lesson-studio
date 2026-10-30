/* The Calendar page (#/calendar): the teacher's own week (a timetable that comes back every week), meetings and
   events, homework, term dates, school holidays and Malaysian public holidays (Perak). Each lesson on each date has
   a plan: a topic, things attached from My subjects (a green tick when one is attached), a note and a Taught tick.
   From a lesson she makes its slides, worksheet, quiz or game, starts the class, or sets homework that pupils add to
   their own phone calendar with a link or a QR code (no names, no accounts).
   Views: Week (a time grid with a now-line), Day (a list; the phone's default), Month and Term. Plan my week asks
   Symphony for a topic for every lesson. Reminders 5 minutes before each lesson while the site is open, and the
   whole calendar as a file for her phone.
   Other pages use the exports: the Today page (daySchedule, todayText), the Now-and-next tool (nowNext). */
import { $, $$, esc, icon, toast, bus } from './core.js?v=3c9d4698';
import { subjectName } from './library.js?v=3c9d4698';
import { isDate, isTime, addDays, toMin, fromMin } from './ics.js?v=3c9d4698';
import * as S from './cal/store.js?v=3c9d4698';
import { weekHTML, dayHTML, monthHTML, termHTML, rangeLabel, ci, CI } from './cal/views.js?v=3c9d4698';
import { openItemSheet, lessonForm, eventForm, homeworkForm, rangesForm, settingsForm, closeSheet, sheetOpen, setShareHandler, openSheet } from './cal/sheet.js?v=3c9d4698';
import { openShare, dueThisWeek } from './cal/share.js?v=3c9d4698';
import { wirePlanButton, SPARK } from './cal/plan.js?v=3c9d4698';
import { startReminders, downloadTeacherICS, teacherICS } from './cal/extras.js?v=3c9d4698';

export { daySchedule, nowNext, upcoming, plannedFor, hasTimetable, planFor, setPlan, homeworkSetOn, nextDateOf } from './cal/store.js?v=3c9d4698';
export { downloadTeacherICS as exportICS, teacherICS, startReminders };

setShareHandler((list) => openShare(list, openSheet));

/* ---------------- what Symphony can say ---------------- */
export function todayText(lang) {
  const ms = /^ms/.test(String(lang || ''));
  if (!S.hasTimetable()) return ms ? 'Kalendar anda belum ada kelas. Tambah kelas anda di halaman Kalendar.' : 'Your calendar has no lessons yet. Add your lessons on the Calendar page.';
  const list = S.daySchedule(S.today());
  const les = list.filter((x) => x.kind === 'lesson'), ev = list.filter((x) => x.kind === 'event' && !x.allDay && isTime(x.start)), hw = list.filter((x) => x.kind === 'homework'), hol = list.find((x) => x.kind === 'holiday');
  const one = (x) => (x.year ? x.year + ' ' : '') + subjectName(x.subject, true) + (x.cls ? ' (' + x.cls + ')' : '') + (ms ? ' pukul ' : ' at ') + S.fmtTime(x.start, true) +
    (x.plan && x.plan.topic ? ', ' + x.plan.topic : '') + (x.kind === 'lesson' ? (x.ready ? (ms ? ', sudah sedia' : ', ready') : (ms ? ', belum ada pelajaran' : ', nothing attached yet')) : '');
  const parts = [];
  if (hol) parts.push(ms ? 'Hari ini cuti: ' + hol.title + '.' : 'Today is a holiday: ' + hol.title + '.');
  if (les.length) parts.push((ms ? 'Hari ini ada ' + les.length + ' kelas: ' : 'Today you have ' + les.length + (les.length === 1 ? ' lesson: ' : ' lessons: ')) + les.map(one).join('; ') + '.');
  else if (!hol) {
    const nx = S.upcoming(8).find((x) => x.kind === 'lesson');
    parts.push(ms ? 'Tiada kelas hari ini.' : 'No lessons today.');
    if (nx) parts.push(ms ? 'Kelas seterusnya: ' + one(nx) + ', ' + S.dateWords(nx.date) + '.' : 'Your next lesson is ' + one(nx) + ' on ' + S.dateWords(nx.date) + '.');
  }
  if (ev.length) parts.push((ms ? 'Juga: ' : 'Also: ') + ev.map((x) => x.title + (ms ? ' pukul ' : ' at ') + S.fmtTime(x.start, true)).join('; ') + '.');
  if (hw.length) parts.push((ms ? 'Kerja rumah perlu dihantar hari ini: ' : 'Homework due today: ') + hw.map((x) => subjectName(x.subject, true) + (x.hw && x.hw.title ? ', ' + x.hw.title : '')).join('; ') + '.');
  return parts.join(' ');
}

/* ---------------- the page ---------------- */
const P = { root: null, mode: '', date: S.today(), step: 1, tick: 0, redraw: 0, touch: null };
const MODES = ['day', 'week', 'month', 'term'];
const MODE_NAMES = { day: 'Day', week: 'Week', month: 'Month', term: 'Term' };
const phone = () => window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
const defaultMode = () => (phone() ? 'day' : 'week');
const visible = () => !!(P.root && P.root.isConnected && !P.root.hidden && !P.root.closest('[hidden]'));

export function mount(view, sub) {
  P.root = view;
  const s = String(sub || '').trim().toLowerCase();
  if (MODES.includes(s) || s === 'setup') { P.mode = s; if (s === 'setup') P.step = 1; }
  else if (isDate(s)) { P.date = s; if (!P.mode || P.mode === 'setup' || P.mode === 'month' || P.mode === 'term') P.mode = defaultMode(); }
  else if (!P.mode) P.mode = defaultMode();
  if (!view.dataset.calWired) { wire(view); view.dataset.calWired = '1'; }
  render();
  clearInterval(P.tick);
  P.tick = setInterval(nowTick, 30000);
  startReminders();
}
export function leave() { clearInterval(P.tick); P.tick = 0; closeSheet(); closeMenus(); }

function head() {
  const t = P.mode === 'setup' ? 'Set up your week' : P.mode === 'day' ? (P.date === S.today() ? 'Today' : S.dateWords(P.date)) : P.mode === 'month' ? 'Your month' : P.mode === 'term' ? 'Your term' : 'Your week';
  const add = [['lesson', icon('slides'), 'A lesson (every week)'], ['event', ci('meeting'), 'A meeting or event'], ['homework', ci('hw'), 'Homework'], ['holidays', icon('sun'), 'A school holiday'], ['terms', ci('term'), 'Term dates']];
  const more = [['phone', ci('phone'), 'Add to my phone’s calendar'], ['sharewk', ci('share'), 'Share homework due this week'], ['setup', ci('gear'), 'Set up my week'], ['settings', ci('gear'), 'Calendar settings']];
  return '<header class="pg-head cal-head"><div class="cal-head-t"><p class="kicker">' + ci('cal') + 'Calendar</p><h1>' + esc(t) + '</h1>' +
    '<p class="pg-sub">' + (P.mode === 'setup' ? 'Three short steps. You can change everything later.' : 'Lessons, meetings, homework and holidays. Tap a lesson to plan it.') + '</p></div>' +
    (P.mode === 'setup' ? '' : '<div class="cal-head-a"><button type="button" class="btn primary" id="cal-plan"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Plan my week</span></button>' +
      '<div class="cal-menu"><button type="button" class="btn" data-cmenu="add" aria-haspopup="true" aria-expanded="false">' + icon('plus') + '<span>Add</span></button><div class="cal-pop" data-cpop="add" role="menu" hidden>' +
        add.map(([k, ic, l]) => '<button type="button" role="menuitem" data-cadd="' + k + '">' + ic + esc(l) + '</button>').join('') + '</div></div>' +
      '<div class="cal-menu"><button type="button" class="btn icon" data-cmenu="more" aria-haspopup="true" aria-expanded="false" aria-label="More calendar options"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.6" class="f"/><circle cx="12" cy="12" r="1.6" class="f"/><circle cx="18.5" cy="12" r="1.6" class="f"/></svg></button><div class="cal-pop cal-pop-r" data-cpop="more" role="menu" hidden>' +
        more.map(([k, ic, l]) => '<button type="button" role="menuitem" data-cmore="' + k + '">' + ic + esc(l) + '</button>').join('') + '</div></div></div>') +
    '</header>' + (P.mode === 'setup' ? '' : '<p class="fine cal-plan-fine" id="cal-plan-fine"></p>');
}
function bar() {
  return '<div class="cal-bar"><div class="seg cal-views" role="tablist" aria-label="Calendar view">' + MODES.map((m) => '<button type="button" role="tab" data-cview="' + m + '" aria-selected="' + (P.mode === m) + '">' + MODE_NAMES[m] + '</button>').join('') + '</div>' +
    '<b class="cal-range" aria-live="polite">' + esc(rangeLabel(P.mode, P.date)) + '</b>' +
    '<div class="cal-nav"><button type="button" class="btn small icon" data-cnav="-1" aria-label="Previous ' + MODE_NAMES[P.mode].toLowerCase() + '">' + icon('left') + '</button>' +
    '<button type="button" class="btn small" data-cnav="0">Today</button><button type="button" class="btn small icon" data-cnav="1" aria-label="Next ' + MODE_NAMES[P.mode].toLowerCase() + '">' + icon('right') + '</button></div></div>';
}
function welcome() {
  if (S.hasTimetable() || S.data().settings.setupDone) return '';
  return '<section class="cal-welcome"><div><h2>Set up your week once</h2><p>Add your lessons, and the calendar shows them every week. Then each lesson can be planned, made and taught from here, and homework goes straight to pupils’ phones.</p></div>' +
    '<button type="button" class="btn primary" data-cmore="setup">' + icon('play') + 'Set up my week</button></section>';
}
function body() {
  if (P.mode === 'day') return dayHTML(P.date);
  if (P.mode === 'month') return monthHTML(P.date);
  if (P.mode === 'term') return termHTML(P.date);
  return weekHTML(P.date);
}
function foot() {
  const s = S.data().settings;
  return '<p class="fine cal-foot">' + (s.publicHolidays ? 'Malaysian public holidays (Perak) are shown; lessons do not show on them. ' : '') + 'Your calendar is kept in this browser, for you only. ' +
    '<button type="button" class="linkbtn" data-cmore="phone">Add it to your phone’s calendar</button></p>';
}
function render() {
  if (!P.root) return;
  closeMenus();
  if (P.mode === 'setup') { P.root.innerHTML = '<div class="wrap pg cal cal-is-setup">' + head() + setupHTML() + '</div>'; return; }
  P.root.innerHTML = '<div class="wrap pg cal" data-calmode="' + P.mode + '">' + head() + welcome() + bar() + '<div class="cal-body" id="cal-body">' + body() + '</div>' + foot() + '</div>';
  wirePlanButton($('#cal-plan', P.root), $('#cal-plan-fine', P.root), () => (P.mode === 'week' || P.mode === 'day' ? P.date : S.today()), openSheet);
}
function paintBody() {
  if (!P.root || P.mode === 'setup') { render(); return; }
  const b = $('#cal-body', P.root), r = $('.cal-range', P.root);
  if (!b) { render(); return; }
  b.innerHTML = body();
  if (r) r.textContent = rangeLabel(P.mode, P.date);
  $$('[data-cview]', P.root).forEach((x) => x.setAttribute('aria-selected', String(x.dataset.cview === P.mode)));
  $$('[data-cnav="-1"],[data-cnav="1"]', P.root).forEach((x) => x.setAttribute('aria-label', (x.dataset.cnav === '1' ? 'Next ' : 'Previous ') + MODE_NAMES[P.mode].toLowerCase()));
  const h1 = $('.cal-head h1', P.root); if (h1) h1.textContent = P.mode === 'day' ? (P.date === S.today() ? 'Today' : S.dateWords(P.date)) : P.mode === 'month' ? 'Your month' : P.mode === 'term' ? 'Your term' : 'Your week';
  const w = $('.cal', P.root); if (w) w.dataset.calmode = P.mode;
}
function nowTick() {
  if (!visible() || P.mode === 'setup' || sheetOpen()) return;
  if (P.mode === 'week' || P.mode === 'day') { const a = document.activeElement; if (!(a && P.root.contains(a) && a.closest('#cal-body'))) paintBody(); }
}
bus.on('calendar', () => { if (!visible()) return; clearTimeout(P.redraw); P.redraw = setTimeout(() => (P.mode === 'setup' ? render() : paintBody()), 40); });
bus.on('who', () => { P.date = S.today(); if (visible()) render(); });

function step(n) {
  if (P.mode === 'day') P.date = n === 0 ? S.today() : addDays(P.date, n);
  else if (P.mode === 'week') P.date = n === 0 ? S.today() : addDays(P.date, 7 * n);
  else if (P.mode === 'month') { if (n === 0) P.date = S.today(); else { const [y, m] = P.date.split('-').map(Number); const t = new Date(y, m - 1 + n, 1); P.date = S.ymd(t); } }
  else if (P.mode === 'term') {
    const d = S.data();
    if (n === 0 || !d.terms.length) P.date = n === 0 ? S.today() : addDays(P.date, 7 * 12 * n);
    else { const cur = S.termOf(P.date, d), i = cur ? d.terms.indexOf(cur) : d.terms.findIndex((t) => t.start > P.date) - (n > 0 ? 1 : 0); const nx = d.terms[Math.max(0, Math.min(d.terms.length - 1, i + n))]; if (nx) P.date = nx.start; }
  }
  paintBody();
}

/* ---------------- menus ---------------- */
function closeMenus() { if (!P.root) return; $$('.cal-pop', P.root).forEach((p) => { p.hidden = true; }); $$('[data-cmenu]', P.root).forEach((b) => b.setAttribute('aria-expanded', 'false')); }
function doAdd(k, date) {
  closeMenus();
  const d = isDate(date) ? date : (P.mode === 'day' ? P.date : S.today());
  if (k === 'lesson') lessonForm({ date: d, day: S.isoDay(d) });
  else if (k === 'event') eventForm({ date: d });
  else if (k === 'homework') homeworkForm({ set: S.today(), due: addDays(S.today(), 7) });
  else if (k === 'holidays' || k === 'terms') rangesForm(k);
}
function doMore(k) {
  closeMenus();
  if (k === 'phone') downloadTeacherICS();
  else if (k === 'sharewk') { const list = dueThisWeek(P.mode === 'week' || P.mode === 'day' ? P.date : S.today()); if (list.length) openShare(list, openSheet); else toast('No homework is due this week.'); }
  else if (k === 'settings') settingsForm();
  else if (k === 'setup') { P.mode = 'setup'; P.step = 1; render(); P.root.scrollIntoView({ block: 'start' }); }
}

/* ---------------- the setup steps ---------------- */
function setupHTML() {
  const s = S.data().settings, d = S.data();
  const steps = ['Your school day', 'Your lessons', 'Terms and holidays'];
  let h = '<section class="cal-setup"><ol class="cal-steps">' + steps.map((t, i) => '<li' + (P.step === i + 1 ? ' aria-current="step"' : '') + (P.step > i + 1 ? ' class="done"' : '') + '><b>' + (i + 1) + '</b>' + esc(t) + '</li>').join('') + '</ol>';
  if (P.step === 1) {
    const len = [30, 35, 40, 45, 50, 55, 60, 75, 90];
    h += '<form class="cal-f cal-card" data-setup="1" novalidate><h2>When is your school day?</h2>' +
      '<div class="cal-row2"><label class="fld"><span>The day starts</span><input type="time" name="start" value="' + esc(s.start) + '"></label><label class="fld"><span>The day ends</span><input type="time" name="end" value="' + esc(s.end) + '"></label></div>' +
      '<label class="fld"><span>A usual lesson</span><select name="len">' + len.map((n) => '<option value="' + n + '"' + (n === s.len ? ' selected' : '') + '>' + n + ' minutes</option>').join('') + '</select></label>' +
      '<fieldset class="cal-daysf"><legend>School days</legend><div class="pills">' + [1, 2, 3, 4, 5, 6, 7].map((n) => '<button type="button" class="pill" data-sday="' + n + '" aria-pressed="' + s.days.includes(n) + '">' + esc(S.DAY_NAMES[n].slice(0, 3)) + '</button>').join('') + '</div></fieldset>' +
      '<p class="notice err cal-f-err" role="alert" hidden></p><div class="cal-f-foot"><button type="button" class="btn" data-setup-skip>Not now</button><button type="submit" class="btn primary">Next' + icon('right') + '</button></div></form>';
  } else if (P.step === 2) {
    const byDay = [1, 2, 3, 4, 5, 6, 7].map((n) => d.lessons.filter((l) => l.day === n).sort((a, b) => toMin(a.start) - toMin(b.start)));
    h += '<div class="cal-card"><h2>Add your lessons</h2><p class="fine">Tap a day and a time on the grid, or press Add a lesson. Each lesson comes back every week.</p>' +
      '<div class="cal-setup-acts"><button type="button" class="btn primary" data-cadd="lesson">' + icon('plus') + 'Add a lesson</button>' +
      (byDay[0].length ? '<button type="button" class="btn" data-setup-copy>' + icon('copy') + 'Copy Monday to every school day</button>' : '') + '</div>' +
      '<div class="cal-body cal-setup-grid">' + weekHTML(S.today()) + '</div>' +
      (d.lessons.length ? '<ul class="cal-setup-l">' + byDay.map((list, i) => (list.length ? '<li><b>' + S.DAY_NAMES[i + 1] + '</b>' + list.map((l) => '<button type="button" class="cal-chip" data-edit-lesson="' + esc(l.id) + '" style="--c:var(--s-' + esc(l.subject) + ')">' + esc(S.span(l.start, l.end) + ' ' + S.lessonTitle(l)) + '</button>').join('') + '</li>' : '')).join('') + '</ul>' : '') +
      '<div class="cal-f-foot"><button type="button" class="btn" data-setup-step="1">' + icon('left') + 'Back</button><button type="button" class="btn primary" data-setup-step="3">Next' + icon('right') + '</button></div></div>';
  } else {
    h += '<div class="cal-card"><h2>Terms and holidays</h2><p class="fine">Add your school’s term dates and lessons only show inside a term. You can do it later.</p>' +
      (d.terms.length ? '<ul class="cal-setup-l">' + d.terms.map((t) => '<li><b>' + esc(t.name) + '</b><span>' + esc(S.dateWords(t.start, { weekday: undefined, year: 'numeric' }) + ' to ' + S.dateWords(t.end, { weekday: undefined, year: 'numeric' })) + '</span></li>').join('') + '</ul>' : '') +
      '<div class="cal-setup-acts"><button type="button" class="btn" data-cadd="terms">' + ci('term') + (d.terms.length ? 'Change term dates' : 'Add term dates') + '</button><button type="button" class="btn" data-cadd="holidays">' + icon('sun') + 'Add school holidays</button></div>' +
      '<label class="cal-check"><input type="checkbox" data-setup-ph' + (s.publicHolidays ? ' checked' : '') + '><span><b>Show Malaysian public holidays (Perak)</b><small>2026 and 2027, from the official lists. More years are added when the government publishes them. Islamic holidays can move by a day when the new moon is sighted.</small></span></label>' +
      '<div class="cal-f-foot"><button type="button" class="btn" data-setup-step="2">' + icon('left') + 'Back</button><button type="button" class="btn primary" data-setup-done>' + icon('check') + 'Finish</button></div></div>';
  }
  return h + '</section>';
}

/* ---------------- one listener for the whole page ---------------- */
function quickAdd(col, e) {
  const date = col.dataset.date, lo = Number(col.dataset.lo) || 0;
  const hh = parseFloat(getComputedStyle(col).getPropertyValue('--hh')) || 56;
  const y = e.clientY - col.getBoundingClientRect().top;
  const m = Math.max(0, Math.min(1425, Math.round((lo + (y / hh) * 60) / 15) * 15));
  lessonForm({ date, day: S.isoDay(date), start: fromMin(m) });
}
function wire(view) {
  view.addEventListener('click', (e) => {
    const t = e.target;
    const menu = t.closest('[data-cmenu]');
    if (menu) { const pop = $('[data-cpop="' + menu.dataset.cmenu + '"]', view), was = pop && !pop.hidden; closeMenus(); if (pop && !was) { pop.hidden = false; menu.setAttribute('aria-expanded', 'true'); const f = $('button', pop); if (f) f.focus(); } return; }
    if (!t.closest('.cal-pop')) closeMenus();
    const add = t.closest('[data-cadd]'); if (add) { doAdd(add.dataset.cadd, add.dataset.date); return; }
    const more = t.closest('[data-cmore]'); if (more) { doMore(more.dataset.cmore); return; }
    const op = t.closest('[data-copen]'); if (op) { openItemSheet(op.dataset.copen); return; }
    const gd = t.closest('[data-cgoday]'); if (gd) { P.date = gd.dataset.cgoday; P.mode = 'day'; paintBody(); return; }
    const gw = t.closest('[data-cgoweek]'); if (gw) { P.date = gw.dataset.cgoweek; P.mode = 'week'; paintBody(); return; }
    const md = t.closest('[data-cview]'); if (md) { P.mode = md.dataset.cview; paintBody(); return; }
    const nv = t.closest('[data-cnav]'); if (nv) { step(Number(nv.dataset.cnav)); return; }
    const ed = t.closest('[data-edit-lesson]'); if (ed) { const l = S.lessonById(ed.dataset.editLesson); if (l) lessonForm({ lesson: l }); return; }
    const sd = t.closest('[data-sday]'); if (sd) { sd.setAttribute('aria-pressed', String(sd.getAttribute('aria-pressed') !== 'true')); return; }
    if (t.closest('[data-setup-skip]')) { S.setSettings({ setupDone: true }); P.mode = defaultMode(); render(); return; }
    const ss = t.closest('[data-setup-step]'); if (ss) { P.step = Number(ss.dataset.setupStep); render(); return; }
    if (t.closest('[data-setup-copy]')) { const days = S.data().settings.days.filter((n) => n !== 1); S.copyDay(1, days); toast('Monday’s lessons copied to ' + days.length + (days.length === 1 ? ' day' : ' days') + ' (where the time was free).'); return; }
    if (t.closest('[data-setup-done]')) { S.setSettings({ setupDone: true }); P.mode = defaultMode(); P.date = S.today(); render(); toast(S.hasTimetable() ? 'Your week is set up. Tap any lesson to plan it.' : 'Set up saved. Add lessons any time with Add.'); return; }
    const col = t.closest('.cal-col');
    if (col && !t.closest('.cal-blk') && e.isTrusted) quickAdd(col, e);
  });
  view.addEventListener('change', (e) => { if (e.target.matches('[data-setup-ph]')) S.setSettings({ publicHolidays: e.target.checked }); });
  view.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-setup="1"]');
    if (!f) return;
    e.preventDefault();
    const fd = new FormData(f), start = String(fd.get('start') || ''), end = String(fd.get('end') || ''), days = $$('[data-sday][aria-pressed="true"]', f).map((b) => Number(b.dataset.sday));
    const err = $('.cal-f-err', f), say = (m) => { err.textContent = m; err.hidden = !m; };
    if (!isTime(start) || !isTime(end) || toMin(end) <= toMin(start)) { say('The day must end after it starts.'); return; }
    if (!days.length) { say('Choose at least one school day.'); return; }
    S.setSettings({ start, end, len: Number(fd.get('len')) || 45, days });
    P.step = 2; render();
  });
  view.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenus(); return; }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('input,textarea,select,[contenteditable="true"],.cal-pop') && P.mode !== 'setup' && !sheetOpen()) { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  view.addEventListener('touchstart', (e) => { if (P.mode !== 'day' || e.touches.length !== 1 || !e.target.closest('#cal-body')) { P.touch = null; return; } P.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
  view.addEventListener('touchend', (e) => {
    const s = P.touch; P.touch = null;
    if (!s || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - s.t < 700) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('click', (e) => { if (P.root && !P.root.contains(e.target)) closeMenus(); });
}
export const CALENDAR_ICONS = CI;
