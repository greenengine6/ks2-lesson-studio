/* What is on the screen right now, in a few lines, so Symphony can answer about it ("explain this slide", "give me a
   question about this", "what are we learning?"). Only what the class can already see is used: answers that are
   still hidden stay hidden (the browser leaves hidden text out of what is read here). */
import { $, $$, bus } from './core.js?v=1e9e4bc0';

const shown = (el) => !!el && !el.hidden && !el.closest('[hidden]');
const squash = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);
/* A slide's own words: its title and body (not the footer or the labels). */
function words(f) {
  if (!f) return '';
  const sl = f.querySelector('.sl');
  if (!sl) return f.innerText;
  return [sl.querySelector('.sl-title'), sl.querySelector('.sl-body')].filter(Boolean).map((x) => x.innerText).join('. ');
}
/* The open presentation, if any: which one, where it is, and the words on the current screen. */
export function presenting() {
  const lk = $('#lpresent'), ss = $('#spresent'), en = $('#present');
  if (shown(lk)) {
    const f = $('#lp-frame', lk), c = ($('#lp-count', lk) || {}).textContent || '';
    const [i, n] = c.split('/').map((x) => Number(x)) ;
    return { kind: 'lkie', i: i || 1, n: n || 1, frame: f, title: squash(($('.sl-foot span', f) || {}).textContent, 120), text: squash(words(f), 900) };
  }
  if (shown(ss)) {
    const f = $('#spr-frame'), c = ($('#spr-count') || {}).textContent || '';
    const [i, n] = c.split('/').map((x) => Number(x));
    return { kind: 'slides', i: i || 1, n: n || 1, frame: f, title: squash(($('.sl-foot span', f) || {}).textContent, 120), text: squash(words(f), 900) };
  }
  if (shown(en)) {
    const dots = $$('#pr-dots button'), cur = dots.findIndex((b) => b.getAttribute('aria-current') === 'true');
    const f = $('#pr-fit');
    return { kind: 'engine', i: cur + 1 || 1, n: dots.length || 1, frame: f, title: squash(($('#pr-name') || {}).textContent, 120), text: squash(f && f.innerText, 900) };
  }
  return null;
}
const PAGES = { home: 'the home page', slides: 'Slide Studio, where teachers make lesson slides', lkie: 'lkie.like, where teachers make whole lesson packs', admin: 'Rabinder’s dashboard', play: 'Wonder Window, the play area with windows on the world: cities, festivals, wonders, weather, seasons, habitats and space' };
export function page() { const m = /^#\/([\w-]+)/.exec(location.hash || ''); return m ? m[1] : 'home'; }
/* A few plain lines for Symphony's instructions. */
export function screenContext() {
  const p = presenting(), out = [];
  if (p) {
    out.push('The teacher is presenting to the class now: ' + (p.title || 'a lesson') + ', screen ' + p.i + ' of ' + p.n + '.');
    if (p.text) out.push('Words on the screen the class can see now: "' + p.text + '"');
    return out.join('\n');
  }
  const id = page();
  out.push('The teacher has ' + (PAGES[id] || 'a lesson engine (' + (document.title.split(' · ')[0] || id) + ')') + ' open.');
  const head = $('#view-' + (id === 'home' ? 'home' : id === 'slides' || id === 'lkie' || id === 'admin' ? id : 'engine') + ' .ltitle') || $('#view-engine .ltitle');
  if (head && shown(head)) out.push('The lesson on screen is "' + squash(head.textContent, 120) + '".');
  if (id === 'play') {
    bus.emit('play-context', out);                       // which window, what is open in it (play.js)
    const cap = $('.play-cap:not([hidden]) .play-txt p');
    if (cap && cap.textContent) out.push('Its caption says: "' + squash(cap.textContent, 300) + '"');
  }
  return out.join('\n');
}
