import React, { useState, useEffect } from 'react';

const INTERVIEW_TIPS = [
  'Use the STAR method (Situation, Task, Action, Result) for every behavioral question.',
  'Research the company\'s tech stack before the interview — mention it naturally.',
  'Prepare 2 questions to ask the interviewer. "What does success look like in 90 days?" is always strong.',
  'For system design: start with requirements, then high-level architecture, then drill down.',
  'Practice explaining your most complex project out loud in under 90 seconds.',
  'Before a technical round, warm up with 2 easy LeetCode problems to get into the flow.',
  'Confidence tip: interviewers are rooting for you to succeed. They want to hire.',
  'Mention your MOI / GASCO IoT work early — real production deployments stand out at internship level.',
  'If you don\'t know the answer, think out loud. "I\'d approach this by..." shows problem-solving.',
  'Follow up within 24 hours after every interview with a thank-you email — most candidates skip this.',
];

const FOLLOWUP_DAYS = 7;

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getStreak = () => {
  const todayKey = new Date().toISOString().split('T')[0];
  const streakData = JSON.parse(localStorage.getItem('daily_streak') || '{"lastDate":"","count":0}');
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streakData.lastDate === todayKey) {
    return streakData.count;
  }
  const newCount = streakData.lastDate === yesterday ? streakData.count + 1 : 1;
  localStorage.setItem('daily_streak', JSON.stringify({ lastDate: todayKey, count: newCount }));
  return newCount;
};

const getTipIndex = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % INTERVIEW_TIPS.length;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DailyBriefing = ({ jobs = [] }) => {
  const [streak] = useState(getStreak);
  const tip = INTERVIEW_TIPS[getTipIndex()];

  const topJobs = [...jobs]
    .filter(j => j.status === 'Pending' || j.status === 'Queued for Bot')
    .sort((a, b) => (b.atsMatch || b.aqs_score || 0) - (a.atsMatch || a.aqs_score || 0))
    .slice(0, 3);

  const overdueJobs = jobs.filter(j => {
    const d = daysSince(j.appliedDate || j.applied_date);
    return d !== null && d >= FOLLOWUP_DAYS && (j.status || '').toLowerCase() === 'applied';
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const pendingCount = jobs.filter(j => j.status === 'Pending').length;
  const appliedCount = jobs.filter(j => (j.status || '').toLowerCase() === 'applied').length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
      border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      {/* Greeting row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: '700' }}>
            {getGreeting()}, Laila. ☀️
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{dateStr}</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '10px', padding: '8px 14px',
        }}>
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fbbf24', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>DAY STREAK</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <StatPill icon="📥" value={pendingCount} label="Pending Review" color="var(--accent-blue)" />
        <StatPill icon="📤" value={appliedCount} label="Applied" color="var(--accent-green)" />
        {overdueJobs.length > 0 && (
          <StatPill icon="⏰" value={overdueJobs.length} label="Follow-Ups Due" color="#ef4444" />
        )}
        <StatPill icon="📊" value={jobs.length} label="Total Tracked" color="var(--accent-purple)" />
      </div>

      {/* Overdue alerts */}
      {overdueJobs.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
          fontSize: '0.85rem', color: '#ef4444',
        }}>
          <strong>⏰ Follow-up overdue:</strong>
          <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
            {overdueJobs.map(j => j.company || j.companySummary || 'Unknown').join(' · ')} — send a follow-up email today.
          </span>
        </div>
      )}

      {/* Top jobs */}
      {topJobs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
            TOP MATCHES AWAITING YOUR REVIEW
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topJobs.map(j => (
              <div key={j.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px',
                border: '1px solid var(--border-color)',
              }}>
                <span style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
                  {j.company || j.companySummary || 'Unknown'} — <span style={{ color: 'var(--text-secondary)' }}>{j.title || 'Software Engineer'}</span>
                </span>
                {(j.atsMatch || j.aqs_score) && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-green)',
                    background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px',
                  }}>
                    ATS {j.atsMatch || j.aqs_score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview tip */}
      <div style={{
        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '10px', padding: '12px 14px',
        display: 'flex', gap: '10px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-purple)', letterSpacing: '0.06em', marginBottom: '4px' }}>TODAY'S INTERVIEW TIP</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{tip}</div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ icon, value, label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
    borderRadius: '10px', padding: '8px 14px', flex: '1 1 100px',
  }}>
    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
    <div>
      <div style={{ fontSize: '1.1rem', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

export default DailyBriefing;
