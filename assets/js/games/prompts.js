/* What the Game maker asks the engine. One schema per template, each with a good example; strict JSON back, which
   model.js checks again. Custom games come back as one HTML document after a TITLE line. */
import { HOUSE_WORDS, ages } from '../core.js?v=af1c9ebd';
import { TEMPLATE_BY_ID } from './model.js?v=af1c9ebd';

const WHO = 'a KS2 class (Years 3 to 6, ages 7 to 11) at an international school in Ipoh, Malaysia, which follows the English National Curriculum';
const SAFE = 'Everything must be child-safe, kind and accurate: no violence, nothing scary or unkind, no brand names, and no real people’s names except well-known historical figures in a history topic. Malaysian contexts are welcome (ringgit, local places, foods and festivals). Never use the names of real pupils.';

export const SYSTEM = 'You make classroom games for ' + WHO + '. Write in British English, with short, simple words the children can read. ' + HOUSE_WORDS + ' ' + SAFE +
  ' Every answer must be correct: check each one twice before you write it. Reply with one JSON object only, with no other words and no code fences.';

const SCHEMA = {
  pop: 'pop (Balloon pop): balloons float up, each carrying a short item; pupils pop only the items that fit the rule.\n' +
    '{"template":"pop","title":"Fraction balloon pop","settings":{"seconds":60,"lives":3,"speed":3},"content":{"rule":"Pop the balloons equal to 1/2","items":[{"text":"2/4","ok":true},{"text":"5/10","ok":true},{"text":"1/3","ok":false},{"text":"3/5","ok":false}]}}\n' +
    'Rules: 14 to 24 items; at least 6 that fit the rule and at least 6 that do not; each item at most 16 characters (it has to fit on a balloon); the wrong ones are near misses that catch common mistakes; the rule is one short sentence starting "Pop". Speed 2 for Year 3, 3 for Years 4 and 5, 4 for Year 6. Seconds 45 to 90. Lives 3.',
  pairs: 'pairs (Match pairs): two columns of cards; pupils tap a card and its partner.\n' +
    '{"template":"pairs","title":"Science words","settings":{"seconds":0},"content":{"prompt":"Match each word to its meaning","pairs":[["evaporate","turn from a liquid into a gas"],["condense","turn from a gas into a liquid"],["melt","turn from a solid into a liquid"]]}}\n' +
    'Rules: 5 to 8 pairs; the first card at most 30 characters, the second at most 60; each first card matches exactly one second card; no second card could also fit another first card. Seconds 0 means no time limit.',
  sort: 'sort (Sort it): pupils put every item into the right group, then check.\n' +
    '{"template":"sort","title":"Solid, liquid or gas?","settings":{"seconds":0},"content":{"prompt":"Sort these into the right group","groups":["Solid","Liquid","Gas"],"items":[{"text":"ice","group":0},{"text":"orange juice","group":1},{"text":"steam","group":2},{"text":"a wooden spoon","group":0}]}}\n' +
    'Rules: 2 to 4 groups with short names; 8 to 16 items, each at most 30 characters; "group" is the number of the item’s group, counting from 0; every item belongs to exactly one group; each group has at least 2 items.',
  race: 'race (Quiz race): questions with options; teams race rockets to the finish, one step for each right answer.\n' +
    '{"template":"race","title":"Times tables race","settings":{"seconds":90},"content":{"questions":[{"q":"What is 7 × 8?","opts":["54","56","63","64"],"a":1},{"q":"What is 6 × 9?","opts":["54","56","45","63"],"a":0}],"teams":["Tigers","Eagles","Dolphins","Owls"]}}\n' +
    'Rules: 8 to 12 questions, each at most 120 characters; 3 or 4 options each, at most 40 characters; "a" is the number of the one right option, counting from 0; the wrong options come from real mistakes pupils make; vary which position is right. Seconds 60 to 150 (how long one player has to beat the clock on a device).',
  memory: 'memory (Memory): cards lie face down; pupils turn two at a time to find the pairs.\n' +
    '{"template":"memory","title":"Times tables memory","settings":{"seconds":0},"content":{"prompt":"Find the pairs","pairs":[["3 × 4","12"],["5 × 6","30"],["7 × 3","21"]]}}\n' +
    'Rules: 6 to 8 pairs; each card at most 22 characters; the two cards of a pair clearly belong together and no card could pair with two others.'
};
const CHOOSE = 'Choose the kind of game that suits the teacher’s idea best: pop, pairs, sort, race or memory. Use the matching shape below exactly.';

