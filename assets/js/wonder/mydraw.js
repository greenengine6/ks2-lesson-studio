/* Drawing kit for the Wonders of Malaysia scenes, in the same flat-but-real style as the Seven Wonders: layered
   silhouettes that fade into the haze with distance, leaf masses with a soft leafy edge lit from one side, rock with
   its grain, and animals built from proper shapes (a tiger's deep chest and striped flank, an orangutan's long shaggy
   arms, a hornbill's casque) rather than stickers. Everything draws on the screen (y down); sizes are in pixels. */
import { TAU } from './util.js?v=cdc164df';
import { tint, dotGlow } from './scenery.js?v=cdc164df';

/* ---------------- small helpers ---------------- */
export const lerp = (a, b, k) => a + (b - a) * k;
export function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
export function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
export function rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
export const E = (g, x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
export const C = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
export const P = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
export const S = (g, x0, y0, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
export const Q = (g, x0, y0, cx, cy, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); };
/* a smooth closed path through points (Catmull-Rom made into curves); fill: also fill it */
export function smoothPath(g, pts) {
  const n = pts.length; g.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) g.moveTo(p1[0], p1[1]);
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  g.closePath();
}
export function blob(g, pts) { smoothPath(g, pts); g.fill(); }
/* an open smooth line through points */
export function curve(g, pts, w, col) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  const L = pts[pts.length - 1]; g.lineTo(L[0], L[1]); g.stroke();
}
/* a bumpy outline round an ellipse: the edge of a leaf mass, a cloud, a rock */
function bumpy(x, y, w, h, R, o) {
  o = o || {};
  const n = o.n || 46, f = [R() * TAU, R() * TAU, R() * TAU], k = o.rough == null ? 1 : o.rough, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, b = 1 + k * (0.07 * Math.sin(a * 5 + f[0]) + 0.05 * Math.sin(a * 9 + f[1]) + 0.04 * Math.sin(a * 17 + f[2]) + (R() - 0.5) * 0.06);
    const under = Math.sin(a) > 0 ? (o.flat == null ? 0.82 : o.flat) : 1;
    pts.push([x + Math.cos(a) * w / 2 * b, y + Math.sin(a) * h / 2 * b * under]);
  }
  return pts;
}
/* A soft band of haze, thickest at y1: what makes a far layer of forest or mountains fade into the distance. */
export function haze(g, w, y0, y1, col, a) { g.fillStyle = lin(g, 0, y0, 0, y1, [[0, rgba(col, 0)], [1, rgba(col, a)]]); g.fillRect(0, y0, w, y1 - y0); }

/* ---------------- plants ---------------- */
/* A mass of leaves (a tree crown, a bush): a leafy edge, clumps lit from the upper left, a shadowed underside. */
export function leafMass(g, x, y, w, h, col, R, o) {
  o = o || {};
  const lt = tint(col, o.lit == null ? 0.22 : o.lit), dk = tint(col, -0.3), pts = bumpy(x, y, w, h, R, o);
  g.save();
  g.fillStyle = lin(g, x - w * 0.35, y - h * 0.5, x + w * 0.3, y + h * 0.5, [[0, tint(col, 0.06)], [0.6, col], [1, dk]]);
  smoothPath(g, pts); g.fill(); g.clip();
  const n = o.clumps == null ? 6 : o.clumps;
  for (let i = 0; i < n; i++) {                                                 // clumps of leaves, their tops catching the light
    const cx = x + (R() - 0.55) * w * 0.8, cy = y + (R() - 0.7) * h * 0.6, cw = w * (0.28 + R() * 0.2), ch = h * (0.3 + R() * 0.2);
    g.fillStyle = lin(g, 0, cy - ch * 0.5, 0, cy + ch * 0.4, [[0, rgba(lt, 0.95)], [0.55, rgba(col, 0.35)], [1, rgba(col, 0)]]);
    smoothPath(g, bumpy(cx, cy, cw, ch, R, { n: 26, flat: 0.9 })); g.fill();
  }
  g.fillStyle = lin(g, 0, y, 0, y + h * 0.6, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,' + (o.shade == null ? 0.28 : o.shade) + ')']]); g.fillRect(x - w, y, w * 2, h);
  g.restore();
  if (o.edge !== false) {                                                       // a few loose leaves on the sunny edge
    g.fillStyle = lt;
    for (let i = 0; i < 14; i++) { const p = pts[Math.floor(i * pts.length / 28 + pts.length * 0.5) % pts.length]; if (p[1] > y) continue; g.save(); g.translate(p[0], p[1]); g.rotate(R() * TAU); E(g, 0, 0, Math.max(0.8, w * 0.025), Math.max(0.5, w * 0.012)); g.restore(); }
  }
}
/* A long row of tree crowns seen from afar: a scalloped skyline filled down, lighter along its top edge. */
export function treeline(g, w, base, hgt, col, R, o) {
  o = o || {};
  const crowns = [];
  for (let x = -hgt; x < w + hgt; x += hgt * (0.35 + R() * 0.45)) crowns.push([x, base - hgt * (0.55 + R() * 0.45), hgt * (0.28 + R() * 0.22)]);
  const top = (x) => { let y = base - hgt * 0.4; crowns.forEach(([cx, cy, r]) => { const d = x - cx; if (Math.abs(d) < r) { const yy = cy - Math.sqrt(r * r - d * d) * 0.8; if (yy < y) y = yy; } }); return y; };
  g.beginPath(); g.moveTo(-4, base + 4000);
  for (let x = -4; x <= w + 4; x += Math.max(2, hgt * 0.04)) g.lineTo(x, top(x) + Math.sin(x * 0.7) * hgt * 0.012);
  g.lineTo(w + 4, base + 4000); g.closePath();
  g.fillStyle = lin(g, 0, base - hgt, 0, base + hgt * 0.4, [[0, tint(col, o.lit == null ? 0.16 : o.lit)], [0.5, col], [1, tint(col, -0.18)]]); g.fill();
  if (o.texture !== false) {                                                     // the hint of separate crowns: soft lit tops
    g.save(); g.clip();
    crowns.forEach(([cx, cy, r]) => { g.fillStyle = rad(g, cx - r * 0.25, cy - r * 0.35, 0, r * 1.1, [[0, rgba(tint(col, 0.2), 0.55)], [1, rgba(col, 0)]]); g.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4); });
    g.restore();
  }
}
/* A giant rainforest tree such as the tualang: a tall, smooth, pale trunk on buttress roots, and a wide flat crown. */
export function giantTree(g, x, yb, h, R, o) {
  o = o || {};
  const tw = h * (o.thick || 0.03), bark = o.bark || '#D9D4C7', dk = tint(bark, -0.4), cy = yb - h * (o.crownAt || 0.86);
  g.fillStyle = lin(g, x - tw, 0, x + tw, 0, [[0, tint(bark, -0.32)], [0.3, bark], [0.55, tint(bark, 0.14)], [1, tint(bark, -0.38)]]);
  g.beginPath(); g.moveTo(x - tw * 0.7, cy + h * 0.05); g.bezierCurveTo(x - tw * 0.85, yb - h * 0.4, x - tw, yb - h * 0.2, x - tw * 1.1, yb - h * 0.08);
  g.lineTo(x - tw * 1.1, yb + 1); g.lineTo(x + tw * 1.1, yb + 1); g.lineTo(x + tw * 1.1, yb - h * 0.08); g.bezierCurveTo(x + tw, yb - h * 0.2, x + tw * 0.85, yb - h * 0.4, x + tw * 0.7, cy + h * 0.05); g.closePath(); g.fill();
  [[-1, 4.2, 0.2], [1, 3.6, 0.17], [-1, 2.3, 0.12], [1, 2.0, 0.1], [0.2, 1.3, 0.08]].forEach(([d, spread, up]) => {     // buttress roots
    g.fillStyle = lin(g, x, yb - h * up, x + d * tw * spread, yb, [[0, d < 0 ? tint(bark, -0.2) : bark], [1, tint(bark, -0.35)]]);
    g.beginPath(); g.moveTo(x + d * tw * 0.5, yb - h * up); g.quadraticCurveTo(x + d * tw * 1.2, yb - h * up * 0.25, x + d * tw * spread, yb + 1); g.lineTo(x + d * tw * 0.3, yb + 1); g.closePath(); g.fill();
  });
  g.strokeStyle = rgba(dk, 0.18); g.lineWidth = Math.max(0.6, tw * 0.05);
  for (let k = 0; k < 9; k++) { const yy = yb - h * (0.12 + R() * 0.7), ww = tw * (0.4 + R() * 0.4); g.beginPath(); g.moveTo(x - ww, yy); g.quadraticCurveTo(x, yy + tw * 0.2, x + ww, yy - tw * 0.1); g.stroke(); }
  [[-1, 1], [1, 0.85], [-0.45, 1.15], [0.55, 1.05]].forEach(([d, k]) => Q(g, x + d * tw * 0.2, cy + h * 0.06, x + d * h * 0.05, cy + h * 0.02, x + d * h * 0.15 * k, cy - h * 0.015, Math.max(1, tw * 0.42), tint(bark, -0.12)));
  const cr = h * (o.spread || 0.17), col = o.leaf || '#3E7A3A';
  [[-0.62, 0.0, 0.62, 0.32], [0.62, 0.01, 0.58, 0.3], [0, -0.06, 0.72, 0.36], [-0.28, -0.03, 0.55, 0.3], [0.32, -0.02, 0.52, 0.28]].forEach(([u, v, sw, sh]) => leafMass(g, x + u * cr * 1.5, cy + v * h, cr * sw * 2.2, cr * sh * 2.2, col, R, { clumps: 5 }));
}
/* An ordinary forest tree for the middle distance: a straight trunk and a leaf mass. */
export function tree(g, x, yb, h, col, R, o) {
  o = o || {};
  const tw = h * 0.035, bark = o.bark || tint(col, -0.45);
  g.fillStyle = lin(g, x - tw, 0, x + tw, 0, [[0, tint(bark, -0.2)], [0.5, tint(bark, 0.15)], [1, tint(bark, -0.3)]]); g.fillRect(x - tw, yb - h * 0.62, tw * 2, h * 0.62);
  leafMass(g, x, yb - h * 0.72, h * (o.w || 0.62), h * (o.h || 0.5), col, R, { clumps: 5, lit: o.lit });
}
/* A fern frond arching out from x, y towards angle a (radians, 0 = right, -PI/2 = up). */
export function fern(g, x, y, len, a, col, R) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([x + Math.cos(a) * len * u, y + Math.sin(a) * len * u + len * 0.38 * u * u]); }
  curve(g, pts, Math.max(0.8, len * 0.018), tint(col, -0.25));
  for (let i = 1; i < 14; i++) {
    const [px, py] = pts[i], [qx, qy] = pts[i + 1], ang = Math.atan2(qy - py, qx - px), L = len * 0.17 * Math.sin((i / 14) * Math.PI) + len * 0.02;
    g.fillStyle = i % 2 ? col : tint(col, 0.1);
    [-1, 1].forEach((s) => { g.save(); g.translate(px, py); g.rotate(ang + s * 1.05); E(g, L * 0.5, 0, L * 0.5, Math.max(0.6, L * 0.17)); g.restore(); });
  }
}
/* A big tropical leaf: a long oval with a midrib, tilted by a. */
export function bigLeaf(g, x, y, l, a, col) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = lin(g, 0, -l * 0.2, 0, l * 0.2, [[0, tint(col, 0.14)], [1, tint(col, -0.22)]]);
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(l * 0.3, -l * 0.3, l * 0.8, -l * 0.22, l, 0); g.bezierCurveTo(l * 0.8, l * 0.24, l * 0.3, l * 0.3, 0, 0); g.fill();
  g.strokeStyle = tint(col, 0.32); g.lineWidth = Math.max(0.6, l * 0.018); g.beginPath(); g.moveTo(0, 0); g.lineTo(l * 0.96, 0); g.stroke();
  g.strokeStyle = tint(col, -0.12); g.lineWidth = Math.max(0.4, l * 0.008);
  for (let k = 1; k < 8; k++) { const u = k / 8; [-1, 1].forEach((s) => { g.beginPath(); g.moveTo(l * u, 0); g.lineTo(l * (u + 0.08), s * l * 0.2 * Math.sin(u * Math.PI)); g.stroke(); }); }
  g.restore();
}
/* A liana hanging between two points. */
export function vine(g, x0, y0, x1, y1, sag, w, col) { Q(g, x0, y0, (x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1, w, col); }
/* A coconut palm: a curved ringed trunk and drooping fronds. lean: -1 to 1. o.sway: the fronds blown by the wind. */
export function coconut(g, x, yb, h, lean, R, o) {
  o = o || {};
  const tx = x + lean * h * 0.35, ty = yb - h, col = o.trunk || '#8A7357', leaf = o.leaf || '#3F7A3A', sway = o.sway || 0;
  g.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const u0 = k / 12, u1 = (k + 1) / 12, p = (u) => [x + (tx - x) * u + Math.sin(u * Math.PI) * lean * h * -0.08, yb + (ty - yb) * u]; const [ax, ay] = p(u0), [bx, by] = p(u1); g.strokeStyle = k % 2 ? col : tint(col, -0.12); g.lineWidth = h * (0.045 - u0 * 0.018); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  g.fillStyle = '#5E4A2A'; [[-0.03, 0.03], [0.02, 0.04], [0, 0.02]].forEach(([u, v]) => C(g, tx + u * h, ty + v * h, h * 0.025));
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42 + sway * (0.6 + 0.4 * Math.sin(k)), L = h * (0.36 + (k % 3) * 0.05), droop = h * 0.2;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + droop * (Math.abs(Math.cos(a)) + 0.25), cx = tx + Math.cos(a) * L * 0.55, cy = ty + Math.sin(a) * L * 0.75;
    Q(g, tx, ty, cx, cy, ex, ey, Math.max(1, h * 0.008), tint(leaf, -0.2));
    g.strokeStyle = k % 2 ? leaf : tint(leaf, 0.12); g.lineWidth = Math.max(0.8, h * 0.006); g.beginPath();      // the leaflets of one frond, in one stroke
    for (let j = 2; j < 16; j++) {
      const u = j / 16, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey, ll = h * 0.07 * Math.sin(u * Math.PI) + h * 0.01;
      g.moveTo(px, py); g.lineTo(px + ll * 0.3 + sway * ll * 0.4, py + ll); g.moveTo(px, py); g.lineTo(px - ll * 0.35 + sway * ll * 0.4, py + ll * 0.9);
    }
    g.stroke();
  }
}
/* A casuarina (rhu), the feathery seaside tree of the east coast: a thin, slightly leaning trunk carrying soft, ragged
   clumps of drooping needles, with fine strands hanging under each clump. */
