/* Scenery shared by the drawn windows (the festivals and the Seven Wonders): a soft glow drawn once per colour,
   repeatable random numbers so the same town is drawn every time, hills, houses, palms and trees, a flame and a
   lantern, and the particles a tap throws. */
import { TAU, rnd, layer, noise } from './util.js?v=f99d8766';

/* ---------------- a soft glow, drawn once per colour and size ---------------- */
const glows = new Map();
export function glow(rgb, r) {
  r = Math.max(4, Math.round(r / 2) * 2);
  const k = rgb + '|' + r;
  let c = glows.get(k);
  if (c) return c;
  c = layer(r * 2, r * 2);
  const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.25, 'rgba(' + rgb + ',.55)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  glows.set(k, c);
  if (glows.size > 120) glows.delete(glows.keys().next().value);
  return c;
}
/* One sprite per colour, stretched to any size: glows grow and shrink without making new pictures every frame. */
export const dotGlow = (ctx, x, y, r, rgb, a) => { ctx.globalAlpha = a == null ? 1 : a; ctx.drawImage(glow(rgb, 48), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };
/* a repeatable random number, so the same town is drawn every time */
export function seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0; return h; };

/* ---------------- colours ---------------- */
/* Lighten (k > 0) or darken (k < 0) a hex colour, as a hex colour. */
export function tint(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

/* ---------------- the settings (drawn once into the background) ---------------- */
export function hills(g, w, y0, amp, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, y0 + 400);
  for (let x = 0; x <= w + 8; x += 8) g.lineTo(x, y0 - amp * (0.55 * noise(x / w * 2.2 + seed, seed) + 0.45 * noise(x / w * 6 + seed * 2, seed)));
  g.lineTo(w, y0 + 400); g.closePath(); g.fill();
}
export function ground(g, w, h, y0, col) { g.fillStyle = col; g.fillRect(0, y0, w, h - y0); }
export function windowsIn(g, x, y, ww, hh, lit, R, rows, cols) {
  if (!lit) return;
  const cw = ww / (cols * 2 + 1), ch = hh / (rows * 2 + 1);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    if (R() < 0.35) continue;
    g.fillStyle = lit; g.globalAlpha = 0.65 + R() * 0.35;
    g.fillRect(x + cw * (1 + j * 2), y + ch * (1 + i * 2), cw, ch * 1.2);
  }
  g.globalAlpha = 1;
}
export function houses(g, x0, x1, y0, s, col, lit, style, R) {
  let x = x0;
  while (x < x1) {
    const ww = s * (0.9 + R() * 0.9), hh = s * (0.7 + R() * 0.6);
    g.fillStyle = Array.isArray(col) ? col[Math.floor(R() * col.length)] : col;
    if (style === 'stilt') {                                        // a Malay kampung house on stilts
      const lift = s * 0.32;
      for (let k = 0; k < 4; k++) g.fillRect(x + ww * (0.08 + k * 0.28), y0 - lift, s * 0.05, lift);
      g.fillRect(x, y0 - lift - hh * 0.65, ww, hh * 0.65);
      g.beginPath(); g.moveTo(x - ww * 0.12, y0 - lift - hh * 0.65); g.lineTo(x + ww / 2, y0 - lift - hh * 1.35); g.lineTo(x + ww * 1.12, y0 - lift - hh * 0.65); g.closePath(); g.fill();
      windowsIn(g, x, y0 - lift - hh * 0.65, ww, hh * 0.65, lit, R, 1, 2);
    } else if (style === 'shop') {                                  // shophouses with curved Chinese eaves
      g.fillRect(x, y0 - hh, ww, hh);
      g.beginPath(); g.moveTo(x - ww * 0.15, y0 - hh - s * 0.02); g.quadraticCurveTo(x + ww / 2, y0 - hh + s * 0.1, x + ww * 1.15, y0 - hh - s * 0.02);
      g.lineTo(x + ww * 0.95, y0 - hh - s * 0.22); g.quadraticCurveTo(x + ww / 2, y0 - hh - s * 0.12, x + ww * 0.05, y0 - hh - s * 0.22); g.closePath(); g.fill();
      windowsIn(g, x, y0 - hh, ww, hh, lit, R, 2, 2);
    } else if (style === 'tower') {                                 // a city skyline
      const th = s * (1.2 + R() * 2.6);
      g.fillRect(x, y0 - th, ww * 0.8, th);
      windowsIn(g, x, y0 - th, ww * 0.8, th, lit, R, Math.max(2, Math.round(th / s * 3)), 3);
    } else if (style === 'flat') {                                  // flat-roofed houses: a Mediterranean or desert town
      g.fillRect(x, y0 - hh * 0.7, ww, hh * 0.7);
      if (R() < 0.4) g.fillRect(x + ww * 0.2, y0 - hh * 0.95, ww * 0.5, hh * 0.25);
      windowsIn(g, x, y0 - hh * 0.7, ww, hh * 0.7, lit, R, 1, 2);
    } else {                                                        // a house with a pitched roof
      g.fillRect(x, y0 - hh, ww, hh);
      g.beginPath(); g.moveTo(x - ww * 0.06, y0 - hh); g.lineTo(x + ww / 2, y0 - hh - s * 0.42); g.lineTo(x + ww * 1.06, y0 - hh); g.closePath(); g.fill();
      if (R() < 0.5) g.fillRect(x + ww * 0.7, y0 - hh - s * 0.42, s * 0.08, s * 0.25);   // a chimney
      windowsIn(g, x, y0 - hh, ww, hh, lit, R, 2, 2);
    }
    x += ww + s * (0.05 + R() * 0.25);
  }
}
export function palm(g, x, y0, hgt, col, lean) {
  g.strokeStyle = col; g.lineWidth = Math.max(3, hgt * 0.04); g.lineCap = 'round';
  const tx = x + lean * hgt * 0.3, ty = y0 - hgt;
  g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + lean * hgt * 0.05, y0 - hgt * 0.6, tx, ty); g.stroke();
  g.fillStyle = col;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.5, L = hgt * 0.42;
    g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - hgt * 0.08, tx + Math.cos(a) * L, ty + Math.sin(a) * L + hgt * 0.18);
    g.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5, tx, ty); g.fill();
  }
}
export function tree(g, x, y0, hgt, col) { g.fillStyle = col; g.fillRect(x - hgt * 0.04, y0 - hgt * 0.45, hgt * 0.08, hgt * 0.45); g.beginPath(); g.ellipse(x, y0 - hgt * 0.62, hgt * 0.28, hgt * 0.34, 0, 0, TAU); g.fill(); }
/* a cypress: tall, thin and dark */
export function cypress(g, x, y0, hgt, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x - hgt * 0.09, y0); g.quadraticCurveTo(x - hgt * 0.1, y0 - hgt * 0.5, x, y0 - hgt); g.quadraticCurveTo(x + hgt * 0.1, y0 - hgt * 0.5, x + hgt * 0.09, y0); g.closePath(); g.fill(); }
/* an umbrella pine: a bare trunk and a flat, wide top */
export function pine(g, x, y0, hgt, col) { g.fillStyle = col; g.fillRect(x - hgt * 0.03, y0 - hgt * 0.62, hgt * 0.06, hgt * 0.62); g.beginPath(); g.ellipse(x, y0 - hgt * 0.72, hgt * 0.34, hgt * 0.17, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x - hgt * 0.12, y0 - hgt * 0.8, hgt * 0.2, hgt * 0.12, 0, 0, TAU); g.fill(); }
export function mountain(g, cx, y0, ww, hh, col, jag) {
  g.fillStyle = col; g.beginPath(); g.moveTo(cx - ww / 2, y0);
  if (jag) { const pts = [[-0.32, 0.45], [-0.2, 0.7], [-0.12, 0.62], [-0.05, 0.95], [0.02, 0.8], [0.08, 1], [0.14, 0.78], [0.22, 0.7], [0.34, 0.4]]; pts.forEach(([u, v]) => g.lineTo(cx + u * ww, y0 - v * hh)); }
  else { g.quadraticCurveTo(cx - ww * 0.25, y0 - hh * 1.25, cx, y0 - hh); g.quadraticCurveTo(cx + ww * 0.3, y0 - hh * 0.75, cx + ww * 0.32, y0 - hh * 0.2); }
  g.lineTo(cx + ww / 2, y0); g.closePath(); g.fill();
}
/* a sky, top to bottom, with stars at night and a sun or moon */
export function sky(g, w, h, y0, cols, o, R) {
  const grad = g.createLinearGradient(0, 0, 0, y0);
  cols.forEach((col, i) => grad.addColorStop(i / (cols.length - 1), col));
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  if (o.night) { g.fillStyle = '#fff'; for (let i = 0; i < w * h / 4200; i++) { g.globalAlpha = 0.2 + R() * 0.7; const r = R() < 0.1 ? 1.6 : 0.9; g.fillRect(R() * w, R() * y0 * 0.85, r, r); } g.globalAlpha = 1; }
  if (o.sun) {
    const x = o.sun.x * w, y = o.sun.y * h, r = Math.min(w, h) * (o.sun.big ? 0.75 : 0.5), gr = g.createRadialGradient(x, y, 0, x, y, r);
    const c = o.sun.c || '255,236,170';
    gr.addColorStop(0, 'rgba(255,250,220,.95)'); gr.addColorStop(o.sun.big ? 0.05 : 0.08, 'rgba(' + c + ',.75)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (o.sun.disc) { g.fillStyle = o.sun.dc || 'rgba(255,246,214,.95)'; g.beginPath(); g.arc(x, y, Math.min(w, h) * o.sun.disc, 0, TAU); g.fill(); }
  }
  if (o.moon) {
    const x = o.moon.x * w, y = o.moon.y * h, r = Math.min(w, h) * 0.055 * (o.moon.r || 1);
    const gr = g.createRadialGradient(x, y, r * 0.8, x, y, r * 4.5); gr.addColorStop(0, 'rgba(255,244,214,.35)'); gr.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = gr; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    const m = layer(r * 2.4, r * 2.4), mg = m.getContext('2d');
    mg.fillStyle = '#FFF4D6'; mg.beginPath(); mg.arc(r * 1.2, r * 1.2, r, 0, TAU); mg.fill();
    if (o.moon.crescent) { mg.globalCompositeOperation = 'destination-out'; mg.beginPath(); mg.arc(r * 1.62, r * 1.02, r * 0.92, 0, TAU); mg.fill(); }
    else { mg.fillStyle = 'rgba(200,190,160,.35)'; [[0.8, 0.9, 0.18], [1.4, 1.35, 0.24], [1.1, 1.6, 0.12]].forEach(([u, v, k]) => { mg.beginPath(); mg.arc(r * u, r * v, r * k, 0, TAU); mg.fill(); }); }
    g.drawImage(m, x - r * 1.2, y - r * 1.2);
  }
}

/* ---------------- lights ---------------- */
export function flame(ctx, x, y, s, t, p) {
  const f = 0.85 + 0.15 * Math.sin(t * 13 + p) + 0.08 * Math.sin(t * 29 + p * 2);
  ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, x, y - s * 0.5, s * 2.6, '255,170,60', 0.55); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#FFB13B'; ctx.beginPath(); ctx.moveTo(x - s * 0.32, y); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.6 * f, x, y - s * 1.15 * f); ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.6 * f, x + s * 0.32, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FFF2C4'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.28, s * 0.13, s * 0.3 * f, 0, 0, TAU); ctx.fill();
}
export function lantern(ctx, x, y, s, rgb, t, p, hang) {
  ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, x, y, s * 2.2, rgb, 0.45 + 0.1 * Math.sin(t * 3 + p)); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgb(' + rgb + ')'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.55, s * 0.68, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.beginPath(); ctx.ellipse(x - s * 0.12, y - s * 0.05, s * 0.18, s * 0.45, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#F5C542'; ctx.fillRect(x - s * 0.3, y - s * 0.72, s * 0.6, s * 0.12); ctx.fillRect(x - s * 0.3, y + s * 0.6, s * 0.6, s * 0.12);
  if (hang) { ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + s * 0.72); ctx.lineTo(x, y + s * 1.1); ctx.stroke(); }
}

