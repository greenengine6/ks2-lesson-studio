"""Small audio toolkit: load/save via ffmpeg, loudness, spectrograms, loops, synthesis helpers."""
import subprocess, json, os, re, numpy as np
from scipy import signal
from scipy.io import wavfile
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))

def load(path, sr=SR, ch=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', str(sr)]
    if ch: cmd += ['-ac', str(ch)]
    cmd += ['-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    nch = ch or int(json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'json', path], capture_output=True).stdout)['streams'][0]['channels'])
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, nch).T.copy()
    return x  # shape (ch, n)

def save(path, x, sr=SR):
    x = np.atleast_2d(x)
    y = np.clip(x.T, -1, 1)
    wavfile.write(path, sr, (y * 32767).astype(np.int16))

def lufs(path):
    out = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=framelog=quiet:peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', out); P = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', out)
    return (float(I[-1]) if I else None, float(P[-1]) if P else None)

def lufs_arr(x, sr=SR):
    tmp = os.path.join(HERE, 'work', '_tmp_lufs.wav'); save(tmp, x, sr); return lufs(tmp)

def gain_to(x, target, sr=SR):
    I, _ = lufs_arr(x, sr)
    if I is None or I < -70: return x
    return x * 10 ** ((target - I) / 20)

def spec_png(x, path, sr=SR, title='', fmax=12000):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    x = np.atleast_2d(x); m = x.mean(0)
    f, t, S = signal.spectrogram(m, sr, nperseg=2048, noverlap=1536)
    fig, ax = plt.subplots(2, 1, figsize=(12, 6), gridspec_kw={'height_ratios': [3, 1]})
    k = f <= fmax
    ax[0].pcolormesh(t, f[k], 10 * np.log10(S[k] + 1e-12), shading='auto', cmap='magma', vmin=-120, vmax=-30)
    ax[0].set_title(title); ax[0].set_ylabel('Hz')
    tt = np.arange(len(m)) / sr; ax[1].plot(tt, m, lw=0.3); ax[1].set_xlim(0, tt[-1]); ax[1].set_ylim(-1, 1)
    fig.tight_layout(); fig.savefig(path, dpi=70); plt.close(fig)

def loopify(x, L, X, start=0.0, sr=SR):
    """Seamless loop of L seconds from x (ch, n): take L+X seconds, equal-power crossfade the extra X onto the start."""
    x = np.atleast_2d(x); s = int(start * sr); n = int(L * sr); m = int(X * sr)
    seg = x[:, s:s + n + m].copy()
    a = seg[:, :n].copy(); tail = seg[:, n:n + m]
    t = np.linspace(0, 1, m)
    fin, fout = np.sin(t * np.pi / 2), np.cos(t * np.pi / 2)
    a[:, :m] = a[:, :m] * fin + tail * fout
    return a

def extend(loop, pre, post, sr=SR):
    """Periodic extension: [last pre s][loop][first post s] so any window of the loop's length loops seamlessly."""
    p, q = int(pre * sr), int(post * sr)
    return np.concatenate([loop[:, -p:], loop, loop[:, :q]], axis=1)

def encode(wav, out, br='64k', ch=1, sr=44100):
    """MP3 (LAME VBR): every browser decodes it, including open-source Chromium and Firefox builds without AAC.
    br is a quality hint: '96k'/'80k' → V5, '64k' → V6, else V7."""
    out = out[:-4] + '.mp3' if out.endswith('.m4a') else out
    q = '5' if br in ('96k', '80k') else '6' if br == '64k' else '7'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', str(ch), '-ar', str(sr), '-c:a', 'libmp3lame', '-q:a', q, out], check=True)
    return os.path.getsize(out)

def fade(x, fi=0.005, fo=0.05, sr=SR):
    x = np.atleast_2d(x).copy(); n = x.shape[1]
    a, b = int(fi * sr), int(fo * sr)
    if a: x[:, :a] *= np.linspace(0, 1, a)
    if b: x[:, n - b:] *= np.linspace(1, 0, b) ** 2
    return x
