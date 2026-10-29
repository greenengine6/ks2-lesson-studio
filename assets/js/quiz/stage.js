/* A full-screen stage for the quiz games on the board (the team board game and practise): it covers the page, tries
   the browser's full screen, keeps the page from scrolling behind it, and gives the focus back when it closes. */
export function openStage(o) {
  o = o || {};
  const host = o.host || document.body;
  const el = document.createElement('div');
  el.className = 'qstage' + (o.cls ? ' ' + o.cls : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', o.label || 'Quiz');
  el.tabIndex = -1;
  host.appendChild(el);
  const last = document.activeElement, root = document.documentElement, was = root.style.overflow;
  root.style.overflow = 'hidden';
  let open = true;
  const full = () => { try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed here */ } };
  const toggleFull = () => { try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else full(); } catch (e) { /* ignore */ } };
  const close = () => {
    if (!open) return;
    open = false;
    try { if (document.fullscreenElement === el && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
    el.remove();
    root.style.overflow = was;
    if (o.onClose) { try { o.onClose(); } catch (e) { console.error(e); } }
    if (last && last.focus && last.isConnected) { try { last.focus(); } catch (e) { /* fine */ } }
  };
  if (o.full !== false) full();
  setTimeout(() => { if (open) el.focus({ preventScroll: true }); }, 30);
  return { el, close, full, toggleFull, get open() { return open; } };
}
export const isFull = (el) => !!document.fullscreenElement && document.fullscreenElement === el;
