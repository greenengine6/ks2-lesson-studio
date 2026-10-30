/* The calendar's side sheet (a bottom sheet on phones): a lesson, an event, homework or a holiday, and every form
   (a lesson, an event, homework, term dates, school holidays, settings). */
import { $, $$, esc, icon, toast, uid } from '../core.js?v=af1c9ebd';
import { SUBJECT_LIST, subjectName, subjectColor, findItem, pickItem, openItem, startMaking, startClass, yearOf, soon } from '../library.js?v=af1c9ebd';
import { isDate, isTime, isHttps, addDays, toMin, fromMin } from '../ics.js?v=af1c9ebd';
import {
  data, daySchedule, planFor, setPlan, lessonById, eventById, homeworkById, addLesson, updateLesson, removeLesson, overrideLesson, addEvent, updateEvent, removeEvent,
  addHomework, updateHomework, removeHomework, setTerms, setSchoolHolidays, setSettings, nextDateOf, dateWords, fmtTime, span, today, isoDay, DAY_NAMES, EVENT_KINDS, lessonTitle, planKey
} from './store.js?v=af1c9ebd';
import { ci, kindIcon } from './views.js?v=af1c9ebd';

let wrap = null, back = null, onShare = null;
export function setShareHandler(fn) { onShare = fn; }
const YEAR_OPTS = ['', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'KS2'];
const KINDS_ALL = ['lkie', 'slides', 'sheet', 'quiz', 'game', 'eng'];

/* ---------------- the sheet itself ---------------- */
export function closeSheet() {
  if (!wrap) return;
  wrap.remove(); wrap = null;
  document.documentElement.classList.remove('cal-sh-open');
  if (back && back.isConnected && back.focus) { try { back.focus(); } catch (e) { /* fine */ } }
}
export const sheetOpen = () => !!wrap;
/* Escape closes the sheet wherever the focus is (a dialog opened over it, such as the library picker, handles its own). */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !wrap || e.defaultPrevented) return;
  if (e.target && e.target.closest && e.target.closest('.modal,.lib-pick,.cal-qrbig')) return;
  if (document.querySelector('.cal-qrbig')) return;
  e.preventDefault(); closeSheet();
});
function open(o) {
  if (!wrap) back = document.activeElement;
  if (wrap) wrap.remove();
  wrap = document.createElement('div');
  wrap.className = 'cal-shw';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'calsh-h');
  wrap.innerHTML = '<div class="cal-shb" data-sh="x"></div><section class="cal-sh" style="--c:' + (o.color || 'var(--accent)') + '">' +
    '<header class="cal-sh-top"><div class="cal-sh-id">' + (o.kicker ? '<p class="cal-sh-k">' + o.kicker + '</p>' : '') + '<h2 id="calsh-h">' + esc(o.title) + '</h2>' + (o.sub ? '<p class="cal-sh-sub">' + o.sub + '</p>' : '') + '</div>' +
    '<button type="button" class="btn small icon" data-sh="x" aria-label="Close">' + icon('close') + '</button></header><div class="cal-sh-in">' + o.body + '</div></section>';
  document.body.appendChild(wrap);
  document.documentElement.classList.add('cal-sh-open');
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-sh="x"]')) { closeSheet(); return; } if (o.onClick) o.onClick(e, wrap); });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeSheet(); } });
  if (o.onInput) wrap.addEventListener('input', (e) => o.onInput(e, wrap));
  if (o.onChange) wrap.addEventListener('change', (e) => o.onChange(e, wrap));
  if (o.onSubmit) wrap.addEventListener('submit', (e) => { e.preventDefault(); o.onSubmit(e, wrap); });
  setTimeout(() => { if (!wrap) return; const f = $(o.focus || '.cal-sh-in input, .cal-sh-in select, .cal-sh-in textarea, .cal-sh-in button', wrap) || $('[data-sh="x"]', wrap); if (f) f.focus({ preventScroll: true }); }, 40);
  return wrap;
}
const notice = (root, msg) => { const n = $('.cal-f-err', root); if (n) { n.textContent = msg; n.hidden = !msg; } };
const sel = (name, opts, val, label) => '<label class="fld"><span>' + esc(label) + '</span><select name="' + name + '">' + opts.map(([v, t]) => '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
const inp = (name, label, val, o) => { o = o || {}; return '<label class="fld' + (o.cls ? ' ' + o.cls : '') + '"><span>' + esc(label) + (o.opt ? ' <span class="opt">(optional)</span>' : '') + '</span><input type="' + (o.type || 'text') + '" name="' + name + '" value="' + esc(val || '') + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.req ? ' required' : '') + ' autocomplete="off"></label>'; };
const area = (name, label, val, o) => { o = o || {}; return '<label class="fld"><span>' + esc(label) + (o.opt ? ' <span class="opt">(optional)</span>' : '') + '</span><textarea name="' + name + '" rows="' + (o.rows || 3) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' maxlength="' + (o.max || 600) + '">' + esc(val || '') + '</textarea></label>'; };
const subjectOpts = () => SUBJECT_LIST.map((s) => [s.id, s.short]);
const yearOpts = () => YEAR_OPTS.map((y) => [y, y || 'No year group']);
const dayOpts = () => [1, 2, 3, 4, 5, 6, 7].map((n) => [n, DAY_NAMES[n]]);
const formVals = (form) => { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); $$('input[type=checkbox]', form).forEach((c) => { o[c.name] = c.checked; }); return o; };
const foot = (save, extra) => '<p class="notice err cal-f-err" role="alert" hidden></p><div class="cal-f-foot">' + (extra || '') + '<button type="button" class="btn" data-sh="x">Cancel</button><button type="submit" class="btn primary">' + icon('check') + esc(save || 'Save') + '</button></div>';
const check = (name, label, on, sub) => '<label class="cal-check"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></label>';

