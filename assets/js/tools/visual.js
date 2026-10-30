/* Class tools for the board: Work signs, Class points, Traffic light, Dice, and Now and next.
   Each one draws calm on the Class tools page and big and bright on the board (full screen). During a live class the
   signs and the points also reach pupils' devices (live/tasks.js), and Now and next reads the teacher's calendar. */
import { $, esc, icon, store, bus } from '../core.js?v=af1c9ebd';
import { mineKey, subjectName, subjectColor } from '../library.js?v=af1c9ebd';
import { Alarm } from './alarm.js?v=af1c9ebd';
import { prefs, setPrefs, randInt, liveCall, liveOn, ti, COLOURS, colourOf, confetti, boardOverlay } from './shared.js?v=af1c9ebd';

/* ================= Work signs ================= */
const W = '#FFFFFF';
export const SIGNS = [
  { id: 'silent', word: 'Silent work', line: 'On your own, no talking', a: '#E1EEFB', b: '#C9DDF7', ink: '#1F4E8C', m: '#3584D6',
    art: (m) => '<circle cx="60" cy="54" r="34" fill="' + W + '" stroke="' + m + '" stroke-width="6"/><path d="M42 50q6-6 12 0M66 50q6-6 12 0" fill="none" stroke="' + m + '" stroke-width="5" stroke-linecap="round"/><rect x="54" y="56" width="12" height="40" rx="6" fill="' + m + '"/><path d="M92 40q8 14 0 28M100 32q13 22 0 44" fill="none" stroke="' + m + '" stroke-width="5" stroke-linecap="round" opacity=".55"/>' },
  { id: 'partner', word: 'Partner talk', line: 'Quiet voices with your partner', a: '#DFF2E6', b: '#C6EAD4', ink: '#1E6B43', m: '#2E7D4F',
    art: (m) => '<circle cx="36" cy="46" r="15" fill="' + m + '"/><path d="M12 104a24 24 0 0 1 48 0z" fill="' + m + '"/><circle cx="84" cy="52" r="14" fill="#3B9A62"/><path d="M62 106a22 22 0 0 1 44 0z" fill="#3B9A62"/><path d="M58 8h40a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H78l-9 8v-8H58a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z" fill="' + W + '" stroke="' + m + '" stroke-width="3.5"/><path d="M60 19h28M60 26h18" stroke="' + m + '" stroke-width="3.5" stroke-linecap="round"/>' },
  { id: 'group', word: 'Group work', line: 'Share your ideas in your group', a: '#FDEBD9', b: '#FAD7B2', ink: '#8A430D', m: '#E07B2E',
    art: (m) => '<ellipse cx="60" cy="92" rx="44" ry="14" fill="' + m + '" opacity=".35"/><circle cx="26" cy="62" r="13" fill="' + m + '"/><circle cx="60" cy="54" r="14" fill="#F5A524"/><circle cx="94" cy="62" r="13" fill="#C2581A"/><path d="M8 100a18 18 0 0 1 36 0zM42 96a18 18 0 0 1 36 0zM76 100a18 18 0 0 1 36 0z" fill="' + m + '"/><path d="M60 10a12 12 0 0 1 7 21.7V36H53v-4.3A12 12 0 0 1 60 10z" fill="#FFD25C" stroke="#8A430D" stroke-width="2.5"/><path d="M55 40h10" stroke="#8A430D" stroke-width="3" stroke-linecap="round"/>' },
  { id: 'hands', word: 'Hands up', line: 'Put your hand up to speak', a: '#F1E6FA', b: '#E2CDF5', ink: '#5E2C85', m: '#9A55CF',
    art: (m) => '<path d="M44 104V58c0-6 9-6 9 0v14V30c0-7 10-7 10 0v40V24c0-7 10-7 10 0v46V32c0-7 10-7 10 0v46c0 18-10 30-26 30h-2c-10 0-15-4-19-12L26 72c-3-6 4-10 8-6l10 10" fill="' + W + '" stroke="' + m + '" stroke-width="5" stroke-linejoin="round"/><path d="M22 30l-8-6M20 44H10M30 18l-4-9" stroke="' + m + '" stroke-width="5" stroke-linecap="round"/>' },
  { id: 'eyes', word: 'Eyes on me', line: 'Stop, look and listen', a: '#FBE4EE', b: '#F7CCDF', ink: '#A3285A', m: '#C7356F',
    art: (m) => '<ellipse cx="36" cy="62" rx="26" ry="20" fill="' + W + '" stroke="' + m + '" stroke-width="5"/><ellipse cx="84" cy="62" rx="26" ry="20" fill="' + W + '" stroke="' + m + '" stroke-width="5"/><circle cx="38" cy="64" r="10" fill="#1F2937"/><circle cx="86" cy="64" r="10" fill="#1F2937"/><circle cx="34" cy="60" r="3.5" fill="' + W + '"/><circle cx="82" cy="60" r="3.5" fill="' + W + '"/><path d="M16 38l-5-7M36 34v-9M56 38l5-7M64 38l-5-7M84 34v-9M104 38l5-7" stroke="' + m + '" stroke-width="4.5" stroke-linecap="round"/>' },
  { id: 'listen', word: 'Listen', line: 'Ears open, voices off', a: '#DDF2F0', b: '#C2E8E3', ink: '#1A6B67', m: '#2C9C96',
    art: (m) => '<path d="M52 22c18 0 30 12 30 30 0 12-6 18-12 24s-6 10-6 16c0 10-8 16-16 16s-14-6-14-12" fill="' + W + '" stroke="' + m + '" stroke-width="6" stroke-linecap="round"/><path d="M42 54c0-8 5-13 11-13s11 5 11 12c0 6-5 8-8 12" fill="none" stroke="' + m + '" stroke-width="5" stroke-linecap="round"/><path d="M92 36q10 16 0 32M102 26q16 26 0 52" fill="none" stroke="' + m + '" stroke-width="5" stroke-linecap="round" opacity=".6"/>' },
  { id: 'think', word: 'Think time', line: 'Think quietly first', a: '#FFF1D6', b: '#FFE0A3', ink: '#8A5300', m: '#F5A524',
    art: (m) => '<path d="M60 18a30 30 0 0 1 17 54.7V84H43V72.7A30 30 0 0 1 60 18z" fill="#FFD25C" stroke="#8A5300" stroke-width="4"/><path d="M46 92h28M50 101h20" stroke="#8A5300" stroke-width="5" stroke-linecap="round"/><path d="M52 60l8-10 8 10" fill="none" stroke="#8A5300" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 4v6M24 18l5 5M96 18l-5 5M12 50h7M101 50h7" stroke="' + m + '" stroke-width="5" stroke-linecap="round"/>' },
  { id: 'tidy', word: 'Tidy up', line: 'Put things back where they live', a: '#E1F3FB', b: '#C6E6F5', ink: '#11607A', m: '#0B7F99',
    art: (m) => '<path d="M18 58h84l-8 46H26z" fill="' + m + '"/><path d="M18 58h84" stroke="#11607A" stroke-width="5" stroke-linecap="round"/><rect x="34" y="26" width="18" height="38" rx="3" fill="#F5A524" transform="rotate(-12 43 45)"/><rect x="56" y="20" width="14" height="44" rx="3" fill="#E2558A" transform="rotate(8 63 42)"/><path d="M80 18l10 40" stroke="#3B9A62" stroke-width="7" stroke-linecap="round"/><path d="M98 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#F5A524"/>' },
  { id: 'line', word: 'Line up', line: 'Line up quietly at the door', a: '#FBE2E0', b: '#F6C8C3', ink: '#9E2F28', m: '#D9534A',
    art: (m) => '<rect x="84" y="14" width="30" height="94" rx="4" fill="' + m + '"/><circle cx="106" cy="64" r="3.5" fill="' + W + '"/>' + [12, 36, 60].map((x, i) => '<circle cx="' + (x + 10) + '" cy="' + (44 + i * 2) + '" r="9" fill="' + ['#3584D6', '#F5A524', '#2C9C96'][i] + '"/><path d="M' + x + ' ' + (106) + 'v-30a10 10 0 0 1 20 0v30z" fill="' + ['#3584D6', '#F5A524', '#2C9C96'][i] + '"/>').join('') },
  { id: 'custom', word: '', line: '', a: '#E7E6FB', b: '#D3CFF7', ink: '#3730A3', m: '#5B52E6',
    art: (m) => '<path d="M60 12l12.6 26 28.4 4-20.6 20 4.9 28.4L60 77l-25.3 13.4 4.9-28.4L19 42l28.4-4z" fill="#FFD25C" stroke="' + m + '" stroke-width="4" stroke-linejoin="round"/><path d="M96 86l3 6 6 3-6 3-3 6-3-6-6-3 6-3zM20 84l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="' + m + '"/>' }
];
export const SIGN_BY_ID = Object.fromEntries(SIGNS.map((s) => [s.id, s]));
const signOf = (id) => { const s = Object.assign({}, SIGN_BY_ID[id] || SIGNS[1]); if (s.id === 'custom') s.word = prefs().custom; return s; };
const SIGN_NOW = 'ks2-engine.tools.sign.v1';
const signNow = () => { try { return sessionStorage.getItem(SIGN_NOW) || 'partner'; } catch (e) { return 'partner'; } };
function signArt(s) { return '<svg class="tl-sign-art" viewBox="0 0 120 120" aria-hidden="true">' + s.art(s.m) + '</svg>'; }
export function signsView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board';
  const draw = () => {
    const s = signOf(signNow());
    host.innerHTML = '<div class="tl-signs tl-m-' + mode + '">' +
      '<div class="tl-sign" style="--sa:' + s.a + ';--sb:' + s.b + ';--si:' + s.ink + '">' + signArt(s) + '<div class="tl-sign-t"><b>' + esc(s.word) + '</b>' + (s.line ? '<span>' + esc(s.line) + '</span>' : '') + '</div></div>' +
      (board ? '' : '<div class="tl-sign-pick" role="group" aria-label="Choose a work sign">' + SIGNS.map((x) => '<button type="button" class="tl-chip" data-sg="' + x.id + '" aria-pressed="' + (x.id === s.id) + '">' + esc(x.id === 'custom' ? 'Your own' : x.word) + '</button>').join('') + '</div>' +
        (s.id === 'custom' ? '<label class="fld"><span>Your own sign</span><input type="text" maxlength="40" data-sg-custom value="' + esc(prefs().custom) + '"></label>' : '') +
        '<div class="tl-row tl-sign-live" hidden><button type="button" class="btn small" data-sg-live="send">' + icon('send') + '<span>Show on pupils’ screens</span></button><button type="button" class="btn small" data-sg-live="clear">' + icon('close') + '<span>Clear</span></button></div>') + '</div>';
    const lv = $('.tl-sign-live', host); if (lv) lv.hidden = !liveOn();
  };
  draw();
  if (!host.dataset.sgWired) {
    host.dataset.sgWired = '1';
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sg]');
      if (b) { try { sessionStorage.setItem(SIGN_NOW, b.dataset.sg); } catch (er) { /* fine */ } draw(); bus.emit('tools:sign', b.dataset.sg); return; }
      const l = e.target.closest('[data-sg-live]');
      if (l) { const s = signOf(signNow()); liveCall('pushSign', l.dataset.sgLive === 'send' ? { id: s.id, word: s.word } : null); }
    });
    host.addEventListener('change', (e) => { if (e.target.matches('[data-sg-custom]')) { setPrefs({ custom: String(e.target.value || '').trim().slice(0, 40) || 'Quiet reading' }); draw(); } });
  }
  return () => {};
}
export function signBoard() {
  const s = signOf(signNow());
  liveCall('pushSign', { id: s.id, word: s.word });
  return boardOverlay(s.word, (stage) => { signsView(stage, 'board'); return () => liveCall('pushSign', null); }, { cls: 'tl-b-sign' });
}

