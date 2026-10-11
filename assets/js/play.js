/* Wonder Window: the play area for a class watching one shared screen. Four living scenes from planet Earth,
   nature and space, each with facts Symphony can read aloud, "wonder questions" for the chat, gentle sound, and
   something to do with the mouse: starlings that dodge a falcon, fireflies that slowly learn to flash together,
   the planets at their real relative speeds, and the northern lights over snowy mountains. All drawn live
   (no images or videos to download). */
import { $, $$, esc, el, icon, bus, reduceMotion, toast } from './core.js?v=7c13e055';
import { Sound, sfx } from './fx/audio.js?v=7c13e055';
import { Ambient, Speech } from './fx/sound.js?v=7c13e055';
import { track } from './track.js?v=7c13e055';
import { MINI } from './fx/symphony.js?v=7c13e055';
import { settings } from './settings.js?v=7c13e055';
import { registerScenes } from './commands.js?v=7c13e055';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let small = Math.min(window.innerWidth, window.innerHeight) < 700;

/* ---------- a tiny 2D value noise for wind, curtains and drifting ---------- */
const P = new Uint8Array(512);
(() => { const p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; })();
const fade = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => P[(P[(xi + i) & 255] + yi + j) & 255] / 255;
  const u = fade(xf), v = fade(yf);
  return (h(0, 0) * (1 - u) + h(1, 0) * u) * (1 - v) + (h(0, 1) * (1 - u) + h(1, 1) * u) * v;
}

