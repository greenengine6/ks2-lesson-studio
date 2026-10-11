/* lkie.like backgrounds: ready-made looks, any colour, or a picture. A pack has one, and any slide can have its own.
   Dark looks turn the free text white; boxes stay light with dark text and diagrams sit on a white card, so every
   slide stays readable. The same looks are painted into the PowerPoint download. */
import { esc } from '../core.js?v=7a165bee';
import { picURL, pictureData, safePic } from '../pics.js?v=7a165bee';

export const LOOKS = [
  { id: 'bright', name: 'Bright', bg: '#FFFFFF', sw: 'linear-gradient(90deg,#E35D5B 0 14%,#F28C38 0 31%,#F2C14E 0 42%,#4FA36B 0 58%,#2D9C9C 0 70%,#3E7CC7 0 87%,#8466C4 0) top/100% 22% no-repeat,#FFFFFF' },
  { id: 'calm', name: 'Calm', bg: '#FBF7EE', sw: '#FBF7EE' },
  { id: 'paper', name: 'Lined paper', bg: '#FFFEF8', sw: 'linear-gradient(90deg,transparent 18%,#EBA0A0 18% 22%,transparent 22%),repeating-linear-gradient(180deg,#FFFEF8 0 7px,#BFD3EE 7px 8px)' },
  { id: 'ocean', name: 'Ocean', bg: '#CDEBFB', grad: ['#EAF7FF', '#CDEBFB', '#B0DCF5'], sw: 'linear-gradient(165deg,#EAF7FF,#B0DCF5)' },
  { id: 'forest', name: 'Forest', bg: '#DDF2E3', grad: ['#F2FBF4', '#DDF2E3', '#C6E8CF'], sw: 'linear-gradient(165deg,#F2FBF4,#C6E8CF)' },
  { id: 'sunset', name: 'Sunset', bg: '#FFE2C9', grad: ['#FFF7EE', '#FFE2C9', '#FFCBA8'], sw: 'linear-gradient(165deg,#FFF7EE,#FFCBA8)' },
  { id: 'chalk', name: 'Chalkboard', bg: '#24402F', dark: true, sw: 'radial-gradient(circle at 30% 20%,rgb(255 255 255 / .15),transparent 60%),#24402F' },
  { id: 'night', name: 'Night sky', bg: '#0F172A', dark: true, stars: true, sw: 'radial-gradient(circle at 28% 32%,#FFF 0 1px,transparent 1.6px),radial-gradient(circle at 70% 62%,#FFF 0 1px,transparent 1.6px),radial-gradient(circle at 52% 22%,#FFF 0 .8px,transparent 1.3px),#0F172A' },
  { id: 'space', name: 'Space', bg: '#21164A', dark: true, stars: true, grad: ['#2E1D63', '#170F33'], sw: 'radial-gradient(circle at 75% 25%,rgb(139 92 246 / .75),transparent 60%),radial-gradient(circle at 30% 70%,#FFF 0 1px,transparent 1.6px),#21164A' }
];
const BY = Object.fromEntries(LOOKS.map((l) => [l.id, l]));

/* The same starry sky on the slide (an SVG) and in the PowerPoint (drawn on a canvas). */
const STARS = (() => {
  let h = 0x2F6E2B1;
  const r = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  return Array.from({ length: 52 }, () => [r(), r(), 0.3 + r() * 0.8, 0.45 + r() * 0.55]);
})();
const STAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">' + STARS.map(([x, y, s, o]) => '<circle cx="' + (x * 160).toFixed(1) + '" cy="' + (y * 90).toFixed(1) + '" r="' + (s * 0.42).toFixed(2) + '" fill="#FFFFFF" fill-opacity="' + o.toFixed(2) + '"/>').join('') + '</svg>';
const STAR_URL = "url('data:image/svg+xml," + encodeURIComponent(STAR_SVG) + "')";

