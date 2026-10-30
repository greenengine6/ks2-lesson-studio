"""Encode the rendered effects (work/fx/*.wav) to assets/sounds/fx-*.mp3 and list them for build_bank.py."""
import glob, os, json
import sndkit
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
fx = {}
for f in sorted(glob.glob('work/fx/*.wav')):
    n = os.path.basename(f)[:-4]
    sndkit.encode(f, OUT + 'fx-' + n + '.mp3', '80k', 2)
    x = sndkit.load(f, ch=2); fx[n] = {'f': 'fx-' + n + '.mp3', 'd': round(x.shape[1] / sndkit.SR, 3)}
json.dump(fx, open('work/fx.json', 'w'), indent=1)
print(len(fx), 'effects')
