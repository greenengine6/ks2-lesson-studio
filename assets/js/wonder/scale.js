/* Size and speed, made real. "How big?" lines up the record-breaking animals and "How tall?" the wonders of the world,
   all drawn to scale in metres (lineup.js), smallest on the left, with a Year 4 pupil as the yardstick. The camera
   travels from the smallest to the biggest: each step glides to the next one and keeps the one before it in view, so
   the class can compare them, and "Everything" fits the whole line-up on any screen (the tiny ones shown again in a
   magnifying circle). Metre lines, and a measuring arrow on the one in focus, give the sizes; tap anything to go to it
   and hear what it is; drag to look along the line. The speed race lines up a diving falcon, a car, a cheetah, an
   ostrich, Usain Bolt, a fast Year 5 runner and a snail, and lets them all go for the same few seconds. */
import { TAU, rnd, clamp, layer, view, FONT } from './util.js?v=49509700';
import { drawCreature, creatureOf } from './fauna.js?v=49509700';
import { Fx } from './music.js?v=49509700';
import { reduceMotion } from '../core.js?v=49509700';
import { ART, wonderArt, drawWater, drawRoad } from './lineup.js?v=49509700';

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const lerp = (a, b, f) => a + (b - a) * f;
const pill = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
const hit = (a, b, m) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
/* does the line from (x1, y1) to (x2, y2) touch the box (grown by m)? */
const COMMON = /^(pupil|bus|hummingbird|ostrich|elephant|giraffe|python|croc|whale)$/;      // names that are not names of places
const segHit = (q, b, m) => {
  const L = b.x - m, R = b.x + b.w + m, T = b.y - m, B = b.y + b.h + m, dx = q[2] - q[0], dy = q[3] - q[1];
  let t0 = 0, t1 = 1;
  for (const [pp, qq] of [[-dx, q[0] - L], [dx, R - q[0]], [-dy, q[1] - T], [dy, B - q[1]]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
};
/* do two lines cross? */
const turn = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
const cross = (p, q) => {
  const a = turn(q[0], q[1], q[2], q[3], p[0], p[1]), b = turn(q[0], q[1], q[2], q[3], p[2], p[3]), c = turn(p[0], p[1], p[2], p[3], q[0], q[1]), d = turn(p[0], p[1], p[2], p[3], q[2], q[3]);
  return ((a > 0 && b < 0) || (a < 0 && b > 0)) && ((c > 0 && d < 0) || (c < 0 && d > 0));
};
const metresText = (m) => (m < 1 ? Math.round(m * 100) + ' cm' : (Math.round(m * 10) / 10).toString().replace(/\.0$/, '') + ' m');
const STATIC = new Set(['giza', 'wall', 'bigben', 'zeus', 'mausoleum', 'colossus', 'pharos', 'petra', 'christ', 'chichen', 'colosseum', 'taj']);

/* the far hills along the horizon (and acacia trees on the savannah), drawn once, twice as wide as the screen */
function farStrip(w, hgt, trees) {
  const c = layer(w * 2, hgt), g = c.getContext('2d'), W = w * 2;
  const R = ((s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(91);
  [[0.55, '#B7CCD3', 3], [0.78, '#9DB8AE', 5]].forEach(([top, col, n]) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hgt);
    for (let x = 0; x <= W; x += 8) { let y = 0; for (let i = 1; i <= n; i++) y += Math.sin(x / W * TAU * i + i * 1.7) / i; g.lineTo(x, hgt * top - y * hgt * 0.12); }
    g.lineTo(W, hgt); g.closePath(); g.fill();
  });
  if (trees) {
    g.fillStyle = '#7B9478';
    for (let i = 0; i < 14; i++) {
      const x = R() * W, s = hgt * (0.12 + R() * 0.1), y = hgt * 0.86 + R() * hgt * 0.05;
      g.fillRect(x - s * 0.04, y - s * 0.7, s * 0.08, s * 0.7);
      g.beginPath(); g.ellipse(x, y - s * 0.78, s * 0.75, s * 0.16, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(x - s * 0.25, y - s * 0.86, s * 0.4, s * 0.12, 0, 0, TAU); g.fill();
    }
  }
  return c;
}
function cloudSprite() {
  const c = layer(240, 90), g = c.getContext('2d');
  [[60, 58, 34], [100, 44, 42], [146, 52, 36], [182, 62, 26], [118, 66, 40]].forEach(([x, y, r]) => {
    const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  });
  return c;
}

/* ---------------- the line-up ---------------- */
/* items: { id, name, label, m (size in metres), how: 'tall' | 'long', art (a drawing in lineup.js, or a wonder's id), ref }
   o: { trees: true for the savannah's acacias, reveal: seconds for the opening journey } */
export function makeScale(items, o) {
  o = o || {};
  const S = {
    id: 'scale', w: 0, h: 0, list: [], stops: [], u: 0, tw: null, pan: 0, drag: null, down: null, sel: '', soundOn: true, time: 0,
    floor: 0, onStop: null, sprites: new Map(), far: null, cloud: null, clouds: [], views: null, viewKey: '', ripple: null, startAt: 0,
    get items() { return this.list; },
    get n() { return this.stops.length; },
    get z() { return this.n > 1 ? this.u / (this.n - 1) : 0; },              // 0 close up … 1 everything (for the tests)
    get at() { return Math.round(this.u); },
    get target() { return this.tw ? this.tw.to : this.startAt > 0 ? 0 : Math.round(this.u); },
    init(w, h) { this.w = w; this.h = h; this.place(); this.far = null; this.views = null; this.seedClouds(); },
    resize(w, h) { this.w = w; this.h = h; this.far = null; this.views = null; this.seedClouds(); },
    seedClouds() { const sm = view.small; this.clouds = Array.from({ length: sm ? 2 : 4 }, (_, i) => ({ x: rnd(-0.1, 1) * this.w, y: rnd(0.1, 0.3), s: sm ? rnd(0.4, 0.6) : rnd(0.55, 0.9), v: rnd(4, 9) })); },

    /* smallest first, left to right, a little space between; the hummingbird hovers at the pupil's flower */
    place() {
      const list = items.map((it) => {
        const a = ART[it.art] || wonderArt(it.art, it.m) || ART.pupil;
        return Object.assign({}, it, { a, x: 0, y: 0 });
      }).sort((p, q) => p.m - q.m);
      const pupil = list.find((it) => it.art === 'pupil'), bird = list.find((it) => it.art === 'hummingbird');
      if (pupil && bird) { bird.attach = pupil; pupil.hold = true; }
      let right = null, prev = null;
      list.forEach((it) => {
        if (it.attach) return;
        const a = it.a, water = a.water;
        it.ex0 = water ? Math.min(a.x0, water.x0) : a.x0;
        it.ex1 = it.hold ? a.xr + 0.06 : water ? Math.max(a.x1, water.x1) : a.x1;
        it.hM = water ? Math.max(a.h, water.top) : a.h;
        if (right == null) it.x = -it.ex0;
        else { const gap = 0.25 * Math.min(prev.hM, it.hM) + 0.4 + 0.02 * Math.max(prev.ex1 - prev.ex0, it.ex1 - it.ex0); it.x = right + gap - it.ex0; }
        right = it.x + it.ex1; prev = it;
      });
      if (bird) { bird.x = pupil.x + 0.42; bird.y = 0.948; bird.ex0 = -0.035; bird.ex1 = 0.035; bird.hM = 0.03; }
      this.list = list;
      this.span = [Math.min(...list.filter((it) => !it.attach).map((it) => it.x + it.ex0)), right];
      this.tallest = Math.max(...list.map((it) => it.hM));
      this.stops = list.map((it, i) => ({ id: it.id, it, prev: list[i - 1] || null })).concat([{ id: 'all' }]);
      this.views = null;
    },
    /* the part of the screen the line-up may use: under the top bar, above the controls */
    free() {
      const sm = view.small, side = sm ? 10 : 24;
      const floor = this.floor > 40 ? this.floor : this.h - (sm ? 200 : 230);
      const pad = sm ? 30 : 44;
      return { l: side, r: this.w - side, t: view.top + (sm ? 8 : 14), b: floor - pad, floor, pad, lab: sm ? 46 : 58, cx: this.w / 2 };
    },
    /* one camera view for each stop: k (pixels per metre), cx (the metre in the middle of the screen), gy (where the ground is) */
    frame(F, x0, x1, y0, y1, up) {
      const W = F.r - F.l, H = F.b - F.t - F.lab;
      const k = Math.min(W / Math.max(0.01, x1 - x0), H / Math.max(0.01, y1 - y0), 6000);
      const gy = up ? (F.t + F.lab + F.b) / 2 + (y0 + y1) / 2 * k : F.b;
      return { k, cx: (x0 + x1) / 2, gy };
    },
    viewsFor(F) {
      const key = [this.w, this.h, F.t, F.b].join('x');
      if (this.views && this.viewKey === key) return this.views;
      const ext = (it) => [it.x + it.ex0, it.x + it.ex1];
      this.views = this.stops.map((s) => {
        if (s.id === 'all') { const [a, b] = this.span, m = (b - a) * 0.015; return this.frame(F, a - m, b + m, 0, this.tallest); }
        const it = s.it;
        if (it.attach) return this.frame(F, it.x - 0.24, it.x + 0.12, it.y - 0.12, it.y + 0.1, true);
        const [a, b] = ext(it), p = s.prev && !s.prev.attach ? s.prev : null;
        const solo = this.frame(F, a - (b - a) * 0.04, b + (b - a) * 0.04, 0, it.hM);
        if (!p) return solo;
        const [pa] = ext(p), both = this.frame(F, Math.min(a, pa) - (b - pa) * 0.03, b + (b - pa) * 0.03, 0, Math.max(it.hM, p.hM));
        if (both.k >= solo.k * 0.35) return both;
        const k = solo.k * 0.35, half = (F.r - F.l) / 2 / k;       // too far apart: the new one in full on the right, the one before at the left edge
        return { k, cx: b + (b - a) * 0.05 - half, gy: F.b };
      });
      this.viewKey = key;
      return this.views;
    },
    cam(F) {
      const V = this.viewsFor(F), n = V.length, u = clamp(this.u, 0, n - 1), i = Math.min(n - 2, Math.floor(u)), f = n > 1 ? u - i : 0;
      const A = V[Math.max(0, i)], B = V[Math.min(n - 1, i + 1)] || A;
      const k = Math.exp(lerp(Math.log(A.k), Math.log(B.k), f)), gy = lerp(A.gy, B.gy, f);
      let cx = lerp(A.cx, B.cx, f) + this.pan;
      return { k, cx, gy, x: (m) => F.cx + (m - cx) * k, y: (m) => gy - m * k };
    },
    /* go to a stop: glide there (straight there for anyone who prefers less motion) */
    go(i, user) {
      if (user) this.startAt = 0;                       // a teacher's tap, button or slider wins over the opening journey
      i = clamp(Math.round(i), 0, this.n - 1);
      const d = Math.abs(i - this.u);
      if (reduceMotion() || d < 0.01) { this.u = i; this.tw = null; this.pan = 0; }
      else this.tw = { from: this.u, to: i, t: 0, d: Math.min(7, 0.55 + 0.42 * d), pan: this.pan };
      this.sel = this.stops[i].id === 'all' ? '' : this.stops[i].id;
      if (user && this.soundOn && d > 2.5) Fx.play('swell');
      if (this.onStop) this.onStop(i, !!user);
      return this.stops[i];
    },
    /* the opening: close up on the smallest, then the journey out to everything */
    start() {
      this.u = 0; this.tw = null; this.pan = 0; this.sel = this.stops[0] ? this.stops[0].id : '';
      if (reduceMotion()) { this.go(this.n - 1, false); return; }
      this.startAt = 1.4;
      if (this.onStop) this.onStop(0, false);
    },
    step(dt, t) {
      this.time = t;
      if (this.startAt > 0) { this.startAt -= dt; if (this.startAt <= 0) { this.go(this.n - 1, false); if (this.tw) this.tw.d = o.reveal || Math.min(7.5, 1.2 + this.n * 0.6); } }
      if (this.tw) {
        const tw = this.tw; tw.t += dt;
        const f = clamp(tw.t / tw.d, 0, 1), e = ease(f);
        this.u = tw.from + (tw.to - tw.from) * e; this.pan = tw.pan * (1 - e);
        if (f >= 1) this.tw = null;
      }
      if (this.ripple) { this.ripple.t += dt; if (this.ripple.t > 1) this.ripple = null; }
      this.clouds.forEach((c) => { c.x += c.v * dt; if (c.x > this.w + 40) c.x = -260; });
    },
    /* where something is on the screen */
    box(it, C) {
      if (it.attach) { const x = C.x(it.x), y = C.y(it.y), s = Math.max(2, 0.035 * C.k); return { x: x - s, y: y - s * 0.6, w: s * 2, h: s * 1.2 }; }
      const x0 = C.x(it.x + (it.a.water ? it.a.x0 : it.ex0)), x1 = C.x(it.x + (it.a.water ? it.a.x1 : it.ex1)), top = C.y(it.a.h);
      return { x: x0, y: top, w: x1 - x0, h: C.gy - top };
    },
    itemAt(px, py) {
      const F = this.free(), C = this.cam(F);
      let best = null, area = Infinity;
      this.list.forEach((it) => {
        const b = this.box(it, C), m = Math.max(0, (28 - Math.min(b.w, b.h)) / 2), r = { x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m };
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h && b.w * b.h < area) { best = it; area = b.w * b.h; }
      });
      return best;
    },
    /* a tap goes to what was tapped (on release, so a drag along the line-up is not a tap) */
    click(x, y) { this.down = { x, y, moved: false }; return null; },
    pointer(x, y, buttons) {
      if (!(buttons & 1) || !this.down) { this.drag = null; return; }
      if (!this.down.moved && Math.hypot(x - this.down.x, y - this.down.y) > 8) { this.down.moved = true; this.drag = { x }; this.tw = null; this.startAt = 0; }
      if (this.drag) {
        const F = this.free(), C = this.cam(F), want = this.pan + (this.drag.x - x) / C.k;
        const half = (F.r - F.l) / 2 / C.k, base = C.cx - this.pan, lo = this.span[0] - half * 0.6 - base, hi = this.span[1] + half * 0.6 - base;
        this.pan = clamp(want, Math.min(lo, hi), Math.max(lo, hi));
        this.drag.x = x;
      }
    },
    release() {
      const d = this.down; this.down = null; this.drag = null;
      if (!d || d.moved) return null;
      const it = this.itemAt(d.x, d.y);
      if (!it) return null;
      this.ripple = { x: d.x, y: d.y, t: 0 };
      if (this.soundOn) Fx.play('pop');
      const i = this.stops.findIndex((s) => s.id === it.id);
      this.go(i, true);
      return { size: it.id };
    },

    /* ---------------- drawing ---------------- */
    sprite(it, k) {
      const q = Math.pow(2, Math.round(Math.log2(k) * 4) / 4), key = it.id + '|' + q, dpr = view.dpr || 1;
      let s = this.sprites.get(key);
      if (s) return s;
      const a = it.a, x0 = a.x0 - (a.x1 - a.x0) * 0.08, x1 = a.x1 + (a.x1 - a.x0) * 0.08, top = a.h * 1.08, bot = (a.x1 - a.x0) * 0.04;
      const W = Math.ceil((x1 - x0) * q * dpr), H = Math.ceil((top + bot) * q * dpr);
      if (W > 2400 || H > 2400 || W < 2 || H < 2) return null;
      const c = layer(W, H), g = c.getContext('2d');
      g.translate(-x0 * q * dpr, top * q * dpr); g.scale(q * dpr, -q * dpr);
      try { a.draw(g, { k: q, t: 0 }); } catch (e) { /* drawn as far as it goes */ }
      s = { c, q, x0, top };
      this.sprites.set(key, s);
      if (this.sprites.size > 48) this.sprites.delete(this.sprites.keys().next().value);
      return s;
    },
    drawItem(ctx, it, C, t) {
      const ox = C.x(it.x), oy = it.attach ? C.y(it.y) : C.gy;
      if (STATIC.has(it.art)) {
        const s = this.sprite(it, C.k);
        if (s) { const f = C.k / s.q; ctx.drawImage(s.c, ox + s.x0 * C.k, oy - s.top * C.k, s.c.width / (view.dpr || 1) * f, s.c.height / (view.dpr || 1) * f); return; }
      }
      ctx.save(); ctx.translate(ox, oy); ctx.scale(C.k, -C.k);
      if (it.a.water) drawWater(ctx, {}, C.k, t);
      it.a.draw(ctx, { k: C.k, t, hold: it.hold });
      ctx.restore();
    },
    draw(ctx, w, h, t) {
      const F = this.free(), C = this.cam(F), sm = view.small;
      // the sky, the far hills and a few clouds
      const sky = ctx.createLinearGradient(0, 0, 0, Math.max(F.t + 20, Math.min(C.gy, h)));
      sky.addColorStop(0, '#3E7DC6'); sky.addColorStop(0.55, '#86BBE6'); sky.addColorStop(0.9, '#D3E8F3'); sky.addColorStop(1, '#ECF5F2');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      if (!this.cloud) this.cloud = cloudSprite();
      this.clouds.forEach((c) => { ctx.globalAlpha = 0.55; ctx.drawImage(this.cloud, c.x, c.y * h, 240 * c.s, 90 * c.s); });
      ctx.globalAlpha = 1;
      const fh = Math.round(Math.min(h * 0.2, 170));
      if (!this.far) this.far = farStrip(w, fh, !!o.trees);
      if (C.gy - fh < h) { const off = ((C.cx * 3) % w + w) % w; ctx.drawImage(this.far, -off, C.gy - fh + 2, w * 2, fh); }
      // the ground
      if (C.gy < h) {
        const gr = ctx.createLinearGradient(0, C.gy, 0, h); gr.addColorStop(0, '#B59C66'); gr.addColorStop(0.18, '#9A8152'); gr.addColorStop(1, '#5E4B30');
        ctx.fillStyle = gr; ctx.fillRect(0, C.gy, w, h - C.gy);
        ctx.fillStyle = 'rgba(255,240,200,.45)'; ctx.fillRect(0, C.gy, w, 1.5);
        const tuft = 0.5 * C.k;                                                  // grass, when it is big enough to see
        if (tuft > 5) {
          const st = Math.max(0.25, 18 / C.k), x0 = Math.floor((C.cx - w / 2 / C.k) / st) * st;
          ctx.strokeStyle = 'rgba(92,112,58,.7)'; ctx.lineWidth = Math.max(1, C.k * 0.012); ctx.beginPath();
          for (let x = x0, i = 0; x < C.cx + w / 2 / C.k && i < 400; x += st, i++) { const sx = C.x(x), hh = Math.min(16, C.k * 0.06) * (0.6 + ((x * 7.13) % 1 + 1) % 1 * 0.6); ctx.moveTo(sx, C.gy + 1); ctx.lineTo(sx - hh * 0.3, C.gy - hh); ctx.moveTo(sx, C.gy + 1); ctx.lineTo(sx + hh * 0.35, C.gy - hh * 0.8); }
          ctx.stroke();
        }
      }
      // the metre lines: a step that keeps them comfortably apart
      const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100], gap = sm ? 46 : 60;
      const seen = this.list.filter((it) => { const b = this.box(it, C); return b.x < w && b.x + b.w > 0; }), roof = Math.max(0.05, ...seen.map((it) => it.attach ? it.y + 0.05 : it.hM));
      let st = steps.find((s) => s * C.k >= gap) || 100;
      if (st > roof) st = steps.slice().reverse().find((s) => s <= roof && s * C.k >= 20) || st;
      const top = Math.max(roof * 1.3, st * 1.05), here = this.stops[Math.round(this.u)];
      if (here && here.id === 'all' && Math.abs(this.u - Math.round(this.u)) < 0.45) st = Infinity;      // everything: the labels give the sizes
      const marks = [];
      ctx.font = '700 ' + (sm ? 10.5 : 12) + 'px ' + FONT; ctx.textBaseline = 'middle';
      for (let m = Math.max(st, Math.ceil(((C.gy - h) / C.k) / st) * st), n = 0; isFinite(st) && n < 80 && m <= top + 1e-9; m += st, n++) {
        const y = C.y(m); if (y < F.t + 6) break; if (y > h) continue;
        ctx.strokeStyle = 'rgba(30,55,90,.16)'; ctx.setLineDash([5, 7]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
        const txt = st < 1 ? Math.round(m * 100) + ' cm' : metresText(Math.round(m * 1000) / 1000), tw = ctx.measureText(txt).width + 12;
        marks.push({ x: 4, y: y - 9, w: tw, h: 18, txt });
      }
      ctx.textBaseline = 'alphabetic';
      // the road under the bus
      this.list.forEach((it) => { if (it.art === 'bus' && C.gy < h) { ctx.save(); ctx.translate(C.x(it.x), C.gy); ctx.scale(C.k, -C.k); drawRoad(ctx, C.k); ctx.restore(); } });
      // a soft light behind the one in focus
      const atRest = Math.abs(this.u - Math.round(this.u)) < 0.06, stop = this.stops[Math.round(this.u)], focus = stop && stop.it;
      if (focus && atRest) {
        const b = this.box(focus, C), r = Math.max(b.w, b.h) * 0.75, cx = b.x + b.w / 2, cy = b.y + b.h * 0.55;
        if (r > 6) { const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); gl.addColorStop(0, 'rgba(255,248,220,.5)'); gl.addColorStop(1, 'rgba(255,248,220,0)'); ctx.fillStyle = gl; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
      }
      // the line-up
      const shown = [];
      this.list.forEach((it) => {
        if (it.attach) return;
        const b = this.box(it, C);
        if (b.x > w + 60 || b.x + b.w < -60 || b.h < 0.8) return;
        this.drawItem(ctx, it, C, t);
        shown.push({ it, b });
      });
      this.list.forEach((it) => { if (!it.attach) return; const b = this.box(it, C); if (b.w > 3 && b.x < w && b.x + b.w > 0) { this.drawItem(ctx, it, C, t); shown.push({ it, b }); } });
      ctx.font = '700 ' + (sm ? 10.5 : 12) + 'px ' + FONT; ctx.textBaseline = 'middle';
      marks.forEach((m) => { ctx.fillStyle = 'rgba(255,255,255,.86)'; pill(ctx, m.x, m.y, m.w, m.h, 9); ctx.fill(); ctx.fillStyle = '#23344E'; ctx.fillText(m.txt, m.x + 6, m.y + 9.5); });
      ctx.textBaseline = 'alphabetic';
      // the measuring arrow on the one in focus
      if (focus && atRest && stop.id !== 'all') this.measure(ctx, focus, C, F);
      // everything: the tiny ones again, in a magnifying circle
      const nearAll = this.u > this.n - 1.35;
      const lens = nearAll ? this.lens(ctx, C, F, t, clamp((this.u - (this.n - 1.35)) / 0.35, 0, 1)) : null;
      this.labels(ctx, shown, C, F, focus, lens, marks);
      if (this.ripple) { const k = this.ripple.t; ctx.strokeStyle = 'rgba(255,214,102,' + (0.9 * (1 - k)) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(this.ripple.x, this.ripple.y, 10 + k * 46, 0, TAU); ctx.stroke(); }
    },
    /* a double arrow beside it (or under it, for something long) with its size */
    measure(ctx, it, C, F) {
      const b = this.box(it, C), sm = view.small, txt = it.label.replace(/^about /, '').replace(/ (tall|long)$/, '');
      ctx.save(); ctx.strokeStyle = '#1E2A40'; ctx.fillStyle = '#1E2A40'; ctx.lineWidth = 2;
      const head = (x, y, a) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a - 0.45) * 9, y - Math.sin(a - 0.45) * 9); ctx.lineTo(x - Math.cos(a + 0.45) * 9, y - Math.sin(a + 0.45) * 9); ctx.closePath(); ctx.fill(); };
      ctx.font = '800 ' + (sm ? 12 : 14) + 'px ' + FONT; const tw = ctx.measureText(txt).width + 16, th = sm ? 22 : 26;
      if (it.how === 'long') {
        const y = it.attach ? b.y + b.h + 14 : C.gy + F.pad * 0.5, x0 = b.x, x1 = b.x + b.w;
        if (x1 - x0 < 24) { ctx.restore(); return; }
        ctx.beginPath(); ctx.moveTo(x0 + 2, y); ctx.lineTo(x1 - 2, y); ctx.stroke(); head(x0, y, Math.PI); head(x1, y, 0);
        const cx = clamp((x0 + x1) / 2, F.l + tw / 2, F.r - tw / 2);
        ctx.fillStyle = '#FFD666'; pill(ctx, cx - tw / 2, y - th / 2, tw, th, th / 2); ctx.fill(); ctx.fillStyle = '#1A1405'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, y + 0.5);
      } else {
        const x = b.x - F.l > 54 ? b.x - 14 : F.r - (b.x + b.w) > 40 ? b.x + b.w + 14 : b.x + 10, y0 = C.gy, y1 = b.y;
        if (y0 - y1 < 24) { ctx.restore(); return; }
        ctx.beginPath(); ctx.moveTo(x, y0 - 2); ctx.lineTo(x, y1 + 2); ctx.stroke(); head(x, y0, Math.PI / 2); head(x, y1, -Math.PI / 2);
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 6, y1); ctx.lineTo(x + 6, y1); ctx.stroke();
        const ty = clamp((y0 + y1) / 2, F.t + th, y0 - th), tx = clamp(x, F.l + tw / 2, F.r - tw / 2);
        ctx.fillStyle = '#FFD666'; pill(ctx, tx - tw / 2, ty - th / 2, tw, th, th / 2); ctx.fill(); ctx.fillStyle = '#1A1405'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, tx, ty + 0.5);
      }
      ctx.restore();
    },
    /* in the "everything" view: anything too small to see, again in a circle, magnified */
    lens(ctx, C, F, t, alpha) {
      const sm = view.small, min = sm ? 10 : 12, R = sm ? 50 : 76;
      const cand = this.list.filter((it) => { const b = this.box(it, C); return Math.max(b.w, b.h) < min; }).sort((p, q) => p.m - q.m), tiny = [];
      const zoomOf = (set) => { const a = Math.min(...set.map((it) => it.x + it.ex0)), b = Math.max(...set.map((it) => it.x + it.ex1)), lo = Math.min(...set.map((it) => (it.attach ? it.y - 0.025 : 0))), hi = Math.max(...set.map((it) => (it.attach ? it.y + 0.025 : it.hM))); return Math.min(R * 1.45 / Math.max(0.05, b - a), R * 1.2 / Math.max(0.03, hi - lo)); };
      cand.forEach((it) => { if (!tiny.length || zoomOf(tiny.concat([it])) / C.k >= 6) tiny.push(it); });
      if (!tiny.length || alpha <= 0) return null;
      const x0 = Math.min(...tiny.map((it) => it.x + it.ex0)), x1 = Math.max(...tiny.map((it) => it.x + it.ex1));
      const y0 = Math.min(...tiny.map((it) => (it.attach ? it.y - 0.025 : 0))), y1 = Math.max(...tiny.map((it) => (it.attach ? it.y + 0.025 : it.hM)));
      const kz = Math.min(R * 1.45 / Math.max(0.05, x1 - x0), R * 1.2 / Math.max(0.03, y1 - y0)), mag = kz / C.k;
      const ax = C.x((x0 + x1) / 2), ay = C.y((y0 + y1) / 2);
      const cx = clamp(ax + (sm ? 40 : 110), F.l + R + 20, F.r - R - 2), cy = sm ? F.t + R + 22 : Math.max(F.t + R + 16, C.gy - this.tallest * C.k - R - 230);   // (a phone: at the top, leaving the sky below it for the names)
      ctx.save(); ctx.globalAlpha = alpha;
      const dl = Math.hypot(cx - ax, cy - ay) || 1, seg = [ax, ay, cx - (cx - ax) * R / dl, cy - (cy - ay) * R / dl];
      ctx.strokeStyle = 'rgba(20,30,50,.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(seg[0], seg[1]); ctx.lineTo(seg[2], seg[3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeRect(C.x(x0) - 3, C.y(y1) - 3, (x1 - x0) * C.k + 6, (y1 - y0) * C.k + 6);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      const gy = cy + (y0 + y1) / 2 * kz + (y0 > 0.1 ? 0 : (y1 - y0) * kz * 0.12), Z = { k: kz, cx: (x0 + x1) / 2, gy, x: (m) => cx + (m - (x0 + x1) / 2) * kz, y: (m) => gy - m * kz };
      const sg = ctx.createLinearGradient(0, cy - R, 0, gy); sg.addColorStop(0, '#9CC9EC'); sg.addColorStop(1, '#E6F2F3'); ctx.fillStyle = sg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (gy < cy + R) { ctx.fillStyle = '#A88F5C'; ctx.fillRect(cx - R, gy, R * 2, R * 2); }
      if (y0 > 0.1) { const p = this.list.find((it) => it.hold); if (p) this.drawItem(ctx, p, Z, t); }      // the hand that holds the flower
      tiny.forEach((it) => this.drawItem(ctx, it, Z, t));
      ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(20,30,50,.5)'; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, TAU); ctx.stroke();
      const nice = mag >= 10 ? Math.round(mag / 10) * 10 : Math.max(2, Math.round(mag));
      const badge = '×' + nice;
      ctx.font = '800 ' + (sm ? 11 : 13) + 'px ' + FONT; const bw = ctx.measureText(badge).width + 12;
      ctx.fillStyle = '#1E2A40'; pill(ctx, cx + R * 0.62 - bw / 2, cy - R - 4, bw, 20, 10); ctx.fill(); ctx.fillStyle = '#FFD666'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(badge, cx + R * 0.62, cy - R + 6.5);
      // still too small to see in there (the hummingbird beside a pupil): a second, smaller circle magnifies it again
      let inner = null;
      const wee = tiny.filter((it) => { const b = this.box(it, Z); return Math.max(b.w, b.h) < (sm ? 12 : 16); });
      if (wee.length && wee.length < tiny.length) {
        const it = wee[0], R2 = Math.round(R * 0.56), b = this.box(it, Z), ix = b.x + b.w / 2, iy = b.y + b.h / 2;
        const u0 = it.attach ? it.x - 0.085 : it.x + it.ex0, u1 = it.attach ? it.x + 0.05 : it.x + it.ex1, v0 = it.attach ? it.y - 0.05 : 0, v1 = it.attach ? it.y + 0.04 : it.hM;
        const k2 = Math.min(R2 * 1.7 / (u1 - u0), R2 * 1.5 / (v1 - v0)), cx2 = Math.min(F.r - R2 - 2, cx + R + R2 + (sm ? 12 : 18)), cy2 = cy - R + R2 + 4;
        const Z2 = { k: k2, cx: (u0 + u1) / 2, gy: cy2 + (v0 + v1) / 2 * k2, x: (m) => cx2 + (m - (u0 + u1) / 2) * k2, y: (m) => cy2 + (v0 + v1) / 2 * k2 - m * k2 };
        const dl2 = Math.hypot(cx2 - ix, cy2 - iy) || 1, seg2 = [ix, iy, cx2 - (cx2 - ix) * R2 / dl2, cy2 - (cy2 - iy) * R2 / dl2];
        ctx.strokeStyle = 'rgba(20,30,50,.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(seg2[0], seg2[1]); ctx.lineTo(seg2[2], seg2[3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ix, iy, Math.max(4, b.w * 0.9), 0, TAU); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(cx2, cy2, R2, 0, TAU); ctx.clip();
        const sg2 = ctx.createLinearGradient(0, cy2 - R2, 0, cy2 + R2); sg2.addColorStop(0, '#A9D0EE'); sg2.addColorStop(1, '#D6EAF2'); ctx.fillStyle = sg2; ctx.fillRect(cx2 - R2, cy2 - R2, R2 * 2, R2 * 2);
        if (it.attach) this.drawItem(ctx, it.attach, Z2, t);
        this.drawItem(ctx, it, Z2, t);
        ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx2, cy2, R2, 0, TAU); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(20,30,50,.5)'; ctx.beginPath(); ctx.arc(cx2, cy2, R2 + 2, 0, TAU); ctx.stroke();
        const m2 = k2 / C.k, badge2 = '×' + (m2 >= 100 ? Math.round(m2 / 100) * 100 : m2 >= 10 ? Math.round(m2 / 10) * 10 : Math.round(m2));
        ctx.font = '800 ' + (sm ? 11 : 13) + 'px ' + FONT; const bw2 = ctx.measureText(badge2).width + 12;
        ctx.fillStyle = '#1E2A40'; pill(ctx, cx2 + R2 * 0.5 - bw2 / 2, cy2 - R2 - 6, bw2, 20, 10); ctx.fill(); ctx.fillStyle = '#FFD666'; ctx.fillText(badge2, cx2 + R2 * 0.5, cy2 - R2 + 4.5);
        inner = { x: cx2 - R2, y: cy2 - R2 - 8, w: R2 * 2, h: R2 * 2 + 10, items: [it], cx: cx2, cy: cy2, R: R2, seg: seg2 };
      }
      ctx.restore();
      return { x: cx - R, y: cy - R - 6, w: R * 2, h: R * 2 + 8, items: tiny, cx, cy, R, seg, inner };
    },
    /* the names in the everything view, with a line down to each one */
    paintLabels(ctx, L, tight, f1, fs, fs2, ph) {
      L.forEach((l) => {
        const r = l.spot; if (!r) return;
        const ly = r.y + l.h;
        if (l.ay - ly > 4) { ctx.strokeStyle = 'rgba(20,30,50,.5)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(l.lx, ly); ctx.lineTo(l.ax, l.ay - 2); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(l.ax, l.ay - 2, 2, 0, TAU); ctx.fill(); }
      });
      L.forEach((l) => {
        const r = l.spot; if (!r) return;
        ctx.fillStyle = 'rgba(14,20,36,.84)'; pill(ctx, r.x, r.y, l.w, l.h, l.h / 2.6); ctx.fill();
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        if (tight) {
          ctx.font = '800 ' + f1 + 'px ' + FONT; ctx.fillStyle = '#F4F6FB'; ctx.fillText(l.name, r.x + ph, r.y + l.h / 2 + f1 * 0.36);
          ctx.font = '600 ' + (f1 - 1) + 'px ' + FONT; ctx.fillStyle = '#FFD666'; ctx.fillText(' · ' + l.size, r.x + ph + l.nw, r.y + l.h / 2 + f1 * 0.36);
        } else {
          ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = '#F4F6FB'; ctx.fillText(l.name, r.x + ph, r.y + ph * 0.7 + fs * 0.92);
          ctx.font = '600 ' + fs2 + 'px ' + FONT; ctx.fillStyle = '#C3CCDC'; ctx.fillText(l.it.label, r.x + ph, r.y + ph * 0.7 + fs * 0.95 + fs2 + 2);
        }
      });
    },
    /* names and sizes, placed where they do not cover each other */
    labels(ctx, shown, C, F, focus, lens, marks) {
      const sm = view.small, fs = sm ? 12.5 : 15, fs2 = sm ? 10.5 : 12.5, ph = sm ? 6 : 8, gap = 10;
      const here = this.stops[Math.round(this.u)], allView = here && here.id === 'all' && Math.abs(this.u - Math.round(this.u)) < 0.3;
      const placed = (marks || []).slice(), bodies = shown.map((s) => ({ it: s.it, x: s.b.x - 3, y: s.b.y - 3, w: s.b.w + 6, h: s.b.h + 6 }));
      const prevId = here && here.prev && here.prev.id;
      const pillText = (txt, x, y, f2, fill, col) => { ctx.font = '700 ' + f2 + 'px ' + FONT; const tw = ctx.measureText(txt).width + 16; ctx.fillStyle = fill; pill(ctx, x, y, tw, f2 + 12, 9); ctx.fill(); ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 8, y + (f2 + 12) / 2 + 0.5); ctx.textBaseline = 'alphabetic'; return tw; };
      if (lens) {                                                                     // the names of the tiny ones, under their circles
        const f2 = sm ? 11 : 13, nm = (it, later) => { const n = sm ? it.short || it.name : it.name; return later ? (COMMON.test(it.art) ? n.charAt(0).toLowerCase() + n.slice(1) : n.replace(/^A /, 'a ')) : n; };
        const say = (list) => (list.length > 1 ? list.slice(0, -1).map((it, i) => nm(it, i > 0)).join(', ') + ' and ' + nm(list[list.length - 1], true) : nm(list[0], false));
        [[lens, lens.items.filter((it) => !(lens.inner && lens.inner.items.includes(it)))], [lens.inner, lens.inner ? lens.inner.items : []]].forEach(([c, list]) => {
          if (!c || !list.length) return;
          const txt = say(list); ctx.font = '700 ' + f2 + 'px ' + FONT;
          const tw = ctx.measureText(txt).width + 16, x = clamp(c === lens ? c.cx - tw / 2 : Math.max(c.cx - tw / 2, lens.x + lens.w + 6), F.l, F.r - tw), y = c.cy + c.R + 8;
          pillText(txt, x, y, f2, 'rgba(14,20,36,.84)', '#F4F6FB');
          placed.push({ x: c.x, y: c.y, w: c.w, h: c.h }, { x, y, w: tw, h: f2 + 12 });
        });
      }
      let todo = shown.filter((s) => !(lens && lens.items.includes(s.it)) && (s.b.w > 2 || s.b.h > 2) && (allView || s.it === focus || s.it.id === prevId));
      todo = todo.sort((a, b) => allView ? (b.b.h - a.b.h) || (a.b.x - b.b.x) : ((b.it === focus) - (a.it === focus)) || ((b.it.id === prevId) - (a.it.id === prevId)) || (b.it.hM - a.it.hM));
      const free = (r, own) => !placed.some((p) => hit(r, p, 4)) && !bodies.some((p) => p.it !== own && hit(r, p, 2));
      if (allView) {
        const tight = sm || todo.length > 8, f1 = tight ? (sm ? 11.5 : 13) : fs, leaders = [], guide = lens ? [lens.seg].concat(lens.inner ? [lens.inner.seg] : []) : [];
        const key = [this.w, this.h, C.k.toFixed(5), C.cx.toFixed(3), C.gy.toFixed(1), lens ? Math.round(lens.x) + ',' + Math.round(lens.y) : '-', todo.length].join('|');
        if (this.lab && this.lab.key === key) { this.paintLabels(ctx, this.lab.L, tight, f1, fs, fs2, ph); this.placed = this.lab.placed; return; }
        const L = todo.map((s) => {
          const size = s.it.label.replace(/^about /, '').replace(/ (tall|long)$/, ''), name = tight ? (sm && s.it.mini) || s.it.short || s.it.name : s.it.name;
          ctx.font = '800 ' + f1 + 'px ' + FONT; const nw = ctx.measureText(name).width; ctx.font = '600 ' + (tight ? f1 - 1 : fs2) + 'px ' + FONT; const sw = ctx.measureText(tight ? ' · ' + size : s.it.label).width;
          const w = Math.ceil(tight ? nw + sw : Math.max(nw, sw)) + ph * 2, h = tight ? Math.ceil(f1 + ph * 1.5) : Math.ceil(fs + fs2 + ph * 1.6);
          return { s, it: s.it, name, size, nw, w, h, ax: clamp(s.b.x + s.b.w / 2, F.l + 4, F.r - 4), ay: Math.max(s.b.y, F.t), spot: null, lx: 0 };
        }).sort((p, q) => p.ax - q.ax);
        const lead = (l, r, lx) => { const ly = r.y + l.h; return l.ay - ly > 4 ? [lx, ly, l.ax, l.ay - 2] : null; };
        const tidy = (l, r, lx, loose) => {                      // its line crosses no other name, line or magnifier (loose: the magnifier's line may pass behind it)
          const lines = loose ? leaders : leaders.concat(guide);
          if (lines.some((q) => segHit(q, r, 2))) return false;
          const q = lead(l, r, lx);
          return !q || (!placed.some((p) => segHit(q, p, 2)) && !lines.some((o) => cross(o, q)) && !bodies.some((b) => b.it !== l.it && segHit(q, b, -2)));
        };
        const put = (l, r, lx) => { l.spot = r; l.lx = lx; placed.push(r); const q = lead(l, r, lx); if (q) leaders.push(q); };
        if (sm) {
          /* a phone: a staircase. Left of the split each name starts at its line and the ones further left sit
             higher; right of it each name ends at its line and the ones further right sit higher. The lines are
             all upright, so they never cross. The split that leaves no name out, as low down as possible, wins
             (tried once the camera is still). */
          const fan = (split) => {
            const left = L.slice(0, split).reverse(), right = L.slice(split);
            let top = Infinity, miss = 0;
            [[left, 1], [right, -1]].forEach(([grp, side]) => {
              let ceil = Infinity;
              grp.forEach((l, i) => {
                const nb = grp[i + 1];                         // the next one out, whose line passes down beside this name
                let x = side > 0 ? l.ax - 9 : l.ax + 9 - l.w;
                if (nb) x = side > 0 ? Math.max(x, nb.ax + 3) : Math.min(x, nb.ax - 3 - l.w);
                x = clamp(x, F.l, F.r - l.w);
                const lx = clamp(l.ax, x + 6, x + l.w - 6);
                for (let loose = 0; loose < 2 && !l.spot; loose++) {
                  for (let y = Math.min(C.gy - 8 - l.h, l.ay - gap - l.h, ceil - l.h - 5); y >= F.t; y -= 3) {
                    const r = { x, y, w: l.w, h: l.h };
                    if (free(r, l.it) && tidy(l, r, lx, loose)) { put(l, r, lx); ceil = y; top = Math.min(top, y); break; }
                  }
                }
                if (!l.spot) miss++;
              });
            });
            return miss * 1e5 - (isFinite(top) ? top : 0);
          };
          const still = !this.tw && !this.drag, n0 = placed.length;
          let best = L.findIndex((l) => l.ax >= (F.l + F.r) / 2); if (best < 0) best = L.length;
          if (still && L.length > 2) {
            let score = Infinity;
            for (let k = 0; k <= L.length; k++) {
              const sc = fan(k); if (sc < score) { score = sc; best = k; }
              placed.length = n0; leaders.length = 0; L.forEach((l) => { l.spot = null; });
            }
          }
          fan(best);
        } else {
          /* a wide screen: rows, left to right, as low as they will go */
          const cur = [];
          L.forEach((l) => {
            const base = C.gy - 8 - l.h;
            for (let pass = 0; pass < 2 && !l.spot; pass++) {
              for (let row = 0; row < 16 && !l.spot; row++) {
                const y = Math.min(base, l.ay - gap - l.h) - row * (l.h + 5); if (y < F.t) break;
                let x = clamp(l.ax - l.w / 2, F.l, F.r - l.w); if (cur[row] != null && x < cur[row] + 6) x = cur[row] + 6;
                if (x + l.w > F.r || x - (l.ax - l.w / 2) > l.w * 0.9) continue;
                const r = { x, y, w: l.w, h: l.h }, lx = clamp(l.ax, x + 8, x + l.w - 8);
                if (free(r, l.it) && (pass || tidy(l, r, lx))) { put(l, r, lx); cur[row] = x + l.w; }
              }
            }
          });
        }
        L.forEach((l) => {                                     // anything left over: wherever it fits
          if (l.spot) return;
          for (let pass = 0; pass < 2 && !l.spot; pass++) {
            for (let row = 0; row < 24 && !l.spot; row++) {
              const y = Math.min(C.gy - 8 - l.h, l.ay - gap - l.h) - row * (l.h + 5); if (y < F.t) break;
              for (const dx of [0, -0.45, 0.45, -0.9, 0.9, -1.3, 1.3]) {
                const x = clamp(l.ax - l.w / 2 + dx * l.w, F.l, F.r - l.w), r = { x, y, w: l.w, h: l.h }, lx = clamp(l.ax, x + 8, x + l.w - 8);
                if (free(r, l.it) && (pass || tidy(l, r, lx, true))) { put(l, r, lx); break; }
              }
            }
          }
        });
        this.lab = { key, L, placed };
        this.paintLabels(ctx, L, tight, f1, fs, fs2, ph);
        this.placed = placed;
        return;
      }
      todo.forEach((s) => {
        const on = s.it === focus && !allView, name = s.it.name, sub = s.it.label;
        ctx.font = '800 ' + fs + 'px ' + FONT; const w1 = ctx.measureText(name).width; ctx.font = '600 ' + fs2 + 'px ' + FONT; const w2 = ctx.measureText(sub).width;
        const w = Math.ceil(Math.max(w1, w2)) + ph * 2, h = Math.ceil(fs + fs2 + ph * 1.6);
        const ax = clamp(s.b.x + s.b.w / 2, F.l + 4, F.r - 4), ay = Math.max(s.b.y, F.t);
        let spot = null;
        for (let row = 0; row < 9 && !spot; row++) {
          for (const dx of [0, -0.55, 0.55, -1.1, 1.1, -1.7, 1.7]) {
            const r = { x: clamp(ax - w / 2 + dx * w, F.l, F.r - w), y: ay - gap - h - row * (h + 6), w, h };
            if (r.y < F.t - 2) break;
            if (free(r, s.it)) { spot = r; break; }
          }
        }
        if (!spot && on) spot = { x: clamp(ax - w / 2, F.l, F.r - w), y: clamp(ay - gap - h, F.t, F.b - h), w, h };
        if (!spot) return;
        placed.push(spot);
        const lx = clamp(ax, spot.x + 10, spot.x + w - 10), ly = spot.y + h;
        if (ay - ly > 6) { ctx.strokeStyle = on ? '#C99A1E' : 'rgba(20,30,50,.55)'; ctx.lineWidth = on ? 2 : 1.2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(ax, ay - 2); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(ax, ay - 2, on ? 3 : 2.2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = on ? '#FFD666' : 'rgba(14,20,36,.84)'; pill(ctx, spot.x, spot.y, w, h, sm ? 9 : 11); ctx.fill();
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = on ? '#1A1405' : '#F4F6FB'; ctx.fillText(name, spot.x + ph, spot.y + ph * 0.7 + fs * 0.92);
        ctx.font = '600 ' + fs2 + 'px ' + FONT; ctx.fillStyle = on ? '#4A3A0A' : '#C3CCDC'; ctx.fillText(sub, spot.x + ph, spot.y + ph * 0.7 + fs * 0.95 + fs2 + 2);
      });
      this.placed = placed;
    }
  };
  return S;
}

