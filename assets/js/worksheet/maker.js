/* The worksheet maker (#/worksheet and #/worksheet/<id>): Rabinder's point 10, worksheets made from a sample she
   gives, where the questions are not the same as the sample's.
   - Three ways in: From a topic; From a sample (a photo, a PDF, a Word file or pasted text); From a lesson or quiz
     made on this device.
   - One engine call writes the worksheet, with Support and Challenge levels and every answer if she asks. Then the page
     checks it: no question too close to a sample question (any that are get rewritten with one small edit and checked
     again; any still too close are marked "Check this one"), and the answers (missing ones, options, simple sums and
     missing numbers in fractions).
   - Saved in My subjects by itself (subject, year, a folder she picks). Word downloads of the worksheet (each level on
     its own pages) and of the answer sheet; "Another version"; pupils can do it on their own devices in a live lesson.
   Every engine press goes through the guard: Make and Another version rest like every Make button; the rewrite of
   too-close questions is a small edit. */
import { $, $$, esc, str, arr, icon, store, bus, hasKey, askClaude, parseJSON, houseFix, errorCopy, toast, CONFIG, AiError, YEARS } from '../core.js?v=3c9d4698';
import { makeState, makeStart, makeEnd, editState, editStart, editEnd, deliberate, watch, waitText, repaint, LIMITS } from '../guard.js?v=3c9d4698';
import { track } from '../track.js?v=3c9d4698';
import { sfx } from '../fx/audio.js?v=3c9d4698';
import { fracWords } from '../fractions.js?v=3c9d4698';
import { SUBJECT_LIST, subjectOf, subjectName, subjectColor, yearOf, putItem, getItem, removeItem, listAll, findItem, folders, addFolder, moveItem, pickItem, takeMaking, onLibrary, dayLabel } from '../library.js?v=3c9d4698';
import { SHEET_SYSTEM, sampleRequest, topicRequest, lessonRequest, againRequest, fixRequest, normSheet, normQuestion, copyCheck, answerIssues, quizToSheet as toSheet, lessonText, TYPES, LEVELS, sectionsFor, questionsOf, eachLevel } from './prompts.js?v=3c9d4698';
import { readSample, sampleFromText, contentFor, sampleError, sizeText } from './sample.js?v=3c9d4698';
import { sheetDocx, answersDocx, fileName, mixed } from './docx.js?v=3c9d4698';

const FORM = 'ks2-engine.sheet.form.v1';
const SPARK = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>';
const AGAIN = '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>';
const svg = (paths) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
const ICON = {
  spark: svg(SPARK), again: svg(AGAIN),
  file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
  word: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 12l1.2 5 1.8-4 1.8 4 1.2-5"/>'),
  devices: svg('<rect x="3" y="4" width="13" height="10" rx="1.6"/><path d="M7 18h5M9.5 14v4"/><rect x="16.5" y="9" width="5" height="11" rx="1.2"/><path d="M18.6 17.6h.8"/>'),
  paste: svg('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M9 10h6M9 14h6M9 18h3"/>'),
  folder: svg('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>'),
  answers: svg('<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9l1.5 1.5 3-3M8.5 15l1.5 1.5 3-3"/><path d="M15 9.5h1.5M15 15.5h1.5"/>')
};
const TRY = ['Equivalent fractions', 'Column subtraction', 'Rounding off to the nearest 100', 'Fronted adverbials', 'The water cycle', 'Times tables to 12'];
const LEVEL_NAME = Object.fromEntries(LEVELS.concat([['answers', 'Answers']]));

/* ---------------- state ---------------- */
const S = {
  view: null, tab: 'sample', sample: null, sampleBusy: false, pasting: false, sampleQs: [], lessonKey: '',
  sheet: null, key: '', level: 'core', busy: null, flagged: [], issues: [], again: false, liveOK: null, del: '', newFolder: false,
  input: { topic: '', year: 'Year 4', subject: 'maths', count: 8, types: [], support: true, challenge: true, answers: true, diff: 'numbers', sYear: '', sSubject: '', note: '' },
  notice: '', noticeErr: false
};
function restoreForm() {
  const v = store.getJSON(FORM, null);
  if (!v || typeof v !== 'object') return;
  const i = S.input;
  if (YEARS.includes(v.year)) i.year = v.year;
  if (SUBJECT_LIST.some((s) => s.id === v.subject)) i.subject = v.subject;
  if ([6, 8, 10, 12, 15].includes(v.count)) i.count = v.count;
  if (Array.isArray(v.types)) i.types = v.types.filter((t) => TYPES[t]);
  ['support', 'challenge', 'answers'].forEach((k) => { if (typeof v[k] === 'boolean') i[k] = v[k]; });
  if (v.diff === 'words' || v.diff === 'numbers') i.diff = v.diff;
}
function saveForm() { const i = S.input; store.setJSON(FORM, { year: i.year, subject: i.subject, count: i.count, types: i.types, support: i.support, challenge: i.challenge, answers: i.answers, diff: i.diff }); }

/* ---------------- text on the page: fractions stacked, □ as boxes ---------------- */
const FR = /(\d{1,4}|□)\s*\/\s*(\d{1,4}|□)/g;
export function rich(s) {
  const t = String(s == null ? '' : s);
  const plain = (u) => esc(u).split('□').join('<span class="wk-box" role="img" aria-label="missing number"></span>').replace(/\n/g, '<br>');
  let out = '', last = 0, m;
  FR.lastIndex = 0;
  while ((m = FR.exec(t))) {
    if (/[\d/]/.test(t[m.index - 1] || '') || /[\d/]/.test(t[m.index + m[0].length] || '')) continue;
    out += plain(t.slice(last, m.index));
    const box = (v) => (v === '□' ? '<span class="wk-box sm" aria-hidden="true"></span>' : esc(v));
    const said = m[1] !== '□' && m[2] !== '□' ? fracWords(m[1] + '/' + m[2]) : (m[1] === '□' ? 'missing number' : m[1]) + ' over ' + (m[2] === '□' ? 'missing number' : m[2]);
    out += '<span class="fr" role="math" aria-label="' + esc(said) + '"><span class="fr-n">' + box(m[1]) + '</span><span class="fr-s">/</span><span class="fr-d">' + box(m[2]) + '</span></span>';
    last = m.index + m[0].length;
  }
  return out + plain(t.slice(last));
}

