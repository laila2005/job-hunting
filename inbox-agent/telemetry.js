require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TELEMETRY_ID = '00000000-0000-0000-0000-000000000001';

async function updateTelemetry(status, currentTask) {
  try {
    await supabase
      .from('bot_telemetry')
      .update({
        status: status,
        current_task: currentTask,
        last_ping: new Date().toISOString()
      })
      .eq('id', TELEMETRY_ID);
    
    // Log locally as well
    console.log(`📡 [Telemetry] ${status} - ${currentTask}`);
  } catch (error) {
    console.error(`❌ [Telemetry] Error updating state:`, error.message);
  }
}

module.exports = { updateTelemetry };
