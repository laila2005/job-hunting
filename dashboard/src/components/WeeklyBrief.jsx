import React, { useState } from 'react';

const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;

const WeeklyBrief = ({ supabase, jobs = [] }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'Pending').length,
    applied: jobs.filter(j => (j.status || '').toLowerCase() === 'applied').length,
    queued: jobs.filter(j => j.status === 'Queued for Bot').length,
    rejected: jobs.filter(j => (j.status || '').toLowerCase() === 'rejected').length,
    followUpDue: jobs.filter(j => {
      const d = daysSince(j.appliedDate || j.applied_date);
      return d !== null && d >= 7 && (j.status || '').toLowerCase() === 'applied';
    }).length,
    topMatch: [...jobs]
      .filter(j => j.status === 'Pending' || j.status === 'Queued for Bot')
      .sort((a, b) => (b.atsMatch || b.aqs_score || 0) - (a.atsMatch || a.aqs_score || 0))[0],
  };

  const sendToWhatsApp = async () => {
    setSending(true);
    setError('');
    setSent(false);

    const briefText = `📊 *Weekly Job Hunt Brief*

📥 Pipeline: *${stats.total}* total
• ${stats.pending} pending review
• ${stats.queued} queued for bot
• ${stats.applied} applied
• ${stats.rejected} rejected

${stats.followUpDue > 0 ? `⏰ *${stats.followUpDue} follow-up(s) overdue* — send emails today!\n\n` : ''}${stats.topMatch ? `🔥 *Top Match:* ${stats.topMatch.title || 'SWE'} at ${stats.topMatch.company || stats.topMatch.companySummary} — ATS ${stats.topMatch.atsMatch || stats.topMatch.aqs_score || '?'}%\n\n` : ''}Keep pushing, Laila. 💪`;

    const command = `/weekly-brief\n\n${briefText}`;

    try {
      const { error: insertErr } = await supabase
        .from('agent_chat')
        .insert([{ role: 'user', sender: 'user', content: command, message: command }]);

      if (insertErr) throw new Error(insertErr.message);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e) {
      setError('Failed to send: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: '#25d366', marginBottom: '4px' }}>📱 WhatsApp Weekly Brief</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Send your job hunt summary to WhatsApp via the Antigravity daemon.</p>
      </div>

      {/* Preview card */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px', borderLeft: '4px solid #25d366' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#25d366', letterSpacing: '0.08em', marginBottom: '14px' }}>📋 BRIEF PREVIEW</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {[
            { label: 'Total Tracked', value: stats.total, color: 'var(--accent-blue)' },
            { label: 'Pending Review', value: stats.pending, color: '#f59e0b' },
            { label: 'Applied', value: stats.applied, color: 'var(--accent-green)' },
            { label: 'Queued for Bot', value: stats.queued, color: 'var(--accent-purple)' },
            { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
            { label: 'Follow-Ups Due', value: stats.followUpDue, color: stats.followUpDue > 0 ? '#ef4444' : 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {stats.topMatch && (
          <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            🔥 <strong style={{ color: 'var(--accent-green)' }}>Top Match:</strong> {stats.topMatch.title || 'SWE'} at {stats.topMatch.company || stats.topMatch.companySummary}
            {(stats.topMatch.atsMatch || stats.topMatch.aqs_score) ? ` — ATS ${stats.topMatch.atsMatch || stats.topMatch.aqs_score}%` : ''}
          </div>
        )}

        {stats.followUpDue > 0 && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '0.82rem', color: '#ef4444', marginBottom: '16px' }}>
            ⏰ {stats.followUpDue} application{stats.followUpDue > 1 ? 's' : ''} overdue for follow-up — send emails today!
          </div>
        )}

        {error && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '10px' }}>{error}</div>}

        <button
          onClick={sendToWhatsApp}
          disabled={sending || sent}
          style={{
            padding: '10px 24px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: sending || sent ? 'default' : 'pointer',
            background: sent ? 'rgba(16,185,129,0.15)' : 'rgba(37,211,102,0.15)',
            color: sent ? 'var(--accent-green)' : '#25d366',
            border: `1px solid ${sent ? 'rgba(16,185,129,0.4)' : 'rgba(37,211,102,0.4)'}`,
            opacity: sending ? 0.7 : 1, transition: 'all 0.2s',
          }}
        >
          {sending ? '⟳ Sending...' : sent ? '✓ Sent to WhatsApp!' : '📱 Send to WhatsApp'}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
          Requires the Antigravity daemon running with WhatsApp session authenticated.
        </p>
      </div>
    </div>
  );
};

export default WeeklyBrief;
