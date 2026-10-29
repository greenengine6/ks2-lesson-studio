/* lkie.like: one topic in, a whole lesson out. A 3-step wizard makes a pack (10 to 15 slides with diagrams and media
   ideas, key words, activities, a worksheet in three tiers, teacher notes and a 2-minute spoken briefing), matched to
   the curriculum with checked codes. Slides change in plain English with undo; a unit planner sequences up to 25
   lessons with recaps and assessments; packs open instantly from this device; PowerPoint and Word downloads.
   Every engine button goes through the shared guard (guard.js). */
import { $, $$, esc, str, icon, store, bus, prefs, hasKey, askClaude, askJSON, parseJSON, errorCopy, toast, copyOut, CONFIG, needKeyText } from '../core.js?v=de4f9a51';
import { track } from '../track.js?v=de4f9a51';
import { sfx } from '../fx/audio.js?v=de4f9a51';
import { Voice } from '../fx/voice.js?v=de4f9a51';
import { evAll } from '../idb.js?v=de4f9a51';
import { moodOf } from '../report.js?v=de4f9a51';
import { LIMITS, makeState, makeStart, makeEnd, editState, editStart, editEnd, deliberate, enterMovesOn, watch, waitText, repaint, clockAt } from '../guard.js?v=de4f9a51';
import { SUBJECTS, SUBJECT_BY_ID, match, objective } from './curriculum.js?v=de4f9a51';
import { PACK_SYSTEM, packRequest, SHEET_SYSTEM, sheetRequest, EDIT_SYSTEM, editRequest, INTENTS, intentOf, UNIT_SYSTEM, unitRequest, unitContext } from './prompts.js?v=de4f9a51';
import { normPack, normSlide, normSheet, normUnit, checkUnit, packKey, itemsSoFar, stringSoFar, TIERS, totalMinutes, carryExtras, TEXT_SIZES } from './model.js?v=de4f9a51';
import { KIND, slideHTML, fitSlide, thumbMeta, vocabHTML, activitiesHTML, notesHTML, sheetHTML, wireSheet, maxReveal, answersOf, learnText, mediaLinks } from './render.js?v=de4f9a51';
import { LOOKS, normLook, lookInfo, swatchOf } from './looks.js?v=de4f9a51';
import { picURL, creditText, keepPic, safePic, safeVideo, searchPictures, findPicture, creditFor, savePicture, hydrate, forgetUploads, youTube, ytThumb, ytWatch, ytEmbed, ytFind, ytKey, ytSearch, mmss, seconds, QUALITY } from '../pics.js?v=de4f9a51';
import { isPinned, togglePin, unpin, takeOpen, coverOfPack } from '../shelf.js?v=de4f9a51';
import { takeMaking, takePresent } from '../library.js?v=de4f9a51';
import { buildPptx, sheetDoc, sheetText, fileName } from './export.js?v=de4f9a51';
import EXAMPLE from './example.js?v=de4f9a51';
import { presentKit, kitButtons } from '../presentkit.js?v=de4f9a51';

const PACKS = 'ks2-engine.lkie.packs.v1', UNITS = 'ks2-engine.lkie.units.v1', RULES = 'ks2-engine.lkie.rules.v1', THEME = 'ks2-engine.lkie.theme.v1', FORM = 'ks2-engine.lkie.form.v1';
const YEARS = ['Year 3', 'Year 4', 'Year 5', 'Year 6'];
const SPARK = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>';
const LAYERS = '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>';
const TRY = {
  english: ['Fronted adverbials', 'Persuasive letters', 'Myths and legends', 'Inference from a picture', 'Relative clauses'],
  maths: ['Rounding off', 'Equivalent fractions', 'Column subtraction', 'Telling the time', 'Angles'],
  science: ['Electric circuits', 'The water cycle', 'Shadows', 'Food chains', 'The solar system'],
  computing: ['Algorithms and debugging', 'Loops in Scratch', 'How the internet works', 'Staying safe online'],
  history: ['The Romans in Britain', 'Ancient Egypt', 'The Vikings', 'The Stone Age'],
  geography: ['Volcanoes and earthquakes', 'Rivers', 'Rainforests', 'Grid references'],
  art: ['Observational drawing', 'Colour mixing', 'Clay sculpture'],
  dt: ['Levers and linkages', 'Healthy snacks', 'Strong structures'],
  music: ['Rhythm and beat', 'Reading notation', 'Composing a melody'],
  pe: ['Gymnastics balances', 'Invasion games', 'Dance patterns'],
  pshe: ['Healthy friendships', 'Feelings and wellbeing', 'Online safety'],
  re: ['Festivals of light', 'Places of worship', 'Sacred stories'],
  bm: ['Pantun', 'Kata nama', 'Imbuhan awalan', 'Membaca dan memahami'],
  mandarin: ['Greetings', 'Numbers 1 to 10', 'Family members', 'Colours'],
  french: ['Greetings', 'Numbers', 'Colours', 'Food'],
  spanish: ['Greetings', 'Numbers', 'Colours', 'Food']
};
const TIPS = ['Tip: tap any slide, then say what to change, for example “Add a football analogy”.', 'Tip: Undo is always there, so you can try a change safely.', 'Tip: the worksheet comes in three tiers. Print the one each group needs.',
  'Tip: press Listen in Teacher notes for a 2-minute spoken briefing.', 'Tip: Calm slides use a cream background and no colour stripes, easier for some readers.', 'Tip: diagrams on the slides are drawn from the numbers, so they are always exact.'];
const CHIPS = ['simplify', 'stretch', 'analogy', 'shorten', 'visual', 'question', 'tone', 'translate'];

/* ---------------- the example, ready to open ---------------- */
const EX = (() => { const p = normPack(EXAMPLE, EXAMPLE.input, EXAMPLE.codes.map(objective).filter(Boolean)); p.id = 'example'; p.at = 0; p.key = ''; return p; })();
const isExample = (p) => !p || p.id === 'example';

/* ---------------- state ---------------- */
const S = {
  view: null, pack: EX, origin: 'example', tab: 'slides', sel: -1, tier: 'standard', answers: false, theme: store.get(THEME) === 'calm' ? 'calm' : 'bright',
  list: [], chosen: [], busy: null, live: null, editing: false, sheetBusy: false, unit: null, unitBusy: false, briefing: false, hist: new Map(),
  pr: { open: false, i: 0, reveal: 0, notes: false, t0: 0, seen: 0 }, rec: null,
  ed: 'ai', drawer: '', pq: '', pres: null, pbusy: false, perr: '', ptarget: '', pfor: '', vq: '', vres: null, vbusy: false, auto: null
};
const clone = (x) => JSON.parse(JSON.stringify(x));

/* ---------------- saved packs and units (this device) ---------------- */
let memPacks = [];
function loadPacks() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(PACKS) || 'null'); } catch (e) { v = null; }
  return Array.isArray(v) ? v.filter((p) => p && p.id && Array.isArray(p.slides)) : memPacks;
}
function writePacks(list) {
  memPacks = list;
  for (let l = list.slice(); l.length; l.pop()) { try { localStorage.setItem(PACKS, JSON.stringify(l)); return; } catch (e) { /* full: drop the oldest and try again */ } }
}
function savePack(p) { if (isExample(p)) return; writePacks([p].concat(loadPacks().filter((x) => x.id !== p.id)).slice(0, 60)); bus.emit('shelf'); if (S.view) renderRecent(); }
/* The teacher's own pictures live in this browser; a deleted pack takes its pictures with it (unless another pack uses them). */
function uploadsIn(p) {
  const ids = [], add = (pic) => { if (pic && pic.up) ids.push(pic.up); };
  (p.slides || []).forEach((s) => { add(s.pic); if (s.look && s.look.pic) add(s.look.pic); });
  if (p.look && p.look.pic) add(p.look.pic);
  return ids;
}
function dropPack(id) {
  const all = loadPacks(), gone = all.find((x) => x.id === id), rest = all.filter((x) => x.id !== id);
  writePacks(rest); unpin('lkie', id);
  if (gone) { const keep = new Set(rest.flatMap(uploadsIn)); forgetUploads(uploadsIn(gone).filter((u) => !keep.has(u))); }
  bus.emit('shelf');
}
function findCached(key) { return loadPacks().find((p) => p.key === key && Date.now() - (p.at || 0) < 30 * 864e5) || null; }
const loadUnits = () => { const v = store.getJSON(UNITS, []); return Array.isArray(v) ? v.filter((u) => u && u.id && Array.isArray(u.lessons)) : []; };
function saveUnit(u) { store.setJSON(UNITS, [u].concat(loadUnits().filter((x) => x.id !== u.id)).slice(0, 5)); }

