import { demoJobs } from './demoData';

// Everything the full interface reads besides jobs. All of it is invented sample data for the recruiter demo.
const DAY = 86400000;
const MIN = 60000;
const NOW = Date.now();
const ago = ms => new Date(NOW - ms).toISOString();
const dayStr = offsetDays => new Date(NOW - offsetDays * DAY).toISOString().slice(0, 10);

const legacyJobs = [
  ['Backend Developer Intern', 'Quillbase', 'Cairo', 'Hybrid', 'Pending Review', 'Unlisted'],
  ['Junior Software Engineer', 'Riverstone Systems', 'Cairo', 'On-site', 'Pending Review', '15-20k EGP'],
  ['Full-Stack Developer', 'Atlas Mobile', 'Remote (US only)', 'Remote', 'Rejected', '$60k/yr'],
  ['Software Engineering Intern', 'Fernwood Labs', 'Remote', 'Remote', 'Pending Review', 'Unlisted'],
].map(([title, company, location, model, status, salary], i) => ({
  id: `job-${NOW - (34 + i) * DAY}-${i + 1}`,
  title, company, location, model, status, salary, fitScore: 70 + i * 3, atsMatch: 75, gapRisk: 'Medium',
  companyLink: 'https://example.com/jobs', companySummary: 'Older scraped listing, kept in the archive.', resumeVersion: 'backend_resume.pdf',
  responsibilities: null, appliedDate: null, source: 'Auto-Scraped', type: 'Full-time',
}));

const telemetryRow = {
  id: 'telemetry_bot_status', title: 'Waiting for the nightly run', company: 'Listening', location: '-', model: '-', status: 'Test Trigger',
  companySummary: JSON.stringify([
    { t: ago(42 * MIN), e: '🔎', l: 'info', m: 'Nightly run started: searching 6 job boards (sample log)' },
    { t: ago(38 * MIN), e: '✅', l: 'success', m: 'Found 3 new remote jobs open to applicants in Egypt' },
    { t: ago(31 * MIN), e: '📄', l: 'info', m: 'Tailored 3 CVs and wrote cover notes from the fact bank' },
    { t: ago(24 * MIN), e: '📬', l: 'info', m: 'Checked the inbox: 1 test link, 2 confirmations' },
    { t: ago(20 * MIN), e: '🔄', l: 'success', m: 'Synced the board and sent the daily digest' },
    { t: ago(19 * MIN), e: '💤', l: 'info', m: 'Sleeping until tomorrow' },
  ]),
};

const chatText = '👋 Demo mode. The AI commander is switched off here. In the real app it talks to my own local agent.';

