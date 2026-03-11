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
    siteUtils: `${rootPrefix}assets/js/site-utils.min.js`,
    main: `${rootPrefix}assets/js/main.min.js`,
    searchIndex: `${rootPrefix}assets/js/search-index.min.js`,
    searchUi: `${rootPrefix}assets/js/search.min.js`,
    accordion: `${rootPrefix}assets/js/accordion.min.js`,
    homeNews: `${rootPrefix}assets/js/home-news.min.js`,
    homeImpact: `${rootPrefix}assets/js/home-impact.min.js`,
    homeTestimonials: `${rootPrefix}assets/js/home-testimonials.min.js`,
    bukanPilihan: `${rootPrefix}assets/js/bukan-pilihan.min.js`,
    heroAuto: `${rootPrefix}assets/js/hero-auto.min.js`,
    docs: `${rootPrefix}assets/js/docs.min.js`,
    marsHymne: `${rootPrefix}assets/js/mars-hymne.min.js`,
    wasiatAnimate: `${rootPrefix}assets/js/wasiat-animate.min.js`,
  };
}

function requiresLegacyMain() {
  if (pageIs('home')) return true;
  if (pageIs('search')) return true;
  if (pageIs('profil/mars-hymne')) return true;
  if (pageIs('wasiat')) return true;
  return false;
}

function legacyPlan(rootPrefix) {
  const m = manifest(rootPrefix);
  const scripts = [m.siteUtils];

  if (requiresLegacyMain()) {
    scripts.push(m.main);
  }

  if (!inSet(['auth/login', 'auth/register'])) {
    scripts.push(m.searchIndex, m.searchUi);
  }
  if (pageIs('home')) {
    scripts.push(m.accordion, m.homeNews, m.homeImpact, m.homeTestimonials);
  }
  if (pageIs('berita') || has('.news-hero') || has('.featured-media__frame img')) {
    scripts.push(m.bukanPilihan, m.heroAuto);
  }
  if (pageIs('dokumen') || has('[data-docs-root]') || has('[data-documents]')) {
    scripts.push(m.docs);
  }
  if (inSet(['faq', 'profil/prinsip-perjuangan', 'kelembagaan/pengurus-pusat-iksass'])) {
    scripts.push(m.accordion);
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