/* ---------------- page ---------------- */
function pageHTML() {
  const subj = ['Core', 'Foundation', 'Languages'].map((g) => '<optgroup label="' + g + '">' + SUBJECTS.filter((s) => s.group === g).map((s) => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join('') + '</optgroup>').join('');
  const weeks = Array.from({ length: 12 }, (_, i) => '<option value="' + (i + 1) + '"' + (i === 5 ? ' selected' : '') + '>' + (i + 1) + (i ? ' weeks' : ' week') + '</option>').join('');
  const per = [1, 2, 3, 4, 5].map((n) => '<option value="' + n + '"' + (n === 2 ? ' selected' : '') + '>' + n + ' a week</option>').join('');
  return '<div class="wrap">' +
    '<header class="eng-head"><div class="eng-ico"><i>' + icon('layers') + '</i></div><div><p class="kicker">Any KS2 subject · full lesson pack</p><h1 class="lk-brand" aria-label="lkie.like">lkie<span>.</span>like</h1>' +
    '<p>One topic in, a whole lesson out: 10 to 15 slides with exact diagrams, key words, activities and a worksheet in three tiers, matched to the curriculum. Change any slide in plain English.</p>' +
    '<div class="chips"><span class="chip">All KS2 subjects</span><span class="chip">Bahasa Melayu and Mandarin</span><span class="chip">3-tier worksheets</span><span class="chip">Unit planner</span></div></div></header>' +
    '<div class="ss lk">' +
    '<aside class="rail">' +
    '<section class="card" aria-labelledby="lk-make-h"><h2 class="card-h" id="lk-make-h"><i>' + icon('wand') + '</i>Make a lesson pack</h2><p class="card-sub">Three steps. About a minute.</p>' +
    '<form id="lk-form" class="lk-form" novalidate>' +
    '<fieldset class="lk-step"><legend><b>1</b>Who is it for?</legend><div class="pills" id="lk-year" role="group" aria-label="Year group">' + YEARS.map((y) => '<button type="button" class="pill" data-v="' + y + '" aria-pressed="' + (y === 'Year 4') + '">' + y + '</button>').join('') + '</div>' +
    '<label class="fld"><span>Subject</span><select id="lk-subject">' + subj + '</select></label></fieldset>' +
    '<fieldset class="lk-step"><legend><b>2</b>What is it about?</legend><label class="fld"><span>Topic</span><span class="lk-topic"><input type="text" id="lk-topic" autocomplete="off" enterkeyhint="next" maxlength="160" placeholder="For example: Rounding off"><button type="button" class="lk-mic" id="lk-mic" aria-label="Say the topic">' + icon('mic') + '</button></span></label>' +
    '<div class="try" id="lk-try"></div><div class="lk-cur" id="lk-cur" aria-live="polite"></div></fieldset>' +
    '<fieldset class="lk-step"><legend><b>3</b>Make it</legend><label class="fld"><span>Lesson length</span><select id="lk-min"><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option></select></label>' +
    '<details class="lk-rules"><summary>Your school’s own rules <span class="opt">(optional)</span></summary><textarea id="lk-rules" rows="3" maxlength="600" placeholder="For example: we use the column method with exchanging; use Malaysian names; no fizzy drinks in examples"></textarea><p class="fine">Saved on this device and followed in every pack.</p></details>' +
    '<button type="button" class="btn primary big wide" id="lk-go"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Make my lesson pack</span></button>' +
    '<p class="fine" id="lk-fine"></p><div class="notice" id="lk-notice" hidden role="status"></div></fieldset></form></section>' +
    '<section class="card" aria-labelledby="lku-h"><h2 class="card-h" id="lku-h"><i>' + icon('plan') + '</i>Plan a unit</h2><p class="card-sub">Up to 25 connected lessons with recaps and assessments. Uses the year and subject above.</p>' +
    '<div class="form" id="lku-form"><label class="fld"><span>Unit</span><input type="text" id="lku-topic" autocomplete="off" enterkeyhint="done" maxlength="120" placeholder="For example: Place value to 10,000"></label>' +
    '<div class="row2"><label class="fld"><span>Weeks</span><select id="lku-weeks">' + weeks + '</select></label><label class="fld"><span>Lessons</span><select id="lku-per">' + per + '</select></label></div>' +
    '<button type="button" class="btn wide" id="lku-go"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + LAYERS + '</svg><span>Plan the unit</span></button><p class="fine" id="lku-fine"></p><div class="notice" id="lku-notice" hidden role="status"></div></div>' +
    '<div id="lku-out"></div></section>' +
    '<section class="card" aria-labelledby="lk-rec-h"><h2 class="card-h" id="lk-rec-h"><i>' + icon('history') + '</i>Your packs</h2><p class="card-sub">Saved on this device. The same request opens instantly, without using the engine.</p><ul class="recent-list" id="lk-recent"></ul></section>' +
    '</aside>' +
    '<section class="lesson card lk-pack" id="lk-pack" aria-label="Lesson pack">' +
    '<div class="busy lk-busy" id="lk-busy" hidden role="status" aria-live="polite"><div class="busy-top"><b>Making your lesson pack</b><button type="button" class="btn small" id="lk-stop">' + icon('stop') + 'Stop</button></div>' +
    '<ol class="lk-steps" id="lk-steps"></ol><div class="meter"><i id="lk-bar"></i></div><p class="lk-tip" id="lk-tip"></p></div>' +
    '<div class="lhead" id="lk-head"></div>' +
    '<div class="actions" id="lk-actions"><button type="button" class="btn primary" data-lk="present">' + icon('play') + 'Present</button><button type="button" class="btn" data-lk="ppt">' + icon('download') + '<span>PowerPoint</span></button>' +
    '<button type="button" class="btn" data-lk="word">' + icon('notes') + '<span>Worksheet (Word)</span></button><button type="button" class="btn" data-lk="brief">' + icon('volume') + '<span>Listen</span></button>' +
    '<button type="button" class="btn" data-lk="looks" aria-expanded="false" aria-controls="lk-drawer">' + icon('palette') + '<span>Background</span></button><button type="button" class="btn" data-lk="pics" aria-expanded="false" aria-controls="lk-drawer">' + icon('image') + '<span>Pictures</span></button>' +
    '<button type="button" class="btn" data-lk="keep" aria-pressed="false">' + icon('pin') + '<span>Keep on Today</span></button></div>' +
    '<div class="lk-drawer" id="lk-drawer" hidden></div>' +
    '<div class="seg lk-tabs" role="tablist" aria-label="Pack views">' + [['slides', 'Slides'], ['vocab', 'Key words'], ['acts', 'Activities'], ['sheet', 'Worksheet'], ['notes', 'Teacher notes']].map(([k, l]) => '<button type="button" role="tab" data-lk-tab="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<div id="lk-panel" role="tabpanel"></div>' +
    '</section></div></div>';
}
function presentHTML() {
  return '<div class="spr-stage"><div class="spr-frame" id="lp-frame" title="Click to reveal or go to the next slide"></div><div class="spr-notes" id="lp-notes" hidden></div></div>' +
    '<div class="spr-bar"><button type="button" class="pbtn" data-lp="prev" aria-label="Previous slide">' + icon('left') + '</button><span class="spr-count" id="lp-count">1 / 1</span><button type="button" class="pbtn" data-lp="next" aria-label="Next slide">' + icon('right') + '</button>' +
    '<span class="pr-sep"></span><button type="button" class="pbtn" data-lp="reveal">' + icon('eye') + '<span>Reveal</span></button><button type="button" class="pbtn" data-lp="notes" aria-pressed="false">' + icon('notes') + '<span>Notes</span></button>' +
    kitButtons(true) +
    '<button type="button" class="pbtn" data-lp="ticket">' + icon('smile') + '<span>Class feedback</span></button><button type="button" class="pbtn" data-lp="full" aria-label="Full screen">' + icon('expand') + '</button>' +
    '<span class="pr-sep"></span><button type="button" class="pbtn" data-lp="exit">' + icon('close') + '<span>Exit</span></button></div>';
}

/* ---------------- the wizard ---------------- */
const yearNow = () => { const b = $('#lk-year [aria-pressed="true"]', S.view); return b ? b.dataset.v : 'Year 4'; };
const subjectNow = () => $('#lk-subject', S.view).value || 'maths';
function saveForm() { store.setJSON(FORM, { year: yearNow(), subject: subjectNow(), minutes: $('#lk-min', S.view).value }); }
function restoreForm() {
  const f = store.getJSON(FORM, null) || {};
  if (YEARS.includes(f.year)) $$('#lk-year .pill', S.view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === f.year)));
  if (f.subject && SUBJECT_BY_ID[f.subject]) $('#lk-subject', S.view).value = f.subject;
  if (['30', '45', '60'].includes(String(f.minutes))) $('#lk-min', S.view).value = String(f.minutes);
  $('#lk-rules', S.view).value = store.get(RULES) || '';
}
function paintTry() {
  const t = TRY[subjectNow()] || [];
  $('#lk-try', S.view).innerHTML = t.length ? '<span>Try:</span>' + t.map((x) => '<button type="button" data-try="' + esc(x) + '">' + esc(x) + '</button>').join('') : '';
}
let matchT = 0;
function updateMatch() {
  const topic = str($('#lk-topic', S.view).value);
  S.list = topic ? match(subjectNow(), yearNow(), topic, 8) : [];
  S.chosen = S.chosen.filter((c) => S.list.some((o) => o.code === c));
  const box = $('#lk-cur', S.view);
  if (!topic) { box.innerHTML = ''; return; }
  if (!S.list.length) { box.innerHTML = '<p class="fine">No close curriculum match yet. Keep typing, or make it anyway: the pack follows the subject’s KS2 programme.</p>'; return; }
  box.innerHTML = '<p class="lk-cur-h">' + icon('target') + 'Curriculum match <span>(tap to choose; none chosen means the best fit)</span></p>' +
    S.list.slice(0, 3).map((o) => '<button type="button" class="lk-cchip" data-code="' + o.code + '" aria-pressed="' + S.chosen.includes(o.code) + '"><b class="mono">' + o.code + '</b><span>' + esc(o.text.length > 92 ? o.text.slice(0, 90) + '…' : o.text) + '</span></button>').join('');
}
function readInput(o) {
  o = o || {};
  const subject = o.subject || subjectNow(), s = SUBJECT_BY_ID[subject] || SUBJECTS[1];
  return {
    year: o.year || yearNow(), subject, subjectName: s.name, topic: str(o.topic != null ? o.topic : $('#lk-topic', S.view).value).slice(0, 160),
    minutes: Number(o.minutes || $('#lk-min', S.view).value) || 45, mode: prefs.mode, codes: (o.codes || S.chosen).slice(0, 3),
    rules: str($('#lk-rules', S.view).value).slice(0, 600), unitKey: o.unitKey || ''
  };
}
function shortlist(input) {
  const list = match(input.subject, input.year, input.topic, 8);
  input.codes.forEach((c) => { if (!list.some((o) => o.code === c)) { const ob = objective(c); if (ob) list.unshift(ob); } });
  return list.slice(0, 10);
}
function notice(msg, err, html) { const n = $('#lk-notice', S.view); if (html) n.innerHTML = msg; else n.textContent = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }

