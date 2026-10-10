/* lkie.like: one topic in, a whole lesson out. A 3-step wizard makes a pack (10 to 15 slides with diagrams and media
   ideas, key words, activities, a worksheet in three tiers, teacher notes and a 2-minute spoken briefing), matched to
   the curriculum with checked codes. Slides change in plain English with undo; a unit planner sequences up to 25
   lessons with recaps and assessments; packs open instantly from this device; PowerPoint and Word downloads.
   Every engine button goes through the shared guard (guard.js). */
import { $, $$, esc, str, icon, store, bus, prefs, hasKey, askClaude, askJSON, parseJSON, errorCopy, toast, copyOut, CONFIG, needKeyText } from '../core.js?v=cfc5dfc4';
import { track } from '../track.js?v=cfc5dfc4';
import { sfx } from '../fx/audio.js?v=cfc5dfc4';
import { Voice } from '../fx/voice.js?v=cfc5dfc4';
import { evAll } from '../idb.js?v=cfc5dfc4';
import { moodOf } from '../report.js?v=cfc5dfc4';
import { LIMITS, makeState, makeStart, makeEnd, editState, editStart, editEnd, deliberate, enterMovesOn, watch, waitText, repaint, clockAt } from '../guard.js?v=cfc5dfc4';
import { SUBJECTS, SUBJECT_BY_ID, match, objective } from './curriculum.js?v=cfc5dfc4';
import { PACK_SYSTEM, packRequest, SHEET_SYSTEM, sheetRequest, EDIT_SYSTEM, editRequest, INTENTS, intentOf, UNIT_SYSTEM, unitRequest, unitContext } from './prompts.js?v=cfc5dfc4';
import { normPack, normSlide, normSheet, normUnit, checkUnit, packKey, itemsSoFar, stringSoFar, TIERS, totalMinutes } from './model.js?v=cfc5dfc4';
import { KIND, slideHTML, fitSlide, thumbMeta, vocabHTML, activitiesHTML, notesHTML, sheetHTML, wireSheet, maxReveal, answersOf, learnText } from './render.js?v=cfc5dfc4';
import { buildPptx, sheetDoc, sheetText, fileName } from './export.js?v=cfc5dfc4';
import EXAMPLE from './example.js?v=cfc5dfc4';
import { presentKit, kitButtons } from '../presentkit.js?v=cfc5dfc4';

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
  pr: { open: false, i: 0, reveal: 0, notes: false, t0: 0, seen: 0 }, rec: null
};

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
function savePack(p) { if (isExample(p)) return; writePacks([p].concat(loadPacks().filter((x) => x.id !== p.id)).slice(0, 15)); }
function dropPack(id) { writePacks(loadPacks().filter((x) => x.id !== id)); }
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
    '<div class="seg lk-theme" role="group" aria-label="Slide style"><button type="button" data-lk-theme="bright">Bright</button><button type="button" data-lk-theme="calm">Calm</button></div></div>' +
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
  S.pack = p; S.origin = origin || 'saved'; S.sel = -1; S.tab = 'slides';
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
  $$('[data-lk-theme]', S.view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lkTheme === S.theme)));
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
  refit();
}
function slidesPanel(p, live) {
  const cards = p.slides.map((s, i) => '<article class="scard' + (S.sel === i ? ' sel' : '') + (S.editing && S.sel === i ? ' busy' : '') + '" data-i="' + i + '"><button type="button" class="sthumb" data-sel="' + i + '" aria-pressed="' + (S.sel === i) + '" aria-label="Slide ' + (i + 1) + ': ' + esc(s.title || (KIND[s.layout] || {}).label || '') + '. Select to change it">' + slideHTML(p, s, i, { reveal: s.layout === 'guided' ? 99 : 0, mode: prefs.mode, theme: S.theme }) + '</button>' +
    thumbMeta(s, i) + (live ? '' : '<p class="lk-from"><button type="button" class="linkbtn" data-present="' + i + '">' + icon('play') + 'Present from here</button></p>') + '</article>');
  if (live) for (let k = p.slides.length; k < 12; k++) cards.push('<article class="scard lk-skel" aria-hidden="true"><div class="sthumb"><div class="lk-sk"></div></div><p class="lk-skl"></p></article>');
  // the editor opens right under the slide you picked; with nothing picked, a short hint sits above the slides
  if (!live && S.sel >= 0 && p.slides[S.sel]) cards.splice(S.sel + 1, 0, editorHTML(p));
  return (live || S.sel >= 0 ? '' : editorHTML(p)) + '<div class="sgrid lk-grid">' + cards.join('') + '</div>';
}
function editorHTML(p) {
  const h = S.hist.get(p.id) || { undo: [], redo: [] };
  if (S.sel < 0 || !p.slides[S.sel]) {
    return '<div class="lk-ed idle"><p>' + icon('wand') + '<span><b>Tap a slide to change it.</b> Say what you want in plain English, for example “Make this simpler” or “Add a football analogy”.</span></p>' +
      '<span class="lk-ed-tools">' + (h.undo.length ? '<button type="button" class="btn small" data-ed="undo">' + icon('left') + 'Undo</button>' : '') + (h.redo.length ? '<button type="button" class="btn small" data-ed="redo">Redo' + icon('right') + '</button>' : '') + '</span></div>';
  }
  const s = p.slides[S.sel], k = KIND[s.layout] || KIND.concept;
  return '<div class="lk-ed" role="region" aria-label="Change slide ' + (S.sel + 1) + '"><div class="lk-ed-top"><b>Slide ' + (S.sel + 1) + ' · ' + esc(k.label) + '</b><span class="lk-ed-tools">' +
    '<button type="button" class="btn small icon" data-ed="left" aria-label="Move slide earlier"' + (S.sel === 0 ? ' disabled' : '') + '>' + icon('left') + '</button><button type="button" class="btn small icon" data-ed="right" aria-label="Move slide later"' + (S.sel === p.slides.length - 1 ? ' disabled' : '') + '>' + icon('right') + '</button>' +
    '<button type="button" class="btn small icon" data-ed="del" aria-label="Delete this slide"' + (p.slides.length <= 5 ? ' disabled' : '') + '>' + icon('trash') + '</button>' +
    '<button type="button" class="btn small" data-ed="undo"' + (h.undo.length ? '' : ' disabled') + ' aria-label="Undo">' + icon('refresh') + '<span class="lbl">Undo</span></button><button type="button" class="btn small" data-ed="redo"' + (h.redo.length ? '' : ' disabled') + ' aria-label="Redo"><span class="lbl">Redo</span>' + icon('right') + '</button>' +
    '<button type="button" class="btn small icon" data-ed="close" aria-label="Close the editor">' + icon('close') + '</button></span></div>' +
    '<div class="lk-ed-chips">' + CHIPS.map((id) => { const it = INTENTS.find((x) => x.id === id); return '<button type="button" class="lk-ichip" data-intent="' + id + '"' + (S.editing ? ' disabled' : '') + '>' + esc(it.label) + '</button>'; }).join('') + '</div>' +
    '<form class="lk-ed-form" id="lk-ed-form" novalidate><input type="text" id="lk-ed-in" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="Or type a change: Add a slide on halfway numbers"' + (S.editing ? ' disabled' : '') + '><button type="submit" class="btn primary small" id="lk-ed-go"' + (S.editing ? ' disabled' : '') + '>' + icon('wand') + (S.editing ? 'Changing…' : 'Change it') + '</button></form>' +
    '<p class="notice" id="lk-ed-note" hidden role="status"></p></div>';
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
  const item = (id, title, sub, rm) => '<li><button type="button" class="recent-open" data-open="' + id + '"' + (cur === id ? ' aria-current="true"' : '') + '><b>' + esc(title) + '</b><span>' + esc(sub) + '</span></button>' + (rm ? '<button type="button" class="icon-btn" data-drop="' + id + '" aria-label="Remove ' + esc(title) + '">' + icon('trash') + '</button>' : '') + '</li>';
  $('#lk-recent', S.view).innerHTML = list.map((p) => item(p.id, p.title, p.input.year + ' · ' + p.input.subjectName + ' · ' + new Date(p.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), true)).join('') + item('example', EX.title, 'Example · ' + EX.input.year + ' · ' + EX.input.subjectName, false);
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
}
function apply(op) { const p = own(), h = hist(p); run(p, op, false); h.undo.push(op); h.redo.length = 0; savePack(p); }
function undo(redo) {
  const p = S.pack, h = hist(p), op = (redo ? h.redo : h.undo).pop();
  if (!op) return;
  run(p, op, !redo); (redo ? h.undo : h.redo).push(op); savePack(p);
  S.sel = Math.min(op.t === 'move' ? (redo ? op.to : op.from) : op.i, p.slides.length - 1);
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
    if (it.id === 'add') { apply({ t: 'insert', i: i + 1, slide: s }); S.sel = i + 1; } else apply({ t: 'replace', i, before: S.pack.slides[i], after: s });
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
  fitSlide(frame.firstElementChild);
  $('#lp-count', lp).textContent = (pr.i + 1) + ' / ' + p.slides.length;
  $('[data-lp="prev"]', lp).disabled = pr.i === 0; $('[data-lp="next"]', lp).disabled = pr.i === p.slides.length - 1;
  const mr = maxReveal(s), rb = $('[data-lp="reveal"]', lp);
  rb.hidden = !mr; rb.disabled = pr.reveal >= mr;
  $('span', rb).textContent = s.layout === 'guided' ? (pr.reveal >= mr ? 'All shown' : 'Next step') : pr.reveal ? 'Revealed' : 'Reveal answers';
  const nb = $('#lp-notes', lp);
  nb.hidden = !pr.notes;
  if (pr.notes) { const a = answersOf(s); nb.innerHTML = '<b>Say:</b> ' + esc(s.say || 'No notes for this slide.') + (a ? '<br><b>Answers:</b> ' + esc(a) : '') + (s.visual ? '<br><b>Picture idea:</b> ' + esc(s.visual) : ''); }
  $('[data-lp="notes"]', lp).setAttribute('aria-pressed', String(pr.notes));
  if (S.kit) S.kit.paint();
}
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
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); lpGo(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); lpGo(-1); }
    else if (k === 'r' || k === 'R') lpReveal();
    else if (k === 'n' || k === 'N') { S.pr.notes = !S.pr.notes; renderPresent(); }
    else if (k === 'c' || k === 'C') $('[data-lp="ticket"]', lp).click();
    else if (k === 'f' || k === 'F') $('[data-lp="full"]', lp).click();
    else if (k === 'Escape' && !document.fullscreenElement) closePresent();
  });
  document.addEventListener('fullscreenchange', () => { if (S.pr.open) renderPresent(); });
  window.addEventListener('resize', () => { if (S.pr.open) renderPresent(); });
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
    const th = e.target.closest('[data-lk-theme]'); if (th) { S.theme = th.dataset.lkTheme === 'calm' ? 'calm' : 'bright'; store.set(THEME, S.theme === 'calm' ? 'calm' : ''); renderPack(); return; }
    const pres = e.target.closest('[data-present]'); if (pres) { openPresent(Number(pres.dataset.present)); return; }
    const sel = e.target.closest('[data-sel]'); if (sel && !S.live) { const i = Number(sel.dataset.sel); S.sel = S.sel === i ? -1 : i; renderPack(); if (S.sel >= 0) { const ed = $('.lk-ed', v); if (ed) ed.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } return; }
    const chip = e.target.closest('[data-intent]'); if (chip) { if (deliberate(e, chip)) editSlide('', chip.dataset.intent); return; }
    const ed = e.target.closest('[data-ed]');
    if (ed) {
      const a = ed.dataset.ed, p = S.pack, i = S.sel;
      if (a === 'undo') undo(false); else if (a === 'redo') undo(true);
      else if (a === 'close') { S.sel = -1; renderPack(); }
      else if (a === 'left' && i > 0) { apply({ t: 'move', from: i, to: i - 1 }); S.sel = i - 1; renderPack(); }
      else if (a === 'right' && i < p.slides.length - 1) { apply({ t: 'move', from: i, to: i + 1 }); S.sel = i + 1; renderPack(); }
      else if (a === 'del' && p.slides.length > 5) { apply({ t: 'remove', i, slide: p.slides[i] }); S.sel = Math.min(i, S.pack.slides.length - 1); renderPack(); toast('Slide deleted. Undo brings it back.'); }
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
  });
  $('#lk-pack', v).addEventListener('submit', (e) => {
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
export function mountLkie(view) {
  if (S.view) { enterLkie(); return; }
  S.view = view;
  view.innerHTML = pageHTML();
  wirePresent();
  restoreForm(); paintTry(); paintTotal(); wire();
  renderRecent(); renderPack();
  const units = loadUnits(); S.unit = units[0] || null; renderUnit();
  guardButtons();
}
export function enterLkie() { repaint(); refit(); renderRecent(); }
export const lkiePresentInfo = () => (S.pr.open ? { eng: 'lkie', title: S.pack.title } : null);
