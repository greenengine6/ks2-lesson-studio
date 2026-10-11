/* The pupils' page (join/): join a live lesson from the QR code, the link in the chat, or the 6-digit code, then
   answer on your own device when the teacher asks: reactions, votes, typed answers, a mini whiteboard, talk and
   think time, and how the lesson felt. No sign-in and no account: a first name or nickname only, kept in this
   tab. Everything is locked so only the teacher's screen can read it (see relay.js). */
import * as R from './relay.js?v=7c13e055';
import { Ink, COLOURS, packStrokes } from '../draw.js?v=7c13e055';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = {
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 7"/>', send: '<path d="M4.5 11.8 20 4.5l-4.6 15.2-3.7-6.4z"/><path d="M11.7 13.3 20 4.5"/>', undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', eraser: '<path d="M8.5 20H20"/><path d="M5.2 15.2 14.4 6a2 2 0 0 1 2.8 0l2.8 2.8a2 2 0 0 1 0 2.8L12 19.6H8.6z"/><path d="M9.6 10.8l4.6 4.6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  talk: '<path d="M4.8 4h8.4a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H8.6l-3.2 3v-3h-.6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M15.2 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-.6v2.8l-3-2.8h-4a2 2 0 0 1-2-2v-2.8"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', star: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  ear: '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.5 3.6-2.5 6a2.5 2.5 0 0 1-5 0"/><path d="M10 9.5a2 2 0 0 1 4 0"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>'
};
const icon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || '') + '</svg>';
const REACTS = [['👍', 'Got it'], ['👌', 'Nearly'], ['👎', 'Not yet'], ['❤️', 'Love it'], ['😮', 'Wow'], ['👏', 'Clap']];
const FACES = [['😟', 'Lost'], ['😕', 'Tricky'], ['🙂', 'OK'], ['😀', 'Good'], ['🤩', 'Loved it']];
const app = $('#app');
const P = { info: null, screen: '', st: null, v: 0, pid: '', name: '', pair: null, myPub: '', key: null, allKey: null, relay: null, stop: null, status: 'off', joinT: 0, joinTries: 0, sent: new Map(), moAt: 0, ink: null, inkFor: '', tick: 0, script: '' };
const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: this visit only */ } }
};
const meKey = () => 'ks2-live.me.' + P.info.sid;

/* ---------------- the school relay's address lives in the main page's settings ---------------- */
async function schoolURL() {
  if (P.script) return P.script;
  try {
    const t = await (await fetch('../', { cache: 'no-store', credentials: 'omit' })).text();
    const m = /<script type="application\/json" id="config">([\s\S]*?)<\/script>/.exec(t);
    const c = m ? JSON.parse(m[1]) : {};
    P.script = R.SCRIPT.test(String(c.inbox || '')) ? c.inbox : '';
  } catch (e) { P.script = ''; }
  return P.script;
}
async function relayFor(tr) {
  if (tr === 's') { const u = await schoolURL(); if (u) return R.schoolRelay(u); }
  return R.publicRelay();
}

/* ---------------- screens ---------------- */
function frame(inner, o) {
  o = o || {};
  const title = (P.st && P.st.title) || o.title || 'Live lesson';
  app.innerHTML = '<header class="jn-top"><div class="jn-brand"><span class="jn-logo" aria-hidden="true">♥</span><span><b>' + esc(title) + '</b><small>KS2 Lesson Engine · live lesson</small></span></div>' +
    (P.name && o.me !== false ? '<span class="jn-me"><i class="jn-dot ' + (P.status === 'on' ? 'on' : 'off') + '" title="' + (P.status === 'on' ? 'Connected' : 'Reconnecting') + '"></i><span>' + esc(P.name) + '</span></span>' : '') + '</header>' +
    '<main class="jn-main">' + inner + '</main>' + (P.name && o.leave !== false ? '<footer class="jn-foot"><button type="button" class="jn-link" data-j="leave">Leave the lesson</button></footer>' : '');
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
  const ch = await R.codeChannel(code), key = await R.codeKey(code);
  const relays = [];
  if (await schoolURL()) relays.push(R.schoolRelay(P.script));
  relays.push(R.publicRelay());
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
  if (P.stop) P.stop();
  P.stop = P.relay.listen(R.channel(P.info.sid, 't'), onState, (s) => { if (s !== P.status) { P.status = s; const d = $('.jn-dot'); if (d) { d.className = 'jn-dot ' + (s === 'on' ? 'on' : 'off'); d.title = s === 'on' ? 'Connected' : 'Reconnecting'; } } });
  P.joinTries = 0;
  sayHello();
}
async function sayHello() {
  clearTimeout(P.joinT);
  if (P.screen !== 'joining' && P.screen !== 'locked') return;
  P.joinTries += 1;
  try { await send({ t: 'join', n: P.name }); } catch (e) { /* tried again below */ }
  if (P.joinTries < 8) P.joinT = setTimeout(sayHello, 5000 + P.joinTries * 1500);
  else if (P.screen === 'joining') screen('joining', 'Still joining…', 'Your teacher’s screen has not answered yet. Check the internet, or ask your teacher to open the join screen.', '<button type="button" class="jn-btn" data-j="retry">Try again</button>');
}
async function send(obj) {
  obj.p = P.pid;
  await R.post(P.relay, R.channel(P.info.sid, 'p'), await R.sealUp(P.key, P.myPub, obj));
}
function stopAll() { clearTimeout(P.joinT); clearInterval(P.tick); if (P.stop) { P.stop(); P.stop = null; } }

