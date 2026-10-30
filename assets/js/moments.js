/* Class moments. Every "how pupils respond" pill on a class screen (Use a reaction, Hold your work up to the camera,
   Vote, Type it in the chat, Talk, Think…) is a button: it opens the moment on the shared screen with a clear
   instruction, a timer and the answers.
   - In a live lesson (Join), answers come from pupils' own devices: reactions float up the screen, votes fill bars,
     typed answers and mini whiteboards wait face down until the teacher reveals them all at once.
   - Without a live lesson, the teacher taps to count hands, reactions or fingers, and the 3-2-1 countdown runs the
     chat waterfall and the "hold it up" moment. */
import { $, $$, esc, icon, prefs, normAnswer } from './core.js?v=49509700';
import { sfx } from './fx/audio.js?v=49509700';
import { Live, onLive, setMoment, updateMoment, endMoment, answersFor, pupilsIn, nameOf } from './live/session.js?v=49509700';
import { openJoin } from './live/panel.js?v=49509700';
import { strokesSVG, unpackStrokes } from './draw.js?v=49509700';
import { REACTIONS, reactSVG } from './live/shapes.js?v=49509700';

/* Reactions: [id, label] (drawn by live/shapes.js reactSVG, the same pictures as on pupils' devices). */
export const REACTS = REACTIONS.map((r) => [r[0], r[1]]);
export const MOMENTS = {
  react: { name: 'Reactions', icon: 'thumb', secs: 20, live: true },
  vote: { name: 'Vote', icon: 'vote', secs: 30, live: true },
  chat: { name: 'Answers', icon: 'chat', secs: 60, live: true },
  waterfall: { name: 'Chat waterfall', icon: 'chat', secs: 45, live: true },
  show: { name: 'Show me', icon: 'eye', secs: 90, live: true },
  talk: { name: 'Talk time', icon: 'debate', secs: 60, live: true },
  think: { name: 'Think time', icon: 'bulb', secs: 30, live: true },
  listen: { name: 'Listen', icon: 'sound', secs: 60, live: false },
  move: { name: 'Move', icon: 'bolt', secs: 30, live: false },
  cloud: { name: 'Word cloud', icon: 'chat', secs: 60, live: true },
  traffic: { name: 'Traffic light', icon: 'target', secs: 30, live: true }
};
export const TRAFFIC = [['Stuck', '#D9534A'], ['Nearly', '#E5A21A'], ['Got it', '#2E9E6B']];
const READY = { talk: 'Pairs ready to share', think: 'Pupils with an idea', listen: '', move: '' };
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
export const presentRoot = () => document.fullscreenElement || $('.present:not([hidden])') || $('.spresent:not([hidden])') || null;

let M = null;

/* Does a pupil's answer match the expected one? Same words, the same number, or the short answer inside theirs. */
export function matches(expected, given) {
  const A = normAnswer(expected), G = normAnswer(given);
  if (!A || !G) return false;
  if (A === G) return true;
  const num = (s) => { const t = s.replace(/[^0-9.-]/g, ''); return t && /\d/.test(t) ? Number(t) : NaN; };
  if (/^-?[\d.]+$/.test(A.replace(/[^0-9.-]/g, '')) && /\d/.test(A) && num(A) === num(G)) return true;
  return A.length >= 2 && A.length <= 24 && G.includes(A);
}

/* What a moment sends to pupils' devices: the same for a pill tapped on the board (openMoment) and for the slide's
   question going out by itself (presentkit.js), so tapping the pill opens the question pupils already have. */
const qsOf = (o) => (Array.isArray(o.qs) ? o.qs.filter((x) => x && x.q).slice(0, 5) : []);
const optsOf = (kind, o) => (Array.isArray(o.opts) && o.opts.length >= 2 ? o.opts.slice(0, 6) : (kind === 'vote' ? ['A', 'B', 'C', 'D'] : null));
export function liveSpec(kind, o) {
  const def = MOMENTS[kind];
  if (!def) return null;
  const qs = qsOf(o);
  // ans: what a right answer looks like, for marking in the class view. It stays on the teacher's screen.
  const ans = kind === 'vote' && Number.isInteger(o.answer) ? { right: o.answer } : qs.length && qs.some((x) => x.a) ? { qs: qs.map((x) => String(x.a || '')) } : o.a ? { texts: [String(o.a)] } : null;
  const opts = kind === 'vote' ? optsOf(kind, o) : kind === 'traffic' && Array.isArray(o.opts) && o.opts.length === 3 ? o.opts.slice(0, 3) : null;
  return Object.assign({ kind, q: o.q || o.title || def.name, opts, qs: qs.length ? qs.map((x) => x.q) : null, live: def.live }, ans ? { ans } : {});
}

