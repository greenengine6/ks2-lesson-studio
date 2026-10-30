/* The quiz games' look and sound: the four answer shapes (as on pupils' phones), six drawn team animals, the surprise
   tiles' pictures, and small sounds made live with Web Audio through the site's sound engine (so the site's Sound
   switch turns them off, and they go quiet while Symphony speaks). Nothing here is an emoji. */
import { Sound } from '../fx/audio.js?v=cdc164df';

/* ---------------- answer shapes (white, on the option's colour) ---------------- */
export function shapeSVG(i, cls) {
  const p = [
    '<circle cx="12" cy="12" r="9"/>',
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>',
    '<path d="M12 3 22 20H2z"/>',
    '<path d="M12 2 22 12 12 22 2 12z"/>'
  ][i % 4];
  return '<svg class="qz-shape' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="#FFFFFF">' + p + '</svg>';
}
export const SHAPE_NAMES = ['circle', 'square', 'triangle', 'diamond'];

/* ---------------- team animals ---------------- */
const INK = '#1F2937';
const EYES = (y, gap) => '<circle cx="' + (24 - gap) + '" cy="' + y + '" r="2.5" fill="' + INK + '"/><circle cx="' + (24 + gap) + '" cy="' + y + '" r="2.5" fill="' + INK + '"/><circle cx="' + (24 - gap + 0.9) + '" cy="' + (y - 0.9) + '" r=".8" fill="#fff"/><circle cx="' + (24 + gap + 0.9) + '" cy="' + (y - 0.9) + '" r=".8" fill="#fff"/>';
const ANIMALS = {
  tiger: '<circle cx="11" cy="12" r="6.5" fill="#F59E0B"/><circle cx="37" cy="12" r="6.5" fill="#F59E0B"/><circle cx="11" cy="12" r="3.2" fill="#FFE2B8"/><circle cx="37" cy="12" r="3.2" fill="#FFE2B8"/>' +
    '<circle cx="24" cy="26" r="17" fill="#F59E0B"/><path d="M24 9.5v6M17.5 10.5l2 5M30.5 10.5l-2 5M7.5 23h6M8 28.5h5M40.5 23h-6M40 28.5h-5" stroke="' + INK + '" stroke-width="2.3" stroke-linecap="round" fill="none"/>' +
    '<ellipse cx="24" cy="33" rx="9.5" ry="7.5" fill="#FFF7EB"/>' + EYES(23.5, 6.5) + '<path d="M21.3 30h5.4L24 32.8z" fill="' + INK + '"/><path d="M24 32.8v2M24 34.8c-1.4 1.4-3.3 1.4-4.5.3M24 34.8c1.4 1.4 3.3 1.4 4.5.3" stroke="' + INK + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  eagle: '<circle cx="24" cy="25" r="17.5" fill="#2667B0"/><path d="M8.5 19c4-9.5 27-9.5 31 0-6-3-25-3-31 0z" fill="#1A4A85"/><ellipse cx="24" cy="31" rx="10.5" ry="9" fill="#EAF2FC"/>' +
    '<circle cx="17.5" cy="22.5" r="3.6" fill="#fff"/><circle cx="30.5" cy="22.5" r="3.6" fill="#fff"/><circle cx="18" cy="23" r="2" fill="' + INK + '"/><circle cx="31" cy="23" r="2" fill="' + INK + '"/>' +
    '<path d="M13 18.5l6.5 2M35 18.5l-6.5 2" stroke="#0E2C52" stroke-width="2.2" stroke-linecap="round"/><path d="M19.5 27.5h9l-4.5 8z" fill="#F5B820"/><path d="M24 35.5l-1.6-2.8" stroke="#C98A00" stroke-width="1.3" stroke-linecap="round"/>',
  dolphin: '<path d="M24 4.5l6 8.5H18z" fill="#1F7F7A"/><circle cx="24" cy="26" r="17" fill="#2C9C96"/><ellipse cx="24" cy="34" rx="11" ry="7.5" fill="#D9F3F1"/>' +
    EYES(22.5, 7) + '<path d="M17 32c4 3.5 10 3.5 14 0" stroke="' + INK + '" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="14.5" cy="29" r="2.2" fill="#FFB7C5" opacity=".75"/><circle cx="33.5" cy="29" r="2.2" fill="#FFB7C5" opacity=".75"/>' +
    '<path d="M36 13c3-1 5 0 6 1-2 0-3.5 1-4.5 2.5" fill="#2C9C96"/>',
  owl: '<path d="M9 7l7 6H8zM39 7l-7 6h8z" fill="#7B3FB3"/><circle cx="24" cy="26" r="17.5" fill="#9A55CF"/><ellipse cx="24" cy="34" rx="9" ry="6.5" fill="#E9D8F7"/>' +
    '<circle cx="17" cy="23" r="6.3" fill="#fff"/><circle cx="31" cy="23" r="6.3" fill="#fff"/><circle cx="17.5" cy="23.3" r="3" fill="' + INK + '"/><circle cx="31.5" cy="23.3" r="3" fill="' + INK + '"/>' +
    '<circle cx="18.5" cy="22.2" r="1" fill="#fff"/><circle cx="32.5" cy="22.2" r="1" fill="#fff"/><path d="M21.4 28.5h5.2L24 33z" fill="#F59E0B"/>',
  panda: '<circle cx="11" cy="11.5" r="6.5" fill="' + INK + '"/><circle cx="37" cy="11.5" r="6.5" fill="' + INK + '"/><circle cx="24" cy="26" r="17.5" fill="#FFFFFF" stroke="#D5DAE3" stroke-width="1"/>' +
    '<ellipse cx="17" cy="24" rx="4.6" ry="5.6" transform="rotate(-20 17 24)" fill="' + INK + '"/><ellipse cx="31" cy="24" rx="4.6" ry="5.6" transform="rotate(20 31 24)" fill="' + INK + '"/>' +
    '<circle cx="17.6" cy="23.4" r="1.8" fill="#fff"/><circle cx="30.4" cy="23.4" r="1.8" fill="#fff"/><ellipse cx="24" cy="31" rx="3.2" ry="2.3" fill="' + INK + '"/><path d="M24 33v1.6M24 34.6c-1.4 1.2-3 1.2-4 .3M24 34.6c1.4 1.2 3 1.2 4 .3" stroke="' + INK + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  fox: '<path d="M7 5l11 9-8 4zM41 5L30 14l8 4z" fill="#E8590C"/><path d="M9.5 8.5l5.5 5-4 2zM38.5 8.5L33 13.5l4 2z" fill="#3B2314"/><path d="M24 43C12 43 6 33 7 20c5 5 11 6 17 6s12-1 17-6c1 13-5 23-17 23z" fill="#E8590C"/>' +
    '<path d="M7 20c3 8 9 12 17 13 8-1 14-5 17-13-2 9-7 18-17 23C14 38 9 29 7 20z" fill="#FFF4EA"/>' + EYES(24, 6.5) + '<ellipse cx="24" cy="33.5" rx="2.6" ry="2" fill="' + INK + '"/>'
};
export const TEAMS = [
  { name: 'Tigers', color: '#E0860B', animal: 'tiger' }, { name: 'Eagles', color: '#2667B0', animal: 'eagle' }, { name: 'Dolphins', color: '#1F8A84', animal: 'dolphin' },
  { name: 'Owls', color: '#8B46C7', animal: 'owl' }, { name: 'Pandas', color: '#374151', animal: 'panda' }, { name: 'Foxes', color: '#D9480F', animal: 'fox' }
];
export const COLOURS = ['#E0860B', '#2667B0', '#1F8A84', '#8B46C7', '#374151', '#D9480F', '#C7356F', '#2E7D4F'];
export function animalSVG(name, cls) {
  return '<svg class="qb-animal' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true">' + (ANIMALS[name] || ANIMALS.owl) + '</svg>';
}

