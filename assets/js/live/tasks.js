/* Tasks on pupils' devices, run from the board:
   - startQuizLive(quiz): a live quiz like Quizizz: the join screen, then each question with a countdown, the answers
     coming in, the right answer with how many chose each option, points (faster right answers score more), the top 5,
     and a podium at the end. Results can be copied but are never saved.
   - sendSheetLive(sheet): a worksheet on every device; each answer comes back as it is given, she sets Support or
     Challenge for chosen pupils, sees progress and marks, and can return the marks.
   - sendGameLive(game): a game on every device (games/player.js plays it there); the best scores come back live.
   And the class tools on pupils' devices (FORK A's tools call these while a class is live): classOn, classPupils,
   pushTimer, stopTimerLive, pushGroups, pushSign, pushPoints, plus sendHomework (Add to my calendar on every device).
   Each one starts a live lesson first if none is running. Pupils' names stay on this screen; the class summary only
   ever gets counts and averages (taskLog). */
import { $, $$, esc, str, arr, icon, toast, copyOut, bus, uid } from '../core.js?v=3c9d4698';
import { sfx } from '../fx/audio.js?v=3c9d4698';
import { Voice } from '../fx/voice.js?v=3c9d4698';
import { confetti } from '../fx/particles.js?v=3c9d4698';
import { picURL, creditText, safePic } from '../pics.js?v=3c9d4698';
import { Live, startLive, onLive, pupilsIn, allPupils, nameOf, answersFor, setTask, updateTask, clearTask, setResults, setTools, setHomework, sendBlob, budget, estimate } from './session.js?v=3c9d4698';
import { openJoin, closeJoin } from './panel.js?v=3c9d4698';
import { qrSVG } from './qr.js?v=3c9d4698';
import { SHAPES, shapeSVG } from './shapes.js?v=3c9d4698';
import { matches } from '../moments.js?v=3c9d4698';

const int = (x, d) => { const n = Math.round(Number(x)); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtN = (n) => Number(n || 0).toLocaleString('en-GB');
const spaced = (c) => String(c || '').replace(/^(\d{3})(\d{3})$/, '$1 $2');
const joinShort = () => new URL('join/', location.href.split('#')[0]).href.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ---------------- what happened in this class, with no names (for the end-of-class summary) ---------------- */
export const taskLog = [];
function logTask(entry) { taskLog.push(Object.assign({ at: Date.now() }, entry)); if (taskLog.length > 40) taskLog.shift(); bus.emit('tasklog', entry); }
/* What Symphony spotted in the answers (the class view), for the summary. */
export function logSpotted(text) { if (str(text)) logTask({ kind: 'spotted', text: str(text).slice(0, 300) }); }
/* Anything else worth a line in the summary: { kind: 'step' | 'check' | 'ticket' | …, title, … } (never names). */
export function logStep(entry) { if (entry && entry.kind) logTask(entry); }
onLive((w) => { if (w === 'end') { taskLog.length = 0; closeAll(); } });

/* ---------------- a live lesson to run it in ---------------- */
async function ensureLive(title) {
  if (Live.on) return true;
  try { await startLive(title); return true; } catch (e) {
    if (e && e.code === 'elsewhere') { openJoin(document.body, title); toast('Your live lesson is running on another screen. End it there, or start it here.'); return false; }
    toast('The live lesson could not start. Check the internet connection and try again.');
    return false;
  }
}
/* A full-screen board for a task. */
function boardEl(cls, label, host) {
  const el = document.createElement('div');
  el.className = 'ltask ' + cls;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label);
  (host || document.body).appendChild(el);
  return el;
}
const fullscreen = (el) => { try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed */ } };
const classView = (host) => import('./classview.js?v=3c9d4698').then((m) => m.openClassView({ host: host || document.body })).catch(() => toast('The class view could not open.'));
let Q = null, S = null, G = null;
function closeAll() { if (Q) closeQuiz(true); if (S) closeSheet(true); if (G) closeGame(true); }

/* =================================================================================================================
   The live quiz
   ================================================================================================================= */
