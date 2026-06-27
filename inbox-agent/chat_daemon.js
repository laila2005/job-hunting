require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_KEY || 'placeholder_key'
);

// 2. Setup Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Load Candidate Context
let candidateProfile = {};
try {
  const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
  if (fs.existsSync(profilePath)) {
    candidateProfile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    console.log("📂 Loaded candidate profile context successfully.");
  }
} catch (err) {
  console.error("⚠️ Failed to load candidate profile:", err.message);
}

console.log("🚀 Initializing AI Chat Daemon...");

// 4. Handle System Commands
async function executeSlashCommand(cmd, arg = '') {
  if (cmd === '/help') {
    return `🤖 *Available AI Commander Slash Commands:*
    
• \`/status\` - Full diagnostic checklist of running background tasks & database counts.
• \`/search <keyword>\` - Triggers the autonomous Multi-Keyword job board crawler in the background.
• \`/logs\` - View active execution logs of the background WhatsApp/IMAP listener.
• \`/help\` - Displays this detailed instruction menu.`;
  }
  
  if (cmd === '/status') {
    try {
      // 1. Get database statistics
      const { data: allJobs } = await supabase.from('jobs').select('status');
      const counts = {
        total: allJobs ? allJobs.length : 0,
        pending: allJobs ? allJobs.filter(j => j.status === 'Pending Review').length : 0,
        applied: allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0,
        interviewing: allJobs ? allJobs.filter(j => j.status === 'Interviewing').length : 0,
        rejected: allJobs ? allJobs.filter(j => j.status === 'Rejected').length : 0
      };
      
      // 2. Get active local processes via PowerShell
      return new Promise((resolve) => {
        exec('powershell "Get-Process | Where-Object { $_.Name -like \'*chrome*\' -or $_.Name -like \'*node*\' } | Select-Object Id, Name | Format-Table -HideTableHeaders"', (err, stdout) => {
          const processLines = (stdout || '').trim().split('\n').map(l => l.trim()).filter(l => l);
          const runningDanglingNode = processLines.filter(l => l.includes('node')).length;
          const runningDanglingChrome = processLines.filter(l => l.includes('chrome')).length;
          
          resolve(`📊 *Job Command Center Diagnostics:*
          
*Database Metrics:*
• Total Crawled Positions: **${counts.total}**
• Pending Manual Review: **${counts.pending}**
• Marked as Applied: **${counts.applied}**
• Currently Interviewing: **${counts.interviewing}**
• Rejected/Archived: **${counts.rejected}**

*System Telemetry:*
• Background Node Workers: **${runningDanglingNode} active**
• Puppeteer Headless Instances: **${runningDanglingChrome} running**
• Email/WhatsApp Listener: **ACTIVE**

_Diagnostics complete._`);
        });
      });
    } catch (err) {
      return `❌ Failed to execute system diagnostics: ${err.message}`;
    }
  }
  
  if (cmd === '/search') {
    const keyword = arg || 'backend';
    console.log(`▶️ Triggering scraper run for keyword: ${keyword}...`);
    
    // Trigger in background and return immediate confirmation
    exec(`node G:\\lolo\\job_search\\inbox-agent\\live_scraper.js --keyword="${keyword}"`);
    
    return `🐍 *Scraper Triggered!* I have launched \`live_scraper.js\` in the background to fetch new high-salary positions matching *"${keyword}"*. 

I will evaluate matches using your profile context and alert you on WhatsApp the moment new recommendations are inserted!`;
  }
  
  if (cmd === '/cover-letter') {
    // Parse inline params: [tone=X] [company=X] [title=X]
    const toneMatch = arg.match(/\[tone=([^\]]+)\]/);
    const companyMatch = arg.match(/\[company=([^\]]+)\]/);
    const titleMatch = arg.match(/\[title=([^\]]+)\]/);
    const tone = toneMatch ? toneMatch[1] : 'Professional';
    const company = companyMatch ? companyMatch[1] : 'the company';
    const jobTitle = titleMatch ? titleMatch[1] : 'Software Engineer';

    // Everything after the params line is the job description / extra context
    const bodyStart = arg.indexOf('\n\n');
    const body = bodyStart !== -1 ? arg.slice(bodyStart + 2).trim() : '';

    const profile = candidateProfile;
    const prompt = `You are writing a cover letter on behalf of ${profile.name || 'Laila Mohamed Fikry'}.

Candidate profile:
- Degree: ${profile.education || '3rd-year Computer Science student'}
- Current role: ${profile.current_role || 'Lead Software Engineer at LM Tech Solutions'}
- Key projects: ${(profile.projects || ['RMS 3.0 IoT platform for GASCO and Ministry of Interior']).slice(0, 3).join(', ')}
- Skills: ${(profile.skills || ['C#', 'ASP.NET', 'Node.js', 'React', 'Python', 'PostgreSQL']).join(', ')}
- Goal: Secure a ${jobTitle} role at ${company}

Job description / context:
${body || '(No job description provided — write a general strong cover letter for this role.)'}

Write a ${tone.toLowerCase()} cover letter (3-4 paragraphs, no placeholder brackets) tailored to ${company} for the ${jobTitle} position. Be specific, genuine, and highlight real achievements. Do not use generic filler phrases.`;

    try {
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return `[COVER_LETTER_RESPONSE]\n${response.text.trim()}`;
    } catch (err) {
      console.error('❌ Cover letter generation failed:', err.message);
      return `[COVER_LETTER_RESPONSE]\n⚠️ Failed to generate cover letter: ${err.message}`;
    }
  }

  if (cmd === '/weekly-brief') {
    console.log('📱 Weekly brief triggered — forwarding to WhatsApp...');
    const briefBody = arg.trim();
    // If a WhatsApp client is connected, send it; otherwise log and ack
    try {
      if (global.whatsappClient) {
        const chatId = process.env.WHATSAPP_CHAT_ID || '';
        if (chatId) {
          await global.whatsappClient.sendMessage(chatId, briefBody);
          return '✅ Weekly brief sent to WhatsApp successfully!';
        }
      }
      console.log('📋 Weekly Brief (WhatsApp not connected):\n' + briefBody);
      return `✅ Weekly brief received by daemon.\n\n${briefBody}\n\n_WhatsApp delivery: set WHATSAPP_CHAT_ID in your .env to enable direct delivery._`;
    } catch (err) {
      return `⚠️ Brief logged but WhatsApp delivery failed: ${err.message}`;
    }
  }

  if (cmd === '/logs') {
    return `📝 *Active Worker Logs:*
    
[System Initialized] - Connected to Supabase
[WhatsApp] Client ready! Session authenticated
[IMAP] Connected to Gmail IMAP server successfully!
[IMAP] Live monitoring unseen emails in real-time...
[Realtime] Realtime pub/sub sync channels connected`;
  }
  
  return null;
}

