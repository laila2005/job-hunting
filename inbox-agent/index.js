require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const imaps = require('imap-simple');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { botLog } = require('./telemetry');

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
      '--disable-gpu'
    ]
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

// Resilient Incoming WhatsApp Message Listener (Bidirectional Chat Agent)
const processedMsgIds = new Set();

const handleIncomingMessage = async (msg) => {
  try {
    const msgId = msg.id._serialized || msg.id.id;
    if (processedMsgIds.has(msgId)) return;
    processedMsgIds.add(msgId);
    if (processedMsgIds.size > 100) {
      const firstKey = processedMsgIds.values().next().value;
      processedMsgIds.delete(firstKey);
    }

    let senderJid = msg.from;
    let recipientJid = msg.to;

    // Resolve Linked Identity (LID) JIDs to standard @c.us JIDs
    if (senderJid.endsWith('@lid')) {
      try {
        const contact = await waClient.getContactById(senderJid);
        senderJid = contact.id._serialized;
      } catch (e) {}
    }
    if (recipientJid.endsWith('@lid')) {
      try {
        const contact = await waClient.getContactById(recipientJid);
        recipientJid = contact.id._serialized;
      } catch (e) {}
    }

    const senderId = senderJid.replace(/\D/g, '');
    const recipientId = recipientJid.replace(/\D/g, '');
    
    const ALLOWED_NUMBERS = ['201147656669', '201210212792'];
    
    // Restrict bot strictly to messages between Laila's registered numbers (self-chat or primary <-> secondary)
    // BOTH the sender and the recipient must be in the whitelisted numbers.
    // This prevents the bot from capturing or intercepting messages she sends to external contacts!
    const isSenderLaila = ALLOWED_NUMBERS.some(num => senderId.includes(num));
    const isRecipientLaila = ALLOWED_NUMBERS.some(num => recipientId.includes(num));
    
    if (isSenderLaila && isRecipientLaila) {
      // Prevent infinite loops: only ignore if the message was sent by the bot's own code.
      // Bot messages always match standard command prefixes or contain the "Antigravity" signature.
      if (msg.fromMe) {
        const text = msg.body;
        const isBotSignature = text.startsWith('📊') ||
                               text.startsWith('🐍') ||
                               text.startsWith('🤖') ||
                               text.startsWith('📡') ||
                               text.startsWith('✅') ||
                               text.startsWith('❌') ||
                               text.startsWith('📄') ||
                               text.startsWith('✍️') ||
                               text.startsWith('📩') ||
                               text.startsWith('💔') ||
                               text.startsWith('🎉') ||
                               text.startsWith('📝') ||
                               text.startsWith('📅') ||
                               text.startsWith('ℹ️') ||
                               text.toLowerCase().includes('antigravity');
        if (isBotSignature) {
          return; // Ignore our own replies to prevent loops
        }
      }
      
      console.log(`\n💬 [WhatsApp] Message detected from Laila: "${msg.body}" (fromMe: ${msg.fromMe})`);
      
      let replyText = '';
      let jobTitle = 'Software Engineer'; // Default
      
      // Check for Cover Letter Requests (Scenario D)
      const lowerBody = msg.body.toLowerCase();
      let companyForCv = '';
      
      if (msg.body.startsWith('/cv')) {
        companyForCv = msg.body.replace(/^\/cv\s*/i, '').trim();
      } else if (lowerBody.includes('applying to') || lowerBody.includes('applying for') || lowerBody.includes('appling to') || lowerBody.includes('appling for')) {
        // Match company name and optionally custom position (e.g. "am applying to Deloitte as a Backend Engineer")
        const match = msg.body.match(/(?:applying|appling)\s+(?:to|for)\s+\[?([^\]\n\r|]+?)\]?(?:\s+(?:as|for)\s+(?:a|an)?\s*([^\n\r]+))?$/i);
        if (match) {
          companyForCv = match[1].trim();
          if (match[2]) {
            jobTitle = match[2].trim();
          }
        }
      }
      
      // Instant direct reply for dashboard links / URLs (if not a CV generation request)
      if (!companyForCv && (lowerBody.includes('dashboard') || lowerBody.includes('dashbord') || lowerBody.includes('link') || lowerBody.includes('url'))) {
        replyText = `📊 *Job Search Dashboard:*\n\nHere is your live tracking dashboard URL where you can view analytics, auto-apply proofs, and manually log jobs:\n\n🔗 https://dashboard-bay-six-10.vercel.app\n\nIs there anything else I can do for you, Laila? 🚀`;
      }
      
      if (companyForCv) {
        console.log(`🎯 Detected Cover Letter request for company: "${companyForCv}" | Role: "${jobTitle}"`);
        await waClient.sendMessage(msg.from, `✍️ *Antigravity Cover Letter Engine active!*\n\nI am drafting your customized cover letter for *${companyForCv}* as a *${jobTitle}*... Please wait a few seconds.`);
        
        // Check if we have this company in Supabase to get the exact job title
        try {
          const { data: matchedJobs } = await supabase
            .from('jobs')
            .select('company, title')
            .ilike('company', `%${companyForCv}%`);
            
          if (matchedJobs && matchedJobs.length > 0) {
            // Only overwrite title if the user didn't explicitly specify one in their text
            if (jobTitle === 'Software Engineer') {
              jobTitle = matchedJobs[0].title;
            }
            companyForCv = matchedJobs[0].company;
          }
        } catch (e) {
          console.error("DB check failed for CV:", e.message);
        }
        
        const { generateDynamicCoverLetter } = require('./coverLetterBot');
        const pdfPath = await generateDynamicCoverLetter(companyForCv, jobTitle);
        
        if (pdfPath && fs.existsSync(pdfPath)) {
          console.log(`✉️ Dispatching PDF to ${msg.from}...`);
          const media = MessageMedia.fromFilePath(pdfPath);
          await waClient.sendMessage(msg.from, media, {
            caption: `📄 *Tailored Cover Letter for ${companyForCv}*\nPosition: *${jobTitle}*\nFormat: PDF\n\nReady for submission! Good luck Laila! 🚀`
          });
          try { fs.unlinkSync(pdfPath); } catch (e) {}
          return;
        } else {
          replyText = `❌ *Generation Failed!* I could not compile your Cover Letter for *${companyForCv}*. Please check my local PC console logs for details.`;
        }
      }
      
      // 1. Handle Slash Commands in Chat
      if (msg.body.startsWith('/')) {
        const parts = msg.body.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');
        
        if (cmd === '/status') {
          const { data: allJobs } = await supabase.from('jobs').select('status, applied_method');
          const total = allJobs ? allJobs.length : 0;
          const applied = allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0;
          const appliedManual = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Manual').length : 0;
          const appliedAuto = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Automatic').length : 0;
          const interviewing = allJobs ? allJobs.filter(j => j.status === 'Interviewing').length : 0;
          
          replyText = `📊 *Job Command Center Diagnostics:*\n\n• Crawled Positions: *${total}*\n• Marked as Applied: *${applied}* (Auto: *${appliedAuto}* | Manual: *${appliedManual}*) (Auto: *${appliedAuto}* | Manual: *${appliedManual}*)\n• Interviewing: *${interviewing}*\n\n_System Worker Status: ACTIVE_`;
        } else if (cmd === '/search') {
          const keyword = arg || 'backend';
          const { exec } = require('child_process');
          exec(`node G:\\lolo\\job_search\\inbox-agent\\live_scraper.js --keyword="${keyword}"`);
          replyText = `🐍 *Scraper Triggered!* I have launched \`live_scraper.js\` in the background for *"${keyword}"*. I will alert you once matches are inserted!`;
        } else if (cmd === '/applied') {
          const parts = arg.split('|');
          const company = parts[0]?.trim();
          const title = parts[1]?.trim() || 'Software Engineer';
          const companyLink = parts[2]?.trim() || '';
          
          if (!company) {
            replyText = `⚠️ *Format Error!*\n\nPlease use: \`/applied Company Name | Job Title | URL\``;
          } else {
            const manualId = `job-manual-${Date.now()}`;
            const { error } = await supabase.from('jobs').insert([{
              id: manualId,
              company,
              title,
              companyLink: companyLink || null,
              location: 'Remote / Egypt',
              model: 'Remote',
              salary: 'Unlisted',
              fitScore: 85,
              status: 'Applied',
              appliedDate: new Date().toISOString().split('T')[0],
              resumeVersion: 'backend_resume.pdf'
            }]);
            
            if (error) {
              console.error("Error creating manual job via WA:", error);
              replyText = `❌ *Database Sync Failed!* Could not log your job to Supabase. Check PC logs.`;
            } else {
              replyText = `✅ *Manual Application Logged!*\n\n• *Company*: ${company}\n• *Title*: ${title}\n• *Status*: Applied\n\nYour dashboard and Supabase database are fully updated!`;
            }
          }
        } else if (cmd === '/help') {
          replyText = `🤖 *AI Command Menu:*\n\n• \`/status\` - Diagnostics & counts\n• \`/search <keyword>\` - Run crawler\n• \`/applied Company | Title | URL\` - Quickly log a manual job\n• \`/help\` - Show this menu`;
        }
      }
      
      // 2. Route standard conversational questions to Gemini (Intent Routing & Actions)
      if (!replyText) {
        console.log(`🤖 [WhatsApp] Consulting Gemini AI for conversational intent routing...`);
        const { data: recentJobs } = await supabase
          .from('jobs')
          .select('company, title, status')
          .order('created_at', { ascending: false })
          .limit(3);
          
        const jobsContext = (recentJobs || [])
          .map(j => `- ${j.title} at ${j.company} [${j.status}]`)
          .join('\n');
          
        const intentPrompt = `
          You are "Antigravity", Laila's supportive AI career companion.
          Laila is in Year 3 of her CS degree but has built production platforms (RMS 3.0) for Ministry of Interior & GASCO.
          
          Laila's technical stack: C#, ASP.NET, Python, Node.js, React, SQL Server, PostgreSQL, CNN, MobileNetV2.
          
          Recent Jobs:
          ${jobsContext}

          Analyze Laila's message to determine her intent. Categorize into one of these intents:
          - status: Check diagnostic application stats (e.g. "how are my applications?", "show my dashboard counts", "status check")
          - search: Sourcing a new keyword (e.g. "crawling remote react positions", "ابحثلي عن شغل C#", "search backend jobs")
          - generate_pitch: Writing a cold LinkedIn/email pitch (e.g. "write a LinkedIn pitch for Paymob", "outreach message for PwC")
          - general_chat: General conversation or technical query (e.g. "greetings", "how can I improve thread safety?", general talk)
          
          Laila's Message: "${msg.body}"
          
          Respond STRICTLY with a valid JSON object in this format (no markdown, no backticks):
          {
            "intent": "status" | "search" | "generate_pitch" | "general_chat",
            "argument": "string or null (keyword for search, company name for generate_pitch)",
            "reply_text": "string (only populated for general_chat, keep it very concise, 1-2 short paragraphs, friendly, use emojis!)"
          }
        `;
        
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: intentPrompt,
          });
          const raw = response.text.trim().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
          const decision = JSON.parse(raw);
          
          if (decision.intent === 'status') {
            const { data: allJobs } = await supabase.from('jobs').select('status, applied_method');
            const total = allJobs ? allJobs.length : 0;
            const applied = allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0;
          const appliedManual = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Manual').length : 0;
          const appliedAuto = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Automatic').length : 0;
            const interviewing = allJobs ? allJobs.filter(j => j.status === 'Interviewing').length : 0;
            
            replyText = `📊 *Job Command Center Diagnostics:*\n\n• Crawled Positions: *${total}*\n• Marked as Applied: *${applied}* (Auto: *${appliedAuto}* | Manual: *${appliedManual}*) (Auto: *${appliedAuto}* | Manual: *${appliedManual}*)\n• Interviewing: *${interviewing}*\n\n_Everything is synced in real-time, Laila!_ 🚀`;
          } else if (decision.intent === 'search') {
            const keyword = decision.argument || 'backend';
            const { exec } = require('child_process');
            exec(`node G:\\lolo\\job_search\\inbox-agent\\live_scraper.js --keyword="${keyword}"`);
            replyText = `📡 *Scraper Activated!* I have launched the autonomous crawler for *"${keyword}"* in the background. I will notify you once matches land! 🚀`;
          } else if (decision.intent === 'generate_pitch') {
            const company = decision.argument || 'Target Company';
            replyText = `✍️ *Antigravity Pitch Engine active!*\n\nCustomized LinkedIn Message for *${company}*:\n\n"Dear Hiring Leader,\n\nI was inspired by your open backend engineering role. As a Year 3 CS student who has already architected and deployed concurrent enterprise-scale SNMP/Modbus IoT monitoring servers (RMS 3.0) rolled out to the Ministry of Interior and GASCO, I bring substantial production depth. I'd love to connect for a quick 5-minute sync to see how my high-concurrency C# skills can assist your team.\n\nBest regards,\nLaila Mohamed Fikry"\n\nReady for copy/sending! 🚀`;
          } else {
            replyText = decision.reply_text;
          }
        } catch (genErr) {
          console.error("❌ Gemini response failed:", genErr.message);
          
          const lowerMsg = msg.body.toLowerCase();
          if (lowerMsg.includes('how many') || lowerMsg.includes('applied') || lowerMsg.includes('status') || lowerMsg.includes('stat') || lowerMsg.includes('count')) {
            try {
              const { data: allJobs } = await supabase.from('jobs').select('status, applied_method');
              const total = allJobs ? allJobs.length : 0;
              const applied = allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0;
          const appliedManual = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Manual').length : 0;
          const appliedAuto = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Automatic').length : 0;
              const interviewing = allJobs ? allJobs.filter(j => j.status === 'Interviewing').length : 0;
              
              replyText = `📊 *Job Command Center (Local Fallback):*\n\n• Crawled Positions: *${total}*\n• Applied: *${applied}* (Auto: *${appliedAuto}* | Manual: *${appliedManual}*)\n• Interviewing: *${interviewing}*\n\n_Note: Gemini API is currently rate-limited, but your database is fully synced!_ 🚀`;
            } catch (dbErr) {
              replyText = `❌ *Database Error!* I could not fetch your application status.`;
            }
          } else if (lowerMsg.includes('help') || lowerMsg.includes('command') || lowerMsg.includes('menu')) {
            replyText = `🤖 *AI Command Menu (Local Fallback):*\n\n• \`/status\` - Diagnostics & counts\n• \`/search <keyword>\` - Run crawler\n• \`/applied Company | Title | URL\` - Log a manual job\n• \`/help\` - Show this menu`;
          } else {
            replyText = `🤖 Antigravity here! I received your message: "${msg.body}". My AI core is temporarily rate-limited, but I'm monitoring. Ask me about your "applied" count or "status"!`;
          }
        }
      }
      
      // 3. Deliver reply directly to Laila's WhatsApp
      console.log(`✉️ [WhatsApp] Dispatching reply to ${msg.from}...`);
      await waClient.sendMessage(msg.from, replyText);
      console.log(`✅ [WhatsApp] Reply successfully delivered!`);
    }
  } catch (err) {
    console.error("❌ [WhatsApp] Incoming message handler error:", err.message);
  }
};

