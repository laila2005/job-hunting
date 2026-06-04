require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  console.log("Attempting to update job-1780194868964-883 status to Applied via JS Client...");
  
  const { data, error } = await supabase
    .from('jobs')
    .update({ 
      status: 'Applied', 
      appliedDate: '2026-06-01'
    })
    .eq('id', 'job-1780194868964-883')
    .select();
    
  if (error) {
    console.error("❌ Supabase update failed:", error);
  } else {
    console.log("✅ Success! Updated row:", data);
  }
  process.exit(0);
}
run();
