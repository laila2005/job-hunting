require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const { syncToGoogleSheet } = require('./sheetsSync');
const { updateTelemetry } = require('./telemetry');
const fs = require('fs');
const path = require('path');
const { scrapeWuzzuf } = require('./wuzzufScraper');
const { scrapeLinkedIn } = require('./linkedinJobScraper');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load Candidate Profile strictly
const candidateProfilePath = path.join(__dirname, '..', 'candidate_profile.json');
const candidateProfile = fs.readFileSync(candidateProfilePath, 'utf-8');

async function evaluateJobWithAI(jobs) {
  const prompt = `
      You are an expert technical recruiter and career strategist evaluating job descriptions.
      We are looking ONLY for Early-Career or Junior Backend/Fullstack roles for an Egypt-based developer.

      Here is the batch of jobs:
      ${JSON.stringify(jobs)}

      For EACH job, output a JSON object in this exact array format:
      [
        {
          "title": "exact title",
          "pass": boolean, 
          "aqs_score": number (0-100),
          "aqs_strengths": ["string"],
          "aqs_risks": ["string"],
          "recommended_action": "apply" | "network" | "skip"
          "recommended_action": "apply" | "network" | "skip" | "dream_company"
        }
      ]
      
      RULES:
      - pass: false if it explicitly requires 4+ years of experience, is Senior/Staff, or is purely frontend/design.
      - aqs_score: Score out of 100 based on fit, remote possibility, and backend relevance.
      - recommended_action: 
        - 'skip' if pass is false. 
        - 'dream_company' if it is an international/multinational company offering a high salary and is EITHER fully remote OR hybrid in New Cairo.
        - 'network' if it's a high-tier company requiring a referral. 
        - 'apply' if it's a perfect match but not a dream company.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const raw = response.text.trim().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    const evaluatedJobs = JSON.parse(raw);

    const finalJobs = [];
    for (const job of jobs) {
      const evaluation = evaluatedJobs.find(e => e.title === job.title);
      if (evaluation && evaluation.pass) {
        finalJobs.push({
          ...job,
          aqs_score: evaluation.aqs_score || 80,
          aqs_strengths: evaluation.aqs_strengths || ['Good fit'],
          aqs_risks: evaluation.aqs_risks || ['Unknown'],
          recommended_action: evaluation.recommended_action || 'apply'
        });
      }
    }

    return finalJobs;
  } catch (err) {
    console.error("Evaluation failed.", err.message);
    return [];
  }
}

async function fetchRealJobs() {
  console.log("🚀 Sourcing Engine: Activating Live Search...");
  await updateTelemetry('Sourcing', 'Activating live job search...');
  
  try {
    console.log("🌐 Fetching real remote backend roles from Remotive API...");
    const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&search=backend');
    const data = await response.json();
    const remotiveJobs = data.jobs.slice(0, 5); 

    const [wuzzufJobs, linkedinJobs] = await Promise.all([
      scrapeWuzzuf(),
      scrapeLinkedIn()
    ]);

    const freshJobs = [...remotiveJobs, ...wuzzufJobs.slice(0, 5), ...linkedinJobs.slice(0, 5)];
    
    console.log(`🎯 Found ${freshJobs.length} live positions. Sending to AI for AQS scoring...`);

    const finalJobs = await evaluateJobWithAI(freshJobs);

    let ingestedCount = 0;
    for (const job of finalJobs) {
      console.log(`   ✅ MATCH: ${job.title} | Score: ${job.aqs_score}`);
      
      const newJob = {
        id: 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        company: job.companyName || job.company_name || job.company || 'Unknown Company',
        title: job.title,
        location: job.location || job.candidate_required_location || 'Remote',
        status: 'Pending Review',
        companyLink: job.url || job.companyLink,
        aqs_score: job.aqs_score,
        aqs_strengths: job.aqs_strengths,
        aqs_risks: job.aqs_risks,
        recommended_action: job.recommended_action,
        resumeVersion: 'backend_resume.pdf'
      };

      console.log(`   📥 Ingesting to Database...`);
      
      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to insert ${newJob.company}:`, error.message);
        continue;
      }

      // Sync to Google Sheets
      await syncToGoogleSheet({
        company: newJob.company,
        title: newJob.title,
        location: newJob.location,
        status: newJob.status,
        appliedDate: new Date().toISOString().split('T')[0],
        companyLink: newJob.companyLink
      });
      
      ingestedCount++;
    }

    await updateTelemetry('Sleeping', 'Scraping cycle complete. Database synced.');
    console.log(`\n✅ Sourcing Complete! ${ingestedCount} jobs passed the strict AI filter and were sent to your Dashboard.`);
  } catch (err) {
    console.error("❌ Sourcing Engine Failed:", err.message);
  }
}

fetchRealJobs();