/* ================= Class points ================= */
const PTS = 'ks2-engine.points.v1';
const DEF_TEAMS = [['Tigers', '#F5A524'], ['Eagles', '#3584D6'], ['Dolphins', '#2C9C96'], ['Owls', '#9A55CF'], ['Pandas', '#E2558A'], ['Foxes', '#E07B2E']];
export function teams() {
  const v = store.getJSON(mineKey(PTS), null);
  const list = v && Array.isArray(v.teams) ? v.teams.filter((t) => t && t.name).slice(0, 6) : [];
  if (list.length >= 2) return list.map((t) => ({ name: String(t.name).slice(0, 24), c: colourOf(t.c).c, p: Math.max(0, Math.min(9999, Math.round(Number(t.p) || 0))) }));
  return DEF_TEAMS.slice(0, 4).map(([name, c]) => ({ name, c, p: 0 }));
}
function saveTeams(list) {
  store.setJSON(mineKey(PTS), { teams: list, at: Date.now() });
  bus.emit('tools:points', list);
  liveCall('pushPoints', list.map((t) => ({ name: t.name, color: t.c, points: t.p })));
}
export function addPoints(i, n) {
  const list = teams();
  if (!list[i]) return list;
  const before = list[i].p;
  list[i].p = Math.max(0, before + n);
  saveTeams(list);
  const q = prefs();
  if (n >= 5 || Math.floor(list[i].p / 10) > Math.floor(before / 10)) { if (!q.mute) Alarm.play('cheer', { volume: Math.min(80, q.volume) }); return Object.assign(list, { cheer: i }); }
  if (n > 0 && !q.mute) Alarm.play('tick', { volume: Math.min(55, q.volume) });
  return list;
}
const pointViews = new Set();
bus.on('tools:points', () => Array.from(pointViews).forEach((f) => f()));
export function pointsView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board';
  let editing = false, confirm = false;
  const draw = () => {
    const list = teams(), max = Math.max(10, ...list.map((t) => t.p)), lead = Math.max(...list.map((t) => t.p));
    if (board) {
      host.innerHTML = '<div class="tl-points tl-m-board"><div class="tl-pt-cols">' + list.map((t, i) => { const c = colourOf(t.c); return '<div class="tl-pt-col" style="--tc:' + c.c + ';--td:' + c.d + ';--tl:' + c.l + '"><div class="tl-pt-bar"><span style="height:' + Math.round((t.p / max) * 100) + '%"></span></div><b class="tl-pt-n">' + t.p + '</b><span class="tl-pt-name">' + (t.p === lead && lead > 0 ? '<svg class="tl-crown" viewBox="0 0 24 24" aria-label="In the lead"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#F5A524" stroke="#8A5300" stroke-width="1.4" stroke-linejoin="round"/></svg>' : '') + esc(t.name) + '</span>' +
        '<div class="tl-pt-btns"><button type="button" class="tl-pt-b" data-pt="add" data-i="' + i + '" data-n="1" aria-label="One point to ' + esc(t.name) + '">+1</button><button type="button" class="tl-pt-b" data-pt="add" data-i="' + i + '" data-n="5" aria-label="Five points to ' + esc(t.name) + '">+5</button></div></div>'; }).join('') + '</div></div>';
      return;
    }
    host.innerHTML = '<div class="tl-points tl-m-' + mode + '">' + list.map((t, i) => { const c = colourOf(t.c); return '<div class="tl-pt-row" style="--tc:' + c.c + ';--td:' + c.d + '">' +
        (editing ? '<input type="text" maxlength="24" value="' + esc(t.name) + '" data-pt-name="' + i + '" aria-label="Team name"><button type="button" class="tl-swatch" data-pt="colour" data-i="' + i + '" aria-label="Change the colour of ' + esc(t.name) + '"></button>' : '<span class="tl-pt-name">' + esc(t.name) + '</span>') +
        '<span class="tl-pt-track"><span style="width:' + Math.round((t.p / max) * 100) + '%"></span></span><b class="tl-pt-n">' + t.p + '</b>' +
        (editing ? '<button type="button" class="btn small icon" data-pt="drop" data-i="' + i + '" aria-label="Remove ' + esc(t.name) + '"' + (list.length <= 2 ? ' disabled' : '') + '>' + icon('trash') + '</button>' :
          '<button type="button" class="tl-pt-b" data-pt="add" data-i="' + i + '" data-n="-1" aria-label="Take a point from ' + esc(t.name) + '">−1</button><button type="button" class="tl-pt-b" data-pt="add" data-i="' + i + '" data-n="1" aria-label="One point to ' + esc(t.name) + '">+1</button><button type="button" class="tl-pt-b hi" data-pt="add" data-i="' + i + '" data-n="5" aria-label="Five points to ' + esc(t.name) + '">+5</button>') + '</div>'; }).join('') +
      '<div class="tl-row">' + (editing ? '<button type="button" class="btn small" data-pt="new"' + (list.length >= 6 ? ' disabled' : '') + '>' + icon('plus') + '<span>Add a team</span></button><button type="button" class="btn small primary" data-pt="done">' + icon('check') + '<span>Done</span></button>' :
        '<button type="button" class="btn small" data-pt="edit">' + ti('edit') + '<span>Edit teams</span></button>' + (confirm ? '<span class="tl-confirm">Set every team to 0? <button type="button" class="btn small" data-pt="reset-yes">Yes, reset</button><button type="button" class="btn small" data-pt="reset-no">No</button></span>' : '<button type="button" class="btn small" data-pt="reset">' + icon('refresh') + '<span>Reset</span></button>')) + '</div></div>';
  };
  const rp = () => { if (!host.isConnected) { pointViews.delete(rp); return; } if (!editing) draw(); };
  pointViews.add(rp);
  draw();
  if (!host.dataset.ptWired) {
    host.dataset.ptWired = '1';
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pt]');
      if (!b) return;
      const a = b.dataset.pt, i = Number(b.dataset.i);
      if (a === 'add') { const r = addPoints(i, Number(b.dataset.n)); if (r.cheer != null) confetti(null, [colourOf(r[r.cheer].c).c, '#F5A524', '#FFFFFF']); return; }
      const list = teams();
      if (a === 'edit') { editing = true; confirm = false; }
      else if (a === 'done') { editing = false; }
      else if (a === 'new' && list.length < 6) { const used = new Set(list.map((t) => t.c)); const d = DEF_TEAMS.find(([n, c]) => !used.has(c) && !list.some((t) => t.name === n)) || ['Team ' + (list.length + 1), COLOURS[list.length % COLOURS.length].c]; list.push({ name: d[0], c: d[1], p: 0 }); saveTeams(list); }
      else if (a === 'drop' && list.length > 2) { list.splice(i, 1); saveTeams(list); }
      else if (a === 'colour') { const k = COLOURS.findIndex((x) => x.c === list[i].c); list[i].c = COLOURS[(k + 1) % COLOURS.length].c; saveTeams(list); }
      else if (a === 'reset') confirm = true;
      else if (a === 'reset-no') confirm = false;
      else if (a === 'reset-yes') { confirm = false; saveTeams(list.map((t) => Object.assign(t, { p: 0 }))); }
      draw();
    });
    host.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-pt-name]')) { const list = teams(), i = Number(t.dataset.ptName); if (list[i]) { list[i].name = String(t.value || '').trim().slice(0, 24) || list[i].name; saveTeams(list); } }
    });
  }
  return () => pointViews.delete(rp);
}

