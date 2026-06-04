require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

const waClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

waClient.on('ready', async () => {
  console.log('✅ WhatsApp Web connected for number verification!');
  
  const numbers = [
    '201147656669', // New number
    '201210212792', // Profile number
    '1210212792',
    '1147656669'
  ];
  
  for (let num of numbers) {
    try {
      const id = await waClient.getNumberId(num);
      console.log(`📱 Number [${num}]:`, id ? `VALID (${id._serialized})` : 'INVALID / NOT ON WHATSAPP');
    } catch (err) {
      console.error(`❌ Error verifying [${num}]:`, err.message);
    }
  }
  
  await waClient.destroy();
  process.exit(0);
});

waClient.initialize();
