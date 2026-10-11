/* Who is using the site. Every visit starts on the landing page with "Who's teaching today?": a teacher types
   their name and the PIN Rabinder gave them (teachers are enrolled from her dashboard and open a personal
   one-tap link once on their device). Rabinder has the only login: "Hello Admin", her name pre-filled, her
   password on a new device, then a passkey (Face ID, fingerprint or the screen lock) on each of her devices.
   Pupils never sign in. */
import { $, $$, esc, el, icon, store, bus, CONFIG, setKey, toast } from './core.js?v=7c13e055';
import { cryptoOK, b64u, unb64u, utf8, unutf8, random, pbkdf2, sha256, sameBytes, aesKey, aesDecrypt, importAdminPrivate, passkeyOK, platformPasskey, createPasskey, checkPasskey, idbGet, idbSet, idbDel } from './crypto.js?v=7c13e055';
import { sfx } from './fx/audio.js?v=7c13e055';

const ME_KEY = 'ks2-engine.me.v1', ROSTER_KEY = 'ks2-engine.roster.v1', PASS_KEY = 'ks2-engine.passkey.v1', SES_KEY = 'ks2-engine.session.v1', LOCK_KEY = 'ks2-engine.pinlock.v1';
const PIN_ITER = 150000, ADMIN_IDLE = 30 * 60 * 1000;
export const ADMIN = CONFIG.admin && CONFIG.admin.check ? CONFIG.admin : null;
export const ADMIN_NAME = ADMIN ? ADMIN.name : 'Rabinder Kaur';
export const who = { role: '', id: '', name: '' };
let adminPriv = null, chosen = null, afterAdmin = null, modal = null, heroForm = null;

const ss = {
  get() { try { return JSON.parse(sessionStorage.getItem(SES_KEY) || 'null'); } catch (e) { return null; } },
  set(v) { try { if (v) sessionStorage.setItem(SES_KEY, JSON.stringify(v)); else sessionStorage.removeItem(SES_KEY); } catch (e) { /* private mode */ } }
};
const valid = (x) => x && x.id && x.n && x.s && x.h;
const mine = () => { const v = store.getJSON(ME_KEY, []); return Array.isArray(v) ? v.filter(valid) : []; };
export function roster() { const v = store.getJSON(ROSTER_KEY, []); return Array.isArray(v) ? v.filter(valid) : []; }
/* Everyone who can sign in on this device: people whose personal link was opened here, plus the teachers
   Rabinder enrolled here (so a shared classroom laptop works for all of them). */
export function profiles() {
  const out = [], seen = new Set();
  mine().concat(roster()).forEach((p) => { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } });
  return out;
}
function saveMine(p) { const list = mine().filter((x) => x.id !== p.id); list.unshift(p); store.setJSON(ME_KEY, list.slice(0, 30)); }
export const isAdmin = () => who.role === 'admin';
export const adminKey = () => adminPriv;