export function lum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 1;
  const n = parseInt(m[1], 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
/* A stored look: a ready-made id, { c: '#RRGGBB' }, or { pic, shade: 'light' | 'dark' }. Anything else is ignored. */
export function normLook(v) {
  if (typeof v === 'string') return BY[v] ? v : null;
  if (v && typeof v === 'object') {
    if (typeof v.c === 'string' && /^#[0-9a-f]{6}$/i.test(v.c)) return { c: v.c.toUpperCase() };
    if (safePic(v.pic)) return { pic: v.pic, shade: v.shade === 'dark' ? 'dark' : 'light' };
  }
  return null;
}
export const lookFor = (p, s, theme) => normLook(s && s.look) || normLook(p && p.look) || (theme === 'calm' ? 'calm' : 'bright');
export function sameLook(a, b) { return JSON.stringify(normLook(a)) === JSON.stringify(normLook(b)); }
function bgLayer(pic) {
  const src = picURL(pic, pic.size === 'full' ? 'full' : pic.size || '1280');
  const img = pic.up && !src ? '<img data-up="' + esc(pic.up) + '" alt="" decoding="async">' : '<img src="' + esc(src) + '" alt="" decoding="async">';
  return '<div class="lk-bg" aria-hidden="true">' + img + '<i></i></div>';
}
/* Everything a slide needs to wear its look: classes, inline style, a picture layer, and whether the colour edge shows. */
export function lookInfo(v) {
  const n = normLook(v) || 'bright';
  if (typeof n === 'string') {
    const l = BY[n];
    return { id: n, name: l.name, dark: !!l.dark, bg: l.bg, cls: 'lk-l-' + n + (n === 'calm' ? ' lk-calm' : '') + (l.dark ? ' lk-dark' : ''), style: l.stars ? ';--lk-stars:' + STAR_URL : '', layer: '', edge: n === 'bright' };
  }
  if (n.c) { const dark = lum(n.c) < 0.42; return { id: 'colour', name: 'Your colour', dark, bg: n.c, cls: 'lk-l-colour' + (dark ? ' lk-dark' : ''), style: ';--lk-bg:' + n.c, layer: '', edge: false }; }
  const dark = n.shade === 'dark';
  return { id: 'pic', name: 'Picture', dark, bg: dark ? '#1B2440' : '#FFFFFF', cls: 'lk-l-pic' + (dark ? ' lk-dark' : ''), style: '', layer: bgLayer(n.pic), edge: false };
}
export const swatchOf = (id) => (BY[id] || BY.bright).sw;

/* ---------------- the PowerPoint: a colour, or a painted picture for the whole slide ---------------- */
function paint(id) {
  const W = 1600, H = 900, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d'), l = BY[id];
  if (l.grad) {
    const gr = g.createLinearGradient(560, 0, 1040, H);
    l.grad.forEach((col, i) => gr.addColorStop(i / (l.grad.length - 1), col));
    g.fillStyle = gr;
  } else g.fillStyle = l.bg;
  g.fillRect(0, 0, W, H);
  if (id === 'paper') {
    g.fillStyle = 'rgba(120,160,214,0.32)';
    for (let y = 61.6; y < H; y += 64) g.fillRect(0, y, W, 2.4);
    g.fillStyle = 'rgba(232,120,120,0.55)'; g.fillRect(49.6, 0, 3.2, H);
  } else if (id === 'chalk') {
    const r = g.createRadialGradient(400, 90, 10, 400, 90, 1100); r.addColorStop(0, 'rgba(255,255,255,0.09)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#7A5634'; g.lineWidth = 32; g.strokeRect(0, 0, W, H);
  } else if (l.stars) {
    const r = id === 'space' ? g.createRadialGradient(1360, 135, 10, 1360, 135, 700) : g.createRadialGradient(1280, 0, 10, 1280, 0, 900);
    r.addColorStop(0, id === 'space' ? 'rgba(139,92,246,0.45)' : 'rgba(30,42,79,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    STARS.forEach(([x, y, s, o]) => { g.fillStyle = 'rgba(255,255,255,' + o.toFixed(2) + ')'; g.beginPath(); g.arc(x * W, y * H, s * 4.2, 0, Math.PI * 2); g.fill(); });
  }
  return c.toDataURL('image/jpeg', 0.9);
}
const hex6 = (c) => String(c).replace('#', '').toUpperCase();
/* { color } for a plain background, or { data } for a picture to lay under the whole slide; plus dark. */
export async function lookForPptx(v, memo) {
  const L = lookInfo(v), key = JSON.stringify(normLook(v) || 'bright');
  if (memo && memo.has(key)) return memo.get(key);
  let out;
  if (L.id === 'bright' || L.id === 'calm' || L.id === 'colour') out = { color: hex6(L.bg), dark: L.dark };
  else if (L.id === 'pic') {
    const n = normLook(v), d = await pictureData(n.pic, { cover: true, aspect: 16 / 9, max: 1600, scrim: L.dark ? 'rgba(9,14,28,0.58)' : 'rgba(255,255,255,0.74)' });
    out = d ? { data: d.data, dark: L.dark } : { color: L.dark ? '1B2440' : 'FFFFFF', dark: L.dark };
  } else {
    let data = '';
    try { data = paint(L.id); } catch (e) { data = ''; }
    out = data ? { data, dark: L.dark } : { color: hex6(L.bg), dark: L.dark };
  }
  if (memo) memo.set(key, out);
  return out;
}
