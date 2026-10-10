/* Rabinder's numbers: everything is worked out here from the activity log (this device plus the locked activity
   that arrives by itself from teachers' devices). metrics() gives the figures, deviations() flags what needs a look, digest() is the short
   briefing Symphony uses, reportHTML() is the downloadable report and csv() the raw data. */
import { ENGINES } from './engines/registry.js?v=5de985bf';

const DAY = 864e5;
export const ENGINE_NAMES = Object.assign({ slides: 'Slide Studio', play: 'Wonder Window' }, Object.fromEntries(ENGINES.map((e) => [e.id, e.name])));
const FACES = ['Lost', 'Tricky', 'OK', 'Good', 'Loved it'];

/* ---------------- periods ---------------- */
export function period(kind, now) {
  now = now || Date.now();
  const d = new Date(now), end = now;
  if (kind === 'month') return { kind, label: 'Last 30 days', from: now - 30 * DAY, to: end };
  if (kind === 'term') {
    const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
    const from = new Date(y, 8, 1).getTime();
    return { kind, label: 'This school year', from, to: end };
  }
  if (kind === 'all') return { kind, label: 'All time', from: 0, to: end };
  return { kind: 'week', label: 'Last 7 days', from: now - 7 * DAY, to: end };
}
export const fmtDate = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = (t) => new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtTime = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
export function fmtDur(ms) {
  const m = Math.round((ms || 0) / 60000);
  if (m < 1) return ms > 0 ? '<1 min' : '0 min';
  const h = Math.floor(m / 60), r = m % 60;
  return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min';
}
const pl = (v, one, many) => v + ' ' + (v === 1 ? one : many);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const round1 = (v) => Math.round(v * 10) / 10;
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const moodOf = (faces) => { const n = (faces || []).reduce((a, b) => a + (b || 0), 0); return n ? (faces || []).reduce((a, c, i) => a + (c || 0) * (i + 1), 0) / n : 0; };

