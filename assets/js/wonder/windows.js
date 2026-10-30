/* Wonder Window's windows. Each one is a live scene on the big canvas plus what sits on top of it: cards with real
   photos, the World Explorer postcard, the seasons and weather controls, the speed race. Every window has a caption
   that Symphony reads (facts, then "wonder questions"), a quiz the class can answer together or vote on from their
   own devices, and a "For teachers" panel listing where the facts and photos come from.
   play.js is the frame around them: the picker, the top bar, the caption, sound and full screen. */
import { $, $$, esc, icon } from '../core.js?v=cdc164df';
import { haptic } from '../fx/haptics.js?v=cdc164df';
import { sfx } from '../fx/audio.js?v=cdc164df';
import { Voice } from '../fx/voice.js?v=cdc164df';
import { leadPicture, creditFor, picURL, creditText } from '../pics.js?v=cdc164df';
import { openMoment } from '../moments.js?v=cdc164df';
import * as D from './data.js?v=cdc164df';
import { NATURE, Pad } from './nature.js?v=cdc164df';
import { explorer, distanceKm, flightHours } from './map.js?v=cdc164df';
import { makeStage, switcher } from './stage.js?v=cdc164df';
import { makeFestival, FEST_SCENES } from './festive.js?v=cdc164df';
import { makeWonders, WONDER_SCENES } from './wonders.js?v=cdc164df';
import { swapCreatures } from './fauna.js?v=cdc164df';
export { swapCreatures };
import { makeScale, makeRace } from './scale.js?v=cdc164df';
import { Music, Fx } from './music.js?v=cdc164df';
import { makeBiome } from './biomes.js?v=cdc164df';
import { weather, feelsLike } from './weather.js?v=cdc164df';
import { seasons, PLACES, MONTHS, dateOf, dayOfYear, seasonOf, daylight } from './seasons.js?v=cdc164df';
import { flag, hm } from './util.js?v=cdc164df';

export { Pad };
const T = (x, ms) => (x == null ? '' : typeof x === 'string' ? x : ms && x.bm ? x.bm : x.text);
/* Caption items: a fact, then a wonder question, and so on. */
function items(facts, wonders, ms) {
  const out = [], k = ms ? ['Tahukah anda?', 'Soalan untuk difikirkan'] : ['Did you know?', 'Wonder question'];
  (facts || []).forEach((f, i) => { out.push({ kind: k[0], text: T(f, ms), lang: ms ? 'ms' : 'en-GB' }); if (wonders && wonders[i]) out.push({ kind: k[1], text: T(wonders[i], ms), lang: ms ? 'ms' : 'en-GB' }); });
  (wonders || []).slice((facts || []).length).forEach((w) => out.push({ kind: k[1], text: T(w, ms), lang: ms ? 'ms' : 'en-GB' }));
  return out;
}

/* ---------------- photos from Wikipedia, with who took them ---------------- */
let seen = new Map();                     // the photos shown in this window, for the teachers' credits
function photoInto(el, wiki, size, credit) {
  if (!el || !wiki) return Promise.resolve(null);
  return leadPicture(wiki).then((p) => {
    if (!p || !el.isConnected) return null;
    seen.set(p.file, p);
    let im = el.querySelector('img');
    if (!im) { im = document.createElement('img'); im.alt = ''; el.prepend(im); }
    im.decoding = 'async';
    im.onload = () => el.classList.add('ph-on');
    im.onerror = () => el.classList.remove('ph-on');
    im.alt = p.alt || wiki;
    im.src = picURL(p, size || 500);
    if (credit) creditFor(p).then(() => {
      const c = el.querySelector('.ph-cr');
      if (c && el.isConnected) { c.innerHTML = 'Photo: ' + esc(creditText(p, true)) + (p.url ? ' · <a href="' + esc(p.url) + '" target="_blank" rel="noopener">source</a>' : ''); c.hidden = false; }
    }).catch(() => {});
    return p;
  }).catch(() => null);
}
/* ---------------- a big card: photo, facts, read aloud, previous and next ---------------- */
function openCard(shell, c) {
  const ms = c.lang === 'ms';
  const rows = (c.rows || []).filter((r) => r && r[1]).map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('');
  const el = shell.overlay('<article class="wo-card wd" data-ctx>' +
    '<button type="button" class="pbtn wo-x" data-wo-x aria-label="' + (ms ? 'Tutup' : 'Close') + '">' + icon('close') + '</button>' +
    '<figure class="wd-ph"' + (c.wiki ? ' data-wiki="' + esc(c.wiki) + '"' : '') + '><span class="wd-e cre" aria-hidden="true" data-name="' + esc(c.title || '') + '">' + esc(c.e || '✨') + '</span><figcaption class="ph-cr" hidden></figcaption></figure>' +
    '<div class="wd-b"><small class="wd-k">' + esc(c.sub || '') + '</small><h2>' + esc(c.title) + '</h2>' + (rows ? '<dl class="wd-rows">' + rows + '</dl>' : '') +
    (c.text ? '<p class="wd-t">' + esc(c.text) + '</p>' : '') +
    '<div class="wd-btns"><button type="button" class="btn small" data-wd-say>' + icon('volume') + (ms ? 'Baca' : 'Read aloud') + '</button>' + (c.extra || '') +
    (c.nav ? '<span class="wd-nav"><button type="button" class="pbtn" data-wd-nav="-1" aria-label="' + (ms ? 'Sebelumnya' : 'Previous') + '">' + icon('left') + '</button><button type="button" class="pbtn" data-wd-nav="1" aria-label="' + (ms ? 'Seterusnya' : 'Next') + '">' + icon('right') + '</button></span>' : '') +
    '</div></div></article>', c.title);
  if (c.wiki) photoInto($('.wd-ph', el), c.wiki, 960, true);
  swapCreatures(el);
  el.addEventListener('click', (e) => {
    const n = e.target.closest('[data-wd-nav]'), h = e.target.closest('[data-hear]');
    if (e.target.closest('[data-wd-say]')) shell.say(c.title + '. ' + (c.text || ''), ms ? 'ms' : 'en-GB');
    else if (h) shell.say(h.dataset.say, h.dataset.lang || 'en-GB');
    else if (n && c.nav) c.nav(Number(n.dataset.wdNav));
  });
  if (c.nav) el.onArrow = (d) => c.nav(d);
  return el;
}

