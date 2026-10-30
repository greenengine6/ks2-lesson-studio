/* The end of every timer on the site (present mode, Symphony's timer, the escape room's oxygen): the loud end sound
   the teacher chose in Class tools (Rabinder's point 5), with its flash and voice. If Class tools cannot load, the
   soft chime still plays. */
import { sfx } from './audio.js?v=3c9d4698';

export function timesUp(o) {
  import('../tools/tools.js?v=3c9d4698')
    .then((m) => { if (m && typeof m.timesUp === 'function') m.timesUp(o || {}); else sfx('chime'); })
    .catch(() => sfx('chime'));
}
