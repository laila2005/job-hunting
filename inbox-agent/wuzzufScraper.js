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
          const cards = document.querySelectorAll('.css-1gatmva, .css-pkv5jc, .css-1v4mvd, [class*="job-card"]'); 
          
          const elementsToParse = cards.length > 0 ? cards : document.querySelectorAll('h2');

          elementsToParse.forEach(card => {
            // If we are parsing just h2, we need the parent div to get more context
            const container = card.closest('div') || card;
            let titleEl = container.querySelector('h2 a') || (container.tagName === 'H2' ? container.querySelector('a') : null);
            if (!titleEl) return;

            const title = titleEl.innerText || titleEl.textContent;
            const link = titleEl.href;
            if (!link.includes('/jobs/p/') && !link.includes('/internship/')) return;

            // Robust Company Extraction
            const allLinks = Array.from(container.querySelectorAll('a'));
            let companyEl = allLinks.find(a => a !== titleEl && (a.href.includes('/jobs/careers/') || a.textContent.includes('-')));
            let company = companyEl ? companyEl.textContent.replace(' -', '').trim() : 'Unknown Company';
            if (company === 'Unknown Company') {
               // Fallback: look for the text node right after the title or an element with 'company' in class
               const possibleCompany = container.querySelector('[class*="company"]');
               if (possibleCompany) company = possibleCompany.textContent.trim();
            }

            // Robust Location & Badges
            const spans = Array.from(container.querySelectorAll('span'));
            // Wuzzuf locations usually have a specific class or contain a comma (City, Country)
            const locationEl = container.querySelector('.css-5wys0k') || spans.find(s => s.textContent.includes(',') && !s.textContent.includes('To'));
            const location = locationEl ? locationEl.textContent.trim() : 'Unknown Location';

            // Extract all badges like "Internship", "Full Time", "Entry Level"
            const badges = Array.from(container.querySelectorAll('span, a')).filter(el => {
              const text = el.textContent.trim();
              return text === 'Internship' || text === 'Full Time' || text === 'Part Time' || text === 'Entry Level' || text === 'Student';
            }).map(el => el.textContent.trim());

            // Details extraction
            let descEl = container.querySelector('div[class*="description"], p');
            let description = descEl ? descEl.textContent.trim() : `Details: ${title} at ${company}. Tags: ${badges.join(', ')}`;
            
            // Assume Paid internship if not specified, as Wuzzuf usually explicitly states "Unpaid" if it is.
            const isUnpaid = container.textContent.toLowerCase().includes('unpaid');
            const salaryInfo = isUnpaid ? 'Unpaid Internship' : (badges.includes('Internship') ? 'Paid Internship (Expected)' : 'Unlisted');

            results.push({
              title,
              company_name: company,
              candidate_required_location: location,
              url: link,
              description: description + ` | Badges: ${badges.join(', ')}`,
              salary: salaryInfo,
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
