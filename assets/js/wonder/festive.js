/* Festivals, live: each festival is its own full-screen scene, drawn as it happens (no pictures to download).
   Hari Raya's pelita lamps under a new moon in a kampung, red lanterns and a dragon for Chinese New Year, rows of
   diyas and a rangoli for Deepavali, snow on a town at Christmas, a longhouse for Gawai, rice terraces under Mount
   Kinabalu for Kaamatan, Batu Caves for Thaipusam, lotus lamps for Wesak, clouds of colour for Holi, a menorah for
   Hanukkah, wheat fields for Vaisakhi, marigolds and papel picado for the Day of the Dead, samba confetti in Rio,
   water fights for Songkran, mooncake-night lanterns for Mid-Autumn and a bonfire with fireworks for the 5th of
   November. Tapping the scene joins in: a firework, a lantern let go, a puff of colour, a splash, a candle lit. */
import { TAU, rnd, clamp, layer, view } from './util.js?v=ed35fd44';
import { drawCreature } from './fauna.js?v=ed35fd44';
import { Fx } from './music.js?v=ed35fd44';
import { glow, dotGlow, seeded, hash, hills, ground, houses, palm, tree, mountain, flame, lantern, burstParticles, FW_COLS, drawParticles, stepParticles } from './scenery.js?v=ed35fd44';

