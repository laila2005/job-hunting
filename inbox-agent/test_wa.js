require('dotenv').config();
const { WhatsAppService } = require('./dist/services/whatsapp');

// Read your phone number from .env, or fallback to a dummy if not set
const myNumber = process.env.WHATSAPP_MY_NUMBER || '+1234567890';

console.log("🚀 Starting WhatsApp Test Script...");
const wa = new WhatsAppService(myNumber);

// It will take a few seconds to boot up Puppeteer and generate the QR code
// Once scanned, the 'ready' event inside WhatsAppService will fire
// and send the initial "Job Command Center: WhatsApp Integration Active!" message.

// We will also send a simulated Job Update 10 seconds after it's ready.
setTimeout(async () => {
    if (wa.isReady) {
        console.log("Sending simulated job update...");
        await wa.sendJobUpdate('Senior Backend Engineer', 'Google', 'INTERVIEW');
        console.log("✅ Message sent successfully!");
        process.exit(0);
    } else {
        console.log("Waiting for QR scan...");
    }
}, 20000); // Wait 20 seconds to give you time to scan
