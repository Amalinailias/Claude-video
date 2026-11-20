"""Composites the cut footage (re-framed punch-in zooms from the 4K source) with the motion layer.

usage: python3 compose.py <work_dir> <overlay_dir> <audio.wav> <out.mp4> [--preview|--4k]
       python3 compose.py <work_dir> --hookbg <out.jpg>
"""
import json, math, os, subprocess, sys
import numpy as np, cv2
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
work = sys.argv[1]
data = json.loads(open(os.path.join(HERE, 'gfx/data.js')).read().split('=', 1)[1].rstrip().rstrip(';'))
segs = data['segments']
HOOK, TOTAL = data['hook'], data['total']
HSEGS = data['hookSegs']
BW_END = data['bwEnd']
FPS = 30
SRC = os.path.join(work, 'p4k.mov')          # 2160x3840, 30 fps
FACE = (503.0, 870.0)                        # face centre in 1080x1920 design space
TARGET = (540.0, 960.0)                      # where the face sits after re-framing
W = lambda i: data['words'][i]['s']

mode_4k = '--4k' in sys.argv
preview = '--preview' in sys.argv
OUTW, OUTH = (2160, 3840) if mode_4k else (1080, 1920)
DECW, DECH = (2160, 3840) if mode_4k else (1620, 2880)   # decode size (keeps warps >= ~0.75x)


def matrix(z):
    """design-space transform D' = z (D - FACE) + TARGET, mapped from decode px to output px."""
    a = z * OUTW / DECW
    k = OUTW / 1080.0
    bx = k * (TARGET[0] - z * FACE[0])
    by = k * (TARGET[1] - z * FACE[1])
    return np.float32([[a, 0, bx], [0, a, by]])


