/* The line-up for "How big?" and "How tall?": the record-breaking animals and the wonders of the world, each drawn
   to scale in metres (x across, y up from the ground), with its own light and shade, so a giraffe is a giraffe and a
   blue whale is a blue whale at any size, from a phone to the class board.
   Every drawing has its origin on the ground in the middle of its footprint and is drawn by the caller inside
   translate(x, y) · scale(k, -k), so one unit is one metre. o: { k (pixels per metre), t (seconds, for the small
   movements: an ear, a tail, a hummingbird's wings), hold (the pupil holds out a flower for the hummingbird) }.
   The wonders reuse their own drawings from the Seven Wonders scenes (wonders.js), clipped to the monument and scaled
   to its real height, so "How tall?" matches what the class has just seen; the Great Pyramid, the Great Wall and
   Big Ben's tower are drawn here. */
import { TAU } from './util.js?v=3c9d4698';
import { seeded, tint } from './scenery.js?v=3c9d4698';
import { WONDER_SCENES } from './wonders.js?v=3c9d4698';

/* ---------------- drawing helpers (metres, y up) ---------------- */
/* a smooth curve through points (Catmull-Rom), closed or open */
function spline(g, pts, closed) {
  const n = pts.length;
  g.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) g.closePath();
}
const blob = (g, pts, fill) => { g.beginPath(); spline(g, pts, true); if (fill) { g.fillStyle = fill; g.fill(); } };
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, rot, fill) => { g.beginPath(); g.ellipse(x, y, Math.max(1e-4, rx), Math.max(1e-4, ry), rot || 0, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } };
const disc = (g, x, y, r, fill) => ell(g, x, y, r, r, 0, fill);
const rect = (g, x, y, w, h, fill) => { g.fillStyle = fill; g.fillRect(x, y, w, h); };
function stroke(g, pts, w, col, open) { g.beginPath(); spline(g, pts, false); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function line(g, x0, y0, x1, y1, w, col) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }
/* a band along a centre line, thick w(u) at each point (u from 0 at the start to 1 at the end): legs, necks, tails, trunks */
function band(g, pts, w0, w1, fill) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const u = i / (n - 1), w = (typeof w0 === 'function' ? w0(u) : w0 + (w1 - w0) * u) / 2;
    L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); R.push([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]);
  }
  g.beginPath(); spline(g, L, false); const r = R.reverse(); g.lineTo(r[0][0], r[0][1]); spline2(g, r); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
}
function spline2(g, pts) {                                     // continue a path along more points, smoothly
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
const vgrad = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
const hgrad = (g, x0, x1, stops) => { const gr = g.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
/* an eye: white (or coloured) ball, dark pupil, a glint; s is its radius in metres */
function eye(g, x, y, s, iris, k) {
  disc(g, x, y, s, iris || '#1A1410');
  if (s * k > 2.2) { disc(g, x + s * 0.3, y + s * 0.32, s * 0.32, 'rgba(255,255,255,.85)'); }
}
/* a contact shadow on the ground under something w wide */
function shadow(g, x0, x1, a) { const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2; const gr = g.createRadialGradient(cx, 0, 0, cx, 0, rx); gr.addColorStop(0, 'rgba(30,24,10,' + (a || 0.28) + ')'); gr.addColorStop(1, 'rgba(30,24,10,0)'); g.save(); g.scale(1, 0.12); g.fillStyle = gr; g.beginPath(); g.arc(cx, 0, rx, 0, TAU); g.fill(); g.restore(); }

/* giraffe patches: a jittered honeycomb of rounded polygons, worked out once */
let patches = null;
function giraffePatches() {
  if (patches) return patches;
  const R = seeded(5501), out = [];
  const add = (x0, x1, y0, y1, cell) => {
    for (let row = 0, y = y0; y < y1; row++, y += cell * 0.86) {
      for (let x = x0 + (row % 2 ? cell / 2 : 0); x < x1; x += cell) {
        const cx = x + (R() - 0.5) * cell * 0.3, cy = y + (R() - 0.5) * cell * 0.3, r = cell * 0.47, n = 6, rot = R() * 0.6;
        out.push(Array.from({ length: n }, (_, i) => { const a = rot + i * TAU / n, rr = r * (0.82 + R() * 0.3); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92]; }));
      }
    }
  };
  add(-1.4, 1.3, 1.0, 3.4, 0.36);                              // body and the tops of the legs
  add(0.2, 2.1, 3.0, 5.2, 0.26);                               // the neck
  add(-1.2, 1.1, 0.75, 1.3, 0.2);                              // above the knees
  patches = out;
  return out;
}

/* ================= the animals ================= */
export const ART = {};

/* ---- a Year 4 pupil, about 1.3 m tall, side view facing right; o.hold: holding out a flower for the hummingbird ---- */
ART.pupil = {
  x0: -0.13, x1: 0.24, h: 1.3, xr: 0.52,                        // xr: how far the flower reaches when held out
  draw(g, o) {
    const k = o.k || 100, t = o.t || 0, skin = '#B97A4E', skd = '#9A6038', hair = '#2E2018';
    shadow(g, -0.16, 0.2, 0.3);
    // the far leg and arm, a little darker
    band(g, [[-0.025, 0.66], [-0.03, 0.35], [-0.03, 0.06]], 0.085, 0.07, skd);
    rect(g, -0.07, 0.06, 0.08, 0.19, '#D7DCE4');                            // sock
    blob(g, [[-0.075, 0], [0.06, 0], [0.07, 0.03], [0.02, 0.07], [-0.07, 0.07]], '#1E1E24');   // shoe
    // the near leg
    band(g, [[0.02, 0.66], [0.022, 0.35], [0.02, 0.06]], 0.09, 0.075, skin);
    rect(g, -0.022, 0.06, 0.085, 0.2, '#EEF1F6'); rect(g, -0.022, 0.235, 0.085, 0.025, '#B7C0CF');
    blob(g, [[-0.03, 0], [0.12, 0], [0.13, 0.035], [0.08, 0.075], [-0.03, 0.075]], '#16161C');
    disc(g, 0.09, 0.05, 0.012, 'rgba(255,255,255,.18)');
    // shorts
    blob(g, [[-0.095, 0.42], [0.1, 0.42], [0.105, 0.6], [0.09, 0.7], [-0.09, 0.71], [-0.1, 0.58]], '#283764');
    line(g, 0.0, 0.43, 0.005, 0.6, 0.006, 'rgba(0,0,0,.25)');
    // shirt
    g.save(); blob(g, [[-0.095, 0.66], [0.095, 0.66], [0.105, 0.86], [0.09, 1.02], [0.03, 1.07], [-0.05, 1.06], [-0.1, 0.98], [-0.105, 0.8]], hgrad(g, -0.1, 0.1, [[0, '#DCE2EA'], [0.55, '#FAFBFC'], [1, '#E9EDF2']])); g.clip();
    line(g, -0.1, 0.7, 0.1, 0.7, 0.012, 'rgba(0,0,0,.06)');
    g.restore();
    poly(g, [[0.07, 1.04], [0.1, 1.0], [0.09, 0.78], [0.075, 0.74], [0.065, 0.78], [0.06, 1.0]], '#C8243A');   // the tie
    poly(g, [[0.02, 1.07], [0.085, 1.04], [0.065, 1.02], [0.03, 1.035]], '#FFFFFF');                       // collar
    // neck and head
    rect(g, -0.025, 1.04, 0.055, 0.07, skd);
    const hy = 1.195;
    blob(g, [[-0.085, hy + 0.01], [-0.06, hy + 0.08], [0.0, hy + 0.105], [0.065, hy + 0.08], [0.085, hy + 0.02], [0.1, hy - 0.005], [0.088, hy - 0.035], [0.08, hy - 0.06], [0.065, hy - 0.09], [0.02, hy - 0.098], [-0.04, hy - 0.08], [-0.08, hy - 0.04]], skin);
    disc(g, 0.098, hy - 0.006, 0.012, skin);                                // nose
    blob(g, [[-0.095, hy + 0.0], [-0.08, hy + 0.08], [-0.02, hy + 0.11], [0.05, hy + 0.105], [0.09, hy + 0.06], [0.06, hy + 0.055], [0.0, hy + 0.06], [-0.035, hy + 0.035], [-0.06, hy - 0.035], [-0.09, hy - 0.04]], hair);   // hair
    blob(g, [[-0.025, hy + 0.0], [-0.01, hy + 0.03], [0.012, hy + 0.012], [0.008, hy - 0.025], [-0.015, hy - 0.03]], skd);   // ear
    if (k > 60) {
      const blink = (t % 4.2) < 0.12;
      if (blink) line(g, 0.052, hy + 0.012, 0.072, hy + 0.012, 0.004, '#1A120C'); else eye(g, 0.062, hy + 0.012, 0.0085, '#1A120C', k);
      line(g, 0.048, hy + 0.034, 0.078, hy + 0.036, 0.005, hair);                                  // eyebrow
      g.beginPath(); g.moveTo(0.07, hy - 0.055); g.quadraticCurveTo(0.082, hy - 0.062, 0.09, hy - 0.05); g.lineWidth = 0.004; g.strokeStyle = '#7A3A24'; g.stroke();   // a smile
    }
    // the near arm: down by the side, or held out with a flower
    if (o.hold) {
      band(g, [[0.0, 1.0], [0.1, 0.92], [0.2, 0.86], [0.31, 0.84]], 0.07, 0.055, '#F2F4F7');      // sleeve and arm
      band(g, [[0.12, 0.905], [0.2, 0.862], [0.3, 0.842]], 0.052, 0.045, skin);
      disc(g, 0.325, 0.845, 0.03, skin);                                                           // hand
      line(g, 0.33, 0.85, 0.37, 0.935, 0.005, '#3E7A3A');                                          // the stem
      const fx = 0.372, fy = 0.94;
      for (let i = 0; i < 5; i++) { const a = -0.4 + i * TAU / 5; ell(g, fx + Math.cos(a) * 0.012, fy + Math.sin(a) * 0.012, 0.013, 0.008, a, i % 2 ? '#E84A7A' : '#F06292'); }
      disc(g, fx, fy, 0.0055, '#FFD54F');
    } else {
      band(g, [[0.0, 1.0], [0.015, 0.84], [0.02, 0.66]], 0.07, 0.055, '#F2F4F7');
      band(g, [[0.015, 0.86], [0.02, 0.74], [0.022, 0.64]], 0.05, 0.045, skin);
      disc(g, 0.024, 0.62, 0.03, skin);
    }
  }
};

/* ---- the bee hummingbird, about 5.5 cm from beak to tail, hovering (drawn facing left, at the flower) ---- */
ART.hummingbird = {
  x0: -0.03, x1: 0.03, h: 0.03, flying: true,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 1000;
    g.save(); g.scale(-1, 1);                                               // face left
    g.translate(0, Math.sin(t * 9) * 0.0015);
    const flap = Math.sin(t * 160);
    // wings: a blur of two strokes
    g.globalAlpha = 0.42;
    ell(g, -0.004, 0.012 + flap * 0.004, 0.022, 0.006, 0.9 + flap * 0.35, '#9FB3C8');
    ell(g, -0.004, 0.006 - flap * 0.004, 0.02, 0.005, -0.5 - flap * 0.3, '#B9C8D8');
    g.globalAlpha = 1;
    // tail
    poly(g, [[-0.018, -0.002], [-0.034, -0.012], [-0.033, -0.004], [-0.03, 0.002]], '#24435E');
    // body
    blob(g, [[-0.02, 0.0], [-0.008, 0.008], [0.008, 0.009], [0.014, 0.003], [0.008, -0.006], [-0.008, -0.007]], hgrad(g, -0.02, 0.014, [[0, '#2E6FA8'], [1, '#3D8FB0']]));
    blob(g, [[-0.012, -0.004], [0.002, -0.006], [0.01, -0.003], [0.004, -0.0005], [-0.01, -0.001]], '#DADFE4');     // pale belly
    // head with the fiery throat of a male
    disc(g, 0.014, 0.006, 0.0068, '#2E6FA8');
    blob(g, [[0.008, 0.0025], [0.017, 0.0005], [0.019, 0.004], [0.012, 0.0055]], '#F0386B');
    if (k > 1500) eye(g, 0.016, 0.0075, 0.0013, '#0A0A0A', k);
    // the long thin beak
    line(g, 0.019, 0.006, 0.033, 0.0045, Math.max(0.0012, 0.6 / k), '#1C1C1C');
    g.restore();
  }
};