export function casuarina(g, x, yb, h, col, R, o) {
  o = o || {};
  const lean = o.lean || 0, tx = x + lean * h * 0.18, lt = tint(col, 0.08);
  g.strokeStyle = tint(col, -0.2); g.lineCap = 'round'; g.lineWidth = Math.max(1, h * 0.02);
  g.beginPath(); g.moveTo(x, yb); g.quadraticCurveTo(x + lean * h * 0.04, yb - h * 0.5, tx, yb - h * 0.97); g.stroke();
  for (let i = 0; i < 8; i++) {
    const u = 0.34 + (i / 7) * 0.6, bx = x + (tx - x) * u, side = i % 2 ? 1 : -1, px = bx + side * h * (0.05 + R() * 0.09) * (1 - u * 0.6), py = yb - h * u - h * 0.02, w = h * (0.3 - u * 0.15) * (0.8 + R() * 0.4), hh = w * (0.36 + R() * 0.12);
    g.lineWidth = Math.max(0.6, h * 0.008); g.beginPath(); g.moveTo(bx, py + hh * 0.5); g.lineTo(px, py); g.stroke();
    g.fillStyle = i % 3 ? col : lt; smoothPath(g, bumpy(px, py, w, hh, R, { rough: 1.8, flat: 0.62, n: 30 })); g.fill();
    g.strokeStyle = rgba(col, 0.9); g.lineWidth = Math.max(0.5, h * 0.0035);
    for (let j = 0; j < 16; j++) { const sx = px + (R() - 0.5) * w * 0.86, sy = py + hh * (0.1 + R() * 0.2); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + (R() - 0.5) * 3, sy + hh * 0.3, sx + (R() - 0.5) * 4, sy + hh * (0.45 + R() * 0.55)); g.stroke(); }
    g.strokeStyle = tint(col, -0.2);
  }
}
/* A mangrove tree on arching stilt roots, standing in water at yb. */
export function mangrove(g, x, yb, h, col, R, o) {
  o = o || {};
  const bark = o.bark || '#4A3A2E';
  for (let k = 0; k < 9; k++) { const u = (k - 4) / 4, rx = x + u * h * 0.3, top = yb - h * (0.18 + R() * 0.12); Q(g, x + u * h * 0.04, top, x + u * h * 0.22, top - h * 0.04, rx, yb + h * 0.02, Math.max(1, h * 0.011), tint(bark, -0.1 + R() * 0.2)); }
  g.fillStyle = bark; g.fillRect(x - h * 0.028, yb - h * 0.6, h * 0.056, h * 0.42);
  leafMass(g, x, yb - h * 0.74, h * 0.85, h * 0.46, col, R, { clumps: 6 });
}
/* A berembang tree (Sonneratia) at night, where the fireflies gather: a roundish crown of drooping twigs. */
export function berembang(g, x, yb, h, col, R, rim) {
  g.fillStyle = col; g.fillRect(x - h * 0.03, yb - h * 0.5, h * 0.06, h * 0.5);
  for (let k = 0; k < 6; k++) Q(g, x, yb - h * 0.15, x + (k - 2.5) * h * 0.06, yb - h * 0.05, x + (k - 2.5) * h * 0.12, yb + h * 0.03, h * 0.012, col);
  const pts = bumpy(x, yb - h * 0.62, h * 1.0, h * 0.62, R, { flat: 0.9, rough: 1.4 });
  g.fillStyle = col; smoothPath(g, pts); g.fill();
  if (rim) { g.save(); g.clip(); g.fillStyle = lin(g, 0, yb - h * 0.95, 0, yb - h * 0.6, [[0, rgba(rim, 0.35)], [1, rgba(rim, 0)]]); g.fillRect(x - h, yb - h, h * 2, h * 0.5); g.restore(); }
  g.strokeStyle = col; g.lineWidth = Math.max(0.6, h * 0.006);
  for (let k = 0; k < 40; k++) { const sx = x + (R() - 0.5) * h * 0.9, sy = yb - h * (0.36 + R() * 0.1); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (R() - 0.5) * 3, sy + h * (0.04 + R() * 0.08)); g.stroke(); }
}
/* Nepenthes rajah, the giant pitcher plant of Mount Kinabalu: a big urn-shaped pitcher sitting on the moss, a wide
   ribbed rim (the peristome) round its mouth and a big oval lid held up over it. s = its height to the rim.
   o.from: [x, y], the tip of the leaf its tendril grows from. o.sun: -1 lit from the left, 1 from the right. */
