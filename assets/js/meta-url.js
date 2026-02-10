(() => {
  const href = location.href;
  // canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = href;

  // og:url
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property','og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', href);
})();