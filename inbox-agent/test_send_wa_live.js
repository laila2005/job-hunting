require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log("🚀 Initializing test WhatsApp client...");

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
  console.log('✅ [WhatsApp] Client is ready! Preparing test message...');
  
  try {
    const rawNum = process.env.PHONE_NUMBER || '201147656669';
    const cleanedNum = rawNum.replace(/\D/g, ''); // strip spaces/pluses
    const chatId = `${cleanedNum}@c.us`;
    
    const message = `👋 *Hello Laila!*\n\nThis is a live test from your *Job Search Command Center* AI Agent! 🚀\n\nYour WhatsApp notification integration is fully active and working perfectly! I have also successfully generated your *Junior Back-End Developer* cover letter for *Analyticsmart* as a premium Word (.docx) document.\n\nLet's land that dream job! 💼✨`;
    
    // Resolve LID or use fallback
    const numberId = await waClient.getNumberId(cleanedNum);
    const targetChat = numberId ? numberId._serialized : chatId;
    
    await waClient.sendMessage(targetChat, message);
    console.log(`✉️ [WhatsApp] Test message successfully delivered to ${cleanedNum}!`);
  } catch (err) {
    console.error('❌ [WhatsApp] Failed to send test message:', err.message);
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
