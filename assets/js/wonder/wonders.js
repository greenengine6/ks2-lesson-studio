/* The Seven Wonders, ancient and new, drawn live: no pictures to download. Each wonder is its own full-screen scene,
   drawn in metres so that everything is the right size next to everything else, with the place around it (the desert,
   a harbour, a jungle, the mountains above Rio), the weather, the people who walk past it, and its own music.
   The ancient wonders are drawn as they might have looked when they were new; a tap joins in: the Great Pyramid
   gets its polished white casing back, Zeus throws a lightning bolt, a beacon is lit on the Great Wall, the equinox
   serpent slithers down Chichén Itzá, the Taj Mahal changes colour with the time of day. */
import { TAU, rnd, clamp, layer, view, noise, drawEmoji } from './util.js?v=ed35fd44';
import { Fx } from './music.js?v=ed35fd44';
import { dotGlow, seeded, hash, tint, hills, ground, houses, palm, tree, cypress, pine, mountain, sky, flame, burstParticles, drawParticles, stepParticles } from './scenery.js?v=ed35fd44';

/* ---------------- drawing in metres (x across, y up from the ground) ---------------- */
const rect = (g, x, y, w, h) => g.fillRect(x, y, w, h);
const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
const disc = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const half = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI); g.fill(); };          // the upper half of a circle
const mix = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return '#' + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k).toString(16).padStart(2, '0')).join(''); };
const hline = (g, x0, x1, y, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); };
/* use a screen-space helper (y down) inside the metre frame: flipped(g, x, y, (g) => palm(g, 0, 0, 12, col, 1)) */
const pxIn = (g, S, x, y, fn) => { g.save(); g.translate(x, y); g.scale(1 / S.k, -1 / S.k); fn(g); g.restore(); };
/* a box seen a little from one side: the front, and a darker side face dx across and dy up */
function box(g, x, y, w, h, c, dx, dy) {
  g.fillStyle = tint(c, -0.26); poly(g, [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]]);
  g.fillStyle = tint(c, 0.1); poly(g, [[x, y + h], [x + w, y + h], [x + w + dx, y + h + dy], [x + dx, y + h + dy]]);
  g.fillStyle = c; rect(g, x, y, w, h);
}
/* a classical column: a base, a fluted shaft that tapers a little, and a capital */
function column(g, x, y, h, d, c, style) {
  const lt = tint(c, 0.12), dk = tint(c, -0.24);
  g.fillStyle = c; rect(g, x - d * 0.72, y, d * 1.44, d * 0.28);
  const gr = g.createLinearGradient(x - d / 2, 0, x + d / 2, 0); gr.addColorStop(0, dk); gr.addColorStop(0.38, lt); gr.addColorStop(1, dk);
  g.fillStyle = gr; poly(g, [[x - d / 2, y + d * 0.28], [x + d / 2, y + d * 0.28], [x + d * 0.42, y + h - d * 0.5], [x - d * 0.42, y + h - d * 0.5]]);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = d * 0.05; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * d * 0.18, y + d * 0.28); g.lineTo(x + k * d * 0.15, y + h - d * 0.5); g.stroke(); }
  g.fillStyle = c;
  if (style === 'ionic') { rect(g, x - d * 0.72, y + h - d * 0.5, d * 1.44, d * 0.22); g.fillStyle = dk; disc(g, x - d * 0.6, y + h - d * 0.36, d * 0.2); disc(g, x + d * 0.6, y + h - d * 0.36, d * 0.2); g.fillStyle = c; rect(g, x - d * 0.66, y + h - d * 0.16, d * 1.32, d * 0.16); }
  else if (style === 'corinthian') { poly(g, [[x - d * 0.5, y + h - d * 0.9], [x + d * 0.5, y + h - d * 0.9], [x + d * 0.78, y + h], [x - d * 0.78, y + h]]); g.fillStyle = dk; for (let k = -1; k <= 1; k++) disc(g, x + k * d * 0.4, y + h - d * 0.62, d * 0.13); }
  else { rect(g, x - d * 0.6, y + h - d * 0.45, d * 1.2, d * 0.25); rect(g, x - d * 0.76, y + h - d * 0.2, d * 1.52, d * 0.2); }
}
function colonnade(g, x0, x1, n, y, h, d, c, style) { for (let i = 0; i < n; i++) column(g, x0 + (x1 - x0) * i / (n - 1), y, h, d, c, style); }
/* an architrave, a painted frieze and a cornice */
function entablature(g, x0, x1, y, h, c, pat) {
  g.fillStyle = c; rect(g, x0, y, x1 - x0, h);
  if (pat) { const fh = h * 0.42, fy = y + h * 0.3; let i = 0; for (let x = x0 + h * 0.2; x < x1 - h * 0.2; x += fh * 0.95, i++) { g.fillStyle = pat[i % pat.length]; rect(g, x, fy, fh * 0.95, fh); } }
  g.fillStyle = tint(c, -0.16); rect(g, x0 - h * 0.12, y + h * 0.84, x1 - x0 + h * 0.24, h * 0.16);
}
function pediment(g, x0, x1, y, h, c, inner) {
  g.fillStyle = c; poly(g, [[x0 - h * 0.15, y], [x1 + h * 0.15, y], [(x0 + x1) / 2, y + h]]);
  if (inner) { g.fillStyle = inner; poly(g, [[x0 + h * 0.35, y + h * 0.12], [x1 - h * 0.35, y + h * 0.12], [(x0 + x1) / 2, y + h * 0.8]]); }
}
function steps(g, cx, y, w, n, sh, c) { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? tint(c, -0.08) : c; rect(g, cx - (w - i * sh * 2.6) / 2, y + i * sh, w - i * sh * 2.6, sh); } }
function archway(g, x, y, w, h, c) { g.fillStyle = c; rect(g, x - w / 2, y, w, h - w / 2); half(g, x, y + h - w / 2, w / 2); }
function pointedArch(g, x, y, w, h, c) {
  g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y + h - w * 0.55); g.quadraticCurveTo(x - w / 2, y + h, x, y + h);
  g.quadraticCurveTo(x + w / 2, y + h, x + w / 2, y + h - w * 0.55); g.lineTo(x + w / 2, y); g.closePath(); g.fill();
}
/* an onion dome: widest at r, pinching to a point at y + h */
function onion(g, x, y, r, h, c, hl) {
  const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, tint(c, -0.22)); gr.addColorStop(0.42, hl || tint(c, 0.14)); gr.addColorStop(1, tint(c, -0.3));
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - r * 0.74, y); g.bezierCurveTo(x - r * 1.14, y + h * 0.3, x - r * 0.92, y + h * 0.74, x, y + h);
  g.bezierCurveTo(x + r * 0.92, y + h * 0.74, x + r * 1.14, y + h * 0.3, x + r * 0.74, y); g.closePath(); g.fill();
}
function finial(g, x, y, h, c) { g.fillStyle = c; rect(g, x - h * 0.04, y, h * 0.08, h); disc(g, x, y + h * 0.35, h * 0.12); disc(g, x, y + h * 0.68, h * 0.09); poly(g, [[x - h * 0.13, y + h * 0.8], [x + h * 0.13, y + h * 0.8], [x, y + h * 1.06]]); }
/* a pyramid seen from one corner: a shaded face on the left, a sunlit one on the right, and the courses of stone */
function pyramid(g, cx, b, h, lit, dark, courses) {
  const near = cx + b * 0.1;
  g.fillStyle = dark; poly(g, [[cx - b / 2, 0], [cx, h], [near, 0]]);
  g.fillStyle = lit; poly(g, [[near, 0], [cx, h], [cx + b / 2, 0]]);
  if (courses) {
    g.strokeStyle = 'rgba(60,40,10,.1)';
    for (let y = courses; y < h; y += courses) { const half2 = b / 2 * (1 - y / h); hline(g, cx - half2, cx + half2, y, 0.3); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(cx, h); g.lineTo(near, 0); g.stroke();
  }
}
/* the Great Sphinx, lying down and facing to the right */
function sphinx(g, x, y, L, H, c) {
  const dk = tint(c, -0.22), lt = tint(c, 0.1), hx = x + L * 0.68;
  g.fillStyle = c; g.beginPath(); g.moveTo(x + L * 0.04, y); g.quadraticCurveTo(x - L * 0.02, y + H * 0.2, x + L * 0.02, y + H * 0.38); g.quadraticCurveTo(x + L * 0.06, y + H * 0.56, x + L * 0.2, y + H * 0.52);
  g.lineTo(x + L * 0.58, y + H * 0.5); g.lineTo(x + L * 0.58, y); g.closePath(); g.fill();
  g.fillStyle = dk; rect(g, x + L * 0.5, y, L * 0.5, H * 0.17); rect(g, x + L * 0.52, y + H * 0.17, L * 0.16, H * 0.3);   // the paws and the chest in shadow
  g.fillStyle = lt; rect(g, x + L * 0.6, y + H * 0.17, L * 0.14, H * 0.34);
  g.fillStyle = c; poly(g, [[hx - H * 0.3, y + H * 0.42], [hx - H * 0.19, y + H], [hx + H * 0.19, y + H], [hx + H * 0.3, y + H * 0.42]]);   // the nemes headdress
  g.fillStyle = lt; rect(g, hx - H * 0.11, y + H * 0.5, H * 0.24, H * 0.42);                                                     // the face
  g.fillStyle = dk; rect(g, hx - H * 0.06, y + H * 0.74, H * 0.05, H * 0.06); rect(g, hx + H * 0.04, y + H * 0.74, H * 0.05, H * 0.06); rect(g, hx + H * 0.005, y + H * 0.6, H * 0.03, H * 0.12);
  g.fillStyle = dk; rect(g, hx - H * 0.3, y + H * 0.42, H * 0.6, H * 0.06);
}
/* a horse, standing or walking, facing right (for a chariot or a procession) */
function horse(g, x, y, s, c) {
  g.fillStyle = c; g.beginPath(); g.ellipse(x, y + s * 0.62, s * 0.52, s * 0.24, 0, 0, TAU); g.fill();
  poly(g, [[x + s * 0.34, y + s * 0.74], [x + s * 0.5, y + s * 0.74], [x + s * 0.68, y + s * 1.05], [x + s * 0.5, y + s * 1.1]]);
  g.beginPath(); g.ellipse(x + s * 0.68, y + s * 1.08, s * 0.16, s * 0.1, 0.3, 0, TAU); g.fill();
  [[-0.36, 0], [-0.2, 0.02], [0.2, 0.02], [0.36, 0.2]].forEach(([u, lift]) => rect(g, x + u * s - s * 0.04, y + lift * s, s * 0.08, s * (0.62 - lift)));
  g.strokeStyle = c; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.66); g.quadraticCurveTo(x - s * 0.72, y + s * 0.5, x - s * 0.66, y + s * 0.2); g.stroke();
}

/* ---------------- people, camels and llamas (drawn on the screen, y down) ---------------- */
function figure(ctx, x, yb, h, c, ph, dir) {
  const r = h * 0.13, sw = Math.sin(ph) * h * 0.14;
  ctx.fillStyle = c;
  ctx.fillRect(x - h * 0.13, yb - h * 0.66, h * 0.26, h * 0.4);                              // body
  ctx.beginPath(); ctx.arc(x, yb - h * 0.82, r, 0, TAU); ctx.fill();                            // head
  ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, h * 0.09); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - h * 0.05, yb - h * 0.28); ctx.lineTo(x - h * 0.05 + sw * dir, yb); ctx.moveTo(x + h * 0.05, yb - h * 0.28); ctx.lineTo(x + h * 0.05 - sw * dir, yb); ctx.stroke();
}
function camel(ctx, x, yb, h, c, ph, rider) {
  const dk = tint(c, -0.25), L = h * 1.5;
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, yb - h * 0.55, L * 0.32, h * 0.2, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - L * 0.08, yb - h * 0.74, L * 0.13, h * 0.13, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + L * 0.12, yb - h * 0.72, L * 0.11, h * 0.11, 0, 0, TAU); ctx.fill();   // humps
  ctx.strokeStyle = c; ctx.lineWidth = h * 0.13; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + L * 0.28, yb - h * 0.6); ctx.quadraticCurveTo(x + L * 0.42, yb - h * 0.75, x + L * 0.44, yb - h * 0.98); ctx.stroke();       // neck
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + L * 0.5, yb - h * 1.0, h * 0.12, h * 0.07, 0.2, 0, TAU); ctx.fill();                                      // head
  ctx.strokeStyle = dk; ctx.lineWidth = h * 0.07;
  [[-0.2, 0], [-0.12, Math.PI], [0.16, Math.PI], [0.24, 0]].forEach(([u, off]) => { const sw = Math.sin(ph + off) * h * 0.14; ctx.beginPath(); ctx.moveTo(x + u * L, yb - h * 0.5); ctx.lineTo(x + u * L + sw, yb); ctx.stroke(); });
  if (rider) { ctx.fillStyle = rider; ctx.fillRect(x - L * 0.12, yb - h * 0.95, L * 0.22, h * 0.1); ctx.fillRect(x - L * 0.06, yb - h * 1.2, L * 0.1, h * 0.26); ctx.beginPath(); ctx.arc(x - L * 0.01, yb - h * 1.26, h * 0.07, 0, TAU); ctx.fill(); }
}
function llama(ctx, x, yb, h, c, ph, graze) {
  const L = h * 1.1;
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, yb - h * 0.55, L * 0.36, h * 0.2, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = h * 0.14; ctx.lineCap = 'round';
  const hy = graze ? yb - h * 0.35 : yb - h * 1.02, hx = graze ? x + L * 0.62 : x + L * 0.42;
  ctx.beginPath(); ctx.moveTo(x + L * 0.3, yb - h * 0.62); ctx.quadraticCurveTo(x + L * 0.42, yb - h * 0.8, hx, hy); ctx.stroke();                              // neck
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(hx + L * 0.06, hy, h * 0.12, h * 0.08, graze ? 0.6 : 0.1, 0, TAU); ctx.fill();
  ctx.fillRect(hx + L * 0.02, hy - h * 0.2, h * 0.04, h * 0.14); ctx.fillRect(hx + L * 0.08, hy - h * 0.2, h * 0.04, h * 0.14);                                 // ears
  ctx.lineWidth = h * 0.07;
  [[-0.26, 0], [-0.16, Math.PI], [0.14, Math.PI], [0.26, 0]].forEach(([u, off]) => { const sw = graze ? 0 : Math.sin(ph + off) * h * 0.1; ctx.beginPath(); ctx.moveTo(x + u * L, yb - h * 0.5); ctx.lineTo(x + u * L + sw, yb); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(x - L * 0.34, yb - h * 0.6); ctx.lineTo(x - L * 0.42, yb - h * 0.72); ctx.stroke();                                              // tail
}
function bird(ctx, x, y, s, f) { ctx.beginPath(); ctx.moveTo(x - s, y - f * 0.5); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.5 - f * 0.2, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.5 - f * 0.2, x + s, y - f * 0.5); ctx.stroke(); }
function ship(ctx, x, y, s, c, sail, lamp, t) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.12); ctx.quadraticCurveTo(x, y + s * 0.2, x + s * 0.55, y - s * 0.12); ctx.lineTo(x + s * 0.5, y - s * 0.26); ctx.lineTo(x - s * 0.62, y - s * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - s * 0.02, y - s * 0.95, s * 0.04, s * 0.7);
  ctx.fillStyle = sail; poly(ctx, [[x - s * 0.3, y - s * 0.86], [x + s * 0.3, y - s * 0.86], [x + s * 0.26, y - s * 0.38], [x - s * 0.26, y - s * 0.38]]);
  if (lamp) { ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, x + s * 0.4, y - s * 0.4, s * 0.7, '255,200,110', 0.85 + 0.15 * Math.sin(t * 4 + x)); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#FFE2A0'; ctx.fillRect(x + s * 0.36, y - s * 0.46, s * 0.08, s * 0.1); }
}
const CLOTHES = { old: ['#E8DCC3', '#C8553D', '#3E6B9E', '#D9A441', '#8E9E5A', '#F0E6D2'], now: ['#E04E5A', '#3E7BE0', '#F2C14E', '#6AC46A', '#F08A3C', '#FFFFFF', '#9A5CE0', '#2A2A3A'] };

