const prefersReduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value);

async function countRowsFrom(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch stats source');
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Math.max(0, doc.querySelectorAll('.table .tr').length - 1);
}

function animateCount(el, value) {
  if (prefersReduced()) {
    el.textContent = formatNumber(value);
    return;
  }
  const duration = 900;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatNumber(Math.round(value * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

(() => {
  const cards = Array.from(document.querySelectorAll('.k-stat-card[data-count-from]'));
  if (!cards.length) return;

  Promise.allSettled(cards.map(async (card) => {
    const from = card.getAttribute('data-count-from');
    const valueEl = card.querySelector('[data-count-value]');
    if (!from || !valueEl) return null;
    const total = await countRowsFrom(new URL(from, window.location.href).toString());
    return { card, valueEl, total };
  })).then((results) => {
    const items = results.filter((result) => result.status === 'fulfilled' && result.value).map((result) => result.value);
    const run = (item) => {
      if (item.card.dataset.animated === '1') return;
      item.card.dataset.animated = '1';
      animateCount(item.valueEl, item.total);
    };
    items.forEach((item) => {
      item.valueEl.textContent = '0';
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const item = items.find((candidate) => candidate.card === entry.target);
          if (item) run(item);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.35 });
      items.forEach((item) => observer.observe(item.card));
    } else {
      items.forEach(run);
    }
  }).catch(() => {});
})();