export function pitcher(g, x, yb, s, o) {
  o = o || {};
  const col = o.col || '#8E1E32', dk = tint(col, -0.5), lt = tint(col, 0.22), w = s * 0.46, sun = o.sun || -1;
  const rimY = yb - s, rx = w * 1.04, ry = s * 0.2;
  let sd = 5; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  if (o.from) { const [fx, fy] = o.from, dir = Math.sign(x - fx) || 1; Q(g, fx, fy, fx + (x - fx) * 0.35, yb + s * 0.06, x - dir * w * 0.85, yb - s * 0.22, Math.max(1, s * 0.024), '#7A7A2E'); }
  // the urn: a round belly narrowing to a waist under the rim
  const body = new Path2D();
  body.moveTo(x - w * 0.8, rimY + ry * 0.3);
  body.bezierCurveTo(x - w * 0.72, yb - s * 0.72, x - w * 1.12, yb - s * 0.62, x - w * 1.1, yb - s * 0.3);
  body.bezierCurveTo(x - w * 1.08, yb - s * 0.04, x - w * 0.56, yb + s * 0.02, x, yb + s * 0.02);
  body.bezierCurveTo(x + w * 0.56, yb + s * 0.02, x + w * 1.08, yb - s * 0.04, x + w * 1.1, yb - s * 0.3);
  body.bezierCurveTo(x + w * 1.12, yb - s * 0.62, x + w * 0.72, yb - s * 0.72, x + w * 0.8, rimY + ry * 0.3);
  body.closePath();
  g.fillStyle = lin(g, x - w * 1.1, 0, x + w * 1.1, 0, sun < 0 ? [[0, tint(col, 0.04)], [0.28, lt], [0.6, col], [1, dk]] : [[0, dk], [0.4, col], [0.72, lt], [1, tint(col, 0.04)]]);
  g.fill(body);
  g.save(); g.clip(body);
  g.fillStyle = lin(g, 0, rimY, 0, yb, [[0, 'rgba(176,190,70,.42)'], [0.32, 'rgba(176,190,70,0)'], [0.7, 'rgba(30,0,10,0)'], [1, 'rgba(30,0,10,.5)']]); g.fillRect(x - w * 1.2, rimY - s * 0.1, w * 2.4, s * 1.2);
  for (let k = 0; k < 46; k++) { g.fillStyle = 'rgba(64,0,22,' + (0.16 + R() * 0.22).toFixed(2) + ')'; E(g, x + (R() - 0.5) * w * 2.1, yb - s * (0.04 + R() * 0.8), s * (0.012 + R() * 0.03), s * (0.01 + R() * 0.02), R() * 3); }
  g.fillStyle = 'rgba(255,232,232,.24)'; E(g, x + sun * w * 0.58, yb - s * 0.4, w * 0.13, s * 0.22, -sun * 0.12);    // a glossy shine
  g.restore();
  [-1, 1].forEach((d) => {                                                        // two fringed wings down its front
    const ax = x + d * w * 0.24, ay = rimY + ry * 0.8, bx = x + d * w * 0.1, by = yb - s * 0.1;
    curve(g, [[ax, ay], [ax + d * w * 0.08, (ay + by) / 2], [bx, by]], Math.max(1, s * 0.028), rgba(dk, 0.75));
    g.strokeStyle = rgba(dk, 0.65); g.lineWidth = Math.max(0.5, s * 0.008);
    for (let k = 1; k < 10; k++) { const u = k / 10, px = ax + (bx - ax) * u + d * w * 0.08 * Math.sin(u * Math.PI), py = ay + (by - ay) * u; g.beginPath(); g.moveTo(px, py); g.lineTo(px + d * s * 0.045, py + s * 0.025); g.stroke(); }
  });
  // the lid, big and oval, held up behind the mouth and tilted back: we see its underside, and its rim
  const lx = x - sun * w * 0.12, ly = rimY - ry - s * 0.3, lw = w * 0.9, lh = s * 0.26, tilt = -sun * 0.32;
  g.fillStyle = tint(col, -0.25); P(g, [[x - w * 0.14, rimY - ry * 0.7], [x + w * 0.14, rimY - ry * 0.7], [lx + w * 0.1, ly + lh * 0.75], [lx - w * 0.1, ly + lh * 0.75]]);
  g.save(); g.translate(lx, ly); g.rotate(tilt);
  g.fillStyle = tint(col, -0.45); E(g, -sun * lw * 0.05, -lh * 0.1, lw * 1.02, lh * 1.04);                 // its thickness
  g.fillStyle = rad(g, sun * lw * 0.2, lh * 0.15, lh * 0.1, lw * 1.05, [[0, tint(col, 0.2)], [0.7, tint(col, -0.05)], [1, tint(col, -0.35)]]); E(g, 0, 0, lw, lh);
  g.fillStyle = 'rgba(70,0,20,.35)'; for (let k = 0; k < 34; k++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.82; E(g, Math.cos(a) * d * lw, Math.sin(a) * d * lh, Math.max(0.5, s * 0.013), Math.max(0.4, s * 0.009)); }   // the nectar glands
  g.strokeStyle = 'rgba(255,214,200,.3)'; g.lineWidth = Math.max(0.6, s * 0.012); g.beginPath(); g.ellipse(0, 0, lw * 0.88, lh * 0.82, 0, Math.PI * 1.08, Math.PI * 1.62); g.stroke();
  g.restore();
  // the peristome: a wide, ribbed, glossy rim round the mouth, seen a little from above, and the mouth inside it
  g.fillStyle = lin(g, 0, rimY - ry, 0, rimY + ry, [[0, '#4E0A18'], [0.55, '#C4263A'], [1, '#6E1020']]); E(g, x, rimY, rx, ry);
  g.strokeStyle = 'rgba(40,0,10,.5)'; g.lineWidth = Math.max(0.6, s * 0.011);
  for (let k = 0; k < 48; k++) { const a = (k / 48) * TAU, c = Math.cos(a), sn = Math.sin(a); g.beginPath(); g.moveTo(x + c * rx * 0.66, rimY - ry * 0.14 + sn * ry * 0.5); g.lineTo(x + c * rx * 0.98, rimY + sn * ry * 0.96); g.stroke(); }
  g.strokeStyle = 'rgba(255,196,196,.5)'; g.lineWidth = Math.max(0.8, s * 0.018); g.beginPath(); g.ellipse(x, rimY + ry * 0.06, rx * 0.84, ry * 0.76, 0, 0.4, Math.PI - 0.4); g.stroke();   // shine along the front
  g.fillStyle = lin(g, 0, rimY - ry * 0.62, 0, rimY + ry * 0.38, [[0, '#C2BC52'], [0.45, '#6A4A1E'], [1, '#14050A']]); E(g, x, rimY - ry * 0.14, rx * 0.64, ry * 0.5);
}
/* A row of cloud billows seen from the side (a sea of cloud is several rows, the far ones first): a soft scalloped top
   lit along its edge and towards o.sun (-1 left, 1 right), shading down into the row in front. cols: [lit, mid, shade]
   as hex; o.a: the row's opacity; o.below: how far the row reaches down. */