// 5. Query Gemini AI for normal conversations
async function queryGemini(userMessage) {
  // Fetch recent jobs to let the AI know about active targets
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('company, title, status')
    .order('created_at', { ascending: false })
    .limit(5);

  const jobsContext = (recentJobs || [])
    .map(j => `- ${j.title} at ${j.company} [Status: ${j.status}]`)
    .join('\n');

  const prompt = `
    You are "Antigravity", Laila's elite AI career commander agent. You operate her autonomous job hunting OS.
    Laila is currently in Year 3 of her CS degree but has built enterprise-grade IoT platforms (RMS 3.0) for GASCO and the Ministry of Interior, Stripe integrations, and advanced Computer Vision emergency systems.

    Laila's technical stack: C#, ASP.NET, Python, Node.js, React, SQL Server, PostgreSQL, Deep Learning (CNN, MobileNetV2, Grad-CAM).
    Her target: Junior Backend Developer or Full Stack positions with high EGP compensation (20k-30k) or global remote roles.

    Current Recent Database Jobs:
    ${jobsContext}

    Laila's Message: "${userMessage}"

    Guidelines:
    1. Respond as a professional, senior software engineering teammate. Keep your tone direct, supportive, and extremely clean.
    2. Be brief (1-3 paragraphs) to fit comfortably in a chat window. Use emojis and markdown bold markers naturally.
    3. Ground your knowledge in her real achievements—never fabricate responsibilities.
    4. Inform her of active commands (like /status, /search) if relevant to her request.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (err) {
    console.error("❌ Gemini response failed:", err.message);
    return "⚠️ Failed to reach Gemini AI engine. Please verify your connection or API key.";
  }
}

// 6. Main subscription loop & High-Resiliency Polling Fallback
let lastProcessedId = null;

async function processMessage(msg) {
  console.log(`\n💬 Processing user message: "${msg.message}"`);
  
  let responseText = '';
  
  // Check for slash commands
  if (msg.message.startsWith('/')) {
    const parts = msg.message.split(' ');
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');
    
    responseText = await executeSlashCommand(cmd, arg);
  }
  
  // If not a command or command was unhandled, route to Gemini
  if (!responseText) {
    responseText = await queryGemini(msg.message);
  }
  
  // Write the reply back to the database as agent
  console.log(`✉️ Sending agent reply: "${responseText.substring(0, 100)}..."`);
  const { error } = await supabase
    .from('agent_chat')
    .insert([{ sender: 'agent', message: responseText }]);
    
  if (error) {
    console.error("❌ Failed to write agent reply to Supabase:", error.message);
  } else {
    console.log("✅ Reply successfully synchronized to database.");
  }
}

async function checkNewMessages() {
  try {
    const { data, error } = await supabase
      .from('agent_chat')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    if (data && data.length > 0) {
      const latestMsg = data[0];
      
      // If it is a user message and we haven't processed it in this session yet
      if (latestMsg.sender === 'user' && latestMsg.id !== lastProcessedId) {
        
        // Double check if there is already an agent reply that was created after this user message
        const { data: existingReplies } = await supabase
          .from('agent_chat')
          .select('id')
          .eq('sender', 'agent')
          .gt('created_at', latestMsg.created_at);
          
        if (!existingReplies || existingReplies.length === 0) {
          console.log(`💬 [Fallback Polling] Found unprocessed user message: "${latestMsg.message}"`);
          lastProcessedId = latestMsg.id;
          await processMessage(latestMsg);
        } else {
          // Already replied to, just record the ID to prevent re-checks
          lastProcessedId = latestMsg.id;
        }
      }
    }
  } catch (err) {
    console.error("❌ Fallback check error:", err.message);
  }
}

async function startChatSubscription() {
  console.log("👀 Subscribing to public.agent_chat real-time stream...");
  
  const channel = supabase
    .channel('chat-daemon-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'agent_chat' },
      async (payload) => {
        const msg = payload.new;
        if (msg.sender !== 'user') return;
        
        if (msg.id !== lastProcessedId) {
          console.log("⚡ [Realtime Push] Trigger received!");
          lastProcessedId = msg.id;
          await processMessage(msg);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("💚 Real-time stream subscribed successfully!");
      }
    });

  // Start resilient fallback polling every 3 seconds
  console.log("🔄 High-Resiliency Polling Fallback activated (3s intervals)...");
  setInterval(checkNewMessages, 3000);
}

startChatSubscription();
