/* lkie.like maths drawings: exact diagrams drawn from the numbers the engine gives, for the slides on screen, in
   Present mode and in the PowerPoint (the same SVG is turned into a picture there).
   circle    the parts of a circle: centre, radius, diameter, circumference, chord, arc, sector, segment
   barmodel  bar models for ratio, sharing and fractions of amounts
   angles    angles on a straight line, around a point, in a triangle, vertically opposite, or one angle
   shape     rectangles, squares, triangles, parallelograms, trapeziums and L-shapes, with their measurements
   grid      coordinates in the first quadrant or all four, with points, a shape, its image and a mirror line
   pie       pie charts
   clock     an analogue clock (and the digital time)
   hundred   a hundred square for percentages and decimals
   array     an array of dots for multiplication
   Everything is checked hard (normMath) before it is drawn, because a wrong diagram teaches a wrong fact.
   On a dark slide (the Deep Sea look) the drawings are made in light colours straight onto the slide, with the parts of
   a circle always in the same colours (radius coral, diameter gold, circumference teal), as in the Chalkie deck. */

const FONT = 'Century Gothic, Avenir Next, Trebuchet MS, Arial, sans-serif';
const DAY = { night: false, ink: '#1B2440', soft: '#4A5468', line: '#C9D1E3', halo: '#FFFFFF', paper: '#FFFFFF', fill: '#FFFFFF', tri: '#F4F6FB', digi: '#1B2440', onK: '#FFFFFF', img: ['#FDF0E4', '#B9621C'], cols: ['#B9621C', '#357A4D', '#8466C4', '#A8436C'] };
const NIGHT = { night: true, ink: '#EEF3FF', soft: '#AFC0E6', line: 'rgba(255,255,255,0.2)', halo: '#22355C', paper: '', fill: 'rgba(255,255,255,0.07)', tri: 'rgba(255,255,255,0.08)', digi: '#0F1D3A', onK: '#10203F', img: ['rgba(246,160,77,0.3)', '#F6A04D'], cols: ['#F6A04D', '#7FD39A', '#B9A2F0', '#F08FB6'] };
const PART = { radius: '#F7906E', diameter: '#F7C04A', chord: '#C6D3F2', circumference: '#7FD8E6', arc: '#B9A2F0', centre: '#FFD37A' };   // night colours of the parts of a circle
let Z = DAY, INK = DAY.ink, SOFT = DAY.soft, LINE = DAY.line, BARE = false;        // set by mathSVG for one drawing, then put back
const mix = (hex, to, t) => { const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), ch = (n) => Math.round(((a >> n) & 255) * (1 - t) + ((b >> n) & 255) * t); return '#' + [16, 8, 0].map((n) => ch(n).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const rgba = (hex, al) => { const a = parseInt(hex.slice(1), 16); return 'rgba(' + ((a >> 16) & 255) + ',' + ((a >> 8) & 255) + ',' + (a & 255) + ',' + al + ')'; };
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const str = (v, n) => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/\s+/g, ' ').trim().slice(0, n || 24) : '');
const arr = (v) => (Array.isArray(v) ? v : []);
const r1 = (n) => Math.round(n * 10) / 10;
const escX = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (v) => Number(Number(v).toFixed(3)).toLocaleString('en-GB');

