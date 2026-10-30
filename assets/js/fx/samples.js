/* Recorded and designed sounds from assets/sounds/ (see soundbank.js and assets/sounds/CREDITS.md), played through
   the site's one sound engine (audio.js): the same switch, the same "quiet while Symphony speaks".
   - Ambient beds: real field recordings (rain, waves, wind, a stream, birds, crickets…) cut into seamless loops,
     layered into each place's sound (a rainforest is birds, cicadas and a far-off stream). A mono loop is played
     twice, half a loop apart, one to each side, so it sounds wide.
   - One-shot effects (thunder, a tiger's roar, a splash…) and sprites (the site's interface sounds, a drum kit,
     recorded instruments for the Wonder Window's music, the calm pad).
   Nothing is fetched while sound is off. A file is fetched once, decoded when it is first needed and dropped
   again when many others have been used since. Until a file is ready, callers play their old live-made sound,
   so nothing ever waits and nothing breaks offline. */
import { Sound } from './audio.js?v=af1c9ebd';
import { BEDS, FX, KITS } from './soundbank.js?v=af1c9ebd';

const BASE = new URL('../../sounds/', import.meta.url).href;
const BUDGET = 56e6;                                      // bytes of decoded audio kept at once (about 5 minutes of mono)
const files = new Map();                                  // url → { bytes, buf, p, fail, used, size, keep }
const live = () => { const c = Sound.ctx(); return c && c.state === 'running' ? c : null; };
const urlOf = (e) => BASE + e.f + (e.h ? '?h=' + e.h : '');
const entryOf = (kind, name) => (kind === 'bed' ? BEDS[name] : kind === 'fx' ? FX[name] : KITS[name]);

function slot(url) { let s = files.get(url); if (!s) { s = { used: 0 }; files.set(url, s); } return s; }
/* Fetch the bytes only (cheap to keep); decoding waits until the sound is needed. */
function fetchBytes(url) {
  const s = slot(url);
  if (s.bytes || s.buf || s.fail || s.fp) return s.fp || Promise.resolve(s);
  if (!Sound.on) return Promise.resolve(s);
  s.fp = fetch(url, { credentials: 'same-origin' }).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
    .then((b) => { s.bytes = b; return s; }).catch(() => { s.fail = Date.now(); return s; }).finally(() => { s.fp = null; });
  return s.fp;
}
function decode(c, bytes) {
  return new Promise((ok, no) => {
    try { const p = c.decodeAudioData(bytes.slice(0), ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); }
  });
}
/* Fetch and decode one file; resolves with the AudioBuffer or null. */
function load(url, prep) {
  const s = slot(url);
  s.used = performance.now();
  if (s.buf) return Promise.resolve(s.buf);
  if (s.fail && Date.now() - s.fail < 60000) return Promise.resolve(null);
  if (s.p) return s.p;
  const c = Sound.ctx();
  if (!c || !Sound.on) return Promise.resolve(null);
  s.p = fetchBytes(url).then((x) => (x.bytes ? decode(c, x.bytes) : null)).then((buf) => {
    if (!buf) return null;
    if (prep) prep(buf);
    s.shift = onsetShift(buf, url);
    s.buf = buf; s.size = buf.length * buf.numberOfChannels * 4; s.used = performance.now();
    trimCache();
    return buf;
  }).catch(() => { s.fail = Date.now(); return null; }).finally(() => { s.p = null; });
  return s.p;
}
function trimCache() {
  let total = 0; const list = [];
  files.forEach((s, u) => { if (s.buf) { total += s.size; if (!s.keep) list.push([s.used, u, s]); } });
  list.sort((a, b) => a[0] - b[0]);
  while (total > BUDGET && list.length) { const [, , s] = list.shift(); total -= s.size; s.buf = null; }
}
/* A loop that was cut and re-encoded jumps at its loop point unless the last moments blend into what comes just
   before the loop start (the file holds that, for exactly this). */
function prepLoop(pre, L) {
  return (buf) => {
    const sr = buf.sampleRate, s0 = Math.round(pre * sr), n1 = Math.round(L * sr), X = Math.min(s0 - 1, Math.round(0.05 * sr));
    if (s0 + n1 > buf.length || X < 8) return;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < X; i++) {
        const w = Math.sin((i + 1) / X * Math.PI / 2) ** 2, a = s0 + n1 - X + i, b = s0 - X + i;
        d[a] = d[a] * (1 - w) + d[b] * w;
      }
    }
  };
}
/* Some decoders keep the encoder's few milliseconds of start-up silence: find where a sprite's first sound really
   starts, so every offset can be moved by the same amount (never more than 60 ms). */
