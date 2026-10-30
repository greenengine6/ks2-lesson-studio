/* The quiz maker (#/quiz, #/quiz/<id>): Rabinder's "quizzes like Quizizz and Baamboozle".
   - Start: Draft with Symphony (a topic), From a lesson (one of her lessons in My subjects), or Start from scratch.
   - Edit: the question list (move, copy, delete with undo), the question editor (multiple choice with 2 to 4 options,
     true or false, type the answer with other answers that count; the why; time; points; a free Wikipedia picture),
     "Make 5 more like these" and "Change it by asking" (one question, in her own words, with undo).
   - Play: live on pupils' devices (the live part), the team board game (board.js), practise on the board
     (practise.js), or turn it into a worksheet.
   Everything saves by itself to My subjects (library.js), filed under its subject and year, in the folder she picks.
   Every engine press goes through the guard (guard.js). */
import { $, $$, esc, str, icon, store, bus, toast, hasKey, askJSON, errorCopy, AiError, CONFIG, YEARS } from '../core.js?v=af1c9ebd';
import { LIMITS, makeState, makeStart, makeEnd, editState, editStart, editEnd, deliberate, watch, waitText, repaint } from '../guard.js?v=af1c9ebd';
import { track } from '../track.js?v=af1c9ebd';
import { sfx } from '../fx/audio.js?v=af1c9ebd';
import { searchPictures, creditFor, keepPic, picURL, creditText } from '../pics.js?v=af1c9ebd';
import { SUBJECT_LIST, subjectOf, subjectName, subjectColor, yearOf, mineKey, listAll, putItem, getItem, removeItem, folders, folderById, addFolder, moveItem, placeOf, pickItem, startMaking, takeMaking, openItem, onLibrary, dayLabel } from '../library.js?v=af1c9ebd';
import { TYPES, TYPE_NAME, SECS, PTS, LETTERS, MAXQ, blankQuestion, normQuestion, normQuiz, problems, notes, playable, sameText, compactOpts } from './model.js?v=af1c9ebd';
import { QUIZ_SYSTEM, draftRequest, lessonText, lessonRequest, moreRequest, editRequest } from './prompts.js?v=af1c9ebd';
import { openBoardGame } from './board.js?v=af1c9ebd';
import { openPractise } from './practise.js?v=af1c9ebd';

const SPARK = '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15v4M17 17h4"/>';
const ICO = {
  spark: SPARK,
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  board: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8 20l2-3.5M16 20l-2-3.5M7.5 10.5l2.5 2.5 5-5"/>',
  dup: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  word: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M8.5 11l1.2 6 1.6-4.5 1.6 4.5 1.2-6"/>',
  folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>'
};
const ico = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICO[n] || '') + '</svg>';
const LAST = 'ks2-engine.quiz.last.v1';
const LEVELS = [['start', 'Getting started'], ['expected', 'Expected'], ['depth', 'Greater depth']];
const COUNTS = [5, 8, 10, 12, 15, 20];

const M = {
  view: null, quiz: null, id: '', sel: 0, tab: 'draft', busy: null, ebusy: null, saveT: 0, saved: '', undo: null, undoT: 0, qundo: new Map(),
  live: undefined, form: null, lesson: null, err: '', newFolder: false, pics: null, confirmDel: ''
};

/* ---------------- the page ---------------- */
export function mount(view, sub) {
  M.view = view;
  if (!view.dataset.wired) { wire(view); view.dataset.wired = '1'; }
  checkLive();
  const id = decodeURIComponent(str(sub || ''));
  const pre = takeMaking('quiz');
  if (pre) { M.quiz = null; M.id = ''; M.tab = 'draft'; M.form = formFrom(pre); M.err = ''; render(); return; }
  if (id && id !== M.id) { openSaved(id); return; }
  if (!id && M.id) { M.quiz = null; M.id = ''; }
  if (!M.form) M.form = formFrom({});
  render();
}
export function leave() {
  flushSave();
  closePics();
}
function formFrom(o) {
  const last = store.getJSON(mineKey(LAST), {}) || {};
  return {
    topic: str(o.topic).slice(0, 120), year: yearOf(o.year) || last.year || 'Year 4', subject: subjectOf(o.subject) || last.subject || 'maths',
    n: COUNTS.includes(Number(last.n)) ? Number(last.n) : 10, types: Array.isArray(last.types) && last.types.length ? last.types.filter((t) => TYPE_NAME[t]) : ['mcq', 'tf'],
    level: LEVELS.some((l) => l[0] === last.level) ? last.level : 'expected', slot: o.slot || null
  };
}
function rememberForm() { const f = M.form; store.setJSON(mineKey(LAST), { year: f.year, subject: f.subject, n: f.n, types: f.types, level: f.level }); }
async function openSaved(id) {
  flushSave();
  const it = await getItem('quiz:' + id).catch(() => null);
  if (!it || !it.data) { M.quiz = null; M.id = ''; M.err = 'That quiz is not on this device. It may have been made on another device.'; render(); return; }
  M.quiz = normQuiz(it.data, it); M.id = id; M.sel = 0; M.err = ''; M.undo = null; M.confirmDel = '';
  if (!M.quiz.questions.length) M.quiz.questions.push(blankQuestion('mcq', M.quiz.settings));
  render();
}
async function checkLive() {
  if (M.live !== undefined) return;
  M.live = null;
  try { const m = await import('../live/tasks.js?v=af1c9ebd'); M.live = m && typeof m.startQuizLive === 'function' ? m : null; } catch (e) { M.live = null; }
  paintPlay();
}

function render() {
  const v = M.view;
  if (!v) return;
  closeConfirm();
  v.innerHTML = M.quiz ? editorPage() : startPage();
  if (M.quiz) { paintEditor(); paintPlay(); } else paintStart();
  paintYours();
  guardButtons();
}
const head = (title, sub) => '<header class="pg-head"><p class="kicker">Create › Quiz</p><h1 class="qz-h1">' + esc(title) + '</h1><p class="pg-sub qz-sub">' + sub + '</p></header>';

