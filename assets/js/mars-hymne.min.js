(() => {
  const tabMars = document.getElementById('tab-mars');
  const tabHymne = document.getElementById('tab-hymne');
  const panelMars = document.getElementById('panel-mars');
  const panelHymne = document.getElementById('panel-hymne');
  const btnCopy = document.getElementById('btn-copy');
  const btnPrint = document.getElementById('btn-print');
  const btnFull = document.getElementById('btn-fullscreen');
  const toast = document.getElementById('toast');
  const integrity = document.getElementById('mh-integrity');

  // Fullscreen UI
  const fsWrap = document.getElementById('mh-fs');
  const fsText = document.getElementById('mh-fs-text');
  const fsSubtitle = document.getElementById('mh-fs-subtitle');
  const fsClose = document.getElementById('mh-fs-close');
  const fsInc = document.getElementById('mh-fs-inc');
  const fsDec = document.getElementById('mh-fs-dec');

  // Sticky audio
  const audioBar = document.getElementById('mh-audio');
  const aToggle = document.getElementById('mh-a-toggle');
  const aTitle = document.getElementById('mh-a-title');
  const aSub = document.getElementById('mh-a-sub');
  const aSeek = document.getElementById('mh-a-seek');
  const aTime = document.getElementById('mh-a-time');
  const aSwitch = document.getElementById('mh-a-switch');
  const audioMars = document.getElementById('audio-mars');
  const audioHymne = document.getElementById('audio-hymne');

  if (!tabMars || !tabHymne || !panelMars || !panelHymne) return;

  const setToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg || '';
    if (!msg) return;
    window.clearTimeout(setToast._t);
    setToast._t = window.setTimeout(() => { toast.textContent = ''; }, 2200);
  };

  const setIntegrity = (msg) => {
    if (!integrity) return;
    integrity.textContent = msg || '';
    integrity.classList.toggle('show', Boolean(msg));
  };

  const fmt = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sha256Hex = async (text) => {
    // Uses WebCrypto when available; returns empty string on failure.
    try {
      if (!window.crypto?.subtle) return '';
      const data = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  const setHash = (hash) => {
    try {
      if (location.hash !== hash) history.replaceState(null, '', hash);
    } catch {
      try { location.hash = hash; } catch {}
    }
  };

  const updateDownloadStates = (activeName) => {
    const btns = Array.from(document.querySelectorAll('.mh-actions a.btn[data-target]'));
    btns.forEach((b) => {
      const active = (b.dataset.target === activeName);
      b.classList.toggle('is-active', active);
      b.classList.toggle('is-inactive', !active);
      b.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const select = (name, focusPanel = false) => {
    const isMars = name === 'mars';
    tabMars.setAttribute('aria-selected', isMars ? 'true' : 'false');
    tabHymne.setAttribute('aria-selected', !isMars ? 'true' : 'false');

    panelMars.hidden = !isMars;
    panelHymne.hidden = isMars;

    setHash(isMars ? '#mars' : '#hymne');
    updateDownloadStates(isMars ? 'mars' : 'hymne');

    // Sync sticky audio title when following tab
    if (audioState.followTab) syncAudioToTab(false);

    if (focusPanel) (isMars ? panelMars : panelHymne).scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeText = () => {
    const take = (id) => (document.getElementById(id)?.textContent || '').trim();
    if (!panelMars.hidden) return [take('text-mars-1'), take('text-mars-2')].filter(Boolean).join('\n\n');
    return [take('text-hymne-1'), take('text-hymne-2')].filter(Boolean).join('\n\n');
  };

  const activeName = () => (!panelMars.hidden ? 'mars' : 'hymne');

  // Integrity check (warn if lyrics differ from official snapshot)
  const OFFICIAL_SHA = {
    mars: '46474650f2825d51525a00edf0aec2d877e5be2edf368882b616173328dbc88d',
    hymne: 'b1d9b80d7726b4a1cb914111ce3db35b72b804bfe4a5aed8ab22b39f0bc454ea',
  };

  const checkIntegrity = async () => {
    const name = activeName();
    const txt = activeText();
    const got = await sha256Hex(txt);
    if (!got) return; // can't verify
    if (got !== OFFICIAL_SHA[name]) {
      setIntegrity('Peringatan: isi lirik pada halaman ini berbeda dari versi resmi yang diset (kemungkinan ada perubahan).');
    } else {
      setIntegrity('');
    }
  };

  // Fullscreen reader
  let fsFont = 18;
  let lastFocus = null;
  const openFs = async () => {
    if (!fsWrap || !fsText || !fsSubtitle) return;
    lastFocus = document.activeElement;
    fsSubtitle.textContent = activeName() === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS';
    fsText.textContent = activeText();
    fsText.style.fontSize = `${fsFont}px`;
    fsWrap.hidden = false;
    fsWrap.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Request real fullscreen if supported (optional).
    try {
      if (fsWrap.requestFullscreen) await fsWrap.requestFullscreen();
    } catch {
      // ignore
    }
    // Focus close for accessibility
    fsClose?.focus();
  };

  const closeFs = async () => {
    if (!fsWrap) return;
    fsWrap.hidden = true;
    fsWrap.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  // Some mobile browsers can be finicky with click on custom-styled controls.
  // Bind click + pointer/touch to make tabs/fullscreen reliable across devices.
  const bindTap = (el, fn) => {
    if (!el) return;
    el.addEventListener('click', (e) => { e.preventDefault(); fn(e); });
    el.addEventListener('pointerup', (e) => { e.preventDefault(); fn(e); });
    el.addEventListener('touchend', (e) => { try { e.preventDefault(); } catch {} fn(e); }, { passive: false });
  };

  bindTap(btnFull, openFs);
  fsClose?.addEventListener('click', closeFs);
  fsWrap?.addEventListener('click', (e) => {
    if (e.target === fsWrap) closeFs();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fsWrap && !fsWrap.hidden) closeFs();
  });
  fsInc?.addEventListener('click', () => {
    fsFont = Math.min(30, fsFont + 2);
    if (fsText) fsText.style.fontSize = `${fsFont}px`;
  });
  fsDec?.addEventListener('click', () => {
    fsFont = Math.max(14, fsFont - 2);
    if (fsText) fsText.style.fontSize = `${fsFont}px`;
  });

  // Sticky audio logic
  const audioState = {
    current: null,
    followTab: true,
    seeking: false,
  };

  const getAudioFor = (name) => (name === 'hymne' ? audioHymne : audioMars);

  const pauseAll = () => {
    [audioMars, audioHymne].forEach((a) => {
      if (a && !a.paused) {
        try { a.pause(); } catch {}
      }
    });
  };

  const showAudioBar = () => {
    if (!audioBar) return;
    audioBar.hidden = false;
  };

  const setAudioUi = (a, label) => {
    if (!aToggle || !aTitle || !aSub || !aSeek || !aTime) return;
    aTitle.textContent = label;
    const dur = Number.isFinite(a?.duration) ? a.duration : 0;
    const cur = Number.isFinite(a?.currentTime) ? a.currentTime : 0;
    if (!audioState.seeking) aSeek.value = dur ? String(Math.round((cur / dur) * 100)) : '0';
    aTime.textContent = `${fmt(cur)} / ${fmt(dur)}`;
    const playing = a && !a.paused;
    aToggle.textContent = playing ? '⏸︎ Jeda' : '▶︎ Putar';
    aSub.textContent = audioState.followTab ? 'Mengikuti tab aktif' : 'Mode manual';
  };

  const bindAudioEvents = (a, name) => {
    if (!a) return;
    a.addEventListener('play', () => {
      showAudioBar();
      // Only one playing at a time
      const other = getAudioFor(name === 'mars' ? 'hymne' : 'mars');
      if (other && !other.paused) other.pause();
      audioState.current = a;
      setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS');
    });
    a.addEventListener('pause', () => {
      setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS');
    });
    a.addEventListener('timeupdate', () => setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS'));
    a.addEventListener('loadedmetadata', () => setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS'));
    a.addEventListener('ended', () => setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS'));
  };

  bindAudioEvents(audioMars, 'mars');
  bindAudioEvents(audioHymne, 'hymne');

  const syncAudioToTab = (autoplay = false) => {
    const name = activeName();
    const a = getAudioFor(name);
    audioState.current = a;
    setAudioUi(a, name === 'mars' ? 'Mars IKSASS' : 'Hymne IKSASS');
    if (autoplay) {
      try { pauseAll(); a.play(); } catch { setToast('Browser memblokir autoplay. Klik Putar sekali lagi.'); }
    }
  };

  aSwitch?.addEventListener('click', () => {
    audioState.followTab = !audioState.followTab;
    if (audioState.followTab) syncAudioToTab(false);
    setToast(audioState.followTab ? 'Audio mengikuti tab aktif.' : 'Audio mode manual.');
    if (audioState.current) setAudioUi(audioState.current, audioState.current === audioMars ? 'Mars IKSASS' : 'Hymne IKSASS');
  });

  aToggle?.addEventListener('click', () => {
    showAudioBar();
    if (!audioState.current) syncAudioToTab(false);
    const a = audioState.current;
    if (!a) return;
    try {
      if (a.paused) {
        pauseAll();
        a.play();
      } else {
        a.pause();
      }
    } catch {
      setToast('Tidak bisa memutar audio di browser ini.');
    }
  });

  aSeek?.addEventListener('input', () => { audioState.seeking = true; });
  aSeek?.addEventListener('change', () => {
    const a = audioState.current;
    if (!a) { audioState.seeking = false; return; }
    const dur = Number.isFinite(a.duration) ? a.duration : 0;
    const pct = Number(aSeek.value) / 100;
    if (dur) a.currentTime = Math.max(0, Math.min(dur, dur * pct));
    audioState.seeking = false;
  });

  bindTap(tabMars, () => select('mars', true));
  bindTap(tabHymne, () => select('hymne', true));

  // keyboard support
  [tabMars, tabHymne].forEach((t) => {
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        (t === tabMars ? tabHymne : tabMars).focus();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(t === tabMars ? 'mars' : 'hymne', true);
      }
    });
  });

  // Sync state when user clicks download buttons
  document.querySelectorAll('.mh-actions a.btn[data-target]').forEach((a) => {
    a.addEventListener('click', () => {
      const t = (a.dataset.target === 'hymne') ? 'hymne' : 'mars';
      if ((t === 'mars' && panelMars.hidden) || (t === 'hymne' && panelHymne.hidden)) select(t, false);
    });
  });

  const printActive = () => {
    // IMPORTANT: avoid popups (often blocked / blank on some browsers).
    // Build a print-only container in the same page, then call window.print().
    const isMars = !panelMars.hidden;
    const title = isMars ? 'Mars IKSASS' : 'Hymne IKSASS';
    const parts = isMars
      ? [document.getElementById('text-mars-1')?.textContent, document.getElementById('text-mars-2')?.textContent]
      : [document.getElementById('text-hymne-1')?.textContent, document.getElementById('text-hymne-2')?.textContent];

    const ensure = (id) => document.getElementById(id);
    let wrap = ensure('mh-print');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'mh-print';
      document.body.appendChild(wrap);
    }

    const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sections = (parts || []).filter(Boolean).map((p, i) => {
      return `
        <section class="mh-print-section">
          <h2>Bagian ${i + 1}</h2>
          <pre>${esc(String(p).trim())}</pre>
        </section>
      `;
    }).join('');

    wrap.innerHTML = `
      <div class="mh-print-watermark" aria-hidden="true">
        <img src="../../assets/img/logo-iksass.png" alt="" loading="lazy" decoding="async" />
      </div>
      <div class="mh-print-head">
        <div class="mh-print-brand">
          <img class="mh-print-logo" src="../../assets/img/logo-iksass.png" alt="Logo IKSASS" />
          <div>
            <h1>${esc(title)}</h1>
            <div class="mh-print-meta">IKSASS — Dokumen Resmi Organisasi</div>
          </div>
        </div>
      </div>
      <div class="mh-print-body">${sections}</div>
    `;

    // Mark printing state for CSS.
    document.body.classList.add('mh-is-printing');

    const cleanup = () => {
      document.body.classList.remove('mh-is-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    // Call print directly in user gesture context.
    try { window.print(); } catch { setToast('Gagal membuka dialog cetak di browser ini.'); cleanup(); }
  };

  btnPrint?.addEventListener('click', printActive);

  btnCopy?.addEventListener('click', async () => {
    try {
      const text = activeText();
      await navigator.clipboard.writeText(text);
      setToast('Tersalin ke clipboard.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = activeText();
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToast('Tersalin ke clipboard.');
    }
  });

  // Initial state
  if (location.hash && location.hash.toLowerCase().includes('hymne')) select('hymne');
  else select('mars');

  // Run integrity check once settled
  checkIntegrity();

  // Re-check on tab switch
  tabMars.addEventListener('click', () => { checkIntegrity(); if (fsWrap && !fsWrap.hidden) { fsSubtitle.textContent = 'Mars IKSASS'; fsText.textContent = activeText(); } });
  tabHymne.addEventListener('click', () => { checkIntegrity(); if (fsWrap && !fsWrap.hidden) { fsSubtitle.textContent = 'Hymne IKSASS'; fsText.textContent = activeText(); } });

  // Also sync audio UI to initial tab
  if (audioMars || audioHymne) {
    syncAudioToTab(false);
    showAudioBar();
  }
})();