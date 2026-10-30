/* My subjects (Rabinder's point 14, "folders for the subjects taught"): everything she makes is filed by itself under
   its subject and year group. Inside a subject she adds her own folders (a unit, a topic) and moves things about.
   #/subjects shows every subject; #/subjects/<id> opens one, with its years, folders and everything in it. */
import { $, $$, esc, icon, str, el, toast, YEARS } from './core.js?v=cdc164df';
import { listAll, search, counts, SUBJECT_LIST, subjectName, subjectColor, KINDS, openItem, removeItem, moveItem, folders, folderById, addFolder, renameFolder, removeFolder, renameItem, onLibrary, startMaking, dayLabel } from './library.js?v=cdc164df';
import { subjectArt } from './art/subjects.js?v=cdc164df';

const KIND_FILTERS = [['all', 'Everything'], ['lesson', 'Lessons'], ['sheet', 'Worksheets'], ['quiz', 'Quizzes'], ['game', 'Games'], ['eng', 'Starters'], ['class', 'Class summaries']];
const isLesson = (it) => it.k === 'lkie' || it.k === 'slides';
const S = { subject: '', year: '', folder: '', kind: 'all', q: '', sort: 'new', confirm: '' };
let view = null;

function kindOk(it) { return S.kind === 'all' || (S.kind === 'lesson' ? isLesson(it) : it.k === S.kind); }
function itemsHere() {
  let list = S.q ? search(S.q) : listAll();
  if (S.subject) list = list.filter((it) => it.subject === S.subject);
  if (S.year) list = list.filter((it) => it.year === S.year);
  if (S.folder) list = list.filter((it) => it.folder === S.folder);
  list = list.filter(kindOk);
  if (S.sort === 'az') list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

/* ---------------- all subjects ---------------- */
function indexHTML() {
  const c = counts(), total = Object.values(c).reduce((a, b) => a + b, 0);
  const subs = SUBJECT_LIST.slice().sort((a, b) => (c[b.id] || 0) - (c[a.id] || 0) || SUBJECT_LIST.indexOf(a) - SUBJECT_LIST.indexOf(b));
  return '<div class="pg sj">' +
    '<header class="pg-head"><p class="kicker">My subjects</p><h1>Everything you make, in one place</h1><p class="pg-sub">Each lesson, worksheet, quiz and game is filed under its subject and year by itself. Open a subject to add your own folders.</p></header>' +
    '<div class="sj-search"><label class="fld"><span>Search everything</span><input type="search" data-sj="q" value="' + esc(S.q) + '" placeholder="A topic, a title or a subject" autocomplete="off"></label></div>' +
    (S.q ? listHTML(itemsHere(), true) :
      '<div class="sj-grid">' + subs.map((s) => '<a class="sj-tile" href="#/subjects/' + s.id + '" style="--c:' + subjectColor(s.id) + '">' + subjectArt(s.id) +
        '<span><b>' + esc(s.short) + '</b><small>' + (c[s.id] ? c[s.id] + (c[s.id] === 1 ? ' thing' : ' things') : 'Nothing yet') + (folders(s.id).length ? ' · ' + folders(s.id).length + (folders(s.id).length === 1 ? ' folder' : ' folders') : '') + '</small></span></a>').join('') + '</div>' +
      '<section class="pg-sec"><div class="pg-sec-h"><h2>Made lately</h2><span class="fine">' + total + (total === 1 ? ' thing' : ' things') + ' on this device</span></div>' + listHTML(listAll().slice(0, 8), true) + '</section>') +
    '</div>';
}

/* ---------------- one subject ---------------- */
function subjectHTML() {
  const id = S.subject, all = listAll().filter((it) => it.subject === id), fs = folders(id);
  const years = YEARS.concat(['KS2']).filter((y) => all.some((it) => it.year === y));
  const f = S.folder ? folderById(S.folder) : null;
  const list = itemsHere();
  return '<div class="pg sj" style="--c:' + subjectColor(id) + '">' +
    '<nav class="sj-crumbs" aria-label="Where you are"><a href="#/subjects">My subjects</a>' + icon('right') + (f ? '<button type="button" class="linkbtn" data-sj="top">' + esc(subjectName(id, true)) + '</button>' + icon('right') + '<b>' + esc(f.name) + '</b>' : '<b>' + esc(subjectName(id, true)) + '</b>') + '</nav>' +
    '<header class="sj-banner"><div class="sj-art">' + subjectArt(id, { label: subjectName(id) }) + '</div><div class="sj-bt"><p class="kicker">' + (f ? 'Folder' : 'Subject') + '</p><h1>' + esc(f ? f.name : subjectName(id)) + '</h1>' +
      '<p class="pg-sub">' + all.length + (all.length === 1 ? ' thing' : ' things') + (fs.length ? ' · ' + fs.length + (fs.length === 1 ? ' folder' : ' folders') : '') + '</p>' +
      '<div class="pg-row">' + makeButtons(id) + '</div></div></header>' +
    '<div class="sj-bar">' +
      '<div class="seg sj-years" role="group" aria-label="Year group"><button type="button" data-year="" aria-pressed="' + !S.year + '">All years</button>' + (years.length ? years : YEARS).map((y) => '<button type="button" data-year="' + y + '" aria-pressed="' + (S.year === y) + '">' + y.replace('Year ', 'Y') + '</button>').join('') + '</div>' +
      '<label class="sj-kind"><span class="sr">Show</span><select data-sj="kind">' + KIND_FILTERS.map(([k, l]) => '<option value="' + k + '"' + (S.kind === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      '<label class="sj-kind"><span class="sr">Order</span><select data-sj="sort"><option value="new"' + (S.sort === 'new' ? ' selected' : '') + '>Newest first</option><option value="az"' + (S.sort === 'az' ? ' selected' : '') + '>A to Z</option></select></label>' +
    '</div>' +
    (f ? '' : '<section class="pg-sec" aria-labelledby="sj-f-h"><div class="pg-sec-h"><h2 id="sj-f-h">Folders</h2><button type="button" class="btn small" data-sj="newfolder">' + icon('plus') + 'New folder</button></div>' +
      (fs.length ? '<div class="sj-folders">' + fs.map((x) => { const n = all.filter((it) => it.folder === x.id).length; return '<div class="sj-folder"><button type="button" class="sj-fopen" data-folder="' + x.id + '">' + icon('folder') + '<span><b>' + esc(x.name) + '</b><small>' + n + (n === 1 ? ' thing' : ' things') + (x.y ? ' · ' + x.y : '') + '</small></span></button>' +
        '<button type="button" class="btn small icon" data-frename="' + x.id + '" aria-label="Rename ' + esc(x.name) + '">' + icon('pen') + '</button></div>'; }).join('') + '</div>'
        : '<p class="fine">Make a folder for a unit or a topic, for example “Fractions unit”, then move things into it.</p>') + '</section>') +
    (f ? '<div class="pg-row"><button type="button" class="btn small" data-frename="' + f.id + '">' + icon('pen') + 'Rename folder</button><button type="button" class="btn small" data-fremove="' + f.id + '">' + icon('trash') + (S.confirm === 'f:' + f.id ? 'Yes, remove the folder (things stay)' : 'Remove folder') + '</button></div>' : '') +
    '<section class="pg-sec" aria-labelledby="sj-i-h"><div class="pg-sec-h"><h2 id="sj-i-h">' + (f ? 'In this folder' : S.year ? S.year : 'Everything') + '</h2><span class="fine">' + list.length + (list.length === 1 ? ' thing' : ' things') + '</span></div>' +
    listHTML(list, false) + '</section></div>';
}
function makeButtons(subject) {
  return [['slides', 'Lesson', 'pack'], ['sheet', 'Worksheet', 'sheet'], ['quiz', 'Quiz', 'quiz'], ['game', 'Game', 'game']].map(([k, l, ic]) =>
    '<button type="button" class="btn small" data-make="' + k + '" data-subject="' + subject + '">' + icon(ic) + 'New ' + l.toLowerCase() + '</button>').join('');
}
function meta(it, withSubject) {
  return (withSubject ? subjectName(it.subject, true) + ' · ' : '') + (it.year ? it.year + ' · ' : '') + it.long + (it.n ? ' · ' + it.n + ' ' + (it.unit || (it.k === 'quiz' || it.k === 'sheet' ? 'questions' : 'slides')) : '') + (it.at ? ' · ' + dayLabel(it.at) : '');
}
function listHTML(list, withSubject) {
  if (!list.length) return '<div class="pg-empty"><b>Nothing here yet</b>' + (S.q ? 'Try another word.' : 'Make something and it is filed here by itself.') + '</div>';
  return '<ul class="sj-list">' + list.map((it) => {
    const f = it.folder ? folderById(it.folder) : null, del = S.confirm === it.key;
    return '<li class="sj-it" style="--c:' + subjectColor(it.subject) + '">' +
      '<button type="button" class="sj-main" data-open="' + esc(it.key) + '"><span class="sj-k" aria-hidden="true">' + icon(it.icon || KINDS[it.k].icon) + '</span>' +
      '<span class="sj-t"><b>' + esc(it.title) + '</b><small>' + esc(meta(it, withSubject)) + (f && withSubject !== 'f' ? ' · ' + esc(f.name) : '') + '</small></span></button>' +
      '<span class="sj-acts"><button type="button" class="btn small" data-move="' + esc(it.key) + '">' + icon('folder') + '<span>Move</span></button>' +
      (['sheet', 'quiz', 'game', 'class'].includes(it.k) ? '<button type="button" class="btn small icon" data-rename="' + esc(it.key) + '" aria-label="Rename ' + esc(it.title) + '">' + icon('pen') + '</button>' : '') +
      '<button type="button" class="btn small' + (del ? ' sj-del' : ' icon') + '" data-del="' + esc(it.key) + '" aria-label="' + (del ? 'Yes, delete ' : 'Delete ') + esc(it.title) + '">' + icon('trash') + (del ? '<span>Delete?</span>' : '') + '</button></span></li>';
  }).join('') + '</ul>';
}

/* ---------------- small dialogs: move, new folder, rename ---------------- */
function dialog(title, bodyHTML, onOk, okLabel) {
  const wrap = el('div', 'modal sj-dlg');
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'sjd-h');
  wrap.innerHTML = '<form class="modal-card" novalidate style="position:relative"><button type="button" class="btn small icon modal-x" data-x aria-label="Close">' + icon('close') + '</button>' +
    '<h2 id="sjd-h"><i>' + icon('folder') + '</i>' + esc(title) + '</h2>' + bodyHTML +
    '<div class="pg-row"><button type="submit" class="btn primary">' + esc(okLabel || 'Done') + '</button><button type="button" class="btn" data-x>Cancel</button></div></form>';
  document.body.appendChild(wrap);
  const last = document.activeElement;
  const close = () => { wrap.remove(); if (last && last.focus) last.focus(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-x]')) close(); });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  $('form', wrap).addEventListener('submit', (e) => { e.preventDefault(); if (onOk($('form', wrap)) !== false) close(); });
  setTimeout(() => { const f = $('input, select', wrap); if (f) f.focus(); }, 30);
  return wrap;
}
function moveDialog(key) {
  const it = listAll().find((x) => x.key === key);
  if (!it) return;
  const fopts = (s) => '<option value="">No folder</option>' + folders(s).map((f) => '<option value="' + f.id + '"' + (f.id === it.folder ? ' selected' : '') + '>' + esc(f.name) + '</option>').join('') + '<option value="__new">New folder…</option>';
  const w = dialog('Move “' + it.title + '”',
    '<label class="fld"><span>Subject</span><select name="subject">' + SUBJECT_LIST.map((s) => '<option value="' + s.id + '"' + (s.id === it.subject ? ' selected' : '') + '>' + esc(s.short) + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>Year</span><select name="year"><option value="">Any year</option>' + YEARS.concat(['KS2']).map((y) => '<option' + (y === it.year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>Folder</span><select name="folder">' + fopts(it.subject) + '</select></label>' +
    '<label class="fld sj-nf" hidden><span>New folder name</span><input type="text" name="nf" maxlength="60" placeholder="For example: Fractions unit"></label>',
    (form) => {
      let folder = form.folder.value;
      if (folder === '__new') { const name = str(form.nf.value); if (!name) { form.nf.focus(); return false; } folder = addFolder(form.subject.value, name, form.year.value).id; }
      moveItem(key, { subject: form.subject.value, year: form.year.value, folder });
      toast('Moved to ' + subjectName(form.subject.value, true) + (folder ? ' › ' + (folderById(folder) || {}).name : '') + '.');
    }, 'Move');
  const form = $('form', w);
  form.subject.addEventListener('change', () => { form.folder.innerHTML = fopts(form.subject.value); $('.sj-nf', w).hidden = true; });
  form.folder.addEventListener('change', () => { $('.sj-nf', w).hidden = form.folder.value !== '__new'; if (form.folder.value === '__new') form.nf.focus(); });
}
function newFolder() {
  dialog('New folder in ' + subjectName(S.subject, true),
    '<label class="fld"><span>Folder name</span><input type="text" name="name" maxlength="60" placeholder="For example: Fractions unit"></label>' +
    '<label class="fld"><span>Year (optional)</span><select name="year"><option value="">Any year</option>' + YEARS.map((y) => '<option' + (y === S.year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label>',
    (form) => { const n = str(form.name.value); if (!n) { form.name.focus(); return false; } addFolder(S.subject, n, form.year.value); toast('Folder “' + n + '” made.'); }, 'Make folder');
}
function renameDialog(kind, id) {
  const cur = kind === 'f' ? (folderById(id) || {}).name : (listAll().find((x) => x.key === id) || {}).title;
  dialog('Rename', '<label class="fld"><span>New name</span><input type="text" name="name" maxlength="' + (kind === 'f' ? 60 : 140) + '" value="' + esc(cur || '') + '"></label>',
    (form) => { const n = str(form.name.value); if (!n) { form.name.focus(); return false; } if (kind === 'f') renameFolder(id, n); else renameItem(id, n); }, 'Rename');
}

/* ---------------- the page ---------------- */
function render() {
  if (!view) return;
  const q = $('[data-sj="q"]', view), had = q && document.activeElement === q, pos = had ? q.selectionStart : 0;
  view.innerHTML = S.subject ? subjectHTML() : indexHTML();
  if (had) { const n = $('[data-sj="q"]', view); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* fine */ } } }
}
function wire() {
  view.addEventListener('click', (e) => {
    const t = e.target;
    const o = t.closest('[data-open]'); if (o) { openItem(o.dataset.open); return; }
    const y = t.closest('[data-year]'); if (y) { S.year = y.dataset.year; render(); return; }
    const fo = t.closest('[data-folder]'); if (fo) { S.folder = fo.dataset.folder; render(); window.scrollTo({ top: 0 }); return; }
    if (t.closest('[data-sj="top"]')) { S.folder = ''; render(); return; }
    if (t.closest('[data-sj="newfolder"]')) { newFolder(); return; }
    const mv = t.closest('[data-move]'); if (mv) { moveDialog(mv.dataset.move); return; }
    const rn = t.closest('[data-rename]'); if (rn) { renameDialog('i', rn.dataset.rename); return; }
    const fr = t.closest('[data-frename]'); if (fr) { renameDialog('f', fr.dataset.frename); return; }
    const fx = t.closest('[data-fremove]');
    if (fx) { const id = fx.dataset.fremove; if (S.confirm === 'f:' + id) { removeFolder(id); S.folder = ''; S.confirm = ''; toast('Folder removed. What was in it is still in the subject.'); } else { S.confirm = 'f:' + id; render(); } return; }
    const d = t.closest('[data-del]');
    if (d) {
      const key = d.dataset.del;
      if (S.confirm === key) { S.confirm = ''; removeItem(key).then(() => toast('Deleted.')); }
      else { S.confirm = key; render(); const b = $('[data-del="' + CSS.escape(key) + '"]', view); if (b) b.focus(); }
      return;
    }
    const mk = t.closest('[data-make]'); if (mk) { startMaking({ kind: mk.dataset.make, subject: mk.dataset.subject, year: S.year || '', topic: '' }); return; }
    if (S.confirm && !t.closest('[data-del],[data-fremove]')) { S.confirm = ''; render(); }
  });
  view.addEventListener('input', (e) => { if (e.target.dataset.sj === 'q') { S.q = e.target.value; render(); } });
  view.addEventListener('change', (e) => {
    if (e.target.dataset.sj === 'kind') { S.kind = e.target.value; render(); }
    if (e.target.dataset.sj === 'sort') { S.sort = e.target.value; render(); }
  });
}
export function mount(v, sub) {
  view = v;
  if (!view.dataset.wired) { wire(); view.dataset.wired = '1'; }
  const id = SUBJECT_LIST.some((s) => s.id === sub) ? sub : '';
  if (id !== S.subject) { S.subject = id; S.folder = ''; S.year = ''; S.kind = 'all'; S.confirm = ''; }
  if (!id) S.folder = '';
  render();
}
export function leave() { S.confirm = ''; }
onLibrary(() => { if (view && view.isConnected && !view.hidden) render(); });
