const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testWuzzuf() {
  console.log("Navigating to Wuzzuf...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const searchUrl = 'https://wuzzuf.net/search/jobs/?q=internship';
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log(`Page title: ${await page.title()}`);
  
  // Find all links containing '/jobs/p/'
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => ({ text: a.innerText.trim(), href: a.href }))
      .filter(item => item.href.includes('/jobs/p/'));
  });
  
  console.log(`Found ${links.length} job links on the page:`);
  links.slice(0, 15).forEach((link, idx) => {
    console.log(`${idx + 1}. [${link.text}] -> ${link.href}`);
  });
  
  // Let's print out the classes of parent containers of these links
  const containerClasses = await page.evaluate(() => {
    const jobLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('/jobs/p/'));
    return jobLinks.map(a => {
      let parent = a.parentElement;
      const path = [];
      for (let i = 0; i < 4; i++) {
        if (parent) {
          path.push({ tag: parent.tagName, class: parent.className });
          parent = parent.parentElement;
        }
      }
      return path;
    });
  });
  
  console.log("\nContainer Hierarchy for first 3 links:");
  containerClasses.slice(0, 3).forEach((path, idx) => {
    console.log(`Link ${idx + 1}:`);
    path.forEach((p, depth) => {
      console.log(`  Depth ${depth}: <${p.tag}> Class: "${p.class}"`);
    });
  });

  await browser.close();
}

testWuzzuf();
