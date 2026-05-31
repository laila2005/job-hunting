require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModels() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];
  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: 'reply "ok"',
      });
      console.log(`✅ ${model} works! Response:`, response.text());
    } catch (err) {
      console.log(`❌ ${model} failed:`, err.message);
    }
  }
}

testModels();
