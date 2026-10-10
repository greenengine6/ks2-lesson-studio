/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=f3cc728c';
import story from './story.js?v=f3cc728c';
import reading from './reading.js?v=f3cc728c';
import science from './science.js?v=f3cc728c';
import sound from './journey.js?v=f3cc728c';
import code from './code.js?v=f3cc728c';
import steps from './steps.js?v=f3cc728c';
import escape from './escape.js?v=f3cc728c';
import brainbreak from './brainbreak.js?v=f3cc728c';
import debate from './debate.js?v=f3cc728c';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
