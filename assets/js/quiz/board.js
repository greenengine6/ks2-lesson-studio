/* The team board game (like Baamboozle), full screen on the board, no devices needed.
   Setup: 2 to 6 teams with names and colours, points on the tiles (by how hard the question looks, or at random, 5 to
   25), surprise tiles (Double points, Swap scores, Lose 10, Steal 10, Bonus 10) and the timer. Then teams take turns
   to pick a numbered tile: a question card opens with its timer; Show the answer; tick the teams that got it (or
   Nobody); the points count up and the turn moves on. Surprise tiles do their trick straight away. When every tile is
   used (or End game), a podium with confetti and a fanfare.
   Keys: type a tile's number (Enter to go at once); in a card, Enter shows the answer then finishes, 1 to 6 tick a
   team, 0 is Nobody, R reads it aloud; Esc closes the card without scoring, and on the board asks to end the game. */
import { esc, str, store, icon, toast } from '../core.js?v=af1c9ebd';
import { Voice } from '../fx/voice.js?v=af1c9ebd';
import { fracWords } from '../fractions.js?v=af1c9ebd';
import { confetti } from '../fx/particles.js?v=af1c9ebd';
import { picURL, creditText } from '../pics.js?v=af1c9ebd';
import { mineKey } from '../library.js?v=af1c9ebd';
import { track } from '../track.js?v=af1c9ebd';
import { playable, answerText, difficulty, LETTERS, OPT_COLOURS } from './model.js?v=af1c9ebd';
import { shapeSVG, animalSVG, TEAMS, COLOURS, SURPRISES, surpriseSVG, TROPHY, Fx, countTo } from './fx.js?v=af1c9ebd';
import { openStage } from './stage.js?v=af1c9ebd';

