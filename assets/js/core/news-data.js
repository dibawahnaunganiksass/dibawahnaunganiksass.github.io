import { fetchRootJson, normalizeNewsItems, sortNewsLatest } from './content-utils.js';

let newsCache = null;

export async function getNewsIndex(rootPrefix = '') {
  if (!newsCache) {
    newsCache = fetchRootJson('berita/news-index.json', rootPrefix)
      .then((items) => sortNewsLatest(normalizeNewsItems(items)))
      .catch((error) => {
        newsCache = null;
        throw error;
      });
  }
  return newsCache;
}

export function getCurrentNewsSlug(pathname = window.location.pathname) {
  const match = String(pathname || '').match(/\/berita\/([^/]+)\/?$/i);
  return match ? match[1] : '';
}