/* ---------------- a lesson ---------------- */
export function lessonSheet(date, slotId) {
  const it = daySchedule(date).find((x) => x.kind === 'lesson' && x.slotId === slotId);
  const l = lessonById(slotId);
  if (!it || !l) { toast('That lesson is not on this day any more.'); return; }
  const plan = it.plan || { topic: '', items: [], note: '', taught: false };
  const items = plan.items.map((k) => ({ k, it: findItem(k) }));
  const hw = data().homework.filter((h) => h.slotId === slotId && h.set === date);
  const placeLine = [it.place ? ci('door') + esc(it.place) : '', it.online ? icon('video') + 'Online' : ''].filter(Boolean).join('<span class="cal-dot">·</span>');
  const body =
    (it.online ? '<a class="btn primary wide cal-join" href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer">' + icon('video') + 'Join the online class</a>' : '') +
    '<section class="cal-sec"><h3>Plan for this lesson</h3>' +
      '<label class="fld"><span>Topic</span><input type="text" data-f="topic" value="' + esc(plan.topic) + '" maxlength="140" autocomplete="off" placeholder="For example: Equivalent fractions"></label>' +
      '<div class="cal-att"><p class="cal-mini">Ready to teach</p>' + (items.length ? '<ul class="cal-att-l">' + items.map(({ k, it: x }) => '<li>' + (x ? '<button type="button" class="cal-att-o" data-att-open="' + esc(k) + '"><b>' + esc(x.title) + '</b><small>' + esc(x.long + (x.year ? ' · ' + x.year : '')) + '</small></button>' : '<span class="cal-att-gone">Removed from My subjects</span>') +
        '<button type="button" class="btn small icon" data-att-rm="' + esc(k) + '" aria-label="Take it off this lesson">' + icon('close') + '</button></li>').join('') + '</ul>' : '<p class="fine">Nothing attached yet.</p>') +
      '<button type="button" class="btn small" data-act="attach">' + icon('layers') + 'Attach from My subjects</button></div>' +
      '<p class="cal-mini">Make something for it</p><div class="cal-make">' +
        '<button type="button" class="btn small" data-make="slides">' + icon('slides') + 'Lesson slides</button><button type="button" class="btn small" data-make="sheet">' + icon('notes') + 'Worksheet</button>' +
        '<button type="button" class="btn small" data-make="quiz">' + icon('vote') + 'Quiz</button><button type="button" class="btn small" data-make="game">' + icon('play') + 'Game</button></div>' +
      (soon('class') ? '' : '<button type="button" class="btn primary wide" data-act="class">' + icon('board') + 'Start class</button>') +
    '</section>' +
    '<section class="cal-sec"><h3>Homework</h3>' + (hw.length ? '<ul class="cal-hw-l">' + hw.map((h) => '<li><button type="button" class="cal-att-o" data-hw-open="' + esc(h.id) + '"><b>' + esc(h.title || subjectName(h.subject, true) + ' homework') + '</b><small>Due ' + esc(dateWords(h.due)) + '</small></button><button type="button" class="btn small" data-hw-share="' + esc(h.id) + '">' + ci('share') + 'Share</button></li>').join('') + '</ul>' : '') +
      '<button type="button" class="btn small" data-act="sethw">' + icon('plus') + 'Set homework</button></section>' +
    '<section class="cal-sec"><h3>Note</h3><textarea data-f="note" rows="3" maxlength="600" placeholder="Anything to remember for this lesson">' + esc(plan.note) + '</textarea>' +
      '<button type="button" class="cal-taught-b" data-act="taught" aria-pressed="' + !!plan.taught + '">' + icon('check') + '<span>' + (plan.taught ? 'Taught' : 'Mark as taught') + '</span></button></section>' +
    (it.note ? '<p class="cal-l-note">' + icon('info') + esc(it.note) + '</p>' : '') +
    '<div class="cal-f-foot cal-sh-foot"><button type="button" class="btn small" data-act="edit">' + ci('edit') + 'Change this lesson</button><button type="button" class="btn small" data-act="remove">' + icon('trash') + 'Remove</button></div>';
  let saveT = 0;
  const saveField = (f, v) => { clearTimeout(saveT); saveT = setTimeout(() => setPlan(date, slotId, { [f]: v }), 450); };
  open({
    kicker: 'Lesson · ' + esc(dateWords(date)), title: it.title, sub: esc(span(it.start, it.end)) + (it.changed ? ' <em>(changed for this day)</em>' : '') + (placeLine ? '<span class="cal-dot">·</span>' + placeLine : ''), color: subjectColor(it.subject), body,
    onInput: (e) => { const f = e.target.dataset && e.target.dataset.f; if (f) saveField(f, e.target.value); },
    onClick: async (e, root) => {
      const b = e.target.closest('button,[data-att-open]');
      if (!b) return;
      if (b.dataset.attOpen) { closeSheet(); openItem(b.dataset.attOpen); return; }
      if (b.dataset.attRm) { const p = planFor(date, slotId) || plan; setPlan(date, slotId, { items: p.items.filter((k) => k !== b.dataset.attRm) }); lessonSheet(date, slotId); return; }
      if (b.dataset.make) {
        flush(root);
        const p = planFor(date, slotId) || plan;
        closeSheet();
        startMaking({ kind: b.dataset.make, topic: p.topic || '', year: l.year, subject: l.subject, slot: { date, slotId }, from: 'calendar' });
        return;
      }
      if (b.dataset.hwOpen) { homeworkSheet(b.dataset.hwOpen); return; }
      if (b.dataset.hwShare) { const h = homeworkById(b.dataset.hwShare); if (h && onShare) onShare([h]); return; }
      const a = b.dataset.act;
      if (a === 'attach') {
        flush(root);
        const key = await pickItem({ title: 'Attach to ' + it.title, kinds: KINDS_ALL, subject: l.subject, year: l.year });
        if (key) { const p = planFor(date, slotId) || { items: [] }; if (!p.items.includes(key)) setPlan(date, slotId, { items: p.items.concat([key]) }); toast('Attached. This lesson shows a green tick.'); }
        lessonSheet(date, slotId);
      } else if (a === 'class') {
        flush(root);
        const p = planFor(date, slotId) || plan, hwNow = data().homework.filter((h) => h.slotId === slotId && h.set === date);
        closeSheet();
        startClass({ title: p.topic ? lessonTitle(l) + ': ' + p.topic : lessonTitle(l), subject: l.subject, year: l.year, cls: l.cls, date, slot: slotId, items: p.items.slice(), homework: hwNow[0] || null, link: it.link || '' });
      } else if (a === 'sethw') {
        flush(root);
        const p = planFor(date, slotId) || plan;
        homeworkForm({ subject: l.subject, cls: l.cls, year: l.year, set: date, due: nextDateOf(slotId, date) || addDays(date, 7), slotId, title: p.topic || '' }, { back: () => lessonSheet(date, slotId) });
      } else if (a === 'taught') {
        const p = planFor(date, slotId) || plan, on = !p.taught;
        setPlan(date, slotId, { taught: on });
        b.setAttribute('aria-pressed', String(on)); $('span', b).textContent = on ? 'Taught' : 'Mark as taught';
        if (on) toast('Marked as taught.');
      } else if (a === 'edit') { flush(root); lessonForm({ lesson: l, date }); }
      else if (a === 'remove') { flush(root); removeChoice('lesson', date, slotId, it.title); }
    }
  });
  function flush(root) {
    clearTimeout(saveT);
    const t = $('[data-f="topic"]', root), n = $('[data-f="note"]', root);
    setPlan(date, slotId, { topic: t ? t.value : plan.topic, note: n ? n.value : plan.note });
  }
}
function removeChoice(kind, date, id, title) {
  const weekly = kind === 'lesson' || (kind === 'event' && (eventById(id) || {}).weekly);
  open({
    kicker: 'Remove', title: title, color: 'var(--cal-danger)',
    body: '<p>' + (weekly ? 'Remove it on ' + esc(dateWords(date)) + ' only, or every week from then on?' : 'Remove it from your calendar?') + '</p><div class="cal-f-foot">' +
      '<button type="button" class="btn" data-sh="x">Keep it</button>' + (weekly ? '<button type="button" class="btn" data-rm="one">' + icon('trash') + 'Only this day</button>' : '') +
      '<button type="button" class="btn primary cal-danger" data-rm="all">' + icon('trash') + (weekly ? 'Every week from then' : 'Remove') + '</button></div>',
    onClick: (e) => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      const all = b.dataset.rm === 'all';
      if (kind === 'lesson') removeLesson(id, date, all); else removeEvent(id, date, all);
      closeSheet(); toast(all && weekly ? 'Removed from ' + dateWords(date, { weekday: 'long', day: 'numeric', month: 'short' }) + ' on.' : 'Removed.');
    }
  });
}

