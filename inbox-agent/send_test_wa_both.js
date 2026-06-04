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
  console.log('✅ [WhatsApp] Client is ready! Preparing test messages...');
  
  const numbers = [
    '201147656669', // New number
    '201210212792',  // Profile number
    '201210212792'
  ];
  
  const uniqueNumbers = [...new Set(numbers)];
  
  const message = `👋 *Hello Laila!*\n\nThis is a live test from your *Job Search Command Center* AI Agent! 🚀\n\nYour WhatsApp notification integration is fully active and working perfectly! I have also successfully generated your *Junior Back-End Developer* cover letter for *Analyticsmart* as a premium Word (.docx) document.\n\nLet's land that dream job! 💼✨`;
  
  for (let num of uniqueNumbers) {
    try {
      console.log(`✉️ Sending test message to [${num}]...`);
      const numberId = await waClient.getNumberId(num);
      const chatId = numberId ? numberId._serialized : `${num}@c.us`;
      
      await waClient.sendMessage(chatId, message);
      console.log(`✅ Message successfully delivered to ${num}!`);
    } catch (err) {
      console.error(`❌ Failed to send message to ${num}:`, err.message);
    }
  }
  
  console.log("🔌 Disconnecting WhatsApp client...");
  await waClient.destroy();
  console.log("👋 Done!");
  process.exit(0);
});

waClient.on('auth_failure', (msg) => {
  console.error('❌ [WhatsApp] Authentication failure:', msg);
  process.exit(1);
});

console.log("📱 Connecting to WhatsApp Web using saved session...");
waClient.initialize();
