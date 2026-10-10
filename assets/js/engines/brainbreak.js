/* Engine 9: Brain Break. A timed script that Symphony leads: she grows as pupils breathe in and shrinks as they
   breathe out, over calm moving waves, with optional read-aloud and ocean, rain or forest sounds. */
import { esc, str, arr, strs, num, clamp, icon, reduceMotion } from '../core.js';
import { B } from './shared.js';
import { buildPrompt } from './prompt.js';
import { Waves } from '../fx/waves.js';
import { Ambient, Speech } from '../fx/sound.js';
import { Symphony } from '../fx/symphony.js';

const CUES = { in: 'Breathe in', out: 'Breathe out', hold: 'Hold', still: 'Relax', listen: 'Listen', move: 'Move' };
const TYPES = ['Calm breathing', 'Stretch and move', 'Focus and grounding', 'Visualisation', 'Gratitude', 'Energiser'];

const EXAMPLE = {
  title: 'Ocean Breathing',
  type: 'Calm breathing',
  intro: 'Let’s take a calm break. Sit comfortably with your feet flat on the floor and your hands resting on your knees.',
  steps: [
    { say: 'Close your eyes if you like, or look softly at the floor.', seconds: 8, cue: 'still' },
    { say: 'Imagine you are sitting on warm sand beside a calm blue sea.', seconds: 10, cue: 'still' },
    { say: 'Breathe in slowly through your nose, like a wave rolling up the beach.', seconds: 4, cue: 'in' },
    { say: 'Breathe out gently through your mouth, like the wave sliding back.', seconds: 6, cue: 'out' },
    { say: 'Breathe in… the wave rolls in.', seconds: 4, cue: 'in' },
    { say: 'Breathe out… the wave rolls out.', seconds: 6, cue: 'out' },
    { say: 'Breathe in… feel your tummy rise.', seconds: 4, cue: 'in' },
    { say: 'Breathe out… let your shoulders drop.', seconds: 6, cue: 'out' },
    { say: 'Listen. What can you hear around you right now?', seconds: 15, cue: 'listen' },
    { say: 'Feel the warm sun on your face. Your arms feel soft and heavy.', seconds: 12, cue: 'still' },
    { say: 'Breathe in… a big, slow wave.', seconds: 4, cue: 'in' },
    { say: 'Breathe out… all the way.', seconds: 6, cue: 'out' },
    { say: 'Breathe in…', seconds: 4, cue: 'in' },
    { say: 'And out…', seconds: 6, cue: 'out' },
    { say: 'Picture a little boat floating far out on the water. It is safe and calm, just like you.', seconds: 15, cue: 'still' },
    { say: 'Breathe in… the wave rolls in.', seconds: 4, cue: 'in' },
    { say: 'Breathe out… the wave rolls out.', seconds: 6, cue: 'out' },
    { say: 'One more breath in…', seconds: 4, cue: 'in' },
    { say: 'And a long breath out.', seconds: 6, cue: 'out' },
    { say: 'Think of one thing that makes you smile.', seconds: 15, cue: 'still' },
    { say: 'Breathe in…', seconds: 4, cue: 'in' },
    { say: 'And out…', seconds: 6, cue: 'out' },
    { say: 'Wiggle your fingers and your toes.', seconds: 10, cue: 'move' },
    { say: 'Slowly open your eyes. Notice how calm your body feels.', seconds: 15, cue: 'still' }
  ],
  closing: 'Well done. Take that calm feeling with you into the next part of our lesson.',
  adapt: ['Pupils can keep their eyes open and watch Symphony breathe.', 'Hands on tummies helps pupils feel each breath rise and fall.', 'Anyone who feels uncomfortable can draw slow waves on paper instead.'],
  why: 'Slow breathing with a longer breath out helps the body calm down and get ready to learn.'
};

function prompt(input, mode) {
  const secs = (parseInt(input.minutes, 10) || 3) * 60;
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Write a ' + (parseInt(input.minutes, 10) || 3) + '-minute brain break script. Type: ' + input.type + '.' + (input.theme ? ' Theme: ' + input.theme + '.' : ''),
      'The teacher plays it on screen: each step is shown (and can be read aloud) for its number of seconds, and the on-screen character grows on "in" and shrinks on "out".',
      'The seconds of all steps must add up to about ' + secs + ' (within 10%).'
    ].join('\n'),
    rules: [
      'steps[].cue is one of: in, out, hold, still, listen, move. Breathing steps are 3 to 5 seconds in and 4 to 7 seconds out; never hold the breath for more than 4 seconds.',
      'Short sentences, calm and kind. Everything can be done sitting at a desk or a kitchen table, in a small space, with no equipment.',
      'Movement must be gentle and safe for every child, including children with limited mobility: give a seated option in adapt.',
      'No medical claims. "why" is one simple sentence for the teacher.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const steps = arr(raw.steps).map((s) => ({ say: str(s && s.say), seconds: clamp(Math.round(num(s && s.seconds, 6)), 2, 60), cue: CUES[str(s && s.cue)] ? str(s.cue) : 'still' })).filter((s) => s.say).slice(0, 40);
  if (steps.length < 3) return null;
  return { title: str(raw.title) || 'Brain break', type: str(raw.type) || input.type, intro: str(raw.intro), steps, closing: str(raw.closing), adapt: strs(raw.adapt, 5), why: str(raw.why) };
}
function soundFor(d) {
  const t = (d.title + ' ' + d.intro).toLowerCase();
  if (/rain|storm/.test(t)) return 'rain';
  if (/forest|jungle|wood|tree|garden|bird/.test(t)) return 'forest';
  if (/night|space|star|moon/.test(t)) return 'night';
  if (/river|stream|waterfall/.test(t)) return 'river';
  return 'ocean';
}

