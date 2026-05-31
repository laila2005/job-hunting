require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TELEMETRY_ID = '00000000-0000-0000-0000-000000000001';

async function updateTelemetry(status, currentTask) {
  try {
    const { data } = await supabase.from('jobs').select('id').eq('id', 'telemetry_bot_status').single();
    if (data) {
      await supabase.from('jobs').update({
        company: status,
        title: currentTask,
        location: new Date().toISOString()
      }).eq('id', 'telemetry_bot_status');
    } else {
      await supabase.from('jobs').insert({
        id: 'telemetry_bot_status',
        company: status,
        title: currentTask,
        location: new Date().toISOString(),
        status: 'Hidden'
      });
    }
    
    // Log locally as well
    console.log(`📡 [Telemetry] ${status} - ${currentTask}`);
  } catch (error) {
    console.error(`❌ [Telemetry] Error updating state:`, error.message);
  }
}

module.exports = { updateTelemetry };
