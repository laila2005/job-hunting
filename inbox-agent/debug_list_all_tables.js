require('dotenv').config();

async function run() {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_KEY
      }
    });
    const schema = await res.json();
    if (schema && schema.definitions) {
      const tables = Object.keys(schema.definitions);
      console.log("\n📊 [Supabase] Active Production Tables:");
      console.log(tables);
    } else {
      console.log("Could not parse definitions:", schema);
    }
  } catch (e) {
    console.error("❌ Error fetching schema:", e.message);
  }
}

run();