/* ---------------- the settings (drawn once into the background) ---------------- */
function gopuram(g, cx, y0, hh, col) {                              // a South Indian temple tower
  g.fillStyle = col;
  for (let k = 0; k < 7; k++) { const ww = hh * (0.62 - k * 0.07), y = y0 - (k + 1) * hh * 0.12; g.fillRect(cx - ww / 2, y, ww, hh * 0.125); }
  g.beginPath(); g.moveTo(cx - hh * 0.12, y0 - hh * 0.84); g.quadraticCurveTo(cx, y0 - hh * 1.05, cx + hh * 0.12, y0 - hh * 0.84); g.fill();
  g.fillRect(cx - hh * 0.012, y0 - hh * 1.12, hh * 0.024, hh * 0.1);
}
function thaiRoof(g, cx, y0, ww, col) {                             // a Thai temple: tiers of steep roofs
  g.fillStyle = col; g.fillRect(cx - ww * 0.4, y0 - ww * 0.25, ww * 0.8, ww * 0.25);
  for (let k = 0; k < 3; k++) {
    const y = y0 - ww * (0.25 + k * 0.17), half = ww * (0.55 - k * 0.12);
    g.beginPath(); g.moveTo(cx - half, y); g.lineTo(cx, y - ww * 0.26); g.lineTo(cx + half, y); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + half, y); g.quadraticCurveTo(cx + half + ww * 0.06, y - ww * 0.02, cx + half + ww * 0.05, y - ww * 0.1); g.lineTo(cx + half - ww * 0.02, y); g.fill();
    g.beginPath(); g.moveTo(cx - half, y); g.quadraticCurveTo(cx - half - ww * 0.06, y - ww * 0.02, cx - half - ww * 0.05, y - ww * 0.1); g.lineTo(cx - half + ww * 0.02, y); g.fill();
  }
}
function stupa(g, cx, y0, hh, col) {
  g.fillStyle = col; g.fillRect(cx - hh * 0.42, y0 - hh * 0.12, hh * 0.84, hh * 0.12);
  g.beginPath(); g.moveTo(cx - hh * 0.34, y0 - hh * 0.12); g.quadraticCurveTo(cx - hh * 0.32, y0 - hh * 0.62, cx, y0 - hh * 0.62); g.quadraticCurveTo(cx + hh * 0.32, y0 - hh * 0.62, cx + hh * 0.34, y0 - hh * 0.12); g.fill();
  g.beginPath(); g.moveTo(cx - hh * 0.06, y0 - hh * 0.6); g.lineTo(cx, y0 - hh * 1.05); g.lineTo(cx + hh * 0.06, y0 - hh * 0.6); g.fill();
}
function pagoda(g, cx, y0, hh, col) {
  g.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    const y = y0 - k * hh * 0.18, ww = hh * (0.5 - k * 0.07);
    g.fillRect(cx - ww * 0.32, y - hh * 0.15, ww * 0.64, hh * 0.15);
    g.beginPath(); g.moveTo(cx - ww * 0.62, y - hh * 0.13); g.quadraticCurveTo(cx, y - hh * 0.2, cx + ww * 0.62, y - hh * 0.13); g.lineTo(cx + ww * 0.36, y - hh * 0.21); g.lineTo(cx - ww * 0.36, y - hh * 0.21); g.closePath(); g.fill();
  }
  g.fillRect(cx - hh * 0.01, y0 - hh * 1.08, hh * 0.02, hh * 0.18);
}
function longhouse(g, x0, x1, y0, s, col, lit) {
  const lift = s * 0.35;
  g.fillStyle = col;
  for (let x = x0 + s * 0.1; x < x1; x += s * 0.45) g.fillRect(x, y0 - lift, s * 0.05, lift);
  g.fillRect(x0, y0 - lift - s * 0.45, x1 - x0, s * 0.45);
  g.beginPath(); g.moveTo(x0 - s * 0.2, y0 - lift - s * 0.45); g.lineTo(x0 + s * 0.2, y0 - lift - s * 0.95); g.lineTo(x1 - s * 0.2, y0 - lift - s * 0.95); g.lineTo(x1 + s * 0.2, y0 - lift - s * 0.45); g.closePath(); g.fill();
  if (lit) { g.fillStyle = lit; for (let x = x0 + s * 0.25; x < x1 - s * 0.3; x += s * 0.6) { g.globalAlpha = 0.85; g.fillRect(x, y0 - lift - s * 0.36, s * 0.16, s * 0.24); } g.globalAlpha = 1; }
}
function terraces(g, w, y0, h, cols) {
  for (let k = 0; k < 6; k++) {
    const y = y0 + k * (h - y0) / 6;
    g.fillStyle = cols[k % cols.length]; g.beginPath(); g.moveTo(0, y + 30);
    for (let x = 0; x <= w + 10; x += 10) g.lineTo(x, y - 14 * Math.sin(x / w * 5 + k * 1.3) - 10);
    g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,240,180,.25)'; g.lineWidth = 1.5; g.beginPath();
    for (let x = 0; x <= w + 10; x += 10) { const yy = y - 14 * Math.sin(x / w * 5 + k * 1.3) - 10; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); }
    g.stroke();
  }
}
function batuCaves(g, w, y0, s, col) {                              // the limestone hill, the stairs and the golden statue
  g.fillStyle = col; g.beginPath(); g.moveTo(w * 0.35, y0);
  g.bezierCurveTo(w * 0.38, y0 - s * 2.4, w * 0.62, y0 - s * 2.9, w * 0.82, y0 - s * 2.2); g.bezierCurveTo(w * 0.95, y0 - s * 1.6, w * 1.02, y0 - s * 1.2, w * 1.05, y0); g.closePath(); g.fill();
  const sx = w * 0.62, top = y0 - s * 1.7;
  for (let k = 0; k < 18; k++) { const u = k / 18, y = y0 - (y0 - top) * u, half = s * (0.32 - u * 0.12); g.fillStyle = ['#E4572E', '#F3A712', '#29BF12', '#00A5CF', '#9B5DE5'][k % 5]; g.fillRect(sx - half, y - (y0 - top) / 18, half * 2, (y0 - top) / 18 * 0.7); }
  const gx = w * 0.46, gh = s * 2.1, u = gh / 10;                     // the golden statue, standing on a plinth, holding a vel
  const gr = g.createLinearGradient(gx, y0 - gh, gx, y0); gr.addColorStop(0, '#FFE9A8'); gr.addColorStop(0.5, '#F2C14E'); gr.addColorStop(1, '#B9821A');
  g.fillStyle = gr;
  g.fillRect(gx - u * 1.6, y0 - u * 0.8, u * 3.2, u * 0.8);                                                     // plinth
  g.beginPath(); g.moveTo(gx - u * 1.1, y0 - u * 0.8); g.lineTo(gx - u * 0.75, y0 - u * 5.6); g.lineTo(gx - u * 1.05, y0 - u * 6.9);
  g.quadraticCurveTo(gx, y0 - u * 7.5, gx + u * 1.05, y0 - u * 6.9); g.lineTo(gx + u * 0.75, y0 - u * 5.6); g.lineTo(gx + u * 1.1, y0 - u * 0.8); g.closePath(); g.fill();   // robe and shoulders
  g.beginPath(); g.arc(gx, y0 - u * 8.0, u * 0.62, 0, TAU); g.fill();                                          // head
  g.beginPath(); g.moveTo(gx - u * 0.55, y0 - u * 8.35); g.lineTo(gx - u * 0.35, y0 - u * 9.4); g.lineTo(gx, y0 - u * 9.8); g.lineTo(gx + u * 0.35, y0 - u * 9.4); g.lineTo(gx + u * 0.55, y0 - u * 8.35); g.closePath(); g.fill();   // crown
  g.fillRect(gx + u * 1.35, y0 - u * 9.2, u * 0.18, u * 8.4);                                                   // the vel
  g.beginPath(); g.moveTo(gx + u * 1.44, y0 - u * 10.4); g.quadraticCurveTo(gx + u * 2.1, y0 - u * 9.6, gx + u * 1.44, y0 - u * 9.0); g.quadraticCurveTo(gx + u * 0.8, y0 - u * 9.6, gx + u * 1.44, y0 - u * 10.4); g.fill();
  g.beginPath(); g.moveTo(gx + u * 0.75, y0 - u * 5.8); g.lineTo(gx + u * 1.5, y0 - u * 5.2); g.lineTo(gx + u * 1.5, y0 - u * 4.7); g.lineTo(gx + u * 0.75, y0 - u * 5.2); g.fill();   // the arm holding it
}
function church(g, cx, y0, s, col, lit) {
  g.fillStyle = col; g.fillRect(cx - s * 0.6, y0 - s * 1.1, s * 1.2, s * 1.1);
  [-1, 1].forEach((d) => { const tx = cx + d * s * 0.6; g.fillRect(tx - s * 0.18, y0 - s * 1.8, s * 0.36, s * 1.8); g.beginPath(); g.arc(tx, y0 - s * 1.8, s * 0.18, Math.PI, 0); g.fill(); g.fillRect(tx - s * 0.015, y0 - s * 2.15, s * 0.03, s * 0.2); });
  g.beginPath(); g.moveTo(cx - s * 0.6, y0 - s * 1.1); g.lineTo(cx, y0 - s * 1.5); g.lineTo(cx + s * 0.6, y0 - s * 1.1); g.fill();
  if (lit) { g.fillStyle = lit; g.beginPath(); g.arc(cx, y0 - s * 0.95, s * 0.14, 0, TAU); g.fill(); g.fillRect(cx - s * 0.15, y0 - s * 0.55, s * 0.3, s * 0.55); }
}
function rangoli(g, cx, cy, r) {                                    // a rangoli pattern, flattened as if on the ground
  g.save(); g.translate(cx, cy); g.scale(1, 0.38);
  const cols = ['#FF4F79', '#FFB627', '#3BCEAC', '#7B5CFF', '#FF7A2F', '#FFF1D6'];
  for (let ring = 5; ring >= 0; ring--) {
    const R = r * (ring + 1) / 6, n = 6 + ring * 2;
    g.fillStyle = cols[ring % cols.length];
    for (let k = 0; k < n; k++) { const a = k / n * TAU; g.beginPath(); g.ellipse(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, R * 0.32, R * 0.14, a, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, R * 0.55, 0, TAU); g.fill();
  }
  g.restore();
}

/* ---------------- the festivals ----------------
   sky: top to bottom; night: stars; moon / sun: where; land: drawn once; live: what moves; tap: what a tap does;
   fw: fireworks a second; music and sound: see music.js and fx/sound.js. */
const F = {
  raya: { sky: ['#0B1033', '#2A1F5C', '#7A3E78', '#E2866A'], night: true, moon: { x: 0.8, y: 0.17, crescent: true }, horizon: 0.8,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 1.2, '#2B1D40', 3); ground(g, w, h, y0, '#160F22'); houses(g, w * 0.26, w * 0.72, y0, s * 1.15, '#160F22', '#FFC765', 'stilt', R); [0.06, 0.17, 0.82, 0.93].forEach((u, i) => palm(g, w * u, y0, s * (2.2 + (i % 2) * 0.6), '#120C1C', i < 2 ? 1 : -1)); },
    live: ['ketupat', 'pelita', 'sparks'], tap: 'sparkler', fw: 0.08, music: 'gamelan', sound: 'night', spark: '255,214,120' },
  cny: { sky: ['#0A0A1F', '#2B0F2E', '#5C1A2B'], night: true, horizon: 0.82,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#1A0B12'); houses(g, -s, w + s, y0, s * 1.2, '#22101A', '#FFB45A', 'shop', R); pagoda(g, w * 0.84, y0 - s * 0.6, s * 3.2, '#1A0B12'); },
    live: ['hanging', 'lanterns', 'dragon'], tap: 'firework', fw: 0.22, music: 'gongs', sound: 'market', lantern: ['230,40,40', '245,60,50'] },
  deepavali: { sky: ['#070A22', '#1F1240', '#4B1C4F'], night: true, horizon: 0.8,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#1A0F1F'); gopuram(g, w * 0.5, y0, s * 3.4, '#140B1A'); houses(g, -s, w * 0.36, y0, s * 1.1, '#140B1A', '#FFC56B', 'house', R); houses(g, w * 0.64, w + s, y0, s * 1.1, '#140B1A', '#FFC56B', 'house', R); rangoli(g, w * 0.5, y0 + (h - y0) * 0.5, Math.min(w, h) * 0.16); },
    live: ['diyas', 'sparks'], tap: 'firework', fw: 0.2, music: 'tabla', sound: 'night', spark: '255,190,90' },
  christmas: { sky: ['#06122B', '#0E2547', '#24456E'], night: true, horizon: 0.8,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 0.8, '#C9D6E8', 5); ground(g, w, h, y0, '#DCE6F2'); houses(g, -s, w * 0.6, y0, s * 1.1, '#1B2742', '#FFD27A', 'house', R); },
    live: ['tree', 'snow'], tap: 'sparkle', fw: 0, music: 'bells', sound: 'wind' },
  gawai: { sky: ['#0E1A2E', '#2D3B55', '#B9604A'], night: true, horizon: 0.8,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 1.6, '#1B2232', 9); ground(g, w, h, y0, '#0E121C'); longhouse(g, w * 0.18, w * 0.8, y0, s * 1.2, '#0E121C', '#FFB35C'); [0.08, 0.9].forEach((u, i) => palm(g, w * u, y0, s * 2.4, '#0B0E16', i ? -1 : 1)); },
    live: ['torches', 'sparks'], tap: 'gong', fw: 0, music: 'sape', sound: 'forest', spark: '190,255,140' },
  kaamatan: { sky: ['#4A6FA5', '#E8A86B', '#F6D08A'], sun: { x: 0.7, y: 0.36 }, horizon: 0.62,
    land(g, w, h, y0, R, s) { mountain(g, w * 0.42, y0 + 4, w * 0.7, s * 4.2, '#4E5D86', true); terraces(g, w, y0, h, ['#7FA843', '#9DBB4E', '#C6B44A', '#8DAA3E']); },
    live: ['rice', 'birds'], tap: 'golden', fw: 0, music: 'gamelan', sound: 'birds', spark: '255,226,130' },
  thaipusam: { sky: ['#2B3B6B', '#E07B5A', '#F6C177'], sun: { x: 0.2, y: 0.55 }, horizon: 0.82,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#3A2A2A'); batuCaves(g, w, y0, s * 1.6, '#4A3B45'); },
    live: ['petals', 'sparks'], tap: 'petals', fw: 0, music: 'tabla', sound: 'market', spark: '255,200,120' },
  wesak: { sky: ['#081226', '#1A2C4E', '#2F4A6E'], night: true, moon: { x: 0.5, y: 0.2, r: 1.25 }, horizon: 0.66,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 0.9, '#0F1A30', 4); stupa(g, w * 0.5, y0, s * 3, '#0C1528'); const wg = g.createLinearGradient(0, y0, 0, h); wg.addColorStop(0, '#1A2C4E'); wg.addColorStop(1, '#0A1426'); g.fillStyle = wg; g.fillRect(0, y0, w, h - y0); },
    live: ['shimmer', 'lotus', 'skylanterns'], tap: 'lantern', fw: 0, music: 'chimes', sound: 'night', lantern: ['255,236,190', '255,210,140'] },
  holi: { sky: ['#3FB4EC', '#86D3F5', '#FBE3C0'], sun: { x: 0.82, y: 0.2 }, horizon: 0.8,
    land(g, w, h, y0, R, s) {
      ground(g, w, h, y0, '#E2B98A');
      houses(g, -s, w + s, y0, s * 1.3, ['#F2A65A', '#E86A92', '#6CC3A0', '#F7D154', '#9B8CE8', '#5BB8E8'], null, 'house', R);
      for (let k = 0; k < 60; k++) { g.fillStyle = ['rgba(255,79,121,.55)', 'rgba(255,182,39,.55)', 'rgba(59,206,172,.55)', 'rgba(123,92,255,.5)'][k % 4]; g.beginPath(); g.arc(R() * w, y0 + R() * (h - y0), 6 + R() * 26, 0, TAU); g.fill(); }
    },
    live: ['colour'], tap: 'colour', fw: 0, music: 'dhol', sound: 'market' },
  hanukkah: { sky: ['#0A1430', '#18284F', '#2A3D6B'], night: true, horizon: 0.8,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#0D1730'); houses(g, -s, w + s, y0, s * 1.2, '#0F1A36', '#FFD27A', 'house', R); },
    live: ['menorah', 'snow'], tap: 'candle', fw: 0, music: 'klezmer', sound: 'night' },
  vaisakhi: { sky: ['#7EC8E3', '#F5D78E', '#F3B562'], sun: { x: 0.25, y: 0.3 }, horizon: 0.6,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 0.6, '#8FA34A', 6); [0.12, 0.3, 0.74, 0.9].forEach((u) => tree(g, w * u, y0 + 2, s * 1.6, '#5E7A35')); g.fillStyle = '#D9A93E'; g.fillRect(0, y0, w, h - y0); },
    live: ['wheat', 'petals'], tap: 'petals', fw: 0, music: 'dhol', sound: 'birds' },
  muertos: { sky: ['#120A2A', '#3B1446', '#7A2A4A'], night: true, horizon: 0.82,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#1C0C1E'); houses(g, -s, w * 0.38, y0, s * 1.1, '#241024', '#FFB65C', 'house', R); church(g, w * 0.55, y0, s * 1.5, '#241024', '#FFB65C'); houses(g, w * 0.72, w + s, y0, s * 1.1, '#241024', '#FFB65C', 'house', R); },
    live: ['flags', 'candles', 'petals'], tap: 'petals', fw: 0, music: 'waltz', sound: 'night' },
  carnival: { sky: ['#0B0630', '#2A0B4A', '#5B1255'], night: true, horizon: 0.84,
    land(g, w, h, y0, R, s) { mountain(g, w * 0.6, y0, w * 0.3, s * 3.4, '#1B0C33', false); ground(g, w, h, y0, '#12081F'); houses(g, -s, w * 0.5, y0, s * 1.1, '#170A29', '#FFD36B', 'tower', R); houses(g, w * 0.7, w + s, y0, s * 0.9, '#170A29', '#FFD36B', 'tower', R); },
    live: ['spotlights', 'confetti'], tap: 'confetti', fw: 0.14, music: 'samba', sound: 'city' },
  songkran: { sky: ['#4FB3F0', '#8FD3F7', '#E7F6FD'], sun: { x: 0.18, y: 0.2 }, horizon: 0.78,
    land(g, w, h, y0, R, s) { ground(g, w, h, y0, '#D8C3A0'); thaiRoof(g, w * 0.62, y0, s * 3.2, '#B5452F'); houses(g, -s, w * 0.4, y0, s * 1.1, '#C9B08A', null, 'house', R); [0.9, 0.98].forEach((u) => palm(g, w * u, y0, s * 2.6, '#3E7D4A', -1)); },
    live: ['water'], tap: 'splash', fw: 0, music: 'thai', sound: 'market' },
  midautumn: { sky: ['#070D24', '#16204A', '#2C2F5E'], night: true, moon: { x: 0.72, y: 0.24, r: 1.6 }, horizon: 0.8,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 1.3, '#121A38', 2); ground(g, w, h, y0, '#0B1028'); pagoda(g, w * 0.2, y0, s * 3, '#0B1028'); [0.4, 0.55, 0.9].forEach((u) => tree(g, w * u, y0 + 2, s * 1.4, '#0B1028')); },
    live: ['lanterns', 'sparks'], tap: 'lantern', fw: 0, music: 'guzheng', sound: 'night', lantern: ['255,120,80', '255,200,80', '120,200,255', '255,140,200'], spark: '255,230,170' },
  bonfire: { sky: ['#05070F', '#121A33', '#1E2A4A'], night: true, horizon: 0.82,
    land(g, w, h, y0, R, s) { hills(g, w, y0, s * 1.1, '#0C1120', 8); ground(g, w, h, y0, '#080B14'); [0.08, 0.18, 0.86].forEach((u) => tree(g, w * u, y0 + 2, s * 1.8, '#070A12')); },
    live: ['bonfire'], tap: 'firework', fw: 0.32, music: 'none', sound: 'wind' }
};
export const FEST_SCENES = F;

