/* Engine 5: Sound Journey. Pupils close their eyes and travel: the screen reads the journey aloud over live
   ambient sound (rain, forest, river, night…) with calm moving waves, then they guess where they are,
   open the fact file, compare it with home and learn to say hello. */
import { esc, str, arr, strs, icon, toast, sleep } from '../core.js?v=51f31f48';
import { B } from './shared.js?v=51f31f48';
import { buildPrompt } from './prompt.js?v=51f31f48';
import { Waves } from '../fx/waves.js?v=51f31f48';
import { Ambient, Speech, SOUND_KINDS } from '../fx/sound.js?v=51f31f48';

const SOUND_LABEL = { rain: 'Rain', ocean: 'Ocean waves', wind: 'Wind', river: 'River', forest: 'Forest', birds: 'Birdsong', night: 'Night sounds', city: 'City', market: 'Busy market', none: 'Quiet' };

const EXAMPLE = {
  place: 'The Amazon rainforest, Brazil',
  title: 'A day in the rainforest',
  focus: 'Landscapes and daily life',
  journey: [
    { sound: 'rain', text: 'Close your eyes. Warm rain is pattering on thousands of giant leaves above you. The air feels hot and heavy, like a steamy bathroom.' },
    { sound: 'forest', text: 'The rain stops. Birds call to each other from high up in the canopy. Far away, a troop of howler monkeys roars across the treetops.' },
    { sound: 'river', text: 'We walk down to a wide, brown river. It is so wide you can hardly see the other side. A wooden boat glides past, carrying fruit to a village.' },
    { sound: 'night', text: 'Night falls quickly here, at about six o’clock. Frogs croak, insects buzz and click, and fireflies blink between the trees.' }
  ],
  guess: {
    question: 'Where in the world do you think we are?',
    clues: ['We are very close to the Equator.', 'This is the largest rainforest on Earth.', 'Its river carries more water than any other river in the world.'],
    answer: 'The Amazon rainforest in Brazil, South America'
  },
  facts: {
    continent: 'South America',
    country: 'Brazil (the rainforest also stretches into eight other countries and territories)',
    hemisphere: 'Mostly the Southern Hemisphere, around the Equator',
    climate: 'Tropical: hot and wet all year, about 27°C',
    coordinates: 'About 3°S, 60°W',
    physical: ['The Amazon River is about 6,400 km long.', 'The forest has layers: emergent, canopy, understorey and forest floor.', 'It rains on most days of the year.'],
    human: ['Indigenous peoples have lived here for thousands of years, and still do today.', 'Manaus is a big city right in the middle of the rainforest.', 'Many people travel by boat because there are few roads.']
  },
  mapTasks: ['Find the Equator on a world map. Follow it to South America.', 'Find Brazil and the Amazon River. Which ocean does the river flow into?', 'Is the Amazon north or south of the UK? Which direction would a plane fly?'],
  compare: [
    { topic: 'Weather', there: 'Hot and rainy all year round', here: 'Four seasons, cooler and changeable' },
    { topic: 'Daylight', there: 'About 12 hours of daylight every day of the year', here: 'Long summer days and short winter days' },
    { topic: 'Travel', there: 'Boats on the river', here: 'Cars, buses and trains on roads' },
    { topic: 'Landscape', there: 'Thick rainforest and huge rivers', here: 'Fields, hills, towns and woodland' }
  ],
  culture: {
    greeting: { language: 'Portuguese', lang: 'pt-BR', phrase: 'Olá! Tudo bem?', say: 'oh-LAH! TOO-doo bayn?', meaning: 'Hello! How are you?' },
    facts: ['Portuguese is the main language of Brazil.', 'Many Indigenous peoples of the Amazon speak their own languages.', 'Brazil nuts and açaí berries grow in the rainforest.'],
    respect: 'Talk about Indigenous peoples in the present tense: they live in the Amazon today, in villages, towns and cities, and many work to protect the forest.'
  },
  questions: ['Which sounds told you we were in a rainforest?', 'Why do many people travel by boat here?', 'How is the weather different from where you live?', 'Why is it important to protect the rainforest?'],
  vocabulary: [
    { word: 'canopy', meaning: 'The top layer of leaves in a forest.' },
    { word: 'tropical', meaning: 'Hot and wet, near the Equator.' },
    { word: 'Equator', meaning: 'An imaginary line around the middle of the Earth.' },
    { word: 'Indigenous', meaning: 'The first peoples to live in a place.' },
    { word: 'tributary', meaning: 'A smaller river that flows into a bigger one.' }
  ],
  teacher: {
    routine: [
      'Ask pupils to close their eyes. Press Play journey: the screen reads each part aloud over rain, forest, river and night sounds. Tick “Share sound” in Teams or Zoom. 4 minutes.',
      'Pupils type one word about what they heard. Then reveal the clues one by one and let them guess. 4 minutes.',
      'Fact file and map tasks: pupils use an atlas or an online map at home. 8 minutes.',
      'Here and there: one similarity and one difference in the chat. 6 minutes.',
      'Say hello in Portuguese together. 2 minutes.'
    ],
    notes: 'If the computer has no Portuguese voice, read the pronunciation guide aloud yourself.'
  }
};

