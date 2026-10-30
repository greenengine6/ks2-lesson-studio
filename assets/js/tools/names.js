/* Class tools: Pick a name and Groups.
   Names come from "Our class" (first names kept on this device only, pupils.js), or, during a live class, from the
   pupils who have actually joined. Picking is fair: nobody is picked twice until everyone has had a turn. The name is
   said by the device's own voice (pupils' names never go to the voice service). */
import { $, $$, esc, icon, bus, reduceMotion } from '../core.js?v=3c9d4698';
import { Voice } from '../fx/voice.js?v=3c9d4698';
import { pickPupil, setPupils, namesIn, pupils } from '../pupils.js?v=3c9d4698';
import { Alarm } from './alarm.js?v=3c9d4698';
import { prefs, setPrefs, fairPick, bagLeft, shuffle, randInt, nameSource, liveCall, layer, ti, COLOURS, boardOverlay } from './shared.js?v=3c9d4698';

const CLASS_BAG = 'ks2-engine.pupils.bag.v1', HERE_BAG = 'ks2-engine.tools.bag.here', GROUPS = 'ks2-engine.tools.groups.v1';
const P = { last: '', left: 0 };
const repainters = new Set();
bus.on('pupils', () => repainters.forEach((f) => f()));
let liveT = 0;
bus.on('live', () => { if (liveT) return; liveT = setTimeout(() => { liveT = 0; repainters.forEach((f) => f()); }, 1500); });   // at most every 1.5 seconds during a busy lesson

/* ---------------- choosing a name fairly ---------------- */
async function choose(want) {
  const src = await nameSource(want);
  if (!src.list.length) return { name: '', src };
  if (src.source === 'class') { const name = pickPupil(); return { name, left: bagLeft(CLASS_BAG, src.list), src }; }
  const r = fairPick(src.list, HERE_BAG);
  return { name: r.name, left: r.left, src };
}
function sayName(name) { if (name && prefs().sayName) Voice.say(name + ', your turn!', { lang: 'en-GB', private: true }); }
function land() { const p = prefs(); if (!p.mute) Alarm.play('cheer', { volume: Math.min(70, p.volume) }); }
/* A quick shuffle through the names, then the chosen one. */
function shuffleTo(el, list, name, done) {
  if (reduceMotion() || list.length < 2) { el.textContent = name; done(); return; }
  let k = 0;
  const steps = Math.min(16, 7 + list.length);
  const step = () => {
    if (!el.isConnected) return;
    if (k < steps) { el.textContent = list[randInt(list.length)]; k++; setTimeout(step, 55 + k * 13); return; }
    el.textContent = name; done();
  };
  step();
}

/* ---------------- the wheel ---------------- */
const WHEEL_COLOURS = ['#5B52E6', '#F5A524', '#2C9C96', '#E2558A', '#3584D6', '#3B9A62', '#E07B2E', '#9A55CF'];
function wheelSVG(list) {
  const n = Math.max(1, list.length), R = 100, a = (Math.PI * 2) / n, show = n <= 28;
  let s = '<svg class="tl-wheel-svg" viewBox="-104 -104 208 208" aria-hidden="true"><g class="tl-wheel-g">';
  list.forEach((name, i) => {
    const a0 = i * a - Math.PI / 2, a1 = a0 + a, large = a > Math.PI ? 1 : 0;
    const p0 = [R * Math.cos(a0), R * Math.sin(a0)], p1 = [R * Math.cos(a1), R * Math.sin(a1)];
    let col = WHEEL_COLOURS[i % WHEEL_COLOURS.length];
    if (n > 1 && i === n - 1 && i % WHEEL_COLOURS.length === 0) col = WHEEL_COLOURS[3];      // never two the same side by side
    s += n === 1 ? '<circle r="' + R + '" fill="' + col + '"/>' : '<path d="M0 0L' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + 'Z" fill="' + col + '" stroke="#fff" stroke-width="1.2"/>';
    if (show) {
      const mid = a0 + a / 2, deg = (mid * 180) / Math.PI, fs = Math.max(5, Math.min(11, 150 / n + 2.5));
      const label = name.length > 12 ? name.slice(0, 11) + '…' : name;
      s += '<text transform="rotate(' + deg.toFixed(2) + ') translate(' + (R - 8) + ' 0)" text-anchor="end" dominant-baseline="middle" font-size="' + fs.toFixed(1) + '" fill="#fff" font-weight="700">' + esc(label) + '</text>';
    }
  });
  s += '</g><circle r="14" fill="#fff" stroke="#E0E5EC" stroke-width="3"/></svg><span class="tl-wheel-pin" aria-hidden="true"></span>';
  return s;
}
/* Spin so `name` lands under the pin at the top. */
function spinTo(wrap, list, name, done) {
  const g = $('.tl-wheel-g', wrap), n = list.length, i = Math.max(0, list.indexOf(name));
  if (!g || !n) { done(); return; }
  const seg = 360 / n, jitter = (randInt(60) / 100 - 0.3) * seg;
  const prev = Number(wrap.dataset.rot || 0), base = prev - (prev % 360);
  const target = base + 360 * (reduceMotion() ? 1 : 5 + randInt(2)) + (360 - (i * seg + seg / 2)) + jitter;
  g.style.transition = 'transform ' + (reduceMotion() ? 0.35 : 4.2) + 's cubic-bezier(.15,.7,.12,1)';
  requestAnimationFrame(() => { g.style.transform = 'rotate(' + target.toFixed(2) + 'deg)'; });
  wrap.dataset.rot = String(target);
  setTimeout(done, reduceMotion() ? 400 : 4300);
}

