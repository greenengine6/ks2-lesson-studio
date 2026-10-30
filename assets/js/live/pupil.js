/* The pupils' page (join/): join a live lesson (a class) from the QR code, the link in the chat, or the 6-digit code,
   then answer on your own device when the teacher asks: reactions, votes, typed answers, a mini whiteboard, a word
   for the word cloud, a traffic light, talk and think time, a live quiz, a worksheet, a game, and how the lesson felt.
   No sign-in and no account: a first name or nickname only, kept in this tab. Everything is locked so only the
   teacher's screen can read it (see relay.js), and what the teacher sends to one pupil (praise, a sticker, "On my
   way", a reply) can only be opened on that pupil's device.
   Always there at the bottom: Reading help (font, size, spacing, background: kept on this device), "I need help"
   (a raised hand the teacher sees) and "Ask my teacher" (a short private question). The class tools the teacher uses
   show here too: her timer, a work sign, your group, the team points, and homework with Add to my calendar.
   While the lesson runs, the page follows the board ("On the board now: …"), a new question arrives by itself
   with a buzz, a soft chime and a little bounce, and the screen is kept awake (where the browser allows it) so the
   line to the teacher's screen does not drop. If it does drop, a bar says so and the page reconnects by itself,
   at once when the screen comes back on; "Reconnect" tries straight away. */
import * as R from './relay.js?v=cdc164df';
import { Ink, COLOURS, packStrokes } from '../draw.js?v=cdc164df';
import { initFractions } from '../fractions.js?v=cdc164df';
import { SHAPES, shapeSVG, STICKERS, REACTIONS, reactSVG, FACE_NAMES, faceSVG } from './shapes.js?v=cdc164df';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  moon: '<path d="M19.5 14.6A7.9 7.9 0 0 1 9.4 4.5a7.9 7.9 0 1 0 10.1 10.1z"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 7"/>', send: '<path d="M4.5 11.8 20 4.5l-4.6 15.2-3.7-6.4z"/><path d="M11.7 13.3 20 4.5"/>', undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', eraser: '<path d="M8.5 20H20"/><path d="M5.2 15.2 14.4 6a2 2 0 0 1 2.8 0l2.8 2.8a2 2 0 0 1 0 2.8L12 19.6H8.6z"/><path d="M9.6 10.8l4.6 4.6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  talk: '<path d="M4.8 4h8.4a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H8.6l-3.2 3v-3h-.6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M15.2 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-.6v2.8l-3-2.8h-4a2 2 0 0 1-2-2v-2.8"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', star: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  ear: '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.5 3.6-2.5 6a2.5 2.5 0 0 1-5 0"/><path d="M10 9.5a2 2 0 0 1 4 0"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13M8 13V9.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3a1.5 1.5 0 0 0-3 0"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', type: '<path d="M4 19 9 5h1l5 14M6 14h7"/><path d="M15.5 19l2.8-7.5h.4L21.5 19M16.4 16.6h4.2"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>', users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 14.4a4.5 4.5 0 0 1 5.5 4.4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>', link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  book: '<path d="M3 6.4C6 4.9 9 4.9 12 6.9c3-2 6-2 9-.5v12.5c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6.9v12.5"/>', pen: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.5 7.2l3 3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>', heart: '<path d="M12 19.4C6.2 15.6 3.6 12.4 3.6 9c0-2.4 1.8-4.2 4.1-4.2 1.7 0 3 1 4.3 2.7 1.3-1.7 2.6-2.7 4.3-2.7 2.3 0 4.1 1.8 4.1 4.2 0 3.4-2.6 6.6-8.4 10.4z"/>'
};
const icon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || '') + '</svg>';
const app = $('#app');
const P = {
  info: null, screen: '', st: null, v: 0, pid: '', name: '', pair: null, myPub: '', key: null, allKey: null, relay: null, stop: null, status: 'off', joinT: 0, joinTries: 0,
  sent: new Map(), moAt: 0, tkAt: 0, ink: null, inkFor: '', tick: 0, cfg: null, offAt: 0, netT: 0, queued: false, lastMo: '', lastTk: '', sig: '',
  blobs: new Map(), hand: false, coming: false, asks: [], quiz: new Map(), sheet: null, game: null, hwSeen: '', timerDone: '', read: null, locked: false
};
const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: this visit only */ } }
};
const meKey = () => 'ks2-live.me.' + P.info.sid;
const sheetKey = () => 'ks2-live.sheet.' + P.info.sid;

/* ---------------- the relays' addresses live in the main page's settings ---------------- */
async function siteConfig() {
  if (P.cfg) return P.cfg;
  let c = {};
  try {
    const t = await (await fetch('../', { cache: 'no-cache', credentials: 'omit' })).text();
    const m = /<script type="application\/json" id="config">([\s\S]*?)<\/script>/.exec(t);
    c = m ? JSON.parse(m[1]) : {};
  } catch (e) { c = {}; }
  P.cfg = { script: R.SCRIPT.test(String(c.inbox || '')) ? String(c.inbox) : '', base: R.relayBase(c.liveRelay) };
  return P.cfg;
}
async function relayFor(tr) {
  const c = await siteConfig();
  if (tr === 's' && c.script) return R.schoolRelay(c.script);
  return R.publicRelay(c.base);
}

/* ---------------- Reading help (kept on this device) ---------------- */
const READ_KEY = 'ks2-live.read.v1';
const FONTS = [['lexend', 'Lexend', '"Lexend","Segoe UI",system-ui,sans-serif', ''], ['atkinson', 'Atkinson Hyperlegible', '"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif', 'Atkinson+Hyperlegible:wght@400;700'],
  ['andika', 'Andika', '"Andika","Segoe UI",system-ui,sans-serif', 'Andika:wght@400;700'], ['comic', 'Comic Neue', '"Comic Neue","Comic Sans MS",system-ui,sans-serif', 'Comic+Neue:wght@400;700'],
  ['dyslexic', 'OpenDyslexic', '"OpenDyslexic","Segoe UI",system-ui,sans-serif', '']];
const SIZES = [['n', 'Normal', 1], ['l', 'Large', 1.15], ['xl', 'Extra large', 1.32]];
const SPACES = [['n', 'Normal'], ['w', 'Wide']];
const BGS = [['soft', 'Soft grey'], ['cream', 'Cream'], ['blue', 'Blue'], ['yellow', 'Yellow'], ['white', 'White']];
function readPrefs() {
  const d = { f: 'lexend', s: 'n', sp: 'n', bg: 'soft' };
  let v = {};
  try { v = JSON.parse(localStorage.getItem(READ_KEY) || '{}') || {}; } catch (e) { v = {}; }
  return {
    f: FONTS.some((x) => x[0] === v.f) ? v.f : d.f, s: SIZES.some((x) => x[0] === v.s) ? v.s : d.s,
    sp: SPACES.some((x) => x[0] === v.sp) ? v.sp : d.sp, bg: BGS.some((x) => x[0] === v.bg) ? v.bg : d.bg
  };
}
const fontLinks = new Set();
function applyRead() {
  const r = P.read, f = FONTS.find((x) => x[0] === r.f) || FONTS[0], s = SIZES.find((x) => x[0] === r.s) || SIZES[0];
  if (f[3] && !fontLinks.has(f[0])) {
    fontLinks.add(f[0]);
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f[3] + '&display=swap';
    document.head.appendChild(l);
  }
  const root = document.documentElement;
  root.style.setProperty('--rf', f[2]);
  root.style.setProperty('--t', String(s[2]));
  root.dataset.sp = r.sp; root.dataset.bg = r.bg; root.dataset.font = r.f;
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', { soft: '#E0E5EC', cream: '#FBF2DC', blue: '#DCEBFA', yellow: '#FFF6C2', white: '#FFFFFF' }[r.bg] || '#E0E5EC');
}
function saveRead() { try { localStorage.setItem(READ_KEY, JSON.stringify(P.read)); } catch (e) { /* this visit only */ } applyRead(); }

/* ---------------- staying connected ---------------- */
/* Keep the screen awake during the lesson, so the line to the teacher's screen does not drop. */
let wl = null;
async function awake() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || wl) return;
  if (!['joining', 'in', 'locked'].includes(P.screen)) return;
  try { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } catch (e) { /* not allowed here: fine */ }
}
function asleep() { if (wl) { wl.release().catch(() => {}); wl = null; } }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') { flushSheet(); return; }
  awake();
  if (P.screen === 'joining' && P.relay) { P.joinTries = Math.min(P.joinTries, 6); sayHello(); }
  if (P.baseTitle) document.title = P.baseTitle;          // anything that arrived meanwhile is drawn on the next frame
});
/* The bar under the header when the line is down for more than a few seconds. */
function onNet(s) {
  P.status = s;
  const d = $('.jn-dot');
  if (d) { d.className = 'jn-dot ' + (s === 'on' ? 'on' : 'off'); d.title = s === 'on' ? 'Connected' : 'Reconnecting'; }
  clearTimeout(P.netT);
  if (s === 'on') P.offAt = 0; else if (!P.offAt) P.offAt = Date.now();
  paintNet();
  if (s !== 'on') P.netT = setTimeout(paintNet, 6500);
}
function paintNet() {
  const b = $('.jn-net');
  if (!b) return;
  const s = P.status, long = P.offAt && Date.now() - P.offAt > 6000;
  const t = !P.stop ? '' : s === 'subs' ? 'Too many devices on this Wi-Fi for the free relay. Tell your teacher.'
    : s === 'busy' ? 'Lots of people at once. Waiting a moment, then trying again…'
      : s !== 'on' && long ? 'Reconnecting… check that the Wi-Fi or internet is on.' : '';
  b.hidden = !t;
  $('span', b).textContent = t;
}
/* A new question: a buzz, a soft chime and a bounce, and the tab's title says so if the page is behind another. */
let ac = null;
function soundReady() {
  try { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } if (ac && ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; }
}
function notes(list, vol) {
  if (!ac || P.mute) return;
  try {
    const t = ac.currentTime;
    list.forEach(([f, d, len]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(vol || 0.09, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + (len || 0.42));
      o.connect(g); g.connect(ac.destination); o.start(t + d); o.stop(t + d + (len || 0.42) + 0.05);
    });
  } catch (e) { /* no sound: fine */ }
}
const chime = () => notes([[784, 0], [1047, 0.13]]);
const ding = () => notes([[880, 0, 0.3], [1175, 0.1, 0.35], [1568, 0.2, 0.5]], 0.1);
const soft = () => notes([[392, 0, 0.3], [330, 0.14, 0.4]], 0.07);
const fanfare = () => notes([[523, 0, 0.25], [659, 0.12, 0.25], [784, 0.24, 0.25], [1047, 0.38, 0.6]], 0.1);
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p || [90, 60, 90]); } catch (e) { /* fine */ } }
function cue() {
  buzz();
  chime();
  const c = $('.jn-mo');
  if (c) { c.classList.remove('new'); void c.offsetWidth; c.classList.add('new'); }
  if (document.visibilityState === 'hidden') { P.baseTitle = P.baseTitle || document.title; document.title = '● New question · ' + P.baseTitle; }
}
/* Read it to me: this device's own voice (nothing leaves the device). */
function speak(text) {
  try {
    const s = window.speechSynthesis;
    if (!s) return false;
    s.cancel();
    const u = new SpeechSynthesisUtterance(String(text || '').replace(/(\d+)\/(\d+)/g, '$1 over $2').slice(0, 600));
    const v = s.getVoices().find((x) => /en-GB/i.test(x.lang)) || s.getVoices().find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-GB'; u.rate = 0.92;
    s.speak(u);
    return true;
  } catch (e) { return false; }
}
function hush() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* fine */ } }

