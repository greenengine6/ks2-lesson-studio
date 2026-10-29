/* Playing a game, on the board (big, for the whole class) or on a pupil's device (one player).
   It shows the start panel, runs the template, then the end panel with the score, stars and Play again.
   Custom games ("Something new") run only inside games/run.html, a locked box: a sandboxed frame with its own strict
   security policy (no network, no storage, no way out), which passes nothing back but the score.

   playGame(host, game, o) → { stop(), restart(), pause(), resume(), sound }
   o: { mode: 'board' | 'device', sound: true, ctx: an AudioContext to share, autostart: false, focus: false,
        onScore(score, info), onEnd(result) }
   This file imports nothing from the main site except fractions.js (through common.js), so the pupils' page can
   use it as it is. */
import { normGame, TEMPLATE_BY_ID } from './model.js?v=73f756c9';
import { makeSfx } from './sfx.js?v=73f756c9';
import { el, txt, panel, starsHTML, starsFor, icon, confetti } from './common.js?v=73f756c9';
import * as pop from './pop.js?v=73f756c9';
import * as pairs from './pairs.js?v=73f756c9';
import * as sort from './sort.js?v=73f756c9';
import * as race from './race.js?v=73f756c9';
import * as memory from './memory.js?v=73f756c9';

const RUN = { pop, pairs, sort, race, memory };
const VERSION = (() => { try { return new URL(import.meta.url).search; } catch (e) { return ''; } })();
/* games/run.html, the locked box (two folders up from assets/js/games). */
export const runnerURL = () => new URL('../../../games/run.html', import.meta.url).href.split('?')[0] + VERSION;

