# Suntingan video 5: 3 Tips Medical Card (<60s)

Versi 2 (selepas maklum balas): hook Player Select dibuang dan diganti infografik bersih.
- **Hook simple**: teks kinetik BUSY → PANIK → "tak tahu nak buat apa?" atas video.
- **Babak tarik kamera** pada "Yang pertama" dikekalkan sebagai transisi ke Tip 01.
- **Infografik**: mock-up chat ejen (Tip 02), **PiP** (video mengecil ke bingkai bulat atas latar `.behindonly`) dengan aliran GL + pemasa 2–3 jam (Tip 03), perbandingan ✕/✓, butang Share/Save.
- **Muzik asli** `music.py` (104 BPM) + SFX moden: selamat untuk IG/TikTok.
- Font Plus Jakarta Sans + Instrument Serif. Grading sinematik terang dalam `grade.py`.

```
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
python3 music.py gfx/data.js work/ovl/meta.json work/music.wav
DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav work/music.wav
SEG_MODEL=models/selfie_multiclass.tflite python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
