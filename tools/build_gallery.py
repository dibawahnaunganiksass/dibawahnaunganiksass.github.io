#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_gallery.py
Generate Galeri landing + album pages from images dropped into assets/img/galeri/<album-slug>/

Rules:
- Images named: <album-slug>-NN.jpg (NN 2-digit) but we also accept .jpeg .png .webp
- Cover = -01 (preferred), else first image
- Album pages render all matching images, sorted by NN, then filename.

Outputs:
- galeri/index.html
- galeri/<album-slug>.html (detail pages)
- assets/img/galeri/manifest.json
"""

from __future__ import annotations

import re
import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
GALERI_DIR = ROOT / "galeri"
IMG_ROOT = ROOT / "assets" / "img" / "galeri"
MANIFEST_PATH = IMG_ROOT / "manifest.json"

ALBUMS = [
  {
    "slug": "mubes-iksass-2025",
    "title": "Mubes IKSASS 2025 — Konsolidasi & Arah Baru",
    "tag": "Perjuangan",
    "narrative": "Muktamar Besar IKSASS 2025 menjadi ruang pertemuan lintas generasi alumni Pondok Pesantren Salafiyah Syafi’iyah Sukorejo. Bukan sekadar forum pengambilan keputusan, momen ini mempertemukan gagasan, pengalaman, dan semangat kebersamaan untuk meneguhkan arah perjuangan organisasi ke depan."
  },
  {
    "slug": "khidmah-sosial",
    "title": "Khidmah Sosial — Hadir untuk Umat",
    "tag": "Sosial",
    "narrative": "IKSASS hadir di tengah masyarakat melalui gerakan khidmah sosial yang berangkat dari nilai kepedulian dan kemanusiaan. Dalam kebersamaan para alumni dan relawan, setiap langkah kecil menjadi wujud nyata kepedulian terhadap sesama, sekaligus penguatan peran sosial pesantren di tengah masyarakat."
  },
  {
    "slug": "silaturahim-alumni",
    "title": "Silaturahim Alumni — Menjaga Ikatan, Merawat Kebersamaan",
    "tag": "Ukhuwah",
    "narrative": "Silaturahim alumni bukan hanya tentang pertemuan, tetapi tentang merawat ikatan batin yang terjalin sejak di pesantren. Dalam suasana sederhana dan penuh kehangatan, para alumni saling berbagi cerita, pengalaman, dan harapan, memperkuat ukhuwah yang menjadi fondasi gerak IKSASS."
  },
  {
    "slug": "pendidikan-ke-nuan",
    "title": "Pendidikan & Ke-NU-an — Merawat Ilmu, Menjaga Tradisi",
    "tag": "Pendidikan",
    "narrative": "Pendidikan dan nilai-nilai Ke-NU-an menjadi fondasi utama gerak IKSASS dalam membentuk insan yang berilmu, berakhlak, dan berkeadaban. Melalui pengajian, forum keilmuan, serta penguatan tradisi Ahlussunnah wal Jama’ah, IKSASS terus merawat warisan pesantren agar tetap hidup, relevan, dan membumi di tengah perubahan zaman."
  },
]

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

def discover_images(album_slug: str) -> list[str]:
  folder = IMG_ROOT / album_slug
  if not folder.exists():
    return []
  files = [p.name for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]

  def key(name: str):
    m = re.search(r"-(\d{2,3})\.", name)
    if m:
      return (0, int(m.group(1)), name.lower())
    return (1, 10**9, name.lower())

  return sorted(files, key=key)

def cover_for(album_slug: str, images: list[str]) -> str:
  if not images:
    return f"/assets/img/galeri/{album_slug}/{album_slug}-01.jpg"
  for fn in images:
    if re.search(r"-01\.", fn):
      return f"/assets/img/galeri/{album_slug}/{fn}"
  return f"/assets/img/galeri/{album_slug}/{images[0]}"

def write_manifest(items: list[dict]):
  IMG_ROOT.mkdir(parents=True, exist_ok=True)
  with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

def render_shell(title: str, description: str, inner_html: str) -> str:
  # Keep head/meta consistent with site. Use relative CSS like other pages in /galeri/.
  return f"""<!DOCTYPE html>
