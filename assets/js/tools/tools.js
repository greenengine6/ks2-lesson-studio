/* Class tools (#/tools and #/tools/<tool>): Timer, Stopwatch, Noise meter, Pick a name, Groups, Work signs, Class points,
   Traffic light, Dice, and Now and next. Calm on the page, big and bright on the board (Full screen), and in a small
   dock over the slides while presenting (openToolDock).
   Exports for the rest of the site:
   - mount(view, sub), leave(): the page;
   - openToolDock(host): the Tools dock over Present mode (host = the present screen); a toggle;
   - startTimer(seconds, o): Symphony's "start a timer for 2 minutes" and the present bars; o.host + o.panel shows it
     over the slides;
   - timesUp(o): the teacher's chosen end sound, flash and voice (for the older present timers);
   - pickName(o): a name picked fairly (o.host: where to show it). Resolves to the name, or '' if there is nobody. */
import { $, $$, esc, icon } from '../core.js?v=cdc164df';
import { TOOLS, TOOL_BY_ID, ti } from './shared.js?v=cdc164df';
import { start, T, timesUp as ring } from './timer.js?v=cdc164df';
import { pickName as pick } from './names.js?v=cdc164df';
import { stopNoise } from './noise.js?v=cdc164df';
import { renderTool, openBoard, openToolDock, openPanel, closePanel } from './dock.js?v=cdc164df';

let cleanups = [];
const runCleanups = () => { cleanups.forEach((c) => { try { c(); } catch (e) { /* fine */ } }); cleanups = []; };
const MAIN = ['timer', 'signs', 'noise', 'names', 'groups', 'points'], MORE = ['stopwatch', 'traffic', 'dice', 'nownext'];

function stripHTML(cur) {
  return '<nav class="tl-strip" aria-label="All class tools">' + TOOLS.map((t) => '<a href="#/tools/' + t.id + '" class="tl-strip-a"' + (t.id === cur ? ' aria-current="page"' : '') + '>' + ti(t.id) + '<span>' + esc(t.name) + '</span></a>').join('') + '</nav>';
}
function cardHTML(id, extra) {
  const t = TOOL_BY_ID[id];
  return '<section class="tl-card tl-c-' + id + (extra || '') + '" aria-labelledby="tl-h-' + id + '"><header class="tl-card-h"><span class="tl-card-ico" aria-hidden="true">' + ti(id) + '</span><h2 id="tl-h-' + id + '"><a href="#/tools/' + id + '" title="Open ' + esc(t.name) + ' big">' + esc(t.name) + '</a></h2>' +
    '<button type="button" class="btn small icon" data-tl-full="' + id + '" aria-label="' + esc(t.name) + ' on the whole screen" title="Full screen">' + icon('expand') + '</button></header>' +
    '<div class="tl-slot" data-slot="' + id + '" data-mode="card"></div></section>';
}
function gridHTML() {
  return '<div class="wrap pg tl-page"><header class="pg-head"><p class="kicker">For the board</p><h1>Class tools</h1>' +
    '<p class="pg-sub">Timers, signs and helpers for the board. While you present, they sit on top of your slides: press Tools.</p></header>' +
    stripHTML('') +
    '<div class="tl-grid">' + MAIN.map((id) => cardHTML(id, id === 'timer' ? ' tl-tall' : '')).join('') + '</div>' +
    '<h2 class="tl-more-h">More tools</h2><div class="tl-grid tl-grid-more">' + MORE.map((id) => cardHTML(id)).join('') + '</div></div>';
}
function oneHTML(id) {
  const t = TOOL_BY_ID[id];
  return '<div class="wrap pg tl-page tl-one"><header class="pg-head"><p class="kicker"><a class="tl-back" href="#/tools">' + icon('left') + 'All class tools</a></p><h1>' + esc(t.name) + '</h1><p class="pg-sub">' + esc(t.sub) + '.</p></header>' +
    '<div class="tl-one-bar"><button type="button" class="btn" data-tl-full="' + id + '">' + icon('expand') + '<span>Full screen for the board</span></button></div>' +
    '<section class="tl-card tl-big tl-c-' + id + '" aria-label="' + esc(t.name) + '"><div class="tl-slot" data-slot="' + id + '" data-mode="big"></div></section>' +
    stripHTML(id) + '</div>';
}
export function mount(view, sub) {
  runCleanups();
  const id = TOOL_BY_ID[sub] ? sub : '';
  if (view.dataset.tlSub != null && view.dataset.tlSub !== id) window.scrollTo({ top: 0, behavior: 'auto' });
  view.dataset.tlSub = id;
  view.innerHTML = id ? oneHTML(id) : gridHTML();
  $$('[data-slot]', view).forEach((slot) => cleanups.push(renderTool(slot.dataset.slot, slot, slot.dataset.mode)));
  if (!view.dataset.tlWired) {
    view.dataset.tlWired = '1';
    view.addEventListener('click', (e) => {
      const f = e.target.closest('[data-tl-full]');
      if (f) { e.preventDefault(); openBoard(f.dataset.tlFull); }
    });
  }
  document.title = (id ? TOOL_BY_ID[id].name + ' · ' : '') + 'Class tools · KS2 Lesson Engine';
}
/* Leaving the page: the microphone goes off; a running timer carries on (its pill shows on the next page). */
export function leave() { runCleanups(); stopNoise(); }

export { openToolDock, openPanel, closePanel, openBoard };
export function startTimer(seconds, o) {
  o = o || {};
  start(seconds);
  if (o.host && o.panel) openPanel('timer', o.host);
  return { total: T.total, ends: T.ends };
}
export function timesUp(o) { return ring(o); }
export function pickName(o) { return pick(o); }
