require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  console.log("Cleaning up jobs stuck in 'Processing Auto-Apply'...");
  
  // For Analyticsmart, we know she applied manually.
  const { data: data1, error: error1 } = await supabase
    .from('jobs')
    .update({ status: 'Applied', appliedDate: '2026-06-01' })
    .eq('company', 'Analyticsmart')
    .select();
    
  if (error1) console.error("Error updating Analyticsmart:", error1);
  else console.log("Updated Analyticsmart rows:", data1.length);

  // For other jobs, set back to 'Pending Review' so she can decide
  const { data: data2, error: error2 } = await supabase
    .from('jobs')
    .update({ status: 'Pending Review' })
    .eq('status', 'Processing Auto-Apply')
    .select();
    
  if (error2) console.error("Error updating other jobs:", error2);
  else console.log("Updated other stuck rows to Pending Review:", data2.length);

  process.exit(0);
}
run();
