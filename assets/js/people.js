/* Who is using the site. Every visit starts with "Who's teaching?": a teacher picks their name and types the PIN
   Rabinder gave them (teachers are enrolled with a personal one-tap link from her dashboard). Rabinder has the
   only login: "Hello Admin", her name pre-filled, a passkey (Face ID, fingerprint or the device screen lock) on
   each of her devices, and her password as the way in on a new device. Pupils never sign in. */
import { $, $$, esc, el, icon, store, bus, CONFIG, setKey, toast } from './core.js';
import { cryptoOK, unb64u, unutf8, pbkdf2, sha256, sameBytes, aesKey, aesDecrypt, importAdminPrivate, passkeyOK, platformPasskey, createPasskey, checkPasskey, idbGet, idbSet, idbDel } from './crypto.js';

const ME_KEY = 'ks2-engine.me.v1', PASS_KEY = 'ks2-engine.passkey.v1', SES_KEY = 'ks2-engine.session.v1', LOCK_KEY = 'ks2-engine.pinlock.v1';
export const ADMIN = CONFIG.admin && CONFIG.admin.check ? CONFIG.admin : null;
const ADMIN_IDLE = 30 * 60 * 1000;
export const who = { role: '', id: '', name: '' };
let adminPriv = null, chosen = null, gate = null, afterAdmin = null;

const ss = {
  get() { try { return JSON.parse(sessionStorage.getItem(SES_KEY) || 'null'); } catch (e) { return null; } },
  set(v) { try { if (v) sessionStorage.setItem(SES_KEY, JSON.stringify(v)); else sessionStorage.removeItem(SES_KEY); } catch (e) { /* private mode */ } }
};
export function profiles() { const v = store.getJSON(ME_KEY, []); return Array.isArray(v) ? v.filter((x) => x && x.id && x.n && x.s && x.h) : []; }
function saveProfile(p) { const list = profiles().filter((x) => x.id !== p.id); list.unshift(p); store.setJSON(ME_KEY, list.slice(0, 8)); }
export const isAdmin = () => who.role === 'admin';
export const adminKey = () => adminPriv;

