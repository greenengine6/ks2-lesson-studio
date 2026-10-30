/* The iPhone zoom after signing in (Vik had to pinch out to make the page fit). On an iPhone or iPad, when the field
   that has the keyboard disappears (the sign-in form closes on a correct PIN), Safari can leave the page zoomed in
   and scrolled sideways. Two fixes:
   - On iPhones and iPads only, the page asks Safari not to zoom by itself (maximum-scale=1). Safari still lets
     people pinch to zoom on purpose, so nothing is lost for anyone who needs bigger text. Android keeps the normal
     setting, because there it would block pinch zoom.
   - settleViewport() closes the keyboard properly before a form goes away, then puts the page back at its natural
     size and position. */
const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
const meta = () => document.querySelector('meta[name="viewport"]');
const base = () => (meta() ? meta().getAttribute('content') || '' : '').replace(/,\s*(?:maximum|minimum)-scale=[^,]*/g, '');

function noAutoZoom() {
  const m = meta();
  if (!isIOS || !m) return;
  const c = base();
  if (!/maximum-scale/.test(m.getAttribute('content') || '')) m.setAttribute('content', c + ', maximum-scale=1');
}
noAutoZoom();

/* Call before a form with a focused field goes away (and again after, if you like): no zoom or sideways scroll left. */
let back = 0;
export function settleViewport() {
  const a = document.activeElement;
  if (a && a !== document.body && typeof a.blur === 'function' && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) a.blur();
  if (!isIOS) return;
  const m = meta();
  if (m) {
    const c = base();
    // a moment at exactly 1:1 makes Safari drop any zoom it kept, then the normal setting comes back
    m.setAttribute('content', c + ', minimum-scale=1, maximum-scale=1');
    clearTimeout(back);
    back = setTimeout(() => { m.setAttribute('content', c + ', maximum-scale=1'); }, 350);
  }
  setTimeout(() => { if (window.scrollX) window.scrollTo(0, window.scrollY); }, 60);
}
