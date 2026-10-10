/* Drawing: the teacher's pen and highlighter on slides in Present mode, and the pupils' mini whiteboard in a live
   lesson. Strokes are kept as shares (0 to 1) of the box they were drawn in, so they stay in place when the window
   or full screen changes size, and a pupil's board can be shown at any size on the teacher's screen.
   No imports: the pupils' page uses this file too. */
export const COLOURS = ['#1B2440', '#E5484D', '#2F6FDB', '#2BA06A', '#F2B84B', '#8B5CF6', '#FFFFFF'];
export const COLOUR_NAMES = ['Black', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'White'];
export const SIZES = [0.0035, 0.007, 0.014];              // pen width as a share of the box width: thin, medium, thick
const HL = 3.2;                                            // the highlighter is this much wider than the pen

/* One stroke: { t: 'pen' | 'hl', c: colour, w: width share, p: [x0, y0, x1, y1, …] } */
function trace(g, p, W, H) {
  g.beginPath();
  g.moveTo(p[0] * W, p[1] * H);
  if (p.length === 4) { g.lineTo(p[2] * W, p[3] * H); return; }
  for (let i = 2; i < p.length - 2; i += 2) {
    const xc = (p[i] + p[i + 2]) / 2, yc = (p[i + 1] + p[i + 3]) / 2;
    g.quadraticCurveTo(p[i] * W, p[i + 1] * H, xc * W, yc * H);
  }
  g.lineTo(p[p.length - 2] * W, p[p.length - 1] * H);
}
export function paintStroke(g, s, W, H) {
  const p = s.p;
  if (!p || p.length < 2) return;
  const lw = Math.max(1, s.w * W * (s.t === 'hl' ? HL : 1));
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = s.c; g.fillStyle = s.c; g.lineWidth = lw;
  if (s.t === 'hl') g.globalAlpha = 0.34;
  if (p.length === 2) { g.beginPath(); g.arc(p[0] * W, p[1] * H, lw / 2, 0, Math.PI * 2); g.fill(); }
  else { trace(g, p, W, H); g.stroke(); }
  g.restore();
}
/* The same strokes as SVG (the teacher's wall of pupils' boards). */
export function strokesSVG(strokes, aspect, label) {
  const W = 1000, H = Math.round(W / (aspect || 4 / 3)), f = (v) => Math.round(v * 10) / 10;
  const path = (s) => {
    const p = s.p, d = ['M' + f(p[0] * W) + ' ' + f(p[1] * H)];
    if (p.length === 2) d.push('l0.1 0');
    else if (p.length === 4) d.push('L' + f(p[2] * W) + ' ' + f(p[3] * H));
    else {
      for (let i = 2; i < p.length - 2; i += 2) d.push('Q' + f(p[i] * W) + ' ' + f(p[i + 1] * H) + ' ' + f((p[i] + p[i + 2]) / 2 * W) + ' ' + f((p[i + 1] + p[i + 3]) / 2 * H));
      d.push('L' + f(p[p.length - 2] * W) + ' ' + f(p[p.length - 1] * H));
    }
    return '<path d="' + d.join('') + '" fill="none" stroke="' + s.c + '" stroke-width="' + f(Math.max(1, s.w * W * (s.t === 'hl' ? HL : 1))) + '" stroke-linecap="round" stroke-linejoin="round"' + (s.t === 'hl' ? ' opacity=".34"' : '') + '/>';
  };
  return '<svg class="ink-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + String(label || 'A drawing').replace(/[<>&"]/g, '') + '" preserveAspectRatio="xMidYMid meet"><rect width="' + W + '" height="' + H + '" fill="#FFFFFF"/>' + strokes.map(path).join('') + '</svg>';
}
/* Small enough to send: whole numbers, colours by number. */
export function packStrokes(strokes) {
  return strokes.slice(0, 300).map((s) => [s.t === 'hl' ? 1 : 0, Math.max(0, COLOURS.indexOf(s.c)), Math.round(s.w * 10000), s.p.slice(0, 1600).map((v) => Math.round(v * 1000))]);
}
export function unpackStrokes(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 300).map((x) => {
    if (!Array.isArray(x) || !Array.isArray(x[3])) return null;
    const p = x[3].slice(0, 1600).map((v) => Math.min(1, Math.max(0, (Number(v) || 0) / 1000)));
    if (p.length < 2 || p.length % 2) return null;
    return { t: x[0] === 1 ? 'hl' : 'pen', c: COLOURS[x[1]] || COLOURS[0], w: Math.min(0.05, Math.max(0.001, (Number(x[2]) || 70) / 10000)), p };
  }).filter(Boolean);
}
function nearSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx - px, y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

/* A canvas over a box (a slide, a board, a pupil's whiteboard) that keeps and draws strokes.
   o: { onChange(), aspect } */
