/* Wonder Window's music and sound effects, played through the site's one sound engine (audio.js), so the Sound
   switches and Symphony's quiet-while-she-speaks all apply.

   Music: a small band for each festival and wonder, in its own style: gongs and a lion-dance drum, a dhol beat,
   tabla and a sitar raga, samba drums, sleigh bells, a koto for the guzheng, a sape, temple bells, a qanun for the
   oud, a harp for the lyre, pan pipes, an ocarina… Each style is a tempo, a drum pattern and a scale the melody
   wanders through, so it never plays the same tune twice. The notes are recorded instruments (the FluidR3 GM
   soundfont, CC BY 3.0) with a shared hall reverb; the drums are recorded and designed hits. The music waits a
   moment for its instrument to arrive; offline it plays the old live-made instruments.
   Effects: recorded or designed offline (samples.js, assets/sounds/fx-*.mp3): fireworks, firecrackers, a splash, a
   lantern lifting off, a jet, hooves, a cheering crowd, thunder, a tiger, a hornbill, bats, fireflies… Each one is
   also felt on a phone that can vibrate, when it follows a touch (haptics.js). */
import { Sound } from '../fx/audio.js?v=cdc164df';
import { Samples } from '../fx/samples.js?v=cdc164df';
import { haptic } from '../fx/haptics.js?v=cdc164df';
import { FX as BANK } from '../fx/soundbank.js?v=cdc164df';

const live = () => { const c = Sound.ctx(); return c && c.state === 'running' ? c : null; };
let musicBus = null, fxBus = null, noiseBuf = null;
let wetBus = null;
function buses(c) {
  if (!musicBus) { musicBus = c.createGain(); musicBus.gain.value = 0.85; musicBus.connect(Sound.ambience()); }
  if (!fxBus) { fxBus = c.createGain(); fxBus.gain.value = 1; fxBus.connect(Sound.effects()); }
  if (!wetBus) wetBus = Samples.reverb(musicBus);
}
function noise(c) {
  if (noiseBuf) return noiseBuf;
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* ---------------- instruments (t: when, in the context's time) ---------------- */
function env(c, t, peak, a, d, out) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(out);
  return g;
}
function osc(c, type, f, t, stop, to) {
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + Math.min(0.25, stop * 0.5));
  o.start(t); o.stop(t + stop + 0.05);
  return o;
}
function hiss(c, t, dur, type, f, q, peak, out, a, to) {
  const s = c.createBufferSource(), fl = c.createBiquadFilter();
  s.buffer = noise(c); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = env(c, t, peak, a || 0.004, dur, out);
  s.connect(fl); fl.connect(g); s.start(t, Math.random() * 1.5); s.stop(t + (a || 0.004) + dur + 0.05);
}
const INST = {
  pluck(c, t, f, v, out) {                 // a plucked string: guzheng, sape, guitar, tumbi
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6); lp.connect(out);
    const g = env(c, t, v, 0.004, 1.1, lp);
    osc(c, 'triangle', f, t, 1.2).connect(g); osc(c, 'sawtooth', f * 1.003, t, 0.5).connect(env(c, t, v * 0.25, 0.003, 0.35, lp));
  },
  bell(c, t, f, v, out) {                  // metal: bonang, sleigh-bell melody, temple bells
    [[1, 1, 1.3], [2.76, 0.32, 0.6], [5.4, 0.12, 0.3]].forEach(([r, k, d]) => { if (f * r < 16000) osc(c, 'sine', f * r, t, d + 0.1).connect(env(c, t, v * k, 0.003, d, out)); });
  },
  mallet(c, t, f, v, out) {                // a wooden xylophone (ranat), short and bright
    osc(c, 'sine', f, t, 0.3).connect(env(c, t, v, 0.002, 0.26, out)); osc(c, 'sine', f * 3.9, t, 0.1).connect(env(c, t, v * 0.2, 0.002, 0.07, out));
  },
  reed(c, t, f, v, out) {                  // a soft reed or trumpet for the melody (klezmer, mariachi)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f * 3.2; lp.connect(out);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.7, t + 0.05); g.gain.setValueAtTime(v * 0.6, t + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); g.connect(lp);
    const o = osc(c, 'square', f, t, 0.45); const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.value = f * 0.012; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + 0.5);
    o.connect(g);
  },
  gong(c, t, f, v, out) {                  // a big gong: low, shimmering, slow to fade
    [[1, 1, 3.2], [1.48, 0.5, 2.4], [2.31, 0.3, 1.6], [3.2, 0.12, 1]].forEach(([r, k, d]) => osc(c, 'sine', f * r, t, d + 0.2, f * r * 0.985).connect(env(c, t, v * k, 0.02, d, out)));
  },
  kick(c, t, f, v, out) { osc(c, 'sine', f * 2.2, t, 0.35, f).connect(env(c, t, v, 0.002, 0.3, out)); },        // dhol bass, surdo, thavil, big drum
  slap(c, t, f, v, out) { hiss(c, t, 0.07, 'bandpass', f, 1.4, v, out); osc(c, 'sine', f * 0.35, t, 0.08, f * 0.2).connect(env(c, t, v * 0.5, 0.002, 0.06, out)); },   // dhol treble, tabla, tamborim
  shake(c, t, f, v, out) { hiss(c, t, 0.045, 'highpass', f, 0.7, v, out, 0.01); },                                   // shakers, sleigh bells' rattle
  clap(c, t, f, v, out) { for (let k = 0; k < 3; k++) hiss(c, t + k * 0.011, 0.05, 'bandpass', f, 1, v * (k === 2 ? 1 : 0.6), out); },
  crash(c, t, f, v, out) { hiss(c, t, 1.2, 'highpass', f, 0.5, v, out, 0.003); },
  wood(c, t, f, v, out) { osc(c, 'sine', f, t, 0.08, f * 0.9).connect(env(c, t, v, 0.001, 0.06, out)); },              // a wood block, a ching
  whistle(c, t, f, v, out) {                                                                                      // the samba whistle
    const o = osc(c, 'sine', f, t, 0.18); const tr = c.createOscillator(), tg = c.createGain(); tr.frequency.value = 38; tg.gain.value = f * 0.04; tr.connect(tg); tg.connect(o.frequency); tr.start(t); tr.stop(t + 0.2);
    o.connect(env(c, t, v, 0.01, 0.15, out));
  },
  pipe(c, t, f, v, out) {                  // a pan flute or ocarina: soft, breathy, a slow swell
    const o = osc(c, 'sine', f, t, 0.55); const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 4.8; vg.gain.value = f * 0.008; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + 0.6);
    o.connect(env(c, t, v, 0.07, 0.45, out)); osc(c, 'triangle', f * 2.003, t, 0.4).connect(env(c, t, v * 0.16, 0.09, 0.3, out));
    hiss(c, t, 0.3, 'bandpass', f * 2.1, 5, v * 0.45, out, 0.05);                                                 // the breath
  }
};