/* ---- ostrich: about 2.7 m to the top of its head ---- */
ART.ostrich = {
  x0: -0.92, x1: 0.84, h: 2.7,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 60, bob = Math.sin(t * 1.3) * 0.02;
    shadow(g, -0.6, 0.55, 0.3);
    // the far leg
    band(g, [[-0.18, 1.08], [-0.12, 0.66], [-0.17, 0.05]], 0.15, 0.06, '#9E7C78');
    poly(g, [[-0.2, 0], [-0.03, 0], [-0.04, 0.035], [-0.19, 0.05]], '#8C6D69');
    // the near leg: a bare pinkish thigh, a long shin, two big toes
    band(g, [[0.05, 1.1], [0.1, 0.66]], 0.16, 0.085, '#D3A39C');
    band(g, [[0.1, 0.66], [0.06, 0.32], [0.08, 0.05]], 0.07, 0.055, '#C9958C');
    ell(g, 0.1, 0.66, 0.05, 0.045, 0, '#C08A82');
    poly(g, [[0.04, 0], [0.26, 0], [0.27, 0.025], [0.12, 0.055], [0.05, 0.05]], '#B98580');
    line(g, 0.12, 0.012, 0.25, 0.012, 0.012, 'rgba(0,0,0,.12)');
    // the body: black feathers, white plumes on the wings and tail
    const by = 1.34;
    blob(g, [[0.5, by + 0.1], [0.32, by + 0.32], [0.0, by + 0.38], [-0.4, by + 0.34], [-0.66, by + 0.24], [-0.72, by + 0.04], [-0.5, by - 0.28], [-0.1, by - 0.38], [0.3, by - 0.24]], vgrad(g, by + 0.38, by - 0.38, [[0, '#3A322E'], [0.5, '#211C19'], [1, '#141110']]));
    g.save(); blob(g, [[0.5, by + 0.1], [0.32, by + 0.32], [0.0, by + 0.38], [-0.4, by + 0.34], [-0.66, by + 0.24], [-0.72, by + 0.04], [-0.5, by - 0.28], [-0.1, by - 0.38], [0.3, by - 0.24]]); g.clip();
    if (k > 30) { const R = seeded(77); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 0.012; for (let i = 0; i < 40; i++) { const x = -0.6 + R() * 1.0, y = by - 0.3 + R() * 0.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 0.08, y - 0.03, x - 0.16, y - 0.09); g.stroke(); } }
    g.restore();
    blob(g, [[-0.62, by + 0.2], [-0.8, by + 0.12], [-0.92, by - 0.1], [-0.86, by - 0.3], [-0.72, by - 0.2], [-0.66, by - 0.02]], '#EFEAE0');      // the drooping white tail
    blob(g, [[-0.1, by - 0.12], [-0.42, by - 0.06], [-0.66, by - 0.14], [-0.68, by - 0.3], [-0.42, by - 0.38], [-0.12, by - 0.34]], '#F6F2EA');   // the white wing feathers
    if (k > 30) { g.strokeStyle = 'rgba(150,140,130,.55)'; g.lineWidth = 0.01; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-0.15 - i * 0.08, by - 0.14 - (i % 2) * 0.03); g.quadraticCurveTo(-0.3 - i * 0.08, by - 0.24, -0.38 - i * 0.06, by - 0.34); g.stroke(); } }
    // the long neck and the small head, bobbing
    const hx = 0.6, hy = 2.6 + bob;
    band(g, [[0.34, by + 0.12], [0.44, 1.8], [0.47, 2.15], [hx - 0.04, hy - 0.06]], (u) => 0.24 - Math.sqrt(u) * 0.15, 0, hgrad(g, 0.3, 0.6, [[0, '#B48C86'], [1, '#D5B2AA']]));
    if (k > 40) { g.strokeStyle = 'rgba(90,70,66,.35)'; g.lineWidth = 0.006; for (let i = 0; i < 18; i++) { const u = i / 18, x = 0.38 + u * 0.18, y = by + 0.2 + u * (hy - by - 0.3); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 0.03, y - 0.02); g.stroke(); } }
    blob(g, [[hx - 0.09, hy - 0.04], [hx - 0.07, hy + 0.06], [hx + 0.02, hy + 0.1], [hx + 0.08, hy + 0.05], [hx + 0.09, hy - 0.02], [hx + 0.02, hy - 0.06]], '#C9A49D');
    blob(g, [[hx + 0.06, hy + 0.0], [hx + 0.2, hy - 0.025], [hx + 0.2, hy - 0.04], [hx + 0.07, hy - 0.05]], '#D9AE8C');      // the flat beak
    eye(g, hx + 0.03, hy + 0.03, 0.022, '#2A1A12', k);
    if (k > 80) line(g, hx + 0.01, hy + 0.055, hx + 0.05, hy + 0.06, 0.005, '#1A1210');
  }
};