def frame_at(img, z):
    return cv2.warpAffine(img, matrix(z), (OUTW, OUTH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def grab(t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', SRC, '-frames:v', '1', '-vf', f'scale={DECW}:{DECH}:flags=lanczos',
                          '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(DECH, DECW, 3)


if sys.argv[2] == '--hookbg':
    OUTW, OUTH, DECW, DECH = 1080, 1920, 1620, 2880
    cv2.imwrite(sys.argv[3], frame_at(grab(segs[0]['src_in']), segs[0]['zoom']), [cv2.IMWRITE_JPEG_QUALITY, 92])
    sys.exit(0)

ovl, audio, out = sys.argv[2:5]
MASKDIR = sys.argv[sys.argv.index('--mask') + 1] if '--mask' in sys.argv else None
meta = json.load(open(os.path.join(ovl, 'meta.json')))
T = meta['times']
N = int(math.ceil(TOTAL * FPS))
if os.environ.get("LIMIT"): N = min(N, int(float(os.environ["LIMIT"]) * FPS))
yy, xx = np.mgrid[0:OUTH, 0:OUTW].astype(np.float32)
VIG = (1 - 0.55 * (((xx - OUTW / 2) / (OUTW * 0.62)) ** 2 + ((yy - OUTH / 2) / (OUTH * 0.62)) ** 2)).clip(0.35, 1)
del yy, xx
BUMPS = [(BW_END, 0.07), (T['cD'][0], 0.04), (T['cG'][0], 0.04), (W(70), 0.05), (W(83), 0.04), (T['cI'][0], 0.04)]


def bump(t):
    z = 1.0
    for tb, s in BUMPS:
        x = t - tb
        if 0 <= x < 2.5:
            z += s * (1 - math.exp(-x * 22)) * math.exp(-x * 3.2)
    return z


def film_bw(img, n):
    """high-contrast black & white with grain, vignette and projector flicker"""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    g = np.clip((g - 0.5) * 1.25 + 0.5, 0, 1)
    g = g * g * (3 - 2 * g)  # soft S-curve
    r = np.random.default_rng(n)
    flick = 1 + 0.035 * np.sin(n * 2.3) + 0.02 * r.standard_normal()
    gs = r.standard_normal((OUTH // 3, OUTW // 3)).astype(np.float32)
    grain = cv2.resize(gs, (OUTW, OUTH), interpolation=cv2.INTER_LINEAR) * 0.05
    g = (g * flick + grain) * VIG
    g = np.clip(g, 0, 1)
    return cv2.cvtColor((g * 255).astype(np.uint8), cv2.COLOR_GRAY2BGR)


class SegReader:
    def __init__(self, seg):
        dur = seg['src_out'] - seg['src_in'] + 0.2
        self.p = subprocess.Popen(['ffmpeg', '-v', 'quiet', '-ss', f"{seg['src_in']:.3f}", '-i', SRC, '-t', f'{dur:.3f}',
                                   '-vf', f'scale={DECW}:{DECH}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                                  stdout=subprocess.PIPE)
        self.k, self.frame = -1, None

    def get(self, k):
        while self.k < k:
            buf = self.p.stdout.read(DECW * DECH * 3)
            if len(buf) < DECW * DECH * 3:
                break
            self.frame = np.frombuffer(buf, np.uint8).reshape(DECH, DECW, 3)
            self.k += 1
        return self.frame

    def close(self):
        self.p.stdout.close(); self.p.wait()


last = segs[-1]
end_still = grab(last['src_out'] - 0.04)

vf = 'scale=720:1280:flags=lanczos,' if preview else ''
venc = ['-preset', 'medium', '-crf', '22'] if preview else (
    ['-preset', 'medium', '-crf', '18', '-level:v', '5.1', '-maxrate', '45M', '-bufsize', '90M'] if mode_4k else ['-preset', 'slow', '-crf', '16'])
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OUTW}x{OUTH}', '-r', str(FPS), '-i', '-',
                        '-i', audio, '-vf', vf + 'format=yuv420p', '-c:v', 'libx264', *venc, '-profile:v', 'high',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                        '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
pool = ThreadPoolExecutor(4)
load_ovl = lambda n: (cv2.imread(os.path.join(ovl, f'f_{n:05d}.png'), cv2.IMREAD_UNCHANGED),
                      cv2.imread(os.path.join(MASKDIR, f'f_{n:05d}.png'), cv2.IMREAD_UNCHANGED) if MASKDIR else None)
pending = {n: pool.submit(load_ovl, n) for n in range(min(N, 12))}

reader, rseg = None, None
for n in range(N):
    t = n / FPS
    if t < HOOK:
        sg = next(s for s in HSEGS if s['out_in'] - 1e-6 <= t < s['out_out'] + 1e-6)
        if rseg is not sg:
            if reader:
                reader.close()
            reader, rseg = SegReader(sg), sg
        base = reader.get(int(round((t - sg['out_in']) * FPS)))
        z = sg['zoom'] * (1 + 0.03 * (t - sg['out_in']) / max(0.01, sg['out_out'] - sg['out_in']))
    elif t >= last['out_out']:
        x = t - last['out_out']
        base, z = end_still, last['zoom'] * 1.025 + 0.02 * x
        k = int(min(41 * OUTW / 1080, 3 + x * 40 * OUTW / 1080)) | 1
        base = cv2.GaussianBlur(base, (k, k), 0)
    else:
        sg = next(s for s in segs if s['out_in'] - 1e-6 <= t < s['out_out'])
        if rseg is not sg:
            if reader:
                reader.close()
            reader, rseg = SegReader(sg), sg
        base = reader.get(int(round((t - sg['out_in']) * FPS)))
        prog = (t - sg['out_in']) / max(0.01, sg['out_out'] - sg['out_in'])
        z = sg['zoom'] * (1 + 0.025 * prog)
    frame = frame_at(base, z * bump(t))
    if t < BW_END:
        frame = film_bw(frame, n)
    o, mk = pending.pop(n).result()
    if mk is not None and mk.shape[2] == 4 and mk[:, :, 3].any():
        # frosted glass: blur the footage behind every glass panel
        m = mk[:, :, 3]
        if m.shape[1] != OUTW:
            m = cv2.resize(m, (OUTW, OUTH), interpolation=cv2.INTER_LINEAR)
        rows = np.flatnonzero(m.any(axis=1))
        r0, r1 = rows[0], rows[-1] + 1
        small = cv2.resize(frame, (OUTW // 4, OUTH // 4), interpolation=cv2.INTER_AREA)
        small = cv2.GaussianBlur(small, (0, 0), 6)
        up = cv2.resize(small, (OUTW, OUTH), interpolation=cv2.INTER_LINEAR)[r0:r1].astype(np.float32)
        up = up * 1.03 + 6
        mf = m[r0:r1, :, None].astype(np.float32) * (1 / 255)
        frame[r0:r1] = np.clip(up * mf + frame[r0:r1].astype(np.float32) * (1 - mf), 0, 255).astype(np.uint8)
    if n + 12 < N:
        pending[n + 12] = pool.submit(load_ovl, n + 12)
    if o is not None and o.shape[2] == 4:
        rows = np.flatnonzero(o[:, :, 3].any(axis=1))
        if len(rows):
            breaks = np.flatnonzero(np.diff(rows) > 1)
            for r0, r1 in zip(np.r_[rows[0], rows[breaks + 1]], np.r_[rows[breaks], rows[-1]] + 1):
                ov = o[r0:r1]
                af = ov[:, :, 3:4].astype(np.float32) * (1 / 255)
                frame[r0:r1] = (ov[:, :, :3].astype(np.float32) * af + frame[r0:r1].astype(np.float32) * (1 - af) + 0.5).astype(np.uint8)
    enc.stdin.write(np.ascontiguousarray(frame).tobytes())
    if n % 300 == 0:
        print(f'{n}/{N}', flush=True)
if reader:
    reader.close()
enc.stdin.close()
enc.wait()
print('done', out)
