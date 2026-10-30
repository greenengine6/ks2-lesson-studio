/* The pictures for Extreme weather (the skies come from sky.js): a Malaysian city at dusk under a thunderstorm, the
   east coast of Peninsular Malaysia in the monsoon, and a cabin in the mountains in a blizzard. The parts that do not
   move are drawn once for the screen size (sharp on any screen); the rest (rain, waves on the beach, palms in the
   wind, chimney smoke, snow) is drawn every frame. */
import { TAU, rnd, clamp, noise, layer, view } from './util.js?v=49509700';
import { seeded } from './scenery.js?v=49509700';

const DPR = () => Math.min(view.dpr || 1, 2);
/* a canvas the size of the screen, sharp on this screen, drawn in CSS pixels */
function sheet(w, h) {
  const r = DPR(), c = layer(w * r, h * r), g = c.getContext('2d');
  g.scale(r, r);
  return { c, g };
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; };
const lerp = (a, b, k) => a + (b - a) * k;

/* ======================= the thunderstorm: a city at dusk ======================= */
/* lit windows on a building's face */
function windows(g, x, y, w, h, S, R, p, warm) {
  const ww = Math.max(1.4, 2.4 * S), wh = Math.max(1.8, 3.2 * S), gx = Math.max(3, 5.5 * S), gy = Math.max(4, 7.5 * S);
  const cols = Math.floor((w - gx) / gx), rows = Math.floor((h - gy * 1.5) / gy);
  if (cols < 1 || rows < 1) return;
  const ox = x + (w - cols * gx) / 2 + (gx - ww) / 2;
  for (let r = 0; r < rows; r++) {
    const rowLit = R() < 0.25 ? p * 2.2 : p;                       // a whole floor of offices, lights still on
    for (let c = 0; c < cols; c++) {
      if (R() > rowLit) continue;
      g.fillStyle = R() < 0.18 ? 'rgba(190,220,255,' + (0.45 + R() * 0.3).toFixed(2) + ')' : rgba(warm, (0.5 + R() * 0.45).toFixed(2));
      g.fillRect(ox + c * gx, y + gy * 0.9 + r * gy, ww, wh);
    }
  }
}
/* one tall building: a box with a top in one of a few shapes; returns the tip (for lightning and the red light) */
function tower(g, x, base, w, h, R, col, S, p, warm) {
  const top = base - h, kind = Math.floor(R() * 6);
  g.fillStyle = col;
  g.fillRect(x, top, w, h + 1);
  let tip = [x + w / 2, top];
  if (kind === 0) {                                                // stepped back
    g.fillRect(x + w * 0.15, top - h * 0.08, w * 0.7, h * 0.08 + 1); g.fillRect(x + w * 0.3, top - h * 0.14, w * 0.4, h * 0.06 + 1); tip = [x + w / 2, top - h * 0.14];
  } else if (kind === 1) {                                         // a sloping roof
    g.beginPath(); g.moveTo(x, top + 1); g.lineTo(x, top - h * 0.09); g.lineTo(x + w, top + 1); g.fill(); tip = [x + 2, top - h * 0.09];
  } else if (kind === 2) {                                         // a pointed crown
    g.beginPath(); g.moveTo(x + w * 0.08, top + 1); g.lineTo(x + w / 2, top - h * 0.16); g.lineTo(x + w * 0.92, top + 1); g.fill(); tip = [x + w / 2, top - h * 0.16];
  } else if (kind === 3) {                                         // a mast
    g.fillRect(x + w * 0.2, top - 6 * S, w * 0.6, 6 * S + 1); g.fillRect(x + w / 2 - 0.9 * S, top - h * 0.22, 1.8 * S, h * 0.22); tip = [x + w / 2, top - h * 0.22];
  } else if (kind === 4) {                                         // a rounded top
    g.beginPath(); g.ellipse(x + w / 2, top + 1, w / 2, h * 0.06, 0, Math.PI, TAU); g.fill(); tip = [x + w / 2, top - h * 0.06];
  } else {                                                         // plant on the roof
    g.fillRect(x + w * 0.12, top - 5 * S, w * 0.3, 5 * S + 1); g.fillRect(x + w * 0.55, top - 8 * S, w * 0.25, 8 * S + 1); tip = [x + w * 0.67, top - 8 * S];
  }
  // a little light on the edge facing the glow of the city, and shade on the other
  g.fillStyle = 'rgba(150,165,200,.07)'; g.fillRect(x, top, Math.max(1, w * 0.14), h);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + w * 0.62, top, w * 0.38, h);
  windows(g, x, top, w, h, S, R, p, warm);
  return tip;
}
/* two linked towers with stepped tops and spires (like the Petronas Towers) */
function twins(g, cx, base, H, S, col, R, warm) {
  const tw = H * 0.1, gap = tw * 0.95, tips = [];
  [-1, 1].forEach((sd) => {
    const x = cx + sd * (gap / 2 + tw / 2);
    const steps = [[0, 1], [0.6, 0.88], [0.68, 0.76], [0.75, 0.64], [0.81, 0.5], [0.86, 0.34], [0.9, 0]];
    g.fillStyle = col;
    for (let i = 0; i < steps.length - 1; i++) {
      const y0 = base - H * steps[i][0], y1 = base - H * steps[i + 1][0], wd = tw * steps[i][1];
      g.fillRect(x - wd / 2, y1, wd, y0 - y1 + 1);
    }
    g.beginPath(); g.moveTo(x - tw * 0.17, base - H * 0.9 + 1); g.lineTo(x, base - H * 0.935); g.lineTo(x + tw * 0.17, base - H * 0.9 + 1); g.fill();
    g.fillRect(x - Math.max(0.7, tw * 0.025), base - H, Math.max(1.4, tw * 0.05), H * 0.07);       // the spire
    g.beginPath(); g.arc(x, base - H * 0.955, Math.max(1.2, tw * 0.05), 0, TAU); g.fill();
    // ribs down the faces, catching a little light, and floors lit here and there
    g.strokeStyle = 'rgba(160,175,210,.09)'; g.lineWidth = Math.max(0.6, S * 0.7);
    for (let k = 1; k < 7; k++) { const rx = x - tw / 2 + tw * k / 7; g.beginPath(); g.moveTo(rx, base); g.lineTo(rx, base - H * 0.6); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + tw * 0.08, base - H * 0.6, tw * 0.42, H * 0.6);
    for (let f = 0; f < 46; f++) { if (R() < 0.42) continue; g.fillStyle = rgba(warm, (0.3 + R() * 0.45).toFixed(2)); g.fillRect(x - tw * 0.42 + R() * tw * 0.2, base - H * 0.58 + f * H * 0.0125, tw * (0.25 + R() * 0.5), Math.max(1, H * 0.0035)); }
    tips.push([x, base - H]);
  });
  // the skybridge, with its legs
  const by = base - H * 0.41, bx0 = cx - gap / 2, bx1 = cx + gap / 2;
  g.fillStyle = col; g.fillRect(bx0, by - H * 0.012, gap, H * 0.014);
  g.strokeStyle = col; g.lineWidth = Math.max(1.2, tw * 0.06);
  g.beginPath(); g.moveTo(bx0, by + H * 0.12); g.lineTo(cx, by); g.lineTo(bx1, by + H * 0.12); g.stroke();
  g.fillStyle = rgba(warm, 0.75); g.fillRect(bx0 + 2, by - H * 0.008, gap - 4, Math.max(1, H * 0.004));
  return tips;
}
/* a television tower: a tall shaft, a round head with a ring of windows, a mast (like the KL Tower) */
function tvTower(g, cx, base, H, S, col, warm) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(cx - H * 0.07, base); g.quadraticCurveTo(cx - H * 0.025, base - H * 0.05, cx - H * 0.022, base - H * 0.12); g.lineTo(cx - H * 0.017, base - H * 0.7);
  g.lineTo(cx + H * 0.017, base - H * 0.7); g.lineTo(cx + H * 0.022, base - H * 0.12); g.quadraticCurveTo(cx + H * 0.025, base - H * 0.05, cx + H * 0.07, base); g.closePath(); g.fill();
  const py = base - H * 0.74;                                      // the head
  g.beginPath(); g.moveTo(cx - H * 0.02, py + H * 0.05);
  g.bezierCurveTo(cx - H * 0.09, py + H * 0.02, cx - H * 0.08, py - H * 0.035, cx - H * 0.045, py - H * 0.05);
  g.lineTo(cx + H * 0.045, py - H * 0.05); g.bezierCurveTo(cx + H * 0.08, py - H * 0.035, cx + H * 0.09, py + H * 0.02, cx + H * 0.02, py + H * 0.05); g.closePath(); g.fill();
  g.fillRect(cx - H * 0.03, py - H * 0.085, H * 0.06, H * 0.04);
  g.fillRect(cx - Math.max(0.8, H * 0.005), base - H, Math.max(1.6, H * 0.01), H * 0.2);
  g.fillStyle = rgba(warm, 0.8);
  for (let k = -5; k <= 5; k++) g.fillRect(cx + k * H * 0.0125 - H * 0.003, py - H * 0.008, H * 0.007, H * 0.01);
  g.fillStyle = 'rgba(200,225,255,.6)'; g.fillRect(cx - H * 0.06, py + H * 0.012, H * 0.12, Math.max(1, H * 0.004));
  return [cx, base - H];
}
/* a mosque: a hall with arches, a dome and a minaret */
function mosque(g, cx, base, S, col, warm) {
  const w = 120 * S, hh = 30 * S;
  g.fillStyle = col; g.fillRect(cx - w / 2, base - hh, w, hh + 1);
  g.fillRect(cx - w * 0.2, base - hh - 8 * S, w * 0.4, 8 * S + 1);
  const dr = 24 * S, dy = base - hh - 8 * S;
  g.beginPath(); g.moveTo(cx - dr, dy + 1); g.bezierCurveTo(cx - dr * 1.15, dy - dr * 0.9, cx - dr * 0.3, dy - dr * 1.2, cx, dy - dr * 1.75);
  g.bezierCurveTo(cx + dr * 0.3, dy - dr * 1.2, cx + dr * 1.15, dy - dr * 0.9, cx + dr, dy + 1); g.fill();
  g.fillRect(cx - 0.8 * S, dy - dr * 2.1, 1.6 * S, dr * 0.4);
  g.strokeStyle = col; g.lineWidth = 1.4 * S; g.beginPath(); g.arc(cx + 1.6 * S, dy - dr * 2.16, 2.6 * S, Math.PI * 0.55, Math.PI * 1.45); g.stroke();
  const mx = cx + w / 2 + 10 * S, mh = 118 * S;                    // the minaret
  g.fillRect(mx - 4.5 * S, base - mh, 9 * S, mh);
  [0.62, 0.86].forEach((f) => g.fillRect(mx - 7 * S, base - mh * f, 14 * S, 3 * S));
  g.beginPath(); g.moveTo(mx - 5 * S, base - mh + 1); g.quadraticCurveTo(mx, base - mh - 12 * S, mx + 5 * S, base - mh + 1); g.fill();
  g.fillRect(mx - 0.6 * S, base - mh - 19 * S, 1.2 * S, 8 * S);
  for (let k = 0; k < 6; k++) {                                     // lit arches along the front
    const ax = cx - w / 2 + 10 * S + k * (w - 20 * S) / 5.2;
    g.fillStyle = rgba(warm, 0.55); g.beginPath(); g.moveTo(ax, base - 2 * S); g.lineTo(ax, base - hh * 0.55); g.quadraticCurveTo(ax + 6 * S, base - hh * 0.85, ax + 12 * S, base - hh * 0.55); g.lineTo(ax + 12 * S, base - 2 * S); g.fill();
  }
  g.fillStyle = 'rgba(160,175,210,.08)'; g.beginPath(); g.ellipse(cx - dr * 0.35, dy - dr * 0.75, dr * 0.35, dr * 0.6, -0.3, 0, TAU); g.fill();
  return [mx, base - mh - 19 * S];
}
/* a row of old shophouses, two storeys, with tiled roofs and lit shutters above the five-foot way */
function shophouses(g, x0, x1, base, S, R, col, warm) {
  const uw = 24 * S, hh = 26 * S;
  for (let x = x0; x < x1; x += uw) {
    const h2 = hh * (0.92 + R() * 0.16);
    g.fillStyle = col; g.fillRect(x, base - h2, uw + 0.5, h2 + 1);
    g.beginPath(); g.moveTo(x - 1.5 * S, base - h2 + 1); g.lineTo(x + uw / 2, base - h2 - 5 * S); g.lineTo(x + uw + 1.5 * S, base - h2 + 1); g.fill();
    if (R() < 0.7) { g.fillStyle = rgba(warm, (0.45 + R() * 0.4).toFixed(2)); g.fillRect(x + uw * 0.2, base - h2 * 0.78, uw * 0.22, h2 * 0.26); g.fillRect(x + uw * 0.58, base - h2 * 0.78, uw * 0.22, h2 * 0.26); }
    g.fillStyle = rgba(warm, (0.25 + R() * 0.35).toFixed(2));
    g.beginPath(); g.moveTo(x + uw * 0.15, base); g.lineTo(x + uw * 0.15, base - h2 * 0.32); g.quadraticCurveTo(x + uw / 2, base - h2 * 0.5, x + uw * 0.85, base - h2 * 0.32); g.lineTo(x + uw * 0.85, base); g.fill();
  }
}
/* a rain tree: a short trunk and a wide umbrella of leaves */
function rainTree(g, x, base, s, col, R) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x - s * 0.06, base); g.quadraticCurveTo(x - s * 0.04, base - s * 0.3, x - s * 0.3, base - s * 0.55); g.lineTo(x - s * 0.24, base - s * 0.58);
  g.quadraticCurveTo(x, base - s * 0.4, x + s * 0.26, base - s * 0.6); g.lineTo(x + s * 0.3, base - s * 0.56); g.quadraticCurveTo(x + s * 0.05, base - s * 0.3, x + s * 0.07, base); g.fill();
  for (let i = 0; i < 9; i++) { const a = i / 8, px = x + (a - 0.5) * s * 1.25, py = base - s * (0.62 + Math.sin(a * Math.PI) * 0.16); g.beginPath(); g.ellipse(px, py, s * (0.2 + R() * 0.08), s * (0.11 + R() * 0.05), 0, 0, TAU); g.fill(); }
}
/* a coconut palm, as a silhouette (s: its height) */
function palmSilhouette(g, x, base, s, col, lean) {
  g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
  const tx = x + lean * s, ty = base - s;
  g.lineWidth = Math.max(1.2, s * 0.04); g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + lean * s * 0.15, base - s * 0.6, tx, ty); g.stroke();
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k / 8 - 0.5) * 3.2, L = s * (0.36 + 0.06 * Math.sin(k * 2.3));
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.42;
    g.lineWidth = Math.max(0.8, s * 0.022); g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.55, ty + Math.sin(a) * L * 0.5 - L * 0.12, ex, ey); g.stroke();
    g.lineWidth = Math.max(0.6, s * 0.012);
    for (let j = 1; j < 7; j++) { const f = j / 7, qx = tx + (ex - tx) * f, qy = ty + (ey - ty) * f - Math.sin(f * Math.PI) * L * 0.15; g.beginPath(); g.moveTo(qx, qy); g.lineTo(qx + Math.cos(a + 1.2) * L * 0.12 * (1 - f * 0.5), qy + L * 0.13); g.moveTo(qx, qy); g.lineTo(qx + Math.cos(a - 1.2) * L * 0.12 * (1 - f * 0.5), qy + L * 0.13); g.stroke(); }
  }
}
/* a street lamp; returns where its light is */
function streetLamp(g, x, base, s, col) {
  g.strokeStyle = col; g.lineWidth = Math.max(1.2, s * 0.035); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - s); g.quadraticCurveTo(x, base - s * 1.08, x + s * 0.2, base - s * 1.06); g.stroke();
  g.fillStyle = col; g.beginPath(); g.ellipse(x + s * 0.24, base - s * 1.04, s * 0.08, s * 0.03, 0, 0, TAU); g.fill();
  return [x + s * 0.24, base - s * 1.01];
}

