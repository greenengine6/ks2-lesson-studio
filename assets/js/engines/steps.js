/* Engine 7: Step-by-Step (SEND and EAL). Breaks any task into small timed steps with a Now / Next / Then strip,
   tick-off checklist, word bank (with home-language words for EAL), sentence starters and support ideas. */
import { esc, str, arr, strs, num, clamp, icon, toast, $ } from '../core.js?v=5e78cc38';
import { B, chime } from './shared.js?v=5e78cc38';
import { buildPrompt } from './prompt.js?v=5e78cc38';

const NEEDS = ['Attention (ADHD)', 'Dyslexia', 'Autism', 'Working memory', 'EAL', 'Anxiety', 'Fine motor'];

const EXAMPLE = {
  title: 'Diary of a Roman soldier',
  simple: 'Write a diary entry as a Roman soldier on your first day at Hadrian’s Wall.',
  nowNext: { now: 'Plan your ideas', next: 'Write your diary', then: 'Check and share' },
  steps: [
    { text: 'Look at the word bank', detail: 'Choose 3 words you want to use.', minutes: 3, icon: '👀' },
    { text: 'Plan in 3 boxes', detail: 'Box 1: arriving. Box 2: what you see. Box 3: how you feel.', minutes: 5, icon: '🗂️' },
    { text: 'Start with the date and “Dear Diary”', detail: 'Use a sentence starter if you like.', minutes: 2, icon: '📅' },
    { text: 'Write 3 to 5 sentences', detail: 'Use “I” and the past tense: I marched, I saw, I felt.', minutes: 10, icon: '✏️' },
    { text: 'Add a feeling word', detail: 'Use one word from the feelings list.', minutes: 2, icon: '💬' },
    { text: 'Check your work', detail: 'Capital letters, full stops, and does it make sense?', minutes: 3, icon: '✅' }
  ],
  wordBank: [
    { word: 'wall', meaning: 'a long, tall barrier made of stone', translation: 'mur' },
    { word: 'soldier', meaning: 'a person who fights in an army', translation: 'żołnierz' },
    { word: 'freezing', meaning: 'very, very cold', translation: 'lodowaty' },
    { word: 'march', meaning: 'to walk in step, like a soldier', translation: 'maszerować' },
    { word: 'fort', meaning: 'a strong building where soldiers live', translation: 'fort' },
    { word: 'homesick', meaning: 'sad because you miss your home', translation: 'stęskniony za domem' }
  ],
  starters: ['Dear Diary, today I arrived at…', 'The wall was…', 'I felt… because…', 'Tomorrow I will…'],
  successCriteria: ['I can write as “I” (first person).', 'I can write in the past tense.', 'I can describe what I saw.', 'I can say how I felt and why.'],
  supports: [
    { need: 'Attention (ADHD)', ideas: ['Show one step at a time and tick it off together.', 'Use the step timer so the end is always in sight.', 'Give a 1-minute movement break between planning and writing.'] },
    { need: 'Dyslexia', ideas: ['Give the word bank on paper as a word mat.', 'Accept a voice note or a scribe for the plan.', 'Use a cream or pastel background and a clear font.'] },
    { need: 'EAL', ideas: ['Pre-teach the word bank with pictures and the Polish words.', 'Let pupils plan in Polish first, then write in English.', 'Say one model sentence aloud and let them adapt it.'] }
  ],
  breaks: ['March on the spot for 20 seconds like a Roman soldier.', 'Shake out your writing hand, then draw a big circle in the air.', 'Three slow breaths: in through the nose, out through the mouth.'],
  teacherScript: 'Today you are a Roman soldier who has just arrived at Hadrian’s Wall. It is cold and far from home. We will do this in small steps. Step 1 is on the screen now. When you finish a step, give me a thumbs up.',
  language: 'Polish'
};

