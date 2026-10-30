"""Sprites: the site's interface sounds, the music's drum kit, the recorded instruments (FluidR3 GM, CC BY 3.0),
and the calm pad. Each sprite is one AAC file with its sounds laid end to end; offsets go into the manifest."""
import os, json, numpy as np
from synth import *
import sndkit
from build_fx import inst, arp, out as _out, gong as _gong, pop as _pop, R
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
GAP = 0.12

def ui_tap():
    y = modal([1750, 4030, 6900], [1, 0.35, 0.12], [0.022, 0.012, 0.006], 0.12, 0.0006)
    y[:int(0.002 * SR)] += hp(white(int(0.002 * SR)), 3000) * 0.15
    return reverb(y, 'room', 0.12)
def ui_nav():
    y = modal([2620, 7230], [1, 0.3], [0.045, 0.02], 0.16, 0.0008)
    return reverb(y, 'room', 0.15)
def notes(i, ms, step, dur, wet=0.18, kind='room', vol=1.0): return arp(i, ms, step, vol, dur, wet, kind)
def ui_send():
    d = 0.3; n = int(d * SR); t = np.arange(n) / SR
    w = svf(white(n), 600 * (5 ** (t / d)), 1.1) * env_curve(n, [(0, 0), (0.12, 1), (0.3, 0)]) * 0.5
    y = pan(w, np.linspace(-0.2, 0.3, n))
    y = place(y, pan(modal([2640, 5300], [1, 0.25], [0.05, 0.02], 0.12, 0.001) * 0.35, 0.3), 0.13)
    return reverb(y, 'room', 0.15)
def ui_page():
    d = 0.22; n = int(d * SR); t = np.arange(n) / SR
    a = hp(white(n), 2600) * env_curve(n, [(0, 0), (0.03, 1), (0.22, 0)]) * 0.4
    b = svf(white(n), 1400 * np.exp(-t / 0.12) + 600, 1.2) * env_curve(n, [(0, 0), (0.05, 1), (0.22, 0)]) * 0.5
    return reverb(pan(a + b, np.linspace(0.3, -0.3, n)), 'room', 0.1)
def ui_whoosh():
    d = 0.6; n = int(d * SR); t = np.arange(n) / SR
    w = svf(pink(n), 2600 * (0.15 ** (t / d)), 0.9) * env_curve(n, [(0, 0), (0.2, 1), (0.6, 0)]) * 0.6
    return reverb(pan(w, np.linspace(-0.5, 0.5, n)), 'room', 0.15)
def ui_present():
    d = 0.9; n = int(d * SR); t = np.arange(n) / SR
    air = svf(pink(n), 300 * (8 ** (t / d)), 0.9) * env_curve(n, [(0, 0), (0.6, 1), (0.9, 0)]) * 0.35
    y = pan(air, 0)
    y = place(y, notes('celesta', [79, 84, 88], 0.06, 1.2, 0.0), 0.5)
    return reverb(y, 'hall', 0.25)
def ui_error():
    return notes('marimba', [55, 51], 0.14, 0.7, 0.15)
def ui_unlock():
    y = notes('woodblock', [86], 0.0, 0.15, 0.0, vol=0.6)
    y = place(y, notes('woodblock', [81], 0.0, 0.15, 0.0, vol=0.5), 0.035)
    y = place(y, notes('marimba', [72, 76, 79, 84], 0.075, 0.9, 0.0), 0.12)
    return reverb(y, 'room', 0.18)
def ui_win():
    y = notes('marimba', [72, 76, 79, 84], 0.1, 0.8, 0.0)
    y = place(y, notes('celesta', [88, 91, 96], 0.02, 1.6, 0.0, vol=0.8), 0.45)
    return reverb(y, 'hall', 0.3)
def ui_flip():
    d = 0.12; n = int(d * SR); t = np.arange(n) / SR
    a = hp(white(n), 3200) * env_curve(n, [(0, 0), (0.01, 1), (0.12, 0)]) * 0.5
    return reverb(pan(a, np.linspace(-0.3, 0.3, n)), 'room', 0.1)
