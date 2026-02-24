(() => {
  const mount = document.querySelector('[data-home-impact]');
  if (!mount) return;

  const resolveUrl = (rel) => new URL(rel, document.baseURI).toString();

  const escapeHtml = (s) => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  function render(items) {
    const safe = Array.isArray(items) ? items : [];
    // Layout request: 1 featured (kaderisasi) on the left, 2 cards (keilmuan + digital) on the right.
    // Keep data scalable: if preferred tags are missing, fall back to the next available items.
    const featuredItem = safe[0];
    const rest = safe.slice(1);
    const preferredTags = ['keilmuan', 'digital'];
    const picked = [];
    for (const t of preferredTags) {
      const idx = rest.findIndex((it) => String(it?.tag || '').toLowerCase() === t);
      if (idx >= 0) {
        picked.push(rest[idx]);
        rest.splice(idx, 1);
      }
    }
    while (picked.length < 2 && rest.length) picked.push(rest.shift());
    const top = [featuredItem, ...picked].filter(Boolean);
    if (top.length === 0) {
      mount.innerHTML = '<p class="home-impact__empty">Program unggulan akan ditampilkan di sini.</p>';
      return;
    }

    mount.innerHTML = top.map((it, idx) => {
      const title = escapeHtml(it.title || 'Program');
      const tag = escapeHtml(it.tag || 'IKSASS');
      const desc = escapeHtml(it.desc || '');
      const href = it.href ? it.href : '#';
      const featured = idx === 0 ? ' is-featured' : '';

      // Optional points (recommended for featured card)
      const points = Array.isArray(it.points) ? it.points.slice(0, 3) : [];
      const pointsHtml = points.length
        ? `<ul class="impact-points">${points
            .map((p) => `<li>${escapeHtml(p)}</li>`)
            .join('')}</ul>`
        : '';

      // Optional KPIs + chips (used to fill featured aside)
      const kpis = Array.isArray(it.kpis) ? it.kpis.slice(0, 3) : [];
      const kpisHtml = kpis.length
        ? `<div class="impact-kpis">${kpis
            .map((k) => {
              const v = escapeHtml(k?.value ?? '');
              const l = escapeHtml(k?.label ?? '');
              return `<div class="impact-kpi"><div class="impact-kpi__val">${v}</div><div class="impact-kpi__lab">${l}</div></div>`;
            })
            .join('')}</div>`
        : '';

      const chips = Array.isArray(it.chips) ? it.chips.slice(0, 5) : [];
      const chipsHtml = chips.length
        ? `<div class="impact-chips">${chips
            .map((c) => `<span class="impact-chip">${escapeHtml(c)}</span>`)
            .join('')}</div>`
        : '';

      if (idx === 0) {
        return `
          <a class="card impact-card${featured}" href="${escapeHtml(href)}">
            <div class="impact-card__head">
              <span class="impact-tag">${tag}</span>
              <svg class="impact-arrow" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" focusable="false">
                <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
              </svg>
            </div>
            <h3 class="impact-title">${title}</h3>
            <p class="impact-desc">${desc}</p>
            ${pointsHtml}
            <span class="impact-cta">Pelajari →</span>
          </a>
        `;
      }

      return `
        <a class="card impact-card${featured}" href="${escapeHtml(href)}">
          <div class="impact-card__head">
            <span class="impact-tag">${tag}</span>
            <svg class="impact-arrow" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" focusable="false">
              <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="impact-title">${title}</h3>
          <p class="impact-desc">${desc}</p>
          <span class="impact-cta">Pelajari →</span>
        </a>
      `;
    }).join('');
  }

  async function init() {
    try {
      const res = await fetch(resolveUrl('assets/data/impact.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`impact.json: ${res.status}`);
      const json = await res.json();
      render(json.items);
    } catch (err) {
      console.error('[home-impact] gagal memuat data:', err);
      render([]);
    }
  }

  init();
})();