const SET_KEY = 'ks2-engine.quiz.board.v1';
const TILE_COLOURS = ['#4F46E5', '#1F7A75', '#C2410C', '#7E3FAF', '#2563EB', '#BE185D'];
const TIMERS = [['q', 'Each question’s own time'], [20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds'], [0, 'No timer']];
const KINDS = Object.keys(SURPRISES);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const poss = (name) => name + (/s$/i.test(name) ? '’' : '’s');               // Eagles’ turn, Red Team’s turn
const CLOCK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5"/></svg>';
const FULL = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

function loadSet() {
  const v = store.getJSON(mineKey(SET_KEY), null) || {};
  const teams = TEAMS.map((t, i) => {
    const s = Array.isArray(v.teams) && v.teams[i] ? v.teams[i] : {};
    return { name: str(s.name).slice(0, 16) || t.name, color: COLOURS.includes(s.color) ? s.color : t.color, animal: t.animal };
  });
  return {
    n: Math.min(6, Math.max(2, Number(v.n) || 4)), teams, points: v.points === 'random' ? 'random' : 'difficulty',
    surOn: v.surOn !== false, sur: Array.isArray(v.sur) ? v.sur.filter((k) => SURPRISES[k]) : KINDS.slice(),
    secs: [20, 30, 45, 0].includes(v.secs) ? v.secs : 'q'
  };
}
function saveSet(s) { store.setJSON(mineKey(SET_KEY), { n: s.n, teams: s.teams.map((t) => ({ name: t.name, color: t.color })), points: s.points, surOn: s.surOn, sur: s.sur, secs: s.secs }); }

let G = null;

/* Open the board game for a quiz. o: { host } */
export function openBoardGame(quiz, o) {
  o = o || {};
  const { quiz: q, skipped } = playable(quiz);
  if (!q.questions.length) { toast('This quiz has no questions ready to play yet.'); return null; }
  if (G && G.stage.open) G.stage.close();
  const stage = openStage({ host: o.host, cls: 'qb-stage', label: 'Board game: ' + (q.title || 'Quiz'), onClose: onClosed });
  G = { stage, quiz: q, skipped, set: loadSet(), teams: [], turn: 0, tiles: [], phase: 'setup', card: null, buf: '', bufT: 0, timer: null, t0: Date.now(), confirm: false };
  stage.el.addEventListener('click', onClick);
  stage.el.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey, true);
  renderSetup();
  return { close: () => stage.close() };
}
function onClosed() {
  document.removeEventListener('keydown', onKey, true);
  stopTimer();
  Voice.stop();
  if (G && G.phase !== 'setup') {
    const used = G.tiles.filter((t) => t.used).length;
    try { track('present', { eng: 'quiz', title: (G.quiz.title || 'Quiz') + ' (board game)', ms: Date.now() - G.t0, screens: G.tiles.length, seen: used, ex: 0 }); } catch (e) { /* best effort */ }
  }
  G = null;
}
const root = () => G && G.stage.el;
const say = (t) => { const l = root() && root().querySelector('#qb-live'); if (l) { l.textContent = ''; setTimeout(() => { l.textContent = t; }, 30); } };
const head = (title, acts) => '<header class="qb-top"><span class="qb-badge">Board game</span><h1>' + esc(title || 'Quiz') + '</h1><div class="qb-acts">' + acts + '</div></header>';
const fullBtn = '<button type="button" class="qb-btn" data-b="full" title="Full screen">' + FULL + '<span>Full screen</span></button>';

/* ---------------- setup ---------------- */
function surpriseCount() { const s = G.set; return s.surOn && s.sur.length ? Math.max(1, Math.min(5, Math.round(G.quiz.questions.length / 5))) : 0; }
function renderSetup() {
  G.phase = 'setup';
  const s = G.set;
  const teams = s.teams.slice(0, s.n).map((t, i) => '<li class="qb-trow" style="--tc:' + t.color + '"><span class="qb-ava">' + animalSVG(t.animal) + '</span>' +
    '<label class="qb-tname"><span class="sr">Team ' + (i + 1) + ' name</span><input type="text" data-team-name="' + i + '" value="' + esc(t.name) + '" maxlength="16" autocomplete="off" spellcheck="false"></label>' +
    '<div class="qb-sw" role="group" aria-label="Team ' + (i + 1) + ' colour">' + COLOURS.map((c) => '<button type="button" class="qb-swatch" data-team-col="' + i + '" data-c="' + c + '" style="--sc:' + c + '" aria-pressed="' + (c === t.color) + '" aria-label="' + c + '"></button>').join('') + '</div></li>').join('');
  const surs = KINDS.map((k) => { const x = SURPRISES[k]; return '<button type="button" class="qb-surpick" data-sur="' + k + '" aria-pressed="' + s.sur.includes(k) + '"' + (s.surOn ? '' : ' disabled') + '>' + surpriseSVG(k) + '<span><b>' + esc(x.name) + '</b><small>' + esc(x.say) + '</small></span></button>'; }).join('');
  const k = surpriseCount();
  root().innerHTML = '<div class="qb-setup">' + head(G.quiz.title, fullBtn + '<button type="button" class="qb-btn" data-b="close">' + icon('close') + '<span>Close</span></button>') +
    '<div class="qb-setup-in"><section class="qb-panel" aria-labelledby="qbs-t"><h2 id="qbs-t">Teams</h2>' +
      '<div class="qb-count" role="group" aria-label="How many teams">' + [2, 3, 4, 5, 6].map((n) => '<button type="button" data-count="' + n + '" aria-pressed="' + (n === s.n) + '">' + n + ' teams</button>').join('') + '</div>' +
      '<ol class="qb-tlist">' + teams + '</ol></section>' +
    '<section class="qb-panel" aria-labelledby="qbs-p"><h2 id="qbs-p">Points on the tiles</h2>' +
      '<div class="qb-seg" role="group" aria-label="Points on the tiles"><button type="button" data-points="difficulty" aria-pressed="' + (s.points === 'difficulty') + '">By how hard the question is</button><button type="button" data-points="random" aria-pressed="' + (s.points === 'random') + '">Random, 5 to 25</button></div>' +
      '<h2>Surprise tiles</h2><label class="qb-check"><input type="checkbox" data-sur-on' + (s.surOn ? ' checked' : '') + '><span>Hide some surprises on the board</span></label>' +
      '<div class="qb-surs">' + surs + '</div>' +
      '<h2>Timer</h2><div class="qb-seg wrap" role="group" aria-label="Timer">' + TIMERS.map(([v, l]) => '<button type="button" data-secs="' + v + '" aria-pressed="' + (String(v) === String(s.secs)) + '">' + esc(l) + '</button>').join('') + '</div></section></div>' +
    '<footer class="qb-setup-foot"><p>' + G.quiz.questions.length + (G.quiz.questions.length === 1 ? ' question' : ' questions') + (k ? ' and ' + k + (k === 1 ? ' surprise tile' : ' surprise tiles') : '') + (G.skipped ? '. ' + G.skipped + ' not ready yet ' + (G.skipped === 1 ? 'is' : 'are') + ' left out' : '') + '.</p>' +
      '<button type="button" class="qb-go" data-b="start">' + icon('play') + 'Start the game</button></footer>' +
    '<p class="sr" aria-live="polite" id="qb-live"></p></div>';
}

/* ---------------- the board ---------------- */
function pointsFor(q) {
  if (G.set.points === 'random') return [5, 10, 15, 20, 25][Math.floor(Math.random() * 5)];
  const d = difficulty(q);
  return q.pts >= 2000 ? 25 : ({ 1: 10, 2: 15, 3: 20 })[d] || 10;
}
function start() {
  const s = G.set;
  if (s.surOn && !s.sur.length) s.surOn = false;
  saveSet(s);
  G.teams = s.teams.slice(0, s.n).map((t) => ({ name: str(t.name) || 'Team', color: t.color, animal: t.animal, score: 0, double: false }));
  const tiles = G.quiz.questions.map((q, i) => ({ kind: 'q', qi: i, pts: pointsFor(q), used: false, by: [] }));
  const k = surpriseCount(), kinds = shuffle(s.sur.slice());
  for (let i = 0; i < k; i++) tiles.push({ kind: 'sur', sur: kinds[i % kinds.length], used: false, by: [] });
  shuffle(tiles).forEach((t, i) => { t.n = i + 1; });
  G.tiles = tiles; G.turn = 0; G.phase = 'board'; G.confirm = false;
  renderBoard();
  Fx.pick();
  say(G.teams[0].name + ' go first. Pick a tile.');
}
function teamHTML(t, i) {
  const turn = G.phase === 'board' && i === G.turn;
  return '<div class="qb-team' + (turn ? ' turn' : '') + '" style="--tc:' + t.color + '"><span class="qb-ava">' + animalSVG(t.animal) + '</span>' +
    '<span class="qb-tn"><b>' + esc(t.name) + '</b><small>' + (turn ? 'Their turn now' : t.double ? 'Next question x2' : '&nbsp;') + (turn && t.double ? ' · x2' : '') + '</small></span>' +
    '<b class="qb-score" data-score="' + i + '">' + t.score + '</b></div>';
}
function tileHTML(t, i) {
  if (!t.used) return '<button type="button" class="qb-tile" data-tile="' + i + '" style="--tc:' + TILE_COLOURS[i % TILE_COLOURS.length] + '" aria-label="Tile ' + t.n + (t.kind === 'q' ? ', ' + t.pts + ' points' : '') + '"><span>' + t.n + '</span></button>';
  if (t.kind === 'sur') return '<button type="button" class="qb-tile used sur" disabled aria-label="Tile ' + t.n + ': ' + esc(SURPRISES[t.sur].name) + '">' + surpriseSVG(t.sur) + '<span>' + esc(SURPRISES[t.sur].short) + '</span></button>';
  const who = t.by.length ? t.by.map((j) => G.teams[j].name).join(', ') : 'Nobody';
  return '<button type="button" class="qb-tile used" disabled aria-label="Tile ' + t.n + ': ' + esc(who) + '"' + (t.by.length === 1 ? ' style="--uc:' + G.teams[t.by[0]].color + '"' : '') + '><span>' + esc(who) + '</span></button>';
}
function legendHTML() {
  if (!G.set.surOn || !G.set.sur.length) return '';
  return '<div class="qb-legend"><b>Surprise tiles</b>' + G.set.sur.map((k) => '<span>' + surpriseSVG(k) + esc(SURPRISES[k].name) + '</span>').join('') + '</div>';
}
function renderBoard() {
  const n = G.tiles.length, cols = n <= 8 ? 4 : n <= 15 ? 5 : n <= 24 ? 6 : n <= 35 ? 7 : 8;
  root().innerHTML = '<div class="qb-game">' + head(G.quiz.title, '<span class="qb-confirm" hidden><span>End the game and show the winners?</span><button type="button" class="qb-btn" data-b="end-yes">Show the winners</button><button type="button" class="qb-btn" data-b="end-no">Keep playing</button></span>' +
      fullBtn + '<button type="button" class="qb-btn" data-b="end">' + icon('flag') + '<span>End game</span></button>') +
    '<div class="qb-main"><section class="qb-teams" aria-label="Teams"><div class="qb-tcol">' + G.teams.map(teamHTML).join('') + '</div>' + legendHTML() + '</section>' +
    '<section class="qb-board" aria-label="Board"><div class="qb-grid" style="--cols:' + cols + ';--rows:' + Math.ceil(n / cols) + '">' + G.tiles.map(tileHTML).join('') + '</div>' +
    '<p class="qb-hint"><span class="qb-buf" aria-hidden="true"></span>Tap a tile, or type its number.</p><div class="qb-cardhost"></div></section></div>' +
    '<p class="sr" aria-live="polite" id="qb-live"></p></div>';
}
function paintTeams() {
  const box = root() && root().querySelector('.qb-tcol');
  if (!box) return;
  const old = Array.from(box.querySelectorAll('[data-score]')).map((b) => Number(b.textContent) || 0);
  box.innerHTML = G.teams.map(teamHTML).join('');
  G.teams.forEach((t, i) => {
    const el = box.querySelector('[data-score="' + i + '"]');
    if (old[i] !== t.score) { countTo(el, old[i] || 0, t.score, 700); el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 700); }
  });
}
function paintTiles() { const g = root() && root().querySelector('.qb-grid'); if (g) g.innerHTML = G.tiles.map(tileHTML).join(''); }
function nextTurn() { G.turn = (G.turn + 1) % G.teams.length; paintTeams(); say(poss(G.teams[G.turn].name) + ' turn.'); }
function maybeEnd() { if (G.tiles.every((t) => t.used)) setTimeout(() => { if (G && G.phase === 'board') renderEnd(); }, 650); }

