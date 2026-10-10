/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js';
import story from './story.js';
import reading from './reading.js';
import science from './science.js';
import sound from './journey.js';
import code from './code.js';
import steps from './steps.js';
import escape from './escape.js';
import brainbreak from './brainbreak.js';
import debate from './debate.js';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
