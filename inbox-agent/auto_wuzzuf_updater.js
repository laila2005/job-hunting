const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  console.log("🚀 Launching Google Chrome for Wuzzuf Automation...");
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.goto('https://wuzzuf.net/login', { waitUntil: 'networkidle2' });
  
  console.log("⏳ WAITING FOR LOGIN...");
  console.log("Please enter your email and password to log into Wuzzuf.");
  console.log("I will automatically detect when you log in and proceed to update your profile.");
  
  // Wait until we reach the home page or profile page (safe polling across navigations)
  let isLoggedIn = false;
  while (!isLoggedIn) {
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('/jobs/egypt') || currentUrl.includes('/me')) {
        isLoggedIn = true;
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      // Ignore errors during navigation
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log("Navigating to General Info...");
  await page.goto('https://wuzzuf.net/profile/update/general-info', { waitUntil: 'networkidle2' });
  
  console.log("Automating Professional Title (Tag Line)...");
  await page.evaluate(() => {
    const input = document.querySelector('input[name="tagLine"]');
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(input, "Software Engineer | Backend (C# / ASP.NET) & Computer Vision | CS Junior");
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      const btn = document.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = false;
        btn.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Navigating to Main Profile Update Page...");
  await page.goto('https://wuzzuf.net/profile/update', { waitUntil: 'networkidle2' });
  
  console.log("Injecting AI Helper Panel for complex sections...");
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.id = 'ai-wuzzuf-overlay';
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.right = '10px';
    div.style.width = '420px';
    div.style.height = '95vh';
    div.style.backgroundColor = '#ffffff';
    div.style.border = '3px solid #0055D9';
    div.style.borderRadius = '12px';
    div.style.zIndex = '9999999';
    div.style.padding = '24px';
    div.style.overflowY = 'auto';
    div.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
    div.style.fontFamily = 'Segoe UI, sans-serif';
    
    div.innerHTML = `
      <h2 style="color:#0055D9; margin-top:0;">✅ Title Auto-Updated!</h2>
      <p style="font-size:14px; color:#444;">I just automatically updated and saved your Professional Title behind the scenes!</p>
      <p style="font-size:14px; color:#e74c3c; font-weight:bold;">Wuzzuf's "Experience" and "Skills" forms require clicking custom dropdowns that break if automated. Please copy these directly into your profile sections on the left!</p>
      <hr style="border:0; border-top:1px solid #eee; margin:20px 0;"/>
      
      <h3 style="color:#333; font-size:16px;">2. About Me (Summary)</h3>
      <textarea id="ai-summary" style="width:100%; height:150px; padding:8px; border:1px solid #ccc; border-radius:6px;">I am a Full Stack Developer and Software Engineer currently in my Junior year of a Computer Science degree, bringing hands-on production experience that most candidates do not acquire until years into their careers. 

My core expertise lies in backend systems (C#, ASP.NET Core) and AI/Computer Vision. I have architected and deployed enterprise-grade IoT telemetry systems currently utilized by major national clients, including the Ministry of Interior (MOI) and GASCO. I also developed "Inqaz-app," an AI-driven emergency response platform using computer vision.</textarea>
      <button onclick="navigator.clipboard.writeText(document.getElementById('ai-summary').value); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy Summary', 2000)" style="margin-top:8px; padding:6px 12px; background:#0055D9; color:white; border:none; border-radius:4px; cursor:pointer;">Copy Summary</button>

      <h3 style="color:#333; font-size:16px; margin-top:20px;">3. Experience (LM Tech Solutions)</h3>
      <textarea id="ai-exp" style="width:100%; height:150px; padding:8px; border:1px solid #ccc; border-radius:6px;">- Architected RMS 3.0 Enterprise IoT Platform: Led the end-to-end backend development of an industrial IoT platform for critical power infrastructure with a scalable architecture.
- Engineered Unified Polling Service: Built a fault-tolerant, concurrent backend service in C# and ASP.NET Core handling real-time data ingestion across Modbus, HTTP, and SNMP.
- Production Enterprise Deployments: Managed the deployment of RMS 3.0 for major national clients including the Ministry of Interior (MOI) and GASCO.
- Real-Time Dashboards: Built a responsive full-stack frontend (React.js, Tailwind CSS) providing NOC teams with live telemetry.</textarea>
      <button onclick="navigator.clipboard.writeText(document.getElementById('ai-exp').value); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy Experience', 2000)" style="margin-top:8px; padding:6px 12px; background:#0055D9; color:white; border:none; border-radius:4px; cursor:pointer;">Copy Experience</button>
      
      <h3 style="color:#333; font-size:16px; margin-top:20px;">4. Skills Tags</h3>
      <textarea id="ai-skills" style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:6px;">Software Engineering, Backend Development, C#, ASP.NET Core, Python, Computer Vision, Deep Learning, React.js, SQL Server, PostgreSQL, RESTful APIs, IoT, Node.js, Git</textarea>
      <button onclick="navigator.clipboard.writeText(document.getElementById('ai-skills').value); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy Skills', 2000)" style="margin-top:8px; padding:6px 12px; background:#0055D9; color:white; border:none; border-radius:4px; cursor:pointer;">Copy Skills</button>
    `;
    document.body.appendChild(div);
  });
  
  console.log("✅ All automated tasks complete!");
  
  await new Promise(r => setTimeout(r, 900000));
  await browser.close();
})();
