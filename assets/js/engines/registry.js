/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=cdc164df';
import story from './story.js?v=cdc164df';
import reading from './reading.js?v=cdc164df';
import science from './science.js?v=cdc164df';
import sound from './journey.js?v=cdc164df';
import code from './code.js?v=cdc164df';
import steps from './steps.js?v=cdc164df';
import escape from './escape.js?v=cdc164df';
import brainbreak from './brainbreak.js?v=cdc164df';
import debate from './debate.js?v=cdc164df';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
