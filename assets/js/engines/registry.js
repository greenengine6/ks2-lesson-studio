/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=a20ebde2';
import story from './story.js?v=a20ebde2';
import reading from './reading.js?v=a20ebde2';
import science from './science.js?v=a20ebde2';
import sound from './journey.js?v=a20ebde2';
import code from './code.js?v=a20ebde2';
import steps from './steps.js?v=a20ebde2';
import escape from './escape.js?v=a20ebde2';
import brainbreak from './brainbreak.js?v=a20ebde2';
import debate from './debate.js?v=a20ebde2';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