/* ---------------- one-tap links: #t=… (one teacher) or #c=… (a classroom device, several teachers) ---------------- */
const enrolled = (function readLink() {
  const h = location.hash || '';
  const m = /(?:^#|&)([tc])=([A-Za-z0-9_-]{20,12000})(?:&|$)/.exec(h);
  if (!m) return null;
  let first = null;
  try {
    const d = JSON.parse(unutf8(unb64u(m[2])));
    const list = d && d.v === 1 ? (m[1] === 'c' ? (Array.isArray(d.list) ? d.list : []) : [d]) : [];
    list.filter(valid).forEach((x) => {
      const p = { id: String(x.id).slice(0, 40), n: String(x.n).slice(0, 60), s: String(x.s), h: String(x.h), at: Date.now() };
      saveMine(p);
      if (!first) first = p;
    });
    if (first && d.k && /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(d.k)) setKey(d.k);
  } catch (e) { first = null; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  return first;
})();

/* ---------------- enrolment (used by the admin dashboard) ---------------- */
export function newPin() { const b = random(4); const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0; return String(100000 + (n % 900000)); }
async function pinRecord(pin) { const s = random(16); const h = await pbkdf2(pin, s, PIN_ITER, 256); return { s: b64u(s), h: b64u(h) }; }
export async function enrol(name, pin) {
  const n = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const p = Object.assign({ id: 't' + b64u(random(9)), n, at: Date.now() }, await pinRecord(pin));
  const list = roster().filter((x) => x.n.toLowerCase() !== n.toLowerCase());
  list.push(p); store.setJSON(ROSTER_KEY, list);
  return p;
}
export async function resetPin(id, pin) {
  const list = roster(), p = list.find((x) => x.id === id);
  if (!p) return null;
  Object.assign(p, await pinRecord(pin), { at: Date.now() });
  store.setJSON(ROSTER_KEY, list);
  return p;
}
export function unenrol(id) { store.setJSON(ROSTER_KEY, roster().filter((x) => x.id !== id)); }
export function linkFor(people) {
  const key = store.get('ks2-lesson-studio.key.v1');
  const base = location.origin + location.pathname;
  const strip = (p) => ({ id: p.id, n: p.n, s: p.s, h: p.h });
  const body = people.length === 1 ? Object.assign({ v: 1 }, strip(people[0]), key ? { k: key } : {}) : Object.assign({ v: 1, list: people.map(strip) }, key ? { k: key } : {});
  return base + '#' + (people.length === 1 ? 't' : 'c') + '=' + b64u(utf8(JSON.stringify(body)));
}

/* ---------------- sessions ---------------- */
function start(role, id, name) {
  Object.assign(who, { role, id, name });
  ss.set({ role, id, name, at: Date.now(), seen: Date.now() });
  document.documentElement.setAttribute('data-who', role);
  document.body.classList.remove('gated');
  paintWho();
  bus.emit('who', Object.assign({}, who));
}
export function freshAdmin() { const s = ss.get(); return isAdmin() && s && s.role === 'admin' && Date.now() - (s.seen || 0) < ADMIN_IDLE; }
function touch() { const s = ss.get(); if (s) { s.seen = Date.now(); ss.set(s); } }
export function signOut() {
  ss.set(null);
  Object.assign(who, { role: '', id: '', name: '' });
  adminPriv = null;
  document.documentElement.removeAttribute('data-who');
  paintWho();
  bus.emit('who', Object.assign({}, who));
  showGate();
}

/* ---------------- PIN and password checks ---------------- */
async function pinOK(p, pin) { const h = await pbkdf2(pin, unb64u(p.s), PIN_ITER, 256); return sameBytes(h, unb64u(p.h)); }
function lockLeft(id) { const l = store.getJSON(LOCK_KEY, {})[id]; return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; }
function miss(id) {
  const all = store.getJSON(LOCK_KEY, {}), l = all[id] || { n: 0, until: 0 };
  l.n += 1; if (l.n >= 5) l.until = Date.now() + 30000 * Math.pow(2, Math.min(4, l.n - 5));
  all[id] = l; store.setJSON(LOCK_KEY, all);
}
function clearMiss(id) { const all = store.getJSON(LOCK_KEY, {}); delete all[id]; store.setJSON(LOCK_KEY, all); }
export async function unlockWithPassword(pw) {
  if (!ADMIN || !cryptoOK) return false;
  const dk = await pbkdf2(pw, unb64u(ADMIN.salt), ADMIN.iter, 512);
  if (!sameBytes(await sha256(dk.slice(0, 32)), unb64u(ADMIN.check))) return false;
  const wrap = await aesKey(dk.slice(32), ['decrypt']);
  adminPriv = await importAdminPrivate(await aesDecrypt(wrap, unb64u(ADMIN.iv), unb64u(ADMIN.key)));
  await idbSet('admin-priv', adminPriv);
  bus.emit('admin-key');
  return true;
}
export function hasPasskey() { const p = store.getJSON(PASS_KEY, null); return !!(p && p.id); }
export async function setUpPasskey() { const p = await createPasskey(ADMIN_NAME); store.setJSON(PASS_KEY, p); return p; }
export function removePasskey() { store.set(PASS_KEY, ''); }
export { passkeyOK, platformPasskey };

/* ---------------- the landing page: "Who's teaching today?" inside the hero ---------------- */
function teacherForm() {
  if (heroForm) return heroForm;
  const host = $('#hero-gate');
  if (!host) return null;
  host.innerHTML = '<p class="hg-k">' + icon('heart') + 'Who’s teaching today?</p>' +
    '<div class="hg-people" role="group" aria-label="Teachers on this device"></div>' +
    '<div class="hg-row"><label class="hg-f hg-name"><span>Your name</span><input type="text" id="hg-name" autocomplete="off" autocapitalize="words" spellcheck="false" list="hg-names" placeholder="Type your name"></label>' +
    '<label class="hg-f hg-pin"><span>PIN</span><input type="password" id="hg-pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="••••••"></label>' +
    '<button class="btn glow big hg-go" type="submit">' + icon('play') + 'Start teaching</button></div><datalist id="hg-names"></datalist>' +
    '<p class="hg-err" role="alert" hidden></p>' +
    '<p class="hg-none" hidden>' + icon('link') + '<span><b>First time on this device?</b> Open the personal link Rabinder sent you once, then sign in here with your name and PIN. Your PIN is yours: please do not share it.</span></p>' +
    '<p class="hg-links"><button type="button" class="hg-admin" data-admin-signin>' + icon('key') + 'Admin sign-in</button></p>' +
    '<div class="hg-priv" role="note" aria-label="Privacy"><p class="hg-priv-h">' + icon('lock') + 'Privacy</p>' +
      '<p>A simple home-made site for Rabinder’s teachers, run not for profit: no adverts, no trackers, no cookies, nothing sold. Pupils never sign in, and no pupil names are kept. ' +
      'The only thing recorded is teachers’ lesson activity for Rabinder’s reports, locked so only she can open it. Topics you type go to the AI engine only to write your lesson.</p></div>';
  const down = $('[data-to-gate]');
  if (down) down.addEventListener('click', () => host.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  host.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-person]');
    if (pick) { chosen = profiles().find((p) => p.id === pick.dataset.person) || null; $('#hg-name').value = chosen ? chosen.n : ''; paintTeacher(); $('#hg-pin').focus(); }
  });
  $('#hg-name').addEventListener('input', () => { const v = $('#hg-name').value.trim().toLowerCase(); chosen = profiles().find((p) => p.n.toLowerCase() === v) || null; paintPicks(); });
  host.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.hg-err', host), name = $('#hg-name').value.trim(), pin = $('#hg-pin').value.trim(), go = $('.hg-go', host);
    const list = profiles();
    if (!name) { say(err, 'Type your name first.'); $('#hg-name').focus(); return; }
    if (!list.length) { say(err, 'This device does not know any teachers yet. Open the personal link Rabinder sent you once on this device, then sign in here.'); return; }
    const p = chosen && chosen.n.toLowerCase() === name.toLowerCase() ? chosen : list.find((x) => x.n.toLowerCase() === name.toLowerCase());
    if (!p) { say(err, 'That name is not set up on this device. Check the spelling, or ask Rabinder for your personal link.'); return; }
    const wait = lockLeft(p.id);
    if (wait) { say(err, 'Too many tries. Wait ' + wait + ' seconds, then try again.'); return; }
    if (!/^\d{4,6}$/.test(pin)) { say(err, 'Your PIN is 4 to 6 numbers.'); $('#hg-pin').focus(); return; }
    go.disabled = true;
    let ok = false;
    try { ok = await pinOK(p, pin); } catch (er) { ok = false; }
    go.disabled = false;
    if (!ok) { miss(p.id); sfx('error'); say(err, 'That PIN did not match. Ask Rabinder if you have forgotten it.'); $('#hg-pin').select(); return; }
    clearMiss(p.id); say(err, '');
    $('#hg-pin').value = '';
    start('teacher', p.id, p.n);
    sfx('success');
    hideGate();
    toast('Hello, ' + p.n.split(' ')[0] + '. Have a lovely lesson.');
  });
  heroForm = host;
  return host;
}
function paintPicks() {
  const list = profiles();
  $('.hg-people', heroForm).innerHTML = list.length > 1 ? list.map((p) => '<button type="button" class="hg-person" data-person="' + esc(p.id) + '" aria-pressed="' + (chosen && chosen.id === p.id) + '"><span>' + esc(initials(p.n)) + '</span>' + esc(p.n) + '</button>').join('') : '';
}
function paintTeacher() {
  const list = profiles();
  if (!chosen || !list.some((p) => p.id === chosen.id)) chosen = (enrolled && list.find((p) => p.id === enrolled.id)) || (list.length === 1 ? list[0] : null);
  const name = $('#hg-name');
  if (chosen && !name.value) name.value = chosen.n;
  $('#hg-names').innerHTML = list.map((p) => '<option value="' + esc(p.n) + '"></option>').join('');
  paintPicks();
  $('.hg-none', heroForm).hidden = list.length > 0;
  $('.hg-row', heroForm).hidden = false;
}

