/* All ten engines, in the order they appear in the dock and on the landing page. */
import maths from './maths.js?v=5e78cc38';
import story from './story.js?v=5e78cc38';
import reading from './reading.js?v=5e78cc38';
import science from './science.js?v=5e78cc38';
import sound from './journey.js?v=5e78cc38';
import code from './code.js?v=5e78cc38';
import steps from './steps.js?v=5e78cc38';
import escape from './escape.js?v=5e78cc38';
import brainbreak from './brainbreak.js?v=5e78cc38';
import debate from './debate.js?v=5e78cc38';

export const ENGINES = [maths, story, reading, science, sound, code, steps, escape, brainbreak, debate];
export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