/* ---------------- a question card ---------------- */
function secsFor(q) { const s = G.set.secs; return s === 'q' ? q.secs : Number(s) || 0; }
function openTile(i) {
  const t = G.tiles[i];
  if (!t || t.used || G.card) return;
  Fx.pick();
  if (t.kind === 'sur') { openSurprise(i); return; }
  const q = G.quiz.questions[t.qi], team = G.teams[G.turn], dbl = team.double;
  const pts = t.pts;
  const opts = q.type === 'type' ? '' : '<div class="qb-opts n' + q.opts.length + '">' + q.opts.map((o, j) => '<div class="qb-opt" data-opt="' + j + '" style="--oc:' + OPT_COLOURS[j % 4] + '">' + shapeSVG(j) + '<b class="qb-l">' + LETTERS[j] + '</b><span>' + esc(o) + '</span></div>').join('') + '</div>';
  const pic = q.pic && picURL(q.pic, '960') ? '<figure class="qb-pic"><img src="' + esc(picURL(q.pic, '960')) + '" alt="' + esc(q.pic.alt || '') + '" decoding="async"><figcaption>' + esc(creditText(q.pic, true)) + '</figcaption></figure>' : '';
  const award = G.teams.map((tm, j) => '<button type="button" class="qb-aw" data-award="' + j + '" aria-pressed="false" style="--tc:' + tm.color + '">' + esc(tm.name) + ' +' + (tm.double ? pts * 2 : pts) + '</button>').join('') +
    '<button type="button" class="qb-aw nobody" data-b="nobody">Nobody</button>';
  const secs = secsFor(q);
  G.card = { i, q, pts, secs, left: secs, revealed: false, paused: false, picked: new Set() };
  const host = root().querySelector('.qb-cardhost');
  host.innerHTML = '<div class="qb-scrim"></div><div class="qb-card" role="dialog" aria-modal="true" aria-labelledby="qb-q">' +
    '<div class="qb-ctop"><span class="qb-pill">Tile ' + t.n + ' · ' + pts + ' points · ' + esc(poss(team.name)) + ' turn' + (dbl ? ' · x2' : '') + '</span>' +
    (secs ? '<button type="button" class="qb-timer" data-b="pause" aria-label="Timer: tap to pause">' + CLOCK + '<b>' + fmt(secs) + '</b></button>' : '') +
    '<button type="button" class="qb-btn small" data-b="read">' + icon('volume') + '<span>Read it</span></button>' +
    '<button type="button" class="qb-btn icon" data-b="cancel" aria-label="Close without scoring" title="Close without scoring (Esc)">' + icon('close') + '</button></div>' +
    '<h2 class="qb-q" id="qb-q">' + esc(q.q) + '</h2>' + pic + opts +
    '<div class="qb-ans" hidden>' + (q.type === 'type' ? '<p class="qb-typed"><span>Answer</span><b>' + esc(answerText(q)) + '</b></p>' : '') + (q.why ? '<p class="qb-why"><b>Why:</b> ' + esc(q.why) + '</p>' : '') + '</div>' +
    '<div class="qb-cfoot"><button type="button" class="qb-go" data-b="reveal">' + icon('eye') + 'Show the answer</button>' +
    '<div class="qb-award"><p>Who got it?</p><div class="qb-awrow">' + award + '</div><button type="button" class="qb-go done" data-b="done" disabled>' + icon('check') + 'Done</button></div></div></div>';
  if (secs) startTimer();
  setTimeout(() => { const b = host.querySelector('[data-b="reveal"]'); if (b) b.focus({ preventScroll: true }); }, 40);
  say('Tile ' + t.n + ', ' + pts + ' points. ' + q.q);
}
function startTimer() {
  stopTimer();
  G.timer = setInterval(() => {
    const c = G && G.card;
    if (!c || c.paused || c.revealed) return;
    c.left = Math.max(0, c.left - 1);
    const b = root().querySelector('.qb-timer b'), box = root().querySelector('.qb-timer');
    if (b) b.textContent = c.left ? fmt(c.left) : 'Time’s up';
    if (box) { box.classList.toggle('low', c.left > 0 && c.left <= 5); box.classList.toggle('up', !c.left); }
    if (c.left > 0 && c.left <= 5) Fx.tick();
    if (!c.left) { stopTimer(); Fx.timeUp(); say('Time’s up!'); }
  }, 1000);
}
function stopTimer() { if (G && G.timer) { clearInterval(G.timer); G.timer = null; } }
function reveal() {
  const c = G.card;
  if (!c || c.revealed) return;
  c.revealed = true; stopTimer();
  const card = root().querySelector('.qb-card');
  card.classList.add('revealed');
  card.querySelectorAll('[data-opt]').forEach((o) => { const right = Number(o.dataset.opt) === c.q.a; o.classList.toggle('right', right); o.classList.toggle('dim', !right); if (right) o.insertAdjacentHTML('beforeend', '<i class="qb-tick">' + icon('check') + '</i>'); });
  const a = card.querySelector('.qb-ans'); if (a) a.hidden = false;
  const r = card.querySelector('[data-b="reveal"]'); if (r) r.hidden = true;
  Fx.reveal();
  say('The answer is ' + answerText(c.q) + '.');
  const d = card.querySelector('[data-b="done"]'); if (d) { d.disabled = false; setTimeout(() => d.focus({ preventScroll: true }), 30); }
}
function toggleAward(j) {
  const c = G.card;
  if (!c || !G.teams[j]) return;
  if (c.picked.has(j)) c.picked.delete(j); else c.picked.add(j);
  root().querySelectorAll('[data-award]').forEach((b) => b.setAttribute('aria-pressed', String(c.picked.has(Number(b.dataset.award)))));
  const d = root().querySelector('[data-b="done"]'); if (d) d.disabled = false;
}
function finish(nobody) {
  const c = G.card;
  if (!c) return;
  const t = G.tiles[c.i];
  const by = nobody ? [] : Array.from(c.picked).sort();
  let line = '';
  by.forEach((j) => { const tm = G.teams[j], p = tm.double ? c.pts * 2 : c.pts; tm.score += p; if (tm.double) tm.double = false; line += tm.name + ' get ' + p + '. '; });
  const turnTeam = G.teams[G.turn];
  if (turnTeam.double && !by.includes(G.turn)) turnTeam.double = false;          // a double is for that team's own next question
  t.used = true; t.by = by;
  closeCard();
  if (by.length) Fx.coin(); else Fx.oops();
  paintTiles();
  nextTurn();
  say((line || 'Nobody this time. ') + poss(G.teams[G.turn].name) + ' turn.');
  maybeEnd();
}
function closeCard() {
  stopTimer(); Voice.stop();
  G.card = null;
  const h = root() && root().querySelector('.qb-cardhost');
  if (h) h.innerHTML = '';
}
function readCard() {
  const c = G.card;
  if (!c) return;
  const parts = [c.q.q];
  if (c.q.type !== 'type') c.q.opts.forEach((o, j) => parts.push(LETTERS[j] + ': ' + o + '.'));
  if (c.revealed) parts.push('The answer is ' + answerText(c.q) + '.', c.q.why || '');
  Voice.say(fracWords(parts.filter(Boolean).join(' ')), { lang: 'en-GB', style: 'chat' });
}

