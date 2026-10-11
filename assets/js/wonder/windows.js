/* Wonder Window's windows. Each one is a live scene on the big canvas plus what sits on top of it: cards with real
   photos, the World Explorer postcard, the seasons and weather controls, the speed race. Every window has a caption
   that Symphony reads (facts, then "wonder questions"), a quiz the class can answer together or vote on from their
   own devices, and a "For teachers" panel listing where the facts and photos come from.
   play.js is the frame around them: the picker, the top bar, the caption, sound and full screen. */
import { $, $$, esc, icon } from '../core.js?v=7a165bee';
import { sfx } from '../fx/audio.js?v=7a165bee';
import { Voice } from '../fx/voice.js?v=7a165bee';
import { leadPicture, creditFor, picURL, creditText } from '../pics.js?v=7a165bee';
import { openMoment } from '../moments.js?v=7a165bee';
import * as D from './data.js?v=7a165bee';
import { NATURE, Pad } from './nature.js?v=7a165bee';
import { explorer } from './map.js?v=7a165bee';
import { makeBiome } from './biomes.js?v=7a165bee';
import { weather, feelsLike } from './weather.js?v=7a165bee';
import { seasons, PLACES, MONTHS, dateOf, dayOfYear, seasonOf, daylight } from './seasons.js?v=7a165bee';
import { TAU, rnd, layer, flag, hm } from './util.js?v=7a165bee';

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
function lazyPhotos(root, scroller) {
  const els = $$('[data-wiki]', root);
  if (!('IntersectionObserver' in window)) { els.forEach((e) => photoInto(e, e.dataset.wiki, 500)); return () => {}; }
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); photoInto(en.target, en.target.dataset.wiki, 500); } }), { root: scroller || null, rootMargin: '300px' });
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}

/* ---------------- a big card: photo, facts, read aloud, previous and next ---------------- */
function openCard(shell, c) {
  const ms = c.lang === 'ms';
  const rows = (c.rows || []).filter((r) => r && r[1]).map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('');
  const el = shell.overlay('<article class="wo-card wd" data-ctx>' +
    '<button type="button" class="pbtn wo-x" data-wo-x aria-label="' + (ms ? 'Tutup' : 'Close') + '">' + icon('close') + '</button>' +
    '<figure class="wd-ph"' + (c.wiki ? ' data-wiki="' + esc(c.wiki) + '"' : '') + '><span class="wd-e" aria-hidden="true">' + esc(c.e || '✨') + '</span><figcaption class="ph-cr" hidden></figcaption></figure>' +
    '<div class="wd-b"><small class="wd-k">' + esc(c.sub || '') + '</small><h2>' + esc(c.title) + '</h2>' + (rows ? '<dl class="wd-rows">' + rows + '</dl>' : '') +
    (c.text ? '<p class="wd-t">' + esc(c.text) + '</p>' : '') +
    '<div class="wd-btns"><button type="button" class="btn small" data-wd-say>' + icon('volume') + (ms ? 'Baca' : 'Read aloud') + '</button>' + (c.extra || '') +
    (c.nav ? '<span class="wd-nav"><button type="button" class="pbtn" data-wd-nav="-1" aria-label="' + (ms ? 'Sebelumnya' : 'Previous') + '">' + icon('left') + '</button><button type="button" class="pbtn" data-wd-nav="1" aria-label="' + (ms ? 'Seterusnya' : 'Next') + '">' + icon('right') + '</button></span>' : '') +
    '</div></div></article>', c.title);
  if (c.wiki) photoInto($('.wd-ph', el), c.wiki, 960, true);
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

/* ---------------- a soft moving background for the card windows ---------------- */
function backdrop(c1, c2) {
  return {
    id: 'backdrop',
    init(w, h) { this.w = w; this.h = h; this.bg = null; this.b = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(60, 200), v: rnd(0.006, 0.02), p: rnd(0, TAU), c: Math.random() < 0.5 ? c1 : c2 })); },
    resize(w, h) { this.w = w; this.h = h; this.bg = null; },
    step(dt) { this.b.forEach((b) => { b.y -= b.v * dt; if (b.y < -0.25) b.y = 1.25; }); },
    draw(ctx, w, h, t) {
      if (!this.bg) { this.bg = layer(w, h); const g = this.bg.getContext('2d'), gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#070A18'); gr.addColorStop(1, '#141A33'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      ctx.drawImage(this.bg, 0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      this.b.forEach((b) => { const x = b.x * w + Math.sin(t * 0.2 + b.p) * 40, y = b.y * h, g = ctx.createRadialGradient(x, y, 0, x, y, b.r); g.addColorStop(0, b.c + '30'); g.addColorStop(1, b.c + '00'); ctx.fillStyle = g; ctx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2); });
      ctx.restore();
    }
  };
}

