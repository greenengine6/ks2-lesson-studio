/* Wonder Window: a full-screen play area for a class watching one shared screen. It opens on a picker of windows in
   five groups (our world, weather and seasons, the living world, sky and space, nature at dusk and night). Each
   window is a live scene with a caption Symphony reads aloud (facts, then wonder questions), a quiz, and a "For
   teachers" panel with its sources. This file is the frame: picker, top bar, caption, sound, full screen and voice
   commands. The windows themselves load the first time Wonder Window opens (assets/js/wonder/), so the home page
   stays light. */
import { $, $$, esc, icon, bus, reduceMotion, toast } from './core.js?v=73f756c9';
import { sfx } from './fx/audio.js?v=73f756c9';
import { Ambient, Speech } from './fx/sound.js?v=73f756c9';
import { track } from './track.js?v=73f756c9';
import { MINI } from './fx/symphony.js?v=73f756c9';
import { settings } from './settings.js?v=73f756c9';
import { registerScenes } from './commands.js?v=73f756c9';
import { view } from './wonder/util.js?v=73f756c9';

/* ---------------- the windows, in their groups ---------------- */
const GROUPS = [['world', 'Our world'], ['weather', 'Weather and seasons'], ['living', 'The living world'], ['sky', 'Sky and space'], ['dark', 'Nature at dusk and night']];
export const WINDOWS = [
  { id: 'explorer', group: 'world', name: 'World Explorer', e: '🗺️', label: 'Cities, food, and the time there now', a: '#0E4D92', b: '#1FA2A6', words: ['world explorer', 'explorer', 'world map', 'map of the world', 'map', 'cities', 'cities of the world', 'world cities', 'peta dunia'] },
  { id: 'festivals', group: 'world', name: 'Festivals', e: '🪔', label: 'How people celebrate around the world', a: '#9A3412', b: '#DB2777', words: ['festivals', 'festival', 'cultures', 'cultures of the world', 'world cultures', 'celebrations', 'perayaan'] },
  { id: 'wonders', group: 'world', name: 'Seven Wonders', e: '🏛️', label: 'The ancient seven and the new seven', a: '#7C5A1E', b: '#C08A2B', words: ['seven wonders', '7 wonders', 'seven wonders of the world', 'wonders of the world', 'wonders', 'ancient wonders', 'tujuh keajaiban dunia'] },
  { id: 'malaysia', group: 'world', name: 'Wonders of Malaysia', e: '🌺', label: 'In English and Bahasa Melayu', a: '#0F766E', b: '#B91C1C', words: ['wonders of malaysia', 'malaysia', 'malaysia facts', 'keajaiban malaysia'] },
  { id: 'weather', group: 'weather', name: 'Extreme weather', e: '⛈️', label: 'Hurricanes, thunderstorms, monsoons and blizzards', a: '#1E293B', b: '#4B5D7A', words: ['extreme weather', 'weather', 'cuaca', 'cuaca ekstrem'] },
  { id: 'seasons', group: 'weather', name: 'Seasons', e: '🌍', label: 'Why we have summer and winter', a: '#1D4ED8', b: '#D97706', words: ['seasons', 'the seasons', 'summer and winter', 'musim'] },
  { id: 'rainforest', group: 'living', name: 'Rainforest', e: '🌳', label: 'Malaysia’s rainforest, layer by layer', a: '#14532D', b: '#15803D', words: ['rainforest', 'rain forest', 'malaysia s rainforest', 'malaysian rainforest', 'jungle', 'hutan hujan', 'hutan'] },
  { id: 'savannah', group: 'living', name: 'Savannah', e: '🦒', label: 'The grasslands of Africa', a: '#B45309', b: '#CA8A04', words: ['savannah', 'savanna', 'african savannah', 'grasslands', 'safari'] },
  { id: 'desert', group: 'living', name: 'Desert', e: '🐪', label: 'Hot, dry and full of surprises', a: '#C2410C', b: '#D97706', words: ['desert', 'the desert', 'sahara', 'gurun'] },
  { id: 'reef', group: 'living', name: 'Coral reef', e: '🐠', label: 'A city under the sea', a: '#0369A1', b: '#0891B2', words: ['coral reef', 'reef', 'under the sea', 'ocean', 'terumbu karang'] },
  { id: 'tundra', group: 'living', name: 'Tundra', e: '🦊', label: 'The frozen lands of the far north', a: '#475569', b: '#64748B', words: ['tundra', 'arctic tundra'] },
  { id: 'polar', group: 'living', name: 'Polar lands', e: '🐧', label: 'The Arctic and Antarctica', a: '#1E3A8A', b: '#2563EB', words: ['polar lands', 'polar', 'the poles', 'antarctica', 'arctic', 'north pole', 'south pole', 'penguins', 'polar bears'] },
  { id: 'records', group: 'living', name: 'Animal record breakers', e: '🐆', label: 'Fastest, biggest, smallest, oldest', a: '#9A3412', b: '#EA580C', words: ['animal record breakers', 'record breakers', 'animal records', 'records', 'animals', 'fastest animals', 'biggest animals'] },
  { id: 'space', group: 'sky', name: 'Planets', e: '🪐', label: 'The solar system at real relative speeds', a: '#1E1B4B', b: '#4338CA', words: ['planets', 'solar system', 'space'] },
  { id: 'aurora', group: 'sky', name: 'Northern lights', e: '🌌', label: 'The aurora over snowy mountains', a: '#064E3B', b: '#6D28D9', words: ['northern lights', 'aurora', 'aurora borealis'] },
  { id: 'birds', group: 'dark', name: 'Starlings', e: '🐦', label: 'A murmuration at dusk', a: '#4C1D95', b: '#C2410C', words: ['starlings', 'starling', 'birds', 'murmuration'] },
  { id: 'flies', group: 'dark', name: 'Fireflies', e: '✨', label: 'Fireflies that learn to flash together', a: '#052E16', b: '#4D7C0F', words: ['fireflies', 'firefly', 'fire flies', 'kelip kelip'] }
];
/* The cities on the World Explorer map ("Hey Symphony, show me Tokyo"). Same ids as wonder/data.js. */
export const CITY_WORDS = {
  kl: ['Kuala Lumpur', 'kl'], london: ['London'], paris: ['Paris'], rome: ['Rome', 'roma'], cairo: ['Cairo', 'kaherah'], nairobi: ['Nairobi'], capetown: ['Cape Town'], lagos: ['Lagos'],
  mumbai: ['Mumbai', 'bombay'], beijing: ['Beijing'], tokyo: ['Tokyo'], seoul: ['Seoul'], bangkok: ['Bangkok'], singapore: ['Singapore', 'singapura'], jakarta: ['Jakarta'], sydney: ['Sydney'],
  auckland: ['Auckland'], newyork: ['New York', 'new york city'], mexico: ['Mexico City', 'mexico'], rio: ['Rio de Janeiro', 'rio'], lima: ['Lima'], reykjavik: ['Reykjavík', 'reykjavik', 'iceland'],
  dubai: ['Dubai'], istanbul: ['Istanbul']
};
const SUBS = [
  { id: 'weather/hurricane', name: 'the hurricane', words: ['hurricane', 'hurricanes', 'typhoon', 'cyclone', 'taufan'] },
  { id: 'weather/storm', name: 'the thunderstorm', words: ['thunderstorm', 'thunderstorms', 'thunder storm', 'thunder and lightning', 'lightning', 'storm', 'ribut petir'] },
  { id: 'weather/monsoon', name: 'the monsoon', words: ['monsoon', 'monsoons', 'monsun'] },
  { id: 'weather/blizzard', name: 'the blizzard', words: ['blizzard', 'snowstorm', 'snow storm'] },
  { id: 'records/race', name: 'the speed race', words: ['speed race', 'animal race', 'race'] },
  { id: 'wonders/tall', name: 'how tall the wonders are', words: ['how tall', 'how tall are the wonders'] }
].concat(Object.keys(CITY_WORDS).map((id) => ({ id: 'explorer/' + id, name: CITY_WORDS[id][0] + ' on the world map', words: CITY_WORDS[id] })));

