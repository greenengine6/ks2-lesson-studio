/* MagnificationDock: macOS-style launcher with spring physics (vanilla port of the framer-motion component).
   Same maths: size = interpolate(mouse distance, [-distance, 0, distance] -> [base, magnification, base]),
   then a spring { mass 0.1, stiffness 150, damping 12 } drives each item. */

export class Dock {
  constructor(root, items, opts) {
    this.o = Object.assign({ distance: 200, base: 50, magnification: 78, spring: { mass: 0.1, stiffness: 150, damping: 12 } }, opts || {});
    this.root = root;
    this.items = [];
    this.mouseX = Infinity;
    this.raf = 0;
    const panel = document.createElement('div');
    panel.className = 'dock-panel';
    panel.setAttribute('role', 'toolbar');
    panel.setAttribute('aria-label', 'Tools');
    items.forEach((it) => {
      if (it.sep) { const s = document.createElement('span'); s.className = 'dock-sep'; s.setAttribute('aria-hidden', 'true'); panel.appendChild(s); return; }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dock-item';
      b.dataset.id = it.id;
      if (it.color) b.style.setProperty('--c', 'var(--' + it.color + ')');
      b.setAttribute('aria-label', it.label);
      b.innerHTML = '<span class="dock-ico">' + it.icon + '</span><span class="dock-tip" role="tooltip">' + it.label + '</span><i class="dock-dot" aria-hidden="true"></i>';
      b.addEventListener('click', () => it.onClick && it.onClick());
      panel.appendChild(b);
      this.items.push({ el: b, id: it.id, size: this.o.base, v: 0, target: this.o.base });
    });
    root.appendChild(panel);
    this.panel = panel;
    this.enabled = false;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const decide = () => {
      this.enabled = mq.matches && !rm.matches && window.innerWidth > 900;
      if (!this.enabled) this.items.forEach((it) => { it.el.style.width = ''; it.el.style.height = ''; it.el.style.removeProperty('--s'); });
      else this.items.forEach((it) => this.paint(it));
    };
    decide();
    (mq.addEventListener ? mq.addEventListener('change', decide) : mq.addListener(decide));
    window.addEventListener('resize', decide);
    panel.addEventListener('mousemove', (e) => { if (!this.enabled) return; this.mouseX = e.clientX; this.kick(); });
    panel.addEventListener('mouseleave', () => { this.mouseX = Infinity; this.kick(); });
  }
  paint(it) {
    const s = it.size;
    it.el.style.width = s.toFixed(2) + 'px';
    it.el.style.height = s.toFixed(2) + 'px';
    it.el.style.setProperty('--s', (s / this.o.base).toFixed(4));
  }
  kick() { if (!this.raf && this.enabled) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.tick(t)); } }
  tick(now) {
    this.raf = 0;
    if (!this.enabled) return;
    const { base, magnification, distance, spring } = this.o;
    let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    // targets from the current layout, as the original reads each item's rect every frame
    this.items.forEach((it) => {
      if (!Number.isFinite(this.mouseX)) { it.target = base; return; }
      const r = it.el.getBoundingClientRect();
      const d = this.mouseX - r.left - base / 2;
      const a = Math.min(1, Math.abs(d) / distance);
      it.target = base + (magnification - base) * (1 - a);
    });
    let moving = false;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    this.items.forEach((it) => {
      for (let k = 0; k < steps; k++) {
        const acc = (-spring.stiffness * (it.size - it.target) - spring.damping * it.v) / spring.mass;
        it.v += acc * h;
        it.size += it.v * h;
      }
      if (Math.abs(it.size - it.target) > 0.05 || Math.abs(it.v) > 0.05) moving = true; else { it.size = it.target; it.v = 0; }
      this.paint(it);
    });
    if (moving) this.raf = requestAnimationFrame((t) => this.tick(t));
  }
  setActive(id) {
    this.items.forEach((it) => {
      const on = it.id === id;
      it.el.classList.toggle('on', on);
      if (on) it.el.setAttribute('aria-current', 'page'); else it.el.removeAttribute('aria-current');
    });
  }
  setBadge(id, on) { const it = this.items.find((x) => x.id === id); if (it) it.el.classList.toggle('warn', !!on); }
}
