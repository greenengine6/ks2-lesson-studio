/* Match pairs: two columns of cards. Tap one on the left and its partner on the right (either order). A right pair
   locks in green with its own number; a wrong one shakes. Ends when every pair is found (or the time or the lives
   run out). Touch, mouse and keyboard (the cards are buttons). */
import { el, txt, shuffle, makeHud, makeClock, floatText, say, icon } from './common.js?v=de4f9a51';

export function run(root, g, h) {
  const c = g.content, set = g.settings;
  const stage = el('div', 'kg-stage kg-pairs-stage');
  stage.innerHTML = '<div class="kg-cols"><div class="kg-col" data-side="0" role="group" aria-label="First halves"></div><div class="kg-col" data-side="1" role="group" aria-label="Second halves"></div></div>';
  root.appendChild(stage);
  const hud = makeHud(root, { rule: c.prompt });
  const total = c.pairs.length, lives0 = set.lives || 0;
  let score = 0, found = 0, wrong = 0, lives = lives0, pick = null, ended = false, busy = false;
  hud.score(0); hud.progress('0 of ' + total);
  if (lives0) hud.lives(lives, lives0);
  const cols = stage.querySelectorAll('.kg-col');
  [0, 1].forEach((side) => {
    shuffle(c.pairs.map((p, i) => ({ i, text: p[side] }))).forEach((it) => {
      const b = el('button', 'kg-card kg-pcard');
      b.type = 'button'; b.dataset.i = String(it.i); b.dataset.side = String(side);
      b.innerHTML = '<span class="kg-num" aria-hidden="true"></span><span class="kg-ct"></span>';
      txt(b.querySelector('.kg-ct'), it.text);
      b.setAttribute('aria-label', it.text);
      b.setAttribute('aria-pressed', 'false');
      cols[side].appendChild(b);
    });
  });
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.kg-pcard');
    if (!b || ended || busy || b.classList.contains('done')) return;
    h.sfx.play('flip');
    if (!pick || pick.dataset.side === b.dataset.side) {
      if (pick) pick.setAttribute('aria-pressed', 'false');
      pick = pick === b ? null : b;
      if (pick) pick.setAttribute('aria-pressed', 'true');
      return;
    }
    const a = pick; pick = null;
    a.setAttribute('aria-pressed', 'false');
    const r = b.getBoundingClientRect(), s = stage.getBoundingClientRect(), x = r.left - s.left + r.width / 2, y = r.top - s.top;
    if (a.dataset.i === b.dataset.i) {
      found += 1; score += 10;
      [a, b].forEach((x2) => { x2.classList.add('done'); x2.disabled = true; x2.querySelector('.kg-num').innerHTML = icon('check'); x2.style.setProperty('--n', String(found)); });
      h.sfx.play('right');
      floatText(stage, x, y, '+10', true);
      say(root, 'A pair! ' + found + ' of ' + total + '.');
      hud.score(score); hud.progress(found + ' of ' + total);
      h.onScore(score, { found, wrong });
      if (found === total) finish(true);
    } else {
      wrong += 1; score = Math.max(0, score - 2);
      busy = true;
      [a, b].forEach((x2) => x2.classList.add('nope'));
      setTimeout(() => { [a, b].forEach((x2) => x2.classList.remove('nope')); busy = false; }, 520);
      h.sfx.play('wrong');
      floatText(stage, x, y, 'Try again', false);
      say(root, 'Not a pair. Try again.');
      hud.score(score);
      h.onScore(score, { found, wrong });
      if (lives0) { lives -= 1; hud.lives(lives, lives0); if (lives <= 0) finish(false); }
    }
  });
  function finish(all) {
    if (ended) return;
    ended = true;
    clock.stop();
    if (all && set.seconds > 0) { const bonus = Math.round(clock.left / 2); if (bonus) { score += bonus; hud.score(score); h.onScore(score, { found, wrong, bonus }); } }
    stage.querySelectorAll('.kg-pcard').forEach((b) => { b.disabled = true; });
    h.onEnd({ score, right: found, wrong, max: total * 10, part: (found / total) * (total / (total + wrong * 0.5)), won: all, why: all ? 'all' : set.seconds > 0 && clock.left <= 0 ? 'time' : 'lives' });
  }
  const clock = makeClock(set.seconds || 0, (t) => hud.time(t, set.seconds > 0 && t <= 10), () => finish(false)).start();
  h.sfx.play('go');
  return { stop() { ended = true; clock.stop(); }, pause() { clock.pause(); }, resume() { clock.resume(); } };
}
