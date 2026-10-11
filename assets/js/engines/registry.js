/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=a3c4a34d';
import story from './story.js?v=a3c4a34d';
import reading from './reading.js?v=a3c4a34d';
import science from './science.js?v=a3c4a34d';
import sound from './journey.js?v=a3c4a34d';
import code from './code.js?v=a3c4a34d';
import steps from './steps.js?v=a3c4a34d';
import escape from './escape.js?v=a3c4a34d';
import brainbreak from './brainbreak.js?v=a3c4a34d';
import debate from './debate.js?v=a3c4a34d';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
