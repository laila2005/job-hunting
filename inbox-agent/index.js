require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const imaps = require('imap-simple');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// 1. Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_KEY || 'placeholder_key'
);

// 2. Setup Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Local Non-Destructive Processed UID Cache
const cachePath = path.join(__dirname, 'processed_emails.json');
let processedUIDs = new Set();

if (fs.existsSync(cachePath)) {
  try {
    const rawData = fs.readFileSync(cachePath, 'utf-8');
    processedUIDs = new Set(JSON.parse(rawData));
    console.log(`📂 Loaded ${processedUIDs.size} processed email UIDs from cache.`);
  } catch (e) {
    console.error("⚠️ Failed to read email cache file:", e.message);
  }
}

function saveProcessedUIDs() {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(Array.from(processedUIDs), null, 2));
  } catch (e) {
    console.error("⚠️ Failed to write email cache file:", e.message);
  }
}

// 4. Setup WhatsApp Client
const waClient = new Client({
  authStrategy: new LocalAuth(), // Saves session so you don't scan QR every time
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

waClient.on('qr', (qr) => {
  console.log('\n📱 [WhatsApp] Scan this QR code with your phone to connect the Notification Bot:');
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  console.log('✅ [WhatsApp] Notification Client is active and ready!');
  startEmailListener();
});

// Function to send WhatsApp message
const notifyLaila = async (message) => {
  try {
    const rawNum = process.env.PHONE_NUMBER || '201147656669';
    const cleanedNum = rawNum.replace(/\D/g, ''); // strip spaces/pluses
    const chatId = `${cleanedNum}@c.us`; 
    await waClient.sendMessage(chatId, message);
    console.log(`✉️ [WhatsApp] Notification sent successfully to ${cleanedNum}`);
  } catch (err) {
    console.error('❌ [WhatsApp] Failed to send message:', err.message);
  }
};

// 5. Setup IMAP Email Listener
const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 5000
  }
};