/* ---------------- the frame ---------------- */
let root = null, canvas = null, ctx = null, paneHost = null, over = null, pick = null, cap = null;
let raf = 0, last = 0, t = 0, dpr = 1, W = 0, H = 0, idleT = 0, soundOn = true, lang = 'en';
let win = null, winId = '', want = '', def = null, startedAt = 0, items = [], idx = 0, rotT = 0, capLang = 'en-GB';
let mod = null, modP = null, stars = null;
const playing = () => document.body.classList.contains('playing');
function loadMod() {
  if (!modP) modP = import('./wonder/windows.js?v=73f756c9').then((m) => { mod = m; return m; }).catch((e) => { modP = null; throw e; });
  return modP;
}
const padStop = () => { if (mod) mod.Pad.stop(); };

function pickerHTML() {
  return '<div class="pk-in"><header class="pk-h"><h1>Wonder Window</h1><p>Choose a window for the whole class. You can also say “Hey Symphony, show the rainforest”.</p></header>' +
    GROUPS.map(([g, name]) => '<section class="pk-g"><h2>' + esc(name) + '</h2><div class="pk-grid">' +
      WINDOWS.filter((w) => w.group === g).map((w) => '<a class="pk-c" href="#/play/' + w.id + '" data-win="' + w.id + '" style="--a:' + w.a + ';--b:' + w.b + '"><span class="pk-e cre" aria-hidden="true" data-name="' + esc(w.name) + '">' + w.e + '</span><b>' + esc(w.name) + '</b><small>' + esc(w.label) + '</small></a>').join('') +
      '</div></section>').join('') + '</div>';
}
function build() {
  root = $('#view-play');
  root.innerHTML = '<canvas class="play-cv" aria-label="Wonder Window"></canvas><div class="play-pane"></div><div class="play-pick" hidden>' + pickerHTML() + '</div>' +
    '<div class="play-top"><a class="play-home" href="#/" aria-label="Back to the engines">' + icon('left') + '</a>' +
    '<a class="pbtn play-all" href="#/play" hidden>' + icon('layers') + '<span>All windows</span></a>' +
    '<div class="play-title"><b>Wonder Window</b><small></small></div>' +
    '<div class="play-tabs" role="tablist" aria-label="Views" hidden></div>' +
    '<div class="play-btns"><button type="button" class="pbtn" data-play-bm aria-pressed="false" hidden title="Bahasa Melayu"><b>BM</b></button>' +
    '<button type="button" class="pbtn" data-play-quiz hidden title="Quiz">' + icon('star') + '<span>Quiz</span></button>' +
    '<button type="button" class="pbtn" data-play-src hidden title="For teachers: where the facts come from">' + icon('info') + '<span>For teachers</span></button>' +
    '<button type="button" class="pbtn" data-play-sound aria-pressed="true" title="Sound">' + icon('volume') + '<span>Sound</span></button>' +
    '<button type="button" class="pbtn" data-play-full title="Full screen">' + icon('expand') + '</button></div></div>' +
    '<div class="play-cap" aria-live="polite" hidden><span class="play-sym">' + MINI() + '</span><div class="play-txt"><small></small><p></p></div><div class="play-nav"><button type="button" class="pbtn" data-cap-say title="Symphony reads it">' + icon('volume') + '</button><button type="button" class="pbtn" data-cap-next title="Next">' + icon('right') + '</button></div></div>' +
    '<div class="play-over" hidden></div><div class="play-load" hidden role="status"><span class="play-spin" aria-hidden="true"></span><b>Opening…</b></div>';
  canvas = $('.play-cv', root); ctx = canvas.getContext('2d');
  loadMod().then((m) => { if (root) m.swapCreatures(root); }).catch(() => {});       // the picker's animals, drawn
  paneHost = $('.play-pane', root); over = $('.play-over', root); pick = $('.play-pick', root); cap = $('.play-cap', root);
  root.addEventListener('click', (e) => {
    const tb = e.target.closest('[data-tab]'); if (tb) { setTab(tb.dataset.tab, true); return; }
    if (e.target.closest('[data-cap-next]')) { nextItem(true); return; }
    if (e.target.closest('[data-cap-say]')) { sayCap(true); return; }
    const sb = e.target.closest('[data-play-sound]');
    if (sb) { soundOn = !soundOn; sb.setAttribute('aria-pressed', String(soundOn)); sb.innerHTML = icon(soundOn ? 'volume' : 'mute') + '<span>Sound</span>'; applySound(); return; }
    if (e.target.closest('[data-play-full]')) { try { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen(); } catch (er) { /* not allowed here */ } return; }
    const bmb = e.target.closest('[data-play-bm]');
    if (bmb && win) { lang = lang === 'ms' ? 'en' : 'ms'; bmb.setAttribute('aria-pressed', String(lang === 'ms')); closeOver(); if (win.setLang) win.setLang(lang); setCaption(); sfx('tap'); return; }
    if (e.target.closest('[data-play-quiz]') && win) { win.openQuiz(def.name); return; }
    if (e.target.closest('[data-play-src]') && win) { win.openSources(def.name); return; }
    if (e.target.closest('.pk-c')) sfx('nav');
  });
  over.addEventListener('click', (e) => { if (e.target === over || e.target.classList.contains('wo') || e.target.closest('[data-wo-x]')) closeOver(); });
  const at = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointermove', (e) => { wake(); if (win && win.scene.pointer) { const [x, y] = at(e); win.scene.pointer(x, y, e.buttons); } });
  canvas.addEventListener('pointerdown', (e) => {
    wake(); if (!win) return;
    const [x, y] = at(e);
    if (win.scene.pointer) win.scene.pointer(x, y);
    const r = win.scene.click ? win.scene.click(x, y) : null;
    if (r && win.onScene) win.onScene(r);
  });
  document.addEventListener('keydown', (e) => {
    if (!playing() || $('.mo') || $('.pick:not([hidden])')) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]') && e.key !== 'Escape') return;
    if (e.key === 'Escape') {
      if (!over.hidden) { e.preventDefault(); closeOver(); return; }
      if (win && win.escape && win.escape()) { e.preventDefault(); return; }        // e.g. close the postcard first
      if (win && !document.fullscreenElement) { e.preventDefault(); location.hash = '#/play'; }
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const d = e.key === 'ArrowLeft' ? -1 : 1, o = over.firstElementChild;
      if (!over.hidden && o && o.onArrow) { e.preventDefault(); o.onArrow(d); }
      else if (over.hidden && win && win.arrow) { e.preventDefault(); win.arrow(d); }
    }
  });
  window.addEventListener('resize', () => { if (root && !root.hidden) { const moved = measureTop(); size(moved); measureCap(); if (win && win.resized) win.resized(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopLoop(); if (win && win.audio) win.audio(false); }
    else if (root && !root.hidden && playing()) { loop(); if (win) applySound(); }
  });
}
function wake() { idleT = 0; root.classList.remove('idle'); }
/* Where the top bar ends (it wraps onto two rows on phones): scenes keep their labels below it, panels start under it. */
function measureTop() {
  const top = Math.round($('.play-top', root).getBoundingClientRect().bottom - root.getBoundingClientRect().top);
  root.style.setProperty('--top-h', top + 'px');
  if (top === view.top) return false;
  view.top = top;
  return true;
}
function size(force) {
  const r = root.getBoundingClientRect();
  view.small = Math.min(r.width, r.height) < 700;
  dpr = Math.min(window.devicePixelRatio || 1, view.small ? 2 : 1.75);
  view.dpr = dpr;
  const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
  if (w === W && h === H) { if (force && win) win.scene.resize(w, h); return; }
  const first = !W;
  W = w; H = h;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  stars = null;
  if (win && !first) win.scene.resize(w, h);
}
const setHash = (id, sub) => { try { history.replaceState(null, '', '#/play' + (id ? '/' + id + (sub ? '/' + sub : '') : '')); } catch (e) { /* ignore */ } };
function setTitle(name, label) { $('.play-title b', root).textContent = name; $('.play-title small', root).textContent = label; }
function loading(on) { $('.play-load', root).hidden = !on; }

