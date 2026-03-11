function keepLast(selector, setup) {
  const nodes = [...document.querySelectorAll(selector)];
  let current = nodes[nodes.length - 1];
  if (!current && typeof setup === 'function') {
    current = setup();
  }
  if (!current) return null;
  nodes.slice(0, -1).forEach((node) => node.remove());
  return current;
}

export function normalizeCanonicalMeta() {
  const url = new URL(location.href);
  url.pathname = url.pathname.replace(/\/{2,}/g, '/');
  const href = url.toString();

  const canonical = keepLast('link[rel="canonical"]', () => {
    const node = document.createElement('link');
    node.rel = 'canonical';
    document.head.appendChild(node);
    return node;
  });
  canonical.href = href;

  const ogUrl = keepLast('meta[property="og:url"]', () => {
    const node = document.createElement('meta');
    node.setAttribute('property', 'og:url');
    document.head.appendChild(node);
    return node;
  });
  ogUrl.setAttribute('content', href);

  keepLast('link[rel="icon"]:not([sizes])');
  keepLast('link[rel="apple-touch-icon"]:not([sizes])');
}