/* ---------------- Pick a name on screen ---------------- */
export function namesView(host, mode) {
  mode = mode || 'card';
  const big = mode === 'big' || mode === 'board';
  host.innerHTML = '<div class="tl-names tl-m-' + mode + '">' +
    '<div class="seg tl-src" role="group" aria-label="Pick from" hidden><button type="button" data-nm-src="class" aria-pressed="true">Our class</button><button type="button" data-nm-src="here" aria-pressed="false">Pupils who are here</button></div>' +
    '<div class="tl-name-box"><span class="tl-name-k">Your turn</span><b class="tl-name" aria-live="assertive"></b><span class="tl-name-left"></span></div>' +
    (big ? '<div class="tl-wheel" hidden></div>' : '') +
    '<div class="tl-ctrl"><button type="button" class="btn primary" data-nm="pick">' + ti('names') + '<span>Pick a name</span></button><button type="button" class="btn" data-nm="wheel">' + ti('wheel') + '<span>Spin the wheel</span></button></div>' +
    (mode === 'board' ? '' : '<div class="tl-row"><button type="button" class="linkbtn" data-nm="edit">' + ti('edit') + 'Edit our class</button><label class="tl-tog tl-tog-s"><input type="checkbox" data-nm="say"' + (prefs().sayName ? ' checked' : '') + '><span>Say the name</span></label></div>') +
    '<div class="tl-names-edit" hidden></div>' +
    '<p class="tl-empty" hidden>No names yet. Add your class’s first names, one on each line. They stay on this device and are never sent anywhere.</p></div>';
  const root = $('.tl-names', host);
  let src = { list: [], source: 'class', here: 0, cls: 0 }, busy = false;
  const paint = async () => {
    src = await nameSource(prefs().source);
    const seg = $('.tl-src', root);
    seg.hidden = !(src.here > 0);
    $$('[data-nm-src]', seg).forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.nmSrc === src.source)); b.textContent = (b.dataset.nmSrc === 'here' ? 'Pupils who are here (' + src.here + ')' : 'Our class (' + src.cls + ')'); });
    const empty = !src.list.length;
    $('.tl-empty', root).hidden = !empty;
    $('.tl-name-box', root).hidden = empty && !P.last;
    $$('[data-nm="pick"],[data-nm="wheel"]', root).forEach((b) => { b.disabled = empty || busy; });
    if (!busy) {
      $('.tl-name', root).textContent = P.last || (empty ? '' : 'Ready?');
      const left = src.source === 'class' ? bagLeft(CLASS_BAG, src.list) : bagLeft(HERE_BAG, src.list);
      $('.tl-name-left', root).textContent = empty ? '' : P.last ? (left ? left + ' still to pick · nobody twice' : 'Everyone has had a turn: a new round starts') : src.list.length + ' names · nobody twice';
    }
    const w = $('.tl-wheel', root);
    if (w && (!w.dataset.n || w.dataset.n !== src.list.join('|'))) { w.innerHTML = wheelSVG(src.list); w.dataset.n = src.list.join('|'); w.dataset.rot = '0'; }
    if (empty && mode !== 'board') openEditor(true);
  };
  const go = async (wheel) => {
    if (busy) return;
    if (wheel && !$('.tl-wheel', root)) {                 // the card has no room for a wheel: spin it full screen
      boardOverlay('Pick a name', (stage) => { namesView(stage, 'board'); setTimeout(() => { const b = $('[data-nm="wheel"]', stage); if (b) b.click(); }, 80); });
      return;
    }
    busy = true; paint();
    const r = await choose(prefs().source);
    if (!r.name) { busy = false; paint(); return; }
    const el = $('.tl-name', root), box = $('.tl-name-box', root);
    box.classList.remove('landed');
    const finish = () => { P.last = r.name; busy = false; box.classList.add('landed'); land(); sayName(r.name); paint(); bus.emit('tools:picked', r.name); };
    const w = $('.tl-wheel', root);
    if (wheel && w) { w.hidden = false; el.textContent = '…'; spinTo(w, r.src.list, r.name, () => { el.textContent = r.name; finish(); }); }
    else shuffleTo(el, r.src.list, r.name, finish);
  };
  const openEditor = (force) => {
    const ed = $('.tl-names-edit', root);
    if (!ed) return;
    if (!ed.hidden && !force) { ed.hidden = true; return; }
    ed.hidden = false;
    ed.innerHTML = '<label class="fld"><span>Our class: first names, one on each line</span><textarea rows="7" maxlength="1800" data-nm="list" aria-describedby="nm-priv">' + esc(pupils().join('\n')) + '</textarea></label>' +
      '<p class="fine" id="nm-priv">First names only. Kept on this device, never sent anywhere.</p><div class="tl-row"><button type="button" class="btn small primary" data-nm="save">' + icon('check') + '<span>Save the names</span></button><span class="fine" data-nm="n"></span></div>';
  };
  root.addEventListener('click', (e) => {
    const s = e.target.closest('[data-nm-src]');
    if (s) { setPrefs({ source: s.dataset.nmSrc }); P.last = ''; paint(); return; }
    const b = e.target.closest('[data-nm]');
    if (!b) return;
    const a = b.dataset.nm;
    if (a === 'pick') go(false);
    else if (a === 'wheel') go(true);
    else if (a === 'edit') openEditor(false);
    else if (a === 'save') {
      const list = namesIn($('[data-nm="list"]', root).value);
      setPupils(list);
      const n = $('[data-nm="n"]', root); if (n) n.textContent = list.length + (list.length === 1 ? ' name saved.' : ' names saved.');
      if (list.length) $('.tl-names-edit', root).hidden = true;
      P.last = ''; paint();
    }
  });
  root.addEventListener('change', (e) => { if (e.target.matches('[data-nm="say"]')) setPrefs({ sayName: e.target.checked }); });
  const rp = () => { if (!root.isConnected) { repainters.delete(rp); return; } paint(); };
  repainters.add(rp);
  paint();
  return () => repainters.delete(rp);
}
/* Pick a name from anywhere (Symphony, the tools over the slides). Resolves to the name, or '' with nobody to pick. */
export async function pickName(o) {
  o = o || {};
  const r = await choose(o.source || prefs().source);
  if (!r.name) { return ''; }
  const host = o.host || layer();
  let box = $('.tl-pickpop', host);
  if (!box) {
    box = document.createElement('div');
    box.className = 'tl-pickpop'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'A name, picked fairly');
    box.innerHTML = '<div class="tl-pickpop-card"><span class="tl-name-k">Your turn</span><b class="tl-name" aria-live="assertive"></b><span class="tl-name-left"></span>' +
      '<div class="tl-ctrl"><button type="button" class="btn primary" data-pp="again">' + icon('refresh') + '<span>Pick again</span></button><button type="button" class="btn" data-pp="x">' + icon('close') + '<span>Close</span></button></div></div>';
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pp]');
      if (e.target === box || (b && b.dataset.pp === 'x')) { box.remove(); return; }
      if (b && b.dataset.pp === 'again') pickName(Object.assign({}, o, { host }));
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); box.remove(); } });
    host.appendChild(box);
  }
  const el = $('.tl-name', box), card = $('.tl-pickpop-card', box);
  card.classList.remove('landed');
  $('.tl-name-left', box).textContent = r.left ? r.left + ' still to pick · nobody twice' : 'Everyone has had a turn';
  shuffleTo(el, r.src.list, r.name, () => { card.classList.add('landed'); land(); sayName(r.name); P.last = r.name; bus.emit('tools:picked', r.name); });
  setTimeout(() => { const b = $('[data-pp="again"]', box); if (b) b.focus({ preventScroll: true }); }, 50);
  return r.name;
}

