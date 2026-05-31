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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Ensure screenshots directory exists
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

// ─────────────────────────────────────────────────────
// WUZZUF HANDLER (Fix 2: Expanded button detection)
// ─────────────────────────────────────────────────────
async function handleWuzzufApply(page, browser) {
  console.log(`   [Wuzzuf] Scanning for Apply buttons...`);
  
  // Wait for Wuzzuf SPA to fully render
  await new Promise(r => setTimeout(r, 4000));

  // Strategy 1: CSS selectors (most reliable for Wuzzuf)
  const cssSelectors = [
    'a[href*="apply"]',
    'button[class*="apply"]',
    '[data-testid*="apply"]',
    'a.css-1gatmva',       // Known Wuzzuf button classes
    'a.css-pkv5jc',
  ];

  let applyBtn = null;
  for (const sel of cssSelectors) {
    applyBtn = await page.$(sel);
    if (applyBtn) {
      console.log(`   [Wuzzuf] Found apply button via CSS: ${sel}`);
      break;
    }
  }

  // Strategy 2: XPath text matching (broadened)
  if (!applyBtn) {
    const xpathSelectors = [
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply')]",
      "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'تقدم')]",
      "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'تقدم')]",
    ];

    for (const xpath of xpathSelectors) {
      const btns = await page.$$("::-p-xpath(" + xpath + ")");
      if (btns.length > 0) {
        applyBtn = btns[0];
        console.log(`   [Wuzzuf] Found apply button via XPath`);
        break;
      }
    }
  }

  if (!applyBtn) {
    // Strategy 3: Fallback — look for any large, prominent button/link as CTA
    applyBtn = await page.$('main a[class*="btn"], main button[class*="btn"]');
    if (applyBtn) console.log(`   [Wuzzuf] Found apply button via CTA fallback`);
  }

  if (applyBtn) {
    console.log(`   [Wuzzuf] Clicking Apply button...`);
    
    // Check if click opens a new tab (external redirect)
    const pagesBefore = (await browser.pages()).length;
    await page.evaluate(el => el.click(), applyBtn);
    await new Promise(r => setTimeout(r, 4000));
    const pagesAfter = await browser.pages();

    // If a new tab opened, switch to it and use universal filler
    if (pagesAfter.length > pagesBefore) {
      const newPage = pagesAfter[pagesAfter.length - 1];
      await newPage.bringToFront();
      await new Promise(r => setTimeout(r, 3000));
      console.log(`   [Wuzzuf] Redirected to external portal. Routing to AI Form Filler...`);
      return await handleUniversalApply(newPage, 'Wuzzuf External');
    }

    // Still on Wuzzuf — look for submit or form
    const submitSelectors = [
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'confirm')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'send')]",
      "//input[@type='submit']",
    ];

    for (const xpath of submitSelectors) {
      const submitBtn = await page.$$("::-p-xpath(" + xpath + ")");
      if (submitBtn.length > 0) {
        console.log(`   [Wuzzuf] Found Submit button! Clicking...`);
        await page.evaluate(el => el.click(), submitBtn[0]);
        await new Promise(r => setTimeout(r, 3000));
        return { success: true, message: 'Applied natively via Wuzzuf' };
      }
    }

    // If there's a form visible, try universal filler on current page
    const formFields = await page.$$('input:not([type="hidden"]), textarea, select');
    if (formFields.length > 2) {
      console.log(`   [Wuzzuf] Form detected after clicking Apply. Routing to AI Form Filler...`);
      return await handleUniversalApply(page, 'Wuzzuf');
    }

    return { success: false, message: 'Clicked Apply but could not complete submission.' };
  }

  return { success: false, message: 'No recognizable apply button found on Wuzzuf.' };
}

