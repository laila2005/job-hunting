const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log("Starting test client...");
const client = new Client({
  authStrategy: new LocalAuth(),
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

client.on('qr', (qr) => {
  console.log("QR Code received successfully!");
  qrcode.generate(qr, { small: true });
  process.exit(0);
});

client.on('ready', () => {
  console.log("Client is ready!");
  process.exit(0);
});

client.on('auth_failure', (msg) => {
  console.error("Auth failure:", msg);
  process.exit(1);
});

client.initialize().catch(err => {
  console.error("Initialization error:", err);
  process.exit(1);
});
