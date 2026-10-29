/* The worksheet maker's words to the engine, and the tidying of what comes back.
   - What the engine is asked: from a sample (a photo, a PDF, a Word file or pasted text), from a topic, or from a
     lesson already made on this device. The sample route keeps the sample's skills, layout and difficulty and makes
     every question new.
   - normSheet(): every field checked and trimmed, so the page never trusts the engine's shape.
   - copyCheck(): no new question may be too close to a sample question (the same words, or the same numbers in the
     same order with many of the same words).
   - answerIssues(): answers that are missing, not one of the options, or (for simple sums and missing numbers in
     fractions) worked out wrongly. */
import { str, arr, HOUSE_WORDS, ages } from '../core.js?v=de4f9a51';

export const TYPES = {
  calc: 'Calculations', fill: 'Missing numbers or words', choice: 'Multiple choice', write: 'Short written answers',
  match: 'Matching', order: 'Putting in order', tick: 'True or false', draw: 'Draw or show'
};
const TYPE_IDS = Object.keys(TYPES);
export const LEVELS = [['support', 'Support'], ['core', 'Core'], ['challenge', 'Challenge']];
export const BOX = '□';

/* ---------------- the system prompt ---------------- */
export const SHEET_SYSTEM = [
  'You write worksheets for primary pupils in Key Stage 2 (Years 3 to 6, ages 7 to 11) at an international school in Ipoh, Malaysia, that follows the National Curriculum in England. Write in British English.',
  HOUSE_WORDS,
  'Write each missing number or word as ' + BOX + ' (one box for each missing item), for example "1/2 = ' + BOX + '/4" or "345 + ' + BOX + ' = 600".',
  'Child-safe content only. Never use the names of real people, except well-known historical figures. Use everyday first names from many backgrounds; Malaysian contexts are welcome (ringgit, local places, foods and festivals) alongside others.',
  'Every answer must be right: work each one out step by step before you write it down. Keep the words at the right reading level for the year group.',
  'Reply with JSON only, with no other text before or after it.'
].join('\n');

const QUESTION = '{ "n": "1", "q": "the question exactly as the pupil reads it", "type": "' + TYPE_IDS.join(' | ') + '", ' +
  '"opts": ["for choice: the options; for tick: the statements to mark True or False; for order: the items in the RIGHT order (the sheet mixes them); for match: the left column"], ' +
  '"match": ["for match only: the right column, in the same order as opts"], "lines": "0 to 6 answer lines (write, draw) or 0", "answer": "the full correct answer", "marks": 1 }';
const SECTION = '{ "heading": "a short heading, or \\"\\"", "instructions": "one short line, or \\"\\"", "columns": "1 or 2 (2 for short calculations or missing numbers)", "questions": [' + QUESTION + '] }';
const SHEET = '{ "title": "a short title", "instructions": "one short line for the pupils", "sections": [' + SECTION + '] }';
const TYPE_HELP = 'Question types: calc (a calculation to work out, with space for working), fill (missing numbers or words written as ' + BOX + '), choice (pick one of 2 to 4 options), ' +
  'write (a short written answer on lines), match (join each item on the left to one on the right), order (put the items in order), tick (mark each statement True or False), draw (draw or show it in a box).';

function levelText(levels) {
  const out = [];
  if (levels && levels.support) out.push('"support": the same skills made easier (smaller numbers, one step at a time, more help such as a worked example, a word bank or sentence starters), the same number of questions or fewer');
  if (levels && levels.challenge) out.push('"challenge": the same skills made harder (bigger numbers, two steps, and reasoning such as "Explain how you know")');
  return out.length ? 'Also write these levels in "levels", each { "sections": [...] } in the same shape: ' + out.join('; ') + '. The main "sheet" is the Core level.' : 'Set "levels" to null.';
}
const ANSWERS = 'Give the answer to every question in "answer" (for choice, the exact text of the right option; for tick, "True" or "False" for each statement in order, separated by "; "; for match, each pair as "left → right" separated by "; "; for order, the items in order separated by "; "; for open questions, a model answer).';