/* ---------------- what moves ---------------- */
const LIVE = {
  sparks: { init(S) { return Array.from({ length: view.small ? 26 : 46 }, () => ({ x: rnd(0, S.w), y: rnd(S.h * 0.35, S.h), p: rnd(0, TAU), v: rnd(6, 18) })); },
    step(a, S, dt, t) { a.forEach((q) => { q.y -= q.v * dt; q.x += Math.sin(t + q.p) * 10 * dt; if (q.y < S.h * 0.25) { q.y = S.h; q.x = rnd(0, S.w); } }); },
    draw(a, S, ctx, t) { ctx.globalCompositeOperation = 'lighter'; a.forEach((q) => dotGlow(ctx, q.x, q.y, 9, S.f.spark || '255,220,150', 0.35 + 0.45 * Math.max(0, Math.sin(t * 1.7 + q.p)))); ctx.globalCompositeOperation = 'source-over'; } },
  rice: { init(S) { return LIVE.sparks.init(S); }, step(a, S, dt, t) { LIVE.sparks.step(a, S, dt, t); }, draw(a, S, ctx, t) { LIVE.sparks.draw(a, S, ctx, t); } },
  pelita: { init(S) { const n = view.small ? 9 : 16, a = []; for (let i = 0; i < n; i++) a.push({ x: S.w * (0.04 + 0.92 * i / (n - 1)), y: S.y0 + S.s * 0.25, p: rnd(0, TAU) }); return a; },
    step() {}, draw(a, S, ctx, t) { a.forEach((q) => flame(ctx, q.x, q.y, S.s * 0.16, t, q.p)); } },
  torches: { init(S) { const a = []; for (let x = 0.2; x <= 0.8; x += 0.12) a.push({ x: S.w * x, y: S.y0 - S.s * 0.3, p: rnd(0, TAU) }); return a; },
    step() {}, draw(a, S, ctx, t) { a.forEach((q) => flame(ctx, q.x, q.y, S.s * 0.2, t, q.p)); } },
  diyas: { init(S) {
      const a = [], n = view.small ? 11 : 20;
      for (let i = 0; i < n; i++) a.push({ x: S.w * (0.03 + 0.94 * i / (n - 1)), y: S.y0 + S.s * 0.18, p: rnd(0, TAU) });
      for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU, r = Math.min(S.w, S.h) * 0.2; a.push({ x: S.w * 0.5 + Math.cos(ang) * r, y: S.y0 + (S.h - S.y0) * 0.5 + Math.sin(ang) * r * 0.38, p: rnd(0, TAU) }); }
      return a;
    },
    step() {}, draw(a, S, ctx, t) { a.forEach((q) => { ctx.fillStyle = '#B5541F'; ctx.beginPath(); ctx.ellipse(q.x, q.y + S.s * 0.04, S.s * 0.12, S.s * 0.05, 0, 0, Math.PI); ctx.fill(); flame(ctx, q.x, q.y, S.s * 0.15, t, q.p); }); } },
  candles: { init(S) { const a = []; for (let i = 0; i < 12; i++) a.push({ x: S.w * (0.06 + i * 0.08) + rnd(-8, 8), y: S.y0 + S.s * (0.25 + (i % 3) * 0.12), p: rnd(0, TAU) }); return a; },
    step() {}, draw(a, S, ctx, t) { a.forEach((q) => { ctx.fillStyle = '#F4E9D8'; ctx.fillRect(q.x - S.s * 0.03, q.y, S.s * 0.06, S.s * 0.2); flame(ctx, q.x, q.y, S.s * 0.12, t, q.p); }); } },
  ketupat: { init(S) { const a = []; for (let i = 0; i < 7; i++) a.push({ x: S.w * (0.08 + i * 0.14), L: S.h * rnd(0.06, 0.16), p: rnd(0, TAU), s: S.s * rnd(0.32, 0.45) }); return a; },
    step() {}, draw(a, S, ctx, t) {
      a.forEach((q) => {
        const sw = Math.sin(t * 1.2 + q.p) * 0.06, x = q.x + Math.sin(sw) * q.L, y = Math.cos(sw) * q.L + S.top;
        ctx.strokeStyle = 'rgba(255,230,170,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, S.top - 10); ctx.lineTo(x, y); ctx.stroke();
        ctx.save(); ctx.translate(x, y + q.s * 0.6); ctx.rotate(sw);
        ctx.fillStyle = '#7FA843'; ctx.beginPath(); ctx.moveTo(0, -q.s * 0.6); ctx.lineTo(q.s * 0.5, 0); ctx.lineTo(0, q.s * 0.6); ctx.lineTo(-q.s * 0.5, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#C9D97A'; ctx.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-q.s * 0.25 + k * q.s * 0.12, -q.s * 0.3 + Math.abs(k) * 0.04); ctx.lineTo(q.s * 0.25 + k * q.s * 0.12, q.s * 0.3); ctx.stroke(); }
        ctx.restore();
      });
    } },
  hanging: { init(S) { const a = []; for (let i = 0; i < 9; i++) a.push({ x: S.w * (0.06 + i * 0.11), y: S.top + S.h * (0.05 + (i % 2) * 0.04), p: rnd(0, TAU) }); return a; },
    step() {}, draw(a, S, ctx, t) {
      ctx.strokeStyle = 'rgba(255,200,120,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, S.top + S.h * 0.02);
      for (let x = 0; x <= S.w; x += 20) ctx.lineTo(x, S.top + S.h * 0.02 + Math.sin(x / S.w * Math.PI * 4) * S.h * 0.02 + S.h * 0.02); ctx.stroke();
      a.forEach((q) => lantern(ctx, q.x + Math.sin(t + q.p) * 3, q.y, S.s * 0.5, '230,40,40', t, q.p, true));
    } },
  lanterns: { init(S) { return Array.from({ length: view.small ? 8 : 14 }, () => newLantern(S, rnd(S.top, S.h))); },
    step(a, S, dt, t) { a.forEach((q, i) => { q.y -= q.v * dt; q.x += Math.sin(t * 0.6 + q.p) * 8 * dt; if (q.y < S.top - 40) a[i] = newLantern(S, S.h + 30); }); },
    draw(a, S, ctx, t) { a.forEach((q) => lantern(ctx, q.x, q.y, q.s, q.c, t, q.p, false)); } },
  skylanterns: { init(S) { return LIVE.lanterns.init(S); }, step(a, S, dt, t) { LIVE.lanterns.step(a, S, dt, t); }, draw(a, S, ctx, t) { LIVE.lanterns.draw(a, S, ctx, t); } },
  lotus: { init(S) { return Array.from({ length: view.small ? 7 : 12 }, () => ({ x: rnd(0, S.w), y: rnd(S.y0 + 20, S.h - 20), v: rnd(6, 16), p: rnd(0, TAU) })); },
    step(a, S, dt) { a.forEach((q) => { q.x += q.v * dt; if (q.x > S.w + 30) q.x = -30; }); },
    draw(a, S, ctx, t) {
      a.forEach((q) => {
        const k = 0.6 + 0.4 * (q.y - S.y0) / (S.h - S.y0), y = q.y + Math.sin(t * 1.4 + q.p) * 2, r = S.s * 0.3 * k;
        ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, q.x, y - r * 0.3, r * 3, '255,200,120', 0.55); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#F7B6C8'; for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.ellipse(q.x + j * r * 0.28, y - r * 0.2, r * 0.22, r * 0.55, j * 0.35, 0, TAU); ctx.fill(); }
        flame(ctx, q.x, y - r * 0.5, r * 0.5, t, q.p);
      });
    } },
  shimmer: { init() { return [0]; }, step() {},
    draw(a, S, ctx, t) { ctx.strokeStyle = 'rgba(255,240,200,.18)'; ctx.lineWidth = 1.2; for (let k = 0; k < 14; k++) { const y = S.y0 + 10 + k * (S.h - S.y0) / 14, x = S.w * 0.5 + Math.sin(t * 0.8 + k) * 20, L = S.w * (0.04 + k * 0.012); ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.stroke(); } } },
  dragon: { init(S) { return [{ t: 0 }]; }, step(a, S, dt) { a[0].t += dt; },
    draw(a, S, ctx) {
      const T = a[0].t, n = 18, seg = S.s * 0.34, span = S.w + n * seg * 1.4, head = (T * S.w * 0.09) % span - n * seg * 0.8;
      for (let i = n; i >= 0; i--) {
        const x = head - i * seg * 0.9, y = S.y0 - S.s * 0.55 - Math.sin(x / S.w * TAU * 1.5 + T * 2) * S.s * 0.45;
        if (x < -seg * 2 || x > S.w + seg * 2) continue;
        if (i === 0) { drawCreature(ctx, 'dragon', x + seg * 0.5, y - seg * 0.2, seg * 1.7, { t: T }); continue; }
        ctx.fillStyle = i % 2 ? '#E8392B' : '#F5B82E'; ctx.beginPath(); ctx.arc(x, y, seg * 0.62, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(x, y - seg * 0.42, seg * 0.16, 0, TAU); ctx.fill();
        if (i % 3 === 0) { ctx.strokeStyle = '#6B1A12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + seg * 0.6); ctx.lineTo(x, S.y0 + S.s * 0.2); ctx.stroke(); }
      }
    } },
  tree: { init(S) { const a = [], n = view.small ? 26 : 40; for (let i = 0; i < n; i++) { const u = Math.random(), v = Math.random(); a.push({ u, v: Math.sqrt(v), p: rnd(0, TAU), c: ['255,80,80', '255,210,90', '120,200,255', '140,255,160'][i % 4] }); } return a; },
    step() {}, draw(a, S, ctx, t) {
      const cx = S.w * 0.76, base = S.y0 + S.s * 0.1, H = S.s * 3.6, W = S.s * 2.2;
      ctx.fillStyle = '#4A2E1A'; ctx.fillRect(cx - S.s * 0.12, base - S.s * 0.4, S.s * 0.24, S.s * 0.4);
      ctx.fillStyle = '#145A32';
      for (let k = 0; k < 3; k++) { const y = base - S.s * 0.3 - k * H * 0.26, ww = W * (1 - k * 0.25); ctx.beginPath(); ctx.moveTo(cx - ww / 2, y); ctx.lineTo(cx, y - H * 0.46); ctx.lineTo(cx + ww / 2, y); ctx.closePath(); ctx.fill(); }
      ctx.globalCompositeOperation = 'lighter';
      a.forEach((q) => { const y = base - S.s * 0.3 - q.v * H * 0.85, half = (1 - q.v) * W * 0.45, x = cx + (q.u - 0.5) * 2 * half; dotGlow(ctx, x, y, 8, q.c, 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.2 + q.p))); });
      dotGlow(ctx, cx, base - S.s * 0.3 - H * 0.98, 26, '255,230,140', 0.9);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFD84A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = S.s * (k % 2 ? 0.1 : 0.25); ctx.lineTo(cx + Math.cos(a) * r, base - S.s * 0.3 - H * 0.98 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    } },
  snow: { init(S) { return Array.from({ length: view.small ? 70 : 140 }, () => ({ x: rnd(0, S.w), y: rnd(0, S.h), r: rnd(1, 3), v: rnd(18, 50), p: rnd(0, TAU) })); },
    step(a, S, dt, t) { a.forEach((q) => { q.y += q.v * dt; q.x += Math.sin(t + q.p) * 14 * dt; if (q.y > S.h) { q.y = -4; q.x = rnd(0, S.w); } }); },
    draw(a, S, ctx) { ctx.fillStyle = 'rgba(255,255,255,.85)'; a.forEach((q) => { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }); } },
  petals: { init(S) { return Array.from({ length: view.small ? 26 : 46 }, () => newPetal(S, rnd(-S.h, S.h))); },
    step(a, S, dt, t) { a.forEach((q, i) => { q.y += q.v * dt; q.x += Math.sin(t * 1.5 + q.p) * 22 * dt; q.r += q.vr * dt; if (q.y > S.h + 10) a[i] = newPetal(S, -10); }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.c; ctx.beginPath(); ctx.ellipse(0, 0, q.s, q.s * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore(); }); } },
  confetti: { init(S) { return Array.from({ length: view.small ? 60 : 110 }, () => newConfetti(S, rnd(-S.h, S.h))); },
    step(a, S, dt, t) { a.forEach((q, i) => { q.y += q.v * dt; q.x += Math.sin(t * 2 + q.p) * 30 * dt; q.r += q.vr * dt; if (q.y > S.h + 10) a[i] = newConfetti(S, -10); }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.scale(1, Math.abs(Math.cos(q.r * 1.7)) + 0.15); ctx.fillStyle = q.c; ctx.fillRect(-q.s, -q.s * 0.5, q.s * 2, q.s); ctx.restore(); }); } },
  spotlights: { init() { return [0, 1, 2]; }, step() {},
    draw(a, S, ctx, t) {
      ctx.globalCompositeOperation = 'lighter';
      a.forEach((k) => {
        const bx = S.w * (0.2 + k * 0.3), ang = -Math.PI / 2 + Math.sin(t * 0.5 + k * 2) * 0.5, L = S.h * 1.1;
        const gr = ctx.createLinearGradient(bx, S.y0, bx + Math.cos(ang) * L, S.y0 + Math.sin(ang) * L);
        gr.addColorStop(0, 'rgba(' + ['255,120,220', '120,200,255', '255,220,120'][k] + ',.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx, S.y0); ctx.lineTo(bx + Math.cos(ang - 0.08) * L, S.y0 + Math.sin(ang - 0.08) * L); ctx.lineTo(bx + Math.cos(ang + 0.08) * L, S.y0 + Math.sin(ang + 0.08) * L); ctx.closePath(); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    } },
  colour: { init(S) { return Array.from({ length: 13 }, () => newCloud(S, true)); },
    step(a, S, dt) { a.forEach((q, i) => { q.y -= q.v * dt; q.x += q.vx * dt; q.r += 6 * dt; q.a -= dt * 0.025; if (q.a <= 0) a[i] = newCloud(S, false); }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.globalAlpha = Math.max(0, q.a); ctx.drawImage(glow(q.c, 48), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }); ctx.globalAlpha = 1; } },
  water: { init(S) { return { jets: [{ x: -0.02, dir: 1, p: 0 }, { x: 1.02, dir: -1, p: 2 }], drops: [] }; },
    step(a, S, dt, t) {
      a.jets.forEach((j) => {
        const on = Math.sin(t * 0.9 + j.p) > -0.2;
        if (!on) return;
        for (let k = 0; k < 3; k++) a.drops.push({ x: S.w * j.x, y: S.y0 - S.s * 0.8, vx: j.dir * rnd(180, 330) * (S.w / 1200), vy: -rnd(220, 380) * (S.h / 800), r: rnd(1.5, 3.5), l: 1 });
      });
      a.drops.forEach((d) => { d.vy += 520 * (S.h / 800) * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y > S.y0 + S.s * 0.4) d.l = 0; });
      if (a.drops.length > 700) a.drops.splice(0, a.drops.length - 700);
      a.drops = a.drops.filter((d) => d.l > 0);
    },
    draw(a, S, ctx) { ctx.fillStyle = 'rgba(210,240,255,.85)'; a.drops.forEach((d) => { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); }); } },
  wheat: { init(S) { const a = []; const n = Math.round(S.w / (view.small ? 10 : 8)); for (let i = 0; i < n; i++) a.push({ x: i / n * S.w + rnd(-3, 3), h: rnd(0.12, 0.22) * S.h, p: rnd(0, TAU) }); return a; },
    step() {}, draw(a, S, ctx, t) {
      ctx.strokeStyle = '#B8862B'; ctx.lineWidth = 2;
      a.forEach((q) => {
        const sway = Math.sin(t * 1.4 + q.x / S.w * 6) * 10 + Math.sin(t * 2.3 + q.p) * 3, bx = q.x, by = S.h + 4;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sway * 0.3, by - q.h * 0.6, bx + sway, by - q.h); ctx.stroke();
        ctx.fillStyle = '#E8B954'; ctx.beginPath(); ctx.ellipse(bx + sway, by - q.h - 6, 3.2, 9, sway * 0.02, 0, TAU); ctx.fill();
      });
    } },
  flags: { init(S) { const n = Math.max(10, Math.round(S.w / 64)), a = []; for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) a.push({ r, i, n, c: ['#FF4F79', '#FFB627', '#3BCEAC', '#7B5CFF', '#FF7A2F', '#2EC4F1'][(i + r * 3) % 6] }); return a; },
    step() {}, draw(a, S, ctx, t) {
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1;
      [0, 1].forEach((r) => { const y0 = S.top + S.h * (0.02 + r * 0.075); ctx.beginPath(); for (let x = 0; x <= S.w; x += 16) { const y = y0 + Math.sin(x / S.w * Math.PI) * S.h * 0.035; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); });
      a.forEach((q) => {
        const y0 = S.top + S.h * (0.02 + q.r * 0.075), u = (q.i + 0.5) / q.n, x = S.w * u, y = y0 + Math.sin(u * Math.PI) * S.h * 0.035;
        const ww = S.w / q.n * 0.82, hh = ww * 0.95, sw = Math.sin(t * 2 + q.i * 0.7 + q.r) * 0.07;
        ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.globalAlpha = 0.92;
        ctx.drawImage(picado(q.c, Math.round(ww)), -ww / 2, 0, ww, hh);
        ctx.restore();
      });
    } },
  menorah: { init(S) { return { lit: 2 }; }, step() {},
    draw(a, S, ctx, t) {
      const cx = S.w * 0.5, base = S.y0 - S.s * 0.1, W = Math.min(S.w * 0.7, S.s * 6.2), H = S.s * 2.6;
      ctx.strokeStyle = '#E2B74B'; ctx.lineWidth = Math.max(3, S.s * 0.08); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, base - H * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - W * 0.18, base); ctx.lineTo(cx + W * 0.18, base); ctx.stroke();
      for (let k = 1; k <= 4; k++) { const r = W / 2 * k / 4.4; ctx.beginPath(); ctx.ellipse(cx, base - H * 0.95, r, H * 0.7 * k / 4.2, 0, 0, Math.PI); ctx.stroke(); }
      for (let i = 0; i < 9; i++) {
        const k = i - 4, x = cx + k * W / 8.8 * 1.0, mid = i === 4, y = base - H * 0.95 - (mid ? S.s * 0.25 : 0);
        ctx.fillStyle = '#F4E9D8'; ctx.fillRect(x - S.s * 0.05, y - S.s * 0.38, S.s * 0.1, S.s * 0.38);
        const order = [4, 8, 7, 6, 5, 3, 2, 1, 0];                    // the helper candle first, then right to left
        if (order.indexOf(i) < a.lit) flame(ctx, x, y - S.s * 0.38, S.s * 0.2, t, i);
      }
    } },
  bonfire: { init(S) { return { embers: Array.from({ length: 50 }, () => newEmber(S, true)), crackleT: 2 }; },
    step(a, S, dt) {
      a.embers.forEach((q, i) => { q.y -= q.v * dt; q.x += q.vx * dt; q.l -= dt * 0.4; if (q.l <= 0) a.embers[i] = newEmber(S, false); });
      a.crackleT -= dt; if (a.crackleT <= 0) { a.crackleT = rnd(3.5, 7); if (S.soundOn) Fx.play('crackle'); }
    },
    draw(a, S, ctx, t) {
      const cx = S.w * 0.36, base = S.y0 + S.s * 0.25, R = S.s * 1.3;
      ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, cx, base - R * 0.6, R * 3.2, '255,140,50', 0.5);
      for (let k = 0; k < 9; k++) {
        const ph = t * 6 + k * 1.7, hgt = R * (1.2 + 0.5 * Math.sin(ph) + 0.25 * Math.sin(ph * 2.3)), xo = (k - 4) * R * 0.16 + Math.sin(ph * 0.7) * R * 0.08;
        const gr = ctx.createLinearGradient(0, base, 0, base - hgt); gr.addColorStop(0, 'rgba(255,200,80,.85)'); gr.addColorStop(0.6, 'rgba(255,110,40,.55)'); gr.addColorStop(1, 'rgba(255,60,20,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(cx + xo - R * 0.22, base); ctx.quadraticCurveTo(cx + xo - R * 0.1, base - hgt * 0.6, cx + xo + Math.sin(ph) * R * 0.1, base - hgt); ctx.quadraticCurveTo(cx + xo + R * 0.12, base - hgt * 0.5, cx + xo + R * 0.22, base); ctx.closePath(); ctx.fill();
      }
      a.embers.forEach((q) => dotGlow(ctx, q.x, q.y, 6, '255,170,70', Math.max(0, q.l)));
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#2A1A10'; ctx.lineWidth = S.s * 0.14; ctx.lineCap = 'round';
      [[-0.6, 0.2, 0.5, -0.1], [0.6, 0.2, -0.5, -0.1], [-0.3, 0.25, 0.4, 0.05]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(cx + x1 * R, base + y1 * R * 0.2); ctx.lineTo(cx + x2 * R, base + y2 * R * 0.2); ctx.stroke(); });
    } },
  birds: { init(S) { return Array.from({ length: 6 }, (_, i) => ({ x: rnd(0, S.w), y: S.h * rnd(0.12, 0.3), v: rnd(30, 60), p: i })); },
    step(a, S, dt) { a.forEach((q) => { q.x += q.v * dt; if (q.x > S.w + 30) q.x = -30; }); },
    draw(a, S, ctx, t) { ctx.strokeStyle = 'rgba(40,40,60,.75)'; ctx.lineWidth = 2; a.forEach((q) => { const f = Math.sin(t * 7 + q.p) * 6; ctx.beginPath(); ctx.moveTo(q.x - 10, q.y - f * 0.5); ctx.quadraticCurveTo(q.x - 4, q.y - 5 - f * 0.2, q.x, q.y); ctx.quadraticCurveTo(q.x + 4, q.y - 5 - f * 0.2, q.x + 10, q.y - f * 0.5); ctx.stroke(); }); } }
};
/* One papel picado flag, cut out on its own little canvas (so the holes show the sky behind it). */
const picados = new Map();
function picado(col, ww) {
  const k = col + '|' + ww;
  let c = picados.get(k);
  if (c) return c;
  const hh = Math.round(ww * 0.95), r = 2;
  c = layer(ww * r, hh * r);
  const g = c.getContext('2d'); g.scale(r, r); g.translate(ww / 2, 0);
  g.fillStyle = col; g.beginPath(); g.moveTo(-ww / 2, 0); g.lineTo(ww / 2, 0); g.lineTo(ww / 2, hh * 0.84);
  for (let i = 6; i >= 0; i--) g.lineTo(-ww / 2 + ww * i / 6, hh * (i % 2 ? 0.84 : 0.96));
  g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out';                          // the cut-out pattern: a flower and little diamonds
  for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; g.beginPath(); g.ellipse(Math.cos(an) * ww * 0.12, hh * 0.42 + Math.sin(an) * ww * 0.12, ww * 0.07, ww * 0.035, an, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(0, hh * 0.42, ww * 0.045, 0, TAU); g.fill();
  [[-0.32, 0.14], [0.32, 0.14], [-0.32, 0.7], [0.32, 0.7]].forEach(([u, v]) => { g.beginPath(); g.moveTo(u * ww, v * hh - ww * 0.05); g.lineTo(u * ww + ww * 0.05, v * hh); g.lineTo(u * ww, v * hh + ww * 0.05); g.lineTo(u * ww - ww * 0.05, v * hh); g.fill(); });
  picados.set(k, c);
  if (picados.size > 40) picados.delete(picados.keys().next().value);
  return c;
}
function newLantern(S, y) { const cols = S.f.lantern || ['230,40,40', '255,170,60']; return { x: rnd(0.04, 0.96) * S.w, y, v: rnd(10, 26), s: S.s * rnd(0.38, 0.62), p: rnd(0, TAU), c: cols[Math.floor(rnd(0, cols.length))] }; }
function newPetal(S, y) { return { x: rnd(0, S.w), y, v: rnd(30, 70), s: rnd(3.5, 7), r: rnd(0, TAU), vr: rnd(-3, 3), p: rnd(0, TAU), c: ['#FF9F1C', '#FFBF3C', '#FF7A2F', '#FFD166'][Math.floor(rnd(0, 4))] }; }
function newConfetti(S, y) { return { x: rnd(0, S.w), y, v: rnd(60, 130), s: rnd(3, 6), r: rnd(0, TAU), vr: rnd(-6, 6), p: rnd(0, TAU), c: ['#FF4F79', '#FFB627', '#3BCEAC', '#7B5CFF', '#2EC4F1', '#FFFFFF'][Math.floor(rnd(0, 6))] }; }
function newCloud(S, any) { return { x: rnd(0, S.w), y: any ? rnd(S.h * 0.3, S.y0) : S.y0 + rnd(0, S.s), r: rnd(0.1, 0.2) * Math.max(S.w, S.h), v: rnd(8, 20), vx: rnd(-10, 10), a: rnd(0.6, 0.9), c: ['255,40,110', '255,170,0', '0,200,150', '120,70,255', '0,170,255', '255,100,20'][Math.floor(rnd(0, 6))] }; }
function newEmber(S, any) { const cx = S.w * 0.36, base = S.y0 + S.s * 0.25; return { x: cx + rnd(-S.s, S.s) * 0.6, y: any ? base - rnd(0, S.h * 0.5) : base - S.s * 0.6, v: rnd(40, 110), vx: rnd(-14, 14), l: rnd(0.4, 1) }; }

/* ---------------- the scene ---------------- */
export function makeFestival() {
  const S = {
    id: 'festival', fid: '', f: null, w: 0, h: 0, y0: 0, s: 0, top: 72, bg: null, live: {}, fx: [], rockets: [], fwT: 1, soundOn: true,
    init(w, h) { this.w = w; this.h = h; this.layout(); },
    resize(w, h) { this.w = w; this.h = h; this.layout(); },
    layout() {
      if (!this.f) return;
      this.y0 = Math.round(this.h * this.f.horizon); this.s = clamp(Math.min(this.w, this.h) / 9, 30, 110); this.top = view.top;
      this.bg = null; this.live = {};
      (this.f.live || []).forEach((k) => { this.live[k] = LIVE[k].init(this); });
    },
    set(id) {
      if (!F[id] || id === this.fid) return;
      this.fid = id; this.f = F[id]; this.fx = []; this.rockets = []; this.fwT = 1.2;
      if (this.w) this.layout();
    },
    paintBg() {
      const w = this.w, h = this.h, f = this.f, c = layer(w * (view.dpr || 1), h * (view.dpr || 1)), g = c.getContext('2d');
      g.scale(view.dpr || 1, view.dpr || 1);
      const sky = g.createLinearGradient(0, 0, 0, this.y0);
      f.sky.forEach((col, i) => sky.addColorStop(i / (f.sky.length - 1), col));
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const R = seeded(hash(this.fid + ':sky'));
      if (f.night) { g.fillStyle = '#fff'; for (let i = 0; i < w * h / 4200; i++) { g.globalAlpha = 0.2 + R() * 0.7; const r = R() < 0.1 ? 1.6 : 0.9; g.fillRect(R() * w, R() * this.y0 * 0.85, r, r); } g.globalAlpha = 1; }
      if (f.sun) { const x = f.sun.x * w, y = f.sun.y * h, r = Math.min(w, h) * 0.5, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,250,220,.95)'); gr.addColorStop(0.08, 'rgba(255,236,170,.75)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      if (f.moon) {
        const x = f.moon.x * w, y = f.moon.y * h, r = Math.min(w, h) * 0.055 * (f.moon.r || 1);
        const gr = g.createRadialGradient(x, y, r * 0.8, x, y, r * 4.5); gr.addColorStop(0, 'rgba(255,244,214,.35)'); gr.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = gr; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
        const m = layer(r * 2.4, r * 2.4), mg = m.getContext('2d');
        mg.fillStyle = '#FFF4D6'; mg.beginPath(); mg.arc(r * 1.2, r * 1.2, r, 0, TAU); mg.fill();
        if (f.moon.crescent) { mg.globalCompositeOperation = 'destination-out'; mg.beginPath(); mg.arc(r * 1.62, r * 1.02, r * 0.92, 0, TAU); mg.fill(); }
        else { mg.fillStyle = 'rgba(200,190,160,.35)'; [[0.8, 0.9, 0.18], [1.4, 1.35, 0.24], [1.1, 1.6, 0.12]].forEach(([u, v, k]) => { mg.beginPath(); mg.arc(r * u, r * v, r * k, 0, TAU); mg.fill(); }); }
        g.drawImage(m, x - r * 1.2, y - r * 1.2);
      }
      f.land(g, w, h, this.y0, seeded(hash(this.fid + ':land')), this.s);
      this.bg = c;
    },
    step(dt, t) {
      if (!this.f) return;
      if (this.top !== view.top) { this.top = view.top; }
      Object.keys(this.live).forEach((k) => LIVE[k].step(this.live[k], this, dt, t));
      // fireworks by themselves, now and then
      if (this.f.fw) { this.fwT -= dt; if (this.fwT <= 0) { this.fwT = rnd(0.6, 1.6) / this.f.fw; this.rocket(rnd(0.15, 0.85) * this.w, rnd(0.12, 0.42) * this.h, false); } }
      this.rockets.forEach((r) => { r.t += dt; const k = Math.min(1, r.t / r.d); r.x = r.x0 + (r.x1 - r.x0) * k; r.y = r.y0 + (r.y1 - r.y0) * (1 - Math.pow(1 - k, 2)); if (k >= 1 && !r.done) { r.done = true; this.fx.push(...burstParticles(r.x1, r.y1, view.small ? 60 : 110, FW_COLS[Math.floor(rnd(0, FW_COLS.length))], Math.min(this.w, this.h) * 0.32, { life: 1.9 })); } });
      this.rockets = this.rockets.filter((r) => !r.done);
      this.fx = stepParticles(this.fx, dt, t);
      if (this.fx.length > 1400) this.fx.splice(0, this.fx.length - 1400);
    },
    rocket(x, y, user) {
      this.rockets.push({ x0: x + rnd(-40, 40), y0: this.y0, x1: x, y1: y, x, y: this.y0, t: 0, d: 0.75 });
      if (this.soundOn && (user || Math.random() < 0.5)) Fx.play('firework', user);
    },
    paintShade(w, h) {
      const c = layer(w, h), g = c.getContext('2d');
      const top = g.createLinearGradient(0, 0, 0, h * 0.22); top.addColorStop(0, 'rgba(3,5,12,.5)'); top.addColorStop(1, 'rgba(3,5,12,0)');
      g.fillStyle = top; g.fillRect(0, 0, w, h * 0.22);
      const bot = g.createLinearGradient(0, h * 0.5, 0, h); bot.addColorStop(0, 'rgba(3,5,12,0)'); bot.addColorStop(1, 'rgba(3,5,12,.62)');
      g.fillStyle = bot; g.fillRect(0, h * 0.5, w, h * 0.5);
      const side = g.createRadialGradient(0, h * 0.78, 0, 0, h * 0.78, Math.max(w * 0.55, 420)); side.addColorStop(0, 'rgba(3,5,12,.5)'); side.addColorStop(1, 'rgba(3,5,12,0)');
      g.fillStyle = side; g.fillRect(0, 0, w, h);
      this.shade = c; this.shadeKey = w + 'x' + h;
    },
    draw(ctx, w, h, t) {
      if (!this.f) { ctx.fillStyle = '#05070F'; ctx.fillRect(0, 0, w, h); return; }
      if (!this.bg) this.paintBg();
      ctx.drawImage(this.bg, 0, 0, w, h);
      ['spotlights', 'shimmer', 'skylanterns', 'lanterns', 'hanging', 'flags', 'ketupat', 'dragon', 'tree', 'menorah', 'bonfire', 'pelita', 'torches', 'diyas', 'candles', 'lotus', 'colour', 'water', 'birds', 'wheat', 'sparks', 'rice', 'snow', 'petals', 'confetti']
        .forEach((k) => { if (this.live[k]) { ctx.save(); LIVE[k].draw(this.live[k], this, ctx, t); ctx.restore(); } });
      // rockets and everything a tap made
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      this.rockets.forEach((r) => dotGlow(ctx, r.x, r.y, 10, '255,230,170', 0.9));
      ctx.restore();
      drawParticles(ctx, this.fx, t);
      // a soft shade behind the words, so they read on bright scenes too
      if (!this.shade || this.shadeKey !== w + 'x' + h) this.paintShade(w, h);
      ctx.drawImage(this.shade, 0, 0, w, h);
    },
    /* tapping the scene */
    click(x, y) {
      if (!this.f) return null;
      const k = this.f.tap, on = this.soundOn;
      if (k === 'firework') this.rocket(x, Math.min(y, this.y0 - 40), true);
      else if (k === 'sparkler' || k === 'golden') { this.fx.push(...burstParticles(x, y, 70, ['255,214,120', '255,240,190', '255,170,60'], 260, { life: 1.1 })); if (on) Fx.play(k === 'sparkler' ? 'crackle' : 'sparkle'); }
      else if (k === 'sparkle') { this.fx.push(...burstParticles(x, y, 60, ['255,255,255', '255,230,140', '170,220,255'], 220, { life: 1.2 })); if (on) { Fx.play('sparkle'); Fx.play('bell', 88); } }
      else if (k === 'gong') { this.fx.push(...burstParticles(x, y, 50, ['255,214,120', '190,255,140'], 200, { life: 1.4 })); if (on) Fx.play('gong'); }
      else if (k === 'lantern') { const cols = this.f.lantern || ['255,200,120']; this.fx.push({ x, y, vx: 0, vy: -22, c: cols[Math.floor(rnd(0, cols.length))], l: 1, d: 14, r: this.s * 0.55, kind: 'lantern', rot: rnd(0, TAU), vr: 0 }); if (on) Fx.play('lantern'); }
      else if (k === 'colour') { const c = ['255,79,121', '255,182,39', '59,206,172', '123,92,255', '46,196,241'][Math.floor(rnd(0, 5))]; this.fx.push(...burstParticles(x, y, 16, [c], 180, { kind: 'puff', life: 2.4, size: 14 })); this.fx.push(...burstParticles(x, y, 60, [c], 300, { life: 1 })); if (on) Fx.play('poof'); }
      else if (k === 'splash') { this.fx.push(...burstParticles(x, y, 90, ['210,240,255'], 320, { kind: 'drop', up: 260, life: 1.6, size: 0.9 })); if (on) Fx.play('splash'); }
      else if (k === 'petals') { this.fx.push(...burstParticles(x, y, 46, ['#FF9F1C', '#FFBF3C', '#FF7A2F', '#FFD166'], 240, { kind: 'petal', up: 60, life: 3 })); if (on) Fx.play('petals'); }
      else if (k === 'confetti') { this.fx.push(...burstParticles(x, y, 90, ['#FF4F79', '#FFB627', '#3BCEAC', '#7B5CFF', '#2EC4F1', '#FFFFFF'], 360, { kind: 'confetti', up: 180, life: 3 })); if (on) { Fx.play('pop'); Fx.play('cheer'); } }
      else if (k === 'candle') { const m = this.live.menorah; if (m) { m.lit = m.lit >= 9 ? 1 : m.lit + 1; if (on) Fx.play('candle'); return { menorah: m.lit - 1 }; } }
      return { tap: k };
    }
  };
  return S;
}
