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
      
      Write a highly tailored, sophisticated, 4-paragraph cover letter (roughly 350-400 words).
      Format it perfectly with line breaks. Do not include placeholders like [Date]. Just the letter text.
      Start with "Dear Hiring Manager,".
      Focus heavily on the candidate's backend engineering skills, real-world enterprise IoT database deployments for the Ministry of Interior/GASCO, and their unique project depth as a third-year CS student.
    `;

    let letterText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      letterText = response.text.trim();
    } catch (apiErr) {
      console.warn(`   ⚠️ Gemini API rate-limited or failed. Using highly calibrated local fallback Cover Letter template.`);
      
      const titleLower = jobTitle.toLowerCase();
      
      if (titleLower.includes('frontend') || titleLower.includes('front-end') || titleLower.includes('react')) {
        // Frontend Specialized Fallback
        letterText = `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. Currently in Year 3 of my Computer Science degree at El Sewedy University of Technology, I have already acquired substantial production-level frontend and full-stack experience. Having built and shipped highly interactive, responsive enterprise dashboards and client-facing web workflows, I am eager to bring my modern UI engineering depth and proactive drive to your engineering team.

As the Lead Software Engineer at LM Tech Solutions, I designed and developed the full-stack visual interface for the Remote Monitoring System (RMS 3.0). I engineered a highly responsive operational dashboard in React.js and Tailwind CSS that visualizes high-frequency industrial telemetry in real time. This system is actively used by NOC operators at major national enterprise clients, including the Egyptian Ministry of Interior (MOI) and GASCO, giving them instant visual alerts and performance analytics.

Additionally, as a Freelance Full Stack Developer at Media Gate Company, I optimized frontend media pipelines by integrating Bunny CDN and implementing custom scroll-aware video autoplay controllers. I also engineered the complete subscription administrative dashboard for bagijob.com, resolving complex persistent ad layouts and dark mode states. My frontend daily stack consists of React.js, Next.js, HTML5, CSS3, JavaScript, and Tailwind CSS, backed by solid C#/.NET and Python APIs.

I am strongly drawn to the high standards of user experience and engineering at ${companyName}. I possess fluent English communication skills, a deep appreciation for intuitive user interfaces, and complete readiness for remote, international collaboration. Thank you for your time, consideration, and the opportunity to discuss how my hands-on production depth can contribute immediate value to your team.

Sincerely,
Laila Mohamed Fikry`;

      } else if (titleLower.includes('fullstack') || titleLower.includes('full-stack') || titleLower.includes('full stack')) {
        // Fullstack Specialized Fallback
        letterText = `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. Currently in Year 3 of my Computer Science degree at El Sewedy University of Technology, I have already acquired substantial production-level full-stack engineering experience. Having owned systems end-to-end—from concurrent backend polling engines to responsive React interfaces—I am eager to bring my multi-tier technical depth and proactive drive to your engineering team.

As the Lead Software Engineer at LM Tech Solutions, I engineered the Remote Monitoring System (RMS 3.0), an industrial IoT platform. I built a concurrent ASP.NET data polling service to ingest real-time Modbus/SNMP telemetry and designed the SQL database. Simultaneously, I built the entire frontend dashboard in React.js and Tailwind CSS to visualize these live power metrics. This end-to-end platform is deployed in production for major national clients including the Egyptian Ministry of Interior (MOI) and GASCO.

Furthermore, as a Freelance Developer at Media Gate, I integrated Stripe API subscription workflows, built comprehensive admin reporting tools, and accelerated media delivery using Bunny CDN. My technical toolkit spans React.js, Tailwind CSS, C#, ASP.NET, Node.js, Python, PostgreSQL, and SQL Server. I am deeply comfortable working across the entire SDLC, managing version control via Git, and working in high-performance Agile/Scrum lifecycles.

I am strongly drawn to the collaborative engineering standards at ${companyName}. I possess fluent English communication skills, a highly structured approach to full-stack system design, and complete readiness for international, remote-first collaboration. Thank you for your time, consideration, and the opportunity to discuss how my hands-on production depth can contribute immediate value to your team.

Sincerely,
Laila Mohamed Fikry`;

      } else if (titleLower.includes('software') || titleLower.includes('softare') || titleLower.includes('developer') || titleLower.includes('engineer')) {
        // General Software Engineering Specialized Fallback
        letterText = `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. Currently in Year 3 of my Computer Science degree at El Sewedy University of Technology, I have already acquired substantial production-level software and systems engineering experience. Having built and shipped concurrent multi-threaded services, network communication systems, and state-level IoT architectures, I am eager to bring my technical depth and proactive drive to your engineering team.

As the Lead Software Engineer at LM Tech Solutions, I engineered the unified polling backend service for the Remote Monitoring System (RMS 3.0). I designed a fault-tolerant C# and ASP.NET multi-threaded server architecture capable of concurrent device ingestion across HTTP, Modbus, and SNMP protocols, and designed a robust relational database schema to handle high-frequency operational metrics in production for the Egyptian Ministry of Interior (MOI) and GASCO.

