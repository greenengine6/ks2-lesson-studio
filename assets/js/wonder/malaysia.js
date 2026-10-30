/* Wonders of Malaysia, drawn live on the Seven Wonders engine (wonders.js): twelve scenes at true scale, each with its
   own light, weather, sound and music, and something that happens when the class taps it.
   Mount Kinabalu at dawn and by day · the canopy walkway of Taman Negara · a Rafflesia on the forest floor · orangutans
   building a nest · proboscis monkeys leaping into a Borneo river · the Malayan tiger at dusk · bats pouring out of
   Deer Cave in Mulu · the fireflies of Kuala Selangor · a leatherback turtle nesting in Terengganu · the rhinoceros
   hornbill · the two monsoons on the east coast · Sang Kancil the mouse-deer.
   Static scenery is painted once into the background (far, mon in metres, near); animals and weather move every
   frame (LIVE); a tap starts an ACT. Tap captions come in English and Bahasa Melayu (say.text / say.bm). */
import { TAU, rnd, clamp, view, layer } from './util.js?v=cdc164df';
import { WONDER_SCENES as W, LIVE, ACTS, poly, rect, disc, ease } from './wonders.js?v=cdc164df';
import { seeded, tint, hills, burstParticles } from './scenery.js?v=cdc164df';
import { drawCreature } from './fauna.js?v=cdc164df';
import { Fx } from './music.js?v=cdc164df';
import { rgba, lin, rad, E, C, P, smoothPath, curve, haze, leafMass, treeline, giantTree, fern, bigLeaf, vine, coconut, casuarina, mangrove, berembang, pitcher, karst, cloudRow,
  longboat, sampan, perahu, stiltHouse, orangutan, proboscis, tiger, hornbill, leatherback, hatchling, kancil, crocHead, rafflesia, batTiny, glowDot } from './mydraw.js?v=cdc164df';

const small = () => view.small;
const sound = (S, name) => { if (S.soundOn) Fx.play(name); };
/* Inside a scene's mon() (drawn in metres, y up), draw with the kit in pixels: fn(g, X, Y, k), where X(m) and Y(m)
   turn metres into pixels and k is pixels per metre. */
