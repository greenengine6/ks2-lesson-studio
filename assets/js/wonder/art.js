/* Drawn pictures for the Wonder Window, in place of emoji: each window's picture on the picker, the flags of the World
   Explorer's 24 cities, and the small signs on its postcard. They are drawn with the canvas in the same lit, shaded
   style as the scenes (the globe uses the real Earth picture the map uses), and cached once drawn. */
import { TAU } from './util.js?v=cdc164df';
import { tint, seeded } from './scenery.js?v=cdc164df';
import { drawCreature } from './fauna.js?v=cdc164df';
import { lin, rad, E, C, P, rgba, giantTree } from './mydraw.js?v=cdc164df';

const DPR = () => Math.min(2, window.devicePixelRatio || 1);
function star(g, x, y, r, n, ri, rot) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (rot == null ? -Math.PI / 2 : rot) + i * Math.PI / n, rr = i % 2 ? r * (ri == null ? 0.4 : ri) : r; if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
const bands = (g, w, h, cols, vertical, parts) => { const tot = (parts || cols.map(() => 1)).reduce((a, b) => a + b, 0); let at = 0; cols.forEach((c, i) => { const p = (parts ? parts[i] : 1) / tot; g.fillStyle = c; if (vertical) g.fillRect(at * w - 0.5, 0, p * w + 1, h); else g.fillRect(0, at * h - 0.5, w, p * h + 1); at += p; }); };

