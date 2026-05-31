import React, { useState } from 'react';
import JobModal from './JobModal';

const getScoreColor = (score) => {
  if (score >= 80) return 'var(--success)';
  if (score >= 65) return 'var(--warning)';
  return 'var(--danger)';
};

const JobBoard = ({ jobs, onApprove, onDecline }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const getStatusClass = (status) => {
    if (status === 'Needs Input') return 'badge badge-needs-input';
    if (status === 'Applied') return 'badge badge-applied';
    if (status === 'Pending Review') return 'badge badge-pending';
    return 'badge';
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || job.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontWeight: '600' }}>Active Pipeline</h2>
      </div>

      <input 
        type="text" 
        className="search-input" 
        placeholder="Search jobs by company or title..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="tabs-container">
        {['All', 'Pending Review', 'Needs Input', 'Applied', 'Rejected'].map(tab => (
          <button 
            key={tab} 
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="list-grid">
        {filteredJobs.length === 0 ? (
          <p className="empty-state">No jobs found matching your filters.</p>
        ) : filteredJobs.map(job => (
          <div key={job.id} className="premium-card item-card">
            
            <div className="item-main">
              {job.companyLogo && (
                <img 
                  src={job.companyLogo} 
                  alt={job.company} 
                  className="item-logo"
                />
              )}
              <div className="item-details">
                <div className="item-title-row">
                  <h3 className="item-title">{job.title}</h3>
                  <span className={getStatusClass(job.status)}>
                    {job.status}
                  </span>
                </div>
                <p className="item-meta">
                  {job.company} • {job.location} ({job.model}) • {job.salary}
                </p>
              </div>
            </div>

            <div className="item-actions">
              {job.status === 'Applied' && job.proof_url && (
                <div 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px' }}
                  onClick={() => setSelectedJob(job)}
                >
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Proof</span>
                  <img 
                    src={job.proof_url} 
                    alt="Proof" 
                    style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
              )}
              <div className="item-score-block">
                <div className="item-score-label">Fit Score</div>
                <div className="item-score-value" style={{ color: getScoreColor(job.fitScore) }}>
                  {job.fitScore}
                </div>
              </div>

              <button className="btn" onClick={() => setSelectedJob(job)}>Review Details</button>
            </div>

          </div>
        ))}
      </div>

      <JobModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
        onApprove={(id) => {
          onApprove(id);
          setSelectedJob(null);
        }}
        onDecline={(id) => {
          onDecline(id);
          setSelectedJob(null);
        }}
      />
    </div>
  );
};

export default JobBoard;