/* ---- African bush elephant: about 3.2 m tall at the shoulder ---- */
ART.elephant = {
  x0: -2.25, x1: 2.6, h: 3.2,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 40, flap = Math.sin(t * 0.9) * 0.05, sway = Math.sin(t * 0.7) * 0.06;
    const skin = '#8F8A84', dark = '#6E6A65', far = '#77726C';
    shadow(g, -2.2, 2.3, 0.32);
    // the far legs
    band(g, [[-1.05, 1.6], [-1.08, 0.8], [-1.05, 0.06]], 0.5, 0.44, far); ell(g, -1.05, 0.08, 0.25, 0.09, 0, far);
    band(g, [[0.65, 1.6], [0.66, 0.8], [0.66, 0.06]], 0.52, 0.45, far); ell(g, 0.66, 0.08, 0.26, 0.09, 0, far);
    // the body
    const body = [[1.2, 2.9], [0.5, 3.2], [-0.4, 3.02], [-1.2, 2.88], [-1.85, 2.72], [-2.1, 2.3], [-2.05, 1.8], [-1.5, 1.45], [-0.5, 1.32], [0.5, 1.4], [1.25, 1.6], [1.45, 2.3]];
    blob(g, body, vgrad(g, 3.2, 1.3, [[0, '#A29C95'], [0.55, skin], [1, '#6F6A64']]));
    g.save(); blob(g, body); g.clip();
    if (k > 12) { g.strokeStyle = 'rgba(70,64,58,.35)'; g.lineWidth = Math.max(0.015, 0.7 / k); [[-1.6, 2.6, -1.75, 1.7], [-1.3, 2.75, -1.45, 1.6], [0.1, 3.0, 0.0, 1.5]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 0.1, (b + d) / 2, c, d); g.stroke(); }); }
    g.restore();
    // the near legs: thick pillars with wrinkles and toenails
    const leg = (x, top) => {
      band(g, [[x, top], [x - 0.02, 0.9], [x, 0.06]], 0.56, 0.48, hgrad(g, x - 0.28, x + 0.28, [[0, '#6F6A64'], [0.45, '#9C968F'], [1, '#76716B']]));
      ell(g, x, 0.07, 0.27, 0.09, 0, '#7C7770');
      if (k > 14) { g.strokeStyle = 'rgba(60,55,50,.4)'; g.lineWidth = Math.max(0.012, 0.6 / k); [0.28, 0.4, 0.86, 0.98, 1.1].forEach((y) => { g.beginPath(); g.moveTo(x - 0.22, y); g.quadraticCurveTo(x, y - 0.05, x + 0.22, y + 0.01); g.stroke(); }); }
      [-0.14, 0.0, 0.14].forEach((d) => ell(g, x + d + 0.04, 0.05, 0.05, 0.035, 0, '#D9D2C2'));
    };
    leg(-1.35, 1.75); leg(0.95, 1.75);
    // the tail
    stroke(g, [[-2.05, 2.45], [-2.13, 2.0], [-2.12, 1.5]], 0.06, dark);
    ell(g, -2.12, 1.42, 0.035, 0.09, 0, '#2E2A26');
    // the head
    const head = [[1.05, 2.95], [1.5, 3.02], [1.85, 2.82], [2.05, 2.4], [2.06, 2.0], [1.9, 1.75], [1.55, 1.7], [1.2, 1.9]];
    blob(g, head, vgrad(g, 3.0, 1.7, [[0, '#A39D96'], [1, '#7A756F']]));
    // the trunk, swaying a little
    const tx = 2.14 + sway, tip = [[2.0, 2.15], [2.13, 1.6], [2.18 + sway * 0.5, 1.0], [tx, 0.5], [tx + 0.07, 0.28]];
    band(g, tip, (u) => 0.34 - u * 0.22, 0, hgrad(g, 1.9, 2.4, [[0, '#7E7973'], [0.5, '#9A948D'], [1, '#78736D']]));
    if (k > 14) { g.strokeStyle = 'rgba(60,55,50,.45)'; g.lineWidth = Math.max(0.01, 0.5 / k); for (let i = 1; i < 14; i++) { const u = i / 14, p = tip[Math.min(3, Math.floor(u * 4))], q = tip[Math.min(4, Math.floor(u * 4) + 1)], f = u * 4 % 1, x = p[0] + (q[0] - p[0]) * f, y = p[1] + (q[1] - p[1]) * f, w = (0.34 - u * 0.22) / 2; g.beginPath(); g.moveTo(x - w, y + 0.02); g.lineTo(x + w, y - 0.02); g.stroke(); } }
    // the tusk
    band(g, [[1.92, 1.88], [2.15, 1.62], [2.42, 1.55], [2.6, 1.66]], (u) => 0.13 - u * 0.11, 0, '#EFE6CF');
    // the ear: a great flap, shaped a little like Africa
    g.save(); g.translate(1.05, 2.85); g.rotate(flap); g.translate(-1.05, -2.85);
    const ear = [[1.05, 3.02], [0.62, 3.05], [0.3, 2.78], [0.22, 2.25], [0.36, 1.8], [0.62, 1.42], [0.85, 1.25], [0.98, 1.5], [1.18, 1.82], [1.22, 2.4]];
    blob(g, ear, hgrad(g, 0.2, 1.25, [[0, '#7D7872'], [1, '#9E9891']]));
    if (k > 12) { g.strokeStyle = 'rgba(80,60,60,.35)'; g.lineWidth = Math.max(0.012, 0.6 / k); [[0.95, 2.8, 0.45, 2.3], [1.0, 2.5, 0.5, 1.9], [1.05, 2.2, 0.75, 1.55]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 - 0.1, (b + d) / 2 + 0.1, c, d); g.stroke(); }); }
    g.restore();
    eye(g, 1.68, 2.42, 0.045, '#2A2018', k);
    if (k > 20) { g.strokeStyle = 'rgba(60,55,50,.5)'; g.lineWidth = Math.max(0.01, 0.5 / k); g.beginPath(); g.arc(1.68, 2.42, 0.09, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
    blob(g, [[1.75, 1.8], [1.95, 1.78], [1.92, 1.7], [1.78, 1.68]], '#5E5853');                       // the mouth
  }
};

