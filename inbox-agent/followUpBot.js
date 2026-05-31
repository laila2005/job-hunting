require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateFollowUps() {
  console.log(`\n✉️ [Follow-Up Engine] Scanning for stale applications (>7 days)...`);

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

    // Find jobs applied to 7+ days ago
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'Applied')
      .lte('appliedDate', dateLimit);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      console.log(`   [Follow-Up Engine] No follow-ups needed today.`);
      return;
    }

    console.log(`   [Follow-Up Engine] Found ${jobs.length} jobs needing follow-up.`);
    
    let reportContent = `# Automated Follow-Up Email Drafts\n\n`;
    reportContent += `> Automatically generated on ${new Date().toISOString().split('T')[0]}\n\n`;

    for (const job of jobs) {
      const prompt = `
        You are drafting a professional, short, polite follow-up email.
        The candidate (Laila) applied for the "${job.title}" role at "${job.company}" on ${job.appliedDate}.
        Write a 3-4 sentence email asking about the status of the application and reaffirming interest.
        Keep it warm but very professional. Do not use placeholders other than [Recruiter Name] if needed.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      reportContent += `## ${job.company} - ${job.title}\n`;
      reportContent += `**Applied On:** ${job.appliedDate}\n\n`;
      reportContent += `**Draft Email:**\n\n${response.text.trim()}\n\n---\n\n`;
    }

    const reportPath = path.join(__dirname, '..', 'FollowUpDrafts.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log(`   ✅ [Follow-Up Engine] Generated email drafts and saved to ${reportPath}`);

  } catch (err) {
    console.error(`   ❌ [Follow-Up Engine] Error generating follow-ups:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  generateFollowUps();
}

module.exports = { generateFollowUps };
