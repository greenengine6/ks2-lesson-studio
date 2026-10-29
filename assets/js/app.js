/* KS2 Lesson Engine: start-up, routing, the shell (a sidebar of places on laptops, five tabs on phones, a slim top
   bar with one search for everything), the sign-in page's Earth, and the Connect dialog.
   Pages load the first time they are opened (LAZY below); each exports mount(view, sub) and maybe leave(). */
import './security.js?v=73f756c9';
import { $, $$, esc, icon, str, bus, prefs, hasKey, viaLink, setKey, forgetKey, testConnection, errorCopy, toast, copyOut, conn, reduceMotion, store } from './core.js?v=73f756c9';
import { Symphony } from './fx/symphony.js?v=73f756c9';
import { ENGINE_BY_ID } from './engines/registry.js?v=73f756c9';
import { renderEngine, leaveEngine, wirePresent, setSymphony, presentState } from './engines/shared.js?v=73f756c9';
import { initSlides, refitSlides, enterSlides, slidesPresentInfo } from './slides.js?v=73f756c9';
import { initSettings } from './settings.js?v=73f756c9';
import { initChat } from './chat.js?v=73f756c9';
import { track } from './track.js?v=73f756c9';
import { initPeople, who, isAdmin, requireAdmin } from './people.js?v=73f756c9';
import { initFeedback } from './feedback.js?v=73f756c9';
import { renderAdmin } from './admin.js?v=73f756c9';
import { initPlay } from './play.js?v=73f756c9';
import { initSync } from './sync.js?v=73f756c9';
import { sfx } from './fx/audio.js?v=73f756c9';
import { landed } from './guard.js?v=73f756c9';
import { initShelf } from './shelf.js?v=73f756c9';
import { wireLiveChip } from './live/panel.js?v=73f756c9';
import { Live, onLive, pupilsIn } from './live/session.js?v=73f756c9';
import { initHow } from './howto.js?v=73f756c9';
import { initFractions } from './fractions.js?v=73f756c9';
import { voiceKey, setVoiceKey, testKey, KEY_RX, onWarn } from './fx/human.js?v=73f756c9';
import { Voice } from './fx/voice.js?v=73f756c9';
import { initReading } from './reading.js?v=73f756c9';
import { search, subjectName, subjectColor, KINDS, openItem, counts, SUBJECT_LIST, onLibrary, soon } from './library.js?v=73f756c9';

/* ---------------- the places ---------------- */
const NAV = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'calendar', label: 'Calendar', icon: 'cal' },
  { id: 'subjects', label: 'My subjects', icon: 'folder' },
  { id: 'create', label: 'Create', icon: 'spark' },
  { id: 'class', label: 'Classroom', icon: 'users' },
  { id: 'tools', label: 'Class tools', icon: 'clock' },
  { id: 'explore', label: 'Explore', icon: 'globe' }
];
const FOOT = [{ id: 'settings', label: 'Settings', icon: 'gear' }, { id: 'help', label: 'Help', icon: 'info' }];
const TABS = [{ id: 'today', label: 'Today', icon: 'sun' }, { id: 'calendar', label: 'Calendar', icon: 'cal' }, { id: 'subjects', label: 'Subjects', icon: 'folder' }, { id: 'create', label: 'Create', icon: 'spark' }];
const CREATE_SUB = [['lkie', 'Lesson slides'], ['worksheet', 'Worksheet'], ['quiz', 'Quiz'], ['game', 'Game'], ['create/starters', 'Lesson starters'], ['slides', 'Two-way slides']];
const LAZY = {
  today: () => import('./today.js?v=73f756c9'),
  calendar: () => import('./calendar.js?v=73f756c9'),
  subjects: () => import('./subjects.js?v=73f756c9'),
  create: () => import('./create.js?v=73f756c9'),
  class: () => import('./live/class.js?v=73f756c9'),
  tools: () => import('./tools/tools.js?v=73f756c9'),
  explore: () => import('./explore.js?v=73f756c9'),
  settings: () => import('./settingspage.js?v=73f756c9'),
  help: () => import('./help.js?v=73f756c9'),
  worksheet: () => import('./worksheet/maker.js?v=73f756c9'),
  quiz: () => import('./quiz/maker.js?v=73f756c9'),
  game: () => import('./games/maker.js?v=73f756c9')
};
const TITLES = { today: 'Today', calendar: 'Calendar', subjects: 'My subjects', create: 'Create', class: 'Classroom', tools: 'Class tools', explore: 'Explore', settings: 'Settings', help: 'Help',
  worksheet: 'Worksheet maker', quiz: 'Quiz maker', game: 'Game maker', slides: 'Slide Studio', lkie: 'Lesson slides', admin: 'Dashboard', play: 'Wonder Window' };