/* ---------------- the surprise tiles ---------------- */
export const SURPRISES = {
  double: { name: 'Double points', short: 'x2', say: 'Your next question is worth double!', color: '#F2B705', ink: '#3B2A00' },
  swap: { name: 'Swap scores', short: 'Swap', say: 'Swap scores with a team of your choice.', color: '#8B46C7', ink: '#FFFFFF' },
  lose: { name: 'Lose 10', short: '-10', say: 'Oh no! You lose 10 points.', color: '#C2410C', ink: '#FFFFFF' },
  steal: { name: 'Steal 10', short: 'Steal', say: 'Steal 10 points from a team of your choice.', color: '#1F7A75', ink: '#FFFFFF' },
  bonus: { name: 'Bonus 10', short: '+10', say: 'A bonus! You get 10 points.', color: '#2E7D4F', ink: '#FFFFFF' }
};
export function surpriseSVG(kind, cls) {
  const s = SURPRISES[kind];
  if (!s) return '';
  const ink = s.ink;
  const art = {
    double: '<rect x="4" y="4" width="40" height="40" rx="12" fill="' + s.color + '"/><path d="M14 16l8 16M22 16l-8 16" stroke="' + ink + '" stroke-width="3.4" stroke-linecap="round"/><path d="M26 21c0-3 2.4-5 5.2-5S36 18 36 20.6c0 4.4-9.6 7.8-9.6 11.4H36.4" stroke="' + ink + '" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    swap: '<rect x="4" y="4" width="40" height="40" rx="12" fill="' + s.color + '"/><path d="M15 15l-5 5 5 5M10 20h22M33 23l5 5-5 5M38 28H16" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    lose: '<rect x="4" y="4" width="40" height="40" rx="12" fill="' + s.color + '"/><path d="M11 24h7" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round"/><path d="M22 17l3-2v18" stroke="' + ink + '" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="33.5" cy="24" rx="4.5" ry="8.5" stroke="' + ink + '" stroke-width="3.2" fill="none"/>',
    steal: '<rect x="4" y="4" width="40" height="40" rx="12" fill="' + s.color + '"/><path d="M15 13v10a9 9 0 0 0 18 0V13h-6v10a3 3 0 0 1-6 0V13z" fill="' + ink + '"/><path d="M15 13h6M27 13h6" stroke="#F2B705" stroke-width="3.4"/>',
    bonus: '<rect x="4" y="4" width="40" height="40" rx="12" fill="' + s.color + '"/><rect x="11" y="20" width="26" height="17" rx="2.5" fill="' + ink + '"/><rect x="9" y="15" width="30" height="7" rx="2" fill="' + ink + '"/><path d="M24 15v22" stroke="' + s.color + '" stroke-width="3"/><path d="M24 15c-2-5-8-6-8-2.5S22 15 24 15c2 0 8 .5 8-2.5S26 10 24 15z" stroke="' + ink + '" stroke-width="2.4" fill="none"/>'
  }[kind];
  return '<svg class="qb-sur' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true">' + art + '</svg>';
}
export const TROPHY = '<svg class="qb-trophy" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8h28v14a14 14 0 0 1-28 0z" fill="#F2B705"/><path d="M18 12H8c0 9 5 14 11 14M46 12h10c0 9-5 14-11 14" stroke="#F2B705" stroke-width="4" fill="none"/>' +
  '<path d="M28 35h8v9h-8z" fill="#D49A00"/><path d="M20 44h24v6H20z" fill="#8A5A00"/><path d="M16 50h32v6H16z" fill="#6B4500"/><path d="M25 14l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#FFF3C4"/></svg>';