/* ---------------- the start page ---------------- */
function startPage() {
  const f = M.form;
  const years = '<div class="pills" role="group" aria-label="Year group">' + YEARS.map((y) => '<button type="button" class="pill" data-year="' + y + '" aria-pressed="' + (f.year === y) + '">' + y + '</button>').join('') + '</div>';
  const subj = '<select data-sf="subject" aria-label="Subject">' + SUBJECT_LIST.map((s) => '<option value="' + s.id + '"' + (s.id === f.subject ? ' selected' : '') + '>' + esc(s.short) + '</option>').join('') + '</select>';
  const opts = '<div class="qz-opts-row"><label class="fld"><span>How many questions</span><select data-sf="n">' + COUNTS.map((n) => '<option value="' + n + '"' + (n === f.n ? ' selected' : '') + '>' + n + ' questions</option>').join('') + '</select></label>' +
    '<div class="fld" role="group" aria-labelledby="qz-tl"><span id="qz-tl" class="lbl">Question types</span><div class="pills">' + TYPES.map(([t, n]) => '<button type="button" class="pill" data-type="' + t + '" aria-pressed="' + f.types.includes(t) + '">' + esc(n) + '</button>').join('') + '</div></div>' +
    '<div class="fld" role="group" aria-labelledby="qz-ll"><span id="qz-ll" class="lbl">Level</span><div class="pills">' + LEVELS.map(([l, n]) => '<button type="button" class="pill" data-level="' + l + '" aria-pressed="' + (f.level === l) + '">' + esc(n) + '</button>').join('') + '</div></div></div>';
  const meter = '<div class="qz-busy" hidden role="status" aria-live="polite"><div class="qz-busy-top"><b class="qz-busy-t">Writing your quiz…</b><button type="button" class="btn small" data-a="stop">' + icon('stop') + 'Stop</button></div><div class="meter"><i></i></div></div>';
  const lesson = M.lesson ? '<div class="qz-lesson" style="--c:' + subjectColor(M.lesson.subject) + '"><span class="qz-lk">' + icon('pack') + '</span><span><b>' + esc(M.lesson.title) + '</b><small>' + esc(subjectName(M.lesson.subject, true) + (M.lesson.year ? ' · ' + M.lesson.year : '')) + '</small></span><button type="button" class="btn small" data-a="pick">Choose another</button></div>'
    : '<button type="button" class="btn big wide qz-pickbtn" data-a="pick">' + icon('layers') + 'Choose a lesson from My subjects</button>';
  return '<div class="wrap pg qz">' + head('Make a quiz', 'Write it yourself, or let Symphony draft it from a topic or one of your lessons. Then play it live on pupils’ devices, as a board game for teams, or together on the board.') +
    (M.err ? '<p class="notice err qz-err" role="alert">' + esc(M.err) + '</p>' : '') +
    '<section class="card qz-start" aria-label="Make a quiz"><div class="seg qz-tabs" role="tablist" aria-label="How to start">' +
      [['draft', 'Draft with Symphony'], ['lesson', 'From a lesson'], ['scratch', 'Start from scratch']].map(([t, n]) => '<button type="button" role="tab" data-tab="' + t + '" aria-selected="' + (M.tab === t) + '">' + esc(n) + '</button>').join('') + '</div>' +
      '<div class="qz-panel" data-panel="draft"' + (M.tab === 'draft' ? '' : ' hidden') + '><form class="form qz-form" novalidate data-form="draft">' +
        '<label class="fld"><span>Topic</span><input type="text" data-sf="topic" value="' + esc(f.topic) + '" maxlength="120" autocomplete="off" placeholder="For example: Fractions of amounts"></label>' +
        '<div class="row2"><div class="fld" role="group" aria-label="Year group"><span class="lbl">Year group</span>' + years + '</div><label class="fld"><span>Subject</span>' + subj + '</label></div>' + opts +
        '<button type="button" class="btn primary big wide" data-a="draft" data-guard="quiz:make"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Draft my quiz</span></button>' +
        '<p class="fine" data-fine="draft"></p>' + meter + '<div class="notice" data-notice="draft" hidden role="status"></div></form></div>' +
      '<div class="qz-panel" data-panel="lesson"' + (M.tab === 'lesson' ? '' : ' hidden') + '><form class="form qz-form" novalidate data-form="lesson">' + lesson +
        '<div class="row2"><label class="fld"><span>How many questions</span><select data-sf="n">' + COUNTS.map((n) => '<option value="' + n + '"' + (n === f.n ? ' selected' : '') + '>' + n + ' questions</option>').join('') + '</select></label>' +
        '<div class="fld" role="group" aria-labelledby="qz-ll2"><span id="qz-ll2" class="lbl">Level</span><div class="pills">' + LEVELS.map(([l, n]) => '<button type="button" class="pill" data-level="' + l + '" aria-pressed="' + (f.level === l) + '">' + esc(n) + '</button>').join('') + '</div></div></div>' +
        '<button type="button" class="btn primary big wide" data-a="fromlesson" data-guard="quiz:make"' + (M.lesson ? '' : ' disabled') + '><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Make a quiz from this lesson</span></button>' +
        '<p class="fine" data-fine="lesson"></p>' + meter + '<div class="notice" data-notice="lesson" hidden role="status"></div></form></div>' +
      '<div class="qz-panel" data-panel="scratch"' + (M.tab === 'scratch' ? '' : ' hidden') + '><div class="form qz-form">' +
        '<label class="fld"><span>Quiz title</span><input type="text" data-sf="title" maxlength="100" autocomplete="off" placeholder="For example: Fractions of amounts"></label>' +
        '<div class="row2"><div class="fld" role="group" aria-label="Year group"><span class="lbl">Year group</span>' + years + '</div><label class="fld"><span>Subject</span>' + subj + '</label></div>' +
        '<button type="button" class="btn primary big wide" data-a="scratch">' + icon('plus') + '<span>Start my quiz</span></button><p class="fine">No engine needed: you write every question.</p></div></div>' +
    '</section>' +
    '<section class="card qz-yours" aria-labelledby="qz-yh"><h2 id="qz-yh">Your quizzes</h2><div class="qz-ylist"></div></section></div>';
}
function paintStart() {
  const sc = $('[data-sf="title"]', M.view);
  if (sc && M.form.topic) sc.value = M.form.topic;
}