<html lang=\"id\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>{title}</title>
  <meta name=\"description\" content=\"{description}\">
  <meta name=\"robots\" content=\"index, follow\">
  <meta name=\"theme-color\" content=\"#0f766e\">
  <link rel=\"icon\" href=\"/assets/img/logo-iksass.png\">
  <link rel=\"apple-touch-icon\" href=\"/assets/img/logo-iksass.png\">

  <meta property=\"og:type\" content=\"website\">
  <meta property=\"og:site_name\" content=\"IKSASS\">
  <meta property=\"og:title\" content=\"{title}\">
  <meta property=\"og:description\" content=\"{description}\">
  <meta property=\"og:image\" content=\"/assets/img/og-default.png\">
  <meta property=\"og:image:width\" content=\"1200\">
  <meta property=\"og:image:height\" content=\"630\">
  <meta name=\"twitter:card\" content=\"summary_large_image\">
  <meta name=\"twitter:title\" content=\"{title}\">
  <meta name=\"twitter:description\" content=\"{description}\">
  <meta name=\"twitter:image\" content=\"/assets/img/og-default.png\">

  <link href=\"../assets/css/main.css\" rel=\"stylesheet\">
  <link href=\"/assets/css/override.css\" rel=\"stylesheet\">
  <script src=\"/assets/js/meta-url.js\"></script>
</head>
<body>
<div data-include=\"header\"></div>
<main class=\"page\" id=\"konten\" tabindex=\"-1\">
  <div class=\"container\">
{inner_html}
  </div>
