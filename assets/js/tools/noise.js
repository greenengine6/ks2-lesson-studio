/* Class tools: the noise meter.
   The microphone only measures how loud the room is, on this device: nothing is recorded, kept or sent. Levels go from
   Silent to Too loud; the teacher picks the level she expects (Partner talk, say). When the room stays above it for two
   seconds, a gentle two-note alert plays (if she wants it), the meter turns red and says "Too loud". "This is quiet"
   sets the meter to the room as it is now. Stop (or leaving the page) switches the microphone off. */
import { $, $$, esc, icon, bus } from '../core.js?v=73f756c9';
import { Alarm } from './alarm.js?v=73f756c9';
import { prefs, setPrefs, boardOverlay } from './shared.js?v=73f756c9';

export const LEVELS = [
  { id: 'silent', name: 'Silent', top: 15, c: '#8FD3B0' },
  { id: 'whisper', name: 'Whisper', top: 35, c: '#BFE3A0' },
  { id: 'partner', name: 'Partner talk', top: 55, c: '#F7D774' },
  { id: 'group', name: 'Group work', top: 75, c: '#F5A85A' },
  { id: 'loud', name: 'Too loud', top: 101, c: '#E8746B' }
];
const N = { on: false, starting: false, stream: null, ctx: null, an: null, buf: null, raf: 0, level: 0, db: -90, over: 0, lastT: 0, alertAt: 0, loudUntil: 0, err: '' };
const views = new Set();
const levelOf = (v) => LEVELS.find((l) => v < l.top) || LEVELS[LEVELS.length - 1];
const target = () => LEVELS.find((l) => l.id === prefs().noiseTarget) || LEVELS[2];
export const noiseOn = () => N.on;

export async function startNoise() {
  if (N.on || N.starting) return;
  N.err = '';
  const md = navigator.mediaDevices;
  if (!window.isSecureContext || !md || !md.getUserMedia) { N.err = 'This browser cannot use a microphone here. Open the site at its secure (https) address.'; paintAll(); return; }
  N.starting = true; paintAll();
  try {
    N.stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
    const C = window.AudioContext || window.webkitAudioContext;
    N.ctx = new C();
    if (N.ctx.state === 'suspended') await N.ctx.resume().catch(() => {});
    const src = N.ctx.createMediaStreamSource(N.stream);
    N.an = N.ctx.createAnalyser(); N.an.fftSize = 2048; N.an.smoothingTimeConstant = 0;
    src.connect(N.an);                                    // never to the speakers
    N.buf = new Float32Array(N.an.fftSize);
    N.on = true; N.level = 0; N.over = 0; N.lastT = performance.now();
    loop();
    bus.emit('tools:noise', true);
  } catch (e) {
    const n = e && e.name;
    N.err = n === 'NotAllowedError' || n === 'SecurityError' ? 'The microphone is blocked. Allow it for this site (the icon in the address bar), then press Start listening again.'
      : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No microphone was found on this device.'
      : n === 'NotReadableError' ? 'Another app is using the microphone. Close it, then try again.' : 'The microphone did not start. Try again.';
    stopNoise();
  } finally { N.starting = false; paintAll(); }
}
export function stopNoise() {
  cancelAnimationFrame(N.raf);
  if (N.stream) N.stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* fine */ } });
  if (N.ctx) N.ctx.close().catch(() => {});
  const was = N.on;
  Object.assign(N, { on: false, stream: null, ctx: null, an: null, buf: null, level: 0, over: 0, loudUntil: 0 });
  if (was) bus.emit('tools:noise', false);
  paintAll();
}
function loop() {
  if (!N.on || !N.an) return;
  const now = performance.now(), dt = Math.min(250, now - N.lastT);
  if (dt >= 45) {
    N.lastT = now;
    N.an.getFloatTimeDomainData(N.buf);
    let sum = 0;
    for (let i = 0; i < N.buf.length; i++) sum += N.buf[i] * N.buf[i];
    const rms = Math.sqrt(sum / N.buf.length);
    N.db = 20 * Math.log10(rms + 1e-9);
    const raw = Math.max(0, Math.min(100, ((N.db - prefs().noiseBase) / 40) * 100));
    N.level += (raw - N.level) * (raw > N.level ? 0.35 : 0.08);
    const t = target();
    if (N.level >= t.top) N.over += dt; else N.over = Math.max(0, N.over - dt * 2);
    if (N.over >= 2000 && Date.now() - N.alertAt > 10000) alert();
    paintAll();
  }
  N.raf = requestAnimationFrame(loop);
}
function alert() {
  N.alertAt = Date.now(); N.loudUntil = Date.now() + 3500; N.over = 0;
  const p = prefs();
  if (p.noiseAlert && !p.mute) Alarm.play('soft', { volume: Math.min(70, p.volume) });
  bus.emit('tools:noise-alert', target().id);
}
/* "This is quiet": the room as it is now reads as near the bottom. */
export function calibrate() { if (N.on && Number.isFinite(N.db)) setPrefs({ noiseBase: Math.round(Math.max(-90, Math.min(-20, N.db - 3))) }); }

