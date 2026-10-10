/* Tubes: glossy 3D tubes that chase the cursor, re-made for a bright page.
   Raw WebGL (no libraries): each tube is a swept, tapered mesh with a rounded head, lit by a soft key light,
   a sky/ground fill and four slowly orbiting coloured lights. Two soft "shadow" passes (dark bottom-right,
   white top-left) make the tubes look moulded out of the neumorphic clay surface. Click to change colours. */

const VS = `
attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uProj; uniform mat4 uView; uniform float uInflate; uniform vec2 uShift;
varying vec3 vN; varying vec3 vP;
void main(){
  vec3 p = aPos + aNor * uInflate;
  vP = p; vN = aNor;
  vec4 c = uProj * uView * vec4(p, 1.0);
  c.xy += uShift * c.w;
  gl_Position = c;
}`;
const FS = `
precision mediump float;
varying vec3 vN; varying vec3 vP;
uniform vec3 uColor; uniform vec3 uCam; uniform float uMode; uniform float uAlpha;
uniform vec3 uLP[4]; uniform vec3 uLC[4];
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uCam - vP);
  float facing = max(dot(n, v), 0.0);
  if (uMode > 0.5) {
    float a = pow(facing, 1.35) * uAlpha;
    gl_FragColor = vec4(uColor * a, a);
    return;
  }
  vec3 L = normalize(vec3(-0.55, 0.75, 0.85));
  float diff = max(dot(n, L), 0.0);
  vec3 amb = mix(vec3(0.60, 0.65, 0.75), vec3(1.0), n.y * 0.5 + 0.5);
  vec3 col = uColor * (0.46 * amb + 0.62 * diff);
  vec3 H = normalize(L + v);
  float spec = pow(max(dot(n, H), 0.0), 70.0);
  for (int i = 0; i < 4; i++) {
    vec3 d = uLP[i] - vP; float dist = length(d); vec3 l = d / dist;
    float att = 1.0 / (1.0 + 0.045 * dist * dist);
    col += uLC[i] * (0.24 * max(dot(n, l), 0.0) * uColor + 0.32 * pow(max(dot(n, normalize(l + v)), 0.0), 32.0)) * att;
  }
  float rim = pow(1.0 - facing, 2.6);
  col += rim * 0.20 * mix(uColor, vec3(1.0), 0.6);
  col += spec * 0.8;
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}`;

export const PALETTES = [
  ['#6C63FF', '#38B2AC', '#FF7AA2', '#FFB443', '#4FA9F5'],
  ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B983FF'],
  ['#00BFA6', '#FF8FAB', '#7C83FD', '#FFC75F', '#3EC1D3'],
  ['#F7A072', '#5BC0EB', '#9BC53D', '#9381FF', '#FF85A1'],
  ['#8B84FF', '#5EEAD4', '#FDA4AF', '#FCD34D', '#93C5FD'],
  ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#9D4EDD']
];
const LIGHTS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

const hex = (h) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1]; };

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