/* From a sample: o = { diff: 'numbers' | 'words', levels: { support, challenge }, year, subject (names, if the teacher set them), note } */
export function sampleRequest(o) {
  const diff = o.diff === 'words'
    ? 'Use new numbers AND new word problems, contexts and wording throughout.'
    : 'Keep the same kinds of question with new numbers (and new names and objects in any word problems).';
  return [
    'Above is a sample worksheet that a teacher likes. Make a NEW worksheet like it for the same class.',
    o.year ? 'The class is ' + o.year + ' (ages ' + ages(o.year) + ').' : 'Work out the year group from the sample.',
    o.subject ? 'The subject is ' + o.subject + '.' : '',
    'First read the sample carefully. Then:',
    '1. In "found", say what you found: { "subject": "…", "year": "Year 3 | Year 4 | Year 5 | Year 6", "skills": ["each skill it practises"], "types": ["each kind of question"], "layout": "how it is laid out (sections, numbering, columns, answer lines and boxes)", "difficulty": "how hard it is for that year", "summary": "one short line such as: Year 4 · equivalent fractions (multiply or divide the top and bottom by the same number)" }.',
    '2. In "sample", copy out every question of the sample exactly as it is written, one item per question, with missing parts written as ' + BOX + '.',
    '3. In "sheet", write the new worksheet. KEEP: the same skills, the same kinds of question, the same layout (the same sections, headings, numbering, columns, answer lines and boxes), the same number of questions and the same difficulty. CHANGE: every single question must be new. ' + diff +
      ' Never reuse a question from the sample, even with only one number changed, and never use the sample\'s numbers in the same order.',
    '4. ' + levelText(o.levels),
    '5. In "differences", give 3 to 5 short points saying how the new worksheet differs from the sample (for example "New fractions: fifths, sevenths and eighths instead of halves, thirds and quarters").',
    ANSWERS,
    TYPE_HELP,
    o.note ? 'The teacher also says: ' + str(o.note).slice(0, 300) : '',
    'If the upload is not a worksheet or cannot be read, reply { "error": "not_a_worksheet" } or { "error": "unreadable" } instead.',
    'Reply with this JSON: { "found": {…}, "sample": ["…"], "sheet": ' + SHEET + ', "levels": { "support": { "sections": [] }, "challenge": { "sections": [] } } or null, "differences": ["…"] }'
  ].filter(Boolean).join('\n');
}

/* From a topic: o = { topic, year, subject, count, types: [type ids], levels, note } */
export function topicRequest(o) {
  const types = arr(o.types).filter((t) => TYPES[t]);
  return [
    'Make a worksheet on "' + str(o.topic).slice(0, 160) + '" for ' + (o.year || 'Year 4') + ' (ages ' + ages(o.year) + ')' + (o.subject ? ', ' + o.subject : '') + '.',
    'It has ' + (o.count || 8) + ' questions, from easier to harder, matched to what the National Curriculum in England expects in that year.',
    types.length ? 'Use these kinds of question: ' + types.map((t) => TYPES[t].toLowerCase()).join(', ') + '.' : 'Use the kinds of question that suit the topic best, with a mix.',
    'Group them into 1 to 3 sections with short headings if that helps. Use 2 columns for short calculations or missing numbers.',
    levelText(o.levels),
    'In "found", say in one line what it practises: { "summary": "…", "skills": ["…"] }.',
    ANSWERS,
    TYPE_HELP,
    o.note ? 'The teacher also says: ' + str(o.note).slice(0, 300) : '',
    'Reply with this JSON: { "found": { "summary": "…", "skills": ["…"] }, "sheet": ' + SHEET + ', "levels": { "support": { "sections": [] }, "challenge": { "sections": [] } } or null }'
  ].filter(Boolean).join('\n');
}

/* From a lesson made on this device: o = { lesson: text, title, year, subject, count, levels, note } */
export function lessonRequest(o) {
  return [
    'Here is a lesson the teacher already made, as text:',
    '<lesson>\n' + str(o.lesson).slice(0, 9000) + '\n</lesson>',
    'Make a worksheet that practises exactly what this lesson teaches, for ' + (o.year || 'the same year group') + (o.year ? ' (ages ' + ages(o.year) + ')' : '') + (o.subject ? ', ' + o.subject : '') + '.',
    'It has ' + (o.count || 8) + ' questions, from easier to harder. Do not copy questions from the lesson word for word: write new ones on the same learning.',
    'Group them into 1 to 3 sections with short headings if that helps. Use 2 columns for short calculations or missing numbers.',
    levelText(o.levels),
    'In "found", say in one line what it practises: { "summary": "…", "skills": ["…"] }.',
    ANSWERS,
    TYPE_HELP,
    o.note ? 'The teacher also says: ' + str(o.note).slice(0, 300) : '',
    'Reply with this JSON: { "found": { "summary": "…", "skills": ["…"] }, "sheet": ' + SHEET + ', "levels": { "support": { "sections": [] }, "challenge": { "sections": [] } } or null }'
  ].filter(Boolean).join('\n');
}

