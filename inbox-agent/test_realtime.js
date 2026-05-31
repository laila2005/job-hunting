require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  console.log('Testing Realtime connection to jobs table...');
  
  let eventReceived = false;

  supabase
    .channel('test-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
      console.log('\n--- REALTIME EVENT RECEIVED ---');
      console.log(JSON.stringify(payload, null, 2));
      eventReceived = true;
    })
    .subscribe(async (status) => {
      console.log(`Subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        // Trigger an update
        console.log('Triggering an update...');
        await supabase.from('jobs').update({ status: 'Test Trigger' }).eq('id', 'telemetry_bot_status');
        
        // Wait 3 seconds for the event to arrive
        setTimeout(() => {
          if (!eventReceived) {
            console.log('\n❌ FAILURE: No realtime event received after 3 seconds.');
          }
          process.exit(0);
        }, 3000);
      }
    });
}

test();
