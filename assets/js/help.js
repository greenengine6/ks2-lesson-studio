/* Help: How it works (every rule, howto.js), short guides for the jobs teachers do most, keyboard shortcuts, privacy
   and feedback. Kept off the everyday pages (Rabinder's point 4). */
import { esc, icon } from './core.js?v=3c9d4698';
import { soon } from './library.js?v=3c9d4698';

const GUIDES = [
  ['Make a lesson in a minute', 'pack', ['On Today, type the topic, pick the year and subject, and leave Lesson slides selected.', 'Press Make it, then Make on the next page.', 'Tap any slide to change it in plain words, for example “Make this simpler”.', 'Press Present, or download the PowerPoint.']],
  ['Teach a live class', 'users', ['Press Start class (Today, the calendar or the menu).', 'Pupils scan the QR code, or type the 6-digit code, and type a first name.', 'Tap a lesson in the lesson flow: it opens on the board, and every pupil’s device shows the slide’s words and picture. Close Present to come back to your class.', 'Press Lock devices to keep pupils on the class page: a pop-up tells you who leaves it and for how long (on the board it shows no name), and each device is asked to turn on Do Not Disturb.', 'Open the class view to see who is right, who is stuck and whose hand is up.', 'End class: a summary is saved with the lesson, with no names.']],
  ['Make a worksheet from a sample', 'sheet', ['Open Create, then Worksheet, then From a sample.', 'Upload a photo, a PDF or a Word file of a worksheet you like.', 'Symphony keeps the skills and the layout and writes new questions, then checks none were copied.', 'Download it in Word, with an answer sheet, or send it to pupils’ devices.']],
  ['Play a quiz as a team game', 'quiz', ['Open Create, then Quiz. Write the questions, or press Draft with Symphony.', 'Choose Board game for teams. Name the teams.', 'Teams take turns to pick a tile. Some tiles hide surprises.', 'Award the points. The podium appears at the end.']],
  ['Set up your week', 'cal', ['Open Calendar and follow the setup: your school day, then your lessons.', 'Tap a lesson to plan it: a topic, then make or attach what you need.', 'Press Plan my week to have Symphony suggest a topic for every lesson.', 'Add it to your phone’s calendar for a reminder before each class.']],
  ['Share homework with pupils', 'notes', ['In the calendar, tap a lesson, then Set homework.', 'Press Share with the class: a link and a QR code appear.', 'Pupils or their parents open it and tap Add to my calendar.', 'In a live class, it can go straight to every device.']],
  ['Make reading easier', 'type', ['Open Settings, then Reading support.', 'Pick a font (Lexend, Atkinson Hyperlegible, Andika, Comic Neue or OpenDyslexic), a text size and a background.', 'Switch on the reading ruler or Tap to hear it.', 'Pupils have their own Reading help on their device in a live class.']]
];
const KEYS = [['/', 'Search everything'], ['P', 'Magic pointer while presenting'], ['T', 'Timer while presenting'], ['D', 'Draw on the slide'], ['J', 'Show the join code'], ['N', 'Teacher notes'], ['C', 'Class feedback'], ['F', 'Full screen'], ['← →', 'Previous and next slide'], ['Esc', 'Close or stop']];
let view = null;
export function mount(v) {
  view = v;
  view.innerHTML = '<div class="pg hp">' +
    '<header class="pg-head"><p class="kicker">Help</p><h1>How to do things</h1><p class="pg-sub">Short guides for the jobs you do most. Every rule the site follows is in How it works.</p></header>' +
    '<div class="pg-row"><button type="button" class="btn primary" data-how="">' + icon('info') + 'How it works: every rule in one place</button><button type="button" class="btn" data-ask-symphony>Ask Symphony</button><button type="button" class="btn" data-feedback>' + icon('star') + 'Give feedback</button></div>' +
    '<div class="hp-grid">' + GUIDES.filter(([h]) => !(soon('class') && /live class|homework/i.test(h))).map(([h, ic, steps]) => '<section class="pg-card hp-g"><h2>' + icon(ic) + esc(h) + '</h2><ol>' + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol></section>').join('') + '</div>' +
    '<section class="pg-card hp-keys" aria-labelledby="hp-k"><h2 id="hp-k">' + icon('type') + 'Keyboard shortcuts</h2><dl>' + KEYS.map(([k, t]) => '<div><dt><kbd>' + esc(k) + '</kbd></dt><dd>' + esc(t) + '</dd></div>').join('') + '</dl></section>' +
    '<section class="pg-card hp-priv" aria-labelledby="hp-p"><h2 id="hp-p">' + icon('lock') + 'Privacy</h2>' +
    '<p>Your key and everything you make stay in this browser. What leaves it: the request the engine sends when you press a button; your activity for Rabinder’s reports, locked so only she can open it; live-lesson messages, locked end to end; picture searches, which go to Wikipedia; and, with Symphony’s human voice on, the sentences she says. Pupils never sign in. In a live class you see their first names and answers on your screen only; nothing about them is saved, and their names never go to the engine or the voice service.</p></section>' +
    '</div>';
}
export function leave() { /* nothing running */ }
