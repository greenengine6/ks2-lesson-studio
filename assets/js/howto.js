/* How it works: every rule on the site in one place, in plain words. It opens from the header's "How it works",
   Help page, the "?" next to Online / In class, and the Join screen. The numbers come
   from the same settings the rules themselves use (guard.js), so they are always right. */
import { $, $$, esc, icon, bus, prefs, CONFIG } from './core.js?v=af1c9ebd';
import { LIMITS } from './guard.js?v=af1c9ebd';
import { ENGINES } from './engines/registry.js?v=af1c9ebd';
import { RESPOND } from './engines/shared.js?v=af1c9ebd';

const SCRIPT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const schoolOn = () => SCRIPT.test(String(CONFIG.inbox || ''));
const secs = (ms) => Math.round(ms / 1000);
const SECTIONS = [
  ['start', 'Getting started', 'spark'],
  ['find', 'Finding your way', 'layers'],
  ['make', 'Lessons, worksheets, quizzes and games', 'wand'],
  ['keep', 'My subjects, folders and backup', 'folder'],
  ['reading', 'Reading support', 'type'],
  ['tools', 'Class tools', 'clock'],
  ['class', 'The Classroom', 'users'],
  ['cal', 'Calendar and homework', 'cal'],
  ['safe', 'Safeguards on Make buttons', 'key'],
  ['one', 'One thing at a time', 'layers'],
  ['mode', 'Online or in class', 'board'],
  ['live', 'Live lessons', 'qr'],
  ['sym', 'Symphony', 'sound'],
  ['wonder', 'Wonder Window', 'globe'],
  ['privacy', 'Privacy and protection', 'lock']
];
const li = (items) => '<ul class="howm-list">' + items.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
const b = (s) => '<b>' + esc(s) + '</b>';

