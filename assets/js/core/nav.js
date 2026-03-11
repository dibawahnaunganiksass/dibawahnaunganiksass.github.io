function q(selector, root = document) {
  return root.querySelector(selector);
}

function qa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function normPath(input = location.pathname || '/') {
  let value = String(input || '/').replace(/index\.html$/i, '');
  if (!value.startsWith('/')) value = `/${value}`;
  if (value.length > 1 && !value.endsWith('/')) value += '/';
  return value;
}

function safeFocus(el) {
  if (!el) return;
  const hadTabIndex = el.hasAttribute('tabindex');
  if (!hadTabIndex) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  if (!hadTabIndex) {
    const cleanup = () => {
      el.removeAttribute('tabindex');
      el.removeEventListener('blur', cleanup);
    };
    el.addEventListener('blur', cleanup, { once: true });
  }
}

function bindSkipLink() {
  if (window.__IKSASS_SKIPLINK_READY) return;

  const focusTarget = () => {
    const target = document.getElementById('konten') || q('main') || q('[role="main"]');
    safeFocus(target);
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a.skip-link[href^="#"]');
    if (!link) return;
    const id = (link.getAttribute('href') || '').slice(1);
    if (id !== 'konten') return;
    setTimeout(focusTarget, 0);
  });

  window.addEventListener('hashchange', () => {
    if (location.hash === '#konten') setTimeout(focusTarget, 0);
  });

  window.__IKSASS_SKIPLINK_READY = true;
}

function stripDrawerCarets(root = document) {
  const carets = /[▾▼˅]/g;
  qa('.drawer-acc-btn', root).forEach((btn) => {
    btn.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = (node.textContent || '').replace(carets, '');
      }
    });
    btn.innerHTML = btn.innerHTML.replace(/\s+/g, ' ').trim();
  });
}

function setupMobileDrawer() {
  const drawer = q('[data-drawer]');
  const openButtons = qa('[data-drawer-open]');
  const closeButton = q('[data-drawer-close]');
  if (!drawer || !openButtons.length || !closeButton || drawer.dataset.navBound === '1') return;

  drawer.dataset.navBound = '1';
  stripDrawerCarets(drawer);

  const panel = q('.drawer-panel', drawer);
  const title = q('#drawer-title', drawer);
  const brand = q('.drawer-brand', drawer);
  const contentPanels = qa('[data-drawer-content]', drawer);
  const logos = qa('[data-drawer-logo]', drawer);
  let lastFocused = null;
  let activeMode = 'menu';

  const setMode = (mode) => {
    activeMode = mode === 'apps' ? 'apps' : 'menu';
    const titleText = activeMode === 'apps' ? 'Aplikasi' : 'Menu';
    if (title) title.textContent = titleText;
    if (panel) panel.setAttribute('aria-label', titleText);
    if (brand) brand.setAttribute('aria-label', activeMode === 'apps' ? 'Aplikasi IKSASS' : 'IKSASS');

    contentPanels.forEach((section) => {
      const show = section.getAttribute('data-drawer-content') === activeMode;
      section.style.display = show ? '' : 'none';
      section.setAttribute('aria-hidden', show ? 'false' : 'true');
    });

    logos.forEach((logo) => {
      const show = logo.getAttribute('data-drawer-logo') === activeMode;
      logo.style.display = show ? '' : 'none';
      logo.setAttribute('aria-hidden', show ? 'false' : 'true');
    });

    openButtons.forEach((button) => {
      const expanded = drawer.classList.contains('is-open') && (button.getAttribute('data-drawer-open') || 'menu') === activeMode;
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  };

  const focusables = () => qa('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', drawer)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);

  const trapFocus = (event) => {
    if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('drawer-open');
    document.body.classList.remove('drawer-open');
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  const openDrawer = (mode = 'menu', trigger = null) => {
    lastFocused = trigger || document.activeElement;
    setMode(mode);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    openButtons.forEach((button) => {
      const expanded = (button.getAttribute('data-drawer-open') || 'menu') === activeMode;
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    const first = focusables()[0] || closeButton;
    if (first) setTimeout(() => first.focus(), 0);
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openDrawer(button.getAttribute('data-drawer-open') || 'menu', button));
  });

  closeButton.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) closeDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    trapFocus(event);
  });

  drawer.addEventListener('click', (event) => {
    const button = event.target.closest('.drawer-acc-btn');
    if (!button) return;
    const wrap = button.closest('.drawer-acc');
    if (!wrap) return;
    wrap.classList.toggle('open');
    button.classList.toggle('is-active', wrap.classList.contains('open'));
  });

  setMode('menu');
}

