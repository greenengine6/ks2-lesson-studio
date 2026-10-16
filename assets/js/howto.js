/* How it works: every rule on the site in one place, in plain words. It opens from the header's "How it works",
   the home page's How it works section, the "?" next to Online / In class, and the Join screen. The numbers come
   from the same settings the rules themselves use (guard.js), so they are always right. */
import { $, $$, esc, icon, bus, prefs, CONFIG } from './core.js?v=f99d8766';
import { LIMITS } from './guard.js?v=f99d8766';
import { ENGINES } from './engines/registry.js?v=f99d8766';
import { RESPOND } from './engines/shared.js?v=f99d8766';

const SCRIPT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const schoolOn = () => SCRIPT.test(String(CONFIG.inbox || ''));
const secs = (ms) => Math.round(ms / 1000);
const SECTIONS = [
  ['start', 'Getting started', 'spark'],
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
  if (id === 'start') return '<p class="howm-lede">Three steps from a topic to a lesson your class answers.</p>' + li([
    b('Sign in') + ' with your name and the PIN Rabinder gave you. On a new device, open your personal link once.',
    b('Fractions') + ' are always shown with the numerator over the denominator, the way the class writes them, on slides, worksheets, the board, pupils’ devices and in Symphony’s replies. PowerPoint and Word files show them as ³⁄₄.',
    b('Pick') + ' one of the ten engines, Slide Studio or lkie.like. Fill in two or three boxes and press the Make button. It takes about a minute.',
    b('Press Present.') + ' On Teams, Zoom or Meet, share that window (tick “share sound” for Sound Journey and Brain Break).',
    b('Pupils can join') + ' on their own tablets, phones or laptops with the Join button (see Live lessons).',
    b('Your lessons') + ' are kept in this browser, under Your lessons on the home page.'
  ]);
  if (id === 'safe') return '<p class="howm-lede">Each press of a Make button is paid for by the school, so every one of them follows the same rules.</p>' +
    '<div class="howm-rules">' +
    '<div><h4>' + icon('wand') + 'Every Make button</h4><p>The ten engines (' + esc(ENGINES.map((e) => e.name).join(', ')) + '), Make my slides, Adapt, Make slides from a unit plan, Plan the unit, Make my lesson pack, and Symphony’s analysis on the dashboard.</p>' +
    li([b('Rests ' + L.restMin + ' minutes') + ' after it makes something. Each button rests on its own (Make my slides, Adapt and a unit plan’s Make slides share one).',
      b('At most ' + L.hour + ' an hour and ' + L.day + ' a day') + ', all Make buttons together, for each person on each device.',
      'A waiting button says when it is ready again, for example “Ready again in 4:12”.']) + '</div>' +
    '<div><h4>' + icon('pen') + 'Small edits</h4><p>lkie.like’s slide editor and rewriting a worksheet.</p>' + li([b('One every ' + secs(L.editGap) + ' seconds') + ', at most ' + L.editHour + ' an hour.']) + '</div>' +
    '<div><h4>' + icon('chat') + 'Symphony’s chat</h4>' + li([b('One question every ' + secs(L.chatGap) + ' seconds') + ', at most ' + L.chatTen + ' in 10 minutes and ' + L.chatDay + ' a day.']) + '</div></div>' +
    '<h4 class="howm-sub">How the buttons are protected</h4>' + li([
      b('Real presses only.') + ' Not a script, not a tap still travelling while a page opens, not a swipe that ends on a button. Enter inside a text box moves to the next box; it never presses Make.',
      b('Nothing wasted.') + ' If the engine cannot finish, or you press Stop in the first 15 seconds, the press is given back: no rest, and it is not counted.',
      b('One thing at a time') + ' (next section).',
      b('Rabinder sees it.') + ' Reaching a limit is noted on her dashboard' + (on ? '.' : ', from teachers’ own devices once the school relay is switched on (until then the note waits on the teacher’s device; nothing is lost).'),
      b('The last ceiling') + ' is the monthly spend limit on the school’s engine key.',
      'Presenting, saved lessons, the Wonder Window and live lessons never use the engine.'
    ]);
  if (id === 'one') return '<p class="howm-lede">One activity at a time for each teacher.</p>' + li([
    b('While something is being made for you,') + ' the other Make buttons wait (“Making something else…”).',
    b('While your live lesson is running,') + ' the Make buttons wait too (“Live lesson running”), and a second live lesson cannot start. The Join button asks first; “End it there and start here” moves the lesson to this screen, and the other screen ends its own within half a minute.',
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
  if (id === 'live') return '<p class="howm-lede">Pupils answer on their own tablets, phones or laptops while you present.</p>' +
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
    b('Ask by voice or by typing.') + ' She can read her answers aloud, in English or Malay (the Symphony’s voice switch).',
    b('Hey Symphony') + ' (a switch): she listens only for her name and ignores everything else. Patient listening waits until you have finished speaking.',
    b('She knows the screen:') + ' “show me Tokyo”, “open the rainforest”, “go to Slide Studio”, and your pupils’ names in Our class.',
    b('Limits:') + ' one question every ' + secs(LIMITS.chatGap) + ' seconds, at most ' + LIMITS.chatTen + ' in 10 minutes and ' + LIMITS.chatDay + ' a day.'
  ]);
  if (id === 'wonder') return '<p class="howm-lede">Seventeen full-screen windows on the world, with sound: planets, northern lights, the rainforest, the World Explorer, festivals, the Seven Wonders, Wonders of Malaysia, animal record breakers, extreme weather, the seasons and more.</p>' + li([
    'Open it from the link at the bottom of the home page, or ask Symphony (“open the festivals”).',
    'Most windows have a quiz that can be a class vote, on pupils’ devices in a live lesson.',
    'Tap or click things to find out more; the sound button turns the sound on and off.',
    'Every animal, bird, fish and racer is drawn by the site itself, not an emoji, so the scenes look the same on every device.',
    'It never uses the engine, so it has no limits.'
  ]);
  if (id === 'privacy') return '<p class="howm-lede">What stays in this browser, and what leaves it.</p>' + li([
    b('Stays here:') + ' the engine key and your saved lessons.',
    b('Leaves, and why:') + ' the request the engine needs when you press a Make button; your activity for Rabinder’s reports, locked so only she can open it; live-lesson messages, locked end to end; and picture searches, which go to Wikipedia. Videos play from YouTube’s privacy-enhanced player.',
    b('Speaking to Symphony') + ' uses your browser’s own speech service.',
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
