"""Video 5 compositor: reframed + graded footage, PLAYER-SELECT cut-out hook, HUD panels with frosted blur, motion layer.

usage: python3 compose.py <work> <ovl> <audio.wav> <out.mp4> [--preview] --mask <dir> --behind <dir>
env: SEG_MODEL=<selfie_multiclass.tflite>  LIMIT=<seconds>
"""
import json, math, os, subprocess, sys
import numpy as np, cv2
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grade import Grade  # noqa

work, ovl, audio, out = sys.argv[1:5]
arg = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None
MASKDIR, BEHIND = arg('--mask'), arg('--behind')
preview = '--preview' in sys.argv
data = json.loads(open(os.path.join(HERE, 'gfx/data.js')).read().split('=', 1)[1].rstrip().rstrip(';'))
meta = json.load(open(os.path.join(ovl, 'meta.json')))
segs, TOTAL, PS_END = data['segments'], data['total'], data['psEnd']
T = meta['times']
FPS, OUTW, OUTH, DECW, DECH = 30, 1080, 1920, 1620, 2880
TARGET = (540.0, 880.0)
PS_TARGET = (600.0, 1000.0)          # hook: her face lower-right, stat card top-left
N = int(math.ceil(TOTAL * FPS))
if os.environ.get('LIMIT'):
    N = min(N, int(float(os.environ['LIMIT']) * FPS))
GR = Grade(OUTW, OUTH, wb=(0.965, 0.975, 1.06), lift=0.62, glow=0.2, vig=0.2, sat=1.1, teal=0.03, warm=0.03)
BUMPS = [(PS_END, 0.06), (T['f1'][1] - 0.05, 0.05), (T['t2'][0], 0.04), (T['t3'][0], 0.04), (T['f2'][1] - 0.05, 0.05), (T['s1'][0], 0.04)]


def bump(t):
    z = 1.0
    for tb, s in BUMPS:
        x = t - tb
        if 0 <= x < 2.5:
            z += s * (1 - math.exp(-x * 22)) * math.exp(-x * 3.2)
    return z


def frame_at(img, z, face, target):
    a = z * OUTW / DECW
    M = np.float32([[a, 0, target[0] - z * face[0]], [0, a, target[1] - z * face[1]]])
    return cv2.warpAffine(img, M, (OUTW, OUTH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


class SegReader:
    def __init__(self, seg):
        dur = seg['src_out'] - seg['src_in'] + 0.2
        src = os.path.join(work, f"p{seg['clip']}.mov")
        self.p = subprocess.Popen(['ffmpeg', '-v', 'quiet', '-ss', f"{seg['src_in']:.3f}", '-i', src, '-t', f'{dur:.3f}',
                                   '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
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


_seg, _prev = None, {'m': None, 'n': -9}


def person_mask(img, n):
    global _seg
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    if _seg is None:
        opts = vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path=os.environ['SEG_MODEL']), output_confidence_masks=True)
        _seg = vision.ImageSegmenter.create_from_options(opts)
    res = _seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img[:, :, ::-1])))
    m = 1.0 - np.squeeze(res.confidence_masks[0].numpy_view()).astype(np.float32)
    if _prev['m'] is not None and n - _prev['n'] == 1:
        m = 0.6 * m + 0.4 * _prev['m']
    _prev['m'], _prev['n'] = m, n
    k, lab, st, _ = cv2.connectedComponentsWithStats((m > 0.5).astype(np.uint8))
    if k > 1:
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        m = m * cv2.dilate((lab == big).astype(np.uint8), np.ones((21, 21), np.uint8)).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), 1.4)


def player_select(frame, bg, n, t):
    """her cut-out over the HUD background, with a white stroke and a cyan glow (like a game character select)"""
    pm = person_mask(frame, n)
    hard = (pm > 0.5).astype(np.uint8)
    ring = cv2.dilate(hard, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))).astype(np.float32)
    glow = cv2.GaussianBlur(cv2.dilate(hard, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))).astype(np.float32), (0, 0), 16)
    p = pm[..., None]
    comp = bg.astype(np.float32)
    g = np.clip(glow - ring, 0, 1)[..., None] * (0.85 + 0.15 * math.sin(t * 6))
    comp = comp + g * np.array([255, 214, 111], np.float32) * 0.9          # cyan glow (BGR)
    r = np.clip(ring - pm, 0, 1)[..., None]
    comp = comp * (1 - r) + 255 * r                                          # white stroke
    comp = comp * (1 - p) + frame.astype(np.float32) * p
    return np.clip(comp, 0, 255).astype(np.uint8)


