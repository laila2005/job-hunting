import React, { useState } from 'react';
import ResumeViewer from './ResumeViewer';

const JobModal = ({ job, onClose, onApprove, onDecline, onMarkApplied, onStartInterview }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);

  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-main">
            <div className="job-logo" style={{ width: '64px', height: '64px' }}>
              {job.companyLogo ? <img src={job.companyLogo} alt={job.company} /> : <span style={{fontSize:'32px'}}>🏢</span>}
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{job.title}</h2>
              <div className="modal-header-meta">
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
              
              <div className="modal-grid-2col">
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
              <div className="modal-fit-summary">
                <div className="fit-score-dial-wrapper">
                  <div className="fit-score-neon-circle">
                    <svg className="fit-score-svg" viewBox="0 0 100 100">
                      <circle className="fit-score-svg-bg" cx="50" cy="50" r="40" />
                      <circle 
                        className="fit-score-svg-fill" 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        style={{ strokeDashoffset: 251.2 - (251.2 * (job.fitScore || 85)) / 100 }}
                      />
                    </svg>
                    <div className="fit-score-circle-text">
                      <span className="circle-val">{job.fitScore || '85'}</span>
                      <span className="circle-lbl">Match</span>
                    </div>
                  </div>
                  <div className="fit-score-caption">Overall AQS Fit Score</div>
                </div>
                
                <div className="fit-score-metrics">
                  <div className="metric-row">
                    <span className="metric-label">ATS Match Probability</span>
                    <span className="metric-value">{job.atsMatch}%</span>
                  </div>
                  <div className="metric-progress-track">
                    <div className="metric-progress-bar" style={{ width: `${job.atsMatch}%` }}></div>
                  </div>
                  
                  <div className="metric-row" style={{ marginTop: '16px' }}>
                    <span className="metric-label">Candidate Gap Risk</span>
                    <span className={`metric-value risk-${(job.gapRisk || 'Low').toLowerCase()}`}>{job.gapRisk}</span>
                  </div>
                </div>
              </div>

              {/* Strengths and Risks Section */}
              <div className="modal-grid-2col">
                <div className="fit-strengths-card">
                  <h4 className="strengths-title">
                    <span>✅</span> Advantages / Strengths
                  </h4>
                  <ul className="strengths-list">
                    {job.aqs_strengths && job.aqs_strengths.length > 0 ? (
                      job.aqs_strengths.map((strength, idx) => <li key={idx}>{strength}</li>)
                    ) : (
                      <li>Strong architectural alignment with your profile.</li>
                    )}
                  </ul>
                </div>

                <div className="fit-risks-card">
                  <h4 className="risks-title">
                    <span>⚠️</span> Disadvantages / Risk Factors
                  </h4>
                  <ul className="risks-list">
                    {job.aqs_risks && job.aqs_risks.length > 0 ? (
                      job.aqs_risks.map((risk, idx) => <li key={idx}>{risk}</li>)
                    ) : (
                      <li>No significant technical risks identified.</li>
                    )}
                  </ul>
                </div>
              </div>
                <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', margin: '0 0 12px 0' }}>Recommended Asset</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{job.resumeVersion}</div>
                    <div 
                      style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', cursor: 'pointer' }}
                      onClick={() => setViewingResume(true)}
                    >
                      View dynamically generated resume
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
          <a href={job.companyLink} target="_blank" rel="noreferrer" className="btn btn-secondary modal-source-btn">
            🔗 View Source Posting
          </a>
          
          {job.status === 'Pending Review' && (
            <>
              <button className="btn btn-secondary" style={{ color: 'var(--accent-red)' }} onClick={() => { onDecline(job.id); onClose(); }}>Decline Role</button>
              <button className="btn btn-secondary" style={{ color: 'var(--accent-blue)' }} onClick={() => { onMarkApplied(job.id); onClose(); }}>✅ Mark as Applied</button>
              <button className="btn" style={{ background: 'var(--accent-green)' }} onClick={() => { onApprove(job.id); onClose(); }}>Auto-Apply Now</button>
            </>
          )}
          {job.status === 'Needs Input' && (
            <button className="btn btn-secondary" style={{ color: 'var(--accent-blue)', marginRight: '10px' }} onClick={() => { onMarkApplied(job.id); onClose(); }}>✅ Mark as Applied</button>
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

      {viewingResume && (
        <ResumeViewer onClose={() => setViewingResume(false)} />
      )}
    </div>
  );
};

export default JobModal;
