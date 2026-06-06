const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const b = await puppeteer.launch({headless: true});
  const p = await b.newPage();
  await p.goto('https://lite.duckduckgo.com/lite/', {waitUntil: 'domcontentloaded'});
  await p.type('input[name="q"]', 'site:lever.co "Egypt"');
  await p.click('input[type="submit"]');
  await p.waitForNavigation({waitUntil: 'domcontentloaded'});
  const html = await p.content();
  require('fs').writeFileSync('ddg_lite.html', html);
  await b.close();
  console.log('Saved');
})();