/* ---------------- surprise tiles ---------------- */
function openSurprise(i) {
  const t = G.tiles[i], k = t.sur, s = SURPRISES[k], team = G.teams[G.turn];
  G.card = { i, sur: k };
  const others = G.teams.map((tm, j) => (j === G.turn ? '' : '<button type="button" class="qb-aw" data-victim="' + j + '" style="--tc:' + tm.color + '">' + esc(tm.name) + ' (' + tm.score + ')</button>')).join('');
  const needsPick = k === 'swap' || k === 'steal';
  root().querySelector('.qb-cardhost').innerHTML = '<div class="qb-scrim"></div><div class="qb-card sur" role="dialog" aria-modal="true" aria-labelledby="qb-sh" style="--sc:' + s.color + '">' +
    '<div class="qb-surart">' + surpriseSVG(k, 'big') + '</div><h2 id="qb-sh">' + esc(s.name) + '</h2><p class="qb-surtext"><b>' + esc(team.name) + ':</b> ' + esc(s.say) + '</p>' +
    (needsPick ? '<div class="qb-awrow">' + others + '</div>' : '<button type="button" class="qb-go" data-b="sur-ok">' + icon('check') + 'OK</button>') + '</div>';
  if (k === 'lose') Fx.oops(); else Fx.surprise();
  say(s.name + '! ' + team.name + ': ' + s.say);
  setTimeout(() => { const b = root().querySelector('.qb-card [data-b="sur-ok"], .qb-card [data-victim]'); if (b) b.focus({ preventScroll: true }); }, 40);
}
function doSurprise(victim) {
  const c = G.card;
  if (!c || !c.sur) return;
  const k = c.sur, me = G.teams[G.turn], v = victim != null ? G.teams[victim] : null;
  let line = '';
  if (k === 'double') { me.double = true; line = poss(me.name) + ' next question is worth double.'; }
  else if (k === 'bonus') { me.score += 10; line = me.name + ' get 10 bonus points.'; }
  else if (k === 'lose') { const l = Math.min(10, me.score); me.score -= l; line = me.name + ' lose ' + l + ' points.'; }
  else if (k === 'swap' && v) { const x = me.score; me.score = v.score; v.score = x; line = me.name + ' and ' + v.name + ' swap scores.'; }
  else if (k === 'steal' && v) { const s = Math.min(10, v.score); v.score -= s; me.score += s; line = me.name + ' steal ' + s + ' points from ' + v.name + '.'; }
  else return;
  const t = G.tiles[c.i];
  t.used = true;
  closeCard();
  Fx.coin();
  paintTiles();
  nextTurn();
  say(line + ' ' + poss(G.teams[G.turn].name) + ' turn.');
  maybeEnd();
}