/* ---------------- what moves ---------------- */
const small = () => view.small;
const LIVE = {
  clouds: { init(S) { const c = S.f.clouds || {}; const n = Math.round((c.n || 6) * (small() ? 0.6 : 1)); return Array.from({ length: n }, () => newCloud(S, c, true)); },
    step(a, S, dt) { a.forEach((q, i) => { q.x += q.v * dt; if (q.x - q.w > S.w) a[i] = newCloud(S, S.f.clouds || {}, false); }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.globalAlpha = q.a; ctx.fillStyle = q.c; q.puffs.forEach(([u, v, r]) => { ctx.beginPath(); ctx.ellipse(q.x + u * q.w, q.y + v * q.h, r * q.w, r * q.h * 1.3, 0, 0, TAU); ctx.fill(); }); }); ctx.globalAlpha = 1; } },
  birds: { init(S) { const b = S.f.birds || {}; return Array.from({ length: Math.round((b.n || 6) * (small() ? 0.6 : 1)) }, (_, i) => newBird(S, b, i, true)); },
    step(a, S, dt) { a.forEach((q, i) => { q.x += q.v * q.dir * dt; q.y += Math.sin(q.t += dt) * 4 * dt; if (q.dir > 0 ? q.x > S.w + 30 : q.x < -30) a[i] = newBird(S, S.f.birds || {}, i, false); }); },
    draw(a, S, ctx, t) { ctx.lineWidth = 2; a.forEach((q) => { ctx.strokeStyle = q.c; ctx.lineWidth = q.s * 0.18; bird(ctx, q.x, q.y, q.s, Math.sin(t * q.fl + q.p) * q.s * 0.6); }); } },
  swifts: { init(S) { return Array.from({ length: small() ? 5 : 9 }, (_, i) => ({ x: rnd(0, S.w), y: rnd(S.top, S.y0 * 0.7), v: rnd(140, 260), dir: Math.random() < 0.5 ? -1 : 1, p: rnd(0, TAU), t: 0 })); },
    step(a, S, dt) { a.forEach((q) => { q.t += dt; q.x += q.v * q.dir * dt; q.y += Math.sin(q.t * 2.2 + q.p) * 60 * dt; if (q.x < -40 || q.x > S.w + 40) { q.dir = -q.dir; q.y = rnd(S.top, S.y0 * 0.7); } }); },
    draw(a, S, ctx, t) { ctx.strokeStyle = 'rgba(30,30,40,.8)'; ctx.lineWidth = 1.6; a.forEach((q) => bird(ctx, q.x, q.y, 7, Math.sin(t * 16 + q.p) * 4)); } },
  condor: { init(S) { return { a: 0, r: Math.min(S.w, S.h) * 0.22, cx: S.cx - S.w * 0.08, cy: S.top + (S.y0 - S.top) * 0.3, swoop: 0 }; },
    step(a, S, dt) { a.a += dt * 0.28; if (a.swoop > 0) a.swoop -= dt; },
    draw(a, S, ctx, t) {
      const sw = a.swoop > 0 ? Math.sin(Math.min(1, (6 - a.swoop) / 6) * Math.PI) : 0;
      const x = a.cx + Math.cos(a.a) * a.r * (1 + sw * 2.2), y = a.cy + Math.sin(a.a * 2) * a.r * 0.18 + sw * S.h * 0.25, s = S.s * (0.9 + sw * 1.4), tilt = Math.cos(a.a) * 0.25;
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.fillStyle = '#1E1A1A';
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.02); ctx.quadraticCurveTo(-s * 0.5, -s * 0.22, 0, -s * 0.06); ctx.quadraticCurveTo(s * 0.5, -s * 0.22, s, -s * 0.02);
      ctx.lineTo(s * 0.86, s * 0.08); ctx.quadraticCurveTo(s * 0.4, s * 0.02, 0, s * 0.14); ctx.quadraticCurveTo(-s * 0.4, s * 0.02, -s * 0.86, s * 0.08); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 5; k++) { [-1, 1].forEach((d) => { ctx.beginPath(); ctx.moveTo(d * s * (0.7 + k * 0.07), -s * 0.03); ctx.lineTo(d * s * (0.84 + k * 0.08), -s * (0.1 + k * 0.045)); ctx.lineTo(d * s * (0.78 + k * 0.07), s * 0.02); ctx.closePath(); ctx.fill(); }); }
      ctx.fillStyle = '#F2EDE4'; ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.14, s * 0.05, 0, 0, TAU); ctx.fill();            // the white collar
      ctx.fillStyle = '#1E1A1A'; ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.08, s * 0.14, 0, 0, TAU); ctx.fill();               // the tail
      ctx.restore();
    } },
  butterflies: { init(S) { return Array.from({ length: small() ? 5 : 9 }, () => ({ x: rnd(0, S.w), y: rnd(S.y0 * 0.6, S.y0 + 20), vx: rnd(-20, 20), vy: rnd(-10, 10), p: rnd(0, TAU), t: 0, c: Math.random() < 0.7 ? '#3F7BE8' : '#F2B33D' })); },
    step(a, S, dt) { a.forEach((q) => { q.t += dt; q.vx += rnd(-60, 60) * dt; q.vy += rnd(-60, 60) * dt; q.vx = clamp(q.vx, -30, 30); q.vy = clamp(q.vy, -25, 25); q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < 0 || q.x > S.w) q.vx = -q.vx; if (q.y < S.y0 * 0.55 || q.y > S.y0 + 30) q.vy = -q.vy; }); },
    draw(a, S, ctx, t) { a.forEach((q) => { const f = Math.abs(Math.sin(t * 11 + q.p)), s = 11; ctx.fillStyle = q.c; [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(q.x + d * s * 0.45 * (0.3 + 0.7 * f), q.y, s * 0.5 * (0.3 + 0.7 * f), s * 0.42, 0, 0, TAU); ctx.fill(); }); }); } },
  dust: { init(S) { return Array.from({ length: small() ? 36 : 70 }, () => ({ x: rnd(0, S.w), y: rnd(S.top, S.h), r: rnd(0.6, 2), vx: rnd(10, 28), p: rnd(0, TAU), a: rnd(0.15, 0.5) })); },
    step(a, S, dt, t) { a.forEach((q) => { q.x += q.vx * dt; q.y += Math.sin(t + q.p) * 7 * dt; if (q.x > S.w + 4) { q.x = -4; q.y = rnd(S.top, S.h); } }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.fillStyle = 'rgba(255,230,180,' + q.a + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }); } },
  motes: { init(S) { return Array.from({ length: small() ? 30 : 60 }, () => ({ x: rnd(0, S.w), y: rnd(S.top, S.h), r: rnd(0.8, 2.2), p: rnd(0, TAU), s: rnd(0.5, 1.4) })); },
    step(a, S, dt, t) { a.forEach((q) => { q.x += Math.sin(t * 0.7 + q.p) * 6 * dt; q.y -= 5 * dt; if (q.y < S.top) q.y = S.h; }); },
    draw(a, S, ctx, t) { ctx.globalCompositeOperation = 'lighter'; a.forEach((q) => dotGlow(ctx, q.x, q.y, q.r * 3, '255,220,160', 0.25 + 0.3 * Math.max(0, Math.sin(t * q.s + q.p)))); ctx.globalCompositeOperation = 'source-over'; } },
  shimmer: { init() { return [0]; }, step() {},
    draw(a, S, ctx, t) { ctx.strokeStyle = 'rgba(255,245,220,.16)'; ctx.lineWidth = 1.2; for (let k = 0; k < 10; k++) { const y = S.y0 - 6 - k * 5, x = S.cx + Math.sin(t * 1.1 + k * 1.7) * 26, L = S.w * (0.08 + k * 0.012); ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.stroke(); } } },
  mist: { init(S) { const m = S.f.mist || {}; return Array.from({ length: Math.round((m.n || 9) * (small() ? 0.7 : 1)) }, () => ({ x: rnd(-0.2, 1.1) * S.w, y: S.y0 + (m.y0 == null ? -0.15 : m.y0) * S.h + rnd(0, (m.span || 0.4) * S.h), r: rnd(0.18, 0.4) * Math.max(S.w, S.h), vx: rnd(5, 14), a: rnd(0.06, m.a || 0.14) })); },
    step(a, S, dt) { a.forEach((q) => { q.x += q.vx * dt; if (q.x - q.r > S.w) q.x = -q.r; }); },
    draw(a, S, ctx) { ctx.globalCompositeOperation = 'lighter'; a.forEach((q) => { const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r); gr.addColorStop(0, 'rgba(235,242,250,' + q.a + ')'); gr.addColorStop(1, 'rgba(235,242,250,0)'); ctx.fillStyle = gr; ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }); ctx.globalCompositeOperation = 'source-over'; } },
  rays: { init() { return [0]; }, step() {},
    draw(a, S, ctx, t) {
      const r = S.f.rays || {}, ox = (r.x == null ? 0.12 : r.x) * S.w, oy = (r.y == null ? -0.08 : r.y) * S.h, a0 = r.a == null ? 0.45 : r.a, col = r.c || '255,236,190';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(ox, oy);
      for (let k = 0; k < 5; k++) {
        const ang = a0 + k * 0.17 + Math.sin(t * 0.15 + k) * 0.03, L = Math.hypot(S.w, S.h) * 1.2, sp = 0.05 + (k % 2) * 0.025;
        const gr = ctx.createLinearGradient(0, 0, Math.cos(ang) * L, Math.sin(ang) * L); gr.addColorStop(0, 'rgba(' + col + ',' + (r.k || 0.16) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - sp) * L, Math.sin(ang - sp) * L); ctx.lineTo(Math.cos(ang + sp) * L, Math.sin(ang + sp) * L); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } },
  waves: { init(S) { return { b: S.f.sea(S) }; }, step() {},
    draw(a, S, ctx, t) {
      const b = S.f.sea(S), n = b.far ? 7 : 11, col = b.c || '255,255,255';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n, y = b.y0 + (b.y1 - b.y0) * u, amp = (b.far ? 1 : 1.5) + u * 2.5, L = 40 + u * 50;
        ctx.strokeStyle = 'rgba(' + col + ',' + (0.1 + u * 0.22) + ')'; ctx.beginPath();
        for (let x = (b.x0 || 0); x <= (b.x1 || S.w); x += 8) { const yy = y + Math.sin(x / L + t * (0.8 + u) + k) * amp; if (x === (b.x0 || 0)) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.stroke();
      }
    } },
  glitter: { init(S) { const g2 = S.f.glitter(S); return Array.from({ length: small() ? 30 : 60 }, () => ({ x: g2.x + rnd(-1, 1) * g2.w, y: rnd(g2.y0, g2.y1), p: rnd(0, TAU), s: rnd(1.5, 4), v: rnd(2, 5) })); },
    step(a, S, dt) { const g2 = S.f.glitter(S); a.forEach((q) => { q.x += Math.sin(q.p) * 3 * dt; if (q.x < g2.x - g2.w || q.x > g2.x + g2.w) q.x = g2.x + rnd(-1, 1) * g2.w; }); },
    draw(a, S, ctx, t) { const g2 = S.f.glitter(S); ctx.globalCompositeOperation = 'lighter'; a.forEach((q) => { const k = Math.max(0, Math.sin(t * q.v + q.p)); if (k > 0.1) dotGlow(ctx, q.x, q.y, q.s * 2.4, g2.c || '255,220,160', k * 0.7); }); ctx.globalCompositeOperation = 'source-over'; } },
  ships: { init(S) { const b = S.f.sea(S); return Array.from({ length: b.ships || 3 }, (_, i) => newShip(S, b, i, true)); },
    step(a, S, dt) { const b = S.f.sea(S); a.forEach((q, i) => { q.x += q.v * q.dir * dt; q.t += dt; if (q.dir > 0 ? q.x > (b.x1 || S.w) + 60 : q.x < shipX0(b) - 60) a[i] = newShip(S, b, i, false); }); },
    draw(a, S, ctx, t) { const b = S.f.sea(S); a.slice().sort((p, q) => p.y - q.y).forEach((q) => { ctx.save(); ctx.translate(q.x, q.y + Math.sin(q.t * 1.3) * q.s * 0.05); if (q.dir < 0) ctx.scale(-1, 1); ship(ctx, 0, 0, q.s, b.hull || '#3A2A1E', b.sail || '#EFE6D0', b.night, t); ctx.restore(); }); } },
  camels: { init(S) { const c = S.f.camels || {}; const n = c.n || 3; return { x: S.w + 60, n, t: 0, v: 18 * (S.w / 1200), gap: S.s * 0.95, rider: c.rider }; },
    step(a, S, dt) { a.t += dt; a.x -= a.v * dt; if (a.x < -a.gap * (a.n + 1)) a.x = S.w + 60; },
    draw(a, S, ctx) { const c = S.f.camels || {}, h = S.s * (c.h || 0.55), y = S.y0 + (c.y == null ? 0.08 : c.y) * S.h; ctx.save(); for (let i = 0; i < a.n; i++) { const x = a.x + i * a.gap; ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); camel(ctx, 0, y, h, '#B98A52', a.t * 4 + i, i === 0 ? '#C8553D' : (i === a.n - 1 ? '#3E6B9E' : null)); ctx.restore(); } ctx.restore(); } },
  llamas: { init(S) { const L = S.f.llamas || {}; return (L.at || [[0.56, 0.02], [0.66, 0.04], [0.74, 0.01]]).map(([u, v], i) => ({ u, v, t: rnd(0, 10), graze: i % 2 === 0, next: rnd(3, 8) })); },
    step(a, S, dt) { a.forEach((q) => { q.t += dt; q.next -= dt; if (q.next <= 0) { q.graze = !q.graze; q.next = rnd(3, 9); } }); },
    draw(a, S, ctx) { a.forEach((q) => llama(ctx, q.u * S.w, S.y0 + q.v * S.h, S.s * 0.42, ['#E9DECB', '#8A5B36', '#F3EFE6'][Math.round(q.u * 10) % 3], q.t * 3, q.graze)); } },
  people: { init(S) { const out = []; (S.f.people || []).forEach((line, li) => { const n = Math.round((line.n || 6) * (small() ? 0.6 : 1)); for (let i = 0; i < n; i++) out.push({ li, x: rnd(line.x[0], line.x[1]), dir: Math.random() < 0.5 ? -1 : 1, v: rnd(0.7, 1.3), t: rnd(0, 10), c: (line.cols || CLOTHES.old)[i % (line.cols || CLOTHES.old).length], wait: 0 }); }); return out; },
    step(a, S, dt) { a.forEach((q) => { const line = S.f.people[q.li]; if (q.wait > 0) { q.wait -= dt; return; } q.t += dt; q.x += q.v * q.dir * dt; if (q.x < line.x[0] || q.x > line.x[1]) { q.dir = -q.dir; q.x = clamp(q.x, line.x[0], line.x[1]); } if (Math.random() < dt * 0.04) q.wait = rnd(1, 4); }); },
    draw(a, S, ctx) { a.forEach((q) => { const line = S.f.people[q.li], h = Math.max(4, 1.7 * S.k * (line.scale || 1)); figure(ctx, S.px(q.x), S.py(line.y || 0), h, q.c, q.wait > 0 ? 0 : q.t * 7, q.dir); }); } },
  fires: { init() { return [0]; }, step() {}, draw(a, S, ctx, t) { S.f.fires(S).forEach((p, i) => flame(ctx, p.x, p.y, p.s * (S.blaze > 0 && !p.still ? 1 + 0.8 * Math.sin(Math.min(1, S.blaze / 5) * Math.PI) : 1), t, i * 1.7)); } },
  embers: { init(S) { return Array.from({ length: 40 }, () => newEmber(S, true)); },
    step(a, S, dt) { a.forEach((q, i) => { q.y -= q.v * dt; q.x += q.vx * dt; q.l -= dt * 0.5; if (q.l <= 0) a[i] = newEmber(S, false); }); },
    draw(a, S, ctx) { ctx.globalCompositeOperation = 'lighter'; a.forEach((q) => dotGlow(ctx, q.x, q.y, 5, '255,170,70', Math.max(0, q.l))); ctx.globalCompositeOperation = 'source-over'; } },
  beam: { init() { return [0]; }, step() {},
    draw(a, S, ctx, t) {
      const b = S.f.beam(S), L = Math.hypot(S.w, S.h), k = S.blaze > 0 ? 1.6 : 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(b.x, b.y);
      [0, Math.PI].forEach((off) => {
        const ang = t * 0.45 + off, dir = Math.sin(ang), sp = 0.06, vis = 0.25 + 0.75 * Math.max(0, Math.cos(ang - Math.PI / 2));
        const a2 = Math.PI * 0.5 - dir * 1.25;
        const gr = ctx.createLinearGradient(0, 0, Math.cos(a2) * L, Math.sin(a2) * L); gr.addColorStop(0, 'rgba(255,220,150,' + (0.4 * vis * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a2 - sp) * L, Math.sin(a2 - sp) * L); ctx.lineTo(Math.cos(a2 + sp) * L, Math.sin(a2 + sp) * L); ctx.closePath(); ctx.fill();
      });
      dotGlow(ctx, 0, 0, S.s * (1.6 + 0.2 * Math.sin(t * 9)) * k, '255,190,90', 0.8);
      ctx.restore();
    } },
  smoke: { init(S) { return []; },
    step(a, S, dt) { S.f.smoke(S).forEach((p) => { if (Math.random() < dt * (p.rate || 6)) a.push({ x: p.x + rnd(-p.s, p.s) * 0.3, y: p.y, r: p.s * 0.5, v: rnd(14, 26), vx: rnd(-4, 10), l: 1, d: rnd(2.5, 4.5), c: p.c || '120,120,130' }); }); a.forEach((q) => { q.y -= q.v * dt; q.x += q.vx * dt; q.r += 9 * dt; q.l -= dt / q.d; }); for (let i = a.length - 1; i >= 0; i--) if (a[i].l <= 0) a.splice(i, 1); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.fillStyle = 'rgba(' + q.c + ',' + (0.28 * Math.max(0, q.l)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }); } },
  flag: { init() { return [0]; }, step() {},
    draw(a, S, ctx, t) {
      const f = S.f.flag(S), seg = 8, L = f.h * 1.4;
      ctx.fillStyle = '#4A3A2A'; ctx.fillRect(f.x - 1, f.y - f.h * 1.6, 2, f.h * 1.6);
      ctx.fillStyle = f.c; ctx.beginPath(); ctx.moveTo(f.x, f.y - f.h * 1.6);
      for (let i = 0; i <= seg; i++) ctx.lineTo(f.x + i / seg * L, f.y - f.h * 1.6 + Math.sin(t * 6 - i * 0.9) * f.h * 0.08 * (i / seg));
      for (let i = seg; i >= 0; i--) ctx.lineTo(f.x + i / seg * L, f.y - f.h * 0.95 + Math.sin(t * 6 - i * 0.9) * f.h * 0.08 * (i / seg));
      ctx.closePath(); ctx.fill();
      if (f.c2) { ctx.fillStyle = f.c2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(f.x + L * (0.25 + i * 0.25), f.y - f.h * 1.27 + Math.sin(t * 6 - (0.25 + i * 0.25) * seg * 0.9) * f.h * 0.08 * (0.25 + i * 0.25), f.h * 0.07, 0, TAU); ctx.fill(); } }
    } },
  leaves: { init(S) { return Array.from({ length: small() ? 12 : 22 }, () => ({ x: rnd(0, S.w), y: rnd(-S.h, S.h), s: rnd(4, 8), v: rnd(25, 55), r: rnd(0, TAU), vr: rnd(-2, 2), p: rnd(0, TAU), c: (S.f.leafCols || ['#5E8C31', '#7FA843', '#C08A2B'])[Math.floor(rnd(0, 3))] })); },
    step(a, S, dt, t) { a.forEach((q) => { q.y += q.v * dt; q.x += Math.sin(t * 1.3 + q.p) * 28 * dt; q.r += q.vr * dt; if (q.y > S.h + 20) { q.y = -20; q.x = rnd(0, S.w); } }); },
    draw(a, S, ctx) { a.forEach((q) => { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.c; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(0, 0, q.s, q.s * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore(); }); } },
  flow: { init() { return { t: 0 }; }, step(a, S, dt) { a.t += dt; },
    draw(a, S, ctx) {
      S.f.flow(S).forEach((f) => {
        ctx.strokeStyle = 'rgba(225,245,255,.55)'; ctx.lineWidth = Math.max(1, f.w * 0.3); ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) { const ph = (a.t * 1.6 + k * 0.25) % 1, y = f.y0 + (f.y1 - f.y0) * ph; ctx.globalAlpha = 0.6 * Math.sin(ph * Math.PI); ctx.beginPath(); ctx.moveTo(f.x + (k - 1.5) * f.w * 0.3, y); ctx.lineTo(f.x + (k - 1.5) * f.w * 0.3, y + f.w * 0.9); ctx.stroke(); }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, f.x, f.y1, f.w * 1.6, '220,240,255', 0.3 + 0.1 * Math.sin(a.t * 7)); ctx.globalCompositeOperation = 'source-over';
      });
    } }
};
function newCloud(S, c, any) {
  const band = [S.top + (c.y0 == null ? 0 : c.y0 * S.h), (c.y1 == null ? S.top + (S.y0 - S.top) * 0.36 : S.y0 + c.y1 * S.h)];
  const w = rnd(0.1, 0.2) * S.w * (c.s || 1), h = w * 0.32;
  return { x: any ? rnd(-w, S.w) : -w, y: rnd(band[0], band[1]), w, h, v: rnd(5, 12), a: c.a || 0.82, c: c.c || '#FFFFFF', puffs: [[0.2, 0.55, 0.22], [0.42, 0.3, 0.3], [0.65, 0.45, 0.26], [0.82, 0.62, 0.18], [0.5, 0.7, 0.34]] };
}
function newBird(S, b, i, any) {
  const dir = Math.random() < 0.5 ? -1 : 1, s = rnd(6, 11) * (b.scale || 1);
  return { x: any ? rnd(0, S.w) : (dir > 0 ? -30 : S.w + 30), y: S.top + rnd(0.05, b.low ? 0.75 : 0.45) * (S.y0 - S.top), v: rnd(25, 55), dir, s, fl: rnd(5, 8), p: i, t: 0, c: b.c || 'rgba(40,40,60,.78)' };
}
function newShip(S, b, i, any) {
  const dir = Math.random() < 0.5 ? -1 : 1, u = rnd(0.1, 0.9), y = b.y0 + (b.y1 - b.y0) * u, s = (b.s || S.s * 0.5) * (0.35 + u * 0.65);
  return { x: any ? rnd(shipX0(b), b.x1 || S.w) : (dir > 0 ? shipX0(b) - 50 : (b.x1 || S.w) + 50), y, s, v: rnd(5, 12) * (0.4 + u), dir, t: rnd(0, 10) };
}
const shipX0 = (b) => (b.sx0 != null ? b.sx0 : b.x0 || 0);
function newEmber(S, any) { const p = S.f.fires(S)[0]; return { x: p.x + rnd(-1, 1) * p.s * 0.4, y: any ? p.y - rnd(0, S.h * 0.3) : p.y - p.s * 0.5, v: rnd(30, 80), vx: rnd(-10, 10), l: rnd(0.4, 1) }; }

