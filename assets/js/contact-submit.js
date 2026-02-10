(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function toast(msg, ok){
    const el = qs('#contactToast');
    if(!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.borderColor = ok ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.35)';
    el.style.background = ok ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)';
    el.style.color = ok ? 'rgba(6,95,70,1)' : 'rgba(127,29,29,1)';
  }

  document.addEventListener('DOMContentLoaded', function(){
    const form = qs('#contactForm');
    if(!form) return;

    form.addEventListener('submit', async function(e){
      e.preventDefault();

      // Native validation first
      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }

      const action = form.getAttribute('action');
      if(!action){
        toast('Form belum memiliki tujuan pengiriman (action).', false);
        return;
      }

      const btn = form.querySelector('button[type="submit"], input[type="submit"]');
      const oldText = btn ? (btn.textContent || btn.value) : '';
      if(btn){
        if(btn.tagName.toLowerCase()==='button') btn.textContent = 'Mengirim...';
        else btn.value = 'Mengirim...';
        btn.disabled = true;
      }

      try{
        const fd = new FormData(form);
        // Important: FormSubmit expects POST; use fetch without navigating to their response page
        const res = await fetch(action, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });

        if(res.ok){
          toast('Pesan terkirim. Terima kasih!', true);
          // Redirect to thank you page within this site
          const base = window.location.origin;
          window.location.href = base + '/terima-kasih/';
          return;
        }else{
          let msg = 'Gagal mengirim pesan.';
          try{
            const j = await res.json();
            if(j && j.message) msg = j.message;
          }catch(_){}
          toast(msg, false);
        }
      }catch(err){
        toast('Gagal mengirim: koneksi bermasalah.', false);
      }finally{
        if(btn){
          if(btn.tagName.toLowerCase()==='button') btn.textContent = oldText || 'Kirim via Email';
          else btn.value = oldText || 'Kirim via Email';
          btn.disabled = false;
        }
      }
    });
  });
})();