export function cloudRow(g, x0, x1, base, hgt, cols, R, o) {
  o = o || {};
  const sun = o.sun || 0, a = o.a == null ? 1 : o.a, below = o.below == null ? hgt : o.below, bumps = [];
  for (let x = x0 - hgt; x < x1 + hgt; x += hgt * (0.5 + R() * 0.8)) bumps.push([x, base - hgt * (0.2 + R() * 0.45), hgt * (0.38 + R() * 0.6)]);
  const top = (x) => { let y = base; bumps.forEach(([cx, cy, r]) => { const d = x - cx; if (Math.abs(d) < r) { const yy = cy - Math.sqrt(r * r - d * d) * 0.6; if (yy < y) y = yy; } }); return y; };
  g.beginPath(); g.moveTo(x0, base + below);
  for (let x = x0; x <= x1; x += Math.max(2, hgt * 0.035)) g.lineTo(x, top(x));
  g.lineTo(x1, base + below); g.closePath();
  g.fillStyle = lin(g, 0, base - hgt * 0.9, 0, base + below, [[0, rgba(cols[1], a)], [0.3, rgba(cols[1], a)], [1, rgba(cols[2], a)]]); g.fill();
  g.save(); g.clip();
  bumps.forEach(([cx, cy, r]) => {                                               // each billow: lit along its top and on its sunny side, shaded underneath
    const ty = cy - r * 0.6;
    g.fillStyle = rad(g, cx + sun * r * 0.35, ty + r * 0.18, 0, r * 0.95, [[0, rgba(cols[0], 0.95 * a)], [0.55, rgba(cols[0], 0.35 * a)], [1, rgba(cols[0], 0)]]); g.fillRect(cx - r, ty - r * 0.2, r * 2, r * 1.4);
    g.fillStyle = rad(g, cx - sun * r * 0.25, cy + r * 0.25, 0, r * 0.9, [[0, rgba(cols[2], 0.28 * a)], [1, rgba(cols[2], 0)]]); g.fillRect(cx - r, cy - r * 0.6, r * 2, r * 1.8);
  });
  g.restore();
}
/* A rock face of karst limestone, as at Mulu: pale grey with vertical fluting, bedding lines and streaks. pts: its outline. */
export function karst(g, pts, x0, y0, x1, y1, R, o) {
  o = o || {};
  g.save();
  g.fillStyle = lin(g, 0, y0, 0, y1, o.cols || [[0, '#B9B2A8'], [0.55, '#9E978E'], [1, '#6E6862']]); P(g, pts); g.clip();
  for (let i = 0; i < 70; i++) {                                                // vertical fluting: thin lit and shaded strips
    const x = x0 + R() * (x1 - x0), ww = (x1 - x0) * (0.004 + R() * 0.012), yy = y0 + R() * (y1 - y0) * 0.4, L = (y1 - y0) * (0.2 + R() * 0.7);
    g.fillStyle = R() < 0.5 ? 'rgba(255,250,240,.10)' : 'rgba(40,36,34,.14)'; g.fillRect(x, yy, ww, L);
  }
  g.strokeStyle = 'rgba(60,54,50,.18)'; g.lineWidth = Math.max(0.8, (y1 - y0) * 0.004);
  for (let k = 0; k < 9; k++) { const y = y0 + (k + R()) * (y1 - y0) / 9; g.beginPath(); for (let x = x0; x <= x1; x += 20) { const yy = y + Math.sin(x * 0.01 + k) * 6; if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }   // bedding
  for (let i = 0; i < 26; i++) { const x = x0 + R() * (x1 - x0), yy = y0 + R() * (y1 - y0) * 0.6; g.fillStyle = lin(g, 0, yy, 0, yy + (y1 - y0) * 0.35, [[0, 'rgba(30,26,26,.32)'], [1, 'rgba(30,26,26,0)']]); g.fillRect(x, yy, Math.max(1, (x1 - x0) * 0.006), (y1 - y0) * 0.35); }   // water streaks
  g.fillStyle = 'rgba(255,240,220,.08)'; g.fillRect(x0, y0, (x1 - x0) * 0.4, y1 - y0);
  g.restore();
}

/* ---------------- people's things ---------------- */
/* A wooden longboat, as on the Tembeling river: long, low and narrow, with a canopy roof and people sitting in a row. */
export function longboat(g, x, y, L, o) {
  o = o || {};
  const h = L * 0.07;
  g.fillStyle = lin(g, 0, y - h, 0, y + h * 0.4, [[0, '#7A5232'], [1, '#4A2E1A']]);
  g.beginPath(); g.moveTo(x - L * 0.5, y - h * 0.9); g.quadraticCurveTo(x - L * 0.46, y + h * 0.3, x - L * 0.3, y + h * 0.35); g.lineTo(x + L * 0.38, y + h * 0.35); g.quadraticCurveTo(x + L * 0.5, y + h * 0.2, x + L * 0.52, y - h * 1.1); g.lineTo(x + L * 0.4, y - h * 0.6); g.lineTo(x - L * 0.4, y - h * 0.6); g.closePath(); g.fill();
  g.fillStyle = '#C9A26A'; g.fillRect(x - L * 0.42, y - h * 0.72, L * 0.84, h * 0.14);
  const cols = ['#E04E5A', '#3E7BE0', '#F2C14E', '#F08A3C', '#6AC46A', '#FFFFFF'];
  for (let k = 0; k < (o.n || 6); k++) { const px = x - L * 0.3 + k * L * 0.1; g.fillStyle = cols[k % cols.length]; g.fillRect(px - h * 0.35, y - h * 1.9, h * 0.7, h * 1.2); g.fillStyle = '#3A2A20'; C(g, px, y - h * 2.25, h * 0.38); }
  if (o.roof !== false) { g.fillStyle = '#2E5A7A'; g.fillRect(x - L * 0.36, y - h * 3.1, L * 0.62, h * 0.3); g.fillStyle = '#3A2A20'; [-0.34, -0.05, 0.24].forEach((u) => g.fillRect(x + u * L, y - h * 2.9, h * 0.12, h * 2.2)); }
  g.fillStyle = '#2A2A2A'; g.fillRect(x - L * 0.53, y - h * 1.2, h * 0.6, h * 1.4);
}
/* A small wooden sampan with a boatman standing at the back. */
export function sampan(g, x, y, L, o) {
  o = o || {};
  const h = L * 0.1, col = o.col || '#3A2A1E';
  g.fillStyle = col; g.beginPath(); g.moveTo(x - L * 0.5, y - h * 1.1); g.quadraticCurveTo(x - L * 0.4, y + h * 0.4, x, y + h * 0.45); g.quadraticCurveTo(x + L * 0.4, y + h * 0.4, x + L * 0.5, y - h * 1.2); g.lineTo(x + L * 0.38, y - h * 0.6); g.lineTo(x - L * 0.38, y - h * 0.6); g.closePath(); g.fill();
  if (o.people !== false) {
    [-0.2, 0, 0.18].forEach((u) => { g.fillRect(x + u * L - h * 0.4, y - h * 2.2, h * 0.8, h * 1.6); C(g, x + u * L, y - h * 2.6, h * 0.45); });
    g.fillRect(x - L * 0.4, y - h * 4, h * 0.6, h * 3.4); C(g, x - L * 0.4 + h * 0.3, y - h * 4.4, h * 0.45);
    S(g, x - L * 0.38, y - h * 3, x - L * 0.2, y + h * 1.6, Math.max(1, h * 0.25), col);
  }
}
/* A painted east-coast fishing boat (perahu) with its high curved prow. */
export function perahu(g, x, y, L, cols, flip) {
  g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
  const h = L * 0.13, [a, b, c] = cols;
  g.fillStyle = a; g.beginPath(); g.moveTo(-L * 0.5, -h * 1.6); g.quadraticCurveTo(-L * 0.42, h * 0.5, 0, h * 0.6); g.quadraticCurveTo(L * 0.4, h * 0.5, L * 0.5, -h * 2.2); g.lineTo(L * 0.42, -h * 1.0); g.lineTo(-L * 0.42, -h * 1.0); g.closePath(); g.fill();
  g.fillStyle = b; g.beginPath(); g.moveTo(-L * 0.45, -h * 0.9); g.quadraticCurveTo(0, h * 0.05, L * 0.45, -h * 1.1); g.lineTo(L * 0.44, -h * 0.6); g.quadraticCurveTo(0, h * 0.5, -L * 0.44, -h * 0.5); g.closePath(); g.fill();
  g.fillStyle = c; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(k * L * 0.1 - h * 0.25, -h * 0.75 + Math.abs(k) * h * 0.06); g.lineTo(k * L * 0.1, -h * 0.4); g.lineTo(k * L * 0.1 + h * 0.25, -h * 0.75 + Math.abs(k) * h * 0.06); g.fill(); }
  g.fillStyle = tint(a, -0.2); g.beginPath(); g.moveTo(L * 0.44, -h * 1.0); g.quadraticCurveTo(L * 0.58, -h * 2.4, L * 0.5, -h * 3.4); g.lineTo(L * 0.47, -h * 2.1); g.closePath(); g.fill();
  g.fillStyle = '#E9E2D2'; g.fillRect(-L * 0.04, -h * 3.4, h * 0.22, h * 2.5);
  g.restore();
}
/* A Malay kampung house on stilts, with a steep roof. */
export function stiltHouse(g, x, yb, w, R, o) {
  o = o || {};
  const wall = o.wall || '#B9875A', roof = o.roof || '#7A3A2A', lift = w * 0.32, hh = w * 0.42;
  g.fillStyle = tint(wall, -0.35); for (let k = 0; k < 5; k++) g.fillRect(x - w * 0.46 + k * w * 0.23, yb - lift, w * 0.035, lift);
  g.fillStyle = lin(g, x - w * 0.5, 0, x + w * 0.5, 0, [[0, tint(wall, 0.08)], [1, tint(wall, -0.12)]]); g.fillRect(x - w * 0.5, yb - lift - hh, w, hh);
  g.strokeStyle = tint(wall, -0.2); g.lineWidth = Math.max(0.5, w * 0.01); for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(x - w * 0.5 + k * w * 0.1, yb - lift - hh); g.lineTo(x - w * 0.5 + k * w * 0.1, yb - lift); g.stroke(); }
  g.fillStyle = o.lit || '#3A2A1E'; [-0.3, 0.05, 0.3].forEach((u) => g.fillRect(x + u * w - w * 0.07, yb - lift - hh * 0.75, w * 0.14, hh * 0.42));
  g.fillStyle = roof; g.beginPath(); g.moveTo(x - w * 0.62, yb - lift - hh + w * 0.02); g.lineTo(x - w * 0.18, yb - lift - hh - w * 0.42); g.lineTo(x + w * 0.18, yb - lift - hh - w * 0.42); g.lineTo(x + w * 0.62, yb - lift - hh + w * 0.02); g.closePath(); g.fill();
  g.fillStyle = tint(roof, 0.15); g.beginPath(); g.moveTo(x - w * 0.18, yb - lift - hh - w * 0.42); g.lineTo(x + w * 0.18, yb - lift - hh - w * 0.42); g.lineTo(x + w * 0.1, yb - lift - hh - w * 0.32); g.lineTo(x - w * 0.1, yb - lift - hh - w * 0.32); g.closePath(); g.fill();
  g.fillStyle = tint(wall, -0.25); g.fillRect(x + w * 0.45, yb - lift, w * 0.06, lift * 0.9); for (let k = 0; k < 4; k++) g.fillRect(x + w * 0.42, yb - lift + k * lift * 0.24, w * 0.14, w * 0.02);
}

/* ---------------- animals ---------------- */
/* a fringe of hair along a line, hanging down: the shaggy coat of an orangutan */
function fringe(g, pts, len, cols, R, w) {
  g.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (let k = 0; k < 4; k++) {
      const u = k / 4, x = ax + (bx - ax) * u, y = ay + (by - ay) * u, l = len * (0.6 + R() * 0.6);
      g.strokeStyle = cols[Math.floor(R() * cols.length)]; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * l * 0.4, y + l * 0.5, x + (R() - 0.5) * l * 0.5, y + l); g.stroke();
    }
  }
}
/* An orangutan, s = its height sitting. o.pose: 'sit', 'reach' (one long arm up to a branch, o.k 0..1) or 'hang'.
   o.male: a big flanged male with cheek pads and a throat sac. o.t: time (breathing, blinking). o.seed: its own hair. */
export function orangutan(g, x, yb, s, o) {
  o = o || {};
  const col = o.col || '#B4501C', lt = tint(col, 0.28), dk = tint(col, -0.38), skin = '#3E322E', t = o.t || 0, br = Math.sin(t * 1.6) * s * 0.008;
  let seed = o.seed || 7; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hairs = [col, lt, dk, tint(col, 0.12)], hw = Math.max(0.8, s * 0.012);
  g.save(); g.translate(x, yb); if (o.flip) g.scale(-1, 1);
  const pose = o.pose || 'sit', k = pose === 'reach' ? (o.k == null ? 1 : o.k) : 0, hang = pose === 'hang';
  if (!hang) {                                                                    // folded legs and big hand-like feet
    g.fillStyle = dk; E(g, -s * 0.2, -s * 0.13, s * 0.22, s * 0.14, 0.25); E(g, s * 0.2, -s * 0.13, s * 0.22, s * 0.14, -0.25);
    g.fillStyle = skin; E(g, -s * 0.34, -s * 0.04, s * 0.09, s * 0.045, 0.2); E(g, s * 0.34, -s * 0.04, s * 0.09, s * 0.045, -0.2);
  } else {
    S(g, -s * 0.1, -s * 0.12, -s * 0.18, s * 0.28, s * 0.12, dk); S(g, s * 0.1, -s * 0.12, s * 0.2, s * 0.26, s * 0.12, col);
    g.fillStyle = skin; E(g, -s * 0.18, s * 0.31, s * 0.07, s * 0.05); E(g, s * 0.2, s * 0.29, s * 0.07, s * 0.05);
  }
  // the body: heavy and pear-shaped under a long coat
  const body = [[-s * 0.18, -s * 0.8 - br], [-s * 0.38, -s * 0.62], [-s * 0.42, -s * 0.3], [-s * 0.28, -s * 0.08], [0, -s * 0.04], [s * 0.28, -s * 0.08], [s * 0.42, -s * 0.3], [s * 0.38, -s * 0.62], [s * 0.18, -s * 0.8 - br]];
  g.fillStyle = lin(g, -s * 0.4, -s * 0.8, s * 0.4, 0, [[0, lt], [0.45, col], [1, dk]]); blob(g, body);
  fringe(g, [[-s * 0.4, -s * 0.5], [-s * 0.42, -s * 0.28], [-s * 0.3, -s * 0.1]], s * 0.14, hairs, R, hw);
  fringe(g, [[s * 0.4, -s * 0.5], [s * 0.42, -s * 0.28], [s * 0.3, -s * 0.1]], s * 0.14, hairs, R, hw);
  g.fillStyle = rgba(dk, 0.35); E(g, 0, -s * 0.36, s * 0.16, s * 0.2);                  // the bare-ish chest
  // the arms: very long, with long hair hanging from them
  const arm = (pts, w, c) => { curve(g, pts, w, c); fringe(g, pts.slice(1), s * 0.12, hairs, R, hw); };
  if (hang) { arm([[-s * 0.22, -s * 0.74], [-s * 0.32, -s * 1.2], [-s * 0.22, -s * 1.66]], s * 0.13, col); g.fillStyle = skin; E(g, -s * 0.22, -s * 1.7, s * 0.07, s * 0.06); arm([[s * 0.24, -s * 0.7], [s * 0.5, -s * 0.4], [s * 0.4, -s * 0.06]], s * 0.13, dk); }
  else if (k > 0) {
    const hx = -s * (0.28 + 0.12 * k), hy = -s * (0.6 + 0.95 * k);
    arm([[-s * 0.26, -s * 0.7], [-s * 0.52, -s * 0.78 - s * 0.35 * k], [hx, hy]], s * 0.13, col); g.fillStyle = skin; E(g, hx, hy - s * 0.02, s * 0.07, s * 0.06);
    arm([[s * 0.28, -s * 0.68], [s * 0.54, -s * 0.4], [s * 0.4, -s * 0.06]], s * 0.13, dk);
  } else {
    arm([[-s * 0.28, -s * 0.68], [-s * 0.56, -s * 0.4], [-s * 0.4, -s * 0.06]], s * 0.13, col); arm([[s * 0.28, -s * 0.68], [s * 0.56, -s * 0.4], [s * 0.4, -s * 0.06]], s * 0.13, dk);
  }
  g.fillStyle = skin; if (!hang && k === 0) E(g, -s * 0.4, -s * 0.05, s * 0.07, s * 0.045); E(g, s * 0.4, -s * 0.05, s * 0.07, s * 0.045);
  // the head: a dark face framed by orange hair; a big male has wide cheek pads and a throat sac
  const hx = s * 0.02, hy = -s * 0.92;
  if (o.male) {
    g.fillStyle = dk; E(g, hx, hy + s * 0.2, s * 0.2, s * 0.12);                                                          // the throat sac
    g.fillStyle = lin(g, hx - s * 0.36, 0, hx + s * 0.36, 0, [[0, '#2E2420'], [0.5, '#5E4A3E'], [1, '#2E2420']]); E(g, hx, hy + s * 0.02, s * 0.36, s * 0.22);
  }
  g.fillStyle = col; C(g, hx, hy - s * 0.04, s * 0.17);
  g.fillStyle = lin(g, 0, hy - s * 0.12, 0, hy + s * 0.15, [[0, '#5A4A42'], [1, skin]]); E(g, hx, hy + s * 0.02, s * 0.12, s * 0.15);
  g.fillStyle = '#2A201C'; E(g, hx, hy + s * 0.09, s * 0.085, s * 0.055);                                                     // the muzzle
  g.fillStyle = '#6E5A4E'; E(g, hx, hy + s * 0.07, s * 0.06, s * 0.03);
  const blink = Math.sin(t * 0.7 + x * 0.01) > 0.97 ? 0.15 : 1;
  g.fillStyle = '#D9C6AE'; E(g, hx - s * 0.048, hy - s * 0.03, s * 0.022, s * 0.018 * blink); E(g, hx + s * 0.048, hy - s * 0.03, s * 0.022, s * 0.018 * blink);
  g.fillStyle = '#140E0C'; C(g, hx - s * 0.046, hy - s * 0.03, s * 0.012 * blink); C(g, hx + s * 0.05, hy - s * 0.03, s * 0.012 * blink);
  g.strokeStyle = 'rgba(30,20,16,.5)'; g.lineWidth = Math.max(0.5, s * 0.008); g.beginPath(); g.moveTo(hx - s * 0.08, hy - s * 0.06); g.quadraticCurveTo(hx, hy - s * 0.09, hx + s * 0.08, hy - s * 0.06); g.stroke();   // the brow
  fringe(g, [[hx - s * 0.16, hy - s * 0.12], [hx, hy - s * 0.21], [hx + s * 0.16, hy - s * 0.12]], s * 0.07, hairs, R, hw);
  g.restore();
}
/* A proboscis monkey sitting on a branch at x, yb (its seat), the long pale tail hanging down. s = its height sitting.
   o.male: the long drooping nose and the pot belly. o.t: time. */
