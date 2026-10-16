/* Extreme weather, drawn live: a hurricane seen from space (it spins the other way south of the equator), a
   thunderstorm with the "count to the thunder" game, the monsoon on Malaysia's east coast month by month, and a
   blizzard where the wind makes it feel colder (wind chill). */
import { MONSOON, MONSOON_SEASONS } from './data.js?v=ed35fd44';
import { TAU, rnd, clamp, noise, layer, view, FONT } from './util.js?v=ed35fd44';
import { Sound } from '../fx/audio.js?v=ed35fd44';

const pill = (ctx, x, y, w, h) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h); };
let puffSprite = null;
function puff() {
  if (puffSprite) return puffSprite;
  const c = layer(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(250,252,255,.55)'); r.addColorStop(1, 'rgba(240,245,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  puffSprite = c;
  return c;
}

/* ---------------- thunder, made live (no sound files) ---------------- */
let noiseBuf = null;
function thunder(km) {
  const c = Sound.ctx();
  if (!c) return;
  try {
    if (!noiseBuf) {
      const len = c.sampleRate * 5; noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = noiseBuf.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.03 * w) / 1.03; d[i] = last * 3.2 + w * 0.08; }
    }
    const t = c.currentTime + 0.02, near = clamp(1.4 - km * 0.25, 0.25, 1.15), dur = 2.6 + km * 0.35;
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(km < 2 ? 900 : 380, t); lp.frequency.exponentialRampToValueAtTime(120, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9 * near, t + (km < 2 ? 0.03 : 0.25));
    for (let k = 1; k < 7; k++) g.gain.linearRampToValueAtTime(near * rnd(0.35, 0.85) * (1 - k / 8), t + k * dur / 8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(lp); lp.connect(g); g.connect(Sound.effects());
    s.start(t, rnd(0, 1.5)); s.stop(t + dur + 0.1);
  } catch (e) { /* no sound here */ }
}

/* ---------------- a bolt of lightning: a jagged line with branches ---------------- */
function bolt(x0, y0, x1, y1, rough, depth) {
  let pts = [[x0, y0], [x1, y1]];
  for (let k = 0; k < 7; k++) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); out.push([(a[0] + b[0]) / 2 + rnd(-1, 1) * d * rough, (a[1] + b[1]) / 2 + rnd(-0.2, 0.2) * d * rough], b); }
    pts = out;
  }
  const branches = [];
  if (depth > 0) for (let i = 4; i < pts.length - 6; i += 1) if (Math.random() < 0.06) { const p = pts[i], L = (y1 - p[1]) * rnd(0.2, 0.45); branches.push(bolt(p[0], p[1], p[0] + rnd(-1, 1) * L, p[1] + L, rough * 1.1, depth - 1)); }
  return { pts, branches };
}
function drawBolt(ctx, b, wd) {
  ctx.lineWidth = wd; ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  b.branches.forEach((c) => drawBolt(ctx, c, Math.max(0.8, wd * 0.5)));
}
/* How cold it feels in the wind (the wind chill formula the Met Office uses), in °C. */
export function feelsLike(T, V) { if (V < 4.8 || T > 10) return T; const p = Math.pow(V, 0.16); return 13.12 + 0.6215 * T - 11.37 * p + 0.3965 * T * p; }

