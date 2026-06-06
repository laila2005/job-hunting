const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeLinkedIn(customQueries) {
  console.log("🌐 Stealth Scraper: Booting up LinkedIn Public Jobs Crawler (Egypt)...");
  let browser = null;
  const jobsMap = new Map();

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const queries = customQueries || [
      'software internship', 'backend internship', 'full stack internship', 
      'junior backend', 'junior full stack', 'c# internship', '.net internship', 
      'python internship', 'backend trainee', 'software engineering intern', 
      'junior software engineer', 'fresh graduate software', 'summer internship software', 
      'node.js intern', 'C# trainee', 'student developer'
    ];

    for (const query of queries) {
      const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=Egypt&geoId=100688841&f_TPR=r2592000`;
      console.log(`   └ Navigating LinkedIn search for "${query}": ${searchUrl}`);
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Scroll a bit to trigger lazy loading
        for (let i = 0; i < 2; i++) {
          await page.evaluate(() => window.scrollBy(0, 800));
          await new Promise(r => setTimeout(r, 1000));
        }

        const jobCards = await page.evaluate(() => {
          const results = [];
          // LinkedIn public job cards
          const cards = document.querySelectorAll('.job-search-card, .base-card');

          cards.forEach(card => {
            const titleEl = card.querySelector('.base-search-card__title, .job-search-card__title');
            const companyEl = card.querySelector('.base-search-card__subtitle, .job-search-card__subtitle');
            const locationEl = card.querySelector('.job-search-card__location, .job-search-card__exact-time');
            const linkEl = card.querySelector('a.base-card__full-link, a.job-search-card__title');
            
            if (!titleEl || !linkEl) return;

            const title = titleEl.textContent.trim();
            const company = companyEl ? companyEl.textContent.trim() : 'Unknown Company';
            let location = locationEl ? locationEl.textContent.trim() : 'Egypt';
            const locLower = location.toLowerCase();
            const foreignKeywords = ['canada', 'toronto', 'ontario', 'united states', 'usa', 'us', 'germany', 'uk', 'london', 'berlin', 'markham', 'vancouver', 'montreal', 'calgary', 'alberta', 'quebec', 'europe', 'india', 'warsaw', 'poland', 'krakow'];
            const isForeign = foreignKeywords.some(fk => locLower.includes(fk));
            
            // Ensure "Egypt" is explicitly attached if it's just a city and not a foreign location
            if (!isForeign && !locLower.includes('egypt')) {
              location += ', Egypt';
            }

            results.push({
              title,
              company_name: company,
              candidate_required_location: location,
              url: linkEl.href,
              description: 'LinkedIn Public Job Posting (View link for details)',
              salary: 'Unlisted',
              company_logo: ''
            });
          });
          return results;
        });

        console.log(`   └ Extracted ${jobCards.length} raw jobs for "${query}" from LinkedIn.`);
        for (const job of jobCards) {
          if (job.url && !jobsMap.has(job.url)) {
            jobsMap.set(job.url, job);
          }
        }
      } catch (err) {
        console.error(`⚠️ LinkedIn query "${query}" failed:`, err.message);
      }
    }

  } catch (error) {
    console.error("❌ LinkedIn Scraper Failed:", error.message);
  } finally {
    if (browser) await browser.close();
  }

  return Array.from(jobsMap.values());
}

module.exports = { scrapeLinkedIn };
