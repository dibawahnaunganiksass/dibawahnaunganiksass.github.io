/* Simple, accessible accordion (FAQ)
   - Uses existing .accordion / .acc-item / .acc-btn / .acc-panel styles
   - Arrow stays consistent: same glyph, rotate via CSS
   - One-open-at-a-time (can be changed easily)
*/
(function () {
  const accordions = document.querySelectorAll('.accordion');
  if (!accordions.length) return;

  accordions.forEach((root) => {
    const items = Array.from(root.querySelectorAll('.acc-item'));
    if (!items.length) return;

    function setOpen(item, open) {
      const btn = item.querySelector('.acc-btn');
      const panel = item.querySelector('.acc-panel');
      if (!btn || !panel) return;

      item.classList.toggle('acc-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }

    function closeAll(except) {
      items.forEach((it) => {
        if (except && it === except) return;
        setOpen(it, false);
      });
    }

    items.forEach((item) => {
      const btn = item.querySelector('.acc-btn');
      const panel = item.querySelector('.acc-panel');
      if (!btn || !panel) return;

      // Ensure a11y wiring exists (safe if already set)
      if (!panel.id) {
        panel.id = `acc-panel-${Math.random().toString(36).slice(2, 9)}`;
      }
      btn.setAttribute('aria-controls', panel.id);
      if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
      if (!panel.hasAttribute('role')) panel.setAttribute('role', 'region');

      // Start closed unless already marked open
      const startOpen = item.classList.contains('acc-open') || btn.getAttribute('aria-expanded') === 'true';
      setOpen(item, startOpen);

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        closeAll(item);
        setOpen(item, !isOpen);
      });

      // Keyboard: Space/Enter already handled by <button>
    });
  });
})();


/* Support legacy markup:
   <div class="accordion">
     <button class="accordion-header"><span class="arrow">⌄</span></button>
     <div class="accordion-body">...</div>
   </div>
*/
(function () {
  const roots = document.querySelectorAll('.accordion');
  if (!roots.length) return;

  roots.forEach((root) => {
    const headers = Array.from(root.querySelectorAll('.accordion-header'));
    if (!headers.length) return;

    headers.forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
      const panel = btn.nextElementSibling;
      if (panel && panel.classList.contains('accordion-body')) {
        panel.style.display = 'none';
      }
    });

    function closeAll(exceptBtn) {
      headers.forEach((btn) => {
        if (exceptBtn && btn === exceptBtn) return;
        const panel = btn.nextElementSibling;
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        if (panel && panel.classList.contains('accordion-body')) {
          panel.style.display = 'none';
        }
      });
    }

    headers.forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.nextElementSibling;
        if (!panel || !panel.classList.contains('accordion-body')) return;

        const isOpen = btn.classList.contains('is-open');
        closeAll(isOpen ? null : btn);

        if (isOpen) {
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          panel.style.display = 'none';
        } else {
          btn.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.display = 'block';
        }
      });
    });
  });
})();