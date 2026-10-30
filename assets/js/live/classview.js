/* The class view (Rabinder's point 9: like Apple Classroom, but in the browser, with no accounts): one tile per pupil
   in the live lesson, with their status (joined, answering, answered, hand up, left), their answer to what is on the
   board now (a vote, a typed answer, a mini whiteboard, a quiz question, a worksheet, a game score), marked right or
   wrong by itself where there is a right answer (tap to change it), and a summary bar.
   For one pupil: their answers, private praise, a sticker or a note (only that pupil's device can open it), "On my
   way" for a raised hand, show their work on the board (with or without the name), her own notes (kept in this tab
   only and gone when the lesson ends) and Remove. For the class: the hands-up queue, pupils' private questions (reply
   privately, or show one on the board with no name), "Eyes on the board", and "Symphony spotted": the answers, with
   no names, go to the engine to find the likely misconception. Nothing about pupils is saved. */
import { $, $$, esc, str, icon, toast, copyOut, bus, hasKey, errorCopy, askJSON, CONFIG, HOUSE_WORDS } from '../core.js?v=49509700';
import { sfx } from '../fx/audio.js?v=49509700';
import { chatState, chatStart, chatEnd } from '../guard.js?v=49509700';
import { Live, onLive, allPupils, pupilsIn, nameOf, answersFor, expectFor, helpQueue, asks, replyAsk, doneAsk, ack, sendTo, setEyes, kick, setDeviceLock, awayOf, setSpot } from './session.js?v=49509700';
import { openJoin } from './panel.js?v=49509700';
import { matches } from '../moments.js?v=49509700';
import { strokesSVG, unpackStrokes } from '../draw.js?v=49509700';
import { STICKERS } from './shapes.js?v=49509700';

let V = null;
const NOTES = () => 'ks2-live.notes.' + Live.sid;
const PRAISE = ['Great work!', 'Brilliant thinking!', 'Keep going, you’re nearly there!', 'Lovely neat work!', 'Super explaining!'];
const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? s + ' s ago' : Math.round(s / 60) + ' min ago'; };
function notes() { try { return JSON.parse(sessionStorage.getItem(NOTES()) || '{}') || {}; } catch (e) { return {}; } }
function setNote(pid, text) { const n = notes(); if (text) n[pid] = text.slice(0, 600); else delete n[pid]; try { sessionStorage.setItem(NOTES(), JSON.stringify(n)); } catch (e) { /* this view only */ } }
const tasks = () => import('./tasks.js?v=49509700').catch(() => null);

/* ---------------- what is on the board now, and each pupil's answer to it ---------------- */
function nowItem(T) {
  const cur = T && T.current ? T.current() : null;
  if (cur) return cur;
  const mo = Live.mo;
  if (!mo) return null;
  const exp = expectFor(mo.id);
  return { kind: 'moment', id: mo.id, mk: mo.kind, title: mo.q || 'Question', label: mo.q || '', exp, opts: mo.opts };
}
function momentAnswer(it, pid) {
  const a = answersFor(it.id).get(pid);
  if (!a) return null;
  const v = a.v, exp = it.exp, ov = V.over.get(it.id + '|' + pid);
  let text = '', ok = null, draw = null;
  if (it.mk === 'show' && v && v.d) draw = v;
  else if (Array.isArray(v)) text = v.filter(Boolean).join(' · ');
  else if (typeof v === 'number') text = it.mk === 'vote' ? 'ABCDEF'[v] + (it.opts && it.opts[v] && it.opts[v] !== 'ABCDEF'[v] ? ': ' + it.opts[v] : '') : it.mk === 'traffic' ? ['Stuck', 'Nearly', 'Got it'][v] || '' : it.mk === 'react' ? ['Got it', 'Nearly', 'Not yet', 'Love it', 'Wow', 'Clap'][v] || '' : it.mk === 'ticket' ? ['Lost', 'Tricky', 'OK', 'Good', 'Loved it'][v] || '' : String(v);
  else text = String(v || '');
  if (exp) {
    if (Number.isInteger(exp.right) && typeof v === 'number') ok = v === exp.right;
    else if (Array.isArray(exp.qs) && exp.qs.some(Boolean)) {
      const list = Array.isArray(v) ? v : [v];
      const scored = exp.qs.map((x, k) => (x ? matches(x, list[k]) : null)).filter((x) => x !== null);
      if (scored.length) ok = scored.every(Boolean);
    } else if (Array.isArray(exp.texts) && typeof v === 'string') ok = exp.texts.some((x) => matches(x, v));
  }
  if (ov === 1 || ov === 0) ok = !!ov;
  return { text, ok, draw, at: a.at };
}
/* { state, text, ok, draw, prog, score } for one pupil */
function cell(it, p) {
  const hand = helpQueue().find((h) => h.pid === p.pid), aw = awayOf(p.pid);
  const base = { hand: !!hand, coming: !!(hand && hand.ack), left: !!p.left, gone: aw && aw.on ? aw : null, goneN: aw ? aw.n || 0 : 0, goneTot: aw ? aw.tot || 0 : 0 };
  if (!it) return Object.assign(base, { state: p.left ? 'left' : 'joined' });
  if (it.kind === 'quiz') {
    const a = it.answer(p.pid);
    const ov = V.over.get(it.id + '|' + p.pid);
    return Object.assign(base, a ? { state: 'answered', text: a.text, ok: ov === 1 ? true : ov === 0 ? false : it.phase === 'reveal' ? a.ok : null, okHidden: it.phase !== 'reveal' ? a.ok : null } : { state: p.left ? 'left' : 'answering' }, { score: it.total(p.pid) });
  }
  if (it.kind === 'sheet') {
    const m = it.marks(p.pid);
    return Object.assign(base, { state: m.handed ? 'answered' : m.done ? 'answering' : p.left ? 'left' : 'joined', prog: m, level: m.level, ok: m.markable ? m.right === m.markable : null });
  }
  if (it.kind === 'game') {
    const s = it.score(p.pid);
    return Object.assign(base, { state: s ? (s.d ? 'answered' : 'answering') : p.left ? 'left' : 'joined', score: s ? s.s : null });
  }
  const a = momentAnswer(it, p.pid);
  return Object.assign(base, a ? { state: 'answered', text: a.text, ok: a.ok, draw: a.draw } : { state: p.left ? 'left' : 'answering' });
}