function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create an immersive geography lesson about this place: ' + input.place + '. Geography focus: ' + input.focus + '.',
      'It starts with a "sound journey": 4 to 6 short paragraphs in the present tense that the teacher plays aloud while pupils close their eyes. Each paragraph names a sound scene for the background audio. Do not name the place in the journey: pupils will guess it.',
      'Then: guessing clues, a fact file, map tasks, a comparison with the United Kingdom, a greeting in a local language, questions and vocabulary.'
    ].join('\n'),
    rules: [
      'journey[].sound is one of: ' + SOUND_KINDS.concat(['none']).join(', ') + '. Choose the one that matches each paragraph.',
      'Every fact must be accurate and current. Use approximate numbers ("about") where exact numbers vary.',
      'Represent people and cultures respectfully and accurately: show modern everyday life as well as traditions, and avoid stereotypes or a single story.',
      'culture.greeting.lang is a BCP-47 language code (for example pt-BR, ja-JP, sw-KE) so the computer can say it; culture.greeting.say is an easy English-letters pronunciation guide.',
      'compare: 3 or 4 rows comparing "there" with "here" (the UK).'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const journey = arr(raw.journey).map((j) => ({ sound: SOUND_KINDS.includes(str(j && j.sound)) ? str(j.sound) : 'none', text: str(j && j.text) })).filter((j) => j.text).slice(0, 7);
  if (journey.length < 2) return null;
  const g = raw.guess || {}, f = raw.facts || {}, c = raw.culture || {}, gr = c.greeting || {}, t = raw.teacher || {};
  return {
    place: str(raw.place) || input.place, title: str(raw.title) || 'Sound journey', focus: str(raw.focus) || input.focus,
    journey,
    guess: { question: str(g.question) || 'Where in the world are we?', clues: strs(g.clues, 5), answer: str(g.answer) || str(raw.place) || input.place },
    facts: { continent: str(f.continent), country: str(f.country), hemisphere: str(f.hemisphere), climate: str(f.climate), coordinates: str(f.coordinates), physical: strs(f.physical, 5), human: strs(f.human, 5) },
    mapTasks: strs(raw.mapTasks, 5),
    compare: arr(raw.compare).map((x) => ({ topic: str(x && x.topic), there: str(x && x.there), here: str(x && x.here) })).filter((x) => x.topic).slice(0, 5),
    culture: { greeting: { language: str(gr.language), lang: str(gr.lang) || 'en-GB', phrase: str(gr.phrase), say: str(gr.say), meaning: str(gr.meaning) }, facts: strs(c.facts, 4), respect: str(c.respect) },
    questions: strs(raw.questions, 6),
    vocabulary: arr(raw.vocabulary).map((v) => ({ word: str(v && v.word), meaning: str(v && v.meaning) })).filter((v) => v.word).slice(0, 8),
    teacher: { routine: strs(t.routine, 8), notes: str(t.notes) }
  };
}

