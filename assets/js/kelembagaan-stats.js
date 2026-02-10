(() => {
  const prefersReduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const format = (n) => new Intl.NumberFormat("id-ID").format(n);

  const countRowsFrom = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Fetch failed");
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll(".table .tr"));
    return Math.max(0, rows.length - 1); // minus header row
  };

  const animateCount = (el, to) => {
    if (prefersReduced()) {
      el.textContent = format(to);
      return;
    }
    const from = 0;
    const dur = 900;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = format(val);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const cards = Array.from(document.querySelectorAll(".k-stat-card[data-count-from]"));
    if (!cards.length) return;

    // Fetch all counts first (so animation uses final values)
    const results = await Promise.allSettled(
      cards.map(async (card) => {
        const from = card.getAttribute("data-count-from");
        const valEl = card.querySelector("[data-count-value]");
        if (!from || !valEl) return null;
        const url = new URL(from, location.href).toString();
        const n = await countRowsFrom(url);
        return { card, valEl, n };
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    // Set placeholders to 0 before animation
    items.forEach(({ valEl }) => (valEl.textContent = "0"));

    const run = (item) => {
      if (item.card.dataset.animated === "1") return;
      item.card.dataset.animated = "1";
      animateCount(item.valEl, item.n);
    };

    // Animate when visible
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const item = items.find((it) => it.card === e.target);
              if (item) run(item);
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      items.forEach((it) => io.observe(it.card));
    } else {
      // fallback: animate immediately
      items.forEach(run);
    }
  });
})();
