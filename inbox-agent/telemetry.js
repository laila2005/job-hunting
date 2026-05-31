require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// In-memory log buffer — last 30 entries
const logBuffer = [];
const MAX_LOGS = 30;

async function botLog(emoji, message, level = 'info') {
  const entry = {
    t: new Date().toISOString(),
    e: emoji,
    m: message,
    l: level
  };
  
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();

  // Print locally
  console.log(`${emoji} ${message}`);

  // Sync to Supabase via update (upsert fails due to schema cache)
  try {
    const statusLabel = level === 'success' ? 'Applied' 
      : level === 'error' ? 'Error' 
      : level === 'step' ? 'Applying' 
      : logBuffer.some(l => l.l === 'step') ? 'Applying' : 'Listening';

    const { error } = await supabase.from('jobs').update({
      company: statusLabel,
      title: message,
      companySummary: JSON.stringify(logBuffer),
    }).eq('id', 'telemetry_bot_status');

    if (error) console.error(`[Telemetry DB Error] ${error.message}`);
  } catch (err) {
    // Silent fail
  }
}

// Legacy compatibility
async function updateTelemetry(status, currentTask) {
  const emoji = status === 'Applying' ? '🚀' : status === 'Sleeping' ? '💤' : status === 'Listening' ? '📡' : '🤖';
  await botLog(emoji, currentTask, status === 'Applying' ? 'step' : 'info');
}

module.exports = { updateTelemetry, botLog };
