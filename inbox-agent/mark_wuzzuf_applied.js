require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const appliedJobs = [
  "Computer Science & Computer Engineering Fresh Graduates",
  "Junior Software Engineer",
  "Software Engineer Intern",
  "IT \"Internship\"",
  "Python - Djnago backend developer",
  "Backend Developer"
];

const appliedCompanies = [
  "Confidential",
  "MegaSoft",
  "AvidBeam Technologies",
  "ICON Holding",
  "Aldughairi",
  "Linkat",
  "Rescourses"
];

async function markApplied() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*');
    
  if (error) {
    console.error("Error fetching jobs:", error);
    return;
  }
  
  console.log(`Found ${data.length} jobs from Wuzzuf in the pipeline.`);
  
  let matchCount = 0;
  for (const job of data) {
    // Check if job matches one of the applied ones
    const isApplied = appliedJobs.some(title => job.title && job.title.toLowerCase().includes(title.toLowerCase())) || 
                      appliedCompanies.some(company => job.company && job.company.toLowerCase().includes(company.toLowerCase()));
                      
    if (isApplied && job.status !== 'Applied') {
      console.log(`Matching job found: ${job.title} at ${job.company} (Current status: ${job.status})`);
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'Applied' })
        .eq('id', job.id);
        
      if (updateError) {
        console.error("Error updating:", updateError);
      } else {
        console.log(`✅ Marked as Applied: ${job.title}`);
        matchCount++;
      }
    }
  }
  
  console.log(`\nFinished updating ${matchCount} jobs.`);
}

markApplied();
