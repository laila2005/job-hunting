require('dotenv').config();

async function run() {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/jobs?limit=1`, {
      headers: {
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    console.log("Raw API Response structure:");
    console.log(data);
    if (data && data.length > 0) {
      console.log("\n✅ Exposed keys on jobs record via REST API:");
      console.log(Object.keys(data[0]));
    }
  } catch (e) {
    console.error("❌ Error fetching from REST endpoint:", e.message);
  }
}

run();
