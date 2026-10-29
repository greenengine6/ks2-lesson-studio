/* Wonder Window's animals, drawn (no emoji): every creature in the biomes, the speed race, "How big?", the bats of
   Mulu, the Chinese New Year dragon and the World Explorer's plane. Each one is a flat, friendly picture built from
   a few shapes, facing right, drawn at any size, and it moves: legs swing as it walks, wings flap, tails wag, fins
   paddle. drawCreature(ctx, key, x, y, size, o) draws one with its middle at x, y and about `size` tall. o: { flip
   (face left), rot, ph (its stride, in radians), t (time), rest (standing still), tint ('white' or 'sand' for the
   arctic and fennec foxes), sy (a butterfly's wings closing), glide (a flying frog mid-air), run (racing) }. */
import { TAU } from './util.js?v=de4f9a51';

/* ---------------- shapes ---------------- */
const E = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); c.fill(); };
const D = (c, x, y, r) => { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fill(); };
const P = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
const L = (c, x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
const Q = (c, x0, y0, cx, cy, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); };
const eye = (c, x, y, r, col) => { c.fillStyle = col || '#fff'; D(c, x, y, r); c.fillStyle = '#17171C'; D(c, x + r * 0.25, y, r * 0.55); c.fillStyle = 'rgba(255,255,255,.8)'; D(c, x + r * 0.05, y - r * 0.3, r * 0.2); };
const dot = (c, x, y, r) => { c.fillStyle = '#17171C'; D(c, x, y, r); };
/* four legs that swing as the animal walks: hips at xb, shoulders at xf, both at height yh, legs len long and w thick */
function legs4(c, ph, rest, col, dark, xb, xf, yh, len, w, o) {
  const k = rest ? 0 : (o && o.run ? 0.9 : 0.5);
  [[xb, Math.PI, dark], [xf, 0, dark], [xb, 0, col], [xf, Math.PI, col]].forEach(([x, off, cc]) => {
    const a = Math.sin(ph + off) * k, kx = x + Math.sin(a) * len, ky = yh + Math.cos(a) * len;
    L(c, x, yh, kx, ky, w, cc);
    if (o && o.hoof) { c.fillStyle = o.hoof; E(c, kx, ky + w * 0.1, w * 0.62, w * 0.36); }
  });
}
/* two legs (birds, people) */
function legs2(c, ph, rest, col, x, yh, len, w, k) {
  const s = rest ? 0 : (k || 0.6);
  [[Math.PI, 0], [0, 1]].forEach(([off]) => { const a = Math.sin(ph + off) * s; L(c, x, yh, x + Math.sin(a) * len, yh + Math.cos(a) * len, w, col); });
}
/* a pair of wings seen from the side, flapping about the shoulder */
function wings(c, ph, x, y, span, chord, col, back) {
  const a = Math.sin(ph) * 0.9 + (back ? 0.25 : 0);                                                    // the flap, about the shoulder
  c.fillStyle = col;
  c.save(); c.translate(x, y); c.rotate(-a);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-span * 0.3, -chord * 0.45, -span, -chord * 0.1); c.quadraticCurveTo(-span * 0.9, chord * 0.25, -span * 0.55, chord * 0.3); c.quadraticCurveTo(-span * 0.2, chord * 0.4, chord * 0.2, chord * 0.2); c.closePath(); c.fill();
  c.restore();
}
const spots = (c, pts, r, col) => { c.fillStyle = col; pts.forEach(([x, y]) => D(c, x, y, r)); };
const tail = (c, x, y, len, w, col, wag, up) => Q(c, x, y, x - len * 0.6, y + (up ? -len * 0.6 : len * 0.25) + wag * 0.3, x - len, y + (up ? -len * 0.3 : len * 0.1) + wag, w, col);

