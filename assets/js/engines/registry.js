/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=1e9e4bc0';
import story from './story.js?v=1e9e4bc0';
import reading from './reading.js?v=1e9e4bc0';
import science from './science.js?v=1e9e4bc0';
import sound from './journey.js?v=1e9e4bc0';
import code from './code.js?v=1e9e4bc0';
import steps from './steps.js?v=1e9e4bc0';
import escape from './escape.js?v=1e9e4bc0';
import brainbreak from './brainbreak.js?v=1e9e4bc0';
import debate from './debate.js?v=1e9e4bc0';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
