import React, { useState } from 'react';

const JobModal = ({ job, onClose, onApprove }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
            {job.companyLogo && (
              <img 
                src={job.companyLogo} 
                alt={`${job.company} logo`} 
                className="item-logo"
                style={{ width: '64px', height: '64px' }}
              />
            )}
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', margin: '0 0 8px 0', fontWeight: '700' }}>{job.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a href={job.companyLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
                  {job.company} ↗
                </a>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{job.location} • {job.model} • {job.salary}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* Company Summary */}
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>Company Summary</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{job.companySummary}</p>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Fit Score</div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '800', color: 'var(--success)', marginBottom: '8px' }}>{job.fitScore}<span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', fontWeight: '500' }}>/100</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>ATS Match</span>
                <span style={{ color: 'var(--text-primary)' }}>{job.atsMatch}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <span>Gap Risk</span>
                <span style={{ color: 'var(--text-primary)' }}>{job.gapRisk}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Resume</div>
              <div style={{ color: 'var(--accent-primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 {job.resumeVersion}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Proof Section */}
        {job.status === 'Applied' && (
          <div style={{ padding: '0 var(--spacing-xl) var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
             <h3 style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Visual Verification Proof</h3>
             <div 
               style={{ 
                 position: 'relative', height: '120px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', 
                 cursor: 'pointer', border: '1px solid var(--border-subtle)', background: '#000' 
               }}
               onClick={() => setLightboxOpen(true)}
             >
               <img 
                 src={job.proof_url || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1000&auto=format&fit=crop"} 
                 alt="Application Proof" 
                 style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: 'opacity 0.2s' }}
                 onMouseOver={e => e.currentTarget.style.opacity = 1}
                 onMouseOut={e => e.currentTarget.style.opacity = 0.7}
               />
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '500', pointerEvents: 'none' }}>
                 Click to Expand 📸
               </div>
             </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {job.status === 'Pending Review' && (
            <button className="btn" style={{ background: 'var(--success)', color: '#000' }} onClick={() => onApprove(job.id)}>Approve & Apply</button>
          )}
        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setLightboxOpen(false)}
        >
          <img 
            src={job.proof_url || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1000&auto=format&fit=crop"} 
            alt="Expanded Proof" 
            style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </div>
      )}
    </div>
  );
};

export default JobModal;
