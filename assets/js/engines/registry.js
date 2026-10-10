/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=cfc5dfc4';
import story from './story.js?v=cfc5dfc4';
import reading from './reading.js?v=cfc5dfc4';
import science from './science.js?v=cfc5dfc4';
import sound from './journey.js?v=cfc5dfc4';
import code from './code.js?v=cfc5dfc4';
import steps from './steps.js?v=cfc5dfc4';
import escape from './escape.js?v=cfc5dfc4';
import brainbreak from './brainbreak.js?v=cfc5dfc4';
import debate from './debate.js?v=cfc5dfc4';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
