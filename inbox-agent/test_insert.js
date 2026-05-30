require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testInsert() {
  console.log("Attempting to insert a job into the 'jobs' table...");
  const { data, error } = await supabase.from('jobs').insert([
    {
      id: `job-test-${Date.now()}`,
      title: "Backend Engineer (Node.js) - Remote",
      company: "Crossover",
      companyLink: "https://crossover.com",
      companySummary: "Global remote-first hiring platform.",
      companyLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Crossover_logo.png",
      location: "Remote Egypt",
      model: "Remote",
      fitScore: 85,
      atsMatch: 80,
      gapRisk: "Medium",
      status: "Applied",
      appliedDate: new Date().toISOString().split('T')[0],
      salary: "30k EGP",
      resumeVersion: "backend_resume.md",
      responsibilities: ["Node.js API development", "Cloud architecture"]
    }
  ]);

  if (error) {
    console.error("❌ INSERT FAILED:", error.message);
    console.error("HINT: This usually happens because columns are missing (e.g., 'title' does not exist) or Row Level Security (RLS) is blocking the insert.");
  } else {
    console.log("✅ INSERT SUCCESS! Check your dashboard.");
  }
}

testInsert();