/* ---------------- the personal setup link: #t=… (name, PIN check, and the engine key) ---------------- */
const enrolled = (function readEnrolLink() {
  const m = /(?:^#|&)t=([A-Za-z0-9_-]{20,4000})(?:&|$)/.exec(location.hash || '');
  if (!m) return null;
  let p = null;
  try {
    const d = JSON.parse(unutf8(unb64u(m[1])));
    if (d && d.v === 1 && d.id && d.n && d.s && d.h) {
      p = { id: String(d.id).slice(0, 40), n: String(d.n).slice(0, 60), s: String(d.s), h: String(d.h), at: Date.now() };
      saveProfile(p);
      if (d.k && /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(d.k)) setKey(d.k);
    }
  } catch (e) { p = null; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  return p;
})();

/* ---------------- sessions ---------------- */
function start(role, id, name) {
  Object.assign(who, { role, id, name });
  ss.set({ role, id, name, at: Date.now(), seen: Date.now() });
  document.documentElement.setAttribute('data-who', role);
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
async function pinOK(p, pin) { const h = await pbkdf2(pin, unb64u(p.s), 150000, 256); return sameBytes(h, unb64u(p.h)); }
function lockLeft(id) { const l = store.getJSON(LOCK_KEY, {})[id]; return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; }
function miss(id) {
  const all = store.getJSON(LOCK_KEY, {}), l = all[id] || { n: 0, until: 0 };
  l.n += 1; if (l.n >= 5) { l.until = Date.now() + 30000 * Math.pow(2, Math.min(4, l.n - 5)); }
  all[id] = l; store.setJSON(LOCK_KEY, all);
}
function clearMiss(id) { const all = store.getJSON(LOCK_KEY, {}); delete all[id]; store.setJSON(LOCK_KEY, all); }
async function passwordOK(pw) {
  const dk = await pbkdf2(pw, unb64u(ADMIN.salt), ADMIN.iter, 512);
  if (!sameBytes(await sha256(dk.slice(0, 32)), unb64u(ADMIN.check))) return false;
  const wrap = await aesKey(dk.slice(32), ['decrypt']);
  adminPriv = await importAdminPrivate(await aesDecrypt(wrap, unb64u(ADMIN.iv), unb64u(ADMIN.key)));
  await idbSet('admin-priv', adminPriv);
  return true;
}
export function hasPasskey() { const p = store.getJSON(PASS_KEY, null); return !!(p && p.id); }
export async function setUpPasskey() {
  const p = await createPasskey(ADMIN ? ADMIN.name : 'Rabinder Kaur');
  store.setJSON(PASS_KEY, p);
  return p;
}
export function removePasskey() { store.set(PASS_KEY, ''); }

/* ---------------- the landing gate ---------------- */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.2C5.4 16.9 2.3 13.2 2.3 9.1 2.3 6.2 4.5 4 7.3 4c1.9 0 3.5 1 4.7 2.7C13.2 5 14.8 4 16.7 4c2.8 0 5 2.2 5 5.1 0 4.1-3.1 7.8-9.7 12.1z"/></svg>';
function build() {
  if (gate) return;
  gate = el('div', 'gate');
  gate.id = 'gate'; gate.hidden = true;
  gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'gate-h');
  gate.innerHTML = '<div class="gate-card">' +
    '<p class="gate-brand"><span class="gate-logo">' + HEART + '</span><span><b>KS2 Lesson Engine</b><small>Made with <i>♥</i> by Rabinder Kaur</small></span></p>' +
    '<section data-pane="teacher"><h1 id="gate-h">Who’s teaching?</h1>' +
      '<div class="gate-people" role="group" aria-label="Teachers on this device"></div>' +
      '<form class="gate-pin" novalidate><p class="gate-hello"></p>' +
        '<label class="fld"><span>Your PIN</span><input type="password" id="gate-pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="••••"></label>' +
        '<button class="btn primary big wide" type="submit">' + icon('play') + 'Start teaching</button><p class="notice err" hidden role="alert"></p></form>' +
      '<div class="gate-none" hidden><p><b>This device is not set up yet.</b></p><p>Ask Rabinder for your personal setup link and open it once on this device. Your PIN is private: please do not share it.</p></div>' +
      '<p class="gate-note">' + icon('info') + '<span>For Rabinder’s reports, this site records time spent, lessons made and taught, and class feedback. It never records pupils’ names or what you ask Symphony.</span></p>' +
      '<button type="button" class="linkbtn gate-sw" data-pane-go="admin">Admin sign-in</button></section>' +
    '<section data-pane="admin" hidden><h1>Hello Admin</h1>' +
      '<form class="gate-adm" novalidate>' +
        '<label class="fld"><span>Username</span><input type="text" name="username" id="gate-user" autocomplete="username" readonly></label>' +
        '<button type="button" class="btn primary big wide" id="gate-passkey" hidden>' + icon('eye') + 'Sign in with passkey</button>' +
        '<label class="fld"><span>Password</span><input type="password" name="password" id="gate-pw" autocomplete="current-password" placeholder="Your admin password"></label>' +
        '<button class="btn big wide" type="submit" id="gate-pw-go">Sign in</button><p class="notice err" hidden role="alert"></p></form>' +
      '<button type="button" class="linkbtn gate-sw" data-pane-go="teacher">Teacher sign-in</button></section>' +
    '<section data-pane="passkey" hidden><h1>Sign in faster next time</h1><p class="gate-p">Use Face ID, your fingerprint or this device’s screen lock instead of typing the password. Set it up once on your laptop and once on your phone.</p>' +
      '<button type="button" class="btn primary big wide" id="gate-pk-make">' + icon('check') + 'Set up a passkey</button><button type="button" class="btn big wide" id="gate-pk-skip">Not now</button><p class="notice err" hidden role="alert"></p></section>' +
    '</div>';
  document.body.appendChild(gate);
  $('#gate-user').value = ADMIN ? ADMIN.name : 'Rabinder Kaur';
  gate.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-pane-go]');
    if (sw) { pane(sw.dataset.paneGo); return; }
    const pick = e.target.closest('[data-person]');
    if (pick) { chosen = profiles().find((p) => p.id === pick.dataset.person) || null; paintTeacher(); $('#gate-pin').focus(); }
  });
  $('.gate-pin', gate).addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = $('.gate-pin .notice', gate), pin = $('#gate-pin').value.trim(), btn = $('.gate-pin button[type="submit"]', gate);
    if (!chosen) return;
    const wait = lockLeft(chosen.id);
    if (wait) { say(n, 'Too many tries. Wait ' + wait + ' seconds, then try again.'); return; }
    if (!/^\d{4,6}$/.test(pin)) { say(n, 'Your PIN is 4 to 6 numbers.'); return; }
    btn.disabled = true;
    let ok = false;
    try { ok = await pinOK(chosen, pin); } catch (er) { ok = false; }
    btn.disabled = false;
    if (!ok) { miss(chosen.id); say(n, 'That PIN did not match. Check with Rabinder if you have forgotten it.'); $('#gate-pin').select(); return; }
    clearMiss(chosen.id); say(n, '');
    $('#gate-pin').value = '';
    start('teacher', chosen.id, chosen.n);
    hideGate();
    toast('Hello, ' + chosen.n.split(' ')[0] + '. Have a lovely lesson.');
  });
  $('.gate-adm', gate).addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = $('.gate-adm .notice', gate), pw = $('#gate-pw').value, btn = $('#gate-pw-go');
    if (!ADMIN || !cryptoOK) { say(n, 'Admin sign-in needs a secure (https) page.'); return; }
    if (!pw) { say(n, 'Type your password.'); return; }
    const wait = lockLeft('admin');
    if (wait) { say(n, 'Too many tries. Wait ' + wait + ' seconds, then try again.'); return; }
    btn.disabled = true; btn.textContent = 'Checking…';
    let ok = false;
    try { ok = await passwordOK(pw); } catch (er) { ok = false; }
    btn.disabled = false; btn.textContent = 'Sign in';
    if (!ok) { miss('admin'); say(n, 'That password did not match.'); return; }
    clearMiss('admin'); say(n, '');
    $('#gate-pw').value = '';
    start('admin', 'admin', ADMIN.name);
    if (!hasPasskey() && await platformPasskey()) { pane('passkey'); return; }
    finishAdmin();
  });
  $('#gate-passkey').addEventListener('click', async () => {
    const n = $('.gate-adm .notice', gate);
    try {
      const ok = await checkPasskey(store.getJSON(PASS_KEY, {}));
      if (!ok) { say(n, 'The passkey did not match. Use your password instead.'); return; }
    } catch (er) { say(n, 'Passkey sign-in was cancelled. You can use your password instead.'); return; }
    adminPriv = (await idbGet('admin-priv')) || null;
    start('admin', 'admin', ADMIN.name);
    finishAdmin();
  });
  $('#gate-pk-make').addEventListener('click', async () => {
    const n = $('[data-pane="passkey"] .notice', gate);
    try { await setUpPasskey(); toast('Passkey ready. Next time, tap “Sign in with passkey”.'); finishAdmin(); }
    catch (er) { say(n, 'The passkey was not set up. You can try again later from your dashboard.'); }
  });
  $('#gate-pk-skip').addEventListener('click', finishAdmin);
  gate.addEventListener('keydown', (e) => { if (e.key === 'Escape' && gate.dataset.reauth) { e.stopPropagation(); hideGate(); } });
}
function say(n, msg) { n.textContent = msg; n.hidden = !msg; }
function pane(name) {
  $$('[data-pane]', gate).forEach((s) => { s.hidden = s.dataset.pane !== name; });
  if (name === 'admin') { $('#gate-passkey').hidden = !(hasPasskey() && passkeyOK); setTimeout(() => (hasPasskey() ? $('#gate-passkey') : $('#gate-pw')).focus(), 50); }
  if (name === 'teacher') paintTeacher();
}
function paintTeacher() {
  const list = profiles();
  if (!chosen || !list.some((p) => p.id === chosen.id)) chosen = enrolled && list.find((p) => p.id === enrolled.id) || list[0] || null;
  $('.gate-people', gate).innerHTML = list.length > 1 ? list.map((p) => '<button type="button" class="gate-person" data-person="' + esc(p.id) + '" aria-pressed="' + (chosen && chosen.id === p.id) + '"><span>' + esc(initials(p.n)) + '</span>' + esc(p.n) + '</button>').join('') : '';
  $('.gate-pin', gate).hidden = !chosen;
  $('.gate-none', gate).hidden = !!chosen;
  if (chosen) $('.gate-hello', gate).innerHTML = enrolled && enrolled.id === chosen.id ? 'Welcome, <b>' + esc(chosen.n) + '</b>. Type the PIN Rabinder gave you.' : 'Hello, <b>' + esc(chosen.n) + '</b>';
}
function finishAdmin() { hideGate(); toast('Hello Admin. Your dashboard is open.'); const f = afterAdmin; afterAdmin = null; if (f) f(); else location.hash = '#/admin'; }
export function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('') || '?'; }

