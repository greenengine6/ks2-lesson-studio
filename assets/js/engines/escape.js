/* Engine 8: Escape Room. A story mission where every lock is a card in a CardSwap stack. The class works out
   each code, the teacher types the answer in, and a correct code drops the card away to reveal the next lock. */
import { esc, str, arr, strs, num, clamp, icon, normAnswer } from '../core.js?v=3c9d4698';
import { timesUp } from '../fx/timesup.js?v=3c9d4698';
import { B, chime } from './shared.js?v=3c9d4698';
import { buildPrompt } from './prompt.js?v=3c9d4698';
import { CardSwap } from '../fx/cardswap.js?v=3c9d4698';
import { confetti } from '../fx/particles.js?v=3c9d4698';
import { sfx } from '../fx/audio.js?v=3c9d4698';

const EXAMPLE = {
  title: 'Escape from Space Station Orion',
  theme: 'Space station',
  intro: 'Alarm! The computer on Space Station Orion has locked every door. To reach the escape pod, your crew must crack four codes. Each code is the answer to a maths puzzle. Work together, check carefully, and don’t run out of oxygen!',
  rooms: [
    { name: 'The Airlock', story: 'The first door has a number pad. A message flashes on the screen.', puzzle: 'Round off 3,486,215 to the nearest million.', type: 'number', answer: '3000000', accept: ['3,000,000', '3 million'], hint: 'Look at the hundred thousands digit. Is it 5 or more?', explain: 'The hundred thousands digit is 4, which is less than 5, so 3,486,215 rounded off to the nearest million is 3,000,000.' },
    { name: 'The Control Room', story: 'The lights flicker. The control panel needs the value of a digit.', puzzle: 'What is the value of the digit 7 in 2,745,310?', type: 'number', answer: '700000', accept: ['700,000', 'seven hundred thousand'], hint: 'Say the number aloud. Which column is the 7 in?', explain: 'The 7 is in the hundred thousands column, so its value is 700,000.' },
    { name: 'The Oxygen Garden', story: 'The plants are wilting! The sprinkler code is the next number in the pattern.', puzzle: 'Count back in steps of 25,000: 210,000, 185,000, 160,000, … What comes next?', type: 'number', answer: '135000', accept: ['135,000'], hint: 'Take away 25,000 from 160,000.', explain: '160,000 − 25,000 = 135,000.' },
    { name: 'The Escape Pod', story: 'One last lock! Choose the greatest number to launch the pod.', puzzle: 'Which number is the greatest?', type: 'choice', options: ['4,099,999', '4,190,000', '4,109,999', '4,019,999'], answer: '4,190,000', accept: [], hint: 'They all have 4 millions. Compare the hundred thousands digits, then the ten thousands.', explain: '4,190,000 has 1 hundred thousand and 9 ten thousands: the most of the four.' }
  ],
  finale: 'WHOOSH! The escape pod blasts away from Space Station Orion. Mission Control is cheering. You cracked every code. Brilliant teamwork, astronauts!',
  teacher: {
    routine: [
      'Read the briefing dramatically and press Start the clock.',
      'Show one lock at a time. Pupils solve it on paper, then type the code in the chat when you say “Codes in!”.',
      'Type the most popular answer into the lock. If it is wrong, ask a pupil to explain their method before you give the hint.',
      'After each lock, ask one pupil to explain how they cracked it.',
      'Celebrate the escape. Ask: which lock was hardest, and why?'
    ],
    support: 'Give a place value chart, and let pupils work in pairs in breakout rooms.',
    stretch: 'Pupils design a fifth lock for a partner, with a hint.'
  }
};
const THEMES = ['Space station', 'Pirate island', 'Jungle temple', 'Haunted library', 'Underwater city', 'Dinosaur valley', 'Arctic expedition', 'Toy factory'];

