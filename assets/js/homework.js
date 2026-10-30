/* The pupils' homework page (homework/): opened from the link or QR code the teacher shares. No sign-in and nothing
   is stored: the homework travels inside the link itself (after the #), and this page needs no network.
   Pupils, or their parents, see what to do and when it is due, hear it read aloud, and add it to their own phone's
   calendar (an .ics file for iPhone and most phones, or Google Calendar on Android), with a reminder at 6 pm the
   evening before. If the teacher shared them, the class's online lesson times come too, each with a reminder
   10 minutes before. Every field in the link is treated as untrusted: text only, strict limits, real dates,
   https links only. */
import './viewport.js?v=49509700';
import { unpackLink } from './cal/link.js?v=49509700';
import { icsHomework, icsLessons, homeworkEvent, googleCalLink, downloadText, isDate, isTime, isHttps, subjectLabel, addDays } from './ics.js?v=49509700';
import { fractify } from './fractions.js?v=49509700';

const COLOURS = { maths: '#4F5BD5', english: '#C7356F', science: '#2E7D4F', computing: '#C2581A', history: '#9A6A00', geography: '#2B76C6', art: '#8B44C2', dt: '#4B6475', music: '#A63E91', pe: '#0B7F99', pshe: '#D4566F', re: '#6B5B2E', bm: '#1F7A75', mandarin: '#B42020', french: '#3949AB', spanish: '#B7791F', general: '#5B52E6' };
const PATHS = {
  book: '<path d="M5 4.5h10.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h10.5"/><path d="M9 8.5h5"/>',
  maths: '<path d="M12 3.5 16.5 11h-9z"/><rect x="4" y="13.5" width="7" height="7" rx="1.4"/><circle cx="16.8" cy="17" r="3.6"/>',
  english: '<path d="M3 6.4C6 4.9 9 4.9 12 6.9c3-2 6-2 9-.5v12.5c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6.9v12.5"/>',
  science: '<path d="M9.5 3.5h5"/><path d="M10.5 3.5v5.2L5 18.2a1.8 1.8 0 0 0 1.6 2.7h10.8a1.8 1.8 0 0 0 1.6-2.7l-5.5-9.5V3.5"/><path d="M7.6 14.5h8.8"/>',
  geography: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  speak: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5 21 8v8l-5-2.5z"/>',
  google: '<path d="M20.5 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.6-3.9 2.6-6.5z"/><path d="M12 21c2.4 0 4.5-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.3A9 9 0 0 0 12 21z"/><path d="M7 13.8a5.4 5.4 0 0 1 0-3.6V7.9H4a9 9 0 0 0 0 8.2z"/><path d="M12 6.5c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 4 7.9l3 2.3c.7-2.1 2.7-3.7 5-3.7z"/>',
  heart: '<path d="M12 21.2C5.4 16.9 2.3 13.2 2.3 9.1 2.3 6.2 4.5 4 7.3 4c1.9 0 3.5 1 4.7 2.7C13.2 5 14.8 4 16.7 4c2.8 0 5 2.2 5 5.1 0 4.1-3.1 7.8-9.7 12.1z"/>'
};
const SUBJ_ICON = { maths: 'maths', english: 'english', science: 'science', geography: 'geography', history: 'book', bm: 'english', mandarin: 'english', french: 'english', spanish: 'english' };

/* ---------------- small helpers (no innerHTML with anything from the link) ---------------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function ico(name) {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('class', 'i'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  const tpl = new DOMParser().parseFromString('<svg xmlns="' + SVGNS + '">' + (PATHS[name] || PATHS.book) + '</svg>', 'image/svg+xml');
  Array.from(tpl.documentElement.childNodes).forEach((n) => s.appendChild(document.importNode(n, true)));
  return s;
}
function h(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const clip = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f‪-‮⁦-⁩]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, n) : '');
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => ymd(new Date());
function words(date, o) { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', Object.assign({ weekday: 'long', day: 'numeric', month: 'long' }, o || {})); }
function time12(t) { const [hh, mm] = t.split(':').map(Number); return (((hh + 11) % 12) + 1) + ':' + pad(mm) + (hh < 12 ? ' am' : ' pm'); }
const subjName = (id) => subjectLabel(id) || 'Homework';

/* ---------------- reading the link ---------------- */
function cleanHomework(x) {
  if (!x || typeof x !== 'object' || !isDate(x.u)) return null;
  const t0 = today();
  if (x.u > addDays(t0, 400) || x.u < addDays(t0, -400)) return null;               // a far-off date: not a real homework link
  const subject = Object.prototype.hasOwnProperty.call(COLOURS, x.s) ? x.s : 'general';
  return {
    id: clip(x.i, 40).replace(/[^A-Za-z0-9_-]/g, '') || 'hw' + x.u.replace(/-/g, ''), subject, cls: clip(x.c, 40), year: /^(Year [3-6]|KS2)$/.test(x.y) ? x.y : '',
    title: clip(x.t, 120), details: typeof x.d === 'string' ? x.d.replace(/[\u0000-\u0008\u000b-\u001f\u007f‪-‮⁦-⁩]/g, '').trim().slice(0, 600) : '',
    set: isDate(x.a) ? x.a : '', due: x.u, dueTime: isTime(x.m) ? x.m : '', link: isHttps(x.l) ? new URL(x.l).href : ''
  };
}
function cleanLesson(x) {
  if (!x || typeof x !== 'object' || !isDate(x.d) || !isTime(x.b)) return null;
  const t0 = today();
  if (x.d > addDays(t0, 120) || x.d < addDays(t0, -30)) return null;
  return { date: x.d, start: x.b, end: isTime(x.e) ? x.e : '', subject: Object.prototype.hasOwnProperty.call(COLOURS, x.s) ? x.s : 'general', title: clip(x.t, 120), cls: clip(x.c, 40), link: isHttps(x.l) ? new URL(x.l).href : '' };
}

