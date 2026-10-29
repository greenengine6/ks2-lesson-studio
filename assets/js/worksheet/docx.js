/* Word files (.docx) for worksheets: the worksheet (each level starting on a new page) and a separate answer sheet.
   Real Office Open XML in a small zip made here (stored, no compression), so they open in Word, Google Docs, Pages
   and on phones, and can be changed like any document. Fractions: the numerator raised, a fraction slash and the
   denominator lowered, as in the site's other files; a missing number (□) becomes a blank to write on. */
import { LEVELS, sectionsFor, eachLevel } from './prompts.js?v=73f756c9';

const te = new TextEncoder();
/* ---------------- a stored zip ---------------- */
let CRC = null;
export function crc32(bytes) {
  if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
/* files: [{ name, data: string | Uint8Array }] → Uint8Array of a .zip */
export function zipBytes(files) {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [], centrals = [];
  let offset = 0;
  files.forEach((f) => {
    const name = te.encode(f.name), data = typeof f.data === 'string' ? te.encode(f.data) : f.data, crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    locals.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
    centrals.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  });
  const cdSize = centrals.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const parts = locals.concat(centrals, [new Uint8Array(end.buffer)]);
  const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
  let p = 0;
  parts.forEach((x) => { out.set(x, p); p += x.length; });
  return out;
}

/* ---------------- Word XML ---------------- */
const x = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const INK = '1B2440', SOFT = '4A5468', FAINT = '7A849A', LINE = '9AA3B5', ACCENT = '3C3399';
function rPr(o) {
  o = o || {};
  return '<w:rPr>' + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.u ? '<w:u w:val="single"/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') +
    (o.sz ? '<w:sz w:val="' + o.sz + '"/><w:szCs w:val="' + o.sz + '"/>' : '') + (o.va ? '<w:vertAlign w:val="' + o.va + '"/>' : '') + '</w:rPr>';
}
const run = (t, o) => '<w:r>' + rPr(o) + '<w:t xml:space="preserve">' + x(t) + '</w:t></w:r>';
const BLANK = '        ';
/* Text with stacked-style fractions and blanks for □. */
const FRAC = /(\d{1,4}|□)\s*\/\s*(\d{1,4}|□)/g;
const edge = (c) => /[\d/]/.test(c || '');
export function runs(text, o) {
  o = o || {};
  const s = String(text == null ? '' : text);
  let out = '', last = 0, m;
  const plain = (t) => t.split('□').map((part, i) => (i ? run(BLANK, Object.assign({}, o, { u: true })) : '') + (part ? run(part, o) : '')).join('');
  FRAC.lastIndex = 0;
  while ((m = FRAC.exec(s))) {
    if (edge(s[m.index - 1]) || edge(s[m.index + m[0].length])) continue;       // a date (12/05/2026) or a longer run of slashes
    out += plain(s.slice(last, m.index));
    const big = Object.assign({}, o, { sz: (o.sz || 28) + 10 });
    const part = (v, va) => (v === '□' ? run('    ', Object.assign({}, big, { va, u: true })) : run(v, Object.assign({}, big, { va })));
    out += part(m[1], 'superscript') + run('⁄', big) + part(m[2], 'subscript');
    last = m.index + m[0].length;
  }
  return out + plain(s.slice(last));
}
function p(inner, o) {
  o = o || {};
  const ppr = (o.style ? '<w:pStyle w:val="' + o.style + '"/>' : '') + (o.keep ? '<w:keepNext/>' : '') + (o.pageBreak ? '<w:pageBreakBefore/>' : '') +
    (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="' + LINE + '"/></w:pBdr>' : '') +
    (o.tabs ? '<w:tabs>' + o.tabs.map((t) => '<w:tab w:val="' + t[0] + '" w:pos="' + t[1] + '"/>').join('') + '</w:tabs>' : '') +
    '<w:spacing w:before="' + (o.before == null ? 0 : o.before) + '" w:after="' + (o.after == null ? 120 : o.after) + '"' + (o.line ? ' w:line="' + o.line + '" w:lineRule="' + (o.rule || 'auto') + '"' : '') + '/>' +
    (o.ind ? '<w:ind w:left="' + o.ind + '"' + (o.hang ? ' w:hanging="' + o.hang + '"' : '') + '/>' : '') + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '');
  return '<w:p><w:pPr>' + ppr + '</w:pPr>' + (inner || '') + '</w:p>';
}
const writeLine = () => p('', { border: true, before: 300, after: 0, line: 300, rule: 'exact' });
const BORDERS = (sz) => ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((k) => '<w:' + k + ' w:val="' + (sz ? 'single' : 'nil') + '" w:sz="' + (sz || 0) + '" w:space="0" w:color="' + LINE + '"/>').join('');
function table(rows, o) {
  o = o || {};
  const cols = o.widths || [];
  return '<w:tbl><w:tblPr><w:tblW w:w="' + (o.w || 5000) + '" w:type="pct"/><w:tblBorders>' + BORDERS(o.border) + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
    '<w:tblGrid>' + cols.map((c) => '<w:gridCol w:w="' + c + '"/>').join('') + '</w:tblGrid>' +
    rows.map((r) => '<w:tr>' + (r.h ? '<w:trPr><w:trHeight w:val="' + r.h + '" w:hRule="atLeast"/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>') +
      r.cells.map((c, i) => '<w:tc><w:tcPr><w:tcW w:w="' + (cols[i] || 2000) + '" w:type="dxa"/>' + (c.shade ? '<w:shd w:val="clear" w:color="auto" w:fill="' + c.shade + '"/>' : '') + '</w:tcPr>' + (c.xml || p('')) + '</w:tc>').join('') + '</w:tr>').join('') + '</w:tbl>' + p('', { after: 60 });
}
/* The same mixed order every time for the same question (so the answer sheet matches the worksheet). */
export function mixed(items, seed) {
  const a = items.map((v, i) => [v, i]);
  let h = 2166136261;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let i = a.length - 1; i > 0; i--) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; const j = Math.abs(h) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.length > 1 && a.every((v, i) => v[1] === i)) a.push(a.shift());
  return a;
}
const TEXT_W = 9638;     // A4 width minus 2 cm margins, in twentieths of a point
/* A sum with fractions or missing numbers ("1/2 = □/4", "345 + □ = 600") is drawn as a row of cells: each fraction
   truly stacked (a little two-row table with the line between), each □ a box big enough to write in. */