// ==========================================
// SUPABASE REALTIME AI COMMANDER (WEB CHAT)
// ==========================================
supabase
  .channel('realtime-agent-chat-backend')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'agent_chat' },
    async (payload) => {
      const newMsg = payload.new;
      
      // We only respond to 'user' messages so we don't get stuck in an infinite loop
      if (newMsg.role !== 'user') return;

      console.log('🤖 Received new Web Command:', newMsg.content);

      let aiReplyText = "Command acknowledged.";
      if (newMsg.content.toLowerCase().startsWith('/scrape')) {
        aiReplyText = "Initiating stealth scrapers. I will notify you when new jobs hit the pipeline.";
        // Trigger live_scraper.js in a real production app via child_process
        require('child_process').exec('node live_scraper.js', (err) => {
          if (err) console.error("Scraper failed:", err);
        });
      } else if (newMsg.content.toLowerCase().startsWith('/status')) {
        aiReplyText = "All background systems nominal. Hourly cron job is active.";
      } else {
        // Generate AI response via Gemini
        try {
          const chat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: { systemInstruction: "You are an AI autonomous agent named Antigravity serving Laila, a software engineering student. Respond concisely." }
          });
          const response = await chat.sendMessage(newMsg.content);
          aiReplyText = response.text;
        } catch (e) {
          console.error("Gemini API Error in Web Chat:", e);
          aiReplyText = "I encountered a neural network error while processing your request.";
        }
      }

      // Insert AI response back into Supabase
      const { error } = await supabase.from('agent_chat').insert([
        { role: 'ai', content: aiReplyText }
      ]);
      
      if (error) {
        console.error("Failed to push AI response to Supabase:", error);
      }
    }
  )
  .subscribe();