/* ---------------- sounds ---------------- */
function out() {
  const c = Sound.ctx();
  if (!c || c.state !== 'running' || !Sound.on) return null;
  return { c, bus: Sound.effects() };
}
function tone(o, t, f, dur, opt) {
  opt = opt || {};
  const osc = o.c.createOscillator(), g = o.c.createGain();
  osc.type = opt.type || 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (opt.to) osc.frequency.exponentialRampToValueAtTime(opt.to, t + (opt.glide || dur * 0.8));
  const peak = opt.vol || 0.1, a = opt.a || 0.008;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  let node = osc;
  if (opt.lp) { const f2 = o.c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = opt.lp; osc.connect(f2); node = f2; }
  node.connect(g); g.connect(o.bus);
  osc.start(t); osc.stop(t + a + dur + 0.05);
}
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
function play(fn) { const o = out(); if (!o) return; try { fn(o, o.c.currentTime + 0.01); } catch (e) { /* sound is a bonus */ } }
export const Fx = {
  tick() { play((o, t) => tone(o, t, 1500, 0.03, { vol: 0.05, type: 'square', lp: 2600 })); },
  pick() { play((o, t) => { tone(o, t, N(76), 0.12, { vol: 0.08 }); tone(o, t + 0.07, N(83), 0.18, { vol: 0.07 }); }); },
  reveal() { play((o, t) => [72, 76, 79].forEach((n, i) => tone(o, t + i * 0.06, N(n), 0.3, { vol: 0.07, type: 'triangle' }))); },
  right() { play((o, t) => { tone(o, t, N(79), 0.16, { vol: 0.12, type: 'triangle' }); tone(o, t + 0.11, N(88), 0.32, { vol: 0.11, type: 'triangle' }); }); },
  wrong() { play((o, t) => { tone(o, t, 220, 0.16, { vol: 0.09, type: 'sawtooth', lp: 900 }); tone(o, t + 0.17, 175, 0.24, { vol: 0.08, type: 'sawtooth', lp: 800 }); }); },
  coin() { play((o, t) => { tone(o, t, N(83), 0.06, { vol: 0.08, type: 'square', lp: 4000 }); tone(o, t + 0.06, N(88), 0.2, { vol: 0.08, type: 'square', lp: 4000 }); }); },
  surprise() { play((o, t) => [72, 79, 84, 88, 91].forEach((n, i) => tone(o, t + i * 0.05, N(n), 0.22, { vol: 0.06, type: 'sine' }))); },
  oops() { play((o, t) => tone(o, t, 330, 0.45, { vol: 0.1, type: 'triangle', to: 150, glide: 0.4 })); },
  timeUp() { play((o, t) => { tone(o, t, N(84), 0.5, { vol: 0.13 }); tone(o, t, N(84) * 2.01, 0.3, { vol: 0.04 }); tone(o, t + 0.28, N(79), 0.7, { vol: 0.12 }); tone(o, t + 0.28, N(79) * 2.01, 0.4, { vol: 0.035 }); }); },
  fanfare() {
    play((o, t) => {
      const seq = [[67, 0, 0.14], [72, 0.15, 0.14], [76, 0.3, 0.14], [79, 0.45, 0.5], [76, 0.98, 0.14], [79, 1.13, 0.9]];
      seq.forEach(([n, at, d]) => { tone(o, t + at, N(n), d, { vol: 0.09, type: 'sawtooth', lp: 2200, a: 0.02 }); tone(o, t + at, N(n - 12), d, { vol: 0.05, type: 'triangle' }); });
    });
  }
};

/* Count a number up (or down) on screen. */
export function countTo(el, from, to, ms) {
  if (!el) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || from === to) { el.textContent = String(to); return; }
  const t0 = performance.now(), d = ms || 700;
  (function step(now) {
    const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3);
    el.textContent = String(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
