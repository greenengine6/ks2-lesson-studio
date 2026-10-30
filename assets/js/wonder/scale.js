/* Size and speed, made real. "How tall?" stands the wonders of the world side by side at the right size, with Big
   Ben's tower, a double-decker bus and a Year 4 pupil for scale; "How big?" does the same for the record-breaking
   animals. Both open close up on the pupil, then the camera pulls back until the giants appear. Tap anything to
   hear what it is. The speed race lines up a diving falcon, a car, a cheetah, an ostrich, Usain Bolt, a fast Year 5
   runner and a snail, and lets them all go for the same few seconds. */
import { TAU, rnd, clamp, smooth, layer, view, FONT } from './util.js?v=cdc164df';
import { drawCreature, creatureOf, WIDTH } from './fauna.js?v=cdc164df';
import { Fx } from './music.js?v=cdc164df';

/* ---------------- silhouettes, drawn in metres (x across, y up from the ground) ---------------- */
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, -y) : g.moveTo(x, -y))); g.closePath(); g.fill(); };
const rect = (g, x, y, w, h) => g.fillRect(x, -y - h, w, h);
const disc = (g, x, y, r) => { g.beginPath(); g.arc(x, -y, r, 0, TAU); g.fill(); };
export const SHAPES = {
  giza: { w: 190, draw(g, c) { g.fillStyle = c; poly(g, [[-95, 0], [0, 139], [95, 0]]); g.fillStyle = 'rgba(255,255,255,.14)'; poly(g, [[-95, 0], [0, 139], [-12, 0]]); } },
  pharos: { w: 34, draw(g, c) { g.fillStyle = c; rect(g, -15, 0, 30, 56); rect(g, -10, 56, 20, 28); rect(g, -6, 84, 12, 10); rect(g, -16, 54, 32, 3); g.fillStyle = '#FFB13B'; disc(g, 0, 97, 3.5); } },
  bigben: { w: 16, draw(g, c) { g.fillStyle = c; rect(g, -6, 0, 12, 64); rect(g, -7.5, 56, 15, 14); poly(g, [[-7.5, 70], [0, 96], [7.5, 70]]); g.fillStyle = 'rgba(255,240,200,.9)'; disc(g, 0, 63, 3.6); } },
  taj: { w: 100, draw(g, c) {
    g.fillStyle = c; rect(g, -50, 0, 100, 6); rect(g, -28, 6, 56, 30);
    g.beginPath(); g.moveTo(-14, -36); g.bezierCurveTo(-19, -52, -9, -62, 0, -66); g.bezierCurveTo(9, -62, 19, -52, 14, -36); g.closePath(); g.fill(); rect(g, -0.6, 66, 1.2, 7);
    [-20, 20].forEach((x) => { g.beginPath(); g.moveTo(x - 5, -36); g.quadraticCurveTo(x, -48, x + 5, -36); g.fill(); });
    [-46, 46].forEach((x) => { rect(g, x - 1.8, 6, 3.6, 36); g.beginPath(); g.arc(x, -43, 2.4, Math.PI, 0); g.fill(); });
    g.fillStyle = 'rgba(0,0,0,.12)'; rect(g, -6, 6, 12, 20);
  } },
  colosseum: { w: 130, draw(g, c) {
    g.fillStyle = c; poly(g, [[-65, 0], [-65, 48], [20, 48], [26, 40], [36, 40], [40, 30], [52, 30], [56, 18], [65, 18], [65, 0]]);
    g.fillStyle = 'rgba(0,0,0,.28)';
    for (let r = 0; r < 3; r++) for (let x = -60; x < 60; x += 9) {          // three rows of arches, as far as each row's wall goes
      if (x + 5 > [65, 52, 20][r]) continue;
      const y = 4 + r * 12; g.beginPath(); g.moveTo(x, -y); g.lineTo(x, -(y + 7)); g.arc(x + 2.5, -(y + 7), 2.5, Math.PI, 0); g.lineTo(x + 5, -y); g.closePath(); g.fill();
    }
  } },
  mausoleum: { w: 40, draw(g, c) {
    g.fillStyle = c; rect(g, -19, 0, 38, 19); rect(g, -16, 19, 32, 2);
    for (let x = -15; x <= 15; x += 3.3) rect(g, x - 0.7, 21, 1.4, 11);
    rect(g, -16, 32, 32, 2); for (let k = 0; k < 8; k++) rect(g, -14 + k * 1.6, 34 + k * 1.1, 28 - k * 3.2, 1.1);
    rect(g, -3, 43, 6, 2);
  } },
  petra: { w: 28, draw(g, c) {
    g.fillStyle = c; rect(g, -13, 0, 26, 20); poly(g, [[-13, 20], [0, 25], [13, 20]]);
    rect(g, -12, 25, 6, 12); rect(g, 6, 25, 6, 12); rect(g, -3.5, 25, 7, 11); g.beginPath(); g.moveTo(-4, -36); g.quadraticCurveTo(0, -40, 4, -36); g.fill(); rect(g, -0.6, 38, 1.2, 2);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = -11; x <= 11; x += 4.4) rect(g, x - 0.6, 1, 1.2, 15); rect(g, -2, 0, 4, 9);
  } },
  christ: { w: 30, draw(g, c) {
    g.fillStyle = c; rect(g, -4.5, 0, 9, 8); poly(g, [[-4, 8], [-3, 30], [3, 30], [4, 8]]);
    poly(g, [[-14, 26.5], [-3, 28.5], [3, 28.5], [14, 26.5], [14, 25], [3, 26], [-3, 26], [-14, 25]]);
    disc(g, 0, 32.6, 1.9); rect(g, -0.8, 30, 1.6, 1.4);
  } },
  colossus: { w: 14, draw(g, c) {
    g.fillStyle = c; rect(g, -5, 0, 10, 6); poly(g, [[-3, 6], [-2, 22], [2, 22], [3, 6]]); poly(g, [[-2.6, 22], [-2.2, 27], [2.2, 27], [2.6, 22]]);
    disc(g, 0, 28.6, 1.6); poly(g, [[1.8, 25.5], [5, 30.5], [5.8, 30], [2.6, 24.6]]); g.fillStyle = '#FFB13B'; disc(g, 5.6, 31.3, 1.1);
    g.fillStyle = c; for (let k = -3; k <= 3; k++) { const a = Math.PI / 2 + k * 0.32; poly(g, [[Math.cos(a) * 1.4, 28.6 + Math.sin(a) * 1.4], [Math.cos(a) * 3.2, 28.6 + Math.sin(a) * 3.2], [Math.cos(a + 0.12) * 1.4, 28.6 + Math.sin(a + 0.12) * 1.4]]); }
  } },
  chichen: { w: 56, draw(g, c) {
    g.fillStyle = c; for (let k = 0; k < 9; k++) rect(g, -27 + k * 2.2, k * 2.6, 54 - k * 4.4, 2.6);
    rect(g, -6, 23.4, 12, 6.6); g.fillStyle = 'rgba(0,0,0,.22)'; poly(g, [[-4, 0], [-1.6, 23.4], [1.6, 23.4], [4, 0]]); rect(g, -1.5, 23.4, 3, 3.6);
  } },
  zeus: { w: 9, draw(g, c) {
    g.fillStyle = c; rect(g, -4.5, 0, 9, 2); rect(g, -3.6, 2, 7.2, 4.5); rect(g, -3, 6.5, 1.2, 4.5); rect(g, -2.2, 6.5, 4.4, 1.4);
    poly(g, [[-1.6, 6.5], [-1.4, 10], [1.4, 10], [1.6, 6.5]]); disc(g, 0, 10.8, 0.85); rect(g, 2.4, 6, 0.5, 6);
  } },
  wall: { w: 30, draw(g, c) {
    g.fillStyle = c; rect(g, -15, 0, 30, 6); for (let x = -15; x < 15; x += 2.2) rect(g, x, 6, 1.2, 1.2);
    rect(g, -4, 0, 8, 8); for (let x = -4; x < 4; x += 2) rect(g, x, 8, 1, 0.8);
    g.fillStyle = 'rgba(0,0,0,.22)'; rect(g, -1, 0, 2, 2.6);
  } },
  whale: { w: 30, h: 4.6, draw(g, c) {                                   // a blue whale from the side: about 30 m long, under 5 m deep
    g.fillStyle = c; g.beginPath(); g.moveTo(-15, -1.6);
    g.bezierCurveTo(-15, -4.2, -10, -4.6, -4, -4.4); g.bezierCurveTo(3, -4.1, 8, -3.2, 12, -2.2); g.lineTo(13.4, -2.0);
    g.lineTo(15, -3.6); g.lineTo(14.6, -1.6); g.lineTo(15, 0.2); g.lineTo(13.4, -1.4);
    g.bezierCurveTo(8, -0.6, 2, -0.1, -4, -0.2); g.bezierCurveTo(-10, -0.3, -15, -0.2, -15, -1.6); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(-14, -1.0); g.bezierCurveTo(-8, -0.4, 0, -0.5, 8, -1.2); g.bezierCurveTo(0, -0.9, -8, -0.8, -14, -1.4); g.fill();
    g.fillStyle = '#0B1630'; disc(g, -11.5, 2.6, 0.32); g.fillStyle = c; poly(g, [[-7, 1.6], [-4.6, 0.4], [-5.6, 1.7]]);
  } },
  croc: { w: 6, h: 0.75, draw(g, c) {                                     // a saltwater crocodile: long and low
    g.fillStyle = c; g.beginPath(); g.moveTo(-3, -0.32); g.lineTo(-2.2, -0.44); g.bezierCurveTo(-1.4, -0.62, 0.6, -0.66, 1.4, -0.5); g.lineTo(3, -0.12); g.lineTo(1.3, -0.18); g.bezierCurveTo(0.4, -0.16, -1.6, -0.14, -2.2, -0.2); g.closePath(); g.fill();
    for (let x = -1.6; x < 1.3; x += 0.32) poly(g, [[x, 0.58], [x + 0.08, 0.72], [x + 0.16, 0.58]]);
    [[-1.4, 0], [-0.9, 0], [0.4, 0], [0.9, 0]].forEach(([x]) => rect(g, x, 0, 0.14, 0.3));
    g.fillStyle = '#F6E7A8'; disc(g, -2.05, 0.46, 0.05);
  } },
  python: { w: 6, h: 0.5, draw(g, c) {                                    // a reticulated python stretched out along the ground
    g.strokeStyle = c; g.lineWidth = 0.26; g.lineCap = 'round'; g.beginPath();
    for (let k = 0; k <= 60; k++) { const x = -3 + k / 10, y = -0.2 - Math.sin(k / 60 * Math.PI * 3) * 0.12; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.fillStyle = c; g.beginPath(); g.ellipse(3.05, -0.22, 0.24, 0.15, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(20,24,10,.45)'; g.lineWidth = 0.05; for (let k = 2; k < 58; k += 4) { const x = -3 + k / 10, y = -0.2 - Math.sin(k / 60 * Math.PI * 3) * 0.12; g.beginPath(); g.arc(x, y, 0.07, 0, TAU); g.stroke(); }
  } },
  ostrich: { w: 1.5, h: 2.7, draw(g) {                                   // an ostrich: about 2.7 m to the top of its head
    g.fillStyle = '#C9A08A'; rect(g, -0.2, 0, 0.08, 1.25); rect(g, 0.1, 0, 0.08, 1.2);
    poly(g, [[-0.2, 0], [-0.02, 0], [-0.04, 0.05], [-0.2, 0.06]]); poly(g, [[0.1, 0], [0.3, 0], [0.28, 0.05], [0.1, 0.06]]);
    g.strokeStyle = '#C9A08A'; g.lineWidth = 0.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.42, -1.55); g.quadraticCurveTo(0.6, -2.1, 0.48, -2.52); g.stroke();
    disc(g, 0.5, 2.6, 0.1); g.fillStyle = '#E8B38A'; poly(g, [[0.57, 2.63], [0.76, 2.57], [0.57, 2.53]]);
    g.fillStyle = '#2B2420'; g.beginPath(); g.ellipse(0.02, -1.45, 0.62, 0.38, -0.12, 0, TAU); g.fill();
    g.fillStyle = '#F2EEE6'; g.beginPath(); g.ellipse(-0.52, -1.52, 0.22, 0.16, 0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.12, -1.32, 0.26, 0.09, -0.2, 0, TAU); g.fill();
    g.fillStyle = '#111'; disc(g, 0.53, 2.62, 0.025);
  } },
  bus: { w: 11.2, draw(g, c) {
    g.fillStyle = '#D7263D'; g.beginPath(); if (g.roundRect) g.roundRect(-5.6, -4.4, 11.2, 3.9, 0.5); else g.rect(-5.6, -4.4, 11.2, 3.9); g.fill();
    g.fillStyle = 'rgba(220,240,255,.85)'; for (let x = -5; x < 5; x += 1.6) { rect(g, x, 2.6, 1.2, 1.1); rect(g, x, 1.1, 1.2, 1.0); }
    g.fillStyle = '#1B1B1B'; disc(g, -3.6, 0.5, 0.55); disc(g, 3.6, 0.5, 0.55);
  } }
};

