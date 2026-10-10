/* Present-mode tools shared by the engines, Slide Studio and lkie.like:
   - Draw (D): pen, highlighter, rubber, six colours, three sizes, undo and clear. Drawings are kept per slide while
     the page is open, so going back to a slide shows what you drew on it.
   - Join (J): the QR code for a live lesson; the button then shows how many pupils have joined.
   - A timer, for screens that have none of their own.
   Each present screen calls kit.paint() after it draws a slide, and kit.close() when it closes. */
import { $, $$, icon } from './core.js?v=cfc5dfc4';
import { sfx } from './fx/audio.js?v=cfc5dfc4';
import { Ink, COLOURS, COLOUR_NAMES } from './draw.js?v=cfc5dfc4';
import { Live, onLive, pupilsIn } from './live/session.js?v=cfc5dfc4';
import { openJoin, closeJoin } from './live/panel.js?v=cfc5dfc4';
import { closeMoment } from './moments.js?v=cfc5dfc4';

const TRAY_COLOURS = [1, 2, 3, 0, 4, 6];          // red, blue, green, black, yellow, white
const kits = [];
const visible = (el) => !!el && !el.hidden && !el.closest('[hidden]');
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function paintLive() {
  const n = pupilsIn().length;
  kits.forEach((k) => $$('[data-kit="join"]', k.o.root).forEach((b) => {
    b.classList.toggle('live', Live.on);
    b.setAttribute('aria-label', Live.on ? 'Live lesson: ' + n + ' joined. Show the join code' : 'Pupils join on their own device');
    const s = $('span', b);
    if (s) s.textContent = Live.on ? 'Live · ' + n : 'Join';
  }));
}
onLive(paintLive);

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
    apply(); paintLive();
  };
  k.close = () => { k.setDraw(false); closeJoin(); closeMoment(); stopTimer(); const m = $('[data-kit-menu]', root); if (m) m.hidden = true; };

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
      if (x.left <= 0) { clearInterval(x.id); t.textContent = 'Time’s up'; t.className = 'kit-timer done'; sfx('chime'); k.timer = null; return; }
      t.textContent = fmt(x.left); t.classList.toggle('low', x.left <= 10);
    }, 1000);
  }

  root.addEventListener('click', (e) => {
    const kb = e.target.closest('[data-kit]');
    if (kb) {
      const a = kb.dataset.kit;
      if (a === 'draw') k.setDraw(!k.draw);
      else if (a === 'join') openJoin(root, o.title());
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
    '<button type="button" class="pbtn kit-join" data-kit="join" title="Pupils join on their own device (J)">' + icon('qr') + '<span>Join</span></button>';
}
