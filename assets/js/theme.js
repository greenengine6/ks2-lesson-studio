/* Runs before the page paints, so Night mode does not flash light first. */
try { if (localStorage.getItem('ks2-engine.theme.v1') === 'night') document.documentElement.setAttribute('data-theme', 'night'); } catch (e) { /* storage blocked */ }
/* Reading support (reading.js): the background, spacing and text size this device used last, before the page paints. */
try {
  const r = JSON.parse(localStorage.getItem('ks2-engine.reading.last.v1') || 'null'), d = document.documentElement;
  if (r && typeof r === 'object') {
    if (/^(grey|cream|blue|yellow)$/.test(r.bg)) d.setAttribute('data-rbg', r.bg);
    if (r.spacing === 'wide') d.setAttribute('data-rspace', 'wide');
    if ([1, 1.12, 1.25].indexOf(Number(r.size)) >= 0) d.style.setProperty('--t', String(Number(r.size)));
  }
} catch (e) { /* storage blocked */ }
