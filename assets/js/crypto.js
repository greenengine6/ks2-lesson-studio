/* Small Web Crypto helpers: base64url, random bytes, PBKDF2, SHA-256, sealing data so that only the admin can open
   it (ECDH P-256 with a fresh key each time, HKDF-SHA-256, AES-256-GCM), and checking passkey (WebAuthn) sign-ins. */
const subtle = (window.crypto && window.crypto.subtle) || null;
export const cryptoOK = !!subtle;
const te = new TextEncoder(), td = new TextDecoder();

export function b64u(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
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
export const utf8 = (s) => te.encode(String(s));
export const unutf8 = (b) => td.decode(b);
export function random(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
export async function sha256(data) { return new Uint8Array(await subtle.digest('SHA-256', typeof data === 'string' ? utf8(data) : data)); }
export async function pbkdf2(secret, salt, iterations, bits) {
  const k = await subtle.importKey('raw', utf8(secret), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, k, bits));
}
export function sameBytes(a, b) { if (!a || !b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
export async function aesKey(raw, usages) { return subtle.importKey('raw', raw, 'AES-GCM', false, usages || ['encrypt', 'decrypt']); }
export async function aesEncrypt(key, data) { const iv = random(12); const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, data)); return { iv, ct }; }
export async function aesDecrypt(key, iv, ct) { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)); }

/* ---------- sealing for the admin ---------- */
async function hkdfKey(shared, salt, info) {
  const k = await subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: utf8(info) }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function importAdminPublic(rawB64) {
  return subtle.importKey('raw', unb64u(rawB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}
export async function importAdminPrivate(pkcs8) {
  return subtle.importKey('pkcs8', pkcs8, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
}
export async function seal(adminPub, text) {
  const eph = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: adminPub }, eph.privateKey, 256));
  const epk = new Uint8Array(await subtle.exportKey('raw', eph.publicKey));
  const salt = random(16);
  const key = await hkdfKey(shared, salt, 'ks2-engine submission v1');
  let body = utf8(text), z = 0;
  if (window.CompressionStream) { try { body = await squash(body); z = 1; } catch (e) { body = utf8(text); z = 0; } }
  const { iv, ct } = await aesEncrypt(key, body);
  return { v: 1, kind: 'ks2-sealed', alg: 'ECDH-P256/HKDF-SHA256/A256GCM', z, epk: b64u(epk), salt: b64u(salt), iv: b64u(iv), ct: b64u(ct) };
}
export async function unseal(adminPriv, box) {
  const pub = await subtle.importKey('raw', unb64u(box.epk), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: pub }, adminPriv, 256));
  const key = await hkdfKey(shared, unb64u(box.salt), 'ks2-engine submission v1');
  let body = await aesDecrypt(key, unb64u(box.iv), unb64u(box.ct));
  if (box.z) body = await unsquash(body);
  return unutf8(body);
}
async function pump(stream, data) {
  const w = stream.writable.getWriter(); w.write(data); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
const squash = (d) => pump(new CompressionStream('deflate-raw'), d);
const unsquash = (d) => pump(new DecompressionStream('deflate-raw'), d);

/* ---------- passkeys ---------- */
export const passkeyOK = !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
export async function platformPasskey() {
  if (!passkeyOK || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch (e) { return false; }
}
export async function createPasskey(userName) {
  const cred = await navigator.credentials.create({ publicKey: {
    rp: { name: 'KS2 Lesson Engine', id: location.hostname },
    user: { id: utf8('ks2-admin'), name: userName, displayName: userName },
    challenge: random(32),
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
    timeout: 90000, attestation: 'none'
  } });
  const r = cred.response;
  const spki = r.getPublicKey ? r.getPublicKey() : null;
  return { id: b64u(cred.rawId), spki: spki ? b64u(spki) : '', alg: r.getPublicKeyAlgorithm ? r.getPublicKeyAlgorithm() : -7, at: Date.now() };
}
function derToRaw(der) {
  let i = 2;
  if (der[1] & 0x80) i = 2 + (der[1] & 0x7f);
  const part = () => { i++; const len = der[i++]; let v = der.slice(i, i + len); i += len; while (v.length > 32 && v[0] === 0) v = v.slice(1); const out = new Uint8Array(32); out.set(v, 32 - v.length); return out; };
  const r = part(), s = part();
  const raw = new Uint8Array(64); raw.set(r, 0); raw.set(s, 32);
  return raw;
}
export async function checkPasskey(saved) {
  const challenge = random(32);
  const a = await navigator.credentials.get({ publicKey: { challenge, rpId: location.hostname, allowCredentials: [{ type: 'public-key', id: unb64u(saved.id) }], userVerification: 'required', timeout: 90000 } });
  const r = a.response;
  const cd = JSON.parse(unutf8(new Uint8Array(r.clientDataJSON)));
  if (cd.type !== 'webauthn.get' || cd.challenge !== b64u(challenge) || cd.origin !== location.origin) return false;
  const ad = new Uint8Array(r.authenticatorData);
  if (!(ad[32] & 0x01) || !(ad[32] & 0x04)) return false;            // user present and verified
  if (!saved.spki) return true;                                        // browser did not share the public key: platform check only
  const data = new Uint8Array(ad.length + 32);
  data.set(ad, 0); data.set(await sha256(new Uint8Array(r.clientDataJSON)), ad.length);
  const sig = new Uint8Array(r.signature);
  if (saved.alg === -257) {
    const k = await subtle.importKey('spki', unb64u(saved.spki), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return subtle.verify('RSASSA-PKCS1-v1_5', k, sig, data);
  }
  const k = await subtle.importKey('spki', unb64u(saved.spki), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, derToRaw(sig), data);
}

/* ---------- key-value storage (IndexedDB, shared with the activity log) ---------- */
export { kvGet as idbGet, kvSet as idbSet, kvDel as idbDel } from './idb.js?v=49509700';
