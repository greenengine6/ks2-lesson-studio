/* Sharing homework with the class: a link and a big QR code. Pupils or their parents open it on their phone and tap
   Add to my calendar. No names and no accounts: the link carries only the homework (and, if she ticks it, the class's
   online lesson times for the next two weeks, with the join link only if she ticks that too). While a live class is
   running, "Send to the class now" puts it on every pupil's device as well (live/tasks.js). */
import { $, esc, icon, toast, copyOut } from '../core.js?v=49509700';
import { qrSVG } from '../live/qr.js?v=49509700';
import { subjectName, subjectColor } from '../library.js?v=49509700';
import { addDays, toMin } from '../ics.js?v=49509700';
import { data, daySchedule, today, dateWords, weekStart, nowMin } from './store.js?v=49509700';
import { packLink, homeworkPage } from './link.js?v=49509700';
import { ci } from './views.js?v=49509700';

const short = (hw) => ({ i: hw.id, s: hw.subject, c: hw.cls, y: hw.year, t: hw.title, d: hw.details, a: hw.set, u: hw.due, m: hw.dueTime, l: hw.link });
/* The class's online lessons in the next 14 days (same class as the homework, or the same year group). */
export function onlineLessonsFor(hwList, withLink) {
  const cls = new Set(hwList.map((h) => h.cls).filter(Boolean)), years = new Set(hwList.map((h) => h.year).filter(Boolean));
  const out = [], start = today();
  for (let i = 0; i < 14 && out.length < 12; i++) {
    const date = addDays(start, i);
    daySchedule(date).forEach((x) => {
      if (x.kind !== 'lesson' || !x.online) return;
      if (i === 0 && toMin(x.end || x.start) <= nowMin()) return;
      if (cls.size ? !cls.has(x.cls) : years.size ? !years.has(x.year) : false) return;
      out.push({ s: x.subject, d: date, b: x.start, e: x.end, t: x.plan && x.plan.topic ? x.plan.topic : '', c: x.cls, l: withLink ? x.link : '' });
    });
  }
  return out.slice(0, 12);
}
export async function shareLink(hwList, o) {
  o = o || {};
  const payload = { v: 1, at: Date.now(), hw: hwList.slice(0, 10).map(short) };
  if (o.lessons) payload.ls = onlineLessonsFor(hwList, !!o.joinLinks);
  return homeworkPage() + '#' + (await packLink(payload));
}
/* Homework due in the week of `date` (Monday to Sunday). */
export function dueThisWeek(date) {
  const ws = weekStart(date || today()), we = addDays(ws, 6);
  return data().homework.filter((h) => h.due >= ws && h.due <= we).sort((a, b) => (a.due < b.due ? -1 : 1));
}

let tasks = null;
async function liveTasks() {
  if (tasks !== null) return tasks;
  try { tasks = await import('../live/tasks.js?v=49509700'); } catch (e) { tasks = false; }
  return tasks;
}

let big = null;
function showBig(svg, hwList) {
  if (big) big.remove();
  big = document.createElement('div');
  big.className = 'cal-qrbig'; big.setAttribute('role', 'dialog'); big.setAttribute('aria-modal', 'true'); big.setAttribute('aria-label', 'Homework QR code');
  const h = hwList[0];
  big.innerHTML = '<div class="cal-qrbig-in" style="--c:' + subjectColor(h ? h.subject : 'general') + '"><p class="cal-qrbig-k">' + ci('hw') + 'Scan to add your homework to your calendar</p>' +
    '<div class="cal-qrbig-q">' + svg + '</div><p class="cal-qrbig-t">' + esc(hwList.length === 1 ? (subjectName(h.subject, true) + ': ' + (h.title || 'Homework')) : hwList.length + ' homework tasks') + '</p>' +
    (hwList.length === 1 ? '<p class="cal-qrbig-d">Due ' + esc(dateWords(h.due)) + '</p>' : '') + '<button type="button" class="btn" data-big="x">' + icon('close') + 'Close</button></div>';
  document.body.appendChild(big);
  const close = () => { if (big) { big.remove(); big = null; } };
  big.addEventListener('click', (e) => { if (e.target === big || e.target.closest('[data-big="x"]')) close(); });
  big.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  try { if (big.requestFullscreen && !document.fullscreenElement) big.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed */ }
  setTimeout(() => { const b = big && $('[data-big="x"]', big); if (b) b.focus(); }, 30);
}

