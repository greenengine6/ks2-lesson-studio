/* Neon tubes that follow the pointer, after Kevin Levron's TubesCursor (threejs-components), rebuilt in plain WebGL
   with no libraries: glossy tubes lit by four coloured point lights that travel with the pointer, depth-tested so the
   tubes weave in front of and behind each other, then a two-level bloom for the neon glow. When nobody moves the mouse
   the tubes wander on their own. Click (or tap) for new colours. API: start(), stop(), still(), nextPalette(),
   setColors(list), setLightsColors(list), resize(), destroy(). */

const TUBE_VS = 'attribute vec3 aPos; attribute vec3 aNor; uniform mat4 uPV; varying vec3 vPos; varying vec3 vNor;' +
  'void main(){ vPos = aPos; vNor = aNor; gl_Position = uPV * vec4(aPos, 1.0); }';
const TUBE_FS = `precision highp float;
varying vec3 vPos; varying vec3 vNor;
uniform vec3 uColor; uniform vec3 uCam; uniform vec3 uLPos[4]; uniform vec3 uLCol[4]; uniform float uLInt;
void main(){
  vec3 N = normalize(vNor);
  vec3 V = normalize(uCam - vPos);
  vec3 col = uColor * 0.045;
  for (int i = 0; i < 4; i++) {
    vec3 lv = uLPos[i] - vPos;
    float d2 = dot(lv, lv);
    vec3 L = lv * inversesqrt(d2);
    float att = uLInt / (1.0 + d2 * 0.9);
    float diff = max(dot(N, L), 0.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 42.0);
    col += uLCol[i] * att * (uColor * diff * 0.7 + mix(uColor, vec3(1.0), 0.45) * spec * 1.7);
  }
  float fr = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  col += uColor * (fr * 0.75 + 0.07);
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.4545)), 1.0);
}`;
const QUAD_VS = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
const BRIGHT_FS = `precision mediump float; varying vec2 vUv; uniform sampler2D t; uniform vec2 px; uniform float thr;
vec3 s(vec2 o){ return texture2D(t, vUv + o * px).rgb; }
void main(){
  vec3 c = (s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0)) + s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0))) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = thr > 0.0 ? smoothstep(thr, thr + 0.35, l) : 1.0;
  gl_FragColor = vec4(c * k, 1.0);
}`;
const BLUR_FS = `precision mediump float; varying vec2 vUv; uniform sampler2D t; uniform vec2 dir;
void main(){
  vec3 c = texture2D(t, vUv).rgb * 0.2270270270;
  c += texture2D(t, vUv + dir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(t, vUv - dir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(t, vUv + dir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(t, vUv - dir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;
const COMP_FS = `precision mediump float; varying vec2 vUv; uniform sampler2D tS; uniform sampler2D tA; uniform sampler2D tB; uniform float uB1; uniform float uB2; uniform vec2 uAsp;
void main(){
  vec3 c = texture2D(tS, vUv).rgb;
  vec3 b = texture2D(tA, vUv).rgb * uB1 + texture2D(tB, vUv).rgb * uB2;
  c = c + b * (1.0 - c * 0.5);
  vec2 q = (vUv - 0.5) * uAsp;
  c += vec3(0.020, 0.024, 0.052) * (1.0 - smoothstep(0.0, 0.95, length(q)));
  c *= 1.0 - 0.32 * smoothstep(0.35, 1.05, length(q));
  gl_FragColor = vec4(c, 1.0);
}`;

const BG = [0.031, 0.039, 0.071];
const DEFAULTS = { colors: ['#f967fb', '#53bc28', '#6958d5'], lights: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'], intensity: 1.15 };

function hexLin(h) {
  const n = parseInt(String(h).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2));
}
function hslHex(hh, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + hh / 30) % 12; const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}
function vivid(n) {
  const start = Math.random() * 360, step = 360 / n;
  return Array.from({ length: n }, (_, i) => hslHex((start + i * step + (Math.random() - 0.5) * step * 0.6) % 360, 0.78 + Math.random() * 0.2, 0.52 + Math.random() * 0.12));
}
function perspective(fov, asp, near, far) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

export class Tubes {
  constructor(canvas, opts) {
    this.canvas = canvas;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.o = Object.assign({ count: small ? 7 : 9, points: small ? 72 : 92, sub: 2, radial: small ? 12 : 14, camZ: 5, fov: 50 }, DEFAULTS, opts || {});
    this.small = small;
    this.running = false; this.raf = 0;
    this.t = 0; this.acc = 0; this.last = 0;
    this.pointer = null; this.lastMove = -1e9;
    this.colors = this.o.colors.map(hexLin);
    this.lights = this.o.lights.map(hexLin);
    this.initGL();
    this.initSim();
    this.onMove = (e) => this.pointerAt(e.clientX, e.clientY);
    this.onDown = (e) => this.pointerAt(e.clientX, e.clientY);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerdown', this.onDown, { passive: true });
    this.ro = new ResizeObserver(() => { this.resize(); if (!this.running) this.render(); });
    this.ro.observe(canvas);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; this.stop(); canvas.classList.add('tubes-off'); });
    this.resize();
    for (let i = 0; i < 260; i++) this.step(1 / 60);    // warm up so the tubes are already flowing on first paint
  }

  /* ---------------- WebGL setup ---------------- */
  initGL() {
    const c = this.canvas, attrs = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' };
    let gl = c.getContext('webgl2', attrs), v2 = !!gl;
    if (!gl) gl = c.getContext('webgl', attrs) || c.getContext('experimental-webgl', attrs);
    if (!gl) throw new Error('no webgl');
    this.gl = gl; this.v2 = v2;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
    const prog = (vs, fs, names) => {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, names[0]); if (names[1]) gl.bindAttribLocation(p, 1, names[1]);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link');
      const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, info.name); }
      return { p, u };
    };
    this.pTube = prog(TUBE_VS, TUBE_FS, ['aPos', 'aNor']);
    this.pBright = prog(QUAD_VS, BRIGHT_FS, ['p']);
    this.pBlur = prog(QUAD_VS, BLUR_FS, ['p']);
    this.pComp = prog(QUAD_VS, COMP_FS, ['p']);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    // tube mesh: one vertex buffer for all tubes, one shared index buffer
    const o = this.o;
    this.rings = (o.points - 1) * o.sub + 1;
    this.vpt = this.rings * o.radial;                     // vertices per tube
    this.verts = new Float32Array(this.vpt * o.count * 6);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.verts.byteLength, gl.DYNAMIC_DRAW);
    const idx = [];
    for (let j = 0; j < this.rings - 1; j++) for (let k = 0; k < o.radial; k++) {
      const a = j * o.radial + k, b = j * o.radial + (k + 1) % o.radial, c2 = a + o.radial, d = b + o.radial;
      idx.push(a, c2, b, b, c2, d);
    }
    this.nIdx = idx.length;
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    this.cosT = new Float32Array(o.radial); this.sinT = new Float32Array(o.radial);
    for (let k = 0; k < o.radial; k++) { const a = k / o.radial * Math.PI * 2; this.cosT[k] = Math.cos(a); this.sinT[k] = Math.sin(a); }
    this.samples = 1;
    if (v2) { try { this.samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 1); } catch (e) { this.samples = 1; } }
    this.fb = null;
  }
  tex(w, h) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  target(w, h, depth) {
    const gl = this.gl, f = gl.createFramebuffer(), t = this.tex(w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    let rb = null;
    if (depth) { rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); }
    return { f, t, rb, w, h };
  }
  freeTargets() {
    const gl = this.gl, F = this.fb;
    if (!F) return;
    [F.scene, F.a, F.b, F.c, F.d].forEach((x) => { if (!x) return; gl.deleteFramebuffer(x.f); gl.deleteTexture(x.t); if (x.rb) gl.deleteRenderbuffer(x.rb); });
    if (F.ms) { gl.deleteFramebuffer(F.ms.f); gl.deleteRenderbuffer(F.ms.c); gl.deleteRenderbuffer(F.ms.d); }
    this.fb = null;
  }
  makeTargets(w, h) {
    const gl = this.gl;
    this.freeTargets();
    const F = {};
    F.scene = this.target(w, h, !(this.v2 && this.samples > 1));
    if (this.v2 && this.samples > 1) {
      const f = gl.createFramebuffer(), c = gl.createRenderbuffer(), d = gl.createRenderbuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.bindRenderbuffer(gl.RENDERBUFFER, c); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, c);
      gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) F.ms = { f, c, d };
      else { gl.deleteFramebuffer(f); gl.deleteRenderbuffer(c); gl.deleteRenderbuffer(d); this.samples = 1; gl.deleteFramebuffer(F.scene.f); gl.deleteTexture(F.scene.t); F.scene = this.target(w, h, true); }
    }
    const qw = Math.max(1, Math.round(w / 4)), qh = Math.max(1, Math.round(h / 4));
    const ew = Math.max(1, Math.round(w / 8)), eh = Math.max(1, Math.round(h / 8));
    F.a = this.target(qw, qh); F.b = this.target(qw, qh); F.c = this.target(ew, eh); F.d = this.target(ew, eh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.fb = F;
  }
  resize() {
    if (this.lost) return;
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.small ? 1.5 : 1.6);
    const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    this.cssW = r.width; this.cssH = r.height;
    this.halfH = Math.tan(this.o.fov * Math.PI / 360) * this.o.camZ;
    this.halfW = this.halfH * (r.width / r.height);
    if (this.canvas.width !== w || this.canvas.height !== h || !this.fb) {
      this.canvas.width = w; this.canvas.height = h;
      this.makeTargets(w, h);
    }
  }

  /* ---------------- simulation ---------------- */
  initSim() {
    const o = this.o;
    this.tubes = [];
    for (let i = 0; i < o.count; i++) {
      const u = i / o.count;
      this.tubes.push({
        h: [0, 0, 0], v: [0, 0, 0],
        k: 0.011 + 0.022 * ((i * 0.618) % 1),
        damp: 0.9 + 0.05 * ((i * 0.377) % 1),
        r: 0.28 + 0.8 * ((i * 0.71 + 0.13) % 1),
        w: (1.15 + 1.25 * ((i * 0.53 + 0.29) % 1)) * (i % 3 ? 1 : -1),
        ph: u * Math.PI * 2,
        zr: 0.3 + 0.7 * ((i * 0.41 + 0.5) % 1),
        rad: 0.03 + 0.032 * ((i * 0.83 + 0.21) % 1),
        tint: 0.82 + 0.3 * ((i * 0.29 + 0.4) % 1),
        hist: new Float32Array(o.points * 3), head: 0
      });
    }
    this.goal = [0, 0, 0]; this.lp = [0, 0, 0];
    this.path = new Float32Array(this.rings * 3);
  }
  pointerAt(x, y) {
    if (!this.cssW) return;
    const r = this.canvas.getBoundingClientRect();
    if (y < r.top || y > r.bottom || x < r.left || x > r.right) return;
    this.pointer = [((x - r.left) / r.width * 2 - 1) * this.halfW, -((y - r.top) / r.height * 2 - 1) * this.halfH];
    this.lastMove = this.t;
  }
  autoGoal(t) {
    const W = this.halfW || 3, H = this.halfH || 2.3, portrait = W < H;
    const cx = portrait ? 0 : W * 0.22, cy = portrait ? H * 0.5 : H * 0.12;
    return [cx + Math.sin(t * 0.43) * W * (portrait ? 0.7 : 0.56) + Math.sin(t * 0.97 + 1.3) * W * 0.14,
      cy + Math.sin(t * 0.61 + 0.7) * H * (portrait ? 0.28 : 0.42) + Math.cos(t * 1.21) * H * 0.1, 0];
  }
  step(dt) {
    this.t += dt;
    const t = this.t;
    const idle = !this.pointer || t - this.lastMove > 2.6;
    const g = idle ? this.autoGoal(t) : [this.pointer[0], this.pointer[1], 0];
    const ease = idle ? 0.03 : 0.16;
    for (let a = 0; a < 3; a++) this.goal[a] += (g[a] - this.goal[a]) * ease;
    for (let a = 0; a < 3; a++) this.lp[a] += (this.goal[a] - this.lp[a]) * 0.08;
    const P = this.o.points;
    for (const tb of this.tubes) {
      const ang = t * tb.w + tb.ph;
      const tx = this.goal[0] + Math.cos(ang) * tb.r, ty = this.goal[1] + Math.sin(ang) * tb.r * 0.85, tz = Math.sin(ang * 0.7 + tb.ph) * tb.zr;
      tb.v[0] = (tb.v[0] + (tx - tb.h[0]) * tb.k) * tb.damp;
      tb.v[1] = (tb.v[1] + (ty - tb.h[1]) * tb.k) * tb.damp;
      tb.v[2] = (tb.v[2] + (tz - tb.h[2]) * tb.k) * tb.damp;
      tb.h[0] += tb.v[0]; tb.h[1] += tb.v[1]; tb.h[2] += tb.v[2];
      tb.head = (tb.head + 1) % P;
      tb.hist[tb.head * 3] = tb.h[0]; tb.hist[tb.head * 3 + 1] = tb.h[1]; tb.hist[tb.head * 3 + 2] = tb.h[2];
    }
  }

  /* ---------------- geometry ---------------- */
  build(tb, out, base) {
    const o = this.o, P = o.points, S = o.sub, R = this.rings, path = this.path, rad = o.radial;
    // newest first: control point i = hist[head - i]
    const cp = (i, a) => { const j = (tb.head - Math.max(0, Math.min(P - 1, i)) + P * 2) % P; return tb.hist[j * 3 + a]; };
    let n = 0;
    for (let i = 0; i < P - 1; i++) {
      for (let s = 0; s < S; s++) {
        const u = s / S, u2 = u * u, u3 = u2 * u;
        for (let a = 0; a < 3; a++) {
          const p0 = cp(i - 1, a), p1 = cp(i, a), p2 = cp(i + 1, a), p3 = cp(i + 2, a);
          path[n * 3 + a] = 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
        }
        n++;
      }
    }
    for (let a = 0; a < 3; a++) path[n * 3 + a] = cp(P - 1, a);
    // parallel-transport frames and rings
    let tx = 1, ty = 0, tz = 0, nx = 0, ny = 1, nz = 0;
    for (let j = 0; j < R; j++) {
      const jp = Math.min(R - 1, j + 1), jm = Math.max(0, j - 1);
      let dx = path[jp * 3] - path[jm * 3], dy = path[jp * 3 + 1] - path[jm * 3 + 1], dz = path[jp * 3 + 2] - path[jm * 3 + 2];
      const dl = Math.hypot(dx, dy, dz);
      if (dl > 1e-6) { tx = dx / dl; ty = dy / dl; tz = dz / dl; }
      if (j === 0) { nx = -ty; ny = tx; nz = 0; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (l < 1e-3) { nx = 0; ny = 0; nz = 1; } }
      const dot = nx * tx + ny * ty + nz * tz;
      nx -= tx * dot; ny -= ty * dot; nz -= tz * dot;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const s = j / (R - 1);
      const head = s < 0.03 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - s / 0.03, 2))) : 1;
      const tail = 1 - Math.pow(Math.max(0, (s - 0.45) / 0.55), 1.6);
      const r = tb.rad * Math.max(0.0001, head * tail);
      const px = path[j * 3], py = path[j * 3 + 1], pz = path[j * 3 + 2];
      for (let k = 0; k < rad; k++) {
        const c = this.cosT[k], sn = this.sinT[k];
        const ox = nx * c + bx * sn, oy = ny * c + by * sn, oz = nz * c + bz * sn;
        const q = base + (j * rad + k) * 6;
        out[q] = px + ox * r; out[q + 1] = py + oy * r; out[q + 2] = pz + oz * r;
        out[q + 3] = ox; out[q + 4] = oy; out[q + 5] = oz;
      }
    }
  }

  /* ---------------- drawing ---------------- */
  quadPass(prog, target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null);
    gl.viewport(0, 0, target ? target.w : this.canvas.width, target ? target.h : this.canvas.height);
    gl.useProgram(prog.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0); gl.disableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  bind(unit, tex, loc) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); }
  render() {
    if (this.lost || !this.fb) return;
    const gl = this.gl, F = this.fb, o = this.o, W = this.canvas.width, H = this.canvas.height;
    for (let i = 0; i < this.tubes.length; i++) this.build(this.tubes[i], this.verts, i * this.vpt * 6);
    // 1. scene (multisampled when WebGL2 allows it)
    gl.bindFramebuffer(gl.FRAMEBUFFER, F.ms ? F.ms.f : F.scene.f);
    gl.viewport(0, 0, W, H);
    gl.clearColor(BG[0], BG[1], BG[2], 1);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const pt = this.pTube;
    gl.useProgram(pt.p);
    const proj = perspective(o.fov * Math.PI / 180, W / H, 0.1, 30);
    proj[14] += proj[10] * -o.camZ; proj[15] += proj[11] * -o.camZ;     // proj * translate(0,0,-camZ)
    gl.uniformMatrix4fv(pt.u.uPV, false, new Float32Array(proj));
    gl.uniform3f(pt.u.uCam, 0, 0, o.camZ);
    const lp = new Float32Array(12), lc = new Float32Array(12), t = this.t;
    for (let k = 0; k < 4; k++) {
      const a = t * 0.55 + k * Math.PI / 2;
      lp[k * 3] = this.lp[0] + Math.cos(a) * 1.25; lp[k * 3 + 1] = this.lp[1] + Math.sin(a) * 0.95; lp[k * 3 + 2] = 1.1 + Math.sin(t * 0.7 + k) * 0.5;
      const L = this.lights[k % this.lights.length]; lc[k * 3] = L[0]; lc[k * 3 + 1] = L[1]; lc[k * 3 + 2] = L[2];
    }
    gl.uniform3fv(pt.u.uLPos, lp); gl.uniform3fv(pt.u.uLCol, lc);
    gl.uniform1f(pt.u.uLInt, o.intensity);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.verts);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
    for (let i = 0; i < this.tubes.length; i++) {
      const c = this.colors[i % this.colors.length], k = this.tubes[i].tint;
      gl.uniform3f(pt.u.uColor, c[0] * k, c[1] * k, c[2] * k);
      const off = i * this.vpt * 24;
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, off);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, off + 12);
      gl.drawElements(gl.TRIANGLES, this.nIdx, gl.UNSIGNED_SHORT, 0);
    }
    gl.disable(gl.DEPTH_TEST);
    if (F.ms) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, F.ms.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, F.scene.f);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
    // 2. bloom: bright pass to 1/4, blur; down to 1/8, blur
    gl.useProgram(this.pBright.p);
    this.bind(0, F.scene.t, this.pBright.u.t); gl.uniform2f(this.pBright.u.px, 1 / W, 1 / H); gl.uniform1f(this.pBright.u.thr, 0.16);
    this.quadPass(this.pBright, F.a);
    const blur = (src, dst, dx, dy) => { gl.useProgram(this.pBlur.p); this.bind(0, src.t, this.pBlur.u.t); gl.uniform2f(this.pBlur.u.dir, dx, dy); this.quadPass(this.pBlur, dst); };
    blur(F.a, F.b, 1 / F.a.w, 0); blur(F.b, F.a, 0, 1 / F.a.h);
    gl.useProgram(this.pBright.p);
    this.bind(0, F.a.t, this.pBright.u.t); gl.uniform2f(this.pBright.u.px, 0.5 / F.a.w, 0.5 / F.a.h); gl.uniform1f(this.pBright.u.thr, 0);
    this.quadPass(this.pBright, F.c);
    blur(F.c, F.d, 1 / F.c.w, 0); blur(F.d, F.c, 0, 1 / F.c.h);
    blur(F.c, F.d, 2 / F.c.w, 0); blur(F.d, F.c, 0, 2 / F.c.h);
    // 3. composite to the screen
    const pc = this.pComp;
    gl.useProgram(pc.p);
    this.bind(0, F.scene.t, pc.u.tS); this.bind(1, F.a.t, pc.u.tA); this.bind(2, F.c.t, pc.u.tB);
    gl.uniform1f(pc.u.uB1, 0.85); gl.uniform1f(pc.u.uB2, 1.15);
    const asp = W / H;
    gl.uniform2f(pc.u.uAsp, asp > 1 ? asp : 1, asp > 1 ? 1 : 1 / asp);
    this.quadPass(pc, null);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
  }
  frame(now) {
    this.raf = 0;
    if (!this.running) return;
    if (!this.last) this.last = now;
    let dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    this.acc += dt;
    let n = 0;
    while (this.acc >= 1 / 60 && n++ < 6) { this.step(1 / 60); this.acc -= 1 / 60; }
    this.render();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  start() { if (this.running || this.lost) return; this.running = true; this.last = 0; this.raf = requestAnimationFrame((t) => this.frame(t)); }
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  still() { this.stop(); this.render(); }
  setColors(list) { if (list && list.length) this.colors = list.map(hexLin); if (!this.running) this.render(); }
  setLightsColors(list) { if (list && list.length) this.lights = list.map(hexLin); if (!this.running) this.render(); }
  nextPalette() { this.setColors(vivid(3)); this.setLightsColors(vivid(4)); }
  destroy() {
    this.stop();
    window.removeEventListener('pointermove', this.onMove); window.removeEventListener('pointerdown', this.onDown);
    if (this.ro) this.ro.disconnect();
    this.freeTargets();
  }
}
