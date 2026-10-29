/* Reading a sample worksheet in the browser: a photo (made smaller first), a PDF, a Word file (.docx: its text,
   read from the file itself) or pasted text. Nothing is uploaded here: the sample goes to the engine only inside the
   request that makes the new worksheet, and it is not kept. */
export const LIMITS = { pdfBytes: 10 * 1024 * 1024, pdfPages: 10, imageBytes: 30 * 1024 * 1024, docxBytes: 20 * 1024 * 1024, text: 15000, side: 1568 };

function fail(code, extra) { const e = new Error(code); e.code = code; Object.assign(e, extra || {}); return e; }
export function b64(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
const ext = (name) => { const m = /\.([a-z0-9]+)$/i.exec(String(name || '')); return m ? m[1].toLowerCase() : ''; };
export function kindOf(file) {
  const t = String(file && file.type || '').toLowerCase(), e = ext(file && file.name);
  if (t === 'application/pdf' || e === 'pdf') return 'pdf';
  if (t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || e === 'docx') return 'docx';
  if (e === 'doc' || t === 'application/msword') return 'doc';
  if (t === 'image/heic' || t === 'image/heif' || e === 'heic' || e === 'heif') return 'heic';
  if (/^image\//.test(t) || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(e)) return 'image';
  if (/^text\//.test(t) || e === 'txt') return 'text';
  return '';
}

/* ---------------- photos ---------------- */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { resolve({ img, done: () => URL.revokeObjectURL(url) }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(fail('unreadable')); };
    img.decoding = 'async';
    img.src = url;
  });
}
/* Longest side at most 1568 px, JPEG 0.85 on white (so transparent PNGs stay readable). */
export function shrink(img, side, quality) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  if (!w || !h) throw fail('unreadable');
  const k = Math.min(1, (side || LIMITS.side) / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext('2d');
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', quality || 0.85);
  return { url, data: url.slice(url.indexOf(',') + 1), w: c.width, h: c.height };
}
async function readImage(file, heic) {
  if (file.size > LIMITS.imageBytes) throw fail('too_big', { max: '30 MB' });
  let got;
  try { got = await loadImage(file); } catch (e) { throw fail(heic ? 'heic' : 'unreadable'); }
  try {
    const s = shrink(got.img);
    return { kind: 'image', name: file.name || 'Photo', size: file.size, mediaType: 'image/jpeg', data: s.data, thumb: s.url, w: s.w, h: s.h };
  } finally { got.done(); }
}

/* ---------------- PDFs ---------------- */
/* Pages, counted from the file's own page objects (0 when it cannot tell, for example compressed page lists). */
export function pdfPages(bytes) {
  let s = '';
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  const m = s.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return m ? m.length : 0;
}
async function readPdf(file) {
  if (file.size > LIMITS.pdfBytes) throw fail('too_big', { max: '10 MB' });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) throw fail('unreadable');
  const pages = pdfPages(bytes);
  if (pages > LIMITS.pdfPages) throw fail('too_many_pages', { pages });
  return { kind: 'pdf', name: file.name || 'Sample.pdf', size: file.size, mediaType: 'application/pdf', data: b64(bytes), pages };
}