/* ---------------- the overlay: cards, quiz, sources ---------------- */
function openOver(html, label) {
  over.innerHTML = '<div class="wo" role="dialog" aria-modal="true" aria-label="' + esc(label || '') + '">' + html + '</div>';
  over.hidden = false;
  const f = over.querySelector('.wo-x, button'); if (f) f.focus({ preventScroll: true });
  return over.firstElementChild;
}
function closeOver() { if (!over || over.hidden) return; over.hidden = true; over.innerHTML = ''; }

/* ---------------- opening a window ---------------- */
function makeShell(pane) {
  return {
    pane,
    lang: () => lang,
    overlay: openOver,
    say(text, l) { if (!text) return; Speech.stop(); Speech.speak(text, { lang: l || 'en-GB', rate: 0.92 }); },
    show(it, speak) { show(it); if (speak) sayCap(false); },
    setSub(s) { if (win) setHash(winId, s); },
    tab(id) { setTab(id, true); },
    resound() { applySound(); },                 // the window moved somewhere with a different sound
    recaption() { setCaption(); },               // back to the window's own facts and questions
    soundOn: () => soundOn
  };
}
function route() {
  const m = /^#\/play(?:\/([\w-]+))?(?:\/([\w-]+))?/.exec(location.hash || '');
  const id = m && m[1];
  if (!id || !WINDOWS.some((w) => w.id === id)) { if (id) setHash(''); showPicker(); return; }
  openWin(id, (m && m[2]) || '');
}
function applySub(sub) {
  if (!sub || !win) return;
  if (win.tabs && win.tabs.some((x) => x.id === sub)) setTab(sub, true);
  else if (win.sub) win.sub(sub);
}
async function openWin(id, sub) {
  if (winId === id) { if (win) applySub(sub); else want = sub; return; }
  closeWin();
  winId = id; want = sub || ''; def = WINDOWS.find((w) => w.id === id);
  pick.hidden = true; root.classList.add('in-win');
  setTitle(def.name, def.label);
  $('.play-all', root).hidden = false;
  loading(true);
  let m;
  try { m = await loadMod(); } catch (e) {
    loading(false);
    if (winId === id) { winId = ''; toast('Wonder Window could not open. Check the connection, then try again.'); showPicker(); }
    return;
  }
  if (winId !== id || !playing()) return;
  loading(false);
  const pane = document.createElement('div');
  pane.className = 'wp';
  paneHost.innerHTML = ''; paneHost.appendChild(pane);
  win = m.makeWindow(id, makeShell(pane));
  if (!win) { winId = ''; showPicker(); return; }
  const bmb = $('[data-play-bm]', root); bmb.hidden = !win.bm; bmb.setAttribute('aria-pressed', String(lang === 'ms'));
  $('[data-play-quiz]', root).hidden = !win.quiz;
  $('[data-play-src]', root).hidden = !win.sources;
  const tabs = $('.play-tabs', root);
  tabs.hidden = !win.tabs;
  tabs.innerHTML = win.tabs ? win.tabs.map((x) => '<button type="button" role="tab" data-tab="' + x.id + '" aria-selected="false">' + esc(x.name) + '</button>').join('') : '';
  measureTop();
  W = 0; size();
  win.scene.init(W, H);
  if (win.bm && win.setLang) win.setLang(lang);
  if (win.mount) win.mount();
  const s = want; want = '';
  if (win.tabs) setTab(win.tabs.some((x) => x.id === s) ? s : win.tab || win.tabs[0].id, false);
  else if (s && win.sub) win.sub(s);
  setCaption();
  cap.hidden = false;
  applySound();
  startedAt = Date.now();
  sfx('whoosh');
  loop();
}
function setTab(id, user) {
  if (!win || !win.tabs || !win.tabs.some((x) => x.id === id)) return;
  closeOver();
  win.setTab(id);
  $$('[data-tab]', root).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
  setHash(winId, id);
  if (user) { setCaption(); applySound(); sfx('tap'); }
}
function closeWin() {
  if (win) {
    if (startedAt) track('play', { scene: winId, ms: Date.now() - startedAt });
    try { if (win.audio) win.audio(false); } catch (e) { /* ignore */ }
    try { if (win.unmount) win.unmount(); } catch (e) { /* ignore */ }
  }
  win = null; winId = ''; startedAt = 0;
  if (!root) return;
  paneHost.innerHTML = ''; closeOver(); loading(false);
  const tabs = $('.play-tabs', root); tabs.hidden = true; tabs.innerHTML = '';
  ['[data-play-bm]', '[data-play-quiz]', '[data-play-src]'].forEach((s) => { $(s, root).hidden = true; });
}
function showPicker() {
  closeWin();
  pick.hidden = false; root.classList.remove('in-win');
  setTitle('Wonder Window', 'Choose a window');
  $('.play-all', root).hidden = true;
  measureTop();
  cap.hidden = true;
  Ambient.stop(); padStop(); Speech.stop();
  loadMod().catch(() => {});                  // get the windows ready while the teacher chooses
}