/* ---------------- the styles ----------------
   bpm counts quarter notes; patterns are 16 steps (16th notes), 12 for a waltz. Drum rows: [instrument, pitch, volume,
   pattern]. The melody wanders through the scale (semitones above the root), one note on each step marked in
   `mel`, now and then leaping, resting or ringing a chord. */
const X = (s) => s.split('').map((ch) => (ch === 'x' ? 1 : ch === 'o' ? 0.55 : 0));
const STYLES = {
  gamelan: { bpm: 70, steps: 16, root: 62, scale: [0, 2, 5, 7, 9], inst: 'bell', vol: 0.05, mel: X('x.x.x.x.x.x.x.x.'), oct: [0, 12], gong: 32,
    drums: [['kick', 70, 0.08, X('x.......o.......')], ['wood', 520, 0.03, X('....x.......x...')]] },
  sape: { bpm: 84, steps: 16, root: 64, scale: [0, 2, 4, 7, 9], inst: 'pluck', vol: 0.07, mel: X('x.xx.xx.x.xx.x.x'), oct: [0, 12], ostinato: true, gong: 32,
    drums: [['kick', 60, 0.05, X('x...............')]] },
  gongs: { bpm: 104, steps: 16, root: 62, scale: [0, 2, 4, 7, 9], inst: 'bell', vol: 0.035, mel: X('x...x...x.x.x...'), oct: [12], gong: 64,
    drums: [['kick', 58, 0.13, X('x.x.x...x.x.xx..')], ['crash', 5200, 0.022, X('x.......x.......')], ['wood', 880, 0.03, X('..x...x...x...x.')]] },
  guzheng: { bpm: 64, steps: 16, root: 64, scale: [0, 2, 4, 7, 9], inst: 'pluck', vol: 0.07, mel: X('x.x.xxx.x...x.x.'), oct: [0, 12], gliss: true,
    drums: [['wood', 700, 0.02, X('x.......x.......')]] },
  chimes: { bpm: 56, steps: 16, root: 69, scale: [0, 2, 4, 7, 9], inst: 'bell', vol: 0.04, mel: X('x...o.......o...'), oct: [0, 12, 24], gong: 64, drums: [] },
  dhol: { bpm: 128, steps: 16, root: 62, scale: [0, 2, 4, 5, 7, 9, 10], inst: 'pluck', vol: 0.05, mel: X('x.x.x..xx.x.x..x'), oct: [12], ostinato: true,
    drums: [['kick', 62, 0.14, X('x.....x.x.....x.')], ['slap', 2200, 0.06, X('..x...x...x...xx')], ['shake', 7000, 0.02, X('xxxxxxxxxxxxxxxx')], ['clap', 1500, 0.03, X('....x.......x...')]] },
  tabla: { bpm: 88, steps: 16, root: 60, scale: [0, 1, 4, 5, 7, 8, 11], inst: 'pluck', vol: 0.055, mel: X('x...x.x.x...x.x.'), oct: [0, 12], drone: true,
    drums: [['kick', 72, 0.09, X('x.....x...x.....')], ['slap', 3000, 0.05, X('..x.x...x.x.x.xx')]] },
  bells: { bpm: 108, steps: 16, root: 67, scale: [0, 2, 4, 5, 7, 9, 11], inst: 'bell', vol: 0.05, mel: X('x.x.x.x.x.x.x...'), oct: [0, 12], chord: true,
    drums: [['shake', 8000, 0.035, X('x.xxx.xxx.xxx.xx')], ['kick', 60, 0.04, X('x.......x.......')]] },
  klezmer: { bpm: 112, steps: 16, root: 62, scale: [0, 1, 4, 5, 7, 8, 10], inst: 'reed', vol: 0.045, mel: X('x.xxx.x.x.xxx.x.'), oct: [0, 12],
    drums: [['kick', 55, 0.08, X('x.......x.......')], ['clap', 1800, 0.025, X('....x.......x...')]] },
  samba: { bpm: 104, steps: 16, root: 64, scale: [0, 2, 4, 7, 9], inst: 'mallet', vol: 0.035, mel: X('..x...x...x.x...'), oct: [12], whistle: true,
    drums: [['kick', 50, 0.13, X('....x.......x...')], ['kick', 64, 0.05, X('x.......x.......')], ['slap', 3200, 0.04, X('x.xx.x.xx.xx.x.x')], ['shake', 7500, 0.03, X('xxxxxxxxxxxxxxxx')], ['wood', 1180, 0.03, X('x..x..x...x..x..')]] },
  waltz: { bpm: 96, steps: 12, root: 64, scale: [0, 2, 4, 5, 7, 9, 11], inst: 'pluck', vol: 0.06, mel: X('x..x.xx..x..'), oct: [0, 12], chord: true,
    drums: [['kick', 55, 0.07, X('x...........')], ['slap', 1600, 0.025, X('....x...x...')]] },
  thai: { bpm: 96, steps: 16, root: 64, scale: [0, 2, 4, 7, 9], inst: 'mallet', vol: 0.05, mel: X('x.x.xxx.x.x.xx.x'), oct: [0, 12],
    drums: [['wood', 2600, 0.025, X('x.x.x.x.x.x.x.x.')], ['kick', 70, 0.06, X('x.....x.x.......')]] },
  // the Seven Wonders: an oud and a darbuka for Egypt, Jordan and Babylon's river; a lyre for Greece and Rome; a soft
  // guitar for Rio; pan pipes for the Andes; a clay flute and drums for the Maya
  oud: { bpm: 78, steps: 16, root: 62, scale: [0, 1, 4, 5, 7, 8, 10], inst: 'pluck', vol: 0.06, mel: X('x.x.xx.x.x.x.xx.'), oct: [0, 12], drone: true,
    drums: [['kick', 75, 0.07, X('x..x....x..x..x.')], ['slap', 2600, 0.035, X('..x...x...x...x.')]] },
  lyre: { bpm: 66, steps: 16, root: 64, scale: [0, 2, 3, 5, 7, 9, 10], inst: 'pluck', vol: 0.06, mel: X('x..x..x.x..x..x.'), oct: [0, 12], chord: true, drums: [] },
  bossa: { bpm: 82, steps: 16, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], inst: 'pluck', vol: 0.05, mel: X('x..x..x...x.x...'), oct: [0, 12], chord: true,
    drums: [['kick', 55, 0.045, X('x..x..x.x..x..x.')], ['shake', 7500, 0.016, X('x.x.x.x.x.x.x.x.')], ['wood', 900, 0.018, X('x..x..x...x..x..')]] },
  andes: { bpm: 92, steps: 16, root: 69, scale: [0, 3, 5, 7, 10], inst: 'pipe', vol: 0.055, mel: X('x.x.x...x.x.x...'), oct: [0, 12],
    drums: [['kick', 65, 0.06, X('x...x...x...x...')], ['shake', 6500, 0.018, X('..x...x...x...x.')]] },
  maya: { bpm: 100, steps: 16, root: 67, scale: [0, 2, 3, 7, 8], inst: 'pipe', vol: 0.05, mel: X('x..x.x..x..x.x..'), oct: [0, 12],
    drums: [['kick', 60, 0.09, X('x.......x.x.....')], ['wood', 1400, 0.028, X('..x.x...x.x.x...')], ['shake', 5000, 0.022, X('x.x.x.x.x.x.x.x.')]] },
  none: null
};