/* ---------------- the figures ---------------- */
export function metrics(events, per, rosterList) {
  const inR = (e) => (e.end || e.at) >= per.from && e.at <= per.to;
  const evs = events.filter(inR);
  const by = (k) => evs.filter((e) => e.k === k);
  const sessions = by('session'), gens = evs.filter((e) => (e.k === 'gen' || e.k === 'deck') && e.err !== 'cancelled'),
    presents = by('present'), tickets = by('ticket'), fbs = by('fb'), chats = by('chat'), plays = by('play'), ppts = by('ppt'), copies = by('copy'), views = by('view');
  const people = new Map();
  const person = (id, name, role) => {
    if (!people.has(id)) people.set(id, { id, name: name || 'Unknown', role: role || 'teacher', sessions: 0, act: 0, first: 0, last: 0, devices: new Set(), late: 0, weekend: 0, short: 0, long: 0,
      gens: 0, ok: 0, fail: 0, genMs: [], presents: 0, presentMs: 0, tickets: 0, faces: [0, 0, 0, 0, 0], fb: [], chats: 0, plays: 0, enrolled: false, prevAct: 0 });
    const p = people.get(id);
    if (name && p.name === 'Unknown') p.name = name;
    return p;
  };
  (rosterList || []).forEach((r) => { const p = person(r.id, r.n, 'teacher'); p.enrolled = true; p.name = r.n; });
  sessions.forEach((s) => {
    const p = person(s.t, s.tn, s.r);
    p.sessions++; p.act += s.act || 0;
    p.first = p.first ? Math.min(p.first, s.at) : s.at; p.last = Math.max(p.last, s.end || s.at);
    p.devices.add((s.dk || 'Device') + ' · ' + (s.br || 'browser'));
    const h = new Date(s.at).getHours(), wd = new Date(s.at).getDay();
    if (h >= 21 || h < 6) p.late++;
    if (wd === 0 || wd === 6) p.weekend++;
    if ((s.act || 0) < 3 * 60000 && (s.end - s.at) < 6 * 60000) p.short++;
    if ((s.act || 0) >= 3 * 3600000) p.long++;
  });
  gens.forEach((g) => { const p = person(g.t, g.tn, g.r); p.gens++; if (g.ok) { p.ok++; if (g.ms) p.genMs.push(g.ms); } else p.fail++; p.last = Math.max(p.last, g.at); });
  presents.forEach((x) => { const p = person(x.t, x.tn, x.r); p.presents++; p.presentMs += x.ms || 0; p.last = Math.max(p.last, x.at); });
  tickets.forEach((x) => { const p = person(x.t, x.tn, x.r); p.tickets++; (x.faces || []).forEach((c, i) => { p.faces[i] += c || 0; }); });
  fbs.forEach((x) => { const p = person(x.t, x.tn, x.r); p.fb.push(x); });
  chats.forEach((x) => { person(x.t, x.tn, x.r).chats++; });
  plays.forEach((x) => { person(x.t, x.tn, x.r).plays++; });
  // previous window of the same length, for "less than usual"
  const len = per.to - per.from;
  if (per.kind === 'week') {
    events.filter((e) => e.k === 'session' && e.at >= per.from - 3 * len && e.at < per.from).forEach((s) => { if (people.has(s.t)) people.get(s.t).prevAct += (s.act || 0) / 3; });
  }
  const list = Array.from(people.values()).map((p) => Object.assign(p, {
    devices: Array.from(p.devices), avgSession: p.sessions ? p.act / p.sessions : 0, genAvg: avg(p.genMs), mood: moodOf(p.faces),
    rating: avg(p.fb.map((f) => f.rating).filter(Boolean))
  })).sort((a, b) => b.act - a.act || a.name.localeCompare(b.name));

  const faces = [0, 0, 0, 0, 0];
  tickets.forEach((x) => (x.faces || []).forEach((c, i) => { faces[i] += c || 0; }));
  const best = {};
  tickets.forEach((x) => Object.entries(x.best || {}).forEach(([k, v]) => { best[k] = (best[k] || 0) + (v || 0); }));
  const engines = {};
  const eng = (id) => engines[id] || (engines[id] = { id, name: ENGINE_NAMES[id] || id, views: 0, gens: 0, ok: 0, fail: 0, ms: [], presents: 0, presentMs: 0, tickets: 0, faces: [0, 0, 0, 0, 0] });
  views.forEach((v) => { if (v.page && ENGINE_NAMES[v.page]) eng(v.page).views++; });
  gens.forEach((g) => { const e = eng(g.eng || 'slides'); e.gens++; if (g.ok) { e.ok++; if (g.ms) e.ms.push(g.ms); } else e.fail++; });
  presents.forEach((x) => { const e = eng(x.eng || 'slides'); e.presents++; e.presentMs += x.ms || 0; });
  tickets.forEach((x) => { const e = eng(x.eng || 'slides'); e.tickets++; (x.faces || []).forEach((c, i) => { e.faces[i] += c || 0; }); });
  plays.forEach((x) => { const e = eng('play'); e.presents++; e.presentMs += x.ms || 0; });
  const engineList = Object.values(engines).map((e) => Object.assign(e, { avgMs: avg(e.ms), mood: moodOf(e.faces) })).sort((a, b) => (b.gens + b.presents) - (a.gens + a.presents));

  // days
  const days = [];
  const firstDay = startOfDay(per.kind === 'week' ? per.from + 1 : per.kind === 'month' ? per.from + 1 : Math.max(per.from, per.to - 59 * DAY));
  for (let t = firstDay; t <= per.to; t += DAY) days.push({ t, act: 0, gens: 0, presents: 0 });
  const dayOf = (t) => { const i = Math.floor((startOfDay(t) - firstDay) / DAY); return days[i]; };
  sessions.forEach((s) => { const d = dayOf(s.at); if (d && s.r !== 'admin') d.act += s.act || 0; });
  gens.forEach((g) => { const d = dayOf(g.at); if (d && g.ok) d.gens++; });
  presents.forEach((x) => { const d = dayOf(x.at); if (d) d.presents++; });
  const heat = Array.from({ length: 7 }, () => new Array(24).fill(0));
  sessions.forEach((s) => { if (s.r === 'admin') return; const d = new Date(s.at); heat[(d.getDay() + 6) % 7][d.getHours()] += Math.max(1, Math.round((s.act || 0) / 60000)); });

  const lessons = presents.slice().sort((a, b) => b.at - a.at).map((x) => {
    const tk = tickets.find((t) => t.t === x.t && (t.eng || 'slides') === (x.eng || 'slides') && t.title === x.title && Math.abs(t.at - x.at) < 6 * 3600000);
    return { at: x.at, who: x.tn, eng: ENGINE_NAMES[x.eng] || x.eng, title: x.title || '', ms: x.ms || 0, seen: x.seen || 0, screens: x.screens || 0, ex: !!x.ex, mood: tk ? moodOf(tk.faces) : 0, votes: tk ? (tk.total || 0) : 0 };
  });
  const teach = sessions.filter((s) => s.r !== 'admin');
  const totals = {
    people: list.filter((p) => p.sessions > 0 && p.role !== 'admin').length, enrolled: (rosterList || []).length, sessions: teach.length,
    act: teach.reduce((a, s) => a + (s.act || 0), 0), gens: gens.length, ok: gens.filter((g) => g.ok).length, fail: gens.filter((g) => !g.ok).length,
    genAvg: avg(gens.filter((g) => g.ok && g.ms).map((g) => g.ms)), presents: presents.length, presentMs: presents.reduce((a, x) => a + (x.ms || 0), 0),
    tickets: tickets.length, votes: faces.reduce((a, b) => a + b, 0), mood: moodOf(faces), fb: fbs.length, rating: avg(fbs.map((f) => f.rating).filter(Boolean)),
    chats: chats.length, plays: plays.length, playMs: plays.reduce((a, x) => a + (x.ms || 0), 0), ppts: ppts.length, copies: copies.length
  };
  const m = { per, people: list, totals, faces, best: Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 6), engines: engineList, days, heat, lessons, feedback: fbs.slice().sort((a, b) => b.at - a.at), tickets: tickets.slice().sort((a, b) => b.at - a.at) };
  m.deviations = deviations(m, events);
  return m;
}

