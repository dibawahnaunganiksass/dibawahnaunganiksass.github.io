(function(){
  const dialog = document.getElementById('prokerDialog');
  if(!dialog) return;

  function openDialog(){
    if(typeof dialog.showModal === 'function'){
      dialog.showModal();
    } else {
      // fallback: open pdf in new tab if <dialog> unsupported
      window.open(dialog.querySelector('iframe')?.getAttribute('src')?.split('#')[0] || '', '_blank');
    }
  }
  function closeDialog(){
    if(dialog.open) dialog.close();
  }

  document.addEventListener('click', function(e){
    const openBtn = e.target.closest('[data-proker-open]');
    if(openBtn){
      e.preventDefault();
      e.stopPropagation(); // prevent card link navigation
      openDialog();
      return;
    }
    const closeBtn = e.target.closest('[data-proker-close]');
    if(closeBtn){
      e.preventDefault();
      closeDialog();
      return;
    }
  });

  dialog.addEventListener('click', function(e){
    const box = dialog.getBoundingClientRect();
    const inDialog = (box.top <= e.clientY && e.clientY <= box.top + box.height &&
                      box.left <= e.clientX && e.clientX <= box.left + box.width);
    // click backdrop to close
    if(!inDialog) closeDialog();
  });
})();
