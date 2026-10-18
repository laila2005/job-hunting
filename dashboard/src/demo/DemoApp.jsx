import { useState } from 'react';
import JobBoard from '../components/JobBoard';
import { demoJobs } from './demoData';

const box = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 18px' };

// Recruiter demo: the real job-board components running on invented sample data, entirely in memory.
// No network calls, no database access, no login. Refreshing the page resets everything.
export default function DemoApp({ onExit }) {
  const [jobs, setJobs] = useState(demoJobs);
  const today = new Date().toISOString().slice(0, 10);

  const markApplied = id => setJobs(js => js.map(j => (j.id === id ? { ...j, status: 'Applied', appliedDate: today } : j)));
  const restore = id => setJobs(js => js.map(j => (j.id === id ? { ...j, status: 'To Apply', appliedDate: null } : j)));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark, #0b1020)', color: 'var(--text-main, #fff)', padding: '16px 16px 80px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ ...box, borderColor: 'rgba(245,158,11,0.5)', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong>👀 Live demo with sample data</strong>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #9ca3af)' }}>
              Every company and reply below is made up. Nothing here connects to a real account. Click around: it resets when you refresh.
            </div>
          </div>
          {onExit && <button className="btn btn-secondary" onClick={onExit}>Back to sign-in</button>}
        </div>

        <div style={box}>
          <h2 style={{ margin: '0 0 6px' }}>Job Search Command Center</h2>
          <p style={{ margin: '0 0 8px', color: 'var(--text-muted, #9ca3af)', fontSize: '0.92rem' }}>
            A personal job-hunting platform I built end to end: React + Vite front end, Supabase (Postgres, Auth, Realtime) back end,
            Python and Node automation, and a nightly agent that finds jobs, tailors CVs and checks the inbox.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li><strong>Jobs grouped by date</strong>, newest first, with Active / Applied / Archived views.</li>
            <li><strong>Apply today</strong>: ranks jobs by fit, deadline, competition and eligibility.</li>
            <li><strong>Apply pack per job</strong>: tailored CV, cover note, form answers and an honest gaps list. Open any job and look at the 🎒 tab.</li>
            <li><strong>Interview prep per job</strong>, <strong>inbox replies</strong> and <strong>follow-up reminders</strong>.</li>
            <li>Built-in security: login wall, row-level security on the database, link and input sanitising.</li>
          </ul>
        </div>

        <JobBoard
          jobs={jobs}
          demo
          onMarkApplied={markApplied}
          onRestore={restore}
          onStartInterview={() => window.alert('Interview practice uses an AI key and is switched off in the demo.')}
        />
      </div>
    </div>
  );
}