/* ---------- 1. Starling murmuration at dusk ---------- */
const birds = {
  id: 'birds', name: 'Starlings', icon: 'flag', sound: 'birds', label: 'Birds at dusk',
  facts: ['Up to 100,000 starlings can fly together in one murmuration.', 'Each starling watches about seven of its nearest neighbours. That is enough to steer the whole flock.',
    'Murmurations happen at dusk in autumn and winter, just before the starlings settle down to roost.', 'Flying together keeps them safe: a falcon finds it very hard to pick out just one bird.',
    'Starlings are brilliant copycats. They can copy other birds, and even car alarms and phones!'],
  wonders: ['What shapes can you see the flock making?', 'Why do you think the birds stay so close together?', 'Watch the falcon. What do the starlings do when it comes near?', 'How many birds do you think are in this flock?'],
  init(w, h) {
    const n = small ? 650 : 1400;
    this.b = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = rnd(0, Math.min(w, h) * 0.18); this.b[i * 4] = w * 0.55 + Math.cos(a) * r; this.b[i * 4 + 1] = h * 0.38 + Math.sin(a) * r * 0.6; this.b[i * 4 + 2] = rnd(-1, 1); this.b[i * 4 + 3] = rnd(-1, 1); }
    this.n = n; this.w = w; this.h = h; this.goal = [w * 0.55, h * 0.38]; this.hawk = null; this.hawkT = 0; this.hawkAuto = [w * 0.2, h * 0.2];
    this.grid = new Map();
    this.sky = null;
  },
  resize(w, h) { const sx = w / this.w, sy = h / this.h; for (let i = 0; i < this.n; i++) { this.b[i * 4] *= sx; this.b[i * 4 + 1] *= sy; } this.w = w; this.h = h; this.sky = null; },
  pointer(x, y) { this.hawk = [x, y]; this.hawkT = 2.5; },
  step(dt, t) {
    const { w, h, n } = this, b = this.b, cell = 34, grid = this.grid;
    grid.clear();
    for (let i = 0; i < n; i++) { const k = ((b[i * 4] / cell) | 0) + ',' + ((b[i * 4 + 1] / cell) | 0); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(i); }
    this.goal[0] = w * (0.5 + 0.28 * Math.sin(t * 0.11) + 0.08 * Math.sin(t * 0.37)); this.goal[1] = h * (0.36 + 0.12 * Math.sin(t * 0.17 + 1) + 0.05 * Math.cos(t * 0.53));
    this.hawkT -= dt;
    let hawk = this.hawkT > 0 ? this.hawk : null;
    if (!hawk && Math.sin(t * 0.21) > 0.55) { this.hawkAuto[0] += (this.goal[0] + Math.cos(t * 0.9) * w * 0.14 - this.hawkAuto[0]) * 0.02; this.hawkAuto[1] += (this.goal[1] + Math.sin(t * 1.3) * h * 0.1 - this.hawkAuto[1]) * 0.02; hawk = this.hawkAuto; }
    this.hawkNow = hawk;
    const maxS = (small ? 2.6 : 3.1) * (dt * 60), minS = 1.4 * (dt * 60);
    for (let i = 0; i < n; i++) {
      const o = i * 4, x = b[o], y = b[o + 1];
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, cnt = 0;
      const gx = (x / cell) | 0, gy = (y / cell) | 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const a = grid.get((gx + dx) + ',' + (gy + dy)); if (!a) continue;
        for (let q = 0; q < a.length && cnt < 14; q++) {
          const j = a[q]; if (j === i) continue;
          const ex = b[j * 4] - x, ey = b[j * 4 + 1] - y, d2 = ex * ex + ey * ey;
          if (d2 > cell * cell) continue;
          cnt++; ax += b[j * 4 + 2]; ay += b[j * 4 + 3]; cx += ex; cy += ey;
          if (d2 < 64) { const k = 1 / Math.max(1, d2); sx -= ex * k * 6; sy -= ey * k * 6; }
        }
      }
      let vx = b[o + 2], vy = b[o + 3];
      if (cnt) { vx += (ax / cnt - vx) * 0.06 + cx / cnt * 0.0016 + sx * 0.05; vy += (ay / cnt - vy) * 0.06 + cy / cnt * 0.0016 + sy * 0.05; }
      vx += (this.goal[0] - x) * 0.00016; vy += (this.goal[1] - y) * 0.00022;
      if (hawk) { const hx = x - hawk[0], hy = y - hawk[1], d2 = hx * hx + hy * hy, R = small ? 90 : 140; if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 0.9; vx += hx / d * f + hy / d * f * 0.6; vy += hy / d * f - hx / d * f * 0.6; } }
      if (y < h * 0.05) vy += 0.08; if (y > h * 0.7) vy -= 0.12; if (x < w * 0.04) vx += 0.08; if (x > w * 0.96) vx -= 0.08;
      const s = Math.hypot(vx, vy) || 1;
      if (s > maxS) { vx = vx / s * maxS; vy = vy / s * maxS; } else if (s < minS) { vx = vx / s * minS; vy = vy / s * minS; }
      b[o + 2] = vx; b[o + 3] = vy; b[o] = x + vx; b[o + 1] = y + vy;
    }
  },
  drawSky(ctx, w, h) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1B2350'); sky.addColorStop(0.35, '#4B3F7A'); sky.addColorStop(0.62, '#C9667A'); sky.addColorStop(0.78, '#F5A35C'); sky.addColorStop(0.86, '#FFD08A');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.7, h * 0.8, 0, w * 0.7, h * 0.8, h * 0.45);
    sun.addColorStop(0, 'rgba(255,236,190,.95)'); sun.addColorStop(0.12, 'rgba(255,200,130,.55)'); sun.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = sun; g.fillRect(0, 0, w, h);
    const hill = (base, amp, col, seed) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - amp * h * (0.5 * noise(x / w * 3 + seed, seed) + 0.5 * noise(x / w * 9 + seed, seed * 2))); g.lineTo(w, h); g.fill(); };
    hill(0.84, 0.1, '#3B2A4A', 3); hill(0.9, 0.08, '#24192F', 7);
    const lake = g.createLinearGradient(0, h * 0.9, 0, h);
    lake.addColorStop(0, '#E7956A'); lake.addColorStop(1, '#2A1E33');
    g.fillStyle = lake; g.fillRect(0, h * 0.905, w, h * 0.1);
    g.strokeStyle = '#140E1B'; g.lineWidth = 1.4;
    for (let i = 0; i < w / 6; i++) { const x = i * 6 + rnd(-2, 2), hh = rnd(0.03, 0.09) * h; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + rnd(-6, 6), h - hh * 0.6, x + rnd(-10, 10), h - hh); g.stroke(); }
    return c;
  },
  draw(ctx, w, h, t) {
    if (!this.sky) this.sky = this.drawSky(ctx, w, h);
    ctx.drawImage(this.sky, 0, 0, w, h);
    const b = this.b, n = this.n;
    ctx.strokeStyle = 'rgba(18,12,28,.88)'; ctx.lineWidth = small ? 1.7 : 1.9; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const o = i * 4, x = b[o], y = b[o + 1], vx = b[o + 2], vy = b[o + 3], s = Math.hypot(vx, vy) || 1;
      const flap = 1.3 + Math.sin(t * 14 + i) * 0.9, ux = vx / s, uy = vy / s;
      ctx.moveTo(x - uy * flap - ux * 1.2, y + ux * flap - uy * 1.2); ctx.lineTo(x + ux * 1.6, y + uy * 1.6); ctx.lineTo(x + uy * flap - ux * 1.2, y - ux * flap - uy * 1.2);
    }
    ctx.stroke();
    const k = this.hawkNow;
    if (k) {
      ctx.save(); ctx.translate(k[0], k[1]); ctx.fillStyle = 'rgba(15,10,20,.95)';
      const f = Math.sin(t * 6) * 4;
      ctx.beginPath(); ctx.moveTo(-26, -4 + f); ctx.quadraticCurveTo(-10, -2, 0, 2); ctx.quadraticCurveTo(10, -2, 26, -4 + f); ctx.quadraticCurveTo(10, 4, 0, 8); ctx.quadraticCurveTo(-10, 4, -26, -4 + f); ctx.fill();
      ctx.restore();
    }
  }
};

