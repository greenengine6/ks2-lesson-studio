/* The Earth behind the landing page: a real-time 3D globe made with three.js.

   - Lit by the Sun exactly where it is right now: the point under the Sun is worked out from today's date and the
     time (solar declination and sidereal time), so the day side, the night side with its city lights, and the
     orange line of sunrise and sunset are where they really are at this moment.
   - Surface: day colour, night lights, bump relief, sunlight glinting off the oceans only (a roughness mask), and
     a separate cloud layer above it that drifts slowly and shades the ground beneath.
   - Atmosphere: a custom shader with a Fresnel edge glow, blue on the day side and orange at twilight.
   - Stars, a soft glow where the Sun sits, and a faint satellite crossing the sky.
   - Laptops: drag to spin it, with momentum. Phones: tilt the phone and the view follows. The device's
     orientation (alpha, beta, gamma) becomes a quaternion, so there is no gimbal lock, and it is smoothed with
     spherical interpolation (slerp) so it never jitters. iPhones ask for permission first, from a tap.
   - Space sound (Web Audio): a low drone, solar wind that comes from the Sun's side, and the satellite's soft
     ping, placed in 3D around the listener (the camera), so they pan and fade as you turn. The drone's filter
     and the wind's loudness follow where you are looking (pitch, and day side or night side).
   - Light on phones: 2K textures (4K on laptops), the resolution adapts to keep it smooth, and it stops drawing
     when it is off screen or the tab is hidden.

   Earth textures: Solar System Scope (CC BY 4.0), based on NASA imagery, as resized and packed by three.js. */
import * as THREE from '../../vendor/three-r185/three.module.min.js';
import { Sound } from './audio.js?v=af1c9ebd';

const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* The point on Earth with the Sun straight overhead, now. */
export function subsolar(date) {
  const d = (date || new Date()).getTime() / 86400000 + 2440587.5 - 2451545.0;       // days since J2000
  const g = (357.529 + 0.98560028 * d) * RAD;                                           // mean anomaly
  const q = 280.459 + 0.98564736 * d;                                                   // mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;                 // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * RAD;                                            // obliquity
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24) * 15 * RAD;               // Greenwich sidereal time
  const lon = Math.atan2(Math.sin(ra - gmst), Math.cos(ra - gmst));
  return { lat: dec, lon };
}
/* Latitude and longitude to a direction, in the globe's own frame (three.js sphere: Greenwich on +X, north +Y). */
function dir(lat, lon, out) { return (out || new THREE.Vector3()).set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)); }
/* Roughly where the viewer is, from the time zone, so the globe opens over home. */
function home() {
  const z = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
  const known = { 'europe/london': [51.5, -0.1], 'asia/singapore': [1.35, 103.8], 'asia/kuala_lumpur': [3.1, 101.7], 'asia/kuching': [1.55, 110.3], 'asia/colombo': [6.9, 79.9], 'asia/kolkata': [13.1, 80.3], 'asia/calcutta': [13.1, 80.3], 'asia/dubai': [25.2, 55.3], 'europe/dublin': [53.3, -6.3], 'america/new_york': [40.7, -74], 'australia/sydney': [-33.9, 151.2] };
  const k = known[z];
  if (k) return { lat: k[0] * RAD, lon: k[1] * RAD };
  return { lat: 25 * RAD, lon: clamp(-new Date().getTimezoneOffset() / 60 * 15, -180, 180) * RAD };
}

