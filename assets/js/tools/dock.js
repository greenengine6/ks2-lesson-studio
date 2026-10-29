/* Class tools over the slides: a small dock in Present mode (Timer, Pick a name, Groups, Work signs, Class points,
   Noise meter). Each opens as a floating panel over the slides; Full screen puts it on the whole board; the timer can
   shrink to a small pill. Also the one place that knows how to draw each tool and open it full screen. */
import { $, esc, icon, bus } from '../core.js?v=de4f9a51';
import { ti, TOOL_BY_ID, boardOverlay } from './shared.js?v=de4f9a51';
import { timerView, timerBoard, stopwatchView } from './timer.js?v=de4f9a51';
import { namesView, groupsView } from './names.js?v=de4f9a51';
import { noiseView, noiseBoard } from './noise.js?v=de4f9a51';
import { signsView, signBoard, pointsView, trafficView, diceView, nownextView } from './visual.js?v=de4f9a51';

export const RENDER = { timer: timerView, stopwatch: stopwatchView, noise: noiseView, names: namesView, groups: groupsView, signs: signsView, points: pointsView, traffic: trafficView, dice: diceView, nownext: nownextView };
/* Draw tool `id` into a fresh element inside `slot`; returns its cleanup. */
export function renderTool(id, slot, mode) {
  const host = document.createElement('div');
  host.className = 'tl-host';
  slot.appendChild(host);
  const f = RENDER[id];
  const c = f ? f(host, mode) : null;
  return typeof c === 'function' ? c : () => {};
}
/* Tool `id` on the whole screen, for the board. */
export function openBoard(id) {
  if (id === 'timer') return timerBoard();
  if (id === 'noise') return noiseBoard();
  if (id === 'signs') return signBoard();
  const t = TOOL_BY_ID[id];
  if (!t) return null;
  return boardOverlay(t.name, (stage) => renderTool(id, stage, 'board'), { cls: 'tl-b-' + id });
}

/* ---------------- the dock over the slides ---------------- */
const DOCK_TOOLS = ['timer', 'names', 'groups', 'signs', 'points', 'noise'];
let panel = null, panelClean = null, escH = null;
export function closePanel() {
  if (panelClean) { try { panelClean(); } catch (e) { /* fine */ } panelClean = null; }
  if (panel) { panel.remove(); panel = null; }
  if (escH) { document.removeEventListener('keydown', escH, true); escH = null; }
  document.querySelectorAll('.tl-dock [data-dk]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}
export function openPanel(id, host) {
  const t = TOOL_BY_ID[id];
  if (!t) return null;
  const same = panel && panel.dataset.id === id && panel.parentNode === host;
  closePanel();
  if (same) return null;
  host = host || document.body;
  panel = document.createElement('section');
  panel.className = 'tl-panel' + (host === document.body ? ' fixed' : '');
  panel.dataset.id = id;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', t.name);
  panel.innerHTML = '<header class="tl-panel-h"><span class="tl-panel-ico">' + ti(id) + '</span><b>' + esc(t.name) + '</b>' +
    '<button type="button" class="btn small icon" data-pn="full" aria-label="' + esc(t.name) + ' on the whole screen" title="Full screen">' + icon('expand') + '</button>' +
    '<button type="button" class="btn small icon" data-pn="x" aria-label="Close ' + esc(t.name) + '" title="Close (Esc)">' + icon('close') + '</button></header><div class="tl-panel-body"></div>';
  host.appendChild(panel);
  panel._close = closePanel;
  panelClean = renderTool(id, $('.tl-panel-body', panel), 'panel');
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pn]');
    if (!b) return;
    if (b.dataset.pn === 'x') closePanel();
    else if (b.dataset.pn === 'full') { closePanel(); openBoard(id); }
  });
  escH = (e) => { if (e.key === 'Escape' && panel && !document.querySelector('.tl-board')) { e.preventDefault(); e.stopPropagation(); closePanel(); } };
  document.addEventListener('keydown', escH, true);
  document.querySelectorAll('.tl-dock [data-dk]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dk === id)));
  return panel;
}
/* Leaving Present mode takes the dock and its panel away with it. */
bus.on('present', (on) => { if (!on) { document.querySelectorAll('.tl-dock').forEach((d) => d.remove()); closePanel(); } });
/* The dock itself. Calling it again on the same screen closes it (it is a toggle for the Tools button). */
export function openToolDock(host) {
  host = host || document.body;
  const old = host.querySelector(':scope > .tl-dock');
  if (old) { old.remove(); closePanel(); return null; }
  const dock = document.createElement('div');
  dock.className = 'tl-dock' + (host === document.body ? ' fixed' : '');
  dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Class tools'); dock.setAttribute('aria-orientation', 'vertical');
  dock.innerHTML = DOCK_TOOLS.map((id) => '<button type="button" class="tl-dk" data-dk="' + id + '" aria-pressed="false" aria-label="' + esc(TOOL_BY_ID[id].name) + '" title="' + esc(TOOL_BY_ID[id].name) + '">' + ti(id) + '<span>' + esc(TOOL_BY_ID[id].name) + '</span></button>').join('') +
    '<button type="button" class="tl-dk tl-dk-x" data-dk-x aria-label="Close class tools" title="Close class tools">' + icon('close') + '</button>';
  host.appendChild(dock);
  dock.addEventListener('click', (e) => {
    if (e.target.closest('[data-dk-x]')) { dock.remove(); closePanel(); return; }
    const b = e.target.closest('[data-dk]');
    if (b) openPanel(b.dataset.dk, host);
  });
  return { el: dock, close() { dock.remove(); closePanel(); } };
}
