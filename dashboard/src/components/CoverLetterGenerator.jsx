import React, { useState, useEffect, useRef } from 'react';

const TONES = ['Professional', 'Enthusiastic', 'Concise'];

const CoverLetterGenerator = ({ supabase, jobs = [] }) => {
  const [tone, setTone] = useState('Professional');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const channelRef = useRef(null);

  // Cleanup realtime channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const pipelineJobs = jobs.filter(j =>
    j.status === 'Pending' || j.status === 'Queued for Bot' || j.status === 'Applied'
  ).slice(0, 20);

  const handleJobSelect = (e) => {
    const id = e.target.value;
    setSelectedJobId(id);
    if (!id) return;
    const job = jobs.find(j => j.id === id);
    if (job) {
      setJobTitle(job.title || '');
      setCompany(job.company || job.companySummary || '');
      setJobDescription(job.description || job.notes || job.companySummary || '');
    }
  };

  const generate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description or select a job from the pipeline.');
      return;
    }
    setError('');
    setResult('');
    setLoading(true);

    // Build the slash command the daemon understands
    const command = `/cover-letter [tone=${tone}] [company=${company || 'Unknown'}] [title=${jobTitle || 'Software Engineer'}]\n\n${jobDescription}`;

    // Remove any lingering channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to agent replies BEFORE inserting the request
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
        setError('No response from Antigravity daemon. Make sure your local daemon is running (node inbox-agent/chat_daemon.js).');
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      }
    }, 60000);

    channelRef.current = supabase
      .channel(`cover-letter-response-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_chat' },
        (payload) => {
          const msg = payload.new;
          const text = msg.message || msg.content || '';
          const sender = msg.sender || msg.role || '';
          if (sender !== 'agent') return;
          if (!text.startsWith('[COVER_LETTER_RESPONSE]')) return;

          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            setLoading(false);
            setResult(text.replace('[COVER_LETTER_RESPONSE]\n', '').replace('[COVER_LETTER_RESPONSE]', '').trim());
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        }
      )
      .subscribe();

    // Send the request to the daemon
    const { error: insertErr } = await supabase
      .from('agent_chat')
      .insert([{ role: 'user', sender: 'user', content: command, message: command }]);

    if (insertErr) {
      resolved = true;
      clearTimeout(timeout);
      setLoading(false);
      setError('Failed to send request to Supabase: ' + insertErr.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover_letter_${(company || 'job').replace(/\s+/g, '_')}_${tone.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '8px' }}>
          ✍️ AI Cover Letter Generator
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Routed through your local Antigravity daemon — no API key needed in the browser.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '20px' }}>
        {/* Job selector from pipeline */}
        {pipelineJobs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>PICK FROM PIPELINE (optional)</label>
            <select
              value={selectedJobId}
              onChange={handleJobSelect}
              style={inputStyle}
            >
              <option value="">— Select a job from your pipeline —</option>
              {pipelineJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.company || j.companySummary} — {j.title || 'Software Engineer'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Manual fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>JOB TITLE</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Backend Engineer Intern" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>COMPANY</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Instabug" style={inputStyle} />
          </div>
        </div>

        {/* Job description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>JOB DESCRIPTION <span style={{ color: 'var(--accent-blue)' }}>*</span></label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {/* Tone selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>TONE</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {TONES.map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                style={{
                  padding: '8px 20px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                  border: tone === t ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: tone === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: tone === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: tone === t ? '600' : '400',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'Professional' ? '🎩' : t === 'Enthusiastic' ? '🚀' : '⚡'} {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="btn btn-gradient"
          style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? '⟳ Waiting for Antigravity daemon...'
            : '✨ Generate Cover Letter via Antigravity'}
        </button>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>
            Request sent to daemon via Supabase. Waiting for response (up to 60s)...
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>
              Generated Cover Letter — <span style={{ color: 'var(--accent-blue)' }}>{tone}</span>
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={copyToClipboard} style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer',
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                color: copied ? 'var(--accent-green)' : 'var(--accent-blue)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
              }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button onClick={downloadTxt} style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer',
                background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)',
                border: '1px solid rgba(139,92,246,0.3)',
              }}>
                ⬇ Download .txt
              </button>
            </div>
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-main)',
            fontSize: '0.9rem', lineHeight: '1.7', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px',
            border: '1px solid var(--border-color)', margin: 0,
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: '0.75rem',
  marginBottom: '6px',
  fontWeight: '700',
  letterSpacing: '0.06em',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

export default CoverLetterGenerator;
