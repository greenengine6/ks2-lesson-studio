/* The dashboard shelf on the home page: the lessons made on this device (lkie.like packs and Slide Studio lessons),
   each with its topic and a picture of the topic. "Keep on dashboard" pins a lesson to the front of the shelf.
   Covers: the lesson's own title picture, or the best Wikipedia picture for its topic. */
import { $, esc, icon, store, bus } from './core.js?v=ed35fd44';
import { who } from './people.js?v=ed35fd44';
import { coverFor, picURL, safePic, hydrate } from './pics.js?v=ed35fd44';

const PACKS = 'ks2-engine.lkie.packs.v1', DECKS = 'ks2-lesson-studio.recent.v1', PINS = 'ks2-engine.shelf.pins.v1';
export const OPEN_KEY = { lkie: 'ks2-engine.lkie.open', slides: 'ks2-engine.slides.open' };
const KINDS = { lkie: { name: 'lkie.like', icon: 'pack', c: 'heart', hash: '#/lkie' }, slides: { name: 'Slide Studio', icon: 'slides', c: 'violet', hash: '#/slides' } };
const SHOW = 8;

function pins() {
  const v = store.getJSON(PINS, []);
  return Array.isArray(v) ? v.filter((x) => x && KINDS[x.k] && typeof x.id === 'string') : [];
}
export const isPinned = (k, id) => pins().some((x) => x.k === k && x.id === id);
export function togglePin(k, id) {
  const list = pins(), on = list.some((x) => x.k === k && x.id === id);
  store.setJSON(PINS, on ? list.filter((x) => !(x.k === k && x.id === id)) : [{ k, id, at: Date.now() }].concat(list).slice(0, 24));
  bus.emit('shelf');
  return !on;
}
export function unpin(k, id) { if (isPinned(k, id)) togglePin(k, id); }
export function coverOfPack(p) {
  const sl = (p && p.slides) || [], s = sl.find((x) => x && x.layout === 'title' && safePic(x.pic)) || sl.find((x) => x && safePic(x.pic));
  return s ? s.pic : null;
}
function items() {
  const packs = store.getJSON(PACKS, []), decks = store.getJSON(DECKS, []), out = [];
  (Array.isArray(packs) ? packs : []).forEach((p) => {
    if (p && p.id && Array.isArray(p.slides) && p.input) out.push({ k: 'lkie', id: String(p.id), title: p.title || p.input.topic || 'Lesson', topic: p.input.topic || p.title || '', year: p.input.year || '', subject: p.input.subjectName || '', at: p.at || 0, n: p.slides.length, cover: coverOfPack(p) });
  });
  (Array.isArray(decks) ? decks : []).forEach((r) => {
    if (r && r.id && r.deck) out.push({ k: 'slides', id: String(r.id), title: r.deck.title || 'Lesson', topic: r.deck.title || '', year: r.deck.year || '', subject: r.deck.subject || '', at: r.at || 0, n: (r.deck.slides || []).length, cover: null });
  });
  const pl = pins(), rank = (it) => { const i = pl.findIndex((x) => x.k === it.k && x.id === it.id); return i < 0 ? Infinity : i; };
  out.forEach((it) => { it.pin = rank(it) !== Infinity; });
  return out.sort((a, b) => (rank(a) - rank(b)) || (b.at - a.at));
}
const day = (t) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
function cardHTML(it) {
  const K = KINDS[it.k], key = it.k + ':' + it.id, src = it.cover ? picURL(it.cover, '500') : '';
  const img = it.cover && it.cover.up && !src ? '<img data-up="' + esc(it.cover.up) + '" alt="" decoding="async">' : '<img' + (src ? ' src="' + esc(src) + '"' : '') + ' alt="" data-cover="' + esc(key) + '" decoding="async" loading="lazy">';
  return '<article class="sh-card' + (it.pin ? ' pinned' : '') + '" style="--c:var(--' + K.c + ')">' +
    '<button type="button" class="sh-open" data-sh-open="' + esc(key) + '" aria-label="Open ' + esc(it.title) + '">' +
    '<span class="sh-cover"><span class="sh-ph" aria-hidden="true">' + icon(K.icon) + '<b>' + esc(it.subject || K.name) + '</b></span>' + img + '</span>' +
    '<span class="sh-body"><span class="sh-kind">' + esc(K.name) + (it.year ? ' · ' + esc(it.year) : '') + (it.subject ? ' · ' + esc(it.subject) : '') + '</span><b class="sh-title">' + esc(it.title) + '</b>' +
    '<span class="sh-meta">' + it.n + ' slides' + (it.at ? ' · ' + day(it.at) : '') + '</span></span></button>' +
    '<button type="button" class="sh-pin" data-sh-pin="' + esc(key) + '" aria-pressed="' + it.pin + '" aria-label="' + (it.pin ? 'Kept on the dashboard. Tap to unpin ' : 'Keep on the dashboard: ') + esc(it.title) + '" title="' + (it.pin ? 'Kept on the dashboard' : 'Keep on the dashboard') + '">' + icon('pin') + '</button></article>';
}
export function renderShelf() {
  const sec = $('#shelf'), grid = $('#shelf-grid');
  if (!sec || !grid) return;
  const list = who.role ? items() : [];
  sec.hidden = !list.length;
  if (!list.length) { grid.innerHTML = ''; return; }
  const show = list.slice(0, SHOW), more = list.length - show.length;
  grid.innerHTML = show.map(cardHTML).join('');
  const m = $('#shelf-more');
  if (m) m.textContent = more > 0 ? more + ' more in lkie.like and Slide Studio.' : '';
  hydrate(grid);
  show.forEach((it) => {
    if (it.cover) return;
    coverFor(it.topic).then((c) => {
      const img = grid.querySelector('img[data-cover="' + CSS.escape(it.k + ':' + it.id) + '"]');
      const src = c ? picURL(c, '500') : '';
      if (img && src && !img.getAttribute('src')) img.src = src;
    });
  });
}
export function initShelf() {
  const sec = $('#shelf');
  if (!sec) return;
  sec.addEventListener('click', (e) => {
    const o = e.target.closest('[data-sh-open]'), p = e.target.closest('[data-sh-pin]');
    if (p) { const [k, ...rest] = p.dataset.shPin.split(':'); togglePin(k, rest.join(':')); return; }
    if (o) {
      const [k, ...rest] = o.dataset.shOpen.split(':');
      if (!KINDS[k]) return;
      try { sessionStorage.setItem(OPEN_KEY[k], rest.join(':')); } catch (er) { /* opens the latest instead */ }
      location.hash = KINDS[k].hash;
    }
  });
  bus.on('shelf', renderShelf);
  bus.on('who', renderShelf);
  window.addEventListener('storage', (e) => { if (!e.key || e.key === PACKS || e.key === DECKS || e.key === PINS) renderShelf(); });
  renderShelf();
}
/* For lkie.like and Slide Studio: the lesson the shelf asked to open (once). */
export function takeOpen(k) {
  try { const id = sessionStorage.getItem(OPEN_KEY[k]) || ''; sessionStorage.removeItem(OPEN_KEY[k]); return id; } catch (e) { return ''; }
}