/* ---------------- what a tap throws ---------------- */
export function burstParticles(x, y, n, cols, speed, o) {
  o = o || {};
  return Array.from({ length: n }, () => { const a = rnd(0, TAU), v = rnd(0.3, 1) * speed; return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), c: cols[Math.floor(rnd(0, cols.length))], l: 1, d: rnd(0.6, 1.2) * (o.life || 1.6), r: rnd(1.5, 3.2) * (o.size || 1), kind: o.kind || 'spark', rot: rnd(0, TAU), vr: rnd(-6, 6) }; });
}
export const FW_COLS = [['255,90,90', '255,210,90'], ['120,200,255', '255,255,255'], ['255,120,220', '255,230,140'], ['140,255,160', '255,255,200'], ['255,170,60', '255,90,60']];
/* Draw the particles a tap threw (sparks, puffs, drops, petals, confetti, lanterns). */
export function drawParticles(ctx, fx, t) {
  fx.forEach((p) => {
    const a = Math.max(0, Math.min(1, p.l));
    if (p.kind === 'spark') { ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, p.x, p.y, p.r * 3.2, p.c, a); ctx.globalCompositeOperation = 'source-over'; }
    else if (p.kind === 'puff') { ctx.globalAlpha = a * 0.55; ctx.drawImage(glow(p.c, 48), p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); ctx.globalAlpha = 1; }
    else if (p.kind === 'drop') { ctx.fillStyle = 'rgba(210,240,255,' + a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
    else if (p.kind === 'lantern') lantern(ctx, p.x, p.y, p.r, p.c, t, p.rot, false);
    else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a; ctx.fillStyle = p.c.indexOf(',') > 0 ? 'rgb(' + p.c + ')' : p.c; if (p.kind === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, p.r * 2, p.r * 1.1, 0, 0, TAU); ctx.fill(); } else ctx.fillRect(-p.r * 1.6, -p.r * 0.8, p.r * 3.2, p.r * 1.6); ctx.restore(); }
  });
}
/* Move them on (gravity for sparks and drops, a drift for puffs, lanterns rising). */
export function stepParticles(fx, dt, t) {
  fx.forEach((p) => {
    p.l -= dt / p.d;
    if (p.kind === 'puff') { p.r += dt * 60; p.vx *= 0.94; p.vy *= 0.94; }
    else if (p.kind === 'lantern') { p.vy = -22; p.vx = Math.sin(t + p.rot) * 8; }
    else if (p.kind === 'bird') { p.vy -= 40 * dt; p.vx *= 0.995; }
    else { p.vy += (p.kind === 'drop' ? 520 : p.kind === 'petal' || p.kind === 'confetti' ? 60 : 90) * dt; p.vx *= 0.985; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
  });
  return fx.filter((p) => p.l > 0);
}