/* ---------------- recorded instruments for each style ---------------- */
const KIT = { gamelan: 'i-vibraphone', sape: 'i-guitar-steel', gongs: 'i-glockenspiel', guzheng: 'i-koto', chimes: 'i-tubular', dhol: 'i-banjo', tabla: 'i-sitar',
  bells: 'i-glockenspiel', klezmer: 'i-clarinet', samba: 'i-marimba', waltz: 'i-guitar-nylon', thai: 'i-xylophone', oud: 'i-dulcimer', lyre: 'i-harp',
  bossa: 'i-guitar-nylon', andes: 'i-pan-flute', maya: 'i-ocarina' };
const HELD = { 'i-clarinet': 0.42, 'i-pan-flute': 0.5, 'i-ocarina': 0.48 };       // wind instruments: notes are cut short, with a soft release
const TRIM = { 'i-tubular': 1.8, 'i-clarinet': 1.4, 'i-ocarina': 1.15 };                // a few instruments sit a little low in the mix
let curKit = '';
/* one note on the style's recorded instrument; false if it is not ready (the live-made one plays instead) */
function noteOn(c, t, midi, v) {
  if (!curKit) return false;
  return Samples.note(curKit, midi, { out: musicBus, send: wetBus, when: t, gain: Math.min(0.6, v * 3.6 * (TRIM[curKit] || 1)), dur: HELD[curKit] });
}
/* a drum hit from the recorded kit; the style decides which drum each part plays */
function drumOn(c, t, k, f, v, style) {
  let name = k, rate = 1, g = Math.min(0.5, v * 2.4);
  if (k === 'kick') { if (style === 'tabla') { name = 'bayan'; rate = f / 72; } else { name = f < 60 ? 'kick' : 'kick2'; rate = Math.max(0.8, Math.min(1.25, f / (f < 60 ? 55 : 66))); } }
  else if (k === 'slap') { name = style === 'tabla' ? 'dayan' : 'slap'; rate = style === 'tabla' ? 1 : Math.max(0.8, Math.min(1.3, f / 2400)); }
  else if (k === 'shake') { name = style === 'bells' ? 'sleigh' : 'shake'; g *= 0.8; }
  else if (k === 'wood') { name = f >= 1000 ? 'wood' : 'wood2'; rate = Math.max(0.8, Math.min(1.3, f / (f >= 1000 ? 1400 : 700))); }
  else if (k === 'clap' || k === 'crash') { name = k; }
  else return false;
  return Samples.sprite('drums', name, { out: musicBus, when: t, gain: g, rate });
}

