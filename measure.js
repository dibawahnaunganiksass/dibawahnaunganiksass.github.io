const { chromium } = require('playwright');
const pages = [
  '/',
  '/tentang/struktur-organisasi/',
  '/tentang/program-kerja/',
  '/program-kerja/',
  '/kelembagaan/pengurus-pusat-iksass/',
  '/tentang/pesantren-pengasuh-dan-iksass/',
  '/tentang/mars-hymne/',
  '/tentang/yel-yel/',
  '/berita/dari-liburan-menjadi-pengabdian-iksass-santri-berbasis-desa-dan-sosial-kemasyarakatan/'
];
(async()=>{
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium', headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1200}});
  for (const path of pages){
    await page.goto('http://127.0.0.1:8000'+path, {waitUntil:'networkidle'});
    await page.waitForTimeout(300);
    const data = await page.evaluate(() => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {left:+b.left.toFixed(2), right:+b.right.toFixed(2), width:+b.width.toFixed(2), padL:cs.paddingLeft, padR:cs.paddingRight, transform:cs.transform};
      };
      const shells = Array.from(document.querySelectorAll('main .container, main .page-container, main .page-shell, main .section-shell, main .org-structure, main .sejarah-shell')).filter(el=>el.getClientRects().length).map(el=>{
        const b=el.getBoundingClientRect();
        return {cls:el.className, left:+b.left.toFixed(2), right:+b.right.toFixed(2), width:+b.width.toFixed(2)};
      }).slice(0,5);
      return {navWrap:r('.header .navbar > .wrap'), navLeft:r('.header .nav-left'), navCta:r('.header .nav-cta'), shells};
    });
    console.log('\nPAGE', path);
    console.log(JSON.stringify(data, null, 2));
  }
  await browser.close();
})();
