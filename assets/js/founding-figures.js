(() => {
  const getRootPrefix = () => {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  };
  const ROOT_PREFIX = getRootPrefix();

  const root = document.querySelector('[data-founding-figures]');
  if (!root) return;

  const esc = (s='') => String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  const card = (p) => `
    <li class="founding-card">
      <img class="founding-card__img" src="${esc(p.image)}" alt="${esc(p.name)} — ${esc(p.role)}" width="80" height="80" loading="lazy" decoding="async">
      <div class="founding-card__body">
        <div class="founding-card__name">${esc(p.name)}</div>
        <div class="founding-card__role">${esc(p.role)}</div>
      </div>
    </li>
  `;

  fetch(ROOT_PREFIX + 'data/founding-figures.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(list => {
      root.innerHTML = `<ul class="founding-list" role="list">${list.map(card).join('')}</ul>`;
    })
    .catch(() => {
      root.innerHTML = '<p class="founding-fallback">Data belum tersedia.</p>';
    });
})();