/* Rabinder's dashboard (only after "Hello Admin"): teaching time, deviations, engines, class voice, teacher
   feedback, enrolment with personal links and PINs, teachers' activity arriving by itself from the inbox (sync.js),
   the downloadable report, CSV, Symphony's analysis, and this device's passkey. Only the admin downloads. */
import { $, $$, esc, el, icon, store, bus, toast, copyOut, hasKey, askClaude, errorCopy, CONFIG } from './core.js?v=f99d8766';
import { evAll, evClear, kvGet, kvSet } from './idb.js?v=f99d8766';
import { roster, enrol, resetPin, unenrol, linkFor, newPin, isAdmin, adminKey, unlockWithPassword, hasPasskey, setUpPasskey, removePasskey, passkeyOK, platformPasskey, signOut, ADMIN_NAME, initials, forgetAdminKey } from './people.js?v=f99d8766';
import { INBOX, pull, lastPull } from './sync.js?v=f99d8766';
import { metrics, period, digest, spoken, reportHTML, csv, fmtDur, fmtDay, fmtDate, fmtTime, ENGINE_NAMES, moodOf } from './report.js?v=f99d8766';
import { download, FACE_NAMES, FACE_COLOURS, faceSVG } from './feedback.js?v=f99d8766';
import { makeState, makeStart, makeEnd, deliberate, watch, waitText } from './guard.js?v=f99d8766';

const RANGE_KEY = 'ks2-engine.adminrange.v1';
let range = store.get(RANGE_KEY) || 'week', lastM = null, analysis = '', view = null, busyAnalysis = null, pulledAt = 0;

export async function briefing(kind) {
  const evs = await evAll();
  const m = metrics(evs, period(kind || range), roster());
  return { m, digest: digest(m), spoken: spoken(m), label: m.per.label };
}
/* Before a download, fetch anything new from the teachers (waiting at most a few seconds). */
async function freshen() {
  if (!INBOX || !adminKey()) return;
  try { await Promise.race([pull(), new Promise((r) => setTimeout(r, 8000))]); } catch (e) { /* use what is here */ }
}
export async function downloadReport(kind) {
  await freshen();
  const b = await briefing(kind);
  const subs = (await kvGet('subs')) || [];
  const html = reportHTML(b.m, { sources: 1 + new Set(subs.map((s) => s.from)).size, analysis: analysis ? analysisHTML(analysis) : '' });
  download('KS2 report - ' + b.label + ' - ' + new Date().toISOString().slice(0, 10) + '.html', html);
  toast('Report downloaded. Open it to read, print or save as PDF.');
}
function analysisHTML(t) {
  const lines = String(t).split(/\n+/).map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, '').trim()).filter(Boolean);
  return '<ul class="brief">' + lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>';
}

/* ---------------- small pieces ---------------- */
const kpi = (n, l, sub, tone) => '<div class="akpi' + (tone ? ' ' + tone : '') + '"><b>' + esc(n) + '</b><span>' + esc(l) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
const bar = (v, max) => '<span class="abar"><i style="width:' + (max ? Math.max(2, Math.round(100 * v / max)) : 0) + '%"></i></span>';
const sev = (s) => '<span class="asev ' + s + '">' + ({ high: 'Important', medium: 'Check', low: 'Note' })[s] + '</span>';
const r1 = (v) => Math.round(v * 10) / 10;
const pl = (v, one, many) => v + ' ' + (v === 1 ? one : many);
const moodTone = (v) => (!v ? '' : v >= 4 ? 'good' : v >= 3 ? 'ok' : 'bad');

function daysChart(days) {
  const max = Math.max(1, ...days.map((d) => d.act));
  return '<div class="adays" style="--n:' + days.length + '">' + days.map((d) => '<div class="aday" title="' + esc(fmtDay(d.t) + ': ' + fmtDur(d.act) + ', ' + d.gens + ' made, ' + d.presents + ' presented') + '"><i style="height:' + Math.round(100 * d.act / max) + '%"></i>' +
    (days.length <= 14 ? '<small>' + esc(new Date(d.t).toLocaleDateString('en-GB', { weekday: 'narrow' })) + '</small>' : '') + '</div>').join('') + '</div>';
}

