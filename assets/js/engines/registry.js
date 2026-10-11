/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=b8e2dc0e';
import story from './story.js?v=b8e2dc0e';
import reading from './reading.js?v=b8e2dc0e';
import science from './science.js?v=b8e2dc0e';
import sound from './journey.js?v=b8e2dc0e';
import code from './code.js?v=b8e2dc0e';
import steps from './steps.js?v=b8e2dc0e';
import escape from './escape.js?v=b8e2dc0e';
import brainbreak from './brainbreak.js?v=b8e2dc0e';
import debate from './debate.js?v=b8e2dc0e';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