export class Tubes {
  constructor(canvas, opts) {
    this.o = Object.assign({ count: 5, points: 84, radial: 14, cap: 5, radius: 0.19, palette: 0 }, opts || {});
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, depth: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.prog = this.program(VS, FS);
    const p = this.prog;
    this.loc = {
      aPos: gl.getAttribLocation(p, 'aPos'), aNor: gl.getAttribLocation(p, 'aNor'),
      uProj: gl.getUniformLocation(p, 'uProj'), uView: gl.getUniformLocation(p, 'uView'), uInflate: gl.getUniformLocation(p, 'uInflate'),
      uShift: gl.getUniformLocation(p, 'uShift'), uColor: gl.getUniformLocation(p, 'uColor'), uCam: gl.getUniformLocation(p, 'uCam'),
      uMode: gl.getUniformLocation(p, 'uMode'), uAlpha: gl.getUniformLocation(p, 'uAlpha'), uLP: gl.getUniformLocation(p, 'uLP'), uLC: gl.getUniformLocation(p, 'uLC')
    };
    this.camZ = 12; this.fov = 40 * Math.PI / 180;
    this.paletteIndex = this.o.palette % PALETTES.length;
    this.tubes = [];
    const SUB = 2;                                  // Catmull-Rom subdivisions for a smooth sweep
    this.rings = this.o.cap + (this.o.points - 1) * SUB + 1;
    for (let i = 0; i < this.o.count; i++) {
      const pts = [];
      for (let k = 0; k < this.o.points; k++) pts.push([0, 0, 0]);
      const col = hex(PALETTES[this.paletteIndex][i % 5]);
      const t = {
        pts, head: [0, 0, 0], vel: [0, 0, 0],
        amp: 0.7 + Math.random() * 1.0, w: 0.7 + Math.random() * 0.6, ph: (i / this.o.count) * Math.PI * 2 + Math.random() * 0.6, zAmp: 1.2 + Math.random() * 1.4,
        spring: 0.05 + Math.random() * 0.035, friction: 0.83 + Math.random() * 0.05, follow: 0.17 + Math.random() * 0.1,
        r: this.o.radius * (0.82 + Math.random() * 0.36),
        col: col.slice(), target: col.slice(),
        vbo: gl.createBuffer(), ibo: gl.createBuffer(), data: new Float32Array(this.rings * (this.o.radial + 1) * 6)
      };
      this.tubes.push(t);
      this.indices(t);
    }
    this.sub = SUB;
    this.lights = LIGHTS.map(hex);
    this.mouse = null; this.lastMove = -1e9; this.target = [0, 0, 0];
    this.running = false; this.t = 0;
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      this.mouse = [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
      this.lastMove = performance.now();
    };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('pointerdown', this.onPointer, { passive: true });
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.stop(); this.lost = true; });
  }
  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  indices(t) {
    const gl = this.gl, M = this.o.radial, R = this.rings;
    const idx = new Uint16Array((R - 1) * M * 6);
    let o = 0;
    for (let r = 0; r < R - 1; r++) for (let m = 0; m < M; m++) {
      const a = r * (M + 1) + m, b = (r + 1) * (M + 1) + m, c = b + 1, d = a + 1;
      idx[o++] = a; idx[o++] = b; idx[o++] = d; idx[o++] = b; idx[o++] = c; idx[o++] = d;
    }
    t.count = o;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, t.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, t.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, t.data.byteLength, gl.DYNAMIC_DRAW);
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.cssW = Math.max(1, r.width); this.cssH = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.aspect = this.cssW / this.cssH;
    this.halfH = Math.tan(this.fov / 2) * this.camZ;
    this.halfW = this.halfH * this.aspect;
    this.proj = perspective(this.fov, this.aspect, 0.1, 100);
    if (!this.running) this.render();
  }
  nextPalette() {
    this.paletteIndex = (this.paletteIndex + 1) % PALETTES.length;
    this.tubes.forEach((t, i) => { t.target = hex(PALETTES[this.paletteIndex][i % 5]); });
    if (!this.running) { this.tubes.forEach((t) => { t.col = t.target.slice(); }); this.render(); }
  }
  start() {
    if (this.running || this.lost) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.update(dt, now);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  /* one still frame (reduced motion / paused) */
  still() { for (let i = 0; i < 240; i++) this.update(1 / 60, i * 16.7); this.render(); }
  update(dt, now) {
    this.t += dt;
    const t = this.t;
    const f = dt * 60;
    // where the heads go: the cursor, or a slow figure-of-eight when nobody is moving the mouse
    const idle = performance.now() - this.lastMove > 2600 || !this.mouse;
    const auto = [Math.sin(t * 0.33) * this.halfW * 0.6 + Math.sin(t * 0.91) * this.halfW * 0.08, Math.sin(t * 0.57 + 1.2) * this.halfH * 0.48, 0];
    const goal = idle ? auto : [this.mouse[0] * this.halfW, this.mouse[1] * this.halfH, 0];
    const blend = 1 - Math.pow(1 - 0.06, f);
    for (let k = 0; k < 3; k++) this.target[k] += (goal[k] - this.target[k]) * blend;
    this.tubes.forEach((tb, i) => {
      const ang = t * tb.w + tb.ph;
      const off = [Math.cos(ang) * tb.amp, Math.sin(ang * 1.3) * tb.amp * 0.8, Math.sin(ang * 0.7 + i) * tb.zAmp];
      for (let k = 0; k < 3; k++) {
        tb.vel[k] = (tb.vel[k] + (this.target[k] + off[k] - tb.head[k]) * tb.spring * f) * Math.pow(tb.friction, f);
        tb.head[k] += tb.vel[k] * f;
      }
      const P = tb.pts;
      P[0][0] = tb.head[0]; P[0][1] = tb.head[1]; P[0][2] = tb.head[2];
      const a = 1 - Math.pow(1 - tb.follow, f);
      for (let j = 1; j < P.length; j++) for (let k = 0; k < 3; k++) P[j][k] += (P[j - 1][k] - P[j][k]) * a;
      const c = 1 - Math.pow(1 - 0.08, f);
      for (let k = 0; k < 3; k++) tb.col[k] += (tb.target[k] - tb.col[k]) * c;
    });
  }
  geometry(tb) {
    const M = this.o.radial, K = this.o.cap, S = this.sub;
    // Catmull-Rom resample of the trail
    const src = tb.pts, n = src.length, P = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = src[Math.max(0, i - 1)], p1 = src[i], p2 = src[i + 1], p3 = src[Math.min(n - 1, i + 2)];
      for (let s = 0; s < S; s++) {
        const u = s / S, u2 = u * u, u3 = u2 * u;
        P.push([0, 1, 2].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)));
      }
    }
    P.push(src[n - 1].slice());
    const N = P.length;
    const T = new Array(N), Nn = new Array(N), B = new Array(N);
    const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-7 ? [v[0] / l, v[1] / l, v[2] / l] : null; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (let i = 0; i < N; i++) {
      const tt = norm(sub3(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)]));
      T[i] = tt || (i > 0 ? T[i - 1] : null);
    }
    let firstT = T.find((x) => x) || [1, 0, 0];
    for (let i = 0; i < N; i++) if (!T[i]) T[i] = firstT; else firstT = T[i];
    const up = Math.abs(T[0][2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
    Nn[0] = norm(cross(T[0], up)) || [0, 1, 0];
    B[0] = cross(T[0], Nn[0]);
    for (let i = 1; i < N; i++) {
      const prev = Nn[i - 1];
      let nn = norm(sub3(prev, T[i].map((x) => x * dot(prev, T[i]))));
      if (!nn) nn = norm(cross(T[i], up)) || prev;
      Nn[i] = nn; B[i] = cross(T[i], nn);
    }
    const d = tb.data;
    let o = 0;
    const R0 = tb.r;
    const put = (px, py, pz, nx, ny, nz) => { d[o++] = px; d[o++] = py; d[o++] = pz; d[o++] = nx; d[o++] = ny; d[o++] = nz; };
    // rounded head (hemisphere pointing away from the trail)
    for (let j = K; j >= 1; j--) {
      const phi = (j / K) * Math.PI / 2, s = Math.sin(phi), c = Math.cos(phi);
      const cx = P[0][0] - T[0][0] * R0 * s, cy = P[0][1] - T[0][1] * R0 * s, cz = P[0][2] - T[0][2] * R0 * s;
      for (let m = 0; m <= M; m++) {
        const th = (m / M) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th);
        const dx = ct * Nn[0][0] + st * B[0][0], dy = ct * Nn[0][1] + st * B[0][1], dz = ct * Nn[0][2] + st * B[0][2];
        put(cx + dx * R0 * c, cy + dy * R0 * c, cz + dz * R0 * c, dx * c - T[0][0] * s, dy * c - T[0][1] * s, dz * c - T[0][2] * s);
      }
    }
    // body, tapering to a point at the tail
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const rr = R0 * Math.pow(1 - u, 0.72);
      for (let m = 0; m <= M; m++) {
        const th = (m / M) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th);
        const dx = ct * Nn[i][0] + st * B[i][0], dy = ct * Nn[i][1] + st * B[i][1], dz = ct * Nn[i][2] + st * B[i][2];
        put(P[i][0] + dx * rr, P[i][1] + dy * rr, P[i][2] + dz * rr, dx, dy, dz);
      }
    }
  }
  render() {
    const gl = this.gl, L = this.loc;
    if (!this.proj) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(L.uProj, false, this.proj);
    gl.uniformMatrix4fv(L.uView, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -this.camZ, 1]));
    gl.uniform3f(L.uCam, 0, 0, this.camZ);
    const t = this.t;
    const lp = [], lc = [];
    for (let i = 0; i < 4; i++) {
      lp.push(Math.cos(t * 0.3 + i * 1.57) * this.halfW * 0.8, Math.sin(t * 0.4 + i) * this.halfH * 0.8, 4.0);
      lc.push(...this.lights[i]);
    }
    gl.uniform3fv(L.uLP, new Float32Array(lp));
    gl.uniform3fv(L.uLC, new Float32Array(lc));
    this.tubes.forEach((tb) => {
      this.geometry(tb);
      gl.bindBuffer(gl.ARRAY_BUFFER, tb.vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, tb.data);
    });
    const bind = (tb) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, tb.vbo);
      gl.enableVertexAttribArray(L.aPos); gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(L.aNor); gl.vertexAttribPointer(L.aNor, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tb.ibo);
    };
    const px = (x, y) => [x * 2 / this.cssW, y * 2 / this.cssH];
    // soft neumorphic shadows: dark to the bottom-right, light to the top-left
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(L.uMode, 1);
    const passes = [
      { col: [0.55, 0.60, 0.70], a: 0.46, inflate: 0.07, shift: px(13, -16) },
      { col: [1, 1, 1], a: 0.85, inflate: 0.05, shift: px(-9, 10) }
    ];
    passes.forEach((ps) => {
      gl.uniform3fv(L.uColor, ps.col); gl.uniform1f(L.uAlpha, ps.a); gl.uniform1f(L.uInflate, ps.inflate); gl.uniform2fv(L.uShift, ps.shift);
      this.tubes.forEach((tb) => { bind(tb); gl.drawElements(gl.TRIANGLES, tb.count, gl.UNSIGNED_SHORT, 0); });
    });
    // the tubes themselves
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.uniform1f(L.uMode, 0); gl.uniform1f(L.uInflate, 0); gl.uniform2f(L.uShift, 0, 0);
    this.tubes.forEach((tb) => { gl.uniform3fv(L.uColor, tb.col); bind(tb); gl.drawElements(gl.TRIANGLES, tb.count, gl.UNSIGNED_SHORT, 0); });
  }
  destroy() { this.stop(); this.ro.disconnect(); window.removeEventListener('pointermove', this.onPointer); window.removeEventListener('pointerdown', this.onPointer); }
}