/* ---------------- the caption Symphony reads ---------------- */
function setCaption() { if (!win) return; items = win.caption(lang === 'ms' && !!win.bm) || []; idx = -1; nextItem(false); }
function show(it) {
  if (!it) return;
  $('.play-txt small', root).textContent = it.kind || '';
  $('.play-txt p', root).textContent = it.text || '';
  capLang = it.lang || 'en-GB';
  cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
  rotT = 0;
  measureCap();
}
/* How much room the caption takes at the bottom (it grows with longer facts): panels and strips sit above it. */
function measureCap() {
  if (!root || cap.hidden) return;
  const h = Math.round(root.clientHeight - cap.offsetTop);                  // (offsetTop ignores the caption's slide-in)
  if (h > 0) root.style.setProperty('--cap-h', h + 'px');
}
function nextItem(user) { if (!items.length) return; idx = (idx + 1) % items.length; show(items[idx]); if (user) sayCap(false); }
function sayCap(force) {
  const txt = $('.play-txt p', root).textContent;
  if (!txt || (!force && !settings.voice)) return;
  Speech.stop(); Speech.speak(txt, { lang: capLang, rate: 0.92 });
}
function applySound() {
  if (!win) { Ambient.stop(); padStop(); return; }
  win.scene.soundOn = soundOn;
  const s = win.sound;
  if (soundOn && s) Ambient.play(s); else Ambient.stop();
  if (soundOn && win.pad && mod) mod.Pad.start(); else padStop();
  if (win.audio) win.audio(soundOn && !document.hidden);      // a window's own music (the festivals)
}