export function makeCity() {
  return {
    key: '', city: null, road: null, gy: 0, hz: 0, tips: [], beacons: [], lamps: [], splash: [], spawn: 0,
    /* lay the city out for this screen and draw its still parts. top: under the top bar; fb: above the controls */
    build(w, h, top, fb) {
      const key = [w, h, top, Math.round(fb), DPR()].join('|');
      if (key === this.key) return;
      this.key = key; this.w = w;
      const sm = view.small, R = seeded(20260611), warm = '#FFC979';
      const gy = this.gy = Math.round(fb - (sm ? 26 : 42)), span = gy - top, S = clamp(span / 640, 0.5, 1.4), H = span * (sm ? 0.6 : 0.64);
      this.hz = gy - 2 * S;
      const A = sheet(w, h), g = A.g;
      this.tips = []; this.beacons = []; this.lamps = [];
      // far towers, in the haze
      const far = '#232A39', twinX = w * (sm ? 0.7 : 0.67), tvX = w * (sm ? 0.2 : 0.29), twinW = H * 0.3, tvW = H * 0.12;
      for (let x = -10; x < w + 10;) {
        const bw = (28 + R() * 46) * S, near = Math.abs(x + bw / 2 - twinX) < twinW * 0.7 + bw / 2 || Math.abs(x + bw / 2 - tvX) < tvW + bw / 2;
        const bh = H * (near ? 0.12 + R() * 0.12 : 0.16 + R() * 0.32);
        const tip = tower(g, x, gy, bw, bh, R, far, S, 0.07, warm);
        if (bh > H * 0.36) this.beacons.push([tip[0], tip[1] - 1.5 * S, R() * 2]);
        if (bh > H * 0.3) this.tips.push(tip);
        x += bw + (2 + R() * 10) * S;
      }
      twins(g, twinX, gy, H, S, far, R, warm).forEach((p) => { this.tips.push(p, p); this.beacons.push([p[0], p[1] + 1.5 * S, R() * 2]); });
      const tv = tvTower(g, tvX, gy, H * 0.86, S, far, warm); this.tips.push(tv); this.beacons.push([tv[0], tv[1] + 1.5 * S, R() * 2]);
      // the haze between them and the nearer buildings
      const hz = g.createLinearGradient(0, gy - H, 0, gy); hz.addColorStop(0, 'rgba(70,72,90,0)'); hz.addColorStop(1, 'rgba(92,88,100,.2)');
      g.fillStyle = hz; g.fillRect(0, gy - H * 1.05, w, H * 1.05);
      // nearer: flats, shophouses, a mosque, trees, street lamps
      const mid = '#161B26';
      for (let x = -20; x < w + 20;) {
        const bw = (40 + R() * 70) * S, bh = span * (0.07 + R() * 0.13);
        const t2 = tower(g, x, gy, bw, bh, R, mid, S, 0.22, warm);
        g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = gy - bh + 6 * S; y < gy - 4 * S; y += 7.5 * S) g.fillRect(x, y, bw, Math.max(0.6, 0.8 * S));   // balconies
        x += bw + (R() < 0.4 ? (30 + R() * 60) * S : (4 + R() * 10) * S);
        if (t2[1] < gy - span * 0.17) this.tips.push(t2);
      }
      const mqX = w * (sm ? 0.44 : 0.47);
      this.tips.push(mosque(g, mqX, gy, S * (sm ? 0.75 : 1), '#10141D', warm));
      shophouses(g, sm ? w * 0.02 : w * 0.06, sm ? w * 0.3 : w * 0.34, gy, S, R, '#11151E', warm);
      shophouses(g, w * (sm ? 0.62 : 0.6), w * (sm ? 0.98 : 0.86), gy, S * 0.95, R, '#11151E', warm);
      const near = '#0B0E15';
      for (let i = 0; i < (sm ? 4 : 7); i++) rainTree(g, w * (0.04 + i / (sm ? 3.4 : 6.2) * 0.95) + (R() - 0.5) * 30 * S, gy, (48 + R() * 26) * S, near, R);
      palmSilhouette(g, w * (sm ? 0.36 : 0.4), gy, 70 * S, near, 0.06); palmSilhouette(g, w * (sm ? 0.92 : 0.9), gy, 62 * S, near, -0.08);
      for (let i = 0; i < (sm ? 3 : 6); i++) this.lamps.push(streetLamp(g, w * ((i + 0.55) / (sm ? 3 : 6)), gy, 36 * S, '#07090E'));
      // the lamps' light, and their pools on the pavement
      this.lamps.forEach(([lx, ly]) => {
        const gl = g.createRadialGradient(lx, ly, 0, lx, ly, 26 * S); gl.addColorStop(0, 'rgba(255,214,150,.9)'); gl.addColorStop(0.18, 'rgba(255,200,130,.35)'); gl.addColorStop(1, 'rgba(255,190,120,0)');
        g.fillStyle = gl; g.fillRect(lx - 26 * S, ly - 26 * S, 52 * S, 52 * S);
      });
      // the street: the pavement, then the wet road with the lights mirrored in it
      g.fillStyle = '#1B202A'; g.fillRect(0, gy, w, 6 * S);
      g.fillStyle = 'rgba(150,165,200,.22)'; g.fillRect(0, gy, w, Math.max(1, S));
      const rd = g.createLinearGradient(0, gy + 6 * S, 0, h); rd.addColorStop(0, '#141922'); rd.addColorStop(1, '#07090D');
      g.fillStyle = rd; g.fillRect(0, gy + 6 * S, w, h - gy);
      const refl = (x, wd, col, a, len) => {
        for (let y = gy + 7 * S, k = 0; y < gy + len; y += Math.max(1.5, 2.2 * S), k++) {
          const f = (y - gy) / len, ww = wd * (0.6 + R() * 0.8) * (1 + f * 0.6);
          g.fillStyle = rgba(col, (a * (1 - f) * (0.45 + R() * 0.55)).toFixed(3)); g.fillRect(x - ww / 2 + (R() - 0.5) * 3 * S, y, ww, Math.max(1, 1.3 * S));
        }
      };
      this.lamps.forEach(([lx]) => refl(lx, 9 * S, '#FFCB8A', 0.7, (h - gy) * 0.8));
      for (let i = 0; i < 26; i++) refl(R() * w, (2 + R() * 4) * S, R() < 0.2 ? '#BFD8FF' : '#FFC979', 0.32, (h - gy) * (0.25 + R() * 0.3));
      g.strokeStyle = 'rgba(220,220,200,.16)'; g.lineWidth = 2 * S; g.setLineDash([22 * S, 18 * S]);
      g.beginPath(); g.moveTo(0, gy + (h - gy) * 0.5); g.lineTo(w, gy + (h - gy) * 0.5); g.stroke(); g.setLineDash([]);
      this.city = A.c;
      this.splash = Array.from({ length: 40 }, () => ({ x: 0, y: 0, t: 1, s: 1 }));
    },
    /* somewhere for the lightning to strike (tall things are hit most) */
    target() {
      const w = this.w || 800, T = this.tips.filter(([x]) => x > w * 0.08 && x < w * 0.92);
      return T.length ? T[Math.floor(Math.random() * T.length)] : [rnd(0.2, 0.8) * w, this.gy];
    },
    draw(ctx, w, h, t, dt, flash) {
      ctx.drawImage(this.city, 0, 0, w, h);
      // red lights on the tallest tops, blinking
      this.beacons.forEach(([x, y, ph]) => {
        const on = ((t + ph) % 1.6) < 0.5, r = 2.2 + (on ? 1 : 0);
        ctx.fillStyle = on ? 'rgba(255,60,50,.95)' : 'rgba(150,30,30,.6)'; ctx.beginPath(); ctx.arc(x, y, on ? 1.8 : 1.3, 0, TAU); ctx.fill();
        if (on) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, 'rgba(255,70,60,.5)'); g.addColorStop(1, 'rgba(255,70,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); }
      });
      // rain hitting the road
      this.spawn += dt * (view.small ? 30 : 60);
      for (const s of this.splash) {
        if (s.t >= 1 && this.spawn >= 1) { this.spawn -= 1; s.x = Math.random() * w; s.y = this.gy + 8 + Math.random() * (h - this.gy - 8); s.t = 0; s.s = 0.6 + (s.y - this.gy) / (h - this.gy + 1) * 1.2; }
        if (s.t >= 1) continue;
        s.t += dt * 4;
        const k = s.t, r = (2 + k * 7) * s.s;
        ctx.strokeStyle = 'rgba(200,210,230,' + (0.45 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.3, 0, 0, TAU); ctx.stroke();
      }
      this.spawn = Math.min(this.spawn, 3);
      if (flash > 0) {                                               // the flash, mirrored in the wet road
        const g = ctx.createLinearGradient(0, this.gy, 0, h); g.addColorStop(0, 'rgba(190,205,255,' + (0.32 * flash).toFixed(3) + ')'); g.addColorStop(1, 'rgba(190,205,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, this.gy, w, h - this.gy);
      }
    }
  };
}

