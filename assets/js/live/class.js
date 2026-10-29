/* The Classroom page (#/class): each class is a live session.
   - Start: a name for the class, its subject and year, and what is in it (lessons, quizzes, worksheets, games from My
     subjects; homework). Started from Today or the calendar, it arrives filled in (library.js takeClass()).
   - Running: the waiting room and register (names pop in; lock the door; remove a name; Copy register, never saved),
     the lesson flow (each step moves the board and every pupil's device together: lessons open in Present mode with
     their questions going to devices, quizzes, worksheets and games run through tasks.js), quick checks in one tap
     (thumbs, traffic light, a fast vote, a word cloud, whiteboards, a question), class tools that reach phones (a
     timer, groups, work signs, team points, a name picked from who is here; the full Class tools dock if it is
     there), Eyes on the board, pupils' private questions, Symphony's help, the exit ticket and homework with Add to
     my calendar on every device.
   - End class: a summary with no names (how many came, what was covered, the quiz average, what Symphony spotted,
     the class mood, the homework set, and Symphony's idea for the next lesson's starter), saved in My subjects and
     shown at #/class/<id>. */
import { $, $$, esc, str, icon, toast, copyOut, bus, hasKey, askJSON, CONFIG, HOUSE_WORDS, YEARS } from '../core.js?v=de4f9a51';
import { sfx } from '../fx/audio.js?v=de4f9a51';
import { confetti } from '../fx/particles.js?v=de4f9a51';
import { chatState, chatStart, chatEnd } from '../guard.js?v=de4f9a51';
import { SUBJECT_LIST, subjectName, subjectColor, yearOf, subjectOf, takeClass, pickItem, getItem, openItem, findItem, putItem, startMaking, startClass } from '../library.js?v=de4f9a51';
import { Live, startLive, endLive, onLive, allPupils, setLock, setEyes, asks, setDeviceLock, awayAll, awayCount } from './session.js?v=de4f9a51';
import { openJoin } from './panel.js?v=de4f9a51';
import { startQuizLive, sendSheetLive, sendGameLive, sendHomework, taskLog, logStep, pushGroups, pushTimer, stopTimerLive, classPupils } from './tasks.js?v=de4f9a51';
import { openMoment } from '../moments.js?v=de4f9a51';

const SS = 'ks2-engine.class.v1';
let C = null, view = null, tick = 0, unsub = null, picked = new Set();
const fmtClock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const STEP_KIND = { lkie: ['Lesson', 'pack'], slides: ['Lesson', 'slides'], eng: ['Activity', 'spark'], quiz: ['Quiz', 'quiz'], sheet: ['Worksheet', 'sheet'], game: ['Game', 'game'], ticket: ['Exit ticket', 'smile'], hw: ['Homework', 'cal'] };

/* ---------------- this tab's class (it carries on after a reload, like the live lesson) ---------------- */
function save() { try { if (C) sessionStorage.setItem(SS, JSON.stringify(C)); else sessionStorage.removeItem(SS); } catch (e) { /* this visit only */ } }
function load() { try { const v = JSON.parse(sessionStorage.getItem(SS) || 'null'); return v && v.title ? v : null; } catch (e) { return null; } }
function draft() { return { title: '', subject: '', year: '', date: today(), slot: '', items: [], hw: null, sid: '', startedAt: 0, cur: -1, done: [], ticket: [0, 0, 0, 0, 0], ticketId: '', checks: [], maxIn: 0, stickers: 0 }; }
function stepsOf(c) {
  const steps = c.items.map((it) => ({ key: it.key, k: it.k, title: it.title }));
  steps.push({ k: 'ticket', title: 'Exit ticket: how did it feel?' });
  if (c.hw) steps.push({ k: 'hw', title: 'Homework: ' + c.hw.title });
  return steps;
}

/* ---------------- the page ---------------- */
export function mount(v, sub) {
  view = v;
  if (!view.dataset.wired) {
    view.dataset.wired = '1';
    view.addEventListener('click', onClick);
    view.addEventListener('submit', onSubmit);
    view.addEventListener('change', onChange);
  }
  if (unsub) unsub();
  unsub = onLive(onLiveChange);
  clearInterval(tick);
  tick = setInterval(paintClock, 1000);
  if (sub) { showSummary(sub); return; }
  const saved = load();
  if (Live.on && saved && saved.sid === Live.sid) C = saved;
  else if (Live.on && (!C || C.sid !== Live.sid)) { C = Object.assign(draft(), { title: Live.title || 'Live lesson', sid: Live.sid, startedAt: Live.at || Date.now() }); save(); }
  else if (!Live.on && C && C.sid) { C = null; save(); }
  const pre = takeClass();
  if (pre && !Live.on) C = Object.assign(draft(), prefill(pre));
  if (!C) C = draft();
  render();
}
export function leave() { clearInterval(tick); if (unsub) { unsub(); unsub = null; } }
function prefill(o) {
  const items = (Array.isArray(o.items) ? o.items : []).map((key) => { const it = findItem(key); return it ? { key, k: it.k, title: it.title } : null; }).filter(Boolean);
  const hw = o.homework && typeof o.homework === 'object' && o.homework.title && o.homework.due ? o.homework : null;
  return { title: str(o.title).slice(0, 120), subject: subjectOf(o.subject) || '', year: yearOf(o.year) || '', date: /^\d{4}-\d{2}-\d{2}$/.test(String(o.date || '')) ? o.date : today(), slot: str(o.slot).slice(0, 40), items, hw };
}
function render() {
  if (!view) return;
  if (Live.on && C && C.sid === Live.sid) renderRun(); else renderStart();
}