/* ---------------- the music player ---------------- */
export const Music = {
  style: '', timer: 0, next: 0, step: 0, deg: 0, bar: 0, motif: null, droneAt: 0, wait: 0,
  start(style) {
    if (style === this.style && (this.timer || this.wait)) return;
    this.stop();
    if (!STYLES[style]) return;
    this.style = style; this.step = 0; this.bar = 0; this.deg = 0; this.next = 0; this.motif = null;
    curKit = KIT[style] || '';
    // wait (a moment at most) for the recorded instrument and drums, so the tune does not change voice half way
    const go = () => { if (this.style !== style || this.timer) return; clearTimeout(this.wait); this.wait = 0; this.timer = setInterval(() => this.tick(), 90); this.tick(); };
    if (curKit && Sound.on && !(Samples.isReady('kit', curKit) && Samples.isReady('kit', 'drums'))) {
      this.wait = setTimeout(go, 1600);
      Promise.all([Samples.load('kit', curKit), Samples.load('kit', 'drums')]).then(go);
    } else go();
  },
  stop() { clearInterval(this.timer); clearTimeout(this.wait); this.timer = 0; this.wait = 0; this.style = ''; },
  tick() {
    const c = live(), S = STYLES[this.style];
    if (!c || !S || !Sound.on) return;
    buses(c);
    const sec = 60 / S.bpm / 4;                          // one 16th note
    if (!this.next || this.next < c.currentTime) this.next = c.currentTime + 0.06;
    while (this.next < c.currentTime + 0.3) { this.play(c, S, this.next); this.next += sec; this.step = (this.step + 1) % S.steps; if (!this.step) this.bar += 1; }
  },
  play(c, S, t) {
    const i = this.step, out = musicBus, st = this.style;
    S.drums.forEach(([k, f, v, pat]) => { if (pat[i]) { const vv = v * pat[i] * (0.85 + Math.random() * 0.3); if (!drumOn(c, t, k, f, vv, st)) INST[k](c, t, f, vv, out); } });
    if (S.gong && (this.bar * S.steps + i) % S.gong === 0 && !Samples.sprite('drums', 'gong', { out, when: t, gain: 0.2, rate: hz(S.root - 24) / 72, send: wetBus })) INST.gong(c, t, hz(S.root - 24), 0.09, out);
    if (S.drone && i === 0 && this.bar % 2 === 0) {
      if (!noteOn(c, t, S.root - 12, 0.05)) INST.pluck(c, t, hz(S.root - 12), 0.05, out);
      if (!noteOn(c, t + 0.01, S.root - 5, 0.035)) INST.pluck(c, t + 0.01, hz(S.root - 5), 0.035, out);
    }
    if (S.whistle && i === 0 && this.bar % 4 === 3 && !Samples.sprite('drums', 'whistle', { out, when: t, gain: 0.18 })) [0, 2, 4].forEach((k) => INST.whistle(c, t + k * 60 / S.bpm / 4, 2200, 0.03, out));
    if (!S.mel[i]) return;
    // the melody: an ostinato repeats a short figure with small changes; otherwise a gentle random walk
    let deg;
    if (S.ostinato) {
      if (!this.motif || (i === 0 && this.bar % 4 === 0)) this.motif = Array.from({ length: 4 }, () => Math.floor(Math.random() * S.scale.length));
      deg = this.motif[(i / 2 | 0) % 4] + (this.bar % 4 === 3 && i > 8 ? 1 : 0);
    } else {
      const r = Math.random();
      this.deg += r < 0.4 ? 1 : r < 0.8 ? -1 : r < 0.92 ? 2 : -2;
      if (this.deg < 0) this.deg = 1; if (this.deg > S.scale.length * 2 - 1) this.deg = S.scale.length * 2 - 2;
      deg = this.deg;
      if (i === 0 && Math.random() < 0.5) deg = 0;      // come home at the start of a bar now and then
    }
    const n = S.scale.length, base = S.oct[this.bar % S.oct.length] || 0;
    const noteOf = (d) => S.root + base + 12 * Math.floor(d / n) + S.scale[((d % n) + n) % n];
    const note = noteOf(deg), v = S.vol * S.mel[i] * (0.8 + Math.random() * 0.4);
    const play = (tt, m, vv) => { if (!noteOn(c, tt, m, vv)) INST[S.inst](c, tt, hz(m), vv, out); };
    play(t, note, v);
    if (S.gliss && Math.random() < 0.18) [1, 2, 3].forEach((k) => play(t + k * 0.045, noteOf(deg + k), v * 0.5));     // a little run up the strings
    if (S.chord && i % 8 === 0) { play(t, note - 8, v * 0.5); play(t, note - 5, v * 0.4); }
  }
};

