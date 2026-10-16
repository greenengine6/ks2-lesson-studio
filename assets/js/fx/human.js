/* Symphony's human voice: natural, expressive speech from a voice service (OpenAI's gpt-4o-mini-tts), used when this
   device has the school's voice key. The key is added once in Connect and travels in personal links, like the engine
   key. Every sentence is described to the voice service the same way (a warm, bright young woman who helps in a
   primary school, with a soft British accent, or natural Malaysian Malay), with a calmer pace for Brain Break and a
   storyteller's pace for journeys and Wonder Window.

   Each sentence is made once: it is kept in memory and in the browser's cache, so "Say again", Wonder Window facts
   and Brain Break scripts never cost twice. If the service cannot answer (no internet, a bad key, a busy moment),
   voice.js speaks with the device's own voice instead, so she is never silent. Pupils' names never go to the
   service (voice.js keeps those on the device voice).

   This file must not import core.js (core.js loads the sound files that load voice.js). */

const KEY = 'ks2-engine.voicekey.v1', CHOICE = 'ks2-engine.symvoice.v1', SPEED = 'ks2-engine.symspeed.v1', INDEX = 'ks2-engine.voicecache.v1';
const API = 'https://api.openai.com/v1/audio/speech', MODEL = 'gpt-4o-mini-tts';
const get = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const set = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* private mode */ } };

/* The voices she can have. Marin is OpenAI's most natural voice; the others give teachers a choice. */
export const VOICES = [
  { id: 'marin', name: 'Marin', en: 'Warm and natural', ms: 'Mesra dan semula jadi' },
  { id: 'coral', name: 'Coral', en: 'Bright and friendly', ms: 'Ceria dan peramah' },
  { id: 'nova', name: 'Nova', en: 'Young and lively', ms: 'Muda dan bertenaga' },
  { id: 'shimmer', name: 'Shimmer', en: 'Soft and gentle', ms: 'Lembut dan tenang' },
  { id: 'sage', name: 'Sage', en: 'Calm and clear', ms: 'Tenang dan jelas' }
];
const VOICE_IDS = VOICES.map((v) => v.id);
export const SPEEDS = { calm: 0.94, normal: 1, lively: 1.06 };

export const KEY_RX = /^sk-[A-Za-z0-9_-]{20,}$/;
export const voiceKey = () => { const k = get(KEY); return KEY_RX.test(k) ? k : ''; };
let broken = '';                                   // the key the service turned down, until a new one is saved
export function setVoiceKey(k) { k = String(k || '').trim(); if (k && !KEY_RX.test(k)) return false; set(KEY, k); broken = ''; downUntil = 0; notify(); return true; }

/* Her voice choice for each language: 'h:marin' (a human voice) or 'd:<device voice>' (this device's own). */
function choices() { try { return JSON.parse(get(CHOICE) || '{}') || {}; } catch (e) { return {}; } }
const base = (lang) => { const b = String(lang || 'en').toLowerCase().split(/[-_]/)[0]; return b === 'ms' || b === 'zsm' || b === 'may' ? 'ms' : b === 'en' || !b ? 'en' : b; };
export function choice(lang) { const c = choices()[base(lang) === 'ms' ? 'ms' : 'en'] || ''; return c; }
export function choose(lang, v) { const c = choices(); c[base(lang) === 'ms' ? 'ms' : 'en'] = v || ''; set(CHOICE, JSON.stringify(c)); notify(); }
export const speed = () => SPEEDS[get(SPEED)] || 1;
export const speedName = () => (SPEEDS[get(SPEED)] ? get(SPEED) : 'normal');
export function setSpeed(n) { set(SPEED, SPEEDS[n] && n !== 'normal' ? n : ''); notify(); }

/* Which human voice to use for this language, or '' for the device's own voice. */
let downUntil = 0;
export function humanFor(lang) {
  const k = voiceKey();
  if (!k || k === broken || Date.now() < downUntil) return '';
  const c = choice(lang) || choice('en');
  if (c.startsWith('d:')) return '';
  const id = c.startsWith('h:') ? c.slice(2) : '';
  return VOICE_IDS.includes(id) ? id : 'marin';
}
export const ready = () => !!voiceKey() && voiceKey() !== broken;

const fns = [];
export function onChange(fn) { fns.push(fn); }
function notify() { fns.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } }); }

/* How she should sound. */
const LANGS = { en: 'English', ms: 'Malay', zh: 'Mandarin Chinese', ja: 'Japanese', ko: 'Korean', fr: 'French', es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi',
  ta: 'Tamil', th: 'Thai', id: 'Indonesian', vi: 'Vietnamese', tr: 'Turkish', ru: 'Russian', nl: 'Dutch', sv: 'Swedish', pl: 'Polish', el: 'Greek', he: 'Hebrew', sw: 'Swahili', yo: 'Yoruba' };
