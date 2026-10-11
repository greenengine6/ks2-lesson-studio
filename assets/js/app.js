/* KS2 Lesson Engine: start-up, routing, header, dock, landing page and the Connect dialog. */
import './security.js?v=a20ebde2';
import { $, $$, esc, icon, str, bus, prefs, hasKey, viaLink, setKey, forgetKey, testConnection, errorCopy, toast, copyOut, conn, reduceMotion, store } from './core.js?v=a20ebde2';
import { Dock } from './fx/dock.js?v=a20ebde2';
import { CardSwap } from './fx/cardswap.js?v=a20ebde2';
import { Symphony } from './fx/symphony.js?v=a20ebde2';
import { ENGINES, ENGINE_BY_ID } from './engines/registry.js?v=a20ebde2';
import { renderEngine, leaveEngine, wirePresent, setSymphony, exampleData, mountScreen, presentState } from './engines/shared.js?v=a20ebde2';
import { initSlides, examplePreview, fitSlide, refitSlides, enterSlides, slidesPresentInfo } from './slides.js?v=a20ebde2';
import { initSettings } from './settings.js?v=a20ebde2';
import { initChat } from './chat.js?v=a20ebde2';
import { track } from './track.js?v=a20ebde2';
import { initPeople, who, isAdmin, requireAdmin } from './people.js?v=a20ebde2';
import { initFeedback } from './feedback.js?v=a20ebde2';
import { renderAdmin } from './admin.js?v=a20ebde2';
import { initPlay } from './play.js?v=a20ebde2';
import { initSync } from './sync.js?v=a20ebde2';
import { sfx } from './fx/audio.js?v=a20ebde2';
import { landed } from './guard.js?v=a20ebde2';
import { initShelf, renderShelf } from './shelf.js?v=a20ebde2';
import { wireLiveChip } from './live/panel.js?v=a20ebde2';
import { initHow } from './howto.js?v=a20ebde2';
import { initFractions } from './fractions.js?v=a20ebde2';

const PLAY = { id: 'play', name: 'Wonder Window', color: 'cyan', icon: 'globe', tagline: 'For the whole class: a live world map of cities and their food, festivals, the Seven Wonders, wild weather, the seasons, habitats from the rainforest to the poles, and space.', chips: ['17 windows', 'Quizzes and class votes', 'Shared screen'] };
const SLIDES = { id: 'slides', name: 'Slide Studio', color: 'violet', icon: 'slides', tagline: 'Your lesson builder: a topic becomes two-way lesson slides with answers, a plan and a PowerPoint.', chips: ['Any subject', 'About 1 minute', 'PowerPoint download'] };
const LKIE = { id: 'lkie', name: 'lkie.like', color: 'heart', icon: 'pack', tagline: 'One topic in, a whole lesson out: slides with exact diagrams, key words, activities and a worksheet in three tiers, for every KS2 subject.', chips: ['All KS2 subjects', 'Bahasa Melayu and Mandarin'] };

