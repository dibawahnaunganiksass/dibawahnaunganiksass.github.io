function setupDetailPage({ param, fallback, titleId, crumbId, prefix, accordionSelector }) {
  const bodyPage = document.body?.dataset?.page || '';
  if (!bodyPage.includes('/detail')) return;

  const params = new URLSearchParams(window.location.search);
  const value = (params.get(param) || fallback).toUpperCase();
  const titleEl = document.getElementById(titleId);
  const crumbEl = document.getElementById(crumbId);
  if (titleEl) titleEl.textContent = `${prefix} ${value}`;
  if (crumbEl) crumbEl.textContent = value;

  const accordion = document.querySelector(accordionSelector);
  if (!accordion) return;

  const headers = Array.from(accordion.querySelectorAll('.accordion-header'));
  const bodies = Array.from(accordion.querySelectorAll('.accordion-body'));

  const closeAll = () => {
    bodies.forEach((body) => {
      body.style.display = 'none';
      body.setAttribute('aria-hidden', 'true');
    });
    headers.forEach((header) => {
      header.setAttribute('aria-expanded', 'false');
      const arrow = header.querySelector('.arrow');
      if (arrow) arrow.textContent = '⌄';
    });
  };

  headers.forEach((header) => {
    if (header.dataset.orgDetailBound === '1') return;
    header.dataset.orgDetailBound = '1';
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = body?.style.display === 'block';
      closeAll();
      if (!body || isOpen) return;
      body.style.display = 'block';
      body.setAttribute('aria-hidden', 'false');
      header.setAttribute('aria-expanded', 'true');
      const arrow = header.querySelector('.arrow');
      if (arrow) arrow.textContent = '⌃';
    });
  });

  if (headers[0]) headers[0].click();
}

(() => {
  setupDetailPage({
    param: 'rayon',
    fallback: 'RAYON',
    titleId: 'rayon-title',
    crumbId: 'rayon-bc',
    prefix: 'Pengurus Rayon IKSASS',
    accordionSelector: '.rayon-acc',
  });
  setupDetailPage({
    param: 'kom',
    fallback: 'KOMISARIAT',
    titleId: 'kom-title',
    crumbId: 'kom-bc',
    prefix: 'Pengurus Komisariat IKSASS',
    accordionSelector: '.komisariat-acc',
  });
  setupDetailPage({
    param: 'sub',
    fallback: 'SUB RAYON',
    titleId: 'sub-title',
    crumbId: 'sub-bc',
    prefix: 'Pengurus Sub Rayon IKSASS',
    accordionSelector: '.subrayon-acc',
  });
})();
