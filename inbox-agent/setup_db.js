const { Client } = require('pg');

const connectionString = 'postgresql://postgres:sPNC756GHGkkM0yX@db.wpxtstbquvbsiqgoqwma.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const setupDB = async () => {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Create the jobs table
    await client.query(`
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
    `);
    console.log('Jobs table created successfully.');

    // Seed data
    const jobs = [
      {
        id: "job-1", title: "Backend Engineer", company: "Instabug", companyLink: "https://instabug.com/careers", companySummary: "Instabug empowers mobile teams to monitor, identify, and resolve issues. The engineering team builds highly concurrent microservices handling billions of events.", companyLogo: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Instabug_Logo.png", location: "Cairo", model: "Hybrid", fitScore: 95, atsMatch: 88, gapRisk: "Low", status: "Pending Review", appliedDate: null, salary: "25k-30k EGP", resumeVersion: "backend_resume.md", responsibilities: JSON.stringify(["Develop REST APIs using Node.js", "Optimize database queries", "Integrate third-party services"])
      },
      {
        id: "job-2", title: "Junior Software Engineer (Backend)", company: "Paymob", companyLink: "https://paymob.com/careers", companySummary: "Paymob is an infrastructure technology enabler providing payment solutions across the MENA region. You will work on scalable fintech APIs.", companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Paymob_logo.svg/512px-Paymob_logo.svg.png", location: "Cairo", model: "Hybrid", fitScore: 89, atsMatch: 82, gapRisk: "Low", status: "Applied", appliedDate: "2026-05-30", salary: "Unlisted", resumeVersion: "backend_resume.md", responsibilities: JSON.stringify(["Build scalable fintech APIs", "Collaborate with frontend teams", "Ensure system security"])
      },
      {
        id: "job-3", title: "Software Engineer (C/C++)", company: "Valeo", companyLink: "https://www.valeo.com/en/careers/", companySummary: "Valeo is an automotive supplier and partner to automakers worldwide. The Cairo R&D center focuses on deep software tech for autonomous driving.", companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Valeo_Logo.svg/512px-Valeo_Logo.svg.png", location: "Smart Village, Giza", model: "Hybrid", fitScore: 75, atsMatch: 60, gapRisk: "Medium", status: "Pending Review", appliedDate: null, salary: "Unlisted", resumeVersion: "swe_resume.md", responsibilities: JSON.stringify(["Develop embedded C/C++ software", "Test and validate automotive systems"])
      }
    ];

    for (let job of jobs) {
      await client.query(`
        INSERT INTO jobs (id, title, company, "companyLink", "companySummary", "companyLogo", location, model, "fitScore", "atsMatch", "gapRisk", status, "appliedDate", salary, "resumeVersion", responsibilities)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING;
      `, [job.id, job.title, job.company, job.companyLink, job.companySummary, job.companyLogo, job.location, job.model, job.fitScore, job.atsMatch, job.gapRisk, job.status, job.appliedDate, job.salary, job.resumeVersion, job.responsibilities]);
    }
    console.log('Seed data inserted.');

  } catch (err) {
    console.error('Error setting up DB:', err);
  } finally {
    await client.end();
  }
};

setupDB();
