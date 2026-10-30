/* One sound engine for the whole site. Every sound effect, the ambient soundscapes, the Wonder Window music and the
   Earth's space sound play through it, so one switch turns them all on or off (remembered on this device), and
   everything drops to a whisper while Symphony speaks, then comes back. The interface sounds are recorded
   instruments and designed sounds (assets/sounds/ui.mp3: celesta, marimba, vibraphone, tubular bells, woodblock,
   a soft glass tap, airy whooshes), fetched after the first tap; until they arrive the old live-made ones play.
   Each sound also has a feel on a phone that can vibrate (haptics.js), even with the sound off.

   Sound effects, where they play:
   - switches: a soft rising note for on, a falling one for off
   - Symphony: a sparkle when her chat opens, a softer one when it closes; two rising notes when she starts
     listening and two falling ones when she stops; a short whoosh when a question is sent
   - sign-in: a warm chime when it works, a low double tap when the PIN or password is wrong
   - lessons: a whoosh when making starts, a bright arpeggio when the lesson is ready, a low tap if it failed
   - Present mode: a rising swell on opening, a paper swish for each new screen, the timer's bell at the end
   - class feedback: a bubble pop for each face (higher for happier faces) and a chime when it is saved
   - messages: a tiny blip for each notice; a glassy tick when moving between engines
   - Wonder Window: a soft breath of wind between scenes; Escape Room: a click and fanfare when a lock opens */
import { Voice } from './voice.js?v=cdc164df';
import { haptic } from './haptics.js?v=cdc164df';
import { Samples } from './samples.js?v=cdc164df';

const KEY = 'ks2-engine.sound.v1';
const DUCKED = 0.12;                                   // how loud everything is while Symphony speaks
let ctx = null, master = null, sfxBus = null, ambBus = null, duck = false, lastFx = {}, lastAny = 0;
const listeners = [];

const read = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } };
let on = read();

function ensure() {
  if (ctx) return ctx;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  try { ctx = new C({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new C(); } catch (er) { return null; } }
  master = ctx.createGain();
  master.gain.value = on ? 1 : 0;
  const limit = ctx.createDynamicsCompressor();       // stacked sounds never clip
  limit.threshold.value = -10; limit.knee.value = 12; limit.ratio.value = 6; limit.attack.value = 0.003; limit.release.value = 0.25;
  master.connect(limit); limit.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
  ambBus = ctx.createGain(); ambBus.gain.value = 1; ambBus.connect(master);
  return ctx;
}
function level() { return on ? (duck ? DUCKED : 1) : 0; }
function apply(sec) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  try { master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(level(), t, sec == null ? 0.12 : sec); } catch (e) { master.gain.value = level(); }
}
/* Browsers only start sound after a tap or key press. */
let warmed = false;
function wake() {
  const c = ensure();
  if (c && c.state === 'suspended' && on) c.resume().catch(() => {});
  if (!warmed && on && c) { warmed = true; setTimeout(() => Samples.load('kit', 'ui'), 400); }   // the interface sounds, ready for the next tap
}
['pointerdown', 'pointerup', 'touchend', 'keydown'].forEach((t) => window.addEventListener(t, wake, { capture: true, passive: true }));

Voice.onSpeaking((s) => { duck = !!s; apply(s ? 0.08 : 0.35); });

export const Sound = {
  get on() { return on; },
  set on(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ }
    if (on) { warmed = false; wake(); }
    apply(0.1);
    listeners.forEach((fn) => { try { fn(on); } catch (e) { /* ignore */ } });
  },
  onChange(fn) { listeners.push(fn); },
  /* the shared context, started if allowed; null when sound cannot play yet */
  ctx() { const c = ensure(); if (c && c.state === 'suspended' && on) c.resume().catch(() => {}); return c; },
  get running() { return !!(ctx && ctx.state === 'running'); },
  get ducked() { return duck; },
  ambience() { ensure(); return ambBus; },
  effects() { ensure(); return sfxBus; }
};