/* ---------------- screens ---------------- */
function frame(inner, o) {
  o = o || {};
  const title = (P.st && P.st.title) || o.title || 'Live lesson';
  app.innerHTML = '<header class="jn-top"><div class="jn-brand"><span class="jn-logo" aria-hidden="true">' + icon('heart') + '</span><span><b>' + esc(title) + '</b><small>KS2 Lesson Engine · live lesson</small></span></div>' +
    '<span class="jn-top-r"><button type="button" class="jn-read-b" data-j="read" aria-label="Reading help">' + icon('type') + '<span>Reading help</span></button>' +
    (P.name && o.me !== false ? '<span class="jn-me"><i class="jn-dot ' + (P.status === 'on' ? 'on' : 'off') + '" title="' + (P.status === 'on' ? 'Connected' : 'Reconnecting') + '"></i><span>' + esc(P.name) + '</span></span>' : '') + '</span></header>' +
    '<div class="jn-net" role="status" hidden><span></span><button type="button" class="jn-link" data-j="reconnect">Reconnect</button></div>' +
    '<main class="jn-main">' + inner + '</main>' + (P.name && o.leave !== false ? '<footer class="jn-foot"><button type="button" class="jn-link" data-j="sound" aria-pressed="' + (!P.mute) + '">' + (P.mute ? 'Sound: off' : 'Sound: on') + '</button><span aria-hidden="true">·</span><button type="button" class="jn-link" data-j="leave">Leave the lesson</button></footer>' : '');
  paintNet();
  paintDock();
}
function codeScreen(msg, err) {
  P.screen = 'code';
  frame('<section class="jn-card"><h1>Join the lesson</h1><p>Type the code from the board.</p><form id="jn-code" class="jn-form" novalidate><label class="jn-fld"><span>Code</span><input id="jn-c" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="123 456" aria-describedby="jn-msg"></label>' +
    '<button class="jn-btn" type="submit">' + icon('send') + 'Find my lesson</button><p id="jn-msg" class="jn-msg' + (err ? ' err' : '') + '" role="status">' + esc(msg || '') + '</p></form></section>', { me: false, leave: false });
  const i = $('#jn-c'); setTimeout(() => i.focus(), 50);
  i.addEventListener('input', () => { const d = i.value.replace(/\D/g, '').slice(0, 6); i.value = d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d; });
  $('#jn-code').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = i.value.replace(/\D/g, '');
    if (code.length !== 6) { say('The code has 6 numbers.', true); return; }
    say('Finding your lesson…'); $('#jn-code button').disabled = true;
    const found = await findByCode(code);
    $('#jn-code button').disabled = false;
    if (!found) { say('No lesson has that code right now. Check the code on the board, or ask your teacher.', true); return; }
    P.info = found;
    try { history.replaceState(null, '', '#' + R.joinHash(found)); } catch (er) { /* fine */ }
    nameScreen();
  });
}
function say(t, err) { const m = $('#jn-msg'); if (m) { m.textContent = t; m.classList.toggle('err', !!err); } }
async function findByCode(code) {
  const ch = await R.codeChannel(code), key = await R.codeKey(code), c = await siteConfig();
  const relays = [];
  if (c.script) relays.push(R.schoolRelay(c.script));
  relays.push(R.publicRelay(c.base));
  let best = null;
  for (const relay of relays) {
    let msgs = [];
    try { msgs = await relay.all(ch); } catch (e) { continue; }
    for (const env of msgs) {
      const o = await R.openAll(key, env);
      if (!o || !R.ID.test(String(o.sid)) || Date.now() - (o.at || 0) > 4 * 3600e3) continue;
      if (!best || o.at > best.at) best = { tr: o.tr === 's' ? 's' : 'p', sid: o.sid, k: o.k, pub: o.pub, at: o.at };
    }
    if (best) break;
  }
  return best && R.parseJoin('#' + R.joinHash(best)) ? best : null;
}
function nameScreen(msg) {
  P.screen = 'name';
  frame('<section class="jn-card"><h1>Hello! What is your first name?</h1><p>Your teacher sees it next to your answers. A nickname is fine too.</p><form id="jn-name" class="jn-form" novalidate>' +
    '<label class="jn-fld"><span>First name</span><input id="jn-n" autocomplete="given-name" maxlength="20" enterkeyhint="go" placeholder="For example: Aisyah" aria-describedby="jn-msg"></label>' +
    '<button class="jn-btn" type="submit">' + icon('check') + 'Join the lesson</button><p id="jn-msg" class="jn-msg' + (msg ? ' err' : '') + '" role="status">' + esc(msg || '') + '</p></form><p class="jn-fine">Only your teacher’s screen can read what you send. Nothing is kept after the lesson.</p></section>', { me: false, leave: false });
  const i = $('#jn-n'); setTimeout(() => i.focus(), 50);
  $('#jn-name').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = R.cleanName(i.value);
    if (!n) { say(i.value.trim() ? 'Please use your real first name or a kind nickname.' : 'Type your first name first.', true); return; }
    soundReady();
    join(n);
  });
}
function screen(name, title, text, extra) {
  P.screen = name;
  frame('<section class="jn-card jn-center"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>' + (extra || '') + '</section>', { leave: name === 'joining' || name === 'locked' });
}

/* ---------------- joining ---------------- */
async function identity() {
  const saved = store.get(meKey());
  if (saved && saved.pid && saved.pair) {
    try { P.pair = await R.loadPair(saved.pair); P.pid = saved.pid; P.name = saved.name || P.name; } catch (e) { P.pair = null; }
  }
  if (!P.pair) { P.pair = await R.newPair(); P.pid = R.rid(6); }
  P.myPub = await R.pubOf(P.pair);
  store.set(meKey(), { pid: P.pid, name: P.name, pair: await R.keepPair(P.pair) });
}
async function join(name) {
  P.name = name;
  screen('joining', 'Joining…', 'Look at the board. You will be in in a moment.');
  try {
    await identity();
    P.key = await R.sharedKey(P.pair.privateKey, P.info.pub, P.info.sid);
    P.allKey = await R.lessonKey(R.unb64u(P.info.k));
    P.relay = await relayFor(P.info.tr);
  } catch (e) { screen('bad', 'This link does not work', 'Ask your teacher to show the code again.'); return; }
  loadSheet();
  if (P.stop) P.stop();
  P.stop = P.relay.listen(R.channel(P.info.sid, 't'), onState, onNet);
  P.joinTries = 0;
  awake();
  sayHello();
}
async function sayHello() {
  clearTimeout(P.joinT);
  if (P.screen !== 'joining' && P.screen !== 'locked') return;
  P.joinTries += 1;
  try { await send({ t: 'join', n: P.name }); } catch (e) {
    if (e && e.code === 'full') { stopAll(); screen('bad', 'The lesson’s relay is full for today', 'Too many messages went through the free relay on this network today. Tell your teacher.'); return; }
  }
  if (P.joinTries < 8) P.joinT = setTimeout(sayHello, 5000 + P.joinTries * 1500);
  else if (P.screen === 'joining') screen('joining', 'Still joining…', 'Your teacher’s screen has not answered yet. Check the internet, or ask your teacher to open the join screen.', '<button type="button" class="jn-btn" data-j="retry">Try again</button>');
}
async function send(obj) {
  obj.p = P.pid;
  await R.post(P.relay, R.channel(P.info.sid, 'p'), await R.sealUp(P.key, P.myPub, obj));
}
function stopAll() {
  clearTimeout(P.joinT); clearTimeout(P.netT); clearInterval(P.tick); clearTimeout(P.sheetT);
  if (P.stop) { P.stop(); P.stop = null; }
  stopGame(); hush(); asleep();
  const d = $('#jn-dock'); if (d) d.hidden = true;
  showEyes(false);
}