function journeyScreen(eng) {
  return {
    title: 'Close your eyes',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.j || (ctx.state.j = { i: 0, voice: true, sound: true });
      st.playing = false;
      board.innerHTML = B.pad(eng, { kick: 'Sound journey', icon: 'sound', say: 'listen', title: 'Close your eyes and listen…',
        foot: '<span class="jdots"></span><span class="jctl">' +
          '<button type="button" class="b-btn round" data-prev aria-label="Previous part">' + icon('left') + '</button>' +
          '<button type="button" class="b-btn go" data-play>' + icon('play') + '<span>Play journey</span></button>' +
          '<button type="button" class="b-btn round" data-next aria-label="Next part">' + icon('right') + '</button>' +
          '<button type="button" class="b-btn" data-voice aria-pressed="' + st.voice + '">' + icon('mic') + 'Voice</button>' +
          '<button type="button" class="b-btn" data-sound aria-pressed="' + st.sound + '">' + icon('volume') + 'Sounds</button></span>' });
      const body = B.body(board);
      body.innerHTML = '<div class="journey"><span class="jsnd"></span><p class="jtxt"></p></div>';
      const jr = body.querySelector('.journey');
      let waves = null;
      if (!ctx.still) waves = new Waves(jr, { lineColor: 'rgba(53,132,214,.26)', waveAmpX: 34, waveAmpY: 18, xGap: 12, yGap: 34 });
      const txt = body.querySelector('.jtxt'), snd = body.querySelector('.jsnd'), dots = board.querySelector('.jdots');
      const paint = (fade) => {
        const p = d.journey[st.i];
        const set = () => { txt.textContent = p.text; txt.classList.remove('out'); snd.innerHTML = icon('sound') + esc(SOUND_LABEL[p.sound] || ''); };
        if (fade) { txt.classList.add('out'); setTimeout(set, 450); } else set();
        dots.innerHTML = d.journey.map((x, k) => '<i class="' + (k <= st.i ? 'on' : '') + '"></i>').join('');
        const pb = board.querySelector('[data-play]');
        pb.innerHTML = st.playing ? icon('pause') + '<span>Pause</span>' : icon('play') + '<span>' + (st.i > 0 ? 'Play from here' : 'Play journey') + '</span>';
        B.fit(jr, 0.72);
      };
      let token = 0;
      const run = async () => {
        const my = ++token;
        while (st.playing && my === token && st.i < d.journey.length) {
          const p = d.journey[st.i];
          if (st.sound) Ambient.play(p.sound); else Ambient.stop();
          if (st.voice && Speech.supported) { await sleep(600); if (!st.playing || my !== token) break; await Speech.speak(p.text, { lang: 'en-GB', rate: 0.88 }); }
          else await sleep(2500 + p.text.split(/\s+/).length * 420);
          if (!st.playing || my !== token) break;
          await sleep(1400);
          if (!st.playing || my !== token) break;
          if (st.i < d.journey.length - 1) { st.i++; paint(true); } else { st.playing = false; paint(); setTimeout(() => { if (!st.playing) Ambient.stop(); }, 4000); }
        }
      };
      const stop = () => { st.playing = false; token++; Speech.stop(); paint(); };
      board.querySelector('[data-play]').addEventListener('click', () => {
        if (st.playing) { stop(); return; }
        if (st.i >= d.journey.length - 1 && token > 0) st.i = 0;
        st.playing = true; paint(); run();
      });
      board.querySelector('[data-prev]').addEventListener('click', () => { const was = st.playing; stop(); st.i = Math.max(0, st.i - 1); paint(true); if (st.sound) Ambient.play(d.journey[st.i].sound); if (was) { st.playing = true; run(); } });
      board.querySelector('[data-next]').addEventListener('click', () => { const was = st.playing; stop(); st.i = Math.min(d.journey.length - 1, st.i + 1); paint(true); if (st.sound) Ambient.play(d.journey[st.i].sound); if (was) { st.playing = true; run(); } });
      board.querySelector('[data-voice]').addEventListener('click', (e) => { st.voice = !st.voice; e.currentTarget.setAttribute('aria-pressed', String(st.voice)); if (!st.voice) Speech.stop(); if (!Speech.supported && st.voice) toast('This browser cannot read aloud. Read the words yourself.'); });
      board.querySelector('[data-sound]').addEventListener('click', (e) => { st.sound = !st.sound; e.currentTarget.setAttribute('aria-pressed', String(st.sound)); if (st.sound) Ambient.play(d.journey[st.i].sound); else Ambient.stop(); });
      ctx.cleanup = () => { st.playing = false; token++; Speech.stop(); Ambient.stop(); if (waves) waves.destroy(); };
      ctx.onKey = (e) => { if (e.key === ' ') { e.preventDefault(); board.querySelector('[data-play]').click(); } };
      paint();
    }
  };
}