/* ---------------- the creatures (facing right, middle at 0,0, about `s` tall) ---------------- */
const K = {
  elephant(c, s, o) {
    const col = '#8F9099', dk = '#6E6F78', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.28, h * 0.22, h * 0.14, h * 0.36, h * 0.17, { hoof: '#B7B8BE' });
    c.fillStyle = col; E(c, -h * 0.04, -h * 0.04, h * 0.52, h * 0.3);                                  // body
    tail(c, -h * 0.52, -h * 0.08, h * 0.26, h * 0.035, dk, Math.sin(o.t * 3) * h * 0.04);
    E(c, h * 0.44, -h * 0.2, h * 0.24, h * 0.21);                                                        // head
    c.fillStyle = dk; E(c, h * 0.3, -h * 0.2, h * 0.17, h * 0.2, -0.3 + Math.sin(o.t * 2.2) * 0.08);      // the ear
    Q(c, h * 0.62, -h * 0.1, h * 0.76, h * 0.12 + Math.sin(o.t * 2) * h * 0.03, h * 0.6 + Math.sin(o.t * 2) * h * 0.05, h * 0.3, h * 0.085, col);   // the trunk
    L(c, h * 0.58, -h * 0.03, h * 0.7, h * 0.08, h * 0.035, '#F2EEE4');                                   // a tusk
    eye(c, h * 0.52, -h * 0.26, h * 0.035);
  },
  giraffe(c, s, o) {
    const col = '#E7B54E', dk = '#B98B33', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.14, h * 0.1, h * 0.14, h * 0.36, h * 0.07, { hoof: '#5A4630' });
    c.fillStyle = col; E(c, -h * 0.02, 0, h * 0.26, h * 0.16, -0.1);                                    // body
    spots(c, [[-h * 0.14, -0.03 * h], [h * 0.04, -0.08 * h], [-h * 0.02, h * 0.07], [h * 0.14, h * 0.03], [h * 0.2, -0.22 * h], [h * 0.26, -0.36 * h]], h * 0.045, dk);
    L(c, h * 0.16, -h * 0.08, h * 0.3, -h * 0.42, h * 0.1, col);                                          // the neck
    L(c, h * 0.14, -h * 0.1, h * 0.28, -h * 0.4, h * 0.03, dk);                                           // the mane
    c.fillStyle = col; E(c, h * 0.34, -h * 0.45, h * 0.1, h * 0.065, 0.2);                                // head
    L(c, h * 0.3, -h * 0.5, h * 0.28, -h * 0.58, h * 0.025, dk); L(c, h * 0.36, -h * 0.5, h * 0.36, -h * 0.58, h * 0.025, dk);   // ossicones
    c.fillStyle = dk; D(c, h * 0.28, -h * 0.58, h * 0.018); D(c, h * 0.36, -h * 0.58, h * 0.018);
    c.fillStyle = col; E(c, h * 0.24, -h * 0.5, h * 0.04, h * 0.02, -0.5);                               // ear
    eye(c, h * 0.35, -h * 0.47, h * 0.018); dot(c, h * 0.43, -h * 0.43, h * 0.012);
    tail(c, -h * 0.27, -h * 0.02, h * 0.2, h * 0.025, dk, Math.sin(o.t * 3) * h * 0.03);
  },
  zebra(c, s, o) {
    const col = '#F4F1EA', dk = '#D9D4C8', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.24, h * 0.2, h * 0.1, h * 0.38, h * 0.09, { hoof: '#2A2A2A' });
    c.fillStyle = col; E(c, -h * 0.02, -h * 0.06, h * 0.42, h * 0.22);                                   // body
    c.strokeStyle = '#1E1E22'; c.lineWidth = h * 0.035; c.lineCap = 'round';
    for (let i = -4; i <= 4; i++) { const x = i * h * 0.085; c.beginPath(); c.moveTo(x, -h * 0.27 + Math.abs(i) * h * 0.01); c.quadraticCurveTo(x + h * 0.04, -h * 0.06, x - h * 0.02, h * 0.12 - Math.abs(i) * h * 0.02); c.stroke(); }   // stripes
    L(c, h * 0.32, -h * 0.14, h * 0.5, -h * 0.34, h * 0.14, col);                                          // neck
    c.fillStyle = '#1E1E22'; P(c, [[h * 0.28, -h * 0.26], [h * 0.5, -h * 0.44], [h * 0.46, -h * 0.3]]);     // mane
    c.fillStyle = col; E(c, h * 0.56, -h * 0.36, h * 0.13, h * 0.09, 0.4);                                 // head
    c.fillStyle = '#1E1E22'; E(c, h * 0.64, -h * 0.3, h * 0.05, h * 0.035, 0.4);                           // muzzle
    c.strokeStyle = '#1E1E22'; c.lineWidth = h * 0.02; [[0.5, -0.44, 0.53, -0.3], [0.56, -0.44, 0.58, -0.32]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a * h, b * h); c.lineTo(d * h, e * h); c.stroke(); });
    c.fillStyle = col; E(c, h * 0.5, -h * 0.47, h * 0.035, h * 0.06, 0.3);                                 // ear
    eye(c, h * 0.57, -h * 0.38, h * 0.022);
    tail(c, -h * 0.42, -h * 0.1, h * 0.22, h * 0.03, '#1E1E22', Math.sin(o.t * 3) * h * 0.04);
  },
  lion(c, s, o) {
    const col = '#D9A24D', dk = '#B07E33', mane = '#9C5A22', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.22, h * 0.14, h * 0.12, h * 0.32, h * 0.1);
    c.fillStyle = col; E(c, -h * 0.04, -h * 0.02, h * 0.4, h * 0.2);                                    // body
    tail(c, -h * 0.42, -h * 0.04, h * 0.32, h * 0.035, dk, Math.sin(o.t * 2.5) * h * 0.05, true); c.fillStyle = mane; D(c, -h * 0.72, -h * 0.14 + Math.sin(o.t * 2.5) * h * 0.05, h * 0.045);
    c.fillStyle = mane; D(c, h * 0.34, -h * 0.2, h * 0.27);                                                // the mane
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; E(c, h * 0.34 + Math.cos(a) * h * 0.24, -h * 0.2 + Math.sin(a) * h * 0.24, h * 0.07, h * 0.05, a); }
    c.fillStyle = col; D(c, h * 0.38, -h * 0.2, h * 0.17);                                                 // face
    c.fillStyle = '#F2D9A8'; E(c, h * 0.46, -h * 0.12, h * 0.09, h * 0.07);                                // muzzle
    dot(c, h * 0.52, -h * 0.15, h * 0.028); c.fillStyle = col; E(c, h * 0.28, -h * 0.34, h * 0.04, h * 0.035); E(c, h * 0.46, -h * 0.35, h * 0.04, h * 0.035);
    eye(c, h * 0.33, -h * 0.23, h * 0.025); eye(c, h * 0.45, -h * 0.23, h * 0.025);
  },
  wildebeest(c, s, o) {
    const col = '#6E5E52', dk = '#4E423A', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.24, h * 0.16, h * 0.08, h * 0.4, h * 0.075, { hoof: '#2A2420' });
    c.fillStyle = col; E(c, -h * 0.04, -h * 0.08, h * 0.42, h * 0.2); E(c, h * 0.16, -h * 0.22, h * 0.2, h * 0.16);   // body and the hump at the shoulders
    c.fillStyle = dk; E(c, h * 0.42, -h * 0.14, h * 0.14, h * 0.11, 0.5);                                // head, hanging low
    c.fillStyle = '#3A302A'; E(c, h * 0.5, -h * 0.02, h * 0.06, h * 0.05); for (let i = 0; i < 5; i++) L(c, h * (0.36 + i * 0.03), -h * 0.06, h * (0.35 + i * 0.03), h * 0.06, h * 0.015, '#3A302A');   // the beard
    c.strokeStyle = '#D9CBB0'; c.lineWidth = h * 0.03; c.lineCap = 'round';
    [-1, 1].forEach((d) => { c.beginPath(); c.moveTo(h * 0.42, -h * 0.24); c.quadraticCurveTo(h * (0.42 + d * 0.16), -h * 0.36, h * (0.4 + d * 0.1), -h * 0.42); c.stroke(); });   // horns
    c.fillStyle = '#2A2420'; for (let i = 0; i < 6; i++) L(c, h * (-0.08 + i * 0.05), -h * 0.3, h * (-0.1 + i * 0.05), -h * 0.2, h * 0.02, '#2A2420');   // the mane
    eye(c, h * 0.46, -h * 0.17, h * 0.02);
    tail(c, -h * 0.44, -h * 0.1, h * 0.24, h * 0.03, '#2A2420', Math.sin(o.t * 3) * h * 0.04);
  },
  tiger(c, s, o) {
    const col = '#F0892A', dk = '#C66A16', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.26, h * 0.2, h * 0.12, h * 0.32, h * 0.11);
    c.fillStyle = col; E(c, -h * 0.02, -h * 0.02, h * 0.46, h * 0.21);                                   // body
    c.fillStyle = '#FBE9D2'; E(c, 0, h * 0.1, h * 0.3, h * 0.08);                                        // belly
    c.strokeStyle = '#1E1A18'; c.lineWidth = h * 0.035; c.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { const x = i * h * 0.1; c.beginPath(); c.moveTo(x, -h * 0.22); c.quadraticCurveTo(x - h * 0.03, -h * 0.1, x + h * 0.02, h * 0.02); c.stroke(); }   // stripes
    tail(c, -h * 0.46, -h * 0.06, h * 0.36, h * 0.05, col, Math.sin(o.t * 2.5) * h * 0.06, true);
    c.fillStyle = col; D(c, h * 0.42, -h * 0.2, h * 0.17);                                                 // head
    E(c, h * 0.3, -h * 0.34, h * 0.045, h * 0.045); E(c, h * 0.5, -h * 0.35, h * 0.045, h * 0.045);        // ears
    c.fillStyle = '#FBE9D2'; E(c, h * 0.5, -h * 0.12, h * 0.1, h * 0.075); D(c, h * 0.3, -h * 0.14, h * 0.05);   // muzzle and cheek
    dot(c, h * 0.57, -h * 0.15, h * 0.028);
    c.lineWidth = h * 0.025; [[0.36, -0.36, 0.38, -0.28], [0.44, -0.37, 0.44, -0.29], [0.3, -0.26, 0.26, -0.2]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a * h, b * h); c.lineTo(d * h, e * h); c.stroke(); });
    eye(c, h * 0.38, -h * 0.22, h * 0.03, '#F6E6A8'); eye(c, h * 0.49, -h * 0.23, h * 0.03, '#F6E6A8');
  },
  orangutan(c, s, o) {
    const col = '#C86A2C', dk = '#9A4E1C', h = s, sw = o.rest ? 0 : Math.sin(o.ph * 0.6) * 0.3;
    if (o.rest) {                                                                                   // sitting, long arms resting
      c.fillStyle = col; E(c, 0, h * 0.1, h * 0.34, h * 0.3); L(c, -h * 0.26, 0, -h * 0.4, h * 0.36, h * 0.12, col); L(c, h * 0.26, 0, h * 0.4, h * 0.36, h * 0.12, col);
      c.fillStyle = dk; E(c, -h * 0.4, h * 0.38, h * 0.08, h * 0.05); E(c, h * 0.4, h * 0.38, h * 0.08, h * 0.05);
      c.fillStyle = col; D(c, h * 0.06, -h * 0.26, h * 0.2);
    } else {                                                                                        // hanging from a branch
      L(c, -h * 0.5, -h * 0.5, h * 0.5, -h * 0.5, h * 0.05, '#5A3A22');
      L(c, -h * 0.2, -h * 0.48, -h * 0.3 + sw * h, 0, h * 0.11, col); L(c, h * 0.22, -h * 0.48, h * 0.26 + sw * h, h * 0.02, h * 0.11, dk);
      c.fillStyle = col; E(c, sw * h * 0.8, h * 0.12, h * 0.3, h * 0.28);
      L(c, -h * 0.1 + sw * h, h * 0.3, -h * 0.2 + sw * h, h * 0.5, h * 0.1, dk); L(c, h * 0.12 + sw * h, h * 0.3, h * 0.2 + sw * h, h * 0.5, h * 0.1, col);
      c.fillStyle = col; D(c, h * 0.06 + sw * h * 0.8, -h * 0.14, h * 0.2);
    }
    const fx = (o.rest ? h * 0.06 : h * 0.06 + sw * h * 0.8), fy = o.rest ? -h * 0.26 : -h * 0.14;
    c.fillStyle = '#E9C9A8'; E(c, fx + h * 0.03, fy + h * 0.02, h * 0.13, h * 0.12);                      // face
    c.fillStyle = col; E(c, fx - h * 0.1, fy, h * 0.07, h * 0.1); E(c, fx + h * 0.16, fy, h * 0.07, h * 0.1);   // cheek pads
    eye(c, fx - h * 0.01, fy - h * 0.02, h * 0.025); eye(c, fx + h * 0.08, fy - h * 0.02, h * 0.025);
    c.fillStyle = '#B07A5A'; E(c, fx + h * 0.04, fy + h * 0.07, h * 0.05, h * 0.03);
  },
  frog(c, s, o) {
    const col = '#4FB55A', dk = '#2E8A3A', web = '#F2A33A', h = s, g = o.glide;
    c.fillStyle = col;
    if (g) {                                                                                        // spread out, webbed feet wide
      [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].forEach(([u, v]) => { L(c, u * h * 0.3, v * h * 0.2, u * h, v * h * 0.9, h * 0.08, dk); c.fillStyle = web; E(c, u * h, v * h * 0.9, h * 0.16, h * 0.12, Math.atan2(v, u)); });
      c.fillStyle = col; E(c, 0, 0, h * 0.42, h * 0.26);
    } else {
      L(c, -h * 0.3, h * 0.2, -h * 0.46, h * 0.44, h * 0.09, dk); L(c, h * 0.3, h * 0.22, h * 0.4, h * 0.44, h * 0.09, dk);
      c.fillStyle = web; E(c, -h * 0.48, h * 0.46, h * 0.1, h * 0.05); E(c, h * 0.42, h * 0.46, h * 0.1, h * 0.05);
      c.fillStyle = col; E(c, 0, h * 0.08, h * 0.4, h * 0.3);
    }
    c.fillStyle = col; E(c, h * 0.2, -h * 0.14, h * 0.3, h * 0.2);                                       // head
    c.fillStyle = '#F7F1D6'; E(c, h * 0.2, h * 0.14, h * 0.26, h * 0.1);
    eye(c, h * 0.12, -h * 0.3, h * 0.08, '#F6E27A'); eye(c, h * 0.36, -h * 0.3, h * 0.08, '#F6E27A');
    L(c, h * 0.3, -h * 0.05, h * 0.5, -h * 0.04, h * 0.02, dk);
  },
  butterfly(c, s, o) {
    const h = s, sy = o.sy == null ? 1 : o.sy, blk = '#111318', grn = '#1FD37A';
    [-1, 1].forEach((d) => {
      c.save(); c.scale(1, 1); c.translate(0, 0);
      c.fillStyle = blk; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * h * 0.9 * sy, -h * 0.7, d * h * 0.95 * sy, -h * 0.1); c.quadraticCurveTo(d * h * 0.7 * sy, h * 0.1, d * h * 0.5 * sy, h * 0.45); c.quadraticCurveTo(d * h * 0.2 * sy, h * 0.4, 0, h * 0.1); c.closePath(); c.fill();
      c.fillStyle = grn; for (let i = 0; i < 6; i++) { const u = 0.25 + i * 0.12; P(c, [[d * h * u * sy, -h * (0.1 + i * 0.06)], [d * h * (u + 0.06) * sy, -h * (0.08 + i * 0.07)], [d * h * (u + 0.03) * sy, h * 0.02 - i * h * 0.02]]); }
      c.restore();
    });
    c.fillStyle = blk; E(c, 0, h * 0.05, h * 0.06, h * 0.3); D(c, 0, -h * 0.26, h * 0.06);
    L(c, -h * 0.02, -h * 0.3, -h * 0.14, -h * 0.5, h * 0.015, blk); L(c, h * 0.02, -h * 0.3, h * 0.14, -h * 0.5, h * 0.015, blk);
  },
  hornbill(c, s, o) {
    const h = s, blk = '#1C1C22';
    wings(c, o.ph, -h * 0.05, -h * 0.05, h * 0.75, h * 0.3, '#2A2A32', true);
    c.fillStyle = blk; E(c, 0, 0, h * 0.42, h * 0.17);                                                   // body
    c.fillStyle = '#F2EEE4'; P(c, [[-h * 0.4, -h * 0.02], [-h * 0.72, -h * 0.1], [-h * 0.74, h * 0.1], [-h * 0.4, h * 0.08]]); c.fillStyle = blk; P(c, [[-h * 0.56, -h * 0.05], [-h * 0.64, -h * 0.07], [-h * 0.66, h * 0.05], [-h * 0.56, h * 0.04]]);   // tail, white with a black band
    c.fillStyle = blk; D(c, h * 0.4, -h * 0.12, h * 0.16);                                                 // head
    c.fillStyle = '#F6B21B'; P(c, [[h * 0.48, -h * 0.1], [h * 0.98, -h * 0.02], [h * 0.5, h * 0.06]]);     // the bill
    c.fillStyle = '#E8471F'; P(c, [[h * 0.36, -h * 0.26], [h * 0.84, -h * 0.26], [h * 0.9, -h * 0.14], [h * 0.5, -h * 0.1]]);   // the casque
    c.fillStyle = '#F6B21B'; P(c, [[h * 0.4, -h * 0.3], [h * 0.8, -h * 0.3], [h * 0.84, -h * 0.26], [h * 0.36, -h * 0.26]]);
    eye(c, h * 0.42, -h * 0.14, h * 0.035, '#F6E6A8');
    wings(c, o.ph + 0.2, h * 0.02, -h * 0.02, h * 0.8, h * 0.32, blk);
  },
  pig(c, s, o) {
    const col = '#8E7A66', dk = '#6A584A', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.26, h * 0.22, h * 0.16, h * 0.28, h * 0.1, { hoof: '#3A2E26' });
    c.fillStyle = col; E(c, 0, 0, h * 0.5, h * 0.28);                                                     // body
    E(c, h * 0.42, -h * 0.02, h * 0.22, h * 0.2);                                                          // head
    c.fillStyle = '#C9B8A0'; for (let i = 0; i < 7; i++) L(c, h * (0.36 + i * 0.05), h * 0.08, h * (0.33 + i * 0.05), h * 0.26, h * 0.025, '#C9B8A0');   // the beard
    c.fillStyle = '#B7998A'; E(c, h * 0.64, h * 0.02, h * 0.07, h * 0.06); dot(c, h * 0.66, h * 0.0, h * 0.015); dot(c, h * 0.66, h * 0.04, h * 0.015);   // snout
    c.fillStyle = dk; E(c, h * 0.36, -h * 0.2, h * 0.06, h * 0.08, 0.5);                                    // ear
    eye(c, h * 0.5, -h * 0.08, h * 0.022);
    Q(c, -h * 0.48, -h * 0.06, -h * 0.6, -h * 0.2, -h * 0.56, -h * 0.26 + Math.sin(o.t * 4) * h * 0.03, h * 0.03, dk);   // the tail
  },
  fox(c, s, o) {
    const sand = o.tint === 'sand', white = o.tint === 'white';
    const col = white ? '#F4F4F2' : sand ? '#E9C98E' : '#E07A2E', dk = white ? '#D6D8DA' : sand ? '#C9A76A' : '#B85A1A', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.2, h * 0.16, h * 0.14, h * 0.3, h * 0.07, { hoof: white ? '#C9CBCF' : '#3A2E26' });
    c.fillStyle = col; E(c, 0, 0, h * 0.36, h * 0.19);                                                     // body
    c.fillStyle = col; E(c, -h * 0.5, h * 0.02 + Math.sin(o.t * 3) * h * 0.03, h * 0.26, h * 0.11, -0.3); c.fillStyle = white ? '#E6E8EA' : '#F7F1E6'; E(c, -h * 0.7, -h * 0.04 + Math.sin(o.t * 3) * h * 0.03, h * 0.08, h * 0.07);   // the bushy tail
    c.fillStyle = col; E(c, h * 0.4, -h * 0.14, h * 0.18, h * 0.14);                                       // head
    P(c, [[h * 0.48, -h * 0.1], [h * 0.68, -h * 0.02], [h * 0.48, h * 0.02]]);                              // the muzzle
    const ear = sand ? h * 0.26 : h * 0.14;                                                                  // a fennec's huge ears
    c.fillStyle = col; P(c, [[h * 0.3, -h * 0.22], [h * 0.3, -h * 0.22 - ear], [h * 0.42, -h * 0.24]]); P(c, [[h * 0.44, -h * 0.24], [h * 0.46, -h * 0.24 - ear], [h * 0.54, -h * 0.22]]);
    c.fillStyle = sand ? '#F2D9BC' : white ? '#E6E8EA' : '#F7D9C4'; P(c, [[h * 0.33, -h * 0.24], [h * 0.33, -h * 0.24 - ear * 0.7], [h * 0.4, -h * 0.25]]);
    dot(c, h * 0.68, -h * 0.03, h * 0.025); eye(c, h * 0.46, -h * 0.16, h * 0.025);
  },
  reindeer(c, s, o) {
    const col = '#8A6A4C', dk = '#5E4632', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.2, h * 0.16, h * 0.08, h * 0.4, h * 0.07, { hoof: '#2A2420' });
    c.fillStyle = col; E(c, -h * 0.02, -h * 0.06, h * 0.36, h * 0.19);                                   // body
    c.fillStyle = '#E8DCC8'; E(c, h * 0.2, -h * 0.02, h * 0.14, h * 0.14);                                 // the white chest
    L(c, h * 0.26, -h * 0.14, h * 0.38, -h * 0.32, h * 0.12, col);                                         // neck
    c.fillStyle = col; E(c, h * 0.46, -h * 0.34, h * 0.14, h * 0.09, 0.3);                                 // head
    dot(c, h * 0.58, -h * 0.3, h * 0.03); eye(c, h * 0.46, -h * 0.37, h * 0.022);
    c.strokeStyle = '#D9C8A8'; c.lineWidth = h * 0.028; c.lineCap = 'round';
    [-1, 1].forEach((d) => { const x = h * (0.42 + d * 0.04); c.beginPath(); c.moveTo(x, -h * 0.4); c.quadraticCurveTo(x - h * 0.1, -h * 0.58, x + d * h * 0.06, -h * 0.74); c.stroke(); c.beginPath(); c.moveTo(x - h * 0.05, -h * 0.5); c.lineTo(x - h * 0.16, -h * 0.58); c.stroke(); c.beginPath(); c.moveTo(x - h * 0.02, -h * 0.62); c.lineTo(x - h * 0.12, -h * 0.72); c.stroke(); });   // antlers
    c.fillStyle = col; E(c, h * 0.36, -h * 0.4, h * 0.04, h * 0.025, -0.4);
    tail(c, -h * 0.36, -h * 0.1, h * 0.1, h * 0.04, '#E8DCC8', 0, true);
  },
  owl(c, s, o) {
    const h = s, col = '#F6F6F4', dk = '#C9CCD0';
    wings(c, o.ph, -h * 0.02, -h * 0.02, h * 0.7, h * 0.32, dk, true);
    c.fillStyle = col; E(c, 0, h * 0.04, h * 0.3, h * 0.36);                                               // body
    c.fillStyle = dk; for (let i = 0; i < 9; i++) E(c, (i % 3 - 1) * h * 0.14, h * (0.02 + Math.floor(i / 3) * 0.13), h * 0.03, h * 0.02);   // speckles
    c.fillStyle = col; D(c, h * 0.04, -h * 0.26, h * 0.22);                                                 // head
    eye(c, -h * 0.04, -h * 0.28, h * 0.06, '#F6C83A'); eye(c, h * 0.13, -h * 0.28, h * 0.06, '#F6C83A');
    c.fillStyle = '#4A4A50'; P(c, [[h * 0.02, -h * 0.2], [h * 0.1, -h * 0.2], [h * 0.06, -h * 0.12]]);     // beak
    L(c, -h * 0.06, h * 0.38, -h * 0.08, h * 0.48, h * 0.03, '#4A4A50'); L(c, h * 0.08, h * 0.38, h * 0.1, h * 0.48, h * 0.03, '#4A4A50');
    wings(c, o.ph + 0.3, h * 0.04, 0, h * 0.74, h * 0.34, col);
  },
  hare(c, s, o) {
    const col = o.tint === 'white' ? '#F4F4F2' : '#B9A58A', dk = o.tint === 'white' ? '#D6D8DA' : '#8E7A62', h = s, hop = o.rest ? 0 : Math.max(0, Math.sin(o.ph));
    c.fillStyle = col; E(c, -h * 0.04, h * 0.1, h * 0.3, h * 0.24, -0.2 - hop * 0.3);                     // body
    L(c, -h * 0.2, h * 0.26, -h * 0.34 - hop * h * 0.1, h * 0.46, h * 0.09, dk); L(c, h * 0.16, h * 0.28, h * 0.24 + hop * h * 0.1, h * 0.46, h * 0.08, col);   // back and front legs
    c.fillStyle = col; D(c, h * 0.24, -h * 0.14, h * 0.15);                                                 // head
    E(c, h * 0.16, -h * 0.4, h * 0.05, h * 0.18, -0.15); E(c, h * 0.28, -h * 0.4, h * 0.05, h * 0.18, 0.15);   // ears
    c.fillStyle = '#F2C8C8'; E(c, h * 0.16, -h * 0.4, h * 0.02, h * 0.12, -0.15); E(c, h * 0.28, -h * 0.4, h * 0.02, h * 0.12, 0.15);
    dot(c, h * 0.38, -h * 0.12, h * 0.02); eye(c, h * 0.27, -h * 0.17, h * 0.025);
    c.fillStyle = '#FFFFFF'; D(c, -h * 0.34, h * 0.02, h * 0.06);                                            // the tail
  },
  camel(c, s, o) {
    const col = '#C7935A', dk = '#9E6E3A', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.24, h * 0.16, h * 0.08, h * 0.42, h * 0.075, { hoof: '#5A4630' });
    c.fillStyle = col; E(c, -0.02 * h, -h * 0.06, h * 0.42, h * 0.2);                                     // body
    E(c, -h * 0.1, -h * 0.26, h * 0.16, h * 0.14); E(c, h * 0.14, -h * 0.24, h * 0.14, h * 0.12);          // the humps
    Q(c, h * 0.34, -h * 0.12, h * 0.52, -h * 0.3, h * 0.54, -h * 0.5, h * 0.12, col);                       // neck
    c.fillStyle = col; E(c, h * 0.6, -h * 0.52, h * 0.12, h * 0.07, 0.15);                                  // head
    c.fillStyle = dk; E(c, h * 0.52, -h * 0.58, h * 0.03, h * 0.04); dot(c, h * 0.7, -h * 0.5, h * 0.02); eye(c, h * 0.58, -h * 0.55, h * 0.02);
    tail(c, -h * 0.42, -h * 0.08, h * 0.18, h * 0.03, dk, Math.sin(o.t * 3) * h * 0.03);
  },
  scorpion(c, s, o) {
    const col = '#B98A2E', dk = '#8A6420', h = s, w = o.rest ? 0 : Math.sin(o.ph * 2) * 0.2;
    c.strokeStyle = dk; c.lineWidth = h * 0.05; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const x = -h * 0.2 + i * h * 0.14, sw2 = Math.sin(o.ph + i) * (o.rest ? 0 : 0.3); [-1, 1].forEach((d) => { c.beginPath(); c.moveTo(x, h * 0.1); c.lineTo(x + sw2 * h * 0.1 + d * h * 0.02, h * 0.3); c.lineTo(x + sw2 * h * 0.14 + d * h * 0.06, h * 0.42); c.stroke(); }); }   // eight legs
    c.fillStyle = col; E(c, 0, h * 0.14, h * 0.4, h * 0.14);                                                // body
    c.fillStyle = dk; for (let i = -2; i <= 2; i++) E(c, i * h * 0.13, h * 0.12, h * 0.03, h * 0.12);        // segments
    Q(c, -h * 0.36, h * 0.1, -h * 0.7, -h * 0.4, -h * 0.26 + w * h, -h * 0.5, h * 0.1, col);                // the tail, curled up over the back
    c.fillStyle = dk; P(c, [[-h * 0.3 + w * h, -h * 0.56], [-h * 0.1 + w * h, -h * 0.5], [-h * 0.26 + w * h, -h * 0.42]]);   // the sting
    L(c, h * 0.3, h * 0.08, h * 0.56, -h * 0.08, h * 0.08, col); L(c, h * 0.3, h * 0.18, h * 0.58, h * 0.26, h * 0.08, col);   // arms
    c.fillStyle = col; E(c, h * 0.66, -h * 0.1, h * 0.14, h * 0.09, -0.3); E(c, h * 0.68, h * 0.28, h * 0.14, h * 0.09, 0.3);   // the claws
    c.fillStyle = dk; P(c, [[h * 0.74, -h * 0.16], [h * 0.9, -h * 0.26], [h * 0.8, -h * 0.08]]); P(c, [[h * 0.76, h * 0.34], [h * 0.92, h * 0.4], [h * 0.8, h * 0.24]]);
    dot(c, h * 0.3, h * 0.08, h * 0.022); dot(c, h * 0.3, h * 0.18, h * 0.022);
  },
  lizard(c, s, o) {
    const col = '#8DB04A', dk = '#5E7E2A', h = s, w = o.rest ? 0 : Math.sin(o.ph * 2) * h * 0.08;
    [[-h * 0.3, -1], [-h * 0.3, 1], [h * 0.26, 1], [h * 0.26, -1]].forEach(([x, d], i) => { const sw = o.rest ? 0 : Math.sin(o.ph * 2 + i * 1.6) * h * 0.08; L(c, x, h * 0.1, x + d * h * 0.18 + sw, h * 0.3, h * 0.05, dk); L(c, x + d * h * 0.18 + sw, h * 0.3, x + d * h * 0.3 + sw, h * 0.36, h * 0.04, dk); });   // splayed legs
    c.fillStyle = col; E(c, 0, h * 0.1, h * 0.46, h * 0.14);                                                // body
    Q(c, -h * 0.44, h * 0.1, -h * 0.8, h * 0.12 + w, -h * 1.1, h * 0.02 - w, h * 0.06, col);                // tail
    E(c, h * 0.52, h * 0.06, h * 0.2, h * 0.1, -0.1);                                                        // head
    c.fillStyle = dk; for (let i = -3; i <= 3; i++) D(c, i * h * 0.12, h * 0.04, h * 0.025);                 // scales
    eye(c, h * 0.56, h * 0.0, h * 0.025, '#F6E27A');
  },
  reeffish(c, s, o) {
    const h = s, col = '#F58A2A', w = o.rest ? 0 : Math.sin(o.ph * 2) * h * 0.12;
    c.fillStyle = col; P(c, [[-h * 0.4, 0], [-h * 0.72, -h * 0.26 + w], [-h * 0.66, 0], [-h * 0.72, h * 0.26 + w]]);   // the tail
    E(c, 0, 0, h * 0.44, h * 0.3);                                                                          // body
    c.fillStyle = '#F7F7F2'; [[-h * 0.2, h * 0.28], [h * 0.1, h * 0.3]].forEach(([x, rh]) => { c.beginPath(); c.ellipse(x, 0, h * 0.05, rh, 0, 0, TAU); c.fill(); }); P(c, [[h * 0.3, -h * 0.2], [h * 0.38, -h * 0.1], [h * 0.38, h * 0.1], [h * 0.3, h * 0.2], [h * 0.36, 0]]);   // the white bands
    c.strokeStyle = '#17171C'; c.lineWidth = h * 0.015; [-h * 0.2, h * 0.1].forEach((x) => { c.beginPath(); c.ellipse(x, 0, h * 0.05, h * 0.28, 0, 0, TAU); c.stroke(); });
    c.fillStyle = col; E(c, -h * 0.02, -h * 0.28, h * 0.14, h * 0.06); E(c, h * 0.06, h * 0.26 + w * 0.3, h * 0.1, h * 0.06, 0.4);   // fins
    eye(c, h * 0.28, -h * 0.06, h * 0.04);
  },
  turtle(c, s, o) {
    const h = s, col = '#5E8F46', dk = '#3F6A2E', shell = '#7A6A3A', sw = o.rest ? 0 : Math.sin(o.ph) * h * 0.1;
    c.fillStyle = col; E(c, h * 0.1, h * 0.14 + sw, h * 0.26, h * 0.08, 0.5); E(c, -h * 0.3, h * 0.14 - sw, h * 0.2, h * 0.07, -0.4);   // flippers
    c.fillStyle = shell; E(c, 0, 0, h * 0.5, h * 0.26);                                                      // shell
    c.fillStyle = '#9A8A52'; for (let i = -2; i <= 2; i++) E(c, i * h * 0.17, -h * 0.02, h * 0.07, h * 0.1); E(c, 0, -h * 0.14, h * 0.06, h * 0.05);   // scutes
    c.fillStyle = col; E(c, h * 0.56, -h * 0.06, h * 0.14, h * 0.1, -0.2);                                   // head
    E(c, h * 0.1, -h * 0.16 - sw * 0.5, h * 0.24, h * 0.07, -0.5);                                             // the top flipper
    eye(c, h * 0.6, -h * 0.1, h * 0.028);
    c.fillStyle = dk; E(c, -h * 0.52, h * 0.02, h * 0.06, h * 0.03);
  },
  octopus(c, s, o) {
    const h = s, col = '#A24E9E', dk = '#7A3A78';
    c.strokeStyle = col; c.lineWidth = h * 0.08; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const u = (i - 3.5) / 3.5, x = u * h * 0.3, wav = Math.sin(o.t * 2.5 + i) * h * 0.1; c.beginPath(); c.moveTo(x, h * 0.1); c.quadraticCurveTo(x + u * h * 0.2 + wav, h * 0.36, x + u * h * 0.3 - wav, h * 0.5); c.stroke(); c.fillStyle = dk; D(c, x + u * h * 0.3 - wav, h * 0.5, h * 0.04); }
    c.fillStyle = col; E(c, 0, -h * 0.14, h * 0.36, h * 0.34);                                               // mantle
    c.fillStyle = dk; D(c, -h * 0.1, h * 0.04, h * 0.03); D(c, h * 0.16, h * 0.06, h * 0.03);
    eye(c, -h * 0.1, -h * 0.1, h * 0.07); eye(c, h * 0.14, -h * 0.1, h * 0.07);
  },
  shark(c, s, o) {
    const h = s, col = '#7E8CA0', dk = '#5E6C80', w = o.rest ? 0 : Math.sin(o.ph * 2) * h * 0.12;
    c.fillStyle = col; P(c, [[-h * 0.9, 0], [-h * 1.18, -h * 0.3 + w], [-h * 1.08, 0], [-h * 1.14, h * 0.2 + w]]);   // tail
    c.beginPath(); c.moveTo(h * 0.9, 0); c.quadraticCurveTo(h * 0.4, -h * 0.36, -h * 0.5, -h * 0.16); c.lineTo(-h * 0.95, 0); c.lineTo(-h * 0.5, h * 0.12); c.quadraticCurveTo(h * 0.3, h * 0.3, h * 0.9, 0); c.closePath(); c.fill();   // body
    c.fillStyle = '#E6EAF0'; c.beginPath(); c.moveTo(h * 0.8, h * 0.02); c.quadraticCurveTo(h * 0.3, h * 0.26, -h * 0.5, h * 0.1); c.quadraticCurveTo(h * 0.2, h * 0.14, h * 0.8, h * 0.02); c.fill();   // belly
    c.fillStyle = col; P(c, [[-h * 0.2, -h * 0.14], [0, -h * 0.5], [h * 0.2, -h * 0.12]]); c.fillStyle = '#17171C'; P(c, [[-h * 0.06, -h * 0.4], [0, -h * 0.5], [h * 0.08, -h * 0.38]]);   // the black-tipped fin
    c.fillStyle = col; P(c, [[h * 0.1, h * 0.08], [-h * 0.1, h * 0.36 - w * 0.5], [-h * 0.3, h * 0.08]]);     // pectoral fin
    c.strokeStyle = dk; c.lineWidth = h * 0.02; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(h * (0.38 + i * 0.06), -h * 0.1); c.lineTo(h * (0.4 + i * 0.06), h * 0.06); c.stroke(); }   // gills
    eye(c, h * 0.68, -h * 0.08, h * 0.03); L(c, h * 0.72, h * 0.08, h * 0.86, h * 0.03, h * 0.015, dk);
  },
  pufferfish(c, s, o) {
    const h = s, col = '#E9C867', dk = '#B99A3E', w = o.rest ? 0 : Math.sin(o.ph * 3) * h * 0.08;
    c.fillStyle = dk; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = h * 0.4; P(c, [[Math.cos(a - 0.1) * r, Math.sin(a - 0.1) * r], [Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3], [Math.cos(a + 0.1) * r, Math.sin(a + 0.1) * r]]); }   // spikes
    c.fillStyle = col; D(c, 0, 0, h * 0.42);                                                                  // the puffed body
    c.fillStyle = '#F7EBC0'; E(c, h * 0.04, h * 0.14, h * 0.3, h * 0.2);
    c.fillStyle = dk; for (let i = 0; i < 6; i++) D(c, Math.cos(i * 1.1) * h * 0.26, Math.sin(i * 2.1) * h * 0.2, h * 0.03);   // spots
    c.fillStyle = col; P(c, [[-h * 0.4, 0], [-h * 0.62, -h * 0.16 + w], [-h * 0.62, h * 0.16 + w]]); E(c, h * 0.1, -h * 0.1, h * 0.1, h * 0.05, 0.6 + w);   // tail and fin
    eye(c, h * 0.26, -h * 0.1, h * 0.06); c.fillStyle = '#9A7A2E'; E(c, h * 0.4, h * 0.06, h * 0.05, h * 0.03);
  },
  penguin(c, s, o) {
    const h = s, blk = '#1E2230', wad = o.rest ? 0 : Math.sin(o.ph * 1.4) * 0.12;
    c.save(); c.rotate(wad);
    c.fillStyle = '#F2A33A'; E(c, -h * 0.1, h * 0.46, h * 0.1, h * 0.04); E(c, h * 0.1, h * 0.46, h * 0.1, h * 0.04);   // feet
    c.fillStyle = blk; E(c, 0, h * 0.06, h * 0.3, h * 0.42);                                                  // body
    c.fillStyle = '#F7F7F2'; E(c, h * 0.06, h * 0.12, h * 0.2, h * 0.32);                                     // front
    c.fillStyle = '#F6D36A'; E(c, h * 0.1, -h * 0.14, h * 0.12, h * 0.1);                                      // the yellow neck patch
    c.fillStyle = blk; D(c, h * 0.04, -h * 0.28, h * 0.17);                                                    // head
    E(c, -h * 0.26, h * 0.04, h * 0.07, h * 0.26, -0.2 + Math.sin(o.t * 4) * 0.1 * (o.rest ? 0 : 1));             // a flipper
    c.fillStyle = '#F2A33A'; P(c, [[h * 0.16, -h * 0.3], [h * 0.4, -h * 0.26], [h * 0.16, -h * 0.22]]);        // beak
    eye(c, h * 0.1, -h * 0.32, h * 0.03);
    c.restore();
  },
  polarbear(c, s, o) {
    const col = '#F4F3EE', dk = '#D9D8D2', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.28, h * 0.22, h * 0.14, h * 0.32, h * 0.14, { hoof: '#CFCDC6' });
    c.fillStyle = col; E(c, -h * 0.02, -h * 0.02, h * 0.5, h * 0.28);                                       // body
    E(c, h * 0.42, -h * 0.2, h * 0.2, h * 0.15, 0.2);                                                           // head
    E(c, h * 0.6, -h * 0.14, h * 0.1, h * 0.07, 0.2); dot(c, h * 0.68, -h * 0.14, h * 0.03);                    // muzzle and nose
    c.fillStyle = dk; D(c, h * 0.3, -h * 0.34, h * 0.045); D(c, h * 0.46, -h * 0.36, h * 0.045);               // ears
    eye(c, h * 0.46, -h * 0.22, h * 0.022);
  },
  seal(c, s, o) {
    const h = s, col = '#9AA3AE', dk = '#737C88', lift = Math.sin(o.t * 1.6) * h * 0.03;
    c.fillStyle = col; c.beginPath(); c.moveTo(-h * 0.9, h * 0.28); c.quadraticCurveTo(-h * 0.3, -h * 0.2, h * 0.3, -h * 0.06 + lift); c.quadraticCurveTo(h * 0.7, h * 0.02, h * 0.5, h * 0.3); c.closePath(); c.fill();   // body
    P(c, [[-h * 0.9, h * 0.28], [-h * 1.1, h * 0.1], [-h * 1.14, h * 0.32]]);                                 // the tail flippers
    c.fillStyle = dk; E(c, -h * 0.1, h * 0.26, h * 0.16, h * 0.06, 0.3); for (let i = 0; i < 6; i++) D(c, -h * 0.5 + i * h * 0.16, h * (0.08 + (i % 2) * 0.08), h * 0.03);   // a flipper and spots
    c.fillStyle = col; D(c, h * 0.46, -h * 0.14 + lift, h * 0.16);                                             // head
    dot(c, h * 0.6, -h * 0.12 + lift, h * 0.03); eye(c, h * 0.48, -h * 0.2 + lift, h * 0.03);
    c.strokeStyle = '#F2F2F0'; c.lineWidth = h * 0.012; [-0.06, 0, 0.06].forEach((d) => { c.beginPath(); c.moveTo(h * 0.58, -h * 0.1 + lift); c.lineTo(h * 0.76, -h * 0.1 + lift + d * h); c.stroke(); });
  },
  whale(c, s, o) {
    const h = s, col = '#3C5A78', dk = '#2A4258', w = o.rest ? 0 : Math.sin(o.ph) * h * 0.08;
    c.fillStyle = col; c.beginPath(); c.moveTo(h * 1.2, h * 0.08); c.quadraticCurveTo(h * 0.6, -h * 0.5, -h * 0.4, -h * 0.26); c.quadraticCurveTo(-h * 0.9, -h * 0.1, -h * 1.2, h * 0.02); c.lineTo(-h * 1.14, h * 0.14); c.quadraticCurveTo(-h * 0.5, h * 0.2, h * 0.3, h * 0.3); c.quadraticCurveTo(h * 0.9, h * 0.3, h * 1.2, h * 0.08); c.closePath(); c.fill();   // body with its hump
    P(c, [[-h * 1.14, h * 0.08], [-h * 1.5, -h * 0.14 + w], [-h * 1.4, h * 0.08], [-h * 1.5, h * 0.3 + w]]);    // the flukes
    c.fillStyle = '#DCE6EE'; c.beginPath(); c.moveTo(h * 1.1, h * 0.14); c.quadraticCurveTo(h * 0.4, h * 0.34, -h * 0.9, h * 0.16); c.quadraticCurveTo(h * 0.3, h * 0.22, h * 1.1, h * 0.14); c.fill();   // white underside
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = h * 0.012; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(h * (1.0 - i * 0.04), h * 0.1 + i * h * 0.02); c.lineTo(h * (0.2 - i * 0.1), h * 0.2 + i * h * 0.015); c.stroke(); }   // throat grooves
    c.fillStyle = dk; P(c, [[-h * 0.3, -h * 0.24], [-h * 0.2, -h * 0.4], [-h * 0.1, -h * 0.22]]);               // dorsal fin
    c.fillStyle = col; P(c, [[h * 0.3, h * 0.16], [-h * 0.3, h * 0.46 + w], [-h * 0.1, h * 0.18]]); c.fillStyle = '#DCE6EE'; P(c, [[h * 0.2, h * 0.2], [-h * 0.26, h * 0.42 + w], [-h * 0.1, h * 0.22]]);   // the long flipper
    eye(c, h * 0.9, h * 0.02, h * 0.03);
  }
};
/* ---------------- the race, the scale, and the odd ones out ---------------- */
Object.assign(K, {
  falcon(c, s, o) {                                                                                  // diving: wings swept back, a streak
    const h = s, col = '#4A5668', dk = '#2F3A4A';
    c.fillStyle = dk; P(c, [[-h * 0.1, -h * 0.06], [-h * 0.9, -h * 0.34], [-h * 0.4, h * 0.04]]); P(c, [[-h * 0.1, h * 0.04], [-h * 0.9, h * 0.34], [-h * 0.4, h * 0.1]]);   // swept wings
    c.fillStyle = col; E(c, 0, 0, h * 0.5, h * 0.17);                                                     // body
    P(c, [[-h * 0.42, -h * 0.04], [-h * 0.8, -h * 0.1], [-h * 0.82, h * 0.1], [-h * 0.42, h * 0.08]]);     // tail
    c.fillStyle = '#E9E2D6'; E(c, h * 0.1, h * 0.06, h * 0.32, h * 0.09); c.strokeStyle = dk; c.lineWidth = h * 0.015; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(h * (-0.14 + i * 0.1), h * 0.0); c.lineTo(h * (-0.12 + i * 0.1), h * 0.12); c.stroke(); }   // barred chest
    c.fillStyle = col; D(c, h * 0.5, -h * 0.04, h * 0.14);                                                 // head
    c.fillStyle = dk; P(c, [[h * 0.44, -h * 0.14], [h * 0.6, -h * 0.02], [h * 0.46, h * 0.06]]);            // the dark hood
    c.fillStyle = '#F6C83A'; P(c, [[h * 0.6, -h * 0.08], [h * 0.76, -h * 0.02], [h * 0.6, h * 0.04]]); c.fillStyle = '#2A2A2A'; P(c, [[h * 0.7, -h * 0.05], [h * 0.76, -h * 0.02], [h * 0.68, h * 0.01]]);   // beak
    eye(c, h * 0.52, -h * 0.07, h * 0.03, '#F6E6A8');
  },
  car(c, s, o) {
    const h = s, col = '#D7263D', dk = '#A61B2E', spin = o.t * 14;
    c.fillStyle = col; c.beginPath(); if (c.roundRect) c.roundRect(-h * 0.9, -h * 0.1, h * 1.8, h * 0.42, h * 0.1); else c.rect(-h * 0.9, -h * 0.1, h * 1.8, h * 0.42); c.fill();   // body
    c.beginPath(); c.moveTo(-h * 0.5, -h * 0.1); c.lineTo(-h * 0.3, -h * 0.42); c.lineTo(h * 0.36, -h * 0.42); c.lineTo(h * 0.62, -h * 0.1); c.closePath(); c.fill();   // roof
    c.fillStyle = '#BFE3F7'; P(c, [[-h * 0.42, -h * 0.12], [-h * 0.26, -h * 0.36], [h * 0.0, -h * 0.36], [h * 0.0, -h * 0.12]]); P(c, [[h * 0.06, -h * 0.36], [h * 0.32, -h * 0.36], [h * 0.52, -h * 0.12], [h * 0.06, -h * 0.12]]);   // windows
    c.fillStyle = dk; c.fillRect(-h * 0.9, h * 0.18, h * 1.8, h * 0.06);
    c.fillStyle = '#F6E27A'; E(c, h * 0.86, h * 0.0, h * 0.05, h * 0.06); c.fillStyle = '#F03A3A'; E(c, -h * 0.88, h * 0.0, h * 0.04, h * 0.06);   // lights
    [-h * 0.5, h * 0.5].forEach((x) => { c.fillStyle = '#1B1B1B'; D(c, x, h * 0.32, h * 0.17); c.fillStyle = '#9A9A9A'; D(c, x, h * 0.32, h * 0.09); c.strokeStyle = '#1B1B1B'; c.lineWidth = h * 0.03; for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 2; c.beginPath(); c.moveTo(x, h * 0.32); c.lineTo(x + Math.cos(a) * h * 0.08, h * 0.32 + Math.sin(a) * h * 0.08); c.stroke(); } });   // wheels
  },
  cheetah(c, s, o) {
    const col = '#E2B45A', dk = '#B98A38', ph = o.ph, h = s, run = o.run || !o.rest;
    const st = run ? Math.sin(ph) : 0;
    c.fillStyle = col;
    L(c, -h * 0.3, h * 0.06, -h * 0.5 - st * h * 0.2, h * 0.3, h * 0.08, dk); L(c, h * 0.3, h * 0.06, h * 0.5 + st * h * 0.2, h * 0.3, h * 0.08, dk);   // far legs, stretched
    L(c, -h * 0.26, h * 0.08, -h * 0.4 + st * h * 0.24, h * 0.32, h * 0.08, col); L(c, h * 0.3, h * 0.08, h * 0.5 - st * h * 0.24, h * 0.32, h * 0.08, col);
    c.fillStyle = col; E(c, 0, 0, h * 0.5, h * 0.15, st * 0.08);                                           // long slender body
    spots(c, [[-h * 0.3, -h * 0.05], [-h * 0.14, h * 0.04], [0, -h * 0.08], [h * 0.14, h * 0.03], [h * 0.26, -h * 0.06], [-h * 0.22, h * 0.08], [h * 0.06, h * 0.08]], h * 0.03, '#3A2A1A');
    tail(c, -h * 0.5, -h * 0.02, h * 0.5, h * 0.04, col, st * h * 0.1, true); c.fillStyle = '#3A2A1A'; D(c, -h * 0.98, -h * 0.24 + st * h * 0.1, h * 0.035);
    c.fillStyle = col; D(c, h * 0.52, -h * 0.14, h * 0.13);                                                 // small head
    E(c, h * 0.44, -h * 0.26, h * 0.035, h * 0.035); E(c, h * 0.58, -h * 0.26, h * 0.035, h * 0.035);
    c.fillStyle = '#F7EBD2'; E(c, h * 0.6, -h * 0.08, h * 0.07, h * 0.05); dot(c, h * 0.65, -h * 0.1, h * 0.02);
    L(c, h * 0.5, -h * 0.16, h * 0.56, -h * 0.06, h * 0.02, '#2A1A10');                                      // the tear line
    eye(c, h * 0.5, -h * 0.17, h * 0.024, '#F6E6A8');
  },
  ostrich(c, s, o) {
    const h = s, col = '#2B2420', skin = '#D9A98A', ph = o.ph;
    legs2(c, ph, o.rest, skin, h * 0.02, h * 0.1, h * 0.38, h * 0.045, o.run ? 1 : 0.6);
    c.fillStyle = col; E(c, 0, -h * 0.02, h * 0.3, h * 0.2);                                               // body
    c.fillStyle = '#F2EEE6'; E(c, -h * 0.26, -h * 0.06, h * 0.12, h * 0.1, 0.4); E(c, h * 0.06, h * 0.08, h * 0.14, h * 0.06, -0.2);   // white plumes
    Q(c, h * 0.2, -h * 0.14, h * 0.3, -h * 0.34, h * 0.26, -h * 0.5, h * 0.05, skin);                        // neck
    c.fillStyle = skin; D(c, h * 0.28, -h * 0.5, h * 0.05); c.fillStyle = '#E8B38A'; P(c, [[h * 0.32, -h * 0.52], [h * 0.42, -h * 0.49], [h * 0.32, -h * 0.47]]);
    eye(c, h * 0.29, -h * 0.51, h * 0.016);
  },
  runner(c, s, o) {                                                                                   // a sprinter in Jamaica's colours
    const h = s, skin = '#6B4226', kit = '#F6D63A', ph = o.ph, k = o.rest ? 0 : 1;
    const a = Math.sin(ph) * k, b = Math.sin(ph + Math.PI) * k;
    L(c, 0, h * 0.06, h * 0.12 * a, h * 0.3, h * 0.07, skin); L(c, h * 0.12 * a, h * 0.3, h * 0.12 * a - h * 0.06 * Math.max(0, -a), h * 0.48, h * 0.07, skin);   // legs
    L(c, 0, h * 0.06, h * 0.12 * b, h * 0.3, h * 0.07, '#4A2E1A'); L(c, h * 0.12 * b, h * 0.3, h * 0.12 * b - h * 0.06 * Math.max(0, -b), h * 0.48, h * 0.07, '#4A2E1A');
    c.fillStyle = kit; E(c, 0, -h * 0.1, h * 0.13, h * 0.2, k * a * 0.1);                                   // vest
    c.fillStyle = '#1E8A3C'; c.fillRect(-h * 0.1, h * 0.04, h * 0.2, h * 0.06);                               // shorts
    L(c, h * 0.02, -h * 0.22, h * 0.16 * b, -h * 0.06, h * 0.05, skin); L(c, h * 0.02, -h * 0.22, h * 0.16 * a, -h * 0.06, h * 0.05, '#4A2E1A');   // arms pumping
    c.fillStyle = skin; D(c, h * 0.04, -h * 0.38, h * 0.1); c.fillStyle = '#1A1A1A'; E(c, h * 0.02, -h * 0.43, h * 0.1, h * 0.06);   // head and hair
  },
  pupil(c, s, o) {                                                                                     // a Year 4 or 5 pupil: standing to be measured, or running the race
    const h = s, skin = '#C98B5E', ph = o.ph, run = o.run, k = run && !o.rest ? 1 : 0;
    const a = Math.sin(ph) * k, b = Math.sin(ph + Math.PI) * k;
    if (run) {
      L(c, 0, h * 0.1, h * 0.1 * a, h * 0.3, h * 0.06, skin); L(c, 0, h * 0.1, h * 0.1 * b, h * 0.3, h * 0.06, '#9A6A44');
      L(c, h * 0.1 * a, h * 0.3, h * 0.1 * a - h * 0.04 * Math.max(0, -a), h * 0.46, h * 0.06, skin); L(c, h * 0.1 * b, h * 0.3, h * 0.1 * b - h * 0.04 * Math.max(0, -b), h * 0.46, h * 0.06, '#9A6A44');
      c.fillStyle = '#2E4A9E'; c.fillRect(-h * 0.1, 0, h * 0.2, h * 0.12);                                   // PE shorts
      c.fillStyle = '#F7F7F2'; E(c, 0, -h * 0.12, h * 0.12, h * 0.16);                                       // PE top
      L(c, 0, -h * 0.22, h * 0.14 * b, -h * 0.08, h * 0.045, skin); L(c, 0, -h * 0.22, h * 0.14 * a, -h * 0.08, h * 0.045, '#9A6A44');
      c.fillStyle = skin; D(c, h * 0.03, -h * 0.36, h * 0.09); c.fillStyle = '#3A2A1A'; E(c, h * 0.01, -h * 0.41, h * 0.09, h * 0.05);
      return;
    }
    L(c, -h * 0.07, h * 0.1, -h * 0.08, h * 0.44, h * 0.07, skin); L(c, h * 0.07, h * 0.1, h * 0.08, h * 0.44, h * 0.07, skin);   // legs
    c.fillStyle = '#1F2A44'; c.fillRect(-h * 0.14, h * 0.4, h * 0.11, h * 0.08); c.fillRect(h * 0.03, h * 0.4, h * 0.11, h * 0.08);   // shoes
    c.fillStyle = '#2E4A9E'; c.fillRect(-h * 0.14, -h * 0.02, h * 0.28, h * 0.16);                             // shorts
    c.fillStyle = '#F7F7F2'; E(c, 0, -h * 0.14, h * 0.16, h * 0.16);                                          // shirt
    c.fillStyle = '#D7263D'; c.fillRect(-h * 0.03, -h * 0.26, h * 0.06, h * 0.14);                            // tie
    L(c, -h * 0.14, -h * 0.2, -h * 0.2, h * 0.04, h * 0.05, skin); L(c, h * 0.14, -h * 0.2, h * 0.2, h * 0.04, h * 0.05, skin);   // arms
    c.fillStyle = skin; D(c, 0, -h * 0.38, h * 0.11);                                                         // head
    c.fillStyle = '#3A2A1A'; E(c, 0, -h * 0.44, h * 0.11, h * 0.06);                                           // hair
    eye(c, -h * 0.04, -h * 0.38, h * 0.015); eye(c, h * 0.04, -h * 0.38, h * 0.015);
    c.strokeStyle = '#8A4A3A'; c.lineWidth = h * 0.012; c.beginPath(); c.arc(0, -h * 0.35, h * 0.04, 0.2, Math.PI - 0.2); c.stroke();
  },
  snail(c, s, o) {
    const h = s, col = '#8E9A6A', shell = '#A0632C';
    c.fillStyle = col; c.beginPath(); c.moveTo(-h * 0.5, h * 0.4); c.quadraticCurveTo(0, h * 0.2, h * 0.5, h * 0.1); c.quadraticCurveTo(h * 0.62, h * 0.2, h * 0.5, h * 0.4); c.closePath(); c.fill();   // the foot
    c.strokeStyle = col; c.lineWidth = h * 0.05; c.lineCap = 'round'; c.beginPath(); c.moveTo(h * 0.4, h * 0.14); c.lineTo(h * 0.5, -h * 0.1); c.stroke(); c.beginPath(); c.moveTo(h * 0.5, h * 0.14); c.lineTo(h * 0.64, -h * 0.06); c.stroke();   // eye stalks
    dot(c, h * 0.5, -h * 0.12, h * 0.035); dot(c, h * 0.64, -h * 0.08, h * 0.035);
    c.fillStyle = shell; D(c, -h * 0.1, 0, h * 0.36);                                                       // shell
    c.strokeStyle = '#6E4018'; c.lineWidth = h * 0.05; c.beginPath(); for (let a = 0; a < TAU * 2; a += 0.2) { const r = h * 0.05 + a * h * 0.045; c.lineTo(-h * 0.1 + Math.cos(a) * r, Math.sin(a) * r); } c.stroke();   // the spiral
  },
  hummingbird(c, s, o) {
    const h = s, col = '#2FA66A', dk = '#1C7A4C', f = Math.sin(o.t * 40 + (o.ph || 0));
    c.fillStyle = 'rgba(80,160,120,.35)'; E(c, -h * 0.05, -h * 0.2, h * 0.3, h * 0.1, -0.6 + f * 0.5); E(c, -h * 0.05, -h * 0.2, h * 0.3, h * 0.1, -0.6 - f * 0.5);   // wings, a blur
    c.fillStyle = col; E(c, 0, 0, h * 0.3, h * 0.17, -0.2);                                                   // body
    c.fillStyle = dk; P(c, [[-h * 0.24, h * 0.04], [-h * 0.6, h * 0.16], [-h * 0.5, h * 0.3], [-h * 0.2, h * 0.14]]);   // tail
    c.fillStyle = '#E8457A'; E(c, h * 0.16, h * 0.02, h * 0.1, h * 0.08);                                     // the throat
    c.fillStyle = col; D(c, h * 0.3, -h * 0.1, h * 0.12);                                                      // head
    L(c, h * 0.4, -h * 0.1, h * 0.86, -h * 0.14, h * 0.025, '#2A2A2A');                                         // the long beak
    eye(c, h * 0.32, -h * 0.13, h * 0.025);
  },
  bat(c, s, o) {
    const h = s, col = '#2A2630', f = Math.sin(o.t * 9 + (o.ph || 0));
    c.fillStyle = col;
    [-1, 1].forEach((d) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(d * h * 0.3, -h * 0.3 - f * h * 0.3); c.lineTo(d * h * 0.75, -h * 0.1 - f * h * 0.45); c.lineTo(d * h * 0.62, h * 0.05 - f * h * 0.2); c.lineTo(d * h * 0.4, h * 0.0 - f * h * 0.1); c.lineTo(d * h * 0.18, h * 0.08); c.closePath(); c.fill(); });   // wings
    E(c, 0, 0, h * 0.12, h * 0.2); D(c, 0, -h * 0.2, h * 0.1);                                               // body and head
    P(c, [[-h * 0.1, -h * 0.26], [-h * 0.08, -h * 0.4], [-h * 0.01, -h * 0.28]]); P(c, [[h * 0.1, -h * 0.26], [h * 0.08, -h * 0.4], [h * 0.01, -h * 0.28]]);   // ears
    c.fillStyle = '#F6C83A'; D(c, -h * 0.035, -h * 0.21, h * 0.02); D(c, h * 0.035, -h * 0.21, h * 0.02);
  },
  dragon(c, s, o) {                                                                                    // the lion-dance dragon's head, for Chinese New Year
    const h = s, red = '#E8392B', gold = '#F5B82E';
    c.fillStyle = gold; for (let i = 0; i < 7; i++) { const a = Math.PI * (0.9 + i * 0.07); E(c, -h * 0.1 + Math.cos(a) * h * 0.26, Math.sin(a) * h * 0.26, h * 0.1, h * 0.05, a); }   // the mane
    c.fillStyle = red; E(c, 0, 0, h * 0.34, h * 0.26); E(c, h * 0.28, h * 0.06, h * 0.26, h * 0.16);          // head and snout
    c.fillStyle = gold; L(c, -h * 0.12, -h * 0.22, -h * 0.26, -h * 0.5, h * 0.06, gold); L(c, h * 0.04, -h * 0.24, h * 0.0, -h * 0.52, h * 0.06, gold);   // horns
    c.fillStyle = '#1E1E22'; E(c, h * 0.36, h * 0.12, h * 0.16, h * 0.06);                                     // the open mouth
    c.fillStyle = '#F7F7F2'; for (let i = 0; i < 4; i++) P(c, [[h * (0.24 + i * 0.07), h * 0.08], [h * (0.28 + i * 0.07), h * 0.14], [h * (0.3 + i * 0.07), h * 0.08]]);   // teeth
    c.fillStyle = '#F7F7F2'; D(c, h * 0.08, -h * 0.08, h * 0.09); c.fillStyle = '#1E1E22'; D(c, h * 0.1, -h * 0.08, h * 0.05); c.fillStyle = '#fff'; D(c, h * 0.08, -h * 0.1, h * 0.02);   // a big eye
    Q(c, h * 0.5, h * 0.04, h * 0.7, -h * 0.1, h * 0.9, h * 0.1 + Math.sin(o.t * 3) * h * 0.05, h * 0.025, gold); Q(c, h * 0.5, h * 0.14, h * 0.7, h * 0.3, h * 0.88, h * 0.26, h * 0.025, gold);   // whiskers
    c.fillStyle = '#F7F7F2'; D(c, h * 0.52, -h * 0.02, h * 0.05);                                               // the pearl
  },
  plane(c, s, o) {                                                                                     // an airliner, pointing right
    const h = s, col = '#F2F4F7', blue = '#2E63B8';
    c.fillStyle = blue; P(c, [[-h * 0.42, -h * 0.02], [-h * 0.52, -h * 0.4], [-h * 0.3, -h * 0.4], [-h * 0.14, -h * 0.02]]);    // tail fin
    c.fillStyle = '#C8D0DC'; P(c, [[-h * 0.05, h * 0.0], [-h * 0.3, h * 0.42], [-h * 0.14, h * 0.42], [h * 0.22, h * 0.02]]);   // far wing
    c.fillStyle = col; c.beginPath(); c.moveTo(-h * 0.6, 0); c.quadraticCurveTo(-h * 0.5, -h * 0.14, -h * 0.2, -h * 0.14); c.lineTo(h * 0.4, -h * 0.14); c.quadraticCurveTo(h * 0.68, -h * 0.1, h * 0.72, 0); c.quadraticCurveTo(h * 0.68, h * 0.1, h * 0.4, h * 0.14); c.lineTo(-h * 0.2, h * 0.14); c.quadraticCurveTo(-h * 0.5, h * 0.14, -h * 0.6, 0); c.closePath(); c.fill();   // fuselage
    c.fillStyle = col; P(c, [[h * 0.06, h * 0.04], [-h * 0.24, -h * 0.4], [-h * 0.08, -h * 0.4], [h * 0.28, h * 0.04]]);         // near wing
    c.fillStyle = blue; c.fillRect(-h * 0.1, -h * 0.3, h * 0.1, h * 0.12);                                                     // engine
    c.fillStyle = '#5A6E8C'; for (let i = 0; i < 6; i++) D(c, -h * 0.2 + i * h * 0.12, -h * 0.05, h * 0.025); P(c, [[h * 0.52, -h * 0.1], [h * 0.64, -h * 0.06], [h * 0.64, -h * 0.02], [h * 0.5, -h * 0.02]]);   // windows
  }
});

