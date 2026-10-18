import React, { useState, useMemo } from 'react';
import JobModal from './JobModal';
import ApplyToday from './ApplyToday';

// Locations within Laila's commute range (East / North Cairo)
const NEAR_ME_KEYWORDS = [
  'new cairo', 'fifth settlement', '5th settlement', '5th settelment', 'التجمع',
  'nasr city', 'مدينة نصر', 'maadi', 'المعادي', 'heliopolis', 'مصر الجديدة',
  'shorouk', 'الشروق', 'rehab', 'الرحاب', 'mostakbal', 'المستقبل',
  'north 90', 'south 90', 'zahraa', 'hyde park', 'katameya', 'القطامية',
  'obour', 'العبور', 'badr', 'بدر',
];

// Remote / work-from-home signals
const REMOTE_KEYWORDS = ['remote', 'work from home', 'wfh', 'fully remote', 'anywhere', 'distributed'];

// US-only signals in location or notes
const US_ONLY_KEYWORDS = [
  'united states', ', usa', '- usa', '(usa)', 'new york, ny', 'san francisco',
  'los angeles', ', ca', ', ny', ', tx', ', fl', ', wa', ', il',
  'chicago', 'boston', 'seattle', 'austin', 'denver', 'atlanta',
  'us only', 'us citizens only', 'must reside in the us', 'authorized to work in the us',
  'must be located in the us', 'based in the us',
];

const locStr = job => `${job.location || ''} ${job.model || ''} ${job.notes || ''} ${job.companySummary || ''}`.toLowerCase();

const isRemoteJob  = job => REMOTE_KEYWORDS.some(k => locStr(job).includes(k));
const isUSOnly     = job => US_ONLY_KEYWORDS.some(k => locStr(job).includes(k));
const isNearMe     = job => {
  const s = locStr(job);
  if (isUSOnly(job)) return false;
  if (isRemoteJob(job)) return true;
  if (NEAR_ME_KEYWORDS.some(k => s.includes(k))) return true;
  // Accept generic "cairo" only when not hinting at distant districts
  const farDistricts = ['sheikh zayed', 'الشيخ زايد', '6 october', 'sixth of october', 'giza', 'الجيزة', '6th october', 'imbaba', 'dokki', 'mohandeseen', 'haram', 'faisal', 'hadayek'];
  if (s.includes('cairo') && !farDistricts.some(k => s.includes(k))) return true;
  return false;
};