/* ================= flags ================= */
function unionJack(g, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#012169'; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2, arms = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const arm = (dx, dy, wd, off, col) => {                                         // a band from the middle out to a corner
    const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o1 = off - wd / 2, o2 = off + wd / 2;
    g.fillStyle = col; P(g, [[cx + nx * o1, cy + ny * o1], [cx + ux * L * 1.3 + nx * o1, cy + uy * L * 1.3 + ny * o1], [cx + ux * L * 1.3 + nx * o2, cy + uy * L * 1.3 + ny * o2], [cx + nx * o2, cy + ny * o2]]);
  };
  arms.forEach(([dx, dy]) => arm(dx, dy, h * 0.2, 0, '#FFFFFF'));
  arms.forEach(([dx, dy]) => arm(dx, dy, h * 0.067, -h * 0.033, '#C8102E'));       // the red saltire, counterchanged
  g.fillStyle = '#FFFFFF'; g.fillRect(cx - h / 6, y, h / 3, h); g.fillRect(x, cy - h / 6, w, h / 3);
  g.fillStyle = '#C8102E'; g.fillRect(cx - h / 10, y, h / 5, h); g.fillRect(x, cy - h / 10, w, h / 5);
  g.restore();
}
function crescent(g, x, y, r, off, ri, col, bg) { g.fillStyle = col; C(g, x, y, r); g.fillStyle = bg; C(g, x + off, y, r * ri); }
const FLAGS = {
  MY(g, w, h) {                                                                   // the Jalur Gemilang
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#CC0001'; g.fillRect(0, i * h / 14, w, h / 14 + 0.6); }
    const cw = w / 2, ch = h * 8 / 14, r = ch * 0.36, cx = cw * 0.37, cy = ch / 2;
    g.fillStyle = '#010066'; g.fillRect(0, 0, cw, ch);
    crescent(g, cx, cy, r, r * 0.3, 0.82, '#FFCC00', '#010066');
    g.fillStyle = '#FFCC00'; star(g, cx + r * 1.12, cy, r * 0.66, 14, 0.42);
  },
  GB(g, w, h) { unionJack(g, 0, 0, w, h); },
  FR(g, w, h) { bands(g, w, h, ['#0055A4', '#FFFFFF', '#EF4135'], true); },
  IT(g, w, h) { bands(g, w, h, ['#009246', '#FFFFFF', '#CE2B37'], true); },
  EG(g, w, h) {
    bands(g, w, h, ['#CE1126', '#FFFFFF', '#000000']);
    const x = w / 2, y = h / 2; g.fillStyle = '#C09300';                         // the golden eagle of Saladin
    P(g, [[x - h * 0.2, y - h * 0.08], [x - h * 0.05, y - h * 0.02], [x, y - h * 0.12], [x + h * 0.05, y - h * 0.02], [x + h * 0.2, y - h * 0.08], [x + h * 0.08, y + h * 0.1], [x, y + h * 0.13], [x - h * 0.08, y + h * 0.1]]);
    g.fillStyle = '#FFFFFF'; g.fillRect(x - h * 0.035, y - h * 0.02, h * 0.07, h * 0.08);
  },
  KE(g, w, h) {
    bands(g, w, h, ['#000000', '#FFFFFF', '#BB0000', '#FFFFFF', '#006600'], false, [6, 1, 6, 1, 6]);
    const x = w / 2, y = h / 2;
    g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(0.6, h * 0.03); g.lineCap = 'round';
    [[-1, 1], [1, 1]].forEach(([a]) => { g.beginPath(); g.moveTo(x - a * h * 0.24, y + h * 0.36); g.lineTo(x + a * h * 0.24, y - h * 0.36); g.stroke(); });   // the two spears
    g.fillStyle = '#000000'; E(g, x, y, h * 0.15, h * 0.33);                      // the Maasai shield
    g.fillStyle = '#BB0000'; E(g, x, y, h * 0.09, h * 0.33);
    g.fillStyle = '#FFFFFF'; E(g, x, y, h * 0.025, h * 0.07); E(g, x, y - h * 0.18, h * 0.02, h * 0.05); E(g, x, y + h * 0.18, h * 0.02, h * 0.05);
  },
  ZA(g, w, h) {
    g.fillStyle = '#E03C31'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#001489'; g.fillRect(0, h / 2, w, h / 2);
    const jx = w * 0.4, path = () => { g.beginPath(); g.moveTo(-h * 0.1, -h * 0.07); g.lineTo(jx, h / 2); g.lineTo(-h * 0.1, h * 1.07); g.moveTo(jx, h / 2); g.lineTo(w + 2, h / 2); };
    g.lineJoin = 'miter'; g.strokeStyle = '#FFFFFF'; g.lineWidth = h / 3; path(); g.stroke();
    g.strokeStyle = '#007749'; g.lineWidth = h / 5; path(); g.stroke();
    g.fillStyle = '#FFB81C'; P(g, [[0, h * 0.13], [w * 0.31, h / 2], [0, h * 0.87]]);
    g.fillStyle = '#000000'; P(g, [[0, h * 0.21], [w * 0.24, h / 2], [0, h * 0.79]]);
  },
  NG(g, w, h) { bands(g, w, h, ['#008751', '#FFFFFF', '#008751'], true); },
  IN(g, w, h) {
    bands(g, w, h, ['#FF9933', '#FFFFFF', '#138808']);
    const x = w / 2, y = h / 2, r = h * 0.14; g.strokeStyle = '#000080'; g.lineWidth = Math.max(0.5, h * 0.022); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();   // the Ashoka Chakra
    g.lineWidth = Math.max(0.3, h * 0.008); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    g.fillStyle = '#000080'; C(g, x, y, r * 0.18);
  },
  CN(g, w, h) {
    g.fillStyle = '#DE2910'; g.fillRect(0, 0, w, h);
    const bx = w * 0.167, by = h * 0.25; g.fillStyle = '#FFDE00'; star(g, bx, by, h * 0.15, 5, 0.38);
    [[0.333, 0.1], [0.4, 0.2], [0.4, 0.35], [0.333, 0.45]].forEach(([u, v]) => { const x = w * u, y = h * v; star(g, x, y, h * 0.05, 5, 0.38, Math.atan2(by - y, bx - x)); });
  },
  JP(g, w, h) { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#BC002D'; C(g, w / 2, h / 2, h * 0.3); },
  KR(g, w, h) {
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
    const r = h / 4, ang = Math.atan2(2, 3);
    g.save(); g.translate(w / 2, h / 2); g.rotate(ang);                          // the taegeuk
    g.fillStyle = '#CD2E3A'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill(); g.fillStyle = '#0047A0'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
    g.fillStyle = '#CD2E3A'; C(g, -r / 2, 0, r / 2); g.fillStyle = '#0047A0'; C(g, r / 2, 0, r / 2);
    g.restore();
    g.fillStyle = '#000000';                                                       // the four trigrams
    [[-1, -1, [1, 1, 1]], [1, 1, [0, 0, 0]], [1, -1, [1, 0, 1]], [-1, 1, [0, 1, 0]]].forEach(([sx, sy, bars]) => {
      g.save(); g.translate(w / 2 + sx * w * 0.31, h / 2 + sy * h * 0.31); g.rotate(sx * sy * -ang);
      bars.forEach((solid, i) => { const yy = (i - 1) * h * 0.055; if (solid) g.fillRect(-h * 0.085, yy - h * 0.018, h * 0.17, h * 0.036); else { g.fillRect(-h * 0.085, yy - h * 0.018, h * 0.07, h * 0.036); g.fillRect(h * 0.015, yy - h * 0.018, h * 0.07, h * 0.036); } });
      g.restore();
    });
  },
  TH(g, w, h) { bands(g, w, h, ['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], false, [1, 1, 2, 1, 1]); },
  SG(g, w, h) {
    g.fillStyle = '#EF3340'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#FFFFFF'; g.fillRect(0, h / 2, w, h / 2);
    crescent(g, w * 0.2, h * 0.25, h * 0.15, h * 0.05, 0.86, '#FFFFFF', '#EF3340');
    g.fillStyle = '#FFFFFF'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; star(g, w * 0.3 + Math.cos(a) * h * 0.075, h * 0.25 + Math.sin(a) * h * 0.075, h * 0.03, 5, 0.4); }
  },
  ID(g, w, h) { bands(g, w, h, ['#CE1126', '#FFFFFF']); },
  AU(g, w, h) {
    g.fillStyle = '#012169'; g.fillRect(0, 0, w, h); unionJack(g, 0, 0, w / 2, h / 2);
    g.fillStyle = '#FFFFFF'; star(g, w / 4, h * 0.75, h * 0.14, 7, 0.45);
    [[0.75, 0.83, 0.07], [0.62, 0.47, 0.07], [0.75, 0.17, 0.07], [0.87, 0.39, 0.07]].forEach(([u, v, r]) => star(g, w * u, h * v, h * r, 7, 0.45));
    star(g, w * 0.81, h * 0.56, h * 0.035, 5, 0.45);
  },
  NZ(g, w, h) {
    g.fillStyle = '#012169'; g.fillRect(0, 0, w, h); unionJack(g, 0, 0, w / 2, h / 2);
    [[0.75, 0.8, 0.075], [0.64, 0.45, 0.065], [0.75, 0.2, 0.065], [0.86, 0.4, 0.06]].forEach(([u, v, r]) => { g.fillStyle = '#FFFFFF'; star(g, w * u, h * v, h * r * 1.25, 5, 0.42); g.fillStyle = '#C8102E'; star(g, w * u, h * v, h * r, 5, 0.42); });
  },
  US(g, w, h) {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#B22234'; g.fillRect(0, i * h / 13, w, h / 13 + 0.6); }
    const cw = w * 0.4, ch = h * 7 / 13; g.fillStyle = '#3C3B6E'; g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#FFFFFF'; for (let r = 0; r < 9; r++) { const n = r % 2 ? 5 : 6; for (let c = 0; c < n; c++) C(g, cw * ((c + (r % 2 ? 1 : 0.5)) / 6), ch * ((r + 0.5) / 9), Math.max(0.35, h * 0.016)); }
  },
  MX(g, w, h) {
    bands(g, w, h, ['#006847', '#FFFFFF', '#CE1126'], true);
    const x = w / 2, y = h / 2;                                                    // the eagle on its cactus, in a wreath
    g.strokeStyle = '#4E7A2A'; g.lineWidth = Math.max(0.5, h * 0.03); g.beginPath(); g.arc(x, y, h * 0.17, 0.3, Math.PI - 0.3); g.stroke();
    g.fillStyle = '#7A4A1E'; E(g, x, y - h * 0.02, h * 0.07, h * 0.1); E(g, x + h * 0.06, y - h * 0.11, h * 0.035, h * 0.03);
    g.fillStyle = '#5E3A16'; P(g, [[x - h * 0.06, y - h * 0.06], [x - h * 0.16, y - h * 0.14], [x - h * 0.1, y + h * 0.02]]);
    g.fillStyle = '#4E8A2A'; E(g, x, y + h * 0.1, h * 0.06, h * 0.03);
  },
  BR(g, w, h) {
    g.fillStyle = '#009C3B'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFDF00'; P(g, [[w * 0.085, h / 2], [w / 2, h * 0.11], [w * 0.915, h / 2], [w / 2, h * 0.89]]);
    const x = w / 2, y = h / 2, r = h * 0.26; g.fillStyle = '#002776'; C(g, x, y, r);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(0.6, h * 0.05); g.beginPath(); g.arc(x - r * 0.5, y + r * 2.1, r * 2.5, -Math.PI * 0.63, -Math.PI * 0.27); g.stroke();
    g.fillStyle = '#FFFFFF'; [[0.2, 0.35], [-0.3, 0.45], [0.05, 0.6], [0.45, 0.4], [-0.1, 0.25], [0.3, 0.7]].forEach(([u, v]) => C(g, x + u * r, y + v * r * 0.9, Math.max(0.3, h * 0.012)));
    g.restore();
  },
  PE(g, w, h) { bands(g, w, h, ['#D91023', '#FFFFFF', '#D91023'], true); },
  IS(g, w, h) {
    g.fillStyle = '#02529C'; g.fillRect(0, 0, w, h);
    const cx = w * 0.36; g.fillStyle = '#FFFFFF'; g.fillRect(cx - h * 0.111, 0, h * 0.222, h); g.fillRect(0, h / 2 - h * 0.111, w, h * 0.222);
    g.fillStyle = '#DC1E35'; g.fillRect(cx - h * 0.056, 0, h * 0.111, h); g.fillRect(0, h / 2 - h * 0.056, w, h * 0.111);
  },
  AE(g, w, h) { g.save(); g.translate(w / 4, 0); bands(g, w * 0.75, h, ['#00732F', '#FFFFFF', '#000000']); g.restore(); g.fillStyle = '#FF0000'; g.fillRect(0, 0, w / 4, h); },
  TR(g, w, h) {
    g.fillStyle = '#E30A17'; g.fillRect(0, 0, w, h);
    crescent(g, w * 0.36, h / 2, h / 4, h * 0.0625, 0.8, '#FFFFFF', '#E30A17');
    g.fillStyle = '#FFFFFF'; star(g, w * 0.53, h / 2, h * 0.125, 5, 0.38, Math.PI);
  }
};
/* The two letters of a country from its flag emoji (the flag of Malaysia gives MY). */
export const isoOf = (f) => Array.from(f || '').map((ch) => String.fromCharCode(ch.codePointAt(0) - 0x1F1E6 + 65)).join('');
/* Draw a flag (by its letters or its emoji) in the box x, y, w, h, with soft corners and a little shine. */
export function drawFlag(g, code, x, y, w, h) {
  const fn = FLAGS[code] || FLAGS[isoOf(code)];
  if (!fn) return false;
  const r = Math.min(h * 0.16, 4);
  g.save(); g.translate(x, y);
  g.beginPath(); if (g.roundRect) g.roundRect(0, 0, w, h, r); else g.rect(0, 0, w, h); g.clip();
  fn(g, w, h);
  g.fillStyle = lin(g, 0, 0, w, h, [[0, 'rgba(255,255,255,.22)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.14)']]); g.fillRect(0, 0, w, h);
  g.restore();
  g.save(); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.beginPath(); if (g.roundRect) g.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r); else g.rect(x + 0.5, y + 0.5, w - 1, h - 1); g.stroke(); g.restore();
  return true;
}
const flagCache = new Map();
/* A flag as a little canvas for the page, w × h CSS pixels. */
export function flagCanvas(code, w, h) {
  const d = DPR(), key = code + w + 'x' + h + d;
  let src = flagCache.get(key);
  if (!src) { src = document.createElement('canvas'); src.width = Math.round(w * d); src.height = Math.round(h * d); const g = src.getContext('2d'); g.scale(d, d); drawFlag(g, code, 0, 0, w, h); flagCache.set(key, src); }
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.style.width = w + 'px'; c.style.height = h + 'px';
  c.getContext('2d').drawImage(src, 0, 0); c.setAttribute('aria-hidden', 'true'); c.className = 'flag-pic';
  return c;
}

/* ================= the Earth, from the map's own picture of it ================= */
let earth = null, earthP = null;
function loadEarth() {
  if (!earthP) earthP = new Promise((res) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { try { const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0, W, H); earth = { W, H, d: g.getImageData(0, 0, W, H).data }; } catch (e) { earth = null; } res(earth); };
    im.onerror = () => res(null);
    im.src = 'assets/earth/day-2k.jpg';
  });
  return earthP;
}
/* The globe seen from space, centred on lon0, lat0, lit from the direction (lx, ly) on the screen. tilt: the axis
   leaning (radians). night: how dark the side away from the Sun is. */
