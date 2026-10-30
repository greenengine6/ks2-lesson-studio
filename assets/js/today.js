/* Today: the calm first page (Rabinder's points 1, 2 and 4). Her day from the calendar (each class Ready or not, with
   Start class), one box for "What are you teaching today?" that makes slides, a worksheet, a quiz or a game, her
   subjects with their pictures, what she was working on, homework due, and the class tools she uses most. */
import { $, $$, esc, icon, str, store, bus, YEARS } from './core.js?v=49509700';
import { who, ADMIN_NAME } from './people.js?v=49509700';
import { renderShelf } from './shelf.js?v=49509700';
import { listAll, counts, SUBJECT_LIST, subjectName, subjectColor, openItem, startMaking, startClass, KINDS, onLibrary, guessSubject, soon } from './library.js?v=49509700';
import { subjectArt } from './art/subjects.js?v=49509700';

const FORM = 'ks2-engine.today.form.v1';
const MAKE = [['slides', 'Lesson slides', 'pack'], ['sheet', 'Worksheet', 'sheet'], ['quiz', 'Quiz', 'quiz'], ['game', 'Game', 'game']];
const TOOLS = [['timer', 'Timer', 'clock'], ['names', 'Pick a name', 'users'], ['groups', 'Groups', 'vote'], ['noise', 'Noise meter', 'volume'], ['signs', 'Work signs', 'flag'], ['points', 'Class points', 'star']];
let view = null, cal = null, calTried = false;

