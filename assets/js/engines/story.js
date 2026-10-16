/* Engine 2: Story Spark. A mystery scene revealed line by line (with moving weather), inference prompts,
   a word bank, a model paragraph with its features highlighted, and the writing task. */
import { esc, str, arr, strs, icon } from '../core.js?v=f99d8766';
import { B } from './shared.js?v=f99d8766';
import { buildPrompt } from './prompt.js?v=f99d8766';
import { Mood, MOODS } from '../fx/particles.js?v=f99d8766';

const EXAMPLE = {
  title: 'The Lighthouse at the Edge of the Storm',
  mood: 'stormy',
  searchWords: 'lighthouse storm night sea',
  focus: 'Setting description',
  grammar: 'Expanded noun phrases',
  scene: [
    'The waves are taller than houses tonight.',
    'Rain needles sideways across the black rocks.',
    'High above, the lighthouse lamp turns slowly, sweeping its gold beam over the water.',
    'But in a tiny window halfway up the tower, a second light is flickering: small, green and trembling.',
    'Nobody has lived in the lighthouse for twenty years.',
    'On the doorstep, half-buried in seaweed, sits a pair of wet boots.'
  ],
  inference: {
    see: ['Huge waves crashing on the rocks', 'A gold beam turning over the sea', 'A green light in a window'],
    think: ['Someone could be hiding in the tower', 'The boots belong to someone who came by sea', 'The green light might be a signal'],
    wonder: ['Who is inside the lighthouse?', 'Why is the light green?', 'How long have the boots been there?']
  },
  questions: [
    { q: 'Why might the writer tell us that nobody has lived there for twenty years?', kind: 'Inference' },
    { q: 'What do you predict will happen when someone opens the door?', kind: 'Prediction' },
    { q: 'Why does the writer say the rain “needles”?', kind: 'Vocabulary' },
    { q: 'How would you feel standing on that doorstep? Why?', kind: 'Empathy' }
  ],
  vocabulary: [
    { word: 'towering', meaning: 'very tall, rising high above', example: 'The towering waves smashed against the cliffs.' },
    { word: 'flickering', meaning: 'shining on and off, bright then dim', example: 'A flickering candle lit the stairs.' },
    { word: 'jagged', meaning: 'rough and sharp with uneven points', example: 'Jagged rocks lined the shore.' },
    { word: 'deserted', meaning: 'empty, with nobody there', example: 'The deserted tower creaked in the wind.' },
    { word: 'sweeping', meaning: 'moving in a long, smooth curve', example: 'The sweeping beam lit up the sea.' },
    { word: 'eerie', meaning: 'strange and a little frightening', example: 'An eerie silence filled the room.' }
  ],
  starters: ['Above the crashing waves, …', 'Through the tiny window, …', 'Without warning, …', 'Half-hidden in the seaweed, …', 'As the beam swept past, …'],
  model: {
    text: 'Through the howling darkness, the old lighthouse stood alone on its jagged island. Furious waves hurled themselves at the slippery black rocks, then crawled back to try again. High above, the great golden lamp turned, sweeping its patient beam across the water. Then I saw it: a small, trembling green light in the window halfway up the tower. My heart thudded. Nobody had lived there for twenty years. On the doorstep sat a pair of muddy leather boots, laced up neatly, as if someone had only just taken them off.',
    features: [
      { name: 'Fronted adverbial', quote: 'Through the howling darkness,' },
      { name: 'Expanded noun phrase', quote: 'a small, trembling green light' },
      { name: 'Personification', quote: 'Furious waves hurled themselves at the slippery black rocks, then crawled back' },
      { name: 'Short sentence for tension', quote: 'My heart thudded.' }
    ]
  },
  task: {
    prompt: 'Write the next paragraph: you step inside the lighthouse. Describe what you see, hear and feel.',
    criteria: ['I can use at least three expanded noun phrases.', 'I can start a sentence with a fronted adverbial and a comma.', 'I can use my senses: see, hear and feel.', 'I can use a short sentence to build tension.'],
    challenge: 'Hint at who lives there without ever saying it.'
  },
  teacher: {
    routine: [
      'Reveal the scene one line at a time. After each line, pupils type one word in the chat: what do you think is happening?',
      'See, think, wonder: 2 minutes on paper, then share one of each in the chat.',
      'Word bank: tap each word to show its meaning. Pupils put two words into a sentence in the chat.',
      'Read the model paragraph together, then press “Spot the features” and discuss each one.',
      'Writing time: 15 minutes, cameras on. Volunteers unmute to read their paragraph aloud.'
    ],
    support: 'Give the word bank and sentence starters on paper. Aim for three strong sentences.',
    stretch: 'Change the mood: rewrite the paragraph so the lighthouse feels safe and welcoming.'
  }
};

