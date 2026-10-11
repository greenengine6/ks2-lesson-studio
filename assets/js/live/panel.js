/* The Join screen in Present mode: a big QR code, the short web address and a 6-digit code, a link to paste in the
   Teams, Zoom or Meet chat, and who has joined (tap a name to remove it). It also says how the line to pupils'
   devices is (sent, sending, reconnecting, a relay that is full), with a Reconnect button, and has the switch for
   slide questions going to pupils' devices by themselves. The live lesson carries on when the screen closes; End
   live lesson stops it on every pupil's device.
   The header's Live button (wireLiveChip) shows a live lesson that is still running when Present mode is closed,
   or one running on another screen, so it can always be found and ended. */
import { $, esc, icon, toast, copyOut, bus } from '../core.js?v=1e9e4bc0';
import { sfx } from '../fx/audio.js?v=1e9e4bc0';
import { Live, startLive, endLive, setLock, kick, onLive, joinShort, pupilsIn, setAuto, reconnect } from './session.js?v=1e9e4bc0';
import { blocker, endElsewhere } from '../activity.js?v=1e9e4bc0';
import { qrSVG } from './qr.js?v=1e9e4bc0';

let el = null, unsub = null, keyH = null, shownLink = '', host = null, title = '', offSince = 0;
const spaced = (c) => String(c || '').replace(/^(\d{3})(\d{3})$/, '$1 $2');
const at = (t) => (t ? new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '');
export const relayText = () => Live.tr === 's' ? 'Locked end to end · through the school’s own relay'
  : 'Locked end to end · through the free public relay (up to about 30 devices on one Wi-Fi, about 250 messages a day for each network)';

