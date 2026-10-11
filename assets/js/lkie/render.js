/* lkie.like drawing: slides (with diagrams drawn exactly from the numbers), key words, activities, the worksheet in
   three tiers, and the teacher notes. Everything is plain HTML and SVG, so it works offline and on old laptops. */
import { esc, icon, normAnswer } from '../core.js?v=b8e2dc0e';
import { TIERS, totalMinutes, sheetBalance } from './model.js?v=b8e2dc0e';
import { objective, yearsLabel, FRAMEWORKS, SUBJECT_BY_ID } from './curriculum.js?v=b8e2dc0e';
import { picURL, creditText, ytThumb, safePic, safeVideo } from '../pics.js?v=b8e2dc0e';
import { lookInfo, lookFor } from './looks.js?v=b8e2dc0e';

/* ---------------- slide kinds ---------------- */
export const KIND = {
  title: { label: 'Today’s lesson', tone: 'blue', icon: 'flag' },
  recap: { label: 'Recap', tone: 'orange', icon: 'history' },
  hook: { label: 'Big question', tone: 'violet', icon: 'spark' },
  vocab: { label: 'Key words', tone: 'teal', icon: 'reading' },
  concept: { label: 'New learning', tone: 'blue', icon: 'bulb' },
  guided: { label: 'Worked example', tone: 'indigo', icon: 'steps' },
  check: { label: 'Check point', tone: 'pink', icon: 'target' },
  independent: { label: 'Your turn', tone: 'green', icon: 'wand' },
  talk: { label: 'Talk time', tone: 'teal', icon: 'chat' },
  plenary: { label: 'Plenary', tone: 'violet', icon: 'star' },
  exit: { label: 'Exit ticket', tone: 'gold', icon: 'check' }
};
export const TONE = {
  blue: ['#3E7CC7', '#2C5E9E', '#EAF1FA'], red: ['#E35D5B', '#B8403E', '#FCECEC'], green: ['#4FA36B', '#357A4D', '#EAF5EE'], teal: ['#2D9C9C', '#1F7676', '#E6F4F4'],
  violet: ['#8466C4', '#6648A8', '#F1EDFA'], orange: ['#F28C38', '#B9621C', '#FDF0E4'], pink: ['#D9628F', '#A8436C', '#FBEAF1'], indigo: ['#4C5FD5', '#3445A8', '#ECEFFC'], gold: ['#E0A526', '#8F6A12', '#FBF3DD']
};
const toneVars = (t) => '--k:var(--' + t + ');--kd:var(--' + t + '-d);--kt:var(--' + t + '-t)';
const RESPOND = {
  online: { chat: 'Type your answer in the chat', vote: 'Vote: type A, B, C or D in the chat', show: 'Hold your work up to the camera', talk: 'Unmute to share, or talk in your breakout room', react: 'Show a thumbs up, sideways or down' },
  class: { chat: 'Write it on your whiteboard', vote: 'Hold up 1, 2, 3 or 4 fingers for A, B, C or D', show: 'Show me on your whiteboard', talk: 'Turn and talk to your partner', react: 'Thumbs up, sideways or down' }
};
const RESPOND_ICON = { chat: 'chat', vote: 'vote', show: 'eye', talk: 'debate', react: 'thumb' };
export const respondText = (r, mode) => (r && r !== 'none' && RESPOND[mode === 'class' ? 'class' : 'online'][r]) || '';
const EDGE = '<div class="sl-edge" aria-hidden="true">' + [['red', 14], ['orange', 17], ['yellow', 11], ['green', 16], ['teal', 12], ['blue', 17], ['violet', 13]].map(([c, w]) => '<i style="--w:' + w + ';--c:var(--' + c + ')"></i>').join('') + '</div>';
export const learnText = (o) => { const t = String(o || '').trim().replace(/^(to|i can)\s+/i, '').replace(/\.$/, ''); return t ? t.charAt(0).toLowerCase() + t.slice(1) : ''; };
/* How many reveal steps a slide has in Present mode. */
export function maxReveal(s) {
  if (s.layout === 'recap' || s.layout === 'exit' || s.layout === 'check' || s.layout === 'independent') return 1;
  if (s.layout === 'guided') return s.steps.length + (s.answer ? 1 : 0);
  return 0;
}