/* ---------------- the speed race ---------------- */
/* racers: { name, e, kmh, say }. Everyone goes for the same few seconds; distance = speed × time. */
export function makeRace(racers) {
  const R = {
    id: 'race', w: 0, h: 0, t: 0, run: false, done: false, dust: [], soundOn: true, onDone: null,
    init(w, h) { this.w = w; this.h = h; this.bg = null; this.reset(); },
    resize(w, h) { this.w = w; this.h = h; this.bg = null; },
    reset() { this.t = 0; this.run = false; this.done = false; this.dust = []; },
    start() { this.reset(); this.run = true; this.at = performance.now(); if (this.soundOn) { Fx.play('hooves', 22); Fx.play('plane', 3.6); } },
    lanes() {
      const top = view.top + 70, bottom = this.h - (view.small ? 232 : 250), n = racers.length, gap = (bottom - top) / n;
      return { top, gap, x0: view.small ? 70 : 150, x1: this.w - (view.small ? 34 : 70) };
    },
    step(dt) {
      if (!this.run) return;
      this.t = (performance.now() - this.at) / 1000;                 // real seconds, in step with the sound
      const L = this.lanes(), D = 4;                               // the race lasts four seconds
      if (this.t >= D && !this.done) { this.done = true; this.run = false; this.t = D; if (this.soundOn) { Fx.play('cheer'); Fx.play('land'); } if (this.onDone) this.onDone(); }
      racers.forEach((r, i) => {
        const x = this.posX(r, L), y = L.top + L.gap * (i + 0.72);
        if (r.kmh > 15 && this.run && Math.random() < 0.6) this.dust.push({ x: x - 22, y: y - 2, vx: rnd(-60, -20), vy: rnd(-26, -6), l: 1 });
      });
      this.dust.forEach((d) => { d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt * 1.6; });
      this.dust = this.dust.filter((d) => d.l > 0);
    },
    posX(r, L) { const k = Math.min(1, this.t / 4); return L.x0 + (L.x1 - L.x0) * (r.kmh / 300) * k; },
    paintBg(w, h) {
      const c = layer(w, h), g = c.getContext('2d'), L = this.lanes();
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5DA9E9'); sky.addColorStop(0.35, '#A9D6F5'); sky.addColorStop(0.5, '#F3D9A4'); sky.addColorStop(1, '#C99A55');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#B58848'; g.beginPath(); g.moveTo(0, L.top); for (let x = 0; x <= w; x += 20) g.lineTo(x, L.top - 18 - 14 * Math.sin(x / w * 7)); g.lineTo(w, L.top); g.closePath(); g.fill();
      [[0.18, 1], [0.6, 0.8], [0.86, 1.1]].forEach(([u, s]) => {                    // acacia trees on the horizon
        const x = w * u, y = L.top - 10; g.fillStyle = '#4A3A22'; g.fillRect(x - 2, y - 30 * s, 4, 30 * s);
        g.fillStyle = '#5E7A35'; g.beginPath(); g.ellipse(x, y - 34 * s, 34 * s, 9 * s, 0, 0, TAU); g.fill();
      });
      racers.forEach((r, i) => {
        const y = L.top + L.gap * i;
        g.fillStyle = i % 2 ? 'rgba(120,80,40,.22)' : 'rgba(255,240,210,.16)'; g.fillRect(0, y, w, L.gap);
        g.strokeStyle = 'rgba(255,255,255,.45)'; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(0, y + L.gap); g.lineTo(w, y + L.gap); g.stroke(); g.setLineDash([]);
      });
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(L.x0 - 2, L.top, 4, L.gap * racers.length);
      for (let k = 0; k < racers.length * 4; k++) { g.fillStyle = k % 2 ? '#111' : '#fff'; g.fillRect(L.x1 - 6 + ((k / 1 | 0) % 2) * 6, L.top + k * L.gap / 4, 6, L.gap / 4); }
      return c;
    },
    draw(ctx, w, h, t) {
      if (!this.bg) this.bg = this.paintBg(w, h);
      ctx.drawImage(this.bg, 0, 0, w, h);
      const L = this.lanes(), fs = view.small ? 11.5 : 14, px = Math.min(L.gap * 0.78, view.small ? 34 : 54);
      ctx.fillStyle = 'rgba(210,180,130,.6)';
      this.dust.forEach((d) => { ctx.globalAlpha = Math.max(0, d.l) * 0.7; ctx.beginPath(); ctx.arc(d.x, d.y, 4 + (1 - d.l) * 6, 0, TAU); ctx.fill(); });
      ctx.globalAlpha = 1;
      const order = racers.map((r, i) => i).sort((a, b) => racers[b].kmh - racers[a].kmh);
      racers.forEach((r, i) => {
        const y = L.top + L.gap * (i + 0.55), x = this.posX(r, L), bob = this.run && r.kmh > 1 ? Math.abs(Math.sin(t * (8 + r.kmh / 20) + i)) * 5 : 0;
        if (this.run && r.kmh > 60) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - px * 0.6 - k * 14, y - 8 + k * 8); ctx.lineTo(x - px * 0.6 - k * 14 - 40, y - 8 + k * 8); ctx.stroke(); } }
        const ck = creatureOf(r);
        drawCreature(ctx, ck, x, y - bob, px * (ck === 'car' ? 0.75 : ck === 'snail' ? 0.8 : 1), { ph: t * (8 + r.kmh / 20) + i, t, rest: !this.run, run: this.run && r.kmh > 1 });
        ctx.font = '800 ' + fs + 'px ' + FONT; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(20,16,10,.85)';
        if (!view.small) ctx.fillText(r.name, 10, L.top + L.gap * i + fs + 4);
        if (this.done) {
          const place = order.indexOf(i), md = place < 3, mr = fs * 0.62, tag = r.say, tw = ctx.measureText(tag).width + 16 + (md ? mr * 2 + 6 : 0), tx = Math.min(x + px * 0.6, w - 12 - tw);
          ctx.fillStyle = 'rgba(8,12,26,.78)';
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(tx, y - fs, tw, fs * 1.9, 9); else ctx.rect(tx, y - fs, tw, fs * 1.9); ctx.fill();
          if (md) medal(ctx, tx + 8 + mr, y - fs * 0.05, mr, place);
          ctx.fillStyle = '#F2F5FC'; ctx.fillText(tag, tx + 8 + (md ? mr * 2 + 6 : 0), y + fs * 0.35);
        }
      });
      if (!this.run && !this.done) {
        ctx.textAlign = 'center'; ctx.font = '800 ' + (view.small ? 18 : 26) + 'px ' + FONT; ctx.fillStyle = 'rgba(20,16,10,.8)';
        ctx.fillText('On your marks…', w / 2, L.top - 30); ctx.textAlign = 'left';
      }
    },
    click() { if (!this.run) { this.start(); return { race: 'start' }; } return null; }
  };
  return R;
}