/* ---------------- the wonders ---------------- */
const W = {};
export const WONDER_SCENES = W;
/* ---- the ancient seven: drawn as they might have looked when they were new ---- */
W.giza = {
  size: [300, 150], wide: 0.72, horizon: 0.1,
  sky: ['#1E5AA8', '#5B9FDC', '#B7D6EE', '#F1DDB2'], light: () => ({ sun: { x: 0.7, y: 0.14, disc: 0.028 } }),
  sound: 'wind', music: 'oud', live: ['dust', 'shimmer', 'birds', 'people', 'camels'], tap: 'casing', birds: { n: 3 }, camels: { n: 4, rider: true },
  people: [{ y: 0, x: [-120, 70], n: 10 }],
  say: { kind: 'Great Pyramid of Giza', text: 'When it was new, the pyramid was covered in smooth, polished white limestone that shone in the sun, with a tip of gold. Most of the casing was taken away hundreds of years ago to build Cairo.' },
  far(g, S) {
    const w = S.w, h = S.h;
    hills(g, w, S.y0 - h * 0.06, S.s * 0.55, '#E9D6AE', 11); hills(g, w, S.y0 - h * 0.02, S.s * 0.4, '#DEC28F', 12);
    ground(g, w, h, S.y0, '#D7B781');
  },
  mon(g, S) {
    pyramid(g, -352, 100, 46, '#E9CFA0', '#CDB07E', 0); pyramid(g, -262, 246, 112, '#E6C894', '#C4A06A', 7);
    pyramid(g, -40, 300, 139, '#E2BE84', '#B48A52', 6);
    sphinx(g, 22, -5, 73, 20, '#C9A464');
  },
  near(g, S) {
    g.strokeStyle = 'rgba(80,50,10,.08)'; g.lineWidth = 1.5;
    for (let k = 0; k < 14; k++) { const y = S.y0 + 8 + k * (S.h - S.y0) / 14; g.beginPath(); for (let x = 0; x <= S.w; x += 12) { const yy = y + Math.sin(x / 60 + k) * 3; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
  }
};
W.babylon = {
  size: [130, 62], wide: 0.56, horizon: 0.12,
  sky: ['#2A64B0', '#79B4E6', '#D8E6EE', '#F7E2B8'], light: () => ({ sun: { x: 0.2, y: 0.14, disc: 0.025 } }),
  sound: 'river', music: 'lyre', live: ['clouds', 'birds', 'leaves', 'flow', 'people', 'waves'], tap: 'splash', clouds: { n: 3, s: 0.8 }, birds: { n: 5 }, leafCols: ['#F7C9D4', '#FFE8B8', '#FFFFFF'],
  people: [{ y: 2, x: [-70, 70], n: 6 }, { y: 12, x: [-50, 50], n: 4 }, { y: 32, x: [-28, 28], n: 3 }],
  say: { kind: 'Hanging Gardens of Babylon', text: 'If the gardens were real, water had to be lifted all the way to the top from the river. Some experts think a giant screw, turned round and round, carried it up.' },
  sea: (S) => ({ y0: S.y0 + 12, y1: S.h, c: '220,240,255' }),
  water: (S) => ({ x0: 0, x1: S.w, y: S.y0 + 10, a: 0.28, c: '70,110,150' }),
  flow: (S) => [{ x: S.px(26), y0: S.py(50), y1: S.py(2), w: S.k * 2.4 }, { x: S.px(-34), y0: S.py(30), y1: S.py(2), w: S.k * 1.8 }],
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0;
    hills(g, w, y0 - h * 0.07, S.s * 0.3, '#C7B98E', 21);
    g.fillStyle = '#A5784E'; g.fillRect(0, y0 - S.k * 14, w, S.k * 14);                                                                   // the city walls
    g.fillStyle = '#8E653F'; for (let x = 0; x < w; x += S.k * 6) g.fillRect(x, y0 - S.k * 15.6, S.k * 3, S.k * 1.6);
    [-150, -118, 118, 150].forEach((xm) => { g.fillStyle = '#9A6E45'; g.fillRect(S.px(xm) - S.k * 4, y0 - S.k * 19, S.k * 8, S.k * 19); });
    const gx = S.px(54), gw = S.k * 20, gh = S.k * 22;                                                                                    // the Ishtar Gate, blue glazed brick
    g.fillStyle = '#2C5AA8'; g.fillRect(gx - gw / 2, y0 - gh, gw, gh); g.fillRect(gx - gw * 0.72, y0 - gh * 1.15, gw * 0.3, gh * 1.15); g.fillRect(gx + gw * 0.42, y0 - gh * 1.15, gw * 0.3, gh * 1.15);
    g.fillStyle = '#1B2D55'; g.fillRect(gx - gw * 0.18, y0 - gh * 0.55, gw * 0.36, gh * 0.55); g.beginPath(); g.arc(gx, y0 - gh * 0.55, gw * 0.18, Math.PI, 0); g.fill();
    g.fillStyle = '#E8C45A'; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillRect(gx - gw * 0.4 + c * gw * 0.22, y0 - gh * (0.9 - r * 0.14), gw * 0.07, gh * 0.05);
    [[-0.08, 1.4], [0.02, 1.1], [0.9, 1.5], [0.98, 1.2]].forEach(([u, k]) => palm(g, w * u, y0 - S.k * 2, S.s * k * 1.6, '#3E6B3A', u < 0.5 ? 1 : -1));
    g.fillStyle = '#B99B6A'; g.fillRect(0, y0, w, 10);                                                                                   // the river bank
    const gr = g.createLinearGradient(0, y0 + 10, 0, h); gr.addColorStop(0, '#5C8DB8'); gr.addColorStop(1, '#2E5478'); g.fillStyle = gr; g.fillRect(0, y0 + 10, w, h - y0);
  },
  mon(g, S, ph, R) {
    const widths = [120, 96, 74, 54, 36], greens = ['#3E7A3A', '#5B9A44', '#7DB35A', '#2F6530'];
    g.fillStyle = '#B08357'; rect(g, -66, 0, 132, 2);
    for (let i = 0; i < 5; i++) {
      const wd = widths[i], y = 2 + i * 10;
      box(g, -wd / 2, y, wd, 10, '#C19463', 7, 3.5);
      g.strokeStyle = 'rgba(80,50,20,.12)'; for (let yy = y + 1.2; yy < y + 10; yy += 1.2) hline(g, -wd / 2, wd / 2, yy, 0.18);
      for (let x = -wd / 2 + 2; x < wd / 2 - 1; x += 4.2) {                                                                              // the gardens spilling over each terrace
        const r = 2.2 + R() * 1.6; g.fillStyle = greens[Math.floor(R() * 4)]; g.beginPath(); g.ellipse(x, y + 10 + r * 0.5, r, r * 0.8, 0, 0, TAU); g.fill();
        if (R() < 0.6) { g.strokeStyle = '#4E8A3C'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x, y + 10); g.quadraticCurveTo(x + 0.6, y + 6, x - 0.4 + R(), y + 10 - 3 - R() * 5); g.stroke(); }
      }
      for (let x = -wd / 2 + 6; x < wd / 2 - 4; x += 9 + R() * 6) { if (R() < 0.5) pxIn(g, S, x, y + 10, (q) => palm(q, 0, 0, (7 + R() * 3) * S.k, '#2F6B32', R() < 0.5 ? 1 : -1)); else pxIn(g, S, x, y + 10, (q) => cypress(q, 0, 0, (7 + R() * 4) * S.k, '#255A2C')); }
    }
    g.fillStyle = '#D5B07C'; rect(g, -5, 2, 10, 50); g.strokeStyle = 'rgba(80,50,20,.25)'; for (let yy = 3; yy < 52; yy += 1) hline(g, -5, 5, yy, 0.15);   // the great stair
    g.fillStyle = '#B98F5E'; rect(g, -7, 52, 14, 8); g.fillStyle = '#5A3A22'; rect(g, -1.5, 52, 3, 5); g.fillStyle = '#C9A26E'; rect(g, -8, 60, 16, 1);        // the shrine on top
    pxIn(g, S, 10, 61, (q) => tree(q, 0, 0, 10 * S.k, '#3E7A3A')); pxIn(g, S, -10, 61, (q) => tree(q, 0, 0, 9 * S.k, '#2F6530'));
    g.fillStyle = 'rgba(200,235,255,.55)'; rect(g, 24.8, 2, 2.4, 48); rect(g, -34.9, 2, 1.8, 28);                                        // the waterfalls
  }
};
W.artemis = {
  size: [120, 34], wide: 0.78, horizon: 0.1,
  sky: ['#3B74C2', '#86BCEB', '#D8E8F2', '#F7E8C6'], light: () => ({ sun: { x: 0.22, y: 0.14, disc: 0.025 } }),
  sound: 'birds', music: 'lyre', live: ['clouds', 'birds', 'smoke', 'fires', 'people'], tap: 'doves', clouds: { n: 5 }, birds: { n: 4 },
  people: [{ y: 0, x: [-60, 60], n: 9 }],
  say: { kind: 'Temple of Artemis', text: 'Artemis was the Greek goddess of hunting, wild animals and the Moon. Her temple was about three times the size of the Parthenon in Athens, and people came from all over the Greek world to see it.' },
  fires: (S) => [{ x: S.px(0), y: S.py(-3), s: S.k * 1.6 }],
  smoke: (S) => [{ x: S.px(0), y: S.py(-1.5), s: S.k * 1.6, rate: 4, c: '200,200,210' }],
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0;
    hills(g, w, y0 - h * 0.1, S.s * 0.9, '#8FA37A', 31); hills(g, w, y0 - h * 0.05, S.s * 0.5, '#A4B382', 32);
    for (let u = 0.02; u < 1; u += 0.07) if ((u * 100 | 0) % 3) cypress(g, w * u, y0 - h * 0.05 + 2, S.s * (0.6 + (u * 7 % 1) * 0.5), '#3E6B3A');
    ground(g, w, h, y0, '#D8CDB4');
  },
  mon(g, S) {
    const m = '#EDE3D2';
    steps(g, 0, 0, 74, 3, 0.9, '#E6DCC8');
    for (let i = 0; i < 9; i++) { const u = i / 8, x = 33.5 + i * 5.3 * (1 - u * 0.35), hgt = 18 - i * 1.3, y = 2.7 + i * 0.25; column(g, x, y, hgt, 1.7 - u * 0.5, '#CFC3AA', 'ionic'); }   // the side colonnade, going away
    g.fillStyle = '#D9CFB8'; poly(g, [[33, 20.7], [73, 12.6], [73, 14.2], [33, 24]]);
    for (let i = 0; i < 7; i++) column(g, -24 + i * 8, 2.9, 17.6, 1.7, '#D4C8AF', 'ionic');                                            // the second row, behind
    colonnade(g, -28, 28, 8, 2.7, 18, 1.9, m, 'ionic');
    entablature(g, -33, 33, 20.7, 3.3, '#EAE1CD', ['#B23A2E', '#2E4C9A', '#E8D9B5']);
    pediment(g, -33, 33, 24, 7.5, m, '#D6C8AC');
    g.fillStyle = '#5A4A3A';                                                                                                           // the carved figures in the gable
    [[0, 3.6], [-7, 2.4], [7, 2.4], [-13, 1.4], [13, 1.4]].forEach(([x, hgt]) => { rect(g, x - hgt * 0.22, 24.9, hgt * 0.44, hgt * 0.7); disc(g, x, 24.9 + hgt * 0.84, hgt * 0.14); });
    g.fillStyle = m; [[-33.5, 24.6], [33.5, 24.6], [0, 31.5]].forEach(([x, y]) => { for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(x + k * 0.45, y + 1.2, 0.3, 1.1, k * 0.35, 0, TAU); g.fill(); } });   // palmettes
    g.fillStyle = '#8E8577'; rect(g, -3, -6, 6, 2); g.fillStyle = '#6E655A'; rect(g, -2.4, -4, 4.8, 0.8);                                 // the altar outside
  }
};
W.zeus = {
  size: [25, 22], horizon: 0,
  sky: ['#1E1610', '#2E2218', '#45321F', '#5A4228'],
  sound: 'wind', music: 'lyre', live: ['rays', 'motes', 'fires', 'smoke', 'people'], tap: 'lightning', rays: { x: -0.05, y: -0.1, a: 0.55, k: 0.1 },
  people: [{ y: 0, x: [-9, 9], n: 4 }],
  say: { kind: 'Statue of Zeus', text: 'Zeus was the king of the Greek gods and the god of the sky and thunder. The sculptor Phidias made the statue from ivory and gold over a wooden frame. Oil was kept in a pool in front of it to stop the ivory cracking.' },
  fires: (S) => [{ x: S.px(-8), y: S.py(2.6), s: S.k * 0.9 }, { x: S.px(8), y: S.py(2.6), s: S.k * 0.9 }],
  smoke: (S) => [{ x: S.px(-8), y: S.py(3.2), s: S.k * 0.5, rate: 2, c: '90,80,70' }, { x: S.px(8), y: S.py(3.2), s: S.k * 0.5, rate: 2, c: '90,80,70' }],
  far(g, S) {
    const gr = g.createRadialGradient(S.px(0), S.py(8), 0, S.px(0), S.py(8), S.k * 20); gr.addColorStop(0, 'rgba(255,200,110,.6)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S.w, S.h);
    const top = g.createLinearGradient(0, S.py(24), 0, S.py(18)); top.addColorStop(0, 'rgba(10,6,4,.9)'); top.addColorStop(1, 'rgba(10,6,4,0)'); g.fillStyle = top; g.fillRect(0, 0, S.w, S.py(18));   // the roof beams, lost in the dark
  },
  mon(g, S) {
    const gold = '#D9A930', gdk = '#9C7414', iv = '#F3E6CF', ivd = '#D9C6A5';
    g.fillStyle = '#6E5E4C'; rect(g, -60, -9, 120, 9); g.strokeStyle = 'rgba(0,0,0,.25)'; for (let x = -60; x <= 60; x += 4) { g.lineWidth = 0.12; g.beginPath(); g.moveTo(x, -9); g.lineTo(x * 1.6, 0); g.stroke(); }   // the marble floor
    for (let i = 3; i >= 0; i--) { const x = 11.8 - i * 1.6, y = i * 0.9, hgt = 12.5 - i * 1.2, d = 1.5 - i * 0.2, c = tint('#9C8A70', -0.12 * i); [-1, 1].forEach((s) => { column(g, s * x, y, hgt, d, c, 'doric'); column(g, s * x, y + hgt + 0.9, hgt * 0.55, d * 0.75, c, 'doric'); g.fillStyle = tint(c, -0.1); rect(g, s * x - d * 1.2, y + hgt, d * 2.4, 0.9); }); }   // two storeys of columns, going back
    g.fillStyle = '#2A1E16'; g.beginPath(); g.ellipse(0, -3.6, 8.5, 1.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,220,140,.35)'; g.beginPath(); g.ellipse(-1, -3.4, 3.5, 0.5, 0, 0, TAU); g.fill();   // the pool of oil
    g.fillStyle = '#3A3028'; rect(g, -6, 0, 12, 1.2); g.fillStyle = '#2A2018'; rect(g, -5.4, 1.2, 10.8, 0.4);
    const tg = g.createLinearGradient(-4, 0, 4, 0); tg.addColorStop(0, gdk); tg.addColorStop(0.5, gold); tg.addColorStop(1, gdk);
    g.fillStyle = tg; rect(g, -3.8, 1.6, 7.6, 10.2); rect(g, -4.6, 1.6, 1, 4.2); rect(g, 3.6, 1.6, 1, 4.2); rect(g, -4.6, 4.9, 9.2, 0.7);          // the throne
    g.fillStyle = '#2A1E14'; for (let k = 0; k < 4; k++) rect(g, -3, 6.4 + k * 1.2, 6, 0.4);
    g.fillStyle = gold; rect(g, -3.2, 0.6, 6.4, 0.6);                                                                                     // the footstool
    g.fillStyle = iv; rect(g, -2.7, 1.2, 1.2, 3.6); rect(g, 1.5, 1.2, 1.2, 3.6); poly(g, [[-3.2, 1.2], [-1.3, 1.2], [-1.3, 0.6], [-3.4, 0.6]]); poly(g, [[1.3, 1.2], [3.2, 1.2], [3.4, 0.6], [1.3, 0.6]]);
    g.fillStyle = gold; poly(g, [[-3.3, 4.3], [3.3, 4.3], [3.1, 6.2], [-3.1, 6.2]]); poly(g, [[-3.1, 4.5], [-3.3, 1.5], [3.3, 1.5], [3.1, 4.5]]);   // the golden robe over his legs
    g.fillStyle = tint(gold, 0.25); for (let k = 0; k < 6; k++) disc(g, -2.4 + k * 0.95, 2.6 + (k % 2) * 1.2, 0.18);
    const bg = g.createLinearGradient(-2.4, 0, 2.4, 0); bg.addColorStop(0, ivd); bg.addColorStop(0.5, iv); bg.addColorStop(1, ivd);
    g.fillStyle = bg; poly(g, [[-2.5, 6.2], [2.5, 6.2], [2.3, 10], [-2.3, 10]]);                                                            // the chest
    g.fillStyle = gold; poly(g, [[-2.6, 6.2], [-2.9, 10.2], [-0.8, 10.2], [0.1, 6.2]]);                                                     // the robe over his left shoulder
    g.strokeStyle = ivd; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(-2.4, 9.6); g.lineTo(-4.6, 7.9); g.stroke(); g.beginPath(); g.moveTo(2.4, 9.6); g.lineTo(3.5, 7.4); g.stroke();   // the arms
    g.fillStyle = gold; rect(g, 3.35, 1.2, 0.4, 11.4); g.fillStyle = '#4A3A2A'; disc(g, 3.55, 13, 0.55); poly(g, [[2.6, 13], [3.55, 13.6], [4.5, 13]]);   // the sceptre with an eagle
    g.fillStyle = gold; rect(g, -5.2, 7.9, 1.2, 0.4); rect(g, -4.9, 8.3, 0.5, 1.5); disc(g, -4.65, 10.1, 0.3); poly(g, [[-4.9, 9.2], [-5.9, 10.2], [-5.1, 9.9]]); poly(g, [[-4.4, 9.2], [-3.4, 10.2], [-4.2, 9.9]]);   // Nike, the goddess of victory, in his hand
    g.fillStyle = iv; g.beginPath(); g.ellipse(0, 10.95, 0.95, 1.15, 0, 0, TAU); g.fill();                                                 // the head
    g.fillStyle = gold; poly(g, [[-0.95, 10.9], [0.95, 10.9], [0.6, 9.4], [0, 9.0], [-0.6, 9.4]]); g.beginPath(); g.arc(0, 11.3, 1.0, 0.1, Math.PI - 0.1); g.fill();   // beard and hair
    g.fillStyle = '#5A8A3A'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(k * 0.3, 12.05 - Math.abs(k) * 0.05, 0.2, 0.09, k * 0.3, 0, TAU); g.fill(); }   // the olive wreath
    g.fillStyle = '#2A1E14'; rect(g, -0.45, 11.05, 0.22, 0.18); rect(g, 0.23, 11.05, 0.22, 0.18);
    g.fillStyle = '#4A3A2A'; [-8, 8].forEach((x) => { rect(g, x - 0.12, 0, 0.24, 2.2); rect(g, x - 1.1, 0, 0.2, 0.9); rect(g, x + 0.9, 0, 0.2, 0.9); rect(g, x - 0.9, 2.1, 1.8, 0.5); });   // the lamp tripods
  }
};
W.mausoleum = {
  size: [60, 50], horizon: 0.14,
  sky: ['#2A66B5', '#6DAEE6', '#BFDCF0', '#EFE2C8'], light: () => ({ sun: { x: 0.2, y: 0.13, disc: 0.025 } }),
  sound: 'ocean', music: 'lyre', live: ['clouds', 'waves', 'ships', 'birds', 'people'], tap: 'gulls', clouds: { n: 4, s: 0.8 }, birds: { n: 5, c: 'rgba(255,255,255,.9)', low: true },
  people: [{ y: 0, x: [-40, 40], n: 8 }],
  say: { kind: 'Mausoleum at Halicarnassus', text: 'King Mausolus’s wife, Queen Artemisia, finished the tomb after he died. It was so grand that the word “mausoleum” now means any great tomb. Earthquakes brought it down in the Middle Ages.' },
  sea: (S) => ({ y0: S.hor, y1: S.y0 - S.h * 0.05, far: true, ships: 3, s: S.s * 0.35 }),
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0, R = seeded(5);
    hills(g, w, S.hor + 2, S.s * 0.9, '#7E93AE', 41);
    const gr = g.createLinearGradient(0, S.hor, 0, y0); gr.addColorStop(0, '#4E8BBF'); gr.addColorStop(1, '#2E6A9E'); g.fillStyle = gr; g.fillRect(0, S.hor, w, y0 - S.hor);
    hills(g, w, y0 - h * 0.05, S.s * 0.25, '#B5A77E', 42); ground(g, w, h, y0 - h * 0.045, '#C9B88E');
    houses(g, 0, w * 0.34, y0 - h * 0.045, S.s * 0.45, ['#EDE4D0', '#E3D5B8', '#F2EADA'], null, 'flat', R);
    ground(g, w, h, y0, '#D6CBB2');
  },
  mon(g, S) {
    const m = '#EEE6D4';
    box(g, -19, 0, 38, 19, m, 6, 3);
    g.fillStyle = '#B23A2E'; rect(g, -19, 6.5, 38, 1.6); rect(g, -19, 13.5, 38, 1.6); g.fillStyle = '#2E4C9A'; for (let x = -18; x < 19; x += 2.4) { rect(g, x, 6.9, 0.6, 0.8); rect(g, x + 1.2, 13.9, 0.6, 0.8); }   // the painted friezes
    g.fillStyle = '#3A3028'; rect(g, -1.6, 0, 3.2, 4.2);
    g.fillStyle = '#D8CEB8'; for (let x = -17; x <= 17; x += 3.4) { rect(g, x - 0.5, 19, 1, 1.8); disc(g, x, 21.1, 0.4); }                     // the statues along the top of the podium
    colonnade(g, -16, 16, 11, 19, 11, 1.4, '#F0E8D6', 'ionic');
    entablature(g, -18, 18, 30, 2.6, '#EDE4D0', ['#2E4C9A', '#E8D9B5', '#B23A2E']);
    for (let i = 0; i < 24; i++) { const wd = 34 - i * 1.08; g.fillStyle = i % 2 ? '#E2D8C2' : m; rect(g, -wd / 2, 32.6 + i * 0.4, wd, 0.4); }   // the stepped roof
    g.fillStyle = '#D9A930'; rect(g, -17.4, 32.6, 34.8, 0.3);
    g.fillStyle = m; rect(g, -5, 42.2, 10, 0.8);
    [[-2.6, 0], [-0.6, 0.3], [1.4, 0], [3.4, 0.3]].forEach(([x, lift]) => horse(g, x, 43 + lift, 2.6, '#E6DCC6'));                            // the chariot and four horses on top
    g.fillStyle = '#D9CFB8'; rect(g, -6.2, 43.2, 2.6, 1.6); disc(g, -5.6, 43.9, 0.7); g.fillStyle = '#E6DCC6'; rect(g, -5.9, 44.8, 0.9, 2.2); disc(g, -5.45, 47.4, 0.45); rect(g, -4.7, 44.8, 0.9, 2.2); disc(g, -4.25, 47.4, 0.45);
    g.fillStyle = '#D8CEB8'; [[-19, 32.6], [17, 32.6]].forEach(([x, y]) => { rect(g, x, y, 2, 1); disc(g, x + 1.7, y + 1.3, 0.5); });     // the lions at the corners
  }
};
W.colossus = {
  size: [60, 56], horizon: 0.16, shift: -0.05,
  sky: ['#1D2D5E', '#60508F', '#D97E5A', '#FBD08A'], light: () => ({ sun: { x: 0.74, y: 0.58, big: true, disc: 0.06, c: '255,200,120', dc: '#FFD58A' } }),
  sound: 'ocean', music: 'lyre', live: ['clouds', 'glitter', 'waves', 'ships', 'birds', 'fires', 'people'], tap: 'flare', clouds: { n: 4, c: '#FFD6B8', a: 0.75 }, birds: { n: 4, c: 'rgba(255,255,255,.85)', low: true },
  people: [{ y: 2.2, x: [-70, 10], n: 7 }],
  say: { kind: 'Colossus of Rhodes', text: 'Helios was the Greek god of the Sun. The people of Rhodes built the statue to thank him after they survived a long siege. It stood for only about 54 years before an earthquake toppled it, and its giant pieces lay on the ground for 800 years.' },
  fires: (S) => [{ x: S.px(5.95), y: S.py(53.2), s: S.k * 3.4 }],
  sea: (S) => ({ y0: S.hor, y1: S.y0 - S.k * 4, far: true, ships: 3, s: S.s * 0.4, sx0: S.px(18), c: '255,220,170' }),
  glitter: (S) => ({ x: 0.74 * S.w, w: S.w * 0.05, y0: S.hor, y1: S.y0 + S.h * 0.1, c: '255,220,160' }),
  far(g, S) {
    const w = S.w, h = S.h;
    const gr = g.createLinearGradient(0, S.hor, 0, h); gr.addColorStop(0, '#E8A072'); gr.addColorStop(0.25, '#6A7FA0'); gr.addColorStop(1, '#1E3A5C'); g.fillStyle = gr; g.fillRect(0, S.hor, w, h - S.hor);
    hills(g, w * 0.4, S.hor + 1, S.s * 0.5, '#4A4A72', 51);
  },
  mon(g, S) {
    const br = g.createLinearGradient(-6, 0, 6, 0); br.addColorStop(0, '#7A4B1E'); br.addColorStop(0.45, '#E2A85E'); br.addColorStop(1, '#8E5A24');
    g.fillStyle = '#B8AC94'; rect(g, -90, 0, 108, 2.2); g.fillStyle = '#8E846F'; rect(g, -90, 0, 108, 0.5);                               // the harbour wall
    g.fillStyle = '#EDE6D6'; rect(g, -8, 2.2, 16, 4); g.fillStyle = '#E2D9C6'; rect(g, -6.5, 6.2, 13, 5); g.fillStyle = '#EDE6D6'; rect(g, -5.5, 11.2, 11, 4);   // the pedestal
    g.fillStyle = '#6B4A22'; rect(g, -5.35, 14, 0.5, 40); poly(g, [[-5.7, 54], [-4.5, 54], [-5.1, 57]]);                                   // the spear
    g.fillStyle = br; poly(g, [[-3, 15.2], [3, 15.2], [2.4, 30], [-2.4, 30]]); g.fillStyle = 'rgba(60,30,5,.5)'; rect(g, -0.25, 15.2, 0.5, 13.5);   // legs
    g.fillStyle = '#9A6228'; rect(g, -2.8, 28.6, 5.6, 2.2);
    g.fillStyle = br; poly(g, [[-2.8, 30.6], [2.8, 30.6], [4.6, 39], [-4.6, 39]]); rect(g, -0.9, 39, 1.8, 1.6);                              // torso and neck
    g.fillStyle = 'rgba(255,230,180,.22)'; poly(g, [[1.4, 16], [2.4, 16], [1.9, 29.6], [1.0, 29.6]]); poly(g, [[1.6, 31], [2.8, 31], [3.8, 38.6], [2.4, 38.6]]);   // the shine on the bronze
    g.strokeStyle = '#C98A42'; g.lineWidth = 1.9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(3.8, 38.2); g.lineTo(6.2, 43.6); g.lineTo(6.0, 49); g.stroke();                                                // the raised arm
    g.beginPath(); g.moveTo(-3.8, 38.2); g.lineTo(-5.2, 32.5); g.lineTo(-4.9, 26.8); g.stroke();                                           // the other arm, holding the spear
    g.fillStyle = '#C98A42'; rect(g, 5.3, 48.6, 1.4, 1.6); g.fillStyle = '#4A2C10'; rect(g, 5.7, 50.2, 0.5, 2.6); g.fillStyle = '#6B4A22'; rect(g, 5.2, 52.6, 1.5, 0.7);   // hand and torch
    g.fillStyle = br; g.beginPath(); g.ellipse(0, 42.4, 1.7, 2.1, 0, 0, TAU); g.fill();
    g.fillStyle = '#F2C97C'; for (let k = 0; k < 7; k++) { const an = Math.PI * (0.15 + k * 0.1167), L = k % 2 ? 2.8 : 3.6; poly(g, [[Math.cos(an - 0.06) * 1.7, 43.4 + Math.sin(an - 0.06) * 1.7], [Math.cos(an) * (1.7 + L), 43.4 + Math.sin(an) * (1.7 + L)], [Math.cos(an + 0.06) * 1.7, 43.4 + Math.sin(an + 0.06) * 1.7]]); }   // the sun-ray crown
  }
};
W.pharos = {
  size: [70, 112], horizon: 0.14, fit: 0.9,
  sky: ['#040816', '#0A1530', '#15285A', '#2E4A7A'], light: () => ({ night: true, moon: { x: 0.3, y: 0.14, crescent: true } }),
  sound: 'ocean', music: 'oud', live: ['glitter', 'waves', 'ships', 'beam', 'fires', 'embers'], tap: 'blaze',
  say: { kind: 'Lighthouse of Alexandria', text: 'A fire burned at the top all night. It is said that a great mirror of polished bronze reflected the light far out to sea, perhaps 50 kilometres away, so that sailors could find the harbour in the dark.' },
  fires: (S) => [{ x: S.px(0), y: S.py(91.5), s: S.k * 5.5 }],
  beam: (S) => ({ x: S.px(0), y: S.py(94) }),
  sea: (S) => ({ y0: S.hor, y1: S.h, ships: 4, s: S.s * 0.42, night: true, hull: '#1A1A24', sail: '#8A8A98', c: '170,200,240' }),
  glitter: (S) => ({ x: 0.3 * S.w, w: S.w * 0.05, y0: S.hor, y1: S.h, c: '200,220,255' }),
  far(g, S) {
    const w = S.w, h = S.h, R = seeded(7);
    const gr = g.createLinearGradient(0, S.hor, 0, h); gr.addColorStop(0, '#1E3A66'); gr.addColorStop(1, '#060C1A'); g.fillStyle = gr; g.fillRect(0, S.hor, w, h - S.hor);
    g.fillStyle = '#0D1830'; g.fillRect(0, S.hor - S.s * 0.35, w * 0.36, S.s * 0.35); houses(g, 0, w * 0.36, S.hor - S.s * 0.35, S.s * 0.3, '#0D1830', '#F0C070', 'flat', R);   // Alexandria, across the water
    g.fillStyle = '#2A3146'; g.fillRect(0, S.py(1.6), S.px(-32), S.k * 2.4);                                                             // the causeway to the city
  },
  mon(g, S, ph, R) {
    const st = '#6E7A92', sd = '#4A5268';
    g.fillStyle = '#4C5466'; rect(g, -36, 0, 72, 4); g.fillStyle = '#5A6378'; rect(g, -36, 4, 72, 1.2); for (let x = -35; x < 36; x += 3) rect(g, x, 5.2, 1.5, 1);
    box(g, -15, 5, 30, 56, st, 7, 3.5);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) { const lit = R() < 0.35; g.fillStyle = lit ? '#F0C070' : '#2A2F40'; rect(g, -12.5 + c * 5.6, 9 + r * 7, 1.6, 2.4); }
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-15, 8 + k * 13); g.lineTo(15, 14 + k * 13); g.stroke(); }   // the ramp winding up
    g.fillStyle = '#727D94'; rect(g, -6.5, 61, 13, 28); g.fillStyle = '#555E74'; poly(g, [[-6.5, 61], [-6.5, 89], [-11, 87.5], [-11, 62.5]]); g.fillStyle = '#3E4659'; poly(g, [[6.5, 61], [6.5, 89], [11, 87.5], [11, 62.5]]);   // the eight-sided tier
    for (let r = 0; r < 3; r++) { g.fillStyle = R() < 0.5 ? '#F0C070' : '#2A2F40'; rect(g, -1, 65 + r * 8, 2, 2.6); }
    g.fillStyle = '#5A6478'; rect(g, -8, 89, 16, 1.4);
    g.fillStyle = '#2A2F40'; rect(g, -5.5, 90.4, 11, 9); g.fillStyle = '#8A94AC'; for (let k = -2; k <= 2; k++) rect(g, k * 2.5 - 0.4, 90.4, 0.8, 9);   // the round top, where the fire burns
    g.fillStyle = '#5A6478'; rect(g, -7, 99.4, 14, 1.2); half(g, 0, 100.6, 5.5);
    g.fillStyle = '#3A4254'; rect(g, -0.9, 106, 1.8, 4); disc(g, 0, 110.8, 0.9); rect(g, 0.6, 108.5, 2.6, 0.5); rect(g, 2.9, 108, 0.4, 3.5);   // the statue on top
  }
};

