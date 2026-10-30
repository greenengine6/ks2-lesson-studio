/* The Game maker (#/game and #/game/<id>), Rabinder's point 13: "gamify prompts". A teacher describes a game in her
   own words and Symphony builds it from one of five templates (Balloon pop, Match pairs, Sort it, Quiz race, Memory),
   or, with "Something new", writes a whole game from scratch, which only ever runs in a locked box
   (games/run.html). She tries it here, changes it by asking, plays it on the board, sends it to pupils' devices,
   and it is kept in My subjects. Every engine press goes through the shared guard (guard.js). */
import { $, $$, esc, str, icon, toast, hasKey, askJSON, askClaude, errorCopy, AiError, CONFIG, bus, store, YEARS } from '../core.js?v=af1c9ebd';
import { LIMITS, makeState, makeStart, makeEnd, editState, editStart, editEnd, deliberate, watch, waitText, clockAt } from '../guard.js?v=af1c9ebd';
import { track } from '../track.js?v=af1c9ebd';
import { sfx as uiSfx, Sound } from '../fx/audio.js?v=af1c9ebd';
import { SUBJECT_LIST, subjectOf, subjectName, subjectColor, yearOf, putItem, getItem, removeItem, listAll, findItem, folders, addFolder, moveItem, takeMaking, onLibrary, dayLabel } from '../library.js?v=af1c9ebd';
import { TEMPLATES, TEMPLATE_BY_ID, normGame, exampleGame, itemCount } from './model.js?v=af1c9ebd';
import { SYSTEM, CUSTOM_SYSTEM, makeRequest, editRequest, customRequest, customEditRequest, parseCustom } from './prompts.js?v=af1c9ebd';
import { playGame } from './player.js?v=af1c9ebd';

const FORM = 'ks2-engine.game.form.v1';
const SPARK = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>';
const S = { view: null, game: null, key: '', example: true, template: '', busy: null, editing: false, preview: null, board: null, sure: '', tasks: undefined, wiredLib: false };

/* ---------------- the page ---------------- */
function pageHTML() {
  const chip = (id, name) => '<button type="button" class="pill" data-tpl="' + id + '" aria-pressed="' + (id === '') + '">' + esc(name) + '</button>';
  return '<div class="wrap pg gm">' +
    '<header class="pg-head"><p class="kicker">Create · Game</p><h1>Game maker</h1>' +
    '<p class="pg-sub">Describe a game in your own words. Symphony builds it, you try it here, then play it on the board or send it to pupils’ devices.</p></header>' +
    '<div class="gm-grid">' +
    '<section class="card gm-make" aria-labelledby="gm-make-h">' +
      '<h2 class="gm-h" id="gm-make-h">Start from</h2>' +
      '<div class="gm-chips" role="group" aria-label="Kind of game">' + chip('', 'Let Symphony choose') + TEMPLATES.map((t) => chip(t.id, t.name)).join('') + '</div>' +
      '<p class="gm-say" id="gm-say" aria-live="polite"></p>' +
      '<label class="fld"><span>Describe your game</span><textarea id="gm-desc" rows="4" maxlength="600" placeholder="For example: Year 4 fractions. Balloons float up with fractions on them. Pop the ones that are equal to one half. 60 seconds and 3 lives."></textarea></label>' +
      '<div class="gm-row"><label class="fld gm-topic"><span>Topic</span><input type="text" id="gm-topic" maxlength="120" autocomplete="off" placeholder="For example: Equivalent fractions"></label>' +
      '<label class="fld"><span>Year group</span><select id="gm-year">' + YEARS.map((y) => '<option>' + y + '</option>').join('') + '</select></label>' +
      '<label class="fld"><span>Subject</span><select id="gm-subject">' + SUBJECT_LIST.map((s) => '<option value="' + s.id + '">' + esc(s.short) + '</option>').join('') + '</select></label></div>' +
      '<button type="button" class="btn primary big wide" id="gm-go"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + '</svg><span>Make my game</span></button>' +
      '<div class="gm-busy" id="gm-busy" hidden><div class="meter"><i id="gm-bar"></i></div><button type="button" class="btn small" id="gm-stop">' + icon('stop') + 'Stop</button></div>' +
      '<p class="fine" id="gm-fine"></p>' +
      '<div class="notice" id="gm-notice" hidden role="status"></div>' +
      '<div class="gm-chat" id="gm-chat">' +
        '<h3 class="gm-h">Change it by asking</h3>' +
        '<ul class="gm-log" id="gm-log" aria-live="polite"></ul>' +
        '<form class="gm-ask" id="gm-ask" novalidate><label class="sr" for="gm-ask-in">Ask for a change</label><input type="text" id="gm-ask-in" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="For example: make it slower and add harder ones">' +
        '<button type="submit" class="btn icon primary" aria-label="Send the change">' + icon('send') + '</button></form>' +
        '<p class="fine" id="gm-ask-fine">Each change goes to Symphony. One every ' + Math.round(LIMITS.editGap / 1000) + ' seconds.</p>' +
      '</div>' +
    '</section>' +
    '<section class="gm-play" aria-labelledby="gm-title">' +
      '<div class="gm-play-head"><div><p class="kicker" id="gm-kind"></p><h2 id="gm-title"></h2></div></div>' +
      '<div class="gm-preview" id="gm-preview" aria-label="Try the game here"></div>' +
      '<div class="gm-actions">' +
        '<button type="button" class="btn primary" id="gm-board">' + icon('play') + '<span>Play on the board</span></button>' +
        '<button type="button" class="btn" id="gm-devices">' + icon('qr') + '<span>Send to pupils’ devices</span></button>' +
      '</div>' +
      '<div class="gm-save" id="gm-save" hidden><label for="gm-folder">Saved in</label><select id="gm-folder"></select>' +
        '<span class="gm-new" id="gm-new" hidden><input type="text" id="gm-new-name" maxlength="60" placeholder="New folder name" aria-label="New folder name"><button type="button" class="btn small" id="gm-new-go">Add</button></span></div>' +
      '<p class="fine gm-safe">' + icon('lock') + '<span>Games run in a locked box: they cannot see your keys, your files or your pupils’ names.</span></p>' +
    '</section></div>' +
    '<section class="gm-mine" aria-labelledby="gm-mine-h"><h2 class="gm-h" id="gm-mine-h">Your games</h2><ul class="gm-list" id="gm-list"></ul>' +
      '<p class="fine" id="gm-empty">Games you make are kept here and in My subjects.</p></section>' +
    '</div>';
}

