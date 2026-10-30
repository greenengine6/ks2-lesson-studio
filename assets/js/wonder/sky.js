/* Skies for Extreme weather, drawn live on the graphics card (WebGL). A deck of cloud seen from below, in perspective,
   drifting with the wind; in a storm, ragged low cloud racing underneath and rain hanging in grey veils near the
   horizon; lightning lighting the clouds up from inside; and, for the monsoon, the sea in perspective with waves
   rolling in (white horses when the wind is strong) and the sun glittering on it.
   Drawn smaller than the screen and scaled up (clouds are soft), at most 30 times a second (every frame while
   lightning flickers), with fewer pixels on a slow computer, and not at all while the tab is hidden. Without WebGL the
   same picture is worked out once in JavaScript and stays still. */
import { NOISE, compile } from './hurricane.js?v=cdc164df';
import { noise, layer, clamp } from './util.js?v=cdc164df';

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uT; uniform float uHz;
uniform float uCover; uniform float uWind; uniform float uScud; uniform float uVeil; uniform float uSnow;
uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uLit; uniform vec3 uBase;
uniform vec4 uFlash; uniform vec3 uSun;
uniform float uSea; uniform float uWave; uniform vec3 uSeaN; uniform vec3 uSeaF;
${NOISE}
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm3(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * sn(p); p = M * p + 3.1; a *= 0.5; } return s; }
/* the cloud on the deck: broad soft shapes (lo), and rounded lumps on them (hi: |noise| makes puffs with soft
   creases between them; far away (fade 1) the finest lumps are left out, so they do not shimmer) */
