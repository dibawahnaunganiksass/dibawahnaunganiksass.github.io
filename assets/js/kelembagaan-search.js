(function(){
  function norm(s){ return (s || '').toLowerCase().trim(); }

  function wire(inputId){
    var input = document.getElementById(inputId);
    if(!input) return;

    // Cari wrapper tabel terdekat, supaya aman kalau ada lebih dari 1 tabel
    var page = input.closest('main') || document;
    var table = page.querySelector('.table');
    if(!table) return;

    // baris data: .tr (div) dan bukan header (yang pakai .th)
    function getRows(){
      var rows = Array.prototype.slice.call(table.querySelectorAll('.tr'));
      return rows.filter(function(r){
        return !r.querySelector('.th'); // header
      });
    }

    function apply(){
      var q = norm(input.value);
      var rows = getRows();
      rows.forEach(function(r){
        var t = norm(r.textContent);
        r.style.display = (q === '' || t.indexOf(q) !== -1) ? '' : 'none';
      });
    }

    input.addEventListener('input', apply);
    // apply once (in case prefilled)
    apply();
  }

  document.addEventListener('DOMContentLoaded', function(){
    wire('filter-rayon');
    wire('filter-subrayon');
    wire('filter-komisariat');
  });
})();