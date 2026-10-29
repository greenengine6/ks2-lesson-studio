/* Quiz race. Rockets race along a track: every right answer is one step nearer the finish.
   On the board (teams): the question and its options; Show the answer; tap every team that got it right (or keys
   1 to 4), then Move: those rockets fly forward. First to the finish wins; when the questions run out, the team in
   front wins. On a device (one player): you race the clock rocket. Pick an answer (tap or keys 1 to 4); right moves
   you on, and the clock rocket moves by itself as time passes. */
import { el, txt, TEAM_COLOURS, makeHud, makeClock, floatText, say, icon, confetti } from './common.js?v=73f756c9';

const ROCKET = (c) => '<svg class="kg-rocket-svg" viewBox="0 0 120 60" aria-hidden="true">' +
  '<path class="kg-flame" d="M18 30c-10-7-16-6-18 0 2 6 8 7 18 0z" fill="#FFB443"/><path class="kg-flame" d="M18 30c-6-4-10-3-11 0 1 3 5 4 11 0z" fill="#FFF3B0"/>' +
  '<path d="M22 18h52c18 0 34 6 44 12-10 6-26 12-44 12H22z" fill="' + c + '"/>' +
  '<path d="M74 18c18 0 34 6 44 12-10 6-26 12-44 12 8-6 8-18 0-24z" fill="#fff" opacity=".28"/>' +
  '<circle cx="72" cy="30" r="7" fill="#E6F4FF" stroke="#1F2937" stroke-opacity=".25" stroke-width="2"/>' +
  '<path d="M30 18 20 4h16l10 14zM30 42 20 56h16l10-14z" fill="' + c + '" opacity=".85"/></svg>';
const LETTERS = ['A', 'B', 'C', 'D'];