/* ---------------- making a pack ---------------- */
function steps() {
  const L = S.live, n = L ? L.slides.length : 0;
  const row = (state, text) => '<li class="' + state + '">' + (state === 'done' ? icon('check') : '<i></i>') + '<span>' + esc(text) + '</span></li>';
  $('#lk-steps', S.view).innerHTML = row('done', 'Curriculum matched: ' + (L && L.list.length ? L.list.slice(0, 2).map((o) => o.code).join(', ') + (L.list.length > 2 ? ' and more' : '') : 'no close match, following the KS2 programme')) +
    row(L && L.title ? 'done' : 'now', L && L.title ? 'Planned: “' + L.title + '”' : 'Planning the lesson…') +
    row(L && L.vocab.length ? 'done' : L && L.title ? 'now' : '', L && L.vocab.length ? L.vocab.length + ' key words chosen' : 'Choosing key words') +
    row(L && L.slidesDone ? 'done' : n ? 'now' : '', n ? 'Writing slides: ' + n + ' of about ' + Math.max(12, n) : 'Writing the slides') +
    row(L && L.sheet === 'done' ? 'done' : L && L.sheet === 'writing' ? 'now' : '', L && L.sheet === 'done' ? 'Worksheet written in three tiers' : 'Writing the worksheet in three tiers (at the same time)');
  $('#lk-bar', S.view).style.width = Math.min(97, 8 + (L && L.title ? 8 : 0) + (L && L.vocab.length ? 8 : 0) + n / 12 * 70) + '%';
}
let tipT = 0;
function showBusy(on) {
  $('#lk-busy', S.view).hidden = !on;
  clearInterval(tipT);
  if (on) { let k = Math.floor(Math.random() * TIPS.length); const tip = $('#lk-tip', S.view); tip.textContent = TIPS[k]; tipT = setInterval(() => { k = (k + 1) % TIPS.length; tip.textContent = TIPS[k]; }, 6000); steps(); }
}
function livePack() { const L = S.live; return { input: L.input, title: L.title || L.input.topic, objective: L.objective, successCriteria: [], bigQuestion: '', codes: [], vocab: L.vocab, slides: L.slides, activities: [], teacher: { misconceptions: [] }, worksheet: null }; }
async function makePack(o) {
  o = o || {};
  if (S.busy) return;
  notice('');
  const input = readInput(o);
  if (!input.topic) { notice('Type a topic first, for example “Rounding off”.', true); $('#lk-topic', S.view).focus(); return; }
  const key = packKey(input);
  if (!o.fresh) {
    const hit = findCached(key);
    if (hit) {
      openPack(hit, 'cache'); sfx('page');
      notice('Opened instantly: you made this pack on ' + new Date(hit.at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '. <button type="button" class="linkbtn" data-lk="fresh">Make a fresh one</button>', false, true);
      S.lastAsk = o;
      return;
    }
  }
  const g = makeState('lkie');
  if (!g.ok) { repaint(); notice(waitText(g)); return; }
  if (!hasKey()) { notice(esc(needKeyText()), true, true); bus.emit('need-key'); return; }
  const list = shortlist(input), ctl = new AbortController(), ticket = makeStart('lkie'), t0 = Date.now();
  S.busy = ctl; S.live = { input, list, title: '', objective: '', vocab: [], slides: [], sheet: '', slidesDone: false };
  S.tab = 'slides'; S.sel = -1;
  showBusy(true); renderPack(); sfx('send');
  if (window.matchMedia('(max-width: 1060px)').matches) $('#lk-pack', S.view).scrollIntoView({ behavior: 'smooth', block: 'start' });
  let sheetP = null, outcome = 'error', code = '';
  const startSheet = (base) => {
    if (sheetP) return;
    S.live.sheet = 'writing'; steps();
    sheetP = askJSON(sheetRequest(Object.assign({ year: input.year, subject: input.subject, subjectName: input.subjectName, topic: input.topic, rules: input.rules }, base)), { system: SHEET_SYSTEM, model: CONFIG.quickModel, maxTokens: 6000, signal: ctl.signal })
      .then((raw) => normSheet(raw), (e) => { if (e && e.code === 'cancelled') throw e; return null; });
    sheetP.catch(() => {});
  };
  let seen = 0;
  const onText = (text) => {
    const L = S.live;
    if (!L) return;
    if (!L.title) L.title = stringSoFar(text, 'title');
    if (!L.objective) L.objective = stringSoFar(text, 'objective');
    const v = itemsSoFar(text, 'vocab');
    if (v.items.length !== L.vocab.length) L.vocab = v.items.map((x) => ({ word: str(x && x.word), meaning: str(x && x.meaning), example: str(x && x.example), gloss: str(x && x.gloss), pinyin: str(x && x.pinyin) })).filter((x) => x.word);
    if (v.closed && L.objective) startSheet({ objective: L.objective, vocab: L.vocab, bigQuestion: stringSoFar(text, 'bigQuestion') });
    const s = itemsSoFar(text, 'slides');
    if (s.closed) L.slidesDone = true;
    if (s.items.length !== seen) { seen = s.items.length; L.slides = s.items.map(normSlide).filter(Boolean); renderPack(); }
    steps();
  };
  try {
    const r = await askClaude(packRequest(Object.assign({}, input, { list, chosen: input.codes, unit: o.unitText || '' })), { system: PACK_SYSTEM, model: CONFIG.mainModel, maxTokens: 12000, signal: ctl.signal, onText });
    if (r.stop === 'max_tokens') throw { code: 'truncated' };
    const pack = normPack(parseJSON(r.text), input, list);
    if (!pack) throw { code: 'invalid_json' };
    if (!sheetP) startSheet({ objective: pack.objective, successCriteria: pack.successCriteria, vocab: pack.vocab, bigQuestion: pack.bigQuestion });
    S.live.slidesDone = true; steps();
    pack.id = 'p' + Date.now().toString(36); pack.at = Date.now(); pack.key = key;
    if (o.unit) { pack.unitId = o.unit.id; pack.unitN = o.unit.lessons[o.index].n; }
    let w = null;
    try { w = await sheetP; } catch (e) { if (e && e.code === 'cancelled') throw e; }
    pack.worksheet = w;
    S.live = null; outcome = 'ok';
    savePack(pack); openPack(pack, 'new');
    if (o.unit) { const l = o.unit.lessons[o.index]; if (l) { l.pack = pack.id; saveUnit(o.unit); renderUnit(); } }
    autoPictures(pack);
    track('deck', { eng: 'lkie', title: pack.title, year: input.year, subject: input.subjectName, slides: pack.slides.length, ok: 1, ms: Date.now() - t0 });
    sfx('success'); toast(w ? 'Your lesson pack is ready.' : 'Your slides are ready. The worksheet did not come through: open Worksheet to write it again.');
  } catch (e) {
    code = (e && e.code) || 'error';
    S.live = null;
    track('deck', { eng: 'lkie', title: input.topic, year: input.year, subject: input.subjectName, ok: 0, err: code, ms: Date.now() - t0 });
    if (code !== 'cancelled') { sfx('error'); notice(errorCopy(code, 'the lesson pack'), true); }
    renderPack();
  } finally {
    S.busy = null; showBusy(false);
    makeEnd(ticket, outcome === 'ok' ? 'ok' : code === 'cancelled' ? 'stopped' : 'error');
    repaint();
  }
}
function openPack(p, origin) {
  S.pack = p; S.origin = origin || 'saved'; S.sel = -1; S.tab = 'slides'; S.ed = 'ai'; S.drawer = ''; S.pres = null; S.pfor = ''; S.vres = null;
  if (S.briefing) { Voice.stop(); S.briefing = false; }
  renderPack(); renderRecent();
}

/* ---------------- rendering the pack ---------------- */
function headHTML(p, live) {
  const eyebrow = live ? 'Making it now · slides appear as they are written' : isExample(p) ? 'Example pack · make your own on the left' : S.origin === 'cache' ? 'Your pack · opened instantly from this device' : 'Your pack';
  const chips = live ? [p.input.year, p.input.subjectName] : [p.input.year, p.input.subjectName, totalMinutes(p) + ' minutes', p.slides.length + ' slides', p.worksheet ? 'Worksheet in 3 tiers' : '', prefs.mode === 'online' ? 'Online class' : 'In the classroom'];
  return '<p class="kicker">' + esc(eyebrow) + '</p><h2 class="ltitle">' + esc(p.title) + '</h2>' + (p.objective ? '<p class="lobj">We are learning to ' + esc(learnText(p.objective)) + '.</p>' : '') +
    '<div class="chips">' + chips.filter(Boolean).map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + (p.codes || []).map((c) => '<span class="chip lk-code" title="' + esc(c.text) + '">' + esc(c.code) + '</span>').join('') + '</div>';
}
function renderPack() {
  if (!S.view) return;
  const live = !!S.live, p = live ? livePack() : S.pack;
  $('#lk-head', S.view).innerHTML = headHTML(p, live);
  $('#lk-actions', S.view).hidden = live;
  paintActions(p, live);
  const tabs = $('.lk-tabs', S.view);
  tabs.hidden = live;
  $$('[data-lk-tab]', S.view).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.lkTab === S.tab)));
  const panel = $('#lk-panel', S.view);
  if (live) { panel.innerHTML = slidesPanel(p, true); refit(); return; }
  if (S.tab === 'slides') panel.innerHTML = slidesPanel(p, false);
  else if (S.tab === 'vocab') panel.innerHTML = vocabHTML(p);
  else if (S.tab === 'acts') panel.innerHTML = activitiesHTML(p);
  else if (S.tab === 'sheet') panel.innerHTML = sheetPanel(p);
  else panel.innerHTML = notesHTML(p);
  paintBrief();
  hydrate(panel);
  refit();
  sweepCredits(p);
}
function slidesPanel(p, live) {
  const cards = p.slides.map((s, i) => '<article class="scard' + (S.sel === i ? ' sel' : '') + (S.editing && S.sel === i ? ' busy' : '') + '" data-i="' + i + '"><button type="button" class="sthumb" data-sel="' + i + '" aria-pressed="' + (S.sel === i) + '" aria-label="Slide ' + (i + 1) + ': ' + esc(s.title || (KIND[s.layout] || {}).label || '') + '. Select to change it">' + slideHTML(p, s, i, { reveal: s.layout === 'guided' ? 99 : 0, mode: prefs.mode, theme: S.theme }) + '</button>' +
    thumbMeta(s, i) + (live ? '' : '<p class="lk-from"><button type="button" class="linkbtn" data-present="' + i + '">' + icon('play') + 'Present from here</button></p>') + '</article>');
  if (live) for (let k = p.slides.length; k < 12; k++) cards.push('<article class="scard lk-skel" aria-hidden="true"><div class="sthumb"><div class="lk-sk"></div></div><p class="lk-skl"></p></article>');
  // the editor opens right under the slide you picked; with nothing picked, a short hint sits above the slides
  if (!live && S.sel >= 0 && p.slides[S.sel]) cards.splice(S.sel + 1, 0, editorHTML(p));
  return (live || S.sel >= 0 ? '' : editorHTML(p)) + '<div class="sgrid lk-grid">' + cards.join('') + '</div>';
}
/* ---------------- the slide editor: six ways to change a slide ---------------- */
const ED_TABS = [['ai', 'wand', 'Change with AI'], ['text', 'type', 'Edit text'], ['pic', 'image', 'Picture'], ['video', 'video', 'Video'], ['bg', 'palette', 'Background'], ['size', 'textsize', 'Text size']];
const RESP_OPTS = [['chat', 'Write or type an answer'], ['vote', 'Vote A, B, C or D'], ['show', 'Show me'], ['talk', 'Talk to a partner'], ['react', 'Thumbs up, sideways or down'], ['none', 'No answer on this slide']];
function editorHTML(p) {
  const h = S.hist.get(p.id) || { undo: [], redo: [] };
  if (S.sel < 0 || !p.slides[S.sel]) {
    return '<div class="lk-ed idle"><p>' + icon('wand') + '<span><b>Tap a slide to change it.</b> Edit the words, add a picture or a video, change the background or the text size, or say what you want in plain English, for example “Make this simpler”.</span></p>' +
      '<span class="lk-ed-tools">' + (h.undo.length ? '<button type="button" class="btn small" data-ed="undo">' + icon('left') + 'Undo</button>' : '') + (h.redo.length ? '<button type="button" class="btn small" data-ed="redo">Redo' + icon('right') + '</button>' : '') + '</span></div>';
  }
  const s = p.slides[S.sel], k = KIND[s.layout] || KIND.concept;
  const pane = S.ed === 'text' ? textPane(p, s) : S.ed === 'pic' ? picPane(p, s) : S.ed === 'video' ? videoPane(p, s) : S.ed === 'bg' ? bgPane(p, s) : S.ed === 'size' ? sizePane(s) : aiPane();
  return '<div class="lk-ed" role="region" aria-label="Change slide ' + (S.sel + 1) + '"><div class="lk-ed-top"><b>Slide ' + (S.sel + 1) + ' · ' + esc(k.label) + '</b><span class="lk-ed-tools">' +
    '<button type="button" class="btn small icon" data-ed="left" aria-label="Move slide earlier"' + (S.sel === 0 ? ' disabled' : '') + '>' + icon('left') + '</button><button type="button" class="btn small icon" data-ed="right" aria-label="Move slide later"' + (S.sel === p.slides.length - 1 ? ' disabled' : '') + '>' + icon('right') + '</button>' +
    '<button type="button" class="btn small icon" data-ed="del" aria-label="Delete this slide"' + (p.slides.length <= 5 ? ' disabled' : '') + '>' + icon('trash') + '</button>' +
    '<button type="button" class="btn small" data-ed="undo"' + (h.undo.length ? '' : ' disabled') + ' aria-label="Undo">' + icon('refresh') + '<span class="lbl">Undo</span></button><button type="button" class="btn small" data-ed="redo"' + (h.redo.length ? '' : ' disabled') + ' aria-label="Redo"><span class="lbl">Redo</span>' + icon('right') + '</button>' +
    '<button type="button" class="btn small icon" data-ed="close" aria-label="Close the editor">' + icon('close') + '</button></span></div>' +
    '<div class="lk-ed-tabs" role="tablist" aria-label="Ways to change this slide">' + ED_TABS.map(([id, ic, label]) => '<button type="button" role="tab" data-edtab="' + id + '" aria-selected="' + (S.ed === id) + '">' + icon(ic) + '<span>' + label + '</span></button>').join('') + '</div>' +
    '<div class="lk-ed-pane" role="tabpanel">' + pane + '</div><p class="notice" id="lk-ed-note" hidden role="status"></p></div>';
}
function aiPane() {
  return '<div class="lk-ed-chips">' + CHIPS.map((id) => { const it = INTENTS.find((x) => x.id === id); return '<button type="button" class="lk-ichip" data-intent="' + id + '"' + (S.editing ? ' disabled' : '') + '>' + esc(it.label) + '</button>'; }).join('') + '</div>' +
    '<form class="lk-ed-form" id="lk-ed-form" novalidate><input type="text" id="lk-ed-in" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="Or type a change: Add a slide on halfway numbers"' + (S.editing ? ' disabled' : '') + '><button type="submit" class="btn primary small" id="lk-ed-go"' + (S.editing ? ' disabled' : '') + '>' + icon('wand') + (S.editing ? 'Changing…' : 'Change it') + '</button></form>';
}
function fld(name, label, val, o) {
  o = o || {};
  const box = o.area ? '<textarea name="' + name + '" rows="' + (o.rows || 3) + '" maxlength="' + (o.max || 300) + '">' + esc(val || '') + '</textarea>' : '<input type="text" name="' + name + '" maxlength="' + (o.max || 200) + '" value="' + esc(val || '') + '" autocomplete="off">';
  return '<label class="fld"><span>' + label + '</span>' + box + (o.hint ? '<small class="fine">' + o.hint + '</small>' : '') + '</label>';
}
const linesOf = (xs) => (xs || []).join('\n');
function textPane(p, s) {
  let h = s.layout === 'title' ? fld('ptitle', 'Lesson title', p.title, { max: 100 }) + fld('pobj', 'Objective', p.objective, { area: true, rows: 2, max: 240 }) + fld('psc', 'Success criteria', linesOf(p.successCriteria), { area: true, rows: 3, max: 680, hint: 'One on each line, up to 4.' }) + fld('pbq', 'Big question', p.bigQuestion, { max: 200 })
    : fld('title', 'Slide title', s.title, { max: 90 });
  const tasks = { area: true, rows: 2, max: 620, hint: 'One on each line, up to 3.' };
  switch (s.layout) {
    case 'recap': case 'exit':
      h += '<div class="lk-qa"><span class="lk-qa-h"><b>Questions</b><b>Answers</b></span>' + [0, 1, 2, 3, 4].map((j) => { const q = s.questions[j] || {}; return '<div class="lk-qa-row"><b>' + (j + 1) + '</b><input type="text" name="q' + j + '" maxlength="240" value="' + esc(q.q || '') + '" placeholder="Question ' + (j + 1) + '" aria-label="Question ' + (j + 1) + '" autocomplete="off"><input type="text" name="a' + j + '" maxlength="160" value="' + esc(q.a || '') + '" placeholder="Answer" aria-label="Answer ' + (j + 1) + '" autocomplete="off"></div>'; }).join('') + '<small class="fine">Leave a row empty to remove it.</small></div>';
      break;
    case 'hook': h += fld('prompt', 'Hook question or problem', s.prompt, { area: true, rows: 2, max: 260 }) + fld('detail', 'Follow-up line', s.detail, { max: 200 }); break;
    case 'vocab': h += fld('words', 'Key words on this slide', linesOf(s.words), { area: true, rows: 3, max: 400, hint: 'One on each line, up to 8. Leave it empty to show the pack’s key words.' }); break;
    case 'concept': h += fld('points', 'Points', linesOf(s.points), { area: true, rows: 3, max: 680, hint: 'One on each line, up to 4.' }) + fld('example', 'Example', s.example, { area: true, rows: 2, max: 260 }); break;
    case 'guided': h += fld('problem', 'Worked example', s.problem, { area: true, rows: 2, max: 260 }) + fld('steps', 'Steps', linesOf(s.steps), { area: true, rows: 4, max: 1050, hint: 'One on each line, up to 5.' }) + fld('answer', 'Answer', s.answer, { max: 160 }); break;
    case 'check':
      h += fld('question', 'Question', s.question, { area: true, rows: 2, max: 260 }) + '<div class="lk-qa" role="radiogroup" aria-label="Options and the right answer">' + [0, 1, 2, 3].map((j) => '<div class="lk-qa-row opt"><label class="lk-right" title="The right answer"><input type="radio" name="right" value="' + j + '"' + (s.answer === j ? ' checked' : '') + ' aria-label="' + 'ABCD'[j] + ' is right"><b>' + 'ABCD'[j] + '</b></label><input type="text" name="o' + j + '" maxlength="120" value="' + esc(s.options[j] || '') + '" placeholder="Option ' + 'ABCD'[j] + '" aria-label="Option ' + 'ABCD'[j] + '" autocomplete="off"></div>').join('') + '<small class="fine">Tick the right answer. Wrong options work best as common mistakes.</small></div>' + fld('why', 'Why it is right', s.why, { area: true, rows: 2, max: 300 });
      break;
    case 'independent': h += fld('support', 'Support', linesOf(s.support), tasks) + fld('core', 'Core', linesOf(s.core), tasks) + fld('stretch', 'Stretch', linesOf(s.stretch), tasks) + fld('answers', 'Answers', s.answers, { area: true, rows: 2, max: 500 }); break;
    case 'talk': h += fld('prompt', 'Question to discuss', s.prompt, { area: true, rows: 2, max: 260 }) + fld('starter', 'Sentence starter', s.starter, { max: 120 }); break;
    case 'plenary': h += fld('points', 'Key takeaways', linesOf(s.points), { area: true, rows: 3, max: 680, hint: 'One on each line, up to 4.' }) + fld('prompt', 'Reflection question', s.prompt, { max: 200 }); break;
    default: break;
  }
  h += fld('say', 'What you say (your notes)', s.say, { area: true, rows: 3, max: 700 }) +
    '<div class="row2"><label class="fld"><span>Minutes</span><input type="number" name="minutes" inputmode="numeric" min="0" max="30" value="' + (s.minutes || 0) + '"></label>' +
    '<label class="fld"><span>How pupils answer</span><select name="respond">' + RESP_OPTS.map(([v, l]) => '<option value="' + v + '"' + (s.respond === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>';
  return '<form class="lk-textform" id="lk-text-form" novalidate>' + h + '<div class="lk-row"><button type="submit" class="btn primary small">' + icon('check') + 'Save the changes</button><button type="button" class="btn small" data-ed="text-reset">' + icon('undo') + 'Start again</button></div></form>';
}
const NEEDS = { recap: 'A recap needs at least one question.', exit: 'An exit ticket needs at least one question.', hook: 'Write the hook question or problem.', concept: 'Add at least one point or an example.', guided: 'Write the worked example.', check: 'A check point needs a question and at least two options.', independent: 'Add at least one task.', talk: 'Write the question to discuss.', plenary: 'Add a takeaway or a reflection question.' };
function readText(form, p, s) {
  const el = form.elements, raw = (n) => String(el[n] ? el[n].value : ''), v = (n) => str(raw(n));
  const lines = (n, max, len) => raw(n).split(/\n+/).map((x) => str(x)).filter(Boolean).slice(0, max).map((x) => x.slice(0, len));
  const t = clone(s);
  if (s.layout !== 'title') t.title = v('title').slice(0, 90);
  t.say = v('say').slice(0, 700);
  t.minutes = Math.max(0, Math.min(30, Math.round(Number(v('minutes')) || 0)));
  if (RESP_OPTS.some((r) => r[0] === v('respond'))) t.respond = v('respond');
  switch (s.layout) {
    case 'recap': case 'exit': t.questions = [0, 1, 2, 3, 4].map((j) => ({ q: v('q' + j).slice(0, 240), a: v('a' + j).slice(0, 160) })).filter((x) => x.q); break;
    case 'hook': t.prompt = v('prompt'); t.detail = v('detail'); break;
    case 'vocab': t.words = lines('words', 8, 40); break;
    case 'concept': t.points = lines('points', 4, 160); t.example = v('example'); break;
    case 'guided': t.problem = v('problem'); t.steps = lines('steps', 5, 200); t.answer = v('answer'); break;
    case 'check': {
      const r = form.querySelector('input[name="right"]:checked'), right = r ? Number(r.value) : -1;
      const kept = [0, 1, 2, 3].map((j) => ({ j, t: v('o' + j).slice(0, 120) })).filter((o) => o.t);
      if (kept.length >= 2 && !kept.some((o) => o.j === right)) return { err: 'Tick the right answer next to one of the options.' };
      t.question = v('question'); t.options = kept.map((o) => o.t); t.answer = Math.max(0, kept.findIndex((o) => o.j === right)); t.why = v('why');
      break;
    }
    case 'independent': t.support = lines('support', 3, 200); t.core = lines('core', 3, 200); t.stretch = lines('stretch', 3, 200); t.answers = v('answers').slice(0, 500); break;
    case 'talk': t.prompt = v('prompt'); t.starter = v('starter'); break;
    case 'plenary': t.points = lines('points', 4, 160); t.prompt = v('prompt'); break;
    default: break;
  }
  const n = normSlide(t);
  if (!n) return { err: NEEDS[s.layout] || 'Something this slide needs is missing.' };
  carryExtras(s, n);
  const out = { slide: n };
  if (s.layout === 'title') out.pack = { title: v('ptitle').slice(0, 100) || p.title, objective: v('pobj').slice(0, 240), successCriteria: lines('psc', 4, 160), bigQuestion: v('pbq').slice(0, 200) };
  return out;
}
/* Picture search: the slide's Picture tab, its Background tab, and the whole pack's Background drawer use it. */
function searchBlock(target, hint) {
  const mine = S.ptarget === target, res = mine ? S.pres : null;
  let out = '<form class="lk-ed-form lk-psearch" data-psearch="' + target + '" novalidate><input type="text" name="q" maxlength="120" autocomplete="off" enterkeyhint="search" value="' + esc(mine ? S.pq : '') + '" placeholder="' + esc(hint || 'Search pictures, for example: volcano') + '" aria-label="Search Wikipedia for a picture"><button type="submit" class="btn small primary">' + icon('search') + 'Search</button></form>';
  if (mine && S.pbusy) out += '<p class="fine lk-wait">' + icon('clock') + 'Looking for pictures…</p>';
  else if (mine && S.perr) out += '<p class="notice err">' + esc(S.perr) + '</p>';
  else if (res) {
    out += res.length ? '<div class="lk-pics">' + res.map((x, j) => '<button type="button" class="lk-pick" data-pick="' + j + '" title="' + esc(x.page + (x.desc ? ': ' + x.desc : '')) + '"><img src="' + esc(picURL(x, '500')) + '" alt="" loading="lazy" decoding="async"><span>' + esc(x.page) + '</span></button>').join('') + '</div>'
      : '<p class="fine">No pictures found. Try other words: one thing you can see, for example “lighthouse”.</p>';
  }
  return out + '<div class="lk-up"><label class="btn small">' + icon('upload') + '<span>Upload your own</span><input type="file" accept="image/*" data-upload="' + target + '" hidden></label><span class="fine">or paste a picture here. Your own pictures stay in this browser.</span></div>';
}
function picThumb(pic, cls) {
  const src = picURL(pic, '500');
  return '<figure' + (cls ? ' class="' + cls + '"' : '') + '>' + (pic.up && !src ? '<img data-up="' + esc(pic.up) + '" alt="">' : '<img src="' + esc(src) + '" alt="">') + '</figure>';
}
function picPane(p, s) {
  const pic = safePic(s.pic);
  let h = s.video ? '<p class="lk-tip2">' + icon('info') + '<span>This slide shows its video. Remove the video (Video tab) to show a picture here.</span></p>' : '';
  if (pic) {
    h += '<div class="lk-now">' + picThumb(pic) + '<div class="lk-now-t"><b>' + esc(pic.page || pic.alt || 'Your picture') + '</b><span class="fine">' + esc(creditText(pic, false)) + '</span>' +
      (pic.up ? '<span class="fine">Kept in this browser, up to 1,920 pixels wide.</span>' : '<label class="fld lk-q"><span>Quality</span><select data-ed-quality>' + QUALITY.map(([v, l, d]) => '<option value="' + v + '"' + (String(pic.size || '960') === v ? ' selected' : '') + '>' + l + ': ' + d + '</option>').join('') + '</select></label>') +
      '<div class="lk-now-tools"><div class="seg small" role="group" aria-label="How the picture fits"><button type="button" data-ed-fit="cover" aria-pressed="' + (pic.fit !== 'contain') + '">Fill the space</button><button type="button" data-ed-fit="contain" aria-pressed="' + (pic.fit === 'contain') + '">Show all of it</button></div>' +
      '<button type="button" class="btn small" data-ed="pic-bg">' + icon('palette') + 'Use as background</button><button type="button" class="btn small" data-ed="pic-x">' + icon('trash') + 'Remove</button></div></div></div>';
  } else h += '<p class="fine">No picture on this slide yet. Pick one below.</p>';
  return h + searchBlock('slide') + '<p class="fine">Free pictures from Wikipedia, each with credit to the person who made it. Your search words go to Wikipedia.</p>';
}
function videoPane(p, s) {
  const v = safeVideo(s.video), m = s.media || {};
  let h = '';
  if (v) {
    h += '<div class="lk-now"><figure class="vid"><img src="' + ytThumb(v.id) + '" alt=""></figure><div class="lk-now-t"><b>' + esc(v.title || 'YouTube video') + '</b><span class="fine">' + (v.start ? 'Starts at ' + mmss(v.start) : 'Starts at the beginning') + '. It plays inside the slide when you present.</span>' +
      '<div class="lk-now-tools"><a class="btn small" href="' + esc(ytWatch(v)) + '" target="_blank" rel="noopener noreferrer">' + icon('play') + 'Watch it first</a><button type="button" class="btn small" data-ed="vid-x">' + icon('trash') + 'Remove</button></div></div></div>';
  }
  h += '<ol class="lk-how"><li><a class="btn small" href="' + esc(ytFind(m.video || ((s.title || '') + ' ' + p.input.topic))) + '" target="_blank" rel="noopener noreferrer">' + icon('search') + 'Find a video on YouTube</a><span class="fine">Short videos only, in a new tab.</span></li><li>On the video, press Share, then Copy.</li><li>Paste the link below.</li></ol>' +
    '<form class="lk-vform" id="lk-vid-form" novalidate><label class="fld"><span>YouTube link</span><span class="lk-row tight"><input type="text" name="url" inputmode="url" autocomplete="off" placeholder="https://www.youtube.com/watch?v=…"><button type="button" class="btn small" data-ed="vid-paste">' + icon('copy') + 'Paste</button></span></label>' +
    '<div class="row2"><label class="fld"><span>Name it (optional)</span><input type="text" name="title" maxlength="80" autocomplete="off" placeholder="What the video shows"></label><label class="fld"><span>Start at (optional)</span><input type="text" name="start" maxlength="8" autocomplete="off" placeholder="0:30"></label></div>' +
    '<button type="submit" class="btn primary small">' + icon('video') + (v ? 'Use this video instead' : 'Add the video') + '</button></form>';
  if (ytKey()) {
    h += '<form class="lk-ed-form" id="lk-vsearch" novalidate><input type="text" name="q" maxlength="120" autocomplete="off" value="' + esc(S.vq || m.video || '') + '" placeholder="Search YouTube from here" aria-label="Search YouTube"><button type="submit" class="btn small">' + icon('search') + 'Search</button></form>' +
      (S.vbusy ? '<p class="fine lk-wait">' + icon('clock') + 'Searching…</p>' : S.vres ? (S.vres.length ? '<div class="lk-pics vids">' + S.vres.map((x, j) => '<button type="button" class="lk-pick" data-vpick="' + j + '"><img src="' + ytThumb(x.id) + '" alt="" loading="lazy" decoding="async"><span>' + esc(x.title) + '<small>' + esc(x.ch) + '</small></span></button>').join('') + '</div>' : '<p class="fine">No videos found. Try other words.</p>') : '');
  }
  return h + '<p class="fine">Videos play from youtube-nocookie.com, YouTube’s privacy-enhanced player. Watch a video first: you choose what your class sees.</p>';
}
function lookSwatches(cur, attr, inherit) {
  const id = typeof cur === 'string' ? cur : '', col = cur && cur.c ? cur.c : '';
  return '<div class="lk-sws" role="group" aria-label="Backgrounds">' + (inherit ? '<button type="button" class="lk-sw" ' + attr + '="" aria-pressed="' + !cur + '"><i class="same"></i><span>Same as the lesson</span></button>' : '') +
    LOOKS.map((l) => '<button type="button" class="lk-sw" ' + attr + '="' + l.id + '" aria-pressed="' + (id === l.id) + '"><i style="background:' + l.sw + '"></i><span>' + esc(l.name) + '</span></button>').join('') +
    '<label class="lk-sw colour' + (col ? ' on' : '') + '"><input type="color" ' + attr + '-c value="' + (col || '#FFE8A3').toLowerCase() + '" aria-label="Any colour"><i style="background:' + (col || 'conic-gradient(#E35D5B,#F2C14E,#4FA36B,#2D9C9C,#3E7CC7,#8466C4,#E35D5B)') + '"></i><span>Any colour</span></label></div>';
}
function picLookTools(cur, scope) {
  return '<div class="lk-now">' + picThumb(cur.pic) + '<div class="lk-now-t"><b>Picture background</b><span class="fine">' + esc(creditText(cur.pic, false)) + '</span><div class="lk-now-tools"><div class="seg small" role="group" aria-label="Words on the picture">' +
    '<button type="button" data-shade="light" data-shade-for="' + scope + '" aria-pressed="' + (cur.shade !== 'dark') + '">Light, dark words</button><button type="button" data-shade="dark" data-shade-for="' + scope + '" aria-pressed="' + (cur.shade === 'dark') + '">Dark, white words</button></div></div></div></div>';
}
function bgPane(p, s) {
  const cur = normLook(s.look);
  let h = lookSwatches(cur, 'data-look', true);
  if (cur && cur.pic) h += picLookTools(cur, 'slide');
  h += '<div class="lk-row">' + (safePic(s.pic) ? '<button type="button" class="btn small" data-ed="bg-pic">' + icon('image') + 'Use this slide’s picture</button>' : '') +
    '<button type="button" class="btn small" data-ed="bg-find" aria-expanded="' + (S.ptarget === 'bg') + '">' + icon('search') + 'Find a picture for the background</button>' +
    '<button type="button" class="btn small" data-ed="bg-all">' + icon('layers') + 'Use on every slide</button></div>';
  if (S.ptarget === 'bg') h += searchBlock('bg', 'A background picture, for example: rainforest');
  return h + '<p class="fine">Dark backgrounds turn the words white. Boxes stay light, so every word stays easy to read.</p>';
}
function sizePane(s) {
  const cur = TEXT_SIZES.some((t) => t[0] === s.fs) ? s.fs : 1;
  return '<div class="lk-sizes" role="group" aria-label="Text size">' + TEXT_SIZES.map(([v, l]) => '<button type="button" class="lk-size" data-size="' + v + '" aria-pressed="' + (cur === v) + '"><span style="font-size:' + Math.round(16 * v) + 'px">Aa</span>' + l + '</button>').join('') + '</div>' +
    '<div class="lk-row"><button type="button" class="btn small" data-ed="fs-all">' + icon('layers') + 'Use this size on every slide</button></div><p class="fine">When the words do not fit, the slide makes them a little smaller by itself, so nothing is cut off.</p>';
}
/* The pack's own drawer under the buttons: one background for every slide, and pictures for the whole pack. */
function drawerHTML(p) {
  const head = (ic, t) => '<div class="lk-dr-h"><b>' + icon(ic) + t + '</b><button type="button" class="btn small icon" data-lk="drawer-x" aria-label="Close">' + icon('close') + '</button></div>';
  if (S.drawer === 'looks') {
    const cur = normLook(p.look);
    let h = head('palette', 'Background for every slide') + lookSwatches(cur || (S.theme === 'calm' ? 'calm' : 'bright'), 'data-plook', false);
    if (cur && cur.pic) h += picLookTools(cur, 'pack');
    h += '<div class="lk-row"><button type="button" class="btn small" data-lk="plook-find" aria-expanded="' + (S.ptarget === 'pack') + '">' + icon('search') + 'Find a picture for the background</button></div>';
    if (S.ptarget === 'pack') h += searchBlock('pack', 'A background picture, for example: night sky');
    return h + '<p class="fine">A slide with its own background keeps it (tap the slide, then Background).</p>';
  }
  if (S.drawer === 'pics') {
    const n = p.slides.filter((s) => safePic(s.pic)).length, v = p.slides.filter((s) => safeVideo(s.video)).length;
    return head('image', 'Pictures and videos') + '<p class="lk-count">' + (n ? n + ' slide' + (n === 1 ? ' has' : 's have') + ' a picture' : 'No pictures yet') + (v ? ' · ' + v + ' video' + (v === 1 ? '' : 's') : '') + '.</p>' +
      '<div class="lk-row"><button type="button" class="btn small primary" data-lk="autopics"' + (S.auto ? ' disabled' : '') + '>' + icon('wand') + (S.auto ? 'Finding pictures…' : 'Add pictures for me') + '</button>' + (n ? '<button type="button" class="btn small" data-lk="nopics">' + icon('trash') + 'Remove all pictures</button>' : '') + '</div>' +
      '<p class="fine">“Add pictures for me” picks a free Wikipedia picture for every slide without a diagram. Check each one before you present. To choose your own, tap a slide, then Picture.</p>';
  }
  return '';
}
function paintActions(p, live) {
  const bar = $('#lk-actions', S.view), dr = $('#lk-drawer', S.view);
  if (!bar || !dr) return;
  const ex = isExample(p), keep = $('[data-lk="keep"]', bar), on = !ex && isPinned('lkie', p.id);
  keep.hidden = ex || live; keep.setAttribute('aria-pressed', String(on)); $('span', keep).textContent = on ? 'Kept on Today' : 'Keep on Today';
  $('[data-lk="looks"]', bar).setAttribute('aria-expanded', String(S.drawer === 'looks'));
  $('[data-lk="pics"]', bar).setAttribute('aria-expanded', String(S.drawer === 'pics'));
  const h = live ? '' : drawerHTML(p);
  dr.hidden = !h; dr.innerHTML = h; hydrate(dr);
}
function sheetPanel(p) {
  if (!p.worksheet) {
    return '<div class="lk-nosheet">' + (S.sheetBusy ? '<p>' + icon('clock') + ' Writing the worksheet in three tiers…</p>' : '<p>' + (isExample(p) ? 'No worksheet in this pack.' : 'The worksheet did not come through with this pack.') + '</p>' + (isExample(p) ? '' : '<button type="button" class="btn primary" data-lk="sheet">' + icon('wand') + 'Write the worksheet</button>')) + '<p class="notice" id="lk-sheet-note" hidden></p></div>';
  }
  return '<div class="lk-sheetbar"><div class="seg" role="group" aria-label="Tier">' + TIERS.map(([k, l]) => '<button type="button" data-tier="' + k + '" aria-pressed="' + (S.tier === k) + '">' + l + ' <small>' + (p.worksheet[k] || []).length + '</small></button>').join('') + '</div>' +
    '<label class="lk-ans"><button type="button" class="lsw green" role="switch" aria-checked="' + S.answers + '" data-lk="answers" aria-label="Show answers"><span class="lsw-handle"></span></button><span>Answers</span></label>' +
    '<span class="lk-sheet-acts"><button type="button" class="btn small" data-lk="copysheet">' + icon('copy') + 'Copy this tier</button><button type="button" class="btn small" data-lk="word">' + icon('notes') + 'Word: all 3 tiers + answers</button>' + (isExample(p) ? '' : '<button type="button" class="btn small" data-lk="sheet">' + icon('refresh') + 'Write it again</button>') + '</span></div>' +
    '<p class="notice" id="lk-sheet-note" hidden></p><div class="lk-sheet">' + sheetHTML(p, S.tier, S.answers) + '</div>';
}
function refit() { requestAnimationFrame(() => $$('.lk-grid .sthumb .sl', S.view).forEach(fitSlide)); }
function renderRecent() {
  const list = loadPacks().slice(0, 12), cur = S.pack && S.pack.id;
  const cover = (p) => { const c = coverOfPack(p), src = c ? picURL(c, '500') : ''; return !c ? '' : c.up && !src ? '<img class="rc" data-up="' + esc(c.up) + '" alt="">' : '<img class="rc" src="' + esc(src) + '" alt="" loading="lazy" decoding="async">'; };
  const item = (p, sub, rm) => { const im = cover(p); return '<li><button type="button" class="recent-open' + (im ? ' has-pic' : '') + '" data-open="' + p.id + '"' + (cur === p.id ? ' aria-current="true"' : '') + '>' + im + '<span class="rt"><b>' + esc(p.title) + '</b><span>' + esc(sub) + '</span></span></button>' + (rm ? '<button type="button" class="icon-btn" data-drop="' + p.id + '" aria-label="Remove ' + esc(p.title) + '">' + icon('trash') + '</button>' : '') + '</li>'; };
  const box = $('#lk-recent', S.view);
  box.innerHTML = list.map((p) => item(p, p.input.year + ' · ' + p.input.subjectName + ' · ' + new Date(p.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), true)).join('') + item(EX, 'Example · ' + EX.input.year + ' · ' + EX.input.subjectName, false);
  hydrate(box);
}

/* ---------------- changing slides (plain English, with undo) ---------------- */
function hist(p) { if (!S.hist.has(p.id)) S.hist.set(p.id, { undo: [], redo: [] }); return S.hist.get(p.id); }
function own() {
  // the example is shared: changing it makes the teacher's own copy first
  if (!isExample(S.pack)) return S.pack;
  const copy = JSON.parse(JSON.stringify(S.pack));
  copy.id = 'p' + Date.now().toString(36); copy.at = Date.now(); copy.key = ''; copy.title = S.pack.title;
  S.pack = copy; S.origin = 'saved'; savePack(copy); renderRecent();
  return copy;
}
function run(p, op, back) {
  const sl = p.slides;
  if (op.t === 'replace') sl[op.i] = back ? op.before : op.after;
  else if (op.t === 'insert') { if (back) sl.splice(op.i, 1); else sl.splice(op.i, 0, op.slide); }
  else if (op.t === 'remove') { if (back) sl.splice(op.i, 0, op.slide); else sl.splice(op.i, 1); }
  else if (op.t === 'move') { const [a, b] = back ? [op.to, op.from] : [op.from, op.to]; const [x] = sl.splice(a, 1); sl.splice(b, 0, x); }
  else if (op.t === 'pack') Object.assign(p, clone(back ? op.before : op.after));
  else if (op.t === 'multi') (back ? op.ops.slice().reverse() : op.ops).forEach((o) => run(p, o, back));
}
function apply(op) { const p = own(), h = hist(p); run(p, op, false); h.undo.push(op); h.redo.length = 0; savePack(p); }
function undo(redo) {
  const p = S.pack, h = hist(p), op = (redo ? h.redo : h.undo).pop();
  if (!op) return;
  run(p, op, !redo); (redo ? h.undo : h.redo).push(op); savePack(p);
  const at = op.t === 'move' ? (redo ? op.to : op.from) : op.t === 'multi' ? (op.ops.find((o) => o.i != null) || {}).i : op.i;
  S.sel = Math.min(at == null ? S.sel : at, p.slides.length - 1);
  renderPack(); sfx('page');
}
function edNote(msg, err) { const n = $('#lk-ed-note', S.view); if (!n) return; n.textContent = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }
async function editSlide(command, intentId) {
  const i = S.sel;
  if (i < 0 || S.editing || S.busy) return;
  const g = editState();
  if (!g.ok) { edNote(g.why === 'busy' ? 'Wait until the pack is ready.' : g.why === 'gap' ? 'One change every ' + LIMITS.editGap / 1000 + ' seconds. Try again in ' + Math.ceil(g.left / 1000) + ' seconds.' : 'That is ' + LIMITS.editHour + ' changes in the last hour, the most for one hour. Ready again at ' + clockAt(g.left) + '.'); return; }
  if (!hasKey()) { edNote(needKeyText(), true); bus.emit('need-key'); return; }
  const it = intentOf(command, intentId), base = S.pack, t = editStart();
  S.editing = true; renderPack(); edNote('Changing slide ' + (i + 1) + ': ' + (command || it.label) + '…');
  let ok = false;
  try {
    const raw = await askJSON(editRequest({ pack: base, index: i, command: command || it.label, intent: it.id }), { system: EDIT_SYSTEM, model: CONFIG.quickModel, maxTokens: 2200 });
    const s = normSlide(raw && raw.slide ? raw.slide : raw);
    if (!s) throw { code: 'invalid_json' };
    if (S.pack !== base && !(isExample(base) && !isExample(S.pack))) throw { code: 'cancelled' };
    if (it.id === 'add') { apply({ t: 'insert', i: i + 1, slide: s }); S.sel = i + 1; } else apply({ t: 'replace', i, before: S.pack.slides[i], after: carryExtras(S.pack.slides[i], s) });
    ok = true;
    track('edit', { eng: 'lkie', intent: it.id });
    sfx('success');
  } catch (e) {
    const code = e && e.code;
    if (code !== 'cancelled') { sfx('error'); setTimeout(() => edNote(errorCopy(code, 'the change'), true), 0); }
  } finally {
    editEnd(t, ok); S.editing = false; renderPack();
    if (ok) { const c = $('.scard[data-i="' + S.sel + '"]', S.view); if (c) { c.classList.add('flash'); c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  }
}

/* ---------------- pictures, videos, backgrounds and text size (all with undo) ---------------- */
function editSel(mut) {
  const p = S.pack, i = S.sel, s = p && p.slides[i];
  if (!s || S.live) return false;
  const n = clone(s);
  mut(n);
  apply({ t: 'replace', i, before: s, after: n });
  return true;
}
function packOp(after) {
  const p = S.pack, before = {};
  Object.keys(after).forEach((k) => { before[k] = p[k] === undefined ? null : clone(p[k]); });
  apply({ t: 'pack', before, after: clone(after) });
}
function note(msg, err) { if ($('#lk-ed-note', S.view)) edNote(msg, err); else if (msg) toast(msg); }
const defaultQuery = (p, s) => str((s.media && (s.media.image || s.media.wiki)) || (s.layout === 'title' ? p.input.topic : (s.title || '') + ' ' + p.input.topic)).slice(0, 120);
function setEdTab(id) {
  const p = S.pack, s = p.slides[S.sel];
  if (!s) return;
  S.ed = ED_TABS.some((t) => t[0] === id) ? id : 'ai';
  if (S.ptarget === 'bg' && S.ed !== 'bg') { S.ptarget = ''; S.pres = null; }
  const key = p.id + ':' + S.sel;
  if (S.ed === 'pic' && (S.ptarget !== 'slide' || S.pfor !== key)) { S.pfor = key; picSearch(defaultQuery(p, s), 'slide'); return; }
  renderPack();
}
function openMedia(i, kind) {
  if (S.live || !S.pack.slides[i]) return;
  S.sel = i; S.ptarget = ''; S.pres = null;
  setEdTab(kind === 'video' ? 'video' : 'pic');
  const ed = $('.lk-ed', S.view); if (ed) ed.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
async function picSearch(q, target) {
  q = str(q).slice(0, 120);
  S.ptarget = target; S.pq = q; S.perr = ''; S.pres = null;
  if (!q) { renderPack(); return; }
  S.pbusy = true; renderPack();
  try { S.pres = (await searchPictures(q, 16)).slice(0, 12); }
  catch (e) { S.pres = null; S.perr = 'Wikipedia could not be reached. Check the internet connection, or upload your own picture.'; }
  S.pbusy = false;
  if (S.ptarget === target && S.pq === q) renderPack();
}
function usePicture(pic, target) {
  const keep = keepPic(pic, { size: pic.up ? '1280' : '960', fit: 'cover' });
  if (target === 'pack') { packOp({ look: { pic: keep, shade: 'light' } }); S.ptarget = ''; S.pres = null; toast('Every slide now has this picture behind it.'); }
  else if (target === 'bg') { editSel((n) => { n.look = { pic: keep, shade: 'light' }; }); S.ptarget = ''; S.pres = null; }
  else editSel((n) => { n.pic = keep; });
  sfx('success'); renderPack();
}
async function uploadTo(file, target) {
  if (!S.pack || S.live) return;
  note('Adding your picture…');
  try { usePicture(await savePicture(file), target); note(''); }
  catch (e) {
    const m = e && e.message;
    note(m === 'too-big' ? 'That picture is too big. Choose one under 30 MB.' : m === 'no-space' ? 'This browser is out of space for pictures. Remove a pack you no longer need, then try again.' : 'That file could not be opened as a picture. Try a JPG or PNG.', true);
  }
}
function addVideo(form) {
  const el = form.elements, v = youTube(el.url.value), st = str(el.start.value);
  if (!v) { edNote(str(el.url.value) ? 'That is not a YouTube link. On the video press Share, then Copy, and paste it here.' : 'Paste the YouTube link first.', true); el.url.focus(); return; }
  const start = st ? seconds(st) : v.start;
  if (st && !start && !/^0+(?::0+)?s?$/.test(st)) { edNote('Write the start time like 1:30 (1 minute 30 seconds).', true); el.start.focus(); return; }
  editSel((n) => { n.video = { id: v.id, start, title: str(el.title.value).slice(0, 80) }; });
  sfx('success'); renderPack(); toast('Video added. It plays inside the slide when you present.');
}
async function pasteLink() {
  const inp = $('#lk-vid-form input[name="url"]', S.view);
  if (!inp) return;
  try {
    const t = str(await navigator.clipboard.readText()).slice(0, 300);
    inp.value = t;
    edNote(youTube(t) ? 'Link pasted. Now press Add the video.' : 'What you copied is not a YouTube link. On the video press Share, then Copy.', !youTube(t));
  } catch (e) { inp.focus(); edNote('Paste it by hand: press Ctrl+V, or Cmd+V on a Mac.'); }
}
async function videoSearch(q) {
  S.vq = str(q).slice(0, 120);
  if (!S.vq) return;
  S.vbusy = true; S.vres = null; renderPack();
  try { S.vres = await ytSearch(S.vq); } catch (e) { S.vres = null; setTimeout(() => edNote('YouTube could not be reached. Use Find a video on YouTube instead.', true), 0); }
  S.vbusy = false; renderPack();
}
function setSlideLook(v) { editSel((n) => { const l = normLook(v); if (l) n.look = l; else delete n.look; }); renderPack(); }
function setPackLook(v) { packOp({ look: normLook(v) }); renderPack(); }
function saveText(form) {
  const p = S.pack, i = S.sel, s = p.slides[i];
  if (!s) return;
  const r = readText(form, p, s);
  if (r.err) { edNote(r.err, true); return; }
  const ops = [{ t: 'replace', i, before: s, after: r.slide }];
  if (r.pack) { const before = {}; Object.keys(r.pack).forEach((k) => { before[k] = clone(p[k] == null ? '' : p[k]); }); ops.push({ t: 'pack', before, after: clone(r.pack) }); }
  apply(ops.length > 1 ? { t: 'multi', ops } : ops[0]);
  sfx('success'); renderPack(); toast('Slide ' + (i + 1) + ' saved. Undo is always there.');
}
/* Up to five pictures for a new pack, chosen from the engine's Wikipedia titles and search words. Slides with a
   diagram keep the diagram alone. The pack opens first; pictures appear one by one. */
/* Every kind of slide gets a matching picture unless it has a diagram (exact teaching content) or a video. Busy slides
   (questions, tiers, options) give the picture less room (lkie.css), so the words stay big. */
const AUTO = ['title', 'recap', 'hook', 'vocab', 'concept', 'guided', 'check', 'independent', 'talk', 'plenary', 'exit'];
async function autoPictures(p, manual) {
  if (!p || S.auto) return;
  const used = new Set(p.slides.map((s) => s.pic && s.pic.file).filter(Boolean));
  const want = p.slides.filter((s) => AUTO.includes(s.layout) && !s.diagram && !s.pic && !s.video && !s.noPic).slice(0, 16);
  if (!want.length) { if (manual) toast('The slides that suit a picture already have one, or a diagram.'); return; }
  S.auto = p.id; if (S.pack === p) paintActions(p, false);
  let n = 0;
  for (const s of want) {
    const m = s.media || {};
    const terms = m.image || (s.layout === 'title' ? '' : [s.title, p.input.topic].filter(Boolean).join(' '));
    const pic = await findPicture({ wiki: m.wiki, terms, also: s.layout === 'title' || !m.wiki ? p.input.topic : '', avoid: used }).catch(() => null);
    const i = p.slides.indexOf(s);
    if (!pic || i < 0 || s.pic) continue;
    used.add(pic.file);
    s.pic = keepPic(pic, { size: '960', fit: 'cover', auto: 1 });
    n++;
    if (!isExample(p)) savePack(p);
    if (S.pack === p) refreshThumb(i);
  }
  S.auto = null;
  if (S.view) renderRecent();
  if (S.pack === p && S.view) { paintActions(p, !!S.live); if (S.sel >= 0 && !typing()) renderPack(); sweepCredits(p); }
  if (manual) toast(n ? n + (n === 1 ? ' picture' : ' pictures') + ' added. Check each one before you present.' : 'No suitable pictures were found. Tap a slide, then Picture, to search yourself.');
}
const typing = () => { const a = document.activeElement; return !!(a && S.view && S.view.contains(a) && /^(?:INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };
function refreshThumb(i) {
  if (!S.view || S.tab !== 'slides' || S.live) return;
  const p = S.pack, s = p.slides[i], card = $('.scard[data-i="' + i + '"]', S.view);
  if (!card || !s) return;
  const th = $('.sthumb', card), m = $('.lk-media', card);
  th.innerHTML = slideHTML(p, s, i, { reveal: s.layout === 'guided' ? 99 : 0, mode: prefs.mode, theme: S.theme });
  if (m) m.innerHTML = mediaLinks(s, i);
  hydrate(th); fitSlide(th.firstElementChild);
}
/* Each Wikipedia picture shows who made it and its licence; the details arrive a moment after the picture. */
const credited = new WeakSet();
function sweepCredits(p) {
  const pics = [], add = (pic) => { if (pic && !pic.up && pic.file && !pic.by && !credited.has(pic)) { credited.add(pic); pics.push(pic); } };
  (p.slides || []).forEach((s) => { add(s.pic); if (s.look) add(s.look.pic); });
  if (p.look) add(p.look.pic);
  if (!pics.length) return;
  Promise.all(pics.map((x) => creditFor(x))).then(() => {
    if (!pics.some((x) => x.by)) return;
    if (!isExample(p)) savePack(p);
    if (S.pack !== p || S.live || !S.view) return;
    if (S.sel >= 0 && !typing()) renderPack(); else p.slides.forEach((s, i) => { if (s.pic && pics.includes(s.pic)) refreshThumb(i); });
  });
}
function playVideo(fig) {
  const v = safeVideo({ id: fig && fig.dataset.vid, start: Number(fig && fig.dataset.start) || 0 });
  if (!v) return;
  fig.removeAttribute('data-vid'); fig.classList.add('playing');
  fig.innerHTML = '<iframe src="' + esc(ytEmbed(v)) + '" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  sfx('page');
}

/* ---------------- the worksheet on its own ---------------- */
async function writeSheet() {
  const p = S.pack;
  if (isExample(p) || S.sheetBusy || S.busy) return;
  const note = (m, err) => { const n = $('#lk-sheet-note', S.view); if (n) { n.textContent = m; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !m; } };
  const g = editState();
  if (!g.ok) { note(g.why === 'gap' ? 'Try again in ' + Math.ceil(g.left / 1000) + ' seconds.' : waitText(Object.assign({}, g, { why: g.why === 'hour' ? 'hour' : g.why }))); return; }
  if (!hasKey()) { note(needKeyText(), true); bus.emit('need-key'); return; }
  const t = editStart();
  S.sheetBusy = true; const keep = p.worksheet; p.worksheet = null; renderPack();
  let ok = false;
  try {
    const raw = await askJSON(sheetRequest({ year: p.input.year, subject: p.input.subject, subjectName: p.input.subjectName, topic: p.input.topic, objective: p.objective, successCriteria: p.successCriteria, vocab: p.vocab, bigQuestion: p.bigQuestion, rules: p.input.rules }), { system: SHEET_SYSTEM, model: CONFIG.quickModel, maxTokens: 6000 });
    const w = normSheet(raw);
    if (!w) throw { code: 'invalid_json' };
    p.worksheet = w; ok = true; savePack(p); sfx('success');
  } catch (e) { p.worksheet = keep; sfx('error'); setTimeout(() => note(errorCopy(e && e.code, 'the worksheet'), true), 0); }
  finally { editEnd(t, ok); S.sheetBusy = false; renderPack(); }
}

/* ---------------- unit planner ---------------- */
async function gapsFor(u) {
  try {
    const packs = new Map(loadPacks().map((p) => [p.id, p]));
    const tickets = (await evAll()).filter((e) => e.k === 'ticket' && e.eng === 'lkie');
    return u.lessons.map((l) => {
      const p = l.pack && packs.get(l.pack);
      if (!p) return null;
      const faces = [0, 0, 0, 0, 0];
      tickets.filter((t) => t.title === p.title).forEach((t) => (t.faces || []).forEach((c, i) => { faces[i] += c || 0; }));
      const votes = faces.reduce((a, b) => a + b, 0), mood = moodOf(faces);
      return votes >= 3 && mood < 3.5 ? { n: l.n, title: l.title, mood: Math.round(mood * 10) / 10 } : null;
    }).filter(Boolean);
  } catch (e) { return []; }
}
function unitNote(m, err) { const n = $('#lku-notice', S.view); n.textContent = m; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !m; }
function paintTotal() { const n = Number($('#lku-weeks', S.view).value) * Number($('#lku-per', S.view).value); $('#lku-fine', S.view).textContent = Math.min(25, n) + ' lessons' + (n > 25 ? ' (25 is the most in one unit)' : '') + '. Each lesson is made when you press its Make button.'; }
async function planUnit() {
  if (S.unitBusy || S.busy) return;
  unitNote('');
  const name = str($('#lku-topic', S.view).value).slice(0, 120);
  if (!name) { unitNote('Type the unit first, for example “Place value to 10,000”.', true); $('#lku-topic', S.view).focus(); return; }
  const g = makeState('lkie-unit');
  if (!g.ok) { repaint(); unitNote(waitText(g)); return; }
  if (!hasKey()) { unitNote(needKeyText(), true); bus.emit('need-key'); return; }
  const subject = subjectNow(), s = SUBJECT_BY_ID[subject], req = { year: yearNow(), subject, subjectName: s.name, unit: name, weeks: Number($('#lku-weeks', S.view).value) || 6, perWeek: Number($('#lku-per', S.view).value) || 2, rules: str($('#lk-rules', S.view).value) };
  const list = match(subject, req.year, name, 14), ticket = makeStart('lkie-unit');
  S.unitBusy = true; $('span', $('#lku-go', S.view)).textContent = 'Planning the unit…'; $('#lku-go', S.view).disabled = true; sfx('send');
  let outcome = 'error';
  try {
    const raw = await askJSON(unitRequest(Object.assign({ list }, req)), { system: UNIT_SYSTEM, model: CONFIG.mainModel, maxTokens: 7000 });
    const u = normUnit(raw, req, list);
    if (!u) throw { code: 'invalid_json' };
    u.checks = checkUnit(u, []);
    S.unit = u; saveUnit(u); outcome = 'ok';
    track('unit', { eng: 'lkie', title: u.unit, year: req.year, subject: s.name, lessons: u.lessons.length });
    renderUnit(); sfx('success'); toast('Your unit plan is ready. Check it, then make each lesson.');
  } catch (e) {
    const code = e && e.code;
    if (code === 'cancelled') outcome = 'stopped'; else { sfx('error'); unitNote(errorCopy(code, 'the unit plan'), true); }
  } finally {
    S.unitBusy = false; $('#lku-go', S.view).disabled = false; $('span', $('#lku-go', S.view)).textContent = 'Plan the unit';
    makeEnd(ticket, outcome); repaint();
  }
}
function renumber(u, order) {
  // order: old lesson numbers in their new order
  const map = new Map(order.map((old, i) => [old, i + 1]));
  u.lessons = order.map((old) => u.lessons.find((l) => l.n === old)).filter(Boolean);
  u.lessons.forEach((l, i) => {
    l.n = i + 1;
    l.buildsOn = l.buildsOn.map((x) => map.get(x)).filter((x) => x && x < l.n);
    l.targets = l.targets.map((x) => map.get(x)).filter((x) => x && x < l.n);
  });
}
async function recheck() { const u = S.unit; if (!u) return; u.checks = checkUnit(u, await gapsFor(u)); saveUnit(u); renderUnit(); }
function renderUnit() {
  const box = $('#lku-out', S.view), u = S.unit;
  if (!box) return;
  const units = loadUnits();
  if (!u) { box.innerHTML = units.length ? '<p class="fine lku-pick">Your units: ' + units.map((x) => '<button type="button" class="linkbtn" data-unit-open="' + x.id + '">' + esc(x.unit) + '</button>').join(' · ') + '</p>' : ''; return; }
  const packs = new Set(loadPacks().map((p) => p.id)), TYPE = { teach: 'Teach', recap: 'Recap', assess: 'Assess' };
  box.innerHTML = '<div class="lku"><div class="lku-head"><h3>' + esc(u.unit) + '</h3>' + (u.bigQuestion ? '<p class="lku-bq">' + icon('spark') + esc(u.bigQuestion) + '</p>' : '') + (u.summary ? '<p class="fine">' + esc(u.summary) + '</p>' : '') + '</div>' +
    '<ul class="lku-checks">' + (u.checks || []).map((c) => '<li class="' + (c.ok ? 'ok' : 'warn') + (c.fixed ? ' fixed' : '') + '">' + icon(c.ok ? 'check' : 'info') + '<span>' + esc(c.text) + '</span></li>').join('') + '</ul>' +
    '<ol class="lku-list">' + u.lessons.map((l, i) => '<li class="lku-l t-' + l.type + '" data-n="' + l.n + '"><div class="lku-row"><span class="lku-n">' + l.n + '</span><select data-u="type" aria-label="Lesson ' + l.n + ' type">' + Object.keys(TYPE).map((k) => '<option value="' + k + '"' + (k === l.type ? ' selected' : '') + '>' + TYPE[k] + '</option>').join('') + '</select>' +
      '<input data-u="title" value="' + esc(l.title) + '" aria-label="Lesson ' + l.n + ' title" maxlength="100"></div>' +
      (l.objective ? '<p class="lku-obj">' + esc(l.objective) + '</p>' : '') +
      '<p class="lku-meta">' + [l.codes.length ? l.codes.join(', ') : '', l.buildsOn.length ? 'builds on ' + l.buildsOn.join(', ') : '', l.targets.length ? (l.type === 'assess' ? 'checks ' : 'revisits ') + l.targets.join(', ') : '', l.vocab.length ? 'new words: ' + l.vocab.slice(0, 4).join(', ') : ''].filter(Boolean).map(esc).join(' · ') + '</p>' +
      '<div class="lku-act"><button type="button" class="btn small icon" data-u="up" aria-label="Move earlier"' + (i ? '' : ' disabled') + '>' + icon('up') + '</button><button type="button" class="btn small icon" data-u="down" aria-label="Move later"' + (i < u.lessons.length - 1 ? '' : ' disabled') + '><span style="display:inline-block;transform:rotate(180deg)">' + icon('up') + '</span></button>' +
      '<button type="button" class="btn small icon" data-u="del" aria-label="Remove lesson ' + l.n + '">' + icon('trash') + '</button>' +
      (l.pack && packs.has(l.pack) ? '<button type="button" class="btn small" data-u="open">' + icon('play') + 'Open</button>' : '<button type="button" class="btn small" data-u="make">' + icon('wand') + 'Make</button>') + '</div></li>').join('') + '</ol>' +
    '<div class="lku-foot"><button type="button" class="btn small" data-u="add">' + icon('plus') + 'Add a lesson</button><button type="button" class="btn small" data-u="check">' + icon('check') + 'Check the plan</button><button type="button" class="linkbtn" data-u="close">Close</button></div></div>';
  $$('[data-u="make"]', box).forEach((b) => watch(b, { name: 'lkie', plain: true, busy: () => !!S.busy }));
}
function unitAction(e) {
  const t = e.target.closest('[data-u],[data-unit-open]');
  if (!t) return;
  if (t.dataset.unitOpen) { S.unit = loadUnits().find((x) => x.id === t.dataset.unitOpen) || null; renderUnit(); return; }
  const u = S.unit, act = t.dataset.u;
  if (!u) return;
  const li = t.closest('[data-n]'), n = li ? Number(li.dataset.n) : 0, l = u.lessons.find((x) => x.n === n);
  if (act === 'close') { S.unit = null; renderUnit(); return; }
  if (act === 'check') { recheck(); return; }
  if (act === 'add') { u.lessons.push({ n: u.lessons.length + 1, week: u.lessons.length ? u.lessons[u.lessons.length - 1].week : 1, type: 'teach', title: 'New lesson', objective: '', codes: [], buildsOn: u.lessons.length ? [u.lessons.length] : [], targets: [], vocab: [], pack: '' }); saveUnit(u); renderUnit(); return; }
  if (!l) return;
  if (act === 'up' || act === 'down') { const order = u.lessons.map((x) => x.n), i = order.indexOf(n), j = act === 'up' ? i - 1 : i + 1; [order[i], order[j]] = [order[j], order[i]]; renumber(u, order); saveUnit(u); renderUnit(); return; }
  if (act === 'del') { renumber(u, u.lessons.map((x) => x.n).filter((x) => x !== n)); saveUnit(u); renderUnit(); return; }
  if (act === 'open') { const p = loadPacks().find((x) => x.id === l.pack); if (p) { openPack(p, 'saved'); $('#lk-pack', S.view).scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
  if (act === 'make') {
    if (!deliberate(e, t)) return;
    const i = u.lessons.indexOf(l);
    gapsFor(u).then((gaps) => makePack({ topic: l.title, year: u.input.year, subject: u.input.subject, codes: l.codes, unitKey: u.id + ':' + l.n + ':' + l.title, unitText: unitContext(u, i, gaps), unit: u, index: i, fresh: false }));
  }
}

/* ---------------- presenting ---------------- */
let lp = null;
function openPresent(i) {
  const p = S.pack;
  if (!p || S.live) return;
  sfx('present');
  Object.assign(S.pr, { open: true, i: Math.max(0, Math.min(i || 0, p.slides.length - 1)), reveal: 0, t0: Date.now(), seen: 0 });
  lp.hidden = false; document.body.classList.add('presenting');
  bus.emit('present', true);
  renderPresent();
  setTimeout(() => { const b = $('[data-lp="next"]', lp); if (b) b.focus(); }, 30);
}
function renderPresent() {
  const p = S.pack, pr = S.pr, s = p.slides[pr.i], frame = $('#lp-frame', lp);
  pr.seen = Math.max(pr.seen, pr.i);
  frame.innerHTML = slideHTML(p, s, pr.i, { reveal: pr.reveal, mode: prefs.mode, theme: S.theme, present: true });
  hydrate(frame);
  fitSlide(frame.firstElementChild);
  const nx = p.slides[pr.i + 1];                         // the next slide's picture is ready before it is needed
  if (nx && safePic(nx.pic) && !nx.pic.up) { const im = new Image(); im.decoding = 'async'; im.src = picURL(nx.pic); }
  $('#lp-count', lp).textContent = (pr.i + 1) + ' / ' + p.slides.length;
  $('[data-lp="prev"]', lp).disabled = pr.i === 0; $('[data-lp="next"]', lp).disabled = pr.i === p.slides.length - 1;
  const mr = maxReveal(s), rb = $('[data-lp="reveal"]', lp);
  rb.hidden = !mr; rb.disabled = pr.reveal >= mr;
  $('span', rb).textContent = s.layout === 'guided' ? (pr.reveal >= mr ? 'All shown' : 'Next step') : pr.reveal ? 'Revealed' : 'Reveal answers';
  const nb = $('#lp-notes', lp);
  nb.hidden = !pr.notes;
  if (pr.notes) { const a = answersOf(s); nb.innerHTML = '<b>Say:</b> ' + esc(s.say || 'No notes for this slide.') + (a ? '<br><b>Answers:</b> ' + esc(a) : '') + (s.visual ? '<br><b>Picture idea:</b> ' + esc(s.visual) : '') + (safePic(s.pic) ? '<br><b>Picture:</b> ' + esc(creditText(s.pic, false).replace(/^Picture: /, '')) : ''); }
  $('[data-lp="notes"]', lp).setAttribute('aria-pressed', String(pr.notes));
  if (S.kit) S.kit.paint();
}
/* A window resize or full screen only refits the slide, so a playing video keeps playing. */
function refitPresent() { const f = $('#lp-frame', lp); if (f && f.firstElementChild) fitSlide(f.firstElementChild); if (S.kit) S.kit.paint(); }
function lpGo(d) { const pr = S.pr, n = S.pack.slides.length, j = Math.max(0, Math.min(n - 1, pr.i + d)); if (j === pr.i) return; sfx('page'); pr.i = j; pr.reveal = 0; renderPresent(); }
function lpReveal() { const pr = S.pr, s = S.pack.slides[pr.i]; if (pr.reveal < maxReveal(s)) { pr.reveal += 1; renderPresent(); return true; } return false; }
function closePresent() {
  if (!S.pr.open) return;
  const p = S.pack;
  track('present', { eng: 'lkie', title: p.title, ms: Date.now() - (S.pr.t0 || Date.now()), screens: p.slides.length, seen: S.pr.seen + 1, ex: isExample(p) ? 1 : 0 });
  if (S.kit) S.kit.close();
  S.pr.open = false; lp.hidden = true; document.body.classList.remove('presenting');
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
  bus.emit('present', false);
}
function wirePresent() {
  lp = document.createElement('div');
  lp.className = 'spresent lkp'; lp.id = 'lpresent'; lp.hidden = true;
  lp.setAttribute('role', 'dialog'); lp.setAttribute('aria-modal', 'true'); lp.setAttribute('aria-label', 'Presenting the lesson pack');
  lp.innerHTML = presentHTML();
  document.body.appendChild(lp);
  S.kit = presentKit({ root: lp, frame: () => $('#lp-frame', lp), key: () => (S.pack ? S.pack.id : '') + ':' + S.pr.i, title: () => S.pack ? S.pack.title : '', timer: true });
  lp.addEventListener('click', (e) => {
    const vid = e.target.closest('[data-vid]');
    if (vid) { playVideo(vid); return; }
    if (e.target.closest('.lk-vid.playing')) return;
    const b = e.target.closest('[data-lp]');
    if (!b) { if (e.target.closest('#lp-frame')) { if (!lpReveal()) lpGo(1); } return; }
    const a = b.dataset.lp;
    if (a === 'prev') lpGo(-1); else if (a === 'next') lpGo(1); else if (a === 'reveal') lpReveal();
    else if (a === 'notes') { S.pr.notes = !S.pr.notes; renderPresent(); }
    else if (a === 'ticket') bus.emit('ticket', { host: lp, eng: 'lkie', title: S.pack.title, screens: S.pack.slides.filter((x) => x.layout !== 'title').map((x) => x.title).filter(Boolean).slice(0, 8) });
    else if (a === 'full') { try { if (document.fullscreenElement) document.exitFullscreen(); else lp.requestFullscreen(); } catch (er) { /* not allowed */ } }
    else if (a === 'exit') closePresent();
  });
  document.addEventListener('keydown', (e) => {
    if (!S.pr.open) return;
    const k = e.key, play = e.target && e.target.closest && e.target.closest('.lk-play');
    if (play && (k === 'Enter' || k === ' ')) { e.preventDefault(); playVideo(play.closest('[data-vid]')); return; }
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); lpGo(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); lpGo(-1); }
    else if (k === 'r' || k === 'R') lpReveal();
    else if (k === 'n' || k === 'N') { S.pr.notes = !S.pr.notes; renderPresent(); }
    else if (k === 'c' || k === 'C') $('[data-lp="ticket"]', lp).click();
    else if (k === 'f' || k === 'F') $('[data-lp="full"]', lp).click();
    else if (k === 'Escape' && !document.fullscreenElement) closePresent();
  });
  document.addEventListener('fullscreenchange', () => { if (S.pr.open) refitPresent(); });
  window.addEventListener('resize', () => { if (S.pr.open) refitPresent(); });
}

/* ---------------- downloads and copies ---------------- */
async function deliver(blob, name, type) {
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
async function exportPpt(btn) {
  if (!window.PptxGenJS) { toast('The PowerPoint maker is still loading. Please try again in a moment.'); return; }
  const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = icon('download') + '<span>Building…</span>';
  try {
    const blob = await buildPptx(S.pack, { theme: S.theme, mode: prefs.mode });
    const how = await deliver(blob, fileName(S.pack, '.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    if (how !== 'cancelled') { track('ppt', { eng: 'lkie', title: S.pack.title }); toast(how === 'shared' ? 'Shared. On iPhone choose “Save to Files”.' : 'PowerPoint downloaded. It opens in PowerPoint, Keynote and Google Slides, and saves as PDF from any of them.'); }
  } catch (e) { toast('The PowerPoint could not be made. Please try again.'); }
  finally { btn.disabled = false; btn.innerHTML = label; }
}
async function exportWord() {
  const p = S.pack;
  if (!p.worksheet) { S.tab = 'sheet'; renderPack(); toast('This pack has no worksheet yet.'); return; }
  const how = await deliver(sheetDoc(p, TIERS.map((t) => t[0]), true), fileName(p, ' - worksheet.doc'), 'application/msword');
  if (how !== 'cancelled') { track('copy', { eng: 'lkie', what: 'worksheet-word' }); toast('Worksheet downloaded: all three tiers and a teacher answer page. It opens in Word and Google Docs.'); }
}
function copySheet() {
  const p = S.pack; if (!p.worksheet) return;
  const c = sheetText(p, S.tier, S.answers);
  copyOut(c.html, c.text, 'Worksheet copied. Paste it into Google Docs, Word or Teams.');
  track('copy', { eng: 'lkie', what: 'worksheet' });
}
function paintBrief() { $$('[data-lk="brief"]', S.view).forEach((b) => { const sp = $('span', b); if (sp) sp.textContent = S.briefing ? 'Stop' : 'Listen'; b.hidden = !S.pack.teacher || !S.pack.teacher.briefing; }); }
function brief() {
  if (S.briefing) { Voice.stop(); S.briefing = false; paintBrief(); return; }
  const t = S.pack.teacher && S.pack.teacher.briefing;
  if (!t) return;
  Voice.unlock(); S.briefing = true; paintBrief();
  Voice.say(t, { lang: 'en' }).then(() => { S.briefing = false; paintBrief(); });
}
function micTopic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, input = $('#lk-topic', S.view), mic = $('#lk-mic', S.view);
  if (!SR) { notice('Saying the topic needs Chrome, Edge or Safari. You can type it instead.'); return; }
  if (S.rec) { try { S.rec.stop(); } catch (e) { /* ignore */ } return; }
  let rec;
  try { rec = new SR(); rec.lang = subjectNow() === 'bm' ? 'ms-MY' : 'en-GB'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false; } catch (e) { return; }
  S.rec = rec; mic.classList.add('on'); sfx('listen');
  rec.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; input.value = t.replace(/\s+/g, ' ').trim().slice(0, 160); };
  rec.onerror = (e) => { if (e.error === 'not-allowed') notice('Please allow the microphone, then tap the mic again.'); };
  rec.onend = () => { S.rec = null; mic.classList.remove('on'); sfx('unlisten'); updateMatch(); };
  try { rec.start(); } catch (e) { S.rec = null; mic.classList.remove('on'); }
}

/* ---------------- wiring ---------------- */
function guardButtons() {
  watch($('#lk-go', S.view), { name: 'lkie', label: 'Make my lesson pack', icon: SPARK, fine: $('#lk-fine', S.view), busy: () => !!S.busy, idle: 'About a minute. After each pack this button rests for ' + LIMITS.restMin + ' minutes.' });
  watch($('#lku-go', S.view), { name: 'lkie-unit', label: 'Plan the unit', icon: LAYERS, busy: () => S.unitBusy });
}
function wire() {
  const v = S.view, form = $('#lk-form', v);
  form.addEventListener('submit', (e) => e.preventDefault());
  enterMovesOn(form);
  const go = $('#lk-go', v);
  go.addEventListener('click', (e) => { if (deliberate(e, go)) makePack(); });
  const ug = $('#lku-go', v);
  ug.addEventListener('click', (e) => { if (deliberate(e, ug)) planUnit(); });
  $('#lku-topic', v).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.target.blur(); } });
  ['#lku-weeks', '#lku-per'].forEach((s) => $(s, v).addEventListener('change', paintTotal));
  $('#lk-year', v).addEventListener('click', (e) => { const b = e.target.closest('.pill'); if (!b) return; $$('#lk-year .pill', v).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); saveForm(); updateMatch(); });
  $('#lk-subject', v).addEventListener('change', () => { saveForm(); paintTry(); updateMatch(); });
  $('#lk-min', v).addEventListener('change', saveForm);
  $('#lk-rules', v).addEventListener('change', (e) => store.set(RULES, str(e.target.value).slice(0, 600)));
  $('#lk-topic', v).addEventListener('input', () => { clearTimeout(matchT); matchT = setTimeout(updateMatch, 220); });
  $('#lk-try', v).addEventListener('click', (e) => { const b = e.target.closest('[data-try]'); if (!b) return; $('#lk-topic', v).value = b.dataset.try; updateMatch(); });
  $('#lk-cur', v).addEventListener('click', (e) => { const b = e.target.closest('[data-code]'); if (!b) return; const c = b.dataset.code; S.chosen = S.chosen.includes(c) ? S.chosen.filter((x) => x !== c) : S.chosen.concat(c).slice(-3); b.setAttribute('aria-pressed', String(S.chosen.includes(c))); });
  $('#lk-mic', v).addEventListener('click', micTopic);
  $('#lk-stop', v).addEventListener('click', () => { if (S.busy) S.busy.abort(); });
  $('#lku-out', v).addEventListener('click', unitAction);
  $('#lku-out', v).addEventListener('change', (e) => {
    const t = e.target, li = t.closest('[data-n]'), u = S.unit; if (!u || !li) return;
    const l = u.lessons.find((x) => x.n === Number(li.dataset.n)); if (!l) return;
    if (t.dataset.u === 'type') { l.type = t.value; u.checks = checkUnit(u, []); saveUnit(u); renderUnit(); }
    else if (t.dataset.u === 'title') { l.title = str(t.value).slice(0, 100) || l.title; saveUnit(u); }
  });
  $('#lk-recent', v).addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'), d = e.target.closest('[data-drop]');
    if (o) { const p = o.dataset.open === 'example' ? EX : loadPacks().find((x) => x.id === o.dataset.open); if (p) { openPack(p, p === EX ? 'example' : 'saved'); if (window.matchMedia('(max-width: 1060px)').matches) $('#lk-pack', v).scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    else if (d) { dropPack(d.dataset.drop); if (S.pack && S.pack.id === d.dataset.drop) openPack(EX, 'example'); else renderRecent(); }
  });
  $('#lk-pack', v).addEventListener('click', (e) => {
    const tab = e.target.closest('[data-lk-tab]'); if (tab) { S.tab = tab.dataset.lkTab; renderPack(); return; }
    const pres = e.target.closest('[data-present]'); if (pres) { openPresent(Number(pres.dataset.present)); return; }
    const sel = e.target.closest('[data-sel]');
    if (sel && !S.live) {
      const i = Number(sel.dataset.sel);
      S.sel = S.sel === i ? -1 : i;
      if (S.ptarget !== 'pack') { S.ptarget = ''; S.pres = null; }
      if (S.sel >= 0 && S.ed === 'pic') setEdTab('pic'); else renderPack();
      if (S.sel >= 0) { const ed = $('.lk-ed', v); if (ed) ed.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      return;
    }
    if (S.live) return;
    const et = e.target.closest('[data-edtab]'); if (et) { setEdTab(et.dataset.edtab); return; }
    const md = e.target.closest('[data-media]'); if (md) { openMedia(Number(md.dataset.i), md.dataset.media); return; }
    const pk = e.target.closest('[data-pick]'); if (pk) { const x = S.pres && S.pres[Number(pk.dataset.pick)]; if (x) usePicture(x, S.ptarget || 'slide'); return; }
    const vp = e.target.closest('[data-vpick]'); if (vp) { const x = S.vres && S.vres[Number(vp.dataset.vpick)]; if (x) { editSel((n) => { n.video = { id: x.id, start: 0, title: x.title }; }); sfx('success'); renderPack(); } return; }
    const lk = e.target.closest('[data-look]'); if (lk) { setSlideLook(lk.dataset.look); return; }
    const pl = e.target.closest('[data-plook]'); if (pl) { setPackLook(pl.dataset.plook); return; }
    const sz = e.target.closest('[data-size]'); if (sz) { const f = Number(sz.dataset.size); editSel((n) => { if (f === 1) delete n.fs; else n.fs = f; }); renderPack(); return; }
    const fit = e.target.closest('[data-ed-fit]'); if (fit) { editSel((n) => { if (n.pic) n.pic.fit = fit.dataset.edFit === 'contain' ? 'contain' : 'cover'; }); renderPack(); return; }
    const sh = e.target.closest('[data-shade]');
    if (sh) {
      const shade = sh.dataset.shade === 'dark' ? 'dark' : 'light';
      if (sh.dataset.shadeFor === 'pack') { const l = normLook(S.pack.look); if (l && l.pic) setPackLook(Object.assign({}, l, { shade })); }
      else { editSel((n) => { if (n.look && n.look.pic) n.look.shade = shade; }); renderPack(); }
      return;
    }
    const chip = e.target.closest('[data-intent]'); if (chip) { if (deliberate(e, chip)) editSlide('', chip.dataset.intent); return; }
    const ed = e.target.closest('[data-ed]');
    if (ed) {
      const a = ed.dataset.ed, p = S.pack, i = S.sel;
      if (a === 'undo') undo(false); else if (a === 'redo') undo(true);
      else if (a === 'close') { S.sel = -1; S.ed = 'ai'; if (S.ptarget !== 'pack') { S.ptarget = ''; S.pres = null; } renderPack(); }
      else if (a === 'left' && i > 0) { apply({ t: 'move', from: i, to: i - 1 }); S.sel = i - 1; renderPack(); }
      else if (a === 'right' && i < p.slides.length - 1) { apply({ t: 'move', from: i, to: i + 1 }); S.sel = i + 1; renderPack(); }
      else if (a === 'del' && p.slides.length > 5) { apply({ t: 'remove', i, slide: p.slides[i] }); S.sel = Math.min(i, S.pack.slides.length - 1); renderPack(); toast('Slide deleted. Undo brings it back.'); }
      else if (a === 'text-reset') renderPack();
      else if (a === 'pic-x') { editSel((n) => { delete n.pic; }); renderPack(); }
      else if (a === 'pic-bg' || a === 'bg-pic') { editSel((n) => { if (n.pic) { n.look = { pic: n.pic, shade: 'light' }; delete n.pic; } }); S.ed = 'bg'; S.ptarget = ''; S.pres = null; renderPack(); }
      else if (a === 'vid-x') { editSel((n) => { delete n.video; }); renderPack(); }
      else if (a === 'vid-paste') pasteLink();
      else if (a === 'bg-find') { if (S.ptarget === 'bg') { S.ptarget = ''; S.pres = null; renderPack(); } else picSearch(defaultQuery(p, p.slides[i]), 'bg'); }
      else if (a === 'bg-all') {
        const look = normLook(p.slides[i].look) || normLook(p.look) || (S.theme === 'calm' ? 'calm' : 'bright');
        packOp({ look, slides: p.slides.map((x) => { const n = clone(x); delete n.look; return n; }) });
        renderPack(); toast('Every slide now has this background. Undo brings back the old ones.');
      } else if (a === 'fs-all') {
        const f = p.slides[i].fs || 1;
        packOp({ slides: p.slides.map((x) => { const n = clone(x); if (f === 1) delete n.fs; else n.fs = f; return n; }) });
        renderPack(); toast('Every slide now has this text size.');
      }
      return;
    }
    const tier = e.target.closest('[data-tier]'); if (tier) { S.tier = tier.dataset.tier; renderPack(); return; }
    const b = e.target.closest('[data-lk]'); if (!b) return;
    const a = b.dataset.lk;
    if (a === 'present') openPresent(0);
    else if (a === 'ppt') exportPpt(b);
    else if (a === 'word') exportWord();
    else if (a === 'copysheet') copySheet();
    else if (a === 'brief') brief();
    else if (a === 'answers') { S.answers = !S.answers; renderPack(); }
    else if (a === 'sheet') { if (deliberate(e, b)) writeSheet(); }
    else if (a === 'looks' || a === 'pics') { S.drawer = S.drawer === a ? '' : a; if (S.ptarget === 'pack') { S.ptarget = ''; S.pres = null; } paintActions(S.pack, !!S.live); }
    else if (a === 'drawer-x') { S.drawer = ''; if (S.ptarget === 'pack') { S.ptarget = ''; S.pres = null; } paintActions(S.pack, !!S.live); }
    else if (a === 'plook-find') { if (S.ptarget === 'pack') { S.ptarget = ''; S.pres = null; paintActions(S.pack, false); } else picSearch(S.pack.input.topic, 'pack'); }
    else if (a === 'autopics') autoPictures(S.pack, true);
    else if (a === 'nopics') { packOp({ slides: S.pack.slides.map((x) => { const n = clone(x); delete n.pic; return n; }) }); renderPack(); toast('All pictures removed. Undo brings them back.'); }
    else if (a === 'keep' && !isExample(S.pack)) { const on = togglePin('lkie', S.pack.id); paintActions(S.pack, false); toast(on ? 'Kept on Today, with a picture of the topic.' : 'Taken off Today.'); }
  });
  $('#lk-pack', v).addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-upload]')) { const f = t.files && t.files[0]; if (f) uploadTo(f, t.dataset.upload); t.value = ''; }
    else if (t.matches('[data-ed-quality]')) { editSel((n) => { if (n.pic && QUALITY.some((q) => q[0] === t.value)) n.pic.size = t.value; }); renderPack(); }
    else if (t.matches('[data-look-c]')) setSlideLook({ c: t.value });
    else if (t.matches('[data-plook-c]')) setPackLook({ c: t.value });
  });
  document.addEventListener('paste', (e) => {
    if (!S.view || S.view.closest('[hidden]') || S.pr.open || S.live) return;
    const target = S.drawer === 'looks' && S.ptarget === 'pack' ? 'pack' : S.sel >= 0 && S.ed === 'pic' ? 'slide' : S.sel >= 0 && S.ed === 'bg' ? 'bg' : '';
    const f = target && Array.from((e.clipboardData && e.clipboardData.files) || []).find((x) => /^image\//.test(x.type));
    if (!f) return;
    e.preventDefault();
    uploadTo(f, target);
  });
  $('#lk-pack', v).addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('[data-psearch]')) { e.preventDefault(); picSearch(f.elements.q.value, f.dataset.psearch); return; }
    if (f.id === 'lk-text-form') { e.preventDefault(); saveText(f); return; }
    if (f.id === 'lk-vid-form') { e.preventDefault(); addVideo(f); return; }
    if (f.id === 'lk-vsearch') { e.preventDefault(); videoSearch(f.elements.q.value); return; }
    if (e.target.id !== 'lk-ed-form') return;
    e.preventDefault();
    const inp = $('#lk-ed-in', v), cmd = str(inp && inp.value);
    if (!cmd) { edNote('Type what to change, or tap one of the buttons above.'); return; }
    editSlide(cmd.slice(0, 300));
  });
  $('#lk-notice', v).addEventListener('click', (e) => { const f = e.target.closest('[data-lk="fresh"]'); if (f && deliberate(e, f)) { notice(''); makePack(Object.assign({}, S.lastAsk || {}, { fresh: true })); } });
  wireSheet($('#lk-pack', v));
  bus.on('mode', () => { if (S.view && !S.view.closest('[hidden]')) renderPack(); if (S.pr.open) renderPresent(); });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(refit, 150); });
}

