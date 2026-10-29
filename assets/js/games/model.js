/* Games: the shape of a game, checked strictly (what the engine writes is never trusted as it is), and the ready
   example. This file imports nothing from the main site except fractions.js, so the pupils' page can use it too.

   game = { v: 1, template, title, topic, subject, year, settings: { seconds, lives, speed }, content, html }
   pop     content { rule, items: [{ text, ok }] }                       balloons float up: pop the ones that fit the rule
   pairs   content { prompt, pairs: [[a, b]] }                           tap the two halves of each pair
   sort    content { prompt, groups: [names], items: [{ text, group }] } put each item in its group
   race    content { questions: [{ q, opts, a }], teams: [names] }      teams race to the finish, a step for each right answer
   memory  content { prompt, pairs: [[a, b]] }                           flip the cards to find the pairs
   custom  html: one whole HTML document the engine wrote. It only ever runs inside games/run.html, a locked box. */
import { fracNorm } from '../fractions.js?v=73f756c9';

export const TEMPLATES = [
  { id: 'pop', name: 'Balloon pop', blurb: 'Balloons float up. Pop only the ones that fit the rule.' },
  { id: 'pairs', name: 'Match pairs', blurb: 'Tap the two halves of each pair: a word and its meaning, a sum and its answer.' },
  { id: 'sort', name: 'Sort it', blurb: 'Drag each one into the right group, then check.' },
  { id: 'race', name: 'Quiz race', blurb: 'Teams race to the finish. Every right answer is a step forward.' },
  { id: 'memory', name: 'Memory', blurb: 'Flip the cards two at a time to find the pairs.' },
  { id: 'custom', name: 'Something new', blurb: 'Describe any game you like. Symphony writes it from scratch.' }
];
export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
export const TEAM_NAMES = ['Tigers', 'Eagles', 'Dolphins', 'Owls'];
const DEF = {
  pop: { seconds: 60, lives: 3, speed: 3 },
  pairs: { seconds: 0, lives: 0, speed: 3 },
  sort: { seconds: 0, lives: 0, speed: 3 },
  race: { seconds: 90, lives: 0, speed: 3 },
  memory: { seconds: 0, lives: 0, speed: 3 },
  custom: { seconds: 0, lives: 0, speed: 3 }
};

/* ---------------- small helpers ---------------- */
const arr = (x) => (Array.isArray(x) ? x : []);
/* Plain one-line text: no control characters, single spaces, ½ written as 1/2, cut to max characters. */
export function clean(x, max) {
  const t = typeof x === 'string' ? x : typeof x === 'number' && Number.isFinite(x) ? String(x) : '';
  return fracNorm(t.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, max || 200).trim();
}
const low = (s) => s.toLowerCase();
function uniq(list) { const seen = new Set(); return list.filter((s) => { const k = low(s); if (!s || seen.has(k)) return false; seen.add(k); return true; }); }
function int(v, lo, hi, d) { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; }
function pairOf(p, max) {
  if (Array.isArray(p)) return [clean(p[0], max), clean(p[1], max)];
  if (p && typeof p === 'object') return [clean(p.a != null ? p.a : p.left, max), clean(p.b != null ? p.b : p.right, max)];
  return ['', ''];
}

