/* Ribbons: fluid spring-driven ribbons that follow the pointer (canvas port of the OGL Ribbons component).
   Same physics as the original (spring + friction on the head, lerped trail, thickness taper and tail fade).
   Used as the "magic pointer" in Present mode so pupils on a video call can see where the teacher points. */

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h) || [0, 'ff', 'ff', 'ff'];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Ribbons {
  constructor(container, opts) {
    this.o = Object.assign({ colors: ['#6C63FF', '#38B2AC', '#FF7AA2', '#FFB443'], baseSpring: 0.03, baseFriction: 0.9, baseThickness: 30,
      offsetFactor: 0.05, maxAge: 500, pointCount: 50, speedMultiplier: 0.6, enableFade: true, enableShaderEffect: false, effectAmplitude: 2 }, opts || {});
    this.root = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ribbons';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = [0, 0];
    this.active = false;
    this.lines = [];
    const center = (this.o.colors.length - 1) / 2;
    this.o.colors.forEach((color, index) => {
      const pts = [];
      for (let i = 0; i < this.o.pointCount; i++) pts.push([0, 0]);
      this.lines.push({
        rgb: hexToRgb(color),
        spring: this.o.baseSpring + (Math.random() - 0.5) * 0.05,
        friction: this.o.baseFriction + (Math.random() - 0.5) * 0.05,
        thickness: this.o.baseThickness + (Math.random() - 0.5) * 3,
        offset: [(index - center) * this.o.offsetFactor + (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.1],
        vel: [0, 0],
        points: pts
      });
    });
    this.onMove = (e) => {
      const r = this.root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      this.mouse = [x * 2 - 1, y * -2 + 1];
      if (!this.seeded) { this.seeded = true; this.lines.forEach((l) => l.points.forEach((p) => { p[0] = this.mouse[0]; p[1] = this.mouse[1]; })); }
    };
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.resize();
  }
  resize() {
    const r = this.root.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
  }
  start() {
    if (this.active) return;
    this.active = true; this.seeded = false;
    this.root.addEventListener('pointermove', this.onMove);
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.root.removeEventListener('pointermove', this.onMove);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  frame(now) {
    if (!this.active) return;
    const dt = Math.min(64, now - this.last); this.last = now;
    const { maxAge, speedMultiplier } = this.o;
    for (const l of this.lines) {
      const p0 = l.points[0];
      l.vel[0] = (l.vel[0] + (this.mouse[0] + l.offset[0] - p0[0]) * l.spring) * l.friction;
      l.vel[1] = (l.vel[1] + (this.mouse[1] + l.offset[1] - p0[1]) * l.spring) * l.friction;
      p0[0] += l.vel[0]; p0[1] += l.vel[1];
      // each point trails its neighbour by ~seg/speed ms whatever the frame rate, so the ribbon keeps its length
      const tau = maxAge / (l.points.length - 1) / Math.max(0.05, speedMultiplier);
      const a = dt / (dt + tau);
      for (let i = 1; i < l.points.length; i++) {
        const p = l.points[i], q = l.points[i - 1];
        p[0] += (q[0] - p[0]) * a; p[1] += (q[1] - p[1]) * a;
      }
    }
    this.draw(now * 0.001);
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  draw(time) {
    const ctx = this.ctx, w = this.w, h = this.h, aspect = w / h;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const l of this.lines) {
      const P = l.points, n = P.length;
      const left = [], right = [];
      for (let i = 0; i < n; i++) {
        const prev = P[Math.max(0, i - 1)], next = P[Math.min(n - 1, i + 1)];
        let tx = (next[0] - prev[0]) * aspect, ty = next[1] - prev[1];
        const dist = Math.hypot(tx, ty);
        if (dist > 1e-6) { tx /= dist; ty /= dist; } else { tx = 1; ty = 0; }
        // normal in aspect-corrected space, then back to NDC (same as the original vertex shader)
        let nx = -ty / aspect, ny = tx;
        const u = i / (n - 1);
        let k = 1 + (0.1 - 1) * Math.pow(Math.abs(u - 0.5) * 2, 2);
        k *= smooth(0, 0.02, dist);
        let half = (l.thickness / h) * k;           // NDC units, gives `thickness` px across
        if (this.o.enableShaderEffect) half *= 1 + Math.sin(time + P[i][0] * 10) * this.o.effectAmplitude * 0.2;
        const cx = P[i][0], cy = P[i][1];
        const lx = cx + nx * half, ly = cy + ny * half, rx = cx - nx * half, ry = cy - ny * half;
        left.push([(lx + 1) * 0.5 * w, (1 - ly) * 0.5 * h]);
        right.push([(rx + 1) * 0.5 * w, (1 - ry) * 0.5 * h]);
      }
      const head = [(P[0][0] + 1) * 0.5 * w, (1 - P[0][1]) * 0.5 * h];
      const tail = [(P[n - 1][0] + 1) * 0.5 * w, (1 - P[n - 1][1]) * 0.5 * h];
      const [r, g, b] = l.rgb;
      if (this.o.enableFade && Math.hypot(tail[0] - head[0], tail[1] - head[1]) > 1) {
        const gr = ctx.createLinearGradient(head[0], head[1], tail[0], tail[1]);
        gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
        gr.addColorStop(0.55, 'rgba(' + r + ',' + g + ',' + b + ',.55)');
        gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = gr;
      } else ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (let i = 1; i < n - 1; i++) ctx.quadraticCurveTo(left[i][0], left[i][1], (left[i][0] + left[i + 1][0]) / 2, (left[i][1] + left[i + 1][1]) / 2);
      ctx.lineTo(left[n - 1][0], left[n - 1][1]);
      ctx.lineTo(right[n - 1][0], right[n - 1][1]);
      for (let i = n - 2; i > 0; i--) ctx.quadraticCurveTo(right[i][0], right[i][1], (right[i][0] + right[i - 1][0]) / 2, (right[i][1] + right[i - 1][1]) / 2);
      ctx.lineTo(right[0][0], right[0][1]);
      ctx.closePath();
      ctx.fill();
    }
  }
}
