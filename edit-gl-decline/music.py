"""Original soft lo-fi underscore (D major, 86 BPM): Rhodes-style keys, warm pad, round bass,
brushed lo-fi drums and a gentle pluck arpeggio. Arranged to the edit's timeline.

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

BPM = 104.0
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


# ------------------------------------------------------------------ sequencing
keysL = np.zeros(N); keysR = np.zeros(N)
padB = np.zeros(N); bassB = np.zeros(N); drumB = np.zeros(N); plB = np.zeros(N)

bar_i = 0
tb = T0
while tb < END:
    bass_m, notes = PROG[bar_i % 4]
    final = tb >= OUTRO - BAR * 0.5
    if final:
        bass_m, notes = FINAL
    # keys: chord on 1 (rolled), soft re-strike on "and of 2"
    for k, m in enumerate(notes):
        hum = rng.normal(0, 0.006)
        v = 0.42 + rng.uniform(-0.05, 0.05)
        x = rhodes(m, BAR * (2.0 if final else 0.95), v)
        place(keysL, x, tb + 0.012 * k + hum)
        place(keysR, x, tb + 0.012 * k + hum + 0.008)
    if tb >= DROP - 1e-6 and not final:
        for k, m in enumerate(notes[1:3]):
            x = rhodes(m + 12, BEAT * 0.8, 0.22)
            place(keysL, x, tb + 1.5 * BEAT + 0.02 * k); place(keysR, x, tb + 1.5 * BEAT + 0.02 * k + 0.006)
    # pad
    place(padB, pad_chord([n - 12 if n > 60 else n for n in notes[:3]] + [notes[-1]], BAR * (2.2 if final else 1.0)), tb)
    # bass (from the drop)
    if tb >= DROP - 1e-6:
        if final:
            place(bassB, bass(bass_m - 12, BAR * 1.5, 0.75), tb)
        else:
            place(bassB, bass(bass_m - 12, BEAT * 2.4, 0.8), tb)
            place(bassB, bass(bass_m - 12 + (7 if bar_i % 2 else 12), BEAT * 1.2, 0.55), tb + 2.5 * BEAT)
    # drums: from the drop until the CTA breakdown
    if (DROP - 1e-6 <= tb < BREAK - 1e-6) or (BACK - 1e-6 <= tb < OUTRO - 1e-6):
        sw = BEAT / 2 * 0.06  # light swing
        for b4 in range(4):
            place(drumB, kick(0.85 if b4 % 2 == 0 else 0.7), tb + b4 * BEAT)   # four-on-the-floor
        place(drumB, snare(0.42), tb + BEAT)
        place(drumB, snare(0.45), tb + 3 * BEAT)
        for e in range(8):
            off = sw if e % 2 else 0
            place(drumB, hat(0.22 if e % 2 else 0.3), tb + e * BEAT / 2 + off)
        if tb >= LIFT - 1e-6:
            for e in range(16):
                if e % 2:
                    place(drumB, hat(0.12), tb + e * BEAT / 4 + sw * 0.5)
            place(drumB, hat(0.16, True), tb + 3.5 * BEAT + sw)
    # pluck arpeggio in the "steps" section
    if LIFT - 1e-6 <= tb < OUTRO - 1e-6:
        arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 24]
        for e, m in enumerate(arp):
            off = BEAT / 2 * 0.17 if e % 2 else 0
            v = 0.16 + 0.05 * (e == 0)
            x = pluck(m, v)
            pan = 0.35 if e % 2 else -0.35
            place(plB, x, tb + e * BEAT / 2 + off)
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


# Rhodes: tremolo auto-pan, warm low-pass, reverb
t = np.arange(N) / SR
trem = 0.18 * np.sin(2 * np.pi * 3.2 * t)
keysL = signal.sosfilt(sos('low', 2600), keysL) * (1 + trem)
keysR = signal.sosfilt(sos('low', 2600), keysR) * (1 - trem)
keysL = simple_verb(keysL, 2.0, 0.28); keysR = simple_verb(keysR, 2.1, 0.28)
padB = signal.sosfilt(sos('low', 900), padB); padB = signal.sosfilt(sos('high', 120), padB)
padB = simple_verb(padB, 3.0, 0.4)
bassB = signal.sosfilt(sos('low', 260), bassB)
drumB = simple_verb(signal.sosfilt(sos('low', 9000), drumB), 0.9, 0.15)
# pluck: ping-pong-ish delay
plL = plB.copy(); plR = np.zeros(N)
d = int(BEAT * 0.75 * SR)
plR[d:] += 0.5 * plB[:-d]; plL[2 * d:] += 0.25 * plB[:-2 * d]
plL = simple_verb(signal.sosfilt(sos('low', 5000), plL), 2.5, 0.35)
plR = simple_verb(signal.sosfilt(sos('low', 5000), plR), 2.6, 0.35)

# intro: everything low-passed, opening up into the drop
def automation_lp(x, f_lo, f_hi, t_start, t_end):
    """crossfade between a heavily filtered and the dry signal."""
    lo = signal.sosfilt(sos('low', f_lo), x)
    mixc = np.clip((t - t_start) / max(1e-3, t_end - t_start), 0, 1) ** 2
    return lo * (1 - mixc) + x * mixc


def vol(points):
    """piecewise-linear volume automation from [(time, gain)]"""
    ts, gs = zip(*points)
    return np.interp(t, ts, gs)


mL = keysL * 0.9 + padB * 0.55 + bassB * 0.75 + drumB * 0.7 + plL * 0.6
mR = keysR * 0.9 + padB * 0.55 + bassB * 0.75 + drumB * 0.7 + plR * 0.6
mL = automation_lp(mL, 500, 0, 0.0, DROP)
mR = automation_lp(mR, 500, 0, 0.0, DROP)
# gentle tape saturation + glue
mL = np.tanh(mL * 0.9); mR = np.tanh(mR * 0.9)
g = vol([(0, 0.0), (0.3, 0.5), (Wt(12) - 0.1, 0.5), (Wt(12) - 0.02, 0.0), (DROP - 0.05, 0.0), (DROP, 1.0), (END - 1.4, 1.0), (END, 0.0)])  # music cuts on 'Tapi' (scratch), drops into the story
mL *= g; mR *= g
mix = np.stack([mL, mR], 1)[: int(TOTAL * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.8
w = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
f = wave.open(out_path, 'wb'); f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(w.tobytes()); f.close()
print('music ok', TOTAL, 'drop', round(DROP, 2), 'lift', round(LIFT, 2), 'break', round(BREAK, 2), 'outro', round(OUTRO, 2))
