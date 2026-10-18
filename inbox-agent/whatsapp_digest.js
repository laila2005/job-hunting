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

// Use a browser that is already installed (the Chrome bundled with puppeteer fails to start on some Windows setups).
const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
].filter(Boolean);
const executablePath = BROWSERS.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome, Edge or Brave found. Set CHROME_PATH in .env to your browser .exe');
  process.exit(1);
}
console.log(`Using browser: ${executablePath}`);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_digest' }), // its own session, so it never fights the main daemon
  puppeteer: { executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] },
});

client.on('qr', qr => {
  console.log('Scan this QR in WhatsApp > Linked devices:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  try {
    const id = await client.getNumberId(phone);
    const target = id ? id._serialized : `${phone}@c.us`;
    console.log(`Sending to ${target} ...`);
    const msg = await client.sendMessage(target, text);
    // Closing the browser right after sendMessage can leave the message undelivered, so wait for WhatsApp's confirmation.
    const acked = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 25000);
      client.on('message_ack', (m, ack) => {
        if (m.id._serialized === msg.id._serialized && ack >= 1) { clearTimeout(timer); resolve(true); }
      });
      if (msg.ack >= 1) { clearTimeout(timer); resolve(true); }
    });
    await new Promise(r => setTimeout(r, 5000)); // let it finish syncing
    console.log(acked ? `Digest delivered to ${phone}. Check "Message yourself" / your own chat.`
                      : `Digest sent to ${phone} but WhatsApp did not confirm delivery within 25s.`);
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