/* ---------------- lesson form ----------------
   o: { lesson (to change), date (the day it was opened from), day, start (a new one from the grid) } */
export function lessonForm(o) {
  o = o || {};
  const l = o.lesson || null, s = data().settings;
  const start = l ? l.start : (isTime(o.start) ? o.start : s.start);
  const end = l ? l.end : fromMin(Math.min(toMin(start) + s.len, 1439));
  const day = l ? l.day : (o.day || (o.date ? isoDay(o.date) : 1));
  const scope = l && o.date ? '<fieldset class="cal-scope"><legend>Change it</legend><label class="cal-check"><input type="radio" name="scope" value="all" checked><span><b>Every week</b></span></label>' +
    '<label class="cal-check"><input type="radio" name="scope" value="one"><span><b>Only on ' + esc(dateWords(o.date)) + '</b><small>The time, room, link and note</small></span></label></fieldset>' : '';
  const body = '<form class="cal-f" novalidate>' + scope +
    '<div class="cal-row2">' + sel('subject', subjectOpts(), l ? l.subject : (o.subject || 'maths'), 'Subject') + inp('cls', 'Class', l ? l.cls : (o.cls || ''), { ph: 'For example: 4 Amber', max: 40 }) + '</div>' +
    '<div class="cal-row2">' + sel('year', yearOpts(), l ? l.year : (o.year || ''), 'Year group') + sel('day', dayOpts(), day, 'Day') + '</div>' +
    '<div class="cal-row2">' + inp('start', 'Starts', start, { type: 'time', req: true }) + inp('end', 'Ends', end, { type: 'time', req: true }) + '</div>' +
    '<div class="cal-row2">' + inp('place', 'Room', l ? l.place : '', { ph: 'For example: 4B', max: 80, opt: true }) + inp('link', 'Online class link', l ? l.link : '', { type: 'url', ph: 'https://teams.microsoft.com/…', opt: true }) + '</div>' +
    area('note', 'Note', l ? l.note : '', { opt: true, rows: 2, max: 400 }) + foot(l ? 'Save' : 'Add the lesson') + '</form>';
  open({
    kicker: l ? 'Change a lesson' : 'Add a lesson', title: l ? lessonTitle(l) : 'A lesson every week', color: l ? subjectColor(l.subject) : 'var(--accent)', body,
    onChange: (e, root) => {
      if (e.target.name === 'scope') { const one = e.target.value === 'one'; ['subject', 'cls', 'year', 'day'].forEach((n) => { const f = $('[name="' + n + '"]', root); if (f) f.disabled = one; }); }
      if (e.target.name === 'start') { const en = $('[name="end"]', root); if (en && isTime(e.target.value) && (!isTime(en.value) || toMin(en.value) <= toMin(e.target.value))) en.value = fromMin(Math.min(toMin(e.target.value) + s.len, 1439)); }
    },
    onSubmit: (e, root) => {
      const v = formVals(e.target);
      if (!isTime(v.start) || !isTime(v.end)) { notice(root, 'Choose a start and an end time.'); return; }
      if (toMin(v.end) <= toMin(v.start)) { notice(root, 'The lesson must end after it starts.'); return; }
      if (v.link && !isHttps(v.link)) { notice(root, 'The online class link must start with https://'); return; }
      if (l && v.scope === 'one' && o.date) {
        overrideLesson(o.date, l.id, { start: v.start, end: v.end, place: v.place, link: v.link, note: v.note });
        toast('Changed for ' + dateWords(o.date) + ' only.');
        lessonSheet(o.date, l.id);
        return;
      }
      const rec = { subject: v.subject, cls: v.cls, year: v.year, day: Number(v.day), start: v.start, end: v.end, place: v.place, link: v.link, note: v.note };
      if (l) { updateLesson(l.id, rec); toast('Lesson changed for every week.'); if (o.date && Number(v.day) === isoDay(o.date)) lessonSheet(o.date, l.id); else closeSheet(); }
      else { const n = addLesson(rec); closeSheet(); toast(n ? lessonTitle(n) + ' added every ' + DAY_NAMES[n.day] + '.' : 'That lesson could not be added.'); }
    }
  });
}

