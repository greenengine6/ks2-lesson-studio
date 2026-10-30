"""Write assets/js/fx/soundbank.js: every sound file, its loop points or sprite offsets, and a content hash for caching."""
import json, hashlib, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'sounds') + os.sep
def h(f): return hashlib.md5(open(OUT + f, 'rb').read()).hexdigest()[:8]
beds = json.load(open('work/beds.json')); beds.update(json.load(open('work/synbeds.json')))
for k, v in beds.items(): v['h'] = h(v['f']); v['lufs'] = round(v['lufs'], 1)
fx = json.load(open('work/fx.json'))
for k, v in fx.items(): v['h'] = h(v['f'])
kits = json.load(open('work/kits.json')); kits.update(json.load(open('work/pad.json')))
for k, v in kits.items(): v['h'] = h(v['f'])
J = lambda o: json.dumps(o, separators=(',', ':'))
src = '''/* The sound bank: every recorded or designed sound the site plays, in assets/sounds/. Made by the sound build (tools/sounds/)
   (field recordings cut into seamless loops, effects designed offline, recorded instruments laid out as sprites);
   credits in assets/sounds/CREDITS.md. Do not edit by hand: the build writes it.
   BEDS: ambient loops { f: file, loop: [start, length] in seconds, lufs: loudness, h: content hash }
   FX: one-shot effects { f, d: duration, h }
   KITS: sprites { f, s: { name: [offset, duration] }, notes: [midi of each sample] for instruments, h } */
export const BEDS = %s;
export const FX = %s;
export const KITS = %s;
''' % (J(beds), J(fx), J(kits))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'js', 'fx', 'soundbank.js'), 'w').write(src)
print('soundbank.js', len(src), 'bytes;', len(beds), 'beds,', len(fx), 'fx,', len(kits), 'kits')
