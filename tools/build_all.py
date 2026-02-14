#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_all.py — One-command builder for IKSASS (Windows friendly)

What it does (order is important):
1) Rebuild ALL berita pages by looping every JSON in berita/data/*.json
2) Rebuild galeri pages from assets/img/galeri/* (landing + detail)
3) Rebuild cross-category search index (assets/data/pages-index.json)

Run:
  python tools/build_all.py
"""

from __future__ import annotations
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run_py(script: str, *args: str) -> int:
    path = ROOT / "tools" / script
    if not path.exists():
        print(f"[SKIP] {script} (not found)")
        return 0
    cmd = [sys.executable, str(path), *args]
    print("[RUN] " + " ".join([script, *args]))
    return subprocess.call(cmd, cwd=ROOT)

def build_all_berita() -> None:
    data_dir = ROOT / "berita" / "data"
    gen_path = ROOT / "tools" / "berita_generator.py"

    if not gen_path.exists():
        print("[SKIP] berita_generator.py (not found)")
        return
    if not data_dir.exists():
        print("[SKIP] berita/data/ (folder not found)")
        return

    json_files = sorted([p for p in data_dir.glob("*.json") if p.is_file()])
    if not json_files:
        print("[SKIP] berita/data/*.json (no files)")
        return

    failed = 0
    for jf in json_files:
        code = run_py("berita_generator.py", "--no-index", str(jf.as_posix()))
        if code != 0:
            failed += 1
            print(f"[WARN] gagal generate: {jf.name}")

    if failed:
        # don't hard-stop the whole build; continue to gallery + index
        print(f"[WARN] berita build selesai dengan {failed} error. Lihat log di atas.")
    else:
        print("[OK] semua berita berhasil digenerate")

def main():
    build_all_berita()
    run_py("build_news_index.py")
    run_py("build_gallery.py")
    run_py("build_pages_index.py")
    print("\nOK: build_all selesai")

if __name__ == "__main__":
    main()
