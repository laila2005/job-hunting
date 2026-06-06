const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeDeepSearch(customQueries) {
  let browser;
  const results = [];
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const baseQueries = [
      'software intern',
      'backend intern',
      'full stack intern',
      'software internship',
      'backend internship',
      'junior backend developer',
      'junior software engineer',
      'backend trainee',
      'software trainee',
      'fresh graduate software',
      'student developer'
    ];
    
    const queries = customQueries || baseQueries;
    
    for (const query of queries) {
      const searchUrl = `https://eg.indeed.com/jobs?q=${encodeURIComponent(query)}&l=Egypt&sc=0kf%3Ajt%28internship%29%3B`; // Filter by internship if possible, or just raw query
      console.log(`   🔍 Deep Search (Indeed) scanning: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const rawJobs = await page.evaluate(() => {
          const extracted = [];
          const cards = document.querySelectorAll('.job_seen_beacon');
          
          cards.forEach(card => {
            const titleEl = card.querySelector('.jobTitle a');
            const companyEl = card.querySelector('[data-testid="company-name"]');
            const locationEl = card.querySelector('[data-testid="text-location"]');
            const snippetEl = card.querySelector('.job-snippet');
            
            if (titleEl) {
               let title = titleEl.textContent.trim();
               let link = titleEl.href;
               let company = companyEl ? companyEl.textContent.trim() : 'Unknown Company';
               let location = locationEl ? locationEl.textContent.trim() : 'Egypt';
               let snippet = snippetEl ? snippetEl.textContent.trim() : '';
               
               extracted.push({
                 title: title,
                 company_name: company,
                 url: link,
                 description: snippet,
                 candidate_required_location: location
               });
            }
          });
          return extracted;
        });
        
        results.push(...rawJobs);
        console.log(`   ✅ Extracted ${rawJobs.length} roles for "${query}" from Deep Search (Indeed)`);
        
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`   ❌ Deep Search (Indeed) failed for "${query}":`, e.message);
      }
    }
  } catch (error) {
    console.error("❌ Deep Search Scraper Error:", error.message);
  } finally {
    if (browser) await browser.close();
  }
  
  return results;
}

module.exports = { scrapeDeepSearch };

// For local testing
if (require.main === module) {
  scrapeDeepSearch().then(r => console.log(r));
}
