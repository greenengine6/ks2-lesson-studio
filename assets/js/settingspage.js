/* Settings: every switch in one place (Rabinder's point 4), and Reading support (points 3 and 11). #/settings/reading
   opens at Reading support. Also: our class's first names, a backup of everything made on this device, and Connect. */
import { $, $$, esc, icon, toast, bus } from './core.js?v=73f756c9';
import { who, isAdmin } from './people.js?v=73f756c9';
import { paintSwitches } from './settings.js?v=73f756c9';
import { FONTS, SIZES, BACKS, getReading, setReading, loadFonts, fontStack } from './reading.js?v=73f756c9';
import { pupils, setPupils, namesIn } from './pupils.js?v=73f756c9';
import { makeBackup, restoreBackup, download } from './backup.js?v=73f756c9';

const LIGHT = '<div class="lc-light"><div class="lc-slit"></div><div class="lc-lumen"><i class="lc-min"></i><i class="lc-mid"></i><i class="lc-hi"></i></div><div class="lc-dark"><i class="lc-sl"></i><i class="lc-ll"></i><i class="lc-slt"></i><i class="lc-srt"></i></div></div>';
const CARDS = [
  ['amber', 'night', 'Night mode', 'Dark, calm screens for evening planning. Class screens stay bright for pupils.', 'M20.6 14.7A8.7 8.7 0 0 1 9.3 3.4a8.7 8.7 0 1 0 11.3 11.3zM17.2 2.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8zM21 8.2l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z'],
  ['rose', 'voice', 'Symphony’s voice', 'She reads her answers aloud, in English or Malay.', 'M9.6 17.9a3 3 0 1 1-1.6-2.65V5.4l11-2.3v12.2a3 3 0 1 1-1.6-2.65V7.1L9.6 8.6z'],
  ['violet', 'pointer', 'Magic pointer', 'Glowing ribbons follow your mouse when you present.', 'M4.6 2.8l14.2 6.9-6.3 2-2.7 6.5zM18.4 14.6l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z'],
  ['teal', 'online', 'Teaching online', 'Prompts say “type in the chat”. Off: classroom wording.', 'M2.5 4.5h19v12.2h-19zM9 19h6v1.8H9zM12 7.4a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM8.4 15.4c.5-1.9 1.9-2.9 3.6-2.9s3.1 1 3.6 2.9z']
];
const ROWS = [['sound', 'Sound effects', 'Little sounds as you work. Class-tool alarms have their own volume.'], ['wake', 'Hey Symphony', 'She listens for her name, and ignores everything else.'], ['patient', 'Patient listening', 'She waits for a longer pause before answering.']];
let view = null;

