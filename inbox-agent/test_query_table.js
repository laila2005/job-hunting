require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("Querying agent_chat table...");
  const { data, error } = await supabase
    .from('agent_chat')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("❌ Supabase query failed:", error);
  } else {
    console.log("✅ Success! Query results:", data);
  }
  process.exit(0);
}

run();
