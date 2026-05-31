import fs from 'fs/promises';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export interface ParsedEmail {
  msgId: string;
  threadId: string;
  subject: string;
  body: string;
  senderName: string;
  companyName: string;
}

export class GmailService {
  private gmail: gmail_v1.Gmail | null = null;

  async initialize(): Promise<void> {
    const client = await this.authorize();
    this.gmail = google.gmail({ version: 'v1', auth: client });
    console.log("📧 Gmail Service Authenticated.");
  }

  private async loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
    try {
      const content = await fs.readFile(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials) as OAuth2Client;
    } catch (err) {
      return null;
    }
  }

  private async saveCredentials(client: OAuth2Client): Promise<void> {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }

  private async authorize(): Promise<OAuth2Client> {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) return client;

    console.log("⚠️ No Gmail token found. Need to authenticate...");
    try {
      const authClient = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });
      if (authClient && authClient.credentials) {
        await this.saveCredentials(authClient as unknown as OAuth2Client);
      }
      return authClient as unknown as OAuth2Client;
    } catch (e) {
      console.error("❌ Failed to authenticate Gmail. Make sure credentials.json exists.");
      throw e;
    }
  }

  async fetchNewJobEmails(): Promise<ParsedEmail[]> {
    if (!this.gmail) throw new Error("Gmail not initialized");

    const query = `is:unread (from:careers OR from:jobs OR from:no-reply OR from:talent OR from:hr) (interview OR application OR opportunity OR status OR update)`;
    
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    const parsedEmails: ParsedEmail[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;
      
      const fullMsg = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = fullMsg.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      
      // Attempt to extract company name from the sender (e.g., "HR at Acme Corp <hr@acme.com>")
      let companyName = from;
      const match = from.match(/@([a-zA-Z0-9.-]+)\./);
      if (match) companyName = match[1]; // extremely basic heuristic

      // Extract body snippet
      const body = fullMsg.data.snippet || '';

      parsedEmails.push({
        msgId: msg.id,
        threadId: msg.threadId || msg.id,
        subject,
        body,
        senderName: from,
        companyName
      });
    }

    return parsedEmails;
  }

  async markAsRead(msgId: string): Promise<void> {
    if (!this.gmail) return;
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: msgId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }
}
