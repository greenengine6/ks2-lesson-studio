#!/usr/bin/env python3
"""Stamp one version on every script and style address (?v=xxxxxxxx), so after a change every phone and laptop
loads a matching set of fresh files instead of mixing old cached ones with new ones.

Run it before each commit:  python3 tools/stamp.py
The version is a hash of the files' own content, so running it twice changes nothing."""
import hashlib, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VQ = re.compile(r'\?v=[0-9a-f]{8}')
IMPORT = re.compile(r'''((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"])(\.{1,2}/(?![^'"]*vendor/)[^'"?]+?\.js)(?:\?v=[0-9a-f]{8})?(['"])''')   # vendor files keep their own versioned folders
ASSET = re.compile(r'''((?:href|src)=")((?:\.\./)?assets/(?:js|css)/[^"?]+?\.(?:js|css))(?:\?v=[0-9a-f]{8})?(")''')

def walk(sub, ext):
    out = []
    for d, _, names in os.walk(os.path.join(ROOT, sub)):
        out += [os.path.join(d, n) for n in names if n.endswith(ext)]
    return sorted(out)

js, css = walk('assets/js', '.js'), walk('assets/css', '.css')
pages = [p for p in (os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'join', 'index.html'), os.path.join(ROOT, 'homework', 'index.html'),
                      os.path.join(ROOT, 'games', 'run.html')) if os.path.exists(p)]
h = hashlib.sha256()
for f in js + css + pages:
    h.update(os.path.relpath(f, ROOT).encode())
    h.update(VQ.sub('', open(f, encoding='utf-8').read()).encode())
v = h.hexdigest()[:8]

changed = 0
for f in js + pages:
    s = open(f, encoding='utf-8').read()
    t = IMPORT.sub(lambda m: m.group(1) + m.group(2) + '?v=' + v + m.group(3), s) if f.endswith('.js') else ASSET.sub(lambda m: m.group(1) + m.group(2) + '?v=' + v + m.group(3), s)
    if t != s:
        open(f, 'w', encoding='utf-8').write(t)
        changed += 1
print('version', v, '·', changed, 'files updated')