/* ---------------- the page ---------------- */
const app = document.getElementById('app');
let NAME = '';
function readAloud(text) {
  if (!('speechSynthesis' in window)) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => /^en-GB/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
function say(msg) { const s = document.getElementById('hw-status'); if (s) { s.textContent = msg; s.hidden = !msg; } }
function fileName(hw) { const [y, m, d] = hw.due.split('-').map(Number); return 'Homework - ' + subjName(hw.subject) + ' - ' + new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '.ics'; }
function btn(cls, iconName, label) { const b = h('button', 'hw-btn ' + cls); b.type = 'button'; b.appendChild(ico(iconName)); b.appendChild(h('span', '', label)); return b; }
function linkBtn(cls, iconName, label, href) { const a = h('a', 'hw-btn ' + cls); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.appendChild(ico(iconName)); a.appendChild(h('span', '', label)); return a; }

function card(hw) {
  const past = hw.due < today();
  const c = h('section', 'hw-card');
  c.style.setProperty('--c', COLOURS[hw.subject]);
  const band = h('div', 'hw-band');
  const well = h('span', 'hw-ico'); well.appendChild(ico(SUBJ_ICON[hw.subject] || 'book')); band.appendChild(well);
  band.appendChild(h('span', 'hw-subj', subjName(hw.subject) === 'Homework' ? 'Homework' : subjName(hw.subject) + ' homework'));
  if (hw.cls || hw.year) band.appendChild(h('span', 'hw-cls', [hw.cls, hw.year].filter(Boolean).join(' · ')));
  c.appendChild(band);
  c.appendChild(h('h2', 'hw-title', hw.title || (subjName(hw.subject) === 'Homework' ? 'Your homework' : subjName(hw.subject) + ' homework')));
  const due = h('p', 'hw-due' + (past ? ' is-past' : ''));
  due.appendChild(ico('cal'));
  due.appendChild(h('b', '', (past ? 'Was due ' : 'Due ') + words(hw.due) + (hw.dueTime ? ' by ' + time12(hw.dueTime) : '')));
  c.appendChild(due);
  if (hw.details) c.appendChild(h('p', 'hw-details', hw.details));
  if (hw.link) { const a = linkBtn('hw-link', 'link', 'Open the link: ' + new URL(hw.link).hostname, hw.link); c.appendChild(a); }
  const acts = h('div', 'hw-acts');
  if (!past) {
    const add = btn('primary', 'plus', 'Add to my calendar');
    add.addEventListener('click', () => {
      downloadText(icsHomework(hw, { name: NAME }), fileName(hw));
      say('Saved. On an iPhone: open the file, then tap Add. A reminder comes at 6 pm the evening before.');
    });
    acts.appendChild(add);
    const g = googleCalLink(homeworkEvent(hw, { name: NAME }));
    if (g) { const gb = linkBtn('soft', 'google', 'Add to Google Calendar', g); gb.dataset.g = hw.id; acts.appendChild(gb); }
  }
  const rd = btn('ghost', 'speak', 'Read it to me');
  rd.addEventListener('click', () => {
    const text = (subjName(hw.subject) === 'Homework' ? 'Homework. ' : subjName(hw.subject) + ' homework. ') + (hw.title ? hw.title + '. ' : '') + (past ? 'It was due ' : 'It is due ') + words(hw.due) + (hw.dueTime ? ' by ' + time12(hw.dueTime) : '') + '. ' + (hw.details || '');
    if (!readAloud(text)) say('This phone cannot read aloud here.');
  });
  acts.appendChild(rd);
  c.appendChild(acts);
  if (past) c.appendChild(h('p', 'hw-note', 'The due date has passed, so it cannot be added to the calendar.'));
  return c;
}
function lessonsCard(list) {
  const c = h('section', 'hw-card hw-lessons');
  c.style.setProperty('--c', '#5B52E6');
  const band = h('div', 'hw-band'); const well = h('span', 'hw-ico'); well.appendChild(ico('video')); band.appendChild(well); band.appendChild(h('span', 'hw-subj', 'Online lessons')); c.appendChild(band);
  c.appendChild(h('h2', 'hw-title', 'Your next online lessons'));
  const ol = h('ol', 'hw-ls');
  list.forEach((l) => {
    const li = h('li'); li.style.setProperty('--c', COLOURS[l.subject]);
    li.appendChild(h('b', '', words(l.date, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + time12(l.start)));
    li.appendChild(h('span', '', (subjectLabel(l.subject) || 'Lesson') + (l.title ? ': ' + l.title : '')));
    if (l.link) li.appendChild(linkBtn('hw-mini', 'video', 'Join', l.link));
    ol.appendChild(li);
  });
  c.appendChild(ol);
  const acts = h('div', 'hw-acts');
  const add = btn('primary', 'plus', 'Add all to my calendar');
  add.addEventListener('click', () => {
    downloadText(icsLessons(list.map((l, i) => Object.assign({ id: 'l' + i + '-' + l.date }, l)), { name: NAME }), 'Online lessons.ics');
    say('Saved. Each lesson has a reminder 10 minutes before it starts.');
  });
  acts.appendChild(add);
  c.appendChild(acts);
  return c;
}
function nameBox(onChange) {
  const d = h('details', 'hw-name');
  d.appendChild(h('summary', '', 'Put my name on it (optional)'));
  const lab = h('label', 'hw-fld'); lab.appendChild(h('span', '', 'Your first name'));
  const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 20; inp.autocomplete = 'off'; inp.autocapitalize = 'words'; inp.placeholder = 'For example: Aisyah';
  inp.addEventListener('input', () => { NAME = clip(inp.value, 20).replace(/[<>]/g, ''); onChange(); });
  lab.appendChild(inp); d.appendChild(lab);
  d.appendChild(h('p', 'hw-small', 'Your name goes only into the calendar entry on this phone. It is not sent or saved anywhere.'));
  return d;
}
function frame(children) {
  app.textContent = '';
  const main = h('main', 'hw-main');
  const top = h('header', 'hw-top');
  const logo = h('span', 'hw-logo'); logo.appendChild(ico('heart')); top.appendChild(logo);
  const id = h('span', 'hw-id'); id.appendChild(h('b', '', 'Homework')); id.appendChild(h('small', '', 'KS2 Lesson Engine')); top.appendChild(id);
  main.appendChild(top);
  children.forEach((c) => main.appendChild(c));
  const st = h('p', 'hw-status'); st.id = 'hw-status'; st.setAttribute('role', 'status'); st.hidden = true; main.appendChild(st);
  const foot = h('footer', 'hw-foot'); foot.appendChild(h('span', '', 'Made with love by Rabinder Kaur. No sign-in, and nothing about you is stored.')); main.appendChild(foot);
  app.appendChild(main);
  fractify(main);
}
function broken(msg) {
  const c = h('section', 'hw-card hw-bad');
  c.appendChild(h('h1', 'hw-title', 'This link does not work'));
  c.appendChild(h('p', '', msg || 'It may be cut short or very old. Ask your teacher to share the homework again.'));
  frame([c]);
}
async function start() {
  const raw = await unpackLink(location.hash);
  if (!raw || raw.v !== 1) { broken(); return; }
  const hw = (Array.isArray(raw.hw) ? raw.hw.slice(0, 10) : []).map(cleanHomework).filter(Boolean);
  const ls = (Array.isArray(raw.ls) ? raw.ls.slice(0, 12) : []).map(cleanLesson).filter(Boolean).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1));
  if (!hw.length && !ls.length) { broken(Array.isArray(raw.hw) && raw.hw.length ? 'The homework in this link has a date that does not look right. Ask your teacher to share it again.' : ''); return; }
  const draw = () => {
    const kids = [];
    if (hw.length > 1) kids.push(h('h1', 'hw-h1', 'Your homework'));
    hw.forEach((x) => kids.push(card(x)));
    if (ls.length) kids.push(lessonsCard(ls));
    kids.push(nameBox(refreshLinks));
    kids.push(h('p', 'hw-help', 'On an iPhone: tap Add to my calendar, then open the file and tap Add. On an Android phone: tap Add to Google Calendar.'));
    frame(kids);
    if (hw.length === 1) document.title = (hw[0].title || subjName(hw[0].subject) + ' homework') + ' · Homework';
  };
  function refreshLinks() {
    hw.forEach((x) => { const a = app.querySelector('[data-g="' + x.id + '"]'); if (a) a.href = googleCalLink(homeworkEvent(x, { name: NAME })); });
  }
  draw();
}
window.addEventListener('hashchange', start);
start();
