# Suntingan video 3: Pampasan Sakit Kritikal

Pipeline sama seperti `edit-rider/`, dengan perbezaan berikut:
- **Sumber 1080p (export CapCut)**: hook CapCut asal (0–8s, dengan teks tertanam dan transisi blur) dibuang. Hook dibina semula atas ayat "Bila kecil orang tak nampak… barulah nampak": teks kecil membesar jadi tajuk.
- **Font tajuk ikut hook asal**: Anton (kuning, bayang merah) + Playfair Display 900. Kapsyen guna Anton.
- **Color grading premium**: `grade_premium.ffmpeg.txt` digunakan semasa buat proxy:
  `ffmpeg -i clip.mov -vf "fps=30,$(cat grade_premium.ffmpeg.txt),format=yuv420p" -an -c:v libx264 -crf 14 p.mov`
- Timing perkataan dipetakan terus dari transkrip asal melalui EDL (`build_data.py`). Kapsyen dipecah automatik ikut ayat.
