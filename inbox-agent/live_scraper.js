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
  if (!jobs || jobs.length === 0) return [];

  const batchSize = 25;
  const finalJobs = [];
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const chunk = jobs.slice(i, i + batchSize);
    console.log(`   🤖 [AI Evaluation] Scoring batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(jobs.length / batchSize)} (${chunk.length} jobs)...`);
    
    // Add temp IDs for precise matching
    const jobsWithId = chunk.map((job, idx) => ({ id: idx, ...job }));

    const prompt = `
      You are an expert technical recruiter and career strategist evaluating job descriptions.
      
      We are matching jobs for this specific candidate:
      Candidate Profile:
      ${candidateProfile}

      Here is the batch of jobs to evaluate:
      ${JSON.stringify(jobsWithId.map(j => ({ 
        id: j.id, 
        title: j.title, 
        company: j.company_name, 
        location: j.candidate_required_location, 
        description: j.description, 
        salary: j.salary 
      })))}

      For EACH job, output a JSON array in this exact format:
      [
        {
          "id": number,
          "pass": boolean, 
          "aqs_score": number (0-100),
          "aqs_strengths": ["string"],
          "aqs_risks": ["string"],
          "recommended_action": "apply" | "network" | "skip" | "dream_company"
        }
      ]
      
      RULES FOR EVALUATION:
      - pass: true if the candidate has strong overlap in backend/fullstack/IoT/ML and fits the tech stack (e.g. C#, ASP.NET, Python, Node, React).
      - Do NOT fail jobs that require 2-4 years of experience, as this candidate's production experience at LM Tech Solutions (MOI and GASCO enterprise systems) makes her fully qualified.
      - pass: false if it explicitly requires 5+ years of experience (Senior/Staff/Lead) OR is purely frontend/design/WordPress OR has a strict location restriction that excludes candidates based in Egypt.
      - aqs_score: Score out of 100 based on fit with Laila's technical skills (C#, ASP.NET, React, Python), remote feasibility, and career progression potential.
      - recommended_action: 
        - 'skip' if pass is false. 
        - 'dream_company' if it is a prominent international/multinational company offering high/premium salaries (USD, Euro, or top-tier EGP) and is EITHER fully remote OR hybrid near New Cairo.
        - 'network' if it's a high-tier company requiring a referral. 
        - 'apply' if it's a good match but not a dream company.
    `;

    let attempts = 3;
    let success = false;
    let evaluatedJobs = [];
    
    while (attempts > 0 && !success) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        const raw = response.text.trim().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        evaluatedJobs = JSON.parse(raw);
        success = true;
      } catch (err) {
        attempts--;
        console.warn(`      ⚠️ Batch evaluation failed (Status 503/Transient). Attempts left: ${attempts}. Error: ${err.message}`);
        if (attempts > 0) {
          console.log(`      ⏳ Sleeping 4 seconds before retry...`);
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    }

    if (success) {
      for (const job of jobsWithId) {
        const evaluation = evaluatedJobs.find(e => e.id === job.id);
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
    } else {
      console.warn(`   ⚠️ Fallback: Running local rule-based evaluation for batch because Gemini is rate-limited.`);
      for (const job of jobsWithId) {
        const title = (job.title || '').toLowerCase();
        const desc = (job.description || '').toLowerCase();
        
        const keywords = ['backend', 'c#', '.net', 'asp.net', 'python', 'node', 'react', 'fullstack', 'software', 'develop', 'engineer', 'iot', 'intern'];
        const isMatch = keywords.some(kw => title.includes(kw) || desc.includes(kw));
        const isSenior = title.includes('senior') || title.includes('lead') || title.includes('principal') || title.includes('5+') || title.includes('6+') || title.includes('7+');
        
        if (isMatch && !isSenior) {
          let aqs_score = 75;
          let strengths = ['Local fallback match'];
          let risks = ['AI evaluation offline (rate limit)'];
          
          if (title.includes('intern') || desc.includes('intern')) {
            aqs_score = 90;
            strengths.push('Internship suitable for Year 3 CS student');
          }
          if (title.includes('c#') || title.includes('.net')) {
            strengths.push('Matches core ASP.NET stack');
          }
          
          finalJobs.push({
            ...job,
            aqs_score: aqs_score,
            aqs_strengths: strengths,
            aqs_risks: risks,
            recommended_action: 'apply'
          });
        }
      }
    }
    
    // Slight pause to prevent rate-limit throttling
    await new Promise(r => setTimeout(r, 1000));
  }

  return finalJobs;
}

