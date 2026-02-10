IKSASS — Struktur Foto Galeri (WAJIB)
====================================

Lokasi folder utama:
  assets/img/galeri/

Pola penamaan (WAJIB):
  assets/img/galeri/<album-slug>/<album-slug>-NN.jpg

Keterangan:
  - <album-slug> harus sama dengan slug halaman album
  - NN = nomor urut 2 digit: 01, 02, 03, ...

Contoh:
  assets/img/galeri/mubes-iksass-2025/mubes-iksass-2025-01.jpg
  assets/img/galeri/mubes-iksass-2025/mubes-iksass-2025-02.jpg
  assets/img/galeri/khidmah-sosial/khidmah-sosial-01.jpg

Rekomendasi jumlah foto:
  - Landing: 1 cover per album (gunakan -01)
  - Halaman album: 8–20 foto (01–20)

Cover/Thumbnail:
  - Landing memakai file: <album-slug>-01.jpg
  - Pastikan foto landscape (rasio mendekati 16:9) untuk hasil terbaik.


Setelah taruh foto, jalankan:
  python tools/build_gallery.py