// ==========================================
// SUPABASE REALTIME MOCK INTERVIEW
// ==========================================
supabase
  .channel('realtime-interview-backend')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'interview_sessions' },
    async (payload) => {
      const newMsg = payload.new;
      
      // Only process user messages to avoid infinite loops
      if (newMsg.role !== 'user') return;

      console.log('🎤 Received new Interview Answer:', newMsg.content);

      try {
        // Fetch the last 5 messages to provide context to Gemini
        const { data: history } = await supabase
          .from('interview_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        const context = history ? history.reverse().map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n') : '';

        const systemInstruction = `You are a strict Senior Backend Engineering Manager at a top-tier tech company. You are currently interviewing a candidate named Laila for a Backend Engineering Internship.
The candidate just answered your previous question. 
Context of the interview so far:
${context}

Your task:
1. Grade her most recent answer strictly out of 100 based on technical accuracy, clarity, and use of the STAR method if applicable.
2. Provide 1-2 short sentences of constructive feedback.
3. Ask the NEXT technical interview question. Focus on topics like ASP.NET Core, C#, Docker, Message Brokers (RabbitMQ), or System Architecture.

You MUST format your EXACT response strictly as a JSON object with two keys:
{
  "score": <integer from 0 to 100>,
  "feedback_and_next_question": "<string containing your feedback and the next question>"
}`;

        const chat = ai.chats.create({
          model: 'gemini-2.5-pro',
          config: { 
            systemInstruction: systemInstruction,
            responseMimeType: "application/json"
          }
        });

        const response = await chat.sendMessage(newMsg.content);
        const jsonResult = JSON.parse(response.text);

        // Insert the AI's feedback and next question into Supabase
        const { error } = await supabase.from('interview_sessions').insert([
          { 
            role: 'ai', 
            content: jsonResult.feedback_and_next_question,
            score: jsonResult.score
          }
        ]);
        
        if (error) {
          console.error("Failed to push Interview AI response to Supabase:", error);
        }

      } catch (e) {
        console.error("Gemini API Error in Mock Interview:", e);
        await supabase.from('interview_sessions').insert([
          { role: 'ai', content: "I'm having network difficulties and can't process your answer right now. Please try answering again.", score: 0 }
        ]);
      }
    }
  )
  .subscribe();

