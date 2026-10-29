/* What every game shares: building blocks, stacked fractions, the score bar, the clock, celebrations and the
   start and end panels. Imports nothing from the main site except fractions.js (the pupils' page uses it too). */
import { fractify } from '../fractions.js?v=73f756c9';

export const COLOURS = ['#FF5C8A', '#FFB443', '#2EC4B6', '#6C63FF', '#3A86FF', '#43AA8B', '#F3722C', '#9B5DE5', '#E84855', '#1FA2FF'];
export const TEAM_COLOURS = ['#F25F5C', '#3A86FF', '#2EC4B6', '#FFB443'];
export const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
/* Words on screen, with every 3/4 stacked (numerator over denominator), as the class writes them. */
export function txt(node, s) { node.textContent = s == null ? '' : String(s); fractify(node); return node; }
export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
export const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* ---------------- icons (drawn, never emoji) ---------------- */
const P = {
  heart: '<path d="M12 20.3C5.6 16.2 2.6 12.6 2.6 8.8c0-2.7 2.1-4.8 4.7-4.8 1.9 0 3.5 1 4.7 2.8C13.2 5 14.8 4 16.7 4c2.6 0 4.7 2.1 4.7 4.8 0 3.8-3 7.4-9.4 11.5z" fill="currentColor" stroke="none"/>',
  heartOff: '<path d="M12 20.3C5.6 16.2 2.6 12.6 2.6 8.8c0-2.7 2.1-4.8 4.7-4.8 1.9 0 3.5 1 4.7 2.8C13.2 5 14.8 4 16.7 4c2.6 0 4.7 2.1 4.7 4.8 0 3.8-3 7.4-9.4 11.5z" fill="none"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
  check: '<path d="M4.5 12.5l5 5 10-10.5"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>',
  again: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M9.5 17h5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'
};
export const icon = (n, cls) => '<svg class="kg-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';

/* ---------------- the score bar ---------------- */
export function makeHud(root, o) {
  o = o || {};
  const hud = el('div', 'kg-hud');
  hud.innerHTML = '<span class="kg-pill kg-rule"></span><span class="kg-sp"></span>' +
    '<span class="kg-pill kg-score"><b>0</b><span> points</span></span>' +
    '<span class="kg-pill kg-time" hidden>' + icon('clock') + '<b>0:00</b></span>' +
    '<span class="kg-pill kg-lives" hidden aria-label=""></span>' +
    '<span class="kg-pill kg-prog" hidden></span>';
  root.appendChild(hud);
  const q = (s) => hud.querySelector(s);
  if (o.rule) txt(q('.kg-rule'), o.rule); else q('.kg-rule').hidden = true;
  let lastScore = 0, livesMax = 0;
  return {
    el: hud,
    score(v) {
      const b = q('.kg-score b');
      b.textContent = String(v);
      if (v !== lastScore) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
      lastScore = v;
    },
    time(sec, low) { const t = q('.kg-time'); if (sec == null) { t.hidden = true; return; } t.hidden = false; q('.kg-time b').textContent = fmt(sec); t.classList.toggle('low', !!low); },
    lives(n, max) {
      const l = q('.kg-lives');
      if (n == null) { l.hidden = true; return; }
      livesMax = max || livesMax || n;
      l.hidden = false;
      l.innerHTML = Array.from({ length: livesMax }, (x, i) => icon(i < n ? 'heart' : 'heartOff', i < n ? 'on' : 'off')).join('');
      l.setAttribute('aria-label', n + (n === 1 ? ' life' : ' lives') + ' left');
    },
    progress(text) { const p = q('.kg-prog'); if (!text) { p.hidden = true; return; } p.hidden = false; txt(p, text); }
  };
}

/* ---------------- the clock: counts down from `seconds`, or up when seconds is 0 ---------------- */
export function makeClock(seconds, onTick, onEnd) {
  let used = 0, from = 0, id = 0, done = false, paused = false;
  const now = () => (paused ? used : used + (performance.now() - from) / 1000);
  const tick = () => {
    if (done) return;
    const t = now();
    if (seconds > 0 && t >= seconds) { done = true; clearInterval(id); onTick(0); onEnd(); return; }
    onTick(seconds > 0 ? seconds - t : t);
  };
  const vis = () => { if (document.visibilityState === 'hidden') c.pause(); else c.resume(); };
  const c = {
    start() { from = performance.now(); id = setInterval(tick, 200); tick(); document.addEventListener('visibilitychange', vis); return c; },
    pause() { if (paused || done) return; used = now(); paused = true; },
    resume() { if (!paused || done) return; paused = false; from = performance.now(); },
    stop() { done = true; clearInterval(id); document.removeEventListener('visibilitychange', vis); },
    get used() { return now(); },
    get left() { return seconds > 0 ? Math.max(0, seconds - now()) : 0; },
    get paused() { return paused; }
  };
  return c;
}

/* ---------------- little celebrations ---------------- */
export function floatText(host, x, y, text, good) {
  const f = el('span', 'kg-float' + (good ? ' good' : ' bad'));
  txt(f, text);
  f.style.left = x + 'px'; f.style.top = y + 'px';
  host.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}
export function burst(host, x, y, colour) {
  if (reduced()) return;
  const b = el('span', 'kg-burst');
  b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.setProperty('--c', colour || '#FFB443');
  for (let i = 0; i < 10; i++) { const s = el('i'); s.style.setProperty('--a', (i * 36) + 'deg'); b.appendChild(s); }
  host.appendChild(b);
  setTimeout(() => b.remove(), 700);
}
export function confetti(host) {
  if (reduced() || !host) return;
  const cv = el('canvas', 'kg-confetti');
  host.appendChild(cv);
  const r = host.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
  const g = cv.getContext('2d');
  if (!g) { cv.remove(); return; }
  const parts = Array.from({ length: 140 }, () => ({
    x: Math.random() * cv.width, y: -Math.random() * cv.height * 0.4, vx: (Math.random() - 0.5) * 3 * dpr, vy: (2 + Math.random() * 4) * dpr,
    s: (5 + Math.random() * 7) * dpr, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3, c: COLOURS[Math.floor(Math.random() * COLOURS.length)]
  }));
  const t0 = performance.now();
  const step = (t) => {
    const k = (t - t0) / 1000;
    g.clearRect(0, 0, cv.width, cv.height);
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.05 * dpr; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - Math.max(0, k - 2) / 0.8); g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); g.restore(); });
    if (k < 2.8 && cv.isConnected) requestAnimationFrame(step); else cv.remove();
  };
  requestAnimationFrame(step);
}
export function say(root, msg) { const l = root.querySelector('.kg-live'); if (l) { l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); } }
export function starsHTML(n) { return '<span class="kg-stars" role="img" aria-label="' + n + ' out of 3 stars">' + [0, 1, 2].map((i) => icon('star', i < n ? 'on' : 'off')).join('') + '</span>'; }
/* 3 stars for a great go, 2 for a good one, 1 for having a go. */
export function starsFor(part) { return part >= 0.85 ? 3 : part >= 0.55 ? 2 : 1; }

/* ---------------- the panels over the game ---------------- */
export function panel(root, html, cls) {
  const old = root.querySelector('.kg-panel');
  if (old) old.remove();
  const p = el('div', 'kg-panel' + (cls ? ' ' + cls : ''), '<div class="kg-card">' + html + '</div>');
  root.appendChild(p);
  return p;
}
export function closePanel(root) { const p = root.querySelector('.kg-panel'); if (p) p.remove(); }
