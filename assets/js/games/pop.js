/* Balloon pop: balloons float up from the bottom, each carrying a short item. Pop only the ones that fit the rule.
   Right: points (more for a run of rights), a pop and a burst of colour. Wrong: a few points and a life go.
   The game ends when the time runs out or the lives do. Touch, mouse and keyboard (Tab to a balloon, Enter). */
import { el, txt, shuffle, COLOURS, makeHud, makeClock, floatText, burst, say, reduced } from './common.js?v=de4f9a51';

const BALLOON = (c) => '<svg class="kg-bal-svg" viewBox="0 0 100 130" aria-hidden="true">' +
  '<path d="M50 4C24 4 8 25 8 49c0 27 22 48 39 53l-4 7h14l-4-7c17-5 39-26 39-53C92 25 76 4 50 4z" fill="' + c + '"/>' +
  '<path d="M50 4C24 4 8 25 8 49c0 27 22 48 39 53l-4 7h14l-4-7c17-5 39-26 39-53C92 25 76 4 50 4z" fill="url(#kg-shine)" opacity=".55"/>' +
  '<ellipse cx="32" cy="30" rx="9" ry="15" transform="rotate(-24 32 30)" fill="#fff" opacity=".45"/>' +
  '<path d="M50 109c-5 6 5 9 0 15" stroke="#5B6573" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';

export function run(root, g, h) {
  const c = g.content, set = g.settings, device = h.mode === 'device';
  const stage = el('div', 'kg-stage kg-sky');
  stage.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><radialGradient id="kg-shine" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs></svg>' +
    '<span class="kg-cloud c1"></span><span class="kg-cloud c2"></span><span class="kg-cloud c3"></span><span class="kg-sun"></span><span class="kg-hills"></span>';
  root.appendChild(stage);
  const hud = makeHud(root, { rule: c.rule });
  const lives0 = set.lives || 0;
  let score = 0, lives = lives0, right = 0, wrong = 0, okSeen = 0, combo = 0, ended = false, raf = 0, last = 0, nextAt = 0, colour = 0;
  let queue = [];
  const live = [];
  hud.score(0);
  if (lives0) hud.lives(lives, lives0);

  /* how fast: speed 1 is gentle, 5 is quick */
  const sp = set.speed || 3;
  const riseSec = (device ? 1.15 : 1) * (11.5 - 1.7 * sp);         // seconds to float from the bottom to the top
  const gapSec = Math.max(0.55, 2.3 - 0.33 * sp) * (device ? 1.2 : 1);
  const most = device ? 6 : 9;

  function nextItem() {
    if (!queue.length) {
      queue = shuffle(c.items);
      // never two "wrong" balloons in a row at the start of a round, so a right one comes soon
      const k = queue.findIndex((x) => x.ok);
      if (k > 1) { const t = queue[k]; queue.splice(k, 1); queue.splice(1, 0, t); }
    }
    return queue.shift();
  }
  function spawn() {
    const item = nextItem();
    const b = el('button', 'kg-balloon');
    b.type = 'button';
    const col = COLOURS[colour++ % COLOURS.length];
    b.innerHTML = BALLOON(col) + '<span class="kg-bal-t"></span>';
    txt(b.querySelector('.kg-bal-t'), item.text);
    b.setAttribute('aria-label', 'Balloon: ' + item.text);
    const W = stage.clientWidth || 600, bw = Math.min(W * (device ? 0.26 : 0.17), Math.max(70, Math.min(W, stage.clientHeight || 400) * (device ? 0.27 : 0.2)));
    const bal = { el: b, item, x: 0, y: -bw * 1.4, vy: 0, w: bw, phase: Math.random() * 6.28, sway: 6 + Math.random() * 10, done: false, colour: col };
    // a free lane: away from the balloons already near the bottom
    let x = 0, tries = 0;
    do { x = bw * 0.1 + Math.random() * Math.max(1, W - bw * 1.2); tries++; } while (tries < 8 && live.some((o) => !o.done && o.y < bw * 1.6 && Math.abs(o.x - x) < bw * 0.95));
    bal.x = x;
    const H = stage.clientHeight || 400;
    bal.vy = (H + bw * 2) / riseSec * (0.85 + Math.random() * 0.3);
    b.style.width = bw + 'px';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(bal); });
    b.addEventListener('click', (e) => { if (e.detail === 0) hit(bal); });
    stage.appendChild(b);
    if (item.ok) okSeen += 1;
    live.push(bal);
    place(bal, 0);
  }
  function place(bal, t) {
    const dx = Math.sin(bal.phase + t * 1.6) * bal.sway;
    bal.el.style.transform = 'translate3d(' + (bal.x + dx).toFixed(1) + 'px,' + (-bal.y).toFixed(1) + 'px,0)';
  }
  function hit(bal) {
    if (ended || bal.done) return;
    bal.done = true;
    const r = bal.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const cx = r.left - s.left + r.width / 2, cy = r.top - s.top + r.height * 0.38;
    bal.el.classList.add('popped');
    bal.el.disabled = true;
    setTimeout(() => bal.el.remove(), reduced() ? 0 : 260);
    if (bal.item.ok) {
      combo += 1; right += 1;
      const add = 10 + Math.min(10, (combo - 1) * 2);
      score += add;
      h.sfx.play('pop'); h.sfx.play('right');
      burst(stage, cx, cy, bal.colour);
      floatText(stage, cx, cy, '+' + add, true);
      say(root, 'Right! ' + score + ' points.');
    } else {
      combo = 0; wrong += 1;
      score = Math.max(0, score - 5);
      h.sfx.play('pop'); h.sfx.play('wrong');
      floatText(stage, cx, cy, 'Not that one', false);
      stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
      if (lives0) { lives -= 1; hud.lives(lives, lives0); }
      say(root, 'Not that one. ' + bal.item.text + ' does not fit.' + (lives0 ? ' ' + lives + (lives === 1 ? ' life' : ' lives') + ' left.' : ''));
    }
    hud.score(score);
    h.onScore(score, { right, wrong });
    if (lives0 && lives <= 0) finish(false);
  }
  function frame(now) {
    if (ended) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!clock.paused) {
      if (now >= nextAt && live.filter((b) => !b.done).length < most) { spawn(); nextAt = now + gapSec * 1000 * (0.8 + Math.random() * 0.4); }
      const H = stage.clientHeight || 400, t = now / 1000;
      for (let i = live.length - 1; i >= 0; i--) {
        const b = live[i];
        if (b.done) { if (!b.el.isConnected) live.splice(i, 1); continue; }
        b.y += b.vy * dt;
        place(b, t);
        if (b.y > H + b.w * 1.3) { b.done = true; b.el.remove(); live.splice(i, 1); if (b.item.ok) combo = 0; }
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function finish(timeUp) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    clock.stop();
    live.forEach((b) => { if (!b.done) { b.done = true; b.el.disabled = true; b.el.classList.add('away'); } });
    const hitRate = right / Math.max(1, okSeen), acc = right / Math.max(1, right + wrong);
    h.onEnd({ score, right, wrong, max: okSeen * 10, part: 0.6 * hitRate + 0.4 * acc, won: timeUp, why: timeUp ? 'time' : 'lives' });
  }
  const clock = makeClock(set.seconds || 60, (left) => hud.time(left, left <= 10), () => finish(true)).start();
  h.sfx.play('go');
  nextAt = performance.now() + 300;
  raf = requestAnimationFrame(frame);
  return {
    stop() { ended = true; cancelAnimationFrame(raf); clock.stop(); },
    pause() { clock.pause(); },
    resume() { clock.resume(); }
  };
}
