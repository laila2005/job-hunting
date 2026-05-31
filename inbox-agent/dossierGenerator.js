require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateDossiers() {
  console.log(`\n💎 [Dossier Engine] Scanning for Dream Company jobs...`);

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'Needs Dossier');

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      console.log(`   [Dossier Engine] No new dream jobs found.`);
      return;
    }

    const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
    const profileStr = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '{}';

    for (const job of jobs) {
      console.log(`   [Dossier Engine] Building strategic dossier for ${job.company}...`);

      const prompt = `
        You are an elite Career Strategist.
        The candidate (Junior Backend Engineer) wants to apply to a Dream Company: ${job.company} for the role of ${job.title}.
        
        Candidate Profile:
        ${profileStr}
        
        Output a strategic 3-step dossier for landing this job:
        1. Network: Who to message first (Recruiter vs Hiring Manager) and what to say.
        2. Proof: Which portfolio project to highlight and how to frame it.
        3. Approach: Should they apply via the portal first, or seek a referral first?
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const dossierPath = path.join(__dirname, '..', `Dossier_${job.company.replace(/[^a-z0-9]/gi, '_')}.md`);
      fs.writeFileSync(dossierPath, `# Strategic Dossier: ${job.company}\n\n${response.text.trim()}`);
      
      console.log(`   ✅ [Dossier Engine] Dossier generated at ${dossierPath}`);

      // Update status to Ready to Execute
      await supabase.from('jobs').update({ status: 'Strategic Plan Ready' }).eq('id', job.id);
    }
  } catch (err) {
    console.error(`   ❌ [Dossier Engine] Failed:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  generateDossiers();
}

module.exports = { generateDossiers };
