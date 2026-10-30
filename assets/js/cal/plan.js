/* Plan my week with Symphony: one engine call suggests a topic for every lesson in the week, following the English
   National Curriculum for that subject and year and carrying on from each class's recent topics. She checks each one
   (use it, change it or skip it) and only then are they saved as the lessons' plans. No pupil names are ever sent:
   only subjects, year groups, class names such as "4 Amber" and topics. */
import { $, $$, esc, icon, toast, bus, askJSON, HOUSE_WORDS, CONFIG, hasKey, errorCopy, str } from '../core.js?v=af1c9ebd';
import { makeState, makeStart, makeEnd, deliberate, watch, waitText, repaint } from '../guard.js?v=af1c9ebd';
import { objectivesFor, fits, yearNum } from '../lkie/curriculum.js?v=af1c9ebd';
import { subjectName, subjectColor } from '../library.js?v=af1c9ebd';
import { addDays } from '../ics.js?v=af1c9ebd';
import { data, daySchedule, weekStart, setPlan, lessonById, fmtTime, DAY_SHORT, isoDay } from './store.js?v=af1c9ebd';
import { closeSheet } from './sheet.js?v=af1c9ebd';

export const PLAN_NAME = 'cal:plan';
export const SPARK = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>';
let busy = null;
export const planning = () => !!busy;

