// IKSASS - docs.js (documents listing with categories + search)
(function(){
  function getRootPrefix(){
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  }
  const ROOT_PREFIX = getRootPrefix();

  function toRootUrl(u){
    const v = String(u || '').trim();
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
    if (v.startsWith('/')) return ROOT_PREFIX + v.slice(1);
    return ROOT_PREFIX + v.replace(/^\.+\//, '');
  }

  const els = {
    chips: document.getElementById('docsChips'),
    search: document.getElementById('docsSearchInput'),
    list: document.getElementById('docsList'),
    empty: document.getElementById('docsEmpty'),
    featured: document.getElementById('docsFeatured')
  };

  if (!els.chips || !els.search || !els.list) return;

  const state = {
    data: null,
    q: '',
    category: 'ALL'
  };

  function normText(s){
    return String(s || '').toLowerCase();
  }

  function safeISO(s){
    const v = String(s || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '1970-01-01';
  }

  function byDateDesc(a,b){
    return safeISO(b.date_iso).localeCompare(safeISO(a.date_iso));
  }

  function escapeHtml(str){
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function buildDocRow(item){
    const title = escapeHtml(item.title);
    const metaParts = [];
    if (item.category) metaParts.push(escapeHtml(item.category));
    if (item.date_display && item.date_display !== '—') metaParts.push(escapeHtml(item.date_display));
    const meta = metaParts.join(' • ') || 'PDF';

    const file = String(item.file || '').trim();
    const href = file ? toRootUrl('assets/files/dokumen/' + file) : '';

    const desc = item.description ? `<div class="docs-desc">${escapeHtml(item.description)}</div>` : '';

    return `
      <div class="list">
        <div class="row">
          <div>
            <div><b>${title}</b></div>
            <div class="meta">${meta}</div>
            ${desc}
          </div>
          <div class="doc-actions">
            <a class="small-link" href="${href}" rel="noopener" target="_blank">Buka</a>
            <a class="small-link" href="${href}" download>Unduh</a>
          </div>
        </div>
      </div>
    `;
  }

  function groupByCategory(items, order){
    const map = new Map();
    items.forEach((it) => {
      const c = (it.category || 'Lainnya').trim() || 'Lainnya';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(it);
    });

    const ordered = [];
    (order || []).forEach((c) => {
      if (map.has(c)) ordered.push([c, map.get(c)]);
    });

    // Add remaining categories not in order
    Array.from(map.keys()).sort().forEach((c) => {
      if (!(order || []).includes(c)) ordered.push([c, map.get(c)]);
    });

    return ordered;
  }

  function renderChips(items, order){
    const counts = new Map();
    items.forEach((it) => {
      const c = (it.category || 'Lainnya').trim() || 'Lainnya';
      counts.set(c, (counts.get(c) || 0) + 1);
    });

    const cats = [];
    (order || []).forEach((c) => { if (counts.has(c)) cats.push(c); });
    Array.from(counts.keys()).sort().forEach((c) => {
      if (!(order || []).includes(c)) cats.push(c);
    });

    function chipBtn(label, value, count){
      const active = state.category === value;
      const a = active ? ' docs-chip--active' : '';
      const c = typeof count === 'number' ? `<span class="docs-chip-count">${count}</span>` : '';
      return `<button type="button" class="docs-chip${a}" data-cat="${escapeHtml(value)}">${escapeHtml(label)}${c}</button>`;
    }

    const allCount = items.length;
    els.chips.innerHTML = chipBtn('Semua', 'ALL', allCount) + cats.map((c) => chipBtn(c, c, counts.get(c) || 0)).join('');

    els.chips.querySelectorAll('button[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-cat') || 'ALL';
        render();
        // update active state
        els.chips.querySelectorAll('.docs-chip').forEach((b) => b.classList.remove('docs-chip--active'));
        btn.classList.add('docs-chip--active');
      });
    });
  }

  function applyFilter(items){
    const q = normText(state.q);
    const cat = state.category;
    return items.filter((it) => {
      const c = (it.category || 'Lainnya').trim() || 'Lainnya';
      if (cat !== 'ALL' && c !== cat) return false;
      if (!q) return true;
      const hay = normText(it.title) + ' ' + normText(it.description) + ' ' + normText(it.category);
      return hay.includes(q);
    });
  }

  function renderFeatured(items){
    if (!els.featured) return;
    const featured = items.filter((it) => !!it.featured).sort(byDateDesc);
    if (!featured.length) {
      els.featured.hidden = true;
      els.featured.innerHTML = '';
      return;
    }

    els.featured.hidden = false;
    els.featured.innerHTML = `
      <div class="docs-section-title">Unggulan</div>
      ${featured.map(buildDocRow).join('')}
    `;
  }

  function render(){
    const all = (state.data?.items || []).slice().sort(byDateDesc);

    // Featured always based on ALL (not filtered), but keep it hidden when filtering/searching
    const isFiltering = state.category !== 'ALL' || !!state.q;
    if (!isFiltering) renderFeatured(all);
    else if (els.featured) { els.featured.hidden = true; els.featured.innerHTML = ''; }

    const items = all.filter((it) => {
      const cat = (it.category || 'Lainnya').trim() || 'Lainnya';
      if (state.category !== 'ALL' && cat !== state.category) return false;
      if (!state.q) return true;
      const q = normText(state.q);
      const hay = normText(it.title) + ' ' + normText(it.description) + ' ' + normText(cat);
      return hay.includes(q);
    });

    if (!items.length){
      els.list.innerHTML = '';
      if (els.empty) els.empty.hidden = false;
      return;
    }
    if (els.empty) els.empty.hidden = true;

    const grouped = groupByCategory(items, state.data?.categories_order || []);
    els.list.innerHTML = grouped.map(([cat, arr]) => {
      const heading = state.category === 'ALL' ? `<h3 class="docs-cat">${escapeHtml(cat)}</h3>` : '';
      return `${heading}${arr.sort(byDateDesc).map(buildDocRow).join('')}`;
    }).join('');
  }

  function init(){
    // Performance: allow browser caching for static JSON (ETag/Cache-Control)
    fetch('docs-index.json', { cache: 'force-cache' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('docs-index fetch failed')))
      .then((data) => {
        state.data = data || { items: [] };
        const items = (state.data.items || []).slice();
        renderChips(items, state.data.categories_order || []);
        render();
      })
      .catch((err) => {
        console.warn('[docs] gagal memuat data dokumen', err);
      });

    els.search.addEventListener('input', (e) => {
      state.q = e.target.value || '';
      render();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