function prompt(input, mode) {
  const needs = input.needs.length ? input.needs.join(', ') : 'a mixed class';
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Make this task accessible by breaking it into small, clear steps (an executive-function scaffold). The task the teacher wants pupils to do:',
      '"""' + input.task + '"""',
      'Plan supports for these needs: ' + needs + '.' + (input.needs.includes('EAL') && input.language ? ' Home language for the word bank translations: ' + input.language + '.' : ''),
      'Keep the learning the same as the original task; only make it easier to start, follow and finish.'
    ].join('\n'),
    rules: [
      '4 to 7 steps. Each step: a short action (under 8 words), one detail sentence, realistic minutes, and one simple emoji icon.',
      'simple is the whole task in one plain-English sentence (under 20 words).',
      'nowNext names the first three stages in 2 to 4 words each.',
      'wordBank: 5 or 6 key words with very simple meanings.' + (input.needs.includes('EAL') && input.language ? ' Add "translation" in ' + input.language + ' (one word or a short phrase). Be accurate.' : ' Leave "translation" as an empty string.'),
      'supports: one entry for each selected need, with 3 practical ideas a teacher can do online or in class tomorrow.',
      'Use calm, encouraging language. Never label or describe pupils by their needs on anything pupils see.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const steps = arr(raw.steps).map((s) => ({ text: str(s && s.text), detail: str(s && s.detail), minutes: clamp(Math.round(num(s && s.minutes, 3)), 1, 30), icon: str(s && s.icon).slice(0, 4) || '•' })).filter((s) => s.text).slice(0, 8);
  if (steps.length < 2) return null;
  const nn = raw.nowNext || {};
  return {
    title: str(raw.title) || 'My task', simple: str(raw.simple) || input.task,
    nowNext: { now: str(nn.now) || steps[0].text, next: str(nn.next) || (steps[1] || {}).text || '', then: str(nn.then) || (steps[2] || {}).text || '' },
    steps,
    wordBank: arr(raw.wordBank).map((w) => ({ word: str(w && w.word), meaning: str(w && w.meaning), translation: str(w && w.translation) })).filter((w) => w.word).slice(0, 8),
    starters: strs(raw.starters, 6), successCriteria: strs(raw.successCriteria, 6),
    supports: arr(raw.supports).map((s) => ({ need: str(s && s.need), ideas: strs(s && s.ideas, 5) })).filter((s) => s.need).slice(0, 8),
    breaks: strs(raw.breaks, 5), teacherScript: str(raw.teacherScript), language: str(raw.language) || (input.needs.includes('EAL') ? input.language : '')
  };
}

const screens = (eng) => [
  {
    title: 'My task',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'My task', icon: 'flag', say: 'react', title: d.simple });
      B.body(board).innerHTML = '<div class="nnt" style="margin-top:auto;margin-bottom:auto">' + [['Now', d.nowNext.now, ' now'], ['Next', d.nowNext.next, ''], ['Then', d.nowNext.then, '']].map((x) => '<div class="t' + x[2] + '"><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>').join('') + '</div>' +
        '<div class="t in" style="font-size:calc(1.8 * var(--u))"><b class="b-mark">Remember:</b> one step at a time. Give a thumbs up when you finish each step.</div>';
    }
  },
  {
    title: 'Steps',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.steps || (ctx.state.steps = { done: {} });
      board.innerHTML = B.pad(eng, { kick: 'One step at a time', icon: 'steps', say: 'react', title: '', foot: '<span class="sleft"></span><button type="button" class="b-btn go" data-timer>' + icon('clock') + '<span>Start step timer</span></button>' });
      const body = B.body(board);
      let tid = 0, left = 0;
      const now = () => d.steps.findIndex((s, i) => !st.done[i]);
      const paint = () => {
        const n = now();
        body.innerHTML = '<div class="nnt">' + [['Now', n], ['Next', n + 1], ['Then', n + 2]].map((x, k) => '<div class="t' + (k === 0 ? ' now' : '') + '"><span>' + x[0] + '</span><b>' + esc(n >= 0 && d.steps[x[1]] ? d.steps[x[1]].text : k === 0 ? 'All done!' : '—') + '</b></div>').join('') + '</div>' +
          '<ol class="stp">' + d.steps.map((s, i) => '<li class="t' + (st.done[i] ? ' done' : '') + (i === n ? ' now' : '') + '"><button type="button" class="tick" data-i="' + i + '" aria-pressed="' + !!st.done[i] + '" aria-label="Step ' + (i + 1) + ' done">' + icon('check') + '</button><span class="em" aria-hidden="true">' + esc(s.icon) + '</span><span class="st"><b>' + esc(s.text) + '</b><span>' + esc(s.detail) + '</span></span><span class="min">' + s.minutes + ' min</span></li>').join('') + '</ol>';
        body.querySelectorAll('.tick').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.i); st.done[i] = !st.done[i]; stop(); paint(); }));
        B.fit(body.querySelector('.stp'), 0.62);
        const total = d.steps.reduce((a, s, i) => a + (st.done[i] ? 0 : s.minutes), 0);
        board.querySelector('.sleft').textContent = n < 0 ? 'Every step done. Brilliant!' : total + ' minutes of work left';
      };
      const tb = board.querySelector('[data-timer]');
      const stop = () => { clearInterval(tid); tid = 0; $('span', tb).textContent = 'Start step timer'; };
      tb.addEventListener('click', () => {
        if (tid) { stop(); return; }
        const n = now(); if (n < 0) return;
        left = d.steps[n].minutes * 60;
        const show = () => { $('span', tb).textContent = 'Step ' + (n + 1) + ': ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); };
        show();
        tid = setInterval(() => { left--; if (left <= 0) { stop(); chime(); toast('Time for step ' + (n + 1) + ' is up. Tick it off when it is done.'); return; } show(); }, 1000);
      });
      ctx.cleanup = () => stop();
      paint();
    }
  },
  {
    title: 'Word bank',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: d.language ? 'Word bank · ' + d.language : 'Word bank', icon: 'reading', say: 'think', title: 'Words to help you' });
      B.body(board).innerHTML = '<div class="wb" style="--cols:' + (d.wordBank.length > 4 ? 3 : 2) + '">' + d.wordBank.map((w) => '<div class="t"><b>' + esc(w.word) + '</b><span>' + esc(w.meaning) + '</span>' + (w.translation ? '<em lang="' + esc(langCode(d.language)) + '">' + esc(w.translation) + '</em>' : '') + '</div>').join('') + '</div>';
    }
  },
  {
    title: 'Help to write',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Help to write', icon: 'wand', say: 'show', title: 'You can use these' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1"><div class="t"><h4>' + icon('wand') + 'Sentence starters</h4>' + B.list(d.starters) + '</div><div class="t in"><h4>' + icon('check') + 'I can…</h4><ul class="sc-check">' + d.successCriteria.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul></div></div>';
    }
  }
];
const LANGS = { polish: 'pl', urdu: 'ur', punjabi: 'pa', arabic: 'ar', romanian: 'ro', portuguese: 'pt', spanish: 'es', french: 'fr', bengali: 'bn', somali: 'so', ukrainian: 'uk', turkish: 'tr', gujarati: 'gu', tamil: 'ta', lithuanian: 'lt', italian: 'it', chinese: 'zh', mandarin: 'zh', farsi: 'fa', persian: 'fa', pashto: 'ps', hindi: 'hi' };
function langCode(name) { return LANGS[str(name).toLowerCase()] || 'und'; }