/* ---------------- start a class ---------------- */
function renderStart() {
  const c = C;
  const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t) + '</option>';
  view.innerHTML = '<div class="wrap pg cls">' +
    '<header class="pg-head"><p class="kicker" style="--c:var(--accent)">Classroom</p><h1>Start a class</h1><p class="pg-sub">Pupils scan in with a QR code, with no accounts. Every step you take moves the board and their devices together.</p></header>' +
    '<div class="cls-start"><section class="card cls-plan" aria-labelledby="cls-ph"><h2 id="cls-ph" class="cls-h">' + icon('board') + 'This class</h2>' +
    '<label class="fld"><span>Class name</span><input type="text" id="cls-title" maxlength="120" autocomplete="off" placeholder="For example: Year 5 Science" value="' + esc(c.title) + '"></label>' +
    '<div class="row2"><label class="fld"><span>Subject</span><select id="cls-subject">' + opt('', 'Choose…', c.subject) + SUBJECT_LIST.map((s) => opt(s.id, s.short, c.subject)).join('') + '</select></label>' +
    '<label class="fld"><span>Year group</span><select id="cls-year">' + opt('', 'Choose…', c.year) + YEARS.map((y) => opt(y, y, c.year)).join('') + opt('KS2', 'Whole KS2', c.year) + '</select></label></div>' +
    '<h3 class="cls-sh">What’s in this class</h3>' + itemsHTML(c) +
    '<div class="cls-adds"><button type="button" class="btn" data-cls="add">' + icon('plus') + 'Add from My subjects</button><button type="button" class="btn" data-cls="hw">' + icon('plan') + (c.hw ? 'Change the homework' : 'Add homework') + '</button></div>' +
    (c.hw ? '<p class="cls-hwline">' + icon('plan') + '<span><b>' + esc(c.hw.title) + '</b> · due ' + esc(dueWords(c.hw)) + '</span><button type="button" class="linkbtn" data-cls="hw-x">Remove</button></p>' : '') +
    '<div class="cls-hwf" id="cls-hwf" hidden></div>' +
    '<p class="fine">An exit ticket (how did it feel?) comes at the end by itself.</p>' +
    '<button type="button" class="btn primary big wide" data-cls="start">' + icon('play') + 'Start class</button></section>' +
    '<aside class="card cls-how"><h2 class="cls-h">' + icon('info') + 'How a class works</h2><ol class="cls-steps"><li><b>Start class.</b> A QR code and a 6-digit code appear. Put them on the board or in the class chat.</li>' +
    '<li><b>Pupils scan in</b> with a first name. No accounts, no apps.</li><li><b>Teach.</b> Each step you tap appears on the board and on every pupil’s device. Check answers live in the class view.</li>' +
    '<li><b>End class.</b> You get a summary with no names, saved in My subjects.</li></ol>' +
    '<p class="cls-priv">' + icon('lock') + '<span>Names and answers stay on your screen and are gone when the class ends. Everything is locked end to end.</span></p></aside></div></div>';
}
function itemsHTML(c) {
  if (!c.items.length) return '<p class="cls-empty">' + icon('layers') + '<span>Nothing yet. Add a lesson, a quiz, a worksheet or a game, or start with nothing and use quick checks.</span></p>';
  return '<ol class="cls-items">' + c.items.map((it, k) => { const K = STEP_KIND[it.k] || ['Item', 'layers'];
    return '<li><span class="cls-ik">' + icon(K[1]) + '</span><span class="cls-it"><b>' + esc(it.title) + '</b><small>' + esc(K[0]) + '</small></span>' +
      '<button type="button" class="btn small icon" data-cls-up="' + k + '" aria-label="Move up"' + (k ? '' : ' disabled') + '>' + icon('up') + '</button>' +
      '<button type="button" class="btn small icon" data-cls-rm="' + k + '" aria-label="Remove ' + esc(it.title) + '">' + icon('close') + '</button></li>'; }).join('') + '</ol>';
}
const dueWords = (hw) => { const d = new Date(hw.due + 'T12:00:00'); return isNaN(d) ? hw.due : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + (hw.dueTime ? ' at ' + hw.dueTime : ''); };
function hwForm(hw) {
  const f = $('#cls-hwf', view);
  if (!f) return;
  const d = new Date(); d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1));
  const due = hw && hw.due ? hw.due : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  f.hidden = false;
  f.innerHTML = '<form class="form cls-hwform" data-cls-form="hw"><label class="fld"><span>Homework</span><input type="text" name="title" maxlength="120" required placeholder="For example: Fractions worksheet, page 2" value="' + esc(hw ? hw.title : '') + '"></label>' +
    '<label class="fld"><span>What to do <span class="opt">(optional)</span></span><textarea name="details" rows="2" maxlength="600">' + esc(hw ? hw.details : '') + '</textarea></label>' +
    '<div class="row2"><label class="fld"><span>Due</span><input type="date" name="due" value="' + esc(due) + '" required></label><label class="fld"><span>Time <span class="opt">(optional)</span></span><input type="time" name="dueTime" value="' + esc(hw ? hw.dueTime || '' : '') + '"></label></div>' +
    '<label class="fld"><span>A link <span class="opt">(optional)</span></span><input type="url" name="link" maxlength="300" placeholder="https://…" value="' + esc(hw ? hw.link || '' : '') + '"></label>' +
    '<div class="cls-adds"><button type="submit" class="btn primary">' + icon('check') + 'Keep this homework</button><button type="button" class="btn" data-cls="hw-cancel">Cancel</button></div></form>';
  const t = $('input[name="title"]', f); if (t) t.focus();
}
function readHw(form) {
  const v = (n) => str((form.elements[n] || {}).value);
  const hw = { id: C.hw && C.hw.id ? C.hw.id : 'h' + Date.now().toString(36).slice(-6), subject: subjectName(C.subject || 'general', true), cls: C.title, year: C.year, title: v('title').slice(0, 120), details: v('details').slice(0, 600), set: today(), due: v('due'), dueTime: v('dueTime'), link: /^https:\/\//.test(v('link')) ? v('link').slice(0, 300) : '' };
  if (!hw.title) { toast('Give the homework a title.'); return null; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hw.due)) { toast('Choose the day it is due.'); return null; }
  return hw;
}
async function addItems() {
  const key = await pickItem({ title: 'Add to this class', kinds: ['lkie', 'slides', 'eng', 'quiz', 'sheet', 'game'], subject: C.subject, year: C.year });
  if (!key) return;
  const it = findItem(key);
  if (!it) return;
  if (C.items.some((x) => x.key === key)) { toast('That is already in this class.'); return; }
  C.items.push({ key, k: it.k, title: it.title });
  if (!C.subject && it.subject && it.subject !== 'general') C.subject = it.subject;
  if (!C.year && it.year) C.year = it.year;
  if (!C.title) C.title = (C.year ? C.year + ' ' : '') + subjectName(C.subject || it.subject, true);
  save(); render();
}
async function begin() {
  const title = str(($('#cls-title', view) || {}).value) || C.title || ((C.year ? C.year + ' ' : '') + (C.subject ? subjectName(C.subject, true) : 'class'));
  C.title = title.slice(0, 120);
  const btn = $('[data-cls="start"]', view);
  if (btn) { btn.disabled = true; btn.lastChild.textContent = 'Starting…'; }
  try { await startLive(C.title); }
  catch (e) {
    if (btn) { btn.disabled = false; btn.lastChild.textContent = 'Start class'; }
    if (e && e.code === 'elsewhere') { openJoin(document.body, C.title); return; }
    toast('The class could not start. Check the internet connection and try again.');
    return;
  }
  Object.assign(C, { sid: Live.sid, startedAt: Date.now(), cur: -1, done: [], ticket: [0, 0, 0, 0, 0], checks: [], maxIn: 0, stickers: 0 });
  save();
  sfx('success');
  render();
  openJoin(document.body, C.title);
}

