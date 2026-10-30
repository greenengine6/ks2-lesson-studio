/* A tab left open keeps running the version of the site it loaded, so a teacher would not get a fix until she reloads
   (Rabinder's class view was still last night's version the next morning). Every 15 minutes, and when the tab comes
   back into view, this asks the site for its page, never from a cache, and compares the version stamp on app.js.
   When there is a newer one, a small bar offers Reload. It never reloads by itself: a presentation must not be cut,
   and a live class carries on after a reload anyway. */
import { icon } from './core.js?v=49509700';

const mine = () => { const s = document.querySelector('script[type=module][src*="app.js"]'); const m = s && /\?v=([0-9a-f]{8})/.exec(s.getAttribute('src') || ''); return m ? m[1] : ''; };
let shown = false, last = 0;
async function check() {
  if (shown || Date.now() - last < 60000 || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  last = Date.now();
  const v = mine();
  if (!v) return;
  try {
    const r = await fetch(new URL('index.html', location.href.split('#')[0]).href + '?u=' + Date.now(), { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) return;
    const m = /assets\/js\/app\.js\?v=([0-9a-f]{8})/.exec(await r.text());
    if (m && m[1] !== v) offer();
  } catch (e) { /* offline or blocked: ask again later */ }
}
function offer() {
  shown = true;
  const b = document.createElement('div');
  b.className = 'upd'; b.setAttribute('role', 'status');
  b.innerHTML = '<span class="upd-i">' + icon('spark') + '</span><span class="upd-t"><b>A new version of the site is ready.</b> Reload to get it. A live class carries on.</span>' +
    '<button type="button" class="btn small primary" data-upd="go">Reload</button><button type="button" class="btn small" data-upd="x">Later</button>';
  b.addEventListener('click', (e) => {
    const a = e.target.closest('[data-upd]');
    if (!a) return;
    if (a.dataset.upd === 'go') location.reload();
    else { b.remove(); shown = false; last = Date.now() + 45 * 60000; }     // asks again in an hour
  });
  document.body.appendChild(b);
}
export function initUpdate() {
  setTimeout(check, 30000);
  setInterval(check, 15 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
