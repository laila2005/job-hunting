require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TARGET_REPOS = [
  'G:\\lolo\\job_search'
];

async function generateAuthenticProof() {
  console.log(`\n🔍 [Proof Engine] Analyzing local repositories for authentic engineering proof...`);

  try {
    for (const repoPath of TARGET_REPOS) {
      if (!fs.existsSync(repoPath)) continue;

      console.log(`   [Proof Engine] Scanning Git history for ${repoPath}...`);
      
      try {
        const gitLog = execSync('git log -n 10 --pretty=format:"%h - %s"', { cwd: repoPath }).toString();
        
        const prompt = `
          You are an expert engineering manager.
          Here are the candidate's last 10 real commits on a project:
          ${gitLog}
          
          Based ONLY on these real commits, write a short, recruiter-friendly summary (2-3 sentences) explaining what the candidate built and why it matters. Focus on technical competence. DO NOT hallucinate features.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const recruiterSummary = response.text.trim();
        console.log(`   ✅ [Proof Engine] Generated Summary: ${recruiterSummary.substring(0, 100)}...`);

        // Save to Supabase
        await supabase.from('portfolio_assets').upsert([{
          id: 'asset-' + repoPath.split('\\').pop(),
          repo_url: repoPath,
          health_score: 95, // Hardcoded for now
          recruiter_summary: recruiterSummary,
          tech_stack: ['Node.js', 'React', 'Puppeteer', 'Supabase'],
          last_analyzed: new Date().toISOString()
        }]);

      } catch (gitErr) {
        console.log(`   ⚠️ [Proof Engine] Skipping ${repoPath} - Not a git repository or no commits.`);
      }
    }
  } catch (err) {
    console.error(`   ❌ [Proof Engine] Failed:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  generateAuthenticProof();
}

module.exports = { generateAuthenticProof };