/* ---------------- the class, running ---------------- */
function renderRun() {
  const c = C, steps = stepsOf(c);
  view.innerHTML = '<div class="wrap pg cls run">' +
    '<header class="cls-head"><div class="cls-hl"><p class="kicker cls-live" style="--c:#B42318"><i aria-hidden="true"></i>Live class · <span data-cls-clock>' + fmtClock(Date.now() - c.startedAt) + '</span></p><h1>' + esc(c.title) + '</h1>' +
    '<p class="pg-sub">' + esc([c.subject ? subjectName(c.subject, true) : '', c.year].filter(Boolean).join(' · ') || 'Live session') + '</p></div>' +
    '<div class="cls-hr"><button type="button" class="btn" data-cls="join">' + icon('qr') + 'Join code</button><button type="button" class="btn" data-cls="lock" aria-pressed="' + Live.locked + '">' + icon(Live.locked ? 'lock' : 'unlock') + '<span>' + (Live.locked ? 'Door locked' : 'Lock the door') + '</span></button>' +
    '<button type="button" class="btn primary" data-cls="cv">' + icon('vote') + 'Class view</button><button type="button" class="btn cls-end" data-cls="end">' + icon('stop') + '<span>End class</span></button></div></header>' +
    '<div class="cls-grid">' +
    '<section class="card cls-room" aria-labelledby="cls-rh"><div class="cls-sec-h"><h2 id="cls-rh" class="cls-h">' + icon('users') + 'Who’s here</h2><button type="button" class="btn small" data-cls="register">' + icon('copy') + 'Copy register</button></div><div data-cls-room>' + roomHTML() + '</div></section>' +
    '<section class="card cls-flow" aria-labelledby="cls-fh"><div class="cls-sec-h"><h2 id="cls-fh" class="cls-h">' + icon('layers') + 'Lesson flow</h2><button type="button" class="btn small" data-cls="add">' + icon('plus') + 'Add</button></div>' +
    '<ol class="cls-strip">' + steps.map((s, k) => { const K = STEP_KIND[s.k] || ['Step', 'layers'], st = c.done.includes(k) ? 'done' : c.cur === k ? 'now' : '';
      return '<li><button type="button" class="cls-step ' + st + '" data-cls-step="' + k + '"><span class="cls-sn">' + (st === 'done' ? icon('check') : k + 1) + '</span><span class="cls-si">' + icon(K[1]) + '</span><b>' + esc(s.title) + '</b><small>' + esc(st === 'now' ? 'Now' : st === 'done' ? 'Done' : K[0]) + '</small></button></li>'; }).join('') + '</ol>' +
    '<div class="cls-next">' + nextHTML(steps) + '</div></section>' +
    '<section class="card cls-checks" aria-labelledby="cls-ch"><h2 id="cls-ch" class="cls-h">' + icon('bolt') + 'Quick checks</h2><p class="fine">One tap: it appears on every device and the answers come back here.</p>' +
    '<form class="cls-qform" data-cls-form="check"><label class="fld"><span>Your question <span class="opt">(optional)</span></span><input type="text" name="q" maxlength="200" placeholder="For example: One word to describe a volcano"></label></form>' +
    '<div class="cls-qbtns">' + [['react', 'thumb', 'Thumbs'], ['traffic', 'target', 'Traffic light'], ['vote', 'vote', 'Fast vote'], ['cloud', 'chat', 'Word cloud'], ['show', 'board', 'Whiteboards'], ['chat', 'type', 'Typed answers']].map(([k, ic, t]) => '<button type="button" class="cls-qb" data-cls-check="' + k + '">' + icon(ic) + '<span>' + t + '</span></button>').join('') + '</div></section>' +
    '<section class="card cls-tools" aria-labelledby="cls-th"><h2 id="cls-th" class="cls-h">' + icon('clock') + 'Class tools</h2>' +
    '<div class="cls-tbtns"><button type="button" class="cls-qb" data-cls="pick">' + icon('star') + '<span>Pick a name</span></button><button type="button" class="cls-qb" data-cls="groups">' + icon('users') + '<span>Make groups</span></button>' +
    '<button type="button" class="cls-qb' + (Live.eyes ? ' on' : '') + '" data-cls="eyes" aria-pressed="' + Live.eyes + '">' + icon('eye') + '<span>' + (Live.eyes ? 'Let them look' : 'Eyes on the board') + '</span></button>' +
    '<button type="button" class="cls-qb' + (Live.dl ? ' on' : '') + '" data-cls="dlock" aria-pressed="' + !!Live.dl + '">' + icon('lock') + '<span>' + (Live.dl ? 'Unlock devices' : 'Lock devices') + '</span></button>' +
    '<button type="button" class="cls-qb" data-cls="dock">' + icon('wand') + '<span>All class tools</span></button></div>' +
    '<p class="fine cls-lockn" data-cls-lockn' + (Live.dl ? '' : ' hidden') + '>' + LOCK_NOTE + '</p>' +
    '<div class="cls-row"><span class="cls-rl" id="cls-gl">Groups of</span><div class="seg" role="group" aria-labelledby="cls-gl">' + [2, 3, 4, 5].map((n) => '<button type="button" data-cls-gsize="' + n + '" aria-pressed="' + ((c.gsize || 3) === n) + '">' + n + '</button>').join('') + '</div></div>' +
    '<div class="cls-row"><span class="cls-rl" id="cls-tl">Timer on devices</span><div class="cls-tset" role="group" aria-labelledby="cls-tl">' + [1, 2, 3, 5].map((m) => '<button type="button" class="btn small" data-cls-timer="' + m + '">' + m + ' min</button>').join('') +
    '<button type="button" class="btn small" data-cls="timer-x" aria-label="Stop the timer">' + icon('stop') + 'Stop</button></div></div>' +
    '<p class="cls-tnow" data-cls-tnow hidden></p>' +
    '<div data-cls-pick></div></section>' +
    '<section class="card cls-sym" aria-labelledby="cls-yh"><h2 id="cls-yh" class="cls-h">' + icon('heart') + 'Symphony and the class</h2>' +
    '<div class="cls-tbtns"><button type="button" class="cls-qb" data-cls="readq">' + icon('volume') + '<span>Read the question aloud</span></button><a class="cls-qb" href="#/break">' + icon('breath') + '<span>Brain break</span></a>' +
    '<button type="button" class="cls-qb" data-cls="cv">' + icon('bulb') + '<span>Symphony spotted</span></button></div><div data-cls-asks>' + asksHTML() + '</div></section>' +
    '</div></div>';
}
const roomSeen = new Set();
const LOCK_NOTE = 'Devices are locked: the class page stays full screen where the browser allows it, its links are blocked, and you see here who leaves it. ' +
  'A website cannot stop a phone or tablet opening other apps. Your school’s device settings can: Guided Access on iPads, App pinning on Android, or a Chromebook’s locked mode.';