/* ---------------- each template's content ---------------- */
const CHECK = {
  pop(c) {
    const seen = new Set();
    const items = arr(c.items).map((x) => ({ text: clean(x && (x.text != null ? x.text : x.label), 24), ok: !!(x && (x.ok === true || x.ok === 'true' || x.ok === 1)) }))
      .filter((x) => { const k = low(x.text); if (!x.text || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 40);
    const yes = items.filter((x) => x.ok).length;
    if (items.length < 6 || yes < 2 || items.length - yes < 2) return null;
    return { rule: clean(c.rule, 90) || 'Pop the right balloons', items };
  },
  pairs(c) { return pairsOf(c, 10, 60, 'Match the pairs'); },
  memory(c) { return pairsOf(c, 12, 40, 'Find the pairs'); },
  sort(c) {
    const groups = uniq(arr(c.groups).map((g) => clean(g, 24))).slice(0, 4);
    if (groups.length < 2) return null;
    const idx = (g) => { if (typeof g === 'number' || /^\d+$/.test(String(g))) { const n = Number(g); return n >= 0 && n < groups.length ? n : -1; } const t = low(clean(g, 24)); return groups.findIndex((x) => low(x) === t); };
    const seen = new Set();
    const items = arr(c.items).map((x) => ({ text: clean(x && x.text, 40), group: idx(x && x.group) }))
      .filter((x) => { const k = low(x.text); if (!x.text || x.group < 0 || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 30);
    if (items.length < 4 || groups.some((g, i) => !items.some((x) => x.group === i))) return null;
    return { prompt: clean(c.prompt, 90) || 'Put each one in the right group', groups, items };
  },
  race(c) {
    const questions = arr(c.questions).map((q) => {
      if (!q || typeof q !== 'object') return null;
      const raw = arr(q.opts || q.options).map((o) => clean(o, 60));
      let a = Number(q.a);
      const right = Number.isInteger(a) && a >= 0 && a < raw.length ? raw[a] : clean(q.a != null ? q.a : q.answer, 60);
      const opts = uniq(raw).slice(0, 4);
      a = opts.findIndex((o) => low(o) === low(right || ''));
      const text = clean(q.q || q.question, 160);
      return text && opts.length >= 2 && a >= 0 ? { q: text, opts, a } : null;
    }).filter(Boolean).slice(0, 20);
    if (questions.length < 3) return null;
    let teams = uniq(arr(c.teams).map((t) => clean(t, 20))).slice(0, 4);
    if (teams.length < 2) teams = TEAM_NAMES.slice(0, 4);
    return { questions, teams };
  }
};
function pairsOf(c, maxPairs, maxLen, prompt) {
  const L = new Set(), R = new Set();
  const pairs = arr(c.pairs).map((p) => pairOf(p, maxLen)).filter((p) => {
    const a = low(p[0]), b = low(p[1]);
    if (!a || !b || a === b || L.has(a) || R.has(b) || L.has(b) || R.has(a)) return false;
    L.add(a); R.add(b); return true;
  }).slice(0, maxPairs);
  if (pairs.length < 3) return null;
  return { prompt: clean(c.prompt, 90) || prompt, pairs };
}

/* ---------------- a custom game's HTML ---------------- */
/* Only the document itself: no <base>, no automatic redirects, a sensible size. The locked box (games/run.html) is
   what keeps it safe: no network, no storage, no way out. */
export function cleanHTML(h) {
  let t = typeof h === 'string' ? h : '';
  const i = t.search(/<!doctype html|<html[\s>]/i);
  if (i > 0) t = t.slice(i);
  const j = t.toLowerCase().lastIndexOf('</html>');
  if (j >= 0) t = t.slice(0, j + 7);
  t = t.replace(/<meta[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*>/gi, '').replace(/<base\b[^>]*>/gi, '').trim();
  if (t.length < 200 || t.length > 120000 || !/<script[\s>]/i.test(t)) return '';
  if (!/^<!doctype/i.test(t)) t = '<!doctype html>\n' + t;
  return t;
}

/* ---------------- the whole game ---------------- */
export function normSettings(s, template) {
  s = s && typeof s === 'object' ? s : {};
  const d = DEF[template] || DEF.pop;
  const seconds = int(s.seconds, 0, 600, d.seconds);
  return {
    seconds: template === 'pop' ? Math.max(20, seconds || d.seconds) : seconds === 0 ? 0 : Math.max(20, seconds),
    lives: int(s.lives, 0, 5, d.lives),
    speed: int(s.speed, 1, 5, d.speed)
  };
}
/* A checked copy of a game, or null when it cannot be played. base fills anything missing (when changing a game). */
export function normGame(raw, base) {
  if (!raw || typeof raw !== 'object') return null;
  base = base && typeof base === 'object' ? base : {};
  const template = TEMPLATE_BY_ID[raw.template] ? raw.template : TEMPLATE_BY_ID[base.template] ? base.template : '';
  if (!template) return null;
  const g = {
    v: 1, template,
    title: clean(raw.title, 80) || clean(base.title, 80) || TEMPLATE_BY_ID[template].name,
    topic: clean(raw.topic, 120) || clean(base.topic, 120),
    subject: clean(raw.subject, 40) || clean(base.subject, 40),
    year: clean(raw.year, 20) || clean(base.year, 20),
    settings: normSettings(raw.settings || base.settings, template),
    content: {},
    html: ''
  };
  if (template === 'custom') { g.html = cleanHTML(raw.html); return g.html ? g : null; }
  const c = CHECK[template](raw.content && typeof raw.content === 'object' ? raw.content : {});
  if (!c) return null;
  g.content = c;
  return g;
}
/* How many things are in it (for My subjects). */
export function itemCount(g) {
  if (!g || !g.content) return 0;
  const c = g.content;
  if (g.template === 'pop') return arr(c.items).length;
  if (g.template === 'pairs' || g.template === 'memory') return arr(c.pairs).length;
  if (g.template === 'sort') return arr(c.items).length;
  if (g.template === 'race') return arr(c.questions).length;
  return 1;
}

/* ---------------- the example, ready to play before anything is made ---------------- */
export function exampleGame() {
  return normGame({
    template: 'pop', title: 'Fraction balloon pop', topic: 'Equivalent fractions', subject: 'maths', year: 'Year 4',
    settings: { seconds: 60, lives: 3, speed: 2 },
    content: {
      rule: 'Pop the balloons equal to 1/2',
      items: [
        { text: '2/4', ok: true }, { text: '4/8', ok: true }, { text: '5/10', ok: true }, { text: '3/6', ok: true }, { text: '6/12', ok: true }, { text: '10/20', ok: true }, { text: '50/100', ok: true },
        { text: '1/3', ok: false }, { text: '3/5', ok: false }, { text: '2/3', ok: false }, { text: '1/4', ok: false }, { text: '3/4', ok: false }, { text: '4/6', ok: false }, { text: '5/8', ok: false }, { text: '2/5', ok: false }
      ]
    }
  });
}
