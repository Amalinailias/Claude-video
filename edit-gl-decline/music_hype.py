"""Original UPBEAT background song (A minor, 122 BPM pop-house): punchy kick, claps, off-beat hats, pumping bass,
syncopated pluck-chord stabs and a catchy pluck lead. Fully synthesised in numpy, so it is safe for IG/TikTok.

Arranged to the edit: muffled build under the hook -> hard stop on 'Tapi' -> reverse swell -> DROP when the story
starts -> build-up on '3 sebab' -> full groove + lead for the 3 reasons -> groove for the takeaway -> breakdown on
'cakna' -> back in for the CTA -> final hit.

usage: python3 music_hype.py <data.js> <meta.json> <out.wav>
"""
import json, sys, wave
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(21)
data = json.loads(open(sys.argv[1]).read().split('=', 1)[1].rstrip().rstrip(';'))
meta = json.load(open(sys.argv[2]))
out_path = sys.argv[3]
TOTAL = meta['total']
T = meta['times']
Wt = lambda i: data['words'][i]['s']

BPM = 122.0
BEAT = 60 / BPM
BAR = 4 * BEAT
DROP = T['hk']
T0 = DROP - 4 * BAR
N = int((TOTAL + 2) * SR)
t = np.arange(N) / SR


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(buf, x, tm, g=1.0):
    s = int(round(tm * SR))
    if s >= len(buf):
        return
    if s < 0:
        x = x[-s:]; s = 0
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s] * g


def snap(tm):
    return T0 + round((tm - T0) / BAR) * BAR


def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output='sos')


# ------------------------------------------------------------------ sounds
def kick():
    tt = np.arange(int(0.42 * SR)) / SR
    f = 44 + 110 * np.exp(-tt * 32)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6.5)
    x += 0.4 * signal.sosfilt(sos('high', 2500), rng.standard_normal(len(tt))) * np.exp(-tt * 300)
    return np.tanh(1.8 * x)


def clap():
    tt = np.arange(int(0.35 * SR)) / SR
    nz = signal.sosfilt(sos('band', [900, 3200]), rng.standard_normal(len(tt)))
    env = np.zeros(len(tt))
    for o in (0.0, 0.011, 0.022):
        env += np.where(tt >= o, np.exp(-(tt - o) * (180 if o < 0.02 else 14)), 0)
    return nz * env * 0.8


def hat(open_=False):
    tt = np.arange(int((0.28 if open_ else 0.05) * SR)) / SR
    nz = signal.sosfilt(sos('high', 7500), rng.standard_normal(len(tt)))
    return nz * np.exp(-tt * (11 if open_ else 80))


def snare():
    tt = np.arange(int(0.22 * SR)) / SR
    nz = signal.sosfilt(sos('band', [1500, 7000]), rng.standard_normal(len(tt))) * np.exp(-tt * 22)
    return nz + 0.4 * np.sin(2 * np.pi * 200 * tt) * np.exp(-tt * 35)


def crash():
    tt = np.arange(int(2.2 * SR)) / SR
    nz = signal.sosfilt(sos('high', 4000), rng.standard_normal(len(tt)))
    return nz * np.minimum(1, tt / 0.003) * np.exp(-tt * 2.2) * 0.6


_cache = {}


def pluck_chord(notes, length=0.34):
    key = ('pc', tuple(notes), length)
    if key not in _cache:
        tt = np.arange(int((length + 0.25) * SR)) / SR
        x = np.zeros(len(tt))
        for m in notes:
            for det in (-0.09, 0.0, 0.09):
                f = mtof(m + det)
                for k in range(1, 22):
                    if f * k > 15000:
                        break
                    x += np.sin(2 * np.pi * f * k * tt + rng.uniform(0, 6.28)) / k * np.exp(-tt * (3 + 2.2 * k))
        env = np.minimum(1, tt / 0.003) * np.clip((length + 0.2 - tt) / 0.2, 0, 1)
        _cache[key] = x * env / (len(notes) * 3)
    return _cache[key]


def lead(m, length):
    key = ('ld', m, round(length, 3))
    if key not in _cache:
        tt = np.arange(int((length + 0.6) * SR)) / SR
        f = mtof(m)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt) * np.clip((tt - 0.12) / 0.2, 0, 1)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        x = (np.sin(ph) + 0.45 * np.sin(2 * ph) * np.exp(-tt * 7) + 0.28 * np.sin(3 * ph) * np.exp(-tt * 10)
             + 0.18 * signal.square(ph, 0.5) * np.exp(-tt * 5))
        env = np.minimum(1, tt / 0.004) * np.exp(-tt * 3.2) * np.clip((length + 0.5 - tt) / 0.5, 0, 1)
        _cache[key] = x * env
    return _cache[key]


