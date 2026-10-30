/* The photo stage: one real photograph at a time filling the whole screen, drifting slowly (the "Ken Burns" move a
   documentary uses), with a light touch of the place's weather on top: desert dust, mountain mist, rain, sparkles,
   sea bubbles, falling leaves, bats at dusk, sunbeams or speed lines. The pictures come from Wikipedia; until one
   arrives, the item's colours and emoji glow in its place, so the screen is never empty.
   Also switcher(): one scene slot that can hold different scenes (a window's tabs). */
import { leadPicture, picURL } from '../pics.js?v=49509700';
import { TAU, rnd, clamp, smooth, layer, view } from './util.js?v=49509700';
import { drawCreature, creatureOf } from './fauna.js?v=49509700';

const photos = new Map();                  // wiki title → { p, img, ok }
/* Load one item's photo (once). Resolves with { p, img } or null. */
export function photoFor(wiki) {
  if (!wiki) return Promise.resolve(null);
  let e = photos.get(wiki);
  if (e) return e.pr;
  e = { p: null, img: null };
  e.pr = leadPicture(wiki).then((p) => {
    if (!p) return null;
    e.p = p;
    return new Promise((res) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { e.img = im; res(e); };
      im.onerror = () => res(null);
      im.src = picURL(p, view.small ? 1280 : 1920);
    });
  }).catch(() => null);
  photos.set(wiki, e);
  return e.pr;
}

