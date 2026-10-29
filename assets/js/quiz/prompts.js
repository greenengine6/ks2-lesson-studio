/* What the quiz maker asks the engine for: a whole quiz from a topic or from a lesson, more questions like the
   ones she has, and one question changed in her own words. Every reply is JSON, checked again by model.js. */
import { HOUSE_WORDS, str, arr } from '../core.js?v=de4f9a51';
import { match, SUBJECT_BY_ID } from '../lkie/curriculum.js?v=de4f9a51';
import { subjectName } from '../library.js?v=de4f9a51';

export const QUIZ_SYSTEM = [
  'You write quizzes for Key Stage 2 pupils (Years 3 to 6, ages 7 to 11) at an international school in Ipoh, Malaysia, that follows the National Curriculum in England.',
  'Write in British English, in short, clear sentences a child of that age can read.',
  HOUSE_WORDS,
  'Rules for every question:',
  '- It tests one idea from the topic, at the right level for the year group.',
  '- Multiple choice: exactly one right answer. Every wrong option is a mistake pupils really make (a misconception or a common slip), never a silly or joke answer. Options are alike in length and form. Never "all of the above" or "none of the above". Put the right answer in different positions across the quiz.',
  '- True or false: the statement is clearly true or clearly false. No trick wording, no double negatives. Mix true and false.',
  '- Type the answer: the answer is one word, one number or a very short phrase. List the other ways of writing it that should also count (for example "15" and "fifteen").',
  '- "why": one or two short sentences a teacher can read out: why the right answer is right and, for multiple choice, the slip behind each wrong option.',
  '- Check every number and fact twice. Fractions are digits with a slash, like 3/4 or 2 1/2.',
  '- Malaysian contexts are welcome (ringgit, local places, foods, festivals). No real people\'s names except well-known people from history. Child-safe content only.',
  'Reply with JSON only, no other text.'
].join('\n');

const SHAPE = '{"title": "a short quiz title", "questions": [{"type": "mcq", "q": "the question", "opts": ["option", "option", "option", "option"], "a": 0, "why": "…"}, {"type": "tf", "q": "a statement", "opts": ["True", "False"], "a": 1, "why": "…"}, {"type": "type", "q": "the question", "opts": [], "a": "the answer", "alt": ["another way to write it"], "why": "…"}]}';
const SHAPE_NOTE = 'For "mcq", "a" is the position of the right option counting from 0. For "tf", "a" is 0 when the statement is true and 1 when it is false. For "type", "a" is the answer itself.';
const LEVELS = {
  start: 'Gentle: for pupils who are still getting started with this. Simple numbers and words, one step each.',
  expected: 'At the expected standard for the year group, easier questions first and a few that make pupils think at the end.',
  depth: 'Greater depth: more reasoning, two-step problems and "which is the odd one out / which is wrong" questions.'
};
function typesText(types) {
  const t = arr(types).filter((x) => ['mcq', 'tf', 'type'].includes(x));
  if (!t.length || (t.length === 1 && t[0] === 'mcq')) return 'All multiple choice, with four options.';
  const words = { mcq: 'multiple choice (four options)', tf: 'true or false', type: 'type the answer' };
  return 'Mostly ' + words[t[0]] + (t.length > 1 ? ', with some ' + t.slice(1).map((x) => words[x]).join(' and some ') : '') + '.';
}
function curriculum(subject, year, topic) {
  if (!SUBJECT_BY_ID[subject]) return '';
  const hits = match(subject, year, topic, 3);
  return hits.length ? 'The National Curriculum statements this quiz should check:\n' + hits.map((o) => '- ' + o.text).join('\n') + '\n' : '';
}

/* A whole quiz from a topic. o: { topic, year, subject, n, types, level } */
export function draftRequest(o) {
  const subj = subjectName(o.subject);
  return 'Write a quiz of exactly ' + o.n + ' questions about "' + str(o.topic) + '" for ' + (o.year || 'Key Stage 2') + (o.subject && o.subject !== 'general' ? ' ' + subj : '') + '.\n' +
    'Question types: ' + typesText(o.types) + '\n' +
    'Level: ' + (LEVELS[o.level] || LEVELS.expected) + '\n' +
    curriculum(o.subject, o.year, o.topic) +
    'The JSON looks like this:\n' + SHAPE + '\n' + SHAPE_NOTE;
}