export class Ink {
  constructor(host, o) {
    this.o = o || {};
    this.cv = document.createElement('canvas');
    this.cv.className = 'ink';
    this.cv.setAttribute('aria-hidden', 'true');
    this.g = this.cv.getContext('2d');
    this.strokes = []; this.undos = [];
    this.tool = 'pen'; this.color = COLOURS[1]; this.size = 1; this.on = false;
    this.cur = null; this.batch = null; this.dpr = 1; this.W = 0; this.H = 0;
    this.cv.addEventListener('pointerdown', (e) => this.down(e));
    this.cv.addEventListener('pointermove', (e) => this.move(e));
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => this.cv.addEventListener(t, (e) => this.up(e)));
    // a tap while drawing is a dot, never "next slide"
    this.cv.addEventListener('click', (e) => { if (this.on) { e.preventDefault(); e.stopPropagation(); } });
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.resize()) : null;
    this.attach(host);
    this.enable(false);
  }
  attach(host) {
    if (!host) return;
    if (this.host !== host) {
      if (this.ro && this.host) this.ro.unobserve(this.host);
      this.host = host;
      if (this.ro) this.ro.observe(host);
    }
    if (this.cv.parentNode !== host) host.appendChild(this.cv);
    this.resize();
  }
  enable(on) { this.on = !!on; this.cv.style.pointerEvents = on ? 'auto' : 'none'; this.cv.classList.toggle('on', !!on); this.cv.style.cursor = on ? (this.tool === 'erase' ? 'cell' : 'crosshair') : ''; }
  set(o) { Object.assign(this, o || {}); this.enable(this.on); }
  load(strokes, undos) { this.strokes = strokes || []; this.undos = undos || []; this.cur = null; this.render(); }
  resize() {
    if (!this.host) return;
    const r = this.host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w !== this.cv.width || h !== this.cv.height) { this.cv.width = w; this.cv.height = h; }
    this.dpr = dpr; this.W = w; this.H = h;
    this.render();
  }
  render() {
    const g = this.g;
    g.clearRect(0, 0, this.W, this.H);
    this.strokes.forEach((s) => paintStroke(g, s, this.W, this.H));
    if (this.cur) paintStroke(g, this.cur, this.W, this.H);
  }
  at(e) { const r = this.cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / (r.width || 1))), Math.min(1, Math.max(0, (e.clientY - r.top) / (r.height || 1)))]; }
  down(e) {
    if (!this.on || (e.button != null && e.button > 0)) return;
    e.preventDefault(); e.stopPropagation();
    try { this.cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
    const [x, y] = this.at(e);
    if (this.tool === 'erase') { this.batch = []; this.erase(x, y); return; }
    this.cur = { t: this.tool === 'hl' ? 'hl' : 'pen', c: this.color, w: SIZES[this.size] || SIZES[1], p: [x, y] };
    this.render();
  }
  move(e) {
    if (!this.on) return;
    if (this.batch) { const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; (evs.length ? evs : [e]).forEach((ev) => { const [x, y] = this.at(ev); this.erase(x, y); }); return; }
    if (!this.cur) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e], p = this.cur.p, min = 1.6 / Math.max(1, this.W / this.dpr);
    (evs.length ? evs : [e]).forEach((ev) => {
      const [x, y] = this.at(ev), lx = p[p.length - 2], ly = p[p.length - 1];
      if (Math.abs(x - lx) + Math.abs(y - ly) < min) return;
      if (p.length < 3200) p.push(x, y);
    });
    this.render();
  }
  up() {
    if (this.batch) { if (this.batch.length) { this.undos.push({ erase: this.batch }); this.changed(); } this.batch = null; return; }
    if (!this.cur) return;
    const s = this.cur; this.cur = null;
    s.p = s.p.map((v) => Math.round(v * 10000) / 10000);
    this.strokes.push(s); this.undos.push({ add: 1 });
    this.render(); this.changed();
  }
  erase(x, y) {
    const r = 0.018, aspect = this.H ? this.W / this.H : 16 / 9;
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i], p = s.p, pad = r + s.w * (s.t === 'hl' ? HL : 1) / 2;
      let hit = false;
      if (p.length === 2) hit = Math.hypot(x - p[0], (y - p[1]) / aspect) < pad;
      for (let j = 2; j < p.length && !hit; j += 2) hit = nearSegment(x, y / aspect, p[j - 2], p[j - 1] / aspect, p[j], p[j + 1] / aspect) < pad;
      if (hit) { this.batch.push([i, s]); this.strokes.splice(i, 1); }
    }
    this.render();
  }
  undo() {
    const u = this.undos.pop();
    if (!u) return false;
    if (u.add) this.strokes.pop();
    else if (u.erase) u.erase.slice().reverse().forEach(([i, s]) => this.strokes.splice(i, 0, s));
    else if (u.clear) this.strokes = u.clear;
    this.render(); this.changed();
    return true;
  }
  clear() { if (!this.strokes.length) return; this.undos.push({ clear: this.strokes }); this.strokes = []; this.render(); this.changed(); }
  changed() { if (this.o.onChange) this.o.onChange(this); }
  destroy() { if (this.ro) this.ro.disconnect(); this.cv.remove(); }
}
