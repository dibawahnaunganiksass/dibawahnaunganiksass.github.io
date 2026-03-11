import { normalizeCanonicalMeta } from './meta.js';
import { bindHeaderScrollFX, injectPartial } from './include.js';
import { decorateBodyDataset, findSiteBase, getRootPrefix } from './path.js';
import { loadLegacyModules } from './legacy-loader.js';
import { loadPageModules } from './page-modules.js';
import { initGlobalNavigation } from './nav.js';

async function init() {
  document.body?.setAttribute('data-app-ready', 'false');
  normalizeCanonicalMeta();
  decorateBodyDataset();

  const siteBaseUrl = await findSiteBase();
  const rootPrefix = getRootPrefix(siteBaseUrl);
  window.__IKSASS_ROOT_PREFIX = rootPrefix;
  document.documentElement.style.setProperty('--iksass-root-prefix', rootPrefix || './');

  await Promise.all([
    injectPartial('header', siteBaseUrl, rootPrefix),
    injectPartial('footer', siteBaseUrl, rootPrefix),
  ]);

  bindHeaderScrollFX();
  initGlobalNavigation();
  await loadLegacyModules(rootPrefix);
  await loadPageModules(rootPrefix);

  document.body?.setAttribute('data-app-ready', 'true');
  document.documentElement.classList.add('app-ready');
  document.dispatchEvent(new CustomEvent('partials:loaded'));
  document.dispatchEvent(new CustomEvent('iksass:ready', { detail: { rootPrefix, siteBaseUrl } }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
