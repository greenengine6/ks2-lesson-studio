/* CardSwap: a perspective stack of cards that swaps with an elastic feel.
   Vanilla port of the GSAP CardSwap component (same slots, timings and easing curves).
   auto: cycles on a timer (landing page).  manual: call next() (escape-room locks; consume:true removes the front card). */

function elasticOut(amplitude, period) {            // same maths as GSAP's elastic.out(amplitude, period)
  const p1 = amplitude >= 1 ? amplitude : 1;
  let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1);
  const p3 = (p2 / (2 * Math.PI)) * (Math.asin(1 / p1) || 0);
  p2 = (2 * Math.PI) / p2;
  return (t) => (t >= 1 ? 1 : p1 * Math.pow(2, -10 * t) * Math.sin((t - p3) * p2) + 1);
}
const power1InOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ---- a very small timeline: tweens on per-card {x,y,z,o} state; later tweens win on shared properties ---- */
class Timeline {
  constructor(onDone) {
    this.items = []; this.t0 = 0; this.paused = false; this.pausedAt = 0; this.raf = 0; this.onDone = onDone; this.killed = false;
    this.step = this.step.bind(this);
  }
  to(card, props, at, dur, ease) { this.items.push({ kind: 'tw', card, props, at, dur, ease, from: null, done: false }); return this; }
  call(fn, at) { this.items.push({ kind: 'call', fn, at, done: false }); return this; }
  play() { this.items.sort((a, b) => a.at - b.at); this.t0 = performance.now(); this.raf = requestAnimationFrame(this.step); }
  step(now) {
    if (this.paused || this.killed) return;
    const t = Math.max(0, (now - this.t0) / 1000);
    let alive = false;
    for (const it of this.items) {
      if (it.done) continue;
      if (t < it.at) { alive = true; continue; }
      if (it.kind === 'call') { it.done = true; it.fn(); continue; }
      if (!it.from) { it.from = {}; for (const k in it.props) it.from[k] = it.card.s[k]; }
      const p = Math.min(1, (t - it.at) / it.dur);
      const e = it.ease(p);
      for (const k in it.props) it.card.s[k] = it.from[k] + (it.props[k] - it.from[k]) * e;
      it.card.apply();
      if (p >= 1) it.done = true; else alive = true;
    }
    if (alive) this.raf = requestAnimationFrame(this.step);
    else if (this.onDone) this.onDone();
  }
  pause() { if (this.paused || this.killed) return; this.paused = true; this.pausedAt = performance.now(); cancelAnimationFrame(this.raf); }
  resume() {
    if (!this.paused || this.killed) return;
    this.paused = false; this.t0 += performance.now() - this.pausedAt;
    this.raf = requestAnimationFrame(this.step);
  }
  kill() { this.killed = true; cancelAnimationFrame(this.raf); }
}