/* How the line to pupils' devices is, in plain words ('' when all is well). */
function statusText() {
  if (Live.starting && !Live.on) return 'Getting the join code ready…';
  if (!Live.on) return Live.blocked ? '' : 'Not live.';
  if (Live.send === 'full' || Live.err === 'full') return 'The free public relay has used up today’s messages for this network, so pupils’ devices are not getting new slides. It starts again tomorrow; the school relay has no daily limit (see How it works).';
  if (Live.status === 'subs') return 'Too many devices on this Wi-Fi for the free public relay (about 30 at most). The school relay has no such limit (see How it works).';
  if (Live.err === 'busy' || Live.status === 'busy') return 'The relay asked us to slow down for a moment. Trying again by itself…';
  if (Live.err || Live.status === 'off') return 'Reconnecting… pupils can keep joining.';
  if (Live.send === 'sending') return 'Sending to pupils’ devices…';
  return '';
}
function paint() {
  if (!el) return;
  const on = Live.on, list = pupilsIn(), blocked = !on && !Live.starting && Live.blocked;
  el.classList.toggle('blocked', !!blocked);
  if (on && shownLink !== Live.link) { $('.lp-qr', el).innerHTML = qrSVG(Live.link, 'QR code: scan to join the lesson'); shownLink = Live.link; }
  if (!on) { $('.lp-qr', el).innerHTML = '<div class="lp-wait">' + icon(blocked ? 'qr' : 'clock') + '</div>'; shownLink = ''; }
  $('.lp-code', el).textContent = on ? spaced(Live.code) : '··· ···';
  $('.lp-code', el).classList.toggle('dim', !Live.codeOK && on);
  $('.lp-url', el).textContent = joinShort();
  const st = statusText();
  $('.lp-st', el).textContent = st; $('.lp-st', el).hidden = !st;
  const off = on && (Live.status === 'off' || !!Live.err);
  if (off && !offSince) offSince = Date.now(); else if (!off) offSince = 0;
  $('[data-lp="retry"]', el).hidden = !off;
  const b = $('.lp-busy', el);
  b.hidden = !blocked;
  if (blocked) {
    const o = Live.blocked;
    $('.lp-busy p', el).innerHTML = '<b>Your live lesson is already running ' + (o.where === 'tab' ? 'in another tab' : 'on another screen') + '.</b> ' +
      esc((o.label ? '“' + o.label + '”' : 'It') + (o.at ? ', started at ' + at(o.at) : '') + '.') + ' One live lesson at a time.';
  }
  $('.lp-n', el).textContent = list.length ? list.length + (list.length === 1 ? ' pupil has joined' : ' pupils have joined') : 'Waiting for pupils to join…';
  $('.lp-who', el).innerHTML = list.map((p) => '<li><button type="button" class="lp-chip" data-kick="' + esc(p.pid) + '" title="Remove ' + esc(p.name) + ' from this lesson"><span>' + esc(p.name) + '</span>' + icon('close') + '</button></li>').join('');
  const lockB = $('[data-lp="lock"]', el);
  lockB.setAttribute('aria-pressed', String(Live.locked));
  $('span', lockB).textContent = Live.locked ? 'Joining is locked' : 'Lock joining';
  lockB.disabled = !on; $('[data-lp="copy"]', el).disabled = !on; $('[data-lp="end"]', el).disabled = !on;
  $('[data-lp="auto"]', el).setAttribute('aria-checked', String(Live.auto));
  $('.lp-relay', el).textContent = on ? relayText() : '';
}
function begin(o) {
  sfx('send');
  startLive(title, o).then(() => { paint(); sfx('success'); }, (e) => {
    if (e && e.code === 'elsewhere') { paint(); return; }
    if (el) { $('.lp-st', el).textContent = 'The live lesson could not start. Check the internet connection and try again.'; $('.lp-st', el).hidden = false; }
  });
  paint();
}
export function openJoin(where, t) {
  closeJoin();
  host = where || document.body; title = t || '';
  el = document.createElement('div');
  el.className = 'livep' + (host === document.body ? ' fixed' : '');
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Join the lesson');
  el.innerHTML = '<div class="lp-card">' +
    '<button type="button" class="pbtn lp-x" data-lp="close" aria-label="Close the join screen">' + icon('close') + '</button>' +
    '<div class="lp-qr" aria-live="polite"></div>' +
    '<div class="lp-side"><p class="lp-k"><i></i>Live lesson</p><h2>Join the lesson</h2>' +
    '<div class="lp-busy" hidden><p></p><div class="lp-acts"><button type="button" class="btn primary" data-lp="take">' + icon('refresh') + 'End it there and start here</button></div></div>' +
    '<div class="lp-join"><p class="lp-how">Scan the code with a tablet or phone camera. On a laptop, go to</p><p class="lp-url"></p><p class="lp-how">and enter the code</p><p class="lp-code" aria-label="Join code">··· ···</p></div>' +
    '<p class="lp-st" role="status" hidden></p>' +
    '<div class="lp-acts"><button type="button" class="btn" data-lp="copy">' + icon('link') + 'Copy link for the chat</button>' +
    '<button type="button" class="btn" data-lp="lock" aria-pressed="false">' + icon('lock') + '<span>Lock joining</span></button>' +
    '<button type="button" class="btn" data-lp="retry" hidden>' + icon('refresh') + 'Reconnect</button>' +
    '<button type="button" class="btn lp-end" data-lp="end">' + icon('stop') + 'End live lesson</button></div>' +
    '<label class="lp-auto"><button type="button" class="lsw teal" role="switch" aria-checked="true" data-lp="auto" aria-label="Slide questions go to pupils’ devices by themselves"><span class="lsw-handle"></span></button>' +
    '<span><b>Questions go to pupils’ devices by themselves</b><small>When a slide with a question is on the board. Off: only when you tap the slide’s pill.</small></span></label>' +
    '<p class="lp-n"></p><ul class="lp-who" aria-label="Pupils who have joined"></ul><p class="fine lp-relay"></p><p class="fine lp-help"><button type="button" class="linkbtn" data-how="live">How live lessons work</button></p></div></div>';
  host.appendChild(el);
  el.addEventListener('click', (e) => {
    const k = e.target.closest('[data-kick]');
    if (k) { const p = Live.pupils.get(k.dataset.kick); kick(k.dataset.kick); if (p) toast(p.name + ' has been removed from this lesson.'); return; }
    const b = e.target.closest('[data-lp]');
    if (!b) return;
    const a = b.dataset.lp;
    if (a === 'close') closeJoin();
    else if (a === 'copy') copyOut('<a href="' + esc(Live.link) + '">Join the lesson</a> (code ' + esc(spaced(Live.code)) + ')', 'Join the lesson: ' + Live.link, 'Link copied. Paste it into the class chat.');
    else if (a === 'lock') { setLock(!Live.locked); toast(Live.locked ? 'Joining is locked. Nobody new can join.' : 'Joining is open again.'); }
    else if (a === 'end') { endLive(); toast('The live lesson has ended on every pupil’s device.'); closeJoin(); }
    else if (a === 'retry') { reconnect(); toast('Reconnecting to pupils’ devices…'); }
    else if (a === 'take') { Live.blocked = null; begin({ takeOver: true }); toast('The live lesson on the other screen is ending. It is starting here.'); }
    else if (a === 'auto') { setAuto(!Live.auto); paint(); toast(Live.auto ? 'Each slide’s question now goes to pupils’ devices by itself.' : 'Questions go to pupils’ devices only when you tap the slide’s pill.'); }
  });
  keyH = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeJoin(); } };
  document.addEventListener('keydown', keyH, true);
  unsub = onLive(paint);
  paint();
  if (!Live.on) begin();
  else if (title) startLive(title);
  setTimeout(() => { const b = el && $(Live.blocked && !Live.on ? '[data-lp="take"]' : '[data-lp="copy"]', el); if (b) b.focus(); }, 60);
}
export function closeJoin() {
  if (!el) return;
  if (unsub) unsub(); unsub = null;
  document.removeEventListener('keydown', keyH, true);
  el.remove(); el = null; shownLink = '';
  if (!Live.on) Live.blocked = null;
}
export const joinOpen = () => !!el;

