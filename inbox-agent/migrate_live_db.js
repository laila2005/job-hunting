const { Client } = require('pg');

const password = 'sPNC756GHGkkM0yX';
const database = 'postgres';
const user = 'postgres';

async function run() {
  console.log("🚀 Attempting direct IPv6 connection to Supabase on port 5432...");
  
  const client = new Client({
    host: '2a05:d014:128e:9501:1d87:aea0:3a52:c216', // Raw IPv6 address of Laila's database
    port: 5432,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS: Connected to live Supabase database via direct IPv6!`);
    
    console.log('Adding missing columns to jobs table...');
    await client.query(`
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS aqs_score integer;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS aqs_strengths jsonb;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS aqs_risks jsonb;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recommended_action text;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS proof_url text;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS proof_timestamp timestamp with time zone;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS notes text;
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
    `);
    console.log('✅ Missing columns successfully added to jobs table!');

    console.log('Flushing API schema cache...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.dummy_cache_flush_table (id serial primary key);
      DROP TABLE public.dummy_cache_flush_table;
    `);
    console.log('✅ PostgREST schema cache successfully flushed!');
    
    await client.end();
    console.log('\n🎉 Live database migration successfully completed!');
  } catch (err) {
    console.error(`❌ Direct IPv6 connection failed:`, err.message);
    try { await client.end(); } catch (e) {}
  }
}

run();
