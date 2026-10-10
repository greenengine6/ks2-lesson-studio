/* Feedback. Teachers: a short form about the site (stars, what they used, what worked, what to change), saved for
   Rabinder's report, with a downloadable copy. Pupils: the class feedback screen in Present mode, five big faces
   the teacher taps as answers come in ("type 1 to 5 in the chat"), plus "best bit". And "Send my activity to
   Rabinder": a locked file that only her dashboard can open. */
import { $, $$, esc, el, icon, bus, toast, prefs } from './core.js';
import { track, eventsFor, device } from './track.js';
import { who, ADMIN } from './people.js';
import { seal, importAdminPublic, cryptoOK } from './crypto.js';
import { ENGINES } from './engines/registry.js';
import { confetti } from './fx/particles.js';
import { fmtDate, fmtTime } from './report.js';

export const FACE_NAMES = ['Lost', 'Tricky', 'OK', 'Good', 'Loved it'];
export const FACE_COLOURS = ['#E5484D', '#F2804A', '#F2B84B', '#7CC24F', '#2BB673'];
const MOUTHS = ['M8 17.2c2-2.6 6-2.6 8 0', 'M8.4 16.4c2.1-1.3 5.1-1.3 7.2 0', 'M8.4 15.6h7.2', 'M8.4 14.4c2.1 1.8 5.1 1.8 7.2 0', 'M7.8 13.6c2.2 3.3 6.2 3.3 8.4 0'];
export function faceSVG(i) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="' + FACE_COLOURS[i] + '"/><circle cx="8.9" cy="10" r="1.35" fill="#fff"/><circle cx="15.1" cy="10" r="1.35" fill="#fff"/>' +
    '<path d="' + MOUTHS[i] + '" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
}
export function download(name, text, type) {
  const blob = text instanceof Blob ? text : new Blob([text], { type: type || 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const safeName = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- teacher feedback about the site ---------------- */
let fbm = null, rating = 0;
function feedbackModal() {
  if (fbm) return fbm;
  const tools = ['Slide Studio'].concat(ENGINES.map((e) => e.name), ['Wonder Window', 'Symphony']);
  fbm = el('div', 'modal');
  fbm.id = 'fbm'; fbm.hidden = true;
  fbm.setAttribute('role', 'dialog'); fbm.setAttribute('aria-modal', 'true'); fbm.setAttribute('aria-labelledby', 'fbm-h');
  fbm.innerHTML = '<div class="modal-card fbm-card" style="position:relative">' +
    '<button type="button" class="btn small icon modal-x" data-fbm-x aria-label="Close">' + icon('close') + '</button>' +
    '<section data-fp="form"><h2 id="fbm-h"><i>' + icon('star') + '</i>Your feedback</h2><p>Two minutes helps Rabinder make the engine better for everyone.</p>' +
    '<form class="form" id="fbm-form" novalidate>' +
      '<div class="fld"><span class="lbl">How useful is the engine for your teaching?</span><div class="stars" role="radiogroup" aria-label="Rating out of 5">' +
        [1, 2, 3, 4, 5].map((n) => '<button type="button" role="radio" aria-checked="false" data-star="' + n + '" aria-label="' + n + ' out of 5">' + icon('star') + '</button>').join('') + '<span class="star-say"></span></div></div>' +
      '<div class="fld"><span class="lbl">What did you use? <span class="opt">(tap all that apply)</span></span><div class="pills" data-used>' + tools.map((t) => '<button type="button" class="pill" aria-pressed="false" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
      '<label class="fld"><span>What worked well?</span><textarea id="fb-good" rows="3" maxlength="1200" placeholder="For example: the escape room kept everyone typing in the chat"></textarea></label>' +
      '<label class="fld"><span>What should we change?</span><textarea id="fb-better" rows="3" maxlength="1200" placeholder="For example: Year 3 needed simpler words"></textarea></label>' +
      '<label class="fld"><span>How did your pupils respond? <span class="opt">(optional)</span></span><textarea id="fb-pupils" rows="2" maxlength="800" placeholder="No names, please"></textarea></label>' +
      '<button class="btn primary big wide" type="submit">' + icon('check') + 'Submit</button><p class="notice err" hidden role="alert"></p></form></section>' +
    '<section data-fp="done" hidden><h2><i>' + icon('heart') + '</i>Thank you!</h2><p>Your feedback is saved for Rabinder’s report.</p>' +
      '<div class="form"><button type="button" class="btn primary big wide" data-who-teacher-only data-fb-send>' + icon('download') + 'Send my activity to Rabinder</button>' +
      '<button type="button" class="btn big wide" data-fb-copy>' + icon('download') + 'Download a copy</button>' +
      '<p class="fine" data-who-teacher-only>The activity file is locked: only Rabinder’s dashboard can open it. Send it to her on WhatsApp, Teams or email.</p></div></section></div>';
  document.body.appendChild(fbm);
  const paintStars = () => { $$('[data-star]', fbm).forEach((b) => { const on = Number(b.dataset.star) <= rating; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(Number(b.dataset.star) === rating)); }); $('.star-say', fbm).textContent = rating ? ['', 'Not useful', 'A little useful', 'Useful', 'Very useful', 'Brilliant'][rating] : ''; };
  fbm.addEventListener('click', (e) => {
    if (e.target === fbm || e.target.closest('[data-fbm-x]')) { closeFeedback(); return; }
    const s = e.target.closest('[data-star]'); if (s) { rating = Number(s.dataset.star); paintStars(); return; }
    const p = e.target.closest('[data-used] .pill'); if (p) { p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); return; }
    if (e.target.closest('[data-fb-send]')) { sendToRabinder(); return; }
    if (e.target.closest('[data-fb-copy]')) { downloadFeedback(fbm.last); }
  });
  fbm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeFeedback(); } });
  $('#fbm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#fbm-form .notice');
    const good = $('#fb-good').value.trim(), better = $('#fb-better').value.trim(), pupils = $('#fb-pupils').value.trim();
    const used = $$('[data-used] .pill[aria-pressed="true"]', fbm).map((b) => b.dataset.v);
    if (!rating) { n.textContent = 'Tap a star rating first.'; n.hidden = false; return; }
    n.hidden = true;
    const ev = track('fb', { rating, used, good, better, pupils });
    fbm.last = ev || { at: Date.now(), tn: who.name, rating, used, good, better, pupils };
    $$('[data-fp]', fbm).forEach((s) => { s.hidden = s.dataset.fp !== 'done'; });
    $$('[data-who-teacher-only]', fbm).forEach((x) => { x.hidden = who.role !== 'teacher'; });
    toast('Thank you. Your feedback is saved.');
  });
  fbm.paintStars = paintStars;
  return fbm;
}
export function openFeedback() {
  const m = feedbackModal();
  rating = 0; m.paintStars();
  $('#fbm-form').reset();
  $$('[data-used] .pill', m).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  $$('[data-fp]', m).forEach((s) => { s.hidden = s.dataset.fp !== 'form'; });
  m.hidden = false;
  setTimeout(() => { const b = $('[data-star="4"]', m); if (b) b.focus(); }, 60);
}
function closeFeedback() { if (fbm) fbm.hidden = true; }
function downloadFeedback(f) {
  if (!f) return;
  const row = (h, v) => v ? '<h3>' + esc(h) + '</h3><p>' + esc(v) + '</p>' : '';
  const html = '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My feedback · KS2 Lesson Engine</title><style>' +
    'body{margin:0;background:#EEF1F7;font:15px/1.6 "Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:#1F2733}.c{max-width:680px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -26px rgba(30,40,70,.5)}' +
    '.h{padding:26px 28px;color:#fff;background:linear-gradient(130deg,#4F46E5,#6C63FF 45%,#2C9C96)}.h small{letter-spacing:.14em;text-transform:uppercase;font-weight:700;opacity:.85}.h h1{margin:6px 0 2px;font-size:26px}.b{padding:22px 28px 28px}' +
    '.st{font-size:26px;letter-spacing:4px;color:#F59E0B}.st span{color:#CBD5E1}h3{margin:18px 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#64748B}p{margin:0}.chips span{display:inline-block;margin:4px 6px 0 0;padding:3px 10px;border-radius:99px;background:#EEF1F7;font-size:13px}</style></head><body><div class="c">' +
    '<div class="h"><small>KS2 Lesson Engine · Feedback</small><h1>' + esc(f.tn || who.name || 'My feedback') + '</h1><p>' + esc(fmtDate(f.at) + ' at ' + fmtTime(f.at)) + '</p></div><div class="b">' +
    '<div class="st">' + '★'.repeat(f.rating || 0) + '<span>' + '★'.repeat(5 - (f.rating || 0)) + '</span></div>' +
    (f.used && f.used.length ? '<h3>Used</h3><div class="chips">' + f.used.map((u) => '<span>' + esc(u) + '</span>').join('') + '</div>' : '') +
    row('What worked well', f.good) + row('What should change', f.better) + row('How pupils responded', f.pupils) + '</div></div></body></html>';
  download('KS2 feedback - ' + safeName(f.tn || who.name) + ' - ' + today() + '.html', html);
  toast('Your copy is downloaded.');
}

