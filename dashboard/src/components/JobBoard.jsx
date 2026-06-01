import React, { useState, useMemo } from 'react';
import JobModal from './JobModal';

const JobBoard = ({ jobs, onApprove, onDecline, onMarkApplied, onStartInterview }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Derived filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        const normStatus = (job.status || '').trim().toLowerCase();
        const normFilter = activeFilter.trim().toLowerCase();
        
        // Exclude applied and rejected jobs from "All" tab view to keep pipeline clean
        if (normFilter === 'all') {
          if (normStatus === 'applied' || normStatus === 'rejected') return false;
        } else {
          if (normStatus !== normFilter) return false;
        }
        
        if (searchQuery && !job.company.toLowerCase().includes(searchQuery.toLowerCase()) && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.appliedDate || 0);
        const dateB = new Date(b.created_at || b.appliedDate || 0);
        if (dateB - dateA !== 0) return dateB - dateA;
        return (b.fitScore || 0) - (a.fitScore || 0);
      });
  }, [jobs, activeFilter, searchQuery]);

  return (
    <div>
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
                    <span className="badge badge-type-chip">{job.type}</span>
                    {job.aqs_score && (
                      <span className={`badge badge-aqs ${job.aqs_score >= 90 ? 'badge-high' : 'badge-mid'}`}>
                        AQS: {job.aqs_score}
                      </span>
                    )}
                    {job.status === 'Applied' && (job.appliedDate || job.created_at) && (
                      <span className="meta-item" style={{ color: 'var(--accent-green)', fontWeight: '600' }}>
                        ✅ Applied: {formatDate(job.appliedDate || job.created_at)}
                      </span>
                    )}
                    {job.status !== 'Applied' && job.created_at && (
                      <span className="meta-item" style={{ color: 'var(--accent-purple)', fontWeight: '500' }}>
                        📅 Scraped: {formatDate(job.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="job-actions-container">
                {job.status === 'Applied' && job.proof_url && (
                  <div className="proof-indicator" onClick={() => setSelectedJob(job)}>
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
                
                <button className="btn btn-secondary review-btn" onClick={() => setSelectedJob(job)}>Review Details</button>
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
          onMarkApplied={onMarkApplied}
          onStartInterview={onStartInterview}
        />
      )}
    </div>
  );
};

export default JobBoard;