/* ---------------- on screen ---------------- */
let faceN = 0;
function face(level, loud) {
  const gid = 'tlShine' + (++faceN);
  const mood = loud ? -1 : level < 35 ? 1 : level < 55 ? 0.5 : level < 75 ? 0 : -1;
  const mouth = mood >= 1 ? 'M70 132 Q100 158 130 132' : mood >= 0.5 ? 'M72 136 Q100 150 128 136' : mood >= 0 ? 'M74 140 L126 140' : 'M72 148 Q100 124 128 148';
  const col = loud ? '#E8746B' : levelOf(level).c;
  return '<svg class="tl-face" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" fill="' + col + '"/><circle cx="100" cy="100" r="88" fill="url(#' + gid + ')"/>' +
    '<defs><radialGradient id="' + gid + '" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="72" cy="86" r="11" fill="#1F2937"/><circle cx="128" cy="86" r="11" fill="#1F2937"/><path d="' + mouth + '" fill="none" stroke="#1F2937" stroke-width="9" stroke-linecap="round"/></svg>';
}
export function noiseView(host, mode) {
  mode = mode || 'card';
  const board = mode === 'board', p = prefs();
  host.innerHTML = '<div class="tl-noise tl-m-' + mode + '">' +
    '<div class="tl-noise-top"><span class="tl-noise-now" aria-live="polite"></span>' + (board ? '' : '<span class="tl-noise-want"></span>') + '</div>' +
    (mode === 'card' ? '' : '<div class="tl-noise-face"></div>') +
    '<div class="tl-meter" role="meter" aria-label="How loud the room is" aria-valuemin="0" aria-valuemax="100"><div class="tl-meter-bar">' + LEVELS.map((l) => '<span style="background:' + l.c + '"></span>').join('') + '</div><span class="tl-meter-pin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 22 4 8h16z"/></svg></span>' +
      '<div class="tl-meter-k">' + LEVELS.map((l) => '<span data-lv="' + l.id + '">' + esc(l.name) + '</span>').join('') + '</div></div>' +
    '<p class="tl-loud" hidden>Too loud</p>' +
    (board ? '' : '<div class="tl-ctrl"><button type="button" class="btn primary" data-nz="go"></button><button type="button" class="btn" data-nz="cal">' + icon('check') + '<span>This is quiet</span></button></div>' +
      '<label class="tl-inline"><span>Expected</span><select data-nz="want" aria-label="The level you expect">' + LEVELS.slice(0, 4).map((l) => '<option value="' + l.id + '"' + (p.noiseTarget === l.id ? ' selected' : '') + '>' + esc(l.name) + '</option>').join('') + '</select></label>' +
      '<label class="tl-tog"><input type="checkbox" data-nz="alert"' + (p.noiseAlert ? ' checked' : '') + '><span><b>Sound an alert when it is too loud</b></span></label>' +
      '<p class="notice err tl-nz-err" hidden role="alert"></p>' +
      '<p class="fine tl-priv">' + icon('lock') + '<span>The microphone only measures how loud the room is, on this device. Nothing is recorded or sent.</span></p>') + '</div>';
  const root = $('.tl-noise', host);
  root._paint = () => paintOne(root, mode);
  views.add(root);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nz]');
    if (!b) return;
    if (b.dataset.nz === 'go') { if (N.on) stopNoise(); else startNoise(); }
    else if (b.dataset.nz === 'cal') calibrate();
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-nz="want"]')) { setPrefs({ noiseTarget: t.value }); N.over = 0; paintAll(); }
    else if (t.matches('[data-nz="alert"]')) setPrefs({ noiseAlert: t.checked });
  });
  paintOne(root, mode);
  return () => views.delete(root);
}
function paintOne(root, mode) {
  const lv = levelOf(N.level), t = target(), loud = N.on && Date.now() < N.loudUntil;
  const now = $('.tl-noise-now', root);
  now.textContent = N.on ? (loud ? 'Too loud' : lv.name) : N.starting ? 'Starting the microphone…' : 'Not listening';
  now.style.color = loud ? '#9E2F28' : '';
  const want = $('.tl-noise-want', root); if (want) want.textContent = 'Expected: ' + t.name;
  const pin = $('.tl-meter-pin', root); if (pin) pin.style.left = (N.on ? N.level : 0).toFixed(1) + '%';
  $('.tl-meter', root).setAttribute('aria-valuenow', String(Math.round(N.level)));
  $('.tl-meter', root).setAttribute('aria-valuetext', N.on ? lv.name : 'Not listening');
  $$('[data-lv]', root).forEach((s) => { s.classList.toggle('want', s.dataset.lv === t.id); s.classList.toggle('now', N.on && s.dataset.lv === lv.id); });
  const f = $('.tl-noise-face', root); if (f) { const key = (loud ? 'L' : '') + lv.id; if (f.dataset.k !== key) { f.innerHTML = face(N.level, loud); f.dataset.k = key; } }
  $('.tl-loud', root).hidden = !loud;
  root.classList.toggle('loud', loud);
  root.classList.toggle('on', N.on);
  const go = $('[data-nz="go"]', root);
  if (go) { go.innerHTML = N.on ? icon('stop') + '<span>Stop</span>' : icon('mic') + '<span>' + (N.starting ? 'Starting…' : 'Start listening') + '</span>'; go.disabled = N.starting; }
  const cal = $('[data-nz="cal"]', root); if (cal) cal.disabled = !N.on;
  const er = $('.tl-nz-err', root); if (er) { er.textContent = N.err; er.hidden = !N.err; }
}
function paintAll() { Array.from(views).forEach((v) => { if (!v.isConnected) { views.delete(v); return; } v._paint(); }); }
export function noiseBoard() { return boardOverlay('Noise meter', (stage) => { const c = noiseView(stage, 'board'); if (!N.on) startNoise(); return c; }, { cls: 'tl-b-noise' }); }