def bass_note(m, length):
    key = ('bs', m, round(length, 3))
    if key not in _cache:
        tt = np.arange(int((length + 0.05) * SR)) / SR
        f = mtof(m)
        x = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 9) + 0.3 * np.sin(2 * np.pi * 3 * f * tt) * np.exp(-tt * 14)
        env = np.minimum(1, tt / 0.004) * np.clip((length + 0.04 - tt) / 0.04, 0, 1) * np.exp(-tt * 2.5)
        _cache[key] = np.tanh(1.6 * x * env)
    return _cache[key]


def pad(notes, length):
    tt = np.arange(int((length + 0.8) * SR)) / SR
    x = np.zeros(len(tt))
    for m in notes:
        for det in (-0.1, 0.0, 0.1):
            x += signal.sawtooth(2 * np.pi * mtof(m + det) * tt + rng.uniform(0, 6.28))
    env = np.minimum(1, tt / 0.5) * np.clip((length + 0.7 - tt) / 0.7, 0, 1)
    return signal.sosfilt(sos('low', 1800), x) * env / (len(notes) * 3)


def riser(d):
    tt = np.arange(int(d * SR)) / SR
    nz = rng.standard_normal(len(tt))
    lo = signal.sosfilt(sos('band', [600, 2500]), nz); hi = signal.sosfilt(sos('band', [3000, 11000]), nz)
    k = (tt / d)
    x = lo * (1 - k) + hi * k
    tone = signal.sawtooth(2 * np.pi * np.cumsum(220 * 2 ** (2 * k)) / SR) * 0.15
    return (x * 0.5 + tone) * k ** 2


def reverse_swell(d):
    return crash()[: int(d * SR)][::-1] * 1.2


# ------------------------------------------------------------------ arrangement
# the beat grid is re-anchored at the drops so they land exactly on the edit: story (DROP), 'First' (R1), CTA
TAPI = Wt(12) - 0.02
R1 = Wt(41) - 0.02
CTA = T['cta'][0]
OUTRO = T['end']
ANCH = [T0, R1, CTA, TOTAL + 2 * BAR]
S3 = T['s3'][0]; K2 = T['k2'][0]
CH = [  # (bass midi, stab voicing)  Am - F - C - G
    (45, [57, 60, 64, 69]),
    (41, [57, 60, 65, 69]),
    (48, [55, 60, 64, 67]),
    (43, [55, 59, 62, 67]),
]
MEL = [  # per bar: (beat, midi, length beats)
    [(0, 76, 0.75), (1, 81, 0.75), (2, 79, 0.5), (2.5, 76, 0.75), (3.5, 74, 0.5)],
    [(0, 72, 0.75), (1, 76, 0.75), (2, 74, 0.5), (2.5, 72, 0.75), (3.5, 69, 0.5)],
    [(0, 76, 0.75), (1, 79, 0.75), (2, 84, 0.75), (3, 79, 0.5), (3.5, 76, 0.5)],
    [(0, 74, 0.75), (1, 71, 0.75), (2, 74, 0.75), (3, 79, 1.0)],
]
STAB = [0, 0.75, 1.5, 2.5, 3.25]

drums = np.zeros(N); bassb = np.zeros(N); stabs = np.zeros(N); leadb = np.zeros(N); padb = np.zeros(N); fxb = np.zeros(N)
K, CL, HC, HO, SN = kick(), clap(), hat(), hat(True), snare()

for si in range(len(ANCH) - 1):
    a, end = ANCH[si], ANCH[si + 1]
    P_ = lambda buf, x, tm, g=1.0: place(buf, x, tm, g) if tm < end - 0.01 else None
    tb, bi = a, 0
    while tb < end - 0.01:
        bass_m, voic = CH[bi % 4]
        hook = tb < DROP - 1e-6
        build = si == 0 and tb + BAR > S3 - BEAT          # last bars before 'First': snare roll build-up
        reasons = si == 1 and tb < T['k1'][0] - 1e-6
        brk = si == 1 and K2 - BEAT <= tb
        full = not hook and not brk
        for b in range(4):
            bt = tb + b * BEAT
            if not brk or b == 0:
                P_(drums, K, bt, 0.95 if full else 0.7)
            if full and b in (1, 3) and not (build and bt >= S3):
                P_(drums, CL, bt, 0.55)
            if full or hook:
                P_(drums, HO if full else HC, bt + BEAT / 2, 0.22 if full else 0.15)
            if full:
                for s16 in (0.25, 0.75):
                    P_(drums, HC, bt + s16 * BEAT, 0.08)
            if not hook or tb >= DROP - BAR - 1e-6:
                P_(bassb, bass_note(bass_m - 12 if b == 0 else bass_m, BEAT * 0.42), bt + (0 if b == 0 else BEAT / 2), 0.9 if not brk else 0.4)
                if b == 0:
                    P_(bassb, bass_note(bass_m, BEAT * 0.42), bt + BEAT / 2, 0.9 if not brk else 0.4)
        for sb in STAB:
            P_(stabs, pluck_chord(voic), tb + sb * BEAT, 0.9 if not hook else 0.6)
        if (reasons and not brk) or si == 2:
            for bb, m, ln in MEL[bi % 4]:
                P_(leadb, lead(m, ln * BEAT), tb + bb * BEAT, 0.5)
        if brk or hook:
            P_(padb, pad(voic, BAR), tb, 0.8)
        tb += BAR
        bi += 1