/* ---------------- an event ---------------- */
export function eventSheet(date, id) {
  const ev = eventById(id);
  if (!ev) { toast('That event has gone.'); return; }
  const body = (ev.link ? '<a class="btn primary wide cal-join" href="' + esc(ev.link) + '" target="_blank" rel="noopener noreferrer">' + icon('link') + 'Open the link</a>' : '') +
    (ev.place ? '<p class="cal-l-note">' + ci('door') + esc(ev.place) + '</p>' : '') + (ev.note ? '<p class="cal-l-note">' + icon('info') + esc(ev.note) + '</p>' : '') +
    (ev.weekly ? '<p class="fine">Every ' + esc(DAY_NAMES[isoDay(ev.date)]) + (ev.until ? ' until ' + esc(dateWords(ev.until)) : '') + '.</p>' : '') +
    '<div class="cal-f-foot cal-sh-foot"><button type="button" class="btn small" data-act="edit">' + ci('edit') + 'Change</button><button type="button" class="btn small" data-act="remove">' + icon('trash') + 'Remove</button></div>';
  open({
    kicker: esc(EVENT_KINDS[ev.kind]) + ' · ' + esc(dateWords(date)), title: ev.title, sub: ev.allDay ? (ev.endDate ? 'All day, until ' + esc(dateWords(ev.endDate)) : 'All day') : esc(span(ev.start, ev.end)), color: 'var(--cal-ev)', body,
    onClick: (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'edit') eventForm({ event: ev, date });
      else removeChoice('event', date, id, ev.title);
    }
  });
}
export function eventForm(o) {
  o = o || {};
  const ev = o.event || null, s = data().settings;
  const date = ev ? ev.date : (o.date || today()), start = ev && ev.start ? ev.start : (isTime(o.start) ? o.start : '15:30');
  const body = '<form class="cal-f" novalidate>' +
    '<div class="cal-row2">' + sel('kind', Object.keys(EVENT_KINDS).map((k) => [k, EVENT_KINDS[k]]), ev ? ev.kind : (o.kind || 'meeting'), 'What is it?') + inp('title', 'Title', ev ? ev.title : '', { ph: 'For example: KS2 team meeting', max: 120 }) + '</div>' +
    '<div class="cal-row2">' + inp('date', 'Date', date, { type: 'date', req: true }) + inp('endDate', 'Last day (several days)', ev ? ev.endDate : '', { type: 'date', opt: true }) + '</div>' +
    check('allDay', 'All day', ev ? ev.allDay : false) +
    '<div class="cal-row2 cal-times-row">' + inp('start', 'Starts', start, { type: 'time' }) + inp('end', 'Ends', ev && ev.end ? ev.end : fromMin(Math.min(toMin(start) + 60, 1439)), { type: 'time' }) + '</div>' +
    check('weekly', 'Every week', ev ? ev.weekly : false, 'For example a weekly team meeting') +
    inp('until', 'Every week until', ev ? ev.until : '', { type: 'date', opt: true, cls: 'cal-until' }) +
    '<div class="cal-row2">' + inp('place', 'Where', ev ? ev.place : '', { max: 80, opt: true }) + inp('link', 'Link', ev ? ev.link : '', { type: 'url', ph: 'https://…', opt: true }) + '</div>' +
    area('note', 'Note', ev ? ev.note : '', { opt: true, rows: 2, max: 400 }) + foot(ev ? 'Save' : 'Add it') + '</form>';
  const paint = (root) => {
    const all = $('[name="allDay"]', root).checked, wk = $('[name="weekly"]', root).checked;
    $('.cal-times-row', root).hidden = all; $('.cal-until', root).hidden = !wk;
    const ed = $('[name="endDate"]', root); if (ed) ed.closest('.fld').hidden = !all || wk;
  };
  const root = open({
    kicker: ev ? 'Change an event' : 'Add an event', title: ev ? ev.title : 'Meeting, planning time or school event', color: 'var(--cal-ev)', body,
    onChange: (e, r) => paint(r),
    onSubmit: (e, r) => {
      const v = formVals(e.target);
      if (!isDate(v.date)) { notice(r, 'Choose a date.'); return; }
      if (!v.allDay && (!isTime(v.start) || !isTime(v.end) || toMin(v.end) <= toMin(v.start))) { notice(r, 'Choose a start time and an end time after it, or tick All day.'); return; }
      if (v.link && !isHttps(v.link)) { notice(r, 'The link must start with https://'); return; }
      const rec = { kind: v.kind, title: v.title || EVENT_KINDS[v.kind], date: v.date, endDate: v.allDay && !v.weekly ? v.endDate : '', allDay: v.allDay, start: v.allDay ? '' : v.start, end: v.allDay ? '' : v.end, weekly: v.weekly, until: v.weekly ? v.until : '', place: v.place, link: v.link, note: v.note };
      if (ev) updateEvent(ev.id, rec); else addEvent(rec);
      closeSheet(); toast(ev ? 'Event changed.' : 'Added to your calendar.');
    }
  });
  paint(root);
}