/* ---------------- the quiz: tap an answer, or let the class vote on their devices ---------------- */
function openQuiz(shell, key, ms, name) {
  const list = (D.QUIZ[key] || []).map((x) => (ms && x.bm ? { q: x.bm.q, opts: x.bm.opts, a: x.a } : x));
  if (!list.length) return;
  const L = ms ? { k: 'Kuiz', q: (i, n) => 'Soalan ' + i + ' daripada ' + n, read: 'Baca', vote: 'Undi kelas', next: 'Seterusnya', again: 'Main lagi', right: 'Betul!', wrong: 'Belum tepat. Jawapannya: ', end: (s, n) => 'Anda dapat ' + s + ' daripada ' + n + '!' }
    : { k: 'Quiz', q: (i, n) => 'Question ' + i + ' of ' + n, read: 'Read aloud', vote: 'Class vote', next: 'Next', again: 'Play again', right: 'That’s right!', wrong: 'Not quite. The answer is: ', end: (s, n) => 'You got ' + s + ' out of ' + n + '!' };
  let i = 0, score = 0, done = false, answered = false;
  const el = shell.overlay('<section class="wo-card wq" data-ctx><header class="wq-top"><span class="wq-k">' + icon('star') + esc(L.k + ' · ' + name) + '</span><span class="wq-n"></span>' +
    '<button type="button" class="pbtn wo-x" data-wo-x aria-label="Close">' + icon('close') + '</button></header><h2 class="wq-q"></h2><div class="wq-opts"></div><p class="wq-msg" aria-live="polite"></p>' +
    '<footer class="wq-foot"><button type="button" class="btn small" data-q-say>' + icon('volume') + esc(L.read) + '</button><button type="button" class="btn small" data-q-vote>' + icon('vote') + esc(L.vote) + '</button>' +
    '<span class="wd-sp"></span><button type="button" class="btn primary small" data-q-next hidden><span></span>' + icon('right') + '</button></footer></section>', L.k);
  const paint = () => {
    const x = list[i], nx = $('[data-q-next]', el);
    $('.wq-n', el).textContent = done ? '' : L.q(i + 1, list.length);
    $('[data-q-vote]', el).hidden = done;
    if (done) {
      $('.wq-q', el).textContent = L.end(score, list.length);
      $('.wq-opts', el).innerHTML = '<p class="wq-stars" aria-hidden="true">' + '⭐'.repeat(score) + '</p>';
      $('.wq-msg', el).textContent = '';
      nx.hidden = false; $('span', nx).textContent = L.again;
      if (score === list.length) sfx('success');
      return;
    }
    $('.wq-q', el).textContent = x.q;
    $('.wq-opts', el).innerHTML = x.opts.map((o, k) => '<button type="button" class="wq-o" data-q-opt="' + k + '"><b>' + 'ABCD'[k] + '</b><span>' + esc(o) + '</span></button>').join('');
    $('.wq-msg', el).textContent = '';
    nx.hidden = true; $('span', nx).textContent = L.next;
    answered = false;
  };
  el.addEventListener('click', (e) => {
    const o = e.target.closest('[data-q-opt]');
    if (o && !answered && !done) {
      answered = true;
      const k = Number(o.dataset.qOpt), x = list[i], ok = k === x.a;
      if (ok) score += 1;
      $$('.wq-o', el).forEach((b, j) => { b.disabled = true; b.classList.toggle('right', j === x.a); b.classList.toggle('wrong', j === k && !ok); });
      $('.wq-msg', el).textContent = ok ? L.right : L.wrong + x.opts[x.a];
      sfx(ok ? 'success' : 'error');
      const nx = $('[data-q-next]', el); nx.hidden = false; nx.focus();
      return;
    }
    if (e.target.closest('[data-q-next]')) { if (done) { i = 0; score = 0; done = false; } else if (i + 1 >= list.length) done = true; else i += 1; paint(); return; }
    if (e.target.closest('[data-q-say]')) { const x = list[i]; shell.say(done ? $('.wq-q', el).textContent : x.q + ' ' + x.opts.map((p, k) => 'ABCD'[k] + ': ' + p).join('. ') + '.', ms ? 'ms' : 'en-GB'); return; }
    if (e.target.closest('[data-q-vote]') && !done) { const x = list[i]; openMoment({ kind: 'vote', q: x.q, opts: x.opts, answer: x.a }); }
  });
  paint();
}

/* ---------------- for teachers: where the facts and photos come from ---------------- */
function openSources(shell, key, name) {
  const list = D.SOURCES[key] || [], ph = Array.from(seen.values());
  const el = shell.overlay('<section class="wo-card wsrc" data-ctx><button type="button" class="pbtn wo-x" data-wo-x aria-label="Close">' + icon('close') + '</button>' +
    '<small class="wd-k">For teachers</small><h2>' + esc(name) + ': where the facts come from</h2><ul class="wsrc-l">' + list.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<p class="fine">Facts are written for Key Stage 2 and rounded the way a child would say them. “About” means the experts’ figures differ a little. Photos come from Wikipedia and Wikimedia Commons; each one says who took it.</p>' +
    (ph.length ? '<h3>Photos in this window</h3><ul class="wsrc-ph"></ul>' : '') + '</section>', 'For teachers');
  const ul = $('.wsrc-ph', el);
  if (ul) ph.forEach((p) => {
    const li = document.createElement('li'); li.textContent = (p.page || p.alt) + ': Wikimedia Commons'; ul.appendChild(li);
    creditFor(p).then(() => { if (li.isConnected) li.innerHTML = esc(p.page || p.alt) + ': ' + esc(creditText(p, true)) + (p.url ? ' · <a href="' + esc(p.url) + '" target="_blank" rel="noopener">source</a>' : ''); }).catch(() => {});
  });
}

/* ================= the windows ================= */
function natureWin(shell, id) {
  const sc = NATURE[id];
  return {
    scene: sc, sound: sc.sound || '', pad: !!sc.pad, quiz: 'skies', sources: 'skies',
    caption: () => items(sc.facts, sc.wonders),
    onScene(r) { if (r && r.fact) shell.show({ kind: r.title || 'Did you know?', text: r.fact, lang: 'en-GB' }, true); }
  };
}

function biomeWin(shell, key) {
  const B = D.BIOMES[key], sc = makeBiome(key), bm = key === 'rainforest';
  return {
    scene: sc, sound: B.sound, bm, quiz: bm ? 'rainforest' : 'biome', sources: 'biome',
    caption: (ms) => items(B.facts, B.wonders, ms),
    setLang(l) { sc.setLang(l); },
    onScene(r) { if (r && r.card) openCard(shell, r.card); }
  };
}

/* ---------- the photo stage's words and buttons (Seven Wonders, Wonders of Malaysia, record breakers) ---------- */
/* A big name and a few lines over the photo, Find out more, Read aloud, previous and next, and a strip of every item
   to jump to. On a wide screen the strip stands on the right; on a phone it is a row above the caption. */
function stageUI(shell, o) {
  let el = null, i = -1;
  const ui = {
    mount(list) {
      el = document.createElement('div');
      el.className = 'sg';
      el.innerHTML = '<section class="sg-info" data-ctx aria-live="polite"><small class="sg-k"></small><h2 class="sg-n"></h2><p class="sg-t"></p>' +
        '<div class="sg-btns">' + (o.more !== false ? '<button type="button" class="btn small primary" data-sg-more>' + icon('info') + '<span>' + esc(o.moreText || 'Find out more') + '</span></button>' : '') +
        '<button type="button" class="btn small" data-sg-say>' + icon('volume') + '<span>' + esc(o.sayText || 'Read aloud') + '</span></button>' + (o.extra || '') +
        '<span class="sg-nav"><button type="button" class="pbtn" data-sg-nav="-1" aria-label="Previous">' + icon('left') + '</button><button type="button" class="pbtn" data-sg-nav="1" aria-label="Next">' + icon('right') + '</button></span></div>' +
        '<p class="sg-cr" hidden></p></section><nav class="sg-strip" aria-label="' + esc(o.label || 'Choose') + '"></nav>';
      shell.pane.appendChild(el);
      ui.list(list);
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-sg-i]'); if (c) { o.go(Number(c.dataset.sgI), true); return; }
        const n = e.target.closest('[data-sg-nav]'); if (n) { o.go(i + Number(n.dataset.sgNav), true); return; }
        if (e.target.closest('[data-sg-more]') && o.more) { o.more(i); return; }
        if (e.target.closest('[data-sg-say]') && o.say) { o.say(i); return; }
        if (o.click) o.click(e);
      });
    },
    list(list) {
      if (!el) return;
      $('.sg-strip', el).innerHTML = list.map((x, k) => '<button type="button" class="sg-chip' + (x.hot ? ' hot' : '') + '" data-sg-i="' + k + '" aria-current="false"><span class="cre" aria-hidden="true" data-name="' + esc(x.name) + '">' + x.e + '</span><b>' + esc(x.name) + '</b>' + (x.hot ? '<em>' + esc(x.hot) + '</em>' : '') + '</button>').join('');
      swapCreatures($('.sg-strip', el));
      i = -1;
    },
    set(k, x) {
      if (!el) return;
      i = k;
      $('.sg-k', el).textContent = x.kicker || '';
      $('.sg-n', el).textContent = x.name || '';
      $('.sg-t', el).textContent = x.text || '';
      const cr = $('.sg-cr', el); cr.hidden = true; cr.innerHTML = '';
      const info = $('.sg-info', el); info.classList.remove('in'); void info.offsetWidth; info.classList.add('in');
      $$('.sg-chip', el).forEach((b, j) => b.setAttribute('aria-current', String(j === k)));
      const chip = $$('.sg-chip', el)[k], strip = $('.sg-strip', el);
      if (chip && strip) {
        const wide = strip.scrollWidth > strip.clientWidth + 4;
        strip.scrollTo(wide ? { left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' } : { top: chip.offsetTop - (strip.clientHeight - chip.offsetHeight) / 2, behavior: 'smooth' });
      }
    },
    credit(p) {
      if (!el || !p) return;
      creditFor(p).then(() => { const cr = el && $('.sg-cr', el); if (cr) { cr.innerHTML = 'Photo: ' + esc(creditText(p, true)) + (p.url ? ' · <a href="' + esc(p.url) + '" target="_blank" rel="noopener">source</a>' : ''); cr.hidden = false; } }).catch(() => {});
    },
    remove() { if (el) el.remove(); el = null; },
    get el() { return el; }
  };
  return ui;
}
/* The camera controls for "How tall?" and "How big?". */
/* The controls under "How big?" and "How tall?": Smaller, a slider with a stop for each one, Bigger, and Everything.
   said(stop): the window's caption for where the camera has just been sent. */
