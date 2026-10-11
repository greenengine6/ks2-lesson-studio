/* Engine 6: Unplugged Code. A robot grid the class programs live (pupils type F, L, R in the chat; the teacher
   runs it), a buggy algorithm to debug, and an unplugged activity for home. The grid is checked: the goal is
   always reachable, and the "fixed" algorithm is proven to work by running it. */
import { esc, str, arr, strs, num, clamp, icon } from '../core.js?v=b8e2dc0e';
import { B } from './shared.js?v=b8e2dc0e';
import { buildPrompt } from './prompt.js?v=b8e2dc0e';
import { confetti } from '../fx/particles.js?v=b8e2dc0e';

const DIRS = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const ORDER = ['N', 'E', 'S', 'W'];
const ROT = { N: 0, E: 90, S: 180, W: 270 };

/* ---------- programs: F, L, R and repeats like 3(F R) ---------- */
export function parseProgram(src) {
  const s = String(src || '').toUpperCase().replace(/[↑⬆]/g, 'F').replace(/[↰⟲↺]/g, 'L').replace(/[↱⟳↻]/g, 'R').replace(/REPEAT\s*(\d+)\s*(TIMES)?\s*/g, '$1(').replace(/\[/g, '(').replace(/\]/g, ')');
  const toks = [];
  const re = /(\d+)\s*[X×]?\s*\(|\)|F|L|R/g;
  let m;
  while ((m = re.exec(s))) toks.push(m[1] ? { t: 'rep', n: clamp(Number(m[1]), 1, 20) } : m[0] === ')' ? { t: 'end' } : { t: m[0] });
  const flat = [];
  const walk = (i, stop) => {
    const seq = [];
    while (i < toks.length) {
      const tk = toks[i];
      if (tk.t === 'end') return { seq, i: i + 1 };
      if (tk.t === 'rep') { const inner = walk(i + 1); for (let k = 0; k < tk.n; k++) inner.seq.forEach((x) => seq.push(x)); i = inner.i; continue; }
      seq.push({ c: tk.t, ref: i }); i++;
    }
    return { seq, i };
  };
  walk(0).seq.forEach((x) => flat.push(x));
  return { toks, flat };
}
const progText = (toks) => toks.map((t) => (t.t === 'rep' ? t.n + '(' : t.t === 'end' ? ')' : t.t)).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');