const WHO = 'You are Symphony, a warm, bright, friendly young woman in her twenties who helps teachers and children aged 7 to 11 in a primary school. ' +
  'Sound like a real person talking, never like a machine: relaxed and smiling, with natural rises and falls, little pauses at commas and full stops, and gentle enthusiasm. Not flat, not over the top, never robotic.';
const PACE = {
  chat: 'Pace: natural and conversational, like chatting with a colleague in the classroom.',
  story: 'Pace: an unhurried storyteller, full of wonder, clear enough for children to follow.',
  calm: 'Pace: slow, soft and soothing, with long gentle pauses, like leading a calm breathing exercise.'
};
export function instructions(lang, style) {
  const b = base(lang);
  const accent = b === 'en' ? 'Accent: soft, clear British English.' : b === 'ms' ? 'Speak natural Malaysian Malay (Bahasa Melayu) with a Malaysian accent.' : 'Speak natural ' + (LANGS[b] || 'native') + ' with a native accent, slowly enough for children to copy.';
  return WHO + ' ' + accent + ' ' + (PACE[style] || PACE.chat);
}

/* ---------------- making the audio, once per sentence ---------------- */
const mem = new Map();                              // key -> Promise<Blob>, the most recent 80
const STORE = 'ks2-symphony-voice-v1';
async function hash(s) {
  try { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d)).slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16) + '-' + s.length; }
}
const cacheURL = (h) => 'https://symphony-voice.invalid/v1/' + h + '.mp3';
async function fromCache(h) {
  try { if (!('caches' in window)) return null; const c = await caches.open(STORE); const r = await c.match(cacheURL(h)); return r ? await r.blob() : null; } catch (e) { return null; }
}
async function toCache(h, blob) {
  try {
    if (!('caches' in window)) return;
    const c = await caches.open(STORE);
    await c.put(cacheURL(h), new Response(blob, { headers: { 'content-type': 'audio/mpeg' } }));
    let list = []; try { list = JSON.parse(get(INDEX) || '[]'); } catch (e) { list = []; }
    list = list.filter((x) => x !== h); list.push(h);
    while (list.length > 400) { const old = list.shift(); try { await c.delete(cacheURL(old)); } catch (e) { /* ignore */ } }
    set(INDEX, JSON.stringify(list));
  } catch (e) { /* storage full or blocked: fine, it is only a saving */ }
}
export const stats = { made: 0, cached: 0, failed: 0 };
/* The audio for one sentence, as an mp3 Blob. Rejects with { code } if the service cannot make it. */
export function prepare(text, lang, style) {
  const voice = humanFor(lang);
  if (!voice) return Promise.reject(Object.assign(new Error('off'), { code: 'off' }));
  const instr = instructions(lang, style);
  const id = MODEL + '|' + voice + '|' + instr + '|' + text;
  if (mem.has(id)) { const p = mem.get(id); mem.delete(id); mem.set(id, p); return p; }
  const p = (async () => {
    const h = await hash(id);
    const hit = await fromCache(h);
    if (hit && hit.size > 200) { stats.cached++; return hit; }
    const key = voiceKey();
    let res;
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
    try {
      res = await fetch(API, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({ model: MODEL, voice, input: text, instructions: instr, response_format: 'mp3' }) });
    } catch (e) { throw Object.assign(new Error('network'), { code: 'network' }); }
    finally { clearTimeout(t); }
    if (!res.ok) {
      const code = res.status === 401 || res.status === 403 ? 'bad_key' : res.status === 429 ? 'busy' : 'upstream';
      throw Object.assign(new Error(code), { code, status: res.status });
    }
    const blob = await res.blob();
    if (!blob || blob.size < 200) throw Object.assign(new Error('empty'), { code: 'empty' });
    stats.made++;
    toCache(h, blob);
    return blob;
  })();
  const key0 = voiceKey();
  p.catch((e) => { mem.delete(id); trouble(e && e.code, key0); });
  mem.set(id, p);
  while (mem.size > 80) mem.delete(mem.keys().next().value);
  return p;
}
/* After a failure: a bad key is not tried again until a new one is saved; anything else waits a minute. */
let warnFn = null;
export function onWarn(fn) { warnFn = fn; }
function trouble(code, key) {
  stats.failed++;
  if (code === 'off') return;
  if (code === 'bad_key') { broken = key; if (warnFn) warnFn('bad_key'); return; }
  downUntil = Date.now() + (code === 'busy' ? 30000 : 60000);
}

/* Check a key before saving it: make one short word. */
export async function testKey(k) {
  let res;
  try {
    res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + k },
      body: JSON.stringify({ model: MODEL, voice: 'marin', input: 'Hi!', instructions: instructions('en', 'chat'), response_format: 'mp3' }) });
  } catch (e) { return 'network'; }
  if (res.status === 401 || res.status === 403) return 'bad_key';
  if (res.status === 429) { let m = ''; try { m = (await res.json()).error.message || ''; } catch (e) { /* ignore */ } return /quota|billing|credit/i.test(m) ? 'no_credit' : 'busy'; }
  if (!res.ok) return 'upstream';
  return '';
}