Complementing my professional background, I completed ALX Africa's rigorous 15-month Software Engineering Intensive program, building a solid foundation in low-level systems (C, C++), Linux environments, and multi-user TCP socket networks using AES-256 encryption. My technical toolkit consists of C#, ASP.NET, Node.js, Python, C/C++, PostgreSQL, and SQL Server. I am deeply comfortable working across the entire software development lifecycle (SDLC), managing complex git repositories, and working in Agile and Scrum pipelines.

I am strongly drawn to the high standards of engineering and collaborative culture at ${companyName}. I possess fluent English communication skills, a highly structured approach to object-oriented system design, and complete readiness for international, remote-first collaboration. Thank you for your time, consideration, and the opportunity to discuss how my hands-on production depth can contribute immediate value to your team.

Sincerely,
Laila Mohamed Fikry`;

      } else {
        // Backend Specialized Fallback (Default)
        letterText = `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}. Currently in Year 3 of my Computer Science degree at El Sewedy University of Technology, I have already acquired substantial production-level engineering experience that rivals many graduates. Having architected and shipped enterprise-grade systems for state-level and commercial operations, I am highly eager to bring my technical depth, analytical mindset, and proactive drive to your engineering team.

As the Lead Software Engineer at LM Tech Solutions, I architected the end-to-end backend for the Remote Monitoring System (RMS 3.0), an industrial IoT platform engineered for critical power infrastructure. I developed a fault-tolerant C# and ASP.NET unified polling service to ingest real-time telemetry across concurrent Modbus, HTTP, and SNMP protocols, and designed a robust database schema to handle high-frequency data streams. This system is successfully deployed in production for major national enterprise clients, including the Egyptian Ministry of Interior (MOI) and GASCO.

Beyond IoT systems, I have engineered full-stack AI and commercial platforms. I architected the "Inqaz-app" Egypt Emergency AI Response System—integrating real-time computer vision incident triage with automated Ministry of Interior dispatch lines—and integrated secure Stripe API subscription workflows for commercial web applications. My daily stack consists of C#, ASP.NET, Node.js, Python, PostgreSQL, and SQL Server. I am deeply comfortable working in Linux environments, utilizing Git/Docker, and collaborating in high-performance Agile and Scrum lifecycles.

I am strongly drawn to the high standards of engineering and collaborative culture at ${companyName}. I possess fluent English communication skills, a highly structured approach to system design, and complete readiness for international, asynchronous, or remote engineering settings. Thank you for your time, consideration, and the opportunity to discuss how my hands-on production depth can contribute immediate value to your team.

Sincerely,
Laila Mohamed Fikry`;
      }
    }
    
    // Create the PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Header Section
    const nameY = height - margin;
    page.drawText("Laila Mohamed Fikry", { x: margin, y: nameY, size: 20, font: boldFont, color: rgb(0.08, 0.18, 0.36) });
    
    const titleY = nameY - 18;
    page.drawText("Junior Backend Engineer", { x: margin, y: titleY, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    
    const contactRow1 = "Phone: +20 121 021 2792  |  Email: laila.mohamed.fikry@gmail.com";
    const contactRow1Y = titleY - 16;
    page.drawText(contactRow1, { x: margin, y: contactRow1Y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    
    const contactRow2 = "LinkedIn: linkedin.com/in/laila-mohamed23  |  GitHub: github.com/laila2005  |  Portfolio: my-portfolio-mm2c.vercel.app";
    const contactRow2Y = contactRow1Y - 14;
    page.drawText(contactRow2, { x: margin, y: contactRow2Y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
    
    const dividerY = contactRow2Y - 10;
    page.drawLine({
      start: { x: margin, y: dividerY },
      end: { x: width - margin, y: dividerY },
      thickness: 1.5,
      color: rgb(0.08, 0.18, 0.36) // Matching navy divider
    });

    // Body Text
    // Split by newline first to handle paragraphs and avoid passing '\n' to drawText (which throws WinAnsi cannot encode "\n")
    const paragraphs = letterText.split('\n');
    let y = dividerY - 25;
    const lineHeight = 16;
    const paragraphHeight = 22;
    
    for (let p = 0; p < paragraphs.length; p++) {
      const paragraphText = paragraphs[p].trim();
      if (paragraphText === '') {
        y -= paragraphHeight - lineHeight; // Adjust vertical space for empty paragraphs
        continue;
      }
      
      const words = paragraphText.split(/\s+/);
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, 11);
        
        if (textWidth > width - 2 * margin) {
          page.drawText(line.trim(), { x: margin, y, size: 11, font, color: rgb(0, 0, 0) });
          line = words[i] + ' ';
          y -= lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== '') {
        page.drawText(line.trim(), { x: margin, y, size: 11, font, color: rgb(0, 0, 0) });
        y -= paragraphHeight; // Paragraph break after a completed paragraph
      }
    }

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