/* Another version of a worksheet already made (when the sample itself is no longer here): the same structure and
   skills, every question new. o = { levels, diff, year, subject } */
export function againRequest(sheet, o) {
  const shape = { title: sheet.title, instructions: sheet.instructions, sections: arr(sheet.sections).map((s) => ({ heading: s.heading, instructions: s.instructions, columns: s.columns, questions: s.questions.map((q) => ({ n: q.n, q: q.q, type: q.type, opts: q.opts, match: q.match, lines: q.lines })) })) };
  return [
    'Here is a worksheet the teacher already has, as JSON:',
    JSON.stringify(shape),
    'Write ANOTHER VERSION of it for ' + (o.year || 'the same class') + (o.year ? ' (ages ' + ages(o.year) + ')' : '') + (o.subject ? ', ' + o.subject : '') + '. KEEP the same skills, the same kinds of question, the same layout (sections, headings, numbering, columns, lines) and the same number of questions at the same difficulty. CHANGE every question: ' +
      (o.diff === 'words' ? 'new numbers and new word problems, contexts and wording.' : 'new numbers (and new names and objects in any word problems).') + ' Never reuse a question above, even with only one number changed.',
    levelText(o.levels),
    'In "differences", give 3 to 5 short points saying how this version differs from the one above.',
    ANSWERS,
    TYPE_HELP,
    'Reply with this JSON: { "found": { "summary": "…", "skills": ["…"] }, "sheet": ' + SHEET + ', "levels": { "support": { "sections": [] }, "challenge": { "sections": [] } } or null, "differences": ["…"] }'
  ].join('\n');
}

/* Rewrite only the questions that came out too close to the sample. items: [{ id, q, type, opts, match, answer }] */
export function fixRequest(items, sample) {
  return [
    'These new worksheet questions came out too close to questions on the sample worksheet. Rewrite each one so it practises the same skill in the same way and keeps its type, but with clearly different numbers and wording.',
    'Sample questions to stay away from:\n' + arr(sample).slice(0, 40).map((s) => '- ' + str(s).slice(0, 200)).join('\n'),
    'Questions to rewrite:\n' + JSON.stringify(items.map((x) => ({ id: x.id, q: x.q, type: x.type, opts: x.opts, match: x.match, answer: x.answer }))),
    ANSWERS,
    'Reply with this JSON: { "questions": [ { "id": "…", "q": "…", "opts": ["…"], "match": ["…"], "lines": 0, "answer": "…" } ] }'
  ].join('\n');
}

