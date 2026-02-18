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
import html as html_lib
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
  args = sys.argv[1:]
  no_index = False
  if '--no-index' in args:
    no_index = True
    args = [a for a in args if a != '--no-index']

  if len(args) < 1:
    print("Usage: python tools/berita_generator.py [--no-index] berita/data/new-article.json")
    sys.exit(1)

  data_path = Path(args[0]).resolve()
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
    raise SystemExit("body wajib berupa array, minimal 1 item")

  def normalize_body_items(items: list) -> list[str]:
    """Normalize body blocks into a list of paragraph strings.

    Supported formats:
    - ["Paragraf 1", "Paragraf 2", ...]
    - [{"type":"paragraph","content":"..."}, ...]

    Unknown block types will fail the build to prevent raw JSON leaking into HTML.
    """
    out: list[str] = []
    for i, it in enumerate(items):
      if isinstance(it, str):
        t = it.strip()
        if t:
          out.append(t)
        continue

      if isinstance(it, dict):
        btype = str(it.get("type") or "").strip().lower()
        content = it.get("content")
        if btype in ("paragraph", "p", "text"):
          t = ("" if content is None else str(content)).strip()
          if t:
            out.append(t)
          continue
        raise SystemExit(f"body[{i}] type tidak didukung: {btype!r}. Gunakan type 'paragraph'.")

      raise SystemExit(f"body[{i}] format tidak valid: {type(it).__name__}. Gunakan string atau object paragraph.")

    if not out:
      raise SystemExit("body kosong setelah normalisasi (pastikan ada paragraf)")
    return out

  body_paras = normalize_body_items(body)
  # Image (OG banner generated) + featured image (optional)
  og_rel = f"/assets/img/berita/{slug}.png"
  img_out = OUT_IMG_DIR / f"{slug}.png"
  make_banner(title, subtitle, img_out)
  featured_raw = (data.get("featured_image","") or data.get("image","")).strip()

  def norm_featured(p: str) -> str:
    p = (p or "").strip()
    if not p:
      return ""
    if p.startswith("http://") or p.startswith("https://") or p.startswith("data:"):
      return p
    if p.startswith("/"):
      return p
    if p.startswith("assets/"):
      return "/" + p
    if p.startswith("./assets/"):
      return "/" + p.replace("./", "")
    cleaned = p.lstrip("./").lstrip("/")
    return f"/assets/img/berita/{Path(cleaned).name}"

  featured_rel = norm_featured(featured_raw) or og_rel
  # HTML from template
  tpl = TEMPLATE.read_text(encoding="utf-8")
  page_html = tpl
  page_html = page_html.replace("[JUDUL BERITA]", title)
  page_html = page_html.replace("[Ringkasan 150–160 karakter untuk SEO dan preview share]", description)
  page_html = page_html.replace("[Ringkasan singkat untuk share]", description)
  page_html = page_html.replace("/assets/img/berita/[slug].png", og_rel)
  page_html = page_html.replace("[FEATURED_IMAGE]", featured_rel)
  page_html = page_html.replace("[slug]", slug)
  page_html = page_html.replace("[Subjudul/lead pendek]", subtitle)
  page_html = page_html.replace("[Judul Berita]", title)
  meta_line = f"{location} — {date_display}".strip(" —")
  page_html = page_html.replace("[Lokasi] — [Tanggal, mis: Sabtu (19/4/2026)]", meta_line)
  page_html = page_html.replace("[alt text gambar]", title)
  page_html = page_html.replace("[Caption singkat: waktu/tempat/dokumentasi]", caption)

  # body paragraphs insertion
  # Escape paragraph text to avoid breaking HTML if content contains angle brackets
  paras = "\n".join([f'            <p>{html_lib.escape(p)}</p>' for p in body_paras])

  # Prefer marker replacement (robust across indentation)
  if "<!-- BODY_PARAGRAPHS -->" in page_html:
    page_html = page_html.replace("<!-- BODY_PARAGRAPHS -->", paras)
  else:
    # Backward compat: replace old placeholder block using regex
    page_html = re.sub(r"<p>\[Paragraf 1: lead\]</p>\s*<p>\[Paragraf 2: detail\]</p>\s*<p>\[Paragraf 3: konteks\]</p>\s*<p>\[Paragraf 4: penutup\]</p>", paras, page_html, count=1)

  # Ensure CTA exists (inline, non-floating)
  if 'class="news-cta__btn"' not in page_html:
    cta = """\n\n<!-- CTA (inline, non-floating) -->\n<div class=\"news-cta\" aria-label=\"Ajakan bergabung channel IKSASS\">\n  <div class=\"news-cta__content\">\n    <h3>Gabung Channel IKSASS</h3>\n    <p>Dapatkan update kegiatan, agenda, dan berita terbaru langsung dari IKSASS.</p>\n  </div>\n  <a class=\"news-cta__btn\" href=\"https://whatsapp.com/channel/0029Vb6q9hnKLaHnmhqaR53G\" rel=\"noopener\" target=\"_blank\">\n    <span class=\"news-cta__icon\" aria-hidden=\"true\">WA</span>\n    Gabung Sekarang\n  </a>\n</div>\n"""
    page_html = re.sub(r"\s*</article>", cta + "</article>", page_html, count=1)


  out_dir = ROOT / "berita" / slug
  out_dir.mkdir(parents=True, exist_ok=True)
  (out_dir / "index.html").write_text(page_html, encoding="utf-8")


  # Rebuild berita/news-index.json (single source of truth: berita/data/*.json)
  # By default generator rebuilds the index so:
  # - mega menu hover "Berita" updates
  # - /berita listing updates
  # - sidebar "Terkini/Populer" updates
  #
  # You can disable it via: python tools/berita_generator.py --no-index berita/data/xxx.json
  if not no_index:
    try:
      import subprocess
      idx_builder = ROOT / "tools" / "build_news_index.py"
      if idx_builder.exists():
        subprocess.call([sys.executable, str(idx_builder)], cwd=str(ROOT))
    except Exception:
      pass


  print("OK: dibuat")
  print("-", out_dir / "index.html")
  print("-", img_out)

if __name__ == "__main__":
  main()