/* a gold, silver or bronze medal on its ribbon, drawn (no emoji) */
function medal(ctx, x, y, r, place) {
  const col = [['#F7D774', '#D9A520', '#8A6410'], ['#EEF1F5', '#B9C2CD', '#6E7884'], ['#F0B07A', '#C27434', '#7A4418']][place];
  ctx.save();
  ctx.fillStyle = '#2E5AA8'; ctx.beginPath(); ctx.moveTo(x - r * 0.75, y - r * 1.9); ctx.lineTo(x - r * 0.1, y - r * 1.9); ctx.lineTo(x + r * 0.15, y - r * 0.6); ctx.lineTo(x - r * 0.45, y - r * 0.6); ctx.fill();
  ctx.fillStyle = '#D63A3A'; ctx.beginPath(); ctx.moveTo(x + r * 0.75, y - r * 1.9); ctx.lineTo(x + r * 0.1, y - r * 1.9); ctx.lineTo(x - r * 0.15, y - r * 0.6); ctx.lineTo(x + r * 0.45, y - r * 0.6); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, col[0]); g.addColorStop(0.7, col[1]); g.addColorStop(1, col[2]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = col[0]; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = col[2]; ctx.font = '900 ' + Math.round(r * 1.1) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(place + 1), x, y + r * 0.06);
  ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