function scaleUI(shell, sc, hint, said) {
  const el = document.createElement('div'), n = sc.n;
  el.className = 'sz';
  el.innerHTML = '<div class="sz-row"><button type="button" class="pbtn sz-b" data-sz-step="-1" aria-label="Smaller">' + icon('left') + '</button>' +
    '<label class="sz-track"><span class="sz-sr">Step from the smallest to the biggest</span><input type="range" min="0" max="' + (n - 1) + '" step="1" value="0" data-sz-u>' +
    '<span class="sz-dots" aria-hidden="true">' + Array.from({ length: n }, (_, i) => '<i style="left:' + (i / Math.max(1, n - 1) * 100).toFixed(3) + '%"></i>').join('') + '</span></label>' +
    '<button type="button" class="pbtn sz-b" data-sz-step="1" aria-label="Bigger">' + icon('right') + '</button>' +
    '<button type="button" class="btn small primary sz-all" data-sz-all>' + icon('expand') + '<span>Everything</span></button></div>' +
    '<p class="sz-now" aria-live="polite"></p><p class="fine">' + esc(hint) + '</p>';
  shell.pane.appendChild(el);
  const u = $('[data-sz-u]', el), now = $('.sz-now', el), dots = $$('.sz-dots i', el), all = $('[data-sz-all]', el);
  const nameOf = (i) => { const s = sc.stops[i]; return s.id === 'all' ? 'Everything, to scale' : s.it.name + ', ' + s.it.label; };
  let shown = -1;
  const paint = (i) => {                                        // where the camera is now (it follows the journey)
    if (i === shown) return;
    shown = i;
    if (document.activeElement !== u) u.value = String(i);
    u.setAttribute('aria-valuetext', nameOf(i));
    const s = sc.stops[i];
    now.innerHTML = s.id === 'all' ? '<b>All ' + (n - 1) + '</b> · side by side, to scale' : '<b>' + (i + 1) + ' of ' + (n - 1) + '</b> · ' + esc(s.it.name);
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
    $('[data-sz-step="-1"]', el).disabled = i <= 0; $('[data-sz-step="1"]', el).disabled = i >= n - 1;
    all.innerHTML = i === n - 1 ? icon('refresh') + '<span>Start again</span>' : icon('expand') + '<span>Everything</span>';
  };
  sc.onStop = (i, user) => { if (user && said) said(sc.stops[i]); };
  const go = (i) => { i = Math.max(0, Math.min(n - 1, i)); if (i === sc.target && !sc.tw) return; sc.go(i, true); haptic('tick'); };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sz-step]'); if (b) { go(sc.target + Number(b.dataset.szStep)); return; }
    if (e.target.closest('[data-sz-all]')) go(shown === n - 1 ? 0 : n - 1);
  });
  u.addEventListener('input', () => go(Number(u.value)));
  const up = () => sc.release();
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  paint(Math.round(sc.u));
  return {
    el,
    step(d) { go(sc.target + d); },
    tick() { const p = shell.pane.getBoundingClientRect(), r = el.getBoundingClientRect(); if (r.height) sc.floor = r.top - p.top; paint(Math.round(sc.u)); },
    remove() { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); sc.onStop = null; el.remove(); }
  };
}
const metres = (n) => (n < 1 ? Math.round(n * 100) + ' cm' : String(n).replace(/\.0$/, '') + ' m');
/* How each place looks and sounds on the photo stage: the weather on top, the soundscape, the colours while the photo loads. */
const LOOK = {
  kinabalu: ['mist', 'wind', '#1C2A3A', '#7E93B0'], tamannegara: ['mist leaves', 'forest', '#0F2416', '#3E7A44'], rafflesia: ['leaves', 'forest', '#2A1414', '#B8433A'],
  orangutan: ['leaves', 'forest', '#2A1A0E', '#C46A2E'], proboscis: ['mist', 'river', '#1A2A1E', '#A8784A'], tiger: ['leaves', 'night', '#1E1A0E', '#D98A2B'],
  mulu: ['bats', 'night', '#14161E', '#5A5E6E'], fireflies: ['sparkle', 'night', '#060E0A', '#2E5A3A'], turtle: ['bubbles', 'ocean', '#08263A', '#2E7DA6'],
  hornbill: ['leaves rays', 'forest', '#14240E', '#E2A33A'], monsoon: ['rain', 'rain', '#141E2A', '#5E6E82'], kancil: ['leaves', 'forest', '#1E2414', '#9A7A4A'],
  cheetah: ['speed dust', 'wind', '#3A2A10', '#D9A44A'], falcon: ['speed', 'wind', '#1E2A3E', '#8EA6C6'], whale: ['bubbles', 'ocean', '#06203A', '#2E6EA6'],
  giraffe: ['dust rays', 'birds', '#3A2A12', '#D9A65A'], elephant: ['dust', 'wind', '#2E2A26', '#9A8E82'], python: ['leaves', 'forest', '#1A2412', '#6E8A3E'],
  croc: ['mist', 'river', '#1A2216', '#6E7A4A'], ostrich: ['dust', 'wind', '#3A2E1A', '#C9A26A'], hummingbird: ['sparkle leaves', 'birds', '#0E2A1A', '#3EA67A'],
  shrew: ['leaves', 'night', '#1E1A16', '#7A6A5A'], shark: ['bubbles', 'ocean', '#081A2A', '#3A5E7A'], beetle: ['leaves', 'forest', '#161E10', '#6E8A2E']
};
const lookOf = (id, e, wiki, name) => { const L = LOOK[id] || ['', '', '#141A2E', '#4A5A8A']; return { key: id, wiki, e, name: name || '', fx: L[0] ? L[0].split(' ') : [], sound: L[1], a: L[2], b: L[3] }; };
/* A window built on the photo stage. list: the items; o: { label, kick(x), text(x), name(x), wiki, e, more(i), say(i) } */
function stageWin(shell, list, o) {
  const stage = makeStage();
  let i = 0, ui = null;
  const go = (k, user) => {
    const n = list.length; i = ((k % n) + n) % n;
    const x = list[i];
    stage.show(lookOf(x.id, x.icon, x.wiki, x.name));
    ui.set(i, { kicker: o.kick(x), name: o.name(x), text: o.text(x) });
    shell.setSub(x.id);
    shell.resound();
    if (user) sfx('whoosh');
  };
  stage.onPhoto = (item, p) => { if (ui && list[i] && list[i].id === item.key) ui.credit(p); };
  const W = {
    stage, get i() { return i; }, list,
    get sound() { return (LOOK[list[i] && list[i].id] || [])[1] || ''; },
    mount() {
      ui = stageUI(shell, { label: o.label, go, extra: o.extra, more: (k) => o.more(k, go), say: (k) => { const x = list[k]; shell.say(o.name(x) + '. ' + o.text(x), shell.lang() === 'ms' && o.bm ? 'ms' : 'en-GB'); }, click: o.click });
      ui.mount(list.map((x) => ({ e: x.icon, name: o.name(x), hot: o.hot ? o.hot(x) : '' })));
      go(i);
    },
    relabel() { if (!ui) return; ui.list(list.map((x) => ({ e: x.icon, name: o.name(x), hot: o.hot ? o.hot(x) : '' }))); const k = i; i = -1; go(k); },
    unmount() { if (ui) ui.remove(); ui = null; },
    go, arrow(d) { go(i + d, true); },
    sub(s) { const k = list.findIndex((x) => x.id === s); if (k >= 0) go(k); return k >= 0; }
  };
  return W;
}

