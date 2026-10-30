/* Engine 10: Big Debate. Turns a news story the teacher pastes into a balanced class debate or assembly:
   a child-friendly summary, a motion, live before-and-after votes, arguments on both sides and oracy stems. */
import { esc, str, arr, strs, num, clamp, icon } from '../core.js?v=3c9d4698';
import { B } from './shared.js?v=3c9d4698';
import { buildPrompt } from './prompt.js?v=3c9d4698';
import { mountVote } from './widgets.js?v=3c9d4698';

const OPTS = [{ label: 'Agree', letter: '✓', color: '#3B9A62' }, { label: 'Disagree', letter: '✗', color: '#D9534A' }, { label: 'Not sure yet', letter: '?', color: '#C38A12' }];

const EXAMPLE = {
  title: 'Should our road be a School Street?',
  motion: 'This house believes that cars should not be allowed on the road outside our school at drop-off and pick-up time.',
  summary: 'Some towns and cities in the UK close the road outside a primary school to cars for about an hour at the start and end of the school day. These roads are called School Streets. People can still walk, scoot or cycle. Supporters say the air is cleaner and crossing the road is safer. Some parents and drivers say it makes their journey harder, especially for families who live far away or need to drive to work.',
  keyWords: [
    { word: 'council', meaning: 'The group of people who make decisions for a local area.' },
    { word: 'pollution', meaning: 'Dirty or harmful things in the air, water or land.' },
    { word: 'motion', meaning: 'The idea that a debate is about.' },
    { word: 'exception', meaning: 'Someone or something a rule does not apply to.' }
  ],
  for: ['Cleaner air: fewer car fumes near children.', 'Safer crossing: fewer cars means fewer accidents.', 'More children walk, scoot or cycle, which keeps them healthy.'],
  against: ['Families who live far away may find it hard to get to school.', 'Cars may park on nearby roads and cause traffic there instead.', 'Some children have disabilities and need to be driven to the gate.'],
  think: ['Who would a School Street help most? Who might find it harder?', 'Should there be any exceptions to the rule?', 'How could we find out what people in our community think?'],
  stems: ['I agree with the motion because…', 'I disagree with the motion because…', 'I would like to build on what ___ said…', 'I see your point, but have you thought about…?', 'I have changed my mind because…'],
  running: [
    { minutes: 2, part: 'Welcome and the story', detail: 'Read the summary together and check the key words.' },
    { minutes: 1, part: 'First vote', detail: 'Agree, disagree or not sure: votes in the chat.' },
    { minutes: 4, part: 'Arguments', detail: 'Reveal points for and against. Pupils add their own in the chat.' },
    { minutes: 6, part: 'Debate', detail: 'Pupils unmute to speak using the sentence stems. Alternate for and against.' },
    { minutes: 1, part: 'Final vote', detail: 'Vote again. Did anyone change their mind?' },
    { minutes: 1, part: 'Reflection', detail: 'What makes an argument convincing?' }
  ],
  values: 'Democracy: everyone has a vote and an equal voice. Mutual respect: we listen to views that are different from our own.',
  reflection: 'What was the strongest argument you heard today? Why was it so convincing?',
  care: 'Some pupils may have family members who rely on driving because of work or disability. Keep the debate about ideas, never about individual families.'
};

function prompt(input, mode) {
  const assembly = /assembly/i.test(input.format);
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Design a ' + (assembly ? '15-minute current-affairs assembly with a whole-school vote' : '20-minute class debate') + ' based ONLY on this news story, which the teacher has pasted:',
      '"""' + input.story + '"""',
      'Turn it into a balanced debate: a child-friendly summary, a clear motion ("This house believes…"), arguments on both sides, questions, oracy sentence stems, a running order with timings, a link to British values, a reflection and a care note for the teacher.'
    ].join('\n'),
    rules: [
      'Use only facts that are in the story. Do not add names, numbers or events that are not there. If something is uncertain, say so simply.',
      'Stay strictly balanced and politically neutral: the same number of arguments for and against, equally strong, and never tell pupils which side is right.',
      'If the story involves upsetting events, keep the summary calm and age-appropriate, focus on a question children can safely discuss, and explain how in "care".',
      'The running order minutes must add up to ' + (assembly ? 15 : 20) + '.',
      'stems: 5 oracy sentence stems for agreeing, disagreeing, building on and changing your mind.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  if (!str(raw.motion) || !str(raw.summary)) return null;
  return {
    title: str(raw.title) || 'Big debate', motion: str(raw.motion), summary: str(raw.summary),
    keyWords: arr(raw.keyWords).map((k) => ({ word: str(k && k.word), meaning: str(k && k.meaning) })).filter((k) => k.word).slice(0, 6),
    for: strs(raw.for, 5), against: strs(raw.against, 5), think: strs(raw.think, 5), stems: strs(raw.stems, 6),
    running: arr(raw.running).map((r) => ({ minutes: clamp(Math.round(num(r && r.minutes, 1)), 0, 30), part: str(r && r.part), detail: str(r && r.detail) })).filter((r) => r.part).slice(0, 10),
    values: str(raw.values), reflection: str(raw.reflection), care: str(raw.care)
  };
}

