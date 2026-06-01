import React, { useState, useEffect } from 'react';
import ResumeViewer from './ResumeViewer';
import ResumeTailor from './ResumeTailor';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const supabase = createClient(supabaseUrl, supabaseKey);

const CANDIDATE_PROFILE = {
  name: "Laila Mohamed Fikry",
  skills: [
    "C#", "ASP.NET Core", "Python", "React.js", "Modbus", "SNMP", "SQL Server", "PostgreSQL",
    "Computer Vision (CNN, MobileNetV2, Grad-CAM)"
  ],
  achievements: [
    "Lead Developer for LM Tech Solutions RMS 3.0 Enterprise IoT server: concurrent Modbus/SNMP/HTTP polling rolled out to Ministry of Interior (MOI) and Egyptian Natural Gas (GASCO).",
    "Developed Inqaz-app AI Emergency response computer vision GPS coordinator dispatching live severity incident alerts."
  ]
};

const JobModal = ({ job, onClose, onApprove, onDecline, onMarkApplied, onStartInterview }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);

  // Outreach states
  const [outreachDraft, setOutreachDraft] = useState(job.outreach_draft || '');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachCopied, setOutreachCopied] = useState(false);

  // Cyborg review states
  const [finalResponses, setFinalResponses] = useState(job.draft_responses || {});

  useEffect(() => {
    // Reset tabs and state when job changes
    setActiveTab('overview');
    setOutreachDraft(job.outreach_draft || '');
    setFinalResponses(job.draft_responses || {});
  }, [job]);

  useEffect(() => {
    // Auto-generate outreach draft if tab opened and empty
    if (activeTab === 'outreach' && !outreachDraft && !generatingOutreach) {
      generateOutreachPitch();
    }
  }, [activeTab]);

  const generateOutreachPitch = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;
    setGeneratingOutreach(true);

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const prompt = `
      You are "Antigravity", Laila's elite AI career cockpit.
      Draft a hyper-personalized, ultra-compelling 3-paragraph cold outreach message for a Senior Engineering Manager or Recruiter at ${job.company} for the ${job.title} role.

      Laila's Core Achievements (strictly true):
      ${JSON.stringify(CANDIDATE_PROFILE.achievements)}
      Her skills: ${CANDIDATE_PROFILE.skills.join(', ')}

      Structure:
      - Paragraph 1: Mention her excitement about the ${job.title} role at ${job.company}.
      - Paragraph 2: Pitch her production engineering experience: leading LM Tech Solutions' RMS 3.0 concurrent IoT telemetry server (C# / Modbus / SNMP) used by state entities (Ministry of Interior & GASCO). Note how this is a level of production depth most candidates do not reach until years into their careers.
      - Paragraph 3: Direct, humble, low-pressure CTA inviting them to a 5-minute sync or to review her code/portfolio.

      Format: Return ONLY the message body, beautifully formatted for copy/paste. Start directly with a professional greeting like "Dear [Hiring Manager/Engineering Lead],".
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      const draft = response.text.trim();
      setOutreachDraft(draft);

      // Save to Supabase
      await supabase.from('jobs').update({ outreach_draft: draft }).eq('id', job.id);
    } catch (e) {
      console.error(e);
      setOutreachDraft("Dear Hiring Leader,\n\nI was excited to discover the open Backend Developer position at your company. With production experience in engineering concurrent, enterprise-scale IoT telemetry servers using C# and ASP.NET for major clients like the Ministry of Interior, I am confident I can add immediate value.\n\nI would love to connect for a quick 5-minute chat to discuss how my backend and systems engineering depth can contribute to your engineering team.\n\nBest regards,\nLaila Mohamed Fikry");
    }
    setGeneratingOutreach(false);
  };

  const handleOutreachEdit = async (e) => {
    const text = e.target.value;
    setOutreachDraft(text);
    await supabase.from('jobs').update({ outreach_draft: text }).eq('id', job.id);
  };

  const copyOutreach = () => {
    navigator.clipboard.writeText(outreachDraft);
    setOutreachCopied(true);
    setTimeout(() => setOutreachCopied(false), 2000);
  };

  const handleResponseChange = (q, val) => {
    setFinalResponses(prev => ({ ...prev, [q]: val }));
  };

  const handleCyborgApprove = async () => {
    const { error } = await supabase
      .from('jobs')
      .update({
        approved_responses: finalResponses,
        status: 'Queued for Bot'
      })
      .eq('id', job.id);

    if (error) {
      alert("Supabase Sync Error: " + error.message);
    } else {
      alert("🚀 Custom responses approved! Job queued for the Stealth Auto-Apply Engine.");
      onClose();
    }
  };

  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '90%' }}>
        
        {/* Header */}
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

        {/* Tab Selection */}
        <div className="modal-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <div className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </div>
          <div className={`modal-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            AI Analysis
          </div>
          <div className={`modal-tab ${activeTab === 'resume_tailor' ? 'active' : ''}`} onClick={() => setActiveTab('resume_tailor')}>
            ATS & Resume Customizer
          </div>
          <div className={`modal-tab ${activeTab === 'outreach' ? 'active' : ''}`} onClick={() => setActiveTab('outreach')}>
            Outreach Pitch
          </div>
          {job.status === 'Applied' && job.proof_url && (
            <div className={`modal-tab ${activeTab === 'proof' ? 'active' : ''}`} onClick={() => setActiveTab('proof')}>
              Application Proof
            </div>
          )}
        </div>

        {/* Body content based on tab */}
        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '20px 0' }}>
          
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Cyborg Review dialog for Needs Input state */}
              {job.status === 'Needs Input' && (
                <div style={{
                  background: 'rgba(167, 139, 250, 0.04)',
                  border: '1px solid rgba(167, 139, 250, 0.25)',
                  boxShadow: '0 0 20px rgba(167, 139, 250, 0.05)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🤖</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>Cyborg Form-Filler Paused</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        This application requires custom questions. Review and edit our AI drafts below:
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                    {Object.keys(finalResponses).length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No custom questions parsed. Click approve to submit empty drafts.</div>
                    ) : (
                      Object.keys(finalResponses).map((q, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0' }}>{q}</label>
                          <textarea
                            value={finalResponses[q]}
                            onChange={(e) => handleResponseChange(q, e.target.value)}
                            rows="3"
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '10px',
                              color: 'white',
                              fontSize: '0.8rem',
                              lineHeight: '1.5',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button 
                      onClick={handleCyborgApprove} 
                      className="btn" 
                      style={{ background: 'var(--accent-purple)', flex: 1, padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      🚀 Approve & Submit Application
                    </button>
                  </div>
                </div>
              )}

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
                    <span className="metric-value">{job.atsMatch || 80}%</span>
                  </div>
                  <div className="metric-progress-track">
                    <div className="metric-progress-bar" style={{ width: `${job.atsMatch || 80}%` }}></div>
                  </div>
                  
                  <div className="metric-row" style={{ marginTop: '16px' }}>
                    <span className="metric-label">Candidate Gap Risk</span>
                    <span className={`metric-value risk-${(job.gapRisk || 'Low').toLowerCase()}`}>{job.gapRisk || 'Low'}</span>
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

          {activeTab === 'resume_tailor' && (
            <ResumeTailor job={job} onClose={onClose} />
          )}

          {activeTab === 'outreach' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '10px'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                  🤖 Elite Context-Aware Cold Outreach Pitch
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={copyOutreach} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    {outreachCopied ? '📋 Copied!' : '🔗 Copy to Clipboard'}
                  </button>
                  <button onClick={generateOutreachPitch} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--accent-purple)' }} disabled={generatingOutreach}>
                    🔄 Regenerate AI
                  </button>
                </div>
              </div>

              {generatingOutreach ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                  <div className="typing-indicator-dots" style={{ marginBottom: '12px', justifyContent: 'center' }}>
                    <span></span><span></span><span></span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: '600' }}>
                    Antigravity Outreach Generator active...
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={outreachDraft}
                    onChange={handleOutreachEdit}
                    rows="10"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '16px',
                      color: 'white',
                      fontSize: '0.85rem',
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Generating outreach pitch..."
                  />

                  {/* Send Action Anchors */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <a 
                      href="https://www.linkedin.com/messaging/" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn" 
                      style={{ 
                        background: '#0a66c2', 
                        color: 'white', 
                        flex: 1, 
                        textAlign: 'center', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '10px'
                      }}
                    >
                      💬 Send via LinkedIn Messages
                    </a>
                    <a 
                      href={`mailto:?subject=Connecting%20regarding%20the%20${encodeURIComponent(job.title)}%20role%20at%20${encodeURIComponent(job.company)}&body=${encodeURIComponent(outreachDraft)}`}
                      className="btn btn-secondary" 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '10px'
                      }}
                    >
                      ✉️ Dispatch via Cold Email
                    </a>
                  </div>
                </>
              )}
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

        {/* Footer buttons */}
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
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