function globe(g, x, y, r, o) {
  o = o || {};
  const lon0 = (o.lon == null ? 100 : o.lon) * Math.PI / 180, lat0 = (o.lat == null ? 12 : o.lat) * Math.PI / 180, tilt = o.tilt || 0, night = o.night == null ? 0.45 : o.night;
  const L = [o.lx == null ? -0.55 : o.lx, o.ly == null ? -0.45 : o.ly, 0.7], ln = Math.hypot(L[0], L[1], L[2]), lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
  const n = Math.max(8, Math.ceil(r * 2)), im = g.createImageData(n, n), a = im.data, sl = Math.sin(lat0), cl = Math.cos(lat0), ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let px = (i + 0.5) / n * 2 - 1, py = (j + 0.5) / n * 2 - 1;
    const rr = px * px + py * py; if (rr > 1) continue;
    const pz = Math.sqrt(1 - rr), sh = Math.max(0, px * lx + py * ly + pz * lz);
    const qx = px * ct + py * st, qy = -px * st + py * ct;                         // undo the tilt to find the place
    const Y = -qy * cl + pz * sl, Z = qy * sl + pz * cl, lat = Math.asin(Math.max(-1, Math.min(1, Y))), lon = lon0 + Math.atan2(qx, Z);
    let R0 = 40, G0 = 90, B0 = 160;
    if (earth) { const u = ((lon / TAU + 0.5) % 1 + 1) % 1, v = 0.5 - lat / Math.PI, k = (Math.min(earth.H - 1, Math.floor(v * earth.H)) * earth.W + Math.floor(u * earth.W)) * 4; R0 = earth.d[k]; G0 = earth.d[k + 1]; B0 = earth.d[k + 2]; }
    const lit = night + (1 - night) * Math.pow(sh, 0.8) + (1 - pz) * 0.12, k4 = (j * n + i) * 4, edge = Math.min(1, (1 - Math.sqrt(rr)) * n * 0.5);
    a[k4] = Math.min(255, R0 * lit + 30 * (1 - pz)); a[k4 + 1] = Math.min(255, G0 * lit + 50 * (1 - pz)); a[k4 + 2] = Math.min(255, B0 * lit + 90 * (1 - pz)); a[k4 + 3] = 255 * edge;
  }
  const c = document.createElement('canvas'); c.width = n; c.height = n; c.getContext('2d').putImageData(im, 0, 0);
  g.fillStyle = rad(g, x, y, r * 0.9, r * 1.18, [[0, 'rgba(120,180,255,.55)'], [1, 'rgba(120,180,255,0)']]); C(g, x, y, r * 1.18);   // the thin blue air round it
  g.drawImage(c, x - r, y - r, r * 2, r * 2);
  g.fillStyle = rad(g, x + lx * r * 0.45, y + ly * r * 0.45, 0, r * 0.7, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); C(g, x, y, r);
}