function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create a visual inference and creative writing lesson.',
      'Theme or setting: ' + input.theme + '.',
      'Writing focus: ' + input.focus + '.' + (input.grammar ? ' Grammar focus: ' + input.grammar + '.' : ' Choose a grammar focus that fits ' + input.year + '.'),
      'The "scene" is a picture painted in words for pupils to infer from: 5 to 7 short, vivid lines in the present tense, revealed one at a time. Each line adds a clue; the last line is a small twist. Do not explain the mystery.'
    ].join('\n'),
    rules: [
      '"mood" is one of: ' + Object.keys(MOODS).join(', ') + '.',
      '"searchWords" are 3 or 4 words to find a matching photo.',
      'Keep it gently mysterious, never frightening or violent. Suitable for a ' + input.year + ' class.',
      'The model paragraph is 80 to 130 words at the expected standard for ' + input.year + ', and shows the grammar focus clearly.',
      'Every model.features[].quote must be copied exactly, word for word, from model.text.',
      'Give 6 vocabulary words with a child-friendly meaning and an example sentence; 4 questions; 5 sentence starters; 4 success criteria starting "I can".'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const scene = strs(raw.scene, 8);
  if (scene.length < 3) return null;
  const inf = raw.inference || {}, m = raw.model || {}, task = raw.task || {}, t = raw.teacher || {};
  return {
    title: str(raw.title) || input.theme || 'Story Spark',
    mood: MOODS[str(raw.mood).toLowerCase()] ? str(raw.mood).toLowerCase() : 'mysterious',
    searchWords: str(raw.searchWords) || input.theme || '',
    focus: str(raw.focus) || input.focus || '', grammar: str(raw.grammar) || input.grammar || '',
    scene,
    inference: { see: strs(inf.see, 4), think: strs(inf.think, 4), wonder: strs(inf.wonder, 4) },
    questions: arr(raw.questions).map((q) => ({ q: str(q && q.q), kind: str(q && q.kind) })).filter((q) => q.q).slice(0, 6),
    vocabulary: arr(raw.vocabulary).map((v) => ({ word: str(v && v.word), meaning: str(v && v.meaning), example: str(v && v.example) })).filter((v) => v.word).slice(0, 6),
    starters: strs(raw.starters, 6),
    model: { text: str(m.text), features: arr(m.features).map((f) => ({ name: str(f && f.name), quote: str(f && f.quote) })).filter((f) => f.name).slice(0, 6) },
    task: { prompt: str(task.prompt), criteria: strs(task.criteria, 6), challenge: str(task.challenge) },
    teacher: { routine: strs(t.routine, 8), support: str(t.support), stretch: str(t.stretch) }
  };
}
function markModel(text, features) {
  let h = esc(text);
  features.forEach((f, i) => {
    if (!f.quote) return;
    const q = esc(f.quote);
    const at = h.toLowerCase().indexOf(q.toLowerCase());
    if (at >= 0 && h.slice(0, at).lastIndexOf('<mark') <= h.slice(0, at).lastIndexOf('</mark>')) h = h.slice(0, at) + '<mark data-f="' + i + '">' + h.slice(at, at + q.length) + '</mark>' + h.slice(at + q.length);
  });
  return h;
}