const FIRST = new Map(Object.values(KITS).map((k) => [k.f, Math.min(...Object.values(k.s).map((v) => v[0]))]));
function onsetShift(buf, url) {
  const f = url.slice(BASE.length).split('?')[0], first = FIRST.get(f);
  if (first == null) return 0;
  const d = buf.getChannelData(0), sr = buf.sampleRate, lim = Math.min(d.length, Math.round((first + 0.08) * sr));
  for (let i = Math.round(Math.max(0, first - 0.05) * sr); i < lim; i++) if (Math.abs(d[i]) > 0.002) { const sh = i / sr - first; return sh > 0.004 && sh < 0.06 ? sh : 0; }
  return 0;
}
const shiftOf = (url) => { const s = files.get(url); return (s && s.shift) || 0; };
const ready = (url) => { const s = files.get(url); if (s && s.buf) { s.used = performance.now(); return s.buf; } return null; };

/* ---------------- a shared reverb for the music ---------------- */
let verb = null;
function reverbInto(c, out) {
  if (verb && verb.c === c) return verb.in;
  const conv = c.createConvolver(), sr = c.sampleRate, len = Math.round(sr * 2.4), ir = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) { const t = i / sr; lp += (Math.random() * 2 - 1 - lp) * (0.55 - 0.4 * Math.min(1, t / 2)); d[i] = lp * Math.exp(-3.2 * t) * (t < 0.012 ? t / 0.012 : 1); }
  }
  conv.buffer = ir;
  const send = c.createGain(); send.gain.value = 0.5; send.connect(conv); conv.connect(out);
  verb = { c, in: send };
  return send;
}

/* ---------------- playing ---------------- */
function voice(c, buf, o) {
  const src = c.createBufferSource(); src.buffer = buf;
  if (o.rate && o.rate !== 1) src.playbackRate.value = o.rate;
  let node = src;
  if (o.lp || o.hp) {
    const f = c.createBiquadFilter(); f.type = o.lp ? 'lowpass' : 'highpass'; f.frequency.value = o.lp || o.hp; f.Q.value = 0.6;
    node.connect(f); node = f;
  }
  const g = c.createGain(); g.gain.value = o.gain == null ? 1 : o.gain; node.connect(g); node = g;
  if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); node.connect(p); node = p; }
  node.connect(o.out);
  if (o.send) g.connect(o.send);
  return { src, g };
}
/* Play part of a buffer once: o = { out, when, gain, rate, pan, offset, dur, fade, send } */
function once(c, buf, o) {
  const v = voice(c, buf, o), t = Math.max(c.currentTime, o.when || 0), off = o.offset || 0;
  const dur = Math.min(o.dur || buf.duration, buf.duration - off);
  if (o.fade && o.fade < dur) {
    const end = t + dur / (o.rate || 1), g = v.g.gain, peak = g.value;
    g.setValueAtTime(peak, Math.max(t, end - o.fade)); g.linearRampToValueAtTime(0.0001, end);
  }
  try { v.src.start(t, off, dur); } catch (e) { return null; }
  return v;
}

/* Play now if the file is decoded. If its bytes are already here (fetched in the background), decode and play it
   in a moment, keeping any scheduled time; true either way. Otherwise start loading it and say false, so the caller
   plays its live-made sound this once. */