export class CardSwap {
  constructor(root, opts) {
    this.o = Object.assign({ cardDistance: 60, verticalDistance: 70, delay: 5000, pauseOnHover: false, skewAmount: 6, easing: 'elastic', auto: true, onCardClick: null }, opts || {});
    this.root = root;
    this.root.classList.add('cs-root');
    this.cards = Array.from(root.querySelectorAll(':scope > .cs-card')).map((elm, i) => {
      const c = { el: elm, i, s: { x: 0, y: 0, z: 0, o: 1 }, apply() {
        elm.style.transform = 'translate(-50%,-50%) translate3d(' + this.s.x.toFixed(2) + 'px,' + this.s.y.toFixed(2) + 'px,' + this.s.z.toFixed(2) + 'px) skewY(' + this.skew + 'deg)';
        elm.style.opacity = String(this.s.o);
      }, skew: this.o.skewAmount };
      elm.addEventListener('click', () => { if (this.o.onCardClick) this.o.onCardClick(i); });
      return c;
    });
    this.order = this.cards.map((c, i) => i);
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = this.o.easing === 'elastic' && !this.reduced;
    this.cfg = el
      ? { ease: elasticOut(0.6, 0.9), durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 }
      : { ease: power1InOut, durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 };
    this.layout();
    if (this.o.auto && !this.reduced) this.start();
    if (this.o.pauseOnHover) {
      root.addEventListener('mouseenter', () => { this.hover = true; if (this.tl) this.tl.pause(); this.stopTimer(); });
      root.addEventListener('mouseleave', () => { this.hover = false; if (this.tl) this.tl.resume(); if (this.o.auto && !this.reduced) this.start(); });
    }
  }
  slot(i) {
    const n = this.order.length, dx = this.o.cardDistance, dy = this.o.verticalDistance;
    return { x: i * dx, y: -i * dy, z: -i * dx * 1.5, zIndex: n - i };
  }
  layout() {
    this.order.forEach((idx, i) => {
      const c = this.cards[idx], sl = this.slot(i);
      Object.assign(c.s, { x: sl.x, y: sl.y, z: sl.z, o: 1 });
      c.el.style.zIndex = String(sl.zIndex);
      c.el.classList.toggle('cs-front', i === 0);
      c.el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      c.el.inert = i !== 0;
      c.apply();
    });
    this.cards.forEach((c) => { if (!this.order.includes(c.i)) { c.el.style.display = 'none'; } });
  }
  front() { return this.cards[this.order[0]]; }
  start() { this.stopTimer(); this.timer = setInterval(() => { if (!this.hover && !document.hidden) this.next(); }, this.o.delay); }
  stopTimer() { clearInterval(this.timer); this.timer = 0; }
  next(opts) {
    const consume = !!(opts && opts.consume);
    if (this.busy) return Promise.resolve();
    if (this.order.length < 2 && !consume) return Promise.resolve();
    this.busy = true;
    const cfg = this.cfg;
    const [frontIdx, ...rest] = this.order;
    const front = this.cards[frontIdx];
    return new Promise((resolve) => {
      const tl = new Timeline(() => {
        this.busy = false; this.tl = null;
        this.order = consume ? rest : rest.concat(frontIdx);
        if (consume) { front.el.style.display = 'none'; front.el.inert = true; }
        this.order.forEach((idx, i) => { const c = this.cards[idx]; c.el.classList.toggle('cs-front', i === 0); c.el.inert = i !== 0; c.el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); });
        resolve();
      });
      this.tl = tl;
      front.el.classList.remove('cs-front');
      front.el.inert = true;
      tl.to(front, { y: front.s.y + 500 }, 0, cfg.durDrop, cfg.ease);
      const promote = Math.max(0, cfg.durDrop - cfg.durDrop * cfg.promoteOverlap);
      const n = consume ? rest.length : this.order.length;
      rest.forEach((idx, i) => {
        const c = this.cards[idx];
        const dx = this.o.cardDistance, dy = this.o.verticalDistance;
        const sl = { x: i * dx, y: -i * dy, z: -i * dx * 1.5, zIndex: n - i };
        tl.call(() => { c.el.style.zIndex = String(sl.zIndex); if (i === 0) { c.el.classList.add('cs-front'); c.el.inert = false; } }, promote);
        tl.to(c, { x: sl.x, y: sl.y, z: sl.z }, promote + i * 0.15, cfg.durMove, cfg.ease);
      });
      const ret = promote + cfg.durMove * cfg.returnDelay;
      if (consume) {
        tl.to(front, { o: 0 }, Math.max(0, cfg.durDrop * 0.12), 0.55, power1InOut);
      } else {
        const back = { x: rest.length * this.o.cardDistance, y: -rest.length * this.o.verticalDistance, z: -rest.length * this.o.cardDistance * 1.5 };
        tl.call(() => { front.el.style.zIndex = '0'; }, ret);
        tl.to(front, { x: back.x, y: back.y, z: back.z }, ret, cfg.durReturn, cfg.ease);
      }
      tl.play();
    });
  }
  destroy() { this.stopTimer(); if (this.tl) this.tl.kill(); }
}