/* Which place in the menu each page belongs to. */
function sectionOf(id) {
  if (['lkie', 'slides', 'worksheet', 'quiz', 'game', 'create'].includes(id) || ENGINE_BY_ID[id]) return 'create';
  if (id === 'play') return 'explore';
  return id;
}
const OLD = ['home', 'slides', 'lkie', 'admin', 'play'];

/* ---------------- the sidebar, the phone tabs and the More sheet ---------------- */
function navLink(n, cur) {
  return '<a class="side-a" href="#/' + n.id + '" data-nav="' + n.id + '"' + (cur === n.id ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span>' + (soon(n.id) ? '<small class="side-soon">Soon</small>' : '') + '</a>';
}
function subLinks(sec, id, sub) {
  if (sec === 'create') {
    return '<div class="side-sub">' + CREATE_SUB.map(([h, l]) => {
      const on = h === id || (h === 'create/starters' && id === 'create' && sub === 'starters') || (h === 'create/starters' && ENGINE_BY_ID[id]);
      return '<a href="#/' + h + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(l) + '</a>';
    }).join('') + '</div>';
  }
  if (sec === 'subjects') {
    const c = counts(), list = SUBJECT_LIST.filter((s) => c[s.id]).sort((a, b) => c[b.id] - c[a.id]).slice(0, 8);
    if (!list.length) return '';
    return '<div class="side-sub">' + list.map((s) => '<a href="#/subjects/' + s.id + '" style="--c:' + subjectColor(s.id) + '"' + (id === 'subjects' && sub === s.id ? ' aria-current="page"' : '') + '><span class="dot" aria-hidden="true"></span>' + esc(s.short) + '</a>').join('') + '</div>';
  }
  if (sec === 'explore') return '<div class="side-sub"><a href="#/play"' + (id === 'play' ? ' aria-current="page"' : '') + '>Wonder Window</a></div>';
  return '';
}
function paintNav() {
  const id = current, sub = currentSub, sec = sectionOf(id);
  $('#side-nav').innerHTML = NAV.map((n) => navLink(n, sec) + (sec === n.id ? subLinks(sec, id, sub) : '')).join('');
  $('#side-foot').innerHTML = (isAdmin() ? navLink({ id: 'admin', label: 'Dashboard', icon: 'layers' }, sec) : '') + FOOT.map((n) => navLink(n, sec)).join('') + startBtn();
  $('#tabs').innerHTML = TABS.map((t) => '<a class="tab" href="#/' + t.id + '"' + (sec === t.id ? ' aria-current="page"' : '') + '>' + icon(t.icon) + '<span>' + esc(t.label) + '</span></a>').join('') +
    '<button type="button" class="tab" id="tab-more" aria-expanded="' + String(!$('#mnav').hidden) + '" aria-controls="mnav">' + icon('menu') + '<span>More</span></button>';
  const more = [{ id: 'class', label: 'Classroom', icon: 'users' }, { id: 'tools', label: 'Class tools', icon: 'clock' }, { id: 'explore', label: 'Explore', icon: 'globe' }].concat(FOOT);
  $('#mnav-links').innerHTML = more.map((n) => '<a href="#/' + n.id + '"' + (sec === n.id ? ' aria-current="page"' : '') + '>' + icon(n.icon) + esc(n.label) + (soon(n.id) ? '<small class="side-soon">Soon</small>' : '') + '</a>').join('');
  // on a short screen the menu scrolls: keep the page she is on in view, and fade the edge when there is more below
  const nav = $('#side-nav'), on = $$('[aria-current="page"]', nav).pop();
  if (on && nav.scrollHeight > nav.clientHeight + 2) {
    const r = on.getBoundingClientRect(), b = nav.getBoundingClientRect();
    if (r.bottom > b.bottom || r.top < b.top) nav.scrollTop += r.top - b.top - (b.height - r.height) / 2;
  }
  navFade();
}
function navFade() {
  const nav = $('#side-nav');
  if (nav) nav.classList.toggle('fade-b', nav.scrollTop + nav.clientHeight < nav.scrollHeight - 4);
}
$('#side-nav').addEventListener('scroll', navFade, { passive: true });
window.addEventListener('resize', navFade, { passive: true });
function startBtn() {
  if (soon('class')) return '';
  if (Live.on) { const n = pupilsIn().length; return '<a class="side-start live" href="#/class"><i aria-hidden="true"></i><span>Class live · ' + n + '</span></a>'; }
  return '<a class="side-start" href="#/class">' + icon('play') + '<span>Start class</span></a>';
}
onLive(() => { if (who.role) { const f = $('#side-foot'); if (f) { const b = $('.side-start', f); if (b) b.outerHTML = startBtn(); } } });
const mnav = $('#mnav');
function setMore(open) {
  mnav.hidden = !open;
  const b = $('#tab-more'); if (b) b.setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e) => {
  if (e.target.closest('#tab-more')) { setMore(mnav.hidden); return; }
  if (!mnav.hidden && (e.target.closest('#mnav a') || (!e.target.closest('#mnav') && !e.target.closest('#tab-more')))) setMore(false);
});
const menuBtn = $('#menu-btn');
menuBtn.addEventListener('click', () => setMore(mnav.hidden));

