require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateDynamicCoverLetter(companyName, jobTitle) {
  console.log(`\n📄 [Cover Letter Engine] Drafting dynamic letter for ${jobTitle} at ${companyName}...`);

  try {
    const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
    const profileStr = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '{}';

    const prompt = `
      You are an expert career coach writing a cover letter for a candidate.
      Candidate Profile: ${profileStr}
      Target Company: ${companyName}
      Target Role: ${jobTitle}
      
      Write a highly tailored, concise, 3-paragraph cover letter.
      Format it perfectly with line breaks. Do not include placeholders like [Date]. Just the letter text.
      Start with "Dear Hiring Manager,".
      Focus heavily on the candidate's backend engineering skills and unique passion.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let letterText = response.text.trim();
    
    // Create the PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Header
    page.drawText("Laila", { x: margin, y: height - margin, size: 24, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
    page.drawText("Junior Backend Engineer", { x: margin, y: height - margin - 20, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    
    page.drawLine({
      start: { x: margin, y: height - margin - 35 },
      end: { x: width - margin, y: height - margin - 35 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Body Text
    // Very simple text wrapping
    const words = letterText.split(' ');
    let line = '';
    let y = height - margin - 70;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const textWidth = font.widthOfTextAtSize(testLine, 11);
      
      if (textWidth > width - 2 * margin) {
        page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0, 0, 0) });
        line = words[i] + ' ';
        y -= 16; // line height
      } else if (words[i].includes('\n')) {
        const parts = words[i].split('\n');
        line += parts[0];
        page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0, 0, 0) });
        line = parts[1] + ' ';
        y -= 24; // paragraph break
      } else {
        line = testLine;
      }
    }
    page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0, 0, 0) });

    // Save PDF
    const safeCompany = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputPath = path.join(__dirname, `Cover_Letter_${safeCompany}.pdf`);
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`   ✅ [Cover Letter Engine] Saved perfectly tailored PDF to ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error(`   ❌ [Cover Letter Engine] Failed to generate:`, error.message);
    return null;
  }
}

module.exports = { generateDynamicCoverLetter };