/* The share sheet. It reuses the calendar's side sheet. */
export async function openShare(hwList, openSheet) {
  hwList = (hwList || []).filter(Boolean);
  if (!hwList.length) { toast('There is no homework to share yet.'); return; }
  const st = { lessons: false, joinLinks: false, link: '' };
  const one = hwList.length === 1 ? hwList[0] : null;
  const T = await liveTasks();
  const live = !!(T && typeof T.classOn === 'function' && typeof T.sendHomework === 'function' && (() => { try { return T.classOn(); } catch (e) { return false; } })());
  const body = '<div class="cal-share"><div class="cal-qr" aria-live="polite"></div>' +
    '<div class="cal-share-acts"><button type="button" class="btn primary" data-sa="copy">' + icon('copy') + 'Copy link for the chat</button><button type="button" class="btn" data-sa="big">' + icon('expand') + 'Show it big</button>' +
    (live ? '<button type="button" class="btn" data-sa="send">' + icon('send') + 'Send to the class now</button>' : '') + '</div>' +
    '<p class="fine cal-share-note">Pupils or their parents open it and tap Add to my calendar. No names, no accounts.</p>' +
    '<label class="cal-check"><input type="checkbox" data-sa="lessons"><span><b>Also send the online lesson times</b><small>The next 2 weeks for this class, each with a reminder 10 minutes before</small></span></label>' +
    '<label class="cal-check"><input type="checkbox" data-sa="join" disabled><span><b>Include the join link</b><small>Only if the class link is private to your pupils</small></span></label>' +
    '<p class="cal-share-url"><span class="sr">The link: </span><code class="allow-copy"></code></p></div>';
  const root = openSheet({
    kicker: 'Share homework', title: one ? (one.title || subjectName(one.subject, true) + ' homework') : hwList.length + ' homework tasks due this week',
    sub: one ? 'Due ' + esc(dateWords(one.due)) : esc(hwList.map((h) => subjectName(h.subject, true)).join(', ')), color: subjectColor(one ? one.subject : 'general'), body,
    onChange: async (e, r) => {
      if (e.target.dataset.sa === 'lessons') { st.lessons = e.target.checked; const j = $('[data-sa="join"]', r); j.disabled = !st.lessons; if (!st.lessons) { j.checked = false; st.joinLinks = false; } await paint(r); }
      if (e.target.dataset.sa === 'join') { st.joinLinks = e.target.checked; await paint(r); }
    },
    onClick: async (e, r) => {
      const b = e.target.closest('[data-sa]');
      if (!b || b.tagName === 'INPUT') return;
      if (b.dataset.sa === 'copy') copyOut('<a href="' + esc(st.link) + '">' + esc(one ? 'Homework: ' + subjectName(one.subject, true) + (one.title ? ', ' + one.title : '') : 'This week’s homework') + '</a>', st.link, 'Link copied. Paste it into the class chat.');
      else if (b.dataset.sa === 'big') showBig(qrSVG(st.link, 'Homework QR code'), hwList);
      else if (b.dataset.sa === 'send' && T) {
        let n = 0;
        for (const h of hwList) { try { await T.sendHomework(h); n++; } catch (er) { /* the next one */ } }
        toast(n ? 'Sent to every pupil’s device in the class.' : 'It could not be sent. The link still works.');
      }
    }
  });
  async function paint(r) {
    st.link = await shareLink(hwList, st);
    $('.cal-qr', r).innerHTML = qrSVG(st.link, 'QR code: scan to add the homework to your calendar');
    $('.cal-share-url code', r).textContent = st.link;
  }
  await paint(root);
}