/* text with a halo in the background colour, so it reads over lines and fills */
function T(x, y, s, o) {
  o = o || {};
  return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + (o.size || 18) + '" fill="' + (o.fill || INK) + '" text-anchor="' + (o.anchor || 'middle') + '"' +
    (o.bold === false ? '' : ' font-weight="700"') + (o.italic ? ' font-style="italic"' : '') + (o.halo === false ? '' : ' stroke="' + Z.halo + '" stroke-width="5" stroke-linejoin="round" paint-order="stroke"') +
    ' font-family="' + FONT + '">' + escX(s) + '</text>';
}
const svg = (w, h, inner, label) => '<svg class="lk-dg lk-dg-m' + (Z.night ? ' night' : '') + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img"' + (label ? ' aria-label="' + escX(label) + '"' : '') + ' preserveAspectRatio="xMidYMid meet">' + (Z.paper ? '<rect width="' + w + '" height="' + h + '" fill="' + Z.paper + '"/>' : '') + inner + '</svg>';
const P = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];   // maths angles: anticlockwise from east
const pt = (p) => r1(p[0]) + ' ' + r1(p[1]);
const line = (a, b, o) => '<line x1="' + r1(a[0]) + '" y1="' + r1(a[1]) + '" x2="' + r1(b[0]) + '" y2="' + r1(b[1]) + '" stroke="' + ((o && o.c) || INK) + '" stroke-width="' + ((o && o.w) || 3) + '" stroke-linecap="round"' + (o && o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
const dot = (p, c, r) => '<circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="' + (r || 5) + '" fill="' + (c || INK) + '" stroke="' + Z.halo + '" stroke-width="2"/>';
/* an arc of a circle from angle a to angle b (anticlockwise), as a path */
function arcPath(cx, cy, r, a, b) {
  const s = P(cx, cy, r, a), e = P(cx, cy, r, b), large = ((b - a) % 360 + 360) % 360 > 180 ? 1 : 0;
  return 'M' + pt(s) + ' A' + r1(r) + ' ' + r1(r) + ' 0 ' + large + ' 0 ' + pt(e);
}
const arrowHead = (p, deg, c) => { const a = P(p[0], p[1], 12, deg + 150), b = P(p[0], p[1], 12, deg - 150); return '<path d="M' + pt(p) + ' L' + pt(a) + ' L' + pt(b) + ' Z" fill="' + c + '"/>'; };

/* ---------------- the circle ---------------- */
const CIRCLE_PARTS = ['centre', 'radius', 'diameter', 'circumference', 'chord', 'arc', 'sector', 'segment'];
function drawCircle(d, k, kd, kt) {
  const W = 440, H = 330, cx = 220, cy = 165, R = 118, hi = d.highlight, has = (p) => d.parts.includes(p), night = Z.night, B = BARE ? 1.6 : 1;
  // by day the part being taught is in the slide's colour; at night every part has its own colour and the one taught is thicker
  const col = (p) => (night ? PART[p] || INK : hi === p ? k : INK), wid = (p) => (hi === p ? 6 : 3.5) * B, labCol = (p) => (night ? PART[p] || INK : hi === p ? kd : INK);
  let s = night ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="rgba(110,160,255,0.13)"/>' : '', lab = '';
  if (has('sector')) { const a = P(cx, cy, R, 118), b = P(cx, cy, R, 168); s += '<path d="M' + cx + ' ' + cy + ' L' + pt(a) + ' A' + R + ' ' + R + ' 0 0 0 ' + pt(b) + ' Z" fill="' + (hi === 'sector' ? k : kt) + '" fill-opacity="' + (hi === 'sector' ? 0.55 : 1) + '"/>'; lab += T(P(cx, cy, R * 0.62, 143)[0], P(cx, cy, R * 0.62, 143)[1] + 6, 'sector', { size: 17, fill: kd }); }
  if (has('segment')) { const a = P(cx, cy, R, 205), b = P(cx, cy, R, 335); s += '<path d="M' + pt(a) + ' A' + R + ' ' + R + ' 0 0 0 ' + pt(b) + ' Z" fill="' + (hi === 'segment' ? k : kt) + '" fill-opacity="' + (hi === 'segment' ? 0.55 : 1) + '"/>'; lab += T(cx, cy + R * 0.86, 'segment', { size: 17, fill: kd }); }
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + (night ? PART.circumference : hi === 'circumference' ? k : INK) + '" stroke-width="' + (hi === 'circumference' ? 7 : 4) * B + '"/>';
  if (has('circumference')) {                                    // an arrow running round the outside, lower right, clear of the radius
    const ca = night ? PART.circumference : kd;
    s += '<path d="' + arcPath(cx, cy, R + 16, 290, 345) + '" fill="none" stroke="' + ca + '" stroke-width="' + 3 * B + '"/>' + arrowHead(P(cx, cy, R + 16, 345), 75, ca);
    lab += T(P(cx, cy, R + 22, 318)[0] + 6, P(cx, cy, R + 22, 318)[1] + 22, 'circumference', { size: 17, anchor: 'start', fill: ca });
  }
  if (has('arc')) { const ac = night ? PART.arc : hi === 'arc' ? k : kd; s += '<path d="' + arcPath(cx, cy, R, 118, 168) + '" fill="none" stroke="' + ac + '" stroke-width="9" stroke-linecap="round"/>'; lab += T(P(cx, cy, R + 26, 150)[0] - 10, P(cx, cy, R + 26, 150)[1], 'arc', { size: 17, anchor: 'end', fill: night ? ac : kd }); }
  if (has('chord')) { const a = P(cx, cy, R, 205), b = P(cx, cy, R, 335); s += line(a, b, { c: col('chord'), w: wid('chord') }) + dot(a, col('chord'), 4.5) + dot(b, col('chord'), 4.5); lab += T(cx, (a[1] + b[1]) / 2 + (has('diameter') ? 24 : -10), 'chord', { size: 17, fill: labCol('chord') }); }   // under the chord when a diameter label sits above it
  if (has('diameter')) {
    const a = [cx - R, cy], b = [cx + R, cy];
    s += line(a, b, { c: col('diameter'), w: wid('diameter') }) + dot(a, col('diameter'), 5 * B) + dot(b, col('diameter'), 5 * B);
    lab += T(cx - R * 0.45, cy + 26, 'diameter' + (d.diameter ? ' ' + d.diameter : ''), { size: 18, fill: labCol('diameter') });
  }
  const n = has('radius') ? d.radii : 0, angs = [52, 300, 230, 20, 100, 180].slice(0, n);
  angs.forEach((a, i) => {
    const e = P(cx, cy, R, a);
    s += line([cx, cy], e, { c: col('radius'), w: wid('radius') }) + dot(e, col('radius'), 4.5 * B);
    if (n === 1) {                                               // the name beside the line, on its lower side
      const m = P(cx, cy, R * 0.5, a), off = P(m[0], m[1], 16, a - 90);
      lab += T(off[0], off[1] + 12, 'radius' + (d.radius ? ' ' + d.radius : ''), { size: 18, anchor: 'start', fill: labCol('radius') });
    } else { const m = P(cx, cy, R * 0.55, a + (a > 90 && a < 270 ? -9 : 9)); lab += T(m[0], m[1] + 6, i === 0 && d.radius ? 'r = ' + d.radius : 'r', { size: 18, italic: true, fill: labCol('radius') }); }
  });
  if (has('centre') || n || has('diameter')) { s += dot([cx, cy], night ? PART.centre : k, (hi === 'centre' ? 9 : 6.5) * (BARE && hi === 'centre' ? 1.5 : 1)); if (has('centre')) lab += T(cx - 12, cy - 14, 'centre', { size: 16, anchor: 'end' }); }
  return svg(W, H, s + (BARE ? '' : lab), 'A circle showing ' + d.parts.join(', '));     // bare: a small drawing under a word card, with no labels
}

/* ---------------- bar model ---------------- */
function drawBars(d, k, kd, kt) {
  const n = d.bars.length, maxP = Math.max.apply(null, d.bars.map((b) => b.parts)), lw = Math.max(...d.bars.map((b) => b.label.length)) ? 128 : 16;
  const W = 640, top = n === 1 && d.total ? 62 : 18, bh = 54, gap = 22, right = n > 1 && d.total ? 96 : 20;
  const bw = Math.min(84, (W - lw - right - 10) / maxP), H = top + n * bh + (n - 1) * gap + 18;
  let s = '';
  d.bars.forEach((b, i) => {
    const y = top + i * (bh + gap);
    if (b.label) s += T(lw - 14, y + bh / 2 + 7, b.label, { size: 19, anchor: 'end' });
    for (let j = 0; j < b.parts; j++) {
      const x = lw + j * bw, on = b.shade == null ? true : j < b.shade;
      s += '<rect x="' + r1(x) + '" y="' + y + '" width="' + r1(bw) + '" height="' + bh + '" fill="' + (on ? (i % 2 ? kt : k) : Z.fill) + '" fill-opacity="' + (on && i % 2 === 0 ? 0.85 : 1) + '" stroke="' + INK + '" stroke-width="2.5"/>';
      const t = b.value != null ? b.value : d.part;
      if (t) s += T(x + bw / 2, y + bh / 2 + 7, t, { size: bw < 40 ? 15 : 19, fill: on && i % 2 === 0 ? Z.onK : INK, halo: false });
    }
  });
  if (d.total && n === 1) {
    const x0 = lw, x1 = lw + d.bars[0].parts * bw, y = top - 14;
    s += '<path d="M' + x0 + ' ' + (y + 8) + ' q0 -10 10 -10 H' + r1((x0 + x1) / 2 - 10) + ' q10 0 10 -10 q0 10 10 10 H' + r1(x1 - 10) + ' q10 0 10 10" fill="none" stroke="' + kd + '" stroke-width="3"/>' + T((x0 + x1) / 2, y - 18, d.total, { size: 20, fill: kd });
  } else if (d.total) {
    const x = lw + maxP * bw + 16, y0 = top, y1 = top + n * bh + (n - 1) * gap;
    s += '<path d="M' + x + ' ' + y0 + ' q10 0 10 10 V' + r1((y0 + y1) / 2 - 10) + ' q0 10 10 10 q-10 0 -10 10 V' + r1(y1 - 10) + ' q0 10 -10 10" fill="none" stroke="' + kd + '" stroke-width="3"/>' + T(x + 26, (y0 + y1) / 2 + 7, d.total, { size: 20, anchor: 'start', fill: kd });
  }
  return svg(W, H, s, 'A bar model');
}

/* ---------------- angles ---------------- */
function angleArc(c, a, b, rad, colr, label, labR) {
  const sweep = b - a;
  if (Math.abs(sweep - 90) < 0.01) {                           // a right angle: the little square
    const p1 = P(c[0], c[1], 22, a), p2 = P(c[0], c[1], 22 * Math.SQRT2, a + 45), p3 = P(c[0], c[1], 22, b);
    return '<path d="M' + pt(p1) + ' L' + pt(p2) + ' L' + pt(p3) + '" fill="none" stroke="' + colr + '" stroke-width="3"/>' + (label ? T(P(c[0], c[1], labR || 52, a + sweep / 2)[0], P(c[0], c[1], labR || 52, a + sweep / 2)[1] + 7, label, { size: 18, fill: colr }) : '');
  }
  const m = P(c[0], c[1], labR || rad + 26, a + sweep / 2);
  return '<path d="' + arcPath(c[0], c[1], rad, a, b) + '" fill="none" stroke="' + colr + '" stroke-width="3.5"/>' + (label ? T(m[0], m[1] + 7, label, { size: 18, fill: colr }) : '');
}
function drawAngles(d, k, kd) {
  const cols = [kd].concat(Z.cols);
  let s = '', W = 560, H = 300;
  const lab = (i) => d.labels[i] != null && d.labels[i] !== '' ? d.labels[i] : fmt(d.degrees[i]) + '°';
  if (d.kind === 'line' || d.kind === 'point') {
    const c = d.kind === 'line' ? [W / 2, 220] : [W / 2, H / 2], L = d.kind === 'line' ? 210 : 120;
    if (d.kind === 'line') { s += line([c[0] - L - 20, c[1]], [c[0] + L + 20, c[1]], { w: 4 }); }
    let a = 0;
    const rays = [0];
    d.degrees.forEach((deg, i) => { a += deg; if (i < d.degrees.length - 1 || d.kind === 'point') rays.push(a); });
    if (d.kind === 'point') rays.pop();
    rays.forEach((ang) => { if (d.kind === 'point' || (ang > 0.01 && ang < 179.99)) s += line(c, P(c[0], c[1], L, ang), { w: 4 }); });
    a = 0;
    d.degrees.forEach((deg, i) => { s += angleArc(c, a, a + deg, 36 + (i % 2) * 14, cols[i % cols.length], lab(i), deg < 40 ? 96 : 74); a += deg; });
    s += dot(c, INK, 5);
    if (d.kind === 'line') H = 260;
    return svg(W, H, s, 'Angles ' + (d.kind === 'line' ? 'on a straight line' : 'around a point'));
  }
  if (d.kind === 'triangle') {
    const [A, B] = d.degrees, rad = (x) => x * Math.PI / 180, base = 380;
    const h = base * Math.sin(rad(A)) * Math.sin(rad(B)) / Math.sin(rad(A + B)), px = base * Math.sin(rad(B)) * Math.cos(rad(A)) / Math.sin(rad(A + B));
    const sc = Math.min(1, 210 / h), x0 = (W - base * sc) / 2 - Math.min(0, px * sc) / 2, y0 = 255;
    const pA = [x0, y0], pB = [x0 + base * sc, y0], pC = [x0 + px * sc, y0 - h * sc];
    s += '<path d="M' + pt(pA) + ' L' + pt(pB) + ' L' + pt(pC) + ' Z" fill="' + Z.tri + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    const dir = (p, q) => Math.atan2(-(q[1] - p[1]), q[0] - p[0]) * 180 / Math.PI;
    const at = (p, q1, q2, i) => { let a1 = dir(p, q1), a2 = dir(p, q2); if (((a2 - a1) % 360 + 360) % 360 > 180) { const t = a1; a1 = a2; a2 = t; } if (a2 < a1) a2 += 360; return angleArc(p, a1, a2, 34, cols[i], lab(i), 64); };
    s += at(pA, pB, pC, 0) + at(pB, pC, pA, 1) + at(pC, pA, pB, 2);
    return svg(W, 280, s, 'A triangle with its angles');
  }
  if (d.kind === 'opposite') {
    const c = [W / 2, H / 2], a = d.degrees[0], L = 190;
    s += line(P(c[0], c[1], L, 0), P(c[0], c[1], L, 180), { w: 4 }) + line(P(c[0], c[1], L, a), P(c[0], c[1], L, a + 180), { w: 4 });
    const parts = [[0, a], [a, 180], [180, 180 + a], [180 + a, 360]];
    parts.forEach(([p, q], i) => { const l = d.labels[i] != null ? d.labels[i] : fmt(q - p) + '°'; if (l) s += angleArc(c, p, q, 34 + (i % 2) * 10, cols[i % 2 ? 1 : 0], l, (q - p) < 45 ? 92 : 70); });
    s += dot(c, INK, 5);
    return svg(W, H, s, 'Vertically opposite angles');
  }
  // one angle
  const c = [170, 230], a = d.degrees[0];
  s += line(c, P(c[0], c[1], 260, 0), { w: 4 }) + line(c, P(c[0], c[1], 220, a), { w: 4 }) + angleArc(c, 0, a, 48, kd, lab(0), a < 40 ? 110 : 84) + dot(c, INK, 5);
  return svg(W, 270, s, 'An angle of ' + fmt(a) + ' degrees');
}

/* ---------------- shapes with measurements ---------------- */
function sideLabel(a, b, text, out, size) {
  if (!text) return '';
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const nx = dy / len * out, ny = -dx / len * out;                    // to the outside of a shape drawn anticlockwise on screen
  return T(mx + nx, my + ny + 7, text, { size: size || 19 });
}
function drawShape(d, k, kd, kt) {
  const W = 600, H = 340, pad = 64, L = d.labels;
  let pts = [], s = '';
  const fit = (w, h) => Math.min((W - 2 * pad) / w, (H - 2 * pad) / h);
  if (d.shape === 'rectangle' || d.shape === 'square') {
    const w = d.shape === 'square' ? d.h || d.w : d.w, h = d.shape === 'square' ? w : d.h, c = fit(w, h), x0 = (W - w * c) / 2, y0 = (H + h * c) / 2;
    pts = [[x0, y0], [x0 + w * c, y0], [x0 + w * c, y0 - h * c], [x0, y0 - h * c]];
    s += '<path d="M' + pts.map(pt).join(' L') + ' Z" fill="' + kt + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    if (d.circles) {
      const dia = Math.min(h, w / d.circles) * c, gapX = (w * c - dia * d.circles) / (d.circles + 1);
      for (let i = 0; i < d.circles; i++) s += '<circle cx="' + r1(x0 + gapX * (i + 1) + dia * (i + 0.5)) + '" cy="' + r1(y0 - h * c / 2) + '" r="' + r1(dia / 2) + '" fill="' + Z.fill + '" stroke="' + kd + '" stroke-width="3"/>';
    }
    s += '<path d="M' + (x0 + 16) + ' ' + y0 + ' V' + (y0 - 16) + ' H' + x0 + '" fill="none" stroke="' + INK + '" stroke-width="2"/>';
    s += sideLabel(pts[0], pts[1], L.w || L.base, -26) + sideLabel(pts[3], pts[0], L.h || L.height, -30);
    if (d.shape === 'square' && !(L.h || L.height)) s += sideLabel(pts[1], pts[2], L.w, -30);
  } else if (d.shape === 'triangle') {
    const b = d.w, h = d.h, ax = clamp(d.apex, 0, 1), c = fit(b, h), x0 = (W - b * c) / 2, y0 = (H + h * c) / 2;
    pts = [[x0, y0], [x0 + b * c, y0], [x0 + ax * b * c, y0 - h * c]];
    s += '<path d="M' + pts.map(pt).join(' L') + ' Z" fill="' + kt + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    if (ax > 0.02 && ax < 0.98 && (L.height || L.h)) s += line(pts[2], [pts[2][0], y0], { c: kd, w: 3, dash: '8 7' }) + '<path d="M' + r1(pts[2][0]) + ' ' + (y0 - 14) + ' h14 v14" fill="none" stroke="' + kd + '" stroke-width="2"/>' + T(pts[2][0] + 10, y0 - h * c / 2 + 7, L.height || L.h, { size: 19, anchor: 'start', fill: kd });
    if (ax <= 0.02) s += '<path d="M' + (x0 + 16) + ' ' + y0 + ' V' + (y0 - 16) + ' H' + x0 + '" fill="none" stroke="' + INK + '" stroke-width="2"/>' + sideLabel(pts[2], pts[0], L.height || L.h, -30);
    s += sideLabel(pts[0], pts[1], L.base || L.w, -26) + sideLabel(pts[1], pts[2], L.right, -28) + (ax > 0.02 ? sideLabel(pts[2], pts[0], L.left, -28) : '');
  } else if (d.shape === 'parallelogram') {
    const b = d.w, h = d.h, sl = d.slant, c = fit(b + Math.abs(sl), h), x0 = (W - (b + sl) * c) / 2, y0 = (H + h * c) / 2;
    pts = [[x0, y0], [x0 + b * c, y0], [x0 + (b + sl) * c, y0 - h * c], [x0 + sl * c, y0 - h * c]];
    s += '<path d="M' + pts.map(pt).join(' L') + ' Z" fill="' + kt + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    if (L.height || L.h) s += line(pts[3], [pts[3][0], y0], { c: kd, w: 3, dash: '8 7' }) + '<path d="M' + r1(pts[3][0]) + ' ' + (y0 - 14) + ' h14 v14" fill="none" stroke="' + kd + '" stroke-width="2"/>' + T(pts[3][0] + 10, y0 - h * c / 2 + 7, L.height || L.h, { size: 19, anchor: 'start', fill: kd });
    s += sideLabel(pts[0], pts[1], L.base || L.w, -26) + sideLabel(pts[1], pts[2], L.side, -30);
  } else if (d.shape === 'trapezium') {
    const bot = d.w, top = d.top, h = d.h, c = fit(Math.max(bot, top), h), x0 = (W - bot * c) / 2, y0 = (H + h * c) / 2, off = (bot - top) / 2 * c;
    pts = [[x0, y0], [x0 + bot * c, y0], [x0 + bot * c - off, y0 - h * c], [x0 + off, y0 - h * c]];
    s += '<path d="M' + pts.map(pt).join(' L') + ' Z" fill="' + kt + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    if (L.height || L.h) s += line(pts[3], [pts[3][0], y0], { c: kd, w: 3, dash: '8 7' }) + T(pts[3][0] + 10, y0 - h * c / 2 + 7, L.height || L.h, { size: 19, anchor: 'start', fill: kd });
    s += sideLabel(pts[0], pts[1], L.base || L.w, -26) + sideLabel(pts[2], pts[3], L.top, -26);
  } else {                                                         // an L-shape: a w by h rectangle with a cw by ch corner cut from the top right
    const w = d.w, h = d.h, cw = d.cw, ch = d.ch, c = fit(w, h), x0 = (W - w * c) / 2, y0 = (H + h * c) / 2;
    pts = [[x0, y0], [x0 + w * c, y0], [x0 + w * c, y0 - (h - ch) * c], [x0 + (w - cw) * c, y0 - (h - ch) * c], [x0 + (w - cw) * c, y0 - h * c], [x0, y0 - h * c]];
    s += '<path d="M' + pts.map(pt).join(' L') + ' Z" fill="' + kt + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    const sides = arr(d.sides);
    for (let i = 0; i < 6; i++) s += sideLabel(pts[i], pts[(i + 1) % 6], sides[i], i === 2 ? 24 : -30, 18);   // the inner step's label sits inside, clear of the other inner side
  }
  return svg(W, H, s, 'A ' + d.shape + ' with its measurements');
}

/* ---------------- coordinates ---------------- */
function drawGrid(d, k, kd, kt) {
  const lo = d.min, hi = d.max, n = hi - lo, S = 380, pad = 34, u = (S - 2 * pad) / n;
  const X = (x) => pad + (x - lo) * u, Y = (y) => S - pad - (y - lo) * u;
  let s = '';
  for (let i = 0; i <= n; i++) {
    const v = lo + i;
    s += '<line x1="' + r1(X(v)) + '" y1="' + r1(Y(lo)) + '" x2="' + r1(X(v)) + '" y2="' + r1(Y(hi)) + '" stroke="' + LINE + '" stroke-width="1.4"/><line x1="' + r1(X(lo)) + '" y1="' + r1(Y(v)) + '" x2="' + r1(X(hi)) + '" y2="' + r1(Y(v)) + '" stroke="' + LINE + '" stroke-width="1.4"/>';
  }
  const ox = lo <= 0 ? 0 : lo, oy = ox;
  s += line([X(lo), Y(oy)], [X(hi) + 12, Y(oy)], { w: 2.6 }) + line([X(ox), Y(lo)], [X(ox), Y(hi) - 12], { w: 2.6 }) + arrowHead([X(hi) + 14, Y(oy)], 0, INK) + arrowHead([X(ox), Y(hi) - 14], 90, INK);
  const every = n > 12 ? 2 : 1;
  for (let v = lo; v <= hi; v++) {
    if (v === 0 && lo < 0) continue;
    if ((v - lo) % every) continue;
    s += T(X(v), Y(oy) + 22, String(v), { size: 13, bold: false }) + (v !== 0 ? T(X(ox) - 10, Y(v) + 5, String(v), { size: 13, bold: false, anchor: 'end' }) : '');
  }
  if (lo < 0) s += T(X(0) - 9, Y(0) + 19, '0', { size: 13, bold: false, anchor: 'end' });
  else s += T(X(0) - 8, Y(0) + 20, '0', { size: 13, bold: false, anchor: 'end' });
  s += T(X(hi) + 10, Y(oy) - 10, 'x', { size: 16, italic: true }) + T(X(ox) + 14, Y(hi) - 4, 'y', { size: 16, italic: true });
  if (d.mirror) {
    const m = d.mirror === 'x' ? [[X(lo), Y(0)], [X(hi), Y(0)]] : d.mirror === 'y' ? [[X(0), Y(lo)], [X(0), Y(hi)]] : [[X(Math.max(lo, lo)), Y(lo)], [X(hi), Y(hi)]];
    s += line(m[0], m[1], { c: '#D9628F', w: 3.5, dash: '10 8' });
  }
  const poly = (ps, fill, stroke, dash) => '<path d="M' + ps.map((p) => r1(X(p[0])) + ' ' + r1(Y(p[1]))).join(' L') + ' Z" fill="' + fill + '" fill-opacity=".55" stroke="' + stroke + '" stroke-width="3" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="8 6"' : '') + '/>';
  if (d.shape.length) s += poly(d.shape, kt, kd);
  if (d.image.length) s += poly(d.image, Z.img[0], Z.img[1], true);
  d.points.forEach((p) => { s += dot([X(p.x), Y(p.y)], k, 6) + (p.label ? T(X(p.x) + 10, Y(p.y) - 10, p.label + (d.showXY ? ' (' + fmt(p.x) + ', ' + fmt(p.y) + ')' : ''), { size: 16, anchor: 'start', fill: kd }) : ''); });
  return svg(S + 10, S, s, 'A coordinate grid');
}