/* ---------------- what needs a look ---------------- */
export function deviations(m, events) {
  const out = [], now = m.per.to;
  const add = (sev, code, who, text, at) => out.push({ sev, code, who: who || '', text, at: at || now });
  m.people.forEach((p) => {
    if (p.role === 'admin') return;
    const lastAny = events.filter((e) => e.t === p.id && (e.k === 'session')).reduce((a, e) => Math.max(a, e.end || e.at), 0);
    if (p.enrolled && (!lastAny || now - lastAny > 7 * DAY)) add('medium', 'quiet', p.name, lastAny ? 'No teaching sessions for ' + Math.floor((now - lastAny) / DAY) + ' days (last seen ' + fmtDate(lastAny) + ').' : 'Enrolled but has not signed in yet.', lastAny || now);
    if (p.fail >= 3 || (p.gens >= 3 && p.fail / p.gens >= 0.3)) add('high', 'fails', p.name, p.fail + ' of ' + p.gens + ' lessons failed to make. Check their internet connection or the key.', p.last);
    if (p.short >= 3) add('low', 'short', p.name, p.short + ' very short visits (under 3 minutes). They may be struggling to get started.', p.last);
    if (p.long) add('low', 'long', p.name, p.long + (p.long > 1 ? ' sessions' : ' session') + ' of 3 hours or more. Worth checking their workload.', p.last);
    if (p.late >= 2) add('medium', 'late', p.name, p.late + ' sessions started after 9 pm. Worth a wellbeing check-in.', p.last);
    if (p.genAvg > 90000) add('low', 'slow', p.name, 'Lessons take ' + Math.round(p.genAvg / 1000) + ' seconds on average to make (usually under a minute). Their connection may be slow.', p.last);
    if (m.per.kind === 'week' && p.prevAct > 30 * 60000 && p.act < p.prevAct * 0.4) add('medium', 'drop', p.name, 'Teaching time fell to ' + fmtDur(p.act) + ' from about ' + fmtDur(p.prevAct) + ' a week.', p.last);
    if (p.presents >= 4 && p.tickets / p.presents < 0.3) add('low', 'noticket', p.name, 'Presented ' + p.presents + ' lessons but collected class feedback for ' + p.tickets + '.', p.last);
    p.fb.forEach((f) => { if (f.rating && f.rating <= 2) add('high', 'rating', p.name, 'Rated the engine ' + f.rating + ' out of 5' + (f.better ? ': “' + String(f.better).slice(0, 120) + '”' : '.'), f.at); });
  });
  m.lessons.forEach((l) => { if (l.votes >= 5 && l.mood && l.mood < 3) add('high', 'mood', l.who, 'Class mood ' + round1(l.mood) + ' out of 5 for “' + (l.title || l.eng) + '” (' + l.eng + ', ' + fmtDay(l.at) + '). Pupils found it hard.', l.at); });
  m.engines.forEach((e) => { if (e.gens >= 4 && e.fail / e.gens >= 0.4) add('high', 'engine', '', e.name + ' failed ' + e.fail + ' of ' + e.gens + ' times. It may need attention.', now); });
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev] || b.at - a.at);
}