/* ---- giraffe: about 5.5 m to the top of its horns ---- */
ART.giraffe = {
  x0: -1.35, x1: 2.55, h: 5.5,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 30, base = '#F1DDB2', patch = '#A3552A', patchD = '#8A4421', leg = '#E9D3A6';
    const tail = Math.sin(t * 1.6) * 0.06, chew = Math.sin(t * 3) * 0.008;
    shadow(g, -1.3, 1.2, 0.3);
    // the far legs, a little darker
    const legs = (x, top, knee, col) => { band(g, [[x, top], [x + 0.02, knee], [x - 0.01, 0.12]], (u) => 0.2 - u * 0.1, 0, col); ell(g, x - 0.01, 0.1, 0.06, 0.08, 0, col); poly(g, [[x - 0.08, 0], [x + 0.07, 0], [x + 0.05, 0.08], [x - 0.07, 0.08]], '#3A2A20'); };
    legs(-0.66, 2.1, 1.05, '#D3BC8E'); legs(0.52, 2.1, 1.0, '#D3BC8E');
    // body and neck in one smooth shape
    const body = [[1.08, 2.45], [1.15, 2.95], [1.32, 3.5], [1.55, 4.15], [1.78, 4.72], [1.72, 5.02], [1.52, 4.85], [1.2, 4.3], [0.85, 3.7], [0.5, 3.28], [0.0, 3.08], [-0.6, 2.9], [-1.1, 2.75], [-1.28, 2.45], [-1.15, 2.05], [-0.6, 1.9], [0.2, 1.92], [0.8, 2.0]];
    blob(g, body, base);
    g.save(); blob(g, body); g.clip();
    giraffePatches().forEach((p) => poly(g, p, patch));
    if (k > 20) { g.fillStyle = 'rgba(0,0,0,.08)'; giraffePatches().forEach((p, i) => { if (i % 3 === 0) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let j = 1; j < 4; j++) g.lineTo(p[j][0], p[j][1]); g.closePath(); g.fill(); } }); }
    g.fillStyle = vgrad(g, 3.4, 1.9, [[0, 'rgba(255,240,210,.12)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(60,30,10,.28)']]); g.fillRect(-1.5, 1.8, 3.4, 3.6);
    g.restore();
    // the mane along the back of the neck
    band(g, [[0.55, 3.32], [0.95, 3.82], [1.3, 4.4], [1.58, 4.92]], 0.07, 0.05, patchD);
    // the near legs: patched at the top, pale below the knee
    const nearLeg = (x, top, knee) => {
      band(g, [[x, top], [x + 0.03, knee], [x, 0.12]], (u) => 0.24 - u * 0.12, 0, leg);
      g.save(); band(g, [[x, top], [x + 0.03, knee], [x, 0.12]], (u) => 0.24 - u * 0.12, 0); g.clip();
      giraffePatches().forEach((p) => { if (p[0][1] > knee - 0.15) poly(g, p, patch); });
      g.restore();
      ell(g, x + 0.03, knee, 0.075, 0.07, 0, '#DCC69A');
      poly(g, [[x - 0.09, 0], [x + 0.08, 0], [x + 0.06, 0.09], [x - 0.08, 0.09]], '#2E2018');
    };
    nearLeg(-0.88, 2.2, 1.1); nearLeg(0.72, 2.1, 1.0);
    // the tail, swishing
    stroke(g, [[-1.2, 2.62], [-1.28 + tail * 0.5, 2.0], [-1.3 + tail, 1.45]], 0.035, '#C9A877');
    ell(g, -1.3 + tail, 1.35, 0.045, 0.12, 0, '#2A1A10');
    // the head
    const hx = 1.95, hy = 4.98;
    blob(g, [[hx - 0.25, hy + 0.08], [hx - 0.02, hy + 0.14], [hx + 0.25, hy + 0.04], [hx + 0.52, hy - 0.16], [hx + 0.54, hy - 0.28 + chew], [hx + 0.36, hy - 0.3 + chew], [hx + 0.05, hy - 0.2], [hx - 0.2, hy - 0.15]], hgrad(g, hx - 0.25, hx + 0.55, [[0, '#E2C18A'], [1, '#C9A06A']]));
    blob(g, [[hx + 0.38, hy - 0.12], [hx + 0.54, hy - 0.18], [hx + 0.53, hy - 0.29 + chew], [hx + 0.38, hy - 0.27]], '#9C7A55');   // the muzzle
    poly(g, [[hx - 0.05, hy + 0.08], [hx + 0.12, hy + 0.06], [hx + 0.08, hy - 0.08], [hx - 0.08, hy - 0.06]], 'rgba(163,85,42,.75)');
    // horns (ossicones) and ears
    [[hx - 0.1, 0.0, '#B78A55'], [hx - 0.02, 0.02, '#C9A06A']].forEach(([x, d, c]) => { band(g, [[x, hy + 0.1], [x + 0.01, hy + 0.38 + d]], 0.07, 0.055, c); disc(g, x + 0.01, hy + 0.42 + d, 0.045, '#2A1A10'); });
    blob(g, [[hx - 0.2, hy + 0.06], [hx - 0.42, hy + 0.12], [hx - 0.46, hy + 0.08], [hx - 0.22, hy - 0.0]], '#D9B47E');
    eye(g, hx + 0.12, hy - 0.02, 0.04, '#1E140C', k);
    if (k > 40) { g.strokeStyle = '#1E140C'; g.lineWidth = Math.max(0.006, 0.6 / k); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(hx + 0.1 + i * 0.015, hy + 0.025); g.lineTo(hx + 0.09 + i * 0.022, hy + 0.06); g.stroke(); } }
  }
};

