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
// SECURITY: send only plain text. Strip control characters and links, and cap the length.
const text = fs.readFileSync(DIGEST_FILE, 'utf8')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/https?:\/\/\S+|www\.\S+/gi, '[link removed]')
  .trim()
  .slice(0, 1800);

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
    // If the digest goes to the same number that is linked, use the account's own id (the "Message yourself" chat).
    const own = client.info && client.info.wid;
    let target;
    if (own && own.user === phone) {
      target = own._serialized;
    } else {
      const id = await client.getNumberId(phone);
      target = id ? id._serialized : `${phone}@c.us`;
    }
    console.log(`Linked account: ${own ? own.user : 'unknown'} | sending to ${target} ...`);
    let msg;
    try {
      msg = await client.sendMessage(target, text);
    } catch (err) {
      console.error('sendMessage threw:', err.message);
    }
    // Some WhatsApp Web versions return nothing from sendMessage even when the message is sent,
    // so never depend on the return value. Just give it time to deliver before closing the browser.
    if (msg && msg.id) {
      console.log('WhatsApp accepted the message (id ' + msg.id._serialized + ')');
    } else {
      console.log('sendMessage returned no message object; waiting to see if it was delivered anyway ...');
    }
    await new Promise(r => setTimeout(r, 12000));
    console.log(`Done. Check "Message yourself" / your chat with ${phone} on the phone.`);
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