/* ---------------- Groups ---------------- */
export function makeGroups(list, mode, n) {
  const names = shuffle(list.slice()), N = names.length;
  if (!N) return [];
  const k = mode === 'count' ? Math.max(1, Math.min(N, n)) : Math.max(1, Math.floor(N / Math.max(1, n)));
  const out = Array.from({ length: k }, () => []);
  names.forEach((x, i) => out[i % k].push(x));
  return out;
}
function savedGroups() { try { const g = JSON.parse(sessionStorage.getItem(GROUPS) || 'null'); return g && Array.isArray(g.groups) ? g : null; } catch (e) { return null; } }
export function groupsView(host, mode) {
  mode = mode || 'card';
  const p = prefs(), board = mode === 'board';
  host.innerHTML = '<div class="tl-groups tl-m-' + mode + '">' +
    (board ? '' : '<div class="tl-group-ctrl"><div class="seg" role="group" aria-label="How to make groups"><button type="button" data-gr-mode="size" aria-pressed="' + (p.groupMode !== 'count') + '">Group size</button><button type="button" data-gr-mode="count" aria-pressed="' + (p.groupMode === 'count') + '">Number of groups</button></div>' +
      '<label class="tl-inline"><span data-gr="nlabel">' + (p.groupMode === 'count' ? 'Groups' : 'Size') + '</span><select data-gr="n" aria-label="How many"></select></label></div>' +
      '<div class="seg tl-src" role="group" aria-label="Make groups from" hidden><button type="button" data-gr-src="class">Our class</button><button type="button" data-gr-src="here">Pupils who are here</button></div>') +
    '<div class="tl-group-grid"></div><p class="tl-empty" hidden>No names yet. Add your class’s first names in Pick a name (Edit our class), or start a live class.</p>' +
    (board ? '' : '<div class="tl-ctrl"><button type="button" class="btn primary" data-gr="make">' + ti('groups') + '<span>Make groups</span></button></div>') + '</div>';
  const root = $('.tl-groups', host);
  const fillN = () => {
    const q = prefs(), sel = $('[data-gr="n"]', root);
    if (!sel) return;
    const opts = q.groupMode === 'count' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5];
    const v = opts.includes(q.groupN) ? q.groupN : opts[1];
    sel.innerHTML = opts.map((x) => '<option value="' + x + '"' + (x === v ? ' selected' : '') + '>' + x + '</option>').join('');
    $('[data-gr="nlabel"]', root).textContent = q.groupMode === 'count' ? 'Groups' : 'Size';
  };
  const show = () => {
    const g = savedGroups(), grid = $('.tl-group-grid', root);
    if (!g || !g.groups.length) { grid.innerHTML = board ? '<p class="tl-empty">No groups yet.</p>' : ''; return; }
    grid.innerHTML = g.groups.map((m, i) => { const c = COLOURS[i % COLOURS.length]; return '<div class="tl-group" style="--gc:' + c.c + ';--gd:' + c.d + ';--gl:' + c.l + '"><b>Group ' + (i + 1) + '</b><span>' + m.map(esc).join(', ') + '</span></div>'; }).join('');
  };
  let src = null;
  const paintSrc = async () => {
    src = await nameSource(prefs().source);
    const seg = $('.tl-src', root);
    if (seg) { seg.hidden = !(src.here > 0); $$('[data-gr-src]', seg).forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.grSrc === src.source)); b.textContent = b.dataset.grSrc === 'here' ? 'Pupils who are here (' + src.here + ')' : 'Our class (' + src.cls + ')'; }); }
    $('.tl-empty', root).hidden = !!src.list.length || !!savedGroups();
    const mk = $('[data-gr="make"]', root); if (mk) mk.disabled = !src.list.length;
  };
  const make = async () => {
    src = await nameSource(prefs().source);
    if (!src.list.length) return;
    const q = prefs(), groups = makeGroups(src.list, q.groupMode, q.groupN);
    try { sessionStorage.setItem(GROUPS, JSON.stringify({ groups, at: Date.now() })); } catch (e) { /* this view only */ }
    show();
    const mk = $('[data-gr="make"] span', root); if (mk) mk.textContent = 'Shuffle again';
    if (!q.mute) Alarm.play('rattle', { volume: Math.min(60, q.volume) });
    if (src.source === 'here') liveCall('pushGroups', groups.map((m, i) => ({ name: 'Group ' + (i + 1), color: COLOURS[i % COLOURS.length].c, pids: m.map((x) => src.pids[x]).filter(Boolean), names: m })));
    bus.emit('tools:groups', groups);
  };
  root.addEventListener('click', (e) => {
    const m = e.target.closest('[data-gr-mode]');
    if (m) { setPrefs({ groupMode: m.dataset.grMode, groupN: m.dataset.grMode === 'count' ? 4 : 3 }); $$('[data-gr-mode]', root).forEach((b) => b.setAttribute('aria-pressed', String(b === m))); fillN(); return; }
    const s = e.target.closest('[data-gr-src]');
    if (s) { setPrefs({ source: s.dataset.grSrc }); paintSrc(); return; }
    if (e.target.closest('[data-gr="make"]')) make();
  });
  root.addEventListener('change', (e) => { if (e.target.matches('[data-gr="n"]')) setPrefs({ groupN: Number(e.target.value) }); });
  fillN(); show(); paintSrc();
  if (savedGroups()) { const mk = $('[data-gr="make"] span', root); if (mk) mk.textContent = 'Shuffle again'; }
  const rp = () => { if (!root.isConnected) { repainters.delete(rp); return; } paintSrc(); };
  repainters.add(rp);
  return () => repainters.delete(rp);
}