const screens = (eng) => [
  journeyScreen(eng),
  {
    title: 'Where are we?',
    render(board, ctx) {
      const d = ctx.data, st = ctx.state.g || (ctx.state.g = { n: 1, ans: false });
      board.innerHTML = B.pad(eng, { kick: 'Where in the world?', icon: 'globe', say: 'chat', title: d.guess.question, foot: '<button type="button" class="b-btn" data-clue>' + icon('plus') + 'Next clue</button><button type="button" class="b-btn go" data-ans>' + icon('map') + 'Reveal the place</button>' });
      const body = B.body(board);
      const paint = () => {
        body.innerHTML = '<div class="guess"><div class="t"><h4>' + icon('search') + 'Clues</h4><ol class="b-num">' + d.guess.clues.map((c, i) => '<li class="b-fade' + (i < st.n ? ' on' : '') + '"><span>' + esc(c) + '</span></li>').join('') + '</ol></div>' +
          '<div class="t in ans">' + (st.ans ? '<p>' + esc(d.guess.answer) + '</p>' : '<span class="qm" style="font-family:var(--f-display);font-weight:800;font-size:calc(8 * var(--u));color:var(--c)">?</span>') + '</div></div>';
      };
      board.querySelector('[data-clue]').addEventListener('click', () => { st.n = Math.min(d.guess.clues.length, st.n + 1); paint(); });
      board.querySelector('[data-ans]').addEventListener('click', () => { st.ans = !st.ans; st.n = d.guess.clues.length; paint(); });
      paint();
    }
  },
  {
    title: 'Fact file',
    render(board, ctx) {
      const f = ctx.data.facts;
      board.innerHTML = B.pad(eng, { kick: 'Fact file', icon: 'map', say: 'think', title: ctx.data.place });
      const kv = [['Continent', f.continent], ['Country', f.country], ['Hemisphere', f.hemisphere], ['Climate', f.climate], ['Location', f.coordinates]].filter((x) => x[1]);
      const body = B.body(board);
      body.innerHTML = '<div class="facts"><div class="t wide"><dl class="kv">' + kv.map((x) => '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>').join('') + '</dl></div>' +
        '<div class="t"><h4>' + icon('globe') + 'Physical</h4>' + B.list(f.physical) + '</div><div class="t"><h4>' + icon('home') + 'Human</h4>' + B.list(f.human) + '</div>' +
        '<div class="t in"><h4>' + icon('map') + 'Map tasks</h4>' + B.list(ctx.data.mapTasks) + '</div></div>';
      body.querySelectorAll('.t').forEach((t) => B.fit(t, 0.7));
    }
  },
  {
    title: 'Here and there',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Compare', icon: 'layers', say: 'chat', title: 'How is it different from where we live?' });
      B.body(board).innerHTML = '<div class="cmp"><span></span><span class="h">There</span><span class="h">Here (UK)</span>' + d.compare.map((c) => '<span class="k">' + esc(c.topic) + '</span><span class="t">' + esc(c.there) + '</span><span class="t in">' + esc(c.here) + '</span>').join('') + '</div>';
    }
  },
  {
    title: 'Say hello',
    render(board, ctx) {
      const g = ctx.data.culture.greeting;
      board.innerHTML = B.pad(eng, { kick: g.language ? 'Say it in ' + g.language : 'Say hello', icon: 'mic', say: 'talk', title: '', foot: '<span>' + esc(ctx.data.culture.facts[0] || '') + '</span><button type="button" class="b-btn go" data-hear>' + icon('volume') + 'Hear it</button>' });
      B.body(board).innerHTML = '<div class="hello"><p class="phrase">' + esc(g.phrase || 'Hello!') + '</p><p class="say">' + esc(g.say) + '</p><p class="mean">' + esc(g.meaning) + '</p></div>';
      board.querySelector('[data-hear]').addEventListener('click', async () => {
        if (!Speech.supported) { toast('This browser cannot speak. Use the pronunciation guide.'); return; }
        if (!Speech.hasVoice(g.lang)) toast('No ' + (g.language || 'local') + ' voice on this computer: it will sound English. Use the guide too.');
        Speech.stop(); await Speech.speak(g.phrase, { lang: g.lang, rate: 0.78 });
      });
      ctx.cleanup = () => Speech.stop();
    }
  },
  {
    title: 'Think about it',
    render(board, ctx) {
      const d = ctx.data;
      board.innerHTML = B.pad(eng, { kick: 'Think about it', icon: 'bulb', say: 'chat', title: 'Geography detectives' });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1"><div class="t"><h4>' + icon('chat') + 'Questions</h4>' + B.num(d.questions) + '</div><div class="t in"><h4>' + icon('reading') + 'Key words</h4><dl class="kv">' + d.vocabulary.map((v) => '<dt>' + esc(v.word) + '</dt><dd>' + esc(v.meaning) + '</dd>').join('') + '</dl></div></div>';
    }
  }
];

