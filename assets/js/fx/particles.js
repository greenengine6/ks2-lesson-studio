/* Small canvas effects: confetti bursts for celebrations, and mood particles for the Story Spark scene
   (rain, snow, sparkles, fireflies, bubbles, embers, fog, petals). Everything stops itself when not visible. */

const COLORS = ['#6C63FF', '#38B2AC', '#FF7AA2', '#FFB443', '#4FA9F5', '#8B84FF', '#5EEAD4'];

export function confetti(host, opts) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const o = Object.assign({ count: 140, x: 0.5, y: 0.45, spread: 1 }, opts || {});
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  cv.setAttribute('aria-hidden', 'true');
  host.appendChild(cv);
  const r = host.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  const parts = [];
  for (let i = 0; i < o.count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * o.spread;
    const v = 6 + Math.random() * 9;
    parts.push({ x: r.width * o.x, y: r.height * o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[i % COLORS.length], round: Math.random() < 0.3 });
  }
  const t0 = performance.now();
  (function step(now) {
    const t = now - t0;
    g.clearRect(0, 0, r.width, r.height);
    parts.forEach((p) => {
      p.vy += 0.32; p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.max(0, 1 - t / 2600); g.fillStyle = p.c;
      if (p.round) { g.beginPath(); g.arc(0, 0, p.h * 0.6, 0, Math.PI * 2); g.fill(); } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
      g.restore();
    });
    if (t < 2700) requestAnimationFrame(step); else cv.remove();
  })(t0);
}

/* mood → colours + particle kind for the Story Spark scene card */
export const MOODS = {
  stormy: { bg: ['#4B5A75', '#2F3B52', '#6E7F9C'], kind: 'rain', ink: '#F4F7FB' },
  mysterious: { bg: ['#3E4A86', '#2B3366', '#5C6BB5'], kind: 'fireflies', ink: '#F4F2FF' },
  magical: { bg: ['#8B6CE8', '#C86FD1', '#6C63FF'], kind: 'sparkle', ink: '#FFFFFF' },
  eerie: { bg: ['#55705F', '#3C5246', '#7E9584'], kind: 'fog', ink: '#F2F7F3' },
  calm: { bg: ['#7CC6D6', '#9FD9C9', '#C9E8F2'], kind: 'bubbles', ink: '#1F3A44' },
  joyful: { bg: ['#FFC46B', '#FF9A8B', '#FFD86F'], kind: 'petals', ink: '#4A2A12' },
  wintry: { bg: ['#B8D3F0', '#E3EEF9', '#9DB9DE'], kind: 'snow', ink: '#1E3555' },
  tense: { bg: ['#B5523B', '#6E2A2A', '#E07A4F'], kind: 'embers', ink: '#FFF4EE' },
  sunny: { bg: ['#FFD36E', '#9FDDF5', '#FFF1B8'], kind: 'petals', ink: '#3A2C10' },
  dreamy: { bg: ['#C3B5F5', '#F5C6E3', '#B5E3F5'], kind: 'sparkle', ink: '#2E2650' }
};

