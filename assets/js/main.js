// IKSASS Modern Minimal - main.js (supports shared header/footer injection)
(function(){
  function getRootPrefix(){
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  }
  const ROOT_PREFIX = getRootPrefix();

  // Normalize site-relative URLs so assets work on nested pages (e.g., /galeri/, /kontak/).
  function toRootUrl(u){
    const v = String(u || '').trim();
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
    if (v.startsWith('/')) return ROOT_PREFIX + v.slice(1);
    // strip leading ./ or ../ to avoid nesting issues, then anchor to ROOT_PREFIX
    return ROOT_PREFIX + v.replace(/^\.+\//, '');
  }

  window.__IKSASS_INIT = window.__IKSASS_INIT || {};

  // Remove any duplicated caret characters that might be embedded in drawer accordion labels
  // (e.g., "Profil ▾") so we only use the right-aligned caret.
  // IMPORTANT: do NOT use btn.textContent = ... because it will wipe icon spans.
  function stripDrawerCarets(root){
    const CARET_RE = /[▾▼]/g;
    const scope = root || document;
    scope.querySelectorAll('.drawer-acc-btn').forEach((btn) => {
      // Only sanitize text nodes, preserve existing elements (icons, etc.)
      btn.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          n.textContent = (n.textContent || '').replace(CARET_RE, '');
        }
      });

      // Normalize spacing (helps after removing characters)
      // Using innerHTML here is safe for our static markup and keeps icon spans intact.
      btn.innerHTML = btn.innerHTML.replace(/\s+/g, ' ').trim();
    });
  }

  // Drawer accordion (delegated; bind once)
  if (!window.__IKSASS_INIT.drawerAccDelegated) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.drawer-acc-btn');
      if (!btn) return;
      const wrap = btn.closest('.drawer-acc');
      if (!wrap) return;
      wrap.classList.toggle('open');
    });
    window.__IKSASS_INIT.drawerAccDelegated = true;
  }

  function setupMobileDrawer(){
    const drawer = document.querySelector('[data-drawer]');
    const openBtns = Array.from(document.querySelectorAll('[data-drawer-open]'));
    const closeBtn = document.querySelector('[data-drawer-close]');
    if (!drawer || !openBtns.length || !closeBtn) return;

    if (drawer.dataset.bound === '1') return;
    drawer.dataset.bound = '1';

    // Mark: new drawer system is active (used to disable legacy a11y binder below)
    window.__IKSASS_INIT.mobileDrawerV2 = true;

    const panel = drawer.querySelector('.drawer-panel');
    const panelLabel = panel;
    const titleEl = drawer.querySelector('#drawer-title');
    const brandEl = drawer.querySelector('.drawer-brand');
    const contentEls = Array.from(drawer.querySelectorAll('[data-drawer-content]'));
    const logoEls = Array.from(drawer.querySelectorAll('[data-drawer-logo]'));
    let lastFocus = null;
    let activeOpenBtn = null;

    const setMode = (mode) => {
      const m = (mode || 'menu') === 'apps' ? 'apps' : 'menu';
      const title = m === 'apps' ? 'Aplikasi' : 'Menu';

      // Title + a11y labels
      if (titleEl) titleEl.textContent = title;
      if (panelLabel) panelLabel.setAttribute('aria-label', title);
      if (brandEl) brandEl.setAttribute('aria-label', title);

      // Swap content blocks (same drawer UI)
      if (contentEls.length) {
        contentEls.forEach((el) => {
          el.style.display = (el.dataset.drawerContent === m) ? '' : 'none';
        });
      }

      // Swap brand logo
      if (logoEls.length) {
        logoEls.forEach((img) => {
          img.style.display = (img.dataset.drawerLogo === m) ? '' : 'none';
        });
      }
    };

    // Default: menu
    setMode('menu');

    // Remove any duplicated caret characters that might be embedded in labels
    // (e.g., "Profil ▾") so we only use the right-aligned caret.
    stripDrawerCarets(drawer);

    const focusables = () => Array.from(drawer.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);

    const setOpen = (open) => {
      drawer.classList.toggle('drawer-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      openBtns.forEach((b) => b.setAttribute('aria-expanded', (open && b === activeOpenBtn) ? 'true' : 'false'));
      document.documentElement.style.overflow = open ? 'hidden' : '';

      if (open) {
        lastFocus = activeOpenBtn || document.activeElement;
        const f = focusables();
        (closeBtn || f[0] || panel || drawer).focus?.();

        // Lazy-load berita data only when drawer opens (keeps header lighter)
        // Then build/refresh Berita accordion in the drawer.
        ensureBeritaDataLoaded().then(() => {
          setupMobileBeritaAccordion();
        });
      } else {
        lastFocus?.focus?.();
        lastFocus = null;
        activeOpenBtn = null;
      }
    };

    // If user resizes from mobile to desktop, always close the drawer
    // (prevents drawer panel from staying visible on desktop view).
    const mqDesktop = window.matchMedia('(min-width: 992px)');
    const handleToDesktop = () => {
      if (mqDesktop.matches) setOpen(false);
    };
    // Modern browsers: matchMedia change event
    try {
      mqDesktop.addEventListener('change', handleToDesktop);
    } catch (_) {
      // Safari legacy
      mqDesktop.addListener(handleToDesktop);
    }
    window.addEventListener('resize', handleToDesktop);

    openBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeOpenBtn = btn;
        setMode(btn.dataset.drawerOpen || 'menu');
        setOpen(true);
      });
    });
    closeBtn.addEventListener('click', () => setOpen(false));
    drawer.addEventListener('click', (e) => {
      // click outside panel closes
      if (e.target === drawer) setOpen(false);
    });

    // ESC closes + focus trap
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key !== 'Tab' || !drawer.classList.contains('drawer-open')) return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === drawer) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // Mobile drawer + desktop mega menu should read from ONE source of truth:
  // /berita/news-index.json (latest posts). Avoid depending on DOM scraping.

  // Helper: format ISO date -> "DD Mon YYYY" (ID short months)
  const __monthID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function __fmtDateID(iso){
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2,'0');
    return `${dd} ${__monthID[d.getMonth()]} ${d.getFullYear()}`;
  }

  let __newsIndexPromise = null;
  async function getLatestNews(limit = 4){
    if (__newsIndexPromise) {
      const all = await __newsIndexPromise;
      return all.slice(0, Math.max(0, limit));
    }

    __newsIndexPromise = (async () => {
      try{
        const res = await fetch(ROOT_PREFIX + 'berita/news-index.json', { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data
          .filter(x => x && x.slug && x.title)
          .map(x => ({
            slug: x.slug,
            title: x.title,
            image: x.image || '',
            excerpt: x.excerpt || '',
            date_iso: x.date_iso || '',
            date_display_short: x.date_iso ? __fmtDateID(x.date_iso) : (x.date_display || '')
          }))
          .sort((a,b) => (b.date_iso || '').localeCompare(a.date_iso || ''));
      }catch(_){
        return [];
      }
    })();

    const all = await __newsIndexPromise;
    return all.slice(0, Math.max(0, limit));
  }

  // Lazy-load Berita mega menu data (fetch only when needed)
  async function ensureBeritaDataLoaded(){
    if (window.__IKSASS_INIT.beritaDataLoaded) return true;
    try{
      // prime cache
      await getLatestNews(4);
      window.__IKSASS_INIT.beritaDataLoaded = true;
      return true;
    }catch(_){
      return false;
    }
  }

  // Lazy-load + build Berita mega menu (desktop). Kept separate so the mobile drawer
  // does not depend on desktop DOM.
  let __beritaMegaPromise = null;
  async function ensureBeritaMegaLoaded(){
    if (window.__IKSASS_INIT.beritaMegaLoaded) return true;
    if (__beritaMegaPromise) return __beritaMegaPromise;

    __beritaMegaPromise = (async () => {
      try{
        await ensureBeritaDataLoaded();
        await updateBeritaMegaMenu();
        window.__IKSASS_INIT.beritaMegaLoaded = true;
        return true;
      }catch(_){
        return false;
      }
    })();

    return __beritaMegaPromise;
  }

  // Update "Berita" mega menu (desktop) from /berita/news-index.json so hover always shows latest 4.
  async function updateBeritaMegaMenu(){
    const postsWrap = document.querySelector('.dropdown.berita-mega .mega-posts');
    if (!postsWrap) return;

    const items = await getLatestNews(4);
    if (!items.length) return;

    postsWrap.innerHTML = items.map(it => `
      <a class="mega-card" href="${ROOT_PREFIX}berita/${it.slug}/">
        <img class="mega-thumb" src="${toRootUrl(it.image) || (ROOT_PREFIX + 'assets/img/og-default.png')}" alt="${it.title}" loading="lazy" decoding="async"/>
        <div class="mega-card-body">
          <div class="mega-card-title">${it.title}</div>
          <div class="mega-card-meta">${it.date_display_short}</div>
          ${it.excerpt ? `<div class="mega-card-snippet">${it.excerpt}</div>` : ``}
        </div>
      </a>
    `.trim()).join('');
  }

  async function setupMobileBeritaAccordion(){
    const drawer = document.querySelector('[data-drawer]');
    if (!drawer) return;

    const drawerLinks = drawer.querySelector('.drawer-links[data-drawer-content="menu"]');
    if (!drawerLinks) return;

    // If already built, just refresh items (keeps it always in sync with JSON)
    const existing = drawer.querySelector('.drawer-berita');
    if (existing) {
      const list = existing.querySelector('.drawer-news-list');
      if (!list) return;
      const items = await getLatestNews(4);
      if (!items.length) return;
      list.innerHTML = '';
      items.forEach(it => {
        const a = document.createElement('a');
        a.className = 'drawer-news-item';
        a.href = `${ROOT_PREFIX}berita/${it.slug}/`;
        a.innerHTML = `<span class="t">${it.title}</span><span class="d">${it.date_display_short || ''}</span>`;
        list.appendChild(a);
      });
      return;
    }

    // Replace the single "Berita" link with an accordion
    const beritaLink = Array.from(drawerLinks.querySelectorAll('a'))
      .find(a => a.textContent.trim().toLowerCase() === 'berita');
    if (!beritaLink) return;

    const items = await getLatestNews(4);
    if (!items.length) return;

    const acc = document.createElement('div');
    acc.className = 'drawer-acc drawer-berita';
    acc.innerHTML = `
      <button class="drawer-acc-btn" type="button"><span class="drawer-ico ico-news" aria-hidden="true"></span> Berita</button>
      <div class="drawer-acc-panel">
        <div class="drawer-news-list"></div>
        <div class="drawer-news-actions"></div>
      </div>
    `;

    const list = acc.querySelector('.drawer-news-list');
    items.forEach(it => {
      const a = document.createElement('a');
      a.className = 'drawer-news-item';
      a.href = `${ROOT_PREFIX}berita/${it.slug}/`;
      a.innerHTML = `<span class="t">${it.title}</span><span class="d">${it.date_display_short || ''}</span>`;
      list.appendChild(a);
    });

    const actions = acc.querySelector('.drawer-news-actions');
    const pushAction = (href, text) => {
      if (!href) return;
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      actions.appendChild(a);
    };

    // Keep actions stable and independent from desktop markup
    pushAction(`${ROOT_PREFIX}berita/`, 'Lihat semua →');
    pushAction(`${ROOT_PREFIX}dokumen/`, 'Info Organisasi');

    beritaLink.replaceWith(acc);
    stripDrawerCarets(acc);
  }

  // Desktop: Berita mega menu (open/close delay + smooth animation)
  function setupBeritaMegaHover(){
    const wrap = document.querySelector('.dropdown.berita-mega');
    if (!wrap) return;
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';

    const trigger = wrap.querySelector('.dropbtn');
    const panel = wrap.querySelector('.mega');
    if (!trigger || !panel) return;

    const OPEN_DELAY = 200;
    const CLOSE_DELAY = 220;
    let openTimer = null;
    let closeTimer = null;

    const setOpen = (open) => {
      wrap.classList.toggle('is-open', open);
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    const scheduleOpen = () => {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(() => { ensureBeritaMegaLoaded().then(() => setOpen(true)); }, OPEN_DELAY);
    };

    const scheduleClose = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        const stillHover = trigger.matches(':hover') || panel.matches(':hover');
        const stillFocus = wrap.contains(document.activeElement);
        if (!stillHover && !stillFocus) setOpen(false);
      }, CLOSE_DELAY);
    };

    setOpen(false);

    // Mouse
    trigger.addEventListener('mouseenter', scheduleOpen);
    trigger.addEventListener('mouseleave', scheduleClose);
    const CLICK_TOGGLE_MQ = window.matchMedia('(min-width: 992px)');

    // Tap/click to toggle on smaller screens (no hover)
    trigger.addEventListener('click', (e) => {
      if (CLICK_TOGGLE_MQ.matches) return; // desktop handled by hover
      e.preventDefault();
      e.stopPropagation();
      ensureBeritaMegaLoaded().then(() => {
        setOpen(!wrap.classList.contains('is-open'));
      });
    });

    panel.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
      setOpen(true);
    });
    panel.addEventListener('mouseleave', scheduleClose);

    // Keyboard
    wrap.addEventListener('focusin', () => { ensureBeritaMegaLoaded().then(() => setOpen(true)); });
    wrap.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!wrap.contains(document.activeElement)) scheduleClose();
      });
    });

    // Escape closes (bind once globally)
    if (!window.__IKSASS_INIT.megaEscapeBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.dropdown.berita-mega.is-open').forEach(w => w.classList.remove('is-open'));
        }
      });
      window.__IKSASS_INIT.megaEscapeBound = true;
    }

    // Click outside to close (bind once globally)
    // If user resizes across breakpoint, close mega to prevent layout glitches
    if (!window.__IKSASS_INIT.megaResizeBound) {
      const mq = window.matchMedia('(min-width: 992px)');
      const onChange = () => {
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded','false');
        panel.setAttribute('aria-hidden','true');
      };
      try { mq.addEventListener('change', onChange); } catch (_) { mq.addListener(onChange); }
      window.__IKSASS_INIT.megaResizeBound = true;
    }

    if (!window.__IKSASS_INIT.megaOutsideBound) {
      document.addEventListener('pointerdown', (e) => {
        const w = document.querySelector('.dropdown.berita-mega');
        if (w && !w.contains(e.target)) w.classList.remove('is-open');
      });
      window.__IKSASS_INIT.megaOutsideBound = true;
    }
  }

  // Page accordion
  function setupPageAccordions(){
    document.querySelectorAll('.acc-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const item = btn.closest('.acc-item');
        if (item) item.classList.toggle('acc-open');
      });
    });
  }

  // Simple client-side filter for table rows
  function setupFilter(inputSelector, rowSelector) {
    const input = document.querySelector(inputSelector);
    if (!input) return;
    if (input.dataset.bound === '1') return;
    input.dataset.bound = '1';

    const rows = Array.from(document.querySelectorAll(rowSelector));
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      rows.forEach(r => {
        const hay = (r.getAttribute('data-search') || r.textContent).toLowerCase();
        r.style.display = hay.includes(q) ? '' : 'none';
      });
    });
  }

  

