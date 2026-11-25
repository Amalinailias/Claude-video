# Suntingan video: "3 Langkah Jaga Kewangan Selepas Berpisah"

Pipeline suntingan yang boleh diulang (source sahaja, tanpa fail video).

| Fail | Fungsi |
|---|---|
| `edl.py` | Edit decision list: segmen yang disimpan dari setiap klip dan tahap zoom |
| `timeline.py` | Petakan EDL ke timeline output (hook 4.6s di depan) |
| `build_data.py` | Bina `gfx/data.js`: masa setiap perkataan, chunk kapsyen dan ikon |
| `gfx/index.html` + `gfx/motion.js` | Layer motion graphics (hook, kad infografik, kapsyen, end card) + cue sheet SFX |
| `render.js` | Render layer grafik ke frame PNG lutsinar dengan Playwright (`scale=2` untuk 4K) |
| `sfx.py` | Library SFX sintetik: whoosh, riser, impact, pop, chime, glitch dll. |
| `music.py` | Muzik latar lo-fi asli yang disusun ikut timeline |
| `mix.py` | Bersihkan suara, mix SFX dan muzik (ducking), kemudian limiter |
| `compose.py` | Gabungkan footage (punch-in zoom) dengan layer grafik, kemudian encode (`--preview` / `--4k`) |

Langkah render (4K):
```
node render.js work/ovl4k all 30 3 2
python3 music.py gfx/data.js work/ovl4k/meta.json work/music.wav
python3 mix.py work work/ovl4k/meta.json work/mix.wav work/music.wav
python3 compose.py work work/ovl4k work/mix.wav final_4k.mp4 --4k
```
`work/` perlu ada `p1_4k.mov` & `p2_4k.mov` (klip asal yang ditone-map HLG→SDR), dan `v1.wav` & `v2.wav` (audio 48k mono).
