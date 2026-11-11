/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=ceec3b96';
import story from './story.js?v=ceec3b96';
import reading from './reading.js?v=ceec3b96';
import science from './science.js?v=ceec3b96';
import sound from './journey.js?v=ceec3b96';
import code from './code.js?v=ceec3b96';
import steps from './steps.js?v=ceec3b96';
import escape from './escape.js?v=ceec3b96';
import brainbreak from './brainbreak.js?v=ceec3b96';
import debate from './debate.js?v=ceec3b96';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
