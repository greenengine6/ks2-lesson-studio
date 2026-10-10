/* KS2 Lesson Engine: start-up, routing, header, dock, landing page and the Connect dialog. */
import './security.js';
import { $, $$, esc, icon, str, bus, prefs, hasKey, viaLink, setKey, forgetKey, testConnection, errorCopy, toast, copyOut, conn, reduceMotion, store } from './core.js';
import { Tubes } from './fx/tubes.js';
import { Dock } from './fx/dock.js';
import { CardSwap } from './fx/cardswap.js';
import { Symphony } from './fx/symphony.js';
import { ENGINES, ENGINE_BY_ID } from './engines/registry.js';
import { renderEngine, leaveEngine, wirePresent, setSymphony, exampleData, mountScreen, presentState } from './engines/shared.js';
import { initSlides, examplePreview, fitSlide, refitSlides } from './slides.js';
import { initSettings } from './settings.js';
import { initChat } from './chat.js';

const SLIDES = { id: 'slides', name: 'Slide Studio', color: 'violet', icon: 'slides', tagline: 'Your lesson builder: a topic becomes two-way lesson slides with answers, a plan and a PowerPoint.', chips: ['Any subject', 'About 1 minute', 'PowerPoint download'] };

/* ---------------- header ---------------- */
const top = $('#top');
function paintHeader() {
  const heroH = current === 'home' ? ($('#hero').offsetHeight || window.innerHeight) : 0;
  const onHero = current === 'home' && window.scrollY < heroH - 80;
  top.classList.toggle('on-hero', onHero);
  top.classList.toggle('solid', !onHero && (current !== 'home' || window.scrollY > 40));
  bus.emit('header', onHero);
}
window.addEventListener('scroll', paintHeader, { passive: true });
function paintMode() { $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === prefs.mode))); }
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-mode]');
  if (m) { prefs.mode = m.dataset.mode; paintMode(); toast(prefs.mode === 'online' ? 'Teaching online: prompts say “type in the chat”.' : 'Teaching in class: prompts say “show me on your whiteboard”.'); }
  if (e.target.closest('[data-connect]')) { e.preventDefault(); openConnect(); }
});
paintMode();
const menuBtn = $('#menu-btn'), mnav = $('#mnav');
menuBtn.addEventListener('click', () => { mnav.hidden = !mnav.hidden; menuBtn.setAttribute('aria-expanded', String(!mnav.hidden)); menuBtn.innerHTML = icon(mnav.hidden ? 'menu' : 'close'); });
mnav.addEventListener('click', (e) => { if (e.target.closest('a')) { mnav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.innerHTML = icon('menu'); } });

/* ---------------- dock ---------------- */
const go = (id) => { location.hash = id === 'home' ? '#/' : '#/' + id; };
const dockItems = [{ id: 'home', label: 'Home', icon: icon('home'), color: 'violet', onClick: () => go('home') }, { sep: true },
  { id: 'slides', label: 'Slide Studio', icon: icon('slides'), color: 'violet', onClick: () => go('slides') }]
  .concat(ENGINES.map((e) => ({ id: e.id, label: e.name, icon: icon(e.icon), color: e.color, onClick: () => go(e.id) })))
  .concat([{ sep: true }, { id: 'connect', label: 'Connect', icon: icon('key'), color: 'teal', onClick: () => openConnect() }]);
const dock = new Dock($('#dock'), dockItems, { base: 50, magnification: 80, distance: 200 });