/* ================= Traffic light ================= */
export const TRAFFIC_SETS = [['Stop', 'Wait', 'Go'], ['Silent', 'Whisper', 'Talk'], ['Stuck', 'Nearly', 'Got it']];
const LAMPS = [{ id: 'r', on: '#E5484D', off: '#4A2326' }, { id: 'a', on: '#F5A524', off: '#4D3A12' }, { id: 'g', on: '#2FB36A', off: '#173A28' }];
function trafficLabels() {
  const p = prefs();
  if (p.trafficSet === 3 && Array.isArray(p.trafficLabels) && p.trafficLabels.length === 3) return p.trafficLabels.map((x) => String(x || '').slice(0, 20));
  return TRAFFIC_SETS[Math.max(0, Math.min(2, Number(p.trafficSet) || 0))];
}
const LIT = 'ks2-engine.tools.traffic.v1';
const litNow = () => { try { return sessionStorage.getItem(LIT) || ''; } catch (e) { return ''; } };
export function trafficView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board';
  const draw = () => {
    const lab = trafficLabels(), lit = litNow(), p = prefs();
    host.innerHTML = '<div class="tl-traffic tl-m-' + mode + '"><div class="tl-tl-box" role="group" aria-label="Traffic light">' + LAMPS.map((l, i) => '<button type="button" class="tl-lamp' + (lit === l.id ? ' on' : '') + '" data-tf="' + l.id + '" aria-pressed="' + (lit === l.id) + '" style="--on:' + l.on + ';--off:' + l.off + '"><span class="tl-lamp-c" aria-hidden="true"></span><span class="tl-lamp-t">' + esc(lab[i]) + '</span></button>').join('') + '</div>' +
      (board ? '' : '<label class="tl-inline"><span>Words</span><select data-tf-set aria-label="Words for the lights">' + TRAFFIC_SETS.map((s, i) => '<option value="' + i + '"' + (p.trafficSet === i ? ' selected' : '') + '>' + esc(s.join(' / ')) + '</option>').join('') + '<option value="3"' + (p.trafficSet === 3 ? ' selected' : '') + '>Your own words</option></select></label>' +
        (p.trafficSet === 3 ? '<div class="tl-tf-own">' + lab.map((x, i) => '<input type="text" maxlength="20" value="' + esc(x) + '" data-tf-own="' + i + '" aria-label="' + ['Red', 'Amber', 'Green'][i] + ' light">').join('') + '</div>' : '')) + '</div>';
  };
  draw();
  if (!host.dataset.tfWired) {
    host.dataset.tfWired = '1';
    host.addEventListener('click', (e) => { const b = e.target.closest('[data-tf]'); if (!b) return; const v = litNow() === b.dataset.tf ? '' : b.dataset.tf; try { sessionStorage.setItem(LIT, v); } catch (er) { /* fine */ } draw(); bus.emit('tools:traffic', v); });
    host.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-tf-set]')) { const n = Number(t.value); setPrefs({ trafficSet: n, trafficLabels: n === 3 ? trafficLabels() : prefs().trafficLabels }); draw(); }
      else if (t.matches('[data-tf-own]')) { const cur = trafficLabels().slice(); cur[Number(t.dataset.tfOwn)] = String(t.value || '').trim().slice(0, 20) || cur[Number(t.dataset.tfOwn)]; setPrefs({ trafficSet: 3, trafficLabels: cur }); }
    });
    host.addEventListener('keydown', (e) => { if (e.target.closest('input,select')) return; const k = { 1: 'r', 2: 'a', 3: 'g', r: 'r', a: 'a', g: 'g' }[e.key.toLowerCase()]; if (k) { const b = $('[data-tf="' + k + '"]', host); if (b) b.click(); } });
  }
  return () => {};
}

