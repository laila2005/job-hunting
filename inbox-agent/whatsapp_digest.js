// Sends today's job-hunt digest to Laila's WhatsApp.
// The digest text is written by coaching/push_jobs_to_site.py into coaching/today.txt
// (do-first items, follow-ups due, deadlines this week, top 3 to apply, latest replies).
//
// One-time setup:  cd inbox-agent && npm install && node whatsapp_digest.js
//   -> a QR code prints in the terminal; scan it in WhatsApp > Linked devices. The session is saved in .wwebjs_digest.
// After that:      node whatsapp_digest.js   (sends the digest and exits)
//
// Env (optional, in .env): PHONE_NUMBER=201210212792   DIGEST_FILE=G:\job-finder\coaching\today.txt
require('dotenv').config();
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const DIGEST_FILE = process.env.DIGEST_FILE || 'G:\\job-finder\\coaching\\today.txt';
const phone = (process.env.PHONE_NUMBER || '201210212792').replace(/\D/g, '');

if (!fs.existsSync(DIGEST_FILE)) {
  console.error(`No digest at ${DIGEST_FILE}. Run: python -I G:\\job-finder\\coaching\\push_jobs_to_site.py`);
  process.exit(1);
}
const text = fs.readFileSync(DIGEST_FILE, 'utf8').trim();

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_digest' }), // its own session, so it never fights the main daemon
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] },
});

client.on('qr', qr => {
  console.log('Scan this QR in WhatsApp > Linked devices:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  try {
    const id = await client.getNumberId(phone);
    await client.sendMessage(id ? id._serialized : `${phone}@c.us`, text);
    console.log(`Digest sent to ${phone}`);
  } catch (err) {
    console.error('Failed to send digest:', err.message);
    process.exitCode = 1;
  } finally {
    await client.destroy();
    process.exit();
  }
});

client.on('auth_failure', msg => {
  console.error('WhatsApp auth failure:', msg);
  process.exit(1);
});

client.initialize();