/* ---------------- the editor page ---------------- */
function subLine() {
  const q = M.quiz, n = q.questions.length;
  const parts = [subjectName(q.subject, true)];
  if (q.year) parts.push(q.year);
  parts.push(n + (n === 1 ? ' question' : ' questions'));
  let s = esc(parts.join(' · '));
  if (q.from && q.from.title) s += ' · made from your lesson “' + esc(q.from.title) + '”';
  return s + ' <span class="qz-saved" aria-live="polite"></span>';
}
function editorPage() {
  const q = M.quiz;
  const subj = '<select data-qf="subject" aria-label="Subject">' + SUBJECT_LIST.map((s) => '<option value="' + s.id + '"' + (s.id === q.subject ? ' selected' : '') + '>' + esc(s.short) + '</option>').join('') + '</select>';
  const year = '<select data-qf="year" aria-label="Year group"><option value=""' + (!q.year ? ' selected' : '') + '>Any year</option>' + YEARS.concat(['KS2']).map((y) => '<option value="' + y + '"' + (y === q.year ? ' selected' : '') + '>' + (y === 'KS2' ? 'Whole KS2' : y) + '</option>').join('') + '</select>';
  return '<div class="wrap pg qz">' + head(q.title || 'New quiz', subLine()) +
    '<section class="card qz-meta" aria-label="Quiz details"><label class="fld qz-mtitle"><span>Title</span><input type="text" data-qf="title" value="' + esc(q.title) + '" maxlength="100" autocomplete="off" placeholder="Give your quiz a name"></label>' +
      '<label class="fld"><span>Topic</span><input type="text" data-qf="topic" value="' + esc(q.topic) + '" maxlength="120" autocomplete="off" placeholder="What it is about"></label>' +
      '<label class="fld"><span>Subject</span>' + subj + '</label><label class="fld"><span>Year group</span>' + year + '</label>' +
      '<div class="fld qz-folder"><span class="lbl">Folder</span><div class="qz-fwrap"></div></div>' +
      '<label class="qz-check"><input type="checkbox" data-qf="shuffle"' + (q.settings.shuffle ? ' checked' : '') + '><span>Mix up the order when playing</span></label></section>' +
    '<div class="qz-grid">' +
      '<section class="card qz-list" aria-labelledby="qz-lh"><h2 id="qz-lh">Questions</h2><ol class="qz-ol"></ol>' +
        '<button type="button" class="btn small wide" data-a="add">' + icon('plus') + '<span>Add a question</span></button>' +
        '<button type="button" class="btn small wide qz-more" data-a="more" data-guard="quiz:more"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Make 5 more like these</span></button>' +
        '<p class="fine" data-fine="more"></p><div class="qz-busy" hidden role="status" aria-live="polite"><div class="qz-busy-top"><b class="qz-busy-t">Writing 5 more…</b><button type="button" class="btn small" data-a="stop">' + icon('stop') + 'Stop</button></div><div class="meter"><i></i></div></div>' +
        '<div class="notice" data-notice="more" hidden role="status"></div></section>' +
      '<section class="card qz-ed" aria-labelledby="qz-eh"></section>' +
      '<section class="qz-play" aria-labelledby="qz-ph"><h2 id="qz-ph">How will you play?</h2><div class="qz-pcards"></div><div class="qz-after"></div></section>' +
    '</div>' +
    '<section class="card qz-yours" aria-labelledby="qz-yh"><h2 id="qz-yh">Your quizzes</h2><div class="qz-ylist"></div></section></div>';
}
function summary(q) {
  const t = str(q.q);
  return t ? (t.length > 64 ? t.slice(0, 62) + '…' : t) : '(' + TYPE_NAME[q.type] + ', empty)';
}
function paintList() {
  const ol = $('.qz-ol', M.view);
  if (!ol) return;
  ol.innerHTML = M.quiz.questions.map((q, i) => {
    const bad = problems(q).length > 0;
    return '<li draggable="true" data-drag="' + i + '"><button type="button" class="qz-li" data-sel="' + i + '"' + (i === M.sel ? ' aria-current="true"' : '') + ' aria-label="Question ' + (i + 1) + ': ' + esc(summary(q)) + (bad ? ' (needs fixing)' : '') + '">' +
      '<b>' + (i + 1) + '</b><span class="qz-lt">' + esc(summary(q)) + '</span>' + (bad ? '<i class="qz-dot" title="Needs fixing"></i>' : '') + '</button></li>';
  }).join('');
  const more = $('[data-a="more"]', M.view);
  if (more) more.hidden = M.quiz.questions.length >= MAXQ;
}
function paintEditor() {
  paintList();
  paintFolder();
  const box = $('.qz-ed', M.view);
  if (!box) return;
  const qz = M.quiz, n = qz.questions.length;
  M.sel = Math.max(0, Math.min(M.sel, n - 1));
  const q = qz.questions[M.sel];
  if (!q) { box.innerHTML = '<p class="fine">Add a question to start.</p>'; return; }
  const typeSel = '<select data-ef="type" aria-label="Question type">' + TYPES.map(([t, nm]) => '<option value="' + t + '"' + (t === q.type ? ' selected' : '') + '>' + esc(nm) + '</option>').join('') + '</select>';
  let answers = '';
  if (q.type === 'mcq') {
    answers = '<div class="qz-optlist" role="group" aria-label="Options (tick the right one)">' + [0, 1, 2, 3].map((j) => {
      const v = q.opts[j] != null ? q.opts[j] : '';
      return '<div class="qz-opt' + (q.a === j ? ' right' : '') + '" style="--oc:' + ['#4F46E5', '#1F7A75', '#A44F0F', '#7E3FAF'][j] + '"><button type="button" class="qz-tick" data-right="' + j + '" aria-pressed="' + (q.a === j) + '" aria-label="Option ' + LETTERS[j] + ' is the right answer" title="This is the right answer">' + (q.a === j ? icon('check') : '<b>' + LETTERS[j] + '</b>') + '</button>' +
        '<label class="qz-otext"><span class="sr">Option ' + LETTERS[j] + (j >= 2 ? ' (optional)' : '') + '</span><input type="text" data-opt="' + j + '" value="' + esc(v) + '" maxlength="120" autocomplete="off" placeholder="' + (j < 2 ? 'Option ' + LETTERS[j] : 'Option ' + LETTERS[j] + ' (optional)') + '"></label>' + (q.a === j ? '<span class="qz-rightw">' + icon('check') + 'Right</span>' : '') + '</div>';
    }).join('') + '</div><p class="fine">Tick the right answer. Two options are enough, but three or four are fairer.</p>';
  } else if (q.type === 'tf') {
    answers = '<div class="qz-tf" role="group" aria-label="The right answer">' + ['True', 'False'].map((w, j) => '<button type="button" class="qz-tfb' + (q.a === j ? ' right' : '') + '" data-right="' + j + '" aria-pressed="' + (q.a === j) + '">' + (q.a === j ? icon('check') : '') + '<span>' + w + '</span></button>').join('') + '</div><p class="fine">Tap the right answer: is the statement true or false?</p>';
  } else {
    answers = '<div class="row2"><label class="fld"><span>The answer</span><input type="text" data-ef="a" value="' + esc(q.a) + '" maxlength="80" autocomplete="off" placeholder="For example: 15"></label>' +
      '<label class="fld"><span>Other answers that count <span class="opt">(optional)</span></span><input type="text" data-ef="alt" value="' + esc((q.alt || []).join(', ')) + '" maxlength="300" autocomplete="off" placeholder="For example: fifteen"></label></div><p class="fine">Separate other answers with commas. Capital letters and spaces do not matter.</p>';
  }
  const secs = '<label class="qz-inl"><span>Time</span><select data-ef="secs">' + SECS.map((s) => '<option value="' + s + '"' + (s === q.secs ? ' selected' : '') + '>' + s + ' seconds</option>').join('') + '</select></label>';
  const pts = '<label class="qz-inl"><span>Points</span><select data-ef="pts">' + PTS.map(([p, l]) => '<option value="' + p + '"' + (p === q.pts ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + (PTS.some((x) => x[0] === q.pts) ? '' : '<option value="' + q.pts + '" selected>' + q.pts + ' points</option>') + '</select></label>';
  const pic = q.pic && picURL(q.pic, '500') ? '<figure class="qz-pic"><img src="' + esc(picURL(q.pic, '500')) + '" alt="' + esc(q.pic.alt || '') + '" decoding="async"><figcaption>' + esc(creditText(q.pic, true)) + '</figcaption><button type="button" class="btn small" data-a="unpic">' + icon('trash') + '<span>Remove picture</span></button></figure>'
    : '<button type="button" class="btn small" data-a="pic">' + icon('image') + '<span>Add a picture</span></button>';
  const probs = problems(q), tips = notes(q), u = M.qundo.get(q.id);
  box.innerHTML = '<div class="qz-etop"><h2 id="qz-eh">Question ' + (M.sel + 1) + '</h2><label class="qz-inl"><span>Type</span>' + typeSel + '</label>' +
      '<div class="qz-etools" role="group" aria-label="This question"><button type="button" class="btn small icon" data-a="up" aria-label="Move up" title="Move up"' + (M.sel === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
      '<button type="button" class="btn small icon" data-a="down" aria-label="Move down" title="Move down"' + (M.sel === n - 1 ? ' disabled' : '') + '>' + ico('down') + '</button>' +
      '<button type="button" class="btn small icon" data-a="dup" aria-label="Copy this question" title="Copy"' + (n >= MAXQ ? ' disabled' : '') + '>' + ico('dup') + '</button>' +
      '<button type="button" class="btn small icon" data-a="del" aria-label="Delete this question" title="Delete">' + icon('trash') + '</button></div></div>' +
    (M.undo ? '<p class="qz-undo" role="status"><span>Question deleted.</span><button type="button" class="linkbtn" data-a="undel">Undo</button></p>' : '') +
    '<label class="fld"><span>' + (q.type === 'tf' ? 'The statement' : 'The question') + '</span><textarea data-ef="q" rows="2" maxlength="240" placeholder="' + (q.type === 'tf' ? 'For example: 2/4 is the same as 1/2.' : 'For example: What is 3/4 of 20?') + '">' + esc(q.q) + '</textarea></label>' +
    '<div class="qz-prev" aria-hidden="true"' + (str(q.q) ? '' : ' hidden') + '>' + esc(q.q) + '</div>' +
    answers +
    '<label class="fld"><span>Why <span class="opt">(shown after the answer)</span></span><textarea data-ef="why" rows="2" maxlength="320" placeholder="Why the answer is right, and the slip behind each wrong option.">' + esc(q.why) + '</textarea></label>' +
    '<div class="qz-erow">' + secs + pts + pic + '</div>' +
    '<div class="qz-probs" aria-live="polite">' + (probs.length ? '<ul class="qz-bad">' + probs.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '<p class="qz-ok">' + icon('check') + 'Ready to play</p>') + (tips.length ? '<p class="fine">' + esc(tips.join(' ')) + '</p>' : '') + '</div>' +
    '<form class="qz-ask" novalidate data-form="ask"><label class="fld"><span>Change it by asking Symphony</span><input type="text" data-ef="ask" maxlength="300" autocomplete="off" placeholder="For example: make it harder, or use ringgit"></label>' +
      '<button type="button" class="btn small" data-a="ask"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Change it</span></button>' + (u && u.length ? '<button type="button" class="linkbtn" data-a="unask">Undo the change</button>' : '') +
      '<div class="notice" data-notice="ask" hidden role="status"></div></form>';
}
function paintProblems() {
  const q = M.quiz && M.quiz.questions[M.sel], box = $('.qz-probs', M.view);
  if (!q || !box) return;
  const probs = problems(q), tips = notes(q);
  box.innerHTML = (probs.length ? '<ul class="qz-bad">' + probs.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '<p class="qz-ok">' + icon('check') + 'Ready to play</p>') + (tips.length ? '<p class="fine">' + esc(tips.join(' ')) + '</p>' : '');
}
function paintFolder() {
  const box = $('.qz-fwrap', M.view);
  if (!box || !M.quiz) return;
  const key = M.id ? 'quiz:' + M.id : '', pl = key ? placeOf(key) : {}, list = folders(M.quiz.subject);
  if (M.newFolder) {
    box.innerHTML = '<span class="qz-nf"><input type="text" data-nf maxlength="60" autocomplete="off" placeholder="For example: Fractions unit" aria-label="New folder name"><button type="button" class="btn small" data-a="addfolder">Add</button><button type="button" class="linkbtn" data-a="nofolder">Cancel</button></span>';
    setTimeout(() => { const i = $('[data-nf]', box); if (i) i.focus(); }, 20);
    return;
  }
  box.innerHTML = '<select data-qf="folder" aria-label="Folder"><option value="">' + esc(subjectName(M.quiz.subject, true)) + ' (no folder)</option>' + list.map((f) => '<option value="' + esc(f.id) + '"' + (pl.f === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>').join('') + '<option value="+">New folder…</option></select>';
}
function savedIn() {
  if (!M.quiz) return '';
  const key = M.id ? 'quiz:' + M.id : '', pl = key ? placeOf(key) : {}, f = pl.f ? folderById(pl.f) : null;
  return [subjectName(M.quiz.subject, true), M.quiz.year, f && f.name].filter(Boolean).join(' › ');
}
function paintPlay() {
  const box = M.view && $('.qz-pcards', M.view);
  if (!box || !M.quiz) return;
  const { quiz: p, skipped } = playable(M.quiz), ready = p.questions.length;
  const liveOK = !!M.live, none = !ready;
  const card = (a, cls, ic, title, text, pill, off) => '<button type="button" class="qz-pcard ' + cls + '" data-a="' + a + '"' + (off ? ' disabled' : '') + '><span class="qz-pi">' + ico(ic) + '</span><b>' + esc(title) + '</b><span class="qz-pt">' + esc(text) + '</span><span class="qz-pill">' + esc(pill) + '</span></button>';
  box.innerHTML =
    card('live', 'live', 'phone', 'Live on pupils’ devices', 'Like Quizizz. Pupils join with a QR code and answer on their own tablet or phone, with points and a leaderboard.', liveOK ? 'Start live quiz' : M.live === undefined ? 'Checking…' : 'Coming soon', none || !liveOK) +
    card('board', 'board', 'grid', 'Board game for teams', 'Like Baamboozle. No devices needed. Teams take turns to pick a tile on the board, and some tiles hide surprises.', 'Start board game', none) +
    card('practise', 'prac', 'board', 'Practise on the board', 'The whole class answers together, one question at a time, with a countdown and a class score.', 'Start practising', none);
  const after = $('.qz-after', M.view);
  if (after) after.innerHTML = '<p class="qz-ready">' + (ready ? ready + (ready === 1 ? ' question' : ' questions') + ' ready' : 'No questions ready yet') + (skipped ? ' · ' + skipped + ' need' + (skipped === 1 ? 's' : '') + ' fixing first' : '') + '</p>' +
    '<button type="button" class="linkbtn" data-a="sheet"' + (ready ? '' : ' disabled') + '>' + ico('word') + 'Turn it into a worksheet (Word)</button>' +
    '<p class="qz-in">' + ico('folder') + '<span>' + (M.id ? 'Saved in <b>' + esc(savedIn()) + '</b>' : 'Saved in My subjects when you start writing') + '</span></p>';
}
function paintSaved(state) {
  M.saved = state;
  const s = $('.qz-saved', M.view);
  if (!s) return;
  s.textContent = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved: this browser is full or blocked' : '';
  s.className = 'qz-saved' + (state ? ' ' + state : '');
}
function paintHead() {
  const h = $('.qz-h1', M.view), s = $('.qz-sub', M.view);
  if (h) h.textContent = M.quiz.title || 'New quiz';
  if (s) { s.innerHTML = subLine(); paintSaved(M.saved); }
}

/* ---------------- your quizzes ---------------- */
function paintYours() {
  const box = M.view && $('.qz-ylist', M.view);
  if (!box) return;
  const list = listAll().filter((it) => it.k === 'quiz' && it.id !== M.id);
  const sec = box.closest('.qz-yours');
  if (sec) { const h = $('h2', sec); if (h) h.textContent = M.quiz ? 'Your other quizzes' : 'Your quizzes'; }
  if (!list.length) { box.innerHTML = '<p class="fine">' + (M.quiz ? 'Your other quizzes appear here.' : 'Quizzes you make appear here, and in My subjects under their subject.') + '</p>'; return; }
  box.innerHTML = '<ul class="qz-ycards">' + list.slice(0, 30).map((it) => '<li class="qz-yc" style="--c:' + subjectColor(it.subject) + '"><button type="button" class="qz-yopen" data-open="' + esc(it.id) + '"><span class="qz-yk">' + icon('vote') + '</span><span class="qz-yt"><b>' + esc(it.title) + '</b><small>' + esc([subjectName(it.subject, true), it.year, it.n + (it.n === 1 ? ' question' : ' questions'), dayLabel(it.at)].filter(Boolean).join(' · ')) + '</small></span></button>' +
    (M.confirmDel === it.id ? '<span class="qz-ydel"><button type="button" class="btn small" data-delyes="' + esc(it.id) + '">Delete</button><button type="button" class="linkbtn" data-delno>Keep</button></span>' : '<button type="button" class="btn small icon" data-del="' + esc(it.id) + '" aria-label="Delete ' + esc(it.title) + '" title="Delete">' + icon('trash') + '</button>') + '</li>').join('') + '</ul>';
}
function closeConfirm() { M.confirmDel = ''; }

/* ---------------- saving ---------------- */
const meaningful = (q) => !!(str(q.title) || str(q.topic) || q.questions.some((x) => str(x.q)));
function scheduleSave() {
  if (!M.quiz) return;
  clearTimeout(M.saveT);
  if (!meaningful(M.quiz)) return;
  paintSaved('saving');
  M.saveT = setTimeout(save, 600);
}
function flushSave() { if (M.saveT) { clearTimeout(M.saveT); M.saveT = 0; if (M.quiz && meaningful(M.quiz)) save(); } }
async function save() {
  M.saveT = 0;
  const q = M.quiz;
  if (!q || !meaningful(q)) return;
  try {
    const pic = (q.questions.find((x) => x.pic) || {}).pic || null;
    const key = await putItem('quiz', { id: M.id || undefined, title: q.title || q.topic || 'Quiz', topic: q.topic, subject: q.subject, year: q.year, n: q.questions.length, unit: 'questions', cover: pic, data: q });
    if (M.quiz !== q) return;
    const id = key.slice(5);
    if (!M.id) {
      M.id = id;
      try { history.replaceState(null, '', '#/quiz/' + encodeURIComponent(id)); } catch (e) { /* the address stays */ }
      paintFolder();
      paintYours();
    }
    paintSaved('saved');
    paintPlay();
  } catch (e) { paintSaved('error'); }
}
function changed(o) {
  o = o || {};
  if (o.list) paintList();
  if (o.editor) paintEditor(); else if (o.problems) paintProblems();
  if (o.head) paintHead();
  paintPlay();
  scheduleSave();
}

/* ---------------- events ---------------- */
function wire(view) {
  view.addEventListener('click', onClick);
  view.addEventListener('input', onInput);
  view.addEventListener('change', onChange);
  view.addEventListener('submit', (e) => e.preventDefault());
  view.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (t.matches('[data-ef="ask"]')) { e.preventDefault(); return; }                  // Enter never presses an engine button
    if (t.matches('[data-nf]')) { e.preventDefault(); addNewFolder(); return; }
    if (t.matches('input[type="text"]')) { e.preventDefault(); const all = $$('input[type="text"],select,textarea', view).filter((x) => x.offsetParent !== null), i = all.indexOf(t); if (all[i + 1]) all[i + 1].focus(); else t.blur(); }
  });
  let dragFrom = -1;
  view.addEventListener('dragstart', (e) => { const li = e.target.closest && e.target.closest('[data-drag]'); if (!li) return; dragFrom = Number(li.dataset.drag); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (er) { /* fine */ } li.classList.add('dragging'); });
  view.addEventListener('dragover', (e) => { const li = e.target.closest && e.target.closest('[data-drag]'); if (li && dragFrom >= 0) { e.preventDefault(); $$('[data-drag]', view).forEach((x) => x.classList.toggle('over', x === li)); } });
  view.addEventListener('dragend', () => { dragFrom = -1; $$('[data-drag]', view).forEach((x) => x.classList.remove('dragging', 'over')); });
  view.addEventListener('drop', (e) => {
    const li = e.target.closest && e.target.closest('[data-drag]');
    if (!li || dragFrom < 0 || !M.quiz) return;
    e.preventDefault();
    const to = Number(li.dataset.drag), qs = M.quiz.questions;
    if (to !== dragFrom && qs[dragFrom]) { const [x] = qs.splice(dragFrom, 1); qs.splice(to, 0, x); M.sel = to; changed({ list: true, editor: true }); }
    dragFrom = -1;
  });
  onLibrary(() => { if (M.view && M.view.isConnected && !M.view.closest('[hidden]')) { paintYours(); if (M.quiz) { paintFolder(); paintPlay(); } } });
}
function onInput(e) {
  const t = e.target;
  if (t.dataset.sf) {
    const f = M.form, k = t.dataset.sf;
    if (k === 'topic' || k === 'title') f.topic = str(t.value).slice(0, 120);
    return;
  }
  if (!M.quiz) return;
  if (t.dataset.qf === 'title') { M.quiz.title = str(t.value).slice(0, 100); changed({ head: true }); return; }
  if (t.dataset.qf === 'topic') { M.quiz.topic = str(t.value).slice(0, 120); changed({}); return; }
  const q = M.quiz.questions[M.sel];
  if (!q) return;
  if (t.dataset.ef === 'q') {
    q.q = String(t.value).slice(0, 240);
    const pv = $('.qz-prev', M.view); if (pv) { pv.textContent = q.q; pv.hidden = !str(q.q); }
    const li = $('[data-sel="' + M.sel + '"] .qz-lt', M.view); if (li) li.textContent = summary(q);
    changed({ problems: true });
    paintListDot();
    return;
  }
  if (t.dataset.opt != null) { const j = Number(t.dataset.opt); while (q.opts.length <= j) q.opts.push(''); q.opts[j] = String(t.value).slice(0, 120); trimOpts(q); changed({ problems: true }); paintListDot(); return; }
  if (t.dataset.ef === 'a') { q.a = String(t.value).slice(0, 80); changed({ problems: true }); paintListDot(); return; }
  if (t.dataset.ef === 'alt') { q.alt = String(t.value).split(/[,;]/).map((x) => str(x).slice(0, 80)).filter(Boolean).slice(0, 6); changed({}); return; }
  if (t.dataset.ef === 'why') { q.why = String(t.value).slice(0, 320); changed({}); }
}
/* Keep the options list four long while editing (blank ones are left out when playing). */
function trimOpts(q) { while (q.opts.length < 4) q.opts.push(''); q.opts = q.opts.slice(0, 4); }
function paintListDot() {
  const q = M.quiz.questions[M.sel], b = $('[data-sel="' + M.sel + '"]', M.view);
  if (!b) return;
  const bad = problems(q).length > 0, dot = $('.qz-dot', b);
  if (bad && !dot) b.insertAdjacentHTML('beforeend', '<i class="qz-dot" title="Needs fixing"></i>');
  if (!bad && dot) dot.remove();
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.sf === 'subject') { M.form.subject = t.value; return; }
  if (t.dataset.sf === 'n') { M.form.n = Number(t.value) || 10; return; }
  if (!M.quiz) return;
  const key = M.id ? 'quiz:' + M.id : '';
  if (t.dataset.qf === 'subject') {
    M.quiz.subject = subjectOf(t.value) || 'general';
    if (key) moveItem(key, { subject: M.quiz.subject, folder: '' });
    paintFolder(); changed({ head: true }); return;
  }
  if (t.dataset.qf === 'year') { M.quiz.year = yearOf(t.value); if (key) moveItem(key, { year: M.quiz.year }); changed({ head: true }); return; }
  if (t.dataset.qf === 'shuffle') { M.quiz.settings.shuffle = !!t.checked; changed({}); return; }
  if (t.dataset.qf === 'folder') {
    if (t.value === '+') { M.newFolder = true; paintFolder(); return; }
    ensureSaved().then((k) => { if (k) { moveItem(k, { folder: t.value }); paintPlay(); } });
    return;
  }
  const q = M.quiz.questions[M.sel];
  if (!q) return;
  if (t.dataset.ef === 'type') { changeType(q, t.value); return; }
  if (t.dataset.ef === 'secs') { q.secs = Number(t.value) || 20; changed({}); return; }
  if (t.dataset.ef === 'pts') { q.pts = Number(t.value) || 1000; changed({}); }
}
async function ensureSaved() {
  if (M.id) return 'quiz:' + M.id;
  if (!M.quiz) return '';
  if (!meaningful(M.quiz)) M.quiz.title = M.quiz.title || 'Quiz';
  clearTimeout(M.saveT);
  await save();
  return M.id ? 'quiz:' + M.id : '';
}
async function addNewFolder() {
  const inp = $('[data-nf]', M.view), name = str(inp && inp.value);
  if (!name) { if (inp) inp.focus(); return; }
  const k = await ensureSaved();
  const f = addFolder(M.quiz.subject, name, M.quiz.year);
  if (k) moveItem(k, { folder: f.id });
  M.newFolder = false;
  paintFolder(); paintPlay();
  toast('Folder “' + f.name + '” made in ' + subjectName(M.quiz.subject, true) + '.');
}
function changeType(q, type) {
  if (!TYPE_NAME[type] || type === q.type) return;
  const was = q.type;
  if (type === 'tf') { q.opts = ['True', 'False']; q.a = 0; }
  else if (type === 'mcq') {
    if (was === 'type' && str(q.a)) { q.opts = [String(q.a), '', '', '']; q.a = 0; }
    else { q.opts = ['', '', '', '']; q.a = -1; }
  } else {
    q.a = was === 'mcq' && q.opts[q.a] ? q.opts[q.a] : was === 'tf' ? (q.a === 0 ? 'True' : 'False') : '';
    q.opts = []; q.alt = [];
  }
  q.type = type;
  changed({ list: true, editor: true });
}

async function onClick(e) {
  const b = e.target.closest('button');
  if (!b || b.disabled || !M.view.contains(b)) return;
  const a = b.dataset.a;
  /* start page */
  if (b.dataset.tab) { M.tab = b.dataset.tab; M.err = ''; render(); const t = $('[data-tab="' + M.tab + '"]', M.view); if (t) t.focus(); return; }
  if (b.dataset.year && M.form && !M.quiz) { M.form.year = b.dataset.year; $$('[data-year]', M.view).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.year === M.form.year))); return; }
  if (b.dataset.type && !M.quiz) {
    const t = b.dataset.type, f = M.form;
    f.types = f.types.includes(t) ? f.types.filter((x) => x !== t) : f.types.concat([t]);
    if (!f.types.length) f.types = ['mcq'];
    $$('[data-type]', M.view).forEach((x) => x.setAttribute('aria-pressed', String(f.types.includes(x.dataset.type))));
    return;
  }
  if (b.dataset.level && !M.quiz) { M.form.level = b.dataset.level; $$('[data-level]', M.view).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.level === M.form.level))); return; }
  if (a === 'draft') { if (deliberate(e, b)) draft(); return; }
  if (a === 'fromlesson') { if (deliberate(e, b)) fromLesson(); return; }
  if (a === 'pick') { choose(); return; }
  if (a === 'scratch') { scratch(); return; }
  if (a === 'stop') { if (M.busy) M.busy.abort(); return; }
  /* your quizzes */
  if (b.dataset.open) { location.hash = '#/quiz/' + encodeURIComponent(b.dataset.open); return; }
  if (b.dataset.del) { M.confirmDel = b.dataset.del; paintYours(); const y = $('[data-delyes]', M.view); if (y) y.focus(); return; }
  if (b.dataset.delno != null && b.hasAttribute('data-delno')) { M.confirmDel = ''; paintYours(); return; }
  if (b.dataset.delyes) { const id = b.dataset.delyes; M.confirmDel = ''; await removeItem('quiz:' + id); toast('Quiz deleted.'); paintYours(); return; }
  if (!M.quiz) return;
  /* editor */
  const qs = M.quiz.questions;
  if (b.dataset.sel != null) { M.sel = Number(b.dataset.sel); M.undo = null; paintEditor(); const ta = $('[data-ef="q"]', M.view); if (ta && window.matchMedia('(hover: hover)').matches) ta.focus(); return; }
  if (b.dataset.right != null) { const q = qs[M.sel]; q.a = Number(b.dataset.right); sfx('tap'); changed({ list: true, editor: true }); return; }
  if (a === 'add') { if (qs.length >= MAXQ) { toast('A quiz can have up to ' + MAXQ + ' questions.'); return; } qs.push(blankQuestion('mcq', M.quiz.settings)); M.sel = qs.length - 1; changed({ list: true, editor: true, head: true }); focusQ(); return; }
  if (a === 'up' || a === 'down') { const j = M.sel + (a === 'up' ? -1 : 1); if (j < 0 || j >= qs.length) return; [qs[M.sel], qs[j]] = [qs[j], qs[M.sel]]; M.sel = j; changed({ list: true, editor: true }); const nb = $('[data-a="' + a + '"]', M.view); if (nb && !nb.disabled) nb.focus(); return; }
  if (a === 'dup') { if (qs.length >= MAXQ) return; const c = JSON.parse(JSON.stringify(qs[M.sel])); c.id = blankQuestion('mcq').id; qs.splice(M.sel + 1, 0, c); M.sel += 1; changed({ list: true, editor: true, head: true }); toast('Question copied.'); return; }
  if (a === 'del') {
    const [gone] = qs.splice(M.sel, 1);
    clearTimeout(M.undoT);
    M.undo = { q: gone, i: M.sel, blank: false };
    M.undoT = setTimeout(() => { M.undo = null; const u = $('.qz-undo', M.view); if (u) u.remove(); }, 10000);
    if (!qs.length) { qs.push(blankQuestion('mcq', M.quiz.settings)); M.undo.blank = true; }
    M.sel = Math.min(M.sel, qs.length - 1);
    changed({ list: true, editor: true, head: true });
    return;
  }
  if (a === 'undel' && M.undo) {
    if (M.undo.blank && qs.length === 1 && !str(qs[0].q)) qs.splice(0, 1);       // the empty one put there for her goes again
    qs.splice(Math.min(M.undo.i, qs.length), 0, M.undo.q); M.sel = Math.min(M.undo.i, qs.length - 1); M.undo = null;
    changed({ list: true, editor: true, head: true });
    return;
  }
  if (a === 'pic') { openPics(); return; }
  if (a === 'unpic') { qs[M.sel].pic = null; changed({ editor: true }); return; }
  if (a === 'ask') { askChange(e, b); return; }
  if (a === 'unask') { const q = qs[M.sel], st = M.qundo.get(q.id); if (st && st.length) { const prev = st.pop(); qs[M.sel] = prev; M.qundo.set(prev.id, st); changed({ list: true, editor: true }); toast('Change undone.'); } return; }
  if (a === 'more') { if (deliberate(e, b)) more(); return; }
  if (a === 'addfolder') { addNewFolder(); return; }
  if (a === 'nofolder') { M.newFolder = false; paintFolder(); return; }
  /* play */
  if (a === 'board') { flushSave(); openBoardGame(M.quiz); return; }
  if (a === 'practise') { flushSave(); openPractise(M.quiz); return; }
  if (a === 'live') { flushSave(); goLive(); return; }
  if (a === 'sheet') { toSheet(); }
}
function focusQ() { setTimeout(() => { const ta = $('[data-ef="q"]', M.view); if (ta) ta.focus(); }, 20); }

