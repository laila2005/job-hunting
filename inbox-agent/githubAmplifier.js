require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ADD YOUR REPOSITORIES HERE
const TARGET_REPOS = [
  'G:\\lolo\\job_search',
  // 'C:\\path\\to\\Mewoo', 
];

async function amplifyGithubActivity() {
  console.log(`\n🟩 [GitHub Amplifier] Booting up to secure the daily green square...`);

  try {
    for (const repoPath of TARGET_REPOS) {
      if (!fs.existsSync(repoPath)) {
        console.log(`   [GitHub Amplifier] Skipping ${repoPath} (Not found)`);
        continue;
      }

      console.log(`   [GitHub Amplifier] Analyzing repo: ${repoPath}`);
      
      // We will maintain a professional Engineering Journal to show consistent daily learning
      const journalPath = path.join(repoPath, 'ENGINEERING_JOURNAL.md');
      
      let existingContent = '';
      if (fs.existsSync(journalPath)) {
        existingContent = fs.readFileSync(journalPath, 'utf8');
      } else {
        existingContent = `# Daily Engineering Journal\n\nA log of daily architectural thoughts, refactoring ideas, and backend learnings.\n\n`;
      }

      // Generate a highly technical backend engineering thought
      const prompt = `
        You are a Junior Backend Engineer keeping a daily technical journal.
        Write ONE short, highly technical paragraph (max 3 sentences) about something you learned or thought about today.
        Topics can include: PostgreSQL indexing, Node.js event loop optimizations, Supabase RLS policies, Puppeteer headless scraping, or REST API caching.
        Just output the raw paragraph. No formatting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const thought = response.text.trim();
      const dateStr = new Date().toISOString().split('T')[0];
      
      const newEntry = `## ${dateStr}\n${thought}\n\n`;
      const finalContent = existingContent + newEntry;

      // Write to file
      fs.writeFileSync(journalPath, finalContent);
      console.log(`   [GitHub Amplifier] Wrote daily entry: "${thought.substring(0, 50)}..."`);

      // Git Commit and Push
      try {
        console.log(`   [GitHub Amplifier] Pushing to remote...`);
        execSync('git add ENGINEERING_JOURNAL.md', { cwd: repoPath });
        execSync(`git commit -m "docs: Update daily engineering journal for ${dateStr}"`, { cwd: repoPath });
        execSync('git push', { cwd: repoPath });
        console.log(`   ✅ [GitHub Amplifier] Successfully secured green square for ${repoPath}!`);
      } catch (gitErr) {
        console.log(`   ⚠️ [GitHub Amplifier] Git Error (maybe no remote or up-to-date): ${gitErr.message}`);
      }
    }
  } catch (err) {
    console.error(`   ❌ [GitHub Amplifier] Engine crashed:`, err.message);
  }
}

// If run directly
if (require.main === module) {
  amplifyGithubActivity();
}

module.exports = { amplifyGithubActivity };
