require('dotenv').config({ path: 'G:\\lolo\\job_search\\inbox-agent\\.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("Supabase URL:", process.env.SUPABASE_URL);
  
  const today = new Date().toISOString().split('T')[0];
  const id = 'job-1'; // Existing job ID in public.jobs
  
  console.log(`Executing status update query for ${id}...`);
  const { data, error } = await supabase
    .from('jobs')
    .update({ 
      status: 'Applied', 
      appliedDate: today,
      notes: 'Applied manually by candidate'
    })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error("❌ Database Update Failed:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("✅ Database Update Succeeded:", data);
  }
}

run();
