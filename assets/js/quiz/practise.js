/* Practise on the board: the whole class answers together, no devices. One question at a time, big, with a
   countdown; Reveal shows the right answer and why; the teacher taps "We got it" or "Not this time" and the class
   score moves on. Keys: Space or Enter reveals, the arrow keys move, R reads it aloud, Esc closes. */
import { esc, icon, toast } from '../core.js?v=cdc164df';
import { Voice } from '../fx/voice.js?v=cdc164df';
import { fracWords } from '../fractions.js?v=cdc164df';
import { confetti } from '../fx/particles.js?v=cdc164df';
import { picURL, creditText } from '../pics.js?v=cdc164df';
import { track } from '../track.js?v=cdc164df';
import { playable, answerText, LETTERS, OPT_COLOURS } from './model.js?v=cdc164df';
import { shapeSVG, Fx } from './fx.js?v=cdc164df';
import { openStage } from './stage.js?v=cdc164df';

const FULL = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
let P = null;

export function openPractise(quiz, o) {
  o = o || {};
  const { quiz: q } = playable(quiz);
  if (!q.questions.length) { toast('This quiz has no questions ready to play yet.'); return null; }
  if (P && P.stage.open) P.stage.close();
  const stage = openStage({ host: o.host, cls: 'qp-stage', label: 'Practise: ' + (q.title || 'Quiz'), onClose: closed });
  P = { stage, quiz: q, i: 0, revealed: false, marks: q.questions.map(() => null), left: 0, paused: false, timer: null, t0: Date.now(), done: false };
  stage.el.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey, true);
  render();
  return { close: () => stage.close() };
}
function closed() {
  document.removeEventListener('keydown', onKey, true);
  stop(); Voice.stop();
  if (P) { try { track('present', { eng: 'quiz', title: (P.quiz.title || 'Quiz') + ' (practise)', ms: Date.now() - P.t0, screens: P.quiz.questions.length, seen: P.marks.filter((m) => m != null).length, ex: 0 }); } catch (e) { /* best effort */ } }
  P = null;
}
const el = () => P && P.stage.el;
const score = () => P.marks.filter((m) => m === 1).length;
const live = (t) => { const l = el() && el().querySelector('#qp-live'); if (l) { l.textContent = ''; setTimeout(() => { l.textContent = t; }, 30); } };

