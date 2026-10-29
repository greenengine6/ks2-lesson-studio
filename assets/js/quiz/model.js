/* Quizzes: the one shape every part of the site shares (the quiz maker, the team board game, practise on the board
   and live play on pupils' devices), and the checks that keep a quiz fair: every question asked in words, one right
   answer, no repeated options.

   { v: 1, title, topic, subject, year,
     questions: [{ id, type: 'mcq' | 'tf' | 'type', q, opts: [...], a, alt: [...], why, secs, pts, pic }],
     settings: { secs, shuffle, speedBonus }, from: { key, title } | null }
   mcq: 2 to 4 options, a = the index of the right one. tf: opts ['True', 'False'], a = 0 (true) or 1 (false).
   type: opts [], a = the expected text, alt = other answers that also count. secs 5 to 120, pts 100 to 2000,
   pic: a Wikipedia picture (pics.js keepPic) or null. */
import { str, arr, num, clamp, uid, houseFix, normAnswer } from '../core.js?v=de4f9a51';
import { safePic, keepPic } from '../pics.js?v=de4f9a51';
import { subjectOf, yearOf } from '../library.js?v=de4f9a51';

export const TYPES = [['mcq', 'Multiple choice'], ['tf', 'True or false'], ['type', 'Type the answer']];
export const TYPE_NAME = { mcq: 'Multiple choice', tf: 'True or false', type: 'Type the answer' };
export const SECS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
export const PTS = [[500, 'Half points (500)'], [1000, 'Points (1,000)'], [2000, 'Double points (2,000)']];
export const LETTERS = 'ABCD';
export const MAXQ = 40;
export const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
export const OPT_COLOURS = ['#4F46E5', '#1F7A75', '#A44F0F', '#7E3FAF'];       // AA with white text, as on pupils' phones

const nearest = (v, list) => list.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b), list[0]);
export const secsOf = (v, d) => nearest(clamp(num(v, d || 20), 5, 120), SECS);
export const ptsOf = (v) => clamp(Math.round(num(v, 1000) / 100) * 100, 100, 2000);
/* Two options are "the same" when they read the same, ignoring case, spaces and a full stop at the end. */
export const sameText = (a, b) => {
  const n = (s) => str(s).toLowerCase().replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').replace(/[.!]+$/, '').trim();
  return !!n(a) && n(a) === n(b);
};

export function blankQuestion(type, base) {
  const t = TYPE_NAME[type] ? type : 'mcq';
  return {
    id: uid('q'), type: t, q: '', opts: t === 'mcq' ? ['', '', '', ''] : t === 'tf' ? ['True', 'False'] : [],
    a: t === 'type' ? '' : (t === 'tf' ? 0 : -1), alt: [], why: '', secs: secsOf(base && base.secs, 20), pts: 1000, pic: null
  };
}

/* A question from anywhere (the engine, a saved quiz, an edit) made safe and predictable. */
export function normQuestion(raw, defSecs) {
  if (!raw || typeof raw !== 'object') return null;
  raw = houseFix(raw);
  let type = str(raw.type).toLowerCase().replace(/[^a-z/ ]/g, '');
  const rawOpts = Array.isArray(raw.opts) ? raw.opts : Array.isArray(raw.options) ? raw.options : [];
  if (['multiple', 'choice', 'multiple choice', 'multiplechoice', 'mc', 'abcd'].includes(type)) type = 'mcq';
  else if (['truefalse', 'true/false', 'true or false', 'true false', 'boolean', 'tf'].includes(type)) type = 'tf';
  else if (['short', 'text', 'typed', 'type the answer', 'type', 'open', 'answer'].includes(type)) type = 'type';
  if (!TYPE_NAME[type]) type = rawOpts.length >= 2 ? 'mcq' : 'type';
  const id = /^[A-Za-z0-9_-]{2,24}$/.test(str(raw.id)) ? str(raw.id) : uid('q');
  const q = {
    id, type, q: str(raw.q != null ? raw.q : raw.question).slice(0, 240), opts: [], a: -1, alt: [],
    why: str(raw.why != null ? raw.why : raw.explanation).slice(0, 320), secs: secsOf(raw.secs, defSecs || 20), pts: ptsOf(raw.pts),
    pic: safePic(raw.pic) ? keepPic(raw.pic) : null
  };
  const ans = raw.a != null ? raw.a : raw.answer;
  if (type === 'mcq') {
    q.opts = rawOpts.map((x) => str(x).slice(0, 120)).slice(0, 4);
    while (q.opts.length < 2) q.opts.push('');
    let a = ans;
    if (typeof a === 'string') {                     // a string is most likely the option itself, then a letter, then a position
      const t = a.trim(), byText = q.opts.findIndex((o) => sameText(o, t));
      a = byText >= 0 ? byText : /^[A-D]$/i.test(t) ? LETTERS.indexOf(t.toUpperCase()) : /^\d+$/.test(t) ? Number(t) : -1;
    }
    a = Math.round(num(a, -1));
    q.a = a >= 0 && a < q.opts.length ? a : -1;
  } else if (type === 'tf') {
    q.opts = ['True', 'False'];
    let a = ans;
    if (typeof a === 'boolean') a = a ? 0 : 1;
    else if (typeof a === 'string') a = /^(t|true|yes)$/i.test(a.trim()) ? 0 : /^(f|false|no)$/i.test(a.trim()) ? 1 : Math.round(num(a, -1));
    else a = Math.round(num(a, -1));
    q.a = a === 0 || a === 1 ? a : -1;
  } else {
    q.a = str(ans).slice(0, 80);
    q.alt = arr(raw.alt != null ? raw.alt : raw.accept).map((x) => str(x).slice(0, 80)).filter((x) => x && !sameText(x, q.a)).slice(0, 6);
  }
  return q;
}