function prompt(input, mode) {
  const n = clamp(parseInt(input.locks, 10) || 4, 3, 6);
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create a gamified escape room for a live lesson. Subject and topic: ' + input.topic + '. Theme: ' + input.theme + '.',
      'Write a short story intro, exactly ' + n + ' rooms (locks) that get gradually harder, and a finale. Each room has a short story line and one puzzle whose answer is the code.',
      'The puzzles must test the topic properly (not general knowledge), at the right level for ' + input.year + '.'
    ].join('\n'),
    rules: [
      'rooms[].type is "number" (answer is digits only, no commas, e.g. "135000"), "word" (a single word or short phrase) or "choice" (give 3 or 4 options and the answer must exactly match one option).',
      'accept lists other ways of writing the same correct answer (e.g. with commas, in words). Never include wrong answers.',
      'Every answer must be correct and unambiguous: only one possible answer per lock. Check each one twice.',
      'hint helps without giving the answer away; explain shows the method in one sentence.',
      'Keep it exciting but never scary.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const rooms = arr(raw.rooms).map((r) => {
    const type = ['number', 'word', 'choice'].includes(str(r && r.type)) ? r.type : 'word';
    const options = strs(r && r.options, 4);
    let answer = str(r && r.answer);
    if (type === 'choice' && /^[0-3]$/.test(answer) && options[Number(answer)] && !options.includes(answer)) answer = options[Number(answer)];
    return { name: str(r && r.name), story: str(r && r.story), puzzle: str(r && r.puzzle), type: type === 'choice' && options.length < 2 ? 'word' : type, options, answer, accept: strs(r && r.accept, 6), hint: str(r && r.hint), explain: str(r && r.explain) };
  }).filter((r) => r.puzzle && r.answer).slice(0, 6);
  if (rooms.length < 2) return null;
  const t = raw.teacher || {};
  const mins = parseInt(input.minutes, 10);
  return {
    title: str(raw.title) || 'Escape room', theme: str(raw.theme) || input.theme, intro: str(raw.intro), rooms, finale: str(raw.finale) || 'You escaped! Brilliant teamwork.',
    minutes: Number.isFinite(mins) ? mins : 0,
    teacher: { routine: strs(t.routine, 8), support: str(t.support), stretch: str(t.stretch) }
  };
}
function correct(room, given) {
  const g = normAnswer(given);
  if (!g) return false;
  return [room.answer].concat(room.accept).some((a) => normAnswer(a) === g);
}
const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.max(0, s) % 60).padStart(2, '0');

