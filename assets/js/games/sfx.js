/* Game sounds: a bubble pop, a bright "right" marimba run, a soft "not that one", a card flip, a whoosh, a tick, a start
   cue, a step forward and a fanfare. They are the site's recorded interface sounds (minisprite.js); until those
   have arrived (or offline) the live-made versions below play. Each is also felt on a phone that can vibrate.
   One AudioContext, made on the first sound (browsers only allow sound after a tap); a host page may pass its own
   (o.ctx) so the main site shares the one it already has. Imports only small modules, so the pupils' page can use it. */
import { haptic } from '../fx/haptics.js?v=49509700';
import { warmUI, playUI } from '../fx/minisprite.js?v=49509700';
const REC = { pop: 'pop', right: 'success', wrong: 'error', flip: 'flip', whoosh: 'whoosh', tick: 'tick', go: 'go', step: 'step', win: 'win', lose: 'lose' };
const FEEL = { pop: 'pop', right: 'success', wrong: 'error', flip: 'tick', whoosh: 'whoosh', go: 'tick', step: 'tick', win: 'success', lose: 'error' };
export function makeSfx(o) {
  o = o || {};
  let ctx = o.ctx || null, out = null, on = o.sound !== false, noiseBuf = null;
  const own = !o.ctx;
  function ensure() {
    if (!on) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new C(); } catch (er) { return null; } }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!out) {
      out = ctx.createGain(); out.gain.value = 0.85;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
      out.connect(comp); comp.connect(ctx.destination);
      warmUI(ctx);
    }
    return ctx;
  }
  function tone(t, f, dur, opt) {
    opt = opt || {};
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (opt.to) osc.frequency.exponentialRampToValueAtTime(opt.to, t + (opt.glide || dur * 0.8));
    const peak = opt.vol || 0.12, a = opt.a || 0.008;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + a);
    env.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    osc.connect(env); env.connect(out);
    osc.start(t); osc.stop(t + a + dur + 0.05);
  }
  function noise(t, dur, opt) {
    opt = opt || {};
    if (!noiseBuf) {
      const n = ctx.sampleRate, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = b;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), env = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = opt.type || 'bandpass'; f.Q.value = opt.q == null ? 1 : opt.q;
    f.frequency.setValueAtTime(opt.f || 1500, t);
    if (opt.to) f.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(opt.vol || 0.1, t + (opt.a || 0.005));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(env); env.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const bell = (t, f, dur, vol) => { tone(t, f, dur, { vol }); tone(t, f * 2.01, dur * 0.6, { vol: vol * 0.3 }); };
  const FX = {
    pop(t) { noise(t, 0.09, { type: 'highpass', f: 900, q: 0.5, vol: 0.3, a: 0.002 }); tone(t, 520, 0.08, { to: 180, vol: 0.12, type: 'triangle' }); },
    right(t) { bell(t, N(79), 0.25, 0.12); bell(t + 0.08, N(84), 0.35, 0.12); },
    wrong(t) { tone(t, 196, 0.16, { type: 'square', vol: 0.05 }); tone(t + 0.13, 156, 0.22, { type: 'square', vol: 0.05 }); },
    flip(t) { noise(t, 0.06, { type: 'highpass', f: 3000, q: 0.6, vol: 0.08, a: 0.002 }); tone(t, 1400, 0.04, { vol: 0.03 }); },
    whoosh(t) { noise(t, 0.4, { f: 400, to: 2800, q: 0.8, vol: 0.08, a: 0.12 }); },
    tick(t) { tone(t, 1800, 0.03, { vol: 0.05, type: 'square' }); },
    go(t) { bell(t, N(72), 0.18, 0.1); bell(t + 0.16, N(79), 0.3, 0.12); },
    step(t) { tone(t, N(76), 0.1, { vol: 0.08, type: 'triangle' }); tone(t + 0.07, N(83), 0.14, { vol: 0.08, type: 'triangle' }); },
    win(t) { [72, 76, 79, 84, 88].forEach((n, i) => bell(t + i * 0.11, N(n), 0.5, 0.11)); tone(t + 0.55, N(60), 0.7, { type: 'triangle', vol: 0.08 }); },
    lose(t) { [67, 64, 60].forEach((n, i) => tone(t + i * 0.16, N(n), 0.26, { type: 'triangle', vol: 0.08 })); }
  };
  return {
    play(name) {
      if (FEEL[name]) haptic(FEEL[name]);
      const c = ensure();
      if (!c || !FX[name] || c.state !== 'running' && c.state !== 'suspended') return;
      try { if (playUI(c, REC[name], out, { gain: 1.1 })) return; FX[name](c.currentTime + 0.01); } catch (e) { /* a sound never stops a game */ }
    },
    get sound() { return on; },
    set sound(v) { on = !!v; },
    close() { if (own && ctx) { try { ctx.close(); } catch (e) { /* ignore */ } } ctx = own ? null : ctx; out = null; noiseBuf = null; }
  };
}
