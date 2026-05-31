require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateBrandContent() {
  console.log(`\n📢 [Brand Engine] Generating authentic technical content...`);

  try {
    const { data: assets, error } = await supabase
      .from('portfolio_assets')
      .select('*')
      .order('last_analyzed', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!assets || assets.length === 0) {
      console.log(`   [Brand Engine] No portfolio assets found. Run Proof Engine first.`);
      return;
    }

    const recentWork = assets[0];

    const prompt = `
      You are an elite developer writing a LinkedIn post about your recent engineering work.
      Here is the summary of what you just built:
      "${recentWork.recruiter_summary}"

      Write a highly technical, humble, 3-paragraph LinkedIn post.
      - Focus on the "why" and "how".
      - Mention technical challenges overcome.
      - DO NOT use cringe emojis, buzzwords, or sound like AI.
      - Sound like a passionate, gritty junior backend engineer who loves solving hard problems.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const postContent = response.text.trim();
    
    // Save to a local file
    const draftsDir = path.join(__dirname, '..', 'BrandDrafts');
    if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir);
    
    const draftPath = path.join(draftsDir, `LinkedIn_Post_${Date.now()}.txt`);
    fs.writeFileSync(draftPath, postContent);

    console.log(`   ✅ [Brand Engine] High-signal LinkedIn post drafted at: ${draftPath}`);

  } catch (err) {
    console.error(`   ❌ [Brand Engine] Failed:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  generateBrandContent();
}

module.exports = { generateBrandContent };
