import { ensureScript } from './path.js';

function has(sel) {
  try { return !!document.querySelector(sel); } catch { return false; }
}

function page() {
  return document.body?.dataset?.page || '';
}

function pageIs(prefix) {
  const current = page();
  return current === prefix || current.startsWith(`${prefix}/`);
}

function inSet(values) {
  return values.includes(page());
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function manifest(rootPrefix) {
  return {
    main: `${rootPrefix}assets/js/main.min.js`,
    searchIndex: `${rootPrefix}assets/js/search-index.min.js`,
    searchUi: `${rootPrefix}assets/js/search.min.js`,
    accordion: `${rootPrefix}assets/js/accordion.min.js`,
    homeNews: `${rootPrefix}assets/js/home-news.min.js`,
    homeImpact: `${rootPrefix}assets/js/home-impact.min.js`,
    homeTestimonials: `${rootPrefix}assets/js/home-testimonials.min.js`,
    bukanPilihan: `${rootPrefix}assets/js/bukan-pilihan.min.js`,
    sidebarNews: `${rootPrefix}assets/js/sidebar-news.min.js`,
    share: `${rootPrefix}assets/js/share.min.js`,
    newsShare: `${rootPrefix}assets/js/news-share.js`,
    heroAuto: `${rootPrefix}assets/js/hero-auto.min.js`,
    docs: `${rootPrefix}assets/js/docs.min.js`,
    orgSearch: `${rootPrefix}assets/js/kelembagaan-search.min.js`,
    orgStats: `${rootPrefix}assets/js/kelembagaan-stats.min.js`,
    rayonDetail: `${rootPrefix}assets/js/rayon-detail-page.min.js`,
    komisariatDetail: `${rootPrefix}assets/js/komisariat-detail-page.min.js`,
    subrayonDetail: `${rootPrefix}assets/js/subrayon-detail-page.min.js`,
    marsHymne: `${rootPrefix}assets/js/mars-hymne.min.js`,
    wasiatAnimate: `${rootPrefix}assets/js/wasiat-animate.min.js`,
  };
}

function legacyPlan(rootPrefix) {
  const m = manifest(rootPrefix);
  const scripts = [m.main];

  if (!inSet(['auth/login', 'auth/register'])) {
    scripts.push(m.searchIndex, m.searchUi);
  }
  if (pageIs('home')) {
    scripts.push(m.accordion, m.homeNews, m.homeImpact, m.homeTestimonials);
  }
  if (pageIs('berita') || has('.news-hero') || has('[data-share-root]') || has('.featured-media__frame img')) {
    scripts.push(m.bukanPilihan, m.sidebarNews, m.share, m.heroAuto);
    if (has('.sharebar') || has('[data-news-share]')) {
      scripts.push(m.newsShare);
    }
  }
  if (pageIs('dokumen') || has('[data-docs-root]') || has('[data-documents]')) {
    scripts.push(m.docs);
  }
  if (!pageIs('home') && (has('.accordion') || inSet(['faq', 'profil/prinsip-perjuangan']))) {
    scripts.push(m.accordion);
  }
  if (pageIs('kelembagaan') || pageIs('kelembagaan/pengurus-pusat-iksass') || pageIs('kelembagaan/pengurus-rayon-iksass') || pageIs('kelembagaan/pengurus-komisariat-iksass') || pageIs('kelembagaan/pengurus-sub-rayon-iksass')) {
    scripts.push(m.orgSearch);
  }
  if (pageIs('kelembagaan/pengurus-pusat-iksass')) {
    scripts.push(m.orgStats);
  }
  if (pageIs('kelembagaan/pengurus-rayon-iksass/detail')) {
    scripts.push(m.rayonDetail);
  }
  if (pageIs('kelembagaan/pengurus-komisariat-iksass/detail')) {
    scripts.push(m.komisariatDetail);
  }
  if (pageIs('kelembagaan/pengurus-sub-rayon-iksass/detail')) {
    scripts.push(m.subrayonDetail);
  }
  if (pageIs('profil/mars-hymne')) {
    scripts.push(m.marsHymne);
  }
  if (pageIs('wasiat') || has('[data-animate]')) {
    scripts.push(m.wasiatAnimate);
  }
  return unique(scripts);
}

export async function loadLegacyModules(rootPrefix) {
  const scripts = legacyPlan(rootPrefix);
  window.__IKSASS_LEGACY_PLAN = scripts.slice();
  for (const src of scripts) {
    try {
      await ensureScript(src, src.replace(location.origin, ''));
    } catch (error) {
      console.warn('[IKSASS] Failed to load legacy module:', src, error);
    }
  }
}
