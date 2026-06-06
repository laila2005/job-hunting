const fetch = require('node-fetch');

async function scrapeHackerNewsInternships() {
  const results = [];
  console.log("   🔍 Deep Search ATS scanning Hacker News: Who is hiring?...");
  
  try {
    // Get the user "whoishiring" which posts the official threads
    const userRes = await fetch('https://hacker-news.firebaseio.com/v0/user/whoishiring.json');
    const userData = await userRes.json();
    
    // Find the most recent "Ask HN: Who is hiring?" thread
    let threadId = null;
    for (const itemId of userData.submitted.slice(0, 15)) {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`);
      const itemData = await itemRes.json();
      
      if (itemData && itemData.title && itemData.title.includes('Ask HN: Who is hiring?')) {
        threadId = itemData.id;
        break;
      }
    }
    
    if (!threadId) {
      console.log("   ❌ Hacker News Scraper: Could not find recent Who is hiring thread.");
      return results;
    }
    
    // Fetch the thread
    const threadRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${threadId}.json`);
    const threadData = await threadRes.json();
    
    if (!threadData.kids) return results;
    
    console.log(`   🔍 Parsing ${threadData.kids.length} comments from Hacker News thread ${threadId}...`);
    
    // Process first 150 top-level comments to avoid rate limits
    const kidsToProcess = threadData.kids.slice(0, 150);
    
    for (const commentId of kidsToProcess) {
      try {
        const commentRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${commentId}.json`);
        const commentData = await commentRes.json();
        
        if (!commentData || !commentData.text || commentData.deleted) continue;
        
        const text = commentData.text.toLowerCase();
        
        // Filter for internships AND (remote OR Egypt) AND tech roles
        if ((text.includes('intern') || text.includes('internship') || text.includes('student') || text.includes('junior') || text.includes('trainee') || text.includes('entry level')) && 
            (text.includes('remote') || text.includes('egypt') || text.includes('anywhere')) &&
            (text.includes('backend') || text.includes('software') || text.includes('full stack') || text.includes('engineer'))) {
            
            // Extract company name (usually the first line before a | or -)
            const rawText = commentData.text.replace(/<[^>]*>?/gm, ''); // strip HTML
            let company = 'YC/HN Startup';
            const firstLine = rawText.split('\n')[0];
            if (firstLine.includes('|')) company = firstLine.split('|')[0].trim();
            else if (firstLine.includes('-')) company = firstLine.split('-')[0].trim();
            
            // Extract URLs
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = rawText.match(urlRegex);
            const link = urls && urls.length > 0 ? urls[0] : `https://news.ycombinator.com/item?id=${commentId}`;
            
            results.push({
                title: "Software Engineering Intern",
                company_name: company,
                url: link,
                description: rawText.slice(0, 600) + '...',
                candidate_required_location: 'Remote / Global'
            });
        }
      } catch (e) {
        // Silently skip failed comments
      }
    }
    
    console.log(`   ✅ Extracted ${results.length} elite startup internships from Hacker News`);
    
  } catch (error) {
    console.error("❌ Hacker News Scraper Error:", error.message);
  }
  
  return results;
}

module.exports = { scrapeHackerNewsInternships };

// For local testing
if (require.main === module) {
  scrapeHackerNewsInternships().then(r => console.log(r));
}
