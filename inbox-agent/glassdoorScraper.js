const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeGlassdoor(customQueries) {
  let browser;
  const results = [];
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const baseQueries = [
      'software intern', 'backend intern', 'full stack intern',
      'junior backend', 'junior software engineer', 'backend trainee',
      'software trainee', 'fresh graduate software', 'student developer'
    ];
    const queries = customQueries || baseQueries;
    
    for (const query of queries) {
      // Searching Glassdoor Egypt (locId=66, locT=N)
      const searchUrl = `https://www.glassdoor.com/Job/egypt-${query.replace(' ', '-')}-jobs-SRCH_IL.0,5_IN69_KO6,${6+query.length}.htm`;
      console.log(`   🔍 Deep Search ATS scanning Glassdoor: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const rawJobs = await page.evaluate(() => {
          const extracted = [];
          const jobCards = document.querySelectorAll('li[data-test="jobListing"]');
          
          jobCards.forEach(card => {
            const titleEl = card.querySelector('a[data-test="job-link"], a.JobCard_jobTitle___qvxs');
            const companyEl = card.querySelector('.JobCard_jobCardCompany__N30G_, .EmployerProfile_employerName__2h1EE');
            const locationEl = card.querySelector('.JobCard_location__rD3cB');
            
            if (titleEl) {
               let title = titleEl.textContent.trim() || titleEl.innerText.trim() || "Software Intern";
               let link = titleEl.href;
               let company = companyEl ? companyEl.textContent.trim().split('★')[0].trim() : 'Glassdoor Startup';
               let location = locationEl ? locationEl.textContent.trim() : 'Egypt';
               
               // Alternative selectors if obfuscated classes fail
               if (company === 'Glassdoor Startup') {
                  const altComp = card.querySelector('.EmployerProfile_employerName__2h1EE');
                  if (altComp) company = altComp.textContent.trim();
               }
               
               extracted.push({
                 title: title,
                 company_name: company,
                 url: link,
                 description: '',
                 candidate_required_location: location
               });
            }
          });
          return extracted;
        });
        
        results.push(...rawJobs);
        console.log(`   ✅ Extracted ${rawJobs.length} roles for "${query}" from Glassdoor`);
        
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`   ❌ Glassdoor scrape failed for "${query}":`, e.message);
      }
    }
  } catch (error) {
    console.error("❌ Glassdoor Scraper Error:", error.message);
  } finally {
    if (browser) await browser.close();
  }
  
  return results;
}

module.exports = { scrapeGlassdoor };

// For local testing
if (require.main === module) {
  scrapeGlassdoor().then(r => console.log(r));
}
