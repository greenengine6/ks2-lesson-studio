/* The engine framework: every engine is a small definition (fields, prompt, normaliser, class screens, notes).
   This file renders the engine page, talks to Claude, keeps saved activities, and runs Present mode. */
import { $, $$, esc, str, icon, store, bus, prefs, YEARS, hasKey, askJSON, errorCopy, toast, copyOut, sectionsToCopy, fitText, uid, AiError, CONFIG, houseFix } from '../core.js?v=a20ebde2';
import { Ribbons } from '../fx/ribbons.js?v=a20ebde2';
import { sfx } from '../fx/audio.js?v=a20ebde2';
import { Ambient, Speech } from '../fx/sound.js?v=a20ebde2';
import { track } from '../track.js?v=a20ebde2';
import { LIMITS, makeState, makeStart, makeEnd, deliberate, enterMovesOn, watch, waitText, repaint } from '../guard.js?v=a20ebde2';
import { presentKit } from '../presentkit.js?v=a20ebde2';

/* ---------------- how pupils respond (online or in class) ---------------- */
export const RESPOND = {
  online: { chat: 'Type it in the chat', waterfall: 'Type, but wait for 3-2-1 to press Enter', vote: 'Vote in the chat', show: 'Hold your work up to the camera', talk: 'Unmute to share', react: 'Use a reaction', think: 'Think quietly first', listen: 'Close your eyes and listen', move: 'Stand up if you can' },
  class: { chat: 'Write it on your whiteboard', waterfall: 'Write it, then show me on 3-2-1', vote: 'Show me with your fingers', show: 'Show me your whiteboard', talk: 'Turn and talk to your partner', react: 'Thumbs up, sideways or down', think: 'Think quietly first', listen: 'Close your eyes and listen', move: 'Stand up behind your chair' }
};
const RESPOND_ICON = { chat: 'chat', waterfall: 'chat', vote: 'vote', show: 'eye', talk: 'debate', react: 'thumb', think: 'bulb', listen: 'sound', move: 'bolt' };
/* The pill is a button: it opens the class moment (moments.js), with live answers if pupils have joined. */
export function respond(kind, mode) {
  const m = mode || prefs.mode;
  return RESPOND[m][kind] ? '<button type="button" class="b-say" data-moment="' + kind + '" title="Start this moment on the class screen">' + icon(RESPOND_ICON[kind] || 'chat') + '<span>' + esc(RESPOND[m][kind]) + '</span></button>' : '';
}

/* ---------------- board helpers ---------------- */
export const B = {
  pad(eng, o) {
    return '<div class="b-pad"><div class="b-head"><span class="b-kick">' + icon(o.icon || eng.icon) + esc(o.kick || eng.name) + '</span>' + (o.say ? respond(o.say, o.mode) : '') + '</div>' +
      (o.title ? '<h3 class="b-title">' + esc(o.title) + '</h3>' : '') + (o.sub ? '<p class="b-sub">' + esc(o.sub) + '</p>' : '') +
      '<div class="b-body"></div>' + (o.foot ? '<div class="b-foot">' + o.foot + '</div>' : '') + '</div>';
  },
  body(board) { return board.querySelector('.b-body'); },
  list(xs, cls) { return '<ul class="' + (cls || 'b-list') + '">' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; },
  num(xs) { return '<ol class="b-num">' + xs.map((x) => '<li><span>' + esc(x) + '</span></li>').join('') + '</ol>'; },
  fit(el, min) { requestAnimationFrame(() => fitText(el, min)); }
};