// ─────────────────────────────────────────────────────
// LINKEDIN HANDLER (Fix 1: Non-Easy Apply redirect)
// ─────────────────────────────────────────────────────
async function handleLinkedInApply(page, browser) {
  console.log(`   [LinkedIn] Scanning for Easy Apply button...`);
  
  // Wait for LinkedIn's heavy React/Ember app to render
  await new Promise(r => setTimeout(r, 5000));
  
  // ── Try Easy Apply first ──
  const easyApplySelectors = [
    "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'easy apply')]",
    "//button[contains(@aria-label, 'Easy Apply')]",
    "//button[contains(@class, 'jobs-apply-button')]",
  ];

  let easyApplyBtn = null;
  for (const xpath of easyApplySelectors) {
    const btns = await page.$$("::-p-xpath(" + xpath + ")");
    if (btns.length > 0) { easyApplyBtn = btns[0]; break; }
  }

  if (easyApplyBtn) {
    console.log(`   [LinkedIn] Found Easy Apply! Clicking...`);
    await page.evaluate(el => el.click(), easyApplyBtn);
    await new Promise(r => setTimeout(r, 2000));

    // Loop through multi-step Easy Apply modal
    for (let i = 0; i < 8; i++) {
      // Check for submit first
      const submitXPaths = [
        "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit application')]",
        "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')]",
        "//button[@aria-label='Submit application']",
      ];

      for (const xpath of submitXPaths) {
        const submitBtn = await page.$$("::-p-xpath(" + xpath + ")");
        if (submitBtn.length > 0) {
          await page.evaluate(el => el.click(), submitBtn[0]);
          await new Promise(r => setTimeout(r, 3000));
          return { success: true, message: 'Applied via LinkedIn Easy Apply' };
        }
      }

      // Click Next or Review
      const nextXPaths = [
        "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'next')]",
        "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'review')]",
        "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'continue')]",
      ];

      let clicked = false;
      for (const xpath of nextXPaths) {
        const nextBtn = await page.$$("::-p-xpath(" + xpath + ")");
        if (nextBtn.length > 0) {
          await page.evaluate(el => el.click(), nextBtn[0]);
          await new Promise(r => setTimeout(r, 2000));
          clicked = true;
          break;
        }
      }
      if (!clicked) break;
    }

    return { success: false, message: 'Easy Apply modal opened but could not complete submission.' };
  }

  // ── No Easy Apply — Find the external "Apply" button ──
  console.log(`   [LinkedIn] No Easy Apply found. Looking for external Apply button...`);
  
  const externalApplySelectors = [
    "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply')]",
    "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply')]",
    "//a[contains(@class, 'jobs-apply-button')]",
    "//button[contains(@class, 'jobs-apply-button')]",
  ];

  let externalApplyBtn = null;
  for (const xpath of externalApplySelectors) {
    const btns = await page.$$("::-p-xpath(" + xpath + ")");
    if (btns.length > 0) { externalApplyBtn = btns[0]; break; }
  }

  if (externalApplyBtn) {
    console.log(`   [LinkedIn] Found external Apply button! Clicking to follow redirect...`);
    
    const pagesBefore = (await browser.pages()).length;
    await page.evaluate(el => el.click(), externalApplyBtn);
    await new Promise(r => setTimeout(r, 5000));
    
    const allPages = await browser.pages();
    
    if (allPages.length > pagesBefore) {
      // New tab opened — switch to it
      const externalPage = allPages[allPages.length - 1];
      await externalPage.bringToFront();
      await new Promise(r => setTimeout(r, 4000));
      
      const externalUrl = externalPage.url();
      console.log(`   [LinkedIn] Redirected to: ${externalUrl}`);
      console.log(`   [LinkedIn] Routing to AI Universal Form Filler...`);
      
      return await handleUniversalApply(externalPage, 'LinkedIn External');
    } else {
      // Same tab navigation or popup
      const currentUrl = page.url();
      if (!currentUrl.includes('linkedin.com')) {
        console.log(`   [LinkedIn] Navigated to: ${currentUrl}`);
        console.log(`   [LinkedIn] Routing to AI Universal Form Filler...`);
        return await handleUniversalApply(page, 'LinkedIn External');
      }
    }
  }

  return { success: false, message: 'No apply button found on LinkedIn page.' };
}

// ─────────────────────────────────────────────────────
// MAIN PROCESSOR (Fix 5: Screenshot on failure)
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
    await page.goto(job.companyLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    let result = { success: false, message: 'Unknown platform' };

    if (job.companyLink.includes('wuzzuf.net')) {
      result = await handleWuzzufApply(page, browser);
    } else if (job.companyLink.includes('linkedin.com')) {
      result = await handleLinkedInApply(page, browser);
    } else {
      console.log(`   [External] Detected custom portal. Routing to AI Universal Form Filler...`);
      result = await handleUniversalApply(page, job.company);
    }

    const newStatus = result.success ? 'Applied' : 'Action Required';
    console.log(`   Result: ${result.message}`);
    
    // ── Screenshot on failure (Fix 5) ──
    if (!result.success) {
      try {
        const activePage = (await browser.pages()).pop();
        const screenshotPath = path.join(screenshotDir, `${job.id}.png`);
        await activePage.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 Failure screenshot saved: ${screenshotPath}`);
      } catch (ssErr) {
        // Ignore screenshot errors
      }
    }
    
    if (result.success) {
      await sendIcebreaker(page, job.company, job.title);
    }
    
    await supabase
      .from('jobs')
      .update({ status: newStatus, appliedDate: new Date().toISOString().split('T')[0] })
      .eq('id', job.id);

    if (result.success) {
      console.log(`   └ ✅ Application Submitted Successfully: ${result.message}`);
      await syncToGoogleSheet({
        company: job.company,
        title: job.title,
        location: job.location,
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        companyLink: job.companyLink
      });
    } else {
      console.log(`   └ ⚠️ Could not auto-apply: ${result.message}`);
    }
  } catch (err) {
    console.error(`   ❌ Crash while applying to ${job.company}:`, err.message);
    // Screenshot on crash too
    try {
      const activePage = (await browser.pages()).pop();
      const screenshotPath = path.join(screenshotDir, `${job.id}-crash.png`);
      await activePage.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Crash screenshot saved: ${screenshotPath}`);
    } catch (ssErr) {}
    await supabase.from('jobs').update({ status: 'Action Required' }).eq('id', job.id);
  } finally {
    await browser.close();
    console.log(`\n✅ Finished processing ${job.company}. Returning to sleep state.`);
    await updateTelemetry('Sleeping', 'Waiting for next manual UI trigger...');
  }
}

// ─────────────────────────────────────────────────────
// POLLING DAEMON
// ─────────────────────────────────────────────────────
const processedJobs = new Set();
let isProcessing = false;

async function startDaemon() {
  console.log("🤖 Stealth Auto-Apply Engine: Listening for commands in real-time...");
  await updateTelemetry('Listening', 'Waiting for manual UI triggers...');

  setInterval(async () => {
    if (isProcessing) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or('status.eq.Queued for Bot,status.eq.Applied');

      if (data && data.length > 0) {
        const job = data.find(j => !processedJobs.has(j.id) && j.id !== 'telemetry_bot_status');
        if (job) {
          isProcessing = true;
          processedJobs.add(job.id);
          console.log(`\n🔔 Caught trigger event for job ID: ${job.id}`);
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