Object.assign(K, {
  monkey(c, s, o) {                                                                                    // a proboscis monkey: a big nose and a long tail
    const h = s, col = '#C8783A', dk = '#9A5424', cream = '#E9D2B0', sw = o.rest ? 0 : Math.sin(o.ph) * 0.3;
    Q(c, -h * 0.3, h * 0.1, -h * 0.7, h * 0.3, -h * 0.8, -h * 0.3 + sw * h * 0.2, h * 0.05, dk);              // the tail
    L(c, -h * 0.2, h * 0.14, -h * 0.26 - sw * h * 0.1, h * 0.46, h * 0.08, dk); L(c, h * 0.14, h * 0.14, h * 0.2 + sw * h * 0.1, h * 0.46, h * 0.08, dk);   // legs
    c.fillStyle = col; E(c, 0, h * 0.06, h * 0.32, h * 0.26);                                                // body
    c.fillStyle = cream; E(c, h * 0.04, h * 0.14, h * 0.2, h * 0.16);                                         // pale belly
    L(c, h * 0.2, -h * 0.02, h * 0.36 + sw * h * 0.1, h * 0.3, h * 0.07, col);                                 // an arm
    c.fillStyle = col; D(c, h * 0.26, -h * 0.26, h * 0.17);                                                   // head
    c.fillStyle = '#F2C6A6'; E(c, h * 0.3, -h * 0.26, h * 0.1, h * 0.12);                                      // face
    c.fillStyle = '#E8A080'; E(c, h * 0.42, -h * 0.2, h * 0.07, h * 0.1, 0.3);                                 // the nose
    eye(c, h * 0.26, -h * 0.3, h * 0.025); eye(c, h * 0.36, -h * 0.31, h * 0.025);
  },
  mousedeer(c, s, o) {                                                                                 // the kancil: tiny, slender, no antlers
    const col = '#9A6A3E', dk = '#6E4A28', ph = o.ph, h = s;
    legs4(c, ph, o.rest, col, dk, -h * 0.16, h * 0.14, h * 0.1, h * 0.36, h * 0.035, { hoof: '#3A2A1A' });
    c.fillStyle = col; E(c, 0, -h * 0.02, h * 0.3, h * 0.17);                                                 // body
    c.fillStyle = '#E8D8C0'; E(c, h * 0.02, h * 0.08, h * 0.2, h * 0.06);                                       // the pale underside
    L(c, h * 0.22, -h * 0.1, h * 0.36, -h * 0.34, h * 0.08, col);                                               // neck
    c.fillStyle = col; E(c, h * 0.42, -h * 0.36, h * 0.1, h * 0.065, 0.2);                                      // head
    E(c, h * 0.36, -h * 0.44, h * 0.03, h * 0.05, -0.3); dot(c, h * 0.52, -h * 0.34, h * 0.016); eye(c, h * 0.42, -h * 0.38, h * 0.018);
  }
});
/* ---------------- which picture for which creature ---------------- */
const BY_NAME = [[/hornbill/i, 'hornbill'], [/hummingbird/i, 'hummingbird'], [/orangutan/i, 'orangutan'], [/frog/i, 'frog'], [/butterfly|birdwing/i, 'butterfly'], [/tiger/i, 'tiger'], [/elephant/i, 'elephant'], [/pig/i, 'pig'],
  [/zebra/i, 'zebra'], [/giraffe/i, 'giraffe'], [/lion/i, 'lion'], [/wildebeest/i, 'wildebeest'], [/fox/i, 'fox'], [/reindeer|caribou/i, 'reindeer'], [/owl/i, 'owl'], [/hare|rabbit/i, 'hare'], [/camel/i, 'camel'],
  [/scorpion/i, 'scorpion'], [/lizard/i, 'lizard'], [/fish/i, 'reeffish'], [/turtle/i, 'turtle'], [/octopus/i, 'octopus'], [/shark/i, 'shark'], [/puffer/i, 'pufferfish'], [/penguin/i, 'penguin'], [/polar bear/i, 'polarbear'],
  [/seal/i, 'seal'], [/whale/i, 'whale'], [/monkey/i, 'monkey'], [/mouse-deer|kancil|chevrotain/i, 'mousedeer'], [/falcon/i, 'falcon'], [/car\b/i, 'car'], [/cheetah/i, 'cheetah'], [/ostrich/i, 'ostrich'], [/bolt|sprinter/i, 'runner'], [/pupil|runner in year|child/i, 'pupil'], [/snail/i, 'snail'], [/bat\b/i, 'bat']];
