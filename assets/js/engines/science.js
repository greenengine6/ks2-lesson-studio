/* Engine 4: Science Mystery. A puzzling "case file", notice and wonder, a live class vote on predictions,
   a safe home investigation (fair test), then the big reveal and myth-busting. */
import { esc, str, arr, strs, icon } from '../core.js?v=ed35fd44';
import { B } from './shared.js?v=ed35fd44';
import { buildPrompt } from './prompt.js?v=ed35fd44';
import { mountVote } from './widgets.js?v=ed35fd44';

const EXAMPLE = {
  title: 'The Case of the Vanishing Puddle',
  topic: 'States of matter',
  mystery: {
    story: 'At 9 o’clock on Monday morning, there was a big puddle in the middle of the playground. Mr Okafor drew a chalk circle around it. By lunchtime, the puddle was smaller and there was dry ground inside the chalk circle. By home time, the puddle had completely disappeared. Nobody had touched it, and it had not rained since the night before.',
    question: 'Where did the water go?'
  },
  notice: ['The puddle got smaller during the day.', 'Nobody touched it or swept it away.', 'The chalk circle stayed, but the water left it.'],
  wonder: ['Would it disappear faster on a sunny day?', 'Did the water soak into the ground or go into the air?', 'Does a big puddle take longer than a small one?'],
  predictions: [
    { option: 'The water soaked down into the ground.', best: false },
    { option: 'The water turned into water vapour and went into the air.', best: true },
    { option: 'Someone secretly mopped it up.', best: false },
    { option: 'The water froze into ice.', best: false }
  ],
  investigation: {
    question: 'Does water disappear faster in a warm place or a cool place?',
    equipment: ['2 saucers or small plates that are the same', 'Water and a spoon', 'Paper and a pencil', 'A warm spot (a sunny windowsill) and a cool spot (a shady room)'],
    steps: ['Put 3 spoonfuls of water on each saucer.', 'Draw how much water is on each saucer.', 'Put one saucer in the warm spot and one in the cool spot.', 'Check every hour and draw how much water is left.', 'Compare: which saucer dried first?'],
    change: 'Where the saucer is (warm or cool)',
    measure: 'How long the water takes to disappear',
    same: ['The amount of water', 'The size of the saucers', 'The time you start'],
    safety: ['Ask an adult before using a windowsill.', 'Wipe up spills so nobody slips.']
  },
  explanation: 'The water evaporated! Warmth from the sun and the air gave the tiny particles of water enough energy to escape and become water vapour, a gas we cannot see. The water vapour mixed into the air. Warm, sunny and windy days make evaporation happen faster. A little water may have soaked into cracks, but most of it went into the air.',
  misconceptions: [
    { wrong: 'The water just disappears for ever.', right: 'It is still there, as an invisible gas called water vapour in the air.' },
    { wrong: 'Water only evaporates when it boils.', right: 'Water evaporates at room temperature too, just slowly. Boiling turns it into gas much faster.' },
    { wrong: 'The sun sucks the water up.', right: 'The sun warms the water, giving its particles the energy to escape into the air.' }
  ],
  vocabulary: [
    { word: 'evaporation', meaning: 'When a liquid turns into a gas.' },
    { word: 'water vapour', meaning: 'Water as an invisible gas in the air.' },
    { word: 'temperature', meaning: 'How hot or cold something is.' },
    { word: 'condensation', meaning: 'When a gas cools and turns back into a liquid.' },
    { word: 'particles', meaning: 'The tiny pieces that everything is made of.' }
  ],
  extension: 'Put a cold glass from the fridge on the table for 5 minutes. Where do the drops on the outside come from?',
  curriculum: 'Year 4 States of matter: identify the part played by evaporation and condensation in the water cycle and associate the rate of evaporation with temperature.',
  teacher: {
    routine: [
      'Read the case file like a detective. Pupils type one guess in the chat. 3 minutes.',
      'Notice and wonder: pupils share two things they notice and one question. 5 minutes.',
      'Predict: pupils vote A to D in the chat; tap + to count the votes on screen. 3 minutes.',
      'Set up the saucer investigation at home now, and check it at the end of the day. 10 minutes.',
      'The big reveal: read the explanation and bust the myths together. 5 minutes.'
    ],
    support: 'Pair pupils in breakout rooms with one person reading the steps aloud.',
    stretch: 'Plan a test to see if wind speeds up evaporation. What will you change, measure and keep the same?'
  }
};

