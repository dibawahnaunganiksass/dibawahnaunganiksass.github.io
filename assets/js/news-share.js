(function () {
  const root = document;
  const url = window.location.href;

  const title = (root.querySelector('meta[property="og:title"]')?.content || document.title || '').trim();
  const desc  = (root.querySelector('meta[property="og:description"]')?.content || '').trim();

  // Branding + 1 enter
  const shareText = title ? `Berita IKSASS: ${title}\n${url}` : url;
  const enc = encodeURIComponent;

  // Support both layouts:
  // - New: .post-sharebar .post-actions [data-share="..."]
  // - Old: .post-meta-bar .share-native/.share-copy/.share-wa...
  const bar =
    root.querySelector('.post-sharebar') ||
    root.querySelector('.post-meta-bar') ||
    root.querySelector('[aria-label="Bagikan artikel"]');

  if (!bar) return;

  const q = (sel) => bar.querySelector(sel);

  const btnNative = q('[data-share="native"]') || q('.share-native');
  const btnCopy   = q('[data-share="copy"]')   || q('.share-copy');

  const aWA = q('[data-share="wa"]') || q('.share-wa');
  const aFB = q('[data-share="fb"]') || q('.share-fb');
  const aX  = q('[data-share="x"]')  || q('.share-x');

  let toast = q('.share-toast');
  if (!toast) {
    toast = document.createElement('span');
    toast.className = 'share-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    // put it at the end of actions if possible
    const actions = q('.post-actions') || q('.share-actions') || bar;
    actions.appendChild(toast);
  }

  // Ensure anchors actually navigate (some templates omit href and rely on JS)
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

  // Native share (best on mobile)
  const canShare = !!navigator.share;
  if (!canShare && btnNative) {
    // hide button gracefully if unsupported
    btnNative.style.display = 'none';
  }

  btnNative?.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: title || document.title,
        text: (desc ? `Berita IKSASS: ${title}\n${desc}\n${url}` : shareText),
        url
      });
    } catch (e) {}
  });

  // Copy link
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