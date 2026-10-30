/* Slide Studio: the original KS2 Lesson Studio, kept whole. Topic → two-way lesson slides with answers,
   teacher notes, a lesson plan, Adapt, unit planning, copying, presenting and a PowerPoint download. */
import { $, $$, esc, str, arr, store, bus, prefs, hasKey, askJSON, errorCopy, toast, copyOut, CONFIG, MAIL_WRAP, HOUSE_WORDS, houseFix } from './core.js?v=3c9d4698';
import { track } from './track.js?v=3c9d4698';
import { fractify, fracSlide } from './fractions.js?v=3c9d4698';
import EXAMPLE_RAW from './slides-example.js?v=3c9d4698';
import { Ribbons } from './fx/ribbons.js?v=3c9d4698';
import { sfx } from './fx/audio.js?v=3c9d4698';
import { timesUp } from './fx/timesup.js?v=3c9d4698';
import { LIMITS, makeState, makeStart, makeEnd, deliberate, enterMovesOn, watch, waitText, repaint } from './guard.js?v=3c9d4698';
import { presentKit } from './presentkit.js?v=3c9d4698';
import { isPinned, togglePin, unpin, takeOpen } from './shelf.js?v=3c9d4698';

const I = {
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  book: '<path d="M3 6.4C6 4.9 9 4.9 12 6.9c3-2 6-2 9-.5v12.5c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6.9v12.5"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  steps: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  pencil: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" class="f"/>',
  talk: '<path d="M4.8 4h8.4a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H8.6l-3.2 3v-3h-.6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M15.2 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-.6v2.8l-3-2.8h-4a2 2 0 0 1-2-2v-2.8"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.6 0-3.1-2-5.4-3.6-7 .1 1.8-.6 3.1-1.8 3.6.2-3.6-1.7-6.8-4.6-9 0 3.7-4 6.2-4 11.7C5 19.3 8 22 12 22z"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6.5v11" stroke-dasharray="2 2.6"/>',
  heart: '<path d="M12 19.4C6.2 15.6 3.6 12.4 3.6 9c0-2.4 1.8-4.2 4.1-4.2 1.7 0 3 1 4.3 2.7 1.3-1.7 2.6-2.7 4.3-2.7 2.3 0 4.1 1.8 4.1 4.2 0 3.4-2.6 6.6-8.4 10.4z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  vote: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/>',
  thumb: '<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7c1.5 0 2.5 1 2.2 2.5L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>',
  play: '<path d="M8 5l11 7-11 7z" class="f"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  wand: '<path d="M5 19l9-9M12 8l3 3"/><path d="M17 3v3M15.5 4.5h3M20 9v2M19 10h2M9 3v2M8 4h2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  plan: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM8.5 11h7M8.5 15h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  notes: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5" class="f"/>',
  pointer: '<path d="M5 3.5 18.5 10l-6 1.8L10 18z"/><path d="M14.5 16.5c1.6 1.2 3.4 1.6 5.5 1.2"/>'
};
const icon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>';

/* ================= lesson vocabulary ================= */
const KINDS = {
  title: { label: "Today's lesson", tone: 'blue', icon: 'flag' },
  starter: { label: 'Starter', tone: 'orange', icon: 'bolt' },
  hook: { label: 'Big question', tone: 'violet', icon: 'spark' },
  vocab: { label: 'Key words', tone: 'teal', icon: 'book' },
  teach: { label: 'New learning', tone: 'blue', icon: 'bulb' },
  example: { label: 'Worked example', tone: 'indigo', icon: 'steps' },
  practice: { label: 'Your turn', tone: 'green', icon: 'pencil' },
  hinge: { label: 'Check point', tone: 'pink', icon: 'target' },
  talk: { label: 'Talk time', tone: 'teal', icon: 'talk' },
  tasks: { label: 'Choose your challenge', tone: 'red', icon: 'flame' },
  exit: { label: 'Exit ticket', tone: 'gold', icon: 'ticket' },
  reflect: { label: 'Reflect', tone: 'violet', icon: 'heart' }
};
const RESPOND = {
  online: { chat: 'Type your answer in the chat', vote: 'Vote: type A, B, C or D in the chat', show: 'Write it on paper and hold it up to the camera', talk: 'Unmute to share, or talk in your breakout room', react: 'Show a thumbs up, sideways or down' },
  class: { chat: 'Write your answer on your whiteboard', vote: 'Hold up 1, 2, 3 or 4 fingers for A, B, C or D', show: 'Show me on your whiteboard', talk: 'Turn and talk to your partner', react: 'Thumbs up, sideways or down' }
};
const RESPOND_ICON = { chat: 'chat', vote: 'vote', show: 'board', talk: 'talk', react: 'thumb' };
const DEFAULT_RESPOND = { title: 'none', starter: 'chat', hook: 'talk', vocab: 'none', teach: 'none', example: 'none', practice: 'show', hinge: 'vote', talk: 'talk', tasks: 'show', exit: 'chat', reflect: 'react' };
const TIMED = new Set(['starter', 'hook', 'practice', 'talk', 'tasks', 'exit']);
const QTYPES = new Set(['starter', 'practice', 'exit']);
const EDGE = '<div class="sl-edge" aria-hidden="true">' + [['red', 14], ['orange', 17], ['yellow', 11], ['green', 16], ['teal', 12], ['blue', 17], ['violet', 13]]
  .map(([c, w]) => '<i style="--w:' + w + ';--c:var(--' + c + ')"></i>').join('') + '</div>';
const tone = (t) => '--k:var(--' + t + ');--kd:var(--' + t + '-d);--kt:var(--' + t + '-t)';

/* ================= state ================= */
const RECENT_KEY = 'ks2-lesson-studio.recent.v1';
const EXAMPLE = normalizeDeck(EXAMPLE_RAW, {});
const state = { deck: EXAMPLE, deckId: 'example', tab: 'slides', busy: null, recent: loadRecent(), unit: [], pr: { open: false, i: 0, reveal: 0, notes: false, timer: null } };
const mode = () => prefs.mode;

/* ================= normalising what Claude returns ================= */
function learnText(obj) { const t = str(obj).replace(/^(to|i can)\s+/i, '').replace(/\.$/, ''); return t ? t.charAt(0).toLowerCase() + t.slice(1) : ''; }
function normSlide(s) {
  if (!s || typeof s !== 'object') return null;
  const type = KINDS[s.type] ? s.type : null;
  if (!type) return null;
  const respond = ['chat', 'vote', 'show', 'talk', 'react', 'none'].includes(s.respond) ? s.respond : DEFAULT_RESPOND[type];
  const o = { type, title: str(s.title), say: str(s.say), minutes: Math.max(0, Math.round(Number(s.minutes) || 0)), respond };
  if (QTYPES.has(type)) {
    o.questions = arr(s.questions).map((q) => ({ q: str(q && q.q), a: str(q && q.a) })).filter((q) => q.q).slice(0, 6);
    if (!o.questions.length) return null;
  } else if (type === 'hook') { o.prompt = str(s.prompt); o.detail = str(s.detail); if (!o.prompt) return null; }
  else if (type === 'vocab') { o.words = arr(s.words).map((w) => ({ word: str(w && w.word), meaning: str(w && w.meaning) })).filter((w) => w.word).slice(0, 6); }
  else if (type === 'teach') { o.points = arr(s.points).map(str).filter(Boolean).slice(0, 6); o.example = str(s.example); if (!o.points.length) return null; }
  else if (type === 'example') { o.problem = str(s.problem); o.steps = arr(s.steps).map(str).filter(Boolean).slice(0, 6); o.answer = str(s.answer); if (!o.problem) return null; }
  else if (type === 'hinge') {
    o.question = str(s.question); o.options = arr(s.options).map(str).filter(Boolean).slice(0, 4);
    let a = s.answer;
    if (typeof a === 'string' && /^[A-D]$/i.test(a.trim())) a = 'ABCD'.indexOf(a.trim().toUpperCase());
    a = Math.round(Number(a));
    o.answer = Number.isFinite(a) ? Math.min(Math.max(a, 0), Math.max(o.options.length - 1, 0)) : 0;
    o.why = str(s.why);
    if (!o.question || o.options.length < 2) return null;
  } else if (type === 'talk') { o.prompt = str(s.prompt); o.starter = str(s.starter); if (!o.prompt) return null; }
  else if (type === 'tasks') {
    ['mild', 'spicy', 'hot'].forEach((k) => { o[k] = arr(s[k]).map(str).filter(Boolean).slice(0, 3); });
    if (!o.mild.length && !o.spicy.length && !o.hot.length) return null;
  } else if (type === 'reflect') { o.prompts = arr(s.prompts).map(str).filter(Boolean).slice(0, 4); if (!o.prompts.length) o.prompts = ['Today I learned …', 'I am still wondering …']; }
  return o;
}
function normalizeDeck(raw, p) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  raw = houseFix(raw);                 // "rounding off", also in lessons saved before the school's words were added
  const plan = raw.plan && typeof raw.plan === 'object' ? raw.plan : {};
  const d = {
    title: str(raw.title) || str(p.topic) || 'Lesson', year: str(raw.year) || str(p.year) || 'Key Stage 2', subject: str(raw.subject) || str(p.subject) || '',
    minutes: Math.round(Number(raw.minutes)) || Number(p.minutes) || 45, objective: str(raw.objective),
    successCriteria: arr(raw.successCriteria).map(str).filter(Boolean).slice(0, 5),
    keywords: arr(raw.keywords).map((k) => ({ word: str(k && k.word), meaning: str(k && k.meaning) })).filter((k) => k.word).slice(0, 6),
    plan: { overview: str(plan.overview), keyQuestions: arr(plan.keyQuestions).map(str).filter(Boolean).slice(0, 8), misconceptions: arr(plan.misconceptions).map(str).filter(Boolean).slice(0, 6), support: str(plan.support), challenge: str(plan.challenge), resources: arr(plan.resources).map(str).filter(Boolean).slice(0, 10) },
    slides: []
  };
  arr(raw.slides).forEach((s) => { const n = normSlide(s); if (n) d.slides.push(n); });
  if (d.slides.length < 3) return null;
  if (d.slides[0].type !== 'title') d.slides.unshift({ type: 'title', title: d.title, say: '', minutes: 1, respond: 'none' });
  return d;
}
const totalMinutes = (d) => d.slides.reduce((t, s) => t + (s.minutes || 0), 0) || d.minutes;

