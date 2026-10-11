/* Feedback. Teachers: a short form about the site (stars, what they used, what worked, what to change). Pupils:
   the class feedback screen in Present mode, five big faces the teacher taps as answers come in ("type 1 to 5 in
   the chat"), plus "best bit". Both go to Rabinder's report by themselves (sync.js): teachers never download
   anything. download() is used by the admin dashboard only. */
import { $, $$, esc, el, icon, bus, toast, prefs } from './core.js?v=7c13e055';
import { track } from './track.js?v=7c13e055';
import { who } from './people.js?v=7c13e055';
import { ENGINES } from './engines/registry.js?v=7c13e055';
import { confetti } from './fx/particles.js?v=7c13e055';
import { sfx } from './fx/audio.js?v=7c13e055';
import { Live, onLive, setMoment, endMoment } from './live/session.js?v=7c13e055';

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
    '<section data-fp="done" hidden><h2><i>' + icon('heart') + '</i>Thank you!</h2><p class="fb-done-t"></p>' +
      '<div class="form"><button type="button" class="btn primary big wide" data-fbm-x>' + icon('check') + 'Done</button></div></section></div>';
  document.body.appendChild(fbm);
  const paintStars = () => { $$('[data-star]', fbm).forEach((b) => { const on = Number(b.dataset.star) <= rating; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(Number(b.dataset.star) === rating)); }); $('.star-say', fbm).textContent = rating ? ['', 'Not useful', 'A little useful', 'Useful', 'Very useful', 'Brilliant'][rating] : ''; };
  fbm.addEventListener('click', (e) => {
    if (e.target === fbm || e.target.closest('[data-fbm-x]')) { closeFeedback(); return; }
    const s = e.target.closest('[data-star]'); if (s) { rating = Number(s.dataset.star); paintStars(); return; }
    const p = e.target.closest('[data-used] .pill'); if (p) { p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); return; }
  });
  fbm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeFeedback(); } });
  $('#fbm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#fbm-form .notice');
    const good = $('#fb-good').value.trim(), better = $('#fb-better').value.trim(), pupils = $('#fb-pupils').value.trim();
    const used = $$('[data-used] .pill[aria-pressed="true"]', fbm).map((b) => b.dataset.v);
    if (!rating) { n.textContent = 'Tap a star rating first.'; n.hidden = false; return; }
    n.hidden = true;
    track('fb', { rating, used, good, better, pupils });
    sfx('success');
    $('.fb-done-t', fbm).textContent = who.role === 'admin' ? 'Your feedback is saved in your report.' : 'It goes to Rabinder by itself, locked so only she can read it. There is nothing to send or download.';
    $$('[data-fp]', fbm).forEach((s) => { s.hidden = s.dataset.fp !== 'done'; });
    setTimeout(() => { const b = $('[data-fp="done"] [data-fbm-x]', fbm); if (b) b.focus(); }, 60);
    toast(who.role === 'admin' ? 'Thank you. Your feedback is saved.' : 'Thank you. Your feedback will reach Rabinder by itself.');
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
/* ---------------- class feedback in Present mode ---------------- */
let tk = null;
export function openTicket(o) {
  closeTicket();
  const host = o.host || document.body;
  const st = { faces: [0, 0, 0, 0, 0], best: {}, log: [] };
  tk = el('div', 'ticket');
  tk.setAttribute('role', 'dialog'); tk.setAttribute('aria-label', 'Class feedback');
  const hint = Live.on ? 'Tap a face on your own device, or type a number from 1 to 5 in the chat' : prefs.mode === 'online' ? 'Type a number from 1 to 5 in the chat' : 'Show me 1 to 5 fingers';
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
  const addFace = (i) => { st.faces[i]++; st.log.push(['f', i]); sfx('pop', i); paint(); const b = $('.tk-face[data-face="' + i + '"]', tk); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } };
  tk.addEventListener('click', (e) => {
    const f = e.target.closest('[data-face]'); if (f) { addFace(Number(f.dataset.face)); return; }
    const c = e.target.closest('[data-best]'); if (c) { st.best[c.dataset.best] = (st.best[c.dataset.best] || 0) + 1; st.log.push(['b', c.dataset.best]); sfx('pop', 3); paint(); return; }
    if (e.target.closest('[data-tk-undo]')) { const l = st.log.pop(); if (l) { if (l[0] === 'f') st.faces[l[1]]--; else st.best[l[1]]--; } paint(); return; }
    if (e.target.closest('[data-tk-x]')) { closeTicket(); return; }
    if (e.target.closest('[data-tk-save]')) {
      const total = st.faces.reduce((a, b) => a + b, 0);
      if (!total) return;
      const best = {}; Object.entries(st.best).forEach(([k, v]) => { if (v > 0) best[k] = v; });
      track('ticket', { eng: o.eng, title: o.title, faces: st.faces.slice(), best, total });
      confetti(host, { count: 120, y: 0.45 });
      sfx('success');
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
  // In a live lesson, pupils tap a face on their own device and it counts here (a changed answer moves its count).
  if (Live.on) {
    tk.mo = setMoment({ kind: 'ticket', q: 'How did today’s lesson feel?' });
    tk.unsub = onLive((w) => {
      if (!tk || !w || w.ans !== tk.mo || typeof w.v !== 'number' || w.v > 4) return;
      if (typeof w.prev === 'number' && st.faces[w.prev] > 0) st.faces[w.prev] -= 1;
      st.faces[w.v] += 1; sfx('pop', w.v); paint();
      const b = $('.tk-face[data-face="' + w.v + '"]', tk); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
  }
  paint();
  setTimeout(() => { const b = $('.tk-face', tk); if (b) b.focus(); }, 50);
}
export function closeTicket() {
  if (!tk) return;
  document.removeEventListener('keydown', tk.keyHandler, true);
  if (tk.unsub) tk.unsub();
  if (tk.mo) endMoment(tk.mo);
  tk.remove(); tk = null;
}
export const ticketOpen = () => !!tk;

export function initFeedback() {
  bus.on('feedback', openFeedback);
  bus.on('ticket', openTicket);
  bus.on('present', (on) => { if (!on) closeTicket(); });
}