/* ---------------- Word (.docx): the text of word/document.xml ---------------- */
const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
async function inflate(bytes) {
  if (typeof DecompressionStream !== 'function') throw fail('old_browser');
  const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
  w.write(bytes); w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
/* One file out of a zip (stored or deflated), or null if it is not there. */
export async function unzipEntry(buf, wanted) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) { if (u32(b, i) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw fail('unreadable');
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const dec = new TextDecoder();
  for (let n = 0; n < count && p + 46 <= b.length; n++) {
    if (u32(b, p) !== 0x02014b50) break;
    const method = u16(b, p + 10), csize = u32(b, p + 20), nlen = u16(b, p + 28), xlen = u16(b, p + 30), clen = u16(b, p + 32), off = u32(b, p + 42);
    const name = dec.decode(b.subarray(p + 46, p + 46 + nlen));
    if (name === wanted) {
      if (u32(b, off) !== 0x04034b50) throw fail('unreadable');
      const start = off + 30 + u16(b, off + 26) + u16(b, off + 28), data = b.subarray(start, start + csize);
      if (method === 0) return data.slice();
      if (method === 8) return inflate(data);
      throw fail('unreadable');
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}
/* Paragraphs (numbered ones get a dash), tables as rows of cells, and Word's maths fractions as 3/4. */
export function docxText(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw fail('unreadable');
  const out = [];
  const textOf = (node) => {
    let s = '';
    const walk = (n) => {
      if (n.nodeType !== 1) return;
      const ln = n.localName;
      if (ln === 't') { s += n.textContent; return; }
      if (ln === 'tab') { s += '\t'; return; }
      if (ln === 'br' || ln === 'cr') { s += '\n'; return; }
      if (ln === 'f' && n.namespaceURI && /math/.test(n.namespaceURI)) {
        let num = '', den = '';
        Array.from(n.children).forEach((c) => { if (c.localName === 'num') num = c.textContent.trim(); if (c.localName === 'den') den = c.textContent.trim(); });
        s += num + '/' + den; return;
      }
      if (ln === 'delText' || ln === 'instrText') return;
      Array.from(n.childNodes).forEach(walk);
    };
    walk(node);
    return s;
  };
  const para = (p) => {
    const t = textOf(p).replace(/[  ]+/g, ' ').trim();
    if (!t) return '';
    const numbered = p.getElementsByTagNameNS('*', 'numPr').length > 0;
    return (numbered ? '- ' : '') + t;
  };
  const body = doc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) throw fail('unreadable');
  Array.from(body.children).forEach((n) => {
    if (n.localName === 'p') { const t = para(n); if (t) out.push(t); }
    else if (n.localName === 'tbl') {
      Array.from(n.getElementsByTagNameNS('*', 'tr')).forEach((tr) => {
        const cells = Array.from(tr.children).filter((c) => c.localName === 'tc').map((tc) => Array.from(tc.getElementsByTagNameNS('*', 'p')).map(para).filter(Boolean).join(' '));
        if (cells.some(Boolean)) out.push(cells.join(' | '));
      });
    } else if (n.localName === 'sdt') { Array.from(n.getElementsByTagNameNS('*', 'p')).forEach((p) => { const t = para(p); if (t) out.push(t); }); }
  });
  return out.join('\n');
}
async function readDocx(file) {
  if (file.size > LIMITS.docxBytes) throw fail('too_big', { max: '20 MB' });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4B)) throw fail('unreadable');
  const xml = await unzipEntry(bytes, 'word/document.xml');
  if (!xml) throw fail('unreadable');
  const text = docxText(new TextDecoder().decode(xml)).slice(0, LIMITS.text);
  if (text.replace(/\s+/g, '').length < 10) throw fail('empty');
  return { kind: 'docx', name: file.name || 'Sample.docx', size: file.size, text };
}

/* ---------------- any file ---------------- */
export async function readSample(file) {
  if (!file) throw fail('empty');
  const k = kindOf(file);
  if (k === 'image') return readImage(file, false);
  if (k === 'heic') return readImage(file, true);      // Safari can read these; other browsers say so plainly
  if (k === 'pdf') return readPdf(file);
  if (k === 'docx') return readDocx(file);
  if (k === 'doc') throw fail('old_word');
  if (k === 'text') { const t = (await file.text()).slice(0, LIMITS.text); if (t.replace(/\s+/g, '').length < 10) throw fail('empty'); return { kind: 'text', name: file.name || 'Text', size: file.size, text: t }; }
  throw fail('type');
}
export function sampleFromText(text) {
  const t = String(text || '').replace(/\r\n/g, '\n').slice(0, LIMITS.text);
  if (t.replace(/\s+/g, '').length < 10) throw fail('empty');
  return { kind: 'text', name: 'Pasted text', size: t.length, text: t };
}
/* The message content for the engine: the sample first, then the instructions are added by the page. */
export function contentFor(s) {
  if (!s) return [];
  if (s.kind === 'image') return [{ type: 'image', source: { type: 'base64', media_type: s.mediaType || 'image/jpeg', data: s.data } }];
  if (s.kind === 'pdf') return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: s.data } }];
  return [{ type: 'text', text: 'The sample worksheet, as text' + (s.kind === 'docx' ? ' (read from a Word file; pictures in it are not included)' : '') + ':\n<sample>\n' + s.text + '\n</sample>' }];
}
/* What to tell the teacher when a file cannot be used. */
export function sampleError(e) {
  const c = e && e.code;
  if (c === 'heic') return 'This photo is in the iPhone HEIC format, which this browser cannot read. Open the site in Safari on the iPhone, or take a screenshot of the worksheet and upload that.';
  if (c === 'too_big') return 'That file is too big (the most is ' + (e.max || '10 MB') + '). Upload a smaller copy, or a photo of the page.';
  if (c === 'too_many_pages') return 'That PDF has ' + e.pages + ' pages. Upload up to ' + LIMITS.pdfPages + ' pages: save just the worksheet pages as a new PDF, or take a photo of the page.';
  if (c === 'old_word') return 'That is an older Word file (.doc). In Word choose File, Save As, Word Document (.docx), then upload that, or upload a photo or PDF of the page.';
  if (c === 'empty') return 'There is no text to read in that. Upload a photo or a PDF of the worksheet instead.';
  if (c === 'type') return 'That kind of file cannot be read here. Upload a photo (JPEG or PNG), a PDF or a Word file (.docx), or paste the text.';
  if (c === 'old_browser') return 'This browser is too old to read Word files. Upload a photo or a PDF of the worksheet instead.';
  return 'That file could not be read. Try a photo (JPEG or PNG) or a PDF of the worksheet.';
}
export const sizeText = (n) => (n >= 1048576 ? (Math.round(n / 104857.6) / 10) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
