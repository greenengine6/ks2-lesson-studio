/* A hurricane seen from space, drawn live on the graphics card (WebGL): a big bright disc of cloud round a clear eye,
   broad rain bands curling in towards the middle, loose clouds and wisps at the edge, light and shade on the cloud
   tops, and the dark sea below with the sun glinting on it and the clouds' shadows across it. The inner clouds turn
   faster than the outer ones, as in a real storm. North of the equator it spins anticlockwise; south of it,
   clockwise (the picture is mirrored).
   It is drawn a little smaller than the screen and scaled up (clouds are soft), at most 30 new pictures a second,
   less often on a slow computer, and not at all while the tab is hidden. Without WebGL, a cloud picture worked out
   once in JavaScript turns instead. */
import { noise, layer, clamp } from './util.js?v=af1c9ebd';

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';
/* simplex noise: Ian McEwan and Stefan Gustavson (Ashima Arts), MIT licence */
export const NOISE = `
vec3 m289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 m289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 perm(vec3 x) { return m289(((x * 34.0) + 1.0) * x); }
float sn(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = m289(i);
  vec3 p = perm(perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform vec2 uC; uniform float uR; uniform float uT; uniform float uDir; uniform float uK;
${NOISE}
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm4(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * sn(p); p = M * p + 3.1; a *= 0.5; } return s; }
float fbm2(vec2 p) { return 0.5 * sn(p) + 0.25 * sn(M * p + 3.1); }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
/* The storm's shape (the eye, the eyewall, the bright middle and the rain bands) turns slowly as a whole.
   p: a point in the storm's own units (1 at its edge), r and lr: its distance from the middle and the log of it,
   n: the cloud texture there. */
float shape(vec2 p, float r, float lr, float n) {
  vec2 q = rot(p, -uT * 0.03);                                      // turning anticlockwise (mirrored: clockwise)
  vec2 sp = rot(q, 1.55 * lr);                                      // the bands' spiral
  float th = atan(sp.y, sp.x);
  float bands = smoothstep(0.36, 0.92, 0.5 + 0.5 * cos(2.0 * th + 1.8 * sn(sp * 0.9 + 7.0) + 0.6));
  float env = smoothstep(1.24, 0.6, r) * smoothstep(0.2, 0.44, r);
  float core = smoothstep(0.54, 0.2, r + 0.07 * sn(q * 2.3));       // the bright central disc of cloud
  float wall = exp(-pow((r - 0.1) / 0.03, 2.0));
  float d = core * (0.98 + 0.26 * n) + bands * env * (0.68 + 0.62 * n) + wall * 0.55;
  d += smoothstep(1.5, 0.8, r) * (1.0 - core) * max(0.0, n * 1.4 - 0.08) * 0.55;     // loose clouds and wisps further out
  d *= smoothstep(0.05, 0.084, r);                                  // the eye
  return clamp(d, 0.0, 1.25);
}
/* The cloud texture, carried round faster near the middle than further out. ph: how far it is through its cycle
   (two copies half a cycle apart are faded into each other, so it never winds up tight). */
float tex(vec2 p, float r, float lr, float ph, bool fine) {
  float om = 0.022 / (r + 0.08) - 0.02;
  vec2 wq = rot(p, -(uT * 0.03 + om * ph) + 0.85 * lr) * 2.6;
  return fine ? fbm4((wq + 0.45 * vec2(fbm2(wq + 1.3), fbm2(wq + 8.7))) * 1.5) : fbm2(wq * 1.5);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (fc - uC) / uR; p.x *= uDir;
  float r = length(p) + 1e-4, lr = log(r);
  float T = 6.0, f1 = fract(uT / T), f2 = fract(uT / T + 0.5), w1 = 0.5 - 0.5 * cos(6.2831853 * f1), ph1 = (f1 - 0.5) * T, ph2 = (f2 - 0.5) * T;
  float d = shape(p, r, lr, mix(tex(p, r, lr, ph2, true), tex(p, r, lr, ph1, true), w1));
  // light and shade from the big shapes (with the coarse texture, faded in the same way)
  vec2 L = normalize(vec2(-0.7, 0.62));
  vec3 Ln = normalize(vec3(L, 0.8));
  float e = 2.0 / uR;
  vec2 pa = p + vec2(e, 0.0), pb = p + vec2(0.0, e);
  float ra = length(pa) + 1e-4, rb = length(pb) + 1e-4, la = log(ra), lb = log(rb);
  float c0 = shape(p, r, lr, mix(tex(p, r, lr, ph2, false), tex(p, r, lr, ph1, false), w1));
  float ca = shape(pa, ra, la, mix(tex(pa, ra, la, ph2, false), tex(pa, ra, la, ph1, false), w1));
  float cb = shape(pb, rb, lb, mix(tex(pb, rb, lb, ph2, false), tex(pb, rb, lb, ph1, false), w1));
  vec2 g = vec2(ca - c0, cb - c0) / 2.0 * uK; g.x *= uDir;
  vec3 nrm = normalize(vec3(-g, 1.0));
  float lit = clamp(dot(nrm, Ln), 0.0, 1.0);
  vec3 cc = mix(vec3(0.58, 0.66, 0.77), vec3(1.0, 0.995, 0.975), lit * 0.82 + 0.18) * (0.9 + 0.12 * clamp(d, 0.0, 1.0));
  float al = smoothstep(0.07, 0.56, d);
  // the sea: deep blue, a soft sun glint, and the shadows of the clouds
  vec2 uv = fc / uRes, asp = vec2(uRes.x / uRes.y, 1.0);
  float on = fbm2(uv * asp * 3.0 + uT * 0.004);
  vec3 sea = mix(vec3(0.025, 0.105, 0.215), vec3(0.05, 0.19, 0.34), 0.5 + 0.5 * on);
  float gd = length((uv - vec2(0.76, 0.28)) * asp);
  sea += vec3(0.17, 0.21, 0.24) * exp(-gd * gd * 9.0);
  vec2 ps = p + vec2(L.x * uDir, L.y) * 0.045;                     // a cloud towards the sun shades this bit of sea
  float rs = length(ps) + 1e-4;
  sea *= 1.0 - 0.5 * smoothstep(0.1, 0.7, shape(ps, rs, log(rs), 0.0));
  vec3 col = mix(sea, cc, al);
  col = mix(col, vec3(0.62, 0.72, 0.83), 0.045);
  float vg = length((uv - 0.5) * asp); col *= 1.0 - 0.18 * smoothstep(0.45, 1.0, vg);
  gl_FragColor = vec4(col, 1.0);
}`;

