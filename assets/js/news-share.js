/*
  Premium share buttons for berita detail pages.
  - Uses Web Share API when available (mobile).
  - Provides Copy Link + platform share fallbacks.
  - Works with the .post-sharebar block.
*/
(function () {
  const bar = document.querySelector('.post-sharebar');
  if (!bar) return;

  const pageUrl = window.location.href;
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
  const title = (ogTitle || document.title || '').trim();
  const desc = (ogDesc || '').trim();

  const btnNative = bar.querySelector('[data-share="native"]');
  const btnCopy = bar.querySelector('[data-share="copy"]');
  const aWA = bar.querySelector('[data-share="wa"]');
  const aFB = bar.querySelector('[data-share="fb"]');
  const aX = bar.querySelector('[data-share="x"]');
  const toast = bar.querySelector('.share-toast');

  const enc = encodeURIComponent;

  // Build safe share URLs
  if (aWA) aWA.href = `https://wa.me/?text=${enc(title ? `${title} - ${pageUrl}` : pageUrl)}`;
  if (aFB) aFB.href = `https://www.facebook.com/sharer/sharer.php?u=${enc(pageUrl)}`;
  if (aX) aX.href = `https://twitter.com/intent/tweet?text=${enc(title || '')}&url=${enc(pageUrl)}`;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.textContent = '';
    }, 1800);
  }

  // Web Share API
  if (!navigator.share && btnNative) {
    // Hide native button on unsupported browsers to keep UI clean.
    btnNative.style.display = 'none';
  }

  btnNative?.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: title || document.title,
        text: desc || '',
        url: pageUrl,
      });
    } catch (e) {
      // User cancelled or unsupported — ignore.
    }
  });

  // Copy link
  btnCopy?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = pageUrl;
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