const screens = (eng) => [
  {
    title: 'Mission briefing',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.esc || (ctx.state.esc = { solved: 0, tries: {}, hint: {}, left: null });
      board.innerHTML = B.pad(eng, { kick: d.theme || 'Escape room', icon: 'lock', say: 'listen', title: d.title, foot: '<span>' + d.rooms.length + ' locks' + (d.minutes ? ' · ' + d.minutes + ' minutes' : '') + '</span><button type="button" class="b-btn go" data-start>' + icon('play') + (st.left != null ? 'Back to the locks' : 'Start the clock') + '</button>' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="t" style="font-size:calc(2.2 * var(--u) * var(--fs));line-height:1.5;display:grid;align-content:center">' + esc(d.intro) + '</div>' +
        '<div class="t in b-center"><div class="locks">' + d.rooms.map((r, i) => '<i class="' + (i < st.solved ? 'open' : '') + '">' + icon(i < st.solved ? 'unlock' : 'lock') + '</i>').join('') + '</div><p class="b-sub" style="margin:calc(1.2 * var(--u)) 0 0">Crack every code to escape</p></div></div>';
      board.querySelector('[data-start]').addEventListener('click', () => { if (st.left == null) st.left = d.minutes ? d.minutes * 60 : -1; ctx.go(1); });
    }
  },
  {
    title: 'Escape!',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.esc || (ctx.state.esc = { solved: 0, tries: {}, hint: {}, left: null });
      if (st.left == null) st.left = d.minutes ? d.minutes * 60 : -1;
      board.innerHTML = B.pad(eng, { kick: d.theme || 'Escape room', icon: 'lock', say: 'chat', title: d.title });
      const body = B.body(board);
      const todo = d.rooms.map((r, i) => i).filter((i) => i >= st.solved);
      body.innerHTML = '<div class="esc"><div class="esc-stack"><div class="cs-root">' + todo.map((i) => {
        const r = d.rooms[i];
        const answerUI = r.type === 'choice'
          ? '<div class="lk-opts">' + r.options.map((o, k) => '<button type="button" class="b-btn" data-opt="' + esc(o) + '"><b>' + 'ABCD'[k] + '</b>&nbsp; ' + esc(o) + '</button>').join('') + '</div>'
          : '<div class="lk-in"><input type="text" inputmode="' + (r.type === 'number' ? 'numeric' : 'text') + '" autocomplete="off" spellcheck="false" aria-label="Type the code for ' + esc(r.name) + '" placeholder="Type the code"><button type="button" class="b-btn go" data-check>' + icon('unlock') + 'Unlock</button></div>';
        return '<div class="cs-card" data-room="' + i + '"><div class="lk-top"><span class="lk-ico">' + icon('lock') + '</span><span class="lk-name">' + esc(r.name || 'Lock ' + (i + 1)) + '</span><span class="lk-n">Lock ' + (i + 1) + ' of ' + d.rooms.length + '</span></div>' +
          (r.story ? '<p class="lk-story">' + esc(r.story) + '</p>' : '') + '<p class="lk-q">' + esc(r.puzzle) + '</p>' + answerUI + '<div class="lk-msg" aria-live="polite">' + (st.hint[i] ? '<span>Hint: ' + esc(r.hint) + '</span>' : '') + '</div></div>';
      }).join('') + '<div class="cs-card" data-final><div class="finale"><span class="trophy">' + icon('star') + '</span><p class="b-big">You escaped!</p><p>' + esc(d.finale) + '</p></div></div></div></div>' +
        '<div class="esc-side"><div class="t in"><p class="clock-l">' + (st.left >= 0 ? 'Time left' : 'Locks') + '</p><p class="clock">' + (st.left >= 0 ? fmt(st.left) : st.solved + ' / ' + d.rooms.length) + '</p></div>' +
        '<div class="locks">' + d.rooms.map((r, i) => '<i class="' + (i < st.solved ? 'open' : '') + '">' + icon(i < st.solved ? 'unlock' : 'lock') + '</i>').join('') + '</div>' +
        '<button type="button" class="b-btn" data-hint>' + icon('bulb') + 'Show a hint</button><button type="button" class="b-btn" data-skip>' + icon('right') + 'Skip this lock</button></div></div>';
      const root = body.querySelector('.cs-root');
      const w = board.getBoundingClientRect().width || 900;
      const swap = new CardSwap(root, { cardDistance: Math.round(w * 0.022), verticalDistance: Math.round(w * 0.02), auto: false, skewAmount: 3, easing: 'elastic' });
      const clock = body.querySelector('.clock');
      let tid = 0;
      if (st.left > 0 && st.solved < d.rooms.length) tid = setInterval(() => {
        st.left--; clock.textContent = fmt(st.left); clock.classList.toggle('low', st.left <= 60);
        if (st.left <= 0) { clearInterval(tid); clock.textContent = '0:00'; timesUp(); const m = front().querySelector('.lk-msg'); if (m) { m.className = 'lk-msg bad'; m.textContent = 'Out of oxygen! Keep going for glory.'; } }
      }, 1000);
      const front = () => swap.front().el;
      const paintSide = () => {
        body.querySelectorAll('.esc-side .locks i').forEach((x, i) => { x.className = i < st.solved ? 'open' : ''; x.innerHTML = icon(i < st.solved ? 'unlock' : 'lock'); });
        if (st.left < 0) clock.textContent = st.solved + ' / ' + d.rooms.length;
        const done = st.solved >= d.rooms.length;
        body.querySelector('[data-hint]').disabled = done; body.querySelector('[data-skip]').disabled = done;
      };
      const unlock = (card, i) => {
        const msg = card.querySelector('.lk-msg');
        msg.className = 'lk-msg ok'; msg.textContent = 'Unlocked! ' + d.rooms[i].explain;
        card.querySelector('.lk-ico').innerHTML = icon('unlock');
        if (!ctx.still) confetti(ctx.present ? document.getElementById('present') : board, { count: 90, y: 0.5 });
        chime();
        st.solved = i + 1;
        paintSide();
        setTimeout(() => {
          swap.next({ consume: true }).then(() => {
            if (st.solved >= d.rooms.length) { clearInterval(tid); if (!ctx.still) confetti(ctx.present ? document.getElementById('present') : board, { count: 180, y: 0.4 }); }
            const inp = front().querySelector('input'); if (inp && ctx.present) inp.focus();
          });
        }, 1500);
      };
      const tryAnswer = (card, given) => {
        const i = Number(card.dataset.room), r = d.rooms[i], msg = card.querySelector('.lk-msg');
        if (!str(given)) { msg.className = 'lk-msg'; msg.textContent = 'Type the class’s code first.'; return; }
        if (correct(r, given)) { sfx('unlock'); unlock(card, i); return; }
        sfx('error');
        st.tries[i] = (st.tries[i] || 0) + 1;
        card.classList.remove('wrong'); void card.offsetWidth; card.classList.add('wrong');
        msg.className = 'lk-msg bad';
        msg.textContent = st.tries[i] >= 2 && r.hint ? 'Not quite. Hint: ' + r.hint : 'Not quite. Check your working and try again.';
        if (st.tries[i] >= 2) st.hint[i] = true;
      };
      body.querySelectorAll('.cs-card[data-room]').forEach((card) => {
        const inp = card.querySelector('input');
        const btn = card.querySelector('[data-check]');
        if (btn) btn.addEventListener('click', () => tryAnswer(card, inp.value));
        if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tryAnswer(card, inp.value); } });
        card.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => tryAnswer(card, b.dataset.opt)));
      });
      body.querySelector('[data-hint]').addEventListener('click', () => {
        const card = front(); if (!card.dataset.room) return;
        const i = Number(card.dataset.room); st.hint[i] = true;
        const m = card.querySelector('.lk-msg'); m.className = 'lk-msg'; m.textContent = 'Hint: ' + d.rooms[i].hint;
      });
      body.querySelector('[data-skip]').addEventListener('click', () => {
        const card = front(); if (!card.dataset.room) return;
        const i = Number(card.dataset.room);
        const m = card.querySelector('.lk-msg'); m.className = 'lk-msg ok'; m.textContent = 'The code was ' + d.rooms[i].answer + '. ' + d.rooms[i].explain;
        st.solved = i + 1; paintSide();
        setTimeout(() => swap.next({ consume: true }), 2600);
      });
      paintSide();
      ctx.cleanup = () => { clearInterval(tid); swap.destroy(); };
    }
  },
  {
    title: 'Escaped!',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Mission complete', icon: 'star', say: 'react', title: '' });
      B.body(board).innerHTML = '<div class="finale"><span class="trophy">' + icon('star') + '</span><p class="b-big">You escaped!</p><p>' + esc(d.finale) + '</p></div>';
      if (!ctx.still && ctx.present) confetti(document.getElementById('present'), { count: 160, y: 0.35 });
    }
  }
];