function normQuiz(quiz) {
  const set = (quiz && quiz.settings) || {}, base = clamp(int(set.secs, 20), 5, 120);
  const questions = arr(quiz && quiz.questions).map((q, k) => {
    if (!q || typeof q !== 'object') return null;
    const type = ['mcq', 'tf', 'type'].includes(q.type) ? q.type : 'mcq';
    let opts = type === 'type' ? [] : arr(q.opts).map((x) => str(x).slice(0, 120)).filter(Boolean).slice(0, 6);
    if (type === 'tf' && opts.length !== 2) opts = ['True', 'False'];
    let a = q.a;
    if (type === 'type') { a = str(a).slice(0, 120); if (!a) return null; }
    else { a = int(a, -1); if (a < 0 || a >= opts.length || opts.length < 2) return null; }
    const pic = safePic(q.pic);
    let src = '';
    try { src = pic ? picURL(pic, '960') : ''; } catch (e) { src = ''; }
    return { id: str(q.id).slice(0, 20) || 'q' + k, type, q: str(q.q).slice(0, 400), opts, a, alt: arr(q.alt).map((x) => str(x).slice(0, 120)).filter(Boolean).slice(0, 6), why: str(q.why).slice(0, 400),
      secs: clamp(int(q.secs, base), 5, 120), pts: clamp(int(q.pts, 1000), 100, 2000), pic: /^https:\/\/upload\.wikimedia\.org\//.test(src) ? { src, credit: (() => { try { return creditText(pic, true); } catch (e) { return ''; } })() } : null };
  }).filter((q) => q && q.q);
  return { title: str(quiz && quiz.title).slice(0, 120) || 'Quiz', subject: str(quiz && quiz.subject), year: str(quiz && quiz.year), questions, speed: set.speedBonus !== false };
}
const rightOf = (q, v) => (q.type === 'type' ? (typeof v === 'string' && [q.a].concat(q.alt).some((x) => matches(x, v))) : v === q.a);
export async function startQuizLive(quiz, o) {
  o = o || {};
  const qz = normQuiz(quiz);
  if (!qz.questions.length) { toast('This quiz has no questions that can be played yet.'); return false; }
  if (!(await ensureLive(qz.title))) return false;
  closeAll();
  Q = { qz, i: -1, phase: 'lobby', qid: '', askAt: 0, totals: new Map(), per: [], el: boardEl('lq', 'Live quiz', o.host), t: 0, read: false, unsub: null, lobbyId: 'L' + uid('').slice(-6), seen: new Set() };
  Q.unsub = onLive(onQuizLive);
  Q.el.addEventListener('click', onQuizClick);
  Q.keyH = (e) => {
    if (!Q || e.target.closest('input,textarea,select')) return;
    if (e.key === ' ' || e.key === 'Enter') { const b = $('[data-lq="go"]', Q.el); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    else if (e.key === 'Escape' && document.fullscreenElement) { /* the browser leaves full screen */ }
  };
  document.addEventListener('keydown', Q.keyH, true);
  setTask({ id: Q.lobbyId, kind: 'quiz', phase: 'lobby', title: qz.title, of: qz.questions.length }, { kind: 'quiz', quiz: qz, i: -1 });
  paintQuiz();
  sfx('open');
  return true;
}
function closeQuiz(quiet) {
  if (!Q) return;
  clearInterval(Q.t);
  if (Q.unsub) Q.unsub();
  document.removeEventListener('keydown', Q.keyH, true);
  Q.el.remove();
  const ended = Q.phase === 'end';
  Q = null;
  if (!quiet && Live.on && Live.tk && Live.tk.kind === 'quiz') clearTask();
  if (!ended && !quiet) toast('The quiz has closed.');
}
function onQuizLive(w) {
  if (!Q) return;
  if (w === 'pupils') { if (Q.phase === 'lobby') paintQuiz(); else paintCount(); return; }
  if (w && w.ans && w.ans === Q.qid) { sfx('pop', 3); paintCount(); maybeAllIn(); }
}
function topbar(title, n) {
  return '<header class="lt-top"><span class="lt-k"><i></i>Live quiz</span><b class="lt-title">' + esc(title) + '</b>' + (n ? '<span class="lt-n">' + esc(n) + '</span>' : '') + '<span class="lt-sp"></span>' +
    '<button type="button" class="pbtn" data-lq="read" aria-pressed="' + (Q && Q.read) + '" title="Symphony reads each question aloud">' + icon('volume') + '<span>Read aloud</span></button>' +
    '<button type="button" class="pbtn" data-lq="cv">' + icon('vote') + '<span>Class view</span></button>' +
    '<button type="button" class="pbtn" data-lq="full" aria-label="Full screen">' + icon('expand') + '</button>' +
    '<button type="button" class="pbtn" data-lq="x">' + icon('close') + '<span>End quiz</span></button></header>';
}
function paintQuiz() {
  if (!Q) return;
  const qz = Q.qz, el = Q.el;
  if (Q.phase === 'lobby') {
    const list = pupilsIn(), b = budget(), est = estimate(qz.questions.length, 1);
    setTimeout(() => { if (Q) list.forEach((p) => Q.seen.add(p.pid)); }, 0);      // only a name that has just joined pops in
    el.innerHTML = topbar(qz.title, qz.questions.length + ' questions') +
      '<main class="lq-lobby"><div class="lq-join"><div class="lq-qr">' + (Live.link ? qrSVG(Live.link, 'QR code: scan to join the quiz') : '') + '</div><p class="lq-how">Scan the code, or go to</p><p class="lq-url">' + esc(joinShort()) + '</p><p class="lq-how">and enter</p><p class="lq-code">' + esc(spaced(Live.code)) + '</p></div>' +
      '<div class="lq-side"><h1>' + esc(qz.title) + '</h1><p class="lq-big">' + list.length + '<small>' + (list.length === 1 ? ' pupil has joined' : ' pupils have joined') + '</small></p>' +
      '<ul class="lq-names" aria-label="Pupils who have joined">' + list.map((p) => '<li' + (Q.seen.has(p.pid) ? '' : ' class="new"') + '>' + esc(p.name) + '</li>').join('') + '</ul>' +
      (b.public && est > 200 ? '<p class="lt-note">' + icon('info') + '<span>This quiz needs about ' + est + ' messages. On one school Wi-Fi the free public relay allows about 250 a day, so it may stop part way. Online lessons from home are fine. The school relay has no such limit (How it works, Live lessons).</span></p>' : '') +
      '<button type="button" class="btn primary big" data-lq="go"' + (list.length ? '' : ' disabled') + '>' + icon('play') + 'Start the quiz</button><p class="fine">' + (list.length ? 'Press Space to start.' : 'Waiting for pupils to join…') + '</p></div></main>';
    return;
  }
  if (Q.phase === 'end') { paintPodium(); return; }
  const q = qz.questions[Q.i], box = answersFor(Q.qid), reveal = Q.phase === 'reveal';
  const counts = q.opts.map(() => 0);
  let right = 0;
  box.forEach((a) => { if (typeof a.v === 'number' && a.v < counts.length) counts[a.v] += 1; if (rightOf(q, a.v)) right += 1; });
  const max = Math.max(1, ...counts);
  let opts;
  if (q.type === 'type') {
    const typed = new Map();
    box.forEach((a) => { const t = String(a.v || '').trim(); if (t) typed.set(t.toLowerCase(), (typed.get(t.toLowerCase()) || 0) + 1); });
    opts = '<div class="lq-typed">' + (reveal ? '<p class="lq-ans">' + icon('check') + '<b>' + esc(q.a) + '</b></p><p class="fine">' + right + ' of ' + box.size + ' typed a right answer.</p>' +
      '<ul>' + Array.from(typed.entries()).sort((x, y) => y[1] - x[1]).slice(0, 12).map(([t, n]) => '<li class="' + (rightOf(q, t) ? 'ok' : '') + '">' + esc(t) + (n > 1 ? ' <small>×' + n + '</small>' : '') + '</li>').join('') + '</ul>' : '<p class="lq-wait">' + icon('type') + 'Pupils are typing their answers…</p>') + '</div>';
  } else {
    opts = '<div class="lq-opts' + (q.opts.length <= 2 ? ' two' : '') + '">' + q.opts.map((t, k) => {
      const s = SHAPES[k % SHAPES.length], ok = reveal && k === q.a, dim = reveal && k !== q.a;
      return '<div class="lq-opt' + (ok ? ' right' : '') + (dim ? ' dim' : '') + '" style="--c:' + s.c + ';--d:' + s.d + '">' + shapeSVG(k, 'lq-shape') + '<b>' + esc(t) + '</b>' +
        (reveal ? '<span class="lq-bar"><i style="width:' + Math.round((counts[k] / max) * 100) + '%"></i></span><em>' + counts[k] + '</em>' : '') + (ok ? '<span class="lq-tick">' + icon('check') + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  const lb = reveal ? leaderboard(5) : '';
  el.innerHTML = topbar(qz.title, 'Question ' + (Q.i + 1) + ' of ' + qz.questions.length) +
    '<main class="lq-ask' + (reveal ? ' reveal' : '') + '"><div class="lq-qcol">' +
    (q.pic ? '<figure class="lq-pic"><img src="' + esc(q.pic.src) + '" alt="" decoding="async"><figcaption>' + esc(q.pic.credit) + '</figcaption></figure>' : '') +
    '<h1 class="lq-q">' + esc(q.q) + '</h1>' + opts +
    (reveal && q.why ? '<p class="lq-why">' + icon('bulb') + '<span>' + esc(q.why) + '</span></p>' : '') + '</div>' +
    '<aside class="lq-aside">' + (reveal ? '<h2>Top 5</h2>' + lb : '<div class="lq-ring" role="timer"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="trk" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5" pathLength="100"/></svg><b></b></div><p class="lq-count" aria-live="polite"></p>') + '</aside></main>' +
    '<footer class="lt-foot">' + (reveal ? '<span class="fine">' + right + ' of ' + box.size + ' right</span><span class="lt-sp"></span><button type="button" class="btn primary big" data-lq="go">' + icon('right') + (Q.i + 1 < qz.questions.length ? 'Next question' : 'See the winners') + '</button>'
      : '<button type="button" class="pbtn" data-lq="sayq">' + icon('volume') + '<span>Read it aloud</span></button><span class="lt-sp"></span><button type="button" class="btn big" data-lq="go">' + icon('eye') + 'Show the answer</button>') + '</footer>';
  paintCount(); paintRing();
}
function paintCount() {
  if (!Q) return;
  const c = $('.lq-count', Q.el);
  if (c) { const n = answersFor(Q.qid).size, of = pupilsIn().length; c.innerHTML = '<b>' + n + '</b> of ' + of + ' answered'; }
}
function paintRing() {
  if (!Q || Q.phase !== 'ask') return;
  const q = Q.qz.questions[Q.i], left = Math.max(0, q.secs - (Date.now() - Q.askAt) / 1000), r = $('.lq-ring', Q.el);
  if (!r) return;
  $('b', r).textContent = String(Math.ceil(left));
  $('.arc', r).style.strokeDashoffset = String(100 - (left / q.secs) * 100);
  r.classList.toggle('low', left <= 5);
}
function ask(i) {
  const q = Q.qz.questions[i];
  Q.i = i; Q.phase = 'ask'; Q.qid = 'q' + uid('').slice(-7); Q.askAt = Date.now();
  setResults(null);
  setTask({ id: Q.qid, kind: 'quiz', phase: 'ask', n: i + 1, of: Q.qz.questions.length, q: q.q, type: q.type, opts: q.opts, secs: q.secs, pic: q.pic, title: Q.qz.title }, { kind: 'quiz', quiz: Q.qz, i, qid: Q.qid });
  paintQuiz();
  sfx('page');
  if (Q.read) Voice.say(q.q + (q.opts.length ? '. ' + q.opts.map((o, k) => SHAPES[k % SHAPES.length].name + ': ' + o).join('. ') : ''), { lang: 'en-GB', style: 'chat' });
  clearInterval(Q.t);
  Q.t = setInterval(() => {
    if (!Q || Q.phase !== 'ask') { clearInterval(Q && Q.t); return; }
    paintRing();
    if (Date.now() - Q.askAt >= q.secs * 1000) reveal();
  }, 250);
}
function maybeAllIn() {
  if (!Q || Q.phase !== 'ask') return;
  const of = pupilsIn().length;
  if (of && answersFor(Q.qid).size >= of) setTimeout(() => { if (Q && Q.phase === 'ask') reveal(); }, 900);
}
function reveal() {
  if (!Q || Q.phase !== 'ask') return;
  clearInterval(Q.t);
  const q = Q.qz.questions[Q.i], box = answersFor(Q.qid);
  const gained = new Map();
  let right = 0;
  box.forEach((a, pid) => {
    const ok = rightOf(q, a.v);
    const tLeft = clamp(q.secs - (a.at - Q.askAt) / 1000, 0, q.secs);
    const g = ok ? Math.round(q.pts * (Q.qz.speed ? 0.5 + 0.5 * (tLeft / q.secs) : 1)) : 0;
    if (ok) right += 1;
    gained.set(pid, [ok ? 1 : 0, g]);
    const t = Q.totals.get(pid) || { pts: 0, right: 0, n: 0, marks: [] };
    t.pts += g; t.right += ok ? 1 : 0; t.n += 1; t.marks[Q.i] = ok ? 1 : 0;
    Q.totals.set(pid, t);
  });
  Q.per[Q.i] = { q: q.q, right, answered: box.size, joined: pupilsIn().length };
  Q.phase = 'reveal';
  setResults(resultsMap(gained));
  updateTask({ phase: 'reveal', right: q.a, why: q.why, secs: 0 });
  paintQuiz();
  sfx('success');
}
function ranks() {
  const list = allPupils().map((p) => ({ pid: p.pid, name: p.name, t: Q.totals.get(p.pid) || { pts: 0, right: 0, n: 0, marks: [] } })).sort((a, b) => b.t.pts - a.t.pts);
  let place = 0, last = null;
  list.forEach((x, k) => { if (x.t.pts !== last) { place = k + 1; last = x.t.pts; } x.place = place; });
  return list;
}
function resultsMap(gained) {
  const out = {};
  ranks().forEach((x) => { const g = gained ? gained.get(x.pid) : null; out[x.pid] = [g ? g[0] : 0, g ? g[1] : 0, x.t.pts, x.place]; });
  return out;
}
function leaderboard(n) {
  const list = ranks().slice(0, n);
  if (!list.length) return '<p class="fine">No answers yet.</p>';
  return '<ol class="lq-lb">' + list.map((x) => '<li><span class="lq-pl">' + x.place + '</span><b>' + esc(x.name) + '</b><em>' + fmtN(x.t.pts) + '</em></li>').join('') + '</ol>';
}
function finish() {
  Q.phase = 'end';
  setResults(resultsMap(null));
  setTask({ id: 'e' + Q.qid.slice(1), kind: 'quiz', phase: 'end', title: Q.qz.title, of: Q.qz.questions.length }, { kind: 'quiz', quiz: Q.qz, i: Q.i, done: true });
  const answered = Q.per.filter(Boolean);
  const avg = answered.length ? Math.round(answered.reduce((s, p) => s + (p.answered ? p.right / p.answered : 0), 0) / answered.length * 100) : 0;
  logTask({ kind: 'quiz', title: Q.qz.title, questions: Q.qz.questions.length, avg, pupils: allPupils().length,
    hardest: answered.map((p) => ({ q: p.q, pct: p.answered ? Math.round((p.right / p.answered) * 100) : 0 })).sort((a, b) => a.pct - b.pct).slice(0, 2) });
  paintQuiz();
  confetti(Q.el, { count: 160, y: 0.35 });
  sfx('success'); setTimeout(() => sfx('unlock'), 400);
}
function paintPodium() {
  const list = ranks(), top = list.slice(0, 3), order = [1, 0, 2];
  Q.el.innerHTML = topbar(Q.qz.title, 'The winners') +
    '<main class="lq-end"><div class="lq-podium">' + order.map((k) => top[k] ? '<div class="lq-step p' + (k + 1) + '"><b class="lq-who">' + esc(top[k].name) + '</b><em>' + fmtN(top[k].t.pts) + '</em><span class="lq-blk">' + (k + 1) + '</span></div>' : '<div class="lq-step p' + (k + 1) + ' empty"></div>').join('') + '</div>' +
    '<div class="lq-all"><h2>Everyone</h2><ol>' + list.map((x) => '<li><span class="lq-pl">' + x.place + '</span><b>' + esc(x.name) + '</b><em>' + fmtN(x.t.pts) + '</em><small>' + x.t.right + ' right</small></li>').join('') + '</ol></div></main>' +
    '<footer class="lt-foot"><button type="button" class="btn" data-lq="copy">' + icon('copy') + 'Copy results</button><span class="lt-sp"></span><button type="button" class="btn primary" data-lq="done">' + icon('check') + 'Done</button></footer>';
}
function copyResults() {
  const list = ranks(), qs = Q.qz.questions;
  const head = '<tr><th>Place</th><th>Name</th><th>Points</th><th>Right</th>' + qs.map((x, k) => '<th>Q' + (k + 1) + '</th>').join('') + '</tr>';
  const rows = list.map((x) => '<tr><td>' + x.place + '</td><td>' + esc(x.name) + '</td><td>' + x.t.pts + '</td><td>' + x.t.right + ' of ' + qs.length + '</td>' + qs.map((y, k) => '<td>' + (x.t.marks[k] === 1 ? 'right' : x.t.marks[k] === 0 ? 'wrong' : '') + '</td>').join('') + '</tr>').join('');
  const text = [Q.qz.title, ''].concat(list.map((x) => x.place + '. ' + x.name + ': ' + x.t.pts + ' points, ' + x.t.right + ' of ' + qs.length + ' right')).join('\n');
  copyOut('<table border="1" cellpadding="4"><caption>' + esc(Q.qz.title) + '</caption>' + head + rows + '</table>', text, 'Results copied. They are not saved anywhere else.');
}
function onQuizClick(e) {
  const b = e.target.closest('[data-lq]');
  if (!b || !Q) return;
  const a = b.dataset.lq;
  if (a === 'go') {
    if (Q.phase === 'lobby') { closeJoin(); ask(0); }
    else if (Q.phase === 'ask') reveal();
    else if (Q.phase === 'reveal') { if (Q.i + 1 < Q.qz.questions.length) ask(Q.i + 1); else finish(); }
  } else if (a === 'x') { if (Q.phase === 'end' || Q.phase === 'lobby' || confirmEnd(b)) closeQuiz(false); }
  else if (a === 'done') closeQuiz(false);
  else if (a === 'copy') copyResults();
  else if (a === 'cv') classView(Q.el);
  else if (a === 'full') fullscreen(Q.el);
  else if (a === 'read') { Q.read = !Q.read; b.setAttribute('aria-pressed', String(Q.read)); toast(Q.read ? 'Symphony will read each question aloud.' : 'Questions will not be read aloud.'); }
  else if (a === 'sayq' && Q.phase === 'ask') { const q = Q.qz.questions[Q.i]; Voice.say(q.q, { lang: 'en-GB', style: 'chat' }); }
}
/* Ending part way needs a second tap: the button says so first. */
function confirmEnd(b) {
  if (b.dataset.sure) return true;
  b.dataset.sure = '1'; const s = $('span', b); if (s) s.textContent = 'Tap again to end';
  setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; if (s) s.textContent = 'End quiz'; } }, 3000);
  return false;
}

/* =================================================================================================================
   A worksheet on every device
   ================================================================================================================= */
const TEXTY = new Set(['write', 'fill', 'match', 'order', 'calc', 'text']);
function normQs(sections) {
  let i = 0;
  return arr(sections).slice(0, 12).map((s) => ({ heading: str(s && s.heading).slice(0, 120), questions: arr(s && s.questions).slice(0, 30).map((q) => {
    if (!q || !str(q.q)) return null;
    const opts = arr(q.opts).map((x) => str(x).slice(0, 120)).filter(Boolean).slice(0, 8);
    let type = str(q.type).toLowerCase();
    if ((type === 'choice' || type === 'tick') && opts.length < 2) type = 'write';
    if (!['choice', 'tick', 'draw'].includes(type)) type = TEXTY.has(type) ? type : 'write';
    const ans = answerOf(q.answer, opts, type);
    return { i: i++, q: str(q.q).slice(0, 500), type, opts, multi: type === 'tick' && Array.isArray(ans.idx) && ans.idx.length > 1, ans };
  }).filter(Boolean) })).filter((s) => s.questions.length);
}
/* An expected answer, in the shape marking needs: { idx: [indices] } for choice and tick, { text } otherwise. */
function answerOf(a, opts, type) {
  if (type === 'choice' || type === 'tick') {
    const one = (x) => {
      if (Number.isInteger(x) && x >= 0 && x < opts.length) return x;
      const t = str(x);
      if (/^[A-Ha-h]$/.test(t) && 'abcdefgh'.indexOf(t.toLowerCase()) < opts.length) return 'abcdefgh'.indexOf(t.toLowerCase());
      const k = opts.findIndex((o) => o.toLowerCase() === t.toLowerCase());
      return k;
    };
    const list = (Array.isArray(a) ? a : String(a == null ? '' : a).split(/\s*(?:,|;| and )\s*/)).map(one).filter((k) => k >= 0);
    return list.length ? { idx: Array.from(new Set(list)).sort() } : { text: str(a) };
  }
  if (type === 'draw') return {};
  return { text: str(Array.isArray(a) ? a.join(', ') : a).slice(0, 200) };
}
const strip = (sections) => sections.map((s) => ({ heading: s.heading, questions: s.questions.map((q) => ({ i: q.i, q: q.q, type: q.type, opts: q.opts, multi: q.multi })) }));
export async function sendSheetLive(sheet, o) {
  o = o || {};
  const core = normQs(sheet && sheet.sections);
  if (!core.length) { toast('This worksheet has no questions to send yet.'); return false; }
  const lv = sheet && sheet.levels && typeof sheet.levels === 'object' ? sheet.levels : {};
  const support = lv.support ? normQs(lv.support.sections) : [], challenge = lv.challenge ? normQs(lv.challenge.sections) : [];
  const title = str(sheet && sheet.title).slice(0, 120) || 'Worksheet';
  if (!(await ensureLive(title))) return false;
  closeAll();
  const levels = { core, support: support.length ? support : null, challenge: challenge.length ? challenge : null };
  const data = { title, instructions: str(sheet && sheet.instructions).slice(0, 400), sections: strip(core), levels: {} };
  if (levels.support) data.levels.support = { sections: strip(levels.support) };
  if (levels.challenge) data.levels.challenge = { sections: strip(levels.challenge) };
  let blob = '';
  try { blob = await sendBlob('sheet', data); } catch (e) { toast('The worksheet could not reach pupils’ devices. Check the internet and try again.'); return false; }
  S = { id: 's' + uid('').slice(-7), title, levels, blob, lv: {}, over: new Map(), el: boardEl('ls', 'Worksheet on pupils’ devices', o.host), unsub: null, marks: false, open: true, at: Date.now() };
  setTask({ id: S.id, kind: 'sheet', blob, title, lv: {}, open: true, marks: false }, { kind: 'sheet', title, levels, blob });
  S.unsub = onLive((w) => { if (!S) return; if (w === 'pupils' || (w && w.ans === S.id)) paintSheet(); });
  S.el.addEventListener('click', onSheetClick);
  paintSheet();
  if (!pupilsIn().length) openJoin(S.el, title);
  sfx('open');
  return true;
}
const levelOf = (pid) => (S && ['support', 'challenge'].includes(S.lv[pid]) && S.levels[S.lv[pid]] ? S.lv[pid] : 'core');
const qsOf = (lv) => (S.levels[lv] || S.levels.core).reduce((all, s) => all.concat(s.questions), []);
/* Marks for one pupil: { i: 1 | 0 } where it can be marked (her ticks and crosses win), and the count. */
export function sheetMarks(pid) {
  if (!S) return { marks: {}, right: 0, markable: 0, done: 0, total: 0, handed: false, level: 'core' };
  const lv = levelOf(pid), qs = qsOf(lv), got = (answersFor(S.id).get(pid) || {}).v || {}, over = S.over.get(pid) || {};
  const marks = {};
  let right = 0, markable = 0, done = 0;
  qs.forEach((q) => {
    const g = got[q.i];
    if (g && g.a != null && g.a !== '' && !(Array.isArray(g.a) && !g.a.length)) done += 1;
    let m = over[q.i];
    if (m === undefined && g) {
      if (q.ans.idx) { const giv = Array.isArray(g.a) ? g.a.slice().sort() : [g.a]; m = JSON.stringify(giv) === JSON.stringify(q.ans.idx) ? 1 : 0; }
      else if (q.ans.text && q.ans.text.length <= 40 && typeof g.a === 'string') m = matches(q.ans.text, g.a) ? 1 : 0;
    }
    if (m === 0 || m === 1) { marks[q.i] = m; markable += 1; right += m; }
  });
  return { marks, right, markable, done, total: qs.length, handed: !!got.done, level: lv };
}
export function sheetAnswers(pid) {
  if (!S) return [];
  const lv = levelOf(pid), got = (answersFor(S.id).get(pid) || {}).v || {}, m = sheetMarks(pid).marks;
  return qsOf(lv).map((q) => ({ i: q.i, q: q.q, type: q.type, opts: q.opts, a: got[q.i] ? got[q.i].a : null, mark: m[q.i], expected: q.ans.idx ? q.ans.idx.map((k) => q.opts[k]).join(', ') : q.ans.text || '' }));
}
export function setSheetMark(pid, i, v) { if (!S) return; const o = S.over.get(pid) || {}; if (v == null) delete o[i]; else o[i] = v ? 1 : 0; S.over.set(pid, o); paintSheet(); if (S.marks) returnMarks(true); bus.emit('live-marks'); }
export function setLevel(pid, lv) {
  if (!S) return;
  if (lv === 'core' || !S.levels[lv]) delete S.lv[pid]; else S.lv[pid] = lv;
  updateTask({ lv: Object.assign({}, S.lv) });
  paintSheet();
}
function returnMarks(quietly) {
  const res = {};
  allPupils().forEach((p) => { res[p.pid] = sheetMarks(p.pid).marks; });
  S.marks = true;
  setResults(res); updateTask({ marks: true });
  if (!quietly) { toast('Marks sent. Each pupil sees ticks on their own device only.'); sfx('success'); }
}
function paintSheet() {
  if (!S) return;
  const list = allPupils(), rows = list.map((p) => ({ p, m: sheetMarks(p.pid) }));
  const handed = rows.filter((r) => r.m.handed).length, working = rows.filter((r) => !r.m.handed && r.m.done).length;
  const lvBtn = (pid, lv) => S.levels[lv] ? '<button type="button" class="ls-lv" data-ls-lv="' + lv + '" data-pid="' + esc(pid) + '" aria-pressed="' + (levelOf(pid) === lv) + '">' + { support: 'Support', core: 'Core', challenge: 'Challenge' }[lv] + '</button>' : '';
  S.el.innerHTML = '<header class="lt-top"><span class="lt-k"><i></i>Worksheet</span><b class="lt-title">' + esc(S.title) + '</b><span class="lt-n">' + handed + ' handed in · ' + working + ' working · ' + list.length + ' joined</span><span class="lt-sp"></span>' +
    '<button type="button" class="pbtn" data-ls="join">' + icon('qr') + '<span>Join code</span></button><button type="button" class="pbtn" data-ls="cv">' + icon('vote') + '<span>Class view</span></button><button type="button" class="pbtn" data-ls="full" aria-label="Full screen">' + icon('expand') + '</button><button type="button" class="pbtn" data-ls="x">' + icon('close') + '<span>Close</span></button></header>' +
    '<main class="ls-main">' + (rows.length ? '<ul class="ls-tiles">' + rows.map(({ p, m }) => '<li class="ls-tile' + (p.left ? ' left' : '') + (m.handed ? ' handed' : '') + '"><div class="ls-th"><b>' + esc(p.name) + '</b>' + (m.handed ? '<span class="ls-hi">' + icon('check') + 'Handed in</span>' : '') + '</div>' +
      '<div class="ls-prog"><i style="width:' + (m.total ? Math.round((m.done / m.total) * 100) : 0) + '%"></i><span>' + m.done + ' of ' + m.total + '</span></div>' +
      '<p class="ls-score">' + (m.markable ? m.right + ' of ' + m.markable + ' marked right' : 'Nothing to mark yet') + '</p>' +
      ((S.levels.support || S.levels.challenge) ? '<div class="ls-lvs" role="group" aria-label="Level for ' + esc(p.name) + '">' + lvBtn(p.pid, 'support') + lvBtn(p.pid, 'core') + lvBtn(p.pid, 'challenge') + '</div>' : '') + '</li>').join('') + '</ul>'
      : '<p class="lt-empty">' + icon('qr') + '<span>Nobody has joined yet. Show the join code: the worksheet appears on each device as soon as they join.</span></p>') + '</main>' +
    '<footer class="lt-foot"><span class="fine">' + (S.open ? 'Answers arrive as pupils work.' : 'The worksheet is closed: no more answers.') + '</span><span class="lt-sp"></span>' +
    '<button type="button" class="btn" data-ls="open">' + icon(S.open ? 'lock' : 'unlock') + (S.open ? 'Close the worksheet' : 'Open it again') + '</button>' +
    '<button type="button" class="btn primary" data-ls="marks">' + icon('check') + (S.marks ? 'Send the marks again' : 'Return marks to pupils') + '</button></footer>';
}
function onSheetClick(e) {
  const l = e.target.closest('[data-ls-lv]');
  if (l && S) { setLevel(l.dataset.pid, l.dataset.lsLv); return; }
  const b = e.target.closest('[data-ls]');
  if (!b || !S) return;
  const a = b.dataset.ls;
  if (a === 'x') closeSheet(false);
  else if (a === 'cv') classView(S.el);
  else if (a === 'join') openJoin(S.el, S.title);
  else if (a === 'full') fullscreen(S.el);
  else if (a === 'marks') returnMarks(false);
  else if (a === 'open') { S.open = !S.open; updateTask({ open: S.open }); paintSheet(); toast(S.open ? 'The worksheet is open again.' : 'The worksheet is closed on every device.'); }
}
function closeSheet(quiet) {
  if (!S) return;
  const rows = allPupils().map((p) => sheetMarks(p.pid)).filter((m) => m.done);
  const avg = rows.length ? Math.round(rows.reduce((s, m) => s + (m.markable ? m.right / m.markable : 0), 0) / rows.length * 100) : 0;
  logTask({ kind: 'sheet', title: S.title, questions: S.levels.core.reduce((n, s) => n + s.questions.length, 0), pupils: rows.length, avg, handed: rows.filter((m) => m.handed).length });
  if (S.unsub) S.unsub();
  S.el.remove(); S = null;
  if (!quiet && Live.on && Live.tk && Live.tk.kind === 'sheet') clearTask();
}

/* =================================================================================================================
   A game on every device
   ================================================================================================================= */
export async function sendGameLive(game, o) {
  o = o || {};
  if (!game || typeof game !== 'object') { toast('This game cannot be sent.'); return false; }
  const size = JSON.stringify(game).length;
  if (size > 140000) { toast('This game is too big to send to pupils’ devices. Play it on the board instead.'); return false; }
  const title = str(game.title).slice(0, 120) || 'Game';
  if (!(await ensureLive(title))) return false;
  closeAll();
  let blob = '';
  try { blob = await sendBlob('game', game); } catch (e) { toast('The game could not reach pupils’ devices. Check the internet and try again.'); return false; }
  G = { id: 'g' + uid('').slice(-7), title, blob, open: true, el: boardEl('lg', 'Game on pupils’ devices', o.host), unsub: null, at: Date.now() };
  setTask({ id: G.id, kind: 'game', blob, title, open: true }, { kind: 'game', title, blob });
  G.unsub = onLive((w) => { if (!G) return; if (w === 'pupils' || (w && w.ans === G.id)) paintGame(); });
  G.el.addEventListener('click', onGameClick);
  paintGame();
  if (!pupilsIn().length) openJoin(G.el, title);
  sfx('open');
  return true;
}
export const gameScore = (pid) => { if (!G) return null; const a = answersFor(G.id).get(pid); return a && a.v ? a.v : null; };
function paintGame() {
  if (!G) return;
  const list = allPupils().map((p) => ({ p, s: gameScore(p.pid) })).sort((a, b) => ((b.s && b.s.s) || 0) - ((a.s && a.s.s) || 0));
  const playing = list.filter((x) => x.s).length;
  G.el.innerHTML = '<header class="lt-top"><span class="lt-k"><i></i>Game</span><b class="lt-title">' + esc(G.title) + '</b><span class="lt-n">' + playing + ' of ' + list.length + ' have a score</span><span class="lt-sp"></span>' +
    '<button type="button" class="pbtn" data-lg="join">' + icon('qr') + '<span>Join code</span></button><button type="button" class="pbtn" data-lg="cv">' + icon('vote') + '<span>Class view</span></button><button type="button" class="pbtn" data-lg="full" aria-label="Full screen">' + icon('expand') + '</button><button type="button" class="pbtn" data-lg="x">' + icon('close') + '<span>Close</span></button></header>' +
    '<main class="lg-main">' + (G.open ? '' : '<div class="lq-podium">' + [1, 0, 2].map((k) => list[k] && list[k].s ? '<div class="lq-step p' + (k + 1) + '"><b class="lq-who">' + esc(list[k].p.name) + '</b><em>' + fmtN(list[k].s.s) + '</em><span class="lq-blk">' + (k + 1) + '</span></div>' : '<div class="lq-step p' + (k + 1) + ' empty"></div>').join('') + '</div>') +
    (list.length ? '<ol class="lg-board">' + list.map((x, k) => '<li class="' + (x.p.left ? 'left' : '') + '"><span class="lq-pl">' + (x.s ? k + 1 : '–') + '</span><b>' + esc(x.p.name) + '</b><em>' + (x.s ? fmtN(x.s.s) : 'Playing…') + '</em>' + (x.s && x.s.d ? '<small>' + icon('check') + 'Finished</small>' : '') + '</li>').join('') + '</ol>'
      : '<p class="lt-empty">' + icon('qr') + '<span>Nobody has joined yet. Show the join code: the game starts on each device as soon as they join.</span></p>') + '</main>' +
    '<footer class="lt-foot"><span class="lt-sp"></span>' + (G.open ? '<button type="button" class="btn primary big" data-lg="end">' + icon('flag') + 'End the game</button>' : '<button type="button" class="btn primary" data-lg="x">' + icon('check') + 'Done</button>') + '</footer>';
}
function onGameClick(e) {
  const b = e.target.closest('[data-lg]');
  if (!b || !G) return;
  const a = b.dataset.lg;
  if (a === 'x') closeGame(false);
  else if (a === 'cv') classView(G.el);
  else if (a === 'join') openJoin(G.el, G.title);
  else if (a === 'full') fullscreen(G.el);
  else if (a === 'end') { G.open = false; updateTask({ open: false }); paintGame(); confetti(G.el, { count: 140, y: 0.3 }); sfx('success'); }
}
function closeGame(quiet) {
  if (!G) return;
  const scores = allPupils().map((p) => gameScore(p.pid)).filter(Boolean);
  logTask({ kind: 'game', title: G.title, pupils: scores.length, finished: scores.filter((s) => s.d).length });
  if (G.unsub) G.unsub();
  G.el.remove(); G = null;
  if (!quiet && Live.on && Live.tk && Live.tk.kind === 'game') clearTask();
}

/* =================================================================================================================
   What is running now (for the class view)
   ================================================================================================================= */
export function current() {
  if (Q && Live.tk && Live.tk.kind === 'quiz' && Q.phase !== 'lobby') {
    const q = Q.qz.questions[Math.max(0, Q.i)];
    return { kind: 'quiz', id: Q.qid, title: Q.qz.title, label: 'Question ' + (Q.i + 1) + ': ' + q.q, q, phase: Q.phase,
      answer: (pid) => { const a = answersFor(Q.qid).get(pid); if (!a) return null; return { text: typeof a.v === 'number' ? (q.opts[a.v] || '') : String(a.v), ok: rightOf(q, a.v), at: a.at }; },
      total: (pid) => (Q.totals.get(pid) || { pts: 0 }).pts };
  }
  if (S) return { kind: 'sheet', id: S.id, title: S.title, label: 'Worksheet: ' + S.title, marks: sheetMarks, answers: sheetAnswers, setMark: setSheetMark, setLevel, levels: Object.keys(S.levels).filter((k) => S.levels[k]) };
  if (G) return { kind: 'game', id: G.id, title: G.title, label: 'Game: ' + G.title, score: gameScore };
  return null;
}

/* =================================================================================================================
   Class tools on pupils' devices (FORK A's tools call these while a class is live)
   ================================================================================================================= */
export const classOn = () => !!Live.on;
export const classPupils = () => pupilsIn().map((p) => ({ pid: p.pid, name: p.name }));
const COLOR = /^#[0-9A-Fa-f]{6}$/;
/* { secs, ends } (ends: this screen's clock, in ms) or { secs, left, paused: true }. */
export function pushTimer(o) {
  if (!Live.on || !o) return false;
  const secs = clamp(int(o.secs, 0), 0, 36000);
  const t = o.paused ? { secs, paused: true, left: clamp(int(o.left, secs), 0, 36000) } : { secs, ends: Number(o.ends) > Date.now() - 5000 ? Number(o.ends) : Date.now() + secs * 1000 };
  setTools({ timer: t });
  return true;
}
export function stopTimerLive() { if (!Live.on) return false; setTools({ timer: null }); return true; }
/* groups: [{ name, color, pids: [...] }] (names are filled in here from who has joined). */
export function pushGroups(groups) {
  if (!Live.on) return false;
  if (!groups) { setTools({ groups: null }); return true; }
  const list = arr(groups).slice(0, 12).map((g, k) => {
    const pids = arr(g && g.pids).map((p) => str(p)).filter((p) => Live.pupils.has(p)).slice(0, 16);
    return { name: str(g && g.name).slice(0, 30) || 'Group ' + (k + 1), color: COLOR.test(String(g && g.color)) ? g.color : SHAPES[k % SHAPES.length].c, pids, names: pids.map(nameOf) };
  }).filter((g) => g.pids.length);
  setTools({ groups: list.length ? list : null });
  return true;
}
export function pushSign(sign) { if (!Live.on) return false; setTools({ sign: sign && str(sign.word) ? { id: str(sign.id).slice(0, 20), word: str(sign.word).slice(0, 40) } : null }); return true; }
export function pushPoints(teams) {
  if (!Live.on) return false;
  const list = arr(teams).slice(0, 8).map((t, k) => ({ name: str(t && t.name).slice(0, 30) || 'Team ' + (k + 1), color: COLOR.test(String(t && t.color)) ? t.color : SHAPES[k % SHAPES.length].c, points: clamp(int(t && t.points, 0), -9999, 99999) }));
  setTools({ points: list.length ? list : null });
  return true;
}
/* Homework on every device: { id?, subject, cls, year, title, details, set, due: 'YYYY-MM-DD', dueTime, link }. */
export async function sendHomework(hw) {
  if (!hw || typeof hw !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(hw.due || '')) || !str(hw.title)) { toast('The homework needs a title and a due date.'); return false; }
  const clean = { id: /^[A-Za-z0-9_-]{4,12}$/.test(String(hw.id || '')) ? hw.id : 'h' + uid('').slice(-6), subject: str(hw.subject).slice(0, 40), title: str(hw.title).slice(0, 120), details: str(hw.details).slice(0, 600), due: hw.due,
    dueTime: /^\d{2}:\d{2}$/.test(String(hw.dueTime || '')) ? hw.dueTime : '', link: /^https:\/\/[^\s"<>]{3,300}$/.test(String(hw.link || '')) ? hw.link : '' };
  if (!(await ensureLive(clean.title))) return false;
  setHomework(clean);
  logTask({ kind: 'homework', title: clean.title, due: clean.due, subject: clean.subject });
  toast('Homework sent. Each pupil can add it to their own calendar.');
  return true;
}
export function clearHomework() { if (Live.on) setHomework(null); }