/* ---------------- start from scratch, and choosing a lesson ---------------- */
function scratch() {
  const f = M.form, t = $('[data-sf="title"]', M.view);
  const title = str(t && t.value);
  M.quiz = normQuiz({ title, topic: title, subject: f.subject, year: f.year, questions: [] });
  M.quiz.questions.push(blankQuestion('mcq', M.quiz.settings));
  M.id = ''; M.sel = 0; M.err = '';
  rememberForm();
  render();
  scheduleSave();
  focusQ();
}
async function choose() {
  const key = await pickItem({ title: 'Make a quiz from a lesson', kinds: ['lkie', 'slides'], subject: M.form.subject, year: M.form.year });
  if (!key) return;
  const it = await getItem(key);
  if (!it) { toast('That lesson could not be opened.'); return; }
  const isPack = !!(it.slides && it.input);
  const title = isPack ? str(it.title || it.input.topic) : str(it.deck && it.deck.title);
  const subject = subjectOf(isPack ? (it.input.subjectName || it.input.subject) : it.deck && it.deck.subject) || M.form.subject;
  const year = yearOf(isPack ? it.input.year : it.deck && it.deck.year) || M.form.year;
  M.lesson = { key, title: title || 'Lesson', subject, year, text: lessonText(it) };
  if (!M.lesson.text) { M.lesson = null; toast('That lesson has no words to make questions from.'); return; }
  render();
}

