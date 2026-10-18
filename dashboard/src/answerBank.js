// Answers for common application questions, written ONLY from Laila's confirmed fact bank (coaching/fact_bank.md).
// Nothing here is generated at random: a pasted question is matched against keywords and returns a ready answer.
// Technologies she has not used get an honest "not yet" answer; never claim them.

const LINKS = 'Portfolio https://my-portfolio-mm2c.vercel.app/ | GitHub https://github.com/laila2005 | LinkedIn https://www.linkedin.com/in/laila-mohamed23/';

// What she HAS used: term -> where (evidence)
const HAVE = {
  react: 'React and Next.js front ends: the LM-MS operator dashboards, Zagel (Next.js) and PetPluse.',
  'next.js': 'Next.js: Zagel (real-time messaging, WebRTC) and TalentScout.',
  typescript: 'TypeScript: Zagel (TypeScript + ESLint CI), the school-management API (TypeScript Express) and React front ends.',
  javascript: 'JavaScript and TypeScript across React, Node.js and Express projects.',
  node: 'Node.js back ends with Express and NestJS (bagijob.com is a NestJS platform; the school system is TypeScript Express).',
  nestjs: 'NestJS: on bagijob.com I integrated Stripe, added a timeline/community tab and built the admin dashboard.',
  express: 'Express: the school-management API (TypeScript Express + PostgreSQL, JWT, Redis, Helmet, rate limiting).',
  python: 'Python: FastAPI back ends, scrapers, a background daemon, TalentScout and the AI job-hunting platform.',
  fastapi: 'FastAPI: Zagel (WebSockets), Inqaz and the AI job-hunting platform.',
  '.net': 'ASP.NET Core (C#): the LM-MS monitoring platform, in production for Egypt\'s Ministry of Interior and GASCO.',
  'c#': 'C# / ASP.NET Core in LM-MS.',
  postgres: 'PostgreSQL: the school system (Sequelize), PetPluse and TalentScout on Supabase.',
  sql: 'SQL: SQL Server (LM-MS schema enhancement), PostgreSQL and MySQL.',
  'sql server': 'SQL Server: the LM-MS database, where I enhanced the schema for security and throughput.',
  supabase: 'Supabase (Postgres, Realtime): PetPluse, TalentScout and this job platform.',
  mongodb: 'MongoDB: Node/Express REST APIs during the ALX program and other projects.',
  neo4j: 'Neo4j and Cypher: the Banque Misr data-lineage graph.',
  redis: 'Redis: the school-management API.',
  docker: 'Docker: Zagel and several deployments.',
  linux: 'Linux (Ubuntu) and Bash: the restaurant reservation system runs on Ubuntu with nginx.',
  git: 'Git and GitHub daily, including CI with TypeScript and ESLint checks.',
  'ci/cd': 'CI/CD: a TypeScript + ESLint pipeline on Zagel and Vercel deployments.',
  playwright: 'Playwright end-to-end tests.',
  flutter: 'Flutter and Dart: RiseList (Riverpod, Firebase, Gemini) and the Flutter client of Inqaz.',
  firebase: 'Firebase Auth and Firestore: RiseList.',
  stripe: 'Stripe: subscription billing and an admin revenue dashboard on bagijob.com.',
  websocket: 'WebSockets: Zagel (FastAPI), Inqaz and LM-MS.',
  webrtc: 'WebRTC: peer-to-peer voice/video and screen sharing in Zagel.',
  electron: 'Electron: the Windows desktop build of Zagel.',
  capacitor: 'Capacitor: the Android build of Zagel.',
  tailwind: 'Tailwind CSS across my React projects.',
  gemini: 'The Gemini API: TalentScout, RiseList and the AI job-hunting platform.',
  llm: 'LLM APIs and agents with tool calling: TalentScout (rubric scoring, prompt-injection tests).',
  'claude code': 'Claude Code and Antigravity every day, while reviewing and testing every line myself.',
  modbus: 'Modbus, SNMP and HTTP polling in the LM-MS Unified Polling Service.',
  snmp: 'SNMP in the LM-MS polling service.',
  rest: 'REST API design with FastAPI, Express, NestJS and ASP.NET Core.',
  agile: 'Agile/Scrum during the ALX program and team projects.',
};

