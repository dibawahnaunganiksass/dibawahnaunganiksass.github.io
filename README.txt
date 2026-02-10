📘 README — ADMIN WEBSITE IKSASS

Dokumen ini adalah panduan singkat untuk Admin Website IKSASS
Tidak perlu paham coding. Ikuti langkah di bawah apa adanya.

🎯 TUJUAN

Website IKSASS memakai sistem build otomatis agar:

Berita rapi

Galeri otomatis terisi

Pencarian lintas kategori selalu update

Admin cukup klik 1 file setiap selesai kerja.

📂 STRUKTUR PENTING (JANGAN DIUBAH)

Di folder utama project IKSASS, harus ada:

IKSASS/
├─ BUILD_IKSASS.bat   ← FILE YANG DIKLIK
├─ tools/
├─ berita/
├─ galeri/
├─ assets/

⚠️ Jangan rename folder tools, berita, galeri, assets.

🖱️ CARA KERJA ADMIN (INTINYA)
SETIAP KALI KAMU:

menambah berita

mengedit berita

mengganti / menambah foto galeri

mengedit halaman (visi-misi, galeri, profil, dll)

👉 LAKUKAN INI:

DOUBLE CLICK

BUILD_IKSASS.bat

Tunggu sampai muncul tulisan SELESAI, lalu tutup jendela.

🎉 Website sudah siap di-upload / dijalankan.

📰 CARA TAMBAH / EDIT BERITA

Masuk folder:

berita/data/

Tambah atau edit file .json berita (sesuai format yang sudah ada)

Simpan

DOUBLE CLICK BUILD_IKSASS.bat

🖼️ CARA GANTI / TAMBAH FOTO GALERI

Masuk folder:

assets/img/galeri/

Pilih album (contoh: mubes-iksass-2025)

Ganti isi foto TANPA mengubah nama file

contoh: mubes-iksass-2025-01.jpg

Simpan

DOUBLE CLICK BUILD_IKSASS.bat

📌 Kalau hanya ganti isi foto (nama sama), tetap aman.

🔍 SEARCH TIDAK PERLU DIURUS

Pencarian otomatis update

Admin tidak perlu setting apa pun

Sudah termasuk saat klik BUILD_IKSASS.bat

❗ JIKA MUNCUL ERROR

Kalau setelah klik muncul:

tulisan merah

atau berhenti tidak selesai

👉 JANGAN PANIK

Lakukan:

Foto / copy teks error

Kirim ke tim teknis / developer

⚠️ Jangan hapus file apa pun tanpa arahan.

🧠 RINGKASAN PALING PENTING

Selesai kerja apa pun → DOUBLE CLICK BUILD_IKSASS.bat

Itu saja.

📌 CATATAN TAMBAHAN

File ini boleh dicetak

Aman untuk admin baru

Aman dijalankan berkali-kali

✨ Website IKSASS sudah dibuat supaya ADMIN TIDAK RIBET.
Kalau kamu bisa klik dua kali, berarti kamu bisa kelola website ini.