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

P = 8  # padding
HEADER = [((200, 182, 337, 318), True, 22), ((350, 215, 800, 285), False, 18)]   # profile photo, client name
R = {
 's1.png': HEADER + [((232 - P, 1567 - P, 644 + P, 1606 + P), False, 16),       # hospital name
                     ((655 - P, 1762 - P, 869 + P, 1801 + P), False, 16),       # child's name
                     ((233 - P, 2175 - P, 401 + P, 2204 + P), False, 14)],      # child's name in the quote
 's2.png': HEADER + [((520, 340, 970, 392), False, 16),                         # quoted client name
                     ((985, 338, 1150, 496), False, 18),                        # document thumbnail
                     ((696 - P, 888 - P, 863 + P, 927 + P), False, 16),         # hospital name
                     ((401 - P, 1565 - P, 571 + P, 1604 + P), False, 16),       # hospital name
                     ((1058 - P, 1565 - P, 1118 + P, 1604 + P), False, 14)],    # company name
 's3.jpg': [],
 's4.png': HEADER + [((372, 712, 822, 772), False, 16),                         # quoted client name
                     ((985, 680, 1150, 990), False, 20)],                       # Guarantee Letter thumbnail
}
# the agent's own name (Naja / najaa) — hidden too, at her request
ME = {
 's1.png': [(89, 529, 182, 576)],
 's2.png': [(474, 888, 587, 935), (217, 1083, 304, 1130)],
 's3.jpg': [(419, 482, 533, 529), (338, 938, 464, 985)],
 's4.png': [(89, 421, 222, 468), (430, 797, 536, 833), (650, 1379, 764, 1426), (567, 2057, 692, 2104)],
}
for k, v in ME.items():
    R[k] = R[k] + [((x0 - 6, y0 - 6, x1 + 6, y1 + 6), False, 14) for x0, y0, x1, y1 in v]
for name, boxes in R.items():
    img = cv2.imread(f'{SRC}/{name}')
    for (x0, y0, x1, y1), rnd, blk in boxes:
        mosaic(img, x0, y0, x1, y1, blk, rnd)
    cv2.imwrite(f"{OUT}/{name.split('.')[0]}_red.png", img)
print('ok')