const firstName = () => (who.role === 'admin' ? ADMIN_NAME : who.name || '').split(' ')[0] || 'there';
function hello() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
const dateLine = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
function ago(t) {
  if (!t) return '';
  const d = new Date(t), now = new Date(), day = 864e5;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const n = Math.round((b - a) / day);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function form() { const v = store.getJSON(FORM, {}); return Object.assign({ topic: '', year: 'Year 4', subject: 'maths', kind: 'slides' }, v && typeof v === 'object' ? v : {}); }

/* ---------------- the calendar part (calendar.js, loaded when there) ---------------- */
function loadCal() {
  if (calTried) return Promise.resolve(cal);
  calTried = true;
  return import('./calendar.js?v=49509700').then((m) => { cal = m; return m; }).catch(() => null);
}
const t12 = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? (((Number(m[1]) + 11) % 12) + 1) + ':' + m[2] : String(s || ''); };   // 13:00 → 1:00, as on the calendar
const hm = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
function dayHTML() {
  if (!cal || typeof cal.daySchedule !== 'function') return '';
  let list = [];
  try { list = cal.daySchedule(new Date()) || []; } catch (e) { list = []; }
  const has = typeof cal.hasTimetable === 'function' ? cal.hasTimetable() : list.length > 0;
  if (!has) {
    return '<section class="pg-card td-day td-empty" aria-labelledby="td-day-h"><div class="td-day-h"><h2 id="td-day-h">' + icon('cal') + 'Your day</h2></div>' +
      '<p class="pg-sub">Add your timetable once, and every morning this shows your classes, what is ready, and what still needs making.</p>' +
      '<div class="pg-row"><a class="btn primary" href="#/calendar/setup">' + icon('plus') + 'Set up my week</a><a class="btn" href="#/calendar">Open the calendar</a></div></section>';
  }
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  const lessons = list.filter((x) => x.kind === 'lesson' || x.kind === 'event');
  const hw = list.filter((x) => x.kind === 'homework');
  const hol = list.find((x) => x.kind === 'holiday');
  const next = lessons.find((x) => hm(x.end) > mins);
  const rows = lessons.map((x) => {
    const done = hm(x.end) <= mins, isNext = x === next, ready = x.plan && Array.isArray(x.plan.items) && x.plan.items.length;
    const topic = x.plan && x.plan.topic ? x.plan.topic : '';
    const status = x.kind === 'event' ? '' : x.taught ? '<span class="td-st ok">' + icon('check') + 'Taught</span>' : ready ? '<span class="td-st ok">' + icon('check') + 'Ready</span>' : '<span class="td-st todo">Not made yet</span>';
    const acts = x.kind === 'event' ? '' : (ready ? '<button type="button" class="btn small" data-td-open="' + esc(x.plan.items[0]) + '">' + icon('play') + 'Open</button>' :
      '<button type="button" class="btn small" data-td-make=\'' + esc(JSON.stringify({ topic, year: x.year || '', subject: x.subject || '', slot: x.slotId || '', date: x.date || '' })) + '\'>' + icon('spark') + 'Make it</button>') +
      (isNext && !soon('class') ? '<button type="button" class="btn small primary" data-td-class=\'' + esc(JSON.stringify({ title: (topic || subjectName(x.subject)) + (x.cls ? ' · ' + x.cls : ''), subject: x.subject || '', year: x.year || '', date: x.date || '', slot: x.slotId || '', items: ready ? x.plan.items : [] })) + '\'>' + icon('users') + 'Start class</button>' : '');
    return '<li class="td-c' + (done ? ' past' : '') + (isNext ? ' next' : '') + '" style="--c:' + subjectColor(x.subject || 'general') + '">' +
      '<span class="td-time"><b>' + esc(t12(x.start)) + '</b><small>' + esc(t12(x.end)) + '</small></span>' +
      '<span class="td-bar" aria-hidden="true"></span>' +
      '<span class="td-what"><b>' + esc(x.kind === 'event' ? x.title : subjectName(x.subject, true) + (x.cls ? ' · ' + x.cls : x.year ? ' · ' + x.year : '')) + '</b>' +
      '<small>' + esc(x.kind === 'event' ? (x.place || '') : topic || 'No topic yet') + (x.online ? ' · Online' : '') + '</small>' + (isNext ? '<i class="td-next">Next</i>' : '') + '</span>' +
      status + '<span class="td-acts">' + acts + '</span></li>';
  }).join('');
  return '<section class="pg-card td-day" aria-labelledby="td-day-h"><div class="td-day-h"><h2 id="td-day-h">' + icon('cal') + 'Your day</h2><a class="linkbtn" href="#/calendar/day">Open the calendar</a></div>' +
    (hol ? '<p class="td-hol">' + icon('sun') + esc(hol.title) + '</p>' : '') +
    (rows ? '<ol class="td-list">' + rows + '</ol>' : '<p class="pg-sub">No classes in your timetable today.' + (hol ? '' : ' Enjoy the space to plan.') + '</p>') +
    (hw.length ? '<div class="td-hw"><b>' + icon('notes') + 'Homework due today</b>' + hw.map((x) => '<span style="--c:' + subjectColor(x.subject || 'general') + '">' + esc(subjectName(x.subject, true) + ': ' + x.title) + '</span>').join('') + '</div>' : '') +
    '</section>';
}