function soon(c, url, o, play) {
  const buf = ready(url);
  if (buf) return !!play(c, buf, o || {});
  const s = files.get(url), t0 = performance.now(), ahead = o && o.when ? Math.max(0, o.when - c.currentTime) : 0;
  if (s && s.bytes) {
    load(url).then((b) => {
      const c2 = live(), late = (performance.now() - t0) / 1000;
      if (b && c2 && late < 0.3 + ahead) play(c2, b, Object.assign({}, o, { when: c2.currentTime + Math.max(0, ahead - late) }));
    });
    return true;
  }
  load(url); return false;
}
export const Samples = {
  /* fetch files in the background so they are ready later; names: 'ui', 'drums', 'i-koto', 'fx:thunder', 'bed:rain' */
  prefetch(names) {
    if (!Sound.on) return;
    const list = (names || []).map((n) => { const [k, v] = n.includes(':') ? n.split(':') : ['kit', n]; return entryOf(k, v); }).filter(Boolean);
    let i = 0; const next = () => { if (i >= list.length || !Sound.on) return; fetchBytes(urlOf(list[i++])).then(next); };
    next(); next();
  },
  load(kind, name) { const e = entryOf(kind, name); return e ? load(urlOf(e), kind === 'bed' ? prepLoop(e.loop[0], e.loop[1]) : null) : Promise.resolve(null); },
  isReady(kind, name) { const e = entryOf(kind, name); return !!(e && ready(urlOf(e))); },
  /* a one-shot effect by name; false when it is not ready yet (it starts loading: play the old sound this time).
     If the file is already downloaded it is decoded and played in a moment (decoding a short file takes a few ms). */
  fx(name, o) {
    const e = FX[name], c = live(); if (!e || !c) return false;
    return soon(c, urlOf(e), o, (c2, buf, oo) => once(c2, buf, oo));
  },
  /* one sound from a sprite: kit 'ui' / 'drums' / 'pad' and its name */
  sprite(kit, name, o) {
    const k = KITS[kit], c = live(); if (!k || !k.s[name] || !c) return false;
    const url = urlOf(k), [off, dur] = k.s[name];
    return soon(c, url, o, (c2, buf, oo) => once(c2, buf, Object.assign({ offset: off + shiftOf(url), dur }, oo)));
  },
  /* a recorded instrument note: the nearest sample, re-pitched; o.dur cuts a held note with a short release */
  note(kit, midi, o) {
    const k = KITS[kit], c = live(); if (!k || !k.notes || !c) return false;
    const lo = k.notes[0], hi = k.notes[k.notes.length - 1];
    let m = midi; while (m < lo - 3) m += 12; while (m > hi + 3) m -= 12;
    const m0 = k.notes.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a));
    const url = urlOf(k), [off, len] = k.s[String(m0)], rate = Math.pow(2, (m - m0) / 12);
    const dur = Math.min(len, (o && o.dur ? o.dur * rate + 0.12 : len));
    return soon(c, url, o, (c2, buf, oo) => once(c2, buf, Object.assign({}, oo, { offset: off + shiftOf(url), dur, rate, fade: o && o.dur ? 0.12 : 0.05 })));
  },
  /* the shared music reverb, feeding `out` */
  reverb(out) { const c = live(); return c ? reverbInto(c, out) : null; },
  /* an ambient bed: a recipe of looped layers into `out`; null if its files are not all ready (they start loading) */
  bed(kind, out) {
    const r = MIX[kind], c = live(); if (!r || !c) return null;
    const bufs = r.map(([f]) => ready(urlOf(BEDS[f])));
    if (bufs.some((b) => !b)) { r.forEach(([f]) => this.load('bed', f)); return null; }
    const nodes = [];
    r.forEach(([f, db, o], i) => {
      o = o || {}; const e = BEDS[f], buf = bufs[i], [pre, L] = e.loop;
      files.get(urlOf(e)).keep = true;
      const level = Math.pow(10, ((-23 - (e.lufs || -23)) + db) / 20);
      const rates = Array.isArray(o.rate) ? o.rate : [o.rate || 1, o.rate || 1];
      const two = o.w === 2;
      (two ? [-0.65, 0.65] : [o.pan || 0]).forEach((p, j) => {
        const v = voice(c, buf, { out, gain: level * (two ? 0.72 : 1), rate: rates[j] || 1, pan: p, lp: o.lp, hp: o.hp });
        v.src.loop = true; v.src.loopStart = pre; v.src.loopEnd = pre + L;
        try { v.src.start(c.currentTime + 0.02, pre + (j ? L * 0.5 : Math.random() * L * 0.25)); } catch (e2) { /* ignore */ }
        nodes.push(v.src);
      });
    });
    return () => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* stopped */ } }); r.forEach(([f]) => { const s = files.get(urlOf(BEDS[f])); if (s) s.keep = false; }); };
  },
  /* load every loop a place needs; resolves true when all are ready */
  loadBed(kind) {
    const r = MIX[kind]; if (!r) return Promise.resolve(false);
    return Promise.all(r.map(([f]) => this.load('bed', f))).then((b) => b.every(Boolean));
  },
  kinds() { return Object.keys(MIX); },
  get stats() { let n = 0, bytes = 0; files.forEach((s) => { if (s.buf) { n++; bytes += s.size; } }); return { decoded: n, bytes, files: files.size }; }
};

/* Each place's sound: [loop, level in dB, { w: 2 for two wide voices, rate, lp, hp, pan }] */
const MIX = {
  rain: [['rain', 0, { w: 2 }]],
  ocean: [['waves', 0]],
  beach: [['waves', -1], ['wind', -13, { w: 2, lp: 1800 }]],
  wind: [['wind', -1, { w: 2, rate: [1, 0.93] }]],
  river: [['stream', -1, { w: 2 }], ['birds', -15]],
  forest: [['birds', 2], ['wind', -12, { w: 2, lp: 1500 }]],
  birds: [['birds', 0]],
  night: [['night', -2, { w: 2 }], ['frogs', -15]],
  city: [['city', 0]],
  market: [['cafe', -1], ['city', -9]],
  jungle: [['birds', -2], ['cicadas', -7, { w: 2 }], ['stream', -17, { w: 2 }]],
  mangrove: [['night', -6, { w: 2 }], ['lapping', -3], ['frogs', -8]],
  cave: [['drips', -5], ['wind', -15, { w: 2, lp: 420, rate: [0.7, 0.66] }], ['stream', -20, { lp: 900 }]],
  storm: [['storm', 0, { w: 2 }], ['rain', -7, { w: 2 }]],
  mountain: [['wind', 0, { w: 2, rate: [0.97, 0.9] }], ['birds', -17, { hp: 1500 }]],
  hurricane: [['wind', 1, { w: 2, rate: [0.82, 0.76], lp: 2600 }], ['rain', -3, { w: 2 }], ['storm', -9]],
  fire: [['fire', 0, { w: 2 }]]
};