export function proboscis(g, x, yb, s, o) {
  o = o || {};
  const t = o.t || 0, red = '#B0582A', ginger = '#D08A4E', cream = '#EADCC2', grey = '#BDB6A8', skin = '#E3A486';
  g.save(); g.translate(x, yb); if (o.flip) g.scale(-1, 1);
  const sw = Math.sin(t * 0.9 + x * 0.1) * s * 0.06;
  Q(g, -s * 0.16, -s * 0.06, -s * 0.24, s * 0.62, -s * 0.14 + sw, s * 1.22, Math.max(1, s * 0.075), '#E2DACB');                // the long pale tail
  g.fillStyle = grey; E(g, -s * 0.04, -s * 0.07, s * 0.26, s * 0.11);                                                       // legs folded on the branch
  S(g, s * 0.12, -s * 0.06, s * 0.16, s * 0.32, s * 0.09, grey); g.fillStyle = '#3A2E28'; E(g, s * 0.17, s * 0.34, s * 0.055, s * 0.035);
  // the body: rusty shoulders and back, a big pale pot belly
  g.fillStyle = lin(g, -s * 0.3, -s * 0.8, s * 0.3, 0, [[0, red], [0.5, ginger], [1, tint(ginger, -0.15)]]);
  g.beginPath(); g.moveTo(-s * 0.14, -s * 0.76); g.bezierCurveTo(-s * 0.38, -s * 0.62, -s * 0.34, -s * 0.12, -s * 0.1, -s * 0.06);
  g.bezierCurveTo(s * 0.16, -s * 0.03, s * (o.male ? 0.4 : 0.3), -s * 0.18, s * 0.26, -s * 0.5); g.bezierCurveTo(s * 0.18, -s * 0.72, s * 0.04, -s * 0.8, -s * 0.14, -s * 0.76); g.closePath(); g.fill();
  g.fillStyle = lin(g, 0, -s * 0.5, 0, -s * 0.05, [[0, rgba(cream, 0)], [0.45, rgba(cream, 0.9)], [1, cream]]); E(g, s * 0.1, -s * 0.2, s * (o.male ? 0.24 : 0.18), s * 0.18);   // the belly
  S(g, s * 0.16, -s * 0.58, s * 0.34, -s * 0.2, s * 0.085, grey); g.fillStyle = '#3A2E28'; E(g, s * 0.35, -s * 0.17, s * 0.05, s * 0.04);   // an arm on its knee
  // the head: a small round head with a rusty cap, a pale face and that nose
  const hx = s * 0.1, hy = -s * 0.88;
  g.fillStyle = red; C(g, hx, hy, s * 0.15);
  g.fillStyle = '#E2B08E'; E(g, hx + s * 0.07, hy + s * 0.03, s * 0.09, s * 0.1);
  g.fillStyle = '#2A1E1A'; C(g, hx + s * 0.05, hy - s * 0.02, s * 0.017); C(g, hx + s * 0.11, hy - s * 0.02, s * 0.017);
  g.fillStyle = cream; E(g, hx - s * 0.05, hy + s * 0.13, s * 0.11, s * 0.05);                                               // the pale collar
  if (o.male) {
    const wob = Math.sin(t * 2.3 + x) * s * 0.01;
    g.fillStyle = lin(g, hx + s * 0.08, hy, hx + s * 0.24, hy + s * 0.28, [[0, '#D8907A'], [1, skin]]);
    g.beginPath(); g.moveTo(hx + s * 0.1, hy + s * 0.01); g.bezierCurveTo(hx + s * 0.28, hy + s * 0.02, hx + s * 0.3 + wob, hy + s * 0.24, hx + s * 0.18 + wob, hy + s * 0.29); g.bezierCurveTo(hx + s * 0.1, hy + s * 0.26, hx + s * 0.08, hy + s * 0.12, hx + s * 0.1, hy + s * 0.01); g.fill();
  } else { g.fillStyle = skin; g.beginPath(); g.moveTo(hx + s * 0.11, hy + s * 0.02); g.quadraticCurveTo(hx + s * 0.2, hy + s * 0.0, hx + s * 0.19, hy - s * 0.04); g.quadraticCurveTo(hx + s * 0.16, hy + s * 0.07, hx + s * 0.11, hy + s * 0.07); g.fill(); }
  g.restore();
}
/* The Malayan tiger from the side, walking (o.ph: the stride), standing still (o.still) or roaring (o.roar 0..1).
   L = nose to rump; the feet are at x, yb. */
