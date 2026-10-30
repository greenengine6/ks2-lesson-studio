/* Pop-ups for the teacher while devices are locked (Rabinder asked for them): a pupil has left the class page, and has
   come back, on whatever screen she is on (the Classroom, the class view, Present mode's full screen, any page).
   A website cannot see which app a pupil opened or silence their calls; it only knows the class page went out of
   view, and for how long.
   The board is the whole class's screen, so while something is on it (a full screen, Present mode, a class tool or a
   live task on the board, the class view's "Show it on the board") a pop-up does not name the pupil, the same rule as
   a pupil's question shown on the board. The names are on the Classroom page and in the class view. */
import { esc, icon } from '../core.js?v=3c9d4698';
import { sfx } from '../fx/audio.js?v=3c9d4698';
import { Live, onLive, awayOf, nameOf } from './session.js?v=3c9d4698';

const BOARD = '#present:not([hidden]), #spresent:not([hidden]), #lpresent:not([hidden]), .tl-board, .qstage, .ltask, .cv-board, .cal-qrbig, .kg-overlay';
const onBoard = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.querySelector(BOARD));
let stack = null, watch = 0, rang = 0;
const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function box() {
  const host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'lv-alerts'; stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite');
  }
  if (stack.parentElement !== host) host.appendChild(stack);
  return stack;
}
/* Something went onto the board while a pop-up with a name was showing: take the name off. */
function sync() {
  if (!stack || !stack.children.length) { clearInterval(watch); watch = 0; return; }
  box();
  if (!onBoard()) return;
  stack.querySelectorAll('.lv-alert:not(.anon)').forEach((el) => { const t = el.querySelector('.lv-alert-t'); if (t && el._anon) { t.innerHTML = el._anon; el.classList.add('anon'); } });
}
function pop(ic, named, anon, kind, ms) {
  const el = document.createElement('div'), board = onBoard();
  el.className = 'lv-alert ' + kind + (board ? ' anon' : '');
  el._anon = anon;
  el.innerHTML = ic + '<span class="lv-alert-t">' + (board ? anon : named) + '</span><button type="button" class="lv-alert-x" aria-label="Close">' + icon('close') + '</button>';
  el.querySelector('.lv-alert-x').addEventListener('click', () => el.remove());
  const b = box();
  b.appendChild(el);
  while (b.children.length > 4) b.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, ms);
  if (!watch) watch = setInterval(sync, 1000);
}
onLive((w) => {
  if (!w || !w.away || !Live.on) return;
  const a = awayOf(w.away) || {}, name = esc(nameOf(w.away));
  if (w.on) {
    pop(icon('eye'), '<b>' + name + '</b> left the class page' + (a.n > 1 ? ' <small>(' + a.n + ' times)</small>' : ''), '<b>A pupil</b> left the class page', 'gone', 12000);
    if (Date.now() - rang > 5000) { rang = Date.now(); sfx('off'); }      // one sound, however many leave at once
  } else {
    pop(icon('check'), '<b>' + name + '</b> came back' + (a.ms ? ' after ' + clock(a.ms) : ''), '<b>A pupil</b> came back', 'back', 6000);
  }
});
/* Present mode's full screen starts and ends: keep the pop-ups on the screen that is showing, without names on the board. */
document.addEventListener('fullscreenchange', sync);