// Desktop dropdowns (Profil/Tentang): a11y toggle + keyboard support
function setupDesktopDropdowns(){
  const nav = document.querySelector('.navlinks');
  if (!nav) return;
  if (nav.dataset.ddBound === '1') return;
  nav.dataset.ddBound = '1';

  const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;

  const dropdowns = Array.from(nav.querySelectorAll('.dropdown')).filter(d => !d.classList.contains('berita-mega'));
  const closeAll = () => {
    dropdowns.forEach(d => {
      d.classList.remove('is-open');
      const btn = d.querySelector('.dropbtn');
      const menu = d.querySelector('.menu');
      if (btn) btn.setAttribute('aria-expanded','false');
      if (menu) menu.setAttribute('aria-hidden','true');
    });
  };

  const openDropdown = (d) => {
    const btn = d.querySelector('.dropbtn');
    const menu = d.querySelector('.menu');
    if (!btn || !menu) return;
    d.classList.add('is-open');
    btn.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-hidden','false');
  };
  const toggleDropdown = (d) => {
    const isOpen = d.classList.contains('is-open');
    closeAll();
    if (!isOpen) openDropdown(d);
  };

  // Click to toggle (desktop only)
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.dropdown .dropbtn');
    if (!btn) return;
    if (!isDesktop()) return; // mobile uses drawer
    const d = btn.closest('.dropdown');
    if (!d || d.classList.contains('berita-mega')) return;
    e.preventDefault();
    toggleDropdown(d);
  });

  // Keyboard
  nav.addEventListener('keydown', (e) => {
    const btn = e.target.closest('.dropdown .dropbtn');
    const d = btn ? btn.closest('.dropdown') : null;
    if (!btn || !d || d.classList.contains('berita-mega')) return;
    if (!isDesktop()) return;

    const key = e.key;
    if (key === 'Enter' || key === ' ' || key === 'ArrowDown') {
      e.preventDefault();
      const wasOpen = d.classList.contains('is-open');
      toggleDropdown(d);
      if (!wasOpen) {
        const firstLink = d.querySelector('.menu a');
        if (firstLink) firstLink.focus();
      }
    } else if (key === 'Escape') {
      if (d.classList.contains('is-open')) {
        e.preventDefault();
        closeAll();
        btn.focus();
      }
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!isDesktop()) return;
    if (nav.contains(e.target)) return;
    closeAll();
  });

  // Close when focus leaves nav
  document.addEventListener('focusin', (e) => {
    if (!isDesktop()) return;
    if (nav.contains(e.target)) return;
    closeAll();
  });

  // Close on resize to mobile
  window.addEventListener('resize', () => {
    if (!isDesktop()) closeAll();
  });

  // Init state
  closeAll();
}

