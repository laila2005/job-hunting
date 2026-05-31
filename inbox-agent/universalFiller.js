require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─────────────────────────────────────────────────────
// Gemini API with retry
// ─────────────────────────────────────────────────────
async function callGemini(contents, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { temperature: 0.1 }
      });
      return response.text.trim();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const wait = Math.pow(2, attempt + 1) * 1000;
      console.log(`   [Gemini] Retry ${attempt + 1}/${maxRetries} in ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ─────────────────────────────────────────────────────
// Extract full page state from DOM
// ─────────────────────────────────────────────────────
async function extractPageState(page) {
  return await page.evaluate(() => {
    const state = { url: window.location.href, title: document.title, buttons: [], links: [], fields: [], errors: [], headings: [] };

    // Headings (for context)
    document.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.innerText.trim();
      if (text) state.headings.push(text);
    });

    // Visible buttons
    document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]').forEach((el, i) => {
      const text = el.innerText?.trim() || el.value || el.getAttribute('aria-label') || '';
      if (!text || el.offsetParent === null) return; // Skip hidden
      state.buttons.push({ index: i, text: text.substring(0, 80), tag: el.tagName, type: el.type || '', disabled: el.disabled, id: el.id || '', className: (el.className || '').toString().substring(0, 60) });
    });

    // Visible links that look like CTAs
    document.querySelectorAll('a').forEach((el, i) => {
      const text = el.innerText?.trim() || '';
      if (!text || el.offsetParent === null) return;
      const lowerText = text.toLowerCase();
      if (lowerText.includes('apply') || lowerText.includes('submit') || lowerText.includes('next') || lowerText.includes('continue') || lowerText.includes('sign') || lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('upload')) {
        state.links.push({ index: i, text: text.substring(0, 80), href: el.href?.substring(0, 120) || '' });
      }
    });

    // Form fields
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select').forEach((el, i) => {
      if (el.offsetParent === null) return;
      let label = '';
      if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) label = l.innerText?.trim(); }
      if (!label) { const w = el.closest('label'); if (w) label = w.innerText?.replace(el.value || '', '').trim(); }
      if (!label) label = el.getAttribute('aria-label') || '';
      if (!label) { const p = el.previousElementSibling; if (p) label = p.innerText?.trim() || ''; }
      if (!label) label = el.placeholder || el.name || '';

      let options = undefined;
      if (el.tagName === 'SELECT') options = Array.from(el.options).slice(0, 15).map(o => o.text);

      state.fields.push({
        index: i, tag: el.tagName.toLowerCase(), type: el.type || 'text',
        name: el.name || '', id: el.id || '', label: label.substring(0, 80),
        value: (el.value || '').substring(0, 50), required: el.required,
        options: options
      });
    });

    // Error messages
    document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"], .invalid-feedback').forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length < 200) state.errors.push(text);
    });

    return state;
  });
}

// ─────────────────────────────────────────────────────
// Execute a single action from Gemini
// ─────────────────────────────────────────────────────
async function executeAction(page, action) {
  switch (action.action) {

    case 'click_button': {
      const buttons = await page.$$('button, input[type="submit"], input[type="button"], [role="button"]');
      const visibleButtons = [];
      for (const btn of buttons) {
        const visible = await btn.evaluate(el => el.offsetParent !== null);
        if (visible) visibleButtons.push(btn);
      }
      if (visibleButtons[action.index]) {
        await visibleButtons[action.index].evaluate(el => el.click());
        console.log(`      → Clicked button #${action.index}: "${action.reason}"`);
      }
      break;
    }

    case 'click_link': {
      const links = await page.$$('a');
      const visibleLinks = [];
      for (const link of links) {
        const text = await link.evaluate(el => el.innerText?.trim() || '');
        const visible = await link.evaluate(el => el.offsetParent !== null);
        const lowerText = text.toLowerCase();
        if (visible && (lowerText.includes('apply') || lowerText.includes('submit') || lowerText.includes('next') || lowerText.includes('continue') || lowerText.includes('sign') || lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('upload'))) {
          visibleLinks.push(link);
        }
      }
      if (visibleLinks[action.index]) {
        await visibleLinks[action.index].evaluate(el => el.click());
        console.log(`      → Clicked link #${action.index}: "${action.reason}"`);
      }
      break;
    }

    case 'fill_fields': {
      const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
      const visibleInputs = [];
      for (const inp of inputs) {
        const visible = await inp.evaluate(el => el.offsetParent !== null);
        if (visible) visibleInputs.push(inp);
      }

      for (const fill of (action.fields || [])) {
        const el = visibleInputs[fill.index];
        if (!el) continue;
        const tagName = await el.evaluate(e => e.tagName.toLowerCase());

        if (tagName === 'select') {
          try {
            await el.select(fill.value);
          } catch (e) {
            await el.evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, fill.value);
          }
        } else {
          await el.click({ clickCount: 3 });
          await el.type(fill.value, { delay: 15 });
          await el.evaluate(e => {
            e.dispatchEvent(new Event('input', { bubbles: true }));
            e.dispatchEvent(new Event('change', { bubbles: true }));
            e.dispatchEvent(new Event('blur', { bubbles: true }));
          });
        }
        console.log(`      → Filled field #${fill.index} ("${fill.label}") = "${fill.value.substring(0, 40)}..."`);
      }
      break;
    }

    case 'upload_file': {
      const inputs = await page.$$('input[type="file"]');
      const visibleInputs = [];
      for (const inp of inputs) visibleInputs.push(inp);
      if (visibleInputs[action.index || 0]) {
        const resumePath = path.join(__dirname, 'backend_resume.pdf');
        if (fs.existsSync(resumePath)) {
          await visibleInputs[action.index || 0].uploadFile(resumePath);
          console.log(`      → Uploaded resume to file input #${action.index || 0}`);
        }
      }
      break;
    }

    case 'wait': {
      const ms = (action.seconds || 3) * 1000;
      console.log(`      → Waiting ${action.seconds || 3}s...`);
      await new Promise(r => setTimeout(r, ms));
      break;
    }

    default:
      console.log(`      → Unknown action: ${action.action}`);
  }
}