function inPx(g, S, fn) { g.save(); g.scale(1 / S.k, -1 / S.k); g.translate(-S.cx, -S.y0); fn(g, (m) => S.px(m), (m) => S.py(m), S.k); g.restore(); }
/* the same kit for a scene's front(), which already draws in pixels */
const onScreen = (g, S, fn) => fn(g, (m) => S.px(m), (m) => S.py(m), S.k);
/* a big soft cloud: a bumpy mass, lit on top */
function cloudMass(g, x, y, w, h, top, bottom, R) {
  const pts = [], f = [R() * TAU, R() * TAU];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, b = 1 + 0.12 * Math.sin(a * 6 + f[0]) + 0.07 * Math.sin(a * 11 + f[1]) + (R() - 0.5) * 0.05; pts.push([x + Math.cos(a) * w / 2 * b, y + Math.sin(a) * h / 2 * b * (Math.sin(a) > 0 ? 0.55 : 1)]); }
  g.fillStyle = lin(g, 0, y - h / 2, 0, y + h * 0.3, [[0, top], [1, bottom]]); smoothPath(g, pts); g.fill();
}
function glowWarm(ctx, x, y, r) { ctx.fillStyle = rad(ctx, x, y, 0, r * 2.2, [[0, 'rgba(255,240,190,.95)'], [0.3, 'rgba(255,214,140,.55)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); }

/* ================= things that move (added to the engine's LIVE) ================= */
Object.assign(LIVE, {
  /* climbers' head torches on the summit trail of Kinabalu, before dawn */
  myClimb: { init() { return Array.from({ length: small() ? 12 : 22 }, (_, i) => ({ u: i / 22 + rnd(0, 0.03), v: rnd(0.010, 0.02), p: rnd(0, TAU) })); },
    step(a, S, dt) { a.forEach((q) => { q.u += q.v * dt * 0.25; if (q.u > 1) q.u -= 1; }); },
    draw(a, S, ctx, t) {
      if (S.phase !== 'dawn') return;
      const path = S.f.trail, n = path.length - 1;
      a.forEach((q) => { const f = q.u * n, i = Math.min(n - 1, Math.floor(f)), k = f - i, x = path[i][0] + (path[i + 1][0] - path[i][0]) * k, y = path[i][1] + (path[i + 1][1] - path[i][1]) * k; glowWarm(ctx, S.px(x), S.py(y), 3.2 + 1.1 * Math.sin(t * 3 + q.p)); });
    } },
  /* the canopy walkway of Taman Negara with people walking on it; it sways when tapped */
  myWalk: { init() { return { ppl: Array.from({ length: small() ? 5 : 8 }, (_, i) => ({ u: rnd(0, 1), v: rnd(0.012, 0.03) * (i % 2 ? 1 : -1), c: ['#E04E5A', '#3E7BE0', '#F2C14E', '#F08A3C', '#6AC46A', '#FFFFFF', '#9A5CE0'][i % 7], p: rnd(0, TAU) })), sway: 0 }; },
    step(a, S, dt) { a.ppl.forEach((q) => { q.u += q.v * dt; if (q.u > 1 || q.u < 0) { q.v = -q.v; q.u = clamp(q.u, 0, 1); } }); if (a.sway > 0) a.sway = Math.max(0, a.sway - dt); },
    draw(a, S, ctx, t) {
      const W2 = S.f.walk, sw = a.sway > 0 ? Math.sin(t * 7) * Math.min(1, a.sway) * 0.6 : Math.sin(t * 0.9) * 0.08;
      const at = (seg, u) => { const [x0, y0, x1, y1, sag] = seg, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * (sag + sw * 0.6); return [S.px(x + sw * Math.sin(u * Math.PI) * 0.4), S.py(y)]; };
      W2.forEach((seg) => {
        const pts = [], rail = [];
        for (let i = 0; i <= 24; i++) { const [x, y] = at(seg, i / 24); pts.push([x, y]); rail.push([x, y - S.k * 1.1]); }
        curve(ctx, rail, Math.max(1, S.k * 0.06), 'rgba(70,50,30,.9)');
        ctx.strokeStyle = 'rgba(90,70,40,.55)'; ctx.lineWidth = Math.max(0.6, S.k * 0.03);
        for (let i = 0; i <= 24; i += 2) { ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(rail[i][0], rail[i][1]); ctx.stroke(); }
        curve(ctx, pts, Math.max(1.5, S.k * 0.12), '#7A5A34');
      });
      a.ppl.forEach((q) => {
        const segs = W2.length, f = q.u * segs, si = Math.min(segs - 1, Math.floor(f)), [x, y] = at(W2[si], f - si), h = Math.max(5, 1.6 * S.k);
        const wob = a.sway > 0 ? Math.sin(t * 9 + q.p) * h * 0.08 : 0, st = Math.sin(t * 6 + q.p) * h * 0.1;
        ctx.fillStyle = q.c; ctx.fillRect(x - h * 0.13 + wob, y - h * 0.68, h * 0.26, h * 0.42); ctx.fillStyle = '#3A2A20'; C(ctx, x + wob, y - h * 0.82, h * 0.13);
        ctx.strokeStyle = '#2A2A3A'; ctx.lineWidth = Math.max(1, h * 0.08); ctx.beginPath(); ctx.moveTo(x - h * 0.05, y - h * 0.28); ctx.lineTo(x - h * 0.05 + st, y); ctx.moveTo(x + h * 0.05, y - h * 0.28); ctx.lineTo(x + h * 0.05 - st, y); ctx.stroke();
      });
    } },
  /* a longboat going up and down the river */
  myBoat: { init() { return { x: rnd(0.15, 0.5), dir: 1 }; },
    step(a, S, dt) { a.x += a.dir * dt * 0.022; if (a.x > 1.15) a.dir = -1; if (a.x < -0.15) a.dir = 1; },
    draw(a, S, ctx, t) {
      const r = S.f.river(S), x = r.x0 + (r.x1 - r.x0) * a.x, y = r.boatY, L = r.boatL;
      ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * L * 0.006); if (a.dir < 0) ctx.scale(-1, 1);
      ctx.strokeStyle = 'rgba(235,240,230,.4)'; ctx.lineWidth = 1.2; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-L * 0.5 - k * L * 0.12, -L * 0.01 + k * 2); ctx.lineTo(-L * 0.5 - k * L * 0.2, L * 0.02 + k * 3); ctx.stroke(); }
      longboat(ctx, 0, 0, L, { n: 6 }); ctx.restore();
    } },
  /* flies buzzing round the Rafflesia */
  myFlies: { init() { return Array.from({ length: 7 }, () => ({ a: rnd(0, TAU), r: rnd(0.25, 0.7), v: rnd(1.4, 3.2) * (Math.random() < 0.5 ? -1 : 1), h: rnd(0.1, 0.55), p: rnd(0, TAU) })); },
    step(a, S, dt) { a.forEach((q) => { q.a += q.v * dt; }); },
    draw(a, S, ctx, t) {
      const f = S.f.flower, cx = S.px(f.x), cy = S.py(f.y + 0.08), s = Math.max(1.2, S.k * 0.011);
      a.forEach((q) => { const x = cx + Math.cos(q.a) * q.r * S.k, y = cy - q.h * S.k + Math.sin(q.a * 1.7 + q.p) * S.k * 0.08; ctx.fillStyle = 'rgba(210,225,255,.4)'; E(ctx, x - s * 0.3, y - s * 0.8, s * 0.9, s * 0.4, Math.sin(t * 40 + q.p)); ctx.fillStyle = 'rgba(16,22,18,.9)'; E(ctx, x, y, s, s * 0.7); });
    } },
  /* the orangutans: the mother on her branch with her baby, and a big male hanging from a liana */
  myOrang: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const f = S.f.apes, act = S.acts.find((x) => x.kind === 'myNest'), k = act ? ease(Math.min(1, act.t / act.d * 1.4)) : 0, m = f.mother, ms = m.s * S.k;
      const sw = Math.sin(t * 0.55) * 0.12, hx = S.px(f.male.x), hy = S.py(f.male.top);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(sw);
      ctx.strokeStyle = '#3E3020'; ctx.lineWidth = Math.max(2, S.k * 0.045); ctx.beginPath(); ctx.moveTo(0, -S.k * 6); ctx.lineTo(0, S.k * 0.05); ctx.stroke();
      orangutan(ctx, 0, f.male.s * S.k * 1.7, f.male.s * S.k, { pose: 'hang', male: true, t: t + 2, seed: 31 });
      ctx.restore();
      orangutan(ctx, S.px(m.x), S.py(m.y), ms, { pose: k > 0 ? 'reach' : 'sit', k, t, seed: 7 });
      orangutan(ctx, S.px(m.x + m.s * 0.42), S.py(m.y + m.s * 0.3 + Math.sin(t * 1.3) * 0.02), ms * 0.4, { pose: 'sit', t: t * 1.4 + 1, seed: 19 });   // the baby, clinging to her
    } },
  /* proboscis monkeys sitting along the branch over the river */
  myMonkeys: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const act = S.acts.find((x) => x.kind === 'myLeap');
      S.f.troop.forEach((q, i) => { if (act && i === S.f.leaper) return; proboscis(ctx, S.px(q.x), S.py(q.y), q.s * S.k, { male: q.male, t: t + i * 1.7, flip: q.flip }); });
    } },
  /* the Malayan tiger, walking along the forest floor at dusk */
  myTiger: { init() { return { x: -0.9, dir: 1, ph: 0, wait: 1.5 }; },
    step(a, S, dt) {
      if (S.acts.some((x) => x.kind === 'myRoar')) return;
      if (a.wait > 0) { a.wait -= dt; return; }
      const lim = S.f.walkX; a.ph += dt * 3.4; a.x += a.dir * dt * 0.36;
      if (a.x > lim[1]) { a.x = lim[1]; a.dir = -1; a.wait = rnd(2.5, 4); } if (a.x < lim[0]) { a.x = lim[0]; a.dir = 1; a.wait = rnd(2.5, 4); }
    },
    draw(a, S, ctx, t) {
      const act = S.acts.find((x) => x.kind === 'myRoar'), roar = act ? Math.max(0, Math.sin(Math.min(1, act.t / 1.6) * Math.PI)) : 0;
      ctx.fillStyle = 'rgba(10,6,4,.35)'; E(ctx, S.px(a.x), S.py(S.f.groundY) + S.k * 0.02, S.k * 0.75, S.k * 0.06);
      tiger(ctx, S.px(a.x), S.py(S.f.groundY), 1.55 * S.k, { ph: a.ph, t, flip: a.dir < 0, still: a.wait > 0 || !!act, roar });
    } },
  /* millions of bats pouring out of Deer Cave in long, twisting ribbons */
  myBats: { init() { const n = small() ? 300 : 600; return { b: Array.from({ length: n }, () => ({ u: Math.random(), o: rnd(-1, 1), o2: rnd(-1, 1), v: rnd(0.035, 0.06), p: rnd(0, TAU), s: rnd(0.7, 1.3) })), boost: 0 }; },
    step(a, S, dt) { a.b.forEach((q) => { q.u += q.v * dt * (1 + a.boost); if (q.u > 1) { q.u -= 1; q.o = rnd(-1, 1); } }); if (a.boost > 0) a.boost = Math.max(0, a.boost - dt * 0.25); },
    draw(a, S, ctx, t) {
      const m = S.f.mouth, mx = S.px(m.x), my = S.py(m.y), vx = S.px(m.vx), vy = S.py(m.vy), R0 = m.r * S.k, endX = S.w * (m.endX || 1.1), endY = S.top + (S.y0 - S.top) * 0.1;
      ctx.fillStyle = 'rgba(18,12,20,.92)';
      const dense = a.boost > 0 ? 1 : 0.6;
      a.b.forEach((q, i) => {
        if (i / a.b.length > dense) return;
        let x, y;
        if (q.u < 0.12) { const k = q.u / 0.12; x = mx + (vx - mx) * k + q.o * R0 * 0.25; y = my + (vy - my) * k + q.o2 * R0 * 0.12; }
        else if (q.u < 0.55) { const k = (q.u - 0.12) / 0.43, ang = k * TAU * 2.6 + t * 0.4, rr = R0 * (0.5 + k * 0.9) * (1 + q.o * 0.18); x = vx + Math.cos(ang) * rr; y = vy - k * (vy - endY) * 0.55 + Math.sin(ang) * rr * 0.32 + q.o2 * R0 * 0.08; }
        else { const k = (q.u - 0.55) / 0.45, sx = vx + Math.cos(TAU * 2.6 + t * 0.4) * R0 * 1.4, sy = vy - (vy - endY) * 0.55; x = sx + (endX - sx) * k; y = sy + (endY - sy) * k + Math.sin(k * 7 + t * 0.8) * S.h * 0.04 + q.o * S.h * 0.018 * (1 + k); }
        batTiny(ctx, x, y, Math.max(1.6, S.s * 0.05 * q.s), Math.sin(t * 22 + q.p));
      });
    } },
  /* thousands of fireflies on the berembang trees, flashing together, and their light in the river */
  myFlash: { init(S) {
      const d = view.dpr || 1, r0 = Math.max(2.2, S.k * 0.11), trees = [], late = [];
      S.f.trees(S).forEach((tr, ti) => {
        const pad = r0 * 3, x0 = tr.x - tr.r * 1.25 - pad, y0 = tr.y - tr.r * 0.65 - pad, w = tr.r * 2.5 + pad * 2, h = tr.r * 1.3 + pad * 2, dim = layer(Math.ceil(w * d), Math.ceil(h * d)), lit = layer(Math.ceil(w * d), Math.ceil(h * d));
        const gd = dim.getContext('2d'), gl = lit.getContext('2d'); gd.scale(d, d); gl.scale(d, d);
        for (let i = 0; i < (small() ? 90 : 170); i++) {
          const a = rnd(0, TAU), r = Math.sqrt(Math.random()), x = tr.x + Math.cos(a) * r * tr.r * 1.2, y = tr.y + Math.sin(a) * r * tr.r * 0.6;
          if (Math.random() < 0.14) { late.push({ x, y, p: rnd(0.2, 0.45) + ti * 0.012 }); continue; }   // a few flash a little late
          glowDot(gd, x - x0, y - y0, r0 * 1.3, 1); glowDot(gl, x - x0, y - y0, r0 * 2.6, 1);
        }
        trees.push({ tr, ti, x0, y0, w, h, dim, lit });
      });
      return { trees, late, r0, burst: 0 };   // the ones that flash together are drawn once, then shown as one picture per tree
    },
    step(a, S, dt) { if (a.burst > 0) a.burst = Math.max(0, a.burst - dt); },
    draw(a, S, ctx, t) {
      const period = 0.58, wy = S.f.waterY(S), boost = a.burst > 0 ? 1.5 : 1, r0 = a.r0, on = (u) => { const ph = (u / period) % 1; return ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) : 0; };
      const wave = (x) => (a.burst > 0 ? x / S.w * 0.5 : 0);
      ctx.globalCompositeOperation = 'lighter';
      a.trees.forEach(({ tr, ti, x0, y0, w, h, dim, lit }) => {
        const k = on(t + ti * 0.012 + wave(tr.x)), R1 = tr.r * 1.5;
        ctx.fillStyle = rad(ctx, tr.x, tr.y, 0, R1, [[0, 'rgba(190,255,120,' + (0.16 * k * boost).toFixed(3) + ')'], [1, 'rgba(190,255,120,0)']]); ctx.fillRect(tr.x - R1, tr.y - R1, R1 * 2, R1 * 2);   // the whole tree lights up as they flash together
        ctx.globalAlpha = Math.min(1, 0.34 * boost); ctx.drawImage(dim, x0, y0, w, h);
        if (k > 0.01) { ctx.globalAlpha = Math.min(1, k * 0.8 * boost); ctx.drawImage(lit, x0, y0, w, h); }
        ctx.save(); ctx.translate(0, wy); ctx.scale(1, -0.85); ctx.translate(0, -wy);                             // and in the river
        ctx.globalAlpha = 0.06 + 0.22 * k; ctx.drawImage(lit, x0 + Math.sin(t * 2 + ti) * 2, y0, w, h); ctx.restore();
        ctx.globalAlpha = 1;
      });
      a.late.forEach((q) => { const k = on(t + q.p + wave(q.x)) * 0.78 + 0.26; glowDot(ctx, q.x, q.y, (r0 + k * r0 * 1.5) * boost, k); });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    } },
  /* a sampan drifting along the dark river */
  mySampan: { init() { return { x: 0.3 }; }, step(a, S, dt) { a.x += dt * 0.006; if (a.x > 1.1) a.x = -0.1; },
    draw(a, S, ctx, t) { const b = S.f.boat(S); sampan(ctx, b.x0 + (b.x1 - b.x0) * a.x, b.y + Math.sin(t * 1.2) * 1.2, b.L, { col: '#03050A' }); } },
  /* waves running up the beach and sliding back */
  mySurf: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const b = S.f.surf(S), rough = S.f.rough ? S.f.rough(S) : 0, col = b.c || '236,244,252';
      for (let k = 0; k < 4; k++) {
        const ph = ((t * (0.1 + rough * 0.04) + k / 4) % 1), y = b.y0 + (b.y1 - b.y0) * ph, amp = (b.amp || 3) * (1 + rough * 2.2) * (0.4 + ph), al = Math.sin(ph * Math.PI), wy = (x) => y + Math.sin(x / (40 + k * 9) + t * 0.7 + k) * amp;
        ctx.fillStyle = 'rgba(' + col + ',' + (0.14 * al).toFixed(3) + ')';                                  // the foam behind each wave
        ctx.beginPath(); for (let x = b.x0; x <= b.x1; x += 12) { if (x === b.x0) ctx.moveTo(x, wy(x)); else ctx.lineTo(x, wy(x)); }
        for (let x = b.x1; x >= b.x0; x -= 12) ctx.lineTo(x, wy(x) - (6 + rough * 10) * (0.4 + ph)); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(' + col + ',' + (0.8 * al).toFixed(3) + ')'; ctx.lineWidth = 1.4 + ph * (1.6 + rough * 2.6);
        ctx.beginPath(); for (let x = b.x0; x <= b.x1; x += 10) { if (x === b.x0) ctx.moveTo(x, wy(x)); else ctx.lineTo(x, wy(x)); } ctx.stroke();
      }
    } },
  /* the leatherback, digging her nest */
  myTurtle: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const f = S.f.nest, x = S.px(f.x), y = S.py(f.y), L = 1.9 * S.k, digging = Math.sin(t * 0.35) > -0.3;
      leatherback(ctx, x, y, L, { t, dig: digging ? 1 : 0, flip: true });
      if (digging) { ctx.fillStyle = 'rgba(214,196,160,.9)'; for (let k = 0; k < 7; k++) { const ph = (t * 1.6 + k / 7) % 1; E(ctx, x + L * 0.52 + ph * L * 0.3, y - L * 0.05 - Math.sin(ph * Math.PI) * L * 0.16, Math.max(1, L * 0.01), Math.max(1, L * 0.007)); } }
    } },
  /* rain, slanting in the wind */
  myRain: { init(S) { return Array.from({ length: small() ? 160 : 340 }, () => ({ x: rnd(0, S.w * 1.3), y: rnd(-S.h, S.h), l: rnd(12, 26), v: rnd(800, 1100) })); },
    step(a, S, dt) { if (S.phase === 'sw') return; a.forEach((q) => { q.y += q.v * dt; q.x -= q.v * 0.3 * dt; if (q.y > S.h) { q.y = rnd(-80, -10); q.x = rnd(0, S.w * 1.3); } }); },
    draw(a, S, ctx) { if (S.phase === 'sw') return; ctx.strokeStyle = 'rgba(205,218,232,.36)'; ctx.lineWidth = 1.1; ctx.beginPath(); a.forEach((q) => { ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + q.l * 0.3, q.y - q.l); }); ctx.stroke(); } },
  /* fishing boats out at sea in the calm southwest monsoon */
  myBoats: { init() { return [0.2, 0.55, 0.8].map((u, i) => ({ u, v: rnd(0.004, 0.01) * (i % 2 ? -1 : 1), d: rnd(0.2, 0.8) })); },
    step(a, S, dt) { a.forEach((q) => { q.u += q.v * dt; if (q.u > 1.1) q.u = -0.1; if (q.u < -0.1) q.u = 1.1; }); },
    draw(a, S, ctx, t) {
      if (S.phase !== 'sw') return;
      const b = S.f.bay(S);
      a.forEach((q, i) => { const y = b.y0 + (b.y1 - b.y0) * q.d, L = b.L * (0.45 + q.d * 0.55); perahu(ctx, b.x0 + (b.x1 - b.x0) * q.u, y + Math.sin(t * 1.4 + i) * L * 0.02, L, [['#2E6FB0', '#F2C14E', '#D7263D'], ['#1E8A5A', '#FFFFFF', '#E04E5A'], ['#D7263D', '#F2C14E', '#2E6FB0']][i % 3], q.v < 0); });
    } },
  /* the rhinoceros hornbills: one perched among the figs, one now and then flying past */
  myHorn: { init() { return { fly: -6, flyDir: 1, flyY: 0.3 }; },
    step(a, S, dt) { a.fly += dt; if (a.fly > 14) { a.fly = -rnd(4, 9); a.flyDir = Math.random() < 0.5 ? 1 : -1; a.flyY = rnd(0.15, 0.4); } },
    draw(a, S, ctx, t) {
      const f = S.f.perch, act = S.acts.find((x) => x.kind === 'myTakeoff'), s = 1.15 * S.k;
      if (a.fly > 0 && a.fly < 8) { const k = a.fly / 8, x = a.flyDir > 0 ? -60 + (S.w + 120) * k : S.w + 60 - (S.w + 120) * k, y = S.top + (S.y0 - S.top) * a.flyY + Math.sin(k * 6) * 10; hornbill(ctx, x, y, s * 0.4, { fly: t * 6, flip: a.flyDir < 0 }); }
      const x0 = S.px(f.x), y0 = S.py(f.y);
      if (act) {
        const k = act.t / act.d;
        if (k < 0.82) { const x = x0 + S.w * 0.7 * k, y = y0 - Math.sin(k * Math.PI) * S.h * 0.22 - k * S.h * 0.06; hornbill(ctx, x, y, s, { fly: t * 7 }); }
        else { ctx.globalAlpha = (k - 0.82) / 0.18; hornbill(ctx, x0, y0, s, {}); ctx.globalAlpha = 1; }
        return;
      }
      hornbill(ctx, x0, y0 + (Math.sin(t * 0.8) > 0.92 ? -s * 0.02 : 0), s, {});
    } },
  /* the things in front of the sea (houses, boats, trees), painted once and drawn over the waves */
  myFront: { init() { return {}; }, step() {},
    draw(a, S, ctx) {
      const d = view.dpr || 1, key = S.phase + ':' + S.w + 'x' + S.h + ':' + S.k.toFixed(4) + ':' + d;
      if (a.key !== key) { a.key = key; a.c = layer(Math.round(S.w * d), Math.round(S.h * d)); const g = a.c.getContext('2d'); g.scale(d, d); S.f.front(g, S, S.phase, seeded(91)); }
      ctx.drawImage(a.c, 0, 0, S.w, S.h);
    } },
  /* coconut palms, bent and thrashed by the monsoon wind or swaying in the breeze */
  myPalms: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const ne = S.phase === 'ne', R = seeded(57);
      S.f.palms.forEach(([x, hh, lean], i) => { const sway = ne ? -0.5 + 0.22 * Math.sin(t * 1.3 + i) + 0.1 * Math.sin(t * 3.4 + i * 2) : 0.07 * Math.sin(t * 0.8 + i); coconut(ctx, S.px(x), S.py(-0.1), hh * S.k, ne ? -0.32 + lean * 0.3 : lean, R, { leaf: ne ? '#2E5A34' : '#3F8A3A', trunk: ne ? '#6E5E48' : '#8A7357', sway }); });
    } },
  /* rows of waves rolling in to the beach: big grey breakers in the northeast monsoon, small blue ones in the southwest */
  myBreakers: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const b = S.f.surf(S), ne = S.phase === 'ne', n = ne ? 5 : 4, span = b.y1 - b.y0, speed = ne ? 0.07 : 0.045;
      const body = ne ? ['#5A7478', '#93ACAA', '#33464C'] : ['#2C88B6', '#8ACADC', '#1F6A98'];
      const rows = []; for (let k = 0; k < n; k++) rows.push([(t * speed + k / n) % 1, k]);
      rows.sort((p, q) => p[0] - q[0]);
      rows.forEach(([ph, k]) => {
        const y = b.y0 + span * Math.pow(ph, 1.25), grow = 0.12 + ph * 0.88, H = (ne ? S.h * 0.055 : S.h * 0.012) * grow, al = Math.min(1, ph * 5) * (ph > 0.88 ? Math.max(0, (1 - ph) / 0.12) : 1);
        const lam = S.w * (ne ? 0.1 : 0.16) * (0.5 + ph * 0.7), p2 = k * 1.7 + t * (ne ? 0.5 : 0.25);
        const crest = (x) => y - H * (0.6 + 0.28 * Math.sin(x / lam + p2) + 0.12 * Math.sin(x / (lam * 0.37) - p2 * 1.3));
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(-8, y + H * 0.25); for (let x = -8; x <= S.w + 8; x += 8) ctx.lineTo(x, crest(x)); ctx.lineTo(S.w + 8, y + H * 0.25); ctx.closePath();
        ctx.fillStyle = lin(ctx, 0, y - H, 0, y + H * 0.25, [[0, body[1]], [0.45, body[0]], [1, body[2]]]); ctx.fill();   // the face of the wave
        ctx.beginPath(); for (let x = -8; x <= S.w + 8; x += 8) ctx.lineTo(x, crest(x) - H * 0.07 * (1 + Math.sin(x * 0.13 + t * 3 + k))); for (let x = S.w + 8; x >= -8; x -= 8) ctx.lineTo(x, crest(x) + H * (0.1 + 0.08 * Math.sin(x * 0.05 + k)) * (ne ? 1 : 0.6));
        ctx.closePath(); ctx.fillStyle = 'rgba(242,248,248,.92)'; ctx.fill();                                          // white foam along its crest
        if (ne && ph > 0.5) { ctx.fillStyle = 'rgba(236,244,246,.5)'; ctx.beginPath(); for (let j = 0; j < 40; j++) { const x = ((j * 97.3 + k * 41) % 1) * S.w + ((j * 53) % 23), sy = crest(x) - H * (0.1 + ((t * 2 + j * 0.37) % 1) * 0.5); ctx.moveTo(x + 1.6, sy); ctx.ellipse(x, sy, 1.6, 1.2, 0, 0, TAU); } ctx.fill(); }   // spray blown off the top
        ctx.globalAlpha = 1;
      });
      const wp = (t * speed * n) % 1, reach = (ne ? S.h * 0.03 : S.h * 0.015) * Math.sin(wp * Math.PI);           // the wash sliding up the sand and back
      ctx.fillStyle = 'rgba(236,244,244,' + (0.4 * Math.sin(wp * Math.PI)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(-8, b.y1); for (let x = -8; x <= S.w + 8; x += 10) ctx.lineTo(x, b.y1 + reach * (0.7 + 0.3 * Math.sin(x * 0.015 + t * 0.4))); ctx.lineTo(S.w + 8, b.y1); ctx.closePath(); ctx.fill();
    } },
  /* the mouse-deer, and the Year 4 pupil who has spotted it */
  myKancil: { init() { return {}; }, step() {},
    draw(a, S, ctx, t) {
      const f = S.f.deer, act = S.acts.find((x) => x.kind === 'myHop');
      drawCreature(ctx, 'pupil', S.px(f.pupil), S.py(0.65), 1.3 * S.k * 0.98, { rest: true, t: 0.4, ph: 0.9 });
      if (act) return;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; E(ctx, S.px(f.x), S.py(0), S.k * 0.2, S.k * 0.025);
      kancil(ctx, S.px(f.x), S.py(0), 0.2 * S.k, { still: true, t });
    } }
});