/* ================= the windows' pictures ================= */
const plane = (g, x, y, s, a) => {                                               // a small airliner seen from above
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#FFFFFF';
  E(g, 0, 0, s * 0.5, s * 0.075); P(g, [[s * 0.16, 0], [-s * 0.06, -s * 0.48], [-s * 0.17, -s * 0.48], [-s * 0.04, 0], [-s * 0.17, s * 0.48], [-s * 0.06, s * 0.48]]);   // swept-back wings
  P(g, [[-s * 0.34, 0], [-s * 0.45, -s * 0.19], [-s * 0.51, -s * 0.19], [-s * 0.45, 0], [-s * 0.51, s * 0.19], [-s * 0.45, s * 0.19]]);
  g.restore();
};
const ICONS = {
  explorer(g, s) {                                                                 // the globe, with a plane flying round it
    globe(g, 0, s * 0.02, s * 0.36, { lon: 100, lat: 8, night: 0.5 });
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(1, s * 0.022); g.setLineDash([s * 0.04, s * 0.035]); g.beginPath(); g.ellipse(0, s * 0.02, s * 0.47, s * 0.17, -0.35, Math.PI * 1.05, Math.PI * 1.85); g.stroke(); g.setLineDash([]);
    plane(g, s * 0.36, -s * 0.2, s * 0.2, -0.75);
  },
  seasons(g, s) {                                                                  // the Earth leaning on its axis, lit by the Sun from one side
    g.fillStyle = rad(g, -s * 0.5, 0, 0, s * 0.42, [[0, 'rgba(255,214,120,.55)'], [1, 'rgba(255,214,120,0)']]); C(g, -s * 0.5, 0, s * 0.42);
    const tilt = 23.4 * Math.PI / 180;
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1, s * 0.02); g.beginPath(); g.moveTo(-Math.sin(tilt) * s * 0.47, -Math.cos(tilt) * s * 0.47); g.lineTo(Math.sin(tilt) * s * 0.47, Math.cos(tilt) * s * 0.47); g.stroke();
    globe(g, 0, 0, s * 0.34, { lon: 20, lat: 0, tilt, lx: -1, ly: 0, night: 0.12 });
  },
  festivals(g, s) {                                                                // a clay diya, lit for Deepavali
    const y = s * 0.2, w = s * 0.8;
    g.fillStyle = rad(g, s * 0.2, -s * 0.1, 0, s * 0.42, [[0, 'rgba(255,196,90,.6)'], [1, 'rgba(255,196,90,0)']]); C(g, s * 0.2, -s * 0.1, s * 0.42);
    g.fillStyle = lin(g, 0, y - s * 0.1, 0, y + s * 0.2, [[0, '#E2783A'], [0.5, '#B0461E'], [1, '#5E1E0C']]);
    g.beginPath(); g.moveTo(-w * 0.5, y - s * 0.06); g.quadraticCurveTo(-w * 0.46, y + s * 0.22, -w * 0.02, y + s * 0.21); g.quadraticCurveTo(w * 0.32, y + s * 0.2, w * 0.42, y + s * 0.02); g.lineTo(w * 0.6, y - s * 0.1); g.lineTo(w * 0.38, y - s * 0.09); g.quadraticCurveTo(0, y - s * 0.03, -w * 0.5, y - s * 0.06); g.fill();
    g.fillStyle = lin(g, 0, y - s * 0.1, 0, y, [[0, '#3A1A0A'], [1, '#6A3414']]); E(g, -w * 0.04, y - s * 0.05, w * 0.42, s * 0.045);   // the oil
    g.fillStyle = '#F6C24A'; for (let k = 0; k < 9; k++) { const u = k / 8; C(g, -w * 0.42 + u * w * 0.78, y + s * 0.07 + Math.sin(u * Math.PI) * s * 0.04, s * 0.018); }
    g.strokeStyle = '#F6C24A'; g.lineWidth = Math.max(0.8, s * 0.012); g.beginPath(); g.moveTo(-w * 0.45, y + s * 0.02); g.quadraticCurveTo(-w * 0.05, y + s * 0.14, w * 0.36, y + s * 0.03); g.stroke();
    const fx = w * 0.5, fy = y - s * 0.11;                                          // the flame on its wick
    g.fillStyle = rad(g, fx, fy - s * 0.12, 0, s * 0.26, [[0, 'rgba(255,240,180,.9)'], [1, 'rgba(255,170,60,0)']]); C(g, fx, fy - s * 0.12, s * 0.26);
    const fl = (hh, ww, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(fx, fy - hh); g.bezierCurveTo(fx + ww * 0.9, fy - hh * 0.45, fx + ww, fy - hh * 0.08, fx, fy); g.bezierCurveTo(fx - ww, fy - hh * 0.08, fx - ww * 0.9, fy - hh * 0.45, fx, fy - hh); g.fill(); };
    fl(s * 0.4, s * 0.12, '#F27A1A'); fl(s * 0.3, s * 0.085, '#FFC23A'); fl(s * 0.17, s * 0.05, '#FFF6D0');
  },
  wonders(g, s) {                                                                  // the pyramids of Giza in the sun
    g.fillStyle = rad(g, s * 0.3, -s * 0.3, 0, s * 0.2, [[0, 'rgba(255,240,180,.95)'], [0.35, 'rgba(255,226,140,.5)'], [1, 'rgba(255,226,140,0)']]); C(g, s * 0.3, -s * 0.3, s * 0.2);
    const b = s * 0.26;
    g.fillStyle = '#C79A5A'; P(g, [[-s * 0.5, b], [-s * 0.3, -s * 0.06], [-s * 0.08, b]]); g.fillStyle = '#A07440'; P(g, [[-s * 0.3, -s * 0.06], [-s * 0.08, b], [-s * 0.2, b]]);
    g.fillStyle = lin(g, -s * 0.4, -s * 0.38, s * 0.1, b, [[0, '#F6D59A'], [1, '#D9A962']]); P(g, [[-s * 0.42, b], [s * 0.06, -s * 0.38], [s * 0.12, b]]);
    g.fillStyle = lin(g, s * 0.06, -s * 0.38, s * 0.4, b, [[0, '#B88648'], [1, '#8A5E2E']]); P(g, [[s * 0.06, -s * 0.38], [s * 0.12, b], [s * 0.48, b]]);
    g.strokeStyle = 'rgba(90,60,30,.22)'; g.lineWidth = Math.max(0.5, s * 0.006);
    for (let k = 1; k < 9; k++) { const u = k / 9, yy = -s * 0.38 + (b + s * 0.38) * u, x0 = s * 0.06 - (s * 0.48) * u, x1 = s * 0.06 + (s * 0.42) * u; g.beginPath(); g.moveTo(x0, yy); g.lineTo(s * 0.06 + s * 0.06 * u, yy); g.lineTo(x1, yy); g.stroke(); }
    g.fillStyle = lin(g, 0, b - s * 0.02, 0, s * 0.42, [[0, '#E8C27E'], [1, '#C89A56']]); g.beginPath(); g.moveTo(-s * 0.5, b); g.quadraticCurveTo(0, b - s * 0.05, s * 0.5, b + s * 0.02); g.lineTo(s * 0.5, s * 0.36); g.quadraticCurveTo(0, s * 0.42, -s * 0.5, s * 0.36); g.closePath(); g.fill();
  },
  malaysia(g, s) {                                                                 // the bunga raya, Malaysia's national flower
    const cx = -s * 0.04, cy = s * 0.06;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * TAU / 5 + 0.25, L = s * 0.4, W = s * 0.3;
      g.save(); g.translate(cx, cy); g.rotate(a);
      g.fillStyle = rad(g, 0, 0, s * 0.02, L * 1.05, [[0, '#6E0614'], [0.28, '#B5122A'], [0.75, '#E8253E'], [1, '#F2485A']]);
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(L * 0.3, -W * 0.7, L * 0.85, -W * 0.85, L * 0.98, -W * 0.2);
      for (let k = 0; k <= 6; k++) { const u = k / 6, aa = -0.6 + u * 1.2; g.lineTo(L * (0.98 + 0.04 * Math.sin(k * 2.1)) * Math.cos(aa * 0.35), L * 0.98 * Math.sin(aa * 0.35) * 0.9); }
      g.bezierCurveTo(L * 0.85, W * 0.85, L * 0.3, W * 0.7, 0, 0); g.fill();
      g.strokeStyle = 'rgba(110,6,20,.35)'; g.lineWidth = Math.max(0.5, s * 0.006); for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(L * 0.1, 0); g.quadraticCurveTo(L * 0.5, k * W * 0.12, L * 0.9, k * W * 0.2); g.stroke(); }
      g.restore();
    }
    g.fillStyle = rad(g, cx, cy, 0, s * 0.1, [[0, '#4A0410'], [1, 'rgba(110,6,20,0)']]); C(g, cx, cy, s * 0.1);
    const tx = cx + s * 0.32, ty = cy - s * 0.34;                                   // the long stamen column
    g.strokeStyle = '#F06A6A'; g.lineWidth = Math.max(1, s * 0.03); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + s * 0.18, cy - s * 0.08, tx, ty); g.stroke();
    g.fillStyle = '#F6C640'; for (let k = 0; k < 9; k++) { const u = 0.55 + k * 0.045; C(g, cx + (tx - cx) * u + Math.sin(k * 2.3) * s * 0.03, cy + (ty - cy) * u + Math.cos(k * 1.7) * s * 0.03, s * 0.018); }
    g.fillStyle = '#C2102A'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; C(g, tx + Math.cos(a) * s * 0.03, ty + Math.sin(a) * s * 0.03, s * 0.017); }
  },
  weather(g, s) {                                                                  // a thundercloud, with rain and a flash of lightning
    g.strokeStyle = 'rgba(170,200,235,.7)'; g.lineWidth = Math.max(1, s * 0.016); g.lineCap = 'round'; for (let k = 0; k < 9; k++) { const x = -s * 0.32 + k * s * 0.075, y0 = s * (0.12 + (k % 3) * 0.03); g.beginPath(); g.moveTo(x, y0); g.lineTo(x - s * 0.05, y0 + s * 0.24); g.stroke(); }
    [[-0.24, 0.02, 0.15], [0.02, -0.12, 0.22], [0.24, 0.0, 0.16], [-0.08, 0.02, 0.17], [0.14, 0.05, 0.15], [-0.32, 0.07, 0.1], [0.34, 0.07, 0.1], [-0.16, 0.09, 0.12], [0.06, 0.1, 0.13], [0.26, 0.09, 0.1]].sort((p, q) => p[1] - q[1]).forEach(([u, v, r]) => {
      g.fillStyle = lin(g, 0, s * (v - r), 0, s * (v + r), [[0, '#B4C2D2'], [0.45, '#66748A'], [1, '#2C3646']]); C(g, s * u, s * v, s * r);
    });
    g.fillStyle = rad(g, 0, s * 0.25, 0, s * 0.22, [[0, 'rgba(255,240,170,.5)'], [1, 'rgba(255,240,170,0)']]); C(g, 0, s * 0.25, s * 0.22);
    g.fillStyle = '#FFE04A'; g.strokeStyle = '#FFF6C2'; g.lineWidth = Math.max(0.6, s * 0.008);
    P(g, [[s * 0.05, s * 0.1], [-s * 0.09, s * 0.3], [s * 0.0, s * 0.3], [-s * 0.08, s * 0.48], [s * 0.15, s * 0.24], [s * 0.05, s * 0.24], [s * 0.13, s * 0.1]]); g.stroke();
  },
  rainforest(g, s) {                                                               // a giant rainforest tree standing above the canopy
    const R = seeded(29);
    g.fillStyle = '#2E6E36'; g.beginPath(); g.ellipse(0, s * 0.42, s * 0.5, s * 0.1, 0, 0, TAU); g.fill();
    giantTree(g, 0, s * 0.44, s * 0.9, R, { bark: '#D8D0BE', leaf: '#4E9A44', spread: 0.3, crownAt: 0.74, thick: 0.045 });
  },
  space(g, s) {                                                                    // Saturn and its rings
    g.save(); g.rotate(-0.38);
    const ring = (front) => {
      g.save(); g.beginPath(); if (front) g.rect(-s, 0, s * 2, s); else g.rect(-s, -s, s * 2, s); g.clip();
      [[0.5, 0.15, '#C9B07A', 0.05], [0.43, 0.13, '#E8D6A6', 0.045], [0.36, 0.105, '#B89A62', 0.025]].forEach(([rx, ry, col, wd]) => { g.strokeStyle = col; g.lineWidth = s * wd; g.beginPath(); g.ellipse(0, 0, s * rx, s * ry, 0, 0, TAU); g.stroke(); });
      g.restore();
    };
    ring(false);
    g.fillStyle = lin(g, 0, -s * 0.24, 0, s * 0.24, [[0, '#F2DDA8'], [0.3, '#DCB878'], [0.5, '#E8CC92'], [0.7, '#C49A5E'], [1, '#A47A44']]); C(g, 0, 0, s * 0.24);
    g.fillStyle = rad(g, -s * 0.1, -s * 0.1, 0, s * 0.3, [[0, 'rgba(255,255,255,.25)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.3)']]); C(g, 0, 0, s * 0.24);
    ring(true);
    g.restore();
  },
  aurora(g, s) {                                                                   // the northern lights over snowy mountains
    const r = s * 0.46;
    g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
    g.fillStyle = lin(g, 0, -r, 0, r, [[0, '#060A24'], [0.6, '#0E2A40'], [1, '#14384A']]); g.fillRect(-r, -r, r * 2, r * 2);
    g.fillStyle = 'rgba(255,255,255,.8)'; const R = seeded(5); for (let k = 0; k < 22; k++) C(g, (R() - 0.5) * r * 2, -r + R() * r, Math.max(0.4, s * 0.006));
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 70; k++) { const u = k / 69, x = -r + u * r * 2, top = -r * 0.62 + Math.sin(u * 5 + 1) * r * 0.16, bot = r * 0.2 + Math.sin(u * 3) * r * 0.08; g.fillStyle = lin(g, 0, top, 0, bot, [[0, 'rgba(170,90,255,.35)'], [0.3, 'rgba(80,255,160,.5)'], [1, 'rgba(80,255,160,0)']]); g.fillRect(x, top, r * 0.035, bot - top); }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#1E2A3A'; P(g, [[-r, r * 0.42], [-r * 0.55, -r * 0.02], [-r * 0.3, r * 0.2], [0, -r * 0.12], [r * 0.35, r * 0.25], [r * 0.6, r * 0.05], [r, r * 0.4], [r, r], [-r, r]]);
    g.fillStyle = '#E6F0F8'; P(g, [[-r * 0.55, -r * 0.02], [-r * 0.46, r * 0.08], [-r * 0.52, r * 0.06], [-r * 0.6, r * 0.06]]); P(g, [[0, -r * 0.12], [r * 0.1, r * 0.0], [r * 0.02, r * 0.0], [-r * 0.08, r * 0.0]]); P(g, [[r * 0.6, r * 0.05], [r * 0.68, r * 0.13], [r * 0.56, r * 0.12]]);
    g.fillStyle = '#0A1420'; for (let k = 0; k < 7; k++) { const x = -r * 0.8 + k * r * 0.27, hh = r * (0.22 + (k % 3) * 0.07), yb = r * 0.75; P(g, [[x, yb - hh], [x + hh * 0.22, yb], [x - hh * 0.22, yb]]); }
    g.restore();
  },
  birds(g, s) {                                                                    // a murmuration of starlings, swirling at dusk
    const R = seeded(17); g.fillStyle = '#16121E';
    let n = 0;
    while (n < 230) {
      const x = (R() - 0.5) * s * 0.96, y = (R() - 0.5) * s * 0.8, a = (x / (s * 0.48)), b = y / (s * 0.4);
      const inside = Math.pow(b - 0.45 * Math.sin(a * 2.4), 2) * 4 + a * a < 1;      // a twisting, ribbon-like flock
      if (!inside) continue;
      n++; const sz = s * (0.012 + R() * 0.012); g.save(); g.translate(x, y); g.rotate(R() * 0.8 - 0.4); g.beginPath(); g.moveTo(-sz * 1.6, -sz * 0.4); g.quadraticCurveTo(-sz * 0.4, -sz * 0.2, 0, sz * 0.3); g.quadraticCurveTo(sz * 0.4, -sz * 0.2, sz * 1.6, -sz * 0.4); g.lineTo(0, sz * 0.7); g.closePath(); g.fill(); g.restore();
    }
  },
  flies(g, s) {                                                                    // a firefly, its tail glowing
    g.globalCompositeOperation = 'lighter';
    [[-0.32, -0.28, 0.05], [0.34, -0.3, 0.04], [0.3, 0.32, 0.05], [-0.36, 0.26, 0.035]].forEach(([u, v, r]) => { g.fillStyle = rad(g, s * u, s * v, 0, s * r * 2.4, [[0, 'rgba(230,255,140,.95)'], [0.3, 'rgba(190,255,90,.5)'], [1, 'rgba(190,255,90,0)']]); C(g, s * u, s * v, s * r * 2.4); });
    g.fillStyle = rad(g, s * 0.16, s * 0.12, 0, s * 0.34, [[0, 'rgba(240,255,150,.95)'], [0.35, 'rgba(200,255,90,.55)'], [1, 'rgba(200,255,90,0)']]); C(g, s * 0.16, s * 0.12, s * 0.34);
    g.globalCompositeOperation = 'source-over';
    g.save(); g.rotate(0.6);
    g.strokeStyle = '#1A1408'; g.lineWidth = Math.max(0.8, s * 0.014); g.lineCap = 'round';
    for (let k = -1; k <= 1; k++) [-1, 1].forEach((d) => { g.beginPath(); g.moveTo(k * s * 0.05, 0); g.lineTo(k * s * 0.07, d * s * 0.12); g.lineTo(k * s * 0.1, d * s * 0.16); g.stroke(); });
    [-1, 1].forEach((d) => { g.beginPath(); g.moveTo(-s * 0.2, d * s * 0.02); g.quadraticCurveTo(-s * 0.32, d * s * 0.06, -s * 0.36, d * s * 0.14); g.stroke(); });   // antennae
    g.fillStyle = 'rgba(220,235,255,.35)'; [-1, 1].forEach((d) => E(g, 0, d * s * 0.1, s * 0.2, s * 0.07, d * 0.25));          // the thin flying wings
    g.fillStyle = lin(g, 0, -s * 0.08, 0, s * 0.08, [[0, '#4A3A22'], [1, '#2A2014']]); E(g, s * 0.02, 0, s * 0.15, s * 0.07);    // the wing cases
    g.fillStyle = '#E8F27A'; E(g, s * 0.2, 0, s * 0.08, s * 0.055);                                                         // the glowing tail
    g.fillStyle = '#E2783A'; E(g, -s * 0.13, 0, s * 0.05, s * 0.06);                                                        // the orange shield behind its head
    g.fillStyle = '#1A1408'; E(g, -s * 0.19, 0, s * 0.035, s * 0.035);
    g.restore();
  }
};
const ANIMAL = { savannah: 'giraffe', desert: 'camel', reef: 'reeffish', tundra: 'fox', polar: 'penguin', records: 'cheetah' };
/* Draw a window's picture, its middle at x, y, about s across. */
export function drawIcon(g, id, x, y, s) {
  g.save(); g.translate(x, y); g.lineJoin = 'round';
  let ok = true;
  if (ICONS[id]) ICONS[id](g, s);
  else if (ANIMAL[id]) ok = drawCreature(g, ANIMAL[id], 0, s * 0.04, s * 0.78, { rest: true, t: 0.4, ph: 0.9 });
  else ok = false;
  g.restore();
  return ok;
}
const iconCache = new Map();
/* A window's picture as a canvas for the page, px × px CSS pixels. */
export function iconCanvas(id, px) {
  const d = DPR(), key = id + ':' + px + ':' + d + ':' + (earth ? 1 : 0);
  let src = iconCache.get(key);
  if (!src) { src = document.createElement('canvas'); src.width = Math.round(px * d); src.height = Math.round(px * d); const g = src.getContext('2d'); g.scale(d, d); drawIcon(g, id, px / 2, px / 2, px * 0.96); iconCache.set(key, src); }
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.style.width = px + 'px'; c.style.height = px + 'px';
  c.getContext('2d').drawImage(src, 0, 0); c.setAttribute('aria-hidden', 'true'); c.className = 'icon-pic';
  return c;
}
/* Put each window's picture into every [data-icon] in root (the picker); the globes again once the Earth has loaded. */
export function swapIcons(root) {
  if (!root || !root.querySelectorAll) return;
  const fill = (el) => { const px = Math.round((parseFloat(getComputedStyle(el).fontSize) || 48) * 1.36); el.textContent = ''; el.appendChild(iconCanvas(el.dataset.icon, px)); };
  root.querySelectorAll('[data-icon]').forEach(fill);
  if (!earth) loadEarth().then((ok) => { if (ok) root.querySelectorAll('[data-icon="explorer"],[data-icon="seasons"]').forEach(fill); });
}

