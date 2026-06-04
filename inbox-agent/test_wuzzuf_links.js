const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpWuzzuf() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const searchUrl = 'https://wuzzuf.net/search/jobs/?q=internship';
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => ({ text: a.innerText.trim(), href: a.href }));
  });
  
  console.log(`Total <a> tags: ${links.length}`);
  console.log("First 50 <a> tags:");
  links.slice(0, 50).forEach((link, idx) => {
    console.log(`${idx + 1}. [${link.text.slice(0, 30)}] -> ${link.href}`);
  });

  await browser.close();
}

dumpWuzzuf();
