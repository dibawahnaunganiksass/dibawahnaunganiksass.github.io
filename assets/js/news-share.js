(function () {
  const root = document;
  const url = window.location.href;
  const title = (root.querySelector('meta[property="og:title"]')?.content || document.title || '').trim();

  const shareText = title
    ? `Berita IKSASS: ${title}\n${url}`
    : url;

  const bar = root.querySelector('.post-meta-bar');
  if (!bar) return;

  const btnNative = bar.querySelector('.share-native');
  const btnCopy = bar.querySelector('.share-copy');
  const toast = bar.querySelector('.share-toast');

  const aWA = bar.querySelector('.share-wa');
  const aFB = bar.querySelector('.share-fb');
  const aX  = bar.querySelector('.share-x');

  const enc = encodeURIComponent;

  if (aWA) aWA.href = `https://wa.me/?text=${enc(shareText)}`;
  if (aFB) aFB.href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
  if (aX)  aX.href  = `https://twitter.com/intent/tweet?text=${enc(shareText)}`;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.textContent = '';
    }, 2000);
  }

  const canShare = !!navigator.share;
  if (!canShare && btnNative) {
    btnNative.style.display = 'none';
  }

  btnNative?.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: title || document.title,
        text: shareText,
        url
      });
    } catch (e) {}
  });

  btnCopy?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = url;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'absolute';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      }
      showToast('Link disalin');
    } catch {
      showToast('Gagal menyalin');
    }
  });
})();