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
- **Speed 1.2x selepas hook** (`SPEED_AFTER_HOOK` dalam `edl.py`): video `setpts`, suara `rubberband` (pitch kekal). Hasil 47.8 s.
- **Lagu upbeat asli** `music_hype.py` (122 BPM pop-house; lagu lembut `music_soft.py` ditolak). Teks "ACCIDENT!" dalam bahasa Inggeris.
- **Bunyi shocked kuat** `shock_big` pada "decline" + `boom` pada ACCIDENT!; bunyi langkah `count1-3` (3 sebab) dan `step1-3` (First / kedua / ketiga).
- **Sebab 1-2-3 lebih smooth**: satu kad kekal, isi meluncur antara sebab, bar kemajuan 1-2-3, baris checklist samar lalu menyala; zoom gaussian pada jump cut.

```
cat gfx/_helpers.js gfx/_body.js gfx/_caps.js gfx/_tail.js > gfx/motion.js
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
python3 music_hype.py gfx/data.js work/ovl/meta.json work/music.wav
MUSIC_BASE_DB=-13 MUSIC_HOOK_UNTIL=4.3 DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav work/music.wav
HDR_SRC=src/c1.mov python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
