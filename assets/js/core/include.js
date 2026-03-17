import { escapeHTML, normalizeNewsItems, resolveImageUrl, sortNewsLatest } from './content-utils.js';

const CACHE_VERSION = 'phase2-20260317-mobile-shell-right-rail-v5';

function applyRoot(html, rootPrefix) {
  const safeRoot = typeof rootPrefix === 'string' ? rootPrefix : '';
  return String(html || '')
    .replace(/\{\{\s*root\s*\}\}/g, safeRoot)
    .replace(/\{\s*root\s*\}/g, safeRoot);
}

function cacheKey(name) {
  return `iksass:${CACHE_VERSION}:partial:raw:${name}`;
}


function getViewportScrollbarWidth() {
  const doc = document.documentElement;
  const width = window.innerWidth - doc.clientWidth;
  return Math.max(0, Math.round(width));
}

function updateViewportShellCompensation() {
  const root = document.documentElement;
  const width = getViewportScrollbarWidth();
  root.style.setProperty('--iksass-scrollbar-comp', `${width}px`);
  return width;
}

function getSiteShellCandidates() {
  const shellClasses = ['container', 'page-container', 'page-shell', 'section-shell', 'org-structure', 'sejarah-shell', 'mh-wrap', 'yel-wrap'];
  const seen = new Set();
  const out = [];

  const isVisible = (el) => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  const isShell = (el) => !!(el && el.classList && shellClasses.some((cls) => el.classList.contains(cls)));
  const push = (el) => {
    if (!el || seen.has(el) || !isVisible(el)) return;
    if (el.closest('header, .header, .mobile-drawer, footer, [data-include="footer"]')) return;
    const box = el.getBoundingClientRect();
    if (box.width < 280 || box.height < 12) return;
    seen.add(el);
    out.push(el);
  };

  const collectNestedShells = (scope) => {
    if (!scope) return;
    Array.from(scope.children || []).forEach((child) => {
      if (!child || child.matches('header, .header, .mobile-drawer, footer, script, style, template')) return;
      if (isShell(child)) push(child);
      Array.from(child.children || []).forEach((grand) => {
        if (isShell(grand)) push(grand);
      });
    });
  };

  const main = document.querySelector('main#konten, main');

  Array.from(document.body?.children || []).forEach((child) => {
    if (!child || child.matches('header, .header, .mobile-drawer, footer, script, style, template')) return;
    if (main && child === main) return;
    if (isShell(child)) push(child);
    Array.from(child.children || []).forEach((grand) => {
      if (isShell(grand)) push(grand);
    });
  });

  collectNestedShells(main);

  out.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    if (Math.abs(ar.top - br.top) > 1) return ar.top - br.top;
    if (Math.abs(ar.left - br.left) > 1) return ar.left - br.left;
    return br.width - ar.width;
  });

  return out;
}

function syncSiteShellAlignment() {
  const root = document.documentElement;
  updateViewportShellCompensation();
  root.style.setProperty('--iksass-nav-left-shift', '0px');
  root.style.setProperty('--iksass-nav-right-shift', '0px');
  root.style.setProperty('--iksass-nav-left-shift-mobile', '0px');
  root.style.setProperty('--iksass-nav-right-shift-mobile', '0px');
  root.style.setProperty('--iksass-nav-wrap-shift', '0px');
  root.style.removeProperty('--iksass-dynamic-shell-outer-width');
  root.style.removeProperty('--iksass-dynamic-shell-pad-left');
  root.style.removeProperty('--iksass-dynamic-shell-pad-right');
  root.style.removeProperty('--iksass-mobile-shell-left');
  root.style.removeProperty('--iksass-mobile-shell-right');

  document.querySelectorAll('.iksass-shell-target').forEach((el) => {
    el.classList.remove('iksass-shell-target', 'iksass-primary-shell');
  });

  const navWrap = document.querySelector('.header .navbar > .wrap, header.header .navbar > .wrap');
  const contentShell = getSiteShellCandidates()[0] || null;
  const nav = getShellBounds(navWrap);
  const content = getShellBounds(contentShell);

  if (navWrap && contentShell && nav && content) {
    contentShell.classList.add('iksass-shell-target', 'iksass-primary-shell');
    root.style.setProperty('--iksass-dynamic-shell-outer-width', `${Math.round(content.outerWidth)}px`);
    root.style.setProperty('--iksass-dynamic-shell-pad-left', `${Math.round(content.padLeft)}px`);
    root.style.setProperty('--iksass-dynamic-shell-pad-right', `${Math.round(content.padRight)}px`);
    root.style.setProperty('--iksass-nav-wrap-shift', `${Math.round(content.outerLeft - nav.outerLeft)}px`);
  }

  if (window.matchMedia('(max-width: 991px)').matches) {
    const appsBtn = document.querySelector('.header .appsbtn');
    const hamburgerBtn = document.querySelector('.header .hamburger');
    const fallbackLeft = nav ? nav.left : 16;
    const fallbackRight = nav ? Math.max(0, window.innerWidth - nav.right) : 16;
    const leftEdge = appsBtn && appsBtn.getBoundingClientRect ? appsBtn.getBoundingClientRect().left : fallbackLeft;
    const rawRightEdge = hamburgerBtn && hamburgerBtn.getBoundingClientRect ? Math.max(0, window.innerWidth - hamburgerBtn.getBoundingClientRect().right) : fallbackRight;
    const rightVisualTrim = 4;
    const rightEdge = rawRightEdge + rightVisualTrim;
    root.style.setProperty('--iksass-mobile-shell-left', `${Math.max(12, Math.round(leftEdge))}px`);
    root.style.setProperty('--iksass-mobile-shell-right', `${Math.max(12, Math.round(rightEdge))}px`);
    root.style.setProperty('--iksass-nav-wrap-shift', '0px');
    root.style.setProperty('--iksass-dynamic-shell-outer-width', '100%');
    root.style.setProperty('--iksass-dynamic-shell-pad-left', `${Math.max(12, Math.round(leftEdge))}px`);
    root.style.setProperty('--iksass-dynamic-shell-pad-right', `${Math.max(12, Math.round(rightEdge))}px`);
  }

  updateShellDebugOverlay();
}

