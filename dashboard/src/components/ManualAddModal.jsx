import React, { useState } from 'react';

const ManualAddModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [companyLink, setCompanyLink] = useState('');
  const [location, setLocation] = useState('Cairo');
  const [model, setModel] = useState('Remote');
  const [salary, setSalary] = useState('Unlisted');
  const [fitScore, setFitScore] = useState(85);
  const [status, setStatus] = useState('Applied');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      setErrorMsg('Job Title and Company Name are required.');
      return;
    }
    setErrorMsg('');
    onCreate({
      title: title.trim(),
      company: company.trim(),
      companyLink: companyLink.trim() || null,
      location: location.trim(),
      model,
      salary: salary.trim() || 'Unlisted',
      fitScore: parseInt(fitScore) || 85,
      status,
      appliedDate: status === 'Applied' ? new Date().toISOString().split('T')[0] : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <span>💼</span> Add Manual Application
          </h2>
          <button className="close-btn" style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0', maxHeight: '70vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div style={{ color: '#F87171', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>JOB TITLE *</label>
              <input 
                type="text" 
                placeholder="e.g. Backend Developer" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                required 
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>COMPANY NAME *</label>
              <input 
                type="text" 
                placeholder="e.g. Analyticsmart" 
                value={company} 
                onChange={e => setCompany(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                required 
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>JOB / COMPANY URL</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={companyLink} 
                onChange={e => setCompanyLink(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>LOCATION</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cairo, Remote" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>WORK MODEL</label>
                <select 
                  value={model} 
                  onChange={e => setModel(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>SALARY</label>
                <input 
                  type="text" 
                  placeholder="e.g. 20k EGP, Unlisted" 
                  value={salary} 
                  onChange={e => setSalary(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>FIT SCORE (1-100)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={fitScore} 
                  onChange={e => setFitScore(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>STATUS</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
              >
                <option value="Applied">Applied</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Needs Input">Needs Input</option>
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gradient">Save Job</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAddModal;