/* ---------------- send my activity to Rabinder (a locked file) ---------------- */
export async function sendToRabinder() {
  if (who.role !== 'teacher') { toast('Only teachers send activity files. Your own activity is already on your dashboard.'); return; }
  if (!ADMIN || !ADMIN.pub || !cryptoOK) { toast('Sending needs the secure (https) site address.'); return; }
  try {
    const events = await eventsFor(who.id, Date.now() - 180 * 864e5);
    const payload = { v: 1, kind: 'ks2-activity', from: { id: who.id, n: who.name }, dev: device, at: Date.now(), events };
    const box = await seal(await importAdminPublic(ADMIN.pub), JSON.stringify(payload));
    box.from = who.name; box.at = Date.now(); box.count = events.length;
    download('KS2 activity - ' + safeName(who.name) + ' - ' + today() + '.ks2', JSON.stringify(box), 'application/octet-stream');
    track('sub', { n: events.length });
    toast('Your activity file is ready. Send it to Rabinder on WhatsApp, Teams or email.');
  } catch (e) { toast('The file could not be made. Please try again.'); }
}

/* ---------------- class feedback in Present mode ---------------- */
let tk = null;
export function openTicket(o) {
  closeTicket();
  const host = o.host || document.body;
  const st = { faces: [0, 0, 0, 0, 0], best: {}, log: [] };
  tk = el('div', 'ticket');
  tk.setAttribute('role', 'dialog'); tk.setAttribute('aria-label', 'Class feedback');
  const hint = prefs.mode === 'online' ? 'Type a number from 1 to 5 in the chat' : 'Show me 1 to 5 fingers';
  const screens = (o.screens || []).filter(Boolean).slice(0, 8);
  tk.innerHTML = '<div class="tk-card"><div class="tk-top"><p class="tk-k">' + icon('smile') + 'Class feedback</p><button type="button" class="pbtn" data-tk-x aria-label="Close class feedback">' + icon('close') + '</button></div>' +
    '<h2>How did today’s lesson feel?</h2><p class="tk-say">' + icon('chat') + '<span>' + esc(hint) + '. 5 means you loved it.</span></p>' +
    '<div class="tk-faces">' + [4, 3, 2, 1, 0].map((i) => '<button type="button" class="tk-face" data-face="' + i + '" style="--f:' + FACE_COLOURS[i] + '"><span class="tk-svg">' + faceSVG(i) + '</span><b>' + FACE_NAMES[i] + '</b><small>' + (i + 1) + '</small><em class="tk-n">0</em></button>').join('') + '</div>' +
    (screens.length ? '<div class="tk-best"><p>Best bit?</p><div>' + screens.map((s) => '<button type="button" class="tk-chip" data-best="' + esc(s) + '"><span>' + esc(s) + '</span><em>0</em></button>').join('') + '</div></div>' : '') +
    '<div class="tk-foot"><span class="tk-total">No answers yet. Tap a face for each answer, or press 1 to 5.</span><button type="button" class="pbtn" data-tk-undo disabled>' + icon('refresh') + '<span>Undo</span></button>' +
    '<button type="button" class="btn primary" data-tk-save disabled>' + icon('check') + 'Save to report</button></div></div>';
  host.appendChild(tk);
  const paint = () => {
    $$('.tk-face', tk).forEach((b) => { $('.tk-n', b).textContent = st.faces[Number(b.dataset.face)]; });
    $$('.tk-chip', tk).forEach((b) => { $('em', b).textContent = st.best[b.dataset.best] || 0; });
    const n = st.faces.reduce((a, b) => a + b, 0);
    $('.tk-total', tk).textContent = n ? n + (n === 1 ? ' answer' : ' answers') : 'No answers yet. Tap a face for each answer, or press 1 to 5.';
    $('[data-tk-undo]', tk).disabled = !st.log.length;
    $('[data-tk-save]', tk).disabled = !n;
  };
  const addFace = (i) => { st.faces[i]++; st.log.push(['f', i]); paint(); const b = $('.tk-face[data-face="' + i + '"]', tk); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } };
  tk.addEventListener('click', (e) => {
    const f = e.target.closest('[data-face]'); if (f) { addFace(Number(f.dataset.face)); return; }
    const c = e.target.closest('[data-best]'); if (c) { st.best[c.dataset.best] = (st.best[c.dataset.best] || 0) + 1; st.log.push(['b', c.dataset.best]); paint(); return; }
    if (e.target.closest('[data-tk-undo]')) { const l = st.log.pop(); if (l) { if (l[0] === 'f') st.faces[l[1]]--; else st.best[l[1]]--; } paint(); return; }
    if (e.target.closest('[data-tk-x]')) { closeTicket(); return; }
    if (e.target.closest('[data-tk-save]')) {
      const total = st.faces.reduce((a, b) => a + b, 0);
      if (!total) return;
      const best = {}; Object.entries(st.best).forEach(([k, v]) => { if (v > 0) best[k] = v; });
      track('ticket', { eng: o.eng, title: o.title, faces: st.faces.slice(), best, total });
      confetti(host, { count: 120, y: 0.45 });
      toast('Saved. Thank you, everyone!');
      closeTicket();
      if (o.onSaved) o.onSaved();
    }
  });
  tk.keyHandler = (e) => {
    if (!tk) return;
    if (/^[1-5]$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); addFace(Number(e.key) - 1); }
    else if (e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); $('[data-tk-undo]', tk).click(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeTicket(); }
  };
  document.addEventListener('keydown', tk.keyHandler, true);
  paint();
  setTimeout(() => { const b = $('.tk-face', tk); if (b) b.focus(); }, 50);
}
export function closeTicket() {
  if (!tk) return;
  document.removeEventListener('keydown', tk.keyHandler, true);
  tk.remove(); tk = null;
}
export const ticketOpen = () => !!tk;

export function initFeedback() {
  bus.on('feedback', openFeedback);
  bus.on('submit', sendToRabinder);
  bus.on('ticket', openTicket);
  bus.on('present', (on) => { if (!on) closeTicket(); });
}
