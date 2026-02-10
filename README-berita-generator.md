# Workflow Berita (Baku & Rapi)

## 1) Buat data berita (JSON)
Duplikasi file: `berita/data/contoh-berita-baru.json`
Lalu isi field:
- slug (opsional; kalau kosong akan otomatis dari title)
- title, subtitle, location, date_display
- description (SEO 150–160 karakter)
- caption
- body (array paragraf)

## 2) Generate halaman + featured image
Jalankan:
```bash
python tools/berita_generator.py berita/data/contoh-berita-baru.json
```

Hasil:
- `berita/<slug>/index.html`
- `assets/img/berita/<slug>.png` (1200×630, OG-ready)

## 3) Tambahkan ke listing (opsional)
Jika kamu punya daftar berita di `berita/index.html` atau `search-index.js`, tambahkan entry sesuai kebutuhan.