// Skip link: ensure focus moves to main content
function setupSkipLinkFocus(){
  if (document.documentElement.dataset.skipBound === '1') return;
  document.documentElement.dataset.skipBound = '1';
  const focusTarget = () => {
    const el = document.getElementById('konten');
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','-1');
    el.focus({preventScroll:false});
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.skip-link[href^="#"]');
    if (!a) return;
    const id = (a.getAttribute('href') || '').slice(1);
    if (id !== 'konten') return;
    setTimeout(focusTarget, 0);
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#konten') setTimeout(focusTarget, 0);
  });
}
function setupActiveNav(){
  const currentPathRaw = (location.pathname || "/").toLowerCase();

  // Normalize current path: treat trailing "/" as "/index.html"
  const currentPath = (currentPathRaw.endsWith("/") ? currentPathRaw + "index.html" : currentPathRaw);

  let anyDropdownActivated = false;

  // 1) Exact-match any nav links (desktop mega/dropdown items)
  document.querySelectorAll('nav a[href]').forEach(a => {
    const hrefAttr = (a.getAttribute('href') || '').trim();
    if (!hrefAttr || hrefAttr.startsWith('#')) return;

    let targetPath = "";
    try{
      targetPath = new URL(hrefAttr, location.href).pathname.toLowerCase();
    }catch(e){
      return;
    }

    targetPath = (targetPath.endsWith("/") ? targetPath + "index.html" : targetPath);

    if (currentPath === targetPath) {
      a.classList.add('active');

      const dd = a.closest('.dropdown');
      if (dd){
        const btn = dd.querySelector('.dropbtn');
        if (btn){
          btn.classList.add('active');
          anyDropdownActivated = true;
        }
      }
    }
  });

  // 2) Section-level activation (ONLY if no dropdown already matched)
  // This avoids cases where pages live under /profil/ but are actually in "Tentang" dropdown.
  if (anyDropdownActivated) return;

  const setBtnActive = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.classList.add('active');
  };

  if (currentPath.includes('/berita/')) setBtnActive('.berita-mega > .dropbtn');

  // If you have pages under /profil/ that are NOT listed in the menu dropdown, you can enable this:
  // if (currentPath.includes('/profil/')) setBtnActive('#dd-profil-btn');
  // if (currentPath.includes('/tentang/')) setBtnActive('#dd-tentang-btn');
}

