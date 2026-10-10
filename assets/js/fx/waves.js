/* Interactive Waves: Perlin-noise line field that bends away from the cursor (vanilla port of InteractiveWavesBackground).
   Pauses itself when it is off screen or the tab is hidden. */

class Grad { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } dot2(x, y) { return this.x * x + this.y * y; } }
class Noise {
  constructor(seed) {
    this.grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1),
      new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];
    this.p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
      247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
      74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
      65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
      52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
      119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
      218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    this.perm = new Array(512); this.gradP = new Array(512);
    this.seed(seed || 0);
  }
  seed(seed) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;
    for (let i = 0; i < 256; i++) {
      const v = i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return (1 - t) * a + t * b; }
  perlin2(x, y) {
    let X = Math.floor(x), Y = Math.floor(y);
    x -= X; y -= Y; X &= 255; Y &= 255;
    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
    const u = this.fade(x);
    return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
  }
}

export class Waves {
  constructor(container, opts) {
    this.c = Object.assign({ lineColor: 'rgba(108,99,255,.28)', waveSpeedX: 0.0125, waveSpeedY: 0.005, waveAmpX: 32, waveAmpY: 16, xGap: 10, yGap: 32,
      friction: 0.925, tension: 0.005, maxCursorMove: 100, lineWidth: 1 }, opts || {});
    this.root = container;
    this.wrap = document.createElement('div');
    this.wrap.className = 'waves';
    this.dot = document.createElement('div');
    this.dot.className = 'waves-dot';
    this.canvas = document.createElement('canvas');
    this.wrap.append(this.dot, this.canvas);
    container.prepend(this.wrap);
    this.ctx = this.canvas.getContext('2d');
    this.noise = new Noise(Math.random());
    this.lines = [];
    this.mouse = { x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false };
    this.bound = { width: 0, height: 0, left: 0, top: 0 };
    this.visible = true;
    this.slow = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onMove = (e) => this.updateMouse(e.clientX, e.clientY);
    this.onTouch = (e) => { const t = e.touches[0]; if (t) this.updateMouse(t.clientX, t.clientY); };
    this.onResize = () => { this.setSize(); this.setLines(); };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('touchmove', this.onTouch, { passive: true });
    this.onVis = () => { if (!document.hidden) this.play(); };
    document.addEventListener('visibilitychange', this.onVis);
    this.io = new IntersectionObserver((en) => { this.visible = en.some((x) => x.isIntersecting); if (this.visible) this.play(); }, { threshold: 0 });
    this.io.observe(this.wrap);
    this.ro = new ResizeObserver(() => this.onResize());
    this.ro.observe(this.wrap);
    this.setSize(); this.setLines();
    this.play();
  }
  setSize() {
    const r = this.wrap.getBoundingClientRect();
    this.bound = { width: r.width, height: r.height, left: r.left, top: r.top };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  setLines() {
    const { width, height } = this.bound;
    this.lines = [];
    const oWidth = width + 200, oHeight = height + 30;
    const { xGap, yGap } = this.c;
    const totalLines = Math.ceil(oWidth / xGap), totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width - xGap * totalLines) / 2, yStart = (height - yGap * totalPoints) / 2;
    for (let i = 0; i <= totalLines; i++) {
      const pts = [];
      for (let j = 0; j <= totalPoints; j++) pts.push({ x: xStart + xGap * i, y: yStart + yGap * j, wave: { x: 0, y: 0 }, cursor: { x: 0, y: 0, vx: 0, vy: 0 } });
      this.lines.push(pts);
    }
  }
  updateMouse(x, y) {
    const r = this.wrap.getBoundingClientRect();
    this.bound.left = r.left; this.bound.top = r.top;
    const m = this.mouse;
    m.x = x - r.left; m.y = y - r.top;
    if (!m.set) { m.sx = m.x; m.sy = m.y; m.lx = m.x; m.ly = m.y; m.set = true; }
  }
  movePoints(time) {
    const m = this.mouse, n = this.noise;
    const { waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove } = this.c;
    for (const pts of this.lines) for (const p of pts) {
      const move = n.perlin2((p.x + time * waveSpeedX) * 0.002, (p.y + time * waveSpeedY) * 0.0015) * 12;
      p.wave.x = Math.cos(move) * waveAmpX;
      p.wave.y = Math.sin(move) * waveAmpY;
      const dx = p.x - m.sx, dy = p.y - m.sy;
      const dist = Math.hypot(dx, dy), l = Math.max(175, m.vs);
      if (dist < l) {
        const s = 1 - dist / l, f = Math.cos(dist * 0.001) * s;
        p.cursor.vx += Math.cos(m.a) * f * l * m.vs * 0.00065;
        p.cursor.vy += Math.sin(m.a) * f * l * m.vs * 0.00065;
      }
      p.cursor.vx += (0 - p.cursor.x) * tension;
      p.cursor.vy += (0 - p.cursor.y) * tension;
      p.cursor.vx *= friction; p.cursor.vy *= friction;
      p.cursor.x += p.cursor.vx * 2; p.cursor.y += p.cursor.vy * 2;
      p.cursor.x = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.x));
      p.cursor.y = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.y));
    }
  }
  draw() {
    const { width, height } = this.bound, ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = this.c.lineColor;
    ctx.lineWidth = this.c.lineWidth;
    const moved = (p, wc) => [Math.round((p.x + p.wave.x + (wc ? p.cursor.x : 0)) * 10) / 10, Math.round((p.y + p.wave.y + (wc ? p.cursor.y : 0)) * 10) / 10];
    for (const points of this.lines) {
      let p1 = moved(points[0], false);
      ctx.moveTo(p1[0], p1[1]);
      points.forEach((p, idx) => {
        const isLast = idx === points.length - 1;
        p1 = moved(p, !isLast);
        const p2 = moved(points[idx + 1] || points[points.length - 1], !isLast);
        ctx.lineTo(p1[0], p1[1]);
        if (isLast) ctx.moveTo(p2[0], p2[1]);
      });
    }
    ctx.stroke();
  }
  tick(t) {
    this.raf = 0;
    if (!this.visible || document.hidden || !this.wrap.isConnected) return;
    const m = this.mouse;
    m.sx += (m.x - m.sx) * 0.1; m.sy += (m.y - m.sy) * 0.1;
    const dx = m.x - m.lx, dy = m.y - m.ly, d = Math.hypot(dx, dy);
    m.v = d; m.vs += (d - m.vs) * 0.1; m.vs = Math.min(100, m.vs);
    m.lx = m.x; m.ly = m.y; m.a = Math.atan2(dy, dx);
    this.dot.style.transform = 'translate3d(' + (m.sx - 4) + 'px,' + (m.sy - 4) + 'px,0)';
    this.movePoints(this.slow ? t * 0.25 : t);
    this.draw();
    this.raf = requestAnimationFrame((tt) => this.tick(tt));
  }
  play() { if (!this.raf) this.raf = requestAnimationFrame((t) => this.tick(t)); }
  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('touchmove', this.onTouch);
    document.removeEventListener('visibilitychange', this.onVis);
    this.io.disconnect(); this.ro.disconnect();
    this.wrap.remove();
  }
}
