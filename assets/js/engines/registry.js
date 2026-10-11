/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=7c13e055';
import story from './story.js?v=7c13e055';
import reading from './reading.js?v=7c13e055';
import science from './science.js?v=7c13e055';
import sound from './journey.js?v=7c13e055';
import code from './code.js?v=7c13e055';
import steps from './steps.js?v=7c13e055';
import escape from './escape.js?v=7c13e055';
import brainbreak from './brainbreak.js?v=7c13e055';
import debate from './debate.js?v=7c13e055';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