function body(id) {
  const L = LIMITS, on = schoolOn();
  if (id === 'start') return '<p class="howm-lede">From a topic to a lesson your class answers, in about a minute.</p>' + li([
    b('Sign in') + ' with your name and the PIN Rabinder gave you. On a new device, open your personal link once.',
    b('Today') + ' is your first page: type what you are teaching, pick the year, the subject and what to make (lesson slides, a worksheet, a quiz or a game), and press Make it.',
    b('Press Present.') + ' On Teams, Zoom or Meet, share that window (tick “share sound” for Sound Journey and Brain Break). In the classroom, put it on the board.',
    b('Pupils can join') + ' on their own tablets, phones or laptops with the Join button (see Live lessons).',
    b('Everything you make') + ' is filed by itself in My subjects, under its subject and year.',
    b('Fractions') + ' are always shown with the numerator over the denominator, the way the class writes them, on slides, worksheets, the board, pupils’ devices and in Symphony’s replies. PowerPoint and Word files show them as ³⁄₄.'
  ]);
  if (id === 'find') return '<p class="howm-lede">One calm page at a time, with the same menu everywhere.</p>' + li([
    b('On a laptop') + ' the menu is on the left: Today, Calendar, My subjects, Create, Classroom, Class tools and Explore, then Settings, Help and Start class.',
    b('On a phone') + ' the tabs are at the bottom: Today, Calendar, Subjects, Create and More.',
    b('Search') + ' at the top finds anything you made (lessons, worksheets, quizzes, games, activities) and any page. Press / to start typing.',
    b('Explore') + ' holds the Wonder Window, away from everyday teaching. ' + b('Help') + ' has short guides for the jobs you do most.',
    b('A new version:') + ' when the site has been updated, a small bar offers Reload. A tab left open keeps its old version until then.'
  ]);
  if (id === 'make') return '<p class="howm-lede">Create has a maker for each thing. Each one takes about a minute and files what it makes by itself.</p>' + li([
    b('Lesson slides') + ' (lkie.like): one topic in, a whole lesson out, for any KS2 subject: slides with a picture or an exact diagram on every slide, key words, activities, teacher notes and a worksheet in three levels. Five themes for younger classes (Space, Under the Sea, Jungle, Superhero and Rainbow). PowerPoint and Word.',
    b('Worksheet') + ': from a topic, from one of your lessons, or from a sample you upload (a photo, a PDF or a Word file). Symphony keeps the skills and the layout and writes new questions, checks that none were copied, and checks the answers. Support, Core and Challenge levels, and an answer sheet, in Word.',
    b('Quiz') + ': write it yourself, or let Symphony draft it from a topic or a lesson. Play it as a team board game on the big screen (with surprise tiles), practise it together on the board, or turn it into a worksheet.',
    b('Game') + ': describe a game in your own words. Symphony builds it from a template (balloon pop, match pairs, sort it, quiz race or memory) or as something new. Play it on the board. Games made from scratch run in a locked box that cannot see anything else on the site.',
    b('Lesson starters') + ': the ten ready-made activities (' + esc(ENGINES.map((e) => e.name).join(', ')) + '), each with a finished example to try first.',
    b('Change it by asking') + ': in the quiz and game makers and on lesson slides, tell Symphony what to change in plain words.'
  ]);
  if (id === 'keep') return '<p class="howm-lede">Everything you make, in one place.</p>' + li([
    b('My subjects') + ' has a folder for every KS2 subject. What you make goes under its subject and year by itself: “Volcanoes” is filed under Geography.',
    b('Your own folders') + ' inside a subject (a unit, a topic). Move anything to another folder, subject or year with Move.',
    b('Kept in this browser') + ': up to 60 lesson packs, 40 two-way slide lessons and 25 activities from each lesson starter, and your worksheets, quizzes and games.',
    b('Back up') + ' (Settings, Backup) saves everything you made into one file. ' + b('Restore') + ' on another device adds what is in the file to what is there; it never deletes anything. Keys, PINs and pupils’ names are never in the file.'
  ]);
  if (id === 'reading') return '<p class="howm-lede">For everyone, and for readers with dyslexia. It is in Settings, Reading support, and it is kept for you on this device.</p>' + li([
    b('Fonts:') + ' Lexend (the site’s font, made for easier reading), Atkinson Hyperlegible, Andika (letters as children learn to write them), Comic Neue and OpenDyslexic, or the old look.',
    b('Text size:') + ' Normal, Large or Extra large, for every page.',
    b('Spacing') + ' between letters, words and lines, and a ' + b('background') + ': soft grey, cream, pale blue or pale yellow.',
    b('Reading ruler:') + ' a band that follows the pointer and keeps your place. ' + b('Tap to hear:') + ' tap any words to hear them.',
    b('Slides too') + ' uses the same font on your slides. Pupils have their own Reading help on their device in a live class.'
  ]);
  if (id === 'class') return '<p class="howm-lede">Each class is a live session on pupils’ own devices. Start it in one tap: Start class on Today, in the calendar or in the menu.</p>' + li([
    b('Joining:') + ' a QR code, a short address and a 6-digit code. Pupils type a first name; no accounts. ' + b('Who’s here') + ' is your register (Copy register); it is never saved.',
    b('Lesson flow:') + ' tap a lesson and it opens on the board in Present mode; close Present to come back to your class. Every pupil’s device shows what is on the board: the slide’s words and its picture, with Read it to me. Answers you have not revealed stay hidden.',
    b('Lock devices:') + ' the class page stays full screen where the browser allows it, its links are blocked, and each device is asked to turn on Do Not Disturb. A pop-up tells you, on any screen, when a pupil leaves the page and when they come back (on the board it says “A pupil”, never the name). A website cannot see which app a pupil opened, stop other apps, or silence calls and messages: the device can (Do Not Disturb; Guided Access on iPads, App pinning on Android, kiosk mode on school Chromebooks).',
    b('Quick checks:') + ' thumbs, traffic light, a vote, a word cloud or mini whiteboards, answers face down until you Reveal.',
    b('Class view:') + ' a tile for every pupil: who is right, who is stuck, who has finished, hands up, and private questions you can answer privately. Mark or change marks, give praise or a sticker, put a pupil on a level. Show on the board puts one answer or question big on your screen and on every device, never with a name.',
    b('On their devices:') + ' a quiz played live with a podium, a worksheet with marks given back, a game with a leaderboard, the timer, work signs, groups and class points.',
    b('For pupils:') + ' Reading help (the same fonts, sizes and backgrounds), I need help, and Ask my teacher (only you see it).',
    b('Homework') + ' arrives on every device as a card with the pupil’s own name, with Add to my calendar.',
    b('End class') + ' (two taps) saves a summary with the lesson, with counts and no names. Symphony can suggest what to teach next; she never sees pupils’ names.'
  ]);
  if (id === 'cal') return '<p class="howm-lede">Your week, on this device. Set it up once; it repeats every week.</p>' + li([
    b('Set up:') + ' your school day, your lessons (subject, class, year, room), then terms and school holidays. Malaysian public holidays hide lessons on those days.',
    b('Plan a lesson:') + ' tap it for a topic, Make (the maker opens with everything filled in, and what you make is attached), Attach from My subjects, a note, and Taught.',
    b('Plan my week:') + ' Symphony suggests a topic for every lesson, from the curriculum and what each class did before. You check each one.',
    b('Homework:') + ' set it on a lesson, then Share with the class: a link and a QR code. Pupils or parents open it with no sign-in and tap Add to my calendar (a reminder at 6 pm the evening before).',
    b('Your phone:') + ' download your timetable as a calendar file, with a reminder before each class.'
  ]);
  if (id === 'tools') return '<p class="howm-lede">Timers, signs and helpers for the board, on the Class tools page and on top of your slides while you present (the Tools button).</p>' + li([
    b('Timer') + ' with loud end sounds (a school bell, a gong, a buzzer, a chime, a whistle or a fanfare) and Whole-hall loud: full volume, three rings. It keeps running when you change page, with a small pill to show it.',
    b('Pick a name') + ' fairly (nobody twice until everyone has had a turn), ' + b('Groups') + ', ' + b('Work signs') + ' (Silent work, Partner talk and more), ' + b('Class points') + ' for teams, a ' + b('Noise meter') + ', a ' + b('Traffic light') + ', ' + b('Dice') + ', a ' + b('Stopwatch') + ' and ' + b('Now and next') + '.',
    b('Full screen') + ' puts any tool big on the board.',
    'The noise meter only measures how loud the room is. Nothing is recorded or sent.'
  ]);
  if (id === 'safe') return '<p class="howm-lede">Each press of a Make button is paid for by the school, so every one of them follows the same rules.</p>' +
    '<div class="howm-rules">' +
    '<div><h4>' + icon('wand') + 'Every Make button</h4><p>The ten lesson starters (' + esc(ENGINES.map((e) => e.name).join(', ')) + '), Make my lesson pack, Make my worksheet, Draft my quiz, Make 5 more, Make my game, Make my slides, Adapt, Make slides from a unit plan, Plan the unit, and Symphony’s analysis on the dashboard.</p>' +
    li([b('Rests ' + L.restMin + ' minutes') + ' after it makes something. Each button rests on its own (Make my slides, Adapt and a unit plan’s Make slides share one).',
      b('At most ' + L.hour + ' an hour and ' + L.day + ' a day') + ', all Make buttons together, for each person on each device.',
      'A waiting button says when it is ready again, for example “Ready again in 4:12”.']) + '</div>' +
    '<div><h4>' + icon('pen') + 'Small edits</h4><p>Changing a slide, a quiz question or a game by asking, and rewriting a worksheet.</p>' + li([b('One every ' + secs(L.editGap) + ' seconds') + ', at most ' + L.editHour + ' an hour.']) + '</div>' +
    '<div><h4>' + icon('chat') + 'Symphony’s chat</h4>' + li([b('One question every ' + secs(L.chatGap) + ' seconds') + ', at most ' + L.chatTen + ' in 10 minutes and ' + L.chatDay + ' a day.']) + '</div></div>' +
    '<h4 class="howm-sub">How the buttons are protected</h4>' + li([
      b('Real presses only.') + ' Not a script, not a tap still travelling while a page opens, not a swipe that ends on a button. Enter inside a text box moves to the next box; it never presses Make.',
      b('Nothing wasted.') + ' If the engine cannot finish, or you press Stop in the first 15 seconds, the press is given back: no rest, and it is not counted.',
      b('One thing at a time') + ' (next section).',
      b('Rabinder sees it.') + ' Reaching a limit is noted on her dashboard' + (on ? '.' : ', from teachers’ own devices once the school relay is switched on (until then the note waits on the teacher’s device; nothing is lost).'),
      b('The last ceiling') + ' is the monthly spend limit on the school’s engine key.',
      'Presenting, saved lessons, class tools, the board game, the Wonder Window and live lessons never use the engine.'
    ]);
  if (id === 'one') return '<p class="howm-lede">One activity at a time for each teacher.</p>' + li([
    b('While something is being made for you,') + ' the other Make buttons wait (“Making something else…”).',
    b('While your live lesson or class is running,') + ' the Make buttons wait too (“Live lesson running”), and a second one cannot start. The Join button asks first; “End it there and start here” moves the lesson to this screen, and the other screen ends its own within half a minute.',
    b('Everywhere you are signed in:') + ' all your tabs on this device and, ' + (on ? 'because the school relay is on, ' : 'once the school relay is switched on, ') + 'your other devices too.',
    b('Still free:') + ' presenting, the Wonder Window, Symphony, and small edits to the lesson you are teaching.',
    b('The Live button at the top') + ' shows a live lesson that is still running, here or on another screen, so you can always end it.'
  ]) + '<p class="howm-note">' + icon('info') + '<span>Now: ' + (on ? 'the school relay is on, so this works across your devices.' : 'the school relay is not switched on yet, so this works across the tabs on each device.') + '</span></p>';
  if (id === 'mode') {
    const rows = [['chat', 'Answer'], ['vote', 'Vote'], ['show', 'Show me'], ['talk', 'Talk'], ['react', 'React'], ['waterfall', 'Chat waterfall'], ['move', 'Move']];
    return '<p class="howm-lede">The switch at the top (Online / In class) tells the site where your pupils are. You are teaching <b>' + (prefs.mode === 'class' ? 'in class' : 'online') + '</b> now.</p>' +
      '<h4 class="howm-sub">1. The “how pupils respond” pill on every slide</h4>' +
      '<div class="howm-tbl" role="table" aria-label="Pill words online and in class"><div role="row" class="hd"><span role="columnheader"></span><span role="columnheader">Online</span><span role="columnheader">In class</span></div>' +
      rows.map(([k, n]) => '<div role="row"><span role="rowheader">' + esc(n) + '</span><span role="cell">' + esc(RESPOND.online[k]) + '</span><span role="cell">' + esc(RESPOND.class[k]) + '</span></div>').join('') + '</div>' +
      '<h4 class="howm-sub">2. What the engine is told when it writes</h4>' + li([
        b('Online:') + ' a live video lesson; pupils are at home with paper, pencils and everyday household things, and answer in the chat, by unmuting, with reactions or by holding work up to the camera.',
        b('In class:') + ' a classroom with mini whiteboards, talk partners and normal classroom equipment.',
        'So the activities fit where the pupils are. Switch before you press Make; lessons you already made keep their activities, but their pills change words straight away.'
      ]) +
      '<h4 class="howm-sub">3. The class moments on the board</h4>' + li([
        b('Chat waterfall:') + ' everyone presses Enter at once (online), or shows their whiteboard at once (in class).',
        b('Show me:') + ' hold it up to the camera, or show your whiteboard.',
        b('Talk:') + ' unmute or go to breakout rooms, or turn and talk to your partner.',
        b('Class feedback:') + ' type 1 to 5 in the chat, or show 1 to 5 fingers.'
      ]) + '<p class="howm-note">' + icon('info') + '<span>Live lessons on pupils’ own devices work the same in both.</span></p>';
  }
  if (id === 'live') return '<p class="howm-lede">Pupils answer on their own tablets, phones or laptops while you present (Join), or in the Classroom.</p>' +
    '<h4 class="howm-sub">Joining</h4>' + li([
      'In Present mode press ' + b('Join') + ' (or the J key): a QR code, a short web address and a 6-digit code. Paste the link into the class chat for an online lesson.',
      'Pupils type a first name or nickname. No accounts, nothing to install.',
      b('Lock joining') + ' when everyone is in; tap a name to remove that pupil; ' + b('End live lesson') + ' ends it on every device.'
    ]) +
    '<h4 class="howm-sub">During the lesson</h4>' + li([
      b('Questions go by themselves.') + ' When a slide with a question is on the board (vote, type it, a mini whiteboard, talk, think, reactions), it appears on every device a moment later. Coming back to a slide brings back the same question and its answers. To send a question only when you tap its pill, switch this off in the Join screen.',
      b('Pupils follow the board:') + ' between questions their screen shows “On the board now” and the slide’s title.',
      b('Answers count up on the pill.') + ' Tap the pill for the big view, with a timer and the answers face down until you press Reveal.',
      'The Join button shows whether the latest slide reached pupils’ devices: a steady dot when it has, a quick pulse while sending, amber while trying again.'
    ]) +
    '<h4 class="howm-sub">Staying connected</h4>' + li([
      'Pupils’ screens stay awake during the lesson, where the device allows it.',
      'If a line drops (the Wi-Fi, a phone that slept) it reconnects by itself, straight away when the screen comes back on. A bar says “Reconnecting…”, with a Reconnect button.'
    ]) +
    '<h4 class="howm-sub">The relays that carry the messages</h4>' + li([
      b('The free public relay') + ' (ntfy.sh) works with no set-up. For each network (each internet address) it allows about 30 devices at once and about 250 messages a day. That suits online lessons, where pupils are at home. A whole class on one school Wi-Fi can reach those limits; the Join screen says so if it happens.',
      b('The school relay') + ' is the site’s own Google Apps Script. It has no such limits and also lets “one thing at a time” work across devices. It is switched on once, by whoever looks after this website. ' + (on ? b('It is on.') : b('It is not switched on yet.'))
    ]) +
    '<h4 class="howm-sub">Privacy</h4>' + li([
      'Everything is locked on the device before it leaves (end to end). The relays only ever see scrambled text and random ids.',
      'Pupils’ names and answers stay on your screen. Nothing is saved, and nothing goes to Rabinder’s reports.'
    ]);
  if (id === 'sym') return '<p class="howm-lede">Symphony is the site’s helper, at the bottom right of every page.</p>' + li([
    b('She knows the KS2 curriculum') + ' for every subject, how good primary lessons are taught, and which engine fits an idea. She answers with the site’s main engine.',
    b('She checks facts') + ' on trusted education websites around the world (BBC Bitesize and Newsround, NASA, National Geographic Kids, Britannica, museums, gov.uk and more), only about teaching and school subjects. The pages she used show under her answer as Sources.',
    b('Her voice:') + ' with the school’s voice key (added once in Connect) she speaks with a natural human voice; otherwise with the best voice this device has. Choose her voice and pace with the voice button in her panel. Her human voice is AI-generated, and pupils’ names are always spoken by the device’s own voice.',
    b('Ask by voice or by typing.') + ' She can read her answers aloud, in English or Malay (the Symphony’s voice switch).',
    b('Hey Symphony') + ' (a switch): she listens only for her name and ignores everything else. Patient listening waits until you have finished speaking.',
    b('She does things straight away:') + ' “open the calendar”, “what is next?”, “what is on today?”, “start class”, “make a quiz about fractions”, “start a timer for 2 minutes”, “pick someone”, “next slide”, “show me Tokyo”.',
    b('She knows the screen') + ' (the slide the class can see, the window that is open) and your pupils’ first names in Our class.',
    b('Limits:') + ' one question every ' + secs(LIMITS.chatGap) + ' seconds, at most ' + LIMITS.chatTen + ' in 10 minutes and ' + LIMITS.chatDay + ' a day.'
  ]);
  if (id === 'wonder') return '<p class="howm-lede">Seventeen full-screen windows on the world, with sound: planets, northern lights, the rainforest, the World Explorer, festivals, the Seven Wonders, Wonders of Malaysia, animal record breakers, extreme weather, the seasons and more.</p>' + li([
    'Open it from Explore in the menu, or ask Symphony (“open the festivals”).',
    'Most windows have a quiz that can be a class vote, on pupils’ devices in a live lesson.',
    'Tap or click things to find out more; the sound button turns the sound on and off. The places sound real (rain, waves, birds, crickets, the rainforest’s cicadas), from field recordings.',
    'On phones that can vibrate, taps, thunder, splashes and roars are felt too (Settings → Feel taps turns it off).',
    'Symphony’s caption at the bottom changes every 18 seconds: a fact, then a question for the class. Press the speaker and each word lights up as she reads it.',
    'Everything is drawn by the site itself, never an emoji: the animals, the 12 Wonders of Malaysia scenes, the pictures under each scene and the flags, so they look the same on every device.',
    'It never uses the engine, so it has no limits.'
  ]);
  if (id === 'privacy') return '<p class="howm-lede">What stays in this browser, and what leaves it.</p>' + li([
    b('Stays here:') + ' the engine key, everything you make, your folders, your reading support and your class’s first names.',
    b('Leaves, and why:') + ' the request the engine needs when you press a Make button (a worksheet sample goes with it to be read, and is not kept); your activity for Rabinder’s reports, locked so only she can open it; live-lesson messages, locked end to end; and picture searches, which go to Wikipedia. Videos play from YouTube’s privacy-enhanced player.',
    b('Backup files') + ' hold what you made and your settings, never keys, PINs or pupils’ names.',
    b('In a live class') + ' pupils’ devices receive only what is on the board: its words and free Wikimedia pictures, never your uploaded pictures or answers you have not revealed. A locked device sends one message when a pupil leaves the class page and one when they come back. The class summary keeps only how many times pupils left, never names.',
    b('Speaking to Symphony') + ' uses your browser’s own speech service. Her answers come from the engine, which may search trusted education websites for her. With her human voice on, what she says aloud goes to a voice service (OpenAI) to be spoken; pupils’ names never do.',
    b('Protection:') + ' copying the site’s content and printing are blocked; lessons leave through the site’s own buttons (PowerPoint, Word and Copy). These are deterrents, and screen sharing always keeps working.'
  ]);
  return '';
}

