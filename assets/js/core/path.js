export async function findSiteBase(maxUp = 6) {
  let dir = new URL('./', location.href);
  for (let i = 0; i <= maxUp; i += 1) {
    const testUrl = new URL('partials/header.html', dir).toString();
    try {
      const res = await fetch(testUrl, { cache: 'no-store' });
      if (res && res.ok) return dir.toString();
    } catch {}
    dir = new URL('../', dir);
  }
  return new URL('./', location.href).toString();
}

export function getRootPrefix(siteBaseUrl) {
  try {
    const pageDir = new URL('./', location.href);
    const siteDir = new URL(siteBaseUrl || pageDir.href);
    const pageParts = pageDir.pathname.split('/').filter(Boolean);
    const siteParts = siteDir.pathname.split('/').filter(Boolean);
    let diff = 0;
    if (pageDir.pathname.startsWith(siteDir.pathname)) {
      diff = Math.max(0, pageParts.length - siteParts.length);
    }
    return '../'.repeat(diff);
  } catch {
    return '';
  }
}

export function toRootUrl(value, rootPrefix = '') {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('#')) return v;
  if (v.startsWith('/')) return `${rootPrefix}${v.slice(1)}`;
  return `${rootPrefix}${v.replace(/^\.+\//, '')}`;
}

export function inferPageKey() {
  const path = (location.pathname || '/').replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
  return path || 'home';
}

export function decorateBodyDataset() {
  const body = document.body;
  if (!body) return;
  const pageKey = inferPageKey();
  if (!body.dataset.page) body.dataset.page = pageKey;
  const segments = pageKey.split('/').filter(Boolean);
  if (segments[0] && !body.dataset.section) body.dataset.section = segments[0];
}

export function ensureScript(src, key) {
  try {
    const abs = new URL(src, location.href).href;
    const existing = Array.from(document.querySelectorAll('script[src]')).some(
      (s) => new URL(s.getAttribute('src'), location.href).href === abs,
    );
    if (existing) return Promise.resolve(false);
    if (key && document.querySelector(`script[data-iksass="${key}"]`)) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      if (key) s.dataset.iksass = key;
      s.src = src;
      s.defer = true;
      s.onload = () => resolve(true);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  } catch (err) {
    return Promise.reject(err);
  }
}