// ── Date handling: the jobs table has no date column, so the found-date lives inside the id
//    (trk-YYYY-MM-DD-… from the tracker sync, or job-…-<epoch ms> from the scraper / manual add).
const ARCHIVE_BEFORE = '2026-10-16'; // anything found before this date is "old" unless it was applied to
const jobDate = job => {
  const id = job.id || '';
  const iso = id.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const ms = id.match(/(\d{13})/);
  if (ms) return new Date(Number(ms[1])).toISOString().slice(0, 10);
  return job.appliedDate || null;
};
const sectionOf = job => {
  // Old rows (found before ARCHIVE_BEFORE) were never applied to by hand, whatever their stored status says.
  const d = jobDate(job);
  if (!d || d < ARCHIVE_BEFORE) return 'Archived';
  const st = (job.status || '').trim().toLowerCase();
  if (['applied', 'test', 'interview', 'offer'].includes(st)) return 'Applied';
  if (st === 'rejected' || st === 'archived') return 'Archived';
  return 'Active';
};
// companyLink comes from scraped / user-submitted rows, so only allow http(s) URLs in hrefs
const safeUrl = u => { try { const p = new URL(u); return ['http:', 'https:'].includes(p.protocol) ? p.href : null; } catch { return null; } };
const dayLabel = d => {
  if (!d) return 'Undated';
  const dt = new Date(`${d}T12:00:00Z`);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

const JobBoard = ({ jobs, onApprove, onDecline, onMarkApplied, onStartInterview }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalTab, setModalTab] = useState('overview');
  const openJob = (job, tab = 'overview') => { setModalTab(tab); setSelectedJob(job); };
  const [activeFilter, setActiveFilter] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [hideUSOnly, setHideUSOnly] = useState(true);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const counts = useMemo(() => jobs.reduce((acc, j) => { const k = sectionOf(j); acc[k] = (acc[k] || 0) + 1; return acc; }, {}), [jobs]);
  const newestDate = useMemo(() => jobs.map(jobDate).filter(Boolean).sort().pop() || null, [jobs]);

  // Filtered jobs, newest date first, best fit first inside a day
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        if (activeFilter !== 'All' && sectionOf(job) !== activeFilter) return false;
        const q = searchQuery.toLowerCase();
        if (q && !(job.company || '').toLowerCase().includes(q) && !(job.title || '').toLowerCase().includes(q)) return false;
        if (nearMeOnly && !isNearMe(job)) return false;
        if (hideUSOnly && isUSOnly(job)) return false;
        return true;
      })
      .sort((a, b) => {
        const da = (activeFilter === 'Applied' ? (a.appliedDate || jobDate(a)) : jobDate(a)) || '';
        const db = (activeFilter === 'Applied' ? (b.appliedDate || jobDate(b)) : jobDate(b)) || '';
        if (da !== db) return db.localeCompare(da);
        return (b.fitScore || 0) - (a.fitScore || 0);
      });
  }, [jobs, activeFilter, searchQuery, nearMeOnly, hideUSOnly]);

  const groups = useMemo(() => {
    const map = new Map();
    filteredJobs.forEach(j => {
      const d = (activeFilter === 'Applied' ? (j.appliedDate || jobDate(j)) : jobDate(j)) || '';
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(j);
    });
    return [...map.entries()];
  }, [filteredJobs, activeFilter]);

  const usOnlyCount  = useMemo(() => jobs.filter(isUSOnly).length, [jobs]);
  const nearMeCount  = useMemo(() => jobs.filter(isNearMe).length, [jobs]);

  return (
    <div>
      {activeFilter === 'Active' && !searchQuery && <ApplyToday jobs={jobs} onOpen={openJob} />}

      <div className="job-board-header">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs by company or title..."
            className="search-input job-search-input-with-icon"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Location smart filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '8px 0 2px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>LOCATION:</span>

          <button onClick={() => setNearMeOnly(v => !v)} style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600',
            border: nearMeOnly ? '1px solid #10b981' : '1px solid var(--border-color)',
            background: nearMeOnly ? 'rgba(16,185,129,0.12)' : 'transparent',
            color: nearMeOnly ? '#10b981' : 'var(--text-muted)',
          }}>
            📍 Near Me {nearMeCount > 0 && <span style={{ opacity: 0.75, fontWeight: '400' }}>({nearMeCount})</span>}
          </button>

          <button onClick={() => setHideUSOnly(v => !v)} style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600',
            border: hideUSOnly ? '1px solid #ef4444' : '1px solid var(--border-color)',
            background: hideUSOnly ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: hideUSOnly ? '#ef4444' : 'var(--text-muted)',
          }}>
            🚫 Hide US-Only {usOnlyCount > 0 && <span style={{ opacity: 0.75, fontWeight: '400' }}>({usOnlyCount} hidden)</span>}
          </button>

          {(nearMeOnly || hideUSOnly) && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Showing {filteredJobs.length} jobs
            </span>
          )}
        </div>

        <div className="tabs-container">
          {['Active', 'Applied', 'Archived', 'All'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab === 'Active' ? '🆕 Active' : tab === 'Applied' ? '✅ Applied' : tab === 'Archived' ? '🗄️ Archived' : tab}
              {tab !== 'All' && <span style={{ opacity: 0.7, marginLeft: 6 }}>({counts[tab] || 0})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="list-grid">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">No jobs found matching your filters.</div>
        ) : groups.map(([day, dayJobs]) => (
          <React.Fragment key={day || 'undated'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 2px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <span>📅 {dayLabel(day)}</span>
              {day && day === newestDate && activeFilter !== 'Archived' && <span style={{ background: '#10b981', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.68rem' }}>NEWEST</span>}
              <span style={{ fontWeight: 400, opacity: 0.7 }}>{dayJobs.length} job{dayJobs.length === 1 ? '' : 's'}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>
            {dayJobs.map(job => {
            const isManual = (job.id || '').includes('manual') || (job.source || '') === 'Manual';
            const isTracker = (job.id || '').startsWith('trk-');
            return (
            <div key={job.id} className="job-card">
              <div className="job-card-main">
                <div className="job-logo">
                  {job.companyLogo ? <img src={job.companyLogo} alt={job.company} /> : <span style={{fontSize: '24px'}}>🏢</span>}
                </div>
                <div className="item-details">
                  <h3 className="job-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {job.title}
                    <span className={`status-badge badge-${(job.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                      {job.status}
                    </span>
                    <span className="status-badge" style={{ backgroundColor: isTracker ? '#0d9488' : isManual ? 'var(--accent-purple)' : 'var(--accent-blue)', color: '#fff', fontSize: '11px', opacity: 0.9 }}>
                      {isTracker ? '🔎 Curated' : isManual ? '👤 Manual Add' : '⚡ Auto-Scraped'}
                    </span>
                  </h3>
                  <div className="job-meta">
                    <span className="meta-item"><strong>{job.company}</strong></span>
                    <span className="meta-item">• {job.location} ({job.model})</span>
                    <span className="meta-item">• {job.salary}</span>
                    <span className="badge badge-type-chip">{job.type}</span>
                    {job.aqs_score && (
                      <span className={`badge badge-aqs ${job.aqs_score >= 90 ? 'badge-high' : 'badge-mid'}`}>
                        AQS: {job.aqs_score}
                      </span>
                    )}
                    {job.status === 'Applied' && job.appliedDate && (
                      <span className="meta-item" style={{ color: 'var(--accent-green)', fontWeight: '600' }}>
                        ✅ Applied: {formatDate(job.appliedDate)}
                      </span>
                    )}
                    {safeUrl(job.companyLink) && (
                      <a className="meta-item" href={safeUrl(job.companyLink)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        🔗 Open posting
                      </a>
                    )}
                    <ResumeTag title={job.title} resumeVersion={job.resumeVersion} />
                  </div>
                </div>
              </div>
              
              <div className="job-actions-container">
                {job.status === 'Applied' && job.proof_url && (
                  <div className="proof-indicator" onClick={() => openJob(job)}>
                    <span className="proof-label">Proof</span>
                    <img src={job.proof_url} alt="Proof" className="proof-thumbnail" />
                  </div>
                )}
                
                <div className="item-score-block">
                  <div className="fit-score-ring">
                    <span className="fit-score-val">{job.fitScore || '85'}</span>
                    <span className="fit-score-lbl">FIT</span>
                  </div>
                </div>
                
                <button className="btn btn-secondary review-btn" onClick={() => openJob(job)}>Review Details</button>
              </div>
            </div>
            );
            })}
          </React.Fragment>
        ))}
      </div>

      {selectedJob && (
        <JobModal 
          job={selectedJob}
          initialTab={modalTab}
          onClose={() => setSelectedJob(null)} 
          onApprove={onApprove}
          onDecline={onDecline}
          onMarkApplied={onMarkApplied}
          onStartInterview={onStartInterview}
        />
      )}
    </div>
  );
};

const RESUME_RULES = [
  { keywords: ['backend', 'back-end', 'back end', 'node', 'api', 'django', 'flask', 'spring', 'asp.net'], label: '📄 Backend Resume', color: '#3b82f6' },
  { keywords: ['fullstack', 'full-stack', 'full stack', 'react', 'next.js', 'vue', 'angular'], label: '📄 Fullstack Resume', color: '#8b5cf6' },
  { keywords: ['intern', 'internship', 'junior', 'graduate', 'entry'], label: '📄 Internship Resume', color: '#10b981' },
  { keywords: ['data', 'ml', 'machine learning', 'ai ', 'python', 'analyst'], label: '📄 Data/AI Resume', color: '#f59e0b' },
];

const ResumeTag = ({ title = '', resumeVersion }) => {
  const t = title.toLowerCase();
  const match = RESUME_RULES.find(r => r.keywords.some(k => t.includes(k)));
  const label = resumeVersion ? `📄 ${resumeVersion}` : (match ? match.label : '📄 General Resume');
  const color = match ? match.color : '#6b7280';
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: '600', color, background: `${color}18`, padding: '2px 8px', borderRadius: '10px', border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
};

export default JobBoard;