/* ---------------- the sound effects ---------------- */
function g(v) { const n = ctx.createGain(); n.gain.value = v; return n; }
function tone(t, f, dur, o) {
  o = o || {};
  const osc = ctx.createOscillator(), env = g(0);
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur * 0.7));
  const peak = o.vol || 0.08, a = o.a || 0.006;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + a);
  env.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  osc.connect(env); env.connect(o.out || sfxBus);
  osc.start(t); osc.stop(t + a + dur + 0.05);
}
function bell(t, f, dur, vol) { tone(t, f, dur, { vol }); tone(t, f * 2.01, dur * 0.6, { vol: vol * 0.28 }); tone(t, f * 3.02, dur * 0.35, { vol: vol * 0.1 }); }
let noiseBuf = null;
function noise(t, dur, o) {
  o = o || {};
  if (!noiseBuf) {
    const n = ctx.sampleRate, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
  }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), env = g(0);
  s.buffer = noiseBuf;
  f.type = o.type || 'bandpass'; f.Q.value = o.q == null ? 0.9 : o.q;
  f.frequency.setValueAtTime(o.f || 1200, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const peak = o.vol || 0.05;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + (o.a || 0.02));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(env); env.connect(sfxBus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const FX = {
  tap(t) { tone(t, 1900, 0.035, { vol: 0.035 }); },
  nav(t) { tone(t, 2400, 0.05, { vol: 0.03 }); tone(t + 0.02, 3600, 0.04, { vol: 0.015 }); },
  on(t) { bell(t, NOTE(79), 0.16, 0.05); bell(t + 0.07, NOTE(86), 0.22, 0.045); },
  off(t) { bell(t, NOTE(84), 0.14, 0.04); bell(t + 0.07, NOTE(77), 0.2, 0.035); },
  open(t) { [72, 76, 79, 84, 88].forEach((n, i) => bell(t + i * 0.045, NOTE(n), 0.28, 0.04)); noise(t, 0.35, { f: 5000, q: 0.6, vol: 0.012, a: 0.05 }); },
  close(t) { [84, 79, 72].forEach((n, i) => bell(t + i * 0.05, NOTE(n), 0.2, 0.03)); },
  listen(t) { bell(t, NOTE(76), 0.18, 0.06); bell(t + 0.11, NOTE(83), 0.26, 0.06); },
  unlisten(t) { bell(t, NOTE(83), 0.16, 0.05); bell(t + 0.1, NOTE(76), 0.22, 0.045); },
  send(t) { noise(t, 0.26, { f: 500, to: 3200, q: 1.2, vol: 0.05, a: 0.03 }); tone(t + 0.12, 1320, 0.08, { vol: 0.025 }); },
  success(t) { [72, 76, 79, 84].forEach((n, i) => bell(t + i * 0.075, NOTE(n), 0.42, 0.055)); },
  error(t) { tone(t, 220, 0.12, { type: 'triangle', vol: 0.09 }); tone(t + 0.14, 175, 0.18, { type: 'triangle', vol: 0.08 }); },
  pop(t, i) { const f = 340 * (1 + (i || 0) * 0.18); tone(t, f, 0.09, { to: f * 2.6, glide: 0.05, vol: 0.09 }); },
  page(t) { noise(t, 0.16, { type: 'highpass', f: 2600, q: 0.4, vol: 0.035, a: 0.01 }); noise(t + 0.03, 0.12, { f: 1400, to: 700, vol: 0.02 }); },
  present(t) { noise(t, 0.7, { f: 300, to: 2400, q: 0.8, vol: 0.045, a: 0.3 }); tone(t, 110, 0.9, { to: 165, glide: 0.6, vol: 0.05, a: 0.25 }); [79, 84, 88].forEach((n, i) => bell(t + 0.45 + i * 0.06, NOTE(n), 0.35, 0.03)); },
  toast(t) { tone(t, 1320, 0.07, { vol: 0.022 }); },
  chime(t) { [660, 880, 1320].forEach((f, k) => bell(t + k * 0.18, f, 0.9, 0.09)); },
  whoosh(t) { noise(t, 0.55, { f: 2600, to: 400, q: 0.7, vol: 0.04, a: 0.18 }); },
  unlock(t) { tone(t, 2200, 0.025, { type: 'square', vol: 0.03 }); tone(t + 0.03, 1500, 0.03, { type: 'square', vol: 0.025 }); FX.success(t + 0.12); }
};
/* What each sound feels like on a phone (haptics.js plays it only right after a touch). */
const FEEL = { tap: 'tick', nav: 'tick', on: 'tick', off: 'tick', open: 'pop', close: 'tick', listen: 'tick', unlisten: 'tick', send: 'whoosh', success: 'success',
  error: 'error', pop: 'pop', page: 'tick', present: 'whoosh', chime: 'pop', whoosh: 'whoosh', unlock: 'success' };
/* Play one sound effect by name. Quietly does nothing while sound is off or before the first tap. */
export function sfx(name, arg) {
  if (FEEL[name]) haptic(FEEL[name]);
  if (!on || !FX[name]) return;
  const c = ensure();
  if (!c || c.state !== 'running') { if (c && c.state === 'suspended') c.resume().catch(() => {}); return; }
  const now = performance.now();
  if (now - (lastFx[name] || 0) < 45) return;          // never a machine-gun of the same sound
  if (name === 'toast' && now - lastAny < 600) return; // a notice right after another sound stays quiet
  lastFx[name] = now; lastAny = now;
  try {
    if (Samples.sprite('ui', name, { out: sfxBus, gain: name === 'toast' ? 0.7 : 1, rate: name === 'pop' && arg ? 1 + Math.min(6, arg) * 0.09 : 1 })) return;
    FX[name](c.currentTime + 0.005, arg);
  } catch (e) { /* ignore */ }
}
