(() => {
  const rootEl = document.querySelector('[data-news-list]');
  if (!rootEl) return;

  const getRootPrefix = () => {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  };
  const ROOT_PREFIX = getRootPrefix();

  const normUrl = (u) => {
    const v = String(u || "").trim();
    if (!v) return ROOT_PREFIX + "assets/img/og-default.png";
    if (/^(https?:)?\/\//i.test(v) || v.startsWith("data:")) return v;
    if (v.startsWith("/")) return ROOT_PREFIX + v.slice(1);
    if (v.startsWith("assets/")) return ROOT_PREFIX + v;
    if (v.startsWith("./assets/")) return ROOT_PREFIX + v.replace(/^\.\//, "");
    // fallback: anchor to root
    return ROOT_PREFIX + v.replace(/^\.+\//, "");
  };

  const esc = (s='') => String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  const fmt = (item) => {
    const metaParts = [];
    if (item.location) metaParts.push(item.location);
    if (item.date_display) metaParts.push(item.date_display);
    const meta = metaParts.join(' • ');

    return `
      <article class="news-card">
        <a class="news-card__img" href="./${esc(item.slug)}/index.html" aria-label="${esc(item.title)}">
          <img src="${esc(normUrl(item.image))}" alt="${esc(item.title)}" width="1200" height="630" loading="lazy" decoding="async">
        </a>
        <div class="news-card__body">
          <h3 class="news-card__title"><a href="./${esc(item.slug)}/index.html">${esc(item.title)}</a></h3>
          ${meta ? `<p class="news-card__meta">${esc(meta)}</p>` : ``}
          ${item.excerpt ? `<p class="news-card__excerpt">${esc(item.excerpt)}</p>` : ``}
          <a class="news-card__more" href="./${esc(item.slug)}/index.html">Baca selengkapnya →</a>
        </div>
      </article>
    `;
  };

  fetch('./news-index.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Gagal memuat news-index.json')))
    .then(list => {
      rootEl.innerHTML = list.map(fmt).join('');
    })
    .catch(() => {
      rootEl.innerHTML = '<p>Daftar berita belum tersedia.</p>';
    });
})();