/* What a saved lesson says, as plain lines for the engine: its title, aim, key words and every question in it. */
export function lessonText(item) {
  const out = [];
  if (!item) return '';
  if (item.slides && item.input) {                          // an lkie.like pack
    out.push('Lesson: ' + str(item.title), 'Aim: ' + str(item.objective));
    if (arr(item.vocab).length) out.push('Key words: ' + item.vocab.map((v) => v.word + (v.meaning ? ' (' + v.meaning + ')' : '')).join('; '));
    arr(item.slides).forEach((s) => {
      if (!s) return;
      if (s.title) out.push('Slide: ' + s.title);
      arr(s.points).forEach((p) => out.push('- ' + p));
      if (s.example) out.push('- Example: ' + s.example);
      if (s.problem) out.push('- Worked example: ' + s.problem + (s.answer ? ' Answer: ' + s.answer : ''));
      arr(s.questions).forEach((q) => out.push('- Question: ' + q.q + (q.a ? ' Answer: ' + q.a : '')));
      if (s.question) out.push('- Check question: ' + s.question + ' Options: ' + arr(s.options).join(' | ') + ' Right: ' + (arr(s.options)[s.answer] || ''));
    });
    const t = item.teacher || {};
    if (arr(t.misconceptions).length) out.push('Common mistakes: ' + t.misconceptions.join('; '));
  } else if (item.deck) {                                     // a Slide Studio lesson
    const d = item.deck;
    out.push('Lesson: ' + str(d.title), 'Aim: ' + str(d.objective));
    if (arr(d.keywords).length) out.push('Key words: ' + d.keywords.map((k) => k.word + (k.meaning ? ' (' + k.meaning + ')' : '')).join('; '));
    arr(d.slides).forEach((s) => {
      if (!s) return;
      if (s.title) out.push('Slide: ' + s.title);
      arr(s.points).forEach((p) => out.push('- ' + p));
      if (s.problem) out.push('- Worked example: ' + s.problem + (s.answer ? ' Answer: ' + s.answer : ''));
      arr(s.questions).forEach((q) => out.push('- Question: ' + q.q + (q.a ? ' Answer: ' + q.a : '')));
      if (s.question) out.push('- Check question: ' + s.question + ' Options: ' + arr(s.options).join(' | '));
    });
    if (d.plan && arr(d.plan.misconceptions).length) out.push('Common mistakes: ' + d.plan.misconceptions.join('; '));
  }
  return out.filter((l) => l && !/^\w+: $/.test(l)).join('\n').slice(0, 9000);
}
/* A whole quiz that checks what a lesson taught. o: { n, types, level, year, subject } */
export function lessonRequest(o, text) {
  return 'Here is a lesson the class has had:\n"""\n' + text + '\n"""\n' +
    'Write a quiz of exactly ' + o.n + ' questions that checks what this lesson taught' + (o.year ? ', for ' + o.year : '') + '. Use the lesson\'s own key words and examples, and new numbers or examples so the questions are not copies of the slides. Where the lesson lists common mistakes, use them as wrong options.\n' +
    'Question types: ' + typesText(o.types) + '\n' +
    'Level: ' + (LEVELS[o.level] || LEVELS.expected) + '\n' +
    'The JSON looks like this:\n' + SHAPE + '\n' + SHAPE_NOTE;
}
/* More questions like the ones she already has. */
export function moreRequest(quiz, n) {
  const have = quiz.questions.filter((q) => str(q.q)).map((q, i) => (i + 1) + '. [' + q.type + '] ' + q.q + (q.type === 'type' ? ' → ' + q.a : q.opts[q.a] ? ' → ' + q.opts[q.a] : '')).join('\n');
  return 'This quiz is about "' + (quiz.topic || quiz.title) + '" for ' + (quiz.year || 'Key Stage 2') + (quiz.subject && quiz.subject !== 'general' ? ' ' + subjectName(quiz.subject) : '') + '. Its questions so far:\n' + have + '\n' +
    'Write ' + n + ' more questions like these: the same topic, level and mix of types, but new ideas, numbers and wording (never a copy of a question above).\n' +
    'The JSON looks like this (the title can stay the same):\n' + SHAPE + '\n' + SHAPE_NOTE;
}
/* One question changed in the teacher's own words. */
export function editRequest(quiz, q, ask) {
  const now = { type: q.type, q: q.q, opts: q.type === 'type' ? [] : q.opts, a: q.a, alt: q.alt, why: q.why };
  return 'A question from a ' + (quiz.year || 'Key Stage 2') + ' quiz about "' + (quiz.topic || quiz.title) + '":\n' + JSON.stringify(now) + '\n' +
    'The teacher asks: "' + str(ask).slice(0, 300) + '"\n' +
    'Change the question as she asks and keep everything else that still fits. Keep exactly one right answer and keep the "why" up to date. ' +
    'You may change the type only if she asks for it. Reply with the one question as JSON in the same shape: {"type": …, "q": …, "opts": […], "a": …, "alt": […], "why": …}. ' + SHAPE_NOTE;
}
