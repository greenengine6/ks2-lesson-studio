import os
"""Ambient beds: seamless loops from licensed field recordings, mono AAC, periodic extension for gapless looping."""
import sys, json, numpy as np
from sndkit import *
B = 'blanket/data/resources/sounds/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
PRE = 0.25
# name: (source, start s, loop length s, crossfade s, target LUFS, bitrate, highpass Hz, lowpass Hz)
BEDS = {
  'rain':    ('rain.ogg', 20.0, 36.0, 3.0, -23, '64k', 40, None),
  'waves':   ('waves.ogg', 60.0, 46.0, 4.0, -23, '64k', 30, None),
  'wind':    ('wind.ogg', 0.6, 12.6, 1.6, -23, '64k', 30, 7200),
  'stream':  ('stream.ogg', 30.0, 34.0, 3.0, -23, '64k', 60, None),
  'birds':   ('birds.ogg', 2.0, 46.0, 3.0, -24, '56k', 150, None),
  'night':   ('summer-night.ogg', 4.0, 30.0, 2.0, -24, '56k', 200, None),
  'city':    ('city.ogg', 0.5, 22.0, 2.0, -24, '56k', 40, None),
  'cafe':    ('coffee-shop.ogg', 0.3, 15.0, 1.3, -24, '56k', 60, None),
  'lapping': ('boat.ogg', 1.0, 36.0, 3.0, -24, '56k', 40, 9000),
  'storm':   ('storm.ogg', 0.3, 23.0, 1.8, -22, '64k', 30, None),
  'fire':    ('fireplace.ogg', 0.5, 22.0, 2.0, -26, '56k', 40, None),
}
def hp_lp(x, hp, lp):
    if hp: x = signal.sosfiltfilt(signal.butter(2, hp, 'highpass', fs=SR, output='sos'), x, axis=-1)
    if lp: x = signal.sosfiltfilt(signal.butter(4, lp, 'lowpass', fs=SR, output='sos'), x, axis=-1)
    return x
man = {}
for name, (src, st, L, X, tgt, br, hp, lp) in BEDS.items():
    x = load(B + src)                  # stereo
    m = x.mean(0, keepdims=True)       # mono: width comes back at runtime (two offsets, panned)
    m = hp_lp(m, hp, lp)
    loop = loopify(m, L, X, st)
    loop = gain_to(loop, tgt)
    ext = extend(loop, PRE, PRE)
    pk = np.abs(ext).max()
    if pk > 0.95: ext *= 0.95 / pk
    save('work/bed_' + name + '.wav', ext)
    size = encode('work/bed_' + name + '.wav', OUT + 'bed-' + name + '.mp3', br, 1)
    # seam check: difference between the last and first sample of the loop body vs typical step
    body = loop[0]; seam = abs(body[-1] - body[0]); step = np.median(np.abs(np.diff(body)))
    I, P = lufs('work/bed_' + name + '.wav')
    man[name] = {'f': 'bed-' + name + '.mp3', 'loop': [PRE, round(L, 4)], 'lufs': I}
    p99 = np.percentile(np.abs(np.diff(body)), 99.5)
    print(f'{name:8s} L={L:5.1f}s size={size/1024:6.1f}KB I={I} peak={P} seam={seam:.4f} p99.5-step={p99:.4f}')
json.dump(man, open('work/beds.json', 'w'), indent=1)
