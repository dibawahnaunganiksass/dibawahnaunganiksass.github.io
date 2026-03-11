function query(selector, root = document) {
  return root.querySelector(selector);
}

function textFromMeta(propertyName, fallback = '') {
  const meta = document.querySelector(`meta[property="${propertyName}"]`) || document.querySelector(`meta[name="${propertyName}"]`);
  return (meta?.getAttribute('content') || fallback || '').trim();
}

function getShareTitle() {
  return textFromMeta('og:title', document.title || '');
}

function getShareDescription() {
  return textFromMeta('og:description', textFromMeta('description', ''));
}

function getShareUrl() {
  return window.location.href;
}

function showToast(root, message) {
  let toast = query('[data-share-toast], .share-toast', root);
  if (!toast) {
    toast = document.createElement('span');
    toast.className = 'share-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    (query('.post-actions, .share-actions', root) || root).appendChild(toast);
  }
  toast.textContent = message;
  clearTimeout(toast.__hideTimer);
  toast.__hideTimer = window.setTimeout(() => {
    toast.textContent = '';
    toast.classList.remove('show');
  }, 1800);
  toast.classList.add('show');
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function initShareBlock(root) {
  if (!root || root.dataset.shareBound === '1') return;
  root.dataset.shareBound = '1';

  const title = getShareTitle();
  const description = getShareDescription();
  const url = getShareUrl();
  const shareText = title ? `Berita IKSASS: ${title}\n${url}` : url;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const buttonNative = query('[data-share="native"], .share-native', root);
  const buttonCopy = query('[data-share="copy"], .share-copy', root);
  const linkWa = query('[data-share="wa"], .share-wa', root);
  const linkFb = query('[data-share="fb"], .share-fb', root);
  const linkX = query('[data-share="x"], .share-x', root);

  if (linkWa) linkWa.href = `https://wa.me/?text=${encodedText}`;
  if (linkFb) linkFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (linkX) linkX.href = `https://twitter.com/intent/tweet?text=${encodedText}`;

  if (buttonNative) {
    if (!navigator.share) {
      buttonNative.style.display = 'none';
    } else {
      buttonNative.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: title || document.title,
            text: description ? `Berita IKSASS: ${title}\n${description}\n${url}` : shareText,
            url,
          });
        } catch {}
      });
    }
  }

  if (buttonCopy) {
    buttonCopy.addEventListener('click', async () => {
      try {
        await copyToClipboard(url);
        showToast(root, 'Link berhasil disalin ✅');
      } catch {
        showToast(root, 'Gagal menyalin link ❌');
      }
    });
  }
}

export function initShareBlocks(scope = document) {
  const blocks = Array.from(scope.querySelectorAll('[data-share-block], .post-sharebar, .post-meta-bar, [aria-label="Bagikan artikel"]'));
  blocks.forEach(initShareBlock);
}
