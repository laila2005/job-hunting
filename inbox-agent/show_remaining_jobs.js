require('dotenv').config();

async function showJobs() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  
  const res = await fetch(`${url}/rest/v1/jobs?select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  
  const jobs = await res.json();
  console.log(`\nRemaining jobs in DB (${jobs.length}):`);
  jobs.forEach(j => {
    console.log(`- [${j.id}] ${j.title} at ${j.company} (Location: ${j.location}, Status: ${j.status})`);
  });
}

showJobs();