/* ---------------- header ---------------- */
const top = $('#top');
function paintHeader() {
  const heroH = current === 'home' ? ($('#hero').offsetHeight || window.innerHeight) : 0;
  const onHero = current === 'home' && window.scrollY < heroH - 80;
  top.classList.toggle('on-hero', onHero);
  top.classList.toggle('solid', !onHero && (current !== 'home' || window.scrollY > 40));
  top.classList.toggle('glass', onHero && window.scrollY > 40);           // dark glass, so text scrolling under it stays readable
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
const go = (id) => { sfx('nav'); location.hash = id === 'home' ? '#/' : '#/' + id; };
const dockItems = [{ id: 'home', label: 'Home', icon: icon('home'), color: 'violet', onClick: () => go('home') }, { sep: true },
  { id: 'slides', label: 'Slide Studio', icon: icon('slides'), color: 'violet', onClick: () => go('slides') }, { id: 'lkie', label: 'lkie.like', icon: icon('pack'), color: 'heart', onClick: () => go('lkie') }, { id: 'play', label: 'Wonder Window', icon: icon('globe'), color: 'cyan', onClick: () => go('play') }]
  .concat(ENGINES.map((e) => ({ id: e.id, label: e.name, icon: icon(e.icon), color: e.color, onClick: () => go(e.id) })));
const dock = new Dock($('#dock'), dockItems, { base: 50, magnification: 80, distance: 200 });

/* ---------------- landing ---------------- */
function engineCards() {
  const card = (e, wide) => '<button type="button" class="ecard' + (wide ? ' wide' : '') + '" data-go="' + e.id + '" style="--c:var(--' + e.color + ')"><span class="ewell">' + icon(e.icon) + '</span>' +
    '<h3>' + esc(e.name) + '</h3><p>' + esc(e.tagline) + '</p><span class="etags">' + e.chips.slice(0, 2).map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</span><span class="go" aria-hidden="true">' + icon('right') + '</span></button>';
  $('#egrid').innerHTML = card(SLIDES, true) + card(LKIE, true) + ENGINES.map((e) => card(e)).join('') + card(PLAY, true);
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

/* ---------------- the Earth behind the landing page (fx/earth.js, loaded after the page is up) ---------------- */
let earth = null, earthTried = false;
function earthTip() {
  const tip = $('#hero-hint');
  if (!tip || !earth) return;
  const span = $('span', tip), coarse = window.matchMedia('(pointer: coarse)').matches;
  const say = (t, act) => { span.textContent = t; tip.hidden = false; tip.classList.toggle('act', !!act); };
  if (!coarse) say('Drag to spin the Earth');
  else if (earth.tiltNeedsTap) say('Tap here, then tilt your phone', true);
  else if (earth.gyroOn) { say('Tilt your phone to look around'); setTimeout(() => { tip.hidden = true; }, 6000); }
  else say('Swipe sideways to spin the Earth');
}
function startEarth() {
  if (earthTried) { runEarth(); return; }
  earthTried = true;
  const hero = $('#hero'), fail = () => { earth = null; hero.classList.add('earth-off'); const t = $('#hero-hint'); if (t) t.hidden = true; };
  import('./fx/earth.js?v=a20ebde2').then(async (m) => {
    earth = new m.Earth($('#earth'), { onFail: fail });
    if (!(await earth.init())) return;
    earthTip();
    runEarth();
  }).catch(fail);
  $('#hero-hint').addEventListener('click', async () => {
    if (!earth || !earth.tiltNeedsTap) return;
    const ok = await earth.enable();
    const span = $('#hero-hint span');
    span.textContent = ok ? 'Tilt your phone to look around' : 'Swipe sideways to spin the Earth';
    $('#hero-hint').classList.remove('act');
    setTimeout(() => { $('#hero-hint').hidden = true; }, 5000);
  });
  $('#earth').addEventListener('click', () => { if (earth && earth.tiltNeedsTap) $('#hero-hint').click(); });
}
function runEarth() {
  if (!earth || presentState.open || current !== 'home' || document.body.classList.contains('vmode-on')) return;
  if (reduceMotion()) earth.render(0); else earth.loop();
}

/* ---------------- routing ---------------- */
let current = '';
const PAGES = ['home', 'slides', 'lkie', 'admin', 'play'];
/* lkie.like loads the first time it is opened, so the landing page stays light. */
let lkie = null;
function showLkie() {
  if (lkie) { lkie.mountLkie($('#view-lkie')); return; }
  import('./lkie/lkie.js?v=a20ebde2').then((m) => { lkie = m; if (current === 'lkie') m.mountLkie($('#view-lkie')); }).catch(() => { $('#view-lkie').innerHTML = '<div class="wrap"><p class="notice err">lkie.like could not load. Check the connection and reload the page.</p></div>'; });
}
function show(id) {
  if (!who.role) id = 'home';
  if (id === 'admin' && !requireAdmin(() => { location.hash = '#/admin'; route(); })) {
    id = current && current !== 'admin' ? current : 'home';
    try { history.replaceState(null, '', id === 'home' ? location.pathname + location.search : '#/' + id); } catch (e) { /* ignore */ }
  }
  let eng = ENGINE_BY_ID[id];
  if (!PAGES.includes(id) && !eng) { id = 'home'; eng = null; }
  const changed = id !== current;
  if (changed) landed();                // the tap that opened this page cannot also press a button on it (guard.js)
  if (current && ENGINE_BY_ID[current] && changed) leaveEngine();
  if (current === 'play' && changed) bus.emit('play', false);
  current = id;
  $('#view-home').hidden = id !== 'home';
  $('#view-slides').hidden = id !== 'slides';
  $('#view-engine').hidden = !eng;
  $('#view-admin').hidden = id !== 'admin';
  $('#view-play').hidden = id !== 'play';
  $('#view-lkie').hidden = id !== 'lkie';
  if (id === 'lkie' && changed) showLkie();
  if (id === 'admin') renderAdmin($('#view-admin'));
  if (id === 'play' && changed) bus.emit('play', true);
  if (changed && who.role) track('view', { page: id });
  if (id === 'home') { startEarth(); if (showcase && !reduceMotion()) showcase.start(); if (changed) renderShelf(); }
  else { if (earth) earth.stop(); if (showcase) showcase.stopTimer(); }
  if (eng && changed) renderEngine($('#view-engine'), eng);
  if (id === 'slides') { if (changed) enterSlides(); else refitSlides(); }
  dock.setActive(id);
  $$('.nav a, .mnav a').forEach((a) => { const on = a.getAttribute('href') === '#/' + (id === 'home' ? '' : id); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = id === 'home' ? 'KS2 Lesson Engine' : (eng ? eng.name : ({ slides: 'Slide Studio', lkie: 'lkie.like', admin: 'Dashboard', play: 'Wonder Window' })[id]) + ' · KS2 Lesson Engine';
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
bus.on('present', (on) => { $('#dock').hidden = on; if (on && earth) earth.stop(); if (!on) runEarth(); });
bus.on('vmode', (on) => { if (on && earth) earth.stop(); if (!on) runEarth(); });
bus.on('who', (w) => { if (!w || !w.role) { if (current && ENGINE_BY_ID[current]) leaveEngine(); show('home'); } else route(); paintHeader(); });
$('#pr-ticket').addEventListener('click', () => {
  const P = presentState; if (!P.open) return;
  const d = P.item.data;
  bus.emit('ticket', { host: $('#present'), eng: P.eng.id, title: P.eng.presentTitle ? P.eng.presentTitle(d) : P.eng.title(d), screens: P.eng.screens(d).map((x) => x.title) });
});
$('#spr-ticket').addEventListener('click', () => { const info = slidesPresentInfo(); if (info) bus.emit('ticket', Object.assign({ host: $('#spresent') }, info)); });

/* ---------------- Connect dialog ---------------- */
const modal = $('#connect');
let editing = false, lastFocus = null;
function paintConn() {
  const on = hasKey();
  $$('.conn').forEach((b) => { b.classList.toggle('on', on); const t = $('.ctext', b); if (t) t.textContent = on ? 'Connected' : 'Connect'; });
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
/* No engine key on this device yet. Teachers get it from their personal link, so only the admin is offered Connect. */
bus.on('need-key', () => { if (isAdmin()) openConnect(); });
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
initFeedback();
initPlay();
initSync();
wirePresent();
initSlides();
initShelf();
engineCards();
buildShowcase();
paintConn();
initPeople();
wireLiveChip();
initHow();
initFractions();
route();
if (conn.keyFromLink || conn.joinedNow) {
  testConnection().then(() => toast('This device is connected. Every engine is ready.'), (err) => {
    const code = err && err.code;
    if (code === 'bad_key' || code === 'bad_access') forgetKey();
    toast(errorCopy(code));
    openConnect();
  });
}
