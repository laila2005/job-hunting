/**
 * Greenhouse ATS Auto-Fill Adapter
 * Specialized DOM mappings to instantly apply to Greenhouse roles
 */
async function fillGreenhouseForm(page, userData) {
  console.log("   🤖 [Greenhouse Adapter] Detected Greenhouse ATS. Initiating specialized auto-fill...");
  
  try {
    // Wait for the form to load
    await page.waitForSelector('form#application_form', { timeout: 15000 });
    
    // 1. Basic Info
    await page.type('input[name="job_application[first_name]"]', userData.firstName || 'Test');
    await page.type('input[name="job_application[last_name]"]', userData.lastName || 'User');
    await page.type('input[name="job_application[email]"]', userData.email || 'test@example.com');
    
    if (userData.phone) {
      await page.type('input[name="job_application[phone]"]', userData.phone);
    }
    
    // 2. Upload Resume
    if (userData.resumePath) {
      const fileInput = await page.$('input[type="file"][name="job_application[answers_attributes][0][attachment_attributes][file]"], input[type="file"][name="job_application[resume_attributes][file]"]');
      if (fileInput) {
        await fileInput.uploadFile(userData.resumePath);
        console.log("   ✅ [Greenhouse] Resume uploaded.");
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    // 3. URLs
    if (userData.linkedin) {
       const linkedinInput = await page.$('input[autocomplete="custom-question-linkedin-profile"]');
       if (linkedinInput) await linkedinInput.type(userData.linkedin);
    }
    
    if (userData.github) {
       const githubInput = await page.$('input[autocomplete="custom-question-github-website"]');
       if (githubInput) await githubInput.type(userData.github);
    }
    
    // 4. Custom questions handling
    const customTextareas = await page.$$('textarea');
    for (const ta of customTextareas) {
      await ta.type('N/A - See resume for details.');
    }
    
    // 5. Submit
    if (!userData.dryRun) {
       console.log("   ✅ [Greenhouse] Clicking Submit Application...");
       await page.click('button#submit_app');
       await page.waitForNavigation({ waitUntil: 'networkidle0' });
       console.log("   🎉 [Greenhouse] Successfully applied!");
    } else {
       console.log("   ⚠️ [Greenhouse] Dry run mode - skipping submit button.");
    }
    
    return true;
  } catch (err) {
    console.error("   ❌ [Greenhouse Adapter] Error:", err.message);
    return false;
  }
}

module.exports = { fillGreenhouseForm };