/* ---------- 2. Fireflies that learn to flash together ---------- */
const flies = {
  id: 'flies', name: 'Fireflies', icon: 'bulb', sound: 'night', label: 'Fireflies at night',
  facts: ['Fireflies are not flies at all. They are beetles!', 'Their light comes from a chemical reaction in their tails, and it makes almost no heat.',
    'In the Great Smoky Mountains in America, thousands of fireflies flash at the same moment.', 'Nobody tells them when to flash. Each one copies its neighbours a tiny bit, and soon they all flash together.',
    'Fireflies flash to find each other. Each kind of firefly has its own flash pattern, like a secret code.'],
  wonders: ['Are they flashing together yet? Watch closely!', 'Count the flashes out loud with the fireflies.', 'Why might flashing together help the fireflies?', 'Click to flash your own lantern. Do the fireflies answer you?'],
  init(w, h) {
    const n = small ? 220 : 380;
    this.f = Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(h * 0.18, h * 0.92), z: rnd(0.4, 1.15), th: Math.random(), om: rnd(0.46, 0.62), b: 0, sx: Math.random() * 100, sy: Math.random() * 100 }));
    this.w = w; this.h = h; this.K = 0; this.age = 0; this.R = 0; this.bg = null; this.sprite = null; this.ripples = [];
  },
  resize(w, h) { const sx = w / this.w, sy = h / this.h; this.f.forEach((p) => { p.x *= sx; p.y *= sy; }); this.w = w; this.h = h; this.bg = null; },
  click(x, y) {
    this.ripples.push({ x, y, r: 0, a: 1 });
    this.f.forEach((p) => { const d = Math.hypot(p.x - x, p.y - y); if (d < Math.min(this.w, this.h) * 0.35) p.th = Math.max(p.th, 0.86 + (1 - d / (Math.min(this.w, this.h) * 0.35)) * 0.12); });
  },
  pointer(x, y) { this.px = x; this.py = y; this.pt = 1.5; },
  step(dt, t) {
    this.age += dt;
    const cyc = this.age % 90;
    this.K = cyc < 8 ? 0 : cyc < 60 ? 0.9 * (cyc - 8) / 52 : 0.9;
    if (cyc < dt * 1.5 && this.age > 2) this.f.forEach((p) => { p.th = Math.random(); });
    let cx = 0, cy = 0;
    this.f.forEach((p) => { cx += Math.cos(TAU * p.th); cy += Math.sin(TAU * p.th); });
    const n = this.f.length; cx /= n; cy /= n;
    this.R = Math.hypot(cx, cy); const psi = Math.atan2(cy, cx) / TAU;
    this.pt = (this.pt || 0) - dt;
    this.f.forEach((p) => {
      p.th += dt * (p.om + this.K * this.R * Math.sin(TAU * (psi - p.th)) * 0.9);
      if (p.th >= 1) { p.th -= 1; p.b = 1; }
      p.b = Math.max(0, p.b - dt * 2.6);
      p.x += (noise(p.sx + t * 0.12, 0) - 0.5) * 0.9 * p.z; p.y += (noise(0, p.sy + t * 0.12) - 0.5) * 0.7 * p.z;
      if (this.pt > 0) { const dx = p.x - this.px, dy = p.y - this.py, d = Math.hypot(dx, dy); if (d < 120 && d > 0) { p.x += dx / d * 0.8; p.y += dy / d * 0.8; } }
      if (p.x < -20) p.x = this.w + 20; if (p.x > this.w + 20) p.x = -20; if (p.y < this.h * 0.12) p.y += 1; if (p.y > this.h * 0.95) p.y -= 1;
    });
    this.ripples.forEach((r) => { r.r += dt * 520; r.a -= dt * 0.9; });
    this.ripples = this.ripples.filter((r) => r.a > 0);
  },
  drawBg(w, h) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04070F'); sky.addColorStop(0.55, '#0B1A24'); sky.addColorStop(1, '#0F2A22');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(0.15, 0.7).toFixed(2) + ')'; g.fillRect(rnd(0, w), rnd(0, h * 0.5), 1.2, 1.2); }
    const moon = g.createRadialGradient(w * 0.82, h * 0.16, 0, w * 0.82, h * 0.16, h * 0.16);
    moon.addColorStop(0, 'rgba(255,250,230,1)'); moon.addColorStop(0.18, 'rgba(255,248,225,.95)'); moon.addColorStop(0.22, 'rgba(220,230,255,.18)'); moon.addColorStop(1, 'rgba(200,220,255,0)');
    g.fillStyle = moon; g.fillRect(0, 0, w, h);
    const tree = (x, base, ht, col, wd) => {
      g.fillStyle = col; g.fillRect(x - wd * 0.06, base - ht, wd * 0.12, ht);
      for (let k = 0; k < 6; k++) { const yy = base - ht * (0.35 + k * 0.11), ww = wd * (1 - k * 0.14); g.beginPath(); g.moveTo(x - ww / 2, yy); g.lineTo(x, yy - ht * 0.22); g.lineTo(x + ww / 2, yy); g.fill(); }
    };
    for (let i = 0; i < 18; i++) tree(rnd(0, w), h * 0.86, rnd(0.35, 0.55) * h, '#0B1C1A', rnd(0.06, 0.1) * w);
    for (let i = 0; i < 12; i++) tree(rnd(0, w), h * 0.95, rnd(0.45, 0.75) * h, '#050D0C', rnd(0.08, 0.14) * w);
    g.fillStyle = '#04100C'; g.fillRect(0, h * 0.93, w, h * 0.07);
    for (let i = 0; i < w / 3; i++) { g.strokeStyle = '#06150F'; g.beginPath(); const x = i * 3; g.moveTo(x, h); g.lineTo(x + rnd(-4, 4), h * rnd(0.88, 0.93)); g.stroke(); }
    return c;
  },
  draw(ctx, w, h) {
    if (!this.bg) this.bg = this.drawBg(w, h);
    ctx.drawImage(this.bg, 0, 0, w, h);
    if (!this.sprite) {
      const s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d');
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(0.12, 'rgba(230,255,140,.95)'); r.addColorStop(0.4, 'rgba(180,255,90,.35)'); r.addColorStop(1, 'rgba(150,255,80,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); this.sprite = s;
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    this.f.forEach((p) => {
      const a = 0.08 + p.b * 0.92, size = (10 + p.b * 34) * p.z;
      ctx.globalAlpha = a; ctx.drawImage(this.sprite, p.x - size / 2, p.y - size / 2, size, size);
    });
    this.ripples.forEach((r) => { ctx.globalAlpha = r.a * 0.5; ctx.strokeStyle = 'rgba(230,255,160,1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke(); });
    ctx.restore();
    const pct = Math.round(this.R * 100);
    ctx.fillStyle = 'rgba(230,255,170,.75)'; ctx.font = '700 ' + (small ? 12 : 14) + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Flashing together: ' + pct + '%', 18, h - 18);
  }
};

/* ---------- 3. The solar system at real relative speeds ---------- */
const PLANETS = [
  { n: 'Mercury', a: 0.16, r: 3.2, p: 0.24, c: ['#E5E1DA', '#8E8A84'], f: 'Mercury is the closest planet to the Sun. A whole year there lasts just 88 days.' },
  { n: 'Venus', a: 0.23, r: 5.2, p: 0.62, c: ['#FFF1C9', '#D9A65C'], f: 'Venus is the hottest planet, even hotter than Mercury, because its thick clouds trap the heat.' },
  { n: 'Earth', a: 0.31, r: 5.6, p: 1, c: ['#9FE3FF', '#2563EB'], f: 'Earth is the only planet we know with life on it. It takes 365 days to travel once around the Sun.', moon: true },
  { n: 'Mars', a: 0.39, r: 4.2, p: 1.88, c: ['#FFB38A', '#C2410C'], f: 'Mars looks red because its dust has rusty iron in it. It has the tallest volcano in the solar system.' },
  { n: 'Jupiter', a: 0.53, r: 13, p: 11.86, c: ['#F8E1C2', '#B7835A'], f: 'Jupiter is so big that all the other planets could fit inside it. Its Great Red Spot is a storm bigger than Earth.', bands: true },
  { n: 'Saturn', a: 0.66, r: 11, p: 29.46, c: ['#FFF0C2', '#C9A35C'], f: 'Saturn’s rings are made of ice and rock. Saturn is so light it would float in a giant bath of water!', rings: true },
  { n: 'Uranus', a: 0.78, r: 8, p: 84, c: ['#D2FFFB', '#4FB7C9'], f: 'Uranus spins on its side, so it rolls around the Sun like a ball.' },
  { n: 'Neptune', a: 0.89, r: 7.8, p: 164.8, c: ['#A8C5FF', '#2D47C9'], f: 'Neptune has the fastest winds in the solar system. One year there lasts 165 Earth years!' }
];
const space = {
  id: 'space', name: 'Planets', icon: 'globe', sound: '', pad: true, label: 'The solar system',
  facts: ['The Sun is a star. About a million Earths could fit inside it.', 'Light from the Sun takes about eight minutes to reach us.', 'The planets travel at their real speeds compared with each other here: watch Mercury race and Neptune crawl.',
    'Between Mars and Jupiter there is a belt of rocky asteroids.', 'Tap any planet to hear about it.'],
  wonders: ['Which planet goes round the Sun fastest? Why do you think that is?', 'While Earth goes round once, how many times does Mercury go round?', 'Can you spot Saturn’s rings?', 'Which planet would you visit, and what would you pack?'],
  init(w, h) {
    this.w = w; this.h = h; this.year = 0; this.bg = null; this.sel = null; this.hover = null;
    this.stars = Array.from({ length: small ? 220 : 420 }, () => ({ x: Math.random(), y: Math.random(), s: rnd(0.4, 1.6), tw: rnd(0, TAU) }));
    this.belt = Array.from({ length: small ? 160 : 320 }, () => ({ a: rnd(0.44, 0.48), th: rnd(0, TAU), s: rnd(0.5, 1.4) }));
    PLANETS.forEach((p, i) => { p.th = rnd(0, TAU); p.i = i; });
    this.comet = null;
  },
  resize(w, h) { this.w = w; this.h = h; this.bg = null; },
  geo() { const w = this.w, h = this.h, R = Math.min(w * 0.47, h * 1.02); return { cx: w / 2, cy: h * 0.53, R, k: 0.42 }; },
  pos(p) { const g = this.geo(); return { x: g.cx + Math.cos(p.th) * p.a * g.R, y: g.cy + Math.sin(p.th) * p.a * g.R * g.k, s: (small ? 0.85 : 1) * (1 + Math.sin(p.th) * 0.12) * Math.max(0.8, Math.min(1.4, this.h / 700)) }; },
  pick(x, y) {
    let best = null, bd = 1e9;
    PLANETS.forEach((p) => { const q = this.pos(p), d = Math.hypot(q.x - x, q.y - y) - p.r * q.s * 1.6; if (d < bd) { bd = d; best = p; } });
    const g = this.geo();
    if (Math.hypot(x - g.cx, y - g.cy) < 40) return { n: 'Sun', f: this.facts[0] };
    return bd < 26 ? best : null;
  },
  click(x, y) { const p = this.pick(x, y); if (p) { this.sel = p; this.selT = 6; return { fact: p.f, title: p.n }; } return null; },
  pointer(x, y) { this.hover = this.pick(x, y); },
  step(dt) {
    this.year += dt / 20;
    PLANETS.forEach((p) => { p.th += dt / 20 / p.p * TAU; });
    this.belt.forEach((b) => { b.th += dt / 20 / 4.5 * TAU / Math.pow(b.a / 0.31, 1.5); });
    this.selT = (this.selT || 0) - dt;
    if (!this.comet && Math.random() < dt * 0.05) this.comet = { x: rnd(-0.1, 0.4), y: rnd(-0.1, 0.3), vx: rnd(0.12, 0.2), vy: rnd(0.05, 0.1), life: 4 };
    if (this.comet) { const c = this.comet; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt; if (c.life <= 0) this.comet = null; }
  },
  drawBg(w, h) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    g.fillStyle = '#03040B'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const t = Math.random(), x = t * w, y = h * (0.92 - 0.8 * t) + (noise(t * 3, 3) - 0.5) * h * 0.14 + rnd(-1, 1) * h * 0.07;
      const r = rnd(20, 80); const m = g.createRadialGradient(x, y, 0, x, y, r);
      m.addColorStop(0, 'rgba(' + (Math.random() < 0.5 ? '150,135,255' : '110,170,255') + ',.016)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = m; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return c;
  },
  shade(ctx, x, y, r, p, g) {
    const lx = g.cx - x, ly = g.cy - y, l = Math.hypot(lx, ly) || 1;
    const gr = ctx.createRadialGradient(x + lx / l * r * 0.45, y + ly / l * r * 0.45, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, p.c[0]); gr.addColorStop(0.6, p.c[1]); gr.addColorStop(1, '#05060C');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (p.bands) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#7A4B2E'; for (let k = -2; k <= 2; k++) ctx.fillRect(x - r, y + k * r * 0.34 - r * 0.06, r * 2, r * 0.12); ctx.globalAlpha = 0.6; ctx.fillStyle = '#C0583A'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.32, r * 0.2, r * 0.11, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  draw(ctx, w, h, t) {
    if (!this.bg) this.bg = this.drawBg(w, h);
    ctx.drawImage(this.bg, 0, 0, w, h);
    this.stars.forEach((s) => { ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + s.tw)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); });
    ctx.globalAlpha = 1;
    if (this.comet) { const c = this.comet, x = c.x * w, y = c.y * h, gr = ctx.createLinearGradient(x, y, x - c.vx * w * 0.6, y - c.vy * h * 0.6); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(160,200,255,0)'); ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - c.vx * w * 0.6, y - c.vy * h * 0.6); ctx.stroke(); }
    const g = this.geo();
    ctx.strokeStyle = 'rgba(160,180,255,.13)'; ctx.lineWidth = 1;
    PLANETS.forEach((p) => { ctx.beginPath(); ctx.ellipse(g.cx, g.cy, p.a * g.R, p.a * g.R * g.k, 0, 0, TAU); ctx.stroke(); });
    const back = [], front = [];
    PLANETS.forEach((p) => (Math.sin(p.th) < 0 ? back : front).push(p));
    const beltDraw = (frontHalf) => { ctx.fillStyle = 'rgba(200,190,170,.55)'; this.belt.forEach((b) => { if ((Math.sin(b.th) >= 0) !== frontHalf) return; ctx.fillRect(g.cx + Math.cos(b.th) * b.a * g.R, g.cy + Math.sin(b.th) * b.a * g.R * g.k, b.s, b.s); }); };
    beltDraw(false);
    back.sort((a, b) => Math.sin(a.th) - Math.sin(b.th)).forEach((p) => this.planet(ctx, p, g, t));
    const sr = Math.min(w, h) * 0.06;
    const glow = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, sr * 4.5);
    glow.addColorStop(0, 'rgba(255,240,200,1)'); glow.addColorStop(0.2, 'rgba(255,200,90,.9)'); glow.addColorStop(0.45, 'rgba(255,140,40,.25)'); glow.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(g.cx, g.cy, sr * 4.5, 0, TAU); ctx.fill();
    const core = ctx.createRadialGradient(g.cx - sr * 0.3, g.cy - sr * 0.3, sr * 0.1, g.cx, g.cy, sr);
    core.addColorStop(0, '#FFFBEA'); core.addColorStop(0.6, '#FFD15C'); core.addColorStop(1, '#FF9F1C');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(g.cx, g.cy, sr * (1 + Math.sin(t * 2) * 0.015), 0, TAU); ctx.fill();
    beltDraw(true);
    front.sort((a, b) => Math.sin(a.th) - Math.sin(b.th)).forEach((p) => this.planet(ctx, p, g, t));
    ctx.fillStyle = 'rgba(220,230,255,.7)'; ctx.font = '700 ' + (small ? 11 : 13) + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Earth years: ' + this.year.toFixed(1), 18, h - 18);
  },
  planet(ctx, p, g, t) {
    const q = this.pos(p), r = p.r * q.s;
    if (p.rings) { ctx.save(); ctx.strokeStyle = 'rgba(235,215,160,.55)'; ctx.lineWidth = r * 0.35; ctx.beginPath(); ctx.ellipse(q.x, q.y, r * 2.1, r * 0.75, -0.25, Math.PI, TAU); ctx.stroke(); ctx.restore(); }
    this.shade(ctx, q.x, q.y, r, p, g);
    if (p.rings) { ctx.save(); ctx.strokeStyle = 'rgba(235,215,160,.7)'; ctx.lineWidth = r * 0.35; ctx.beginPath(); ctx.ellipse(q.x, q.y, r * 2.1, r * 0.75, -0.25, 0, Math.PI); ctx.stroke(); ctx.restore(); }
    if (p.moon) { const a = t * 2.2, mx = q.x + Math.cos(a) * r * 2.4, my = q.y + Math.sin(a) * r * 1.1; ctx.fillStyle = '#D6D6D6'; ctx.beginPath(); ctx.arc(mx, my, Math.max(1.3, r * 0.27), 0, TAU); ctx.fill(); }
    const on = (this.sel === p && this.selT > 0) || this.hover === p;
    if (on || !small) {
      ctx.fillStyle = on ? '#FFFFFF' : 'rgba(200,210,240,.55)'; ctx.font = (on ? '800 ' : '600 ') + (small ? 11 : 12.5) + 'px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(p.n, q.x + r + 6, q.y - r - 2);
    }
    if (on) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, r + 6 + Math.sin(t * 5) * 1.5, 0, TAU); ctx.stroke(); }
  }
};