/* ---------------- mount and leave ---------------- */
export function mount(view, sub) {
  S.view = view;
  if (!view.dataset.wired) { view.innerHTML = pageHTML(); wire(view); view.dataset.wired = '1'; restoreForm(); }
  const pre = takeMaking('game');
  if (pre) prefill(pre);
  if (sub) openSaved(String(sub));
  else if (!S.game) showGame(exampleGame(), '', true);
  else showGame(S.game, S.key, S.example);
  renderList();
  paintDevices();
}
export function leave() {
  closeBoard(true);
  stopPreview();
  if (S.busy) S.busy.abort();
}

function wire(view) {
  view.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tpl]');
    if (t) { pickTemplate(t.dataset.tpl); return; }
    const o = e.target.closest('[data-open]');
    if (o) { location.hash = '#/game/' + encodeURIComponent(o.dataset.open); return; }
    const d = e.target.closest('[data-del]');
    if (d) { del(d); return; }
  });
  const go = $('#gm-go', view);
  go.addEventListener('click', (e) => make(e, go));
  watch(go, { name: 'game:make', label: 'Make my game', icon: SPARK, fine: $('#gm-fine', view), busy: () => !!S.busy,
    idle: 'Takes about a minute (a game made from scratch takes a little longer). Kept in My subjects. After each one this button rests for ' + LIMITS.restMin + ' minutes.' });
  $('#gm-stop', view).addEventListener('click', () => { if (S.busy) S.busy.abort(); });
  $('#gm-ask', view).addEventListener('submit', (e) => { e.preventDefault(); const i = $('#gm-ask-in', view); const v = i.value; if (str(v)) { i.value = ''; change(v); } });
  $('#gm-board', view).addEventListener('click', openBoard);
  $('#gm-devices', view).addEventListener('click', sendDevices);
  $('#gm-folder', view).addEventListener('change', folderChange);
  $('#gm-new-go', view).addEventListener('click', newFolder);
  $('#gm-new-name', view).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); newFolder(); } });
  ['gm-topic', 'gm-year', 'gm-subject'].forEach((id) => $('#' + id, view).addEventListener('change', saveForm));
  if (!S.wiredLib) { S.wiredLib = true; onLibrary(() => { if (S.view && S.view.isConnected) { renderList(); paintFolder(); } }); }
  pickTemplate('');
}
function pickTemplate(id) {
  S.template = TEMPLATE_BY_ID[id] ? id : '';
  $$('[data-tpl]', S.view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tpl === S.template)));
  const t = TEMPLATE_BY_ID[S.template];
  $('#gm-say', S.view).textContent = t ? t.blurb : 'Symphony picks the kind of game that suits your idea best.';
}
function readInput() {
  const subject = $('#gm-subject', S.view).value;
  return {
    desc: str($('#gm-desc', S.view).value).slice(0, 600), topic: str($('#gm-topic', S.view).value).slice(0, 120),
    year: $('#gm-year', S.view).value || 'Year 4', subject, subjectName: subjectName(subject), template: S.template
  };
}
function saveForm() { store.setJSON(FORM, { year: $('#gm-year', S.view).value, subject: $('#gm-subject', S.view).value }); }
function restoreForm() {
  const f = store.getJSON(FORM, {}) || {};
  $('#gm-year', S.view).value = f.year && YEARS.includes(f.year) ? f.year : 'Year 4';
  if (f.subject && SUBJECT_LIST.some((s) => s.id === f.subject)) $('#gm-subject', S.view).value = f.subject; else $('#gm-subject', S.view).value = 'maths';
}
function prefill(p) {
  if (p.topic) $('#gm-topic', S.view).value = str(p.topic).slice(0, 120);
  const y = yearOf(p.year); if (y && YEARS.includes(y)) $('#gm-year', S.view).value = y;
  const s = subjectOf(p.subject); if (s) $('#gm-subject', S.view).value = s;
  if (p.desc) $('#gm-desc', S.view).value = str(p.desc).slice(0, 600);
  else if (p.topic && !str($('#gm-desc', S.view).value)) $('#gm-desc', S.view).value = 'A game about ' + str(p.topic) + ' for ' + ($('#gm-year', S.view).value) + '.';
  saveForm();
  setTimeout(() => { const d = $('#gm-desc', S.view); if (d) d.focus({ preventScroll: true }); }, 60);
}
function notice(msg, err) { const n = $('#gm-notice', S.view); if (!n) return; n.textContent = msg || ''; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }

