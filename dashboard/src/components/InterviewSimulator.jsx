import React, { useState, useEffect, useRef } from 'react';

const InterviewSimulator = ({ job, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi Laila! I'm your AI recruiter for the ${job.title} role at ${job.company || 'this company'}. I'm going to test your technical skills, specifically targeting your gaps in Docker and CI/CD, as well as your strong points in C# and ASP.NET. Are you ready for the first question?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const sessionId = useRef(Date.now().toString());
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:3001/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          jobTitle: job.title,
          company: job.company || 'the company',
          message: input
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the interview server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="interview-simulator-modal" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '700px', height: '80vh',
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(12, 15, 34, 0.9)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--accent-purple)' }}>🎙️ AI Technical Interview</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Target: {job.title} at {job.company || 'this company'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '16px', borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                lineHeight: '1.5', fontSize: '15px'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(12, 15, 34, 0.9)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your answer..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '15px' }}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent-purple)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isTyping ? 0.7 : 1 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSimulator;
