require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { generateDynamicCoverLetter } = require('./coverLetterBot');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Universal AI Form Filler
 * Injects a cognitive brain into Puppeteer to read and answer custom job forms.
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
  await new Promise(r => setTimeout(r, 4000));

  // 2. Extract DOM Schema (Find all inputs, textareas, selects and their labels)
  console.log(`   [Universal AI] Extracting form schema from DOM...`);
  const formSchema = await page.evaluate(() => {
    const fields = [];
    const elements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    
    elements.forEach(el => {
      let labelText = '';
      
      // Try to find an explicit label
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) labelText = label.innerText;
      }
      
      // Try to find a wrapper label
      if (!labelText) {
        const wrapper = el.closest('label');
        if (wrapper) labelText = wrapper.innerText.replace(el.value || '', '').trim();
      }

      // Fallback to placeholder or name
      if (!labelText) labelText = el.placeholder || el.name || 'Unknown Field';

      fields.push({
        tagName: el.tagName.toLowerCase(),
        type: el.type || 'text',
        name: el.name || '',
        id: el.id || '',
        label: labelText.trim()
      });
    });
    return fields;
  });

  if (formSchema.length === 0) {
    return { success: false, message: 'No recognizable form fields found to fill.' };
  }

  console.log(`   [Universal AI] Found ${formSchema.length} fields. Sending to Gemini for cognitive mapping...`);

  // 3. Prompt Gemini to map answers to the schema
  const prompt = `
    You are an expert AI Job Application Assistant acting on behalf of the candidate.
    Below is the candidate's professional profile:
    ${candidateProfile}
    
    Below is a JSON schema of the input fields found on a job application form for ${companyName}:
    ${JSON.stringify(formSchema, null, 2)}
    
    Your task: For every field in the schema (except file uploads), generate the perfect answer based on the candidate's profile.
    For long-text questions (like "Why do you want to work here?"), generate a professional, concise 2-3 sentence answer.
    
    Return a STRICT JSON object mapping the field's 'name' (or 'id' if name is empty) to the generated string answer. 
    Do NOT wrap the JSON in markdown blocks (no \`\`\`json). Return raw JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const aiAnswers = JSON.parse(jsonString);
    console.log(`   [Universal AI] Successfully generated answers. Injecting into DOM...`);

    // 4. Inject Answers into the DOM
    for (const field of formSchema) {
      const identifier = field.name || field.id;
      
      // Handle File Uploads
      if (field.type === 'file') {
        const fileInput = await page.$(selector);
        if (!fileInput) continue;

        const isCoverLetter = field.label.toLowerCase().includes('cover') || field.name.toLowerCase().includes('cover');
        
        if (isCoverLetter) {
          const coverLetterPath = await generateDynamicCoverLetter(companyName, "Junior Backend Engineer");
          if (coverLetterPath) {
            console.log(`   [Universal AI] Attaching Dynamic Cover Letter to file input...`);
            await fileInput.uploadFile(coverLetterPath);
          }
        } else {
          console.log(`   [Universal AI] Attaching backend_resume.pdf to file input...`);
          await fileInput.uploadFile(path.join(__dirname, 'backend_resume.pdf'));
        }
        continue;
      }

      // Handle Text/Select inputs
      if (aiAnswers[identifier]) {
        const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
        const element = await page.$(selector);
        
        if (element) {
          if (field.tagName === 'select') {
            await page.select(selector, aiAnswers[identifier]);
          } else {
            // Direct native DOM injection to bypass React/Vue interception
            await page.evaluate((el, val) => {
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, element, aiAnswers[identifier]);
          }
        }
      }
    }

    console.log(`   [Universal AI] Form completely filled! Checking for Submit button...`);
    
    // 5. Attempt Submit
    const submitBtnXPath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')] | //input[@type='submit']";
    const submitBtn = await page.$$("::-p-xpath(" + submitBtnXPath + ")");
    
    if (submitBtn.length > 0) {
      await page.evaluate(el => el.click(), submitBtn[0]);
      await new Promise(r => setTimeout(r, 4000));
      return { success: true, message: 'Applied natively via AI Universal Form Filler' };
    }

    return { success: false, message: 'AI filled form but could not find Submit button.' };

  } catch (error) {
    console.error(`   [Universal AI] Error processing form:`, error.message);
    return { success: false, message: 'AI Engine crashed while parsing form.' };
  }
}

module.exports = { handleUniversalApply };
