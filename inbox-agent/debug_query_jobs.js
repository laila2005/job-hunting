require('dotenv').config();

async function run() {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/jobs?company=ilike.*Supabase*`, {
      headers: {
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error fetching from live REST endpoint:", e.message);
  }
}

run();
