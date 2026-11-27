"""Original SOFT background song (G major, 80 BPM): felt-piano melody, Rhodes chords, warm pad, round bass and a
very light shaker. Fully synthesised, so it is safe for IG/TikTok. Arranged to the edit's timeline.

usage: python3 music.py <data.js> <meta.json> <out.wav>
"""
import json, sys
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)
data = json.loads(open(sys.argv[1]).read().split('=', 1)[1].rstrip().rstrip(';'))
meta = json.load(open(sys.argv[2]))
out_path = sys.argv[3]
TOTAL = meta['total']
HOOK = data['hook']
Wt = lambda i: data['words'][i]['s']
T = meta['times']

BPM = 80.0
BEAT = 60 / BPM
BAR = 4 * BEAT
HK = T.get('hk', data['segments'][0]['out_out'])
T0 = HK - 3 * BAR  # grid origin: a downbeat lands exactly where the hook ends (the drop)
N = int((TOTAL + 2) * SR)
L = np.zeros(N); R = np.zeros(N)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(buf, x, t):
    s = int(round(t * SR))
    if s >= len(buf):
        return
    if s < 0:
        x = x[-s:]; s = 0
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s]


def nearest_bar(t):
    return T0 + round((t - T0) / BAR) * BAR


# ------------------------------------------------------------------ arrangement
DROP = HK
LIFT = nearest_bar(T['t1'][0])            # tips — add 16th hats + pluck arpeggio
BREAK = nearest_bar(T['f2'][0])           # 'PENTING' — drums out (half-time takeaway)
BACK = nearest_bar(T['cta'][0])           # CTA — drums back
OUTRO = T['end']                     # end card — final resolve
END = TOTAL

# chords per bar: (bass midi, [keys midi])
PROG = [
    (43, [55, 59, 62, 66]),          # Gmaj7  (G | G B D F#)
    (38, [54, 57, 62, 64]),          # D6/9   (D | F# A D E)
    (40, [55, 59, 62, 64]),          # Em7    (E | G B D E)
    (36, [55, 59, 60, 64]),          # Cmaj9  (C | G B C E)
]
FINAL = (43, [55, 59, 62, 66, 71])


# ------------------------------------------------------------------ instruments
def rhodes(m, dur, vel=0.6):
    f = mtof(m)
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    idx = 1.3 * vel * np.exp(-t * 2.5) + 0.25
    body = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = 0.10 * vel * np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t * 18)
    env = np.minimum(1, t / 0.004) * (0.55 * np.exp(-t * 1.1) + 0.45 * np.exp(-t * 0.25))
    rel = np.clip((dur + 1.4 - t) / 1.4, 0, 1) ** 2
    return (body + tine) * env * rel * vel


def pluck(m, vel=0.4):
    f = mtof(m)
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)) * np.exp(-t * 4.5)
    return x * np.minimum(1, t / 0.002) * vel


def pad_chord(notes, dur):
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        for det in (-0.07, 0.0, 0.07):
            x += signal.sawtooth(2 * np.pi * mtof(m + det) * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / 0.9) * np.clip((dur + 0.9 - t) / 0.9, 0, 1)
    return x * env / (len(notes) * 3)


def bass(m, dur, vel=0.8):
    f = mtof(m)
    n = int((dur + 0.15) * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 0.9) * np.clip((dur + 0.12 - t) / 0.12, 0, 1)
    return np.tanh(1.3 * x * env) * vel


def kick(vel=1.0):
    t = np.arange(int(0.45 * SR)) / SR
    f = 46 + 70 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    x += 0.15 * rng.standard_normal(len(t)) * np.exp(-t * 250)
    return np.tanh(1.6 * x) * vel


def snare(vel=0.5):
    t = np.arange(int(0.35 * SR)) / SR
    nz = rng.standard_normal(len(t))
    nz = signal.sosfilt(signal.butter(2, [1200, 6000], 'band', fs=SR, output='sos'), nz) * np.exp(-t * 16)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return (nz * 1.3 + tone * 0.5) * vel


def hat(vel=0.3, open_=False):
    t = np.arange(int((0.25 if open_ else 0.06) * SR)) / SR
    nz = signal.sosfilt(signal.butter(2, 7000, 'high', fs=SR, output='sos'), rng.standard_normal(len(t)))
    return nz * np.exp(-t * (14 if open_ else 70)) * vel