def grab(clip, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', os.path.join(work, f'p{clip}.mov'), '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(DECH, DECW, 3)


last = segs[-1]
end_still = grab(last['clip'], last['src_out'] - 0.04)
vf = 'scale=720:1280:flags=lanczos,' if preview else ''
venc = ['-preset', 'medium', '-crf', '22'] if preview else ['-preset', 'slow', '-crf', '16']
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OUTW}x{OUTH}', '-r', str(FPS), '-i', '-',
                        '-i', audio, '-vf', vf + 'format=yuv420p', '-c:v', 'libx264', *venc, '-profile:v', 'high',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                        '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
pool = ThreadPoolExecutor(4)
rd = lambda d, n: cv2.imread(os.path.join(d, f'f_{n:05d}.png'), cv2.IMREAD_UNCHANGED) if d else None
load = lambda n: (rd(ovl, n), rd(MASKDIR, n), rd(BEHIND, n))
pending = {n: pool.submit(load, n) for n in range(min(N, 12))}
reader, rseg = None, None
for n in range(N):
    t = n / FPS
    if t >= last['out_out']:
        x = t - last['out_out']
        base, z, face, target = end_still, last['zoom'] * 1.025 + 0.02 * x, last['face'], TARGET
    else:
        sg = next(s for s in segs if s['out_in'] - 1e-6 <= t < s['out_out'])
        if rseg is not sg:
            if reader:
                reader.close()
            reader, rseg = SegReader(sg), sg
        base = reader.get(int(round((t - sg['out_in']) * FPS)))
        prog = (t - sg['out_in']) / max(0.01, sg['out_out'] - sg['out_in'])
        z, face = sg['zoom'] * (1 + 0.025 * prog), sg['face']
        target = PS_TARGET if sg.get('ps') else TARGET
    frame = GR(frame_at(base, z * bump(t), face, target))
    if t >= last['out_out']:
        k = int(min(41, 3 + (t - last['out_out']) * 40)) | 1
        frame = cv2.GaussianBlur(frame, (k, k), 0)
    o, mk, bh = pending.pop(n).result()
    if n + 12 < N:
        pending[n + 12] = pool.submit(load, n + 12)
    if bh is not None and bh.ndim == 3 and t < PS_END + 0.02:
        bgc = bh[:, :, :3] if bh.shape[2] == 4 else bh
        frame = player_select(frame, bgc, n, t)
    if mk is not None and mk.ndim == 3 and mk.shape[2] == 4 and mk[:, :, 3].any():
        m = mk[:, :, 3]
        rows = np.flatnonzero(m.any(axis=1)); r0, r1 = rows[0], rows[-1] + 1
        small = cv2.GaussianBlur(cv2.resize(frame, (OUTW // 4, OUTH // 4), interpolation=cv2.INTER_AREA), (0, 0), 6)
        up = cv2.resize(small, (OUTW, OUTH), interpolation=cv2.INTER_LINEAR)[r0:r1].astype(np.float32) * 0.78
        mf = m[r0:r1, :, None].astype(np.float32) * (1 / 255)
        frame[r0:r1] = np.clip(up * mf + frame[r0:r1].astype(np.float32) * (1 - mf), 0, 255).astype(np.uint8)
    if o is not None and o.ndim == 3 and o.shape[2] == 3:
        o = cv2.cvtColor(o, cv2.COLOR_BGR2BGRA)
    if o is not None and o[:, :, 3].any():
        rows = np.flatnonzero(o[:, :, 3].any(axis=1))
        brk = np.flatnonzero(np.diff(rows) > 1)
        for r0, r1 in zip(np.r_[rows[0], rows[brk + 1]], np.r_[rows[brk], rows[-1]] + 1):
            ov = o[r0:r1]; af = ov[:, :, 3:4].astype(np.float32) * (1 / 255)
            frame[r0:r1] = (ov[:, :, :3].astype(np.float32) * af + frame[r0:r1].astype(np.float32) * (1 - af) + 0.5).astype(np.uint8)
    enc.stdin.write(np.ascontiguousarray(frame).tobytes())
    if n % 300 == 0:
        print(f'{n}/{N}', flush=True)
if reader:
    reader.close()
enc.stdin.close(); enc.wait()
print('done', out)
