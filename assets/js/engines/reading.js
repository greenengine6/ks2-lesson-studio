/* Engine 3: Reading Ladder. One text written at three levels (same facts, same key words), tap-to-define
   glossary words, and VIPERS questions shown one at a time with answers to reveal. */
import { esc, str, arr, strs, icon } from '../core.js?v=73f756c9';
import { B } from './shared.js?v=73f756c9';
import { buildPrompt } from './prompt.js?v=73f756c9';

const SKILLS = {
  V: { name: 'Vocabulary', k: '#6C63FF' }, I: { name: 'Infer', k: '#E2558A' }, P: { name: 'Predict', k: '#E07B2E' },
  E: { name: 'Explain', k: '#2C9C96' }, R: { name: 'Retrieve', k: '#3584D6' }, S: { name: 'Summarise', k: '#9A55CF' }
};
const LEVELS = ['Support', 'Core', 'Challenge'];

const EXAMPLE = {
  title: 'Volcanoes',
  textType: 'Non-fiction report',
  levels: [
    { name: 'Support', text: 'A volcano is a mountain with a hole at the top. Deep under the ground, it is very hot. The heat melts rock. The melted rock is called magma.\n\nSometimes the magma pushes up and comes out of the volcano. This is called an eruption. When the melted rock comes out, it is called lava. Lava is orange and very hot. It can flow down the mountain like a slow river. When lava cools, it turns into hard, black rock.\n\nSome volcanoes are asleep. They are called dormant volcanoes. Scientists called volcanologists watch them carefully to keep people safe.' },
    { name: 'Core', text: 'A volcano is an opening in the Earth’s crust where hot, melted rock escapes. Deep below the surface, it is so hot that rock melts into a thick liquid called magma. Magma is lighter than the solid rock around it, so it slowly rises.\n\nWhen pressure builds up, the magma bursts out through the volcano. This is called an eruption. Once magma reaches the surface, we call it lava. Lava can be hotter than 1,000°C! As it flows down the slopes, it cools and hardens into new rock.\n\nVolcanoes can be active, dormant or extinct. Active volcanoes have erupted recently, dormant volcanoes are sleeping but could wake up, and extinct volcanoes will probably never erupt again. Scientists called volcanologists study volcanoes to warn people living nearby.' },
    { name: 'Challenge', text: 'Volcanoes form where the Earth’s crust is weak, often at the edges of the giant plates that fit together like a jigsaw across our planet. Far beneath the surface, intense heat melts rock into magma, which collects in a magma chamber. Because magma is lighter than the solid rock surrounding it, it gradually rises, and gases trapped inside it build up enormous pressure.\n\nEventually the pressure becomes too great and the volcano erupts, blasting out lava, ash and gas. Not all eruptions are the same: some volcanoes ooze runny lava that travels long distances, while others explode violently, hurling clouds of ash high into the sky.\n\nVolcanoes are described as active, dormant or extinct, depending on how recently they have erupted. Although eruptions can be dangerous, volcanoes also bring benefits. Volcanic ash makes soil extremely fertile, which is why many farmers grow crops on the slopes. Today, volcanologists use instruments to measure earthquakes, gases and changes in the ground, helping them to predict eruptions and keep communities safe.' }
  ],
  glossary: [
    { word: 'magma', meaning: 'Melted rock deep under the ground.' },
    { word: 'lava', meaning: 'Melted rock that has come out of a volcano.' },
    { word: 'eruption', meaning: 'When a volcano bursts and lets out lava, ash or gas.' },
    { word: 'crust', meaning: 'The hard, rocky outside layer of the Earth.' },
    { word: 'dormant', meaning: 'Asleep for now, but it could wake up and erupt again.' },
    { word: 'extinct', meaning: 'Will probably never erupt again.' },
    { word: 'volcanologists', meaning: 'Scientists who study volcanoes.' },
    { word: 'fertile', meaning: 'Good for growing lots of healthy plants.' }
  ],
  questions: [
    { skill: 'R', q: 'What is melted rock called when it is still under the ground?', answer: 'Magma.', levels: LEVELS },
    { skill: 'V', q: 'Find and copy the word that means “asleep for now, but could wake up”.', answer: 'Dormant.', levels: LEVELS },
    { skill: 'R', q: 'What happens to lava when it cools?', answer: 'It hardens and turns into (new) rock.', levels: LEVELS },
    { skill: 'I', q: 'Why do you think scientists watch volcanoes so carefully?', answer: 'To warn people living nearby if a volcano might erupt, so they can stay safe.', levels: LEVELS },
    { skill: 'E', q: 'Why is lava dangerous?', answer: 'It is extremely hot (it can be over 1,000°C) and it flows over the land.', levels: LEVELS },
    { skill: 'P', q: 'What might happen to a dormant volcano one day?', answer: 'It could wake up and erupt again.', levels: LEVELS },
    { skill: 'E', q: 'Why do many farmers grow crops on the slopes of volcanoes?', answer: 'Volcanic ash makes the soil very fertile, so crops grow well.', levels: ['Challenge'] },
    { skill: 'S', q: 'Sum up the text in one sentence.', answer: 'For example: Volcanoes are openings where melted rock escapes from inside the Earth, and scientists study them to keep people safe.', levels: LEVELS }
  ],
  discussion: 'Would you like to live near a volcano? Give one reason for and one reason against.',
  activity: 'Draw and label a volcano using at least five words from the glossary.',
  teacher: {
    routine: [
      'Pre-teach three glossary words (magma, lava, eruption) with actions. 2 minutes.',
      'Share the Core text and read the first paragraph aloud together. Switch levels on screen, or copy each level to a group.',
      'Independent reading: 8 minutes. Read with the Support group in a breakout room.',
      'Questions one at a time: pupils type answers in the chat, then reveal the answer.',
      'Discussion: thumbs up or down, then two or three pupils unmute to explain.'
    ],
    notes: 'All three texts share the same key facts and glossary words, so the whole class can answer most questions together. Question 7 needs the Challenge text.'
  }
};