function simulate(g, flat) {
  let r = g.start[0], c = g.start[1], f = g.facing;
  const got = new Set(), path = [[r, c, f]];
  const isWall = (y, x) => g.walls.some((w) => w[0] === y && w[1] === x);
  for (let k = 0; k < flat.length; k++) {
    const cmd = flat[k].c;
    if (cmd === 'L') f = ORDER[(ORDER.indexOf(f) + 3) % 4];
    else if (cmd === 'R') f = ORDER[(ORDER.indexOf(f) + 1) % 4];
    else {
      const y = r + DIRS[f][0], x = c + DIRS[f][1];
      if (y < 0 || x < 0 || y >= g.size || x >= g.size || isWall(y, x)) { path.push([r, c, f, 'crash', k]); return { ok: false, crash: k, path, got }; }
      r = y; c = x;
      g.gems.forEach((gm, i) => { if (gm[0] === r && gm[1] === c) got.add(i); });
    }
    path.push([r, c, f]);
  }
  const atGoal = r === g.goal[0] && c === g.goal[1];
  return { ok: atGoal && got.size === g.gems.length, atGoal, path, got };
}
function solveGrid(g, ignoreWalls) {
  const key = (r, c, d, m) => r + ',' + c + ',' + d + ',' + m;
  const full = (1 << g.gems.length) - 1;
  const isWall = (y, x) => !ignoreWalls && g.walls.some((w) => w[0] === y && w[1] === x);
  const startMask = g.gems.reduce((m, gm, i) => (gm[0] === g.start[0] && gm[1] === g.start[1] ? m | (1 << i) : m), 0);
  const q = [[g.start[0], g.start[1], ORDER.indexOf(g.facing), startMask, '']];
  const seen = new Set([key(g.start[0], g.start[1], ORDER.indexOf(g.facing), startMask)]);
  while (q.length) {
    const [r, c, d, m, p] = q.shift();
    if (r === g.goal[0] && c === g.goal[1] && m === full) return p.trim();
    const moves = [[r, c, (d + 3) % 4, m, p + ' L'], [r, c, (d + 1) % 4, m, p + ' R']];
    const y = r + DIRS[ORDER[d]][0], x = c + DIRS[ORDER[d]][1];
    if (y >= 0 && x >= 0 && y < g.size && x < g.size && !isWall(y, x)) {
      let mm = m; g.gems.forEach((gm, i) => { if (gm[0] === y && gm[1] === x) mm |= 1 << i; });
      moves.push([y, x, d, mm, p + ' F']);
    }
    for (const mv of moves) { const k = key(mv[0], mv[1], mv[2], mv[3]); if (!seen.has(k)) { seen.add(k); q.push(mv); } }
  }
  return null;
}
function normGrid(raw) {
  const size = clamp(Math.round(num(raw && raw.size, 6)), 4, 8);
  const cell = (p) => (Array.isArray(p) && p.length >= 2 ? [clamp(Math.round(num(p[0], 0)), 0, size - 1), clamp(Math.round(num(p[1], 0)), 0, size - 1)] : null);
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  const start = cell(raw && raw.start) || [size - 1, 0];
  let goal = cell(raw && raw.goal) || [0, size - 1];
  if (same(start, goal)) goal = [0, size - 1];
  const gems = arr(raw && raw.gems).map(cell).filter((p) => p && !same(p, start) && !same(p, goal)).filter((p, i, a) => a.findIndex((q) => same(q, p)) === i).slice(0, 3);
  const walls = arr(raw && raw.walls).map(cell).filter((p) => p && !same(p, start) && !same(p, goal) && !gems.some((g) => same(g, p))).filter((p, i, a) => a.findIndex((q) => same(q, p)) === i).slice(0, size * size / 3);
  const facing = ORDER.includes(str(raw && raw.facing).toUpperCase()) ? str(raw.facing).toUpperCase() : 'N';
  const g = { size, start, goal, gems, walls, facing, legend: { gem: str(raw && raw.legend && raw.legend.gem) || 'star', goal: str(raw && raw.legend && raw.legend.goal) || 'flag', wall: str(raw && raw.legend && raw.legend.wall) || 'wall' } };
  if (!solveGrid(g)) {                                  // make sure it can be solved: clear walls on an open route
    const p = solveGrid(g, true) || '';
    let r = g.start[0], c = g.start[1], f = g.facing;
    p.split(/\s+/).forEach((cmd) => {
      if (cmd === 'L') f = ORDER[(ORDER.indexOf(f) + 3) % 4]; else if (cmd === 'R') f = ORDER[(ORDER.indexOf(f) + 1) % 4];
      else if (cmd === 'F') { r += DIRS[f][0]; c += DIRS[f][1]; g.walls = g.walls.filter((w) => !(w[0] === r && w[1] === c)); }
    });
  }
  return g;
}