/* ---------------- Symphony's briefing ---------------- */
export function digest(m) {
  const T = m.totals, L = [];
  L.push('Period: ' + m.per.label + ' (' + fmtDate(Math.max(m.per.from, firstAt(m) || m.per.from)) + ' to ' + fmtDate(m.per.to) + ').');
  L.push('Teachers active: ' + T.people + (T.enrolled ? ' of ' + T.enrolled + ' enrolled' : '') + '. Teaching sessions: ' + T.sessions + '. Teaching time logged: ' + fmtDur(T.act) + (T.sessions ? ' (average ' + fmtDur(T.act / T.sessions) + ' per session)' : '') + '. Rabinder’s own admin time is not counted as teaching time.');
  L.push('Lessons made: ' + T.ok + (T.fail ? ' (' + T.fail + ' failed)' : '') + (T.genAvg ? ', usually ready in ' + Math.round(T.genAvg / 1000) + ' seconds' : '') + '. Lessons presented: ' + T.presents + ' (' + fmtDur(T.presentMs) + ' on screen). PowerPoints downloaded: ' + T.ppts + '.');
  L.push('Class feedback: ' + pl(T.tickets, 'lesson', 'lessons') + ', ' + pl(T.votes, 'pupil answer', 'pupil answers') + (T.votes ? ', average mood ' + round1(T.mood) + ' out of 5 (' + FACES.map((f, i) => f + ' ' + m.faces[i]).reverse().join(', ') + ')' : '') + '.');
  if (m.best.length) L.push('Pupils’ favourite parts: ' + m.best.slice(0, 3).map(([k, v]) => k + ' (' + v + ')').join(', ') + '.');
  if (m.engines.length) L.push('Most used: ' + m.engines.slice(0, 4).map((e) => e.name + ' (' + (e.gens + e.presents) + ')').join(', ') + '.');
  if (m.people.length) L.push('By teacher: ' + m.people.filter((p) => p.sessions || p.enrolled).slice(0, 12).map((p) => p.name + (p.role === 'admin' ? ' (you)' : '') + ': ' + fmtDur(p.act) + ', ' + pl(p.sessions, 'session', 'sessions') + ', ' + p.ok + ' made, ' + p.presents + ' presented' + (p.mood ? ', class mood ' + round1(p.mood) : '') + (p.last ? ', last active ' + fmtDay(p.last) : ', not active')).join('; ') + '.');
  L.push(m.deviations.length ? 'Things to look at (' + m.deviations.length + '): ' + m.deviations.slice(0, 8).map((d) => d.sev.toUpperCase() + ' ' + (d.who ? d.who + ': ' : '') + d.text).join(' | ') : 'Nothing unusual to flag.');
  if (T.fb) L.push('Teacher feedback: ' + pl(T.fb, 'response', 'responses') + ', average ' + round1(T.rating) + ' out of 5. ' + m.feedback.slice(0, 3).map((f) => f.tn + ': worked well “' + clip(f.good) + '”, change “' + clip(f.better) + '”').join(' '));
  L.push('Symphony questions asked: ' + T.chats + '. Wonder Window scenes shown: ' + T.plays + '.');
  return L.join('\n');
}
function firstAt(m) { return m.people.reduce((a, p) => (p.first && (!a || p.first < a) ? p.first : a), 0); }
const clip = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 140) || 'nothing written';

/* A short spoken summary (used when Symphony answers without the engine) */
export function spoken(m) {
  const T = m.totals;
  const n = (v, one, many) => v + ' ' + (v === 1 ? one : many);
  const parts = [T.sessions ? m.per.label + ': ' + n(T.people, 'teacher', 'teachers') + ' taught for ' + fmtDur(T.act) + ' over ' + n(T.sessions, 'session', 'sessions') + '.' : m.per.label + ': no teaching sessions have been logged yet.',
    n(T.ok, 'lesson', 'lessons') + ' made and ' + T.presents + ' presented.'];
  if (T.votes) parts.push('Pupils rated their lessons ' + round1(T.mood) + ' out of 5 on average.');
  const hi = m.deviations.filter((d) => d.sev === 'high').length;
  parts.push(m.deviations.length ? n(m.deviations.length, 'thing', 'things') + ' to look at' + (hi ? ', ' + hi + ' of them important' : '') + '. ' + (m.deviations.length === 1 ? 'It is' : 'The first is') + ': ' + (m.deviations[0].who ? m.deviations[0].who + ', ' : '') + m.deviations[0].text : 'Nothing unusual to flag.');
  return parts.join(' ');
}

/* ---------------- CSV ---------------- */
export function csv(events) {
  const head = ['date', 'time', 'person', 'role', 'what', 'engine', 'title', 'year', 'result', 'minutes', 'screens_seen', 'class_answers', 'class_mood', 'rating', 'device', 'session'];
  const q = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = events.slice().sort((a, b) => a.at - b.at).map((e) => [
    new Date(e.at).toISOString().slice(0, 10), fmtTime(e.at), e.tn, e.r, e.k, ENGINE_NAMES[e.eng] || e.eng || e.page || '', e.title || '', e.year || '',
    e.k === 'gen' || e.k === 'deck' ? (e.ok ? 'made' : 'failed: ' + (e.err || '')) : '', e.k === 'session' ? round1((e.act || 0) / 60000) : e.ms ? round1(e.ms / 60000) : '',
    e.seen || '', e.total || '', e.faces ? round1(moodOf(e.faces)) : '', e.rating || '', (e.dk || '') + (e.br ? ' ' + e.br : ''), e.ses || (e.k === 'session' ? e.id : '')
  ].map(q).join(','));
  return '﻿' + head.join(',') + '\n' + rows.join('\n') + '\n';
}