function voteScreen(eng, key, title) {
  return {
    title,
    render(board, ctx) {
      const d = ctx.data, st = ctx.state[key] || (ctx.state[key] = {});
      const before = ctx.state.v1;
      const compare = key === 'v2' && before && before.counts && before.counts.some((x) => x > 0);
      board.innerHTML = B.pad(eng, { kick: key === 'v1' ? 'First vote' : 'Final vote', icon: 'vote', say: 'vote', title: '', foot: '<span class="vt-total"></span><span>' + (key === 'v1' ? 'Tap + for each vote in the chat' : 'Has anyone changed their mind?') + '</span>' });
      const body = B.body(board);
      body.innerHTML = '<p class="b-big" style="font-size:calc(2.5 * var(--u) * var(--fs));flex:none">' + esc(d.motion) + '</p><div class="vote-host" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>' +
        (compare ? '<div class="t in" style="flex:none;font-size:calc(1.6 * var(--u))"><b class="b-mark">First vote:</b> ' + OPTS.map((o, i) => o.label + ' ' + before.counts[i]).join(' · ') + '</div>' : '');
      const v = mountVote(body.querySelector('.vote-host'), OPTS, st, { best: null, total: (n) => { const t = board.querySelector('.vt-total'); if (t) t.textContent = n + (n === 1 ? ' vote' : ' votes'); } });
      ctx.onKey = (e) => { const i = { a: 0, d: 1, n: 2, '1': 0, '2': 1, '3': 2 }[e.key.toLowerCase()]; if (i != null) v.add(i); };
    }
  };
}

const screens = (eng) => [
  {
    title: 'The story',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'In the news', icon: 'globe', say: 'listen', title: d.title });
      const body = B.body(board);
      body.innerHTML = '<div class="story-card"><div class="t">' + esc(d.summary) + '</div><div class="t in"><h4>' + icon('reading') + 'Key words</h4><dl class="kv">' + d.keyWords.map((k) => '<dt>' + esc(k.word) + '</dt><dd>' + esc(k.meaning) + '</dd>').join('') + '</dl></div></div>';
      B.fit(body.querySelector('.story-card .t'), 0.7);
    }
  },
  voteScreen(eng, 'v1', 'First vote'),
  {
    title: 'Arguments',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.args || (ctx.state.args = { n: 0 });
      const total = d.for.length + d.against.length;
      board.innerHTML = B.pad(eng, { kick: 'Both sides', icon: 'debate', say: 'chat', title: 'What are the arguments?', foot: '<span>Can you add your own point in the chat?</span><span class="b-row"><button type="button" class="b-btn" data-all>' + icon('eye') + 'Show all</button><button type="button" class="b-btn go" data-next>' + icon('plus') + 'Next point</button></span>' });
      const body = B.body(board);
      const order = [];
      for (let i = 0; i < Math.max(d.for.length, d.against.length); i++) { if (i < d.for.length) order.push('f'); if (i < d.against.length) order.push('a'); }
      const paint = () => {
        const seen = order.slice(0, st.n);
        const sf = seen.filter((x) => x === 'f').length, sa = seen.filter((x) => x === 'a').length;
        body.innerHTML = '<div class="args"><div class="t"><span class="side" style="color:#3B9A62">' + icon('thumb') + 'For</span><ul class="b-list" style="--c:#3B9A62">' + d.for.map((x, i) => (i < sf ? '<li class="b-fade on">' + esc(x) + '</li>' : '<li class="ghost" aria-hidden="true"></li>')).join('') + '</ul></div>' +
          '<div class="t"><span class="side" style="color:#D9534A">' + icon('thumb', 'flip') + 'Against</span><ul class="b-list" style="--c:#D9534A">' + d.against.map((x, i) => (i < sa ? '<li class="b-fade on">' + esc(x) + '</li>' : '<li class="ghost" aria-hidden="true"></li>')).join('') + '</ul></div></div>';
      };
      board.querySelector('[data-next]').addEventListener('click', () => { st.n = Math.min(total, st.n + 1); paint(); });
      board.querySelector('[data-all]').addEventListener('click', () => { st.n = total; paint(); });
      ctx.onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); st.n = Math.min(total, st.n + 1); paint(); } };
      paint();
    }
  },
  {
    title: 'Speak like a debater',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Oracy', icon: 'mic', say: 'talk', title: 'Speak like a debater' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)"><div class="stems" style="--cols:1">' + d.stems.map((s) => '<div class="t">' + icon('debate') + '<span>' + esc(s) + '</span></div>').join('') + '</div>' +
        '<div class="t in"><h4>' + icon('bulb') + 'Think about…</h4>' + B.list(d.think) + '</div></div>';
      B.fit(B.body(board), 0.7);
    }
  },
  voteScreen(eng, 'v2', 'Final vote'),
  {
    title: 'Reflect',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Reflect', icon: 'heart', say: 'think', title: '' });
      B.body(board).innerHTML = '<div class="motion"><q>' + esc(d.reflection || 'What did you learn today?') + '</q>' + (d.values ? '<p class="b-sub" style="max-width:80%">' + esc(d.values) + '</p>' : '') + '</div>';
    }
  }
];