/* ---------- 4. Northern lights over snowy mountains ---------- */
const aurora = {
  id: 'aurora', name: 'Northern lights', icon: 'sparkle', sound: 'wind', pad: true, label: 'The northern lights',
  facts: ['The northern lights are also called the aurora borealis.', 'They happen when tiny bits from the Sun crash into the air high above the Earth and make it glow.',
    'Green light comes from oxygen about 100 kilometres up in the sky. Pink and purple come from nitrogen.', 'You can see them close to the North Pole: in Norway, Iceland, Canada and sometimes Scotland, on a clear, dark night.',
    'Near the South Pole they are called the southern lights, the aurora australis.'],
  wonders: ['What colours can you see?', 'What do the lights remind you of?', 'Why do you think we only see them near the North and South Poles?', 'Click the sky to send a solar storm. What happens?'],
  init(w, h) { this.w = w; this.h = h; this.bg = null; this.fg = null; this.boost = 0; this.wind = 0; this.stars = Array.from({ length: small ? 180 : 320 }, () => ({ x: Math.random(), y: Math.random() * 0.6, s: rnd(0.5, 1.5), tw: rnd(0, TAU) })); this.off = null; },
  resize(w, h) { this.w = w; this.h = h; this.bg = null; this.fg = null; this.off = null; },
  click() { this.boost = 1; return null; },
  pointer(x) { this.wind = (x / this.w - 0.5) * 2; },
  step(dt) { this.boost = Math.max(0, this.boost - dt * 0.25); },
  drawLayers(w, h) {
    const bg = document.createElement('canvas'); bg.width = Math.max(1, Math.round(w)); bg.height = Math.max(1, Math.round(h));
    let g = bg.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#020611'); sky.addColorStop(0.6, '#071A2C'); sky.addColorStop(1, '#0C2A3A');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const fg = document.createElement('canvas'); fg.width = bg.width; fg.height = bg.height;
    g = fg.getContext('2d');
    const mount = (base, amp, col, mid, snow, seed) => {
      const pts = [];
      for (let x = 0; x <= w + 10; x += 8) pts.push([x, h * base - amp * h * Math.pow(noise(x / w * 2.6 + seed, seed), 1.5) - amp * h * 0.3 * noise(x / w * 12 + seed, 2) - amp * h * 0.08 * noise(x / w * 40, seed)]);
      const top = h * base - amp * h * 1.3, gr = g.createLinearGradient(0, top, 0, h * base + h * 0.05);
      gr.addColorStop(0, snow); gr.addColorStop(0.3, mid); gr.addColorStop(0.75, col); gr.addColorStop(1, col);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(w, h); g.fill();
      g.strokeStyle = 'rgba(235,242,255,.35)'; g.lineWidth = 1; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    };
    mount(0.72, 0.3, '#0C1A28', '#3E5470', 'rgba(205,220,242,1)', 2);
    mount(0.82, 0.22, '#08131E', '#2C3E55', 'rgba(232,240,252,1)', 9);
    g.fillStyle = 'rgba(20,40,60,.65)'; g.fillRect(0, h * 0.84, w, h * 0.16);
    const cx = w * 0.18, cy = h * 0.835;
    g.fillStyle = '#05090F'; g.fillRect(cx - 22, cy - 18, 44, 18); g.beginPath(); g.moveTo(cx - 28, cy - 18); g.lineTo(cx, cy - 38); g.lineTo(cx + 28, cy - 18); g.fill();
    g.fillStyle = 'rgba(255,190,90,.95)'; g.fillRect(cx - 8, cy - 13, 9, 8);
    const win = g.createRadialGradient(cx - 4, cy - 9, 0, cx - 4, cy - 9, 40); win.addColorStop(0, 'rgba(255,180,80,.35)'); win.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = win; g.fillRect(cx - 44, cy - 50, 88, 80);
    for (let i = 0; i < 14; i++) { const x = rnd(w * 0.3, w), base = h * rnd(0.86, 0.95), ht = rnd(0.05, 0.12) * h; g.fillStyle = '#03070C'; g.beginPath(); g.moveTo(x, base - ht); g.lineTo(x - ht * 0.3, base); g.lineTo(x + ht * 0.3, base); g.fill(); }
    return { bg, fg };
  },
  draw(ctx, w, h, t) {
    if (!this.bg) { const l = this.drawLayers(w, h); this.bg = l.bg; this.fg = l.fg; }
    ctx.drawImage(this.bg, 0, 0, w, h);
    this.stars.forEach((s) => { ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.6 + s.tw)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); });
    ctx.globalAlpha = 1;
    const bw = Math.max(80, Math.round(w / 4)), bh = Math.max(60, Math.round(h / 4));
    if (!this.buf) this.buf = document.createElement('canvas');
    const B = this.buf; if (B.width !== bw || B.height !== bh) { B.width = bw; B.height = bh; }
    const g = B.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, bw, bh); g.globalCompositeOperation = 'lighter';
    const ribbons = [{ y: 0.3, amp: 0.07, h: 0.26, s: 0.11, hue: 0 }, { y: 0.4, amp: 0.06, h: 0.2, s: 0.08, hue: 1 }, { y: 0.21, amp: 0.05, h: 0.16, s: 0.15, hue: 2 }];
    const boost = 1 + this.boost * 1.4, step = 1.5;
    ribbons.forEach((r, ri) => {
      const top = bh * (r.y - r.h - r.amp), bot = bh * (r.y + r.amp + 0.04);
      const gr = g.createLinearGradient(0, top, 0, bot);
      if (r.hue === 1) { gr.addColorStop(0, 'rgba(190,90,255,0)'); gr.addColorStop(0.45, 'rgba(160,80,255,.4)'); gr.addColorStop(0.85, 'rgba(60,255,170,.6)'); gr.addColorStop(1, 'rgba(60,255,170,0)'); }
      else { gr.addColorStop(0, 'rgba(255,90,180,0)'); gr.addColorStop(0.32, 'rgba(255,100,190,.18)'); gr.addColorStop(0.64, 'rgba(70,255,160,.5)'); gr.addColorStop(0.9, 'rgba(140,255,200,.85)'); gr.addColorStop(1, 'rgba(140,255,200,0)'); }
      g.fillStyle = gr;
      for (let x = 0; x < bw; x += step) {
        const u = x / bw;
        const wave = Math.sin(u * 4.2 + t * r.s * 3 + ri * 1.7) * 0.7 + (noise(u * 2.4 + ri * 10, t * r.s) - 0.5) * 1.5 + this.wind * 0.3 * (u - 0.5);
        const yb = bh * (r.y + r.amp * wave);
        const len = bh * r.h * (0.5 + 0.6 * noise(u * 9 + ri * 7, t * 0.35 + ri));
        const a = clamp((0.15 + 0.85 * Math.pow(noise(u * 3.2 - t * 0.18, ri * 3 + t * 0.12), 1.4)) * (0.72 + 0.28 * noise(u * 46, t * 0.9 + ri)) * boost, 0, 1);
        g.globalAlpha = a * (ri === 2 ? 0.55 : 0.85);
        g.fillRect(x, yb - len, step + 0.6, len + bh * 0.03);
      }
    });
    g.globalAlpha = 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.drawImage(B, 0, 0, w, h); ctx.restore();
    const lakeY = h * 0.84, k = 0.16 / 0.6;
    ctx.save(); ctx.beginPath(); ctx.rect(0, lakeY, w, h - lakeY); ctx.clip();
    ctx.globalAlpha = 0.3; ctx.globalCompositeOperation = 'lighter';
    ctx.translate(0, lakeY + h * 0.6 * k); ctx.scale(1, -k); ctx.drawImage(B, 0, 0, w, h);
    ctx.restore();
    ctx.drawImage(this.fg, 0, 0, w, h);
  }
};

