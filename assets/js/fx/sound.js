/* Ambient soundscapes made live with the Web Audio API (no audio files), plus read-aloud in Symphony's voice.
   Scenes: rain, ocean, wind, river, forest, birds, night, city, market. Crossfades between scenes. */
import { Voice } from './voice.js?v=5de985bf';
import { Sound } from './audio.js?v=5de985bf';

let ctx = null;
function ac() { ctx = Sound.ctx(); return ctx; }          // the site's one sound engine (audio.js): one switch, quiet while Symphony speaks
const buffers = {};
function noise(c, type) {
  if (buffers[type]) return buffers[type];
  const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (type === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    } else d[i] = w;
  }
  const drift = d[len - 1] - d[0];                       // make the loop seamless
  for (let i = 0; i < len; i++) d[i] -= drift * (i / len);
  buffers[type] = buf;
  return buf;
}
function src(c, type) { const s = c.createBufferSource(); s.buffer = noise(c, type); s.loop = true; s.start(c.currentTime + Math.random() * 0.01, Math.random() * 3); return s; }
function filt(c, type, f, q) { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q == null ? 0.7 : q; return x; }
function gain(c, v) { const g = c.createGain(); g.gain.value = v; return g; }
function lfo(c, hz, depth, target) { const o = c.createOscillator(); o.frequency.value = hz; const g = gain(c, depth); o.connect(g); g.connect(target); o.start(); return o; }

function chirp(c, out, base, vol) {
  const t = c.currentTime + 0.02, n = 2 + Math.floor(Math.random() * 4), f0 = base * (0.85 + Math.random() * 0.4);
  for (let k = 0; k < n; k++) {
    const o = c.createOscillator(), g = gain(c, 0), st = t + k * (0.09 + Math.random() * 0.05);
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, st);
    o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.35), st + 0.06);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vol, st + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.08);
    o.connect(g); g.connect(out); o.start(st); o.stop(st + 0.1);
  }
}
function cricket(c, out, vol) {
  const t = c.currentTime + 0.02;
  for (let k = 0; k < 3; k++) {
    const o = c.createOscillator(), g = gain(c, 0), st = t + k * 0.05;
    o.frequency.value = 4300 + Math.random() * 300;
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vol, st + 0.006); g.gain.linearRampToValueAtTime(0, st + 0.03);
    o.connect(g); g.connect(out); o.start(st); o.stop(st + 0.04);
  }
}
function croak(c, out, vol) {
  const t = c.currentTime + 0.02;
  for (let k = 0; k < 2; k++) {
    const o = c.createOscillator(), f = filt(c, 'bandpass', 420, 4), g = gain(c, 0), st = t + k * 0.22;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(115, st); o.frequency.linearRampToValueAtTime(90, st + 0.16);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vol, st + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.18);
    o.connect(f); f.connect(g); g.connect(out); o.start(st); o.stop(st + 0.2);
  }
}
function drop(c, out, vol) {
  const s = c.createBufferSource(); s.buffer = noise(c, 'white');
  const f = filt(c, 'bandpass', 2200 + Math.random() * 3000, 6), g = gain(c, 0), t = c.currentTime + 0.01;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 3); s.stop(t + 0.06);
}
function every(minMs, maxMs, fn) {
  let id; const go = () => { id = setTimeout(() => { fn(); go(); }, minMs + Math.random() * (maxMs - minMs)); }; go();
  return () => clearTimeout(id);
}