export const weather = {
  id: 'weather', mode: 'hurricane', south: false, month: new Date().getMonth(), wind: 50, temp: -5, soundOn: true,
  init(w, h) { this.w = w; this.h = h; this.reset(); },
  resize(w, h) { this.w = w; this.h = h; this.reset(); },
  setMode(m) { if (m !== this.mode) { this.mode = m; this.reset(); } },
  reset() {
    const w = this.w, h = this.h;
    this.bg = null; this.flash = 0; this.bolt = null; this.boltT = 0; this.count = null; this.result = null; this.next = rnd(4, 8); this.drift = 0;
    this.rain = Array.from({ length: view.small ? 260 : 460 }, () => ({ x: rnd(-w * 0.2, w * 1.2), y: rnd(0, h), v: rnd(0.7, 1.3) }));
    this.snow = Array.from({ length: view.small ? 280 : 520 }, () => ({ x: rnd(0, w), y: rnd(0, h), v: rnd(0.5, 1.5), s: rnd(1, 3.2), p: rnd(0, TAU) }));
    if (this.mode === 'hurricane') {
      const R = this.R();
      this.puffs = Array.from({ length: view.small ? 520 : 900 }, (_, i) => ({ arm: i % 4, off: rnd(-0.32, 0.32), r: R * rnd(0.16, 1.02), vr: rnd(0.012, 0.03), s: rnd(0.07, 0.15), a: rnd(0.12, 0.32) }));
      this.wall = Array.from({ length: 160 }, () => ({ th: rnd(0, TAU), r: R * rnd(0.085, 0.16), s: rnd(0.05, 0.09), a: rnd(0.35, 0.6) }));
    }
  },
  R() { return Math.min(this.w * 0.46, this.h * 0.4); },
  centre() { return [this.w / 2, this.h * 0.5]; },
  /* Tap: in the hurricane, what you tapped; in the storm, a flash of lightning. */
  click(x, y) {
    if (this.mode === 'hurricane') {
      const [cx, cy] = this.centre(), R = this.R(), d = Math.hypot(x - cx, y - cy);
      if (d < R * 0.08) return { title: 'The eye', fact: 'The eye is the calm middle of the hurricane. The sky can even be blue, but the storm comes back when the eye has passed.' };
      if (d < R * 0.2) return { title: 'The eyewall', fact: 'The eyewall is the ring of cloud around the eye. It has the strongest winds and the heaviest rain.' };
      if (d < R * 1.05) return { title: 'Rain bands', fact: 'Long spiral bands of cloud, called rain bands, swirl in towards the middle, bringing bursts of heavy rain.' };
      return null;
    }
    if (this.mode === 'storm') { this.strike(); return null; }
    return null;
  },
  /* A flash now; the thunder comes 3 to 15 seconds later (3 seconds for every kilometre). */
  strike() {
    const w = this.w, h = this.h, x = rnd(w * 0.15, w * 0.85);
    this.bolt = bolt(x, h * 0.14, x + rnd(-w * 0.12, w * 0.12), h * 0.78, 0.22, 2);
    this.boltT = 0.45; this.flash = 1;
    const secs = [3, 6, 9, 12, 15][Math.floor(rnd(0, 5))];
    this.count = { at: 0, secs }; this.result = null; this.next = secs + rnd(12, 20);
  },
  step(dt, t) {
    const w = this.w, h = this.h;
    if (this.mode === 'hurricane') {
      const R = this.R();
      this.puffs.forEach((p) => { p.r -= p.vr * R * dt; if (p.r < R * 0.15) { p.r = R * rnd(0.9, 1.05); p.off = rnd(-0.32, 0.32); } });
      this.wall.forEach((p) => { p.th -= dt * 0.9; });
      this.spin = (this.spin || 0) + dt * 0.12;
    }
    if (this.mode === 'storm') {
      this.boltT -= dt; this.flash = Math.max(0, this.flash - dt * 2.2);
      if (this.boltT > 0 && Math.random() < dt * 10) this.flash = Math.max(this.flash, rnd(0.3, 0.8));   // flicker
      if (this.count) {
        this.count.at += dt;
        if (this.count.at >= this.count.secs) { this.result = { secs: this.count.secs, km: this.count.secs / 3, t: 7 }; if (this.soundOn) thunder(this.count.secs / 3); this.count = null; }
      }
      if (this.result) { this.result.t -= dt; if (this.result.t <= 0) this.result = null; }
      this.next -= dt;
      if (this.next <= 0 && !this.count) this.strike();
    }
    if (this.mode === 'storm' || this.mode === 'monsoon') {
      const m = MONSOON[this.month], wind = this.mode === 'storm' ? -0.25 : m.s === 'ne' ? -0.55 : m.s === 'sw' ? 0.45 : -0.08;
      this.windX = wind;
      this.rain.forEach((p) => { p.y += 1100 * p.v * dt; p.x += wind * 900 * p.v * dt; if (p.y > h) { p.y = -20; p.x = rnd(-w * 0.2, w * 1.2); } });
    }
    if (this.mode === 'blizzard') {
      const vx = this.wind * 9;
      this.snow.forEach((p) => { p.x += (vx * p.v + (noise(p.p, t * 0.5) - 0.5) * 80) * dt; p.y += (35 + this.wind * 0.6) * p.v * dt + Math.sin(t * 2 + p.p) * 10 * dt; if (p.x > w + 10) { p.x = -10; p.y = rnd(0, h); } if (p.x < -10) p.x = w + 10; if (p.y > h) { p.y = -5; p.x = rnd(0, w); } });
      this.drift = clamp(this.drift + dt * (this.wind > 25 ? this.wind / 2600 : -0.01), 0, 1);
    }
  },
  draw(ctx, w, h, t) { this['draw_' + this.mode](ctx, w, h, t); },

  /* ---------- hurricane ---------- */
  draw_hurricane(ctx, w, h, t) {
    if (!this.bg) {
      this.bg = layer(w, h); const g = this.bg.getContext('2d');
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, '#0F4C81'); gr.addColorStop(1, '#06223F');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { g.fillStyle = 'rgba(120,180,230,' + rnd(0.02, 0.08).toFixed(3) + ')'; g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 8), rnd(1, 3)); }
    }
    ctx.drawImage(this.bg, 0, 0, w, h);
    const [cx, cy] = this.centre(), R = this.R(), sp = puff(), dir = this.south ? -1 : 1;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, 1);
    this.puffs.forEach((p) => {
      const th = p.arm * TAU / 4 + 1.5 * Math.log(p.r / R) + p.off - this.spin, s = p.s * R * (0.6 + 0.6 * p.r / R);
      const edge = clamp((R * 1.05 - p.r) / (R * 0.25), 0, 1);
      ctx.globalAlpha = p.a * edge; ctx.drawImage(sp, Math.cos(th) * p.r - s / 2, Math.sin(th) * p.r - s / 2, s, s);
    });
    this.wall.forEach((p) => { const th = p.th - this.spin, s = p.s * R; ctx.globalAlpha = p.a; ctx.drawImage(sp, Math.cos(th) * p.r - s / 2, Math.sin(th) * p.r - s / 2, s, s); });
    ctx.globalAlpha = 1;
    ctx.restore();
    // labels and which way it spins
    const fs = view.small ? 12 : 14.5;
    ctx.font = '800 ' + fs + 'px ' + FONT;
    const tag = (txt, x, y, tx, ty) => { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); const tw = ctx.measureText(txt).width + 18; ctx.fillStyle = 'rgba(6,20,40,.78)'; pill(ctx, tx - (tx < x ? tw : 0), ty - 13, tw, 26); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(txt, tx - (tx < x ? tw : 0) + 9, ty + 5); };
    tag('The eye', cx, cy, cx + R * 0.55, cy - R * 0.75);
    tag('Eyewall', cx - R * 0.12, cy + R * 0.06, cx - R * 0.7, cy + R * 0.82);
    const arrowR = R * 1.08, a0 = -Math.PI * 0.85, a1 = -Math.PI * 0.55;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, 1); ctx.strokeStyle = 'rgba(255,214,102,.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, arrowR, a1, a0, true); ctx.stroke();
    const ax = Math.cos(a0) * arrowR, ay = Math.sin(a0) * arrowR; ctx.fillStyle = 'rgba(255,214,102,.95)'; ctx.beginPath(); ctx.moveTo(ax - 2, ay + 14); ctx.lineTo(ax - 12, ay - 4); ctx.lineTo(ax + 10, ay - 2); ctx.fill();
    ctx.restore();
    const msg = this.south ? 'South of the equator: spinning clockwise' : 'North of the equator: spinning anticlockwise';
    ctx.font = '800 ' + (fs + 1) + 'px ' + FONT; const tw = ctx.measureText(msg).width + 26;
    ctx.fillStyle = 'rgba(6,20,40,.8)'; pill(ctx, (w - tw) / 2, view.top + 16, tw, 34); ctx.fill(); ctx.fillStyle = '#FFD666'; ctx.fillText(msg, (w - tw) / 2 + 13, view.top + 38);
  },

  /* ---------- thunderstorm ---------- */
  draw_storm(ctx, w, h, t) {
    if (!this.bg) {
      this.bg = layer(w, h); const g = this.bg.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#141A26'); gr.addColorStop(0.6, '#2B3446'); gr.addColorStop(1, '#3B4458');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const x = rnd(-50, w + 50), y = rnd(0, h * 0.3), r = rnd(60, 160); const cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, 'rgba(70,80,100,.55)'); cg.addColorStop(1, 'rgba(70,80,100,0)'); g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2); }
      const base = h * 0.84;
      g.fillStyle = '#0E121B';
      for (let x = 0; x < w;) { const bw = rnd(30, 90), bh = rnd(0.04, 0.16) * h; g.fillRect(x, base - bh, bw - 4, bh + 2); for (let k = 0; k < 6; k++) if (Math.random() < 0.4) { g.fillStyle = 'rgba(255,210,120,.75)'; g.fillRect(x + rnd(4, bw - 14), base - rnd(8, bh - 6), 6, 8); g.fillStyle = '#0E121B'; } x += bw; }
      g.fillStyle = '#090C12'; g.fillRect(0, base, w, h - base);
    }
    ctx.drawImage(this.bg, 0, 0, w, h);
    if (this.bolt && this.boltT > 0) {
      ctx.save(); ctx.strokeStyle = 'rgba(190,210,255,.5)'; ctx.shadowColor = 'rgba(170,200,255,1)'; ctx.shadowBlur = 24; drawBolt(ctx, this.bolt, 7); ctx.shadowBlur = 0; ctx.strokeStyle = '#FFFFFF'; drawBolt(ctx, this.bolt, 2.6); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(180,200,230,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    this.rain.forEach((p) => { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - this.windX * 18 * p.v, p.y + 20 * p.v); }); ctx.stroke();
    if (this.flash > 0) { ctx.fillStyle = 'rgba(220,230,255,' + (this.flash * 0.45).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
    // count to the thunder
    const fs = view.small ? 15 : 19, y0 = view.top + (view.small ? 30 : 46);
    ctx.textAlign = 'center';
    if (this.count) {
      const n = Math.floor(this.count.at) + 1;
      ctx.font = '900 ' + (view.small ? 64 : 96) + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillText(String(Math.min(n, this.count.secs)), w / 2, y0 + (view.small ? 64 : 92));
      ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = '#FFD666'; ctx.fillText(view.small ? 'Count to the thunder…' : 'Count with me until the thunder…', w / 2, y0);
    } else if (this.result) {
      const r = this.result, km = r.km;
      const msg = view.small ? r.secs + ' s ÷ 3 = about ' + km + ' km away' : r.secs + ' seconds ÷ 3 = about ' + km + (km === 1 ? ' kilometre' : ' kilometres') + ' away';
      ctx.font = '900 ' + (view.small ? 22 : 34) + 'px ' + FONT; const tw = ctx.measureText(msg).width + 40;
      ctx.fillStyle = 'rgba(8,12,22,.78)'; pill(ctx, (w - tw) / 2, y0 - 6, tw, view.small ? 46 : 62); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(msg, w / 2, y0 + (view.small ? 25 : 36));
      if (km <= 1) { ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = '#FFB4A8'; ctx.fillText(view.small ? 'Close! Go indoors.' : 'That is close! When thunder roars, go indoors.', w / 2, y0 + (view.small ? 72 : 96)); }
    } else {
      ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(view.small ? 'Watch for the flash, then count!' : 'Watch for the flash, then count to the thunder. Tap the sky to make lightning.', w / 2, y0);
    }
    ctx.textAlign = 'left';
  },

  /* ---------- the monsoon on the east coast ---------- */
  draw_monsoon(ctx, w, h, t) {
    const m = MONSOON[this.month], S = MONSOON_SEASONS[m.s], rain = m.rain, hy = h * 0.5;
    if (!this.bg || this.bgMonth !== this.month) {
      this.bgMonth = this.month;
      this.bg = layer(w, h); const g = this.bg.getContext('2d'), dark = clamp(rain * 1.1, 0.15, 1);
      const gr = g.createLinearGradient(0, 0, 0, hy);
      gr.addColorStop(0, 'rgb(' + Math.round(110 - 70 * dark) + ',' + Math.round(170 - 110 * dark) + ',' + Math.round(225 - 120 * dark) + ')');
      gr.addColorStop(1, 'rgb(' + Math.round(190 - 90 * dark) + ',' + Math.round(215 - 100 * dark) + ',' + Math.round(235 - 100 * dark) + ')');
      g.fillStyle = gr; g.fillRect(0, 0, w, hy + 2);
      for (let i = 0; i < 40 + rain * 60; i++) { const x = rnd(-60, w + 60), y = rnd(0, hy * 0.6), r = rnd(50, 140), c = Math.round(200 - 130 * dark); const cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, 'rgba(' + c + ',' + c + ',' + (c + 12) + ',' + (0.35 + 0.4 * dark).toFixed(2) + ')'); cg.addColorStop(1, 'rgba(' + c + ',' + c + ',' + c + ',0)'); g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2); }
      // the sea, then the land with a curving beach between them
      g.fillStyle = 'rgb(' + Math.round(40 - 15 * dark) + ',' + Math.round(110 - 40 * dark) + ',' + Math.round(150 - 40 * dark) + ')'; g.fillRect(0, hy, w, h - hy);
      g.fillStyle = '#E9D8A6'; g.beginPath(); g.moveTo(w * 0.4, hy); g.lineTo(w * 0.56, hy); g.bezierCurveTo(w * 0.6, hy + h * 0.2, w * 0.66, h * 0.8, w * 0.72, h); g.lineTo(w * 0.22, h); g.closePath(); g.fill();
      g.fillStyle = '#5E8C3A'; g.beginPath(); g.moveTo(0, hy - 2); g.lineTo(w * 0.42, hy - 2); g.bezierCurveTo(w * 0.42, hy + h * 0.15, w * 0.36, h * 0.8, w * 0.3, h); g.lineTo(0, h); g.closePath(); g.fill();
      for (let i = 0; i < 3; i++) {   // houses on stilts
        const x = w * (0.04 + i * 0.11), y = hy + h * (0.12 + i * 0.05), s = Math.min(h * 0.09, w * 0.075);
        g.fillStyle = '#5A3B22'; for (let k = 0; k < 4; k++) g.fillRect(x + k * s * 0.4, y, 4, s * 0.45);
        g.fillStyle = '#8B5A33'; g.fillRect(x - 6, y - s * 0.5, s * 1.4, s * 0.52);
        g.fillStyle = '#6E2C1B'; g.beginPath(); g.moveTo(x - 14, y - s * 0.48); g.lineTo(x + s * 0.64, y - s * 1.0); g.lineTo(x + s * 1.48, y - s * 0.48); g.fill();
        g.fillStyle = 'rgba(255,214,140,.9)'; g.fillRect(x + s * 0.5, y - s * 0.36, s * 0.2, s * 0.18);
      }
    }
    ctx.drawImage(this.bg, 0, 0, w, h);
    // waves: bigger in the northeast monsoon
    const amp = m.s === 'ne' ? 9 + rain * 10 : 3;
    ctx.strokeStyle = 'rgba(235,245,255,.55)'; ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const y = hy + 10 + k * h * 0.06, x0 = w * (0.58 + k * 0.03); ctx.beginPath(); for (let x = x0; x <= w; x += 10) { const yy = y + Math.sin(x / 40 + t * (1.5 + k * 0.2) * (m.s === 'ne' ? 2 : 1)) * amp * (0.4 + k * 0.15); if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
    // palm trees that bend with the wind
    const bend = this.windX || 0;
    [[0.47, 0.66], [0.52, 0.74], [0.57, 0.84]].forEach(([px, py], i) => {
      const x = w * px, base = h * py, s = Math.min(h * 0.24, w * 0.3), sway = bend * 0.35 + Math.sin(t * 1.8 + i) * 0.04 * (1 + rain);
      ctx.strokeStyle = '#4A3423'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
      const tx = x + sway * s, ty = base - s;
      ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sway * s * 0.3, base - s * 0.55, tx, ty); ctx.stroke();
      ctx.strokeStyle = '#2F6B2C'; ctx.lineWidth = s * 0.035;
      for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k / 7 - 0.5) * 2.8 + sway * 1.3; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * s * 0.3, ty + Math.sin(a) * s * 0.2 - s * 0.06, tx + Math.cos(a) * s * 0.5 + sway * s * 0.3, ty + Math.sin(a) * s * 0.3 + s * 0.12); ctx.stroke(); }
    });
    // rain: how much depends on the month
    const n = Math.round(this.rain.length * clamp(rain, 0.06, 1));
    ctx.strokeStyle = 'rgba(210,225,245,' + (0.25 + rain * 0.25).toFixed(2) + ')'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let i = 0; i < n; i++) { const p = this.rain[i]; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - this.windX * 18 * p.v, p.y + 22 * p.v); }
    ctx.stroke();
    if (rain > 0.9) {                     // flood water rising over the low land
      ctx.fillStyle = 'rgba(96,130,150,.72)'; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w * 0.34; x += 10) ctx.lineTo(x, h * 0.86 + Math.sin(x / 30 + t * 2) * 3);
      ctx.lineTo(w * 0.34, h); ctx.closePath(); ctx.fill();
    }
    // the wind compass
    const r = view.small ? 30 : 44, cx = r + (view.small ? 22 : 40), cy = view.top + r + (view.small ? 26 : 34);
    ctx.fillStyle = 'rgba(8,16,30,.7)'; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 ' + (view.small ? 11 : 13) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('N', cx, cy - r - 1); ctx.fillText('S', cx, cy + r + 10); ctx.fillText('E', cx + r + 5, cy + 4); ctx.fillText('W', cx - r - 5, cy + 4); ctx.textAlign = 'left';
    if (m.s !== 'inter') {
      const from = m.s === 'ne' ? -Math.PI / 4 : Math.PI * 3 / 4, fx = cx + Math.cos(from) * r * 0.8, fy = cy + Math.sin(from) * r * 0.8, tx = cx - Math.cos(from) * r * 0.8, ty = cy - Math.sin(from) * r * 0.8;
      ctx.strokeStyle = '#FFD666'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
      const a = Math.atan2(ty - fy, tx - fx); ctx.fillStyle = '#FFD666'; ctx.beginPath(); ctx.moveTo(tx + Math.cos(a) * 6, ty + Math.sin(a) * 6); ctx.lineTo(tx + Math.cos(a + 2.5) * 13, ty + Math.sin(a + 2.5) * 13); ctx.lineTo(tx + Math.cos(a - 2.5) * 13, ty + Math.sin(a - 2.5) * 13); ctx.fill();
    } else { ctx.fillStyle = '#FFD666'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill(); }
    this.season = S;
  },

  /* ---------- blizzard ---------- */
  draw_blizzard(ctx, w, h, t) {
    const hy = h * 0.6;
    if (!this.bg) {
      this.bg = layer(w, h); const g = this.bg.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, hy); gr.addColorStop(0, '#59677D'); gr.addColorStop(1, '#AEB9C9'); g.fillStyle = gr; g.fillRect(0, 0, w, hy + 2);
      g.fillStyle = '#8D9AAE'; g.beginPath(); g.moveTo(0, hy); for (let x = 0; x <= w; x += 10) g.lineTo(x, hy - h * 0.12 * noise(x / w * 3, 5)); g.lineTo(w, hy); g.fill();
      const sg = g.createLinearGradient(0, hy, 0, h); sg.addColorStop(0, '#E7EDF5'); sg.addColorStop(1, '#C8D3E2'); g.fillStyle = sg; g.fillRect(0, hy, w, h - hy);
      for (let i = 0; i < 9; i++) { const x = rnd(0, w), b = hy + rnd(0, h * 0.1), s = h * rnd(0.1, 0.18); g.fillStyle = '#2E4A44'; for (let k = 0; k < 4; k++) { const y = b - s * (0.25 + k * 0.2), wd = s * (0.4 - k * 0.08); g.beginPath(); g.moveTo(x - wd, y); g.lineTo(x, y - s * 0.32); g.lineTo(x + wd, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x - wd * 0.7, y - s * 0.06); g.lineTo(x, y - s * 0.3); g.lineTo(x + wd * 0.5, y - s * 0.1); g.fill(); g.fillStyle = '#2E4A44'; } }
      const hx = w * 0.2, hb = h * 0.8, hs = h * 0.16;
      g.fillStyle = '#7A4B33'; g.fillRect(hx, hb - hs * 0.6, hs * 1.2, hs * 0.6);
      g.fillStyle = '#F4F7FB'; g.beginPath(); g.moveTo(hx - hs * 0.15, hb - hs * 0.58); g.lineTo(hx + hs * 0.6, hb - hs * 1.1); g.lineTo(hx + hs * 1.35, hb - hs * 0.58); g.fill();
      g.fillStyle = 'rgba(255,200,110,.95)'; g.fillRect(hx + hs * 0.2, hb - hs * 0.45, hs * 0.22, hs * 0.18); g.fillRect(hx + hs * 0.75, hb - hs * 0.45, hs * 0.22, hs * 0.18);
      g.fillStyle = '#5C4033'; for (let k = 0; k < 12; k++) g.fillRect(w * 0.45 + k * w * 0.04, h * 0.78, 6, h * 0.07);
      g.fillRect(w * 0.45, h * 0.795, w * 0.44, 4); g.fillRect(w * 0.45, h * 0.825, w * 0.44, 4);
    }
    ctx.drawImage(this.bg, 0, 0, w, h);
    // the snowdrift piling up against the fence
    const d = this.drift;
    if (d > 0.01) { ctx.fillStyle = '#F7FAFD'; ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.86); for (let x = w * 0.42; x <= w * 0.92; x += 10) ctx.lineTo(x, h * 0.86 - d * h * 0.09 * (0.6 + 0.4 * Math.sin(x / 50))); ctx.lineTo(w * 0.92, h * 0.86); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    this.snow.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.7 + this.wind / 120), 0, TAU); ctx.fill(); });
    const haze = clamp((this.wind - 15) / 70, 0, 0.62);
    if (haze > 0) { ctx.fillStyle = 'rgba(232,238,246,' + haze.toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
  }
};