/* ================= Dice ================= */
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]] };
const DIE_COL = ['#5B52E6', '#E2558A', '#2C9C96'];
function dieSVG(v, sides, k) {
  if (sides === 6) return '<svg class="tl-die" viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="20" fill="#fff" stroke="' + DIE_COL[k % 3] + '" stroke-width="6"/>' + PIPS[v].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#1F2937"/>').join('') + '</svg>';
  const shape = sides === 10 ? 'M50 4 92 40 50 96 8 40z' : sides === 12 ? 'M50 4 95 37 78 92H22L5 37z' : 'M50 4 96 88H4z';
  return '<svg class="tl-die" viewBox="0 0 100 100" aria-hidden="true"><path d="' + shape + '" fill="' + DIE_COL[k % 3] + '" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><text x="50" y="' + (sides === 20 ? 70 : 60) + '" text-anchor="middle" font-size="' + (v > 9 ? 30 : 36) + '" font-weight="800" fill="#fff">' + v + '</text></svg>';
}
const DICE = 'ks2-engine.tools.dice.v1';
export function rollDice(n, sides) { return Array.from({ length: n }, () => 1 + randInt(sides)); }
export function diceView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board';
  let rolling = false;
  const last = () => { try { const v = JSON.parse(sessionStorage.getItem(DICE) || 'null'); return Array.isArray(v) ? v : null; } catch (e) { return null; } };
  const draw = (vals, spin) => {
    const p = prefs(), s = p.sides, v = vals || last() || Array.from({ length: p.dice }, () => s === 6 ? 6 : s);
    host.innerHTML = '<div class="tl-dice tl-m-' + mode + '">' +
      '<div class="tl-dice-row' + (spin ? ' rolling' : '') + '" aria-live="polite" aria-label="' + (vals ? 'Rolled ' + v.join(', ') + (v.length > 1 ? ', total ' + v.reduce((a, b) => a + b, 0) : '') : 'Dice') + '">' + v.map((x, k) => dieSVG(x, s, k)).join('') + '</div>' +
      (v.length > 1 ? '<p class="tl-dice-total">Total <b>' + v.reduce((a, b) => a + b, 0) + '</b></p>' : '') +
      '<div class="tl-ctrl"><button type="button" class="btn primary" data-dc="roll"' + (rolling ? ' disabled' : '') + '>' + ti('dice') + '<span>Roll</span></button></div>' +
      (board ? '' : '<div class="tl-row"><label class="tl-inline"><span>Dice</span><select data-dc="n">' + [1, 2, 3].map((x) => '<option' + (x === p.dice ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label><label class="tl-inline"><span>Sides</span><select data-dc="s">' + [6, 10, 12, 20].map((x) => '<option' + (x === s ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div>') + '</div>';
  };
  const roll = () => {
    if (rolling) return;
    rolling = true;
    const p = prefs(), final = rollDice(p.dice, p.sides);
    if (!p.mute) Alarm.play('rattle', { volume: Math.min(70, p.volume) });
    let k = 0;
    const flick = () => {
      if (!host.isConnected) return;
      if (k < 8) { draw(rollDice(p.dice, p.sides), true); k++; setTimeout(flick, 70); return; }
      rolling = false;
      try { sessionStorage.setItem(DICE, JSON.stringify(final)); } catch (e) { /* fine */ }
      draw(final, false); bus.emit('tools:dice', final);
    };
    flick();
  };
  draw(null, false);
  if (!host.dataset.dcWired) {
    host.dataset.dcWired = '1';
    host.addEventListener('click', (e) => { if (e.target.closest('[data-dc="roll"]')) roll(); });
    host.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-dc="n"]')) { setPrefs({ dice: Number(t.value) }); try { sessionStorage.removeItem(DICE); } catch (er) { /* fine */ } draw(null, false); }
      else if (t.matches('[data-dc="s"]')) { setPrefs({ sides: Number(t.value) }); try { sessionStorage.removeItem(DICE); } catch (er) { /* fine */ } draw(null, false); }
    });
    host.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button,select,input')) { e.preventDefault(); roll(); } });
  }
  return () => {};
}

