/* Touch you can feel (Vik asked for it: "when a pupil touches it they can feel it"). On a phone or tablet with a
   vibration motor, a tap on an animal, a thunderclap, an elephant's footstep or a right answer is felt as well as
   heard. Android phones and tablets play the full pattern through navigator.vibrate. iPhones (iOS 18 and later) have
   no vibration API for web pages, but Safari gives a light "tick" whenever a switch is flipped, so a pattern there is
   played as one to three ticks. iPads, laptops and boards have no motor, so nothing happens there.
   Haptics only follow a touch: a sound that plays on its own (a festival's fireworks, music) is never felt, so a
   pupil's phone does not buzz by itself. One setting on this device turns them off (Settings → Sound and touch). */
const KEY = 'ks2-engine.haptics.v1';
const read = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } };
let on = read(), lastTouch = 0, lastBuzz = 0, sw = null;

const coarse = (() => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
const canVibrate = coarse && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';   // desktop browsers have the call but no motor
const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
const apple = /iPhone|iPod/.test(ua) || (/iPad|Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

/* The patterns, in milliseconds: on, off, on… (Android plays them all; an iPhone plays one tick per "on"). */
const P = {
  tick: [7],                                   // a slider passing a mark, a tab, a list item
  tap: [11],                                   // touching something in a scene
  pop: [9, 40, 7],                             // a bubble, a card opening
  thud: [26],                                  // something heavy: a footstep, a drum
  steps: [22, 160, 22, 160, 22],               // an elephant walking
  gallop: [14, 70, 10, 150, 14, 70, 10],
  success: [12, 80, 20],                       // a right answer, something made
  error: [22, 70, 22],                         // gentle: never a harsh buzz for a wrong answer
  rumble: [30, 40, 50, 30, 80, 60, 40],        // thunder
  roar: [60, 30, 90],                          // a tiger
  splash: [16, 40, 9, 30, 6],
  whoosh: [6, 25, 9, 25, 6],
  buzz: [5, 18, 5, 18, 5, 18, 5],              // wings, fireflies, bees
  boom: [45, 60, 20],                          // a firework
  heartbeat: [14, 120, 22]
};

function tickIOS() {
  try {
    if (!sw) {
      const l = document.createElement('label'), i = document.createElement('input');
      l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
      i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
      l.appendChild(i); document.head.appendChild(l);
      l.addEventListener('click', (e) => e.stopPropagation());      // the page's own click handlers never see it
      sw = l;
    }
    sw.click();
  } catch (e) { /* not supported here */ }
}
/* Remember the last touch, so haptics only ever follow one. */
['pointerdown', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, () => { lastTouch = performance.now(); }, { capture: true, passive: true }));

/* Feel one pattern by name. o.force plays it even without a recent touch (only for things the pupil just did). */
export function haptic(kind, o) {
  if (!on || !(canVibrate || (apple && coarse))) return;
  const now = performance.now();
  if (!(o && o.force) && now - lastTouch > 1500) return;
  if (now - lastBuzz < 45) return;
  lastBuzz = now;
  const p = P[kind] || P.tap;
  if (canVibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } return; }
  // iPhone: one tick for each "on", at least 70 ms apart, three at most
  let t = 0;
  for (let k = 0, n = 0; k < p.length && n < 3; k += 2, n++) {
    if (t === 0) tickIOS(); else setTimeout(tickIOS, t);
    t += Math.max(70, p[k] + (p[k + 1] || 0));
  }
}
/* Silent touches still feel like something: a tap on a Wonder Window scene, a pupil's button, a game. Runs after
   the page's own click handlers, and only if they did not already play a feel (a sound with its own pattern). */
const FELT = '#view-play, .jn, [data-feel], .kg-overlay, .qstage, .ltask, .play-pick';
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!on || !(t instanceof Element) || !t.closest(FELT)) return;
  setTimeout(() => {
    if (lastBuzz >= lastTouch - 5) return;                           // this touch already played its own feel
    if (t.closest('canvas')) haptic('tap');
    else if (t.closest('button, a, [role="tab"], [role="radio"], [role="option"], label, summary, input[type="checkbox"], input[type="radio"]')) haptic('tick');
  }, 0);
}, { passive: true });
/* A slider ticks as it passes each step (at most every 70 ms), like a dial. */
let lastSlide = 0;
document.addEventListener('input', (e) => {
  const t = e.target;
  if (!on || !(t instanceof HTMLInputElement) || t.type !== 'range') return;
  const now = performance.now(); if (now - lastSlide < 70) return; lastSlide = now;
  haptic('tick');
}, { passive: true });

export const Haptics = {
  get on() { return on; },
  set on(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ } if (on) haptic('success', { force: true }); },
  /* this device can be felt at all (a vibration motor, or an iPhone) */
  get supported() { return canVibrate || (apple && coarse); },
  kinds: Object.keys(P)
};