// What she has NOT used: do not claim.
const NOT_YET = [
  'kubernetes', 'aws', 'azure', 'gcp', 'google cloud', 'java', 'scala', 'convex', 'twilio', 'vonage', 'rbac', 'mcp',
  'cursor', 'copilot', 'react native', 'golang', 'rust', 'django', 'laravel', 'graphql', 'redux', 'zustand', 'vue',
  'angular', 'material ui', 'kafka', 'terraform', 'swift', 'kotlin', 'ruby', 'rails', 'php', 'rag', 'embeddings', 'pytorch',
];

const SIMILAR = {
  kubernetes: 'Docker and CI/CD', aws: 'Vercel, Supabase and Docker deployments', azure: 'Vercel, Supabase and Docker deployments',
  gcp: 'Firebase', 'google cloud': 'Firebase', django: 'FastAPI', laravel: 'Express and NestJS', graphql: 'REST APIs',
  redux: 'React state and context', zustand: 'React state and context', vue: 'React and Next.js', angular: 'React and TypeScript',
  'react native': 'Flutter and React', java: 'C# / ASP.NET Core', go: 'Node.js and Python', golang: 'Node.js and Python',
  rust: 'Python and C', kafka: 'WebSockets and Redis', 'material ui': 'Tailwind CSS', rag: 'Gemini API and agents with tool calling',
};

const PRETTY = {
  aws: 'AWS', gcp: 'GCP', azure: 'Azure', rbac: 'RBAC', mcp: 'MCP', rag: 'RAG', php: 'PHP', graphql: 'GraphQL', golang: 'Go',
  kubernetes: 'Kubernetes', django: 'Django', laravel: 'Laravel', redux: 'Redux', vue: 'Vue', angular: 'Angular', java: 'Java',
  'react native': 'React Native', 'material ui': 'Material UI', 'google cloud': 'Google Cloud', pytorch: 'PyTorch',
};
const pretty = k => PRETTY[k] || (k[0].toUpperCase() + k.slice(1));

const norm = t => ` ${t.toLowerCase().replace(/[^a-z0-9+#./ ]+/g, ' ').replace(/\s+/g, ' ')} `;
const has = (q, w) => norm(q).includes(` ${w} `) || norm(q).includes(w);

// Technology lookup: "Do you have experience with X?"
export function techAnswer(question) {
  const q = norm(question);
  const found = Object.keys(HAVE).sort((a, b) => b.length - a.length).filter(k => q.includes(` ${k} `) || q.includes(` ${k}s `) || q.includes(` ${k}.`));
  const missing = NOT_YET.filter(k => q.includes(` ${k} `) || q.includes(` ${k}?`) || q.includes(` ${k},`));
  if (found.length === 0 && missing.length === 0) return null;
  const lines = found.slice(0, 3).map(k => `Yes: ${HAVE[k]}`);
  missing.slice(0, 3).forEach(k => {
    const alt = SIMILAR[k];
    lines.push(`Not yet: I have not used ${pretty(k)} in production${alt ? `, but I have used ${alt}, and I pick up new tools quickly.` : '.'}  (Honest answer: do not claim it.)`);
  });
  return lines.join('\n');
}

