/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=3c9d4698';
import story from './story.js?v=3c9d4698';
import reading from './reading.js?v=3c9d4698';
import science from './science.js?v=3c9d4698';
import sound from './journey.js?v=3c9d4698';
import code from './code.js?v=3c9d4698';
import steps from './steps.js?v=3c9d4698';
import escape from './escape.js?v=3c9d4698';
import brainbreak from './brainbreak.js?v=3c9d4698';
import debate from './debate.js?v=3c9d4698';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
