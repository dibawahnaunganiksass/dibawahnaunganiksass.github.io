(() => {
  const getRootPrefix = () => {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  };
  const ROOT_PREFIX = getRootPrefix();

  const host = document.querySelector('[data-bukan-pilihan]');
  if (!host) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s='') => String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  const render = (item) => {
    host.innerHTML = `
      <figure class="bukan-pilihan__media">
        <img class="bukan-pilihan__img" src="${esc(item.src)}" alt="${esc(item.alt || 'Bukan Pilihan')}" loading="lazy" decoding="async">
      </figure>
    `;
  };

  fetch(ROOT_PREFIX + 'data/bukan-pilihan.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(list => {
      if (!Array.isArray(list) || list.length === 0) throw new Error('empty');
      let i = 0;
      render(list[i]);

      // If only 1 image or reduced motion, stop here.
      if (list.length < 2 || prefersReduced) return;

      const intervalMs = 7000;
      setInterval(() => {
        i = (i + 1) % list.length;
        host.classList.remove('is-fade');
        // trigger reflow for transition restart
        void host.offsetWidth;
        host.classList.add('is-fade');
        render(list[i]);
      }, intervalMs);
    })
    .catch(() => {
      // fallback: keep current DOM as-is
    });
})();