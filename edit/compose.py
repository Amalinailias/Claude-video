"""Composites the cut talking-head footage (with punch-in zooms) and the rendered motion layer.

usage: python3 compose.py <work_dir> <overlay_dir> <audio.wav> <out.mp4> [--preview]
"""
import json, math, os, subprocess, sys
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
work, ovl, audio, out = sys.argv[1:5]
preview = '--preview' in sys.argv
UHD = '--4k' in sys.argv
SC = 2 if UHD else 1
FPS = 30
Wd, Hd = 1080 * SC, 1920 * SC
FACE = {1: (480 * SC, 880 * SC), 2: (510 * SC, 970 * SC)}
SRC = 'p{}_4k.mov' if UHD else 'p{}.mov'

data = json.loads(open(os.path.join(HERE, 'gfx/data.js')).read().split('=', 1)[1].rstrip().rstrip(';'))
meta = json.load(open(os.path.join(ovl, 'meta.json')))
segs = data['segments']
HOOK, TOTAL, ENDS = data['hook'], data['total'], data['endStart']
T = meta['times']
N = int(math.ceil(TOTAL * FPS))

# punch-in accents (time, strength)
BUMPS = [(T['c5'][0], 0.05), (T['c6'][0], 0.05), (T['c7'][0], 0.05)]
W = lambda i: data['words'][i]['s']
BUMPS += [(W(65) - 0.06, 0.06), (W(56), 0.04)]


def bump(t):
    z = 1.0
    for tb, s in BUMPS:
        x = t - tb
        if 0 <= x < 2.5:
            z += s * (1 - math.exp(-x * 22)) * math.exp(-x * 3.2)
    return z


def warp(img, z, cx, cy):
    if abs(z - 1) < 1e-4:
        return img
    M = np.float32([[z, 0, cx * (1 - z)], [0, z, cy * (1 - z)]])
    return cv2.warpAffine(img, M, (Wd, Hd), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


class SegReader:
    def __init__(self, seg):
        self.seg = seg
        dur = seg['src_out'] - seg['src_in'] + 0.2
        src = os.path.join(work, SRC.format(seg['clip']))
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f"{seg['src_in']:.3f}", '-i', src, '-t', f'{dur:.3f}',
                                   '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
        self.k = -1
        self.frame = None

    def get(self, k):
        while self.k < k:
            buf = self.p.stdout.read(Wd * Hd * 3)
            if len(buf) < Wd * Hd * 3:
                break
            self.frame = np.frombuffer(buf, np.uint8).reshape(Hd, Wd, 3)
            self.k += 1
        return self.frame

    def close(self):
        self.p.stdout.close()
        self.p.wait()


def grab(clip, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', os.path.join(work, SRC.format(clip)), '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(Hd, Wd, 3)


hook_still = grab(segs[0]['clip'], segs[0]['src_in'])
last = segs[-1]
end_still = grab(last['clip'], last['src_out'] - 0.04)

vf = 'scale=720:1280:flags=lanczos,' if preview else ''
venc = ['-preset', 'medium', '-crf', '22'] if preview else (['-preset', 'medium', '-crf', '18', '-level:v', '5.1', '-maxrate', '45M', '-bufsize', '90M'] if UHD else ['-preset', 'slow', '-crf', '16'])
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{Wd}x{Hd}', '-r', str(FPS), '-i', '-',
                        '-i', audio, '-vf', vf + 'format=yuv420p', '-c:v', 'libx264', *venc, '-profile:v', 'high',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                        '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
from concurrent.futures import ThreadPoolExecutor
pool = ThreadPoolExecutor(4)
def load_ovl(n):
    return cv2.imread(os.path.join(ovl, f'f_{n:05d}.png'), cv2.IMREAD_UNCHANGED)
pending = {n: pool.submit(load_ovl, n) for n in range(min(N, 12))}

reader, rseg = None, None
for n in range(N):
    t = n / FPS
    if t < HOOK:
        base = hook_still
        z, (cx, cy) = 1.0, FACE[segs[0]['clip']]
    elif t >= last['out_out']:
        x = t - last['out_out']
        z, (cx, cy) = last['zoom'] * (1 + 0.025) + 0.02 * x, FACE[last['clip']]
        base = end_still
        k = int(min(41 * SC, 3 + x * 40 * SC)) | 1
        base = cv2.GaussianBlur(base, (k, k), 0)
    else:
        sg = next(s for s in segs if s['out_in'] - 1e-6 <= t < s['out_out'])
        if rseg is not sg:
            if reader:
                reader.close()
            reader, rseg = SegReader(sg), sg
        k = int(round((t - sg['out_in']) * FPS))
        base = reader.get(k)
        prog = (t - sg['out_in']) / max(0.01, sg['out_out'] - sg['out_in'])
        z = sg['zoom'] * (1 + 0.025 * prog)
        cx, cy = FACE[sg['clip']]
    frame = warp(base, z * bump(t), cx, cy)
    o = pending.pop(n).result()
    if n + 12 < N:
        pending[n + 12] = pool.submit(load_ovl, n + 12)
    if o is not None and o.shape[2] == 4:
        rows = np.flatnonzero(o[:, :, 3].any(axis=1))
        if len(rows):
            frame = frame.copy()
            # composite only contiguous runs of rows that carry graphics
            breaks = np.flatnonzero(np.diff(rows) > 1)
            starts = np.r_[rows[0], rows[breaks + 1]]
            ends = np.r_[rows[breaks], rows[-1]] + 1
            for r0, r1 in zip(starts, ends):
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
