import React, { useState, useEffect } from 'react';

const STAGES = ['Applied', 'HR Screen', 'Technical', 'Final Round', 'Offer', 'Rejected'];

const STAGE_COLORS = {
  'Applied':     '#3b82f6',
  'HR Screen':   '#8b5cf6',
  'Technical':   '#f59e0b',
  'Final Round': '#10b981',
  'Offer':       '#22d3ee',
  'Rejected':    '#ef4444',
};

const FOLLOWUP_DAYS = 7;

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const ApplicationTracker = ({ supabase, jobs }) => {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [draftingFor, setDraftingFor] = useState(null); // app.id being drafted
  const [emailDraft, setEmailDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);
  const draftChannelRef = React.useRef(null);

  // Seed from jobs already marked Applied
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('applied_date', { ascending: false });

    if (error) {
      // Table may not exist yet — seed from jobs prop
      seedFromJobs();
    } else {
      if (data && data.length > 0) {
        setApplications(data);
      } else {
        seedFromJobs();
      }
    }
  };

  const seedFromJobs = () => {
    const applied = (jobs || [])
      .filter(j => (j.status || '').toLowerCase() === 'applied')
      .map(j => ({
        id: j.id,
        company: j.company || j.companySummary || 'Unknown',
        title: j.title || 'Software Engineer',
        applied_date: j.appliedDate || new Date().toISOString().split('T')[0],
        stage: 'Applied',
        notes: '',
        source: j.source || 'Auto',
        ats_score: j.atsMatch || j.aqs_score || null,
        job_url: j.url || '',
      }));
    setApplications(applied);
  };

  const advanceStage = async (app) => {
    const currentIndex = STAGES.indexOf(app.stage);
    if (currentIndex >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIndex + 1];
    if (nextStage === 'Rejected') return; // use reject button instead
    await updateStage(app, nextStage);
  };

  const rejectApp = async (app) => {
    await updateStage(app, 'Rejected');
  };

  const updateStage = async (app, newStage) => {
    setSyncing(true);
    const updated = applications.map(a =>
      a.id === app.id ? { ...a, stage: newStage, last_updated: new Date().toISOString() } : a
    );
    setApplications(updated);

    await supabase.from('applications').upsert({
      id: app.id,
      company: app.company,
      title: app.title,
      applied_date: app.applied_date,
      stage: newStage,
      notes: app.notes || '',
      source: app.source,
      ats_score: app.ats_score,
      job_url: app.job_url,
      last_updated: new Date().toISOString(),
    });
    setSyncing(false);
  };

  const draftFollowUp = async (app) => {
    setDraftingFor(app.id);
    setEmailDraft('');
    setDraftLoading(true);
    setDraftCopied(false);

    if (draftChannelRef.current) supabase.removeChannel(draftChannelRef.current);

    const command = `/cover-letter [tone=Professional] [company=${app.company}] [title=${app.title}]\n\n[FOLLOW_UP_EMAIL] This is a follow-up email, not a cover letter. I applied ${daysSince(app.applied_date)} days ago and haven't heard back. Write a short, polite 3-sentence follow-up email to the hiring team at ${app.company} for the ${app.title} role. Reference that I applied on ${app.applied_date}. Keep it warm and professional.`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setDraftLoading(false); setEmailDraft('⚠️ No response from daemon. Make sure your local daemon is running.'); }
      if (draftChannelRef.current) supabase.removeChannel(draftChannelRef.current);
    }, 60000);

    draftChannelRef.current = supabase
      .channel(`followup-draft-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent') return;
        if (!text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setDraftLoading(false);
          setEmailDraft(text.replace('[COVER_LETTER_RESPONSE]', '').trim());
          supabase.removeChannel(draftChannelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  const saveNote = async (app) => {
    const updated = applications.map(a =>
      a.id === app.id ? { ...a, notes: noteText } : a
    );
    setApplications(updated);
    setEditingNote(null);
    await supabase.from('applications').upsert({ ...app, notes: noteText });
  };

  const filtered = filter === 'All'
    ? applications
    : applications.filter(a => a.stage === filter);

  const overdue = applications.filter(a => {
    const d = daysSince(a.applied_date);
    return d !== null && d >= FOLLOWUP_DAYS && a.stage === 'Applied';
  });

  const stageCount = STAGES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.stage === s).length;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '8px' }}>
          📋 Application Pipeline Tracker
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Track every application from submission to offer. {syncing && <span style={{ color: 'var(--accent-yellow)', fontSize: '12px' }}>⟳ Syncing...</span>}
        </p>
      </div>

      {/* Overdue Alerts */}
      {overdue.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⏰</span>
          <div>
            <strong style={{ color: '#ef4444' }}>Follow-up overdue!</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
              {overdue.map(a => a.company).join(', ')} — {FOLLOWUP_DAYS}+ days with no update. Send a follow-up email.
            </span>
          </div>
        </div>
      )}

      {/* Pipeline Funnel */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STAGES.map(s => (
          <div key={s} style={{
            flex: '1 1 80px',
            background: 'var(--bg-card)',
            border: `1px solid ${STAGE_COLORS[s]}40`,
            borderTop: `3px solid ${STAGE_COLORS[s]}`,
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            opacity: filter === s ? 1 : 0.7,
            transition: 'opacity 0.2s'
          }} onClick={() => setFilter(filter === s ? 'All' : s)}>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: STAGE_COLORS[s] }}>{stageCount[s]}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s}</div>
          </div>
        ))}
        <div style={{
          flex: '1 1 80px',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid white',
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          opacity: filter === 'All' ? 1 : 0.7,
        }} onClick={() => setFilter('All')}>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>{applications.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>All</div>
        </div>
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No applications in this stage yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(app => {
            const days = daysSince(app.applied_date);
            const isOverdue = days !== null && days >= FOLLOWUP_DAYS && app.stage === 'Applied';
            const currentStageIndex = STAGES.indexOf(app.stage);
            const nextStage = STAGES[currentStageIndex + 1];
            const canAdvance = currentStageIndex < STAGES.length - 2; // not at Offer or Rejected

            return (
              <div key={app.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`,
                borderLeft: `4px solid ${STAGE_COLORS[app.stage] || '#3b82f6'}`,
                borderRadius: '12px',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Left: Company + Title */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>{app.company}</h4>
                      <span style={{
                        background: `${STAGE_COLORS[app.stage]}20`,
                        color: STAGE_COLORS[app.stage],
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        border: `1px solid ${STAGE_COLORS[app.stage]}50`,
                      }}>{app.stage}</span>
                      {app.ats_score && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                          ATS {app.ats_score}%
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{app.title}</div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>📅 Applied: {app.applied_date}</span>
                      {days !== null && (
                        <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                          {isOverdue ? '⏰' : '🕐'} {days}d ago {isOverdue ? '— Follow up!' : ''}
                        </span>
                      )}
                      <span>📌 {app.source || 'Auto'}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {app.job_url && (
                      <a href={app.job_url} target="_blank" rel="noopener noreferrer" style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                        background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)',
                        border: '1px solid rgba(59,130,246,0.3)', textDecoration: 'none'
                      }}>🔗 View Job</a>
                    )}
                    <button onClick={() => { setEditingNote(app.id); setNoteText(app.notes || ''); }} style={{
                      padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                      background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)',
                      border: '1px solid rgba(139,92,246,0.3)', cursor: 'pointer'
                    }}>📝 Note</button>
                    {isOverdue && (
                      <button onClick={() => draftingFor === app.id ? setDraftingFor(null) : draftFollowUp(app)} style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                        background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                        border: '1px solid rgba(251,191,36,0.35)', cursor: 'pointer'
                      }}>✉️ Draft Follow-Up</button>
                    )}
                    {canAdvance && (
                      <button onClick={() => advanceStage(app)} style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                        background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)',
                        border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer'
                      }}>→ {nextStage}</button>
                    )}
                    {app.stage !== 'Rejected' && app.stage !== 'Offer' && (
                      <button onClick={() => rejectApp(app)} style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer'
                      }}>✕ Reject</button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {editingNote === app.id ? (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input
                      autoFocus
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add interview notes, contact name, follow-up details..."
                      style={{
                        flex: 1, background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.85rem'
                      }}
                    />
                    <button onClick={() => saveNote(app)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
                    <button onClick={() => setEditingNote(null)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                  </div>
                ) : app.notes ? (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    📝 {app.notes}
                  </div>
                ) : null}

                {/* Follow-Up Email Draft Panel */}
                {draftingFor === app.id && (
                  <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fbbf24', letterSpacing: '0.06em', marginBottom: '8px' }}>
                      ✉️ FOLLOW-UP EMAIL DRAFT
                    </div>
                    {draftLoading ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>⟳ Generating via Antigravity daemon...</div>
                    ) : emailDraft ? (
                      <>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.6', fontFamily: 'inherit', margin: '0 0 10px' }}>{emailDraft}</pre>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { navigator.clipboard.writeText(emailDraft); setDraftCopied(true); setTimeout(() => setDraftCopied(false), 2000); }} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: draftCopied ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)', color: draftCopied ? 'var(--accent-green)' : '#fbbf24', border: `1px solid ${draftCopied ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                            {draftCopied ? '✓ Copied!' : '📋 Copy Email'}
                          </button>
                          <button onClick={() => setDraftingFor(null)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Close</button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Stage Progress Bar */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
                  {STAGES.slice(0, -1).map((s, i) => {
                    const reached = STAGES.indexOf(app.stage) >= i;
                    return (
                      <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: reached ? STAGE_COLORS[s] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s'
                      }} title={s} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
