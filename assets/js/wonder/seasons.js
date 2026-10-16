/* Seasons: the Earth going round the Sun with its tilt always pointing the same way, and a close-up showing which
   half leans towards the Sun on the chosen day, with how long the day is in London, Kuala Lumpur and Sydney. */
import { MONSOON } from './data.js?v=f99d8766';
import { TAU, clamp, layer, rnd, view, FONT, decOnDay, dayLength } from './util.js?v=f99d8766';

const RAD = Math.PI / 180, TILT = 23.44 * RAD;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const PLACES = [
  { name: 'London', lat: 51.5, col: '#7CC4FF', south: false },
  { name: 'Kuala Lumpur', lat: 3.1, col: '#FFD666', tropic: true },
  { name: 'Sydney', lat: -33.9, col: '#FF9DB8', south: true }
];
export function dayOfYear(d) { return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5); }
export function dateOf(doy) { const d = new Date(Date.UTC(2025, 0, Math.round(doy))); return { day: d.getUTCDate(), month: d.getUTCMonth(), text: d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] }; }
/* The season at a place in a month (the Met Office's way: spring is March to May). */
export function seasonOf(place, month) {
  if (place.tropic) return MONSOON[month].s === 'ne' ? 'Hot, with the monsoon rains' : 'Hot all year';
  const n = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'][month];
  return place.south ? { Winter: 'Summer', Summer: 'Winter', Spring: 'Autumn', Autumn: 'Spring' }[n] : n;
}