/* ---------------- start ---------------- */
/* Today, the calendar or a subject page asked for a lesson on a topic: fill in the year, subject and topic, then wait
   for the teacher's own press of Make (the engine guard only counts real presses). */
function takePrefill() {
  const m = takeMaking('slides');
  if (!m || !S.view) return;
  const year = YEARS.includes(m.year) ? m.year : '', subj = SUBJECT_BY_ID[m.subject] ? m.subject : '';
  if (year) $$('#lk-year .pill', S.view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === year)));
  if (subj) $('#lk-subject', S.view).value = subj;
  if (m.topic) $('#lk-topic', S.view).value = String(m.topic).slice(0, 160);
  paintTry(); updateMatch(); saveForm();
  notice(m.topic ? 'Ready to make “' + String(m.topic).slice(0, 80) + '”. Check the year and subject, then press Make my lesson pack.' : 'Type the topic, then press Make my lesson pack.');
  requestAnimationFrame(() => {
    const f = $('#lk-form', S.view); if (f) f.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const go = m.topic ? $('#lk-go', S.view) : $('#lk-topic', S.view); if (go) go.focus({ preventScroll: true });
  });
}
export function mountLkie(view) {
  if (S.view) { enterLkie(); return; }
  S.view = view;
  view.innerHTML = pageHTML();
  wirePresent();
  restoreForm(); paintTry(); paintTotal(); wire();
  renderRecent(); renderPack();
  const units = loadUnits(); S.unit = units[0] || null; renderUnit();
  guardButtons();
  openFromShelf();
  takePrefill();
  autoPictures(EX);
}
/* The dashboard asked for one of the saved packs. */
function openFromShelf() {
  const id = takeOpen('lkie'), p = id && loadPacks().find((x) => x.id === id);
  if (!p) return;
  openPack(p, 'saved');
  // the Classroom's lesson flow: straight onto the board, full screen where the browser allows it
  if (takePresent('lkie:' + id) && S.pack === p && !S.live) {
    openPresent(0);
    try { if (lp.requestFullscreen && !document.fullscreenElement) lp.requestFullscreen().catch(() => {}); } catch (e) { /* the Full screen button still works */ }
    return;
  }
  requestAnimationFrame(() => { const el = $('#lk-pack', S.view); if (el && window.matchMedia('(max-width: 1060px)').matches) el.scrollIntoView({ block: 'start' }); });
}
export function enterLkie() { repaint(); refit(); renderRecent(); openFromShelf(); takePrefill(); if (S.pack) paintActions(S.pack, !!S.live); }
export const lkiePresentInfo = () => (S.pr.open ? { eng: 'lkie', title: S.pack.title } : null);
