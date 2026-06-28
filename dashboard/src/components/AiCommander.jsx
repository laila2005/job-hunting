import React, { useState, useEffect, useRef } from 'react';

// ── Inline markdown parser ──────────────────────────────────────────────────
function parseInline(text, keyBase) {
  const parts = [];
  let remaining = text;
  let k = 0;

  while (remaining.length) {
    const bold = remaining.match(/\*\*(.+?)\*\*/);
    const code = remaining.match(/`([^`]+?)`/);
    const ital = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    const candidates = [bold, code, ital].filter(Boolean);
    if (!candidates.length) {
      parts.push(<span key={`${keyBase}-${k++}`}>{remaining}</span>);
      break;
    }
    const first = candidates.reduce((a, b) => (a.index <= b.index ? a : b));
    if (first.index > 0) {
      parts.push(<span key={`${keyBase}-${k++}`}>{remaining.slice(0, first.index)}</span>);
    }
    if (first === bold) {
      parts.push(<strong key={`${keyBase}-${k++}`}>{first[1]}</strong>);
    } else if (first === code) {
      parts.push(
        <code key={`${keyBase}-${k++}`} style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.86em', color: '#a5f3fc', fontFamily: 'monospace' }}>
          {first[1]}
        </code>
      );
    } else {
      parts.push(<em key={`${keyBase}-${k++}`}>{first[1]}</em>);
    }
    remaining = remaining.slice(first.index + first[0].length);
  }
  return parts;
}

function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={i} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', overflowX: 'auto', margin: '8px 0', fontSize: '0.84em' }}>
          {lang && <div style={{ fontSize: '0.72em', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lang}</div>}
          <code style={{ color: '#a5f3fc', fontFamily: "'Fira Code', 'Consolas', monospace", whiteSpace: 'pre' }}>
            {codeLines.join('\n')}
          </code>
        </pre>
      );
      i++;
      continue;
    }

    // H1/H2/H3
    if (line.match(/^#{1,3} /)) {
      const level = (line.match(/^#+/) || [''])[0].length;
      const content = line.replace(/^#+\s*/, '');
      const size = level === 1 ? '1.05rem' : level === 2 ? '0.97rem' : '0.92rem';
      nodes.push(
        <div key={i} style={{ fontWeight: '700', fontSize: size, color: '#fff', margin: '10px 0 4px' }}>
          {parseInline(content, `h${i}`)}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[\-•*]\s/)) {
      const content = line.replace(/^[\-•*]\s/, '');
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
          <span style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '1px', fontSize: '0.8em' }}>◆</span>
          <span>{parseInline(content, `li${i}`)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const num = (line.match(/^(\d+)\./) || ['', ''])[1];
      const content = line.replace(/^\d+\.\s/, '');
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
          <span style={{ color: 'var(--accent-blue)', flexShrink: 0, fontWeight: '600', minWidth: '16px', textAlign: 'right' }}>{num}.</span>
          <span>{parseInline(content, `ol${i}`)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      nodes.push(<div key={i} style={{ height: '6px' }} />);
      i++;
      continue;
    }

    // Normal paragraph
    nodes.push(
      <p key={i} style={{ margin: '0 0 3px' }}>{parseInline(line, `p${i}`)}</p>
    );
    i++;
  }

  return <div style={{ lineHeight: '1.65', fontSize: '14px' }}>{nodes}</div>;
}

// ── Component ───────────────────────────────────────────────────────────────
function AiCommander({ supabase }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();

    const channel = supabase
      .channel('realtime-agent-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (!error) setMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    const userText = inputValue;
    setInputValue('');
    try {
      // Must use sender:'user' and message field — these are what the daemon reads
      await supabase.from('agent_chat').insert([{ sender: 'user', message: userText }]);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const isUser    = msg => (msg.sender || msg.role) === 'user';
  const isAgent   = msg => msg.sender === 'agent' || msg.role === 'ai';
  const getText   = msg => msg.message || msg.content || '';
  const getTime   = msg => {
    if (!msg.created_at) return '';
    try { return new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div className="commander-section animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ height: '70vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(8,11,26,0.95)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🤖
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Antigravity AI Commander</h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>Autonomous Decision & Scraper Controller</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.08)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>Agent Connected</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛸</div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '6px', fontSize: '1rem' }}>Secure Portal Established</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', fontSize: '13px', lineHeight: '1.6' }}>
                Type a message or click a quick command below to direct your autonomous agent.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const user  = isUser(msg);
            const agent = isAgent(msg);
            const text  = getText(msg);
            if (!text) return null;

            return (
              <div key={idx} style={{ display: 'flex', justifyContent: user ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  padding: '11px 15px',
                  borderRadius: user ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: user ? 'var(--accent-purple)' : 'rgba(255,255,255,0.04)',
                  color: 'var(--text-main)',
                  border: user ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: user ? '0 4px 14px rgba(139,92,246,0.25)' : 'none',
                }}>
                  {agent && (
                    <div style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Antigravity
                    </div>
                  )}
                  {agent ? <MarkdownText text={text} /> : <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.55' }}>{text}</div>}
                  <div style={{ fontSize: '10px', color: user ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', marginTop: '6px', textAlign: 'right' }}>
                    {getTime(msg)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,11,26,0.95)', flexShrink: 0 }}>
          {/* Quick commands */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { icon: '📊', text: 'Status',      cmd: '/status' },
              { icon: '🐍', text: 'Scrape Python', cmd: '/search python' },
              { icon: '⚙️', text: 'Scrape .NET',  cmd: '/search dotnet' },
              { icon: '📄', text: 'Logs',         cmd: '/logs' },
              { icon: '💡', text: 'Help',         cmd: '/help' },
            ].map(c => (
              <button
                key={c.text}
                onClick={() => setInputValue(c.cmd)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)', padding: '5px 11px', borderRadius: '20px',
                  fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <span>{c.icon}</span>{c.text}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Type a message or slash command (e.g. /status, /search react)..."
              disabled={isSending}
              style={{
                flex: 1, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '13px 16px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '14px', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputValue.trim()}
              style={{
                background: inputValue.trim() && !isSending ? 'var(--accent-purple)' : 'rgba(255,255,255,0.07)',
                color: inputValue.trim() && !isSending ? '#fff' : 'var(--text-muted)',
                border: 'none', padding: '0 22px', borderRadius: '10px',
                fontWeight: '700', fontSize: '14px', cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiCommander;
