/* Memory: cards lie face down. Turn two at a time; if they belong together they stay face up, otherwise they turn
   back. Fewer turns and less time score more. Touch, mouse and keyboard (the cards are buttons). */
import { el, txt, shuffle, makeHud, makeClock, floatText, say, icon } from './common.js?v=de4f9a51';

export function run(root, g, h) {
  const c = g.content, set = g.settings, total = c.pairs.length;
  const cards = shuffle(c.pairs.flatMap((p, i) => [{ i, side: 0, text: p[0] }, { i, side: 1, text: p[1] }]));
  const n = cards.length;
  const stage = el('div', 'kg-stage kg-mem-stage');
  // a grid that suits the number of cards (4 to 6 across)
  const cols = n <= 8 ? 4 : n <= 12 ? 4 : n <= 16 ? (h.mode === 'device' ? 4 : 4) : n <= 20 ? 5 : 6;
  stage.innerHTML = '<div class="kg-grid" style="--cols:' + cols + ';--rows:' + Math.ceil(n / cols) + '"></div>';
  root.appendChild(stage);
  const grid = stage.querySelector('.kg-grid');
  const hud = makeHud(root, { rule: c.prompt });
  let open = [], found = 0, turns = 0, ended = false, wait = false;
  hud.score(0); hud.progress('0 of ' + total + ' pairs');
  cards.forEach((card, k) => {
    const b = el('button', 'kg-mcard');
    b.type = 'button'; b.dataset.k = String(k);
    b.setAttribute('aria-label', 'Card ' + (k + 1) + ', face down');
    b.innerHTML = '<span class="kg-mback" aria-hidden="true">' + icon('star') + '</span><span class="kg-mface"><span class="kg-ct"></span></span>';
    txt(b.querySelector('.kg-ct'), card.text);
    grid.appendChild(b);
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.kg-mcard');
    if (!b || ended || wait || b.classList.contains('up')) return;
    const k = Number(b.dataset.k), card = cards[k];
    b.classList.add('up'); b.setAttribute('aria-label', 'Card ' + (k + 1) + ': ' + card.text);
    h.sfx.play('flip');
    open.push(b);
    if (open.length < 2) return;
    turns += 1;
    const [a, b2] = open; open = [];
    const ca = cards[Number(a.dataset.k)], cb = cards[Number(b2.dataset.k)];
    const r = b2.getBoundingClientRect(), s = stage.getBoundingClientRect(), x = r.left - s.left + r.width / 2, y = r.top - s.top;
    if (ca.i === cb.i && ca.side !== cb.side) {
      found += 1;
      [a, b2].forEach((x2) => { x2.classList.add('done'); x2.disabled = true; });
      h.sfx.play('right');
      floatText(stage, x, y, 'A pair!', true);
      say(root, 'A pair: ' + ca.text + ' and ' + cb.text + '.');
      paint();
      if (found === total) finish(true);
    } else {
      wait = true;
      h.sfx.play('wrong');
      say(root, 'Not a pair. Remember where they are.');
      setTimeout(() => { [a, b2].forEach((x2) => { x2.classList.remove('up'); x2.setAttribute('aria-label', 'Card ' + (Number(x2.dataset.k) + 1) + ', face down'); }); wait = false; }, 1000);
      paint();
    }
  });
  function points() { return Math.max(0, found * 20 - Math.max(0, turns - found) * 2); }
  function paint() { const p = points(); hud.score(p); hud.progress(found + ' of ' + total + ' pairs'); h.onScore(p, { found, turns }); }
  function finish(all) {
    if (ended) return;
    ended = true; clock.stop();
    let p = points();
    if (all && set.seconds > 0) p += Math.round(clock.left / 2);
    hud.score(p);
    h.onScore(p, { found, turns });
    grid.querySelectorAll('.kg-mcard').forEach((b) => { b.disabled = true; b.classList.add('up'); });
    h.onEnd({ score: p, right: found, wrong: turns - found, max: total * 20, part: found / total * Math.min(1, (total * 1.6) / Math.max(1, turns)), won: all, why: all ? 'all' : 'time' });
  }
  const clock = makeClock(set.seconds || 0, (t) => hud.time(t, set.seconds > 0 && t <= 10), () => finish(false)).start();
  h.sfx.play('go');
  return { stop() { ended = true; clock.stop(); }, pause() { clock.pause(); }, resume() { clock.resume(); } };
}
