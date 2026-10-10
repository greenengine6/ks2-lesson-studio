/* Rest times. After a lesson is made, the button that made it rests (Slide Studio: 5 minutes), so a double tap or a
   stray press cannot fire the engine again and the shared key stays well inside its limits.
   Kept per person on this device, so reloading or opening a new tab does not reset it. Nothing here presses anything. */
import { store } from './core.js?v=5de985bf';
import { who } from './people.js?v=5de985bf';

const KEY = 'ks2-engine.cool.v1';
const DAY = 864e5;
const read = () => { const v = store.getJSON(KEY, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
const slot = (name) => name + ':' + (who.id || who.role || 'device');

/* How long is left before `name` can run again, in milliseconds (0 = ready). */
export function restLeft(name, ms) {
  const at = Number(read()[slot(name)]) || 0, now = Date.now();
  if (!at || at > now + 60000) return 0;                 // never pressed, or this device's clock was moved back: no wait
  return Math.min(ms, Math.max(0, at + ms - now));
}
/* Start the rest now (on the press itself). */
export function restStart(name) {
  const v = read(), now = Date.now();
  Object.keys(v).forEach((k) => { if (!(now - Number(v[k]) < DAY)) delete v[k]; });
  v[slot(name)] = now;
  store.setJSON(KEY, v);
}
/* Lift it again, for a press that ended without a result (stopped, or the engine could not finish). */
export function restClear(name) { const v = read(); delete v[slot(name)]; store.setJSON(KEY, v); }
/* Another tab started or lifted a rest. */
export function onRest(fn) { window.addEventListener('storage', (e) => { if (e.key === KEY) fn(); }); }
export const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export const clockAt = (ms) => new Date(Date.now() + ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });   // in the device's own clock style
