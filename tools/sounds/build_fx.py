"""One-shot sound effects for the Wonder Window (music.js Fx) — designed offline, or cut from licensed recordings,
or played on recorded instruments (FluidR3 GM, CC BY 3.0). Writes work/fx/<name>.wav (stereo) and a contact sheet."""
import os, sys, json, numpy as np
from synth import *
import sndkit
os.makedirs('work/fx', exist_ok=True)
R = np.random.default_rng(23)
B = 'blanket/data/resources/sounds/'
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
def note_name(m): return NAMES[m % 12] + str(m // 12 - 1)
_cache = {}
def inst(name, midi, dur=None):
    """a recorded note (mono) from the FluidR3 soundfont; nearest sample then resampled to the exact pitch"""
    have = [m for m in range(21, 109) if os.path.exists('fluid/%s-mp3/%s.mp3' % (name, note_name(m)))]
    m0 = min(have, key=lambda m: abs(m - midi))
    key = (name, m0)
    if key not in _cache: _cache[key] = sndkit.load('fluid/%s-mp3/%s.mp3' % (name, note_name(m0)), ch=1)[0]
    x = _cache[key]
    if m0 != midi:
        r = 2 ** ((midi - m0) / 12); n = int(len(x) / r)
        x = np.interp(np.arange(n) * r, np.arange(len(x)), x)
    if dur:
        x = x[:int(dur * SR)].copy(); k = int(len(x) * 0.3); x[-k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    return x
def rec(src, a, b):
    x = sndkit.load(B + src, ch=2); return x[:, int(a * SR):int(b * SR)]
def out(name, x, lufs=-20.0, peak=-2.0):
    x = np.atleast_2d(x)
    if x.shape[0] == 1: x = np.vstack([x, x])
    x = trim(x, -62, 0.03)
    x = fadeout(x, min(0.08, x.shape[1] / SR * 0.3))
    I, _ = sndkit.lufs_arr(x) if x.shape[1] > 0.5 * SR else (None, None)
    if I is not None and I > -70: x = x * 10 ** ((lufs - I) / 20)
    else: x = x * 10 ** ((lufs + 12) / 20) / (np.abs(x).max() + 1e-9)   # too short to measure: by peak
    pk = np.abs(x).max()
    if pk > 10 ** (peak / 20): x = x * 10 ** (peak / 20) / pk
    sndkit.save('work/fx/%s.wav' % name, x)
    I2, P2 = sndkit.lufs('work/fx/%s.wav' % name)
    print('%-10s %5.2fs  I=%s  peak=%s' % (name, x.shape[1] / SR, I2, P2))
    return x
def mono(x): return np.atleast_2d(x).mean(0)

# ---------------- water ----------------
def splash():
    d = 1.4; n = int(d * SR); y = np.zeros(n)
    hit = white(int(0.09 * SR)) * env_exp(int(0.09 * SR), 0.002, 0.025); hit = bp(hit, 500, 6000)
    y[:len(hit)] += 0.9 * hit
    body = white(int(0.6 * SR)) * env_exp(int(0.6 * SR), 0.01, 0.16); body = bp(body, 300, 2500) * 0.5
    y[:len(body)] += body
    for k in range(70):                                         # the bubbles and the drops falling back
        at = abs(R.normal(0.18, 0.22)); f0 = R.uniform(500, 2600); b = bubble(f0, R.uniform(0.02, 0.07), R.uniform(1.3, 2.2), R.uniform(0.15, 0.6) * np.exp(-at * 1.6))
        i = int(at * SR); m = min(len(b), n - i)
        if m > 0: y[i:i + m] += b[:m]
    st = np.zeros((2, n))
    for k in range(2): st[k] = y * 0.6 + 0.4 * np.roll(y, int(R.uniform(50, 400)))
    slap = rec('boat.ogg', 18.45, 19.6)
    st[:, :slap.shape[1]] += 0.6 * slap / (np.abs(slap).max() + 1e-9) * np.abs(y).max()
    return reverb(st, 'outdoor', 0.22)
def pop():
    b = bubble(520, 0.05, 2.1, 1.0); c = np.zeros(int(0.003 * SR)); c[0] = 0.3
    y = np.concatenate([c, b, np.zeros(int(0.05 * SR))])
    return reverb(y, 'room', 0.12)
def wave():
    x = rec('waves.ogg', 84.0, 90.5)
    x = fadein(x, 0.4); x = fadeout(x, 1.6)
    return x
def gust():
    x = rec('wind.ogg', 2.0, 8.6)
    e = env_curve(x.shape[1], [(0, 0), (1.2, 0.8), (2.6, 1.0), (4.6, 0.7), (6.6, 0)])
    x = x * e
    p = np.linspace(-0.5, 0.5, x.shape[1])                       # it moves across
    m = x.mean(0); return pan(m, p) * 1.2 + 0.25 * x
def rain_hit():
    return rec('storm.ogg', 4.0, 6.0)

# ---------------- weather ----------------
def thunder(seed=0, dist=0.0):
    r = np.random.default_rng(100 + seed)
    d = 5.5; n = int(d * SR); t = np.arange(n) / SR
    crack = white(int(0.35 * SR)) * env_exp(int(0.35 * SR), 0.003, 0.05 + dist * 0.1)
    crack = hp(crack, 900 - dist * 600) * (1 - 0.7 * dist)
    rumble = brown(n)
    am = np.ones(n)
    for k in range(9):                                            # the rolling of thunder: several overlapping booms
        c = r.uniform(0.05, 3.4); w = r.uniform(0.25, 0.9); a = r.uniform(0.4, 1.0)
        am += a * np.exp(-((t - c) / w) ** 2)
    rumble = lp(rumble, 260 - dist * 100, 3) * am * np.exp(-t / 2.4)
    y = rumble * 0.9
    y[:len(crack)] += crack * 0.8
    y = fadeout(y * np.minimum(1, t / 0.004), 1.6)[0]
    real = fadeout(mono(rec('storm.ogg', 0.8, 0.8 + d))[:n], 1.6)[0]
    real = lp(real, 400, 3)
    y[:len(real)] += 0.5 * real / (np.abs(real).max() + 1e-9) * np.abs(y).max()
    return reverb(y, 'big', 0.35)

# ---------------- fire ----------------
def crackle_fire(d=1.6):
    x = mono(rec('fireplace.ogg', 5.6, 5.6 + d)); x = x / (np.abs(x).max() + 1e-9)
    return x
def flare():
    d = 1.8; n = int(d * SR); t = np.arange(n) / SR
    whoomph = lp(brown(n), 700, 2) * env_curve(n, [(0, 0), (0.12, 1), (0.6, 0.55), (1.8, 0)])
    roar = bp(white(n), 250, 2500) * env_curve(n, [(0, 0), (0.2, 0.5), (0.9, 0.3), (1.8, 0)]) * 0.5
    y = whoomph + roar
    f = crackle_fire(1.8)[:n]; y[:len(f)] += 0.8 * f * np.abs(y).max()
    return reverb(pan(y, 0), 'outdoor', 0.2)
def candle():
    d = 0.5; n = int(d * SR)
    flick = bp(white(n), 400, 3000) * env_exp(n, 0.01, 0.07) * 0.6
    f = crackle_fire(0.6) * 0.25
    y = np.zeros(int(1.6 * SR)); y[:n] += flick; f = f[:len(y)]; y[:len(f)] += f * np.abs(flick).max()
    b = inst('celesta', 88, 1.5) * 0.35 * np.abs(flick).max() / 0.2
    y[int(0.06 * SR):int(0.06 * SR) + len(b)] += b[:len(y) - int(0.06 * SR)]
    return reverb(y, 'room', 0.25)

# ---------------- fireworks ----------------
def bang(big=1.0):
    d = 2.6; n = int(d * SR); t = np.arange(n) / SR
    tr = white(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR / 0.006)
    boom = lp(brown(n), 180, 2) * np.exp(-t / (0.5 + 0.3 * big)) * np.minimum(1, t / 0.005)
    sub = np.sin(2 * np.pi * (48 + 20 * np.exp(-t / 0.1)) * t) * np.exp(-t / 0.35) * 0.8
    y = boom * 0.8 + sub * big; y[:len(tr)] += tr * 0.9
    return fadeout(y, 0.9)[0]
def sparkles(n_=60, d=1.6, start=0.15):
    n = int((d + 0.4) * SR); st = np.zeros((2, n))
    for k in range(n_):
        at = start + R.uniform(0, d) ** 1.2; L = int(R.uniform(0.002, 0.008) * SR)
        g = hp(white(L) * np.hanning(L), R.uniform(2500, 6000)) * R.uniform(0.2, 1.0) * np.exp(-(at - start) * 0.8)
        st = place(st, pan(g, R.uniform(-0.9, 0.9)), at)
    return st
def firework(big=False):
    d = 0.75; n = int(d * SR); t = np.arange(n) / SR
    whistle = svf(white(n), 900 * (3.6 ** (t / d)), 9) * env_curve(n, [(0, 0), (0.1, 0.5), (0.7, 1), (0.75, 0)]) * 0.5
    y = np.zeros((2, int(4.2 * SR)))
    y = place(y, pan(whistle, np.linspace(-0.3, 0.1, n)), 0)
    y = place(y, pan(bang(1.3 if big else 1.0), 0.05), d)
    y = place(y, sparkles(70, 1.4, 0.0) * 0.6, d + 0.25)
    return reverb(y, 'big', 0.3)
def burst():
    y = np.zeros((2, int(3.2 * SR)))
    y = place(y, pan(bang(1.0), R.uniform(-0.3, 0.3)), 0.0)
    y = place(y, sparkles(55, 1.2, 0.0) * 0.6, 0.2)
    return reverb(y, 'big', 0.3)
def crackle():
    d = 1.4; y = np.zeros((2, int((d + 0.5) * SR))); at = 0.0
    while at < d:                                                     # firecrackers: a string of sharp pops
        L = int(R.uniform(0.003, 0.009) * SR); g = white(L) * np.exp(-np.arange(L) / SR / 0.0018)
        g = hp(g, 700) + lp(white(L) * np.exp(-np.arange(L) / SR / 0.004), 400) * 0.6
        y = place(y, pan(g * R.uniform(0.4, 1.0), R.uniform(-0.6, 0.6)), at)
        at += R.exponential(0.045) + 0.012
    return reverb(y, 'outdoor', 0.35)

# ---------------- bells, shimmer ----------------
def arp(inst_, notes, step, vol=1.0, dur=2.4, wet=0.35, kind='hall', pans=None):
    y = np.zeros((2, int((dur + step * len(notes)) * SR)))
    for i, m in enumerate(notes):
        x = inst(inst_, m, dur) * vol * (0.9 ** i)
        y = place(y, pan(x, pans[i] if pans else (i - len(notes) / 2) * 0.15), i * step)
    return reverb(y, kind, wet)
def sparkle(): return arp('celesta', [96, 100, 103, 108], 0.055, 1.0, 1.6, 0.4)
def chime(): return arp('celesta', [79, 84, 88, 91], 0.09, 1.0, 2.2, 0.35)
def land(): return arp('glockenspiel', [79, 86, 91], 0.12, 1.0, 2.2, 0.3)
def glow():
    y = np.zeros((2, int(3.4 * SR))); notes = [84, 86, 88, 91, 93, 96, 98, 100, 103]
    for k in range(13):
        at = R.uniform(0, 1.6) ** 1.1; m = int(R.choice(notes)); x = inst('celesta', m, 1.8) * R.uniform(0.3, 0.8)
        y = place(y, pan(x, R.uniform(-0.8, 0.8)), at)
    padn = int(3.0 * SR); t = np.arange(padn) / SR
    pad = sum(np.sin(2 * np.pi * f * t + R.uniform(0, 6)) for f in [523.25, 659.25, 783.99, 1046.5]) * np.sin(np.pi * t / 3.0) ** 2 * 0.05
    y = place(y, pan(pad, 0), 0)
    return reverb(y, 'hall', 0.5)
def petals():
    d = 1.2; n = int(d * SR)
    air = hp(pink(n), 4500, 2) * env_curve(n, [(0, 0), (0.35, 1), (1.2, 0)]) * 0.25
    y = pan(air, np.linspace(-0.4, 0.4, n))
    y = place(y, arp('celesta', [84, 91], 0.14, 0.7, 1.8, 0.0), 0.1)
    return reverb(y, 'hall', 0.3)
def lantern():
    d = 1.5; n = int(d * SR); t = np.arange(n) / SR
    whoosh = svf(white(n), 400 * (3.2 ** (t / d)), 1.2) * env_curve(n, [(0, 0), (0.6, 1), (1.5, 0)]) * 0.5
    y = pan(whoosh, 0)
    y = place(y, arp('celesta', [84, 88], 0.2, 0.7, 2.0, 0.0), 0.3)
    return reverb(y, 'hall', 0.35)
def bellnote(): return arp('tubular_bells', [84], 0.0, 1.0, 3.0, 0.3, pans=[0])
def gong():
    f = 72.0; ratios = [1.0, 1.52, 2.03, 2.31, 2.73, 3.11, 3.58, 4.02, 4.61, 5.23, 5.94, 6.71, 7.42]
    amps = [1.0, 0.7, 0.55, 0.62, 0.4, 0.45, 0.3, 0.28, 0.22, 0.16, 0.12, 0.09, 0.07]
    taus = [3.2, 2.6, 2.2, 2.0, 1.7, 1.5, 1.2, 1.0, 0.9, 0.7, 0.6, 0.5, 0.4]
    y = modal([f * r for r in ratios], amps, taus, 6.0, 0.006, glide=[-0.015 * (1 + i * 0.1) for i in range(len(ratios))])
    # the shimmer that blooms after the strike
    t = T(6.0); shim = bp(white(len(t)), 1500, 5000) * np.exp(-t / 1.2) * (1 - np.exp(-t / 0.25)) * 0.05
    mallet = lp(white(int(0.05 * SR)), 300) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.012) * 0.8
    y = y + shim; y[:len(mallet)] += mallet
    return reverb(fadeout(y, 2.2)[0], 'hall', 0.3)
def drum():
    y = np.zeros((2, int(5.0 * SR)))
    for k, (m, a) in enumerate([(45, 1.0), (45, 0.85), (43, 1.1)]):
        y = place(y, pan(inst('taiko_drum', m, 1.4) * a, 0), k * 0.3)
    y = place(y, gong() * 0.5, 1.0)
    return reverb(y, 'big', 0.25)
def tick(): return pan(inst('woodblock', 84, 0.25), 0)

# ---------------- people, animals, machines ----------------
def cheer():
    ap = inst('applause', 60) * 1.0
    ap = np.concatenate([ap, inst('applause', 62)[int(0.4 * SR):]])
    d = 2.6; n = int(d * SR); voices = np.zeros(n)
    for v in range(18):                                                  # "hooray!" from a crowd of children
        at = R.uniform(0.0, 0.7); L = R.uniform(0.6, 1.3); m = int(L * SR); t = np.arange(m) / SR
        f0 = R.uniform(240, 380) * (1 + 0.25 * np.sin(np.pi * t / L))
        src = glottal(f0, 0.02, 0.08, 1.1)
        F1 = np.interp(t, [0, L * 0.3, L], [700, 850, 600]); F2 = np.interp(t, [0, L * 0.3, L], [1200, 1400, 1700])
        vo = formants(src, [F1, F2, 2900], [110, 140, 220], [1, 0.6, 0.25]) * np.sin(np.pi * t / L) ** 0.8 * R.uniform(0.4, 1.0)
        i = int(at * SR); k = min(m, n - i); voices[i:i + k] += vo[:k]
    y = np.zeros((2, max(len(ap), n)))
    y = place(y, np.vstack([ap, np.roll(ap, 900)]) * 0.9, 0)
    y = place(y, pan(voices / (np.abs(voices).max() + 1e-9) * 0.35, 0), 0.05)
    y = fadeout(y[:, :int(3.2 * SR)], 1.2)
    return reverb(y, 'outdoor', 0.2)
def hooves(n_=8):
    y = np.zeros((2, int((n_ * 0.24 + 0.6) * SR)))
    for k in range(n_):
        for j, (dt, a) in enumerate([(0, 1.0), (0.06, 0.7), (0.13, 0.85)]):   # a gallop: da-da-dum
            L = int(0.05 * SR); c = white(L) * np.exp(-np.arange(L) / SR / 0.006)
            c = resonator(c, R.uniform(420, 620), 160) * 3 + lp(c, 220) * 0.8
            y = place(y, pan(c * a * R.uniform(0.8, 1.1), -0.6 + 1.2 * k / max(1, n_ - 1)), k * 0.24 + dt)
    return reverb(y, 'outdoor', 0.2)
def plane(d=2.8):
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    dop = 1 + 0.12 * np.tanh((0.5 - u) * 4)                                # higher coming, lower going
    roar = svf(pink(n), 380 * dop * (1 + 0.6 * np.sin(np.pi * u)), 0.8, 'bp')
    whine = sum(np.sin(2 * np.pi * np.cumsum(f * dop) / SR) / (k + 1) for k, f in enumerate([640, 1290, 2010])) * 0.08
    rumble = lp(brown(n), 120) * 0.6
    e = np.sin(np.pi * u) ** 1.6
    y = (roar * 0.8 + whine + rumble) * e
    return reverb(pan(y, np.linspace(-0.85, 0.85, n)), 'outdoor', 0.25)
def swell():
    d = 3.0; n = int(d * SR); t = np.arange(n) / SR
    air = svf(pink(n), 200 * (10 ** (t / d)), 0.9) * env_curve(n, [(0, 0), (2.2, 1), (3.0, 0)]) * 0.6
    sub = np.sin(2 * np.pi * np.cumsum(55 * (1 + 0.5 * t / d)) / SR) * env_curve(n, [(0, 0), (1.4, 0.7), (2.7, 0.3), (3.0, 0)])
    pad = sum(np.sin(2 * np.pi * f * t + R.uniform(0, 6)) for f in [220, 277.2, 329.6, 440]) * env_curve(n, [(0, 0), (2.0, 0.08), (3.0, 0)])
    y = air + sub * 0.7 + pad
    st = np.vstack([y, 0.7 * y + 0.3 * np.roll(y, 1200)])
    return reverb(st, 'hall', 0.35)
def poof():
    d = 0.9; n = int(d * SR); t = np.arange(n) / SR
    y = svf(white(n), 1400 * np.exp(-t / 0.25) + 220, 0.7, 'lp') * env_exp(n, 0.012, 0.18)
    return reverb(pan(y, 0), 'outdoor', 0.25)
def rattle():
    d = 1.1; n = int(d * SR); t = np.arange(n) / SR; y = np.zeros(n); k = 0.0
    while k < 0.9:                                                         # a rattle: dozens of tiny clicks a second
        L = int(0.006 * SR); c = bp(white(L), 3000, 7000) * np.hanning(L); i = int(k * SR); y[i:i + L] += c * R.uniform(0.6, 1)
        k += 1 / R.uniform(42, 50)
    y *= env_curve(n, [(0, 0), (0.08, 1), (0.85, 0.8), (0.95, 0)])
    thump = inst('taiko_drum', 40, 1.0) * 0.8
    out_ = np.zeros(int(2.2 * SR)); out_[:n] += y; out_[int(0.95 * SR):int(0.95 * SR) + len(thump)] += thump[:len(out_) - int(0.95 * SR)]
    return reverb(out_, 'outdoor', 0.2)

def voice(f0, F, B, G=None, jitter=0.012, shimmer=0.06, tilt=1.1, sub=0.0, rough=0.0, breath=0.12, env=None):
    src = glottal(f0, jitter, shimmer, tilt, sub, 0.5, rough=rough)
    v = formants(src, F, B, G)
    nz = formants(bp(white(len(f0)), 200, 8000), F, B, G)
    y = v / (np.abs(v).max() + 1e-9) + breath * nz / (np.abs(nz).max() + 1e-9)
    if env is not None: y *= env
    return y
def roar():
    d = 2.3; n = int(d * SR); t = np.arange(n) / SR
    f0 = np.interp(t, [0, 0.35, 0.9, 1.6, 2.3], [120, 210, 190, 150, 95])
    F1 = np.interp(t, [0, 0.4, 1.5, 2.3], [380, 640, 560, 420]); F2 = np.interp(t, [0, 0.4, 1.5, 2.3], [900, 1150, 1000, 800])
    e = env_curve(n, [(0, 0), (0.2, 0.7), (0.45, 1.0), (1.3, 0.85), (2.0, 0.3), (2.3, 0)])
    y = voice(f0, [F1, F2, 2300, 3300], [160, 220, 320, 420], [1, 0.7, 0.35, 0.15], 0.035, 0.12, 1.0, 0.55, 0.35, 0.35, e)
    chest = lp(brown(n), 140) * e * 0.5
    return reverb(pan(y + chest, 0), 'forest', 0.25)
def trumpet():
    d = 1.7; n = int(d * SR); t = np.arange(n) / SR
    f0 = np.interp(t, [0, 0.15, 0.6, 1.3, 1.7], [380, 620, 700, 640, 520]) * (1 + 0.025 * np.sin(2 * np.pi * 6.2 * t))
    e = env_curve(n, [(0, 0), (0.08, 0.8), (0.3, 1.0), (1.3, 0.9), (1.7, 0)])
    y = voice(f0, [900, 1800, 2800, 3700], [180, 260, 360, 480], [1, 0.9, 0.6, 0.35], 0.02, 0.08, 0.7, 0.15, 0.1, 0.3, e)
    breath = bp(white(int(0.12 * SR)), 300, 2000) * np.hanning(int(0.12 * SR)) * 0.5
    y[:len(breath)] += breath
    return reverb(pan(y, 0.1), 'outdoor', 0.25)
def honk(f0a, f0b, d, F, B, G, rough=0.15):
    n = int(d * SR); t = np.arange(n) / SR
    f0 = np.interp(t, [0, d * 0.3, d], [f0a, f0a * 1.04, f0b])
    e = env_curve(n, [(0, 0), (0.025, 1), (d * 0.7, 0.8), (d, 0)])
    return voice(f0, F, B, G, 0.02, 0.08, 0.9, 0.2, rough, 0.18, e)
def hornbill():
    y = np.zeros((2, int(2.2 * SR)))
    for k in range(4):                                                    # the rhinoceros hornbill's loud "hok!" calls
        h = honk(330, 280, 0.19, [700, 1350, 2600, 3500], [140, 200, 280, 380], [1, 0.8, 0.4, 0.15])
        y = place(y, pan(h * (0.85 + 0.15 * (k % 2)), 0.2 - 0.1 * k), 0.05 + k * 0.38)
    return reverb(y, 'forest', 0.3)
def monkeys():
    y = np.zeros((2, int(2.6 * SR)))
    for k in range(3):                                                    # a proboscis monkey's deep nasal honks
        h = honk(200, 160, 0.26, [520, 1100, 2400], [110, 180, 260], [1, 0.75, 0.35], 0.25)
        y = place(y, pan(h, -0.2), 0.1 + k * 0.5)
    for k in range(5):                                                    # the others chattering
        d = R.uniform(0.06, 0.12); n = int(d * SR); t = np.arange(n) / SR; f = R.uniform(700, 1100) * (1 + 0.3 * t / d)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.25
        y = place(y, pan(s, R.uniform(0.2, 0.7)), R.uniform(0.3, 1.8))
    y = place(y, pan(rustle_raw(0.9) * 0.4, 0.5), 1.4)
    return reverb(y, 'forest', 0.28)
def orangutan():
    y = np.zeros((2, int(4.6 * SR))); at = 0.0
    for k in range(5):                                                    # grumbles that build...
        d = 0.18; n = int(d * SR); t = np.arange(n) / SR
        g = voice(np.full(n, 110 + 6 * k), [300, 750, 2100], [90, 160, 260], [1, 0.4, 0.15], 0.03, 0.1, 1.2, 0.3, 0.3, 0.2, np.sin(np.pi * t / d))
        y = place(y, pan(g * (0.35 + 0.08 * k), 0), at); at += 0.32
    for k in range(3):                                                    # ...into the long call's big bellows
        d = 0.75; n = int(d * SR); t = np.arange(n) / SR
        f0 = np.interp(t, [0, 0.2, 0.6, 0.75], [170, 250, 230, 160])
        b = voice(f0, [np.interp(t, [0, 0.3, 0.75], [320, 520, 380]), 900, 2200], [100, 180, 260], [1, 0.5, 0.2], 0.03, 0.1, 1.0, 0.35, 0.25, 0.25,
                  env_curve(n, [(0, 0), (0.12, 1), (0.5, 0.9), (0.75, 0)]))
        y = place(y, pan(b * (0.8 + 0.1 * k), 0), at); at += 0.85
    return reverb(y, 'forest', 0.35)
def bats():
    d = 2.8; n = int(d * SR); y = np.zeros((2, int((d + 0.4) * SR)))
    dens = env_curve(n, [(0, 0.1), (0.8, 1), (2.0, 1), (2.8, 0)])
    for b in range(36):                                                   # a cloud of wings flapping past
        start = R.uniform(0, d - 0.6); rate = R.uniform(9, 14); flaps = int(R.uniform(4, 10)); p0 = R.uniform(-1, 1); p1 = -p0 * R.uniform(0.3, 1)
        for f in range(flaps):
            at = start + f / rate
            if at >= d: break
            L = int(0.03 * SR); s = bp(white(L), 700, 3500) * np.hanning(L) ** 2 * dens[min(n - 1, int(at * SR))] * R.uniform(0.3, 1)
            y = place(y, pan(s, p0 + (p1 - p0) * f / flaps), at)
    for k in range(24):                                                   # and their squeaks
        dd = R.uniform(0.015, 0.035); m = int(dd * SR); t = np.arange(m) / SR; f = R.uniform(6500, 9500) * (1 - 0.3 * t / dd)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dd) * R.uniform(0.15, 0.45)
        y = place(y, pan(s, R.uniform(-0.9, 0.9)), R.uniform(0.2, d - 0.2))
    return reverb(y, 'cave', 0.35)
