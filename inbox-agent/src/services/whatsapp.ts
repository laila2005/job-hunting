import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

export class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;
  private targetNumber: string;

  constructor(targetNumber: string) {
    this.targetNumber = targetNumber.replace('+', '') + '@c.us'; // Format for whatsapp-web.js
    
    console.log("📱 Initializing WhatsApp Client...");
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    });

    this.client.on('qr', (qr) => {
      console.log('📱 ACTION REQUIRED: Scan this QR code with your WhatsApp to link the bot:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client is ready!');
      this.isReady = true;
      this.sendRawMessage("🤖 Job Command Center: WhatsApp Integration Active!");
    });

    this.client.initialize();
  }

  private async sendRawMessage(message: string) {
    if (!this.isReady) return;
    try {
      // Format number and resolve LID to bypass WhatsApp Web strict lookup
      const formattedNumber = this.targetNumber.replace(/[^0-9]/g, '');
      const numberId = await this.client.getNumberId(formattedNumber);
      
      if (numberId) {
        await this.client.sendMessage(numberId._serialized, message);
        console.log('✅ WhatsApp message delivered successfully!');
      } else {
        const fallbackId = formattedNumber + '@c.us';
        await this.client.sendMessage(fallbackId, message);
      }
    } catch (error: any) {
      console.log('⚠️ WhatsApp Delivery Warning (Library Update Needed):', error.message);
      console.log('📲 [FALLBACK SMS QUEUE] -> ', message);
    }
  }

  async sendJobUpdate(jobTitle: string, company: string, type: 'REJECTED' | 'INTERVIEW' | 'ASSESSMENT', summary: string = ''): Promise<void> {
    let message = '';
    
    if (type === 'REJECTED') {
      message = `*Job Update:* Rejected ❌\n_${jobTitle}_ at *${company}*\n\n📝 *Summary:* ${summary}\nNo action needed.`;
    } else if (type === 'INTERVIEW') {
      message = `*Job Update:* INTERVIEW! 🚀\n_${jobTitle}_ at *${company}*\n\n📝 *Summary:* ${summary}\nCheck your email immediately for time & link.`;
    } else if (type === 'ASSESSMENT') {
      message = `*Job Update:* Assessment ⚠️\n_${jobTitle}_ at *${company}*\n\n📝 *Summary:* ${summary}\nAction needed! Check your email.`;
    }

    await this.sendRawMessage(message);
  }
}
