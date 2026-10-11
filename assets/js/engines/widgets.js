/* Small interactive pieces shared by several class screens. */
import { esc, icon } from '../core.js?v=7a165bee';

const KCOL = ['#6C63FF', '#E2558A', '#2C9C96', '#E07B2E', '#3584D6', '#9A55CF'];

/* Live vote counter: the teacher taps + for each hand up or chat message. */
export function mountVote(el, options, st, o) {
  o = o || {};
  if (!st.counts || st.counts.length !== options.length) st.counts = options.map(() => 0);
  const paint = () => {
    const max = Math.max(1, ...st.counts), total = st.counts.reduce((a, b) => a + b, 0);
    el.innerHTML = '<div class="vote">' + options.map((op, i) => {
      const best = st.revealed && o.best != null && o.best.includes(i), dim = st.revealed && o.best != null && !o.best.includes(i);
      return '<div class="t vrow' + (best ? ' best' : '') + (dim ? ' dim' : '') + '" style="--k:' + (op.color || KCOL[i % KCOL.length]) + '"><span class="let">' + esc(op.letter || 'ABCDEF'[i]) + '</span>' +
        '<span class="txt"><span>' + esc(op.label) + '</span><span class="vbar"><i style="width:' + Math.round((st.counts[i] / max) * 100) + '%"></i></span></span>' +
        '<span class="vcount"><button type="button" class="b-btn round" data-m="' + i + '" aria-label="One less vote for ' + esc(op.letter || 'ABCDEF'[i]) + '">' + icon('minus') + '</button>' +
        '<output aria-live="polite">' + st.counts[i] + '</output>' +
        '<button type="button" class="b-btn round go" data-p="' + i + '" aria-label="One more vote for ' + esc(op.letter || 'ABCDEF'[i]) + '">' + icon('plus') + '</button></span></div>';
    }).join('') + '</div>';
    el.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { st.counts[Number(b.dataset.p)]++; paint(); if (o.onChange) o.onChange(); }));
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.m); st.counts[i] = Math.max(0, st.counts[i] - 1); paint(); if (o.onChange) o.onChange(); }));
    if (o.total) o.total(total);
  };
  paint();
  return { paint, add(i) { if (i >= 0 && i < options.length) { st.counts[i]++; paint(); } } };
}
