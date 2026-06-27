import React, { useState, useEffect, useRef } from 'react';

const WEAK_AREAS = [
  { key: 'system_design', label: 'System Design', icon: '🏗️' },
  { key: 'algorithms', label: 'Algorithms & DSA', icon: '⚡' },
  { key: 'behavioral', label: 'Behavioral (STAR)', icon: '🎭' },
  { key: 'backend', label: 'Backend / APIs', icon: '🔧' },
  { key: 'database', label: 'Databases & SQL', icon: '🗄️' },
  { key: 'frontend', label: 'Frontend / React', icon: '🎨' },
];

const InterviewCoach = ({ supabase }) => {
  const [scores, setScores] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('plan'); // 'plan' | 'history'
  const channelRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('interview_sessions')
      .select('score, created_at, content, role')
      .not('score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setScores(data); });
  }, [supabase]);

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + (b.score || 0), 0) / scores.length) : null;
  const trend = scores.length >= 2 ? scores[0].score - scores[scores.length - 1].score : null;

  const generatePlan = async () => {
    const topic = customTopic.trim() || selectedArea;
    if (!topic) return;
    setLoading(true);
    setPlan('');
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const areaLabel = WEAK_AREAS.find(a => a.key === topic)?.label || topic;
    const recentScoreCtx = scores.slice(0, 3).map(s => `Score: ${s.score}/100`).join(', ');

    const command = `/cover-letter [tone=Enthusiastic] [company=InterviewCoach] [title=${areaLabel} Study Plan]\n\n[COACH_PLAN] You are an elite technical interview coach for Laila Mohamed Fikry, a 3rd-year CS student and Lead SWE at LM Tech Solutions with IoT deployments for GASCO and Ministry of Interior. Her recent mock interview scores: ${recentScoreCtx || 'no data yet'}.\n\nCreate a focused 7-day study plan to improve her "${areaLabel}" skills for software engineering interviews. Include:\n1. One concept to study per day (specific, not vague)\n2. One practice resource (LeetCode tag, book chapter, YouTube video title)\n3. One practice problem or exercise\nFormat as a numbered list. Be specific to her backend/fullstack profile. No filler.`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); setPlan('⚠️ Daemon not responding. Start your local daemon first.'); }
    }, 90000);

    channelRef.current = supabase
      .channel(`coach-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent' || !text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setLoading(false);
          setPlan(text.replace('[COVER_LETTER_RESPONSE]', '').trim());
          supabase.removeChannel(channelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-green)', marginBottom: '4px' }}>🎯 AI Interview Coach</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Personalized 7-day study plans based on your weak areas and past scores.</p>
        </div>
        {avgScore !== null && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 18px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: avgScore >= 70 ? 'var(--accent-green)' : avgScore >= 50 ? '#f59e0b' : '#ef4444' }}>{avgScore}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVG SCORE</div>
            </div>
            {trend !== null && (
              <div style={{ textAlign: 'center', background: trend >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${trend >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '10px 18px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: trend >= 0 ? 'var(--accent-green)' : '#ef4444' }}>{trend >= 0 ? '+' : ''}{trend}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TREND</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['plan', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', border: tab === t ? '1px solid var(--accent-green)' : '1px solid var(--border-color)', background: tab === t ? 'rgba(16,185,129,0.12)' : 'transparent', color: tab === t ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: tab === t ? '700' : '400' }}>
            {t === 'plan' ? '📋 Study Plan Generator' : '📊 Score History'}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>SELECT WEAK AREA</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            {WEAK_AREAS.map(a => (
              <button key={a.key} onClick={() => { setSelectedArea(a.key); setCustomTopic(''); }}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', border: selectedArea === a.key ? '1px solid var(--accent-green)' : '1px solid var(--border-color)', background: selectedArea === a.key ? 'rgba(16,185,129,0.12)' : 'transparent', color: selectedArea === a.key ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: selectedArea === a.key ? '700' : '400' }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          <input value={customTopic} onChange={e => { setCustomTopic(e.target.value); setSelectedArea(''); }} placeholder="Or type a custom topic (e.g. 'distributed systems', 'concurrency')..."
            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '14px' }} />
          <button className="btn btn-gradient" onClick={generatePlan} disabled={loading || (!selectedArea && !customTopic.trim())} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? '⟳ Generating your study plan...' : '🚀 Generate 7-Day Study Plan'}
          </button>

          {plan && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-green)', letterSpacing: '0.08em', marginBottom: '10px' }}>📋 YOUR PERSONALIZED STUDY PLAN</div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.75', fontFamily: 'inherit', margin: 0 }}>{plan}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          {scores.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No interview sessions scored yet. Complete a mock interview first.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scores.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '120px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.score}%`, background: s.score >= 70 ? 'var(--accent-green)' : s.score >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontWeight: '700', color: s.score >= 70 ? 'var(--accent-green)' : s.score >= 50 ? '#f59e0b' : '#ef4444', fontSize: '0.88rem', minWidth: '40px' }}>{s.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewCoach;
