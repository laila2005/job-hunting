require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { syncToGoogleSheet } = require('./sheetsSync');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function fetchRealJobs() {
  console.log("🚀 Sourcing Engine: Activating Live Search...");
  
  try {
    // We use Remotive API for high-quality, verified remote tech jobs
    console.log("🌐 Fetching real remote backend roles from Remotive API...");
    const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&search=backend');
    const data = await response.json();
    
    // Grab the top 15 most recent jobs
    const freshJobs = data.jobs.slice(0, 15);
    console.log(`🎯 Found ${freshJobs.length} live positions!`);

    for (const job of freshJobs) {
      // Calculate a random realistic fit score for demonstration
      const score = Math.floor(Math.random() * (98 - 75 + 1) + 75); 
      
      const newJob = {
        id: 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        company: job.company_name,
        title: job.title,
        location: job.candidate_required_location || 'Remote',
        model: 'Remote',
        salary: job.salary || 'Unlisted',
        status: 'Pending Review',
        companyLink: job.url,
        companyLogo: job.company_logo || '',
        fitScore: score,
        atsMatch: score - 2,
        gapRisk: score > 85 ? 'Low' : 'Medium',
        resumeVersion: 'backend_resume.pdf',
        companySummary: job.description.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...'
      };

      console.log(`📥 Ingesting: ${newJob.title} at ${newJob.company}`);
      
      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to insert ${newJob.company}:`, error.message);
        continue;
      }

      // Sync to Google Sheets
      await syncToGoogleSheet({
        company: newJob.company,
        title: newJob.title,
        location: newJob.location,
        status: newJob.status,
        appliedDate: new Date().toISOString().split('T')[0],
        companyLink: newJob.companyLink
      });
    }

    console.log("✅ Sourcing Complete! Check your Dashboard.");
  } catch (err) {
    console.error("❌ Sourcing Engine Failed:", err.message);
  }
}

fetchRealJobs();
