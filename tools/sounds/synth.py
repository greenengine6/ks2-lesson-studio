"""Offline sound design: noise, filters, modal and voice synthesis, reverb. Everything at 44.1 kHz, float, (ch, n)."""
import numpy as np
from scipy import signal
SR = 44100
rng = np.random.default_rng(7)

def T(d): return np.arange(int(d * SR)) / SR
def silence(d, ch=1): return np.zeros((ch, int(d * SR)))
def white(n): return rng.standard_normal(n)
def pink(n):
    w = rng.standard_normal(n); f = np.fft.rfftfreq(n, 1 / SR); W = np.fft.rfft(w); f[0] = f[1]
    return np.fft.irfft(W / np.sqrt(f), n) / np.sqrt(np.mean(np.fft.irfft(W / np.sqrt(f), n) ** 2) + 1e-12)
def brown(n):
    x = np.cumsum(rng.standard_normal(n)); x -= np.linspace(x[0], x[-1], n); x = signal.sosfilt(signal.butter(1, 20, 'highpass', fs=SR, output='sos'), x)
    return x / (np.std(x) + 1e-12)

def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x, axis=-1)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x, axis=-1)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x, axis=-1)

def env_adsr(n, a, d, s, r, sustain_len):
    """attack a, decay d to level s, hold for sustain_len, release r (seconds); returns n samples"""
    e = np.zeros(n); t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), e)
    m = (t >= a) & (t < a + d); e[m] = 1 - (1 - s) * (t[m] - a) / max(d, 1e-6)
    m = (t >= a + d) & (t < a + d + sustain_len); e[m] = s
    m = t >= a + d + sustain_len; e[m] = s * np.exp(-(t[m] - a - d - sustain_len) / max(r, 1e-6) * 4.6)
    return e
def env_exp(n, a, tau):
    t = np.arange(n) / SR
    return np.where(t < a, (t / max(a, 1e-6)) ** 1.5, np.exp(-(t - a) / tau))
def env_curve(n, pts):
    """piecewise-linear envelope from [(t, v), ...] in seconds"""
    t = np.arange(n) / SR; xs, ys = zip(*pts); return np.interp(t, xs, ys)

def svf(x, fc, q, mode='bp'):
    """time-varying state-variable filter; fc: array or scalar (Hz)"""
    n = len(x); fc = np.broadcast_to(np.asarray(fc, float), (n,)); q = np.broadcast_to(np.asarray(q, float), (n,))
    y = np.zeros(n); low = band = 0.0
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR); damp = 1 / q
    for i in range(n):
        high = x[i] - low - damp[i] * band
        band += f[i] * high; low += f[i] * band
        y[i] = band if mode == 'bp' else low if mode == 'lp' else high
    return y

def resonator(x, fc, bw):
    """two-pole resonator with time-varying centre (array) and bandwidth (Hz), unit gain at the peak"""
    n = len(x); fc = np.broadcast_to(np.asarray(fc, float), (n,)); bw = np.broadcast_to(np.asarray(bw, float), (n,))
    y = np.zeros(n); y1 = y2 = 0.0
    R = np.exp(-np.pi * bw / SR); th = 2 * np.pi * fc / SR
    a1 = 2 * R * np.cos(th); a2 = -R * R; g = (1 - R * R) / 2
    for i in range(n):
        v = g[i] * x[i] + a1[i] * y1 + a2[i] * y2
        y2 = y1; y1 = v; y[i] = v
    return y

def formants(src, F, B, G=None):
    """parallel formant bank: F, B: lists of arrays/scalars"""
    out = np.zeros_like(src)
    for k, (f, b) in enumerate(zip(F, B)):
        out += resonator(src, f, b) * (1 if G is None else G[k])
    return out