/* ---------------- homework ---------------- */
export function homeworkSheet(id) {
  const h = homeworkById(id);
  if (!h) { toast('That homework has gone.'); return; }
  const body = '<p class="cal-hw-due">' + ci('cal') + '<b>Due ' + esc(dateWords(h.due)) + (h.dueTime ? ' at ' + esc(fmtTime(h.dueTime, true)) : '') + '</b></p>' +
    (h.details ? '<p class="cal-hw-d">' + esc(h.details) + '</p>' : '') + (h.link ? '<p><a class="linkbtn" href="' + esc(h.link) + '" target="_blank" rel="noopener noreferrer">' + icon('link') + esc(h.link.replace(/^https:\/\//, '').slice(0, 60)) + '</a></p>' : '') +
    '<p class="fine">Set on ' + esc(dateWords(h.set)) + (h.cls || h.year ? ' for ' + esc([h.cls, h.year].filter(Boolean).join(', ')) : '') + '.</p>' +
    '<button type="button" class="btn primary wide" data-act="share">' + ci('share') + 'Share with the class</button>' +
    '<p class="fine">Pupils or their parents open the link and tap Add to my calendar. No names, no accounts.</p>' +
    '<div class="cal-f-foot cal-sh-foot"><button type="button" class="btn small" data-act="edit">' + ci('edit') + 'Change</button><button type="button" class="btn small" data-act="remove">' + icon('trash') + 'Remove</button></div>';
  open({
    kicker: 'Homework · ' + esc(subjectName(h.subject, true)) + (h.cls ? ' · ' + esc(h.cls) : ''), title: h.title || subjectName(h.subject, true) + ' homework', color: subjectColor(h.subject), body,
    onClick: (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'share') { if (onShare) onShare([h]); }
      else if (b.dataset.act === 'edit') homeworkForm(h);
      else if (b.dataset.act === 'remove') { removeHomework(h.id); closeSheet(); toast('Homework removed.'); }
    }
  });
}
/* hw: an existing homework (has an id) or the start of a new one. o.back: where Save goes after. */
export function homeworkForm(hw, o) {
  hw = hw || {}; o = o || {};
  const editing = !!(hw.id && homeworkById(hw.id));
  const body = '<form class="cal-f" novalidate>' +
    '<div class="cal-row2">' + sel('subject', subjectOpts(), hw.subject || 'maths', 'Subject') + inp('cls', 'Class', hw.cls || '', { ph: 'For example: 4 Amber', max: 40 }) + '</div>' +
    sel('year', yearOpts(), hw.year || '', 'Year group') +
    inp('title', 'Homework', hw.title || '', { ph: 'For example: Fractions worksheet', max: 120 }) +
    area('details', 'What to do', hw.details || '', { ph: 'For example: Do questions 1 to 6. Show your working.', rows: 3, max: 600, opt: true }) +
    '<div class="cal-row2">' + inp('set', 'Set on', hw.set || today(), { type: 'date' }) + inp('due', 'Due', hw.due || addDays(today(), 7), { type: 'date', req: true }) + '</div>' +
    '<div class="cal-row2">' + inp('dueTime', 'Due by', hw.dueTime || '', { type: 'time', opt: true }) + inp('link', 'Link', hw.link || '', { type: 'url', ph: 'https://…', opt: true }) + '</div>' +
    foot(editing ? 'Save' : 'Set homework') + '</form>';
  open({
    kicker: editing ? 'Change homework' : 'Set homework', title: editing ? (hw.title || 'Homework') : 'Homework for the class', color: subjectColor(hw.subject || 'maths'), body,
    onSubmit: (e, root) => {
      const v = formVals(e.target);
      if (!isDate(v.due)) { notice(root, 'Choose the date it is due.'); return; }
      if (isDate(v.set) && v.due < v.set) { notice(root, 'It cannot be due before the day it is set.'); return; }
      if (v.link && !isHttps(v.link)) { notice(root, 'The link must start with https://'); return; }
      const rec = { subject: v.subject, cls: v.cls, year: yearOf(v.year), title: v.title, details: v.details, set: isDate(v.set) ? v.set : today(), due: v.due, dueTime: isTime(v.dueTime) ? v.dueTime : '', link: v.link, slotId: hw.slotId || '' };
      const saved = editing ? updateHomework(hw.id, rec) : addHomework(rec);
      if (!saved) { notice(root, 'That homework could not be saved.'); return; }
      toast(editing ? 'Homework changed.' : 'Homework set for ' + dateWords(saved.due) + '.');
      if (o.back) o.back(); else homeworkSheet(saved.id);
    }
  });
}

/* ---------------- a holiday ---------------- */
export function holidaySheet(date) {
  const it = daySchedule(date).find((x) => x.kind === 'holiday');
  if (!it) return;
  const body = it.holiday === 'public'
    ? '<p>A public holiday in Perak. Lessons do not show on this day.</p>' + (it.change ? '<p class="fine">This date can move by a day: Islamic holidays follow the sighting of the new moon.</p>' : '') + '<p class="fine">Turn public holidays off in Settings if your school stays open.</p>'
    : '<p>A school holiday. Lessons do not show on these days.</p><button type="button" class="btn small" data-act="hols">' + ci('edit') + 'Change school holidays</button>';
  open({ kicker: (it.holiday === 'public' ? 'Public holiday' : 'School holiday') + ' · ' + esc(dateWords(date)), title: it.title, color: 'var(--cal-hol)', body, onClick: (e) => { if (e.target.closest('[data-act="hols"]')) rangesForm('holidays'); } });
}

/* ---------------- term dates and school holidays ---------------- */
export function rangesForm(which) {
  const d = data(), list = which === 'terms' ? d.terms : d.holidays, isT = which === 'terms';
  const row = (r, i) => '<div class="cal-rng" data-i="' + i + '">' + inp('name' + i, isT ? 'Name' : 'Holiday', r.name, { ph: isT ? 'For example: Term 1' : 'For example: Mid-term break', max: 80 }) +
    inp('start' + i, 'First day', r.start, { type: 'date' }) + inp('end' + i, 'Last day', r.end, { type: 'date' }) + '<button type="button" class="btn small icon" data-rm-row="' + i + '" aria-label="Remove this one">' + icon('trash') + '</button></div>';
  let rows = list.length ? list.slice() : [{ name: '', start: '', end: '' }];
  const draw = (root) => { $('.cal-rngs', root).innerHTML = rows.map(row).join(''); };
  const read = (root) => rows.map((r, i) => ({ id: r.id || uid(isT ? 't' : 'h'), name: ($('[name="name' + i + '"]', root) || {}).value || '', start: ($('[name="start' + i + '"]', root) || {}).value || '', end: ($('[name="end' + i + '"]', root) || {}).value || '' }));
  const root = open({
    kicker: isT ? 'Term dates' : 'School holidays', title: isT ? 'Your school’s terms' : 'Days your school is closed', color: 'var(--accent)',
    body: '<form class="cal-f" novalidate><p class="fine">' + (isT ? 'Lessons only show inside a term once you add term dates. Type them from your school’s calendar.' : 'Lessons do not show on these days (for example a mid-term break).') + '</p><div class="cal-rngs"></div>' +
      '<button type="button" class="btn small" data-act="addrow">' + icon('plus') + (isT ? 'Add a term' : 'Add a holiday') + '</button>' + foot('Save') + '</form>',
    onClick: (e, r) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'addrow') { rows = read(r); rows.push({ name: '', start: '', end: '' }); draw(r); }
      else if (b.dataset.rmRow != null) { rows = read(r); rows.splice(Number(b.dataset.rmRow), 1); draw(r); }
    },
    onSubmit: (e, r) => {
      const all = read(r).filter((x) => x.name || x.start || x.end);
      const bad = all.find((x) => !isDate(x.start) || !isDate(x.end) || x.end < x.start);
      if (bad) { notice(r, 'Each one needs a first day and a last day, and the last day cannot be before the first.'); return; }
      if (isT) setTerms(all); else setSchoolHolidays(all);
      closeSheet(); toast(isT ? 'Term dates saved.' : 'School holidays saved.');
    }
  });
  draw(root);
}

