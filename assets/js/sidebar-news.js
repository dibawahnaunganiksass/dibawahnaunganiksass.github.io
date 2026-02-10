// sidebar-news.js
// Render "Berita Terkini" and "Berita Populer" on article pages from /berita/news-index.json
// Keeps markup consistent across all pages.

// Compute root prefix based on current path depth.
// Examples:
//  - /berita/                 -> ROOT_PREFIX = "../"
//  - /berita/slug/            -> ROOT_PREFIX = "../../"
//  - /index.html              -> ROOT_PREFIX = ""
const getRootPrefix = () => {
  const parts = (location.pathname || "/").split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  // If last segment is a file like index.html, remove it
  if (last.includes(".")) parts.pop();
  return "../".repeat(Math.max(0, parts.length));
};
const ROOT_PREFIX = getRootPrefix();
const normUrl = (u) => (u && u.startsWith("/") ? (ROOT_PREFIX + u.slice(1)) : u);

(async function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  const sidebar = $('.news-sidebar');
  if (!sidebar) return;

  const slugCurrent = (function(){
    const m = location.pathname.match(/\/berita\/([^\/]+)\/?/);
    return m ? m[1] : '';
  })();

  const latestMount = sidebar.querySelector('[data-latest-news]');
  const popularMount = sidebar.querySelector('[data-popular-news]');
  if (!latestMount && !popularMount) return;

  function fmtDateISO(iso){
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function renderList(items, labelText){
    return `<ul class="sidebar-news">${
      items.map(it => {
        const href = ROOT_PREFIX + `berita/${it.slug}/`;
        const img = it.image || '';
        const dateText = it.date_display || fmtDateISO(it.date_iso) || '';
        const dateAttr = it.date_iso || '';
        const excerpt = it.excerpt || it.description || '';
        return `
<li class="sidebar-news__item">
  <div class="sidebar-news__thumb">
    <img src="${esc(normUrl(img) || "")}" alt="" loading="lazy" decoding="async"/>
  </div>
  <div class="sidebar-news__body">
    <div class="sidebar-news__meta">
      <span class="sidebar-label">${esc(labelText)}</span>
      ${dateAttr ? `<time datetime="${esc(dateAttr)}">${esc(dateText)}</time>` : `<span>${esc(dateText)}</span>`}
    </div>
    <a class="sidebar-news__title" href="${esc(href)}">${esc(it.title || '')}</a>
    ${excerpt ? `<p class="sidebar-news__excerpt">${esc(excerpt)}</p>` : ''}
  </div>
</li>`;
      }).join('')
    }</ul>`;
  }

  try{
    const res = await fetch(ROOT_PREFIX + 'berita/news-index.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const cleaned = data
      .filter(x => x && x.slug && x.title)
      .map(x => ({
        slug: x.slug,
        title: x.title,
        excerpt: x.excerpt,
        description: x.description,
        date_iso: x.date_iso || '',
        date_display: x.date_display || '',
        image: x.image || '',
        popular_score: typeof x.popular_score === 'number' ? x.popular_score : 0
      }));

    // Latest: sort by date_iso desc, exclude current
    const latest = cleaned
      .filter(x => x.slug !== slugCurrent)
      .sort((a,b) => (b.date_iso || '').localeCompare(a.date_iso || ''))
      .slice(0, 4);

    // Popular: sort by popular_score desc, fallback date; exclude current
    const popular = cleaned
      .filter(x => x.slug !== slugCurrent)
      .sort((a,b) => (b.popular_score - a.popular_score) || (b.date_iso || '').localeCompare(a.date_iso || ''))
      .slice(0, 4);

    if (latestMount) latestMount.innerHTML = renderList(latest, 'Terkini');
    if (popularMount) popularMount.innerHTML = renderList(popular, 'Populer');
  }catch(e){
    // silent
  }
})();