/* ---------------- the end ---------------- */
function renderEnd() {
  stopTimer(); closeCard();
  G.phase = 'end';
  const ranked = G.teams.map((t, i) => Object.assign({ i }, t)).sort((a, b) => b.score - a.score);
  ranked.forEach((t) => { t.place = 1 + ranked.filter((x) => x.score > t.score).length; });
  const word = (p) => ['', '1st', '2nd', '3rd', '4th', '5th', '6th'][p] || p + 'th';
  const slot = (t, cls) => (t ? '<div class="qb-place ' + cls + '" style="--tc:' + t.color + '">' + (cls === 'p1' ? TROPHY : '') + '<span class="qb-ava big">' + animalSVG(t.animal) + '</span><b>' + esc(t.name) + '</b><span class="qb-pts">' + t.score + ' points</span><div class="qb-step"><span>' + word(t.place) + '</span></div></div>' : '<div class="qb-place ' + cls + ' empty"></div>');
  const rest = ranked.slice(3).map((t) => '<li style="--tc:' + t.color + '"><span>' + word(t.place) + '</span><span class="qb-ava">' + animalSVG(t.animal) + '</span><b>' + esc(t.name) + '</b><span>' + t.score + ' points</span></li>').join('');
  const top = ranked.filter((t) => t.place === 1);
  root().innerHTML = '<div class="qb-end">' + head(G.quiz.title, fullBtn + '<button type="button" class="qb-btn" data-b="close">' + icon('close') + '<span>Close</span></button>') +
    '<h2 class="qb-win">' + (top.length > 1 ? 'A draw! ' + esc(top.map((t) => t.name).join(' and ')) + ' share first place.' : esc(top[0].name) + ' win!') + '</h2>' +
    '<div class="qb-podium">' + slot(ranked[1], 'p2') + slot(ranked[0], 'p1') + slot(ranked[2], 'p3') + '</div>' +
    (rest ? '<ol class="qb-rest">' + rest + '</ol>' : '') +
    '<div class="qb-endacts"><button type="button" class="qb-go" data-b="again">' + icon('refresh') + 'Play again</button><button type="button" class="qb-btn" data-b="close">Back to the quiz</button></div>' +
    '<p class="sr" aria-live="polite" id="qb-live"></p></div>';
  Fx.fanfare();
  confetti(root(), { count: 200, y: 0.35 });
  setTimeout(() => { if (G && G.phase === 'end') confetti(root(), { count: 120, x: 0.25, y: 0.5 }); }, 900);
  setTimeout(() => { if (G && G.phase === 'end') confetti(root(), { count: 120, x: 0.75, y: 0.5 }); }, 1500);
  say(top.length > 1 ? 'A draw for first place.' : top[0].name + ' win with ' + top[0].score + ' points!');
}

