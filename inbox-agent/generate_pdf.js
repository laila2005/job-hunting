const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePDF() {
  const mdPath = path.join(__dirname, 'backend_resume.md');
  const pdfPath = path.join(__dirname, 'backend_resume.pdf');

  if (!fs.existsSync(mdPath)) {
    console.error(`Markdown resume not found at ${mdPath}`);
    return;
  }

  console.log('Reading backend_resume.md...');
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  // Basic Markdown-to-HTML parser
  let htmlContent = mdContent
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    // Handle multi-line structures like paragraphs and spacers
    .split('\n')
    .map(line => {
      line = line.trim();
      if (!line) return '<div class="spacer"></div>';
      if (line.startsWith('<h1>') || line.startsWith('<h2>') || line.startsWith('<li>') || line.startsWith('<div')) {
        return line;
      }
      // List items grouping
      return `<p>${line}</p>`;
    })
    .join('\n');

  // Wrap list items
  htmlContent = htmlContent.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  // Fix nested double <ul> blocks
  htmlContent = htmlContent.replace(/<\/ul>\n<ul>/gim, '');

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Laila Mohamed Fikry - Resume</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          font-size: 10.5pt;
          margin: 0;
          padding: 0;
        }

        h1 {
          font-size: 20pt;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #0f172a;
          text-align: center;
          letter-spacing: -0.5px;
        }

        /* Subheader under H1 */
        h1 + p {
          text-align: center;
          font-size: 9.5pt;
          color: #475569;
          margin: 0 0 4px 0;
        }

        /* Links under subheader */
        h1 + p + p {
          text-align: center;
          font-size: 9.5pt;
          margin: 0 0 16px 0;
        }

        h2 {
          font-size: 12pt;
          font-weight: 600;
          color: #0f172a;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 3px;
          margin: 18px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        p {
          margin: 0 0 6px 0;
        }

        strong {
          font-weight: 600;
          color: #0f172a;
        }

        a {
          color: #2563eb;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        ul {
          margin: 0 0 8px 0;
          padding-left: 20px;
        }

        li {
          margin-bottom: 4px;
        }

        .spacer {
          height: 4px;
        }

        /* Experience and Project item styling */
        p:has(strong) {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        p > em {
          font-style: italic;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto;">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;

  console.log('Launching browser to print PDF...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '0.5in',
      bottom: '0.5in',
      left: '0.6in',
      right: '0.6in'
    },
    printBackground: true
  });

  await browser.close();
  console.log(`✅ Resume PDF successfully compiled and saved to ${pdfPath}`);
}

generatePDF().catch(console.error);