/* ---------------- shaders ---------------- */
const VS = `
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const EARTH_FS = `
uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uBrc;
uniform vec3 uSun; uniform vec3 uAtmDay; uniform vec3 uAtmTwi; uniform float uCloudU; uniform float uBump; uniform vec2 uTexel;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
/* relief from the height map, measured across the map itself (east and north on the globe), land only */
vec3 bumped(vec3 n, float land) {
  vec2 du = vec2(uTexel.x * 1.5, 0.0), dv = vec2(0.0, uTexel.y * 1.5);
  float hx = texture2D(uBrc, vUv + du).r - texture2D(uBrc, vUv - du).r;
  float hy = texture2D(uBrc, vUv + dv).r - texture2D(uBrc, vUv - dv).r;
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(0.0, 0.0, 1e-4));
  vec3 north = cross(n, east);
  return normalize(n - uBump * land * (hx * east + hy * north));
}
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vP);
  vec3 l = normalize(uSun);
  float facing = dot(n, l);
  vec4 brc = texture2D(uBrc, vUv);
  float cloud = smoothstep(0.2, 1.0, texture2D(uBrc, vec2(vUv.x + uCloudU, vUv.y)).b);
  float water = 1.0 - smoothstep(0.3, 0.7, brc.g);
  vec3 nb = bumped(n, 1.0 - water);
  vec3 day = texture2D(uDay, vUv).rgb;
  float diff = clamp(dot(nb, l), 0.0, 1.0);
  float dayMix = smoothstep(-0.22, 0.42, facing);
  vec3 col = day * (0.025 + diff * 1.18) * (1.0 - cloud * 0.42 * smoothstep(-0.1, 0.4, facing));
  vec3 h = normalize(l + v);
  float nh = max(dot(n, h), 0.0);
  float sunUp = smoothstep(0.0, 0.25, facing);
  col += vec3(1.0, 0.95, 0.86) * (pow(nh, 320.0) * 1.1 + pow(nh, 36.0) * 0.07) * water * (1.0 - cloud) * sunUp;
  vec3 night = texture2D(uNight, vUv).rgb;
  vec3 lights = night * vec3(1.15, 1.0, 0.82) * (1.0 - cloud * 0.8) * 1.9 + vec3(0.003, 0.005, 0.012);
  col = mix(lights, col, dayMix);
  float fres = 1.0 - abs(dot(v, n));
  vec3 atm = mix(uAtmTwi, uAtmDay, smoothstep(-0.25, 0.75, facing));
  col = mix(col, atm, clamp(smoothstep(-0.5, 1.0, facing) * pow(fres, 2.0), 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const CLOUD_FS = `
uniform sampler2D uBrc; uniform vec3 uSun; uniform float uCloudU;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 l = normalize(uSun);
  vec3 v = normalize(cameraPosition - vP);
  float c = smoothstep(0.22, 1.0, texture2D(uBrc, vec2(vUv.x + uCloudU, vUv.y)).b);
  float d = dot(n, l);
  float lit = smoothstep(-0.12, 0.3, d) * (0.35 + 0.65 * clamp(d, 0.0, 1.0));
  vec3 col = mix(vec3(0.015, 0.02, 0.04), vec3(1.0), lit);
  col = mix(col, vec3(1.0, 0.58, 0.38), smoothstep(0.22, 0.0, abs(d - 0.04)) * 0.45 * lit);
  float edge = smoothstep(0.0, 0.25, abs(dot(v, n)));
  gl_FragColor = vec4(col, c * (0.18 + 0.82 * smoothstep(-0.3, 0.15, d)) * edge * 0.96);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const ATM_FS = `
uniform vec3 uSun; uniform vec3 uAtmDay; uniform vec3 uAtmTwi;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vP - cameraPosition);
  float fres = 1.0 - abs(dot(v, n));
  float facing = dot(n, normalize(uSun));
  vec3 atm = mix(uAtmTwi, uAtmDay, smoothstep(-0.25, 0.75, facing));
  float a = pow(clamp((1.0 - fres) / 0.27, 0.0, 1.0), 3.0) * smoothstep(-0.5, 1.0, facing);
  gl_FragColor = vec4(atm * 1.15, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const STAR_VS = `
attribute float aSize; attribute float aTw; attribute vec3 aCol;
uniform float uTime; uniform float uPx;
varying vec3 vCol; varying float vA;
void main() {
  vCol = aCol;
  vA = 0.65 + 0.35 * sin(uTime * (0.6 + aTw * 1.8) + aTw * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPx;
  gl_Position = projectionMatrix * mv;
}`;
const STAR_FS = `
varying vec3 vCol; varying float vA;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vCol, a * a * vA);
}`;

function glowTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Device tilt to a quaternion (no gimbal lock), for the screen's current rotation. */
const ZEE = new THREE.Vector3(0, 0, 1), BACK = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _e = new THREE.Euler(), _q0 = new THREE.Quaternion();
function deviceQuat(out, a, b, g, orient) {
  _e.set(b, a, -g, 'YXZ');
  out.setFromEuler(_e);
  out.multiply(BACK);
  out.multiply(_q0.setFromAxisAngle(ZEE, -orient));
  return out;
}
function scaleQuat(q, k) {                       // turn by k times the angle of q
  const w = clamp(q.w, -1, 1), ang = 2 * Math.acos(Math.abs(w)), s = Math.sqrt(Math.max(0, 1 - w * w));
  if (s < 1e-5) return q.identity();
  const sign = w < 0 ? -1 : 1, na = clamp(ang * k, 0, Math.PI * 0.9), ns = Math.sin(na / 2) / s * sign;
  return q.set(q.x * ns, q.y * ns, q.z * ns, Math.cos(na / 2));
}

export class Earth {
  constructor(canvas, o) {
    o = o || {};
    this.canvas = canvas;
    this.opts = o;
    this.small = Math.min(screen.width || 9999, screen.height || 9999) < 760 || matchMedia('(max-width: 760px)').matches;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const h = home();
    this.yaw = h.lon; this.pitch = clamp(h.lat * 0.6 + 12 * RAD, -20 * RAD, 38 * RAD);
    this.vyaw = 0; this.vpitch = 0; this.drag = null;
    this.gyro = new THREE.Quaternion(); this.gyroTarget = new THREE.Quaternion(); this.gyroRef = null; this.gyroOn = false;
    this.running = false; this.visible = true; this.raf = 0; this.last = 0; this.t = 0;
    this.dpr = 1; this.maxDpr = Math.min(window.devicePixelRatio || 1, this.small ? 1.5 : 2); this.slow = 0; this.fast = 0; this.ema = 16;
    this.ready = false; this.audioWanted = false; this.audio = null;
  }

  /* ---------------- set-up ---------------- */
  async init() {
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.small, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); }
    catch (e) { if (this.opts.onFail) this.opts.onFail(e); return false; }
    this.renderer = r;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    r.setClearColor(0x03040a, 1);
    this.dpr = this.maxDpr;
    r.setPixelRatio(this.dpr);
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.stop(); if (this.opts.onFail) this.opts.onFail(new Error('context lost')); });

    const scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.05, 400);
    const size = this.small ? '2k' : '4k', base = this.opts.base || 'assets/earth/';
    const loader = new THREE.TextureLoader();
    const load = (n, srgb) => new Promise((res, rej) => loader.load(base + n + '-' + size + '.jpg', (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy()); res(t); }, undefined, rej));
    let day, night, brc;
    try { [day, night, brc] = await Promise.all([load('day', true), load('night', true), load('brc', false)]); }
    catch (e) { if (this.opts.onFail) this.opts.onFail(e); return false; }

    const sun = this.sun = new THREE.Vector3();
    const U = this.uni = {
      uDay: { value: day }, uNight: { value: night }, uBrc: { value: brc }, uSun: { value: sun },
      uAtmDay: { value: new THREE.Color('#4db2ff') }, uAtmTwi: { value: new THREE.Color('#bc490b') },
      uCloudU: { value: 0 }, uBump: { value: 1.4 }, uTexel: { value: new THREE.Vector2(1 / brc.image.width, 1 / brc.image.height) }
    };
    const seg = this.small ? [96, 64] : [160, 112];
    const geo = new THREE.SphereGeometry(1, seg[0], seg[1]);
    this.globe = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: EARTH_FS }));
    scene.add(this.globe);
    this.clouds = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { uBrc: U.uBrc, uSun: U.uSun, uCloudU: U.uCloudU }, vertexShader: VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false }));
    this.clouds.scale.setScalar(1.007);
    scene.add(this.clouds);
    this.atmo = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { uSun: U.uSun, uAtmDay: U.uAtmDay, uAtmTwi: U.uAtmTwi }, vertexShader: VS, fragmentShader: ATM_FS, side: THREE.BackSide, transparent: true, depthWrite: false }));
    this.atmo.scale.setScalar(1.04);
    scene.add(this.atmo);

    // stars
    const N = this.small ? 2600 : 5200, pos = new Float32Array(N * 3), sz = new Float32Array(N), tw = new Float32Array(N), col = new Float32Array(N * 3);
    const tints = [[0.75, 0.82, 1], [1, 1, 1], [1, 0.95, 0.85], [1, 0.86, 0.7]];
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 160;
      pos[i * 3] = R * s * Math.cos(th); pos[i * 3 + 1] = R * u; pos[i * 3 + 2] = R * s * Math.sin(th);
      const m = Math.pow(Math.random(), 7);
      sz[i] = 0.9 + m * 3.6; tw[i] = Math.random();
      const c = tints[Math.floor(Math.random() * tints.length)], b = 0.45 + 0.75 * Math.pow(Math.random(), 2) + m * 0.6;
      col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    sg.setAttribute('aTw', new THREE.BufferAttribute(tw, 1)); sg.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    this.starU = { uTime: { value: 0 }, uPx: { value: this.dpr } };
    this.stars = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: this.starU, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    scene.add(this.stars);

    // the Sun's glow, far away along its direction
    this.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,250,235,1)'], [0.08, 'rgba(255,236,200,.9)'], [0.25, 'rgba(255,190,120,.28)'], [0.6, 'rgba(255,150,80,.06)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.sunGlow.scale.setScalar(26);
    scene.add(this.sunGlow);

    // a satellite crossing the sky (also carries one of the sounds)
    this.sat = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(220,235,255,.55)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.sat.scale.setScalar(0.035);
    scene.add(this.sat);
    this.satTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 51.6 * RAD);

    this.bind();
    this.resize();
    this.updateSun();
    // open on the line between day and night, on the side nearest home: lights on one side, sunlit cloud on the other
    const ss = subsolar(window.__earthTime ? new Date(window.__earthTime) : new Date()), d = Math.atan2(Math.sin(this.yaw - ss.lon), Math.cos(this.yaw - ss.lon));
    this.yaw = ss.lon + (d >= 0 ? 1 : -1) * 78 * RAD;
    this.ready = true;
    this.render(0);
    this.canvas.classList.add('on');
    if (this.opts.onReady) this.opts.onReady();
    return true;
  }

  /* ---------------- input ---------------- */
  bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button > 0) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), touch: e.pointerType !== 'mouse' };
      this.vyaw = this.vpitch = 0;
      this.wantAudio();
      try { if (!this.drag.touch) c.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    window.addEventListener('pointermove', (e) => {
      const d = this.drag; if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y, now = performance.now(), dt = Math.max(8, now - d.t);
      d.x = e.clientX; d.y = e.clientY; d.t = now;
      const k = 0.0052 / Math.max(0.6, this.radiusPx / 300);
      const ay = -dx * k, ap = d.touch ? 0 : dy * k;                       // on phones a vertical swipe scrolls the page
      this.yaw += ay; this.pitch = clamp(this.pitch + ap, -1.2, 1.2);
      this.vyaw = ay / dt * 16; this.vpitch = ap / dt * 16;
      if (!this.running) this.render(0);
    }, { passive: true });
    const end = (e) => { if (this.drag && this.drag.id === e.pointerId) this.drag = null; };
    window.addEventListener('pointerup', end, { passive: true });
    window.addEventListener('pointercancel', end, { passive: true });
    window.addEventListener('resize', () => this.resize(), { passive: true });
    if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(c); }
    if (window.IntersectionObserver) {
      this.io = new IntersectionObserver((en) => { this.visible = en.some((x) => x.isIntersecting); if (this.visible) this.loop(); else this.audioPause(); }, { threshold: 0.02 });
      this.io.observe(c);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.audioPause(); else this.loop(); });
    Sound.onChange((on) => { if (on && this.audioWanted && this.visible) this.audioStart(); });
    this.onOrient = (e) => this.orient(e);
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function' && matchMedia('(pointer: coarse)').matches) this.gyroStart();   // Android: no permission needed
  }
  /* iPhones only give the tilt after a tap and a yes; call this from a tap. */
  async enable() {
    this.wantAudio();
    if (!window.DeviceOrientationEvent) return false;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false; } catch (e) { return false; }
    }
    this.gyroStart();
    return true;
  }
  get tiltNeedsTap() { return !!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function' && !this.gyroOn); }
  gyroStart() { if (this.gyroOn || this.reduce) return; this.gyroOn = true; this.gyroRef = null; window.addEventListener('deviceorientation', this.onOrient, { passive: true }); }
  orient(e) {
    if (e.alpha == null || e.beta == null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const q = deviceQuat(new THREE.Quaternion(), e.alpha * RAD, e.beta * RAD, e.gamma * RAD, angle * RAD);
    if (!this.gyroRef || this.gyroAngle !== angle) { this.gyroRef = q.clone().invert(); this.gyroAngle = angle; }
    this.gyroTarget.copy(this.gyroRef).multiply(q);
    scaleQuat(this.gyroTarget, 1.6);
  }

  /* ---------------- framing ---------------- */
  resize() {
    if (!this.renderer) return;
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    const cam = this.camera, wide = w / h > 1.15;
    // where the globe sits and how big: to the right on a laptop, high in the middle on a phone
    const cx = wide ? w * 0.78 : w * 0.5, cy = wide ? h * 0.48 : h * 0.33;
    const R = wide ? Math.min(h * 0.46, w * 0.3) : Math.min(w * 0.49, h * 0.29);
    this.radiusPx = R;
    cam.aspect = w / h;
    const ang = Math.atan((R / (h / 2)) * Math.tan(cam.fov * RAD / 2));
    this.dist = 1 / Math.sin(ang);
    cam.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
    cam.updateProjectionMatrix();
    if (this.starU) this.starU.uPx.value = this.dpr;
    if (!this.running && this.ready) this.render(0);
  }
  updateSun() {
    const s = subsolar(window.__earthTime ? new Date(window.__earthTime) : new Date());
    dir(s.lat, s.lon, this.sun);
    this.sunGlow.position.copy(this.sun).multiplyScalar(120);
  }

  /* ---------------- drawing ---------------- */
  loop() {
    if (!this.ready || this.running || !this.visible || document.hidden) return;
    this.running = true; this.last = 0;
    if (this.audioWanted) this.audioStart();
    const step = (now) => {
      if (!this.running) return;
      if (!this.visible || document.hidden) { this.running = false; return; }
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
      this.last = now;
      this.render(dt);
      this.adapt(dt);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.audioPause(); }
  render(dt) {
    if (!this.ready) return;
    this.t += dt;
    if ((this.tick = (this.tick || 0) + 1) % 120 === 0) this.updateSun();      // the Sun creeps 15 degrees an hour
    if (!this.drag) {
      if (!this.reduce) this.yaw -= dt * 0.012;                                  // drift the way the Earth turns (west to east)
      this.yaw += this.vyaw; this.pitch = clamp(this.pitch + this.vpitch, -1.2, 1.2);
      const damp = Math.pow(0.05, dt); this.vyaw *= damp; this.vpitch *= damp;
      if (Math.abs(this.vyaw) < 1e-5) this.vyaw = 0;
      if (Math.abs(this.vpitch) < 1e-5) this.vpitch = 0;
    }
    if (this.gyroOn) this.gyro.slerp(this.gyroTarget, 1 - Math.pow(0.0025, dt || 0.016));
    // camera: orbit from yaw and pitch, then the phone's own turn on top
    const cam = this.camera, base = dir(this.pitch, this.yaw, new THREE.Vector3()).multiplyScalar(this.dist);
    cam.position.copy(base); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
    if (this.gyroOn) {
      cam.quaternion.multiply(this.gyro);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      cam.position.copy(fwd).multiplyScalar(-this.dist);
    }
    this.uni.uCloudU.value = (this.uni.uCloudU.value + dt * 0.0012) % 1;
    this.starU.uTime.value = this.t;
    const a = this.t * (2 * Math.PI / 150);                                      // one orbit every two and a half minutes
    this.sat.position.set(Math.cos(a) * 1.09, 0, Math.sin(a) * 1.09).applyQuaternion(this.satTilt);
    const lit = this.sat.position.clone().normalize().dot(this.sun);
    this.sat.material.opacity = smooth(-0.05, 0.12, lit) * 0.9;
    this.renderer.render(this.scene, cam);
    if (this.audio) this.audioUpdate(dt);
  }
  /* keep it smooth: lower the resolution if frames are slow, raise it again when there is room */
  adapt(dt) {
    if (!dt) return;
    this.ema = this.ema * 0.92 + dt * 1000 * 0.08;
    if (this.ema > 24) { this.slow++; this.fast = 0; } else if (this.ema < 14) { this.fast++; this.slow = 0; } else { this.slow = this.fast = 0; }
    if (this.slow > 40 && this.dpr > 0.75) { this.dpr = Math.max(0.75, this.dpr - 0.25); this.slow = 0; this.resize(); }
    else if (this.fast > 240 && this.dpr < this.maxDpr) { this.dpr = Math.min(this.maxDpr, this.dpr + 0.25); this.fast = 0; this.resize(); }
  }

  /* ---------------- space sound ---------------- */
  wantAudio() { this.audioWanted = true; if (this.visible) this.audioStart(); }
  audioStart() {
    if (!Sound.on || this.reduce) return;
    const c = Sound.ctx();
    if (!c) return;
    if (!this.audio) this.audio = this.audioBuild(c);
    const A = this.audio, t = c.currentTime;
    A.out.gain.cancelScheduledValues(t); A.out.gain.setTargetAtTime(1, t, 1.2);
    if (!A.pingT) A.pingT = setInterval(() => this.ping(), 5200);
  }
  audioPause() {
    const A = this.audio; if (!A) return;
    const c = A.ctx, t = c.currentTime;
    A.out.gain.cancelScheduledValues(t); A.out.gain.setTargetAtTime(0, t, 0.5);
    clearInterval(A.pingT); A.pingT = 0;
  }
  audioBuild(c) {
    const out = c.createGain(); out.gain.value = 0; out.connect(Sound.ambience());
    const len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const loop = () => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(c.currentTime + Math.random() * 0.02, Math.random() * 2); return s; };
    const panner = () => {
      const p = c.createPanner();
      p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.2; p.rolloffFactor = 0.7;
      p.connect(out); return p;
    };
    // a low drone with a filter that follows where you look
    const drone = c.createGain(); drone.gain.value = 0.05;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.8;
    [55, 82.41, 110.3].forEach((f, i) => { const o = c.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1) * 6; const g = c.createGain(); g.gain.value = [0.5, 0.32, 0.12][i]; o.connect(g); g.connect(lp); o.start(); });
    const rumble = loop(), rg = c.createGain(); rg.gain.value = 0.6; rumble.connect(rg); rg.connect(lp);
    lp.connect(drone); drone.connect(out);
    // solar wind, coming from the Sun's side
    const wind = loop(), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.55;
    const wg = c.createGain(); wg.gain.value = 0.0;
    const sunP = panner();
    wind.connect(bp); bp.connect(wg); wg.connect(sunP);
    // the satellite's soft ping, which moves with it
    const satP = panner(), echo = c.createDelay(1.2), fb = c.createGain(), wet = c.createGain();
    echo.delayTime.value = 0.42; fb.gain.value = 0.38; wet.gain.value = 0.55;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(satP);
    const L = c.listener;
    return { ctx: c, out, lp, drone, wg, sunP, satP, echo, L, pingT: 0 };
  }
  ping() {
    const A = this.audio; if (!A || !Sound.on) return;
    const c = A.ctx, t = c.currentTime + 0.02, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1568, t); o.frequency.exponentialRampToValueAtTime(1175, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(A.satP); g.connect(A.echo); o.start(t); o.stop(t + 1);
  }
  audioUpdate() {
    const A = this.audio, c = A.ctx, t = c.currentTime, cam = this.camera;
    const set = (p, v) => { if (p && p.setTargetAtTime) p.setTargetAtTime(v, t, 0.12); };
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), P = cam.position;
    const L = A.L;
    if (L.positionX) { set(L.positionX, P.x); set(L.positionY, P.y); set(L.positionZ, P.z); set(L.forwardX, fwd.x); set(L.forwardY, fwd.y); set(L.forwardZ, fwd.z); set(L.upX, up.x); set(L.upY, up.y); set(L.upZ, up.z); }
    else if (L.setPosition) { L.setPosition(P.x, P.y, P.z); L.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z); }
    const place = (p, v) => { if (p.positionX) { set(p.positionX, v.x); set(p.positionY, v.y); set(p.positionZ, v.z); } else if (p.setPosition) p.setPosition(v.x, v.y, v.z); };
    place(A.sunP, this.sun.clone().multiplyScalar(4));
    place(A.satP, this.sat.position);
    // looking at the day side: brighter wind; at the night side: a deeper, warmer drone. Higher up: a brighter filter.
    const facing = -fwd.dot(this.sun), pitch01 = clamp((Math.asin(clamp(P.y / P.length(), -1, 1)) / (Math.PI / 2) + 1) / 2, 0, 1);
    set(A.wg.gain, 0.015 + 0.06 * smooth(-0.3, 0.9, facing));
    set(A.drone.gain, 0.035 + 0.035 * (1 - smooth(-0.6, 0.8, facing)));
    set(A.lp.frequency, 240 + 1100 * pitch01 * pitch01);
  }
}
