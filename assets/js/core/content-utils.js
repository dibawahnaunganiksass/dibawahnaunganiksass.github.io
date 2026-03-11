import { toRootUrl } from './path.js';

const MONTHS_LONG_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseISODate(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateIDLong(value) {
  const date = parseISODate(value);
  if (!date) return String(value || '').trim();
  return `${date.getDate()} ${MONTHS_LONG_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateBadgeID(value) {
  const date = parseISODate(value);
  if (!date) return null;
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: MONTHS_SHORT_ID[date.getMonth()],
  };
}

export function resolveImageUrl(imgPath, rootPrefix = '') {
  const raw = String(imgPath || '').trim();
  if (!raw) return `${rootPrefix}assets/img/og-default.png`;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return `${rootPrefix}${raw.replace(/^\//, '')}`;
  return `${rootPrefix}${raw.replace(/^\.\//, '')}`;
}

export function normalizeNewsItems(list) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...item,
      slug: String(item.slug || '').trim(),
      title: String(item.title || '').trim(),
      excerpt: String(item.excerpt || '').trim(),
      location: String(item.location || '').trim(),
      image: String(item.image || '').trim(),
      date_iso: String(item.date_iso || '').trim(),
      date_display: String(item.date_display || '').trim(),
      popular_score: Number(item.popular_score || 0) || 0,
    }))
    .filter((item) => item.slug && item.title);
}

export function sortNewsLatest(items) {
  return items.slice().sort((a, b) => {
    if (b.date_iso !== a.date_iso) return b.date_iso.localeCompare(a.date_iso);
    return b.popular_score - a.popular_score;
  });
}

export async function fetchRootJson(path, rootPrefix = '') {
  const res = await fetch(toRootUrl(path, rootPrefix), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}
