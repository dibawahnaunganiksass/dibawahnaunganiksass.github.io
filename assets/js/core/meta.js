export function normalizeCanonicalMeta() {
  const u = new URL(location.href);
  u.pathname = u.pathname.replace(/\/{2,}/g, '/');
  const href = u.toString();

  const canonicals = [...document.querySelectorAll('link[rel="canonical"]')];
  let canonical = canonicals[canonicals.length - 1];
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = href;
  canonicals.slice(0, -1).forEach((n) => n.remove());

  const ogs = [...document.querySelectorAll('meta[property="og:url"]')];
  let ogUrl = ogs[ogs.length - 1];
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', href);
  ogs.slice(0, -1).forEach((n) => n.remove());
}
