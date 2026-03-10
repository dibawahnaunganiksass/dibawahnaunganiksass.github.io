# LEGACY CSS AUDIT

Audit ini dibuat pada hasil **Fase E + F** untuk memetakan file legacy yang masih dominan tanpa mengubah UI.

## Import order `assets/css/app.css`
1. `tokens.css`
2. `base.css`
3. `components.css`
4. `utilities.css`
5. `main.min.css`
6. `design-system.min.css`
7. `override.min.css`
8. `final-theme-fix.css`
9. `phase3.css`
10. `phase4.css`

## Ukuran file CSS terbesar
- `assets/css/override.min.css` — 121.7 KB
- `assets/css/main.min.css` — 79.3 KB
- `assets/css/phase4.css` — 18.4 KB
- `assets/css/pages/mars-hymne.css` — 8.5 KB
- `assets/css/pages/yel-yel.css` — 7.5 KB
- `assets/css/wasiat.min.css` — 5.1 KB
- `assets/css/prinsip-perjuangan.min.css` — 3.8 KB
- `assets/css/design-system.min.css` — 3.5 KB
- `assets/css/final-theme-fix.css` — 3.1 KB
- `assets/css/contact.min.css` — 2.9 KB

## Jumlah `!important` per file (teratas)
- `assets/css/override.min.css` — 334
- `assets/css/main.min.css` — 180
- `assets/css/final-theme-fix.css` — 33
- `assets/css/utilities.css` — 9
- `assets/css/pages/mars-hymne.css` — 4
- `assets/css/wasiat.min.css` — 3
- `assets/css/design-system.min.css` — 2
- `assets/css/pages/home.css` — 2
- `assets/css/app.css` — 0
- `assets/css/base.css` — 0

## Inventaris breakpoint teratas
- `min:992` — 34 kemunculan
- `max:768` — 24 kemunculan
- `max:991` — 24 kemunculan
- `max:520` — 19 kemunculan
- `max:560` — 14 kemunculan
- `max:900` — 10 kemunculan
- `max:640` — 10 kemunculan
- `max:980` — 9 kemunculan
- `max:860` — 8 kemunculan
- `max:992` — 8 kemunculan
- `max:720` — 7 kemunculan
- `max:420` — 5 kemunculan
- `max:820` — 4 kemunculan
- `max:1024` — 4 kemunculan
- `min:768` — 4 kemunculan

## Temuan aman
- style attribute inline yang masih tersisa di HTML: **69**
- skip-link di seluruh proyek: **1**
- `dawuhnya-03.jpg` dan `dawuhnya-06.jpg` punya hash sama: `bc2bb0569d1aece85641299e25c1f3ae6f72597380c122f47f318ffadddce605`

## Rekomendasi lanjutan
1. jangan hapus `phase3.css` dan `phase4.css` sebelum ada baseline visual per halaman.
2. prioritaskan pembongkaran `override.min.css`, lalu `main.min.css`.
3. normalisasi breakpoint dimulai dari `760/768`, `991/992`, dan `1080/1081`.
4. pindahkan literal warna yang berulang ke token setelah baseline visual stabil.