def glottal(f0, jitter=0.01, shimmer=0.05, tilt=1.2, sub=0.0, sub_ratio=0.5, nh=None, rough=0.0):
    """band-limited harmonic source following f0 (array, Hz). sub adds a subharmonic (period doubling) for roughness."""
    n = len(f0)
    jit = 1 + jitter * lp(rng.standard_normal(n), 30) * 3
    f = f0 * jit
    ph = 2 * np.pi * np.cumsum(f) / SR
    fmax = max(f.max(), 1)
    K = nh or int(min(80, (SR / 2.2) / fmax))
    y = np.zeros(n)
    for k in range(1, K + 1):
        amp = 1 / k ** tilt
        # fade harmonics that would alias
        alias = np.clip((SR / 2.1 - k * f) / (0.1 * SR), 0, 1)
        y += amp * alias * np.sin(k * ph + rng.uniform(0, 0.3))
    if sub > 0:
        phs = ph * sub_ratio
        for k in range(1, max(2, K // 2)):
            y += sub * (1 / k ** tilt) * np.sin(k * phs)
    sh = 1 + shimmer * lp(rng.standard_normal(n), 40) * 3
    y *= sh
    if rough > 0:  # amplitude flutter (growl)
        y *= 1 + rough * np.sin(2 * np.pi * 28 * np.arange(n) / SR + rng.uniform(0, 6)) * (0.6 + 0.4 * lp(rng.standard_normal(n), 8) * 3)
    return y / (np.max(np.abs(y)) + 1e-9)

def modal(freqs, amps, taus, dur, attack=0.001, phases=None, glide=None):
    """sum of exponentially decaying partials; glide: per-partial relative pitch change over the first second"""
    t = T(dur); y = np.zeros_like(t)
    for i, (f, a, tau) in enumerate(zip(freqs, amps, taus)):
        if f >= SR / 2.05: continue
        if glide is not None:
            g = glide[i] if hasattr(glide, '__len__') else glide
            fi = f * (1 + g * (1 - np.exp(-t / 0.6)))
            ph = 2 * np.pi * np.cumsum(fi) / SR
        else:
            ph = 2 * np.pi * f * t
        y += a * np.exp(-t / tau) * np.sin(ph + (phases[i] if phases is not None else rng.uniform(0, 2 * np.pi)))
    if attack > 0:
        n = int(attack * SR); y[:n] *= np.linspace(0, 1, n) ** 2
    return y

def make_ir(rt60=1.6, pre=0.012, bright=0.6, er=True, width=1.0, dur=None):
    """stereo reverb impulse response: band-wise exponential decay of decorrelated noise, a few early reflections"""
    dur = dur or rt60 * 1.15; n = int(dur * SR); t = np.arange(n) / SR
    ir = np.zeros((2, n))
    bands = [(20, 250, 1.15), (250, 1200, 1.0), (1200, 4000, 0.75 * (0.6 + 0.4 * bright)), (4000, 16000, 0.45 * bright + 0.12)]
    for ch in range(2):
        acc = np.zeros(n)
        for lo, hi, k in bands:
            nz = bp(rng.standard_normal(n), lo, min(hi, SR / 2.1), 2)
            acc += nz * np.exp(-6.91 * t / (rt60 * k))
        ir[ch] = acc
    if width < 1: m = ir.mean(0); ir = m + (ir - m) * width
    p = int(pre * SR); ir = np.concatenate([np.zeros((2, p)), ir], axis=1)[:, :n]
    if er:
        for d, g in [(0.007, 0.5), (0.013, 0.35), (0.021, 0.3), (0.029, 0.22), (0.041, 0.16)]:
            k = int(d * SR); ir[0, k] += g * rng.choice([-1, 1]); ir[1, int(k * 1.07)] += g * rng.choice([-1, 1])
    ir[:, :int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return ir / np.sqrt(np.sum(ir ** 2) / 2)

IR = {}
def reverb(x, kind='room', wet=0.25):
    """x mono (n,) or (ch, n) → stereo (2, n + tail) mix"""
    if kind not in IR:
        IR[kind] = {'room': lambda: make_ir(0.7, 0.006, 0.7), 'hall': lambda: make_ir(2.2, 0.018, 0.55), 'forest': lambda: make_ir(1.3, 0.01, 0.45, width=1.0),
                    'cave': lambda: make_ir(3.6, 0.03, 0.35), 'outdoor': lambda: make_ir(1.0, 0.008, 0.5), 'big': lambda: make_ir(3.0, 0.03, 0.5), 'plate': lambda: make_ir(1.6, 0.004, 0.85)}[kind]()
    ir = IR[kind]
    x = np.atleast_2d(x)
    if x.shape[0] == 1: x = np.vstack([x, x])
    n = x.shape[1] + ir.shape[1] - 1
    out = np.zeros((2, n))
    for ch in range(2):
        out[ch, :x.shape[1]] += x[ch] * (1 - wet * 0.5)
        out[ch] += wet * signal.fftconvolve(x[ch], ir[ch])[:n] * 0.5
    return out

def pan(x, p):
    """mono → stereo; p in [-1, 1] (array or scalar), equal power"""
    x = np.asarray(x); p = np.broadcast_to(np.asarray(p, float), x.shape)
    a = (p + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])

def place(dst, src, at):
    """mix src (ch, n) into dst (ch, m) at time at (s), growing dst if needed"""
    src = np.atleast_2d(src); i = int(at * SR)
    if dst.shape[0] < src.shape[0]: dst = np.vstack([dst, dst])
    if src.shape[0] < dst.shape[0]: src = np.vstack([src, src])
    if i + src.shape[1] > dst.shape[1]: dst = np.concatenate([dst, np.zeros((dst.shape[0], i + src.shape[1] - dst.shape[1]))], axis=1)
    dst[:, i:i + src.shape[1]] += src
    return dst

def trim(x, thresh_db=-60, keep=0.02):
    x = np.atleast_2d(x); a = np.abs(x).max(0); pk = a.max()
    if pk <= 0: return x
    idx = np.where(a > pk * 10 ** (thresh_db / 20))[0]
    end = min(x.shape[1], idx[-1] + int(keep * SR)) if len(idx) else x.shape[1]
    return x[:, :end]

def norm_peak(x, db=-1.0):
    pk = np.abs(x).max(); return x * (10 ** (db / 20) / pk) if pk > 0 else x

def fadeout(x, d):
    x = np.atleast_2d(x).copy(); n = min(x.shape[1], int(d * SR)); x[:, -n:] *= np.linspace(1, 0, n) ** 2; return x
def fadein(x, d):
    x = np.atleast_2d(x).copy(); n = min(x.shape[1], int(d * SR)); x[:, :n] *= np.linspace(0, 1, n) ** 1.5; return x

def bubble(f0=800, dur=0.06, rise=1.6, amp=1.0):
    """Minnaert bubble: a decaying sine whose pitch rises as it forms"""
    t = T(dur); f = f0 * (1 + (rise - 1) * t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return amp * np.sin(ph) * np.exp(-t / (dur / 3.5)) * np.minimum(1, t / 0.002)

def grains(dur, rate, f_lo, f_hi, glen=(0.004, 0.02), amp_env=None, seed=None):
    """granular noise texture: many short filtered noise grains"""
    r = np.random.default_rng(seed) if seed is not None else rng
    n = int(dur * SR); out = np.zeros(n)
    k = int(rate * dur)
    for _ in range(k):
        L = int(r.uniform(*glen) * SR); s = int(r.uniform(0, max(1, n - L)))
        g = r.standard_normal(L) * np.hanning(L) ** 2
        fc = r.uniform(f_lo, f_hi); g = bp(g, fc * 0.7, min(fc * 1.4, SR / 2.2), 2)
        a = r.uniform(0.3, 1.0) * (amp_env[s] if amp_env is not None else 1)
        out[s:s + L] += a * g
    return out
