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

# Base URL for social sharing (Open Graph/Twitter cards)
SITE_ORIGIN = "https://dibawahnaunganiksass.github.io"

CATEGORIES = [
  {
    "slug": "ke-pesantrenan",
    "title": "Ke-Pesantrenan",
    "tag": "Akar",
    "breadcrumb": "Perjuangan",
    "narrative": "Akar tradisi, adab, dan suasana pesantren yang membentuk langkah.",
    "description": "Jejak tradisi pesantren, adab, dan suasana yang membentuk langkah IKSASS.",
    "alt": "Mubes IKSASS 2025 — Konsolidasi & Arah Baru",
  },
  {
    "slug": "ke-ilmu-an",
    "title": "Ke-Ilmu-an",
    "tag": "Proses",
    "breadcrumb": "Sosial",
    "narrative": "Proses belajar, ngaji, dan laku keilmuan yang menghidupkan makna.",
    "description": "Dokumentasi proses belajar, ngaji, dan laku keilmuan dalam IKSASS.",
    "alt": "Khidmah Sosial — Hadir untuk Umat",
  },
  {
    "slug": "ke-iksass-an",
    "title": "Ke-IKSASS-an",
    "tag": "Wadah",
    "breadcrumb": "Ukhuwah",
    "narrative": "Wadah ukhuwah, khidmah, dan kerja-kerja kolektif alumni.",
    "description": "Dokumentasi kebersamaan alumni: ukhuwah, khidmah, dan kerja kolektif IKSASS.",
    "alt": "Silaturahim Alumni — Menjaga Ikatan, Merawat Kebersamaan",
  },
  {
    "slug": "dawuhnya",
    "title": "Dawuh",
    "tag": "Hikmah",
    "breadcrumb": "Pendidikan",
    "narrative": "Dawuh dan petuah sebagai penuntun adab dan arah gerak.",
    "description": "Dawuh dan petuah sebagai penuntun adab serta arah gerak IKSASS.",
    "alt": "Pendidikan & Ke-NU-an — Merawat Ilmu, Menjaga Tradisi",
  },
]

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# Strict naming: <slug>-NN.(jpg|jpeg|png|webp) with NN 2-digit.
# We still *sort* by any -\d{2,3} we find for robustness, but validation enforces 2-digit.
def _is_valid_name(slug: str, filename: str) -> bool:
  return re.fullmatch(
    rf"{re.escape(slug)}-(\d{{2}})\.(?:jpg|jpeg|png|webp)",
    filename,
    flags=re.IGNORECASE,
  ) is not None


def _extract_index(filename: str) -> int | None:
  m = re.search(r"-(\d{2,3})\.", filename)
  if not m:
    return None
  try:
    return int(m.group(1))
  except ValueError:
    return None