const EXAMPLE = {
  title: 'Rescue the Space Puppy',
  concept: 'Sequence',
  story: 'A space puppy called Comet is lost on the Moon! Drive the rover to Comet’s flag and collect both moon rocks on the way. Watch out for the craters!',
  grid: { size: 5, start: [4, 0], facing: 'N', goal: [0, 4], walls: [[2, 0], [2, 1], [1, 2], [0, 2]], gems: [[3, 2], [1, 3]], legend: { gem: 'moon rock', goal: 'Comet’s flag', wall: 'crater' } },
  mission: 'Write an algorithm to reach the flag and collect both moon rocks.',
  buggy: { program: 'F R F F R F R F L F F R F', bug: 'Command 5 should be L (turn left), not R. The rover turns the wrong way and drives off the map.', fixed: 'F R F F L F R F L F F R F' },
  unplugged: {
    name: 'Human robot',
    materials: ['Paper and a pencil', 'A coin as the rover', 'A small toy as Comet', 'A family member to be the robot (or the teacher on camera)'],
    steps: ['Draw a grid of 5 by 5 squares on paper.', 'Put the coin in the bottom-left square and the toy in the top-right square.', 'Write an algorithm using F, L and R.', 'Read it out one command at a time while someone moves the coin exactly.', 'If the coin goes the wrong way, find the bug and fix it.']
  },
  vocabulary: [
    { word: 'algorithm', meaning: 'A set of step-by-step instructions.' },
    { word: 'sequence', meaning: 'Putting instructions in the right order.' },
    { word: 'command', meaning: 'One instruction, like F or L.' },
    { word: 'bug', meaning: 'A mistake in an algorithm.' },
    { word: 'debug', meaning: 'To find and fix a mistake.' }
  ],
  questions: ['What happens if you swap two commands?', 'Can you find an algorithm that is just as short but takes a different route?', 'Why do robots need such exact instructions?'],
  extension: 'Write the same algorithm in ScratchJr or Scratch using arrow blocks.',
  teacher: {
    routine: [
      'Read the mission. Explain the commands: F moves forward one square; L and R turn on the spot. 3 minutes.',
      'Pupils write their algorithm on paper. 5 minutes.',
      'Pupils type their algorithm in the chat. Type one into the command box and press Run. Celebrate or debug together. 8 minutes.',
      'Debug it: run the buggy algorithm and let pupils spot the first bug. 5 minutes.',
      'Human robot at home with a family member (optional homework).'
    ],
    support: 'Give pupils arrow cards to lay out, and let them test one command at a time with Step.',
    stretch: 'Find the shortest algorithm. Then rewrite it using a repeat, for example 2(F).'
  }
};

function prompt(input, mode) {
  return buildPrompt({
    year: input.year, mode, example: EXAMPLE,
    task: [
      'Create an unplugged computing lesson about: ' + input.concept + '.' + (input.theme ? ' Theme: ' + input.theme + '.' : ''),
      'It uses a robot grid. The robot understands only three commands: F (move forward one square), L (turn left 90° on the spot) and R (turn right 90° on the spot). Repeats are written like 3(F) or 2(F R).',
      'Also include a buggy algorithm with exactly one first mistake to find, an unplugged activity that works at home with household items, vocabulary and questions.'
    ].join('\n'),
    rules: [
      'grid: size 5 to 7; positions are [row, column] counted from 0 at the TOP-LEFT; facing is N, E, S or W (N is up). gems are 1 to 3 squares to collect; walls block the robot.',
      'The puzzle must be solvable: there must be a route from start, through every gem, to the goal.',
      'buggy.fixed must be a correct algorithm that collects every gem and finishes on the goal. buggy.program is the same algorithm with one mistake; buggy.bug explains which command is wrong and why.',
      'legend names the gem, goal and walls to fit the theme (for example "moon rock", "Comet’s flag", "crater").',
      'Pitch the algorithm length for ' + input.year + ': about 8 to 14 commands for Year 3 and 4; Year 5 and 6 should need a repeat or a longer route.'
    ]
  });
}
function normalize(raw, input) {
  if (!raw || typeof raw !== 'object') return null;
  const g = normGrid(raw.grid || {});
  const b = raw.buggy || {}, u = raw.unplugged || {}, t = raw.teacher || {};
  let fixed = str(b.fixed), buggy = str(b.program), bug = str(b.bug);
  if (!simulate(g, parseProgram(fixed).flat).ok) fixed = solveGrid(g) || '';
  if (!buggy || simulate(g, parseProgram(buggy).flat).ok) {
    const toks = fixed.split(/\s+/);
    const k = toks.findIndex((x) => x === 'L' || x === 'R');
    if (k >= 0) { toks[k] = toks[k] === 'L' ? 'R' : 'L'; buggy = toks.join(' '); bug = 'Command ' + (k + 1) + ' should be ' + fixed.split(/\s+/)[k] + ', not ' + toks[k] + '. The robot turns the wrong way.'; }
  }
  return {
    title: str(raw.title) || 'Robot mission', concept: str(raw.concept) || input.concept, story: str(raw.story), mission: str(raw.mission) || 'Get the robot to the goal.',
    grid: g, buggy: { program: buggy, bug, fixed },
    unplugged: { name: str(u.name) || 'Unplugged activity', materials: strs(u.materials, 8), steps: strs(u.steps, 8) },
    vocabulary: arr(raw.vocabulary).map((v) => ({ word: str(v && v.word), meaning: str(v && v.meaning) })).filter((v) => v.word).slice(0, 8),
    questions: strs(raw.questions, 6), extension: str(raw.extension),
    teacher: { routine: strs(t.routine, 8), support: str(t.support), stretch: str(t.stretch) }
  };
}

