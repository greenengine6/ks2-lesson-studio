/* Extreme weather, drawn live: a hurricane seen from space (it spins the other way south of the equator), a
   thunderstorm with the "count to the thunder" game, the monsoon on Malaysia's east coast month by month, and a
   blizzard where the wind makes it feel colder (wind chill). */
import { MONSOON, MONSOON_SEASONS } from './data.js?v=49509700';
import { TAU, rnd, clamp, noise, view, FONT } from './util.js?v=49509700';
import { Sound } from '../fx/audio.js?v=49509700';
import { makeHurricane } from './hurricane.js?v=49509700';
import { makeSky } from './sky.js?v=49509700';
import { makeCity, makeCoast, makeSnowfield } from './wxart.js?v=49509700';

const pill = (ctx, x, y, w, h) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h); };
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
/* the bolt with its glow (no blur filters: wide faint strokes added on top of each other) */
function glowBolt(ctx, b, a) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(110,130,255,' + (0.09 * a).toFixed(3) + ')'; drawBolt(ctx, b, 22);
  ctx.strokeStyle = 'rgba(150,170,255,' + (0.22 * a).toFixed(3) + ')'; drawBolt(ctx, b, 8);
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(246,248,255,' + a.toFixed(3) + ')'; drawBolt(ctx, b, 2.4);
  ctx.restore();
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
    if (this.mode === 'hurricane' && !this.storm) this.storm = makeHurricane();
    if (this.mode !== 'hurricane' && !this.sky) this.sky = makeSky();
    if (this.mode === 'storm' && !this.city) this.city = makeCity();
    if (this.mode === 'monsoon' && !this.coast) this.coast = makeCoast();
    if (this.mode === 'blizzard' && !this.snowfield) this.snowfield = makeSnowfield();
  },
  /* the storm sits in the middle of the space between the top bar and the controls (windows.js sets bottom) */
  R() { const [cx, cy] = this.centre(), half = Math.min(cy - view.top, this.free() - cy); return Math.max(60, Math.min(cx * (view.small ? 0.92 : 0.86), half * 0.92)); },
  free() { return this.bottom > view.top + 120 ? this.bottom : this.h - (view.small ? 230 : 140); },
  centre() { return [Math.round((this.right > this.w * 0.5 ? this.right : this.w) / 2), Math.round((view.top + this.free()) / 2)]; },
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
    const w = this.w, h = this.h, tg = this.city && this.city.key ? this.city.target() : [rnd(w * 0.15, w * 0.85), h * 0.78];
    const x0 = clamp(tg[0] + rnd(-0.14, 0.14) * w, w * 0.04, w * 0.96), y0 = Math.min(tg[1] - 60, view.top + (view.small ? 118 : 150) + rnd(0, 0.04) * h);   // from the cloud, under the counting
    this.bolt = bolt(x0, y0, tg[0], tg[1], 0.2, 2);
    this.boltT = 0.45; this.flash = 1;
    const secs = [3, 6, 9, 12, 15][Math.floor(rnd(0, 5))];
    this.count = { at: 0, secs }; this.result = null; this.next = secs + rnd(12, 20);
  },
  step(dt, t) {
    const w = this.w, h = this.h;
    if (this.mode === 'hurricane') this.spin = (this.spin || 0) + dt;
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
    if (!this.storm) this.storm = makeHurricane();
    const [cx, cy] = this.centre(), R = this.R(), dir = this.south ? -1 : 1, sm = view.small;
    this.storm.draw(ctx, w, h, cx, cy, R, this.spin || 0, this.south);
    // which way it spins: two curved arrows around the storm
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, 1); ctx.lineCap = 'round';
    [0, Math.PI].forEach((off) => {
      const r = R * 1.1, a0 = off - Math.PI * 0.62, a1 = off - Math.PI * 0.86;
      ctx.strokeStyle = 'rgba(255,214,102,.28)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, r, a0, a1, true); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,102,.95)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, r, a0, a1, true); ctx.stroke();
      const ax = Math.cos(a1) * r, ay = Math.sin(a1) * r, tx = Math.sin(a1), ty = -Math.cos(a1);         // the arrow head points along the turn
      ctx.fillStyle = 'rgba(255,214,102,.95)'; ctx.beginPath(); ctx.moveTo(ax + tx * 13, ay + ty * 13); ctx.lineTo(ax - ty * 8 - tx * 3, ay + tx * 8 - ty * 3); ctx.lineTo(ax + ty * 8 - tx * 3, ay - tx * 8 - ty * 3); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
    // labels with lines to what they name
    const fs = sm ? 12.5 : 15;
    ctx.font = '800 ' + fs + 'px ' + FONT; ctx.textBaseline = 'middle';
    const tag = (txt, x, y, tx, ty) => {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      const tw = ctx.measureText(txt).width + 22, bx = clamp(tx - (tx < x ? tw : 0), 6, w - tw - 6);
      ctx.fillStyle = 'rgba(6,20,40,.82)'; pill(ctx, bx, ty - 15, tw, 30); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1; pill(ctx, bx, ty - 15, tw, 30); ctx.stroke();
      ctx.fillStyle = '#F4F7FC'; ctx.fillText(txt, bx + 11, ty + 1);
    };
    const er = R * 0.108, a = -Math.PI * 0.25;
    tag('The eye', cx, cy, cx + R * (sm ? 0.42 : 0.55) * dir, cy - R * 0.72);
    tag('Eyewall', cx - er * Math.cos(a) * dir, cy + er * Math.sin(-a), cx - R * (sm ? 0.5 : 0.7) * dir, cy + R * 0.78);
    tag('Rain bands', cx + R * 0.62 * dir, cy + R * 0.3, cx + R * (sm ? 0.58 : 0.86) * dir, cy + R * 0.86);
    ctx.textBaseline = 'alphabetic';
    const msg = this.south ? 'South of the equator: spinning clockwise' : 'North of the equator: spinning anticlockwise';
    ctx.font = '800 ' + (fs + 1) + 'px ' + FONT; const tw = ctx.measureText(msg).width + 28;
    ctx.fillStyle = 'rgba(6,20,40,.82)'; pill(ctx, (w - tw) / 2, view.top + 14, tw, 36); ctx.fill(); ctx.fillStyle = '#FFD666'; ctx.textBaseline = 'middle'; ctx.fillText(msg, (w - tw) / 2 + 14, view.top + 32.5); ctx.textBaseline = 'alphabetic';
  },

  /* ---------- thunderstorm ---------- */
  draw_storm(ctx, w, h, t) {
    const city = this.city, dt = clamp(t - (this.lastT || t), 0, 0.1), f = this.flash, B = this.bolt && this.boltT > 0 ? this.bolt : null;
    this.lastT = t;
    city.build(w, h, view.top, this.free());
    const top = B ? B.pts[0] : [w / 2, view.top];
    this.sky.draw(ctx, w, h, t, { key: 'storm', hz: city.hz, cover: 0.97, wind: -0.3, scud: 0.75, veil: 0.85, zen: [0.085, 0.1, 0.145], hor: [0.37, 0.34, 0.37], lit: [0.36, 0.38, 0.45], base: [0.1, 0.115, 0.16], flash: [top[0], top[1] + h * 0.05, h * 0.3, f * 0.8] });
    if (B) glowBolt(ctx, B, clamp(this.boltT / 0.3, 0, 1) * (0.55 + 0.45 * Math.min(1, f * 1.5)));
    city.draw(ctx, w, h, t, dt, f);
    // rain: fine and faint further away, longer and brighter close by
    [[0, 1, 'rgba(170,182,205,.22)', 0.9, 14], [1, 2, 'rgba(200,210,228,.42)', 1.3, 24]].forEach(([lo, hi, col, lw, len]) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      this.rain.forEach((p, i) => { if ((i & 1) !== lo) return; const L = len * p.v; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - this.windX * L * 0.9, p.y + L); });
      ctx.stroke();
    });
    if (f > 0) { ctx.fillStyle = 'rgba(215,225,255,' + (f * 0.1).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
    // count to the thunder
    const fs = view.small ? 15 : 19, y0 = view.top + (view.small ? 30 : 46);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
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
      ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.fillText(view.small ? 'Watch for the flash, then count!' : 'Watch for the flash, then count to the thunder. Tap the sky to make lightning.', w / 2, y0);
    }
    ctx.restore();
  },

  /* ---------- the monsoon on the east coast ---------- */
  draw_monsoon(ctx, w, h, t) {
    const m = MONSOON[this.month], S = MONSOON_SEASONS[m.s], rain = m.rain, ne = m.s === 'ne', coast = this.coast;
    coast.build(w, h, view.top, this.free(), m);
    const k = clamp(rain * 1.05, 0, 1), L = (a, b) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    this.sky.draw(ctx, w, h, t, {
      key: 'monsoon' + this.month, hz: coast.hz, cover: 0.36 + 0.62 * k, wind: (this.windX || 0) * 0.8, scud: ne ? k * 0.6 : 0, veil: Math.max(0, k - 0.35) * 1.4,
      zen: L([0.2, 0.45, 0.82], [0.24, 0.27, 0.32]), hor: L([0.72, 0.83, 0.92], [0.55, 0.58, 0.62]), lit: L([1, 0.99, 0.97], [0.6, 0.63, 0.68]), base: L([0.62, 0.66, 0.74], [0.27, 0.3, 0.35]),
      sun: k < 0.6 ? [w * 0.74, view.top + (coast.hz - view.top) * 0.28, (0.6 - k) * 1.3] : null,
      sea: true, wave: ne ? 0.45 + 0.5 * k : 0.12 + 0.25 * k, seaN: L([0.03, 0.32, 0.42], [0.12, 0.24, 0.28]), seaF: L([0.15, 0.45, 0.62], [0.3, 0.37, 0.42])
    });
    coast.draw(ctx, w, h, t, this.windX || 0, rain);
    // rain: how much depends on the month
    const n = Math.round(this.rain.length * clamp(rain, 0.06, 1));
    ctx.strokeStyle = 'rgba(210,225,245,' + (0.25 + rain * 0.25).toFixed(2) + ')'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let i = 0; i < n; i++) { const p = this.rain[i]; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - this.windX * 18 * p.v, p.y + 22 * p.v); }
    ctx.stroke();
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
    const sf = this.snowfield, dt = clamp(t - (this.lastB || t), 0, 0.1), k = clamp(this.wind / 90, 0, 1);
    this.lastB = t;
    sf.build(w, h, view.top, this.free());
    this.sky.draw(ctx, w, h, t, { key: 'blizzard', hz: sf.hz, cover: 0.9, wind: 0.15 + k * 1.1, snow: k * 0.6, zen: [0.5, 0.56, 0.64], hor: [0.8, 0.84, 0.89], lit: [0.86, 0.88, 0.92], base: [0.55, 0.6, 0.68] });
    sf.draw(ctx, w, h, t, dt, this.wind, this.drift);
    // falling snow: small and faint far away, big close by; streaking sideways in a strong wind
    const streak = this.wind > 35;
    [[0, 1.6, 0.5], [1.6, 2.5, 0.72], [2.5, 9, 0.92]].forEach(([lo, hi, a]) => {
      ctx.fillStyle = ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.beginPath();
      for (const p of this.snow) {
        if (p.s < lo || p.s >= hi) continue;
        if (streak) { const L = 0.03 * (0.6 + k); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - this.wind * 9 * p.v * L, p.y - (35 + this.wind * 0.6) * p.v * L); }
        else { const r = p.s * (0.7 + this.wind / 160); ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, TAU); }
      }
      if (streak) { ctx.lineWidth = (lo + Math.min(hi, 3.4)) * 0.45; ctx.lineCap = 'round'; ctx.stroke(); } else ctx.fill();
    });
    // the whiteout: thickest in the distance, thinner close by
    const haze = clamp((this.wind - 15) / 75, 0, 0.6);
    if (haze > 0) {
      const hg = ctx.createLinearGradient(0, 0, 0, h); hg.addColorStop(0, 'rgba(232,238,246,' + (haze * 0.85).toFixed(3) + ')'); hg.addColorStop(sf.hz / h, 'rgba(232,238,246,' + haze.toFixed(3) + ')'); hg.addColorStop(1, 'rgba(232,238,246,' + (haze * 0.35).toFixed(3) + ')');
      ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);
    }
  }
};