/* ---------- World Explorer: the map, a flight to each city, and a postcard from it ---------- */
const HOME = 'kl';
const CITY_SOUND = { kl: 'city', london: 'city', paris: 'city', rome: 'city', cairo: 'market', nairobi: 'birds', capetown: 'ocean', lagos: 'market', mumbai: 'market', beijing: 'city', tokyo: 'city', seoul: 'city',
  bangkok: 'market', singapore: 'city', jakarta: 'market', sydney: 'ocean', auckland: 'ocean', newyork: 'city', mexico: 'market', rio: 'ocean', lima: 'ocean', reykjavik: 'wind', dubai: 'wind', istanbul: 'market' };
function wallClock(tz, d) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
}
export function aheadBy(tz, d) { return Math.round((wallClock(tz, d) - Math.floor(d.getTime() / 1000) * 1000) / 60000) + d.getTimezoneOffset(); }
export function diffText(m) {
  if (Math.abs(m) < 1) return 'The same time as us';
  const a = Math.abs(m), h = Math.floor(a / 60), mm = a % 60;
  const amount = mm === 30 ? (h ? h + '½' : '½') + ' hours' : mm ? h + (h === 1 ? ' hour ' : ' hours ') + mm + ' minutes' : h + (h === 1 ? ' hour' : ' hours');
  return amount + (m > 0 ? ' ahead of us' : ' behind us');
}
/* { km: '5,330 km', time: 'about 7 hours' } for a flight between two cities */
export function flightWords(from, to) {
  const km = distanceKm(from, to), r = Math.max(1, Math.round(flightHours(km) * 2) / 2);
  return { km: (Math.round(km / 10) * 10).toLocaleString('en-GB') + ' km', time: 'about ' + String(r).replace('.5', '½') + (r === 1 ? ' hour' : ' hours') };
}
function postcardHTML(c, from) {
  const f = flag(c.flag);
  return '<header class="pcd-top">' + (f ? '<span class="pcd-flag" aria-hidden="true">' + f + '</span>' : '<span class="pcd-flag" aria-hidden="true">📍</span>') +
    '<div class="pcd-name"><h2>' + esc(c.name) + '</h2><small>' + esc(c.country) + '</small></div><button type="button" class="pbtn" data-pc-x aria-label="Close the postcard">' + icon('close') + '</button></header>' +
    (from ? (() => { const f2 = flightWords(from, c); return '<p class="pcd-fly"><span aria-hidden="true">✈️</span><span>From ' + esc(from.name) + ': <b>' + esc(f2.km) + '</b>, ' + esc(f2.time) + ' by plane</span></p>'; })() : '') +
    '<p class="pcd-time"><b class="pcd-clock"></b><span class="pcd-dn"></span><span class="pcd-diff"></span></p>' +
    '<div class="pcd-hello"><small>Say hello</small><b lang="' + esc(c.hello.lang) + '">' + esc(c.hello.text) + '</b><span>Say it like <i>' + esc(c.hello.say) + '</i>. It means “' + esc(c.hello.means) + '”.</span>' +
    '<button type="button" class="btn small" data-pc-hear>' + icon('volume') + 'Hear it</button></div>' +
    '<div class="pcd-two">' +
    '<div class="pcd-col"><figure class="pcd-ph" data-wiki="' + esc(c.famous.wiki) + '"><span class="wd-e" aria-hidden="true">📍</span><figcaption class="ph-cr" hidden></figcaption></figure><small>Famous for</small><b>' + esc(c.famous.name) + '</b><p>' + esc(c.famous.text) + '</p></div>' +
    '<div class="pcd-col"><figure class="pcd-ph" data-wiki="' + esc(c.food.wiki) + '"><span class="wd-e" aria-hidden="true">🍽️</span><figcaption class="ph-cr" hidden></figcaption></figure><small>Food to try</small><b>' + esc(c.food.name) + '</b><p>' + esc(c.food.text) + '</p></div>' +
    '</div><p class="pcd-fact"><b>Did you know?</b> ' + esc(c.fact) + '</p>' +
    '<footer class="pcd-foot"><button type="button" class="pbtn" data-pc-nav="-1" aria-label="Previous city">' + icon('left') + '</button><button type="button" class="btn small" data-pc-say>' + icon('volume') + 'Read the postcard</button><button type="button" class="pbtn" data-pc-nav="1" aria-label="Next city">' + icon('right') + '</button></footer>';
}
function explorerWin(shell) {
  const sc = explorer, list = D.CITIES, order = list.slice().sort((a, b) => a.name.localeCompare(b.name));
  let city = null, tickT = 0, pcd = null, last = null, flying = 0;
  const byId = (id) => list.find((c) => c.id === id);
  const dock = () => (shell.pane.clientWidth >= 980 && city ? Math.min(440, Math.round(shell.pane.clientWidth * 0.34)) + 24 : 0);
  const mapB = () => shell.pane.style.setProperty('--map-b', Math.round(sc.goal.y + sc.goal.h + 10) + 'px');      // narrow screens: controls under the map
  function clock() {
    if (!city || !pcd || pcd.hidden || !$('.pcd-clock', pcd)) return;      // (not while the plane is still flying)
    const now = new Date();
    try {
      $('.pcd-clock', pcd).textContent = new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now) + ', ' + new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, weekday: 'long' }).format(now);
      const hr = Number(new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, hour: 'numeric', hourCycle: 'h23' }).format(now)), lt = sc.light(city);
      $('.pcd-dn', pcd).textContent = lt > 0.05 ? '☀️ Daytime there' : lt < -0.1 ? '🌙 Night time there' : hr < 12 ? '🌅 Sunrise there' : '🌇 Sunset there';
      $('.pcd-diff', pcd).textContent = diffText(aheadBy(city.tz, now));
    } catch (e) { $('.pcd-clock', pcd).textContent = ''; }
  }
  /* Choosing a city: the plane flies there first (from home, or from the last city), then the postcard opens. */
  function pick(id, user) {
    const c = byId(id);
    if (!c || (city && city.id === c.id)) return;
    const from = last && last.id !== c.id ? last : c.id !== HOME ? byId(HOME) : null;
    city = c; sc.select(c.id);
    const sel = $('.ex-sel', shell.pane); if (sel) sel.value = c.id;
    if (pcd) { pcd.hidden = true; pcd.innerHTML = ''; }
    sc.setDock(0); shell.setSub(c.id);
    const fly = ++flying, land = () => {
      if (fly !== flying || city !== c) return;
      last = c;
      pcd.innerHTML = postcardHTML(c, from); pcd.hidden = false; pcd.scrollTop = 0;
      $$('[data-wiki]', pcd).forEach((f) => photoInto(f, f.dataset.wiki, 500, true));
      clock(); sc.setDock(dock());
      shell.show({ kind: c.name + ', ' + c.country, text: c.fact, lang: 'en-GB' }, false);
      shell.resound();
      if (shell.soundOn()) Fx.play('land');
    };
    if (from && user !== 'instant') {
      sc.fly(from, c, land);
      if (shell.soundOn()) Fx.play('plane', 2.6);
      const f2 = flightWords(from, c);
      shell.show({ kind: 'Flying to ' + c.name, text: 'From ' + from.name + ' to ' + c.name + ' is ' + f2.km + ' over the curve of the Earth: ' + f2.time + ' by plane.', lang: 'en-GB' }, false);
    } else { sc.fly(null, null); land(); }
    if (user === true) sfx('pop', 2);
  }
  function close() { city = null; flying++; sc.select(null); sc.fly(null, null); if (pcd) { pcd.hidden = true; pcd.innerHTML = ''; } sc.setDock(0); shell.setSub(''); const sel = $('.ex-sel', shell.pane); if (sel) sel.value = ''; shell.resound(); }
  return {
    scene: sc, pad: true, quiz: 'world', sources: 'world',
    get sound() { return city ? CITY_SOUND[city.id] || 'city' : ''; },
    caption: () => items(D.CAPTIONS.explorer.facts, D.CAPTIONS.explorer.wonders),
    mount() {
      shell.pane.innerHTML = '<div class="ex-ctl"><label class="ex-l"><span>Choose a city</span><select class="ex-sel" aria-label="Choose a city"><option value="">All 24 cities…</option>' +
        order.map((c) => '<option value="' + c.id + '">' + esc(c.name + ', ' + c.country) + '</option>').join('') + '</select></label>' +
        '<button type="button" class="btn small" data-ex-rnd aria-label="Surprise me: fly to a city at random">🎲<span class="ex-w"> Surprise me</span></button></div><aside class="pcd" hidden aria-label="City postcard" data-ctx></aside>';
      pcd = $('.pcd', shell.pane);
      mapB();
      $('.ex-sel', shell.pane).addEventListener('change', (e) => { if (e.target.value) pick(e.target.value, true); else close(); });
      shell.pane.addEventListener('click', (e) => {
        if (e.target.closest('[data-ex-rnd]')) { const others = list.filter((c) => !city || c.id !== city.id); pick(others[Math.floor(Math.random() * others.length)].id, true); return; }
        if (e.target.closest('[data-pc-x]')) { close(); return; }
        const n = e.target.closest('[data-pc-nav]');
        if (n && city) { const i = order.indexOf(city); pick(order[(i + Number(n.dataset.pcNav) + order.length) % order.length].id, true); return; }
        if (e.target.closest('[data-pc-hear]') && city) { const h = city.hello; if (Voice.hasVoice(h.lang)) shell.say(h.text, h.lang); else shell.say(h.say.replace(/·/g, ',').replace(/-/g, ' '), 'en-GB'); return; }
        if (e.target.closest('[data-pc-say]') && city) shell.say(city.name + ', ' + city.country + '. Famous for ' + city.famous.name + '. ' + city.famous.text + ' Food to try: ' + city.food.name + '. ' + city.food.text + ' Did you know? ' + city.fact, 'en-GB');
      });
    },
    unmount() { city = null; flying++; sc.select(null); sc.setDock(0); sc.fly(null, null); },
    escape() { if (!city) return false; close(); return true; },
    resized() { sc.setDock(dock()); mapB(); },
    onScene(r) { if (r && r.city) pick(r.city, true); },
    sub(s) { if (byId(s)) pick(s, false); },
    arrow(d) { if (city) { const i = order.indexOf(city); pick(order[(i + d + order.length) % order.length].id, true); } },
    tick(dt) { tickT += dt; if (tickT >= 1) { tickT = 0; clock(); } },
    context() { return city ? 'The World Explorer postcard for ' + city.name + ', ' + city.country + ' is open.' : ''; }
  };
}

