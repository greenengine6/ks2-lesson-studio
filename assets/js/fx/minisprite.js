/* The site's interface sounds (assets/sounds/ui.mp3: celesta, marimba, vibraphone, woodblock, a bubble pop…) for
   pages that keep their own AudioContext: the pupils' page and the games. Imports only the sound bank (data), so
   those pages stay small. Fetched once after the first sound; until it has arrived (or offline), play() returns
   false and the page plays its own live-made sound instead. */
import { KITS } from './soundbank.js?v=af1c9ebd';

const K = KITS.ui;
const URL_UI = new URL('../../sounds/' + K.f + (K.h ? '?h=' + K.h : ''), import.meta.url).href;
const held = new WeakMap();                                   // AudioContext → { buf, p, fail }
function load(ctx) {
  let e = held.get(ctx);
  if (!e) { e = {}; held.set(ctx, e); }
  if (e.buf || e.p || (e.fail && Date.now() - e.fail < 60000)) return e;
  e.p = fetch(URL_UI, { credentials: 'same-origin' }).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
    .then((b) => new Promise((ok, no) => { const p = ctx.decodeAudioData(b, ok, no); if (p && p.then) p.then(ok, no); }))
    .then((buf) => { e.buf = buf; e.shift = shift(buf); }).catch(() => { e.fail = Date.now(); }).finally(() => { e.p = null; });
  return e;
}
/* a decoder that keeps the encoder's start-up silence shifts every sound a little: measure it on the first one */
function shift(buf) {
  const first = Math.min(...Object.values(K.s).map((v) => v[0])), d = buf.getChannelData(0), sr = buf.sampleRate;
  for (let i = Math.round(Math.max(0, first - 0.05) * sr), lim = Math.min(d.length, Math.round((first + 0.08) * sr)); i < lim; i++) if (Math.abs(d[i]) > 0.002) { const sh = i / sr - first; return sh > 0.004 && sh < 0.06 ? sh : 0; }
  return 0;
}
/* Start fetching now (call after a tap, when sound is wanted). */
export function warmUI(ctx) { if (ctx) load(ctx); }
/* Play one interface sound by name into `out` (default: the speakers). o = { gain, rate, when } */
export function playUI(ctx, name, out, o) {
  if (!ctx || !K.s[name]) return false;
  const e = load(ctx);
  if (!e.buf) return false;
  o = o || {};
  try {
    const s = ctx.createBufferSource(), g = ctx.createGain(), [off, dur] = K.s[name];
    s.buffer = e.buf; if (o.rate) s.playbackRate.value = o.rate;
    g.gain.value = o.gain == null ? 1 : o.gain;
    s.connect(g); g.connect(out || ctx.destination);
    s.start(Math.max(ctx.currentTime, o.when || 0), off + (e.shift || 0), dur);
    return true;
  } catch (err) { return false; }
}
