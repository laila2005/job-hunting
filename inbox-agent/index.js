require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const imaps = require('imap-simple');
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_KEY || 'placeholder_key'
);

// 2. Setup WhatsApp Client
const waClient = new Client({
  authStrategy: new LocalAuth() // Saves session so you don't scan QR every time
});

waClient.on('qr', (qr) => {
  console.log('📱 Scan this QR code with your WhatsApp to connect the Notification Bot:');
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  console.log('✅ WhatsApp Notification Client is ready!');
  startEmailListener();
});

// Function to send WhatsApp message to yourself
const notifyLaila = async (message) => {
  try {
    // Your phone number with country code, e.g., 201210212792@c.us
    const chatId = `${process.env.PHONE_NUMBER}@c.us`; 
    await waClient.sendMessage(chatId, message);
    console.log('Notification sent via WhatsApp');
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
  }
};

// 3. Setup IMAP Email Listener
const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};

async function startEmailListener() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('⚠️ Email credentials not set in .env, skipping IMAP listener...');
    return;
  }

  try {
    const connection = await imaps.connect(imapConfig);
    console.log('📧 Connected to Gmail via IMAP');
    await connection.openBox('INBOX');

    // Simple polling for new emails (every 5 minutes)
    setInterval(async () => {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = { bodies: ['HEADER'], markSeen: false };
      
      const results = await connection.search(searchCriteria, fetchOptions);
      if (results.length > 0) {
        for (let item of results) {
          const header = item.parts[0].body;
          const subject = header.subject[0];
          const from = header.from[0];
          
          console.log(`New Email: ${subject} From: ${from}`);
          
          // Basic keyword check
          if (subject.toLowerCase().includes('interview') || subject.toLowerCase().includes('next steps')) {
            await notifyLaila(`🚀 *Interview Alert!*\n\nYou received a new email from: ${from}\nSubject: ${subject}\n\nPlease check your inbox ASAP!`);
            
            // Mock Supabase Update
            // await supabase.from('jobs').update({ status: 'Interviewing' }).eq('company_email', from);
          } else if (subject.toLowerCase().includes('status of your application') || subject.toLowerCase().includes('unfortunately')) {
            await notifyLaila(`📋 *Application Update*\n\nYou received an update from: ${from}\nSubject: ${subject}`);
          }
        }
      }
    }, 5 * 60 * 1000); // 5 mins

  } catch (err) {
    console.error('IMAP Error:', err);
  }
}

// Start everything
console.log('Initializing Job Search Autonomous Agent...');
waClient.initialize();