export class Mood {
  constructor(host, mood) {
    this.host = host;
    this.cv = document.createElement('canvas');
    this.cv.className = 'mood-fx';
    this.cv.setAttribute('aria-hidden', 'true');
    host.prepend(this.cv);
    this.g = this.cv.getContext('2d');
    this.set(mood);
    this.visible = false;
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.io = new IntersectionObserver((en) => { this.visible = en.some((x) => x.isIntersecting); if (this.visible) this.play(); }, { threshold: 0 });
    this.io.observe(host);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
  }
  set(mood) {
    this.m = MOODS[mood] ? mood : 'mysterious';
    const M = MOODS[this.m];
    this.host.style.setProperty('--m1', M.bg[0]); this.host.style.setProperty('--m2', M.bg[1]); this.host.style.setProperty('--m3', M.bg[2]); this.host.style.setProperty('--mink', M.ink);
    this.kind = M.kind;
    this.parts = [];
    this.resize();
  }
  resize() {
    const r = this.host.getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = { rain: 110, snow: 70, sparkle: 46, fireflies: 26, bubbles: 22, embers: 40, fog: 7, petals: 26 }[this.kind] || 30;
    this.parts = Array.from({ length: n }, () => this.spawn(true));
  }
  spawn(any) {
    const w = this.w, h = this.h, k = this.kind, s = Math.min(w, h) / 400;
    const p = { x: Math.random() * w, y: any ? Math.random() * h : -10, life: Math.random() * 6.28 };
    if (k === 'rain') Object.assign(p, { vx: -2.2 * s, vy: (9 + Math.random() * 6) * s, len: (10 + Math.random() * 14) * s });
    else if (k === 'snow') Object.assign(p, { vx: 0, vy: (0.4 + Math.random() * 0.8) * s, r: (1.5 + Math.random() * 3) * s });
    else if (k === 'sparkle') Object.assign(p, { r: (1 + Math.random() * 2.5) * s, tw: 0.02 + Math.random() * 0.05 });
    else if (k === 'fireflies') Object.assign(p, { vx: (Math.random() - 0.5) * 0.6 * s, vy: (Math.random() - 0.5) * 0.6 * s, r: (1.6 + Math.random() * 2) * s });
    else if (k === 'bubbles') Object.assign(p, { y: any ? Math.random() * h : h + 20, vy: -(0.3 + Math.random() * 0.6) * s, r: (4 + Math.random() * 10) * s });
    else if (k === 'embers') Object.assign(p, { y: any ? Math.random() * h : h + 10, vx: (Math.random() - 0.5) * 0.5 * s, vy: -(0.6 + Math.random() * 1.2) * s, r: (1 + Math.random() * 2) * s });
    else if (k === 'fog') Object.assign(p, { vx: (0.15 + Math.random() * 0.25) * s, r: (90 + Math.random() * 120) * s, y: Math.random() * h });
    else if (k === 'petals') Object.assign(p, { vx: (0.3 + Math.random() * 0.6) * s, vy: (0.5 + Math.random() * 0.8) * s, r: (3 + Math.random() * 4) * s, rot: Math.random() * 6 });
    return p;
  }
  play() { if (!this.raf && !this.reduced) this.raf = requestAnimationFrame(() => this.frame()); else if (this.reduced) this.frame(true); }
  frame(once) {
    this.raf = 0;
    if (!this.host.isConnected) { this.io.disconnect(); this.ro.disconnect(); return; }
    const g = this.g, w = this.w, h = this.h, k = this.kind;
    g.clearRect(0, 0, w, h);
    this.flash = Math.max(0, (this.flash || 0) - 0.04);
    if (k === 'rain' && Math.random() < 0.003) this.flash = 0.5;
    if (this.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + this.flash * 0.35 + ')'; g.fillRect(0, 0, w, h); }
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.life += 0.03;
      if (k === 'rain') {
        p.x += p.vx; p.y += p.vy;
        g.strokeStyle = 'rgba(220,232,255,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.vx * 1.5, p.y - p.len); g.stroke();
        if (p.y > h + 20) this.parts[i] = this.spawn(false);
      } else if (k === 'snow') {
        p.x += Math.sin(p.life) * 0.4 + p.vx; p.y += p.vy;
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
        if (p.y > h + 10) this.parts[i] = this.spawn(false);
      } else if (k === 'sparkle') {
        const a = 0.25 + 0.75 * Math.abs(Math.sin(p.life * p.tw * 40));
        g.fillStyle = 'rgba(255,255,255,' + a + ')';
        const r = p.r * (0.6 + a);
        g.beginPath(); g.moveTo(p.x, p.y - r * 2); g.lineTo(p.x + r * 0.5, p.y - r * 0.5); g.lineTo(p.x + r * 2, p.y); g.lineTo(p.x + r * 0.5, p.y + r * 0.5);
        g.lineTo(p.x, p.y + r * 2); g.lineTo(p.x - r * 0.5, p.y + r * 0.5); g.lineTo(p.x - r * 2, p.y); g.lineTo(p.x - r * 0.5, p.y - r * 0.5); g.closePath(); g.fill();
      } else if (k === 'fireflies') {
        p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; p.vx *= 0.98; p.vy *= 0.98; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(p.life));
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        gr.addColorStop(0, 'rgba(255,246,170,' + a + ')'); gr.addColorStop(1, 'rgba(255,246,170,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * 5, 0, 6.283); g.fill();
      } else if (k === 'bubbles') {
        p.y += p.vy; p.x += Math.sin(p.life) * 0.3;
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fill();
        if (p.y < -20) this.parts[i] = this.spawn(false);
      } else if (k === 'embers') {
        p.x += p.vx + Math.sin(p.life) * 0.3; p.y += p.vy;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(p.life * 2));
        g.fillStyle = 'rgba(255,190,110,' + a + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
        if (p.y < -10) this.parts[i] = this.spawn(false);
      } else if (k === 'fog') {
        p.x += p.vx; if (p.x - p.r > w) p.x = -p.r;
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
      } else if (k === 'petals') {
        p.x += p.vx + Math.sin(p.life) * 0.5; p.y += p.vy; p.rot += 0.03;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = 'rgba(255,255,255,.75)';
        g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283); g.fill(); g.restore();
        if (p.y > h + 10 || p.x > w + 10) this.parts[i] = Object.assign(this.spawn(false), { x: Math.random() * w * 0.8 - w * 0.2 });
      }
    }
    if (!once && this.visible && !document.hidden) this.raf = requestAnimationFrame(() => this.frame());
  }
}
