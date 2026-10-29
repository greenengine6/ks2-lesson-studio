/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=de4f9a51';
import story from './story.js?v=de4f9a51';
import reading from './reading.js?v=de4f9a51';
import science from './science.js?v=de4f9a51';
import sound from './journey.js?v=de4f9a51';
import code from './code.js?v=de4f9a51';
import steps from './steps.js?v=de4f9a51';
import escape from './escape.js?v=de4f9a51';
import brainbreak from './brainbreak.js?v=de4f9a51';
import debate from './debate.js?v=de4f9a51';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