/* ---------------- settings ---------------- */
export function settingsForm(after) {
  const s = data().settings;
  const len = [30, 35, 40, 45, 50, 55, 60, 75, 90];
  const body = '<form class="cal-f" novalidate>' +
    '<fieldset class="cal-daysf"><legend>School days</legend><div class="pills">' + [1, 2, 3, 4, 5, 6, 7].map((n) => '<button type="button" class="pill" data-day="' + n + '" aria-pressed="' + s.days.includes(n) + '">' + esc(DAY_NAMES[n].slice(0, 3)) + '</button>').join('') + '</div></fieldset>' +
    '<div class="cal-row2">' + inp('start', 'The day starts', s.start, { type: 'time' }) + inp('end', 'The day ends', s.end, { type: 'time' }) + '</div>' +
    sel('len', len.map((n) => [n, n + ' minutes']), s.len, 'A usual lesson') +
    check('weekend', 'Show Saturday and Sunday', s.weekend) +
    check('publicHolidays', 'Show Malaysian public holidays (Perak)', s.publicHolidays, '2026 and 2027, from the official lists. More years are added when the government publishes them. Islamic holidays can move by a day when the new moon is sighted. Replacement days are not shown.') +
    check('remind', 'Remind me 5 minutes before each lesson', s.remind, 'While this site is open') +
    check('notify', 'Also show a notification', s.notify, 'Your browser asks once') +
    foot('Save') + '</form>';
  let days = s.days.slice();
  open({
    kicker: 'Calendar', title: 'Settings', color: 'var(--accent)', body,
    onClick: (e) => { const p = e.target.closest('[data-day]'); if (!p) return; const n = Number(p.dataset.day); days = days.includes(n) ? days.filter((x) => x !== n) : days.concat([n]); p.setAttribute('aria-pressed', String(days.includes(n))); },
    onSubmit: async (e, root) => {
      const v = formVals(e.target);
      if (!days.length) { notice(root, 'Choose at least one school day.'); return; }
      if (!isTime(v.start) || !isTime(v.end) || toMin(v.end) <= toMin(v.start)) { notice(root, 'The day must end after it starts.'); return; }
      let notify = !!v.notify;
      if (notify && typeof Notification === 'function' && Notification.permission !== 'granted') {
        try { notify = (await Notification.requestPermission()) === 'granted'; } catch (er) { notify = false; }
        if (!notify) toast('Notifications are off in this browser, so reminders show on the page.');
      }
      setSettings({ days: days.sort(), start: v.start, end: v.end, len: Number(v.len), weekend: !!v.weekend, publicHolidays: !!v.publicHolidays, remind: !!v.remind, notify });
      closeSheet(); toast('Calendar settings saved.');
      if (after) after();
    }
  });
}

/* ---------------- what is in a cell ---------------- */
export function openItemSheet(spec) {
  const [kind, date, id] = String(spec || '').split('~');
  if (kind === 'lesson') lessonSheet(date, id);
  else if (kind === 'event') eventSheet(date, id);
  else if (kind === 'homework') homeworkSheet(id);
  else if (kind === 'holiday') holidaySheet(date);
}
export const openSheet = (o) => open(o);
export { kindIcon, planKey };