/* ---- the new seven ---- */
/* the shape of a ridge, the same one hills() draws, so the Great Wall can follow it */
const ridge = (w, yb, amp, seed, x) => yb - amp * (0.55 * noise(x / w * 2.2 + seed, seed) + 0.45 * noise(x / w * 6 + seed * 2, seed));
function wallAlong(g, w, yb, amp, seed, x0, x1, hgt, col, dk, towers) {
  const step = 6;
  g.fillStyle = dk; g.beginPath(); g.moveTo(x0, ridge(w, yb, amp, seed, x0) + hgt * 0.4);
  for (let x = x0; x <= x1; x += step) g.lineTo(x, ridge(w, yb, amp, seed, x) - hgt);
  for (let x = x1; x >= x0; x -= step) g.lineTo(x, ridge(w, yb, amp, seed, x) + hgt * 0.4);
  g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(x0, ridge(w, yb, amp, seed, x0) - hgt * 0.35);
  for (let x = x0; x <= x1; x += step) g.lineTo(x, ridge(w, yb, amp, seed, x) - hgt);
  for (let x = x1; x >= x0; x -= step) g.lineTo(x, ridge(w, yb, amp, seed, x) - hgt * 0.35);
  g.closePath(); g.fill();
  g.fillStyle = tint(col, 0.12); for (let x = x0; x <= x1; x += hgt * 0.5) g.fillRect(x, ridge(w, yb, amp, seed, x) - hgt * 1.18, hgt * 0.22, hgt * 0.2);        // the battlements
  const out = [];
  towers.forEach((tx) => { const y = ridge(w, yb, amp, seed, tx), tw = hgt * 1.6, th = hgt * 2.3; g.fillStyle = dk; g.fillRect(tx - tw / 2, y - th, tw, th + hgt * 0.4); g.fillStyle = col; g.fillRect(tx - tw / 2, y - th, tw * 0.62, th + hgt * 0.4); g.fillStyle = tint(col, 0.12); for (let k = 0; k < 4; k++) g.fillRect(tx - tw / 2 + k * tw * 0.27, y - th - hgt * 0.22, tw * 0.14, hgt * 0.22); g.fillStyle = '#2A2A2E'; g.fillRect(tx - tw * 0.2, y - th * 0.7, tw * 0.12, hgt * 0.35); g.fillRect(tx + tw * 0.02, y - th * 0.7, tw * 0.12, hgt * 0.35); out.push({ x: tx, y: y - th }); });
  return out;
}
W.wall = {
  size: [100, 60], horizon: 0.3,
  sky: ['#3F6A9E', '#86ACCF', '#CFDDE6', '#EEEFE6'], light: () => ({ sun: { x: 0.25, y: 0.12, c: '255,240,210' } }),
  sound: 'wind', music: 'guzheng', live: ['birds', 'mist', 'flag'], tap: 'beacon', birds: { n: 4, c: 'rgba(255,255,255,.9)', scale: 1.3 }, mist: { n: 8, y0: -0.3, span: 0.5, a: 0.16 },
  say: { kind: 'Great Wall of China', text: 'Soldiers on the towers lit fires to warn of an attack. The smoke by day and the flames by night passed the message from tower to tower, faster than any horse could ride.' },
  flag: (S) => ({ x: S.towers[0].x + S.s * 0.1, y: S.towers[0].y, h: S.s * 0.36, c: '#D7263D', c2: '#F2C94C' }),
  beacon: (S) => ({ x: S.towers[0].x, y: S.towers[0].y, s: S.s * 0.5 }),
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0;
    const bands = [[S.hor + h * 0.02, S.s * 1.6, 61, '#9DB3C6'], [y0 - h * 0.2, S.s * 2.0, 62, '#7A98A6'], [y0 - h * 0.1, S.s * 2.2, 63, '#5C7F6C'], [y0 + h * 0.02, S.s * 2.4, 64, '#3E5E46']];
    bands.forEach(([yb, amp, seed, col], i) => {
      hills(g, w, yb, amp, col, seed);
      if (i === 1) wallAlong(g, w, yb, amp, seed, 0, w, S.s * 0.1, '#A8A49A', '#6E6A62', [w * 0.22, w * 0.5, w * 0.8]);
      if (i === 2) wallAlong(g, w, yb, amp, seed, w * 0.3, w, S.s * 0.16, '#9A968C', '#5F5B55', [w * 0.42, w * 0.66, w * 0.9]);
      if (i === 3) {
        const R = seeded(64); for (let k = 0; k < 40; k++) { const x = R() * w, y = ridge(w, yb, amp, seed, x) + R() * h * 0.1 + 6; g.fillStyle = tint(col, -0.2); g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x, y - 14 - R() * 10); g.lineTo(x + 5, y); g.fill(); }   // pines on the near slope
        S.towers = wallAlong(g, w, yb, amp, seed, w * 0.42, w * 1.05, S.s * 0.26, '#8E8A80', '#55514B', [w * 0.6, w * 0.84]);
      }
    });
  }
};
W.petra = {
  size: [40, 46], fit: 0.9, horizon: 0.02,
  sky: ['#3F7FD0', '#8FC3F0', '#E0ECF4', '#F0DFC0'],
  sound: 'wind', music: 'oud', live: ['rays', 'dust', 'swifts', 'people', 'camels'], tap: 'sweep', rays: { x: 0.68, y: -0.1, a: 1.35, k: 0.14, c: '255,230,180' }, camels: { n: 1, h: 0.5, y: 0.1 },
  people: [{ y: 0, x: [-14, 14], n: 6 }],
  say: { kind: 'Petra', text: 'The Treasury was carved straight into the sandstone cliff, from the top down, about 2,000 years ago. The Nabataeans who built Petra grew rich from the camel caravans that crossed the desert with spices and silk.' },
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0, R = seeded(71);
    g.fillStyle = '#C99A6A'; g.fillRect(0, y0, w, h - y0);
    const gr = g.createLinearGradient(0, y0 - S.k * 46, 0, y0); gr.addColorStop(0, '#B96E52'); gr.addColorStop(1, '#D08A6C'); g.fillStyle = gr; g.fillRect(S.px(-26), y0 - S.k * 48, S.k * 52, S.k * 48);   // the cliff the Treasury is cut into
    g.strokeStyle = 'rgba(120,50,30,.25)'; g.lineWidth = 2; for (let k = 0; k < 18; k++) { const y = y0 - S.k * 46 + k * S.k * 2.6; g.beginPath(); for (let x = S.px(-26); x <= S.px(26); x += 10) { const yy = y + Math.sin(x / 40 + k) * 4; if (x === S.px(-26)) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }
    const wallL = S.px(-15), wallR = S.px(15.5);
    [[0, wallL, '#4E2A22', '#5E352A', 1], [wallR, w, '#6A3A2E', '#7E4535', -1]].forEach(([xa, xb, c, c2, side]) => {                          // the walls of the Siq, in shadow
      const edgeX = side > 0 ? xb : xa, topY = -10;
      g.fillStyle = c; g.beginPath(); g.moveTo(side > 0 ? xa : xb, h); g.lineTo(side > 0 ? xa : xb, topY);
      for (let y = topY; y <= h + 24; y += 24) { const bulge = Math.sin(y / 90 + side) * S.s * 0.25 + R() * 6 - S.s * 0.1; g.lineTo(edgeX - side * bulge, y); }
      g.closePath(); g.fill();
      g.strokeStyle = c2; g.lineWidth = 3; for (let k = 0; k < 16; k++) { const y = S.top + k * (h - S.top) / 16 + R() * 10; g.beginPath(); g.moveTo(xa, y + Math.sin(k) * 8); g.quadraticCurveTo((xa + xb) / 2, y + 14, xb, y - 6); g.stroke(); }
    });
    g.fillStyle = 'rgba(255,220,180,.12)'; g.fillRect(wallR - 6, 0, 6, h);
  },
  mon(g, S) {
    const c = '#D4896A', lt = '#E9AE90', dk = '#A95F48', deep = '#5E3226';
    g.fillStyle = tint(c, -0.06); rect(g, -12.5, 0, 25, 39.5);
    g.fillStyle = dk; rect(g, -2.2, 1, 4.4, 7.4); g.fillStyle = deep; rect(g, -1.8, 1, 3.6, 6.8);                                       // the doorway
    [-8.6, -4.4, 4.4, 8.6].forEach((x) => { g.fillStyle = dk; rect(g, x - 1.1, 4, 2.2, 3.2); disc(g, x, 7.6, 0.6); });                   // worn statues in the niches
    [-10.5, -6.5, -2.3, 2.3, 6.5, 10.5].forEach((x) => column(g, x, 1, 14, 1.3, lt, 'corinthian'));
    entablature(g, -12.5, 12.5, 15, 2.6, lt); g.fillStyle = dk; for (let x = -12; x < 12.5; x += 1) rect(g, x, 15.2, 0.5, 0.6);
    pediment(g, -8, 8, 17.6, 4.2, lt, c);
    g.fillStyle = tint(c, -0.03); rect(g, -12.5, 21.8, 25, 17.7);
    [-11, -7.5, 7.5, 11].forEach((x) => column(g, x, 22.5, 9, 1.1, lt, 'corinthian'));
    [-9.2, 9.2].forEach((x) => { g.fillStyle = dk; rect(g, x - 1, 25, 2, 3); disc(g, x, 28.4, 0.55); });
    g.fillStyle = lt; poly(g, [[-13.2, 31.5], [-13.2, 33.2], [-5.8, 36.9], [-5.8, 31.5]]); poly(g, [[13.2, 31.5], [13.2, 33.2], [5.8, 36.9], [5.8, 31.5]]);   // the broken pediment
    g.fillStyle = c; poly(g, [[-12.4, 32.2], [-12.4, 32.8], [-6.5, 35.8], [-6.5, 32.2]]); poly(g, [[12.4, 32.2], [12.4, 32.8], [6.5, 35.8], [6.5, 32.2]]);
    g.fillStyle = lt; rect(g, -3.4, 22.4, 6.8, 11); g.fillStyle = deep; rect(g, -1.4, 23, 2.8, 9); g.fillStyle = tint(lt, 0.1); for (let k = -2; k <= 2; k++) rect(g, k * 1.5 - 0.3, 22.6, 0.6, 10.4);   // the round pavilion in the middle
    g.fillStyle = dk; poly(g, [[-4.4, 33.4], [4.4, 33.4], [0, 37.4]]);
    g.fillStyle = lt; rect(g, -0.9, 37.2, 1.8, 0.9); g.beginPath(); g.ellipse(0, 39.1, 1.3, 1.1, 0, 0, TAU); g.fill(); rect(g, -0.4, 40.1, 0.8, 1.2);   // the urn
    g.strokeStyle = 'rgba(255,230,210,.18)'; g.lineWidth = 0.6; [[-11, 38, -9, 8], [4, 39, 7, 14], [10, 30, 12, 20]].forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); });   // weathering
  }
};
W.christ = {
  size: [44, 46], horizon: 0.3, phases: ['day', 'night'],
  sky: (ph) => (ph === 'night' ? ['#060B1E', '#0E1A3E', '#1B2E5C', '#2C4472'] : ['#2360B2', '#5FA1DD', '#A9D1EE', '#E6EEF2']),
  light: (ph) => (ph === 'night' ? { night: true, moon: { x: 0.22, y: 0.12 } } : { sun: { x: 0.22, y: 0.12, disc: 0.025 } }),
  sound: ['birds', 'night'], music: 'bossa', live: ['clouds', 'birds', 'people'], tap: 'phase', clouds: { n: 3, y0: 0.52, y1: 0.08, s: 0.9, a: 0.7 }, birds: { n: 4, scale: 1.2 },
  people: [{ y: -1, x: [-10, 10], n: 5, cols: CLOTHES.now }],
  says: { day: { kind: 'Christ the Redeemer', text: 'By day you can see the whole of Rio de Janeiro below the statue: the beaches, the bay, the city and Sugarloaf Mountain. Tap again for night.' }, night: { kind: 'Christ the Redeemer', text: 'At night floodlights make the statue glow, and it can be seen from all over the city. Tap again for day.' } },
  far(g, S, ph) {
    const w = S.w, h = S.h, y0 = S.y0, night = ph === 'night', R = seeded(81);
    const gr = g.createLinearGradient(0, S.hor, 0, y0); gr.addColorStop(0, night ? '#14274A' : '#4C93C9'); gr.addColorStop(1, night ? '#0B1830' : '#2F7FB9'); g.fillStyle = gr; g.fillRect(0, S.hor, w, h - S.hor);   // the bay
    hills(g, w, S.hor + 2, S.s * 0.6, night ? '#1A2440' : '#6E8EA4', 82);
    mountain(g, w * 0.74, y0 - h * 0.06, w * 0.15, h * 0.24, night ? '#1C2A2C' : '#3F5E4A', false); mountain(g, w * 0.83, y0 - h * 0.06, w * 0.11, h * 0.14, night ? '#1A262A' : '#466A52', false);   // Sugarloaf
    g.fillStyle = night ? '#101A2A' : '#D9D3C4'; g.beginPath(); g.moveTo(w * 0.52, y0 - h * 0.05); g.quadraticCurveTo(w * 0.7, y0 - h * 0.11, w * 0.84, y0 - h * 0.05); g.lineTo(w * 0.84, y0 - h * 0.02); g.lineTo(w * 0.52, y0 - h * 0.02); g.fill();   // the beach and the city along the shore
    houses(g, w * 0.46, w * 0.9, y0 - h * 0.05, S.s * 0.1, night ? '#141C30' : ['#D6D9DE', '#C4C8CF', '#E6E8EA'], night ? '#F5D98A' : null, 'tower', R);
    if (night) { g.fillStyle = '#FFE9A8'; for (let k = 0; k < 160; k++) { g.globalAlpha = 0.4 + R() * 0.6; g.fillRect(w * 0.5 + R() * w * 0.4, y0 - h * (0.05 + R() * 0.07), 1.4, 1.4); } g.globalAlpha = 1; }
    const sg = g.createRadialGradient(S.px(0), S.py(20), 0, S.px(0), S.py(20), S.k * 30); sg.addColorStop(0, night ? 'rgba(255,236,190,.42)' : 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
  },
  mon(g, S, ph) {
    const night = ph === 'night', st = night ? '#FFF2DA' : '#E8E6DF', sd = night ? '#C9B38A' : '#B9B7B0';
    g.fillStyle = night ? '#0E1A14' : '#1E4A33'; poly(g, [[-80, -60], [-30, -14], [-13, -1], [13, -1], [30, -14], [80, -60]]);                   // Corcovado, the mountain top
    g.fillStyle = night ? '#132218' : '#2C6A44'; for (let k = 0; k < 26; k++) { const x = -34 + k * 2.7, y = -1 - Math.abs(x) * 0.42 - (k % 3) * 1.6; disc(g, x, y, 1.6 + (k % 2)); }
    g.fillStyle = night ? '#6E6E70' : '#9A9A94'; rect(g, -11, -1.2, 22, 1.2);
    g.fillStyle = night ? '#8A8A86' : '#7A7A74'; rect(g, -4.6, 0, 9.2, 8); g.fillStyle = night ? '#6E6E6A' : '#5E5E5A'; rect(g, 4.6, 0, 1.4, 8); g.fillStyle = '#2A2A2A'; archway(g, 0, 0.4, 2, 3.4, '#2A2A2A');   // the pedestal and chapel
    const rg = g.createLinearGradient(-3, 0, 3, 0); rg.addColorStop(0, sd); rg.addColorStop(0.45, st); rg.addColorStop(1, sd);
    g.fillStyle = rg; poly(g, [[-3.3, 8], [3.3, 8], [2.3, 30.6], [-2.3, 30.6]]);
    g.strokeStyle = 'rgba(0,0,0,.1)'; g.lineWidth = 0.18; [-1.4, -0.5, 0.5, 1.4].forEach((x) => { g.beginPath(); g.moveTo(x * 1.3, 8.5); g.lineTo(x * 0.9, 29.5); g.stroke(); });
    g.fillStyle = st; poly(g, [[-14.2, 29.2], [-2.6, 31.3], [2.6, 31.3], [14.2, 29.2], [14.2, 27.5], [2.6, 29.3], [-2.6, 29.3], [-14.2, 27.5]]);   // the open arms
    g.fillStyle = sd; rect(g, -14.6, 27.4, 1.6, 2.3); rect(g, 13, 27.4, 1.6, 2.3); poly(g, [[-2.6, 29.3], [2.6, 29.3], [2.3, 28.6], [-2.3, 28.6]]);
    g.fillStyle = st; rect(g, -1.1, 31.2, 2.2, 1.3); g.beginPath(); g.ellipse(0, 34.1, 1.35, 1.7, 0, 0, TAU); g.fill();
    g.fillStyle = sd; g.beginPath(); g.arc(0, 33.6, 1.3, Math.PI * 1.05, Math.PI * 1.95); g.fill(); g.beginPath(); g.ellipse(0, 35.3, 1.4, 0.7, 0, 0, Math.PI); g.fill();   // beard and hair
    if (night) { g.fillStyle = 'rgba(255,240,200,.18)'; [-6, 6].forEach((x) => poly(g, [[x, 0], [x + 3, 0], [x * 0.3 + 1, 34], [x * 0.3 - 1, 34]])); }   // floodlights
  }
};
W.machu = {
  size: [120, 60], wide: 0.62, horizon: 0.22,
  sky: ['#2A5E9E', '#78AFDB', '#C2DBEA', '#E9EEEC'], light: () => ({ sun: { x: 0.2, y: 0.12, disc: 0.02 } }),
  sound: 'wind', music: 'andes', live: ['mist', 'condor', 'llamas', 'people', 'clouds'], tap: 'condor', mist: { n: 7, y0: -0.05, span: 0.55, a: 0.2 }, clouds: { n: 3, a: 0.6 },
  people: [{ y: 6.6, x: [-30, 30], n: 5, cols: CLOTHES.now }, { y: 13.2, x: [-20, 20], n: 3, cols: CLOTHES.now }],
  llamas: { at: [[0.56, 0.02], [0.66, 0.045], [0.75, 0.02]] },
  say: { kind: 'Machu Picchu', text: 'The Andean condor is one of the biggest flying birds in the world, with wings more than three metres across. The Incas believed it carried messages between the people and the gods.' },
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0;
    hills(g, w, S.hor + h * 0.02, S.s * 1.8, '#6E8AA4', 91); hills(g, w, S.hor + h * 0.1, S.s * 2.0, '#4F6E60', 92);
    mountain(g, S.cx + w * 0.12, y0 - h * 0.02, w * 0.28, h * 0.55, '#2E5C3E', true);                                                       // Huayna Picchu
    g.fillStyle = 'rgba(120,120,110,.45)'; g.beginPath(); g.moveTo(S.cx + w * 0.1, y0 - h * 0.1); g.lineTo(S.cx + w * 0.14, y0 - h * 0.5); g.lineTo(S.cx + w * 0.2, y0 - h * 0.44); g.lineTo(S.cx + w * 0.22, y0 - h * 0.08); g.fill();   // the bare rock face
    hills(g, w, y0 + h * 0.05, S.s * 1.2, '#3E6B46', 93);
    g.fillStyle = '#2F5A38'; g.fillRect(0, y0 + h * 0.08, w, h);
  },
  mon(g, S, ph, R) {
    const greens = ['#6E9B4A', '#5E8B3E', '#7FAA55'];
    for (let i = 8; i >= 0; i--) { const wd = 128 - i * 11, y = i * 2.2; g.fillStyle = greens[i % 3]; poly(g, [[-wd / 2 - 6, y - 2.2], [wd / 2 + 6, y - 2.2], [wd / 2, y], [-wd / 2, y]]); g.fillStyle = '#7A7A70'; rect(g, -wd / 2 - 6, y - 2.2, wd + 12, 0.55); }   // the terraces, held up by stone walls
    const house = (x, y, wd, hgt, roof) => {
      g.fillStyle = '#8C8A80'; rect(g, x - wd / 2, y, wd, hgt); g.fillStyle = '#6E6C64'; poly(g, [[x + wd / 2, y], [x + wd / 2 + wd * 0.18, y + hgt * 0.1], [x + wd / 2 + wd * 0.18, y + hgt * 1.1], [x + wd / 2, y + hgt]]);
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.1; for (let yy = y + 0.5; yy < y + hgt; yy += 0.55) hline(g, x - wd / 2, x + wd / 2, yy, 0.1);
      g.fillStyle = '#3A3630'; poly(g, [[x - wd * 0.14, y], [x + wd * 0.14, y], [x + wd * 0.1, y + hgt * 0.7], [x - wd * 0.1, y + hgt * 0.7]]);   // the trapezoid doorway
      if (roof) { g.fillStyle = '#B89A5A'; poly(g, [[x - wd / 2 - 0.4, y + hgt], [x + wd / 2 + 0.4, y + hgt], [x, y + hgt + wd * 0.55]]); } else { g.fillStyle = '#8C8A80'; poly(g, [[x - wd / 2, y + hgt], [x + wd / 2, y + hgt], [x, y + hgt + wd * 0.5]]); }
    };
    [[-26, 6.6, 6, 3.2, 0], [-17, 6.6, 7, 3.4, 1], [-8, 6.6, 5, 3, 0], [6, 6.6, 7, 3.4, 0], [16, 6.6, 6, 3.2, 1], [26, 6.6, 7, 3.4, 0], [-20, 13.2, 6, 3.2, 1], [-10, 13.2, 7, 3.4, 0], [4, 13.2, 6, 3.2, 0], [14, 13.2, 7, 3.4, 1], [-6, 19.8, 7, 3.6, 0], [8, 19.8, 6, 3.2, 0]].forEach((a) => house(...a));
    g.fillStyle = '#9A9890'; for (let k = 0; k < 9; k++) rect(g, -1.5, k * 2.2, 3, 0.5);                                                      // a stone stairway
    g.fillStyle = '#5E8B3E'; rect(g, -40, 4.4, 80, 2.2);
  }
};
W.chichen = {
  size: [80, 38], wide: 0.6, horizon: 0.1,
  sky: ['#2A6FBB', '#7FB9E8', '#D1E6F2', '#F4ECD4'], light: () => ({ sun: { x: 0.2, y: 0.12, disc: 0.025 } }),
  sound: 'forest', music: 'maya', live: ['clouds', 'birds', 'butterflies', 'leaves', 'people'], tap: 'snake', clouds: { n: 3, s: 0.8 }, birds: { n: 3 },
  people: [{ y: 0, x: [-50, 50], n: 8, cols: CLOTHES.now }],
  say: { kind: 'Chichén Itzá', text: 'Twice a year, at the equinoxes, the afternoon sun throws a shadow down the stairway like a snake slithering to the stone snake’s head at the bottom. The pyramid is a calendar: four stairways of 91 steps, plus the top step, make 365.' },
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0, R = seeded(101);
    hills(g, w, S.hor, S.s * 0.5, '#2F6B3A', 102);
    for (let k = 0; k < 60; k++) { const x = R() * w, y = S.hor + R() * (y0 - S.hor) * 0.8, r = S.s * (0.3 + R() * 0.5); g.fillStyle = ['#2E6B35', '#3F8A42', '#4F9A4A', '#2A5A30'][k % 4]; g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, TAU); g.fill(); if (k % 9 === 0) palm(g, x, y + r, S.s * 1.2, '#2A5A30', k % 2 ? 1 : -1); }   // the jungle
    ground(g, w, h, y0 - 4, '#D8CDA8');
  },
  mon(g, S) {
    const cA = Math.cos(Math.PI / 6), sA = Math.sin(Math.PI / 6), e = 0.1;
    const P = (X, Y, Z) => [X * cA + Z * sA, Y + (-X * sA + Z * cA) * e];
    const quad = (pts, c) => { g.fillStyle = c; poly(g, pts.map((p) => P(...p))); };
    const n = 9, th = 2.57, w0 = 55.3, wTop = 17.7;
    for (let i = 0; i < n; i++) {
      const wd = w0 - (w0 - wTop) * i / (n - 1), y = i * th, hw = wd / 2;
      quad([[-hw, y + th, -hw], [hw, y + th, -hw], [hw, y + th, hw], [-hw, y + th, hw]], '#E8DDB8');
      quad([[-hw, y, -hw], [hw, y, -hw], [hw, y + th, -hw], [-hw, y + th, -hw]], '#D9CBA6');
      quad([[hw, y, -hw], [hw, y, hw], [hw, y + th, hw], [hw, y + th, -hw]], '#A6966F');
    }
    const top = n * th;
    quad([[-4.5, 0, -w0 / 2 - 1.5], [4.5, 0, -w0 / 2 - 1.5], [4.5, top, -wTop / 2 - 0.5], [-4.5, top, -wTop / 2 - 0.5]], '#CDBD93');          // the north stairway
    quad([[-5.6, 0, -w0 / 2 - 2], [-4.5, 0, -w0 / 2 - 2], [-4.5, top, -wTop / 2 - 0.8], [-5.6, top, -wTop / 2 - 0.8]], '#9D8D66');            // its balustrades
    quad([[4.5, 0, -w0 / 2 - 2], [5.6, 0, -w0 / 2 - 2], [5.6, top, -wTop / 2 - 0.8], [4.5, top, -wTop / 2 - 0.8]], '#9D8D66');
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 0.12; for (let k = 1; k < 91; k += 2) { const u = k / 91, a = P(-4.5, top * u, -w0 / 2 - 1.5 + (w0 / 2 + 1.5 - wTop / 2 - 0.5) * u), b = P(4.5, top * u, -w0 / 2 - 1.5 + (w0 / 2 + 1.5 - wTop / 2 - 0.5) * u); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    quad([[w0 / 2 + 1.5, 0, -4.5], [w0 / 2 + 1.5, 0, 4.5], [wTop / 2 + 0.5, top, 4.5], [wTop / 2 + 0.5, top, -4.5]], '#8E7E58');              // the east stairway, in shade
    [[-5.6, -4.5], [4.5, 5.6]].forEach(([a, b]) => { quad([[a - 0.6, 0, -w0 / 2 - 4.6], [b + 0.6, 0, -w0 / 2 - 4.6], [b + 0.6, 1.5, -w0 / 2 - 4.6], [a - 0.6, 1.5, -w0 / 2 - 4.6]], '#6E6450'); quad([[a - 0.6, 1.5, -w0 / 2 - 4.6], [b + 0.6, 1.5, -w0 / 2 - 4.6], [b + 0.6, 1.5, -w0 / 2 - 1.6], [a - 0.6, 1.5, -w0 / 2 - 1.6]], '#7E7460'); });   // the serpent heads
    const tw = 6.7, th2 = 6;
    quad([[-tw, top, -tw], [tw, top, -tw], [tw, top + th2, -tw], [-tw, top + th2, -tw]], '#E2D6B2'); quad([[tw, top, -tw], [tw, top, tw], [tw, top + th2, tw], [tw, top + th2, -tw]], '#B4A47C');
    quad([[-tw - 0.5, top + th2, -tw - 0.5], [tw + 0.5, top + th2, -tw - 0.5], [tw + 0.5, top + th2 + 0.8, -tw - 0.5], [-tw - 0.5, top + th2 + 0.8, -tw - 0.5]], '#EDE3C2');   // the temple on top
    quad([[-1.3, top, -tw - 0.05], [1.3, top, -tw - 0.05], [1.3, top + 3.4, -tw - 0.05], [-1.3, top + 3.4, -tw - 0.05]], '#2A2418');
    quad([[-4.6, top, -tw - 0.05], [-3.4, top, -tw - 0.05], [-3.4, top + 3.4, -tw - 0.05], [-4.6, top + 3.4, -tw - 0.05]], '#2A2418'); quad([[3.4, top, -tw - 0.05], [4.6, top, -tw - 0.05], [4.6, top + 3.4, -tw - 0.05], [3.4, top + 3.4, -tw - 0.05]], '#2A2418');
    // where the serpent's shadow falls: the north balustrade, and the seven triangles of light along it
    const bal = (u) => P(-5.05, top * u, -w0 / 2 - 2 + (w0 / 2 + 2 - wTop / 2 - 0.8) * u);
    W.chichen.serpent = { bal: [P(-5.6, 0, -w0 / 2 - 2), P(-4.5, 0, -w0 / 2 - 2), P(-4.5, top, -wTop / 2 - 0.8), P(-5.6, top, -wTop / 2 - 0.8)],
      tri: (j) => { const u = 0.93 - j * 0.13, a = bal(u + 0.055), b = bal(u - 0.055), m = bal(u); return [[a[0] - 1.1, a[1] + 0.2], [m[0] + 0.5, m[1]], [b[0] - 1.1, b[1] - 0.2]]; } };
  }
};
W.colosseum = {
  size: [190, 50], wide: 0.75, horizon: 0.1,
  sky: ['#2E66B4', '#7DB1E2', '#CFE1EF', '#F3E6CC'], light: () => ({ sun: { x: 0.2, y: 0.12, disc: 0.025 } }),
  sound: 'city', music: 'lyre', live: ['clouds', 'swifts', 'people'], tap: 'velarium', clouds: { n: 5 },
  people: [{ y: 0, x: [-90, 90], n: 12, cols: CLOTHES.now }],
  say: { kind: 'Colosseum', text: 'On hot days, sailors pulled a giant canvas sunshade, the velarium, over the crowd with ropes. Fifty thousand people could come in and out through its 80 arches in minutes.' },
  far(g, S) {
    const w = S.w, h = S.h, y0 = S.y0;
    hills(g, w, S.hor, S.s * 0.5, '#8E9E7A', 111);
    [0.08, 0.16].forEach((u, i) => pine(g, w * u, y0 - 2, S.s * (2.2 + i * 0.4), '#2E5A34')); [0.93, 0.97].forEach((u) => cypress(g, w * u, y0, S.s * 1.6, '#2E5A34'));
    ground(g, w, h, y0, '#CFC3A8');
    g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1; for (let k = 0; k < 10; k++) { const y = y0 + 6 + k * (h - y0) / 10; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  },
  mon(g, S) {
    const tr = '#DCC7A1', tin = '#B8A078', open = '#4A3A2A';
    g.fillStyle = tin; rect(g, -95, 1.5, 190, 30);
    for (let s = 0; s < 3; s++) for (let x = -92; x < 92; x += 5) { archway(g, x + 2.2, 2.5 + s * 10, 2.6, 7, '#3E3225'); }                   // the inner ring, lower and further back
    g.fillStyle = tint(tin, -0.1); [11.5, 21.5, 31.5].forEach((y) => rect(g, -95, y, 190, 0.7));
    g.fillStyle = tr; poly(g, [[-95, 0], [-8, 0], [-8, 48], [-95, 48]]);                                                                     // the outer wall, where it still stands
    poly(g, [[-8, 0], [6, 0], [6, 30], [4, 31], [4, 35], [2, 36], [0, 40], [-3, 41], [-4, 45], [-7, 46], [-8, 48]]);
    for (let s = 0; s < 3; s++) {
      const y = 1 + s * 12;
      for (let x = -93; x < 3; x += 6) { const edge = -8 + 14 * Math.max(0, (y - 24) / 24); if (x + 5 > edge + (s === 2 ? 0 : 12)) continue; archway(g, x + 3, y, 4, 8.6, open); g.fillStyle = tint(tr, 0.08); rect(g, x + 0.1, y, 0.9, 11); }   // three storeys of arches, with half-columns between
      g.fillStyle = tint(tr, -0.14); rect(g, -96, y + 11, 88 + (s === 2 ? 0 : 6), 1);
    }
    g.fillStyle = tint(tr, 0.08); for (let x = -93; x < -10; x += 6) rect(g, x + 0.1, 37, 1, 11);                                             // the top storey
    g.fillStyle = '#3E3225'; for (let x = -90; x < -12; x += 12) rect(g, x + 2, 41, 1.8, 2.2);
    g.fillStyle = tint(tr, -0.18); rect(g, -96, 47.4, 88, 0.8); for (let x = -92; x < -10; x += 6) rect(g, x + 1.6, 44.5, 0.8, 3);          // the brackets that held the sunshade's masts
    g.fillStyle = 'rgba(0,0,0,.12)'; rect(g, -95, 0, 6, 48);
  }
};
const TAJ = { dawn: ['#F7DCD0', '#D8A598', '#FFE9E2'], day: ['#F5F2EB', '#CFC8BA', '#FFFFFF'], sunset: ['#F7D9A2', '#D7AA66', '#FFEFC8'], night: ['#DDE4F2', '#9EA9C3', '#F1F5FF'] };
W.taj = {
  size: [150, 76], wide: 0.62, horizon: 0.1, phases: ['dawn', 'day', 'sunset', 'night'], auto: 18,
  sky: (ph) => ({ dawn: ['#3B3A74', '#8C6AA0', '#F0A28A', '#FBD5B0'], day: ['#2767B8', '#75B0E2', '#C8E0F0', '#EEF0E6'], sunset: ['#2F2A5A', '#9A4E63', '#E8894D', '#F8C977'], night: ['#060A1F', '#0D1738', '#1A2A58', '#2E4474'] })[ph],
  light: (ph) => ({ dawn: { sun: { x: 0.18, y: 0.32, disc: 0.03, c: '255,190,160' } }, day: { sun: { x: 0.22, y: 0.12, disc: 0.025 } }, sunset: { sun: { x: 0.8, y: 0.34, disc: 0.035, c: '255,180,100' } }, night: { night: true, moon: { x: 0.76, y: 0.16, r: 1.2 } } })[ph],
  sound: ['birds', 'birds', 'birds', 'night'], music: 'tabla', live: ['birds', 'waves', 'people'], tap: 'phase', birds: { n: 5, c: 'rgba(60,140,70,.9)' },
  people: [{ y: 0, x: [-30, 30], n: 8, cols: CLOTHES.now }],
  says: { dawn: { kind: 'Taj Mahal', text: 'At dawn the white marble looks soft pink.' }, day: { kind: 'Taj Mahal', text: 'In the middle of the day the marble is dazzling white.' }, sunset: { kind: 'Taj Mahal', text: 'At sunset the marble glows gold.' }, night: { kind: 'Taj Mahal', text: 'By moonlight the marble looks pale blue. People say it changes colour with the moods of the day.' } },
  sea: (S) => ({ y0: S.y0 + 6, y1: S.h, x0: S.px(-5), x1: S.px(5), c: '255,255,255' }),
  water: (S) => ({ x0: S.px(-5), x1: S.px(5), y: S.y0 + 4, a: 0.55, c: '40,70,90' }),
  far(g, S, ph) {
    const w = S.w, h = S.h, y0 = S.y0, night = ph === 'night';
    hills(g, w, S.hor + 4, S.s * 0.3, night ? '#1C2A44' : '#9FB58A', 121);
    g.fillStyle = night ? '#1E3022' : '#5E8F49'; g.fillRect(0, y0, w, h - y0);
    g.fillStyle = night ? '#2A3A4A' : '#D9CFB4'; g.fillRect(S.px(-6.5), y0, S.k * 13, h - y0);
    g.fillStyle = night ? '#152A3A' : '#5F8FB0'; g.fillRect(S.px(-5), y0 + 4, S.k * 10, h - y0);
    for (let i = 0; i < 7; i++) { const u = (i + 1) / 8, y = y0 + 4 + (h - y0) * u * u, hgt = S.s * (0.5 + u * 1.6); [-1, 1].forEach((d) => cypress(g, S.px(d * (7 + u * 6)), y, hgt, night ? '#0F1E14' : '#1F4D2A')); }   // the cypresses along the pool
  },
  mon(g, S, ph) {
    const [m, sd, hl] = TAJ[ph], red = ph === 'night' ? '#4A3230' : '#A85A3C', redd = ph === 'night' ? '#3A2624' : '#7E4229';
    [[-98, -62], [62, 98]].forEach(([a, b]) => {                                                                                            // the mosque and its twin
      g.fillStyle = redd; rect(g, a - 2, 0, b - a + 4, 3); g.fillStyle = red; rect(g, a, 3, b - a, 15); pointedArch(g, (a + b) / 2, 3.5, 9, 12, redd);
      [-10, 0, 10].forEach((d, i) => { const x = (a + b) / 2 + d, r = i === 1 ? 5.4 : 4.2; g.fillStyle = m; rect(g, x - r * 0.72, 18, r * 1.44, 2.4); onion(g, x, 20.4, r, r * 2.1, m, hl); finial(g, x, 20.4 + r * 2.1, 2.2, '#D9A930'); });
    });
    g.fillStyle = sd; rect(g, -48, 0, 96, 7); g.fillStyle = m; rect(g, -48, 6.2, 96, 0.8); g.fillStyle = tint(m, -0.06); rect(g, -48, 0, 96, 1);   // the platform
    [-43, 43].forEach((x) => {                                                                                                                // the four minarets
      const mg = g.createLinearGradient(x - 2, 0, x + 2, 0); mg.addColorStop(0, sd); mg.addColorStop(0.5, m); mg.addColorStop(1, sd);
      g.fillStyle = mg; poly(g, [[x - 1.9, 7], [x + 1.9, 7], [x + 1.4, 47], [x - 1.4, 47]]);
      g.fillStyle = sd; [21, 34, 44].forEach((y) => rect(g, x - 2.6, y, 5.2, 0.9));
      g.fillStyle = m; rect(g, x - 1.7, 47, 3.4, 2.4); onion(g, x, 49.4, 2.1, 3.6, m, hl); finial(g, x, 53, 1.4, '#D9A930');
    });
    g.fillStyle = sd; rect(g, -33, 7, 5, 24); rect(g, 28, 7, 5, 24);                                                                        // the cut-off corners
    g.fillStyle = m; rect(g, -28, 7, 56, 24);
    [-18, 18].forEach((x) => { [8, 19.6].forEach((y) => { pointedArch(g, x, y, 7.4, 9.6, sd); pointedArch(g, x, y + 0.5, 6, 8.4, '#4A3A32'); }); });
    g.fillStyle = sd; rect(g, -9.4, 7, 18.8, 23.6); g.fillStyle = m; rect(g, -8.4, 7, 16.8, 22.6); pointedArch(g, 0, 8, 13, 20.5, '#4A3A32');   // the great arch
    g.strokeStyle = 'rgba(40,40,60,.55)'; g.lineWidth = 0.22; g.strokeRect(-8.2, 7.6, 16.4, 21.6);
    g.fillStyle = hl; rect(g, -28.4, 31, 56.8, 1.2);
    [-20, 20].forEach((x) => { g.fillStyle = sd; rect(g, x - 3, 32.2, 6, 4); g.fillStyle = hl; for (let k = -1; k <= 1; k++) rect(g, x + k * 2 - 0.3, 32.2, 0.6, 4); onion(g, x, 36.2, 3.4, 5.6, m, hl); finial(g, x, 41.8, 1.8, '#D9A930'); });   // the four small domed kiosks
    const dg = g.createLinearGradient(-9, 0, 9, 0); dg.addColorStop(0, sd); dg.addColorStop(0.5, m); dg.addColorStop(1, sd);
    g.fillStyle = dg; rect(g, -8.6, 32.2, 17.2, 8); onion(g, 0, 40.2, 10.6, 21.4, m, hl); finial(g, 0, 61.6, 5.2, '#D9A930');               // the great dome
  }
};


/* ---------------- the scene ---------------- */
export function makeWonders() {
  const S = {
    id: 'wonders', wid: '', f: null, w: 0, h: 0, y0: 0, hor: 0, cx: 0, k: 1, s: 60, top: 72, bg: null, prevBg: null, fade: 1, live: {}, fx: [], acts: [], ph: 0, phT: 0, blaze: 0, soundOn: true, time: 0, onPhase: null,
    px(xm) { return this.cx + xm * this.k; }, py(ym) { return this.y0 - ym * this.k; },
    get phase() { return this.f && this.f.phases ? this.f.phases[this.ph] : 'day'; },
    get sound() { const s = this.f && this.f.sound; return Array.isArray(s) ? s[this.ph] : (s || 'wind'); },
    init(w, h) { this.w = w; this.h = h; this.layout(); },
    resize(w, h) { this.w = w; this.h = h; this.layout(); },
    layout() {
      if (!this.f || !this.w) return;
      const w = this.w, h = this.h, f = this.f, sm = w < 700 || h < 560;
      this.top = view.top; this.s = clamp(Math.min(w, h) / 9, 30, 110);
      const stripW = sm ? 0 : 250, textR = sm ? 0 : Math.min(w * 0.46, 620);
      const x0 = sm ? 14 : textR + 16, x1 = w - stripW - 16;
      this.y0 = Math.round(h * (sm ? 0.57 : 0.78));
      this.cx = Math.round((x0 + x1) / 2 + (f.shift || 0) * (x1 - x0));
      const hMax = this.y0 - (this.top + (sm ? 40 : 28)), wMax = f.wide ? Math.max(x1 - x0, f.wide * w) : x1 - x0;
      this.k = Math.min(hMax / f.size[1], wMax / f.size[0]) * (f.fit || 0.94);
      this.hor = this.y0 - (f.horizon || 0) * h;
      this.bg = null; this.prevBg = null; this.fade = 1; this.live = {}; this.acts = []; this.fx = [];
      (f.live || []).forEach((k) => { this.live[k] = LIVE[k].init(this); });
    },
    set(id) {
      if (!W[id] || id === this.wid) return;
      this.wid = id; this.f = W[id]; this.ph = 0; this.phT = 0; this.blaze = 0;
      if (this.w) this.layout();
    },
    phaseTo(i, user) {
      const f = this.f; if (!f.phases) return;
      this.ph = ((i % f.phases.length) + f.phases.length) % f.phases.length; this.phT = 0;
      this.prevBg = this.bg; this.bg = null; this.fade = 0;
      if (user && this.soundOn) Fx.play('chime');
      if (this.onPhase) this.onPhase(this.phase, user);
    },
    paintBg() {
      const w = this.w, h = this.h, f = this.f, ph = this.phase, c = layer(w * (view.dpr || 1), h * (view.dpr || 1)), g = c.getContext('2d');
      g.scale(view.dpr || 1, view.dpr || 1);
      const R = seeded(hash(this.wid + ':' + ph));
      const cols = typeof f.sky === 'function' ? f.sky(ph) : f.sky, light = f.light ? f.light(ph) : {};
      sky(g, w, h, this.hor, cols, light, R);
      if (f.far) f.far(g, this, ph, R);
      if (f.mon) { g.save(); g.translate(this.cx, this.y0); g.scale(this.k, -this.k); g.lineJoin = 'round'; f.mon(g, this, ph, R); g.restore(); }
      if (f.near) f.near(g, this, ph, R);
      this.bg = c;
    },
    step(dt, t) {
      this.time = t;
      if (!this.f) return;
      if (this.top !== view.top) this.top = view.top;
      if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 1.4);
      if (this.f.auto && this.f.phases) { this.phT += dt; if (this.phT > this.f.auto) this.phaseTo(this.ph + 1, false); }
      if (this.blaze > 0) this.blaze -= dt;
      Object.keys(this.live).forEach((k) => LIVE[k].step(this.live[k], this, dt, t));
      this.acts.forEach((a) => { a.t += dt; });
      this.acts = this.acts.filter((a) => a.t < a.d);
      this.fx = stepParticles(this.fx, dt, t);
      if (this.fx.length > 1200) this.fx.splice(0, this.fx.length - 1200);
    },
    paintShade(w, h) {
      const c = layer(w, h), g = c.getContext('2d');
      const top = g.createLinearGradient(0, 0, 0, h * 0.2); top.addColorStop(0, 'rgba(3,5,12,.45)'); top.addColorStop(1, 'rgba(3,5,12,0)');
      g.fillStyle = top; g.fillRect(0, 0, w, h * 0.2);
      const bot = g.createLinearGradient(0, h * 0.5, 0, h); bot.addColorStop(0, 'rgba(3,5,12,0)'); bot.addColorStop(1, 'rgba(3,5,12,.66)');
      g.fillStyle = bot; g.fillRect(0, h * 0.5, w, h * 0.5);
      const side = g.createRadialGradient(0, h * 0.8, 0, 0, h * 0.8, Math.max(w * 0.55, 420)); side.addColorStop(0, 'rgba(3,5,12,.55)'); side.addColorStop(1, 'rgba(3,5,12,0)');
      g.fillStyle = side; g.fillRect(0, 0, w, h);
      this.shade = c; this.shadeKey = w + 'x' + h;
    },
    draw(ctx, w, h, t) {
      if (!this.f) { ctx.fillStyle = '#05070F'; ctx.fillRect(0, 0, w, h); return; }
      if (!this.bg) this.paintBg();
      if (this.prevBg && this.fade < 1) { ctx.drawImage(this.prevBg, 0, 0, w, h); ctx.globalAlpha = this.fade; ctx.drawImage(this.bg, 0, 0, w, h); ctx.globalAlpha = 1; }
      else { this.prevBg = null; ctx.drawImage(this.bg, 0, 0, w, h); }
      const f = this.f;
      if (f.water) {                                                                   // the monument reflected in the water below it
        const wa = f.water(this);
        ctx.save(); ctx.beginPath(); ctx.rect(wa.x0, wa.y, wa.x1 - wa.x0, h - wa.y); ctx.clip();
        ctx.translate(0, 2 * wa.y); ctx.scale(1, -1); ctx.globalAlpha = wa.a || 0.3; ctx.drawImage(this.bg, 0, 0, w, h); ctx.globalAlpha = 1;
        ctx.restore();
        const gr = ctx.createLinearGradient(0, wa.y, 0, h); gr.addColorStop(0, 'rgba(' + wa.c + ',0)'); gr.addColorStop(1, 'rgba(' + wa.c + ',.75)');
        ctx.fillStyle = gr; ctx.fillRect(wa.x0, wa.y, wa.x1 - wa.x0, h - wa.y);
      }
      (f.live || []).forEach((k) => { if (this.live[k]) { ctx.save(); LIVE[k].draw(this.live[k], this, ctx, t); ctx.restore(); } });
      this.acts.forEach((a) => { ctx.save(); ACTS[a.kind].draw(a, this, ctx, t); ctx.restore(); });
      drawParticles(ctx, this.fx, t);
      if (!this.shade || this.shadeKey !== w + 'x' + h) this.paintShade(w, h);
      ctx.drawImage(this.shade, 0, 0, w, h);
    },
    /* tapping the scene */
    click(x, y) {
      const f = this.f; if (!f) return null;
      const on = this.soundOn, k = f.tap;
      if (k === 'phase') { this.phaseTo(this.ph + 1, true); return { say: f.says[this.phase], phase: this.phase }; }
      const A = ACTS[k];
      if (A) {
        if (!A.again && this.acts.some((a) => a.kind === k)) return { tap: k };
        this.acts.push({ kind: k, t: 0, d: A.d, x, y });
        if (A.start) A.start(this, x, y);
        if (on && A.sound) Fx.play(A.sound);
      }
      return { tap: k, say: f.say };
    }
  };
  return S;
}