/* ---------------- one search for everything ---------------- */
const PAGES_FIND = [
  ['Today', '#/today', 'sun'], ['Calendar', '#/calendar', 'cal'], ['My subjects', '#/subjects', 'folder'], ['Create', '#/create', 'spark'], ['Lesson slides', '#/lkie', 'pack'],
  ['Worksheet maker', '#/worksheet', 'sheet'], ['Quiz maker', '#/quiz', 'quiz'], ['Game maker', '#/game', 'game'], ['Lesson starters', '#/create/starters', 'spark'], ['Classroom: start a class', '#/class', 'users'],
  ['Class tools', '#/tools', 'clock'], ['Timer', '#/tools/timer', 'clock'], ['Pick a name', '#/tools/names', 'users'], ['Groups', '#/tools/groups', 'users'], ['Noise meter', '#/tools/noise', 'volume'],
  ['Work signs', '#/tools/signs', 'flag'], ['Class points', '#/tools/points', 'star'], ['Dice', '#/tools/dice', 'vote'], ['Wonder Window', '#/play', 'globe'], ['Explore', '#/explore', 'globe'],
  ['Settings', '#/settings', 'gear'], ['Reading support', '#/settings/reading', 'type'], ['Help', '#/help', 'info'], ['Two-way slides (Slide Studio)', '#/slides', 'slides']
];
const ts = $('#top-search'), tq = $('#ts-q'), tl = $('#ts-list');
let tsSel = -1;
function tsItems() {
  const q = str(tq.value).toLowerCase();
  if (!q) return [];
  const pages = PAGES_FIND.filter(([n]) => n.toLowerCase().includes(q)).slice(0, 4).map(([n, h, ic]) => ({ t: n, s: 'Page', h, ic, c: 'var(--accent)' }));
  const items = search(q).slice(0, 8).map((it) => ({ t: it.title, s: it.long + ' · ' + subjectName(it.subject, true) + (it.year ? ' · ' + it.year : ''), key: it.key, ic: it.icon || KINDS[it.k].icon, c: subjectColor(it.subject) }));
  return pages.concat(items);
}
function tsPaint() {
  const list = tsItems(), q = str(tq.value);
  tsSel = Math.min(tsSel, list.length - 1);
  tl.hidden = !q;
  tq.setAttribute('aria-expanded', String(!!q));
  if (!q) { tl.innerHTML = ''; return; }
  tl.innerHTML = list.length ? list.map((r, i) => '<button type="button" class="ts-it' + (i === tsSel ? ' on' : '') + '" role="option" data-i="' + i + '" style="--c:' + r.c + '"><span class="ts-k">' + icon(r.ic) + '</span><span class="ts-t"><b>' + esc(r.t) + '</b><small>' + esc(r.s) + '</small></span></button>').join('')
    : '<p class="ts-none">Nothing found for “' + esc(q) + '”. Try a topic, a subject or a year.</p>';
  tl._list = list;
}
function tsGo(r) {
  if (!r) return;
  tq.value = ''; tsPaint(); tq.blur(); ts.classList.remove('open');
  if (r.key) openItem(r.key); else location.hash = r.h;
}
tq.addEventListener('input', () => { tsSel = 0; tsPaint(); });
tq.addEventListener('keydown', (e) => {
  const list = tl._list || [];
  if (e.key === 'ArrowDown') { e.preventDefault(); tsSel = Math.min(list.length - 1, tsSel + 1); tsPaint(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); tsSel = Math.max(0, tsSel - 1); tsPaint(); }
  else if (e.key === 'Enter') { e.preventDefault(); tsGo(list[Math.max(0, tsSel)]); }
  else if (e.key === 'Escape') { e.stopPropagation(); tq.value = ''; tsPaint(); tq.blur(); ts.classList.remove('open'); }
});
tl.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) tsGo((tl._list || [])[Number(b.dataset.i)]); });
$('.ts-box', ts).addEventListener('click', () => { if (window.matchMedia('(max-width: 899px)').matches && !ts.classList.contains('open')) { ts.classList.add('open'); setTimeout(() => tq.focus(), 30); } });
document.addEventListener('click', (e) => { if (!e.target.closest('#top-search')) { if (!tl.hidden) { tl.hidden = true; } ts.classList.remove('open'); } });
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !who.role || presentState.open) return;
  if (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  e.preventDefault(); tq.focus();
});
onLibrary(() => { if (!tl.hidden) tsPaint(); if (who.role && sectionOf(current) === 'subjects') paintNav(); });

