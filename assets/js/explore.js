/* Explore: the Wonder Window's 17 live windows for the whole class, out of the way of everyday teaching (Rabinder's
   point 4) but one tap from the menu. Each tile opens that window full screen (#/play/<id>). */
import { esc, icon } from './core.js?v=de4f9a51';
import { WINDOWS } from './play.js?v=de4f9a51';

const GROUPS = [['world', 'Our world', 'globe'], ['weather', 'Weather and seasons', 'sun'], ['living', 'The living world', 'heart'], ['sky', 'Sky and space', 'star'], ['dark', 'Nature at dusk and night', 'moon']];
let view = null;
export function mount(v) {
  view = v;
  view.innerHTML = '<div class="pg ex">' +
    '<header class="pg-head ex-head"><div><p class="kicker">Explore</p><h1>Wonder Window</h1><p class="pg-sub">Live scenes with sound for the whole class: a fact every few seconds, a quiz and a class vote in every window. Share your screen, or put it on the board.</p></div>' +
    '<a class="btn primary big" href="#/play">' + icon('globe') + 'Open Wonder Window</a></header>' +
    GROUPS.map(([g, name, ic]) => '<section class="pg-sec" aria-labelledby="ex-' + g + '"><h2 id="ex-' + g + '" class="ex-gh">' + icon(ic) + esc(name) + '</h2><div class="ex-grid">' +
      WINDOWS.filter((w) => w.group === g).map((w) => '<a class="ex-w" href="#/play/' + w.id + '" style="--a:' + w.a + ';--b:' + w.b + '"><b>' + esc(w.name) + '</b><small>' + esc(w.label) + '</small><span class="ex-go" aria-hidden="true">' + icon('play') + '</span></a>').join('') +
      '</div></section>').join('') + '</div>';
}
export function leave() { /* nothing running */ }
