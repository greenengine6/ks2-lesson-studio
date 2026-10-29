/* Homework links: the homework (and, if the teacher chooses, the class's online lesson times) packed into the link
   itself, after the #, so nothing is stored anywhere and the pupils' page needs no network.
   #1.<data>: the JSON squeezed (deflate-raw) and written in base64url; #0.<data>: plain JSON in base64url, for
   browsers without CompressionStream. Pure (no imports): the pupils' page uses it too. */
const te = new TextEncoder(), td = new TextDecoder();
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(s) {
  const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pump(stream, data) {
  const w = stream.writable.getWriter(); w.write(data); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
const zip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
export async function packLink(obj) {
  const raw = te.encode(JSON.stringify(obj));
  if (zip) { try { return '1.' + b64u(await pump(new CompressionStream('deflate-raw'), raw)); } catch (e) { /* plain below */ } }
  return '0.' + b64u(raw);
}
/* The object in a link, or null if it is broken. Limits stop a huge or hostile link. */
export async function unpackLink(hash) {
  const h = String(hash || '').replace(/^#/, '').trim();
  const m = /^([01])\.([A-Za-z0-9_-]{4,12000})$/.exec(h);
  if (!m) return null;
  try {
    let bytes = unb64u(m[2]);
    if (m[1] === '1') { if (!zip) return null; bytes = await pump(new DecompressionStream('deflate-raw'), bytes); }
    if (bytes.length > 60000) return null;
    const v = JSON.parse(td.decode(bytes));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch (e) { return null; }
}
/* The pupils' page address, next to the site's own (…/ks2-lesson-studio/homework/). */
export const homeworkPage = () => new URL('homework/', location.href.split('#')[0]).href;
