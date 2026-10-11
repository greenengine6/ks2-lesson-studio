/* The Join screen in Present mode: a big QR code, the short web address and a 6-digit code, a link to paste in the
   Teams, Zoom or Meet chat, and who has joined (tap a name to remove it). The live lesson carries on when the
   screen closes; End live lesson stops it on every pupil's device. */
import { $, esc, icon, toast, copyOut } from '../core.js?v=b8e2dc0e';
import { sfx } from '../fx/audio.js?v=b8e2dc0e';
import { Live, startLive, endLive, setLock, kick, onLive, joinShort, pupilsIn } from './session.js?v=b8e2dc0e';
import { qrSVG } from './qr.js?v=b8e2dc0e';

let el = null, unsub = null, keyH = null, shownLink = '';
const spaced = (c) => String(c || '').replace(/^(\d{3})(\d{3})$/, '$1 $2');
const relayText = () => Live.tr === 's' ? 'Locked end to end · through the school’s own relay' : 'Locked end to end · through a public relay that only sees scrambled text';

function statusText() {
  if (Live.starting && !Live.on) return 'Getting the join code ready…';
  if (!Live.on) return 'Not live.';
  if (Live.err === 'busy' || Live.status === 'busy') return 'The relay is busy. Retrying by itself…';
  if (Live.err || Live.status === 'off') return 'Reconnecting… pupils can keep joining.';
  return '';
}
function paint() {
  if (!el) return;
  const on = Live.on, list = pupilsIn();
  if (on && shownLink !== Live.link) { $('.lp-qr', el).innerHTML = qrSVG(Live.link, 'QR code: scan to join the lesson'); shownLink = Live.link; }
  if (!on) { $('.lp-qr', el).innerHTML = '<div class="lp-wait">' + icon('clock') + '</div>'; shownLink = ''; }
  $('.lp-code', el).textContent = on ? spaced(Live.code) : '··· ···';
  $('.lp-code', el).classList.toggle('dim', !Live.codeOK && on);
  $('.lp-url', el).textContent = joinShort();
  const st = statusText();
  $('.lp-st', el).textContent = st; $('.lp-st', el).hidden = !st;
  $('.lp-n', el).textContent = list.length ? list.length + (list.length === 1 ? ' pupil has joined' : ' pupils have joined') : 'Waiting for pupils to join…';
  $('.lp-who', el).innerHTML = list.map((p) => '<li><button type="button" class="lp-chip" data-kick="' + esc(p.pid) + '" title="Remove ' + esc(p.name) + ' from this lesson"><span>' + esc(p.name) + '</span>' + icon('close') + '</button></li>').join('');
  const lockB = $('[data-lp="lock"]', el);
  lockB.setAttribute('aria-pressed', String(Live.locked));
  $('span', lockB).textContent = Live.locked ? 'Joining is locked' : 'Lock joining';
  lockB.disabled = !on; $('[data-lp="copy"]', el).disabled = !on; $('[data-lp="end"]', el).disabled = !on;
  $('.lp-relay', el).textContent = on ? relayText() : '';
}
export function openJoin(host, title) {
  closeJoin();
  el = document.createElement('div');
  el.className = 'livep';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Join the lesson');
  el.innerHTML = '<div class="lp-card">' +
    '<button type="button" class="pbtn lp-x" data-lp="close" aria-label="Close the join screen">' + icon('close') + '</button>' +
    '<div class="lp-qr" aria-live="polite"></div>' +
    '<div class="lp-side"><p class="lp-k"><i></i>Live lesson</p><h2>Join the lesson</h2>' +
    '<p class="lp-how">Scan the code with a tablet or phone camera. On a laptop, go to</p><p class="lp-url"></p><p class="lp-how">and enter the code</p><p class="lp-code" aria-label="Join code">··· ···</p>' +
    '<p class="lp-st" role="status" hidden></p>' +
    '<div class="lp-acts"><button type="button" class="btn" data-lp="copy">' + icon('link') + 'Copy link for the chat</button>' +
    '<button type="button" class="btn" data-lp="lock" aria-pressed="false">' + icon('lock') + '<span>Lock joining</span></button>' +
    '<button type="button" class="btn lp-end" data-lp="end">' + icon('stop') + 'End live lesson</button></div>' +
    '<p class="lp-n"></p><ul class="lp-who" aria-label="Pupils who have joined"></ul><p class="fine lp-relay"></p></div></div>';
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
  });
  keyH = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeJoin(); } };
  document.addEventListener('keydown', keyH, true);
  unsub = onLive(paint);
  paint();
  if (!Live.on) {
    sfx('send');
    startLive(title).then(() => { paint(); sfx('success'); }, () => { if (el) { $('.lp-st', el).textContent = 'The live lesson could not start. Check the internet connection and try again.'; $('.lp-st', el).hidden = false; } });
    paint();
  } else if (title) startLive(title);
  setTimeout(() => { const b = el && $('[data-lp="copy"]', el); if (b) b.focus(); }, 60);
}
export function closeJoin() {
  if (!el) return;
  if (unsub) unsub(); unsub = null;
  document.removeEventListener('keydown', keyH, true);
  el.remove(); el = null; shownLink = '';
}
export const joinOpen = () => !!el;