/* ================= small signs for the page (SVG) ================= */
const svg = (body, vb) => '<svg class="glyph" viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true">' + body + '</svg>';
export const GLYPH = {
  pin: svg('<path d="M12 22s7-7.3 7-12.6A7 7 0 0 0 5 9.4C5 14.7 12 22 12 22z" fill="#E5484D"/><path d="M12 22s7-7.3 7-12.6A7 7 0 0 0 12 2.4z" fill="#B42A30"/><circle cx="12" cy="9.4" r="2.8" fill="#FFF"/>'),
  plate: svg('<circle cx="12" cy="13" r="7.6" fill="#F4F1EA"/><circle cx="12" cy="13" r="5.2" fill="none" stroke="#D9D3C6" stroke-width="1"/><path d="M2.6 3.5v5.2M4.2 3.5v5.2M5.8 3.5v5.2M2.6 8.2c0 1.4 3.2 1.4 3.2 0M4.2 9.3v11.2" stroke="#C9CED6" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M20.4 3.4c-1.6.6-2.4 2.8-2.4 5.4 0 1 .6 1.6 1.4 1.6h1v10.2" stroke="#C9CED6" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
  plane: svg('<path d="M21 15.5v-1.8l-7.6-4.6V4.2c0-.9-.6-1.7-1.4-1.7s-1.4.8-1.4 1.7v4.9L3 13.7v1.8l7.6-2.4v4.6l-1.9 1.4v1.4l3.3-1 3.3 1v-1.4l-1.9-1.4v-4.6z" fill="#EAF2FF"/>'),
  sun: svg('<g stroke="#FFC83D" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g><circle cx="12" cy="12" r="5.2" fill="#FFD84D"/><circle cx="10.4" cy="10.4" r="2" fill="#FFF0A8"/>'),
  moon: svg('<path d="M15.6 3.2a8.8 8.8 0 1 0 5.2 13.4A7.4 7.4 0 0 1 15.6 3.2z" fill="#F2E6B8"/><circle cx="9" cy="14" r="1.2" fill="#D6C88E"/><circle cx="12" cy="18" r=".8" fill="#D6C88E"/>'),
  sunrise: svg('<path d="M3 17.5h18" stroke="#9FB4D6" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 17.5a5.5 5.5 0 0 1 11 0z" fill="#FFB547"/><g stroke="#FFC83D" stroke-width="1.8" stroke-linecap="round"><path d="M12 6.5v2.4M5.6 9.6l1.6 1.6M18.4 9.6l-1.6 1.6"/></g><path d="M12 2.6l2.2 2.6h-4.4z" fill="#FFC83D"/>'),
  sunset: svg('<path d="M3 17.5h18" stroke="#9FB4D6" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 17.5a5.5 5.5 0 0 1 11 0z" fill="#F2794A"/><g stroke="#F2994A" stroke-width="1.8" stroke-linecap="round"><path d="M12 6.5v2.4M5.6 9.6l1.6 1.6M18.4 9.6l-1.6 1.6"/></g><path d="M12 5.2l2.2-2.6h-4.4z" fill="#F2994A"/>'),
  dice: svg('<rect x="3" y="3" width="18" height="18" rx="4.5" fill="#FFFFFF"/><rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="#C9CED6"/><g fill="#1A1405"><circle cx="8" cy="8" r="1.7"/><circle cx="16" cy="8" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="8" cy="16" r="1.7"/><circle cx="16" cy="16" r="1.7"/></g>')
};
