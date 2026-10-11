/* Fractions, written the way the class writes them: the numerator over the denominator with a line between, never
   "3/4". The engine is asked to write fractions as digits with a slash (3/4, 1 1/2) and ½-style characters are
   tidied to the same form, so there is one shape to look for. Then, wherever words appear on screen (slides, the
   worksheet, the board, pupils' own devices, Symphony's replies, the Wonder Window) every 3/4 is stacked as it
   appears. The text underneath is still "3/4", so copying, reading aloud and screen readers keep working.
   PowerPoint and Word get the numerator as superscript and the denominator as subscript (the nearest those files
   allow in running text), copies get ³⁄₄, and Symphony says "three quarters". Dates (12/05/2026), "Year 5/6",
   web addresses and code are left alone. */

/* a/b with 1 to 3 digits each and no spaces: not part of a longer number, a date, a decimal, a web address, a unit like km/h or a count like 2 / 12 */
const RE = /(^|[^\w\/.,:°])(\d{1,3})\/(\d{1,3})(?!\.?\d|[A-Za-z_\/:%])/g;             // 3/4, never "2 / 12" (a slide count)
const HAS = /\d\/\d|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/;
const VULGAR = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
const VRE = /(\d)?( ?)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g;
const NOT_FRAC = /(?:\b(?:year|yr|y|p|ks|class|grade|primary|stage|page|pages|p\.|pp\.)\s?|\d\s?[-–]\s?)$/i;     // "Year 5/6", "KS1/2", "page 3/4"
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
const NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const DENS = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'], 100: ['hundredth', 'hundredths'] };

export const hasFrac = (s) => typeof s === 'string' && HAS.test(s);
/* ½ and friends become 1/2, with a space after a whole number (3½ → 3 1/2) */
export const fracNorm = (s) => (typeof s === 'string' && HAS.test(s) ? s.replace(VRE, (m, d, sp, c) => (d ? d + ' ' : sp) + VULGAR[c]) : s);
/* The fractions in a string, in order, as pieces: { t, k } with k = 't' (plain text), 'n' (numerator), 's' (the line), 'd' (denominator). */
export function pieces(s) {
  const out = []; let last = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(s))) {
    const at = m.index + m[1].length, before = s.slice(0, at), tok = before.slice(before.search(/\S*$/));
    if (NOT_FRAC.test(before) || /:\/\/|^www\./i.test(tok)) continue;                   // "Year 5/6", a web address
    if (at > last) out.push({ t: s.slice(last, at), k: 't' });
    out.push({ t: m[2], k: 'n' }, { t: '/', k: 's' }, { t: m[3], k: 'd' });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: s.slice(last), k: 't' });
  return out;
}
const mapFracs = (s, fn) => pieces(fracNorm(s)).reduce((acc, p, i, ps) => (p.k === 't' ? acc + p.t : p.k === 'n' ? acc + fn(p.t, ps[i + 2].t, acc) : acc), '');
const sup = (n) => n.replace(/\d/g, (c) => SUP[c]), sub = (n) => n.replace(/\d/g, (c) => SUB[c]);

