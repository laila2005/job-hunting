import React, { useState, useMemo } from 'react';
import JobModal from './JobModal';

const JobBoard = ({ jobs, onApprove, onDecline, onStartInterview }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        if (activeFilter !== 'All' && job.status !== activeFilter) return false;
        if (searchQuery && !job.company.toLowerCase().includes(searchQuery.toLowerCase()) && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)); // Sort by Fit Score High to Low
  }, [jobs, activeFilter, searchQuery]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search jobs by company or title..." 
          className="search-input"
          style={{ width: '300px', marginBottom: 0 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="tabs-container">
          {['All', 'Pending Review', 'Needs Input', 'Applied', 'Rejected'].map(tab => (
            <button 
              key={tab} 
              className={`tab-btn ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="list-grid">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">No jobs found matching your filters.</div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-main">
                <div className="job-logo">
                  {job.companyLogo ? <img src={job.companyLogo} alt={job.company} /> : <span style={{fontSize: '24px'}}>🏢</span>}
                </div>
                <div className="item-details">
                  <h3 className="job-title">
                    {job.title}
                    <span className={`status-badge badge-${job.status.toLowerCase().replace(' ', '-')}`}>
                      {job.status}
                    </span>
                  </h3>
                  <div className="job-meta">
                    <span className="meta-item"><strong>{job.company}</strong></span>
                    <span className="meta-item">• {job.location} ({job.model})</span>
                    <span className="meta-item">• {job.salary}</span>
                    <span className="badge badge-primary">{job.type}</span>
                    {job.aqs_score && (
                      <span className={`badge ${job.aqs_score >= 90 ? 'badge-primary' : job.aqs_score >= 80 ? 'badge-secondary' : ''}`} style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                        AQS: {job.aqs_score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="item-actions" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                {job.status === 'Applied' && job.proof_url && (
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px' }}
                    onClick={() => setSelectedJob(job)}
                  >
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Proof</span>
                    <img 
                      src={job.proof_url} 
                      alt="Proof" 
                      style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                )}
                <div className="item-score-block" style={{textAlign: 'center'}}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>FIT SCORE</div>
                  <div className="text-success" style={{ fontSize: '20px', fontWeight: 'bold' }}>{job.fitScore || '85'}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => setSelectedJob(job)}>Review Details</button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedJob && (
        <JobModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          onApprove={onApprove}
          onDecline={onDecline}
          onStartInterview={onStartInterview}
        />
      )}
    </div>
  );
};

export default JobBoard;
