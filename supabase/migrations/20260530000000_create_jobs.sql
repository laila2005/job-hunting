CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  "companyLink" text,
  "companySummary" text,
  "companyLogo" text,
  location text,
  model text,
  "fitScore" integer,
  "atsMatch" integer,
  "gapRisk" text,
  status text,
  "appliedDate" text,
  salary text,
  "resumeVersion" text,
  responsibilities jsonb
);

INSERT INTO jobs (id, title, company, "companyLink", "companySummary", "companyLogo", location, model, "fitScore", "atsMatch", "gapRisk", status, "appliedDate", salary, "resumeVersion", responsibilities)
VALUES 
('job-1', 'Backend Engineer', 'Instabug', 'https://instabug.com/careers', 'Instabug empowers mobile teams.', 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Instabug_Logo.png', 'Cairo', 'Hybrid', 95, 88, 'Low', 'Pending Review', null, '25k-30k EGP', 'backend_resume.md', '["Develop REST APIs using Node.js", "Optimize database queries"]'),
('job-2', 'Junior Software Engineer (Backend)', 'Paymob', 'https://paymob.com/careers', 'Paymob is a fintech enabler.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Paymob_logo.svg/512px-Paymob_logo.svg.png', 'Cairo', 'Hybrid', 89, 82, 'Low', 'Applied', '2026-05-30', 'Unlisted', 'backend_resume.md', '["Build scalable fintech APIs"]');