/* ---------------- opening and closing ---------------- */
/* o: { kind, label, title, q, opts, answer, qs: [{ q, a }], host } */
export function openMoment(o) {
  closeMoment();
  const def = MOMENTS[o.kind] || MOMENTS.react, kind = MOMENTS[o.kind] ? o.kind : 'react';
  const host = o.host || presentRoot() || document.body;
  const qs = qsOf(o), opts = optsOf(kind, o);
  M = { kind, def, o, host, qs, opts, id: '', manual: kind === 'vote' ? opts.map(() => 0) : [0, 0, 0, 0, 0, 0], log: [], left: def.secs, total: def.secs, paused: false, t: 0, revealed: false, big: '', count: 0, cd: 0 };
  const ov = document.createElement('div');
  ov.className = 'mo' + (host === document.body ? ' fixed' : '');
  ov.dataset.kind = kind;
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', def.name);
  ov.innerHTML = '<div class="mo-card"><header class="mo-top"><span class="mo-k">' + icon(def.icon) + esc(def.name) + '</span><span class="mo-live"></span><button type="button" class="pbtn" data-mo="x" aria-label="Close">' + icon('close') + '</button></header>' +
    '<h2 class="mo-q"></h2><p class="mo-say"></p><div class="mo-body"></div><div class="mo-fx" aria-hidden="true"></div>' +
    '<footer class="mo-foot"><div class="mo-timer" role="timer"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="trk" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5" pathLength="100"/></svg><b></b></div>' +
    '<button type="button" class="pbtn" data-mo="more" title="30 seconds more">+30s</button><button type="button" class="pbtn" data-mo="pause" aria-pressed="false">' + icon('pause') + '<span>Pause</span></button>' +
    '<span class="mo-sp"></span><span class="mo-count" aria-live="polite"></span><button type="button" class="pbtn" data-mo="join">' + icon('qr') + '<span>Pupils join</span></button><button type="button" class="pbtn" data-mo="cv" hidden>' + icon('vote') + '<span>Class view</span></button>' +
    '<button type="button" class="pbtn" data-mo="undo" hidden>' + icon('refresh') + '<span>Undo</span></button><button type="button" class="btn" data-mo="reveal" hidden>' + icon('eye') + 'Reveal</button><button type="button" class="btn primary" data-mo="done">' + icon('check') + 'Done</button></footer></div>';
  host.appendChild(ov);
  M.el = ov;
  $('.mo-q', ov).textContent = o.q || o.title || def.name;
  $('.mo-say', ov).innerHTML = o.label ? icon(def.icon) + '<span>' + esc(o.label) + '</span>' : '';
  ov.addEventListener('click', onClick);
  M.keyH = onKey;
  document.addEventListener('keydown', M.keyH, true);
  M.unsub = onLive(onLiveChange);
  goLive();
  M.t = setInterval(tick, 1000);
  paint(); paintTimer();
  sfx('pop', 3);
  setTimeout(() => { const b = M && $('[data-mo="done"]', M.el); if (b) b.focus(); }, 60);
}
export function closeMoment() {
  if (!M) return;
  clearInterval(M.t); clearInterval(M.cd);
  if (M.unsub) M.unsub();
  document.removeEventListener('keydown', M.keyH, true);
  if (M.id) endMoment(M.id);
  M.el.remove(); M = null;
}
export const momentOpen = () => !!M;
function goLive() {
  if (!M || M.id || !Live.on || !M.def.live) return;
  M.id = setMoment(Object.assign(liveSpec(M.kind, M.o), { secs: M.left }));
}
function onLiveChange(what) {
  if (!M) return;
  if (what === 'start') { goLive(); paint(); return; }
  if (what === 'end') { M.id = ''; paint(); return; }
  if (what && what.ans && what.ans === M.id) {
    if (M.kind === 'react') float(REACTS[what.v] ? what.v : 0);
    if (M.kind === 'cloud') sfx('pop', 4);
    sfx('pop', 2);
    paint();
    return;
  }
  if (what === 'pupils' || what === 'status') paint();
}