export function tiger(g, x, yb, L, o) {
  o = o || {};
  const ph = o.ph || 0, orange = '#E2832C', deep = '#B95A1A', white = '#F4EADB', blk = '#17110E', roar = o.roar || 0, still = !!o.still, t = o.t || 0;
  g.save(); g.translate(x, yb); if (o.flip) g.scale(-1, 1); g.lineJoin = 'round';
  const legPath = (hipX, hipY, a, front) => {                                   // one leg as a tapering shape, swung by a
    const len = L * 0.48, c = Math.cos(a), sn = Math.sin(a);
    const kx = hipX + sn * len * 0.45 + (front ? 0 : -L * 0.04), ky = hipY + c * len * 0.48;
    const fx = kx + sn * len * 0.42 + (front ? L * 0.01 : L * 0.05), fy = Math.min(0, ky + len * 0.5);
    const w0 = L * (front ? 0.085 : 0.13), w1 = L * 0.05;
    return [[hipX - w0, hipY], [hipX + w0, hipY], [kx + w1, ky], [fx + w1 * 0.9, fy - L * 0.02], [fx - w1 * 0.9, fy - L * 0.02], [kx - w1, ky], fx, fy];
  };
  const drawLeg = (hipX, hipY, off, front, near) => {
    const a = still ? 0 : Math.sin(ph + off) * 0.38, p = legPath(hipX, hipY, a, front), fx = p[6], fy = p[7];
    g.fillStyle = near ? lin(g, hipX - L * 0.1, 0, hipX + L * 0.1, 0, [[0, orange], [1, deep]]) : tint(deep, -0.15);
    blob(g, p.slice(0, 6));
    g.fillStyle = near ? white : tint(white, -0.3); E(g, fx + L * 0.03, fy - L * 0.025, L * 0.06, L * 0.03);              // the paw
    if (near) { g.strokeStyle = blk; g.lineWidth = L * 0.016; for (let k = 0; k < 3; k++) { const yy = hipY + (fy - hipY) * (0.35 + k * 0.17), xx = hipX + (fx - hipX) * (0.35 + k * 0.17); g.beginPath(); g.moveTo(xx - L * 0.05, yy); g.lineTo(xx + L * 0.03, yy + L * 0.008); g.stroke(); } }
  };
  // the far legs, the tail, then the body and the near legs
  drawLeg(-L * 0.33, -L * 0.36, Math.PI, false, false); drawLeg(L * 0.2, -L * 0.36, 0, true, false);
  const tw = Math.sin(t * 1.5) * L * 0.04;
  g.strokeStyle = orange; g.lineWidth = L * 0.06; g.lineCap = 'round'; g.beginPath(); g.moveTo(-L * 0.44, -L * 0.42); g.bezierCurveTo(-L * 0.62, -L * 0.36, -L * 0.7, -L * 0.14 + tw, -L * 0.74, -L * 0.08 + tw); g.quadraticCurveTo(-L * 0.76, -L * 0.03 + tw, -L * 0.7, -L * 0.04 + tw); g.stroke();
  g.strokeStyle = blk; g.lineWidth = L * 0.064; g.lineCap = 'butt'; [0.62, 0.72, 0.82, 0.92].forEach((u) => { const bx = -L * (0.44 + 0.3 * u), by = -L * (0.42 - 0.34 * u) + tw * u; g.beginPath(); g.moveTo(bx - L * 0.012, by - L * 0.006); g.lineTo(bx + L * 0.012, by + L * 0.006); g.stroke(); });
  g.lineCap = 'round';
  const torso = new Path2D();
  torso.moveTo(-L * 0.46, -L * 0.36); torso.bezierCurveTo(-L * 0.48, -L * 0.5, -L * 0.36, -L * 0.53, -L * 0.18, -L * 0.51);
  torso.bezierCurveTo(-L * 0.02, -L * 0.49, L * 0.12, -L * 0.56, L * 0.24, -L * 0.55); torso.bezierCurveTo(L * 0.34, -L * 0.54, L * 0.38, -L * 0.48, L * 0.4, -L * 0.44);
  torso.lineTo(L * 0.34, -L * 0.24); torso.bezierCurveTo(L * 0.22, -L * 0.17, L * 0.05, -L * 0.2, -L * 0.12, -L * 0.22); torso.bezierCurveTo(-L * 0.3, -L * 0.22, -L * 0.42, -L * 0.24, -L * 0.46, -L * 0.36); torso.closePath();
  g.fillStyle = lin(g, 0, -L * 0.56, 0, -L * 0.18, [[0, deep], [0.35, orange], [0.72, tint(orange, 0.1)], [1, white]]); g.fill(torso);
  g.save(); g.clip(torso);
  g.fillStyle = blk;                                                              // stripes: tapering, wavy, a few forked, thicker on the haunch
  const stripe = (sx, len, lean, w) => { g.beginPath(); g.moveTo(sx - w, -L * 0.6); g.bezierCurveTo(sx - w * 0.6 + lean * 0.3, -L * 0.48, sx + lean * 0.6 - w * 0.2, -L * 0.46 + len * 0.5, sx + lean, -L * 0.56 + len); g.bezierCurveTo(sx + lean * 0.6 + w * 0.2, -L * 0.46 + len * 0.5, sx + w * 0.6 + lean * 0.3, -L * 0.48, sx + w, -L * 0.6); g.closePath(); g.fill(); };
  [[-0.43, 0.2, 0.03, 0.022], [-0.37, 0.25, -0.02, 0.026], [-0.3, 0.22, 0.04, 0.02], [-0.24, 0.27, -0.03, 0.024], [-0.17, 0.2, 0.03, 0.018], [-0.11, 0.24, -0.02, 0.02], [-0.04, 0.19, 0.03, 0.017], [0.03, 0.22, -0.02, 0.018], [0.1, 0.16, 0.025, 0.015], [0.16, 0.2, -0.015, 0.016], [0.23, 0.14, 0.02, 0.013], [0.3, 0.12, -0.01, 0.012]]
    .forEach(([u, len, lean, w]) => stripe(L * u, L * len, L * lean, L * w));
  g.restore();
  drawLeg(-L * 0.32, -L * 0.34, 0, false, true); drawLeg(L * 0.24, -L * 0.34, Math.PI, true, true);
  // the head: a broad head with white cheek ruffs, a strong muzzle and round ears
  const hb = still ? 0 : Math.sin(ph * 2) * L * 0.006;
  g.save(); g.translate(L * 0.44, -L * 0.47 + hb); g.rotate(-roar * 0.18);
  g.fillStyle = orange; E(g, 0, 0, L * 0.12, L * 0.115);
  g.fillStyle = white; E(g, -L * 0.03, L * 0.06, L * 0.1, L * 0.07, 0.3);                                                       // the cheek ruff
  g.fillStyle = orange; E(g, -L * 0.05, -L * 0.1, L * 0.035, L * 0.035); g.fillStyle = blk; E(g, -L * 0.05, -L * 0.1, L * 0.022, L * 0.022); g.fillStyle = white; C(g, -L * 0.05, -L * 0.105, L * 0.01);   // the ear
  g.fillStyle = lin(g, L * 0.05, -L * 0.04, L * 0.18, L * 0.06, [[0, orange], [1, tint(orange, 0.12)]]); E(g, L * 0.1, L * 0.02, L * 0.085, L * 0.065, 0.1);   // the muzzle
  g.fillStyle = white; E(g, L * 0.12, L * 0.055, L * 0.07, L * 0.035);
  g.fillStyle = '#B85A5A'; E(g, L * 0.175, L * 0.0, L * 0.022, L * 0.016);                                                     // the nose
  if (roar > 0) { g.fillStyle = '#4A1414'; E(g, L * 0.11, L * 0.08, L * 0.06, L * 0.02 + L * 0.055 * roar, -0.25); g.fillStyle = '#F4EEE2'; P(g, [[L * 0.08, L * 0.05], [L * 0.09, L * 0.09], [L * 0.1, L * 0.05]]); P(g, [[L * 0.13, L * 0.05], [L * 0.14, L * 0.085], [L * 0.15, L * 0.05]]); }
  g.strokeStyle = blk; g.lineWidth = L * 0.012;
  [[-0.02, -0.08, 0.03, -0.03], [0.02, -0.1, 0.05, -0.05], [-0.07, -0.03, -0.01, 0.0], [-0.08, 0.03, -0.02, 0.04], [0.05, -0.06, 0.08, -0.02]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a * L, b * L); g.quadraticCurveTo((a + c) / 2 * L + L * 0.01, (b + d) / 2 * L, c * L, d * L); g.stroke(); });
  g.fillStyle = '#E8C65A'; E(g, L * 0.055, -L * 0.035, L * 0.018, L * 0.013, 0.2); g.fillStyle = blk; E(g, L * 0.058, -L * 0.035, L * 0.007, L * 0.011);   // the eye
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(0.5, L * 0.003); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(L * 0.14, L * 0.05 + k * L * 0.01); g.lineTo(L * 0.24, L * 0.035 + k * L * 0.02); g.stroke(); }
  g.restore();
  g.restore();
}
/* A rhinoceros hornbill, perched (o.fly undefined) or flying (o.fly: the wingbeat phase). s = beak tip to tail. */
export function hornbill(g, x, y, s, o) {
  o = o || {};
  const blk = '#141418', wht = '#F3F0EA', fly = o.fly != null;
  g.save(); g.translate(x, y); if (o.flip) g.scale(-1, 1); g.lineJoin = 'round';
  if (fly) {
    const f = Math.sin(o.fly), up = f * s * 0.34;
    g.fillStyle = tint(blk, 0.1); g.beginPath(); g.moveTo(-s * 0.08, -s * 0.02); g.quadraticCurveTo(-s * 0.16, -s * 0.16 - up, -s * 0.2, -s * 0.5 - up * 1.4); g.lineTo(s * 0.06, -s * 0.46 - up * 1.3); g.quadraticCurveTo(s * 0.12, -s * 0.14 - up * 0.6, s * 0.12, -s * 0.02); g.closePath(); g.fill();
    g.fillStyle = wht; g.beginPath(); g.moveTo(-s * 0.34, -s * 0.03); g.lineTo(-s * 0.64, -s * 0.08); g.lineTo(-s * 0.64, s * 0.07); g.lineTo(-s * 0.34, s * 0.05); g.closePath(); g.fill();
    g.fillStyle = blk; g.fillRect(-s * 0.56, -s * 0.07, s * 0.07, s * 0.135);
    g.fillStyle = blk; E(g, -s * 0.06, 0, s * 0.32, s * 0.085); g.fillStyle = wht; E(g, -s * 0.24, s * 0.04, s * 0.12, s * 0.045);
    g.fillStyle = blk; g.beginPath(); g.moveTo(-s * 0.1, 0); g.quadraticCurveTo(-s * 0.24, s * 0.12 + up, -s * 0.32, s * 0.52 + up * 1.4); g.lineTo(s * 0.02, s * 0.46 + up * 1.2); g.quadraticCurveTo(s * 0.1, s * 0.12 + up * 0.5, s * 0.1, s * 0.02); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = Math.max(0.6, s * 0.008); for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-s * (0.06 + k * 0.035), s * 0.05); g.lineTo(-s * (0.12 + k * 0.035), s * 0.44 + up * 1.2); g.stroke(); }
  } else {
    S(g, -s * 0.0, s * 0.14, -s * 0.03, s * 0.24, Math.max(1, s * 0.032), '#6A6A6A'); S(g, s * 0.07, s * 0.13, s * 0.08, s * 0.24, Math.max(1, s * 0.032), '#5A5A5A');
    g.fillStyle = wht; g.beginPath(); g.moveTo(-s * 0.2, s * 0.08); g.lineTo(-s * 0.5, s * 0.46); g.lineTo(-s * 0.37, s * 0.52); g.lineTo(-s * 0.1, s * 0.14); g.closePath(); g.fill();   // the long white tail, hanging
    g.fillStyle = blk; P(g, [[-s * 0.41, s * 0.33], [-s * 0.46, s * 0.4], [-s * 0.33, s * 0.46], [-s * 0.29, s * 0.37]]);
    g.fillStyle = lin(g, -s * 0.2, -s * 0.2, s * 0.2, s * 0.2, [[0, '#33333C'], [1, blk]]); g.beginPath(); g.ellipse(-s * 0.02, 0, s * 0.25, s * 0.15, -0.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.ellipse(-s * 0.06, -s * 0.05, s * 0.16, s * 0.06, -0.5, 0, TAU); g.fill();
    g.fillStyle = wht; E(g, s * 0.03, s * 0.13, s * 0.12, s * 0.05, -0.3);
  }
  const hx = fly ? s * 0.26 : s * 0.12, hy = fly ? -s * 0.02 : -s * 0.17;
  g.fillStyle = blk; C(g, hx, hy, s * 0.085);
  g.fillStyle = lin(g, hx, hy, hx + s * 0.5, hy + s * 0.1, [[0, '#E9C98E'], [0.35, '#F6E7C4'], [1, '#E2BE7E']]);                   // the long curved bill
  g.beginPath(); g.moveTo(hx + s * 0.05, hy - s * 0.04); g.quadraticCurveTo(hx + s * 0.32, hy - s * 0.03, hx + s * 0.52, hy + s * 0.13); g.quadraticCurveTo(hx + s * 0.3, hy + s * 0.06, hx + s * 0.05, hy + s * 0.05); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,80,30,.35)'; g.lineWidth = Math.max(0.5, s * 0.006); g.beginPath(); g.moveTo(hx + s * 0.06, hy + s * 0.012); g.quadraticCurveTo(hx + s * 0.3, hy + s * 0.03, hx + s * 0.5, hy + s * 0.12); g.stroke();
  g.fillStyle = lin(g, hx, hy - s * 0.2, hx + s * 0.38, hy - s * 0.1, [[0, '#D9461C'], [0.55, '#F08A1C'], [1, '#F7C640']]);         // the casque, curving up like a rhino's horn
  g.beginPath(); g.moveTo(hx + s * 0.05, hy - s * 0.04); g.quadraticCurveTo(hx + s * 0.09, hy - s * 0.17, hx + s * 0.22, hy - s * 0.16); g.quadraticCurveTo(hx + s * 0.36, hy - s * 0.16, hx + s * 0.43, hy - s * 0.27);
  g.quadraticCurveTo(hx + s * 0.38, hy - s * 0.08, hx + s * 0.29, hy - s * 0.035); g.closePath(); g.fill();
  g.fillStyle = '#C23A1A'; P(g, [[hx + s * 0.05, hy - s * 0.04], [hx + s * 0.11, hy - s * 0.04], [hx + s * 0.09, hy + s * 0.045], [hx + s * 0.05, hy + s * 0.045]]);
  g.fillStyle = '#C23A1A'; C(g, hx + s * 0.012, hy - s * 0.012, s * 0.026); g.fillStyle = '#F2E2A6'; C(g, hx + s * 0.012, hy - s * 0.012, s * 0.017); g.fillStyle = '#111'; C(g, hx + s * 0.014, hy - s * 0.012, s * 0.009);
  g.restore();
}
/* A leatherback turtle on the sand, three-quarters from above. L = its length. o.dig: 0..1, its back flippers throwing sand. */
export function leatherback(g, x, yb, L, o) {
  o = o || {};
  const blk = '#1E242A', mid = '#323C46', spot = 'rgba(232,238,244,.6)', h = L * 0.42, dig = o.dig || 0, t = o.t || 0;
  g.save(); g.translate(x, yb); if (o.flip) g.scale(-1, 1); g.lineJoin = 'round';
  g.fillStyle = 'rgba(30,24,16,.35)'; E(g, 0, 0, L * 0.6, h * 0.22);                                                           // the hollow she has dug
  const fl = Math.sin(t * (dig ? 4.5 : 1.1)) * 0.16;
  const flipper = (px, py, rot, len, wd, col) => { g.save(); g.translate(px, py); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.moveTo(0, -wd * 0.4); g.bezierCurveTo(len * 0.35, -wd * 0.9, len * 0.85, -wd * 0.4, len, wd * 0.1); g.bezierCurveTo(len * 0.7, wd * 0.5, len * 0.3, wd * 0.6, 0, wd * 0.4); g.closePath(); g.fill(); g.restore(); };
  flipper(L * 0.2, -h * 0.55, -0.7 + fl, L * 0.42, L * 0.12, tint(mid, -0.15));                                                // the far front flipper
  g.save(); g.translate(-L * 0.42, -h * 0.25); g.rotate(-0.4 - dig * Math.max(0, Math.sin(t * 4.5)) * 0.9); g.fillStyle = mid; E(g, -L * 0.07, 0, L * 0.1, L * 0.045); g.restore();   // a back flipper, scooping
  // the shell: long, leathery, with seven ridges running to a point at the tail
  const shell = new Path2D(); shell.moveTo(-L * 0.52, -h * 0.28); shell.bezierCurveTo(-L * 0.4, -h * 0.98, L * 0.06, -h * 1.12, L * 0.3, -h * 0.82); shell.bezierCurveTo(L * 0.42, -h * 0.62, L * 0.38, -h * 0.26, L * 0.28, -h * 0.14); shell.bezierCurveTo(L * 0.05, -h * 0.06, -L * 0.3, -h * 0.08, -L * 0.52, -h * 0.28); shell.closePath();
  g.fillStyle = lin(g, 0, -h * 1.1, 0, 0, [[0, '#4C5864'], [0.5, mid], [1, blk]]); g.fill(shell);
  g.save(); g.clip(shell);
  g.strokeStyle = 'rgba(170,186,200,.5)'; g.lineWidth = Math.max(0.8, L * 0.006);
  for (let k = 0; k < 7; k++) { const v = (k - 3) / 3; g.beginPath(); g.moveTo(-L * 0.52, -h * 0.28); g.bezierCurveTo(-L * 0.3, -h * (0.56 + v * 0.38), L * 0.02, -h * (0.6 + v * 0.42), L * 0.34, -h * (0.48 + v * 0.36)); g.stroke(); }
  g.fillStyle = spot; for (let k = 0; k < 46; k++) { const u = (k * 0.618) % 1, v = (k * 0.381) % 1; C(g, -L * 0.45 + u * L * 0.75, -h * (0.18 + v * 0.8 * Math.sin(u * Math.PI + 0.2)), Math.max(0.6, L * 0.005)); }
  g.fillStyle = lin(g, 0, -h * 1.1, 0, -h * 0.4, [[0, 'rgba(200,215,235,.18)'], [1, 'rgba(200,215,235,0)']]); g.fillRect(-L, -h * 1.2, L * 2, h);   // moonlight on its back
  g.restore();
  // the head: big, spotted, with the pale pink spot on top
  g.fillStyle = mid; E(g, L * 0.4, -h * 0.38, L * 0.09, h * 0.2, 0.25);
  g.fillStyle = lin(g, L * 0.4, -h * 0.6, L * 0.55, -h * 0.2, [[0, '#56626C'], [1, blk]]); E(g, L * 0.49, -h * 0.42, L * 0.085, h * 0.19, 0.35);
  g.fillStyle = '#E2A0AE'; E(g, L * 0.48, -h * 0.57, L * 0.018, h * 0.028);
  g.fillStyle = spot; for (let k = 0; k < 9; k++) C(g, L * (0.43 + (k % 3) * 0.03), -h * (0.32 + Math.floor(k / 3) * 0.08), Math.max(0.5, L * 0.005));
  g.fillStyle = '#0C0E10'; C(g, L * 0.53, -h * 0.46, Math.max(0.8, L * 0.008));
  flipper(L * 0.26, -h * 0.2, 0.5 - fl, L * 0.48, L * 0.13, blk);                                                             // the near front flipper: huge
  g.restore();
}
/* A baby turtle crawling, about the size of a hand. */
export function hatchling(g, x, y, s, a, ph) {
  g.save(); g.translate(x, y); g.rotate(a);
  const f = Math.sin(ph) * 0.5;
  g.fillStyle = '#20262C'; [[0.25, -1, f], [0.25, 1, -f], [-0.3, -1, -f * 0.6], [-0.3, 1, f * 0.6]].forEach(([u, d, w]) => { g.save(); g.translate(u * s, d * s * 0.22); g.rotate(d * (0.8 + w)); E(g, s * 0.2, 0, s * 0.22, s * 0.06); g.restore(); });
  g.fillStyle = '#2E3640'; E(g, 0, 0, s * 0.42, s * 0.26); g.fillStyle = '#20262C'; E(g, s * 0.44, 0, s * 0.12, s * 0.1);
  g.strokeStyle = 'rgba(200,210,220,.35)'; g.lineWidth = Math.max(0.4, s * 0.03); g.beginPath(); g.moveTo(-s * 0.36, 0); g.lineTo(s * 0.36, 0); g.stroke();
  g.restore();
}
/* The lesser mouse-deer (kancil): tiny and dainty, a rounded back, legs as thin as pencils. h = its height at the shoulder. */
export function kancil(g, x, yb, h, o) {
  o = o || {};
  const ph = o.ph || 0, col = '#9A5A2C', dk = tint(col, -0.32), lt = tint(col, 0.22), still = !!o.still, hop = o.hop || 0;
  g.save(); g.translate(x, yb - hop); if (o.flip) g.scale(-1, 1); g.lineJoin = 'round';
  const leg = (lx, off, c, w) => { const a = still ? 0 : Math.sin(ph + off) * 0.45, len = h * 0.64, kx = lx + Math.sin(a) * len * 0.45, ky = -len * 0.45; curve(g, [[lx, -len], [kx, ky], [kx + Math.sin(a) * len * 0.1, 0]], Math.max(0.7, h * w), c); g.fillStyle = '#20160E'; E(g, kx + Math.sin(a) * len * 0.1 + h * 0.02, -h * 0.012, h * 0.035, h * 0.018); };
  leg(-h * 0.44, Math.PI, dk, 0.05); leg(h * 0.34, 0, dk, 0.045);
  g.fillStyle = lin(g, 0, -h * 1.15, 0, -h * 0.5, [[0, lt], [0.6, col], [1, dk]]);
  g.beginPath(); g.moveTo(-h * 0.64, -h * 0.66); g.bezierCurveTo(-h * 0.68, -h * 1.14, -h * 0.12, -h * 1.16, h * 0.28, -h * 0.96); g.bezierCurveTo(h * 0.5, -h * 0.86, h * 0.5, -h * 0.6, h * 0.36, -h * 0.55); g.bezierCurveTo(0, -h * 0.5, -h * 0.42, -h * 0.5, -h * 0.64, -h * 0.66); g.closePath(); g.fill();
  g.fillStyle = 'rgba(240,230,214,.9)'; E(g, -h * 0.06, -h * 0.56, h * 0.34, h * 0.05);
  leg(-h * 0.38, 0, col, 0.055); leg(h * 0.28, Math.PI, col, 0.05);
  g.fillStyle = col; g.beginPath(); g.moveTo(h * 0.24, -h * 0.95); g.quadraticCurveTo(h * 0.48, -h * 1.12, h * 0.6, -h * 1.22); g.lineTo(h * 0.7, -h * 1.03); g.quadraticCurveTo(h * 0.56, -h * 0.84, h * 0.42, -h * 0.66); g.closePath(); g.fill();
  g.fillStyle = '#F2EADC'; P(g, [[h * 0.44, -h * 0.72], [h * 0.6, -h * 0.98], [h * 0.55, -h * 1.01], [h * 0.4, -h * 0.79]]); P(g, [[h * 0.5, -h * 0.74], [h * 0.64, -h * 0.94], [h * 0.62, -h * 0.98], [h * 0.47, -h * 0.79]]);   // white throat stripes
  g.fillStyle = lin(g, h * 0.6, -h * 1.3, h * 0.9, -h * 1.05, [[0, lt], [1, col]]); E(g, h * 0.74, -h * 1.17, h * 0.17, h * 0.1, 0.35);
  g.fillStyle = dk; E(g, h * 0.88, -h * 1.09, h * 0.04, h * 0.03);
  g.fillStyle = '#100A06'; C(g, h * 0.72, -h * 1.2, h * 0.048); g.fillStyle = 'rgba(255,255,255,.75)'; C(g, h * 0.705, -h * 1.218, h * 0.015);
  g.fillStyle = dk; E(g, h * 0.62, -h * 1.31, h * 0.05, h * 0.095, -0.4 + Math.sin((o.t || 0) * 3) * 0.12);
  g.restore();
}
/* A crocodile lying in the water: only its back, the ridges and its eyes show. L = its length. */
export function crocInWater(g, x, y, L, o) {
  o = o || {};
  const col = o.col || '#4A5A36';
  g.fillStyle = 'rgba(0,0,0,.18)'; E(g, x, y + L * 0.02, L * 0.52, L * 0.05);
  g.fillStyle = lin(g, 0, y - L * 0.06, 0, y + L * 0.02, [[0, tint(col, 0.15)], [1, tint(col, -0.25)]]);
  g.beginPath(); g.moveTo(x - L * 0.5, y); g.quadraticCurveTo(x - L * 0.2, y - L * 0.075, x + L * 0.25, y - L * 0.06); g.quadraticCurveTo(x + L * 0.45, y - L * 0.05, x + L * 0.52, y - L * 0.01); g.lineTo(x + L * 0.5, y + L * 0.01); g.lineTo(x - L * 0.5, y + L * 0.01); g.closePath(); g.fill();
  g.fillStyle = tint(col, -0.2); for (let k = 0; k < 12; k++) { const u = -0.4 + k * 0.06; P(g, [[x + u * L, y - L * 0.055 + Math.abs(u) * L * 0.03], [x + (u + 0.02) * L, y - L * 0.085 + Math.abs(u) * L * 0.03], [x + (u + 0.04) * L, y - L * 0.055 + Math.abs(u) * L * 0.03]]); }
  g.fillStyle = tint(col, 0.1); E(g, x + L * 0.3, y - L * 0.065, L * 0.03, L * 0.02); g.fillStyle = '#E8D36A'; C(g, x + L * 0.3, y - L * 0.07, L * 0.01); g.fillStyle = '#111'; C(g, x + L * 0.303, y - L * 0.07, L * 0.004);
}
/* A crocodile in the water seen from the front, the way it lies when it points up the river towards us: only the top of
   its head shows, its eyes on their bumps and its nostrils at the tip of its snout. w = the width of its head. */
