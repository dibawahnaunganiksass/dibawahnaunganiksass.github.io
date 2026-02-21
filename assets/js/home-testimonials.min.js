(() => {
  const root = document.querySelector('[data-home-testi]');
  const track = document.querySelector('[data-home-testi-track]');
  const dotsWrap = document.querySelector('[data-home-testi-dots]');
  const btnPrev = document.querySelector('[data-home-testi-prev]');
  const btnNext = document.querySelector('[data-home-testi-next]');
  if (!root || !track || !dotsWrap || !btnPrev || !btnNext) return;

  const resolveUrl = (rel) => new URL(rel, document.baseURI).toString();
  const escapeHtml = (s) => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  let items = [];
  let index = 0;
  let startX = 0;
  let dragging = false;

  function clamp(i) {
    if (items.length === 0) return 0;
    return Math.max(0, Math.min(i, items.length - 1));
  }

  function renderDots() {
    dotsWrap.innerHTML = items.map((_, i) => {
      const active = i === index ? ' is-active' : '';
      return `<button class="testi-dot${active}" type="button" aria-label="Slide ${i + 1}" data-idx="${i}"></button>`;
    }).join('');
  }

  function update() {
    index = clamp(index);
    track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
    btnPrev.disabled = index === 0;
    btnNext.disabled = index === items.length - 1;

    [...dotsWrap.querySelectorAll('.testi-dot')].forEach((d, i) => {
      d.classList.toggle('is-active', i === index);
    });
  }

  function render() {
    if (items.length === 0) {
      track.innerHTML = '<div class="testi-empty">Testimoni alumni akan ditampilkan di sini.</div>';
      dotsWrap.innerHTML = '';
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }

    track.innerHTML = items.map((t) => {
      const name = escapeHtml(t.name || 'Alumni IKSASS');
      const role = escapeHtml(t.role || '');
      const loc = escapeHtml(t.location || '');
      const quote = escapeHtml(t.quote || '');

      return `
        <article class="card testi-card" role="group" aria-label="Testimoni">
          <div class="testi-quote">“${quote}”</div>
          <div class="testi-meta">
            <div class="testi-name">${name}</div>
            <div class="testi-role">${role}${role && loc ? ' • ' : ''}${loc}</div>
          </div>
        </article>
      `;
    }).join('');

    renderDots();
    update();
  }

  function go(next) {
    index = clamp(next);
    update();
  }

  function onPointerDown(e) {
    if (items.length <= 1) return;
    dragging = true;
    startX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : e.clientX;
    const dx = endX - startX;
    const threshold = 40;
    if (dx > threshold) go(index - 1);
    else if (dx < -threshold) go(index + 1);
  }

  async function init() {
    try {
      const res = await fetch(resolveUrl('assets/data/testimonials.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`testimonials.json: ${res.status}`);
      const json = await res.json();
      items = Array.isArray(json.items) ? json.items : [];
      index = 0;
      render();
    } catch (err) {
      console.error('[home-testimonials] gagal memuat data:', err);
      items = [];
      render();
    }
  }

  btnPrev.addEventListener('click', () => go(index - 1));
  btnNext.addEventListener('click', () => go(index + 1));

  dotsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const i = Number(btn.getAttribute('data-idx'));
    if (Number.isFinite(i)) go(i);
  });

  const viewport = root.querySelector('.testi__viewport');
  viewport.addEventListener('mousedown', onPointerDown);
  viewport.addEventListener('mouseup', onPointerUp);
  viewport.addEventListener('mouseleave', onPointerUp);
  viewport.addEventListener('touchstart', onPointerDown, { passive: true });
  viewport.addEventListener('touchend', onPointerUp, { passive: true });

  init();
})();
