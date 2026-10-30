/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=49509700';
import story from './story.js?v=49509700';
import reading from './reading.js?v=49509700';
import science from './science.js?v=49509700';
import sound from './journey.js?v=49509700';
import code from './code.js?v=49509700';
import steps from './steps.js?v=49509700';
import escape from './escape.js?v=49509700';
import brainbreak from './brainbreak.js?v=49509700';
import debate from './debate.js?v=49509700';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
