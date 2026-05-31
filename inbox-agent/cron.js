require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');

console.log("🤖 Autonomous Hunting Engine Started! The bot is now running in the background.");

// Helper to run scripts
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️ Starting ${scriptName}...`);
    const process = exec(`node ${scriptName}`);
    
    process.stdout.on('data', (data) => console.log(data.trim()));
    process.stderr.on('data', (data) => console.error(data.trim()));
    
    process.on('close', (code) => {
      console.log(`✅ ${scriptName} finished with code ${code}.`);
      resolve();
    });
  });
}

// Full Pipeline: Scrape -> Apply
async function executeFullPipeline() {
  console.log("--- STARTING FULL PIPELINE BATCH ---");
  await runScript('live_scraper.js');
  
  // Wait a few seconds for DB to settle
  await new Promise(r => setTimeout(r, 5000));
  
  await runScript('stealthAutoApply.js');
  console.log("--- BATCH COMPLETE ---");
}

// Run immediately on boot
executeFullPipeline();

// Schedule to run every 6 hours
// 0 */6 * * * = "At minute 0 past every 6th hour"
cron.schedule('0 */6 * * *', () => {
  console.log("⏰ CRON TRIGGERED: Running 6-hour batch...");
  executeFullPipeline();
});

// Run Authentic Proof Engine every day at 10:00 AM
cron.schedule('0 10 * * *', () => {
  console.log("⏰ CRON TRIGGERED: Analyzing real commits for Proof Engine...");
  runScript('proofEngine.js');
});

// Run Follow-Up Engine every day at 9:00 AM
cron.schedule('0 9 * * *', () => {
  console.log("⏰ CRON TRIGGERED: Drafting follow-up emails...");
  runScript('followUpBot.js');
});

// Run Dossier Engine every day at 11:00 AM
cron.schedule('0 11 * * *', () => {
  console.log("⏰ CRON TRIGGERED: Building Dream Company Dossiers...");
  runScript('dossierGenerator.js');
});

// Run Personal Brand Engine every Monday and Thursday at 12:00 PM
cron.schedule('0 12 * * 1,4', () => {
  console.log("⏰ CRON TRIGGERED: Drafting LinkedIn Technical Post...");
  runScript('brandEngine.js');
});

// Run Analytics Engine every Sunday at 6:00 PM
cron.schedule('0 18 * * 0', () => {
  console.log("⏰ CRON TRIGGERED: Generating Weekly Skills Gap & Analytics Report...");
  runScript('analyticsEngine.js');
});
