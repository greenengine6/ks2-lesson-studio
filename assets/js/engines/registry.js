/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=a277ebb7';
import story from './story.js?v=a277ebb7';
import reading from './reading.js?v=a277ebb7';
import science from './science.js?v=a277ebb7';
import sound from './journey.js?v=a277ebb7';
import code from './code.js?v=a277ebb7';
import steps from './steps.js?v=a277ebb7';
import escape from './escape.js?v=a277ebb7';
import brainbreak from './brainbreak.js?v=a277ebb7';
import debate from './debate.js?v=a277ebb7';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