def validate_album(album_slug: str) -> tuple[list[str], list[str]]:
  """Return (valid_files, invalid_files)."""
  folder = IMG_ROOT / album_slug
  if not folder.exists():
    return ([], [])

  all_files = [p.name for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
  valid: list[str] = []
  invalid: list[str] = []
  for fn in all_files:
    (valid if _is_valid_name(album_slug, fn) else invalid).append(fn)
  return (sorted(valid), sorted(invalid))

def discover_images(album_slug: str) -> list[str]:
  # Only include VALID files in the gallery output.
  valid, _invalid = validate_album(album_slug)
  files = valid

  def key(name: str):
    idx = _extract_index(name)
    if idx is not None:
      return (0, idx, name.lower())
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

def render_shell(title: str, description: str, inner_html: str, url_path: str) -> str:
  """Shell HTML sesuai pola file galeri yang sudah ada (pakai minified assets).
  Termasuk meta Open Graph/Twitter agar saat di-share keluar thumbnail dan narasi.
  """
  abs_url = f"{SITE_ORIGIN}{url_path}"
  og_image = f"{SITE_ORIGIN}/assets/img/og-default.png"

  return f"""<!DOCTYPE html>

<html lang=\"id\">
<head>
<meta charset=\"utf-8\"/>
<meta content=\"width=device-width, initial-scale=1\" name=\"viewport\"/>
<title>{title}</title>
<meta content=\"{description}\" name=\"description\"/>
<meta content=\"index, follow\" name=\"robots\"/>
<meta content=\"#0f766e\" name=\"theme-color\"/>

<meta content=\"website\" property=\"og:type\"/>
<meta content=\"IKSASS | Ikatan Santri Alumni Salafiyah Syafi’iyah\" property=\"og:site_name\"/>
<meta content=\"{title}\" property=\"og:title\"/>
<meta content=\"{description}\" property=\"og:description\"/>
<meta content=\"{og_image}\" property=\"og:image\"/>
<meta content=\"{abs_url}\" property=\"og:url\"/>
<meta content=\"1200\" property=\"og:image:width\"/>
<meta content=\"630\" property=\"og:image:height\"/>
<meta content=\"id_ID\" property=\"og:locale\"/>

<meta content=\"summary_large_image\" name=\"twitter:card\"/>
<meta content=\"{title}\" name=\"twitter:title\"/>
<meta content=\"{description}\" name=\"twitter:description\"/>
<meta content=\"{og_image}\" name=\"twitter:image\"/>

<link href=\"../assets/img/logo-iksass.png\" rel=\"icon\"/>
<link href=\"../assets/img/logo-iksass.png\" rel=\"apple-touch-icon\"/>

<link as=\"style\" href=\"../assets/css/main.min.css\" rel=\"preload\"/><link href=\"../assets/css/main.min.css\" rel=\"stylesheet\"/>
<link as=\"style\" href=\"../assets/css/design-system.min.css\" rel=\"preload\"/><link href=\"../assets/css/design-system.min.css\" rel=\"stylesheet\"/>
<link href=\"../assets/css/override.min.css\" rel=\"stylesheet\"/>

</head>
<body>
  <header data-include=\"header\"></header>

  <main class=\"page\">
{inner_html}
  </main>

  <footer data-include=\"footer\"></footer>

  <script src=\"../assets/js/include.js\"></script>
  <script src=\"../assets/js/main.js\"></script>
</body>
</html>
""".rstrip()


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

  return render_shell("IKSASS — Galeri", "Galeri IKSASS: Ke-IKSASS-an, Ke-Pesantrenan, Ke-Ilmu-an, dan Dawuh.", inner, "/galeri/")


def render_category_page(cat: dict) -> str:
  """Generate halaman kategori /galeri/<slug>.html secara otomatis dari folder images."""
  title = f"{cat['title']} | Galeri | Ikatan Santri Alumni Salafiyah Syafi’iyah"
  description = cat.get("description") or cat.get("narrative") or "Galeri IKSASS."

  # Filters pills: keep same order and active state
  pills = []
  for c in CATEGORIES:
    active = " is-active" if c["slug"] == cat["slug"] else ""
    pills.append(f"<a class=\"pill{active}\" href=\"{c['slug']}.html\">{c['tag']}</a>")
  pills_html = "".join(pills)

  # Album items
  items = []
  if cat.get("images"):
    for i, fn in enumerate(cat["images"]):
      fetchpriority = " fetchpriority=\"high\"" if i == 0 else ""
      items.append(
        f"<a class=\"album-item\" href=\"../assets/img/galeri/{cat['slug']}/{fn}\" rel=\"noopener\" target=\"_blank\">\n"
        f"<img alt=\"{cat['alt']}\" decoding=\"async\"{fetchpriority} loading=\"lazy\" src=\"../assets/img/galeri/{cat['slug']}/{fn}\"/>\n"
        f"</a>"
      )
  else:
    items.append(
      f"<div class=\"album-empty\">Belum ada foto. Tambahkan file ke <code>assets/img/galeri/{cat['slug']}/</code> lalu jalankan <code>python tools/build_gallery.py</code>.</div>"
    )
  items_html = "\n".join(items)

  inner = f"""
<div class=\"breadcrumb\"><a href=\"../galeri/\" style=\"text-decoration:none;color:inherit;opacity:.9\">Galeri</a> <span style=\"opacity:.6\">/</span> {cat['breadcrumb']}</div>
<h1 class=\"page-title\">{cat['title']}</h1>
<p class=\"page-sub\">{cat['narrative']}</p>
<div class=\"hero-card\" style=\"margin:14px 0 0\"><nav aria-label=\"Navigasi kategori galeri\" class=\"gallery-filters\">{pills_html}</nav></div>
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
<section aria-label=\"Foto album\" class=\"album-grid\">
{items_html}
</section>
""".strip()

  return render_shell(title, description, inner, f"/galeri/{cat['slug']}.html")


def main():
  manifest = []
  categories_render = []

  # Validation (fail-fast): show invalid filenames clearly.
  invalid_map: dict[str, list[str]] = {}
  for cat in CATEGORIES:
    _valid, invalid = validate_album(cat["slug"])
    if invalid:
      invalid_map[cat["slug"]] = invalid

  if invalid_map:
    print("\n[ERROR] Nama file galeri tidak sesuai format yang diwajibkan.")
    print("Format benar: <kategori-slug>-NN.(jpg|jpeg|png|webp) (NN harus 2 digit, contoh: ke-iksass-an-01.jpg)\n")
    for slug, files in invalid_map.items():
      print(f"- {slug}:")
      for fn in files:
        print(f"  • {fn}")
    print("\nPerbaiki nama file di atas, lalu jalankan ulang build.")
    raise SystemExit(1)

  counts: list[tuple[str, int]] = []

  for cat in CATEGORIES:
    images = discover_images(cat["slug"])
    counts.append((cat["title"], len(images)))
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
  # Full-auto: generate each category page too
  for cat in categories_render:
    (GALERI_DIR / f"{cat['slug']}.html").write_text(render_category_page(cat), encoding="utf-8")
  write_manifest(manifest)

  # Summary
  print("\n============================================")
  print("GALLERY BUILD: SELESAI")
  print("============================================")
  total = 0
  for title, n in counts:
    total += n
    print(f"✔ {title:<14}: {n} foto")
  print("--------------------------------------------")
  print(f"TOTAL FOTO         : {total}")
  print(f"KATEGORI           : {len(CATEGORIES)}")
  print("OUTPUT             : galeri/index.html + galeri/<kategori>.html + manifest.json")
  print("============================================\n")

if __name__ == "__main__":
  main()
