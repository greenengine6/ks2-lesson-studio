# The sound build

Makes everything in `assets/sounds/` and writes `assets/js/fx/soundbank.js`. Run from this folder, after fetching
the sources next to it:

```
git clone --depth 1 https://github.com/rafaelmardojai/blanket          # field recordings (see its SOUNDS_LICENSING.md)
git clone --depth 1 --filter=blob:none --sparse https://github.com/gleitz/midi-js-soundfonts gm
cd gm && git sparse-checkout set --no-cone 'FluidR3_GM/*-mp3/' && cd .. && mkdir -p fluid && cp -r gm/FluidR3_GM/*-mp3 fluid/
mkdir -p work/fx
python3 build_beds.py && python3 build_synbeds.py && python3 build_fx.py && python3 encode_fx.py
python3 build_kits.py && python3 build_pad.py && python3 build_bank.py
```

- `sndkit.py`: loading, loudness (ffmpeg's EBU R128), seamless loops with a periodic extension, MP3 encoding.
- `synth.py`: the offline sound design library (noise, filters, modal synthesis, a voice model with formants,
  bubbles, granular textures, convolution reverb).
- `build_beds.py`: the ambient loops from the recordings. `build_synbeds.py`: cicadas, cave drips, frog chorus.
- `build_fx.py`: the Wonder Window's effects (rendered to `work/fx/`; `encode_fx.py` makes the MP3s). `build_kits.py`: the interface sounds, the drum kit and the
  instruments as sprites. `build_pad.py`: the calm pad. `build_bank.py`: the manifest the site reads.

Needs ffmpeg (with libmp3lame), numpy, scipy and matplotlib. Credits: `assets/sounds/CREDITS.md`.
