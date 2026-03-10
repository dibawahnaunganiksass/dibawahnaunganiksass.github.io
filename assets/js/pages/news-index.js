(function(){
  const grid = document.querySelector('.news-grid');
  if(!grid) return;

  const fmtDate = (iso) => {
    if(!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if(Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('id-ID', { day:'2-digit', month:'long', year:'numeric' }).format(d);
  };

  const escapeText = (s) => (s ?? '').toString();

  fetch('./news-index.json', { cache: 'no-store' })
    .then(r => {
      if(!r.ok) throw new Error('Gagal memuat indeks berita');
      return r.json();
    })
    .then(items => {
      if(!Array.isArray(items)) throw new Error('Format indeks berita tidak valid');

      // sort terbaru di atas (date_iso desc). fallback ke popular_score jika date sama/empty.
      items.sort((a,b) => {
        const da = (a.date_iso || '');
        const db = (b.date_iso || '');
        if(db !== da) return db.localeCompare(da);
        return (b.popular_score || 0) - (a.popular_score || 0);
      });

      const frag = document.createDocumentFragment();

      items.forEach(item => {
        const slug = escapeText(item.slug).trim();
        const title = escapeText(item.title).trim();
        if(!slug || !title) return;

        const href = `./${slug}/`;
        const SITE_BASE = new URL('../', document.baseURI || location.href).toString();
        const resolveFromSite = (p) => new URL(String(p || '').replace(/^\/+/, ''), SITE_BASE).toString();

        const imgSrcRaw = escapeText(item.image).trim();
        let imgSrc = imgSrcRaw ? imgSrcRaw : 'assets/img/og-default.png';

        // Normalize image source to be safe on domain-root and subfolder deployments.
        if (/^(https?:)?\/\//.test(imgSrc) || imgSrc.startsWith('data:')) {
          // keep absolute / data
        } else if (imgSrc.startsWith('/')) {
          // treat as site-root relative (not domain-root)
          imgSrc = resolveFromSite(imgSrc.slice(1));
        } else {
          // relative like 'assets/...'
          imgSrc = resolveFromSite(imgSrc.replace(/^\.\/?/, ''));
        }
        const excerpt = escapeText(item.excerpt).trim();
        const loc = escapeText(item.location).trim();
        const dateText = fmtDate(escapeText(item.date_iso).trim());
        const meta = (loc && dateText) ? `${loc} • ${dateText}` : (loc || dateText || '');

        const a = document.createElement('a');
        a.className = 'news-card';
        a.href = href;

        const thumb = document.createElement('div');
        thumb.className = 'news-thumb';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = imgSrc;
        img.alt = title;
        thumb.appendChild(img);

        const body = document.createElement('div');
        body.className = 'news-body';

        const h3 = document.createElement('h3');
        h3.className = 'news-title';
        h3.textContent = title;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'news-meta';
        metaDiv.textContent = meta;

        const p = document.createElement('p');
        p.className = 'news-snippet';
        p.textContent = excerpt;

        body.appendChild(h3);
        if(meta) body.appendChild(metaDiv);
        if(excerpt) body.appendChild(p);

        a.appendChild(thumb);
        a.appendChild(body);

        frag.appendChild(a);
      });

      grid.innerHTML = '';
      grid.appendChild(frag);
    })
    .catch(() => {
      grid.innerHTML = '<p class="news-error">Daftar berita tidak dapat dimuat saat ini.</p>';
    });
})();