/* ---------------- header ---------------- */
const top = $('#top');
function paintHeader() {
  const gated = !who.role;
  const heroH = gated ? ($('#hero').offsetHeight || window.innerHeight) : 0;
  const onHero = gated && window.scrollY < heroH - 80;
  top.classList.toggle('on-hero', onHero);
  top.classList.toggle('solid', !onHero);
  top.classList.toggle('glass', onHero && window.scrollY > 40);           // dark glass, so text scrolling under it stays readable
  bus.emit('header', onHero);
}
window.addEventListener('scroll', paintHeader, { passive: true });
function paintMode() { $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === prefs.mode))); }
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-mode]');
  if (m) { prefs.mode = m.dataset.mode; paintMode(); toast(prefs.mode === 'online' ? 'Teaching online: prompts say “type in the chat”.' : 'Teaching in class: prompts say “show me on your whiteboard”.'); }
  if (e.target.closest('[data-connect]')) { e.preventDefault(); openConnect(); }
  if (e.target.closest('[data-ask-symphony]')) { e.preventDefault(); bus.emit('symphony', {}); }
});
paintMode();
function paintShell() {
  const on = !!who.role;
  document.body.classList.toggle('shell-on', on);
  $('#side').hidden = !on; $('#tabs').hidden = !on; ts.hidden = !on;
  if (on) paintNav();
}