function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Write a scaffolded reading comprehension lesson. Topic: ' + input.topic + '. Text type: ' + input.textType + '. Length: ' + input.length + '.',
      'Write ONE text at THREE reading levels for ' + input.year + ': "Support" (simpler words, shorter sentences), "Core" (the expected standard) and "Challenge" (richer vocabulary and longer sentences).',
      'All three levels must share the same key facts, the same events and the same glossary words, so the whole class can discuss it together.',
      'Then write VIPERS questions with answers.'
    ].join('\n'),
    rules: [
      'Word counts: Short means about 100 / 160 / 220 words; Medium means about 150 / 230 / 300 words (Support / Core / Challenge).',
      'Split paragraphs with a blank line (\\n\\n) inside each text.',
      'For fiction, poems and diaries, keep the same characters and events at every level. For non-fiction, every fact must be true.',
      'glossary: 6 to 8 words that appear in the texts, with child-friendly meanings.',
      'questions: 7 to 9 VIPERS questions. "skill" is one letter: V (vocabulary), I (infer), P (predict), E (explain), R (retrieve), S (summarise). "levels" lists the levels whose text can answer it.',
      'Answers are short and correct, and come from the text.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const levels = LEVELS.map((name) => {
    const l = arr(raw.levels).find((x) => x && str(x.name).toLowerCase() === name.toLowerCase());
    return { name, text: str(l && l.text) };
  });
  if (levels.filter((l) => l.text).length < 2) return null;
  levels.forEach((l, i) => { if (!l.text) l.text = levels[i === 0 ? 1 : i - 1].text; });
  const t = raw.teacher || {};
  return {
    title: str(raw.title) || input.topic || 'Reading', textType: str(raw.textType) || input.textType || '',
    levels,
    glossary: arr(raw.glossary).map((g) => ({ word: str(g && g.word), meaning: str(g && g.meaning) })).filter((g) => g.word).slice(0, 10),
    questions: arr(raw.questions).map((q) => {
      const sk = str(q && q.skill).charAt(0).toUpperCase();
      const lv = arr(q && q.levels).map(str).filter((x) => LEVELS.includes(x));
      return { skill: SKILLS[sk] ? sk : 'R', q: str(q && q.q), answer: str(q && q.answer), levels: lv.length ? lv : LEVELS };
    }).filter((q) => q.q).slice(0, 10),
    discussion: str(raw.discussion), activity: str(raw.activity),
    teacher: { routine: strs(t.routine, 8), notes: str(t.notes) }
  };
}
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function textHTML(text, glossary) {
  const used = new Set();
  return text.split(/\n\s*\n|\n/).filter((p) => p.trim()).map((p) => {
    let h = esc(p);
    glossary.forEach((g, i) => {
      if (used.has(i)) return;
      const stem = g.word.replace(/(es|s)$/i, '').length > 3 ? g.word.replace(/(es|s)$/i, '') : g.word;
      const re = new RegExp('\\b(' + reEsc(esc(stem)) + '[a-z]*)\\b', 'gi');
      let m;
      while ((m = re.exec(h))) {
        const before = h.slice(0, m.index);
        const inTag = /<[^>]*$/.test(before);
        const inBtn = (before.match(/<button/g) || []).length > (before.match(/<\/button>/g) || []).length;
        if (inTag || inBtn) continue;
        h = before + '<button type="button" class="gw" data-g="' + i + '">' + m[1] + '</button>' + h.slice(m.index + m[1].length);
        used.add(i);
        break;
      }
    });
    return '<p>' + h + '</p>';
  }).join('');
}

