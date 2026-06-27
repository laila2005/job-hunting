import React, { useState, useEffect } from 'react';

const INTERVIEW_TIPS = [
  'Lead with MOI + GASCO in your intro: "I built an IoT platform in production for two government clients." That sentence alone separates you from 99% of student candidates.',
  'For .NET roles: know the difference between ASP.NET Core middleware, dependency injection, and IHostedService — these come up constantly.',
  'For Node.js/Python roles: be ready to explain async/await vs promises, event loop mechanics, and how you\'d handle backpressure in a data pipeline.',
  'Prepare your RMS 3.0 story in under 90 seconds: what it does, the challenge (concurrent Modbus/SNMP/HTTP), how you solved it (Strategy/Factory OOP), and the impact (MOI + GASCO production).',
  'System design: always clarify scale first — "How many devices? How many concurrent users?" Then layer: API → Service layer → DB → Caching.',
  'For FastAPI/Python roles: Inqaz is a strong portfolio piece — a CV pipeline with REST API processing live camera feeds and dispatching to national emergency services.',
  'Prepare 2 questions per interview. "What does the on-call rotation look like for an engineer at my level?" shows maturity beyond student positioning.',
  'SQL round prep: practice window functions (ROW_NUMBER, RANK, LAG), GROUP BY + HAVING, and be ready to explain your SQL Server schema design decisions from RMS 3.0.',
  'Use the STAR method for every behavioral answer — Situation, Task, Action, Result. Structure is how interviewers score you.',
  'Your English is fluent — use it confidently in international and remote interviews. Turkish proficiency is a bonus for Turkish tech companies.',
  'Follow up within 24 hours of every interview with a specific thank-you email referencing one technical topic you discussed. 95% of candidates skip this.',
  'Grad-CAM and MobileNetV2 on your resume attract AI-team interviewers. Be ready to explain transfer learning and why it outperformed your custom CNN (68% F1-score).',
  'For full-stack roles: offer to demo the AI Job-Hunting Platform live. The Supabase realtime + background daemon architecture is genuinely impressive to show.',
  'When asked about weaknesses, name a specific technology gap you\'re actively closing with a concrete resource — not a fake strength in disguise.',
  'Before a technical round, warm up with 2 medium LeetCode problems. Solving easy ones first rebuilds pattern recognition confidence.',
  'Research the company\'s actual tech stack before the interview — mention one specific technology they use and connect it to your experience.',
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

const ScoreSparkline = ({ scores }) => {
  if (!scores || scores.length < 2) return null;
  const W = 120, H = 36, pad = 4;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
    const y = H - pad - ((s - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const latest = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const trend = latest >= prev ? '↑' : '↓';
  const trendColor = latest >= prev ? '#10b981' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px', border: '1px solid var(--border-color)' }}>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '2px' }}>INTERVIEW SCORE</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: trendColor }}>{latest}</span>
          <span style={{ fontSize: '0.8rem', color: trendColor }}>{trend}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <polyline points={pts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.8"/>
        {scores.map((s, i) => {
          const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
          const y = H - pad - ((s - min) / range) * (H - pad * 2);
          return i === scores.length - 1 ? <circle key={i} cx={x} cy={y} r="3" fill={trendColor}/> : null;
        })}
      </svg>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{scores.length} sessions</div>
    </div>
  );
};

const DailyBriefing = ({ supabase, jobs = [] }) => {
  const [streak] = useState(getStreak);
  const [interviewScores, setInterviewScores] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('interview_sessions')
      .select('score, created_at')
      .eq('role', 'agent')
      .not('score', 'is', null)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setInterviewScores(data.map(r => r.score));
        }
      });
  }, [supabase]);
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

      {/* Interview score sparkline */}
      {interviewScores.length >= 2 && (
        <div style={{ marginBottom: '16px' }}>
          <ScoreSparkline scores={interviewScores} />
        </div>
      )}

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