/* ---------------- what a tap starts (each lasts a few seconds) ---------------- */
const ease = (u) => Math.sin(Math.min(1, Math.max(0, u)) * Math.PI);
const ACTS = {
  casing: { d: 9, sound: 'sparkle',                                                  // the Great Pyramid, as it was built: smooth white limestone with a golden tip
    draw(a, S, ctx) {
      const u = a.t / a.d, k = u < 0.15 ? u / 0.15 : u > 0.8 ? (1 - u) / 0.2 : 1;
      ctx.save(); ctx.translate(S.cx, S.y0); ctx.scale(S.k, -S.k); ctx.globalAlpha = k;
      pyramid(ctx, -40, 300, 147, '#F7F1E4', '#D9CDB4', 0);
      ctx.fillStyle = '#F0C45A'; poly(ctx, [[-40 - 12, 139.5], [-40, 147], [-40 + 12, 139.5]]);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, S.px(-40), S.py(146), S.s * 0.8 * k, '255,230,150', 0.8 * k); ctx.globalCompositeOperation = 'source-over';
    } },
  splash: { d: 1, again: true, sound: 'splash', start(S, x, y) { S.fx.push(...burstParticles(x, y, 60, ['210,240,255'], 260, { kind: 'drop', up: 220, life: 1.4, size: 0.9 })); S.fx.push(...burstParticles(x, y, 6, ['#2E2E3A'], 120, { kind: 'bird', up: 160, life: 3 })); }, draw() {} },
  doves: { d: 7, sound: 'chime',
    start(S) { a0.birds = Array.from({ length: 14 }, (_, i) => ({ x: S.px(-30 + i * 4.5), y: S.py(31), vx: rnd(-40, 40), vy: -rnd(40, 90), p: rnd(0, TAU) })); },
    draw(a, S, ctx, t) { const k = 1 - Math.max(0, (a.t - 5) / 2); ctx.strokeStyle = 'rgba(255,255,255,' + (0.95 * k).toFixed(3) + ')'; ctx.lineWidth = 2; a0.birds.forEach((b) => { b.x += b.vx * 0.016; b.y += b.vy * 0.016; b.vy += 10 * 0.016; bird(ctx, b.x, b.y, 9, Math.sin(t * 14 + b.p) * 6); }); } },
  lightning: { d: 2.2, sound: 'thunder', start(S) { a0.bolt = Array.from({ length: 9 }, () => rnd(-1, 1)); },
    draw(a, S, ctx) {
      const u = a.t / a.d, fl = u < 0.1 ? 1 : u < 0.2 ? 0.3 : u < 0.28 ? 0.8 : 0;
      if (fl) { ctx.fillStyle = 'rgba(235,240,255,' + (fl * 0.55).toFixed(3) + ')'; ctx.fillRect(0, 0, S.w, S.h); }
      if (u < 0.3) {
        const x1 = S.px(3.6), y1 = S.py(13), x0 = S.px(-26) + S.w * 0.08, y0 = S.top - 10;
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3; ctx.shadowColor = '#9FD0FF'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(x0, y0);
        a0.bolt.forEach((j, i) => { const v = (i + 1) / 10; ctx.lineTo(x0 + (x1 - x0) * v + j * S.s * 0.5, y0 + (y1 - y0) * v); });
        ctx.lineTo(x1, y1); ctx.stroke(); ctx.shadowBlur = 0;
      }
    } },
  gulls: { d: 6, again: true, sound: 'gust', start(S, x, y) { S.fx.push(...burstParticles(x, y, 10, ['#FFFFFF'], 150, { kind: 'bird', up: 140, life: 4 })); }, draw() {} },
  flare: { d: 5, sound: 'flare', start(S) { S.blaze = 5; const p = S.f.fires(S)[0]; S.fx.push(...burstParticles(p.x, p.y - p.s * 0.6, 70, ['255,214,120', '255,170,60', '255,240,190'], 220, { life: 1.4 })); },
    draw(a, S, ctx) { const k = ease(a.t / a.d); ctx.globalCompositeOperation = 'lighter'; dotGlow(ctx, S.px(0), S.py(43.6), S.s * 2.2 * k, '255,210,120', 0.5 * k); for (let i = 0; i < 7; i++) { const an = Math.PI * (0.2 + i * 0.1), L = S.s * (2.5 + (i % 2)) * k; ctx.strokeStyle = 'rgba(255,230,150,' + (0.5 * k).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S.px(0), S.py(43.6)); ctx.lineTo(S.px(0) + Math.cos(an) * L, S.py(43.6) - Math.sin(an) * L); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; } },
  blaze: { d: 5, sound: 'flare', start(S) { S.blaze = 5; const p = S.f.fires(S)[0]; S.fx.push(...burstParticles(p.x, p.y - p.s * 0.5, 50, ['255,200,100', '255,150,60'], 160, { life: 1.6 })); }, draw() {} },
  beacon: { d: 8, sound: 'drum',
    draw(a, S, ctx, t) {
      const b = S.f.beacon(S), k = a.t < 1 ? a.t : a.t > 6.5 ? Math.max(0, (8 - a.t) / 1.5) : 1;
      flame(ctx, b.x, b.y, b.s * k, t, 3);
      if (!a.smoke) a.smoke = [];
      if (Math.random() < 0.5 && k > 0.5) a.smoke.push({ x: b.x + rnd(-6, 6), y: b.y - b.s * 0.8, r: b.s * 0.3, vx: rnd(6, 16), vy: -rnd(16, 30), l: 1 });
      a.smoke.forEach((q) => { q.x += q.vx * 0.016; q.y += q.vy * 0.016; q.r += 8 * 0.016; q.l -= 0.016 / 4.5; ctx.fillStyle = 'rgba(70,70,80,' + (0.4 * Math.max(0, q.l) * Math.min(1, k * 2)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); });
      a.smoke = a.smoke.filter((q) => q.l > 0);
    } },
  sweep: { d: 3.2, sound: 'sparkle',
    draw(a, S, ctx) {
      const u = a.t / a.d, x = S.px(-20) + (S.px(20) - S.px(-20)) * u, wd = S.k * 7;
      ctx.save(); ctx.beginPath(); ctx.rect(S.px(-13), S.py(40), S.k * 26, S.k * 40); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(x - wd, 0, x + wd, 0); gr.addColorStop(0, 'rgba(255,230,190,0)'); gr.addColorStop(0.5, 'rgba(255,230,190,.45)'); gr.addColorStop(1, 'rgba(255,230,190,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - wd, 0, wd * 2, S.h);
      ctx.restore();
    } },
  condor: { d: 6, sound: 'gust', start(S) { if (S.live.condor) S.live.condor.swoop = 6; }, draw() {} },
  snake: { d: 9, sound: 'rattle',
    draw(a, S, ctx) {
      const P = S.f.serpent, u = a.t / a.d, k = u > 0.85 ? (1 - u) / 0.15 : 1;
      ctx.save(); ctx.translate(S.cx, S.y0); ctx.scale(S.k, -S.k);
      ctx.fillStyle = 'rgba(40,30,20,' + (0.5 * k).toFixed(3) + ')'; poly(ctx, P.bal);                     // the balustrade falls into shadow
      for (let j = 0; j < 7; j++) {
        const on = Math.min(1, Math.max(0, (u * 1.35 - j * 0.11) / 0.12));
        if (on <= 0) continue;
        ctx.fillStyle = 'rgba(255,236,170,' + (0.95 * on * k).toFixed(3) + ')'; poly(ctx, P.tri(j));
      }
      ctx.restore();
    } },
  velarium: { d: 8, sound: 'cheer',
    draw(a, S, ctx) {
      const k = a.t < 1.5 ? a.t / 1.5 : a.t > 6.5 ? (8 - a.t) / 1.5 : 1;
      ctx.save(); ctx.translate(S.cx, S.y0); ctx.scale(S.k, -S.k); ctx.globalAlpha = 0.9;
      for (let x = -95; x < -8; x += 6) { ctx.fillStyle = (x / 6) % 2 ? '#F1E3C4' : '#E4D2AC'; poly(ctx, [[x, 48], [x + 5.6, 48], [x + 5.6 + (0 - x - 5.6) * 0.75 * k, 48 + 14 * k], [x + (0 - x) * 0.75 * k, 48 + 14 * k]]); }
      ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 0.25; for (let x = -95; x <= -8; x += 6) { ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x + (0 - x) * 0.75 * k, 48 + 14 * k); ctx.stroke(); }
      ctx.restore();
    } }
};
const a0 = {};