const BOT = '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="37" rx="13" ry="2.6" fill="rgba(90,100,130,.28)"/><rect x="7" y="9" width="26" height="24" rx="8" fill="#6C63FF"/><rect x="10" y="13" width="20" height="11" rx="5" fill="#EEF0FF"/>' +
  '<circle cx="16" cy="18.5" r="2.4" fill="#3D4852"/><circle cx="24" cy="18.5" r="2.4" fill="#3D4852"/><path d="M20 2 L26 9 H14 Z" fill="#FFB443"/><rect x="11" y="30" width="6" height="5" rx="2" fill="#4F5BD5"/><rect x="23" y="30" width="6" height="5" rx="2" fill="#4F5BD5"/></svg>';
const GEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.9-4.7 4.4 1.2 6.4L12 17.1 6.3 20.2l1.2-6.4L2.8 9.4l6.4-.9z" fill="#FFB443" stroke="#C38A12" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3" stroke="#3D4852" stroke-width="2" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" fill="#38B2AC"/></svg>';
const TOK_ICON = { F: 'up', L: 'turnL', R: 'turnR' };
const plural = (w) => (/s$/i.test(w) ? w : /y$/i.test(w) && !/[aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : w + 's');

function robotBoard(eng, mode) {
  return {
    title: mode === 'debug' ? 'Debug it' : 'Robot mission',
    render(board, ctx) {
      const d = ctx.data, g = d.grid;
      const st = (ctx.state[mode] = ctx.state[mode] || { src: mode === 'debug' ? d.buggy.program : '', showFix: false });
      board.innerHTML = B.pad(eng, { kick: mode === 'debug' ? 'Debug it' : d.concept || 'Algorithm', icon: 'code', say: mode === 'debug' ? 'chat' : 'waterfall', title: mode === 'debug' ? 'Find the bug!' : d.title });
      const body = B.body(board);
      const cells = [];
      for (let r = 0; r < g.size; r++) for (let c = 0; c < g.size; c++) {
        const wall = g.walls.some((w) => w[0] === r && w[1] === c), gem = g.gems.findIndex((x) => x[0] === r && x[1] === c), goal = g.goal[0] === r && g.goal[1] === c;
        cells.push('<div class="cell' + (wall ? ' wall' : '') + '" data-rc="' + r + ',' + c + '"' + (gem >= 0 ? ' data-gem="' + gem + '"' : '') + '>' + (gem >= 0 ? GEM : goal ? FLAG : '') + '</div>');
      }
      body.innerHTML = '<div class="robo"><div class="rgrid" style="--n:' + g.size + '">' + cells.join('') + '<div class="bot">' + BOT + '</div></div><div class="rside">' +
        '<p style="margin:0;font-size:calc(1.75 * var(--u) * var(--fs))">' + esc(mode === 'debug' ? 'This algorithm has a bug. Run it, watch where it goes wrong, and find the first mistake.' : (d.story || d.mission)) + '</p>' +
        '<div class="rkey"><span><b>F</b> forward 1</span><span><b>L</b> turn left</span><span><b>R</b> turn right</span><span><b>3(F)</b> repeat</span></div>' +
        '<div class="prog" aria-live="polite"></div>' +
        (mode === 'debug' ? '' : '<input type="text" class="t in" data-src aria-label="Type the algorithm, for example F F R F" placeholder="Type the class’s algorithm: F F R F" style="height:calc(4.4 * var(--u));border-radius:calc(1.2 * var(--u));padding:0 calc(1.4 * var(--u));font-family:var(--f-display);font-weight:700;font-size:calc(1.6 * var(--u))">') +
        '<div class="cmds">' + (mode === 'debug' ? '<button type="button" class="b-btn" data-fix>' + icon('bulb') + 'Show the fix</button>' :
          '<button type="button" class="b-btn" data-add="F">' + icon('up') + 'F</button><button type="button" class="b-btn" data-add="L">' + icon('turnL') + 'L</button><button type="button" class="b-btn" data-add="R">' + icon('turnR') + 'R</button>' +
          '<button type="button" class="b-btn round" data-undo aria-label="Undo the last command">' + icon('left') + '</button><button type="button" class="b-btn round" data-clear aria-label="Clear the algorithm">' + icon('trash') + '</button>') +
        '<button type="button" class="b-btn go" data-run>' + icon('play') + 'Run</button><button type="button" class="b-btn" data-step>Step</button><button type="button" class="b-btn round" data-reset aria-label="Reset the robot">' + icon('refresh') + '</button></div>' +
        '<div class="rmsg"></div>' + (mode === 'debug' ? '<p class="b-sub fixtxt" style="margin:0"></p>' : '<p class="b-sub" style="margin:0">' + esc(g.gems.length ? 'Collect ' + (g.gems.length === 1 ? 'the ' + g.legend.gem : 'all ' + g.gems.length + ' ' + plural(g.legend.gem)) + ', then finish at ' + g.legend.goal + '.' : 'Finish at ' + g.legend.goal + '.') + ' Avoid the ' + esc(plural(g.legend.wall)) + '.</p>') + '</div></div>';
      const grid = body.querySelector('.rgrid'), bot = body.querySelector('.bot'), prog = body.querySelector('.prog'), msg = body.querySelector('.rmsg'), input = body.querySelector('[data-src]');
      let pos = { r: g.start[0], c: g.start[1], f: g.facing, rot: ROT[g.facing] }, k = 0, timer = 0, running = false;
      const cellEl = (r, c) => grid.querySelector('[data-rc="' + r + ',' + c + '"]');
      const place = () => { const ce = cellEl(pos.r, pos.c); if (!ce) return; bot.style.width = ce.offsetWidth + 'px'; bot.style.height = ce.offsetHeight + 'px'; bot.style.transform = 'translate(' + ce.offsetLeft + 'px,' + ce.offsetTop + 'px)'; bot.querySelector('svg').style.transform = 'rotate(' + pos.rot + 'deg)'; };
      const parsed = () => parseProgram(st.src);
      const paintProg = (now, bad) => {
        const p = parsed();
        prog.innerHTML = p.toks.length ? p.toks.map((t, i) => '<span class="tok' + (t.t === 'rep' || t.t === 'end' ? ' rep' : '') + (i === now ? ' now' : '') + (i === bad ? ' bad' : '') + '">' + (TOK_ICON[t.t] ? icon(TOK_ICON[t.t]) : t.t === 'rep' ? t.n + '×(' : ')') + '</span>').join('') : '<span class="ph">No commands yet</span>';
        if (input && document.activeElement !== input) input.value = progText(p.toks);
      };
      const reset = () => {
        clearTimeout(timer); running = false; k = 0;
        pos = { r: g.start[0], c: g.start[1], f: g.facing, rot: ROT[g.facing] };
        grid.querySelectorAll('.cell').forEach((c) => c.classList.remove('got', 'trail', 'bump'));
        bot.classList.remove('crash'); msg.textContent = ''; msg.className = 'rmsg';
        place(); paintProg(-1);
      };
      const finish = (res) => {
        running = false;
        if (res.ok) { msg.textContent = 'Mission complete!'; msg.className = 'rmsg ok'; if (!ctx.still) confetti(ctx.present ? document.getElementById('present') : board, { count: 110 }); }
        else if (res.atGoal) { msg.textContent = 'You reached the ' + g.legend.goal + ' but missed a ' + g.legend.gem + '!'; msg.className = 'rmsg bad'; }
        else { msg.textContent = 'Not there yet. Can you fix it?'; msg.className = 'rmsg bad'; }
      };
      const stepOnce = () => {
        const p = parsed();
        if (k >= p.flat.length) { finish(simulate(g, p.flat)); return false; }
        const cmd = p.flat[k];
        if (cmd.c === 'L') { pos.f = ORDER[(ORDER.indexOf(pos.f) + 3) % 4]; pos.rot -= 90; }
        else if (cmd.c === 'R') { pos.f = ORDER[(ORDER.indexOf(pos.f) + 1) % 4]; pos.rot += 90; }
        else {
          const y = pos.r + DIRS[pos.f][0], x = pos.c + DIRS[pos.f][1];
          const blocked = y < 0 || x < 0 || y >= g.size || x >= g.size || g.walls.some((w) => w[0] === y && w[1] === x);
          if (blocked) {
            bot.classList.remove('crash'); void bot.offsetWidth; bot.classList.add('crash');
            const ce = cellEl(y, x); if (ce) { ce.classList.remove('bump'); void ce.offsetWidth; ce.classList.add('bump'); }
            msg.textContent = 'Bump! Command ' + (k + 1) + ' hits ' + (ce ? 'a ' + g.legend.wall : 'the edge') + '.'; msg.className = 'rmsg bad';
            paintProg(cmd.ref, cmd.ref); running = false; return false;
          }
          const here = cellEl(pos.r, pos.c); if (here) here.classList.add('trail');
          pos.r = y; pos.c = x;
          const ce = cellEl(y, x); if (ce && ce.dataset.gem != null) ce.classList.add('got');
        }
        place(); paintProg(cmd.ref); k++;
        if (k >= p.flat.length) { finish(simulate(g, p.flat)); return false; }
        return true;
      };
      const run = () => { if (running) return; reset(); running = true; const loop = () => { if (!running) return; if (stepOnce()) timer = setTimeout(loop, 520); }; timer = setTimeout(loop, 250); };
      body.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { st.src = (st.src + ' ' + b.dataset.add).trim(); reset(); }));
      const q = (s) => body.querySelector(s);
      if (q('[data-undo]')) q('[data-undo]').addEventListener('click', () => { const p = parsed(); p.toks.pop(); st.src = progText(p.toks); reset(); });
      if (q('[data-clear]')) q('[data-clear]').addEventListener('click', () => { st.src = ''; reset(); });
      if (input) input.addEventListener('input', () => { st.src = input.value; clearTimeout(timer); running = false; k = 0; paintProg(-1); });
      if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); run(); } });
      if (q('[data-fix]')) q('[data-fix]').addEventListener('click', () => {
        st.showFix = !st.showFix;
        st.src = st.showFix ? d.buggy.fixed : d.buggy.program;
        q('.fixtxt').textContent = st.showFix ? d.buggy.bug : '';
        q('[data-fix]').innerHTML = icon('bulb') + (st.showFix ? 'Show the bug again' : 'Show the fix');
        reset();
      });
      q('[data-run]').addEventListener('click', run);
      q('[data-step]').addEventListener('click', () => { if (running) return; if (k === 0) reset(); stepOnce(); });
      q('[data-reset]').addEventListener('click', reset);
      if (mode === 'debug' && st.showFix) q('.fixtxt').textContent = d.buggy.bug;
      const ro = new ResizeObserver(() => place()); ro.observe(grid);
      ctx.cleanup = () => { clearTimeout(timer); running = false; ro.disconnect(); };
      ctx.onKey = (e) => { const key = e.key.toUpperCase(); if (mode !== 'debug' && (key === 'F' || key === 'L' || key === 'R')) { st.src = (st.src + ' ' + key).trim(); reset(); } else if (e.key === 'Enter') run(); else if (e.key === 'Backspace' && mode !== 'debug') { const p = parsed(); p.toks.pop(); st.src = progText(p.toks); reset(); } };
      requestAnimationFrame(reset);
    }
  };
}