/* ---------------- the page ---------------- */
function headHTML() {
  return '<header class="pg-head wk-head"><div><p class="kicker">Create</p><h1>Worksheet maker</h1>' +
    '<p class="pg-sub">Make a worksheet from a topic, from a sample you already like, or from a lesson. Symphony keeps the skills and makes every question new.</p></div>' +
    '<div class="seg wk-tabs" role="tablist" aria-label="Start from">' +
    [['topic', 'From a topic'], ['sample', 'From a sample'], ['lesson', 'From a lesson']].map(([k, n]) => '<button type="button" role="tab" data-ws-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + n + '</button>').join('') + '</div></header>';
}
const pills = (name, items, cur, multi) => '<div class="pills wk-pills" role="group">' + items.map(([v, label]) => '<button type="button" class="pill" data-ws-' + name + '="' + esc(v) + '" aria-pressed="' + (multi ? cur.includes(v) : String(v) === String(cur)) + '">' + esc(label) + '</button>').join('') + '</div>';
function subjectSelect(id, cur, auto) {
  return '<select id="' + id + '">' + (auto ? '<option value="">As in the sample</option>' : '') + SUBJECT_LIST.map((s) => '<option value="' + s.id + '"' + (s.id === cur ? ' selected' : '') + '>' + esc(s.short) + '</option>').join('') + '</select>';
}
function yearSelect(id, cur) {
  return '<select id="' + id + '"><option value="">As in the sample</option>' + YEARS.map((y) => '<option' + (y === cur ? ' selected' : '') + '>' + y + '</option>').join('') + '</select>';
}
function levelsHTML(n) {
  const i = S.input;
  return '<fieldset class="wk-fs"><legend>' + n + '. Levels</legend><div class="wk-checkrow">' +
    '<label><input type="checkbox" data-ws-lv="support"' + (i.support ? ' checked' : '') + '>Support</label>' +
    '<label><input type="checkbox" checked disabled>Core</label>' +
    '<label><input type="checkbox" data-ws-lv="challenge"' + (i.challenge ? ' checked' : '') + '>Challenge</label>' +
    '<label><input type="checkbox" data-ws-lv="answers"' + (i.answers ? ' checked' : '') + '>Answer sheet</label></div></fieldset>';
}
function goHTML(label) {
  return '<button type="button" class="btn primary big wide wk-go" id="wk-go" data-ws="go">' + ICON.spark + '<span>' + esc(label) + '</span></button>' +
    '<p class="fine" id="wk-fine"></p><div class="notice' + (S.noticeErr ? ' err' : '') + '" id="wk-notice" role="status"' + (S.notice ? '' : ' hidden') + '>' + esc(S.notice) + '</div>';
}
function sampleCard() {
  const s = S.sample;
  if (S.sampleBusy) return '<div class="wk-drop busy" aria-busy="true"><span class="wk-spin" aria-hidden="true"></span><b>Reading your file…</b></div>';
  if (!s) {
    return '<label class="wk-drop" id="wk-drop"><input type="file" id="wk-file" class="sr" accept="image/*,.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document">' +
      '<span class="wk-drop-i">' + icon('upload') + '</span><b>Upload your sample</b><span>A photo of the page, a PDF or a Word file</span><small>Or drop it here</small></label>' +
      (S.pasting ? '<label class="fld"><span>Paste the worksheet’s text</span><textarea id="wk-paste" rows="6" placeholder="Paste the questions here">' + '</textarea></label><button type="button" class="btn" data-ws="paste-use">' + icon('check') + 'Use this text</button>'
        : '<button type="button" class="linkbtn wk-paste" data-ws="paste-open">' + ICON.paste + 'Paste the text instead</button>');
  }
  let pic;
  if (s.kind === 'image') pic = '<img class="wk-thumb" src="' + esc(s.thumb) + '" alt="Your sample worksheet">';
  else if (s.kind === 'pdf') pic = '<div class="wk-docthumb">' + ICON.file + '<b>' + esc(s.name) + '</b><span>PDF · ' + sizeText(s.size) + (s.pages ? ' · ' + s.pages + (s.pages === 1 ? ' page' : ' pages') : '') + '</span></div>';
  else pic = '<div class="wk-paperthumb"><small>' + esc(s.kind === 'docx' ? 'From ' + s.name : 'Pasted text') + '</small>' + s.text.split('\n').filter(Boolean).slice(0, 9).map((l) => '<p>' + rich(l.slice(0, 90)) + '</p>').join('') + '</div>';
  return '<div class="wk-sample"><div class="wk-sample-frame">' + pic + '</div></div>';
}
function foundHTML() {
  const sh = S.sheet;
  if (!sh || sh.from !== 'sample' || !sh.found || !(sh.found.summary || sh.found.layout)) return '';
  return '<div class="wk-found"><b>Symphony found</b>' + (sh.found.summary ? '<span>' + rich(sh.found.summary) + '</span>' : '') + (sh.found.layout ? '<span>' + rich(sh.found.layout) + '</span>' : '') +
    (sh.found.skills.length ? '<span class="wk-found-s">' + sh.found.skills.slice(0, 4).map(esc).join(' · ') + '</span>' : '') + '</div>';
}
function leftHTML() {
  const i = S.input;
  if (S.tab === 'topic') {
    return '<h2 class="wk-h2">Your topic</h2>' +
      '<label class="fld"><span>Topic</span><input type="text" id="wk-topic" autocomplete="off" maxlength="160" placeholder="For example: Equivalent fractions" value="' + esc(i.topic) + '"></label>' +
      '<div class="try" aria-label="Ideas"><span>Try:</span>' + TRY.map((t) => '<button type="button" data-ws-try="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<div class="fld"><span class="lbl">Year group</span>' + pills('year', YEARS.map((y) => [y, y]), i.year) + '</div>' +
      '<label class="fld"><span>Subject</span>' + subjectSelect('wk-subject', i.subject, false) + '</label>' +
      '<div class="fld"><span class="lbl">How many questions</span>' + pills('count', [6, 8, 10, 12, 15].map((n) => [n, String(n)]), i.count) + '</div>' +
      '<div class="fld"><span class="lbl">Kinds of question <span class="opt">(optional: leave them all off for a good mix)</span></span>' + pills('type', Object.entries(TYPES), i.types, true) + '</div>' +
      levelsHTML(5) + '<label class="fld"><span>Anything else? <span class="opt">(optional)</span></span><input type="text" id="wk-note" maxlength="300" autocomplete="off" placeholder="For example: use money in ringgit" value="' + esc(i.note) + '"></label>' + goHTML('Make my worksheet');
  }
  if (S.tab === 'lesson') {
    const it = S.lessonKey ? findItem(S.lessonKey) : null;
    return '<h2 class="wk-h2">1. Your lesson</h2><p class="fine">Pick a lesson or a quiz you made. Symphony writes new questions that practise what it teaches.</p>' +
      (it ? '<div class="wk-chosen" style="--c:' + subjectColor(it.subject) + '"><span class="wk-chosen-i">' + icon(it.k === 'quiz' ? 'vote' : it.k === 'slides' ? 'slides' : 'pack') + '</span><span><b>' + esc(it.title) + '</b><small>' + esc(it.long + ' · ' + subjectName(it.subject, true) + (it.year ? ' · ' + it.year : '')) + '</small></span>' +
        '<button type="button" class="btn small" data-ws="pick-lesson">Change</button></div>'
        : '<button type="button" class="btn big wide" data-ws="pick-lesson">' + icon('layers') + 'Choose a lesson or quiz</button>') +
      '<div class="fld"><span class="lbl">2. How many questions</span>' + pills('count', [6, 8, 10, 12, 15].map((n) => [n, String(n)]), i.count) + '</div>' +
      levelsHTML(3) + goHTML('Make my worksheet');
  }
  return '<div class="wk-h2row"><h2 class="wk-h2">1. Your sample</h2>' + (S.sample ? '<button type="button" class="btn small" data-ws="sample-clear">' + icon('upload') + 'Change</button>' : '') + '</div>' +
    sampleCard() + '<p class="wk-privacy">' + icon('lock') + '<span>The sample goes to the engine only to make this worksheet. The site does not keep it.</span></p>' + foundHTML() +
    '<div class="wk-row2"><label class="fld"><span>Year group</span>' + yearSelect('wk-s-year', i.sYear) + '</label><label class="fld"><span>Subject</span>' + subjectSelect('wk-s-subject', i.sSubject, true) + '</label></div>' +
    '<fieldset class="wk-fs"><legend>2. How different should it be?</legend>' +
    [['numbers', 'Same skills and layout, new numbers'], ['words', 'Same skills, new numbers and new word problems']].map(([v, t]) => '<label class="wk-radio"><input type="radio" name="wk-diff" value="' + v + '"' + (i.diff === v ? ' checked' : '') + '>' + t + '</label>').join('') + '</fieldset>' +
    levelsHTML(3) + goHTML('Make my worksheet');
}

/* ---------------- the result ---------------- */
function flagsMap() {
  const m = new Map();
  S.flagged.forEach((f) => m.set(f.level + ':' + f.si + ':' + f.qi, { kind: 'copy', why: 'Check this one: it is close to a sample question (“' + String(f.like).slice(0, 80) + '”).' }));
  S.issues.forEach((f) => { const k = f.level + ':' + f.si + ':' + f.qi; if (!m.has(k)) m.set(k, { kind: 'answer', why: f.why }); });
  return m;
}
function qHTML(q, ref, flags) {
  const f = flags.get(ref);
  let h = '<p class="wk-qt">' + rich(q.q) + (q.marks > 1 ? ' <small class="wk-marks">(' + q.marks + ' marks)</small>' : '') + '</p>';
  if (q.type === 'choice') h += '<ul class="wk-opts">' + q.opts.map((o, j) => '<li><span class="wk-tick" aria-hidden="true"></span><b>' + 'ABCDEF'[j] + '</b><span>' + rich(o) + '</span></li>').join('') + '</ul>';
  else if (q.type === 'tick') h += '<table class="wk-tf"><thead><tr><th scope="col">Statement</th><th scope="col">True</th><th scope="col">False</th></tr></thead><tbody>' + q.opts.map((s) => '<tr><td>' + rich(s) + '</td><td><span class="wk-tick"></span></td><td><span class="wk-tick"></span></td></tr>').join('') + '</tbody></table>';
  else if (q.type === 'order') h += '<ul class="wk-opts">' + mixed(q.opts, q.q).map(([t]) => '<li><span class="wk-tick sq" aria-hidden="true"></span><span>' + rich(t) + '</span></li>').join('') + '</ul>';
  else if (q.type === 'match') { const r = mixed(q.match, q.q); h += '<div class="wk-match">' + q.opts.map((l, j) => '<span class="l"><b>' + (j + 1) + '.</b> ' + rich(l) + '</span><span class="dash" aria-hidden="true"></span><span class="r"><b>' + 'ABCDEFGH'[j] + '.</b> ' + rich(r[j][0]) + '</span>').join('') + '</div>'; }
  else if (q.type === 'draw') h += '<div class="wk-drawbox" style="--h:' + Math.max(2, q.lines || 4) + '"></div>';
  else if (q.type === 'calc') h += '<div class="wk-work"><small>Working</small></div>';
  const lines = q.type === 'write' ? Math.max(1, q.lines || 0) : (['draw', 'calc'].includes(q.type) ? 0 : q.lines || 0);
  if (lines) h += '<div class="wk-lines" aria-hidden="true">' + '<i></i>'.repeat(lines) + '</div>';
  return '<div class="wk-q' + (f ? ' flag ' + f.kind : '') + '"><span class="wk-n">' + esc(q.n) + '.</span><div class="wk-qb">' + h + (f ? '<p class="wk-flagnote">' + icon('info') + '<span>' + esc(f.why) + '</span></p>' : '') + '</div></div>';
}
function paperHTML() {
  const sh = S.sheet, lv = S.level, flags = flagsMap(), color = subjectColor(sh.subject);
  if (lv === 'answers') {
    let h = '<div class="wk-paper wk-anspaper"><div class="wk-ptitle"><span class="wk-badge" style="--c:' + color + '">' + ICON.answers + '</span><div><b>Answers: ' + rich(sh.title) + '</b><span>For the teacher</span></div></div>';
    eachLevel(sh, (level, secs) => {
      if (sh.levels) h += '<h3 class="wk-anslv">' + esc(LEVEL_NAME[level]) + '</h3>';
      h += '<ol class="wk-anslist">' + secs.flatMap((s, si) => s.questions.map((q, qi) => { const f = flags.get(level + ':' + si + ':' + qi); return '<li' + (f && f.kind === 'answer' ? ' class="flag"' : '') + '><b>' + esc(q.n) + '.</b><span>' + (q.answer ? rich(q.answer) : '<i>Answers will vary</i>') + (f && f.kind === 'answer' ? '<em>' + esc(f.why) + '</em>' : '') + '</span></li>'; })).join('') + '</ol>';
    });
    return h + '</div>';
  }
  const secs = sectionsFor(sh, lv);
  return '<div class="wk-paper" lang="en-GB"><div class="wk-namerow"><span>Name ______________________</span><span>Date ____________</span></div>' +
    '<div class="wk-ptitle"><span class="wk-badge" style="--c:' + color + '">' + ICON.file + '</span><div><b>' + rich(sh.title) + '</b><span>' + esc([sh.levels ? LEVEL_NAME[lv] : '', sh.instructions].filter(Boolean).join(' · ')) + '</span></div></div>' +
    secs.map((s, si) => '<section class="wk-sec">' + (s.heading ? '<h3>' + rich(s.heading) + '</h3>' : '') + (s.instructions ? '<p class="wk-sec-i">' + rich(s.instructions) + '</p>' : '') +
      '<div class="wk-qs' + (s.columns === 2 ? ' two' : '') + '">' + s.questions.map((q, qi) => qHTML(q, lv + ':' + si + ':' + qi, flags)).join('') + '</div></section>').join('') + '</div>';
}
function checksHTML() {
  const sh = S.sheet, list = [];
  const fromSample = sh.from === 'sample' || S.sampleQs.length > 0;
  if (sh.from === 'quiz') list.push(['ok', 'Made from your quiz']);
  else if (fromSample || S.again) list.push(['ok', 'Same skills and layout']);
  else list.push(['ok', 'Fits ' + (sh.year || 'the year group')]);
  if (fromSample || S.again) list.push(S.flagged.length ? ['warn', S.flagged.length + (S.flagged.length === 1 ? ' question to check: close to the sample' : ' questions to check: close to the sample')] : ['ok', S.again && !S.sampleQs.length ? 'No question copied from the last version' : 'No question copied from the sample']);
  list.push(S.issues.length ? ['warn', S.issues.length + (S.issues.length === 1 ? ' answer to check' : ' answers to check')] : ['ok', 'Answers checked']);
  return '<ul class="wk-checks">' + list.map(([k, t]) => '<li class="' + k + '">' + icon(k === 'ok' ? 'check' : 'info') + esc(t) + '</li>').join('') + '</ul>';
}
function savedHTML() {
  if (!S.key) return '';
  const it = findItem(S.key), subj = it ? it.subject : S.sheet.subject, yr = it ? it.year : S.sheet.year;
  const fs = folders(subj), cur = it ? it.folder : '', f = fs.find((x) => x.id === cur);
  return '<div class="wk-saved"><span class="wk-saved-t">' + icon('check') + '<span>Saved in <b>' + esc(subjectName(subj, true) + (yr ? ' › ' + yr : '') + (f ? ' › ' + f.name : '')) + '</b></span></span>' +
    '<label class="wk-fold"><span>' + ICON.folder + 'Folder</span><select id="wk-folder"><option value="">No folder</option>' + fs.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '<option value="__new">New folder…</option></select></label>' +
    (S.newFolder ? '<span class="wk-newf"><input type="text" id="wk-fname" maxlength="60" placeholder="For example: Fractions unit" aria-label="New folder name"><button type="button" class="btn small primary" data-ws="folder-add">Add</button><button type="button" class="btn small" data-ws="folder-cancel">Cancel</button></span>' : '') + '</div>';
}
function resultHTML() {
  const sh = S.sheet;
  const tabs = [];
  if (sh.levels && sh.levels.support) tabs.push('support');
  tabs.push('core');
  if (sh.levels && sh.levels.challenge) tabs.push('challenge');
  if (S.input.answers || sh.from === 'quiz') tabs.push('answers');
  if (!tabs.includes(S.level)) S.level = 'core';
  const live = S.liveOK === false ? '<button type="button" class="btn" disabled title="Pupils’ devices: coming soon">' + ICON.devices + '<span>Pupils’ devices: coming soon</span></button>'
    : '<button type="button" class="btn" data-ws="live">' + ICON.devices + '<span>Pupils do it on their devices</span></button>';
  return '<div class="wk-rhead"><h2 class="wk-h2">Your new worksheet</h2><span class="fine">' + questionsOf(sh.sections).length + ' questions' + (sh.levels ? ' · ' + tabs.filter((t) => t !== 'answers').length + ' levels' : '') + '</span></div>' + checksHTML() +
    (sh.differences && sh.differences.length ? '<details class="wk-diffs"' + (S.again || sh.from === 'sample' ? ' open' : '') + '><summary>How it is different</summary><ul>' + sh.differences.map((d) => '<li>' + rich(d) + '</li>').join('') + '</ul></details>' : '') +
    (tabs.length > 1 ? '<div class="seg wk-lvtabs" role="tablist" aria-label="Level">' + tabs.map((t) => '<button type="button" role="tab" data-ws-level="' + t + '" aria-selected="' + (S.level === t) + '">' + esc(LEVEL_NAME[t]) + '</button>').join('') + '</div>' : '') +
    '<div class="wk-paperwrap">' + paperHTML() + '</div>' +
    '<div class="wk-actions"><button type="button" class="btn primary" data-ws="word">' + ICON.word + '<span>Word</span></button>' +
    (tabs.includes('answers') ? '<button type="button" class="btn" data-ws="answers-word">' + ICON.answers + '<span>Answer sheet (Word)</span></button>' : '') +
    (sh.from === 'quiz' ? '' : '<button type="button" class="btn" id="wk-again" data-ws="again">' + ICON.again + '<span>Another version</span></button>') + live + '</div>' +
    '<p class="fine" id="wk-again-fine"></p>' + savedHTML();
}
function busyHTML() {
  const b = S.busy;
  return '<div class="wk-busy" role="status" aria-live="polite"><div class="wk-busy-top"><b id="wk-busy-l">' + esc(b.label) + '</b><button type="button" class="btn small" data-ws="stop">' + icon('stop') + 'Stop</button></div>' +
    '<div class="meter"><i id="wk-busy-bar" style="width:' + Math.round(b.pct) + '%"></i></div><p class="fine">Symphony is writing it. It takes about a minute.</p>' +
    '<div class="wk-ghost" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>';
}
function emptyHTML() {
  return '<div class="wk-empty"><div class="wk-empty-art" aria-hidden="true"><svg viewBox="0 0 160 120"><defs><linearGradient id="wse-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B84FF"/><stop offset="1" stop-color="#38B2AC"/></linearGradient></defs>' +
    '<rect x="40" y="10" width="80" height="100" rx="8" fill="#FFFFFF" stroke="#C9D1DC" stroke-width="2" transform="rotate(-6 80 60)"/><rect x="44" y="12" width="80" height="100" rx="8" fill="#FFFFFF" stroke="#C9D1DC" stroke-width="2"/>' +
    '<rect x="56" y="26" width="44" height="8" rx="4" fill="url(#wse-g)"/><rect x="56" y="44" width="56" height="5" rx="2.5" fill="#D9DEE8"/><rect x="56" y="56" width="50" height="5" rx="2.5" fill="#D9DEE8"/><rect x="56" y="68" width="56" height="5" rx="2.5" fill="#D9DEE8"/><rect x="56" y="82" width="20" height="14" rx="3" fill="none" stroke="#5B52E6" stroke-width="2"/><rect x="84" y="82" width="20" height="14" rx="3" fill="none" stroke="#5B52E6" stroke-width="2"/></svg></div>' +
    '<b>Your new worksheet appears here</b><span>' + (S.tab === 'sample' ? 'Upload a sample on the left, then press Make my worksheet.' : S.tab === 'lesson' ? 'Choose a lesson on the left, then press Make my worksheet.' : 'Type a topic on the left, then press Make my worksheet.') + '</span></div>';
}
function mineHTML() {
  const list = listAll().filter((it) => it.k === 'sheet').slice(0, 40);
  return '<div class="wk-rhead"><h2 class="wk-h2">Your worksheets</h2><span class="fine">Also in My subjects</span></div>' +
    (!list.length ? '<p class="fine">Worksheets you make are saved here by themselves.</p>' :
      '<ul class="wk-minelist">' + list.map((it) => '<li style="--c:' + subjectColor(it.subject) + '"' + (it.key === S.key ? ' class="on"' : '') + '><button type="button" class="wk-open" data-ws="open" data-key="' + esc(it.key) + '"><b>' + esc(it.title) + '</b><small>' + esc(subjectName(it.subject, true) + (it.year ? ' · ' + it.year : '') + ' · ' + (it.n || 0) + ' questions · ' + dayLabel(it.at)) + '</small></button>' +
        (S.del === it.key ? '<span class="wk-delq">Delete it?<button type="button" class="btn small" data-ws="del-yes" data-key="' + esc(it.key) + '">Yes, delete</button><button type="button" class="btn small" data-ws="del-no">Keep it</button></span>'
          : '<button type="button" class="btn small icon" data-ws="del" data-key="' + esc(it.key) + '" aria-label="Delete ' + esc(it.title) + '">' + icon('trash') + '</button>') + '</li>').join('') + '</ul>');
}

/* ---------------- painting ---------------- */
const part = (id) => (S.view ? $('#' + id, S.view) : null);
function paintHead() { if (!S.view) return; $$('[data-ws-tab]', S.view).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.wsTab === S.tab))); }
function paintLeft() {
  const el = part('wk-left'); if (!el) return;
  el.innerHTML = leftHTML();
  const go = $('#wk-go', el);
  if (go) watch(go, { name: 'sheet:make', label: 'Make my worksheet', icon: SPARK, fine: $('#wk-fine', el), idle: 'Takes about a minute. After each one this button rests for ' + LIMITS.restMin + ' minutes.', busy: () => !!S.busy });
}
function paintRight() {
  const el = part('wk-right'); if (!el) return;
  el.innerHTML = S.busy ? busyHTML() : S.sheet ? resultHTML() : emptyHTML();
  const again = $('#wk-again', el);
  if (again) watch(again, { name: 'sheet:make', label: 'Another version', icon: AGAIN, fine: $('#wk-again-fine', el), idle: '', busy: () => !!S.busy });
}
function paintBusy() {
  const l = part('wk-busy-l'), b = part('wk-busy-bar');
  if (!l || !b || !S.busy) { paintRight(); return; }
  l.textContent = S.busy.label; b.style.width = Math.round(S.busy.pct) + '%';
}
function paintMine() { const el = part('wk-mine'); if (el) el.innerHTML = mineHTML(); }
function paint() { paintHead(); paintLeft(); paintRight(); paintMine(); }
function notice(msg, err) {
  S.notice = msg || ''; S.noticeErr = !!err;
  const n = part('wk-notice');
  if (n) { n.textContent = S.notice; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !S.notice; }
  else if (msg) toast(msg);
}

