/* Small drawn pictures for the Wonder Window's lists and cards, in place of emoji: each scene of the Seven Wonders,
   the Wonders of Malaysia and the festivals drawn small by its own engine (cached), for the strip under a scene and for
   a card while (or instead of) its photo loads. fillThumbs() puts them into the page; drawn icons for everything else
   come from art.js. */
import { view, layer } from './util.js?v=49509700';
import { makeWonders } from './wonders.js?v=49509700';
import { makeFestival } from './festive.js?v=49509700';
import './malaysia.js?v=49509700';

const MAKE = { wonders: makeWonders, festival: makeFestival };
const cache = new Map();
/* A picture of one scene (kind: 'wonders' for the Seven Wonders and Malaysia, 'festival'), w × h CSS pixels. */
export function sceneShot(kind, id, w, h, o) {
  o = o || {};
  const dpr = Math.min(2, window.devicePixelRatio || 1), key = kind + ':' + id + ':' + w + 'x' + h + ':' + (o.phase || '') + ':' + dpr;
  if (cache.has(key)) return cache.get(key);
  const c = layer(w * dpr, h * dpr), save = { top: view.top, small: view.small, dpr: view.dpr };
  try {
    view.small = true; view.dpr = dpr; view.top = 0;
    const S = MAKE[kind]();
    S.soundOn = false; S.thumb = true;
    S.set(id); S.init(w, h);
    if (o.phase != null && S.f && S.f.phases) { const i = S.f.phases.indexOf(o.phase); if (i > 0) { S.ph = i; S.bg = null; } }
    S.shade = layer(1, 1); S.shadeKey = w + 'x' + h;                       // no dark shade for words: a thumbnail has none
    for (let i = 0; i < 4; i++) S.step(0.35, 3 + i * 0.35);
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    S.draw(g, w, h, 4.6);
  } catch (e) { /* a blank picture rather than a broken list */ }
  finally { Object.assign(view, save); }
  cache.set(key, c);
  if (cache.size > 90) cache.delete(cache.keys().next().value);
  return c;
}
/* A copy of a cached picture, sized for the page (a canvas can only be in one place at a time). */
export function copyOf(src, w, h) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.style.width = w + 'px'; c.style.height = h + 'px';
  c.getContext('2d').drawImage(src, 0, 0); c.setAttribute('aria-hidden', 'true');
  return c;
}
/* Fill every [data-th="kind:id"] in root with its scene's picture, one per frame so the page never stutters. */
export function fillThumbs(root, w, h) {
  if (!root) return;
  const todo = Array.from(root.querySelectorAll('[data-th]:not([data-th-done])'));
  const next = () => {
    const el = todo.shift(); if (!el) return;
    if (el.isConnected) {
      const [kind, id] = el.dataset.th.split(':'), W = Number(el.dataset.thW) || w || 64, H = Number(el.dataset.thH) || h || 42;
      const shot = sceneShot(kind, id, W * 2, H * 2);
      el.textContent = ''; el.appendChild(copyOf(shot, W, H)); el.dataset.thDone = '1';
    }
    (window.requestAnimationFrame || setTimeout)(next);
  };
  next();
}