/* ---------------- pie chart ---------------- */
const PIE = ['#3E7CC7', '#F28C38', '#4FA36B', '#D9628F', '#8466C4', '#E0A526', '#2D9C9C', '#E35D5B'];
function drawPie(d) {
  const W = 600, H = 320, cx = 170, cy = 168, R = 128, total = d.slices.reduce((a, b) => a + b.value, 0);
  let s = d.title ? T(W / 2, 26, d.title, { size: 19 }) : '', a = 90;
  d.slices.forEach((sl, i) => {
    const sweep = sl.value / total * 360, b = a - sweep, c = PIE[i % PIE.length];
    if (d.slices.length === 1 || sweep >= 359.99) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + c + '" stroke="' + Z.halo + '" stroke-width="3"/>';
    else { const p1 = P(cx, cy, R, a), p2 = P(cx, cy, R, b); s += '<path d="M' + cx + ' ' + cy + ' L' + pt(p1) + ' A' + R + ' ' + R + ' 0 ' + (sweep > 180 ? 1 : 0) + ' 1 ' + pt(p2) + ' Z" fill="' + c + '" stroke="' + Z.halo + '" stroke-width="3"/>'; }
    if (sweep > 22) { const m = P(cx, cy, R * 0.64, a - sweep / 2); s += T(m[0], m[1] + 6, d.show === 'value' ? fmt(sl.value) : fmt(Math.round(sl.value / total * 1000) / 10) + '%', { size: 16, fill: '#FFFFFF', halo: false }); }
    const ly = 74 + i * 30;
    s += '<rect x="340" y="' + (ly - 15) + '" width="20" height="20" rx="5" fill="' + c + '"/>' + T(370, ly + 1, sl.label + ' (' + (d.show === 'value' ? fmt(sl.value) : fmt(Math.round(sl.value / total * 1000) / 10) + '%') + ')', { size: 16, anchor: 'start', bold: false });
    a = b;
  });
  return svg(W, Math.max(H, 74 + d.slices.length * 30), s, 'A pie chart');
}