/* ---------------- showing a game ---------------- */
function stopPreview() { if (S.preview) { S.preview.stop(); S.preview = null; } }
function audio() { try { return Sound.ctx() || undefined; } catch (e) { return undefined; } }
function showGame(game, key, example) {
  S.game = game; S.key = key || ''; S.example = !!example;
  const t = TEMPLATE_BY_ID[game.template];
  $('#gm-kind', S.view).textContent = t.name + (game.year ? ' · ' + game.year : '') + (example ? ' · example' : '');
  $('#gm-title', S.view).textContent = game.title;
  stopPreview();
  S.preview = playGame($('#gm-preview', S.view), game, { mode: 'board', ctx: audio() });
  paintFolder();
  $$('.gm-it', S.view).forEach((li) => li.setAttribute('aria-current', String(li.dataset.key === S.key)));
}
async function openSaved(id) {
  const key = 'game:' + id;
  if (S.key === key && S.game) { showGame(S.game, key, false); return; }
  const it = await getItem(key);
  const g = it && normGame(it.data);
  if (!g) { notice('That game is not on this device any more. Here is the example instead.', true); showGame(exampleGame(), '', true); return; }
  notice('');
  showGame(g, key, false);
  $('#gm-log', S.view).innerHTML = '';
}

/* ---------------- making ---------------- */
function busyUI(on, label) {
  const go = $('#gm-go', S.view), sp = $('span', go);
  $('#gm-busy', S.view).hidden = !on;
  go.disabled = !!on;
  if (sp) sp.textContent = on ? label || 'Making\u2026' : 'Make my game';
  if (on) $('#gm-bar', S.view).style.width = '4%';
}
const meter = (f) => { const b = $('#gm-bar', S.view); if (b) b.style.width = Math.min(96, 4 + f * 92) + '%'; };
async function make(e, btn) {
  if (!deliberate(e, btn) || S.busy) return;
  const input = readInput();
  if (!input.desc && !input.topic) { notice('Describe your game first, or type a topic.', true); $('#gm-desc', S.view).focus(); return; }
  notice('');
  const g0 = makeState('game:make');
  if (!g0.ok) { notice(waitText(g0)); return; }
  if (!hasKey()) { notice(errorCopy('no_key'), true); bus.emit('need-key'); return; }
  const ctl = new AbortController(), ticket = makeStart('game:make'), t0 = Date.now();
  let outcome = 'error';
  S.busy = ctl;
  busyUI(true, input.template === 'custom' ? 'Writing your game…' : 'Making your game…');
  uiSfx('send');
  try {
    let game;
    if (input.template === 'custom') {
      const r = await askClaude(customRequest(input), { system: CUSTOM_SYSTEM, model: CONFIG.mainModel, maxTokens: 16000, signal: ctl.signal, onText: (t) => meter(t.length / 30000) });
      if (r.stop === 'max_tokens') throw new AiError('truncated');
      const c = parseCustom(r.text);
      game = normGame({ template: 'custom', title: c.title || input.topic || 'Our class game', topic: input.topic, subject: input.subject, year: input.year, html: c.html });
    } else {
      const raw = await askJSON(makeRequest(input), { system: SYSTEM, model: CONFIG.mainModel, maxTokens: 3000, signal: ctl.signal, onText: (t) => meter(t.length / 1800) });
      const tpl = input.template || (raw && raw.template);
      game = normGame(Object.assign({}, raw, { template: tpl, topic: input.topic || (raw && raw.topic) || '', subject: input.subject, year: input.year }));
    }
    if (!game) throw new AiError('invalid_json');
    outcome = 'ok';
    track('gen', { eng: 'game', title: game.title, year: input.year, ok: 1, ms: Date.now() - t0 });
    $('#gm-log', S.view).innerHTML = '';
    await save(game, '');
    showGame(game, S.key, false);
    uiSfx('success');
    toast('Your game is ready. Press Start to try it.');
  } catch (err) {
    const code = err && err.code;
    track('gen', { eng: 'game', title: (input.topic || input.desc).slice(0, 80), year: input.year, ok: 0, err: code || 'error', ms: Date.now() - t0 });
    if (code === 'cancelled') { outcome = 'stopped'; notice('Stopped. Change anything you like and press Make my game again.'); }
    else {
      uiSfx('error');
      notice(code === 'invalid_json' || code === 'truncated' ? 'That game came back in a shape that does not play. Please press Make my game again.' : errorCopy(code, 'your game'), true);
      if (code === 'no_key') bus.emit('need-key');
    }
  } finally {
    if (S.busy === ctl) S.busy = null;
    busyUI(false);
    makeEnd(ticket, outcome);
  }
}

