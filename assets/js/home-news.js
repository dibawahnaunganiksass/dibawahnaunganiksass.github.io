(() => {
  // Resolve paths safely no matter where the site is hosted (domain root, subfolder, local preview).
  // Using document.baseURI prevents brittle "../" guessing that can break when the project is opened
  // from a subfolder like /IKSASS/index.html.
  const BASE_URI = document.baseURI || location.href;
  const resolveUrl = (path = '') => new URL(String(path), BASE_URI).toString();

  const newsRootEl = document.querySelector('[data-home-news]');
  const metaEl = document.querySelector('[data-home-news-meta]');

  const statEls = Array.from(document.querySelectorAll('[data-home-stat]'));
  const setStat = (key, value) => {
    for (const el of statEls) {
      if (el.getAttribute('data-home-stat') === key) el.textContent = String(value);
    }
  };

  const esc = (s = '') => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const normalizeImage = (src = '') => {
    const v = String(src || '').trim();
    if (!v) return resolveUrl('assets/img/og-default.png');
    if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:')) return v;
    // If source starts with "/" treat it as project-root relative, not domain-root.
    if (v.startsWith('/')) return resolveUrl(v.slice(1));
    // If someone ever passes relative path, anchor it to project root.
    return resolveUrl(v.replace(/^\.+\//, ''));
  };

  const renderCard = (item, { featured = false } = {}) => {
    const href = resolveUrl(`berita/${esc(item.slug)}/`);
    const img = normalizeImage(item.image);

    // Home card meta matches existing homepage markup
    const metaParts = [];
    if (item.location) metaParts.push(item.location);
    if (item.date_display) metaParts.push(item.date_display);
    const meta = metaParts.join(' • ');

    const cls = featured ? 'news-card is-featured' : 'news-card';

    return `
      <a class="${cls}" href="${href}">
        <div class="news-thumb">
          <img src="${esc(img)}" alt="${esc(item.title)}" loading="lazy" decoding="async" width="1200" height="675">
        </div>
        <div class="news-body">
          <p class="news-title">${esc(item.title)}</p>
          ${item.excerpt ? `<p class="news-snippet">${esc(item.excerpt)}</p>` : ''}
          ${meta ? `<div class="news-meta">${esc(meta)}</div>` : ''}
        </div>
      </a>
    `;
  };

  const renderNews = (list) => {
    if (!newsRootEl) return;

    const safeList = Array.isArray(list) ? list : [];
    const normalized = safeList
      .filter((x) => x && typeof x === 'object' && x.slug && x.title)
      .map((x) => ({
        ...x,
        _dateMs: x.date_iso ? Date.parse(String(x.date_iso) + 'T00:00:00Z') : 0,
        _pop: Number(x.popular_score || 0) || 0,
      }));

    // Sort by newest date, fallback to popular_score
    normalized.sort((a, b) => (b._dateMs - a._dateMs) || (b._pop - a._pop));

    const top = normalized.slice(0, 3);

    if (!top.length) {
      newsRootEl.innerHTML = '<p class="news-snippet">Berita belum tersedia.</p>';
      if (metaEl) metaEl.textContent = 'Belum ada pembaruan.';
      setStat('berita', 0);
      return;
    }

    newsRootEl.innerHTML = top
      .map((item, idx) => renderCard(item, { featured: idx === 0 }))
      .join('');

    if (metaEl) {
      const newest = top[0];
      const total = normalized.length;
      const d = newest && newest._dateMs ? new Date(newest._dateMs) : null;
      const dateText = d
        ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)
        : (newest.date_display || '—');
      metaEl.textContent = `Terakhir diperbarui: ${dateText} • Total publikasi: ${total} berita`;
    }

    setStat('berita', normalized.length);
  };

  const renderSiteStats = (pagesIndex) => {
    const arr = Array.isArray(pagesIndex) ? pagesIndex : [];
    const byCategory = arr.reduce((acc, item) => {
      const key = (item && item.category) ? String(item.category) : '';
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Empat angka (dinamis dari JSON)
    setStat('kelembagaan', byCategory['Kelembagaan'] || 0);
    setStat('profil', byCategory['Profil'] || 0);
    setStat('dokumen', byCategory['Dokumen'] || 0);
  };

  // Skeleton placeholders (keeps layout stable on slow connections)
  if (newsRootEl) {
    const skeletonCount = 3;
    newsRootEl.innerHTML = Array.from({ length: skeletonCount }).map(() => {
      return `
        <div class="news-card" aria-hidden="true">
          <div class="news-thumb" style="background: var(--bg-soft);"></div>
          <div class="news-body">
            <p class="news-title" style="background: var(--bg-soft); height: 14px; border-radius: 8px; margin-bottom: 10px;"></p>
            <p class="news-snippet" style="background: var(--bg-soft); height: 12px; border-radius: 8px;"></p>
            <div class="news-meta" style="background: var(--bg-soft); height: 10px; border-radius: 8px; width: 40%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Pre-fill stats with dash for consistent layout
  setStat('berita', '—');
  setStat('kelembagaan', '—');
  setStat('profil', '—');
  setStat('dokumen', '—');

  const fetchJson = (url) =>
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Gagal memuat ' + url))));

  const newsUrl = resolveUrl('berita/news-index.json');
  const pagesUrl = resolveUrl('assets/data/pages-index.json');

  Promise.all([
    fetchJson(newsUrl).catch(() => null),
    fetchJson(pagesUrl).catch(() => null),
  ])
    .then(([newsList, pagesIndex]) => {
      if (newsList) renderNews(newsList);
      else {
        if (newsRootEl) newsRootEl.innerHTML = '<p class="news-snippet">Berita belum tersedia.</p>';
        if (metaEl) metaEl.textContent = 'Gagal memuat pembaruan.';
        setStat('berita', 0);
      }

      if (pagesIndex) renderSiteStats(pagesIndex);
      else {
        setStat('kelembagaan', 0);
        setStat('profil', 0);
        setStat('dokumen', 0);
      }
    })
    .catch(() => {
      if (newsRootEl) newsRootEl.innerHTML = '<p class="news-snippet">Berita belum tersedia.</p>';
      if (metaEl) metaEl.textContent = 'Gagal memuat pembaruan.';
      setStat('berita', 0);
      setStat('kelembagaan', 0);
      setStat('profil', 0);
      setStat('dokumen', 0);
    });
})();