const screens = (eng) => [
  {
    title: 'Mystery scene',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.scene || (ctx.state.scene = { n: 1 });
      board.innerHTML = B.pad(eng, { kick: 'Picture this', icon: 'eye', say: 'chat', title: d.title, foot: '<span>Click the scene to reveal the next line</span><span class="b-row"><button type="button" class="b-btn" data-all>' + icon('eye') + 'Show all</button></span>' });
      const body = B.body(board);
      body.innerHTML = '<div class="scene"><div class="sc-lines">' + d.scene.map((l, i) => '<p class="sc-line' + (i === d.scene.length - 1 ? ' last' : '') + '">' + esc(l) + '</p>').join('') + '</div><span class="sc-hint"></span></div>';
      const scene = body.querySelector('.scene');
      if (!ctx.still) new Mood(scene, d.mood); else { const M = MOODS[d.mood]; scene.style.setProperty('--m1', M.bg[0]); scene.style.setProperty('--m2', M.bg[1]); scene.style.setProperty('--m3', M.bg[2]); scene.style.setProperty('--mink', M.ink); }
      const lines = body.querySelectorAll('.sc-line');
      const paint = () => { lines.forEach((l, i) => l.classList.toggle('on', i < st.n)); body.querySelector('.sc-hint').textContent = st.n < lines.length ? st.n + ' of ' + lines.length : 'What do you infer?'; };
      const more = () => { if (st.n < lines.length) { st.n++; paint(); } };
      scene.addEventListener('click', more);
      board.querySelector('[data-all]').addEventListener('click', () => { st.n = lines.length; paint(); });
      ctx.onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); more(); } };
      if (ctx.still) st.n = Math.max(st.n, 3);
      paint();
    }
  },
  {
    title: 'See, think, wonder',
    render(board, ctx) {
      const f = ctx.data.inference;
      board.innerHTML = B.pad(eng, { kick: 'Inference', icon: 'bulb', say: 'chat', title: 'What can you see, think and wonder?' });
      const col = (h, ic, xs, starter) => '<div class="t"><h4>' + icon(ic) + h + '</h4><p>' + esc(starter) + '</p>' + B.list(xs) + '</div>';
      B.body(board).innerHTML = '<div class="stw">' + col('I see', 'eye', f.see, 'I can see…') + col('I think', 'bulb', f.think, 'I think… because…') + col('I wonder', 'spark', f.wonder, 'I wonder…') + '</div>';
    }
  },
  {
    title: 'Word bank',
    render(board, ctx) {
      const st = ctx.state.words || (ctx.state.words = {});
      board.innerHTML = B.pad(eng, { kick: 'Word bank', icon: 'reading', say: 'chat', title: 'Words to steal for your writing', foot: '<span>Tap a word to show what it means</span><span>Use two of them in a sentence</span>' });
      const body = B.body(board);
      body.innerHTML = '<div class="words">' + ctx.data.vocabulary.map((v, i) => '<button type="button" class="t word' + (st[i] ? ' show' : '') + '" data-i="' + i + '"><b>' + esc(v.word) + '</b><span>' + esc(v.meaning) + '</span><em>“' + esc(v.example) + '”</em></button>').join('') + '</div>';
      body.querySelectorAll('.word').forEach((b) => b.addEventListener('click', () => { const i = b.dataset.i; st[i] = !st[i]; b.classList.toggle('show', st[i]); }));
    }
  },
  {
    title: 'Model paragraph',
    render(board, ctx) {
      const m = ctx.data.model, st = ctx.state.model || (ctx.state.model = { hl: false });
      board.innerHTML = B.pad(eng, { kick: 'Model paragraph', icon: 'story', say: 'think', title: 'What makes this paragraph good?', foot: '<span>' + esc(ctx.data.grammar ? 'Focus: ' + ctx.data.grammar : '') + '</span><button type="button" class="b-btn go" data-hl>' + icon('spark') + 'Spot the features</button>' });
      const body = B.body(board);
      body.innerHTML = '<div class="model' + (st.hl ? ' hl' : '') + '"><div class="t txt">' + markModel(m.text, m.features) + '</div><div class="t in feat"><h4>' + icon('star') + 'Features</h4>' +
        m.features.map((f) => '<div><b class="b-mark">' + esc(f.name) + '</b><br><span class="' + (st.hl ? '' : 'b-hidden') + '">“' + esc(f.quote) + '”</span></div>').join('') + '</div></div>';
      board.querySelector('[data-hl]').addEventListener('click', () => { st.hl = !st.hl; body.querySelector('.model').classList.toggle('hl', st.hl); body.querySelectorAll('.feat span').forEach((s) => s.classList.toggle('b-hidden', !st.hl)); });
      B.fit(body.querySelector('.txt'), 0.7);
    }
  },
  {
    title: 'Your turn',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Your turn', icon: 'story', say: 'show', title: d.task.prompt || 'Your turn to write' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1"><div class="t"><h4>' + icon('check') + 'Success criteria</h4><ul class="sc-check">' + d.task.criteria.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul>' +
        (d.task.challenge ? '<p style="margin:calc(1.4 * var(--u)) 0 0"><b class="b-mark">Challenge:</b> ' + esc(d.task.challenge) + '</p>' : '') + '</div>' +
        '<div class="t in"><h4>' + icon('wand') + 'Sentence starters</h4>' + B.list(d.starters) + '</div></div>';
    }
  }
];

