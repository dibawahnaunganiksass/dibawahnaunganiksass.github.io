/* IKSASS - Wasiat page subtle scroll animations (scoped) */
(function () {
  try {
    var root = document.documentElement;
    var reduced = false;
    if (window.matchMedia) {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    if (reduced) {
      // If user prefers reduced motion, make sure elements are visible.
      document.querySelectorAll('[data-animate]').forEach(function (el) {
        el.classList.add('is-inview');
      });
      root.classList.add('reduced-motion');
      return;
    }

    var els = Array.prototype.slice.call(document.querySelectorAll('[data-animate]'));
    if (!els.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    els.forEach(function (el) {
      // Add base class for safety if markup changes.
      if (!el.classList.contains('anim-fade-up')) {
        el.classList.add('anim-fade-up');
      }
      io.observe(el);
    });
  } catch (e) {
    // Fail silently to avoid breaking page.
  }
})();