function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create an inquiry science lesson built around a mystery: a real, everyday phenomenon presented as a puzzling case for pupils to solve.',
      'Science topic: ' + input.topic + ' (' + input.year + ').',
      input.home === 'At home (household items only)' ? 'Pupils are at home: the investigation must use only safe, everyday household items, and need no adult equipment.' : 'The investigation can use normal primary classroom science equipment.',
      'Include: the mystery story, things to notice and wonder, 3 or 4 predictions (exactly one marked best: true), a safe fair-test investigation, a child-friendly explanation, myth-busting, key vocabulary and the National Curriculum link.'
    ].join('\n'),
    rules: [
      'The mystery story is 3 to 5 sentences, uses a named person and an ordinary place, and ends without giving the answer.',
      'The science must be correct for ' + input.year + ' and match the National Curriculum for England programme of study.',
      'Safety first: no heat sources, sharp tools, chemicals, electricity from the mains or anything that needs adult supervision unless you say so clearly in safety.',
      'Wrong predictions are common, sensible ideas that children really have.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw.mystery || {}, inv = raw.investigation || {}, t = raw.teacher || {};
  const preds = arr(raw.predictions).map((p) => ({ option: str(p && p.option), best: !!(p && p.best) })).filter((p) => p.option).slice(0, 4);
  if (!str(m.story) || preds.length < 2) return null;
  if (!preds.some((p) => p.best)) preds[0].best = true;
  return {
    title: str(raw.title) || 'Science mystery', topic: str(raw.topic) || input.topic,
    mystery: { story: str(m.story), question: str(m.question) || 'What is going on?' },
    notice: strs(raw.notice, 4), wonder: strs(raw.wonder, 4), predictions: preds,
    investigation: { question: str(inv.question), equipment: strs(inv.equipment, 8), steps: strs(inv.steps, 8), change: str(inv.change), measure: str(inv.measure), same: strs(inv.same, 5), safety: strs(inv.safety, 4) },
    explanation: str(raw.explanation),
    misconceptions: arr(raw.misconceptions).map((x) => ({ wrong: str(x && x.wrong), right: str(x && x.right) })).filter((x) => x.wrong).slice(0, 4),
    vocabulary: arr(raw.vocabulary).map((v) => ({ word: str(v && v.word), meaning: str(v && v.meaning) })).filter((v) => v.word).slice(0, 8),
    extension: str(raw.extension), curriculum: str(raw.curriculum),
    teacher: { routine: strs(t.routine, 8), support: str(t.support), stretch: str(t.stretch) }
  };
}

const screens = (eng) => [
  {
    title: 'Case file',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Science mystery', icon: 'search', say: 'chat', title: d.title });
      const body = B.body(board);
      body.innerHTML = '<div class="case"><div class="t file"><span class="stamp">CASE FILE</span>' + esc(d.mystery.story) + '</div><div class="big-q"><span class="qm">?</span><p class="b-big">' + esc(d.mystery.question) + '</p></div></div>';
      B.fit(body.querySelector('.file'), 0.7);
    }
  },
  {
    title: 'Notice and wonder',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Notice and wonder', icon: 'eye', say: 'chat', title: 'What do you notice? What do you wonder?' });
      B.body(board).innerHTML = '<div class="nw"><div class="t"><h4>' + icon('eye') + 'I notice…</h4>' + B.list(d.notice) + '</div><div class="t"><h4>' + icon('spark') + 'I wonder…</h4>' + B.list(d.wonder) + '</div></div>';
    }
  },
  {
    title: 'Predict',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.vote || (ctx.state.vote = {});
      board.innerHTML = B.pad(eng, { kick: 'Predict', icon: 'vote', say: 'vote', title: d.mystery.question, foot: '<span class="vt-total"></span><button type="button" class="b-btn go" data-rev>' + icon('eye') + 'Reveal the best answer</button>' });
      const v = mountVote(B.body(board), d.predictions.map((p) => ({ label: p.option })), st, { best: d.predictions.map((p, i) => (p.best ? i : -1)).filter((i) => i >= 0), total: (n) => { const t = board.querySelector('.vt-total'); if (t) t.textContent = n + (n === 1 ? ' vote' : ' votes'); } });
      board.querySelector('[data-rev]').addEventListener('click', () => { st.revealed = !st.revealed; v.paint(); });
      ctx.onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= d.predictions.length) v.add(n - 1); };
    }
  },
  {
    title: 'Investigate',
    render(board, ctx) {
      const v = ctx.data.investigation;
      board.innerHTML = B.pad(eng, { kick: 'Investigate', icon: 'science', say: 'show', title: v.question || 'Investigate' });
      const body = B.body(board);
      body.innerHTML = '<div class="inv"><div class="t"><h4>' + icon('steps') + 'Method</h4>' + B.num(v.steps) + '</div><div style="display:grid;gap:calc(1.4 * var(--u));min-height:0">' +
        '<div class="t in"><h4>' + icon('layers') + 'You need</h4>' + B.list(v.equipment) + '</div>' +
        '<div class="t fair"><div><b>Change:</b> ' + esc(v.change) + '</div><div><b>Measure:</b> ' + esc(v.measure) + '</div><div><b>Keep the same:</b> ' + esc(v.same.join(', ')) + '</div>' +
        (v.safety.length ? '<div><b>Stay safe:</b> ' + esc(v.safety.join(' ')) + '</div>' : '') + '</div></div></div>';
      body.querySelectorAll('.t').forEach((t) => B.fit(t, 0.7));
    }
  },
  {
    title: 'The big reveal',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.rev || (ctx.state.rev = { on: false });
      board.innerHTML = B.pad(eng, { kick: 'The big reveal', icon: 'bulb', say: 'listen', title: 'So what really happened?', foot: '<span>' + esc(d.vocabulary.slice(0, 4).map((v) => v.word).join(' · ')) + '</span><button type="button" class="b-btn go" data-show>' + icon('eye') + 'Reveal</button>' });
      const body = B.body(board);
      body.innerHTML = '<div class="t" style="font-size:calc(2 * var(--u) * var(--fs));position:relative"><p class="ph-hint" style="margin:0;position:absolute;inset:calc(1.5 * var(--u)) calc(1.9 * var(--u));' + (st.on ? 'visibility:hidden' : '') + '">What do you think really happened? When you are ready, press Reveal.</p><p class="b-fade' + (st.on ? ' on' : '') + '" style="margin:0">' + esc(d.explanation) + '</p></div>' +
        '<div class="myth" style="--cols:' + Math.max(1, d.misconceptions.length) + '">' + d.misconceptions.map((x) => '<div class="t in"><h4>' + icon('close') + 'Myth</h4><s>' + esc(x.wrong) + '</s><p class="b-fade' + (st.on ? ' on' : '') + '" style="margin:calc(.8 * var(--u)) 0 0"><b class="b-ans">Truth:</b> ' + esc(x.right) + '</p></div>').join('') + '</div>';
      board.querySelector('[data-show]').addEventListener('click', () => { st.on = !st.on; body.querySelectorAll('.b-fade').forEach((p) => p.classList.toggle('on', st.on)); body.querySelector('.ph-hint').style.visibility = st.on ? 'hidden' : ''; });
      B.fit(body, 0.7);
    }
  }
];

