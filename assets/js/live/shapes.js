/* The live quiz's answer marks: a shape and a colour each (circle, square, triangle, diamond, then star and hexagon),
   the same on the board and on pupils' devices, so nobody has to rely on colour alone. No imports: the pupils' page
   uses it too. */
export const SHAPES = [
  { name: 'circle', c: '#4F46E5', d: '#3730A3', svg: '<circle cx="12" cy="12" r="9" fill="#FFFFFF"/>' },
  { name: 'square', c: '#1F7A75', d: '#145753', svg: '<rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="#FFFFFF"/>' },
  { name: 'triangle', c: '#A44F0F', d: '#7A3A0B', svg: '<path d="M12 3 22 20H2z" fill="#FFFFFF"/>' },
  { name: 'diamond', c: '#7E3FAF', d: '#5E2C85', svg: '<path d="M12 2 22 12 12 22 2 12z" fill="#FFFFFF"/>' },
  { name: 'star', c: '#B42318', d: '#86190F', svg: '<path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#FFFFFF"/>' },
  { name: 'hexagon', c: '#0B7F99', d: '#075E72', svg: '<path d="M7 3.5h10l5 8.5-5 8.5H7L2 12z" fill="#FFFFFF"/>' }
];
export const shapeSVG = (i, cls) => '<svg class="' + (cls || 'jn-shape') + '" viewBox="0 0 24 24" aria-hidden="true">' + SHAPES[i % SHAPES.length].svg + '</svg>';
/* Stickers a teacher can send to one pupil: [name, colour, icon]. */
export const STICKERS = { star: ['Star thinker', '#F5A524', 'star'], effort: ['Great effort', '#E2558A', 'bolt'], kind: ['Kind helper', '#2E9E6B', 'heart'], listen: ['Super listener', '#3584D6', 'ear'], team: ['Team player', '#9A55CF', 'users'], brave: ['Brave try', '#E07B2E', 'flag'] };

/* Reactions and feelings, drawn (never emoji, which look different on every phone): the same pictures on the board
   and on pupils' devices. Reactions: [id, label, colour]; the first three are the thumbs check. */
export const REACTIONS = [['up', 'Got it', '#22995C'], ['side', 'Nearly', '#D08A0E'], ['down', 'Not yet', '#D9443F'], ['love', 'Love it', '#D9467F'], ['wow', 'Wow', '#3576C9'], ['clap', 'Clap', '#8A4BC4']];
const THUMB = '<rect x="3.6" y="10.4" width="3.6" height="9.4" rx="1.3"/><path d="M8.4 10.6 11.6 4.4a1.9 1.9 0 0 1 3.4 1.5l-1.1 4.1h4.4a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H9.6a1.2 1.2 0 0 1-1.2-1.2z"/>';
const RX_INNER = {
  up: THUMB,
  side: '<g transform="rotate(-90 12 12)">' + THUMB + '</g>',
  down: '<g transform="rotate(180 12 12)">' + THUMB + '</g>',
  love: '<path d="M12 20s-7.6-4.6-7.6-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.6 10c0 5.4-7.6 10-7.6 10z"/>',
  wow: '<circle cx="8.4" cy="9" r="1.9"/><circle cx="15.6" cy="9" r="1.9"/><ellipse cx="12" cy="16" rx="2.9" ry="3.6"/>',
  clap: '<rect x="5.6" y="8" width="5.4" height="11.6" rx="2.7" transform="rotate(-16 8.3 13.8)"/><rect x="13" y="8" width="5.4" height="11.6" rx="2.7" transform="rotate(16 15.7 13.8)"/>' +
    '<path d="M12 2.4v2.4M7.6 3.4l1.2 2M16.4 3.4l-1.2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>'
};
export function reactSVG(i, cls) {
  const r = REACTIONS[i] || REACTIONS[0];
  return '<svg class="' + (cls || 'rx-svg') + '" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.4" fill="' + r[2] + '"/>' +
    '<g fill="#fff" transform="translate(12 12) scale(.72) translate(-12 -12)">' + RX_INNER[r[0]] + '</g></svg>';
}
/* The exit ticket's faces: the same as the class feedback screen on the board (feedback.js). */
export const FACE_NAMES = ['Lost', 'Tricky', 'OK', 'Good', 'Loved it'];
export const FACE_COLOURS = ['#E5484D', '#F2804A', '#F2B84B', '#7CC24F', '#2BB673'];
const MOUTHS = ['M8 17.2c2-2.6 6-2.6 8 0', 'M8.4 16.4c2.1-1.3 5.1-1.3 7.2 0', 'M8.4 15.6h7.2', 'M8.4 14.4c2.1 1.8 5.1 1.8 7.2 0', 'M7.8 13.6c2.2 3.3 6.2 3.3 8.4 0'];
export function faceSVG(i, cls) {
  return '<svg class="' + (cls || 'face-svg') + '" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="' + FACE_COLOURS[i] + '"/><circle cx="8.9" cy="10" r="1.35" fill="#fff"/><circle cx="15.1" cy="10" r="1.35" fill="#fff"/>' +
    '<path d="' + MOUTHS[i] + '" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
}