/* ======================= the monsoon: the east coast, a kampung by the beach ======================= */
const mixHex = (a, b, k) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), c = [16, 8, 0].map((s) => Math.round(lerp(p >> s & 255, q >> s & 255, k))); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };
/* a coconut palm: a curved ringed trunk, fronds of leaflets that bend in the wind, coconuts. sway: radians */
function coconutPalm(g, x, base, H, lean, sway, dark, detail) {
  const tx = x + lean * H + sway * H * 0.12, ty = base - H, mx = x + lean * H * 0.35, my = base - H * 0.55;
  const tw = Math.max(1.5, H * 0.045);
  g.fillStyle = dark ? '#4A3A2A' : '#7B5E43';
  g.beginPath(); g.moveTo(x - tw, base); g.quadraticCurveTo(mx - tw * 0.8, my, tx - tw * 0.55, ty + 2); g.lineTo(tx + tw * 0.55, ty + 2); g.quadraticCurveTo(mx + tw * 0.8, my, x + tw, base); g.closePath(); g.fill();
  if (detail) {                                                    // rings on the trunk, and its shaded side
    g.strokeStyle = 'rgba(40,28,18,.35)'; g.lineWidth = Math.max(0.6, H * 0.006);
    for (let k = 1; k < 18; k++) { const f = k / 18, px = (1 - f) * (1 - f) * x + 2 * (1 - f) * f * mx + f * f * tx, py = (1 - f) * (1 - f) * base + 2 * (1 - f) * f * my + f * f * ty, ww = tw * (1 - f * 0.45); g.beginPath(); g.moveTo(px - ww, py); g.lineTo(px + ww, py + H * 0.006); g.stroke(); }
    g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.moveTo(x + tw * 0.2, base); g.quadraticCurveTo(mx + tw * 0.1, my, tx + tw * 0.1, ty + 2); g.lineTo(tx + tw * 0.55, ty + 2); g.quadraticCurveTo(mx + tw * 0.8, my, x + tw, base); g.fill();
  }
  const n = detail ? 11 : 8, cols = dark ? ['#1F3A22', '#2B4A2C'] : ['#2E6A2C', '#4E8E36'];
  g.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    // each frond rises a little, then arches over and droops; the leaflets hang from it
    const a0 = -Math.PI / 2 + (k / (n - 1) - 0.5) * 3.5 + sway * (0.7 + 0.5 * Math.sin(k * 1.9)), L = H * (0.34 + 0.05 * Math.sin(k * 1.7));
    const out = Math.cos(a0), upk = Math.max(0, -Math.sin(a0));
    const cx = tx + out * L * 0.55, cy = ty - L * (0.12 + 0.3 * upk), ex = tx + out * L * 0.95, ey = ty + L * (0.32 - 0.25 * upk);
    g.strokeStyle = cols[k % 2];
    g.lineWidth = Math.max(0.8, H * 0.01); g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    g.lineWidth = Math.max(0.6, H * (detail ? 0.0055 : 0.009)); g.beginPath();
    const m = detail ? 22 : 8;
    for (let j = 2; j <= m; j++) {
      const f = j / (m + 1), px = (1 - f) * (1 - f) * tx + 2 * (1 - f) * f * cx + f * f * ex, py = (1 - f) * (1 - f) * ty + 2 * (1 - f) * f * cy + f * f * ey;
      const ll = L * 0.2 * Math.sin(f * Math.PI * 0.85 + 0.25), dx = (ex - tx) * 0.04 * (out > 0 ? 1 : -1);
      g.moveTo(px, py); g.lineTo(px + ll * 0.45 * (out >= 0 ? 1 : -1) + dx, py + ll * 0.8);
      g.moveTo(px, py); g.lineTo(px - ll * 0.25 * (out >= 0 ? 1 : -1) + dx, py + ll * 0.9);
    }
    g.stroke();
  }
  if (detail) { g.fillStyle = '#5D6B2A'; [[-0.04, 0.05], [0.03, 0.06], [0, 0.085], [0.05, 0.03]].forEach(([dx, dy]) => { g.beginPath(); g.arc(tx + dx * H, ty + dy * H, H * 0.028, 0, TAU); g.fill(); }); }
}
/* a Malay house on stilts: the gable end facing us, the long side going back, a steep roof, shuttered windows,
   carved vents and steps up to the door. s: the width of the gable end */
