/* Engine 1: Maths reasoning. "Which one doesn't belong?" grid + an Open Middle puzzle the class can try live.
   The Open Middle board checks answers itself and finds the best answer by trying every possibility. */
import { esc, str, arr, strs, num, clamp, icon } from '../core.js?v=51f31f48';
import { B, respond } from './shared.js?v=51f31f48';
import { buildPrompt } from './prompt.js?v=51f31f48';

/* ---------------- visuals for the grid ---------------- */
function poly(n, cx, cy, r, rot) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (rot || -Math.PI / 2) + (i * 2 * Math.PI) / n; pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
  return '<polygon class="vf" points="' + pts.join(' ') + '"/>';
}
const SHAPES = {
  'triangle': () => poly(3, 100, 68, 52), 'equilateral triangle': () => poly(3, 100, 68, 52),
  'right-angled triangle': () => '<polygon class="vf" points="55,108 55,18 150,108"/><polyline class="vs" points="55,96 67,96 67,108"/>',
  'right triangle': () => SHAPES['right-angled triangle'](),
  'isosceles triangle': () => '<polygon class="vf" points="100,12 138,108 62,108"/>',
  'scalene triangle': () => '<polygon class="vf" points="40,108 85,22 168,108"/>',
  'square': () => '<rect class="vf" x="55" y="15" width="90" height="90" rx="2"/>',
  'rectangle': () => '<rect class="vf" x="30" y="30" width="140" height="62" rx="2"/>', 'oblong': () => SHAPES.rectangle(),
  'rhombus': () => '<polygon class="vf" points="100,10 150,60 100,110 50,60"/>',
  'parallelogram': () => '<polygon class="vf" points="40,100 70,22 165,22 135,100"/>',
  'trapezium': () => '<polygon class="vf" points="35,100 70,25 130,25 165,100"/>', 'trapezoid': () => SHAPES.trapezium(),
  'kite': () => '<polygon class="vf" points="100,8 140,46 100,112 60,46"/>',
  'pentagon': () => poly(5, 100, 62, 52), 'hexagon': () => poly(6, 100, 60, 52), 'heptagon': () => poly(7, 100, 60, 52),
  'octagon': () => poly(8, 100, 60, 52, -Math.PI / 8), 'nonagon': () => poly(9, 100, 60, 52), 'decagon': () => poly(10, 100, 60, 52),
  'circle': () => '<circle class="vf" cx="100" cy="60" r="50"/>',
  'semicircle': () => '<path class="vf" d="M45 85 A55 55 0 0 1 155 85 Z"/>',
  'oval': () => '<ellipse class="vf" cx="100" cy="60" rx="70" ry="42"/>', 'ellipse': () => SHAPES.oval(),
  'star': () => { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 54, a = -Math.PI / 2 + (i * Math.PI) / 5; p.push((100 + r * Math.cos(a)).toFixed(1) + ',' + (62 + r * Math.sin(a)).toFixed(1)); } return '<polygon class="vf" points="' + p.join(' ') + '"/>'; },
  'cube': () => '<polygon class="vf" points="60,40 120,40 120,100 60,100"/><polygon class="vf" points="60,40 85,18 145,18 120,40"/><polygon class="vf" points="120,40 145,18 145,78 120,100"/>',
  'cuboid': () => '<polygon class="vf" points="40,45 130,45 130,100 40,100"/><polygon class="vf" points="40,45 65,22 155,22 130,45"/><polygon class="vf" points="130,45 155,22 155,77 130,100"/>',
  'cylinder': () => '<path class="vf" d="M60 25 V95 A40 13 0 0 0 140 95 V25"/><ellipse class="vf" cx="100" cy="25" rx="40" ry="13"/>',
  'cone': () => '<path class="vf" d="M100 10 L58 92 A42 14 0 0 0 142 92 Z"/><path class="vs" d="M58 92 A42 14 0 0 1 142 92" stroke-dasharray="4 5"/>',
  'sphere': () => '<circle class="vf" cx="100" cy="60" r="48"/><ellipse class="vs" cx="100" cy="60" rx="48" ry="14" stroke-dasharray="4 5"/>',
  'square-based pyramid': () => '<polygon class="vf" points="45,92 120,92 100,15"/><polygon class="vf" points="120,92 155,75 100,15"/><path class="vs" d="M45 92 L80 75 L155 75 M80 75 L100 15" stroke-dasharray="4 5"/>',
  'pyramid': () => SHAPES['square-based pyramid'](),
  'triangular prism': () => '<polygon class="vf" points="40,95 70,40 100,95"/><polygon class="vf" points="70,40 145,25 175,80 100,95"/><path class="vs" d="M40 95 L115 80 L175 80 M115 80 L145 25" stroke-dasharray="4 5"/>'
};
function fractionVis(nm, dn, model) {
  dn = clamp(Math.round(dn) || 1, 1, 24); nm = clamp(Math.round(nm) || 0, 0, dn * 3);
  if (model === 'circle') {
    if (dn === 1) return '<circle class="' + (nm ? 'vf' : 've') + '" cx="100" cy="60" r="52"/>';
    let h = '';
    for (let i = 0; i < dn; i++) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / dn, a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / dn;
      const x0 = 100 + 52 * Math.cos(a0), y0 = 60 + 52 * Math.sin(a0), x1 = 100 + 52 * Math.cos(a1), y1 = 60 + 52 * Math.sin(a1);
      h += '<path class="' + (i < nm ? 'vf' : 've') + '" d="M100 60 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A52 52 0 ' + (1 / dn > 0.5 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z"/>';
    }
    return h;
  }
  const wholes = Math.max(1, Math.ceil(nm / dn));
  const bw = 176, bh = wholes > 1 ? Math.min(34, 92 / wholes) : 46, gap = 8;
  let h = '', y = (120 - (wholes * bh + (wholes - 1) * gap)) / 2;
  for (let wI = 0; wI < wholes; wI++) {
    for (let i = 0; i < dn; i++) h += '<rect class="' + (wI * dn + i < nm ? 'vf' : 've') + '" x="' + (12 + (i * bw) / dn).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw / dn).toFixed(1) + '" height="' + bh.toFixed(1) + '"/>';
    y += bh + gap;
  }
  return h;
}
function arrayVis(rows, cols) {
  rows = clamp(Math.round(rows) || 1, 1, 12); cols = clamp(Math.round(cols) || 1, 1, 12);
  const s = Math.min(170 / cols, 104 / rows), r = s * 0.32;
  const x0 = 100 - (cols - 1) * s / 2, y0 = 60 - (rows - 1) * s / 2;
  let h = '';
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) h += '<circle class="vd" cx="' + (x0 + j * s).toFixed(1) + '" cy="' + (y0 + i * s).toFixed(1) + '" r="' + r.toFixed(1) + '"/>';
  return h;
}
function clockVis(hh, mm) {
  hh = (Math.round(hh) || 0) % 12; mm = clamp(Math.round(mm) || 0, 0, 59);
  let h = '<circle class="ve" cx="100" cy="60" r="54"/>';
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; h += '<line class="vs" x1="' + (100 + 46 * Math.sin(a)).toFixed(1) + '" y1="' + (60 - 46 * Math.cos(a)).toFixed(1) + '" x2="' + (100 + 52 * Math.sin(a)).toFixed(1) + '" y2="' + (60 - 52 * Math.cos(a)).toFixed(1) + '"/>'; }
  const am = (mm * Math.PI) / 30, ah = ((hh + mm / 60) * Math.PI) / 6;
  h += '<line class="vh" x1="100" y1="60" x2="' + (100 + 27 * Math.sin(ah)).toFixed(1) + '" y2="' + (60 - 27 * Math.cos(ah)).toFixed(1) + '" style="stroke-width:5"/>';
  h += '<line class="vh" x1="100" y1="60" x2="' + (100 + 42 * Math.sin(am)).toFixed(1) + '" y2="' + (60 - 42 * Math.cos(am)).toFixed(1) + '"/><circle class="vd" cx="100" cy="60" r="4"/>';
  return h;
}
function angleVis(deg) {
  deg = clamp(num(deg, 45), 1, 359);
  const a = (deg * Math.PI) / 180, x = 70, y = 95, L = 95;
  const ex = x + L * Math.cos(-a), ey = y + L * Math.sin(-a);
  const r = 24, ax = x + r * Math.cos(-a), ay = y + r * Math.sin(-a);
  return '<line class="vs" x1="' + x + '" y1="' + y + '" x2="' + (x + L) + '" y2="' + y + '"/><line class="vs" x1="' + x + '" y1="' + y + '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '"/>' +
    (deg === 90 ? '<polyline class="vs" points="' + x + ',' + (y - 16) + ' ' + (x + 16) + ',' + (y - 16) + ' ' + (x + 16) + ',' + y + '"/>' : '<path class="vs" d="M' + (x + r) + ' ' + y + ' A' + r + ' ' + r + ' 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + ax.toFixed(1) + ' ' + ay.toFixed(1) + '"/>');
}
function lineVis(from, to, mark) {
  from = num(from, 0); to = num(to, 10); if (to <= from) to = from + 10;
  const steps = 10, X = (v) => 15 + ((v - from) / (to - from)) * 170;
  let h = '<line class="vs" x1="15" y1="70" x2="185" y2="70"/>';
  for (let i = 0; i <= steps; i++) { const v = from + ((to - from) * i) / steps; h += '<line class="vs" x1="' + X(v).toFixed(1) + '" y1="62" x2="' + X(v).toFixed(1) + '" y2="78"/>'; }
  h += '<text class="vt" x="15" y="100" text-anchor="middle">' + esc(String(from)) + '</text><text class="vt" x="185" y="100" text-anchor="middle">' + esc(String(to)) + '</text>';
  if (mark != null && Number.isFinite(Number(mark))) h += '<path class="vd" d="M' + X(Number(mark)).toFixed(1) + ' 58 l-7 -14 h14 z"/>';
  return h;
}
export function visualSVG(v) {
  if (!v || !v.kind || v.kind === 'none') return '';
  let inner = '';
  if (v.kind === 'fraction') inner = fractionVis(v.num, v.den, v.model);
  else if (v.kind === 'array') inner = arrayVis(v.rows, v.cols);
  else if (v.kind === 'shape') inner = (SHAPES[str(v.name).toLowerCase()] || SHAPES.circle)();
  else if (v.kind === 'clock') inner = clockVis(v.h, v.m);
  else if (v.kind === 'angle') inner = angleVis(v.deg);
  else if (v.kind === 'numberline') inner = lineVis(v.from, v.to, v.mark);
  if (!inner) return '';
  return '<svg class="vis" viewBox="0 0 200 120" aria-hidden="true">' + inner + '</svg>';
}
function normVisual(v) {
  if (!v || typeof v !== 'object') return { kind: 'none' };
  const k = str(v.kind).toLowerCase();
  if (k === 'fraction') return { kind: 'fraction', num: num(v.num, 1), den: num(v.den, 2), model: v.model === 'circle' ? 'circle' : 'bar' };
  if (k === 'array') return { kind: 'array', rows: num(v.rows, 2), cols: num(v.cols, 3) };
  if (k === 'shape') return { kind: 'shape', name: str(v.name).toLowerCase() || 'circle' };
  if (k === 'clock') return { kind: 'clock', h: num(v.h, 3), m: num(v.m, 0) };
  if (k === 'angle') return { kind: 'angle', deg: num(v.deg, 45) };
  if (k === 'numberline') return { kind: 'numberline', from: num(v.from, 0), to: num(v.to, 10), mark: v.mark };
  return { kind: 'none' };
}

/* ---------------- Open Middle: parsing, exact fractions, checking ---------------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
const R = (n, d) => { if (d === 0) return null; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d), subR = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => R(a.n * b.n, a.d * b.d), div = (a, b) => (b.n === 0 ? null : R(a.n * b.d, a.d * b.n));

export function tokenize(expr) {
  const s = String(expr || '').replace(/□|▢|☐|\[\s*\]/g, '#').replace(/[−–]/g, '-').replace(/[x*]/gi, (m) => (m === '*' || m.toLowerCase() === 'x' ? '×' : m));
  const toks = []; let boxes = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/\s/.test(ch)) continue;
    if (ch === '#' || /[0-9.]/.test(ch)) {
      let last = toks[toks.length - 1];
      if (!last || last.t !== 'num') { last = { t: 'num', parts: [] }; toks.push(last); }
      if (ch === '#') last.parts.push({ box: boxes++ }); else last.parts.push({ ch });
      continue;
    }
    if ('+-×÷/()='.includes(ch)) { toks.push({ t: 'op', v: ch }); continue; }
    return null;                                    // something we cannot check
  }
  return { toks, boxes };
}
function numVal(tok, vals) {
  let s = '';
  for (const p of tok.parts) { if (p.box != null) { const v = vals[p.box]; if (v == null || v === '') return undefined; s += v; } else s += p.ch; }
  if ((s.match(/\./g) || []).length > 1) return null;
  const intPart = s.split('.')[0];
  if (intPart.length > 1 && intPart[0] === '0') return 'lead';
  if (s.includes('.')) { const [a, b] = s.split('.'); const d = Math.pow(10, b.length); return R(Number((a || '0') + b), d); }
  return R(Number(s), 1);
}
function evalToks(toks, vals) {
  let i = 0, bad = null;
  const peek = () => toks[i];
  function factor() {
    const t = peek();
    if (!t) { bad = 'syntax'; return null; }
    if (t.t === 'op' && t.v === '(') { i++; const v = expr(); if (!peek() || peek().v !== ')') { bad = 'syntax'; return null; } i++; return v; }
    if (t.t === 'op' && t.v === '-') { i++; const v = factor(); return v && R(-v.n, v.d); }
    if (t.t === 'num') { i++; const v = numVal(t, vals); if (v === undefined) { bad = bad || 'empty'; return null; } if (v === 'lead') { bad = 'lead'; return null; } return v; }
    bad = 'syntax'; return null;
  }
  function term() {
    let v = factor();
    while (peek() && peek().t === 'op' && '×÷/'.includes(peek().v)) { const op = toks[i++].v; const w = factor(); if (!v || !w) return null; v = op === '×' ? mul(v, w) : div(v, w); if (!v) { bad = bad || 'div0'; return null; } }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() && peek().t === 'op' && '+-'.includes(peek().v)) { const op = toks[i++].v; const w = term(); if (!v || !w) return null; v = op === '+' ? add(v, w) : subR(v, w); }
    return v;
  }
  const v = expr();
  if (i < toks.length) bad = bad || 'syntax';
  return { v: bad ? null : v, bad };
}
export function evaluate(parsed, vals) {
  const eq = parsed.toks.findIndex((t) => t.t === 'op' && t.v === '=');
  if (eq >= 0) {
    const L = evalToks(parsed.toks.slice(0, eq), vals), Rt = evalToks(parsed.toks.slice(eq + 1), vals);
    if (L.bad || Rt.bad) return { bad: L.bad || Rt.bad };
    return { eq: true, left: L.v, right: Rt.v, ok: L.v.n === Rt.v.n && L.v.d === Rt.v.d };
  }
  const r = evalToks(parsed.toks, vals);
  return r.bad ? { bad: r.bad } : { eq: false, value: r.v };
}
const val = (r) => r.n / r.d;
export function fmtR(r, decimals) {
  if (!r) return '?';
  if (r.d === 1) return r.n.toLocaleString('en-GB');
  if (decimals) return String(Math.round(val(r) * 1000) / 1000);
  const w = Math.trunc(r.n / r.d), rem = Math.abs(r.n % r.d);
  return w ? w + ' ' + rem + '/' + r.d : r.n + '/' + r.d;
}
const solved = new WeakMap();
export function solve(om, parsed) {
  if (solved.has(om)) return solved.get(om);
  const out = solveNow(om, parsed);
  solved.set(om, out);
  return out;
}
function solveNow(om, parsed) {
  const k = parsed.boxes, D = om.digits, once = om.useOnce;
  const total = once ? (function () { let t = 1; for (let i = 0; i < k; i++) t *= Math.max(0, D.length - i); return t; })() : Math.pow(D.length, k);
  if (!k || total > 700000 || (once && k > D.length)) return null;
  const vals = new Array(k), used = new Array(D.length).fill(false);
  let best = null, bestVals = null, count = 0, first = null;
  const score = (r) => (om.goal === 'largest' ? val(r) : om.goal === 'smallest' ? -val(r) : -Math.abs(val(r) - om.target));
  (function rec(pos) {
    if (pos === k) {
      const r = evaluate(parsed, vals);
      if (r.bad) return;
      if (r.eq) { if (r.ok) { count++; if (!first) first = vals.slice(); } return; }
      const s = score(r.value);
      if (best === null || s > best + 1e-12) { best = s; bestVals = vals.slice(); count = 1; } else if (Math.abs(s - best) < 1e-12) count++;
      return;
    }
    for (let j = 0; j < D.length; j++) {
      if (once && used[j]) continue;
      used[j] = true; vals[pos] = String(D[j]); rec(pos + 1); used[j] = false;
    }
  })(0);
  if (om.goal === 'equal' || parsed.toks.some((t) => t.v === '=')) return first ? { vals: first, count } : { vals: null, count: 0 };
  return bestVals ? { vals: bestVals, count, value: evaluate(parsed, bestVals).value } : null;
}

/* ---------------- example (Year 4, real and checked) ---------------- */
const EXAMPLE = {
  title: 'Multiplication and arrays',
  objective: 'To use arrays to show and explain multiplication facts',
  wodb: {
    question: "Which one doesn't belong?",
    items: [
      { label: '3 × 4', visual: { kind: 'array', rows: 3, cols: 4 } },
      { label: '12', visual: { kind: 'none' } },
      { label: '2 × 6', visual: { kind: 'array', rows: 2, cols: 6 } },
      { label: '4 × 4', visual: { kind: 'array', rows: 4, cols: 4 } }
    ],
    reasons: [
      { item: 0, reason: '3 × 4 is the only array with an odd number of rows.' },
      { item: 1, reason: '12 is the only one written as a number instead of an array.' },
      { item: 2, reason: '2 × 6 is the only array with exactly 2 rows.' },
      { item: 3, reason: '4 × 4 is the only one that does not make 12. It is also the only square array.' }
    ],
    stems: ["I think ___ doesn't belong because…", 'I agree with ___, and another reason is…', 'I disagree, because…']
  },
  openMiddle: {
    title: 'Biggest product',
    instructions: 'Use the digits 1 to 9, each one only once, to fill the boxes. Make the biggest answer you can.',
    expression: '[][] × []',
    digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    useOnce: true,
    goal: 'largest',
    target: null,
    answer: [8, 7, 9],
    extend: 'Now try to get as close to 500 as you can.'
  },
  challenge: 'Make your own “Which one doesn’t belong?” with four multiplication facts. Give a reason why each one could be the odd one out.',
  teacher: {
    routine: [
      'Share the grid. 1 minute of silent thinking: which one doesn’t belong, and why?',
      'Chat waterfall: pupils type their choice and reason, then press Enter together on 3-2-1.',
      'Unmute 3 or 4 pupils with different choices. Tap each picture to show a reason.',
      'Open Middle: 5 minutes on paper. Pupils hold their best answer up to the camera.',
      'Type the class’s best answers into the boxes and test them live. Reveal the best answer last.'
    ],
    questions: ['How could you prove 3 × 4 and 2 × 6 make the same total?', 'Can you turn an array around? What stays the same?', 'Why does the biggest digit go in the single box?'],
    misconceptions: ['Counting dots one by one instead of using rows and columns.', 'Thinking 87 × 9 and 97 × 8 must be equal because they use the same digits.'],
    support: 'Give squared paper or counters to build each array. Start Open Middle with digits 1 to 5 only.',
    stretch: 'Find the smallest answer, and an answer as close to 500 as possible. Explain your strategy.',
    answers: 'Biggest: 87 × 9 = 783 (better than 97 × 8 = 776). Closest to 500: 83 × 6 = 498.'
  }
};

/* ---------------- engine definition ---------------- */
function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create a maths reasoning activity on the topic: ' + input.topic + '. Level: ' + input.level + ' for ' + input.year + '.',
      '1) A "Which one doesn\'t belong?" (WODB) set of exactly 4 items. Each item must be the odd one out for a DIFFERENT, mathematically correct reason, so every pupil can be right.',
      '2) An Open Middle problem: boxes to fill with digits, many ways to get started, one best answer (or several correct answers to find).',
      '3) A short follow-up challenge, and teacher notes for a live online lesson.'
    ].join('\n'),
    rules: [
      'wodb.items[].visual.kind is one of: "fraction" (num, den, model "bar" or "circle"), "array" (rows, cols), "shape" (name: triangle, right-angled triangle, isosceles triangle, scalene triangle, square, rectangle, rhombus, parallelogram, trapezium, kite, pentagon, hexagon, octagon, circle, semicircle, cube, cuboid, cylinder, cone, sphere, square-based pyramid, triangular prism), "clock" (h, m), "angle" (deg), "numberline" (from, to, mark), or "none" (the label alone).',
      'Each wodb.reasons entry names an item by index 0 to 3. Give at least one reason for every item.',
      'openMiddle.expression uses [] for each box, digits, and only + - × ÷ ( ) = and / (use / ONLY for fractions like []/[]). Adjacent boxes make one number, so [][] is a two-digit number.',
      'openMiddle.goal is "largest", "smallest", "closest" (then give target as a number) or "equal" (the expression contains = and must be made true).',
      'openMiddle.answer lists the digits for the boxes, in order, for the best answer (or one correct answer for "equal").',
      'Keep labels short (under 14 characters). Write fractions like 3/4 and use × and ÷ symbols.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw.wodb || {};
  const items = arr(w.items).slice(0, 4).map((it) => ({ label: str(it && it.label), visual: normVisual(it && it.visual) }));
  if (items.length !== 4 || items.some((it) => !it.label && it.visual.kind === 'none')) return null;
  const reasons = arr(w.reasons).map((r) => ({ item: clamp(Math.round(num(r && r.item, -1)), -1, 3), reason: str(r && r.reason) })).filter((r) => r.item >= 0 && r.reason);
  const o = raw.openMiddle || {};
  let digits = arr(o.digits).map((d) => Math.round(num(d, -1))).filter((d) => d >= 0 && d <= 9);
  digits = Array.from(new Set(digits)).sort((a, b) => a - b);
  if (!digits.length) digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let goal = ['largest', 'smallest', 'closest', 'equal'].includes(o.goal) ? o.goal : (/=/.test(str(o.expression)) ? 'equal' : 'largest');
  if (/=/.test(str(o.expression))) goal = 'equal';
  if (goal === 'closest' && !Number.isFinite(Number(o.target))) goal = 'largest';
  const t = raw.teacher || {};
  return {
    title: str(raw.title) || input.topic || 'Maths reasoning',
    objective: str(raw.objective),
    wodb: { question: str(w.question) || "Which one doesn't belong?", items, reasons, stems: strs(w.stems, 4) },
    openMiddle: {
      title: str(o.title) || 'Open Middle', instructions: str(o.instructions), expression: str(o.expression),
      digits, useOnce: o.useOnce !== false, goal, target: goal === 'closest' ? num(o.target, null) : null,
      answer: arr(o.answer).map((d) => String(Math.round(num(d, 0)))), extend: str(o.extend)
    },
    challenge: str(raw.challenge),
    teacher: { routine: strs(t.routine, 8), questions: strs(t.questions, 6), misconceptions: strs(t.misconceptions, 6), support: str(t.support), stretch: str(t.stretch), answers: str(t.answers) }
  };
}

