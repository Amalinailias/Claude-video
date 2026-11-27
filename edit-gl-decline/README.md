# Suntingan video 6: 3 Sebab GL Anda Boleh Decline (<60s)

- **Hook bombastik (0–7 s)**: kad MEDICAL CARD jatuh dan ✓ Dilindungi → CRASH pada "accident" (kilatan putih, kaca retak,
  letupan komik ACCIDENT!, gegaran + glitch RGB dalam `compose.py`) → ambulans + lampu siren → "TAPI…" (scratch, muzik senyap,
  degupan jantung) → surat GL dicop **DECLINED** → KENAPA??
- **Bukti sebenar**: video mengecil ke PiP, X-ray + chat klien (dikaburkan dengan `tools/redact_chats.py`; gambar bukti
  tidak disimpan dalam repo, lihat `.gitignore`).
- **3 sebab**: Masuk wad ✕ / Polisi tak aktif, caruman, tempoh menunggu / cop TIDAK LAYAK. Takeaway + waiting period. CTA + "Amalina Ilias".
- SFX baharu disintesis dalam `sfx.py`: `glass`, `skid`, `stamp`, `stamp_sm`, `wail`. Muzik senyap pada "Tapi", masuk semula bila cerita bermula.
- **Warna asal, tanpa grading (HDR passthrough)**: klien dah grade footage (eksport DJI, HLG/Dolby Vision 8.4). `HDR_SRC=` membaca fail asal
  tanpa tukar warna, grafik ditukar ke HLG (putih SDR = 75 %), dan output HEVC Main10 HLG.
- **Lagu lembut** asli `music_soft.py` (80 BPM, piano + Rhodes), kedengaran ~11 dB di bawah suara. Teks "ACCIDENT!" dalam bahasa Inggeris.

```
cat gfx/_helpers.js gfx/_body.js gfx/_caps.js gfx/_tail.js > gfx/motion.js
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
python3 music_soft.py gfx/data.js work/ovl/meta.json work/music.wav
DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav work/music.wav
HDR_SRC=src/c1.mov python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
