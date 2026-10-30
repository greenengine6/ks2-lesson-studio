/* lkie.like backgrounds: ready-made looks, any colour, or a picture. A pack has one, and any slide can have its own.
   Dark looks turn the free text white; boxes stay light with dark text and diagrams sit on a white card, so every
   slide stays readable. The same looks are painted into the PowerPoint download. */
import { esc } from '../core.js?v=af1c9ebd';
import { picURL, pictureData, safePic } from '../pics.js?v=af1c9ebd';

export const LOOKS = [
  { id: 'bright', name: 'Bright', bg: '#FFFFFF', sw: 'linear-gradient(90deg,#E35D5B 0 14%,#F28C38 0 31%,#F2C14E 0 42%,#4FA36B 0 58%,#2D9C9C 0 70%,#3E7CC7 0 87%,#8466C4 0) top/100% 22% no-repeat,#FFFFFF' },
  { id: 'calm', name: 'Calm', bg: '#FBF7EE', sw: '#FBF7EE' },
  { id: 'paper', name: 'Lined paper', bg: '#FFFEF8', sw: 'linear-gradient(90deg,transparent 18%,#EBA0A0 18% 22%,transparent 22%),repeating-linear-gradient(180deg,#FFFEF8 0 7px,#BFD3EE 7px 8px)' },
  { id: 'ocean', name: 'Ocean', bg: '#CDEBFB', grad: ['#EAF7FF', '#CDEBFB', '#B0DCF5'], sw: 'linear-gradient(165deg,#EAF7FF,#B0DCF5)' },
  { id: 'forest', name: 'Forest', bg: '#DDF2E3', grad: ['#F2FBF4', '#DDF2E3', '#C6E8CF'], sw: 'linear-gradient(165deg,#F2FBF4,#C6E8CF)' },
  { id: 'sunset', name: 'Sunset', bg: '#FFE2C9', grad: ['#FFF7EE', '#FFE2C9', '#FFCBA8'], sw: 'linear-gradient(165deg,#FFF7EE,#FFCBA8)' },
  { id: 'chalk', name: 'Chalkboard', bg: '#24402F', dark: true, sw: 'radial-gradient(circle at 30% 20%,rgb(255 255 255 / .15),transparent 60%),#24402F' },
  { id: 'night', name: 'Night sky', bg: '#0F172A', dark: true, stars: true, sw: 'radial-gradient(circle at 28% 32%,#FFF 0 1px,transparent 1.6px),radial-gradient(circle at 70% 62%,#FFF 0 1px,transparent 1.6px),radial-gradient(circle at 52% 22%,#FFF 0 .8px,transparent 1.3px),#0F172A' },
  { id: 'space', name: 'Space', bg: '#21164A', dark: true, stars: true, grad: ['#2E1D63', '#170F33'], sw: 'radial-gradient(circle at 75% 25%,rgb(139 92 246 / .75),transparent 60%),radial-gradient(circle at 30% 70%,#FFF 0 1px,transparent 1.6px),#21164A' },
  /* Rabinder's five themes (the first-day packs she loved): drawn decorations around the edges, never behind the words. */
  { id: 'blastoff', name: 'Space Blast-Off', bg: '#1B1446', dark: true, stars: true, deco: true, grad: ['#2A1B6B', '#0E1236'], sw: 'radial-gradient(circle at 80% 22%,#F59E52 0 14%,transparent 15%),radial-gradient(circle at 30% 70%,#FFF 0 1px,transparent 1.6px),linear-gradient(160deg,#2A1B6B,#0E1236)' },
  { id: 'sea', name: 'Under the Sea', bg: '#C9ECF8', deco: true, grad: ['#E8F8FF', '#C9ECF8', '#A7DDF2'], sw: 'radial-gradient(circle at 82% 30%,#fff 0 9%,transparent 10%),linear-gradient(165deg,#E8F8FF,#A7DDF2)' },
  { id: 'jungle', name: 'Jungle Adventure', bg: '#DDF3D2', deco: true, grad: ['#F3FCEC', '#DDF3D2', '#C4E9B5'], sw: 'radial-gradient(ellipse at 90% 15%,#3FA34D 0 22%,transparent 23%),linear-gradient(165deg,#F3FCEC,#C4E9B5)' },
  { id: 'hero', name: 'Superhero Academy', bg: '#FFF1C4', deco: true, grad: ['#FFF9E3', '#FFF1C4', '#FFE08A'], sw: 'radial-gradient(circle at 82% 28%,#E63946 0 16%,transparent 17%),radial-gradient(#F5A524 1.2px,transparent 1.6px) 0 0/6px 6px,#FFF1C4' },
  { id: 'rainbow', name: 'Rainbow Doodle', bg: '#FFFFFF', deco: true, grad: ['#FFFFFF', '#FFF7FC'], sw: 'radial-gradient(circle at 100% 100%,transparent 30%,#E63946 31% 36%,#F5A524 37% 42%,#F5D020 43% 48%,#3FA34D 49% 54%,#3584D6 55% 60%,#8B44C2 61% 66%,transparent 67%),#FFFFFF' }
];
/* The decorations, in the slide's own 160 by 90 space. */
const SPARK4 = (x, y, s, c) => '<path d="M' + x + ' ' + (y - s) + 'Q' + (x + s * 0.18) + ' ' + (y - s * 0.18) + ' ' + (x + s) + ' ' + y + 'Q' + (x + s * 0.18) + ' ' + (y + s * 0.18) + ' ' + x + ' ' + (y + s) + 'Q' + (x - s * 0.18) + ' ' + (y + s * 0.18) + ' ' + (x - s) + ' ' + y + 'Q' + (x - s * 0.18) + ' ' + (y - s * 0.18) + ' ' + x + ' ' + (y - s) + 'z" fill="' + c + '"/>';
const DECO = {
  blastoff: '<circle cx="146" cy="13" r="8" fill="#F08A3C"/><circle cx="143.5" cy="10.5" r="3.2" fill="#FFC48A" fill-opacity=".7"/><ellipse cx="146" cy="13" rx="13" ry="3" fill="none" stroke="#FFD9A8" stroke-width="1.1" transform="rotate(-18 146 13)"/><circle cx="128" cy="7" r="2" fill="#B9C2FF"/>' +
    '<g transform="translate(13 76) rotate(-40)"><path d="M0-11c3 3 4 7 4 12v6h-8v-6c0-5 1-9 4-12z" fill="#E9EEF8"/><circle cx="0" cy="-3" r="1.6" fill="#5B8DEF"/><path d="M-4 3l-3 4h3zM4 3l3 4h-3z" fill="#E63946"/><path d="M-2.6 7.4q2.6 7 5.2 0z" fill="#F5A524"/><path d="M-1.4 7.4q1.4 4 2.8 0z" fill="#FFF3B0"/></g>' +
    SPARK4(118, 20, 1.6, '#FFFFFF') + SPARK4(30, 62, 1.3, '#FFE08A') + SPARK4(152, 70, 1.4, '#C9D2FF'),
  sea: '<g fill="#FFFFFF" fill-opacity=".35" stroke="#FFFFFF" stroke-width=".5"><circle cx="153" cy="18" r="3.2"/><circle cx="148" cy="28" r="1.8"/><circle cx="155" cy="36" r="2.4"/><circle cx="150" cy="46" r="1.3"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="20" r="1.2"/></g>' +
    '<g fill="none" stroke-linecap="round"><path d="M5 90c-3-6 3-10 0-16s3-9 0-14" stroke="#2E9E62" stroke-width="2.2"/><path d="M11 90c3-5-2-9 1-14s-2-8 1-12" stroke="#3FB57A" stroke-width="1.8"/><path d="M17 90c-2-4 2-7 0-11" stroke="#2E9E62" stroke-width="1.6"/></g>' +
    '<g transform="translate(142 80)"><path d="M-7 0c3-5 9-5 12 0-3 5-9 5-12 0z" fill="#F5A524"/><path d="M5 0l5-4v8z" fill="#F08A3C"/><circle cx="-3.6" cy="-.8" r=".9" fill="#1F2937"/><path d="M-1 -3v6" stroke="#FFFFFF" stroke-width=".8"/></g>' +
    '<path d="M126 90c2-6 6-8 10-8s6 4 6 8z" fill="#F28CA8" fill-opacity=".8"/>',
  jungle: '<g transform="translate(150 6) rotate(28)"><path d="M0 0c-9 4-14 14-10 24 9-2 14-12 10-24z" fill="#3FA34D"/><path d="M0 0c-3 8-5 15-10 24" stroke="#C4E9B5" stroke-width=".8" fill="none"/></g>' +
    '<g transform="translate(138 2) rotate(-12)"><path d="M0 0c-6 3-9 9-7 16 6-1 9-8 7-16z" fill="#2E8B57"/></g>' +
    '<path d="M108 0c4 6 10 8 16 6s9-2 12 2" stroke="#4E8A3A" stroke-width="1" fill="none"/><circle cx="117" cy="5" r="1.4" fill="#F5A524"/><circle cx="129" cy="6" r="1.2" fill="#E63946"/>' +
    '<g transform="translate(4 88) rotate(-58)"><path d="M0 0c-8 4-12 13-9 22 8-2 12-11 9-22z" fill="#3FA34D"/><path d="M0 0c-3 7-5 14-9 22" stroke="#C4E9B5" stroke-width=".8" fill="none"/></g>' +
    '<g transform="translate(16 90) rotate(-20)"><path d="M0 0c-6 3-9 9-7 16 6-1 9-8 7-16z" fill="#7CC36A"/></g>',
  hero: '<g fill="#F5A524" fill-opacity=".45">' + Array.from({ length: 30 }, (_, k) => { const i = k % 6, j = Math.floor(k / 6); return '<circle cx="' + (130 + i * 5) + '" cy="' + (4 + j * 5) + '" r="' + Math.max(0.3, 1.6 - (6 - i) * 0.12 - j * 0.22).toFixed(2) + '"/>'; }).join('') + '</g>' +
    '<g transform="translate(146 76)"><path d="M0-12l3 7 8-3-4 7 8 3-8 2 3 8-7-4-4 7-1-8-8 1 5-6-7-5 8-1-2-8z" fill="#E63946" stroke="#1F2937" stroke-width=".8" stroke-linejoin="round"/><circle r="4" fill="#FFE08A"/></g>' +
    '<path d="M10 64l-5 10h4l-3 9 9-12h-5l4-7z" fill="#F5D020" stroke="#1F2937" stroke-width=".8" stroke-linejoin="round"/>',
  rainbow: '<g fill="none" stroke-width="2.2"><path d="M160 64a26 26 0 0 0-26 26" stroke="#E63946"/><path d="M160 66.6a23.4 23.4 0 0 0-23.4 23.4" stroke="#F5A524"/><path d="M160 69.2a20.8 20.8 0 0 0-20.8 20.8" stroke="#F5D020"/><path d="M160 71.8a18.2 18.2 0 0 0-18.2 18.2" stroke="#3FA34D"/><path d="M160 74.4a15.6 15.6 0 0 0-15.6 15.6" stroke="#3584D6"/><path d="M160 77a13 13 0 0 0-13 13" stroke="#8B44C2"/></g>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width=".9"><path d="M146 8l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" stroke="#F5A524"/><path d="M132 14l.9 2 2.1.3-1.6 1.4.4 2.1-1.8-1-1.8 1 .4-2.1-1.6-1.4 2.1-.3z" stroke="#E63946"/>' +
    '<path d="M4 82q4-5 8 0t8 0 8 0" stroke="#3584D6"/><path d="M6 72c0-2 3-2 3 0 0-2 3-2 3 0 0 2-3 4-3 4s-3-2-3-4z" stroke="#E63946"/></g>' +
    '<g fill="#8B44C2" fill-opacity=".5"><circle cx="154" cy="24" r=".9"/><circle cx="24" cy="86" r=".9"/><circle cx="140" cy="4" r=".7"/></g>'
};
const decoSVG = (id) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">' + (DECO[id] || '') + '</svg>';
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
    return { id: n, name: l.name, dark: !!l.dark, bg: l.bg, cls: 'lk-l-' + n + (n === 'calm' ? ' lk-calm' : '') + (l.dark ? ' lk-dark' : '') + (l.deco ? ' lk-themed' : ''), style: l.stars ? ';--lk-stars:' + STAR_URL : '',
      layer: l.deco ? '<div class="lk-deco" aria-hidden="true">' + decoSVG(n) + '</div>' : '', edge: n === 'bright' };
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
/* A theme for the PowerPoint: its colours, then its decorations drawn from the same picture as on screen. */
async function paintThemed(id) {
  const W = 1600, H = 900, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d'), l = BY[id];
  const gr = g.createLinearGradient(560, 0, 1040, H);
  l.grad.forEach((col, i) => gr.addColorStop(i / (l.grad.length - 1), col));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (l.stars) STARS.forEach(([x, y, s, o]) => { g.fillStyle = 'rgba(255,255,255,' + o.toFixed(2) + ')'; g.beginPath(); g.arc(x * W, y * H, s * 4.2, 0, Math.PI * 2); g.fill(); });
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(decoSVG(id));
  await new Promise((res) => { img.onload = res; img.onerror = res; });
  try { g.drawImage(img, 0, 0, W, H); } catch (e) { /* the colours alone */ }
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
    try { data = BY[L.id] && BY[L.id].deco ? await paintThemed(L.id) : paint(L.id); } catch (e) { data = ''; }
    out = data ? { data, dark: L.dark } : { color: hex6(L.bg), dark: L.dark };
  }
  if (memo) memo.set(key, out);
  return out;
}