// Evaluate unseen email with Gemini
async function evaluateEmailWithAI(from, subject, body) {
  const prompt = `
    You are an expert personal career agent. Analyze this incoming email to determine if it is related to a job application, a job update, an interview invitation, an online test/assessment, an offer, or a rejection.

    Sender: ${from}
    Subject: ${subject}
    Body Snippet: ${body}

    Respond ONLY with a JSON object in this exact format:
    {
      "is_job_related": boolean,
      "category": "application_received" | "interview_invite" | "assessment_request" | "rejection" | "job_offer" | "other_update",
      "company_name": "string (name of the hiring company, or null if unknown)",
      "job_title": "string (job title, or null if unknown)",
      "whatsapp_summary": "string (a beautifully formatted WhatsApp message of 1-3 lines to Laila, using bold markers like *Subject*, *Company*, *Status* and matching emojis)"
    }

    Formatting rules for "whatsapp_summary":
    - Keep it under 250 characters.
    - Start with a vibrant, relevant emoji based on the category:
      - interview_invite: 📅
      - assessment_request: 📝
      - rejection: 💔
      - job_offer: 🎉
      - application_received: 📩
      - other_update: ℹ️
    - Make sure it clearly states the Company, Job Title (if known), and next steps/status.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const raw = response.text.trim().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Gemini Email Analysis failed:", err.message);
    return { is_job_related: false };
  }
}

// Sync email details with Supabase Database
async function syncEmailToDatabase(evalResult, from) {
  if (!evalResult.company_name) return;

  const company = evalResult.company_name.trim();
  const title = evalResult.job_title || 'Software Engineer';
  let newStatus = 'Pending Review';
  
  if (evalResult.category === 'interview_invite') newStatus = 'Interviewing';
  else if (evalResult.category === 'rejection') newStatus = 'Rejected';
  else if (evalResult.category === 'job_offer') newStatus = 'Offer Received';
  else if (evalResult.category === 'application_received') newStatus = 'Applied';

  try {
    // Search if job exists in Supabase (case-insensitive fuzzy search)
    const { data: existingJobs, error: selectErr } = await supabase
      .from('jobs')
      .select('*');

    if (selectErr) throw selectErr;

    const matchedJob = (existingJobs || []).find(j => 
      j.company.toLowerCase().includes(company.toLowerCase()) || 
      company.toLowerCase().includes(j.company.toLowerCase())
    );

    if (matchedJob) {
      // Job exists, update its status
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          appliedDate: newStatus === 'Applied' ? new Date().toISOString().split('T')[0] : matchedJob.appliedDate 
        })
        .eq('id', matchedJob.id);
      
      if (updateErr) throw updateErr;
      console.log(`💼 [Database] Updated existing job: ${matchedJob.company} status to [${newStatus}]`);
    } else {
      // Job does NOT exist (Laila applied manually), let's automatically ingest it!
      const newJob = {
        id: 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        company: company,
        title: title,
        location: 'Remote / Egypt',
        status: newStatus,
        companyLink: 'mailto:' + from,
        aqs_score: 95, // Manual applications represent high fit
        aqs_strengths: ['Manually applied', 'Auto-tracked & ingested via Gmail agent'],
        aqs_risks: [],
        recommended_action: 'apply',
        resumeVersion: 'backend_resume.pdf'
      };

      const { error: insertErr } = await supabase
        .from('jobs')
        .insert([newJob]);
      
      if (insertErr) throw insertErr;
      console.log(`💼 [Database] Ingested new manual application: [${title}] at [${company}] as [${newStatus}]`);
    }
  } catch (err) {
    console.error("❌ Database synchronization error:", err.message);
  }
}

async function startEmailListener() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('⚠️ Email credentials not set in .env, skipping IMAP listener...');
    return;
  }

  try {
    const connection = await imaps.connect(imapConfig);
    console.log('📧 [IMAP] Connected successfully to Gmail inbox');
    await connection.openBox('INBOX');

    // Poll for new emails every 1 minute
    console.log('👀 [IMAP] Monitoring unseen emails in real-time...');
    
    setInterval(async () => {
      try {
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };
        
        const results = await connection.search(searchCriteria, fetchOptions);
        
        if (results && results.length > 0) {
          for (let item of results) {
            const uid = item.attributes.uid;
            
            // Skip already processed emails in cache to avoid double notifications
            if (processedUIDs.has(uid)) continue;

            const headerPart = item.parts.find(p => p.which === 'HEADER');
            const textPart = item.parts.find(p => p.which === 'TEXT');
            
            const header = headerPart ? headerPart.body : {};
            const subject = (header.subject && header.subject[0]) || 'No Subject';
            const from = (header.from && header.from[0]) || 'Unknown Sender';
            let body = textPart ? textPart.body : '';
            
            if (body) {
              // Strip HTML tags and simplify whitespace for cleaner analysis
              body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
            }

            console.log(`\n📨 [Email] Unseen message caught: "${subject}" from [${from}]`);

            // Evaluate email using Gemini AI
            const analysis = await evaluateEmailWithAI(from, subject, body);

            if (analysis && analysis.is_job_related) {
              console.log(`   🎯 Match detected! Company: ${analysis.company_name} | Category: ${analysis.category}`);
              
              // 1. Sync status or ingest manual job to Supabase
              await syncEmailToDatabase(analysis, from);

              // 2. Dispatch WhatsApp Notification to Laila
              await notifyLaila(analysis.whatsapp_summary);
            } else {
              console.log(`   ⏭️ Email not job-related, skipping.`);
            }

            // Mark as processed in local cache
            processedUIDs.add(uid);
            saveProcessedUIDs();
          }
        }
      } catch (pollErr) {
        console.error("❌ Error during email polling interval:", pollErr.message);
      }
    }, 60 * 1000); // Poll every 60 seconds for higher responsiveness

  } catch (err) {
    console.error('❌ Failed to establish IMAP email listener:', err.message);
  }
}

// Start everything
console.log('🚀 Initializing Job Search Autonomous Agent...');
waClient.initialize();
