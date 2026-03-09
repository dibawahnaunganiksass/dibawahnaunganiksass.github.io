const CACHE_VERSION = 'phase2-20260309';

function applyRoot(html, rootPrefix) {
  const safeRoot = typeof rootPrefix === 'string' ? rootPrefix : '';
  return String(html || '')
    .replace(/\{\{\s*root\s*\}\}/g, safeRoot)
    .replace(/\{\s*root\s*\}/g, safeRoot);
}

function cacheKey(name) {
  return `iksass:${CACHE_VERSION}:partial:raw:${name}`;
}

function setHTMLAll(holders, html, removeAttr = true, name = '') {
  holders.forEach((holder) => {
    holder.innerHTML = html;
    holder.classList.add('partial-slot');
    if (name) {
      holder.classList.add(`partial-slot--${name}`);
      holder.setAttribute('data-partial-slot', name);
    }
    if (removeAttr) holder.removeAttribute('data-include');
    holder.style.minHeight = '0';
  });
}

function resolveImg(imgPath, rootPrefix) {
  const raw = String(imgPath || '').trim();
  if (!raw) return `${rootPrefix}assets/img/og-default.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${rootPrefix}${raw.replace(/^\//, '')}`;
  return `${rootPrefix}${raw.replace(/^\.\//, '')}`;
}

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function enhanceBeritaMega(rootPrefix) {
  const mega = document.querySelector('.berita-mega .mega-posts');
  if (!mega) return;
  const indexUrl = `${rootPrefix}berita/news-index.json`;

  fetch(indexUrl, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('news index not found'))))
    .then((list) => {
      const items = Array.isArray(list) ? list.slice(0, 4) : [];
      if (!items.length) return;
      mega.innerHTML = items.map((it) => {
        const slug = escapeHTML(it.slug);
        const href = `${rootPrefix}berita/${slug}/`;
        const img = resolveImg(it.image, rootPrefix);
        const title = escapeHTML(it.title);
        const date = escapeHTML(it.date_display || '');
        const excerpt = escapeHTML(it.excerpt || '');
        return `
          <a class="mega-card" href="${href}">
            <img class="mega-thumb" src="${img}" alt="${title}" decoding="async" loading="lazy" fetchpriority="low" width="160" height="96"/>
            <div class="mega-card-body">
              <div class="mega-card-title">${title}</div>
              <div class="mega-card-meta">${date}</div>
              <div class="mega-card-snippet mega-card-excerpt">${excerpt}</div>
            </div>
          </a>
        `.trim();
      }).join('');
    })
    .catch(() => {});
}

export async function injectPartial(name, siteBaseUrl, rootPrefix) {
  const holders = Array.from(document.querySelectorAll(`[data-include="${name}"]`));
  if (!holders.length) return false;

  try {
    const cachedRaw = localStorage.getItem(cacheKey(name));
    if (cachedRaw) {
      setHTMLAll(holders, applyRoot(cachedRaw, rootPrefix), false, name);
      if (name === 'header') enhanceBeritaMega(rootPrefix);
    }
  } catch {}

  try {
    const url = new URL(`partials/${name}.html`, siteBaseUrl).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const raw = await res.text();
    const html = applyRoot(raw, rootPrefix);
    const current = holders[0]?.innerHTML || '';
    if (current !== html) {
      setHTMLAll(holders, html, true, name);
    } else {
      holders.forEach((h) => {
        h.classList.add('partial-slot');
        h.classList.add(`partial-slot--${name}`);
        h.setAttribute('data-partial-slot', name);
        h.removeAttribute('data-include');
        h.style.minHeight = '0';
      });
    }
    if (name === 'header') enhanceBeritaMega(rootPrefix);
    try {
      localStorage.setItem(cacheKey(name), raw);
    } catch {}
    return true;
  } catch {
    return false;
  }
}

export function bindHeaderScrollFX() {
  if (window.__IKSASS_PARTIAL_SCROLL_FX) return;
  const header = document.querySelector('header.header');
  if (!header) return;
  const root = document.documentElement;
  const syncHeaderHeight = () => {
    root.style.setProperty('--iksass-header-h', `${header.offsetHeight}px`);
  };
  const onScroll = () => {
    const scrolled = (window.scrollY || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
    syncHeaderHeight();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { syncHeaderHeight(); onScroll(); }, { passive: true });
  requestAnimationFrame(() => { syncHeaderHeight(); onScroll(); });
  window.__IKSASS_PARTIAL_SCROLL_FX = true;
}
