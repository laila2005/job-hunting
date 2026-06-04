require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');

console.log("🚀 Initializing WhatsApp client to send attachment...");

const waClient = new Client({
  authStrategy: new LocalAuth(),
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

waClient.on('ready', async () => {
  console.log('✅ [WhatsApp] Client is ready! Reading cover letter file...');
  
  try {
    const docPath = "G:\\\\lolo\\\\job_search\\\\resumes\\\\Laila_Mohamed_Fikry_Cover_Letter_Analyticsmart.docx";
    
    console.log(`📂 Preparing media attachment from: ${docPath}`);
    const media = MessageMedia.fromFilePath(docPath);
    
    const numbers = [
      '201147656669', // New number
      '201210212792'   // Profile number
    ];
    
    const uniqueNumbers = [...new Set(numbers)];
    
    for (let num of uniqueNumbers) {
      try {
        console.log(`✉️ Sending document to [${num}]...`);
        const numberId = await waClient.getNumberId(num);
        const chatId = numberId ? numberId._serialized : `${num}@c.us`;
        
        await waClient.sendMessage(chatId, media, {
          caption: "📄 *Analyticsmart Cover Letter* (One-Page .docx Format)"
        });
        console.log(`✅ Document successfully sent to ${num}!`);
      } catch (err) {
        console.error(`❌ Failed to send document to ${num}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Failed to prepare document media:', err.message);
  } finally {
    console.log("🔌 Disconnecting WhatsApp client...");
    await waClient.destroy();
    console.log("👋 Done!");
    process.exit(0);
  }
});

waClient.on('auth_failure', (msg) => {
  console.error('❌ [WhatsApp] Authentication failure:', msg);
  process.exit(1);
});

console.log("📱 Connecting to WhatsApp Web using saved session...");
waClient.initialize();
