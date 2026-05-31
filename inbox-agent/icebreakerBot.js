require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function sendIcebreaker(page, companyName, jobTitle) {
  console.log(`\n🧊 [Icebreaker] Initiating Networking Protocol for ${companyName}...`);

  try {
    // 1. Generate Personalized Note
    const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
    const profileStr = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '{}';

    const prompt = `
      You are writing a LinkedIn connection request note (MAXIMUM 300 CHARACTERS).
      The candidate just applied for the "${jobTitle}" position at "${companyName}".
      Candidate Profile: ${profileStr}
      
      Write a highly enthusiastic, professional, and very brief connection request to the recruiter.
      Do not include placeholders. End with the candidate's name (Laila).
      KEEP IT UNDER 300 CHARACTERS.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const note = response.text.trim().substring(0, 299);
    console.log(`   [Icebreaker] AI Drafted Note: "${note}"`);

    // 2. Search LinkedIn for a Recruiter at this company
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`recruiter ${companyName}`)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    // 3. Find the first "Connect" button
    const connectBtnXPath = "//button[span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'connect')]]";
    const connectBtns = await page.$$("::-p-xpath(" + connectBtnXPath + ")");

    if (connectBtns.length === 0) {
      console.log(`   [Icebreaker] No open 'Connect' buttons found for ${companyName} recruiters.`);
      return false;
    }

    console.log(`   [Icebreaker] Found a recruiter! Attempting to connect...`);
    await page.evaluate(el => el.click(), connectBtns[0]);
    await new Promise(r => setTimeout(r, 2000));

    // 4. Click 'Add a note'
    const addNoteXPath = "//button[span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'add a note')]]";
    const addNoteBtns = await page.$$("::-p-xpath(" + addNoteXPath + ")");
    
    if (addNoteBtns.length > 0) {
      await page.evaluate(el => el.click(), addNoteBtns[0]);
      await new Promise(r => setTimeout(r, 1000));
      
      // Inject note
      const textarea = await page.$('textarea[name="message"]');
      if (textarea) {
        await page.evaluate((el, val) => {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, textarea, note);
        await new Promise(r => setTimeout(r, 1000));

        // Click Send
        const sendBtnXPath = "//button[span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'send')]]";
        const sendBtns = await page.$$("::-p-xpath(" + sendBtnXPath + ")");
        if (sendBtns.length > 0) {
          await page.evaluate(el => el.click(), sendBtns[0]);
          console.log(`   ✅ [Icebreaker] Connection request successfully sent to recruiter!`);
          
          // Save to Advanced Network Intelligence
          await supabase.from('network_contacts').insert([{
            name: 'LinkedIn Recruiter',
            company: companyName,
            role: 'Recruiter',
            stage: 'Connected',
            notes: note,
            last_contacted: new Date().toISOString()
          }]);

          await new Promise(r => setTimeout(r, 3000));
          return true;
        }
      }
    } else {
      console.log(`   [Icebreaker] 'Add a note' button not found. They might require an email.`);
    }

  } catch (error) {
    console.error(`   ❌ [Icebreaker] Error running Icebreaker:`, error.message);
  }

  return false;
}

module.exports = { sendIcebreaker };