const eng = {
  id: 'debate', name: 'Big Debate', short: 'Debate', color: 'red', icon: 'debate',
  kicker: 'Oracy · current affairs', tagline: 'Paste a news story: get a balanced debate or assembly with live votes.',
  about: 'Paste a child-friendly news story. Get a balanced debate or assembly: summary, motion, live before-and-after votes, arguments on both sides, oracy stems and a running order.',
  chips: ['Oracy', '15–20 minutes', 'Balanced'], cta: 'Plan the debate', savedLabel: 'debates',
  sym: { hello: 'Paste a <b>news story</b> from this week (a children’s news site is perfect). I’ll turn it into a fair debate with live votes.', thinking: 'Reading the story and balancing both sides…', done: 'Start with the story, then take the first vote.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', mixed: true, value: 'Years 3 to 6' },
    { id: 'story', type: 'textarea', label: 'The news story', required: true, rows: 6, hint: 'Paste a headline and a short summary from a children’s news site, so it is current and age-appropriate.', placeholder: 'Paste the story here…', tip: 'I only use what you paste, so the debate stays accurate and up to date.', missing: 'Paste a news story first: a headline and a few sentences is enough.' },
    { id: 'format', type: 'pills', label: 'Format', options: ['Class debate (20 minutes)', 'Assembly (15 minutes)'], value: 'Class debate (20 minutes)' }
  ],
  example: { input: { year: 'Years 3 to 6', story: 'Some councils in the UK are closing the roads outside primary schools to cars at the start and end of the school day. These are called School Streets. Supporters say the air is cleaner and walking is safer. Some parents and drivers say it makes journeys harder, especially for families who live far away.', format: 'Assembly (15 minutes)' }, data: EXAMPLE },
  progress: [['title', 'Reading the story'], ['motion', 'Writing the motion'], ['for', 'Finding arguments for'], ['against', 'Finding arguments against'], ['stems', 'Writing debate stems'], ['running', 'Timing the running order'], ['care', 'Writing your care note']],
  maxTokens: 3500,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, input && input.format].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    const mins = d.running.reduce((a, r) => a + r.minutes, 0);
    return [
      { h: 'Running order (' + mins + ' minutes)', icon: 'clock', full: true, table: { head: ['Min', 'Part', 'What happens'], rows: d.running.map((r) => [String(r.minutes), r.part, r.detail]) } },
      { h: 'Care note', icon: 'heart', text: d.care },
      { h: 'British values', icon: 'flag', text: d.values },
      { h: 'Arguments for', icon: 'thumb', list: d.for },
      { h: 'Arguments against', icon: 'thumb', list: d.against },
      { h: 'Questions to think about', icon: 'bulb', list: d.think }
    ];
  },
  chat(d) {
    return { title: d.title, sub: 'Do you agree or disagree? Type ✓, ✗ or ? in the chat.', sections: [{ h: 'The story', text: d.summary }, { h: 'The motion', text: d.motion }, { h: 'Speak like a debater', list: d.stems }] };
  }
};
export default eng;