/* ---------------- diagrams (SVG, drawn from the numbers) ---------------- */
const fmt = (v) => Number(Number(v).toFixed(3)).toLocaleString('en-GB');
function wrap(text, max) {
  const out = []; let line = '';
  String(text || '').split(/\s+/).forEach((w) => {
    if (!w) return;
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  });
  if (line) out.push(line);
  return out;
}
const T = (x, y, s, o) => '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 16) + '" fill="' + (o.fill || '#1B2440') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.bold ? ' font-weight="700"' : '') + ' font-family="Century Gothic, Avenir Next, Trebuchet MS, Arial, sans-serif">' + esc(s) + '</text>';
function TL(x, y, lines, o) { return lines.map((l, i) => T(x, y + i * (o.lh || (o.size || 16) * 1.25), l, o)).join(''); }
const svg = (w, h, inner) => '<svg class="lk-dg" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>';
export function diagramSVG(d, tone) {
  if (!d) return '';
  const [k, kd, kt] = TONE[tone] || TONE.blue, ink = '#1B2440', soft = '#4A5468';
  switch (d.type) {
    case 'numberline': {
      const W = 640, H = 150, L = 34, R = W - 34, y = 84, x = (v) => L + (v - d.from) / (d.to - d.from) * (R - L);
      const n = Math.round((d.to - d.from) / d.step);
      let s = '<line x1="' + (L - 14) + '" y1="' + y + '" x2="' + (R + 14) + '" y2="' + y + '" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>';
      const lab = (v, i) => d.label ? Math.abs(((v - d.from) / d.label) - Math.round((v - d.from) / d.label)) < 1e-6 : (n <= 10 || i === 0 || i === n);
      for (let i = 0; i <= n; i++) {
        const v = d.from + i * d.step, big = lab(v, i);
        s += '<line x1="' + x(v) + '" y1="' + (y - (big ? 13 : 8)) + '" x2="' + x(v) + '" y2="' + (y + (big ? 13 : 8)) + '" stroke="' + ink + '" stroke-width="' + (big ? 3 : 2) + '"/>';
        if (big) s += T(x(v), y + 38, fmt(v), { size: 19, bold: true });
      }
      d.highlight.forEach((v) => { s += '<line x1="' + x(v) + '" y1="' + (y - 40) + '" x2="' + x(v) + '" y2="' + (y + 18) + '" stroke="' + kd + '" stroke-width="2.5" stroke-dasharray="6 5"/>' + T(x(v), y - 46, fmt(v), { size: 16, fill: kd }); });
      d.marks.forEach((v) => { s += '<circle cx="' + x(v) + '" cy="' + y + '" r="10" fill="' + k + '" stroke="#fff" stroke-width="3"/>' + T(x(v), y - 20, fmt(v), { size: 20, bold: true, fill: kd }); });
      return svg(W, H, s);
    }
    case 'fractions': {
      const W = 640, H = 128, L = 20, w = (W - 2 * L) / d.parts;
      let s = '';
      for (let i = 0; i < d.parts; i++) s += '<rect x="' + (L + i * w) + '" y="18" width="' + w + '" height="62" fill="' + (i < d.shaded ? k : '#FFFFFF') + '" stroke="' + ink + '" stroke-width="2.5"/>';
      if (d.label) s += T(W / 2, 116, d.label, { size: 26, bold: true, fill: kd });
      return svg(W, H, s);
    }
    case 'placevalue': {
      const c = d.columns.length, cw = Math.min(118, 600 / c), W = 640, L = (W - cw * c) / 2, H = 170;
      let s = '';
      d.columns.forEach((h, i) => {
        s += '<rect x="' + (L + i * cw) + '" y="10" width="' + cw + '" height="44" fill="' + kt + '" stroke="' + ink + '" stroke-width="2"/>' + T(L + i * cw + cw / 2, 40, h, { size: 20, bold: true, fill: kd });
        s += '<rect x="' + (L + i * cw) + '" y="54" width="' + cw + '" height="100" fill="#FFFFFF" stroke="' + ink + '" stroke-width="2"/>' + T(L + i * cw + cw / 2, 121, d.digits[i], { size: 50, bold: true });
        if (i === d.circle) s += '<ellipse cx="' + (L + i * cw + cw / 2) + '" cy="104" rx="' + (cw / 2 - 12) + '" ry="40" fill="none" stroke="' + k + '" stroke-width="5"/>';
      });
      return svg(W, H, s);
    }
    case 'timeline': {
      const W = 640, n = d.events.length, L = 70, R = W - 70, y = 92, H = 210;
      let s = '<line x1="30" y1="' + y + '" x2="' + (W - 30) + '" y2="' + y + '" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/><path d="M' + (W - 30) + ' ' + y + 'l-12 -8v16z" fill="' + ink + '"/>';
      d.events.forEach((e, i) => {
        const x = n === 1 ? W / 2 : L + i * (R - L) / (n - 1);
        s += '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + k + '" stroke="#fff" stroke-width="3"/>' + TL(x, y - 44, wrap(e.when, 12).slice(0, 2), { size: 17, bold: true, fill: kd, lh: 19 }) + TL(x, y + 32, wrap(e.what, n > 4 ? 12 : 16).slice(0, 4), { size: 14, fill: soft, lh: 17 });
      });
      return svg(W, H, s);
    }
    case 'cycle': {
      const W = 640, H = 300, cx = 320, cy = 150, rx = 220, ry = 104, n = d.steps.length;
      const at = (i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), a]; };
      let s = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + kt + '" stroke-width="10"/>';
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / n, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        const tx = -rx * Math.sin(a), ty = ry * Math.cos(a), deg = Math.atan2(ty, tx) * 180 / Math.PI;
        s += '<path d="M-9 -9 L9 0 L-9 9 z" fill="' + k + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')"/>';
      }
      d.steps.forEach((t, i) => {
        const [x, y] = at(i), lines = wrap(t, 16).slice(0, 2), h = lines.length > 1 ? 54 : 38;
        s += '<rect x="' + (x - 82) + '" y="' + (y - h / 2) + '" width="164" height="' + h + '" rx="14" fill="#FFFFFF" stroke="' + k + '" stroke-width="3"/>' + TL(x, y - h / 2 + 24, lines, { size: 15, bold: true, lh: 18 });
      });
      return svg(W, H, s);
    }
    case 'bars': {
      const W = 640, H = 250, n = d.bars.length, max = Math.max.apply(null, d.bars.map((b) => b.value)) || 1, L = 50, R = W - 20, base = 200, top = 40, bw = (R - L) / n;
      let s = (d.title ? T(W / 2, 22, d.title, { size: 17, bold: true }) : '') + '<line x1="' + L + '" y1="' + base + '" x2="' + R + '" y2="' + base + '" stroke="' + ink + '" stroke-width="2.5"/><line x1="' + L + '" y1="' + top + '" x2="' + L + '" y2="' + base + '" stroke="' + ink + '" stroke-width="2.5"/>';
      d.bars.forEach((b, i) => {
        const h = (b.value / max) * (base - top - 10), x = L + i * bw + bw * 0.18, w = bw * 0.64;
        s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" rx="5" fill="' + k + '"/>' + T(x + w / 2, base - h - 8, fmt(b.value), { size: 16, bold: true, fill: kd }) + T(x + w / 2, base + 22, b.label.length > 11 ? b.label.slice(0, 10) + '…' : b.label, { size: 14, fill: soft });
      });
      return svg(W, H, s);
    }
    case 'table': {
      const cols = Math.max(d.head.length, ...d.rows.map((r) => r.length)), W = 640, cw = (W - 20) / cols, rows = (d.head.length ? [d.head] : []).concat(d.rows);
      let y = 10, s = '';
      rows.forEach((r, ri) => {
        const cells = Array.from({ length: cols }, (_, ci) => wrap(r[ci] || '', Math.max(8, Math.floor(cw / 9))).slice(0, 2)), h = Math.max(...cells.map((c) => c.length)) > 1 ? 58 : 40;
        cells.forEach((c, ci) => { s += '<rect x="' + (10 + ci * cw) + '" y="' + y + '" width="' + cw + '" height="' + h + '" fill="' + (ri === 0 && d.head.length ? kt : '#FFFFFF') + '" stroke="' + ink + '" stroke-width="1.5"/>' + TL(10 + ci * cw + cw / 2, y + (c.length > 1 ? 24 : 26), c, { size: 15, bold: ri === 0 && !!d.head.length, fill: ri === 0 && d.head.length ? kd : ink, lh: 18 }); });
        y += h;
      });
      return svg(W, y + 10, s);
    }
    case 'cards': {
      const n = d.items.length, per = n > 3 ? 3 : n, rowsN = Math.ceil(n / per), W = 640, cw = (W - 20 - (per - 1) * 16) / per, ch = 150, H = rowsN * ch + (rowsN - 1) * 16 + 20;
      let s = '';
      d.items.forEach((it, i) => {
        const x = 10 + (i % per) * (cw + 16), y = 10 + Math.floor(i / per) * (ch + 16);
        s += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + ch + '" rx="18" fill="' + kt + '"/>' + T(x + cw / 2, y + 62, it.big, { size: it.big.length > 8 ? 26 : 40, bold: true, fill: kd }) +
          (it.small ? T(x + cw / 2, y + 98, it.small, { size: 17, bold: true }) : '') + (it.note ? T(x + cw / 2, y + 126, it.note.length > 26 ? it.note.slice(0, 25) + '…' : it.note, { size: 14, fill: soft }) : '');
      });
      return svg(W, H, s);
    }
    default: return '';
  }
}