/* ---------------- "Hello Admin": the only login ---------------- */
function adminModal() {
  if (modal) return modal;
  modal = el('div', 'modal agate');
  modal.id = 'agate'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'agate-h');
  modal.innerHTML = '<div class="modal-card agate-card" style="position:relative">' +
    '<button type="button" class="btn small icon modal-x" id="agate-x" aria-label="Close">' + icon('close') + '</button>' +
    '<section data-pane="admin"><p class="kicker">' + icon('key') + 'Admin</p><h2 id="agate-h">Hello Admin</h2>' +
      '<form class="form" id="agate-form" novalidate>' +
        '<label class="fld"><span>Username</span><input type="text" name="username" id="agate-user" autocomplete="username" readonly></label>' +
        '<button type="button" class="btn primary big wide" id="agate-pk" hidden>' + icon('check') + 'Sign in with passkey</button>' +
        '<label class="fld"><span>Password</span><input type="password" name="password" id="agate-pw" autocomplete="current-password" placeholder="Your admin password"></label>' +
        '<button class="btn big wide" type="submit" id="agate-go">Sign in</button><p class="notice err" hidden role="alert"></p></form>' +
      '<p class="fine">Only Rabinder can sign in here. Teachers sign in with their name and PIN on the landing page.</p></section>' +
    '<section data-pane="passkey" hidden><p class="kicker">' + icon('check') + 'Signed in</p><h2>Sign in faster next time</h2>' +
      '<p>Use Face ID, your fingerprint or this device’s screen lock instead of the password. Set it up once on your laptop and once on your phone.</p>' +
      '<button type="button" class="btn primary big wide" id="agate-mk">' + icon('check') + 'Set up a passkey on this device</button>' +
      '<button type="button" class="btn big wide" id="agate-skip">Not now</button><p class="notice err" hidden role="alert"></p></section></div>';
  document.body.appendChild(modal);
  $('#agate-user').value = ADMIN_NAME;
  $('#agate-x').addEventListener('click', closeAdmin);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAdmin(); });
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeAdmin(); } });
  $('#agate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = $('#agate-form .notice'), pw = $('#agate-pw').value, btn = $('#agate-go');
    if (!ADMIN || !cryptoOK) { say(n, 'Admin sign-in needs the secure (https) site address.'); return; }
    if (!pw) { say(n, 'Type your password.'); $('#agate-pw').focus(); return; }
    const wait = lockLeft('admin');
    if (wait) { say(n, 'Too many tries. Wait ' + wait + ' seconds, then try again.'); return; }
    btn.disabled = true; btn.textContent = 'Checking…';
    let ok = false;
    try { ok = await unlockWithPassword(pw); } catch (er) { ok = false; }
    btn.disabled = false; btn.textContent = 'Sign in';
    if (!ok) { miss('admin'); sfx('error'); say(n, 'That password did not match.'); $('#agate-pw').select(); return; }
    clearMiss('admin'); say(n, '');
    $('#agate-pw').value = '';
    start('admin', 'admin', ADMIN_NAME);
    sfx('success');
    if (!hasPasskey() && await platformPasskey()) { pane('passkey'); setTimeout(() => $('#agate-mk').focus(), 60); return; }
    finishAdmin();
  });
  $('#agate-pk').addEventListener('click', async () => {
    const n = $('#agate-form .notice');
    try {
      const ok = await checkPasskey(store.getJSON(PASS_KEY, {}));
      if (!ok) { say(n, 'The passkey did not match. Use your password instead.'); return; }
    } catch (er) { say(n, 'Passkey sign-in was cancelled. You can use your password instead.'); return; }
    adminPriv = (await idbGet('admin-priv')) || null;
    start('admin', 'admin', ADMIN_NAME);
    sfx('success');
    if (adminPriv) bus.emit('admin-key');
    finishAdmin();
  });
  $('#agate-mk').addEventListener('click', async () => {
    const n = $('[data-pane="passkey"] .notice', modal);
    try { await setUpPasskey(); toast('Passkey ready. Next time, tap “Sign in with passkey”.'); finishAdmin(); }
    catch (er) { say(n, 'The passkey was not set up. You can try again from your dashboard.'); }
  });
  $('#agate-skip').addEventListener('click', finishAdmin);
  return modal;
}
function pane(name) {
  $$('[data-pane]', modal).forEach((s) => { s.hidden = s.dataset.pane !== name; });
  if (name === 'admin') {
    $('#agate-pk').hidden = !(hasPasskey() && passkeyOK);
    say($('#agate-form .notice'), '');
    setTimeout(() => (hasPasskey() && passkeyOK ? $('#agate-pk') : $('#agate-pw')).focus(), 60);
  }
}
export function openAdmin(then) {
  adminModal();
  afterAdmin = then || null;
  modal.hidden = false;
  pane('admin');
}
function closeAdmin() {
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  if (!who.role) { const p = $('#hg-pin'); if (p) p.focus(); }
}
function finishAdmin() {
  if (modal) modal.hidden = true;
  hideGate();
  const f = afterAdmin; afterAdmin = null;
  if (f) f(); else location.hash = '#/admin';
  toast('Hello Admin. Your dashboard is open.');
}
function say(n, msg) { if (!n) return; n.textContent = msg; n.hidden = !msg; }
export function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('') || '?'; }