const BY_EMOJI = { '🐘': 'elephant', '🦒': 'giraffe', '🐋': 'whale', '🐪': 'camel', '🦁': 'lion', '🦓': 'zebra', '🦬': 'wildebeest', '🐅': 'tiger', '🦧': 'orangutan', '🐦': 'hornbill', '🦋': 'butterfly', '🐸': 'frog', '🦊': 'fox', '🐇': 'hare', '🦉': 'owl', '🦌': 'reindeer', '🦂': 'scorpion', '🦎': 'lizard', '🐠': 'reeffish', '🐢': 'turtle', '🐙': 'octopus', '🦈': 'shark', '🐡': 'pufferfish', '🐧': 'penguin', '🐻‍❄️': 'polarbear', '🦭': 'seal', '🐗': 'pig', '🦅': 'falcon', '🚗': 'car', '🐆': 'cheetah', '🪶': 'ostrich', '🏃': 'runner', '🧒': 'pupil', '🐌': 'snail', '🦇': 'bat', '🐲': 'dragon', '✈️': 'plane', '🐒': 'monkey' };
/* The picture for an animal: by its name first (a hummingbird and a hornbill share an emoji), then by its emoji. */
export function creatureOf(d) {
  const name = (d && (d.name || d.title)) || '';
  for (const [re, k] of BY_NAME) if (re.test(name)) return k;
  return (d && BY_EMOJI[d.e || d.icon]) || '';
}
/* How wide each one is, as a share of its height (so a label or a tap can find it). */
export const WIDTH = { elephant: 1.5, giraffe: 1.0, zebra: 1.5, lion: 1.5, wildebeest: 1.4, tiger: 1.6, orangutan: 1.1, frog: 1.6, butterfly: 2.0, hornbill: 1.9, pig: 1.6, fox: 1.6, reindeer: 1.3, owl: 1.2, hare: 1.0, camel: 1.5, scorpion: 1.9, lizard: 2.2, reeffish: 1.5, turtle: 1.4, octopus: 1.0, shark: 2.6, pufferfish: 1.3, penguin: 0.8, polarbear: 1.6, seal: 2.4, whale: 3.0, falcon: 1.8, car: 1.9, cheetah: 2.0, ostrich: 0.9, runner: 0.6, pupil: 0.6, snail: 1.3, hummingbird: 1.5, bat: 1.5, dragon: 1.4, plane: 1.4, monkey: 1.3, mousedeer: 1.1 };
export const hasCreature = (k) => !!K[k];
/* Draw one creature with its middle at x, y, about `size` tall. See the top of the file for o. */
export function drawCreature(ctx, key, x, y, size, o) {
  const fn = K[key];
  if (!fn) return false;
  o = o || {};
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.lineJoin = 'round';
  fn(ctx, size, { ph: o.ph || 0, t: o.t || 0, rest: !!o.rest, tint: o.tint || '', sy: o.sy, glide: !!o.glide, run: !!o.run });
  ctx.restore();
  return true;
}
/* ---------------- creature pictures in the page (the picker, the chips, a card while its photo loads) ---------------- */
const pics = new Map();
/* A little canvas with one creature standing still, drawn once per size. */
export function creatureCanvas(key, px, o) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), k = key + '|' + px + '|' + ((o && o.tint) || '');
  let c = pics.get(k);
  if (c) return c;
  const wide = Math.max(1, WIDTH[key] || 1), size = px * Math.min(1, 2.2 / wide), w = Math.ceil(size * wide), h = Math.ceil(px * 1.1);
  c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  drawCreature(g, key, w / 2, h / 2, size * 0.9, { rest: true, t: 0.4, ph: 0.9, tint: o && o.tint });
  pics.set(k, c);
  if (pics.size > 80) pics.delete(pics.keys().next().value);
  return c;
}
/* Swap every emoji creature inside root (elements with class "cre") for its drawn picture. data-name picks the right one
   where two share an emoji (a hornbill and a hummingbird). */
export function swapCreatures(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('.cre').forEach((el) => {
    if (el.dataset.creDone) return;
    const key = creatureOf({ name: el.dataset.name || '', e: el.textContent.trim() });
    if (!key) return;
    const px = parseFloat(getComputedStyle(el).fontSize) || 24;
    const c = creatureCanvas(key, px * 1.15, { tint: el.dataset.tint || '' }).cloneNode(true);
    c.getContext('2d').drawImage(creatureCanvas(key, px * 1.15, { tint: el.dataset.tint || '' }), 0, 0);
    c.setAttribute('aria-hidden', 'true'); c.className = 'cre-pic';
    el.textContent = ''; el.appendChild(c); el.dataset.creDone = '1';
  });
}