/* ---------- Festivals: each one live, with its own music ---------- */
function festivalsWin(shell) {
  const list = D.FESTIVALS, scene = makeFestival(), month = new Date().getMonth();
  const now = list.findIndex((f) => D.FESTIVAL_MONTHS[f.id] === month);
  let i = now >= 0 ? now : 0, ui = null;
  const card = (k, go) => {
    const f = list[k];
    openCard(shell, { title: f.name, sub: 'Festivals', e: f.icon, wiki: f.wiki, text: f.what, rows: [['Where', f.where], ['When', f.when], ['Food', f.food], ['Greeting', f.hello]],
      extra: '<button type="button" class="btn small" data-hear data-say="' + esc(f.hello) + '" data-lang="' + esc(f.hl || 'en-GB') + '">' + icon('chat') + 'Say the greeting</button>',
      nav: (d) => { const j = (k + d + list.length) % list.length; go(j, true); card(j, go); } });
  };
  let owned = false;                                   // the caption is showing a message from this festival's scene
  const go = (k, user) => {
    const n = list.length; i = ((k % n) + n) % n;
    const f = list[i];
    scene.set(f.id);
    ui.set(i, { kicker: f.when + ' · ' + f.where, name: f.name, text: f.what });
    shell.setSub(f.id);
    shell.resound();
    if (owned) { owned = false; shell.recaption(); }
    if (user) sfx('whoosh');
  };
  const W = {
    scene, quiz: 'festivals', sources: 'festivals',
    get sound() { return FEST_SCENES[list[i].id].sound; },
    audio(on) { if (on && ui) Music.start(FEST_SCENES[list[i].id].music); else Music.stop(); },
    caption: () => items(D.CAPTIONS.festivals.facts, D.CAPTIONS.festivals.wonders),
    mount() {
      ui = stageUI(shell, { label: 'Festivals', go, more: (k) => card(k, go), moreText: 'Find out more',
        extra: '<button type="button" class="btn small" data-fs-hello>' + icon('chat') + '<span>Say the greeting</span></button>',
        say: (k) => shell.say(list[k].name + '. ' + list[k].what, 'en-GB'),
        click(e) { if (e.target.closest('[data-fs-hello]')) { const f = list[i]; shell.say(f.hello, f.hl || 'en-GB'); } } });
      ui.mount(list.map((f) => ({ e: f.icon, name: f.name, hot: D.FESTIVAL_MONTHS[f.id] === month ? 'This month' : '' })));
      ui.el.classList.add('sg-fest');
      go(i);
    },
    unmount() { Music.stop(); if (ui) ui.remove(); ui = null; },
    arrow(d) { go(i + d, true); },
    sub(s) { const k = list.findIndex((f) => f.id === s); if (k >= 0) go(k); },
    onScene(r) {
      if (r && r.menorah != null) owned = true;
      if (r && r.menorah != null) shell.show({ kind: 'Hanukkah', text: r.menorah ? 'Night ' + r.menorah + ': ' + r.menorah + (r.menorah === 1 ? ' candle' : ' candles') + ' and the helper candle, the shamash, which lights the others.' : 'Only the shamash, the helper candle, is lit. Tap to light the first night’s candle.', lang: 'en-GB' }, false);
    },
    context() { const f = list[i]; return 'The Festivals window is showing ' + f.name + ' (' + f.where + ', ' + f.when + '), drawn live with its music.'; }
  };
  return W;
}