/* ---- reticulated python: over 6 m long, lying along the ground with its head raised ---- */
const PY = (() => {
  const pts = [], n = 64;
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = -3.1 + u * 6.0;
    const r = u < 0.15 ? 0.03 + u / 0.15 * 0.08 : u > 0.9 ? 0.11 - (u - 0.9) * 0.4 : 0.11 + 0.025 * Math.sin((u - 0.15) / 0.75 * Math.PI);
    let y = r + 0.05 * Math.max(0, Math.sin(u * Math.PI * 3.2 - 0.6));
    if (u > 0.84) y += Math.pow((u - 0.84) / 0.16, 2) * 0.28;
    pts.push([x, y, r]);
  }
  return pts;
})();
ART.python = {
  x0: -3.12, x1: 3.15, h: 0.45,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 40;
    shadow(g, -3.1, 3.0, 0.22);
    const L = [], R = [];
    for (let i = 0; i < PY.length; i++) {
      const a = PY[Math.max(0, i - 1)], b = PY[Math.min(PY.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, r = PY[i][2];
      L.push([PY[i][0] - dy / d * r, PY[i][1] + dx / d * r]); R.push([PY[i][0] + dy / d * r, PY[i][1] - dx / d * r]);
    }
    const outline = () => { g.beginPath(); spline(g, L, false); const rr = R.slice().reverse(); g.lineTo(rr[0][0], rr[0][1]); spline2(g, rr); g.closePath(); };
    outline(); g.fillStyle = vgrad(g, 0.45, 0, [[0, '#C9A04E'], [0.5, '#A7823C'], [1, '#6E5A30']]); g.fill();
    g.save(); outline(); g.clip();
    // the net pattern: black lines crossing, gold saddles, grey-brown blotches with white spots
    line(g, -3.1, 0, 3.0, 0, 0, 'rgba(0,0,0,0)');
    for (let i = 3; i < PY.length - 5; i += 3) {
      const [x, y, r] = PY[i];
      poly(g, [[x - 0.15, y + r * 0.1], [x, y + r * 1.05], [x + 0.15, y + r * 0.1], [x, y - r * 0.85]], 'rgba(22,15,6,.92)');   // a black net line round each saddle
      poly(g, [[x - 0.11, y + r * 0.1], [x, y + r * 0.82], [x + 0.11, y + r * 0.1], [x, y - r * 0.62]], '#7A6040');
      if (k > 25) { disc(g, x + 0.15, y - r * 0.5, r * 0.16, '#EFE7CF'); disc(g, x - 0.15, y - r * 0.5, r * 0.12, '#E2D8BC'); }
    }
    g.fillStyle = 'rgba(30,20,8,.55)'; for (let i = 2; i < PY.length - 3; i++) { const [x, y, r] = PY[i]; g.fillRect(x - 0.05, y + r * 0.82, 0.1, r * 0.2); }
    g.fillStyle = vgrad(g, 0.5, 0, [[0, 'rgba(255,240,200,.18)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.25)']]); g.fillRect(-3.2, 0, 6.4, 0.6);
    g.restore();
    // the head, with its eye and heat pits
    const hx = 2.95, hy = 0.37;
    blob(g, [[hx - 0.16, hy + 0.06], [hx + 0.05, hy + 0.075], [hx + 0.2, hy + 0.03], [hx + 0.21, hy - 0.025], [hx + 0.02, hy - 0.06], [hx - 0.16, hy - 0.05]], hgrad(g, hx - 0.16, hx + 0.2, [[0, '#A7823C'], [1, '#B8934A']]));
    line(g, hx - 0.12, hy + 0.06, hx + 0.16, hy + 0.04, 0.012, 'rgba(40,30,16,.7)');
    eye(g, hx + 0.08, hy + 0.025, 0.017, '#C99A30', k);
    if (k > 60) { line(g, hx + 0.08, hy + 0.04, hx + 0.08, hy + 0.012, 0.004, '#120C06'); for (let i = 0; i < 4; i++) disc(g, hx + 0.02 + i * 0.04, hy - 0.035, 0.005, '#3A2A16'); }
    if ((t % 3.6) < 0.5) { const s = Math.sin((t % 3.6) / 0.5 * Math.PI); line(g, hx + 0.2, hy - 0.01, hx + 0.2 + 0.1 * s, hy - 0.02, 0.008, '#B0283C'); line(g, hx + 0.2 + 0.1 * s, hy - 0.02, hx + 0.24 * s + 0.2, hy, 0.006, '#B0283C'); line(g, hx + 0.2 + 0.1 * s, hy - 0.02, hx + 0.24 * s + 0.2, hy - 0.04, 0.006, '#B0283C'); }
  }
};

/* ---- saltwater crocodile: about 6 m long, lying low ---- */
ART.croc = {
  x0: -3.05, x1: 3.05, h: 0.62,
  draw(g, o) {
    const t = o.t || 0, k = o.k || 40, blink = (t % 5.5) < 0.15;
    shadow(g, -3.0, 3.0, 0.3);
    const top = [[3.0, 0.11], [2.9, 0.2], [2.5, 0.22], [2.28, 0.34], [2.08, 0.3], [1.8, 0.4], [1.2, 0.56], [0.3, 0.62], [-0.5, 0.56], [-1.5, 0.42], [-2.4, 0.24], [-3.02, 0.08]];
    const bottom = [[-3.02, 0.04], [-2.2, 0.03], [-1.2, 0.02], [0.0, 0.0], [1.2, 0.02], [1.9, 0.04], [2.5, 0.07], [2.95, 0.07]];
    const outline = () => { g.beginPath(); spline(g, top, false); g.lineTo(bottom[0][0], bottom[0][1]); spline2(g, bottom); g.closePath(); };
    // the far legs
    band(g, [[1.15, 0.3], [1.38, 0.16], [1.42, 0.02]], 0.12, 0.09, '#3E4A2C'); band(g, [[-0.7, 0.35], [-0.45, 0.2], [-0.52, 0.02]], 0.16, 0.1, '#3E4A2C');
    outline(); g.fillStyle = vgrad(g, 0.62, 0, [[0, '#55603C'], [0.45, '#6D7A48'], [0.75, '#8E8A5A'], [1, '#C8BC8A']]); g.fill();
    g.save(); outline(); g.clip();
    // dark bands on the tail and back, and the bony scutes along the top
    for (let x = -2.85; x < 0.4; x += 0.38) { g.fillStyle = 'rgba(30,38,20,.28)'; g.beginPath(); g.moveTo(x, 0.7); g.quadraticCurveTo(x + 0.1, 0.35, x + 0.02, 0.06); g.lineTo(x + 0.12, 0.06); g.quadraticCurveTo(x + 0.2, 0.35, x + 0.13, 0.7); g.fill(); }
    if (k > 18) { g.fillStyle = 'rgba(25,30,16,.5)'; for (let x = -2.8; x < 1.9; x += 0.13) { const yy = x > -0.4 ? 0.5 + 0.1 * Math.sin((x + 0.4) / 2.2 * Math.PI) : 0.42 + (x + 0.4) * 0.12; g.beginPath(); g.ellipse(x, yy, 0.05, 0.022, 0, 0, TAU); g.fill(); } }
    g.restore();
    // the crests along the tail
    for (let x = -2.9; x < -0.3; x += 0.16) { const y = 0.08 + (x + 3.0) / 2.7 * 0.34, s = 0.04 + (x + 3.0) / 2.7 * 0.03; poly(g, [[x - s, y - 0.01], [x, y + s], [x + s, y - 0.01]], '#45502F'); }
    if (k > 18) for (let x = -0.3; x < 1.7; x += 0.14) { const y = 0.56 + 0.06 * Math.sin((x + 0.3) / 2 * Math.PI); disc(g, x, y, 0.025, '#4A5532'); }
    // the near legs, bent
    const foot = (x, col) => { blob(g, [[x - 0.12, 0.0], [x + 0.14, 0.0], [x + 0.17, 0.02], [x + 0.08, 0.05], [x - 0.1, 0.05]], col); if (k > 40) for (let i = 0; i < 3; i++) line(g, x + 0.1 + i * 0.025, 0.012, x + 0.16 + i * 0.022, 0.0, 0.008, '#2A2E1C'); };
    band(g, [[1.38, 0.3], [1.26, 0.15], [1.36, 0.04]], (u) => 0.15 - u * 0.06, 0, '#4E5A36'); foot(1.4, '#46512F');
    band(g, [[-0.36, 0.38], [-0.08, 0.2], [-0.18, 0.04]], (u) => 0.22 - u * 0.11, 0, '#4E5A36'); foot(-0.16, '#46512F');
    // the jaw line with teeth, the eye and the nostrils
    line(g, 2.08, 0.13, 2.95, 0.115, Math.max(0.012, 0.6 / k), '#2E3420');
    if (k > 30) { g.fillStyle = '#F2EEDC'; for (let x = 2.15; x < 2.92; x += 0.07) { g.beginPath(); g.moveTo(x, 0.125); g.lineTo(x + 0.02, 0.09); g.lineTo(x + 0.04, 0.124); g.closePath(); g.fill(); } }
    ell(g, 2.3, 0.33, 0.05, 0.035, 0, '#5A6640');
    if (blink) line(g, 2.28, 0.335, 2.34, 0.335, 0.01, '#2E3420'); else { disc(g, 2.31, 0.335, 0.022, '#C9C24A'); if (k > 50) line(g, 2.31, 0.352, 2.31, 0.318, 0.006, '#1A1A10'); }
    ell(g, 2.92, 0.2, 0.025, 0.012, 0, '#2E3420');
  }
};

/* ---- the blue whale: up to about 30 m long ---- */
const WHALE_TOP = [[15.0, 1.85], [14.2, 2.55], [12.5, 3.15], [10.0, 3.75], [6.0, 4.25], [2.0, 4.45], [-2.0, 4.3], [-6.0, 3.85], [-9.0, 3.2], [-11.5, 2.65], [-13.3, 2.38]];
const WHALE_BOT = [[-13.3, 2.0], [-11.5, 1.82], [-8.5, 1.3], [-4.0, 0.7], [0.0, 0.38], [4.0, 0.28], [8.0, 0.36], [11.0, 0.62], [13.4, 1.05], [14.7, 1.5]];
let whaleSpots = null;
ART.whale = {
  x0: -15.3, x1: 15.15, h: 4.5, water: { x0: -16.4, x1: 16.4, top: 4.75 },
  draw(g, o) {
    const t = o.t || 0, k = o.k || 10, bob = Math.sin(t * 0.6) * 0.08;
    g.save(); g.translate(0, bob);
    const outline = () => { g.beginPath(); spline(g, WHALE_TOP, false); g.lineTo(WHALE_BOT[0][0], WHALE_BOT[0][1]); spline2(g, WHALE_BOT); g.closePath(); };
    // the flukes, seen a little from above: the far lobe darker
    blob(g, [[-13.1, 2.3], [-14.1, 2.75], [-15.2, 3.55], [-15.0, 2.9], [-14.3, 2.25]], '#33496A');
    blob(g, [[-13.1, 2.1], [-14.2, 1.7], [-15.3, 0.95], [-15.0, 1.6], [-14.4, 2.12]], '#4A6488');
    outline(); g.fillStyle = vgrad(g, 4.5, 0.3, [[0, '#3C5578'], [0.45, '#57749A'], [0.8, '#7F9AB8'], [1, '#B9C3BF']]); g.fill();
    g.save(); outline(); g.clip();
    if (!whaleSpots) { const R = seeded(3030); whaleSpots = Array.from({ length: 340 }, () => [-13 + R() * 27, 0.7 + R() * 3.7, 0.04 + R() * 0.09, (R() - 0.5) * 0.5]); }
    if (k > 6) whaleSpots.forEach(([x, y, r, a]) => ell(g, x, y, r * 2.2, r, a, 'rgba(200,218,236,.2)'));
    // the throat grooves, from the chin to the belly
    if (k > 5) { g.strokeStyle = 'rgba(210,225,235,.35)'; g.lineWidth = Math.max(0.03, 0.7 / k); for (let i = 0; i < 9; i++) { const y = 0.45 + i * 0.13; g.beginPath(); g.moveTo(13.6 - i * 0.12, y + 0.55 + i * 0.03); g.bezierCurveTo(9.5, y + 0.1, 5.0, y - 0.05, 1.0, y + 0.02); g.stroke(); } }
    g.fillStyle = 'rgba(205,200,150,.18)'; g.fillRect(-4, 0.2, 18, 0.7);                       // the yellowish belly ("sulphur bottom")
    g.fillStyle = vgrad(g, 4.5, 3.4, [[0, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-14, 3.4, 30, 1.2);
    g.restore();
    // the small dorsal fin, the splash guard and blowholes, the mouth and the eye
    blob(g, [[-6.0, 3.82], [-6.9, 4.18], [-7.3, 4.12], [-7.2, 3.62]], '#3A5274');
    blob(g, [[9.0, 3.83], [9.6, 4.02], [10.1, 3.82]], '#4A6488');
    g.beginPath(); g.moveTo(14.95, 1.82); g.bezierCurveTo(13.8, 1.45, 12.6, 1.35, 11.1, 1.42); g.lineWidth = Math.max(0.05, 0.9 / k); g.strokeStyle = '#2A3A52'; g.stroke();
    eye(g, 11.25, 1.66, 0.12, '#151E2C', k);
    // the long flipper
    blob(g, [[8.6, 1.55], [8.2, 1.2], [6.7, 0.7], [5.0, 0.32], [4.8, 0.45], [6.2, 0.92], [7.8, 1.5]], hgrad(g, 4.8, 8.6, [[0, '#7A93B2'], [1, '#4E6A8E']]));
    // a blow from the blowholes now and then (the spray can be 9 m tall)
    const b = (t % 9) / 2.4;
    if (b < 1) {
      const a = Math.sin(b * Math.PI) * 0.7;
      g.globalAlpha = a;
      const top = 4.1 + Math.min(1, b * 3) * 7.5;
      for (let i = 0; i < 14; i++) { const u = i / 13, y = 4.0 + (top - 4.0) * u, x = 9.55 + Math.sin(i * 2.1 + t) * 0.12 * u, rx = 0.18 + u * u * (0.9 + b), ry = 0.5 + u * 0.6; ell(g, x, y, rx, ry, 0, 'rgba(236,246,255,' + (0.18 + u * 0.18).toFixed(2) + ')'); }
      g.globalAlpha = 1;
    }
    g.restore();
  }
};
/* the water the whale swims in (drawn behind it), and its sandy floor */
export function drawWater(g, o, k, t) {
  const w = ART.whale.water, top = w.top;
  g.fillStyle = vgrad(g, top, 0, [[0, 'rgba(80,170,215,.55)'], [1, 'rgba(25,95,150,.62)']]);
  g.beginPath(); g.moveTo(w.x0, 0);
  for (let x = w.x0; x <= w.x1 + 0.01; x += 0.5) g.lineTo(x, top + Math.sin(x * 0.9 + t * 1.6) * 0.07);
  g.lineTo(w.x1, 0); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); for (let x = w.x0; x <= w.x1 + 0.01; x += 0.5) { const y = top + Math.sin(x * 0.9 + t * 1.6) * 0.07; if (x === w.x0) g.moveTo(x, y); else g.lineTo(x, y); } g.lineWidth = Math.max(0.03, 1.2 / k); g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
  if (k > 3) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = -13 + i * 6.5 + Math.sin(t * 0.3 + i) * 0.8; g.fillStyle = 'rgba(160,220,255,.06)'; poly(g, [[x - 0.6, top], [x + 0.6, top], [x - 1.8, 0.3], [x - 3.2, 0.3]]); } g.globalCompositeOperation = 'source-over'; }
  rect(g, w.x0, 0, w.x1 - w.x0, 0.22, '#D8C79A');
}