const SCENES = [birds, flies, space, aurora];

/* ---------- a soft "music of the spheres" pad for space and the lights ---------- */
const Pad = {
  ctx: null, out: null, on: false, timer: 0,
  start() {
    try {
      if (!this.ctx) { const c = Sound.ctx(); if (!c) return; this.ctx = c; this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(Sound.ambience()); }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.on = true;
      this.out.gain.cancelScheduledValues(this.ctx.currentTime); this.out.gain.linearRampToValueAtTime(0.11, this.ctx.currentTime + 2.5);
      if (!this.timer) { this.chord(); this.timer = setInterval(() => this.chord(), 7000); }
    } catch (e) { /* no audio */ }
  },
  chord() {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, base = [261.63, 293.66, 329.63, 392, 440][Math.floor(Math.random() * 5)], ratios = [1, 1.25, 1.5, 2, 2.5];
    ratios.forEach((r, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.35;
      o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = base * r / 2;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18 / (i + 1), t + 2.2); g.gain.linearRampToValueAtTime(0, t + 7.5);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 7.8);
    });
  },
  stop() { this.on = false; clearInterval(this.timer); this.timer = 0; if (this.ctx && this.out) { try { this.out.gain.cancelScheduledValues(this.ctx.currentTime); this.out.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1); } catch (e) { /* ignore */ } } }
};