const eng = {
  id: 'sound', name: 'Sound Journey', short: 'Geography', color: 'blue', icon: 'sound',
  kicker: 'Geography · culture', tagline: 'Close your eyes and travel: a narrated journey with live sounds, then guess where you are.',
  about: 'Pupils close their eyes while the screen reads a journey over live rain, forest, river or city sounds. Then they guess where they are, open the fact file, compare it with home and say hello.',
  chips: ['Geography', '25–35 minutes', 'Sound on'], cta: 'Plan the journey', savedLabel: 'journeys',
  sym: { hello: 'Where shall we go? Give me a <b>place</b>. I’ll write a journey your class hears with their eyes closed.', thinking: 'Listening to the place and writing the journey…', done: 'Present it and press <b>Play journey</b>. Tick “Share sound” on your video call.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 4' },
    { id: 'place', type: 'text', label: 'Place', required: true, placeholder: 'For example: Tokyo, Japan', chips: ['Tokyo, Japan', 'The Sahara Desert', 'Reykjavik, Iceland', 'Mumbai, India', 'The Maasai Mara, Kenya', 'The Arctic'], tip: 'A city, country, landscape or region anywhere in the world.', missing: 'Type a place first, for example “Tokyo, Japan”.' },
    { id: 'focus', type: 'select', label: 'Geography focus', options: ['Landscapes and daily life', 'Climate and weather', 'Rivers and coasts', 'Cities and settlements', 'Comparing with our area', 'Biomes and wildlife'], value: 'Landscapes and daily life' }
  ],
  example: { input: { year: 'Year 4', place: 'The Amazon rainforest', focus: 'Landscapes and daily life' }, data: EXAMPLE },
  progress: [['place', 'Choosing the journey'], ['journey', 'Writing the sound journey'], ['guess', 'Hiding the clues'], ['facts', 'Checking the fact file'], ['compare', 'Comparing it with home'], ['culture', 'Learning to say hello'], ['teacher', 'Writing your notes']],
  maxTokens: 4500,
  prompt, normalize,
  title: (d) => d.place,
  presentTitle: () => 'Where in the world?',
  sub: (d, input) => [input && input.year, d.focus].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'Sound check', icon: 'volume', text: 'In Teams: Share → tick “Include computer sound”. In Zoom: Share Screen → tick “Share sound”. In Google Meet: share a Chrome tab and keep “Also share tab audio” on. ' + (d.teacher.notes || '') },
      { h: 'The journey', icon: 'sound', list: d.journey.map((j) => (SOUND_LABEL[j.sound] || 'Quiet') + ': ' + j.text), ordered: true, full: true },
      { h: 'Answer', icon: 'map', text: d.guess.answer },
      { h: 'Culture', icon: 'globe', list: d.culture.facts.concat(d.culture.respect ? ['Teaching note: ' + d.culture.respect] : []) },
      { h: 'Greeting', icon: 'mic', pairs: [[d.culture.greeting.phrase, d.culture.greeting.say + ' (' + d.culture.greeting.meaning + ')']] }
    ];
  },
  chat(d) {
    return {
      title: 'Where in the world are we?', sub: 'Listen to the clues and type your guess in the chat.',
      sections: [{ h: 'Clues', list: d.guess.clues, ordered: true }, { h: 'Map tasks', list: d.mapTasks }, { h: 'Questions', list: d.questions }]
    };
  }
};
export default eng;
