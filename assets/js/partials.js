(() => {
  // Bump this version whenever shared partial markup changes.
  // This prevents stale header/footer HTML from persisting via localStorage.
  // Bump when partial markup/behavior changes to avoid stale cached header/footer.
  const CACHE_VERSION = "1771211300";

  // ---
  // Root detection (subfolder-safe)
  // ---
  // Many pages rely on shared partials and assets under the site root folder.
  // When the site is hosted under a subfolder (e.g. /IKSASS/), absolute paths
  // like "/partials/header.html" will break. We detect the correct site base by
  // probing for "partials/header.html" while walking up directories.
  const findSiteBase = async (maxUp = 6) => {
    let dir = new URL('./', location.href);

    for (let i = 0; i <= maxUp; i++) {
      const testUrl = new URL('partials/header.html', dir).toString();
      try {
        const res = await fetch(testUrl, { cache: 'no-store' });
        if (res && res.ok) return dir.toString();
      } catch {
        // ignore and keep walking up
      }
      dir = new URL('../', dir);
    }

    // Fallback: current directory
    return new URL('./', location.href).toString();
  };

  const getRootPrefix = (siteBaseUrl) => {
    try {
      const pageDir = new URL('./', location.href);
      const siteDir = new URL(siteBaseUrl || pageDir.href);

      const pageParts = pageDir.pathname.split('/').filter(Boolean);
      const siteParts = siteDir.pathname.split('/').filter(Boolean);

      // Compute how many directories we need to go up from pageDir to reach siteDir.
      // Works for domain root and subfolder deployments as long as siteDir is a prefix.
      let diff = 0;
      if (pageDir.pathname.startsWith(siteDir.pathname)) {
        diff = Math.max(0, pageParts.length - siteParts.length);
      }
      return '../'.repeat(diff);
    } catch {
      return '';
    }
  };

  // Token replacement
  // - Supports both legacy "{root}" and current "{{root}}" tokens.
  // - IMPORTANT: We must replace "{{root}}" first. If we replaced "{root}" first,
  //   the substring "{root}" inside "{{root}}" would be replaced and leave "{}"
  //   which then becomes part of URLs (encoded as %7B%7D).
  const applyRoot = (html, root) => {
    const safeRoot = (typeof root === 'string') ? root : '';
    return (html || '')
      .replace(/\{\{\s*root\s*\}\}/g, safeRoot)
      .replace(/\{\s*root\s*\}/g, safeRoot);
  };

  const enhanceBeritaMega = (rootPrefix) => {
    const mega = document.querySelector('.berita-mega .mega-posts');
    if (!mega) return;

    const indexUrl = `${rootPrefix}berita/news-index.json`;
    fetch(indexUrl, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list) => {
        // Desktop mega menu layout is designed for 4 cards (like the original).
        // We keep it to 4 latest items for completeness.
        const items = Array.isArray(list) ? list.slice(0, 4) : [];
        if (!items.length) return;

        const escapeHTML = (s) => String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\"/g, '&quot;')
          .replace(/'/g, '&#039;');

        const resolveImg = (imgPath) => {
          const raw = String(imgPath || '').trim();
          if (!raw) return `${rootPrefix}assets/img/og-default.png`;
          if (/^https?:\/\//i.test(raw)) return raw;
          if (raw.startsWith('/')) return `${rootPrefix}${raw.replace(/^\//, '')}`;
          return `${rootPrefix}${raw.replace(/^\.\//, '')}`;
        };

        mega.innerHTML = items.map((it) => {
          const slug = escapeHTML(it.slug);
          const href = `${rootPrefix}berita/${slug}/`;
          const img = resolveImg(it.image);
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
      .catch(() => {
        // Silent fail: mega menu stays as-is
      });
  };


  // Cache key per partial name only. We cache the RAW partial (still containing
  // {root} tokens) and apply the correct root prefix per page at render time.
  // This makes cache reusable across pages with different depth.
  const cacheKey = (name) => `iksass:${CACHE_VERSION}:partial:raw:${name}`;

  const ensureScript = (src, key) => {
    try {
      const abs = new URL(src, location.href).href;
      const existing = Array.from(document.querySelectorAll('script[src]'))
        .some((s) => new URL(s.getAttribute('src'), location.href).href === abs);
      if (existing) return;
      if (key && document.querySelector(`script[data-iksass="${key}"]`)) return;

      const s = document.createElement('script');
      if (key) s.dataset.iksass = key;
      s.src = src;
      s.defer = true;
      document.head.appendChild(s);
    } catch {
      // ignore
    }
  };

  const setHTMLAll = (holders, html, removeAttr = true) => {
    holders.forEach((holder) => {
      holder.innerHTML = html;
      if (removeAttr) holder.removeAttribute('data-include');
      holder.style.minHeight = '0';
    });
  };

  const injectAll = async (name, siteBaseUrl, rootPrefix) => {
    const holders = Array.from(document.querySelectorAll(`[data-include="${name}"]`));
    if (!holders.length) return false;

    // 1) Best-effort cached paint to reduce flicker
    try {
      const cachedRaw = localStorage.getItem(cacheKey(name));
      if (cachedRaw) {
        setHTMLAll(holders, applyRoot(cachedRaw, rootPrefix), false);
        if (name === 'header') enhanceBeritaMega(rootPrefix);
      }
    } catch {
      // ignore storage errors
    }

    try {
      const url = new URL(`partials/${name}.html`, siteBaseUrl).toString();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return false;

      const raw = await res.text();
      const html = applyRoot(raw, rootPrefix);

      const current = holders[0]?.innerHTML || '';
      if (current !== html) {
        setHTMLAll(holders, html, true);
      } else {
        holders.forEach((h) => h.removeAttribute('data-include'));
        holders.forEach((h) => (h.style.minHeight = '0'));
      }

      if (name === 'header') enhanceBeritaMega(rootPrefix);

      try {
        localStorage.setItem(cacheKey(name), raw);
      } catch {
        // ignore
      }

      return true;
    } catch {
      return false;
    }
  };

  (async () => {
    const siteBaseUrl = await findSiteBase();
    const rootPrefix = getRootPrefix(siteBaseUrl);

    await Promise.all([
      injectAll('header', siteBaseUrl, rootPrefix),
      injectAll('footer', siteBaseUrl, rootPrefix),
    ]);

    // Pages already include main.min.js, but ensure it's present for pages that don't.
    // IMPORTANT: Always load the same entrypoint (minified) to avoid double-init.
    ensureScript(`${rootPrefix}assets/js/main.min.js`, 'main');

    // Ensure brandbar Mode A works even when header/footer are injected asynchronously.
    // main.js also sets this up, but depending on load order it can run before the header exists.
    // This binder is idempotent and keeps the CSS var --iksass-header-h in sync.
    (function bindHeaderScrollFX(){
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
    })();

    document.dispatchEvent(new CustomEvent('partials:loaded'));
  })();
})();