export function showGate(mode, o) {
  build();
  o = o || {};
  gate.dataset.reauth = o.reauth ? '1' : '';
  afterAdmin = o.then || null;
  gate.hidden = false;
  document.body.classList.add('gated');
  ['main', '#top', '#dock', '#sym-fab', '#mnav'].forEach((s) => { const n = $(s); if (n) n.inert = true; });
  pane(mode || 'teacher');
  if ((mode || 'teacher') === 'teacher' && chosen) setTimeout(() => $('#gate-pin').focus(), 80);
}
export function hideGate() {
  if (!gate) return;
  gate.hidden = true;
  document.body.classList.remove('gated');
  ['main', '#top', '#dock', '#sym-fab', '#mnav'].forEach((s) => { const n = $(s); if (n) n.inert = false; });
}
export function requireAdmin(then) {
  if (freshAdmin()) { touch(); return true; }
  showGate('admin', { reauth: isAdmin(), then });
  return false;
}

/* ---------------- the person chip in the header ---------------- */
function paintWho() {
  const b = $('#who');
  if (!b) return;
  b.hidden = !who.role;
  $('.who-i', b).textContent = who.role === 'admin' ? 'RK' : initials(who.name);
  $('.who-n', b).textContent = who.role === 'admin' ? 'Admin' : (who.name || '').split(' ')[0];
  $$('[data-who-admin]').forEach((x) => { x.hidden = who.role !== 'admin'; });
  $$('[data-who-teacher]').forEach((x) => { x.hidden = who.role !== 'teacher'; });
  $$('[data-who-any]').forEach((x) => { x.hidden = !who.role; });
}
export function initPeople() {
  const top = $('.top-r'), menu = el('div', 'who-wrap');
  menu.innerHTML = '<button type="button" class="who" id="who" hidden aria-haspopup="true" aria-expanded="false"><span class="who-i"></span><span class="who-n"></span></button>' +
    '<div class="who-pop" id="who-pop" hidden role="menu"><button type="button" role="menuitem" data-who-admin data-go-admin>' + icon('layers') + 'Dashboard</button>' +
    '<button type="button" role="menuitem" data-who-teacher data-feedback>' + icon('star') + 'Feedback and submit</button>' +
    '<button type="button" role="menuitem" data-signout>' + icon('close') + 'Sign out</button></div>';
  top.insertBefore(menu, top.querySelector('.conn'));
  const mn = $('#mnav');
  if (mn) mn.insertAdjacentHTML('beforeend', '<a href="#/admin" data-who-admin hidden>Dashboard</a><a href="#" data-who-teacher data-feedback hidden>Feedback and submit</a><a href="#" data-who-any data-signout hidden>Sign out</a>');
  const btn = $('#who'), pop = $('#who-pop');
  btn.addEventListener('click', () => { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.who-wrap')) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    if (e.target.closest('[data-signout]')) { e.preventDefault(); pop.hidden = true; signOut(); }
    if (e.target.closest('[data-go-admin]')) { pop.hidden = true; location.hash = '#/admin'; }
    if (e.target.closest('[data-feedback]')) { e.preventDefault(); pop.hidden = true; bus.emit('feedback'); }
  });
  ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, () => { if (isAdmin()) touch(); }, { passive: true }));
  const s = ss.get();
  if (s && s.role === 'teacher' && profiles().some((p) => p.id === s.id)) { start('teacher', s.id, s.name); }
  else if (s && s.role === 'admin' && ADMIN && Date.now() - (s.seen || 0) < ADMIN_IDLE) { start('admin', 'admin', ADMIN.name); idbGet('admin-priv').then((k) => { adminPriv = k || null; bus.emit('admin-key'); }); }
  else showGate(enrolled ? 'teacher' : null);
  paintWho();
}
