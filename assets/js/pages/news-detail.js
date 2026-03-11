import { formatDateIDLong, resolveImageUrl } from '../core/content-utils.js';
import { getCurrentNewsSlug, getNewsIndex } from '../core/news-data.js';
import { initShareBlocks } from '../core/share.js';

function renderList(items, labelText, rootPrefix) {
  return `<ul class="sidebar-news">${items.map((item) => {
    const href = `${rootPrefix}berita/${item.slug}/`;
    const dateText = item.date_display || formatDateIDLong(item.date_iso) || '';
    const excerpt = item.excerpt || item.description || '';
    return `
<li class="sidebar-news__item">
  <div class="sidebar-news__thumb">
    <img src="${resolveImageUrl(item.image || 'assets/img/og-default.png', rootPrefix)}" alt="" loading="lazy" decoding="async"/>
  </div>
  <div class="sidebar-news__body">
    <div class="sidebar-news__meta">
      <span class="sidebar-label">${labelText}</span>
      ${item.date_iso ? `<time datetime="${item.date_iso}">${dateText}</time>` : `<span>${dateText}</span>`}
    </div>
    <a class="sidebar-news__title" href="${href}">${item.title || ''}</a>
    ${excerpt ? `<p class="sidebar-news__excerpt">${excerpt}</p>` : ''}
  </div>
</li>`;
  }).join('')}</ul>`;
}

(() => {
  const isDetail = (document.body?.dataset?.page || '').startsWith('berita/') && (document.body?.dataset?.page || '') !== 'berita';
  if (!isDetail) return;

  initShareBlocks(document);

  const sidebar = document.querySelector('.news-sidebar');
  const latestMount = sidebar?.querySelector('[data-latest-news]') || null;
  const popularMount = sidebar?.querySelector('[data-popular-news]') || null;
  if (!latestMount && !popularMount) return;

  const rootPrefix = window.__IKSASS_ROOT_PREFIX || '../../';
  const currentSlug = getCurrentNewsSlug();

  getNewsIndex(rootPrefix)
    .then((items) => items.filter((item) => item.slug !== currentSlug))
    .then((items) => {
      const latest = items.slice().sort((a, b) => (b.date_iso || '').localeCompare(a.date_iso || '')).slice(0, 4);
      const popular = items.slice().sort((a, b) => (b.popular_score - a.popular_score) || (b.date_iso || '').localeCompare(a.date_iso || '')).slice(0, 4);
      if (latestMount) latestMount.innerHTML = renderList(latest, 'Terkini', rootPrefix);
      if (popularMount) popularMount.innerHTML = renderList(popular, 'Populer', rootPrefix);
    })
    .catch(() => {});
})();
