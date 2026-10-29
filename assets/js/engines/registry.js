/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=73f756c9';
import story from './story.js?v=73f756c9';
import reading from './reading.js?v=73f756c9';
import science from './science.js?v=73f756c9';
import sound from './journey.js?v=73f756c9';
import code from './code.js?v=73f756c9';
import steps from './steps.js?v=73f756c9';
import escape from './escape.js?v=73f756c9';
import brainbreak from './brainbreak.js?v=73f756c9';
import debate from './debate.js?v=73f756c9';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