// ─────────────────────────────────────────────────────
// THE MAIN AI AGENT LOOP
// ─────────────────────────────────────────────────────
async function handleUniversalApply(page, companyName) {
  console.log(`   [AI Agent] \u{1F9E0} Activating Autonomous Agent for ${companyName}...`);

  const profilePath = path.join(__dirname, '..', 'candidate_profile.json');
  if (!fs.existsSync(profilePath)) {
    return { success: false, message: 'Missing candidate_profile.json' };
  }
  const profile = fs.readFileSync(profilePath, 'utf8');

  const MAX_STEPS = 12;
  const history = []; // Track what we've done to avoid loops

  for (let step = 0; step < MAX_STEPS; step++) {
    console.log(`\n   [AI Agent] ── Step ${step + 1}/${MAX_STEPS} ──`);

    await new Promise(r => setTimeout(r, 2000));

    // 1. Read the page
    const pageState = await extractPageState(page);
    console.log(`   [AI Agent] Page: ${pageState.url.substring(0, 80)}`);
    console.log(`   [AI Agent] Found: ${pageState.fields.length} fields, ${pageState.buttons.length} buttons, ${pageState.links.length} CTA links`);

    // 2. Ask Gemini what to do
    const prompt = `You are an autonomous AI agent applying for a job on behalf of a candidate.
Your goal: navigate through this job application website and SUBMIT the application.

CANDIDATE PROFILE:
${profile}

CURRENT PAGE STATE:
URL: ${pageState.url}
Title: ${pageState.title}
Headings: ${pageState.headings.join(' | ')}
${pageState.errors.length > 0 ? 'ERRORS ON PAGE: ' + pageState.errors.join('; ') : ''}

VISIBLE BUTTONS: ${JSON.stringify(pageState.buttons)}
CTA LINKS: ${JSON.stringify(pageState.links)}
FORM FIELDS: ${JSON.stringify(pageState.fields)}

PREVIOUS ACTIONS TAKEN: ${history.length > 0 ? history.join(' → ') : 'None yet'}

RULES:
- If you see form fields that are EMPTY, fill them with the candidate's data.
- For name fields: Laila Mohamed Fikry
- For email: laila.mohamed.fikry@gmail.com
- For phone: +201210212792
- For LinkedIn: https://www.linkedin.com/in/laila-mohamed23/
- For GitHub: https://github.com/laila2005
- For location/city: Cairo, Egypt
- For "years of experience": 2
- For salary expectations: Negotiable
- For "why do you want to work here" or similar: Write a concise 2-3 sentence professional answer.
- For select/dropdown fields, pick the BEST matching option text from the available options.
- If you see a file upload for resume/CV, upload the file.
- If you see an "Apply" or "Apply Now" button/link and no form fields, click it to get to the form.
- If you see "Next", "Continue", or "Review" buttons and fields are filled, click to proceed.
- If you see a "Submit" button and fields are filled, click it to submit.
- If the page shows a confirmation/thank you message, the application is DONE.
- If login is required or there is a CAPTCHA or paywall, it is IMPOSSIBLE to apply.
- NEVER click "Sign in", "Log in", "Create account" buttons.

Respond with ONLY a valid JSON object (no markdown, no backticks). Use one of these formats:

To fill form fields:
{"action":"fill_fields","fields":[{"index":0,"label":"Name","value":"Laila Mohamed Fikry"},{"index":1,"label":"Email","value":"laila.mohamed.fikry@gmail.com"}],"reason":"Filling application form"}

To click a button (use button index from VISIBLE BUTTONS):
{"action":"click_button","index":0,"reason":"Clicking Apply Now"}

To click a CTA link (use link index from CTA LINKS):
{"action":"click_link","index":0,"reason":"Clicking Apply link"}

To upload resume:
{"action":"upload_file","index":0,"reason":"Uploading resume"}

If application is submitted/complete:
{"action":"done","reason":"Application submitted successfully"}

If impossible (login wall, CAPTCHA, etc):
{"action":"impossible","reason":"Requires account login"}

To wait for page to load:
{"action":"wait","seconds":3,"reason":"Waiting for redirect"}`;

    let geminiResponse;
    try {
      geminiResponse = await callGemini(prompt);
    } catch (err) {
      console.error(`   [AI Agent] Gemini error: ${err.message}`);
      continue;
    }

    // 3. Parse the action
    let action;
    try {
      let cleaned = geminiResponse;
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      action = JSON.parse(cleaned);
    } catch (err) {
      console.error(`   [AI Agent] Could not parse Gemini response: ${geminiResponse.substring(0, 200)}`);
      continue;
    }

    console.log(`   [AI Agent] Decision: ${action.action} — ${action.reason}`);
    history.push(`Step${step + 1}:${action.action}(${action.reason?.substring(0, 30)})`);

    // 4. Handle terminal states
    if (action.action === 'done') {
      console.log(`   [AI Agent] \u2705 Application complete: ${action.reason}`);
      return { success: true, message: action.reason };
    }

    if (action.action === 'impossible') {
      console.log(`   [AI Agent] \u274c Cannot apply: ${action.reason}`);
      return { success: false, message: action.reason };
    }

    // 5. Execute the action
    try {
      await executeAction(page, action);
    } catch (err) {
      console.error(`   [AI Agent] Action failed: ${err.message}`);
    }

    // Wait for page to settle after action
    await new Promise(r => setTimeout(r, 3000));

    // Check if a new tab opened (external redirect)
    const pages = await page.browser().pages();
    if (pages.length > 1) {
      const lastPage = pages[pages.length - 1];
      if (lastPage !== page) {
        console.log(`   [AI Agent] New tab detected. Switching...`);
        page = lastPage;
        await page.bringToFront();
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  return { success: false, message: `Exhausted ${MAX_STEPS} steps without completing application.` };
}

module.exports = { handleUniversalApply };