# ------------------------------------------------------------------ soft piano voice
def piano(m, dur, vel=0.5):
    """felt piano: slightly inharmonic partials, soft hammer, fast high-partial decay"""
    f = mtof(m)
    n = int((dur + 2.2) * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 8):
        fk = f * k * np.sqrt(1 + 0.00012 * k * k)
        x += np.sin(2 * np.pi * fk * t) * (1 / k ** 1.6) * np.exp(-t * (0.9 + 0.75 * k))
    x += 0.02 * signal.sosfilt(signal.butter(2, [300, 2500], 'band', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 60)
    env = np.minimum(1, t / 0.006) * np.clip((dur + 0.5 - t) / 0.5, 0, 1) ** 1.5
    return x * env * vel


def shaker(vel=0.1):
    t = np.arange(int(0.09 * SR)) / SR
    nz = signal.sosfilt(signal.butter(2, [5000, 11000], 'band', fs=SR, output='sos'), rng.standard_normal(len(t)))
    return nz * np.minimum(1, t / 0.012) * np.exp(-t * 45) * vel


def softkick(vel=0.5):
    t = np.arange(int(0.4 * SR)) / SR
    f = 48 + 40 * np.exp(-t * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel


# melody over the 4-chord loop (two 4-bar phrases): (midi, start beat, length beats)
MEL = [
    [(71, 0, 1), (74, 1, 1), (78, 2, 2)],
    [(76, 0, 1), (74, 1, 1), (69, 2, 2)],
    [(67, 0, 1), (71, 1, 1), (74, 2, 1.5), (76, 3.5, 0.5)],
    [(74, 0, 3), (71, 3, 1)],
    [(71, 0, 1), (74, 1, 1), (79, 2, 2)],
    [(78, 0, 1), (76, 1, 1), (74, 2, 2)],
    [(71, 0, 1), (74, 1, 1), (76, 2, 2)],
    [(74, 0, 2), (71, 2, 1), (69, 3, 1)],
]

# ------------------------------------------------------------------ sequencing
keysL = np.zeros(N); keysR = np.zeros(N)
padB = np.zeros(N); bassB = np.zeros(N); drumB = np.zeros(N); plB = np.zeros(N)

bar_i = 0
tb = T0
mel_i = 0
while tb < END:
    bass_m, notes = PROG[bar_i % 4]
    final = tb + BAR > OUTRO
    if final:
        bass_m, notes = FINAL
    # Rhodes chord, softly rolled, plus a gentle re-strike on beat 3
    for k, m in enumerate(notes):
        v = 0.26 + rng.uniform(-0.03, 0.03)
        x = rhodes(m, BAR * (2.0 if final else 0.55), v)
        place(keysL, x, tb + 0.02 * k); place(keysR, x, tb + 0.02 * k + 0.008)
        if not final:
            x2 = rhodes(m, BAR * 0.4, v * 0.6)
            place(keysL, x2, tb + 2 * BEAT + 0.015 * k); place(keysR, x2, tb + 2 * BEAT + 0.015 * k + 0.008)
    place(padB, pad_chord([n - 12 if n > 60 else n for n in notes[:3]] + [notes[-1]], BAR * (2.4 if final else 1.0)), tb)
    if final:
        place(bassB, bass(bass_m - 12, BAR * 1.6, 0.55), tb)
        for k, m in enumerate([79, 74, 71, 67]):
            place(plB, piano(m, BAR * 1.5, 0.30), tb + 0.09 * k)
    else:
        place(bassB, bass(bass_m - 12, BEAT * 3.6, 0.55), tb)
        # melody from the drop (story) onwards; soft single notes in the hook
        if tb >= DROP - 1e-6:
            for m, b0, ln in MEL[mel_i % len(MEL)]:
                place(plB, piano(m, ln * BEAT, 0.34 + rng.uniform(-0.03, 0.03)), tb + b0 * BEAT + rng.normal(0, 0.004))
            mel_i += 1
        else:
            place(plB, piano(notes[-1] + 12, BEAT * 2, 0.18), tb + BEAT)
        # very light rhythm (soft kick on 1, shaker 8ths) except in the 'cakna' break
        if DROP - 1e-6 <= tb < BREAK - 1e-6 or BACK - 1e-6 <= tb < OUTRO - 1e-6:
            place(drumB, softkick(0.45), tb); place(drumB, softkick(0.3), tb + 2 * BEAT)
            for e in range(8):
                place(drumB, shaker(0.09 if e % 2 else 0.06), tb + e * BEAT / 2 + (0.02 if e % 2 else 0))
    tb += BAR
    bar_i += 1


# ------------------------------------------------------------------ effects & bus
def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def simple_verb(x, decay=2.2, mix=0.3):
    n = int(decay * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / decay)
    ir = signal.sosfilt(sos('low', 5000), ir)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(x, ir)[: len(x)]
    return x * (1 - mix) + wet * mix * 0.5


t = np.arange(N) / SR
trem = 0.12 * np.sin(2 * np.pi * 2.4 * t)
keysL = simple_verb(signal.sosfilt(sos('low', 2200), keysL) * (1 + trem), 2.4, 0.32)
keysR = simple_verb(signal.sosfilt(sos('low', 2200), keysR) * (1 - trem), 2.5, 0.32)
padB = simple_verb(signal.sosfilt(sos('high', 120), signal.sosfilt(sos('low', 800), padB)), 3.2, 0.45)
bassB = signal.sosfilt(sos('low', 220), bassB)
drumB = simple_verb(drumB, 1.0, 0.2)
pianoL = simple_verb(signal.sosfilt(sos('low', 4500), plB), 2.8, 0.38)
pianoR = simple_verb(signal.sosfilt(sos('low', 4500), np.roll(plB, int(0.011 * SR))), 2.9, 0.38)


def vol(points):
    ts, gs = zip(*points)
    return np.interp(t, ts, gs)


mL = keysL * 0.7 + padB * 0.5 + bassB * 0.6 + drumB * 0.5 + pianoL * 1.0
mR = keysR * 0.7 + padB * 0.5 + bassB * 0.6 + drumB * 0.5 + pianoR * 1.0
mL = np.tanh(mL * 0.8); mR = np.tanh(mR * 0.8)
# soft from the first frame; drops out on 'Tapi' (record scratch + heartbeat), back on the story
g = vol([(0, 0.0), (0.25, 0.8), (Wt(12) - 0.1, 0.8), (Wt(12) - 0.02, 0.0), (DROP - 0.05, 0.0), (DROP + 0.4, 1.0), (END - 1.4, 1.0), (END, 0.0)])
mL *= g; mR *= g
mix = np.stack([mL, mR], 1)[: int(TOTAL * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.8
w = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
f = wave.open(out_path, 'wb'); f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(w.tobytes()); f.close()
print('soft music ok', TOTAL, 'drop', round(DROP, 2), 'break', round(BREAK, 2), 'back', round(BACK, 2), 'outro', round(OUTRO, 2))