/* ---------------- the weather on top ---------------- */
const FX = {
  dust: { n: 70, make: (w, h) => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(0.6, 2.2), vx: rnd(8, 26), vy: rnd(-4, 4), a: rnd(0.2, 0.6), p: rnd(0, TAU) }),
    step(q, dt, w, h, t) { q.x += q.vx * dt; q.y += (q.vy + Math.sin(t + q.p) * 6) * dt; if (q.x > w + 4) { q.x = -4; q.y = rnd(0, h); } },
    draw(g, q) { g.fillStyle = 'rgba(255,226,170,' + q.a + ')'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill(); } },
  mist: { n: 9, add: true, make: (w, h) => ({ x: rnd(-0.2, 1.1) * w, y: rnd(0.35, 0.95) * h, r: rnd(0.22, 0.45) * Math.max(w, h), vx: rnd(6, 16), a: rnd(0.05, 0.11) }),
    step(q, dt, w) { q.x += q.vx * dt; if (q.x - q.r > w) q.x = -q.r; },
    draw(g, q) { const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r); gr.addColorStop(0, 'rgba(235,242,250,' + q.a + ')'); gr.addColorStop(1, 'rgba(235,242,250,0)'); g.fillStyle = gr; g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); } },
  rain: { n: 160, make: (w, h) => ({ x: rnd(0, w), y: rnd(0, h), l: rnd(10, 22), v: rnd(700, 1000) }),
    step(q, dt, w, h) { q.y += q.v * dt; q.x -= q.v * 0.18 * dt; if (q.y > h) { q.y = -20; q.x = rnd(0, w * 1.2); } },
    draw(g, q) { g.strokeStyle = 'rgba(210,225,245,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + q.l * 0.18, q.y - q.l); g.stroke(); } },
  sparkle: { n: 46, add: true, make: (w, h) => ({ x: rnd(0, w), y: rnd(0.25, 0.95) * h, r: rnd(1.2, 2.8), p: rnd(0, TAU), s: rnd(0.6, 1.6), vx: rnd(-6, 6), vy: rnd(-6, 3) }),
    step(q, dt, w, h) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < 0 || q.x > w || q.y < h * 0.2 || q.y > h) { q.x = rnd(0, w); q.y = rnd(0.3, 0.95) * h; } },
    draw(g, q, t) { const a = Math.max(0, Math.sin(t * q.s + q.p)); if (a < 0.05) return; const R = q.r * 5; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, R); gr.addColorStop(0, 'rgba(220,255,140,' + (0.85 * a) + ')'); gr.addColorStop(1, 'rgba(160,255,90,0)'); g.fillStyle = gr; g.fillRect(q.x - R, q.y - R, R * 2, R * 2); } },
  bubbles: { n: 40, make: (w, h) => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(2, 7), v: rnd(20, 55), p: rnd(0, TAU) }),
    step(q, dt, w, h, t) { q.y -= q.v * dt; q.x += Math.sin(t * 2 + q.p) * 12 * dt; if (q.y < -10) { q.y = h + 10; q.x = rnd(0, w); } },
    draw(g, q) { g.strokeStyle = 'rgba(220,245,255,.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(q.x - q.r * 0.35, q.y - q.r * 0.35, q.r * 0.25, 0, TAU); g.fill(); } },
  leaves: { n: 22, make: (w, h) => ({ x: rnd(0, w), y: rnd(-h, h), s: rnd(5, 10), v: rnd(30, 60), r: rnd(0, TAU), vr: rnd(-2, 2), p: rnd(0, TAU), c: ['#5E8C31', '#7FA843', '#C08A2B', '#9C6B2E'][Math.floor(rnd(0, 4))] }),
    step(q, dt, w, h, t) { q.y += q.v * dt; q.x += Math.sin(t * 1.3 + q.p) * 30 * dt; q.r += q.vr * dt; if (q.y > h + 20) { q.y = -20; q.x = rnd(0, w); } },
    draw(g, q) { g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.fillStyle = q.c; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(0, 0, q.s, q.s * 0.45, 0, 0, TAU); g.fill(); g.restore(); } },
  embers: { n: 50, add: true, make: (w, h) => ({ x: rnd(0.3, 0.7) * w, y: rnd(0.4, 1) * h, r: rnd(1, 2.6), v: rnd(30, 80), p: rnd(0, TAU), life: rnd(0, 1) }),
    step(q, dt, w, h, t) { q.y -= q.v * dt; q.x += Math.sin(t * 2 + q.p) * 18 * dt; q.life += dt * 0.35; if (q.life > 1) { q.life = 0; q.y = rnd(0.6, 1) * h; q.x = rnd(0.3, 0.7) * w; } },
    draw(g, q) { const a = Math.sin(q.life * Math.PI); g.fillStyle = 'rgba(255,170,70,' + (0.8 * a) + ')'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill(); } },
  bats: { n: 14, make: (w, h) => ({ x: rnd(0, w), y: rnd(0.12, 0.55) * h, v: rnd(70, 140), s: rnd(14, 26), p: rnd(0, TAU), dir: Math.random() < 0.5 ? -1 : 1 }),
    step(q, dt, w, h, t) { q.x += q.v * q.dir * dt; q.y += Math.sin(t * 3 + q.p) * 22 * dt; if (q.x < -40) q.x = w + 40; if (q.x > w + 40) q.x = -40; },
    draw(g, q, t) { drawCreature(g, 'bat', q.x, q.y, q.s, { flip: q.dir < 0, ph: q.p, t, alpha: 0.9 }); } },
  speed: { n: 26, add: true, make: (w, h) => ({ x: rnd(0, w), y: rnd(0.1, 0.9) * h, l: rnd(80, 220), v: rnd(900, 1500), a: rnd(0.08, 0.2) }),
    step(q, dt, w, h) { q.x -= q.v * dt; if (q.x + q.l < 0) { q.x = w + rnd(0, 200); q.y = rnd(0.1, 0.9) * h; } },
    draw(g, q) { const gr = g.createLinearGradient(q.x, 0, q.x + q.l, 0); gr.addColorStop(0, 'rgba(255,255,255,' + q.a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr; g.lineWidth = 1.5; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + q.l, q.y); g.stroke(); } },
  rays: { n: 1, add: true, make: () => ({}), step() {},
    draw(g, q, t, w, h) {
      g.save(); g.translate(w * 0.12, -h * 0.08);
      for (let k = 0; k < 5; k++) {
        const a = 0.45 + k * 0.17 + Math.sin(t * 0.15 + k) * 0.03, L = Math.hypot(w, h) * 1.2, sp = 0.05 + (k % 2) * 0.025;
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); gr.addColorStop(0, 'rgba(255,236,190,.16)'); gr.addColorStop(1, 'rgba(255,236,190,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - sp) * L, Math.sin(a - sp) * L); g.lineTo(Math.cos(a + sp) * L, Math.sin(a + sp) * L); g.closePath(); g.fill();
      }
      g.restore();
    } }
};