/* ---------------- samples ---------------- */
async function takeFile(file) {
  if (!file || S.sampleBusy) return;
  S.sampleBusy = true; notice(''); paintLeft();
  try {
    S.sample = await readSample(file);
    S.sampleQs = [];
    sfx('pop');
  } catch (e) { S.sample = null; notice(sampleError(e), true); }
  finally { S.sampleBusy = false; paintLeft(); }
}

/* ---------------- making ---------------- */
function qAt(f) { const secs = sectionsFor(S.sheet, f.level); return secs[f.si] && secs[f.si].questions[f.qi]; }
const nameOf = (id) => (id ? subjectName(id) : '');
async function make(kind, btn, ev) {
  if (S.busy) return;
  if (ev && btn && !deliberate(ev, btn)) return;
  notice('');
  const i = S.input, old = S.sheet;
  const levels = { support: i.support, challenge: i.challenge };
  let content, from = kind, topic = '', year = '', subject = '';
  if (kind === 'sample') {
    if (!S.sample) { notice('Upload your sample first: a photo, a PDF or a Word file, or paste its text.', true); return; }
    year = i.sYear; subject = i.sSubject;
    content = contentFor(S.sample).concat([{ type: 'text', text: sampleRequest({ diff: i.diff, levels, year, subject: nameOf(subject) }) }]);
  } else if (kind === 'topic') {
    topic = str(i.topic);
    if (!topic) { notice('Type a topic first, for example “Equivalent fractions”.', true); const t = part('wk-topic'); if (t) t.focus(); return; }
    year = i.year; subject = i.subject;
    content = [{ type: 'text', text: topicRequest({ topic, year, subject: nameOf(subject), count: i.count, types: i.types, levels, note: i.note }) }];
  } else if (kind === 'lesson') {
    if (!S.lessonKey) { notice('Choose a lesson or a quiz first.', true); return; }
    const meta = findItem(S.lessonKey), item = await getItem(S.lessonKey);
    if (!meta || !item) { notice('That lesson is not on this device any more. Choose another one.', true); S.lessonKey = ''; paintLeft(); return; }
    topic = meta.topic || meta.title; year = meta.year; subject = meta.subject;
    content = [{ type: 'text', text: lessonRequest({ lesson: lessonText(item.data || item), year, subject: nameOf(subject), count: i.count, levels }) }];
  } else if (kind === 'again') {
    if (!old) return;
    from = old.from === 'quiz' ? 'topic' : old.from; topic = old.topic; year = old.year; subject = old.subject;
    content = S.sample && old.from === 'sample'
      ? contentFor(S.sample).concat([{ type: 'text', text: sampleRequest({ diff: i.diff, levels, year, subject: nameOf(subject), note: 'Also make it different from this version they already have: ' + questionsOf(old.sections).map((q) => q.q).join(' | ').slice(0, 1500) }) }])
      : [{ type: 'text', text: againRequest(old, { levels, diff: i.diff, year, subject: nameOf(subject) }) }];
  } else return;
  const g = makeState('sheet:make');
  if (!g.ok) { repaint(); notice(waitText(g)); return; }
  if (!hasKey()) { notice(errorCopy('no_key'), true); bus.emit('need-key'); return; }
  saveForm();
  const ctl = new AbortController(), ticket = makeStart('sheet:make'), t0 = Date.now();
  const expect = (kind === 'sample' || (kind === 'again' && from === 'sample') ? 7000 : 5000) * (levels.support || levels.challenge ? 2 : 1);
  let outcome = 'error', ended = false;
  const finish = (o) => { if (!ended) { ended = true; makeEnd(ticket, o); } };
  S.busy = { ctl, kind, label: kind === 'sample' ? 'Reading your sample…' : 'Planning the questions…', pct: 4 };
  paintRight(); paintLeft();
  if (window.innerWidth < 1100) { const r = part('wk-right'); if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  sfx('send');
  try {
    const r = await askClaude('', {
      system: SHEET_SYSTEM, messages: [{ role: 'user', content }], model: CONFIG.mainModel, maxTokens: 14000, signal: ctl.signal,
      onText: (text) => {
        if (!S.busy) return;
        let label = S.busy.label;
        if (text.indexOf('"sample"') >= 0) label = 'Reading the sample’s questions…';
        if (text.indexOf('"sheet"') >= 0) label = 'Writing new questions…';
        if (text.indexOf('"levels"') >= 0 && (levels.support || levels.challenge)) label = 'Making the Support and Challenge levels…';
        if (text.indexOf('"differences"') >= 0) label = 'Checking the answers…';
        S.busy.label = label; S.busy.pct = Math.min(96, 6 + (text.length / expect) * 90);
        paintBusy();
      }
    });
    if (r.stop === 'max_tokens') throw new AiError('truncated');
    const raw = houseFix(parseJSON(r.text));
    const sheet = normSheet(raw, { topic, year: yearOf(year), subject, from });
    if (!sheet) throw new AiError('invalid_json');
    if (sheet.error) {
      notice(sheet.error === 'not_a_worksheet' ? 'That does not look like a worksheet. Upload a photo or a file of the worksheet itself.' : 'Symphony could not read that sample clearly. Try a sharper photo taken straight on, or a PDF.', true);
      return;
    }
    sheet.subject = subjectOf(subject) || subjectOf(sheet.found.subject) || (old && kind === 'again' ? old.subject : '') || 'general';
    sheet.year = yearOf(year) || yearOf(sheet.found.year) || (old && kind === 'again' ? old.year : '') || '';
    if (!sheet.topic) sheet.topic = sheet.title;
    if (kind === 'sample') S.sampleQs = sheet.sample;
    const avoid = kind === 'again' ? S.sampleQs.concat(questionsOf(old.sections).map((q) => q.q)) : (kind === 'sample' ? S.sampleQs : []);
    delete sheet.sample;
    S.sheet = sheet; S.level = 'core'; S.again = kind === 'again'; S.key = ''; S.newFolder = false;
    S.flagged = copyCheck(sheet, avoid);
    outcome = 'ok';
    finish('ok');               // the Make is done; the rewrite below is a small edit of its own
    if (S.flagged.length) { S.busy.label = 'Rewriting the questions that came out too close…'; S.busy.pct = 97; paintBusy(); await fixFlagged(avoid, ctl.signal); }
    S.issues = answerIssues(sheet);
    S.key = await putItem('sheet', { title: sheet.title, topic: sheet.topic, subject: sheet.subject, year: sheet.year, n: questionsOf(sheet.sections).length, unit: 'questions', data: sheet });
    track('gen', { eng: 'worksheet', title: sheet.title, year: sheet.year, ok: 1, ms: Date.now() - t0 });
    try { history.replaceState(null, '', '#/worksheet/' + encodeURIComponent(S.key.slice(6))); } catch (e) { /* the address stays */ }
    sfx('success');
    toast(S.flagged.length ? 'Ready. ' + S.flagged.length + ' question' + (S.flagged.length === 1 ? ' is' : 's are') + ' marked for you to check.' : 'Your worksheet is ready, and saved in My subjects.');
  } catch (e) {
    const code = e && e.code;
    if (code === 'cancelled') { outcome = 'stopped'; notice('Stopped. Change anything you like and press Make my worksheet again.'); }
    else {
      sfx('error');
      track('gen', { eng: 'worksheet', title: topic || (S.sample && S.sample.name) || '', year: year || '', ok: 0, err: code || 'error', ms: Date.now() - t0 });
      notice(errorCopy(code, 'the worksheet'), true);
      if (code === 'no_key') bus.emit('need-key');
    }
  } finally {
    S.busy = null;
    finish(outcome);
    paint();
  }
}
/* Only the questions that came out too close are rewritten (one small edit); any still too close stay marked. */
async function fixFlagged(avoid, signal) {
  const st = editState();
  if (!st.ok) return;
  const t = editStart();
  let ok = false;
  try {
    const items = S.flagged.map((f, k) => { const q = qAt(f); return { id: 'q' + k, q: q.q, type: q.type, opts: q.opts, match: q.match, answer: q.answer }; });
    const r = await askClaude(fixRequest(items, avoid), { system: SHEET_SYSTEM, model: CONFIG.mainModel, maxTokens: 4000, signal });
    const raw = houseFix(parseJSON(r.text));
    arr(raw && raw.questions).forEach((nq) => {
      const k = Number(String(nq && nq.id || '').replace(/^q/, '')), f = S.flagged[k];
      if (!f || !Number.isInteger(k)) return;
      const q = qAt(f);
      if (!q) return;
      const fixed = normQuestion(Object.assign({}, q, nq, { type: q.type, n: q.n, marks: q.marks }), 0);
      if (fixed && fixed.type === q.type) Object.assign(q, fixed, { n: q.n });
    });
    ok = true;
  } catch (e) { ok = false; /* stopped or failed: the questions stay marked for her to check */ }
  editEnd(t, ok);
  S.flagged = copyCheck(S.sheet, avoid);
}

/* ---------------- opening, prefill, saving ---------------- */
async function openSaved(id) {
  const key = 'sheet:' + id;
  if (S.key === key && S.sheet) { paint(); return; }
  const it = await getItem(key);
  if (!it || !it.data || !Array.isArray(it.data.sections)) { notice('That worksheet is not on this device.', true); return; }
  S.sheet = Object.assign({}, it.data, { subject: it.subject, year: it.year, title: it.data.title || it.title });
  S.key = key; S.level = 'core'; S.flagged = []; S.again = false; S.newFolder = false; S.sampleQs = [];
  S.issues = answerIssues(S.sheet);
  paint();
}
async function prefill(pre) {
  if (pre.from && /^quiz:/.test(pre.from)) {
    const it = await getItem(pre.from);
    if (it && it.data) {
      const sh = quizToSheet(Object.assign({}, it.data, { title: it.data.title || it.title, subject: it.subject, year: it.year, topic: it.topic }));
      if (questionsOf(sh.sections).length) {
        S.sheet = sh; S.level = 'core'; S.flagged = []; S.again = false; S.sampleQs = []; S.issues = answerIssues(sh);
        S.key = await putItem('sheet', { title: sh.title, topic: sh.topic, subject: sh.subject, year: sh.year, n: questionsOf(sh.sections).length, unit: 'questions', data: sh });
        try { history.replaceState(null, '', '#/worksheet/' + encodeURIComponent(S.key.slice(6))); } catch (e) { /* fine */ }
        paint(); toast('Your quiz is now a worksheet, saved in My subjects.');
        return;
      }
    }
  }
  S.tab = 'topic';
  if (pre.topic) S.input.topic = str(pre.topic).slice(0, 160);
  if (yearOf(pre.year) && yearOf(pre.year) !== 'KS2') S.input.year = yearOf(pre.year);
  if (subjectOf(pre.subject)) S.input.subject = subjectOf(pre.subject);
  paint();
}
/* A quiz becomes a worksheet (multiple choice with tick boxes, true or false, written answers), with its answers. */
export function quizToSheet(quiz) {
  const sh = toSheet(quiz);
  sh.subject = subjectOf(quiz && quiz.subject) || 'general';
  sh.year = yearOf(quiz && quiz.year) || '';
  return sh;
}
async function deliver(blob, name) {
  const type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const file = typeof File === 'function' ? new File([blob], name, { type }) : null;
  if (file && navigator.canShare && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'downloaded';
}
const forFile = () => Object.assign({}, S.sheet, { subjectName: subjectName(S.sheet.subject, true) });
async function downloadWord(answers) {
  if (!S.sheet) return;
  const sh = forFile();
  const how = await deliver(answers ? answersDocx(sh) : sheetDocx(sh), fileName(sh, answers ? 'answers' : 'worksheet'));
  if (how === 'cancelled') return;
  track('copy', { eng: 'worksheet', what: answers ? 'answers-word' : 'worksheet-word' });
  toast(how === 'shared' ? 'Shared. On iPhone choose “Save to Files”.' : answers ? 'Answer sheet downloaded. It opens in Word, Google Docs and Pages.' : 'Worksheet downloaded' + (sh.levels ? ', every level on its own pages' : '') + '. It opens in Word, Google Docs and Pages.');
}
let liveMod = null;
function checkLive() {
  if (S.liveOK !== null) return;
  import('../live/tasks.js?v=3c9d4698').then((m) => { liveMod = m; S.liveOK = typeof m.sendSheetLive === 'function'; }, () => { S.liveOK = false; }).then(() => { if (S.sheet && !S.busy) paintRight(); });
}
async function sendLive() {
  if (!S.sheet) return;
  if (!liveMod) { try { liveMod = await import('../live/tasks.js?v=3c9d4698'); } catch (e) { liveMod = null; } }
  if (!liveMod || typeof liveMod.sendSheetLive !== 'function') { S.liveOK = false; paintRight(); toast('Pupils’ devices: coming soon.'); return; }
  const lv = S.level === 'answers' ? 'core' : S.level;
  const copy = Object.assign({}, S.sheet, { sections: sectionsFor(S.sheet, lv), levels: null, level: lv });
  try { await liveMod.sendSheetLive(copy, {}); } catch (e) { toast('It could not go to pupils’ devices just now. Please try again.'); }
}

/* ---------------- events (one set, on the page) ---------------- */
function wire(view) {
  view.addEventListener('click', async (e) => {
    const t = e.target;
    const tab = t.closest('[data-ws-tab]');
    if (tab) { S.tab = tab.dataset.wsTab; S.notice = ''; paintHead(); paintLeft(); if (!S.sheet && !S.busy) paintRight(); return; }
    const yr = t.closest('[data-ws-year]'); if (yr) { S.input.year = yr.dataset.wsYear; paintLeft(); return; }
    const ct = t.closest('[data-ws-count]'); if (ct) { S.input.count = Number(ct.dataset.wsCount) || 8; paintLeft(); return; }
    const ty = t.closest('[data-ws-type]');
    if (ty) { const k = ty.dataset.wsType, list = S.input.types; S.input.types = list.includes(k) ? list.filter((x) => x !== k) : list.concat([k]); ty.setAttribute('aria-pressed', String(S.input.types.includes(k))); return; }
    const tr = t.closest('[data-ws-try]'); if (tr) { S.input.topic = tr.dataset.wsTry; const inp = part('wk-topic'); if (inp) { inp.value = S.input.topic; inp.focus(); } return; }
    const lv = t.closest('[data-ws-level]'); if (lv) { S.level = lv.dataset.wsLevel; paintRight(); return; }
    const b = t.closest('[data-ws]');
    if (!b) return;
    const a = b.dataset.ws;
    if (a === 'go') make(S.tab, b, e);
    else if (a === 'again') make('again', b, e);
    else if (a === 'stop') { if (S.busy) S.busy.ctl.abort(); }
    else if (a === 'paste-open') { S.pasting = true; paintLeft(); const p = part('wk-paste'); if (p) p.focus(); }
    else if (a === 'paste-use') { const p = part('wk-paste'); try { S.sample = sampleFromText(p ? p.value : ''); S.sampleQs = []; S.pasting = false; notice(''); paintLeft(); } catch (er) { notice(sampleError(er), true); } }
    else if (a === 'sample-clear') { S.sample = null; S.sampleQs = []; S.pasting = false; paintLeft(); }
    else if (a === 'pick-lesson') { const k = await pickItem({ title: 'Choose a lesson or quiz', kinds: ['lkie', 'slides', 'quiz'] }); if (k) { S.lessonKey = k; notice(''); paintLeft(); } }
    else if (a === 'word') downloadWord(false);
    else if (a === 'answers-word') downloadWord(true);
    else if (a === 'live') sendLive();
    else if (a === 'open') { const k = b.dataset.key; if (k) { location.hash = '#/worksheet/' + encodeURIComponent(k.slice(6)); } }
    else if (a === 'del') { S.del = b.dataset.key; paintMine(); }
    else if (a === 'del-no') { S.del = ''; paintMine(); }
    else if (a === 'del-yes') {
      const k = b.dataset.key; S.del = '';
      await removeItem(k);
      if (S.key === k) { S.sheet = null; S.key = ''; S.flagged = []; S.issues = []; try { history.replaceState(null, '', '#/worksheet'); } catch (er) { /* fine */ } }
      toast('Worksheet deleted.'); paint();
    } else if (a === 'folder-add') {
      const inp = part('wk-fname'), name = str(inp && inp.value);
      if (!name) { if (inp) inp.focus(); return; }
      const it = findItem(S.key), f = addFolder(it ? it.subject : S.sheet.subject, name, it ? it.year : S.sheet.year);
      moveItem(S.key, { folder: f.id }); S.newFolder = false; toast('Moved to ' + f.name + '.'); paintRight();
    } else if (a === 'folder-cancel') { S.newFolder = false; paintRight(); }
  });
  view.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'wk-topic') S.input.topic = t.value;
    else if (t.id === 'wk-note') S.input.note = t.value;
  });
  view.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'wk-file') { const f = t.files && t.files[0]; t.value = ''; takeFile(f); }
    else if (t.id === 'wk-subject') S.input.subject = t.value;
    else if (t.id === 's-year' || t.id === 'wk-s-year') S.input.sYear = t.value;
    else if (t.id === 'wk-s-subject') S.input.sSubject = t.value;
    else if (t.name === 'wk-diff') S.input.diff = t.value === 'words' ? 'words' : 'numbers';
    else if (t.dataset.wsLv) { S.input[t.dataset.wsLv] = t.checked; saveForm(); if (S.sheet && t.dataset.wsLv === 'answers') paintRight(); }
    else if (t.id === 'wk-folder') {
      if (t.value === '__new') { S.newFolder = true; paintRight(); const n = part('wk-fname'); if (n) n.focus(); return; }
      if (S.key) { moveItem(S.key, { folder: t.value }); toast(t.value ? 'Moved to the folder.' : 'Taken out of the folder.'); paintRight(); }
    }
  });
  view.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'wk-fname') { e.preventDefault(); const b = $('[data-ws="folder-add"]', S.view); if (b) b.click(); }
  });
  ['dragenter', 'dragover'].forEach((ev) => view.addEventListener(ev, (e) => { const d = e.target.closest && e.target.closest('#wk-drop'); if (!d) return; e.preventDefault(); d.classList.add('over'); }));
  view.addEventListener('dragleave', (e) => { const d = e.target.closest && e.target.closest('#wk-drop'); if (d) d.classList.remove('over'); });
  view.addEventListener('drop', (e) => {
    const d = e.target.closest && e.target.closest('#wk-drop');
    if (!d) return;
    e.preventDefault(); d.classList.remove('over');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) takeFile(f);
  });
  onLibrary(() => { if (S.view && S.view.isConnected && !S.busy) { paintMine(); if (S.sheet) { const s = part('wk-right'); if (s && !s.contains(document.activeElement)) paintRight(); } } });
}

/* ---------------- the page contract ---------------- */
export function mount(view, sub) {
  S.view = view;
  if (!view.dataset.wsWired) { wire(view); view.dataset.wsWired = '1'; restoreForm(); }
  view.innerHTML = '<div class="wrap pg wk">' + headHTML() + '<div class="wk-grid"><section class="card wk-left" id="wk-left" aria-label="Make a worksheet"></section>' +
    '<section class="card wk-right" id="wk-right" aria-label="Your new worksheet"></section></div><section class="card wk-mine" id="wk-mine" aria-label="Your worksheets"></section></div>';
  paint();
  checkLive();
  const pre = takeMaking('sheet');
  if (pre) prefill(pre);
  else if (sub) openSaved(decodeURIComponent(sub));
  else if (S.key && S.sheet) { try { history.replaceState(null, '', '#/worksheet/' + encodeURIComponent(S.key.slice(6))); } catch (e) { /* fine */ } }
}
export function leave() { S.del = ''; S.newFolder = false; }