export const seasons = {
  id: 'seasons', doy: dayOfYear(new Date()), playing: false,
  init(w, h) { this.w = w; this.h = h; this.bg = null; },
  resize(w, h) { this.w = w; this.h = h; this.bg = null; },
  setDay(d) { this.doy = ((d - 1) % 365 + 365) % 365 + 1; },
  step(dt) { if (this.playing) this.setDay(this.doy + dt * 14); },
  geo() {
    const w = this.w, h = this.h, phone = w < 760 && h > w;
    if (phone) {
      const Rx = Math.min(w * 0.38, 230), cy = view.top + 40 + Rx * 0.34;
      return { phone, cx: w / 2, cy, Rx, Ry: Rx * 0.34, gx: w / 2 + 10, gy: Math.max(cy + Rx * 0.34 + 180, h * 0.45), RG: Math.min(w * 0.15, h * 0.07) };
    }
    const Rx = Math.min(w * 0.22, h * 0.56);
    return { phone, cx: w * 0.27, cy: h * 0.5, Rx, Ry: Rx * 0.36, gx: w * 0.72, gy: Math.max(h * 0.33, 230), RG: Math.min(w * 0.085, h * 0.13) };
  },
  /* Where the Earth is on its orbit for a day of the year: June on the left (the north leans towards the Sun),
     December on the right, March at the back, September at the front. */
  orbitPos(doy, G) {
    const psi = TAU * (doy - 80) / 365.25 + Math.PI / 2;
    return { x: G.cx + G.Rx * Math.cos(psi), y: G.cy - G.Ry * Math.sin(psi), z: -Math.sin(psi) };
  },
  click(x, y) {
    const G = this.geo(), dx = (x - G.cx) / G.Rx, dy = -(y - G.cy) / G.Ry, r = Math.hypot(dx, dy);
    if (r < 0.6 || r > 1.45) return null;
    const psi = Math.atan2(dy, dx), doy = 80 + (psi - Math.PI / 2) / TAU * 365.25;
    this.setDay(Math.round(doy));
    this.playing = false;
    return { seasons: true };
  },
  draw(ctx, w, h, t) {
    if (!this.bg) {
      this.bg = layer(w, h); const g = this.bg.getContext('2d');
      const gr = g.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, Math.max(w, h)); gr.addColorStop(0, '#0B1430'); gr.addColorStop(1, '#03040B');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 420; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(0.15, 0.8).toFixed(2) + ')'; g.fillRect(rnd(0, w), rnd(0, h), rnd(0.6, 1.6), rnd(0.6, 1.6)); }
    }
    ctx.drawImage(this.bg, 0, 0, w, h);
    const G = this.geo(), fs = G.phone ? 11 : clamp(G.Rx / 26, 11, 15);
    // the orbit and the months
    ctx.save(); ctx.setLineDash([5, 7]); ctx.strokeStyle = 'rgba(160,190,255,.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(G.cx, G.cy, G.Rx, G.Ry, 0, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.font = '700 ' + fs + 'px ' + FONT; ctx.textAlign = 'center';
    MONTHS.forEach((m, i) => {
      const p = this.orbitPos(dateDoy(i, 15), G), out = 1 + 22 / G.Rx;
      const lx = G.cx + (p.x - G.cx) * out, ly = G.cy + (p.y - G.cy) * (1 + 22 / G.Ry);
      ctx.fillStyle = 'rgba(200,215,245,.7)'; ctx.fillText(m.slice(0, 3), lx, ly + fs * 0.35);
    });
    const E = this.orbitPos(this.doy, G), re = G.Rx * 0.075 * (1 + 0.15 * E.z), Rs = G.Rx * 0.12;
    const sun = () => {
      const gl = ctx.createRadialGradient(G.cx, G.cy, 0, G.cx, G.cy, Rs * 3.2);
      gl.addColorStop(0, 'rgba(255,240,200,1)'); gl.addColorStop(0.3, 'rgba(255,200,90,.85)'); gl.addColorStop(0.6, 'rgba(255,150,40,.2)'); gl.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(G.cx, G.cy, Rs * 3.2, 0, TAU); ctx.fill();
      const core = ctx.createRadialGradient(G.cx - Rs * 0.3, G.cy - Rs * 0.3, Rs * 0.1, G.cx, G.cy, Rs);
      core.addColorStop(0, '#FFFBEA'); core.addColorStop(0.6, '#FFD15C'); core.addColorStop(1, '#FF9F1C');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(G.cx, G.cy, Rs * (1 + Math.sin(t * 2) * 0.012), 0, TAU); ctx.fill();
    };
    const earth = () => {
      const dx = G.cx - E.x, dy = G.cy - E.y, l = Math.hypot(dx, dy) || 1;
      const gr = ctx.createRadialGradient(E.x + dx / l * re * 0.5, E.y + dy / l * re * 0.5, re * 0.1, E.x, E.y, re * 1.1);
      gr.addColorStop(0, '#BFE8FF'); gr.addColorStop(0.45, '#3A86E0'); gr.addColorStop(1, '#081428');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(E.x, E.y, re, 0, TAU); ctx.fill();
      const ax = Math.sin(TILT) * re * 1.7, ay = Math.cos(TILT) * re * 1.7;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(E.x - ax, E.y + ay); ctx.lineTo(E.x + ax, E.y - ay); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillText('N', E.x + ax * 1.25, E.y - ay * 1.25);
      const d = dateOf(this.doy);
      ctx.font = '800 ' + (fs + 1) + 'px ' + FONT; const txt = d.text, tw = ctx.measureText(txt).width + 18;
      ctx.fillStyle = 'rgba(255,216,77,.95)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(E.x - tw / 2, E.y + re + 10, tw, fs + 14, 10); else ctx.rect(E.x - tw / 2, E.y + re + 10, tw, fs + 14); ctx.fill();
      ctx.fillStyle = '#1A1405'; ctx.fillText(txt, E.x, E.y + re + 10 + fs + 3);
    };
    if (E.z < 0) { earth(); sun(); } else { sun(); earth(); }
    // the close-up: sunlight from the side the Sun is on in the picture above (so the tilt matches), the tilt towards
    // or away from the Sun, and three places; the longer the bright part of a place's line, the longer its day
    const dec = decOnDay(this.doy) * RAD, gx = G.gx, gy = G.gy, R = G.RG, sd = E.x < G.cx ? -1 : 1;     // sd 1: Sun on the left
    ctx.strokeStyle = 'rgba(255,214,102,.85)'; ctx.fillStyle = 'rgba(255,214,102,.85)'; ctx.lineWidth = 2.5;
    for (let k = -2; k <= 2; k++) {
      const y = gy + k * R * 0.42, x0 = gx - sd * R * 2.15, x1 = gx - sd * R * 1.25;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 + sd * 8, y); ctx.lineTo(x1 - sd * 2, y - 6); ctx.lineTo(x1 - sd * 2, y + 6); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.font = '800 ' + fs + 'px ' + FONT; ctx.fillText('Sunlight', gx - sd * R * 1.7, gy - R * 1.12);
    ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = '#0D2242'; ctx.fillRect(gx - R, gy - R, R * 2, R * 2);
    const litX = sd > 0 ? gx - R : gx, day = ctx.createLinearGradient(gx - sd * R, gy, gx, gy);
    day.addColorStop(0, '#6FB7F2'); day.addColorStop(1, '#2F78C8');
    ctx.fillStyle = day; ctx.fillRect(litX, gy - R, R, R * 2);
    const N = [-sd * Math.sin(dec), -Math.cos(dec)], Pp = [Math.cos(dec), -sd * Math.sin(dec)];
    const lat = (phi, col, dash, wd) => {
      const s = Math.sin(phi * RAD), c = Math.cos(phi * RAD), mx = gx + N[0] * R * s, my = gy + N[1] * R * s;
      const a = [mx - Pp[0] * R * c, my - Pp[1] * R * c], b = [mx + Pp[0] * R * c, my + Pp[1] * R * c];
      ctx.setLineDash(dash || []); ctx.lineWidth = wd || 3;
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(litX - 2, gy - R - 2, R + 4, R * 2 + 4); ctx.clip();
      ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
      ctx.setLineDash([]);
      return sd > 0 ? b : a;                                   // the end away from the sunlight, for the name
    };
    lat(0, 'rgba(255,255,255,.7)', [5, 5], 1.5);
    const ends = PLACES.map((p) => lat(p.lat, p.col));
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx - N[0] * R * 1.25, gy - N[1] * R * 1.25); ctx.lineTo(gx + N[0] * R * 1.25, gy + N[1] * R * 1.25); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText(G.phone ? 'N' : 'North Pole', gx + N[0] * R * 1.42, gy + N[1] * R * 1.42 - 2);
    ctx.font = '800 ' + fs + 'px ' + FONT; ctx.textAlign = sd > 0 ? 'left' : 'right';
    ends.forEach((b, i) => { ctx.fillStyle = PLACES[i].col; ctx.fillText(PLACES[i].name, b[0] + sd * 8, b[1] + fs * 0.35); });
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('Night', gx + sd * R * 0.5, gy + R + fs + 8);
    ctx.fillStyle = 'rgba(255,214,102,.9)'; ctx.fillText('Day', gx - sd * R * 0.5, gy + R + fs + 8);
    const deg = dec / RAD, lean = deg > 2 ? 'The North Pole leans towards the Sun' : deg < -2 ? 'The North Pole leans away from the Sun' : 'Neither pole leans towards the Sun';
    ctx.font = '800 ' + (fs + 2) + 'px ' + FONT; ctx.fillStyle = '#EAF1FF';
    ctx.fillText(lean, gx, gy - R * 1.72);
    ctx.textAlign = 'left';
    this.lean = lean;
  }
};
function dateDoy(month, day) { return Math.round((Date.UTC(2025, month, day) - Date.UTC(2025, 0, 0)) / 864e5); }
export const daylight = (place, doy) => dayLength(place.lat, decOnDay(doy));