/* ---- a London double-decker bus: about 11 m long and 4.4 m tall ---- */
ART.bus = {
  x0: -5.6, x1: 5.6, h: 4.4,
  draw(g, o) {
    const k = o.k || 20;
    shadow(g, -5.8, 5.8, 0.35);
    // the body
    const body = () => { g.beginPath(); if (g.roundRect) g.roundRect(-5.6, 0.32, 11.2, 4.08, [0.25, 0.3, 0.8, 0.5]); else g.rect(-5.6, 0.32, 11.2, 4.08); };
    body(); g.fillStyle = vgrad(g, 4.4, 0.3, [[0, '#E8323F'], [0.5, '#D21F2E'], [1, '#A81624']]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-5.5, 4.15, 11.0, 0.08);
    rect(g, -5.6, 0.32, 11.2, 0.42, '#2A2A2E');                                        // the skirt
    // two decks of windows, with a few passengers
    const win = (x, y, w, h) => { g.fillStyle = vgrad(g, y + h, y, [[0, '#1E2A38'], [1, '#2F4258']]); g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.35, y + h); g.lineTo(x, y + h * 0.4); g.fill(); };
    for (let i = 0; i < 6; i++) win(-5.2 + i * 1.62, 2.65, 1.45, 1.2);
    for (let i = 0; i < 4; i++) win(-5.2 + i * 1.62, 1.15, 1.45, 1.1);
    win(4.0, 1.15, 1.35, 1.25); win(4.05, 2.65, 1.35, 1.2);
    if (k > 12) { const heads = [[-4.6, 2.75], [-1.3, 2.75], [2.1, 2.75], [-3.0, 1.25]]; heads.forEach(([x, y]) => { disc(g, x, y + 0.42, 0.17, 'rgba(10,14,20,.6)'); rect(g, x - 0.25, y, 0.5, 0.3, 'rgba(10,14,20,.6)'); }); }
    // the doors, the destination sign and the lights
    rect(g, 1.55, 0.75, 0.95, 2.0, '#26313E'); line(g, 2.02, 0.8, 2.02, 2.7, 0.04, '#9AA5B1');
    rect(g, 4.15, 3.95, 1.2, 0.3, '#16161A'); if (k > 10) rect(g, 4.25, 4.03, 0.8, 0.13, '#F5B528');
    rect(g, 5.42, 0.95, 0.16, 0.22, '#FFF4C8'); rect(g, -5.58, 0.95, 0.12, 0.22, '#B01020');
    // the wheels
    [-3.25, 3.0].forEach((x) => { disc(g, x, 0.52, 0.52, '#18181B'); disc(g, x, 0.52, 0.3, '#5A5E66'); disc(g, x, 0.52, 0.12, '#C9CDD3'); if (k > 15) for (let i = 0; i < 6; i++) { const a = i * TAU / 6; disc(g, x + Math.cos(a) * 0.2, 0.52 + Math.sin(a) * 0.2, 0.03, '#2A2C30'); } });
  }
};
/* the road under the bus (drawn in the ground, below 0) */
export function drawRoad(g, k) {
  rect(g, -7.5, -0.9, 15, 0.9, '#3C3E44');
  g.fillStyle = 'rgba(255,255,255,.85)'; for (let x = -7; x < 7.5; x += 3) g.fillRect(x, -0.5, 1.6, 0.12);
  rect(g, -7.5, -0.06, 15, 0.06, '#9A9CA2');
}