function init(){
      setupActiveNav();
setupSkipLinkFocus();
    setupDesktopDropdowns();
    setupMobileDrawer();
    // Berita mega menu is lazy-loaded on first open (hover/focus/click) or when drawer opens
    setupMobileBeritaAccordion();
    setupBeritaMegaHover();
    setupPageAccordions();
    setupFilter('#filter-rayon', '[data-row]');
    setupFilter('#filter-subrayon', '[data-row]');
    setupFilter('#filter-komisariat', '[data-row]');
  }

  // Run now (in case header is already in DOM), and re-run after partials load
  init();
  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('partials:loaded', init);
})();


/* ===============================
   Drawer (mobile) a11y polish
   - aria-expanded sync
   - ESC closes
   - focus trap
   - return focus to opener
   =============================== */
function setupDrawerA11y(){
  // Legacy binder (v1) conflicts with the current drawer implementation (v2).
  // v2 already handles: aria-expanded per opener, overlay click, ESC, focus trap.
  if (window.__IKSASS_INIT && window.__IKSASS_INIT.mobileDrawerV2) return;

  const drawer = document.querySelector('[data-drawer][id="iksass-drawer"]') || document.querySelector('[data-drawer]');
  const openBtn = document.querySelector('[data-drawer-open]');
  const closeBtn = drawer ? drawer.querySelector('[data-drawer-close]') : null;
  const panel = drawer ? drawer.querySelector('.drawer-panel') : null;
  if(!drawer || !openBtn || !panel) return;

  let lastActive = null;

  const focusables = () => Array.from(panel.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);

  const setState = (isOpen) => {
    openBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.documentElement.classList.toggle('drawer-open', isOpen);
  };

  const open = () => {
    lastActive = document.activeElement;
    drawer.classList.add('open');
    setState(true);
    // prevent background scroll (mobile)
    document.body.style.overflow = 'hidden';
    // focus first focusable, else panel
    const f = focusables();
    (f[0] || panel).focus({preventScroll:true});
  };

  const close = () => {
    drawer.classList.remove('open');
    setState(false);
    document.body.style.overflow = '';
    if(lastActive && typeof lastActive.focus === 'function') lastActive.focus({preventScroll:true});
  };

  // ensure panel is focusable for fallback
  if(!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex','-1');

  openBtn.addEventListener('click', (e)=>{ e.preventDefault(); open(); });
  if(closeBtn) closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); close(); });

  // click outside panel closes (overlay)
  drawer.addEventListener('click', (e)=>{
    if(e.target === drawer) close();
  });

  document.addEventListener('keydown', (e)=>{
    if(drawer.classList.contains('open') && e.key === 'Escape') close();
    if(!drawer.classList.contains('open') || e.key !== 'Tab') return;
    const f = focusables();
    if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  // keep aria in sync if other code toggles .open
  const mo = new MutationObserver(()=>{
    setState(drawer.classList.contains('open'));
  });
  mo.observe(drawer, {attributes:true, attributeFilter:['class']});
}
document.addEventListener('partials:loaded', setupDrawerA11y);