/* ---------------- changing it by asking ---------------- */
function addLog(who, text, err) {
  const li = document.createElement('li');
  li.className = who + (err ? ' err' : '');
  li.textContent = text;
  const log = $('#gm-log', S.view);
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
  return li;
}
function editWait(s) {
  if (s.why === 'busy') return 'One thing at a time: something else is being made. Try again when it is ready.';
  if (s.why === 'hour') return 'That is ' + LIMITS.editHour + ' changes in the last hour, the most for one hour. Ready again at ' + clockAt(s.left) + '.';
  return 'One change at a time: try again in ' + Math.max(1, Math.ceil(s.left / 1000)) + ' seconds.';
}
async function change(text) {
  const ask = str(text).slice(0, 300);
  if (!ask || !S.game || S.editing) return;
  const st = editState();
  if (!st.ok) { addLog('sym', editWait(st), true); return; }
  if (!hasKey()) { addLog('sym', errorCopy('no_key'), true); bus.emit('need-key'); return; }
  S.editing = true;
  addLog('me', ask);
  const reply = addLog('sym', 'Changing it…');
  const t = editStart(), base = S.game;
  let ok = false;
  try {
    let game, note = '';
    if (base.template === 'custom') {
      const r = await askClaude(customEditRequest(base.html, ask), { system: CUSTOM_SYSTEM, model: CONFIG.mainModel, maxTokens: 16000 });
      if (r.stop === 'max_tokens') throw new AiError('truncated');
      const c = parseCustom(r.text);
      game = normGame({ template: 'custom', title: c.title || base.title, topic: base.topic, subject: base.subject, year: base.year, html: c.html });
    } else {
      const raw = await askJSON(editRequest(base, ask), { system: SYSTEM, model: CONFIG.mainModel, maxTokens: 3000 });
      game = normGame(raw, base);
      note = raw && typeof raw.note === 'string' ? str(raw.note).slice(0, 200) : '';
    }
    if (!game) throw new AiError('invalid_json');
    ok = true;
    await save(game, S.example ? '' : S.key.slice(5));
    showGame(game, S.key, false);
    reply.textContent = (note || 'Done.') + ' Press Start to try it.';
    uiSfx('success');
  } catch (err) {
    const code = err && err.code;
    reply.textContent = code === 'invalid_json' || code === 'truncated' ? 'That change did not work out. Try saying it another way.' : errorCopy(code, 'that change');
    reply.classList.add('err');
    if (code === 'no_key') bus.emit('need-key');
  } finally {
    editEnd(t, ok);
    S.editing = false;
  }
}