const eng = {
  id: 'steps', name: 'Step-by-Step', short: 'SEND / EAL', color: 'plum', icon: 'steps',
  kicker: 'Inclusion · SEND and EAL', tagline: 'Paste any task: get small timed steps, a Now / Next / Then strip and a word bank.',
  about: 'Paste any task. Get it broken into small timed steps with a Now / Next / Then strip, a tick-off checklist, a word bank (with home-language words for EAL) and support ideas for each need.',
  chips: ['Any subject', 'SEND and EAL', 'Executive function'], cta: 'Break it down', savedLabel: 'task plans',
  sym: { hello: 'Paste the <b>task</b> you are setting. I’ll break it into small steps so every pupil can start, keep going and finish.', thinking: 'Breaking the task into small steps…', done: 'Present the Steps screen and tick each step off together.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 5' },
    { id: 'task', type: 'textarea', label: 'The task', required: true, rows: 4, placeholder: 'Paste the activity instructions, for example: Write a diary entry as a Roman soldier arriving at Hadrian’s Wall.', tip: 'Paste the instructions exactly as you would give them to the class.', missing: 'Paste the task you are setting first.' },
    { id: 'needs', type: 'multi', label: 'Plan support for', options: NEEDS, value: ['Attention (ADHD)', 'Dyslexia', 'EAL'], tip: 'Choose any that apply. Nothing about pupils’ needs is shown on the class screens.',
      onChange: (input, root) => { const f = root.querySelector('[data-field="language"]'); if (f) f.closest('.fld').hidden = !input.needs.includes('EAL'); } },
    { id: 'language', type: 'text', label: 'Home language (for EAL)', optional: true, placeholder: 'For example: Polish', chips: ['Polish', 'Urdu', 'Punjabi', 'Arabic', 'Romanian', 'Ukrainian'] }
  ],
  example: { input: { year: 'Year 5', task: 'Write a diary entry as a Roman soldier arriving at Hadrian’s Wall.', needs: ['Attention (ADHD)', 'Dyslexia', 'EAL'], language: 'Polish' }, data: EXAMPLE },
  progress: [['title', 'Reading the task'], ['steps', 'Breaking it into steps'], ['wordBank', 'Building the word bank'], ['supports', 'Planning support for each need'], ['teacherScript', 'Writing what to say']],
  maxTokens: 3500,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, input && input.needs && input.needs.join(', ')].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'What to say', icon: 'chat', text: d.teacherScript, full: true },
      ...d.supports.map((s) => ({ h: 'Support: ' + s.need, icon: 'heart', list: s.ideas })),
      { h: 'Movement breaks', icon: 'bolt', list: d.breaks },
      { h: 'Steps and timings', icon: 'clock', list: d.steps.map((s) => s.text + ' (' + s.minutes + ' min): ' + s.detail), ordered: true },
      d.language ? { h: 'About the translations', icon: 'info', text: 'The ' + d.language + ' words were written by AI. If you can, check them with a fluent speaker, a family or a colleague before relying on them.' } : null
    ];
  },
  chat(d) {
    return {
      title: d.simple, sub: 'One step at a time. Give a thumbs up when you finish each step.',
      sections: [{ h: 'Steps', list: d.steps.map((s) => s.icon + ' ' + s.text + ' (' + s.minutes + ' min)'), ordered: true }, { h: 'Word bank', list: d.wordBank.map((w) => w.word + ': ' + w.meaning + (w.translation ? ' (' + w.translation + ')' : '')) }, { h: 'Sentence starters', list: d.starters }]
    };
  }
};
export default eng;