export function showGate() {
  document.body.classList.add('gated');
  if (location.hash && location.hash !== '#/' && location.hash !== '#') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
  bus.emit('gate', true);
  const f = teacherForm();
  if (!f) return;
  f.hidden = false;
  paintTeacher();
  const err = $('.hg-err', f); if (err) say(err, '');
  setTimeout(() => { if (!document.body.classList.contains('gated')) return; const target = chosen ? $('#hg-pin') : $('#hg-name'); if (target && window.matchMedia('(hover: hover)').matches) target.focus({ preventScroll: true }); }, 120);
}
export function hideGate() {
  document.body.classList.remove('gated');
  if (heroForm) heroForm.hidden = true;
  bus.emit('gate', false);
}
export function requireAdmin(then) {
  if (freshAdmin()) { touch(); return true; }
  openAdmin(then);
  return false;
}

/* ---------------- the person chip in the header ---------------- */
function paintWho() {
  const b = $('#who');
  if (!b) return;
  b.hidden = !who.role;
  $('.who-i', b).textContent = who.role === 'admin' ? initials(ADMIN_NAME) : initials(who.name);
  $('.who-n', b).textContent = who.role === 'admin' ? 'Admin' : (who.name || '').split(' ')[0];
  $$('[data-who-admin]').forEach((x) => { x.hidden = who.role !== 'admin'; });
  $$('[data-who-teacher]').forEach((x) => { x.hidden = who.role !== 'teacher'; });
  $$('[data-who-any]').forEach((x) => { x.hidden = !who.role; });
}
export function initPeople() {
  const top = $('.top-r'), menu = el('div', 'who-wrap');
  menu.innerHTML = '<button type="button" class="who" id="who" hidden aria-haspopup="true" aria-expanded="false" aria-controls="who-pop"><span class="who-i"></span><span class="who-n"></span></button>' +
    '<div class="who-pop" id="who-pop" hidden role="menu">' +
    '<button type="button" role="menuitem" data-who-admin data-go-admin>' + icon('layers') + 'Dashboard</button>' +
    '<button type="button" role="menuitem" data-who-any data-feedback>' + icon('star') + 'Give feedback</button>' +
    '<button type="button" role="menuitem" data-who-any data-signout>' + icon('close') + 'Sign out</button></div>';
  top.insertBefore(menu, top.querySelector('.conn'));
  const mn = $('#mnav');
  if (mn) mn.insertAdjacentHTML('beforeend', '<div class="mnav-who" data-who-any hidden><a href="#/admin" data-who-admin hidden>Dashboard</a><a href="#" data-feedback>Give feedback</a><a href="#" data-signout>Sign out</a></div>');
  const btn = $('#who'), pop = $('#who-pop');
  btn.addEventListener('click', () => { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.who-wrap')) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    if (e.target.closest('[data-signout]')) { e.preventDefault(); pop.hidden = true; signOut(); toast('Signed out. See you next time.'); }
    else if (e.target.closest('[data-go-admin]')) { pop.hidden = true; location.hash = '#/admin'; }
    else if (e.target.closest('[data-feedback]')) { e.preventDefault(); pop.hidden = true; bus.emit('feedback'); }
    else if (e.target.closest('[data-admin-signin]')) { e.preventDefault(); openAdmin(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, () => { if (isAdmin()) touch(); }, { passive: true }));
  const s = ss.get();
  if (s && s.role === 'teacher' && profiles().some((p) => p.id === s.id)) start('teacher', s.id, s.name);
  else if (s && s.role === 'admin' && ADMIN && Date.now() - (s.seen || 0) < ADMIN_IDLE) { start('admin', 'admin', ADMIN_NAME); idbGet('admin-priv').then((k) => { adminPriv = k || null; if (adminPriv) bus.emit('admin-key'); }); }
  else showGate();
  paintWho();
  if (enrolled && !who.role) toast('Welcome, ' + enrolled.n.split(' ')[0] + '. Type the PIN Rabinder gave you.');
}
export async function forgetAdminKey() { adminPriv = null; await idbDel('admin-priv'); }