/* ---------------- a grid of cards over the backdrop ---------------- */
function grid(shell, head, cards, open) {
  shell.pane.innerHTML = '<div class="wg-wrap"><div class="wg-in">' + head + '<div class="wg">' + cards + '</div></div></div>';
  const wrap = $('.wg-wrap', shell.pane), stop = lazyPhotos(wrap, wrap);
  wrap.addEventListener('click', (e) => { const c = e.target.closest('[data-i]'); if (c) open(Number(c.dataset.i)); });
  return stop;
}
const head = (h, p) => '<header class="wg-h"><h2>' + esc(h) + '</h2>' + (p ? '<p>' + esc(p) + '</p>' : '') + '</header>';
const cardHTML = (i, wiki, e, kick, name, sub, tag) => '<button type="button" class="wc" data-i="' + i + '"><span class="wc-ph"' + (wiki ? ' data-wiki="' + esc(wiki) + '"' : '') + '><span class="wc-e" aria-hidden="true">' + e + '</span></span>' +
  '<span class="wc-b">' + (kick ? '<small class="wc-k">' + esc(kick) + '</small>' : '') + '<b>' + esc(name) + '</b>' + (sub ? '<span class="wc-s">' + esc(sub) + '</span>' : '') + '</span>' + (tag ? '<span class="wc-tag' + (tag[1] ? ' ' + tag[1] : '') + '">' + esc(tag[0]) + '</span>' : '') + '</button>';
/* Bars to compare heights, lengths or speeds; refs (a pupil, a bus) are drawn differently. */
function barsHTML(rows) {
  const max = Math.max(...rows.map((r) => r.v));
  return '<div class="wbar">' + rows.map((r) => '<div class="wbar-r' + (r.ref ? ' ref' : '') + '"><span class="wbar-n">' + (r.e ? '<span class="wbar-e" aria-hidden="true">' + r.e + '</span>' : '') + '<span>' + esc(r.name) + '</span></span>' +
    '<span class="wbar-t"><i style="--w:' + Math.max(0.5, r.v / max * 100).toFixed(2) + '%"></i></span><b class="wbar-v">' + esc(r.label) + '</b></div>').join('') + '</div>';
}
const growBars = (root) => requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('.wbar', root); if (b) b.classList.add('go'); }));
const metres = (n) => (n < 1 ? Math.round(n * 100) + ' cm' : String(n).replace(/\.0$/, '') + ' m');

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