UI = {
    'tap': ui_tap, 'nav': ui_nav,
    'on': lambda: notes('celesta', [79, 86], 0.07, 0.6), 'off': lambda: notes('celesta', [84, 77], 0.07, 0.55),
    'open': lambda: notes('celesta', [72, 76, 79, 84, 88], 0.045, 0.8), 'close': lambda: notes('celesta', [84, 79, 72], 0.05, 0.6),
    'listen': lambda: notes('vibraphone', [76, 83], 0.11, 0.8), 'unlisten': lambda: notes('vibraphone', [83, 76], 0.1, 0.7),
    'send': ui_send, 'success': lambda: notes('marimba', [72, 76, 79, 84], 0.075, 0.9), 'error': ui_error,
    'pop': lambda: _pop(), 'page': ui_page, 'present': ui_present, 'toast': lambda: notes('celesta', [96], 0.0, 0.5, 0.2, vol=0.6),
    'chime': lambda: notes('tubular_bells', [76, 81, 88], 0.18, 1.6, 0.3, 'hall'), 'whoosh': ui_whoosh, 'unlock': ui_unlock,
    # games and the pupils' page
    'win': ui_win, 'lose': lambda: notes('marimba', [67, 64, 60], 0.16, 0.8, 0.18), 'flip': ui_flip,
    'go': lambda: notes('celesta', [72, 79], 0.16, 0.7), 'step': lambda: notes('marimba', [76, 83], 0.07, 0.5, 0.12),
    'tick': lambda: notes('woodblock', [84], 0.0, 0.2, 0.08, vol=0.7), 'cue': lambda: notes('vibraphone', [79, 84], 0.13, 0.9, 0.2),
}
UI_LEVEL = {'win': -21, 'lose': -24, 'flip': -27, 'go': -23, 'step': -25, 'tick': -27, 'cue': -22, 'tap': -26, 'nav': -27, 'toast': -27, 'pop': -24, 'page': -26, 'on': -24, 'off': -25, 'open': -23, 'close': -24, 'listen': -23, 'unlisten': -24,
            'send': -24, 'success': -21, 'error': -23, 'present': -22, 'chime': -21, 'whoosh': -24, 'unlock': -21}

# ---------------- the drum kit for the music ----------------
def d_slap():
    n = int(0.12 * SR); t = np.arange(n) / SR
    y = bp(white(n), 1200, 5000) * np.exp(-t / 0.012) * 0.8 + np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.05) * 0.6
    return reverb(y, 'room', 0.12)
def d_dayan():                         # tabla's right drum: a ringing, almost pitched tone (harmonic modes)
    y = modal([520, 1040, 1560, 2090, 2600], [1, 0.6, 0.4, 0.25, 0.12], [0.35, 0.25, 0.18, 0.12, 0.08], 0.7, 0.001)
    y[:int(0.003 * SR)] += hp(white(int(0.003 * SR)), 2000) * 0.4
    return reverb(y, 'room', 0.12)
def d_bayan():                         # tabla's left drum: deep, with the pitch bending up
    n = int(0.6 * SR); t = np.arange(n) / SR; f = 95 * (1 + 0.35 * (1 - np.exp(-t / 0.15)))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * np.exp(-t / 0.1)
    return reverb(y, 'room', 0.12)
def d_shake():
    n = int(0.09 * SR); t = np.arange(n) / SR
    y = hp(white(n), 5500) * env_curve(n, [(0, 0), (0.012, 1), (0.09, 0)]) * 0.6
    return reverb(y, 'room', 0.1)
def d_clap():
    y = np.zeros(int(0.3 * SR))
    for k, a in enumerate([0.6, 0.7, 1.0]):
        n = int(0.02 * SR); c = bp(white(n), 900, 3500) * np.exp(-np.arange(n) / SR / 0.004)
        i = int(k * 0.011 * SR); y[i:i + n] += c * a
    tail = bp(white(int(0.25 * SR)), 900, 3000) * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.05) * 0.3; y[int(0.03 * SR):int(0.03 * SR) + len(tail)] += tail[:len(y) - int(0.03 * SR)]
    return reverb(y, 'room', 0.2)
