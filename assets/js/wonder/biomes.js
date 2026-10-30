/* The living world: six habitats drawn live on screen (Malaysia's rainforest, the savannah, the tundra, the desert,
   a coral reef and the polar lands). Animals walk, fly, swim, swing and hop; tap one for its card with a real photo.
   The rainforest shows its four layers (tap a layer's name), in English or Bahasa Melayu. The polar lands are split
   in two, because polar bears (the Arctic) and penguins (Antarctica) never meet. */
import { BIOMES } from './data.js?v=cdc164df';
import { TAU, rnd, clamp, noise, layer, view, FONT } from './util.js?v=cdc164df';
import { drawCreature, creatureOf } from './fauna.js?v=cdc164df';

/* long, low creatures are drawn a little smaller, so they take about the room their emoji did */
const FIT = { whale: 0.5, shark: 0.62, seal: 0.6, lizard: 0.7, scorpion: 0.8, reeffish: 0.85, butterfly: 0.75, hornbill: 0.8, falcon: 0.8 };
const SIZE = { '🐘': 1.9, '🦒': 2.05, '🐋': 2.2, '🐪': 1.75, '🦁': 1.35, '🦓': 1.35, '🦬': 1.25, '🐅': 1.45, '🦧': 1.25, '🐦': 0.85, '🦋': 0.6, '🐸': 0.7, '🦊': 0.95,
  '🐇': 0.8, '🦉': 0.9, '🦌': 1.35, '🦂': 0.6, '🦎': 0.75, '🐠': 0.75, '🐢': 1.15, '🐙': 1.0, '🦈': 1.6, '🐡': 0.85, '🐧': 0.95, '🐻‍❄️': 1.6, '🦭': 1.25, '🐗': 1.1 };
const COUNT = { herd: 5, flutter: 3, waddle: 5, hop: 2, fly: 2 };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => clamp(Math.round(v * k), 0, 255); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
const grad = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };

/* ---------------- scenery, drawn once ---------------- */
function ridge(g, w, h, base, amp, fill, seed, freq) {
  g.fillStyle = fill; g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w + 8; x += 8) g.lineTo(x, base - amp * (0.65 * noise(x / w * (freq || 3) + seed, seed) + 0.35 * noise(x / w * (freq || 3) * 4 + seed, seed * 2)));
  g.lineTo(w, h); g.closePath(); g.fill();
}
function sunDisc(g, x, y, r, core, glow) {
  const gl = g.createRadialGradient(x, y, 0, x, y, r * 5);
  gl.addColorStop(0, glow); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  g.fillStyle = core; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
function acacia(g, x, base, s, col) {
  g.strokeStyle = col; g.lineCap = 'round';
  g.lineWidth = s * 0.07; g.beginPath(); g.moveTo(x, base); g.lineTo(x - s * 0.02, base - s * 0.55); g.stroke();
  g.lineWidth = s * 0.04;
  [[-0.3, -0.85], [0.28, -0.8], [0.05, -0.9]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(x - s * 0.02, base - s * 0.5); g.quadraticCurveTo(x + dx * s * 0.4, base + dy * s * 0.7, x + dx * s, base + dy * s); g.stroke(); });
  g.fillStyle = col;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(x + (i / 8 - 0.5) * s * 1.5, base - s * (0.92 + 0.06 * Math.sin(i * 1.7)), s * 0.28, s * 0.1, 0, 0, TAU); g.fill(); }
}
function palm(g, x, base, s, col) {
  g.strokeStyle = col; g.lineWidth = s * 0.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + s * 0.12, base - s * 0.5, x + s * 0.06, base - s); g.stroke();
  g.lineWidth = s * 0.035;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 6 - 0.5) * 2.6, tx = x + s * 0.06 + Math.cos(a) * s * 0.45, ty = base - s + Math.sin(a) * s * 0.3 + s * 0.12;
    g.beginPath(); g.moveTo(x + s * 0.06, base - s); g.quadraticCurveTo((x + s * 0.06 + tx) / 2, base - s - s * 0.12, tx, ty); g.stroke();
  }
}
function pine(g, x, base, s, col) {
  g.fillStyle = col;
  for (let k = 0; k < 4; k++) { const y = base - s * (0.25 + k * 0.2), wd = s * (0.42 - k * 0.08); g.beginPath(); g.moveTo(x - wd, y); g.lineTo(x, y - s * 0.32); g.lineTo(x + wd, y); g.fill(); }
  g.fillRect(x - s * 0.03, base - s * 0.25, s * 0.06, s * 0.25);
}
function crown(g, x, y, r, cols) {
  for (let i = 0; i < 7; i++) {
    const a = rnd(0, TAU), d = rnd(0, r * 0.55);
    g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * rnd(0.45, 0.7), 0, TAU); g.fill();
  }
}
function branchCoral(g, x, y, len, ang, depth, col) {
  if (depth <= 0 || len < 3) return;
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  g.strokeStyle = col; g.lineWidth = Math.max(1.5, depth * 2.2); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
  branchCoral(g, x2, y2, len * 0.74, ang - rnd(0.25, 0.55), depth - 1, col);
  branchCoral(g, x2, y2, len * 0.74, ang + rnd(0.25, 0.55), depth - 1, col);
}
function brainCoral(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, Math.PI, TAU); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) { g.beginPath(); g.ellipse(x, y, r * i / 5, r * 0.7 * i / 5, 0, Math.PI, TAU); g.stroke(); }
}
function fanCoral(g, x, y, s, col) {
  g.strokeStyle = col; g.lineWidth = 1.6;
  for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i / 15 - 0.5) * 1.9; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.6, x + Math.cos(a) * s, y + Math.sin(a) * s); g.stroke(); }
}
function iceberg(g, x, base, s, light) {
  g.fillStyle = light; g.beginPath(); g.moveTo(x - s, base);
  g.lineTo(x - s * 0.7, base - s * 0.35); g.lineTo(x - s * 0.25, base - s * 0.5); g.lineTo(x + s * 0.1, base - s * 0.85); g.lineTo(x + s * 0.45, base - s * 0.4); g.lineTo(x + s, base);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(90,140,200,.35)'; g.beginPath(); g.moveTo(x + s * 0.1, base - s * 0.85); g.lineTo(x + s * 0.45, base - s * 0.4); g.lineTo(x + s, base); g.lineTo(x + s * 0.2, base); g.closePath(); g.fill();
}

