/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=51f31f48';
import story from './story.js?v=51f31f48';
import reading from './reading.js?v=51f31f48';
import science from './science.js?v=51f31f48';
import sound from './journey.js?v=51f31f48';
import code from './code.js?v=51f31f48';
import steps from './steps.js?v=51f31f48';
import escape from './escape.js?v=51f31f48';
import brainbreak from './brainbreak.js?v=51f31f48';
import debate from './debate.js?v=51f31f48';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