const MATH_ONLY = /^[\d\s□/+\-−×x÷=.,()?]+$/;
const MATH_TOKEN = /(\d{1,4}|□)\s*\/\s*(\d{1,4}|□)|□|\?|\d+(?:[.,]\d+)?|[+\-−×x÷=()]/g;
export function isMath(text) { const t = String(text || '').trim(); return MATH_ONLY.test(t) && /[/□?]/.test(t) && /\d/.test(t); }
const NUM = 34, BOXSZ = 46;
const tight = () => '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>';
const cellP = (inner) => p(inner, { jc: 'center', after: 0, before: 0 });
const boxRun = () => run('☐', { sz: BOXSZ, color: '5B52E6' });
function fracTable(n, d) {
  const part = (v) => (v === '□' ? boxRun() : run(v, { sz: NUM }));
  return '<w:tbl><w:tblPr><w:tblW w:w="640" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>' + BORDERS(0) + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="30" w:type="dxa"/><w:right w:w="30" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="640"/></w:tblGrid>' +
    '<w:tr><w:tc><w:tcPr><w:tcW w:w="640" w:type="dxa"/><w:tcBorders><w:bottom w:val="single" w:sz="12" w:space="0" w:color="' + INK + '"/></w:tcBorders><w:vAlign w:val="bottom"/></w:tcPr>' + cellP(part(n)) + '</w:tc></w:tr>' +
    '<w:tr><w:tc><w:tcPr><w:tcW w:w="640" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>' + cellP(part(d)) + '</w:tc></w:tr></w:tbl>' + tight();
}
function mathXml(q, width) {
  const t = String(q.q).trim(), cells = [], widths = [];
  const add = (xml, w) => { cells.push(xml); widths.push(w); };
  if (q.n) add(cellP(run(q.n + '.', { b: true, color: ACCENT })), 520);
  let m;
  MATH_TOKEN.lastIndex = 0;
  while ((m = MATH_TOKEN.exec(t))) {
    if (m[1] != null) add(fracTable(m[1], m[2]), 780);
    else if (m[0] === '□' || m[0] === '?') add(cellP(boxRun()), 720);
    else if (/^\d/.test(m[0])) add(cellP(run(m[0], { sz: NUM })), 240 + 180 * m[0].length);
    else add(cellP(run(m[0] === '-' ? '−' : m[0] === 'x' ? '×' : m[0], { sz: NUM })), 420);
  }
  const total = widths.reduce((a, b) => a + b, 0);
  if (widths.length < 2 || total > (width || TEXT_W) - 120) return '';
  return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblBorders>' + BORDERS(0) + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="20" w:type="dxa"/><w:right w:w="20" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
    '<w:tblGrid>' + widths.map((w) => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr>' +
    cells.map((c, i) => '<w:tc><w:tcPr><w:tcW w:w="' + widths[i] + '" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>' + c + '</w:tc>').join('') + '</w:tr></w:tbl>' + p('', { after: 100, line: 120, rule: 'exact' });
}
function questionXml(q, width) {
  const w = width || TEXT_W, head = (q.n ? run(q.n + '.  ', { b: true, color: ACCENT }) : '') + runs(q.q) + (q.marks > 1 ? run('  (' + q.marks + ' marks)', { color: FAINT, sz: 22 }) : '');
  let h = (isMath(q.q) && mathXml(q, w)) || p(head, { before: 160, after: 60, keep: true, ind: 425, hang: 425 });
  if (q.type === 'choice') h += q.opts.map((o, j) => p(run('☐  ', { sz: 30 }) + run('ABCDEF'[j] + '   ', { b: true }) + runs(o), { ind: 425, after: 40 })).join('');
  else if (q.type === 'tick') {
    const cw = Math.round((w - 425) * 0.62), bw = Math.round((w - 425 - cw) / 2);
    h += table([{ cells: [{ xml: p(run('Statement', { b: true, color: SOFT })) }, { xml: p(run('True', { b: true, color: SOFT }), { jc: 'center' }) }, { xml: p(run('False', { b: true, color: SOFT }), { jc: 'center' }) }] }]
      .concat(q.opts.map((s) => ({ cells: [{ xml: p(runs(s)) }, { xml: p(run('☐', { sz: 32 }), { jc: 'center' }) }, { xml: p(run('☐', { sz: 32 }), { jc: 'center' }) }] }))), { widths: [cw, bw, bw], border: 4 });
  } else if (q.type === 'order') h += mixed(q.opts, q.q).map(([t]) => p(run('☐  ', { sz: 30 }) + runs(t), { ind: 425, after: 40 })).join('');
  else if (q.type === 'match') {
    const right = mixed(q.match, q.q), c1 = Math.round((w - 425) * 0.42), c2 = Math.round((w - 425) * 0.16);
    h += table(q.opts.map((l, j) => ({ cells: [{ xml: p(run((j + 1) + '. ', { b: true }) + runs(l)) }, { xml: p(run('_____', { color: LINE }), { jc: 'center' }) }, { xml: p(run('ABCDEFGH'[j] + '. ', { b: true }) + runs(right[j][0])) }] })), { widths: [c1, c2, w - 425 - c1 - c2] });
  } else if (q.type === 'draw') {
    h += table([{ h: Math.max(2, q.lines || 4) * 400, cells: [{ xml: p('') }] }], { widths: [w - 425], border: 6 });
  } else if (q.type === 'calc') h += p(run('Working:', { color: FAINT, sz: 22 }), { ind: 425, before: 60, after: 600 });
  if (q.type === 'write' || (q.lines && !['draw', 'calc'].includes(q.type))) for (let i = 0; i < Math.max(1, q.lines || 0); i++) h += writeLine();
  return h;
}
function sectionXml(s) {
  let h = '';
  if (s.heading) h += p(runs(s.heading, { b: true, sz: 32, color: ACCENT }), { before: 240, after: 60, keep: true });
  if (s.instructions) h += p(runs(s.instructions, { i: true, color: SOFT }), { after: 100, keep: true });
  if (s.columns === 2 && s.questions.length > 1) {
    const half = Math.floor(TEXT_W / 2), rows = [];
    for (let i = 0; i < s.questions.length; i += 2) rows.push({ cells: [s.questions[i], s.questions[i + 1]].map((q) => ({ xml: q ? questionXml(q, half) : p('') })) });
    h += table(rows, { widths: [half, TEXT_W - half] });
  } else h += s.questions.map((q) => questionXml(q)).join('');
  return h;
}
const LEVEL_NAME = Object.fromEntries(LEVELS);
function headXml(sheet, level, first) {
  const meta = [sheet.year, sheet.subjectName, sheet.levels ? LEVEL_NAME[level] : ''].filter(Boolean).join(' · ');
  return (meta ? p(run(meta, { color: FAINT, sz: 22 }), { after: 40, pageBreak: !first }) : '') +
    p(runs(sheet.title, { b: true, sz: 40 }), { after: 80, pageBreak: !meta && !first }) +
    p(run('Name: ', { b: true }) + run('_______________________', { color: LINE }) + run('\t') + run('Date: ', { b: true }) + run('______________', { color: LINE }), { after: 160, tabs: [['right', TEXT_W]] }) +
    (sheet.instructions ? p(runs(sheet.instructions, { color: SOFT }), { after: 160 }) : '');
}
function docXml(body) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:color w:val="' + INK + '"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="336" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
function docx(body, title) {
  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:title>' + x(title) + '</dc:title><dc:creator>KS2 Lesson Engine</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</dcterms:created></cp:coreProperties>';
  const bytes = zipBytes([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
    { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'word/document.xml', data: docXml(body) },
    { name: 'word/styles.xml', data: STYLES },
    { name: 'docProps/core.xml', data: core }
  ]);
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
/* The worksheet: the levels asked for (default every level it has), each on its own pages. */
export function sheetDocx(sheet, levels) {
  const want = levels && levels.length ? levels : [];
  let body = '', first = true;
  eachLevel(sheet, (level, secs) => {
    if (want.length && !want.includes(level)) return;
    body += headXml(sheet, level, first) + secs.map(sectionXml).join('');
    first = false;
  });
  return docx(body, sheet.title);
}
/* The answer sheet, for the teacher: every level, question by question. */
export function answersDocx(sheet) {
  let body = p(run([sheet.year, sheet.subjectName].filter(Boolean).join(' · ') || 'Answers', { color: FAINT, sz: 22 }), { after: 40 }) +
    p(run('Answers: ', { b: true, sz: 40 }) + runs(sheet.title, { b: true, sz: 40 }), { after: 200 });
  eachLevel(sheet, (level, secs) => {
    if (sheet.levels) body += p(run(LEVEL_NAME[level], { b: true, sz: 32, color: ACCENT }), { before: 240, after: 80, keep: true });
    secs.forEach((s) => s.questions.forEach((q) => {
      body += p(run(q.n + '.  ', { b: true, color: ACCENT }) + runs(q.answer || 'Answers will vary.'), { ind: 425, hang: 425, after: 80 });
    }));
  });
  return docx(body, 'Answers: ' + sheet.title);
}
export function fileName(sheet, what) {
  return ([sheet.year, sheet.subjectName, sheet.title].filter(Boolean).join(' ') + ' - ' + what).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110) + '.docx';
}
export { sectionsFor };