const eng = {
  id: 'escape', name: 'Escape Room', short: 'Escape', color: 'gold', icon: 'lock',
  kicker: 'Any subject · gamified review', tagline: 'A story mission: crack each code to drop the lock and reveal the next.',
  about: 'A story mission for any subject. Each lock is a card: the class works out the code, you type it in, and a correct code drops the card away to reveal the next lock. Timer, hints and a finale included.',
  chips: ['Any subject', '15–25 minutes', 'Whole-class game'], cta: 'Build the escape room', savedLabel: 'escape rooms',
  sym: { hello: 'Tell me the <b>subject and topic</b>, pick a theme, and I’ll lock some doors. Your class cracks the codes to escape.', thinking: 'Locking the doors and writing the codes…', done: 'Present it, read the briefing and press <b>Start the clock</b>.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 6' },
    { id: 'topic', type: 'text', label: 'Subject and topic', required: true, placeholder: 'For example: Maths, place value and rounding off', chips: ['Maths: fractions', 'Spelling: suffixes', 'Science: the solar system', 'History: the Romans', 'Grammar: word classes'], tip: 'Say the subject and the topic, for example “Science: the solar system”.', missing: 'Type the subject and topic first.' },
    { id: 'theme', type: 'select', label: 'Theme', options: THEMES, value: 'Space station' },
    { id: 'locks', type: 'pills', label: 'Locks', options: ['3', '4', '5', '6'], value: '4' },
    { id: 'minutes', type: 'pills', label: 'Timer', options: ['10 minutes', '15 minutes', '20 minutes', 'No timer'], value: '15 minutes' }
  ],
  example: { input: { year: 'Year 6', topic: 'Maths: place value and rounding off', theme: 'Space station', locks: '4', minutes: '15 minutes' }, data: EXAMPLE },
  progress: [['title', 'Writing the mission'], ['intro', 'Writing the briefing'], ['rooms', 'Locking the doors'], ['finale', 'Planning the escape'], ['teacher', 'Writing your notes']],
  maxTokens: 4000,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, input && input.topic].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'Codes and answers', icon: 'key', full: true, table: { head: ['Lock', 'Puzzle', 'Code', 'Method'], rows: d.rooms.map((r, i) => [(i + 1) + '. ' + r.name, r.puzzle, r.answer, r.explain]) } },
      { h: 'Hints', icon: 'bulb', list: d.rooms.map((r, i) => (i + 1) + '. ' + r.hint) },
      { h: 'Support and stretch', icon: 'layers', pairs: [['Support', d.teacher.support], ['Stretch', d.teacher.stretch]].filter((p) => p[1]) }
    ];
  },
  chat(d) {
    return {
      title: d.title, sub: 'Solve each lock on paper. Type the code in the chat when your teacher says “Codes in!”.',
      sections: [{ h: 'Mission briefing', text: d.intro }].concat(d.rooms.map((r, i) => ({ h: 'Lock ' + (i + 1) + ': ' + r.name, text: r.puzzle + (r.type === 'choice' ? ' Options: ' + r.options.map((o, k) => 'ABCD'[k] + ') ' + o).join('  ') : '') })))
    };
  }
};
export default eng;
