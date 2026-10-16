/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=f99d8766';
import story from './story.js?v=f99d8766';
import reading from './reading.js?v=f99d8766';
import science from './science.js?v=f99d8766';
import sound from './journey.js?v=f99d8766';
import code from './code.js?v=f99d8766';
import steps from './steps.js?v=f99d8766';
import escape from './escape.js?v=f99d8766';
import brainbreak from './brainbreak.js?v=f99d8766';
import debate from './debate.js?v=f99d8766';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
