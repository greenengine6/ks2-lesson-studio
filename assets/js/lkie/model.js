/* lkie.like data: tidying what the engine returns into a safe, predictable pack (slides, key words, activities,
   worksheet, unit plan), the automatic checks on a unit plan, the cache key, and reading slides out of a reply
   while it is still arriving. */
import { str, arr, houseFix } from '../core.js?v=49509700';
import { keepCodes, objective } from './curriculum.js?v=49509700';

export const LAYOUTS = ['title', 'recap', 'hook', 'vocab', 'concept', 'guided', 'check', 'independent', 'talk', 'plenary', 'exit'];
const RESPONDS = ['chat', 'vote', 'show', 'talk', 'react', 'none'];
const DEF_RESPOND = { title: 'none', recap: 'chat', hook: 'talk', vocab: 'none', concept: 'react', guided: 'show', check: 'vote', independent: 'show', talk: 'talk', plenary: 'react', exit: 'chat' };
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const strs = (v, n, max) => arr(v).map((x) => str(x).slice(0, max || 240)).filter(Boolean).slice(0, n);
const qa = (v, n) => arr(v).map((x) => ({ q: str(x && x.q).slice(0, 240), a: str(x && x.a).slice(0, 160) })).filter((x) => x.q).slice(0, n);

/* ---------------- diagrams (drawn by the site, so they are checked hard) ---------------- */
export function normDiagram(d) {
  if (!d || typeof d !== 'object') return null;
  const t = str(d.type).toLowerCase();
  if (t === 'numberline') {
    const from = num(d.from, NaN), to = num(d.to, NaN), step = Math.abs(num(d.step, NaN));
    if (![from, to, step].every(Number.isFinite) || to <= from || step <= 0 || (to - from) / step > 40 || (to - from) / step < 1) return null;
    const label = Math.abs(num(d.label, 0)) || 0;
    const inside = (xs) => arr(xs).map((x) => num(x, NaN)).filter((x) => Number.isFinite(x) && x >= from && x <= to).slice(0, 6);
    return { type: t, from, to, step, label: label && (to - from) / label <= 20 ? label : 0, marks: inside(d.marks), highlight: inside(d.highlight) };
  }
  if (t === 'fractions') {
    const parts = Math.round(num(d.parts, 0)), shaded = Math.round(num(d.shaded, 0));
    if (parts < 1 || parts > 24 || shaded < 0 || shaded > parts) return null;
    return { type: t, parts, shaded, label: str(d.label).slice(0, 20) };
  }
  if (t === 'placevalue') {
    const cols = strs(d.columns, 8, 6), digits = arr(d.digits).map((x) => str(x).slice(0, 3)).slice(0, cols.length);
    if (cols.length < 2 || digits.length !== cols.length) return null;
    const c = Math.round(num(d.circle, -1));
    return { type: t, columns: cols, digits, circle: c >= 0 && c < cols.length ? c : -1 };
  }
  if (t === 'timeline') {
    const ev = arr(d.events).map((e) => ({ when: str(e && e.when).slice(0, 24), what: str(e && e.what).slice(0, 80) })).filter((e) => e.when && e.what).slice(0, 6);
    return ev.length >= 2 ? { type: t, events: ev } : null;
  }
  if (t === 'cycle') { const s = strs(d.steps, 6, 40); return s.length >= 3 ? { type: t, steps: s } : null; }
  if (t === 'bars') {
    const bars = arr(d.bars).map((b) => ({ label: str(b && b.label).slice(0, 18), value: num(b && b.value, NaN) })).filter((b) => b.label && Number.isFinite(b.value) && b.value >= 0).slice(0, 8);
    return bars.length >= 2 && bars.some((b) => b.value > 0) ? { type: t, title: str(d.title).slice(0, 60), bars } : null;
  }
  if (t === 'table') {
    const head = strs(d.head, 4, 40), rows = arr(d.rows).map((r) => arr(r).map((c) => str(c).slice(0, 40)).slice(0, head.length || 4)).filter((r) => r.some(Boolean)).slice(0, 5);
    return rows.length ? { type: t, head, rows } : null;
  }
  if (t === 'cards') {
    const items = arr(d.items).map((x) => ({ big: str(x && x.big).slice(0, 24), small: str(x && x.small).slice(0, 40), note: str(x && x.note).slice(0, 60) })).filter((x) => x.big).slice(0, 6);
    return items.length ? { type: t, items } : null;
  }
  return null;
}