/* ---------- The Seven Wonders: the ancient seven and the new seven, drawn live, and "How tall?" ---------- */
function wondersWin(shell) {
  const sets = { ancient: D.WONDERS.filter((x) => x.set === 'ancient'), new: D.WONDERS.filter((x) => x.set === 'new') };
  const SHORT = { giza: 'Great Pyramid', zeus: 'Statue of Zeus', mausoleum: 'Mausoleum', colossus: 'Colossus', pharos: 'Lighthouse', wall: 'Great Wall', christ: 'Christ the Redeemer', chichen: 'Chichén Itzá', colosseum: 'Colosseum', taj: 'Taj Mahal', petra: 'Petra' };
  const MINI = { christ: 'Christ', zeus: 'Zeus', giza: 'Pyramid' };          // names for a phone's everything view
  const tall = makeScale(D.WONDERS.filter((x) => x.h).map((x) => ({ id: x.id, name: x.name, short: SHORT[x.id], mini: MINI[x.id], label: 'about ' + x.h + ' m tall', m: x.h, how: 'tall', art: x.id }))
    .concat([{ id: 'bigben', name: 'Big Ben’s tower', short: 'Big Ben', label: '96 m tall', m: 96, how: 'tall', art: 'bigben', ref: true },
      { id: 'bus', name: 'A double-decker bus', short: 'Bus', label: '4.4 m tall', m: 4.4, how: 'tall', art: 'bus', ref: true },
      { id: 'pupil', name: 'A Year 4 pupil', short: 'Pupil', label: '1.3 m tall', m: 1.3, how: 'tall', art: 'pupil', ref: true }]), { reveal: 8 });
  const scene = makeWonders();
  let tab = 'ancient', i = 0, ui = null, zui = null, owned = false;
  const sw = switcher({ scene, tall }, 'scene');
  const list = () => sets[tab] || sets.ancient;
  function more(k) {
    const l = list(), x = l[k];
    openCard(shell, { title: x.name, sub: tab === 'ancient' ? 'Seven Wonders of the Ancient World' : 'New Seven Wonders of the World', e: x.icon, wiki: x.wiki, text: x.text,
      rows: [['Where', x.where], ['Built', x.built], ['Height', x.h ? 'About ' + x.h + ' metres' : ''], ['Still standing?', x.standing ? 'Yes' : 'No']],
      nav: (d) => { const j = (k + d + l.length) % l.length; go(j, true); more(j); } });
  }
  const kick = (x) => (tab === 'ancient' ? 'Ancient wonder' : 'New wonder') + ' · ' + x.where + ' · ' + x.built + (x.standing ? '' : ' · gone now');
  const go = (k, user) => {
    const l = list(), n = l.length; i = ((k % n) + n) % n;
    const x = l[i];
    scene.set(x.id);
    if (ui) ui.set(i, { kicker: kick(x), name: x.name, text: x.text });
    shell.setSub(x.id);
    shell.resound();
    if (owned) { owned = false; shell.recaption(); }
    if (user) sfx('whoosh');
  };
  scene.onPhase = (ph, user) => { shell.resound(); if (!user && owned) { owned = false; shell.recaption(); } };
  function mountList() {
    ui = stageUI(shell, { label: tab === 'ancient' ? 'The ancient seven' : 'The new seven', go, more, say: (k) => { const x = list()[k]; shell.say(x.name + '. ' + x.text, 'en-GB'); } });
    ui.mount(list().map((x) => ({ e: x.icon, name: x.name })));
    ui.el.classList.add('sg-fest');
  }
  const W = {
    scene: sw, pad: false, quiz: 'wonders', sources: 'wonders',
    tabs: [{ id: 'ancient', name: 'Ancient seven' }, { id: 'new', name: 'New seven' }, { id: 'tall', name: 'How tall?' }], tab,
    get sound() { return tab === 'tall' ? 'wind' : scene.sound; },
    audio(on) { if (on && tab !== 'tall' && scene.f) Music.start(scene.f.music); else Music.stop(); },
    caption: () => items(D.CAPTIONS.wonders.facts, D.CAPTIONS.wonders.wonders),
    setTab(id) {
      if (ui) { ui.remove(); ui = null; }
      if (zui) { zui.remove(); zui = null; }
      shell.pane.innerHTML = '';
      tab = W.tab = id;
      if (owned) { owned = false; shell.recaption(); }
      if (id === 'tall') {
        Music.stop();
        sw.use('tall'); tall.start();
        zui = scaleUI(shell, tall, 'Step from a Year 4 pupil to the Great Pyramid, or tap one to hear what it is. Heights are about, and rounded; the Great Pyramid was about 147 metres when it was built.', (st) => W.onScene(st.id === 'all' ? { all: true } : { size: st.id }));
        shell.setSub('tall');
        if (shell.pane.clientWidth < 700) shell.show({ kind: 'How tall?', text: 'Press Bigger to step from the smallest to the tallest, or Everything to see them all side by side. Tap one to hear what it is.', lang: 'en-GB' }, false);
        return;
      }
      sw.use('scene');
      mountList();
      go(0);
      if (shell.soundOn()) Music.start(scene.f.music);
    },
    unmount() { Music.stop(); if (ui) ui.remove(); if (zui) zui.remove(); ui = null; zui = null; },
    arrow(d) { if (tab !== 'tall') go(i + d, true); else if (zui) zui.step(d); },
    sub(s) {
      if (W.tabs.some((x) => x.id === s)) { shell.tab(s); return; }
      const set = sets.ancient.some((x) => x.id === s) ? 'ancient' : sets.new.some((x) => x.id === s) ? 'new' : '';
      if (!set) return;
      if (tab !== set) shell.tab(set);
      const k = list().findIndex((x) => x.id === s); if (k >= 0) go(k);
    },
    tick() { if (zui) zui.tick(); },
    onScene(r) {
      if (!r) return;
      if (r.all) { shell.show({ kind: 'How tall?', text: 'All of them side by side, to scale. The Great Pyramid is more than a hundred times as tall as a Year 4 pupil, and taller than Big Ben’s tower.', lang: 'en-GB' }, true); return; }
      if (r.size) { const x = D.WONDERS.find((y) => y.id === r.size); shell.show(x ? { kind: x.name, text: x.name + ' is about ' + x.h + ' metres tall. ' + x.text, lang: 'en-GB' } : { kind: 'For scale', text: r.size === 'bigben' ? 'Big Ben’s tower in London is 96 metres tall.' : r.size === 'bus' ? 'A London double-decker bus is about 4.4 metres tall.' : 'A Year 4 pupil is about 1.3 metres tall.', lang: 'en-GB' }, true); return; }
      if (r.say) { owned = true; shell.show({ kind: r.say.kind, text: r.say.text, lang: 'en-GB' }, true); }
    },
    context() { return tab === 'tall' ? 'The Seven Wonders window shows how tall the wonders are, side by side with Big Ben’s tower, a bus and a pupil.' : (scene.f ? 'The Seven Wonders window shows ' + list()[i].name + ', drawn live' + (scene.f.phases ? ' at ' + scene.phase : '') + '. Tapping the picture: ' + (scene.f.tap === 'phase' ? 'changes the time of day' : 'brings it to life') + '.' : ''); }
  };
  return W;
}