/* ---------------- one-off sound effects ---------------- */
/* What each effect feels like on a phone (only when it follows a touch). */
const FEEL = { firework: 'boom', burst: 'boom', crackle: 'buzz', splash: 'splash', lantern: 'whoosh', poof: 'pop', sparkle: 'tick', petals: 'tick', bell: 'tap', gong: 'thud',
  candle: 'tap', plane: 'whoosh', land: 'success', hooves: 'gallop', cheer: 'success', swell: 'whoosh', pop: 'pop', tick: 'tick', thunder: 'rumble', drum: 'steps',
  gust: 'whoosh', chime: 'tick', rattle: 'buzz', flare: 'boom', hornbill: 'pop', roar: 'roar', bats: 'buzz', glow: 'tick', monkeys: 'pop', orangutan: 'heartbeat',
  rustle: 'buzz', frogs: 'pop', hatch: 'buzz', trumpet: 'roar', wings: 'whoosh', waves: 'splash' };
const TUNED = new Set(['chime', 'sparkle', 'land', 'glow', 'petals', 'lantern', 'candle', 'bell', 'gong']);
/* the recorded or designed version; false if it is not ready yet */
function recorded(c, name, a) {
  const o = { out: fxBus, rate: TUNED.has(name) ? 1 : 0.97 + Math.random() * 0.06 };
  if (name === 'bell') return Samples.note('i-tubular', a || 84, { out: fxBus, gain: 0.8 });
  if (name === 'firework') return Samples.fx(a ? 'fireworkbig' : 'firework', o);
  if (name === 'thunder') return Samples.fx(Math.random() < 0.5 ? 'thunder' : 'thunder2', o);
  if (name === 'plane' && a) return Samples.fx('plane', Object.assign(o, { rate: Math.max(0.7, Math.min(1.3, 2.8 / a)) }));
  if (name === 'hooves' && a > 10) {                                   // a long gallop: the recording again, a stride later
    let ok = false; const n = Math.ceil(a * 0.18 / 2.0);
    for (let k = 0; k < n; k++) ok = Samples.fx('hooves', Object.assign({}, o, { when: c.currentTime + k * 1.92, fade: k === n - 1 ? 0.4 : 0 })) || ok;
    return ok;
  }
  return Samples.fx(name, o);
}
export const Fx = {
  on: true,
  play(name, a) {
    if (FEEL[name]) haptic(FEEL[name]);
    if (!this.on || !Sound.on) return;
    const c = live();
    if (!c) return;
    buses(c);
    try { if (recorded(c, name, a)) return; } catch (e) { /* the live-made one below */ }
    if (!FXS[name]) return;
    try { FXS[name](c, c.currentTime + 0.01, fxBus, a); } catch (e) { /* ignore */ }
  }
};
/* The Wonder Window is open: fetch every effect's file quietly in the background (small; they decode on first use). */
let fetched = false;
function prefetchFx() { if (fetched || !Sound.on) return; fetched = true; Samples.prefetch(Object.keys(BANK).map((n) => 'fx:' + n).concat(['i-tubular'])); }
['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, () => setTimeout(prefetchFx, 1500), { once: true, capture: true, passive: true }));
Sound.onChange((on) => { if (on) setTimeout(prefetchFx, 800); });
if (Sound.running) setTimeout(prefetchFx, 2000);
const FXS = {
  firework(c, t, out, big) {
    hiss(c, t, 0.7, 'bandpass', 900, 3, 0.03, out, 0.3, 3800);                                     // the rocket's whistle up
    const b = t + 0.75;
    osc(c, 'sine', 90, b, 0.6, 38).connect(env(c, b, big ? 0.32 : 0.22, 0.003, 0.55, out));          // the bang
    hiss(c, b, 0.5, 'lowpass', 1400, 0.6, 0.12, out, 0.002, 200);
    for (let k = 0; k < 14; k++) hiss(c, b + 0.25 + Math.random() * 0.9, 0.02, 'highpass', 4000, 0.6, 0.03, out);   // sparkles crackling
  },
  burst(c, t, out) {                                                                                  // a firework bursting (no rocket)
    osc(c, 'sine', 80, t, 0.5, 36).connect(env(c, t, 0.2, 0.003, 0.45, out));
    hiss(c, t, 0.4, 'lowpass', 1200, 0.6, 0.1, out, 0.002, 200);
    for (let k = 0; k < 10; k++) hiss(c, t + 0.2 + Math.random() * 0.8, 0.02, 'highpass', 4500, 0.6, 0.025, out);
  },
  crackle(c, t, out) { for (let k = 0; k < 18; k++) { const s = t + k * 0.05 + Math.random() * 0.04; hiss(c, s, 0.025, 'bandpass', 1800 + Math.random() * 2000, 1.5, 0.07, out); } },
  splash(c, t, out) {
    hiss(c, t, 0.5, 'bandpass', 2400, 0.8, 0.12, out, 0.01, 700);
    for (let k = 0; k < 8; k++) { const s = t + 0.15 + Math.random() * 0.5; osc(c, 'sine', 900 + Math.random() * 1400, s, 0.08, 2600).connect(env(c, s, 0.02, 0.002, 0.06, out)); }
  },
  lantern(c, t, out) { hiss(c, t, 1.4, 'bandpass', 500, 1, 0.03, out, 0.4, 1300); INST.bell(c, t + 0.3, hz(84), 0.03, out); INST.bell(c, t + 0.5, hz(88), 0.025, out); },
  poof(c, t, out) { hiss(c, t, 0.6, 'lowpass', 900, 0.5, 0.16, out, 0.01, 260); },
  sparkle(c, t, out) { [96, 100, 103, 108].forEach((m, k) => INST.bell(c, t + k * 0.05, hz(m), 0.02, out)); },
  petals(c, t, out) { hiss(c, t, 0.8, 'highpass', 5000, 0.4, 0.02, out, 0.2); [84, 91].forEach((m, k) => INST.bell(c, t + k * 0.12, hz(m), 0.018, out)); },
  bell(c, t, out, m) { INST.bell(c, t, hz(m || 84), 0.06, out); },
  gong(c, t, out) { INST.gong(c, t, hz(41), 0.16, out); },
  candle(c, t, out) { hiss(c, t, 0.25, 'bandpass', 700, 1, 0.04, out, 0.02); INST.bell(c, t + 0.05, hz(88), 0.03, out); },
  plane(c, t, out, secs) {                                                                           // a jet passing over
    const d = secs || 2.4;
    hiss(c, t, d, 'bandpass', 380, 0.7, 0.08, out, d * 0.4, 1600);
    osc(c, 'sawtooth', 160, t, d, 120).connect(env(c, t, 0.012, d * 0.4, d * 0.6, out));
  },
  land(c, t, out) { INST.bell(c, t, hz(79), 0.05, out); INST.bell(c, t + 0.12, hz(86), 0.045, out); INST.bell(c, t + 0.24, hz(91), 0.04, out); },
  hooves(c, t, out, n) { for (let k = 0; k < (n || 8); k++) { const s = t + k * 0.18; INST.kick(c, s, 90, 0.07, out); INST.kick(c, s + 0.07, 110, 0.05, out); } },
  cheer(c, t, out) {
    hiss(c, t, 2.2, 'bandpass', 1100, 0.6, 0.09, out, 0.4);
    for (let k = 0; k < 6; k++) { const s = t + 0.2 + Math.random() * 1.2; osc(c, 'sawtooth', 300 + Math.random() * 200, s, 0.5, 600 + Math.random() * 300).connect(env(c, s, 0.008, 0.08, 0.4, out)); }
  },
  swell(c, t, out) {                                                                                 // the camera pulling back
    hiss(c, t, 2.6, 'bandpass', 200, 0.7, 0.06, out, 1.2, 2000);
    osc(c, 'sine', 55, t, 3, 82).connect(env(c, t, 0.08, 1.2, 1.8, out));
  },
  pop(c, t, out) { osc(c, 'sine', 420, t, 0.12, 1100).connect(env(c, t, 0.08, 0.003, 0.1, out)); },
  tick(c, t, out) { INST.wood(c, t, 1600, 0.04, out); },
  // the Seven Wonders
  thunder(c, t, out) {                                                                              // Zeus
    osc(c, 'sine', 70, t + 0.04, 1.8, 30).connect(env(c, t + 0.04, 0.28, 0.02, 1.6, out));
    hiss(c, t, 2.4, 'lowpass', 600, 0.5, 0.22, out, 0.03, 80);
    for (let k = 0; k < 3; k++) hiss(c, t + 0.5 + k * 0.55, 0.6, 'lowpass', 360, 0.6, 0.09, out, 0.06, 110);
  },
  drum(c, t, out) { for (let k = 0; k < 3; k++) INST.kick(c, t + k * 0.3, 52, 0.2, out); INST.gong(c, t + 1.0, hz(43), 0.12, out); },     // the beacon on the Great Wall
  gust(c, t, out) { hiss(c, t, 2.2, 'bandpass', 480, 0.8, 0.07, out, 0.7, 1500); },                                                    // a gust of mountain wind
  chime(c, t, out) { [79, 84, 88, 91].forEach((m, k) => INST.bell(c, t + k * 0.09, hz(m), 0.03, out)); },                                // the light changes
  rattle(c, t, out) { for (let k = 0; k < 12; k++) INST.shake(c, t + k * 0.06, 5000 + Math.random() * 1500, 0.03, out); INST.kick(c, t + 0.8, 60, 0.12, out); },   // the serpent's shadow
  flare(c, t, out) { hiss(c, t, 1.2, 'lowpass', 1200, 0.6, 0.12, out, 0.05, 300); for (let k = 0; k < 8; k++) hiss(c, t + 0.1 + Math.random() * 0.6, 0.03, 'highpass', 3500, 0.6, 0.03, out); },   // a fire roaring up
  // Malaysia's wonders and the record breakers (stand-ins for the recorded or designed versions)
  hornbill(c, t, out) { for (let k = 0; k < 4; k++) { const s = t + k * 0.38; osc(c, 'sawtooth', 330, s, 0.19, 280).connect(bandOut(c, s, 0.19, 700, 0.07, out)); } },
  roar(c, t, out) { osc(c, 'sawtooth', 150, t, 2, 95).connect(bandOut(c, t, 2, 600, 0.12, out, 0.3)); hiss(c, t, 1.8, 'lowpass', 500, 0.6, 0.08, out, 0.3, 200); },
  bats(c, t, out) { for (let k = 0; k < 30; k++) hiss(c, t + Math.random() * 2, 0.03, 'bandpass', 1500 + Math.random() * 1500, 1.5, 0.03, out); for (let k = 0; k < 10; k++) { const s = t + Math.random() * 2; osc(c, 'sine', 8000, s, 0.03, 6000).connect(env(c, s, 0.01, 0.002, 0.025, out)); } },
  glow(c, t, out) { [96, 100, 103, 108, 103, 100].forEach((m, k) => INST.bell(c, t + k * 0.18 + Math.random() * 0.1, hz(m), 0.018, out)); },
  monkeys(c, t, out) { for (let k = 0; k < 3; k++) { const s = t + k * 0.5; osc(c, 'sawtooth', 200, s, 0.26, 160).connect(bandOut(c, s, 0.26, 520, 0.08, out)); } },
  orangutan(c, t, out) { for (let k = 0; k < 3; k++) { const s = t + 0.8 + k * 0.85; osc(c, 'sawtooth', 220, s, 0.7, 160).connect(bandOut(c, s, 0.7, 450, 0.09, out, 0.12)); } },
  rustle(c, t, out) { for (let k = 0; k < 40; k++) hiss(c, t + Math.random() * 0.9, 0.012, 'bandpass', 2000 + Math.random() * 4000, 1.2, 0.03, out); },
  frogs(c, t, out) { for (let k = 0; k < 6; k++) { const s = t + k * 0.42; osc(c, 'sawtooth', 280, s, 0.12, 230).connect(bandOut(c, s, 0.12, 900, 0.06, out)); } },
  hatch(c, t, out) { for (let k = 0; k < 30; k++) hiss(c, t + Math.random() * 2.5, 0.05, 'bandpass', 800 + Math.random() * 1500, 1, 0.025, out); },
  trumpet(c, t, out) { osc(c, 'sawtooth', 420, t, 1.4, 640).connect(bandOut(c, t, 1.4, 1200, 0.06, out, 0.1)); },
  wings(c, t, out) { for (let k = 0; k < 5; k++) hiss(c, t + k * 0.4, 0.3, 'bandpass', 400, 0.9, 0.06, out, 0.06, 1200); },
  waves(c, t, out) { hiss(c, t, 4, 'lowpass', 900, 0.6, 0.12, out, 1.2, 300); }
};
/* a harsh source through one formant, with an envelope: the stand-in animal calls */
function bandOut(c, t, d, f, peak, out, a) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 2; bp.connect(env(c, t, peak, a || 0.02, d, out)); return bp; }
export const STYLE_NAMES = Object.keys(STYLES);
