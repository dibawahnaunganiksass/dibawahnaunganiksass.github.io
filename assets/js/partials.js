(() => {
  // Bump this version whenever shared partial markup changes.
  // This prevents stale header/footer HTML from persisting via localStorage.
  const CACHE_VERSION = "1771210001";

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
        const bySlug = new Map((list || []).map((it) => [String(it.slug || ''), it]));
        mega.querySelectorAll('a.mega-card').forEach((card) => {
          const href = card.getAttribute('href') || '';
          const m = href.match(/berita\/([^\/]+)\/?$/);
          const slug = m ? m[1] : '';
          const item = bySlug.get(slug);
          if (!item) return;

          const body = card.querySelector('.mega-card-body');
          if (!body) return;

          if (!body.querySelector('.mega-card-snippet, .mega-card-excerpt') && item.excerpt) {
            const ex = document.createElement('div');
            ex.className = 'mega-card-snippet mega-card-excerpt';
            ex.textContent = item.excerpt;
            body.appendChild(ex);
          }

          const meta = body.querySelector('.mega-card-meta');
          if (meta && item.date_display) meta.textContent = item.date_display;
        });
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

    ensureScript(`${rootPrefix}assets/js/main.js`, 'main');
    document.dispatchEvent(new CustomEvent('partials:loaded'));
  })();
})();