/* ================= what a tap starts (added to the engine's ACTS) ================= */
Object.assign(ACTS, {
  myCanopy: { d: 4, sound: 'wings', start(S) { if (S.live.myWalk) S.live.myWalk.sway = 3; const c = S.f.walk[0]; S.fx.push(...burstParticles(S.px(c[2]), S.py(c[3] + 14), 14, ['#2A2A3A'], 160, { kind: 'bird', up: 150, life: 4 })); }, draw() {} },
  myFliesCome: { d: 6, sound: 'rustle', again: true,
    start(S) { const L = S.live.myFlies; if (L && L.length < 26) for (let i = 0; i < 6; i++) L.push({ a: rnd(0, TAU), r: rnd(0.3, 0.9), v: rnd(1.6, 3.4) * (Math.random() < 0.5 ? -1 : 1), h: rnd(0.15, 0.7), p: rnd(0, TAU) }); },
    draw(a, S, ctx, t) {
      const f = S.f.flower, cx = S.px(f.x), cy = S.py(f.y + 0.2), k = ease(a.t / a.d);
      ctx.strokeStyle = 'rgba(200,210,130,' + (0.32 * k).toFixed(3) + ')'; ctx.lineWidth = Math.max(1.5, S.k * 0.012);
      for (let j = 0; j < 4; j++) { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, y = cy - u * S.k * 0.9, x = cx + (j - 1.5) * S.k * 0.12 + Math.sin(u * 8 + t * 3 + j) * S.k * 0.05; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }   // the smell, rising
    } },
  myNest: { d: 7, sound: 'orangutan',
    draw(a, S, ctx) {
      const m = S.f.apes.mother, k = Math.min(1, a.t / 5.5), x = S.px(m.x), y = S.py(m.y - 0.04), r = S.k * (0.55 + 0.3 * k), R = seeded(77);
      for (let i = 0; i < 30 * k; i++) { const ang = Math.PI + (i / 30) * Math.PI, rr = r * (0.8 + R() * 0.3); ctx.strokeStyle = i % 2 ? '#5E7A2E' : '#4A3A22'; ctx.lineWidth = Math.max(1, S.k * 0.025); ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * rr, y - Math.sin(ang) * rr * 0.3); ctx.lineTo(x + Math.cos(ang) * rr * 0.3, y + S.k * 0.04); ctx.stroke(); ctx.fillStyle = i % 3 ? '#5E8A34' : '#7AA244'; E(ctx, x + Math.cos(ang) * rr, y - Math.sin(ang) * rr * 0.3, S.k * 0.07, S.k * 0.035, ang); }
    } },
  myLeap: { d: 6.5, sound: 'monkeys',
    draw(a, S, ctx, t) {
      const q = S.f.troop[S.f.leaper], wy = S.f.river(S).y, x0 = S.px(q.x), y0 = S.py(q.y), x1 = x0 + S.k * 0.7, s = q.s * S.k;
      if (a.t < 1.1) { const k = a.t / 1.1, x = x0 + (x1 - x0) * k, y = y0 + (wy - y0) * k * k - Math.sin(k * Math.PI) * S.k * 0.8; ctx.save(); ctx.translate(x, y); ctx.rotate(k * 0.9); proboscis(ctx, 0, 0, s, { t }); ctx.restore(); return; }
      if (!a.splashed) { a.splashed = 1; S.fx.push(...burstParticles(x1, wy, 50, ['210,240,255'], 200, { kind: 'drop', up: 190, life: 1.2, size: 0.9 })); sound(S, 'splash'); }
      const k = (a.t - 1.1) / 5.4, x = x1 - k * S.k * 2.2;
      for (let j = 0; j < 3; j++) { const rk = ((a.t - 1.1) * 0.8 + j / 3) % 1; ctx.strokeStyle = 'rgba(230,245,250,' + (0.5 * (1 - rk)).toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, wy + 2, S.k * (0.2 + rk * 0.7), S.k * (0.05 + rk * 0.16), 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#B0582A'; C(ctx, x, wy - s * 0.04, s * 0.14); ctx.fillStyle = '#E2B08E'; E(ctx, x - s * 0.1, wy - s * 0.02, s * 0.06, s * 0.05);   // its head above the water, swimming across
    } },
  myRoar: { d: 2.6, sound: 'roar', draw(a, S, ctx) { if (a.t > 1.4) return; const k = a.t / 1.4, L = S.live.myTiger, d = L.dir > 0 ? 1 : -1, x = S.px(L.x) + d * S.k * 0.95, y = S.py(S.f.groundY + 0.75); ctx.strokeStyle = 'rgba(255,236,210,' + (0.4 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = Math.max(2, S.k * 0.02); for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(x, y, S.k * (0.25 + k * 1.1 + j * 0.25), d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); ctx.stroke(); } } },
  myBatsWave: { d: 6, sound: 'bats', again: true, start(S) { if (S.live.myBats) S.live.myBats.boost = 1.6; }, draw() {} },
  myGlow: { d: 5, sound: 'glow', again: true, start(S) { if (S.live.myFlash) S.live.myFlash.burst = 5; }, draw() {} },
  myHatch: { d: 9, sound: 'hatch',
    start(S) { const n = S.f.nest; a1.hatch = Array.from({ length: small() ? 14 : 24 }, () => ({ x: S.px(n.hx) + rnd(-1, 1) * S.k * 0.3, y: S.py(0) + rnd(-1, 1) * S.k * 0.1, v: rnd(0.5, 0.9), d: rnd(0, 0.9), p: rnd(0, TAU), w: rnd(-0.4, 0.4) })); },
    draw(a, S, ctx, t) {
      const sea = S.f.surf(S).y1;
      (a1.hatch || []).forEach((q) => { const k = Math.max(0, a.t - q.d); if (!k) return; const y = q.y + (sea - q.y) * Math.min(1, k * q.v * 0.18), x = q.x + q.w * S.k * k * 0.3; if (y <= sea) return; hatchling(ctx, x, y, Math.max(3, S.k * 0.1), -Math.PI / 2 + q.w * 0.3, t * 9 + q.p); });
    } },
  myTakeoff: { d: 6.5, sound: 'hornbill', draw() {} },
  myHop: { d: 6.5, sound: 'rustle',
    draw(a, S, ctx, t) {
      const f = S.f.deer, crocs = f.crocs, k = a.t, up = Math.min(1, k / 0.8) * (k > 5.6 ? Math.max(0, (6.5 - k) / 0.9) : 1);
      crocs.forEach((c) => crocHead(ctx, S.px(c), S.py(f.waterY) + (1 - up) * S.k * 0.1, 0.34 * S.k, { t, col: '#6A7646' }));
      const stops = [f.x, ...crocs, f.far], hopT = 0.75, start = 1.0, end = start + (stops.length - 1) * hopT;
      let x = f.x, hop = 0;
      if (k > start) { const j = Math.min(stops.length - 2, Math.floor((k - start) / hopT)), u = Math.min(1, ((k - start) - j * hopT) / hopT); x = stops[j] + (stops[j + 1] - stops[j]) * u; hop = Math.sin(u * Math.PI) * 0.22 * S.k; if (k > end) { x = f.far; hop = 0; } }
      if (!a.done && k > end) { a.done = 1; sound(S, 'splash'); }
      const y = k > start && k < end ? S.py(f.waterY) - S.k * 0.07 : S.py(k >= end ? f.farY : 0);
      kancil(ctx, S.px(x), y, 0.2 * S.k, { hop, ph: t * 8, still: hop === 0, t });
    } }
});
const a1 = {};

/* ================= the scenes ================= */
const M = {};

/* ---------- Mount Kinabalu: the granite crown above a sea of cloud, at dawn and by day ---------- */
// the skyline of the summit plateau from west to east, in metres: St John's Peak, the Donkey's Ears, Low's Peak (the
// top, 4,095 m), Alexandra Peak and Victoria Peak. Heights are above the cloud sea, not above the sea.
const KIN = [[-2300, 2240], [-2050, 2520], [-1880, 2660], [-1760, 2700], [-1660, 2830], [-1560, 2800], [-1490, 3010], [-1440, 2960], [-1330, 2990], [-1220, 2940], [-1120, 3060], [-1010, 3200], [-930, 3262],
  [-850, 3240], [-790, 3150], [-745, 3090], [-700, 3260], [-668, 3300], [-630, 3180], [-585, 3110], [-545, 3270], [-505, 3248], [-470, 3130], [-380, 3150], [-280, 3230], [-170, 3330], [-70, 3390], [0, 3400],
  [80, 3392], [170, 3345], [250, 3260], [300, 3205], [360, 3290], [400, 3302], [440, 3270], [520, 3180], [640, 3215], [740, 3130], [850, 3170], [960, 3060], [1080, 3130], [1170, 3070], [1300, 2990],
  [1430, 3010], [1530, 3120], [1580, 3135], [1640, 3030], [1780, 2900], [1930, 2720], [2120, 2520], [2350, 2230]];
const PEAKS = [6, 12, 17, 20, 27, 33, 40, 45], GRANITE_BASE = 2470;
const KIN_BODY = [[-7000, -60], [-5600, 300], [-4900, 560], [-4500, 640], [-3900, 1000], [-3300, 1330], [-3000, 1420], [-2700, 1700], [-2450, 2000], ...KIN,
  [2550, 1950], [2800, 1700], [3200, 1450], [3500, 1380], [3900, 1050], [4600, 640], [5200, 480], [7000, -60]];
