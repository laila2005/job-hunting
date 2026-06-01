require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { syncToGoogleSheet } = require('./sheetsSync');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { handleUniversalApply } = require('./universalFiller');
const { sendIcebreaker } = require('./icebreakerBot');
const { updateTelemetry } = require('./telemetry');
puppeteer.use(StealthPlugin());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Ensure screenshots directory exists
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

// ─────────────────────────────────────────────────────
// Process a single job — fully autonomous
// ─────────────────────────────────────────────────────
async function processJobRealtime(job) {
  console.log(`\n⚡ Real-time trigger received for ${job.company}! Booting browser...`);
  await updateTelemetry('Applying', `Applying to ${job.company} for ${job.title}...`);

  const browser = await puppeteer.launch({ 
    headless: false, 
    executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    userDataDir: 'C:\\Users\\lolo\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data',
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    console.log(`\n⏳ Navigating to ${job.company} portal (${job.title})...`);
    console.log(`   URL: ${job.companyLink}`);
    await page.goto(job.companyLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    // ── Route EVERYTHING through the AI Agent ──
    // No more hardcoded LinkedIn/Wuzzuf handlers.
    // The AI Agent reads the page, decides what to do, and loops until done.
    console.log(`   [Router] Routing to Autonomous AI Agent...`);
    const result = await handleUniversalApply(page, job);

    const newStatus = result.success ? 'Applied' : 'Action Required';
    console.log(`\n   Final Result: ${result.message}`);
    
    // Screenshot on failure
    if (!result.success) {
      try {
        const activePage = (await browser.pages()).pop();
        const screenshotPath = path.join(screenshotDir, `${job.id}.png`);
        await activePage.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 Failure screenshot saved: ${screenshotPath}`);
      } catch (e) {}
    }
    
    if (result.success) {
      try { await sendIcebreaker(page, job.company, job.title); } catch (e) {}
    }
    
    await supabase
      .from('jobs')
      .update({ status: newStatus, appliedDate: new Date().toISOString().split('T')[0] })
      .eq('id', job.id);

    if (result.success) {
      console.log(`   └ ✅ Application Submitted Successfully!`);
      await syncToGoogleSheet({
        company: job.company, title: job.title, location: job.location,
        status: 'Applied', appliedDate: new Date().toISOString().split('T')[0],
        companyLink: job.companyLink
      });
    } else {
      console.log(`   └ ⚠️ Could not auto-apply: ${result.message}`);
    }
  } catch (err) {
    console.error(`   ❌ Crash while applying to ${job.company}:`, err.message);
    try {
      const activePage = (await browser.pages()).pop();
      await activePage.screenshot({ path: path.join(screenshotDir, `${job.id}-crash.png`), fullPage: true });
    } catch (e) {}
    await supabase.from('jobs').update({ status: 'Action Required' }).eq('id', job.id);
  } finally {
    await browser.close();
    console.log(`\n✅ Finished processing ${job.company}. Returning to sleep state.`);
    await updateTelemetry('Sleeping', 'Waiting for next manual UI trigger...');
  }
}

// ─────────────────────────────────────────────────────
// Polling Daemon
// ─────────────────────────────────────────────────────
const processedJobs = new Set();
let isProcessing = false;

async function startDaemon() {
  console.log("🤖 Stealth Auto-Apply Engine: Listening for commands in real-time...");
  await updateTelemetry('Listening', 'Waiting for manual UI triggers...');

  setInterval(async () => {
    if (isProcessing) return;
    try {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'Queued for Bot');

      if (data && data.length > 0) {
        const job = data.find(j => !processedJobs.has(j.id) && j.id !== 'telemetry_bot_status');
        if (job) {
          isProcessing = true;
          processedJobs.add(job.id);
          console.log(`\n🔔 Caught trigger for: ${job.company} — ${job.title}`);
          await supabase.from('jobs').update({ status: 'Processing Auto-Apply' }).eq('id', job.id);
          await processJobRealtime(job);
          isProcessing = false;
        }
      }
    } catch (err) {
      isProcessing = false;
    }
  }, 2000);
}

startDaemon();