/* ---------- the view ---------- */
let root = null, canvas = null, ctx = null, scene = null, raf = 0, last = 0, t = 0, dpr = 1, W = 0, H = 0, startedAt = 0, items = [], idx = 0, rotT = 0, soundOn = true, idleT = 0;
function build() {
  root = $('#view-play');
  root.innerHTML = '<canvas class="play-cv" aria-label="Wonder Window scene"></canvas>' +
    '<div class="play-top"><a class="play-home" href="#/" aria-label="Back to the engines">' + icon('left') + '</a><div class="play-title"><b>Wonder Window</b><small></small></div>' +
    '<div class="play-tabs" role="tablist" aria-label="Scenes">' + SCENES.map((s) => '<button type="button" role="tab" data-scene="' + s.id + '" aria-selected="false">' + esc(s.name) + '</button>').join('') + '</div>' +
    '<div class="play-btns"><button type="button" class="pbtn" data-play-sound aria-pressed="true" title="Sound">' + icon('volume') + '<span>Sound</span></button><button type="button" class="pbtn" data-play-full title="Full screen">' + icon('expand') + '</button></div></div>' +
    '<div class="play-cap" aria-live="polite"><span class="play-sym">' + MINI() + '</span><div class="play-txt"><small></small><p></p></div><div class="play-nav"><button type="button" class="pbtn" data-cap-say title="Symphony reads it">' + icon('volume') + '</button><button type="button" class="pbtn" data-cap-next title="Next">' + icon('right') + '</button></div></div>';
  canvas = $('.play-cv', root); ctx = canvas.getContext('2d');
  root.addEventListener('click', (e) => {
    const s = e.target.closest('[data-scene]'); if (s) { choose(s.dataset.scene); return; }
    if (e.target.closest('[data-cap-next]')) { nextItem(true); return; }
    if (e.target.closest('[data-cap-say]')) { say(true); return; }
    if (e.target.closest('[data-play-sound]')) { soundOn = !soundOn; e.target.closest('[data-play-sound]').setAttribute('aria-pressed', String(soundOn)); applySound(); return; }
    if (e.target.closest('[data-play-full]')) { try { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen(); } catch (er) { /* not allowed */ } }
  });
  const at = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointermove', (e) => { wake(); if (scene && scene.pointer) { const [x, y] = at(e); scene.pointer(x, y); } });
  canvas.addEventListener('pointerdown', (e) => {
    wake(); if (!scene) return;
    const [x, y] = at(e);
    if (scene.pointer) scene.pointer(x, y);
    const r = scene.click ? scene.click(x, y) : null;
    if (r && r.fact) { show({ kind: r.title || 'Did you know?', text: r.fact }); say(false); }
  });
  window.addEventListener('resize', () => { if (root && !root.hidden) size(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopLoop(); else if (root && !root.hidden) loop(); });
}
function wake() { idleT = 0; root.classList.remove('idle'); }
function size() {
  const r = root.getBoundingClientRect();
  small = Math.min(r.width, r.height) < 700;
  dpr = Math.min(window.devicePixelRatio || 1, small ? 2 : 1.75);
  const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
  if (w === W && h === H) return;
  const first = !W;
  W = w; H = h;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  if (scene && !first) scene.resize(w, h);
}
function choose(id) {
  const s = SCENES.find((x) => x.id === id) || SCENES[0];
  if (scene && scene.id !== s.id) sfx('whoosh');
  if (scene && startedAt) track('play', { scene: scene.id, ms: Date.now() - startedAt });
  scene = s; startedAt = Date.now();
  W = 0; size(); scene.init(W, H);
  $$('[data-scene]', root).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.scene === s.id)));
  $('.play-title small', root).textContent = s.label;
  items = []; s.facts.forEach((f, i) => { items.push({ kind: 'Did you know?', text: f }); if (s.wonders[i]) items.push({ kind: 'Wonder question', text: s.wonders[i] }); });
  idx = -1; nextItem(false);
  applySound();
  try { history.replaceState(null, '', '#/play/' + s.id); } catch (e) { /* ignore */ }
}
function show(it) { $('.play-txt small', root).textContent = it.kind; $('.play-txt p', root).textContent = it.text; const cap = $('.play-cap', root); cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); rotT = 0; }
function nextItem(user) { if (!items.length) return; idx = (idx + 1) % items.length; show(items[idx]); if (user) say(false); }
function say(force) {
  const txt = $('.play-txt p', root).textContent;
  if (!txt || (!force && !settings.voice)) return;
  Speech.stop(); Speech.speak(txt, { lang: 'en-GB', rate: 0.92, pitch: 1.12 });
}
function applySound() {
  if (!scene) return;
  if (soundOn && scene.sound) Ambient.play(scene.sound); else Ambient.stop();
  if (soundOn && scene.pad) Pad.start(); else Pad.stop();
}
function frame(now) {
  raf = 0;
  if (!root || root.hidden || document.hidden) return;
  const dt = Math.min(0.05, ((now - (last || now)) / 1000)) * (reduceMotion() ? 0.35 : 1);
  last = now; t += dt; rotT += dt; idleT += dt;
  if (idleT > 4 && document.fullscreenElement) root.classList.add('idle');
  if (rotT > 18) nextItem(false);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scene.step(dt, t);
  scene.draw(ctx, W, H, t);
  raf = requestAnimationFrame(frame);
}
function loop() { if (!raf && scene) { last = 0; raf = requestAnimationFrame(frame); } }
function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
export function openPlay(id) {
  if (!root) build();
  document.body.classList.add('playing');
  const want = id || ((/^#\/play\/(\w+)/.exec(location.hash) || [])[1]) || (scene && scene.id) || 'birds';
  requestAnimationFrame(() => { choose(want); loop(); });
}
export function closePlay() {
  if (scene && startedAt) track('play', { scene: scene.id, ms: Date.now() - startedAt });
  startedAt = 0;
  document.body.classList.remove('playing');
  stopLoop(); Ambient.stop(); Pad.stop(); Speech.stop();
  try { if (document.fullscreenElement === root) document.exitFullscreen(); } catch (e) { /* ignore */ }
}
const WORDS = { birds: ['starlings', 'starling', 'birds', 'the birds', 'murmuration'], flies: ['fireflies', 'firefly', 'fire flies'], space: ['planets', 'the planets', 'solar system', 'the solar system', 'space'], aurora: ['northern lights', 'the northern lights', 'aurora', 'aurora borealis'] };
export function initPlay() {
  bus.on('play', (on) => (on ? openPlay() : closePlay()));
  registerScenes(SCENES.map((s) => ({ id: s.id, name: s.name, words: WORDS[s.id] || [] })));     // "Hey Symphony, show the northern lights"
  bus.on('play-scene', (id) => { if (root && document.body.classList.contains('playing') && SCENES.some((x) => x.id === id)) choose(id); });
}