function kampungHouse(g, x, base, s, R, paint, roofCol) {
  const lift = s * 0.36, wallH = s * 0.48, depth = s * 0.62, dx = depth * 0.8, dy = -depth * 0.28, floor = base - lift, eave = floor - wallH, ridge = eave - s * 0.55;
  const wall = paint, wallSide = mixHex(paint, '#3A2A1E', 0.35);
  // stilts
  g.fillStyle = '#3E2C1E';
  for (let k = 0; k <= 4; k++) { const px = x + s * (0.04 + k * 0.23); g.fillRect(px, floor - 2, s * 0.045, lift + 2); }
  for (let k = 1; k <= 3; k++) { const px = x + s + dx * k / 3; g.fillRect(px - s * 0.02, floor + dy * k / 3 - 2, s * 0.04, lift + 2 - dy * k / 3 * 0.2); }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + s * 0.7, base + 1, s * 0.9, s * 0.06, 0, 0, TAU); g.fill();
  // the long side, going back
  g.fillStyle = wallSide; g.beginPath(); g.moveTo(x + s, floor); g.lineTo(x + s + dx, floor + dy); g.lineTo(x + s + dx, eave + dy); g.lineTo(x + s, eave); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = Math.max(0.5, s * 0.006);
  for (let k = 1; k < 9; k++) { const px = x + s + dx * k / 9; g.beginPath(); g.moveTo(px, floor + dy * k / 9); g.lineTo(px, eave + dy * k / 9); g.stroke(); }
  [0.3, 0.68].forEach((f) => { const px = x + s + dx * f; g.fillStyle = '#2A1E16'; g.beginPath(); g.moveTo(px, floor + dy * f - wallH * 0.2); g.lineTo(px + dx * 0.16, floor + dy * (f + 0.16) - wallH * 0.2); g.lineTo(px + dx * 0.16, floor + dy * (f + 0.16) - wallH * 0.72); g.lineTo(px, floor + dy * f - wallH * 0.72); g.fill(); });
  // the roof's long slope
  g.fillStyle = mixHex(roofCol, '#000000', 0.12); g.beginPath(); g.moveTo(x + s / 2, ridge); g.lineTo(x + s / 2 + dx * 1.08, ridge + dy * 1.08); g.lineTo(x + s * 1.1 + dx * 1.08, eave + s * 0.04 + dy * 1.08); g.lineTo(x + s * 1.1, eave + s * 0.04); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = Math.max(0.5, s * 0.008);
  for (let k = 1; k < 10; k++) { const f = k / 10; g.beginPath(); g.moveTo(x + s / 2 + dx * 1.08 * f, ridge + dy * 1.08 * f); g.lineTo(x + s * 1.1 + dx * 1.08 * f, eave + s * 0.04 + dy * 1.08 * f); g.stroke(); }
  // the gable end: wall, then the triangle with its carved vent, then the roof's edge boards
  const wg = g.createLinearGradient(x, eave, x, floor); wg.addColorStop(0, mixHex(wall, '#FFFFFF', 0.08)); wg.addColorStop(1, mixHex(wall, '#000000', 0.12));
  g.fillStyle = wg; g.fillRect(x, eave, s, wallH);
  g.beginPath(); g.moveTo(x - s * 0.02, eave); g.lineTo(x + s / 2, ridge + s * 0.05); g.lineTo(x + s * 1.02, eave); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.14)';
  for (let k = 1; k < 12; k++) { const px = x + s * k / 12; g.beginPath(); g.moveTo(px, floor); g.lineTo(px, eave + (Math.abs(px - x - s / 2) < s / 2 ? 0 : 0)); g.stroke(); }
  g.fillStyle = 'rgba(40,25,15,.75)';                               // the carved vent under the ridge
  for (let k = 0; k < 7; k++) { g.fillRect(x + s / 2 + (k - 3) * s * 0.04 - s * 0.008, eave - s * 0.16, s * 0.016, s * 0.06); }
  g.strokeStyle = '#F2E6CF'; g.lineWidth = Math.max(1, s * 0.022); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s * 0.1, eave + s * 0.05); g.lineTo(x + s / 2, ridge); g.lineTo(x + s * 1.1, eave + s * 0.05); g.stroke();
  g.fillStyle = roofCol; g.beginPath(); g.moveTo(x - s * 0.1, eave + s * 0.05); g.lineTo(x + s / 2, ridge - s * 0.02); g.lineTo(x + s / 2 + s * 0.02, ridge + s * 0.03); g.lineTo(x - s * 0.06, eave + s * 0.075); g.fill();
  g.beginPath(); g.moveTo(x + s * 1.1, eave + s * 0.05); g.lineTo(x + s / 2, ridge - s * 0.02); g.lineTo(x + s / 2 - s * 0.02, ridge + s * 0.03); g.lineTo(x + s * 1.06, eave + s * 0.075); g.fill();
  // a door with open shutters, two windows, the steps
  g.fillStyle = '#2A1C14'; g.fillRect(x + s * 0.4, floor - wallH * 0.82, s * 0.2, wallH * 0.82);
  g.fillStyle = 'rgba(255,214,150,.55)'; g.fillRect(x + s * 0.43, floor - wallH * 0.78, s * 0.14, wallH * 0.3);
  [[0.1, 0.24], [0.68, 0.24]].forEach(([fx, fw]) => {
    g.fillStyle = '#2A1C14'; g.fillRect(x + s * fx, floor - wallH * 0.78, s * fw * 0.95, wallH * 0.5);
    g.fillStyle = mixHex(wall, '#000000', 0.25); g.fillRect(x + s * (fx - 0.07), floor - wallH * 0.8, s * 0.07, wallH * 0.54); g.fillRect(x + s * (fx + fw * 0.95), floor - wallH * 0.8, s * 0.07, wallH * 0.54);
  });
  g.fillStyle = '#4A3424'; g.fillRect(x + s * 0.36, floor - s * 0.02, s * 0.28, s * 0.03);
  for (let k = 0; k < 4; k++) g.fillRect(x + s * (0.38 + k * 0.012), floor + k * lift / 4, s * (0.24 - k * 0.024), s * 0.022);
  g.fillStyle = '#3E2C1E'; g.fillRect(x + s * 0.36, floor, s * 0.02, lift); g.fillRect(x + s * 0.62, floor, s * 0.02, lift);
}
/* an east-coast fishing boat (a perahu), brightly painted, pulled up on the sand. s: its length */
function perahu(g, x, base, s, tilt, R) {
  g.save(); g.translate(x, base); g.rotate(tilt);
  const hull = (top, bot) => { g.beginPath(); g.moveTo(-s * 0.5, -s * 0.2); g.quadraticCurveTo(-s * 0.44, top, -s * 0.3, -s * 0.06); g.lineTo(s * 0.3, -s * 0.06); g.quadraticCurveTo(s * 0.44, top, s * 0.5, -s * 0.22); g.quadraticCurveTo(s * 0.35, bot, 0, bot); g.quadraticCurveTo(-s * 0.35, bot, -s * 0.5, -s * 0.2); g.closePath(); };
  const cols = [['#C8322B', '#F2C230', '#2F7D4A'], ['#2E66B5', '#F2F2EA', '#D9452B'], ['#2F8F5A', '#F2C230', '#B8302A']][Math.floor(R() * 3)];
  g.fillStyle = cols[0]; hull(-s * 0.04, s * 0.04); g.fill();
  g.save(); hull(-s * 0.04, s * 0.04); g.clip();
  g.fillStyle = cols[1]; g.fillRect(-s * 0.6, -s * 0.07, s * 1.2, s * 0.03);
  g.fillStyle = cols[2]; g.fillRect(-s * 0.6, -s * 0.035, s * 1.2, s * 0.025);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-s * 0.6, 0, s * 1.2, s * 0.06);
  g.restore();
  g.fillStyle = cols[1]; g.beginPath(); g.moveTo(s * 0.48, -s * 0.21); g.quadraticCurveTo(s * 0.56, -s * 0.33, s * 0.6, -s * 0.3); g.quadraticCurveTo(s * 0.54, -s * 0.24, s * 0.5, -s * 0.17); g.fill();   // the carved bow
  g.fillStyle = '#5A3A26'; g.fillRect(-s * 0.08, -s * 0.2, s * 0.02, s * 0.15);
  g.restore();
  g.fillStyle = 'rgba(60,45,25,.25)'; g.beginPath(); g.ellipse(x, base + s * 0.06, s * 0.5, s * 0.05, tilt, 0, TAU); g.fill();
}

