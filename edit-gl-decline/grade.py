"""Cinematic-but-bright grade (numpy/OpenCV): neutral WB, lifted mids, teal-orange split, soft highlight glow, light vignette."""
import numpy as np, cv2

def _curve(x, pts):
    xs, ys = zip(*pts)
    return np.interp(x, xs, ys)

class Grade:
    def __init__(self, w, h, wb=(1.0, 1.0, 1.0), lift=0.6, glow=0.22, vig=0.22, sat=1.10, teal=0.035, warm=0.03,
                 hi=0.84, skin=(1.0, 1.0), red=(1.0, 1.0)):
        x = np.linspace(0, 1, 256)
        base = _curve(x, [(0, 0.03), (0.25, 0.29 + (lift - 0.6) * 0.8), (0.5, lift), (0.75, hi), (1, 0.99)])
        lum = 0.5 * (1 - np.cos(np.pi * x))                       # weight shadows→highlights
        # per-channel LUTs (BGR): teal in shadows, warm in highlights, applied after WB
        self.lut = np.zeros((3, 256), np.float32)
        for c, (g, sh, hi) in enumerate([(wb[0], +teal, -warm), (wb[1], +teal * 0.25, +warm * 0.15), (wb[2], -teal, +warm)]):
            y = np.clip(base * g + sh * (1 - lum) * 0.6 + hi * lum * 0.6, 0, 1)
            self.lut[c] = y * 255
        self.lut = self.lut.astype(np.uint8)
        self.glow, self.sat, self.skin, self.red = glow, sat, skin, red
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = ((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h / 2) / (h * 0.68)) ** 2
        self.vig = (1 - vig * np.clip(r, 0, 1.4) ** 1.3)[..., None].astype(np.float32)

    def __call__(self, img):
        out = np.empty_like(img)
        for c in range(3):
            out[:, :, c] = cv2.LUT(img[:, :, c], self.lut[c])
        if self.sat != 1 or self.skin != (1.0, 1.0) or self.red != (1.0, 1.0):
            hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
            H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
            S *= self.sat
            # skin tones (orange hues, moderate saturation): brighter and a touch less yellow
            if self.skin != (1.0, 1.0):
                hw = np.clip(1 - np.abs(H - 14) / 9, 0, 1)
                sw = np.clip((S - 25) / 30, 0, 1) * np.clip((200 - S) / 40, 0, 1)
                vw = np.clip((V - 60) / 50, 0, 1)
                k = cv2.GaussianBlur(hw * sw * vw, (0, 0), 3)
                V *= 1 + (self.skin[0] - 1) * k
                S *= 1 + (self.skin[1] - 1) * k
            # strong reds (the hijab): more saturated and brighter
            if self.red != (1.0, 1.0):
                d = np.minimum(H, 180 - H)
                hr = np.clip(1 - d / 16, 0, 1)
                sr = np.clip((S - 90) / 50, 0, 1)
                k = cv2.GaussianBlur(hr * sr, (0, 0), 2)
                S *= 1 + (self.red[0] - 1) * k
                V *= 1 + (self.red[1] - 1) * k
                # pull magenta-leaning reds back to a pure red
                H[:] = np.where(H > 90, np.minimum(179.4, H + 3.0 * k), H)
            hsv = np.dstack([H, np.clip(S, 0, 255), np.clip(V, 0, 255)]).astype(np.uint8)
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


class RefGrade(Grade):
    """Look matched to the user's reference frame: highlight glow → per-channel LUT (fitted to the reference) → vivid red / clean skin."""
    def __init__(self, w, h, lut_path, glow=0.24, sat=1.06, skin=(1.04, 0.92), red=(1.32, 1.06)):
        super().__init__(w, h, glow=0.0, vig=0.0, sat=sat, skin=skin, red=red)
        self.lut = np.load(lut_path).astype(np.uint8)
        self.glow_amt = glow

    def __call__(self, img):
        f = img.astype(np.float32) * (1 / 255)
        h, w = f.shape[:2]
        sm = cv2.resize(f, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
        hi = cv2.GaussianBlur(np.clip((sm - 0.55) / 0.45, 0, 1), (0, 0), 9)
        g = cv2.resize(hi, (w, h), interpolation=cv2.INTER_LINEAR)
        img = np.clip((1 - (1 - f) * (1 - self.glow_amt * g)) * 255, 0, 255).astype(np.uint8)
        self.glow = 0.0
        return super().__call__(img)
