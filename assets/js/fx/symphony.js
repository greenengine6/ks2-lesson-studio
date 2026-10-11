/* Symphony: the lesson helper. A girl made of soft aurora light (cyan, violet, rose) with foggy edges, drawn with a
   WebGL shader, and a friendly face in glowing white lines: curved brows, eyes with lashes, rosy cheeks, a smile and a
   little music-note hair clip (she is named Symphony for her musical voice). Eyes follow the pointer, she blinks,
   and she reacts to what the teacher is doing (listen, think, happy, speak, breathe). Click her to hear who she is. */
import { bus } from '../core.js?v=b8e2dc0e';

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
  vec3 rose = vec3(0.99, 0.66, 0.86);
  col = mix(col, rose, 0.55*smoothstep(0.62, 0.98, 0.5 + 0.5*sin(2.6*(n.x - 0.4*w.z) + 1.7*f - uTime*sp*2.0)));
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
  haloCol = mix(haloCol, rose, 0.25 + 0.25*sin(uTime*0.37 + atan(uv.y, uv.x)*2.0));
  haloCol = mix(haloCol, blue, 0.3);
  float a = max(alphaCore, halo);
  vec3 c = mix(haloCol, col, alphaCore / max(a, 0.0001));
  gl_FragColor = vec4(c*a, a);
}`;

const FACE = '<svg class="sym-face" viewBox="0 0 200 200" aria-hidden="true"><g class="sf-move">' +
  '<circle class="sf-cheek" cx="66" cy="117" r="10"/><circle class="sf-cheek" cx="134" cy="117" r="10"/>' +
  '<path class="sf-brow sf-l" d="M60 77 Q76 63 92 71"/><path class="sf-brow sf-r" d="M108 71 Q124 63 140 77"/>' +
  '<g class="sf-eyes"><g class="sf-eye-l"><circle class="sf-eye" cx="80" cy="98" r="5.8"/><path class="sf-lash" d="M72.5 93.5 67 89.5M75.5 90.6 72.6 85.2"/></g>' +
  '<g class="sf-eye-r"><circle class="sf-eye" cx="120" cy="98" r="5.8"/><path class="sf-lash" d="M127.5 93.5 133 89.5M124.5 90.6 127.4 85.2"/></g></g>' +
  '<path class="sf-smile" d="M87 121 Q100 133 113 121"/><ellipse class="sf-open" cx="100" cy="124.5" rx="7.2" ry="5.4"/>' +
  '<g class="sf-clip"><path d="M139 44v17.5"/><path d="M139 44l11 3.4v5.4l-11-3.4"/><ellipse cx="134.4" cy="62.4" rx="5.4" ry="4.1" transform="rotate(-18 134.4 62.4)"/></g>' +
  '</g><g class="sf-notes"><path d="M164 92v-15l9 2.6"/><ellipse cx="160.6" cy="93" rx="4.2" ry="3.2" transform="rotate(-18 160.6 93)"/>' +
  '<path d="M34 72v-12l7.5 2.2"/><ellipse cx="31.2" cy="73" rx="3.5" ry="2.7" transform="rotate(-18 31.2 73)"/></g></svg>';

/* A light, CSS-only Symphony (no WebGL) for small places such as the chat button. */
export const MINI = (label) => '<div class="sym sym--css"' + (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '><div class="sym-float"><div class="sym-css"></div>' + FACE + '</div></div>';

export const SYMPHONY_ABOUT = {
  en: 'Hello, I am Symphony! I am a girl who lives inside this lesson engine. I speak English and Malay. I was named Symphony because of my musical voice. I help teachers plan lessons, and I love answering children’s questions about anything, from planets and animals to fractions.',
  ms: 'Hai, saya Symphony! Saya seorang gadis yang tinggal di dalam enjin pelajaran ini. Saya boleh bercakap bahasa Inggeris dan bahasa Melayu. Saya dinamakan Symphony kerana suara saya yang merdu seperti muzik. Saya membantu guru merancang pelajaran, dan saya suka menjawab soalan kanak-kanak tentang apa sahaja, dari planet dan haiwan hingga pecahan.'
};

export class Symphony {
  constructor(opts) {
    this.o = Object.assign({ size: 240, talk: true }, opts || {});
    this.root = document.createElement('div');
    this.root.className = 'sym';
    this.root.innerHTML = '<div class="sym-float"><canvas class="sym-orb"></canvas><div class="sym-css" aria-hidden="true"><i></i><i></i><i></i></div>' + FACE + '</div>';
    if (this.o.talk) { this.root.setAttribute('role', 'button'); this.root.tabIndex = 0; this.root.setAttribute('aria-label', 'Symphony, your lesson helper. Press to talk to her'); }
    else { this.root.setAttribute('role', 'img'); this.root.setAttribute('aria-label', 'Symphony'); }
    this.canvas = this.root.querySelector('canvas');
    this.move = this.root.querySelector('.sf-move');
    this.eyes = this.root.querySelector('.sf-eyes');
    this.state = 'idle';
    this.energy = 0; this.energyT = 0;
    this.breath = 1; this.breathT = 1;
    this.look = [0, 0]; this.lookT = [0, 0];
    this.visible = false;
    this.t0 = performance.now();
    try { this.initGL(); } catch (e) { this.gl = null; this.root.classList.add('sym--css'); }
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
    this.root.addEventListener('click', () => { this.pulse(); if (this.o.talk) bus.emit('symphony', { about: true }); });
    this.root.addEventListener('keydown', (e) => { if (this.o.talk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.root.click(); } });
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
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.gl = null; this.root.classList.add('sym--css'); });
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
    this.energyT = s === 'think' ? 1 : s === 'happy' ? 0.6 : s === 'speak' ? 0.45 : 0;
    if (s === 'listen') this.lookT = [-0.55, 0.25];
    if (s !== 'breathe') this.breathT = 1;
    if (s === 'happy') { clearTimeout(this.happyT); this.happyT = setTimeout(() => { if (this.state === 'happy') this.setState('idle'); }, 2600); }
    this.play();
  }
  setBreath(v) { this.breathT = v; this.play(); }
  pulse() { this.root.classList.remove('sym-pulse'); void this.root.offsetWidth; this.root.classList.add('sym-pulse'); }
  scheduleBlink() {
    clearTimeout(this.blinkT);
    this.blinkT = setTimeout(() => {
      if (this.state !== 'breathe') { this.root.classList.add('sym-blink'); setTimeout(() => this.root.classList.remove('sym-blink'), 150); }
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
