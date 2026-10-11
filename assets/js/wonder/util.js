/* Small helpers shared by Wonder Window's windows: random numbers, a soft noise for wind and drifting, emoji drawn
   once and reused (so dozens of animals stay smooth), and whether this device shows flag emoji. */
export const TAU = Math.PI * 2;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (t) => t * t * (3 - 2 * t);
/* view.small: a phone-sized screen (fewer birds, smaller labels); view.dpr: pixels per CSS pixel; view.top: where the top bar
   ends, so labels drawn on the scene stay clear of it. Set by the Wonder Window frame. */
export const view = { small: Math.min(window.innerWidth, window.innerHeight) < 700, dpr: 1, top: 72 };
export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';

/* ---------- a tiny 2D value noise ---------- */
const P = new Uint8Array(512);
(() => { const p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; })();
export function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => P[(P[(xi + i) & 255] + yi + j) & 255] / 255;
  const u = smooth(xf), v = smooth(yf);
  return (h(0, 0) * (1 - u) + h(1, 0) * u) * (1 - v) + (h(0, 1) * (1 - u) + h(1, 1) * u) * v;
}

/* ---------- a canvas the size of the screen, for backgrounds drawn once ---------- */
export function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

/* ---------- emoji, drawn once at each size ---------- */
const sprites = new Map();
const TINTS = { white: 'grayscale(1) brightness(1.8) contrast(.92)', sand: 'sepia(.55) saturate(.75) brightness(1.22)' };
export function emoji(e, px, tint) {
  px = Math.max(8, Math.round(px / 4) * 4);
  const key = e + '|' + px + '|' + (tint || '');
  let c = sprites.get(key);
  if (c) return c;
  const s = Math.ceil(px * 1.3);
  c = layer(s, s);
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = px + 'px ' + EMOJI_FONT;
  if (tint && TINTS[tint] && 'filter' in g) g.filter = TINTS[tint];
  g.fillText(e, s / 2, s / 2 + px * 0.05);
  sprites.set(key, c);
  if (sprites.size > 260) sprites.delete(sprites.keys().next().value);
  return c;
}
/* Draw an emoji centred at x, y, px tall; flip: face the other way. */
export function drawEmoji(ctx, e, x, y, px, o) {
  o = o || {};
  const r = view.dpr || 1, want = px * r, q = Math.max(8, Math.round(want / 4) * 4);
  const sp = emoji(e, q, o.tint), s = sp.width / r * (want / q);
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  if (o.sy) ctx.scale(1, o.sy);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(sp, -s / 2, -s / 2, s, s);
  ctx.restore();
}

/* ---------- does this device draw flag emoji? (Windows shows two letters instead) ---------- */
let flagsAt = null;
export function flagsOK() {
  if (flagsAt != null) return flagsAt;
  try {
    const c = layer(24, 24), g = c.getContext('2d', { willReadFrequently: true });
    g.textBaseline = 'top'; g.font = '20px ' + EMOJI_FONT; g.fillStyle = '#000';
    g.fillText('🇲🇾', 0, 0);
    const d = g.getImageData(0, 0, 24, 24).data;
    let colour = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && (Math.abs(d[i] - d[i + 1]) > 30 || Math.abs(d[i + 1] - d[i + 2]) > 30)) colour++;
    flagsAt = colour > 12;
  } catch (e) { flagsAt = false; }
  return flagsAt;
}
export const flag = (f) => (flagsOK() ? f : '');

/* ---------- the Sun: where it is overhead now, and how long the day is ---------- */
const RAD = Math.PI / 180;
/* Declination and the longitude where the Sun is overhead (degrees), for a time in ms. */
export function sunAt(ms) {
  const n = ms / 864e5 - 10957.5;                         // days since noon on 1 January 2000
  const L = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD, eps = (23.439 - 0.0000004 * n) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  let lon = (ra / RAD - gmst * 15) % 360;
  if (lon > 180) lon -= 360; if (lon < -180) lon += 360;
  return { lat: dec / RAD, lon };
}
/* Is it day at a place? (the Sun's height above the horizon, as a sine) */
export function sunHeight(lat, lon, sun) {
  return Math.sin(lat * RAD) * Math.sin(sun.lat * RAD) + Math.cos(lat * RAD) * Math.cos(sun.lat * RAD) * Math.cos((lon - sun.lon) * RAD);
}
/* Hours of daylight at a latitude, for the Sun's declination (degrees). */
export function dayLength(lat, dec) {
  const c = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (c <= -1) return 24;
  if (c >= 1) return 0;
  return 2 * Math.acos(c) / RAD / 15;
}
/* The Sun's declination on a day of the year (1 to 365), good to about a degree. */
export function decOnDay(doy) { return Math.asin(Math.sin(23.44 * RAD) * Math.sin(TAU * (doy - 80) / 365.25)) / RAD; }
export const hm = (h) => { const m = Math.round(h * 60); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };
