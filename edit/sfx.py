"""Procedurally synthesised, royalty-free SFX library (48 kHz stereo float32)."""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def stereo(x, pan=0.0):
    # equal-power pan, pan in [-1, 1]; pan may be an array
    a = (np.asarray(pan) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def reverb(x, decay=1.2, mix=0.25, predelay=0.012, bright=6000):
    """Simple stereo noise-convolution reverb."""
    n = int(decay * SR)
    tt = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-6.9 * tt / decay)
        sos = signal.butter(2, bright, 'low', fs=SR, output='sos')
        ir = signal.sosfilt(sos, ir)
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        src = x[:, ch] if x.ndim == 2 else x
        wet = signal.fftconvolve(src, ir)[: len(src) + len(ir)]
        out.append(wet)
    wet = np.stack(out, axis=1)
    dry = x if x.ndim == 2 else stereo(x)
    dry = np.pad(dry, ((0, len(wet) - len(dry)), (0, 0)))
    return dry * (1 - mix) + wet * mix * 0.6


def band_sweep_noise(d, f0, f1, bw=0.5, curve=None):
    """Noise through a band-pass whose centre moves from f0 to f1 (STFT masking)."""
    n = int(d * SR)
    x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024, noverlap=768)
    p = np.clip(tt / d, 0, 1)
    if curve is not None:
        p = curve(p)
    fc = f0 * (f1 / f0) ** p  # log sweep
    lf = np.log(np.maximum(f, 1))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log(fc)[None, :]) / bw) ** 2)
    _, y = signal.istft(Z * mask, fs=SR, nperseg=1024, noverlap=768)
    y = y[:n]
    return np.pad(y, (0, n - len(y)))


def env_ar(d, attack, release_shape=3.0, peak_at=None):
    tt = t_axis(d)
    pk = peak_at if peak_at is not None else attack
    up = np.clip(tt / max(pk, 1e-4), 0, 1) ** 2
    down = np.exp(-release_shape * np.clip(tt - pk, 0, None) / max(d - pk, 1e-4))
    e = np.where(tt < pk, up, down)
    return e


# ---------------------------------------------------------------- library
def whoosh(d=0.6, f0=300, f1=4500, pan_from=-0.6, pan_to=0.6, peak=0.62):
    x = band_sweep_noise(d, f0, f1, bw=0.55)
    e = env_ar(d, 0, release_shape=5, peak_at=d * peak)
    x = norm(x * e)
    pan = np.linspace(pan_from, pan_to, len(x))
    return reverb(stereo(x, pan), decay=0.6, mix=0.18)


def whoosh_down(d=0.5):
    return whoosh(d, 5000, 250, 0.5, -0.5, peak=0.35)


def riser(d=2.0, f0=200, f1=6000):
    tt = t_axis(d)
    noise = band_sweep_noise(d, f0, f1, bw=0.45, curve=lambda p: p ** 1.6)
    # rising detuned saw chord
    base = 110 * (2 ** (2.0 * (tt / d) ** 1.5))
    tone = np.zeros_like(tt)
    for det, g in [(1.0, 1), (1.005, .8), (1.5, .5), (2.0, .4), (0.995, .8)]:
        ph = 2 * np.pi * np.cumsum(base * det) / SR
        tone += g * signal.sawtooth(ph)
    sos = signal.butter(2, 3000, 'low', fs=SR, output='sos')
    tone = signal.sosfilt(sos, tone)
    e = (tt / d) ** 2.2
    x = norm(noise) * 0.7 + norm(tone) * 0.35
    x = x * e
    # tiny fade at end to avoid click
    x[-200:] *= np.linspace(1, 0, 200)
    return reverb(stereo(norm(x)), decay=1.0, mix=0.25)


def impact(d=1.8, f0=70, f1=32, punch=1.0):
    tt = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6)
    click = rng.standard_normal(len(tt)) * np.exp(-tt * 60)
    sos = signal.butter(2, 2500, 'low', fs=SR, output='sos')
    click = signal.sosfilt(sos, click)
    body = band_sweep_noise(d, 900, 120, bw=0.6) * np.exp(-tt * 7)
    x = norm(sub) * 1.0 + norm(click) * 0.55 * punch + norm(body) * 0.35
    x = np.tanh(x * 1.6)
    return reverb(stereo(norm(x)), decay=2.2, mix=0.22, bright=3500)


def sub_drop(d=1.2):
    tt = t_axis(d)
    f = 30 + 90 * np.exp(-tt * 4)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3) * np.clip(tt / 0.01, 0, 1)
    return stereo(norm(np.tanh(x * 1.4)))


def pop(f0=1100, f1=520, d=0.12):
    tt = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-tt * 45)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38) * np.clip(tt / 0.002, 0, 1)
    x += 0.15 * rng.standard_normal(len(tt)) * np.exp(-tt * 400)
    return reverb(stereo(norm(x)), decay=0.35, mix=0.15)


def blip(freqs=(1318.5, 1975.5), d=0.16, gap=0.055):
    out = np.zeros(int((d + gap * len(freqs)) * SR))
    for i, fr in enumerate(freqs):
        tt = t_axis(d)
        x = (np.sin(2 * np.pi * fr * tt) + 0.25 * np.sin(2 * np.pi * fr * 2 * tt)) * np.exp(-tt * 30) * np.clip(tt / 0.002, 0, 1)
        s = int(i * gap * SR)
        out[s:s + len(x)] += x
    return reverb(stereo(norm(out)), decay=0.5, mix=0.2)


def tick(d=0.03, f=3200):
    tt = t_axis(d)
    x = rng.standard_normal(len(tt)) * np.exp(-tt * 220)
    sos = signal.butter(2, [f * 0.6, f * 1.6], 'band', fs=SR, output='sos')
    x = signal.sosfilt(sos, x) + 0.4 * np.sin(2 * np.pi * f * 1.3 * tt) * np.exp(-tt * 300)
    return stereo(norm(x))


def counter_ticks(d=1.1, n=26, accel=0.45):
    out = np.zeros((int((d + 0.05) * SR), 2))
    times = d * (np.linspace(0, 1, n) ** accel)
    for i, tm in enumerate(times):
        tk = tick(f=2600 + 900 * (i / n)) * (0.55 + 0.45 * i / n)
        s = int(tm * SR)
        out[s:s + len(tk)] += tk[: len(out) - s]
    return out


def clink(d=0.9, base=2350):
    tt = t_axis(d)
    ratios = [1, 1.34, 2.01, 2.63, 3.9]
    out = np.zeros(len(tt))
    for k, off in enumerate([0, 0.07]):
        s = int(off * SR)
        for i, r in enumerate(ratios):
            amp = 1 / (i + 1) * (0.8 if k else 1)
            seg = np.sin(2 * np.pi * base * r * (1 + 0.01 * k) * tt) * np.exp(-tt * (9 + 4 * i)) * amp
            out[s:] += seg[: len(out) - s]
    out *= np.clip(tt / 0.001, 0, 1)
    return reverb(stereo(norm(out), 0.15), decay=0.8, mix=0.25)


def shimmer(d=1.6, root=1046.5):
    tt = t_axis(d)
    notes = [1, 1.25, 1.5, 2.0, 2.5]
    out = np.zeros(len(tt))
    for i, r in enumerate(notes):
        s = int(i * 0.045 * SR)
        e = np.exp(-tt * 3.2)
        seg = (np.sin(2 * np.pi * root * r * tt) + 0.3 * np.sin(2 * np.pi * root * r * 2.01 * tt)) * e
        out[s:] += seg[: len(out) - s] * (0.9 - i * 0.1)
    air = band_sweep_noise(d, 6000, 11000, bw=0.3) * np.exp(-tt * 3) * 0.15
    x = norm(out) + air
    return reverb(stereo(norm(x)), decay=2.0, mix=0.4, bright=9000)


def ding(d=1.2):
    tt = t_axis(d)
    x = np.zeros(len(tt))
    for fr, off, g in [(1318.5, 0, 1), (1975.5, 0.09, 0.9)]:
        s = int(off * SR)
        seg = (np.sin(2 * np.pi * fr * tt) + 0.2 * np.sin(2 * np.pi * fr * 3 * tt)) * np.exp(-tt * 5) * g
        x[s:] += seg[: len(x) - s]
    return reverb(stereo(norm(x)), decay=1.2, mix=0.3)


def swipe(d=0.22):
    x = band_sweep_noise(d, 1800, 9000, bw=0.4)
    e = env_ar(d, 0, 6, peak_at=d * 0.3)
    return stereo(norm(x * e), np.linspace(-0.4, 0.4, int(d * SR)))


def glitch(d=0.32):
    n = int(d * SR)
    x = np.zeros(n)
    pos = 0
    while pos < n:
        L = int(rng.uniform(0.008, 0.03) * SR)
        kind = rng.integers(3)
        tt = np.arange(L) / SR
        if kind == 0:
            seg = signal.square(2 * np.pi * rng.uniform(200, 1800) * tt) * 0.5
        elif kind == 1:
            seg = np.round(rng.standard_normal(L) * 3) / 3 * 0.6
        else:
            seg = np.zeros(L)
        x[pos:pos + L] = seg[: n - pos]
        pos += L
    x *= np.exp(-np.arange(n) / SR * 6)
    sos = signal.butter(2, 7000, 'low', fs=SR, output='sos')
    return stereo(norm(signal.sosfilt(sos, x)), rng.uniform(-0.3, 0.3))


def shutter(d=0.35):
    tt = t_axis(d)
    c1 = rng.standard_normal(len(tt)) * np.exp(-tt * 90)
    c2 = np.roll(c1, int(0.06 * SR)) * 0.6
    sos = signal.butter(2, [1500, 9000], 'band', fs=SR, output='sos')
    x = signal.sosfilt(sos, c1 + c2)
    return reverb(stereo(norm(x)), decay=0.4, mix=0.2)


def pad(d=4.4, chord=(174.61, 220.0, 261.63, 329.63)):
    """Soft cinematic pad (Fmaj7) used under the hook."""
    tt = t_axis(d)
    x = np.zeros(len(tt))
    for fr in chord:
        for det in (0.997, 1.0, 1.003):
            x += signal.sawtooth(2 * np.pi * fr * det * tt + rng.uniform(0, 6))
    sos = signal.butter(2, 1400, 'low', fs=SR, output='sos')
    x = signal.sosfilt(sos, x)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * tt)
    e = np.clip(tt / 0.6, 0, 1) * np.clip((d - tt) / 0.5, 0, 1)
    return reverb(stereo(norm(x * lfo * e)), decay=2.5, mix=0.45)


def heartbeat(d=0.9):
    tt = t_axis(d)
    x = np.zeros(len(tt))
    for off, g in [(0, 1), (0.22, 0.7)]:
        s = int(off * SR)
        L = len(tt) - s
        t2 = tt[:L]
        x[s:] += np.sin(2 * np.pi * (45 + 40 * np.exp(-t2 * 30)) * t2) * np.exp(-t2 * 14) * g
    return stereo(norm(np.tanh(2 * x)))


def tap(d=0.08):
    tt = t_axis(d)
    x = np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 120) + 0.5 * rng.standard_normal(len(tt)) * np.exp(-tt * 500)
    return stereo(norm(x))


LIB = {
    'whoosh': lambda: whoosh(0.55),
    'whoosh_long': lambda: whoosh(0.9, 200, 6000),
    'whoosh_down': whoosh_down,
    'riser': lambda: riser(2.0),
    'riser_short': lambda: riser(1.1, 400, 7000),
    'impact': impact,
    'impact_soft': lambda: impact(1.4, 60, 34, punch=0.4),
    'sub_drop': sub_drop,
    'pop': pop,
    'pop_lo': lambda: pop(700, 330),
    'blip': blip,
    'blip3': lambda: blip((1046.5, 1318.5, 1568.0)),
    'tick': tick,
    'counter': counter_ticks,
    'clink': clink,
    'shimmer': shimmer,
    'ding': ding,
    'swipe': swipe,
    'glitch': glitch,
    'shutter': shutter,
    'pad': pad,
    'heartbeat': heartbeat,
    'tap': tap,
}


def render_cues(cues, total):
    """cues: list of (time, name, gain_db). Returns stereo mix."""
    out = np.zeros((int((total + 3) * SR), 2))
    cache = {}
    for tm, name, gdb in cues:
        if name not in cache:
            cache[name] = LIB[name]()
        x = cache[name] * (10 ** (gdb / 20))
        s = int(tm * SR)
        if s < 0:
            x = x[-s:]
            s = 0
        e = min(len(out), s + len(x))
        out[s:e] += x[: e - s]
    return out[: int(total * SR)]


if __name__ == '__main__':
    import sys, soundfile  # noqa
