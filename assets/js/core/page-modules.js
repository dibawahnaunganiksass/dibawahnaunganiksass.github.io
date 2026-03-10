const MODULES = {
  '404.html': ['assets/js/pages/error404.js'],
  'berita': ['assets/js/pages/news-index.js'],
  'profil/program-kerja': ['assets/js/pages/proker-dialog.js'],
  'program-kerja': ['assets/js/pages/proker-dialog.js'],
};

function currentPage() {
  return document.body?.dataset?.page || '';
}

export async function loadPageModules(rootPrefix = '') {
  const page = currentPage();
  const targets = MODULES[page] || [];
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