# '3 sebab' build: accelerating snare roll + riser from the '3' card to 'First'
nroll = 0
tm = S3
while tm < R1 - 0.03:
    k = (tm - S3) / max(0.5, R1 - S3)
    place(drums, SN, tm, 0.2 + 0.45 * k)
    tm += BEAT / (2 if k < 0.45 else 4 if k < 0.8 else 8)
place(fxb, riser(R1 - S3), S3, 0.8)
place(fxb, riser(1.2), CTA - 1.2, 0.5)
for tm in (DROP, R1, T['k1'][0], CTA):
    place(fxb, crash(), tm, 0.8)
pre = np.zeros(N)                                            # riser + reverse swell into the drop (not cut by the stop)
dr = min(1.6, DROP - TAPI)
place(pre, riser(dr), DROP - dr, 0.5); place(pre, reverse_swell(0.9), DROP - 0.9, 0.7)

# ------------------------------------------------------------------ bus: sidechain pump, filters, glue
anc = np.array(ANCH[:-1]); ai = np.clip(np.searchsorted(anc, t, side='right') - 1, 0, len(anc) - 1)
ph = ((t - anc[ai]) % BEAT)
pump = 1 - 0.6 * np.exp(-ph / 0.07)


def verb(x, decay=1.4, mix=0.2):
    n = int(decay * SR)
    tt = np.arange(n) / SR
    ir = signal.sosfilt(sos('low', 6000), rng.standard_normal(n)) * np.exp(-6.9 * tt / decay)
    ir /= np.sqrt(np.sum(ir ** 2))
    return x * (1 - mix) + signal.fftconvolve(x, ir)[: len(x)] * mix * 0.6


stabs = verb(signal.sosfilt(sos('high', 200), stabs), 1.2, 0.25)
d8 = int(BEAT * 0.75 * SR)
leadL = leadb.copy(); leadR = leadb.copy()
leadR[d8:] += 0.4 * leadb[:-d8]; leadL[2 * d8:] += 0.25 * leadb[:-2 * d8]
leadL = verb(signal.sosfilt(sos('low', 7000), leadL), 1.6, 0.25); leadR = verb(signal.sosfilt(sos('low', 7000), leadR), 1.7, 0.25)
padb = verb(padb, 2.4, 0.35)
bassb = signal.sosfilt(sos('low', 900), bassb)
drums = verb(drums, 0.8, 0.12)

mono = drums * 0.85 + bassb * pump * 0.75 + stabs * pump * 0.6 + padb * pump * 0.4 + fxb * 0.45
L = mono + leadL * 0.42; R = mono + leadR * 0.42

# hook: muffled (low-pass opening up), music stops dead on 'Tapi', reverse swell + riser into the drop
lo_L = signal.sosfilt(sos('low', 700), L); lo_R = signal.sosfilt(sos('low', 700), R)
mx = np.clip(t / max(0.1, TAPI), 0, 1) ** 2 * 0.55
L = np.where(t < DROP, lo_L * (1 - mx) + L * mx, L); R = np.where(t < DROP, lo_R * (1 - mx) + R * mx, R)
g = np.interp(t, [0, 0.2, TAPI - 0.05, TAPI, DROP - 1.6, DROP - 0.001, DROP, TOTAL - 1.2, TOTAL],
              [0, 0.65, 0.75, 0, 0, 0, 1, 1, 0])
L = L * g + pre * 0.45; R = R * g + pre * 0.45
L = np.tanh(L * 1.1); R = np.tanh(R * 1.1)
mix = np.stack([L, R], 1)[: int(TOTAL * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.85
w = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
f = wave.open(out_path, 'wb'); f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(w.tobytes()); f.close()
print('hype music ok', round(TOTAL, 2), 'drop', round(DROP, 2), '3sebab', round(S3, 2), 'First', round(R1, 2), 'break', round(K2, 2), 'cta', round(CTA, 2))