const SCENES = {
  ocean(c, out) {
    const s = src(c, 'brown'), lp = filt(c, 'lowpass', 520, 0.6), g = gain(c, 0.6);
    s.connect(lp); lp.connect(g); g.connect(out);
    const o1 = lfo(c, 0.085, 380, lp.frequency), o2 = lfo(c, 0.085, 0.35, g.gain);
    const s2 = src(c, 'pink'), hp = filt(c, 'highpass', 1800, 0.5), g2 = gain(c, 0.05);
    s2.connect(hp); hp.connect(g2); g2.connect(out); const o3 = lfo(c, 0.085, 0.045, g2.gain);
    return () => [s, s2, o1, o2, o3].forEach((n) => n.stop());
  },
  rain(c, out) {
    const s = src(c, 'white'), hp = filt(c, 'highpass', 800), lp = filt(c, 'lowpass', 7000), g = gain(c, 0.16);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    const s2 = src(c, 'brown'), g2 = gain(c, 0.25); s2.connect(g2); g2.connect(out);
    const stopDrops = every(25, 110, () => drop(c, out, 0.05 + Math.random() * 0.12));
    return () => { stopDrops(); s.stop(); s2.stop(); };
  },
  wind(c, out) {
    const s = src(c, 'pink'), bp = filt(c, 'bandpass', 520, 0.8), g = gain(c, 0.9);
    s.connect(bp); bp.connect(g); g.connect(out);
    const o1 = lfo(c, 0.06, 320, bp.frequency), o2 = lfo(c, 0.045, 0.45, g.gain);
    return () => [s, o1, o2].forEach((n) => n.stop());
  },
  river(c, out) {
    const s = src(c, 'white'), bp = filt(c, 'bandpass', 1100, 0.55), lp = filt(c, 'lowpass', 3200), g = gain(c, 0.22);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(out);
    const o1 = lfo(c, 4.2, 0.05, g.gain), o2 = lfo(c, 0.31, 260, bp.frequency);
    const s2 = src(c, 'brown'), g2 = gain(c, 0.35); s2.connect(g2); g2.connect(out);
    return () => [s, s2, o1, o2].forEach((n) => n.stop());
  },
  forest(c, out) {
    const stopWind = SCENES.wind(c, (() => { const g = gain(c, 0.35); g.connect(out); return g; })());
    const stopBirds = every(700, 3200, () => chirp(c, out, 2600 + Math.random() * 1800, 0.05 + Math.random() * 0.05));
    return () => { stopWind(); stopBirds(); };
  },
  birds(c, out) {
    const s = src(c, 'pink'), g = gain(c, 0.05); s.connect(g); g.connect(out);
    const a = every(350, 1500, () => chirp(c, out, 2800 + Math.random() * 2200, 0.05 + Math.random() * 0.06));
    return () => { a(); s.stop(); };
  },
  night(c, out) {
    const s = src(c, 'brown'), g = gain(c, 0.12); s.connect(g); g.connect(out);
    const a = every(450, 1100, () => cricket(c, out, 0.035));
    const b = every(2500, 7000, () => croak(c, out, 0.12));
    return () => { a(); b(); s.stop(); };
  },
  city(c, out) {
    const s = src(c, 'brown'), bp = filt(c, 'bandpass', 430, 0.5), g = gain(c, 0.55);
    s.connect(bp); bp.connect(g); g.connect(out);
    const o1 = lfo(c, 0.27, 0.18, g.gain);
    const r = src(c, 'brown'), lp = filt(c, 'lowpass', 140), g2 = gain(c, 0.6); r.connect(lp); lp.connect(g2); g2.connect(out);
    return () => [s, r, o1].forEach((n) => n.stop());
  },
  market(c, out) {
    const stopCity = SCENES.city(c, out);
    const bell = every(3500, 9000, () => {
      const o = c.createOscillator(), g = gain(c, 0), t = c.currentTime + 0.02;
      o.frequency.value = 880 + Math.random() * 660;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.3);
    });
    return () => { stopCity(); bell(); };
  }
};
export const SOUND_KINDS = Object.keys(SCENES);

export const Ambient = {
  kind: 'none', vol: 0.55, layers: [],
  supported: !!(window.AudioContext || window.webkitAudioContext),
  play(kind) {
    const c = ac();
    if (!c) return;
    if (!SCENES[kind]) kind = 'none';
    if (kind === this.kind) return;
    this.fadeOutAll(1.2);
    this.kind = kind;
    if (kind === 'none') return;
    const g = gain(c, 0); g.connect(Sound.ambience());
    const stop = SCENES[kind](c, g);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(this.vol, c.currentTime + 1.6);
    this.layers.push({ g, stop });
  },
  fadeOutAll(sec) {
    const c = ctx; if (!c) return;
    this.layers.forEach((l) => {
      try { l.g.gain.cancelScheduledValues(c.currentTime); l.g.gain.setValueAtTime(l.g.gain.value, c.currentTime); l.g.gain.linearRampToValueAtTime(0, c.currentTime + sec); } catch (e) { /* ignore */ }
      setTimeout(() => { try { l.stop(); l.g.disconnect(); } catch (e) { /* already stopped */ } }, sec * 1000 + 100);
    });
    this.layers = [];
  },
  stop() { this.fadeOutAll(0.8); this.kind = 'none'; }
};

/* ---------------- read aloud: always Symphony's voice (see voice.js) ---------------- */
export const Speech = {
  supported: Voice.supported,
  pick: (lang) => Voice.pick(lang),
  hasVoice: (lang) => Voice.hasVoice(lang),
  speak: (text, o) => Voice.say(text, { lang: (o && o.lang) || 'en-GB', rate: (o && o.rate) || 0.95 }),
  stop: () => Voice.stop()
};
