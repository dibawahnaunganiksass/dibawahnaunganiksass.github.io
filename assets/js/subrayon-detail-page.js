(function(){
  const params = new URLSearchParams(window.location.search);
  const sub = (params.get('sub') || 'SUB RAYON').toUpperCase();
  const titleEl = document.getElementById('sub-title');
  const bcEl = document.getElementById('sub-bc');
  if(titleEl) titleEl.textContent = 'Pengurus Sub Rayon IKSASS ' + sub;
  if(bcEl) bcEl.textContent = sub;

  const headers = document.querySelectorAll('.subrayon-acc .accordion-header');
  const bodies = document.querySelectorAll('.subrayon-acc .accordion-body');

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

  if(headers[0]) headers[0].click();
})();