function wodbScreen(eng) {
  return {
    title: "Which one doesn't belong?",
    render(board, ctx) {
      const d = ctx.data.wodb;
      board.innerHTML = B.pad(eng, { kick: "Which one doesn't belong?", say: 'waterfall', title: d.question, foot: '<span>Tap a box to show a reason</span><span>' + esc(ctx.data.title) + '</span>' });
      const body = B.body(board);
      body.innerHTML = '<div class="wodb">' + d.items.map((it, i) => {
        const vis = visualSVG(it.visual);
        return '<button type="button" class="t wi" data-i="' + i + '"><span class="tag">' + 'ABCD'[i] + '</span>' + (vis || '<span class="lab" style="font-size:calc(5.4 * var(--u))">' + esc(it.label) + '</span>') +
          (vis ? '<span class="lab">' + esc(it.label) + '</span>' : '<span></span>') + '<span class="why"></span></button>';
      }).join('') + '</div>';
      const st = ctx.state.wodb || (ctx.state.wodb = { shown: {}, k: {} });
      body.querySelectorAll('.wi').forEach((b) => {
        const i = Number(b.dataset.i), rs = d.reasons.filter((r) => r.item === i);
        const paint = () => { const on = st.shown[i]; b.classList.toggle('show', !!on); b.querySelector('.why').textContent = on ? (rs[st.k[i] % rs.length] || { reason: 'Can you find a reason?' }).reason : ''; };
        b.addEventListener('click', () => {
          if (!st.shown[i]) { st.shown[i] = true; st.k[i] = 0; } else if (rs.length > 1 && st.k[i] < rs.length - 1) st.k[i]++; else st.shown[i] = false;
          paint();
        });
        paint();
      });
    }
  };
}
function omScreen(eng) {
  return {
    title: 'Open Middle puzzle',
    render(board, ctx) {
      const o = ctx.data.openMiddle;
      const parsed = tokenize(o.expression);
      const goalTxt = { largest: 'Make the biggest answer you can.', smallest: 'Make the smallest answer you can.', closest: 'Get as close to ' + (o.target != null ? o.target.toLocaleString('en-GB') : 'the target') + ' as you can.', equal: 'Make it true.' }[o.goal];
      board.innerHTML = B.pad(eng, { kick: 'Open Middle', icon: 'target', say: 'show', title: o.title, sub: o.instructions || goalTxt, foot: '<span>' + esc(o.useOnce ? 'Each digit only once' : 'Digits can be used again') + '</span><span>' + esc(goalTxt) + '</span>' });
      const body = B.body(board);
      if (!parsed || !parsed.boxes) { body.innerHTML = '<div class="b-center" style="flex:1"><p class="b-big">' + esc(o.expression) + '</p></div>'; return; }
      const st = ctx.state.om || (ctx.state.om = { vals: new Array(parsed.boxes).fill(''), sel: 0, msg: '' });
      const decimals = /\./.test(o.expression);
      const exprHTML = () => {
        let h = '', k = 0;
        const t = parsed.toks;
        const numHTML = (tok) => '<span class="om-num">' + tok.parts.map((p) => p.box != null ? '<button type="button" class="om-box' + (st.sel === p.box ? ' sel' : '') + '" data-b="' + p.box + '" aria-label="Box ' + (p.box + 1) + '">' + esc(st.vals[p.box] || '') + '</button>' : '<span class="om-box fixed">' + esc(p.ch) + '</span>').join('') + '</span>';
        for (let i = 0; i < t.length; i++) {
          const a = t[i], b = t[i + 1], c = t[i + 2];
          if (a.t === 'num' && b && b.t === 'op' && b.v === '/' && c && c.t === 'num') { h += '<span class="om-frac">' + numHTML(a) + '<hr>' + numHTML(c) + '</span>'; i += 2; continue; }
          h += a.t === 'num' ? numHTML(a) : '<span class="om-op">' + esc(a.v === '/' ? '÷' : a.v) + '</span>';
          k++;
        }
        return h;
      };
      const paint = () => {
        const used = {};
        st.vals.forEach((v) => { if (v !== '') used[v] = (used[v] || 0) + 1; });
        const dup = o.useOnce && Object.values(used).some((n) => n > 1);
        const full = st.vals.every((v) => v !== '');
        let stat = '<span class="om-res">' + (full ? '' : 'Fill every box') + '</span>';
        if (full) {
          const r = evaluate(parsed, st.vals);
          if (r.bad === 'lead') stat = '<span class="om-res">A number cannot start with 0</span>';
          else if (r.bad) stat = '<span class="om-res">That does not work: try other digits</span>';
          else if (r.eq) stat = '<span class="om-res' + (r.ok ? ' ok' : '') + '">' + (r.ok ? 'True! Both sides are ' + fmtR(r.left, decimals) : 'Not equal yet: ' + fmtR(r.left, decimals) + ' and ' + fmtR(r.right, decimals)) + '</span>';
          else stat = '<span class="om-res">= ' + fmtR(r.value, decimals) + '</span>' + (o.goal === 'closest' && o.target != null ? '<span class="om-goal">' + (Math.round(Math.abs(val(r.value) - o.target) * 1000) / 1000).toLocaleString('en-GB') + ' away from ' + o.target.toLocaleString('en-GB') + '</span>' : '');
          if (dup) stat += '<span class="om-goal">Each digit only once!</span>';
        }
        body.innerHTML = '<div class="om"><div class="om-expr">' + exprHTML() + '</div><div class="om-tray">' +
          o.digits.map((dg) => '<button type="button" class="b-btn' + (o.useOnce && used[String(dg)] ? ' used' : '') + '" data-d="' + dg + '">' + dg + '</button>').join('') +
          '<button type="button" class="b-btn round" data-clear aria-label="Clear the boxes">' + icon('refresh') + '</button></div>' +
          '<div class="om-stat">' + stat + '<button type="button" class="b-btn" data-solve>' + icon('bulb') + (o.goal === 'equal' ? 'Show a solution' : 'Show the best') + '</button></div>' +
          (st.msg ? '<p class="b-sub" style="margin:0;text-align:center">' + esc(st.msg) + '</p>' : '') + '</div>';
        body.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { st.sel = Number(b.dataset.b); paint(); }));
        body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => place(b.dataset.d)));
        body.querySelector('[data-clear]').addEventListener('click', () => { st.vals = st.vals.map(() => ''); st.sel = 0; st.msg = ''; paint(); });
        body.querySelector('[data-solve]').addEventListener('click', () => {
          const s = st.solved || (st.solved = solve(o, parsed) || { vals: o.answer.length === parsed.boxes ? o.answer : null, count: 0, fromClaude: true });
          if (!s.vals) { st.msg = 'No solution found with these digits.'; paint(); return; }
          st.vals = s.vals.slice();
          st.msg = o.goal === 'equal' ? (s.count > 1 ? 'There are ' + s.count + ' solutions altogether. Can you find another?' : 'Here is one solution.') : (s.fromClaude ? 'Our best answer.' : 'This is the best possible answer.');
          paint();
        });
      };
      const place = (dg) => {
        st.vals[st.sel] = String(dg);
        const next = st.vals.findIndex((v, i) => v === '' && i > st.sel);
        st.sel = next >= 0 ? next : st.vals.findIndex((v) => v === '') >= 0 ? st.vals.findIndex((v) => v === '') : st.sel;
        st.msg = '';
        paint();
      };
      ctx.onKey = (e) => { if (/^[0-9]$/.test(e.key) && o.digits.includes(Number(e.key))) place(e.key); else if (e.key === 'Backspace') { st.vals[st.sel] = ''; paint(); } };
      paint();
    }
  };
}
function challengeScreen(eng) {
  return {
    title: 'Your turn',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Challenge', icon: 'star', say: 'show', title: 'Your turn', foot: '<span>' + esc(d.title) + '</span><span>Share it in the chat</span>' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1"><div class="t"><h4>' + icon('star') + 'Challenge</h4><p class="b-big" style="font-size:calc(2.3 * var(--u))">' + esc(d.challenge || d.openMiddle.extend) + '</p></div>' +
        '<div class="t in"><h4>' + icon('debate') + 'Explain like a mathematician</h4>' + B.list(d.wodb.stems.length ? d.wodb.stems : ['I know this because…', 'I noticed that…', 'This is always / sometimes / never true because…']) + '</div></div>';
    }
  };
}

