import React, { useState } from 'react';

const JobModal = ({ job, onClose, onApprove, onDecline, onStartInterview }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="job-logo" style={{ width: '64px', height: '64px' }}>
              {job.companyLogo ? <img src={job.companyLogo} alt={job.company} /> : <span style={{fontSize:'32px'}}>🏢</span>}
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{job.title}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-main)' }}>{job.company}</strong>
                <span>• {job.location}</span>
                <span className={`status-badge badge-${job.status.toLowerCase().replace(' ', '-')}`}>{job.status}</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-tabs">
          <div className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </div>
          <div className={`modal-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            AI Analysis
          </div>
          {job.status === 'Applied' && (
            <div className={`modal-tab ${activeTab === 'proof' ? 'active' : ''}`} onClick={() => setActiveTab('proof')}>
              Application Proof
            </div>
          )}
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', margin: '0 0 12px 0' }}>Company Context</h4>
                <p style={{ lineHeight: '1.6' }}>{job.companySummary || 'No detailed summary provided for this position.'}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Work Model</h4>
                  <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{job.model}</div>
                </div>
                <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Salary</h4>
                  <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--accent-green)' }}>{job.salary}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', background: 'var(--bg-hover)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{job.fitScore}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Fit Score</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ATS Match Probability</span>
                    <span style={{ fontWeight: 'bold' }}>{job.atsMatch}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${job.atsMatch}%`, height: '100%', background: 'var(--accent-blue)' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Candidate Gap Risk</span>
                    <span style={{ fontWeight: 'bold', color: job.gapRisk === 'Low' ? 'var(--accent-green)' : '#F59E0B' }}>{job.gapRisk}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', margin: '0 0 12px 0' }}>Recommended Asset</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{job.resumeVersion}</div>
                    <div 
                      style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', cursor: 'pointer' }}
                      onClick={() => alert('This PDF is generated securely on your local machine by the Auto-Apply bot at runtime. It will be automatically attached when the application is submitted.')}
                    >
                      View dynamically generated resume
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'proof' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Visual verification of the successfully submitted application.</p>
              <div 
                style={{ 
                  width: '100%', 
                  height: '250px', 
                  backgroundImage: `url(${job.proof_url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                }}
                onClick={() => setLightboxOpen(true)}
              >
                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                  🔍 Click to Expand
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <a href={job.companyLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginRight: 'auto' }}>
            🔗 View Source Posting
          </a>
          
          {job.status === 'Pending Review' && (
            <>
              <button className="btn btn-secondary" style={{ color: 'var(--accent-red)' }} onClick={() => { onDecline(job.id); onClose(); }}>Decline Role</button>
              <button className="btn" style={{ background: 'var(--accent-green)' }} onClick={() => { onApprove(job.id); onClose(); }}>Auto-Apply Now</button>
            </>
          )}
          
          <button className="btn" style={{ background: 'var(--accent-purple)' }} onClick={() => { onStartInterview(job); onClose(); }}>🎙️ Practice Interview</button>
        </div>
      </div>

      {lightboxOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.95)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}>
          <img src={job.proof_url} alt="Proof Full" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} />
          <div style={{ position: 'absolute', top: '20px', right: '30px', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</div>
        </div>
      )}
    </div>
  );
};

export default JobModal;
