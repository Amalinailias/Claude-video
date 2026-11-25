# Video 5 (medical card: 3 tips before hospital). (clip, src_in, src_out, zoom, note, opts)
# opts.face = face centre in 1080x1920 design space for that camera framing
FA = dict(face=(585, 975))   # clip 1, before the camera was moved (0-22.6 s)
FB = dict(face=(560, 940))   # clip 1, after the move (23.3-110 s)
FC = dict(face=(478, 952))   # clip 1, after the second move (>110 s)
FD = dict(face=(602, 945))   # clip 2 (side angle)
EDL = [
 (1, 5.18, 11.92, 1.55, "Kadang-kadang saya ni busy dengan kerja. Jadi bila masuk hospital tu, paniklah sikit. Tak tahu nak buat apa.", dict(FA, ps=True)),
 (1, 12.05, 15.56, 1.30, "Haa, pernah dengar tak ungkapan ini? Jangan risau.", FA),
 (1, 18.55, 22.32, 1.40, "This is 3 tips for you untuk follow sebelum masuk ke hospital.", FA),
 (1, 22.62, 26.26, 1.18, "Yang pertama, semak polisi bersama dengan ejen.", FB),
 (1, 31.10, 37.66, 1.25, "Status bayaran dan juga waiting period. Yang kedua, anda bagitahu keadaan anda kepada ejen,", FB),
 (1, 39.48, 48.44, 1.18, "adakah anda masuk daripada emergensi ataupun ward biasa. Siapa doktor pakar, di hospital mana. Ejen juga boleh bantu berhubung dengan pihak hospital tersebut.", FB),
 (1, 48.58, 51.30, 1.30, "Yang ketiga, permohonan GL.", FB),
 (1, 53.45, 56.08, 1.18, "Doktor pakar akan menyediakan laporan perubatan.", FB),
 (1, 61.40, 67.30, 1.25, "Pihak syarikat insurans akan menilai permohonan dan menentukan kelulusan GL anda.", FB),
 (1, 72.32, 75.72, 1.30, "Kebiasaannya proses ini mengambil masa sekitar 2 hingga 3 jam.", FB),
 (1, 117.22, 122.00, 1.20, "Sebab itu penting untuk anda ada seorang ejen yang bukan hanya tahu menjual polisi,", FC),
 (1, 132.28, 134.88, 1.30, "tetapi membantu ketika anda memerlukan.", FC),
 (2, 0.28, 3.24, 1.25, "Share dan save this post untuk masa hadapan.", FD),
]