/* ---------------- the header's Live button ---------------- */
let chip = null, pop = null;
function paintChip() {
  if (!chip) return;
  const other = !Live.on && blocker('live');
  chip.hidden = !Live.on && !other;
  if (Live.on) {
    const n = pupilsIn().length;
    chip.dataset.k = 'here';
    chip.innerHTML = '<i aria-hidden="true"></i><span>Live · ' + n + '</span>';
    chip.setAttribute('aria-label', 'Your live lesson is running, ' + n + ' joined. Show the join code or end it');
  } else if (other) {
    chip.dataset.k = 'other';
    chip.innerHTML = '<i aria-hidden="true"></i><span>Live elsewhere</span>';
    chip.setAttribute('aria-label', 'Your live lesson is running on another screen');
  }
  if (chip.hidden && pop) closePop();
}
function closePop() { if (pop) { pop.remove(); pop = null; } }
function openElsewhere() {
  closePop();
  const o = blocker('live');
  if (!o) return;
  pop = document.createElement('div');
  pop.className = 'livep fixed lp-mini';
  pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Live lesson on another screen');
  pop.innerHTML = '<div class="lp-card"><button type="button" class="pbtn lp-x" data-x aria-label="Close">' + icon('close') + '</button><div class="lp-side">' +
    '<p class="lp-k"><i></i>Live lesson</p><h2>Running on another screen</h2><p class="lp-how">' + esc((o.label ? '“' + o.label + '”' : 'Your live lesson') + (o.at ? ', started at ' + at(o.at) : '') + '. While it runs, the Make buttons wait (one thing at a time).') + '</p>' +
    '<div class="lp-acts"><button type="button" class="btn lp-end" data-end>' + icon('stop') + 'End it there</button><button type="button" class="btn" data-x>Keep it running</button></div></div></div>';
  document.body.appendChild(pop);
  pop.addEventListener('click', async (e) => {
    if (e.target.closest('[data-x]') || e.target === pop) { closePop(); return; }
    if (e.target.closest('[data-end]')) {
      closePop();
      await endElsewhere('live');
      toast('Asked the other screen to end the live lesson. It ends within half a minute.');
    }
  });
  setTimeout(() => { const b = pop && $('[data-end]', pop); if (b) b.focus(); }, 60);
}
export function wireLiveChip() {
  const bar = $('.top-r');
  if (!bar || chip) return;
  chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'act-chip'; chip.hidden = true;
  bar.insertBefore(chip, bar.firstChild);
  chip.addEventListener('click', () => { if (Live.on) openJoin(document.body, Live.title); else openElsewhere(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { e.preventDefault(); closePop(); } }, true);
  onLive(paintChip); bus.on('activity', paintChip); bus.on('who', paintChip);
  paintChip();
}
