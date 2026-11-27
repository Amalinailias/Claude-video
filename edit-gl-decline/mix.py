"""Builds the final soundtrack: cleaned + levelled voice (cut per EDL) + SFX cue sheet.

usage: python3 mix.py <work_dir> <meta.json> <out.wav>
"""
import json, os, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfx  # noqa
from timeline import build, HOOK  # noqa

work, meta_path, out = sys.argv[1:4]
SR = 48000
meta = json.load(open(meta_path))
TOTAL = meta['total']


def load(f):
    w = wave.open(f)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def save(f, x):
    x = np.clip(x, -1, 1)
    w = wave.open(f, 'wb')
    ch = 1 if x.ndim == 1 else x.shape[1]
    w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
    w.close()


# 1) voice: cut with short equal-power crossfades at every joint
# optional AI noise removal on each source voice (RNNoise model, e.g. bd.rnnn) before cutting
def _voice(n):
    v = os.path.join(work, f'v{n}.wav')
    if os.environ.get('DENOISE_MODEL'):
        d = os.path.join(work, f'v{n}_denoised.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-af', f"highpass=f=80,arnndn=m={os.environ['DENOISE_MODEL']}", d], check=True)
        v = d
    return load(v)
src = {1: _voice(1)}


def stretch(x, sp):
    """speed up without changing pitch (ffmpeg rubberband, speech-friendly settings)"""
    a_, b_ = os.path.join(work, '_st_in.wav'), os.path.join(work, '_st_out.wav')
    save(a_, x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a_, '-af', f'rubberband=tempo={sp}:transients=crisp:detector=compound:phase=laminar:window=standard:pitchq=quality:formant=preserved',
                    '-ar', str(SR), '-ac', '1', b_], check=True)
    y = load(b_)
    return y[: int(round(len(x) / sp))] if len(y) > len(x) / sp else y
segs, _ = build()
voice = np.zeros(int((TOTAL + 1) * SR), np.float32)
XF = int(0.012 * SR)
for s in segs:
    if s.get('mute'):
        continue
    a, b = int(s['src_in'] * SR), int(s['src_out'] * SR)
    x = src[s['clip']][max(0, a - XF // 2): b + XF // 2].copy()
    if s.get('speed', 1.0) != 1.0:
        x = stretch(x, s['speed'])
    ramp = np.sin(np.linspace(0, np.pi / 2, XF)) ** 2
    x[:XF] *= ramp
    x[-XF:] *= ramp[::-1]
    o = int(s['out_in'] * SR) - XF // 2
    if o < 0:          # first segment starts at t=0: drop the pre-roll half of the crossfade
        x = x[-o:]; o = 0
    voice[o:o + len(x)] += x
raw_voice = os.path.join(work, 'voice_raw.wav')
proc_voice = os.path.join(work, 'voice_proc.wav')
save(raw_voice, voice)

# 2) clean-up chain: rumble cut, light denoise, gentle compression, presence, loudness
chain = ('highpass=f=85,afftdn=nr=8:nf=-38:tn=1,'
         'acompressor=threshold=-21dB:ratio=3:attack=6:release=120:makeup=2,'
         'equalizer=f=220:t=q:w=1.2:g=-1.5,equalizer=f=3200:t=q:w=1.0:g=2,equalizer=f=9000:t=q:w=1.5:g=1,'
         'loudnorm=I=-17:TP=-3:LRA=9')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw_voice, '-af', chain, '-ar', str(SR), proc_voice], check=True)
v = load(proc_voice)
v = np.pad(v, (0, max(0, int(TOTAL * SR) - len(v))))[: int(TOTAL * SR)]

# 3) SFX
fx = sfx.render_cues([tuple(c) for c in meta['cues']], TOTAL)
fx *= 10 ** (1.5 / 20)

# 4) music bed (optional): voice-space EQ, sidechain-style ducking under speech
music = np.zeros_like(fx)
if len(sys.argv) > 4:
    mpath = os.path.join(work, 'music_eq.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', sys.argv[4], '-af',
                    'equalizer=f=2800:t=q:w=1.2:g=-4,equalizer=f=1000:t=q:w=1.0:g=-2,highpass=f=45',
                    '-ar', str(SR), mpath], check=True)
    w_ = wave.open(mpath)
    mus = np.frombuffer(w_.readframes(w_.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768.0
    mus = np.pad(mus, ((0, max(0, len(fx) - len(mus))), (0, 0)))[: len(fx)]
    # voice activity envelope (attack ~40 ms, release ~450 ms)
    hop = 480
    fr = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, mode='same'))[::hop]
    act = np.clip((20 * np.log10(fr + 1e-6) + 42) / 12, 0, 1)
    sm = np.zeros_like(act)
    for i in range(1, len(act)):
        k = 0.45 if act[i] > sm[i - 1] else 0.022
        sm[i] = sm[i - 1] + k * (act[i] - sm[i - 1])
    duck_db = -7.0 * np.interp(np.arange(len(v)) / hop, np.arange(len(sm)), sm)
    tt = np.arange(len(v)) / SR
    base_db = -2.0 + 5.0 * np.clip((HOOK - tt) / 0.4, 0, 1)  # hook bed louder (no voice)
    music = mus * (10 ** ((base_db + duck_db) / 20))[:, None]
save(os.path.join(work, "music_bus.wav"), music)
mix = np.stack([v, v], axis=1) * 0.98 + fx + music
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
tmp = out + '.pre.wav'
save(tmp, mix * 0.5)  # headroom; limiter restores level
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'volume=2.0,alimiter=limit=0.89:attack=2:release=60:level=disabled',
                '-ar', str(SR), out], check=True)
os.remove(tmp)
mix = load(out)
print('mix peak', float(np.max(np.abs(mix))), 'len', len(mix) / SR)
