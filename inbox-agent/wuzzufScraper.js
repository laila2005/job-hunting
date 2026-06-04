const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeWuzzuf(customQueries) {
  console.log("🌐 Stealth Scraper: Booting up Wuzzuf Crawler (Egypt)...");
  let browser = null;
  const jobsMap = new Map();

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const queries = customQueries || ['backend', 'c#', '.net', 'python'];

    for (const query of queries) {
      const searchUrl = `https://wuzzuf.net/search/jobs/?q=${encodeURIComponent(query)}`;
      console.log(`   └ Navigating Wuzzuf search for "${query}": ${searchUrl}`);
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const jobCards = await page.evaluate(() => {
          const results = [];
          const cards = document.querySelectorAll('.css-1gatmva, .css-pkv5jc, .css-1v4mvd'); // Common Wuzzuf card classes
          
          // If specific classes fail, fallback to all h2 tags containing links
          const elementsToParse = cards.length > 0 ? cards : document.querySelectorAll('h2');

          elementsToParse.forEach(card => {
            let titleEl = card.querySelector('h2 a') || (card.tagName === 'H2' ? card.querySelector('a') : null);
            if (!titleEl) return;

            const title = titleEl.innerText || titleEl.textContent;
            const link = titleEl.href;
            if (!link.includes('/jobs/p/') && !link.includes('/internship/')) return;

            // Try to get company name
            let companyEl = card.querySelector('.css-17s97q8, .css-d7j1kk a');
            const company = companyEl ? companyEl.textContent.replace(' -', '').trim() : 'Unknown Company';

            // Try to get location
            let locationEl = card.querySelector('.css-5wys0k');
            const location = locationEl ? locationEl.textContent.trim() : 'Egypt';

            // Try to get description snippet
            let descEl = card.querySelector('.css-y4udm8, .css-1lh32fc');
            const description = descEl ? descEl.textContent.trim() : 'Backend Developer role...';

            results.push({
              title,
              company_name: company,
              candidate_required_location: location,
              url: link,
              description,
              salary: 'Unlisted',
              company_logo: ''
            });
          });
          return results;
        });

        console.log(`   └ Extracted ${jobCards.length} raw jobs for "${query}" from Wuzzuf.`);
        for (const job of jobCards) {
          if (job.url && !jobsMap.has(job.url)) {
            jobsMap.set(job.url, job);
          }
        }
      } catch (err) {
        console.error(`⚠️ Wuzzuf query "${query}" failed:`, err.message);
      }
    }

  } catch (error) {
    console.error("❌ Wuzzuf Scraper Failed:", error.message);
  } finally {
    if (browser) await browser.close();
  }

  return Array.from(jobsMap.values());
}

module.exports = { scrapeWuzzuf };