/* ---------------- fields ---------------- */
function fieldHTML(f, val, eng) {
  const id = 'f-' + eng.id + '-' + f.id;
  const label = '<span>' + esc(f.label) + (f.optional ? ' <span class="opt">(optional)</span>' : '') + '</span>';
  const hint = f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '';
  if (f.type === 'year' || f.type === 'pills' || f.type === 'multi') {
    const opts = f.type === 'year' ? (f.mixed ? YEARS.concat(['Years 3 to 6']) : YEARS) : f.options;
    const vals = f.type === 'multi' ? (Array.isArray(val) ? val : []) : [val];
    return '<div class="fld" role="group" aria-labelledby="' + id + '-l"><span id="' + id + '-l" class="lbl">' + esc(f.label || 'Year group') + (f.optional ? ' <span class="opt">(optional)</span>' : '') + '</span>' + hint +
      '<div class="pills" data-field="' + f.id + '" data-kind="' + f.type + '">' + opts.map((o) =>
        '<button type="button" class="pill" data-v="' + esc(o) + '" aria-pressed="' + (vals.includes(o) ? 'true' : 'false') + '">' + esc(o.replace('Year ', 'Year ').replace('Years 3 to 6', 'Whole KS2')) + '</button>').join('') + '</div></div>';
  }
  if (f.type === 'select') {
    return '<label class="fld">' + label + hint + '<select id="' + id + '" data-field="' + f.id + '">' + f.options.map((o) => '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></label>';
  }
  const chips = f.chips && f.chips.length ? '<div class="try" data-for="' + id + '"><span>Try:</span>' + f.chips.map((c) => '<button type="button" data-chip="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' : '';
  if (f.type === 'textarea') {
    return '<label class="fld">' + label + hint + '<textarea id="' + id + '" data-field="' + f.id + '" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val || '') + '</textarea></label>' + chips;
  }
  return '<label class="fld">' + label + hint + '<input type="text" id="' + id + '" data-field="' + f.id + '" autocomplete="off" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(val || '') + '"></label>' + chips;
}
function readFields(root, eng) {
  const out = {};
  eng.fields.forEach((f) => {
    if (f.type === 'year' || f.type === 'pills') {
      const on = $('[data-field="' + f.id + '"] [aria-pressed="true"]', root);
      out[f.id] = on ? on.dataset.v : '';
    } else if (f.type === 'multi') {
      out[f.id] = $$('[data-field="' + f.id + '"] [aria-pressed="true"]', root).map((b) => b.dataset.v);
    } else {
      const e = $('[data-field="' + f.id + '"]', root);
      out[f.id] = e ? str(e.value) : '';
    }
  });
  return out;
}
function defaults(eng) {
  const d = {};
  eng.fields.forEach((f) => { d[f.id] = f.value != null ? f.value : (f.type === 'year' ? 'Year 4' : f.type === 'multi' ? [] : f.type === 'pills' || f.type === 'select' ? f.options[0] : ''); });
  return d;
}

/* ---------------- saved activities (this browser only) ---------------- */
const SAVE_KEY = 'ks2-engine.saved.v1';
function loadSaved() { const v = store.getJSON(SAVE_KEY, {}); return v && typeof v === 'object' ? v : {}; }
function savedFor(id) { const v = loadSaved()[id]; return Array.isArray(v) ? v.filter((x) => x && x.id && x.data) : []; }
function putSaved(id, item) {
  const all = loadSaved();
  const list = (Array.isArray(all[id]) ? all[id] : []).filter((x) => x && x.id !== item.id);
  list.unshift(item);
  all[id] = list.slice(0, 8);
  store.setJSON(SAVE_KEY, all);
}
function dropSaved(id, itemId) { const all = loadSaved(); all[id] = (all[id] || []).filter((x) => x.id !== itemId); store.setJSON(SAVE_KEY, all); }
export function allSavedCount() { const all = loadSaved(); return Object.values(all).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0); }

/* ---------------- per-activity live state (votes, unlocked locks, robot programs…) ---------------- */
const live = new Map();
function liveState(item) { if (!live.has(item.id)) live.set(item.id, {}); return live.get(item.id); }

/* ---------------- the engine page ---------------- */
const SPARK = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>';
let page = null;           // { eng, root, item, screen, tab, busy }
let symRef = null;
export function setSymphony(l) { symRef = l; }
function say(html, state) {
  if (!page) return;
  const b = $('.bubble', page.root);
  if (b) b.innerHTML = html;
  if (symRef && state) symRef.setState(state);
}

export function renderEngine(view, eng) {
  if (page && page.busy) page.busy.abort();
  const saved = savedFor(eng.id);
  const startInput = Object.assign(defaults(eng), saved[0] ? saved[0].input : eng.example.input);
  view.style.setProperty('--c', 'var(--' + eng.color + ')');
  view.innerHTML = '<div class="wrap">' +
    '<header class="eng-head"><div class="eng-ico"><i>' + icon(eng.icon) + '</i></div><div><p class="kicker">' + esc(eng.kicker) + '</p><h1>' + esc(eng.name) + '</h1><p>' + esc(eng.about) + '</p>' +
    '<div class="chips">' + eng.chips.map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</div></div></header>' +
    '<div class="eng-grid"><form class="card form" id="eng-form" novalidate>' +
    eng.fields.map((f) => fieldHTML(f, startInput[f.id], eng)).join('') +
    '<button type="submit" class="btn primary big wide" id="eng-go">' + icon('spark') + '<span>' + esc(eng.cta || 'Make it') + '</span></button>' +
    '<p class="fine" id="eng-fine"></p>' +
    '<div class="notice" id="eng-notice" hidden role="status"></div>' +
    '<div class="saved" id="eng-saved" hidden><span>Your saved ' + esc(eng.savedLabel || 'activities') + '</span><ul></ul></div>' +
    '</form>' +
    '<aside class="card helper" aria-label="Symphony, your helper"><div class="sym-well" id="sym-host"></div><p class="helper-name">Symphony</p>' +
    '<div class="bubble" aria-live="polite"></div><div class="meter" id="eng-meter" hidden><i></i></div>' +
    '<button type="button" class="btn small" id="eng-stop" hidden>' + icon('stop') + 'Stop</button></aside></div>' +
    '<section class="result" id="eng-result" aria-live="polite"></section></div>';
  page = { eng, root: view, item: null, screen: 0, tab: 'screens', busy: null };
  if (symRef) { symRef.mount($('#sym-host', view)); symRef.setState('idle'); }
  say(eng.sym.hello, 'idle');
  wireForm(view, eng);
  watch($('#eng-go', view), {
    name: 'eng:' + eng.id, label: eng.cta || 'Make it', icon: SPARK, fine: $('#eng-fine', view), busy: () => !!(page && page.eng === eng && page.busy),
    idle: 'Takes about a minute. Saved in this browser only. After each one this button rests for ' + LIMITS.restMin + ' minutes.'
  });
  renderSavedList();
  const first = saved[0] ? Object.assign({ example: false }, saved[0]) : exampleItem(eng);
  showItem(first);
}
function exampleItem(eng) { return { id: 'example-' + eng.id, at: 0, input: eng.example.input, data: eng.normalize(eng.example.data, eng.example.input) || eng.example.data, example: true }; }
export function exampleData(eng) { return exampleItem(eng); }

function wireForm(root, eng) {
  const form = $('#eng-form', root);
  form.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (pill) {
      const group = pill.parentElement;
      if (group.dataset.kind === 'multi') pill.setAttribute('aria-pressed', pill.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      else $$('.pill', group).forEach((b) => b.setAttribute('aria-pressed', String(b === pill)));
      const f = eng.fields.find((x) => x.id === group.dataset.field);
      if (f && f.onChange) f.onChange(readFields(root, eng), root);
      return;
    }
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const target = $('#' + chip.parentElement.dataset.for, root);
      if (target) { target.value = chip.dataset.chip; target.focus(); }
    }
  });
  form.addEventListener('focusin', (e) => {
    const f = e.target.closest('[data-field]');
    if (!f || (page && page.busy)) return;
    const def = eng.fields.find((x) => x.id === f.dataset.field);
    if (def && def.tip) say(esc(def.tip), 'listen');
  });
  form.addEventListener('focusout', () => { if (page && !page.busy && symRef && symRef.state === 'listen') symRef.setState('idle'); });
  // Only a real press on the Make button makes anything; Enter in a text box moves on to the next box.
  const go = $('#eng-go', root);
  form.addEventListener('submit', (e) => { e.preventDefault(); });
  go.addEventListener('click', (e) => { e.preventDefault(); if (deliberate(e, go)) generate(eng, readFields(root, eng)); });
  enterMovesOn(form);
  $('#eng-stop', root).addEventListener('click', () => { if (page && page.busy) page.busy.abort(); });
  eng.fields.forEach((f) => { if (f.onChange) f.onChange(readFields(root, eng), root); });
}