/* ================= Now and next ================= */
let calP = null;
function cal() {
  if (!calP) calP = import('../calendar.js?v=af1c9ebd').catch(() => null);
  return calP;
}
const hm = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); if (!m) return ''; const h = Number(m[1]), mm = m[2]; return (h % 12 || 12) + ':' + mm + (h < 12 ? ' am' : ' pm'); };
function itemText(it) { if (!it) return null; const title = String(it.title || subjectName(it.subject) || '').slice(0, 60); return { title: title || 'Lesson', subject: it.subject || 'general', start: it.start || '', end: it.end || '', cls: it.cls || it.year || '' }; }
export async function nowNextData() {
  const m = await cal();
  if (m && typeof m.nowNext === 'function') {
    try { const r = m.nowNext(new Date()); if (r && (r.now || r.next)) return { now: itemText(r.now), next: itemText(r.next), from: 'calendar' }; } catch (e) { /* fall back to her own words */ }
  }
  const p = prefs();
  return { now: p.now ? { title: p.now, subject: 'general' } : null, next: p.next ? { title: p.next, subject: 'general' } : null, from: 'typed' };
}
export function nownextView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board';
  let t = 0;
  const panel = (k, it) => {
    if (!it) return '<div class="tl-nn-p empty"><span class="tl-nn-k">' + k + '</span><b>Nothing yet</b></div>';
    const time = k === 'Now' ? (it.end ? 'until ' + hm(it.end) : '') : (it.start ? 'at ' + hm(it.start) : '');
    return '<div class="tl-nn-p" style="--nc:' + subjectColor(it.subject) + '"><span class="tl-nn-k">' + k + '</span><b>' + esc(it.title) + '</b>' + (time || it.cls ? '<span class="tl-nn-time">' + esc([time, it.cls].filter(Boolean).join(' · ')) + '</span>' : '') + '</div>';
  };
  const draw = async () => {
    const d = await nowNextData(), p = prefs();
    if (!host.isConnected && host.dataset.nnDrawn) return;
    host.dataset.nnDrawn = '1';
    host.innerHTML = '<div class="tl-nownext tl-m-' + mode + '"><div class="tl-nn-row">' + panel('Now', d.now) + '<span class="tl-nn-arrow" aria-hidden="true">' + icon('right') + '</span>' + panel('Next', d.next) + '</div>' +
      (board ? '' : '<p class="fine">' + (d.from === 'calendar' ? 'From your calendar. It changes by itself as the day goes on.' : 'Type what is happening now and next, or set up your calendar.') + '</p>' +
        (d.from === 'calendar' ? '' : '<div class="tl-nn-own"><label class="fld"><span>Now</span><input type="text" maxlength="60" data-nn="now" value="' + esc(p.now) + '" placeholder="For example: Maths"></label><label class="fld"><span>Next</span><input type="text" maxlength="60" data-nn="next" value="' + esc(p.next) + '" placeholder="For example: Break"></label></div>')) + '</div>';
  };
  draw();
  clearInterval(Number(host.dataset.nnT || 0));
  t = setInterval(() => { if (!host.isConnected) { clearInterval(t); return; } if (!host.contains(document.activeElement) || !document.activeElement.matches('input')) draw(); }, 30000);
  host.dataset.nnT = String(t);
  if (!host.dataset.nnWired) {
    host.dataset.nnWired = '1';
    host.addEventListener('change', (e) => { const x = e.target; if (x.matches('[data-nn]')) { setPrefs({ [x.dataset.nn]: String(x.value || '').trim().slice(0, 60) }); draw(); } });
  }
  return () => clearInterval(t);
}
