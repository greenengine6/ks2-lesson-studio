/* Class tools: the loud end sounds (School bell, Gong, Buzzer, Chime, Whistle, Fanfare) and a few small ones (the
   last-ten-seconds tick, a gentle noise alert, a cheer, a dice rattle). All of them are made on the device, sample by
   sample: there are no sound files.
   They play through their own chain (a gain, a compressor with a fast attack, makeup gain and a soft clipper), so they
   can be really loud without crackling. They do not use the site's little-sounds switch (Sound on or off): class-tool
   sounds have their own mute and volume in the tools' settings.
   iPhones mute Web Audio when the ring/silent switch is on, so there the sound is rendered once and played as an
   ordinary audio file, which the switch does not silence (the audio element is unlocked by the tap that starts the
   timer or tests a sound). */
import { Sound } from '../fx/audio.js?v=de4f9a51';
import { bus } from '../core.js?v=de4f9a51';

export const SOUNDS = [
  { id: 'bell', name: 'School bell', tint: '#3730A3' },
  { id: 'gong', name: 'Gong', tint: '#9A6A00' },
  { id: 'buzzer', name: 'Buzzer', tint: '#B85A12' },
  { id: 'chime', name: 'Chime', tint: '#1F7A75' },
  { id: 'whistle', name: 'Whistle', tint: '#0B7F99' },
  { id: 'fanfare', name: 'Fanfare', tint: '#C7356F' }
];
export const SOUND_ICON = {
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  gong: '<circle cx="12" cy="11" r="7"/><circle cx="12" cy="11" r="3"/><path d="M12 18v3M8 21h8"/>',
  buzzer: '<path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9l4-2M16 12h5M16 15l4 2"/>',
  chime: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  whistle: '<path d="M3.5 12.5a4.5 4.5 0 1 0 9 0v-1.5H21v-3H9.5"/><circle cx="8" cy="12.5" r="1.3" class="f"/><path d="M11 5.5 12.5 3M15 6l1.5-2.5"/>',
  fanfare: '<path d="M3 10v4h2l9 5V5l-9 5z"/><path d="M17.5 8.5a5 5 0 0 1 0 7M20 6a8.5 8.5 0 0 1 0 12"/>'
};
const TAU = Math.PI * 2;
const IOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
let forceElement = false;                        // tests can play through the audio element as an iPhone would

/* ---------------- tiny signal helpers ---------------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
/* A two-pole band-pass (RBJ cookbook), run over an array in place. */
function bandpass(x, sr, f, q) {
  const w = TAU * f / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w);
  const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}
function lowpass(x, sr, f) { const a = Math.exp(-TAU * f / sr); let y = 0; for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = y; } return x; }
/* Peak to 0.92, then a gentle saturation that makes it denser (louder to the ear) without hard clipping. */
function finish(x, drive) {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  if (!p) return x;
  const k = Math.tanh(drive);
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(drive * x[i] / p) / k * 0.92;
  return x;
}
/* A short fade at both ends, so nothing clicks. */
function edges(x, sr) { const n = Math.min(x.length >> 1, Math.round(sr * 0.004)); for (let i = 0; i < n; i++) { const g = i / n; x[i] *= g; x[x.length - 1 - i] *= g; } return x; }

