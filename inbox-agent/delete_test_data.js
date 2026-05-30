require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function wipeTestData() {
  console.log("🧹 Wiping test networking contacts...");
  const { error: ncError } = await supabase
    .from('networking_contacts')
    .delete()
    .like('id', 'nc-%');

  if (ncError) console.error("Error deleting contacts:", ncError.message);

  console.log("🧹 Wiping test jobs...");
  const { error: jobError1 } = await supabase
    .from('jobs')
    .delete()
    .in('id', ['job-1', 'job-2']);
    
  const { error: jobError2 } = await supabase
    .from('jobs')
    .delete()
    .like('id', 'job-test-%');

  if (jobError1 || jobError2) {
    console.error("Error deleting test jobs.");
  } else {
    console.log("✅ Test data wiped successfully! Only real data remains.");
  }
}

wipeTestData();
