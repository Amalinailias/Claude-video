"""Video 6 compositor: reframed + RefGraded footage, crash/stamp shakes + RGB glitch in the hook, PiP proof deck, frosted cards, motion layer.

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
FPS, OUTW, OUTH, DECW, DECH = 30, 1080, 1920, 1080, 1920
TARGET = (540.0, 880.0)
PS_TARGET = (600.0, 1000.0)          # hook: her face lower-right, stat card top-left
N = int(math.ceil(TOTAL * FPS))
if os.environ.get('LIMIT'):
    N = min(N, int(float(os.environ['LIMIT']) * FPS))
START = float(os.environ.get('START', '0'))
N0 = int(round(START * FPS))
from grade import RefGrade  # noqa
GR = RefGrade(OUTW, OUTH, os.path.join(HERE, 'grade_ref_lut.npy'), red=(1.3, 1.6))   # matched to the user's reference frame
if os.environ.get('NOGRADE'):          # client already graded the footage (e.g. DJI export): keep her look as-is
    GR = lambda img: img
# HDR passthrough: read the ORIGINAL HLG/BT.2020 file, keep its code values untouched (no tone-mapping, no grade),
# convert only the SDR graphics into HLG (SDR white -> 75% HLG = 203 nit reference white, BT.2408), encode HEVC Main10 HLG.
HDR_SRC = os.environ.get('HDR_SRC')
HDR = bool(HDR_SRC)
if HDR:
    GR = lambda img: img
WHITE = 0.75 if HDR else 255.0
_LIN = ((np.arange(256) / 255.0) ** 2.4).astype(np.float32)
_M = np.array([[0.6274, 0.3293, 0.0433], [0.0691, 0.9195, 0.0114], [0.0164, 0.0880, 0.8956]], np.float32)   # 709 -> 2020 (RGB)
_YW = np.array([0.2627, 0.6780, 0.0593], np.float32)


def sdr2hlg(bgr):
    """8-bit sRGB/BT.709 graphics (BGR) -> HLG BT.2020 signal in [0,1] (BGR), display-referred mapping per BT.2408"""
    rgb = _LIN[bgr][..., ::-1] @ _M.T
    fd = np.clip(rgb, 0, None) * np.float32(0.203)
    yd = fd @ _YW
    e = np.clip(fd * np.power(np.maximum(yd, 1e-6), np.float32(-1 / 6))[..., None], 0, 1)
    out = np.where(e <= 1 / 12, np.sqrt(3 * e), 0.17883277 * np.log(np.maximum(12 * e - 0.28466892, 1e-6)) + 0.55991073)
    return np.ascontiguousarray(out[..., ::-1], dtype=np.float32)


_HDR_VF = 'fps=30,zscale=matrixin=2020_ncl:rangein=limited:range=full,format=gbrp16le,format=bgr48le'
WD = lambda i: data['words'][i]['s']
BUMPS = [tuple(b) for b in T['bumps']]
PIPS = [(T['pip'], 0.27, (850.0, 445.0))]   # (window, scale, centre): story proof deck
SHAKES = [tuple(x) for x in T['shakes']]     # (t, amplitude px, duration)
GLITCH = [tuple(x) for x in T['glitch']]     # (t, duration)
_rr = {}


def rounded_mask(w, h, r):
    key = (w, h, r)
    if key not in _rr:
        m = np.zeros((h, w), np.uint8)
        cv2.rectangle(m, (r, 0), (w - r, h), 255, -1); cv2.rectangle(m, (0, r), (w, h - r), 255, -1)
        for cx, cy in [(r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)]:
            cv2.circle(m, (cx, cy), r, 255, -1, lineType=cv2.LINE_AA)
        _rr[key] = cv2.GaussianBlur(m, (3, 3), 0).astype(np.float32)[..., None] / 255
    return _rr[key]


def pip(frame, bg, t, PIP, PIP_S, PIP_C):
    """shrink the video into a rounded card over the infographic background"""
    a = P0(t, PIP[0], 0.5); b = P0(t, PIP[1] - 0.5, 0.5)
    p = sm(a) * (1 - sm(b))
    if p <= 0.001:
        return frame
    s = 1 - (1 - PIP_S) * p
    cx, cy = 540 + (PIP_C[0] - 540) * p, 960 + (PIP_C[1] - 960) * p
    w, h = max(2, int(OUTW * s)), max(2, int(OUTH * s))
    small = cv2.resize(frame, (w, h), interpolation=cv2.INTER_AREA)
    canvas = (bg.astype(np.float32) * p + cv2.GaussianBlur(frame, (0, 0), 20).astype(np.float32) * (1 - p)) if bg is not None else frame.astype(np.float32)
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    r = int(70 * p) + 2
    m = rounded_mask(w, h, r)
    # soft drop shadow
    sh = np.zeros((OUTH, OUTW), np.float32)
    sx0, sy0 = max(0, x0 + 10), max(0, y0 + 26)
    sh[sy0:min(OUTH, sy0 + h), sx0:min(OUTW, sx0 + w)] = m[:min(OUTH, sy0 + h) - sy0, :min(OUTW, sx0 + w) - sx0, 0]
    sh = cv2.GaussianBlur(sh, (0, 0), 28)[..., None] * 0.35 * p
    canvas = canvas * (1 - sh)
    ys, ye, xs, xe = max(0, y0), min(OUTH, y0 + h), max(0, x0), min(OUTW, x0 + w)
    mm = m[ys - y0:ye - y0, xs - x0:xe - x0]
    canvas[ys:ye, xs:xe] = small[ys - y0:ye - y0, xs - x0:xe - x0].astype(np.float32) * mm + canvas[ys:ye, xs:xe] * (1 - mm)
    # thin white border
    edge = cv2.morphologyEx((m[..., 0] > 0.5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((7, 7), np.uint8)).astype(np.float32)[..., None] * p
    canvas[ys:ye, xs:xe] = canvas[ys:ye, xs:xe] * (1 - edge[ys - y0:ye - y0, xs - x0:xe - x0]) + WHITE * edge[ys - y0:ye - y0, xs - x0:xe - x0]
    return np.clip(canvas, 0, 1).astype(np.float32) if HDR else np.clip(canvas, 0, 255).astype(np.uint8)


def P0(t, a, d):
    return min(1.0, max(0.0, (t - a) / d))


def sm(x):
    return x * x * (3 - 2 * x)


def bump(t):
    z = 1.0
    for bp in BUMPS:
        tb, s = bp[0], bp[1]
        x = t - tb
        if len(bp) > 2 and bp[2] == 'g':          # smooth: gaussian zoom centred on the cut (hides the jump, no punch)
            if abs(x) < 0.6:
                z += s * math.exp(-(x / 0.16) ** 2)
        elif 0 <= x < 2.5:
            z += s * (1 - math.exp(-x * 22)) * math.exp(-x * 3.2)
    return z


def shake(t):
    dx = dy = 0.0
    for t0, amp, dur in SHAKES:
        x = t - t0
        if 0 <= x <= dur:
            a = amp * math.exp(-x * 4.5 / dur)
            dx += a * math.sin(x * 57); dy += a * math.cos(x * 43)
    return dx, dy


def glitch(frame, t, n):
    for t0, dur in GLITCH:
        x = t - t0
        if 0 <= x < dur:
            k = 1 - x / dur
            d = int(round(16 * k))
            if d:
                frame = frame.copy()
                frame[:, d:, 0] = frame[:, :-d, 0].copy()      # blue right
                frame[:, :-d, 2] = frame[:, d:, 2].copy()      # red left
            rs = np.random.default_rng(n)
            for _ in range(4):                                  # displaced slices
                y0 = int(rs.uniform(200, OUTH - 300)); h = int(rs.uniform(30, 120)); sx = int(rs.uniform(-40, 40) * k)
                if sx:
                    frame[y0:y0 + h] = np.roll(frame[y0:y0 + h], sx, axis=1)
    return frame


def frame_at(img, z, face, target):
    a = z * OUTW / DECW
    M = np.float32([[a, 0, target[0] - z * face[0]], [0, a, target[1] - z * face[1]]])
    return cv2.warpAffine(img, M, (OUTW, OUTH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


class SegReader:
    def __init__(self, seg):
        dur = seg['src_out'] - seg['src_in'] + 0.2
        src = HDR_SRC if HDR else os.path.join(work, f"p{seg['clip']}.mov")
        sp = seg.get('speed', 1.0)
        pre = f'setpts=(PTS-STARTPTS)/{sp},' if sp != 1.0 else ''
        vf = ['-vf', pre + _HDR_VF] if HDR else (['-vf', pre + 'fps=30'] if pre else [])
        self.bpp = 6 if HDR else 3
        self.p = subprocess.Popen(['ffmpeg', '-v', 'quiet', '-ss', f"{seg['src_in']:.3f}", '-i', src, '-t', f'{dur:.3f}', *vf,
                                   '-f', 'rawvideo', '-pix_fmt', 'bgr48le' if HDR else 'bgr24', '-'], stdout=subprocess.PIPE)
        self.k, self.frame = -1, None

    def get(self, k):
        while self.k < k:
            buf = self.p.stdout.read(DECW * DECH * self.bpp)
            if len(buf) < DECW * DECH * self.bpp:
                break
            if HDR:
                self.frame = np.frombuffer(buf, np.uint16).reshape(DECH, DECW, 3).astype(np.float32) * np.float32(1 / 65535)
            else:
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
    if HDR:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', HDR_SRC, '-vf', _HDR_VF, '-frames:v', '1',
                              '-f', 'rawvideo', '-pix_fmt', 'bgr48le', '-'], capture_output=True).stdout
        return np.frombuffer(raw, np.uint16).reshape(DECH, DECW, 3).astype(np.float32) * np.float32(1 / 65535)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', os.path.join(work, f'p{clip}.mov'), '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(DECH, DECW, 3)


last = segs[-1]
end_still = grab(last['clip'], last['src_out'] - 0.04)
vf = 'scale=720:1280:flags=lanczos,' if preview else ''
venc = ['-preset', 'medium', '-crf', '22'] if preview else ['-preset', 'slow', '-crf', '16']
if HDR:
    zs = 'zscale=w=720:h=1280:f=spline36:' if preview else 'zscale='
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr48le', '-s', f'{OUTW}x{OUTH}', '-r', str(FPS), '-i', '-',
                            '-ss', f'{START:.3f}', '-i', audio, '-vf', zs + 'matrix=2020_ncl:range=limited,format=yuv420p10le',
                            '-c:v', 'libx265', '-preset', 'medium', '-crf', '22' if preview else '17', '-profile:v', 'main10', '-tag:v', 'hvc1',
                            '-x265-params', 'colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error',
                            '-colorspace', 'bt2020nc', '-color_primaries', 'bt2020', '-color_trc', 'arib-std-b67', '-color_range', 'tv',
                            '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
else:
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OUTW}x{OUTH}', '-r', str(FPS), '-i', '-',
                        '-ss', f'{START:.3f}', '-i', audio, '-vf', vf + 'format=yuv420p', '-c:v', 'libx264', *venc, '-profile:v', 'high',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                        '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
pool = ThreadPoolExecutor(4)
rd = lambda d, n: cv2.imread(os.path.join(d, f'f_{n:05d}.png'), cv2.IMREAD_UNCHANGED) if d else None
load = lambda n: (rd(ovl, n), rd(MASKDIR, n), rd(BEHIND, n))
pending = {n: pool.submit(load, n) for n in range(N0, min(N, N0 + 12))}
reader, rseg = None, None
for n in range(N0, N):
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
        target = TARGET
    dx, dy = shake(t)
    frame = glitch(GR(frame_at(base, z * bump(t), face, (target[0] + dx, target[1] + dy))), t, n)
    if t >= last['out_out']:
        k = int(min(41, 3 + (t - last['out_out']) * 40)) | 1
        frame = cv2.GaussianBlur(frame, (k, k), 0)
    o, mk, bh = pending.pop(n).result()
    if n + 12 < N:
        pending[n + 12] = pool.submit(load, n + 12)
    for win, ps, pc in PIPS:
        if win[0] <= t <= win[1]:
            bgc = (bh[:, :, :3] if bh.shape[2] == 4 else bh) if (bh is not None and bh.ndim == 3) else None
            if HDR and bgc is not None:
                bgc = sdr2hlg(np.ascontiguousarray(bgc))
            frame = pip(frame, bgc, t, win, ps, pc)
    if mk is not None and mk.ndim == 3 and mk.shape[2] == 4 and mk[:, :, 3].any():
        m = mk[:, :, 3]
        rows = np.flatnonzero(m.any(axis=1)); r0, r1 = rows[0], rows[-1] + 1
        small = cv2.GaussianBlur(cv2.resize(frame, (OUTW // 4, OUTH // 4), interpolation=cv2.INTER_AREA), (0, 0), 6)
        up = cv2.resize(small, (OUTW, OUTH), interpolation=cv2.INTER_LINEAR)[r0:r1].astype(np.float32) * 0.78
        mf = m[r0:r1, :, None].astype(np.float32) * (1 / 255)
        frame[r0:r1] = np.clip(up * mf + frame[r0:r1].astype(np.float32) * (1 - mf), 0, WHITE / 0.75 if HDR else 255).astype(frame.dtype)
    if o is not None and o.ndim == 3 and o.shape[2] == 3:
        o = cv2.cvtColor(o, cv2.COLOR_BGR2BGRA)
    if o is not None and o[:, :, 3].any():
        rows = np.flatnonzero(o[:, :, 3].any(axis=1))
        brk = np.flatnonzero(np.diff(rows) > 1)
        for r0, r1 in zip(np.r_[rows[0], rows[brk + 1]], np.r_[rows[brk], rows[-1]] + 1):
            ov = o[r0:r1]; af = ov[:, :, 3:4].astype(np.float32) * (1 / 255)
            if HDR:
                frame[r0:r1] = sdr2hlg(np.ascontiguousarray(ov[:, :, :3])) * af + frame[r0:r1] * (1 - af)
            else:
                frame[r0:r1] = (ov[:, :, :3].astype(np.float32) * af + frame[r0:r1].astype(np.float32) * (1 - af) + 0.5).astype(np.uint8)
    if HDR:
        frame = (np.clip(frame, 0, 1) * 65535 + 0.5).astype(np.uint16)
    enc.stdin.write(np.ascontiguousarray(frame).tobytes())
    if n % 300 == 0:
        print(f'{n}/{N}', flush=True)
if reader:
    reader.close()
enc.stdin.close(); enc.wait()
print('done', out)