/* ---------------- drawing ---------------- */
function drawStars(dt) {
  if (!stars) stars = Array.from({ length: Math.round(W * H / 5000) }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.4 + 0.4, p: Math.random() * 6.3, v: Math.random() * 6 + 2 }));
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#05071A'); g.addColorStop(1, '#0E1530');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  stars.forEach((s) => { s.y -= s.v * dt; if (s.y < 0) s.y = H; ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.7 + s.p)); ctx.fillRect(s.x, s.y, s.s, s.s); });
  ctx.globalAlpha = 1;
}
function frame(now) {
  raf = 0;
  if (!root || root.hidden || document.hidden || !playing()) return;
  const dt = Math.min(0.05, ((now - (last || now)) / 1000)) * (reduceMotion() ? 0.35 : 1);
  last = now; t += dt; idleT += dt;
  if (idleT > 4 && document.fullscreenElement) root.classList.add('idle');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (win) {
    rotT += dt;
    if (rotT > 18 && over.hidden) nextItem(false);
    try { win.scene.step(dt, t); win.scene.draw(ctx, W, H, t); if (win.tick) win.tick(dt); } catch (e) { if (!win.err) { win.err = 1; console.error(e); } }
  } else drawStars(dt);
  raf = requestAnimationFrame(frame);
}
function loop() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