/* ---------------- tidying what comes back ---------------- */
const clip = (s, n) => str(s).replace(/\s+/g, ' ').trim().slice(0, n);
const clipKeep = (s, n) => str(s).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const int = (v, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const list = (v, n, max) => arr(v).map((x) => clip(typeof x === 'object' && x ? (x.text || x.q || '') : x, max)).filter(Boolean).slice(0, n);
const DEF_LINES = { write: 2, draw: 4, calc: 0, fill: 0, choice: 0, match: 0, order: 0, tick: 0 };

export function normQuestion(q, i) {
  if (!q || typeof q !== 'object') return null;
  let type = TYPE_IDS.includes(str(q.type).toLowerCase()) ? str(q.type).toLowerCase() : 'write';
  const text = clipKeep(q.q || q.question, 420);
  if (!text) return null;
  let opts = list(q.opts || q.options || q.items || q.statements, 8, 160);
  let match = list(q.match || q.right, 8, 160);
  if (type === 'choice' && opts.length < 2) type = 'write';
  if (type === 'tick' && !opts.length) { type = 'choice'; opts = ['True', 'False']; }
  if (type === 'order' && opts.length < 2) type = 'write';
  if (type === 'match') { const n = Math.min(opts.length, match.length); if (n < 2) type = 'write'; else { opts = opts.slice(0, n); match = match.slice(0, n); } }
  if (type !== 'match') match = [];
  if (!['choice', 'tick', 'order', 'match'].includes(type)) opts = [];
  let answer = clipKeep(q.answer || q.a, 400);
  if (type === 'choice') {
    const m = /^\(?([A-Da-d])\)?[.)]?$/.exec(answer.trim());
    if (m && opts['abcd'.indexOf(m[1].toLowerCase())]) answer = opts['abcd'.indexOf(m[1].toLowerCase())];
  }
  if (!answer && type === 'order') answer = opts.join('; ');
  if (!answer && type === 'match') answer = opts.map((o, j) => o + ' → ' + match[j]).join('; ');
  const lines = clamp(int(q.lines, DEF_LINES[type]), 0, type === 'draw' ? 8 : 6);
  return { n: clip(q.n, 6) || String(i + 1), q: text, type, opts, match, lines, answer, marks: clamp(int(q.marks, 1), 0, 10) };
}
/* Sections: at most 6, at most 40 questions in all; numbers kept when they are all there and different. */
export function normSections(v) {
  let total = 0;
  const secs = arr(v).slice(0, 6).map((s) => {
    if (!s || typeof s !== 'object') return null;
    const qs = [];
    arr(s.questions).forEach((q) => { if (total >= 40) return; const x = normQuestion(q, total); if (x) { qs.push(x); total += 1; } });
    if (!qs.length) return null;
    return { heading: clip(s.heading, 100), instructions: clip(s.instructions, 200), columns: int(s.columns, 1) === 2 ? 2 : 1, questions: qs };
  }).filter(Boolean);
  const all = secs.flatMap((s) => s.questions), ns = all.map((q) => q.n);
  if (new Set(ns).size !== ns.length || ns.some((n) => !n)) all.forEach((q, i) => { q.n = String(i + 1); });
  return secs;
}
export const questionsOf = (secs) => arr(secs).flatMap((s) => arr(s && s.questions));
/* raw: the engine's whole reply; o: { topic, year, subject, from } (what the teacher chose). null if unusable. */
export function normSheet(raw, o) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.error && !raw.sheet) return { error: clip(raw.error, 40) || 'unreadable' };
  const s = raw.sheet && typeof raw.sheet === 'object' ? raw.sheet : raw;
  const sections = normSections(s.sections || (s.questions ? [{ questions: s.questions }] : []));
  if (questionsOf(sections).length < 2) return null;
  const lv = raw.levels && typeof raw.levels === 'object' ? raw.levels : null;
  const level = (k) => { if (!lv || !lv[k]) return null; const x = normSections(lv[k].sections || (lv[k].questions ? [{ questions: lv[k].questions }] : [])); return questionsOf(x).length >= 2 ? { sections: x } : null; };
  const support = level('support'), challenge = level('challenge');
  const f = raw.found && typeof raw.found === 'object' ? raw.found : {};
  const found = {
    subject: clip(f.subject, 40), year: clip(f.year, 20), skills: list(f.skills, 8, 160), types: list(f.types, 8, 120),
    layout: clip(f.layout, 240), difficulty: clip(f.difficulty, 200), summary: clip(f.summary, 200)
  };
  o = o || {};
  return {
    v: 1, title: clip(s.title, 100) || clip(o.topic, 100) || 'Worksheet', topic: clip(o.topic, 140) || clip(s.title, 140),
    subject: o.subject || '', year: o.year || '', instructions: clip(s.instructions, 240), sections,
    levels: support || challenge ? { support, challenge } : null, from: o.from || 'topic',
    found, differences: list(raw.differences, 6, 200), sample: list(raw.sample, 40, 300)
  };
}

