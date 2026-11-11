/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=e5cf7b70';
import story from './story.js?v=e5cf7b70';
import reading from './reading.js?v=e5cf7b70';
import science from './science.js?v=e5cf7b70';
import sound from './journey.js?v=e5cf7b70';
import code from './code.js?v=e5cf7b70';
import steps from './steps.js?v=e5cf7b70';
import escape from './escape.js?v=e5cf7b70';
import brainbreak from './brainbreak.js?v=e5cf7b70';
import debate from './debate.js?v=e5cf7b70';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