/* ---------------- landing ---------------- */
function engineCards() {
  const card = (e, wide) => '<button type="button" class="ecard' + (wide ? ' wide' : '') + '" data-go="' + e.id + '" style="--c:var(--' + e.color + ')"><span class="ewell">' + icon(e.icon) + '</span>' +
    '<h3>' + esc(e.name) + '</h3><p>' + esc(e.tagline) + '</p><span class="etags">' + e.chips.slice(0, 2).map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</span><span class="go" aria-hidden="true">' + icon('right') + '</span></button>';
  $('#egrid').innerHTML = card(SLIDES, true) + ENGINES.map((e) => card(e)).join('');
  $$('#egrid [data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
}
let showcase = null;
function buildShowcase() {
  const picks = [['maths', 0, 'Live reasoning'], ['escape', 0, 'Crack the codes'], ['break', 0, 'Breathe with Symphony'], ['code', 0, 'Program the robot'], ['debate', 1, 'Live class vote']];
  const root = $('#cs-root');
  root.innerHTML = picks.map(([id, , cap]) => {
    const e = id === 'slides' ? SLIDES : ENGINE_BY_ID[id];
    return '<div class="cs-card" style="--c:var(--' + e.color + ')" data-go="' + id + '" role="link" tabindex="-1" aria-label="Open ' + esc(e.name) + '"><div class="cs-screen"></div><div class="cs-label">' + icon(e.icon) + esc(e.name) + '<span>' + esc(cap) + '</span></div></div>';
  }).join('');
  $$('.cs-card', root).forEach((card, k) => {
    const [id, screen] = picks[k];
    const host = $('.cs-screen', card);
    if (id === 'slides') { host.innerHTML = examplePreview(1); host.style.cssText = 'display:grid;place-items:center;padding:14px;background:var(--bg)'; requestAnimationFrame(() => fitSlide(host.firstElementChild)); return; }
    const eng = ENGINE_BY_ID[id];
    const board = document.createElement('div');
    host.appendChild(board);
    mountScreen(board, eng, exampleData(eng), screen, { still: true, present: false, go: () => {} });
    board.inert = true;
  });
  const rw = root.getBoundingClientRect().width || 470;
  showcase = new CardSwap(root, { cardDistance: Math.round(Math.min(40, rw * 0.085)), verticalDistance: Math.round(Math.min(44, rw * 0.094)), delay: 4200, pauseOnHover: true, skewAmount: 4, easing: 'elastic', onCardClick: (i) => go(picks[i][0]) });
}

let tubes = null, tubesTried = false, heroVisible = true;
function startTubes() {
  if (!tubesTried) {
    tubesTried = true;
    try {
      tubes = new Tubes($('#tubes'));
      const hero = $('#hero');
      new IntersectionObserver((en) => { heroVisible = en.some((x) => x.isIntersecting); if (current === 'home' && heroVisible) runTubes(); else if (tubes) tubes.stop(); }, { threshold: 0.02 }).observe(hero);
      hero.addEventListener('click', (e) => { if (e.target.closest('a,button')) return; tubes.nextPalette(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) tubes.stop(); else if (current === 'home' && heroVisible) runTubes(); });
    } catch (e) { tubes = null; $('#tubes').hidden = true; $('#hero-hint').hidden = true; }
  }
  runTubes();
}
function runTubes() { if (!tubes || presentState.open) return; if (reduceMotion()) tubes.still(); else tubes.start(); }

/* ---------------- routing ---------------- */
let current = '';
function show(id) {
  const eng = ENGINE_BY_ID[id];
  if (id !== 'home' && id !== 'slides' && !eng) id = 'home';
  const changed = id !== current;
  if (current && current !== 'home' && current !== 'slides' && changed) leaveEngine();
  current = id;
  $('#view-home').hidden = id !== 'home';
  $('#view-slides').hidden = id !== 'slides';
  $('#view-engine').hidden = !eng;
  if (id === 'home') { startTubes(); if (showcase && !reduceMotion()) showcase.start(); }
  else { if (tubes) tubes.stop(); if (showcase) showcase.stopTimer(); }
  if (eng && changed) renderEngine($('#view-engine'), eng);
  if (id === 'slides') refitSlides();
  dock.setActive(id);
  $$('.nav a, .mnav a').forEach((a) => { const on = a.getAttribute('href') === '#/' + (id === 'home' ? '' : id); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = id === 'home' ? 'KS2 Lesson Engine' : (eng ? eng.name : 'Slide Studio') + ' · KS2 Lesson Engine';
  if (changed) window.scrollTo({ top: 0, behavior: 'auto' });
  paintHeader();
}
function route() {
  const h = location.hash || '';
  if (h.startsWith('#/')) { show(h.slice(2).split(/[?#/&]/)[0] || 'home'); return; }
  if (!h || h === '#') { show('home'); return; }
  const target = document.getElementById(h.slice(1));
  if (current !== 'home') show('home');
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
window.addEventListener('hashchange', route);
bus.on('present', (on) => { $('#dock').hidden = on; if (on && tubes) tubes.stop(); if (!on && current === 'home') runTubes(); });

/* ---------------- Connect dialog ---------------- */
const modal = $('#connect');
let editing = false, lastFocus = null;
function paintConn() {
  const on = hasKey();
  $$('.conn').forEach((b) => { b.classList.toggle('on', on); const t = $('.ctext', b); if (t) t.textContent = on ? 'Connected' : 'Connect'; });
  dock.setBadge('connect', !on);
  $('#k-status').hidden = !on;
  $('#k-status-text').textContent = viaLink() ? 'Connected through your private link' : 'This device is connected';
  $('#k-change').hidden = viaLink();
  $('#k-form').hidden = on && !editing;
  $('#k-share').hidden = !on || viaLink();
  $('#k-intro').textContent = on ? 'Everything is ready. The key is saved in this browser only.' : 'Connect once on this device and every engine works. The key is saved in this browser only, never on the website.';
}
function openConnect() {
  lastFocus = document.activeElement;
  editing = false; modal.hidden = false; paintConn();
  notice('', false);
  requestAnimationFrame(() => (hasKey() ? $('#k-close') : $('#k-key')).focus());
}
function closeConnect() { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function notice(msg, err) { const n = $('#k-notice'); n.textContent = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }
$('#k-close').addEventListener('click', closeConnect);
modal.addEventListener('click', (e) => { if (e.target === modal) closeConnect(); });
$('#k-change').addEventListener('click', () => { editing = true; paintConn(); $('#k-key').focus(); });
$('#k-forget').addEventListener('click', () => { forgetKey(); editing = true; paintConn(); toast('This device is disconnected.'); });
$('#k-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = str($('#k-key').value);
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(v)) { notice('That does not look like a key. Keys start with sk-ant-.', true); return; }
  const btn = $('#k-save');
  btn.disabled = true; btn.textContent = 'Testing the key…';
  try {
    await testConnection(v);
    setKey(v); $('#k-key').value = ''; editing = false; notice('', false); paintConn();
    toast('This device is connected. Every engine is ready.');
    setTimeout(closeConnect, 700);
  } catch (err) { notice(errorCopy(err && err.code), true); }
  finally { btn.disabled = false; btn.textContent = 'Save and test'; }
});
$('#k-share').addEventListener('click', () => {
  const key = store.get('ks2-lesson-studio.key.v1');
  if (!key) return;
  const link = location.origin + location.pathname + '#key=' + key;
  copyOut('<a href="' + esc(link) + '">' + esc(link) + '</a>', link, 'Setup link copied. Send it privately, then delete the message once it has been opened.');
});
bus.on('key', paintConn);
bus.on('need-key', () => openConnect());
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#fallback').hidden) { $('#fallback').hidden = true; return; }
  if (!modal.hidden) { closeConnect(); return; }
  if (!mnav.hidden) { menuBtn.click(); }
});
$('#fb-close').addEventListener('click', () => { $('#fallback').hidden = true; });

/* ---------------- start ---------------- */
const sym = new Symphony();
setSymphony(sym);
initSettings();
initChat();
wirePresent();
initSlides();
engineCards();
buildShowcase();
paintConn();
route();
if (conn.keyFromLink || conn.joinedNow) {
  testConnection().then(() => toast('This device is connected. Every engine is ready.'), (err) => {
    const code = err && err.code;
    if (code === 'bad_key' || code === 'bad_access') forgetKey();
    toast(errorCopy(code));
    openConnect();
  });
}
