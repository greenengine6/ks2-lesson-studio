/* Create: one place to make anything for the class (Rabinder's points 1, 2 and 4). The four makers first (lesson
   slides, worksheet, quiz, game), then the ten lesson starters (the engines) tidied into one grid, then the other
   ways to make slides. #/create/starters scrolls to the starters. */
import { $, esc, icon } from './core.js?v=de4f9a51';
import { ENGINES } from './engines/registry.js?v=de4f9a51';

const MAKERS = [
  { href: '#/lkie', icon: 'pack', name: 'Lesson slides', c: '#5B52E6', c2: '#8B84FF', text: 'One topic in, a whole lesson out: slides with a picture or an exact diagram on every slide, key words, activities, teacher notes and a worksheet in three levels.', chips: ['Any KS2 subject', 'PowerPoint and Word'] },
  { href: '#/worksheet', icon: 'sheet', name: 'Worksheet', c: '#2E7D4F', c2: '#3FB57A', text: 'From a topic, a lesson, or a sample you upload (a photo, a PDF or a Word file): the same skills and layout, with new questions.', chips: ['Three levels', 'Answer sheet'] },
  { href: '#/quiz', icon: 'quiz', name: 'Quiz', c: '#B85A12', c2: '#F08A3C', text: 'Write it or let Symphony draft it. Play it live on pupils’ devices, or as a team board game on the big screen.', chips: ['Like Quizizz', 'Like Baamboozle'] },
  { href: '#/game', icon: 'game', name: 'Game', c: '#C7356F', c2: '#F06A9C', text: 'Describe a game in your own words. Symphony builds it: balloon pop, match pairs, sort it, quiz race, memory, or something new.', chips: ['Play on the board', 'Pupils’ devices'] }
];
let view = null;

function render(sub) {
  view.innerHTML = '<div class="pg cr">' +
    '<header class="pg-head"><p class="kicker">Create</p><h1>What would you like to make?</h1><p class="pg-sub">Each one takes about a minute and is filed in My subjects by itself.</p></header>' +
    '<div class="cr-makers">' + MAKERS.map((m) => '<a class="cr-maker" href="' + m.href + '" style="--a:' + m.c + ';--b:' + m.c2 + '"><span class="cr-ico">' + icon(m.icon) + '</span>' +
      '<span class="cr-t"><b>' + esc(m.name) + '</b><span>' + esc(m.text) + '</span><span class="cr-chips">' + m.chips.map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</span></span><span class="cr-go" aria-hidden="true">' + icon('right') + '</span></a>').join('') + '</div>' +
    '<section class="pg-sec" id="starters" aria-labelledby="cr-st-h"><div class="pg-sec-h"><h2 id="cr-st-h">Lesson starters</h2><span class="fine">Ten ready-made activities, each with a class screen to share and teacher notes</span></div>' +
    '<div class="cr-starters">' + ENGINES.map((e) => '<a class="cr-st" href="#/' + e.id + '" style="--c:var(--' + e.color + ')"><span class="cr-sti">' + icon(e.icon) + '</span><span class="cr-stt"><b>' + esc(e.name) + '</b><small>' + esc(e.tagline) + '</small>' +
      '<span class="cr-chips">' + e.chips.slice(0, 2).map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</span></span></a>').join('') + '</div></section>' +
    '<section class="pg-sec" aria-labelledby="cr-more-h"><h2 id="cr-more-h">More ways to make lessons</h2><div class="cr-more">' +
      '<a class="cr-st" href="#/slides" style="--c:var(--violet)"><span class="cr-sti">' + icon('slides') + '</span><span class="cr-stt"><b>Two-way slides (Slide Studio)</b><small>About 12 slides where pupils answer all the time, with answers, a lesson plan and a PowerPoint.</small></span></a>' +
      '<a class="cr-st" href="#/lkie" data-unit style="--c:var(--heart)"><span class="cr-sti">' + icon('layers') + '</span><span class="cr-stt"><b>Plan a whole unit</b><small>Up to 25 lessons in order, with recaps and checks, then make each one. In Lesson slides, open “Plan a unit”.</small></span></a>' +
      '<a class="cr-st" href="#/calendar" style="--c:var(--blue)"><span class="cr-sti">' + icon('cal') + '</span><span class="cr-stt"><b>Plan my week</b><small>Symphony suggests a topic for every lesson on your timetable, then you make each one from the calendar.</small></span></a>' +
    '</div></section></div>';
  if (sub === 'starters') requestAnimationFrame(() => { const s = $('#starters', view); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}
export function mount(v, sub) { view = v; render(sub); }
export function leave() { /* nothing running */ }