export async function renderAdmin(host) {
  view = host;
  if (!isAdmin()) return;
  const evs = await evAll();
  const people = roster();
  const m = metrics(evs, period(range), people);
  lastM = m;
  const T = m.totals, subs = ((await kvGet('subs')) || []).slice().sort((a, b) => b.at - a.at);
  const maxAct = Math.max(1, ...m.people.map((p) => p.act)), maxEng = Math.max(1, ...m.engines.map((e) => e.gens + e.presents)), maxFace = Math.max(1, ...m.faces);
  const pk = hasPasskey(), pkOK = passkeyOK && await platformPasskey();
  const enrolledRows = people.map((p) => {
    const s = m.people.find((x) => x.id === p.id) || { act: 0, sessions: 0, last: 0 };
    const lastEver = evs.filter((e) => e.t === p.id && e.k === 'session').reduce((a, e) => Math.max(a, e.end || e.at), 0);
    return '<tr><td><span class="aav">' + esc(initials(p.n)) + '</span><b>' + esc(p.n) + '</b><br><small>Enrolled ' + esc(fmtDate(p.at || Date.now())) + '</small></td><td class="num">' + esc(fmtDur(s.act)) + '</td><td>' + (lastEver ? esc(fmtDay(lastEver)) : '<small>not yet</small>') + '</td>' +
      '<td class="aact"><button type="button" class="btn small" data-link="' + esc(p.id) + '">' + icon('link') + 'Copy link</button><button type="button" class="btn small" data-repin="' + esc(p.id) + '">' + icon('key') + 'New PIN</button><button type="button" class="btn small icon" data-unenrol="' + esc(p.id) + '" aria-label="Remove ' + esc(p.n) + '">' + icon('trash') + '</button></td></tr>';
  }).join('');
  host.innerHTML = '<div class="wrap adm">' +
    '<header class="adm-head"><div><p class="kicker">' + icon('key') + 'Hello Admin</p><h1>' + esc(ADMIN_NAME) + '’s dashboard</h1><p>Everything your teachers did on the engine. It arrives by itself and is worked out on this device. ' + esc(m.per.label) + '.</p></div>' +
      '<div class="adm-tools"><div class="seg" role="group" aria-label="Period">' + [['week', '7 days'], ['month', '30 days'], ['term', 'School year'], ['all', 'All']].map(([k, l]) => '<button type="button" data-range="' + k + '" aria-pressed="' + (range === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div class="adm-btns"><button type="button" class="btn" data-enrol>' + icon('plus') + 'Enrol a teacher</button><button type="button" class="btn primary" data-dl-report>' + icon('download') + 'Download report</button><button type="button" class="btn" data-analysis>' + icon('spark') + '<span>' + (analysis ? 'Refresh analysis' : 'Symphony’s analysis') + '</span></button><button type="button" class="btn" data-ask>' + icon('chat') + 'Ask Symphony</button><button type="button" class="btn" data-csv>' + icon('download') + 'CSV</button></div></div></header>' +
    '<div class="akpis">' +
      kpi(fmtDur(T.act), 'Teaching time', pl(T.sessions, 'session', 'sessions')) + kpi(T.people + (T.enrolled ? ' / ' + T.enrolled : ''), 'Teachers active', T.enrolled ? 'of those enrolled' : 'enrol teachers below') +
      kpi(T.ok, 'Lessons made', T.fail ? T.fail + ' failed' : 'none failed', T.fail ? 'warn' : '') + kpi(T.presents, 'Presented', fmtDur(T.presentMs) + ' on screen') +
      kpi(T.votes ? r1(T.mood) + ' / 5' : '–', 'Class mood', pl(T.votes, 'pupil answer', 'pupil answers'), moodTone(T.mood)) + kpi(T.fb ? r1(T.rating) + ' / 5' : '–', 'Teacher rating', pl(T.fb, 'response', 'responses')) +
      kpi(m.deviations.length, 'To look at', m.deviations.filter((d) => d.sev === 'high').length + ' important', m.deviations.some((d) => d.sev === 'high') ? 'bad' : m.deviations.length ? 'warn' : 'good') + kpi(T.chats, 'Asked Symphony', pl(T.plays, 'Wonder Window scene', 'Wonder Window scenes')) +
    '</div>' +
    (analysis || busyAnalysis ? '<section class="card asec wide" id="a-analysis"><h2>' + icon('spark') + 'Symphony’s analysis</h2>' + (busyAnalysis ? '<p class="fine">Symphony is reading the numbers…</p>' : analysisHTML(analysis).replace('class="brief"', 'class="alist"')) + '</section>' : '') +
    '<div class="agrid">' +
      '<section class="card asec wide" id="a-people"><h2>' + icon('plan') + 'Teachers and PINs</h2><p class="fine">Enrol a teacher, then send them their personal link privately and tell them their PIN yourself. The PIN is theirs alone: not to be shared. Opening the link once sets up their device.</p>' +
        '<form class="aenrol" id="a-enrol" novalidate><label class="fld"><span>Teacher’s name</span><input type="text" id="a-name" autocomplete="off" maxlength="60" placeholder="For example: Mrs Priya Nair"></label>' +
        '<label class="fld"><span>PIN (6 numbers)</span><span class="apin"><input type="text" id="a-pin" inputmode="numeric" maxlength="6" autocomplete="off" class="mono"><button type="button" class="btn small icon" id="a-pin-new" aria-label="New random PIN">' + icon('refresh') + '</button></span></label>' +
        '<button type="submit" class="btn primary">' + icon('plus') + 'Enrol</button></form><div class="notice" id="a-enrol-out" hidden></div>' +
        (people.length ? '<table class="atable"><thead><tr><th>Teacher</th><th class="num">This period</th><th>Last active</th><th></th></tr></thead><tbody>' + enrolledRows + '</tbody></table>' +
          (people.length > 1 ? '<p><button type="button" class="btn small" data-classroom>' + icon('link') + 'Copy a classroom link (every teacher, for a shared laptop)</button></p>' : '') : '<p class="fine">No teachers enrolled yet.</p>') + '</section>' +
      '<section class="card asec"><h2>' + icon('history') + 'Teaching time per day</h2>' + daysChart(m.days) + '<p class="fine">Active minutes only: the site was open and in use.</p></section>' +
      '<section class="card asec"><h2>' + icon('clock') + 'Time by teacher</h2>' + (m.people.filter((p) => p.act).length ? '<ul class="arank">' + m.people.filter((p) => p.act).slice(0, 10).map((p) => '<li><span>' + esc(p.name) + (p.role === 'admin' ? ' <small>(you)</small>' : '') + '</span>' + bar(p.act, maxAct) + '<b>' + esc(fmtDur(p.act)) + '</b></li>').join('') + '</ul>' : '<p class="fine">No teaching time yet in this period.</p>') + '</section>' +
      '<section class="card asec wide"><h2>' + icon('flag') + 'Deviations</h2>' + (m.deviations.length ? '<ul class="adev">' + m.deviations.map((d) => '<li>' + sev(d.sev) + '<span><b>' + esc(d.who || 'Engine') + '</b> ' + esc(d.text) + '</span><small>' + esc(fmtDay(d.at)) + '</small></li>').join('') + '</ul>' : '<p class="fine">Nothing unusual in this period.</p>') + '</section>' +
      '<section class="card asec"><h2>' + icon('layers') + 'Engines</h2>' + (m.engines.length ? '<ul class="arank">' + m.engines.slice(0, 12).map((e) => '<li><span>' + esc(e.name) + (e.fail ? ' <small class="bad">' + e.fail + ' failed</small>' : '') + '</span>' + bar(e.gens + e.presents, maxEng) + '<b>' + (e.gens + e.presents) + '</b></li>').join('') + '</ul>' : '<p class="fine">No engine use in this period.</p>') + '</section>' +
      '<section class="card asec"><h2>' + icon('smile') + 'Class voice</h2><ul class="afaces">' + [4, 3, 2, 1, 0].map((i) => '<li><span class="af">' + faceSVG(i) + '</span><span>' + FACE_NAMES[i] + '</span><span class="abar"><i style="width:' + Math.round(100 * m.faces[i] / maxFace) + '%;background:' + FACE_COLOURS[i] + '"></i></span><b>' + m.faces[i] + '</b></li>').join('') + '</ul>' +
        (m.best.length ? '<p class="fine"><b>Favourite parts:</b> ' + esc(m.best.slice(0, 4).map(([k, v]) => k + ' (' + v + ')').join(', ')) + '</p>' : '<p class="fine">Use “Class feedback” in Present mode to hear from pupils.</p>') + '</section>' +
      '<section class="card asec"><h2>' + icon('star') + 'Teacher feedback</h2>' + (m.feedback.length ? '<ul class="afb">' + m.feedback.slice(0, 6).map((f) => '<li><b>' + esc(f.tn) + '</b> <span class="astars">' + '★'.repeat(f.rating || 0) + '<i>' + '★'.repeat(5 - (f.rating || 0)) + '</i></span><small>' + esc(fmtDay(f.at)) + '</small>' + (f.good ? '<p>+ ' + esc(f.good) + '</p>' : '') + (f.better ? '<p>→ ' + esc(f.better) + '</p>' : '') + '</li>').join('') + '</ul>' : '<p class="fine">No feedback yet. Teachers use “Give feedback” in their menu.</p>') + '</section>' +
      '<section class="card asec"><h2>' + icon('play') + 'Lessons presented</h2>' + (m.lessons.length ? '<ul class="alog">' + m.lessons.slice(0, 8).map((l) => '<li><b>' + esc(l.title || l.eng) + '</b><small>' + esc(l.who + ' · ' + l.eng + ' · ' + fmtDay(l.at) + ' · ' + fmtDur(l.ms)) + (l.mood ? ' · mood ' + r1(l.mood) : '') + '</small></li>').join('') + '</ul>' : '<p class="fine">No lessons presented in this period.</p>') + '</section>' +
      inboxCard(subs, await lastPull()) +
      '<section class="card asec"><h2>' + icon('check') + 'This device</h2><ul class="alog"><li><b>Passkey</b><small>' + (pk ? 'Set up. Sign in with Face ID, fingerprint or the screen lock.' : pkOK ? 'Not set up yet.' : 'This device does not offer passkeys. Use your password.') + '</small></li>' +
        '<li><b>Teachers’ activity key</b><small>' + (adminKey() ? 'Unlocked: your teachers’ activity opens on this device.' : 'Locked: type your password in “From your teachers” to open their activity here.') + '</small></li></ul>' +
        '<div class="aact">' + (pkOK && !pk ? '<button type="button" class="btn small" data-pk-make>' + icon('check') + 'Set up passkey</button>' : '') + (pk ? '<button type="button" class="btn small" data-pk-rm>' + icon('trash') + 'Remove passkey</button>' : '') +
        '<button type="button" class="btn small" data-signout-admin>' + icon('close') + 'Sign out</button><button type="button" class="btn small" data-clear>' + icon('trash') + 'Clear activity data</button></div></section>' +
    '</div></div>';
  wire(host, m);
  $('#a-pin', host).value = newPin();
  if (INBOX && adminKey() && Date.now() - pulledAt > 60000) checkInbox(false);
}

/* ---------------- from your teachers (the inbox) ---------------- */
function inboxStatus(l) {
  if (!l || !l.tried) return 'Checking for new activity…';
  if (l.error && (!l.at || l.tried > l.at)) return l.error === 'access' ? 'The inbox answered with a sign-in page: in Apps Script, its access must be set to “Anyone”.' : 'The inbox could not be reached just now. Check the internet connection, then press Check now.';
  return 'Last checked ' + fmtDay(l.at) + ' at ' + fmtTime(l.at) + (l.added ? ': ' + pl(l.added, 'new record', 'new records') + ' from ' + l.people.join(', ') + '.' : ': nothing new.');
}
function inboxCard(subs, last) {
  let body;
  if (!INBOX) body = '<p class="ainbox"><b>Not switched on yet.</b> Your teachers’ activity waits safely on their own devices and arrives here by itself as soon as the inbox is on. There is nothing for you or your teachers to send.</p>';
  else if (!adminKey()) body = '<p class="fine">Your teachers’ activity arrives here by itself, locked so only you can open it. Type your admin password once on this device to open it.</p>' +
    '<form class="aunlock" id="a-unlock" novalidate><input type="text" name="username" autocomplete="username" value="' + esc(ADMIN_NAME) + '" hidden><label class="fld"><span>Admin password</span><input type="password" id="a-pw" autocomplete="current-password" placeholder="Your admin password"></label><button type="submit" class="btn small">' + icon('key') + 'Unlock</button></form>';
  else body = '<p class="ainbox on"><b>On.</b> <span class="ainbox-st">' + esc(inboxStatus(last)) + '</span></p><p class="fine">Teachers’ devices send their activity every few minutes, locked so only this dashboard can open it.</p>' +
    '<div class="aact"><button type="button" class="btn small" data-pull>' + icon('refresh') + 'Check now</button></div>';
  return '<section class="card asec" id="a-inbox"><h2>' + icon('send') + 'From your teachers</h2>' + body + '<div class="notice" id="a-inbox-out" hidden></div>' +
    (subs.length ? '<ul class="alog">' + subs.slice(0, 6).map((x) => '<li><b>' + esc(x.from) + '</b><small>' + esc(pl(x.n, 'record', 'records') + ' · arrived ' + fmtDay(x.at) + ' at ' + fmtTime(x.at)) + '</small></li>').join('') + '</ul>' : '') + '</section>';
}
function typing() {
  if (!view) return false;
  const a = document.activeElement, n = $('#a-name', view);
  return !!((a && view.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || (n && n.value.trim()));
}
async function checkInbox(byHand) {
  pulledAt = Date.now();
  const btn = view && $('[data-pull]', view);
  if (btn) btn.disabled = true;
  const r = await pull();
  if (!view || !isAdmin()) return r;
  const st = $('.ainbox-st', view), out = $('#a-inbox-out', view), b = $('[data-pull]', view);
  if (b) b.disabled = false;
  if (r && r.added) {
    toast(pl(r.added, 'new record', 'new records') + ' from ' + r.people.join(', ') + ' arrived.');
    if (!view.hidden && !typing()) { await renderAdmin(view); return r; }
    if (out) { notice(out, esc(pl(r.added, 'new record', 'new records') + ' arrived.') + ' <button type="button" class="btn small" id="a-inbox-redo">' + icon('refresh') + 'Update the dashboard</button>', false); const u = $('#a-inbox-redo', view); if (u) u.addEventListener('click', () => renderAdmin(view)); }
  }
  if (st) st.textContent = inboxStatus(await lastPull());
  if (byHand && out && !(r && r.added)) notice(out, r && r.error ? '' : 'Up to date.', false);
  return r;
}

function wire(host, m) {
  $$('[data-range]', host).forEach((b) => b.addEventListener('click', () => { range = b.dataset.range; store.set(RANGE_KEY, range); renderAdmin(host); }));
  $('[data-dl-report]', host).addEventListener('click', () => downloadReport());
  $('[data-enrol]', host).addEventListener('click', () => { const n = $('#a-name', host); $('#a-people', host).scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => n.focus({ preventScroll: true }), 350); });
  $('[data-csv]', host).addEventListener('click', async () => {
    await freshen();
    const evs = (await evAll()).filter((e) => (e.end || e.at) >= m.per.from && e.at <= m.per.to);
    download('KS2 activity - ' + m.per.label + ' - ' + new Date().toISOString().slice(0, 10) + '.csv', csv(evs), 'text/csv;charset=utf-8');
    toast('CSV downloaded. It opens in Excel and Google Sheets.');
  });
  $('[data-ask]', host).addEventListener('click', () => bus.emit('symphony', { brief: true }));
  const an = $('[data-analysis]', host);
  an.addEventListener('click', (e) => { if (deliberate(e, an)) writeAnalysis(); });
  watch(an, { name: 'analysis', label: analysis ? 'Refresh analysis' : 'Symphony’s analysis', icon: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', busy: () => !!busyAnalysis });
  const un = $('#a-unlock', host);
  if (un) un.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#a-inbox-out', host), pw = $('#a-pw', host).value;
    if (!pw) { notice(out, 'Type your admin password.', true); return; }
    let ok = false;
    try { ok = await unlockWithPassword(pw); } catch (er) { ok = false; }
    if (!ok) { notice(out, 'That password did not match.', true); return; }
    pulledAt = 0;
    await renderAdmin(host);
    toast('Unlocked. Your teachers’ activity now opens on this device.');
  });
  const pb = $('[data-pull]', host);
  if (pb) pb.addEventListener('click', () => checkInbox(true));
  $('#a-pin-new', host).addEventListener('click', () => { $('#a-pin', host).value = newPin(); });
  $('#a-enrol', host).addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#a-enrol-out', host), name = $('#a-name', host).value.trim(), pin = $('#a-pin', host).value.trim();
    if (name.length < 2) { notice(out, 'Type the teacher’s name.', true); return; }
    if (!/^\d{6}$/.test(pin)) { notice(out, 'The PIN must be 6 numbers.', true); return; }
    const p = await enrol(name, pin);
    await renderAdmin(host);
    showEnrolled(p, pin);
  });
  $$('[data-link]', host).forEach((b) => b.addEventListener('click', () => { const p = roster().find((x) => x.id === b.dataset.link); if (p) copyLink([p], 'Personal link for ' + p.n + ' copied. Send it privately; they also need their PIN.'); }));
  $$('[data-repin]', host).forEach((b) => b.addEventListener('click', async () => {
    const pin = newPin(), p = await resetPin(b.dataset.repin, pin);
    if (!p) return;
    await renderAdmin(host);
    showEnrolled(p, pin, true);
  }));
  $$('[data-unenrol]', host).forEach((b) => b.addEventListener('click', () => {
    const p = roster().find((x) => x.id === b.dataset.unenrol);
    if (!p || !window.confirm('Remove ' + p.n + '? Their past activity stays in your reports.')) return;
    unenrol(p.id); renderAdmin(host); toast(p.n + ' removed.');
  }));
  const cl = $('[data-classroom]', host);
  if (cl) cl.addEventListener('click', () => copyLink(roster(), 'Classroom link copied. Open it once on the shared laptop: every enrolled teacher can then sign in there with their own PIN.'));
  const pkm = $('[data-pk-make]', host);
  if (pkm) pkm.addEventListener('click', async () => { try { await setUpPasskey(); toast('Passkey ready on this device.'); renderAdmin(host); } catch (e) { toast('The passkey was not set up.'); } });
  const pkr = $('[data-pk-rm]', host);
  if (pkr) pkr.addEventListener('click', () => { removePasskey(); toast('Passkey removed from this device. Your password still works.'); renderAdmin(host); });
  $('[data-signout-admin]', host).addEventListener('click', async () => { await forgetAdminKey(); signOut(); toast('Signed out of the dashboard.'); });
  $('[data-clear]', host).addEventListener('click', async () => {
    if (!window.confirm('Clear every activity record on this device? Download the report first if you need it. This cannot be undone.')) return;
    await evClear(); await kvSet('subs', []); renderAdmin(host); toast('Activity data cleared on this device.');
  });
}
function notice(n, msg, err) { n.innerHTML = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }
function copyLink(people, msg) {
  if (!store.get('ks2-lesson-studio.key.v1')) { toast('Connect this device first (Connect, top right), so the link can set up the engine too.'); return; }
  const link = linkFor(people);
  copyOut('<a href="' + esc(link) + '">' + esc(link) + '</a>', link, msg);
}
function showEnrolled(p, pin, repin) {
  const out = $('#a-enrol-out', view);
  notice(out, '<b>' + esc(p.n) + (repin ? ' has a new PIN.' : ' is enrolled.') + '</b> PIN: <b class="mono">' + esc(pin) + '</b> (tell them yourself; this is the only time it is shown).' +
    '<br><button type="button" class="btn small" id="a-copy-new">' + icon('link') + 'Copy their personal link</button>', false);
  $('#a-copy-new', view).addEventListener('click', () => copyLink([p], 'Personal link for ' + p.n + ' copied. Send it privately.'));
  out.scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#a-name', view).value = '';
}

