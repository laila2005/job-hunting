require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const { syncToGoogleSheet } = require('./sheetsSync');
const { updateTelemetry } = require('./telemetry');
const fs = require('fs');
const path = require('path');
const { scrapeWuzzuf } = require('./wuzzufScraper');
const { scrapeLinkedIn } = require('./linkedinJobScraper');
const { scrapeDeepSearch } = require('./deepSearchScraper');
const { scrapeHackerNewsInternships } = require('./hnScraper');
const { scrapeGlassdoor } = require('./glassdoorScraper');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load Candidate Profile strictly
const candidateProfilePath = path.join(__dirname, '..', 'candidate_profile.json');
const candidateProfile = fs.readFileSync(candidateProfilePath, 'utf-8');

function pickResume(title = '', description = '') {
  const t = (title + ' ' + description).toLowerCase();
  if (/\bc#\b|\.net|asp\.net|dotnet/.test(t))                         return 'Laila_Fikry_Backend_Engineer_DotNet.docx';
  if (/\bnode(\.js)?\b|express|fastapi|flask|django/.test(t))         return 'Laila_Fikry_Backend_Engineer_NodeJS.docx';
  if (/react|next\.js|full.?stack|front.?end/.test(t))                return 'Laila_Fikry_FullStack_Developer.docx';
  if (/\bmobile\b|react native|android|ios|flutter/.test(t))          return 'Laila_Fikry_Mobile_Developer.docx';
  return 'Laila_Fikry_Software_Engineer.docx';
}

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
You are a senior technical recruiter matching jobs for a specific candidate. Be strict and precise.

CANDIDATE: Laila Mohamed Fikry
- Location: New Cairo / 5th Settlement, Cairo, Egypt
- Role: Lead Software Engineer (LM Tech Solutions) — deployed RMS 3.0 IoT platform to MOI + GASCO (national government infrastructure)
- Stack: C#, ASP.NET Core, Python, FastAPI, Node.js, React, Next.js, TypeScript, PostgreSQL, SQL Server, Docker, WebRTC, TensorFlow/CNN
- Level: Junior-to-Mid (2+ years production exp; qualifies for roles asking 2-4 yrs)
- Salary target: 20,000–35,000 EGP/month local OR $2,500–$5,500 USD/month remote
- Preferred locations: New Cairo, 5th Settlement, Nasr City, Maadi, Heliopolis, Shorouk, Rehab, Mostakbal City — OR fully remote (no residency restriction)

${candidateProfile}

JOBS TO EVALUATE:
${JSON.stringify(jobsWithId.map(j => ({ id: j.id, title: j.title, company: j.company_name, location: j.candidate_required_location, description: j.description, salary: j.salary })))}

OUTPUT: JSON array only — no markdown, no explanation.
[{ "id": number, "pass": boolean, "aqs_score": number, "aqs_strengths": ["string"], "aqs_risks": ["string"], "recommended_action": "apply"|"network"|"skip"|"dream_company" }]

=== HARD FAIL (pass: false, aqs_score: 0, recommended_action: "skip") ===
1. Requires 5+ years explicitly (Senior/Staff/Principal/Lead title with no junior/graduate track)
2. Non-tech role: Sales, HR, Marketing, Business Dev, Graphic Design, Support, IT Admin, Data Entry, Finance, Accounting
3. Purely frontend/UI/design/WordPress with no backend component
4. Equity-only compensation — no base salary, "founder equity", unpaid, "sweat equity", volunteer
5. Requires US citizenship / US residency / must be located in the US for remote work
6. Physical office only in far Egypt: Sheikh Zayed, 6 October, Mohandeseen, Dokki, Haram, Imbaba, Faisal, Boulaq — with no remote/hybrid option

=== DO NOT FAIL (pass: true if tech fit exists) ===
- Roles requiring 2–4 years: Laila's MOI/GASCO production deployment fully covers this
- Remote roles with worldwide/Egypt eligibility: excellent fit
- Internships and junior roles: high priority

=== SCORING GUIDE (aqs_score 0–100) ===
Tech stack match (max 40 pts):
  - Core match (C#/ASP.NET or Node.js/Express or FastAPI/Python): +35
  - Good match (React/TypeScript/Next.js/PostgreSQL/Docker): +30
  - Partial match (general backend/fullstack/software): +20
  - Weak match (only adjacent tech): +10

Location fit (max 25 pts):
  - Fully remote, no US restriction: +25
  - Near Me (New Cairo/5th Settlement/Nasr City/Maadi/Heliopolis/Shorouk/Rehab): +25
  - Generic Cairo without far-district hints: +15
  - Hybrid with remote days near Cairo: +15
  - Far Egypt only (Sheikh Zayed/Giza/6 October) no remote: +0

Salary alignment (max 20 pts):
  - Salary clearly meets or exceeds target: +20
  - Salary unlisted (assume acceptable): +12
  - Salary clearly below target or equity-only: +0

Career level fit (max 15 pts):
  - Junior/Internship/Graduate/Entry-level: +15
  - Mid-level (2–4 yrs): +12
  - Mixed (junior preferred but not required): +10

=== RECOMMENDED ACTION ===
- "dream_company": multinational/international brand (Google, Microsoft, Amazon, Vodafone, Oracle, SAP, Siemens, IBM, Booking, Shopify, etc.) AND salary ≥ 25,000 EGP/mo or ≥ $3,000/mo AND remote-eligible or Near Me
- "network": well-known company but unclear path without referral
- "apply": solid match, straightforward application
- "skip": pass is false
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
        const desc  = (job.description || '').toLowerCase();
        const loc   = (job.candidate_required_location || '').toLowerCase();
        const sal   = (job.salary || '').toLowerCase();
        const combined = `${title} ${desc} ${loc} ${sal}`;

        // Hard exclusions
        const excludeKeywords = ['warehouse', 'mechanical', 'civil', 'electrical', 'marketing', 'sales',
          'hr ', 'human resources', 'logistics', 'accounting', 'finance', 'medical', 'hardware',
          'data entry', 'business development', 'support engineer', 'it admin', 'graphic design',
          'wordpress', 'content writer', 'seo', 'social media'];
        const isEquityOnly = ['equity only', 'equity-only', 'no salary', 'unpaid', 'sweat equity',
          'volunteer', 'cofounder equity', 'co-founder equity'].some(k => combined.includes(k));
        const isUSOnly = ['us only', 'us citizens only', 'must reside in the us',
          'authorized to work in the us', 'must be located in the us'].some(k => combined.includes(k));
        const isSenior = /\b(senior|lead|principal|staff|head of|vp |cto|cio)\b/.test(title) &&
          !title.includes('intern') && !title.includes('junior');
        const isFarEgypt = ['sheikh zayed', '6 october', 'sixth of october', 'mohandeseen',
          'dokki', 'haram', 'imbaba', 'faisal', 'boulaq'].some(k => combined.includes(k));

        if (excludeKeywords.some(k => title.includes(k)) || isEquityOnly || isUSOnly || isSenior || isFarEgypt) continue;

        const techKeywords = ['backend', 'c#', '.net', 'asp.net', 'python', 'fastapi', 'node',
          'express', 'react', 'typescript', 'next.js', 'fullstack', 'full-stack', 'software',
          'developer', 'engineer', 'programmer', 'computer science', 'docker', 'postgresql', 'api'];

        const isTechRole = techKeywords.some(kw => title.includes(kw) || desc.includes(kw));
        if (!isTechRole) continue;

        // Score
        let aqs_score = 60;
        const strengths = ['Fallback rule match'];
        const risks = ['AI evaluation offline — manual review recommended'];

        if (title.includes('c#') || title.includes('.net') || title.includes('asp.net')) { aqs_score += 20; strengths.push('Core C#/ASP.NET stack match'); }
        if (title.includes('node') || title.includes('fastapi') || title.includes('python'))  { aqs_score += 15; strengths.push('Python/Node backend match'); }
        if (title.includes('react') || title.includes('typescript') || title.includes('next')) { aqs_score += 10; strengths.push('Frontend stack match'); }
        if (title.includes('intern') || desc.includes('internship')) { aqs_score = Math.max(aqs_score, 82); strengths.push('Internship — high priority'); }
        if (loc.includes('remote') && !isUSOnly) { aqs_score += 8; strengths.push('Remote eligible'); }
        if (['new cairo','5th settlement','nasr city','maadi','heliopolis','shorouk','rehab'].some(k => loc.includes(k))) {
          aqs_score += 8; strengths.push('Near preferred location');
        }

        aqs_score = Math.min(aqs_score, 95);

        // Resume routing
        let resumeVersion = 'Laila_Fikry_Software_Engineer.docx';
        if (title.includes('c#') || title.includes('.net') || title.includes('asp.net')) resumeVersion = 'Laila_Fikry_Backend_Engineer_DotNet.docx';
        else if (title.includes('node') || title.includes('express') || title.includes('fastapi')) resumeVersion = 'Laila_Fikry_Backend_Engineer_NodeJS.docx';
        else if (title.includes('react') || title.includes('fullstack') || title.includes('full-stack') || title.includes('next')) resumeVersion = 'Laila_Fikry_FullStack_Developer.docx';
        else if (title.includes('mobile') || title.includes('react native')) resumeVersion = 'Laila_Fikry_Mobile_Developer.docx';

        finalJobs.push({ ...job, aqs_score, aqs_strengths: strengths, aqs_risks: risks, recommended_action: 'apply', _resumeVersion: resumeVersion });
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
        const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=50');
        const data = await response.json();
        // Filter locally for junior/intern
        const filteredRemotive = (data.jobs || []).filter(j => 
          j.title.toLowerCase().includes('intern') || 
          j.title.toLowerCase().includes('junior') ||
          j.title.toLowerCase().includes('trainee') ||
          j.title.toLowerCase().includes('student')
        );
        remotiveJobs = filteredRemotive.slice(0, 15).map(job => ({
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
        const filteredArbeitnow = (data.data || []).filter(j => 
          j.title.toLowerCase().includes('intern') || 
          j.title.toLowerCase().includes('junior') ||
          j.title.toLowerCase().includes('trainee') ||
          j.title.toLowerCase().includes('student')
        );
        arbeitnowJobs = filteredArbeitnow.slice(0, 15).map(job => ({
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

    const [wuzzufJobs, linkedinJobs, deepSearchJobs, hnJobs, glassdoorJobs] = await Promise.all([
      scrapeWuzzuf(customQueries),
      scrapeLinkedIn(customQueries),
      scrapeDeepSearch(customQueries),
      scrapeHackerNewsInternships(),
      scrapeGlassdoor(customQueries)
    ]);

    const freshJobs = [...remotiveJobs, ...arbeitnowJobs, ...wuzzufJobs, ...linkedinJobs, ...deepSearchJobs, ...hnJobs, ...glassdoorJobs];
    
    // Deduplicate by URL locally first
    const uniqueFreshJobs = [];
    const seenUrls = new Set();
    for (const job of freshJobs) {
      if (job.url && !seenUrls.has(job.url)) {
        const loc = (job.candidate_required_location || '').toLowerCase();
        
        // Hard-coded foreign country/city signals (avoid substring 'us' — too broad)
        const foreignKeywords = [
          'canada', 'toronto', 'ontario', 'vancouver', 'montreal', 'calgary', 'alberta', 'quebec',
          'united states', 'united kingdom', 'usa', '(us)', '- us', ', us',
          'new york', 'san francisco', 'los angeles', 'chicago', 'seattle', 'austin', 'boston',
          'germany', 'berlin', 'munich', 'uk', 'london', 'manchester',
          'france', 'paris', 'netherlands', 'amsterdam', 'poland', 'warsaw', 'krakow',
          'india', 'bangalore', 'mumbai', 'europe', 'asia', 'japan', 'tokyo',
          'saudi', 'riyadh', 'dubai', 'uae', 'abu dhabi',
        ];

        // Far Egyptian districts Laila cannot commute to (no remote option)
        const farEgyptKeywords = [
          'sheikh zayed', 'الشيخ زايد', '6 october', '6th october', 'sixth of october',
          'mohandeseen', 'المهندسين', 'dokki', 'الدقي', 'haram', 'الهرم',
          'imbaba', 'إمبابة', 'faisal', 'فيصل', 'boulaq', 'بولاق',
        ];

        const isForeign = foreignKeywords.some(fk => loc.includes(fk));
        const isEquityOnly = ['equity only','equity-only','no salary','unpaid','sweat equity','volunteer'].some(k =>
          `${(job.title||'')} ${(job.description||'')} ${(job.salary||'')}`.toLowerCase().includes(k));

        // Accepted Egypt/remote locations
        const isEgypt = loc.includes('egypt') || loc.includes('cairo') || loc.includes('alexandria') ||
          loc.includes('damietta') || loc.includes('مصر') || loc.includes('egy') ||
          loc.includes('remote') || loc.includes('smart village');

        // Far Egyptian district only (no remote/hybrid mention)
        const isFarEgyptOnly = farEgyptKeywords.some(k => loc.includes(k)) &&
          !loc.includes('remote') && !loc.includes('hybrid');

        const titleLower = (job.title || '').toLowerCase();
        const descLower  = (job.description || '').toLowerCase();
        const isInternship = titleLower.includes('intern') || descLower.includes('intern');

        if (isForeign || isEquityOnly || isFarEgyptOnly || (isInternship && !isEgypt)) {
          console.log(`   ⏭️ Pre-filter skip: ${job.title} at ${job.company_name || job.company} [${job.candidate_required_location}]`);
          continue;
        }

        seenUrls.add(job.url);
        uniqueFreshJobs.push(job);
      }
    }
    
    console.log(`🎯 Compiled ${uniqueFreshJobs.length} unique live positions. Sending to AI for AQS scoring...`);

    const finalJobs = await evaluateJobWithAI(uniqueFreshJobs);

    // Fetch existing jobs from Supabase to prevent duplicate inserts
    const { data: existingJobs, error: fetchErr } = await supabase
      .from('jobs')
      .select('companyLink, title, company');
    
    // Deduplicate by URL
    const dbUrls = new Set((existingJobs || []).map(j => j.companyLink).filter(Boolean));
    
    // Deduplicate by Company + Title
    const dbSignatures = new Set((existingJobs || []).map(j => {
      const t = (j.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const c = (j.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${c}_${t}`;
    }).filter(s => s !== '_'));

    let ingestedCount = 0;
    for (const job of finalJobs) {
      const companyLink = job.url || job.companyLink;
      
      const t = (job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const c = (job.company_name || job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const signature = `${c}_${t}`;
      
      if (dbUrls.has(companyLink) || dbSignatures.has(signature)) {
        console.log(`   ⏭️ Skipping duplicate: ${job.title} at ${job.company_name || job.company}`);
        continue;
      }
      
      dbUrls.add(companyLink);
      dbSignatures.add(signature);

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
        resumeVersion: pickResume(job.title, job.description)
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