let pacerSym = null;
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);

const screens = (eng) => [{
  title: 'Brain break',
  render(board, ctx) {
    const d = ctx.data, st = ctx.state.pace || (ctx.state.pace = { t: 0, voice: true, sound: true });
    st.playing = false;
    const total = d.steps.reduce((a, s) => a + s.seconds, 0);
    board.innerHTML = B.pad(eng, { kick: d.type || 'Brain break', icon: 'breath', say: 'listen', title: d.title,
      foot: '<span class="pace-left"></span><span class="jctl"><button type="button" class="b-btn go" data-play>' + icon('play') + '<span>Start</span></button>' +
        '<button type="button" class="b-btn round" data-restart aria-label="Start again">' + icon('refresh') + '</button>' +
        '<button type="button" class="b-btn" data-voice aria-pressed="' + st.voice + '">' + icon('mic') + 'Voice</button>' +
        '<button type="button" class="b-btn" data-sound aria-pressed="' + st.sound + '">' + icon('volume') + 'Sounds</button></span>' });
    let waves = null;
    if (!ctx.still) waves = new Waves(board, { lineColor: 'rgba(26,156,184,.22)', waveSpeedX: 0.008, waveSpeedY: 0.004, waveAmpX: 36, waveAmpY: 18, xGap: 12, yGap: 36 });
    const body = B.body(board);
    const R = 46, C = 2 * Math.PI * R;
    body.innerHTML = '<div class="pacer"><div class="pace-orb"><svg class="pace-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="' + R + '"/><circle class="bar" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg><div class="pace-sym"></div></div>' +
      '<div class="pace-txt"><span class="pace-cue"></span><p class="pace-say"></p></div></div>';
    const host = body.querySelector('.pace-sym'), cue = body.querySelector('.pace-cue'), sayEl = body.querySelector('.pace-say'), bar = body.querySelector('.bar'), leftEl = board.querySelector('.pace-left');
    let sym = null;
    if (!ctx.still) { if (!pacerSym) pacerSym = new Symphony(); sym = pacerSym; sym.mount(host); sym.setState('breathe'); }
    else host.innerHTML = '<div class="sym sym--css"><div class="sym-float"><div class="sym-css" style="display:block"></div></div></div>';
    let raf = 0, last = 0, cur = -1;
    const stepAt = (t) => { let a = 0; for (let i = 0; i < d.steps.length; i++) { if (t < a + d.steps[i].seconds) return { i, start: a, p: (t - a) / d.steps[i].seconds }; a += d.steps[i].seconds; } return { i: d.steps.length, start: total, p: 1 }; };
    const breathFor = (s, p, t) => {
      if (!s) return 0.95;
      if (s.cue === 'in') return 0.78 + 0.34 * ease(p);
      if (s.cue === 'out') return 1.12 - 0.34 * ease(p);
      if (s.cue === 'hold') return 1.1;
      if (s.cue === 'move') return 0.95 + 0.06 * Math.abs(Math.sin(t * 3));
      return 0.92 + 0.02 * Math.sin(t * 1.2);
    };
    const paint = (now) => {
      const at = stepAt(st.t), s = d.steps[at.i];
      if (at.i !== cur) {
        cur = at.i;
        sayEl.classList.add('out');
        setTimeout(() => { sayEl.textContent = s ? s.say : (d.closing || 'Well done.'); sayEl.classList.remove('out'); }, reduceMotion() ? 0 : 300);
        cue.textContent = s ? CUES[s.cue] : 'All done';
        if (st.playing && s && st.voice) { Speech.stop(); Speech.speak(s.say, { lang: 'en-GB', rate: 0.86, pitch: 1 }); }
        if (st.playing && !s) { if (st.voice && d.closing) Speech.speak(d.closing, { lang: 'en-GB', rate: 0.86 }); setTimeout(() => Ambient.stop(), 3500); }
      }
      if (sym) sym.setBreath(breathFor(s, at.p, (now || 0) / 1000));
      bar.style.strokeDashoffset = (C * (1 - Math.min(1, st.t / total))).toFixed(2);
      const left = Math.max(0, Math.ceil(total - st.t));
      leftEl.textContent = st.t <= 0 ? Math.round(total / 60 * 10) / 10 + ' minutes · ' + d.steps.length + ' steps' : Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' left';
      const pb = board.querySelector('[data-play]');
      pb.innerHTML = st.playing ? icon('pause') + '<span>Pause</span>' : icon('play') + '<span>' + (st.t > 0 && st.t < total ? 'Resume' : 'Start') + '</span>';
    };
    const loop = (now) => {
      raf = 0;
      if (!st.playing) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      st.t += dt;
      if (st.t >= total) { st.t = total; st.playing = false; }
      paint(now);
      if (st.playing) raf = requestAnimationFrame(loop);
    };
    const idle = (now) => { raf = 0; if (st.playing) return; if (sym) sym.setBreath(0.92 + 0.02 * Math.sin(now / 1000 * 1.2)); if (board.isConnected) raf = requestAnimationFrame(idle); };
    const play = () => {
      if (st.t >= total) st.t = 0;
      st.playing = true; cur = -1; last = performance.now();
      if (st.sound) Ambient.play(soundFor(d));
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    };
    const pause = () => { st.playing = false; Speech.stop(); cancelAnimationFrame(raf); paint(); raf = requestAnimationFrame(idle); };
    board.querySelector('[data-play]').addEventListener('click', () => (st.playing ? pause() : play()));
    board.querySelector('[data-restart]').addEventListener('click', () => { st.t = 0; cur = -1; Speech.stop(); if (st.playing) { last = performance.now(); } else paint(); });
    board.querySelector('[data-voice]').addEventListener('click', (e) => { st.voice = !st.voice; e.currentTarget.setAttribute('aria-pressed', String(st.voice)); if (!st.voice) Speech.stop(); });
    board.querySelector('[data-sound]').addEventListener('click', (e) => { st.sound = !st.sound; e.currentTarget.setAttribute('aria-pressed', String(st.sound)); if (st.sound && st.playing) Ambient.play(soundFor(d)); else Ambient.stop(); });
    ctx.onKey = (e) => { if (e.key === ' ') { e.preventDefault(); board.querySelector('[data-play]').click(); } };
    ctx.cleanup = () => { st.playing = false; cancelAnimationFrame(raf); Speech.stop(); Ambient.stop(); if (waves) waves.destroy(); };
    paint(0);
    if (!ctx.still) raf = requestAnimationFrame(idle);
  }
}];

