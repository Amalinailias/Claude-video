# Suntingan video 4: Sakit Kritikal (hook tier list, 45s)

Pipeline sama seperti `edit-sakit-kritikal/`, dengan tambahan:
- **Hook tier list** (pre-roll 2s, latar krim penuh) dalam `gfx/_body.js`.
- **Teks di belakang badan**: `render.js ... behind` render teks dalam pass berasingan. `compose.py --behind <dir>` lukis teks, kemudian letak semula orang di atasnya guna matte segmentasi MediaPipe (`selfie_multiclass_256x256.tflite`, set `SEG_MODEL=`).
- **Kad kuning penuh**: "TAPI MEREKA LUPA…".
- Font ikut video Rider AIA (Plus Jakarta Sans + Instrument Serif). Tiada color grading.

```
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav   # RNNoise: buang bunyi latar kafe
SEG_MODEL=models/selfie_multiclass.tflite python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
