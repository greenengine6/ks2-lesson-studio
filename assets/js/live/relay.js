/* Live lessons: how the teacher's screen and pupils' devices talk to each other.

   Everything is locked before it leaves a device. The join link (the QR code) carries a random lesson id, a key for
   what the teacher sends to everyone, and the teacher's public key. Pupils lock what they send with that public key
   (ECDH P-256, HKDF-SHA-256, AES-256-GCM), so only the teacher's screen can open it: not the relay, and not other
   pupils. What the teacher sends (the current class moment) is locked with the lesson key (AES-128-GCM).

   Two relays carry the locked messages, and both only ever see scrambled text and random ids:
   - the public relay (ntfy.sh): works straight away, no set-up; it deletes messages after 12 hours;
   - the school relay: the site's own Google Apps Script (inbox/Code.gs) once it is switched on; it keeps
     messages in the script's short-term cache for 6 hours at most.
   This file has no other imports, so the pupils' page stays small and fast. */

const subtle = crypto.subtle;
const te = new TextEncoder(), td = new TextDecoder();
export const PUBLIC = 'https://ntfy.sh';
export const PART = 3400;                         // characters per relayed message (the public relay holds 4,096 bytes)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const utf8 = (s) => te.encode(String(s));

/* ---------------- bytes ---------------- */
export function b64u(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(s) {
  const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function rand(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
export const rid = (n) => b64u(rand(n));
export const ID = /^[A-Za-z0-9_-]+$/;

/* ---------------- squeezing long messages (a mini whiteboard) ---------------- */
const canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function pump(stream, data) {
  const w = stream.writable.getWriter(); w.write(data); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/* ---------------- locking ---------------- */
async function lock(key, obj) {
  const plain = utf8(JSON.stringify(obj));
  let body = plain, z = '0';
  if (canZip && plain.length > 700) { try { body = await pump(new CompressionStream('deflate-raw'), plain); z = '1'; } catch (e) { body = plain; z = '0'; } }
  const iv = rand(12);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, body));
  return z + '.' + b64u(iv) + '.' + b64u(ct);
}
async function unlock(key, z, iv, ct) {
  let body = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv) }, key, unb64u(ct)));
  if (z === '1') body = await pump(new DecompressionStream('deflate-raw'), body);
  return JSON.parse(td.decode(body));
}
/* What the teacher sends to the whole class. */
export function lessonKey(raw) { return subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
export async function sealAll(key, obj) { return 'B1.' + await lock(key, obj); }
export async function openAll(key, env) {
  const p = String(env || '').split('.');
  if (p[0] !== 'B1' || p.length !== 4) return null;
  try { return await unlock(key, p[1], p[2], p[3]); } catch (e) { return null; }
}
/* What a pupil sends to the teacher only. */
const EC = { name: 'ECDH', namedCurve: 'P-256' };
export function newPair() { return subtle.generateKey(EC, true, ['deriveBits']); }
export async function pubOf(pair) { return b64u(new Uint8Array(await subtle.exportKey('raw', pair.publicKey))); }
export async function keepPair(pair) { return { pub: await subtle.exportKey('jwk', pair.publicKey), priv: await subtle.exportKey('jwk', pair.privateKey) }; }
export async function loadPair(j) {
  return { publicKey: await subtle.importKey('jwk', j.pub, EC, true, []), privateKey: await subtle.importKey('jwk', j.priv, EC, true, ['deriveBits']) };
}
export async function sharedKey(priv, pubB64, sid) {
  const pub = await subtle.importKey('raw', unb64u(pubB64), EC, false, []);
  const bits = await subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256);
  const k = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: utf8('ks2-live ' + sid), info: utf8('ks2-live v1') }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function sealUp(key, myPub, obj) { return 'U1.' + myPub + '.' + await lock(key, obj); }
export function upPub(env) { const p = String(env || '').split('.'); return p[0] === 'U1' && p.length === 5 && ID.test(p[1]) ? p[1] : ''; }
export async function openUp(key, env) {
  const p = String(env || '').split('.');
  if (p[0] !== 'U1' || p.length !== 5) return null;
  try { return await unlock(key, p[2], p[3], p[4]); } catch (e) { return null; }
}