/* ---------------- slides ---------------- */
export function normSlide(s) {
  if (!s || typeof s !== 'object') return null;
  s = houseFix(s);
  const layout = LAYOUTS.includes(str(s.layout)) ? str(s.layout) : null;
  if (!layout) return null;
  const media = s.media && typeof s.media === 'object' ? { image: str(s.media.image).slice(0, 100), video: str(s.media.video).slice(0, 100), wiki: str(s.media.wiki).replace(/_/g, ' ').slice(0, 100) } : { image: '', video: '', wiki: '' };
  const o = {
    layout, title: str(s.title).slice(0, 90), say: str(s.say).slice(0, 700), visual: str(s.visual).slice(0, 220), media,
    respond: RESPONDS.includes(str(s.respond)) ? str(s.respond) : DEF_RESPOND[layout], minutes: clamp(Math.round(num(s.minutes, 0)), 0, 30)
  };
  const dg = normDiagram(s.diagram);
  if (dg && ['hook', 'concept', 'guided', 'recap', 'plenary'].includes(layout)) o.diagram = dg;
  switch (layout) {
    case 'recap': case 'exit': o.questions = qa(s.questions, 5); if (!o.questions.length) return null; break;
    case 'hook': o.prompt = str(s.prompt).slice(0, 260); o.detail = str(s.detail).slice(0, 200); if (!o.prompt) return null; break;
    case 'vocab': o.words = strs(s.words, 8, 40); break;
    case 'concept': o.points = strs(s.points, 4, 160); o.example = str(s.example).slice(0, 260); if (!o.points.length && !o.example) return null; break;
    case 'guided': o.problem = str(s.problem).slice(0, 260); o.steps = strs(s.steps, 5, 200); o.answer = str(s.answer).slice(0, 160); if (!o.problem) return null; break;
    case 'check': {
      o.question = str(s.question).slice(0, 260); o.options = strs(s.options, 4, 120);
      let a = s.answer;
      if (typeof a === 'string' && /^[A-D]$/i.test(a.trim())) a = 'ABCD'.indexOf(a.trim().toUpperCase());
      o.answer = clamp(Math.round(num(a, 0)), 0, Math.max(0, o.options.length - 1)); o.why = str(s.why).slice(0, 300);
      if (!o.question || o.options.length < 2) return null; break;
    }
    case 'independent':
      o.support = strs(s.support, 3, 200); o.core = strs(s.core, 3, 200); o.stretch = strs(s.stretch, 3, 200); o.answers = str(s.answers).slice(0, 500);
      if (!o.support.length && !o.core.length && !o.stretch.length) return null; break;
    case 'talk': o.prompt = str(s.prompt).slice(0, 260); o.starter = str(s.starter).slice(0, 120); if (!o.prompt) return null; break;
    case 'plenary': o.points = strs(s.points, 4, 160); o.prompt = str(s.prompt).slice(0, 200); if (!o.points.length && !o.prompt) return null; break;
    default: break;
  }
  return o;
}
/* What the teacher added by hand (picture, video, background, text size) stays when the engine rewrites a slide. */
export const EXTRAS = ['pic', 'video', 'look', 'fs'];
export function carryExtras(from, to) {
  if (!from || !to) return to;
  EXTRAS.forEach((k) => { if (from[k] != null && to[k] == null) to[k] = JSON.parse(JSON.stringify(from[k])); });
  return to;
}
export const TEXT_SIZES = [[0.85, 'Smaller'], [1, 'Normal'], [1.15, 'Bigger'], [1.3, 'Biggest']];

