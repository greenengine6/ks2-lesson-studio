/* lkie.like exports: a PowerPoint deck (opens in PowerPoint, Keynote and Google Slides, and saves as PDF from any of
   them) with the diagrams, pictures, backgrounds and text sizes as on screen, each video as its picture with a link,
   and the teacher notes and picture credits in the speaker notes; and the worksheet as an editable Word document
   (opens in Word and Google Docs). */
import { esc } from '../core.js?v=3c9d4698';
import { fracSlide, fracHTML } from '../fractions.js?v=3c9d4698';
import { KIND, TONE, diagramSVG, answersOf, learnText, respondText } from './render.js?v=3c9d4698';
import { TIERS } from './model.js?v=3c9d4698';
import { lookFor, lookInfo, lookForPptx } from './looks.js?v=3c9d4698';
import { pictureData, urlData, creditText, safePic, safeVideo, ytThumb, ytWatch, ytShort } from '../pics.js?v=3c9d4698';

/* ---------------- diagrams as pictures ---------------- */
export function svgSize(svg) { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); return m ? [Number(m[1]), Number(m[2])] : [640, 200]; }
export function rasterize(svg, scale) {
  return new Promise((resolve) => {
    const [w, h] = svgSize(svg), k = scale || 2, img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        resolve({ data: c.toDataURL('image/png'), w, h });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="' + w + '" height="' + h + '" '));
  });
}

