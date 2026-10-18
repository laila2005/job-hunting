import React, { useMemo } from 'react';
import { extrasOf, CopyButton } from './JobPack';

const DAY = 86400000;
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysUntil = d => Math.ceil((new Date(`${d}T12:00:00Z`) - new Date(`${todayStr()}T12:00:00Z`)) / DAY);

// Rank "To Apply" jobs: fit first, then deadline pressure, then competition and eligibility risk.
export const scoreJob = job => {
  const x = extrasOf(job) || {};
  let score = (job.fitScore || 70) * 0.6;
  const reasons = [`fit ${job.fitScore || '?'}`];
  if (x.deadline) {
    const d = daysUntil(x.deadline);
    if (d < 0) return { score: -1, reasons: ['deadline passed'], expired: true };
    if (d <= 7) { score += 30; reasons.push(`closes in ${d}d`); }
    else if (d <= 14) { score += 20; reasons.push(`closes in ${d}d`); }
    else if (d <= 30) { score += 8; reasons.push(`closes in ${d}d`); }
  }
  if (x.applicants && x.applicants >= 150) { score -= 12; reasons.push(`${x.applicants}+ applicants`); }
  if (x.eligibility === 'ask') { score -= 15; reasons.push('check Egypt eligibility first'); }
  if ((job.gapRisk || '').toLowerCase().startsWith('high')) { score -= 10; reasons.push('stretch role'); }
  if (x.pack && x.pack.cover) { score += 5; reasons.push('cover note ready'); } else reasons.push('no cover note yet');
  return { score, reasons };
};

const followDue = j => {
  const x = extrasOf(j) || {};
  if (x.followup_due) return x.followup_due;
  if (j.status !== 'Applied' || !j.appliedDate) return null;
  return new Date(new Date(`${j.appliedDate}T12:00:00Z`).getTime() + 7 * DAY).toISOString().slice(0, 10);
};
const followMsg = j => {
  const x = extrasOf(j) || {};
  if (x.followup_msg) return x.followup_msg;
  const short = (j.company || '').split('(')[0].split('/')[0].trim();
  return `Hi ${short} team, I applied for the ${j.title} role on ${j.appliedDate} and wanted to follow up. I'm still very interested and happy to share more about LM-MS or my recent projects. Thank you for your time. Laila`;
};

const chip = { fontSize: '0.7rem', padding: '1px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)' };

const ApplyToday = ({ jobs, onOpen }) => {
  const { top, followUps, inProcess, closing, replies } = useMemo(() => {
    const trk = jobs.filter(j => (j.id || '').startsWith('trk-'));
    const ranked = trk
      .filter(j => j.status === 'To Apply')
      .map(j => ({ job: j, ...scoreJob(j) }))
      .filter(r => !r.expired)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const today = todayStr();
    const closing = trk
      .filter(j => j.status === 'To Apply' && (extrasOf(j) || {}).deadline)
      .map(j => ({ job: j, d: daysUntil(extrasOf(j).deadline) }))
      .filter(r => r.d >= 0 && r.d <= 7)
      .sort((a, b) => a.d - b.d);
    const replies = trk
      .flatMap(j => ((extrasOf(j) || {}).email_events || []).map(e => ({ job: j, e })))
      .filter(r => r.e.kind !== 'applied')
      .sort((a, b) => b.e.date.localeCompare(a.e.date))
      .slice(0, 4);
    return {
      closing,
      replies,
      top: ranked,
      followUps: trk.filter(j => j.status === 'Applied' && followDue(j) && followDue(j) <= today),
      inProcess: trk.filter(j => ['Test', 'Interview', 'Offer'].includes(j.status)),
    };
  }, [jobs]);

  if (!top.length && !followUps.length && !inProcess.length && !closing.length && !replies.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      {inProcess.length > 0 && (
        <div className="glass-panel" style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(245,158,11,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🎯 In process: do these first</div>
          {inProcess.map(j => (
            <div key={j.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
              <span className="status-badge badge-needs-input">{j.status}</span>
              <strong>{j.company}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{j.title}</span>
              <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.75rem' }} onClick={() => onOpen(j, 'prep')}>Open prep</button>
            </div>
          ))}
        </div>
      )}

      {replies.length > 0 && (
        <div className="glass-panel" style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(139,92,246,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>📬 Latest replies from your inbox</div>
          {replies.map(({ job, e }) => (
            <div key={job.id + e.date + e.kind} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
              <span style={chip}>{e.kind}</span>
              <strong>{job.company}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{e.note || e.subject} · {e.date}</span>
            </div>
          ))}
        </div>
      )}

      {closing.length > 0 && (
        <div className="glass-panel" style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(239,68,68,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⏰ Closing this week</div>
          {closing.map(({ job, d }) => (
            <div key={job.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
              <strong>{job.company}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{job.title}</span>
              <span style={{ ...chip, color: '#ef4444' }}>{d === 0 ? 'closes today' : `${d} day${d === 1 ? '' : 's'} left`}</span>
              <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.75rem' }} onClick={() => onOpen(job, 'pack')}>Open pack</button>
            </div>
          ))}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="glass-panel" style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(59,130,246,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>📨 Follow up today (no reply after 7 days)</div>
          {followUps.map(j => (
            <div key={j.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
              <strong>{j.company}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{j.title}</span>
              <CopyButton small text={followMsg(j)} />
            </div>
          ))}
        </div>
      )}

      {top.length > 0 && (
        <div className="glass-panel" style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(16,185,129,0.4)' }}>
          <div style={{ fontWeight: 700 }}>⚡ Apply today: your top {top.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Ranked by fit, deadline, competition and eligibility. Aim for 3–5 quality applications a day.</div>
          {top.map((r, i) => (
            <div key={r.job.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ fontWeight: 800, color: '#10b981', width: 18 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div><strong>{r.job.company}</strong> <span style={{ color: 'var(--text-muted)' }}>· {r.job.title}</span></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                  {r.reasons.map(t => <span key={t} style={chip}>{t}</span>)}
                </div>
              </div>
              <button className="btn" style={{ background: 'var(--accent-green)', padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => onOpen(r.job, 'pack')}>Open apply pack</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplyToday;