/* ---------- Animal record breakers: on the photo stage, the speed race and "How big?" ---------- */
function recordsWin(shell) {
  const list = D.RECORDS;
  const SHORT = { hummingbird: 'Hummingbird', python: 'Python', croc: 'Crocodile', whale: 'Blue whale' };
  const big = makeScale(list.filter((r) => /^m (long|tall)$/.test(r.unit)).map((r) => ({ id: r.id, name: r.name, short: SHORT[r.id], label: metres(r.n) + ' ' + r.unit.slice(2), m: r.n, how: r.unit.slice(2), art: r.id }))
    .concat([{ id: 'elephant', name: 'African elephant', short: 'Elephant', label: 'about 3.2 m tall', m: 3.2, how: 'tall', art: 'elephant' },
      { id: 'bus', name: 'A double-decker bus', short: 'Bus', label: '11 m long', m: 11.2, how: 'long', art: 'bus', ref: true },
      { id: 'pupil', name: 'A Year 4 pupil', short: 'Pupil', label: '1.3 m tall', m: 1.3, how: 'tall', art: 'pupil', ref: true }]), { trees: true });
  const race = makeRace(D.RACE);
  let tab = 'cards', zui = null, rui = null;
  const cards = stageWin(shell, list, {
    label: 'Record breakers', kick: (x) => x.title + ' · ' + x.value, name: (x) => x.name, text: (x) => x.text,
    more: function more(k, go) { const r = list[k]; openCard(shell, { title: r.name, sub: r.title, e: r.icon, wiki: r.wiki, text: r.text, rows: [['Record', r.title], ['How much?', r.value]], nav: (d) => { const j = (k + d + list.length) % list.length; go(j, true); more(j, go); } }); }
  });
  const sw = switcher({ stage: cards.stage, race, big }, 'stage');
  race.onDone = () => {
    shell.show({ kind: 'Speed race', text: 'The peregrine falcon wins: it dives at over 300 km/h! The cheetah is the fastest runner, and the snail has hardly moved.', lang: 'en-GB' }, true);
    const b = rui && $('[data-rc-go]', rui); if (b) b.innerHTML = icon('refresh') + '<span>Race again</span>';
  };
  const W = {
    scene: sw, quiz: 'records', sources: 'records',
    tabs: [{ id: 'cards', name: 'Record breakers' }, { id: 'race', name: 'Speed race' }, { id: 'big', name: 'How big?' }], tab,
    get sound() { return tab === 'cards' ? cards.sound : 'wind'; },
    caption: () => items(D.CAPTIONS.records.facts, D.CAPTIONS.records.wonders),
    setTab(id) {
      cards.unmount(); if (zui) { zui.remove(); zui = null; } if (rui) { rui.remove(); rui = null; }
      shell.pane.innerHTML = '';
      tab = W.tab = id;
      if (id === 'race') {
        sw.use('race'); race.reset();
        rui = document.createElement('div'); rui.className = 'sz sz-race';
        rui.innerHTML = '<div class="sz-row"><button type="button" class="btn primary" data-rc-go>' + icon('play') + '<span>Start the race</span></button></div><p class="fine">Everyone sets off together and goes for the same few seconds. The falcon’s speed is for its dive; Usain Bolt’s is his top speed in a 100-metre race.</p>';
        shell.pane.appendChild(rui);
        rui.addEventListener('click', (e) => { if (e.target.closest('[data-rc-go]')) { race.soundOn = shell.soundOn(); race.start(); sfx('whoosh'); } });
        shell.setSub('race');
        return;
      }
      if (id === 'big') {
        sw.use('big'); big.start();
        zui = scaleUI(shell, big, 'Step from the smallest to the biggest, or tap an animal to hear its record. Lengths and heights are about, and rounded.', (st) => W.onScene(st.id === 'all' ? { all: true } : { size: st.id }));
        shell.setSub('big');
        if (shell.pane.clientWidth < 700) shell.show({ kind: 'How big?', text: 'Press Bigger to step from the smallest to the biggest, or Everything to see them all side by side. Tap an animal to hear its record.', lang: 'en-GB' }, false);
        return;
      }
      sw.use('stage');
      cards.mount();
    },
    unmount() { cards.unmount(); if (zui) zui.remove(); if (rui) rui.remove(); },
    arrow(d) { if (tab === 'cards') cards.arrow(d); else if (tab === 'big' && zui) zui.step(d); },
    sub(s) {
      if (W.tabs.some((x) => x.id === s)) { shell.tab(s); return; }
      if (list.some((x) => x.id === s)) { if (tab !== 'cards') shell.tab('cards'); cards.sub(s); }
    },
    tick() { if (zui) zui.tick(); },
    onScene(r) {
      if (r && r.race) { sfx('whoosh'); return; }
      if (r && r.all) { shell.show({ kind: 'How big?', text: 'All of them side by side, to scale. The blue whale is about 600 times as long as the bee hummingbird, and longer than two buses.', lang: 'en-GB' }, true); return; }
      if (r && r.size) { const x = list.find((y) => y.id === r.size); shell.show(x ? { kind: x.name, text: x.title + ': ' + x.value + '. ' + x.text, lang: 'en-GB' } : { kind: 'For scale', text: r.size === 'bus' ? 'A London double-decker bus is about 11 metres long.' : 'A Year 4 pupil is about 1.3 metres tall.', lang: 'en-GB' }, true); }
    },
    context() { return tab === 'race' ? 'The record breakers window shows the speed race.' : tab === 'big' ? 'The record breakers window shows how big the record-breaking animals are, next to a bus and a pupil.' : 'The record breakers window shows the ' + list[cards.i].name + ': ' + list[cards.i].title + '.'; }
  };
  return W;
}

/* ---------- Wonders of Malaysia, in English or Bahasa Melayu ---------- */
function malaysiaWin(shell) {
  const list = D.MALAYSIA;
  const ms = () => shell.lang() === 'ms';
  const W = stageWin(shell, list, {
    label: 'Wonders of Malaysia', bm: true,
    kick: (x) => (ms() ? 'Keajaiban Malaysia · ' + x.name : 'Wonders of Malaysia · ' + x.bmName),
    name: (x) => (ms() ? x.bmName : x.name), text: (x) => (ms() ? x.bm : x.text),
    more: function more(k, go) { const m = list[k]; openCard(shell, { title: ms() ? m.bmName : m.name, sub: ms() ? 'Keajaiban Malaysia' : 'Wonders of Malaysia', e: m.icon, wiki: m.wiki, text: ms() ? m.bm : m.text, lang: ms() ? 'ms' : 'en', nav: (d) => { const j = (k + d + list.length) % list.length; go(j, true); more(j, go); } }); }
  });
  return Object.assign(W, {
    scene: W.stage, pad: true, bm: true, quiz: 'malaysia', sources: 'malaysia',
    caption: (m) => items(D.CAPTIONS.malaysia.facts, D.CAPTIONS.malaysia.wonders, m),
    setLang() { W.relabel(); },
    context() { const x = list[W.i]; return 'The Wonders of Malaysia window shows ' + x.name + ' (' + x.bmName + ').'; }
  });
}

/* ---------- Seasons ---------- */
function seasonsWin(shell) {
  const sc = seasons;
  let el = null, lastPaint = 0;
  function paint() {
    if (!el) return;
    const d = dateOf(sc.doy);
    $('.sn-date', el).textContent = d.text;
    const r = $('.sn-range', el); if (Number(r.value) !== Math.round(sc.doy)) r.value = String(Math.round(sc.doy));
    $('[data-ss-play]', el).setAttribute('aria-pressed', String(sc.playing));
    $('[data-ss-play]', el).innerHTML = icon(sc.playing ? 'pause' : 'play') + '<span>' + (sc.playing ? 'Pause' : 'Play the year') + '</span>';
    PLACES.forEach((p, i) => {
      const row = $$('.sn-row', el)[i], hrs = daylight(p, sc.doy);
      $('.sn-s', row).textContent = seasonOf(p, d.month);
      $('.sn-h', row).textContent = hm(hrs);
      $('.sn-bar i', row).style.width = (hrs / 24 * 100).toFixed(1) + '%';
    });
  }
  return {
    scene: sc, pad: true, sound: '', quiz: 'seasons', sources: 'seasons',
    caption: () => items(D.CAPTIONS.seasons.facts, D.CAPTIONS.seasons.wonders),
    mount() {
      shell.pane.innerHTML = '<section class="sn" data-ctx aria-label="Seasons"><div class="sn-top"><b class="sn-date"></b><span class="wd-sp"></span><button type="button" class="btn small" data-ss-play aria-pressed="false"></button><button type="button" class="btn small" data-ss-today>Today</button></div>' +
        '<input type="range" class="sn-range" min="1" max="365" step="1" aria-label="Day of the year"><div class="sn-months" aria-hidden="true">' + MONTHS.map((m) => '<span>' + m.charAt(0) + '</span>').join('') + '</div>' +
        '<p class="sn-k">Hours of daylight</p><div class="sn-rows">' + PLACES.map((p) => '<div class="sn-row" style="--c:' + p.col + '"><span class="sn-n">' + esc(p.name) + '</span><span class="sn-s"></span><span class="sn-bar"><i></i></span><b class="sn-h"></b></div>').join('') + '</div></section>';
      el = $('.sn', shell.pane);
      $('.sn-range', el).addEventListener('input', (e) => { sc.playing = false; sc.setDay(Number(e.target.value)); paint(); });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-ss-play]')) { sc.playing = !sc.playing; paint(); }
        if (e.target.closest('[data-ss-today]')) { sc.playing = false; sc.setDay(dayOfYear(new Date())); paint(); }
      });
      paint();
    },
    unmount() { sc.playing = false; el = null; },
    onScene(r) { if (r && r.seasons) paint(); },
    tick() { if (sc.playing && performance.now() - lastPaint > 120) { lastPaint = performance.now(); paint(); } },
    context() { const d = dateOf(sc.doy); return 'The Seasons window shows ' + d.text + ': ' + (sc.lean || '') + '. Daylight: ' + PLACES.map((p) => p.name + ' ' + hm(daylight(p, sc.doy))).join(', ') + '.'; }
  };
}