/* ---------------- the page ---------------- */
function makeHTML() {
  const f = form();
  return '<section class="pg-card td-make" aria-labelledby="td-make-h">' +
    '<div class="td-make-h"><span class="td-ico">' + icon('spark') + '</span><h2 id="td-make-h">What are you teaching today?</h2></div>' +
    '<form class="td-form" novalidate>' +
    '<label class="fld td-topic"><span>Topic</span><input type="text" name="topic" autocomplete="off" enterkeyhint="done" maxlength="120" value="' + esc(f.topic) + '" placeholder="For example: Equivalent fractions"></label>' +
    '<label class="fld"><span>Year</span><select name="year">' + YEARS.map((y) => '<option' + (y === f.year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>Subject</span><select name="subject">' + SUBJECT_LIST.filter((s) => s.id !== 'general').map((s) => '<option value="' + s.id + '"' + (s.id === f.subject ? ' selected' : '') + '>' + esc(s.short) + '</option>').join('') + '</select></label>' +
    '</form>' +
    '<div class="td-kinds"><p>Make</p><div class="td-kgrid" role="group" aria-label="What to make">' +
    MAKE.map(([k, l, ic]) => '<button type="button" class="td-kind" data-kind="' + k + '" aria-pressed="' + (k === f.kind) + '">' + icon(ic) + '<span>' + l + '</span></button>').join('') + '</div></div>' +
    '<div class="td-go"><p class="fine td-where"></p><button type="button" class="btn primary big" data-td-go>' + icon('spark') + '<span>Make it</span></button></div></section>';
}
function subjectsHTML() {
  const c = counts();
  let list = SUBJECT_LIST.filter((s) => c[s.id]).sort((a, b) => c[b.id] - c[a.id]);
  ['maths', 'english', 'science'].forEach((id) => { if (!list.some((s) => s.id === id)) list.push(SUBJECT_LIST.find((s) => s.id === id)); });
  list = list.slice(0, 7);
  return '<section class="pg-sec" aria-labelledby="td-sub-h"><div class="pg-sec-h"><h2 id="td-sub-h">My subjects</h2><a href="#/subjects">See all</a></div>' +
    '<div class="td-subs">' + list.map((s) => '<a class="td-sub" href="#/subjects/' + s.id + '" style="--c:' + subjectColor(s.id) + '">' + subjectArt(s.id) +
      '<span><b>' + esc(s.short) + '</b><small>' + (c[s.id] ? c[s.id] + (c[s.id] === 1 ? ' thing' : ' things') : 'Nothing yet') + '</small></span></a>').join('') +
    '<a class="td-sub td-all" href="#/subjects">' + icon('folder') + '<span><b>All subjects</b><small>Folders for each one</small></span></a></div></section>';
}
function recentHTML() {
  const list = listAll().slice(0, 5);
  return '<section class="pg-card td-recent" aria-labelledby="td-rec-h"><div class="pg-sec-h"><h2 id="td-rec-h">Carry on where you left off</h2><a href="#/subjects">Everything</a></div>' +
    (list.length ? '<ul class="td-rlist">' + list.map((it) => '<li style="--c:' + subjectColor(it.subject) + '"><span class="td-rk" aria-hidden="true">' + icon(it.icon || KINDS[it.k].icon) + '</span>' +
      '<span class="td-rt"><b>' + esc(it.title) + '</b><small>' + esc(subjectName(it.subject, true) + (it.year ? ' · ' + it.year : '') + ' · ' + it.long + (it.at ? ' · ' + ago(it.at) : '')) + '</small></span>' +
      '<button type="button" class="btn small" data-td-open="' + esc(it.key) + '">Open</button></li>').join('') + '</ul>'
      : '<div class="pg-empty"><b>Nothing made yet</b>Type a topic above and press Make it. Everything you make is filed under its subject by itself.</div>') + '</section>';
}
function toolsHTML() {
  return '<section class="pg-card td-tools" aria-labelledby="td-tools-h"><div class="pg-sec-h"><h2 id="td-tools-h">Class tools</h2><a href="#/tools">Open all</a></div>' +
    '<div class="td-tgrid">' + TOOLS.map(([id, l, ic]) => '<a class="td-tool" href="#/tools/' + id + '"><span>' + icon(ic) + '</span>' + l + '</a>').join('') + '</div></section>';
}
function render() {
  if (!view) return;
  view.innerHTML = '<div class="pg td">' +
    '<header class="pg-head td-head"><div><p class="kicker">' + esc(dateLine()) + '</p><h1>' + esc(hello() + ', ' + firstName()) + '</h1></div>' +
    '<div class="pg-row"><button type="button" class="btn" data-ask-symphony><span class="td-sym" aria-hidden="true"></span>Ask Symphony</button>' + (soon('class') ? '' : '<a class="btn primary" href="#/class">' + icon('users') + 'Start class</a>') + '</div></header>' +
    '<div class="td-daywrap">' + dayHTML() + '</div>' + makeHTML() +
    '<section class="pg-sec td-kept" id="shelf" data-only="pinned" hidden aria-labelledby="td-kept-h"><div class="pg-sec-h"><h2 id="td-kept-h">Kept on Today</h2><span class="pg-sec-note">Lessons you keep at hand. Tap the pin to take one off.</span></div><div class="shelf-grid" id="shelf-grid"></div></section>' +
    subjectsHTML() + '<div class="td-two">' + recentHTML() + toolsHTML() + '</div></div>';
  paintWhere();
  renderShelf();
}
function paintWhere() {
  const f = readForm(), w = $('.td-where', view);
  if (!w) return;
  const k = MAKE.find((x) => x[0] === f.kind);
  const what = k ? k[1] : 'Lesson slides';
  w.innerHTML = esc(what) + ' in about a minute. Saved in <b>' + esc(subjectName(f.subject, true)) + ' › ' + esc(f.year) + '</b>.';
}
function readForm() {
  const fm = $('.td-form', view), on = $('.td-kind[aria-pressed="true"]', view);
  return { topic: str(fm.topic.value), year: fm.year.value, subject: fm.subject.value, kind: on ? on.dataset.kind : 'slides' };
}
function wire() {
  view.addEventListener('click', (e) => {
    const k = e.target.closest('.td-kind');
    if (k) { $$('.td-kind', view).forEach((b) => b.setAttribute('aria-pressed', String(b === k))); store.setJSON(FORM, readForm()); paintWhere(); return; }
    if (e.target.closest('[data-td-go]')) {
      const f = readForm();
      store.setJSON(FORM, f);
      if (!f.topic) { const t = $('.td-form [name="topic"]', view); t.focus(); t.setAttribute('aria-invalid', 'true'); t.placeholder = 'Type a topic first, for example: Equivalent fractions'; return; }
      startMaking({ kind: f.kind, topic: f.topic, year: f.year, subject: f.subject, from: 'today' });
      return;
    }
    const o = e.target.closest('[data-td-open]');
    if (o) { openItem(o.dataset.tdOpen); return; }
    const m = e.target.closest('[data-td-make]');
    if (m) { let d = {}; try { d = JSON.parse(m.dataset.tdMake); } catch (er) { d = {}; } startMaking(Object.assign({ kind: 'slides' }, d)); return; }
    const c = e.target.closest('[data-td-class]');
    if (c) { let d = {}; try { d = JSON.parse(c.dataset.tdClass); } catch (er) { d = {}; } startClass(d); }
  });
  view.addEventListener('change', (e) => {
    if (!e.target.closest('.td-form')) return;
    if (e.target.name === 'subject') subjTouched = true;
    store.setJSON(FORM, readForm()); paintWhere();
  });
  // the subject follows the topic ("Volcanoes" files under Geography) until she picks a subject herself
  view.addEventListener('input', (e) => {
    if (e.target.name !== 'topic') return;
    e.target.removeAttribute('aria-invalid'); store.setJSON(FORM, readForm());
    clearTimeout(guessT);
    guessT = setTimeout(() => {
      const fm = $('.td-form', view);
      if (!fm || subjTouched) return;
      const g = guessSubject(fm.topic.value, fm.year.value);
      if (g && g !== fm.subject.value && fm.subject.querySelector('option[value="' + g + '"]')) { fm.subject.value = g; store.setJSON(FORM, readForm()); paintWhere(); }
    }, 350);
  });
  view.addEventListener('submit', (e) => e.preventDefault());
  view.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.name === 'topic') { e.preventDefault(); e.target.blur(); } });
}
let subjTouched = false, guessT = 0;
export function mount(v) {
  view = v; subjTouched = false;
  if (!view.dataset.wired) { wire(); view.dataset.wired = '1'; }
  render();
  loadCal().then((m) => { if (m && view && !view.hidden) { const w = $('.td-daywrap', view); if (w) w.innerHTML = dayHTML(); } });
}
export function leave() { /* nothing running */ }
onLibrary(() => { if (view && !view.hidden && view.isConnected) { const keep = readFormSafe(); render(); restore(keep); } });
bus.on('calendar', () => { if (view && !view.hidden) { const w = $('.td-daywrap', view); if (w) w.innerHTML = dayHTML(); } });
function readFormSafe() { try { return readForm(); } catch (e) { return null; } }
function restore(f) {
  if (!f) return;
  const fm = $('.td-form', view); if (!fm) return;
  fm.topic.value = f.topic; fm.year.value = f.year; fm.subject.value = f.subject;
  $$('.td-kind', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === f.kind)));
  paintWhere();
}