export function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(e || 'shader'); }
  return s;
}

/* ---------------- without WebGL: a cloud picture worked out once, turned in two layers ---------------- */
function fbmJS(x, y, o) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * (noise(x, y) * 2 - 1); const nx = 1.6 * x - 1.2 * y + 3.1, ny = 1.2 * x + 1.6 * y + 3.1; x = nx; y = ny; a *= 0.5; } return s; }
function cloudsPicture(size) {
  const c = layer(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), D = img.data, half = size / 2;
  const rot = (x, y, a) => [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y];
  const dens = (px, py) => {
    const r = Math.hypot(px, py) + 1e-4, lr = Math.log(r), [sx, sy] = rot(px, py, 1.55 * lr), [tx, ty] = rot(px, py, 0.85 * lr), th = Math.atan2(sy, sx);
    const bw = 0.5 + 0.5 * Math.cos(2 * th + 1.8 * (noise(sx * 0.9 + 7, sy * 0.9 + 7) * 2 - 1) + 0.6), bands = clamp((bw - 0.36) / 0.56, 0, 1);
    const env = clamp((1.24 - r) / 0.64, 0, 1) * clamp((r - 0.2) / 0.24, 0, 1), core = clamp((0.54 - r) / 0.34, 0, 1), wall = Math.exp(-Math.pow((r - 0.1) / 0.03, 2));
    const n = fbmJS(tx * 3.9 + 20, ty * 3.9 + 20, 4);
    let d = core * (0.98 + 0.26 * n) + bands * env * (0.68 + 0.62 * n) + wall * 0.55;
    d += clamp((1.5 - r) / 0.7, 0, 1) * (1 - core) * Math.max(0, n * 1.4 - 0.08) * 0.55;
    d *= clamp((r - 0.05) / 0.034, 0, 1);
    return clamp(d, 0, 1.25);
  };
  const F = new Float32Array(size * size), U = half * 0.74;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) F[y * size + x] = dens((x - half) / U, (half - y) / U);
  for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
    const i = y * size + x, d = F[i], gx = (F[i + 1] - F[i - 1]) * 9, gy = (F[i - size] - F[i + size]) * 9;
    const nz = 1 / Math.hypot(gx, gy, 1), lit = clamp((-gx * -0.66 + -gy * 0.58 + 0.48) * nz / 0.9, 0, 1), k = lit * 0.82 + 0.18;
    const a = clamp((d - 0.07) / 0.49, 0, 1);
    D[i * 4] = Math.round(148 + 107 * k); D[i * 4 + 1] = Math.round(168 + 86 * k); D[i * 4 + 2] = Math.round(196 + 53 * k); D[i * 4 + 3] = Math.round(a * a * (3 - 2 * a) * 255);
  }
  g.putImageData(img, 0, 0);
  return { c, U: U / size };
}

