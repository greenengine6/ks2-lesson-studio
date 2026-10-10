/* Symphony's voice glow: a sound-reactive light along the bottom edge of an element, in the spirit of
   Libraries.dev's Voice (voice-glow). That package needs React and its code is not published, so this is the same
   idea written for this site: a centred, colourful glow that rises and blooms with the voice, breathes gently when
   quiet, and while she is thinking gathers into a beam that sweeps from side to side.

   new Beam(canvas, {
     type: 'mobile' | 'pill' | 'default',   geometry preset
     level: 0..1 or () => 0..1,             what drives it (a microphone meter, or Symphony's words)
     processing: false,                     the thinking beam
     colorVariant: 'colorful' | 'mono' | 'ocean' | 'sunset' | 'forest' | 'candy' | 'ice' | 'gold', or colors: [...7]
     sensitivity, threshold, attack, release,   the input chain: gain, gate and envelope
     reach, spread, flow, bend, idle,           the shape of the reaction
     strength: 0..1, scale })
   beam.set({ ... }) changes any of these; beam.start(), beam.stop(), beam.destroy(). */

const VARIANTS = {
  colorful: ['#7C5CFF', '#3B82F6', '#22D3EE', '#2DD4BF', '#F472B6', '#FB923C', '#E879F9'],
  mono: ['#E5E7EB', '#CBD5E1', '#F8FAFC', '#E2E8F0', '#F1F5F9', '#D1D5DB', '#FFFFFF'],
  ocean: ['#0EA5E9', '#22D3EE', '#38BDF8', '#2DD4BF', '#60A5FA', '#06B6D4', '#93C5FD'],
  sunset: ['#F97316', '#FB7185', '#F59E0B', '#EC4899', '#F43F5E', '#FDBA74', '#FCA5A5'],
  forest: ['#22C55E', '#84CC16', '#10B981', '#A3E635', '#34D399', '#65A30D', '#BEF264'],
  candy: ['#F472B6', '#C084FC', '#F9A8D4', '#A78BFA', '#FB7185', '#E879F9', '#FBCFE8'],
  ice: ['#E0F2FE', '#BAE6FD', '#A5F3FC', '#DBEAFE', '#C7D2FE', '#99F6E4', '#F0F9FF'],
  gold: ['#FBBF24', '#F59E0B', '#FDE68A', '#FCD34D', '#D97706', '#FEF3C7', '#FACC15']
};
const PRESETS = {
  default: { reach: 0.75, spread: 1, height: 0.9 },
  pill: { reach: 0.6, spread: 0.8, height: 1 },
  mobile: { reach: 0.85, spread: 1.15, height: 0.62 }
};
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export class Beam {
  constructor(canvas, o) {
    this.c = canvas;
    this.x = canvas.getContext('2d');
    this.o = Object.assign({ type: 'mobile', level: 0, processing: false, colorVariant: 'colorful', colors: null, sensitivity: 1.6, threshold: 0.04, attack: 0.35, release: 0.06,
      reach: null, spread: null, flow: 1, bend: 0.25, idle: 0.14, strength: 1, scale: 1 }, o || {});
    this.env = 0; this.t = 0; this.raf = 0; this.last = 0; this.proc = 0; this.on = false;
    this.phase = Array.from({ length: 7 }, (_, i) => i * 1.7 + Math.random() * 0.6);
    this.fit = () => this.resize();
    window.addEventListener('resize', this.fit, { passive: true });
    this.resize();
  }
  set(o) { Object.assign(this.o, o || {}); }
  resize() {
    const r = this.c.getBoundingClientRect(), k = 0.5;                      // half resolution: the glow is soft anyway
    this.w = Math.max(2, Math.round(r.width * k)); this.h = Math.max(2, Math.round(r.height * k));
    this.c.width = this.w; this.c.height = this.h;
  }
  start() { if (this.on) return; this.on = true; this.last = 0; const step = (now) => { if (!this.on) return; this.frame(now); this.raf = requestAnimationFrame(step); }; this.raf = requestAnimationFrame(step); }
  stop() { this.on = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); window.removeEventListener('resize', this.fit); }
  read() {
    const L = this.o.level, v = typeof L === 'function' ? L() : L;
    return Math.max(0, Math.min(1, (Number(v) || 0) * this.o.sensitivity));
  }
  frame(now) {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now; this.t += dt;
    const o = this.o, P = PRESETS[o.type] || PRESETS.default;
    let target = this.read();
    if (target < o.threshold) target = 0;                                    // gate out room noise
    const k = target > this.env ? o.attack : o.release;
    this.env += (target - this.env) * (1 - Math.pow(1 - k, dt * 60));
    this.proc += ((o.processing ? 1 : 0) - this.proc) * (1 - Math.pow(0.9, dt * 60));
    const x = this.x, W = this.w, H = this.h, cols = (o.colors && o.colors.length ? o.colors : VARIANTS[o.colorVariant] || VARIANTS.colorful).slice(0, 7);
    const n = cols.length, reach = (o.reach == null ? P.reach : o.reach) * o.scale, spread = (o.spread == null ? P.spread : o.spread);
    const energy = Math.max(o.idle * (0.75 + 0.25 * Math.sin(this.t * 1.3)), this.env, this.proc * 0.55);
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    const sweep = W / 2 + Math.sin(this.t * 1.5) * W * 0.32;                // where the thinking beam is
    for (let i = 0; i < n; i++) {
      const ph = this.phase[i], home = (i + 0.5) / n;
      const drift = Math.sin(this.t * (0.35 + i * 0.07) * o.flow + ph) * 0.07;
      const free = W * (0.5 + (home - 0.5) * (0.62 + 0.38 * spread) + drift);
      const gathered = sweep + (home - 0.5) * W * 0.12;
      const cx = free + (gathered - free) * this.proc;
      const bloom = 0.72 + 0.28 * Math.sin(this.t * (1.9 + i * 0.31) + ph * 2);
      const centre = 1 - Math.abs(home - 0.5) * (0.9 - o.bend);             // centred: the middle lobes rise highest
      const hh = H * P.height * reach * (0.18 + 0.82 * energy) * bloom * centre * (1 + this.proc * 0.25);
      const ww = (W / n) * (1.25 + energy * 1.1) * spread * (1 - this.proc * 0.45);
      const [r, g, b] = hexRgb(cols[i]);
      x.save();
      x.translate(cx, H);
      x.scale(ww, Math.max(1, hh));
      const gr = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      const a = Math.min(1, (0.28 + 0.72 * energy) * o.strength);
      gr.addColorStop(0, `rgba(${r},${g},${b},${a})`);
      gr.addColorStop(0.45, `rgba(${r},${g},${b},${a * 0.45})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      x.fillStyle = gr;
      x.beginPath(); x.arc(0, 0, 1, Math.PI, 2 * Math.PI); x.fill();
      x.restore();
    }
    // a bright core along the very bottom, strongest where the voice is
    const core = x.createLinearGradient(0, 0, W, 0), c = this.proc > 0.5 ? sweep / W : 0.5, cw = 0.32 + energy * 0.25;
    core.addColorStop(0, 'rgba(255,255,255,0)');
    core.addColorStop(Math.max(0, c - cw), 'rgba(255,255,255,0)');
    core.addColorStop(c, `rgba(255,255,255,${(0.25 + energy * 0.6) * o.strength})`);
    core.addColorStop(Math.min(1, c + cw), 'rgba(255,255,255,0)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = core;
    x.fillRect(0, H - Math.max(2, H * (0.025 + energy * 0.03)), W, H);
  }
}