/* ---------------- clock ---------------- */
function drawClock(d, k, kd) {
  const W = 340, H = d.digital ? 360 : 320, cx = 170, cy = 160, R = 132;
  let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + Z.fill + '" stroke="' + INK + '" stroke-width="6"/>';
  for (let i = 0; i < 60; i++) { const big = i % 5 === 0, a = 90 - i * 6; s += line(P(cx, cy, R - 6, a), P(cx, cy, R - (big ? 20 : 12), a), { w: big ? 3.5 : 1.6, c: big ? INK : SOFT }); }
  for (let h = 1; h <= 12; h++) { const p = P(cx, cy, R - 40, 90 - h * 30); s += T(p[0], p[1] + 8, String(h), { size: 24, halo: false }); }
  const hrs = (d.h % 12) + d.m / 60, ha = 90 - hrs * 30, ma = 90 - d.m * 6;
  s += line([cx, cy], P(cx, cy, R * 0.5, ha), { w: 9, c: INK }) + line([cx, cy], P(cx, cy, R * 0.78, ma), { w: 6, c: kd }) + dot([cx, cy], kd, 8);
  if (d.digital) s += '<rect x="' + (cx - 62) + '" y="' + (H - 46) + '" width="124" height="38" rx="9" fill="' + Z.digi + '"/>' + T(cx, H - 19, String(d.h).padStart(d.h >= 10 ? 2 : 1, '0') + ':' + String(d.m).padStart(2, '0'), { size: 24, fill: '#FFFFFF', halo: false });
  return svg(W, H, s, 'A clock showing ' + d.h + ':' + String(d.m).padStart(2, '0'));
}

