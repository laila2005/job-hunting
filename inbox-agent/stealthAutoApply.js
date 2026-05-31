require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { syncToGoogleSheet } = require('./sheetsSync');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { handleUniversalApply } = require('./universalFiller');
puppeteer.use(StealthPlugin());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function handleWuzzufApply(page) {
  console.log(`   [Wuzzuf] Scanning for Apply buttons...`);
  
  // Wuzzuf has multiple button classes, so we use XPath text search
  const applyBtnXPath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply for job')] | //a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply for job')]";
  
  const applyBtn = await page.$x(applyBtnXPath);
    if (applyBtn.length > 0) {
    console.log(`   [Wuzzuf] Found Apply button! Clicking...`);
    await applyBtn[0].click();
    await new Promise(r => setTimeout(r, 3000)); // Wait for modal or navigation
    
    // Check if it asks to 'Submit Application' (internal Easy Apply)
    const submitBtnXPath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit application')]";
    const submitBtn = await page.$x(submitBtnXPath);
    
    if (submitBtn.length > 0) {
      console.log(`   [Wuzzuf] Found Submit button! Clicking...`);
      await submitBtn[0].click();
      await new Promise(r => setTimeout(r, 3000));
      return { success: true, message: 'Applied natively via Wuzzuf' };
    }
    
    return { success: false, message: 'Redirected to external site or complex form.' };
  }
  
  return { success: false, message: 'No recognizable apply button found.' };
}

async function handleLinkedInApply(page) {
  console.log(`   [LinkedIn] Scanning for Easy Apply button...`);
  
  // LinkedIn Easy Apply button
  const easyApplyXPath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'easy apply')]";
  const easyApplyBtn = await page.$x(easyApplyXPath);
  
  if (easyApplyBtn.length > 0) {
    console.log(`   [LinkedIn] Found Easy Apply! Clicking...`);
    await easyApplyBtn[0].click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Loop clicking Next until Submit appears
    for (let i = 0; i < 5; i++) {
      const nextBtnXPath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'next')] | //button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'review')]";
      const nextBtn = await page.$x(nextBtnXPath);
      
      if (nextBtn.length > 0) {
        await nextBtn[0].click();
        await new Promise(r => setTimeout(r, 1500));
      } else {
        break; // Either we reached Submit, or it failed
      }
    }
    
    // Attempt Submit
    const submitBtnXPath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit application')]";
    const submitBtn = await page.$x(submitBtnXPath);
    
    if (submitBtn.length > 0) {
      await submitBtn[0].click();
      await new Promise(r => setTimeout(r, 3000));
      return { success: true, message: 'Applied via LinkedIn Easy Apply' };
    }
  }
  
  return { success: false, message: 'Not an Easy Apply job or form too complex.' };
}

async function autoApply() {
  console.log("🤖 Stealth Auto-Apply Engine: Booting up...");
  
  if (!fs.existsSync('./backend_resume.pdf')) {
    console.error("❌ ERROR: backend_resume.pdf not found. Cannot submit applications.");
    return;
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'Pending Review');

  if (error || !jobs.length) {
    console.log("No pending jobs to apply for.");
    return;
  }

  console.log(`🎯 Found ${jobs.length} jobs ready for Auto-Apply.`);

  // Launch browser pointing to user's local Chrome user data directory so it inherits active logins!
  // Note: The user must log into LinkedIn/Wuzzuf on their host Chrome for this to work.
  const browser = await puppeteer.launch({ 
    headless: false, // We keep it visible so you can see it work!
    defaultViewport: null
  });

  const page = await browser.newPage();

  for (const job of jobs) {
    console.log(`\n⏳ Navigating to ${job.company} portal (${job.title})...`);
    
    try {
      await page.goto(job.companyLink, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 3000)); // Wait for React to mount
      
      let result = { success: false, message: 'Unknown platform' };

      if (job.companyLink.includes('wuzzuf.net')) {
        result = await handleWuzzufApply(page);
      } else if (job.companyLink.includes('linkedin.com')) {
        result = await handleLinkedInApply(page);
      } else {
        console.log(`   [External] Detected custom portal. Routing to AI Universal Form Filler...`);
        result = await handleUniversalApply(page, job.company);
      }

      const newStatus = result.success ? 'Applied' : 'Action Required';
      
      // Update DB Status
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: newStatus, notes: result.message })
        .eq('id', job.id);

      if (!updateError) {
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
      }
    } catch (err) {
      console.error(`   ❌ Crash while applying to ${job.company}:`, err.message);
    }
  }

  await browser.close();
  console.log("\n🎉 Auto-Apply Batch Complete! Your dashboard and Google Sheets are updated.");
}

autoApply();
