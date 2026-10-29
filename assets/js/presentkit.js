/* Present-mode tools shared by the engines, Slide Studio and lkie.like:
   - Draw (D): pen, highlighter, rubber, six colours, three sizes, undo and clear. Drawings are kept per slide while
     the page is open, so going back to a slide shows what you drew on it.
   - Join (J): the QR code for a live lesson; the button then shows how many pupils have joined, and a dot that
     says whether the latest slide reached their devices (green: sent; amber: sending or retrying; red: the relay
     is full for today).
   - In a live lesson, what is on the board goes to pupils' devices: the slide's title, the words they can see on
     it (never answers still hidden), its picture when it is a free Wikimedia one, and its question (the "how pupils
     respond" pill) by itself, with a count on the pill of how many have answered.
   - A timer, for screens that have none of their own.
   Each present screen calls kit.paint() after it draws a slide, and kit.close() when it closes. */
import { $, $$, icon } from './core.js?v=de4f9a51';
import { sfx } from './fx/audio.js?v=de4f9a51';
import { timesUp } from './fx/timesup.js?v=de4f9a51';
import { Ink, COLOURS, COLOUR_NAMES } from './draw.js?v=de4f9a51';
import { Live, onLive, pupilsIn, setBoard, boardQuestion, answersFor } from './live/session.js?v=de4f9a51';
import { openJoin, closeJoin } from './live/panel.js?v=de4f9a51';
import { closeMoment, infoOf, liveSpec, MOMENTS } from './moments.js?v=de4f9a51';
import { boardWords, boardPicture } from './context.js?v=de4f9a51';

const TRAY_COLOURS = [1, 2, 3, 0, 4, 6];          // red, blue, green, black, yellow, white
const kits = [];
const visible = (el) => !!el && !el.hidden && !el.closest('[hidden]');
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* Has the latest slide reached pupils' devices? */
function sendNote() {
  if (!Live.on) return '';
  if (Live.send === 'full') return 'full';
  if (Live.send === 'retry' || Live.status === 'busy' || Live.status === 'subs') return 'retry';
  if (Live.send === 'sending' || Live.status === 'off' || Live.status === 'connecting') return 'sending';
  return 'sent';
}
const SEND_WORDS = { sent: 'On pupils’ devices', sending: 'Sending to pupils’ devices…', retry: 'Trying again…', full: 'The free relay is full for today' };
function paintLive() {
  const n = pupilsIn().length, note = sendNote();
  kits.forEach((k) => {
    $$('[data-kit="join"]', k.o.root).forEach((b) => {
      b.classList.toggle('live', Live.on);
      if (note) b.dataset.send = note; else delete b.dataset.send;
      b.setAttribute('aria-label', Live.on ? 'Live lesson: ' + n + ' joined. ' + SEND_WORDS[note] + '. Show the join code' : 'Pupils join on their own device');
      b.title = Live.on ? SEND_WORDS[note] + ' · show the join code (J)' : 'Pupils join on their own device (J)';
      const s = $('span', b);
      if (s) s.textContent = Live.on ? 'Live · ' + n : 'Join';
    });
    paintPill(k);
  });
}
/* The count of answers on the board's own pill, while its question is on pupils' devices. */
function paintPill(k) {
  const fr = visible(k.o.root) && k.o.frame();
  const pill = fr && fr.querySelector('[data-moment]');
  if (!pill) return;
  const q = boardQuestion();
  let n = $('.mo-n', pill);
  pill.classList.toggle('on-devices', !!q);
  if (!q) { if (n) n.remove(); return; }
  if (!n) { n = document.createElement('b'); n.className = 'mo-n'; pill.appendChild(n); }
  const c = answersFor(q.id).size, was = n.textContent;
  n.textContent = String(c);
  n.setAttribute('aria-label', c + (c === 1 ? ' answer' : ' answers') + ' from pupils’ devices');
  pill.title = 'This question is on pupils’ devices. Tap to see the answers.';
  if (was && was !== String(c)) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
}
/* What is on the board now, for pupils' devices. */
function boardOf(k) {
  const fr = k.o.frame();
  if (!fr) return null;
  const pill = fr.querySelector('[data-moment]');
  const head = fr.querySelector('.sl-title, .t-title, .b-title, h1, h2, h3');
  const title = (head && head.textContent.trim()) || k.o.title() || '';
  const kind = pill && pill.dataset.moment;
  const moment = kind && MOMENTS[kind] && MOMENTS[kind].live ? liveSpec(kind, infoOf(pill)) : null;
  // the words pupils can see on the board (never hidden answers), and its picture if it is a free Wikimedia one
  let words = '', pic = '';
  try {
    words = boardWords(fr, 760);
    if (title) words = words.split('\n').filter((l) => l.trim().toLowerCase() !== title.toLowerCase()).join('\n');   // the title is sent on its own
    pic = boardPicture(fr);
  } catch (e) { words = ''; pic = ''; }
  return { key: String(k.o.key()), title, moment, words, pic };
}
function sendBoard(k) { if (Live.on && visible(k.o.root)) { const b = boardOf(k); if (b) setBoard(b); } }
onLive((what) => {
  if (what === 'start' || what === 'auto') kits.forEach(sendBoard);
  paintLive();
});