/* ---------------- the Earth behind the sign-in page (fx/earth.js, loaded after the page is up) ---------------- */
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
  import('./fx/earth.js?v=73f756c9').then(async (m) => {
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
let current = '', currentSub = '';
const mods = {};
/* lkie.like loads the first time it is opened. */
let lkie = null;
function showLkie() {
  if (lkie) { lkie.mountLkie($('#view-lkie')); return; }
  import('./lkie/lkie.js?v=73f756c9').then((m) => { lkie = m; if (current === 'lkie') m.mountLkie($('#view-lkie')); }).catch(() => { $('#view-lkie').innerHTML = '<div class="wrap"><p class="notice err">Lesson slides could not load. Check the connection and reload the page.</p></div>'; });
}
function viewFor(id) {
  let v = document.getElementById('view-' + id);
  if (!v) { v = document.createElement('div'); v.id = 'view-' + id; v.className = 'view'; v.dataset.page = id; $('#pages').appendChild(v); }
  return v;
}
function mountLazy(id, sub) {
  const v = viewFor(id);
  if (mods[id]) { try { mods[id].mount(v, sub); } catch (e) { console.error(e); } return; }
  if (!v.firstChild) v.innerHTML = '<div class="pg-loading" role="status">Opening…</div>';
  LAZY[id]().then((m) => {
    mods[id] = m;
    if (current !== id) return;
    const l = v.querySelector(':scope > .pg-loading'); if (l) l.remove();
    try { m.mount(v, currentSub); } catch (e) { console.error(e); }
  }).catch((e) => {
    console.error(e);
    if (current !== id) return;
    v.innerHTML = '<div class="pg-missing" role="status">' + icon('spark') + '<b>' + (id === 'class' ? 'The Classroom is on its way' : 'This part is on its way') + '</b><p>' + (id === 'class' ? 'Live classes on pupils’ devices (a register, the lesson flow, quick checks, a live check of every pupil, homework and a summary) come in the next update. Until then, press Join while you present for a live lesson.' : 'It is being added to the site right now. Try again a little later.') + '</p><a class="btn" href="#/today">Back to Today</a></div>';
  });
}
function show(id, sub) {
  sub = sub || '';
  if (!who.role) { id = 'home'; sub = ''; }
  else if (id === 'home' || !id) id = 'today';
  if (id === 'admin' && !requireAdmin(() => { location.hash = '#/admin'; route(); })) {
    id = current && current !== 'admin' ? current : (who.role ? 'today' : 'home');
    try { history.replaceState(null, '', '#/' + (id === 'home' ? '' : id)); } catch (e) { /* ignore */ }
  }
  let eng = ENGINE_BY_ID[id];
  if (!OLD.includes(id) && !eng && !LAZY[id]) { id = who.role ? 'today' : 'home'; eng = null; sub = ''; }
  const changed = id !== current;
  const was = current;
  if (changed) landed();                // the tap that opened this page cannot also press a button on it (guard.js)
  if (was && ENGINE_BY_ID[was] && changed) leaveEngine();
  if (was === 'play' && changed) bus.emit('play', false);
  if (changed && mods[was] && mods[was].leave) { try { mods[was].leave(); } catch (e) { console.error(e); } }
  current = id; currentSub = sub;
  $('#view-home').hidden = id !== 'home';
  $('#view-slides').hidden = id !== 'slides';
  $('#view-engine').hidden = !eng;
  $('#view-admin').hidden = id !== 'admin';
  $('#view-play').hidden = id !== 'play';
  $('#view-lkie').hidden = id !== 'lkie';
  $$('#pages > .view').forEach((v) => { v.hidden = v.dataset.page !== id; });
  $('#pages').hidden = !LAZY[id];                     // the older pages (lessons, starters, Wonder Window) sit outside it
  if (LAZY[id]) { viewFor(id).hidden = false; mountLazy(id, sub); }
  // the same page asked again (search or My subjects opening another saved lesson): open what was asked for
  const asked = (k) => { try { return !!sessionStorage.getItem(k); } catch (e) { return false; } };
  if (id === 'lkie' && (changed || !lkie)) showLkie(); else if (id === 'lkie') lkie.enterLkie();
  if (id === 'admin') renderAdmin($('#view-admin'));
  if (id === 'play' && changed) bus.emit('play', true);
  if (changed && who.role) track('view', { page: id });
  if (changed && was && who.role) sfx('nav');
  if (id === 'home') startEarth(); else if (earth) earth.stop();
  if (eng && (changed || asked('ks2-engine.eng.open'))) renderEngine($('#view-engine'), eng);
  if (id === 'slides') { if (changed || asked('ks2-engine.slides.open')) enterSlides(); else refitSlides(); }
  if (who.role) paintNav();
  document.title = id === 'home' ? 'KS2 Lesson Engine' : (eng ? eng.name : TITLES[id] || 'KS2 Lesson Engine') + ' · KS2 Lesson Engine';
  if (changed) window.scrollTo({ top: 0, behavior: 'auto' });
  paintHeader();
}
function route() {
  const h = location.hash || '';
  if (h.startsWith('#/')) {
    const m = /^#\/([\w-]*)(?:\/([^?#]*))?/.exec(h);
    let sub = '';
    try { sub = m && m[2] ? decodeURIComponent(m[2]) : ''; } catch (e) { sub = m && m[2] ? m[2] : ''; }
    show((m && m[1]) || 'home', sub);
    return;
  }
  if (!h || h === '#') { show('home'); return; }
  // older links to the landing page's sections
  if (h === '#engines') { location.replace('#/create/starters'); return; }
  if (h === '#shelf') { location.replace('#/subjects'); return; }
  show('home');
}
window.addEventListener('hashchange', route);
bus.on('present', (on) => { if (on && earth) earth.stop(); if (!on) runEarth(); });
bus.on('vmode', (on) => { if (on && earth) earth.stop(); if (!on) runEarth(); });
bus.on('who', (w) => {
  if (!w || !w.role) { if (current && ENGINE_BY_ID[current]) leaveEngine(); paintShell(); show('home'); } else { paintShell(); route(); }
  paintHeader();
  if (w && w.role === 'teacher') import('./calendar.js?v=73f756c9').then((m) => m.startReminders()).catch(() => { /* no calendar yet */ });
});
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
  paintVoice();
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
  const vk = voiceKey();
  const link = location.origin + location.pathname + '#key=' + key + (vk ? '&vkey=' + vk : '');
  copyOut('<a href="' + esc(link) + '">' + esc(link) + '</a>', link, 'Setup link copied. Send it privately, then delete the message once it has been opened.');
});
bus.on('key', paintConn);

