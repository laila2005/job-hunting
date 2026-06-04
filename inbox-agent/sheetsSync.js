require('dotenv').config();

async function syncToGoogleSheet(jobData) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
  
  if (!webhookUrl) {
    console.warn("⚠️ Google Sheet Webhook URL not set in .env. Skipping sync.");
    return;
  }

  try {
    // Determine the job type
    const title = (jobData.title || '').toLowerCase();
    let type = 'Full-time';
    if (title.includes('intern')) {
      type = 'Internship';
    } else if (title.includes('part time') || title.includes('part-time')) {
      type = 'Part-time';
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Ensure the payload keys match what the Apps Script is expecting
      body: JSON.stringify({
        company: jobData.company,
        title: jobData.title,
        location: jobData.location,
        status: jobData.status || 'Applied',
        date: jobData.appliedDate || new Date().toISOString().split('T')[0],
        link: jobData.companyLink || 'Unlisted',
        type: type
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      console.log(`✅ Synced ${jobData.company} to Google Sheet!`);
    } else {
      console.error(`❌ Google Sheet Sync Error:`, result);
    }
  } catch (err) {
    console.error(`❌ Failed to send data to Google Sheet webhook:`, err.message);
  }
}

module.exports = { syncToGoogleSheet };
