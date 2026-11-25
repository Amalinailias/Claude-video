# Suntingan video 2: Rider AIA (pampasan ikut % kehilangan upaya)

Pipeline sama seperti `edit/`, dengan tambahan:
- **Kesan glass widget**: `render.js ... mask` hasilkan mask panel `.glass`. `compose.py --mask <dir>` kaburkan video di belakang panel (frosted).
- **Reframe dari sumber 4K**: `compose.py` decode `p4k.mov` dan letak semula muka di tengah (`FACE` → `TARGET`) dengan zoom 1.45–1.85×.
- `gfx/motion.js` dihimpun dari `_helpers.js + _body.js + _caps.js + _tail.js`.
- Angka % dalam infografik diambil dari jadual sampel AIA (Schedule of Indemnities).

```
cat gfx/_helpers.js gfx/_body.js gfx/_caps.js gfx/_tail.js > gfx/motion.js
node render.js work/ovl all 30 4 1 && node render.js work/ovlm all 30 4 1 mask
python3 mix.py work work/ovl/meta.json work/mix.wav
python3 compose.py work work/ovl work/mix.wav out.mp4 --mask work/ovlm   # tambah --preview untuk 720p
```
