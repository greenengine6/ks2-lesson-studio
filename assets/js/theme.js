/* Runs before the page paints, so Night mode does not flash light first. */
try { if (localStorage.getItem('ks2-engine.theme.v1') === 'night') document.documentElement.setAttribute('data-theme', 'night'); } catch (e) { /* storage blocked */ }