const RULES = [
  { keys: ['salary', 'compensation', 'pay expectation', 'desired pay', 'expected pay', 'hourly rate'], answer: ctx => ctx.salary },
  { keys: ['notice period', 'when can you start', 'start date', 'available to start', 'availability', 'earliest start'],
    answer: () => 'I can start on 10/26/2026. Remote, 30 hours per week (happy to discuss hours on a first call).' },
  { keys: ['hours per week', 'full-time', 'full time', 'part-time', 'part time', 'how many hours'],
    answer: () => 'I can commit 30 hours a week, remote, and more during university breaks. I am finishing my CS degree (2028).' },
  { keys: ['years of experience', 'years of professional', 'how many years', 'years experience'],
    answer: () => '3 years building software; about 2 years professional (freelance and LM Smart Solutions). If a form asks for professional years only, enter 2.' },
  { keys: ['english'], answer: () => 'Fluent. (Arabic native; Turkish proficient; German and Russian beginner.)' },
  { keys: ['spoken language', 'languages do you speak', 'which languages do you', 'languages you speak'], answer: () => 'Arabic (native), English (fluent), Turkish (proficient), Russian and German (beginner).' },
  { keys: ['where are you', 'location', 'based', 'time zone', 'timezone', 'city', 'country'],
    answer: () => 'Cairo, Egypt (EET, UTC+2; UTC+3 in summer). I work remotely.' },
  { keys: ['visa', 'sponsorship', 'work authorization', 'work authorisation', 'relocate', 'relocation', 'eligible to work'],
    answer: () => 'I work remotely from Cairo, Egypt as a contractor, so I am not asking for relocation or visa sponsorship. (Check the posting\'s country rules first.)' },
  { keys: ['referral', 'referred', 'how did you hear', 'where did you find', 'hear about'],
    answer: () => 'No referral. I found the role on your careers page / a job board.' },
  { keys: ['github', 'portfolio', 'linkedin', 'website', 'links'], answer: () => LINKS },
  { keys: ['education', 'degree', 'university', 'college', 'gpa', 'cgpa'],
    answer: () => 'B.Sc. Computer Science, El Sewedy University of Technology (2025-2028, expected), CGPA 3.9/4.3. Earlier at Egyptian Russian University (2023-2025).' },
  { keys: ['proud', 'biggest project', 'most complex', 'best project', 'tell us about a project', 'describe a project', 'technical challenge', 'challenging'],
    answer: () => 'LM-MS, a monitoring platform I co-founded for up to 400 distributed power sites, in production for Egypt\'s Ministry of Interior and GASCO. I built a concurrent Modbus/SNMP/HTTP polling service, an alarm engine with per-subscriber rules and delivery by email, SMS and WhatsApp, and a 0-100 health score that reconciles controller event logs with alarm history (clock offsets, poll interval). I enhanced the SQL Server schema for security and throughput.' },
  { keys: ['ai tools', 'use ai', 'artificial intelligence', 'generative ai', 'llm', 'prompt'],
    answer: () => 'I build with AI coding agents every day (Claude Code and Antigravity) and I review and test every line myself. I built TalentScout, a live AI recruiter agent with tool calling, rubric scoring with verbatim evidence and prompt-injection tests, and I use the Gemini API in several projects.' },
  { keys: ['remote', 'work independently', 'asynchronous', 'async', 'self-manage'],
    answer: () => 'I have worked remotely and asynchronously for years: freelance clients through Mostaql and direct, and as co-founder of LM Smart Solutions. I write clear updates and ask questions early.' },
  { keys: ['take over', 'someone else', 'legacy code', 'existing codebase', 'unfinished'],
    answer: () => 'On bagijob.com I took over an unfinished codebase, shipped the outstanding features (scroll-aware video autoplay, cross-device dark-mode persistence, payment redirects) and wrote a technical roadmap.' },
  { keys: ['why are you looking', 'why leaving', 'why new role', 'what prompted', 'why change'],
    answer: () => 'I want to grow on a product team and work with an experienced engineering group while I finish my CS degree, and I enjoy shipping software that real users depend on.' },
  { keys: ['why this role', 'why do you want', 'why us', 'why are you interested', 'good fit', 'why you', 'tell us about yourself', 'cover letter', 'motivation'],
    answer: ctx => ctx.cover || 'Open the cover note for this job in this pack and shorten it to fit the box. (No cover note drafted yet for this job.)' },
];

export function answerQuestion(question, ctx) {
  const q = (question || '').trim();
  if (!q) return null;
  if (/how long|how many years|years of/i.test(q) && /node/i.test(q)) {
    return { kind: 'bank', text: 'About 1 year professionally with Node.js (freelance, Aug 2025 to Feb 2026, including NestJS on bagijob.com and an Express API for a school-management client), plus about 3 years building software that includes Node/Express projects from my ALX program. (Do not say "2+ years of Node" unless you can name paid work before Aug 2025.)' };
  }
  const isTech = /experience|familiar|proficien|worked with|used|knowledge|skills?|comfortable|do you (know|have)|years/.test(q.toLowerCase());
  if (isTech) {
    const t = techAnswer(q);
    if (t) return { kind: 'tech', text: t };
  }
  for (const rule of RULES) {
    if (rule.keys.some(k => has(q, k))) return { kind: 'bank', text: rule.answer(ctx) };
  }
  const t = techAnswer(q);
  if (t) return { kind: 'tech', text: t };
  return { kind: 'none', text: 'No ready answer for this one. Do not guess: ask Claude to draft it from the posting and your fact bank.' };
}