function renderSavedList() {
  if (!page) return;
  const box = $('#eng-saved', page.root), list = savedFor(page.eng.id);
  box.hidden = !list.length;
  $('ul', box).innerHTML = list.map((x) => '<li><button type="button" class="op" data-open="' + esc(x.id) + '"' + (page.item && page.item.id === x.id ? ' aria-current="true"' : '') + ' title="' + esc(page.eng.title(x.data)) + '">' + esc(page.eng.title(x.data)) + '</button>' +
    '<button type="button" class="rm" data-rm="' + esc(x.id) + '" aria-label="Remove ' + esc(page.eng.title(x.data)) + '">' + icon('close') + '</button></li>').join('') +
    '<li><button type="button" class="op" data-open="example"' + (page.item && page.item.example ? ' aria-current="true"' : '') + '>Example</button></li>';
  $$('[data-open]', box).forEach((b) => b.addEventListener('click', () => {
    const it = b.dataset.open === 'example' ? exampleItem(page.eng) : savedFor(page.eng.id).find((x) => x.id === b.dataset.open);
    if (it) { showItem(it); $('#eng-result').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }));
  $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => {
    dropSaved(page.eng.id, b.dataset.rm);
    if (page.item && page.item.id === b.dataset.rm) showItem(savedFor(page.eng.id)[0] || exampleItem(page.eng));
    renderSavedList();
  }));
}