/* ---------------- the downloadable report ---------------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function moodColour(v) { return !v ? '#94A3B8' : v >= 4 ? '#16A34A' : v >= 3.3 ? '#65A30D' : v >= 2.6 ? '#D97706' : '#DC2626'; }
function bars(days) {
  const W = 680, H = 170, pad = 26, n = days.length || 1, bw = (W - pad * 2) / n;
  const max = Math.max(1, ...days.map((d) => d.act / 60000));
  const maxL = Math.max(1, ...days.map((d) => d.presents + d.gens));
  let s = '<svg viewBox="0 0 ' + W + ' ' + (H + 30) + '" width="100%" role="img" aria-label="Teaching time per day">';
  [0.25, 0.5, 0.75, 1].forEach((f) => { const y = H - (H - 14) * f; s += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" stroke="#E5E9F2"/>'; });
  days.forEach((d, i) => {
    const h = (H - 14) * (d.act / 60000) / max, x = pad + i * bw;
    s += '<rect x="' + (x + bw * 0.16).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw * 0.68).toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="3" fill="#6C63FF"><title>' + esc(fmtDay(d.t)) + ': ' + esc(fmtDur(d.act)) + '</title></rect>';
    const l = (d.presents + d.gens) / maxL * (H - 14);
    if (d.presents + d.gens) s += '<circle cx="' + (x + bw / 2).toFixed(1) + '" cy="' + (H - l).toFixed(1) + '" r="3.2" fill="#F59E0B"/>';
    if (n <= 14 || i % Math.ceil(n / 10) === 0) s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H + 16) + '" font-size="10" text-anchor="middle" fill="#6B7280">' + esc(new Date(d.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '</text>';
  });
  s += '<text x="' + pad + '" y="10" font-size="10" fill="#6B7280">Peak ' + esc(fmtDur(max * 60000)) + ' a day</text></svg>';
  return s;
}
function heatmap(heat) {
  const cell = 22, gap = 3, left = 34, top = 18, max = Math.max(1, ...heat.flat());
  const W = left + 24 * (cell + gap), H = top + 7 * (cell + gap);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="When teaching happens">';
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d, r) => { s += '<text x="0" y="' + (top + r * (cell + gap) + 15) + '" font-size="10" fill="#6B7280">' + d + '</text>'; });
  for (let h = 0; h < 24; h += 3) s += '<text x="' + (left + h * (cell + gap)) + '" y="11" font-size="9" fill="#6B7280">' + String(h).padStart(2, '0') + ':00</text>';
  heat.forEach((row, r) => row.forEach((v, h) => {
    const a = v ? 0.15 + 0.85 * (v / max) : 0;
    s += '<rect x="' + (left + h * (cell + gap)) + '" y="' + (top + r * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="4" fill="' + (v ? 'rgba(56,178,172,' + a.toFixed(2) + ')' : '#F1F4F9') + '"><title>' + v + ' min</title></rect>';
  }));
  return s + '</svg>';
}
function hbar(v, max, colour) { const w = max ? Math.max(2, Math.round(100 * v / max)) : 0; return '<span class="hb"><i style="width:' + w + '%;background:' + colour + '"></i></span>'; }
const sevPill = (s) => '<span class="sev ' + s + '">' + ({ high: 'Important', medium: 'Check', low: 'Note' })[s] + '</span>';

export function reportHTML(m, o) {
  o = o || {};
  const T = m.totals, maxAct = Math.max(1, ...m.people.map((p) => p.act)), maxEng = Math.max(1, ...m.engines.map((e) => e.gens + e.presents)), maxFace = Math.max(1, ...m.faces);
  const kpi = (n, l, c, sub) => '<div class="kpi" style="--k:' + c + '"><b>' + esc(n) + '</b><span>' + esc(l) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  const actions = m.deviations.slice(0, 10).map((d) => '<li><span class="box"></span><span>' + sevPill(d.sev) + ' <b>' + esc(d.who || 'Engine') + '</b> ' + esc(d.text) + '</span></li>').join('');
  const brief = digest(m).split('\n').map((l) => '<li>' + esc(l) + '</li>').join('');
  const facesSVG = (i) => { const c = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A'][i]; const mouth = ['M8 17c2-2.4 6-2.4 8 0', 'M8.5 16.4c2-1.2 5-1.2 7 0', 'M8.5 15.6h7', 'M8.5 14.6c2 1.6 5 1.6 7 0', 'M8 14c2 2.8 6 2.8 8 0']; return '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="10" fill="' + c + '"/><circle cx="9" cy="10" r="1.3" fill="#fff"/><circle cx="15" cy="10" r="1.3" fill="#fff"/><path d="' + mouth[i] + '" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'; };
  const html = '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc('KS2 Lesson Engine report · ' + m.per.label) + '</title><style>' +
  ':root{--ink:#1F2733;--muted:#64748B;--line:#E5E9F2;--soft:#F6F8FC;--violet:#6C63FF;--teal:#2C9C96;--amber:#D97706;--red:#DC2626;--green:#16A34A}' +
  '*{box-sizing:border-box}body{margin:0;background:#EEF1F7;color:var(--ink);font:14px/1.5 "Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
  '.page{max-width:900px;margin:0 auto;padding:28px 22px 60px}.cover{border-radius:26px;padding:30px 32px;color:#fff;background:linear-gradient(130deg,#4F46E5 0%,#6C63FF 45%,#2C9C96 100%);box-shadow:0 20px 40px -24px rgba(40,40,120,.6);position:relative;overflow:hidden}' +
  '.cover:after{content:"";position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.28),rgba(255,255,255,0) 70%)}' +
  '.cover small{letter-spacing:.16em;text-transform:uppercase;font-weight:700;opacity:.85}.cover h1{margin:8px 0 6px;font-size:30px;line-height:1.1;letter-spacing:-.02em}.cover p{margin:0;opacity:.92}.cover .meta{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px}' +
  '.cover .meta span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 12px;font-size:12.5px}' +
  '.btns{display:flex;gap:10px;justify-content:flex-end;margin:14px 0 0}.btns button{border:0;border-radius:12px;padding:10px 16px;font-family:inherit;font-weight:600;font-size:13.5px;background:#fff;color:var(--ink);box-shadow:0 4px 12px -6px rgba(0,0,0,.3);cursor:pointer}' +
  'section{background:#fff;border-radius:22px;padding:22px 24px;margin-top:16px;box-shadow:0 10px 30px -22px rgba(30,40,70,.35);break-inside:avoid}h2{margin:0 0 12px;font-size:18px;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}h2 i{width:10px;height:10px;border-radius:3px;background:var(--violet);display:inline-block}' +
  '.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.kpi{border-radius:16px;padding:14px 16px;background:var(--soft);border-top:4px solid var(--k)}.kpi b{display:block;font-size:26px;line-height:1.1;color:var(--k);letter-spacing:-.02em}.kpi span{display:block;font-weight:600;font-size:12.5px;margin-top:3px}.kpi small{display:block;color:var(--muted);font-size:11.5px}' +
  'ul.brief{margin:0;padding-left:18px;display:grid;gap:6px}ul.check{list-style:none;margin:0;padding:0;display:grid;gap:8px}ul.check li{display:flex;gap:10px;align-items:flex-start}.box{flex:none;width:16px;height:16px;border:2px solid #94A3B8;border-radius:4px;margin-top:2px}' +
  'table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:6px 8px;border-bottom:2px solid var(--line)}td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border-bottom:0}' +
  '.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.hb{display:inline-block;width:90px;height:8px;border-radius:99px;background:#EEF1F7;vertical-align:middle;margin-left:8px;overflow:hidden}.hb i{display:block;height:100%;border-radius:99px}' +
  '.sev{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:2px 8px}.sev.high{background:#FEE2E2;color:#B91C1C}.sev.medium{background:#FEF3C7;color:#92400E}.sev.low{background:#E0F2FE;color:#075985}' +
  '.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.faces{display:grid;gap:8px}.face{display:flex;align-items:center;gap:10px}.face b{width:70px;font-size:12.5px}.face .hb{flex:1;width:auto;height:12px;margin:0}.face em{font-style:normal;width:34px;text-align:right;font-weight:700}' +
  '.fb{border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-top:10px}.fb .st{color:#F59E0B;letter-spacing:2px}.muted{color:var(--muted)}.foot{color:var(--muted);font-size:12px;text-align:center;margin-top:22px}.legend{display:flex;gap:14px;font-size:12px;color:var(--muted);margin-top:6px}.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}' +
  '@media (max-width:700px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.two{grid-template-columns:minmax(0,1fr)}.hide-s{display:none}}' +
  '@page{size:A4;margin:12mm}@media print{body{background:#fff}.page{padding:0}.btns{display:none}section{box-shadow:none;border:1px solid var(--line)}}' +
  '</style></head><body><div class="page">' +
  '<div class="cover"><small>KS2 Lesson Engine · Online learning report</small><h1>' + esc(m.per.label) + '</h1><p>Prepared for ' + esc(o.for || 'Rabinder Kaur, Head of Key Stage 2') + '</p>' +
  '<div class="meta"><span>' + esc(fmtDate(Math.max(m.per.from, firstAt(m) || m.per.from))) + ' to ' + esc(fmtDate(m.per.to)) + '</span><span>Generated ' + esc(fmtDate(Date.now()) + ' ' + fmtTime(Date.now())) + '</span><span>' + esc(String(o.sources || 1)) + ' data source' + ((o.sources || 1) === 1 ? '' : 's') + '</span></div></div>' +
  '<div class="btns"><button type="button" id="pr">Print or save as PDF</button></div>' +
  '<section><h2><i></i>At a glance</h2><div class="kpis">' +
    kpi(fmtDur(T.act), 'Teaching time logged', '#6C63FF', pl(T.sessions, 'session', 'sessions')) + kpi(T.people + (T.enrolled ? ' / ' + T.enrolled : ''), 'Teachers active', '#2C9C96', T.enrolled ? 'of those enrolled' : '') +
    kpi(T.ok, 'Lessons made', '#4F5BD5', T.fail ? T.fail + ' failed' : 'none failed') + kpi(T.presents, 'Lessons presented', '#E07B2E', fmtDur(T.presentMs) + ' on screen') +
    kpi(T.votes ? round1(T.mood) + ' / 5' : '–', 'Class mood', moodColour(T.mood), pl(T.votes, 'pupil answer', 'pupil answers')) + kpi(T.fb ? round1(T.rating) + ' / 5' : '–', 'Teacher rating', '#C38A12', pl(T.fb, 'response', 'responses')) +
    kpi(m.deviations.length, 'Things to look at', m.deviations.some((d) => d.sev === 'high') ? '#DC2626' : m.deviations.length ? '#D97706' : '#16A34A', m.deviations.filter((d) => d.sev === 'high').length + ' important') + kpi(T.chats, 'Questions to Symphony', '#9A55CF', pl(T.plays, 'Wonder Window scene', 'Wonder Window scenes')) +
  '</div></section>' +
  (o.analysis ? '<section><h2><i style="background:#E2558A"></i>Symphony’s analysis</h2>' + o.analysis + '</section>' : '') +
  '<section><h2><i style="background:#2C9C96"></i>Briefing</h2><ul class="brief">' + brief + '</ul></section>' +
  '<section><h2><i style="background:#DC2626"></i>Actions for this week</h2>' + (actions ? '<ul class="check">' + actions + '</ul>' : '<p class="muted">Nothing unusual. Everyone is on track.</p>') + '</section>' +
  '<section><h2><i></i>Time logged by teacher</h2><table><thead><tr><th>Teacher</th><th class="num">Time</th><th class="num">Sessions</th><th class="num hide-s">Average</th><th class="num">Made</th><th class="num">Presented</th><th class="num">Mood</th><th class="hide-s">Last active</th></tr></thead><tbody>' +
    (m.people.filter((p) => p.sessions || p.enrolled).map((p) => '<tr><td><b>' + esc(p.name) + '</b>' + (p.role === 'admin' ? ' <span class="muted">(admin)</span>' : '') + '<br><span class="muted">' + esc(p.devices.join(', ') || 'no device yet') + '</span></td><td class="num">' + esc(fmtDur(p.act)) + hbar(p.act, maxAct, '#6C63FF') + '</td><td class="num">' + p.sessions + '</td><td class="num hide-s">' + esc(fmtDur(p.avgSession)) + '</td><td class="num">' + p.ok + (p.fail ? ' <span class="muted">(' + p.fail + ' failed)</span>' : '') + '</td><td class="num">' + p.presents + '</td><td class="num" style="color:' + moodColour(p.mood) + ';font-weight:700">' + (p.mood ? round1(p.mood) : '–') + '</td><td class="hide-s">' + (p.last ? esc(fmtDay(p.last)) : '<span class="muted">not yet</span>') + '</td></tr>').join('') || '<tr><td colspan="8" class="muted">No sessions in this period.</td></tr>') + '</tbody></table></section>' +
  '<section><h2><i style="background:#D97706"></i>Deviations</h2>' + (m.deviations.length ? '<table><thead><tr><th>Level</th><th>Who</th><th>What</th><th class="hide-s">When</th></tr></thead><tbody>' + m.deviations.map((d) => '<tr><td>' + sevPill(d.sev) + '</td><td><b>' + esc(d.who || 'Engine') + '</b></td><td>' + esc(d.text) + '</td><td class="hide-s">' + esc(fmtDay(d.at)) + '</td></tr>').join('') + '</tbody></table>' : '<p class="muted">No deviations in this period.</p>') + '</section>' +
  '<section><h2><i style="background:#6C63FF"></i>Teaching time per day</h2>' + bars(m.days) + '<div class="legend"><span><i style="background:#6C63FF"></i>Active teaching time</span><span><i style="background:#F59E0B;border-radius:50%"></i>Lessons made and presented</span></div></section>' +
  '<section><h2><i style="background:#2C9C96"></i>When teaching happens</h2>' + heatmap(m.heat) + '<p class="muted" style="margin:6px 0 0">Darker squares mean more minutes of teaching in that hour.</p></section>' +
  '<section><h2><i style="background:#4F5BD5"></i>Engines</h2><table><thead><tr><th>Engine</th><th class="num">Made</th><th class="num">Failed</th><th class="num hide-s">Ready in</th><th class="num">Presented</th><th class="num">Mood</th></tr></thead><tbody>' +
    (m.engines.map((e) => '<tr><td><b>' + esc(e.name) + '</b>' + hbar(e.gens + e.presents, maxEng, '#4F5BD5') + '</td><td class="num">' + e.ok + '</td><td class="num"' + (e.fail ? ' style="color:#DC2626;font-weight:700"' : '') + '>' + e.fail + '</td><td class="num hide-s">' + (e.avgMs ? Math.round(e.avgMs / 1000) + ' s' : '–') + '</td><td class="num">' + e.presents + (e.presentMs ? ' <span class="muted">(' + esc(fmtDur(e.presentMs)) + ')</span>' : '') + '</td><td class="num" style="color:' + moodColour(e.mood) + ';font-weight:700">' + (e.mood ? round1(e.mood) : '–') + '</td></tr>').join('') || '<tr><td colspan="6" class="muted">No engine use in this period.</td></tr>') + '</tbody></table></section>' +
  '<section><h2><i style="background:#16A34A"></i>Class voice</h2><div class="two"><div class="faces">' +
    m.faces.map((c, i) => ({ c, i })).reverse().map(({ c, i }) => '<div class="face">' + facesSVG(i) + '<b>' + FACES[i] + '</b>' + hbar(c, maxFace, ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A'][i]) + '<em>' + c + '</em></div>').join('') +
    '<p class="muted" style="margin:6px 0 0">' + T.votes + ' answers from ' + pl(T.tickets, 'lesson', 'lessons') + '. Pupils answer anonymously.</p></div><div><b>Favourite parts</b>' + (m.best.length ? '<ul class="brief" style="margin-top:6px">' + m.best.map(([k, v]) => '<li>' + esc(k) + ' <span class="muted">(' + v + ')</span></li>').join('') + '</ul>' : '<p class="muted">No favourites recorded yet.</p>') + '</div></div>' +
    (m.lessons.length ? '<table style="margin-top:14px"><thead><tr><th>Lesson</th><th class="hide-s">Teacher</th><th class="num">On screen</th><th class="num">Mood</th></tr></thead><tbody>' + m.lessons.slice(0, 25).map((l) => '<tr><td><b>' + esc(l.title || l.eng) + '</b><br><span class="muted">' + esc(l.eng + ' · ' + fmtDay(l.at) + ' ' + fmtTime(l.at) + (l.ex ? ' · example' : '')) + '</span></td><td class="hide-s">' + esc(l.who) + '</td><td class="num">' + esc(fmtDur(l.ms)) + '</td><td class="num" style="color:' + moodColour(l.mood) + ';font-weight:700">' + (l.mood ? round1(l.mood) + ' <span class="muted">(' + l.votes + ')</span>' : '–') + '</td></tr>').join('') + '</tbody></table>' : '') + '</section>' +
  '<section><h2><i style="background:#C38A12"></i>Teacher feedback</h2>' + (m.feedback.length ? m.feedback.map((f) => '<div class="fb"><b>' + esc(f.tn) + '</b> <span class="st">' + '★'.repeat(f.rating || 0) + '<span style="color:#CBD5E1">' + '★'.repeat(5 - (f.rating || 0)) + '</span></span> <span class="muted">' + esc(fmtDay(f.at)) + '</span>' +
    (f.used && f.used.length ? '<div class="muted">Used: ' + esc(f.used.join(', ')) + '</div>' : '') + (f.good ? '<div><b>Worked well:</b> ' + esc(f.good) + '</div>' : '') + (f.better ? '<div><b>Change:</b> ' + esc(f.better) + '</div>' : '') + (f.pupils ? '<div><b>Pupils:</b> ' + esc(f.pupils) + '</div>' : '') + '</div>').join('') : '<p class="muted">No teacher feedback in this period.</p>') + '</section>' +
  '<section><h2><i style="background:#64748B"></i>How these numbers work</h2><ul class="brief"><li><b>Teaching time</b> counts only minutes when the site was open and someone used it in the previous two minutes.</li><li><b>Deviations</b> flag: no sessions for 7 days, 3 or more failed lessons, sessions after 9 pm, very short or 3-hour sessions, slow lesson making, a big drop in weekly time, class mood under 3 with at least 5 answers, few feedback screens, and ratings of 2 or less.</li><li><b>Class mood</b> is the average of anonymous 1 to 5 answers (Lost = 1, Loved it = 5).</li><li><b>Data</b> comes from this device and from teachers’ devices, which send it by itself, locked so only this dashboard can open it. It never includes pupils’ names or what anyone asked Symphony.</li></ul></section>' +
  '<p class="foot">Made with ♥ for Rabinder Kaur · KS2 Lesson Engine</p></div>' +
  '<script>document.getElementById("pr").addEventListener("click",function(){window.print()});<\/script></body></html>';
  return html;
}
