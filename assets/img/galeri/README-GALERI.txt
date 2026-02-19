IKSASS — Struktur Foto Galeri (WAJIB)
====================================

Lokasi folder utama:
  assets/img/galeri/

Pola penamaan (WAJIB):
  assets/img/galeri/<kategori-slug>/<kategori-slug>-NN.jpg

Keterangan:
  - <kategori-slug> harus sama dengan slug kategori galeri
  - NN = nomor urut 2 digit: 01, 02, 03, ...

Contoh:
  assets/img/galeri/ke-pesantrenan/ke-pesantrenan-01.jpg
  assets/img/galeri/ke-ilmu-an/ke-ilmu-an-02.jpg
  assets/img/galeri/ke-iksass-an/ke-iksass-an-03.jpg

Rekomendasi jumlah foto:
  - Landing: 1 cover per kategori (gunakan -01)
  - Isi kategori: 6–20 foto (01–20)

Cover/Thumbnail:
  - Landing memakai file: <kategori-slug>-01.jpg
  - Pastikan foto landscape (rasio mendekati 16:9) untuk hasil terbaik.


Setelah taruh foto, jalankan:
  python tools/build_gallery.py