/* ---------------- opening and painting ---------------- */
export async function openClassView(o) {
  o = o || {};
  closeClassView();
  const T = await tasks();
  V = { host: o.host || document.body, el: null, T, sel: '', big: '', hideNames: false, over: new Map(), spot: null, spotting: false, unsub: null, raf: 0, filter: '' };
  const el = document.createElement('div');
  el.className = 'cv' + (V.host === document.body ? ' fixed' : '');
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Class view');
  V.host.appendChild(el); V.el = el;
  el.addEventListener('click', onClick);
  el.addEventListener('submit', onSubmit);
  V.keyH = (e) => { if (e.key === 'Escape' && V) { e.preventDefault(); e.stopPropagation(); if (V.big) hideBig(); else if (V.sel) { V.sel = ''; paint(); } else closeClassView(); } };
  V.awayT = setInterval(() => { if (!V) return; $$('[data-away-at]', V.el).forEach((b) => { b.textContent = clock(Date.now() - Number(b.dataset.awayAt)); }); }, 1000);
  document.addEventListener('keydown', V.keyH, true);
  V.unsub = onLive(() => soon());
  V.busH = () => soon(); bus.on('live-marks', V.busH);
  paint();
  if (!Live.on) toast('No live lesson is running. Start one and pupils’ answers appear here.');
  setTimeout(() => { const b = V && $('[data-cv="x"]', V.el); if (b) b.focus(); }, 60);
}
export function closeClassView() {
  if (!V) return;
  if (V.board) { V.board.remove(); V.board = null; if (V.big) setSpot(null); }
  clearInterval(V.awayT);
  if (V.unsub) V.unsub();
  document.removeEventListener('keydown', V.keyH, true);
  cancelAnimationFrame(V.raf);
  V.el.remove(); V = null;
}
export const classViewOpen = () => !!V;
function soon() { if (!V) return; cancelAnimationFrame(V.raf); V.raf = requestAnimationFrame(() => { if (!V) return; const f = document.activeElement; const keep = f && V.el.contains(f) && f.matches('input,textarea') ? { id: f.dataset.k, v: f.value, s: f.selectionStart } : null; paint(); if (keep) { const n = $('[data-k="' + keep.id + '"]', V.el); if (n) { n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.s, keep.s); } catch (e) { /* fine */ } } } }); }
function paint() {
  if (!V) return;
  const it = nowItem(V.T), list = allPupils(), rows = list.map((p) => ({ p, c: cell(it, p) }));
  const hands = helpQueue(), qs = asks().filter((a) => !a.done);
  const right = rows.filter((r) => r.c.ok === true).length, notYet = rows.filter((r) => r.c.ok === false).length, working = rows.filter((r) => r.c.state === 'answering').length;
  const shown = V.filter === 'hands' ? rows.filter((r) => r.c.hand) : V.filter === 'wrong' ? rows.filter((r) => r.c.ok === false) : rows;
  const N = notes();
  V.el.innerHTML = '<div class="cv-card">' +
    '<header class="cv-top"><span class="lt-k' + (Live.on ? '' : ' off') + '"><i></i>' + (Live.on ? 'Live' : 'Not live') + '</span><div class="cv-h"><h2>Class view</h2><p>' + esc(it ? it.label || it.title : 'Nothing on pupils’ devices right now') + '</p></div><span class="lt-sp"></span>' +
    '<button type="button" class="pbtn" data-cv="eyes" aria-pressed="' + Live.eyes + '">' + icon('eye') + '<span>' + (Live.eyes ? 'Let them look again' : 'Eyes on the board') + '</span></button>' +
    '<button type="button" class="pbtn' + (Live.dl ? ' locked' : '') + '" data-cv="dlock" aria-pressed="' + !!Live.dl + '"' + (Live.on ? '' : ' disabled') + ' title="Keeps the class page full screen, blocks its links and tells you when someone leaves it">' + icon('lock') + '<span>' + (Live.dl ? 'Unlock devices' : 'Lock devices') + '</span></button>' +
    '<button type="button" class="pbtn" data-cv="spot"' + (it && Live.on ? '' : ' disabled') + '>' + icon('bulb') + '<span>' + (V.spotting ? 'Looking…' : 'Symphony spotted') + '</span></button>' +
    '<button type="button" class="pbtn" data-cv="join">' + icon('qr') + '<span>Join code</span></button>' +
    '<button type="button" class="pbtn" data-cv="notes">' + icon('copy') + '<span>Copy my notes</span></button>' +
    '<button type="button" class="pbtn" data-cv="x">' + icon('close') + '<span>Close</span></button></header>' +
    '<div class="cv-sum" role="group" aria-label="Show">' +
      '<button type="button" class="cv-s s-all" data-cvf="" aria-pressed="' + (V.filter === '') + '"><b>' + list.filter((p) => !p.left).length + '</b><span>joined</span></button>' +
      '<span class="cv-s s-ok"><b>' + right + '</b><span>right</span></span>' +
      '<button type="button" class="cv-s s-no" data-cvf="wrong" aria-pressed="' + (V.filter === 'wrong') + '"><b>' + notYet + '</b><span>not yet</span></button>' +
      '<span class="cv-s s-wk"><b>' + working + '</b><span>working</span></span>' +
      '<button type="button" class="cv-s s-hd" data-cvf="hands" aria-pressed="' + (V.filter === 'hands') + '"><b>' + hands.length + '</b><span>hands up</span></button>' +
      (Live.dl || rows.some((r) => r.c.gone || r.c.goneN) ? '<span class="cv-s s-gone' + (rows.some((r) => r.c.gone) ? ' now' : '') + '"><b>' + rows.filter((r) => r.c.gone).length + '</b><span>left the page</span></span>' : '') +
      '<label class="cv-hide"><input type="checkbox" data-cv="hide"' + (V.hideNames ? ' checked' : '') + '> Hide names on the board</label></div>' +
    (V.spot ? spotHTML() : '') +
    '<div class="cv-body"><div class="cv-main">' +
    (rows.length ? '<ul class="cv-tiles">' + shown.map(({ p, c }) => tileHTML(p, c, N[p.pid])).join('') + '</ul>' : '<p class="lt-empty">' + icon('qr') + '<span>Nobody has joined yet. Show the join code.</span></p>') +
    '</div><aside class="cv-side">' + (V.sel ? pupilHTML(it, V.sel) : sideHTML(hands, qs)) + '</aside></div></div>';
}
const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function tileHTML(p, c, note) {
  const mark = c.ok === true ? '<span class="cv-mk ok" title="Right">' + icon('check') + '</span>' : c.ok === false ? '<span class="cv-mk no" title="Not yet">' + icon('close') + '</span>' : '';
  let body = '';
  if (c.draw) body = '<span class="cv-ink">' + strokesSVG(unpackStrokes(c.draw.d), c.draw.a, nameOf(p.pid) + '’s board') + '</span>';
  else if (c.prog) body = '<span class="cv-prog"><i style="width:' + (c.prog.total ? Math.round((c.prog.done / c.prog.total) * 100) : 0) + '%"></i><em>' + c.prog.done + ' of ' + c.prog.total + '</em></span>' + (c.prog.markable ? '<small>' + c.prog.right + ' of ' + c.prog.markable + ' right</small>' : '') + (c.level && c.level !== 'core' ? '<small class="cv-lv">' + esc(c.level === 'support' ? 'Support' : 'Challenge') + '</small>' : '');
  else if (c.score != null && c.text == null) body = '<span class="cv-score">' + Number(c.score).toLocaleString('en-GB') + ' points</span>';
  else if (c.text) body = '<span class="cv-ans">' + esc(c.text) + '</span>' + (c.score != null ? '<small>' + Number(c.score).toLocaleString('en-GB') + ' points</small>' : '');
  else body = '<span class="cv-wait">' + (c.state === 'left' ? 'Left the lesson' : c.state === 'answering' ? 'Working…' : 'Waiting') + '</span>';
  if (c.gone) body = '<span class="cv-gone">' + icon('eye') + 'Left the page <b data-away-at="' + c.gone.at + '">' + clock(Date.now() - c.gone.at) + '</b></span>' + body;
  else if (c.goneN) body += '<small class="cv-gonen">Left the page ' + c.goneN + (c.goneN === 1 ? ' time' : ' times') + (c.goneTot ? ' · ' + clock(c.goneTot) : '') + '</small>';
  return '<li><button type="button" class="cv-tile ' + c.state + (c.ok === true ? ' ok' : c.ok === false ? ' no' : '') + (c.hand ? ' hand' : '') + (c.gone ? ' gone' : '') + '" data-pid="' + esc(p.pid) + '" aria-label="' + esc(p.name) + ': ' + esc(c.state) + '">' +
    '<span class="cv-tn"><i class="cv-dot" aria-hidden="true"></i><b>' + esc(p.name) + '</b>' + (c.hand ? '<span class="cv-hand" title="' + (c.coming ? 'On your way' : 'Hand up') + '">' + HAND + '</span>' : '') + (note ? '<span class="cv-nt" title="You have a note">' + icon('notes') + '</span>' : '') + mark + '</span>' + body + '</button></li>';
}
const HAND = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13M8 13V9.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3a1.5 1.5 0 0 0-3 0"/></svg>';
function sideHTML(hands, qs) {
  return '<section class="cv-sec"><h3>' + HAND + 'Hands up</h3>' + (hands.length ? '<ol class="cv-q">' + hands.map((h) => '<li><b>' + esc(h.name) + '</b><small>' + ago(h.at) + '</small>' +
    (h.ack ? '<span class="cv-coming">On your way</span><button type="button" class="btn small" data-cv-done="' + esc(h.pid) + '">' + icon('check') + 'Helped</button>' : '<button type="button" class="btn small primary" data-cv-ack="' + esc(h.pid) + '">On my way</button>') + '</li>').join('') + '</ol>' : '<p class="fine">No hands up.</p>') + '</section>' +
    '<section class="cv-sec"><h3>' + icon('chat') + 'Questions from pupils</h3>' + (qs.length ? '<ul class="cv-asks">' + qs.map((a) => '<li><p><b>' + esc(nameOf(a.pid)) + '</b> ' + esc(a.text) + '</p>' +
      '<form class="cv-reply" data-ask="' + esc(a.id) + '"><input type="text" data-k="r' + esc(a.id) + '" maxlength="200" placeholder="Reply to ' + esc(nameOf(a.pid)) + ' only" aria-label="Reply"><button type="submit" class="btn small">' + icon('send') + 'Reply</button></form>' +
      '<p class="cv-acts"><button type="button" class="linkbtn" data-cv-board="' + esc(a.id) + '">Show it on the board (no name)</button> · <button type="button" class="linkbtn" data-cv-adone="' + esc(a.id) + '">Done</button></p></li>').join('') + '</ul>' : '<p class="fine">No questions yet. Pupils can ask you privately from their device.</p>') + '</section>' +
    '<p class="fine cv-priv">' + icon('lock') + ' Names, answers and your notes stay on this screen and are gone when the lesson ends.</p>';
}
function pupilHTML(it, pid) {
  const p = Live.pupils.get(pid);
  if (!p) { V.sel = ''; return sideHTML(helpQueue(), asks().filter((a) => !a.done)); }
  const c = cell(it, p), hand = helpQueue().find((h) => h.pid === pid), note = notes()[pid] || '';
  let answers = '';
  if (it && it.kind === 'sheet') {
    answers = '<ol class="cv-alist">' + it.answers(pid).map((x) => '<li><p>' + esc(x.q) + '</p><p class="cv-given">' + (x.a == null ? '<i>Not answered yet</i>' : x.a && x.a.d ? '<span class="cv-ink sm">' + strokesSVG(unpackStrokes(x.a.d), x.a.a, 'Drawing') + '</span>' : esc(Array.isArray(x.a) ? x.a.map((k) => x.opts[k] || '').join(', ') : typeof x.a === 'number' ? (x.opts[x.a] || '') : String(x.a))) + '</p>' +
      (x.expected ? '<p class="fine">Expected: ' + esc(x.expected) + '</p>' : '') + (x.a != null ? '<p class="cv-mks"><button type="button" class="cv-m ok" data-cv-mark="' + x.i + '" data-v="1" aria-pressed="' + (x.mark === 1) + '">' + icon('check') + 'Right</button><button type="button" class="cv-m no" data-cv-mark="' + x.i + '" data-v="0" aria-pressed="' + (x.mark === 0) + '">' + icon('close') + 'Not yet</button></p>' : '') + '</li>').join('') + '</ol>' +
      (it.levels.length > 1 ? '<p class="cv-lvs">Level: ' + ['support', 'core', 'challenge'].filter((l) => it.levels.includes(l)).map((l) => '<button type="button" class="btn small" data-cv-level="' + l + '" aria-pressed="' + (c.level === l) + '">' + { support: 'Support', core: 'Core', challenge: 'Challenge' }[l] + '</button>').join(' ') + '</p>' : '');
  } else if (c.text || c.draw || c.score != null) {
    answers = '<div class="cv-one">' + (c.draw ? '<span class="cv-ink">' + strokesSVG(unpackStrokes(c.draw.d), c.draw.a, p.name + '’s board') + '</span>' : '') + (c.text ? '<p class="cv-given">' + esc(c.text) + '</p>' : '') + (c.score != null ? '<p class="fine">' + Number(c.score).toLocaleString('en-GB') + ' points</p>' : '') +
      (it && it.kind !== 'game' && (c.text || c.draw) ? '<p class="cv-mks"><button type="button" class="cv-m ok" data-cv-omark="1" aria-pressed="' + (c.ok === true) + '">' + icon('check') + 'Right</button><button type="button" class="cv-m no" data-cv-omark="0" aria-pressed="' + (c.ok === false) + '">' + icon('close') + 'Not yet</button></p>' : '') + '</div>';
  } else answers = '<p class="fine">No answer to this yet.</p>';
  return '<section class="cv-sec cv-pupil"><p class="cv-back"><button type="button" class="linkbtn" data-cv="back">' + icon('left') + 'All pupils</button></p><h3>' + esc(p.name) + (p.left ? ' <small>(left)</small>' : '') + '</h3>' +
    '<p class="fine">Joined ' + new Date(p.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + (p.drops ? ' · dropped off ' + p.drops + (p.drops === 1 ? ' time' : ' times') : '') +
      (c.goneN ? ' · left the class page ' + c.goneN + (c.goneN === 1 ? ' time' : ' times') + (c.goneTot ? ' (' + clock(c.goneTot) + ' in all)' : '') : '') + '</p>' +
    (c.gone ? '<p class="cv-hrow gone">' + icon('eye') + 'Away from the class page for <b data-away-at="' + c.gone.at + '">' + clock(Date.now() - c.gone.at) + '</b></p>' : '') + answers +
    (c.text || c.draw ? '<button type="button" class="btn" data-cv="big">' + icon('expand') + 'Show on the board</button>' : '') +
    (hand ? '<p class="cv-hrow">' + HAND + (hand.ack ? 'You are on your way. <button type="button" class="btn small" data-cv-done="' + esc(pid) + '">Helped</button>' : 'Hand up ' + ago(hand.at) + ' <button type="button" class="btn small primary" data-cv-ack="' + esc(pid) + '">On my way</button>') + '</p>' : '') +
    '<h4>Praise, only for ' + esc(p.name) + '</h4><div class="cv-praise">' + PRAISE.map((t, k) => '<button type="button" class="cv-chip" data-cv-praise="' + k + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<h4>A sticker</h4><div class="cv-stks">' + Object.keys(STICKERS).map((k) => '<button type="button" class="cv-stk" data-cv-stk="' + k + '" style="--c:' + STICKERS[k][1] + '">' + icon(STICKERS[k][2] === 'users' ? 'layers' : STICKERS[k][2] === 'ear' ? 'sound' : STICKERS[k][2]) + '<span>' + esc(STICKERS[k][0]) + '</span></button>').join('') + '</div>' +
    '<form class="cv-note" data-cv-send="1"><label class="fld"><span>A note to ' + esc(p.name) + '</span><input type="text" data-k="pm' + esc(pid) + '" maxlength="200" placeholder="Only ' + esc(p.name) + '’s device can read it"></label><button type="submit" class="btn small">' + icon('send') + 'Send</button></form>' +
    '<label class="fld cv-mine"><span>My note (only on this screen, gone after the lesson)</span><textarea data-k="n' + esc(pid) + '" data-cv-note="' + esc(pid) + '" rows="2" maxlength="600">' + esc(note) + '</textarea></label>' +
    '<p class="cv-acts"><button type="button" class="linkbtn danger" data-cv-kick="' + esc(pid) + '">Remove ' + esc(p.name) + ' from the lesson</button></p></section>';
}
/* Show on the board: an answer or a question big, on top of everything on this screen (the class view, a task's
   board, Present mode in full screen), and on every pupil's device too (as text, never a name). */
function boardHost() {
  const fs = document.fullscreenElement;
  return fs && !fs.contains(V.el) ? fs : V.host;
}
function showBig(what) {
  if (!V || !what) return;
  const it = nowItem(V.T);
  let html = '', sp = null;
  if (what.startsWith('ask:')) {
    const a = asks().find((x) => x.id === what.slice(4));
    if (!a) { toast('That question has gone.'); return; }
    html = '<p class="cv-big-k">A question from the class</p><p class="cv-big-t">' + esc(a.text) + '</p>';
    sp = { k: 'q', t: scrub(a.text) };
  } else {
    const p = Live.pupils.get(what), c = p ? cell(it, p) : null;
    if (!c || (!c.text && !c.draw)) { toast('There is nothing to show yet.'); return; }
    html = (c.draw ? '<span class="cv-ink big">' + strokesSVG(unpackStrokes(c.draw.d), c.draw.a, 'A pupil’s board') + '</span>' : '<p class="cv-big-k">An answer from the class</p><p class="cv-big-t">' + esc(c.text) + '</p>') +
      (V.hideNames ? '' : '<p class="cv-big-n">' + esc(p.name) + '</p>');
    sp = c.text && !c.draw ? { k: 'a', t: scrub(c.text) } : null;
  }
  V.big = what;
  let el = V.board;
  if (!el) {
    el = document.createElement('div');
    el.className = 'cv-board'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'On the board');
    el.addEventListener('click', (e) => { if (e.target.closest('[data-cvb="x"]')) hideBig(); });
    V.board = el;
  }
  const host = boardHost();
  el.classList.toggle('fixed', host === document.body);
  el.innerHTML = '<div class="cv-board-in">' + html + '</div><p class="cv-board-f">' + (sp ? icon('check') + 'On pupils’ devices too' : '') + '</p>' +
    '<button type="button" class="btn big cv-board-x" data-cvb="x">' + icon('left') + 'Back to the class</button>';
  host.appendChild(el);
  setSpot(sp);
  sfx('whoosh');
  setTimeout(() => { const b = V && V.board && $('[data-cvb="x"]', V.board); if (b) b.focus(); }, 60);
}
function hideBig() {
  if (!V) return;
  V.big = '';
  if (V.board) { V.board.remove(); V.board = null; }
  setSpot(null);
  paint();
}
function spotHTML() {
  const s = V.spot;
  if (s.err) return '<div class="cv-spot err">' + icon('info') + '<span>' + esc(s.err) + '</span><button type="button" class="pbtn" data-cv="unspot" aria-label="Close">' + icon('close') + '</button></div>';
  return '<div class="cv-spot"><span class="cv-spot-k">' + icon('bulb') + 'Symphony spotted</span><div>' + s.groups.map((g) => '<p><b>' + esc(g.count + (g.count === 1 ? ' answered ' : ' answered ') + g.answer) + '</b> ' + esc(g.why) + '</p>').join('') +
    (s.next ? '<p class="cv-next">' + icon('right') + esc(s.next) + '</p>' : '') + (!s.groups.length && !s.next ? '<p>' + esc(s.note || 'No common mistake stood out.') + '</p>' : '') + '</div><button type="button" class="pbtn" data-cv="unspot" aria-label="Close">' + icon('close') + '</button></div>';
}

/* ---------------- taps ---------------- */
async function onClick(e) {
  if (!V) return;
  const t = e.target;
  const tile = t.closest('[data-pid]');
  if (tile && t.closest('.cv-tiles')) { V.sel = tile.dataset.pid; paint(); return; }
  const f = t.closest('[data-cvf]');
  if (f) { V.filter = f.dataset.cvf; paint(); return; }
  if (t.matches('[data-cv="hide"]')) { V.hideNames = t.checked; return; }
  const ackB = t.closest('[data-cv-ack]');
  if (ackB) { const ok = await ack(ackB.dataset.cvAck); toast(ok ? 'They can see you are on your way.' : 'That did not reach their device. Try again.'); return; }
  const done = t.closest('[data-cv-done]');
  if (done) { const pid = done.dataset.cvDone, h = Live.help.get(pid); if (h) { h.on = false; h.ack = 0; } sendTo(pid, { k: 'lower' }); soon(); return; }
  const pr = t.closest('[data-cv-praise]');
  if (pr && V.sel) { const ok = await sendTo(V.sel, { k: 'praise', text: PRAISE[Number(pr.dataset.cvPraise)] }); toast(ok ? 'Sent. Only ' + nameOf(V.sel) + ' sees it.' : 'That did not send. Try again.'); if (ok) sfx('pop', 4); return; }
  const stk = t.closest('[data-cv-stk]');
  if (stk && V.sel) { const ok = await sendTo(V.sel, { k: 'sticker', s: stk.dataset.cvStk }); toast(ok ? 'Sticker sent to ' + nameOf(V.sel) + '.' : 'That did not send. Try again.'); if (ok) sfx('success'); return; }
  const mk = t.closest('[data-cv-mark]');
  if (mk && V.sel) { const it = nowItem(V.T); if (it && it.kind === 'sheet') { const v = Number(mk.dataset.v), cur = mk.getAttribute('aria-pressed') === 'true'; it.setMark(V.sel, Number(mk.dataset.cvMark), cur ? null : v); } paint(); return; }
  const om = t.closest('[data-cv-omark]');
  if (om && V.sel) { const it = nowItem(V.T); if (it) { const key = it.id + '|' + V.sel, v = Number(om.dataset.cvOmark); if (V.over.get(key) === v) V.over.delete(key); else V.over.set(key, v); } paint(); return; }
  const lv = t.closest('[data-cv-level]');
  if (lv && V.sel) { const it = nowItem(V.T); if (it && it.setLevel) it.setLevel(V.sel, lv.dataset.cvLevel); paint(); return; }
  const kb = t.closest('[data-cv-kick]');
  if (kb) { const pid = kb.dataset.cvKick; if (kb.dataset.sure) { const n = nameOf(pid); kick(pid); V.sel = ''; toast(n + ' has been removed from this lesson.'); paint(); } else { kb.dataset.sure = '1'; kb.textContent = 'Tap again to remove'; } return; }
  const bd = t.closest('[data-cv-board]');
  if (bd) { showBig('ask:' + bd.dataset.cvBoard); return; }
  const ad = t.closest('[data-cv-adone]');
  if (ad) { doneAsk(ad.dataset.cvAdone); return; }
  const b = t.closest('[data-cv]');
  if (!b) return;
  const a = b.dataset.cv;
  if (a === 'x') closeClassView();
  else if (a === 'back') { V.sel = ''; paint(); }
  else if (a === 'eyes') { setEyes(!Live.eyes); toast(Live.eyes ? 'Every pupil’s screen says “Eyes on the board”.' : 'Pupils can see their screens again.'); paint(); }
  else if (a === 'join') openJoin(V.el, Live.title);
  else if (a === 'notes') copyNotes();
  else if (a === 'big') showBig(V.sel);
  else if (a === 'unbig') hideBig();
  else if (a === 'dlock') {
    setDeviceLock(!Live.dl);
    toast(Live.dl ? 'Devices locked: the class page stays full screen where it can, its links are blocked, and you see who leaves it.' : 'Devices unlocked.');
    paint();
  }
  else if (a === 'spot') spot();
  else if (a === 'unspot') { V.spot = null; paint(); }
}
async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const input = $('input', f), text = str(input && input.value);
  if (!text) return;
  if (f.dataset.ask) { const ok = await replyAsk(f.dataset.ask, text); toast(ok ? 'Reply sent. Only that pupil sees it.' : 'That did not send. Try again.'); return; }
  if (f.dataset.cvSend && V.sel) { const ok = await sendTo(V.sel, { k: 'note', text }); if (ok) { input.value = ''; toast('Sent. Only ' + nameOf(V.sel) + ' sees it.'); } else toast('That did not send. Try again.'); }
}
document.addEventListener('input', (e) => { const n = e.target.closest && e.target.closest('[data-cv-note]'); if (n) setNote(n.dataset.cvNote, n.value); });
function copyNotes() {
  const N = notes(), ids = Object.keys(N).filter((pid) => N[pid]);
  if (!ids.length) { toast('No notes yet. Tap a pupil to write one.'); return; }
  const lines = ids.map((pid) => nameOf(pid) + ': ' + N[pid]);
  copyOut('<ul>' + ids.map((pid) => '<li><b>' + esc(nameOf(pid)) + ':</b> ' + esc(N[pid]) + '</li>').join('') + '</ul>', (Live.title ? Live.title + '\n' : '') + lines.join('\n'), 'Your notes are copied. They are not saved anywhere else.');
}