/* ---------- World Explorer: the map and a postcard from each city ---------- */
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
function postcardHTML(c) {
  const f = flag(c.flag);
  return '<header class="pcd-top">' + (f ? '<span class="pcd-flag" aria-hidden="true">' + f + '</span>' : '<span class="pcd-flag" aria-hidden="true">📍</span>') +
    '<div class="pcd-name"><h2>' + esc(c.name) + '</h2><small>' + esc(c.country) + '</small></div><button type="button" class="pbtn" data-pc-x aria-label="Close the postcard">' + icon('close') + '</button></header>' +
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
  let city = null, tickT = 0, pcd = null;
  const byId = (id) => list.find((c) => c.id === id);
  const dock = () => (shell.pane.clientWidth >= 980 && city ? Math.min(440, Math.round(shell.pane.clientWidth * 0.34)) + 24 : 0);
  const mapB = () => shell.pane.style.setProperty('--map-b', Math.round(sc.goal.y + sc.goal.h + 10) + 'px');      // narrow screens: controls under the map
  function clock() {
    if (!city || !pcd) return;
    const now = new Date();
    try {
      $('.pcd-clock', pcd).textContent = new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now) + ', ' + new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, weekday: 'long' }).format(now);
      const hr = Number(new Intl.DateTimeFormat('en-GB', { timeZone: city.tz, hour: 'numeric', hourCycle: 'h23' }).format(now)), lt = sc.light(city);
      $('.pcd-dn', pcd).textContent = lt > 0.05 ? '☀️ Daytime there' : lt < -0.1 ? '🌙 Night time there' : hr < 12 ? '🌅 Sunrise there' : '🌇 Sunset there';
      $('.pcd-diff', pcd).textContent = diffText(aheadBy(city.tz, now));
    } catch (e) { $('.pcd-clock', pcd).textContent = ''; }
  }
  function pick(id, user) {
    const c = byId(id);
    if (!c) return;
    city = c; sc.select(c.id);
    pcd.innerHTML = postcardHTML(c); pcd.hidden = false; pcd.scrollTop = 0;
    $$('[data-wiki]', pcd).forEach((f) => photoInto(f, f.dataset.wiki, 500, true));
    clock();
    const sel = $('.ex-sel', shell.pane); if (sel) sel.value = c.id;
    sc.setDock(dock());
    shell.show({ kind: c.name + ', ' + c.country, text: c.fact, lang: 'en-GB' }, false);
    shell.setSub(c.id);
    if (user) sfx('pop', 2);
  }
  function close() { city = null; sc.select(null); if (pcd) { pcd.hidden = true; pcd.innerHTML = ''; } sc.setDock(0); shell.setSub(''); const sel = $('.ex-sel', shell.pane); if (sel) sel.value = ''; }
  return {
    scene: sc, pad: true, sound: '', quiz: 'world', sources: 'world',
    caption: () => items(D.CAPTIONS.explorer.facts, D.CAPTIONS.explorer.wonders),
    mount() {
      shell.pane.innerHTML = '<div class="ex-ctl"><label class="ex-l"><span>Choose a city</span><select class="ex-sel" aria-label="Choose a city"><option value="">All 24 cities…</option>' +
        order.map((c) => '<option value="' + c.id + '">' + esc(c.name + ', ' + c.country) + '</option>').join('') + '</select></label>' +
        '<button type="button" class="btn small" data-ex-rnd aria-label="Surprise me: a city at random">🎲<span class="ex-w"> Surprise me</span></button></div><aside class="pcd" hidden aria-label="City postcard" data-ctx></aside>';
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
    unmount() { city = null; sc.select(null); sc.setDock(0); },
    escape() { if (!city) return false; close(); return true; },
    resized() { sc.setDock(dock()); mapB(); },
    onScene(r) { if (r && r.city) pick(r.city, true); },
    sub(s) { if (byId(s)) pick(s, false); },
    arrow(d) { if (city) { const i = order.indexOf(city); pick(order[(i + d + order.length) % order.length].id, true); } },
    tick(dt) { tickT += dt; if (tickT >= 1) { tickT = 0; clock(); } },
    context() { return city ? 'The World Explorer postcard for ' + city.name + ', ' + city.country + ' is open.' : ''; }
  };
}

/* ---------- Festivals ---------- */
function festivalsWin(shell) {
  const list = D.FESTIVALS, now = new Date().getMonth();
  const open = (i) => {
    const f = list[i];
    openCard(shell, { title: f.name, sub: 'Festivals', e: f.icon, wiki: f.wiki, text: f.what, rows: [['Where', f.where], ['When', f.when], ['Food', f.food], ['Greeting', f.hello]],
      extra: '<button type="button" class="btn small" data-hear data-say="' + esc(f.hello) + '" data-lang="' + esc(f.hl || 'en-GB') + '">' + icon('chat') + 'Say the greeting</button>',
      nav: (d) => open((i + d + list.length) % list.length) });
  };
  let stop = null;
  return {
    scene: backdrop('#F59E0B', '#EC4899'), sound: 'market', quiz: 'festivals', sources: 'festivals',
    caption: () => items(D.CAPTIONS.festivals.facts, D.CAPTIONS.festivals.wonders),
    mount() { stop = grid(shell, head('Festivals around the world', 'Tap a festival to see how people celebrate it.'), list.map((f, i) => cardHTML(i, f.wiki, f.icon, f.when, f.name, f.where, D.FESTIVAL_MONTHS[f.id] === now ? ['This month', 'hot'] : null)).join(''), open); },
    unmount() { if (stop) stop(); },
    sub(s) { const i = list.findIndex((f) => f.id === s); if (i >= 0) open(i); }
  };
}

