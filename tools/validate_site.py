#!/usr/bin/env python3
"""IKSASS Site Validator (no-chaos)
Checks:
- No 'Mengarahkan ke ...' placeholder pages in public HTML
- Internal links resolve to existing files (folder/index.html or .html)
- News data JSON required fields
- News index is sync & sorted desc by date_iso
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]

def fail(msg:str)->None:
    print(f"[FAIL] {msg}")
    sys.exit(1)

def warn(msg:str)->None:
    print(f"[WARN] {msg}")

def ok(msg:str)->None:
    print(f"[OK] {msg}")

def is_public_html(p:Path)->bool:
    rel = p.relative_to(ROOT).as_posix()
    return p.suffix=='.html' and not rel.startswith(('assets/','partials/','tools/'))

def resolve_internal(href:str, base:Path)->Path|None:
    if href.startswith(('http://','https://','mailto:','tel:','#')):
        return None
    href = href.split('#')[0].split('?')[0]
    if not href:
        return None
    if href.startswith('/'):
        rel = href.lstrip('/')
        # folder route
        cand = ROOT/rel/'index.html'
        if (ROOT/rel).is_dir() and cand.exists():
            return cand
        cand2 = ROOT/rel
        if cand2.exists() and cand2.is_file():
            return cand2
        # allow .html
        cand3 = ROOT/(rel.rstrip('/') + '.html')
        if cand3.exists():
            return cand3
        return ROOT/rel  # missing marker
    # relative
    target = (base.parent / href).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except Exception:
        return None
    if target.is_dir():
        idx = target/'index.html'
        return idx if idx.exists() else idx
    if target.exists():
        return target
    # allow missing slash folder
    if not target.suffix and (target/'index.html').exists():
        return target/'index.html'
    # allow .html
    if not target.suffix and (target.with_suffix('.html')).exists():
        return target.with_suffix('.html')
    return target

def main()->None:
    # 1) Placeholder pages
    bad = []
    for p in ROOT.rglob('*.html'):
        if not is_public_html(p):
            continue
        txt = p.read_text(encoding='utf-8', errors='ignore').strip()
        if txt.startswith('Mengarahkan ke'):
            bad.append(p.relative_to(ROOT).as_posix())
    if bad:
        fail('Placeholder redirect pages found: ' + ', '.join(bad[:10]) + ('...' if len(bad)>10 else ''))
    ok('No placeholder redirect pages')

    # 2) Link check (basic)
    broken = []
    for p in ROOT.rglob('*.html'):
        if not is_public_html(p):
            continue
        txt = p.read_text(encoding='utf-8', errors='ignore')
        for m in re.finditer(r'href="([^"]+)"', txt):
            href = m.group(1)
            res = resolve_internal(href, p)
            if res is None:
                continue
            if not res.exists():
                broken.append((p.relative_to(ROOT).as_posix(), href))
    if broken:
        sample = '; '.join([f"{a} -> {b}" for a,b in broken[:12]])
        fail(f"Broken internal links ({len(broken)}). Sample: {sample}")
    ok('Internal links resolve')

    # 3) News JSON validation
    data_dir = ROOT/'berita'/'data'
    if data_dir.exists():
        required = {'slug','date_iso','date_display','body','description','caption'}
        for jp in data_dir.glob('*.json'):
            obj = json.loads(jp.read_text(encoding='utf-8'))
            miss = required - set(obj.keys())
            if miss:
                fail(f"{jp.name} missing fields: {sorted(miss)}")
            if not isinstance(obj.get('body'), list):
                fail(f"{jp.name} body must be array of paragraphs")
        ok('News JSON fields OK')
    else:
        warn('No berita/data directory found')

    # 4) News index sort
    idxp = ROOT/'berita'/'news-index.json'
    if idxp.exists():
        idx = json.loads(idxp.read_text(encoding='utf-8'))
        dates = [it.get('date_iso','') for it in idx]
        # verify parseable and sorted desc
        parsed = []
        for d in dates:
            try:
                parsed.append(datetime.strptime(d,'%Y-%m-%d'))
            except Exception:
                fail(f"Invalid date_iso in news-index.json: {d}")
        if parsed != sorted(parsed, reverse=True):
            fail('news-index.json is not sorted by date_iso desc')
        ok('News index sorted desc')
    else:
        warn('No berita/news-index.json found')

    ok('All checks passed')

if __name__=='__main__':
    main()