/* ---------------- the sounds ---------------- */
const MAKE = {
  /* An electric school bell: a metal dome struck about 22 times a second by a clapper, ringing between strikes. */
  bell(sr) {
    const dur = 2.8, n = Math.round(sr * dur), x = new Float32Array(n), r = rng(7);
    const f0 = 940, ratios = [1, 1.4, 2.3, 3.2, 4.4, 5.9], amps = [1, 0.7, 0.55, 0.4, 0.28, 0.16], ph = ratios.map(() => r() * TAU);
    const rate = 22, T = 1 / rate, noise = new Float32Array(n);
    for (let i = 0; i < n; i++) noise[i] = r() * 2 - 1;
    bandpass(noise, sr, 3400, 1.4);
    for (let i = 0; i < n; i++) {
      const t = i / sr, tp = t % T;
      const strike = Math.exp(-tp / 0.019) * (1 - Math.exp(-tp / 0.0007));
      const env = (0.2 + 0.8 * strike) * Math.min(1, t / 0.005) * (t > dur - 0.4 ? Math.exp(-(t - (dur - 0.4)) / 0.11) : 1);
      let s = 0;
      for (let k = 0; k < ratios.length; k++) s += amps[k] * Math.sin(TAU * f0 * ratios[k] * t + ph[k]);
      x[i] = env * (s * 0.3 + noise[i] * 0.9 * strike);
    }
    return finish(edges(x, sr), 2.4);
  },
  /* A big gong: a low thump, then many out-of-tune partials that bloom and slowly fade, with a shimmer. */
  gong(sr) {
    const dur = 5.6, n = Math.round(sr * dur), x = new Float32Array(n), r = rng(11);
    const f0 = 98, ratios = [1, 1.52, 2.03, 2.48, 3.11, 3.68, 4.27, 5.0, 5.92, 6.7], amps = [1, 0.85, 0.72, 0.58, 0.5, 0.42, 0.34, 0.27, 0.2, 0.14];
    const ph = ratios.map(() => r() * TAU), thump = new Float32Array(n);
    for (let i = 0; i < Math.min(n, Math.round(sr * 0.12)); i++) thump[i] = (r() * 2 - 1) * Math.exp(-i / sr / 0.03);
    lowpass(thump, sr, 700);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      let s = 0;
      for (let k = 0; k < ratios.length; k++) {
        const tau = 4.2 / (1 + k * 0.32), bloom = k > 2 ? 1 - Math.exp(-t / (0.12 + k * 0.05)) : 1;
        const f = f0 * ratios[k];
        s += amps[k] * bloom * Math.exp(-t / tau) * (Math.sin(TAU * f * t + ph[k]) + 0.6 * Math.sin(TAU * (f + 0.55 + k * 0.08) * t + ph[k] * 1.7));
      }
      const low = Math.sin(TAU * 58 * t) * Math.exp(-t / 0.22);
      x[i] = s * 0.22 + low * 0.9 + thump[i] * 1.6;
    }
    return finish(edges(x, sr), 1.7);
  },
  /* A game-show buzzer: a rough, low, buzzing tone. */
  buzzer(sr) {
    const dur = 1.5, n = Math.round(sr * dur), x = new Float32Array(n);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, drop = t > dur - 0.25 ? 1 - 0.07 * (t - (dur - 0.25)) / 0.25 : 1;
      p1 = (p1 + 140 * drop / sr) % 1; p2 = (p2 + 211 * drop / sr) % 1;
      const saw = 2 * p1 - 1, sq = p2 < 0.5 ? 1 : -1, am = 1 - 0.42 * (0.5 + 0.5 * Math.sin(TAU * 34 * t));
      const env = Math.min(1, t / 0.008) * (t > dur - 0.16 ? Math.max(0, (dur - t) / 0.16) : 1);
      x[i] = env * am * (saw * 0.7 + sq * 0.45);
    }
    lowpass(x, sr, 3200);
    return finish(edges(x, sr), 2.6);
  },
  /* Bright bells going up: much louder than the site's little chime. */
  chime(sr) {
    const dur = 2.9, n = Math.round(sr * dur), x = new Float32Array(n);
    const notes = [[0, 1046.5], [0.22, 1318.5], [0.44, 1568], [0.7, 2093]], ratios = [1, 2, 3, 4.16], amps = [1, 0.36, 0.2, 0.12];
    notes.forEach(([at, f], j) => {
      const s0 = Math.round(at * sr);
      for (let i = s0; i < n; i++) {
        const t = (i - s0) / sr;
        let s = 0;
        for (let k = 0; k < ratios.length; k++) s += amps[k] * Math.exp(-t / (1.2 / (1 + k * 0.9))) * Math.sin(TAU * f * ratios[k] * t);
        x[i] += s * Math.min(1, t / 0.002) * (j === 3 ? 1.15 : 1);
      }
    });
    return finish(edges(x, sr), 1.8);
  },
  /* A referee's whistle: tweet, tweet, tweeeet, with the pea's trill and a little breath. */
  whistle(sr) {
    const parts = [[0, 0.18], [0.27, 0.18], [0.56, 0.95]], dur = 1.6, n = Math.round(sr * dur), x = new Float32Array(n), r = rng(5);
    const breath = new Float32Array(n);
    for (let i = 0; i < n; i++) breath[i] = r() * 2 - 1;
    bandpass(breath, sr, 3050, 6);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      let g = 0;
      parts.forEach(([a, d]) => { if (t >= a && t < a + d) g = Math.min(1, (t - a) / 0.012, (a + d - t) / 0.03); });
      const trill = Math.sin(TAU * 27 * t);
      ph += TAU * (3000 + 190 * trill) / sr;
      x[i] = g * (Math.sin(ph) * (1 - 0.35 * (0.5 + 0.5 * trill)) + breath[i] * 0.9);
    }
    return finish(edges(x, sr), 2.2);
  },
  /* A short brass fanfare: da-da-da-daaa, with a drum on the last note. */
  fanfare(sr) {
    const dur = 2.5, n = Math.round(sr * dur), x = new Float32Array(n);
    const notes = [[0, 0.16, 392], [0.18, 0.16, 523.25], [0.36, 0.16, 659.25], [0.56, 1.75, 783.99]];
    notes.forEach(([at, d, f], j) => {
      const s0 = Math.round(at * sr), s1 = Math.min(n, Math.round((at + d + 0.14) * sr));
      let p1 = 0, p2 = 0;
      for (let i = s0; i < s1; i++) {
        const t = (i - s0) / sr, last = j === 3;
        const vib = last && t > 0.25 ? 1 + 0.006 * Math.sin(TAU * 5.5 * t) : 1;
        p1 += TAU * f * vib / sr; p2 += TAU * f * vib * 1.0023 / sr;
        const bright = Math.min(1, t / 0.05);
        let s = 0;
        for (let h = 1; h <= 10; h++) { const a = Math.pow(h, -0.9) * (h > 3 ? bright : 1); s += a * (Math.sin(h * p1) + 0.6 * Math.sin(h * p2)); }
        const env = Math.min(1, t / 0.03) * (t < d ? (last ? 0.85 + 0.15 * Math.exp(-t / 0.2) : 1) : Math.max(0, 1 - (t - d) / 0.14));
        x[i] += s * env * 0.28;
      }
    });
    const d0 = Math.round(0.56 * sr);
    for (let i = d0; i < n; i++) { const t = (i - d0) / sr; x[i] += Math.sin(TAU * 98 * t) * Math.exp(-t / 0.28) * 1.1; }
    return finish(edges(x, sr), 1.6);
  },
  /* The last ten seconds: a soft wood-block tick. */
  tick(sr) {
    const n = Math.round(sr * 0.07), x = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / sr; x[i] = Math.exp(-t / 0.012) * (Math.sin(TAU * 1700 * t) + 0.5 * Math.sin(TAU * 2650 * t)); }
    return finish(edges(x, sr), 1.2);
  },
  /* A gentle two-note alert for the noise meter. */
  soft(sr) {
    const dur = 1.3, n = Math.round(sr * dur), x = new Float32Array(n);
    [[0, 880], [0.32, 659.25]].forEach(([at, f]) => {
      const s0 = Math.round(at * sr);
      for (let i = s0; i < n; i++) { const t = (i - s0) / sr; x[i] += Math.min(1, t / 0.03) * Math.exp(-t / 0.42) * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)); }
    });
    return finish(edges(x, sr), 1.1);
  },
  /* A cheer for class points: a quick rising sparkle. */
  cheer(sr) {
    const dur = 1.3, n = Math.round(sr * dur), x = new Float32Array(n), r = rng(3);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, j) => {
      const s0 = Math.round(j * 0.065 * sr);
      for (let i = s0; i < n; i++) { const t = (i - s0) / sr; x[i] += Math.min(1, t / 0.003) * Math.exp(-t / 0.35) * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2.01 * f * t)); }
    });
    const sp = new Float32Array(n);
    for (let i = 0; i < n; i++) sp[i] = (r() * 2 - 1) * Math.exp(-i / sr / 0.4) * (r() > 0.985 ? 1 : 0.15);
    bandpass(sp, sr, 6500, 2);
    for (let i = 0; i < n; i++) x[i] += sp[i] * 2.4;
    return finish(edges(x, sr), 1.4);
  },
  /* Dice rattling in a cup. */
  rattle(sr) {
    const dur = 0.55, n = Math.round(sr * dur), x = new Float32Array(n), r = rng(13);
    let at = 0;
    while (at < dur - 0.05) {
      const s0 = Math.round(at * sr), f = 1800 + r() * 2200;
      for (let i = s0; i < Math.min(n, s0 + Math.round(sr * 0.03)); i++) { const t = (i - s0) / sr; x[i] += Math.exp(-t / 0.006) * ((r() * 2 - 1) * 0.7 + Math.sin(TAU * f * t)); }
      at += 0.025 + r() * 0.06;
    }
    return finish(edges(x, sr), 1.3);
  }
};
const cache = new Map();
function samples(id, sr) {
  const k = id + '@' + sr;
  if (!cache.has(k)) cache.set(k, (MAKE[id] || MAKE.chime)(sr));
  return cache.get(k);
}