/* ---------------- what the teacher's screen says ---------------- */
const glue = R.joiner();
async function onState(text) {
  const env = glue(text);
  if (!env) return;
  const st = await R.openAll(P.allKey, env);
  if (!st || st.t !== 'st' || typeof st.v !== 'number') return;
  if (st.end) { stopAll(); store.set(meKey(), null); P.st = Object.assign({}, P.st || {}, { title: st.title || (P.st && P.st.title) }); screen('ended', 'The lesson has ended', 'Well done today! You can close this page.'); return; }
  if (st.v <= P.v) return;
  P.v = st.v; P.st = st;
  if (Array.isArray(st.kick) && st.kick.includes(P.pid)) { stopAll(); store.set(meKey(), null); screen('removed', 'You have left this lesson', 'Your teacher has taken you out of this live lesson.'); return; }
  const inLesson = Array.isArray(st.seen) && st.seen.includes(P.pid);
  if (!inLesson) {
    if (st.lock) screen('locked', 'The lesson is locked', 'Your teacher has stopped new people joining. Ask your teacher to unlock it.');
    else if (P.screen === 'joining' && P.joinTries > 2) { clearTimeout(P.joinT); sayHello(); }
    return;
  }
  clearTimeout(P.joinT);
  if (st.mo && st.mo.left) P.moAt = Date.now() + st.mo.left * 1000; else P.moAt = 0;
  // Only redraw when the moment itself changes, so a pupil typing or drawing never loses their work when someone
  // else joins.
  const sig = st.mo ? [st.mo.id, st.mo.kind, JSON.stringify(st.mo.rv || null), st.title || ''].join('|') : 'wait|' + (st.title || '');
  if (P.screen === 'in' && sig === P.sig) {
    clearInterval(P.tick);
    if (P.moAt) { paintTime(); P.tick = setInterval(paintTime, 500); } else { const t = $('.jn-time'); if (t) t.hidden = true; }
    return;
  }
  P.sig = sig;
  render();
}

