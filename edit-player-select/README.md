# Suntingan video 5: 3 Tips Medical Card (hook PLAYER SELECT, <60s)

- **Hook Player Select**: `render.js ... behind` render latar HUD (`.behindonly`). `compose.py` potong orang keluar guna MediaPipe (`SEG_MODEL=`), letak atas latar tu, dan tambah garisan putih + glow cyan.
- **Tema HUD game**: font VT323 + Plus Jakarta Sans, panel biru bercahaya (blur di belakang guna mask pass), bunyi 8-bit dalam `sfx.py`.
- **Grading sinematik terang**: `grade.py` (white balance neutral, mid-tone dicerahkan, teal-oren, glow highlight, vignette).
- Kad skrin penuh LEVEL 01 / PENTING! menutup momen kamera dialih.

```
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav
SEG_MODEL=models/selfie_multiclass.tflite python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
`work/` perlu ada `p1.mov` & `p2.mov` (1620x2880, 30fps), dan `v1.wav` & `v2.wav`.
