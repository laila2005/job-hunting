import { GoogleGenAI } from '@google/genai';

export type StatusType = 'INTERVIEW' | 'REJECTED' | 'RECEIPT' | 'ASSESSMENT' | 'OTHER';

export interface Classification {
  status: StatusType;
  important: boolean;
  summary: string;
}

export class EmailClassifier {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("⚠️ No Gemini API key provided. Falling back to Regex only.");
    }
  }

  async classifyEmail(subject: string, textBody: string): Promise<Classification> {
    const content = `${subject}\n${textBody}`.toLowerCase();

    // 1. Fast Heuristics (Regex)
    if (content.match(/unfortunately|regret to inform|moving forward with other|not selected/)) {
      return { status: 'REJECTED', important: false, summary: 'Standard rejection.' };
    }
    if (content.match(/received your application|thank you for applying/)) {
      return { status: 'RECEIPT', important: false, summary: 'Application received.' };
    }

    // 2. LLM Fallback for Nuance
    if (!this.ai) {
      return { status: 'OTHER', important: false, summary: 'Could not classify (No LLM key)' };
    }

    const safeContent = this.anonymizeAndTruncate(content, 1500);
    return this.callLLMClassifier(safeContent);
  }

  private async callLLMClassifier(safeContent: string): Promise<Classification> {
    try {
      const prompt = `
      You are an expert HR email classifier.
      Analyze the following email from a company to a job applicant.
      Determine if it is an INTERVIEW invitation, an online ASSESSMENT/coding challenge, or OTHER.
      Return ONLY a valid JSON object matching this schema exactly, with no markdown code blocks:
      {
        "status": "INTERVIEW" | "ASSESSMENT" | "OTHER",
        "important": boolean,
        "summary": "1 line description"
      }
      
      Email Content:
      ${safeContent}
      `;

      const response = await this.ai!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(cleaned) as Classification;
      return result;
    } catch (e) {
      console.error("LLM Classification failed:", e);
      return { status: 'OTHER', important: false, summary: 'LLM Error' };
    }
  }

  private anonymizeAndTruncate(text: string, limit: number): string {
    return text
      .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/ig, '[EMAIL]')
      .substring(0, limit);
  }
}
