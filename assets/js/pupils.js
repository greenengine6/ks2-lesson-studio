/* Our class: pupils' first names, kept on this device only (never sent to the engine or to Rabinder's reports).
   Symphony uses them to pick someone fairly: nobody is picked twice until everyone has had a turn. The picker shows
   a short shuffle, lands on one name, and Symphony says it. */
import { $, esc, icon, store, bus } from './core.js?v=7c13e055';
import { cleanName } from './live/relay.js?v=7c13e055';
import { Voice } from './fx/voice.js?v=7c13e055';
import { settings } from './settings.js?v=7c13e055';
import { sfx } from './fx/audio.js?v=7c13e055';

const KEY = 'ks2-engine.pupils.v1', BAG = 'ks2-engine.pupils.bag.v1', MAX = 60;
const norm = (n) => String(n || '').toLowerCase().replace(/\s+/g, ' ').trim();
export function pupils() { const v = store.getJSON(KEY, []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x).slice(0, MAX) : []; }
function save(list) { store.setJSON(KEY, list.slice(0, MAX)); try { sessionStorage.removeItem(BAG); } catch (e) { /* ignore */ } bus.emit('pupils', list.length); }
/* "Aisyah, Wei Jie and Priya" or one name on each line → clean first names (no full names, nothing rude). */
export function namesIn(text) {
  // Two words together stay one name (Wei Jie, Mei Ling); a longer run said without pauses is one name per word.
  const out = [];
  String(text || '').split(/\n|,|;|\band\b|\bdan\b|&|\//i).map((x) => x.replace(/[^\p{L}\p{M}'’\- ]+/gu, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
    .forEach((x) => { const w = x.split(' '); if (w.length > 2) w.forEach((y) => out.push(y)); else out.push(x); });
  return out.map((x) => cleanName(x.split(' ').map((y) => y.charAt(0).toUpperCase() + y.slice(1)).join(' '))).filter(Boolean);
}
export function addPupils(names) {
  const list = pupils(), seen = new Set(list.map(norm)), added = [];
  names.forEach((n) => { if (n && !seen.has(norm(n)) && list.length < MAX) { seen.add(norm(n)); list.push(n); added.push(n); } });
  if (added.length) save(list);
  return added;
}
export function setPupils(names) { const seen = new Set(), list = []; names.forEach((n) => { if (n && !seen.has(norm(n))) { seen.add(norm(n)); list.push(n); } }); save(list); return list; }
export function removePupil(name) { save(pupils().filter((n) => norm(n) !== norm(name))); }
export function clearPupils() { save([]); }
/* Fair picking: a shuffled bag; a name comes out once until the bag is empty. */
export function pickPupil() {
  const list = pupils();
  if (!list.length) return '';
  let bag = [];
  try { bag = JSON.parse(sessionStorage.getItem(BAG) || '[]'); } catch (e) { bag = []; }
  bag = Array.isArray(bag) ? bag.filter((n) => list.some((x) => norm(x) === norm(n))) : [];
  if (!bag.length) { bag = list.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } }
  const name = bag.pop();
  try { sessionStorage.setItem(BAG, JSON.stringify(bag)); } catch (e) { /* ignore */ }
  return name;
}

/* ---------------- the picker on screen ---------------- */
let box = null, hideT = 0;
export function showPick(lang) {
  const list = pupils();
  if (!list.length) return '';
  const name = pickPupil();
  if (!box) {
    box = document.createElement('div');
    box.className = 'pick'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Picked');
    box.innerHTML = '<div class="pick-card"><p class="pick-k"></p><p class="pick-name" aria-live="assertive"></p><p class="pick-left"></p><div class="pick-btns"><button type="button" class="btn small" data-pick-again>' + icon('refresh') + '<span></span></button><button type="button" class="btn small icon" data-pick-x aria-label="Close">' + icon('close') + '</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-pick-again]')) { showPick(box.dataset.lang); return; }
      if (e.target === box || e.target.closest('[data-pick-x]')) hidePick();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box && !box.hidden) { e.stopPropagation(); hidePick(); } }, true);
  }
  const ms = lang === 'ms';
  box.dataset.lang = ms ? 'ms' : 'en';
  $('.pick-k', box).textContent = ms ? 'Giliran…' : 'Your turn…';
  $('[data-pick-again] span', box).textContent = ms ? 'Pilih lagi' : 'Pick again';
  let left = 0;
  try { left = JSON.parse(sessionStorage.getItem(BAG) || '[]').length; } catch (e) { left = 0; }
  $('.pick-left', box).textContent = left ? (ms ? left + ' lagi belum dipilih' : left + ' still to be picked') : (ms ? 'Semua sudah dapat giliran' : 'Everyone has had a turn');
  box.hidden = false; box.classList.remove('landed');
  const el = $('.pick-name', box), steps = Math.min(14, 6 + list.length);
  let k = 0;
  clearTimeout(hideT);
  const spin = () => {
    if (k < steps) { el.textContent = list[Math.floor(Math.random() * list.length)]; k++; sfx('tap'); setTimeout(spin, 60 + k * 14); return; }
    el.textContent = name; box.classList.add('landed'); sfx('success');
    if (settings.voice) Voice.say(ms ? 'Giliran ' + name + '!' : name + ', your turn!', { lang: ms ? 'ms' : 'en-GB' });
    hideT = setTimeout(hidePick, 9000);
  };
  spin();
  return name;
}
export function hidePick() { clearTimeout(hideT); if (box) box.hidden = true; }

/* The class list as plain HTML, for Symphony's panel. */
export function pupilsHTML(ms) {
  const list = pupils();
  return '<p class="fine">' + (ms ? 'Nama pertama sahaja, satu setiap baris. Disimpan pada peranti ini sahaja.' : 'First names only, one on each line. Kept on this device only, never sent anywhere.') + '</p>' +
    '<textarea class="pc-names" rows="7" maxlength="1800" aria-label="' + (ms ? 'Nama murid' : 'Pupils’ first names') + '">' + esc(list.join('\n')) + '</textarea>' +
    '<p class="pc-n fine">' + list.length + (ms ? ' murid' : list.length === 1 ? ' pupil' : ' pupils') + '</p>';
}
