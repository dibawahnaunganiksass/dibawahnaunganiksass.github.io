(function(){
  const params = new URLSearchParams(window.location.search);
  const rayon = (params.get('rayon') || 'RAYON').toUpperCase();
  const titleEl = document.getElementById('rayon-title');
  const bcEl = document.getElementById('rayon-bc');
  if(titleEl) titleEl.textContent = 'Pengurus Rayon IKSASS ' + rayon;
  if(bcEl) bcEl.textContent = rayon;

  const headers = document.querySelectorAll('.rayon-acc .accordion-header');
  const bodies = document.querySelectorAll('.rayon-acc .accordion-body');

  function closeAll(){
    bodies.forEach(b=>b.style.display='none');
    headers.forEach(h=>{
      const a = h.querySelector('.arrow');
      if(a) a.textContent = '⌄';
    });
  }

  headers.forEach(h=>{
    h.addEventListener('click', ()=>{
      const body = h.nextElementSibling;
      const arrow = h.querySelector('.arrow');
      const isOpen = body && body.style.display === 'block';
      closeAll();
      if(body && !isOpen){
        body.style.display = 'block';
        if(arrow) arrow.textContent = '⌃';
      }
    });
  });

  // default open first section
  if(headers[0]) headers[0].click();
})();