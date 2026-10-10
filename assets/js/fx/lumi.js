/* Lumi: the engine's helper. A floating head made of soft aurora light (cyan, violet, soft blue) with foggy edges,
   drawn with a WebGL shader, and a calm face in glowing white lines: high curved eyebrows, dot eyes and an L-shaped nose.
   Eyes follow the pointer, she blinks, and she reacts to what the teacher is doing (listen, think, happy, breathe). */

const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FS = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uEnergy; uniform float uBreath; uniform vec2 uLook;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
void main(){
  vec2 uv = (gl_FragCoord.xy*2.0 - uRes) / min(uRes.x, uRes.y);
  float R = 0.58 * uBreath;
  float r = length(uv);
  vec2 q = uv / R;
  float d = length(q);
  float z = sqrt(max(0.0, 1.0 - d*d));
  vec3 n = normalize(vec3(q, z + 0.0001));
  float sp = 0.07 + 0.22*uEnergy;
  float t = uTime * sp;
  vec3 p = n*1.35 + vec3(0.0, t*0.7, t*0.45);
  vec3 w = vec3(fbm(p + vec3(0.0, t, 0.0)), fbm(p + vec3(5.2, 1.3, -t)), fbm(p + vec3(2.1, -t, 7.7)));
  float f = fbm(p + 1.7*w);
  float bands = 0.5 + 0.5*sin(3.2*(n.y + 0.55*w.x) + 2.2*f + uTime*sp*3.0);
  vec3 cyan = vec3(0.40, 0.91, 0.96);
  vec3 violet = vec3(0.64, 0.50, 0.99);
  vec3 blue = vec3(0.52, 0.71, 1.00);
  vec3 col = mix(blue, cyan, smoothstep(0.15, 0.85, bands));
  col = mix(col, violet, smoothstep(0.25, 0.95, f*0.55 + 0.5 + 0.3*w.y));
  vec3 L = normalize(vec3(-0.45 - uLook.x*0.3, 0.6 + uLook.y*0.3, 0.8));
  float diff = 0.62 + 0.38*max(dot(n, L), 0.0);
  float fres = pow(1.0 - z, 2.0);
  col = col*diff + fres*vec3(0.78, 0.74, 1.0)*0.55;
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 14.0);
  col += spec*0.28;
  col = mix(col, vec3(1.0), 0.14);
  float core = smoothstep(1.02, 0.80, d);
  float alphaCore = core * (0.80 + 0.16*bands);
  float halo = exp(-pow(max(r - R*0.86, 0.0)/(0.24*uBreath), 2.0)) * (0.50 + 0.12*uEnergy);
  vec3 haloCol = mix(cyan, violet, 0.5 + 0.5*sin(uTime*0.5 + atan(uv.y, uv.x)*1.0));
  haloCol = mix(haloCol, blue, 0.3);
  float a = max(alphaCore, halo);
  vec3 c = mix(haloCol, col, alphaCore / max(a, 0.0001));
  gl_FragColor = vec4(c*a, a);
}`;

const FACE = '<svg class="lumi-face" viewBox="0 0 200 200" aria-hidden="true"><g class="lf-move">' +
  '<path class="lf-brow lf-l" d="M57 79 Q74 59 93 70"/><path class="lf-brow lf-r" d="M107 70 Q126 59 143 79"/>' +
  '<g class="lf-eyes"><circle class="lf-eye" cx="78" cy="97" r="5.8"/><circle class="lf-eye" cx="122" cy="97" r="5.8"/></g>' +
  '<path class="lf-nose" d="M100 90 V125 H114"/></g></svg>';

export class Lumi {
  constructor(opts) {
    this.o = Object.assign({ size: 240 }, opts || {});
    this.root = document.createElement('div');
    this.root.className = 'lumi';
    this.root.innerHTML = '<div class="lumi-float"><canvas class="lumi-orb"></canvas><div class="lumi-css" aria-hidden="true"><i></i><i></i><i></i></div>' + FACE + '</div>';
    this.root.setAttribute('role', 'img');
    this.root.setAttribute('aria-label', 'Lumi, your lesson helper');
    this.canvas = this.root.querySelector('canvas');
    this.move = this.root.querySelector('.lf-move');
    this.eyes = this.root.querySelector('.lf-eyes');
    this.state = 'idle';
    this.energy = 0; this.energyT = 0;
    this.breath = 1; this.breathT = 1;
    this.look = [0, 0]; this.lookT = [0, 0];
    this.visible = false;
    this.t0 = performance.now();
    try { this.initGL(); } catch (e) { this.gl = null; this.root.classList.add('lumi--css'); }
    this.onPointer = (e) => {
      if (this.state === 'think' || this.state === 'breathe') return;
      const r = this.root.getBoundingClientRect();
      if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth * 0.5), dy = (e.clientY - cy) / (window.innerHeight * 0.5);
      const m = Math.hypot(dx, dy), k = m > 1 ? 1 / m : 1;
      this.lookT = [dx * k, dy * k];
      this.lastPointer = performance.now();
    };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.io = new IntersectionObserver((en) => { this.visible = en.some((x) => x.isIntersecting); if (this.visible) this.play(); }, { threshold: 0 });
    this.io.observe(this.root);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.root);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.play(); });
    this.scheduleBlink();
    this.root.addEventListener('click', () => this.pulse());
  }
  initGL() {
    const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('no webgl');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(p);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'p');
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = { res: gl.getUniformLocation(p, 'uRes'), time: gl.getUniformLocation(p, 'uTime'), energy: gl.getUniformLocation(p, 'uEnergy'), breath: gl.getUniformLocation(p, 'uBreath'), look: gl.getUniformLocation(p, 'uLook') };
    this.gl = gl;
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.gl = null; this.root.classList.add('lumi--css'); });
  }
  mount(host) { host.appendChild(this.root); this.resize(); this.play(); }
  resize() {
    if (!this.gl) return;
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  }
  setState(s) {
    this.state = s;
    this.root.dataset.state = s;
    this.energyT = s === 'think' ? 1 : s === 'happy' ? 0.6 : 0;
    if (s === 'listen') this.lookT = [-0.55, 0.25];
    if (s !== 'breathe') this.breathT = 1;
    if (s === 'happy') { clearTimeout(this.happyT); this.happyT = setTimeout(() => { if (this.state === 'happy') this.setState('idle'); }, 2600); }
    this.play();
  }
  setBreath(v) { this.breathT = v; this.play(); }
  pulse() { this.root.classList.remove('lumi-pulse'); void this.root.offsetWidth; this.root.classList.add('lumi-pulse'); }
  scheduleBlink() {
    clearTimeout(this.blinkT);
    this.blinkT = setTimeout(() => {
      if (this.state !== 'breathe') { this.root.classList.add('lumi-blink'); setTimeout(() => this.root.classList.remove('lumi-blink'), 150); }
      this.scheduleBlink();
    }, 2400 + Math.random() * 3800);
  }
  play() { if (!this.raf && this.visible && !document.hidden) this.raf = requestAnimationFrame((t) => this.frame(t)); }
  frame(now) {
    this.raf = 0;
    if (!this.visible || document.hidden || !this.root.isConnected) return;
    const t = (now - this.t0) / 1000;
    this.energy += (this.energyT - this.energy) * 0.05;
    this.breath += (this.breathT - this.breath) * 0.08;
    if (this.state === 'think') this.lookT = [Math.sin(t * 1.6) * 0.6, 0.15];
    else if (this.state !== 'listen' && this.state !== 'breathe' && performance.now() - (this.lastPointer || 0) > 4000) this.lookT = [Math.sin(t * 0.3) * 0.25, Math.cos(t * 0.23) * 0.12];
    if (this.state === 'breathe') this.lookT = [0, 0];
    this.look[0] += (this.lookT[0] - this.look[0]) * 0.08;
    this.look[1] += (this.lookT[1] - this.look[1]) * 0.08;
    const lx = this.look[0], ly = this.look[1];
    this.move.style.transform = 'translate(' + (lx * 8).toFixed(2) + 'px,' + (ly * 6).toFixed(2) + 'px) scale(' + this.breath.toFixed(4) + ')';
    this.eyes.style.transform = 'translate(' + (lx * 4).toFixed(2) + 'px,' + (ly * 3.2).toFixed(2) + 'px)';
    this.root.style.setProperty('--breath', this.breath.toFixed(4));
    if (this.gl) {
      const gl = this.gl;
      this.resize();
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.u.time, t);
      gl.uniform1f(this.u.energy, this.energy);
      gl.uniform1f(this.u.breath, this.breath);
      gl.uniform2f(this.u.look, lx, -ly);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }
}
