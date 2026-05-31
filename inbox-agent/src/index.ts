import dotenv from 'dotenv';
import cron from 'node-cron';
import { GmailService } from './services/gmail';
import { EmailClassifier } from './services/classifier';
import { DatabaseService } from './services/supabase';
import { WhatsAppService } from './services/whatsapp';

dotenv.config();

async function startMicroservice() {
  console.log("🚀 Starting Email -> WhatsApp Microservice...");

  // Initialize Services
  const dbService = new DatabaseService(
    process.env.SUPABASE_URL || '', 
    process.env.SUPABASE_KEY || ''
  );
  
  const classifier = new EmailClassifier(process.env.GEMINI_API_KEY);
  
  const whatsapp = new WhatsAppService(process.env.WHATSAPP_MY_NUMBER || '+1234567890');
  
  const gmail = new GmailService();
  
  try {
    // Attempt Gmail auth (will prompt if token.json is missing)
    // await gmail.initialize();
    console.log("ℹ️ Skipping direct Gmail init in sandbox to prevent blocking on OAuth popup.");
  } catch (e) {
    console.error("Gmail init failed:", e);
  }

  // Define the Orchestration Loop
  const processInbox = async () => {
    console.log("\n📥 [Cron] Checking inbox for job updates...");
    try {
      // In a real scenario, we'd call gmail.fetchNewJobEmails() here.
      // For demonstration, we'll simulate an incoming email if none are found.
      const mockEmails = [
        {
          msgId: 'mock-1',
          threadId: 'th-1',
          subject: 'Interview Invitation: Software Engineer at Instabug',
          body: 'Hi Laila, we reviewed your resume and would love to schedule a call for next steps. Please use this calendly link to book your interview!',
          senderName: 'Instabug HR',
          companyName: 'Instabug'
        }
      ];

      for (const email of mockEmails) {
        console.log(`Processing email from ${email.companyName}: ${email.subject}`);
        
        // 1. Classify
        const classification = await classifier.classifyEmail(email.subject, email.body);
        console.log(`   └ Classification: [${classification.status}] - ${classification.summary}`);
        
        // 2. Update Database
        const statusChanged = await dbService.updateApplicationFromEmail(email.companyName, classification);
        
        // 3. Notify
        if (statusChanged && classification.status !== 'RECEIPT') {
          console.log("   └ 🔔 Status changed! Dispatching WhatsApp notification...");
          // We don't have job title from email reliably without LLM extraction, so we pass a generic string or extract it
          await whatsapp.sendJobUpdate('Software Engineer', email.companyName, classification.status as any, classification.summary);
        }

        // 4. Mark Read (Idempotency)
        // await gmail.markAsRead(email.msgId);
      }
    } catch (error) {
      console.error("Worker Error:", error);
    }
  };

  // Run the loop every 5 minutes
  cron.schedule('*/5 * * * *', processInbox);
  console.log("⏱️ Cron job scheduled. Waiting for next tick...");
  
  // Run once immediately for testing
  processInbox();
}

startMicroservice();
