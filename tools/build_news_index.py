#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_news_index.py — Rebuild berita/news-index.json from berita/data/*.json

This powers:
- Mega menu hover "Berita" (thumbnail + excerpt)
- Listing /berita
- Sidebar "Berita Terkini" & "Berita Populer"

Best-practice goals:
- Single source of truth: berita/data/*.json -> berita/news-index.json
- Image normalization + sensible fallback to OG banner (/assets/img/berita/<slug>.png)
- Sorting is driven by date_iso (YYYY-MM-DD). Missing date_iso is allowed, but will be warned and sorted last.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime
import re

ROOT = Path(__file__).resolve().parents[1]

MONTHS_ID = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
]

DATE_DMY_RE = re.compile(r"(?P<d>\d{1,2})\s*[\/\-]\s*(?P<m>\d{1,2})\s*[\/\-]\s*(?P<y>\d{4})")

def slugify(s: str) -> str:
    s = (s or '').lower().strip()
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def fmt_date_display(iso: str) -> str:
    try:
        d = datetime.strptime(iso, "%Y-%m-%d")
    except Exception:
        return ""
    return f"{d.day} {MONTHS_ID[d.month-1]} {d.year}"

def parse_date_iso_from_text(text: str) -> str:
    """Try to infer YYYY-MM-DD from a free-text date like 'Selasa (11/11/2025)' or '11-11-2025'."""
    if not text:
        return ""
    m = DATE_DMY_RE.search(text)
    if not m:
        return ""
    d = int(m.group('d'))
    mm = int(m.group('m'))
    y = int(m.group('y'))
    try:
        return datetime(y, mm, d).strftime("%Y-%m-%d")
    except Exception:
        return ""

def norm_image(path: str) -> str:
    """Normalize image paths to be site-root absolute.

    Project convention:
    - News thumbnails live in /assets/img/berita/
    - Some older JSON entries used '/<filename>' (root) or just '<filename>'.
      Those should be rewritten to '/assets/img/berita/<filename>' when the file exists.
    """
    p = (path or "").strip()
    if not p:
        return ""

    # keep absolute URLs / data URIs
    if p.startswith("http://") or p.startswith("https://") or p.startswith("data:"):
        return p

    berita_assets = ROOT / "assets" / "img" / "berita"

    def map_if_exists(filename: str) -> str:
        fn = (filename or "").lstrip("/")
        if not fn:
            return ""
        # Prevent directory traversal; only allow basename mapping
        base = Path(fn).name
        if (berita_assets / base).exists():
            return f"/assets/img/berita/{base}"
        return ""

    # root-absolute paths
    if p.startswith("/"):
        # If it's just '/filename.ext' and we have it under assets/img/berita, remap it
        if p.count("/") == 1:
            mapped = map_if_exists(p)
            if mapped:
                return mapped
        return p

    # common site-relative variants
    if p.startswith("assets/"):
        return "/" + p
    if p.startswith("./assets/"):
        return "/" + p.replace("./", "")

    # If it's a bare filename (or relative path), try mapping by basename into assets/img/berita
    mapped = map_if_exists(p)
    if mapped:
        return mapped

    # fallback: strip leading ./ or ../ then root it
    return "/" + p.lstrip("./").lstrip("../")

def excerpt_from_body(body) -> str:
    if isinstance(body, list) and body:
        first = str(body[0]).strip()
        return first if len(first) <= 180 else first[:177].rstrip() + "…"
    if isinstance(body, str) and body.strip():
        s = body.strip()
        return s if len(s) <= 180 else s[:177].rstrip() + "…"
    return ""

def main() -> int:
    data_dir = ROOT / "berita" / "data"
    out_path = ROOT / "berita" / "news-index.json"
    og_dir = ROOT / "assets" / "img" / "berita"

    items = []
    if not data_dir.exists():
        print("[SKIP] berita/data/ tidak ditemukan")
        return 0

    json_files = sorted([p for p in data_dir.glob("*.json") if p.is_file()])
    if not json_files:
        print("[SKIP] berita/data/*.json (no files)")
        return 0

    warned_missing_date = 0

    for jf in json_files:
        try:
            obj = json.loads(jf.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[WARN] JSON invalid: {jf.name} ({e})")
            continue

        title = (obj.get("title") or "").strip()
        slug = (obj.get("slug") or slugify(title) or jf.stem or "").strip()
        if not slug or not title:
            print(f"[WARN] skip: {jf.name} (slug/title kosong)")
            continue

        date_iso = (obj.get("date_iso") or obj.get("date") or "").strip()
        date_display = (obj.get("date_display") or "").strip()
        location = (obj.get("location") or "").strip()

        # Infer date_iso if missing (from date_display/caption)
        if not date_iso:
            date_iso = parse_date_iso_from_text(date_display) or parse_date_iso_from_text(str(obj.get("caption") or ""))
            if not date_iso:
                warned_missing_date += 1
                print(f"[WARN] {jf.name} missing date_iso (YYYY-MM-DD) -> akan tampil, tapi bisa tidak masuk 'Terkini'")

        # image field varies across generator versions
        image = obj.get("image") or obj.get("featured_image") or ""
        image = norm_image(str(image))

        # Fallback: if missing image, use OG banner if exists; otherwise use shared default
        if not image:
            og_candidate = og_dir / f"{slug}.png"
            if og_candidate.exists():
                image = f"/assets/img/berita/{slug}.png"
            else:
                image = "/assets/img/berita/default-berita.jpg"

        # excerpt field varies
        excerpt = (obj.get("excerpt") or obj.get("description") or "").strip()
        if not excerpt:
            excerpt = excerpt_from_body(obj.get("body"))

        if date_iso and not date_display:
            date_display = fmt_date_display(date_iso)

        popular_score = obj.get("popular_score")
        if not isinstance(popular_score, (int, float)):
            popular_score = 0

        items.append({
            "slug": slug,
            "title": title,
            "excerpt": excerpt,
            "date_iso": date_iso,
            "date_display": date_display,
            "location": location,
            "image": image,
            "popular_score": popular_score,
        })

    # Sort newest first (string compare works for YYYY-MM-DD); empty date_iso goes last.
    items.sort(key=lambda x: (x.get("date_iso") or "0000-00-00"), reverse=True)

    out_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] news-index.json rebuilt: {len(items)} items")
    if warned_missing_date:
        print(f"[INFO] {warned_missing_date} item tanpa date_iso. Isi date_iso agar masuk 'Berita Terkini'.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())