const eng = {
  id: 'story', name: 'Story Spark', short: 'Story', color: 'pink', icon: 'story',
  kicker: 'English · visual inference + writing', tagline: 'A mystery scene revealed line by line, then inference, a word bank and a model paragraph.',
  about: 'A mystery scene painted in words, with moving weather, revealed one line at a time. Pupils infer, steal vocabulary, unpick a model paragraph and then write.',
  chips: ['English', '30–45 minutes', 'Inference + writing'], cta: 'Make the scene', savedLabel: 'scenes',
  sym: { hello: 'Give me a <b>theme or setting</b> and a writing focus. I’ll paint a mystery scene your class reveals line by line.', thinking: 'Painting the scene, one clue at a time…', done: 'Present it and click the scene to reveal each line.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 5' },
    { id: 'theme', type: 'text', label: 'Theme or setting', required: true, placeholder: 'For example: a door at the bottom of the garden', chips: ['A lost robot in the city', 'An abandoned fairground', 'A secret library', 'A frozen forest', 'A market in the clouds'], tip: 'A place or a moment works best: a door at the bottom of the garden, an empty fairground…', missing: 'Type a theme or setting first.' },
    { id: 'focus', type: 'select', label: 'Writing focus', options: ['Setting description', 'Character description', 'Building suspense', 'Story opening', 'Dialogue', 'Diary entry', 'Poetry'], value: 'Setting description' },
    { id: 'grammar', type: 'text', label: 'Grammar focus', optional: true, placeholder: 'For example: fronted adverbials', chips: ['Expanded noun phrases', 'Fronted adverbials', 'Relative clauses', 'Similes and metaphors', 'Speech punctuation'] }
  ],
  example: { input: { year: 'Year 5', theme: 'A lighthouse in a storm', focus: 'Setting description', grammar: 'Expanded noun phrases' }, data: EXAMPLE },
  progress: [['title', 'Imagining the scene'], ['scene', 'Writing the clues'], ['inference', 'Planning see, think, wonder'], ['vocabulary', 'Choosing words to steal'], ['model', 'Writing the model paragraph'], ['task', 'Setting the writing task'], ['teacher', 'Writing your notes']],
  maxTokens: 4000,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, d.focus, d.grammar].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'Questions to ask', icon: 'chat', list: d.questions.map((q) => (q.kind ? q.kind + ': ' : '') + q.q) },
      { h: 'Find a matching photo', icon: 'search', text: 'Search a free photo site (for example Unsplash or Pixabay) for: “' + d.searchWords + '”. Share it after the line-by-line reveal.' },
      { h: 'Features in the model', icon: 'star', pairs: d.model.features.map((f) => [f.name, f.quote]) },
      { h: 'Word bank', icon: 'reading', pairs: d.vocabulary.map((v) => [v.word, v.meaning]) },
      { h: 'Support and stretch', icon: 'layers', pairs: [['Support', d.teacher.support], ['Stretch', d.teacher.stretch]].filter((p) => p[1]) }
    ];
  },
  chat(d) {
    return {
      title: d.title, sub: 'Read the scene. What do you think is happening? Type one idea in the chat.',
      sections: [
        { h: 'The scene', list: d.scene },
        { h: 'Think about it', list: d.questions.map((q) => q.q) },
        { h: 'Word bank', list: d.vocabulary.map((v) => v.word + ': ' + v.meaning) },
        { h: 'Your task', text: d.task.prompt + (d.task.challenge ? ' Challenge: ' + d.task.challenge : '') },
        { h: 'Success criteria', list: d.task.criteria }
      ]
    };
  }
};
export default eng;
