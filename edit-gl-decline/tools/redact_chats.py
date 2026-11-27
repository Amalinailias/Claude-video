import sys, numpy as np, cv2
SRC, OUT = sys.argv[1], sys.argv[2]
def mosaic(img, x0, y0, x1, y1, block=16, round_=False):
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(img.shape[1], x1), min(img.shape[0], y1)
    roi = img[y0:y1, x0:x1]
    h, w = roi.shape[:2]
    small = cv2.resize(roi, (max(1, w // block), max(1, h // block)), interpolation=cv2.INTER_AREA)
    m = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
    m = cv2.GaussianBlur(m, (0, 0), block * 0.45)
    if round_:
        mask = np.zeros((h, w), np.uint8); cv2.ellipse(mask, (w // 2, h // 2), (w // 2, h // 2), 0, 0, 360, 255, -1)
        mask = cv2.GaussianBlur(mask, (5, 5), 0)[..., None] / 255.0
        img[y0:y1, x0:x1] = (m * mask + roi * (1 - mask)).astype(np.uint8)
    else:
        img[y0:y1, x0:x1] = m

img = cv2.imread(SRC + '/x1.png')
P = 8
for (x0, y0, x1, y1), rnd, blk in [
    ((200, 182, 337, 318), True, 22),          # client profile photo
    ((350, 215, 800, 285), False, 18),          # client name (header)
    ((455, 1648, 975, 1708), False, 16),        # client + sibling name (quote)
    ((751 - P, 1833 - P, 1026 + P, 1880 + P), False, 16),   # hospital
    ((405 - P, 2028 - P, 680 + P, 2075 + P), False, 16),    # hospital
    ((50, 1316, 762, 1458), False, 18),         # papers under the x-ray (name, barcode, phone)
    ((265, 1218, 430, 1250), False, 10),        # date stamp on the monitor
    ((240, 2330, 900, 2420), False, 18),        # hospital name in the half-hidden last message
]:
    mosaic(img, x0, y0, x1, y1, blk, rnd)
cv2.imwrite(sys.argv[3] + '/x1_red.png', img)
# card A: x-ray + 'Dislocate' bubble (paper strip removed), card B: hospital / GL-not-approved exchange
xa = np.vstack([img[505:1235, 30:790], img[1455:1572, 30:790]])
cv2.imwrite(OUT + '/xa.jpg', xa, [cv2.IMWRITE_JPEG_QUALITY, 92])
cv2.imwrite(OUT + '/xb.jpg', img[1600:2310, 0:1206], [cv2.IMWRITE_JPEG_QUALITY, 92])
print('ok', xa.shape, img[1600:2310].shape)
