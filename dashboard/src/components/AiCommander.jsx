import React, { useState, useEffect, useRef } from 'react';

function AiCommander({ supabase }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();

    // Subscribe to realtime updates for this specific table
    const channel = supabase
      .channel('realtime-agent-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_chat' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (!error) setMessages(data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    setIsSending(true);
    const userText = inputValue;
    setInputValue('');

    try {
      await supabase.from('agent_chat').insert([{ role: 'user', content: userText }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const injectCommand = (cmd) => {
    setInputValue(cmd);
  };

  return (
    <div className="commander-section animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(12, 15, 34, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>🤖</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Antigravity AI Commander</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Autonomous Decision & Scraper Controller
              </div>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>Agent Connected</span>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛸</div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Secure Portal Established</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
                Welcome, Laila. Type a message or click a command below to direct your autonomous agent.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.05)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)',
                border: msg.role === 'ai' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                boxShadow: msg.role === 'user' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                lineHeight: '1.5',
                fontSize: '14px'
              }}>
                {msg.role === 'ai' && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-teal)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Antigravity
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div style={{ 
                  fontSize: '10px', 
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', 
                  marginTop: '8px',
                  textAlign: 'right'
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(12, 15, 34, 0.9)'
        }}>
          {/* Quick Commands */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { icon: '📊', text: 'System Status', cmd: '/status' },
              { icon: '🐍', text: 'Scrape Python', cmd: '/scrape python' },
              { icon: '🚀', text: 'Scrape .NET', cmd: '/scrape dotnet' },
              { icon: '📄', text: 'Show Logs', cmd: '/logs tail' },
              { icon: '💡', text: 'Help & Info', cmd: '/help' },
            ].map(cmd => (
              <button
                key={cmd.text}
                onClick={() => injectCommand(cmd.cmd)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.borderColor = 'var(--accent-purple)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span>{cmd.icon}</span> {cmd.text}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message or slash command (e.g. /status)..."
              disabled={isSending}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-purple)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.1)',
                color: inputValue.trim() ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '0 24px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                opacity: isSending ? 0.7 : 1
              }}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiCommander;
