// Sample data for the recruiter demo (?demo=1). Everything here is invented: fictional companies, roles and replies.
// The demo never talks to the database, so nothing real can leak through it. Dates are relative to today so it always looks fresh.
const DAY = 86400000;
const iso = offsetDays => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

const QUESTIONS = [
  { q: 'Walk me through the most complex system you have built.', hint: 'Problem, your part, scale, users, trade-offs. Use one concrete number.' },
  { q: 'Tell me about a time you took over code you did not write.', hint: 'What was unfinished, what you shipped first, how you documented it.' },
  { q: 'How many hours can you work, and when can you start?', hint: 'Be exact: hours per week, start date, overlap with their time zone.' },
  { q: 'What are your salary expectations?', hint: 'Ask about scope first, then give a monthly range in USD.' },
];

const ANSWERS = (salary) => [
  { q: 'Salary / desired pay', a: salary },
  { q: 'Availability / start date', a: 'Available in 1 week. Remote, 30 hrs/week.' },
  { q: 'Years of experience', a: '3 years building software; about 2 years professional.' },
  { q: 'Location', a: 'Remote (sample data)' },
  { q: 'English level', a: 'Fluent' },
];

const make = ({ id, day, title, company, location, salary, fit, status, appliedAgo, deadlineIn, applicants, eligibility = 'ok',
                gap = 'Medium', cover, gaps = [], events = [], notes }) => ({
  id: `trk-${iso(day)}-${id}`,
  title, company, location, model: 'Remote', salary, fitScore: fit, atsMatch: 80, gapRisk: gap,
  status, appliedDate: appliedAgo != null ? iso(-appliedAgo) : null,
  companyLink: 'https://example.com/careers',
  companySummary: notes || null,
  resumeVersion: `CV_${company.replace(/\W+/g, '')}.pdf`,
  responsibilities: {
    v: 1,
    deadline: deadlineIn != null ? iso(deadlineIn) : null,
    applicants: applicants || null,
    eligibility,
    followup_due: status === 'Applied' && appliedAgo != null ? iso(-appliedAgo + 7) : null,
    followup_msg: status === 'Applied'
      ? `Hi ${company} team, I applied for the ${title} role and wanted to follow up. I'm still very interested and happy to share more about my projects. Thank you for your time.` : null,
    email_events: events,
    pack: {
      cv: `CV_${company.replace(/\W+/g, '')}.pdf`,
      cover: cover || null,
      answers: ANSWERS(salary.includes('/mo') ? `${salary} (negotiable)` : 'USD 2,500-3,500/month, negotiable'),
      gaps,
    },
    prep: {
      company: notes || null,
      questions: QUESTIONS,
      projects: ['Sample project A: a monitoring platform with real-time alerts', 'Sample project B: an AI agent with tool calling and tests'],
      gaps,
      checklist: ['Read the brief twice.', 'Keep scope small, finish the core flow.', 'Add tests and a README.', 'Submit before the deadline.'],
    },
  },
});

const COVER = (company, role) =>
  `Hi ${company} team, I'm a full-stack engineer with 3 years building software in TypeScript, React and Node.js. For the ${role} role, my closest experience is a real-time monitoring platform running in production and an AI agent with tool calling. I'd be glad to walk you through either. (Sample cover note: the real platform writes these from a verified fact bank only.)`;