export function crocHead(g, x, y, w, o) {
  o = o || {};
  const col = o.col || '#4E5C38', blink = Math.sin((o.t || 0) * 0.9 + x) > 0.96 ? 0.2 : 1;
  g.fillStyle = 'rgba(0,0,0,.22)'; E(g, x, y + w * 0.03, w * 0.64, w * 0.07);
  g.fillStyle = lin(g, 0, y - w * 0.24, 0, y + w * 0.02, [[0, tint(col, 0.1)], [1, tint(col, -0.32)]]);     // the back of its head, low in the water
  g.beginPath(); g.moveTo(x - w * 0.52, y); g.quadraticCurveTo(x - w * 0.46, y - w * 0.15, x - w * 0.24, y - w * 0.17); g.lineTo(x + w * 0.24, y - w * 0.17); g.quadraticCurveTo(x + w * 0.46, y - w * 0.15, x + w * 0.52, y); g.closePath(); g.fill();
  g.fillStyle = tint(col, -0.2); for (let k = -2; k <= 2; k++) P(g, [[x + k * w * 0.09 - w * 0.025, y - w * 0.16], [x + k * w * 0.09, y - w * 0.22], [x + k * w * 0.09 + w * 0.025, y - w * 0.16]]);   // the scales along its neck
  [-1, 1].forEach((d) => {                                                        // the eyes, up on their bumps
    g.fillStyle = tint(col, 0.06); E(g, x + d * w * 0.24, y - w * 0.19, w * 0.12, w * 0.085);
    g.fillStyle = '#D6BE48'; E(g, x + d * w * 0.24, y - w * 0.215, w * 0.055, w * 0.042 * blink);
    g.fillStyle = '#121208'; E(g, x + d * w * 0.24, y - w * 0.215, w * 0.012, w * 0.036 * blink);
  });
  g.fillStyle = lin(g, 0, y - w * 0.12, 0, y + w * 0.04, [[0, tint(col, 0.14)], [1, tint(col, -0.25)]]); E(g, x, y - w * 0.035, w * 0.28, w * 0.085);   // its snout, nearer to us
  g.fillStyle = tint(col, 0.1); E(g, x, y - w * 0.1, w * 0.1, w * 0.05); g.fillStyle = '#1A1E10'; E(g, x - w * 0.035, y - w * 0.105, w * 0.02, w * 0.013); E(g, x + w * 0.035, y - w * 0.105, w * 0.02, w * 0.013);
  g.strokeStyle = 'rgba(220,240,236,.35)'; g.lineWidth = Math.max(0.6, w * 0.012); g.beginPath(); g.ellipse(x, y + w * 0.012, w * 0.6, w * 0.07, 0, 0.1, Math.PI - 0.1); g.stroke();
}
/* A Rafflesia seen a little from above: five thick, warty, brick-red lobes round a deep cup. r = half its width.
   o.open: 0 (a dark bud) to 1 (wide open). */