const screens = (eng) => [
  {
    title: 'Read',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.read || (ctx.state.read = { lv: 1, g: -1 });
      board.innerHTML = B.pad(eng, { kick: d.textType || 'Read', icon: 'reading', say: 'think', title: d.title });
      const body = B.body(board);
      const paint = () => {
        const g = d.glossary[st.g];
        body.innerHTML = '<div class="rd"><div class="t rd-text">' + textHTML(d.levels[st.lv].text, d.glossary) + '</div><div class="rd-side">' +
          '<div class="lvl" role="group" aria-label="Reading level">' + d.levels.map((l, i) => '<button type="button" data-lv="' + i + '" aria-pressed="' + (i === st.lv) + '">' + esc(l.name) + '</button>').join('') + '</div>' +
          '<div class="t in rd-def">' + (g ? '<b>' + esc(g.word) + '</b>' + esc(g.meaning) : '<b>Key words</b>Tap an underlined word to see what it means.') + '</div>' +
          '<div class="t" style="flex:1;min-height:0;overflow:auto"><h4>' + icon('reading') + 'Glossary</h4>' + B.list(d.glossary.map((x) => x.word)) + '</div></div></div>';
        body.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => { st.lv = Number(b.dataset.lv); paint(); }));
        body.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { st.g = Number(b.dataset.g); paint(); }));
        B.fit(body.querySelector('.rd-text'), 0.72);
      };
      paint();
    }
  },
  {
    title: 'Questions',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.q || (ctx.state.q = { i: 0, shown: {} });
      board.innerHTML = B.pad(eng, { kick: 'VIPERS questions', icon: 'chat', say: 'chat', title: '', foot: '<span class="b-row"><button type="button" class="b-btn round" data-prev aria-label="Previous question">' + icon('left') + '</button><b class="qn"></b><button type="button" class="b-btn round" data-next aria-label="Next question">' + icon('right') + '</button></span><button type="button" class="b-btn go" data-ans>' + icon('eye') + 'Show answer</button>' });
      const body = B.body(board);
      const paint = () => {
        const q = d.questions[st.i]; if (!q) return;
        const sk = SKILLS[q.skill];
        body.innerHTML = '<div class="qcard"><div class="skill" style="--k:' + sk.k + '"><b>' + q.skill + '</b><span>' + sk.name + '</span></div><div><p class="q">' + esc(q.q) + '</p>' +
          (q.levels.length < 3 ? '<p class="b-sub" style="margin-top:calc(1 * var(--u))">Use the ' + esc(q.levels.join(' or ')) + ' text</p>' : '') +
          '<p class="a ' + (st.shown[st.i] ? 'b-ans' : 'b-hidden') + '">' + esc(q.answer) + '</p></div></div>';
        board.querySelector('.qn').textContent = (st.i + 1) + ' / ' + d.questions.length;
        board.querySelector('[data-ans]').textContent = st.shown[st.i] ? 'Hide answer' : 'Show answer';
        B.fit(body, 0.7);
      };
      board.querySelector('[data-prev]').addEventListener('click', () => { st.i = Math.max(0, st.i - 1); paint(); });
      board.querySelector('[data-next]').addEventListener('click', () => { st.i = Math.min(d.questions.length - 1, st.i + 1); paint(); });
      board.querySelector('[data-ans]').addEventListener('click', () => { st.shown[st.i] = !st.shown[st.i]; paint(); });
      ctx.onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); st.shown[st.i] = !st.shown[st.i]; paint(); } else if (e.key === 'ArrowDown') { st.i = Math.min(d.questions.length - 1, st.i + 1); paint(); } else if (e.key === 'ArrowUp') { st.i = Math.max(0, st.i - 1); paint(); } };
      paint();
    }
  },
  {
    title: 'Talk about it',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Talk about it', icon: 'debate', say: 'talk', title: d.discussion || 'What did you learn?' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1"><div class="t"><h4>' + icon('debate') + 'Sentence starters</h4>' + B.list(['I think… because the text says…', 'I agree with… and I would add…', 'One reason for… is…', 'On the other hand…']) + '</div>' +
        '<div class="t in"><h4>' + icon('wand') + 'Activity</h4><p class="b-big" style="font-size:calc(2.2 * var(--u))">' + esc(d.activity || 'Draw a picture to show the most important idea.') + '</p></div></div>';
    }
  }
];