/* ---------------- slides ---------------- */
function vocabFor(p, s) {
  const all = p.vocab || [];
  if (!s.words || !s.words.length) return all.slice(0, 6);
  const by = new Map(all.map((v) => [v.word.toLowerCase(), v]));
  return s.words.map((w) => by.get(w.toLowerCase()) || { word: w, meaning: '' }).slice(0, 6);
}
/* A picture, a video or a diagram fills the right-hand side of a slide. A diagram is exact teaching content, so when a
   slide has a diagram and a picture or video, both show, one above the other. */
const FS_OK = [0.85, 1, 1.15, 1.3];
export function picHTML(pic, cls, eager) {
  pic = safePic(pic);
  if (!pic) return '';
  const src = picURL(pic), alt = esc(pic.alt || pic.page || ''), cr = creditText(pic, true);
  const img = pic.up && !src ? '<img data-up="' + esc(pic.up) + '" alt="' + alt + '" decoding="async">' : '<img src="' + esc(src) + '" alt="' + alt + '" decoding="async"' + (eager ? '' : ' loading="lazy"') + '>';
  return '<figure class="lk-pic' + (pic.fit === 'contain' ? ' fit' : '') + (cls ? ' ' + cls : '') + '">' + img + (cr ? '<figcaption>' + esc(cr) + '</figcaption>' : '') + '</figure>';
}
function videoHTML(v, present) {
  v = safeVideo(v);
  if (!v) return '';
  const name = v.title || 'Video';
  return '<figure class="lk-pic lk-vid"' + (present ? ' data-vid="' + v.id + '" data-start="' + (Number(v.start) || 0) + '"' : '') + '><img src="' + ytThumb(v.id) + '" alt="" decoding="async"' + (present ? '' : ' loading="lazy"') + '>' +
    '<span class="lk-play"' + (present ? ' role="button" tabindex="0" aria-label="Play the video: ' + esc(name) + '"' : ' aria-hidden="true"') + '>' + icon('play') + '</span><figcaption>' + icon('video') + '<span>' + esc(name) + '</span></figcaption></figure>';
}
function visHTML(s, tone, present) {
  const dg = s.diagram ? '<div class="lk-dgw">' + diagramSVG(s.diagram, tone) + '</div>' : '';
  const md = s.video ? videoHTML(s.video, present) : s.pic ? picHTML(s.pic, '', present) : '';
  return dg && md ? '<div class="lk-stack">' + dg + md + '</div>' : dg || md;
}
function bodyHTML(p, s, rv, tone, present) {
  const vis = visHTML(s, tone, present), split = (inner) => (vis ? '<div class="lk-split">' + inner + vis + '</div>' : inner);
  switch (s.layout) {
    case 'title': {
      const sc = p.successCriteria.length ? '<div class="t-sc"><span>Success criteria</span><ul>' + p.successCriteria.map((c) => '<li><i class="box"></i><span>' + esc(c) + '</span></li>').join('') + '</ul></div>' : '';
      const t = '<div class="t-wrap"><p class="t-eyebrow">' + esc(p.input.year) + ' · ' + esc(p.input.subjectName) + '</p><h3 class="t-title">' + esc(p.title) + '</h3>' +
        (p.objective ? '<p class="t-obj"><b>We are learning to</b> ' + esc(learnText(p.objective)) + '</p>' : '') + sc + (p.bigQuestion ? '<p class="lk-bq">' + icon('spark') + '<span>' + esc(p.bigQuestion) + '</span></p>' : '') + '</div>';
      return vis ? '<div class="lk-split lk-tsplit">' + t + vis + '</div>' : t;
    }
    case 'recap': case 'exit':
      return '<div class="' + (vis ? 'lk-split' : '') + '"><ol class="qs' + (s.questions.length > 3 && !vis ? ' two' : '') + '">' + s.questions.map((q, j) => '<li><span class="qn">' + (j + 1) + '</span><span class="qt">' + esc(q.q) + '</span><span class="qa' + (rv ? ' on' : '') + '">' + esc(q.a) + '</span></li>').join('') + '</ol>' + vis + '</div>';
    case 'hook': return '<div class="' + (vis ? 'lk-split' : '') + '"><div><p class="hook-p">' + esc(s.prompt) + '</p>' + (s.detail ? '<p class="hook-d">' + esc(s.detail) + '</p>' : '') + '</div>' + vis + '</div>';
    case 'vocab': return split('<div class="vocab' + (vis ? ' one' : '') + '">' + vocabFor(p, s).map((w) => '<div class="vw"><b>' + esc(w.word) + (w.pinyin ? ' <small>' + esc(w.pinyin) + '</small>' : '') + '</b><span>' + esc(w.meaning) + (w.gloss ? ' · ' + esc(w.gloss) : '') + '</span></div>').join('') + '</div>');
    case 'concept': {
      const ex = s.example ? '<div class="ex-box"><span>Example</span><p>' + esc(s.example) + '</p></div>' : '';
      return '<div class="' + (vis ? 'lk-split' : 'teach' + (s.example ? '' : ' solo')) + '"><div class="lk-col"><ul class="pts">' + s.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' + (vis ? ex : '') + '</div>' + (vis || ex) + '</div>';
    }
    case 'guided':
      return '<div class="' + (vis ? 'lk-split' : '') + '"><div class="lk-col"><div class="prob">' + esc(s.problem) + '</div><ol class="steps">' + s.steps.map((st, j) => '<li class="' + (rv > j ? 'on' : '') + '">' + esc(st) + '</li>').join('') + '</ol>' +
        (s.answer ? '<div class="wans' + (rv > s.steps.length ? ' on' : '') + '">Answer: ' + esc(s.answer) + '</div>' : '') + '</div>' + vis + '</div>';
    case 'check': {
      const inner = '<p class="hq">' + esc(s.question) + '</p><div class="opts' + (vis ? ' one' : '') + '">' + s.options.map((o, j) => '<div class="opt' + (rv ? (j === s.answer ? ' right' : ' dim') : '') + '"><b>' + 'ABCD'[j] + '</b><span>' + esc(o) + '</span></div>').join('') + '</div>' + (rv && s.why ? '<p class="why"><b>Why:</b> ' + esc(s.why) + '</p>' : '');
      return vis ? split('<div class="lk-col">' + inner + '</div>') : inner;
    }
    case 'independent': {
      const inner = '<div class="tiers' + (vis ? ' one' : '') + '">' + [['support', 'Support', 'green', 1], ['core', 'Core', 'orange', 2], ['stretch', 'Stretch', 'red', 3]].map(([k, lab, t, n]) => '<div class="tier" style="' + toneVars(t) + '"><div class="tier-h">' + icon('star').repeat(n) + '<span>' + lab + '</span></div><ul>' + (s[k] || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div>' +
        (rv && s.answers ? '<p class="why lk-ans"><b>Answers:</b> ' + esc(s.answers) + '</p>' : '');
      return vis ? split('<div class="lk-col">' + inner + '</div>') : inner;
    }
    case 'talk': {
      const inner = '<p class="talk-p">' + esc(s.prompt) + '</p>' + (s.starter ? '<div class="sbub">' + esc(s.starter) + '</div>' : '');
      return vis ? split('<div>' + inner + '</div>') : inner;
    }
    case 'plenary': return '<div class="' + (vis ? 'lk-split' : '') + '"><div><ul class="pts">' + s.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' + (s.prompt ? '<p class="lk-reflect">' + icon('chat') + '<span>' + esc(s.prompt) + '</span></p>' : '') + '</div>' + vis + '</div>';
    default: return '';
  }
}
/* What a class moment needs from this slide (moments.js): the check question and its options, or the recap and
   exit questions with their answers, or the prompt. */
export function momentInfo(p, s) {
  const o = { title: s.title || (KIND[s.layout] || KIND.concept).label, lesson: p.title };
  if (s.layout === 'check') Object.assign(o, { q: s.question, opts: s.options, answer: s.answer });
  else if (s.layout === 'recap' || s.layout === 'exit') o.qs = s.questions.map((q) => ({ q: q.q, a: q.a }));
  else if (s.layout === 'hook' || s.layout === 'talk') o.q = s.prompt;
  else if (s.layout === 'plenary' && s.prompt) o.q = s.prompt;
  return o;
}
function respondPill(p, s, rt, present) {
  if (!rt) return '';
  const inner = icon(RESPOND_ICON[s.respond] || 'chat') + '<span>' + esc(rt) + '</span>';
  return present ? '<span class="sl-respond" role="button" tabindex="0" data-moment="' + s.respond + '" data-info="' + esc(JSON.stringify(momentInfo(p, s))) + '" title="Start this moment on the class screen">' + inner + '</span>' : '<span class="sl-respond">' + inner + '</span>';
}
/* o: { reveal, mode, theme (the default look), present } */
export function slideHTML(p, s, i, o) {
  o = o || {};
  const k = KIND[s.layout] || KIND.concept, rt = respondText(s.respond, o.mode), L = lookInfo(lookFor(p, s, o.theme)), fs = FS_OK.includes(s.fs) ? s.fs : 1;
  return '<div class="sl lk-sl lk--' + s.layout + ' ' + L.cls + '" style="' + toneVars(k.tone) + L.style + (fs !== 1 ? ';--ts:' + fs : '') + '"' + (fs !== 1 ? ' data-fs="' + fs + '"' : '') + '>' + L.layer + (L.edge ? EDGE : '') +
    '<div class="sl-head"><span class="sl-kind">' + icon(k.icon) + esc(k.label) + '</span>' + respondPill(p, s, rt, o.present) + '</div>' +
    (s.layout === 'title' ? '' : '<h3 class="sl-title">' + esc(s.title || k.label) + '</h3>') +
    '<div class="sl-body">' + bodyHTML(p, s, o.reveal || 0, k.tone, o.present) + '</div>' +
    '<div class="sl-foot"><span>' + esc(p.input.year) + ' · ' + esc(p.input.subjectName) + ' · ' + esc(p.title) + '</span><span>' + (i + 1) + ' / ' + p.slides.length + '</span></div></div>';
}
export function fitSlide(el) {
  const body = el && el.querySelector('.sl-body');
  if (!body) return;
  let f = Number(el.dataset.fs) || 1;
  el.style.setProperty('--fs', String(f));
  while (body.scrollHeight > body.clientHeight + 1 && f > 0.6) { f = Math.round((f - 0.06) * 100) / 100; el.style.setProperty('--fs', String(f)); }
}
/* What the teacher sees under each thumbnail: what to say, answers, the picture idea and where to find media. */
export function answersOf(s) {
  if (s.layout === 'recap' || s.layout === 'exit') return s.questions.map((q, j) => (j + 1) + '. ' + q.a).join('; ');
  if (s.layout === 'check') return 'ABCD'[s.answer] + ', ' + (s.options[s.answer] || '') + (s.why ? '. ' + s.why : '');
  if (s.layout === 'guided') return s.answer;
  if (s.layout === 'independent') return s.answers;
  return '';
}
/* Pictures and videos are found and added right here, inside lkie.like (the slide editor opens on that tab). */
export function mediaLinks(s, i) {
  return '<button type="button" class="lk-ml" data-media="pic" data-i="' + i + '">' + icon('image') + (s.pic ? 'Change the picture' : 'Find a picture') + '</button>' +
    '<button type="button" class="lk-ml" data-media="video" data-i="' + i + '">' + icon('video') + (s.video ? 'Change the video' : 'Add a video') + '</button>';
}
export function thumbMeta(s, i) {
  const k = KIND[s.layout] || KIND.concept, ans = answersOf(s);
  return '<div class="smeta"><span class="sno">' + (i + 1) + '</span><span class="skind" style="' + toneVars(k.tone) + '">' + esc(k.label) + '</span>' + (s.minutes ? '<span class="smin">' + s.minutes + ' min</span>' : '') + '</div>' +
    (s.say ? '<p class="ssay"><b>Say:</b> ' + esc(s.say) + '</p>' : '') + (ans ? '<p class="sans"><b>Answers:</b> ' + esc(ans) + '</p>' : '') +
    (s.visual ? '<p class="lk-vis">' + icon('eye') + '<span>' + esc(s.visual) + '</span></p>' : '') + '<p class="lk-media">' + mediaLinks(s, i) + '</p>';
}

/* ---------------- key words, activities, notes ---------------- */
export function vocabHTML(p) {
  if (!p.vocab.length) return '<p class="empty">No key words in this pack.</p>';
  return '<div class="lk-words">' + p.vocab.map((v) => '<article class="lk-word"><h3>' + esc(v.word) + (v.pinyin ? ' <small>' + esc(v.pinyin) + '</small>' : '') + '</h3>' + (v.gloss ? '<p class="lk-gloss">' + esc(v.gloss) + '</p>' : '') +
    '<p>' + esc(v.meaning) + '</p>' + (v.example ? '<p class="lk-ex">“' + esc(v.example) + '”</p>' : '') + '</article>').join('') + '</div>';
}
export function activitiesHTML(p) {
  if (!p.activities.length) return '<p class="empty">No extra activities in this pack.</p>';
  return '<div class="lk-acts">' + p.activities.map((a) => '<article class="lk-act"><header><h3>' + esc(a.name) + '</h3><span class="chip">' + a.minutes + ' min</span>' + (a.grouping ? '<span class="chip">' + esc(a.grouping) + '</span>' : '') + '</header>' +
    '<ol>' + a.steps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' + (a.resources ? '<p class="fine"><b>You need:</b> ' + esc(a.resources) + '</p>' : '') + '</article>').join('') + '</div>';
}
export function alignmentHTML(p) {
  const fw = FRAMEWORKS[(SUBJECT_BY_ID[p.input.subject] || {}).fw] || FRAMEWORKS.england;
  if (!p.codes.length) return '<p class="fine">No curriculum statement matched closely, so no code is attached. ' + esc(fw.name) + '.</p>';
  return '<ul class="lk-codes">' + p.codes.map((c) => { const o = objective(c.code); return '<li><b class="mono">' + esc(c.code) + '</b><span>' + esc(o ? o.text : c.text) + '</span><small>' + esc(o ? o.strand + ' · ' + yearsLabel(o) : '') + '</small></li>'; }).join('') + '</ul><p class="fine">' + esc(fw.name) + '. Codes are this site’s own short labels; only codes from the matched list are ever kept.</p>';
}
export function notesHTML(p) {
  const t = p.teacher, L = (xs) => '<ul>' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const bal = p.worksheet ? sheetBalance(p.worksheet) : null;
  return '<div class="plan">' +
    '<section class="psec"><h3>Objective</h3><p>' + esc(p.objective || 'Not set') + '</p>' + (p.successCriteria.length ? '<h4>Success criteria</h4>' + L(p.successCriteria) : '') + (t.overview ? '<h4>Overview</h4><p>' + esc(t.overview) + '</p>' : '') + '</section>' +
    (t.briefing ? '<section class="psec lk-brief"><h3>Your 2-minute briefing</h3><p>' + esc(t.briefing) + '</p><button type="button" class="btn small" data-lk="brief">' + icon('volume') + '<span>Listen</span></button></section>' : '') +
    '<section class="two">' + (t.misconceptions.length ? '<div class="psec"><h3>Watch out for</h3>' + L(t.misconceptions) + '</div>' : '') + (t.assessment ? '<div class="psec"><h3>Assessment for learning</h3><p>' + esc(t.assessment) + '</p></div>' : '') + '</section>' +
    '<section class="two">' + (t.support ? '<div class="psec"><h3>Support</h3><p>' + esc(t.support) + '</p></div>' : '') + (t.stretch ? '<div class="psec"><h3>Stretch</h3><p>' + esc(t.stretch) + '</p></div>' : '') + '</section>' +
    '<section class="psec"><h3>Lesson flow</h3><div class="tbl-wrap"><table><thead><tr><th>Slide</th><th>Part</th><th>Time</th><th>What happens</th></tr></thead><tbody>' +
    p.slides.map((s, i) => '<tr><td class="num">' + (i + 1) + '</td><td>' + esc((KIND[s.layout] || {}).label || s.layout) + '</td><td class="num">' + (s.minutes ? s.minutes + ' min' : '') + '</td><td>' + esc(s.title || '') + '</td></tr>').join('') +
    '</tbody><tfoot><tr><td></td><td>Total</td><td class="num">' + totalMinutes(p) + ' min</td><td></td></tr></tfoot></table></div></section>' +
    '<section class="psec"><h3>Curriculum link</h3>' + alignmentHTML(p) + '</section>' +
    (bal ? '<section class="psec"><h3>Worksheet balance</h3><ul class="lk-bal">' + bal.map((b) => '<li><b>' + esc(b.label) + '</b><span>' + b.n + ' questions · ' + b.types + ' question types · demand ' + b.demand.toFixed(1) + ' of 3</span><i style="--d:' + (b.demand / 3) + '"></i></li>').join('') + '</ul><p class="fine">Demand: recall 1, apply 2, reason 3. Scaffolded should sit lowest and Stretch highest.</p></section>' : '') +
    '</div>';
}

/* ---------------- the worksheet ---------------- */
const LET = 'ABCDEFGH';
function seeded(arrIn, seed) {
  const a = arrIn.map((x, i) => [x, i]);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let i = a.length - 1; i > 0; i--) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; const j = Math.abs(h) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.every((x, i) => x[1] === i) && a.length > 1) a.push(a.shift());     // never leave it in the right order
  return a;
}
function qHTML(q, n, show) {
  const marks = '<span class="ws-m">' + q.marks + (q.marks === 1 ? ' mark' : ' marks') + '</span>';
  const hint = q.hint ? '<p class="ws-hint">' + icon('bulb') + '<span>' + esc(q.hint) + '</span></p>' : '';
  let b = '';
  switch (q.type) {
    case 'mcq': b = '<p class="ws-q">' + esc(q.q) + '</p><div class="ws-opts">' + q.options.map((o, j) => '<button type="button" class="ws-opt' + (show && j === q.answer ? ' right' : '') + '" data-ws="pick" data-ok="' + (j === q.answer ? 1 : 0) + '"><b>' + LET[j] + '</b><span>' + esc(o) + '</span></button>').join('') + '</div>' + (show && q.why ? '<p class="ws-a">' + esc(q.why) + '</p>' : ''); break;
    case 'short': b = '<p class="ws-q">' + esc(q.q) + '</p><div class="ws-lines"><i></i><i></i></div>' + (show ? '<p class="ws-a">' + esc(q.answer) + '</p>' : ''); break;
    case 'fill': {
      let k = 0;
      b = '<p class="ws-q ws-fill">' + q.text.split('___').map((part, j, all) => esc(part) + (j < all.length - 1 ? '<input class="ws-gap" data-ans="' + esc(q.answers[k++]) + '" aria-label="Gap ' + (k) + '" autocomplete="off" spellcheck="false"' + (show ? ' value="' + esc(q.answers[k - 1]) + '"' : '') + '>' : '')).join('') + '</p>' +
        (q.bank.length ? '<p class="ws-bank"><span>Word bank:</span>' + q.bank.map((w) => '<em>' + esc(w) + '</em>').join('') + '</p>' : '');
      break;
    }
    case 'truefalse': b = '<p class="ws-q">' + esc(q.statement) + '</p><div class="ws-opts tf">' + [[true, 'True'], [false, 'False']].map(([v, l]) => '<button type="button" class="ws-opt' + (show && v === q.answer ? ' right' : '') + '" data-ws="pick" data-ok="' + (v === q.answer ? 1 : 0) + '"><span>' + l + '</span></button>').join('') + '</div><p class="ws-sub">Because…</p><div class="ws-lines"><i></i></div>' + (show && q.because ? '<p class="ws-a">' + esc(q.because) + '</p>' : ''); break;
    case 'order': {
      const mixed = seeded(q.items, q.q + q.items.join('|'));
      b = '<p class="ws-q">' + esc(q.q) + '</p><ol class="ws-order">' + mixed.map(([t, i]) => '<li><span class="ws-box">' + (show ? i + 1 : '') + '</span><span>' + esc(t) + '</span></li>').join('') + '</ol>'; break;
    }
    case 'match': {
      const right = seeded(q.pairs.map((p) => p[1]), q.q + q.pairs.join('|'));
      b = '<p class="ws-q">' + esc(q.q) + '</p><div class="ws-match"><ol>' + q.pairs.map((p) => '<li><span>' + esc(p[0]) + '</span><span class="ws-box">' + (show ? LET[right.findIndex((r) => r[1] === q.pairs.indexOf(p))] : '') + '</span></li>').join('') + '</ol><ol class="abc">' + right.map(([t], j) => '<li><b>' + LET[j] + '</b><span>' + esc(t) + '</span></li>').join('') + '</ol></div>'; break;
    }
    case 'odd': b = '<p class="ws-q">' + esc(q.q) + '</p><div class="ws-opts odd">' + q.items.map((o, j) => '<button type="button" class="ws-opt' + (show && j === q.answer ? ' right' : '') + '" data-ws="pick" data-ok="' + (j === q.answer ? 1 : 0) + '"><span>' + esc(o) + '</span></button>').join('') + '</div><p class="ws-sub">Why?</p><div class="ws-lines"><i></i></div>' + (show && q.why ? '<p class="ws-a">' + esc(q.why) + '</p>' : ''); break;
    case 'spot': b = '<p class="ws-q">' + esc(q.q) + '</p><div class="ws-work">' + esc(q.work) + '</div><p class="ws-sub">The mistake:</p><div class="ws-lines"><i></i></div><p class="ws-sub">Correct it:</p><div class="ws-lines"><i></i></div>' + (show ? '<p class="ws-a">' + esc(q.mistake ? q.mistake + ' ' : '') + esc(q.fix) + '</p>' : ''); break;
    case 'sort': {
      const mixed = seeded(q.items, q.q + q.items.map((x) => x.text).join('|'));
      b = '<p class="ws-q">' + esc(q.q) + '</p><p class="ws-bank">' + mixed.map(([x]) => '<em>' + esc(x.text) + '</em>').join('') + '</p><div class="ws-groups" style="--n:' + q.groups.length + '">' + q.groups.map((g, gi) => '<div><b>' + esc(g) + '</b>' + (show ? '<p>' + q.items.filter((x) => x.group === gi).map((x) => esc(x.text)).join(', ') + '</p>' : '<p class="ws-empty"></p>') + '</div>').join('') + '</div>'; break;
    }
    default: b = '';
  }
  return '<li class="ws-item wsq-' + q.type + '" data-skill="' + q.skill + '"><div class="ws-top"><span class="ws-n">' + n + '</span>' + marks + '</div>' + b + hint + '</li>';
}
export function sheetHTML(p, tier, show) {
  const w = p.worksheet;
  if (!w) return '';
  const qs = w[tier] || [], label = (TIERS.find((t) => t[0] === tier) || [tier, tier])[1];
  const total = qs.reduce((a, q) => a + q.marks, 0);
  return '<div class="ws" data-ws-tier="' + tier + '"><header class="ws-head"><div><p class="ws-k">' + esc(p.input.year) + ' · ' + esc(p.input.subjectName) + ' · ' + esc(label) + '</p><h3>' + esc(w.title || p.title) + '</h3>' + (w.instructions ? '<p>' + esc(w.instructions) + '</p>' : '') + '</div>' +
    '<div class="ws-name"><span>Name</span><i></i><span>Date</span><i></i></div></header><ol class="ws-list">' + qs.map((q, i) => qHTML(q, i + 1, show)).join('') + '</ol><p class="ws-total">Total: ' + total + ' marks</p></div>';
}
/* Pupils can try mcq, true/false, odd one out and gap questions on screen: they mark themselves. */
export function wireSheet(host) {
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ws="pick"]');
    if (!b) return;
    const box = b.parentElement;
    box.querySelectorAll('.ws-opt').forEach((x) => x.classList.remove('picked', 'yes', 'no'));
    b.classList.add('picked', b.dataset.ok === '1' ? 'yes' : 'no');
  });
  host.addEventListener('change', (e) => {
    const g = e.target.closest('.ws-gap');
    if (!g) return;
    const ok = normAnswer(g.value) === normAnswer(g.dataset.ans);
    g.classList.toggle('yes', !!g.value && ok); g.classList.toggle('no', !!g.value && !ok);
  });
}
