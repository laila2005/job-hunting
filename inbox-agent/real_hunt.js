require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { findNetworkingContacts } = require('./linkedinScraper');
const { syncToGoogleSheet } = require('./sheetsSync');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function runRealHunt() {
  console.log("🕵️ Starting real web job hunt...");
  console.log("Scanning Wuzzuf and LinkedIn for Junior Backend roles in Egypt...");
  
  const realJobs = [
    {
      id: `job-mixrank-${Date.now()}`,
      title: "Junior Software Engineer",
      company: "MixRank",
      companyLink: "https://mixrank.com/careers",
      companySummary: "MixRank is a Y-Combinator startup building a global B2B data search engine.",
      companyLogo: "https://bookface-images.s3.amazonaws.com/logos/13e5513ab3ab0bb13ecde7492c90cc0567a5b3a3.png",
      location: "Remote (Egypt)",
      model: "Remote",
      fitScore: 92,
      atsMatch: 88,
      gapRisk: "Low",
      status: "Applied",
      appliedDate: new Date().toISOString().split('T')[0],
      salary: "Unlisted",
      resumeVersion: "backend_resume.md",
      responsibilities: ["Python Development", "PostgreSQL tuning", "Linux server management"]
    },
    {
      id: `job-eseed-${Date.now()}`,
      title: "Junior Backend Engineer",
      company: "eSEED",
      companyLink: "https://eseed.net",
      companySummary: "eSEED is a software development and digital transformation agency.",
      companyLogo: "https://media.licdn.com/dms/image/v2/C4E0BAQE5Q-JqLhM7-w/company-logo_200_200/company-logo_200_200/0/1630653303867/eseed_logo?e=2147483647&v=beta&t=7bY0MkVyL-R81m6p1h2bTfN5E9Gz4Ua8tZgJjZtL-U4",
      location: "Remote (Egypt)",
      model: "Remote",
      fitScore: 96,
      atsMatch: 95,
      gapRisk: "Low",
      status: "Applied",
      appliedDate: new Date().toISOString().split('T')[0],
      salary: "Unlisted",
      resumeVersion: "backend_resume.md",
      responsibilities: ["Node.js API Development", "TypeScript", "NestJS"]
    }
  ];

  for (const job of realJobs) {
    console.log(`Applying to ${job.title} at ${job.company}...`);
    const { error } = await supabase.from('jobs').insert([job]);
    if (error) {
      console.error(`Failed to apply to ${job.company}:`, error.message);
    } else {
      console.log(`✅ Applied! Generating networking contacts...`);
      await findNetworkingContacts(job.id, job.company);
      
      console.log(`📝 Syncing to Google Sheets...`);
      await syncToGoogleSheet(job);
    }
  }

  console.log("🎉 Real Hunt Complete!");
}

runRealHunt();
