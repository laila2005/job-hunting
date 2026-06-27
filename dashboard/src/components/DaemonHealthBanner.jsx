import { useState, useEffect, useRef } from 'react';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const DaemonHealthBanner = ({ supabase }) => {
  const [status, setStatus] = useState('checking'); // 'live' | 'stale' | 'checking'
  const [lastSeen, setLastSeen] = useState(null);
  const intervalRef = useRef(null);

  const check = async () => {
    const { data } = await supabase
      .from('agent_chat')
      .select('created_at')
      .eq('sender', 'agent')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      setStatus('stale');
      setLastSeen(null);
      return;
    }
    const age = Date.now() - new Date(data[0].created_at).getTime();
    setLastSeen(data[0].created_at);
    setStatus(age < STALE_THRESHOLD_MS ? 'live' : 'stale');
  };

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (status === 'checking' || status === 'live') return null;

  const ago = lastSeen
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
        return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
      })()
    : 'never';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
      padding: '10px 16px', marginBottom: '16px',
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
      fontSize: '0.82rem', color: '#ef4444',
    }}>
      <span>
        <strong>⚠️ Daemon offline</strong>
        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
          Last response: {ago}. AI features (cover letters, LinkedIn messages, company intel) won't work.
        </span>
      </span>
      <code style={{ background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        cd inbox-agent &amp;&amp; node chat_daemon.js
      </code>
    </div>
  );
};

export default DaemonHealthBanner;
