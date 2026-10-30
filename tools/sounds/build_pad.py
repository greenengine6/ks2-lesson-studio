import os
"""The calm pad for the space and aurora windows: five soft chords, each a slow swell (designed offline)."""
import json, numpy as np
from synth import *
import sndkit
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
r = np.random.default_rng(5)
def voice_note(f, d):
    n = int(d * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for det in (-0.006, 0.0, 0.0055):                        # three slightly detuned voices: a soft chorus
        ph = 2 * np.pi * f * (1 + det) * t + r.uniform(0, 6)
        for k in range(1, 9): y += np.sin(k * ph) / k ** 1.6
    y = lp(y, 900 + f * 1.5, 2)
    return y
CHORDS = {'c': [130.81, 196.0, 261.63, 329.63, 392.0], 'd': [146.83, 220.0, 293.66, 369.99, 440.0], 'e': [164.81, 246.94, 329.63, 392.0, 493.88],
          'g': [98.0, 146.83, 196.0, 246.94, 293.66], 'a': [110.0, 164.81, 220.0, 261.63, 329.63]}
snd = {}
for k, fs in CHORDS.items():
    d = 9.0; n = int(d * SR); y = np.zeros(n)
    for i, f in enumerate(fs):
        v = voice_note(f, d) * env_curve(n, [(0, 0), (2.6 + i * 0.3, 1), (5.5, 0.8), (9.0, 0)]) / (i + 1.2)
        y += v
    y += 0.02 * lp(pink(n), 2000) * env_curve(n, [(0, 0), (3, 1), (9, 0)])
    w = reverb(y, 'hall', 0.55)[:, :int(10.5 * SR)]
    snd[k] = fadeout(w, 1.5)
from build_kits import sprite
man = sprite('pad', snd, None, -26, '64k', 1)
json.dump({'pad': {'f': 'pad.mp3', 's': man}}, open('work/pad.json', 'w'), indent=1)