/* ---------------- hundred square and array ---------------- */
function drawHundred(d, k, kd) {
  const S = 300, c = 26, x0 = (S + 40 - c * 10) / 2, y0 = 14;
  let s = '';
  for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), q = i % 10; s += '<rect x="' + (x0 + q * c) + '" y="' + (y0 + r * c) + '" width="' + c + '" height="' + c + '" fill="' + (i < d.shaded ? k : Z.fill) + '" stroke="' + INK + '" stroke-width="1.4"/>'; }
  s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (c * 10) + '" height="' + (c * 10) + '" fill="none" stroke="' + INK + '" stroke-width="3"/>';
  if (d.label) s += T((S + 40) / 2, y0 + c * 10 + 34, d.label, { size: 20, fill: kd });
  return svg(S + 40, y0 + c * 10 + (d.label ? 50 : 16), s, d.shaded + ' out of 100 shaded');
}
function drawArray(d, k, kd) {
  const g = Math.min(46, 520 / d.cols, 230 / d.rows), W = Math.max(300, d.cols * g + 60), x0 = (W - d.cols * g) / 2 + g / 2, y0 = 20 + g / 2;
  let s = '';
  for (let r = 0; r < d.rows; r++) for (let q = 0; q < d.cols; q++) s += '<circle cx="' + r1(x0 + q * g) + '" cy="' + r1(y0 + r * g) + '" r="' + r1(g * 0.32) + '" fill="' + (r % 2 ? kd : k) + '"/>';
  const H = 20 + d.rows * g + (d.label ? 44 : 10);
  if (d.label) s += T(W / 2, H - 14, d.label, { size: 20, fill: kd });
  return svg(W, H, s, d.rows + ' rows of ' + d.cols);
}