export const demoJobs = () => [
  make({ id: 'brightline-ai', day: -3, title: 'AI Product Engineer', company: 'Brightline AI', location: 'Remote, worldwide', salary: '$4-6k/mo', fit: 88, status: 'Test', appliedAgo: 3, cover: COVER('Brightline AI', 'AI Product Engineer'),
          notes: 'Series A startup building AI workflow tools for support teams.', events: [{ kind: 'test', date: iso(-1), subject: 'Next step: short coding exercise', note: 'Exercise link sent. 48 hours to finish.' }] }),
  make({ id: 'mintly', day: -8, title: 'Junior Full-Stack Engineer', company: 'Mintly', location: 'Remote, EMEA', salary: '$2-3k/mo', fit: 80, status: 'Applied', appliedAgo: 8, cover: COVER('Mintly', 'Junior Full-Stack Engineer'),
          notes: 'Personal finance app, 25 people.', events: [{ kind: 'applied', date: iso(-8), subject: 'We received your application', note: 'Confirmation received' }] }),
  make({ id: 'harbor-pay', day: -2, title: 'Junior Backend Engineer', company: 'Harbor Pay', location: 'Remote, worldwide', salary: '$3-4k/mo', fit: 78, status: 'Applied', appliedAgo: 2, cover: COVER('Harbor Pay', 'Junior Backend Engineer'),
          events: [{ kind: 'applied', date: iso(-2), subject: 'Application received', note: 'Confirmation received' }] }),

  make({ id: 'northwind-labs', day: 0, title: 'Full-Stack Engineer', company: 'Northwind Labs', location: 'Remote, EMEA', salary: '$4-5k/mo', fit: 90, status: 'To Apply', deadlineIn: 3, cover: COVER('Northwind Labs', 'Full-Stack Engineer'),
          notes: 'Closes soon. Remote-first logistics software.', gaps: ['Asks for GraphQL experience, not yet used. Say so honestly.'] }),
  make({ id: 'cobalt-retail', day: 0, title: 'Backend Developer (Node), part-time', company: 'Cobalt Retail', location: 'Remote, part-time', salary: '$1.8k/mo', fit: 82, status: 'To Apply', deadlineIn: 12, cover: COVER('Cobalt Retail', 'Backend Developer (Node)'),
          notes: 'Part-time Node.js role for a retail platform.' }),
  make({ id: 'orbit-studio', day: 0, title: 'Frontend Engineer (React)', company: 'Orbit Studio', location: 'Remote, worldwide', salary: '$3-4k/mo', fit: 76, status: 'To Apply', applicants: 240, cover: COVER('Orbit Studio', 'Frontend Engineer'),
          notes: '240+ applicants so far.' }),
  make({ id: 'lumen-health', day: -1, title: 'Full-Stack Developer', company: 'Lumen Health', location: 'Remote (eligibility to confirm)', salary: '$3-5k/mo', fit: 74, status: 'To Apply', eligibility: 'ask', cover: COVER('Lumen Health', 'Full-Stack Developer'),
          notes: 'Healthcare scheduling product. Ask the recruiter about eligibility first.', gap: 'Medium (remote eligibility unconfirmed)' }),
  make({ id: 'stackwise', day: -1, title: 'JavaScript Engineer', company: 'Stackwise', location: 'Remote, worldwide', salary: '$3.5-4.5k/mo', fit: 79, status: 'To Apply', deadlineIn: 20,
          notes: 'Developer tools company. No cover note drafted yet.' }),
  make({ id: 'pixelforge', day: -2, title: 'Full-Stack Engineer (Flutter + React)', company: 'Pixelforge', location: 'Remote, part-time', salary: '$2.5k/mo', fit: 85, status: 'To Apply', deadlineIn: 9, cover: COVER('Pixelforge', 'Full-Stack Engineer'),
          notes: 'Mobile and web studio.' }),
  make({ id: 'dataloom', day: -3, title: 'AI Engineer (Junior)', company: 'DataLoom', location: 'Remote, EMEA', salary: '$3-4.5k/mo', fit: 72, status: 'To Apply', gap: 'High (stretch role)', cover: COVER('DataLoom', 'AI Engineer'),
          notes: 'Stretch role: asks for RAG experience.', gaps: ['RAG and embeddings are not on the record. Do not claim them.'] }),
  make({ id: 'tandem-works', day: -3, title: 'Software Engineer I (Python)', company: 'Tandem Works', location: 'Remote, worldwide', salary: '$3-4k/mo', fit: 77, status: 'To Apply', deadlineIn: 25, cover: COVER('Tandem Works', 'Software Engineer I') }),
];