/* The geometry every habitat shares: where the horizon is, and where animals can walk, fly and swim. */
function geom(key, w, h) {
  const floor = Math.min(h * 0.86, h - 140);
  if (key === 'rainforest') return { hy: 0, floor, walk: [floor - 18, floor], fly: [h * 0.12, h * 0.2] };
  if (key === 'reef') return { hy: 0, floor, walk: [floor - 20, floor], fly: [h * 0.2, Math.min(h * 0.66, floor - 70)] };
  const hy = h * (key === 'polar' ? 0.5 : 0.55);
  return { hy, floor, walk: [hy + (floor - hy) * 0.3, floor], fly: [h * 0.16, hy - h * 0.1], sea: key === 'polar' ? [hy + 4, hy + (floor - hy) * 0.22] : null };
}

function paint(key, B, w, h) {
  const bg = layer(w, h), g = bg.getContext('2d'), fg = layer(w, h), f = fg.getContext('2d'), G = geom(key, w, h);
  const sky = B.sky;
  if (key === 'rainforest') {
    g.fillStyle = grad(g, 0, h, [[0, '#0B2F24'], [0.45, '#123F2E'], [1, '#081C14']]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(40,90,60,' + rnd(0.15, 0.3).toFixed(2) + ')'; g.fillRect(rnd(0, w), h * 0.15, rnd(4, 14), h); }  // misty far trunks
    const trunks = [];
    for (let i = 0; i < 5; i++) trunks.push(w * (0.12 + i * 0.2 + rnd(-0.05, 0.05)));
    trunks.forEach((x, i) => {
      const tall = i % 2 === 0, top = tall ? h * 0.12 : h * 0.3, wd = tall ? w * 0.022 : w * 0.015;
      g.fillStyle = grad(g, top, G.floor, [[0, '#4A3A26'], [1, '#2B2216']]); g.fillRect(x - wd / 2, top, wd, G.floor - top + 6);
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - wd / 2, G.floor); g.quadraticCurveTo(x - wd * 2, G.floor - 4, x - wd * 2.6, G.floor + 4); g.moveTo(x + wd / 2, G.floor); g.quadraticCurveTo(x + wd * 2, G.floor - 4, x + wd * 2.6, G.floor + 4); g.stroke();
      if (tall) crown(g, x, h * 0.13, Math.min(w, h) * 0.075, ['#2E7D46', '#3A9A57', '#25683A', '#4FB06A']);
    });
    for (let x = -30; x < w + 60; x += Math.min(w, h) * 0.07) crown(g, x + rnd(-10, 10), h * rnd(0.31, 0.38), Math.min(w, h) * rnd(0.07, 0.1), ['#1F6B3B', '#2A8048', '#185A31', '#348F50', '#226F3F']);
    g.fillStyle = 'rgba(8,30,20,.35)'; g.fillRect(0, h * 0.42, w, G.floor - h * 0.42);
    g.strokeStyle = 'rgba(70,140,70,.7)'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const x = rnd(0, w), y0 = h * 0.36, len = rnd(0.12, 0.35) * h; g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + rnd(-30, 30), y0 + len * 0.4, x + rnd(-30, 30), y0 + len * 0.7, x + rnd(-12, 12), y0 + len); g.stroke(); }
    for (let i = 0; i < 9; i++) palm(g, rnd(0, w), G.floor + 4, rnd(0.14, 0.24) * h, 'rgba(30,90,45,.9)');
    g.fillStyle = grad(g, G.floor - 10, h, [[0, '#3B4A22'], [0.3, '#2C3618'], [1, '#141A0B']]); g.fillRect(0, G.floor - 6, w, h - G.floor + 6);
    for (let i = 0; i < 90; i++) { g.fillStyle = ['#6B4E2E', '#8A6B3A', '#4E6B2E'][i % 3]; g.beginPath(); g.ellipse(rnd(0, w), rnd(G.floor, h), rnd(3, 7), rnd(1.5, 3), rnd(0, 3), 0, TAU); g.fill(); }
    for (let i = 0; i < 16; i++) { const x = rnd(0, w), y = G.floor + rnd(4, 30); f.strokeStyle = 'rgba(60,140,70,.9)'; f.lineWidth = 2.2; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k / 6 - 0.5) * 2.2; f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 26, x + Math.cos(a) * 34, y + Math.sin(a) * 30); f.stroke(); } }
    return { bg, fg };
  }
  if (key === 'reef') {
    g.fillStyle = grad(g, 0, h, [[0, '#2AA7D8'], [0.25, sky[0]], [1, sky[1]]]); g.fillRect(0, 0, w, h);
    ridge(g, w, h, G.floor - h * 0.05, h * 0.05, 'rgba(10,60,100,.45)', 4, 2);
    g.fillStyle = grad(g, G.floor - 20, h, [[0, '#C9BE93'], [1, '#8C8463']]); g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) g.lineTo(x, G.floor - 10 - 12 * noise(x / w * 6, 3)); g.lineTo(w, h); g.fill();
    const corals = ['#FF7A8A', '#FF9F5A', '#C77DFF', '#FFD166', '#F15BB5', '#7AE0C8'];
    for (let i = 0; i < 8; i++) { const x = rnd(0, w); branchCoral(g, x, G.floor - 6, h * rnd(0.05, 0.08), -Math.PI / 2 + rnd(-0.2, 0.2), 5, corals[i % corals.length]); }
    for (let i = 0; i < 5; i++) brainCoral(g, rnd(0, w), G.floor + rnd(0, 18), h * rnd(0.03, 0.05), ['#E9B872', '#C9A0DC', '#F28C8C'][i % 3]);
    for (let i = 0; i < 5; i++) fanCoral(f, rnd(0, w), h - rnd(10, 40), h * rnd(0.1, 0.16), ['rgba(199,125,255,.85)', 'rgba(255,122,138,.85)', 'rgba(255,209,102,.85)'][i % 3]);
    for (let i = 0; i < 5; i++) { const x = rnd(0, w); branchCoral(f, x, h - rnd(5, 20), h * rnd(0.06, 0.1), -Math.PI / 2 + rnd(-0.2, 0.2), 5, corals[(i + 2) % corals.length]); }
    return { bg, fg };
  }
  // open-air habitats: sky, scenery, then the ground
  g.fillStyle = grad(g, 0, G.hy, [[0, sky[0]], [1, sky[1]]]); g.fillRect(0, 0, w, G.hy + 2);
  if (B.stars) for (let i = 0; i < 220; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(0.2, 0.85).toFixed(2) + ')'; g.fillRect(rnd(0, w), rnd(0, G.hy * 0.7), rnd(0.8, 1.8), rnd(0.8, 1.8)); }
  if (key === 'savannah') sunDisc(g, w * 0.72, G.hy - h * 0.09, h * 0.07, 'rgba(255,236,170,.95)', 'rgba(255,190,90,.55)');
  if (key === 'desert') sunDisc(g, w * 0.78, h * 0.2, h * 0.06, 'rgba(255,250,220,1)', 'rgba(255,220,130,.6)');
  if (key === 'tundra') sunDisc(g, w * 0.25, G.hy - h * 0.06, h * 0.045, 'rgba(255,250,235,.95)', 'rgba(255,240,210,.45)');
  if (key === 'savannah') {
    ridge(g, w, h, G.hy + 2, h * 0.05, '#B97F5A', 2, 2);
    g.fillStyle = grad(g, G.hy, h, [[0, '#D9B36A'], [1, '#A87D38']]); g.fillRect(0, G.hy, w, h - G.hy);
    for (let i = 0; i < 4; i++) acacia(g, rnd(0.05, 0.95) * w, G.hy + rnd(2, 10), h * rnd(0.07, 0.11), '#4A3F22');
    for (let i = 0; i < 2; i++) acacia(g, rnd(0.1, 0.9) * w, G.hy + h * rnd(0.12, 0.2), h * rnd(0.17, 0.22), '#3A3218');
    for (let i = 0; i < w / 2.2; i++) { const x = rnd(0, w), y = h - rnd(0, (h - G.floor) + 30); f.strokeStyle = ['#C99A45', '#B38634', '#DDB45F'][i % 3]; f.lineWidth = 1.6; f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + rnd(-4, 4), y - 10, x + rnd(-8, 8), y - rnd(14, 30)); f.stroke(); }
  } else if (key === 'tundra') {
    ridge(g, w, h, G.hy + 2, h * 0.16, '#8FA6C4', 3, 2.5);
    ridge(g, w, h, G.hy + 2, h * 0.08, '#B9C9DE', 8, 3);
    g.fillStyle = grad(g, G.hy, h, [[0, '#E4ECF6'], [1, '#C9D6E6']]); g.fillRect(0, G.hy, w, h - G.hy);
    for (let i = 0; i < 40; i++) { g.fillStyle = ['rgba(120,110,70,.45)', 'rgba(90,120,70,.45)', 'rgba(150,120,90,.35)'][i % 3]; g.beginPath(); g.ellipse(rnd(0, w), rnd(G.hy + 10, h), rnd(10, 40), rnd(3, 9), 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 12; i++) { g.fillStyle = '#7D8794'; g.beginPath(); g.ellipse(rnd(0, w), rnd(G.hy + 20, h), rnd(6, 16), rnd(4, 9), 0, Math.PI, TAU); g.fill(); }
  } else if (key === 'desert') {
    for (let i = 0; i < 2; i++) palm(g, w * (0.08 + i * 0.05), G.hy + 2, h * 0.08, 'rgba(60,90,40,.85)');
    const dune = (base, amp, seed, light, dark) => { g.fillStyle = grad(g, base - amp, h, [[0, light], [1, dark]]); g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w + 8; x += 8) g.lineTo(x, base - amp * Math.pow(noise(x / w * 2.2 + seed, seed), 1.6)); g.lineTo(w, h); g.fill(); };
    dune(G.hy + 6, h * 0.08, 2, '#F0C27B', '#D9A55A');
    dune(G.hy + h * 0.12, h * 0.1, 6, '#E9B86B', '#C98F45');
    dune(G.hy + h * 0.24, h * 0.1, 11, '#EDBE72', '#D29A50');
    for (let i = 0; i < 10; i++) { g.fillStyle = '#9C7B54'; g.beginPath(); g.ellipse(rnd(0, w), rnd(G.hy + h * 0.15, h), rnd(5, 14), rnd(3, 7), 0, Math.PI, TAU); g.fill(); }
  } else if (key === 'polar') {
    for (let i = 0; i < 6; i++) iceberg(g, rnd(0, w), G.hy + 2, h * rnd(0.04, 0.09), '#E8F1FB');
    g.fillStyle = grad(g, G.hy, G.sea[1], [[0, '#2B4C7E'], [1, '#183258']]); g.fillRect(0, G.hy, w, G.sea[1] - G.hy + 2);
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(200,225,255,' + rnd(0.15, 0.45).toFixed(2) + ')'; g.fillRect(rnd(0, w), rnd(G.hy + 2, G.sea[1]), rnd(6, 20), 1.2); }
    g.fillStyle = '#A9C8E8'; g.fillRect(0, G.sea[1], w, 8);
    g.fillStyle = grad(g, G.sea[1] + 8, h, [[0, '#F4F8FD'], [1, '#D5E2F0']]); g.fillRect(0, G.sea[1] + 8, w, h - G.sea[1]);
    g.strokeStyle = 'rgba(120,160,210,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { let x = rnd(0, w), y = rnd(G.sea[1] + 20, h); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rnd(-30, 30); y += rnd(4, 14); g.lineTo(x, y); } g.stroke(); }
    // the Arctic on the left, Antarctica on the right
    g.save(); g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h * 0.14); g.lineTo(w / 2, h); g.stroke(); g.restore();
  }
  if (key === 'tundra') for (let i = 0; i < 5; i++) pine(f, rnd(0, w), h - rnd(0, 30), h * rnd(0.08, 0.12), 'rgba(40,70,60,.8)');
  return { bg, fg };
}