/* ---------------- checking what the engine sent ---------------- */
const KINDS = ['line', 'point', 'triangle', 'opposite', 'single'];
const SHAPES = ['rectangle', 'square', 'triangle', 'parallelogram', 'trapezium', 'lshape'];
const close = (a, b) => Math.abs(a - b) < 0.6;
export function normMath(d) {
  const t = String(d.type || '').toLowerCase();
  if (t === 'circle') {
    const parts = arr(d.parts).map((p) => String(p).toLowerCase().replace('center', 'centre')).filter((p) => CIRCLE_PARTS.includes(p));
    const hl = String(d.highlight || '').toLowerCase().replace('center', 'centre');
    return { type: t, parts: parts.length ? Array.from(new Set(parts)) : ['centre', 'radius', 'diameter'], radius: str(d.radius, 14), diameter: str(d.diameter, 14), radii: clamp(Math.round(num(d.radii, 1)), 1, 6), highlight: CIRCLE_PARTS.includes(hl) ? hl : '' };
  }
  if (t === 'barmodel') {
    const bars = arr(d.bars).slice(0, 4).map((b) => ({ label: str(b && b.label, 16), parts: Math.round(num(b && b.parts, 0)), shade: b && b.shade != null ? Math.round(num(b.shade, -1)) : null, value: b && b.value != null ? str(b.value, 8) : null }))
      .filter((b) => b.parts >= 1 && b.parts <= 12).map((b) => (b.shade != null && (b.shade < 0 || b.shade > b.parts) ? Object.assign(b, { shade: null }) : b));
    return bars.length ? { type: t, bars, part: str(d.part, 8), total: str(d.total, 12) } : null;
  }
  if (t === 'angles') {
    const kind = KINDS.includes(String(d.kind)) ? String(d.kind) : 'single', deg = arr(d.degrees).map((x) => num(x, NaN)).filter((x) => Number.isFinite(x) && x > 0);
    const labels = arr(d.labels).map((x) => str(x, 8)).slice(0, 5);
    if (kind === 'line' && !(deg.length >= 2 && deg.length <= 3 && close(deg.reduce((a, b) => a + b, 0), 180))) return null;
    if (kind === 'point' && !(deg.length >= 2 && deg.length <= 5 && close(deg.reduce((a, b) => a + b, 0), 360))) return null;
    if (kind === 'triangle' && !(deg.length === 3 && close(deg.reduce((a, b) => a + b, 0), 180) && deg.every((x) => x >= 10))) return null;
    if (kind === 'opposite' && !(deg.length >= 1 && deg[0] > 10 && deg[0] < 170)) return null;
    if (kind === 'single' && !(deg.length >= 1 && deg[0] < 360)) return null;
    return { type: t, kind, degrees: kind === 'opposite' || kind === 'single' ? deg.slice(0, 1) : deg, labels };
  }
  if (t === 'shape') {
    const shape = SHAPES.includes(String(d.shape)) ? String(d.shape) : null;
    if (!shape) return null;
    const w = num(d.w != null ? d.w : d.base, 0), h = num(d.h != null ? d.h : d.height, 0), L = d.labels && typeof d.labels === 'object' && !Array.isArray(d.labels) ? d.labels : {};
    const labels = {}; ['w', 'h', 'base', 'height', 'left', 'right', 'top', 'side'].forEach((x) => { if (L[x] != null) labels[x] = str(L[x], 12); });
    const o = { type: t, shape, w, h, labels };
    if (shape === 'square') { o.w = o.h = w || h; if (!(o.w > 0)) return null; }
    else if (!(w > 0 && h > 0 && w / h < 8 && h / w < 8)) return null;
    if (shape === 'rectangle' || shape === 'square') o.circles = clamp(Math.round(num(d.circles, 0)), 0, 4);
    if (shape === 'triangle') o.apex = clamp(num(d.apex, 0.5), 0, 1);
    if (shape === 'parallelogram') o.slant = clamp(num(d.slant, w * 0.3), -w, w);
    if (shape === 'trapezium') { o.top = num(d.top, 0); if (!(o.top > 0 && o.top < w)) return null; }
    if (shape === 'lshape') { o.cw = num(d.cw, 0); o.ch = num(d.ch, 0); if (!(o.cw > 0 && o.cw < w && o.ch > 0 && o.ch < h)) return null; o.sides = arr(d.sides).map((x) => str(x, 10)).slice(0, 6); }
    return o;
  }
  if (t === 'grid') {
    let lo = Math.round(num(d.min, 0)), hi = Math.round(num(d.max, 10));
    if (hi <= lo || hi - lo > 20 || lo < -10 || hi > 20) return null;
    const inG = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= lo && x <= hi && y >= lo && y <= hi;
    const pts = (v) => arr(v).map((p) => (Array.isArray(p) ? [num(p[0], NaN), num(p[1], NaN)] : [num(p && p.x, NaN), num(p && p.y, NaN)])).filter((p) => inG(p[0], p[1])).slice(0, 8);
    const points = arr(d.points).map((p) => ({ x: num(p && p.x, NaN), y: num(p && p.y, NaN), label: str(p && p.label, 4) })).filter((p) => inG(p.x, p.y)).slice(0, 8);
    const shape = pts(d.shape), image = pts(d.image), mirror = ['x', 'y', 'y=x'].includes(String(d.mirror)) ? String(d.mirror) : '';
    if (!points.length && shape.length < 3) return null;
    return { type: t, min: lo, max: hi, points, shape: shape.length >= 3 ? shape : [], image: image.length >= 3 ? image : [], mirror, showXY: !!d.showXY };
  }
  if (t === 'pie') {
    const slices = arr(d.slices).map((x) => ({ label: str(x && x.label, 18), value: num(x && x.value, NaN) })).filter((x) => x.label && Number.isFinite(x.value) && x.value > 0).slice(0, 8);
    return slices.length >= 2 ? { type: t, title: str(d.title, 50), slices, show: d.show === 'value' ? 'value' : 'percent' } : null;
  }
  if (t === 'clock') {
    const h = Math.round(num(d.h, NaN)), m = Math.round(num(d.m, 0));
    return h >= 0 && h <= 23 && m >= 0 && m <= 59 ? { type: t, h, m, digital: d.digital !== false } : null;
  }
  if (t === 'hundred') { const sh = Math.round(num(d.shaded, -1)); return sh >= 0 && sh <= 100 ? { type: t, shaded: sh, label: str(d.label, 30) } : null; }
  if (t === 'array') { const rows = Math.round(num(d.rows, 0)), cols = Math.round(num(d.cols, 0)); return rows >= 1 && rows <= 12 && cols >= 1 && cols <= 12 ? { type: t, rows, cols, label: str(d.label, 24) } : null; }
  return null;
}
export const MATH_TYPES = ['circle', 'barmodel', 'angles', 'shape', 'grid', 'pie', 'clock', 'hundred', 'array'];
/* o.night: light colours for a dark slide, with no white paper behind; o.bare: no labels (a small drawing on a word card) */
export function mathSVG(d, tone, o) {
  o = o || {};
  let [k, kd, kt] = tone;
  if (o.night) { kt = rgba(k, 0.3); kd = mix(k, '#FFFFFF', 0.55); k = mix(k, '#FFFFFF', 0.25); }
  Z = o.night ? NIGHT : DAY; INK = Z.ink; SOFT = Z.soft; LINE = Z.line; BARE = !!o.bare;
  try { return drawOne(d, k, kd, kt); } finally { Z = DAY; INK = DAY.ink; SOFT = DAY.soft; LINE = DAY.line; BARE = false; }
}
function drawOne(d, k, kd, kt) {
  switch (d.type) {
    case 'circle': return drawCircle(d, k, kd, kt);
    case 'barmodel': return drawBars(d, k, kd, kt);
    case 'angles': return drawAngles(d, k, kd, kt);
    case 'shape': return drawShape(d, k, kd, kt);
    case 'grid': return drawGrid(d, k, kd, kt);
    case 'pie': return drawPie(d, k, kd, kt);
    case 'clock': return drawClock(d, k, kd, kt);
    case 'hundred': return drawHundred(d, k, kd, kt);
    case 'array': return drawArray(d, k, kd, kt);
    default: return '';
  }
}
/* What the engine is told it may draw (one line each, with the exact shape). */
export const MATH_FORMATS = [
  '{"type":"circle","parts":["centre","radius","diameter","circumference"],"radius":"7 cm","diameter":"14 cm","radii":1,"highlight":"diameter"}  (parts from: centre, radius, diameter, circumference, chord, arc, sector, segment; radii 1 to 6 draws that many radii; radius and diameter are labels such as "7 cm" or "?")',
  '{"type":"barmodel","bars":[{"label":"Boys","parts":2},{"label":"Girls","parts":3}],"part":"4","total":"20"}  (bar models for ratio and sharing: equal boxes, "part" is written in each box (a number or "?"), "total" on a brace; one bar with "shade" shows a fraction of an amount, for example {"label":"40 sweets","parts":5,"shade":3})',
  '{"type":"angles","kind":"line","degrees":[130,50],"labels":["130°","a"]}  (kind: line (2 or 3 angles making 180), point (2 to 5 angles making 360), triangle (3 angles making 180), opposite (one angle where two lines cross; labels for the 4 angles), single (one angle); degrees are exact; a label replaces the number, for example "a" or "?")',
  '{"type":"shape","shape":"rectangle","w":8,"h":5,"labels":{"w":"8 cm","h":"5 cm"},"circles":0}  (shape: rectangle, square, triangle (w = base, h = height, apex 0 to 1 along the base, 0 is a right angle), parallelogram (slant), trapezium (top), lshape (cw and ch cut from the top right, sides: 6 labels anticlockwise from the bottom); labels: w, h, base, height, left, right, top, side; circles: 1 to 4 equal circles in a row inside a rectangle)',
  '{"type":"grid","min":-5,"max":5,"points":[{"x":2,"y":3,"label":"A"}],"shape":[[1,1],[4,1],[4,3]],"image":[[-1,1],[-4,1],[-4,3]],"mirror":"y"}  (coordinates: min 0 for the first quadrant only; shape and image are corners in order; mirror x, y or y=x)',
  '{"type":"pie","title":"Favourite fruit","slices":[{"label":"Mango","value":12},{"label":"Durian","value":6}],"show":"percent"}  (2 to 8 slices)',
  '{"type":"clock","h":3,"m":25,"digital":true}',
  '{"type":"hundred","shaded":35,"label":"35% = 0.35"}  (a hundred square)',
  '{"type":"array","rows":3,"cols":4,"label":"3 × 4 = 12"}'
].join('\n');
