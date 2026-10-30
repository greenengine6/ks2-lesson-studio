/* The library: everything a teacher makes, in one place, filed by subject and year.
   - Lessons from lkie.like and Slide Studio, the ten lesson starters' activities, worksheets, quizzes and games.
   - Each one is filed by itself under its subject and year group. Teachers add their own folders inside a subject
     (a unit, a topic) and can move anything to another folder, subject or year.
   - Search looks through all of it.
   Where things live: lkie.like packs, Slide Studio lessons and the starters' activities stay where those pages keep
   them (this browser's storage). Worksheets, quizzes and games are kept in this browser's database (IndexedDB), with a
   small index here so lists draw at once. Folders and moves are kept on this device.
   Page modules use startMaking() / takeMaking() to open a maker with the topic, year and subject already filled in. */
import { $, esc, str, icon, store, bus, uid, el, num, toast } from './core.js?v=3c9d4698';
import { who } from './people.js?v=3c9d4698';
import { kvGet, kvSet, kvDel } from './idb.js?v=3c9d4698';
import { SUBJECTS, match } from './lkie/curriculum.js?v=3c9d4698';
import { ENGINE_BY_ID } from './engines/registry.js?v=3c9d4698';
import { coverOfPack, unpin, OPEN_KEY } from './shelf.js?v=3c9d4698';
import { forgetUploads, safePic } from './pics.js?v=3c9d4698';

const PACKS = 'ks2-engine.lkie.packs.v1', DECKS = 'ks2-lesson-studio.recent.v1', SAVED = 'ks2-engine.saved.v1';
const INDEX = 'ks2-engine.lib.v1', FOLDERS = 'ks2-engine.lib.folders.v1', PLACE = 'ks2-engine.lib.place.v1', MAKE = 'ks2-engine.make.v1';
export const ENG_OPEN = 'ks2-engine.eng.open';
const NEW_KINDS = new Set(['sheet', 'quiz', 'game', 'class']);
const arrOf = (v) => (Array.isArray(v) ? v : []);

/* ---------------- kinds ---------------- */
export const KINDS = {
  lkie: { name: 'Lesson', long: 'Lesson slides', icon: 'pack', route: '#/lkie' },
  slides: { name: 'Lesson', long: 'Two-way slides', icon: 'slides', route: '#/slides' },
  eng: { name: 'Activity', long: 'Lesson starter', icon: 'spark', route: '' },
  sheet: { name: 'Worksheet', long: 'Worksheet', icon: 'sheet', route: '#/worksheet' },
  quiz: { name: 'Quiz', long: 'Quiz', icon: 'quiz', route: '#/quiz' },
  game: { name: 'Game', long: 'Game', icon: 'game', route: '#/game' },
  class: { name: 'Class', long: 'Class summary', icon: 'users', route: '#/class' }
};
/* Parts of the site that are still being added (shown as "Soon", with no buttons into them). Empty when all is in. */
export const SOON = new Set();
export const soon = (id) => SOON.has(id);
/* Where each maker lives, for startMaking(). */
const MAKERS = { slides: '#/lkie', studio: '#/slides', sheet: '#/worksheet', quiz: '#/quiz', game: '#/game' };

/* ---------------- subjects ---------------- */
const SHORT = { computing: 'Computing', art: 'Art', dt: 'Design and technology', pe: 'PE', pshe: 'PSHE', re: 'RE', bm: 'Bahasa Melayu' };
export const SUBJECT_LIST = SUBJECTS.map((s) => ({ id: s.id, name: s.name, short: SHORT[s.id] || s.name, group: s.group }))
  .concat([{ id: 'general', name: 'Across subjects', short: 'Across subjects', group: 'Other' }]);