/* ---------- The Seven Wonders ---------- */
function wondersWin(shell) {
  let stop = null, tab = 'ancient';
  const listOf = (set) => D.WONDERS.filter((x) => x.set === set);
  const open = (set, i) => {
    const l = listOf(set), x = l[i];
    openCard(shell, { title: x.name, sub: set === 'ancient' ? 'Seven Wonders of the Ancient World' : 'New Seven Wonders of the World', e: x.icon, wiki: x.wiki, text: x.text,
      rows: [['Where', x.where], ['Built', x.built], ['Height', x.h ? 'About ' + x.h + ' metres' : ''], ['Still standing?', x.standing ? 'Yes' : 'No']], nav: (d) => open(set, (i + d + l.length) % l.length) });
  };
  const W = {
    scene: backdrop('#D4A44C', '#6D5BD0'), sound: 'wind', quiz: 'wonders', sources: 'wonders',
    tabs: [{ id: 'ancient', name: 'Ancient seven' }, { id: 'new', name: 'New seven' }, { id: 'tall', name: 'How tall?' }], tab,
    caption: () => items(D.CAPTIONS.wonders.facts, D.CAPTIONS.wonders.wonders),
    setTab(id) {
      if (stop) stop(); stop = null;
      tab = W.tab = id;
      if (id === 'tall') {
        const rows = D.WONDERS.filter((x) => x.h).map((x) => ({ name: x.name, e: x.icon, v: x.h, label: 'about ' + x.h + ' m' })).concat(D.SIZE_REFS.map((r) => ({ name: r.name, e: r.icon, v: r.h, label: metres(r.h), ref: true }))).sort((a, b) => b.v - a.v);
        shell.pane.innerHTML = '<div class="wg-wrap"><div class="wg-in">' + head('How tall are the wonders?', 'Next to Big Ben’s tower, a double-decker bus and you. Heights are about, and rounded.') + barsHTML(rows) +
          '<p class="fine wg-note">The Great Pyramid was about 147 metres tall when it was built; its top stones have gone. Nobody knows how tall the Hanging Gardens or the Temple of Artemis were, and Machu Picchu is a whole town on a mountain.</p></div></div>';
        growBars(shell.pane);
        return;
      }
      const l = listOf(id);
      stop = grid(shell, head(id === 'ancient' ? 'Seven Wonders of the Ancient World' : 'New Seven Wonders of the World', id === 'ancient' ? 'Listed by travellers in ancient Greece. Only one is still standing.' : 'Chosen in 2007 by millions of votes from around the world.'),
        l.map((x, i) => cardHTML(i, x.wiki, x.icon, x.where + ' · ' + x.built, x.name, '', x.standing ? ['Still standing', 'ok'] : ['Gone', 'gone'])).join(''), (i) => open(id, i));
    },
    unmount() { if (stop) stop(); },
    sub(s) { if (W.tabs.some((x) => x.id === s)) shell.tab(s); }
  };
  return W;
}

