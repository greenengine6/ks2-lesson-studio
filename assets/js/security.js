/* Site protection. These are deterrents: they stop casual copying in the browser. They block the right-click menu,
   selecting and copying page text, dragging images, printing, and the save, view-source and developer-tools
   shortcuts. The page blanks for a moment when a screenshot shortcut is pressed. While developer tools are open,
   the page pauses and hides itself. Typing, pasting, and the site's own Copy buttons keep working, and so does
   screen sharing on Teams, Zoom or Meet. No website can block phone screenshots, cameras, or someone reading the
   published code. */
import { guard } from './core.js?v=f99d8766';

const ALLOW = 'input, textarea, select, [contenteditable="true"], .allow-copy, .fb-text, .msg .mt';
const allowed = (n) => { const e = n && (n.nodeType === 1 ? n : n.parentElement); return !!(e && e.closest && e.closest(ALLOW)); };
const selectionAllowed = () => { try { const s = window.getSelection(); return !s || s.isCollapsed || allowed(s.anchorNode); } catch (e) { return false; } };

let shieldEl = null, shieldT = 0, devOpen = false;
function shieldNode() {
  if (shieldEl) return shieldEl;
  shieldEl = document.createElement('div');
  shieldEl.className = 'shield';
  shieldEl.setAttribute('aria-hidden', 'true');
  shieldEl.innerHTML = '<div><b>KS2 Lesson Engine</b><span></span></div>';
  document.body.appendChild(shieldEl);
  return shieldEl;
}
function shield(ms, msg) {
  const s = shieldNode();
  s.querySelector('span').textContent = msg || 'Screenshots and copying are turned off on this site.';
  s.classList.add('on');
  clearTimeout(shieldT);
  if (ms) shieldT = setTimeout(() => { if (!devOpen) s.classList.remove('on'); }, ms);
}
function unshield() { if (shieldEl && !devOpen) shieldEl.classList.remove('on'); }
const block = (e) => { e.preventDefault(); e.stopPropagation(); return false; };

/* framing by another site */
try { if (window.top !== window.self) { document.documentElement.style.display = 'none'; window.top.location = window.self.location.href; } } catch (e) { document.documentElement.style.display = 'none'; }

document.addEventListener('contextmenu', (e) => { if (!allowed(e.target)) block(e); }, true);
document.addEventListener('dragstart', (e) => { if (!allowed(e.target)) block(e); }, true);
document.addEventListener('selectstart', (e) => { if (!allowed(e.target)) e.preventDefault(); }, true);
['copy', 'cut'].forEach((t) => document.addEventListener(t, (e) => {
  if (guard.copying) return;
  if (allowed(document.activeElement) || selectionAllowed()) return;
  e.preventDefault();
}, true));

document.addEventListener('keydown', (e) => {
  const k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'f12') return block(e);
  if (mod && e.shiftKey && ['i', 'j', 'c', 'k', 'm'].includes(k)) return block(e);         // developer tools
  if (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) return block(e);          // developer tools and source on a Mac
  if (mod && !e.shiftKey && !e.altKey && ['u', 's', 'p'].includes(k)) return block(e);    // view source, save, print
  if (mod && k === 'a' && !allowed(e.target)) return block(e);                             // select all
  if (mod && (k === 'c' || k === 'x') && !allowed(e.target) && !selectionAllowed()) return block(e);
  if (k === 'printscreen') shield(1400);
  if ((k === 'shift' && e.metaKey) || (k === 'meta' && e.shiftKey) || (k === 'os' && e.shiftKey)) shield(1400);   // Cmd+Shift+3/4/5 on a Mac, Win+Shift+S on Windows
}, true);
document.addEventListener('keyup', (e) => {
  if ((e.key || '').toLowerCase() !== 'printscreen') return;
  shield(1400);
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('').catch(() => {}); } catch (er) { /* not allowed */ }
}, true);
window.addEventListener('beforeprint', () => shield(0, 'Printing is turned off on this site.'));
window.addEventListener('afterprint', () => unshield());

/* Developer tools: this line only pauses while they are open, so the pause itself is the signal. */
function trap() {
  const t = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const open = performance.now() - t > 120;
  if (open && !devOpen) { devOpen = true; shield(0, 'Developer tools are not allowed on this site. Close them to carry on.'); }
  else if (!open && devOpen) { devOpen = false; unshield(); }
}
setInterval(trap, 1500);