/* ================= the wonders ================= */
/* The Great Pyramid as it is today: 230 m along each side, about 139 m tall (its top is missing) */
ART.giza = {
  x0: -115, x1: 115, h: 139,
  draw(g, o) {
    const k = o.k || 1, b = 230, h = 139, top = 3.5, near = 23;
    shadow(g, -120, 120, 0.22);
    poly(g, [[-b / 2, 0], [-top, h], [0.7, h], [near, 0]], '#B48A52');
    poly(g, [[near, 0], [0.7, h], [top, h], [b / 2, 0]], vgrad(g, h, 0, [[0, '#ECCF96'], [1, '#D9B47A']]));
    if (k > 0.6) {
      g.strokeStyle = 'rgba(90,60,20,.16)'; g.lineWidth = Math.max(0.25, 0.6 / k);
      for (let y = 4; y < h; y += k > 3 ? 1.5 : 4) { const hw = b / 2 * (1 - y / 146.6); g.beginPath(); g.moveTo(-hw, y); g.lineTo(hw, y); g.stroke(); }
    }
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = Math.max(0.4, 1 / k); g.beginPath(); g.moveTo(0.7, h); g.lineTo(near, 0); g.stroke();
    poly(g, [[-3, h], [3, h], [2.2, h + 1.4], [-2.2, h + 1.4]], '#C9A56A');
    if (k > 1.5) { rect(g, 4, 17, 3, 3.5, '#5A4026'); }                                    // the entrance
  }
};
/* A stretch of the Great Wall, about 8 m tall with its battlements */
ART.wall = {
  x0: -16, x1: 16, h: 8,
  draw(g, o) {
    const k = o.k || 5;
    shadow(g, -16.5, 16.5, 0.22);
    poly(g, [[-16, 0], [16, 0], [15.6, 6.6], [-15.6, 6.6]], hgrad(g, -16, 16, [[0, '#9D978A'], [0.5, '#B9B3A5'], [1, '#948E82']]));
    rect(g, -15.8, 6.6, 31.6, 0.3, '#8A8478');
    for (let x = -15.6; x < 15.6; x += 1.9) rect(g, x, 6.9, 1.15, 1.1, '#ACA698');
    if (k > 2) {
      g.strokeStyle = 'rgba(60,55,45,.25)'; g.lineWidth = Math.max(0.04, 0.6 / k);
      for (let y = 0.5; y < 6.6; y += 0.5) { g.beginPath(); g.moveTo(-15.9, y); g.lineTo(15.9, y); g.stroke(); }
      for (let y = 0, r = 0; y < 6.6; y += 0.5, r++) for (let x = -15.5 + (r % 2) * 0.6; x < 15.6; x += 1.2) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 0.5); g.stroke(); }
    }
    poly(g, [[-2.2, 0], [2.2, 0], [2.2, 3.2], [0, 4.4], [-2.2, 3.2]], '#3E3A33');           // a gateway through the wall
  }
};
/* Big Ben's tower (the Elizabeth Tower): 96 m tall */
ART.bigben = {
  x0: -7, x1: 7, h: 96,
  draw(g, o) {
    const k = o.k || 2, st = '#CDB37E', sd = '#A88E5C', lt = '#E1CB98', gold = '#D4A93A';
    shadow(g, -8, 8, 0.25);
    poly(g, [[-6, 0], [6, 0], [6, 55], [-6, 55]], hgrad(g, -6, 6, [[0, sd], [0.45, lt], [1, st]]));
    if (k > 1) { g.strokeStyle = 'rgba(110,85,40,.35)'; g.lineWidth = Math.max(0.12, 0.6 / k); for (let x = -4.5; x <= 4.5; x += 1.5) { g.beginPath(); g.moveTo(x, 2); g.lineTo(x, 53); g.stroke(); } for (let y = 6; y < 55; y += 6) { g.beginPath(); g.moveTo(-6, y); g.lineTo(6, y); g.stroke(); } }
    poly(g, [[-6.8, 55], [6.8, 55], [6.8, 68], [-6.8, 68]], hgrad(g, -6.8, 6.8, [[0, sd], [0.45, lt], [1, st]]));
    disc(g, 0, 61.5, 4.0, gold); disc(g, 0, 61.5, 3.5, '#F4EEDC');
    if (k > 1.2) { g.strokeStyle = '#1C1C1C'; g.lineCap = 'round'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(0, 61.5); g.lineTo(0, 64.4); g.stroke(); g.lineWidth = 0.45; g.beginPath(); g.moveTo(0, 61.5); g.lineTo(1.9, 60.6); g.stroke(); }
    poly(g, [[-6.2, 68], [6.2, 68], [6.2, 76], [-6.2, 76]], st);                             // the belfry
    if (k > 1) for (let x = -4.6; x <= 4.6; x += 2.3) { g.fillStyle = '#5A4A30'; g.beginPath(); g.moveTo(x - 0.7, 69); g.lineTo(x - 0.7, 74); g.lineTo(x, 75); g.lineTo(x + 0.7, 74); g.lineTo(x + 0.7, 69); g.fill(); }
    poly(g, [[-6.4, 76], [6.4, 76], [3.2, 88], [-3.2, 88]], '#4C5868');                       // the roof and spire
    poly(g, [[-0.9, 87], [0.9, 87], [0.25, 95], [-0.25, 95]], '#3E4856');
    disc(g, 0, 95.4, 0.5, gold); line(g, 0, 95.4, 0, 96, 0.25, gold);
    [-6.2, 6.2].forEach((x) => poly(g, [[x - 0.6, 68], [x + 0.6, 68], [x, 73.5]], gold));
    [-6.6, 6.6].forEach((x) => poly(g, [[x - 0.5, 76], [x + 0.5, 76], [x, 81]], sd));
  }
};