export const demoSeed = () => ({
  jobs: [...demoJobs(), ...legacyJobs, telemetryRow],
  networking_contacts: [
    { id: 1, name: 'Dana Whitfield', company: 'Northwind Labs', role: 'Engineering Manager', linkedin_url: 'https://www.linkedin.com/in/example-dana', notes: 'Replied to my note, wants a 15-minute chat.', status: 'Coffee Chat Scheduled', last_contact: dayStr(2) },
    { id: 2, name: 'Omar Haddad', company: 'Brightline AI', role: 'Technical Recruiter', linkedin_url: 'https://www.linkedin.com/in/example-omar', notes: 'Sent the coding exercise link.', status: 'Connected', last_contact: dayStr(1) },
    { id: 3, name: 'Priya Raman', company: 'Orbit Studio', role: 'Senior Frontend Engineer', linkedin_url: 'https://www.linkedin.com/in/example-priya', notes: 'Met at an online meetup.', status: 'To Contact', last_contact: dayStr(5) },
    { id: 4, name: 'Lena Fischer', company: 'Harbor Pay', role: 'Head of Engineering', linkedin_url: 'https://www.linkedin.com/in/example-lena', notes: 'Intro message sent after applying.', status: 'Reached Out', last_contact: dayStr(2) },
  ],
  network_contacts: [],
  agent_chat: [
    { id: 1, sender: 'agent', role: 'assistant', content: chatText, message: chatText, created_at: ago(2 * MIN) },
  ],
  applications: [
    { id: 'a1', company: 'Mintly', title: 'Junior Full-Stack Engineer', applied_date: dayStr(8), stage: 'Applied', notes: '', source: 'Curated', ats_score: 82, job_url: 'https://example.com/careers' },
    { id: 'a2', company: 'Harbor Pay', title: 'Junior Backend Engineer', applied_date: dayStr(2), stage: 'HR Screen', notes: 'Recruiter call on Thursday.', source: 'Curated', ats_score: 85, job_url: 'https://example.com/careers' },
    { id: 'a3', company: 'Brightline AI', title: 'AI Product Engineer', applied_date: dayStr(3), stage: 'Technical', notes: 'Coding exercise in progress.', source: 'Curated', ats_score: 90, job_url: 'https://example.com/careers' },
    { id: 'a4', company: 'Fernwood Labs', title: 'Software Engineering Intern', applied_date: dayStr(20), stage: 'Rejected', notes: 'Position filled.', source: 'Scraped', ats_score: 68, job_url: 'https://example.com/careers' },
  ],
  dream_companies: [
    { id: 1, name: 'Northwind Labs', linkedin_url: 'https://www.linkedin.com/company/example-northwind', status: 'Applied', notes: 'Great engineering blog. Applied this week.', domain: 'northwindlabs.com', created_at: ago(9 * DAY) },
    { id: 2, name: 'Brightline AI', linkedin_url: 'https://www.linkedin.com/company/example-brightline', status: 'Networking', notes: 'Talking to their recruiter.', domain: 'brightlineai.com', created_at: ago(7 * DAY) },
    { id: 3, name: 'Orbit Studio', linkedin_url: null, status: 'Researching', notes: 'Check their open-source work first.', domain: 'orbitstudio.com', created_at: ago(4 * DAY) },
    { id: 4, name: 'Skybridge', linkedin_url: null, status: 'Targeted', notes: null, domain: 'skybridge.com', created_at: ago(2 * DAY) },
  ],
  interview_sessions: [
    { id: 1, role: 'agent', score: 72, content: 'Good structure. Add one concrete number to your system design answer.', created_at: ago(6 * DAY) },
    { id: 2, role: 'agent', score: 78, content: 'Clearer trade-offs this time.', created_at: ago(4 * DAY) },
    { id: 3, role: 'agent', score: 84, content: 'Strong answer on handling failure cases.', created_at: ago(1 * DAY) },
  ],
  resume_requests: [],
  portfolio_assets: [],
  skill_metrics: [
    { id: 1, subject: 'React / TypeScript', laila_score: 85, market_score: 90 },
    { id: 2, subject: 'Node.js / NestJS', laila_score: 78, market_score: 85 },
    { id: 3, subject: 'Python / FastAPI', laila_score: 80, market_score: 80 },
    { id: 4, subject: 'SQL / PostgreSQL', laila_score: 76, market_score: 85 },
    { id: 5, subject: 'Cloud / DevOps', laila_score: 45, market_score: 80 },
    { id: 6, subject: 'AI / LLM agents', laila_score: 82, market_score: 88 },
  ],
  action_items: [
    { id: 1, text: 'Add one cloud deployment project (sample action)', type: 'critical', status: 'pending' },
    { id: 2, text: 'Write a short case study for the monitoring platform', type: 'warning', status: 'pending' },
    { id: 3, text: 'Tailor the CV for each application', type: 'good', status: 'completed' },
  ],
  daily_challenges: [
    { id: 1, concept: 'Idempotent API design', challenge_text: 'Design a payment webhook handler that is safe to receive twice. List the database constraint you would add. (Sample challenge.)', status: 'pending', created_at: ago(3 * 60 * MIN) },
  ],
});
