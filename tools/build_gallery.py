#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_gallery.py
Generate Galeri landing + manifest untuk 4 kategori utama (Akar/Proses/Wadah/Hikmah).

Rules:
- Images named: <kategori-slug>-NN.jpg (NN 2-digit) but we also accept .jpeg .png .webp
- Cover = -01 (preferred), else first image

Outputs:
- galeri/index.html
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

CATEGORIES = [
  {
    "slug": "ke-pesantrenan",
    "title": "Ke-Pesantrenan",
    "tag": "Akar",
    "narrative": "Akar tradisi, adab, dan suasana pesantren yang membentuk langkah."
  },
  {
    "slug": "ke-ilmu-an",
    "title": "Ke-Ilmu-an",
    "tag": "Proses",
    "narrative": "Proses belajar, ngaji, dan laku keilmuan yang menghidupkan makna."
  },
  {
    "slug": "ke-iksass-an",
    "title": "Ke-IKSASS-an",
    "tag": "Wadah",
    "narrative": "Wadah ukhuwah, khidmah, dan kerja-kerja kolektif alumni."
  },
  {
    "slug": "dawuhnya",
    "title": "Dawuh",
    "tag": "Hikmah",
    "narrative": "Dawuh dan petuah sebagai penuntun adab dan arah gerak."
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

def render_landing(categories_render: list[dict]) -> str:
  cards = []
  for a in categories_render:
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
      Galeri ini merangkum nilai, tradisi, dan jejak kebersamaan.
      Pilih kategori untuk menelusuri dokumentasi dan hikmah.
    </p>

    <div class=\"hero-card\" style=\"margin:14px 0 0\">
      <div class=\"pill\">Akar</div>
      <div class=\"pill\">Proses</div>
      <div class=\"pill\">Wadah</div>
      <div class=\"pill\">Hikmah</div>
    </div>

    <div class=\"prose\" style=\"margin-top:12px\">
      <p>
        Galeri disusun dalam 4 kategori utama. Untuk menambah atau mengganti foto, taruh foto di
        <code>assets/img/galeri/&lt;kategori&gt;/</code> dengan pola <code>&lt;kategori&gt;-NN.jpg</code>,
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

  return render_shell("IKSASS — Galeri", "Galeri IKSASS: Ke-IKSASS-an, Ke-Pesantrenan, Ke-Ilmu-an, dan Dawuh.", inner)


def main():
  manifest = []
  categories_render = []

  for cat in CATEGORIES:
    images = discover_images(cat["slug"])
    cover = cover_for(cat["slug"], images)
    categories_render.append({**cat, "images": images, "cover": cover})

    manifest.append({
      "album_slug": cat["slug"],
      "title": cat["title"],
      "tag": cat["tag"],
      "folder": f"assets/img/galeri/{cat['slug']}/",
      "cover": cover.lstrip("/"),
      "images": images,
      "generated_at": datetime.utcnow().isoformat() + "Z",
    })

  GALERI_DIR.mkdir(parents=True, exist_ok=True)
  (GALERI_DIR / "index.html").write_text(render_landing(categories_render), encoding="utf-8")
  write_manifest(manifest)
  print("OK: galeri generated:", len(CATEGORIES))

if __name__ == "__main__":
  main()