/* ---------------- the stage ---------------- */
/* item: { key, wiki, e (emoji), a, b (colours), fx: ['dust', 'rays'] } */
export function makeStage() {
  const S = {
    id: 'stage', w: 0, h: 0, cur: null, prev: null, parts: [], shade: null, burst: [],
    init(w, h) { this.w = w; this.h = h; this.shade = null; this.seedFx(); },
    resize(w, h) { this.w = w; this.h = h; this.shade = null; this.seedFx(); },
    show(item) {
      if (this.cur && this.cur.item.key === item.key) return;
      this.prev = this.cur;
      const slot = { item, e: null, at: this.time || 0, fade: 0, fx: Math.random() < 0.5 ? 1 : -1, fy: Math.random() < 0.5 ? 1 : -1 };
      this.cur = slot;
      photoFor(item.wiki).then((e) => { slot.e = e; if (e && this.onPhoto) this.onPhoto(item, e.p); });
      this.seedFx();
    },
    seedFx() {
      this.parts = [];
      const it = this.cur && this.cur.item;
      if (!it || !this.w) return;
      (it.fx || []).forEach((k) => {
        const f = FX[k]; if (!f) return;
        const n = Math.round(f.n * (view.small ? 0.6 : 1));
        for (let i = 0; i < n; i++) this.parts.push({ k, q: f.make(this.w, this.h) });
      });
    },
    /* a ring of light where the screen was tapped */
    tap(x, y) { this.burst.push({ x, y, t: 0 }); },
    step(dt, t) {
      this.time = t;
      if (this.cur) this.cur.fade = Math.min(1, this.cur.fade + dt / 1.1);
      if (this.cur && this.cur.fade >= 1) this.prev = null;
      this.parts.forEach((p) => FX[p.k].step(p.q, dt, this.w, this.h, t));
      this.burst.forEach((b) => { b.t += dt; });
      this.burst = this.burst.filter((b) => b.t < 1.2);
    },
    drawSlot(ctx, s, alpha, w, h, t) {
      if (!s) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const im = s.e && s.e.img;
      if (im && im.naturalWidth) {
        const age = t - s.at, u = 0.5 - 0.5 * Math.cos(age * TAU / 46);          // a slow drift there and back
        const zoom = 1.06 + 0.12 * u, base = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zoom;
        const dw = im.naturalWidth * base, dh = im.naturalHeight * base;
        const fx = 0.5 + s.fx * (u - 0.5) * 0.12, fy = 0.46 + s.fy * (u - 0.5) * 0.08;
        const x = clamp(w / 2 - dw * fx, w - dw, 0), y = clamp(h / 2 - dh * fy, h - dh, 0);
        ctx.drawImage(im, x, y, dw, dh);
      } else {
        const it = s.item, g = ctx.createRadialGradient(w * 0.62, h * 0.42, 0, w * 0.62, h * 0.42, Math.max(w, h) * 0.75);
        g.addColorStop(0, it.b || '#334'); g.addColorStop(1, it.a || '#112');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const px = Math.min(w, h) * 0.34 * (1 + 0.03 * Math.sin(t * 1.4)), ck = creatureOf({ name: it.name || '', e: it.e });
        ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = 50;
        drawCreature(ctx, ck, w * 0.62, h * 0.44, px * 0.9, { rest: true, t, ph: t * 0.5 });   // (with no drawing of its own, the coloured light alone waits for the photo)
        ctx.restore();
      }
      ctx.restore();
    },
    draw(ctx, w, h, t) {
      ctx.fillStyle = '#05070F'; ctx.fillRect(0, 0, w, h);
      if (this.prev) this.drawSlot(ctx, this.prev, 1, w, h, t);
      if (this.cur) this.drawSlot(ctx, this.cur, smooth(this.cur.fade), w, h, t);
      // the weather
      if (this.parts.length) {
        ctx.save();
        this.parts.forEach((p) => { const f = FX[p.k]; ctx.globalCompositeOperation = f.add ? 'lighter' : 'source-over'; f.draw(ctx, p.q, t, w, h); });
        ctx.restore();
      }
      // shade at the top (the bar) and the bottom (the words), so text always reads
      if (!this.shade) {
        this.shade = layer(w, h); const g = this.shade.getContext('2d');
        const top = g.createLinearGradient(0, 0, 0, h * 0.3); top.addColorStop(0, 'rgba(3,5,12,.62)'); top.addColorStop(1, 'rgba(3,5,12,0)');
        g.fillStyle = top; g.fillRect(0, 0, w, h * 0.3);
        const bot = g.createLinearGradient(0, h * 0.42, 0, h); bot.addColorStop(0, 'rgba(3,5,12,0)'); bot.addColorStop(0.55, 'rgba(3,5,12,.5)'); bot.addColorStop(1, 'rgba(3,5,12,.88)');
        g.fillStyle = bot; g.fillRect(0, h * 0.42, w, h * 0.58);
        const side = g.createLinearGradient(0, 0, w * 0.55, 0); side.addColorStop(0, 'rgba(3,5,12,.42)'); side.addColorStop(1, 'rgba(3,5,12,0)');
        g.fillStyle = side; g.fillRect(0, 0, w * 0.55, h);
      }
      ctx.drawImage(this.shade, 0, 0, w, h);
      this.burst.forEach((b) => {
        const k = b.t / 1.2, R = 20 + k * 120;
        ctx.strokeStyle = 'rgba(255,230,160,' + (0.7 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 3 * (1 - k) + 0.5;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, TAU); ctx.stroke();
      });
    },
    click(x, y) { this.tap(x, y); return { tap: true, x, y }; }
  };
  return S;
}

