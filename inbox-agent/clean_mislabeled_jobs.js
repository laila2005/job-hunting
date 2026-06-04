require('dotenv').config();

async function cleanJobs() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in env");
    return;
  }
  
  console.log(`Connecting to Supabase project: ${url}`);
  
  // Fetch all jobs
  const res = await fetch(`${url}/rest/v1/jobs?select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  
  const jobs = await res.json();
  console.log(`Found total jobs: ${jobs.length}`);
  
  const foreignKeywords = [
    'canada', 'toronto', 'ontario', 'united states', 'usa', 'us', 
    'germany', 'uk', 'london', 'berlin', 'markham', 'vancouver', 
    'montreal', 'calgary', 'alberta', 'quebec', 'europe', 'india', 
    'warsaw', 'poland', 'krakow', 'france', 'paris', 'netherlands', 
    'amsterdam', 'dubai', 'uae', 'saudi', 'riyadh'
  ];
  
  const toDelete = [];
  for (const job of jobs) {
    const loc = (job.location || '').toLowerCase();
    const isForeign = foreignKeywords.some(fk => loc.includes(fk));
    if (isForeign) {
      toDelete.push(job);
    }
  }
  
  console.log(`Identified ${toDelete.length} mislabeled foreign jobs for deletion:`);
  toDelete.forEach(j => {
    console.log(`- [${j.id}] ${j.title} at ${j.company} (Location: ${j.location})`);
  });
  
  if (toDelete.length === 0) {
    console.log("No mislabeled jobs found.");
    return;
  }
  
  // Delete them one by one or via a single DELETE request
  console.log("\nDeleting mislabeled jobs...");
  for (const job of toDelete) {
    const delRes = await fetch(`${url}/rest/v1/jobs?id=eq.${job.id}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (delRes.ok) {
      console.log(`✅ Deleted job ${job.id}`);
    } else {
      console.error(`❌ Failed to delete job ${job.id}: ${delRes.statusText}`);
    }
  }
  
  console.log("Cleanup complete!");
}

cleanJobs();
