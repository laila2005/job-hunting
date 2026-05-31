require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateAnalytics() {
  console.log(`\n📊 [Analytics Engine] Generating Skills Gap Radar & Rejection Intelligence...`);

  try {
    const { data: jobs, error } = await supabase.from('jobs').select('*');
    if (error) throw error;
    if (!jobs || jobs.length === 0) return;

    // Extract all risks
    const allRisks = jobs.map(j => j.aqs_risks).flat().filter(Boolean);
    const rejections = jobs.filter(j => j.status === 'Rejected');

    const prompt = `
      You are an elite Career Coach.
      Here are the risk factors identified by the ATS scorer across the last ${jobs.length} jobs applied to:
      ${JSON.stringify(allRisks.slice(0, 50))}

      Here is the count of rejections: ${rejections.length}

      Generate a highly actionable "Weekly Skills Gap & Strategy Report" in Markdown format.
      1. What technical skills are consistently missing from the candidate's profile?
      2. Suggest one weekend mini-project to build to bridge the biggest gap.
      3. Strategy adjustment: What should the candidate stop doing?
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reportPath = path.join(__dirname, '..', 'SkillsGapReport.md');
    fs.writeFileSync(reportPath, response.text.trim());

    console.log(`   ✅ [Analytics Engine] Weekly Skills Gap Report generated at: ${reportPath}`);

  } catch (err) {
    console.error(`   ❌ [Analytics Engine] Failed:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  generateAnalytics();
}

module.exports = { generateAnalytics };