/* ---------------- the loud chain ---------------- */
let clipCurve = null;
function curve() {
  if (clipCurve) return clipCurve;
  const n = 2048, c = new Float32Array(n), k = Math.tanh(1.6);
  for (let i = 0; i < n; i++) { const v = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(1.6 * v) / k; }
  return (clipCurve = c);
}
/* volume 0 to 100 → the gain going into the compressor (a curve, so the slider feels even). */
export const gainFor = (v) => (v <= 0 ? 0 : Math.pow(Math.min(100, v) / 100, 1.5));
function chain(ctx, vol) {
  const g = ctx.createGain(); g.gain.value = gainFor(vol);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.2;
  const makeup = ctx.createGain(); makeup.gain.value = 2.2;
  const pre = ctx.createGain(); pre.gain.value = 0.72;
  const clip = ctx.createWaveShaper(); clip.curve = curve(); clip.oversample = '2x';
  g.connect(comp); comp.connect(makeup); makeup.connect(pre); pre.connect(clip); clip.connect(ctx.destination);
  return { input: g, nodes: [g, comp, makeup, pre, clip] };
}

/* ---------------- playing ---------------- */
const playing = new Set();
let audioEl = null;
function element() {
  if (!audioEl) { audioEl = new window.Audio(); audioEl.preload = 'auto'; audioEl.setAttribute('playsinline', ''); }
  return audioEl;
}
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
/* Call from a tap or key press (Start, Test): wakes the sound up so it can play later by itself. */
export function unlock() {
  const ctx = Sound.ctx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (IOS || forceElement) { try { const a = element(); a.src = SILENT; a.volume = 1; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not allowed yet */ } }
}
function wav(buf) {
  const ch = buf.getChannelData(0), n = ch.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 0x7fff, true);
  return new Blob([out], { type: 'audio/wav' });
}
async function viaElement(id, vol) {
  const sr = 44100, x = samples(id, sr);
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) return null;
  const off = new OAC(1, x.length + Math.round(sr * 0.25), sr), b = off.createBuffer(1, x.length, sr);
  b.copyToChannel ? b.copyToChannel(x, 0) : b.getChannelData(0).set(x);
  const src = off.createBufferSource(); src.buffer = b;
  src.connect(chain(off, vol).input); src.start(0);
  const rendered = await off.startRendering();
  const url = URL.createObjectURL(wav(rendered)), a = element();
  return new Promise((resolve) => {
    let over = false;
    const h = { stop() { try { a.pause(); } catch (e) { /* fine */ } done(); } };
    const done = () => { if (over) return; over = true; a.removeEventListener('ended', done); playing.delete(h); URL.revokeObjectURL(url); resolve(true); };
    playing.add(h);
    a.addEventListener('ended', done);
    a.src = url; a.volume = 1;
    const p = a.play();
    if (p && p.catch) p.catch(() => { done(); });
  });
}
function viaContext(id, vol) {
  const ctx = Sound.ctx();
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const x = samples(id, ctx.sampleRate), b = ctx.createBuffer(1, x.length, ctx.sampleRate);
  b.copyToChannel ? b.copyToChannel(x, 0) : b.getChannelData(0).set(x);
  const src = ctx.createBufferSource(); src.buffer = b;
  const ch = chain(ctx, vol);
  src.connect(ch.input);
  return new Promise((resolve) => {
    const h = { stop() { try { src.stop(); } catch (e) { /* already stopped */ } } };
    src.onended = () => { playing.delete(h); ch.nodes.forEach((nd) => { try { nd.disconnect(); } catch (e) { /* fine */ } }); resolve(true); };
    playing.add(h);
    try { src.start(); } catch (e) { resolve(false); }
  });
}
function once(id, vol) { return IOS || forceElement ? viaElement(id, vol).then((ok) => (ok == null ? viaContext(id, vol) : ok)) : viaContext(id, vol); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let run = 0;
/* Play a sound: o { volume 0..100, times (how many rings), gap (ms between them) }. Returns { stop(), done }. */
export function play(id, o) {
  o = o || {};
  const me = ++run, vol = o.volume == null ? 85 : o.volume, times = Math.max(1, Math.min(10, o.times || 1));
  let stopped = false;
  bus.emit('tools:alarm', { id, volume: vol, times });
  const done = (async () => {
    for (let k = 0; k < times && !stopped; k++) {
      if (vol > 0) await once(id, vol);
      if (k < times - 1 && !stopped) await wait(o.gap == null ? 450 : o.gap);
    }
    return !stopped;
  })();
  return { id: me, done, stop() { stopped = true; stopAll(); } };
}
export function stopAll() { Array.from(playing).forEach((h) => { try { h.stop(); } catch (e) { /* fine */ } }); playing.clear(); }
export const isPlaying = () => playing.size > 0;
/* For tests only: play as an iPhone would (through the audio element). */
export function useElement(on) { forceElement = !!on; }
export const Alarm = { SOUNDS, SOUND_ICON, play, stopAll, unlock, isPlaying, gainFor, useElement };
