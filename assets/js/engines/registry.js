/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=af1c9ebd';
import story from './story.js?v=af1c9ebd';
import reading from './reading.js?v=af1c9ebd';
import science from './science.js?v=af1c9ebd';
import sound from './journey.js?v=af1c9ebd';
import code from './code.js?v=af1c9ebd';
import steps from './steps.js?v=af1c9ebd';
import escape from './escape.js?v=af1c9ebd';
import brainbreak from './brainbreak.js?v=af1c9ebd';
import debate from './debate.js?v=af1c9ebd';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