/* ---------------- the timer ---------------- */
function tick() {
  if (!M || M.paused) return;
  if (M.left > 0) {
    M.left -= 1;
    if (M.left === 0) { sfx('chime'); M.el.classList.add('timeup'); }
  }
  paintTimer();
}
function paintTimer() {
  if (!M) return;
  const t = $('.mo-timer', M.el);
  $('b', t).textContent = M.left > 0 ? fmt(M.left) : 'Time’s up';
  $('.arc', t).style.strokeDashoffset = String(100 - (M.total ? (M.left / M.total) * 100 : 0));
  t.classList.toggle('low', M.left > 0 && M.left <= 5);
  const p = $('[data-mo="pause"]', M.el);
  p.setAttribute('aria-pressed', String(M.paused));
  p.innerHTML = icon(M.paused ? 'play' : 'pause') + '<span>' + (M.paused ? 'Resume' : 'Pause') + '</span>';
}

/* ---------------- painting the answers ---------------- */
const live = () => !!(M && M.id && Live.on);
function liveCounts(n) {
  const out = new Array(n).fill(0);
  if (!live()) return out;
  answersFor(M.id).forEach((a) => { if (typeof a.v === 'number' && a.v < n) out[a.v] += 1; });
  return out;
}
function paint() {
  if (!M) return;
  const el = M.el, body = $('.mo-body', el), joined = pupilsIn().length;
  const box = live() ? answersFor(M.id) : new Map();
  M.count = box.size;
  $('.mo-live', el).innerHTML = Live.on ? '<i></i>Live · ' + joined + ' joined' : '';
  $('[data-mo="join"]', el).hidden = Live.on && joined > 0;
  $('[data-mo="cv"]', el).hidden = !Live.on;
  $('[data-mo="join"] span', el).textContent = Live.on ? 'Show the join code' : 'Pupils join';
  const canReveal = ['vote', 'chat', 'waterfall', 'show', 'cloud'].includes(M.kind) && (live() || M.kind === 'vote');
  $('[data-mo="reveal"]', el).hidden = !canReveal || M.revealed;
  $('[data-mo="undo"]', el).hidden = !M.log.length;
  $('.mo-count', el).textContent = live() ? box.size + ' of ' + joined + ' answered' : (['react', 'vote'].includes(M.kind) ? 'Tap to count each answer' : '');
  el.classList.toggle('revealed', M.revealed);
  if (M.kind === 'react') body.innerHTML = reactHTML();
  else if (M.kind === 'vote') body.innerHTML = voteHTML();
  else if (M.kind === 'chat' || M.kind === 'waterfall') body.innerHTML = live() ? wallHTML(box) : waterfallHTML();
  else if (M.kind === 'show') body.innerHTML = live() ? boardsHTML(box) : holdHTML();
  else if (M.kind === 'cloud') body.innerHTML = cloudHTML(box);
  else if (M.kind === 'traffic') body.innerHTML = trafficHTML();
  else body.innerHTML = timeHTML(box);
}
function reactHTML() {
  const lc = liveCounts(6);
  const big = REACTS.slice(0, 3).map(([e, n], i) => '<button type="button" class="mo-rx" data-rx="' + i + '"><span class="mo-emo">' + reactSVG(i, 'mo-rsvg') + '</span><b>' + (M.manual[i] + lc[i]) + '</b><small>' + n + '</small></button>').join('');
  const fun = REACTS.slice(3).map(([e, n], j) => '<button type="button" class="mo-fun" data-rx="' + (j + 3) + '" aria-label="' + n + '" title="' + n + '"><span>' + reactSVG(j + 3, 'mo-rsvg') + '</span><b>' + (M.manual[j + 3] + lc[j + 3]) + '</b></button>').join('');
  return '<div class="mo-rxs">' + big + '</div><div class="mo-funs">' + fun + '</div>';
}
function voteHTML() {
  const lc = liveCounts(M.opts.length), counts = M.opts.map((x, i) => M.manual[i] + lc[i]), total = counts.reduce((a, b) => a + b, 0), max = Math.max(1, ...counts);
  const hide = live() && !M.revealed, right = M.revealed && Number.isInteger(M.o.answer) ? M.o.answer : -1;
  return '<div class="mo-votes">' + M.opts.map((o, i) => '<button type="button" class="mo-vote' + (right === i ? ' right' : right >= 0 ? ' dim' : '') + '" data-vote="' + i + '"><b class="mo-l">' + 'ABCDEF'[i] + '</b><span class="mo-vt">' + esc(o === 'ABCDEF'[i] ? 'Option ' + o : o) + '</span>' +
    '<span class="mo-bar"><i style="width:' + (hide ? 0 : Math.round((counts[i] / max) * 100)) + '%"></i></span><em>' + (hide ? '' : counts[i]) + '</em></button>').join('') + '</div>' +
    (hide ? '<p class="mo-note">' + icon('eye') + '<span>' + total + (total === 1 ? ' vote' : ' votes') + ' so far. The bars stay hidden until you press Reveal.</span></p>' : '');
}
function waterfallHTML() {
  const online = prefs.mode === 'online';
  return '<div class="mo-wf"><p class="mo-big">' + (online ? 'Type your answer in the chat, but don’t press Enter yet!' : 'Write your answer on your whiteboard. Keep it hidden!') + '</p>' +
    '<button type="button" class="mo-go" data-mo="go">' + (M.goText || '3, 2, 1… Go!') + '</button><p class="fine">' + (online ? 'On “Go!”, everyone presses Enter at once.' : 'On “Go!”, everyone shows their whiteboard at once.') + '</p></div>';
}
function holdHTML() {
  const online = prefs.mode === 'online';
  return '<div class="mo-wf"><p class="mo-big">' + icon(online ? 'eye' : 'board') + '<span>' + (online ? 'Get your work ready to hold up to the camera.' : 'Get your whiteboard ready to show me.') + '</span></p>' +
    '<button type="button" class="mo-go" data-mo="go">' + (M.goText || '3, 2, 1… Hold it up!') + '</button><p class="fine">Or start a live lesson so pupils draw on their own device and send it to this screen.</p></div>';
}
function answerList(v) { return Array.isArray(v) ? v : [v]; }
function wallHTML(box) {
  const pupils = pupilsIn(), qs = M.qs.filter((x) => x.a && String(x.a).length <= 40);
  let summary = '';
  if (M.revealed && qs.length && box.size) {
    summary = '<div class="mo-sum">' + M.qs.map((x, qi) => {
      if (!x.a) return '';
      let ok = 0;
      box.forEach((a) => { if (matches(x.a, answerList(a.v)[qi])) ok += 1; });
      return '<span><b>Q' + (qi + 1) + '</b> ' + ok + ' of ' + box.size + ' match “' + esc(x.a) + '”</span>';
    }).join('') + '</div>';
  }
  const cards = pupils.map((p) => {
    const a = box.get(p.pid);
    if (!a) return '<li class="mo-card-a wait"><b>' + esc(p.name) + '</b><span>Thinking…</span></li>';
    const list = answerList(a.v);
    return '<li class="mo-card-a' + (M.revealed ? ' open' : '') + '"><b>' + esc(p.name) + '</b>' + (M.revealed ? '<ol>' + list.map((x, qi) => '<li class="' + (M.qs[qi] && M.qs[qi].a && matches(M.qs[qi].a, x) ? 'ok' : '') + '">' + esc(x || '—') + '</li>').join('') + '</ol>' : '<span class="mo-hid">' + icon('eye') + 'Ready</span>') + '</li>';
  }).join('');
  return (M.qs.length ? '<ol class="mo-qs">' + M.qs.map((x) => '<li>' + esc(x.q) + '</li>').join('') + '</ol>' : '') + summary +
    (pupils.length ? '<ul class="mo-wall">' + cards + '</ul>' : '<p class="mo-note">' + icon('qr') + '<span>Nobody has joined yet. Press “Show the join code”.</span></p>');
}
function boardsHTML(box) {
  const pupils = pupilsIn();
  if (M.big) {
    const a = box.get(M.big);
    if (a && a.v && M.revealed) return '<div class="mo-zoom"><figure>' + strokesSVG(unpackStrokes(a.v.d), a.v.a, nameOf(M.big) + '’s board') + '<figcaption>' + esc(nameOf(M.big)) + '</figcaption></figure><button type="button" class="btn" data-mo="unzoom">' + icon('left') + 'All boards</button></div>';
    M.big = '';
  }
  if (!pupils.length) return '<p class="mo-note">' + icon('qr') + '<span>Nobody has joined yet. Press “Show the join code”, then pupils draw on their own device.</span></p>';
  return '<ul class="mo-boards">' + pupils.map((p) => {
    const a = box.get(p.pid);
    if (!a || !a.v) return '<li class="wait"><div class="mo-tile"><span>Drawing…</span></div><b>' + esc(p.name) + '</b></li>';
    return '<li><button type="button" class="mo-tile' + (M.revealed ? ' open' : '') + '" data-zoom="' + esc(p.pid) + '"' + (M.revealed ? '' : ' disabled') + '>' + (M.revealed ? strokesSVG(unpackStrokes(a.v.d), a.v.a, p.name + '’s board') : '<span>' + icon('check') + 'Sent</span>') + '</button><b>' + esc(p.name) + '</b></li>';
  }).join('') + '</ul>';
}
/* A word cloud: one word from each pupil, bigger the more pupils chose it. Names never show. */
const CLOUD_COLOURS = ['#4F46E5', '#C7356F', '#1F7A75', '#C2581A', '#8B44C2', '#2B76C6', '#2E7D4F', '#B42318'];
function cloudHTML(box) {
  if (!live()) return '<div class="mo-wf"><p class="mo-big">' + icon('chat') + '<span>' + (prefs.mode === 'online' ? 'Type one word in the chat.' : 'Think of one word. Get ready to say it.') + '</span></p><p class="fine">Start a live lesson so each pupil sends one word from their own device and the cloud builds here by itself.</p></div>';
  const count = new Map();
  box.forEach((a) => { const w = String(a.v || '').trim().toLowerCase(); if (w) count.set(w, (count.get(w) || 0) + 1); });
  if (!count.size) return '<p class="mo-note">' + icon('chat') + '<span>Waiting for the first words…</span></p>';
  const words = Array.from(count.entries()).sort((a, b) => b[1] - a[1]).slice(0, 40), max = words[0][1];
  const hide = M.hideCloud && !M.revealed;
  return '<div class="mo-cloud' + (hide ? ' hidden-words' : '') + '" aria-label="Word cloud">' + words.map(([w, n], i) => {
    const size = 1 + (n / max) * 2.2;
    return '<span style="--s:' + size.toFixed(2) + ';--c:' + CLOUD_COLOURS[i % CLOUD_COLOURS.length] + ';--r:' + (((i * 37) % 11) - 5) + 'deg" title="' + n + (n === 1 ? ' pupil' : ' pupils') + '">' + esc(w) + (n > 1 ? '<sup>' + n + '</sup>' : '') + '</span>';
  }).join('') + '</div>';
}
function trafficHTML() {
  const lc = liveCounts(3), labels = Array.isArray(M.o.opts) && M.o.opts.length === 3 ? M.o.opts : TRAFFIC.map((x) => x[0]);
  return '<div class="mo-lights">' + TRAFFIC.map((t, i) => '<button type="button" class="mo-light" data-rx="' + i + '" style="--c:' + t[1] + '"><span class="mo-lamp"></span><b>' + (M.manual[i] + lc[i]) + '</b><small>' + esc(labels[i]) + '</small></button>').join('') + '</div>';
}
function timeHTML(box) {
  const say = { talk: prefs.mode === 'online' ? 'Unmute and share with your partner, or talk in your breakout room.' : 'Turn and talk to your partner.', think: 'Think quietly first. No hands up yet.', listen: 'Close your eyes and listen.', move: prefs.mode === 'online' ? 'Stand up if you can!' : 'Stand up behind your chair!' }[M.kind] || '';
  const n = live() ? box.size : 0;
  return '<div class="mo-wf"><p class="mo-big">' + esc(say) + '</p>' + (live() && READY[M.kind] ? '<p class="mo-ready"><b>' + n + '</b><span>' + esc(READY[M.kind]) + '</span></p>' : '') + '</div>';
}