async function fetchRealJobs(customQueries) {
  console.log("🚀 Sourcing Engine: Activating Live Search...");
  await updateTelemetry('Sourcing', 'Activating live job search...');
  
  try {
    let remotiveJobs = [];
    let arbeitnowJobs = [];
    
    // Only query global remote APIs if we are NOT running a targeted local query
    if (!customQueries) {
      console.log("🌐 Fetching real remote backend roles from Remotive API...");
      try {
        const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&search=backend');
        const data = await response.json();
        remotiveJobs = (data.jobs || []).slice(0, 8).map(job => ({
          title: job.title,
          company_name: job.company_name || 'Remotive Recruiter',
          candidate_required_location: job.candidate_required_location || 'Remote',
          url: job.url,
          description: job.description ? job.description.replace(/<[^>]*>/g, '').slice(0, 500) : 'Remote Backend Role',
          salary: job.salary || 'Unlisted',
          company_logo: job.company_logo || ''
        }));
      } catch (e) {
        console.error("⚠️ Failed to fetch from Remotive:", e.message);
      }

      console.log("🌐 Fetching premium remote jobs from Arbeitnow API...");
      try {
        const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
        const data = await response.json();
        arbeitnowJobs = (data.data || []).slice(0, 8).map(job => ({
          title: job.title,
          company_name: job.company_name || 'Arbeitnow Recruiter',
          candidate_required_location: job.location || 'Remote',
          url: job.url,
          description: job.description ? job.description.replace(/<[^>]*>/g, '').slice(0, 500) : 'Remote Backend Role',
          salary: 'Unlisted (Euro/Global standard)',
          company_logo: ''
        }));
      } catch (e) {
        console.error("⚠️ Failed to fetch from Arbeitnow:", e.message);
      }
    }

    const [wuzzufJobs, linkedinJobs] = await Promise.all([
      scrapeWuzzuf(customQueries),
      scrapeLinkedIn(customQueries)
    ]);

    const freshJobs = [...remotiveJobs, ...arbeitnowJobs, ...wuzzufJobs, ...linkedinJobs];
    
    // Deduplicate by URL locally first
    const uniqueFreshJobs = [];
    const seenUrls = new Set();
    for (const job of freshJobs) {
      if (job.url && !seenUrls.has(job.url)) {
        seenUrls.add(job.url);
        uniqueFreshJobs.push(job);
      }
    }
    
    console.log(`🎯 Compiled ${uniqueFreshJobs.length} unique live positions. Sending to AI for AQS scoring...`);

    const finalJobs = await evaluateJobWithAI(uniqueFreshJobs);

    // Fetch existing job URLs from Supabase to prevent duplicate inserts
    const { data: existingJobs, error: fetchErr } = await supabase
      .from('jobs')
      .select('companyLink');
    
    const dbUrls = new Set((existingJobs || []).map(j => j.companyLink));

    let ingestedCount = 0;
    for (const job of finalJobs) {
      const companyLink = job.url || job.companyLink;
      
      if (dbUrls.has(companyLink)) {
        console.log(`   ⏭️ Skipping duplicate: ${job.title} at ${job.company_name || job.company}`);
        continue;
      }

      console.log(`   ✅ MATCH: ${job.title} | Score: ${job.aqs_score}`);
      
      const newJob = {
        id: 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        company: job.company_name || job.company || 'Unknown Company',
        title: job.title,
        location: job.candidate_required_location || 'Remote',
        status: 'Pending Review',
        companyLink: companyLink,
        fitScore: job.aqs_score || 85,
        atsMatch: job.aqs_score || 80,
        gapRisk: Array.isArray(job.aqs_risks) ? job.aqs_risks.join(', ') : (job.aqs_risks || 'Low'),
        responsibilities: job.aqs_strengths || [],
        companySummary: job.description ? job.description.slice(0, 1000) : 'Live Scraped Job Listing',
        model: job.candidate_required_location && job.candidate_required_location.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: job.salary || 'Unlisted',
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
      // Mark as seen so if duplicates exist within the same scraped batch, they aren't inserted twice
      dbUrls.add(companyLink);
    }

    await updateTelemetry('Sleeping', 'Scraping cycle complete. Database synced.');
    console.log(`\n✅ Sourcing Complete! ${ingestedCount} new jobs passed the strict AI filter and were sent to your Dashboard.`);
  } catch (err) {
    console.error("❌ Sourcing Engine Failed:", err.message);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
let customQueries = null;

// Handle --keyword="..." or --keyword ...
const keywordArgIdx = args.findIndex(arg => arg.startsWith('--keyword=') || arg === '--keyword' || arg === '-k');
if (keywordArgIdx !== -1) {
  const arg = args[keywordArgIdx];
  let val = '';
  if (arg.startsWith('--keyword=')) {
    val = arg.split('=')[1];
  } else if (keywordArgIdx + 1 < args.length) {
    val = args[keywordArgIdx + 1];
  }
  
  if (val) {
    customQueries = val.split(',').map(q => q.trim());
    console.log(`📡 Sourcing engine configured to scrape custom keywords: ${JSON.stringify(customQueries)}`);
  }
}

fetchRealJobs(customQueries);