</main>
<div data-include=\"footer\"></div>
<script defer src=\"../assets/js/partials.js\"></script>
<script src=\"../assets/js/main.js\"></script>
<script src=\"../assets/js/search-index.js\"></script>
<script src=\"../assets/js/search.js\"></script>
</body>
</html>
"""

def render_landing(albums_render: list[dict]) -> str:
  cards = []
  for a in albums_render:
    cards.append(f"""
    <a class=\"gallery-card\" href=\"/galeri/{a['slug']}.html\">
      <div class=\"gallery-card__media\">
        <img src=\"{a['cover']}\" alt=\"{a['title']}\" loading=\"lazy\">
      </div>
      <div class=\"gallery-card__body\">
        <div class=\"pill\">{a['tag']}</div>
        <h3 class=\"title\" style=\"margin:10px 0 6px\">{a['title']}</h3>
        <p class=\"desc\" style=\"margin:0\">{a['narrative']}</p>
      </div>
    </a>
    """.rstrip())
  cards_html = "\n".join(cards)

  inner = f"""
    <div class=\"breadcrumb\">Media</div>
    <h1 class=\"page-title\">Galeri IKSASS</h1>
    <p class=\"page-sub\">
      Merekam perjalanan, merawat kenangan, menguatkan kebersamaan.
      Setiap momen yang ditampilkan adalah kurasi—bukan sekadar arsip.
    </p>

    <div class=\"hero-card\" style=\"margin:14px 0 0\">
      <div class=\"pill\">Perjuangan</div>
      <div class=\"pill\">Sosial</div>
      <div class=\"pill\">Ukhuwah</div>
      <div class=\"pill\">Pendidikan</div>
      <div class=\"pill\">Ke-NU-an</div>
    </div>

    <div class=\"prose\" style=\"margin-top:12px\">
      <p>
        Berikut adalah highlight momen terpilih. Untuk menambah atau mengganti foto album, taruh foto di
        <code>assets/img/galeri/&lt;album&gt;/</code> dengan pola <code>&lt;album&gt;-NN.jpg</code>,
        lalu jalankan <code>python tools/build_gallery.py</code>.
      </p>
    </div>

    <style>
      .gallery-grid--4{{display:grid;gap:18px;grid-template-columns:repeat(1,minmax(0,1fr));}}
      @media (min-width:768px){{.gallery-grid--4{{grid-template-columns:repeat(2,minmax(0,1fr));}}}}
      @media (min-width:1100px){{.gallery-grid--4{{grid-template-columns:repeat(4,minmax(0,1fr));}}}}
      .gallery-card{{display:block;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,.08);text-decoration:none;background:#fff;}}
      .gallery-card__media{{aspect-ratio:16/9;background:rgba(0,0,0,.04);}}
      .gallery-card__media img{{width:100%;height:100%;object-fit:cover;display:block;}}
      .gallery-card__body{{padding:14px;}}
      .gallery-card:hover{{box-shadow:0 14px 40px rgba(0,0,0,.10);transform:translateY(-2px);transition:all .2s ease;}}
    </style>

    <div class=\"gallery-grid--4\" style=\"margin-top:14px\">
{cards_html}
    </div>
  """.rstrip()

  return render_shell("IKSASS — Galeri", "Galeri IKSASS: Jejak perjuangan, khidmah, ukhuwah, pendidikan, dan Ke-NU-an.", inner)

def render_album_page(album: dict, images: list[str]) -> str:
  if images:
    items = []
    for fn in images:
      src = f"/assets/img/galeri/{album['slug']}/{fn}"
      items.append(f"""
      <a class=\"album-item\" href=\"{src}\" target=\"_blank\" rel=\"noopener\">
        <img src=\"{src}\" alt=\"{album['title']}\" loading=\"lazy\">
      </a>
      """.rstrip())
    grid_html = "\n".join(items)
  else:
    grid_html = f"""
      <div class=\"album-empty\">
        <p><strong>Belum ada foto di album ini.</strong></p>
        <p>Taruh foto di <code>assets/img/galeri/{album['slug']}/</code> dengan pola <code>{album['slug']}-NN.jpg</code>, lalu jalankan <code>python tools/build_gallery.py</code>.</p>
      </div>
    """.rstrip()

  inner = f"""
    <div class=\"breadcrumb\"><a href=\"/galeri/\" style=\"text-decoration:none;color:inherit;opacity:.9\">Galeri</a> <span style=\"opacity:.6\">/</span> {album['tag']}</div>
    <h1 class=\"page-title\">{album['title']}</h1>
    <p class=\"page-sub\">{album['narrative']}</p>

    <div class=\"hero-card\" style=\"margin:14px 0 0\">
      <div class=\"pill\">{album['tag']}</div>
      <div class=\"pill\">IKSASS</div>
      <div class=\"pill\">Dokumentasi</div>
    </div>

    <style>
      .album-grid{{display:grid;gap:12px;margin-top:14px;grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media (min-width:768px){{.album-grid{{grid-template-columns:repeat(3,minmax(0,1fr));}}}}
      @media (min-width:1100px){{.album-grid{{grid-template-columns:repeat(4,minmax(0,1fr));}}}}
      .album-item{{display:block;border-radius:14px;overflow:hidden;border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03);}}
      .album-item img{{width:100%;height:100%;aspect-ratio:1/1;object-fit:cover;display:block;transition:transform .2s ease;}}
      .album-item:hover img{{transform:scale(1.03);}}
      .album-empty{{border:1px dashed rgba(0,0,0,.18);border-radius:14px;padding:16px;background:rgba(0,0,0,.02);grid-column:1/-1;}}
      .album-empty code{{background:rgba(0,0,0,.06);padding:2px 6px;border-radius:8px;}}
    </style>

    <section class=\"album-grid\" aria-label=\"Foto album\">
{grid_html}
    </section>
  """.rstrip()

  return render_shell(f"{album['title']} | Galeri IKSASS", album['narrative'], inner)

def main():
  manifest = []
  albums_render = []

  for album in ALBUMS:
    images = discover_images(album["slug"])
    cover = cover_for(album["slug"], images)
    albums_render.append({**album, "images": images, "cover": cover})

    manifest.append({
      "album_slug": album["slug"],
      "title": album["title"],
      "tag": album["tag"],
      "folder": f"assets/img/galeri/{album['slug']}/",
      "cover": cover.lstrip("/"),
      "images": images,
      "generated_at": datetime.utcnow().isoformat() + "Z",
    })

    GALERI_DIR.mkdir(parents=True, exist_ok=True)
    (GALERI_DIR / f"{album['slug']}.html").write_text(render_album_page(album, images), encoding="utf-8")

  (GALERI_DIR / "index.html").write_text(render_landing(albums_render), encoding="utf-8")
  write_manifest(manifest)
  print("OK: galeri generated:", len(ALBUMS))

if __name__ == "__main__":
  main()
