require('dotenv').config();

const possibleTables = [
  'jobs',
  'networking_contacts',
  'network_contacts',
  'bot_telemetry',
  'system_logs',
  'agent_chat',
  'incidents',
  'activity_log',
  'dream_companies',
  'portfolio_assets'
];

async function run() {
  console.log("\n🔍 Probing active tables in production database...");
  for (let table of possibleTables) {
    try {
      const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': process.env.SUPABASE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
        }
      });
      if (res.status === 200) {
        console.log(`✅ Table exists: public.${table}`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson && errJson.code === 'PGRST116') {
          // Empty table, but it exists!
          console.log(`✅ Table exists (empty): public.${table}`);
        } else if (errJson && errJson.message && errJson.message.includes('does not exist')) {
          // Does not exist
        } else {
          console.log(`❓ Table status ${res.status} for ${table}:`, errJson.message || 'unknown error');
        }
      }
    } catch (e) {
      // Failed to fetch or server error
    }
  }
}

run();
