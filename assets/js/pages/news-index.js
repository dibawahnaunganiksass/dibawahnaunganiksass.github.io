import { formatDateBadgeID, formatDateIDLong, normalizeNewsItems, resolveImageUrl, sortNewsLatest } from '../core/content-utils.js';

(() => {
  const grid = document.querySelector('[data-news-grid]');
  if (!grid) return;

  const totalEl = document.querySelector('[data-news-total]');
  const latestEl = document.querySelector('[data-news-latest]');
  const summaryEl = document.querySelector('[data-news-summary]');
  const sortEl = document.querySelector('[data-news-sort]');

  function renderSkeletons(count = 8) {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const card = document.createElement('div');
      card.className = 'news-card news-card--skeleton';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = `
        <div class="news-thumb"></div>
        <div class="news-body">
          <div>
            <div class="news-skeleton-line"></div>
            <div class="news-skeleton-line"></div>
            <div class="news-skeleton-meta"></div>
          </div>
          <div>
            <div class="news-skeleton-line"></div>
            <div class="news-skeleton-line"></div>
          </div>
          <div class="news-skeleton-cta"></div>
        </div>
      `;
      fragment.appendChild(card);
    }
    grid.innerHTML = '';
    grid.appendChild(fragment);
  }

  function renderNews(items) {
    if (totalEl) totalEl.textContent = `${items.length} publikasi tersedia`;
    if (sortEl) sortEl.textContent = 'Urut berdasarkan tanggal publikasi terbaru.';

    const latestItem = items[0];
    const latestText = latestItem && latestItem.date_iso ? formatDateIDLong(latestItem.date_iso) : '';
    if (latestEl) latestEl.textContent = latestText ? `Pembaruan terakhir: ${latestText}` : 'Pembaruan terakhir belum tersedia';
    if (summaryEl) {
      summaryEl.textContent = latestText
        ? `Menampilkan ${items.length} berita. Publikasi terbaru tercatat pada ${latestText}.`
        : `Menampilkan ${items.length} berita IKSASS.`;
    }

    if (!items.length) {
      grid.innerHTML = '<p class="news-empty">Belum ada publikasi berita yang dapat ditampilkan saat ini.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const rootPrefix = window.__IKSASS_ROOT_PREFIX || '../';

    items.forEach((item) => {
      const card = document.createElement('a');
      card.className = 'news-card';
      card.href = `./${item.slug}/`;
      card.setAttribute('aria-label', `Baca berita: ${item.title}`);

      const thumb = document.createElement('div');
      thumb.className = 'news-thumb';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = resolveImageUrl(item.image || 'assets/img/og-default.png', rootPrefix);
      img.alt = item.title;
      thumb.appendChild(img);

      const badgeData = formatDateBadgeID(item.date_iso);
      if (badgeData) {
        const badge = document.createElement('div');
        badge.className = 'news-date-badge';
        badge.innerHTML = `<strong>${badgeData.day}</strong><span>${badgeData.month}</span>`;
        thumb.appendChild(badge);
      }

      const body = document.createElement('div');
      body.className = 'news-body';

      const title = document.createElement('h3');
      title.className = 'news-title';
      title.textContent = item.title;
      body.appendChild(title);

      const metaParts = [];
      if (item.location) metaParts.push(item.location);
      if (item.date_iso) metaParts.push(formatDateIDLong(item.date_iso));
      if (metaParts.length) {
        const meta = document.createElement('p');
        meta.className = 'news-meta';
        meta.textContent = metaParts.join(' • ');
        body.appendChild(meta);
      }

      if (item.excerpt) {
        const excerpt = document.createElement('p');
        excerpt.className = 'news-snippet';
        excerpt.textContent = item.excerpt;
        body.appendChild(excerpt);
      }

      const more = document.createElement('span');
      more.className = 'news-card__more';
      more.textContent = 'Baca selengkapnya';
      body.appendChild(more);

      card.appendChild(thumb);
      card.appendChild(body);
      fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
  }

  renderSkeletons();

  fetch('./news-index.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Gagal memuat indeks berita');
      return response.json();
    })
    .then((items) => renderNews(sortNewsLatest(normalizeNewsItems(items))))
    .catch(() => {
      if (totalEl) totalEl.textContent = 'Publikasi belum dapat dimuat';
      if (latestEl) latestEl.textContent = 'Silakan coba muat ulang halaman';
      if (summaryEl) summaryEl.textContent = 'Daftar berita sedang mengalami kendala pemuatan.';
      grid.innerHTML = '<p class="news-error">Daftar berita tidak dapat dimuat saat ini.</p>';
    });
})();
