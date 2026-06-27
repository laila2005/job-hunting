import React, { useState, useMemo } from 'react';

const REGIONS = ['All', 'Egypt / Cairo', 'Remote (Global)', 'Europe', 'UAE / Gulf', 'US / Canada'];

const classifyRegion = (location = '', title = '', notes = '') => {
  const t = (location + ' ' + title + ' ' + notes).toLowerCase();
  if (t.includes('remote') || t.includes('global') || t.includes('worldwide') || t.includes('anywhere')) return 'Remote (Global)';
  if (t.includes('uae') || t.includes('dubai') || t.includes('gulf') || t.includes('saudi') || t.includes('qatar') || t.includes('riyadh')) return 'UAE / Gulf';
  if (t.includes('europe') || t.includes('germany') || t.includes('netherlands') || t.includes('uk') || t.includes('london') || t.includes('berlin') || t.includes('amsterdam')) return 'Europe';
  if (t.includes('us') || t.includes('usa') || t.includes('canada') || t.includes('new york') || t.includes('san francisco') || t.includes('toronto')) return 'US / Canada';
  return 'Egypt / Cairo';
};

const REGION_COLORS = {
  'Remote (Global)': { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', icon: '🌍' },
  'UAE / Gulf':       { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', icon: '🇦🇪' },
  'Europe':           { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6', icon: '🇪🇺' },
  'US / Canada':      { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', icon: '🇺🇸' },
  'Egypt / Cairo':    { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', icon: '🇪🇬' },
};

const GlobalJobRadar = ({ jobs = [], onApprove, onDecline, onMarkApplied }) => {
  const [region, setRegion] = useState('All');
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => jobs.map(j => ({ ...j, region: classifyRegion(j.location, j.title, j.notes || j.companySummary || '') })), [jobs]);

  const counts = useMemo(() => {
    const c = {};
    REGIONS.slice(1).forEach(r => { c[r] = enriched.filter(j => j.region === r).length; });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => enriched.filter(j => {
    if (region !== 'All' && j.region !== region) return false;
    if (search && !(j.company || '').toLowerCase().includes(search.toLowerCase()) && !(j.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [enriched, region, search]);

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '4px' }}>🌍 Global Job Radar</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All {jobs.length} tracked jobs mapped by region. {enriched.filter(j => j.region === 'Remote (Global)').length} remote opportunities.</p>
      </div>

      {/* Region summary pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {REGIONS.slice(1).map(r => {
          const col = REGION_COLORS[r];
          return (
            <button key={r} onClick={() => setRegion(r === region ? 'All' : r)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', border: region === r ? `1px solid ${col.text}` : '1px solid var(--border-color)', background: region === r ? col.bg : 'transparent', color: region === r ? col.text : 'var(--text-secondary)', fontWeight: region === r ? '700' : '400', transition: 'all 0.2s' }}>
              <span>{col.icon}</span>
              <span>{r}</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700' }}>{counts[r] || 0}</span>
            </button>
          );
        })}
        {region !== 'All' && (
          <button onClick={() => setRegion('All')} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)' }}>✕ Clear</button>
        )}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or title..."
        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '16px' }} />

      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found for this region.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(job => {
            const col = REGION_COLORS[job.region] || REGION_COLORS['Egypt / Cairo'];
            return (
              <div key={job.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${col.text}`, borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem' }}>{job.title || 'Software Engineer'}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', background: col.bg, color: col.text }}>{col.icon} {job.region}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>{job.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{job.company || job.companySummary} · {job.location || 'Location unspecified'}</div>
                  {job.salary && job.salary !== 'Undisclosed' && (
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>💰 {job.salary}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)', textDecoration: 'none' }}>View</a>}
                  {job.status === 'Pending' && onApprove && (
                    <button onClick={() => onApprove(job.id)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Approve</button>
                  )}
                  {(job.status === 'Queued for Bot' || job.status === 'Pending') && onMarkApplied && (
                    <button onClick={() => onMarkApplied(job.id)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.3)' }}>Mark Applied</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlobalJobRadar;
