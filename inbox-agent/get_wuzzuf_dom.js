const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:36243/devtools/browser/35778286-7e39-4ab4-a4f2-6dc099e3a59d'
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('wuzzuf.net'));
  if (!page) page = pages[0];
  
  await page.goto('https://wuzzuf.net/profile/update/general-info', { waitUntil: 'networkidle2' });
  
  const html = await page.content();
  fs.writeFileSync('wuzzuf_general_dom.html', html);
  console.log("DOM Saved.");
  browser.disconnect();
})();
