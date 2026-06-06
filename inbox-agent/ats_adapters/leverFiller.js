/**
 * Lever ATS Auto-Fill Adapter
 * Specialized DOM mappings to instantly apply to Lever roles
 */
async function fillLeverForm(page, userData) {
  console.log("   🤖 [Lever Adapter] Detected Lever ATS. Initiating specialized auto-fill...");
  
  try {
    // Wait for the form to load
    await page.waitForSelector('form#application-form', { timeout: 15000 });
    
    // 1. Upload Resume
    if (userData.resumePath) {
      const fileInput = await page.$('input[type="file"]#resume-upload-input');
      if (fileInput) {
        await fileInput.uploadFile(userData.resumePath);
        console.log("   ✅ [Lever] Resume uploaded.");
        await new Promise(r => setTimeout(r, 2000)); // wait for parse
      }
    }
    
    // 2. Fill basic info
    await page.type('input[name="name"]', userData.fullName || 'Test User');
    await page.type('input[name="email"]', userData.email || 'test@example.com');
    
    if (userData.phone) {
      await page.type('input[name="phone"]', userData.phone);
    }
    
    if (userData.currentCompany) {
      await page.type('input[name="org"]', userData.currentCompany);
    }
    
    // 3. Fill links
    if (userData.linkedin) {
      await page.type('input[name="urls[LinkedIn]"]', userData.linkedin);
    }
    
    if (userData.github) {
      await page.type('input[name="urls[GitHub]"]', userData.github);
    }
    
    if (userData.portfolio) {
      await page.type('input[name="urls[Portfolio]"]', userData.portfolio);
    }
    
    // 4. Custom questions handling (fallback to AI or simple strings)
    const customTextareas = await page.$$('textarea:not([name="comments"])');
    for (const ta of customTextareas) {
      await ta.type('N/A - See resume for details.');
    }
    
    // 5. Submit
    if (!userData.dryRun) {
       console.log("   ✅ [Lever] Clicking Submit application...");
       await page.click('button.postings-btn.template-btn-submit.hexagon');
       await page.waitForNavigation({ waitUntil: 'networkidle0' });
       console.log("   🎉 [Lever] Successfully applied!");
    } else {
       console.log("   ⚠️ [Lever] Dry run mode - skipping submit button.");
    }
    
    return true;
  } catch (err) {
    console.error("   ❌ [Lever Adapter] Error:", err.message);
    return false;
  }
}

module.exports = { fillLeverForm };
