/* Reading support (Rabinder's points 3 and 11): a font that suits dyslexic readers, bigger text, wider spacing, a
   calmer background, a reading ruler and "tap to hear it". Each teacher's choice is kept on this device and applied
   to the whole site; "Slides and class screens too" (on by default) carries the font to what pupils see.
   Lexend is the default for everyone. No single font suits every dyslexic reader, so the others are a choice; the
   British Dyslexia Association's style guide asks for larger text, more spacing and a cream or pastel background,
   so those can all be changed here. */
import { store, bus } from './core.js?v=49509700';
import { who } from './people.js?v=49509700';
import { Voice } from './fx/voice.js?v=49509700';

const KEY = 'ks2-engine.reading.v1', LAST = 'ks2-engine.reading.last.v1';
export const FONTS = [
  { id: 'lexend', name: 'Lexend', note: 'Made for easier reading. The site’s font.', css: '"Lexend"', g: 'Lexend:wght@300;400;500;600;700;800' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', note: 'Very clear letters for low vision.', css: '"Atkinson Hyperlegible"', g: 'Atkinson+Hyperlegible:wght@400;700' },
  { id: 'andika', name: 'Andika', note: 'Shapes children learn to write: a and g as in handwriting.', css: '"Andika"', g: 'Andika:wght@400;700' },
  { id: 'comic', name: 'Comic Neue', note: 'Friendly and rounded, like Comic Sans.', css: '"Comic Neue"', g: 'Comic+Neue:wght@400;700' },
  { id: 'dyslexic', name: 'OpenDyslexic', note: 'Heavier bottoms, so letters do not flip.', css: '"OpenDyslexic"', g: '' },
  { id: 'classic', name: 'The old look', note: 'Plus Jakarta Sans and DM Sans.', css: '', g: 'DM+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@500;600;700;800' }
];
export const SIZES = [{ v: 1, name: 'Normal' }, { v: 1.12, name: 'Large' }, { v: 1.25, name: 'Extra large' }];
export const BACKS = [
  { id: 'grey', name: 'Soft grey', hex: '#E0E5EC' }, { id: 'cream', name: 'Cream', hex: '#F3ECDC' },
  { id: 'blue', name: 'Soft blue', hex: '#DCE8F5' }, { id: 'yellow', name: 'Soft yellow', hex: '#F6F0CC' }
];
const DEF = { font: 'lexend', size: 1, spacing: 'normal', bg: 'grey', ruler: false, tapread: false, slides: true };
const FB = '"Segoe UI",system-ui,-apple-system,sans-serif';

function key() { return KEY + '.' + (who.id || 'me'); }
export function getReading() {
  const v = store.getJSON(key(), null) || store.getJSON(LAST, null) || {};
  const r = Object.assign({}, DEF, v && typeof v === 'object' ? v : {});
  if (!FONTS.some((f) => f.id === r.font)) r.font = DEF.font;
  if (!SIZES.some((s) => s.v === Number(r.size))) r.size = DEF.size;
  if (!BACKS.some((b) => b.id === r.bg)) r.bg = DEF.bg;
  r.spacing = r.spacing === 'wide' ? 'wide' : 'normal';
  r.ruler = !!r.ruler; r.tapread = !!r.tapread; r.slides = r.slides !== false;
  r.size = Number(r.size);
  return r;
}
export function setReading(patch) {
  const r = Object.assign(getReading(), patch || {});
  store.setJSON(key(), r); store.setJSON(LAST, r);
  apply(r);
  bus.emit('reading', r);
  return r;
}

/* ---------------- applying it ---------------- */
const loaded = new Set(['lexend']);
function loadFont(f) {
  if (!f.g || loaded.has(f.id)) return;
  loaded.add(f.id);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap';
  document.head.appendChild(l);
}
/* Load every reading font (the Settings page shows each one in its own letters). */
export function loadFonts() { FONTS.forEach(loadFont); }
export function fontStack(id) {
  const f = FONTS.find((x) => x.id === id) || FONTS[0];
  if (f.id === 'classic') return { display: '"Plus Jakarta Sans","Poppins",' + FB, body: '"DM Sans","Inter",' + FB };
  return { display: f.css + ',' + FB, body: f.css + ',' + FB };
}
function apply(r) {
  const root = document.documentElement, f = FONTS.find((x) => x.id === r.font) || FONTS[0];
  loadFont(f);
  const st = fontStack(f.id);
  root.style.setProperty('--f-display', st.display);
  root.style.setProperty('--f-body', st.body);
  if (r.slides && f.id !== 'classic') root.style.setProperty('--f-kid', st.display); else root.style.removeProperty('--f-kid');
  root.style.setProperty('--t', String(r.size));
  root.setAttribute('data-rspace', r.spacing);
  root.setAttribute('data-rbg', r.bg);
  root.setAttribute('data-rfont', f.id);
  ruler(r.ruler);
  tapRead = r.tapread;
  document.body && document.body.classList.toggle('tap-read', tapRead);
}

/* ---------------- the reading ruler: a soft band that follows the pointer ---------------- */
let band = null, onMove = null;
function ruler(on) {
  if (on && !band) {
    band = document.createElement('div');
    band.className = 'rd-ruler'; band.setAttribute('aria-hidden', 'true');
    document.body.appendChild(band);
    onMove = (e) => {
      const t = e.touches && e.touches[0] ? e.touches[0] : e;
      if (!t || typeof t.clientY !== 'number') return;
      band.style.transform = 'translateY(' + Math.round(t.clientY - band.offsetHeight / 2) + 'px)';
      band.classList.add('on');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
  } else if (!on && band) {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('touchmove', onMove);
    band.remove(); band = null; onMove = null;
  }
}

/* ---------------- tap to hear it ---------------- */
let tapRead = false, lastRead = null;
const READABLE = 'p, li, h1, h2, h3, h4, td, th, dd, dt, blockquote, figcaption, .b-title, .b-sub, .sl-t, .sl-body, .pg-sub, .notice, .bubble';
function onTap(e) {
  if (!tapRead || e.defaultPrevented) return;
  const t = e.target;
  if (!t || !t.closest || t.closest('button, a, input, textarea, select, label, [contenteditable="true"], .present, .spresent, .play, .lkp, .modal, .symc, .rd-skip')) return;
  const elx = t.closest(READABLE);
  if (!elx) return;
  const text = (elx.innerText || elx.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return;
  if (lastRead === elx && Voice.speaking) { Voice.stop(); lastRead = null; return; }
  lastRead = elx;
  elx.classList.add('rd-reading');
  setTimeout(() => elx.classList.remove('rd-reading'), 1600);
  Voice.say(text.slice(0, 900), { lang: /[㐀-鿿]/.test(text) ? 'zh-CN' : 'en-GB', style: 'chat' });
}

/* Read a piece of text aloud for a "Read it to me" button anywhere. */
export function readAloud(text) { const t = String(text || '').trim(); if (t) Voice.say(t.slice(0, 900), { lang: 'en-GB', style: 'chat' }); }

export function initReading() {
  apply(getReading());
  document.addEventListener('click', onTap);
  bus.on('who', () => apply(getReading()));
}