let el = null, keyH = null, back = null, spy = null, jumping = 0;
export function openHow(section) {
  if (el) { go(section); return; }
  back = document.activeElement;
  el = document.createElement('div');
  el.className = 'modal howm';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'howm-h');
  el.innerHTML = '<div class="howm-card"><header class="howm-top"><div><p class="kicker" style="--c:var(--accent)">Every rule, in one place</p><h2 id="howm-h">How it works</h2></div>' +
    '<button type="button" class="btn icon howm-x" data-howm="x" aria-label="Close">' + icon('close') + '</button></header>' +
    '<div class="howm-in"><nav class="howm-nav" aria-label="Sections">' + SECTIONS.map(([id, name, ic]) => '<button type="button" data-howm-go="' + id + '">' + icon(ic) + '<span>' + esc(name) + '</span></button>').join('') + '</nav>' +
    '<div class="howm-main" tabindex="-1">' + SECTIONS.map(([id, name, ic]) => '<section class="howm-sec" id="howm-' + id + '" aria-labelledby="howm-' + id + '-h"><h3 id="howm-' + id + '-h"><i>' + icon(ic) + '</i>' + esc(name) + '</h3>' + body(id) + '</section>').join('') + '</div></div></div>';
  (document.fullscreenElement || document.body).appendChild(el);          // inside Present mode's full screen too
  document.documentElement.classList.add('howm-open');
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-howm="x"]')) { closeHow(); return; }
    const g = e.target.closest('[data-howm-go]');
    if (g) go(g.dataset.howmGo);
  });
  // On the window, so Escape closes this before anything underneath (a Join screen, a moment) sees it.
  keyH = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeHow(); } };
  window.addEventListener('keydown', keyH, true);
  // the section at the top of the reading pane is the one lit in the list (not while jumping to one)
  const main = $('.howm-main', el);
  spy = () => {
    if (!el || Date.now() < jumping) return;
    const top = main.getBoundingClientRect().top + 90;
    let cur = SECTIONS[0][0];
    $$('.howm-sec', el).forEach((x) => { if (x.getBoundingClientRect().top <= top) cur = x.id.slice(5); });
    mark(cur);
  };
  main.addEventListener('scroll', () => requestAnimationFrame(() => { if (spy) spy(); }), { passive: true });
  mark(section || 'start');
  if (section) requestAnimationFrame(() => go(section, true));
  setTimeout(() => { const x = el && $('[data-howm="x"]', el); if (x) x.focus(); }, 40);
}
function mark(id) {
  if (!el) return;
  $$('[data-howm-go]', el).forEach((b2) => {
    const on = b2.dataset.howmGo === id;
    if (on === (b2.getAttribute('aria-current') === 'true')) return;
    if (on) {
      b2.setAttribute('aria-current', 'true');
      const nav = b2.parentElement;                       // on a phone the list is one row: keep this one in view
      if (nav.scrollWidth > nav.clientWidth + 4) nav.scrollTo({ left: b2.offsetLeft - (nav.clientWidth - b2.offsetWidth) / 2, behavior: 'smooth' });
    } else b2.removeAttribute('aria-current');
  });
}
function go(id, instant) {
  const s = el && $('#howm-' + id, el);
  if (!s) return;
  const main = $('.howm-main', el);
  jumping = Date.now() + (instant ? 150 : 900);
  main.scrollTo({ top: s.offsetTop - main.offsetTop - 6, behavior: instant ? 'auto' : 'smooth' });
  mark(id);
}
export function closeHow() {
  if (!el) return;
  spy = null;
  window.removeEventListener('keydown', keyH, true);
  el.remove(); el = null;
  document.documentElement.classList.remove('howm-open');
  if (back && back.focus) { try { back.focus(); } catch (e) { /* fine */ } }
}
/* Every "How it works" link and button on the site opens it: links to #how, and anything with data-how="section". */
export function initHow() {
  // a "?" next to every Online / In class switch
  $$('.seg[aria-label="Where you are teaching"]').forEach((seg) => {
    if (seg.nextElementSibling && seg.nextElementSibling.classList.contains('seg-q')) return;
    seg.insertAdjacentHTML('afterend', '<button type="button" class="seg-q" data-how="mode" aria-label="What changes between online and in class?" title="What changes between online and in class?">?</button>');
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href="#how"], [data-how]');
    if (!a) return;
    e.preventDefault();
    openHow(a.dataset.how || '');
  }, true);
  bus.on('mode', () => { if (el) { const s = $('#howm-mode', el); if (s) s.innerHTML = s.querySelector('h3').outerHTML + body('mode'); } });
}