const screens = (eng) => [
  robotBoard(eng, 'mission'),
  robotBoard(eng, 'debug'),
  {
    title: 'Unplugged at home',
    render(board, ctx) {
      const u = ctx.data.unplugged;
      board.innerHTML = B.pad(eng, { kick: 'Unplugged', icon: 'home', say: 'show', title: u.name });
      B.body(board).innerHTML = '<div class="b-grid" style="--cols:2;flex:1;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="t"><h4>' + icon('steps') + 'How to play</h4>' + B.num(u.steps) + '</div><div class="t in"><h4>' + icon('layers') + 'You need</h4>' + B.list(u.materials) + '</div></div>';
      B.body(board).querySelectorAll('.t').forEach((t) => B.fit(t, 0.7));
    }
  }
];

const eng = {
  id: 'code', name: 'Unplugged Code', short: 'Computing', color: 'orange', icon: 'code',
  kicker: 'Computing · computational thinking', tagline: 'A robot grid the class programs live, a bug to hunt and an unplugged game for home.',
  about: 'Pupils type F, L and R in the chat; you type their algorithm in and the robot runs it. Then a buggy algorithm to debug, and an unplugged game for home.',
  chips: ['Computing', '20–30 minutes', 'No devices needed'], cta: 'Build the mission', savedLabel: 'missions',
  sym: { hello: 'Pick a <b>computing concept</b> and a theme. I’ll build a robot mission your class programs live.', thinking: 'Placing the walls and checking there is a way through…', done: 'Type the class’s algorithm into the box and press <b>Run</b>.' },
  fields: [
    { id: 'year', type: 'year', label: 'Year group', value: 'Year 3' },
    { id: 'concept', type: 'select', label: 'Concept', options: ['Sequence', 'Repetition (loops)', 'Debugging', 'Decomposition', 'Selection (if… then…)', 'Algorithms for efficiency'], value: 'Sequence' },
    { id: 'theme', type: 'text', label: 'Theme', optional: true, placeholder: 'For example: pirate treasure', chips: ['Space rescue', 'Pirate treasure', 'Jungle explorer', 'Robot chef', 'Deep sea dive'] }
  ],
  example: { input: { year: 'Year 3', concept: 'Sequence', theme: 'Space rescue' }, data: EXAMPLE },
  progress: [['title', 'Planning the mission'], ['grid', 'Building the grid'], ['buggy', 'Hiding a bug'], ['unplugged', 'Designing the unplugged game'], ['teacher', 'Writing your notes']],
  maxTokens: 3500,
  prompt, normalize,
  title: (d) => d.title,
  sub: (d, input) => [input && input.year, d.concept].filter(Boolean).join(' · '),
  screens: () => screens(eng),
  notes(d) {
    return [
      { h: 'Running it online', icon: 'clock', list: d.teacher.routine, ordered: true, full: true },
      { h: 'A working algorithm', icon: 'check', text: d.buggy.fixed + ' (' + d.buggy.fixed.split(/\s+/).filter(Boolean).length + ' commands, tested on the grid)' },
      { h: 'The bug', icon: 'search', text: d.buggy.bug },
      { h: 'Questions to ask', icon: 'chat', list: d.questions },
      { h: 'Key words', icon: 'reading', pairs: d.vocabulary.map((v) => [v.word, v.meaning]) },
      { h: 'Support and stretch', icon: 'layers', pairs: [['Support', d.teacher.support], ['Stretch', d.teacher.stretch], ['Extension', d.extension]].filter((p) => p[1]) }
    ];
  },
  chat(d) {
    return {
      title: d.title, sub: 'Write an algorithm using F (forward), L (turn left) and R (turn right). Type it in the chat, like: F F R F',
      sections: [{ h: 'Mission', text: d.story || d.mission }, { h: 'Debug it', text: 'This algorithm has a bug: ' + d.buggy.program + '. Which command is wrong?' }, { h: d.unplugged.name + ' (at home)', list: d.unplugged.steps, ordered: true }]
    };
  }
};
export default eng;