/* ---------------- long messages travel in parts ---------------- */
export function split(env) {
  if (env.length <= PART) return [env];
  const id = rid(6), n = Math.ceil(env.length / PART), out = [];
  for (let k = 0; k < n; k++) out.push('C1.' + id + '.' + k + '.' + n + '.' + env.slice(k * PART, (k + 1) * PART));
  return out;
}
export function joiner() {
  const parts = new Map();
  return (text) => {
    text = String(text || '');
    if (!text.startsWith('C1.')) return text;
    const m = /^C1\.([A-Za-z0-9_-]{8})\.(\d{1,2})\.(\d{1,2})\.([A-Za-z0-9_.-]+)$/.exec(text);
    if (!m) return null;
    const id = m[1], k = Number(m[2]), n = Number(m[3]);
    if (!n || n > 40 || k >= n) return null;
    const now = Date.now();
    for (const [pid, x] of parts) if (now - x.at > 120000) parts.delete(pid);
    let e = parts.get(id);
    if (!e) { e = { n, got: new Map(), at: now }; parts.set(id, e); }
    e.got.set(k, m[4]);
    if (e.got.size < e.n) return null;
    parts.delete(id);
    let s = '';
    for (let i = 0; i < e.n; i++) s += e.got.get(i);
    return s;
  };
}

/* ---------------- the 6-digit code ----------------
   A pupil who types the code finds the join details in a channel named after the code, locked with a key made from
   the code (PBKDF2, 150,000 rounds), so guessing codes is slow, and the relay's own limits slow it further. */
export function newCode() { const b = rand(4); const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0; return String(100000 + (n % 900000)); }
export async function codeChannel(code) {
  const h = new Uint8Array(await subtle.digest('SHA-256', utf8('ks2-live-code|' + code)));
  return 'ks2lc-' + Array.from(h.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function codeKey(code) {
  const k = await subtle.importKey('raw', utf8(code), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: utf8('ks2-live-code v1'), iterations: 150000 }, k, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']);
}
export const channel = (sid, side) => 'ks2le-' + sid + '-' + side;      // side: t (teacher to class) or p (pupils to teacher)

/* ---------------- the relays ---------------- */
function relayError(code) { const e = new Error(code); e.code = code; return e; }
const NOREF = { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' };

/* The public relay. Sending is one POST; listening is one long request that streams a line per message (the
   relay keeps it open). If it closes, we reconnect from the last message we saw, waiting a little longer each time
   nothing new arrived, so a quiet or busy relay is never hammered. */
export function publicRelay(base) {
  base = base || PUBLIC;
  return {
    kind: 'public',
    async send(ch, text) {
      let r;
      try { r = await fetch(base + '/' + ch, Object.assign({ method: 'POST', body: text }, NOREF)); } catch (e) { throw relayError('network'); }
      if (r.status === 429) throw relayError('busy');
      if (!r.ok) throw relayError('relay');
    },
    listen(ch, onText, onState) {
      let stop = false, ctl = null, since = 'all', wait = 300;
      const seen = new Set();
      (async () => {
        while (!stop) {
          const t0 = Date.now();
          let got = 0;
          try {
            ctl = new AbortController();
            const r = await fetch(base + '/' + ch + '/json?since=' + encodeURIComponent(since), Object.assign({ signal: ctl.signal }, NOREF));
            if (!r.ok) throw relayError(r.status === 429 ? 'busy' : 'relay');
            if (onState) onState('on');
            const rd = r.body.getReader();
            let buf = '';
            for (;;) {
              const { value, done } = await rd.read();
              if (done) break;
              buf += td.decode(value, { stream: true });
              let i;
              while ((i = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
                if (!line) continue;
                let m; try { m = JSON.parse(line); } catch (e) { continue; }
                if (!m || m.event !== 'message' || !m.id || seen.has(m.id)) continue;
                seen.add(m.id); since = m.id; got++;
                try { await onText(String(m.message || '')); } catch (e) { /* one bad message never stops the rest */ }
              }
            }
          } catch (e) {
            if (stop) break;
            if (onState) onState(e && e.code === 'busy' ? 'busy' : 'off');
          }
          if (stop) break;
          wait = got || Date.now() - t0 > 20000 ? 300 : Math.min(wait * 2, 4000);
          await sleep(wait);
        }
      })();
      return () => { stop = true; try { if (ctl) ctl.abort(); } catch (e) { /* ignore */ } };
    },
    async all(ch) {
      let r;
      try { r = await fetch(base + '/' + ch + '/json?poll=1&since=all', NOREF); } catch (e) { throw relayError('network'); }
      if (!r.ok) throw relayError(r.status === 429 ? 'busy' : 'relay');
      return (await r.text()).split('\n').map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
        .filter((m) => m && m.event === 'message').map((m) => String(m.message || ''));
    }
  };
}

/* The school relay: the site's Apps Script. It cannot hold a request open, so we ask for new messages every second
   or two (more slowly when nothing is happening). */
export const SCRIPT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
export function schoolRelay(url) {
  const get = async (q) => {
    let r;
    try { r = await fetch(url + '?relay=ks2-live&' + q, { cache: 'no-store', credentials: 'omit', redirect: 'follow' }); } catch (e) { throw relayError('network'); }
    let j = null;
    try { j = await r.json(); } catch (e) { throw relayError('relay'); }
    if (!j || !j.ok) throw relayError(j && j.error === 'busy' ? 'busy' : 'relay');
    return j;
  };
  return {
    kind: 'school',
    async ping() { const j = await get('ping=1'); return !!j.relay; },
    async send(ch, text) {
      let j = null;
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ relay: 'ks2-live', ch, m: text }), redirect: 'follow', credentials: 'omit', cache: 'no-store' });
        j = await r.json();
      } catch (e) { throw relayError('network'); }
      if (!j || !j.ok) throw relayError(j && j.error === 'busy' ? 'busy' : 'relay');
    },
    listen(ch, onText, onState) {
      let stop = false, since = 0, wait = 1200;
      (async () => {
        while (!stop) {
          try {
            const j = await get('ch=' + encodeURIComponent(ch) + '&since=' + since);
            if (stop) break;
            if (onState) onState('on');
            const msgs = Array.isArray(j.msgs) ? j.msgs : [];
            for (const m of msgs) {
              if (!(m && m.n > since)) continue;
              since = m.n;
              try { await onText(String(m.m || '')); } catch (e) { /* keep going */ }
            }
            if (typeof j.last === 'number' && j.last > since && !msgs.length) since = j.last;
            wait = msgs.length ? 900 : Math.min(wait + 300, 2400);
          } catch (e) {
            if (stop) break;
            if (onState) onState(e && e.code === 'busy' ? 'busy' : 'off');
            wait = Math.min(wait * 2, 8000);
          }
          await sleep(wait);
        }
      })();
      return () => { stop = true; };
    },
    async all(ch) { const j = await get('ch=' + encodeURIComponent(ch) + '&since=0'); return (Array.isArray(j.msgs) ? j.msgs : []).map((m) => String(m.m || '')); }
  };
}