export function makeHurricane() {
  const H = {
    gl: null, cv: null, U: null, tried: false, lost: false, last: -1, scale: 1, frames: [], pic: null, sea: null, seaKey: '',
    get webgl() { return !!(this.gl && !this.lost); },
    setup() {
      this.tried = true;
      if (window.__noWebGL) return;
      try {
        const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl');
        if (!gl) return;
        // drawn by the processor rather than a graphics card (a blocked or missing GPU): far too slow, so the still picture instead
        const dbg = gl.getExtension('WEBGL_debug_renderer_info'), ren = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
        if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(ren) && !window.__softGL) return;
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
        gl.useProgram(p);
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        this.U = ['uRes', 'uC', 'uR', 'uT', 'uDir', 'uK'].reduce((o, n) => { o[n] = gl.getUniformLocation(p, n); return o; }, {});
        cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
        cv.addEventListener('webglcontextrestored', () => { this.gl = null; this.tried = false; this.lost = false; });
        this.gl = gl; this.cv = cv;
      } catch (e) { this.gl = null; }
    },
    /* a slow computer: fewer pixels (judged from how often the screen is being redrawn) */
    pace() {
      const now = performance.now(), f = this.frames;
      f.push(now); if (f.length > 40) f.shift();
      if (f.length === 40) { const fps = 39000 / (f[39] - f[0]); if (fps < 24 && this.scale > 0.36) { this.scale *= 0.8; this.frames = []; } else if (fps < 12 && !window.__softGL) { this.gl = null; } }   // still too slow at the fewest pixels: the still picture instead
    },
    /* draw the storm over the whole screen: centre cx, cy, radius R (CSS pixels); south: mirrored */
    draw(ctx, w, h, cx, cy, R, t, south) {
      if (!this.tried) this.setup();
      if (this.webgl) {
        this.pace();
        const gl = this.gl, cv = this.cv, s = Math.min(1.5, Math.sqrt(0.85e6 * this.scale / (w * h))), W = Math.max(64, Math.round(w * s)), Hh = Math.max(64, Math.round(h * s));
        if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; this.last = -1; }
        if (t - this.last > 1 / 30 || this.last < 0) {
          gl.viewport(0, 0, W, Hh);
          gl.uniform2f(this.U.uRes, W, Hh); gl.uniform2f(this.U.uC, cx * s, Hh - cy * s); gl.uniform1f(this.U.uR, R * s);
          gl.uniform1f(this.U.uT, t); gl.uniform1f(this.U.uDir, south ? -1 : 1); gl.uniform1f(this.U.uK, Math.max(10, R * s * 0.075));
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          this.last = t;
        }
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(cv, 0, 0, w, h);
        return;
      }
      // without WebGL: the sea, then the clouds turning (the middle faster)
      const key = w + 'x' + h;
      if (this.seaKey !== key) {
        this.sea = layer(w, h); const g = this.sea.getContext('2d');
        const gr = g.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.6); gr.addColorStop(0, '#0C2E52'); gr.addColorStop(1, '#051628'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        const gl2 = g.createRadialGradient(w * 0.76, h * 0.72, 0, w * 0.76, h * 0.72, Math.min(w, h) * 0.4); gl2.addColorStop(0, 'rgba(120,150,170,.35)'); gl2.addColorStop(1, 'rgba(120,150,170,0)'); g.fillStyle = gl2; g.fillRect(0, 0, w, h);
        this.seaKey = key;
      }
      ctx.drawImage(this.sea, 0, 0, w, h);
      if (!this.pic) this.pic = cloudsPicture(420);
      const S = R / this.pic.U, dir = south ? -1 : 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, 1);
      ctx.save(); ctx.rotate(-t * 0.03); ctx.drawImage(this.pic.c, -S / 2, -S / 2, S, S); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R * 0.34, 0, Math.PI * 2); ctx.clip(); ctx.rotate(-t * 0.08); ctx.drawImage(this.pic.c, -S / 2, -S / 2, S, S); ctx.restore();
      ctx.restore();
    }
  };
  return H;
}