function render() {
  stop();
  const q = P.quiz.questions[P.i], n = P.quiz.questions.length;
  P.revealed = false; P.left = q.secs; P.paused = false;
  const pic = q.pic && picURL(q.pic, '960') ? '<figure class="qb-pic"><img src="' + esc(picURL(q.pic, '960')) + '" alt="' + esc(q.pic.alt || '') + '" decoding="async"><figcaption>' + esc(creditText(q.pic, true)) + '</figcaption></figure>' : '';
  const opts = q.type === 'type' ? '<p class="qp-say">Pupils write their answer on a whiteboard or say it to a partner.</p>' :
    '<div class="qb-opts n' + q.opts.length + '">' + q.opts.map((o, j) => '<div class="qb-opt" data-opt="' + j + '" style="--oc:' + OPT_COLOURS[j % 4] + '">' + shapeSVG(j) + '<b class="qb-l">' + LETTERS[j] + '</b><span>' + esc(o) + '</span></div>').join('') + '</div>';
  el().innerHTML = '<div class="qp">' +
    '<header class="qb-top"><span class="qb-badge qp-badge">Practise</span><h1>' + esc(P.quiz.title || 'Quiz') + '</h1><div class="qb-acts">' +
      '<span class="qp-score" aria-label="Class score">' + icon('star') + '<b>' + score() + '</b><small>class score</small></span>' +
      '<button type="button" class="qb-btn" data-p="full">' + FULL + '<span>Full screen</span></button><button type="button" class="qb-btn" data-p="close">' + icon('close') + '<span>Close</span></button></div></header>' +
    '<div class="qp-progress" aria-hidden="true">' + P.quiz.questions.map((_, j) => '<i class="' + (j === P.i ? 'now' : P.marks[j] === 1 ? 'ok' : P.marks[j] === 0 ? 'no' : '') + '"></i>').join('') + '</div>' +
    '<section class="qp-card" aria-labelledby="qp-q"><div class="qb-ctop"><span class="qb-pill">Question ' + (P.i + 1) + ' of ' + n + '</span>' +
      '<button type="button" class="qb-timer" data-p="pause" aria-label="Timer: tap to pause">' + '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5"/></svg><b>' + fmt(P.left) + '</b></button>' +
      '<button type="button" class="qb-btn small" data-p="read">' + icon('volume') + '<span>Read it</span></button></div>' +
      '<h2 class="qb-q" id="qp-q">' + esc(q.q) + '</h2>' + pic + opts +
      '<div class="qb-ans" hidden>' + (q.type === 'type' ? '<p class="qb-typed"><span>Answer</span><b>' + esc(answerText(q)) + '</b></p>' : '') + (q.why ? '<p class="qb-why"><b>Why:</b> ' + esc(q.why) + '</p>' : '') + '</div>' +
      '<div class="qp-foot"><button type="button" class="qb-btn" data-p="back"' + (P.i === 0 ? ' disabled' : '') + '>' + icon('left') + '<span>Back</span></button>' +
        '<button type="button" class="qb-go" data-p="reveal">' + icon('eye') + 'Reveal</button>' +
        '<span class="qp-mark" hidden><button type="button" class="qb-go ok" data-p="got">' + icon('check') + 'We got it</button><button type="button" class="qb-btn" data-p="not">Not this time</button></span>' +
        '<button type="button" class="qb-btn" data-p="next">' + '<span>' + (P.i === n - 1 ? 'Finish' : 'Next') + '</span>' + icon('right') + '</button></div></section>' +
    '<p class="sr" aria-live="polite" id="qp-live"></p></div>';
  P.timer = setInterval(tick, 1000);
  setTimeout(() => { const b = el() && el().querySelector('[data-p="reveal"]'); if (b) b.focus({ preventScroll: true }); }, 40);
  live('Question ' + (P.i + 1) + '. ' + q.q);
}
function tick() {
  if (!P || P.paused || P.revealed) return;
  P.left = Math.max(0, P.left - 1);
  const b = el().querySelector('.qb-timer b'), box = el().querySelector('.qb-timer');
  if (b) b.textContent = P.left ? fmt(P.left) : 'Time’s up';
  if (box) { box.classList.toggle('low', P.left > 0 && P.left <= 5); box.classList.toggle('up', !P.left); }
  if (P.left > 0 && P.left <= 5) Fx.tick();
  if (!P.left) { stop(); Fx.timeUp(); live('Time’s up!'); }
}
function stop() { if (P && P.timer) { clearInterval(P.timer); P.timer = null; } }
function reveal() {
  if (!P || P.revealed) return;
  P.revealed = true; stop();
  const q = P.quiz.questions[P.i], card = el().querySelector('.qp-card');
  card.classList.add('revealed');
  card.querySelectorAll('[data-opt]').forEach((o) => { const r = Number(o.dataset.opt) === q.a; o.classList.toggle('right', r); o.classList.toggle('dim', !r); if (r) o.insertAdjacentHTML('beforeend', '<i class="qb-tick">' + icon('check') + '</i>'); });
  card.querySelector('.qb-ans').hidden = false;
  card.querySelector('[data-p="reveal"]').hidden = true;
  card.querySelector('.qp-mark').hidden = false;
  Fx.reveal();
  live('The answer is ' + answerText(q) + '.');
  setTimeout(() => { const g = card.querySelector('[data-p="got"]'); if (g) g.focus({ preventScroll: true }); }, 30);
}
function mark(v) {
  P.marks[P.i] = v;
  if (v) Fx.right(); else Fx.wrong();
  go(1);
}
function go(d) {
  const n = P.quiz.questions.length, j = P.i + d;
  if (j >= n) { end(); return; }
  if (j < 0) return;
  P.i = j; render();
}
function end() {
  stop(); P.done = true;
  const n = P.quiz.questions.length, s = score();
  const stars = s / n >= 0.9 ? 3 : s / n >= 0.6 ? 2 : s ? 1 : 0;
  const star = (on) => '<svg class="qp-star' + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>';
  el().innerHTML = '<div class="qp qp-end"><header class="qb-top"><span class="qb-badge qp-badge">Practise</span><h1>' + esc(P.quiz.title || 'Quiz') + '</h1><div class="qb-acts"><button type="button" class="qb-btn" data-p="close">' + icon('close') + '<span>Close</span></button></div></header>' +
    '<div class="qp-result"><div class="qp-stars">' + [0, 1, 2].map((k) => star(k < stars)).join('') + '</div><h2>' + s + ' out of ' + n + '</h2><p>' + esc(s === n ? 'Every question! Brilliant work, everyone.' : s / n >= 0.6 ? 'Great work, class. Look again at the ones we missed.' : 'Good try. Let’s go over the tricky ones together.') + '</p>' +
    '<div class="qb-endacts"><button type="button" class="qb-go" data-p="again">' + icon('refresh') + 'Again</button><button type="button" class="qb-btn" data-p="close">Back to the quiz</button></div></div><p class="sr" aria-live="polite" id="qp-live"></p></div>';
  if (stars >= 2) { Fx.fanfare(); confetti(el(), { count: 180, y: 0.4 }); }
  live('The class scored ' + s + ' out of ' + n + '.');
}
function read() {
  const q = P.quiz.questions[P.i], parts = [q.q];
  if (q.type !== 'type') q.opts.forEach((o, j) => parts.push(LETTERS[j] + ': ' + o + '.'));
  if (P.revealed) parts.push('The answer is ' + answerText(q) + '.', q.why || '');
  Voice.say(fracWords(parts.filter(Boolean).join(' ')), { lang: 'en-GB', style: 'chat' });
}
function onClick(e) {
  const b = e.target.closest('button');
  if (!b || b.disabled || !P) return;
  const a = b.dataset.p;
  if (a === 'close') P.stage.close();
  else if (a === 'full') P.stage.toggleFull();
  else if (a === 'reveal') reveal();
  else if (a === 'got') mark(1);
  else if (a === 'not') mark(0);
  else if (a === 'next') go(1);
  else if (a === 'back') go(-1);
  else if (a === 'read') read();
  else if (a === 'pause') { P.paused = !P.paused; b.classList.toggle('paused', P.paused); }
  else if (a === 'again') { P.i = 0; P.marks = P.quiz.questions.map(() => null); P.done = false; render(); }
}
function onKey(e) {
  if (!P || !P.stage.open) return;
  const k = e.key, t = e.target;
  if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); P.stage.close(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || (t && t.closest && t.closest('input,textarea,select'))) return;
  if (P.done) return;
  if ((k === ' ' || k === 'Enter') && !(t && t.closest && t.closest('button'))) { e.preventDefault(); if (!P.revealed) reveal(); else mark(1); return; }
  if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); go(1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
  else if (k === 'r' || k === 'R') { e.preventDefault(); read(); }
}