/* ---------------- one scene slot, several scenes (a window's tabs) ---------------- */
export function switcher(scenes, first) {
  const ready = new Set();
  const sw = {
    id: 'switch', cur: first, w: 0, h: 0, soundOn: true,
    get scene() { return scenes[this.cur]; },
    /* put a different scene in a slot (it is set up when it is next used) */
    set(id, sc) { if (scenes[id] !== sc) { scenes[id] = sc; ready.delete(id); } },
    use(id) {
      if (!scenes[id]) return;
      this.cur = id;
      const sc = scenes[id];
      sc.soundOn = this.soundOn;
      if (this.w && !ready.has(id)) { sc.init(this.w, this.h); ready.add(id); }
      else if (this.w && sc.resize) sc.resize(this.w, this.h);
    },
    init(w, h) { this.w = w; this.h = h; ready.clear(); const sc = scenes[this.cur]; sc.init(w, h); ready.add(this.cur); },
    resize(w, h) { this.w = w; this.h = h; Object.keys(scenes).forEach((k) => { if (ready.has(k) && scenes[k].resize) scenes[k].resize(w, h); }); },
    step(dt, t) { const sc = scenes[this.cur]; sc.soundOn = this.soundOn; sc.step(dt, t); },
    draw(ctx, w, h, t) { scenes[this.cur].draw(ctx, w, h, t); },
    pointer(x, y, b) { const sc = scenes[this.cur]; if (sc.pointer) sc.pointer(x, y, b); },
    click(x, y) { const sc = scenes[this.cur]; return sc.click ? sc.click(x, y) : null; }
  };
  return sw;
}