/* a leafy bush: a few overlapping clumps, darker underneath and catching the light on top */
function bush(g, x, y, s, R) {
  for (let k = 0; k < 5; k++) {
    const bx = x + (R() - 0.5) * s * 1.1, by = y - s * (0.2 + R() * 0.35), r = s * (0.32 + R() * 0.25);
    g.fillStyle = k % 2 ? '#2D6328' : '#376F2C'; g.beginPath(); g.ellipse(bx, by, r * 1.15, r * 0.85, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(150,205,95,.28)'; g.beginPath(); g.ellipse(bx - r * 0.25, by - r * 0.35, r * 0.6, r * 0.38, -0.3, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(20,40,15,.35)'; g.beginPath(); g.ellipse(x, y, s * 0.8, s * 0.12, 0, 0, TAU); g.fill();
}
export function makeCoast() {
  return {
    key: '', land: null, hz: 0, gy: 0, palms: [], floodLevel: 0,
    /* the waterline and the back of the beach: x at depth u (0 at the horizon, 1 at the bottom of the screen) */
    wl(u) { return lerp(this.wx0, this.wx1, Math.pow(u, 1.15)) + Math.sin(u * Math.PI) * this.w * 0.05; },
    vl(u) { return lerp(this.wx0 - this.w * 0.01, this.vx1, Math.pow(u, 1.1)) + Math.sin(u * Math.PI) * this.w * 0.03; },
    yAt(u) { return this.hz + (this.h - this.hz) * u; },
    build(w, h, top, fb, m) {
      const key = [w, h, top, Math.round(fb), DPR(), m.m].join('|');
      if (key === this.key) return;
      this.key = key; this.w = w; this.h = h;
      const sm = view.small, R = seeded(7303), rain = m.rain, ne = m.s === 'ne';
      const hz = this.hz = Math.round(top + (fb - top) * (sm ? 0.34 : 0.4));
      this.wx0 = w * (sm ? 0.3 : 0.34); this.wx1 = w * (sm ? 0.98 : 0.9); this.vx1 = w * (sm ? 0.42 : 0.47);
      const A = sheet(w, h), g = A.g, dim = clamp(rain * 1.1, 0, 1), haze = sm ? '#9FB0B8' : '#A6B6BE';
      const yAt = (u) => this.yAt(u), span = h - hz;
      // far hills along the coast, behind the land
      g.fillStyle = mixHex('#6F8C88', haze, 0.45);
      g.beginPath(); g.moveTo(-10, hz + 1);
      for (let x = -10; x <= this.wx0 + 20; x += 8) g.lineTo(x, hz - (fb - top) * (0.035 + 0.03 * noise(x * 0.012, 4.2)) * (1 - x / (this.wx0 + 30)));
      g.lineTo(this.wx0 + 20, hz + 1); g.fill();
      // the land
      const lg = g.createLinearGradient(0, hz, 0, h); lg.addColorStop(0, mixHex('#5E8462', haze, 0.5)); lg.addColorStop(0.25, '#4E7E3C'); lg.addColorStop(1, '#2F5E26');
      g.fillStyle = lg; g.beginPath(); g.moveTo(-5, hz);
      for (let u = 0; u <= 1.0001; u += 0.02) g.lineTo(this.vl(u), yAt(u));
      g.lineTo(-5, h); g.closePath(); g.fill();
      g.save(); g.clip();
      for (let i = 0; i < (sm ? 500 : 1100); i++) {                 // grass, bigger close by
        const u = Math.pow(R(), 0.6), y = yAt(u), x = R() * this.vl(u), L = 2 + u * 9;
        g.strokeStyle = R() < 0.5 ? 'rgba(120,170,80,.35)' : 'rgba(25,55,20,.35)'; g.lineWidth = 0.6 + u; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * L * 0.6, y - L); g.stroke();
      }
      g.fillStyle = 'rgba(150,120,80,.5)'; g.beginPath(); g.moveTo(this.vl(0.35) - 6, yAt(0.35)); g.quadraticCurveTo(this.vl(0.6) - w * 0.08, yAt(0.62), w * 0.03, h); g.lineTo(w * 0.12, h); g.quadraticCurveTo(this.vl(0.6) - w * 0.03, yAt(0.62), this.vl(0.35) - 2, yAt(0.35)); g.fill();   // a sandy path
      g.restore();
      // the beach: dry sand at the back, wet and shining near the water
      const sg = g.createLinearGradient(0, hz, 0, h); sg.addColorStop(0, mixHex('#D9CDB0', haze, 0.4)); sg.addColorStop(0.3, '#E6D3A6'); sg.addColorStop(1, '#E9D2A0');
      g.fillStyle = sg; g.beginPath();
      for (let u = 0; u <= 1.0001; u += 0.02) g[u ? 'lineTo' : 'moveTo'](this.vl(u), yAt(u));
      for (let u = 1; u >= -0.0001; u -= 0.02) g.lineTo(this.wl(u), yAt(u));
      g.closePath(); g.fill();
      g.save(); g.clip();
      for (let i = 0; i < (sm ? 700 : 1500); i++) { const u = Math.pow(R(), 0.7), x = lerp(this.vl(u), this.wl(u), R()), y = yAt(u); g.fillStyle = R() < 0.5 ? 'rgba(170,140,90,.35)' : 'rgba(255,250,235,.4)'; g.fillRect(x, y, 0.6 + u * 1.4, 0.6 + u * 1.2); }
      const wet = (f, col) => { g.fillStyle = col; g.beginPath(); for (let u = 0; u <= 1.0001; u += 0.02) g[u ? 'lineTo' : 'moveTo'](lerp(this.wl(u), this.vl(u), f), yAt(u)); for (let u = 1; u >= -0.0001; u -= 0.02) g.lineTo(this.wl(u) + 2, yAt(u)); g.closePath(); g.fill(); };
      wet(0.3, 'rgba(176,150,105,.35)');                                // damp sand
      wet(0.16, 'rgba(150,170,175,.35)');                               // wet sand, shining with the sky
      g.restore();
      // a fringe of trees along the back of the beach, shrinking into the distance
      for (let i = 0; i < (sm ? 26 : 46); i++) {
        const u = 0.012 + Math.pow(i / (sm ? 26 : 46), 1.8) * 0.5, y = yAt(u), s = (6 + u * 150) * (0.8 + R() * 0.4) * (sm ? 0.75 : 1), x = this.vl(u) - s * (0.1 + R() * 0.5);
        if (u < 0.18 && R() < 0.4) { g.fillStyle = mixHex('#1E4A26', haze, 0.5 * (1 - u * 2)); g.beginPath(); g.ellipse(x, y - s * 0.3, s * 0.5, s * 0.3, 0, 0, TAU); g.fill(); }
        else coconutPalm(g, x, y, s * 1.4, (R() - 0.5) * 0.25, 0, u < 0.2, false);
      }
      // in the wettest weeks the low land floods: this is why the houses stand on stilts
      if (rain > 0.9) {
        const lv = yAt(0.08);
        g.save(); g.beginPath(); g.moveTo(-5, hz); for (let u = 0; u <= 1.0001; u += 0.02) g.lineTo(this.vl(u) - 3, yAt(u)); g.lineTo(-5, h); g.closePath(); g.clip();
        const fg = g.createLinearGradient(0, lv, 0, h); fg.addColorStop(0, '#A3A9AB'); fg.addColorStop(0.25, '#848470'); fg.addColorStop(1, '#5B5542');
        g.fillStyle = fg; g.fillRect(-5, lv, w, h - lv);
        for (let i = 0; i < 90; i++) {                               // the grey sky mirrored in it, broken up by ripples
          const u = 0.08 + Math.pow(R(), 0.8) * 0.92, y = yAt(u), x = R() * (this.vl(u) + 20), L = 8 + u * 70;
          g.strokeStyle = R() < 0.6 ? 'rgba(200,206,206,.3)' : 'rgba(40,36,26,.25)'; g.lineWidth = 0.8 + u * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke();
        }
        g.restore();
        this.floodLevel = lv;
      } else this.floodLevel = 0;
      // the kampung, among more palms, back from the beach
      const houses = sm ? [[0.2, 0.5], [0.34, 0.12]] : [[0.16, 0.62], [0.26, 0.3], [0.4, 0.66]];
      houses.forEach(([u, fx], i) => {
        const y = yAt(u), s = (sm ? 26 : 34) + u * span * 0.36, x = this.vl(u) * fx - s * 0.5;
        for (let j = 0; j < 3; j++) { const pu = u - 0.03 + j * 0.02, px = x + s * (j === 1 ? 1.9 : -0.4 + j * 0.3) + (R() - 0.5) * s * 0.4; coconutPalm(g, px, yAt(pu), s * (1.45 + R() * 0.5), (R() - 0.5) * 0.3, 0, false, false); }
        kampungHouse(g, x, y, s, R, ['#B7C9C4', '#D8C9A0', '#C99A5B'][i % 3], ['#9A4B32', '#A24A2E', '#7A6650'][i % 3]);
        if (this.floodLevel) { g.fillStyle = 'rgba(40,30,20,.28)'; for (let k = 0; k <= 4; k++) g.fillRect(x + s * (0.04 + k * 0.23), y, s * 0.045, s * 0.28); g.fillStyle = 'rgba(60,45,30,.18)'; g.fillRect(x - s * 0.05, y + s * 0.02, s * 1.5, s * 0.05); }
      });
      for (let i = 0; i < (sm ? 6 : 11); i++) {                      // bushes along the edge of the land
        const u = 0.25 + R() * 0.75, y = yAt(u) + 2, x = this.vl(u) - (8 + R() * 140) * (0.4 + u), s = 8 + u * span * (0.05 + R() * 0.05);
        bush(g, x, y, s, R);
      }
      // the boats: pulled up on the sand while the northeast monsoon blows, out at sea the rest of the year
      if (ne && rain > 0.4) {
        [[0.42, 0.5, -0.06], [0.62, 0.42, 0.05]].forEach(([u, f, tl]) => { const y = yAt(u), s = 24 + u * span * 0.32; perahu(g, lerp(this.vl(u), this.wl(u), f), y, s, tl, R); });
      } else {
        const u = 0.06, y = yAt(u) - 2, x = this.wl(u) + w * 0.12, s = 18 + (sm ? 0 : 8);
        g.fillStyle = '#2B2F36'; g.beginPath(); g.moveTo(x - s * 0.5, y - s * 0.12); g.lineTo(x + s * 0.5, y - s * 0.14); g.lineTo(x + s * 0.36, y); g.lineTo(x - s * 0.4, y); g.fill(); g.fillRect(x - s * 0.1, y - s * 0.4, s * 0.25, s * 0.28);
      }
      // a darker day in the rainy months
      if (dim > 0.05) { g.fillStyle = 'rgba(40,52,66,' + (dim * 0.32).toFixed(3) + ')'; g.fillRect(0, hz - (fb - top) * 0.1, w, h); }
      this.land = A.c;
      // the big palms close by, which move: their places
      this.palms = (sm ? [[0.62, 0.6, 0.85], [0.9, 0.14, 1.2]] : [[0.55, 0.66, 0.75], [0.72, 0.38, 1.0], [0.95, 0.1, 1.35], [0.82, 0.84, 0.95]]).map(([u, fx, k]) => ({ x: this.vl(u) * fx, y: yAt(u) + 2, H: span * (sm ? 0.62 : 0.66) * k * (0.4 + u * 0.6), lean: 0.06 + R() * 0.08, ph: R() * 6 }));
    },
    draw(ctx, w, h, t, wind, rain) {
      ctx.drawImage(this.land, 0, 0, w, h);
      // the waves running up the beach and back
      const yAt = (u) => this.yAt(u), big = clamp(0.4 + rain, 0.4, 1.3);
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.32 + k / 3) % 1, run = Math.sin(ph * Math.PI) * big, a = (1 - ph) * 0.6;
        const at = (u) => { const wd = this.wl(u) - this.vl(u); return [this.wl(u) - run * wd * 0.16 + Math.sin(u * 40 + t * 2 + k) * 1.5 * u, yAt(u)]; };
        ctx.strokeStyle = 'rgba(250,252,255,' + a.toFixed(3) + ')'; ctx.lineWidth = (1 + k * 0.5) * 1.3; ctx.beginPath();
        for (let u = 0.04; u < 1; u += 0.02) { if (noise(u * 14 + k * 7.3, ph * 3 + k) < 0.42) continue; const p0 = at(u), p1 = at(u + 0.02); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
        ctx.stroke();
      }
      for (let k = 0; k < 3; k++) {                                     // waves lining up along the beach and rolling in, breaking in white patches
        const ph = (t * 0.16 + k / 3) % 1, d = (1 - ph) * 0.22, a = Math.sin(ph * Math.PI) * (0.3 + 0.45 * big);
        const at = (u) => [this.wl(u) + (6 + d * (this.wl(u) - this.vl(u))) * (0.4 + u), yAt(u) - d * u * 6];
        [[0.62, 1], [0.48, 0.45]].forEach(([cut, f]) => {
          ctx.strokeStyle = 'rgba(240,248,252,' + (a * f).toFixed(3) + ')'; ctx.lineWidth = (1 + ph * 2.5) * (cut > 0.5 ? 1.4 : 0.8); ctx.beginPath();
          for (let u = 0.06; u < 1; u += 0.025) {
            const n = noise(u * 11 + k * 13.7, t * 0.25 + k * 3.1);
            if (n < cut || (cut < 0.5 && n >= 0.62)) continue;
            const p0 = at(u), p1 = at(u + 0.025); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
          }
          ctx.stroke();
        });
      }
      ctx.fillStyle = 'rgba(245,250,255,.5)'; ctx.beginPath();          // foam where the waves break
      for (let u = 0.03; u <= 1.0001; u += 0.02) ctx.lineTo(this.wl(u) + 2 + 4 * u, yAt(u));
      for (let u = 1; u >= 0.03; u -= 0.02) ctx.lineTo(this.wl(u) + (6 + 26 * u) * big * (0.75 + 0.25 * Math.sin(t * 1.3 + u * 9)), yAt(u));
      ctx.fill();
      // the palms close by, bending with the wind
      this.palms.forEach((p) => {
        if (this.floodLevel && p.x < this.vl((p.y - this.hz) / (h - this.hz))) { ctx.fillStyle = 'rgba(45,35,22,.3)'; ctx.fillRect(p.x - p.H * 0.03, p.y, p.H * 0.06, p.H * 0.28); }
        coconutPalm(ctx, p.x, p.y, p.H, p.lean + wind * 0.08, wind * 0.35 + Math.sin(t * (1.3 + Math.abs(wind)) + p.ph) * (0.03 + 0.05 * rain), false, true);
      });
    }
  };
}

