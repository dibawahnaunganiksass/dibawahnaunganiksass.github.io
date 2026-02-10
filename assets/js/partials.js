(() => {
  // Bump this version whenever shared partial markup changes.
  // This prevents stale header/footer HTML from persisting via localStorage.
  // NOTE: bumping to force refresh of header/footer across pages (fixes stale drawer header markup)
  const CACHE_VERSION = "v6.1-mega-snippet";

  const getRootPrefix = () => {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop(); // file path
    return "../".repeat(Math.max(0, parts.length));
  };

  const applyRoot = (html, root) => (html || "").split("{{root}}").join(root);

  const enhanceBeritaMega = (rootPrefix) => {
    const mega = document.querySelector(".berita-mega .mega-posts");
    if (!mega) return;

    // Build map from slug -> excerpt from berita/news-index.json
    const indexUrl = `${rootPrefix}berita/news-index.json`;
    fetch(indexUrl, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((list) => {
        const bySlug = new Map((list || []).map(it => [String(it.slug || ""), it]));
        mega.querySelectorAll("a.mega-card").forEach((card) => {
          const href = card.getAttribute("href") || "";
          const m = href.match(/berita\/([^\/]+)\/?$/);
          const slug = m ? m[1] : "";
          const item = bySlug.get(slug);
          if (!item) return;

          const body = card.querySelector(".mega-card-body");
          if (!body) return;

          // Insert excerpt if not already present.
          // Use the canonical class used by main.css (mega-card-snippet),
          // and also include mega-card-excerpt for backward compatibility.
          if (!body.querySelector(".mega-card-snippet, .mega-card-excerpt") && item.excerpt) {
            const ex = document.createElement("div");
            ex.className = "mega-card-snippet mega-card-excerpt";
            ex.textContent = item.excerpt;
            body.appendChild(ex);
          }

          // Also refresh date if available
          const meta = body.querySelector(".mega-card-meta");
          if (meta && item.date_display) meta.textContent = item.date_display;
        });
      })
      .catch(() => {
        // Silent fail: mega menu stays as-is
      });
  };

  // Cache key per partial name only. We cache the RAW partial (still containing
  // {{root}} tokens) and apply the correct root prefix per page at render time.
  // This makes cache reusable across pages with different depth.
  const cacheKey = (name) => `iksass:${CACHE_VERSION}:partial:raw:${name}`;

  
  const ensureScript = (src, key) => {
    try {
      const abs = new URL(src, location.href).href;
      // already loaded?
      const existing = Array.from(document.querySelectorAll('script[src]'))
        .some(s => new URL(s.getAttribute('src'), location.href).href === abs);
      if (existing) return;
      // mark by key
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
      // Keep the holder element (avoid outerHTML replacement) to reduce reflow/flicker.
      holder.innerHTML = html;
      if (removeAttr) holder.removeAttribute("data-include");
      // Remove placeholder height once content is injected.
      holder.style.minHeight = "0";
    });
  };

  // Inject partial into *all* matching placeholders. This prevents blank gaps
  // if a page accidentally contains more than one data-include target.
  const injectAll = async (name, root) => {
    const holders = Array.from(document.querySelectorAll(`[data-include="${name}"]`));
    if (!holders.length) return false;

    // 1) Synchronous injection from localStorage (best effort) to reduce flicker
    // between full page navigations.
    try {
      const cachedRaw = localStorage.getItem(cacheKey(name));
      if (cachedRaw) {
        const cached = applyRoot(cachedRaw, root);
        setHTMLAll(holders, cached, false);
              if (name === "header") enhanceBeritaMega(root);
}
    } catch {
      // ignore storage errors (private mode/quota)
    }

    try {
      // Allow the browser to cache partials between page navigations.
      // Use absolute path so the request URL is identical across all pages.
      const res = await fetch(`/partials/${name}.html`, { cache: "no-store" });
      if (!res.ok) return false;

      const raw = await res.text();
      const html = applyRoot(raw, root);

      // Only replace DOM if different from what's already there
      const first = holders[0];
      const current = (first && first.innerHTML) || "";
      if (current !== html) setHTMLAll(holders, html, true);
            if (name === "header") enhanceBeritaMega(root);
else {
        // Even if identical, drop the attribute so we don't try to include again.
        holders.forEach((h) => h.removeAttribute("data-include"));
      }

            if (name === "header") enhanceBeritaMega(root);
// Update localStorage cache
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
    const root = getRootPrefix();
    await await Promise.all([injectAll("header", root), injectAll("footer", root)]);
    // Ensure critical scripts are executed even when footer/header are injected via innerHTML.
    // (Scripts inserted via innerHTML do NOT execute in browsers.)
    ensureScript(`${root}assets/js/main.js`, "main");
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  })();
})();