/* ---------- Extreme weather ---------- */
function weatherWin(shell) {
  const sc = weather;
  const SOUND = { hurricane: 'hurricane', storm: 'rain', monsoon: 'rain', blizzard: 'wind' };
  function paintMonsoon() {
    const el = $('.wx', shell.pane); if (!el) return;
    const m = D.MONSOON[sc.month], S = D.MONSOON_SEASONS[m.s];
    $('.wx-m', el).textContent = m.m; $('.wx-s', el).textContent = S.name; $('.wx-w', el).textContent = S.wind; $('.wx-t', el).textContent = S.text;
    $('.wx-rain i', el).style.width = Math.round(m.rain * 100) + '%';
    $('.wx-rain b', el).textContent = m.rain >= 0.8 ? 'Very heavy' : m.rain >= 0.4 ? 'Heavy' : 'Some showers';
  }
  function paintBlizzard() {
    const el = $('.wx', shell.pane); if (!el) return;
    const f = Math.round(feelsLike(sc.temp, sc.wind)), minus = (n) => (n < 0 ? '−' + Math.abs(n) : String(n));
    $('.wx-tv', el).textContent = minus(sc.temp) + ' °C'; $('.wx-wv', el).textContent = sc.wind + ' km/h';
    $('.wx-feel b', el).textContent = minus(f) + ' °C';
    $('.wx-what', el).textContent = sc.wind >= 50 ? 'Blizzard! Strong wind and blowing snow: you can hardly see.' : sc.wind >= 20 ? 'Snowstorm: windy, with lots of snow.' : sc.wind > 0 ? 'Gentle snow.' : 'Still and snowy.';
  }
  const W = {
    scene: sc, quiz: 'weather', sources: 'weather',
    tabs: [{ id: 'hurricane', name: 'Hurricane' }, { id: 'storm', name: 'Thunderstorm' }, { id: 'monsoon', name: 'Monsoon' }, { id: 'blizzard', name: 'Blizzard' }], tab: sc.mode,
    get sound() { return SOUND[sc.mode]; },
    caption: () => items(D.WEATHER[sc.mode].facts, D.CAPTIONS.weather[sc.mode]),
    setTab(id) {
      sc.setMode(id); W.tab = id;
      let h = '';
      if (id === 'hurricane') h = '<div class="wx"><span class="wx-k">Where is the storm?</span><div class="wseg" role="group" aria-label="Which side of the equator"><button type="button" data-wx-h="n" aria-pressed="' + !sc.south + '">North of the equator</button><button type="button" data-wx-h="s" aria-pressed="' + sc.south + '">South of the equator</button></div><span class="fine">Tap the eye, the eyewall or a rain band.</span></div>';
      if (id === 'storm') h = '<div class="wx"><button type="button" class="btn primary" data-wx-flash>' + icon('bolt') + 'Make lightning</button><span class="fine">Count the seconds to the thunder, then divide by 3: that is how many kilometres away the storm is.</span></div>';
      if (id === 'monsoon') h = '<div class="wx wx-wide"><div class="wx-row"><b class="wx-m"></b><span class="wx-s"></span></div><input type="range" class="wx-range" min="0" max="11" step="1" value="' + sc.month + '" aria-label="Month">' +
        '<div class="sn-months" aria-hidden="true">' + MONTHS.map((m) => '<span>' + m.charAt(0) + '</span>').join('') + '</div><p class="wx-w"></p><p class="wx-t"></p><div class="wx-rain"><span>Rain on the east coast</span><span class="sn-bar"><i></i></span><b></b></div><span class="fine">This shows the east coast of Peninsular Malaysia: Kelantan, Terengganu and Pahang.</span></div>';
      if (id === 'blizzard') h = '<div class="wx wx-wide"><label class="wx-sl"><span>Temperature <b class="wx-tv"></b></span><input type="range" min="-20" max="0" step="1" value="' + sc.temp + '" data-wx-temp></label>' +
        '<label class="wx-sl"><span>Wind <b class="wx-wv"></b></span><input type="range" min="0" max="90" step="5" value="' + sc.wind + '" data-wx-wind></label><p class="wx-feel">With the wind, it feels like <b></b></p><p class="wx-what"></p></div>';
      shell.pane.innerHTML = h;
      if (id === 'monsoon') paintMonsoon();
      if (id === 'blizzard') paintBlizzard();
    },
    mount() {
      shell.pane.addEventListener('click', (e) => {
        const hb = e.target.closest('[data-wx-h]');
        if (hb) { sc.south = hb.dataset.wxH === 's'; $$('[data-wx-h]', shell.pane).forEach((b) => b.setAttribute('aria-pressed', String(b === hb))); sfx('whoosh'); return; }
        if (e.target.closest('[data-wx-flash]')) sc.strike();
      });
      shell.pane.addEventListener('input', (e) => {
        if (e.target.classList.contains('wx-range')) { sc.month = Number(e.target.value); paintMonsoon(); }
        if (e.target.matches('[data-wx-temp]')) { sc.temp = Number(e.target.value); paintBlizzard(); }
        if (e.target.matches('[data-wx-wind]')) { sc.wind = Number(e.target.value); paintBlizzard(); }
      });
    },
    sub(s) { if (W.tabs.some((x) => x.id === s)) shell.tab(s); },
    /* the storm keeps clear of the controls and the caption */
    tick() {
      const pr = shell.pane.getBoundingClientRect(), cap = document.querySelector('.play-cap'), el = $('.wx', shell.pane);
      let b = pr.bottom;
      if (cap && !cap.hidden && cap.offsetHeight) b = Math.min(b, cap.getBoundingClientRect().top);
      let right = 0;
      if (el) { const r = el.getBoundingClientRect(); if (r.width > pr.width * 0.6) b = Math.min(b, r.top); else if (r.left > pr.left + pr.width * 0.5) right = r.left - pr.left - 16; }
      sc.bottom = b - pr.top - 10; sc.right = sc.mode === 'hurricane' ? right : 0;
    },
    onScene(r) { if (r && r.fact) shell.show({ kind: r.title, text: r.fact, lang: 'en-GB' }, true); }
  };
  return W;
}

/* ================= the list ================= */
const MAKERS = {
  birds: natureWin, flies: natureWin, space: natureWin, aurora: natureWin,
  explorer: explorerWin, festivals: festivalsWin, wonders: wondersWin, records: recordsWin, malaysia: malaysiaWin,
  seasons: seasonsWin, weather: weatherWin
};
Object.keys(D.BIOMES).forEach((k) => { MAKERS[k] = biomeWin; });
/* shell: { pane, lang(), overlay(html, label), say(text, lang), show(item, speak), setSub(sub), tab(id) } */
export function makeWindow(id, shell) {
  const make = MAKERS[id];
  if (!make) return null;
  seen = new Map();
  const w = make(shell, id);
  w.openQuiz = (name) => openQuiz(shell, w.quiz, shell.lang() === 'ms' && w.bm, name);
  w.openSources = (name) => openSources(shell, w.sources, name);
  return w;
}
