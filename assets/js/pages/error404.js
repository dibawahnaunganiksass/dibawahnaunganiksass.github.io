(function () {
            const WA_LOCAL = "082132278087";
            const WA_INTL = "62" + WA_LOCAL.replace(/^0+/, "");

            const url = location.href;
            const ref = document.referrer || "(langsung / tidak diketahui)";
            const now = new Date();
            const time = now.toLocaleString("id-ID", { hour12: false });

            const elUrl = document.getElementById("errUrl");
            const elRef = document.getElementById("errRef");
            const elTime = document.getElementById("errTime");
            if (elUrl) elUrl.textContent = url;
            if (elRef) elRef.textContent = ref;
            if (elTime) elTime.textContent = time;

            const msg =
`Halo Admin IKSASS,
Saya menemukan link error (404):

URL: ${url}
Dari: ${ref}
Waktu: ${time}

Mohon dicek dan diperbaiki. Terima kasih.`;

            const waLink = `https://wa.me/${WA_INTL}?text=${encodeURIComponent(msg)}`;
            const btn = document.getElementById("btnReport");
            if (btn) btn.href = waLink;
        })();