def d_crash():
    n = int(2.2 * SR); t = np.arange(n) / SR
    y = hp(white(n), 3500) * np.exp(-t / 0.55) * 0.6 + bp(white(n), 900, 3500) * np.exp(-t / 0.25) * 0.3
    y[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return reverb(fadeout(y, 0.5)[0], 'hall', 0.2)
def d_whistle():
    y = np.zeros(int(0.9 * SR))
    for k in range(3):
        n = int(0.16 * SR); t = np.arange(n) / SR
        f = 2350 * (1 + 0.03 * np.sign(np.sin(2 * np.pi * 38 * t)))             # the pea rattling: a fast trill
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_curve(n, [(0, 0), (0.01, 1), (0.13, 0.8), (0.16, 0)]) + 0.08 * bp(white(n), 2000, 3000)
        i = int(k * 0.21 * SR); y[i:i + n] += s
    return reverb(y, 'outdoor', 0.15)
def d_sleigh():
    y = np.zeros(int(0.5 * SR))
    for k in range(9):
        b = modal([R.uniform(5200, 6800), R.uniform(8000, 9800)], [1, 0.4], [0.09, 0.05], 0.3, 0.0005) * R.uniform(0.4, 1)
        i = int(R.uniform(0, 0.08) * SR); y[i:i + len(b)] += b[:len(y) - i]
    return reverb(y, 'room', 0.15)
DRUMS = {
    'kick': lambda: pan(inst('taiko_drum', 41, 1.0), 0), 'kick2': lambda: pan(inst('taiko_drum', 48, 0.8), 0),
    'tom': lambda: pan(inst('melodic_tom', 50, 0.8), 0),
    'slap': d_slap, 'dayan': d_dayan, 'bayan': d_bayan, 'shake': d_shake, 'clap': d_clap, 'crash': d_crash,
    'wood': lambda: pan(inst('woodblock', 84, 0.25), 0), 'wood2': lambda: pan(inst('woodblock', 77, 0.25), 0),
    'agogo': lambda: pan(inst('agogo', 79, 0.5), 0), 'whistle': d_whistle, 'sleigh': d_sleigh,
    'gong': lambda: _gong(), 'timp': lambda: pan(inst('timpani', 41, 1.6), 0),
}
DRUM_LEVEL = {'gong': -20, 'crash': -24, 'shake': -26, 'sleigh': -25, 'whistle': -24}

# ---------------- instruments: 7 notes each, every 7 semitones ----------------
INSTRUMENTS = {
    'koto': (48, 1.6), 'acoustic_guitar_steel': (48, 1.6), 'acoustic_guitar_nylon': (48, 1.7), 'banjo': (48, 1.2), 'sitar': (48, 2.0), 'dulcimer': (48, 1.8),
    'orchestral_harp': (48, 2.0), 'vibraphone': (55, 1.8), 'glockenspiel': (62, 1.6), 'celesta': (62, 1.6), 'tubular_bells': (55, 2.4), 'marimba': (48, 0.9),
    'xylophone': (55, 0.7), 'clarinet': (48, 0.9), 'pan_flute': (55, 1.0), 'ocarina': (55, 1.0),
}
STEP = 7; COUNT = 7

UI_PEAK = {'tap': -26, 'nav': -27, 'page': -26, 'toast': -30, 'whoosh': -24, 'send': -23, 'flip': -27, 'tick': -26, 'pop': -20,
           'on': -21, 'off': -22, 'open': -20, 'close': -22, 'listen': -20, 'unlisten': -21, 'step': -21, 'go': -19,
           'success': -17, 'unlock': -17, 'win': -16, 'cue': -18, 'error': -19, 'lose': -19, 'chime': -16, 'present': -18}
def sprite(name, sounds, levels=None, default=-22, br='96k', ch=2, peaks=None):
    """sounds: dict key -> stereo array. Writes one file; returns {key: [offset, dur]}"""
    parts, man, at = [], {}, GAP
    for k, x in sounds.items():
        x = np.atleast_2d(x)
        if x.shape[0] == 1: x = np.vstack([x, x])
        x = trim(x, -60, 0.02); x = fadeout(x, min(0.06, x.shape[1] / SR * 0.25))
        if peaks and k in peaks:
            x = x * 10 ** (peaks[k] / 20) / (np.abs(x).max() + 1e-9)
        elif x.shape[1] / SR > 0.5:
            I, _ = sndkit.lufs_arr(x); tgt = (levels or {}).get(k, default)
            if I is not None and I > -70: x = x * 10 ** ((tgt - I) / 20)
        else:
            tgt = (levels or {}).get(k, default); x = x * 10 ** ((tgt + 13) / 20) / (np.abs(x).max() + 1e-9)
        pk = np.abs(x).max()
        if pk > 0.89: x = x * 0.89 / pk
        man[k] = [round(at, 4), round(x.shape[1] / SR, 4)]
        parts += [x, np.zeros((2, int(GAP * SR)))]; at += x.shape[1] / SR + GAP
    y = np.concatenate([np.zeros((2, int(GAP * SR)))] + parts, axis=1)
    if ch == 1: y = y.mean(0, keepdims=True)
    sndkit.save('work/%s.wav' % name, y)
    size = sndkit.encode('work/%s.wav' % name, OUT + name + '.mp3', br, ch)
    print('%-28s %2d sounds %6.2fs %6.1fKB' % (name, len(sounds), y.shape[1] / SR, size / 1024))
    return man

if __name__ == '__main__':
    bank = {}
    bank['ui'] = {'f': 'ui.mp3', 's': sprite('ui', {k: f() for k, f in UI.items()}, UI_LEVEL, -24, '80k', 1, UI_PEAK)}
    bank['drums'] = {'f': 'drums.mp3', 's': sprite('drums', {k: f() for k, f in DRUMS.items()}, DRUM_LEVEL, -22, '80k', 1)}
    for name, (lo, dur) in INSTRUMENTS.items():
        snd = {}
        for k in range(COUNT):
            m = lo + k * STEP
            x = inst(name, m, dur)
            snd[str(m)] = x[None, :]
        key = 'i-' + name.replace('acoustic_guitar_', 'guitar-').replace('orchestral_harp', 'harp').replace('tubular_bells', 'tubular').replace('_', '-')
        man = sprite(key, snd, None, -24, '64k', 1)
        bank[key] = {'f': key + '.mp3', 's': man, 'notes': [lo + k * STEP for k in range(COUNT)]}
    json.dump(bank, open('work/kits.json', 'w'), indent=1)
