require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { syncToGoogleSheet } = require('./sheetsSync');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function syncBacklog() {
  console.log("Fetching existing jobs from Supabase...");
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*');

  if (error) {
    console.error("Failed to fetch jobs:", error.message);
    return;
  }

  console.log(`Found ${jobs.length} jobs. Syncing to Google Sheets...`);

  for (const job of jobs) {
    console.log(`Syncing: ${job.title} at ${job.company}`);
    // Map db columns back to the object structure expected by the webhook
    const jobData = {
      company: job.company,
      title: job.title,
      location: job.location,
      status: job.status,
      appliedDate: (job.created_at || new Date().toISOString()).split('T')[0], // Extract just the date
      companyLink: job.company_url || 'Unlisted'
    };
    
    await syncToGoogleSheet(jobData);
  }

  console.log("✅ Backlog sync complete!");
}

syncBacklog();