/* ---------- Animal record breakers, the speed race and "How big?" ---------- */
function recordsWin(shell) {
  let stop = null, tab = 'cards', raceT = 0;
  const list = D.RECORDS;
  const open = (i) => { const r = list[i]; openCard(shell, { title: r.name, sub: r.title, e: r.icon, wiki: r.wiki, text: r.text, rows: [['Record', r.title], ['How much?', r.value]], nav: (d) => open((i + d + list.length) % list.length) }); };
  function race() {
    const lanes = $$('.wrace-run', shell.pane);
    if (!lanes.length) return;
    clearTimeout(raceT);
    $$('.wrace-v', shell.pane).forEach((v) => { v.hidden = true; });
    lanes.forEach((r) => { r.style.transition = 'none'; r.style.transform = 'translateX(0)'; });
    void shell.pane.offsetWidth;
    const track = $('.wrace-lane .wrace-way', shell.pane), room = track ? track.clientWidth - 56 : 300;
    lanes.forEach((r) => { r.style.transition = 'transform 4s linear'; r.style.transform = 'translateX(' + Math.round(Number(r.dataset.k) / 300 * room) + 'px)'; });
    const go = $('[data-rc-go]', shell.pane); if (go) go.innerHTML = icon('refresh') + 'Race again';
    sfx('whoosh');
    raceT = setTimeout(() => {
      $$('.wrace-v', shell.pane).forEach((v) => { v.hidden = false; });
      sfx('success');
      shell.show({ kind: 'Speed race', text: 'The peregrine falcon wins: it dives at over 300 km/h! The cheetah is the fastest runner, and the snail has hardly moved.', lang: 'en-GB' }, true);
    }, 4100);
  }
  const W = {
    scene: backdrop('#F97316', '#22C55E'), sound: '', quiz: 'records', sources: 'records',
    tabs: [{ id: 'cards', name: 'Record breakers' }, { id: 'race', name: 'Speed race' }, { id: 'big', name: 'How big?' }], tab,
    caption: () => items(D.CAPTIONS.records.facts, D.CAPTIONS.records.wonders),
    setTab(id) {
      if (stop) stop(); stop = null; clearTimeout(raceT);
      tab = W.tab = id;
      if (id === 'race') {
        shell.pane.innerHTML = '<div class="wg-wrap"><div class="wg-in">' + head('Speed race', 'Everyone sets off together and goes for the same few seconds. Who gets furthest?') +
          '<div class="wrace">' + D.RACE.map((r) => '<div class="wrace-lane"><span class="wrace-name">' + esc(r.name) + '</span><span class="wrace-way"><span class="wrace-run" data-k="' + r.kmh + '"><span class="wrace-e" aria-hidden="true">' + r.e + '</span></span><i class="wrace-fin" aria-hidden="true"></i></span><b class="wrace-v" hidden>' + esc(r.say) + '</b></div>').join('') + '</div>' +
          '<div class="wrace-btns"><button type="button" class="btn primary" data-rc-go>' + icon('play') + 'Start the race</button></div>' +
          '<p class="fine wg-note">The falcon’s speed is for its dive; the others run or drive on the flat. Usain Bolt’s is his top speed in a 100-metre race.</p></div></div>';
        return;
      }
      if (id === 'big') {
        const rows = list.filter((r) => /^m (long|tall)$/.test(r.unit)).map((r) => ({ name: r.name, e: r.icon, v: r.n, label: metres(r.n) + ' ' + r.unit.slice(2) }))
          .concat(D.BIG_REFS.map((r) => ({ name: r.name, e: r.e, v: r.m, label: metres(r.m) + ' ' + r.how, ref: true }))).sort((a, b) => b.v - a.v);
        shell.pane.innerHTML = '<div class="wg-wrap"><div class="wg-in">' + head('How big?', 'The longest and tallest record breakers, next to a bus and you.') + barsHTML(rows) + '</div></div>';
        growBars(shell.pane);
        return;
      }
      stop = grid(shell, head('Animal record breakers', 'Tap an animal to find out its record.'), list.map((r, i) => cardHTML(i, r.wiki, r.icon, r.title, r.name, r.value)).join(''), open);
    },
    mount() { shell.pane.addEventListener('click', (e) => { if (e.target.closest('[data-rc-go]')) race(); }); },
    unmount() { if (stop) stop(); clearTimeout(raceT); },
    sub(s) { if (W.tabs.some((x) => x.id === s)) shell.tab(s); }
  };
  return W;
}

/* ---------- Wonders of Malaysia, in English or Bahasa Melayu ---------- */
function malaysiaWin(shell) {
  let stop = null;
  const list = D.MALAYSIA;
  const open = (i) => {
    const m = list[i], ms = shell.lang() === 'ms';
    openCard(shell, { title: ms ? m.bmName : m.name, sub: ms ? 'Keajaiban Malaysia' : 'Wonders of Malaysia', e: m.icon, wiki: m.wiki, text: ms ? m.bm : m.text, lang: ms ? 'ms' : 'en', nav: (d) => open((i + d + list.length) % list.length) });
  };
  const render = () => {
    if (stop) stop();
    const ms = shell.lang() === 'ms';
    stop = grid(shell, ms ? head('Keajaiban Malaysia', 'Tekan satu kad untuk mengetahui lebih lanjut.') : head('Wonders of Malaysia', 'Tap a card to find out more. Tap BM for Bahasa Melayu.'),
      list.map((m, i) => cardHTML(i, m.wiki, m.icon, ms ? m.name : m.bmName, ms ? m.bmName : m.name, '')).join(''), open);
  };
  return {
    scene: backdrop('#10B981', '#EF4444'), sound: 'forest', bm: true, quiz: 'malaysia', sources: 'malaysia',
    caption: (ms) => items(D.CAPTIONS.malaysia.facts, D.CAPTIONS.malaysia.wonders, ms),
    mount: render, setLang: render,
    unmount() { if (stop) stop(); },
    sub(s) { const i = list.findIndex((m) => m.id === s); if (i >= 0) open(i); }
  };
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
  const SOUND = { hurricane: 'wind', storm: 'rain', monsoon: 'rain', blizzard: 'wind' };
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
