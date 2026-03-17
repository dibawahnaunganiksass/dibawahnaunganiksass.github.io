const { chromium } = require('playwright');
const paths = [
  '/tmp/iksass/index.html',
  '/tmp/iksass/tentang/struktur-organisasi/index.html',
  '/tmp/iksass/tentang/program-kerja/index.html'
];
(async()=>{
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium', headless:true, args:['--allow-file-access-from-files','--disable-web-security']});
  const page = await browser.newPage({viewport:{width:1440,height:1200}});
  for (const p of paths){
    await page.goto('file://'+p, {waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1200);
    const data = await page.evaluate(() => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {left:+b.left.toFixed(2), right:+b.right.toFixed(2), width:+b.width.toFixed(2), padL:cs.paddingLeft, padR:cs.paddingRight, transform:cs.transform};
      };
      return {title:document.title, navWrap:r('.header .navbar > .wrap'), navLeft:r('.header .nav-left'), navCta:r('.header .nav-cta')};
    });
    console.log('\nFILE',p); console.log(JSON.stringify(data,null,2));
  }
  await browser.close();
})();