export function weekLessons(date) {
  const ws = weekStart(date), out = [];
  for (let i = 0; i < 7; i++) daySchedule(addDays(ws, i)).forEach((x) => { if (x.kind === 'lesson') out.push(x); });
  return out;
}
/* The last few topics this class had in this subject, before `before`. */
function recentTopics(x, before) {
  const d = data(), l = lessonById(x.slotId);
  if (!l) return [];
  const same = (m) => m && m.subject === l.subject && (l.cls ? m.cls === l.cls : m.year === l.year);
  return Object.keys(d.plans).filter((k) => k.slice(0, 10) < before && d.plans[k].topic && same(lessonById(k.slice(11))))
    .sort().reverse().slice(0, 4).map((k) => d.plans[k].topic);
}
const short = (date) => { const [y, m, dd] = date.split('-').map(Number); return DAY_SHORT[isoDay(date)] + ' ' + new Date(y, m - 1, dd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
function request(lessons, ws) {
  const groups = new Map();
  lessons.forEach((x) => { const k = x.subject + '|' + (x.year || ''); if (!groups.has(k)) groups.set(k, { subject: x.subject, year: x.year }); });
  const codes = new Set();
  const curriculum = Array.from(groups.values()).map((g) => {
    const y = yearNum(g.year);
    const list = objectivesFor(g.subject).filter((o) => fits(o, y)).slice(0, 28);
    list.forEach((o) => codes.add(o.code));
    return subjectName(g.subject) + (g.year ? ', ' + g.year : '') + ':\n' + (list.length ? list.map((o) => '- ' + o.code + ': ' + o.text).join('\n') : '- (no statements listed: use the usual KS2 sequence)');
  }).join('\n\n');
  const lines = lessons.map((x, i) => (i + 1) + '. key=' + x.id + ' · ' + short(x.date) + ' ' + fmtTime(x.start, true) + ' · ' + subjectName(x.subject) + (x.year ? ' · ' + x.year : '') + (x.cls ? ' · class ' + x.cls : '') +
    ' · recent topics: ' + (recentTopics(x, ws).join('; ') || 'none') + ' · current topic: ' + (x.plan && x.plan.topic ? x.plan.topic : 'none')).join('\n');
  const prompt = 'Plan this week’s lessons for a KS2 teacher. Suggest one lesson topic for every lesson below.\n\n' +
    'Rules:\n- Follow the English National Curriculum statements given for each subject and year group, in a sensible teaching order.\n' +
    '- Carry each class on from its recent topics; lessons of the same class in the same week build on each other.\n' +
    '- One clear topic per lesson, written like a lesson title (3 to 8 words), right for the year group.\n' +
    '- If a lesson already has a current topic, keep it unless a different one clearly fits the sequence better.\n' +
    '- ' + HOUSE_WORDS + '\n\n' +
    'Return only JSON, no other text: {"plans":[{"key":"<the key exactly as given>","topic":"…","objective":"<one code from the statements, or an empty string>","why":"<one short sentence>"}]}\n\n' +
    'Lessons this week:\n' + lines + '\n\nCurriculum statements:\n' + curriculum;
  return { prompt, codes };
}
const SYSTEM = 'You are Symphony, the planning helper in the KS2 Lesson Engine, a website for teachers of Years 3 to 6 (ages 7 to 11) at an international school in Ipoh, Malaysia, that follows the English National Curriculum. Write in British English, in plain words. Content must be child-safe. Never invent or use names of real pupils.';

/* The Plan my week button: watched by the engine guard (rest, caps, one thing at a time). */
export function wirePlanButton(btn, fine, getDate, openSheet) {
  if (!btn) return;
  watch(btn, { name: PLAN_NAME, label: 'Plan my week', icon: SPARK, fine, idle: 'Symphony suggests a topic for every lesson this week. You check each one.', busy: planning });
  btn.addEventListener('click', (e) => { if (deliberate(e, btn)) run(getDate(), openSheet, btn); });
}
async function run(date, openSheet, btn) {
  if (busy) return;
  const lessons = weekLessons(date);
  if (!lessons.length) { toast('There are no lessons this week yet. Add your lessons first.'); return; }
  const g = makeState(PLAN_NAME);
  if (!g.ok) { repaint(); toast(waitText(g)); return; }
  if (!hasKey()) { toast(errorCopy('no_key')); bus.emit('need-key'); return; }
  const ws = weekStart(date), { prompt, codes } = request(lessons.slice(0, 30), ws);
  const ctl = new AbortController(), ticket = makeStart(PLAN_NAME);
  let outcome = 'error';
  busy = ctl;
  const label = btn && $('span', btn); if (label) label.textContent = 'Planning…';
  if (btn) btn.disabled = true;
  const root = openSheet({
    kicker: 'Plan my week', title: 'Symphony is planning your week', color: 'var(--accent)',
    body: '<div class="cal-busy" role="status"><p>Reading your timetable and the curriculum…</p><div class="meter"><i style="width:6%"></i></div><button type="button" class="btn small" data-plan="stop">' + icon('stop') + 'Stop</button></div>',
    onClick: (e) => { if (e.target.closest('[data-plan="stop"]') && busy) busy.abort(); }
  });
  try {
    const raw = await askJSON(prompt, {
      system: SYSTEM, model: CONFIG.mainModel, maxTokens: 3000, signal: ctl.signal,
      onText: (t) => { const m = root && $('.meter i', root); if (m) m.style.width = Math.min(95, 8 + t.length / (lessons.length * 2.2)) + '%'; }
    });
    const byKey = new Map(lessons.map((x) => [x.id, x]));
    const got = (Array.isArray(raw && raw.plans) ? raw.plans : []).map((p) => ({ key: str(p && p.key), topic: str(p && p.topic).replace(/\s+/g, ' ').slice(0, 90), objective: codes.has(str(p && p.objective)) ? str(p.objective) : '', why: str(p && p.why).slice(0, 160) }))
      .filter((p) => byKey.has(p.key) && p.topic);
    if (!got.length) throw Object.assign(new Error('empty'), { code: 'invalid_json' });
    outcome = 'ok';
    review(got, byKey, openSheet);
  } catch (e) {
    const code = e && e.code;
    if (code === 'cancelled') { outcome = 'stopped'; toast('Stopped. Nothing was changed.'); }
    else { toast(errorCopy(code, 'the plan')); if (code === 'no_key') bus.emit('need-key'); }
    if (outcome !== 'ok') closeSheet();
  } finally {
    busy = null;
    makeEnd(ticket, outcome);
    if (btn) { btn.disabled = false; if (label) label.textContent = 'Plan my week'; }
    repaint();
  }
}
function review(got, byKey, openSheet) {
  const rows = got.map((p, i) => {
    const x = byKey.get(p.key), cur = x.plan && x.plan.topic, use = !cur || cur.toLowerCase() === p.topic.toLowerCase() ? true : false;
    return '<li style="--c:' + subjectColor(x.subject) + '"><p class="cal-plan-h"><b>' + esc(short(x.date)) + ' · ' + esc(fmtTime(x.start, true)) + '</b><span>' + esc(x.title) + '</span></p>' +
      '<label class="fld"><span class="sr">Topic</span><input type="text" name="t' + i + '" value="' + esc(p.topic) + '" maxlength="140" autocomplete="off"></label>' +
      (p.why || p.objective ? '<p class="cal-plan-w">' + esc(p.why) + (p.objective ? ' <code>' + esc(p.objective) + '</code>' : '') + '</p>' : '') +
      (cur && cur.toLowerCase() !== p.topic.toLowerCase() ? '<p class="cal-plan-c">Now: ' + esc(cur) + '</p>' : '') +
      '<div class="seg" role="group" aria-label="Use this topic?"><button type="button" data-use="' + i + '" data-v="1" aria-pressed="' + use + '">Use it</button><button type="button" data-use="' + i + '" data-v="0" aria-pressed="' + !use + '">Skip</button></div></li>';
  }).join('');
  const keep = got.map((p) => { const x = byKey.get(p.key), cur = x.plan && x.plan.topic; return !cur || cur.toLowerCase() === p.topic.toLowerCase(); });
  openSheet({
    kicker: 'Plan my week', title: 'Symphony’s plan for your week', color: 'var(--accent)',
    body: '<form class="cal-f cal-plan" novalidate><p class="fine">Change any topic, or skip one. Nothing is saved until you press Save.</p><ol class="cal-plan-l">' + rows + '</ol>' +
      '<div class="cal-f-foot"><button type="button" class="btn" data-sh="x">Cancel</button><button type="submit" class="btn primary">' + icon('check') + 'Save the plan</button></div></form>',
    onClick: (e) => {
      const b = e.target.closest('[data-use]');
      if (!b) return;
      const i = Number(b.dataset.use), on = b.dataset.v === '1';
      keep[i] = on;
      $$('[data-use="' + i + '"]', b.parentElement.parentElement).forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.v === '1') === on)));
    },
    onSubmit: (e, root) => {
      let n = 0;
      got.forEach((p, i) => {
        if (!keep[i]) return;
        const t = ($('[name="t' + i + '"]', root) || {}).value || p.topic, x = byKey.get(p.key);
        if (str(t)) { setPlan(x.date, x.slotId, { topic: str(t).slice(0, 140) }); n++; }
      });
      closeSheet();
      toast(n ? n + (n === 1 ? ' lesson planned.' : ' lessons planned.') + ' Open a lesson to make its slides.' : 'Nothing was changed.');
    }
  });
}
