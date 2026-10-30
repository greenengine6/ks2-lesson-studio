/* What is on the screen right now, in a few lines, so Symphony can answer about it ("explain this slide", "give me a
   question about this", "what are we learning?"). Only what the class can already see is used: answers that are
   still hidden stay hidden (the browser leaves hidden text out of what is read here). */
import { $, $$, bus } from './core.js?v=3c9d4698';

const shown = (el) => !!el && !el.hidden && !el.closest('[hidden]');
const squash = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);
/* A slide's own words: its title and body (not the footer or the labels). */
function words(f) {
  if (!f) return '';
  const sl = f.querySelector('.sl');
  if (!sl) return f.innerText;
  return [sl.querySelector('.sl-title'), sl.querySelector('.sl-body')].filter(Boolean).map((x) => x.innerText).join('. ');
}
/* What pupils can see on the board, as plain text for their devices: the slide's own words only. It walks what is
   actually drawn, so anything not displayed, invisible, see-through or blurred is left out: answers not yet revealed,
   guided steps still to come, speaker notes. Controls, the respond pill and picture credits are left out too. */
const SKIP_BOARD = 'script,style,template,noscript,button,input,select,textarea,svg,canvas,video,audio,iframe,figcaption,img,' +
  '.sl-respond,.sl-foot,.sl-edge,.sl-kind,.mo-n,.lk-play,.wans:not(.on),.sans,.ssay,[hidden],[aria-hidden="true"]';
const BLOCKS = /^(P|DIV|LI|H[1-6]|TR|TD|TH|SECTION|ARTICLE|HEADER|FOOTER|UL|OL|BLOCKQUOTE|FIGURE|DL|DT|DD|TABLE|BR)$/;
const unseen = (cs) => cs.display === 'none' || cs.visibility !== 'visible' || Number(cs.opacity) < 0.15 || /blur\(/.test(cs.filter || '') || /rgba\([^)]*,\s*0\)$/.test(cs.color || '');
export function boardWords(frame, max) {
  if (!frame) return '';
  const root = frame.querySelector('.sl') || frame, out = [];
  (function walk(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (n.nodeValue.trim()) out.push(n.nodeValue.replace(/\s+/g, ' ')); continue; }
      if (n.nodeType !== 1 || n.matches(SKIP_BOARD)) continue;
      const cs = getComputedStyle(n);
      if (unseen(cs)) continue;
      const block = BLOCKS.test(n.tagName) || /^(block|flex|grid|list-item|table)/.test(cs.display);
      if (block) out.push('\n');
      walk(n);
      if (block) out.push('\n');
    }
  })(root);
  const text = out.join('').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  const cap = max || 700;
  return text.length > cap ? text.slice(0, cap - 1).replace(/\s+\S*$/, '') + '…' : text;
}
/* The slide's picture for pupils' devices: only a free Wikimedia picture that is showing (never an uploaded one). */
export function boardPicture(frame) {
  if (!frame) return '';
  for (const im of frame.querySelectorAll('img')) {
    const src = String(im.getAttribute('src') || '');                  // (a picture still loading has no size yet)
    if (!/^https:\/\/upload\.wikimedia\.org\/[^\s"'<>]{4,380}$/.test(src) || im.closest('.gone,[hidden],[aria-hidden="true"],.lk-vid')) continue;
    if (unseen(getComputedStyle(im)) || (im.parentElement && unseen(getComputedStyle(im.parentElement)))) continue;
    return src;
  }
  return '';
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
