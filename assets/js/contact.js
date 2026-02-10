/* =====================================================
   CONTACT PAGE — handler (WhatsApp + Email)
   Rules:
   - WhatsApp: opens wa.me with prefilled message (no page refresh)
   - Email: REAL submit (POST) to FormSubmit (NOT mailto). Values must be sent.
   - After email submit: FormSubmit redirects to /terima-kasih.html via _next
   - Cross-mode safe: no layout hacks here.
   ===================================================== */

(function () {
  function getRootPrefix(){
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last.includes(".")) parts.pop();
    return "../".repeat(Math.max(0, parts.length));
  }
  const ROOT_PREFIX = getRootPrefix();

  const form = document.getElementById('contactForm');
  if (!form) return;

  const toast = document.getElementById('contactToast');
  const waBtn = document.getElementById('sendWaBtn');
  const nextInput = document.getElementById('nextUrl');

  // Targets
  const WA_NUMBER_INTL = '6285258252747'; // 085258252747
  const THANK_YOU_PATH = ROOT_PREFIX + 'terima-kasih.html';

  function setToast(msg) {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = msg;
  }

  function clearToast() {
    if (!toast) return;
    toast.hidden = true;
    toast.textContent = '';
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  function isEmailValid(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function buildMessage() {
    const nama = val('nama');
    const instansi = val('instansi');
    const telp = val('telp');
    const email = val('email');
    const perihal = val('topik');
    const pesan = val('pesan');

    const lines = [
      'Assalamu’alaikum Wr. Wb.',
      'Yth. Sekretariat IKSASS,',
      '',
      `Perihal: ${perihal}`,
      '',
      pesan,
      '',
      '---',
      `Nama: ${nama}`,
      `Instansi/Organisasi: ${instansi || '-'}`,
      `Email: ${email}`,
      `Telepon/WhatsApp: ${telp || '-'}`,
      '---',
      'Wassalamu’alaikum Wr. Wb.'
    ];

    return lines.join('\n');
  }

  function validateRequired() {
    const nama = val('nama');
    const email = val('email');
    const perihal = val('topik');
    const pesan = val('pesan');

    if (!nama) {
      setToast('Mohon isi Nama Lengkap.');
      document.getElementById('nama')?.focus();
      return false;
    }
    if (!email || !isEmailValid(email)) {
      setToast('Mohon isi Email yang valid.');
      document.getElementById('email')?.focus();
      return false;
    }
    if (!perihal) {
      setToast('Mohon pilih Perihal.');
      document.getElementById('topik')?.focus();
      return false;
    }
    if (!pesan) {
      setToast('Mohon isi Pesan.');
      document.getElementById('pesan')?.focus();
      return false;
    }
    return true;
  }

  function ensureNextUrl() {
    // FormSubmit butuh URL penuh agar redirect konsisten (local / production)
    if (!nextInput) return;
    try {
      nextInput.value = `${window.location.origin}${THANK_YOU_PATH}`;
    } catch (_) {
      nextInput.value = THANK_YOU_PATH;
    }
  }

  function openWhatsApp(msgText) {
    const url = `https://wa.me/${WA_NUMBER_INTL}?text=${encodeURIComponent(msgText)}`;
    window.open(url, '_blank', 'noopener');
  }

  // Init
  ensureNextUrl();

  // WhatsApp button (no submit)
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      clearToast();
      if (!validateRequired()) return;
      const msg = buildMessage();
      openWhatsApp(msg);
      // optional: arahkan user ke halaman terima kasih juga
      window.location.href = THANK_YOU_PATH;
    });
  }

  // Email submit (REAL POST to FormSubmit)
  form.addEventListener('submit', function (e) {
    clearToast();
    ensureNextUrl();

    if (!validateRequired()) {
      e.preventDefault();
      return;
    }

    // Tambahkan message gabungan agar email rapi (FormSubmit akan include semua field juga)
    // Kita set ke hidden input "message" jika ada, atau bikin dinamis.
    let msgField = form.querySelector('input[name="message"]');
    if (!msgField) {
      msgField = document.createElement('input');
      msgField.type = 'hidden';
      msgField.name = 'message';
      form.appendChild(msgField);
    }
    msgField.value = buildMessage();

    // Jangan preventDefault — biarkan browser submit ke FormSubmit agar value tidak kosong.
  });
})();