/* Symphony's human voice (fx/human.js): a voice key from platform.openai.com, tested with one word before it is saved. */
let vEditing = false;
function paintVoice() {
  const on = !!voiceKey();
  $('#kv-status').hidden = !on;
  $('#kv-status-text').textContent = on ? 'Human voice on' + (Voice.human('en-GB') ? ': ' + Voice.name('en-GB') : '') : '';
  $('#kv-form').hidden = on && !vEditing;
}
function vNotice(msg, err) { const n = $('#kv-notice'); n.textContent = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }
$('#kv-change').addEventListener('click', () => { vEditing = true; paintVoice(); $('#kv-key').focus(); });
$('#kv-forget').addEventListener('click', () => { setVoiceKey(''); vEditing = false; vNotice('', false); paintVoice(); toast('Symphony will use this device’s own voice.'); });
$('#kv-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = str($('#kv-key').value);
  if (/^sk-ant-/.test(v)) { vNotice('That is the engine key. The voice key comes from platform.openai.com and starts with sk- (often sk-proj-).', true); return; }
  if (!KEY_RX.test(v)) { vNotice('That does not look like a voice key. It starts with sk-.', true); return; }
  const btn = $('#kv-save');
  btn.disabled = true; btn.textContent = 'Testing her voice…';
  const err = await testKey(v);
  btn.disabled = false; btn.textContent = 'Save and test';
  if (err) {
    vNotice(err === 'bad_key' ? 'The voice service turned that key down. Check that it was copied in full.' : err === 'no_credit' ? 'The key works, but the account has no credit yet. Add a little at platform.openai.com, then try again.' :
      err === 'busy' ? 'The voice service is busy. Try again in a minute.' : err === 'network' ? 'No internet connection just now. Try again in a moment.' : 'The voice service did not answer. Try again in a minute.', true);
    return;
  }
  setVoiceKey(v); $('#kv-key').value = ''; vEditing = false; vNotice('', false); paintVoice();
  toast('Symphony’s human voice is on. Copy fresh personal links so your teachers get it too.');
  Voice.unlock();
  Voice.say('Hi! It’s me, Symphony. This is my real voice now.', { lang: 'en-GB', style: 'chat' });
});
onWarn(() => toast('Symphony’s voice key is not working, so she is using this device’s voice. Check it in Connect.'));
/* No engine key on this device yet. Teachers get it from their personal link, so only the admin is offered Connect. */
bus.on('need-key', () => { if (isAdmin()) openConnect(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#fallback').hidden) { $('#fallback').hidden = true; return; }
  if (!modal.hidden) { closeConnect(); return; }
  if (!mnav.hidden) setMore(false);
});
$('#fb-close').addEventListener('click', () => { $('#fallback').hidden = true; });

/* ---------------- start ---------------- */
const sym = new Symphony();
setSymphony(sym);
initReading();
initSettings();
initChat();
initFeedback();
initPlay();
initSync();
wirePresent();
initSlides();
initShelf();
paintConn();
initPeople();
wireLiveChip();
initHow();
initFractions();
paintShell();
route();
// a class timer that was running before a reload carries on, with its pill on every page (this tab only)
try { const t = JSON.parse(sessionStorage.getItem('ks2-engine.tools.timer.v1') || 'null'); if (t && (t.running || t.done)) import('./tools/timer.js?v=73f756c9').catch(() => { /* no tools yet */ }); } catch (e) { /* no timer */ }
if (conn.keyFromLink || conn.joinedNow) {
  testConnection().then(() => toast('This device is connected. Every engine is ready.'), (err) => {
    const code = err && err.code;
    if (code === 'bad_key' || code === 'bad_access') forgetKey();
    toast(errorCopy(code));
    openConnect();
  });
}
