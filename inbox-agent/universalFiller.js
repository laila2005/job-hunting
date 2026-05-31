require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { generateDynamicCoverLetter } = require('./coverLetterBot');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─────────────────────────────────────────────────────
// Fix 4: Gemini API retry with exponential backoff
// ─────────────────────────────────────────────────────
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.2 }
      });
      return response;
    } catch (err) {
      const isRetryable = err.message && (
        err.message.includes('503') || 
        err.message.includes('UNAVAILABLE') ||
        err.message.includes('high demand') ||
        err.message.includes('429') ||
        err.message.includes('RESOURCE_EXHAUSTED')
      );

      if (!isRetryable || attempt === maxRetries - 1) throw err;

      const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`   [Gemini] API overloaded. Retry ${attempt + 1}/${maxRetries} in ${waitMs / 1000}s...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

/**
 * Universal AI Form Filler
 * Uses Gemini to cognitively read and fill any job application form.
 */
async function handleUniversalApply(page, companyName) {
  console.log(`   [Universal AI] Activating Cognitive Form Filler for ${companyName}...`);
  
  // 1. Read Candidate Profile
  const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
  if (!fs.existsSync(profilePath)) {
    return { success: false, message: 'Missing candidate_profile.json for AI Form Filler.' };
  }
  const candidateProfile = fs.readFileSync(profilePath, 'utf8');

  // Wait for the form to load
  await new Promise(r => setTimeout(r, 5000));

  // 2. Extract DOM Schema
  console.log(`   [Universal AI] Extracting form schema from DOM...`);
  const formSchema = await page.evaluate(() => {
    const fields = [];
    const elements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    
    elements.forEach(el => {
      let labelText = '';
      
      // Try explicit label
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) labelText = label.innerText;
      }
      
      // Try wrapper label
      if (!labelText) {
        const wrapper = el.closest('label');
        if (wrapper) labelText = wrapper.innerText.replace(el.value || '', '').trim();
      }

      // Try aria-label
      if (!labelText) labelText = el.getAttribute('aria-label') || '';

      // Try preceding sibling text
      if (!labelText) {
        const prev = el.previousElementSibling;
        if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV')) {
          labelText = prev.innerText || '';
        }
      }

      // Fallback to placeholder or name
      if (!labelText) labelText = el.placeholder || el.name || 'Unknown Field';

      // Get select options if applicable
      let options = [];
      if (el.tagName.toLowerCase() === 'select') {
        options = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
      }

      fields.push({
        tagName: el.tagName.toLowerCase(),
        type: el.type || 'text',
        name: el.name || '',
        id: el.id || '',
        label: labelText.trim(),
        required: el.required || el.getAttribute('aria-required') === 'true',
        options: options.length > 0 ? options : undefined
      });
    });
    return fields;
  });

  if (formSchema.length === 0) {
    return { success: false, message: 'No recognizable form fields found to fill.' };
  }

  console.log(`   [Universal AI] Found ${formSchema.length} fields. Sending to Gemini for cognitive mapping...`);

  // 3. Prompt Gemini with retry
  const prompt = `
    You are an expert AI Job Application Assistant acting on behalf of the candidate.
    Below is the candidate's professional profile:
    ${candidateProfile}
    
    Below is a JSON schema of the input fields found on a job application form for ${companyName}:
    ${JSON.stringify(formSchema, null, 2)}
    
    Your task: For every field in the schema (except file uploads), generate the perfect answer based on the candidate's profile.
    For long-text questions (like "Why do you want to work here?"), generate a professional, concise 2-3 sentence answer.
    For select/dropdown fields, choose the best matching option value from the provided options list.
    For phone numbers, use: +20 121 021 2792
    For email, use: laila.mohamed.fikry@gmail.com
    For LinkedIn, use: https://www.linkedin.com/in/laila-mohamed23/
    For GitHub, use: https://github.com/laila2005
    For location/city, use: Cairo, Egypt
    
    Return a STRICT JSON object mapping the field's 'name' (or 'id' if name is empty) to the generated string answer. 
    Do NOT wrap the JSON in markdown blocks (no \`\`\`json). Return raw JSON only.
  `;

  try {
    const response = await callGeminiWithRetry(prompt);

    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```/g, '').trim();
    }
    
    const aiAnswers = JSON.parse(jsonString);
    console.log(`   [Universal AI] Successfully generated ${Object.keys(aiAnswers).length} answers. Injecting into DOM...`);

    // 4. Inject Answers into the DOM
    for (const field of formSchema) {
      const identifier = field.name || field.id;
      const selector = field.id ? `#${CSS.escape ? CSS.escape(field.id) : field.id}` : `[name="${field.name}"]`;

      // Handle File Uploads
      if (field.type === 'file') {
        const fileInput = await page.$(selector);
        if (!fileInput) continue;

        const isCoverLetter = field.label.toLowerCase().includes('cover') || (field.name && field.name.toLowerCase().includes('cover'));
        
        if (isCoverLetter) {
          const coverLetterPath = await generateDynamicCoverLetter(companyName, "Software Engineer");
          if (coverLetterPath) {
            console.log(`   [Universal AI] Attaching Dynamic Cover Letter...`);
            await fileInput.uploadFile(coverLetterPath);
          }
        } else {
          const resumePath = path.join(__dirname, 'backend_resume.pdf');
          if (fs.existsSync(resumePath)) {
            console.log(`   [Universal AI] Attaching resume PDF...`);
            await fileInput.uploadFile(resumePath);
          }
        }
        continue;
      }

      // Handle Text/Select inputs
      if (aiAnswers[identifier]) {
        const element = await page.$(selector);
        
        if (element) {
          if (field.tagName === 'select') {
            try {
              await page.select(selector, aiAnswers[identifier]);
            } catch (e) {
              // Fallback: set value directly
              await page.evaluate((el, val) => {
                el.value = val;
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }, element, aiAnswers[identifier]);
            }
          } else {
            // Clear existing value first, then type to trigger React/Vue state updates
            await page.evaluate(el => { el.value = ''; }, element);
            await element.click({ clickCount: 3 }); // Select all existing text
            await element.type(aiAnswers[identifier], { delay: 10 }); // Type character-by-character
            
            // Also dispatch events for extra safety
            await page.evaluate((el) => {
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }, element);
          }
          console.log(`   [Universal AI] ✓ Filled: ${field.label || identifier}`);
        }
      }
    }

    console.log(`   [Universal AI] Form completely filled! Checking for Submit button...`);
    
    // ─────────────────────────────────────────────────────
    // Fix 3: Expanded Submit button detection
    // ─────────────────────────────────────────────────────
    const submitXPaths = [
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply now')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'send application')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'send')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'complete')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'finish')]",
      "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'done')]",
      "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apply now')]",
      "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')]",
      "//input[@type='submit']",
      "//button[@type='submit']",
      "//button[contains(@class, 'submit')]",
      "//button[contains(@class, 'apply')]",
    ];

    for (const xpath of submitXPaths) {
      const submitBtn = await page.$$("::-p-xpath(" + xpath + ")");
      if (submitBtn.length > 0) {
        // Make sure it's visible and not disabled
        const isClickable = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
        }, submitBtn[0]);

        if (isClickable) {
          console.log(`   [Universal AI] Found Submit button! Clicking...`);
          await page.evaluate(el => el.click(), submitBtn[0]);
          await new Promise(r => setTimeout(r, 5000));
          return { success: true, message: `Applied via AI Universal Form Filler on ${companyName}` };
        }
      }
    }

    // Last resort: look for any prominent button that looks like a CTA
    const ctaBtn = await page.$('form button:not([type="button"]):not([type="reset"])');
    if (ctaBtn) {
      console.log(`   [Universal AI] Found form CTA button as last resort! Clicking...`);
      await page.evaluate(el => el.click(), ctaBtn);
      await new Promise(r => setTimeout(r, 5000));
      return { success: true, message: `Applied via AI Form Filler (CTA fallback) on ${companyName}` };
    }

    return { success: false, message: 'AI filled all fields but could not find any Submit/Apply button.' };

  } catch (error) {
    console.error(`   [Universal AI] Error processing form:`, error.message);
    return { success: false, message: `AI Engine error: ${error.message.substring(0, 100)}` };
  }
}

module.exports = { handleUniversalApply };