/* Send one message, in parts if it is long, trying again if the relay is busy for a moment. */
export async function post(relay, ch, env, tries) {
  const parts = split(env);
  for (const part of parts) {
    let n = 0;
    for (;;) {
      try { await relay.send(ch, part); break; } catch (e) {
        n += 1;
        if (n >= (tries || 3) || (e && e.code === 'relay')) throw e;
        await sleep(n * 1500 + Math.random() * 1200);
      }
    }
  }
}

/* ---------------- the join link ----------------
   https://…/join/#1.p.<lesson id>.<lesson key>.<teacher public key>   (p = public relay, s = school relay) */
export function parseJoin(hash) {
  const m = /^#?1\.([ps])\.([A-Za-z0-9_-]{12})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{80,100})$/.exec(String(hash || '').trim());
  return m ? { tr: m[1], sid: m[2], k: m[3], pub: m[4] } : null;
}
export const joinHash = (o) => '1.' + o.tr + '.' + o.sid + '.' + o.k + '.' + o.pub;

/* ---------------- what pupils may send ---------------- */
const RUDE = /\b(f+u+c+k\w*|sh[i1]t\w*|bitch\w*|cunt\w*|dick\w*|cock\w*|puss(y|ies)|wank\w*|bastard\w*|slut\w*|whore\w*|n[i1]gg\w*|fag\w*|retard\w*|twat\w*|prick\w*|bollock\w*|arse\w*|asshole\w*|piss\w*|sex\w*|porn\w*|nazi\w*)\b/i;
export function cleanName(s) {
  const t = String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (!t || RUDE.test(t)) return '';
  return t;
}
export function cleanText(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max || 200); }