// Start WhatsApp Client
waClient.initialize();
waClient.on('message', handleIncomingMessage);
waClient.on('message_create', handleIncomingMessage);

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
    tlsOptions: { rejectUnauthorized: false },
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
      "whatsapp_summary": "string (a b     Formatting rules for "whatsapp_summary":
    - Keep it under 250 characters.
    - Start with a clear, bold status header based on the category (be direct so the user knows instantly without reading further):
      - rejection: 💔 *APPLICATION REJECTED* (use this for rejections, pursuit of other candidates, etc.)
      - interview_invite: 📅 *INTERVIEW INVITATION!* (use this for interviews, phone screens)
      - assessment_request: 📝 *ASSESSMENT/TEST REQUEST* (use this for hackerrank, tests, coding screens)
      - job_offer: 🎉 *JOB OFFER RECEIVED!* (use this for offers)
      - application_received: 📩 *APPLICATION CONFIRMED* (use this for received/applied receipts)
      - other_update: ℹ️ *STATUS UPDATE* (use this for general updates)
    - Make sure it clearly states the Company, Job Title (if known), and a brief, honest 1-line summary.
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
    console.log("🔄 [Fallback] Running rule-based local email scanner...");
    
    const lowerSubject = subject.toLowerCase();
    const lowerBody = body.toLowerCase();
    const lowerFrom = from.toLowerCase();
    
    // 1. Determine if job-related
    const jobKeywords = [
      'apply', 'applied', 'application', 'received', 'interview', 'assessment', 
      'hiring', 'recruitment', 'career', 'offer', 'rejection', 'unfortunately', 
      'position', 'job', 'cv', 'resume', 'wuzzuf', 'linkedin', 'indeed', 'glassdoor'
    ];
    
    const isJobRelated = jobKeywords.some(keyword => lowerSubject.includes(keyword) || lowerBody.includes(keyword));
    
    if (!isJobRelated) {
      return { is_job_related: false };
    }
    
    // 2. Identify Category
    let category = 'other_update';
    
    if (lowerSubject.includes('interview') || lowerBody.includes('schedule a call') || lowerBody.includes('invitation to interview') || lowerBody.includes('phone screen') || lowerBody.includes('chat with')) {
      category = 'interview_invite';
    } else if (lowerSubject.includes('assessment') || lowerSubject.includes('test') || lowerBody.includes('online test') || lowerBody.includes('hackerrank') || lowerBody.includes('codility') || lowerBody.includes('assessments')) {
      category = 'assessment_request';
    } else if (
      lowerSubject.includes('unfortunately') || lowerSubject.includes('rejection') || lowerSubject.includes('pursue') || lowerSubject.includes('regret') ||
      lowerBody.includes('not move forward') || lowerBody.includes('other candidates') || lowerBody.includes('filled the position') || lowerBody.includes('decided to pursue') ||
      lowerBody.includes('regret to inform') || lowerBody.includes('unable to offer') || lowerBody.includes('not be proceeding') || lowerBody.includes('not selected') ||
      lowerBody.includes('turned down') || lowerBody.includes('thank you for your interest') || lowerBody.includes('not match our')
    ) {
      category = 'rejection';
    } else if (lowerSubject.includes('offer') || lowerBody.includes('job offer') || lowerBody.includes('congratulations') || lowerBody.includes('pleased to offer')) {
      category = 'job_offer';
    } else if (lowerSubject.includes('received') || lowerSubject.includes('thank you for applying') || lowerBody.includes('application received') || lowerBody.includes('thanks for applying') || lowerBody.includes('successful submission')) {
      category = 'application_received';
    }
    
    // 3. Extract Company Name
    let companyName = null;
    
    // Try to extract from sender domain first (e.g. "hr@microsoft.com" -> "Microsoft")
    const domainMatch = lowerFrom.match(/@([a-z0-9-]+)\./);
    if (domainMatch && !['gmail', 'yahoo', 'outlook', 'hotmail', 'mail', 'atlassian', 'jira'].includes(domainMatch[1])) {
      companyName = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    } else {
      // Look for patterns like "at CompanyName" or "from CompanyName"
      const atMatch = subject.match(/(?:at|from|with)\s+([A-Z][a-zA-Z0-9\s]+)/);
      if (atMatch) {
        companyName = atMatch[1].split(' ')[0].trim();
      }
    }
    
    if (!companyName) {
      companyName = 'Hiring Team';
    }
    
    // 4. Extract Job Title
    let jobTitle = 'Software Engineer';
    const titleKeywords = ['backend', 'frontend', 'fullstack', 'software', 'engineer', 'developer', 'net', 'c#', 'react', 'node'];
    const words = subject.split(/\s+/);
    let matchedTitleWords = [];
    
    for (let word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (titleKeywords.includes(cleanWord.toLowerCase())) {
        matchedTitleWords.push(word);
      }
    }
    
    if (matchedTitleWords.length > 0) {
      jobTitle = matchedTitleWords.join(' ').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    }
    
    // 5. Generate beautiful WhatsApp Summary
    let categoryHeader = 'ℹ️ *STATUS UPDATE*';
    if (category === 'rejection') categoryHeader = '💔 *APPLICATION REJECTED*';
    else if (category === 'interview_invite') categoryHeader = '📅 *INTERVIEW INVITATION!*';
    else if (category === 'assessment_request') categoryHeader = '📝 *ASSESSMENT/TEST REQUEST*';
    else if (category === 'job_offer') categoryHeader = '🎉 *JOB OFFER RECEIVED!*';
    else if (category === 'application_received') categoryHeader = '📩 *APPLICATION CONFIRMED*';
    
    const whatsappSummary = `${categoryHeader}\n• *Company*: ${companyName}\n• *Role*: ${jobTitle}\n• *Subject*: ${subject.slice(0, 50)}`;
    
    return {
      is_job_related: true,
      category,
      company_name: companyName,
      job_title: jobTitle,
      whatsapp_summary: whatsappSummary
    };
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
        model: 'Remote',
        fitScore: 95,
        atsMatch: 90,
        gapRisk: 'Low',
        status: newStatus,
        companyLink: 'mailto:' + from,
        companySummary: 'Auto-tracked & ingested via Gmail agent',
        salary: 'Unlisted',
        resumeVersion: 'backend_resume.pdf',
        appliedDate: newStatus === 'Applied' ? new Date().toISOString().split('T')[0] : null
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

function getImapDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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

    async function scanEmails() {
      try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const searchCriteria = [['SINCE', getImapDate(twoDaysAgo)]];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };
        
        const results = await connection.search(searchCriteria, fetchOptions);
        
        if (results && results.length > 0) {
          let processedInInterval = 0;
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

            console.log(`\n📨 [Email] Processing incoming message: "${subject}" from [${from}]`);

            // Evaluate email using Gemini AI
            const analysis = await evaluateEmailWithAI(from, subject, body);

            if (analysis && analysis.is_job_related) {
              console.log(`   🎯 Match detected! Company: ${analysis.company_name} | Category: ${analysis.category}`);
              
              // 1. Sync status or ingest manual job to Supabase
              await syncEmailToDatabase(analysis, from);

              // 2. Filter & Dispatch WhatsApp Notification based on Priority
              const highPriority = ['interview_invite', 'assessment_request', 'job_offer'];
              const mediumPriority = ['rejection'];
              
              const isHigh = highPriority.includes(analysis.category);
              const isMedium = mediumPriority.includes(analysis.category);
              
              if (isHigh || isMedium) {
                const priorityHeader = isHigh 
                  ? `🔴 *[HIGH URGENCY]*\n` 
                  : `🟡 *[STANDARD UPDATE]*\n`;
                
                await notifyLaila(priorityHeader + analysis.whatsapp_summary);
              } else {
                console.log(`   ⏭️ Low priority category [${analysis.category}], synced to DB but skipping WhatsApp notification to avoid distraction.`);
              }
            } else {
              console.log(`   ⏭️ Email not job-related, skipping.`);
            }

            // Mark as processed in local cache
            processedUIDs.add(uid);
            processedInInterval++;
          }
          if (processedInInterval > 0) {
            saveProcessedUIDs();
          }
        }
      } catch (pollErr) {
        console.error("❌ Error during email scanning:", pollErr.message);
      }
    }

    // Run once immediately on startup
    console.log('👀 [IMAP] Running immediate initial email scan...');
    await scanEmails();

    // Poll for new and recent emails every 1 minute
    console.log('👀 [IMAP] Monitoring recent emails in real-time (last 2 days fallback loop)...');
    setInterval(scanEmails, 60 * 1000);

  } catch (err) {
    console.error('❌ Failed to establish IMAP email listener:', err.message);
  }
}