export function rafflesia(g, x, y, r, o) {
  o = o || {};
  const open = o.open == null ? 1 : o.open;
  if (open < 0.05) {
    g.fillStyle = rad(g, x - r * 0.15, y - r * 0.3, 0, r * 0.6, [[0, '#7E4C3A'], [1, '#3A2018']]); E(g, x, y - r * 0.25, r * 0.42, r * 0.38);
    g.strokeStyle = 'rgba(20,10,5,.5)'; g.lineWidth = Math.max(0.8, r * 0.02); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x, y - r * 0.25, r * (0.12 + k * 0.06), Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    return;
  }
  const ry = 0.5, warts = (cx, cy, rr, n, seed) => { let sd = seed; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; for (let j = 0; j < n; j++) { const a = R() * TAU, d = Math.sqrt(R()) * rr * 0.8, wx = cx + Math.cos(a) * d, wy = cy + Math.sin(a) * d * ry, sz = rr * (0.05 + R() * 0.05); g.fillStyle = 'rgba(60,20,10,.35)'; E(g, wx + sz * 0.2, wy + sz * 0.25, sz, sz * 0.7); g.fillStyle = '#F2E4D2'; E(g, wx, wy, sz, sz * 0.7); g.fillStyle = 'rgba(255,255,255,.7)'; E(g, wx - sz * 0.3, wy - sz * 0.25, sz * 0.35, sz * 0.25); } };
  const lobes = [0, 1, 2, 3, 4].map((k) => -Math.PI / 2 + k * TAU / 5 + 0.3).sort((a, b) => Math.sin(a) - Math.sin(b));   // the back ones first
  lobes.forEach((a, i) => {
    const px = x + Math.cos(a) * r * 0.58 * open, py = y + Math.sin(a) * r * 0.58 * ry * open, back = Math.sin(a) < 0, lr = r * 0.5;
    g.fillStyle = 'rgba(30,10,6,.45)'; E(g, px + lr * 0.06, py + lr * 0.22 * ry, lr * 1.02, lr * ry * 1.0);                        // its thickness
    g.fillStyle = rad(g, px - lr * 0.2, py - lr * 0.2 * ry, lr * 0.1, lr * 1.05, [[0, back ? '#B23C22' : '#C9472A'], [0.7, back ? '#8E2A18' : '#A6341E'], [1, '#6A1C10']]);
    g.save(); g.translate(px, py); g.scale(1, ry); g.rotate(a); blob(g, [[-lr * 0.6, -lr * 0.7], [lr * 0.3, -lr * 0.86], [lr * 0.95, -lr * 0.36], [lr * 1.0, lr * 0.32], [lr * 0.36, lr * 0.84], [-lr * 0.6, lr * 0.7]]); g.restore();
    warts(px + Math.cos(a) * lr * 0.15, py + Math.sin(a) * lr * 0.15 * ry, lr * 0.85, 26, 11 + i * 7);
  });
  g.fillStyle = rad(g, x, y - r * 0.1, r * 0.05, r * 0.42, [[0, '#E3A07C'], [0.6, '#B6543A'], [1, '#7A2A1A']]); E(g, x, y - r * 0.12, r * 0.42, r * 0.42 * 0.62);   // the cup
  g.fillStyle = '#F1E2CF'; for (let j = 0; j < 28; j++) { const a = (j / 28) * TAU, rr = r * 0.34; C(g, x + Math.cos(a) * rr, y - r * 0.12 + Math.sin(a) * rr * 0.6, r * 0.02); }
  g.fillStyle = rad(g, x, y - r * 0.12, 0, r * 0.25, [[0, '#200806'], [0.8, '#44160E'], [1, '#6A2A1A']]); E(g, x, y - r * 0.12, r * 0.25, r * 0.25 * 0.56);   // the opening
  g.fillStyle = 'rgba(240,210,190,.85)'; for (let j = 0; j < 16; j++) { const a = (j / 16) * TAU, rr = r * 0.13; P(g, [[x + Math.cos(a) * rr - r * 0.012, y - r * 0.12 + Math.sin(a) * rr * 0.55], [x + Math.cos(a) * rr, y - r * 0.17 + Math.sin(a) * rr * 0.55], [x + Math.cos(a) * rr + r * 0.012, y - r * 0.12 + Math.sin(a) * rr * 0.55]]); }
}
/* A bat in flight, tiny, seen from below: f is the wingbeat (-1..1). */
export function batTiny(g, x, y, s, f) {
  g.beginPath(); g.moveTo(x - s, y - f * s * 0.6); g.quadraticCurveTo(x - s * 0.5, y + s * 0.1, x, y); g.quadraticCurveTo(x + s * 0.5, y + s * 0.1, x + s, y - f * s * 0.6);
  g.lineTo(x + s * 0.5, y + s * 0.18); g.lineTo(x, y + s * 0.12); g.lineTo(x - s * 0.5, y + s * 0.18); g.closePath(); g.fill();
}
/* The soft light of a firefly. */
export const glowDot = (ctx, x, y, r, a) => dotGlow(ctx, x, y, r, '214,255,130', a);