/* What still needs fixing before a question can be played, in plain words (empty when it is ready). */
export function problems(q) {
  const out = [];
  if (!q) return ['This question is empty.'];
  if (!str(q.q)) out.push('Type the question.');
  if (q.type === 'mcq') {
    const filled = q.opts.map((o, i) => [str(o), i]).filter((x) => x[0]);
    if (filled.length < 2) out.push('Write at least two options.');
    for (let i = 0; i < filled.length; i++) for (let j = i + 1; j < filled.length; j++) if (sameText(filled[i][0], filled[j][0])) { out.push('Two options are the same.'); i = filled.length; break; }
    if (q.a < 0 || !str(q.opts[q.a])) out.push('Tick the right answer.');
  } else if (q.type === 'tf') {
    if (q.a !== 0 && q.a !== 1) out.push('Choose whether it is true or false.');
  } else if (!str(q.a)) out.push('Type the answer pupils should give.');
  return out;
}
/* Gentle advice that does not stop play. */
export function notes(q) {
  const out = [];
  if (q && q.type === 'type' && str(q.a).length > 40) out.push('Short answers are easier to mark: a word, a number or a short phrase.');
  if (q && q.type === 'mcq' && q.opts.filter((o) => str(o)).length === 2) out.push('Two options give a one-in-two guess. Three or four options are fairer.');
  return out;
}

export function normQuiz(raw, meta) {
  raw = raw && typeof raw === 'object' ? houseFix(raw) : {};
  const m = meta || {}, set = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const secs = secsOf(set.secs, 20);
  const seen = new Set();
  const questions = arr(raw.questions).map((x) => normQuestion(x, secs)).filter((q) => {
    if (!q) return false;
    if (seen.has(q.id)) q.id = uid('q');
    seen.add(q.id);
    return true;
  }).slice(0, MAXQ);
  const from = raw.from && typeof raw.from === 'object' && str(raw.from.key) ? { key: str(raw.from.key).slice(0, 80), title: str(raw.from.title).slice(0, 120) } : null;
  return {
    v: 1, title: str(raw.title || m.title).slice(0, 100), topic: str(raw.topic || m.topic).slice(0, 120),
    subject: subjectOf(raw.subject || m.subject) || 'general', year: yearOf(raw.year || m.year) || '',
    questions, settings: { secs, shuffle: !!set.shuffle, speedBonus: set.speedBonus !== false }, from
  };
}

/* Take the empty options out of a multiple-choice question; the right answer moves with its option. False when the
   ticked option was empty. */
export function compactOpts(q) {
  if (!q || q.type !== 'mcq') return true;
  const keep = q.opts.map((o, i) => [str(o), i]).filter((x) => x[0]);
  const a = keep.findIndex((x) => x[1] === q.a);
  q.opts = keep.map((x) => x[0]);
  q.a = a;
  return a >= 0;
}
/* The quiz as it is played: only the questions that are ready, empty options taken out (the right answer moves with
   them). Returns { quiz, skipped }. */
export function playable(quiz) {
  const out = JSON.parse(JSON.stringify(quiz));
  let skipped = 0;
  out.questions = quiz.questions.filter((q) => { if (problems(q).length) { skipped++; return false; } return true; }).map((q) => {
    const c = JSON.parse(JSON.stringify(q));
    if (c.type === 'mcq') {
      const keep = c.opts.map((o, i) => [str(o), i]).filter((x) => x[0]);
      c.a = keep.findIndex((x) => x[1] === q.a);
      c.opts = keep.map((x) => x[0]);
    }
    return c;
  });
  return { quiz: out, skipped };
}

/* Is a typed answer right? The expected answer or one of the others, the same words, the same number, ignoring case. */
export function typedRight(q, given) {
  const g = normAnswer(given);
  if (!g) return false;
  return [q.a].concat(q.alt || []).some((x) => {
    const e = normAnswer(x);
    if (!e) return false;
    if (e === g) return true;
    const n = (s) => { const t = s.replace(/[^0-9./-]/g, ''); return t && /\d/.test(t) ? t : ''; };
    return !!n(e) && n(e) === n(g) && n(g) === g.replace(/[a-z]+$/, '');
  });
}
/* The right answer in words, for "Show the answer" and the practise screen. */
export const answerText = (q) => (q.type === 'type' ? str(q.a) + (q.alt && q.alt.length ? ' (also: ' + q.alt.join(', ') + ')' : '') : str(q.opts[q.a]));
/* How hard a question looks, 1 to 3, for the board game's points: longer questions, more options and typed answers count more. */
export function difficulty(q) {
  let d = 1;
  if (q.type === 'type') d += 1;
  if (q.type === 'mcq' && q.opts.filter((o) => str(o)).length >= 4) d += 0.5;
  if (str(q.q).length > 90) d += 0.5;
  if (q.secs >= 45) d += 0.5;
  return clamp(Math.round(d), 1, 3);
}