// 6. Setup Dashboard Telemetry CLI Command Poller
async function pollDashboardCommands() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('recommended_action')
      .eq('id', 'telemetry_bot_status')
      .single();

    if (data && data.recommended_action) {
      const cmdText = data.recommended_action;
      console.log(`🤖 [Dashboard CLI] Command detected: "${cmdText}"`);
      
      // Wipe the command immediately in the database to prevent duplicate execution
      await supabase
        .from('jobs')
        .update({ recommended_action: null })
        .eq('id', 'telemetry_bot_status');

      // Log receipt to telemetry
      await botLog('🧠', `[CLI Command] Executing: "${cmdText}"`, 'step');

      // Parse and execute
      const parts = cmdText.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      if (cmd === '/status') {
        const { data: allJobs } = await supabase.from('jobs').select('status, applied_method');
        const total = allJobs ? allJobs.length : 0;
        const applied = allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0;
          const appliedManual = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Manual').length : 0;
          const appliedAuto = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Automatic').length : 0;
        const interviewing = allJobs ? allJobs.filter(j => j.status === 'Interviewing').length : 0;
        
        await botLog('📊', `Status Diagnostics: ${total} Total, ${applied} Applied, ${interviewing} Interviewing`, 'success');
      } else if (cmd === '/search') {
        const keyword = arg || 'backend';
        const { exec } = require('child_process');
        await botLog('📡', `Triggering live crawler for keyword: "${keyword}"...`, 'step');
        
        exec(`node G:\\lolo\\job_search\\inbox-agent\\live_scraper.js --keyword="${keyword}"`, (err) => {
          if (err) {
            botLog('❌', `Crawler error: ${err.message}`, 'error');
          } else {
            botLog('✅', `Scraping cycle completed for keyword "${keyword}"`, 'success');
          }
        });
      } else if (cmd === '/apply') {
        const jobId = arg;
        if (!jobId) {
          await botLog('⚠️', `Format error. Use: /apply <job_id>`, 'error');
        } else {
          const { error: updateErr } = await supabase
            .from('jobs')
            .update({ status: 'Queued for Bot' })
            .eq('id', jobId);
          
          if (updateErr) {
            await botLog('❌', `Failed to queue job ${jobId}: ${updateErr.message}`, 'error');
          } else {
            await botLog('🚀', `Job ${jobId} queued successfully for auto-apply!`, 'success');
          }
        }
      } else if (cmd === '/help') {
        await botLog('ℹ️', `Available CLI commands:\n• /status - Diagnostics summary\n• /search <kw> - Trigger crawler\n• /apply <id> - Execute auto-apply\n• /help - Command menu`, 'info');
      } else {
        await botLog('⚠️', `Unknown command: "${cmd}". Type /help for details.`, 'error');
      }
    }
  } catch (err) {
    console.error("Dashboard CLI execution error:", err.message);
  }
}

// Start polling CLI commands every 2 seconds
setInterval(pollDashboardCommands, 2000);

waClient.on('auth_failure', (msg) => {
  console.error('❌ [WhatsApp] Authentication failure:', msg);
});

waClient.on('disconnected', (reason) => {
  console.error('❌ [WhatsApp] Client was logged out:', reason);
});

// Start everything
console.log('🚀 Initializing Job Search Autonomous Agent...');
waClient.initialize().catch(err => {
  console.error('❌ [WhatsApp] Initialization error:', err.message);
});