/* ---------------- the whole pack ---------------- */
export function normPack(raw, input, allowed) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  raw = houseFix(raw);
  const codes = keepCodes(raw.codes, allowed);
  const t = raw.teacher && typeof raw.teacher === 'object' ? raw.teacher : {};
  const p = {
    v: 1, input,
    title: str(raw.title).slice(0, 100) || input.topic, objective: str(raw.objective).slice(0, 240), successCriteria: strs(raw.successCriteria, 4, 160), bigQuestion: str(raw.bigQuestion).slice(0, 200),
    codes: codes.map((c) => ({ code: c, text: (objective(c) || {}).text || '' })),
    vocab: arr(raw.vocab).map((v) => ({ word: str(v && v.word).slice(0, 60), meaning: str(v && v.meaning).slice(0, 200), example: str(v && v.example).slice(0, 200), gloss: str(v && v.gloss).slice(0, 80), pinyin: str(v && v.pinyin).slice(0, 60) })).filter((v) => v.word).slice(0, 10),
    slides: arr(raw.slides).map(normSlide).filter(Boolean).slice(0, 16),
    activities: arr(raw.activities).map((a) => ({ name: str(a && a.name).slice(0, 80), minutes: clamp(Math.round(num(a && a.minutes, 10)), 1, 60), grouping: str(a && a.grouping).slice(0, 40), steps: strs(a && a.steps, 6, 200), resources: str(a && a.resources).slice(0, 200) })).filter((a) => a.name && a.steps.length).slice(0, 4),
    teacher: { overview: str(t.overview).slice(0, 600), misconceptions: strs(t.misconceptions, 5, 260), support: str(t.support).slice(0, 400), stretch: str(t.stretch).slice(0, 400), assessment: str(t.assessment).slice(0, 500), briefing: str(t.briefing).slice(0, 2400) },
    worksheet: raw.worksheet ? normSheet(raw.worksheet) : null
  };
  if (p.slides.length < 5) return null;
  if (p.slides[0].layout !== 'title') p.slides.unshift({ layout: 'title', title: p.title, say: '', visual: '', media: { image: '', video: '', wiki: '' }, respond: 'none', minutes: 1 });
  return p;
}
export const totalMinutes = (p) => p.slides.reduce((a, s) => a + (s.minutes || 0), 0);

/* ---------------- worksheet questions ---------------- */
const SKILLS = ['recall', 'apply', 'reason'];
export const QTYPES = ['mcq', 'short', 'fill', 'truefalse', 'order', 'match', 'odd', 'spot', 'sort'];
export function normQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  const type = str(q.type).toLowerCase();
  if (!QTYPES.includes(type)) return null;
  const o = { type, skill: SKILLS.includes(str(q.skill)) ? str(q.skill) : 'apply', marks: clamp(Math.round(num(q.marks, 1)), 1, 3), hint: str(q.hint).slice(0, 200) };
  const idx = (v, n) => { const a = Math.round(num(v, -1)); return a >= 0 && a < n ? a : -1; };
  switch (type) {
    case 'mcq': o.q = str(q.q); o.options = strs(q.options, 5, 120); o.answer = idx(q.answer, o.options.length); o.why = str(q.why); if (!o.q || o.options.length < 2 || o.answer < 0) return null; break;
    case 'short': o.q = str(q.q); o.answer = str(q.answer); if (!o.q || !o.answer) return null; break;
    case 'fill': {
      o.text = str(q.text).replace(/_{2,}/g, '___'); o.answers = strs(q.answers, 6, 80); o.bank = strs(q.bank, 8, 60);
      if (!o.text || !o.answers.length || o.text.split('___').length - 1 !== o.answers.length) return null; break;
    }
    case 'truefalse': {
      o.statement = str(q.statement); const a = q.answer; o.answer = a === true || /^true$/i.test(str(a)) ? true : a === false || /^false$/i.test(str(a)) ? false : null; o.because = str(q.because);
      if (!o.statement || o.answer === null) return null; break;
    }
    case 'order': o.q = str(q.q) || 'Put these in order.'; o.items = strs(q.items, 6, 160); if (o.items.length < 3) return null; break;
    case 'match': o.q = str(q.q) || 'Match the pairs.'; o.pairs = arr(q.pairs).map((p) => [str(p && p[0]).slice(0, 80), str(p && p[1]).slice(0, 80)]).filter((p) => p[0] && p[1]).slice(0, 6); if (o.pairs.length < 3) return null; break;
    case 'odd': o.q = str(q.q) || 'Which is the odd one out? Why?'; o.items = strs(q.items, 5, 80); o.answer = idx(q.answer, o.items.length); o.why = str(q.why); if (o.items.length < 3 || o.answer < 0) return null; break;
    case 'spot': o.q = str(q.q) || 'Spot the mistake and correct it.'; o.work = str(q.work); o.mistake = str(q.mistake); o.fix = str(q.fix); if (!o.work || !o.fix) return null; break;
    case 'sort': {
      o.q = str(q.q) || 'Sort these into groups.'; o.groups = strs(q.groups, 3, 40);
      o.items = arr(q.items).map((x) => ({ text: str(x && x.text).slice(0, 80), group: Math.round(num(x && x.group, -1)) })).filter((x) => x.text && x.group >= 0 && x.group < o.groups.length).slice(0, 10);
      if (o.groups.length < 2 || o.items.length < 4) return null; break;
    }
    default: return null;
  }
  return o;
}
export const TIERS = [['scaffolded', 'Scaffolded'], ['standard', 'Standard'], ['stretch', 'Stretch']];
export function normSheet(raw) {
  if (!raw || typeof raw !== 'object') return null;
  raw = houseFix(raw);
  const tiers = raw.tiers && typeof raw.tiers === 'object' ? raw.tiers : raw;
  const w = { title: str(raw.title).slice(0, 100), instructions: str(raw.instructions).slice(0, 200) };
  TIERS.forEach(([k]) => { w[k] = arr(tiers[k]).map(normQuestion).filter(Boolean).slice(0, 10); });
  return TIERS.some(([k]) => w[k].length >= 3) ? w : null;
}
/* A quick balance check on a worksheet: how demanding each tier is. */
export function sheetBalance(w) {
  const weight = { recall: 1, apply: 2, reason: 3 };
  return TIERS.map(([k, label]) => {
    const qs = w && w[k] || [];
    const d = qs.length ? qs.reduce((a, q) => a + weight[q.skill], 0) / qs.length : 0;
    return { tier: k, label, n: qs.length, demand: Math.round(d * 10) / 10, types: new Set(qs.map((q) => q.type)).size };
  });
}