const eng = {
  id: 'reading', name: 'Reading Ladder', short: 'Reading', color: 'teal', icon: 'reading',
  kicker: 'English · reading comprehension', tagline: 'One text at three levels with the same key facts, plus VIPERS questions.',
  about: 'One text written at three reading levels (same facts, same key words) so the whole class reads together. Tap words to define them, then work through VIPERS questions.',
  chips: ['Reading', '30–40 minutes', 'Three levels'], cta: 'Write the texts', savedLabel: 'texts',
  sym: { hello: 'Give me a <b>topic</b> and text type. I’ll write it at three levels with the same facts, so every reader joins in.', thinking: 'Writing the Core text first, then the Support and Challenge versions…', done: 'Switch levels on the Read screen, then step through the questions.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 3' },
    { id: 'topic', type: 'text', label: 'Topic', required: true, placeholder: 'For example: The Romans in Britain', chips: ['Volcanoes', 'The Ancient Egyptians', 'A day on Mars', 'Plastic in the ocean', 'The lost puppy'], tip: 'Any topic from your curriculum, or a story idea.', missing: 'Type a topic first, for example “Volcanoes”.' },
    { id: 'textType', type: 'select', label: 'Text type', options: ['Non-fiction report', 'Explanation', 'Fiction story', 'Diary entry', 'Newspaper report', 'Biography', 'Poem'], value: 'Non-fiction report' },
    { id: 'length', type: 'pills', label: 'Length', options: ['Short', 'Medium'], value: 'Short' }
  ],
  example: { input: { year: 'Year 3', topic: 'Volcanoes', textType: 'Non-fiction report', length: 'Short' }, data: EXAMPLE },
  progress: [['title', 'Planning the text'], ['Support', 'Writing the Support text'], ['Core', 'Writing the Core text'], ['Challenge', 'Writing the Challenge text'], ['glossary', 'Choosing the key words'], ['questions', 'Writing VIPERS questions'], ['teacher', 'Writing your notes']],
  maxTokens: 6000,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, d.textType].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'Questions and answers', icon: 'chat', full: true, table: { head: ['Skill', 'Question', 'Answer', 'Text'], rows: d.questions.map((q) => [SKILLS[q.skill].name, q.q, q.answer, q.levels.length === 3 ? 'All' : q.levels.join(', ')]) } },
      { h: 'Glossary', icon: 'reading', pairs: d.glossary.map((g) => [g.word, g.meaning]) },
      { h: 'Teacher note', icon: 'info', text: d.teacher.notes || 'Every level shares the same key facts.' },
      { h: 'Word counts', icon: 'layers', pairs: d.levels.map((l) => [l.name, l.text.split(/\s+/).filter(Boolean).length + ' words']) }
    ];
  },
  chat(d) {
    return {
      title: d.title + ' (' + d.textType + ')', sub: 'Read your level carefully. Then answer the questions in the chat.',
      sections: d.levels.map((l) => ({ h: l.name + ' text', text: l.text.replace(/\n\s*\n/g, '\n\n') })).concat([{ h: 'Questions', list: d.questions.map((q) => q.q), ordered: true }])
    };
  }
};
export default eng;
