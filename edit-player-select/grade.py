"""Cinematic-but-bright grade (numpy/OpenCV): neutral WB, lifted mids, teal-orange split, soft highlight glow, light vignette."""
import numpy as np, cv2

def _curve(x, pts):
    xs, ys = zip(*pts)
    return np.interp(x, xs, ys)

class Grade:
    def __init__(self, w, h, wb=(1.0, 1.0, 1.0), lift=0.6, glow=0.22, vig=0.22, sat=1.10, teal=0.035, warm=0.03):
        x = np.linspace(0, 1, 256)
        base = _curve(x, [(0, 0.03), (0.25, 0.29 + (lift - 0.6) * 0.4), (0.5, lift), (0.75, 0.84), (1, 0.985)])
        lum = 0.5 * (1 - np.cos(np.pi * x))                       # weight shadows→highlights
        # per-channel LUTs (BGR): teal in shadows, warm in highlights, applied after WB
        self.lut = np.zeros((3, 256), np.float32)
        for c, (g, sh, hi) in enumerate([(wb[0], +teal, -warm), (wb[1], +teal * 0.25, +warm * 0.15), (wb[2], -teal, +warm)]):
            y = np.clip(base * g + sh * (1 - lum) * 0.6 + hi * lum * 0.6, 0, 1)
            self.lut[c] = y * 255
        self.lut = self.lut.astype(np.uint8)
        self.glow, self.sat = glow, sat
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = ((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h / 2) / (h * 0.68)) ** 2
        self.vig = (1 - vig * np.clip(r, 0, 1.4) ** 1.3)[..., None].astype(np.float32)

    def __call__(self, img):
        out = np.empty_like(img)
        for c in range(3):
            out[:, :, c] = cv2.LUT(img[:, :, c], self.lut[c])
        if self.sat != 1:
            hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = cv2.convertScaleAbs(hsv[:, :, 1], alpha=self.sat)
            out = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        f = out.astype(np.float32) * (1 / 255)
        if self.glow:
            h, w = f.shape[:2]
            sm = cv2.resize(f, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
            hi = np.clip((sm - 0.55) / 0.45, 0, 1)
            hi = cv2.GaussianBlur(hi, (0, 0), 9)
            g = cv2.resize(hi, (w, h), interpolation=cv2.INTER_LINEAR)
            f = 1 - (1 - f) * (1 - self.glow * g)                 # screen
        f = f * self.vig
        return np.clip(f * 255 + 0.5, 0, 255).astype(np.uint8)