/* ---------------- PowerPoint ---------------- */
/* Free text takes the look's colours (white on dark backgrounds); text inside boxes stays dark, as on screen. */
const W = 13.333, FONT = 'Century Gothic', BINK = '1B2440', BSOFT = '4A5468';
const LIGHT = { ink: '1B2440', soft: '4A5468', faint: '7A849A', ok: '357A4D', eyebrow: '2C5E9E', bq: '6648A8' };
const DARK = { ink: 'F5F7FB', soft: 'CDD5E3', faint: '9AA6BC', ok: '86E0A6', eyebrow: '9CC3FF', bq: 'CDBBFF' };
let C = LIGHT, FS = 1;
const F = (n) => Math.round(n * FS * 2) / 2;
const hex = (c) => c.replace('#', '');
const bullets = (xs, color) => xs.map((x, j) => ({ text: x, options: { bullet: true, breakLine: j < xs.length - 1, color: color || C.ink } }));
function chrome(s, p, sl, i, mode, edge, titleOverride) {
  const k = KIND[sl.layout] || KIND.concept, t = TONE[k.tone];
  if (edge) [['E35D5B', 14], ['F28C38', 17], ['F2C14E', 11], ['4FA36B', 16], ['2D9C9C', 12], ['3E7CC7', 17], ['8466C4', 13]].reduce((x, [c, w]) => { const ww = W * w / 100; s.addShape('rect', { x, y: 0, w: ww - 0.03, h: 0.1, fill: { color: c }, line: { color: c, width: 0 } }); return x + ww; }, 0);
  s.addText(k.label.toUpperCase(), { x: 0.5, y: 0.3, w: 3.6, h: 0.42, shape: 'roundRect', rectRadius: 0.2, fill: { color: hex(t[2]) }, color: hex(t[1]), bold: true, fontFace: FONT, fontSize: 12, charSpacing: 2, align: 'center', valign: 'middle', margin: 0 });
  const rt = respondText(sl.respond, mode);
  if (rt) s.addText(rt, { x: W - 5.6, y: 0.3, w: 5.1, h: 0.42, shape: 'roundRect', rectRadius: 0.2, fill: { color: hex(t[1]) }, color: 'FFFFFF', bold: true, fontFace: FONT, fontSize: 12, align: 'center', valign: 'middle', margin: 0, fit: 'shrink' });
  if (sl.layout !== 'title' || titleOverride) s.addText(titleOverride || sl.title || k.label, { x: 0.5, y: 0.9, w: W - 1, h: 0.8, fontFace: FONT, fontSize: Math.round(30 * FS), bold: true, color: C.ink, valign: 'middle', fit: 'shrink', margin: 0 });
  s.addText(p.input.year + ' · ' + p.input.subjectName + ' · ' + p.title, { x: 0.5, y: 7.02, w: W - 2.5, h: 0.3, fontFace: FONT, fontSize: 10, color: C.faint, margin: 0 });
  s.addText((i + 1) + ' / ' + p.slides.length, { x: W - 1.5, y: 7.02, w: 1, h: 0.3, fontFace: FONT, fontSize: 10, color: C.faint, align: 'right', margin: 0 });
  return t;
}
function questions(s, sl, t, withAnswers, narrow) {
  const two = sl.questions.length > 3 && !narrow, step = two ? 1.6 : narrow ? Math.min(1.3, 4.9 / sl.questions.length) : 1.3;
  sl.questions.forEach((q, j) => {
    const col = two ? j % 2 : 0, row = two ? Math.floor(j / 2) : j, x = 0.6 + col * 6.2, y = 2.0 + row * step, w = two ? 5.9 : narrow ? 6.6 : W - 1.2;
    s.addText(String(j + 1), { x, y, w: 0.5, h: 0.5, shape: 'ellipse', fill: { color: hex(t[0]) }, color: 'FFFFFF', bold: true, fontFace: FONT, fontSize: 16, align: 'center', valign: 'middle', margin: 0 });
    s.addText(q.q, { x: x + 0.7, y: y - 0.05, w: w - 0.75, h: 0.62, fontFace: FONT, fontSize: F(20), bold: true, color: C.ink, valign: 'middle', fit: 'shrink', margin: 0 });
    if (withAnswers) s.addText([{ text: 'Answer: ', options: { color: C.soft } }, { text: q.a, options: { bold: true, color: C.ok } }], { x: x + 0.7, y: y + 0.6, w: w - 0.75, h: 0.45, fontFace: FONT, fontSize: F(17), margin: 0, fit: 'shrink' });
  });
}
function check(s, sl, t, withAnswer, narrow) {
  s.addText(sl.question, { x: 0.6, y: 1.9, w: narrow ? 6.6 : W - 1.2, h: 0.95, fontFace: FONT, fontSize: F(narrow ? 22 : 24), bold: true, color: C.ink, valign: 'top', fit: 'shrink', margin: 0 });
  sl.options.forEach((o, j) => {
    const x = narrow ? 0.6 : 0.6 + (j % 2) * 6.2, y = narrow ? 3.0 + j * 0.93 : 3.0 + Math.floor(j / 2) * 1.5, w = narrow ? 6.6 : 5.9, h = narrow ? 0.85 : 1.3, d = narrow ? 0.5 : 0.6;
    const right = withAnswer && j === sl.answer, dim = withAnswer && j !== sl.answer;
    s.addShape('roundRect', { x, y, w, h, rectRadius: 0.15, fill: { color: right ? 'EAF5EE' : hex(t[2]), transparency: dim ? 55 : 0 }, line: { color: right ? '4FA36B' : hex(t[2]), width: right ? 2.5 : 0.5 } });
    s.addText('ABCD'[j], { x: x + 0.22, y: y + (h - d) / 2, w: d, h: d, shape: 'ellipse', fill: { color: right ? '357A4D' : hex(t[0]) }, color: 'FFFFFF', bold: true, fontFace: FONT, fontSize: narrow ? 15 : 18, align: 'center', valign: 'middle', margin: 0 });
    s.addText(o, { x: x + d + 0.45, y: y + 0.05, w: w - d - 0.65, h: h - 0.1, fontFace: FONT, fontSize: F(narrow ? 17 : 20), bold: true, color: dim ? '9AA3B5' : BINK, valign: 'middle', fit: 'shrink', margin: 0 });
  });
  if (withAnswer && sl.why) s.addText([{ text: 'Why: ', options: { bold: true, color: C.ok } }, { text: sl.why, options: { color: C.soft } }], { x: 0.6, y: 6.15, w: W - 1.2, h: 0.65, fontFace: FONT, fontSize: 15, valign: 'top', fit: 'shrink', margin: 0 });
}
function placeImage(s, img, box, extra) {
  if (!img) return null;
  const r = Math.min(box.w / img.w, box.h / img.h), w = img.w * r, h = img.h * r, x = box.x + (box.w - w) / 2, y = box.y + (box.h - h) / 2;
  s.addImage(Object.assign({ data: img.data, x, y, w, h }, extra || {}));
  return { x, y, w, h };
}
/* The right-hand side: a diagram, a picture or a video (a diagram and a picture or video share it, one above the other). */
async function drawRight(s, vis, box, t) {
  if (!vis.dg && !vis.md) return;
  const both = vis.dg && vis.md, half = (box.h - 0.15) / 2;
  if (vis.dg) placeImage(s, vis.dg, both ? { x: box.x, y: box.y, w: box.w, h: half } : box);
  if (vis.md) await drawMedia(s, vis.md, both ? { x: box.x, y: box.y + half + 0.15, w: box.w, h: half } : box, t);
}
async function drawMedia(s, md, box, t) {
  if (md.kind === 'pic') {
    const pic = md.pic, img = await pictureData(pic, { cover: pic.fit !== 'contain', aspect: box.w / box.h, max: 1600 });
    if (!img) {
      s.addShape('roundRect', { x: box.x, y: box.y, w: box.w, h: box.h, rectRadius: 0.15, fill: { color: hex(t[2]) }, line: { color: hex(t[2]), width: 0.5 } });
      s.addText((pic.page || pic.alt || 'Picture') + (pic.url ? '\n' + pic.url : ''), { x: box.x + 0.2, y: box.y + 0.2, w: box.w - 0.4, h: box.h - 0.4, fontFace: FONT, fontSize: 12, color: BSOFT, align: 'center', valign: 'middle', fit: 'shrink', margin: 0 });
      return;
    }
    const r = placeImage(s, img, box, { altText: pic.alt || pic.page || '' }), cr = creditText(pic, true);
    if (cr && r) s.addText(cr, { x: r.x, y: r.y + r.h - 0.28, w: r.w, h: 0.28, fontFace: FONT, fontSize: 8, color: 'FFFFFF', fill: { color: '000000', transparency: 45 }, align: 'right', valign: 'middle', margin: 0.04, fit: 'shrink' });
    return;
  }
  const v = md.v, url = ytShort(v), link = { hyperlink: { url, tooltip: 'Watch on YouTube' } };
  const img = await urlData(ytThumb(v.id), { cover: true, aspect: box.w / box.h, max: 1280 });
  if (!img || !placeImage(s, img, box, link)) s.addShape('roundRect', { x: box.x, y: box.y, w: box.w, h: box.h, rectRadius: 0.15, fill: { color: '1B2440' }, line: { color: '1B2440', width: 0.5 } });
  const d = Math.min(1.1, box.h * 0.32);
  s.addShape('ellipse', { x: box.x + (box.w - d) / 2, y: box.y + (box.h - d) / 2, w: d, h: d, fill: { color: 'E5484D' }, line: { color: 'FFFFFF', width: 2 } });
  s.addShape('triangle', { x: box.x + (box.w - d * 0.42) / 2 + d * 0.05, y: box.y + (box.h - d * 0.42) / 2, w: d * 0.42, h: d * 0.42, rotate: 90, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 } });
  s.addText([{ text: '▶ Watch: ' + (v.title || 'the video') + ' (YouTube)', options: { hyperlink: { url, tooltip: 'Opens YouTube' } } }], { x: box.x, y: box.y + box.h + 0.04, w: box.w, h: 0.3, fontFace: FONT, fontSize: 10, color: C.ink, align: 'center', valign: 'middle', fit: 'shrink', margin: 0 });
}
async function body(s, p, sl, t, vis) {
  const has = !!(vis.dg || vis.md), right = { x: 7.6, y: 2.0, w: 5.2, h: 4.6 }, LW = has ? 6.7 : W - 1.2;
  switch (sl.layout) {
    case 'title': {
      const w = has ? 6.5 : W - 1.6;
      s.addText((p.input.year + ' · ' + p.input.subjectName).toUpperCase(), { x: 0.8, y: 1.05, w, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: C.eyebrow, charSpacing: 3, margin: 0 });
      s.addText(p.title, { x: 0.8, y: 1.5, w, h: 1.3, fontFace: FONT, fontSize: F(has ? 36 : 42), bold: true, color: C.ink, valign: 'top', fit: 'shrink', margin: 0 });
      if (p.objective) s.addText([{ text: 'We are learning to ', options: { bold: true, color: C.ink } }, { text: learnText(p.objective), options: { color: C.soft } }], { x: 0.8, y: 2.9, w, h: 0.75, fontFace: FONT, fontSize: F(20), valign: 'top', fit: 'shrink', margin: 0 });
      if (p.successCriteria.length) {
        s.addShape('roundRect', { x: 0.8, y: 3.8, w, h: 2.2, rectRadius: 0.15, fill: { color: 'EAF1FA' }, line: { color: 'EAF1FA', width: 0.5 } });
        s.addText('SUCCESS CRITERIA', { x: 1.1, y: 3.95, w: 6, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: '2C5E9E', charSpacing: 2, margin: 0 });
        s.addText(bullets(p.successCriteria, BINK), { x: 1.1, y: 4.4, w: w - 0.6, h: 1.5, fontFace: FONT, fontSize: F(18), valign: 'top', paraSpaceAfter: 5, fit: 'shrink', margin: 0 });
      }
      if (p.bigQuestion) s.addText('Big question: ' + p.bigQuestion, { x: 0.8, y: 6.2, w, h: 0.6, fontFace: FONT, fontSize: F(17), bold: true, color: C.bq, valign: 'middle', fit: 'shrink', margin: 0 });
      if (has) await drawRight(s, vis, { x: 7.75, y: 1.1, w: 5.0, h: 5.6 }, t);
      break;
    }
    case 'recap': case 'exit': questions(s, sl, t, false, has); await drawRight(s, vis, right, t); break;
    case 'hook': {
      s.addShape('roundRect', { x: 0.6, y: 2.0, w: LW, h: 3.0, rectRadius: 0.2, fill: { color: hex(t[2]) }, line: { color: hex(t[2]), width: 0.5 } });
      s.addText(sl.prompt, { x: 0.9, y: 2.15, w: LW - 0.6, h: 2.7, fontFace: FONT, fontSize: F(28), bold: true, color: BINK, valign: 'middle', fit: 'shrink', margin: 0 });
      if (sl.detail) s.addText(sl.detail, { x: 0.6, y: 5.25, w: LW, h: 0.8, fontFace: FONT, fontSize: F(19), color: C.soft, valign: 'top', fit: 'shrink', margin: 0 });
      await drawRight(s, vis, right, t);
      break;
    }
    case 'vocab': {
      const by = new Map(p.vocab.map((v) => [v.word.toLowerCase(), v]));
      const words = (sl.words && sl.words.length ? sl.words.map((w) => by.get(w.toLowerCase()) || { word: w, meaning: '' }) : p.vocab).slice(0, has ? 5 : 6);
      words.forEach((v, j) => {
        const x = has ? 0.6 : 0.6 + (j % 2) * 6.2, y = has ? 1.95 + j * 1.0 : 1.95 + Math.floor(j / 2) * 1.6, w = has ? 6.6 : 5.9, h = has ? 0.92 : 1.42;
        s.addShape('roundRect', { x, y, w, h, rectRadius: 0.15, fill: { color: hex(t[2]) }, line: { color: hex(t[2]), width: 0.5 } });
        s.addText([{ text: v.word + (v.pinyin ? '  ' + v.pinyin : ''), options: { bold: true, color: hex(t[1]), fontSize: F(has ? 18 : 21), breakLine: true } }, { text: v.meaning + (v.gloss ? ' · ' + v.gloss : ''), options: { color: BSOFT, fontSize: F(has ? 13 : 15) } }], { x: x + 0.25, y: y + 0.06, w: w - 0.5, h: h - 0.12, fontFace: FONT, valign: 'middle', fit: 'shrink', margin: 0 });
      });
      await drawRight(s, vis, right, t);
      break;
    }
    case 'concept': {
      const w = has || sl.example ? 6.7 : W - 1.2;
      s.addText(bullets(sl.points), { x: 0.6, y: 2.0, w, h: has && sl.example ? 3.0 : 4.5, fontFace: FONT, fontSize: F(22), valign: 'top', paraSpaceAfter: 10, fit: 'shrink', margin: 0 });
      if (has) {
        await drawRight(s, vis, right, t);
        if (sl.example) s.addText([{ text: 'Example: ', options: { bold: true, color: hex(t[1]) } }, { text: sl.example, options: { color: BINK } }], { x: 0.6, y: 5.2, w, h: 1.4, fontFace: FONT, fontSize: F(17), valign: 'top', fit: 'shrink', margin: 0.1, fill: { color: hex(t[2]) } });
      } else if (sl.example) {
        s.addShape('roundRect', { x: right.x, y: 2.0, w: right.w, h: 4.2, rectRadius: 0.18, fill: { color: hex(t[2]) }, line: { color: hex(t[2]), width: 0.5 } });
        s.addText('EXAMPLE', { x: right.x + 0.3, y: 2.2, w: 4, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: hex(t[1]), charSpacing: 2, margin: 0 });
        s.addText(sl.example, { x: right.x + 0.3, y: 2.7, w: right.w - 0.6, h: 3.3, fontFace: FONT, fontSize: F(20), bold: true, color: BINK, valign: 'top', fit: 'shrink', margin: 0 });
      }
      break;
    }
    case 'guided': {
      s.addShape('roundRect', { x: 0.6, y: 1.95, w: LW, h: 1.0, rectRadius: 0.15, fill: { color: hex(t[2]) }, line: { color: hex(t[2]), width: 0.5 } });
      s.addText(sl.problem, { x: 0.85, y: 2.0, w: LW - 0.5, h: 0.9, fontFace: FONT, fontSize: F(21), bold: true, color: BINK, valign: 'middle', fit: 'shrink', margin: 0 });
      s.addText(sl.steps.map((st, j) => ({ text: st, options: { bullet: { type: 'number' }, breakLine: j < sl.steps.length - 1 } })), { x: 0.6, y: 3.2, w: LW, h: 2.8, fontFace: FONT, fontSize: F(19), color: C.ink, valign: 'top', paraSpaceAfter: 8, fit: 'shrink', margin: 0 });
      if (sl.answer) s.addText([{ text: 'Answer: ', options: { bold: true, color: C.ok } }, { text: sl.answer, options: { bold: true, color: C.ink } }], { x: 0.6, y: 6.15, w: LW, h: 0.55, fontFace: FONT, fontSize: F(19), margin: 0, fit: 'shrink' });
      await drawRight(s, vis, right, t);
      break;
    }
    case 'check': check(s, sl, t, false, has); await drawRight(s, vis, right, t); break;
    case 'independent':
      [['support', 'SUPPORT', 'green'], ['core', 'CORE', 'orange'], ['stretch', 'STRETCH', 'red']].forEach(([k, lab, tn], j) => {
        const c = TONE[tn], x = has ? 0.6 : 0.6 + j * 4.13, y = has ? 1.95 + j * 1.6 : 1.95, w = has ? 6.6 : 3.93, h = has ? 1.5 : 4.75;
        s.addShape('roundRect', { x, y, w, h, rectRadius: 0.15, fill: { color: hex(c[2]) }, line: { color: hex(c[2]), width: 0.5 } });
        s.addText(lab, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: hex(c[1]), charSpacing: 2, margin: 0 });
        s.addText(bullets(sl[k] || [], BINK), { x: x + 0.2, y: y + (has ? 0.5 : 0.7), w: w - 0.4, h: h - (has ? 0.6 : 0.85), fontFace: FONT, fontSize: F(has ? 14 : 16), valign: 'top', paraSpaceAfter: 6, fit: 'shrink', margin: 0 });
      });
      await drawRight(s, vis, right, t);
      break;
    case 'talk':
      s.addText(sl.prompt, { x: 0.6, y: 2.0, w: LW, h: 2.3, fontFace: FONT, fontSize: F(28), bold: true, color: C.ink, valign: 'top', fit: 'shrink', margin: 0 });
      if (sl.starter) s.addText(sl.starter, { x: 0.6, y: 4.6, w: Math.min(LW, 1.4 + sl.starter.length * 0.17), h: 0.9, shape: 'roundRect', rectRadius: 0.3, fill: { color: hex(t[2]) }, color: hex(t[1]), bold: true, fontFace: FONT, fontSize: F(22), align: 'center', valign: 'middle', margin: 0, fit: 'shrink' });
      await drawRight(s, vis, right, t);
      break;
    case 'plenary': {
      s.addText(bullets(sl.points), { x: 0.6, y: 2.0, w: LW, h: 3.2, fontFace: FONT, fontSize: F(22), valign: 'top', paraSpaceAfter: 10, fit: 'shrink', margin: 0 });
      if (sl.prompt) s.addText(sl.prompt, { x: 0.6, y: 5.4, w: LW, h: 1.0, fontFace: FONT, fontSize: F(20), bold: true, color: hex(t[1]), valign: 'middle', fit: 'shrink', margin: 0.1, fill: { color: hex(t[2]) } });
      await drawRight(s, vis, right, t);
      break;
    }
    default: break;
  }
}
function notes(p, sl, first) {
  const out = [];
  if (sl.say) out.push('SAY: ' + sl.say);
  const a = answersOf(sl);
  if (a) out.push('ANSWERS: ' + a);
  if (sl.visual) out.push('PICTURE IDEA: ' + sl.visual);
  if (safePic(sl.pic)) out.push(creditText(sl.pic, false));
  if (safeVideo(sl.video)) out.push('VIDEO: ' + (sl.video.title || 'YouTube video') + ', ' + ytWatch(sl.video));
  const bg = sl.look && sl.look.pic ? sl.look.pic : p.look && p.look.pic ? p.look.pic : null;
  if (safePic(bg)) out.push('Background ' + creditText(bg, false).charAt(0).toLowerCase() + creditText(bg, false).slice(1));
  if (first) {
    const t = p.teacher;
    out.push('', 'LESSON PLAN', 'Objective: ' + p.objective);
    if (p.successCriteria.length) out.push('Success criteria: ' + p.successCriteria.join(' | '));
    if (p.codes.length) out.push('Curriculum: ' + p.codes.map((c) => c.code + ' ' + c.text).join(' | '));
    if (t.overview) out.push('Overview: ' + t.overview);
    if (t.misconceptions.length) out.push('Watch out for: ' + t.misconceptions.join(' | '));
    if (t.support) out.push('Support: ' + t.support);
    if (t.stretch) out.push('Stretch: ' + t.stretch);
    if (t.assessment) out.push('Assessment: ' + t.assessment);
  }
  return out.join('\n');
}
/* A painted or picture background is stored once, in a slide master, and every slide with that look uses it. */
function slideFor(pptx, bg, masters) {
  if (!bg.data) { const s = fracSlide(pptx.addSlide()); s.background = { color: bg.color || 'FFFFFF' }; return s; }
  let name = masters.get(bg.data);
  if (!name) {
    name = 'LOOK ' + (masters.size + 1);
    pptx.defineSlideMaster({ title: name, background: { color: bg.dark ? '1B2440' : 'FFFFFF' }, objects: [{ image: { x: 0, y: 0, w: W, h: 7.5, data: bg.data } }] });
    masters.set(bg.data, name);
  }
  return fracSlide(pptx.addSlide({ masterName: name }));
}
/* o: { theme (the default look), mode } */
export async function buildPptx(p, o) {
  o = o || {};
  const pptx = new window.PptxGenJS(), memo = new Map(), masters = new Map();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'lkie.like · KS2 Lesson Engine'; pptx.title = p.title; pptx.subject = p.input.year + ' ' + p.input.subjectName;
  try {
    for (let i = 0; i < p.slides.length; i++) {
      const sl = p.slides[i], k = KIND[sl.layout] || KIND.concept, look = lookFor(p, sl, o.theme), L = lookInfo(look), bg = await lookForPptx(look, memo);
      const dg = sl.diagram ? await rasterize(diagramSVG(sl.diagram, k.tone), 2) : null;
      const md = safeVideo(sl.video) ? { kind: 'video', v: sl.video } : safePic(sl.pic) ? { kind: 'pic', pic: sl.pic } : null;
      C = bg.dark ? DARK : LIGHT; FS = [0.85, 1, 1.15, 1.3].includes(sl.fs) ? sl.fs : 1;
      const s = slideFor(pptx, bg, masters);
      const t = chrome(s, p, sl, i, o.mode, L.edge);
      await body(s, p, sl, t, { dg, md });
      s.addNotes(notes(p, sl, i === 0));
      if (['recap', 'exit', 'check'].includes(sl.layout)) {
        const a = slideFor(pptx, bg, masters);
        const ta = chrome(a, p, Object.assign({}, sl, { respond: 'none' }), i, o.mode, L.edge, 'Answers: ' + (sl.title || k.label));
        if (sl.layout === 'check') check(a, sl, ta, true, false); else questions(a, sl, ta, true, false);
        a.addNotes('Answer slide. ' + notes(p, sl, false));
      }
    }
  } finally { C = LIGHT; FS = 1; }
  return pptx.write({ outputType: 'blob' });
}
export const fileName = (p, ext) => (p.input.year + ' ' + p.input.subjectName + ' - ' + p.title).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110) + ext;

