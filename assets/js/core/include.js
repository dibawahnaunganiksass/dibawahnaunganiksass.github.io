import { escapeHTML, normalizeNewsItems, resolveImageUrl, sortNewsLatest } from './content-utils.js';

const CACHE_VERSION = 'phase2-20260315-mobile-apps-sidik-v1';

function applyRoot(html, rootPrefix) {
  const safeRoot = typeof rootPrefix === 'string' ? rootPrefix : '';
  return String(html || '')
    .replace(/\{\{\s*root\s*\}\}/g, safeRoot)
    .replace(/\{\s*root\s*\}/g, safeRoot);
}

function cacheKey(name) {
  return `iksass:${CACHE_VERSION}:partial:raw:${name}`;
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
  const reset = () => {
    root.style.setProperty('--iksass-nav-left-shift', '0px');
    root.style.setProperty('--iksass-nav-right-shift', '0px');
    root.style.setProperty('--iksass-nav-left-shift-mobile', '0px');
    root.style.setProperty('--iksass-nav-right-shift-mobile', '0px');
    document.querySelectorAll('.iksass-shell-target').forEach((el) => {
      el.classList.remove('iksass-shell-target', 'iksass-primary-shell');
    });
  };

  const isVisible = (el) => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  const rect = (el) => (isVisible(el) ? el.getBoundingClientRect() : null);

  if (!document.body) {
    reset();
    return;
  }

  const candidates = getSiteShellCandidates();
  if (!candidates.length) {
    reset();
    return;
  }

  document.querySelectorAll('.iksass-shell-target').forEach((el) => {
    if (!candidates.includes(el)) el.classList.remove('iksass-shell-target', 'iksass-primary-shell');
  });
  candidates.forEach((el, index) => {
    el.classList.add('iksass-shell-target');
    el.classList.toggle('iksass-primary-shell', index === 0);
  });

  const content = candidates[0];
  const navLeft = document.querySelector('.header .nav-left');
  const navCta = document.querySelector('.header .nav-cta');
  if (!content || !navLeft || !navCta) {
    reset();
    return;
  }

  const logo = document.querySelector('.header .brand-mark');
  const login = document.querySelector('.header .nav-cta a[href$="auth/login/"]');
  const apps = document.querySelector('.header .appsbtn');
  const ctaButtons = Array.from(document.querySelectorAll('.header .nav-cta .iconbtn, .header .nav-cta a.iconbtn'));

  root.style.setProperty('--iksass-nav-left-shift', '0px');
  root.style.setProperty('--iksass-nav-right-shift', '0px');
  root.style.setProperty('--iksass-nav-left-shift-mobile', '0px');
  root.style.setProperty('--iksass-nav-right-shift-mobile', '0px');

  requestAnimationFrame(() => {
    const contentRect = content.getBoundingClientRect();
    const contentStyles = getComputedStyle(content);
    const contentInnerLeft = contentRect.left + (parseFloat(contentStyles.paddingLeft) || 0);
    const contentInnerRight = contentRect.right - (parseFloat(contentStyles.paddingRight) || 0);

    if (window.innerWidth >= 992) {
      const logoRect = rect(logo);
      const loginRect = rect(login);
      if (!logoRect || !loginRect) {
        reset();
        return;
      }
      const leftDelta = contentRect.left - logoRect.left;
      const rightDelta = contentRect.right - loginRect.right;
      root.style.setProperty('--iksass-nav-left-shift', `${leftDelta.toFixed(2)}px`);
      root.style.setProperty('--iksass-nav-right-shift', `${rightDelta.toFixed(2)}px`);
      return;
    }

    const leftAnchorEl = isVisible(apps) ? apps : logo;
    const visibleCtas = ctaButtons.filter(isVisible);
    const rightAnchorEl = visibleCtas.length ? visibleCtas.reduce((best, el) => (el.getBoundingClientRect().right > best.getBoundingClientRect().right ? el : best)) : login;
    const leftRect = rect(leftAnchorEl);
    const rightRect = rect(rightAnchorEl);
    if (!leftRect || !rightRect) {
      reset();
      return;
    }

    const leftDelta = contentInnerLeft - leftRect.left;
    const rightDelta = contentInnerRight - rightRect.right;
    root.style.setProperty('--iksass-nav-left-shift-mobile', `${leftDelta.toFixed(2)}px`);
    root.style.setProperty('--iksass-nav-right-shift-mobile', `${rightDelta.toFixed(2)}px`);
  });
}

function scheduleSiteShellAlignment() {
  syncSiteShellAlignment();
  requestAnimationFrame(syncSiteShellAlignment);
  setTimeout(syncSiteShellAlignment, 80);
  setTimeout(syncSiteShellAlignment, 220);
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