function readingHTML() {
  const r = getReading();
  const sw = (on, k, label) => '<div class="lsw-row st-row"><span>' + label + '</span><button type="button" class="lsw violet" role="switch" aria-checked="' + on + '" data-rd="' + k + '" aria-label="' + esc(label.replace(/<[^>]+>/g, '')) + '"><span class="lsw-handle"></span></button></div>';
  return '<section class="pg-card st-sec" id="st-reading" aria-labelledby="st-r-h"><h2 id="st-r-h">' + icon('type') + 'Reading support</h2>' +
    '<p class="pg-sub">For everyone, and for readers with dyslexia. No one font suits every dyslexic reader, so try them: the British Dyslexia Association’s style guide asks for bigger text, more space and a cream or pastel background.</p>' +
    '<div class="st-read"><div class="st-ctl">' +
    '<div class="st-group"><p class="st-l">Font</p><div class="st-fonts" role="group" aria-label="Font">' + FONTS.map((f) => '<button type="button" class="st-font" data-font="' + f.id + '" aria-pressed="' + (r.font === f.id) + '" style="font-family:' + esc(fontStack(f.id).body) + '"><b>' + esc(f.name) + '</b><small>' + esc(f.note) + '</small></button>').join('') + '</div></div>' +
    '<div class="st-group"><p class="st-l">Text size</p><div class="seg" role="group" aria-label="Text size">' + SIZES.map((s) => '<button type="button" data-size="' + s.v + '" aria-pressed="' + (r.size === s.v) + '">' + s.name + '</button>').join('') + '</div></div>' +
    '<div class="st-group"><p class="st-l">Spacing</p><div class="seg" role="group" aria-label="Spacing"><button type="button" data-spacing="normal" aria-pressed="' + (r.spacing === 'normal') + '">Normal</button><button type="button" data-spacing="wide" aria-pressed="' + (r.spacing === 'wide') + '">Wide</button></div></div>' +
    '<div class="st-group"><p class="st-l">Background</p><div class="st-backs" role="group" aria-label="Background">' + BACKS.map((b) => '<button type="button" class="st-back" data-bg="' + b.id + '" aria-pressed="' + (r.bg === b.id) + '"><i style="background:' + b.hex + '"></i>' + esc(b.name) + '</button>').join('') + '</div></div>' +
    sw(r.ruler, 'ruler', 'Reading ruler<small>A soft band follows your pointer or finger, to keep your place.</small>') +
    sw(r.tapread, 'tapread', 'Tap to hear it<small>Tap any paragraph and Symphony reads it aloud.</small>') +
    sw(r.slides, 'slides', 'Slides and class screens too<small>Pupils see the same font on the board.</small>') +
    '</div><div class="st-prev" aria-label="Preview"><p class="st-l">Preview</p><div class="st-pcard"><b>Equivalent fractions</b><p>Two fractions can look different and still be the same amount. 1/2 is the same as 2/4 and 4/8.</p><p class="st-ps">Which one is not equal to 1/2? 3/6, 5/10 or 2/5?</p></div></div></div>' +
    '<p class="fine">Pupils have the same choices on their own device in a live class.</p></section>';
}
function switchesHTML() {
  return '<section class="pg-card st-sec" aria-labelledby="st-s-h"><h2 id="st-s-h">' + icon('gear') + 'Sound, Symphony and screens</h2>' +
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="lc-grad" x1="0" x2="0" y1="-1" y2="0.8"><stop offset="0%" stop-color="#bbb"/><stop offset="100%" stop-color="#555"/></linearGradient>' +
    '<filter id="lc-inner"><feFlood flood-color="#fff2"/><feComposite operator="out" in2="SourceGraphic"/><feMorphology operator="dilate" radius="0.2"/><feGaussianBlur stdDeviation="0.75"/><feComposite operator="atop" in2="SourceGraphic"/></filter></defs></svg>' +
    '<div class="st-room tone-dark"><div class="lgrid">' + CARDS.map(([tone, k, h, p, d]) => '<div class="lcell"><div class="lcard" data-tone="' + tone + '">' + LIGHT +
      '<div class="lc-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="url(#lc-grad)" filter="url(#lc-inner)" d="' + d + '"/></svg></div>' +
      '<div class="lc-bottom"><h4>' + esc(h) + '</h4><p>' + esc(p) + '</p><button type="button" class="lsw ' + tone + '" role="switch" aria-checked="false" data-switch="' + k + '" aria-label="' + esc(h) + '"><span class="lsw-handle"></span></button></div></div></div>').join('') + '</div></div>' +
    ROWS.map(([k, h, p]) => '<div class="lsw-row st-row"><span>' + esc(h) + '<small>' + esc(p) + '</small></span><button type="button" class="lsw teal" role="switch" aria-checked="false" data-switch="' + k + '" aria-label="' + esc(h) + '"><span class="lsw-handle"></span></button></div>').join('') +
    '<p class="fine">Her voice and how fast she speaks: open Symphony and tap the voice button next to Voice.</p></section>';
}
function classHTML() {
  const list = pupils();
  return '<section class="pg-card st-sec" id="st-class" aria-labelledby="st-c-h"><h2 id="st-c-h">' + icon('users') + 'Our class</h2>' +
    '<p class="pg-sub">First names for Pick a name and Groups, and for Symphony. Kept on this device only, never sent anywhere, and not in backups.</p>' +
    '<label class="fld"><span>One first name on each line</span><textarea data-st="names" rows="6" placeholder="Aisyah&#10;Wei Jie&#10;Priya">' + esc(list.join('\n')) + '</textarea></label>' +
    '<div class="pg-row"><button type="button" class="btn primary" data-st="savenames">' + icon('check') + 'Save names</button><span class="fine" data-st="ncount">' + list.length + (list.length === 1 ? ' name' : ' names') + '</span></div></section>';
}
function workHTML() {
  return '<section class="pg-card st-sec" id="st-work" aria-labelledby="st-w-h"><h2 id="st-w-h">' + icon('download') + 'Your work on this device</h2>' +
    '<p class="pg-sub">Everything you make lives in this browser. Download a backup now and then, and before you change device. Restoring adds what is in the file; it never deletes anything.</p>' +
    '<div class="pg-row"><button type="button" class="btn primary" data-st="backup">' + icon('download') + 'Download a backup</button>' +
    '<label class="btn st-file">' + icon('upload') + 'Restore from a backup<input type="file" accept="application/json,.json" data-st="restore" class="sr"></label></div>' +
    '<p class="fine" data-st="space"></p><p class="fine">Never in the file: keys, PINs, sign-in details or pupils’ names.</p></section>';
}
function deviceHTML() {
  return '<section class="pg-card st-sec" aria-labelledby="st-d-h"><h2 id="st-d-h">' + icon('key') + 'This device</h2>' +
    '<p class="pg-sub">Signed in as <b>' + esc(who.name || '') + '</b>' + (isAdmin() ? ' (admin)' : '') + '.</p>' +
    '<div class="pg-row">' + (isAdmin() ? '<button type="button" class="btn" data-connect>' + icon('key') + 'Connect and voice keys</button><a class="btn" href="#/admin">' + icon('layers') + 'Dashboard</a>' : '') +
    '<button type="button" class="btn" data-how="">' + icon('info') + 'How it works</button><button type="button" class="btn" data-signout>' + icon('close') + 'Sign out</button></div></section>';
}
function render(sub) {
  view.innerHTML = '<div class="pg st"><header class="pg-head"><p class="kicker">Settings</p><h1>Make it work your way</h1><p class="pg-sub">Choices are kept for you on this device.</p></header>' +
    '<nav class="st-jump" aria-label="Sections"><a href="#st-reading" data-jump>Reading support</a><a href="#st-class" data-jump>Our class</a><a href="#st-work" data-jump>Backup</a></nav>' +
    readingHTML() + switchesHTML() + classHTML() + workHTML() + deviceHTML() + '</div>';
  paintSwitches();
  space();
  if (sub === 'reading' || sub === 'class' || sub === 'work') requestAnimationFrame(() => { const s = $('#st-' + sub, view); if (s) s.scrollIntoView({ block: 'start' }); });
}
async function space() {
  const p = $('[data-st="space"]', view);
  if (!p || !navigator.storage || !navigator.storage.estimate) return;
  try { const e = await navigator.storage.estimate(); if (e && e.usage != null) p.textContent = 'This browser is keeping about ' + Math.max(0.1, e.usage / 1048576).toFixed(1) + ' MB for the site.'; } catch (er) { /* fine */ }
}
function paintReading() {
  const r = getReading();
  $$('button[data-font]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.font === r.font)));
  $$('button[data-size]', view).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === r.size)));
  $$('button[data-spacing]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.spacing === r.spacing)));
  $$('.st-back', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === r.bg)));
  $$('[data-rd]', view).forEach((b) => b.setAttribute('aria-checked', String(!!r[b.dataset.rd])));
}
function wire() {
  view.addEventListener('click', async (e) => {
    const t = e.target;
    const j = t.closest('[data-jump]'); if (j) { e.preventDefault(); const s = $(j.getAttribute('href'), view); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const f = t.closest('button[data-font]'); if (f) { setReading({ font: f.dataset.font }); paintReading(); return; }
    const sz = t.closest('button[data-size]'); if (sz) { setReading({ size: Number(sz.dataset.size) }); paintReading(); return; }
    const sp = t.closest('button[data-spacing]'); if (sp) { setReading({ spacing: sp.dataset.spacing }); paintReading(); return; }
    const bgb = t.closest('.st-back'); if (bgb) { setReading({ bg: bgb.dataset.bg }); paintReading(); return; }
    const rd = t.closest('[data-rd]'); if (rd) { const k = rd.dataset.rd; setReading({ [k]: !getReading()[k] }); paintReading(); toast(k === 'ruler' ? (getReading().ruler ? 'Reading ruler on. Move your pointer over the page.' : 'Reading ruler off.') : k === 'tapread' ? (getReading().tapread ? 'Tap any paragraph to hear it.' : 'Tap to hear it is off.') : getReading().slides ? 'Slides and class screens use your font too.' : 'Slides keep their own font.'); return; }
    if (t.closest('[data-st="savenames"]')) {
      const list = namesIn($('[data-st="names"]', view).value);
      setPupils(list);
      $('[data-st="names"]', view).value = list.join('\n');
      $('[data-st="ncount"]', view).textContent = list.length + (list.length === 1 ? ' name' : ' names');
      toast(list.length ? 'Saved ' + list.length + (list.length === 1 ? ' name.' : ' names.') : 'The class list is empty.');
      return;
    }
    if (t.closest('[data-st="backup"]')) {
      const b = t.closest('[data-st="backup"]'); b.disabled = true;
      try { const out = await makeBackup(); download(out.blob, out.name); toast('Backup downloaded: ' + out.name); }
      catch (er) { toast('The backup could not be made. Try again.'); }
      finally { b.disabled = false; }
    }
  });
  view.addEventListener('change', async (e) => {
    if (e.target.dataset.st !== 'restore') return;
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { const r = await restoreBackup(file); toast(r.added ? 'Restored. ' + r.added + (r.added === 1 ? ' part was' : ' parts were') + ' added.' + (r.failed ? ' Some did not fit on this device.' : '') : 'Everything in that backup is already here.'); space(); }
    catch (er) { toast('That file is not a KS2 Lesson Engine backup.'); }
  });
}
export function mount(v, sub) {
  view = v;
  if (!view.dataset.wired) { wire(); view.dataset.wired = '1'; }
  loadFonts();
  render(sub);
}
export function leave() { /* nothing running */ }
bus.on('reading', () => { if (view && !view.hidden && view.isConnected) paintReading(); });
