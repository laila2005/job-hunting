import React from 'react';

const JobModal = ({ job, onClose, onApprove }) => {
  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          {job.companyLogo && (
            <img 
              src={job.companyLogo} 
              alt={`${job.company} logo`} 
              style={{ width: '80px', height: '80px', objectFit: 'contain', background: '#fff', borderRadius: '12px', padding: '8px' }} 
            />
          )}
          <div>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 4px 0' }}>{job.title}</h2>
            <a href={job.companyLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: '600' }}>
              {job.company} ↗
            </a>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{job.location} • {job.model} • {job.salary}</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '12px' }}>Company Summary</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{job.companySummary}</p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>Fit Score: {job.fitScore}/100</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ATS Match: {job.atsMatch}%</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gap Risk: {job.gapRisk}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ color: 'var(--accent-hover)', marginBottom: '8px' }}>Recommended Resume</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{job.resumeVersion}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button style={{ background: 'transparent', border: '1px solid var(--text-secondary)' }} onClick={onClose}>Close</button>
          {job.status === 'Pending Review' && (
            <button style={{ background: 'var(--success)' }} onClick={() => onApprove(job.id)}>Approve & Apply</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobModal;