const eng = {
  id: 'maths', name: 'Maths Reasoning', short: 'Maths', color: 'indigo', icon: 'shapes',
  kicker: 'Maths · reasoning starter', tagline: "Which One Doesn't Belong + an Open Middle puzzle the class solves live.",
  about: 'A four-picture “Which one doesn’t belong?” where every answer can be right, then an Open Middle puzzle your class tries live: it checks answers and finds the best one.',
  chips: ['Maths', '15–20 minutes', 'Every pupil can be right'], cta: 'Make the puzzles', savedLabel: 'puzzles',
  sym: { hello: 'Tell me the <b>maths topic</b> and year group. I’ll make a “Which one doesn’t belong?” grid and an Open Middle puzzle your class can try live.', thinking: 'Choosing four items that can each be the odd one out…', done: 'Press <b>Present</b>, then tap the pictures to reveal reasons.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 4' },
    { id: 'topic', type: 'text', label: 'Maths topic', required: true, placeholder: 'For example: Equivalent fractions', chips: ['Place value', 'Multiplication', 'Fractions', 'Angles', 'Shape', 'Time', 'Decimals'], tip: 'Any maths topic works: place value, fractions, shape, time, angles…', missing: 'Type a maths topic first, for example “Equivalent fractions”.' },
    { id: 'level', type: 'pills', label: 'Level', options: ['Support', 'Expected', 'Greater depth'], value: 'Expected', tip: 'Support uses smaller numbers; Greater depth adds a tougher puzzle.' }
  ],
  example: { input: { year: 'Year 4', topic: 'Multiplication and arrays', level: 'Expected' }, data: EXAMPLE },
  progress: [['title', 'Planning the puzzles'], ['wodb', 'Choosing the four items'], ['reasons', 'Writing a reason for each one'], ['openMiddle', 'Designing the Open Middle puzzle'], ['teacher', 'Writing your teacher notes']],
  maxTokens: 4000,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, input && input.level].filter(Boolean).join(' · '),
  screens: () => [wodbScreen(eng), omScreen(eng), challengeScreen(eng)],
  notes(d, mode) {
    const t = d.teacher;
    const parsed = tokenize(d.openMiddle.expression);
    let ans = t.answers;
    if (parsed && parsed.boxes) {
      const s = solve(d.openMiddle, parsed);
      if (s && s.vals) {
        const r = evaluate(parsed, s.vals);
        const filled = (() => { let k = 0; return d.openMiddle.expression.replace(/□|▢|☐|\[\s*\]/g, () => s.vals[k++]); })();
        ans = (d.openMiddle.goal === 'equal' ? 'One solution: ' + filled + (s.count > 1 ? ' (' + s.count + ' solutions altogether)' : '') : 'Best possible: ' + filled + ' = ' + fmtR(r.value, /\./.test(d.openMiddle.expression)) + '. Checked by trying every option.') + (t.answers ? ' ' + t.answers : '');
      }
    }
    return [
      { h: 'Running it online', icon: 'clock', list: t.routine, ordered: true, full: true },
      { h: 'Reasons for each item', icon: 'shapes', pairs: d.wodb.items.map((it, i) => ['ABCD'[i] + ' · ' + it.label, d.wodb.reasons.filter((r) => r.item === i).map((r) => r.reason).join(' ') || '—']) },
      { h: 'Open Middle answer', icon: 'target', text: ans },
      { h: 'Questions to ask', icon: 'chat', list: t.questions },
      { h: 'Watch out for', icon: 'eye', list: t.misconceptions },
      { h: 'Support and stretch', icon: 'layers', pairs: [['Support', t.support], ['Stretch', t.stretch]].filter((p) => p[1]) },
      d.objective ? { h: 'Objective', icon: 'flag', text: d.objective } : null
    ];
  },
  chat(d) {
    return {
      title: d.wodb.question,
      sub: 'Type your answer and reason, but wait for 3-2-1 before you press Enter!',
      sections: [
        { h: 'Which one doesn’t belong?', list: d.wodb.items.map((it, i) => 'ABCD'[i] + ') ' + it.label) },
        { h: 'Open Middle: ' + d.openMiddle.title, text: (d.openMiddle.instructions ? d.openMiddle.instructions + ' ' : '') + d.openMiddle.expression.replace(/\[\s*\]/g, '□') },
        d.challenge ? { h: 'Challenge', text: d.challenge } : null
      ].filter(Boolean)
    };
  }
};
export default eng;
