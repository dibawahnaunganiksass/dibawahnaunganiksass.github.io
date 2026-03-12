const PAGE_MODULE_RULES = [
  {
    match: (page) => page === '404.html',
    modules: ['assets/js/pages/error404.js'],
  },
  {
    match: (page) => page === 'berita',
    modules: ['assets/js/pages/news-index.js'],
  },
  {
    match: (page) => page.startsWith('berita/') && page !== 'berita',
    modules: ['assets/js/pages/news-detail.js'],
  },
  {
    match: (page) => page === 'kelembagaan',
    modules: ['assets/js/pages/org-stats.js'],
  },
  {
    match: (page) => [
      'kelembagaan/pengurus-rayon-iksass',
      'kelembagaan/pengurus-sub-rayon-iksass',
      'kelembagaan/pengurus-komisariat-iksass',
    ].includes(page),
    modules: ['assets/js/pages/org-list.js'],
  },
  {
    match: (page) => [
      'kelembagaan/pengurus-rayon-iksass/detail',
      'kelembagaan/pengurus-sub-rayon-iksass/detail',
      'kelembagaan/pengurus-komisariat-iksass/detail',
    ].includes(page),
    modules: ['assets/js/pages/org-detail.js'],
  },
  {
    match: (page) => page === 'tentang/program-kerja' || page === 'program-kerja',
    modules: ['assets/js/pages/proker-dialog.js'],
  },
];

function currentPage() {
  return document.body?.dataset?.page || '';
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function collectModules(page) {
  return unique(
    PAGE_MODULE_RULES
      .filter((rule) => {
        try {
          return !!rule.match(page);
        } catch {
          return false;
        }
      })
      .flatMap((rule) => rule.modules || []),
  );
}

export async function loadPageModules(rootPrefix = '') {
  const page = currentPage();
  const targets = collectModules(page);
  window.__IKSASS_PAGE_MODULES = targets.slice();
  for (const modulePath of targets) {
    const normalized = modulePath.startsWith('http') ? modulePath : `${rootPrefix}${modulePath}`;
    try {
      await import(new URL(normalized, window.location.href));
    } catch (error) {
      console.warn('[IKSASS] Failed to load page module:', normalized, error);
    }
  }
}