/* ---------------- unit plans ---------------- */
const TYPES = ['teach', 'recap', 'assess'];
export function normUnit(raw, req, allowed) {
  if (!raw || typeof raw !== 'object') return null;
  raw = houseFix(raw);
  const lessons = arr(raw.lessons).slice(0, 25).map((l, i) => ({
    n: i + 1, week: clamp(Math.round(num(l && l.week, 1)), 1, 12), type: TYPES.includes(str(l && l.type)) ? str(l.type) : 'teach',
    title: str(l && l.title).slice(0, 100), objective: str(l && l.objective).slice(0, 240), codes: keepCodes(l && l.codes, allowed),
    buildsOn: arr(l && l.buildsOn).map((x) => Math.round(num(x, 0))).filter((x) => x >= 1 && x <= i).slice(0, 6),
    targets: arr(l && l.targets).map((x) => Math.round(num(x, 0))).filter((x) => x >= 1 && x <= i).slice(0, 8),
    vocab: strs(l && l.vocab, 8, 40), pack: ''
  })).filter((l) => l.title);
  lessons.forEach((l, i) => { l.n = i + 1; });
  if (lessons.length < 2) return null;
  return { id: 'u' + Date.now().toString(36), at: Date.now(), input: req, unit: str(raw.unit).slice(0, 100) || req.unit, bigQuestion: str(raw.bigQuestion).slice(0, 200), summary: str(raw.summary).slice(0, 400), lessons };
}
/* The automatic checks. Some fix themselves (and say so); the rest are shown to the teacher. */
export function checkUnit(u, gaps) {
  const out = [], L = u.lessons;
  const want = Math.min(25, (u.input.weeks || 1) * (u.input.perWeek || 1));
  out.push(L.length === want ? { ok: true, text: L.length + ' lessons, as asked.' } : { ok: false, text: L.length + ' lessons came back (you asked for ' + want + ').' });
  // recap lessons must revisit earlier teaching
  const lessons = (xs) => 'lesson' + (xs.length > 1 ? 's ' : ' ') + xs.join(', ');
  L.forEach((l, i) => {
    if (l.type !== 'teach' && !l.targets.length) {
      // a recap revisits the teaching since the last recap or assessment; an assessment checks everything since the last assessment
      const back = [];
      for (let j = i - 1; j >= 0 && back.length < (l.type === 'assess' ? 8 : 4); j--) { if (L[j].type === 'assess' || (l.type === 'recap' && L[j].type === 'recap')) break; if (L[j].type === 'teach') back.unshift(L[j].n); }
      l.targets = back.length ? back : L.slice(0, i).filter((x) => x.type === 'teach').slice(-4).map((x) => x.n);
      if (l.targets.length) out.push({ ok: true, fixed: true, text: 'Lesson ' + l.n + ' (' + l.type + ') now ' + (l.type === 'assess' ? 'checks ' : 'revisits ') + lessons(l.targets) + '.' });
    }
  });
  // spacing of retrieval
  let run = 0, longest = 0;
  L.forEach((l) => { run = l.type === 'teach' ? run + 1 : 0; longest = Math.max(longest, run); });
  out.push(longest <= 6 ? { ok: true, text: 'Recap or assessment at least every 6 lessons.' } : { ok: false, text: longest + ' teaching lessons in a row without a recap. Add one, or change a lesson to recap.' });
  out.push(L.length < 4 || L[L.length - 1].type === 'assess' ? { ok: true, text: L.length < 4 ? 'Short unit: no final assessment needed.' : 'Ends with an assessment lesson.' } : { ok: false, text: 'The unit does not end with an assessment lesson.' });
  // progression: every teaching lesson after the first builds on something earlier
  const loose = L.filter((l, i) => i > 0 && l.type === 'teach' && !l.buildsOn.length).map((l) => l.n);
  out.push(!loose.length ? { ok: true, text: 'Every lesson builds on earlier ones.' } : { ok: false, text: 'Lessons ' + loose.join(', ') + ' do not say what they build on.' });
  // curriculum
  const noCode = L.filter((l) => !l.codes.length).map((l) => l.n);
  out.push(!noCode.length ? { ok: true, text: 'Every lesson has a checked curriculum code.' } : { ok: noCode.length < L.length / 2, text: 'Lessons ' + noCode.join(', ') + ' have no matching curriculum code.' });
  // learning gaps from class feedback steer the recaps
  if (gaps && gaps.length) {
    L.forEach((l) => {
      if (l.type === 'teach') return;
      const add = gaps.filter((g) => g.n < l.n && !l.targets.includes(g.n)).map((g) => g.n);
      if (add.length) { l.targets = l.targets.concat(add).sort((a, b) => a - b); out.push({ ok: true, fixed: true, text: 'Lesson ' + l.n + ' now also revisits ' + lessons(add) + ' (low class mood).' }); }
    });
  }
  return out;
}

