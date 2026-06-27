import React, { useState } from 'react';

const SALARY_DB = [
  { match: ['senior', 'lead', 'staff', 'principal'], min: 25000, max: 45000, currency: 'EGP', remote_usd: [4000, 7000] },
  { match: ['junior', 'associate', 'entry'], min: 12000, max: 22000, currency: 'EGP', remote_usd: [2000, 4000] },
  { match: ['intern', 'internship', 'trainee'], min: 3000, max: 8000, currency: 'EGP', remote_usd: [800, 2000] },
  { match: ['fullstack', 'full-stack', 'full stack'], min: 18000, max: 35000, currency: 'EGP', remote_usd: [3000, 6000] },
  { match: ['backend', 'back-end', 'back end', 'node', 'api'], min: 15000, max: 32000, currency: 'EGP', remote_usd: [2500, 5500] },
  { match: ['frontend', 'front-end', 'react', 'vue', 'angular'], min: 12000, max: 28000, currency: 'EGP', remote_usd: [2000, 5000] },
  { match: ['data', 'ml', 'machine learning', 'ai', 'computer vision'], min: 18000, max: 40000, currency: 'EGP', remote_usd: [3500, 7000] },
  { match: ['devops', 'cloud', 'aws', 'azure', 'kubernetes'], min: 22000, max: 45000, currency: 'EGP', remote_usd: [4000, 8000] },
];

const DEFAULT = { min: 14000, max: 28000, currency: 'EGP', remote_usd: [2500, 5000] };

const getBenchmark = (title = '', location = '') => {
  const t = (title + ' ' + location).toLowerCase();
  const isRemote = t.includes('remote') || t.includes('global');
  const match = SALARY_DB.find(r => r.match.some(k => t.includes(k))) || DEFAULT;
  return { ...match, isRemote };
};

const Bar = ({ label, value, max, color }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
      <span>{label}</span>
      <span style={{ fontWeight: '700', color }}>{value}</span>
    </div>
    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, (parseInt(value) / max) * 100)}%`, background: color, borderRadius: '3px' }} />
    </div>
  </div>
);

const SalaryIntelligence = ({ jobs = [] }) => {
  const [search, setSearch] = useState('');

  const pending = jobs.filter(j => j.status === 'Pending' || j.status === 'Queued for Bot' || j.status === 'Applied');
  const display = search.trim()
    ? pending.filter(j => (j.title || '').toLowerCase().includes(search.toLowerCase()) || (j.company || '').toLowerCase().includes(search.toLowerCase()))
    : pending.slice(0, 12);

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '4px' }}>💰 Salary Intelligence</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Market salary benchmarks for your pipeline jobs based on role and location.</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by job title or company..."
          style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box' }} />
      </div>

      {display.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs in pipeline yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {display.map(job => {
            const bm = getBenchmark(job.title, job.location || '');
            return (
              <div key={job.id} className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem' }}>{job.title || 'Software Engineer'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{job.company || job.companySummary} · {job.location || 'Egypt'}</div>
                </div>
                {bm.isRemote ? (
                  <>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.08em', marginBottom: '8px' }}>REMOTE RANGE (USD/mo)</div>
                    <Bar label="Floor" value={`$${bm.remote_usd[0].toLocaleString()}`} max={bm.remote_usd[1] * 1.3} color="#f59e0b" />
                    <Bar label="Ceiling" value={`$${bm.remote_usd[1].toLocaleString()}`} max={bm.remote_usd[1] * 1.3} color="#10b981" />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.08em', marginBottom: '8px' }}>EGYPT MARKET RANGE (EGP/mo)</div>
                    <Bar label="Floor" value={`${bm.min.toLocaleString()} EGP`} max={bm.max * 1.3} color="#f59e0b" />
                    <Bar label="Ceiling" value={`${bm.max.toLocaleString()} EGP`} max={bm.max * 1.3} color="#10b981" />
                  </>
                )}
                {job.salary && job.salary !== 'Undisclosed' && (
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.08)', padding: '4px 10px', borderRadius: '6px' }}>
                    Listed: {job.salary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SalaryIntelligence;
