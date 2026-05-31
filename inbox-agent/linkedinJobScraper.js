const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeLinkedIn() {
  console.log("🌐 Stealth Scraper: Booting up LinkedIn Public Jobs Crawler (Egypt)...");
  let browser = null;
  const jobs = [];

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchUrl = 'https://www.linkedin.com/jobs/search?keywords=backend&location=Egypt&geoId=100688841&f_TPR=r2592000'; // Past month
    console.log(`   └ Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Scroll a bit to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
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
        
        // Ensure "Egypt" is explicitly attached if it's just a city
        if (!location.toLowerCase().includes('egypt')) {
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

    console.log(`   └ Extracted ${jobCards.length} raw jobs from LinkedIn.`);
    jobs.push(...jobCards);

  } catch (error) {
    console.error("❌ LinkedIn Scraper Failed:", error.message);
  } finally {
    if (browser) await browser.close();
  }

  return jobs;
}

module.exports = { scrapeLinkedIn };