vec2 warp(vec2 P) { vec2 q = P * 1.05; return q + 0.16 * vec2(sn(q * 0.5 + 1.7), sn(q * 0.5 + 9.2)); }
float lo(vec2 q) { return 0.56 * sn(q) + 0.3 * sn(M * q + 3.1); }
float hi(vec2 q, float fade) {
  q = M * q * 1.25 + 3.1;
  float s = 0.0, a = 0.3;
  for (int i = 0; i < 3; i++) { float v = sn(q); s += a * (sqrt(v * v + 0.015) - 0.36) * (1.0 - fade * (0.35 + 0.3 * float(i))); q = M * q + 3.1; a *= 0.5; }
  return s;
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  float H = uRes.y, cx = 0.5 * uRes.x, sky = max(1.0, H - uHz), F = sky * 1.75;   // F: the camera's focal length in pixels (the top of the sky is about 30 degrees up)
  vec3 col;
  if (fc.y >= uHz) {
    float up = max(0.5, fc.y - uHz), e = clamp(up / sky, 0.0, 1.0);
    col = mix(uHor, uZen, pow(e, 0.6));
    // the deck of cloud, overhead: where this pixel's line of sight meets it (z: how far away)
    vec2 P = vec2((fc.x - cx) / up, F / up);
    float z = P.y, fade = smoothstep(3.0, 9.0, z);
    P.x += uT * uWind * 0.03;
    vec2 q = warp(P);
    float l0 = lo(q), n = l0 + hi(q, fade), l1 = lo(warp(P + vec2(0.12, -0.08)));
    float thr = 1.0 - uCover, m = 0.5 + 0.62 * n;
    float d = smoothstep(thr - 0.1, thr + 0.28, m);                 // how much cloud
    float thick = smoothstep(thr, thr + 0.66, m);                    // how thick: thick cloud is dark underneath
    float shade = clamp(0.5 + (l0 - l1) * 3.2, 0.0, 1.0);            // the big shapes facing the light, or away from it
    vec3 cc = mix(uLit, uBase, pow(thick, 0.8)) * mix(0.82, 1.1, shade);
    cc += uLit * 0.22 * d * (1.0 - thick);                           // thin edges let the light through
    col = mix(col, cc, d);
    if (uScud > 0.0) {                                               // low ragged cloud racing along underneath
      vec2 S2 = vec2((fc.x - cx) / up * 1.6 + uT * uWind * 0.09, F / up * 1.6 + 9.0);
      float s2 = fbm3(S2 * 1.4 + vec2(0.7 * sn(S2 * 0.8), 0.0));
      col = mix(col, uBase * 0.8, smoothstep(0.1, 0.5, s2) * uScud * smoothstep(0.03, 0.35, e) * 0.8);
    }
    col = mix(col, uHor, (1.0 - exp(-max(0.0, z - 1.6) * 0.11)) * 0.92);   // haze towards the horizon
    if (uVeil > 0.0) {                                               // rain hanging under the clouds in soft grey veils
      float v = sn(vec2(((fc.x - cx) / H + (1.0 - e) * uWind * 0.12) * 3.2 + uT * uWind * 0.01, 5.0 + e * 0.6));
      col = mix(col, mix(uBase, uHor, 0.6), uVeil * smoothstep(0.55, 0.0, e) * smoothstep(-0.3, 0.6, v) * 0.55);
    }
    if (uSun.z > 0.0) {                                              // the sun, through thin cloud
      float sd = length(fc - uSun.xy) / H;
      col += vec3(1.0, 0.93, 0.78) * uSun.z * (exp(-sd * 10.0) * 0.55 + exp(-sd * 2.4) * 0.2) * (1.0 - 0.7 * d * thick);
    }
    if (uFlash.w > 0.0) {                                            // lightning: the cloud lit up from inside
      vec2 dv = (fc - uFlash.xy) / uFlash.z;
      col += vec3(0.78, 0.83, 1.0) * uFlash.w * (0.16 + exp(-dot(dv, dv)) * (0.35 + 0.9 * d * thick));
    }
    col = mix(col, uHor, uSnow * 0.5);
  } else if (uSea > 0.5) {
    // the sea: where this pixel's line of sight meets the water (qy: how far away), waves rolling in towards us
    float dep = max(0.5, uHz - fc.y), qx = (fc.x - cx) / dep, qy = F / dep, step = F / (dep * dep);   // step: how far qy moves from one row of pixels to the next
    float tt = uT * (0.8 + 0.6 * uWave), bend = sn(vec2(qx * 1.6, qy * 2.2));
    float p1 = qy * 30.0 + qx * 2.0 + bend * 2.0 + tt * 1.7, p2 = qy * 52.0 - qx * 4.5 + bend * 1.3 + tt * 2.4;
    float g1 = clamp(1.6 - 30.0 * step, 0.0, 1.0), g2 = clamp(1.6 - 52.0 * step, 0.0, 1.0);   // a wave finer than the pixels fades out
    float slope = (cos(p1) * g1 * 0.6 + cos(p2) * g2 * 0.4) * (0.35 + 0.65 * uWave);
    float ch = fbm3(vec2(qx * 5.0, qy * 8.0) + vec2(0.0, tt * 0.25)) * clamp(1.5 - 8.0 * step, 0.0, 1.0);
    float far = 1.0 - clamp(dep / max(1.0, uHz), 0.0, 1.0);
    vec3 water = mix(uSeaN, uSeaF, far * far);
    vec3 refl = mix(uHor, uZen, 0.2);
    col = mix(water, refl, clamp(mix(0.1, 0.78, pow(far, 3.0)) - slope * 0.18 + ch * 0.05, 0.0, 1.0));
    col *= 0.94 + 0.1 * ch - 0.06 * slope;
    float crest = smoothstep(0.7, 1.0, sin(p1)) * g1 * smoothstep(-0.2, 0.4, ch + 0.3 * bend);
    col = mix(col, vec3(0.92, 0.95, 0.97), crest * uWave * 0.8);    // white horses
    if (uSun.z > 0.0) {                                              // sunlight glittering below the sun
      float dx = (fc.x - uSun.x) / H;
      col += vec3(1.0, 0.95, 0.82) * uSun.z * exp(-dx * dx / (0.0015 + (1.0 - far) * 0.03)) * smoothstep(0.55, 1.0, 0.5 + 0.5 * sin(p2) + ch * 0.4) * 0.9;
    }
    if (uFlash.w > 0.0) col += vec3(0.7, 0.75, 0.9) * uFlash.w * 0.22;
    col = mix(col, uHor, exp(-dep / (uHz * 0.05 + 1.0)) * 0.75);    // haze at the horizon
  } else {
    col = uHor;
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const NAMES = ['uRes', 'uT', 'uHz', 'uCover', 'uWind', 'uScud', 'uVeil', 'uSnow', 'uZen', 'uHor', 'uLit', 'uBase', 'uFlash', 'uSun', 'uSea', 'uWave', 'uSeaN', 'uSeaF'];

/* ---------------- without WebGL: the same picture, worked out once, small ---------------- */
const sn = (x, y) => noise(x, y) * 2 - 1;
function fbm(x, y, o) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * sn(x, y); const nx = 1.6 * x - 1.2 * y + 3.1, ny = 1.2 * x + 1.6 * y + 3.1; x = nx; y = ny; a *= 0.5; } return s; }
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function picture(w, h, o) {
  const W = 220, Hh = Math.max(40, Math.round(W * h / w)), c = layer(W, Hh), g = c.getContext('2d'), img = g.createImageData(W, Hh), D = img.data;
  const hz = Hh - o.hz / h * Hh;                                    // the horizon, counted from the bottom as in the shader
  for (let j = 0; j < Hh; j++) {
    const fy = Hh - j - 0.5;
    for (let i = 0; i < W; i++) {
      const xs = (i + 0.5 - W / 2) / Hh;
      let col;
      if (fy >= hz || !o.sea) {
        const e = Math.max(0, (fy - hz) / Math.max(1, Hh - hz)), z = 1 / (e + 0.045);
        const sky = mixc(o.hor, o.zen, Math.pow(e, 0.55));
        const px = xs * z * 1.1 * 1.15, py = (z * 0.62 + 2) * 1.15;
        const n = fbm(px + 0.3 * fbm(px + 3.1, py + 1.7, 2), py + 0.3 * fbm(px - 2.3, py + 5.9, 2), 5);
        const thr = 1 - o.cover, m = 0.5 + 0.62 * n, d = sstep(thr - 0.05, thr + 0.2, m), thick = sstep(thr, thr + 0.62, m);
        let cc = mixc(o.lit, o.base, Math.pow(thick, 0.8)); cc = mixc(cc, o.lit, 0.22 * d * (1 - thick));
        col = mixc(mixc(sky, cc, d), o.hor, (1 - Math.exp(-z * 0.05)) * 0.88);
        col = mixc(col, o.hor, (o.snow || 0) * 0.5);
      } else {
        const e = (hz - fy) / Math.max(1, hz), z = 1 / (e + 0.014);
        col = mixc(mixc(o.seaN, o.seaF, Math.pow(1 - e, 2)), mixc(o.hor, o.zen, 0.25), 0.12 + 0.73 * Math.pow(1 - e, 4));
        const sw = Math.sin(z * 2.4 + 1.6 * sn(xs * z * 0.2, z * 0.3)) * sstep(0.03, 0.14, e);
        col = mixc(col, [0.93, 0.96, 0.98], sstep(0.7, 1, sw) * (o.wave || 0) * 0.6);
        col = mixc(col, o.hor, (1 - Math.exp(-z * 0.03)) * 0.8);
      }
      const k = (j * W + i) * 4;
      D[k] = clamp(col[0] * 255, 0, 255); D[k + 1] = clamp(col[1] * 255, 0, 255); D[k + 2] = clamp(col[2] * 255, 0, 255); D[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* o (colours are [r, g, b] from 0 to 1; positions in CSS pixels from the top left):
   hz the horizon; cover 0 clear … 1 overcast; wind the clouds' drift (+ to the right); scud, veil, snow 0 … 1;
   zen, hor the sky overhead and at the horizon; lit, base the clouds' lit edges and shaded bases;
   flash [x, y, radius, strength]; sun [x, y, strength]; sea true for the sea below the horizon, wave 0 calm … 1 rough,
   seaN, seaF the sea near and far; key: changes when the picture should be worked out again (without WebGL). */
export function makeSky() {
  const S = {
    gl: null, cv: null, U: null, tried: false, lost: false, last: -1, scale: 1, frames: [], pic: null, picKey: '', lit: false,
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
        this.U = NAMES.reduce((u, n) => { u[n] = gl.getUniformLocation(p, n); return u; }, {});
        cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
        cv.addEventListener('webglcontextrestored', () => { this.gl = null; this.tried = false; this.lost = false; });
        this.gl = gl; this.cv = cv;
      } catch (e) { this.gl = null; }
    },
    /* a slow computer: fewer pixels (judged from how often the screen is being redrawn) */
    pace() {
      const now = performance.now(), f = this.frames;
      f.push(now); if (f.length > 40) f.shift();
      if (f.length === 40) { const fps = 39000 / (f[39] - f[0]); if (fps < 24 && this.scale > 0.3) { this.scale *= 0.8; this.frames = []; } else if (fps < 12 && !window.__softGL) { this.gl = null; } }   // still too slow at the fewest pixels: the still picture instead
    },
    draw(ctx, w, h, t, o) {
      if (!this.tried) this.setup();
      const fl = o.flash || [0, 0, 1, 0], on = fl[3] > 0.004;
      if (this.webgl) {
        this.pace();
        const gl = this.gl, cv = this.cv, U = this.U, s = Math.min(1, Math.sqrt(0.5e6 * this.scale / (w * h))), W = Math.max(64, Math.round(w * s)), Hh = Math.max(64, Math.round(h * s));
        if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; this.last = -1; }
        if (t - this.last > 1 / 30 || this.last < 0 || on || this.lit) {
          const v3 = (n, c) => gl.uniform3f(U[n], c[0], c[1], c[2]), sun = o.sun || [0, 0, 0];
          gl.viewport(0, 0, W, Hh);
          gl.uniform2f(U.uRes, W, Hh); gl.uniform1f(U.uT, t); gl.uniform1f(U.uHz, (h - o.hz) * s);
          gl.uniform1f(U.uCover, o.cover); gl.uniform1f(U.uWind, o.wind || 0); gl.uniform1f(U.uScud, o.scud || 0); gl.uniform1f(U.uVeil, o.veil || 0); gl.uniform1f(U.uSnow, o.snow || 0);
          v3('uZen', o.zen); v3('uHor', o.hor); v3('uLit', o.lit); v3('uBase', o.base);
          gl.uniform4f(U.uFlash, fl[0] * s, (h - fl[1]) * s, Math.max(1, fl[2] * s), fl[3]);
          gl.uniform3f(U.uSun, sun[0] * s, (h - sun[1]) * s, sun[2]);
          gl.uniform1f(U.uSea, o.sea ? 1 : 0); gl.uniform1f(U.uWave, o.wave || 0); v3('uSeaN', o.seaN || o.hor); v3('uSeaF', o.seaF || o.hor);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          this.last = t;
        }
        this.lit = on;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(cv, 0, 0, w, h);
        return;
      }
      const key = [w, h, Math.round(o.hz), o.key].join('|');
      if (this.picKey !== key) { this.pic = picture(w, h, o); this.picKey = key; }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.pic, 0, 0, w, h);
      if (on) {                                                       // lightning, without WebGL: a glow in the cloud
        const g = ctx.createRadialGradient(fl[0], fl[1], 0, fl[0], fl[1], fl[2] * 1.6);
        g.addColorStop(0, 'rgba(205,215,255,' + (0.75 * fl[3]).toFixed(3) + ')'); g.addColorStop(1, 'rgba(205,215,255,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, Math.max(0, o.hz)); ctx.restore();
      }
    }
  };
  return S;
}
