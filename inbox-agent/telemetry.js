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

  // Sync to Supabase (store logs as JSON in companySummary field)
  try {
    const statusEmoji = level === 'success' ? 'Applied' 
      : level === 'error' ? 'Error' 
      : level === 'step' ? 'Applying' 
      : logBuffer.some(l => l.l === 'step') ? 'Applying' : 'Listening';

    await supabase.from('jobs').upsert({
      id: 'telemetry_bot_status',
      company: statusEmoji,
      title: message,
      location: new Date().toISOString(),
      status: 'Hidden',
      companySummary: JSON.stringify(logBuffer),
      recommended_action: 'telemetry'
    });
  } catch (err) {
    // Silent fail — don't crash the bot over telemetry
  }
}

// Legacy compatibility
async function updateTelemetry(status, currentTask) {
  const emoji = status === 'Applying' ? '🚀' : status === 'Sleeping' ? '💤' : status === 'Listening' ? '📡' : '🤖';
  await botLog(emoji, currentTask, status === 'Applying' ? 'step' : 'info');
}

module.exports = { updateTelemetry, botLog };
