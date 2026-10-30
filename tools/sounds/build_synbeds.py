import os
"""Synthesised ambient layers that no licensed recording covered: rainforest cicadas, cave drips, a frog chorus."""
import json, numpy as np
from synth import *
import sndkit
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
rng2 = np.random.default_rng(11)

def cicada_call(dur, f0=4300, sweep=0.12, rate=210, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    # tymbal clicks: a pulse train at `rate`, each click exciting a resonance (the cicada's body)
    pulses = np.zeros(n); k = 0.0
    while k < dur:
        i = int(k * SR)
        if i < n: pulses[i] = 1.0 + 0.3 * rng2.standard_normal()
        k += 1 / (rate * (1 + 0.02 * rng2.standard_normal()))
    fc = f0 * (1 + sweep * np.sin(np.pi * t / dur) ** 2)
    y = resonator(pulses * 4, fc, 380) + 0.35 * resonator(pulses * 4, fc * 1.95, 700) * bright
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.4
    return y * e

def cicadas(L=20.0):
    d = L + 2.0; n = int(d * SR); out = np.zeros(n); t = np.arange(n) / SR
    # the chorus far away: band of noise chopped by fast pulses, slowly breathing
    nz = bp(rng2.standard_normal(n), 4800, 7200, 3)
    chop = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + 0.25
    swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / d * 2 + 1.0)
    out += 0.22 * nz * chop * swell
    # nearer cicadas calling one after another
    at = 0.4
    while at < d - 3:
        cd = rng2.uniform(3.5, 6.5); f0 = rng2.uniform(3600, 5200); g = rng2.uniform(0.5, 1.0)
        c = cicada_call(cd, f0, rng2.uniform(0.05, 0.18), rng2.uniform(170, 260))
        i = int(at * SR); m = min(len(c), n - i); out[i:i + m] += g * c[:m] / (np.abs(c).max() + 1e-9)
        at += rng2.uniform(2.0, 5.0)
    out = hp(out, 2500, 2)
    return out

def drips(L=24.0):
    d = L + 2.0; n = int(d * SR); dry = np.zeros(n)
    at = 0.2
    while at < d - 0.3:
        f0 = rng2.choice([1100, 1300, 1500, 1750, 2100, 2500]) * rng2.uniform(0.97, 1.03)
        b = bubble(f0, rng2.uniform(0.05, 0.11), rng2.uniform(1.4, 2.2), rng2.uniform(0.3, 1.0))
        click = np.zeros(int(0.004 * SR)); click[0] = 0.6; click = hp(click, 2000)
        s = np.concatenate([click, np.zeros(int(0.003 * SR))]); s = np.concatenate([s, b])
        i = int(at * SR); dry[i:i + len(s)] += s[:max(0, min(len(s), n - i))]
        at += rng2.exponential(0.9) + 0.18
    air = 0.05 * lp(brown(n), 140, 2) + 0.012 * bp(rng2.standard_normal(n), 300, 900)
    wet = reverb(dry, 'cave', 0.75)[:, :n].mean(0)
    return wet + air

def frog_croak(f0=300, pulses=4, prate=24, fF=900):
    out = []
    for p in range(pulses):
        d = 0.022; t = T(d); src = glottal(np.full(len(t), f0 * rng2.uniform(0.97, 1.03)), 0.02, 0.05, 1.0)
        y = formants(src, [fF, fF * 2.1], [180, 400], [1, 0.4]) * np.hanning(len(t))
        out.append(y); out.append(np.zeros(int((1 / prate - d) * SR)))
    return np.concatenate(out)

def frog_peep(f=2800):
    d = rng2.uniform(0.05, 0.08); t = T(d); fi = f * (1 + 0.18 * t / d)
    return np.sin(2 * np.pi * np.cumsum(fi) / SR) * np.sin(np.pi * t / d) ** 2

def frog_trill(f=1800, d=0.6, rate=38):
    t = T(d); car = np.sin(2 * np.pi * f * t); am = (np.sin(2 * np.pi * rate * t) > 0.2) * 1.0
    am = lp(am, 300); return car * am * np.sin(np.pi * t / d)

def frog_bonk(f0=150):
    d = 0.28; t = T(d); src = glottal(f0 * (1 - 0.15 * t / d), 0.01, 0.04, 1.3)
    return formants(src, [420, 1100], [120, 300], [1, 0.3]) * np.sin(np.pi * np.clip(t / d * 1.3, 0, 1)) ** 0.7

def frogs(L=20.0, dense=1.0):
    d = L + 2.0; n = int(d * SR); out = np.zeros(n)
    def put(s, at, g):
        i = int(at * SR); m = min(len(s), n - i)
        if m > 0: out[i:i + m] += g * s[:m] / (np.abs(s).max() + 1e-9)
    # four kinds of frogs, each calling at its own pace
    for f0, fF, period, g in [(280, 950, 1.7, 0.7), (340, 1250, 2.3, 0.5)]:
        at = rng2.uniform(0, 1)
        while at < d - 0.5: put(frog_croak(f0, int(rng2.integers(3, 7)), rng2.uniform(20, 28), fF), at, g * rng2.uniform(0.6, 1)); at += period * rng2.uniform(0.6, 1.4) / dense
    at = 0.3
    while at < d - 0.3:
        f = rng2.uniform(2500, 3400)
        for k in range(int(rng2.integers(1, 4))): put(frog_peep(f), at + k * 0.16, 0.35)
        at += rng2.uniform(0.7, 1.6) / dense
    at = 2.0
    while at < d - 1: put(frog_trill(rng2.uniform(1500, 2100), rng2.uniform(0.4, 0.9)), at, 0.25); at += rng2.uniform(3, 6)
    at = 1.0
    while at < d - 1: put(frog_bonk(rng2.uniform(120, 170)), at, 0.6); at += rng2.uniform(2.5, 5.5)
    return reverb(out, 'forest', 0.3)[:, :n].mean(0)

if __name__ == '__main__':
    man = {}
    for name, fn, L, X, tgt in [('cicadas', cicadas, 20.0, 2.0, -26), ('drips', drips, 24.0, 2.0, -27), ('frogs', frogs, 20.0, 2.0, -26)]:
        x = fn(L)[None, :]
        loop = sndkit.loopify(x, L, X, 0.0)
        loop = sndkit.gain_to(loop, tgt)
        ext = sndkit.extend(loop, 0.25, 0.25)
        pk = np.abs(ext).max()
        if pk > 0.95: ext *= 0.95 / pk
        sndkit.save('work/bed_' + name + '.wav', ext)
        size = sndkit.encode('work/bed_' + name + '.wav', OUT + 'bed-' + name + '.mp3', '56k', 1)
        I, P = sndkit.lufs('work/bed_' + name + '.wav')
        man[name] = {'f': 'bed-' + name + '.mp3', 'loop': [0.25, L], 'lufs': I}
        sndkit.spec_png(ext, 'work/bed_' + name + '.png', title=name)
        print(name, 'size %.0fKB' % (size / 1024), 'I', I, 'peak', P)
    json.dump(man, open('work/synbeds.json', 'w'), indent=1)