/* ---------------- the current moment ---------------- */
const MO_TITLE = { react: 'How are you getting on?', vote: 'Vote', chat: 'Your answer', waterfall: 'Your answer', show: 'Show me', talk: 'Talk time', think: 'Think time', listen: 'Listen', move: 'Move', ticket: 'How did today’s lesson feel?' };
function render() {
  P.screen = 'in';
  const mo = P.st && P.st.mo;
  clearInterval(P.tick);
  if (!mo) {
    P.inkFor = '';
    frame('<section class="jn-card jn-center jn-wait"><div class="jn-bubble" aria-hidden="true">✓</div><h1>You’re in, ' + esc(P.name) + '!</h1><p>Look at the board. When your teacher asks a question, it appears here.</p></section>');
    return;
  }
  const mine = P.sent.get(mo.id), rv = mo.rv;
  let body = '';
  if (mo.kind === 'react') body = '<div class="jn-rx">' + REACTS.slice(0, 3).map(([e, n], i) => '<button type="button" class="jn-big' + (mine && mine.v === i ? ' on' : '') + '" data-v="' + i + '"><span>' + e + '</span><b>' + n + '</b></button>').join('') + '</div>' +
    '<div class="jn-fun">' + REACTS.slice(3).map(([e, n], j) => '<button type="button" data-v="' + (j + 3) + '" aria-label="' + n + '">' + e + '</button>').join('') + '</div>';
  else if (mo.kind === 'ticket') body = '<div class="jn-faces">' + FACES.map(([e, n], i) => '<button type="button" class="jn-big' + (mine && mine.v === i ? ' on' : '') + '" data-v="' + i + '"><span>' + e + '</span><b>' + n + '</b></button>').join('') + '</div>';
  else if (mo.kind === 'vote') {
    const opts = Array.isArray(mo.opts) && mo.opts.length ? mo.opts : ['A', 'B', 'C', 'D'];
    const right = rv && Number.isInteger(rv.right) ? rv.right : -1;
    body = '<div class="jn-votes">' + opts.map((o, i) => '<button type="button" class="jn-vote' + (mine && mine.v === i ? ' on' : '') + (right === i ? ' right' : '') + '" data-v="' + i + '"' + (right >= 0 ? ' disabled' : '') + '><b>' + 'ABCDEF'[i] + '</b><span>' + esc(o === 'ABCDEF'[i] ? 'Option ' + o : o) + '</span></button>').join('') + '</div>' +
      (right >= 0 && mine ? '<p class="jn-res ' + (mine.v === right ? 'ok' : '') + '">' + (mine.v === right ? 'Yes! You got it right.' : 'The answer was ' + 'ABCDEF'[right] + '. Have a look at the board.') + '</p>' : '');
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
    const say = { talk: ['talk', 'Talk to your partner about the question on the board.', 'We are ready to share'], think: ['bulb', 'Think quietly first. No hands up yet.', 'I have an idea'], listen: ['ear', 'Close your eyes and listen.', ''], move: ['bolt', 'Stand up and get moving!', ''] }[mo.kind] || ['star', 'Look at the board.', ''];
    body = '<div class="jn-say">' + icon(say[0]) + '<p>' + esc(say[1]) + '</p></div>' + (say[2] ? '<button type="button" class="jn-btn' + (mine ? ' done' : '') + '" data-v="1">' + icon('check') + esc(mine ? 'Sent: ' + say[2].toLowerCase() : say[2]) + '</button>' : '');
  }
  const q = mo.q && !['react', 'ticket'].includes(mo.kind) ? '<p class="jn-q">' + esc(mo.q) + '</p>' : '';
  frame('<section class="jn-card jn-mo" data-kind="' + esc(mo.kind) + '"><div class="jn-mo-top"><h1>' + esc(MO_TITLE[mo.kind] || 'Your turn') + '</h1><span class="jn-time" hidden>' + icon('clock') + '<b></b></span></div>' + q + body +
    '<p class="jn-st" role="status">' + (mine ? icon('check') + 'Sent. Your teacher can see it.' : '') + '</p></section>');
  if (mo.kind === 'show') board(mo.id);
  if (P.moAt) { paintTime(); P.tick = setInterval(paintTime, 500); }
}
function paintTime() {
  const t = $('.jn-time');
  if (!t) return;
  const left = Math.max(0, Math.round((P.moAt - Date.now()) / 1000));
  t.hidden = false;
  $('b', t).textContent = left ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : 'Time’s up';
  t.classList.toggle('low', left <= 5);
  if (!left) clearInterval(P.tick);
}
function board(id) {
  const host = $('#jn-board');
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
    await send({ t: 'ans', m: mo.id, k: mo.kind, v });
    P.sent.set(mo.id, { v, n: had.n + 1 });
    if (mo.kind !== 'show') render(); else status(icon('check') + 'Sent. Your teacher can see it.', true);
  } catch (e) {
    status(e && e.code === 'busy' ? 'Lots of answers at once. Wait a few seconds and tap again.' : 'It did not send. Check the internet and tap again.');
  } finally { if (btn) btn.disabled = false; }
}
function status(t, html) { const s = $('.jn-st'); if (s) { if (html) s.innerHTML = t; else s.textContent = t; } }

/* ---------------- taps ---------------- */
app.addEventListener('click', (e) => {
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
  const a = j.dataset.j;
  if (a === 'sendboard') {
    if (!P.ink || !P.ink.strokes.length) { status('Draw your answer first.'); return; }
    answer({ d: packStrokes(P.ink.strokes), a: 4 / 3 }, j);
  } else if (a === 'retry') { P.joinTries = 0; screen('joining', 'Joining…', 'Look at the board. You will be in in a moment.'); sayHello(); }
  else if (a === 'leave') { send({ t: 'bye' }).catch(() => {}); stopAll(); store.set(meKey(), null); P.name = ''; screen('left', 'You have left the lesson', 'Scan the code again to come back.'); }
});
app.addEventListener('submit', (e) => {
  if (e.target.id !== 'jn-ans') return;
  e.preventDefault();
  const vals = $$('[data-q]', e.target).map((x) => R.cleanText(x.value, 160));
  if (!vals.some(Boolean)) { status('Type your answer first.'); return; }
  answer(vals.length > 1 ? vals : vals[0], $('button[type="submit"]', e.target));
});

/* ---------------- start ---------------- */
async function start() {
  if (!window.crypto || !crypto.subtle) { screen('bad', 'This browser is too old', 'Open the link in an up-to-date browser, such as Chrome, Safari or Edge.'); return; }
  P.info = R.parseJoin(location.hash);
  if (!P.info) { codeScreen(location.hash.length > 1 ? 'That link is not complete. Type the code instead.' : ''); return; }
  const saved = store.get(meKey());
  if (saved && saved.pid && saved.name) { P.name = saved.name; join(saved.name); return; }
  nameScreen();
}
window.addEventListener('hashchange', () => { const i = R.parseJoin(location.hash); if (i && (!P.info || i.sid !== P.info.sid)) { stopAll(); P.info = i; P.v = 0; P.st = null; P.sent = new Map(); nameScreen(); } });
start();