function scheduleSiteShellAlignment() {
  syncSiteShellAlignment();
}


function ensureShellDebugOverlay() {
  return null;
}

function getShellBounds(el) {
  if (!el || !el.getBoundingClientRect) return null;
  const rect = el.getBoundingClientRect();
  if (!rect.width) return null;
  const styles = getComputedStyle(el);
  const padLeft = parseFloat(styles.paddingLeft || '0') || 0;
  const padRight = parseFloat(styles.paddingRight || '0') || 0;
  return {
    left: rect.left + padLeft,
    right: rect.right - padRight,
    width: Math.max(0, rect.width - padLeft - padRight),
    outerLeft: rect.left,
    outerRight: rect.right,
    outerWidth: rect.width,
    padLeft,
    padRight,
  };
}

function updateShellDebugOverlay() {
  return;
}

function setHTMLAll(holders, html, removeAttr = true, name = '') {
  holders.forEach((holder) => {
    holder.innerHTML = html;
    holder.classList.add('partial-slot');
    if (name) {
      holder.classList.add(`partial-slot--${name}`);
      holder.setAttribute('data-partial-slot', name);
    }
    if (removeAttr) holder.removeAttribute('data-include');
    holder.style.minHeight = '0';
  });
}

export function enhanceBeritaMega(rootPrefix) {
  const mega = document.querySelector('.berita-mega .mega-posts');
  if (!mega) return;

  fetch(`${rootPrefix}berita/news-index.json`, { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('news index not found'))))
    .then((list) => {
      const items = sortNewsLatest(normalizeNewsItems(list)).slice(0, 4);
      if (!items.length) return;
      mega.innerHTML = items.map((item) => {
        const slug = escapeHTML(item.slug);
        const href = `${rootPrefix}berita/${slug}/`;
        const image = resolveImageUrl(item.image, rootPrefix);
        const title = escapeHTML(item.title);
        const date = escapeHTML(item.date_display || '');
        const excerpt = escapeHTML(item.excerpt || '');
        return `
          <a class="mega-card" href="${href}">
            <img class="mega-thumb" src="${image}" alt="${title}" decoding="async" loading="lazy" fetchpriority="low" width="160" height="96"/>
            <div class="mega-card-body">
              <div class="mega-card-title">${title}</div>
              <div class="mega-card-meta">${date}</div>
              <div class="mega-card-snippet mega-card-excerpt">${excerpt}</div>
            </div>
          </a>
        `.trim();
      }).join('');
    })
    .catch(() => {});
}

export async function injectPartial(name, siteBaseUrl, rootPrefix) {
  const holders = Array.from(document.querySelectorAll(`[data-include="${name}"]`));
  if (!holders.length) return false;

  try {
    const cachedRaw = localStorage.getItem(cacheKey(name));
    if (cachedRaw) {
      setHTMLAll(holders, applyRoot(cachedRaw, rootPrefix), false, name);
      if (name === 'header') {
        enhanceBeritaMega(rootPrefix);
        scheduleSiteShellAlignment();
      }
    }
  } catch {}

  try {
    const url = new URL(`partials/${name}.html`, siteBaseUrl).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const raw = await res.text();
    const html = applyRoot(raw, rootPrefix);
    const current = holders[0]?.innerHTML || '';

    if (current !== html) {
      setHTMLAll(holders, html, true, name);
    } else {
      holders.forEach((holder) => {
        holder.classList.add('partial-slot');
        holder.classList.add(`partial-slot--${name}`);
        holder.setAttribute('data-partial-slot', name);
        holder.removeAttribute('data-include');
        holder.style.minHeight = '0';
      });
    }

    if (name === 'header') {
      enhanceBeritaMega(rootPrefix);
      scheduleSiteShellAlignment();
    }
    try {
      localStorage.setItem(cacheKey(name), raw);
    } catch {}
    return true;
  } catch {
    return false;
  }
}

export function bindHeaderScrollFX() {
  if (window.__IKSASS_PARTIAL_SCROLL_FX) return;
  const header = document.querySelector('header.header');
  if (!header) return;

  const root = document.documentElement;
  const syncHeaderHeight = () => {
    root.style.setProperty('--iksass-header-h', `${header.offsetHeight}px`);
  };
  const onScroll = () => {
    const scrolled = (window.scrollY || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
    syncHeaderHeight();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    syncHeaderHeight();
    onScroll();
    scheduleSiteShellAlignment();
  }, { passive: true });
  requestAnimationFrame(() => {
    syncHeaderHeight();
    onScroll();
    scheduleSiteShellAlignment();
  });
  window.addEventListener('load', scheduleSiteShellAlignment, { passive: true });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(scheduleSiteShellAlignment).catch(() => {}); }
  window.__IKSASS_PARTIAL_SCROLL_FX = true;
}