/* ---------------- generating ---------------- */
function notice(msg, err) { const n = $('#eng-notice'); if (!n) return; n.innerHTML = msg; n.className = 'notice' + (err ? ' err' : ''); n.hidden = !msg; }
async function generate(eng, input) {
  if (!page || page.busy) return;
  notice('');
  const missing = eng.fields.find((f) => f.required && !(Array.isArray(input[f.id]) ? input[f.id].length : input[f.id]));
  if (missing) {
    notice(esc(missing.missing || ('Fill in “' + missing.label + '” first.')), true);
    const e = $('[data-field="' + missing.id + '"]', page.root); if (e && e.focus) e.focus();
    say(esc(missing.missing || 'I need a little more to go on.'), 'listen');
    return;
  }
  const g = makeState('eng:' + eng.id);
  if (!g.ok) { repaint(); notice(esc(waitText(g)), false); say(esc(waitText(g)), 'idle'); return; }
  if (!hasKey()) {
    notice(esc(errorCopy('no_key')), true);
    say(esc(errorCopy('no_key')), 'idle');
    bus.emit('need-key');
    return;
  }
  const ctl = new AbortController();
  const ticket = makeStart('eng:' + eng.id);
  let outcome = 'error';
  page.busy = ctl;
  const go = $('#eng-go'), meter = $('#eng-meter'), stop = $('#eng-stop');
  go.disabled = true; $('span', go).textContent = 'Making…';
  meter.hidden = false; stop.hidden = false; $('i', meter).style.width = '5%';
  say('<b>Thinking…</b> ' + esc(eng.sym.thinking || 'Planning it for your class.'), 'think');
  sfx('send');
  const expected = JSON.stringify(eng.example.data).length * 1.05, t0 = Date.now();
  const topicOf = () => { const f = eng.fields.find((x) => x.type === 'text' || x.type === 'textarea'); return f ? String(input[f.id] || '').slice(0, 80) : ''; };
  const resEl = $('#eng-result');
  resEl.innerHTML = '<div class="skeleton" aria-hidden="true"></div>';
  let lastLabel = '';
  try {
    const raw = await askJSON(eng.prompt(input, prefs.mode), {
      model: eng.model || CONFIG.mainModel, maxTokens: eng.maxTokens || 6000, signal: ctl.signal,
      onText: (text) => {
        let label = eng.progress[0][1];
        eng.progress.forEach(([k, l]) => { if (text.indexOf('"' + k + '"') >= 0) label = l; });
        if (label !== lastLabel) { lastLabel = label; say('<b>' + esc(label) + '…</b>', 'think'); }
        $('i', meter).style.width = Math.min(96, 6 + (text.length / expected) * 90) + '%';
      }
    });
    const data = eng.normalize(raw, input);
    if (!data) throw new AiError('invalid_json');
    const item = { id: uid(eng.id), at: Date.now(), input, data, example: false };
    outcome = 'ok';
    track('gen', { eng: eng.id, title: eng.title(data), year: input.year || '', ok: 1, ms: Date.now() - t0 });
    putSaved(eng.id, item);
    showItem(item);
    renderSavedList();
    say('<b>Ready!</b> ' + esc(eng.sym.done || 'Press Present to share it with your class.'), 'happy');
    sfx('success');
    toast(eng.name + ': ready to teach.');
    $('#eng-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    const code = e && e.code;
    track('gen', { eng: eng.id, title: topicOf(), year: input.year || '', ok: 0, err: code || 'error', ms: Date.now() - t0 });
    if (code === 'cancelled') { outcome = 'stopped'; say('Stopped. Change anything you like and press the button again.', 'idle'); }
    else {
      sfx('error');
      notice(esc(errorCopy(code, 'this activity')) + ((code === 'no_key' || code === 'bad_key') && document.documentElement.getAttribute('data-who') === 'admin' ? '<br><button type="button" class="btn small" data-connect>' + icon('key') + 'Connect this device</button>' : ''), true);
      if (code === 'no_key') bus.emit('need-key');
      say(esc(errorCopy(code, 'this activity')), 'idle');
    }
    showItem(page.item || exampleItem(eng));
  } finally {
    if (page && page.busy === ctl) {
      page.busy = null;
      go.disabled = false; $('span', go).textContent = eng.cta || 'Make it';
      meter.hidden = true; stop.hidden = true;
    }
    makeEnd(ticket, outcome);
  }
}

/* ---------------- result ---------------- */
function showItem(item) {
  if (!page) return;
  item.data = houseFix(item.data);     // "rounding off", also in activities saved before the school's words were added
  page.item = item; page.screen = 0;
  const eng = page.eng, d = item.data;
  const when = item.example ? 'Example · change the boxes above and press “' + (eng.cta || 'Make it') + '”' : 'Made ' + new Date(item.at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const screens = eng.screens(d);
  const res = $('#eng-result');
  res.innerHTML = '<div class="card">' +
    '<div class="res-head"><div><p class="kicker">' + esc(when) + '</p><h2>' + esc(eng.title(d)) + '</h2></div>' +
    '<div class="res-actions"><button type="button" class="btn primary" data-act="present">' + icon('play') + 'Present to class</button>' +
    '<button type="button" class="btn" data-act="chat">' + icon('chat') + 'Copy for class chat</button>' +
    '<button type="button" class="btn" data-act="notes">' + icon('copy') + 'Copy teacher notes</button></div></div>' +
    '<div class="res-tabs"><div class="seg" role="tablist" aria-label="Views"><button type="button" role="tab" data-tab="screens" aria-selected="true">Class screens</button><button type="button" role="tab" data-tab="notes" aria-selected="false">Teacher notes</button></div>' +
    '<span class="fine">' + esc(eng.sub(d, item.input)) + '</span></div>' +
    '<div id="res-screens"><div class="screen-nav" role="tablist" aria-label="Class screens">' + screens.map((s, i) => '<button type="button" role="tab" data-screen="' + i + '" aria-selected="' + (i === 0) + '"><b>' + (i + 1) + '</b>' + esc(s.title) + '</button>').join('') + '</div>' +
    '<div class="board-frame"><div class="board" id="res-board"></div></div></div>' +
    '<div id="res-notes" hidden><div class="notes">' + notesHTML(eng.notes(d, prefs.mode)) + '</div></div></div>';
  res.querySelector('[data-act="present"]').addEventListener('click', () => openPresent(eng, item, page.screen));
  res.querySelector('[data-act="chat"]').addEventListener('click', () => copyChat(eng, item));
  res.querySelector('[data-act="notes"]').addEventListener('click', () => copyNotes(eng, item));
  $$('[data-tab]', res).forEach((b) => b.addEventListener('click', () => {
    page.tab = b.dataset.tab;
    $$('[data-tab]', res).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('#res-screens').hidden = page.tab !== 'screens'; $('#res-notes').hidden = page.tab !== 'notes';
  }));
  $$('[data-screen]', res).forEach((b) => b.addEventListener('click', () => { page.screen = Number(b.dataset.screen); paintPreview(); }));
  paintPreview();
  renderSavedList();
}
function paintPreview() {
  if (!page || !page.item) return;
  const board = $('#res-board');
  if (!board) return;
  if (page.ctx && page.ctx.cleanup) page.ctx.cleanup();
  page.ctx = mountScreen(board, page.eng, page.item, page.screen, { present: false });
  $$('[data-screen]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.screen) === page.screen)));
}
export function mountScreen(board, eng, item, i, o) {
  const screens = eng.screens(item.data);
  const s = screens[Math.max(0, Math.min(i, screens.length - 1))];
  board.className = 'board';
  board.style.setProperty('--c', 'var(--' + eng.color + ')');
  board.innerHTML = '';
  const ctx = Object.assign({ eng, item, data: item.data, state: liveState(item), mode: prefs.mode, present: false, still: false, index: i, count: screens.length,
    go: (j) => { if (o && o.go) o.go(j); else if (page && page.item === item) { page.screen = j; paintPreview(); } } }, o || {});
  try { s.render(board, ctx); } catch (e) { console.error(e); board.innerHTML = '<div class="b-pad b-center"><p>This screen could not be shown.</p></div>'; }
  return ctx;
}

export function notesHTML(sections) {
  return sections.filter(Boolean).map((s) => {
    let h = '<section class="note' + (s.full ? ' full' : '') + '"><h3>' + icon(s.icon || 'notes') + esc(s.h) + '</h3>';
    if (s.text) h += '<p>' + esc(s.text) + '</p>';
    if (s.list && s.list.length) h += (s.ordered ? '<ol>' : '<ul>') + s.list.map((x) => '<li>' + esc(x) + '</li>').join('') + (s.ordered ? '</ol>' : '</ul>');
    if (s.pairs && s.pairs.length) h += '<dl>' + s.pairs.map((p) => '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>').join('') + '</dl>';
    if (s.table) h += '<table><thead><tr>' + s.table.head.map((x) => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + s.table.rows.map((r) => '<tr>' + r.map((x) => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    return h + '</section>';
  }).join('');
}
function copyNotes(eng, item) {
  const d = item.data;
  const secs = eng.notes(d, prefs.mode).filter(Boolean).map((s) => s.table ? { h: s.h, list: s.table.rows.map((r) => r.join(' · ')) } : s);
  const { html, text } = sectionsToCopy(eng.title(d) + ': teacher notes', eng.name + ' · ' + eng.sub(d, item.input), secs);
  copyOut(html, text, 'Teacher notes copied. Paste them into an email, Word or OneNote.');
  track('copy', { eng: eng.id, what: 'notes' });
}
function copyChat(eng, item) {
  const out = eng.chat(item.data, prefs.mode);
  const { html, text } = sectionsToCopy(out.title, out.sub || '', out.sections);
  copyOut(html, text, 'Copied for your class. Paste it into the Teams, Zoom or Meet chat.');
  track('copy', { eng: eng.id, what: 'chat' });
}

/* ---------------- Present mode ---------------- */
const P = { open: false, eng: null, item: null, i: 0, ribbons: null, timer: null, ctx: null, pointer: false, kit: null };
const POINTER_KEY = 'ks2-engine.pointer.v1';
export function leaveEngine() {
  if (!page) return;
  if (page.busy) page.busy.abort();
  if (page.ctx && page.ctx.cleanup) page.ctx.cleanup();
  page = null;
}
export function openPresent(eng, item, start) {
  sfx('present');
  if (page && page.ctx && page.ctx.cleanup) { page.ctx.cleanup(); page.ctx = null; }
  Object.assign(P, { open: true, eng, item, i: start || 0, t0: Date.now(), seen: start || 0 });
  const el = $('#present');
  el.hidden = false;
  el.style.setProperty('--c', 'var(--' + eng.color + ')');
  document.documentElement.style.overflow = 'hidden';
  $('#pr-name').innerHTML = '<i>' + icon(eng.icon) + '</i><span>' + esc(eng.name) + ' <small>· ' + esc(eng.presentTitle ? eng.presentTitle(item.data) : eng.title(item.data)) + '</small></span>';
  $('#pr-notes').innerHTML = '<h3>Teacher notes</h3><p class="warn">Pupils can see this if you share your whole screen. Press N to hide it.</p>' + notesHTML(eng.notes(item.data, prefs.mode));
  if (!P.ribbons) P.ribbons = new Ribbons(el, { baseThickness: 24, maxAge: 520, pointCount: 40, speedMultiplier: 0.6, colors: ['#6C63FF', '#38B2AC', '#FF7AA2', '#FFB443'] });
  setPointer(store.get(POINTER_KEY) === 'on');
  try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed */ }
  paintPresent();
  $('#pr-next').focus();
  bus.emit('present', true);
}
export function closePresent() {
  if (!P.open) return;
  track('present', { eng: P.eng.id, title: P.eng.presentTitle ? P.eng.presentTitle(P.item.data) : P.eng.title(P.item.data), ms: Date.now() - (P.t0 || Date.now()), screens: P.eng.screens(P.item.data).length, seen: (P.seen || 0) + 1, ex: P.item.example ? 1 : 0 });
  P.open = false;
  stopTimer();
  if (P.kit) P.kit.close();
  if (P.ctx && P.ctx.cleanup) P.ctx.cleanup();
  if (P.ribbons) P.ribbons.stop();
  Ambient.stop(); Speech.stop();
  $('#present').hidden = true;
  $('#pr-fit').innerHTML = '';
  document.documentElement.style.overflow = '';
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
  bus.emit('present', false);
  paintPreview();
}
function paintPresent() {
  const screens = P.eng.screens(P.item.data);
  P.i = Math.max(0, Math.min(P.i, screens.length - 1));
  P.seen = Math.max(P.seen || 0, P.i);
  if (P.ctx && P.ctx.cleanup) P.ctx.cleanup();
  const fit = $('#pr-fit');
  fit.innerHTML = '<div class="board"></div>';
  P.ctx = mountScreen(fit.firstElementChild, P.eng, P.item, P.i, { present: true, go: (j) => { P.i = j; paintPresent(); } });
  $('#pr-dots').innerHTML = screens.map((s, j) => '<button type="button" aria-label="Screen ' + (j + 1) + ': ' + esc(s.title) + '"' + (j === P.i ? ' aria-current="true"' : '') + ' data-j="' + j + '"></button>').join('');
  $$('#pr-dots button').forEach((b) => b.addEventListener('click', () => { P.i = Number(b.dataset.j); paintPresent(); }));
  $('#pr-prev').disabled = P.i === 0;
  $('#pr-next').disabled = P.i === screens.length - 1;
  if (P.kit) P.kit.paint();
}
function go(delta) { const n = P.eng.screens(P.item.data).length, j = Math.max(0, Math.min(n - 1, P.i + delta)); if (j !== P.i) { sfx('page'); P.i = j; paintPresent(); } }
function setPointer(on) {
  P.pointer = on;
  store.set(POINTER_KEY, on ? 'on' : '');
  $('#pr-pointer').setAttribute('aria-pressed', String(on));
  if (on) P.ribbons.start(); else P.ribbons.stop();
  bus.emit('pointer', on);
}
function fmt(sec) { const m = Math.floor(sec / 60), r = sec % 60; return m + ':' + String(r).padStart(2, '0'); }
export function chime() { sfx('chime'); }
function startTimer(min) {
  stopTimer();
  const el = $('#pr-timer');
  P.timer = { left: Math.round(min * 60), id: 0 };
  el.hidden = false; el.className = 'pr-timer'; el.textContent = fmt(P.timer.left);
  P.timer.id = setInterval(() => {
    const t = P.timer; if (!t) return;
    t.left -= 1;
    if (t.left <= 0) { clearInterval(t.id); el.textContent = "Time's up"; el.className = 'pr-timer done'; chime(); P.timer = null; return; }
    el.textContent = fmt(t.left);
    el.classList.toggle('low', t.left <= 10);
  }, 1000);
}
function stopTimer() { if (P.timer) clearInterval(P.timer.id); P.timer = null; const el = $('#pr-timer'); if (el) { el.hidden = true; el.className = 'pr-timer'; } }

export function wirePresent() {
  P.kit = presentKit({ root: $('#present'), frame: () => $('#pr-fit'), key: () => (P.item ? P.item.id : '') + ':' + P.i, title: () => P.open ? P.eng.name + ': ' + (P.eng.presentTitle ? P.eng.presentTitle(P.item.data) : P.eng.title(P.item.data)) : '' });
  $('#pr-prev').addEventListener('click', () => go(-1));
  $('#pr-next').addEventListener('click', () => go(1));
  $('#pr-exit').addEventListener('click', closePresent);
  $('#pr-pointer').addEventListener('click', () => setPointer(!P.pointer));
  $('#pr-notes-btn').addEventListener('click', () => { const n = $('#pr-notes'); n.hidden = !n.hidden; $('#pr-notes-btn').setAttribute('aria-pressed', String(!n.hidden)); });
  $('#pr-full').addEventListener('click', () => {
    const el = $('#present');
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch (e) { /* ignore */ }
  });
  const menu = $('#pr-timer-menu');
  $('#pr-timer-btn').addEventListener('click', () => { menu.hidden = !menu.hidden; $('#pr-timer-btn').setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-min]'); if (!b) return;
    menu.hidden = true; $('#pr-timer-btn').setAttribute('aria-expanded', 'false');
    if (b.dataset.min === '0') stopTimer(); else startTimer(Number(b.dataset.min));
  });
  document.addEventListener('keydown', (e) => {
    if (!P.open) return;
    if (e.target.closest && e.target.closest('input,textarea,select')) { if (e.key === 'Escape') e.target.blur(); return; }
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === 'p' || k === 'P') setPointer(!P.pointer);
    else if (k === 'n' || k === 'N') $('#pr-notes-btn').click();
    else if (k === 't' || k === 'T') $('#pr-timer-btn').click();
    else if (k === 'c' || k === 'C') $('#pr-ticket').click();
    else if (k === 'f' || k === 'F') $('#pr-full').click();
    else if (k === 'Escape') { if (!$('#pr-timer-menu').hidden) { $('#pr-timer-menu').hidden = true; } else if (!document.fullscreenElement) closePresent(); }
    else if (P.ctx && P.ctx.onKey) P.ctx.onKey(e);
  });
  document.addEventListener('fullscreenchange', () => { if (P.ribbons) P.ribbons.resize(); });
  bus.on('mode', () => { if (P.open) paintPresent(); else if (page && page.item) showItem(page.item); });
}
export const presentState = P;