const eng = {
  id: 'science', name: 'Science Mystery', short: 'Science', color: 'green', icon: 'science',
  kicker: 'Science · inquiry', tagline: 'A puzzling case to crack, a live class vote, a home investigation and the big reveal.',
  about: 'Every lesson starts with a mystery: a real everyday puzzle. Pupils notice and wonder, vote on a prediction, investigate safely at home, then see the big reveal.',
  chips: ['Science', '30–45 minutes', 'Safe at home'], cta: 'Make the mystery', savedLabel: 'mysteries',
  sym: { hello: 'Pick a <b>science topic</b>. I’ll turn it into a mystery your class has to crack, with a safe investigation they can do at home.', thinking: 'Writing the case file…', done: 'Start with the case file, then let the class vote.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 4' },
    { id: 'topic', type: 'text', label: 'Science topic', required: true, placeholder: 'For example: Forces and magnets', chips: ['Light and shadows', 'Forces and magnets', 'States of matter', 'Sound', 'Electricity', 'Plants', 'Earth and space'], tip: 'Use a topic from your science curriculum.', missing: 'Type a science topic first, for example “Forces and magnets”.' },
    { id: 'home', type: 'pills', label: 'Where pupils are', options: ['At home (household items only)', 'In school (classroom kit)'], value: 'At home (household items only)' }
  ],
  example: { input: { year: 'Year 4', topic: 'States of matter: evaporation', home: 'At home (household items only)' }, data: EXAMPLE },
  progress: [['title', 'Inventing the mystery'], ['mystery', 'Writing the case file'], ['predictions', 'Writing the predictions'], ['investigation', 'Planning a safe investigation'], ['explanation', 'Writing the big reveal'], ['teacher', 'Writing your notes']],
  maxTokens: 4500,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, d.topic].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'The answer', icon: 'bulb', text: d.explanation },
      { h: 'Best prediction', icon: 'vote', text: d.predictions.filter((p) => p.best).map((p) => p.option).join(' ') },
      { h: 'Key vocabulary', icon: 'reading', pairs: d.vocabulary.map((v) => [v.word, v.meaning]) },
      { h: 'Misconceptions', icon: 'eye', pairs: d.misconceptions.map((x) => [x.wrong, x.right]) },
      { h: 'Safety', icon: 'info', list: d.investigation.safety },
      { h: 'Support and stretch', icon: 'layers', pairs: [['Support', d.teacher.support], ['Stretch', d.teacher.stretch], ['Extension', d.extension]].filter((p) => p[1]) },
      d.curriculum ? { h: 'Curriculum link', icon: 'flag', text: d.curriculum } : null
    ];
  },
  chat(d) {
    return {
      title: d.title, sub: d.mystery.question + ' Type your prediction letter (A, B, C or D) in the chat.',
      sections: [
        { h: 'Case file', text: d.mystery.story },
        { h: 'Predict', list: d.predictions.map((p, i) => 'ABCD'[i] + ') ' + p.option) },
        { h: 'Investigate at home: ' + d.investigation.question, list: d.investigation.steps, ordered: true },
        { h: 'You need', list: d.investigation.equipment },
        d.investigation.safety.length ? { h: 'Stay safe', list: d.investigation.safety } : null
      ].filter(Boolean)
    };
  }
};
export default eng;