/* ---------------- plain text: ³⁄₄ (for copies) ---------------- */
export function fracText(s) {
  if (!hasFrac(s)) return s;
  return mapFracs(s, (n, d) => sup(n) + '\u2044' + sub(d));
}
/* ---------------- spoken: "three quarters", "2 and a half" ---------------- */
export function fracWords(s, lang) {
  if (!hasFrac(s)) return s;
  const ms = /^(ms|id)/i.test(String(lang || ''));
  return mapFracs(s, (n, d, before) => {
    const N = Number(n), D = Number(d), den = DENS[D], mixed = /\d\s$/.test(before);
    if (ms) return (mixed ? 'dan ' : '') + n + ' per ' + d;
    if (!den || N > 12) return (mixed ? 'and ' : '') + n + ' over ' + d;
    if (mixed && N === 1) return 'and a ' + den[0];
    return (mixed ? 'and ' : '') + NUMS[N] + ' ' + den[N === 1 ? 0 : 1];
  });
}
/* ---------------- HTML for Word and copies: <sup>3</sup>⁄<sub>4</sub>, only in the text between tags ---------------- */
export function fracHTML(html) {
  if (!hasFrac(html)) return html;
  return String(html).split(/(<[^>]*>)/).map((part, i) => (i % 2 || !hasFrac(part) || /:\/\//.test(part) ? part : mapFracs(part, (n, d) => '<sup>' + n + '</sup>&#8260;<sub>' + d + '</sub>'))).join('');
}
/* ---------------- PowerPoint: text runs with the numerator raised and the denominator lowered ---------------- */
export function fracRuns(t) {
  const runs = typeof t === 'string' ? [{ text: t }] : Array.isArray(t) ? t : null;
  if (!runs || !runs.some((r) => r && hasFrac(r.text))) return t;
  const out = [];
  runs.forEach((r) => {
    if (!r || !hasFrac(r.text)) { out.push(r); return; }
    const o = r.options || {}, ps = pieces(fracNorm(r.text)), base = Object.assign({}, o);
    delete base.bullet; delete base.breakLine;
    ps.forEach((p, i) => {
      const opt = Object.assign({}, base, p.k === 'n' ? { superscript: true } : p.k === 'd' ? { subscript: true } : {});
      if (i === 0 && o.bullet) opt.bullet = o.bullet;
      if (i === ps.length - 1 && o.breakLine) opt.breakLine = true;
      out.push({ text: p.k === 's' ? '⁄' : p.t, options: opt });
    });
  });
  return out;
}
/* Give a pptxgenjs slide fractions on every addText. */
export function fracSlide(s) { const add = s.addText.bind(s); s.addText = (t, o) => add(fracRuns(t), o); return s; }

/* ---------------- on screen: a stacked fraction wherever 3/4 appears ---------------- */
const SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|KBD|SAMP|SVG|CANVAS|TITLE|A)$/;
function skip(el) {
  for (let p = el; p && p.nodeType === 1; p = p.parentNode) {
    if (SKIP.test(p.tagName) || p.classList.contains('fr') || p.hasAttribute('data-no-frac') || p.getAttribute('contenteditable') === 'true' || p.isContentEditable) return true;
  }
  return false;
}
function stackText(node) {
  const s = fracNorm(node.nodeValue), ps = pieces(s);
  if (!ps.some((p) => p.k === 'n')) { if (s !== node.nodeValue) node.nodeValue = s; return; }
  const frag = document.createDocumentFragment();
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p.k === 't') { frag.appendChild(document.createTextNode(p.t)); continue; }
    const sp = document.createElement('span'), n = ps[i].t, d = ps[i + 2].t;
    sp.className = 'fr'; sp.setAttribute('role', 'math'); sp.setAttribute('aria-label', fracWords(n + '/' + d));
    const a = document.createElement('span'), b = document.createElement('span'), c = document.createElement('span');
    a.className = 'fr-n'; a.textContent = n; b.className = 'fr-s'; b.textContent = '/'; c.className = 'fr-d'; c.textContent = d;
    sp.appendChild(a); sp.appendChild(b); sp.appendChild(c);
    frag.appendChild(sp); i += 2;
  }
  node.parentNode.replaceChild(frag, node);
}
/* Stack every fraction under an element, now (a page or a slide that has just been drawn). */
export function fractify(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (root.parentNode && HAS.test(root.nodeValue) && !skip(root.parentNode)) stackText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  if (root.nodeType === 1 && skip(root)) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), found = [];
  let n;
  while ((n = tw.nextNode())) if (HAS.test(n.nodeValue) && !skip(n.parentNode)) found.push(n);
  found.forEach(stackText);
}
/* And keep doing it as the page changes. */
export function initFractions(root) {
  root = root || document.body;
  fractify(root);
  const mo = new MutationObserver((list) => {
    list.forEach((m) => {
      if (m.type === 'characterData') { fractify(m.target); return; }
      m.addedNodes.forEach((x) => fractify(x));
    });
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true });
}