/* ---------------- the engine: draft, from a lesson, more, change ---------------- */
function guardButtons() {
  const v = M.view;
  const draftB = $('[data-a="draft"]', v), lesB = $('[data-a="fromlesson"]', v), moreB = $('[data-a="more"]', v);
  const idle = 'About a minute. Saved to My subjects by itself. After each one this button rests for ' + LIMITS.restMin + ' minutes.';
  if (draftB) watch(draftB, { name: 'quiz:make', label: 'Draft my quiz', icon: SPARK, fine: $('[data-fine="draft"]', v), idle, busy: () => !!M.busy });
  if (lesB && M.lesson) watch(lesB, { name: 'quiz:make', label: 'Make a quiz from this lesson', icon: SPARK, fine: $('[data-fine="lesson"]', v), idle, busy: () => !!M.busy });
  else { const fl = $('[data-fine="lesson"]', v); if (fl) fl.textContent = 'Choose a lesson first. Symphony makes questions from what it taught.'; }
  if (moreB) watch(moreB, { name: 'quiz:more', label: 'Make 5 more like these', icon: SPARK, fine: $('[data-fine="more"]', v), idle: 'Adds 5 new questions on the same topic.', busy: () => !!M.busy });
}
function notice(which, msg, err) {
  const n = $('[data-notice="' + which + '"]', M.view);
  if (!n) { if (msg) toast(msg); return; }
  n.textContent = msg || ''; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg;
}
function busyUI(scope, on, label) {
  const box = scope && $('.qz-busy', scope);
  if (!box) return;
  box.hidden = !on;
  if (label) { const t = $('.qz-busy-t', box); if (t) t.textContent = label; }
  if (on) $('.meter i', box).style.width = '5%';
}
function meter(scope, k) { const i = scope && $('.qz-busy .meter i', scope); if (i) i.style.width = Math.max(5, Math.min(96, Math.round(k * 100))) + '%'; }
/* The questions in a reply, checked: only fair, complete questions are kept, and none twice. */
function cleanQuestions(raw, have, secs) {
  const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.questions) ? raw.questions : [];
  const out = [];
  list.forEach((x) => {
    const q = normQuestion(x, secs);
    if (!q || problems(q).length) return;
    if (q.type === 'mcq') { if (!compactOpts(q) || q.opts.length < 2) return; trimOpts(q); }
    if (out.concat(have || []).some((y) => sameText(y.q, q.q))) return;
    out.push(q);
  });
  return out;
}
async function runEngine(o) {
  /* o: { guard, which, scope, prompt, n, label, onDone(questions, raw) } */
  if (M.busy) return;
  notice(o.which, '');
  const g = makeState(o.guard);
  if (!g.ok) { repaint(); notice(o.which, waitText(g)); return; }
  if (!hasKey()) { notice(o.which, errorCopy('no_key'), true); bus.emit('need-key'); return; }
  const ctl = new AbortController(), ticket = makeStart(o.guard), t0 = Date.now();
  let outcome = 'error';
  M.busy = ctl;
  const btn = $('[data-a="' + o.btn + '"]', M.view);
  if (btn) { btn.disabled = true; const s = $('span', btn); if (s) s.textContent = 'Writing…'; }
  busyUI(o.scope, true, o.label);
  sfx('send');
  try {
    const raw = await askJSON(o.prompt, {
      system: QUIZ_SYSTEM, model: CONFIG.mainModel, maxTokens: Math.min(8000, Math.max(2500, o.n * 300 + 900)), signal: ctl.signal,
      onText: (text) => { const k = (text.match(/"q"\s*:/g) || []).length; meter(o.scope, (k + 0.3) / (o.n + 0.5)); const t = o.scope && $('.qz-busy-t', o.scope); if (t) t.textContent = (o.labelN || 'Writing question') + ' ' + Math.min(o.n, Math.max(1, k)) + ' of ' + o.n + '…'; }
    });
    const qs = cleanQuestions(raw, o.have, o.secs);
    if (qs.length < Math.min(3, o.n)) throw new AiError('invalid_json');
    outcome = 'ok';
    track('gen', { eng: 'quiz', title: str(raw && raw.title) || o.title || 'Quiz', year: o.year || '', ok: 1, ms: Date.now() - t0 });
    o.onDone(qs, raw);
    sfx('success');
  } catch (e) {
    const code = e && e.code;
    track('gen', { eng: 'quiz', title: o.title || 'Quiz', year: o.year || '', ok: 0, err: code || 'error', ms: Date.now() - t0 });
    if (code === 'cancelled') { outcome = 'stopped'; notice(o.which, 'Stopped. Change anything you like and press the button again.'); }
    else { sfx('error'); notice(o.which, errorCopy(code, 'the quiz'), true); if (code === 'no_key') bus.emit('need-key'); }
  } finally {
    if (M.busy === ctl) M.busy = null;
    makeEnd(ticket, outcome);
    busyUI(o.scope, false);
    const b2 = $('[data-a="' + o.btn + '"]', M.view);
    if (b2) b2.disabled = false;
    repaint();
  }
}
function draft() {
  const f = M.form, topic = str(f.topic);
  if (!topic) { notice('draft', 'Type a topic first, for example “Fractions of amounts”.', true); const i = $('[data-sf="topic"]', M.view); if (i) i.focus(); return; }
  rememberForm();
  runEngine({
    guard: 'quiz:make', which: 'draft', btn: 'draft', scope: $('[data-panel="draft"]', M.view), n: f.n, title: topic, year: f.year, secs: 20, label: 'Writing your quiz…',
    prompt: draftRequest({ topic, year: f.year, subject: f.subject, n: f.n, types: f.types, level: f.level }),
    onDone: (qs, raw) => openNew({ title: str(raw && raw.title) || topic, topic, subject: f.subject, year: f.year }, qs)
  });
}
function fromLesson() {
  const f = M.form, L = M.lesson;
  if (!L) return;
  rememberForm();
  runEngine({
    guard: 'quiz:make', which: 'lesson', btn: 'fromlesson', scope: $('[data-panel="lesson"]', M.view), n: f.n, title: L.title, year: L.year, secs: 20, label: 'Reading your lesson…',
    prompt: lessonRequest({ n: f.n, types: ['mcq', 'tf'], level: f.level, year: L.year, subject: L.subject }, L.text),
    onDone: (qs, raw) => openNew({ title: str(raw && raw.title) || L.title, topic: L.title, subject: L.subject, year: L.year, from: { key: L.key, title: L.title } }, qs)
  });
}
function openNew(meta, qs) {
  M.quiz = normQuiz(Object.assign({}, meta, { questions: qs }));
  M.id = ''; M.sel = 0; M.err = ''; M.lesson = null;
  render();
  save().then(() => toast('Your quiz is ready: ' + qs.length + ' questions. Check them before you play.'));
}
function more() {
  const q = M.quiz, n = Math.min(5, MAXQ - q.questions.length);
  if (n <= 0) return;
  const have = q.questions.filter((x) => str(x.q));
  if (!have.length) { notice('more', 'Write one question first, so Symphony knows what kind to make.', true); return; }
  runEngine({
    guard: 'quiz:more', which: 'more', btn: 'more', scope: $('.qz-list', M.view), n, have, title: q.title, year: q.year, secs: q.settings.secs, label: 'Writing 5 more…', labelN: 'Writing',
    prompt: moreRequest(q, n),
    onDone: (qs) => {
      const add = qs.slice(0, n);
      const blank = q.questions.length === 1 && !str(q.questions[0].q);
      if (blank) q.questions.splice(0, 1);
      const at = q.questions.length;
      q.questions.push(...add);
      M.sel = at;
      changed({ list: true, editor: true, head: true });
      toast(add.length + ' new questions added at the end.');
    }
  });
}
async function askChange(e, b) {
  const q = M.quiz.questions[M.sel], inp = $('[data-ef="ask"]', M.view), ask = str(inp && inp.value);
  if (!ask) { notice('ask', 'Type what to change first, for example “make it harder”.', true); if (inp) inp.focus(); return; }
  if (!deliberate(e, b)) return;
  if (M.ebusy) return;
  const g = editState();
  if (!g.ok) { notice('ask', g.why === 'gap' ? 'One small change every few seconds. Try again in a moment.' : g.why === 'busy' ? 'Something else is being made. Try again when it is ready.' : 'That is the most small changes for one hour. Try again a little later.'); return; }
  if (!hasKey()) { notice('ask', errorCopy('no_key'), true); bus.emit('need-key'); return; }
  const t = editStart(), ctl = new AbortController();
  let ok = false;
  M.ebusy = ctl;
  b.disabled = true; const s = $('span', b); if (s) s.textContent = 'Changing…';
  notice('ask', '');
  try {
    const raw = await askJSON(editRequest(M.quiz, q, ask), { system: QUIZ_SYSTEM, model: CONFIG.mainModel, maxTokens: 1200, signal: ctl.signal });
    const one = normQuestion(Array.isArray(raw) ? raw[0] : raw && raw.questions ? raw.questions[0] : raw, q.secs);
    if (!one || problems(one).length) throw new AiError('invalid_json');
    if (one.type === 'mcq') { if (!compactOpts(one) || one.opts.length < 2) throw new AiError('invalid_json'); trimOpts(one); }
    Object.assign(one, { id: q.id, secs: q.secs, pts: q.pts, pic: q.pic });
    const st = M.qundo.get(q.id) || [];
    st.push(JSON.parse(JSON.stringify(q)));
    M.qundo.set(q.id, st.slice(-10));
    const i = M.quiz.questions.indexOf(q);
    if (i >= 0) M.quiz.questions[i] = one;
    ok = true;
    changed({ list: true, editor: true });
    sfx('success');
    toast('Question ' + (i + 1) + ' changed. Undo is there if you prefer the old one.');
  } catch (er) {
    const code = er && er.code;
    if (code !== 'cancelled') { sfx('error'); notice('ask', code === 'invalid_json' || code === 'truncated' || code === 'empty' ? 'That change did not work. Try saying it another way.' : errorCopy(code, 'the change'), true); }
  } finally {
    M.ebusy = null;
    editEnd(t, ok);
    const b2 = $('[data-a="ask"]', M.view); if (b2) { b2.disabled = false; const s2 = $('span', b2); if (s2) s2.textContent = 'Change it'; }
  }
}