const kinFoot = (x) => GRANITE_BASE - 30 + 55 * Math.sin(x * 0.0042 + 0.5) + 25 * Math.sin(x * 0.011 + 2);   // where the granite meets the forest
const pathOf = (g, pts, X, Y) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X ? X(p[0]) : p[0], Y ? Y(p[1]) : p[1]) : g.moveTo(X ? X(p[0]) : p[0], Y ? Y(p[1]) : p[1]))); g.closePath(); };
M.kinabalu = {
  size: [6200, 3500], wide: 0.95, wideSm: 1.3, horizon: 0.3, y0Sm: 0.53, fit: 0.97, phases: ['dawn', 'day'],
  sky: (ph) => (ph === 'dawn' ? ['#101236', '#2A2656', '#7E4A78', '#F0A070'] : ['#1E5AA8', '#5C9FDB', '#AFD0EC', '#E6EEF2']),
  light: (ph) => (ph === 'dawn' ? { sun: { x: 0.86, y: 0.52, c: '255,176,112', big: true } } : { sun: { x: 0.16, y: 0.13, disc: 0.024 } }),
  sound: 'mountain', music: 'sape', live: ['mist', 'myClimb', 'birds'], tap: 'phase', mist: { n: 7, y0: -0.24, span: 0.12, a: 0.16 }, birds: { n: 3, c: 'rgba(40,40,60,.7)' },
  trail: [[-480, 2420], [-380, 2600], [-520, 2760], [-330, 2900], [-430, 3060], [-210, 3180], [-120, 3300], [0, 3400]],
  says: {
    dawn: [
      { kind: 'Mount Kinabalu', text: 'Climbers set off at about 2 o’clock in the morning to reach Low’s Peak, the very top, by sunrise.', bmKind: 'Gunung Kinabalu', bm: 'Pendaki bertolak kira-kira pukul 2 pagi untuk sampai ke Puncak Low, puncak tertinggi, sebelum matahari terbit.' },
      { kind: 'Mount Kinabalu', text: 'Their head torches make a line of lights up the mountain. Tap again for daytime.', bmKind: 'Gunung Kinabalu', bm: 'Lampu kepala mereka membentuk barisan cahaya di gunung. Ketik lagi untuk waktu siang.' }
    ],
    day: [
      { kind: 'Mount Kinabalu', text: 'Below the bare granite top grows a cloud forest, full of mosses and orchids.', bmKind: 'Gunung Kinabalu', bm: 'Di bawah puncak granit yang gondol tumbuh hutan awan yang penuh dengan lumut dan orkid.' },
      { kind: 'Mount Kinabalu', text: 'The giant pitcher plant Nepenthes rajah grows only here and on one mountain nearby.', bmKind: 'Gunung Kinabalu', bm: 'Periuk kera gergasi Nepenthes rajah hanya tumbuh di sini dan di sebuah gunung berdekatan.' },
      { kind: 'Mount Kinabalu', text: 'Its pitchers can hold more than two litres of water! Tap again for sunrise.', bmKind: 'Gunung Kinabalu', bm: 'Periuknya boleh memuatkan lebih daripada dua liter air! Ketik lagi untuk matahari terbit.' }
    ]
  },

  far(g, S, ph) {
    const w = S.w, h = S.h, dawn = ph === 'dawn';
    hills(g, w, S.hor + h * 0.03, S.s * 0.8, dawn ? '#3E3054' : '#93AAC0', 31);
    haze(g, w, S.hor - h * 0.04, S.hor + h * 0.06, dawn ? '#C88290' : '#DCE8EE', 0.4);
    hills(g, w, S.hor + h * 0.08, S.s * 1.0, dawn ? '#2E2646' : '#7A96A4', 32);
    haze(g, w, S.hor + h * 0.02, S.hor + h * 0.14, dawn ? '#B07890' : '#DCE8EE', 0.35);
  },
  mon(g, S, ph, R) {
    const dawn = ph === 'dawn', d = dawn ? 1 : -1;                                 // d: the side the sun is on (dawn: the east, on the right)
    // the forested slopes below the granite
    g.fillStyle = lin(g, 0, 2500, 0, 0, dawn ? [[0, '#304844'], [0.45, '#1C2C2E'], [1, '#2E3C50']] : [[0, '#5C8A54'], [0.45, '#2F5E3A'], [1, '#62887C']]); poly(g, KIN_BODY);
    g.save(); pathOf(g, KIN_BODY); g.clip();
    g.fillStyle = lin(g, -4500, 0, 4500, 0, dawn ? [[0, 'rgba(8,6,28,.4)'], [0.55, 'rgba(8,6,28,0)'], [1, 'rgba(240,150,110,.18)']] : [[0, 'rgba(230,250,190,.16)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,20,10,.28)']]);
    g.fillRect(-7000, -100, 14000, 3600);
    g.restore();
    inPx(g, S, (g, X, Y, k) => {                                                   // the forest, too far away to see one tree at a time: soft dapples and a fine grain of treetops
      g.save(); pathOf(g, KIN_BODY, X, Y); g.clip();
      for (let i = 0; i < 170; i++) { const x = X(-5500 + R() * 11000), y = Y(R() * 2400), r = 10 + R() * 36; g.fillStyle = rad(g, x, y, 0, r, [[0, R() < 0.5 ? (dawn ? 'rgba(120,150,150,.13)' : 'rgba(170,215,120,.15)') : 'rgba(0,10,8,.17)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(x - r, y - r, r * 2, r * 2); }
      const n = Math.round(2800 * Math.min(1, k * 6));
      for (let i = 0; i < n; i++) { const x = X(-5800 + R() * 11600), y = Y(R() * 2420); g.fillStyle = R() < 0.55 ? (dawn ? 'rgba(130,166,156,.15)' : 'rgba(184,224,132,.2)') : 'rgba(0,12,8,.2)'; E(g, x, y, 0.8 + R() * 1.3, 0.6 + R() * 0.9); }
      // spurs running down from the granite: a crisp crest, a soft shadow on the side away from the sun, a little light on the other
      const soft = (pts, W, side, col, al, n) => { for (let i = 1; i <= n; i++) { const wi = W * i / n; curve(g, pts.map(([qx, qy]) => [qx + side * wi / 2, qy]), wi, rgba(col, (al / n).toFixed(3))); } };
      const ridge = (x, y, ang, len, W, depth) => {
        const pts = [[x, y]]; let a = ang;
        for (let i = 0; i < 10; i++) { a += (R() - 0.5) * 0.2; const [qx, qy] = pts[pts.length - 1]; pts.push([qx + Math.cos(a) * len / 10, qy + Math.sin(a) * len / 10]); }
        soft(pts, W, -d, dawn ? '#04061A' : '#06240F', 0.34, 6);
        soft(pts, W * 0.45, d, dawn ? '#F0A882' : '#D8F0A8', 0.2, 4);
        if (depth < 1 && R() < 0.75) { const p = pts[3 + Math.floor(R() * 5)]; ridge(p[0], p[1], ang + (x < X(0) ? 0.45 : -0.45) * (0.7 + R() * 0.6), len * (0.4 + R() * 0.25), W * 0.6, depth + 1); }
      };
      g.lineCap = 'round'; g.lineJoin = 'round';
      [-1900, -1250, -560, 120, 780, 1420, 2020].forEach((x0) => { const x = x0 + (R() - 0.5) * 160, ang = Math.PI / 2 - (x / 2500) * 0.9 + (R() - 0.5) * 0.12; ridge(X(x), Y(kinFoot(x) - 50), ang, (kinFoot(x) - 650) * k / Math.max(0.5, Math.sin(ang)), Math.max(8, k * (220 + R() * 140)), 0); });
      g.fillStyle = lin(g, 0, Y(1500), 0, Y(700), dawn ? [[0, 'rgba(150,120,160,0)'], [1, 'rgba(150,120,160,.4)']] : [[0, 'rgba(200,220,230,0)'], [1, 'rgba(200,220,230,.45)']]); g.fillRect(X(-7000), Y(1500), X(7000) - X(-7000), Y(600) - Y(1500));   // haze over the lower slopes, above the cloud
      g.restore();
    });
    // the granite crown: pale rock, each main peak with a sunlit face and a shadowed face, cut by gullies and streaked by rain
    const lit = dawn ? '#F6B68C' : '#E8EAE6', shade = dawn ? '#544264' : '#788088', mid = dawn ? '#A27C92' : '#B6BAB8', foot = GRANITE_BASE - 80;
    const crown = [...KIN.slice(1, -1)]; for (let x = 2050; x >= -1990; x -= 60) crown.push([x, kinFoot(x) - 30]);
    g.fillStyle = lin(g, 0, 3400, 0, GRANITE_BASE, [[0, tint(mid, 0.1)], [1, tint(mid, -0.12)]]); poly(g, crown);
    g.save(); pathOf(g, crown); g.clip();
    const lean = (x) => Math.sin(x * 0.0061 + 1.3) * 160;                         // ridges and gullies don't run straight down
    PEAKS.forEach((i) => {
      const [px, py] = KIN[i], rx = px + lean(px) * 0.4;
      [-1, 1].forEach((side) => {
        let j = i; while (KIN[j + side] && KIN[j + side][1] <= KIN[j][1]) j += side;
        const [nx] = KIN[j], pts = [];
        for (let m = i; m !== j + side; m += side) pts.push(KIN[m]);
        pts.push([nx + lean(nx), foot], [rx, foot]);
        const sunny = side === d, c = sunny ? lit : shade;
        g.fillStyle = lin(g, 0, py, 0, foot, sunny ? [[0, rgba(c, 0.78)], [0.55, rgba(c, 0.3)], [1, rgba(c, 0.06)]] : [[0, rgba(c, 0.8)], [0.55, rgba(c, 0.42)], [1, rgba(c, 0.12)]]);
        poly(g, pts);
      });
    });
    for (let i = 0; i < 46; i++) {                                                 // dark streaks where the rain runs down the granite
      const x = -1950 + R() * 3950, top = GRANITE_BASE + 60 + R() * 640, L = 90 + R() * 300;
      g.strokeStyle = dawn ? 'rgba(40,20,48,' + (0.1 + R() * 0.14).toFixed(2) + ')' : 'rgba(46,52,58,' + (0.1 + R() * 0.14).toFixed(2) + ')'; g.lineWidth = 4 + R() * 7;
      g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + (R() - 0.5) * 30, top - L * 0.5, x + (R() - 0.5) * 50, top - L); g.stroke();
    }
    g.fillStyle = lin(g, 0, GRANITE_BASE + 300, 0, GRANITE_BASE - 40, [[0, 'rgba(20,10,30,0)'], [1, dawn ? 'rgba(20,10,30,.5)' : 'rgba(30,36,40,.42)']]); g.fillRect(-2400, GRANITE_BASE - 60, 4800, 360);   // the steep cliffs at its foot, in shadow
    g.restore();
    // South Peak: the sharp spire standing in front
    const sp = [[230, 2470], [360, 2700], [420, 2790], [445, 2930], [500, 3080], [545, 3165], [585, 3090], [610, 3040], [650, 2930], [700, 2880], [760, 2700], [860, 2470]];
    g.fillStyle = lin(g, 0, 3165, 0, 2470, [[0, tint(mid, 0.05)], [1, tint(mid, -0.2)]]); poly(g, sp);
    g.fillStyle = lin(g, 0, 3165, 0, 2470, [[0, rgba(dawn ? lit : shade, 0.85)], [1, rgba(dawn ? lit : shade, 0.2)]]); poly(g, [[545, 3165], [585, 3090], [610, 3040], [650, 2930], [700, 2880], [760, 2700], [860, 2470], [600, 2470]]);
    g.fillStyle = lin(g, 0, 3165, 0, 2470, [[0, rgba(dawn ? shade : lit, 0.75)], [1, rgba(dawn ? shade : lit, 0.15)]]); poly(g, [[545, 3165], [500, 3080], [445, 2930], [420, 2790], [360, 2700], [230, 2470], [560, 2470]]);
    inPx(g, S, (g, X, Y, k) => {                                                   // the last stunted trees and scrub at the foot of the granite
      const sc = dawn ? '#1C2A2A' : '#2C5432', top = (x) => kinFoot(x) - 34 - (Math.abs(x) > 1900 ? (Math.abs(x) - 1900) * 1.2 : 0);
      g.fillStyle = lin(g, 0, Y(GRANITE_BASE), 0, Y(GRANITE_BASE - 300), [[0, sc], [0.4, rgba(sc, 0.7)], [1, rgba(sc, 0)]]); g.beginPath(); g.moveTo(X(-2060), Y(GRANITE_BASE - 300));
      for (let x = -2060; x <= 2110; x += 10) g.lineTo(X(x), Y(top(x)));
      g.lineTo(X(2110), Y(GRANITE_BASE - 300)); g.closePath(); g.fill();
      g.fillStyle = sc; for (let x = -2040; x <= 2090; x += 18 + R() * 22) { const r = Math.max(1.2, k * (14 + R() * 16)); g.beginPath(); g.arc(X(x), Y(top(x)) + r * 0.5, r, Math.PI, 0); g.fill(); }   // the round tops of stunted trees
    });
    g.fillStyle = dawn ? '#2A2028' : '#E8E2D6'; rect(g, -560, 2400, 150, 46); g.fillStyle = '#9A3A2A'; poly(g, [[-575, 2446], [-485, 2490], [-395, 2446]]);   // Laban Rata, the climbers' rest house
    if (dawn) { g.fillStyle = '#FFD98A'; for (let k = 0; k < 4; k++) rect(g, -545 + k * 34, 2414, 16, 14); }
  },
  near(g, S, ph, R) {
    const w = S.w, h = S.h, dawn = ph === 'dawn', sun = dawn ? 1 : -1, sm = w < 700;
    const far = dawn ? ['#F4C4B2', '#C69CB6', '#8A7CA4'] : ['#F6F9FC', '#DCE6EF', '#BCCADA'], near = dawn ? ['#FFDCC2', '#D0A2BC', '#5E5488'] : ['#FFFFFF', '#E4ECF4', '#9EB2C8'];
    const mix = (u) => [0, 1, 2].map((i) => { const A = parseInt(far[i].slice(1), 16), B = parseInt(near[i].slice(1), 16), c = (sh) => Math.round(((A >> sh) & 255) * (1 - u) + ((B >> sh) & 255) * u); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); });
    [[1180, 0.32, 0.9], [930, 0.45, 0.95], [640, 0.62, 1], [300, 0.8, 1]].forEach(([m, k, a], i) => cloudRow(g, -10, w + 10, S.py(m), S.s * k, mix(i / 4), R, { sun, a, below: S.s * 1.2 }));   // the sea of cloud round its feet, row behind row
    cloudRow(g, -10, w + 10, S.y0 + S.s * 0.35, S.s * 1.0, near, R, { sun, below: h });
    treeline(g, w, S.y0 + h * 0.16, S.s * 0.8, dawn ? '#141E24' : '#24482C', R, { lit: dawn ? 0.08 : 0.16 });   // the cloud forest below us
    // the ridge we stand on, rising on the right, with the giant pitcher plant on its mossy bank
    const x1 = sm ? w : w - 266, ps = clamp(S.s * 0.88, 34, 92), px = sm ? w * 0.8 : Math.min(x1 - ps * 1.1, S.cx + S.k * 2500), py = S.y0 + (sm ? -h * 0.075 : h * 0.012);
    const hill = dawn ? '#16222A' : '#2A4A2E';                                       // a mossy bank on the ridge we stand on
    g.fillStyle = lin(g, 0, py - ps * 0.3, 0, py + ps * 1.6, [[0, tint(hill, 0.12)], [1, rgba(tint(hill, -0.3), 0)]]);
    g.beginPath(); g.moveTo(px - ps * 2.8, py + ps * 1.6); g.bezierCurveTo(px - ps * 2.2, py + ps * 0.3, px - ps * 1.2, py - ps * 0.02, px, py - ps * 0.04); g.bezierCurveTo(px + ps * 1.4, py - ps * 0.06, px + ps * 2.4, py + ps * 0.3, px + ps * 3.2, py + ps * 1.6); g.closePath(); g.fill();
    leafMass(g, px + ps * 0.4, py + ps * 0.06, ps * 3.2, ps * 0.5, dawn ? '#1E3A2E' : '#3E6E30', R, { lit: 0.25, clumps: 6 });   // a cushion of moss
    fern(g, px + ps * 1.1, py - ps * 0.05, ps * 1.25, -0.8, dawn ? '#1E3A2A' : '#4A8A3A', R);
    fern(g, px - ps * 1.3, py + ps * 0.05, ps * 1.05, -2.35, dawn ? '#1A3426' : '#427E34', R);
    bigLeaf(g, px - ps * 1.6, py - ps * 0.06, ps * 1.15, -0.2, dawn ? '#2A4A2C' : '#5A8A3A');
    pitcher(g, px, py, ps, { col: dawn ? '#6E1628' : '#94203A', sun, from: [px - ps * 0.5, py - ps * 0.3] });
  }
};

/* ---------- Taman Negara: giant tualang trees, the canopy walkway, the Tembeling river ---------- */
M.tamannegara = {
  size: [100, 74], wide: 0.86, wideSm: 1.5, horizon: 0.42, y0Sm: 0.52, fit: 0.98,
  sky: ['#78AECE', '#B0D2E2', '#DAEAEC', '#EDF3EA'], light: () => ({ sun: { x: 0.24, y: 0.08, c: '255,246,214' } }),
  sound: 'jungle', music: 'gamelan', live: ['mist', 'myWalk', 'myBoat', 'birds'], tap: 'myCanopy', mist: { n: 9, y0: -0.46, span: 0.36, a: 0.13 }, birds: { n: 4 },
  walk: [[-30, 41, -3, 39, 2.2], [-3, 39, 26, 42, 2.6]],
  river: (S) => { const sm = S.w < 700; return { x0: 0, x1: S.w, y: S.y0 + S.h * (sm ? 0.012 : 0.05), boatY: S.y0 + S.h * (sm ? 0.034 : 0.105), boatL: clamp(S.s * 2.2, 70, 210) }; },   // on a phone, the river just under the trees, clear of the words
  say: [
    { kind: 'Taman Negara', text: 'The canopy walkway hangs more than 40 metres above the forest floor, higher than a 10-storey building.', bmKind: 'Taman Negara', bm: 'Jambatan kanopi tergantung lebih 40 meter di atas lantai hutan, lebih tinggi daripada bangunan 10 tingkat.' },
    { kind: 'Taman Negara', text: 'Up here in the treetops is where most rainforest animals live.', bmKind: 'Taman Negara', bm: 'Di puncak pokok inilah kebanyakan haiwan hutan hujan tinggal.' },
    { kind: 'Taman Negara', text: 'The tall, pale trees are tualang trees. They can grow taller than 80 metres.', bmKind: 'Taman Negara', bm: 'Pokok tinggi yang pucat itu ialah pokok tualang. Ia boleh tumbuh lebih tinggi daripada 80 meter.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    hills(g, w, S.hor + h * 0.03, S.s * 1.7, '#A2BCC4', 41);                    // the ridges of the Main Range, far off in the haze
    haze(g, w, S.hor - h * 0.12, S.hor + h * 0.05, '#E4EEEE', 0.5);
    hills(g, w, S.hor + h * 0.09, S.s * 1.3, '#82A89E', 43);
    haze(g, w, S.hor - h * 0.04, S.hor + h * 0.12, '#DCE9E6', 0.45);
    treeline(g, w, S.hor + h * 0.17, S.s * 0.9, '#5C8C6C', R, { lit: 0.14 });
    haze(g, w, S.hor + h * 0.06, S.hor + h * 0.2, '#D2E4DC', 0.35);
  },
  mon(g, S, ph, R) {
    inPx(g, S, (g, X, Y, k) => {
      for (let i = 0; i < 16; i++) leafMass(g, X(-62 + i * 8.4 + (R() - 0.5) * 4), Y(29 + R() * 9), (11 + R() * 9) * k, (8 + R() * 5) * k, '#5C9A5C', R, { lit: 0.16, clumps: 5, shade: 0.18, edge: false });   // the canopy behind, 25 to 40 metres up
      haze(g, S.w, Y(40), Y(18), '#B4D2BC', 0.4);
      for (let i = 0; i < 18; i++) leafMass(g, X(-62 + i * 7.4 + (R() - 0.5) * 3), Y(18 + R() * 8), (9 + R() * 7) * k, (7 + R() * 4) * k, '#3E7E44', R, { lit: 0.2, clumps: 5, shade: 0.24 });   // the middle storey
      g.fillStyle = lin(g, 0, Y(22), 0, Y(0), [[0, 'rgba(20,46,26,0)'], [1, 'rgba(20,46,26,.75)']]); g.fillRect(0, Y(22), S.w, Y(0) - Y(22) + 2);   // dim under the trees
      for (let i = 0; i < 12; i++) vine(g, X(-50 + R() * 100), Y(30 + R() * 14), X(-50 + R() * 100), Y(8 + R() * 14), (4 + R() * 6) * k, Math.max(1, 0.22 * k), 'rgba(44,56,30,.6)');
      giantTree(g, X(-30), Y(0), 70 * k, R, { bark: '#E2DCCE', leaf: '#4E9244', spread: 0.24 });   // tualang trees, 70 metres tall and more
      giantTree(g, X(26), Y(0), 66 * k, R, { bark: '#D8D2C4', leaf: '#45883E', spread: 0.23 });
      giantTree(g, X(-3), Y(0), 54 * k, R, { bark: '#CEC8B8', leaf: '#4E8E40', spread: 0.24, crownAt: 0.86 });
      [[-30, 41], [-3, 39], [26, 42]].forEach(([x, y]) => { g.fillStyle = '#5A3E24'; E(g, X(x), Y(y) + 0.5 * k, 3.4 * k, 0.9 * k); g.fillStyle = '#8A6A3E'; E(g, X(x), Y(y), 3.2 * k, 0.75 * k); });   // platforms round the trunks
      [[-44, 26], [40, 22], [12, 24]].forEach(([x, hh]) => { g.fillStyle = 'rgba(40,64,40,.9)'; g.fillRect(X(x) - 0.5 * k, Y(hh * 0.8), 1 * k, hh * 0.8 * k); leafMass(g, X(x), Y(hh * 0.86), hh * 0.7 * k, hh * 0.4 * k, '#3A7A3E', R, { lit: 0.22, clumps: 5 }); });   // younger trees in front
    });
  },
  near(g, S, ph, R) {
    const w = S.w, h = S.h, r = this.river(S);
    g.fillStyle = lin(g, 0, r.y - h * 0.02, 0, h, [[0, '#8A7A52'], [0.25, '#6E6040'], [1, '#3A3424']]); g.fillRect(0, r.y - h * 0.02, w, h);   // the Tembeling, brown after rain
    g.strokeStyle = 'rgba(240,235,210,.16)'; g.lineWidth = 1.2; for (let k = 0; k < 18; k++) { const y = r.y + R() * h * 0.3, x = R() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + R() * 60, y); g.stroke(); }
    treeline(g, w, r.y - h * 0.012, S.s * 0.5, '#2C4E28', R, { lit: 0.14 });
    for (let k = 0; k < 6; k++) fern(g, (k / 5) * w, h + 8, S.s * (1.1 + R() * 0.5), -Math.PI / 2 + (R() - 0.5) * 1.2, '#2A5226', R);
  }
};

/* ---------- Rafflesia: the biggest single flower, on the forest floor, with a Year 4 pupil for scale ---------- */
M.rafflesia = {
  size: [3.4, 1.62], wide: 0.62, horizon: 0.44, y0Sm: 0.5, fit: 0.96,
  sky: ['#16301E', '#24482C', '#3A6640', '#56865A'], light: () => ({}),
  sound: 'jungle', music: 'sape', live: ['rays', 'motes', 'leaves', 'myFlies'], tap: 'myFliesCome', rays: { x: 0.42, y: -0.12, a: 1.25, k: 0.08, c: '220,255,200' }, leafCols: ['#7A9A3A', '#A0882E', '#6A8A2E'],
  flower: { x: 0.62, y: 0.02 },
  say: [
    { kind: 'Rafflesia', text: 'Rafflesia has no leaves, stem or roots of its own: it grows inside a jungle vine.', bmKind: 'Rafflesia', bm: 'Rafflesia tidak mempunyai daun, batang atau akar sendiri: ia tumbuh di dalam sejenis pokok menjalar.' },
    { kind: 'Rafflesia', text: 'It smells like rotting meat. That brings flies, and they carry its pollen.', bmKind: 'Rafflesia', bm: 'Baunya seperti daging busuk. Lalat pun datang, lalu membawa debunganya.' },
    { kind: 'Rafflesia', text: 'Each flower lasts only about a week.', bmKind: 'Rafflesia', bm: 'Setiap bunga hanya bertahan kira-kira seminggu.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    for (let i = 0; i < 16; i++) { const x = R() * w, tw = S.s * (0.1 + R() * 0.45), d = R(); g.fillStyle = lin(g, x - tw / 2, 0, x + tw / 2, 0, [[0, rgba('#20382A', 0.3 + d * 0.5)], [0.5, rgba('#3E5E46', 0.3 + d * 0.5)], [1, rgba('#1A3024', 0.3 + d * 0.5)]]); g.fillRect(x - tw / 2, 0, tw, S.y0); }
    haze(g, w, S.y0 - h * 0.35, S.y0, '#6A9A6E', 0.35);
    for (let i = 0; i < 6; i++) leafMass(g, R() * w, S.y0 - h * (0.05 + R() * 0.1), S.s * (2 + R() * 2), S.s * (0.8 + R() * 0.5), '#2E5A34', R, { lit: 0.14, edge: false });   // undergrowth behind
    g.fillStyle = lin(g, 0, S.y0 - h * 0.02, 0, h, [[0, '#4E3E28'], [1, '#2A2014']]); g.fillRect(0, S.y0 - h * 0.02, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['rgba(122,90,48,.5)', 'rgba(90,66,36,.5)', 'rgba(138,106,58,.45)', 'rgba(106,122,52,.4)'][Math.floor(R() * 4)]; E(g, R() * w, S.y0 + R() * (h - S.y0), S.s * (0.05 + R() * 0.06), S.s * (0.018 + R() * 0.02), R() * TAU); }   // fallen leaves
  },
  mon(g) {
    g.save(); g.scale(1, -1);
    curve(g, [[-2.2, -0.03], [-1.4, -0.08], [-0.5, -0.02], [0.2, -0.07], [0.62, -0.04]], 0.06, '#4E3E24');      // the jungle vine it grows inside
    curve(g, [[0.62, -0.04], [1.2, -0.02], [1.7, -0.1], [2.4, -0.05]], 0.05, '#4E3E24');
    g.restore();
  },
  near(g, S, ph, R) {
    const w = S.w, h = S.h, f = this.flower;
    rafflesia(g, S.px(1.6), S.py(0.1), 0.15 * S.k, { open: 0 });                                         // a bud, still closed, like a dark cabbage
    g.fillStyle = 'rgba(0,0,0,.35)'; E(g, S.px(f.x), S.py(0) + S.k * 0.02, S.k * 0.6, S.k * 0.11);
    rafflesia(g, S.px(f.x), S.py(f.y + 0.16), 0.5 * S.k, { open: 1 });
    drawCreature(g, 'pupil', S.px(-1.05), S.py(0.65), 1.3 * S.k * 0.98, { rest: true, t: 0.4, ph: 0.9 });
    for (let k = 0; k < 4; k++) { const left = k < 2; fern(g, left ? -S.s * 0.2 : w + S.s * 0.2, h + S.s * 0.2, S.s * (1.8 + R()), left ? -Math.PI * 0.3 : -Math.PI * 0.7, '#24481E', R); }
  }
};

/* ---------- Orangutans: a mother and her baby high in the canopy, and a big flanged male ---------- */
M.orangutan = {
  size: [4.4, 3.4], wide: 0.6, horizon: 0.2, fit: 0.96,
  sky: ['#C6DCCE', '#ADCBB4', '#93B99A', '#7EA886'], light: () => ({ sun: { x: 0.3, y: 0.05, c: '255,250,225' } }),
  sound: 'jungle', music: 'sape', live: ['rays', 'mist', 'leaves', 'myOrang'], tap: 'myNest', rays: { x: 0.3, y: -0.08, a: 1.05, k: 0.12, c: '255,250,220' }, mist: { n: 7, y0: -0.5, span: 0.45, a: 0.14 },
  apes: { mother: { x: 0.15, y: 1.22, s: 0.95 }, male: { x: 1.75, top: 3.25, s: 1.0 } },
  say: [
    { kind: 'Orangutans', text: 'Every evening, an orangutan weaves branches into a new nest high in the trees, with leaves for a pillow.', bmKind: 'Orang utan', bm: 'Setiap petang, orang utan menganyam dahan menjadi sarang baharu di atas pokok, dengan daun sebagai bantal.' },
    { kind: 'Orangutans', text: 'A baby orangutan stays with its mother for about seven years.', bmKind: 'Orang utan', bm: 'Anak orang utan tinggal bersama ibunya selama kira-kira tujuh tahun.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    for (let i = 0; i < 8; i++) leafMass(g, R() * w, S.top + R() * h * 0.45, S.s * (3 + R() * 2), S.s * (1.8 + R()), '#9EC0A6', R, { lit: 0.06, edge: false, shade: 0.1 });
    for (let i = 0; i < 6; i++) { const x = R() * w; g.fillStyle = 'rgba(90,112,92,.3)'; g.fillRect(x, 0, S.s * (0.12 + R() * 0.2), h); }
    haze(g, w, 0, h, '#C8DCCE', 0.3);
    for (let i = 0; i < 9; i++) leafMass(g, R() * w, S.top + h * 0.1 + R() * h * 0.6, S.s * (2.2 + R() * 1.6), S.s * (1.4 + R()), '#6E9C72', R, { lit: 0.12, edge: false, shade: 0.18 });
    g.fillStyle = lin(g, 0, S.y0, 0, h, [[0, 'rgba(36,64,42,0)'], [1, 'rgba(18,36,24,.85)']]); g.fillRect(0, S.y0, w, h - S.y0);
  },
  mon(g, S, ph, R) {
    g.fillStyle = lin(g, -2.6, 0, -1.7, 0, [[0, '#3A2E20'], [0.45, '#6E5A40'], [1, '#3A2E22']]); rect(g, -2.6, -3, 0.9, 9);       // the trunk
    const branch = (pts, w, c) => { g.save(); g.scale(1, -1); curve(g, pts.map(([x, y]) => [x, -y]), w, c); g.restore(); };
    branch([[-1.8, 1.05], [-0.6, 1.12], [0.8, 1.2], [2.3, 1.36]], 0.2, '#4E3E2C');                                                  // the branch she sits on
    branch([[-1.8, 1.08], [-0.6, 1.16], [0.8, 1.24], [2.3, 1.4]], 0.08, '#7A6448');
    branch([[-0.4, 1.15], [0.1, 2.0], [0.7, 2.9]], 0.07, '#4E3E2C'); branch([[0.9, 1.22], [1.5, 1.9], [2.3, 2.4]], 0.06, '#4E3E2C');
    inPx(g, S, (g, X, Y, k) => [[0.9, 2.95, 1.6, 0.9], [2.2, 2.6, 1.4, 0.8], [-0.6, 3.2, 1.8, 1.0], [-2.0, 3.0, 1.6, 1.0], [2.8, 1.8, 1.2, 0.8]].forEach(([x, y, ww, hh]) => leafMass(g, X(x), Y(y), ww * k, hh * k, '#4C8A44', R, { clumps: 6 })));
    for (let i = 0; i < 30; i++) { const a = Math.PI * (0.05 + 0.9 * R()), rr = 0.5 + R() * 0.22; g.strokeStyle = i % 2 ? '#5E7A2E' : '#4A3A22'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(0.15 + Math.cos(a) * rr, 1.18 - Math.sin(a) * rr * 0.2); g.lineTo(0.15 - Math.cos(a) * rr * 0.4, 1.14); g.stroke(); }   // her nest
    g.fillStyle = '#4E7A30'; for (let i = 0; i < 18; i++) { g.save(); g.translate(0.15 + (R() - 0.5) * 1.1, 1.14 + (R() - 0.5) * 0.08); g.rotate(R() * TAU); E(g, 0, 0, 0.1, 0.04); g.restore(); }
  },
  near(g, S) { const w = S.w, h = S.h; bigLeaf(g, -S.s * 0.1, h * 0.3, S.s * 1.6, -0.15, '#2C5628'); bigLeaf(g, w + S.s * 0.1, h * 0.2, S.s * 1.5, Math.PI + 0.25, '#2A5226'); }
};

/* ---------- Proboscis monkeys over a Borneo river ---------- */
M.proboscis = {
  size: [4.6, 3.5], wide: 0.7, wideSm: 1.25, horizon: 0.34, y0Sm: 0.52, fit: 0.97,
  sky: ['#3E7EB8', '#86B6D8', '#D9E6DA', '#F2E2B8'], light: () => ({ sun: { x: 0.8, y: 0.22, c: '255,230,170' } }),
  sound: 'river', music: 'sape', live: ['mist', 'birds', 'myMonkeys'], tap: 'myLeap', mist: { n: 6, y0: -0.14, span: 0.16, a: 0.12 }, birds: { n: 3, c: 'rgba(255,255,255,.9)', scale: 1.2 },
  troop: [{ x: -1.55, y: 2.14, s: 0.6, male: true }, { x: -0.6, y: 2.17, s: 0.48 }, { x: 0.35, y: 2.22, s: 0.46 }, { x: 1.2, y: 2.29, s: 0.33 }],
  leaper: 2,
  river: (S) => ({ y: S.y0 + 2 }),
  water: (S) => ({ x0: 0, x1: S.w, y: S.y0, a: 0.3, c: '74,72,46' }),
  say: [
    { kind: 'Proboscis monkeys', text: 'Proboscis monkeys leap from the trees into the river and swim across.', bmKind: 'Monyet belanda', bm: 'Monyet belanda melompat dari pokok ke dalam sungai dan berenang ke seberang.' },
    { kind: 'Proboscis monkeys', text: 'Their toes are partly webbed, which helps them swim. They live only on the island of Borneo.', bmKind: 'Monyet belanda', bm: 'Jari kaki mereka sebahagiannya berselaput untuk membantu berenang. Mereka hanya tinggal di Borneo.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    treeline(g, w, S.hor + h * 0.07, S.s * 0.7, '#6E8C6A', R, { lit: 0.12, texture: false });
    haze(g, w, S.hor, S.hor + h * 0.1, '#E8E2C4', 0.4);
    treeline(g, w, S.y0 + h * 0.01, S.s * 1.1, '#3E663E', R, { lit: 0.16 });
  },
  mon(g, S, ph, R) {
    g.fillStyle = lin(g, -2.95, 0, -2.25, 0, [[0, '#3A3024'], [0.5, '#6E5E46'], [1, '#3A3024']]);                                   // the riverside tree
    g.beginPath(); g.moveTo(-3.2, -0.5); g.quadraticCurveTo(-2.8, 1.8, -2.75, 4.2); g.lineTo(-2.2, 4.2); g.quadraticCurveTo(-2.35, 1.8, -2.0, -0.5); g.closePath(); g.fill();
    g.save(); g.scale(1, -1);
    curve(g, [[-2.45, -2.02], [-1.2, -2.08], [0.3, -2.18], [1.75, -2.34]], 0.16, '#4E4030'); curve(g, [[-2.45, -2.06], [-1.2, -2.12], [0.3, -2.22], [1.75, -2.38]], 0.06, '#7E6C52');   // its long branch over the water
    curve(g, [[-1.0, -2.1], [-0.6, -2.8], [-0.1, -3.3]], 0.05, '#4E4030'); curve(g, [[0.8, -2.24], [1.3, -2.8], [2.0, -3.0]], 0.045, '#4E4030');
    g.restore();
    inPx(g, S, (g, X, Y, k) => {
      [[-2.4, 3.5, 2.6, 1.4], [-0.9, 3.3, 2.2, 1.2], [0.6, 3.15, 2.0, 1.1], [1.9, 2.9, 1.8, 1.0]].forEach(([x, y, ww, hh]) => leafMass(g, X(x), Y(y), ww * k, hh * k, '#4A7E3E', R, { clumps: 7 }));
      [[2.6, 2.3], [3.3, 2.7]].forEach(([x, hh]) => mangrove(g, X(x), Y(-0.08), hh * k, '#3E7036', R));                          // mangroves on the bank
    });
  },
  near(g, S, ph, R) {
    const w = S.w, h = S.h, y = S.y0 + h * 0.03;
    g.fillStyle = lin(g, 0, y, 0, h, [[0, 'rgba(96,90,58,.6)'], [1, 'rgba(40,40,28,.95)']]); g.fillRect(0, y, w, h - y);
    g.strokeStyle = 'rgba(255,240,200,.15)'; g.lineWidth = 1.2; for (let k = 0; k < 22; k++) { const yy = y + R() * (h - y) * 0.6, x = R() * w; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 20 + R() * 70, yy); g.stroke(); }
  }
};

/* ---------- The Malayan tiger, at dusk ---------- */
M.tiger = {
  size: [4.6, 2.2], wide: 0.72, horizon: 0.36, y0Sm: 0.5, fit: 0.96,
  sky: ['#241E3A', '#5E3446', '#B85E46', '#F0A25A'], light: () => ({ sun: { x: 0.68, y: 0.44, c: '255,170,90', big: true } }),
  sound: 'jungle', music: 'gamelan', live: ['motes', 'leaves', 'myTiger'], tap: 'myRoar', leafCols: ['#8A5A2A', '#6A6A2A', '#9A7A3A'],
  groundY: 0.02, walkX: [-1.3, 1.1],
  say: [
    { kind: 'The Malayan tiger', text: 'A tiger’s roar can be heard about 3 kilometres away.', bmKind: 'Harimau Malaya', bm: 'Ngauman harimau boleh didengar kira-kira 3 kilometer jauhnya.' },
    { kind: 'The Malayan tiger', text: 'Every tiger has its own pattern of stripes, like a fingerprint.', bmKind: 'Harimau Malaya', bm: 'Setiap harimau mempunyai corak belang tersendiri, seperti cap jari.' },
    { kind: 'The Malayan tiger', text: 'Fewer than 150 Malayan tigers are left in the wild.', bmKind: 'Harimau Malaya', bm: 'Kurang daripada 150 ekor Harimau Malaya masih tinggal di hutan.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    treeline(g, w, S.hor + h * 0.06, S.s * 1.0, '#6A3A44', R, { lit: 0.1, texture: false });
    haze(g, w, S.hor - h * 0.05, S.hor + h * 0.1, '#E89A68', 0.35);
    for (let i = 0; i < 12; i++) { const x = R() * w, tw = S.s * (0.14 + R() * 0.4), d = R(); g.fillStyle = rgba(d < 0.5 ? '#3A2030' : '#2A1620', 0.55 + d * 0.4); g.fillRect(x - tw / 2, 0, tw, S.y0 + 2); }   // tree trunks against the glow
    treeline(g, w, S.y0 - h * 0.02, S.s * 1.1, '#3A2230', R, { lit: 0.06, texture: false });
    treeline(g, w, S.y0 + h * 0.02, S.s * 0.6, '#24141C', R, { lit: 0.05, texture: false });
    g.fillStyle = lin(g, 0, S.y0, 0, h, [[0, '#3A2A1E'], [1, '#160E0A']]); g.fillRect(0, S.y0, w, h - S.y0);
  },
  mon(g, S, ph, R) {
    g.fillStyle = '#4A3424'; g.beginPath(); g.moveTo(-6, 0.03); for (let x = -6; x <= 6; x += 0.3) g.lineTo(x, 0.03 + Math.sin(x * 1.3) * 0.025 + R() * 0.02); g.lineTo(6, -2); g.lineTo(-6, -2); g.closePath(); g.fill();
    g.fillStyle = lin(g, 0, 0.36, 0, 0, [[0, '#6A4A30'], [1, '#3A2818']]); g.beginPath(); g.ellipse(2.0, 0.17, 1.4, 0.17, -0.04, 0, TAU); g.fill();   // a fallen log
    g.fillStyle = '#2E2016'; g.beginPath(); g.ellipse(3.36, 0.22, 0.1, 0.17, 0, 0, TAU); g.fill();
  },
  near(g, S, ph, R) {
    const w = S.w, h = S.h;
    for (let k = 0; k < 6; k++) fern(g, (k / 5) * w + (R() - 0.5) * 40, h + 10, S.s * (1.3 + R() * 0.6), -Math.PI / 2 + (R() - 0.5) * 1.3, '#1E160E', R);
    g.fillStyle = rad(g, w * 0.68, S.y0 - h * 0.2, 0, Math.max(w, h) * 0.7, [[0, 'rgba(255,170,90,.12)'], [1, 'rgba(255,170,90,0)']]); g.fillRect(0, 0, w, h);
  }
};

/* ---------- Mulu: Deer Cave at dusk, and millions of bats ---------- */
M.mulu = {
  size: [440, 250], wide: 0.9, wideSm: 1.6, horizon: 0.2, y0Sm: 0.52, fit: 0.97,
  sky: ['#1C1838', '#54386A', '#BE6A6C', '#F2A272'], light: () => ({ sun: { x: 0.12, y: 0.44, c: '255,170,110', big: true } }),
  sound: 'cave', music: 'sape', live: ['mist', 'myBats'], tap: 'myBatsWave', mist: { n: 6, y0: -0.1, span: 0.12, a: 0.1 },
  mouth: { x: -10, y: 56, vx: 10, vy: 160, r: 34, endX: 0.3 },
  say: [
    { kind: 'Mulu caves', text: 'Every evening, millions of wrinkle-lipped bats fly out of Deer Cave to hunt insects.', bmKind: 'Gua Mulu', bm: 'Setiap petang, berjuta-juta kelawar keluar dari Gua Rusa untuk memburu serangga.' },
    { kind: 'Mulu caves', text: 'They fly out in long, twisting ribbons, which makes it hard for hunting birds to catch them.', bmKind: 'Gua Mulu', bm: 'Mereka terbang dalam barisan panjang yang berpusing, jadi burung pemangsa sukar menangkap mereka.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    g.fillStyle = '#3A2C4A'; for (let k = 0; k < 9; k++) { const x = R() * w, hh = S.s * (1.2 + R() * 1.8), b = S.hor + h * 0.12; P(g, [[x - hh * 0.22, b], [x - hh * 0.06, b - hh * 0.8], [x - hh * 0.02, b - hh], [x + hh * 0.06, b - hh * 0.86], [x + hh * 0.24, b]]); }   // limestone pinnacles far off
    haze(g, w, S.hor - h * 0.1, S.hor + h * 0.14, '#C88A84', 0.4);
    treeline(g, w, S.hor + h * 0.18, S.s * 0.9, '#2E3238', R, { lit: 0.08, texture: false });
  },
  mon(g, S, ph, R) {
    inPx(g, S, (g, X, Y, k) => {
      const hp = (x) => 236 - Math.pow((x - 10) / 480, 2) * 230 + 8 * Math.sin(x * 0.03);   // the hill the cave runs into, under its forest
      g.fillStyle = lin(g, 0, Y(240), 0, Y(120), [[0, '#2E4A36'], [1, '#1C2C22']]); g.beginPath(); g.moveTo(X(-480), Y(0)); for (let x = -480; x <= 500; x += 10) g.lineTo(X(x), Y(hp(x))); g.lineTo(X(500), Y(0)); g.closePath(); g.fill();
      for (let x = -470; x <= 490; x += 16 + R() * 12) leafMass(g, X(x), Y(hp(x) - 6), (34 + R() * 26) * k, (16 + R() * 12) * k, R() < 0.5 ? '#3A5A3E' : '#2E4C36', R, { clumps: 4, lit: 0.2, edge: false });
      const top = (x) => 176 + 18 * Math.sin(x * 0.021 + 0.4) + 9 * Math.sin(x * 0.067 + 1.2) - Math.max(0, Math.abs(x - 15) - 250) * 0.9;   // the top of the cliff, ragged, lower towards its ends
      const cliff = [[-320, -10]]; for (let x = -320; x <= 350; x += 10) cliff.push([x, top(x) + (R() - 0.5) * 6]); cliff.push([350, -10]);
      karst(g, cliff.map(([x, y]) => [X(x), Y(y)]), X(-320), Y(200), X(350), Y(-10), R, { cols: [[0, '#C8BEB2'], [0.45, '#A89E94'], [1, '#6E6660']] });
      g.save(); pathOf(g, cliff, X, Y); g.clip();
      for (let i = 0; i < 18; i++) { const x = -300 + R() * 640, y0 = top(x) - 4; g.fillStyle = lin(g, 0, Y(y0), 0, Y(y0 - 60 - R() * 70), [[0, 'rgba(34,40,30,.5)'], [1, 'rgba(34,40,30,0)']]); g.fillRect(X(x), Y(y0), (3 + R() * 8) * k, (60 + R() * 70) * k); }   // dark streaks where water runs off the forest above
      g.fillStyle = lin(g, X(-320), 0, X(-200), 0, [[0, 'rgba(20,24,20,.55)'], [1, 'rgba(20,24,20,0)']]); g.fillRect(X(-320), Y(220), 120 * k, 230 * k);   // the ends of the cliff, turning away into shadow
      g.fillStyle = lin(g, X(350), 0, X(230), 0, [[0, 'rgba(20,24,20,.5)'], [1, 'rgba(20,24,20,0)']]); g.fillRect(X(230), Y(220), 120 * k, 230 * k);
      g.restore();
      for (let x = -320; x <= 350; x += 14 + R() * 16) leafMass(g, X(x), Y(top(x) - 2), (16 + R() * 22) * k, (9 + R() * 9) * k, R() < 0.5 ? '#3E5E3E' : '#34503A', R, { clumps: 3, lit: 0.22, edge: false });   // the forest hanging over the top of the cliff
      g.strokeStyle = 'rgba(46,70,40,.75)'; g.lineWidth = Math.max(1, 1.2 * k); for (let i = 0; i < 26; i++) { const x = -310 + R() * 650, yt = top(x) - 6; g.beginPath(); g.moveTo(X(x), Y(yt)); g.quadraticCurveTo(X(x + (R() - 0.5) * 10), Y(yt - 20), X(x + (R() - 0.5) * 16), Y(yt - 20 - R() * 50)); g.stroke(); }   // roots and creepers hanging down
      for (let i = 0; i < 14; i++) { const x = -290 + R() * 610, y = 30 + R() * 120, ww = 8 + R() * 12; if (x > -150 && x < 130 && y < 165) continue; g.fillStyle = 'rgba(60,54,48,.5)'; g.fillRect(X(x - ww * 0.6), Y(y) + 1.5 * k, ww * 1.2 * k, Math.max(1, 1.2 * k)); leafMass(g, X(x), Y(y + 2), ww * k, (4 + R() * 4) * k, '#3E5A34', R, { clumps: 3, edge: false }); }   // plants on the ledges
      const mouth = [[-124, 0], [-132, 14], [-136, 28], [-131, 44], [-130, 58], [-124, 72], [-118, 84], [-108, 92], [-96, 104], [-90, 114], [-84, 122], [-70, 126], [-58, 132], [-44, 142], [-30, 148], [-16, 143], [-4, 144], [10, 151], [22, 154], [36, 149], [48, 146], [60, 140], [70, 132], [80, 122], [86, 112], [94, 100], [100, 86], [105, 70], [108, 56], [112, 40], [114, 26], [116, 12], [116, 0]].map(([x, y]) => [X(x + (R() - 0.5) * 5), Y(y + (R() - 0.5) * 5)]);
      g.fillStyle = lin(g, 0, Y(160), 0, Y(60), [[0, 'rgba(34,28,26,.65)'], [1, 'rgba(34,28,26,.2)']]); P(g, mouth.map(([x, y]) => [x + (x - X(-4)) * 0.05, y - 9 * k]));   // the overhanging brow, in shadow
      g.fillStyle = lin(g, 0, Y(156), 0, Y(0), [[0, '#120E16'], [0.6, '#08060C'], [1, '#050307']]); P(g, mouth);   // the cave mouth: dark and huge
      g.save(); pathOf(g, mouth); g.clip(); g.fillStyle = rad(g, X(-4), Y(20), 0, 100 * k, [[0, 'rgba(70,56,60,.55)'], [1, 'rgba(70,56,60,0)']]); g.fillRect(X(-140), Y(160), 260 * k, 170 * k); g.restore();   // the floor inside, just showing
      treeline(g, S.w, Y(4), 26 * k, '#26402A', R, { lit: 0.12 });                                     // the forest at its foot
    });
  },
  near(g, S, ph, R) { treeline(g, S.w, S.y0 + S.h * 0.08, S.s * 0.9, '#141E16', R, { lit: 0.06, texture: false }); }
};

/* ---------- The fireflies of Kuala Selangor ---------- */
M.fireflies = {
  size: [60, 14], wide: 0.86, wideSm: 2.2, horizon: 0.07, y0Sm: 0.5, fit: 0.97,
  sky: ['#03071A', '#0A1638', '#1A3266', '#3A5890'], light: () => ({ night: true, moon: { x: 0.2, y: 0.16, crescent: true, r: 0.8 } }),
  sound: 'mangrove', music: 'chimes', live: ['myFlash', 'mySampan'], tap: 'myGlow',
  trees: (S) => [[-22, 6.8, 4.4], [-10.5, 8.0, 5.4], [1.5, 7.4, 5.0], [13.5, 8.2, 5.6], [24, 7.0, 4.6]].map(([x, h, r]) => ({ x: S.px(x), y: S.py(h * 0.62 + 0.3), r: r * S.k })),
  waterY: (S) => S.y0 + 2,
  boat: (S) => ({ x0: 0, x1: S.w, y: S.y0 + S.h * 0.045, L: clamp(S.s * 1.6, 50, 140) }),
  water: (S) => ({ x0: 0, x1: S.w, y: S.y0, a: 0.45, c: '4,8,22' }),
  say: [
    { kind: 'Fireflies of Kuala Selangor', text: 'Thousands of fireflies on the same berembang tree flash on and off together, again and again.', bmKind: 'Kelip-kelip Kuala Selangor', bm: 'Beribu-ribu kelip-kelip pada pokok berembang yang sama berkelip serentak, berulang-ulang.' },
    { kind: 'Fireflies of Kuala Selangor', text: 'Only the male fireflies flash in time with each other. It helps the females find them.', bmKind: 'Kelip-kelip Kuala Selangor', bm: 'Hanya kelip-kelip jantan yang berkelip serentak. Ini membantu betina mencari mereka.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    hills(g, w, S.hor - h * 0.01, S.s * 0.5, '#16264A', 51);                       // low hills inland, just showing against the sky
    treeline(g, w, S.hor + h * 0.01, S.s * 0.5, '#0A1430', R, { lit: 0.12, texture: false });   // mangroves along the far bank
    g.fillStyle = lin(g, 0, S.y0, 0, h, [[0, '#0C1834'], [1, '#03060E']]); g.fillRect(0, S.y0, w, h - S.y0);   // the Selangor River
    g.fillStyle = 'rgba(255,244,214,.16)'; for (let k = 0; k < 12; k++) { const y = S.y0 + 6 + k * 5, wd = S.s * (0.5 - k * 0.03); g.fillRect(w * 0.2 - wd / 2 + Math.sin(k) * 4, y, wd, 1.6); }   // the moon on the water
  },
  mon(g, S, ph, R) {
    inPx(g, S, (g, X, Y, k) => [[-31, 5.8], [32, 6.2], [-22, 6.8], [-10.5, 8.0], [1.5, 7.4], [13.5, 8.2], [24, 7.0]].forEach(([x, hh]) => berembang(g, X(x), Y(-0.1), hh * k, '#040810', R, '#4A6AAA')));
  },
  near() {}
};

/* ---------- Leatherback turtles on a Terengganu beach at night ---------- */
M.turtle = {
  size: [7, 2.4], wide: 0.82, wideSm: 1.6, horizon: 0.44, y0Sm: 0.5, fit: 0.97,
  sky: ['#040A1C', '#0A1636', '#16284E', '#28426C'], light: () => ({ night: true, moon: { x: 0.22, y: 0.14, r: 1.1 } }),
  sound: 'beach', music: 'gamelan', live: ['glitter', 'mySurf', 'myFront', 'myTurtle'], tap: 'myHatch',
  nest: { x: 0.25, y: 0.04, hx: -1.25 },
  surf: (S) => ({ x0: 0, x1: S.w, y0: S.y0 - S.h * 0.11, y1: S.y0 - S.h * 0.03, amp: 3 }),
  glitter: (S) => ({ x: S.w * 0.22, w: S.w * 0.05, y0: S.hor + 4, y1: S.y0 - S.h * 0.12, c: '230,236,255' }),
  say: [
    { kind: 'Leatherback turtles', text: 'After about two months, the eggs hatch.', bmKind: 'Penyu belimbing', bm: 'Selepas kira-kira dua bulan, telur menetas.' },
    { kind: 'Leatherback turtles', text: 'The baby turtles dig their way out of the sand and race to the sea, often at night.', bmKind: 'Penyu belimbing', bm: 'Anak penyu menggali keluar dari pasir lalu berlari ke laut, selalunya pada waktu malam.' },
    { kind: 'Leatherback turtles', text: 'Leatherbacks can dive deeper than 1,000 metres.', bmKind: 'Penyu belimbing', bm: 'Penyu belimbing boleh menyelam lebih dalam daripada 1,000 meter.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    g.fillStyle = lin(g, 0, S.hor, 0, S.y0, [[0, '#1C2E50'], [1, '#0E1C36']]); g.fillRect(0, S.hor, w, S.y0 - S.hor);             // the South China Sea
    g.fillStyle = lin(g, 0, S.y0 - h * 0.04, 0, h, [[0, '#56687E'], [0.1, '#8E9090'], [0.35, '#B4AA94'], [1, '#8E826C']]); g.fillRect(0, S.y0 - h * 0.04, w, h);   // wet sand, then dry sand, pale in the moonlight
    for (let k = 0; k < 120; k++) { g.fillStyle = 'rgba(50,40,30,' + (0.08 + R() * 0.12).toFixed(2) + ')'; E(g, R() * w, S.y0 + R() * (h - S.y0), 1.5 + R() * 3, 0.8 + R()); }
  },
  mon(g) {
    g.fillStyle = 'rgba(70,58,42,.45)'; E(g, -1.9, 0.02, 0.38, 0.1);                                                            // last season's nest, where the eggs will hatch
  },
  front(g, S, ph, R) { const w = S.w, h = S.h, x0 = w < 700 ? w * 0.06 : S.px(-2.15); for (let k = 0; k < 4; k++) casuarina(g, x0 + k * S.s * 0.62 + (R() - 0.5) * 10, S.y0 - h * 0.024 + R() * 3, S.s * (2.1 + R() * 1.1), k % 2 ? '#0A1426' : '#0C1830', R, { lean: (R() - 0.5) * 0.4 }); },   // casuarina trees along the beach, dark against the night
  near() {}
};

/* ---------- The rhinoceros hornbill, in the Borneo canopy ---------- */
M.hornbill = {
  size: [3.6, 2.4], wide: 0.66, horizon: 0.32, fit: 0.97,
  sky: ['#4A86B8', '#9CC4DC', '#D8E8E8', '#EEF0E4'], light: () => ({ sun: { x: 0.82, y: 0.16, c: '255,246,214' } }),
  sound: 'jungle', music: 'sape', live: ['mist', 'myHorn'], tap: 'myTakeoff', mist: { n: 9, y0: -0.3, span: 0.35, a: 0.18 },
  perch: { x: 0.35, y: 1.36 },
  say: [
    { kind: 'Hornbills', text: 'You can hear a hornbill coming: its big wings make a loud whooshing sound as it flies.', bmKind: 'Burung enggang', bm: 'Anda boleh mendengar burung enggang datang: sayapnya yang besar berbunyi kuat ketika terbang.' },
    { kind: 'Hornbills', text: 'Rhinoceros hornbills love figs, and they spread the seeds all through the forest.', bmKind: 'Burung enggang', bm: 'Burung enggang badak suka makan buah ara, dan ia menyebarkan bijinya ke seluruh hutan.' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    [['#B8CCD0', 0.0, 0.9], ['#9AB6B0', 0.07, 1.1], ['#7C9E90', 0.15, 1.3], ['#5E8670', 0.25, 1.5]].forEach(([col, dy, k], i) => { treeline(g, w, S.hor + h * dy, S.s * k, col, R, { lit: 0.08 + i * 0.03, texture: i > 1 }); haze(g, w, S.hor + h * (dy - 0.06), S.hor + h * (dy + 0.03), '#E4EEEC', 0.35); });
  },
  mon(g, S, ph, R) {
    g.save(); g.scale(1, -1);
    curve(g, [[-2.6, -1.5], [-1.2, -1.32], [0.4, -1.26], [1.6, -1.34], [2.4, -1.5]], 0.14, '#5A4632'); curve(g, [[-2.6, -1.53], [-1.2, -1.35], [0.4, -1.29], [1.6, -1.37]], 0.05, '#8A7458');   // the branch
    curve(g, [[1.0, -1.3], [1.5, -1.9], [2.2, -2.3]], 0.05, '#5A4632'); curve(g, [[-0.9, -1.3], [-1.4, -1.9], [-1.6, -2.5]], 0.05, '#5A4632');
    g.restore();
    inPx(g, S, (g, X, Y, k) => [[2.0, 2.2, 1.2, 0.7], [-1.6, 2.3, 1.1, 0.6], [2.6, 1.3, 0.9, 0.5]].forEach(([x, y, ww, hh]) => leafMass(g, X(x), Y(y), ww * k, hh * k, '#4E8A44', R, { clumps: 6 })));
    for (let i = 0; i < 30; i++) { const x = -0.8 + R() * 2.6; g.fillStyle = R() < 0.7 ? '#D94E26' : '#F09A34'; disc(g, x, 1.24 + R() * 0.03 + (R() < 0.5 ? 0.06 : -0.05), 0.028 + R() * 0.014); }   // ripe figs along the branch
  },
  near(g, S) { const w = S.w, h = S.h; bigLeaf(g, -S.s * 0.2, h * 0.84, S.s * 1.8, -0.3, '#2E5A2A'); bigLeaf(g, w + S.s * 0.2, h * 0.9, S.s * 1.6, Math.PI + 0.35, '#2A5226'); }
};

/* ---------- The two monsoons on the east coast ---------- */
M.monsoon = {
  size: [40, 13], wide: 0.9, wideSm: 1.8, horizon: 0.3, y0Sm: 0.5, fit: 0.97, phases: ['ne', 'sw'],
  sky: (ph) => (ph === 'ne' ? ['#1E2430', '#343E4E', '#56606E', '#77818C'] : ['#2A78C8', '#74B2E4', '#BCDDF2', '#EAF4F6']),
  light: (ph) => (ph === 'ne' ? {} : { sun: { x: 0.74, y: 0.13, disc: 0.026 } }),
  sound: ['storm', 'beach'], music: 'gamelan', live: ['myBoats', 'myBreakers', 'myFront', 'myPalms', 'people', 'myRain'], tap: 'phase',
  people: [{ y: 0.15, x: [-8, 6], n: 3 }],
  palms: [[-9.2, 8.4, 0.25], [-0.9, 9.6, -0.15], [7.4, 8.8, -0.2], [11, 7.4, 0.2]],
  surf: (S) => ({ x0: 0, x1: S.w, y0: S.hor + 4, y1: S.y0 - S.h * 0.018 }),
  bay: (S) => ({ x0: 0, x1: S.w, y0: S.hor + 5, y1: S.hor + (S.y0 - S.hor) * 0.32, L: clamp(S.s * 1.3, 40, 110) }),
  says: {
    ne: [
      { kind: 'Northeast monsoon', text: 'From about November to March, the northeast monsoon brings strong winds, heavy rain and big waves.', bmKind: 'Monsun timur laut', bm: 'Dari kira-kira November hingga Mac, monsun timur laut membawa angin kencang, hujan lebat dan ombak besar.' },
      { kind: 'Northeast monsoon', text: 'The sea is too rough, so the fishing boats stay on the beach. Tap again for the southwest monsoon.', bmKind: 'Monsun timur laut', bm: 'Laut terlalu bergelora, jadi bot nelayan tinggal di pantai. Ketik lagi untuk monsun barat daya.' }
    ],
    sw: [
      { kind: 'Southwest monsoon', text: 'From about May to September, the southwest monsoon blows. The east coast is drier.', bmKind: 'Monsun barat daya', bm: 'Dari kira-kira Mei hingga September, monsun barat daya bertiup. Pantai timur lebih kering.' },
      { kind: 'Southwest monsoon', text: 'The sea is calmer, so the fishing boats go out to sea. Tap again for the northeast monsoon.', bmKind: 'Monsun barat daya', bm: 'Laut lebih tenang, jadi bot nelayan keluar ke laut. Ketik lagi untuk monsun timur laut.' }
    ]
  },
  far(g, S, ph, R) {
    const w = S.w, h = S.h, ne = ph === 'ne';
    if (ne) { for (let k = 0; k < 6; k++) cloudMass(g, (k + R() * 0.5) * w / 5, S.top + h * (0.06 + R() * 0.16), w * (0.34 + R() * 0.2), h * (0.16 + R() * 0.08), '#5E6876', '#262E3A', R); g.fillStyle = 'rgba(20,26,36,.28)'; for (let k = 0; k < 5; k++) { const x = R() * w; P(g, [[x, S.top + h * 0.2], [x + w * 0.1, S.top + h * 0.2], [x - w * 0.02, S.hor], [x - w * 0.12, S.hor]]); } }   // storm clouds and rain curtains
    else for (let k = 0; k < 4; k++) cloudMass(g, (k + R() * 0.6) * w / 4, S.top + h * (0.08 + R() * 0.1), w * (0.16 + R() * 0.1), h * (0.07 + R() * 0.04), '#FFFFFF', '#CFDDEA', R);
    g.fillStyle = lin(g, 0, S.hor, 0, S.y0, ne ? [[0, '#3A4654'], [1, '#4E5E66']] : [[0, '#2A76B4'], [1, '#3E9CC4']]); g.fillRect(0, S.hor, w, S.y0 - S.hor);   // the South China Sea
    g.fillStyle = lin(g, 0, S.y0 - h * 0.02, 0, h, ne ? [[0, '#7E7866'], [0.2, '#958C74'], [1, '#6A6252']] : [[0, '#D8C69C'], [0.2, '#EAD9B2'], [1, '#D2BE90']]); g.fillRect(0, S.y0 - h * 0.02, w, h);   // the sand
    for (let k = 0; k < 90; k++) { g.fillStyle = ne ? 'rgba(60,54,44,.18)' : 'rgba(150,120,80,.18)'; E(g, R() * w, S.y0 + R() * (h - S.y0), 1.5 + R() * 3, 0.8 + R()); }
  },
  front(g, S, ph, R) {                                                             // kampung houses on stilts along the beach and, in the northeast monsoon, the boats pulled up on the sand
    const ne = ph === 'ne';
    onScreen(g, S, (g, X, Y, k) => {
      [[-5.4, 6.6, '#C49A6A'], [3.6, 6.2, '#B4885A']].forEach(([x, ww, wall]) => { g.fillStyle = 'rgba(40,34,24,.25)'; E(g, X(x), Y(-0.15), ww * 0.62 * k, 0.35 * k); stiltHouse(g, X(x), Y(-0.2), ww * k, R, { wall, roof: ne ? '#5A2E22' : '#8A3A2A', lit: ne ? '#F2C96A' : '#3A2A1E' }); });
      if (ne) [[-7.4, 5.4, ['#2E6FB0', '#F2C14E', '#D7263D'], false], [-1.6, 5.8, ['#1E8A5A', '#FFFFFF', '#E04E5A'], true], [5.0, 5.2, ['#D7263D', '#F2C14E', '#2E6FB0'], false]].forEach(([x, L, cols, flip]) => { g.fillStyle = 'rgba(40,34,24,.3)'; E(g, X(x), Y(-0.25), L * 0.5 * k, 0.3 * k); perahu(g, X(x), Y(0.25), L * k, cols, flip); g.strokeStyle = '#5A4A30'; g.lineWidth = Math.max(1, 0.1 * k); [-0.3, 0.3].forEach((u) => { g.beginPath(); g.moveTo(X(x + u * L), Y(0.08)); g.lineTo(X(x + u * L), Y(-0.25)); g.stroke(); }); });   // the boats, on wooden rollers
    });
  },
  mon() {},
  near() {}
};

/* ---------- Sang Kancil, the mouse-deer, by a forest stream ---------- */
M.kancil = {
  size: [2.4, 1.42], wide: 0.6, wideSm: 1.2, horizon: 0.38, y0Sm: 0.5, fit: 0.95,
  sky: ['#18321E', '#28482E', '#3E6A46', '#5A8A60'], light: () => ({}),
  sound: 'river', music: 'gamelan', live: ['rays', 'leaves', 'myKancil'], tap: 'myHop', rays: { x: 0.4, y: -0.1, a: 1.15, k: 0.1, c: '230,255,200' }, leafCols: ['#8A7A2E', '#6A8A2E', '#A0782E'],
  deer: { x: -0.22, pupil: -0.8, crocs: [0.28, 0.62, 0.96], far: 1.32, waterY: -0.04, farY: 0.02 },
  say: [
    { kind: 'Sang Kancil', text: 'In a famous folk tale, Sang Kancil wants the fruit on the other side of the river.', bmKind: 'Sang Kancil', bm: 'Dalam cerita rakyat yang terkenal, Sang Kancil mahu makan buah di seberang sungai.' },
    { kind: 'Sang Kancil', text: 'He tricks the crocodiles into lining up so he can ‘count’ them, then hops across their backs!', bmKind: 'Sang Kancil', bm: 'Dia memperdaya buaya supaya berbaris untuk ‘dikira’, lalu melompat di atas belakang mereka!' }
  ],
  far(g, S, ph, R) {
    const w = S.w, h = S.h;
    for (let i = 0; i < 14; i++) { const x = R() * w, tw = S.s * (0.12 + R() * 0.45), d = R(); g.fillStyle = lin(g, x - tw / 2, 0, x + tw / 2, 0, [[0, rgba('#1E3626', 0.3 + d * 0.5)], [0.5, rgba('#3A5A42', 0.3 + d * 0.5)], [1, rgba('#18301E', 0.3 + d * 0.5)]]); g.fillRect(x - tw / 2, 0, tw, S.y0); }
    haze(g, w, S.y0 - h * 0.3, S.y0, '#6A9A70', 0.3);
    for (let i = 0; i < 5; i++) leafMass(g, R() * w, S.y0 - h * (0.04 + R() * 0.08), S.s * (2 + R() * 2), S.s * (0.8 + R() * 0.5), '#2E5A34', R, { lit: 0.14, edge: false });
    g.fillStyle = lin(g, 0, S.y0 - h * 0.02, 0, h, [[0, '#4E3E28'], [1, '#2A2014']]); g.fillRect(0, S.y0 - h * 0.02, w, h);
    for (let i = 0; i < 130; i++) { g.fillStyle = ['rgba(122,90,48,.5)', 'rgba(90,66,36,.5)', 'rgba(138,106,58,.45)', 'rgba(106,122,52,.4)'][Math.floor(R() * 4)]; E(g, R() * w, S.y0 + R() * (h - S.y0), S.s * (0.05 + R() * 0.06), S.s * (0.018 + R() * 0.02), R() * TAU); }
  },
  mon(g, S, ph, R) {
    g.fillStyle = lin(g, 0, 0.04, 0, -0.4, [[0, '#5E9294'], [1, '#2C5458']]); poly(g, [[0.08, 0.02], [1.14, 0.02], [1.26, -0.6], [-0.04, -0.6]]);   // the stream
    g.strokeStyle = 'rgba(220,240,240,.3)'; g.lineWidth = 0.006; for (let k = 0; k < 14; k++) { const x = 0.12 + R() * 1.0, y = -0.04 - R() * 0.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.1, y); g.stroke(); }
    g.fillStyle = '#5A4A30'; poly(g, [[1.14, 0.02], [2.8, 0.04], [2.8, -0.6], [1.26, -0.6]]);                                       // the far bank
    g.fillStyle = lin(g, -1.9, 0, -1.4, 0, [[0, '#4A3A2A'], [1, '#7A6248']]); g.beginPath(); g.moveTo(-2.2, 0); g.quadraticCurveTo(-1.75, 0.8, -1.6, 1.6); g.lineTo(-1.46, 1.6); g.quadraticCurveTo(-1.46, 0.6, -1.04, 0); g.closePath(); g.fill();   // a buttress root
    inPx(g, S, (g, X, Y, k) => {
      for (let j = 0; j < 4; j++) fern(g, X(1.45 + j * 0.28), Y(0.02), (0.45 + R() * 0.2) * k, -Math.PI / 2 + (R() - 0.5) * 1.2, '#3A6A30', R);
      g.fillStyle = '#C2462A'; for (let j = 0; j < 7; j++) C(g, X(1.4 + R() * 0.6), Y(0.03 + R() * 0.03), 0.028 * k);      // fruit fallen on the far bank
      g.save(); g.translate(X(-0.2), Y(0.01)); g.scale(1, 0.32); g.fillStyle = rad(g, 0, 0, 0, 0.75 * k, [[0, 'rgba(255,236,160,.5)'], [0.6, 'rgba(255,236,160,.18)'], [1, 'rgba(255,236,160,0)']]); g.fillRect(-0.8 * k, -0.8 * k, 1.6 * k, 1.6 * k); g.restore();   // a patch of sunlight where it stands
    });
  },
  near(g, S, ph, R) { const w = S.w, h = S.h; for (let k = 0; k < 3; k++) fern(g, -S.s * 0.3, h + S.s * 0.2, S.s * (1.6 + R() * 0.6), -Math.PI * (0.25 + k * 0.08), '#22441C', R); }
};

Object.assign(W, M);
/* the scene ids, in the window's order */
export const MALAYSIA_SCENES = Object.keys(M);