const clockS = (ms) => { const x = Math.max(0, Math.round(ms / 1000)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
/* Who has left the class page while devices are locked (a live line in Who's here), and who came back lately. */
function awayHTML() {
  const list = awayAll(), now = Date.now();
  const gone = list.filter((a) => a.on), back = list.filter((a) => !a.on && a.back && now - a.back < 30000);
  if (!gone.length && !back.length) return '';
  return '<ul class="cls-away" aria-live="polite">' + gone.map((a) => '<li class="gone">' + icon('eye') + '<span><b>' + esc(a.name) + '</b> left the class page (<span data-cls-at="' + a.at + '">' + clockS(now - a.at) + '</span>)</span></li>').join('') +
    back.map((a) => '<li>' + icon('check') + '<span><b>' + esc(a.name) + '</b> came back' + (a.ms ? ' after ' + clockS(a.ms) : '') + '</span></li>').join('') + '</ul>';
}
function roomHTML() {
  const list = allPupils(), here = list.filter((p) => !p.left);
  setTimeout(() => list.forEach((p) => roomSeen.add(p.pid)), 0);          // only a name that has just joined pops in
  C.maxIn = Math.max(C.maxIn || 0, here.length);
  return '<p class="cls-count"><b>' + here.length + '</b><span>' + (here.length === 1 ? 'pupil here' : 'pupils here') + (list.length > here.length ? ' · ' + (list.length - here.length) + ' left' : '') + '</span></p>' +
    '<div data-cls-away>' + awayHTML() + '</div>' +
    (Live.code ? '<p class="cls-code"><span>Code <b>' + esc(String(Live.code).replace(/^(\d{3})(\d{3})$/, '$1 $2')) + '</b></span><button type="button" class="linkbtn" data-cls="join">Show the QR code</button></p>' : '') +
    (list.length ? '<ul class="cls-names">' + list.map((p) => '<li class="' + (p.left ? 'left' : '') + (roomSeen.has(p.pid) ? '' : ' new') + '"><i class="cls-dot" aria-hidden="true"></i>' + esc(p.name) + (Live.help.get(p.pid) && Live.help.get(p.pid).on ? '<span class="cls-hand" title="Hand up">' + icon('flag') + '</span>' : '') + '</li>').join('') + '</ul>'
      : '<p class="fine">Waiting for pupils… Show the join code on the board or put the link in the class chat.</p>');
}
function asksHTML() {
  const open = asks().filter((a) => !a.done).length;
  return open ? '<p class="cls-asks">' + icon('chat') + '<span><b>' + open + '</b> private ' + (open === 1 ? 'question' : 'questions') + ' from pupils.</span><button type="button" class="btn small" data-cls="cv">Answer in the class view</button></p>' : '<p class="fine">Pupils can ask you privately from their device. Their questions appear here.</p>';
}
function nextHTML(steps) {
  const k = steps.findIndex((s, i) => !C.done.includes(i) && i !== C.cur);
  if (C.cur >= 0 && !C.done.includes(C.cur)) return '<button type="button" class="btn primary" data-cls="step-done">' + icon('check') + 'Step done</button>' + (k >= 0 ? '<span class="fine">Next: ' + esc(steps[k].title) + '</span>' : '');
  return k >= 0 ? '<button type="button" class="btn primary" data-cls-step="' + k + '">' + icon('play') + 'Start: ' + esc(steps[k].title) + '</button>' : '<span class="fine">Every step is done. End the class when you are ready.</span>';
}
function paintToggles() {
  const l = $('[data-cls="lock"]', view), e = $('[data-cls="eyes"]', view);
  if (l) { l.setAttribute('aria-pressed', String(Live.locked)); l.innerHTML = icon(Live.locked ? 'lock' : 'unlock') + '<span>' + (Live.locked ? 'Door locked' : 'Lock the door') + '</span>'; }
  if (e) { e.setAttribute('aria-pressed', String(Live.eyes)); e.classList.toggle('on', Live.eyes); e.innerHTML = icon('eye') + '<span>' + (Live.eyes ? 'Let them look' : 'Eyes on the board') + '</span>'; }
  const d = $('[data-cls="dlock"]', view), n = $('[data-cls-lockn]', view);
  if (d) { d.setAttribute('aria-pressed', String(!!Live.dl)); d.classList.toggle('on', !!Live.dl); d.innerHTML = icon('lock') + '<span>' + (Live.dl ? 'Unlock devices' : 'Lock devices') + '</span>'; }
  if (n) n.hidden = !Live.dl;
}
let rang = '';
function paintClock() {
  const c = view && $('[data-cls-clock]', view);
  if (c && C && C.startedAt) c.textContent = fmtClock(Date.now() - C.startedAt);
  if (view) $$('[data-cls-at]', view).forEach((b) => { b.textContent = clockS(Date.now() - Number(b.dataset.clsAt)); });
  if (view && Live.on && awayAll().some((a) => !a.on && a.back && Date.now() - a.back >= 30000 && Date.now() - a.back < 31500)) { const a = $('[data-cls-away]', view); if (a) a.innerHTML = awayHTML(); }
  // the timer that is on pupils' devices, shown here too, with a chime when it runs out
  const t = view && $('[data-cls-tnow]', view), tm = Live.on && Live.tools ? Live.tools.timer : null;
  if (!t) return;
  if (!tm) { t.hidden = true; return; }
  const left = tm.paused ? (tm.left || 0) * 1000 : Math.max(0, (tm.ends || 0) - Date.now()), id = String(tm.ends || '') + '|' + tm.secs;
  t.hidden = false;
  t.classList.toggle('done', !tm.paused && left <= 0);
  t.innerHTML = icon('clock') + '<span>' + (!tm.paused && left <= 0 ? 'Time’s up on every device' : 'Timer on devices: ' + fmtClock(left + 999) + (tm.paused ? ' (paused)' : '')) + '</span>';
  if (!tm.paused && left <= 0 && rang !== id) { rang = id; sfx('chime'); }
}
function onLiveChange(w) {
  if (!view || !view.isConnected) return;
  if (w === 'end') { if (C && C.sid && !C.ending) { toast('The live class has ended.'); C = null; save(); render(); } return; }
  if (!(Live.on && C && C.sid === Live.sid)) return;
  if (w === 'pupils' || w === 'help' || w === 'code' || (w && w.help)) { const r = $('[data-cls-room]', view); if (r) r.innerHTML = roomHTML(); save(); }
  if (w === 'asks' || (w && w.ask) || w === 'pupils') { const a = $('[data-cls-asks]', view); if (a) a.innerHTML = asksHTML(); }
  if (w === 'lock' || w === 'eyes' || w === 'dlock') paintToggles();
  if (w && w.away) { const a = $('[data-cls-away]', view); if (a) a.innerHTML = awayHTML(); }
  if (w === 'tools') paintClock();
  // the exit ticket's faces, as pupils tap them on their own devices
  if (w && w.ans && Live.mo && Live.mo.id === w.ans && Live.mo.kind === 'ticket' && typeof w.v === 'number' && w.v >= 0 && w.v < 5) {
    if (typeof w.prev === 'number' && C.ticket[w.prev] > 0) C.ticket[w.prev] -= 1;
    C.ticket[w.v] += 1; save();
  }
}

/* ---------------- running a step ---------------- */
async function runStep(k) {
  const steps = stepsOf(C), s = steps[k];
  if (!s) return;
  if (C.cur >= 0 && C.cur !== k && !C.done.includes(C.cur)) C.done.push(C.cur);
  C.cur = k; save(); renderRun();
  logStep({ kind: 'step', title: s.title, what: (STEP_KIND[s.k] || ['Step'])[0] });
  if (s.k === 'ticket') {
    bus.emit('ticket', { host: document.body, eng: 'class', title: C.title, screens: steps.filter((x) => x.k !== 'ticket' && x.k !== 'hw').map((x) => x.title).slice(0, 8),
      onSaved: (r) => {
        if (!C) return;
        // feedback.js can pass the final faces (device taps and the teacher's own taps); otherwise the device count stands
        if (r && Array.isArray(r.faces) && r.faces.length === 5) C.ticket = r.faces.map((n) => Math.max(0, Math.round(Number(n)) || 0));
        if (!C.done.includes(k)) C.done.push(k);
        save(); render();
      } });
    return;
  }
  if (s.k === 'hw') { if (await sendHomework(C.hw)) { if (!C.done.includes(k)) C.done.push(k); save(); render(); } return; }
  if (['lkie', 'slides', 'eng'].includes(s.k)) { presentStep(k, s); return; }
  const it = await getItem(s.key);
  if (!it || !it.data) { toast('That could not be opened. It may have been removed from My subjects.'); return; }
  const data = Object.assign({ title: it.title, subject: it.subject, year: it.year }, it.data);
  if (s.k === 'quiz') startQuizLive(data, {});
  else if (s.k === 'sheet') sendSheetLive(data, {});
  else if (s.k === 'game') sendGameLive(data, {});
}
/* A lesson step goes straight onto the board in Present mode, connected to this class, so every pupil's device
   follows each slide. When she closes Present, she comes back here with that step "Now". */
let presentT = 0;
function presentStep(k, s) {
  if (!findItem(s.key)) { toast('That lesson could not be found in My subjects. It may have been removed.'); return; }
  C.presenting = { k, key: s.key, at: Date.now(), on: false }; save();
  openItem(s.key, { present: true });
  clearTimeout(presentT);
  presentT = setTimeout(() => {
    if (C && C.presenting && C.presenting.key === s.key && !C.presenting.on) toast('The lesson is open. Press Present to put it on the board and on pupils’ devices.');
  }, 6000);
}
bus.on('present', (on) => {
  if (!C || !C.presenting) return;
  if (on) {
    if (Date.now() - C.presenting.at < 60000) { C.presenting.on = true; clearTimeout(presentT); save(); } else { C.presenting = null; save(); }
    return;
  }
  if (!C.presenting.on) return;
  const k = C.presenting.k;
  C.presenting = null;
  if (Live.on && C.sid === Live.sid) { C.cur = k; if (!/^#\/class(\/|$)/.test(location.hash || '')) location.hash = '#/class'; }
  save();
});
function quickCheck(kind) {
  const f = $('[data-cls-form="check"]', view), q = f ? str(f.elements.q.value) : '';
  const def = { react: 'How are you getting on?', traffic: 'How are you getting on?', vote: q || 'Vote: A, B, C or D?', cloud: q || 'One word to describe today’s lesson', show: q || 'Show me your working', chat: q || 'Type your answer' }[kind];
  if ((kind === 'chat' || kind === 'show') && !q) toast('Tip: type the question first, so it appears on their devices.');
  openMoment({ kind, q: def, title: def, lesson: C.title, opts: kind === 'vote' ? ['A', 'B', 'C', 'D'] : undefined });
  C.checks.push({ kind, at: Date.now() }); save();
  logStep({ kind: 'check', title: { react: 'Thumbs check', traffic: 'Traffic light', vote: 'Fast vote', cloud: 'Word cloud', show: 'Mini whiteboards', chat: 'Typed answers' }[kind] });
  if (f) f.elements.q.value = '';
}
/* A name from who is here: fair (nobody twice until everyone has had a turn), said by this device's own voice. */
function pickName() {
  const here = classPupils();
  const box = $('[data-cls-pick]', view);
  if (!here.length) { if (box) box.innerHTML = '<p class="fine">Nobody has joined yet.</p>'; return; }
  let pool = here.filter((p) => !picked.has(p.pid));
  if (!pool.length) { picked = new Set(); pool = here; }
  const p = pool[Math.floor(Math.random() * pool.length)];
  picked.add(p.pid);
  if (box) {
    box.innerHTML = '<div class="cls-picked" role="status"><span class="cls-spin">' + esc(here[Math.floor(Math.random() * here.length)].name) + '</span></div>';
    let n = 0;
    const t = setInterval(() => { const s = $('.cls-spin', box); if (!s) { clearInterval(t); return; } n += 1; s.textContent = here[(n * 7) % here.length].name; if (n >= 10) { clearInterval(t); s.textContent = p.name; s.classList.add('got'); sfx('success'); speakName(p.name); } }, 90);
  }
}
function speakName(name) {
  try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(name); u.lang = 'en-GB'; s.speak(u); } catch (e) { /* no voice: the name is on the screen */ }
}
const GROUP_COLOURS = ['#4F46E5', '#1F7A75', '#C2581A', '#8B44C2', '#B42318', '#0B7F99', '#9A6A00', '#C7356F'];
function makeGroups() {
  const here = classPupils(), size = [2, 3, 4, 5].includes(C.gsize) ? C.gsize : 3;
  const box = $('[data-cls-pick]', view);
  if (here.length < 2) { if (box) box.innerHTML = '<p class="fine">At least two pupils need to have joined.</p>'; return; }
  const list = here.slice().sort(() => Math.random() - 0.5), n = Math.max(1, Math.round(list.length / size)), groups = Array.from({ length: n }, (x, k) => ({ name: 'Group ' + (k + 1), color: GROUP_COLOURS[k % GROUP_COLOURS.length], pids: [] }));
  list.forEach((p, k) => groups[k % n].pids.push(p.pid));
  pushGroups(groups);
  if (box) box.innerHTML = '<ul class="cls-groups">' + groups.map((g) => '<li style="--c:' + g.color + '"><b>' + esc(g.name) + '</b><span>' + g.pids.map((pid) => esc((here.find((p) => p.pid === pid) || {}).name || '')).join(', ') + '</span></li>').join('') + '</ul><p class="fine">Each pupil sees their own group on their device.</p>';
  sfx('success');
  logStep({ kind: 'check', title: 'Groups of ' + size });
}
async function tryDock() {
  try { const m = await import('../tools/tools.js?v=de4f9a51'); if (m.openToolDock) { m.openToolDock(document.body); return; } } catch (e) { /* not there yet */ }
  location.hash = '#/tools';
}
function copyRegister() {
  const list = allPupils();
  if (!list.length) { toast('Nobody has joined yet.'); return; }
  const t = (x) => (x ? new Date(x).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
  const rows = list.map((p) => '<tr><td>' + esc(p.name) + '</td><td>' + t(p.at) + '</td><td>' + (p.left ? 'Left ' + t(p.leftAt) : 'Here') + '</td></tr>').join('');
  const text = [C.title + ' · ' + new Date().toLocaleDateString('en-GB'), ''].concat(list.map((p) => p.name + ', joined ' + t(p.at) + (p.left ? ', left ' + t(p.leftAt) : ''))).join('\n');
  copyOut('<table border="1" cellpadding="4"><caption>' + esc(C.title) + '</caption><tr><th>Name</th><th>Joined</th><th>Now</th></tr>' + rows + '</table>', text, 'Register copied. The site does not keep it.');
}

/* ---------------- ending: a summary with no names ---------------- */
async function endClass(btn) {
  if (!btn.dataset.sure) { btn.dataset.sure = '1'; const s = $('span', btn); if (s) s.textContent = 'Tap again to end'; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; if (s) s.textContent = 'End class'; } }, 3500); return; }
  const c = C;
  c.ending = true;
  const steps = stepsOf(c);
  if (c.cur >= 0 && !c.done.includes(c.cur)) c.done.push(c.cur);
  const faces = c.ticket || [0, 0, 0, 0, 0], votes = faces.reduce((a, b) => a + b, 0);
  const quizzes = taskLog.filter((x) => x.kind === 'quiz'), sheets = taskLog.filter((x) => x.kind === 'sheet'), games = taskLog.filter((x) => x.kind === 'game');
  const summary = {
    v: 1, title: c.title, subject: c.subject, year: c.year, date: c.date || today(), start: c.startedAt, end: Date.now(), mins: Math.max(1, Math.round((Date.now() - c.startedAt) / 60000)),
    pupils: Math.max(c.maxIn || 0, allPupils().length), steps: steps.map((s, k) => ({ title: s.title, kind: (STEP_KIND[s.k] || ['Step'])[0], done: c.done.includes(k) })),
    quizzes: quizzes.map((q) => ({ title: q.title, avg: q.avg, questions: q.questions, hardest: q.hardest || [] })), sheets: sheets.map((s) => ({ title: s.title, avg: s.avg, handed: s.handed, pupils: s.pupils })), games: games.map((g) => ({ title: g.title, pupils: g.pupils })),
    checks: taskLog.filter((x) => x.kind === 'check').map((x) => x.title).slice(0, 12), spotted: taskLog.filter((x) => x.kind === 'spotted').map((x) => x.text).slice(0, 5),
    mood: votes ? Math.round((faces.reduce((a, n, i) => a + n * (i + 1), 0) / votes) * 10) / 10 : 0, moodVotes: votes, faces, homework: c.hw ? { title: c.hw.title, due: c.hw.due } : null, next: '',
    away: awayCount()
  };
  await endLive();
  C = null; save();
  let key = '';
  try { key = await putItem('class', { title: summary.title + ' · ' + new Date(summary.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), topic: summary.title, subject: summary.subject || 'general', year: summary.year, n: summary.pupils, unit: 'class', data: summary }); } catch (e) { key = ''; }
  sfx('success');
  if (!key) { toast('The class has ended. Its summary could not be saved on this device.'); render(); return; }
  const id = key.slice(key.indexOf(':') + 1);
  location.hash = '#/class/' + encodeURIComponent(id);
  suggestNext(key, summary);
}
/* Symphony's idea for the next lesson's starter: one short question to the engine, with no names. */
async function suggestNext(key, summary) {
  if (!hasKey()) return;
  const g = chatState();
  if (!g.ok) return;
  const t = chatStart();
  let ok = false;
  try {
    const facts = { class: summary.title, subject: summary.subject ? subjectName(summary.subject) : '', year: summary.year, covered: summary.steps.filter((s) => s.done).map((s) => s.title), quizzes: summary.quizzes, worksheets: summary.sheets, spotted: summary.spotted, mood: summary.mood, homework: summary.homework };
    const r = await askJSON('A KS2 teacher (an international school in Ipoh, Malaysia, English National Curriculum) has just finished this lesson. Here is what happened, with no pupil names: ' + JSON.stringify(facts) + '\n' +
      'Suggest a 5-minute starter for the next lesson that tackles what pupils found hardest. ' + HOUSE_WORDS + ' British English.\nReply with JSON only: {"starter":"what to do, in two or three short sentences","topic":"the next lesson’s topic in a few words"}', { model: CONFIG.quickModel, maxTokens: 400 });
    const it = await getItem(key);
    if (it && it.data) {
      it.data.next = str(r && r.starter).slice(0, 400); it.data.nextTopic = str(r && r.topic).slice(0, 80);
      await putItem('class', { id: it.id, title: it.title, topic: it.topic, subject: it.subject, year: it.year, n: it.n, unit: 'class', data: it.data });
      ok = true;
      if (view && view.isConnected && location.hash.indexOf(encodeURIComponent(it.id)) >= 0) showSummary(it.id);
    }
  } catch (e) { /* the summary stands without it */ }
  finally { chatEnd(t, ok); }
}
async function showSummary(id) {
  const it = await getItem('class:' + decodeURIComponent(id));
  if (!view) return;
  if (!it || !it.data) { view.innerHTML = '<div class="wrap pg cls"><header class="pg-head"><p class="kicker">Classroom</p><h1>That class summary has gone</h1><p class="pg-sub">It may have been removed from My subjects.</p></header><p><a class="btn primary" href="#/class">' + icon('play') + 'Start a class</a></p></div>'; return; }
  const s = it.data, when = new Date(s.end || it.at);
  const moodWord = s.mood ? ['', 'Lost', 'Tricky', 'OK', 'Good', 'Loved it'][Math.round(s.mood)] : '';
  const quizAvg = s.quizzes && s.quizzes.length ? Math.round(s.quizzes.reduce((a, q) => a + (q.avg || 0), 0) / s.quizzes.length) : null;
  view.innerHTML = '<div class="wrap pg cls sum">' +
    '<header class="pg-head"><p class="kicker" style="--c:' + subjectColor(s.subject || 'general') + '">Class summary · ' + esc(when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })) + '</p><h1>' + esc(s.title) + '</h1>' +
    '<p class="pg-sub">' + esc([s.subject ? subjectName(s.subject, true) : '', s.year, s.mins + (s.mins === 1 ? ' minute' : ' minutes')].filter(Boolean).join(' · ')) + '. No pupil names are kept.</p></header>' +
    '<div class="cls-stats"><div class="card"><b>' + (s.pupils || 0) + '</b><span>pupils joined</span></div><div class="card"><b>' + (quizAvg == null ? '–' : quizAvg + '%') + '</b><span>quiz average</span></div>' +
    '<div class="card"><b>' + (s.mood ? s.mood.toFixed(1) : '–') + '</b><span>class mood' + (moodWord ? ': ' + esc(moodWord) : '') + (s.moodVotes ? ' (' + s.moodVotes + ' votes)' : '') + '</span></div><div class="card"><b>' + (s.steps || []).filter((x) => x.done).length + '</b><span>steps done</span></div></div>' +
    '<div class="cls-sumgrid"><section class="card"><h2 class="cls-h">' + icon('layers') + 'What was covered</h2><ul class="cls-list">' + (s.steps || []).map((x) => '<li class="' + (x.done ? 'done' : '') + '">' + icon(x.done ? 'check' : 'minus') + '<span>' + esc(x.title) + ' <small>' + esc(x.kind) + '</small></span></li>').join('') + '</ul>' +
    (s.checks && s.checks.length ? '<p class="fine">Quick checks: ' + esc(s.checks.join(', ')) + '.</p>' : '') +
    (s.away ? '<p class="fine">Devices were locked: pupils left the class page ' + s.away + (s.away === 1 ? ' time' : ' times') + ' in all.</p>' : '') + '</section>' +
    '<section class="card"><h2 class="cls-h">' + icon('bulb') + 'What pupils found hard</h2>' +
    ((s.quizzes || []).some((q) => q.hardest && q.hardest.length) ? '<ul class="cls-list">' + s.quizzes.flatMap((q) => (q.hardest || []).map((h) => '<li>' + icon('target') + '<span>' + esc(h.q) + ' <small>' + h.pct + '% right</small></span></li>')).join('') + '</ul>' : '') +
    ((s.spotted || []).length ? '<p class="cls-spot">' + esc(s.spotted.join(' ')) + '</p>' : '') +
    (!(s.spotted || []).length && !((s.quizzes || []).some((q) => q.hardest && q.hardest.length)) ? '<p class="fine">Nothing was flagged. Use Symphony spotted in the class view to find common mistakes.</p>' : '') + '</section>' +
    '<section class="card"><h2 class="cls-h">' + icon('plan') + 'Homework</h2>' + (s.homework ? '<p><b>' + esc(s.homework.title) + '</b><br><span class="fine">Due ' + esc(dueWords(s.homework)) + '</span></p>' : '<p class="fine">No homework was set.</p>') + '</section>' +
    '<section class="card cls-nextc"><h2 class="cls-h">' + icon('spark') + 'Next lesson’s starter</h2>' + (s.next ? '<p>' + esc(s.next) + '</p>' : '<p class="fine">' + (hasKey() ? 'Symphony is thinking of one…' : 'Connect this device to get Symphony’s idea.') + '</p>') +
    '<div class="cls-adds"><button type="button" class="btn primary" data-cls-make="' + esc(s.nextTopic || s.title) + '">' + icon('spark') + 'Make the next lesson</button><button type="button" class="btn" data-cls="again">' + icon('play') + 'Start another class</button></div></section></div></div>';
  view.dataset.sum = JSON.stringify({ subject: s.subject || '', year: s.year || '', title: s.title });
}

