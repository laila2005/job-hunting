require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  const { data } = await supabase.from('jobs').select('id,company,title,status,companyLink').neq('id', 'telemetry_bot_status');
  data.forEach(j => {
    console.log(JSON.stringify({
      status: j.status,
      company: j.company,
      title: j.title,
      url: j.companyLink
    }));
  });
}
check();
