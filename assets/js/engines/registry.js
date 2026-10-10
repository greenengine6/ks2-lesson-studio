/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=5de985bf';
import story from './story.js?v=5de985bf';
import reading from './reading.js?v=5de985bf';
import science from './science.js?v=5de985bf';
import sound from './journey.js?v=5de985bf';
import code from './code.js?v=5de985bf';
import steps from './steps.js?v=5de985bf';
import escape from './escape.js?v=5de985bf';
import brainbreak from './brainbreak.js?v=5de985bf';
import debate from './debate.js?v=5de985bf';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
