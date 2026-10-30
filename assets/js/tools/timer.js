/* Class tools: the timer and the stopwatch.
   There is one timer for the whole site (the Class tools page, the board, the tools over the slides and Symphony's
   "start a timer for 2 minutes"), so it keeps running when the teacher moves to another page: a small pill shows it on
   every page while no timer is on screen. At zero: her chosen end sound at her volume (Whole-hall loud plays it three
   times at full volume), a soft colour pulse (none with reduced motion), Symphony says "Time's up" if she wants, and
   it can ring again until she stops it. A running timer survives a reload of the page (this tab only). */
import { $, $$, esc, icon, bus } from '../core.js?v=af1c9ebd';
import { Voice } from '../fx/voice.js?v=af1c9ebd';
import { Alarm, SOUNDS, SOUND_ICON } from './alarm.js?v=af1c9ebd';
import { prefs, setPrefs, layer, presentHost, flash, fmt, ti, liveCall, boardOverlay } from './shared.js?v=af1c9ebd';

const SS = 'ks2-engine.tools.timer.v1', MAXS = 99 * 60 + 59, CIRC = 2 * Math.PI * 86;
export const T = { total: 0, ends: 0, left: 0, running: false, paused: false, done: false, whole: -1 };
const subs = new Set(), views = new Set();
let iv = 0, ringing = null, presenting = false;
export function onTimer(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit(what) { subs.forEach((fn) => { try { fn(what); } catch (e) { /* one view never stops the others */ } }); bus.emit('tools:timer', what); paintPill(); }
export const remaining = () => (T.running && !T.paused ? Math.max(0, (T.ends - Date.now()) / 1000) : T.left);
const clampS = (s) => Math.max(1, Math.min(MAXS, Math.round(Number(s) || 0)));
function save() { try { sessionStorage.setItem(SS, JSON.stringify(T)); } catch (e) { /* this visit only */ } }

/* ---------------- the timer itself ---------------- */
export function start(secs) {
  const s = clampS(secs == null ? prefs().lastSecs : secs);
  stopRing();
  Object.assign(T, { total: s, left: s, ends: Date.now() + s * 1000, running: true, paused: false, done: false, whole: -1 });
  setPrefs({ lastSecs: s });
  Alarm.unlock();
  save(); loop(); emit('start');
  liveCall('pushTimer', { secs: s, ends: T.ends });
}
export function pause() {
  if (!T.running || T.paused) return;
  T.left = remaining(); T.paused = true; save(); emit('pause');
  liveCall('stopTimerLive');
}
export function resume() {
  if (!T.running || !T.paused) return;
  T.ends = Date.now() + T.left * 1000; T.paused = false; Alarm.unlock();
  save(); loop(); emit('resume');
  liveCall('pushTimer', { secs: Math.ceil(T.left), ends: T.ends });
}
export function toggle() { if (!T.running) start(T.total || prefs().lastSecs); else if (T.paused) resume(); else pause(); }
export function addSecs(s) {
  if (T.done || !T.running) { start((T.running ? remaining() : 0) + s); return; }
  if (T.paused) T.left = Math.min(MAXS, T.left + s); else T.ends += s * 1000;
  T.total = Math.min(MAXS, T.total + s);
  save(); emit('add');
  if (!T.paused) liveCall('pushTimer', { secs: Math.ceil(remaining()), ends: T.ends });
}
export function reset() {
  clearInterval(iv); stopRing();
  const was = T.running || T.done;
  Object.assign(T, { left: T.total || prefs().lastSecs, running: false, paused: false, done: false, ends: 0, whole: -1 });
  save(); emit('reset');
  if (was) liveCall('stopTimerLive');
}
function loop() { clearInterval(iv); iv = setInterval(tick, 200); tick(); }
function tick() {
  if (!T.running || T.paused) return;
  const left = remaining(), whole = Math.ceil(left);
  if (whole !== T.whole) {
    T.whole = whole;
    const p = prefs();
    if (p.tick && !p.mute && whole > 0 && whole <= 10) Alarm.play('tick', { volume: Math.min(75, p.volume) });
    emit('tick');
  }
  if (left <= 0) {
    clearInterval(iv);
    Object.assign(T, { running: false, paused: false, done: true, left: 0 });
    save(); emit('done');
    timesUp();
  }
}
/* A timer left running when the page reloaded carries on (it may have finished meanwhile: then it just shows 0:00). */
(function restore() {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem(SS) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') return;
  T.total = clampS(s.total || 0); T.left = Math.max(0, Number(s.left) || 0);
  if (s.running && !s.paused && Number(s.ends) > Date.now()) { Object.assign(T, { ends: Number(s.ends), running: true, paused: false }); loop(); }
  else if (s.running && s.paused) Object.assign(T, { running: true, paused: true });
  else if (s.running) Object.assign(T, { running: false, done: true, left: 0 });
  setTimeout(paintPill, 0);
})();

/* ---------------- time's up ---------------- */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let banner = null;
function stopRing() { if (ringing) { const r = ringing; ringing = null; r.stop(); } }
/* Her chosen end sound, flash and voice. o: { sound, volume, voice: false (the caller speaks), flash: false } (the older
   present timers and Symphony's timer call this through fx/timesup.js). */
export function timesUp(o) {
  o = o || {};
  const p = prefs();
  stopRing();
  const vol = p.mute ? 0 : (o.volume != null ? o.volume : p.hall ? 100 : p.volume), times = p.hall ? 3 : 1, id = o.sound || p.sound;
  let stopped = false, cur = null;
  const ctl = { stop() { stopped = true; if (cur) cur.stop(); hideBanner(); if (ringing === ctl) ringing = null; paintPill(); } };
  ringing = ctl;
  const doFlash = o.flash === false ? false : p.flash, speak = o.voice === false ? false : p.voice;   // o.voice false: the caller speaks itself
  showBanner(ctl, !!p.repeat);
  if (doFlash) flash('#E2574C');
  (async () => {
    cur = Alarm.play(id, { volume: vol, times });
    await cur.done;
    if (stopped) return;
    if (speak) Voice.say('Time’s up!', { lang: 'en-GB', style: 'chat' });
    while (p.repeat && !stopped) {
      await wait(2600);
      if (stopped) break;
      if (doFlash) flash('#E2574C');
      cur = Alarm.play(id, { volume: vol, times: 1 });
      await cur.done;
    }
    if (!stopped) setTimeout(() => { if (ringing === ctl) ctl.stop(); }, 7000);
  })();
  bus.emit('tools:timesup', { sound: id, volume: vol, times });
  return ctl;
}
export const isRinging = () => !!ringing;
function showBanner(ctl, repeat) {
  hideBanner();
  banner = document.createElement('div');
  banner.className = 'tl-up'; banner.setAttribute('role', 'alert');
  banner.innerHTML = '<span class="tl-up-ring" aria-hidden="true">' + ti('timer') + '</span><b>Time’s up</b>' +
    '<button type="button" class="btn ' + (repeat ? 'primary' : 'small') + '" data-tl-up>' + icon(repeat ? 'stop' : 'check') + '<span>' + (repeat ? 'Stop the sound' : 'OK') + '</span></button>';
  banner.addEventListener('click', (e) => { if (e.target.closest('[data-tl-up]')) ctl.stop(); });
  layer().appendChild(banner);
}
function hideBanner() { if (banner) { banner.remove(); banner = null; } }

/* ---------------- the pill on other pages ---------------- */
let pill = null;
bus.on('present', (on) => { presenting = !!on; paintPill(); });
document.addEventListener('fullscreenchange', () => { if (pill && pill.parentNode !== layer()) layer().appendChild(pill); if (banner && banner.parentNode !== layer()) layer().appendChild(banner); paintPill(); });
const seen = (el) => el && el.isConnected && el.getClientRects().length > 0 && !el.closest('[hidden]');
export function registerView(el) { views.add(el); paintPill(); return () => { views.delete(el); paintPill(); }; }
function paintPill() {
  Array.from(views).forEach((v) => { if (!v.isConnected) views.delete(v); });
  const onScreen = Array.from(views).some(seen);
  const want = (T.running || (T.done && ringing)) && !onScreen;
  if (!want) { if (pill) pill.hidden = true; return; }
  if (!pill) {
    pill = document.createElement('div');
    pill.className = 'tl-pill';
    pill.innerHTML = '<button type="button" class="tl-pill-go" data-tl-pill="go" aria-label="Open the timer"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="trk" cx="18" cy="18" r="15"/><circle class="arc" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="tl-pill-t"></b></button>' +
      '<button type="button" class="tl-pill-x" data-tl-pill="x" aria-label="Stop the timer">' + icon('close') + '</button>';
    pill.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tl-pill]');
      if (!b) return;
      if (b.dataset.tlPill === 'x') { reset(); return; }
      const ph = presentHost();
      if (presenting || ph || document.fullscreenElement) import('./dock.js?v=af1c9ebd').then((m) => m.openPanel('timer', ph || layer())).catch(() => {});
      else location.hash = '#/tools/timer';
    });
  }
  if (pill.parentNode !== layer()) layer().appendChild(pill);
  pill.hidden = false;
  const left = remaining();
  $('.tl-pill-t', pill).textContent = T.done ? 'Time’s up' : fmt(left);
  pill.classList.toggle('done', T.done);
  pill.classList.toggle('low', T.running && !T.paused && left <= 10);
  pill.classList.toggle('paused', T.paused);
  const arc = $('.arc', pill); if (arc) arc.style.strokeDashoffset = String(100 - (T.total ? (left / T.total) * 100 : 0));
}