/* The wonders drawn in their own scenes: clipped to the monument, standing on the ground, scaled to its real height.
   [left, right, bottom, top] of the clip, in the scene's metres; lift: how far up the monument's own foot is. */
const REUSE = {
  zeus: { clip: [-6.25, 6.25, 0, 15] }, mausoleum: { clip: [-22, 26, 0, 60] }, colossus: { clip: [-8, 8.5, 15.2, 60], lift: 15.2, top: 48.2 },
  pharos: { clip: [-37, 38, 0, 115], R: 7 }, petra: { clip: [-14, 14, 0, 45] }, christ: { clip: [-15.5, 15.5, 0, 40] }, chichen: { clip: [-60, 60, -1, 40] },
  colosseum: { clip: [-97, 7, 0, 50] }, taj: { clip: [-50, 50, 0, 70] }
};
const measured = {};
/* How big each reused drawing really is (worked out once, from the pixels it covers). */
function measure(id) {
  if (measured[id]) return measured[id];
  const f = WONDER_SCENES[id], c = REUSE[id], s = 4, [l, r, b, tp] = c.clip;
  const cw = Math.ceil((r - l) * s), ch = Math.ceil((tp - b) * s), cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.translate(-l * s, tp * s); g.scale(s, -s);
  g.beginPath(); g.rect(l, b, r - l, tp - b); g.clip();
  try { f.mon(g, { k: s, px: (x) => x, py: (y) => y }, 'day', seeded(c.R || 11)); } catch (e) { /* drawn as far as it goes */ }
  const d = g.getImageData(0, 0, cw, ch).data;
  let x0 = cw, x1 = 0, y0 = ch, y1 = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = { left: l + x0 / s, right: l + (x1 + 1) / s, top: c.top || tp - y0 / s, bottom: c.lift || 0 };
  measured[id] = m;
  return m;
}
/* an ART entry for a wonder drawn in its scene, scaled so it is h metres tall */
export function wonderArt(id, h) {
  const c = REUSE[id], f = WONDER_SCENES[id];
  if (!c || !f || !f.mon) return null;
  const a = {
    h, get x0() { const m = measure(id); return (m.left - (m.left + m.right) / 2) * a.s; }, get x1() { const m = measure(id); return (m.right - (m.left + m.right) / 2) * a.s; },
    get s() { const m = measure(id); return h / Math.max(1, m.top - m.bottom); },
    draw(g, o) {
      const m = measure(id), s = a.s, mid = (m.left + m.right) / 2, [l, r, b, tp] = c.clip;
      shadow(g, (m.left - mid) * s * 1.05, (m.right - mid) * s * 1.05, 0.22);
      g.save(); g.scale(s, s); g.translate(-mid, -(c.lift || 0));
      g.beginPath(); g.rect(l, b, r - l, tp - b); g.clip();
      g.lineJoin = 'round';
      try { f.mon(g, { k: (o.k || 1) * s, px: (x) => x, py: (y) => y }, 'day', seeded(c.R || 11)); } catch (e) { /* ignore */ }
      g.restore();
    }
  };
  return a;
}
