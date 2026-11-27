# Suntingan video 6: 3 Sebab GL Anda Boleh Decline (<60s)

- **Hook bombastik (0–7 s)**: kad MEDICAL CARD jatuh dan ✓ Dilindungi → CRASH pada "aksiden" (kilatan putih, kaca retak,
  letupan komik AKSIDEN!, gegaran + glitch RGB dalam `compose.py`) → ambulans + lampu siren → "TAPI…" (scratch, muzik senyap,
  degupan jantung) → surat GL dicop **DECLINED** → KENAPA??
- **Bukti sebenar**: video mengecil ke PiP, X-ray + chat klien (dikaburkan dengan `tools/redact_chats.py`; gambar bukti
  tidak disimpan dalam repo, lihat `.gitignore`).
- **3 sebab**: Masuk wad ✕ / Polisi tak aktif, caruman, tempoh menunggu / cop TIDAK LAYAK. Takeaway + waiting period. CTA + "Amalina Ilias".
- SFX baharu disintesis dalam `sfx.py`: `glass`, `skid`, `stamp`, `stamp_sm`, `wail`. Muzik asli `music.py` (senyap pada "Tapi", drop masuk cerita).
- **Tiada color grading**: klien dah grade footage (eksport DJI). Tukar HLG → SDR sahaja (`npl=203`, `tonemap=mobius`) dan render dengan `NOGRADE=1`.

```
ffmpeg -i src.mov -an -vf "zscale=f=spline36:tin=arib-std-b67:pin=bt2020:min=bt2020nc:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,fps=30" -c:v libx264 -crf 12 work/p1.mov
cat gfx/_helpers.js gfx/_body.js gfx/_caps.js gfx/_tail.js > gfx/motion.js
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask && node render.js work/ovlb all 30 4 1 behind
python3 music.py gfx/data.js work/ovl/meta.json work/music.wav
DENOISE_MODEL=models/rnn/bd.rnnn python3 mix.py work work/ovl/meta.json work/mix.wav work/music.wav
NOGRADE=1 SEG_MODEL=models/selfie_multiclass.tflite python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm --behind work/ovlb
```
