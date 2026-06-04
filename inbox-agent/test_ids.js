require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total jobs:", data.length);
    data.slice(0, 5).forEach(j => {
      console.log(`ID: ${j.id} | Title: ${j.title} | Company: ${j.company} | Status: ${j.status}`);
    });
  }
}
run();