/* ---------------- input ---------------- */
function onInput(e) {
  const n = e.target.closest('[data-team-name]');
  if (n && G.phase === 'setup') { G.set.teams[Number(n.dataset.teamName)].name = str(n.value).slice(0, 16); }
  const c = e.target.closest('[data-sur-on]');
  if (c && G.phase === 'setup') { G.set.surOn = c.checked; if (G.set.surOn && !G.set.sur.length) G.set.sur = KINDS.slice(); renderSetup(); const cb = root().querySelector('[data-sur-on]'); if (cb) cb.focus(); }
}
function onClick(e) {
  if (!G) return;
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  const a = b.dataset.b, s = G.set;
  if (a === 'full') { G.stage.toggleFull(); return; }
  if (a === 'close') { G.stage.close(); return; }
  if (G.phase === 'setup') {
    if (b.dataset.count) { s.n = Number(b.dataset.count); renderSetup(); focusSel('[data-count="' + s.n + '"]'); return; }
    if (b.dataset.teamCol) { s.teams[Number(b.dataset.teamCol)].color = b.dataset.c; renderSetup(); focusSel('[data-team-col="' + b.dataset.teamCol + '"][data-c="' + b.dataset.c + '"]'); return; }
    if (b.dataset.points) { s.points = b.dataset.points; renderSetup(); focusSel('[data-points="' + s.points + '"]'); return; }
    if (b.dataset.sur) { const k = b.dataset.sur; s.sur = s.sur.includes(k) ? s.sur.filter((x) => x !== k) : s.sur.concat([k]); renderSetup(); focusSel('[data-sur="' + k + '"]'); return; }
    if (b.dataset.secs != null) { s.secs = b.dataset.secs === 'q' ? 'q' : Number(b.dataset.secs); renderSetup(); focusSel('[data-secs="' + b.dataset.secs + '"]'); return; }
    if (a === 'start') { start(); return; }
    return;
  }
  if (G.phase === 'board') {
    if (b.dataset.tile != null) { openTile(Number(b.dataset.tile)); return; }
    if (a === 'end') { setConfirm(true); return; }
    if (a === 'end-no') { setConfirm(false); return; }
    if (a === 'end-yes') { renderEnd(); return; }
    if (a === 'reveal') { reveal(); return; }
    if (a === 'pause' && G.card) { G.card.paused = !G.card.paused; b.classList.toggle('paused', G.card.paused); b.setAttribute('aria-label', G.card.paused ? 'Timer paused: tap to carry on' : 'Timer: tap to pause'); return; }
    if (a === 'read') { readCard(); return; }
    if (a === 'cancel') { closeCard(); return; }
    if (b.dataset.award != null) { toggleAward(Number(b.dataset.award)); return; }
    if (a === 'nobody') { finish(true); return; }
    if (a === 'done') { finish(false); return; }
    if (a === 'sur-ok') { doSurprise(null); return; }
    if (b.dataset.victim != null) { doSurprise(Number(b.dataset.victim)); return; }
  }
  if (G.phase === 'end' && a === 'again') { start(); }
}
function focusSel(sel) { const el = root() && root().querySelector(sel); if (el) el.focus(); }
function setConfirm(on) {
  G.confirm = on;
  const c = root().querySelector('.qb-confirm');
  if (c) c.hidden = !on;
  root().querySelectorAll('.qb-top [data-b="end"], .qb-top [data-b="full"]').forEach((x) => { x.hidden = on; });
  if (on) focusSel('[data-b="end-yes"]');
}
function onKey(e) {
  if (!G || !G.stage.open) return;
  const t = e.target, typing = t && t.closest && t.closest('input,textarea,select');
  const k = e.key;
  if (k === 'Escape') {
    e.preventDefault(); e.stopPropagation();
    if (G.phase === 'setup' || G.phase === 'end') { G.stage.close(); return; }
    if (G.card) { if (G.card.sur) return; closeCard(); return; }
    setConfirm(!G.confirm);
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (G.phase !== 'board') return;
  if (G.card) {
    if (G.card.sur) return;
    if (k === 'Enter' || k === ' ') { if (t && t.closest && t.closest('button')) return; e.preventDefault(); if (!G.card.revealed) reveal(); else finish(false); return; }
    if (/^[1-6]$/.test(k)) { e.preventDefault(); toggleAward(Number(k) - 1); return; }
    if (k === '0') { e.preventDefault(); finish(true); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); readCard(); }
    return;
  }
  if (/^\d$/.test(k)) {
    e.preventDefault();
    G.buf = (G.buf + k).slice(-2);
    clearTimeout(G.bufT);
    paintBuf();
    const n = Number(G.buf);
    const could = G.tiles.length >= 10 && G.buf.length === 1 && n * 10 <= G.tiles.length;
    if (!could) { G.bufT = setTimeout(commitBuf, 120); return; }
    G.bufT = setTimeout(commitBuf, 900);
    return;
  }
  if (k === 'Enter' && G.buf) { e.preventDefault(); clearTimeout(G.bufT); commitBuf(); }
}
function paintBuf() { const b = root() && root().querySelector('.qb-buf'); if (b) { b.textContent = G.buf ? 'Tile ' + G.buf + '…' : ''; b.classList.toggle('on', !!G.buf); } }
function commitBuf() {
  const n = Number(G.buf);
  G.buf = ''; paintBuf();
  const i = G.tiles.findIndex((t) => t.n === n);
  if (i < 0) return;
  if (G.tiles[i].used) { say('Tile ' + n + ' has gone. Pick another.'); return; }
  openTile(i);
}