/* ---------------- My subjects ---------------- */
async function save(game, id) {
  const subject = subjectOf(game.subject) || $('#gm-subject', S.view).value || 'general';
  const key = await putItem('game', { id: id || undefined, title: game.title, topic: game.topic, subject, year: game.year, n: itemCount(game), unit: TEMPLATE_BY_ID[game.template].name, data: game });
  S.key = key; S.game = game; S.example = false;
  renderList();
  return key;
}
function renderList() {
  if (!S.view) return;
  const list = listAll().filter((it) => it.k === 'game');
  const ul = $('#gm-list', S.view);
  ul.innerHTML = list.map((it) => '<li class="gm-it" data-key="' + esc(it.key) + '" aria-current="' + (it.key === S.key) + '" style="--c:' + subjectColor(it.subject) + '"><span class="gm-dot" aria-hidden="true"></span>' +
    '<button type="button" class="gm-open" data-open="' + esc(it.id) + '"><b>' + esc(it.title) + '</b><small>' + esc((it.unit || 'Game') + ' · ' + subjectName(it.subject, true) + (it.year ? ' · ' + it.year : '') + (it.at ? ' · ' + dayLabel(it.at) : '')) + '</small></button>' +
    '<button type="button" class="gm-del' + (S.sure === it.key ? ' sure' : '') + '" data-del="' + esc(it.key) + '" aria-label="' + (S.sure === it.key ? 'Press again to delete ' : 'Delete ') + esc(it.title) + '">' + (S.sure === it.key ? 'Delete?' : icon('trash')) + '</button></li>').join('');
  $('#gm-empty', S.view).hidden = list.length > 0;
}
async function del(b) {
  const key = b.dataset.del;
  if (S.sure !== key) { S.sure = key; renderList(); setTimeout(() => { if (S.sure === key) { S.sure = ''; renderList(); } }, 4000); return; }
  S.sure = '';
  await removeItem(key);
  if (key === S.key) { showGame(exampleGame(), '', true); if (/^#\/game\//.test(location.hash)) { try { history.replaceState(null, '', '#/game'); } catch (e) { /* fine */ } } }
  renderList();
  toast('Game deleted.');
}
function paintFolder() {
  if (!S.view) return;
  const box = $('#gm-save', S.view), sel = $('#gm-folder', S.view);
  const it = S.key ? findItem(S.key) : null;
  if (!it) { box.hidden = true; return; }
  box.hidden = false;
  const fs = folders(it.subject);
  sel.innerHTML = '<option value="">' + esc(subjectName(it.subject, true)) + (fs.length ? ' (no folder)' : '') + '</option>' +
    fs.map((f) => '<option value="' + esc(f.id) + '"' + (f.id === it.folder ? ' selected' : '') + '>' + esc(subjectName(it.subject, true) + ' › ' + f.name) + '</option>').join('') +
    '<option value="__new">New folder…</option>';
  sel.value = it.folder || '';
  $('#gm-new', S.view).hidden = true;
}
function folderChange() {
  const sel = $('#gm-folder', S.view);
  if (!S.key) return;
  if (sel.value === '__new') { $('#gm-new', S.view).hidden = false; $('#gm-new-name', S.view).focus(); return; }
  moveItem(S.key, { folder: sel.value });
  const f = sel.options[sel.selectedIndex];
  toast('Saved in ' + (f ? f.textContent.replace(/ \(no folder\)$/, '') : 'My subjects') + '.');
}
function newFolder() {
  const name = str($('#gm-new-name', S.view).value).slice(0, 60);
  const it = S.key ? findItem(S.key) : null;
  if (!name || !it) return;
  const f = addFolder(it.subject, name, it.year);
  moveItem(S.key, { folder: f.id });
  $('#gm-new-name', S.view).value = '';
  paintFolder();
  toast('Saved in ' + subjectName(it.subject, true) + ' › ' + f.name + '.');
}

/* ---------------- on the board ---------------- */
function openBoard() {
  if (!S.game) return;
  closeBoard(true);
  stopPreview();
  const ov = document.createElement('div');
  ov.className = 'kg-overlay';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', S.game.title + ', on the board');
  ov.innerHTML = '<div class="kg-ov-bar"><b></b><span class="kg-ov-sp"></span>' +
    '<button type="button" class="kg-ov-btn" data-ov="sound" aria-pressed="true">' + icon('volume') + '<span>Sound</span></button>' +
    '<button type="button" class="kg-ov-btn" data-ov="again">' + icon('refresh') + '<span>Start again</span></button>' +
    '<button type="button" class="kg-ov-btn" data-ov="exit">' + icon('close') + '<span>Exit</span></button></div><div class="kg-ov-host"></div>';
  $('b', ov).textContent = S.game.title;
  document.body.appendChild(ov);
  const back = document.activeElement;
  const ctl = playGame($('.kg-ov-host', ov), S.game, { mode: 'board', ctx: audio(), focus: true });
  // Esc closes it. (While the browser is in full screen it keeps Esc for itself and only leaves full screen; then the
  // game is still open, and Esc or Exit closes it.)
  const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeBoard(); } };
  const fs = () => {};
  document.addEventListener('keydown', key, true);
  document.addEventListener('fullscreenchange', fs);
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ov]');
    if (!b) return;
    if (b.dataset.ov === 'exit') closeBoard();
    else if (b.dataset.ov === 'again') ctl.restart();
    else if (b.dataset.ov === 'sound') { ctl.sound = !ctl.sound; b.setAttribute('aria-pressed', String(ctl.sound)); }
  });
  S.board = { ov, ctl, back, key, fs, t0: Date.now() };
  bus.emit('present', true);
  try { if (ov.requestFullscreen) ov.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed here */ }
}
function closeBoard(quiet) {
  const b = S.board;
  if (!b) return;
  S.board = null;
  document.removeEventListener('keydown', b.key, true);
  document.removeEventListener('fullscreenchange', b.fs);
  b.ctl.stop();
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
  b.ov.remove();
  bus.emit('present', false);
  track('present', { eng: 'game', title: S.game ? S.game.title : '', ms: Date.now() - b.t0, screens: 1, seen: 1, ex: S.example ? 1 : 0 });
  if (!quiet && S.view && S.view.isConnected && S.game) {
    S.preview = playGame($('#gm-preview', S.view), S.game, { mode: 'board', ctx: audio() });
    if (b.back && b.back.focus) { try { b.back.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
  }
}

/* ---------------- pupils' devices (the live part of the site) ---------------- */
async function tasks() {
  if (S.tasks !== undefined) return S.tasks;
  try { S.tasks = await import('../live/tasks.js?v=af1c9ebd'); } catch (e) { S.tasks = null; }
  if (S.tasks && typeof S.tasks.sendGameLive !== 'function') S.tasks = null;
  return S.tasks;
}
async function paintDevices() {
  const b = S.view && $('#gm-devices', S.view);
  if (!b) return;
  const m = await tasks();
  b.disabled = !m;
  const sp = $('span', b);
  if (sp) sp.textContent = m ? 'Send to pupils’ devices' : 'Pupils’ devices: coming soon';
  b.title = m ? 'Pupils join with the QR code and play on their own phone or tablet' : '';
}
async function sendDevices() {
  if (!S.game) return;
  const m = await tasks();
  if (!m) { paintDevices(); toast('Pupils’ devices: coming soon.'); return; }
  try { await m.sendGameLive(S.game, {}); }
  catch (e) { toast('The game could not be sent just now. Try again in a moment.'); }
}