/* ---------------- the worksheet as an editable Word document ---------------- */
const LINE = '<p style="margin:2pt 0 8pt;border-bottom:1px solid #9AA3B5">&nbsp;</p>';
function wq(q, n) {
  const head = '<p style="margin:12pt 0 4pt"><b>' + n + '.</b> ';
  const marks = ' <span style="color:#7A849A">(' + q.marks + (q.marks === 1 ? ' mark' : ' marks') + ')</span>';
  const hint = q.hint ? '<p style="margin:0 0 6pt;color:#4A5468"><i>Hint: ' + esc(q.hint) + '</i></p>' : '';
  switch (q.type) {
    case 'mcq': return head + esc(q.q) + marks + '</p>' + q.options.map((o, j) => '<p style="margin:0 0 2pt 18pt">☐ ' + 'ABCDE'[j] + '  ' + esc(o) + '</p>').join('') + hint;
    case 'short': return head + esc(q.q) + marks + '</p>' + LINE + LINE + hint;
    case 'fill': return head + esc(q.text).split('___').join('<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>') + marks + '</p>' + (q.bank.length ? '<p style="margin:0 0 6pt 18pt;color:#4A5468">Word bank: ' + q.bank.map(esc).join(' · ') + '</p>' : '') + hint;
    case 'truefalse': return head + esc(q.statement) + marks + '</p><p style="margin:0 0 2pt 18pt">☐ True&nbsp;&nbsp;&nbsp;&nbsp;☐ False</p><p style="margin:4pt 0 0 18pt">Because:</p>' + LINE + hint;
    case 'order': return head + esc(q.q) + marks + '</p>' + shuffle(q.items, q.q).map(([t]) => '<p style="margin:0 0 2pt 18pt">☐ ' + esc(t) + '</p>').join('') + hint;
    case 'match': {
      const r = shuffle(q.pairs.map((x) => x[1]), q.q);
      return head + esc(q.q) + marks + '</p><table style="border-collapse:collapse;margin-left:18pt">' + q.pairs.map((x, j) => '<tr><td style="padding:3pt 18pt 3pt 0">' + (j + 1) + '. ' + esc(x[0]) + '</td><td style="padding:3pt 18pt">____</td><td style="padding:3pt 0">' + 'ABCDEF'[j] + '. ' + esc(r[j][0]) + '</td></tr>').join('') + '</table>' + hint;
    }
    case 'odd': return head + esc(q.q) + marks + '</p><p style="margin:0 0 2pt 18pt">' + q.items.map(esc).join(' &nbsp;·&nbsp; ') + '</p><p style="margin:4pt 0 0 18pt">Odd one out: ________ Why?</p>' + LINE + hint;
    case 'spot': return head + esc(q.q) + marks + '</p><p style="margin:0 0 4pt 18pt;padding:6pt;border:1px solid #CBD2E0;background:#F6F8FC">' + esc(q.work) + '</p><p style="margin:4pt 0 0 18pt">The mistake:</p>' + LINE + '<p style="margin:4pt 0 0 18pt">Correct it:</p>' + LINE + hint;
    case 'sort': return head + esc(q.q) + marks + '</p><p style="margin:0 0 4pt 18pt">' + shuffle(q.items, q.q).map(([x]) => esc(x.text)).join(' &nbsp;·&nbsp; ') + '</p><table style="border-collapse:collapse;margin-left:18pt;width:80%"><tr>' + q.groups.map((g) => '<td style="border:1px solid #9AA3B5;padding:4pt;font-weight:bold;width:' + Math.floor(100 / q.groups.length) + '%">' + esc(g) + '</td>').join('') + '</tr><tr>' + q.groups.map(() => '<td style="border:1px solid #9AA3B5;height:60pt"></td>').join('') + '</tr></table>' + hint;
    default: return '';
  }
}
function shuffle(items, seed) {
  const a = items.map((x, i) => [x, i]);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let i = a.length - 1; i > 0; i--) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; const j = Math.abs(h) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.every((x, i) => x[1] === i) && a.length > 1) a.push(a.shift());
  return a;
}
function answerLine(q) {
  switch (q.type) {
    case 'mcq': return 'ABCDE'[q.answer] + ' (' + q.options[q.answer] + ')' + (q.why ? '. ' + q.why : '');
    case 'short': return q.answer;
    case 'fill': return q.answers.join(', ');
    case 'truefalse': return (q.answer ? 'True' : 'False') + (q.because ? '. ' + q.because : '');
    case 'order': return q.items.map((x, i) => (i + 1) + '. ' + x).join('  ');
    case 'match': return q.pairs.map((x) => x[0] + ' → ' + x[1]).join('; ');
    case 'odd': return q.items[q.answer] + (q.why ? '. ' + q.why : '');
    case 'spot': return (q.mistake ? q.mistake + ' ' : '') + q.fix;
    case 'sort': return q.groups.map((g, gi) => g + ': ' + q.items.filter((x) => x.group === gi).map((x) => x.text).join(', ')).join('; ');
    default: return '';
  }
}
/* tiers: list of tier keys; answers: add a teacher answer page. */
export function sheetDoc(p, tiers, answers) {
  const w = p.worksheet, label = (k) => (TIERS.find((t) => t[0] === k) || [k, k])[1];
  let h = '';
  tiers.forEach((k, ti) => {
    h += (ti ? '<br clear="all" style="page-break-before:always">' : '') +
      '<p style="margin:0;color:#7A849A;font-size:10pt">' + esc(p.input.year + ' · ' + p.input.subjectName + ' · ' + label(k)) + '</p><h1 style="font-size:18pt;margin:2pt 0 4pt">' + esc(w.title || p.title) + '</h1>' +
      (w.instructions ? '<p style="margin:0 0 6pt">' + esc(w.instructions) + '</p>' : '') + '<p style="margin:0 0 10pt">Name: ______________________ &nbsp;&nbsp; Date: ____________</p>' + (w[k] || []).map((q, i) => wq(q, i + 1)).join('');
  });
  if (answers) {
    h += '<br clear="all" style="page-break-before:always"><h1 style="font-size:16pt">Answers (teacher copy)</h1>';
    tiers.forEach((k) => { h += '<h2 style="font-size:13pt;margin:10pt 0 4pt">' + esc(label(k)) + '</h2><ol>' + (w[k] || []).map((q) => '<li style="margin:0 0 4pt">' + esc(answerLine(q)) + '</li>').join('') + '</ol>'; });
  }
  const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + esc(w.title || p.title) + '</title>' +
    '<style>@page{size:A4;margin:2cm}body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#1B2440}</style></head><body>' + fracHTML(h) + '</body></html>';
  return new Blob(['﻿', html], { type: 'application/msword' });
}
/* The same worksheet as text, for pasting into Google Docs, Word or Teams. */
export function sheetText(p, tier, answers) {
  const w = p.worksheet, qs = w[tier] || [];
  const lines = [(w.title || p.title) + ' · ' + (TIERS.find((t) => t[0] === tier) || [tier, tier])[1], w.instructions || '', ''];
  qs.forEach((q, i) => {
    const n = (i + 1) + '. ';
    if (q.type === 'mcq') lines.push(n + q.q, ...q.options.map((o, j) => '   ' + 'ABCDE'[j] + ') ' + o));
    else if (q.type === 'fill') lines.push(n + q.text.split('___').join('________') + (q.bank.length ? '   (Word bank: ' + q.bank.join(', ') + ')' : ''));
    else if (q.type === 'truefalse') lines.push(n + q.statement + '   True / False. Because…');
    else if (q.type === 'order') lines.push(n + q.q, ...shuffle(q.items, q.q).map(([t]) => '   [ ] ' + t));
    else if (q.type === 'match') { const r = shuffle(q.pairs.map((x) => x[1]), q.q); lines.push(n + q.q, ...q.pairs.map((x, j) => '   ' + (j + 1) + '. ' + x[0] + '      ' + 'ABCDEF'[j] + '. ' + r[j][0])); }
    else if (q.type === 'odd') lines.push(n + q.q, '   ' + q.items.join('  ·  '));
    else if (q.type === 'spot') lines.push(n + q.q, '   ' + q.work);
    else if (q.type === 'sort') lines.push(n + q.q, '   ' + shuffle(q.items, q.q).map(([x]) => x.text).join(', '), '   Groups: ' + q.groups.join(' | '));
    else lines.push(n + q.q);
    if (q.hint) lines.push('   Hint: ' + q.hint);
    if (answers) lines.push('   Answer: ' + answerLine(q));
    lines.push('');
  });
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5">' + lines.map((l) => (l ? '<p style="margin:0">' + esc(l) + '</p>' : '<br>')).join('') + '</div>';
  return { text: lines.join('\n'), html };
}
