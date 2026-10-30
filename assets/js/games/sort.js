/* Sort it: put each item into the right group, then Check. Right ones lock in green (10 points first time, 5 after
   a second try); wrong ones bounce back to try again. Drag with a finger or the mouse, or tap an item and then a
   group; with the keyboard, Enter on an item and then a number key (1 to 4) or Enter on a group. */
import { el, txt, shuffle, COLOURS, makeHud, makeClock, floatText, say } from './common.js?v=cdc164df';

export function run(root, g, h) {
  const c = g.content, set = g.settings, total = c.items.length;
  const stage = el('div', 'kg-stage kg-sort-stage');
  stage.innerHTML = '<div class="kg-tray" role="group" aria-label="Still to sort"></div>' +
    '<div class="kg-bins" style="--n:' + c.groups.length + '"></div>' +
    '<div class="kg-sortbar"><button type="button" class="kg-btn kg-check" disabled>Check</button></div>';
  root.appendChild(stage);
  const hud = makeHud(root, { rule: c.prompt });
  const tray = stage.querySelector('.kg-tray'), bins = stage.querySelector('.kg-bins'), check = stage.querySelector('.kg-check');
  let score = 0, locked = 0, wrong = 0, sel = null, ended = false, drag = null;
  const tries = new Map();
  hud.score(0); hud.progress('0 of ' + total + ' sorted');
  c.groups.forEach((name, gi) => {
    const bin = el('div', 'kg-bin');
    bin.dataset.g = String(gi);
    bin.style.setProperty('--c', COLOURS[(gi * 3 + 1) % COLOURS.length]);
    bin.innerHTML = '<button type="button" class="kg-bin-h"><b class="kg-key" aria-hidden="true">' + (gi + 1) + '</b><span></span></button><div class="kg-drop" role="group"></div>';
    txt(bin.querySelector('.kg-bin-h span'), name);
    bin.querySelector('.kg-bin-h').setAttribute('aria-label', 'Put it in ' + name + ' (key ' + (gi + 1) + ')');
    bin.querySelector('.kg-drop').setAttribute('aria-label', name);
    bins.appendChild(bin);
  });
  shuffle(c.items.map((it, i) => ({ it, i }))).forEach(({ it, i }) => {
    const b = el('button', 'kg-chip');
    b.type = 'button'; b.dataset.i = String(i);
    b.setAttribute('aria-pressed', 'false');
    txt(b, it.text);
    tray.appendChild(b);
  });
  const chips = () => Array.from(stage.querySelectorAll('.kg-chip'));
  function choose(b) {
    if (sel) sel.setAttribute('aria-pressed', 'false');
    sel = b && sel !== b ? b : null;
    if (sel) { sel.setAttribute('aria-pressed', 'true'); h.sfx.play('flip'); }
    stage.classList.toggle('picking', !!sel);
  }
  function put(b, gi) {
    if (!b || b.classList.contains('locked')) return;
    const drop = gi < 0 ? tray : bins.children[gi].querySelector('.kg-drop');
    drop.appendChild(b);
    b.classList.remove('nope');
    choose(null);
    h.sfx.play('step');
    paintCheck();
  }
  function paintCheck() {
    const placed = chips().filter((b) => !b.classList.contains('locked') && b.parentElement !== tray).length;
    check.disabled = ended || placed === 0;
    check.textContent = tray.querySelector('.kg-chip') ? 'Check' : 'Check them all';
  }
  stage.addEventListener('click', (e) => {
    if (ended || drag) return;
    const chip = e.target.closest('.kg-chip'), head = e.target.closest('.kg-bin-h'), bin = e.target.closest('.kg-bin');
    if (e.target.closest('.kg-check')) { doCheck(); return; }
    if (chip && !chip.classList.contains('locked')) { if (sel && sel !== chip && bin && chip.parentElement !== tray) { put(sel, Number(bin.dataset.g)); return; } choose(chip); return; }
    if (sel && (head || bin)) { put(sel, Number((head ? head.closest('.kg-bin') : bin).dataset.g)); return; }
    if (sel && e.target.closest('.kg-tray')) put(sel, -1);
  });
  root.addEventListener('keydown', (e) => {
    if (ended || !sel) return;
    const n = Number(e.key);
    if (n >= 1 && n <= c.groups.length) { e.preventDefault(); put(sel, n - 1); }
    else if (e.key === 'Escape') { e.stopPropagation(); choose(null); }
  });
  /* dragging: a finger or the mouse; a short press without moving is a tap */
  stage.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.kg-chip');
    if (!b || ended || b.classList.contains('locked') || e.button > 0) return;
    const r = b.getBoundingClientRect();
    drag = { b, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, ghost: null, id: e.pointerId, moved: false };
    try { b.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      const r = drag.b.getBoundingClientRect();
      const gh = drag.b.cloneNode(true);
      gh.className = 'kg-chip kg-ghost';
      gh.style.width = r.width + 'px';
      gh.style.fontSize = getComputedStyle(drag.b).fontSize;          // outside the game's box, so copy its size
      document.body.appendChild(gh);
      drag.ghost = gh;
      drag.b.classList.add('lifted');
      choose(null);
    }
    e.preventDefault();
    drag.ghost.style.transform = 'translate3d(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px,0)';
    const over = document.elementFromPoint(e.clientX, e.clientY);
    bins.querySelectorAll('.kg-bin').forEach((x) => x.classList.toggle('over', !!(over && x.contains(over))));
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    if (d.moved) {
      const over = e && document.elementFromPoint(e.clientX, e.clientY), bin = over && over.closest && over.closest('.kg-bin'), back = over && over.closest && over.closest('.kg-tray');
      d.ghost.remove(); d.b.classList.remove('lifted');
      bins.querySelectorAll('.kg-bin').forEach((x) => x.classList.remove('over'));
      if (bin) put(d.b, Number(bin.dataset.g)); else if (back) put(d.b, -1);
      setTimeout(() => { drag = null; }, 0);         // the click that follows a drag is not a tap
      return;
    }
    drag = null;
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  function doCheck() {
    if (ended) return;
    let rightNow = 0, wrongNow = 0;
    chips().forEach((b) => {
      if (b.classList.contains('locked') || b.parentElement === tray) return;
      const i = Number(b.dataset.i), gi = Number(b.closest('.kg-bin').dataset.g);
      if (c.items[i].group === gi) {
        const t = tries.get(i) || 0, add = t === 0 ? 10 : 5;
        score += add; locked += 1; rightNow += 1;
        b.classList.add('locked'); b.disabled = true;
      } else {
        wrongNow += 1; wrong += 1;
        tries.set(i, (tries.get(i) || 0) + 1);
        b.classList.add('nope');
        setTimeout(() => { if (!ended) { b.classList.remove('nope'); tray.appendChild(b); paintCheck(); } }, 700);
      }
    });
    const r = check.getBoundingClientRect(), s = stage.getBoundingClientRect();
    if (rightNow) { h.sfx.play('right'); floatText(stage, r.left - s.left + r.width / 2, r.top - s.top, '+' + (rightNow * 10), true); }
    if (wrongNow) h.sfx.play('wrong');
    say(root, rightNow + ' right' + (wrongNow ? ', ' + wrongNow + ' to try again' : '') + '.');
    hud.score(score); hud.progress(locked + ' of ' + total + ' sorted');
    h.onScore(score, { locked, wrong });
    paintCheck();
    if (locked === total) finish(true);
  }
  function finish(all) {
    if (ended) return;
    ended = true; clock.stop();
    if (all && set.seconds > 0) { const bonus = Math.round(clock.left / 2); if (bonus) { score += bonus; hud.score(score); h.onScore(score, { locked, wrong, bonus }); } }
    chips().forEach((b) => { b.disabled = true; });
    check.disabled = true;
    h.onEnd({ score, right: locked, wrong, max: total * 10, part: Math.min(1, score / (total * 10)), won: all, why: all ? 'all' : 'time' });
  }
  const clock = makeClock(set.seconds || 0, (t) => hud.time(t, set.seconds > 0 && t <= 10), () => finish(false)).start();
  h.sfx.play('go');
  return { stop() { ended = true; clock.stop(); if (drag && drag.ghost) drag.ghost.remove(); drag = null; }, pause() { clock.pause(); }, resume() { clock.resume(); } };
}