const SUBJECT_IDS = new Set(SUBJECT_LIST.map((s) => s.id));
const ALIAS = {
  maths: 'maths', math: 'maths', mathematics: 'maths', numeracy: 'maths', english: 'english', reading: 'english', writing: 'english', spelling: 'english', grammar: 'english', phonics: 'english', literacy: 'english',
  science: 'science', computing: 'computing', 'computing (ict)': 'computing', ict: 'computing', coding: 'computing', history: 'history', geography: 'geography',
  art: 'art', 'art and design': 'art', 'design and technology': 'dt', dt: 'dt', 'd&t': 'dt', music: 'music', pe: 'pe', 'physical education': 'pe', sport: 'pe',
  pshe: 'pshe', 'pshe and rshe': 'pshe', rshe: 'pshe', wellbeing: 'pshe', re: 're', 'religious education': 're', 'bahasa melayu': 'bm', bm: 'bm', malay: 'bm', 'bahasa malaysia': 'bm',
  mandarin: 'mandarin', chinese: 'mandarin', french: 'french', spanish: 'spanish', general: 'general', 'across subjects': 'general'
};
/* A subject's id from its id, name or a common way of saying it ('' if it is not a KS2 subject). */
export function subjectOf(v) {
  const t = str(v).toLowerCase().replace(/\s+/g, ' ');
  if (!t) return '';
  if (SUBJECT_IDS.has(t)) return t;
  if (ALIAS[t]) return ALIAS[t];
  const head = t.split(/[:,\-–(]/)[0].trim();
  return ALIAS[head] || SUBJECT_IDS.has(head) && head || '';
}
const LANG = { french: /\bfrench\b|\bfran[cç]ais/, mandarin: /\bmandarin\b|\bchinese\b|普通话|中文|华语/, bm: /\bbahasa\b|\bmalay\b|\bmelayu\b/, spanish: /\bspanish\b|\bespa[nñ]ol/ };
/* The subject a topic most likely belongs to, from the KS2 curriculum: "Volcanoes" is Geography, "Equivalent
   fractions" Maths, "Colours in French" French. '' when it is not clear, so the teacher's own choice stands. */
export function guessSubject(topic, year) {
  const t = str(topic).trim(), low = t.toLowerCase();
  if (t.length < 3) return '';
  const direct = subjectOf(t);
  if (direct) return direct;
  for (const id of Object.keys(LANG)) if (SUBJECT_IDS.has(id) && LANG[id].test(low)) return id;
  const sc = [];
  SUBJECTS.forEach((s, i) => {
    if (LANG[s.id]) return;
    let top = [];
    try { top = match(s.id, year || '', t, 1); } catch (e) { top = []; }
    const v = top.length ? Number(top[0].score) || 0 : 0;
    if (v > 0) sc.push({ id: s.id, v, i });
  });
  sc.sort((a, b) => b.v - a.v || a.i - b.i);
  if (!sc.length) return '';
  const [a, b] = sc;
  if (!b) return a.v >= 2.5 ? a.id : '';
  return a.v >= 3.4 && a.v - b.v >= 1 ? a.id : '';
}
export const subjectName = (id, short) => { const s = SUBJECT_LIST.find((x) => x.id === id); return s ? (short ? s.short : s.name) : 'Across subjects'; };
export const subjectColor = (id) => 'var(--s-' + (SUBJECT_IDS.has(id) ? id : 'general') + ')';
export function yearOf(v) {
  const t = str(v);
  const m = /([3-6])/.exec(t);
  if (/3\s*(to|-|–)\s*6|ks2|whole/i.test(t)) return 'KS2';
  return m ? 'Year ' + m[1] : '';
}
/* The lesson starters: the subject each one belongs to (Escape Room and Step-by-Step read it from the topic). */
const ENG_SUBJECT = { maths: 'maths', story: 'english', reading: 'english', science: 'science', sound: 'geography', code: 'computing', break: 'pshe', debate: 'pshe', escape: '', steps: '' };
function topicOfInput(input) {
  if (!input || typeof input !== 'object') return '';
  return str(input.topic || input.task || input.story || input.place || input.theme || input.focus || '');
}
function engSubject(eid, input) {
  if (ENG_SUBJECT[eid]) return ENG_SUBJECT[eid];
  const t = topicOfInput(input);
  return subjectOf(t) || guessSubject(t) || 'general';
}

/* ---------------- per-teacher storage ---------------- */
export const mineKey = (k) => k + '.' + (who.id || 'me');

/* ---------------- folders and moves ---------------- */
function places() { const v = store.getJSON(PLACE, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
export function folders(subject) { return arrOf(store.getJSON(FOLDERS, [])).filter((f) => f && f.id && f.name && (!subject || f.s === subject)); }
export function folderById(id) { return folders().find((f) => f.id === id) || null; }
export function addFolder(subject, name, year) {
  const f = { id: uid('f'), s: subjectOf(subject) || 'general', name: str(name).slice(0, 60) || 'New folder', y: yearOf(year), at: Date.now() };
  store.setJSON(FOLDERS, folders().concat([f]));
  changed({ op: 'folder', id: f.id });
  return f;
}
export function renameFolder(id, name) {
  const list = folders(), f = list.find((x) => x.id === id);
  if (!f) return;
  f.name = str(name).slice(0, 60) || f.name;
  store.setJSON(FOLDERS, list); changed({ op: 'folder', id });
}
/* Removing a folder keeps what was in it: those things go back to the subject itself. */
export function removeFolder(id) {
  store.setJSON(FOLDERS, folders().filter((f) => f.id !== id));
  const p = places(); Object.keys(p).forEach((k) => { if (p[k] && p[k].f === id) delete p[k].f; });
  store.setJSON(PLACE, p); changed({ op: 'folder', id });
}
export const placeOf = (key) => places()[key] || {};
/* Move something: { folder: id or '', subject: id, year: 'Year 4' or 'KS2' } (any of them). */
export function moveItem(key, to) {
  const p = places(), cur = Object.assign({}, p[key] || {});
  if (to.subject != null) { const s = subjectOf(to.subject) || 'general'; cur.s = s; if (cur.f) { const f = folderById(cur.f); if (f && f.s !== s) delete cur.f; } }
  if (to.year != null) cur.y = yearOf(to.year);
  if (to.folder != null) { if (to.folder) { const f = folderById(to.folder); if (f) { cur.f = f.id; cur.s = f.s; } } else delete cur.f; }
  p[key] = cur; store.setJSON(PLACE, p); changed({ op: 'move', key });
}

/* ---------------- everything, as one list ---------------- */
function norm(m) {
  const key = m.k + ':' + m.id, pl = places()[key] || {};
  const subject = pl.s || m.subject || 'general', year = pl.y != null ? pl.y : (m.year || '');
  const f = pl.f && folderById(pl.f);
  return Object.assign({}, m, { key, subject: SUBJECT_IDS.has(subject) ? subject : 'general', year: yearOf(year) || '', folder: f ? f.id : '', kind: KINDS[m.k].name, long: KINDS[m.k].long, at: num(m.at, 0) });
}
export function listAll() {
  const out = [];
  arrOf(store.getJSON(PACKS, [])).forEach((p) => {
    if (!p || !p.id || !Array.isArray(p.slides) || !p.input) return;
    out.push(norm({ k: 'lkie', id: String(p.id), title: str(p.title) || str(p.input.topic) || 'Lesson', topic: str(p.input.topic) || str(p.title), subject: subjectOf(p.input.subjectName || p.input.subject) || 'general', year: p.input.year, at: p.at, n: p.slides.length, unit: 'slides', cover: coverOfPack(p) }));
  });
  arrOf(store.getJSON(DECKS, [])).forEach((r) => {
    if (!r || !r.id || !r.deck) return;
    out.push(norm({ k: 'slides', id: String(r.id), title: str(r.deck.title) || 'Lesson', topic: str(r.deck.title), subject: subjectOf(r.deck.subject) || 'general', year: r.deck.year, at: r.at, n: arrOf(r.deck.slides).length, unit: 'slides', cover: null }));
  });
  const saved = store.getJSON(SAVED, {});
  if (saved && typeof saved === 'object') Object.keys(saved).forEach((eid) => {
    const eng = ENGINE_BY_ID[eid];
    if (!eng) return;
    arrOf(saved[eid]).forEach((x) => {
      if (!x || !x.id || !x.data) return;
      let title = '';
      try { title = str(eng.title(x.data)); } catch (e) { title = ''; }
      out.push(norm({ k: 'eng', id: eid + ':' + x.id, eng: eid, engName: eng.name, icon: eng.icon, title: title || eng.name, topic: topicOfInput(x.input), subject: engSubject(eid, x.input), year: x.input && x.input.year, at: x.at, n: 0, cover: null }));
    });
  });
  arrOf(store.getJSON(INDEX, [])).forEach((m) => { if (m && NEW_KINDS.has(m.k) && m.id) out.push(norm(m)); });
  return out.sort((a, b) => b.at - a.at);
}
export function counts() {
  const c = {};
  listAll().forEach((it) => { c[it.subject] = (c[it.subject] || 0) + 1; });
  return c;
}
/* Words in the title, topic, subject or kind, all of them. */
export function search(q, list) {
  const words = str(q).toLowerCase().split(/\s+/).filter(Boolean);
  const all = list || listAll();
  if (!words.length) return all;
  return all.filter((it) => {
    const hay = (it.title + ' ' + it.topic + ' ' + subjectName(it.subject) + ' ' + it.kind + ' ' + it.long + ' ' + (it.engName || '') + ' ' + it.year).toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
export const findItem = (key) => listAll().find((it) => it.key === key) || null;

/* ---------------- worksheets, quizzes and games ---------------- */
const parseKey = (key) => { const s = String(key || ''), i = s.indexOf(':'); return i < 0 ? { k: '', id: '' } : { k: s.slice(0, i), id: s.slice(i + 1) }; };
/* Save (or update) a worksheet, quiz or game. item: { id?, title, topic?, subject, year, n?, unit?, cover?, folder?, data }.
   Returns its key ('quiz:…'). */
export async function putItem(k, item) {
  if (!NEW_KINDS.has(k)) throw new Error('kind');
  const id = str(item.id) || uid(k);
  const list = arrOf(store.getJSON(INDEX, [])), old = list.find((m) => m.k === k && m.id === id);
  const meta = {
    k, id, title: str(item.title).slice(0, 140) || KINDS[k].name, topic: str(item.topic).slice(0, 140), subject: subjectOf(item.subject) || 'general', year: yearOf(item.year),
    at: Date.now(), made: old ? old.made || old.at : Date.now(), n: num(item.n, 0), unit: str(item.unit).slice(0, 20), by: str(who.name).slice(0, 60), cover: safePic(item.cover) || null
  };
  await kvSet('lib:' + k + ':' + id, { meta, data: item.data == null ? null : item.data });
  store.setJSON(INDEX, [meta].concat(list.filter((m) => !(m.k === k && m.id === id))).slice(0, 600));
  if (item.folder) moveItem(k + ':' + id, { folder: item.folder });
  changed({ op: 'put', key: k + ':' + id });
  if (k !== 'class') attachMade(k + ':' + id, meta.topic || meta.title);
  return k + ':' + id;
}
/* The whole thing. Worksheets, quizzes and games: { id, k, title, …, data }. Others: what their page keeps. */
export async function getItem(key) {
  const { k, id } = parseKey(key);
  if (NEW_KINDS.has(k)) {
    const v = await kvGet('lib:' + k + ':' + id);
    return v && v.meta ? Object.assign({}, v.meta, { data: v.data }) : null;
  }
  if (k === 'lkie') return arrOf(store.getJSON(PACKS, [])).find((p) => p && String(p.id) === id) || null;
  if (k === 'slides') return arrOf(store.getJSON(DECKS, [])).find((r) => r && String(r.id) === id) || null;
  if (k === 'eng') { const [eid, ...rest] = id.split(':'); const saved = store.getJSON(SAVED, {}); return arrOf(saved && saved[eid]).find((x) => x && x.id === rest.join(':')) || null; }
  return null;
}
function picsIn(p) {
  const ids = [], add = (pic) => { if (pic && pic.up) ids.push(pic.up); };
  arrOf(p && p.slides).forEach((s) => { add(s && s.pic); if (s && s.look && s.look.pic) add(s.look.pic); });
  if (p && p.look && p.look.pic) add(p.look.pic);
  return ids;
}
export async function removeItem(key) {
  const { k, id } = parseKey(key);
  if (NEW_KINDS.has(k)) {
    await kvDel('lib:' + k + ':' + id);
    store.setJSON(INDEX, arrOf(store.getJSON(INDEX, [])).filter((m) => !(m.k === k && m.id === id)));
  } else if (k === 'lkie') {
    const all = arrOf(store.getJSON(PACKS, [])), gone = all.find((p) => p && String(p.id) === id), rest = all.filter((p) => !(p && String(p.id) === id));
    store.setJSON(PACKS, rest); unpin('lkie', id);
    if (gone) { const keep = new Set(rest.flatMap(picsIn)); forgetUploads(picsIn(gone).filter((u) => !keep.has(u))); }
  } else if (k === 'slides') {
    store.setJSON(DECKS, arrOf(store.getJSON(DECKS, [])).filter((r) => !(r && String(r.id) === id))); unpin('slides', id);
  } else if (k === 'eng') {
    const [eid, ...rest] = id.split(':'), iid = rest.join(':'), saved = store.getJSON(SAVED, {});
    if (saved && Array.isArray(saved[eid])) { saved[eid] = saved[eid].filter((x) => !(x && x.id === iid)); store.setJSON(SAVED, saved); }
  } else return;
  const p = places(); if (p[key]) { delete p[key]; store.setJSON(PLACE, p); }
  changed({ op: 'remove', key });
  bus.emit('shelf');
}
/* Rename a worksheet, quiz or game (lessons are renamed on their own page). */
export async function renameItem(key, title) {
  const { k } = parseKey(key);
  if (!NEW_KINDS.has(k)) return false;
  const it = await getItem(key);
  if (!it) return false;
  await putItem(k, Object.assign({}, it, { title, folder: '' }));
  return true;
}

/* ---------------- opening ---------------- */
/* openItem(key, { present: true }) also asks the lesson's page to start presenting as soon as it is open (the
   Classroom's lesson flow): a one-time note for that one item, which lkie, Slide Studio and the starters take with
   takePresent(key) (they read the same sessionStorage name, so they need no import). */
export const PRESENT_ONCE = 'ks2-engine.present.once';
export function takePresent(key) {
  try {
    const v = JSON.parse(sessionStorage.getItem(PRESENT_ONCE) || 'null');
    if (v && v.key === key && Date.now() - (v.at || 0) < 60000) { sessionStorage.removeItem(PRESENT_ONCE); return true; }
  } catch (e) { /* nothing waiting */ }
  return false;
}
export function openItem(key, o) {
  const { k, id } = parseKey(key);
  const ss = (name, v) => { try { sessionStorage.setItem(name, v); } catch (e) { /* the page opens its latest instead */ } };
  if (o && o.present && ['lkie', 'slides', 'eng'].includes(k)) ss(PRESENT_ONCE, JSON.stringify({ key: String(key), at: Date.now() }));
  if (k === 'lkie' || k === 'slides') { ss(OPEN_KEY[k], id); go(KINDS[k].route); return; }
  if (k === 'eng') { const [eid, ...rest] = id.split(':'); ss(ENG_OPEN, rest.join(':')); go('#/' + eid); return; }
  if (NEW_KINDS.has(k)) go(KINDS[k].route + '/' + encodeURIComponent(id));
}
function go(hash) {
  if (location.hash === hash) { window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
  location.hash = hash;
}
/* Open a maker with things filled in: { kind: 'slides' | 'studio' | 'sheet' | 'quiz' | 'game', topic, year, subject, slot, from }. */
export function startMaking(o) {
  if (!o || !MAKERS[o.kind]) return;
  try { sessionStorage.setItem(MAKE, JSON.stringify(Object.assign({ at: Date.now() }, o))); } catch (e) { /* the maker opens empty */ }
  // made for a lesson in the calendar (Today's "Make it", the lesson's Make): what gets made is attached to that lesson
  const sl = slotOf(o);
  try { if (sl) sessionStorage.setItem(ATTACH, JSON.stringify({ k: MADE_AS[o.kind], date: sl.date, slotId: sl.slotId, at: Date.now() - 1000 })); else sessionStorage.removeItem(ATTACH); } catch (e) { /* not attached */ }
  go(MAKERS[o.kind]);
}
const ATTACH = 'ks2-engine.make.attach.v1', MADE_AS = { slides: 'lkie', studio: 'slides', sheet: 'sheet', quiz: 'quiz', game: 'game' };
function slotOf(o) {
  if (o.slot && typeof o.slot === 'object' && o.slot.date && o.slot.slotId) return { date: String(o.slot.date), slotId: String(o.slot.slotId) };
  if (o.slot && typeof o.slot === 'string' && o.date) return { date: String(o.date), slotId: o.slot };
  return null;
}
function pendingAttach() { try { const a = JSON.parse(sessionStorage.getItem(ATTACH) || 'null'); return a && Date.now() - (a.at || 0) < 3 * 3600000 ? a : null; } catch (e) { return null; } }
function attachMade(key, topic) {
  const a = pendingAttach();
  if (!a || a.k !== parseKey(key).k) return;
  try { sessionStorage.removeItem(ATTACH); } catch (e) { /* once */ }
  import('./calendar.js?v=3c9d4698').then((c) => {
    if (typeof c.planFor !== 'function' || typeof c.setPlan !== 'function') return;
    const p = c.planFor(a.date, a.slotId) || {}, items = Array.isArray(p.items) ? p.items : [];
    if (items.includes(key)) return;
    const patch = { items: items.concat([key]) };
    if (!str(p.topic) && str(topic)) patch.topic = str(topic).slice(0, 140);
    c.setPlan(a.date, a.slotId, patch);
    toast('Added to that lesson in your calendar.');
  }).catch(() => { /* no calendar on this version */ });
}
/* A new lesson pack or two-way slides lesson saved after a calendar lesson's Make: attach the newest one. */
bus.on('shelf', () => {
  const a = pendingAttach();
  if (!a || (a.k !== 'lkie' && a.k !== 'slides')) return;
  const list = arrOf(store.getJSON(a.k === 'lkie' ? PACKS : DECKS, [])), x = list.find((v) => v && v.id && (v.at || 0) >= a.at);
  if (x) attachMade(a.k + ':' + x.id, a.k === 'lkie' ? (x.input && x.input.topic) || x.title : x.deck && x.deck.title);
});
/* For a maker on mount: what to fill in (once), or null. */
export function takeMaking(kind) {
  try {
    const v = JSON.parse(sessionStorage.getItem(MAKE) || 'null');
    if (v && v.kind === kind && Date.now() - (v.at || 0) < 10 * 60000) { sessionStorage.removeItem(MAKE); return v; }
  } catch (e) { /* nothing waiting */ }
  return null;
}

/* Start a class (the Classroom page, a live session) with things ready: { title, subject, year, date, slot, items:
   [library keys], homework }. The Classroom page calls takeClass() on mount. */
const CLASS = 'ks2-engine.class.start.v1';
export function startClass(o) {
  try { sessionStorage.setItem(CLASS, JSON.stringify(Object.assign({ at: Date.now() }, o || {}))); } catch (e) { /* it opens empty */ }
  go('#/class');
}
export function takeClass() {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLASS) || 'null');
    if (v && Date.now() - (v.at || 0) < 10 * 60000) { sessionStorage.removeItem(CLASS); return v; }
  } catch (e) { /* nothing waiting */ }
  return null;
}

/* ---------------- changes ---------------- */
function changed(what) { bus.emit('library', what || {}); }
export function onLibrary(fn) { bus.on('library', fn); bus.on('shelf', () => fn({ op: 'shelf' })); }
window.addEventListener('storage', (e) => { if (!e.key || [PACKS, DECKS, SAVED, INDEX, FOLDERS, PLACE].includes(e.key)) changed({ op: 'storage' }); });

/* ---------------- choosing something (a dialog) ----------------
   pickItem({ title, kinds: ['lkie', 'quiz'], subject, year }) → Promise of a key, or null if closed. */
let pickerOpen = null;
export function pickItem(o) {
  o = o || {};
  if (pickerOpen) pickerOpen(null);
  return new Promise((resolve) => {
    const wrap = el('div', 'modal lib-pick');
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'lpk-h');
    const kinds = Array.isArray(o.kinds) && o.kinds.length ? o.kinds.filter((x) => KINDS[x]) : Object.keys(KINDS);
    wrap.innerHTML = '<div class="modal-card lpk-card" style="position:relative">' +
      '<button type="button" class="btn small icon modal-x" data-lp="x" aria-label="Close">' + icon('close') + '</button>' +
      '<h2 id="lpk-h"><i>' + icon('layers') + '</i>' + esc(o.title || 'Choose from My subjects') + '</h2>' +
      '<label class="fld"><span>Search</span><input type="text" data-lp="q" autocomplete="off" placeholder="A topic, a title or a subject"></label>' +
      '<ul class="lpk-list" role="listbox" aria-label="Your things"></ul><p class="fine lpk-empty" hidden>Nothing here yet. Things you make are filed here by themselves.</p></div>';
    document.body.appendChild(wrap);
    const last = document.activeElement;
    const close = (v) => { pickerOpen = null; wrap.remove(); if (last && last.focus) last.focus(); resolve(v || null); };
    pickerOpen = close;
    const paint = () => {
      let list = search($('[data-lp="q"]', wrap).value).filter((it) => kinds.includes(it.k));
      if (o.subject) list = list.sort((a, b) => (b.subject === o.subject) - (a.subject === o.subject));
      if (o.year) list = list.sort((a, b) => (b.year === o.year) - (a.year === o.year));
      list = list.slice(0, 60);
      $('.lpk-list', wrap).innerHTML = list.map((it) => '<li><button type="button" class="lpk-it" data-key="' + esc(it.key) + '" style="--c:' + subjectColor(it.subject) + '"><span class="lpk-k">' + icon(it.icon || KINDS[it.k].icon) + '</span>' +
        '<span class="lpk-t"><b>' + esc(it.title) + '</b><small>' + esc(it.long + ' · ' + subjectName(it.subject, true) + (it.year ? ' · ' + it.year : '')) + '</small></span></button></li>').join('');
      $('.lpk-empty', wrap).hidden = list.length > 0;
    };
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-lp="x"]')) { close(null); return; }
      const b = e.target.closest('[data-key]');
      if (b) close(b.dataset.key);
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } });
    $('[data-lp="q"]', wrap).addEventListener('input', paint);
    paint();
    setTimeout(() => { const q = $('[data-lp="q"]', wrap); if (q) q.focus(); }, 30);
  });
}
export const dayLabel = (t) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