/* ---------------- Symphony spotted: the answers, with no names, to find the misconception ---------------- */
function scrub(text) {
  let t = String(text || '');
  allPupils().forEach((p) => { const n = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (n.length > 1) t = t.replace(new RegExp('\\b' + n + '\\b', 'gi'), 'someone'); });
  return t.slice(0, 200);
}
function material(it) {
  if (!it) return null;
  if (it.kind === 'quiz') {
    const list = allPupils().map((p) => it.answer(p.pid)).filter(Boolean);
    return { question: it.q.q, options: it.q.opts, right: it.q.type === 'type' ? it.q.a : it.q.opts[it.q.a], answers: list.map((a) => scrub(a.text)) };
  }
  if (it.kind === 'sheet') {
    const per = new Map();
    allPupils().forEach((p) => it.answers(p.pid).forEach((x) => {
      if (x.mark !== 0 || x.a == null || (x.a && x.a.d)) return;
      const k = x.q, cur = per.get(k) || { question: x.q, right: x.expected, answers: [] };
      cur.answers.push(scrub(Array.isArray(x.a) ? x.a.map((i) => x.opts[i] || '').join(', ') : typeof x.a === 'number' ? (x.opts[x.a] || '') : String(x.a)));
      per.set(k, cur);
    }));
    const worst = Array.from(per.values()).sort((a, b) => b.answers.length - a.answers.length)[0];
    return worst || null;
  }
  if (it.kind === 'moment') {
    const list = allPupils().map((p) => momentAnswer(it, p.pid)).filter((a) => a && a.text);
    const exp = it.exp;
    return { question: it.title, options: it.opts || undefined, right: exp ? (Number.isInteger(exp.right) && it.opts ? it.opts[exp.right] : Array.isArray(exp.qs) ? exp.qs.filter(Boolean).join(' / ') : Array.isArray(exp.texts) ? exp.texts.join(' / ') : '') : '', answers: list.map((a) => scrub(a.text)) };
  }
  return null;
}
async function spot() {
  if (!V || V.spotting) return;
  const it = nowItem(V.T), m = material(it);
  if (!m || !m.answers || m.answers.length < 2) { V.spot = { err: 'Symphony needs at least two answers to spot a pattern.' }; paint(); return; }
  if (!hasKey()) { V.spot = { err: errorCopy('no_key') }; bus.emit('need-key'); paint(); return; }
  const g = chatState();
  if (!g.ok) { V.spot = { err: 'Symphony needs a short rest. Try again in ' + Math.max(1, Math.ceil(g.left / 1000)) + ' seconds.' }; paint(); return; }
  V.spotting = true; paint();
  const t = chatStart();
  let ok = false;
  try {
    const prompt = 'A KS2 teacher (pupils aged 7 to 11) is checking her class live. Here are the pupils’ answers to one question, with no names.\n' +
      'Question: ' + m.question + '\n' + (m.options && m.options.length ? 'Options: ' + m.options.join(' | ') + '\n' : '') + (m.right ? 'Right answer: ' + m.right + '\n' : '') +
      'Answers (one per pupil): ' + JSON.stringify(m.answers.slice(0, 60)) + '\n\n' +
      'Group the wrong answers that share a cause, and name the most likely misconception for each group in one short, kind sentence a teacher can act on. Then give one short teaching move for the whole class. ' + HOUSE_WORDS + '\n' +
      'Reply with JSON only: {"groups":[{"answer":"the wrong answer pupils gave","count":3,"why":"what they probably did"}],"next":"one teaching move","note":"if nothing stands out, say so"}. At most 3 groups. British English.';
    const r = await askJSON(prompt, { model: CONFIG.quickModel, maxTokens: 600 });
    const groups = (Array.isArray(r && r.groups) ? r.groups : []).slice(0, 3).map((x) => ({ answer: str(x && x.answer).slice(0, 80), count: Math.max(1, Math.round(Number(x && x.count) || 1)), why: str(x && x.why).slice(0, 240) })).filter((x) => x.answer && x.why);
    V && (V.spot = { groups, next: str(r && r.next).slice(0, 240), note: str(r && r.note).slice(0, 200) });
    ok = true;
    if (V && V.T && V.T.logSpotted) V.T.logSpotted(groups.map((x) => x.answer + ': ' + x.why).join(' ') || str(r && r.note));
    sfx('success');
  } catch (er) {
    if (V) V.spot = { err: errorCopy(er && er.code, 'that') };
  } finally {
    chatEnd(t, ok);
    if (V) { V.spotting = false; paint(); }
  }
}