/* ---------------- taps ---------------- */
async function onClick(e) {
  const t = e.target;
  const step = t.closest('[data-cls-step]');
  if (step) { runStep(Number(step.dataset.clsStep)); return; }
  const chk = t.closest('[data-cls-check]');
  if (chk) { quickCheck(chk.dataset.clsCheck); return; }
  const gs = t.closest('[data-cls-gsize]');
  if (gs) { C.gsize = Number(gs.dataset.clsGsize); save(); $$('[data-cls-gsize]', view).forEach((x) => x.setAttribute('aria-pressed', String(x === gs))); return; }
  const tm = t.closest('[data-cls-timer]');
  if (tm) { const m = Number(tm.dataset.clsTimer); pushTimer({ secs: m * 60, ends: Date.now() + m * 60000 }); paintClock(); toast('A ' + m + '-minute timer is on every pupil’s device.'); sfx('tap'); return; }
  const up = t.closest('[data-cls-up]');
  if (up) { const k = Number(up.dataset.clsUp); if (k > 0) { const x = C.items.splice(k, 1)[0]; C.items.splice(k - 1, 0, x); save(); render(); } return; }
  const rm = t.closest('[data-cls-rm]');
  if (rm) { C.items.splice(Number(rm.dataset.clsRm), 1); save(); render(); return; }
  const mk = t.closest('[data-cls-make]');
  if (mk) { const o = JSON.parse(view.dataset.sum || '{}'); startMaking({ kind: 'slides', topic: mk.dataset.clsMake, subject: o.subject, year: o.year, from: 'class' }); return; }
  const b = t.closest('[data-cls]');
  if (!b) return;
  const a = b.dataset.cls;
  if (a === 'add') addItems();
  else if (a === 'hw') hwForm(C.hw);
  else if (a === 'hw-x') { C.hw = null; save(); render(); }
  else if (a === 'hw-cancel') { const f = $('#cls-hwf', view); if (f) { f.hidden = true; f.innerHTML = ''; } }
  else if (a === 'start') begin();
  else if (a === 'join') openJoin(document.body, C.title);
  else if (a === 'lock') { setLock(!Live.locked); toast(Live.locked ? 'The door is locked. Nobody new can join.' : 'The door is open again.'); }
  else if (a === 'cv') import('./classview.js?v=de4f9a51').then((m) => m.openClassView({ host: document.body }));
  else if (a === 'end') endClass(b);
  else if (a === 'register') copyRegister();
  else if (a === 'pick') pickName();
  else if (a === 'groups') makeGroups();
  else if (a === 'timer-x') { stopTimerLive(); paintClock(); toast('The timer has stopped on every device.'); }
  else if (a === 'dock') tryDock();
  else if (a === 'eyes') { setEyes(!Live.eyes); toast(Live.eyes ? 'Every pupil’s screen says “Eyes on the board”.' : 'Pupils can see their screens again.'); }
  else if (a === 'dlock') { setDeviceLock(!Live.dl); paintToggles(); toast(Live.dl ? 'Devices locked. You will see here who leaves the class page.' : 'Devices unlocked.'); }
  else if (a === 'readq') { const q = Live.tk && Live.tk.q ? Live.tk.q : Live.mo && Live.mo.q ? Live.mo.q : ''; if (q) import('../fx/voice.js?v=de4f9a51').then((m) => m.Voice.say(q, { lang: 'en-GB', style: 'chat' })); else toast('There is no question on pupils’ devices right now.'); }
  else if (a === 'step-done') { if (C.cur >= 0 && !C.done.includes(C.cur)) C.done.push(C.cur); C.cur = -1; save(); renderRun(); confetti(view, { count: 40, y: 0.2 }); }
  else if (a === 'again') { const o = JSON.parse(view.dataset.sum || '{}'); startClass({ title: o.title, subject: o.subject, year: o.year }); }
}
function onSubmit(e) {
  const f = e.target.closest('[data-cls-form]');
  if (!f) return;
  e.preventDefault();
  if (f.dataset.clsForm === 'hw') { const hw = readHw(f); if (!hw) return; C.hw = hw; save(); render(); toast('Homework kept. It goes to every device at the end, with Add to my calendar.'); }
}
function onChange(e) {
  if (!C) return;
  if (e.target.id === 'cls-subject') { C.subject = e.target.value; save(); }
  else if (e.target.id === 'cls-year') { C.year = e.target.value; save(); }
  else if (e.target.id === 'cls-title') { C.title = str(e.target.value).slice(0, 120); save(); }
}
