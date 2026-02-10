document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // Mark <a> active
  const links = document.querySelectorAll('nav a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    // ignore hash-only links
    if (!href || href.startsWith('#')) return;

    // normalize (strip leading ./)
    const norm = href.replace(/^\.\//, '');

    if (path.includes(norm)) {
      link.classList.add('active');

      // If the link is inside a desktop dropdown menu, also mark the button
      const menu = link.closest('.dropdown');
      if (menu) {
        const btn = menu.querySelector('.dropbtn');
        if (btn) btn.classList.add('active');
      }
    }
  });
});