function about(o) {
  const year = o.year || 'Year 4';
  return 'The teacher describes the game she wants: “' + (o.desc || 'a game about ' + (o.topic || 'this topic')) + '”\n' +
    'Topic: ' + (o.topic || 'take it from the description') + '. Year group: ' + year + ' (ages ' + ages(year) + '). Subject: ' + (o.subjectName || 'take it from the description') + '.';
}
/* A new template game. o: { desc, topic, year, subjectName, template ('' = let the engine choose) } */
export function makeRequest(o) {
  const t = o.template && SCHEMA[o.template] ? o.template : '';
  return about(o) + '\n\n' + (t ? 'Make a ' + TEMPLATE_BY_ID[t].name + ' game. Use this shape exactly:\n' + SCHEMA[t] : CHOOSE + '\n\n' + Object.values(SCHEMA).join('\n\n')) +
    '\n\nFractions are digits with a slash, like 3/4. Fit the content to the year group: what they learn in that year, in words they can read. Give the game a short, fun title (at most 40 characters). Return only the JSON.';
}
/* A change to a template game. */
export function editRequest(game, ask) {
  const keep = { template: game.template, title: game.title, settings: game.settings, content: game.content };
  return 'Here is a classroom game as JSON:\n' + JSON.stringify(keep) + '\n\nThe teacher asks: “' + ask + '”\n\n' +
    'Change the game to do what she asks. You may change the content, the settings or the title. Keep the same kind of game unless she asks for a different kind; it must still be one of these shapes:\n\n' +
    Object.values(SCHEMA).join('\n\n') + '\n\nKeep every answer correct and every rule above. Return the whole updated game as one JSON object, with one more field, "note": one short sentence for the teacher saying what you changed.';
}

/* ---------------- custom games ("Something new") ---------------- */
export const CUSTOM_SYSTEM = 'You write one complete classroom game as a single HTML document for ' + WHO + '. Write in British English, with short, simple words the children can read. ' + HOUSE_WORDS + ' ' + SAFE + '\n\n' +
  'Hard rules for the document:\n' +
  '- One file: <!doctype html> with inline <style> and inline <script> only. No external files, links, fonts, images or libraries of any kind: draw everything with CSS, inline SVG or a canvas.\n' +
  '- No network at all (no fetch, XMLHttpRequest, WebSocket, EventSource, forms), no storage (no localStorage, sessionStorage, IndexedDB, cookies), no alert, confirm or prompt, no new windows, no links that leave the page, no iframes.\n' +
  '- Under 45,000 characters in total.\n' +
  '- It fills the window and resizes; it reads well from the back of a classroom at 1024 by 768 and on a phone; big targets (at least 48 pixels); it works with a mouse, a finger and the keyboard.\n' +
  '- Bright, friendly colours; a start screen that says how to play with a big Start button; a clear end screen with the score and a Play again button.\n' +
  '- Sound is optional: only with the Web Audio API, only after a tap, and gentle.\n' +
  '- Fractions are digits with a slash, like 3/4. Every answer in the game must be correct.\n' +
  '- Report the score: call parent.postMessage({ type: \'score\', score: SCORE, done: false }, \'*\') whenever the score changes, and parent.postMessage({ type: \'score\', score: SCORE, done: true }, \'*\') once when the game ends (SCORE is a whole number).\n\n' +
  'Reply with the title on the first line, written as TITLE: and the title (at most 40 characters), then the complete HTML document, and nothing else.';
export function customRequest(o) {
  return about(o) + '\n\nWrite the game now, following every rule.';
}
export function customEditRequest(html, ask) {
  return 'Here is the game’s HTML document:\n<document>\n' + html + '\n</document>\n\nThe teacher asks: “' + ask + '”\n\n' +
    'Rewrite the complete HTML document with that change, keeping every rule. Reply with the TITLE: line, then the whole document.';
}
/* The engine's reply to a custom request: { title, html } (html is checked again by model.js). */
export function parseCustom(text) {
  const t = String(text || '');
  const m = /TITLE:\s*([^\n<]{1,120})/i.exec(t);
  let html = t;
  const fence = /```(?:html)?\s*([\s\S]*?)```/i.exec(t);
  if (fence && /<html|<!doctype/i.test(fence[1])) html = fence[1];
  return { title: m ? m[1].trim() : '', html };
}
