/* World Explorer's map: the whole Earth with day and night as they are right now (the dark side shows city lights),
   a little sun where the Sun is overhead, and 24 cities to tap. The map gives room to the postcard when one is open. */
import { CITIES } from './data.js?v=7a165bee';
import { TAU, clamp, smooth, layer, sunAt, sunHeight, view, FONT, flag } from './util.js?v=7a165bee';

const TOP = 78, BOTTOM = -58, SPAN = TOP - BOTTOM, ASPECT = 360 / SPAN;   // the far north and most of Antarctica are left off
const RAD = Math.PI / 180;
const img = {};
let loading = null;
function load() {
  if (!loading) loading = Promise.all(['day', 'night'].map((k) => new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { img[k] = im; res(true); };
    im.onerror = () => res(false);
    im.src = 'assets/earth/' + k + '-2k.jpg';
  })));
  return loading;
}
/* Where night is now: white where it is dark, clear where it is day, soft at dawn and dusk. */
function nightMask(sun) {
  const MW = 360, MH = Math.round(360 / ASPECT), c = layer(MW, MH), g = c.getContext('2d'), d = g.createImageData(MW, MH), a = d.data;
  const sd = Math.sin(sun.lat * RAD), cd = Math.cos(sun.lat * RAD);
  for (let j = 0; j < MH; j++) {
    const lat = (TOP - (j + 0.5) / MH * SPAN) * RAD, sl = Math.sin(lat), cl = Math.cos(lat);
    for (let i = 0; i < MW; i++) {
      const lon = -180 + (i + 0.5) / MW * 360, h = sl * sd + cl * cd * Math.cos((lon - sun.lon) * RAD);
      const k = (j * MW + i) * 4;
      a[k] = a[k + 1] = a[k + 2] = 255;
      a[k + 3] = Math.round(smooth(clamp((0.06 - h) / 0.2, 0, 1)) * 240);
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}
export const xy = (lat, lon, r) => ({ x: r.x + (lon + 180) / 360 * r.w, y: r.y + (TOP - lat) / SPAN * r.h });

export const explorer = {
  id: 'explorer',
  init(w, h) {
    this.w = w; this.h = h; this.sel = null; this.hover = null; this.comp = null; this.compAt = 0; this.dock = this.dock || 0; this.cur = null;
    this.layout(true);
    load().then(() => { this.comp = null; });
  },
  resize(w, h) { this.w = w; this.h = h; this.layout(true); },
  setDock(px) { if (px !== this.dock) { this.dock = px; this.layout(false); } },
  /* The map's place on screen: below the top bar, above the caption, and left of a docked postcard. */
  layout(snap) {
    const w = this.w, h = this.h, phone = w < 700 && h > w, narrow = w < 980;          // narrow screens: map at the top, postcard below
    const top = view.top + (phone ? 6 : 14), bottom = phone ? 160 : 150, side = 16;
    const aw = Math.max(120, w - side * 2 - this.dock), ah = Math.max(80, h - top - bottom);
    const mw = Math.min(aw, ah * ASPECT), mh = mw / ASPECT;
    this.goal = { x: side + (aw - mw) / 2, y: phone || narrow ? top : top + (ah - mh) / 2, w: mw, h: mh };
    if (snap || !this.cur) this.cur = Object.assign({}, this.goal);
    this.comp = null;
  },
  compose() {
    this.sun = sunAt(Date.now()); this.compAt = Date.now();
    if (!img.day) return null;
    const r = this.goal, dpr = view.dpr || 1, W = Math.max(2, Math.round(r.w * dpr)), H = Math.max(2, Math.round(r.h * dpr));
    const c = layer(W, H), g = c.getContext('2d');
    const crop = (im) => [0, (90 - TOP) / 180 * im.height, im.width, SPAN / 180 * im.height];
    g.drawImage(img.day, ...crop(img.day), 0, 0, W, H);
    if (img.night) {
      const n = layer(W, H), ng = n.getContext('2d');
      ng.drawImage(img.night, ...crop(img.night), 0, 0, W, H);
      ng.globalCompositeOperation = 'lighter'; ng.globalAlpha = 0.6;
      ng.drawImage(img.night, ...crop(img.night), 0, 0, W, H);          // brighter city lights
      ng.globalAlpha = 1; ng.globalCompositeOperation = 'destination-in'; ng.imageSmoothingEnabled = true;
      ng.drawImage(nightMask(this.sun), 0, 0, W, H);
      g.drawImage(n, 0, 0);
    }
    return c;
  },
  /* The city nearest to a point, if it is close enough to mean it. */
  cityAt(x, y, reach) {
    const r = this.cur;
    let best = null, bd = reach || 22;
    CITIES.forEach((c) => { const p = xy(c.lat, c.lon, r), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = c; } });
    return best;
  },
  pointer(x, y) { this.hover = this.cityAt(x, y, 18); },
  click(x, y) { const c = this.cityAt(x, y, view.small ? 30 : 24); return c ? { city: c.id } : null; },
  select(id) { this.sel = id || null; },
  step(dt) {
    const c = this.cur, g = this.goal, k = 1 - Math.pow(0.0005, dt);
    ['x', 'y', 'w', 'h'].forEach((p) => { c[p] += (g[p] - c[p]) * k; if (Math.abs(g[p] - c[p]) < 0.3) c[p] = g[p]; });
    if (img.day && (!this.comp || Date.now() - this.compAt > 30000)) this.comp = this.compose();
  },
  draw(ctx, w, h, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#040714'); bg.addColorStop(1, '#0A1733');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const r = this.cur;
    if (!this.comp) {
      ctx.fillStyle = 'rgba(80,120,190,.25)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(220,230,255,.8)'; ctx.font = '700 15px ' + FONT; ctx.textAlign = 'center';
      ctx.fillText('Loading the map…', r.x + r.w / 2, r.y + r.h / 2); ctx.textAlign = 'left';
      return;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(80,140,255,.35)'; ctx.shadowBlur = 30;
    ctx.drawImage(this.comp, r.x, r.y, r.w, r.h);
    ctx.restore();
    const fs = clamp(r.w / 105, 10.5, 15.5);
    // the equator
    const eq = xy(0, 0, r).y;
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(r.x, eq); ctx.lineTo(r.x + r.w, eq); ctx.stroke(); ctx.restore();
    ctx.font = '700 ' + (fs * 0.85) + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillText('Equator', r.x + 8, eq - 6);
    // where the Sun is overhead
    if (this.sun) {
      const s = xy(this.sun.lat, this.sun.lon, r), R = clamp(r.w / 90, 7, 15);
      const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R * 3.2);
      gl.addColorStop(0, 'rgba(255,240,170,.95)'); gl.addColorStop(0.35, 'rgba(255,200,80,.5)'); gl.addColorStop(1, 'rgba(255,190,60,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(s.x, s.y, R * 3.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,102,.95)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.4; ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * R * 1.25, s.y + Math.sin(a) * R * 1.25); ctx.lineTo(s.x + Math.cos(a) * R * 1.8, s.y + Math.sin(a) * R * 1.8); ctx.stroke(); }
      ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, TAU); ctx.fill();
    }
    // the cities
    const dot = clamp(r.w / 260, 3.2, 6.5), placed = [];
    const pts = CITIES.map((c) => ({ c, p: xy(c.lat, c.lon, r) }));
    pts.forEach(({ c, p }, i) => {
      const on = c.id === this.sel, ring = (t * 0.6 + i * 0.37) % 1;
      if (!on) { ctx.strokeStyle = 'rgba(255,214,102,' + (0.55 * (1 - ring)).toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, dot + ring * dot * 3, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = on ? '#FFD84D' : '#FFFFFF'; ctx.strokeStyle = 'rgba(10,16,32,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, on ? dot * 1.5 : dot, 0, TAU); ctx.fill(); ctx.stroke();
    });
    // names, where they fit (the chosen city and the one under the pointer always win)
    const label = (c, p, strong) => {
      const txt = (flag(c.flag) ? flag(c.flag) + ' ' : '') + c.name;
      ctx.font = (strong ? '800 ' : '700 ') + (strong ? fs * 1.12 : fs) + 'px ' + FONT;
      const tw = ctx.measureText(txt).width, ph = (strong ? fs * 1.12 : fs) + 8, pw = tw + 14;
      const tries = [[p.x + dot + 6, p.y - ph / 2], [p.x - dot - 6 - pw, p.y - ph / 2], [p.x - pw / 2, p.y - dot - 6 - ph], [p.x - pw / 2, p.y + dot + 6]];
      const fits = ([x]) => x >= r.x - 4 && x + pw <= r.x + r.w + 4;
      if (strong) tries.sort((a, b) => fits(b) - fits(a));                        // the chosen city's name always shows, inside the map if it can
      for (const [x, y] of tries) {
        const box = { x, y, w: pw, h: ph };
        if (!strong && (!fits([x]) || placed.some((b) => x < b.x + b.w && x + pw > b.x && y < b.y + b.h && y + ph > b.y))) continue;
        placed.push(box);
        ctx.fillStyle = strong ? 'rgba(255,216,77,.96)' : 'rgba(8,12,26,.72)';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, pw, ph, ph / 2); else ctx.rect(x, y, pw, ph); ctx.fill();
        ctx.fillStyle = strong ? '#1A1405' : '#F2F5FC'; ctx.fillText(txt, x + 7, y + ph / 2 + fs * 0.36);
        return;
      }
    };
    const firsts = pts.filter((q) => q.c.id === this.sel || (this.hover && q.c.id === this.hover.id));
    firsts.forEach((q) => label(q.c, q.p, true));
    if (r.w > 560) pts.forEach((q) => { if (!firsts.includes(q)) label(q.c, q.p, false); });
  },
  /* Is it day where a city is? 1 = bright day, below 0 = night. */
  light(c) { return sunHeight(c.lat, c.lon, this.sun || sunAt(Date.now())); }
};
