"""Build pages index for site-wide search.

Output: assets/data/pages-index.json

This index complements berita/news-index.json.
It includes non-berita HTML pages and document (PDF) links so
the search can work lintas kategori.

Usage:
  python tools/build_pages_index.py
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "data" / "pages-index.json"


EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "partials",
    "assets",
    "berita",  # berita diindeks dari berita/news-index.json
    "auth",  # halaman auth biasanya tidak relevan untuk search publik
}

EXCLUDE_FILES = {
    "search.html",  # halaman pencarian itu sendiri
}


def _clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def _guess_category_from_path(rel: str) -> str:
    # rel example: profil/visi-misi.html
    first = rel.split("/", 1)[0] if "/" in rel else rel
    mapping = {
        "profil": "Profil",
        "tentang": "Tentang",
        "kelembagaan": "Kelembagaan",
        "agenda": "Agenda",
        "dokumen": "Dokumen",
        "galeri": "Galeri",
        "info": "Info",
        "kontak": "Kontak",
        "wasiat": "Wasiat",
    }
    if rel == "faq.html":
        return "FAQ"
    if rel == "kebijakan-privasi.html":
        return "Kebijakan"
    if rel == "index.html":
        return "Beranda"
    return mapping.get(first, "Halaman")


def _to_url(rel_path: str) -> str:
    # Convert file path to site URL used by search.js (relative to root)
    if rel_path.endswith("/index.html"):
        return rel_path[: -len("index.html")]
    if rel_path == "index.html":
        return ""
    return rel_path


def _extract_title_and_excerpt(html: str) -> Tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")

    # Title: prefer H1
    h1 = soup.find("h1")
    title = _clean_text(h1.get_text(" ")) if h1 else ""
    if not title:
        t = soup.find("title")
        title = _clean_text(t.get_text(" ")) if t else ""

    # Excerpt: prefer meta description
    desc = ""
    m = soup.find("meta", attrs={"name": "description"})
    if m and m.get("content"):
        desc = _clean_text(m.get("content", ""))
    if not desc:
        # Try first meaningful paragraph in main/section
        main = soup.find("main") or soup.find(id="konten") or soup.body
        p = main.find("p") if main else None
        if p:
            desc = _clean_text(p.get_text(" "))

    # Limit excerpt length for nicer UI
    if len(desc) > 180:
        desc = desc[:180].rstrip() + "…"

    return title, desc


def _build_tags(rel_path: str, title: str, category: str) -> List[str]:
    tokens = []
    tokens.extend([p for p in re.split(r"[/._-]+", rel_path) if p and p != "html"])
    tokens.extend([p for p in re.split(r"\s+", title) if p])
    tokens.append(category)

    out = []
    seen = set()
    for t in tokens:
        t = t.strip().lower()
        t = re.sub(r"[^a-z0-9]+", "-", t)
        t = re.sub(r"-+", "-", t).strip("-")
        if not t or len(t) < 2:
            continue
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def _index_html_pages() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT).as_posix()

        # Exclude paths
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue
        if Path(rel).name in EXCLUDE_FILES:
            continue

        # Skip berita templates just in case
        if rel.startswith("berita/"):
            continue

        try:
            html = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        title, excerpt = _extract_title_and_excerpt(html)
        url = _to_url(rel)
        category = _guess_category_from_path(rel)
        tags = _build_tags(rel, title, category)

        # Avoid empty title entries
        if not title:
            # fallback from filename
            title = Path(rel).stem.replace("-", " ").title()

        items.append(
            {
                "title": title,
                "url": url,
                "excerpt": excerpt,
                "category": category,
                "tags": tags,
            }
        )

    return items


def _index_document_links() -> List[Dict[str, Any]]:
    """Index PDF links listed in dokumen/index.html (and PDFs in folder)."""
    items: List[Dict[str, Any]] = []
    dok_index = ROOT / "dokumen" / "index.html"
    if not dok_index.exists():
        return items

    html = dok_index.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")

    # Index anchor links to PDFs
    for a in soup.find_all("a"):
        href = (a.get("href") or "").strip()
        if not href.lower().endswith(".pdf"):
            continue
        text = _clean_text(a.get_text(" "))
        if not text:
            text = Path(href).stem.replace("-", " ").title()
        url = href.lstrip("./")
        if url.startswith("/"):
            url = url[1:]
        items.append(
            {
                "title": text,
                "url": f"dokumen/{Path(url).name}" if not url.startswith("dokumen/") else url,
                "excerpt": "Dokumen PDF (klik untuk membuka).",
                "category": "Dokumen",
                "tags": _build_tags(f"dokumen/{Path(url).name}", text, "Dokumen"),
            }
        )

    # Also include PDFs physically present even if not linked
    for pdf in (ROOT / "dokumen").glob("*.pdf"):
        rel = pdf.relative_to(ROOT).as_posix()
        if any(it["url"] == rel for it in items):
            continue
        title = pdf.stem.replace("-", " ").title()
        items.append(
            {
                "title": title,
                "url": rel,
                "excerpt": "Dokumen PDF (klik untuk membuka).",
                "category": "Dokumen",
                "tags": _build_tags(rel, title, "Dokumen"),
            }
        )

    return items


def main() -> None:
    items = _index_html_pages()
    items.extend(_index_document_links())

    # De-duplicate by URL
    seen = set()
    deduped = []
    for it in items:
        u = it.get("url")
        if not u or u in seen:
            continue
        seen.add(u)
        deduped.append(it)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(deduped, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(deduped)} items -> {OUT}")


if __name__ == "__main__":
    main()
