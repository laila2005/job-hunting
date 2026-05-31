require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanBadJobs() {
  console.log("Deep Cleaning irrelevant Senior/Staff/Editor jobs...");
  
  const { data, error } = await supabase
    .from('jobs')
    .delete()
    .or('title.ilike.%staff%,title.ilike.%senior%,title.ilike.%editor%,title.ilike.%video%,title.ilike.%manager%,title.ilike.%principal%');
    
  if (error) {
    console.error("Error deleting jobs:", error);
  } else {
    console.log("Successfully removed all Staff/Senior/Irrelevant jobs.");
  }
}

cleanBadJobs();
