/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=ed35fd44';
import story from './story.js?v=ed35fd44';
import reading from './reading.js?v=ed35fd44';
import science from './science.js?v=ed35fd44';
import sound from './journey.js?v=ed35fd44';
import code from './code.js?v=ed35fd44';
import steps from './steps.js?v=ed35fd44';
import escape from './escape.js?v=ed35fd44';
import brainbreak from './brainbreak.js?v=ed35fd44';
import debate from './debate.js?v=ed35fd44';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
