/* The luminous switches: Night mode, Symphony's voice, Magic pointer, Teaching online, Sound, Hey Symphony and
   Patient listening. Any element with data-switch="night|voice|pointer|online|sound|wake|patient" toggles that setting; every copy of the switch (header, menu, the
   lit cards on the home page) shows the same state, and lit cards glow when their switch is on. */
import { $, $$, store, bus, prefs, toast } from './core.js?v=de4f9a51';
import { Sound, sfx } from './fx/audio.js?v=de4f9a51';

const THEME_KEY = 'ks2-engine.theme.v1', VOICE_KEY = 'ks2-engine.voice.v1', POINTER_KEY = 'ks2-engine.pointer.v1', WAKE_KEY = 'ks2-engine.wake.v1', PATIENT_KEY = 'ks2-engine.patient.v1';
let onHero = false;

export const settings = {
  get night() { return document.documentElement.getAttribute('data-theme') === 'night'; },
  set night(v) {
    document.documentElement.setAttribute('data-theme', v ? 'night' : 'light');
    store.set(THEME_KEY, v ? 'night' : 'light');
    themeColor(); bus.emit('theme', v ? 'night' : 'light');
  },
  get voice() { return store.get(VOICE_KEY) !== 'off'; },
  set voice(v) { store.set(VOICE_KEY, v ? 'on' : 'off'); bus.emit('voice', !!v); },
  get pointer() { return store.get(POINTER_KEY) === 'on'; },
  set pointer(v) { store.set(POINTER_KEY, v ? 'on' : ''); bus.emit('pointer-pref', !!v); },
  get online() { return prefs.mode === 'online'; },
  set online(v) { prefs.mode = v ? 'online' : 'class'; },
  get sound() { return Sound.on; },
  set sound(v) { Sound.on = !!v; },
  /* Hey Symphony: she listens in the background for her name (chat.js and ear.js do the listening). */
  get wake() { return store.get(WAKE_KEY) === 'on'; },
  set wake(v) { store.set(WAKE_KEY, v ? 'on' : ''); bus.emit('wake', !!v); paintSwitches(); },
  /* Patient listening: a longer pause before she decides you have finished, and a moment for a follow-up. */
  get patient() { return store.get(PATIENT_KEY) !== 'off'; },
  set patient(v) { store.set(PATIENT_KEY, v ? 'on' : 'off'); bus.emit('patient', !!v); }
};

const SAY = {
  night: [ 'Night mode on. Class screens stay bright for your pupils.', 'Night mode off.' ],
  voice: [ 'Symphony will read her answers aloud.', 'Symphony will answer quietly, in text only.' ],
  pointer: [ 'Magic pointer will be on when you present. Press P to switch it.', 'Magic pointer off. Press P while presenting to switch it on.' ],
  online: [ 'Teaching online: prompts say “type in the chat”.', 'Teaching in class: prompts say “show me on your whiteboard”.' ],
  sound: [ 'Sound on: little sounds and the space sound. They go quiet while Symphony speaks.', 'Sound off. Symphony’s voice has its own switch.' ],
  wake: [ 'Say “Hey Symphony”, then your question or what to do. She listens only for her name.', 'Hey Symphony is off. Tap the mic to talk to her.' ],
  patient: [ 'Patient listening: Symphony waits for a longer pause, and listens for a follow-up.', 'Symphony answers after a short pause.' ]
};

function themeColor() {
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', onHero ? '#080A12' : settings.night ? '#151A28' : '#E0E5EC');
}
export function paintSwitches() {
  $$('[data-switch]').forEach((b) => {
    const on = !!settings[b.dataset.switch];
    b.setAttribute('aria-checked', String(on));
    const card = b.closest('.lcard');
    if (card) card.classList.toggle('lit', on);
  });
}
export function initSettings() {
  if (!document.documentElement.getAttribute('data-theme')) document.documentElement.setAttribute('data-theme', 'light');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-switch]');
    if (!b) return;
    const k = b.dataset.switch;
    if (!(k in settings)) return;
    settings[k] = !settings[k];
    paintSwitches();
    sfx(settings[k] ? 'on' : 'off');
    toast(SAY[k][settings[k] ? 0 : 1]);
  });
  bus.on('mode', paintSwitches);
  bus.on('pointer', paintSwitches);
  bus.on('header', (h) => { onHero = !!h; const d = $('#dock'); if (d) d.classList.toggle('tone-dark', onHero); themeColor(); });
  paintSwitches();
  themeColor();
}