/* The games' look (assets/css/games.css): linked once, for pages that do not link it already. */
function ensureCSS() {
  if (document.querySelector('link[data-kg-css], link[href*="css/games.css"]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.dataset.kgCss = '1';
  l.href = new URL('../../css/games.css', import.meta.url).href.split('?')[0] + VERSION;
  document.head.appendChild(l);
}

const HOW = {
  pop: { board: 'Pop only the balloons that fit the rule. A wrong one costs a life.', device: 'Tap only the balloons that fit the rule. A wrong one costs a life.' },
  pairs: { board: 'Tap a card, then its partner in the other column.', device: 'Tap a card, then its partner in the other column.' },
  sort: { board: 'Drag each one into its group, or tap it and then the group. Then press Check.', device: 'Drag each one into its group, or tap it and then the group. Then press Check.' },
  race: { board: 'Read the question together. Teams answer, then tap every team that got it right and press Move.', device: 'Pick the right answer to fly forward. Beat the clock rocket to the finish!' },
  memory: { board: 'Turn over two cards at a time. Find all the pairs.', device: 'Turn over two cards at a time. Find all the pairs.' }
};

export function playGame(host, game, o) {
  o = o || {};
  ensureCSS();
  const g = normGame(game);
  const mode = o.mode === 'device' ? 'device' : 'board';
  host.innerHTML = '';
  if (!g) {
    const p = el('div', 'kg kg-broken');
    p.innerHTML = '<p>This game could not be opened.</p>';
    host.appendChild(p);
    return { stop() { p.remove(); }, restart() {}, pause() {}, resume() {}, sound: false };
  }
  const root = el('div', 'kg kg-' + g.template + ' is-' + mode);
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Game: ' + g.title);
  root.tabIndex = -1;
  host.appendChild(root);
  const sfx = makeSfx({ ctx: o.ctx, sound: o.sound !== false });
  let cur = null, stopped = false, endT = 0;
  const h = {
    mode, sfx,
    onScore(s, info) { if (o.onScore) { try { o.onScore(s, info || {}); } catch (e) { /* the host's problem, not the game's */ } } },
    onEnd(r) { ended(r); }
  };

  function fresh() {
    root.innerHTML = '';
    const lv = el('div', 'kg-live kg-sr');
    lv.setAttribute('aria-live', 'polite');
    root.appendChild(lv);
  }
  function intro() {
    fresh();
    if (g.template === 'custom') { start(); return; }
    const c = g.content || {};
    const rule = g.template === 'pop' ? c.rule : g.template === 'race' ? '' : c.prompt;
    const p = panel(root, '<p class="kg-kind"></p><h2 class="kg-title"></h2>' + (rule ? '<p class="kg-rule-big"></p>' : '') + '<p class="kg-how"></p>' +
      '<button type="button" class="kg-btn big kg-go">' + icon('play') + '<span>Start</span></button>', 'start');
    txt(p.querySelector('.kg-kind'), TEMPLATE_BY_ID[g.template].name + (g.year ? ' · ' + g.year : ''));
    txt(p.querySelector('.kg-title'), g.title);
    if (rule) txt(p.querySelector('.kg-rule-big'), rule);
    txt(p.querySelector('.kg-how'), (HOW[g.template] || {})[mode] || '');
    const go = p.querySelector('.kg-go');
    go.addEventListener('click', start);
    if (o.focus) setTimeout(() => { try { go.focus({ preventScroll: true }); } catch (e) { /* fine */ } }, 40);
  }
  function start() {
    if (stopped) return;
    clearTimeout(endT);
    fresh();
    if (g.template === 'custom') { cur = runCustom(root, g, h); return; }
    cur = RUN[g.template].run(root, g, h);
    if (o.focus) { try { root.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
  }
  function ended(r) {
    if (o.onEnd) { try { o.onEnd(r); } catch (e) { /* the host's problem */ } }
    if (r.custom) return;                                   // a custom game shows its own end screen
    clearTimeout(endT);
    endT = setTimeout(() => {
      if (stopped) return;
      const board = g.template === 'race' && mode === 'board';
      const stars = board ? 3 : starsFor(r.part || 0);
      const head = board ? (r.winners && r.winners.length ? r.winners.join(' and ') + (r.winners.length > 1 ? ' win!' : ' wins!') : 'The race is over!')
        : r.won ? 'Well done!' : r.why === 'lives' ? 'Out of lives!' : r.why === 'time' ? 'Time’s up!' : r.why === 'clock' ? 'The clock won this time!' : 'Finished!';
      const detail = board ? '<ol class="kg-podium">' + (r.teams || []).slice().sort((a, b) => b.steps - a.steps).map((t) => '<li><span></span><b>' + t.steps + '</b> steps</li>').join('') + '</ol>'
        : '<p class="kg-final"><b>' + Math.max(0, Math.round(r.score || 0)) + '</b> points</p>';
      const p = panel(root, '<p class="kg-kind">' + (board ? 'Quiz race' : 'Your score') + '</p><h2 class="kg-title"></h2>' + starsHTML(stars) + detail +
        '<button type="button" class="kg-btn big kg-again">' + icon('again') + '<span>Play again</span></button>', 'end');
      txt(p.querySelector('.kg-title'), head);
      if (board) {
        const names = (r.teams || []).slice().sort((a, b) => b.steps - a.steps);
        p.querySelectorAll('.kg-podium li span').forEach((s, i) => txt(s, names[i].name));
      }
      p.querySelector('.kg-again').addEventListener('click', () => restart());
      sfx.play(board || r.won ? 'win' : 'lose');
      if (stars >= 2) confetti(root);
      if (o.focus) setTimeout(() => { try { p.querySelector('.kg-again').focus({ preventScroll: true }); } catch (e) { /* fine */ } }, 40);
    }, 550);
  }
  function stopCur() { if (cur && cur.stop) { try { cur.stop(); } catch (e) { /* already stopped */ } } cur = null; }
  function restart() { stopCur(); if (o.autostart) start(); else intro(); }
  if (o.autostart) start(); else intro();
  return {
    stop() { stopped = true; clearTimeout(endT); stopCur(); sfx.close(); root.remove(); },
    restart() { stopped = false; restart(); },
    pause() { if (cur && cur.pause) cur.pause(); },
    resume() { if (cur && cur.resume) cur.resume(); },
    get sound() { return sfx.sound; },
    set sound(v) { sfx.sound = !!v; }
  };
}

/* ---------------- a custom game, in the locked box ---------------- */
function runCustom(root, g, h) {
  const frame = el('iframe', 'kg-frame');
  frame.setAttribute('sandbox', 'allow-scripts');               // never allow-same-origin: the game can reach nothing of ours
  frame.setAttribute('title', g.title || 'Game');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('loading', 'eager');
  let ready = false, best = 0, rounds = 0;
  const onMsg = (e) => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'kg-ready' && !ready) { ready = true; frame.contentWindow.postMessage({ type: 'run', html: g.html }, '*'); return; }
    if (d.type === 'kg-score') {
      const s = Math.round(Number(d.score));
      if (!Number.isFinite(s)) return;
      best = Math.max(best, s);
      h.onScore(s, { done: !!d.done, best });
      if (d.done) { rounds += 1; h.onEnd({ score: s, best, part: 1, won: true, custom: true, rounds }); }
      return;
    }
    if (d.type === 'kg-left') h.onScore(best, { left: true, best });
  };
  window.addEventListener('message', onMsg);
  frame.src = runnerURL();
  root.appendChild(frame);
  return {
    stop() {
      window.removeEventListener('message', onMsg);
      try { if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'stop' }, '*'); } catch (e) { /* gone */ }
      frame.remove();
    }
  };
}
