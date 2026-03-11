function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function bindFilter(inputId) {
  const input = document.getElementById(inputId);
  if (!input || input.dataset.filterBound === '1') return;
  input.dataset.filterBound = '1';

  const page = input.closest('main') || document;
  const table = page.querySelector('.table');
  if (!table) return;

  const getRows = () => Array.from(table.querySelectorAll('.tr')).filter((row) => !row.querySelector('.th'));

  const apply = () => {
    const keyword = normalize(input.value);
    getRows().forEach((row) => {
      row.style.display = !keyword || normalize(row.textContent).includes(keyword) ? '' : 'none';
    });
  };

  input.addEventListener('input', apply);
  apply();
}

(() => {
  bindFilter('filter-rayon');
  bindFilter('filter-subrayon');
  bindFilter('filter-komisariat');
})();