/* ======================= the blizzard: a log cabin in the mountains ======================= */
/* a range of snowy mountains: lit faces towards the light, shaded faces, rock showing in the gullies */
function mountains(g, w, base, top, R, cols, n) {
  const pk = [], step = w / n;
  for (let i = -1; i <= n + 1; i++) pk.push([i * step + (R() - 0.5) * step * 0.5, top + (base - top) * (R() * 0.5), (R() - 0.5)]);
  const vy = (a, b) => Math.max(a[1], b[1]) + (base - Math.max(a[1], b[1])) * (0.35 + R() * 0.3);
  const val = []; for (let i = 0; i < pk.length - 1; i++) val.push([(pk[i][0] + pk[i + 1][0]) / 2 + (R() - 0.5) * step * 0.2, vy(pk[i], pk[i + 1])]);
  g.fillStyle = cols.shade; g.beginPath(); g.moveTo(-20, base + 1);
  for (let i = 0; i < pk.length; i++) { g.lineTo(pk[i][0], pk[i][1]); if (val[i]) g.lineTo(val[i][0], val[i][1]); }
  g.lineTo(w + 20, base + 1); g.closePath(); g.fill();
  for (let i = 1; i < pk.length - 1; i++) {                          // the lit face of each peak: from the peak, down its left ridge, back up a jagged spine
    const [px, py] = pk[i], L = val[i - 1], Rv = val[i], sx = px + (Rv[0] - px) * (0.18 + R() * 0.2);
    g.fillStyle = cols.lit; g.beginPath(); g.moveTo(px, py); g.lineTo(L[0], L[1]); g.lineTo(L[0] + (px - L[0]) * 0.2, base + 1);
    const steps = 7; for (let k = steps; k >= 0; k--) { const f = k / steps; g.lineTo(lerp(px, sx, f) + (k && k < steps ? (R() - 0.5) * step * 0.08 : 0), lerp(py, base + 1, f)); }
    g.closePath(); g.fill();
    g.strokeStyle = cols.rock; g.lineWidth = Math.max(0.8, step * 0.01);
    for (let k = 0; k < 5; k++) { const f = 0.35 + R() * 0.5, gx = lerp(px, Rv[0], 0.2 + R() * 0.6), gy = lerp(py, base, f); g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + step * 0.04 * (R() - 0.3), gy + (base - py) * 0.12); g.stroke(); }
    g.strokeStyle = 'rgba(245,248,252,.45)'; g.lineWidth = Math.max(0.8, step * 0.012);          // snow lying in the gullies of the shaded face
    for (let k = 0; k < 6; k++) { const f = 0.1 + R() * 0.55, gx = lerp(px, Rv[0], 0.12 + R() * 0.7), gy = lerp(py, base, f) + (R() - 0.5) * 4; g.beginPath(); g.moveTo(gx, gy); g.quadraticCurveTo(gx + step * 0.02, gy + (base - py) * 0.1, gx + step * 0.05 * (R() - 0.2), gy + (base - py) * (0.15 + R() * 0.15)); g.stroke(); }
    g.strokeStyle = 'rgba(150,168,195,.3)'; g.lineWidth = Math.max(0.6, step * 0.008);            // and soft shadows of the ridges on the lit face
    for (let k = 0; k < 4; k++) { const f = 0.15 + R() * 0.5, gx = lerp(L[0], px, 0.3 + R() * 0.6), gy = lerp(py, base, f); g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx - step * 0.06, gy + (base - py) * 0.14); g.stroke(); }
  }
}
/* a spruce heavy with snow: tiers of drooping branches, snow lying on each */
function spruce(g, x, base, H, R, col, snowy) {
  const tiers = 8, W = H * 0.36;
  g.fillStyle = '#3A2A20'; g.fillRect(x - H * 0.02, base - H * 0.08, H * 0.04, H * 0.09);
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers, ty = base - H * 0.08 - (H * 0.86) * f, wd = W * (1 - f * 0.88), dr = H * 0.11 * (1 - f * 0.4), top = ty - H * 0.13;
    g.fillStyle = col; g.beginPath(); g.moveTo(x, top);
    g.quadraticCurveTo(x - wd * 0.45, ty - dr * 0.6, x - wd, ty + dr * 0.15);
    for (let k = 0; k <= 6; k++) g.lineTo(x - wd + wd * 2 * k / 6, ty + (k % 2 ? dr * 0.05 : dr * 0.2) + Math.sin(k) * dr * 0.05);
    g.quadraticCurveTo(x + wd * 0.45, ty - dr * 0.6, x, top); g.fill();
    if (snowy) {
      g.fillStyle = '#F4F7FB'; g.beginPath(); g.moveTo(x, top + dr * 0.1);
      g.quadraticCurveTo(x - wd * 0.42, ty - dr * 0.55, x - wd * 0.92, ty + dr * 0.02);
      g.quadraticCurveTo(x - wd * 0.4, ty - dr * 0.2, x, ty - dr * 0.35 + (R() - 0.5) * dr * 0.2);
      g.quadraticCurveTo(x + wd * 0.4, ty - dr * 0.2, x + wd * 0.92, ty + dr * 0.02);
      g.quadraticCurveTo(x + wd * 0.42, ty - dr * 0.55, x, top + dr * 0.1); g.fill();
      g.fillStyle = 'rgba(150,170,200,.35)'; g.beginPath(); g.ellipse(x + wd * 0.3, ty - dr * 0.12, wd * 0.45, dr * 0.12, 0, 0, TAU); g.fill();
    }
  }
  g.fillStyle = snowy ? '#F4F7FB' : col; g.beginPath(); g.moveTo(x, base - H); g.lineTo(x - H * 0.025, base - H * 0.9); g.lineTo(x + H * 0.025, base - H * 0.9); g.fill();
}
/* a log cabin, snowed in: the gable end facing us, the long side going back, a deep cap of snow on the roof with
   icicles, a stone chimney, warm windows; returns where the smoke comes out */