/* ---------------- the timer on screen ----------------
   mode: 'card' (the Class tools page), 'big' (#/tools/timer), 'board' (full screen), 'panel' (over the slides). */
const PRESETS = [[30, '30 s'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min'], [900, '15 min']];
export function timerView(host, mode) {
  mode = mode || 'card';
  const p = prefs(), board = mode === 'board', panel = mode === 'panel', full = mode === 'card' || mode === 'big';
  const size = board ? 'min(62vmin, 560px)' : panel ? '150px' : mode === 'big' ? '300px' : '236px';
  host.innerHTML = '<div class="tl-timer tl-m-' + mode + '" tabindex="-1">' +
    '<div class="tl-ring" style="--sz:' + size + '"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="86"/><circle class="arc" cx="100" cy="100" r="86" stroke-dasharray="' + CIRC.toFixed(1) + '" transform="rotate(-90 100 100)"/></svg>' +
      '<div class="tl-ring-in"><b class="tl-digits" role="timer" aria-live="off"></b><small class="tl-of"></small></div></div>' +
    '<p class="sr" aria-live="assertive" data-tl="say"></p>' +
    '<div class="tl-ctrl"><button type="button" class="btn primary" data-tl="go"></button><button type="button" class="btn" data-tl="add">' + icon('plus') + '<span>1 min</span></button><button type="button" class="btn" data-tl="reset">' + icon('refresh') + '<span>Reset</span></button></div>' +
    (board ? '' : '<div class="tl-presets" role="group" aria-label="Quick times">' + PRESETS.filter((x) => !panel || x[0] <= 600).map(([s, l]) => '<button type="button" class="tl-chip" data-tl-preset="' + s + '">' + l + '</button>').join('') + '</div>') +
    (full ? '<div class="tl-custom" role="group" aria-label="Your own time"><label><span>Minutes</span><input type="number" min="0" max="99" inputmode="numeric" data-tl="m"></label><span class="tl-colon" aria-hidden="true">:</span><label><span>Seconds</span><input type="number" min="0" max="59" step="5" inputmode="numeric" data-tl="s"></label><button type="button" class="btn" data-tl="set">' + icon('play') + '<span>Start this time</span></button></div>' : '') +
    (full ? soundsHTML(p) : '') +
    (panel ? '<div class="tl-panel-row"><button type="button" class="btn small" data-tl="shrink">' + ti('shrink') + '<span>Make it small</span></button></div>' : '') +
    '</div>';
  const root = $('.tl-timer', host);
  const m0 = Math.floor(p.lastSecs / 60), s0 = p.lastSecs % 60;
  if ($('[data-tl="m"]', root)) { $('[data-tl="m"]', root).value = String(m0); $('[data-tl="s"]', root).value = String(s0); }
  const paint = () => {
    const left = remaining(), total = T.total || prefs().lastSecs;
    $('.tl-digits', root).textContent = T.done ? '0:00' : fmt(T.running ? left : (T.left || total));
    $('.tl-of', root).textContent = T.done ? 'Time’s up' : T.paused ? 'Paused · of ' + fmt(total) : 'of ' + fmt(total);
    const frac = T.done ? 0 : T.running ? left / total : 1;
    $('.arc', root).style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, frac))));
    root.classList.toggle('low', T.running && !T.paused && left <= 10);
    root.classList.toggle('done', T.done);
    root.classList.toggle('paused', T.paused);
    const go = $('[data-tl="go"]', root);
    go.innerHTML = !T.running ? icon('play') + '<span>Start</span>' : T.paused ? icon('play') + '<span>Resume</span>' : icon('pause') + '<span>Pause</span>';
    $$('[data-tl-preset]', root).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.tlPreset) === T.total && (T.running || T.done))));
  };
  let lastWhat = '';
  const off = onTimer((what) => {
    paint();
    if (what !== lastWhat && (what === 'done' || what === 'start' || what === 'pause' || what === 'reset')) { lastWhat = what; const s = $('[data-tl="say"]', root); if (s) s.textContent = what === 'done' ? 'Time’s up' : what === 'start' ? 'Timer started' : what === 'pause' ? 'Paused' : 'Reset'; }
  });
  const raf = { id: 0 };
  const smooth = () => { if (!root.isConnected) return; if (T.running && !T.paused) paint(); raf.id = requestAnimationFrame(smooth); };
  raf.id = requestAnimationFrame(smooth);
  const unreg = registerView(root);
  root.addEventListener('click', (e) => {
    const pr = e.target.closest('[data-tl-preset]');
    if (pr) { start(Number(pr.dataset.tlPreset)); return; }
    const snd = e.target.closest('[data-tl-sound]');
    if (snd) { setPrefs({ sound: snd.dataset.tlSound }); Alarm.unlock(); Alarm.play(snd.dataset.tlSound, { volume: prefs().mute ? 0 : prefs().volume }); paintSounds(root); return; }
    const b = e.target.closest('[data-tl]');
    if (!b) return;
    const a = b.dataset.tl;
    if (a === 'go') toggle();
    else if (a === 'add') addSecs(60);
    else if (a === 'reset') reset();
    else if (a === 'set') { const mm = Math.max(0, Math.min(99, Number($('[data-tl="m"]', root).value) || 0)), ss = Math.max(0, Math.min(59, Number($('[data-tl="s"]', root).value) || 0)); if (mm * 60 + ss > 0) start(mm * 60 + ss); }
    else if (a === 'test') { const q = prefs(); Alarm.unlock(); Alarm.play(q.sound, { volume: q.mute ? 0 : q.hall ? 100 : q.volume, times: 1 }); }
    else if (a === 'shrink') { const pn = root.closest('.tl-panel'); if (pn && pn._close) pn._close(); paintPill(); }
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-tl-pref]')) { setPrefs({ [t.dataset.tlPref]: t.type === 'checkbox' ? t.checked : t.value }); paintSounds(root); }
  });
  root.addEventListener('input', (e) => { const t = e.target; if (t.matches('[data-tl-pref="volume"]')) { setPrefs({ volume: Number(t.value) }); paintSounds(root); } });
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input,select,textarea')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === '+' || e.key === '=') addSecs(60);
  });
  paint(); paintSounds(root);
  return () => { off(); unreg(); cancelAnimationFrame(raf.id); };
}
function soundsHTML(p) {
  return '<div class="tl-sounds"><p class="tl-h3">When time is up</p>' +
    '<div class="tl-snd-grid" role="group" aria-label="End sound">' + SOUNDS.map((s) => '<button type="button" class="tl-snd" data-tl-sound="' + s.id + '" aria-pressed="' + (p.sound === s.id) + '" style="--tint:' + s.tint + '"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + SOUND_ICON[s.id] + '</svg><span>' + esc(s.name) + '</span></button>').join('') + '</div>' +
    '<label class="tl-vol"><span class="tl-vol-h">Volume <b data-tl="volv"></b></span><input type="range" min="0" max="100" step="5" data-tl-pref="volume" value="' + p.volume + '" aria-label="Volume of the end sound"><span class="tl-vol-k"><span>Quiet</span><span>Loud</span></span></label>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="hall"' + (p.hall ? ' checked' : '') + '><span><b>Whole-hall loud</b><small>Full volume, three rings</small></span></label>' +
    '<div class="tl-row"><button type="button" class="btn small" data-tl="test">' + icon('volume') + '<span>Test the sound</span></button></div>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="flash"' + (p.flash ? ' checked' : '') + '><span><b>Flash the screen</b><small>A soft pulse of colour (none if your device asks for less motion)</small></span></label>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="voice"' + (p.voice ? ' checked' : '') + '><span><b>Symphony says “Time’s up”</b></span></label>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="repeat"' + (p.repeat ? ' checked' : '') + '><span><b>Ring until I stop it</b></span></label>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="tick"' + (p.tick ? ' checked' : '') + '><span><b>Tick for the last 10 seconds</b></span></label>' +
    '<label class="tl-tog"><input type="checkbox" data-tl-pref="mute"' + (p.mute ? ' checked' : '') + '><span><b>No sound</b><small>Class tools stay silent</small></span></label></div>';
}
function paintSounds(root) {
  const p = prefs();
  $$('[data-tl-sound]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tlSound === p.sound)));
  const v = $('[data-tl="volv"]', root); if (v) v.textContent = p.mute ? 'off' : p.hall ? 'whole hall' : p.volume + '%';
  const r = $('[data-tl-pref="volume"]', root); if (r) { r.disabled = p.hall || p.mute; if (Number(r.value) !== p.volume) r.value = String(p.volume); }
}
/* The timer on the whole screen. */
export function timerBoard() { return boardOverlay('Timer', (stage) => timerView(stage, 'board'), { cls: 'tl-b-timer' }); }

/* ---------------- the stopwatch ---------------- */
const SW = { running: false, from: 0, acc: 0, laps: [] };
const swNow = () => SW.acc + (SW.running ? Date.now() - SW.from : 0);
const swFmt = (ms) => { const t = Math.floor(ms / 100), d = t % 10, s = Math.floor(t / 10) % 60, m = Math.floor(t / 600); return m + ':' + String(s).padStart(2, '0') + '.' + d; };
export function stopwatchView(host, mode) {
  mode = mode || 'card';
  host.innerHTML = '<div class="tl-sw tl-m-' + mode + '"><b class="tl-sw-d" role="timer" aria-live="off">0:00.0</b>' +
    '<div class="tl-ctrl"><button type="button" class="btn primary" data-sw="go"></button><button type="button" class="btn" data-sw="lap">' + ti('flag') + '<span>Lap</span></button><button type="button" class="btn" data-sw="reset">' + icon('refresh') + '<span>Reset</span></button></div>' +
    '<ol class="tl-laps" aria-label="Laps"></ol></div>';
  const root = $('.tl-sw', host);
  const paint = () => {
    $('.tl-sw-d', root).textContent = swFmt(swNow());
    $('[data-sw="go"]', root).innerHTML = SW.running ? icon('pause') + '<span>Pause</span>' : icon('play') + '<span>' + (swNow() ? 'Carry on' : 'Start') + '</span>';
    $('[data-sw="lap"]', root).disabled = !SW.running;
    const laps = SW.laps;
    $('.tl-laps', root).innerHTML = laps.map((t, i) => '<li><span>Lap ' + (i + 1) + '</span><b>' + swFmt(t - (laps[i - 1] || 0)) + '</b><small>' + swFmt(t) + '</small></li>').reverse().join('');
  };
  let id = 0;
  const loop = () => { if (!root.isConnected) return; if (SW.running) $('.tl-sw-d', root).textContent = swFmt(swNow()); id = requestAnimationFrame(loop); };
  id = requestAnimationFrame(loop);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sw]');
    if (!b) return;
    const a = b.dataset.sw;
    if (a === 'go') { if (SW.running) { SW.acc = swNow(); SW.running = false; } else { SW.from = Date.now(); SW.running = true; } }
    else if (a === 'lap' && SW.running) { SW.laps.push(swNow()); if (SW.laps.length > 30) SW.laps.shift(); }
    else if (a === 'reset') { SW.running = false; SW.acc = 0; SW.laps = []; }
    paint();
  });
  paint();
  return () => cancelAnimationFrame(id);
}