/* ---------------- no question copied ---------------- */
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'is', 'in', 'on', 'for', 'it', 'what', 'how', 'many', 'much', 'your', 'you', 'are', 'be', 'by', 'with', 'this', 'that', 'each', 'these', 'write', 'find', 'work', 'out']);
export function tokens(s) {
  const t = String(s || '').toLowerCase().replace(/[’']/g, '').replace(/(\d),(\d{3})/g, '$1$2');
  return t.match(/\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|[a-z]+/g) || [];
}
const words = (s) => tokens(s).map((x) => x.replace(/\s+/g, '')).filter((x) => !STOP.has(x));
const numsOf = (s) => tokens(s).filter((x) => /^\d/.test(x)).map((x) => x.replace(/\s+/g, ''));
export function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 1;
  let both = 0;
  A.forEach((x) => { if (B.has(x)) both += 1; });
  return both / (A.size + B.size - both);
}
/* Too close: 0.6 of the same words, or the same numbers in the same order with 0.4 of the same words. */
export function tooClose(a, b) {
  const wa = words(a), wb = words(b);
  if (!wa.length || !wb.length) return String(a).replace(/\s+/g, '') === String(b).replace(/\s+/g, '');
  const j = jaccard(wa, wb);
  if (j >= 0.6) return true;
  const na = numsOf(a), nb = numsOf(b);
  return na.length > 0 && na.length === nb.length && na.every((x, i) => x === nb[i]) && j >= 0.4;
}
/* Every question (in every level) that is too close to a sample question: [{ level, si, qi, q, like }]. */
export function copyCheck(sheet, sample) {
  const out = [], smp = arr(sample).filter(Boolean);
  if (!sheet || !smp.length) return out;
  eachLevel(sheet, (level, secs) => secs.forEach((s, si) => s.questions.forEach((q, qi) => {
    const text = q.q + ' ' + q.opts.join(' ');
    const like = smp.find((x) => tooClose(text, x) || tooClose(q.q, x));
    if (like) out.push({ level, si, qi, q: q.q, like });
  })));
  return out;
}
export function eachLevel(sheet, fn) {
  if (!sheet) return;
  if (sheet.levels && sheet.levels.support) fn('support', sheet.levels.support.sections);
  fn('core', sheet.sections);
  if (sheet.levels && sheet.levels.challenge) fn('challenge', sheet.levels.challenge.sections);
}
export const sectionsFor = (sheet, level) => (level === 'core' ? sheet.sections : (sheet.levels && sheet.levels[level] && sheet.levels[level].sections) || []);

/* ---------------- answers checked ---------------- */
const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '−': (a, b) => a - b, '×': (a, b) => a * b, 'x': (a, b) => a * b, '*': (a, b) => a * b, '÷': (a, b) => a / b };
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const numOf = (s) => { const t = String(s).replace(/,/g, '').trim(); return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
/* "345 + 278 = □" or "12 × 4 =": the left side worked out (× and ÷ before + and −), or NaN. */
export function sumOf(left) {
  const t = String(left).replace(/,(?=\d{3})/g, '').trim();
  if (!/^[\d.\s+\-−×x*÷]+$/.test(t)) return NaN;
  const parts = t.match(/\d+(?:\.\d+)?|[+\-−×x*÷]/g);
  if (!parts || parts.length < 3 || parts.length % 2 === 0) return NaN;
  const vals = [Number(parts[0])], ops = [];
  for (let i = 1; i < parts.length; i += 2) {
    const op = parts[i], v = Number(parts[i + 1]);
    if (!OPS[op] || !Number.isFinite(v)) return NaN;
    if (op === '×' || op === 'x' || op === '*' || op === '÷') { if (op === '÷' && v === 0) return NaN; vals[vals.length - 1] = OPS[op](vals[vals.length - 1], v); }
    else { ops.push(op); vals.push(v); }
  }
  return ops.reduce((acc, op, i) => OPS[op](acc, vals[i + 1]), vals[0]);
}
/* The answer a simple question must have, when it can be worked out here; NaN when it cannot. */
export function expected(q) {
  const t = String(q.q).replace(/\s+/g, ' ').trim();
  let m = /^(?:\d+\.\s*)?([\d.,\s+\-−×x*÷]+)=\s*(?:□|\?)?\s*$/.exec(t);
  if (m) return sumOf(m[1]);
  // a/b = □/d or a/b = c/□ (equivalent fractions with one missing number)
  m = /^(\d+)\s*\/\s*(\d+)\s*=\s*(\d+|□)\s*\/\s*(\d+|□)$/.exec(t);
  if (m && (m[3] === '□') !== (m[4] === '□')) {
    const a = Number(m[1]), b = Number(m[2]);
    if (!b) return NaN;
    const v = m[3] === '□' ? (a * Number(m[4])) / b : (b * Number(m[3])) / a;
    return Number.isInteger(v) ? v : NaN;
  }
  return NaN;
}
/* [{ level, si, qi, why }] */
export function answerIssues(sheet) {
  const out = [];
  eachLevel(sheet, (level, secs) => secs.forEach((s, si) => s.questions.forEach((q, qi) => {
    if (!q.answer) { out.push({ level, si, qi, why: 'No answer given' }); return; }
    if (q.type === 'choice' && !q.opts.some((o) => o.toLowerCase() === q.answer.toLowerCase())) { out.push({ level, si, qi, why: 'The answer is not one of the options' }); return; }
    const want = expected(q);
    if (Number.isFinite(want)) {
      const got = numOf(q.answer.replace(/^.*=\s*/, ''));
      if (!Number.isFinite(got) || !near(got, want)) out.push({ level, si, qi, why: 'Check this answer: it should be ' + (Math.round(want * 1000) / 1000) });
    }
  })));
  return out;
}

/* ---------------- a quiz becomes a worksheet (no engine needed) ---------------- */
export function quizToSheet(quiz) {
  const qz = quiz && typeof quiz === 'object' ? (quiz.data && quiz.data.questions ? quiz.data : quiz) : {};
  const qs = arr(qz.questions).map((q, i) => {
    if (!q || !str(q.q)) return null;
    const opts = arr(q.opts).map((x) => clip(x, 160)).filter(Boolean);
    if (q.type === 'type') return { n: String(i + 1), q: clipKeep(q.q, 420), type: 'write', opts: [], match: [], lines: 2, answer: clip(q.a, 300), marks: 1 };
    const a = Number.isInteger(q.a) && opts[q.a] ? opts[q.a] : clip(q.a, 300);
    if (q.type === 'tf' || (opts.length === 2 && /^true$/i.test(opts[0]) && /^false$/i.test(opts[1]))) return { n: String(i + 1), q: clipKeep(q.q, 420), type: 'choice', opts: ['True', 'False'], match: [], lines: 0, answer: a, marks: 1 };
    if (opts.length >= 2) return { n: String(i + 1), q: clipKeep(q.q, 420), type: 'choice', opts: opts.slice(0, 6), match: [], lines: 0, answer: a, marks: 1 };
    return { n: String(i + 1), q: clipKeep(q.q, 420), type: 'write', opts: [], match: [], lines: 2, answer: a, marks: 1 };
  }).filter(Boolean).slice(0, 40);
  qs.forEach((q, i) => { q.n = String(i + 1); });
  return {
    v: 1, title: clip(qz.title, 100) || 'Quiz worksheet', topic: clip(qz.topic || qz.title, 140), subject: str(qz.subject), year: str(qz.year),
    instructions: 'Answer every question. Tick one box for each multiple-choice question.',
    sections: qs.length ? [{ heading: '', instructions: '', columns: 1, questions: qs }] : [], levels: null, from: 'quiz', found: { summary: '', skills: [], types: [], layout: '', difficulty: '', subject: '', year: '' }, differences: [], sample: []
  };
}

/* ---------------- a lesson as text (for "From a lesson") ---------------- */
const SKIP = /^(id|key|at|pic|up|look|src|url|href|cover|color|colour|codes?|layout|respond|tone|size|t|k|v|video|image|bg|by|made|unit)$/i;
export function lessonText(obj, max) {
  const out = [];
  let n = 0;
  const lim = max || 9000;
  const walk = (v, key, depth) => {
    if (n > lim || depth > 7 || v == null) return;
    if (typeof v === 'string') { const t = v.replace(/\s+/g, ' ').trim(); if (t && !/^https?:\/\//.test(t) && t.length > 1) { out.push(t); n += t.length + 1; } return; }
    if (typeof v === 'number') return;
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key, depth + 1)); return; }
    if (typeof v === 'object') Object.keys(v).forEach((k) => { if (!SKIP.test(k)) walk(v[k], k, depth + 1); });
  };
  walk(obj, '', 0);
  return out.join('\n').slice(0, lim);
}
