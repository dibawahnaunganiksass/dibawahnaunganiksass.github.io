(() => {
  // Bump this version whenever shared partial markup changes.
  // This prevents stale header/footer HTML from persisting via localStorage.
  // NOTE: bumping to force refresh of header/footer across pages (fixes stale drawer header markup)
  const CACHE_VERSION = "1771210001";

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

    const indexUrl = `${rootPrefix}berita/news-index.json`;
    fetch(indexUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list) => {
        const bySlug = new Map((list || []).map((it) => [String(it.slug || ""), it]));
        mega.querySelectorAll("a.mega-card").forEach((card) => {
          const href = card.getAttribute("href") || "";
          const m = href.match(/berita\/([^\/]+)\/?$/);
          const slug = m ? m[1] : "";
          const item = bySlug.get(slug);
          if (!item) return;

          const body = card.querySelector(".mega-card-body");
          if (!body) return;

          if (!body.querySelector(".mega-card-snippet, .mega-card-excerpt") && item.excerpt) {
            const ex = document.createElement("div");
            ex.className = "mega-card-snippet mega-card-excerpt";
            ex.textContent = item.excerpt;
            body.appendChild(ex);
          }

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
      const existing = Array.from(document.querySelectorAll("script[src]"))
        .some((s) => new URL(s.getAttribute("src"), location.href).href === abs);
      if (existing) return;
      if (key && document.querySelector(`script[data-iksass="${key}"]`)) return;

      const s = document.createElement("script");
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
      if (removeAttr) holder.removeAttribute("data-include");
      holder.style.minHeight = "0";
    });
  };

  const injectAll = async (name, root) => {
    const holders = Array.from(document.querySelectorAll(`[data-include="${name}"]`));
    if (!holders.length) return false;

    // 1) Best-effort cached paint to reduce flicker
    try {
      const cachedRaw = localStorage.getItem(cacheKey(name));
      if (cachedRaw) {
        setHTMLAll(holders, applyRoot(cachedRaw, root), false);
        if (name === "header") enhanceBeritaMega(root);
      }
    } catch {
      // ignore storage errors
    }

    try {
      // Root deploy: keep absolute path so URL is stable across pages
      const res = await fetch(`/partials/${name}.html`, { cache: "no-store" });
      if (!res.ok) return false;

      const raw = await res.text();
      const html = applyRoot(raw, root);

      const current = holders[0]?.innerHTML || "";
      if (current !== html) {
        setHTMLAll(holders, html, true);
      } else {
        holders.forEach((h) => h.removeAttribute("data-include"));
        holders.forEach((h) => (h.style.minHeight = "0"));
      }

      if (name === "header") enhanceBeritaMega(root);

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
    await Promise.all([injectAll("header", root), injectAll("footer", root)]);
    ensureScript(`${root}assets/js/main.js`, "main");
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  })();
})();