export function run(root, g, h) {
  const c = g.content, set = g.settings, device = h.mode === 'device', qs = c.questions;
  const teams = device ? ['You', 'The clock'] : c.teams;
  const goal = device ? qs.length : Math.max(3, Math.min(qs.length, Math.ceil(qs.length * 0.7)));
  const stage = el('div', 'kg-stage kg-race-stage');
  stage.innerHTML = '<div class="kg-track" style="--steps:' + goal + '"></div><div class="kg-qcard" aria-live="polite"></div>';
  root.appendChild(stage);
  const hud = makeHud(root, { rule: device ? 'Beat the clock to the finish' : 'Every right answer is a step forward' });
  const track = stage.querySelector('.kg-track'), card = stage.querySelector('.kg-qcard');
  const pos = teams.map(() => 0);
  let qi = 0, score = 0, right = 0, wrong = 0, ended = false, shown = false, picked = new Set(), locked = false, clockT = 0;
  hud.score(0); hud.progress('Question 1 of ' + qs.length);
  teams.forEach((name, ti) => {
    const lane = el('div', 'kg-lane' + (device && ti === 1 ? ' clock' : ''));
    const col = device ? (ti === 0 ? '#3A86FF' : '#9AA5B5') : TEAM_COLOURS[ti % TEAM_COLOURS.length];
    lane.style.setProperty('--c', col);
    lane.innerHTML = '<span class="kg-team"></span><div class="kg-road"><span class="kg-finish" aria-hidden="true">' + icon('flag') + '</span><span class="kg-rocket" style="--p:0">' + ROCKET(col) + '</span></div>';
    txt(lane.querySelector('.kg-team'), name);
    track.appendChild(lane);
  });
  const rockets = Array.from(track.querySelectorAll('.kg-rocket'));
  function move(ti) {
    pos[ti] = Math.min(goal, pos[ti] + 1);
    rockets[ti].style.setProperty('--p', String(pos[ti] / goal));
    rockets[ti].classList.remove('zoom'); void rockets[ti].offsetWidth; rockets[ti].classList.add('zoom');
  }
  function showQ() {
    const q = qs[qi];
    shown = false; picked = new Set(); locked = false;
    card.innerHTML = '<p class="kg-qn">Question ' + (qi + 1) + ' of ' + qs.length + '</p><h3 class="kg-q"></h3><div class="kg-opts"></div>' +
      (device ? '' : '<div class="kg-qbar"><button type="button" class="kg-btn ghost" data-r="show">Show the answer</button><span class="kg-who" role="group" aria-label="Teams that got it right"></span><button type="button" class="kg-btn" data-r="move" disabled>Move</button></div>');
    txt(card.querySelector('.kg-q'), q.q);
    const opts = card.querySelector('.kg-opts');
    q.opts.forEach((o, i) => {
      const b = el('button', 'kg-opt o' + i);
      b.type = 'button'; b.dataset.o = String(i);
      b.innerHTML = '<b>' + LETTERS[i] + '</b><span></span>';
      txt(b.querySelector('span'), o);
      if (!device) b.tabIndex = -1;
      opts.appendChild(b);
    });
    if (!device) {
      const who = card.querySelector('.kg-who');
      teams.forEach((name, ti) => {
        const b = el('button', 'kg-teamb');
        b.type = 'button'; b.dataset.t = String(ti); b.setAttribute('aria-pressed', 'false');
        b.style.setProperty('--c', TEAM_COLOURS[ti % TEAM_COLOURS.length]);
        b.innerHTML = '<b class="kg-key" aria-hidden="true">' + (ti + 1) + '</b><span></span>';
        txt(b.querySelector('span'), name);
        who.appendChild(b);
      });
    }
    hud.progress('Question ' + (qi + 1) + ' of ' + qs.length);
  }
  function reveal() {
    if (shown) return;
    shown = true;
    const q = qs[qi];
    card.querySelectorAll('.kg-opt').forEach((b) => b.classList.toggle(Number(b.dataset.o) === q.a ? 'right' : 'dim', true));
    const m = card.querySelector('[data-r="move"]'); if (m) m.disabled = false;
    say(root, 'The answer is ' + LETTERS[q.a] + ': ' + q.opts[q.a] + '.');
  }
  function next() {
    if (ended) return;
    const lead = Math.max.apply(null, pos);
    if (lead >= goal || qi >= qs.length - 1) { finish(); return; }
    qi += 1; showQ();
  }
  /* the board: teams */
  function moveTeams() {
    if (!shown) reveal();
    if (!picked.size) { h.sfx.play('whoosh'); setTimeout(next, 250); return; }
    picked.forEach((ti) => move(ti));
    right += picked.size;
    h.sfx.play('step'); h.sfx.play('whoosh');
    say(root, Array.from(picked).map((ti) => teams[ti]).join(' and ') + ' move on.');
    setTimeout(next, 900);
  }
  /* a device: one player against the clock */
  function answer(i) {
    if (locked || ended) return;
    locked = true;
    const q = qs[qi], ok = i === q.a;
    const b = card.querySelector('.kg-opt.o' + i), r = b.getBoundingClientRect(), s = stage.getBoundingClientRect();
    card.querySelectorAll('.kg-opt').forEach((x) => { const k = Number(x.dataset.o); x.disabled = true; x.classList.add(k === q.a ? 'right' : k === i ? 'wrongpick' : 'dim'); });
    if (ok) {
      right += 1;
      const add = 10 + Math.round(Math.max(0, clockLeftFrac()) * 5);
      score += add; move(0);
      h.sfx.play('right'); floatText(stage, r.left - s.left + r.width / 2, r.top - s.top, '+' + add, true);
      say(root, 'Right! ' + score + ' points.');
    } else {
      wrong += 1;
      h.sfx.play('wrong'); floatText(stage, r.left - s.left + r.width / 2, r.top - s.top, 'Not this time', false);
      say(root, 'Not this time. The answer was ' + q.opts[q.a] + '.');
    }
    hud.score(score); h.onScore(score, { right, wrong });
    setTimeout(() => { if (pos[0] >= goal) finish(); else next(); }, ok ? 800 : 1500);
  }
  const clockLeftFrac = () => (set.seconds > 0 ? clock.left / set.seconds : 0);
  card.addEventListener('click', (e) => {
    if (ended) return;
    const o = e.target.closest('.kg-opt'), t = e.target.closest('.kg-teamb'), a = e.target.closest('[data-r]');
    if (device && o) { answer(Number(o.dataset.o)); return; }
    if (!device && t) { const ti = Number(t.dataset.t); if (picked.has(ti)) picked.delete(ti); else picked.add(ti); t.setAttribute('aria-pressed', String(picked.has(ti))); h.sfx.play('flip'); const m = card.querySelector('[data-r="move"]'); if (m) m.disabled = false; return; }
    if (a && a.dataset.r === 'show') { reveal(); h.sfx.play('flip'); return; }
    if (a && a.dataset.r === 'move') moveTeams();
  });
  root.addEventListener('keydown', (e) => {
    if (ended || e.target.closest('input,textarea')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      e.preventDefault();
      if (device) { if (n <= qs[qi].opts.length) answer(n - 1); }
      else { const t = card.querySelector('.kg-teamb[data-t="' + (n - 1) + '"]'); if (t) t.click(); }
    } else if (!device && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); reveal(); }
    else if (!device && e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); moveTeams(); }
  });
  function finish() {
    if (ended) return;
    ended = true; clock.stop(); clearInterval(clockT);
    card.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const best = Math.max.apply(null, pos);
    const winners = teams.filter((t, i) => pos[i] === best && best > 0);
    if (device) {
      const won = pos[0] >= pos[1];
      if (pos[0] >= goal && won) { score += Math.round(clock.left); hud.score(score); h.onScore(score, { right, wrong }); }
      h.onEnd({ score, right, wrong, max: qs.length * 15, part: right / qs.length, won, why: won ? 'won' : 'clock', winners: won ? ['You'] : ['The clock'] });
    } else {
      confetti(stage);
      h.onEnd({ score: best, right, wrong, max: goal, part: 1, won: true, why: 'race', winners, teams: teams.map((t, i) => ({ name: t, steps: pos[i] })) });
    }
  }
  const clock = makeClock(device ? set.seconds || 90 : 0, (t) => { if (device) hud.time(t, t <= 10); }, () => { if (device) finish(); }).start();
  if (device) {
    // the clock rocket: one step for each share of the time
    const every = ((set.seconds || 90) / goal) * 1000;
    clockT = setInterval(() => { if (ended || clock.paused) return; move(1); if (pos[1] >= goal) finish(); }, every);
  } else hud.time(null);
  showQ();
  h.sfx.play('go');
  return { stop() { ended = true; clock.stop(); clearInterval(clockT); }, pause() { clock.pause(); }, resume() { clock.resume(); } };
}