/* o: { root, frame: () => element, key: () => string, title: () => string, timer: boolean } */
export function presentKit(o) {
  const k = { o, draw: false, ink: null, store: new Map(), cur: null, tool: 'pen', color: 1, size: 1, tray: null, timer: null };
  kits.push(k);
  const root = o.root;
  const tray = document.createElement('div');
  tray.className = 'dtray'; tray.hidden = true;
  tray.setAttribute('role', 'toolbar'); tray.setAttribute('aria-label', 'Drawing tools');
  tray.innerHTML = '<button type="button" class="dt" data-dt="pen" title="Pen">' + icon('pen') + '<span>Pen</span></button><button type="button" class="dt" data-dt="hl" title="Highlighter">' + icon('marker') + '<span>Highlighter</span></button>' +
    '<button type="button" class="dt" data-dt="erase" title="Rubber (E)">' + icon('eraser') + '<span>Rubber</span></button><i class="dt-sep"></i>' +
    TRAY_COLOURS.map((i) => '<button type="button" class="dt-c" data-c="' + i + '" style="--c:' + COLOURS[i] + '" aria-label="' + COLOUR_NAMES[i] + '"></button>').join('') + '<i class="dt-sep"></i>' +
    [0, 1, 2].map((s) => '<button type="button" class="dt-s" data-s="' + s + '" aria-label="' + ['Thin', 'Medium', 'Thick'][s] + ' line"><i style="--w:' + (4 + s * 5) + 'px"></i></button>').join('') + '<i class="dt-sep"></i>' +
    '<button type="button" class="dt" data-dt="undo" title="Undo (Ctrl+Z)">' + icon('undo') + '<span>Undo</span></button><button type="button" class="dt" data-dt="clear" title="Clear this slide">' + icon('trash') + '<span>Clear</span></button>' +
    '<button type="button" class="dt dt-done" data-dt="done" title="Stop drawing (Esc)">' + icon('check') + '<span>Done</span></button>';
  root.appendChild(tray);
  k.tray = tray;

  function paintTray() {
    $$('[data-dt="pen"],[data-dt="hl"],[data-dt="erase"]', tray).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dt === k.tool)));
    $$('.dt-c', tray).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.c) === k.color && k.tool !== 'erase')));
    $$('.dt-s', tray).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.s) === k.size && k.tool !== 'erase')));
    const has = !!(k.ink && k.ink.undos.length), any = !!(k.ink && k.ink.strokes.length);
    $('[data-dt="undo"]', tray).disabled = !has; $('[data-dt="clear"]', tray).disabled = !any;
    $$('[data-kit="draw"]', root).forEach((b) => b.setAttribute('aria-pressed', String(k.draw)));
  }
  function apply() { if (k.ink) { k.ink.set({ tool: k.tool, color: COLOURS[k.color], size: k.size }); k.ink.enable(k.draw); } paintTray(); }
  k.setDraw = (on) => {
    k.draw = !!on;
    tray.hidden = !k.draw;
    root.classList.toggle('drawing', k.draw);
    if (k.draw) { if (k.tool === 'erase' && !(k.ink && k.ink.strokes.length)) k.tool = 'pen'; sfx('tap'); }
    apply();
  };
  k.paint = () => {
    const fr = o.frame();
    if (!fr) return;
    if (!k.ink) k.ink = new Ink(fr, { onChange: () => { const st = k.store.get(k.cur); if (st) { st.strokes = k.ink.strokes; st.undos = k.ink.undos; } paintTray(); } });
    else k.ink.attach(fr);
    const key = String(o.key());
    if (key !== k.cur) {
      k.cur = key;
      let st = k.store.get(key);
      if (!st) { st = { strokes: [], undos: [] }; k.store.set(key, st); }
      k.ink.load(st.strokes, st.undos);
    }
    apply(); sendBoard(k); paintLive();
  };
  k.close = () => {
    k.setDraw(false); closeJoin(); closeMoment(); stopTimer();
    const m = $('[data-kit-menu]', root); if (m) m.hidden = true;
    if (Live.on) setBoard({ key: '', title: '', moment: null });        // nothing on the board: pupils' devices wait
  };

  /* the timer (only where the screen asks for one) */
  function stopTimer() { if (k.timer) clearInterval(k.timer.id); k.timer = null; const t = $('.kit-timer', root); if (t) { t.hidden = true; t.className = 'kit-timer'; } }
  function startTimer(min) {
    stopTimer();
    let t = $('.kit-timer', root);
    if (!t) { t = document.createElement('div'); t.className = 'kit-timer'; t.setAttribute('role', 'timer'); root.appendChild(t); }
    k.timer = { left: Math.round(min * 60), id: 0 };
    t.hidden = false; t.className = 'kit-timer'; t.textContent = fmt(k.timer.left);
    k.timer.id = setInterval(() => {
      const x = k.timer; if (!x) return;
      x.left -= 1;
      if (x.left <= 0) { clearInterval(x.id); t.textContent = 'Time’s up'; t.className = 'kit-timer done'; timesUp(); k.timer = null; return; }
      t.textContent = fmt(x.left); t.classList.toggle('low', x.left <= 10);
    }, 1000);
  }

  root.addEventListener('click', (e) => {
    const kb = e.target.closest('[data-kit]');
    if (kb) {
      const a = kb.dataset.kit;
      if (a === 'draw') k.setDraw(!k.draw);
      else if (a === 'join') openJoin(root, o.title());
      else if (a === 'tools') import('./tools/tools.js?v=de4f9a51').then((m) => { if (m && m.openToolDock) m.openToolDock(root); }).catch(() => { /* class tools not on this version yet */ });
      else if (a === 'timer') { const m = $('[data-kit-menu]', root); if (m) { m.hidden = !m.hidden; kb.setAttribute('aria-expanded', String(!m.hidden)); } }
      else if (a === 'min') { const m = $('[data-kit-menu]', root); if (m) m.hidden = true; const v = Number(kb.dataset.min); if (v) startTimer(v); else stopTimer(); }
      return;
    }
    const d = e.target.closest('[data-dt]'), c = e.target.closest('.dt-c'), s = e.target.closest('.dt-s');
    if (c) { k.color = Number(c.dataset.c); if (k.tool === 'erase') k.tool = 'pen'; apply(); return; }
    if (s) { k.size = Number(s.dataset.s); if (k.tool === 'erase') k.tool = 'pen'; apply(); return; }
    if (!d) return;
    const a = d.dataset.dt;
    if (a === 'pen' || a === 'hl' || a === 'erase') { k.tool = a; if (a === 'hl' && k.color === 0) k.color = 4; apply(); }
    else if (a === 'undo') { if (k.ink) k.ink.undo(); }
    else if (a === 'clear') { if (k.ink) k.ink.clear(); }
    else if (a === 'done') k.setDraw(false);
  });
  document.addEventListener('keydown', (e) => {
    if (!visible(root) || (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]'))) return;
    if ($('.mo', root) || $('.livep', root) || $('.ticket', root)) return;           // a moment, the join screen or class feedback has the keys
    const key = e.key, mod = e.ctrlKey || e.metaKey;
    if (k.draw) {
      if (mod && (key === 'z' || key === 'Z')) { e.preventDefault(); e.stopPropagation(); if (k.ink) k.ink.undo(); return; }
      if (key === 'Escape') { e.preventDefault(); e.stopPropagation(); k.setDraw(false); return; }
      if (key === 'e' || key === 'E') { e.preventDefault(); e.stopPropagation(); k.tool = 'erase'; apply(); return; }
    }
    if (mod || e.altKey) return;
    if (key === 'd' || key === 'D') { e.preventDefault(); e.stopPropagation(); k.setDraw(!k.draw); }
    else if (key === 'j' || key === 'J') { e.preventDefault(); e.stopPropagation(); openJoin(root, o.title()); }
  }, true);
  return k;
}
/* The buttons each present bar gets (the engines' and Slide Studio's bars have them in index.html). */
export function kitButtons(withTimer) {
  return '<button type="button" class="pbtn" data-kit="draw" aria-pressed="false" title="Draw on the slide (D)">' + icon('pen') + '<span>Draw</span></button>' +
    (withTimer ? '<div style="position:relative"><button type="button" class="pbtn" data-kit="timer" aria-expanded="false" title="Timer">' + icon('clock') + '<span>Timer</span></button>' +
      '<div class="pr-menu" data-kit-menu hidden>' + [1, 2, 3, 5, 10].map((m) => '<button type="button" class="pbtn" data-kit="min" data-min="' + m + '">' + m + (m === 1 ? ' min' : '') + '</button>').join('') + '<button type="button" class="pbtn" data-kit="min" data-min="0">Stop</button></div></div>' : '') +
    '<button type="button" class="pbtn kit-join" data-kit="join" title="Pupils join on their own device (J)">' + icon('qr') + '<span>Join</span></button>' +
    '<button type="button" class="pbtn" data-kit="tools" title="Class tools: timer, pick a name, groups, signs, points">' + icon('vote') + '<span>Tools</span></button>';
}
