import React, { useState } from 'react';
import JobModal from './JobModal';

const getScoreColor = (score) => {
  if (score >= 80) return 'var(--success)';
  if (score >= 65) return 'var(--warning)';
  return 'var(--danger)';
};

const JobBoard = ({ jobs, onApprove }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const getStatusClass = (status) => {
    if (status === 'Needs Input') return 'status-needs-input';
    if (status === 'Applied') return 'status-applied';
    if (status === 'Pending Review') return 'status-pending';
    return '';
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {filteredJobs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No jobs found matching your filters.</p>
        ) : filteredJobs.map(job => (
          <div key={job.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
              {job.companyLogo && (
                <img 
                  src={job.companyLogo} 
                  alt={job.company} 
                  style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#fff', borderRadius: '8px', padding: '4px' }} 
                />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{job.title}</h3>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: '1px solid transparent'
                  }} className={getStatusClass(job.status)}>
                    {job.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {job.company} • {job.location} ({job.model}) • {job.salary}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fit Score</div>
                <div style={{ 
                  color: getScoreColor(job.fitScore), 
                  fontWeight: '800', 
                  fontSize: '1.5rem' 
                }}>
                  {job.fitScore}
                </div>
              </div>

              <button onClick={() => setSelectedJob(job)}>Review Details</button>
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
      />
    </div>
  );
};

export default JobBoard;
