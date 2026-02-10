#!/usr/bin/env python3
"""
IKSASS News Generator (offline)
- Creates a new berita/<slug>/index.html from template
- Creates featured OG image 1200x630 in assets/img/berita/<slug>.png
- Updates og:image + twitter:image in the generated page to the slug image

Usage:
  python tools/berita_generator.py berita/data/new-article.json

JSON schema (example):
{
  "slug": "contoh-judul-berita",
  "title": "Judul Berita",
  "subtitle": "Lead singkat (1 kalimat)",
  "location": "Sukorejo",
  "date_display": "Selasa (11/11/2025)",
  "caption": "Sukorejo • 11 November 2025. Dokumentasi kegiatan IKSASS.",
  "description": "Ringkasan 150–160 karakter untuk SEO dan preview share.",
  "body": [
    "Paragraf 1...",
    "Paragraf 2...",
    "Paragraf 3..."
  ]
}
"""
from __future__ import annotations
import json, os, sys, re
from pathlib import Path

try:
  from PIL import Image, ImageDraw, ImageFont
except Exception as e:
  print("Pillow belum terpasang. Install: pip install pillow")
  raise

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "berita" / "template-berita.html"
LOGO = ROOT / "assets" / "img" / "logo-iksass.png"
OUT_IMG_DIR = ROOT / "assets" / "img" / "berita"

def slugify(s: str) -> str:
  s = s.lower().strip()
  s = re.sub(r"[’']", "", s)
  s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
  return s

def load_font(name: str, size: int):
  try:
    return ImageFont.truetype(name, size)
  except Exception:
    return ImageFont.load_default()

def wrap_text(draw, text, font, max_width):
  words = text.split()
  lines=[]
  line=[]
  for w in words:
    test=" ".join(line+[w])
    bbox=draw.textbbox((0,0), test, font=font)
    if (bbox[2]-bbox[0]) <= max_width:
      line.append(w)
    else:
      if line: lines.append(" ".join(line))
      line=[w]
  if line: lines.append(" ".join(line))
  return lines

def make_banner(title: str, subtitle: str, outpath: Path):
  W,H = 1200,630
  img = Image.new("RGB",(W,H),(248,250,252))
  draw = ImageDraw.Draw(img)

  logo = Image.open(LOGO).convert("RGBA")
  max_logo=120
  scale=min(max_logo/logo.width, max_logo/logo.height)
  lsize=(int(logo.width*scale), int(logo.height*scale))
  logo = logo.resize(lsize, Image.LANCZOS)
  img.paste(logo,(80,80),logo)

  font_title = load_font("DejaVuSans-Bold.ttf", 48)
  font_sub = load_font("DejaVuSans.ttf", 26)

  x=80
  y=220
  maxw=W-160
  lines=wrap_text(draw, title, font_title, maxw)[:3]
  for i,line in enumerate(lines):
    draw.text((x, y+i*62), line, fill=(15,118,110), font=font_title)

  sub_y=y+len(lines)*62+20
  draw.text((x, sub_y), subtitle, fill=(71,85,105), font=font_sub)

  draw.line((80, H-120, W-80, H-120), fill=(226,232,240), width=2)
  draw.text((80, H-95), "IKSASS • Berita", fill=(100,116,139), font=font_sub)

  outpath.parent.mkdir(parents=True, exist_ok=True)
  img.save(outpath)

def main():
  if len(sys.argv) < 2:
    print("Usage: python tools/berita_generator.py berita/data/new-article.json")
    sys.exit(1)

  data_path = Path(sys.argv[1]).resolve()
  data = json.loads(data_path.read_text(encoding="utf-8"))

  title = data.get("title","").strip()
  if not title:
    raise SystemExit("title wajib diisi")
  slug = data.get("slug") or slugify(title)
  subtitle = data.get("subtitle","").strip() or "IKSASS • Berita"
  location = data.get("location","").strip()
  date_display = data.get("date_display","").strip()
  caption = data.get("caption","").strip() or (subtitle + ". Dokumentasi kegiatan IKSASS.")
  description = data.get("description","").strip() or (title + " — informasi resmi dari IKSASS.")
  body = data.get("body",[])
  if not isinstance(body, list) or not body:
    raise SystemExit("body wajib berupa array paragraf, minimal 1 paragraf")
  # Image (OG banner generated) + featured image (optional)
  og_rel = f"/assets/img/berita/{slug}.png"
  img_out = OUT_IMG_DIR / f"{slug}.png"
  make_banner(title, subtitle, img_out)
  featured_raw = (data.get("featured_image","") or data.get("image","")).strip()
  if featured_raw and not featured_raw.startswith("/"):
    # allow filename only
    cleaned = featured_raw.lstrip("./")
    featured_rel = f"/assets/img/berita/{cleaned}"
  else:
    featured_rel = featured_raw or og_rel
  # HTML from template
  tpl = TEMPLATE.read_text(encoding="utf-8")
  html = tpl
  html = html.replace("[JUDUL BERITA]", title)
  html = html.replace("[Ringkasan 150–160 karakter untuk SEO dan preview share]", description)
  html = html.replace("[Ringkasan singkat untuk share]", description)
  html = html.replace("/assets/img/berita/[slug].png", og_rel)
  html = html.replace("[FEATURED_IMAGE]", featured_rel)
  html = html.replace("[slug]", slug)
  html = html.replace("[Subjudul/lead pendek]", subtitle)
  html = html.replace("[Judul Berita]", title)
  meta_line = f"{location} — {date_display}".strip(" —")
  html = html.replace("[Lokasi] — [Tanggal, mis: Sabtu (19/4/2026)]", meta_line)
  html = html.replace("[alt text gambar]", title)
  html = html.replace("[Caption singkat: waktu/tempat/dokumentasi]", caption)

  # body paragraphs insertion
  paras = "\n".join([f'            <p>{p}</p>' for p in body])
  html = html.replace("            <p>[Paragraf 1: lead]</p>\n            <p>[Paragraf 2: detail]</p>\n            <p>[Paragraf 3: konteks]</p>\n            <p>[Paragraf 4: penutup]</p>", paras)

  out_dir = ROOT / "berita" / slug
  out_dir.mkdir(parents=True, exist_ok=True)
  (out_dir / "index.html").write_text(html, encoding="utf-8")


  # Update berita/news-index.json (listing)
  idx_path = ROOT / "berita" / "news-index.json"
  try:
    idx = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else []
  except Exception:
    idx = []
  entry = {
    "slug": slug,
    "title": title,
    "excerpt": (body[0][:140] + "…") if body else "",
    "date_iso": data.get("date_iso",""),
    "date_display": date_display,
    "location": location,
    "image": featured_rel
  }
  # remove existing same slug
  idx = [e for e in idx if e.get("slug") != slug]
  idx.append(entry)
  # sort by date_iso desc if available
  def key(e):
    return e.get("date_iso","")
  idx.sort(key=key, reverse=True)
  idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")

  print("OK: dibuat")
  print("-", out_dir / "index.html")
  print("-", img_out)

if __name__ == "__main__":
  main()