/* ---------------- Symphony's analysis (written by the engine, added to the report) ---------------- */
export async function writeAnalysis() {
  if (!hasKey()) { toast('Connect this device first, then Symphony can write the analysis.'); return ''; }
  if (busyAnalysis) return '';
  const g = makeState('analysis');
  if (!g.ok) { toast(waitText(g)); return ''; }
  const b = await briefing();
  busyAnalysis = new AbortController();
  const ticket = makeStart('analysis');
  let outcome = 'error';
  if (view && !view.hidden) renderAdmin(view);
  try {
    const r = await askClaude('Here is the activity data for the KS2 Lesson Engine, the teaching website Rabinder Kaur (Head of Key Stage 2) gave her teachers.\n\n' + b.digest +
      '\n\nWrite a careful analysis for Rabinder in 6 to 9 short lines, one point per line, no headings, no markdown symbols. Start with the single most important finding. Use the exact numbers and names. Cover: how much teaching happened and by whom, anything unusual or worrying and what it might mean, what pupils said, what is going well, and finish with 2 or 3 specific actions for this week. Do not invent anything that is not in the data; if the data is thin, say so.',
      { model: CONFIG.mainModel, maxTokens: 900, signal: busyAnalysis.signal });
    analysis = r.text.trim();
    outcome = 'ok';
    toast('Symphony’s analysis is ready. It will be in your next report download.');
  } catch (e) { if (e && e.code === 'cancelled') outcome = 'stopped'; else toast(errorCopy(e && e.code, 'the analysis')); }
  finally { busyAnalysis = null; makeEnd(ticket, outcome); if (view && !view.hidden) renderAdmin(view); }
  return analysis;
}
export const currentAnalysis = () => analysis;
bus.on('who', (w) => { if (!w || w.role !== 'admin') { analysis = ''; lastM = null; } });