/* ================= slide rendering ================= */
/* In Present mode the pill is a button that opens the class moment (moments.js), carrying what the moment needs:
   the question and options of a check point, or the questions of a starter or exit ticket. */
function momentInfo(d, s) {
  const o = { title: s.title || KINDS[s.type].label, lesson: d.title };
  if (s.type === 'hinge') Object.assign(o, { q: s.question, opts: s.options, answer: s.answer });
  else if (QTYPES.has(s.type)) o.qs = s.questions.map((q) => ({ q: q.q, a: q.a }));
  else if (s.type === 'hook' || s.type === 'talk') o.q = s.prompt;
  return esc(JSON.stringify(o));
}
function respondChip(s, d, pres) {
  const text = s.respond && s.respond !== 'none' ? RESPOND[mode()][s.respond] : '';
  if (!text) return '';
  return pres ? '<span class="sl-respond" role="button" tabindex="0" data-moment="' + s.respond + '" data-info="' + momentInfo(d, s) + '" title="Start this moment on the class screen">' + icon(RESPOND_ICON[s.respond]) + '<span>' + esc(text) + '</span></span>'
    : '<span class="sl-respond">' + icon(RESPOND_ICON[s.respond]) + '<span>' + esc(text) + '</span></span>';
}
function maxReveal(s) { if (QTYPES.has(s.type) || s.type === 'hinge') return 1; if (s.type === 'example') return s.steps.length + (s.answer ? 1 : 0); return 0; }
function bodyHTML(d, s, rv) {
  switch (s.type) {
    case 'title': {
      const sc = d.successCriteria.length ? '<div class="t-sc"><span>Success criteria</span><ul>' + d.successCriteria.map((c) => '<li><i class="box"></i><span>' + esc(c) + '</span></li>').join('') + '</ul></div>' : '';
      const obj = d.objective ? '<p class="t-obj"><b>We are learning to</b> ' + esc(learnText(d.objective)) + '</p>' : '';
      return '<div class="t-wrap"><p class="t-eyebrow">' + esc(d.year) + (d.subject ? ' · ' + esc(d.subject) : '') + '</p><h3 class="t-title">' + esc(d.title) + '</h3>' + obj + sc + '</div>';
    }
    case 'starter': case 'practice': case 'exit':
      return '<ol class="qs' + (s.questions.length > 3 ? ' two' : '') + '">' + s.questions.map((q, j) => '<li><span class="qn">' + (j + 1) + '</span><span class="qt">' + esc(q.q) + '</span><span class="qa' + (rv ? ' on' : '') + '">' + esc(q.a) + '</span></li>').join('') + '</ol>';
    case 'hook': return '<p class="hook-p">' + esc(s.prompt) + '</p>' + (s.detail ? '<p class="hook-d">' + esc(s.detail) + '</p>' : '');
    case 'vocab': { const words = s.words && s.words.length ? s.words : d.keywords; return '<div class="vocab">' + words.map((w) => '<div class="vw"><b>' + esc(w.word) + '</b><span>' + esc(w.meaning) + '</span></div>').join('') + '</div>'; }
    case 'teach': return '<div class="teach' + (s.example ? '' : ' solo') + '"><ul class="pts">' + s.points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' + (s.example ? '<div class="ex-box"><span>Example</span><p>' + esc(s.example) + '</p></div>' : '') + '</div>';
    case 'example': return '<div class="prob">' + esc(s.problem) + '</div><ol class="steps">' + s.steps.map((st, j) => '<li class="' + (rv > j ? 'on' : '') + '">' + esc(st) + '</li>').join('') + '</ol>' + (s.answer ? '<div class="wans' + (rv > s.steps.length ? ' on' : '') + '">Answer: ' + esc(s.answer) + '</div>' : '');
    case 'hinge': return '<p class="hq">' + esc(s.question) + '</p><div class="opts">' + s.options.map((o, j) => '<div class="opt' + (rv ? (j === s.answer ? ' right' : ' dim') : '') + '"><b>' + 'ABCD'[j] + '</b><span>' + esc(o) + '</span></div>').join('') + '</div>' + (rv && s.why ? '<p class="why"><b>Why:</b> ' + esc(s.why) + '</p>' : '');
    case 'talk': return '<p class="talk-p">' + esc(s.prompt) + '</p>' + (s.starter ? '<div class="sbub">' + esc(s.starter) + '</div>' : '');
    case 'tasks': return '<div class="tiers">' + [['mild', 'Mild', 'green', 1], ['spicy', 'Spicy', 'orange', 2], ['hot', 'Hot', 'red', 3]].map(([k, lab, t, n]) => '<div class="tier" style="' + tone(t) + '"><div class="tier-h">' + icon('flame').repeat(n) + '<span>' + lab + '</span></div><ul>' + (s[k] || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div>';
    case 'reflect': return '<ul class="refl">' + s.prompts.map((p) => '<li><span>' + esc(p) + '</span><i></i></li>').join('') + '</ul>';
    default: return '';
  }
}
export function slideHTML(d, s, i, rv, pres) {
  const k = KINDS[s.type];
  return '<div class="sl sl--' + s.type + '" style="' + tone(k.tone) + '">' + EDGE +
    '<div class="sl-head"><span class="sl-kind">' + icon(k.icon) + esc(k.label) + '</span>' + respondChip(s, d, pres) + '</div>' +
    (s.type === 'title' ? '' : '<h3 class="sl-title">' + esc(s.title || k.label) + '</h3>') +
    '<div class="sl-body">' + bodyHTML(d, s, rv) + '</div>' +
    '<div class="sl-foot"><span>' + esc(d.year) + (d.subject ? ' · ' + esc(d.subject) : '') + ' · ' + esc(d.title) + '</span><span>' + (i + 1) + ' / ' + d.slides.length + '</span></div></div>';
}
export function fitSlide(el) {
  const body = el && el.querySelector('.sl-body');
  if (!body) return;
  fractify(el);
  let f = 1;
  el.style.setProperty('--fs', '1');
  while (body.scrollHeight > body.clientHeight + 1 && f > 0.62) { f = Math.round((f - 0.06) * 100) / 100; el.style.setProperty('--fs', String(f)); }
}
export function examplePreview(i) { return slideHTML(EXAMPLE, EXAMPLE.slides[i || 0], i || 0, 0); }
function answersLine(s) {
  if (QTYPES.has(s.type)) return '<p class="sans"><b>Answers:</b> ' + s.questions.map((q, j) => (j + 1) + '. ' + esc(q.a)).join('; ') + '</p>';
  if (s.type === 'hinge') return '<p class="sans"><b>Answer:</b> ' + 'ABCD'[s.answer] + ', ' + esc(s.options[s.answer]) + (s.why ? '. ' + esc(s.why) : '') + '</p>';
  if (s.type === 'example' && s.answer) return '<p class="sans"><b>Answer:</b> ' + esc(s.answer) + '</p>';
  return '';
}

/* ================= lesson view ================= */
function renderLesson() {
  const d = state.deck, isEx = state.deckId === 'example';
  $('#l-eyebrow').textContent = isEx ? 'Example lesson · make your own on the left' : 'Your lesson';
  $('#l-title').textContent = d.title;
  $('#l-obj').textContent = d.objective ? 'We are learning to ' + learnText(d.objective) + '.' : '';
  $('#l-obj').hidden = !d.objective;
  $('#l-chips').innerHTML = [d.year, d.subject, totalMinutes(d) + ' minutes', d.slides.length + ' slides', mode() === 'online' ? 'Online class' : 'In the classroom'].filter(Boolean).map((c) => '<span class="chip">' + esc(c) + '</span>').join('');
  $$('[data-stab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.stab === state.tab)));
  $('#panel-slides').hidden = state.tab !== 'slides';
  $('#panel-plan').hidden = state.tab !== 'plan';
  renderSlides(); renderPlan(); renderRecent(); paintKeep();
}
/* Keep on Today: the lesson stays on the Today page (Kept on Today), with a picture of its topic. */
function paintKeep() {
  const b = $('#a-keep'), ex = state.deckId === 'example', on = !ex && isPinned('slides', state.deckId);
  if (!b) return;
  b.hidden = ex; b.setAttribute('aria-pressed', String(on));
  $('span', b).textContent = on ? 'Kept on Today' : 'Keep on Today';
}
function renderSlides() {
  const d = state.deck, grid = $('#sgrid');
  grid.innerHTML = d.slides.map((s, i) => {
    const k = KINDS[s.type];
    return '<article class="scard"><button type="button" class="sthumb" data-present="' + i + '" aria-label="Present from slide ' + (i + 1) + '">' + slideHTML(d, s, i, s.type === 'example' ? 99 : 0) + '</button>' +
      '<div class="smeta"><span class="sno">' + (i + 1) + '</span><span class="skind" style="' + tone(k.tone) + '">' + esc(k.label) + '</span>' + (s.minutes ? '<span class="smin">' + s.minutes + ' min</span>' : '') + '</div>' +
      (s.say ? '<p class="ssay"><b>Say:</b> ' + esc(s.say) + '</p>' : '') + answersLine(s) + '</article>';
  }).join('');
  requestAnimationFrame(() => $$('.sthumb .sl', grid).forEach(fitSlide));
}
function respondText(s) { return s.respond && s.respond !== 'none' ? RESPOND[mode()][s.respond] : 'Listening'; }
function renderPlan() {
  const d = state.deck, p = d.plan;
  const list = (xs) => '<ul>' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  let h = '<section class="psec"><h3>Learning objective</h3><p>' + esc(d.objective || 'Not set') + '</p>' + (d.successCriteria.length ? '<h4>Success criteria</h4>' + list(d.successCriteria) : '') + (p.overview ? '<h4>Overview</h4><p>' + esc(p.overview) + '</p>' : '') + '</section>';
  h += '<section class="psec"><h3>Lesson flow</h3><div class="tbl-wrap"><table><thead><tr><th>Slide</th><th>Part</th><th>Time</th><th>What happens</th><th>Pupils respond</th></tr></thead><tbody>' +
    d.slides.map((s, i) => '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(KINDS[s.type].label) + '</td><td class="num">' + (s.minutes ? s.minutes + ' min' : '') + '</td><td>' + esc(s.title || KINDS[s.type].label) + '</td><td>' + esc(respondText(s)) + '</td></tr>').join('') +
    '</tbody><tfoot><tr><td></td><td>Total</td><td class="num">' + totalMinutes(d) + ' min</td><td></td><td></td></tr></tfoot></table></div></section>';
  if (p.keyQuestions.length || p.misconceptions.length) h += '<section class="two">' + (p.keyQuestions.length ? '<div class="psec"><h3>Key questions</h3>' + list(p.keyQuestions) + '</div>' : '') + (p.misconceptions.length ? '<div class="psec"><h3>Watch out for</h3>' + list(p.misconceptions) + '</div>' : '') + '</section>';
  if (p.support || p.challenge) h += '<section class="two">' + (p.support ? '<div class="psec"><h3>Support</h3><p>' + esc(p.support) + '</p></div>' : '') + (p.challenge ? '<div class="psec"><h3>Challenge</h3><p>' + esc(p.challenge) + '</p></div>' : '') + '</section>';
  if (d.keywords.length) h += '<section class="psec"><h3>Key words</h3><dl class="kw">' + d.keywords.map((k) => '<dt>' + esc(k.word) + '</dt><dd>' + esc(k.meaning) + '</dd>').join('') + '</dl></section>';
  if (p.resources.length) h += '<section class="psec"><h3>Resources</h3>' + list(p.resources) + '</section>';
  $('#panel-plan').innerHTML = '<div class="plan">' + h + '</div>';
}

/* ================= recent lessons (this browser) ================= */
function loadRecent() { const v = store.getJSON(RECENT_KEY, []); return Array.isArray(v) ? v.filter((x) => x && x.id && x.deck) : []; }
function saveRecent() { store.setJSON(RECENT_KEY, state.recent.slice(0, 40)); bus.emit('shelf'); }
function addRecent(deck) { const id = 'l' + Date.now().toString(36); state.recent.unshift({ id, at: Date.now(), deck }); state.recent = state.recent.slice(0, 40); saveRecent(); return id; }
function renderRecent() {
  const items = state.recent.map((r) => ({ id: r.id, deck: r.deck, sub: r.deck.year + ' · ' + r.deck.subject + ' · ' + new Date(r.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }));
  items.push({ id: 'example', deck: EXAMPLE, sub: 'Example · ' + EXAMPLE.year + ' · ' + EXAMPLE.subject });
  $('#recent').innerHTML = items.map((r) => '<li><button type="button" class="recent-open" data-open="' + r.id + '"' + (r.id === state.deckId ? ' aria-current="true"' : '') + '><b>' + esc(r.deck.title) + '</b><span>' + esc(r.sub) + '</span></button>' +
    (r.id === 'example' ? '' : '<button type="button" class="icon-btn" data-remove="' + r.id + '" aria-label="Remove ' + esc(r.deck.title) + '">' + icon('trash') + '</button>') + '</li>').join('');
  $('#recent-empty').hidden = state.recent.length > 0;
}
function openDeck(id) {
  if (id === 'example') { state.deck = EXAMPLE; state.deckId = 'example'; }
  else { const r = state.recent.find((x) => x.id === id); if (!r) return; const d = normalizeDeck(r.deck, {}); if (!d) return; state.deck = d; state.deckId = id; }
  state.tab = 'slides'; renderLesson(); scrollToLesson();
}
function scrollToLesson() { if (window.matchMedia('(max-width: 1060px)').matches) $('#lesson').scrollIntoView({ block: 'start', behavior: 'smooth' }); }

/* ================= asking Claude ================= */
function lessonPrompt(p) {
  const where = mode() === 'online' ? 'online in a live video class. Pupils can type in the chat, unmute, use reactions and hold work up to the camera' : 'in a classroom. Pupils have mini whiteboards and talk partners';
  return [
    'You are an outstanding primary school teacher in England. Write a ' + p.minutes + '-minute ' + p.subject + ' lesson for ' + p.year + ' (Key Stage 2) pupils.',
    'Topic: ' + p.topic, p.goal ? 'What pupils should learn: ' + p.goal : '', 'The lesson is taught ' + where + '.', '',
    'Follow the National Curriculum for England. Use British English spelling. Write for the age group: short sentences and child-friendly words on the slides.',
    HOUSE_WORDS,
    'Every fact and every answer must be correct. Check all maths twice.',
    'Make it two-way: pupils respond every few minutes (starter, check point, talk time, your turn, exit ticket).',
    'Use this slide order, leaving a type out only if it truly does not fit the subject: title, starter, hook, vocab, teach, example, practice, hinge, talk, tasks, exit, reflect. For a 60-minute lesson you may add a second teach slide.',
    'The "minutes" on the slides must add up to ' + p.minutes + '.', '',
    'Reply with only one JSON object in exactly the format of this example. The example is a different lesson: copy its structure and level of detail, not its content.',
    JSON.stringify(EXAMPLE_RAW), '',
    'Field rules:',
    '- "respond" is one of "chat", "vote", "show", "talk", "react", "none".',
    '- "say" is what the teacher says or asks on that slide, in 1 to 3 sentences.',
    '- starter, practice and exit each have 3 to 5 "questions", each with a short correct answer "a".',
    '- hinge has exactly 4 "options"; "answer" is the index (0 to 3) of the correct one; the wrong options are common mistakes.',
    '- tasks has "mild", "spicy" and "hot" lists of 1 to 3 tasks each, getting harder.',
    '- No images, no emojis, no markdown. Write fractions like 3/4.'
  ].filter((x) => x !== '').join('\n');
}
const ADAPT = {
  easier: { label: 'easier', text: 'Make this lesson easier for pupils who need more support: simpler numbers and words, more modelling, more scaffolding. Keep the same number of slides.' },
  harder: { label: 'more challenging', text: 'Add more challenge for confident pupils: deeper reasoning, problem solving and greater depth questions. Keep the same number of slides.' },
  shorter: { label: '30 minutes long', text: 'Turn this into a 30-minute lesson: keep the most important slides (about 8) and make the minutes add up to 30.' },
  twoway: { label: 'more interactive', text: 'Make this lesson more interactive: add more two-way moments (votes, show me, talk time) so pupils respond at least every 3 minutes.' }
};
function adaptPrompt(d, how) { return 'Here is a Key Stage 2 lesson as JSON:\n' + JSON.stringify(d) + '\n\n' + ADAPT[how].text + '\nKeep exactly the same JSON format, the same topic and the same year group. British English. ' + HOUSE_WORDS + ' Every answer must be correct.\nReply with only the new JSON object.'; }
function setBusy(on, title) {
  $('#busy').hidden = !on;
  $('#f-go').disabled = !!on; $('#u-go').disabled = !!on;
  $$('[data-adapt],[data-unit]').forEach((b) => { b.disabled = !!on; });
  if (on) { $('#busy-title').textContent = title; $('#busy-msg').textContent = 'Thinking about the lesson…'; $('#busy-bar').style.width = '6%'; }
  else repaint();
}

/* ================= the engine guard (guard.js): real presses only, then each Make button rests 5 minutes =================
   Make my slides, Adapt and a unit's Make slides share one rest ('slides'); Plan the unit has its own ('plan'). */
let planning = false;
function guardButtons() {
  watch($('#f-go'), {
    name: 'slides', label: 'Make my slides', icon: I.spark, fine: $('#f-fine'), busy: () => !!state.busy,
    idle: 'Takes about a minute. After each lesson this button rests for ' + LIMITS.restMin + ' minutes.',
    after: (s) => {
      const wait = !s.ok, note = $('#adapt-rest');
      $$('[data-adapt],[data-unit]').forEach((b) => { b.disabled = wait; b.title = wait ? waitText(s) : ''; });
      if (note) { note.hidden = !wait; note.textContent = wait ? waitText(s) : ''; }
    }
  });
  watch($('#u-go'), { name: 'plan', label: 'Plan the unit', icon: I.layers, busy: () => planning || !!state.busy });
}
function showNotice(sel, msg, isErr, html) { const n = $(sel); if (html) n.innerHTML = msg; else n.textContent = msg; n.className = 'notice' + (isErr ? ' err' : ''); n.hidden = !msg; }
function needKey(sel) { showNotice(sel, esc(errorCopy('no_key')), true, true); bus.emit('need-key'); }
async function runLesson(prompt, params, title) {
  if (state.busy) return;
  showNotice('#make-notice', '', false);
  const g = makeState('slides');
  if (!g.ok) { repaint(); showNotice('#make-notice', waitText(g), false); return; }
  if (!hasKey()) { needKey('#make-notice'); return; }
  const ctl = new AbortController();
  const ticket = makeStart('slides');  // the 5 minutes count from this press; given back if no lesson comes back
  state.busy = ctl; setBusy(true, title); scrollToLesson(); sfx('send');
  const expected = 12, t0 = Date.now();
  let made = false, code = '';
  try {
    const raw = await askJSON(prompt, {
      model: CONFIG.mainModel, maxTokens: 8000, signal: ctl.signal,
      onText: (text) => {
        const n = (text.match(/"type"\s*:/g) || []).length;
        $('#busy-msg').textContent = n ? 'Writing slide ' + n + ' of about ' + Math.max(expected, n) + '…' : 'Planning the lesson…';
        $('#busy-bar').style.width = Math.min(96, 10 + (n / expected) * 86) + '%';
      }
    });
    const deck = normalizeDeck(raw, params);
    if (!deck) throw { code: 'invalid_json' };
    made = true;
    state.deck = deck; state.deckId = addRecent(deck); state.tab = 'slides';
    track('deck', { eng: 'slides', title: deck.title, year: deck.year, subject: deck.subject, slides: deck.slides.length, ok: 1, ms: Date.now() - t0 });
    renderLesson(); sfx('success'); toast('Your lesson is ready.');
  } catch (e) {
    code = (e && e.code) || 'error';
    track('deck', { eng: 'slides', title: params && params.topic || '', year: params && params.year || '', ok: 0, err: code, ms: Date.now() - t0 });
    if (code !== 'cancelled') { sfx('error'); showNotice('#make-notice', errorCopy(code, 'the lesson'), true); }
  } finally { state.busy = null; makeEnd(ticket, made ? 'ok' : code === 'cancelled' ? 'stopped' : 'error'); setBusy(false); }
}
function readForm() { return { year: $('#f-year').value, subject: $('#f-subject').value, topic: str($('#f-topic').value), goal: str($('#f-goal').value), minutes: Number($('#f-min').value) || 45 }; }
function makeLesson() {
  const p = readForm();
  if (!p.topic) { showNotice('#make-notice', 'Type a topic first, for example "Fractions of amounts".', true); $('#f-topic').focus(); return; }
  runLesson(lessonPrompt(p), p, 'Making your lesson');
}
function adaptLesson(how) {
  const d = state.deck, menu = $('#adapt-menu'); if (menu) menu.open = false;
  runLesson(adaptPrompt(d, how), { topic: d.title, year: d.year, subject: d.subject, minutes: d.minutes }, 'Making it ' + ADAPT[how].label);
}

/* ================= unit planner ================= */
async function planUnit() {
  const unit = str($('#u-topic').value);
  if (!unit) { showNotice('#u-notice', 'Type a unit first, for example "Fractions".', true); $('#u-topic').focus(); return; }
  if (state.busy || planning) return;
  showNotice('#u-notice', '', false);
  const g = makeState('plan');
  if (!g.ok) { repaint(); showNotice('#u-notice', waitText(g), false); return; }
  if (!hasKey()) { needKey('#u-notice'); return; }
  const n = Number($('#u-n').value) || 4, year = $('#f-year').value, subject = $('#f-subject').value;
  const btn = $('#u-go');
  planning = true; btn.disabled = true; $('span', btn).textContent = 'Planning…';
  const ticket = makeStart('plan');
  let ok = false, code = '';
  try {
    const raw = await askJSON('Plan a sequence of ' + n + ' lessons for ' + year + ' ' + subject + ' in a primary school in England, on the unit "' + unit + '". ' +
      'Build from the basics to harder ideas, following the National Curriculum for England. British English. ' + HOUSE_WORDS + ' ' +
      'Reply with only a JSON array of ' + n + ' objects like {"title": "Equivalent fractions", "objective": "To recognise and show families of equivalent fractions."}.', { model: CONFIG.quickModel, maxTokens: 1500 });
    const list = arr(raw).map((x) => ({ title: str(x && x.title), objective: str(x && x.objective) })).filter((x) => x.title).slice(0, 8);
    if (!list.length) throw { code: 'invalid_json' };
    state.unit = list.map((x) => Object.assign(x, { year, subject }));
    ok = true;
    renderUnit();
  } catch (e) {
    code = (e && e.code) || 'error';
    if (code !== 'cancelled') showNotice('#u-notice', errorCopy(code, 'the plan'), true);
  } finally { planning = false; btn.disabled = false; $('span', btn).textContent = 'Plan the unit'; makeEnd(ticket, ok ? 'ok' : code === 'cancelled' ? 'stopped' : 'error'); }
}
function renderUnit() {
  $('#u-list').innerHTML = state.unit.map((x, i) => '<li><b>' + (i + 1) + '. ' + esc(x.title) + '</b>' + (x.objective ? '<p>' + esc(x.objective) + '</p>' : '') + '<button type="button" class="btn small" data-unit="' + i + '">' + icon('wand') + 'Make slides</button></li>').join('');
  repaint();
}
function makeFromUnit(i) { const x = state.unit[i]; if (!x) return; $('#f-year').value = x.year; $('#f-subject').value = x.subject; $('#f-topic').value = x.title; $('#f-goal').value = x.objective; makeLesson(); }

/* ================= copying ================= */
function quizParts(d) {
  const items = [];
  d.slides.forEach((s) => {
    if (QTYPES.has(s.type)) s.questions.forEach((q) => items.push({ q: q.q, a: q.a }));
    if (s.type === 'hinge') items.push({ q: s.question, opts: s.options, a: 'ABCD'[s.answer] + ') ' + s.options[s.answer] });
  });
  return items;
}
function copyQuiz() {
  const d = state.deck, items = quizParts(d), head = d.title + ' quiz (' + d.year + ' ' + d.subject + ')';
  const text = head + '\n\n' + items.map((it, j) => (j + 1) + '. ' + it.q + (it.opts ? '\n' + it.opts.map((o, k) => '   ' + 'ABCD'[k] + ') ' + o).join('\n') : '') + '\n   Answer: ' + it.a).join('\n\n');
  const html = '<div style="' + MAIL_WRAP + '"><p style="margin:0 0 10px;font-weight:bold;font-size:16px">' + esc(head) + '</p><ol style="margin:0;padding-left:22px">' +
    items.map((it) => '<li style="margin:0 0 10px">' + esc(it.q) + (it.opts ? '<br>' + it.opts.map((o, k) => esc('ABCD'[k] + ') ' + o)).join('<br>') : '') + '<br><span style="color:#357A4D"><b>Answer:</b> ' + esc(it.a) + '</span></li>').join('') + '</ol></div>';
  copyOut(html, text, 'Quiz copied with answers. Paste it into your quiz app or a document.');
}
function copyPlan() {
  const d = state.deck, p = d.plan;
  const rows = d.slides.map((s, i) => ({ n: i + 1, part: KINDS[s.type].label, min: s.minutes, what: s.title || KINDS[s.type].label, how: respondText(s) }));
  const L = (xs) => xs.map((x) => '• ' + x).join('\n');
  const text = [d.title + ': lesson plan', d.year + ' · ' + d.subject + ' · ' + totalMinutes(d) + ' minutes', '', 'Learning objective: ' + (d.objective || ''),
    d.successCriteria.length ? 'Success criteria:\n' + L(d.successCriteria) : '', p.overview ? 'Overview: ' + p.overview : '', '',
    'Lesson flow:', rows.map((r) => r.n + '. ' + r.part + (r.min ? ' (' + r.min + ' min)' : '') + ': ' + r.what + '. Pupils: ' + r.how).join('\n'), '',
    p.keyQuestions.length ? 'Key questions:\n' + L(p.keyQuestions) : '', p.misconceptions.length ? 'Watch out for:\n' + L(p.misconceptions) : '',
    p.support ? 'Support: ' + p.support : '', p.challenge ? 'Challenge: ' + p.challenge : '',
    d.keywords.length ? 'Key words:\n' + d.keywords.map((k) => '• ' + k.word + ': ' + k.meaning).join('\n') : '', p.resources.length ? 'Resources:\n' + L(p.resources) : ''].filter((x) => x !== '').join('\n');
  const H = (t) => '<p style="margin:14px 0 4px;font-weight:bold">' + esc(t) + '</p>';
  const UL = (xs) => '<ul style="margin:0;padding-left:20px">' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const td = 'style="border:1px solid #DAE2ED;padding:6px 8px;text-align:left;vertical-align:top"';
  const html = '<div style="' + MAIL_WRAP + '"><p style="margin:0;font-size:17px;font-weight:bold">' + esc(d.title) + ': lesson plan</p><p style="margin:2px 0 0;color:#6B7280">' + esc(d.year + ' · ' + d.subject + ' · ' + totalMinutes(d) + ' minutes') + '</p>' +
    H('Learning objective') + '<p style="margin:0">' + esc(d.objective || '') + '</p>' + (d.successCriteria.length ? H('Success criteria') + UL(d.successCriteria) : '') + (p.overview ? H('Overview') + '<p style="margin:0">' + esc(p.overview) + '</p>' : '') +
    H('Lesson flow') + '<table style="border-collapse:collapse;font-size:13px"><tr><th ' + td + '>Slide</th><th ' + td + '>Part</th><th ' + td + '>Time</th><th ' + td + '>What happens</th><th ' + td + '>Pupils respond</th></tr>' +
    rows.map((r) => '<tr><td ' + td + '>' + r.n + '</td><td ' + td + '>' + esc(r.part) + '</td><td ' + td + '>' + (r.min ? r.min + ' min' : '') + '</td><td ' + td + '>' + esc(r.what) + '</td><td ' + td + '>' + esc(r.how) + '</td></tr>').join('') + '</table>' +
    (p.keyQuestions.length ? H('Key questions') + UL(p.keyQuestions) : '') + (p.misconceptions.length ? H('Watch out for') + UL(p.misconceptions) : '') + (p.support ? H('Support') + '<p style="margin:0">' + esc(p.support) + '</p>' : '') +
    (p.challenge ? H('Challenge') + '<p style="margin:0">' + esc(p.challenge) + '</p>' : '') + (d.keywords.length ? H('Key words') + UL(d.keywords.map((k) => k.word + ': ' + k.meaning)) : '') + (p.resources.length ? H('Resources') + UL(p.resources) : '') + '</div>';
  copyOut(html, text, 'Lesson plan copied. Paste it into an email or document.');
}

/* ================= PowerPoint ================= */
const FONT = 'Century Gothic';
const PX = { ink: '1B2440', soft: '4A5468', faint: '7A849A', ok: '357A4D' };
const PT = { blue: ['3E7CC7', '2C5E9E', 'EAF1FA'], red: ['E35D5B', 'B8403E', 'FCECEC'], green: ['4FA36B', '357A4D', 'EAF5EE'], teal: ['2D9C9C', '1F7676', 'E6F4F4'], violet: ['8466C4', '6648A8', 'F1EDFA'], orange: ['F28C38', 'B9621C', 'FDF0E4'], pink: ['D9628F', 'A8436C', 'FBEAF1'], indigo: ['4C5FD5', '3445A8', 'ECEFFC'], gold: ['E0A526', '8F6A12', 'FBF3DD'] };
const W = 13.333, H = 7.5;
function pEdge(s) {
  const segs = [['E35D5B', 14], ['F28C38', 17], ['F2C14E', 11], ['4FA36B', 16], ['2D9C9C', 12], ['3E7CC7', 17], ['8466C4', 13]];
  const gap = 0.04, usable = W - gap * (segs.length - 1);
  let x = 0;
  segs.forEach(([c, w]) => { const ww = (usable * w) / 100; s.addShape('rect', { x, y: 0, w: ww, h: 0.1, fill: { color: c }, line: { color: c, width: 0 } }); x += ww + gap; });
}
function pChrome(s, d, sl, m, opts) {
  const k = KINDS[sl.type], t = PT[k.tone];
  pEdge(s);
  const label = k.label.toUpperCase();
  s.addText(label, { x: 0.6, y: 0.38, w: Math.min(4.6, 0.55 + label.length * 0.115), h: 0.38, fontFace: FONT, fontSize: 11, bold: true, color: t[1], fill: { color: t[2] }, shape: 'roundRect', rectRadius: 0.19, align: 'center', valign: 'middle', charSpacing: 1.5, margin: 0 });
  const r = !opts.noRespond && sl.respond && sl.respond !== 'none' ? RESPOND[m][sl.respond] : '';
  if (r) { const rw = Math.min(6.2, 0.6 + r.length * 0.098); s.addText(r, { x: W - 0.6 - rw, y: 0.38, w: rw, h: 0.38, fontFace: FONT, fontSize: 11.5, bold: true, color: 'FFFFFF', fill: { color: t[1] }, shape: 'roundRect', rectRadius: 0.19, align: 'center', valign: 'middle', margin: 0 }); }
  if (!opts.noTitle) s.addText(opts.title || sl.title || k.label, { x: 0.6, y: 0.95, w: W - 1.2, h: 0.85, fontFace: FONT, fontSize: 30, bold: true, color: PX.ink, valign: 'top', fit: 'shrink', margin: 0 });
  s.addText(d.year + (d.subject ? ' · ' + d.subject : '') + ' · ' + d.title, { x: 0.6, y: H - 0.52, w: 9, h: 0.3, fontFace: FONT, fontSize: 10, color: PX.faint, margin: 0 });
  s.slideNumber = { x: W - 1.2, y: H - 0.52, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 10, color: PX.faint, align: 'right' };
  return t;
}
function pQuestions(s, sl, t, withAnswers) {
  const qs = sl.questions, two = qs.length > 3;
  qs.forEach((q, j) => {
    const col = two ? j % 2 : 0, row = two ? Math.floor(j / 2) : j;
    const x = 0.6 + col * 6.2, y = 2.05 + row * (two ? 1.55 : 1.35), w = two ? 5.9 : W - 1.2;
    s.addText(String(j + 1), { x, y, w: 0.52, h: 0.52, shape: 'ellipse', fill: { color: t[0] }, color: 'FFFFFF', bold: true, fontFace: FONT, fontSize: 16, align: 'center', valign: 'middle', margin: 0 });
    s.addText(q.q, { x: x + 0.7, y: y - 0.04, w: w - 0.75, h: 0.62, fontFace: FONT, fontSize: 20, bold: true, color: PX.ink, valign: 'middle', fit: 'shrink', margin: 0 });
    if (withAnswers) s.addText([{ text: 'Answer: ', options: { bold: false, color: PX.soft } }, { text: q.a, options: { bold: true, color: PX.ok } }], { x: x + 0.7, y: y + 0.6, w: w - 0.75, h: 0.48, fontFace: FONT, fontSize: 17, valign: 'top', fit: 'shrink', margin: 0 });
  });
}
function pHinge(s, sl, t, withAnswer) {
  s.addText(sl.question, { x: 0.6, y: 1.9, w: W - 1.2, h: 1.0, fontFace: FONT, fontSize: 24, bold: true, color: PX.ink, valign: 'top', fit: 'shrink', margin: 0 });
  sl.options.forEach((o, j) => {
    const x = 0.6 + (j % 2) * 6.2, y = 3.05 + Math.floor(j / 2) * 1.5;
    const right = withAnswer && j === sl.answer, dim = withAnswer && j !== sl.answer;
    s.addShape('roundRect', { x, y, w: 5.9, h: 1.3, rectRadius: 0.15, fill: { color: right ? 'EAF5EE' : t[2], transparency: dim ? 55 : 0 }, line: { color: right ? '4FA36B' : t[2], width: right ? 2.5 : 0.5 } });
    s.addText('ABCD'[j], { x: x + 0.25, y: y + 0.36, w: 0.6, h: 0.6, shape: 'ellipse', fill: { color: right ? '357A4D' : t[0] }, color: 'FFFFFF', bold: true, fontFace: FONT, fontSize: 18, align: 'center', valign: 'middle', margin: 0 });
    s.addText(o, { x: x + 1.05, y: y + 0.1, w: 4.65, h: 1.1, fontFace: FONT, fontSize: 20, bold: true, color: dim ? '9AA3B5' : PX.ink, valign: 'middle', fit: 'shrink', margin: 0 });
  });
  if (withAnswer && sl.why) s.addText([{ text: 'Why: ', options: { bold: true, color: PX.ok } }, { text: sl.why, options: { color: PX.soft } }], { x: 0.6, y: 6.15, w: W - 1.2, h: 0.65, fontFace: FONT, fontSize: 16, valign: 'top', fit: 'shrink', margin: 0 });
}
function bullets(xs, color) { return xs.map((x, j) => ({ text: x, options: { bullet: true, breakLine: j < xs.length - 1, color: color || PX.ink } })); }
function pptBody(pptx, s, d, sl, t) {
  switch (sl.type) {
    case 'title': {
      s.addText((d.year + (d.subject ? ' · ' + d.subject : '')).toUpperCase(), { x: 0.8, y: 1.15, w: W - 1.6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: '2C5E9E', charSpacing: 3, margin: 0 });
      s.addText(d.title, { x: 0.8, y: 1.6, w: W - 1.6, h: 1.25, fontFace: FONT, fontSize: 44, bold: true, color: PX.ink, valign: 'top', fit: 'shrink', margin: 0 });
      if (d.objective) s.addText([{ text: 'We are learning to ', options: { bold: true, color: PX.ink } }, { text: learnText(d.objective), options: { color: PX.soft } }], { x: 0.8, y: 2.95, w: W - 1.6, h: 0.8, fontFace: FONT, fontSize: 20, valign: 'top', fit: 'shrink', margin: 0 });
      if (d.successCriteria.length) {
        s.addShape('roundRect', { x: 0.8, y: 3.95, w: W - 1.6, h: 2.75, rectRadius: 0.15, fill: { color: 'EAF1FA' }, line: { color: 'EAF1FA', width: 0.5 } });
        s.addText('SUCCESS CRITERIA', { x: 1.15, y: 4.12, w: 6, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: '2C5E9E', charSpacing: 2, margin: 0 });
        s.addText(bullets(d.successCriteria), { x: 1.15, y: 4.58, w: W - 2.3, h: 1.95, fontFace: FONT, fontSize: 19, valign: 'top', paraSpaceAfter: 6, fit: 'shrink', margin: 0 });
      }
      break;
    }
    case 'starter': case 'practice': case 'exit': pQuestions(s, sl, t, false); break;
    case 'hook':
      s.addShape('roundRect', { x: 0.6, y: 2.0, w: W - 1.2, h: 2.9, rectRadius: 0.2, fill: { color: t[2] }, line: { color: t[2], width: 0.5 } });
      s.addText(sl.prompt, { x: 1.0, y: 2.2, w: W - 2.0, h: 2.5, fontFace: FONT, fontSize: 30, bold: true, color: PX.ink, valign: 'middle', fit: 'shrink', margin: 0 });
      if (sl.detail) s.addText(sl.detail, { x: 0.6, y: 5.15, w: W - 1.2, h: 0.7, fontFace: FONT, fontSize: 20, color: PX.soft, valign: 'top', fit: 'shrink', margin: 0 });
      break;
    case 'vocab': {
      const words = sl.words && sl.words.length ? sl.words : d.keywords;
      words.slice(0, 6).forEach((w, j) => {
        const x = 0.6 + (j % 2) * 6.2, y = 2.0 + Math.floor(j / 2) * 1.55;
        s.addShape('roundRect', { x, y, w: 5.9, h: 1.38, rectRadius: 0.15, fill: { color: t[2] }, line: { color: t[2], width: 0.5 } });
        s.addText([{ text: w.word, options: { bold: true, color: t[1], fontSize: 21, breakLine: true } }, { text: w.meaning, options: { color: PX.soft, fontSize: 15 } }], { x: x + 0.25, y: y + 0.1, w: 5.4, h: 1.18, fontFace: FONT, valign: 'middle', fit: 'shrink', margin: 0 });
      });
      break;
    }
    case 'teach': {
      const wide = !sl.example;
      s.addText(bullets(sl.points), { x: 0.6, y: 2.0, w: wide ? W - 1.2 : 7.2, h: 4.6, fontFace: FONT, fontSize: 21, valign: 'top', paraSpaceAfter: 10, fit: 'shrink', margin: 0 });
      if (!wide) {
        s.addShape('roundRect', { x: 8.2, y: 2.0, w: 4.53, h: 4.3, rectRadius: 0.18, fill: { color: t[2] }, line: { color: t[2], width: 0.5 } });
        s.addText('EXAMPLE', { x: 8.5, y: 2.2, w: 3.9, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: t[1], charSpacing: 2, margin: 0 });
        s.addText(sl.example, { x: 8.5, y: 2.7, w: 3.95, h: 3.4, fontFace: FONT, fontSize: 20, bold: true, color: PX.ink, valign: 'top', fit: 'shrink', margin: 0 });
      }
      break;
    }
    case 'example': {
      s.addShape('roundRect', { x: 0.6, y: 1.95, w: W - 1.2, h: 1.0, rectRadius: 0.15, fill: { color: t[2] }, line: { color: t[2], width: 0.5 } });
      s.addText(sl.problem, { x: 0.9, y: 2.0, w: W - 1.8, h: 0.9, fontFace: FONT, fontSize: 22, bold: true, color: PX.ink, valign: 'middle', fit: 'shrink', margin: 0 });
      s.addText(sl.steps.map((st, j) => ({ text: st, options: { bullet: { type: 'number' }, breakLine: j < sl.steps.length - 1 } })), { x: 0.6, y: 3.2, w: W - 1.2, h: 2.8, fontFace: FONT, fontSize: 20, color: PX.ink, valign: 'top', paraSpaceAfter: 8, fit: 'shrink', margin: 0 });
      if (sl.answer) s.addText([{ text: 'Answer: ', options: { bold: true, color: PX.ok } }, { text: sl.answer, options: { bold: true, color: PX.ink } }], { x: 0.6, y: 6.15, w: W - 1.2, h: 0.55, fontFace: FONT, fontSize: 20, valign: 'top', margin: 0 });
      break;
    }
    case 'hinge': pHinge(s, sl, t, false); break;
    case 'talk':
      s.addText(sl.prompt, { x: 0.6, y: 2.0, w: W - 1.2, h: 2.3, fontFace: FONT, fontSize: 28, bold: true, color: PX.ink, valign: 'top', fit: 'shrink', margin: 0 });
      if (sl.starter) s.addText(sl.starter, { x: 0.6, y: 4.6, w: Math.min(W - 1.2, 1.2 + sl.starter.length * 0.17), h: 0.9, shape: 'roundRect', rectRadius: 0.3, fill: { color: t[2] }, color: t[1], bold: true, fontFace: FONT, fontSize: 22, align: 'center', valign: 'middle', margin: 0 });
      break;
    case 'tasks':
      [['mild', 'MILD', 'green'], ['spicy', 'SPICY', 'orange'], ['hot', 'HOT', 'red']].forEach(([k, lab, tn], j) => {
        const c = PT[tn], x = 0.6 + j * 4.13;
        s.addShape('roundRect', { x, y: 1.95, w: 3.93, h: 4.75, rectRadius: 0.15, fill: { color: c[2] }, line: { color: c[2], width: 0.5 } });
        s.addText(lab, { x: x + 0.2, y: 2.1, w: 3.5, h: 0.45, fontFace: FONT, fontSize: 16, bold: true, color: c[1], charSpacing: 2, margin: 0 });
        s.addText(bullets(sl[k] || []), { x: x + 0.2, y: 2.65, w: 3.55, h: 3.9, fontFace: FONT, fontSize: 16, valign: 'top', paraSpaceAfter: 8, fit: 'shrink', margin: 0 });
      });
      break;
    case 'reflect':
      sl.prompts.forEach((p, j) => {
        const y = 2.1 + j * 1.15;
        s.addText(p, { x: 0.6, y, w: W - 1.2, h: 0.7, fontFace: FONT, fontSize: 26, bold: true, color: PX.ink, valign: 'bottom', margin: 0 });
        s.addShape('line', { x: 0.6, y: y + 0.82, w: W - 1.2, h: 0, line: { color: t[0], width: 1.5, dashType: 'dash' } });
      });
      break;
    default: break;
  }
}
function notesFor(d, sl, withPlan) {
  const out = [];
  if (sl.say) out.push('SAY: ' + sl.say);
  if (QTYPES.has(sl.type)) out.push('ANSWERS: ' + sl.questions.map((q, j) => (j + 1) + '. ' + q.a).join('   '));
  if (sl.type === 'hinge') out.push('ANSWER: ' + 'ABCD'[sl.answer] + ') ' + sl.options[sl.answer] + (sl.why ? '. ' + sl.why : ''));
  if (sl.type === 'example' && sl.answer) out.push('ANSWER: ' + sl.answer);
  if (withPlan) {
    const p = d.plan;
    out.push('', 'LESSON PLAN', 'Objective: ' + (d.objective || ''));
    if (d.successCriteria.length) out.push('Success criteria: ' + d.successCriteria.join(' | '));
    if (p.overview) out.push('Overview: ' + p.overview);
    if (p.keyQuestions.length) out.push('Key questions: ' + p.keyQuestions.join(' | '));
    if (p.misconceptions.length) out.push('Watch out for: ' + p.misconceptions.join(' | '));
    if (p.support) out.push('Support: ' + p.support);
    if (p.challenge) out.push('Challenge: ' + p.challenge);
    if (p.resources.length) out.push('Resources: ' + p.resources.join(', '));
  }
  return out.join('\n');
}
async function buildPptx(d, m) {
  const pptx = new window.PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'KS2 Lesson Engine'; pptx.title = d.title; pptx.subject = d.year + ' ' + d.subject;
  d.slides.forEach((sl, i) => {
    const s = fracSlide(pptx.addSlide()); s.background = { color: 'FFFFFF' };
    const t = pChrome(s, d, sl, m, { noTitle: sl.type === 'title' });
    pptBody(pptx, s, d, sl, t);
    s.addNotes(notesFor(d, sl, i === 0));
    if (QTYPES.has(sl.type) || sl.type === 'hinge') {
      const a = fracSlide(pptx.addSlide()); a.background = { color: 'FFFFFF' };
      const ta = pChrome(a, d, sl, m, { noRespond: true, title: 'Answers: ' + (sl.title || KINDS[sl.type].label) });
      if (sl.type === 'hinge') pHinge(a, sl, ta, true); else pQuestions(a, sl, ta, true);
      a.addNotes('Answer slide. ' + notesFor(d, sl, false));
    }
  });
  return pptx.write({ outputType: 'blob' });
}
const fileName = (d) => (d.year + ' ' + d.subject + ' - ' + d.title).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) + '.pptx';
async function exportPptx() {
  const btn = $('#a-ppt');
  if (!window.PptxGenJS) { toast('The PowerPoint maker is still loading. Please try again in a moment.'); return; }
  btn.disabled = true;
  const label = btn.innerHTML;
  btn.innerHTML = icon('download') + 'Building…';
  try {
    const blob = await buildPptx(state.deck, mode());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName(state.deck); a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    track('ppt', { eng: 'slides', title: state.deck.title });
    toast('PowerPoint downloaded. It opens in PowerPoint, Keynote and Google Slides.');
  } catch (e) { toast('The PowerPoint could not be made. Please try again.'); }
  finally { btn.disabled = false; btn.innerHTML = label; }
}

/* ================= presenting (light stage + magic pointer) ================= */
let ribbons = null, kit = null;
const POINTER_KEY = 'ks2-engine.pointer.v1';
function openPresent(i) {
  sfx('present');
  const pr = state.pr;
  pr.open = true; pr.i = Math.max(0, Math.min(i, state.deck.slides.length - 1)); pr.reveal = 0; pr.t0 = Date.now(); pr.seen = pr.i;
  stopTimer();
  const el = $('#spresent');
  el.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  if (!ribbons) ribbons = new Ribbons(el, { baseThickness: 24, maxAge: 520, pointCount: 40, speedMultiplier: 0.6 });
  setPointer(store.get(POINTER_KEY) === 'on');
  try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed */ }
  renderPresent();
  $('#spr-next').focus();
  bus.emit('present', true);
}
function closePresent() {
  if (state.pr.open && state.deck) track('present', { eng: 'slides', title: state.deck.title, ms: Date.now() - (state.pr.t0 || Date.now()), screens: state.deck.slides.length, seen: (state.pr.seen || 0) + 1, ex: state.deckId ? 0 : 1 });
  state.pr.open = false; stopTimer();
  if (kit) kit.close();
  if (ribbons) ribbons.stop();
  $('#spresent').hidden = true;
  document.documentElement.style.overflow = '';
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
  bus.emit('present', false);
}
function setPointer(on) { store.set(POINTER_KEY, on ? 'on' : ''); $('#spr-pointer').setAttribute('aria-pressed', String(on)); if (on) ribbons.start(); else ribbons.stop(); }
function renderPresent() {
  const pr = state.pr, d = state.deck, s = d.slides[pr.i], frame = $('#spr-frame');
  pr.seen = Math.max(pr.seen || 0, pr.i);
  frame.innerHTML = slideHTML(d, s, pr.i, pr.reveal, true);
  fitSlide(frame.firstElementChild);
  $('#spr-count').textContent = (pr.i + 1) + ' / ' + d.slides.length;
  $('#spr-prev').disabled = pr.i === 0; $('#spr-next').disabled = pr.i === d.slides.length - 1;
  const mr = maxReveal(s), rb = $('#spr-reveal');
  rb.hidden = mr === 0; rb.disabled = pr.reveal >= mr;
  rb.querySelector('span').textContent = s.type === 'example' ? (pr.reveal >= mr ? 'All shown' : 'Next step') : (pr.reveal ? 'Revealed' : 'Reveal answers');
  const tb = $('#spr-timer-btn');
  tb.hidden = !(TIMED.has(s.type) && s.minutes > 0);
  if (!pr.timer) tb.querySelector('span').textContent = 'Timer ' + s.minutes + ' min';
  const nb = $('#spr-notes');
  nb.hidden = !pr.notes;
  if (pr.notes) { const ans = answersLine(s).replace(/<p class="sans">|<\/p>/g, ''); nb.innerHTML = '<b>Say:</b> ' + esc(s.say || 'No notes for this slide.') + (ans ? '<br>' + ans : ''); }
  $('#spr-notes-btn').setAttribute('aria-pressed', String(pr.notes));
  if (kit) kit.paint();
}
function go(delta) { const pr = state.pr, n = state.deck.slides.length, j = Math.max(0, Math.min(n - 1, pr.i + delta)); if (j === pr.i) return; sfx('page'); pr.i = j; pr.reveal = 0; stopTimer(); renderPresent(); }
function reveal() { const pr = state.pr, s = state.deck.slides[pr.i]; if (pr.reveal < maxReveal(s)) { pr.reveal += 1; renderPresent(); return true; } return false; }
function fmt(sec) { const m = Math.floor(sec / 60), r = sec % 60; return m + ':' + String(r).padStart(2, '0'); }
function stopTimer() { const t = state.pr.timer; if (t && t.id) clearInterval(t.id); state.pr.timer = null; const el = $('#spr-timer'); if (el) { el.hidden = true; el.classList.remove('done'); } }
function toggleTimer() {
  const pr = state.pr, s = state.deck.slides[pr.i], tb = $('#spr-timer-btn'), el = $('#spr-timer');
  if (pr.timer && pr.timer.id) { clearInterval(pr.timer.id); pr.timer.id = null; tb.querySelector('span').textContent = 'Resume'; return; }
  if (!pr.timer) pr.timer = { left: Math.max(1, s.minutes) * 60, id: null };
  el.hidden = false; el.classList.remove('done'); el.textContent = fmt(pr.timer.left);
  tb.querySelector('span').textContent = 'Pause';
  pr.timer.id = setInterval(() => {
    const t = state.pr.timer; if (!t) return;
    t.left -= 1;
    if (t.left <= 0) { clearInterval(t.id); t.id = null; el.textContent = "Time's up"; el.classList.add('done'); timesUp(); tb.querySelector('span').textContent = 'Restart'; state.pr.timer = null; return; }
    el.textContent = fmt(t.left);
  }, 1000);
}

/* ================= wiring ================= */
export function initSlides() {
  // A lesson starts only from a real press on Make my slides. Submitting the form any other way (the Enter key, a
  // phone's Go key, a script) makes nothing, and Enter in the Topic box moves on to the next box instead.
  const goBtn = $('#f-go');
  $('#make-form').addEventListener('submit', (e) => { e.preventDefault(); });
  goBtn.addEventListener('click', (e) => { e.preventDefault(); if (deliberate(e, goBtn)) makeLesson(); });
  enterMovesOn($('#make-form'));
  const uGo = $('#u-go');
  uGo.addEventListener('click', (e) => { if (deliberate(e, uGo)) planUnit(); });
  $('#u-topic').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.target.blur(); } });
  $('#busy-stop').addEventListener('click', () => { if (state.busy) state.busy.abort(); });
  $('#a-present').addEventListener('click', () => openPresent(0));
  $('#a-ppt').addEventListener('click', exportPptx);
  $('#a-quiz').addEventListener('click', copyQuiz);
  $('#a-plan').addEventListener('click', copyPlan);
  $('#a-keep').addEventListener('click', () => { if (state.deckId === 'example') return; const on = togglePin('slides', state.deckId); paintKeep(); toast(on ? 'Kept on Today, with a picture of the topic.' : 'Taken off Today.'); });
  kit = presentKit({ root: $('#spresent'), frame: () => $('#spr-frame'), key: () => (state.deckId || 'example') + ':' + state.pr.i, title: () => state.deck ? state.deck.title : '' });
  $('#spr-prev').addEventListener('click', () => go(-1));
  $('#spr-next').addEventListener('click', () => go(1));
  $('#spr-reveal').addEventListener('click', reveal);
  $('#spr-timer-btn').addEventListener('click', toggleTimer);
  $('#spr-notes-btn').addEventListener('click', () => { state.pr.notes = !state.pr.notes; renderPresent(); });
  $('#spr-pointer').addEventListener('click', () => setPointer($('#spr-pointer').getAttribute('aria-pressed') !== 'true'));
  $('#spr-exit').addEventListener('click', closePresent);
  $('#spr-frame').addEventListener('click', () => { if (!reveal()) go(1); });
  $('#view-slides').addEventListener('click', (e) => {
    const t = e.target.closest('[data-present],[data-open],[data-remove],[data-unit],[data-adapt],[data-stab]');
    if (!t) return;
    if (t.dataset.present != null) openPresent(Number(t.dataset.present));
    else if (t.dataset.open) openDeck(t.dataset.open);
    else if (t.dataset.remove) {
      state.recent = state.recent.filter((r) => r.id !== t.dataset.remove); unpin('slides', t.dataset.remove); saveRecent();
      if (state.deckId === t.dataset.remove) { state.deck = EXAMPLE; state.deckId = 'example'; renderLesson(); } else renderRecent();
    } else if (t.dataset.unit != null) { if (deliberate(e, t)) makeFromUnit(Number(t.dataset.unit)); }
    else if (t.dataset.adapt) { if (deliberate(e, t)) adaptLesson(t.dataset.adapt); }
    else if (t.dataset.stab) { state.tab = t.dataset.stab; renderLesson(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!state.pr.open) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === 'r' || k === 'R') reveal();
    else if (k === 't' || k === 'T') { if (!$('#spr-timer-btn').hidden) toggleTimer(); }
    else if (k === 'n' || k === 'N') { state.pr.notes = !state.pr.notes; renderPresent(); }
    else if (k === 'p' || k === 'P') $('#spr-pointer').click();
    else if (k === 'c' || k === 'C') $('#spr-ticket').click();
    else if (k === 'Escape' && !document.fullscreenElement) closePresent();
  });
  document.addEventListener('fullscreenchange', () => { if (state.pr.open) renderPresent(); if (ribbons) ribbons.resize(); });
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { $$('.sthumb .sl').forEach(fitSlide); if (state.pr.open) renderPresent(); }, 150); });
  bus.on('mode', () => { renderLesson(); if (state.pr.open) renderPresent(); });
  renderLesson(); renderUnit(); guardButtons();
}
export function refitSlides() { requestAnimationFrame(() => $$('.sthumb .sl').forEach(fitSlide)); }
/* Slide Studio has just come on screen (guard.js has already blocked presses for a moment). */
export function enterSlides() {
  repaint(); refitSlides();
  const id = takeOpen('slides');                       // the dashboard asked for one of the saved lessons
  if (id && state.recent.some((r) => r.id === id)) {
    openDeck(id);
    if (presentAsked('slides:' + id) && state.deck && state.deckId === id) openPresent(0);   // the Classroom: straight onto the board
  }
}
/* library.js openItem(key, { present: true }) leaves this one-time note (read here without importing library.js). */
function presentAsked(key) {
  try {
    const v = JSON.parse(sessionStorage.getItem('ks2-engine.present.once') || 'null');
    if (v && v.key === key && Date.now() - (v.at || 0) < 60000) { sessionStorage.removeItem('ks2-engine.present.once'); return true; }
  } catch (e) { /* nothing waiting */ }
  return false;
}

/* For the class feedback screen: what is being presented right now. */
export function slidesPresentInfo() {
  if (!state.pr.open || !state.deck) return null;
  const d = state.deck;
  return { eng: 'slides', title: d.title, screens: d.slides.filter((x) => x.type !== 'title').map((x) => x.title || (KINDS[x.type] && KINDS[x.type].label) || '').filter(Boolean).slice(0, 8) };
}