def rustle_raw(d=1.0):
    n = int(d * SR); e = env_curve(n, [(0, 0), (0.06, 1), (d * 0.5, 0.7), (d, 0)])
    g = grains(d, 380, 1500, 7000, (0.003, 0.018), e, 5)
    twig = np.zeros(n)
    for k in range(3):
        i = int(R.uniform(0.05, d * 0.8) * SR); L = int(0.004 * SR); twig[i:i + L] += hp(white(L), 1800) * 0.7
    return g / (np.abs(g).max() + 1e-9) + twig
def rustle():
    y = np.vstack([rustle_raw(1.1), np.roll(rustle_raw(1.1), 300)])
    return reverb(y, 'forest', 0.18)
def frogs_fx():
    import build_synbeds as sb
    x = sb.frogs(2.6, dense=2.2)[:int(3.0 * SR)]
    return fadeout(fadein(pan(x, 0), 0.05), 0.5)
def hatch():
    d = 3.0; n = int(d * SR); t = np.arange(n) / SR; y = np.zeros((2, n + int(2.5 * SR)))
    for h in range(6):                                                     # tiny flippers scrabbling through sand
        start = R.uniform(0, 0.8); rate = R.uniform(4, 6); p = R.uniform(-0.8, 0.8)
        k = 0
        while start + k / rate < d - 0.2:
            at = start + k / rate; L = int(0.07 * SR)
            s = grains(0.07, 900, 400, 3000, (0.002, 0.008)) * np.hanning(L) * R.uniform(0.3, 0.8)
            y = place(y, pan(s, p), at); k += 1
    wash = fadeout(wave()[:, :int(4.0 * SR)], 1.2) * 0.35
    y = place(y, wash, 1.8)
    return reverb(y, 'outdoor', 0.15)