/* ---------------- the line-up ---------------- */
/* items: { id, name, label, m (size in metres), how: 'tall' | 'long', shape (SHAPES key) or e (emoji), ref, c (colour) } */
export function makeScale(items) {
  const S = {
    id: 'scale', items: [], w: 0, h: 0, z: 0, goal: 0, sel: '', hover: '', ripple: null, soundOn: true, pan: 0, drag: null,
    init(w, h) { this.w = w; this.h = h; this.place(); this.z = 0; this.goal = 0; this.sky = null; },
    resize(w, h) { this.w = w; this.h = h; this.place(); this.sky = null; },
    /* tallest first on the left, smallest last: they overlap a little, like a chart of skylines */
    place() {
      const list = items.map((it) => {
        const sh = it.shape && SHAPES[it.shape];
        const wM = sh ? sh.w : it.how === 'long' ? it.m : it.m * 0.75, hM = sh && sh.h ? sh.h : it.how === 'long' ? it.m * (it.aspect || 0.5) : it.m;
        return Object.assign({}, it, { wM, hM });
      }).sort((a, b) => b.hM * Math.max(1, b.wM / b.hM) - a.hM * Math.max(1, a.wM / a.hM));
      let x = 0;
      list.forEach((it, i) => { if (i) x += (list[i - 1].wM + it.wM) / 2 * 0.8 + Math.max(1, it.hM * 0.08); it.x = x; });
      this.items = list;
      this.span = [list[0].x - list[0].wM / 2, list[list.length - 1].x + list[list.length - 1].wM / 2];
      const tall = Math.max(...list.map((it) => it.hM));
      this.y0 = Math.round(this.h - (view.small ? 222 : 248));          // the ground, with room below it for the controls and the caption
      const room = this.y0 - (view.top + 64), wide = this.w - 80, fitH = room / (tall * 1.08), fitW = wide / (this.span[1] - this.span[0]);
      // a wide screen sees the whole line-up at once; a narrow one keeps the giants big and slides along it (drag to look)
      this.far = this.w < 700 ? { k: fitH, c: this.span[0] + (this.w / 2 - 24) / fitH } : { k: Math.min(fitH, fitW), c: (this.span[0] + this.span[1]) / 2 };
      const near = list.slice(-3), nl = near[0].x - near[0].wM / 2, nr = near[near.length - 1].x + near[near.length - 1].wM / 2, nh = Math.max(...near.map((it) => it.hM));
      this.near = { k: Math.min(room * 0.6 / nh, wide * 0.8 / Math.max(0.5, nr - nl)), c: (nl + nr) / 2 };
    },
    cam() {
      const z = smooth(clamp(this.z, 0, 1));
      const k = Math.exp(Math.log(this.near.k) + (Math.log(this.far.k) - Math.log(this.near.k)) * z);
      let c = this.near.c + (this.far.c - this.near.c) * Math.pow(z, 0.6) + this.pan;
      const half = this.w / 2 / k, lo = this.span[0] - 24 / k + half, hi = this.span[1] + 24 / k - half;
      c = lo <= hi ? clamp(c, lo, hi) : (this.span[0] + this.span[1]) / 2;
      return { k, c, x: (m) => this.w / 2 + (m - c) * k };
    },
    zoomTo(z, user) { this.goal = clamp(z, 0, 1); this.pan = 0; if (user && this.soundOn && Math.abs(this.goal - this.z) > 0.3) Fx.play('swell'); },
    step(dt, t) {
      this.time = t;
      const d = this.goal - this.z;
      if (Math.abs(d) > 0.0005) this.z += Math.sign(d) * Math.min(Math.abs(d), dt * 0.32 + Math.abs(d) * dt * 1.2);
      if (this.ripple) { this.ripple.t += dt; if (this.ripple.t > 1) this.ripple = null; }
    },
    itemAt(px, py) {
      const C = this.cam();
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i], cx = C.x(it.x), half = Math.max(8, it.wM * C.k / 2), top = this.y0 - Math.max(14, it.hM * C.k);
        if (px >= cx - half && px <= cx + half && py >= top - 10 && py <= this.y0 + 6) return it;
      }
      return null;
    },
    /* dragging slides along the line-up; just moving points at things */
    pointer(x, y, buttons) {
      if (buttons & 1) {
        if (this.drag) {
          const C = this.cam(), want = C.c + (this.drag.x - x) / C.k;     // the camera moves the other way to the finger
          this.pan += want - C.c;
          this.pan -= want - this.cam().c;                                   // stop at either end, never beyond it
          this.drag.x = x;
        } else this.drag = { x };
        return;
      }
      this.drag = null;
      const it = this.itemAt(x, y); this.hover = it ? it.id : '';
    },
    click(x, y) { const it = this.itemAt(x, y); if (!it) return null; this.sel = it.id; this.ripple = { x, y, t: 0 }; if (this.soundOn) Fx.play('pop'); return { size: it.id }; },
    paintSky(w, h) {
      const c = layer(w, h), g = c.getContext('2d'), y0 = this.y0;
      const sky = g.createLinearGradient(0, 0, 0, y0); sky.addColorStop(0, '#1B2A55'); sky.addColorStop(0.55, '#5C5A8E'); sky.addColorStop(0.85, '#E59A6B'); sky.addColorStop(1, '#F6C98B');
      g.fillStyle = sky; g.fillRect(0, 0, w, y0);
      const gr = g.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, '#5A4636'); gr.addColorStop(1, '#2A2019');
      g.fillStyle = gr; g.fillRect(0, y0, w, h - y0);
      return c;
    },
    draw(ctx, w, h, t) {
      if (!this.sky) this.sky = this.paintSky(w, h);
      ctx.drawImage(this.sky, 0, 0, w, h);
      const C = this.cam(), y0 = this.y0;
      // the measuring lines: a step that keeps them about 70 px apart
      const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100], st = steps.find((s) => s * C.k >= 70) || 100;
      ctx.font = '700 ' + (view.small ? 11 : 12.5) + 'px ' + FONT; ctx.textAlign = 'left';
      for (let m = st, n = 0; y0 - m * C.k > view.top + 40 && n < 40; m += st, n++) {
        const y = y0 - m * C.k;
        ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText((m < 1 ? Math.round(m * 100) + ' cm' : String(Math.round(m * 100) / 100) + ' m'), 10, y - 5);
      }
      // the line-up, biggest at the back
      const labels = [];
      this.items.forEach((it) => {
        const cx = C.x(it.x), half = it.wM * C.k / 2;
        if (cx + half < -40 || cx - half > w + 40) return;
        const on = it.id === this.sel || it.id === this.hover;
        ctx.save(); ctx.translate(cx, y0);
        if (it.shape) {
          ctx.scale(C.k, C.k);
          if (on) { ctx.shadowColor = 'rgba(255,230,160,.9)'; ctx.shadowBlur = 24; }
          SHAPES[it.shape].draw(ctx, it.c || '#E8C99A');
        } else {
          const ck = creatureOf(it), px = Math.max(4, it.how === 'long' ? it.m * C.k / (WIDTH[ck] || 1) : it.m * C.k);
          if (on) { ctx.shadowColor = 'rgba(255,230,160,.9)'; ctx.shadowBlur = 24; }
          drawCreature(ctx, ck, 0, -px * 0.5, px, { rest: true, t: this.time || 0 });
        }
        ctx.restore();
        if (it.ref) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([3, 4]); ctx.strokeRect(cx - half, y0 - it.hM * C.k, half * 2, it.hM * C.k); ctx.setLineDash([]); }
        labels.push({ it, x: cx, y: y0 - it.hM * C.k, on });
      });
      // names on top, where they fit (the chosen one always)
      const placed = [], fs = view.small ? 12 : 14;
      labels.sort((a, b) => (b.on - a.on) || (b.it.hM - a.it.hM)).forEach((L) => {
        if (L.x < 4 || L.x > w - 4) return;                                // its middle is off the screen: no label floating on its own
        ctx.font = '800 ' + fs + 'px ' + FONT;
        const txt = L.it.name, sub = L.it.label, tw = Math.max(ctx.measureText(txt).width, (ctx.font = '600 ' + (fs - 2) + 'px ' + FONT, ctx.measureText(sub).width)) + 18, th = fs * 2.5;
        const x = clamp(L.x - tw / 2, 6, w - tw - 6), y = Math.max(view.top + 46, L.y - th - 10);
        if (!L.on && placed.some((b) => x < b.x + b.w && x + tw > b.x && y < b.y + b.h && y + th > b.y)) return;
        placed.push({ x, y, w: tw, h: th });
        ctx.fillStyle = L.on ? 'rgba(255,214,102,.96)' : 'rgba(8,12,26,.72)';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, tw, th, 10); else ctx.rect(x, y, tw, th); ctx.fill();
        ctx.fillStyle = L.on ? '#1A1405' : '#F2F5FC'; ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillText(txt, x + 9, y + fs * 1.05);
        ctx.fillStyle = L.on ? '#4A3A0A' : '#C9D2E3'; ctx.font = '600 ' + (fs - 2) + 'px ' + FONT; ctx.fillText(sub, x + 9, y + fs * 2.1);
        if (L.y - 10 > y + th + 4) { ctx.strokeStyle = L.on ? 'rgba(255,214,102,.8)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L.x, y + th); ctx.lineTo(L.x, L.y - 4); ctx.stroke(); }
      });
      if (this.ripple) { const k = this.ripple.t; ctx.strokeStyle = 'rgba(255,230,160,' + (0.8 * (1 - k)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.ripple.x, this.ripple.y, 10 + k * 50, 0, TAU); ctx.stroke(); }
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
      const order = racers.map((r, i) => i).sort((a, b) => racers[b].kmh - racers[a].kmh), medal = ['🥇', '🥈', '🥉'];
      racers.forEach((r, i) => {
        const y = L.top + L.gap * (i + 0.55), x = this.posX(r, L), bob = this.run && r.kmh > 1 ? Math.abs(Math.sin(t * (8 + r.kmh / 20) + i)) * 5 : 0;
        if (this.run && r.kmh > 60) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - px * 0.6 - k * 14, y - 8 + k * 8); ctx.lineTo(x - px * 0.6 - k * 14 - 40, y - 8 + k * 8); ctx.stroke(); } }
        const ck = creatureOf(r);
        drawCreature(ctx, ck, x, y - bob, px * (ck === 'car' ? 0.75 : ck === 'snail' ? 0.8 : 1), { ph: t * (8 + r.kmh / 20) + i, t, rest: !this.run, run: this.run && r.kmh > 1 });
        ctx.font = '800 ' + fs + 'px ' + FONT; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(20,16,10,.85)';
        if (!view.small) ctx.fillText(r.name, 10, L.top + L.gap * i + fs + 4);
        if (this.done) {
          const place = order.indexOf(i), tag = (place < 3 ? medal[place] + ' ' : '') + r.say, tx = Math.min(x + px * 0.6, w - 12 - ctx.measureText(tag).width - 16);
          ctx.fillStyle = 'rgba(8,12,26,.78)'; const tw = ctx.measureText(tag).width + 16;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(tx, y - fs, tw, fs * 1.9, 9); else ctx.rect(tx, y - fs, tw, fs * 1.9); ctx.fill();
          ctx.fillStyle = '#F2F5FC'; ctx.fillText(tag, tx + 8, y + fs * 0.35);
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