/* The window that is open now (for the tests and for tools that look at the screen). */
export function current() { return win; }
export function openPlay() {
  if (!root) build();
  document.body.classList.add('playing');
  requestAnimationFrame(() => { size(); route(); loop(); });
}
export function closePlay() {
  closeWin(); want = '';
  document.body.classList.remove('playing');
  stopLoop(); Ambient.stop(); padStop(); Speech.stop();
  try { if (document.fullscreenElement === root) document.exitFullscreen(); } catch (e) { /* ignore */ }
}
export function initPlay() {
  bus.on('play', (on) => (on ? openPlay() : closePlay()));
  registerScenes(WINDOWS.map((w) => ({ id: w.id, name: w.name, words: w.words })).concat(SUBS));     // "Hey Symphony, show the rainforest"
  bus.on('play-scene', () => { if (root && playing()) route(); });
  window.addEventListener('hashchange', () => { if (root && playing() && /^#\/play(?:\/|$)/.test(location.hash)) route(); });
  bus.on('play-context', (out) => {                                   // what Symphony knows about the screen (context.js)
    if (!root || !playing() || !Array.isArray(out)) return;
    if (!win) { out.push('Wonder Window is showing its list of windows: ' + WINDOWS.map((w) => w.name).join(', ') + '.'); return; }
    out.push('Wonder Window is showing the ' + def.name + ' window (' + def.label + ')' + (win.tab && win.tabs ? ', on ' + (win.tabs.find((x) => x.id === win.tab) || {}).name : '') + '.');
    const extra = win.context ? win.context() : '';
    if (extra) out.push(extra);
    const o = over.hidden ? null : over.querySelector('[data-ctx]');
    if (o) out.push('Open on screen now: "' + o.innerText.replace(/\s+/g, ' ').trim().slice(0, 600) + '"');
  });
}