def wings():
    y = np.zeros((2, int(2.6 * SR)))
    for k in range(5):                                                    # big slow wingbeats going past
        d = 0.32; n = int(d * SR); t = np.arange(n) / SR
        s = svf(white(n), 300 + 900 * t / d, 0.9) * env_curve(n, [(0, 0), (0.06, 1), (0.3, 0)]) * 0.9
        s += lp(brown(n), 160) * env_curve(n, [(0, 0), (0.05, 0.6), (0.2, 0)])
        y = place(y, pan(s, -0.8 + 0.4 * k), k * 0.4)
    return reverb(y, 'outdoor', 0.2)

FX = {
    'splash': splash, 'pop': pop, 'waves': wave, 'gust': gust, 'thunder': lambda: thunder(0), 'thunder2': lambda: thunder(1, 0.4),
    'flare': flare, 'candle': candle, 'firework': lambda: firework(False), 'fireworkbig': lambda: firework(True), 'burst': burst, 'crackle': crackle,
    'sparkle': sparkle, 'chime': chime, 'land': land, 'glow': glow, 'petals': petals, 'lantern': lantern, 'bell': bellnote, 'gong': gong, 'drum': drum, 'tick': tick,
    'cheer': cheer, 'hooves': hooves, 'plane': plane, 'swell': swell, 'poof': poof, 'rattle': rattle,
    'roar': roar, 'trumpet': trumpet, 'hornbill': hornbill, 'monkeys': monkeys, 'orangutan': orangutan, 'bats': bats, 'rustle': rustle, 'frogs': frogs_fx, 'hatch': hatch, 'wings': wings,
}
LEVEL = {'tick': -24, 'pop': -24, 'chime': -22, 'sparkle': -22, 'land': -22, 'glow': -23, 'petals': -24, 'candle': -23, 'rustle': -24, 'hatch': -23, 'bell': -21,
         'thunder': -19, 'thunder2': -21, 'firework': -20, 'fireworkbig': -19, 'burst': -20, 'drum': -19, 'gong': -21, 'roar': -20, 'trumpet': -21, 'cheer': -21, 'waves': -21, 'gust': -22}
if __name__ == '__main__':
    only = sys.argv[1:]
    for name, fn in FX.items():
        if only and name not in only: continue
        out(name, fn(), LEVEL.get(name, -21))