/* ---------------- cache key ---------------- */
const clean = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9À-ɏ一-鿿]+/g, ' ').trim();
export function packKey(i) {
  return [i.year, i.subject, clean(i.topic), i.minutes, i.mode, (i.codes || []).slice().sort().join(','), clean(i.rules).slice(0, 60), clean(i.unitKey)].join('|');
}

/* ---------------- reading a reply while it arrives ---------------- */
/* Complete objects inside the array that follows "key": [ … in a partial JSON text. */
export function itemsSoFar(text, key) {
  const m = new RegExp('"' + key + '"\\s*:\\s*\\[').exec(text);
  if (!m) return { items: [], closed: false };
  const items = [];
  let i = m.index + m[0].length, depth = 0, start = -1, inStr = false, esc = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '{' || c === '[') { if (depth === 0 && c === '{') start = i; depth++; }
    else if (c === '}' || c === ']') {
      if (depth === 0 && c === ']') return { items, closed: true };
      depth--;
      if (depth === 0 && c === '}' && start >= 0) { try { items.push(JSON.parse(text.slice(start, i + 1))); } catch (e) { /* not complete JSON */ } start = -1; }
    }
  }
  return { items, closed: false };
}
export function stringSoFar(text, key) {
  const m = new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(text);
  if (!m) return '';
  try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return ''; }
}