const eng = {
  id: 'break', name: 'Brain Break', short: 'Brain break', color: 'cyan', icon: 'breath',
  kicker: 'Wellbeing · mindfulness', tagline: 'A timed calm-down or wake-up script that Symphony leads, with sounds and read-aloud.',
  about: 'A timed brain break that Symphony leads on screen: she grows as pupils breathe in and shrinks as they breathe out, over calm waves, with optional read-aloud and nature sounds.',
  chips: ['Wellbeing', '2–5 minutes', 'Plays by itself'], cta: 'Write the brain break', savedLabel: 'brain breaks',
  sym: { hello: 'Need a calm minute, or a wake-up? Pick a <b>type</b> and length. I’ll lead it on screen and breathe with your class.', thinking: 'Timing every breath…', done: 'Present it and press <b>Start</b>. I’ll breathe with them.' },
  fields: [
    { id: 'type', type: 'pills', label: 'Type of break', options: TYPES, value: 'Calm breathing' },
    { id: 'minutes', type: 'pills', label: 'Length', options: ['2 minutes', '3 minutes', '5 minutes'], value: '3 minutes' },
    { id: 'year', type: 'year', label: 'Year group', mixed: true, value: 'Years 3 to 6' },
    { id: 'theme', type: 'text', label: 'Theme', optional: true, placeholder: 'For example: after a maths test', chips: ['After a test', 'Space', 'Rainforest', 'Before writing', 'Monday morning'] }
  ],
  example: { input: { type: 'Calm breathing', minutes: '3 minutes', year: 'Years 3 to 6', theme: 'Ocean' }, data: EXAMPLE },
  progress: [['title', 'Choosing the calm'], ['steps', 'Timing every breath'], ['closing', 'Writing the ending'], ['adapt', 'Planning adaptations']],
  maxTokens: 3000,
  model: null,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d) => d.type + ' · ' + Math.round(d.steps.reduce((a, s) => a + s.seconds, 0) / 60 * 10) / 10 + ' minutes',
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Before you start', icon: 'info', text: (d.intro ? d.intro + ' ' : '') + 'Press Start: each step shows for its time and Symphony breathes with the class. Tick “Share sound” on your call to share the voice and the sounds.', full: true },
      { h: 'The script', icon: 'breath', list: d.steps.map((s) => CUES[s.cue] + ' (' + s.seconds + 's): ' + s.say), ordered: true, full: true },
      { h: 'Make it work for everyone', icon: 'heart', list: d.adapt },
      { h: 'Why it works', icon: 'bulb', text: d.why }
    ];
  },
  chat(d) {
    return { title: d.title, sub: 'A calm break. Follow along on the screen.', sections: [{ h: 'Steps', list: d.steps.map((s) => s.say), ordered: true }, d.closing ? { h: 'To finish', text: d.closing } : null].filter(Boolean) };
  }
};
export default eng;