/* ---------------- pictures ---------------- */
function openPics() {
  closePics();
  const q = M.quiz.questions[M.sel];
  const wrap = document.createElement('div');
  wrap.className = 'modal qz-pics';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'qzp-h');
  const start = str(M.quiz.topic || M.quiz.title || '');
  wrap.innerHTML = '<div class="modal-card qzp-card" style="position:relative"><button type="button" class="btn small icon modal-x" data-pz="x" aria-label="Close">' + icon('close') + '</button>' +
    '<h2 id="qzp-h"><i>' + icon('image') + '</i>Add a picture</h2>' +
    '<form class="qzp-form" novalidate><label class="fld"><span>Search free pictures from Wikipedia</span><input type="text" data-pz="q" value="' + esc(start) + '" maxlength="80" autocomplete="off" placeholder="For example: pizza"></label><button type="submit" class="btn">' + icon('search') + 'Search</button></form>' +
    '<div class="qzp-grid" aria-live="polite"></div><p class="fine">Every picture shows who took it and its licence. Check it before you show the class.</p></div>';
  document.body.appendChild(wrap);
  const last = document.activeElement;
  M.pics = { wrap, last, qid: q.id, list: [] };
  const run = async () => {
    const term = str($('[data-pz="q"]', wrap).value), grid = $('.qzp-grid', wrap);
    if (!term) return;
    grid.innerHTML = '<p class="fine">Looking…</p>';
    try {
      const list = await searchPictures(term, 12);
      if (!M.pics || M.pics.wrap !== wrap) return;
      M.pics.list = list;
      grid.innerHTML = list.length ? list.map((p, i) => '<button type="button" class="qzp-it" data-pick="' + i + '"><img src="' + esc(picURL(p, '330') || p.t) + '" alt="' + esc(p.alt || p.page || '') + '" loading="lazy" decoding="async"><span>' + esc(p.page || '') + '</span></button>').join('') : '<p class="fine">No free pictures found for that. Try a simpler word.</p>';
    } catch (e) { grid.innerHTML = '<p class="notice err">Wikipedia could not be reached. Check the internet and try again.</p>'; }
  };
  $('form', wrap).addEventListener('submit', (e) => { e.preventDefault(); run(); });
  wrap.addEventListener('click', async (e) => {
    if (e.target === wrap || e.target.closest('[data-pz="x"]')) { closePics(); return; }
    const b = e.target.closest('[data-pick]');
    if (!b || !M.pics) return;
    const p = M.pics.list[Number(b.dataset.pick)], qid = M.pics.qid;
    if (!p) return;
    b.disabled = true;
    await creditFor(p).catch(() => null);
    const target = M.quiz && M.quiz.questions.find((x) => x.id === qid);
    if (target) { target.pic = keepPic(p, { size: '960', fit: 'contain' }); changed({ editor: true }); }
    closePics();
    toast('Picture added. Its credit shows under it.');
  });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closePics(); } });
  setTimeout(() => { const i = $('[data-pz="q"]', wrap); if (i) { i.focus(); i.select(); } }, 30);
  if (start) run();
}
function closePics() {
  if (!M.pics) return;
  const { wrap, last } = M.pics;
  M.pics = null;
  wrap.remove();
  if (last && last.focus && last.isConnected) last.focus();
}