/* ---------------- what the teacher's screen says ---------------- */
const glue = R.joiner();
const ID6 = /^[A-Za-z0-9_-]{4,12}$/;
async function onState(text) {
  const env = glue(text);
  if (!env) return;
  if (env.startsWith('P1.')) { if (R.toPid(env) === P.pid && P.key) { const m = await R.openTo(P.key, env); if (m && m.t === 'pm') onPM(m); } return; }
  const st = await R.openAll(P.allKey, env);
  if (!st) return;
  if (st.t === 'blob') { takeBlob(st); return; }
  if (st.t !== 'st' || typeof st.v !== 'number') return;
  if (st.end) {
    flushSheet();
    stopAll(); store.set(meKey(), null); store.set(sheetKey(), null);
    P.st = Object.assign({}, P.st || {}, { title: st.title || (P.st && P.st.title), mo: null, tk: null });
    screen('ended', 'The lesson has ended', 'Well done today! You can close this page.' + (P.st && P.st.hw ? '' : ''));
    return;
  }
  if (st.v <= P.v) return;
  P.v = st.v; P.st = clean(st);
  // Many messages can arrive at once (catching up after the screen was off): only the newest is drawn, on the
  // next frame (and not at all while the page is hidden).
  if (!P.queued) { P.queued = true; requestAnimationFrame(apply); }
}
/* Big things (a worksheet, a game) arrive once, with an id. */
function takeBlob(b) {
  if (!ID6.test(String(b.id || '')) || !['sheet', 'game'].includes(b.kind) || !b.data || typeof b.data !== 'object') return;
  P.blobs.set(b.id, { kind: b.kind, data: b.data });
  if (P.blobs.size > 6) P.blobs.delete(P.blobs.keys().next().value);
  if (P.st && P.st.tk && P.st.tk.blob === b.id) { P.sig = ''; if (!P.queued) { P.queued = true; requestAnimationFrame(apply); } }
}
const str = (x, n) => (typeof x === 'string' ? x.slice(0, n) : '');
const int = (x, a, b, d) => { const n = Math.round(Number(x)); return Number.isFinite(n) && n >= a && n <= b ? n : d; };
const COLOR = /^#[0-9A-Fa-f]{6}$/;
/* Everything that arrives is checked before it is drawn. */
function clean(st) {
  const out = { t: 'st', v: st.v, title: str(st.title, 120), bt: str(st.bt, 120), lock: !!st.lock, mo: st.mo && typeof st.mo === 'object' ? st.mo : null,
    seen: Array.isArray(st.seen) ? st.seen.slice(0, 200) : [], kick: Array.isArray(st.kick) ? st.kick.slice(0, 200) : [], eyes: !!st.eyes };
  const tk = st.tk;
  if (tk && typeof tk === 'object' && ID6.test(String(tk.id || '')) && ['quiz', 'sheet', 'game'].includes(tk.kind)) {
    const t = { id: tk.id, kind: tk.kind, title: str(tk.title, 120), left: int(tk.left, 0, 3600, 0) };
    if (tk.kind === 'quiz') {
      Object.assign(t, { phase: ['lobby', 'ask', 'reveal', 'end'].includes(tk.phase) ? tk.phase : 'ask', n: int(tk.n, 0, 200, 0), of: int(tk.of, 0, 200, 0), q: str(tk.q, 400), type: ['mcq', 'tf', 'type'].includes(tk.type) ? tk.type : 'mcq',
        opts: Array.isArray(tk.opts) ? tk.opts.slice(0, 6).map((x) => str(x, 120)) : [], why: str(tk.why, 400), secs: int(tk.secs, 0, 600, 0) });
      if (tk.phase === 'reveal') t.right = typeof tk.right === 'number' ? int(tk.right, 0, 5, -1) : str(tk.right, 120);
      if (tk.pic && typeof tk.pic === 'object' && /^https:\/\/upload\.wikimedia\.org\//.test(String(tk.pic.src || ''))) t.pic = { src: str(tk.pic.src, 400), credit: str(tk.pic.credit, 160) };
    } else {
      t.blob = ID6.test(String(tk.blob || '')) ? tk.blob : '';
      if (tk.kind === 'sheet') { t.lv = tk.lv && typeof tk.lv === 'object' ? tk.lv : {}; t.open = tk.open !== false; t.marks = !!tk.marks; }
      if (tk.kind === 'game') t.open = tk.open !== false;
    }
    out.tk = t;
  }
  if (st.res && typeof st.res === 'object' && P.pid && st.res[P.pid] != null) out.mine = st.res[P.pid];
  const tl = st.tools;
  if (tl && typeof tl === 'object') {
    const o = {};
    if (tl.timer && typeof tl.timer === 'object') o.timer = { left: int(tl.timer.left, 0, 36000, 0), secs: int(tl.timer.secs, 0, 36000, 0), paused: !!tl.timer.paused };
    if (tl.sign && typeof tl.sign === 'object' && str(tl.sign.word, 40)) o.sign = { id: str(tl.sign.id, 20), word: str(tl.sign.word, 40) };
    if (Array.isArray(tl.groups)) o.groups = tl.groups.slice(0, 12).map((g) => ({ name: str(g && g.name, 30) || 'Group', color: COLOR.test(String(g && g.color)) ? g.color : '#5B52E6',
      names: Array.isArray(g && g.names) ? g.names.slice(0, 16).map((x) => str(x, 20)).filter(Boolean) : [], pids: Array.isArray(g && g.pids) ? g.pids.slice(0, 16).map((x) => str(x, 16)) : [] }));
    if (Array.isArray(tl.points)) o.points = tl.points.slice(0, 8).map((t) => ({ name: str(t && t.name, 30) || 'Team', color: COLOR.test(String(t && t.color)) ? t.color : '#5B52E6', points: int(t && t.points, -9999, 99999, 0) }));
    if (Object.keys(o).length) out.tools = o;
  }
  const hw = st.hw;
  if (hw && typeof hw === 'object' && ID6.test(String(hw.id || '')) && /^\d{4}-\d{2}-\d{2}$/.test(String(hw.due || ''))) {
    out.hw = { id: hw.id, subject: str(hw.subject, 40), title: str(hw.title, 120) || 'Homework', details: str(hw.details, 600), due: hw.due,
      dueTime: /^\d{2}:\d{2}$/.test(String(hw.dueTime || '')) ? hw.dueTime : '', link: /^https:\/\/[^\s"<>]{3,300}$/.test(String(hw.link || '')) ? hw.link : '' };
  }
  out.bw = str(st.bw, 800);
  out.bp = /^https:\/\/upload\.wikimedia\.org\/[^\s"'<>]{4,380}$/.test(String(st.bp || '')) ? st.bp : '';
  if (st.sp && typeof st.sp === 'object' && str(st.sp.t, 300)) out.sp = { k: st.sp.k === 'q' ? 'q' : 'a', t: str(st.sp.t, 300) };
  out.dl = !!st.dl;
  return out;
}
function apply() {
  P.queued = false;
  const st = P.st;
  if (!st || !P.stop || ['ended', 'removed', 'left', 'bad'].includes(P.screen)) return;
  if (Array.isArray(st.kick) && st.kick.includes(P.pid)) { stopAll(); store.set(meKey(), null); screen('removed', 'You have left this lesson', 'Your teacher has taken you out of this live lesson.'); return; }
  const inLesson = Array.isArray(st.seen) && st.seen.includes(P.pid);
  if (!inLesson) {
    if (st.lock) screen('locked', 'The lesson is locked', 'Your teacher has stopped new people joining. Ask your teacher to unlock it.');
    else if (P.screen === 'joining' && P.joinTries > 2) { clearTimeout(P.joinT); sayHello(); }
    return;
  }
  clearTimeout(P.joinT);
  if (st.mo && st.mo.left) P.moAt = Date.now() + st.mo.left * 1000; else P.moAt = 0;
  if (st.tk && st.tk.left) P.tkAt = Date.now() + st.tk.left * 1000; else P.tkAt = 0;
  showEyes(!!st.eyes);
  lockDevice(!!st.dl);
  paintDock();
  if (st.hw && st.hw.id !== P.hwSeen) { P.hwSeen = st.hw.id; setTimeout(() => openHomework(), 300); buzz([60, 40, 60]); chime(); }
  // Only redraw when what is on the device itself changes, so a pupil typing, drawing or playing never loses their
  // work when someone else joins or the board moves on.
  const sig = sigOf(st);
  if (P.screen === 'in' && sig === P.sig) {
    clearInterval(P.tick);
    if (P.moAt || P.tkAt) { paintTime(); P.tick = setInterval(paintTime, 500); } else { const t = $('.jn-time'); if (t) t.hidden = true; }
    if (st.tk && st.tk.kind === 'sheet') paintMarks();
    return;
  }
  const fresh = (st.tk && st.tk.id + (st.tk.phase || '') !== P.lastTk) || (!st.tk && st.mo && st.mo.id !== P.lastMo);
  P.lastMo = st.mo ? st.mo.id : '';
  P.lastTk = st.tk ? st.tk.id + (st.tk.phase || '') : '';
  P.sig = sig;
  // a new question comes to the front: close homework, my group or Reading help (nothing typed is lost there;
  // a question being written to the teacher, or a drawing, stays open)
  if (fresh) { const m = $('.jn-modal'); if (m && ['hw', 'group', 'read'].includes(m.dataset.kind)) closeModal(); }
  render();
  if (fresh && !(st.tk && st.tk.kind === 'quiz' && ['reveal', 'end'].includes(st.tk.phase))) cue();
}
/* What is on the board also shows under a question that is not a list of options: a reaction, a traffic light, talk
   or think time, mini whiteboards and typed answers (pupils need the problem to work on). It redraws as the board
   changes only where nothing is being typed or drawn. */
const WITH_BOARD = new Set(['react', 'traffic', 'talk', 'think', 'listen', 'move', 'show', 'chat', 'waterfall']);
const BOARD_REDRAW = new Set(['react', 'traffic', 'talk', 'think', 'listen', 'move']);
const hashOf = (t) => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; };
function sigOf(st) {
  if (st.tk) {
    const t = st.tk, has = t.blob ? (P.blobs.has(t.blob) ? 1 : 0) : 1;
    const lv = t.kind === 'sheet' ? levelOf(t) : '';
    const mine = t.kind === 'quiz' && (t.phase === 'reveal' || t.phase === 'end') ? JSON.stringify(st.mine || null) : '';
    return ['tk', t.id, t.kind, t.phase || '', t.n || 0, has, lv, mine, t.open === false ? 'x' : ''].join('|');
  }
  if (st.mo) return [st.mo.id, st.mo.kind, JSON.stringify(st.mo.rv || null), st.title || ''].join('|') + (BOARD_REDRAW.has(st.mo.kind) ? '|' + hashOf(st.bw || '') + '|' + (st.bp || '') : '');
  return 'wait|' + (st.title || '') + '|' + (st.bt || '') + '|' + (st.hw ? st.hw.id : '') +
    '|' + (st.bw || '').length + ':' + hashOf(st.bw || '') + '|' + (st.bp || '') + '|' + (st.sp ? st.sp.k + hashOf(st.sp.t) : '');
}

/* ---------------- the current moment or task ---------------- */
const MO_TITLE = { react: 'How are you getting on?', vote: 'Vote', chat: 'Your answer', waterfall: 'Your answer', show: 'Show me', talk: 'Talk time', think: 'Think time', listen: 'Listen', move: 'Move', ticket: 'How did today’s lesson feel?', cloud: 'One word', traffic: 'How are you getting on?' };
const TRAFFIC = [['Stuck', '#D9534A'], ['Nearly', '#F2B84B'], ['Got it', '#2E9E6B']];
function render() {
  P.screen = 'in';
  const st = P.st, mo = st && st.mo;
  clearInterval(P.tick);
  if (!(st && st.tk && st.tk.kind === 'game')) stopGame();
  if (st && st.tk) { renderTask(st.tk); return; }
  if (!mo) {
    P.inkFor = '';
    const bt = st && st.bt, bw = st && st.bw, bp = st && st.bp, sp = st && st.sp;
    if (sp || bw || bp) { frame(boardCardHTML(st) + (st.hw ? '<section class="jn-card">' + hwCardHTML(st.hw, true) + '</section>' : '')); return; }
    frame('<section class="jn-card jn-center jn-wait"><div class="jn-bubble" aria-hidden="true">' + icon('check') + '</div><h1>You’re in, ' + esc(P.name) + '!</h1>' +
      (bt ? '<p class="jn-now"><small>On the board now</small><b>' + esc(bt) + '</b></p>' : '') +
      '<p>Look at the board. When your teacher asks a question, it appears here by itself.</p>' + (st && st.hw ? hwCardHTML(st.hw, true) : '') + '</section>');
    return;
  }
  const mine = P.sent.get(mo.id), rv = mo.rv;
  let body = '';
  if (mo.kind === 'react') body = '<div class="jn-rx">' + REACTIONS.slice(0, 3).map((r, i) => '<button type="button" class="jn-big' + (mine && mine.v === i ? ' on' : '') + '" data-v="' + i + '"><span>' + reactSVG(i) + '</span><b>' + r[1] + '</b></button>').join('') + '</div>' +
    '<div class="jn-fun">' + REACTIONS.slice(3).map((r, j) => '<button type="button" data-v="' + (j + 3) + '" aria-label="' + r[1] + '" title="' + r[1] + '">' + reactSVG(j + 3) + '</button>').join('') + '</div>';
  else if (mo.kind === 'ticket') body = '<div class="jn-faces">' + FACE_NAMES.map((n, i) => '<button type="button" class="jn-big' + (mine && mine.v === i ? ' on' : '') + '" data-v="' + i + '"><span>' + faceSVG(i) + '</span><b>' + n + '</b></button>').join('') + '</div>';
  else if (mo.kind === 'traffic') {
    const labels = Array.isArray(mo.opts) && mo.opts.length === 3 ? mo.opts.map((x) => str(x, 30)) : TRAFFIC.map((x) => x[0]);
    body = '<div class="jn-lights">' + TRAFFIC.map((t, i) => '<button type="button" class="jn-light' + (mine && mine.v === i ? ' on' : '') + '" data-v="' + i + '" style="--c:' + t[1] + '"><span class="jn-lamp" aria-hidden="true"></span><b>' + esc(labels[i]) + '</b></button>').join('') + '</div>';
  } else if (mo.kind === 'vote') {
    const opts = Array.isArray(mo.opts) && mo.opts.length ? mo.opts : ['A', 'B', 'C', 'D'];
    const right = rv && Number.isInteger(rv.right) ? rv.right : -1;
    body = '<div class="jn-votes">' + opts.map((o, i) => '<button type="button" class="jn-vote' + (mine && mine.v === i ? ' on' : '') + (right === i ? ' right' : '') + '" data-v="' + i + '"' + (right >= 0 ? ' disabled' : '') + '><b>' + 'ABCDEF'[i] + '</b><span>' + esc(o === 'ABCDEF'[i] ? 'Option ' + o : o) + '</span></button>').join('') + '</div>' +
      (right >= 0 && mine ? '<p class="jn-res ' + (mine.v === right ? 'ok' : '') + '">' + (mine.v === right ? 'Yes! You got it right.' : 'The answer was ' + 'ABCDEF'[right] + '. Have a look at the board.') + '</p>' : '');
  } else if (mo.kind === 'cloud') {
    body = '<form class="jn-form" id="jn-ans" novalidate><label class="jn-fld"><span>Your word</span><input data-q="0" maxlength="24" autocomplete="off" autocapitalize="none" enterkeyhint="send" value="' + esc(mine ? mine.v : '') + '" placeholder="One word"></label>' +
      '<button class="jn-btn" type="submit">' + icon('send') + (mine ? 'Send again' : 'Send my word') + '</button></form>' + (mine ? '<p class="jn-res ok">' + icon('check') + 'Your word is on the board.</p>' : '');
  } else if (mo.kind === 'chat' || mo.kind === 'waterfall') {
    const qs = Array.isArray(mo.qs) && mo.qs.length ? mo.qs : null, prev = mine ? (Array.isArray(mine.v) ? mine.v : [mine.v]) : [];
    body = '<form class="jn-form" id="jn-ans" novalidate>' + (qs ? qs.map((q, i) => '<label class="jn-fld"><span>' + (i + 1) + '. ' + esc(q) + '</span><input data-q="' + i + '" maxlength="160" autocomplete="off" value="' + esc(prev[i] || '') + '"></label>').join('') :
      '<label class="jn-fld"><span>Your answer</span><textarea data-q="0" rows="3" maxlength="200">' + esc(prev[0] || '') + '</textarea></label>') +
      '<button class="jn-btn" type="submit">' + icon('send') + (mine ? 'Send again' : 'Send to my teacher') + '</button></form>' + (rv ? '<p class="jn-res">' + icon('eye') + 'Your teacher is showing everyone’s answers on the board.</p>' : '');
  } else if (mo.kind === 'show') {
    body = '<div class="jn-wb"><div class="jn-board" id="jn-board"></div><div class="jn-tools" role="toolbar" aria-label="Pens">' +
      [0, 2, 1, 3].map((c) => '<button type="button" class="jn-c" data-c="' + c + '" style="--c:' + COLOURS[c] + '" aria-label="Pen colour"></button>').join('') +
      '<button type="button" class="jn-t" data-t="erase" aria-label="Rubber">' + icon('eraser') + '</button><button type="button" class="jn-t" data-t="undo" aria-label="Undo">' + icon('undo') + '</button><button type="button" class="jn-t" data-t="clear" aria-label="Clear">' + icon('trash') + '</button></div>' +
      '<button type="button" class="jn-btn" data-j="sendboard">' + icon('send') + (mine ? 'Send again' : 'Send to my teacher') + '</button></div>' + (rv ? '<p class="jn-res">' + icon('eye') + 'Your teacher is showing the boards.</p>' : '');
  } else {
    const sayIt = { talk: ['talk', 'Talk to your partner about the question on the board.', 'We are ready to share'], think: ['bulb', 'Think quietly first. No hands up yet.', 'I have an idea'], listen: ['ear', 'Close your eyes and listen.', ''], move: ['bolt', 'Stand up and get moving!', ''] }[mo.kind] || ['star', 'Look at the board.', ''];
    body = '<div class="jn-say">' + icon(sayIt[0]) + '<p>' + esc(sayIt[1]) + '</p></div>' + (sayIt[2] ? '<button type="button" class="jn-btn' + (mine ? ' done' : '') + '" data-v="1">' + icon('check') + esc(mine ? 'Sent: ' + sayIt[2].toLowerCase() : sayIt[2]) + '</button>' : '');
  }
  // the question, unless it only says what the title already says ("How are you getting on?")
  const q = mo.q && !['react', 'ticket'].includes(mo.kind) && String(mo.q).trim().toLowerCase() !== String(MO_TITLE[mo.kind] || '').toLowerCase() ? '<p class="jn-q">' + esc(mo.q) + '</p>' : '';
  frame('<section class="jn-card jn-mo" data-kind="' + esc(mo.kind) + '"><div class="jn-mo-top"><h1>' + esc(MO_TITLE[mo.kind] || 'Your turn') + '</h1><span class="jn-time" hidden>' + icon('clock') + '<b></b></span></div>' + q +
    (q ? '<button type="button" class="jn-read" data-j="say" data-say="' + esc(mo.q) + '">' + icon('volume') + 'Read it to me</button>' : '') + body +
    '<p class="jn-st" role="status">' + (mine ? icon('check') + 'Sent. Your teacher can see it.' : '') + '</p></section>' +
    (WITH_BOARD.has(mo.kind) && st && (st.bw || st.bp) ? boardCardHTML(Object.assign({}, st, { sp: null }), true) : ''));
  if (mo.kind === 'show') board(mo.id, $('#jn-board'));
  if (P.moAt) { paintTime(); P.tick = setInterval(paintTime, 500); }
}
function paintTime() {
  const t = $('.jn-time');
  if (!t) return;
  const at = P.st && P.st.tk ? P.tkAt : P.moAt;
  if (!at) { t.hidden = true; return; }
  const left = Math.max(0, Math.round((at - Date.now()) / 1000));
  t.hidden = false;
  $('b', t).textContent = left ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : 'Time’s up';
  t.classList.toggle('low', left <= 5);
  const bar = $('.jn-qbar i');
  if (bar && P.st && P.st.tk && P.st.tk.secs) bar.style.width = Math.max(0, Math.min(100, (left / P.st.tk.secs) * 100)) + '%';
  if (!left) clearInterval(P.tick);
}
function board(id, host) {
  if (!P.ink || P.inkFor !== id) {
    if (P.ink) P.ink.destroy();
    P.ink = new Ink(host, { onChange: () => {} });
    P.ink.set({ tool: 'pen', color: COLOURS[0], size: 1 });
    P.inkFor = id;
  } else P.ink.attach(host);
  P.ink.enable(true);
  paintTools();
}
function paintTools() {
  if (!P.ink) return;
  $$('.jn-c').forEach((b) => b.setAttribute('aria-pressed', String(P.ink.tool !== 'erase' && COLOURS[Number(b.dataset.c)] === P.ink.color)));
  const er = $('[data-t="erase"]'); if (er) er.setAttribute('aria-pressed', String(P.ink.tool === 'erase'));
}
async function answer(v, btn) {
  const mo = P.st && P.st.mo;
  if (!mo) return;
  const had = P.sent.get(mo.id) || { n: 0 };
  if (had.n >= 8) { status('That is enough answers for this question. Look at the board.'); return; }
  if (btn) btn.disabled = true;
  status('Sending…');
  try {
    await send({ t: 'ans', m: mo.id, k: mo.kind === 'cloud' ? 'cloud' : mo.kind, v });
    P.sent.set(mo.id, { v, n: had.n + 1 });
    if (mo.kind !== 'show') render(); else status(icon('check') + 'Sent. Your teacher can see it.', true);
  } catch (e) {
    status(sendError(e));
  } finally { if (btn) btn.disabled = false; }
}
const sendError = (e) => { const c = e && e.code; return c === 'busy' ? 'Lots of answers at once. Wait a few seconds and tap again.' : c === 'full' ? 'The free relay is full for today on this network, so answers cannot get through. Tell your teacher.' : 'It did not send. Check the internet and tap again.'; };
function status(t, html) { const s = $('.jn-st'); if (s) { if (html) s.innerHTML = t; else s.textContent = t; } }

/* ---------------- tasks: a live quiz, a worksheet, a game ---------------- */
function renderTask(tk) {
  if (tk.kind === 'quiz') { quizScreen(tk); return; }
  if (tk.kind === 'sheet') { sheetScreen(tk); return; }
  if (tk.kind === 'game') { gameScreen(tk); }
}
/* The live quiz: the question, four shape-coded answers and the countdown; then right or not, the why, the points. */
function quizScreen(tk) {
  const fmtN = (n) => Number(n || 0).toLocaleString('en-GB');
  if (tk.phase === 'lobby') {
    frame('<section class="jn-card jn-center jn-quiz"><div class="jn-bubble jn-qbub" aria-hidden="true">' + icon('trophy') + '</div><h1>Get ready, ' + esc(P.name) + '!</h1><p class="jn-big-t">' + esc(tk.title || 'Quiz') + '</p>' +
      '<p>' + (tk.of ? tk.of + (tk.of === 1 ? ' question.' : ' questions.') + ' ' : '') + 'Right answers score more points when you are quick.</p></section>');
    return;
  }
  const mine = P.st.mine;
  if (tk.phase === 'end') {
    const tot = Array.isArray(mine) ? mine[2] : 0, place = Array.isArray(mine) ? mine[3] : 0;
    frame('<section class="jn-card jn-center jn-quiz jn-qend"><div class="jn-bubble jn-qbub" aria-hidden="true">' + icon('trophy') + '</div><h1>Quiz finished!</h1>' +
      '<p class="jn-big-t">' + fmtN(tot) + ' points</p>' + (place && tot > 0 ? '<p class="jn-place">You came <b>' + ordinal(place) + '</b>' + (place === 1 ? '. Amazing!' : place <= 3 ? '. Brilliant!' : '. Well done!') + '</p>' : '<p class="jn-place">Thank you for playing. Every quiz makes your brain stronger!</p>') + '<p>Look at the board for the winners.</p></section>');
    if (place && tot > 0 && place <= 3) fanfare(); else ding();
    return;
  }
  const sent = P.quiz.get(tk.id);
  const opts = tk.type === 'tf' ? (tk.opts.length ? tk.opts : ['True', 'False']) : tk.opts;
  let body = '';
  if (tk.phase === 'reveal') {
    const ok = Array.isArray(mine) ? !!mine[0] : false, gained = Array.isArray(mine) ? mine[1] : 0, place = Array.isArray(mine) ? mine[3] : 0;
    const rightText = typeof tk.right === 'number' ? (opts[tk.right] || '') : tk.right;
    body = '<div class="jn-verdict ' + (sent == null ? 'none' : ok ? 'ok' : 'no') + '"><b>' + (sent == null ? 'Time’s up!' : ok ? 'Right!' : 'Not this time') + '</b>' +
      (ok ? '<span>+' + fmtN(gained) + ' points</span>' : '') + '</div>' +
      (!ok && rightText ? '<p class="jn-q jn-right-a"><small>The answer</small>' + esc(rightText) + '</p>' : '') +
      (tk.why ? '<p class="jn-why">' + icon('bulb') + '<span>' + esc(tk.why) + '</span></p>' : '') +
      (Array.isArray(mine) ? '<p class="jn-place">' + fmtN(mine[2]) + ' points so far' + (place ? ' · you are <b>' + ordinal(place) + '</b>' : '') + '</p>' : '');
    if (sent != null) { if (ok) { ding(); buzz([40, 30, 40]); } else soft(); }
  } else if (tk.type === 'type') {
    body = sent != null ? '<p class="jn-res ok">' + icon('check') + 'Answer sent: “' + esc(sent) + '”. Wait for the others…</p>'
      : '<form class="jn-form" id="jn-qtype" novalidate><label class="jn-fld"><span>Your answer</span><input id="jn-qt" maxlength="80" autocomplete="off" enterkeyhint="send"></label><button class="jn-btn" type="submit">' + icon('send') + 'Send</button></form>';
  } else {
    body = '<div class="jn-opts' + (opts.length <= 2 ? ' two' : '') + '" role="group" aria-label="Answers">' + opts.map((o, i) => {
      const s = SHAPES[i % SHAPES.length];
      return '<button type="button" class="jn-opt' + (sent === i ? ' on' : sent != null ? ' dim' : '') + '" data-qa="' + i + '" style="--c:' + s.c + ';--d:' + s.d + '"' + (sent != null ? ' disabled' : '') + ' aria-label="' + esc(s.name + ': ' + o) + '">' + shapeSVG(i) + '<b>' + esc(o) + '</b></button>';
    }).join('') + '</div>' + (sent != null ? '<p class="jn-res ok">' + icon('check') + 'Answer sent. Wait for the others…</p>' : '');
  }
  frame('<section class="jn-card jn-mo jn-quiz" data-kind="quiz"><div class="jn-mo-top"><h1>' + (tk.n ? 'Question ' + tk.n + (tk.of ? ' of ' + tk.of : '') : 'Quiz') + '</h1><span class="jn-time" hidden>' + icon('clock') + '<b></b></span></div>' +
    (tk.phase === 'ask' && tk.secs ? '<div class="jn-qbar" aria-hidden="true"><i></i></div>' : '') +
    (tk.pic ? '<figure class="jn-pic"><img src="' + esc(tk.pic.src) + '" alt="" decoding="async"><figcaption>' + esc(tk.pic.credit) + '</figcaption></figure>' : '') +
    '<p class="jn-q jn-qq">' + esc(tk.q) + '</p><button type="button" class="jn-read" data-j="say" data-say="' + esc(tk.q + (opts.length && tk.type !== 'type' ? '. ' + opts.map((o, i) => SHAPES[i % SHAPES.length].name + ': ' + o).join('. ') : '')) + '">' + icon('volume') + 'Read it to me</button>' +
    body + '<p class="jn-st" role="status"></p></section>');
  if (P.tkAt && tk.phase === 'ask') { paintTime(); P.tick = setInterval(paintTime, 500); }
}
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
async function quizAnswer(v, btn) {
  const tk = P.st && P.st.tk;
  if (!tk || tk.kind !== 'quiz' || tk.phase !== 'ask' || P.quiz.has(tk.id)) return;
  if (btn) btn.disabled = true;
  P.quiz.set(tk.id, v);
  render();
  try { await send({ t: 'ans', m: tk.id, k: 'quiz', v }); buzz(30); }
  catch (e) { P.quiz.delete(tk.id); render(); status(sendError(e)); }
}

/* The worksheet on the device: every question at once. Answers go to the teacher in small batches (the first one
   at once, then every 15 seconds), and all of them when "Hand it in" is pressed, so the relay is not flooded. */
function levelOf(tk) { const l = tk.lv && P.pid ? tk.lv[P.pid] : ''; return ['support', 'challenge'].includes(l) ? l : 'core'; }
function sheetOf(tk) {
  const b = tk.blob && P.blobs.get(tk.blob);
  if (!b || b.kind !== 'sheet') return null;
  const d = b.data, lv = levelOf(tk);
  const sections = (lv !== 'core' && d.levels && d.levels[lv] && Array.isArray(d.levels[lv].sections)) ? d.levels[lv].sections : Array.isArray(d.sections) ? d.sections : [];
  return { title: str(d.title, 120), instructions: str(d.instructions, 400), lv, sections: sections.slice(0, 12).map((s) => ({ heading: str(s && s.heading, 120),
    questions: (Array.isArray(s && s.questions) ? s.questions : []).slice(0, 30).map((q) => ({ i: int(q && q.i, 0, 99, -1), q: str(q && q.q, 500), type: str(q && q.type, 10), opts: Array.isArray(q && q.opts) ? q.opts.slice(0, 8).map((x) => str(x, 120)) : [], multi: !!(q && q.multi) })).filter((q) => q.i >= 0 && q.q) })) };
}
function loadSheet() { const v = store.get(sheetKey()); P.sheet = v && v.id ? Object.assign({ dirty: [], done: 0 }, v) : null; }
function keepSheet() { if (P.sheet) store.set(sheetKey(), { id: P.sheet.id, ans: P.sheet.ans, sent: P.sheet.sent, done: P.sheet.done }); }
function sheetScreen(tk) {
  const sh = sheetOf(tk);
  if (!sh) { frame('<section class="jn-card jn-center"><h1>Your worksheet is on its way…</h1><p>It arrives in a moment. Keep this page open.</p></section>'); return; }
  if (!P.sheet || P.sheet.id !== tk.id) { P.sheet = { id: tk.id, ans: {}, sent: {}, dirty: [], done: 0 }; keepSheet(); }
  const S = P.sheet, lvName = { core: '', support: 'Support', challenge: 'Challenge' }[sh.lv];
  const qHTML = (q) => {
    const a = S.ans[q.i], sentNow = S.sent[q.i] !== undefined && JSON.stringify(S.sent[q.i]) === JSON.stringify(a);
    let field = '';
    if ((q.type === 'choice' || q.type === 'tick') && q.opts.length) {
      field = '<div class="jn-choices" role="group">' + q.opts.map((o, k) => {
        const on = Array.isArray(a) ? a.includes(k) : a === k;
        return '<button type="button" class="jn-choice' + (on ? ' on' : '') + '" data-si="' + q.i + '" data-sc="' + k + '"' + (q.multi || q.type === 'tick' ? ' data-multi="1"' : '') + ' aria-pressed="' + on + '"><b>' + 'ABCDEFGH'[k] + '</b><span>' + esc(o) + '</span></button>';
      }).join('') + '</div>';
    } else if (q.type === 'draw') {
      field = '<button type="button" class="jn-btn ghost" data-j="draw" data-si="' + q.i + '">' + icon('pen') + (a ? 'Draw it again' : 'Draw my answer') + '</button>' + (a ? '<p class="jn-res ok">' + icon('check') + 'Drawing ready.</p>' : '');
    } else {
      field = '<div class="jn-sa"><textarea data-si="' + q.i + '" rows="' + (q.type === 'write' ? 3 : 1) + '" maxlength="300" placeholder="Your answer">' + esc(typeof a === 'string' ? a : '') + '</textarea></div>';
    }
    return '<li class="jn-sq" data-i="' + q.i + '"><div class="jn-sq-h"><span class="jn-sq-n">' + (q.i + 1) + '</span><p>' + esc(q.q) + '</p><span class="jn-mark" data-mark="' + q.i + '" aria-live="polite"></span></div>' + field +
      '<p class="jn-sq-st">' + (sentNow ? icon('check') + 'Sent' : a != null && a !== '' ? 'Not sent yet' : '') + '</p></li>';
  };
  const all = sh.sections.reduce((n, s) => n + s.questions.length, 0), done = Object.keys(S.ans).filter((k) => S.ans[k] != null && S.ans[k] !== '').length;
  frame('<section class="jn-card jn-sheet"><div class="jn-mo-top"><h1>' + esc(sh.title || tk.title || 'Worksheet') + '</h1>' + (lvName ? '<span class="jn-lv">' + esc(lvName) + '</span>' : '') + '</div>' +
    (sh.instructions ? '<p class="jn-q">' + esc(sh.instructions) + '</p>' : '') +
    '<div class="jn-prog" aria-label="Your progress"><i style="width:' + (all ? Math.round((done / all) * 100) : 0) + '%"></i><span>' + done + ' of ' + all + ' done</span></div>' +
    sh.sections.map((s) => (s.heading ? '<h2 class="jn-sh">' + esc(s.heading) + '</h2>' : '') + '<ol class="jn-sqs">' + s.questions.map(qHTML).join('') + '</ol>').join('') +
    (tk.open === false ? '<p class="jn-res">' + icon('check') + 'Your teacher has closed this worksheet.</p>' : '<button type="button" class="jn-btn' + (S.done ? ' done' : '') + '" data-j="handin">' + icon('send') + (S.done ? 'Handed in. Send my changes' : 'Hand it in') + '</button>') +
    '<p class="jn-st" role="status"></p></section>');
  paintMarks();
}
function paintMarks() {
  const st = P.st, tk = st && st.tk, m = st && st.mine;
  if (!tk || tk.kind !== 'sheet') return;
  $$('[data-mark]').forEach((el) => {
    const i = el.dataset.mark, v = tk.marks && m && typeof m === 'object' && !Array.isArray(m) ? m[i] : undefined;
    el.className = 'jn-mark' + (v === 1 ? ' ok' : v === 0 ? ' no' : '');
    el.innerHTML = v === 1 ? icon('check') + '<span class="sr">Right</span>' : v === 0 ? icon('close') + '<span class="sr">Have another look</span>' : '';
  });
}
function setSheetAnswer(i, a) {
  const S = P.sheet;
  if (!S) return;
  S.ans[i] = a;
  if (!S.dirty.includes(i)) S.dirty.push(i);
  keepSheet();
  const li = $('.jn-sq[data-i="' + i + '"] .jn-sq-st'); if (li) li.textContent = 'Not sent yet';
  const first = !Object.keys(S.sent).length;
  clearTimeout(P.sheetT);
  P.sheetT = setTimeout(flushSheet, first ? 600 : 15000);
  paintProgress();
}
function paintProgress() {
  const S = P.sheet, bar = $('.jn-prog');
  if (!S || !bar) return;
  const all = $$('.jn-sq').length, done = Object.keys(S.ans).filter((k) => S.ans[k] != null && S.ans[k] !== '' && !(Array.isArray(S.ans[k]) && !S.ans[k].length)).length;
  $('i', bar).style.width = (all ? Math.round((done / all) * 100) : 0) + '%';
  $('span', bar).textContent = done + ' of ' + all + ' done';
}
async function flushSheet(done) {
  clearTimeout(P.sheetT);
  const S = P.sheet, tk = P.st && P.st.tk;
  if (!S || !tk || tk.kind !== 'sheet' || tk.id !== S.id || !P.relay) return;
  const list = S.dirty.slice(0, 40), b = list.map((i) => ({ i: Number(i), a: S.ans[i] })).filter((x) => x.a != null);
  if (!b.length && !done) return;
  S.dirty = S.dirty.filter((i) => !list.includes(i));
  try {
    await send({ t: 'ans', m: S.id, k: 'sheet', v: { b, done: !!done } });
    b.forEach((x) => { S.sent[x.i] = x.a; const li = $('.jn-sq[data-i="' + x.i + '"] .jn-sq-st'); if (li) li.innerHTML = icon('check') + 'Sent'; });
    if (done) { S.done = Date.now(); const h = $('[data-j="handin"]'); if (h) { h.classList.add('done'); h.innerHTML = icon('send') + 'Handed in. Send my changes'; } status(icon('check') + 'Handed in. Your teacher can see your answers.', true); ding(); }
    keepSheet();
    if (S.dirty.length) P.sheetT = setTimeout(flushSheet, 15000);
  } catch (e) {
    list.forEach((i) => { if (!S.dirty.includes(i)) S.dirty.push(i); });
    status(sendError(e));
    P.sheetT = setTimeout(flushSheet, 20000);
  }
}
/* A drawing for a worksheet question: a mini whiteboard in a sheet. */
function drawFor(i) {
  const m = sheetModal('<h2>Draw your answer</h2><div class="jn-board" id="jn-dboard"></div><div class="jn-tools" role="toolbar" aria-label="Pens">' +
    [0, 2, 1, 3].map((c) => '<button type="button" class="jn-c" data-c="' + c + '" style="--c:' + COLOURS[c] + '" aria-label="Pen colour"></button>').join('') +
    '<button type="button" class="jn-t" data-t="erase" aria-label="Rubber">' + icon('eraser') + '</button><button type="button" class="jn-t" data-t="undo" aria-label="Undo">' + icon('undo') + '</button><button type="button" class="jn-t" data-t="clear" aria-label="Clear">' + icon('trash') + '</button></div>' +
    '<button type="button" class="jn-btn" data-dsave="' + i + '">' + icon('check') + 'Use this drawing</button>', 'draw');
  board('sheet-' + i, $('#jn-dboard', m));
}

/* The game on the device (FORK C's player). Scores go to the teacher when they improve (at most every 8 seconds)
   and when the game ends. */
function stopGame() { if (P.game && P.game.ctl && P.game.ctl.stop) { try { P.game.ctl.stop(); } catch (e) { /* gone */ } } if (P.game) clearTimeout(P.game.t); P.game = null; }
function gameScreen(tk) {
  const b = tk.blob && P.blobs.get(tk.blob);
  if (tk.open === false) {
    if (P.game && P.game.id === tk.id) queueScore(P.game, true);
    stopGame();
    frame('<section class="jn-card jn-center"><h1>Game over</h1><p>Your teacher has ended the game. Look at the board for the scores.</p></section>');
    return;
  }
  if (P.game && P.game.id === tk.id && P.game.ctl && $('#jn-game')) return;        // already playing: never restart it
  stopGame();
  if (!b || b.kind !== 'game') { frame('<section class="jn-card jn-center"><h1>Your teacher’s game is on its way</h1><p>Keep this page open. It starts here by itself.</p></section>'); return; }
  frame('<section class="jn-card jn-game-c"><div class="jn-mo-top"><h1>' + esc(tk.title || 'Game') + '</h1><span class="jn-score" aria-live="polite"></span></div><div class="jn-game" id="jn-game"></div></section>', { leave: false });
  P.game = { id: tk.id, best: 0, sentBest: -1, at: 0, t: 0, ctl: null };
  const G = P.game;
  import('../games/player.js?v=cdc164df').then((m) => {
    if (P.game !== G || !$('#jn-game')) return;
    const host = $('#jn-game');
    G.ctl = m.playGame(host, b.data, {
      mode: 'device', sound: !P.mute,
      onScore: (score) => { score = int(score, 0, 1e7, 0); if (score > G.best) G.best = score; const s = $('.jn-score'); if (s) s.textContent = G.best.toLocaleString('en-GB') + ' points'; queueScore(G, false); },
      onEnd: (r) => { const s = int(r && r.score != null ? r.score : G.best, 0, 1e7, 0); if (s > G.best) G.best = s; queueScore(G, true); }
    });
  }).catch(() => {
    if (P.game !== G) return;
    const h = $('#jn-game'); if (h) h.innerHTML = '<p class="jn-wait-t">Your teacher’s game is on its way. Keep this page open.</p>';
  });
}
function queueScore(G, done) {
  clearTimeout(G.t);
  const go = async () => {
    if (done ? G.doneSent : (P.game !== G || G.best <= G.sentBest)) return;
    G.at = Date.now();
    try { await send({ t: 'ans', m: G.id, k: 'game', v: { s: G.best, d: !!done } }); G.sentBest = G.best; if (done) G.doneSent = true; } catch (e) { if (P.relay) G.t = setTimeout(go, 12000); }
  };
  const wait = done ? 0 : Math.max(0, 8000 - (Date.now() - G.at));
  G.t = setTimeout(go, wait);
}

/* ---------------- the bar at the bottom: class tools, Reading help, I need help, Ask my teacher ---------------- */
function dockEl() {
  let d = $('#jn-dock');
  if (!d) { d = document.createElement('div'); d.id = 'jn-dock'; d.className = 'jn-dock'; d.hidden = true; document.body.appendChild(d); d.addEventListener('click', onDockClick); }
  return d;
}
function myGroup() { const g = P.st && P.st.tools && P.st.tools.groups; return g ? g.find((x) => x.pids.includes(P.pid)) || null : null; }
function paintDock() {
  const d = dockEl(), joined = P.screen === 'in' && !!P.stop;
  d.hidden = !joined;
  document.body.classList.toggle('jn-has-dock', joined);
  if (!joined) return;
  const t = (P.st && P.st.tools) || {}, chips = [];
  if (t.timer) {
    const ends = Date.now() + t.timer.left * 1000;
    if (!P.timerEnds || Math.abs(P.timerEnds - ends) > 1500 || P.timerPaused !== t.timer.paused) { P.timerEnds = ends; P.timerPaused = t.timer.paused; P.timerLeft = t.timer.left; }
    chips.push('<span class="jn-chip jn-timer" role="timer">' + icon('clock') + '<b data-tleft></b></span>');
  } else { P.timerEnds = 0; }
  if (t.sign) chips.push('<span class="jn-chip jn-sign">' + icon(signIcon(t.sign.id)) + '<b>' + esc(t.sign.word) + '</b></span>');
  const g = myGroup();
  if (g) chips.push('<button type="button" class="jn-chip jn-grp" data-d="group" style="--c:' + g.color + '">' + icon('users') + '<b>' + esc(g.name) + '</b></button>');
  if (t.points && t.points.length) chips.push('<span class="jn-chip jn-pts">' + icon('trophy') + t.points.slice(0, 6).map((p) => '<i style="--c:' + p.color + '"><b>' + esc(p.name) + '</b> ' + p.points + '</i>').join('') + '</span>');
  if (P.st && P.st.hw) chips.push('<button type="button" class="jn-chip jn-hw" data-d="hw">' + icon('cal') + '<b>Homework</b></button>');
  const replies = P.asks.filter((a) => a.reply && !a.seen).length;
  d.innerHTML = (chips.length ? '<div class="jn-chips">' + chips.join('') + '</div>' : '') +
    '<div class="jn-acts"><button type="button" class="jn-act" data-d="read">' + icon('type') + '<span>Reading help</span></button>' +
    '<button type="button" class="jn-act jn-hand' + (P.hand ? ' on' : '') + '" data-d="hand" aria-pressed="' + P.hand + '">' + icon('hand') + '<span>' + (P.hand ? (P.coming ? 'Teacher is coming' : 'Hand is up') : 'I need help') + '</span></button>' +
    '<button type="button" class="jn-act" data-d="ask">' + icon('chat') + '<span>Ask my teacher</span>' + (replies ? '<em>' + replies + '</em>' : '') + '</button></div>';
  paintTimer();
  requestAnimationFrame(() => document.documentElement.style.setProperty('--dock-h', (d.offsetHeight || 0) + 'px'));
}
function signIcon(id) { return { silent: 'ear', partner: 'talk', group: 'users', hands: 'hand', eyes: 'eye', listen: 'ear', think: 'bulb', tidy: 'check', line: 'flag' }[id] || 'flag'; }
let timerTick = 0;
function paintTimer() {
  clearInterval(timerTick);
  const b = $('[data-tleft]');
  if (!b || !P.timerEnds) return;
  const draw = () => {
    const left = P.timerPaused ? P.timerLeft : Math.max(0, Math.round((P.timerEnds - Date.now()) / 1000));
    b.textContent = left ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : 'Time’s up';
    b.parentElement.classList.toggle('low', left > 0 && left <= 10);
    b.parentElement.classList.toggle('up', !left);
    if (!left && !P.timerPaused && P.timerDone !== String(P.timerEnds)) { P.timerDone = String(P.timerEnds); chime(); buzz([120, 80, 120]); }
    if (!left || P.timerPaused) clearInterval(timerTick);
  };
  draw();
  timerTick = setInterval(draw, 500);
}
function onDockClick(e) {
  const b = e.target.closest('[data-d]');
  if (!b) return;
  const a = b.dataset.d;
  if (a === 'read') openRead();
  else if (a === 'hand') toggleHand();
  else if (a === 'ask') openAsk();
  else if (a === 'group') openGroup();
  else if (a === 'hw') openHomework();
}
async function toggleHand() {
  const on = !P.hand;
  P.hand = on; if (!on) P.coming = false;
  paintDock();
  try { await send({ t: 'help', on }); toastOne(on ? 'Your hand is up. Your teacher can see it.' : 'Your hand is down.', 'hand'); }
  catch (e) { P.hand = !on; paintDock(); toastOne(sendError(e), 'hand'); }
}

/* ---------------- sheets that slide up: Reading help, Ask my teacher, my group, homework ---------------- */
function sheetModal(inner, kind) {
  closeModal();
  const m = document.createElement('div');
  m.className = 'jn-modal'; m.dataset.kind = kind || '';
  m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = '<div class="jn-sheetc"><button type="button" class="jn-x" data-mx aria-label="Close">' + icon('close') + '</button>' + inner + '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', onModalClick);
  m.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  setTimeout(() => { const f = $('input, textarea, button:not([data-mx])', m); if (f) f.focus(); }, 60);
  return m;
}
function closeModal() { const m = $('.jn-modal'); if (m) { if (m.dataset.kind === 'draw' && P.ink && P.inkFor && P.inkFor.startsWith('sheet-')) { P.ink.destroy(); P.ink = null; P.inkFor = ''; } m.remove(); } }
function openRead() {
  const r = P.read;
  const row = (name, list, cur, key) => '<div class="jn-rrow"><span>' + name + '</span><div class="jn-rpick" role="group" aria-label="' + name + '">' + list.map((x) => '<button type="button" data-rk="' + key + '" data-rv="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '"' + (key === 'f' ? ' style="font-family:' + esc(x[2]) + '"' : key === 'bg' ? ' class="bg-' + x[0] + '"' : '') + '>' + esc(x[1]) + '</button>').join('') + '</div></div>';
  sheetModal('<h2>' + icon('type') + 'Reading help</h2><p class="jn-fine">Make the words easier to read. This stays on this device.</p>' +
    row('Font', FONTS, r.f, 'f') + row('Text size', SIZES, r.s, 's') + row('Letter spacing', SPACES, r.sp, 'sp') + row('Background', BGS, r.bg, 'bg') +
    '<p class="jn-sample">The quick brown fox jumps over 3/4 of the lazy dog.</p>', 'read');
}
function openAsk() {
  P.asks.forEach((a) => { if (a.reply) a.seen = true; });
  paintDock();
  const list = P.asks.slice(-5).reverse().map((a) => '<li><p class="jn-askq">' + esc(a.text) + '</p>' + (a.reply ? '<p class="jn-askr">' + icon('chat') + '<span>' + esc(a.reply) + '</span></p>' : '<p class="jn-fine">Sent. Your teacher will answer.</p>') + '</li>').join('');
  sheetModal('<h2>' + icon('chat') + 'Ask my teacher</h2><p class="jn-fine">Only your teacher sees this.</p><form id="jn-askf" class="jn-form" novalidate><label class="jn-fld"><span>Your question</span><textarea id="jn-askt" rows="3" maxlength="200" placeholder="For example: I don’t understand step 2"></textarea></label>' +
    '<button class="jn-btn" type="submit">' + icon('send') + 'Send to my teacher</button><p class="jn-msg" role="status"></p></form>' + (list ? '<ul class="jn-asks">' + list + '</ul>' : ''), 'ask');
}
function openGroup() {
  const g = myGroup();
  if (!g) return;
  const others = g.names.filter((n) => n !== P.name);
  sheetModal('<h2 style="color:' + g.color + '">' + icon('users') + esc(g.name) + '</h2><p class="jn-grp-t">You’re in ' + esc(g.name) + (others.length ? ' with ' + esc(listWords(others)) : '') + '.</p>' +
    '<ul class="jn-grp-l">' + g.names.map((n) => '<li style="--c:' + g.color + '">' + esc(n) + (n === P.name ? ' <small>(you)</small>' : '') + '</li>').join('') + '</ul>', 'group');
}
const listWords = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

/* ---------------- what is on the board now ---------------- */
/* The slide's own words (never answers still hidden on the board), its picture when it is a free Wikimedia one, or
   something the teacher is showing big from the class view. It follows Reading help like everything else here. */
function boardCardHTML(st, under) {
  const hi = under ? '' : '<p class="jn-in">' + icon('check') + 'You’re in, ' + esc(P.name) + '!</p>';
  if (st.sp) {
    const k = st.sp.k === 'q' ? 'A question from the class' : 'An answer from the class';
    return hi + '<section class="jn-card jn-board-now"><p class="jn-now-k">' + icon('eye') + 'On the board now</p><p class="jn-now-sk">' + k + '</p><p class="jn-now-big">' + esc(st.sp.t) + '</p>' +
      '<button type="button" class="jn-read" data-j="say" data-say="' + esc(k + '. ' + st.sp.t) + '">' + icon('volume') + 'Read it to me</button></section>';
  }
  const paras = String(st.bw || '').split('\n').map((x) => x.trim()).filter(Boolean);
  return hi + '<section class="jn-card jn-board-now"><p class="jn-now-k">' + icon('eye') + 'On the board now</p>' + (st.bt ? '<h1 class="jn-now-t">' + esc(st.bt) + '</h1>' : '') +
    (st.bp ? '<figure class="jn-now-pic"><img src="' + esc(st.bp) + '" alt="The picture on the board" decoding="async" referrerpolicy="no-referrer"></figure>' : '') +
    (paras.length ? '<div class="jn-now-w">' + paras.slice(0, 14).map((x) => '<p>' + esc(x) + '</p>').join('') + '</div>' : '') +
    ((st.bt || paras.length) ? '<button type="button" class="jn-read" data-j="say" data-say="' + esc([st.bt].concat(paras).filter(Boolean).join('. ')) + '">' + icon('volume') + 'Read it to me</button>' : '') +
    '<p class="jn-fine">When your teacher asks a question, it appears here by itself.</p></section>';
}

/* ---------------- Lock devices ----------------
   No website can stop a phone or tablet opening another app or tab (only school device management can: Guided
   Access, App pinning, kiosk mode on school Chromebooks). So, while the teacher has locked devices, this page does what a page
   can: it asks to go full screen (a tap, where the browser allows it), blocks its own links, stops selecting and
   dragging, shows a small "Stay on this page" bar, and tells the teacher when the pupil leaves the page for more than
   2 seconds and for how long. One message when they go and one when they come back, one pair every 10 seconds at
   most (the free relay counts every message). */
const AWAY = { on: false, at: 0, marked: false, sentOn: false, lastPair: 0, n: 0, tot: 0, t: 0, fs: false, blurred: false };
function lockDevice(on) {
  if (on === P.locked) return;
  P.locked = on;
  document.documentElement.classList.toggle('jn-locked', on);
  if (on) {
    let bar = $('#jn-staybar');
    if (!bar) { bar = document.createElement('div'); bar.id = 'jn-staybar'; bar.className = 'jn-staybar'; bar.setAttribute('role', 'status'); bar.innerHTML = icon('lock') + '<span>Stay on this page</span>'; document.body.appendChild(bar); }
    if (fullOK() && !document.fullscreenElement) askFull(); else setTimeout(silenceCard, 300);
    toastOne('Your teacher has locked this page for the class. Stay on this page.', 'lock', true);
  } else {
    const bar = $('#jn-staybar'); if (bar) bar.remove();
    const f = $('#jn-full'); if (f) f.remove();
    clearTimeout(AWAY.t); AWAY.on = false; AWAY.marked = false;
    if (AWAY.fs && document.fullscreenElement) { try { document.exitFullscreen().catch(() => {}); } catch (e) { /* fine */ } }
    AWAY.fs = false;
    toastOne('Your teacher has unlocked this page.', 'check');
  }
}
const fullOK = () => !!(document.documentElement.requestFullscreen && document.fullscreenEnabled !== false);
/* A tap is needed before a page may go full screen. Where there is no full screen (an iPhone), the tap only says
   "I'm here". */
function askFull() {
  if ($('#jn-full')) return;
  const o = document.createElement('div');
  o.id = 'jn-full'; o.className = 'jn-full'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'jn-full-h');
  o.innerHTML = '<div class="jn-full-in">' + icon('lock') + '<h2 id="jn-full-h">Your teacher has locked this page</h2><p>Stay on this page for the class.</p><button type="button" class="jn-btn">' + icon('check') + 'Tap to carry on</button></div>';
  document.body.appendChild(o);
  o.addEventListener('click', () => {
    o.remove();
    if (fullOK() && !document.fullscreenElement) { try { document.documentElement.requestFullscreen().then(() => { AWAY.fs = true; awayCheck(); }).catch(() => {}); } catch (e) { /* not allowed here */ } }
    setTimeout(silenceCard, 400);
  });
}
/* A web page cannot silence calls, messages or other apps' pop-ups, so while the class is locked it asks, once per
   lesson, for Do Not Disturb, with the steps for this kind of device. The page cannot check it is on. */
function silenceCard() {
  if (!P.locked) return;
  const k = 'ks2-live.dnd.' + (P.info ? P.info.sid : '');
  if (store.get(k)) return;
  store.set(k, 1);
  const ua = navigator.userAgent || '', ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const how = ios ? 'Swipe down from the top-right corner to open Control Centre, tap Focus, then tap Do Not Disturb.' :
    /CrOS/.test(ua) ? 'Click the time at the bottom right of the screen, then Do not disturb.' :
    /Android/i.test(ua) ? 'Swipe down from the top of the screen (twice on some devices) and tap Do Not Disturb.' :
    /Macintosh/.test(ua) ? 'Click Control Centre at the top right of the screen, then Focus, then Do Not Disturb.' :
    /Windows/.test(ua) ? 'Click the date and time at the bottom right of the screen, then Do not disturb.' :
    'Turn on Do Not Disturb in this device’s settings.';
  sheetModal('<h2>' + icon('moon') + 'Silence this device</h2><p>Calls, messages and pop-ups from other apps can interrupt the class. Turn on <b>Do Not Disturb</b> now. If it is not your device, ask a grown-up.</p>' +
    '<p class="jn-dnd-how">' + esc(how) + '</p><button type="button" class="jn-btn" data-mx>' + icon('check') + 'Done</button>', 'dnd');
}
/* Has the pupil left the page? (another tab or app, the window behind another one, or out of full screen) */
function isAway() {
  if (!P.locked) return false;
  if (document.visibilityState === 'hidden') return true;
  return AWAY.blurred && !(document.activeElement && document.activeElement.tagName === 'IFRAME');     // a game in a frame keeps focus inside
}
function awayCheck() {
  if (!P.locked) return;
  const away = isAway();
  if (away && !AWAY.on) {
    AWAY.on = true; AWAY.at = Date.now(); AWAY.marked = false; AWAY.sentOn = false;
    clearTimeout(AWAY.t);
    AWAY.t = setTimeout(() => { if (AWAY.on && isAway()) markAway(); }, 2000);
  } else if (!away && AWAY.on) {
    clearTimeout(AWAY.t);
    const ms = Date.now() - AWAY.at;
    AWAY.on = false;
    if (ms >= 2000) back(ms);              // a phone asleep never ran the 2-second timer: it counts on the way back
  }
}
function markAway() {
  AWAY.marked = true; AWAY.n += 1;
  if (Date.now() - AWAY.lastPair >= 10000) {        // one pair of messages every 10 seconds at most
    AWAY.lastPair = Date.now(); AWAY.sentOn = true;
    send({ t: 'away', on: true, n: AWAY.n, tot: AWAY.tot }).catch(() => { AWAY.sentOn = false; });
  }
}
function back(ms) {
  if (!AWAY.marked) { AWAY.n += 1; if (Date.now() - AWAY.lastPair >= 10000) { AWAY.lastPair = Date.now(); AWAY.sentOn = true; } }
  AWAY.tot += ms;
  if (AWAY.sentOn) send({ t: 'away', on: false, ms, n: AWAY.n, tot: AWAY.tot }).catch(() => { /* the next pair carries the count */ });
  AWAY.marked = false; AWAY.sentOn = false;
  toastOne('You left the class page. Your teacher can see this.', 'eye', true);
  if (fullOK() && !document.fullscreenElement) askFull();
}
['visibilitychange', 'pageshow'].forEach((ev) => document.addEventListener(ev, () => setTimeout(awayCheck, 30)));
window.addEventListener('blur', () => { AWAY.blurred = true; setTimeout(awayCheck, 60); });
window.addEventListener('focus', () => { AWAY.blurred = false; setTimeout(awayCheck, 30); });
document.addEventListener('fullscreenchange', () => { if (P.locked && !document.fullscreenElement && AWAY.fs) { AWAY.fs = false; askFull(); } });
/* While locked: links stay shut, and nothing can be selected, held for a menu or dragged away. */
document.addEventListener('click', (e) => {
  if (!P.locked) return;
  const a = e.target.closest('a[href], [data-j="ics"], [data-j="leave"]');
  if (!a) return;
  e.preventDefault(); e.stopPropagation();
  toastOne(a.dataset.j === 'leave' ? 'Your teacher has locked the class. Ask your teacher if you need to leave.' : 'Links are locked during class. Your teacher will unlock them later.', 'lock');
}, true);
['contextmenu', 'dragstart', 'selectstart'].forEach((ev) => document.addEventListener(ev, (e) => {
  if (P.locked && !e.target.closest('input, textarea, [contenteditable]')) e.preventDefault();
}, true));

/* ---------------- homework, with Add to my calendar ---------------- */
const dueWords = (hw) => { const d = new Date(hw.due + 'T12:00:00'); return isNaN(d) ? hw.due : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + (hw.dueTime ? ' at ' + hw.dueTime : ''); };
function hwCardHTML(hw, small) {
  return '<div class="jn-hwc' + (small ? ' small' : '') + '"><p class="jn-hw-k">' + icon('cal') + 'Homework' + (hw.subject ? ' · ' + esc(hw.subject) : '') + '</p><h2>' + esc(hw.title) + '</h2>' +
    (hw.details && !small ? '<p>' + esc(hw.details) + '</p>' : '') + '<p class="jn-due">Due ' + esc(dueWords(hw)) + '</p>' +
    (small ? '<button type="button" class="jn-btn ghost" data-j="hw">' + icon('cal') + 'Add to my calendar</button>' :
      (hw.link ? '<p><a class="jn-hwlink" href="' + esc(hw.link) + '" target="_blank" rel="noopener noreferrer">' + icon('link') + 'Open the link</a></p>' : '') +
      '<div class="jn-hw-b"><button type="button" class="jn-btn" data-j="ics">' + icon('cal') + 'Add to my calendar</button><a class="jn-btn ghost" data-j="gcal" target="_blank" rel="noopener noreferrer" href="' + esc(googleLink(hw)) + '">' + icon('cal') + 'Add to Google Calendar</a>' +
      '<button type="button" class="jn-read" data-j="say" data-say="' + esc('Homework. ' + hw.title + '. ' + hw.details + '. Due ' + dueWords(hw)) + '">' + icon('volume') + 'Read it to me</button></div><p class="jn-fine">On an iPhone, open the file and tap Add All. A reminder comes at 6 pm the evening before.</p>') + '</div>';
}
function openHomework() { const hw = P.st && P.st.hw; if (hw) sheetModal(hwCardHTML(hw, false), 'hw'); }
const ymd = (s) => s.replace(/-/g, '');
function nextDay(s) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
function googleLink(hw) {
  const title = (P.name ? P.name + ': ' : '') + (hw.subject ? hw.subject + ' homework: ' : 'Homework: ') + hw.title;
  const dates = hw.dueTime ? ymd(hw.due) + 'T' + hw.dueTime.replace(':', '') + '00/' + ymd(hw.due) + 'T' + hw.dueTime.replace(':', '') + '00' : ymd(hw.due) + '/' + nextDay(hw.due);
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + dates + '&details=' + encodeURIComponent((hw.details || '') + (hw.link ? '\n' + hw.link : ''));
}
/* A small calendar file, if the site's own calendar helper (ics.js) cannot load. */
function icsFallback(hw, name) {
  const escI = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const fold = (l) => { const out = []; let s = l; while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); } out.push(s); return out.join('\r\n'); };
  const now = new Date(), stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const title = (name ? name + ': ' : '') + (hw.subject ? hw.subject + ' homework: ' : 'Homework: ') + hw.title;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KS2 Lesson Engine//Homework//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:hw-' + hw.id + '@ks2-lesson-engine', 'DTSTAMP:' + stamp];
  if (hw.dueTime) { const t = hw.dueTime.replace(':', '') + '00'; lines.push('DTSTART:' + ymd(hw.due) + 'T' + t, 'DTEND:' + ymd(hw.due) + 'T' + t); }
  else lines.push('DTSTART;VALUE=DATE:' + ymd(hw.due), 'DTEND;VALUE=DATE:' + nextDay(hw.due));
  const mins = hw.dueTime ? Number(hw.dueTime.slice(0, 2)) * 60 + Number(hw.dueTime.slice(3)) + 360 : 360;     // 6 pm the evening before
  lines.push('SUMMARY:' + escI(title), 'DESCRIPTION:' + escI((hw.details || '') + (hw.link ? '\n' + hw.link : '')), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escI(title), 'TRIGGER:-PT' + mins + 'M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
async function addToCalendar() {
  const hw = P.st && P.st.hw;
  if (!hw) return;
  const name = 'Homework - ' + (hw.subject || 'class').replace(/[^\w ]+/g, '') + ' - ' + new Date(hw.due + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '.ics';
  let text = '', dl = null;
  try { const m = await import('../ics.js?v=cdc164df'); if (m.icsHomework) text = m.icsHomework(hw, { name: P.name }); if (m.downloadText) dl = m.downloadText; } catch (e) { /* the small one below */ }
  if (!text) text = icsFallback(hw, P.name);
  if (dl) { try { dl(text, name, 'text/calendar'); return; } catch (e) { /* the plain way */ } }
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/* ---------------- what the teacher sends to me only ---------------- */
function onPM(m) {
  const k = String(m.k || ''), text = str(m.text, 300);
  if (k === 'ack') { P.coming = true; paintDock(); toastOne('Your teacher is on the way!', 'hand', true); buzz([80, 50, 80]); chime(); }
  else if (k === 'lower') { P.hand = false; P.coming = false; paintDock(); }
  else if (k === 'praise') { toastOne(text || 'Well done!', 'star', true); ding(); buzz(60); }
  else if (k === 'note') { toastOne(text, 'chat', true); chime(); }
  else if (k === 'reply') {
    const q = str(m.q, 120), a = P.asks.slice().reverse().find((x) => !x.reply && (!q || x.text.slice(0, 120) === q)) || null;
    if (a) a.reply = text; else P.asks.push({ text: q || 'Your question', reply: text });
    paintDock(); toastOne('Your teacher answered: ' + text, 'chat', true); chime();
  } else if (k === 'sticker' && STICKERS[m.s]) showSticker(m.s);
}
function toastOne(text, ic, keep) {
  let box = $('#jn-toasts');
  if (!box) { box = document.createElement('div'); box.id = 'jn-toasts'; box.className = 'jn-toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('button');
  t.type = 'button'; t.className = 'jn-toast'; t.innerHTML = icon(ic || 'check') + '<span>' + esc(text) + '</span>';
  box.appendChild(t);
  const go = () => { t.classList.add('out'); setTimeout(() => t.remove(), 300); };
  t.addEventListener('click', go);
  setTimeout(go, keep ? 9000 : 4000);
  while (box.children.length > 3) box.firstElementChild.remove();
}
function showSticker(id) {
  const s = STICKERS[id];
  const o = document.createElement('div');
  o.className = 'jn-sticker'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'A sticker from your teacher: ' + s[0]);
  o.innerHTML = '<div class="jn-stk" style="--c:' + s[1] + '"><svg viewBox="0 0 200 200" aria-hidden="true"><g class="jn-rays">' + Array.from({ length: 12 }, (x, i) => '<path d="M100 100 L' + (100 + 95 * Math.cos(i * Math.PI / 6 - 0.13)).toFixed(1) + ' ' + (100 + 95 * Math.sin(i * Math.PI / 6 - 0.13)).toFixed(1) + ' L' + (100 + 95 * Math.cos(i * Math.PI / 6 + 0.13)).toFixed(1) + ' ' + (100 + 95 * Math.sin(i * Math.PI / 6 + 0.13)).toFixed(1) + 'z"/>').join('') + '</g>' +
    '<circle cx="100" cy="100" r="64" class="jn-stk-o"/><circle cx="100" cy="100" r="52" class="jn-stk-i"/><g transform="translate(70 70) scale(2.5)" class="jn-stk-g">' + (ICON[s[2]] || ICON.star) + '</g></svg>' +
    '<b>' + esc(s[0]) + '</b><span>A sticker from your teacher</span><button type="button" class="jn-btn">' + icon('check') + 'Thank you!</button></div>';
  document.body.appendChild(o);
  fanfare(); buzz([60, 40, 60, 40, 120]);
  o.addEventListener('click', (e) => { if (e.target.closest('button') || e.target === o) o.remove(); });
  setTimeout(() => { if (o.isConnected) o.remove(); }, 9000);
}
/* "Eyes on the board": every screen shows it until the teacher lets go. */
function showEyes(on) {
  let e = $('#jn-eyes');
  if (!on) { if (e) e.remove(); return; }
  if (e) return;
  e = document.createElement('div');
  e.id = 'jn-eyes'; e.className = 'jn-eyes'; e.setAttribute('role', 'alert');
  e.innerHTML = '<div class="jn-eyes-in"><svg viewBox="0 0 220 120" aria-hidden="true"><g class="jn-eye"><ellipse cx="60" cy="60" rx="48" ry="40" fill="#fff"/><circle cx="66" cy="62" r="20" fill="#1B2440"/><circle cx="72" cy="55" r="7" fill="#fff"/></g>' +
    '<g class="jn-eye"><ellipse cx="160" cy="60" rx="48" ry="40" fill="#fff"/><circle cx="166" cy="62" r="20" fill="#1B2440"/><circle cx="172" cy="55" r="7" fill="#fff"/></g></svg><b>Eyes on the board</b><span>Look up at your teacher</span></div>';
  document.body.appendChild(e);
  buzz([150]);
}

/* ---------------- taps ---------------- */
app.addEventListener('click', (e) => {
  const qa = e.target.closest('[data-qa]');
  if (qa && P.screen === 'in') { quizAnswer(Number(qa.dataset.qa), qa); return; }
  const sc = e.target.closest('[data-sc]');
  if (sc && P.screen === 'in') {
    const i = Number(sc.dataset.si), k = Number(sc.dataset.sc), S = P.sheet;
    if (!S) return;
    let a = S.ans[i];
    if (sc.dataset.multi) { a = Array.isArray(a) ? a.slice() : []; const at = a.indexOf(k); if (at >= 0) a.splice(at, 1); else a.push(k); a.sort(); }
    else a = k;
    $$('[data-si="' + i + '"][data-sc]').forEach((b) => { const on = Array.isArray(a) ? a.includes(Number(b.dataset.sc)) : a === Number(b.dataset.sc); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    setSheetAnswer(i, a);
    return;
  }
  const v = e.target.closest('[data-v]');
  if (v && P.screen === 'in') {
    const mo = P.st && P.st.mo, n = Number(v.dataset.v);
    if (mo && mo.kind === 'react' && n >= 3) { v.classList.remove('pop'); void v.offsetWidth; v.classList.add('pop'); }
    answer(n, v); return;
  }
  const c = e.target.closest('.jn-c');
  if (c && P.ink) { P.ink.set({ tool: 'pen', color: COLOURS[Number(c.dataset.c)] }); paintTools(); return; }
  const t = e.target.closest('.jn-t');
  if (t && P.ink) { const a = t.dataset.t; if (a === 'erase') P.ink.set({ tool: 'erase' }); else if (a === 'undo') P.ink.undo(); else P.ink.clear(); paintTools(); return; }
  const j = e.target.closest('[data-j]');
  if (!j) return;
  onJ(j, e);
});
function onJ(j, e) {
  const a = j.dataset.j;
  if (a === 'sendboard') {
    if (!P.ink || !P.ink.strokes.length) { status('Draw your answer first.'); return; }
    answer({ d: packStrokes(P.ink.strokes), a: 4 / 3 }, j);
  } else if (a === 'retry') { P.joinTries = 0; screen('joining', 'Joining…', 'Look at the board. You will be in in a moment.'); if (P.stop && P.stop.retry) P.stop.retry(); sayHello(); }
  else if (a === 'reconnect') { if (P.stop && P.stop.retry) P.stop.retry(); P.offAt = Date.now(); const b = $('.jn-net span'); if (b) b.textContent = 'Reconnecting…'; }
  else if (a === 'sound') { P.mute = !P.mute; store.set('ks2-live.mute', P.mute ? 1 : null); j.textContent = P.mute ? 'Sound: off' : 'Sound: on'; j.setAttribute('aria-pressed', String(!P.mute)); if (!P.mute) { soundReady(); chime(); } }
  else if (a === 'leave') { flushSheet(); send({ t: 'bye' }).catch(() => {}); stopAll(); store.set(meKey(), null); P.name = ''; screen('left', 'You have left the lesson', 'Scan the code again to come back.'); }
  else if (a === 'say') { if (!speak(j.dataset.say)) status('This device cannot read aloud.'); }
  else if (a === 'read') openRead();
  else if (a === 'handin') flushSheet(true);
  else if (a === 'draw') drawFor(Number(j.dataset.si));
  else if (a === 'hw') openHomework();
  else if (a === 'ics') addToCalendar();
  else if (a === 'gcal') { /* a real link: it opens Google Calendar in a new tab */ }
  if (e && a !== 'gcal' && j.tagName === 'A') e.preventDefault();
}
function onModalClick(e) {
  const m = e.currentTarget;
  if (e.target === m || e.target.closest('[data-mx]')) { closeModal(); return; }
  const rk = e.target.closest('[data-rk]');
  if (rk) {
    P.read[rk.dataset.rk] = rk.dataset.rv; saveRead();
    $$('[data-rk="' + rk.dataset.rk + '"]', m).forEach((b) => b.setAttribute('aria-pressed', String(b === rk)));
    return;
  }
  const ds = e.target.closest('[data-dsave]');
  if (ds) {
    if (!P.ink || !P.ink.strokes.length) { const b = $('.jn-sheetc', m); if (b && !$('.jn-msg', b)) b.insertAdjacentHTML('beforeend', '<p class="jn-msg err">Draw your answer first.</p>'); return; }
    const i = Number(ds.dataset.dsave);
    setSheetAnswer(i, { d: packStrokes(P.ink.strokes), a: 4 / 3 });
    closeModal();
    P.sig = ''; render();
    return;
  }
  const c = e.target.closest('.jn-c');
  if (c && P.ink) { P.ink.set({ tool: 'pen', color: COLOURS[Number(c.dataset.c)] }); paintTools(); return; }
  const t = e.target.closest('.jn-t');
  if (t && P.ink) { const a = t.dataset.t; if (a === 'erase') P.ink.set({ tool: 'erase' }); else if (a === 'undo') P.ink.undo(); else P.ink.clear(); paintTools(); return; }
  const j = e.target.closest('[data-j]');
  if (j) onJ(j, e);
}
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.id === 'jn-ans') {
    e.preventDefault();
    const vals = $$('[data-q]', f).map((x) => R.cleanText(x.value, 160));
    if (!vals.some(Boolean)) { status('Type your answer first.'); return; }
    answer(vals.length > 1 ? vals : vals[0], $('button[type="submit"]', f));
  } else if (f.id === 'jn-qtype') {
    e.preventDefault();
    const v = R.cleanText($('#jn-qt', f).value, 80);
    if (!v) { status('Type your answer first.'); return; }
    quizAnswer(v, $('button', f));
  } else if (f.id === 'jn-askf') {
    e.preventDefault();
    const text = R.cleanText($('#jn-askt', f).value, 200), msg = $('.jn-msg', f), btn = $('button[type="submit"]', f);
    if (!text) { msg.textContent = 'Type your question first.'; return; }
    if (P.asks.filter((a) => !a.reply).length >= 3) { msg.textContent = 'Wait for your teacher to answer your other questions first.'; return; }
    btn.disabled = true; msg.textContent = 'Sending…';
    try { await send({ t: 'ask', id: R.rid(5), text }); P.asks.push({ text, reply: '' }); closeModal(); toastOne('Sent. Only your teacher can see it.', 'chat'); }
    catch (er) { msg.textContent = sendError(er); btn.disabled = false; }
  }
});
/* Typed worksheet answers: kept as they are typed, sent in batches. */
document.addEventListener('input', (e) => {
  const ta = e.target.closest && e.target.closest('textarea[data-si]');
  if (!ta || !P.sheet) return;
  setSheetAnswer(Number(ta.dataset.si), R.cleanText(ta.value, 300));
});
document.addEventListener('focusout', (e) => { if (e.target.closest && e.target.closest('textarea[data-si]') && P.sheet && P.sheet.dirty.length) { clearTimeout(P.sheetT); P.sheetT = setTimeout(flushSheet, 2500); } });
window.addEventListener('pagehide', () => flushSheet());

/* ---------------- start ---------------- */
/* Any tap lets the chime play later (browsers only allow sound after the person has touched the page). */
app.addEventListener('pointerdown', soundReady, { passive: true });
async function start() {
  P.read = readPrefs(); applyRead();
  P.mute = !!store.get('ks2-live.mute');
  P.baseTitle = document.title;
  if (!window.crypto || !crypto.subtle) { screen('bad', 'This browser is too old', 'Open the link in an up-to-date browser, such as Chrome, Safari or Edge.'); return; }
  P.info = R.parseJoin(location.hash);
  if (!P.info) { codeScreen(location.hash.length > 1 ? 'That link is not complete. Type the code instead.' : ''); return; }
  const saved = store.get(meKey());
  if (saved && saved.pid && saved.name) { P.name = saved.name; join(saved.name); return; }
  nameScreen();
}
window.addEventListener('hashchange', () => { const i = R.parseJoin(location.hash); if (i && (!P.info || i.sid !== P.info.sid)) { stopAll(); P.info = i; P.v = 0; P.st = null; P.sig = ''; P.lastMo = ''; P.lastTk = ''; P.sent = new Map(); P.quiz = new Map(); P.blobs = new Map(); P.sheet = null; nameScreen(); } });
start();
initFractions();