function cabin(g, x, base, s, R) {
  const wallH = s * 0.5, depth = s * 0.9, dx = depth * 0.78, dy = -depth * 0.22, eave = base - wallH, ridge = eave - s * 0.42, log = s * 0.055;
  const logs = (x0, y0, x1, y1, h0, shade) => {                       // horizontal logs on a wall from (x0,y0) to (x1,y1), h0 high
    for (let k = 0, y = 0; y < h0; k++, y += log) {
      g.fillStyle = shade ? (k % 2 ? '#5B3A22' : '#654127') : (k % 2 ? '#7A4E2D' : '#86573A');
      g.beginPath(); g.moveTo(x0, y0 - y); g.lineTo(x1, y1 - y); g.lineTo(x1, y1 - Math.min(h0, y + log)); g.lineTo(x0, y0 - Math.min(h0, y + log)); g.fill();
      g.strokeStyle = 'rgba(30,18,10,.45)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(x0, y0 - y); g.lineTo(x1, y1 - y); g.stroke();
      g.strokeStyle = 'rgba(255,220,180,.12)'; g.beginPath(); g.moveTo(x0, y0 - y - log * 0.75); g.lineTo(x1, y1 - y - log * 0.75); g.stroke();
    }
  };
  logs(x + s, base, x + s + dx, base + dy, wallH, true);             // the long side
  const cx = x + s + dx * 0.55, cy = base + dy * 0.55;               // the chimney, on the long side
  g.fillStyle = '#6F6A66'; g.fillRect(cx - s * 0.07, ridge + dy * 0.55 - s * 0.16, s * 0.14, (cy - (ridge + dy * 0.55 - s * 0.16)));
  g.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 0; k < 9; k++) g.fillRect(cx - s * 0.07 + (k % 2) * s * 0.05, ridge + dy * 0.55 - s * 0.12 + k * s * 0.05, s * 0.07, s * 0.008);
  g.fillStyle = '#F3F6FA'; g.beginPath(); g.ellipse(cx, ridge + dy * 0.55 - s * 0.165, s * 0.09, s * 0.035, 0, 0, TAU); g.fill();
  const smoke = [cx, ridge + dy * 0.55 - s * 0.2];
  // the roof's long slope, deep in snow
  const rs = g.createLinearGradient(0, ridge, 0, eave); rs.addColorStop(0, '#FBFCFE'); rs.addColorStop(1, '#D6E0EC');
  g.fillStyle = rs; g.beginPath(); g.moveTo(x + s / 2, ridge - s * 0.06); g.lineTo(x + s / 2 + dx * 1.06, ridge - s * 0.06 + dy * 1.06); g.lineTo(x + s * 1.14 + dx * 1.06, eave + s * 0.02 + dy * 1.06); g.lineTo(x + s * 1.14, eave + s * 0.02); g.closePath(); g.fill();
  g.fillStyle = '#F3F6FA'; g.beginPath(); g.moveTo(cx - s * 0.1, ridge + dy * 0.55 - s * 0.02); g.quadraticCurveTo(cx, ridge + dy * 0.55 - s * 0.12, cx + s * 0.1, ridge + dy * 0.55 + s * 0.02); g.fill();
  // the gable end, in logs, with the windows and the door
  logs(x, base, x + s, base, wallH, false);
  g.fillStyle = '#7A4E2D'; g.beginPath(); g.moveTo(x, eave); g.lineTo(x + s / 2, ridge + s * 0.04); g.lineTo(x + s, eave); g.fill();
  for (let k = 1; k < 7; k++) { const y = eave - k * log; if (y < ridge + s * 0.06) break; const half = s / 2 * (1 - (eave - y) / (eave - ridge - s * 0.04)); g.strokeStyle = 'rgba(30,18,10,.45)'; g.beginPath(); g.moveTo(x + s / 2 - half, y); g.lineTo(x + s / 2 + half, y); g.stroke(); }
  g.fillStyle = '#4A2E1A'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(x, base - log * 0.5 - k * log, log * 0.55, 0, TAU); g.fill(); g.beginPath(); g.arc(x + s, base - log * 0.5 - k * log, log * 0.55, 0, TAU); g.fill(); }
  g.fillStyle = '#C69A6C'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(x, base - log * 0.5 - k * log, log * 0.3, 0, TAU); g.fill(); g.beginPath(); g.arc(x + s, base - log * 0.5 - k * log, log * 0.3, 0, TAU); g.fill(); }
  const win = (wx, wy, ww, wh) => {
    g.fillStyle = '#3B2414'; g.fillRect(wx - s * 0.015, wy - s * 0.015, ww + s * 0.03, wh + s * 0.03);
    const lg = g.createLinearGradient(wx, wy, wx, wy + wh); lg.addColorStop(0, '#FFE2A0'); lg.addColorStop(1, '#F2A94E');
    g.fillStyle = lg; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = '#3B2414'; g.fillRect(wx + ww / 2 - s * 0.008, wy, s * 0.016, wh); g.fillRect(wx, wy + wh / 2 - s * 0.008, ww, s * 0.016);
    g.fillStyle = '#F3F6FA'; g.beginPath(); g.ellipse(wx + ww / 2, wy + wh + s * 0.012, ww * 0.62, s * 0.02, 0, 0, TAU); g.fill();
  };
  win(x + s * 0.1, eave + wallH * 0.28, s * 0.2, s * 0.17); win(x + s * 0.7, eave + wallH * 0.28, s * 0.2, s * 0.17);
  g.fillStyle = '#4A2C18'; g.fillRect(x + s * 0.38, base - wallH * 0.78, s * 0.24, wallH * 0.78);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(0.6, s * 0.006); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + s * (0.38 + k * 0.06), base - wallH * 0.78); g.lineTo(x + s * (0.38 + k * 0.06), base); g.stroke(); }
  g.fillStyle = '#E8B04A'; g.beginPath(); g.arc(x + s * 0.57, base - wallH * 0.4, s * 0.012, 0, TAU); g.fill();
  // the front of the roof: a thick edge of snow, overhanging, with icicles
  g.fillStyle = '#5B3A22'; g.beginPath(); g.moveTo(x - s * 0.12, eave + s * 0.03); g.lineTo(x + s / 2, ridge - s * 0.02); g.lineTo(x + s * 1.12, eave + s * 0.03); g.lineTo(x + s * 1.08, eave + s * 0.06); g.lineTo(x + s / 2, ridge + s * 0.03); g.lineTo(x - s * 0.08, eave + s * 0.06); g.fill();
  g.fillStyle = '#F7F9FC'; g.beginPath(); g.moveTo(x - s * 0.15, eave + s * 0.035);
  g.quadraticCurveTo(x - s * 0.05, ridge + s * 0.12, x + s / 2, ridge - s * 0.1); g.quadraticCurveTo(x + s * 1.05, ridge + s * 0.12, x + s * 1.15, eave + s * 0.035);
  g.quadraticCurveTo(x + s * 1.1, eave + s * 0.07, x + s * 1.04, eave + s * 0.04); g.lineTo(x + s / 2, ridge - s * 0.03); g.lineTo(x - s * 0.04, eave + s * 0.04); g.quadraticCurveTo(x - s * 0.1, eave + s * 0.07, x - s * 0.15, eave + s * 0.035); g.fill();
  g.fillStyle = 'rgba(220,235,250,.9)';
  for (let k = 0; k < 9; k++) { const f = (k + 0.5) / 9, ix = x + s * 1.14 + dx * f * 1.04, iy = eave + s * 0.03 + dy * f * 1.04, L = s * (0.03 + R() * 0.06); g.beginPath(); g.moveTo(ix - s * 0.012, iy); g.lineTo(ix + s * 0.012, iy); g.lineTo(ix, iy + L); g.fill(); }
  // snow banked against the walls, and the warm light on it
  g.fillStyle = '#EEF2F8'; g.beginPath(); g.moveTo(x - s * 0.1, base + 2); g.quadraticCurveTo(x + s * 0.2, base - s * 0.1, x + s * 0.36, base - s * 0.02); g.lineTo(x + s * 0.64, base - s * 0.02); g.quadraticCurveTo(x + s * 0.8, base - s * 0.1, x + s * 1.06 + dx * 0.4, base + dy * 0.4 + 2); g.lineTo(x + s * 1.06, base + 4); g.fill();
  [[0.2, 0.12], [0.8, 0.12], [0.5, 0.16]].forEach(([fx, r]) => { const cy = base + s * 0.05, gl = g.createRadialGradient(x + s * fx, cy, 0, x + s * fx, cy, s * r * 1.4); gl.addColorStop(0, 'rgba(255,200,120,.3)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); g.save(); g.translate(x + s * fx, cy); g.scale(1, 0.32); g.translate(-(x + s * fx), -cy); g.fillStyle = gl; g.fillRect(x + s * (fx - r * 1.4), cy - s * r * 1.4, s * r * 2.8, s * r * 2.8); g.restore(); });
  // a stack of firewood under the eave of the long side
  for (let k = 0; k < 10; k++) { const wx = x + s * 1.12 + (k % 5) * s * 0.06 + dx * 0.1, wy = base - s * 0.04 - Math.floor(k / 5) * s * 0.055 + dy * 0.1; g.fillStyle = '#6A4529'; g.beginPath(); g.arc(wx, wy, s * 0.03, 0, TAU); g.fill(); g.fillStyle = '#C9A174'; g.beginPath(); g.arc(wx, wy, s * 0.017, 0, TAU); g.fill(); }
  return smoke;
}
/* a wooden fence with snow on every post and rail; returns its posts */
function fence(g, x0, x1, y, S) {
  const posts = [], gap = 46 * S, ph = 34 * S;
  for (let x = x0; x <= x1; x += gap) posts.push(x);
  g.fillStyle = '#5E4636'; g.strokeStyle = '#5E4636';
  [0.35, 0.72].forEach((f) => { g.fillRect(x0, y - ph * f - 2 * S, x1 - x0, 3.2 * S); g.fillStyle = '#F3F6FA'; g.fillRect(x0, y - ph * f - 4 * S, x1 - x0, 2.2 * S); g.fillStyle = '#5E4636'; });
  posts.forEach((x) => {
    g.fillStyle = '#4E3A2C'; g.fillRect(x - 2.6 * S, y - ph, 5.2 * S, ph + 3);
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x - 2.6 * S, y - ph, 1.4 * S, ph);
    g.fillStyle = '#F6F8FB'; g.beginPath(); g.ellipse(x, y - ph - 1.5 * S, 4.4 * S, 3 * S, 0, 0, TAU); g.fill();
  });
  return posts;
}

export function makeSnowfield() {
  return {
    key: '', pic: null, hz: 0, smoke: [0, 0], fy: 0, fx0: 0, fx1: 0, puffs: [], wisps: [], puffSprite: null,
    build(w, h, top, fb) {
      const key = [w, h, top, Math.round(fb), DPR()].join('|');
      if (key === this.key) return;
      this.key = key;
      const sm = view.small, R = seeded(4409), span = fb - top, S = clamp(span / 640, 0.55, 1.4);
      const hz = this.hz = Math.round(top + span * (sm ? 0.42 : 0.48));
      const A = sheet(w, h), g = A.g;
      mountains(g, w, hz + 2, hz - span * 0.36, R, { shade: '#A9B6C8', lit: '#E9EFF6', rock: 'rgba(110,125,145,.4)' }, sm ? 3 : 5);
      const hg = g.createLinearGradient(0, hz - span * 0.36, 0, hz); hg.addColorStop(0, 'rgba(206,214,226,0)'); hg.addColorStop(1, 'rgba(206,214,226,.5)');
      g.fillStyle = hg; g.fillRect(0, hz - span * 0.36, w, span * 0.37);   // haze between the ranges
      mountains(g, w, hz + 2, hz - span * 0.2, R, { shade: '#7F8EA3', lit: '#E2E9F2', rock: 'rgba(70,80,96,.55)' }, sm ? 4 : 7);
      for (let i = 0; i < (sm ? 60 : 130); i++) {                      // the forest at the foot of the mountains
        const x = R() * w, s = (8 + R() * 10) * S, y = hz + 2 + R() * 6 * S;
        g.fillStyle = R() < 0.5 ? '#465A60' : '#3E5157'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x - s * 0.32, y); g.lineTo(x + s * 0.32, y); g.fill();
        g.fillStyle = 'rgba(240,245,250,.75)'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x - s * 0.12, y - s * 0.6); g.lineTo(x + s * 0.1, y - s * 0.66); g.fill();
      }
      // the snowfield: gentle drifts, blue in their shadows
      const sg = g.createLinearGradient(0, hz, 0, h); sg.addColorStop(0, '#E3EAF2'); sg.addColorStop(0.4, '#EEF2F7'); sg.addColorStop(1, '#DCE4EE');
      g.fillStyle = sg; g.fillRect(0, hz + 4, w, h - hz);
      for (let i = 0; i < 9; i++) {
        const y = hz + (h - hz) * (0.08 + i * 0.11), amp = 3 + i * 2.5;
        g.fillStyle = 'rgba(160,180,210,' + (0.1 + i * 0.012).toFixed(3) + ')'; g.beginPath(); g.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.006 + i * 1.7) * amp + Math.sin(x * 0.017 + i) * amp * 0.4);
        g.lineTo(w, y + amp * 3); g.lineTo(0, y + amp * 3); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath();
        for (let x = 0; x <= w; x += 16) g[x ? 'lineTo' : 'moveTo'](x, y - 1 + Math.sin(x * 0.006 + i * 1.7) * amp + Math.sin(x * 0.017 + i) * amp * 0.4);
        g.stroke();
      }
      // spruces in the middle distance
      const gy = hz + (fb - hz) * 0.16;
      for (let i = 0; i < (sm ? 5 : 9); i++) { const x = w * (sm ? 0.45 + i * 0.13 : 0.5 + i * 0.065) + (R() - 0.5) * 30 * S, H = (50 + R() * 40) * S; spruce(g, x, gy + R() * 8 * S, H, R, '#2C4A42', true); }
      for (let i = 0; i < (sm ? 2 : 4); i++) { const x = w * (0.02 + i * 0.06) + R() * 20, H = (60 + R() * 40) * S; spruce(g, x, gy + 4 * S, H, R, '#2C4A42', true); }
      // the cabin
      const cs = (sm ? 118 : 170) * S, cx = w * (sm ? 0.08 : 0.17), cb = hz + (fb - hz) * (sm ? 0.62 : 0.55);
      this.smoke = cabin(g, cx, cb, cs, R);
      // footprints from the door, across the snow
      g.fillStyle = 'rgba(150,170,200,.45)';
      for (let k = 0; k < 22; k++) { const f = k / 22, px = cx + cs * 0.5 + f * w * 0.32 + Math.sin(f * 5) * 18 * S, py = cb + 10 * S + f * f * (h - cb) * 0.9, r = (2 + f * 6) * S; g.beginPath(); g.ellipse(px + (k % 2 ? r : -r), py, r * 0.55, r * 0.3, 0, 0, TAU); g.fill(); }
      // the fence
      this.fy = Math.round(hz + (fb - hz) * (sm ? 0.8 : 0.74)); this.fx0 = w * (sm ? 0.5 : 0.46); this.fx1 = w * 0.97;
      fence(g, this.fx0, this.fx1, this.fy, S);
      // a big spruce close by, on the left
      if (!sm) spruce(g, w * 0.035, h + span * 0.08, span * 0.95, R, '#223C36', true);
      this.pic = A.c; this.S = S;
      this.puffs = Array.from({ length: 26 }, (_, i) => ({ x: 0, y: 0, a: 0, r: 0, t: i / 26 }));
      this.wisps = Array.from({ length: sm ? 7 : 12 }, () => ({ x: rnd(0, w), y: rnd(hz + 10, h), L: rnd(60, 180) * S, v: rnd(0.7, 1.3) }));
      if (!this.puffSprite) { const c = layer(64, 64), q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(235,238,242,.9)'); gr.addColorStop(0.6, 'rgba(225,230,236,.4)'); gr.addColorStop(1, 'rgba(225,230,236,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); this.puffSprite = c; }
    },
    draw(ctx, w, h, t, dt, wind, drift) {
      ctx.drawImage(this.pic, 0, 0, w, h);
      const S = this.S || 1;
      // smoke from the chimney, blown along by the wind
      this.puffs.forEach((p) => {
        p.t += dt * 0.22;
        if (p.t >= 1) p.t -= 1;
        const k = p.t, x = this.smoke[0] + k * (20 + wind * 6) * S * 4 + Math.sin(k * 6 + t) * 4 * S, y = this.smoke[1] - k * (70 - Math.min(60, wind * 0.7)) * S, r = (6 + k * 26) * S, a = (1 - k) * 0.55;
        ctx.globalAlpha = a; ctx.drawImage(this.puffSprite, x - r, y - r, r * 2, r * 2);
      });
      ctx.globalAlpha = 1;
      // the snow piling up against the fence in the wind
      if (drift > 0.01) {
        const y = this.fy + 3, x0 = this.fx0 - 20 * S, x1 = this.fx1, hgt = drift * 30 * S;
        const dg = ctx.createLinearGradient(0, y - hgt, 0, y); dg.addColorStop(0, '#FBFCFE'); dg.addColorStop(1, '#D9E2EE');
        ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(x0, y);
        for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, y - hgt * (0.65 + 0.35 * Math.sin(x * 0.02)) * clamp((x - x0) / (60 * S), 0, 1));
        ctx.lineTo(x1, y); ctx.fill();
      }
      // snow blowing along the ground in a strong wind
      if (wind > 25) {
        const a = clamp((wind - 25) / 50, 0, 1) * 0.35;
        this.wisps.forEach((p) => {
          p.x += wind * 6 * p.v * dt * S; if (p.x > w + p.L) { p.x = -p.L; p.y = rnd(this.hz + 10, h); }
          const gr = ctx.createLinearGradient(p.x - p.L, 0, p.x, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,' + a.toFixed(3) + ')');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(p.x - p.L / 2, p.y, p.L / 2, 3 + p.v * 3, 0, 0, TAU); ctx.fill();
        });
      }
    }
  };
}