/* ---------------- playing ---------------- */
async function goLive() {
  const { quiz: p, skipped } = playable(M.quiz);
  if (!p.questions.length) { toast('Fix at least one question first.'); return; }
  if (!M.live) { toast('Live quizzes on pupils’ devices are coming soon.'); return; }
  if (skipped) toast(skipped + (skipped === 1 ? ' question needs' : ' questions need') + ' fixing, so ' + (skipped === 1 ? 'it is' : 'they are') + ' left out.');
  try { await M.live.startQuizLive(p, {}); } catch (e) { console.error(e); toast('The live quiz could not start. Check the internet and try again.'); }
}
async function toSheet() {
  const k = await ensureSaved();
  const q = M.quiz;
  let fn = null;
  try { const m = await import('../worksheet/maker.js?v=af1c9ebd'); fn = m && typeof m.quizToSheet === 'function' ? m.quizToSheet : null; } catch (e) { fn = null; }
  if (fn) {
    try {
      const { quiz: p } = playable(q);
      const sheet = fn(p);
      if (sheet && typeof sheet === 'object') {
        const n = (sheet.sections || []).reduce((t, s) => t + ((s && s.questions) || []).length, 0);
        const key = await putItem('sheet', { title: sheet.title || q.title || 'Worksheet', topic: q.topic, subject: q.subject, year: q.year, n, unit: 'questions', data: sheet });
        toast('Worksheet made from your quiz. Download it in Word from the worksheet page.');
        openItem(key);
        return;
      }
    } catch (e) { console.error(e); }
  }
  startMaking({ kind: 'sheet', topic: q.topic || q.title, year: q.year, subject: q.subject, from: k || '' });
}