/* ---------------- moving things ---------------- */
function particles(kind, w, h) {
  const n = { rain: view.small ? 120 : 220, snow: view.small ? 110 : 200, dust: 70, sand: view.small ? 80 : 150, bubbles: 50 }[kind] || 0;
  return Array.from({ length: n }, () => ({ x: rnd(0, w), y: kind === 'sand' ? rnd(h * 0.55, h) : rnd(0, h), s: rnd(0.5, 1.5), v: rnd(0.6, 1.4), p: rnd(0, TAU) }));
}

export function makeBiome(key) {
  const B = BIOMES[key];
  return {
    id: key, B, lang: 'en',
    init(w, h) { this.w = w; this.h = h; this.layers = null; this.sel = null; this.selT = 0; this.hover = null; this.t = 0; this.spawn(); this.parts = particles(B.particles, w, h); },
    resize(w, h) {
      const sx = w / this.w, sy = h / this.h;
      this.w = w; this.h = h; this.layers = null; this.parts = particles(B.particles, w, h);
      this.animals.forEach((a) => { a.x *= sx; a.base *= sy; a.y *= sy; a.lo *= sx; a.hi *= sx; });
      this.size();
    },
    setLang(l) { this.lang = l === 'ms' ? 'ms' : 'en'; },
    S() { return clamp(Math.min(this.w, this.h) * 0.085, 30, 84); },
    size() {
      const S = this.S(), G = geom(key, this.w, this.h);
      this.animals.forEach((a) => { a.px = G.sea && a.d.move === 'swim' ? (G.sea[1] - G.sea[0]) * 1.5 : S * (SIZE[a.d.e] || 1) * a.k; });
    },
    spawn() {
      const w = this.w, h = this.h, G = geom(key, w, h), out = [];
      B.animals.forEach((d) => {
        const n = d.name === 'Reef fish' ? 5 : COUNT[d.move] || 1;
        const zone = d.zone == null || !B.zones ? [0.03, 0.97] : d.zone === 0 ? [0.04, 0.46] : [0.54, 0.96];
        const dir = Math.random() < 0.5 ? -1 : 1, herdX = rnd(zone[0] + 0.1, zone[1] - 0.1) * w;
        for (let i = 0; i < n; i++) {
          let band = G.walk, z = Math.random();
          if (key === 'rainforest' && B.layers) { const ly = B.layers[d.layer || 0].y * h; band = d.layer === 3 ? [G.floor - 14, G.floor] : [ly - h * 0.03, ly + h * 0.03]; }
          else if (['fly', 'flutter'].includes(d.move)) band = G.fly;
          else if (d.move === 'swim') band = G.sea || G.fly;
          const y = G.sea && d.move === 'swim' ? (G.sea[0] + G.sea[1]) / 2 : band[0] + (band[1] - band[0]) * z;
          const a = { d, i, z, k: (G.sea && d.move === 'swim' ? 0.7 : 0.78 + 0.4 * z), lo: zone[0] * w, hi: zone[1] * w, base: y, y,
            x: d.move === 'herd' ? herdX + (i - n / 2) * this.S() * 1.1 * (1 + Math.random() * 0.4) : rnd(zone[0], zone[1]) * w,
            dir: d.move === 'herd' ? dir : (Math.random() < 0.5 ? -1 : 1), sp: rnd(0.7, 1.15), ph: rnd(0, TAU), rest: 0, rot: 0, glide: 0 };
          out.push(a);
        }
      });
      this.animals = out;
      this.size();
    },
    pickAnimal(x, y) {
      let best = null, bd = 1e9;
      this.animals.forEach((a) => { const d = Math.hypot(a.x - x, a.y - y); if (d < a.px * 0.62 && d < bd) { bd = d; best = a; } });
      return best;
    },
    labels() {   // the rainforest's layer names, down the left side
      if (key !== 'rainforest' || !B.layers) return [];
      const G = geom(key, this.w, this.h), fs = view.small ? 12 : 14.5;
      return B.layers.map((L, i) => ({ L, i, x: 14, y: (i === 3 ? G.floor - 34 : L.y * this.h) - 14, w: 0, h: fs + 14, fs }));
    },
    pointer(x, y) { const a = this.pickAnimal(x, y); this.hover = a; },
    click(x, y) {
      const ms = this.lang === 'ms';
      const lab = this.labels().find((l) => x >= l.x && x <= l.x + ((this.labW || [])[l.i] || 160) && y >= l.y && y <= l.y + l.h);
      if (lab) return { card: { title: ms ? lab.L.bm : lab.L.name, sub: ms ? B.bmName : B.name, text: ms ? lab.L.textBm : lab.L.text, e: ['🌳', '🌿', '🍃', '🍂'][lab.i], lang: this.lang } };
      const a = this.pickAnimal(x, y);
      if (!a) return null;
      this.sel = a; this.selT = 6; a.rest = Math.max(a.rest, 4);
      return { card: { title: ms && a.d.bm ? a.d.bm : a.d.name, sub: ms && B.bmName ? B.bmName : B.name, text: ms && a.d.textBm ? a.d.textBm : a.d.text, wiki: a.d.wiki, e: a.d.e, lang: this.lang } };
    },
    step(dt, t) {
      const w = this.w, h = this.h, S = this.S(), G = geom(key, w, h);
      this.t = t; this.selT -= dt;
      if (this.selT <= 0) this.sel = null;
      this.animals.forEach((a) => {
        const m = a.d.move, v = S * 0.55 * a.sp * (0.6 + 0.4 * a.z);
        a.ph += dt * (m === 'flutter' ? 9 : m === 'fly' ? 3 : 5) * a.sp;
        if (a.rest > 0) { a.rest -= dt; if (!['fly', 'flutter', 'swim'].includes(m)) { a.y = a.base; a.rot = 0; return; } }
        else if (['walk', 'hop', 'waddle', 'herd', 'swing'].includes(m) && Math.random() < dt * 0.06) a.rest = rnd(1.5, 4);
        if (m === 'still') { a.y = a.base; if (Math.random() < dt * 0.05) a.dir *= -1; return; }
        if (m === 'glide') {               // up in the canopy, then a long glide down, then climb back
          a.glide += dt;
          const cyc = a.glide % 9;
          if (cyc < 3) { a.y = a.base; a.rot = 0; }
          else if (cyc < 6) { const k = (cyc - 3) / 3; a.x += a.dir * v * 2.2 * dt; a.y = a.base + k * h * 0.2; a.rot = a.dir * 0.35; }
          else { const k = (cyc - 6) / 3; a.y = a.base + (1 - k) * h * 0.2; a.rot = 0; }
          if (a.x < a.lo || a.x > a.hi) a.dir *= -1;
          return;
        }
        const speed = m === 'fly' ? v * 2.2 : m === 'flutter' ? v * 0.9 : m === 'swim' ? v * (a.d.e === '🐋' ? 0.6 : 1.1) : m === 'waddle' ? v * 0.45 : m === 'hop' ? (Math.sin(a.ph) > 0 ? v * 1.6 : 0) : v;
        a.x += a.dir * speed * dt;
        if (m === 'fly') { a.y = a.base + Math.sin(a.ph) * S * 0.5; if (a.x < a.lo - 80) a.x = a.hi + 60; if (a.x > a.hi + 80) a.x = a.lo - 60; }
        else if (m === 'flutter') { a.y = a.base + Math.sin(a.ph * 0.37) * S * 0.6 + (noise(a.ph * 0.2, a.i) - 0.5) * S * 0.8; a.x += (noise(a.i, a.ph * 0.15) - 0.5) * S * 2 * dt; if (Math.random() < dt * 0.3) a.dir *= -1; }
        else if (m === 'swim') a.y = a.base + Math.sin(a.ph * 0.5) * S * 0.25;
        else if (m === 'swing') { a.y = a.base + (1 - Math.abs(Math.sin(a.ph * 0.6))) * S * 0.55; a.rot = Math.cos(a.ph * 0.6) * 0.25; }
        else if (m === 'hop') a.y = a.base - Math.max(0, Math.sin(a.ph)) * S * 0.45;
        else if (m === 'waddle') { a.y = a.base - Math.abs(Math.sin(a.ph * 1.4)) * 2; a.rot = Math.sin(a.ph * 1.4) * 0.12; }
        else a.y = a.base - Math.abs(Math.sin(a.ph * 1.2)) * S * 0.04;
        if (m !== 'fly' && (a.x < a.lo || a.x > a.hi)) { a.dir = a.x < a.lo ? 1 : -1; a.x = clamp(a.x, a.lo, a.hi); }
      });
      // rain, snow, dust, sand and bubbles
      const P = this.parts, k = B.particles;
      P.forEach((p) => {
        if (k === 'rain') { p.y += 900 * p.v * dt; p.x -= 120 * p.v * dt; }
        else if (k === 'snow') { p.y += 40 * p.v * dt; p.x += (noise(p.p, t * 0.3) - 0.5) * 60 * dt + 10 * dt; }
        else if (k === 'dust') { p.y += Math.sin(t * 0.5 + p.p) * 6 * dt; p.x += 8 * p.v * dt; }
        else if (k === 'sand') { p.x += 420 * p.v * dt; p.y += Math.sin(t * 3 + p.p) * 20 * dt; }
        else if (k === 'bubbles') { p.y -= 50 * p.v * dt; p.x += Math.sin(t * 2 + p.p) * 14 * dt; }
        if (p.y > h) { p.y = -10; p.x = rnd(0, w); } if (p.y < -12) { p.y = h + 8; p.x = rnd(0, w); }
        if (p.x > w + 20) { p.x = -20; if (k === 'sand') p.y = rnd(G.hy, h); } if (p.x < -20) p.x = w + 20;
      });
    },
    drawParticles(ctx, w, h) {
      const k = B.particles;
      ctx.save();
      if (k === 'rain') { ctx.strokeStyle = 'rgba(200,225,255,.28)'; ctx.lineWidth = 1; ctx.beginPath(); this.parts.forEach((p) => { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3 * p.v, p.y + 16 * p.v); }); ctx.stroke(); }
      else if (k === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.85)'; this.parts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + p.s * 1.4, 0, TAU); ctx.fill(); }); }
      else if (k === 'dust') { ctx.fillStyle = 'rgba(255,240,200,.35)'; this.parts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 1.6, 0, TAU); ctx.fill(); }); }
      else if (k === 'sand') { ctx.strokeStyle = 'rgba(255,230,180,.35)'; ctx.lineWidth = 1; ctx.beginPath(); this.parts.forEach((p) => { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 14 * p.v, p.y); }); ctx.stroke(); }
      else if (k === 'bubbles') { ctx.strokeStyle = 'rgba(220,245,255,.55)'; ctx.lineWidth = 1.2; this.parts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 2 + p.s * 2.5, 0, TAU); ctx.stroke(); }); }
      ctx.restore();
    },
    draw(ctx, w, h, t) {
      if (!this.layers) this.layers = paint(key, B, w, h);
      ctx.drawImage(this.layers.bg, 0, 0, w, h);
      const G = geom(key, w, h), ms = this.lang === 'ms';
      if (key === 'reef' || key === 'rainforest') {   // sunbeams
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const x = w * (0.1 + i * 0.2) + Math.sin(t * 0.2 + i) * 30, a = 0.05 + 0.03 * Math.sin(t * 0.7 + i * 2);
          const gr = ctx.createLinearGradient(x, 0, x + w * 0.1, h * 0.8); gr.addColorStop(0, 'rgba(255,255,220,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,220,0)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w * 0.05, 0); ctx.lineTo(x + w * 0.16, h * 0.8); ctx.lineTo(x + w * 0.08, h * 0.8); ctx.fill();
        }
        ctx.restore();
      }
      if (key === 'reef') {               // swaying seaweed
        ctx.save(); ctx.strokeStyle = 'rgba(60,170,110,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const x0 = w * (0.05 + i * 0.11), y0 = G.floor + 8, L = h * (0.16 + 0.05 * (i % 3));
          ctx.beginPath(); ctx.moveTo(x0, y0);
          for (let s = 1; s <= 8; s++) { const k = s / 8; ctx.lineTo(x0 + Math.sin(t * 1.1 + i + k * 3) * 14 * k, y0 - L * k); }
          ctx.stroke();
        }
        ctx.restore();
      }
      if (B.zones) {                      // which side is which
        ctx.save(); ctx.font = '800 ' + (view.small ? 12 : 15) + 'px ' + FONT; ctx.textAlign = 'center';
        B.zones.forEach((z, i) => { const x = w * (i ? 0.75 : 0.25), y = Math.max(h * 0.14, view.top + 32), tw = ctx.measureText(z).width + 22; ctx.fillStyle = 'rgba(8,16,36,.6)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - tw / 2, y - 16, tw, 30, 15); else ctx.rect(x - tw / 2, y - 16, tw, 30); ctx.fill(); ctx.fillStyle = '#EAF2FF'; ctx.fillText(z, x, y + 5); });
        ctx.restore();
      }
      const list = this.animals.slice().sort((a, b) => (a.d.move === 'swim' && G.sea ? -1 : 0) - (b.d.move === 'swim' && G.sea ? -1 : 0) || a.y - b.y);
      list.forEach((a) => {
        if (a.d.move === 'swim' && G.sea) {   // a whale in the sea between the ice: only the top shows, and a spout now and then
          ctx.save(); ctx.beginPath(); ctx.rect(0, G.sea[0], w, G.sea[1] - G.sea[0] + 2); ctx.clip();
          drawCreature(ctx, creatureOf(a.d), a.x, a.y + a.px * 0.1, a.px * 0.5, { flip: a.dir < 0, ph: a.ph, t, rest: false });
          ctx.restore();
          const sp = (t + a.i * 3) % 7;
          if (sp < 1.2) { ctx.save(); ctx.fillStyle = 'rgba(235,245,255,' + (0.8 * (1 - sp / 1.2)).toFixed(2) + ')'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(a.x + rnd(-6, 6), a.y - a.px * 0.2 - sp * 40 * (k / 8), 3 + k * 0.6, 0, TAU); ctx.fill(); } ctx.restore(); }
          return;
        }
        if (a.y > G.hy && !['fly', 'flutter', 'swim'].includes(a.d.move) && key !== 'reef') {   // a soft shadow underneath
          ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(a.x, a.base + a.px * 0.42, a.px * 0.38, a.px * 0.08, 0, 0, TAU); ctx.fill();
        }
        const on = this.sel === a, hov = this.hover === a;
        if (on) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(a.x, a.y, a.px * 0.62 + Math.sin(t * 5) * 2, 0, TAU); ctx.stroke(); }
        const sy = a.d.move === 'flutter' ? 0.6 + 0.4 * Math.abs(Math.sin(a.ph * 2)) : a.d.move === 'still' ? 1 + Math.sin(t * 1.6 + a.i) * 0.025 : 1;
        const ck = creatureOf(a.d);
        drawCreature(ctx, ck, a.x, a.y, a.px * (FIT[ck] || 1), { flip: a.dir < 0, rot: a.rot, tint: a.d.tint, sy, ph: a.ph, t, rest: a.rest > 0 || a.d.move === 'still', glide: a.d.move === 'glide' && a.rot !== 0 });
        if (on || hov) {
          const name = ms && a.d.bm ? a.d.bm : a.d.name;
          ctx.font = '800 ' + (view.small ? 12 : 14) + 'px ' + FONT; ctx.textAlign = 'center';
          const tw = ctx.measureText(name).width + 18, y = a.y - a.px * 0.66 - 18;
          ctx.fillStyle = 'rgba(8,12,24,.72)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(a.x - tw / 2, y - 14, tw, 26, 13); else ctx.rect(a.x - tw / 2, y - 14, tw, 26); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText(name, a.x, y + 4); ctx.textAlign = 'left';
        }
      });
      ctx.drawImage(this.layers.fg, 0, 0, w, h);
      this.drawParticles(ctx, w, h);
      if (B.fog) { const fg = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.74); fg.addColorStop(0, 'rgba(210,235,220,0)'); fg.addColorStop(0.5, B.fog); fg.addColorStop(1, 'rgba(210,235,220,0)'); ctx.fillStyle = fg; ctx.fillRect(0, h * 0.38, w, h * 0.36); }
      // the rainforest's layers
      this.labels().forEach((l) => {
        ctx.font = '800 ' + l.fs + 'px ' + FONT;
        const txt = (ms ? l.L.bm : l.L.name), tw = ctx.measureText(txt).width + 22;
        (this.labW || (this.labW = []))[l.i] = tw;
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l.x + tw, l.y + l.h / 2); ctx.lineTo(Math.min(w * 0.3, l.x + tw + 120), l.y + l.h / 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(6,24,16,.72)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(l.x, l.y, tw, l.h, l.h / 2); else ctx.rect(l.x, l.y, tw, l.h); ctx.fill();
        ctx.strokeStyle = 'rgba(170,240,190,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#E8FFF0'; ctx.fillText(txt, l.x + 11, l.y + l.h / 2 + l.fs * 0.36);
      });
    }
  };
}
export const BIOME_KEYS = Object.keys(BIOMES);