function setupDesktopDropdowns() {
  const nav = q('.navlinks');
  if (!nav || nav.dataset.navDropdownBound === '1') return;
  nav.dataset.navDropdownBound = '1';

  const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;
  const dropdowns = qa('.dropdown', nav);

  const closeAll = () => {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove('is-open');
      q('.dropbtn', dropdown)?.setAttribute('aria-expanded', 'false');
      q('.menu', dropdown)?.setAttribute('aria-hidden', 'true');
    });
  };

  const openDropdown = (dropdown) => {
    const button = q('.dropbtn', dropdown);
    const menu = q('.menu', dropdown);
    if (!button || !menu) return;
    dropdown.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  };

  nav.addEventListener('click', (event) => {
    const button = event.target.closest('.dropbtn');
    if (!button || !isDesktop()) return;
    event.preventDefault();
    const dropdown = button.closest('.dropdown');
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('is-open');
    closeAll();
    if (!isOpen) openDropdown(dropdown);
  });

  dropdowns.forEach((dropdown) => {
    const button = q('.dropbtn', dropdown);
    const menu = q('.menu', dropdown);
    if (!button || !menu) return;

    dropdown.addEventListener('mouseenter', () => {
      if (!isDesktop()) return;
      closeAll();
      openDropdown(dropdown);
    });
    dropdown.addEventListener('mouseleave', () => {
      if (isDesktop()) closeAll();
    });

    button.addEventListener('keydown', (event) => {
      if (!isDesktop()) return;
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        closeAll();
        openDropdown(dropdown);
        qa('a[href]', menu)[0]?.focus();
      }
      if (event.key === 'Escape') {
        closeAll();
        button.focus();
      }
    });

    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAll();
        button.focus();
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.navlinks')) closeAll();
  });
  window.addEventListener('resize', closeAll);
}

const TRAILS = {
  '/profil/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/']],
  '/profil/struktur-organisasi/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/'], ['Struktur Organisasi', '/profil/struktur-organisasi/']],
  '/profil/program-kerja/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/'], ['Program Kerja', '/profil/program-kerja/']],
  '/tentang/visi-misi/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/'], ['Visi & Misi', '/tentang/visi-misi/']],
  '/tentang/pesantren-pengasuh-dan-iksass/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/'], ['Pengasuh', '/tentang/pesantren-pengasuh-dan-iksass/']],
  '/tentang/pesantren/': [['Tentang', '/profil/'], ['Profil Organisasi', '/profil/'], ['Pesantren', '/tentang/pesantren/']],
  '/tentang/sejarah/': [['Tentang', '/profil/'], ['Sejarah & Nilai', '/tentang/sejarah/'], ['Sejarah', '/tentang/sejarah/']],
  '/profil/prinsip-perjuangan/': [['Tentang', '/profil/'], ['Sejarah & Nilai', '/tentang/sejarah/'], ['Prinsip Perjuangan', '/profil/prinsip-perjuangan/']],
  '/tentang/arah-gerak-perjuangan/': [['Tentang', '/profil/'], ['Sejarah & Nilai', '/tentang/sejarah/'], ['Arah Gerak & Perjuangan', '/tentang/arah-gerak-perjuangan/']],
  '/wasiat/': [['Tentang', '/profil/'], ['Sejarah & Nilai', '/tentang/sejarah/'], ['Wasiat', '/wasiat/']],
  '/profil/mars-hymne/': [['Tentang', '/profil/'], ['Identitas', '/profil/mars-hymne/'], ['Mars & Hymne IKSASS', '/profil/mars-hymne/']],
  '/profil/yel-yel/': [['Tentang', '/profil/'], ['Identitas', '/profil/yel-yel/'], ['Yel-yel IKSASS', '/profil/yel-yel/']],
  '/tentang/iksass/': [['Tentang', '/profil/'], ['Lainnya', '/tentang/iksass/'], ['Tentang IKSASS', '/tentang/iksass/']],
  '/tentang/website-ini/': [['Tentang', '/profil/'], ['Lainnya', '/tentang/website-ini/'], ['Website Ini', '/tentang/website-ini/']],
};

function setActiveLinks(root = document) {
  const current = normPath();
  qa('a[href]', root).forEach((anchor) => {
    const href = (anchor.getAttribute('href') || '').trim();
    if (!href || href.startsWith('#') || /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const target = normPath(new URL(anchor.href, location.origin).pathname);
      if (target === current) anchor.classList.add('is-active');
    } catch {}
  });

  qa('.dropdown').forEach((dropdown) => {
    if (q('.menu a.is-active', dropdown)) q('.dropbtn', dropdown)?.classList.add('is-active');
  });
  qa('.drawer-acc').forEach((acc) => {
    const hasActive = !!q('.drawer-acc-panel a.is-active', acc);
    if (hasActive) {
      acc.classList.add('open');
      q('.drawer-acc-btn', acc)?.classList.add('is-active');
    }
  });
}

function setAutoBreadcrumb() {
  const trail = TRAILS[normPath()];
  const host = q('.page .breadcrumb');
  if (!host || !trail || host.children.length) return;
  host.innerHTML = trail.map(([label, href], index) => {
    const last = index === trail.length - 1;
    if (last) return `<span class="current">${label}</span>`;
    return `<a href="${href}">${label}</a><span class="sep">/</span>`;
  }).join(' ');
  host.setAttribute('aria-label', 'Breadcrumb');
}

export function initGlobalNavigation() {
  bindSkipLink();
  setupMobileDrawer();
  setupDesktopDropdowns();
  setActiveLinks(document);
  setAutoBreadcrumb();
}
