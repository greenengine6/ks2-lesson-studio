/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=7a165bee';
import story from './story.js?v=7a165bee';
import reading from './reading.js?v=7a165bee';
import science from './science.js?v=7a165bee';
import sound from './journey.js?v=7a165bee';
import code from './code.js?v=7a165bee';
import steps from './steps.js?v=7a165bee';
import escape from './escape.js?v=7a165bee';
import brainbreak from './brainbreak.js?v=7a165bee';
import debate from './debate.js?v=7a165bee';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