/* ---------------- floating reactions ---------------- */
function float(i) {
  if (!M) return;
  const fx = $('.mo-fx', M.el), s = document.createElement('span');
  s.innerHTML = reactSVG(Number(i) || 0, 'mo-rsvg');
  s.style.left = (8 + Math.random() * 84) + '%';
  s.style.setProperty('--d', (2.2 + Math.random() * 1.2).toFixed(2) + 's');
  s.style.setProperty('--x', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
  fx.appendChild(s);
  setTimeout(() => s.remove(), 3600);
}

/* ---------------- the teacher's buttons ---------------- */
function countdown(after) {
  if (!M) return;
  clearInterval(M.cd);
  let n = 3;
  const go = $('[data-mo="go"]', M.el);
  if (go) go.disabled = true;
  const show = (t) => { const b = M && $('[data-mo="go"]', M.el); if (b) { b.textContent = t; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } };
  show('3'); sfx('pop', 1);
  M.cd = setInterval(() => {
    if (!M) return;
    n -= 1;
    if (n > 0) { show(String(n)); sfx('pop', n); return; }
    clearInterval(M.cd);
    M.goText = after; show(after); sfx('success');
    const b = $('[data-mo="go"]', M.el); if (b) b.disabled = false;
    if (M.kind === 'show') { M.left = M.total = 10; M.paused = false; M.el.classList.remove('timeup'); paintTimer(); }
  }, 900);
}
function onClick(e) {
  if (!M) return;
  const rx = e.target.closest('[data-rx]');
  if (rx) { const i = Number(rx.dataset.rx); M.manual[i] += 1; M.log.push(i); if (M.kind === 'react') float(i); sfx('pop', i % 5); paint(); return; }
  const v = e.target.closest('[data-vote]');
  if (v) { if (live() && !M.revealed) return; const i = Number(v.dataset.vote); M.manual[i] += 1; M.log.push(i); sfx('pop', i); paint(); return; }
  const z = e.target.closest('[data-zoom]');
  if (z) { M.big = z.dataset.zoom; paint(); return; }
  const b = e.target.closest('[data-mo]');
  if (!b) return;
  const a = b.dataset.mo;
  if (a === 'x' || a === 'done') closeMoment();
  else if (a === 'more') { M.left += 30; M.total = Math.max(M.total, M.left); M.el.classList.remove('timeup'); paintTimer(); if (M.id) updateMoment({ secs: M.left }); }
  else if (a === 'pause') { M.paused = !M.paused; paintTimer(); }
  else if (a === 'undo') { const i = M.log.pop(); if (i != null && M.manual[i] > 0) M.manual[i] -= 1; paint(); }
  else if (a === 'reveal') { M.revealed = true; sfx('success'); if (M.id) updateMoment({ rv: M.kind === 'vote' && Number.isInteger(M.o.answer) ? { right: M.o.answer } : { all: 1 } }); paint(); }
  else if (a === 'unzoom') { M.big = ''; paint(); }
  else if (a === 'join') openJoin(M.host === document.body ? (presentRoot() || document.body) : M.host, M.o.lesson || M.o.title || '');
  else if (a === 'cv') import('./live/classview.js?v=49509700').then((m) => m.openClassView({ host: M ? (M.host === document.body ? (presentRoot() || document.body) : M.host) : document.body })).catch(() => {});
  else if (a === 'go') countdown(M.kind === 'show' ? (prefs.mode === 'online' ? 'Hold it up to the camera!' : 'Show me!') : 'Go! Press Enter!');
}
function onKey(e) {
  if (!M) return;
  if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return;
  const k = e.key;
  if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMoment(); }
  else if (k === ' ') { e.preventDefault(); e.stopPropagation(); M.paused = !M.paused; paintTimer(); }
  else if ((k === 'r' || k === 'R') && !$('[data-mo="reveal"]', M.el).hidden) { e.preventDefault(); e.stopPropagation(); $('[data-mo="reveal"]', M.el).click(); }
  else if (/^[1-6]$/.test(k)) {
    const i = Number(k) - 1, t = M.kind === 'react' || M.kind === 'traffic' ? $('[data-rx="' + i + '"]', M.el) : M.kind === 'vote' ? $('[data-vote="' + i + '"]', M.el) : null;
    if (t) { e.preventDefault(); e.stopPropagation(); t.click(); }
  } else if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(k)) e.stopPropagation();
}

/* ---------------- the pills ---------------- */
export function infoOf(pill) {
  let info = {};
  try { info = JSON.parse(pill.dataset.info || '{}') || {}; } catch (e) { info = {}; }
  if (!info.title) { const pad = pill.closest('.b-pad'), t = pad && $('.b-title', pad); if (t) info.title = t.textContent.trim(); }
  return info;
}
document.addEventListener('click', (e) => {
  const pill = e.target.closest && e.target.closest('[data-moment]');
  if (!pill || pill.closest('.sthumb,[inert]')) return;
  e.preventDefault(); e.stopPropagation();
  const info = infoOf(pill);
  openMoment(Object.assign({ kind: pill.dataset.moment, label: (pill.querySelector('span') || pill).textContent.trim() }, info));
}, true);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const pill = e.target.closest && e.target.closest('[data-moment][role="button"]');
  if (!pill) return;
  e.preventDefault(); e.stopPropagation();
  pill.click();
}, true);
