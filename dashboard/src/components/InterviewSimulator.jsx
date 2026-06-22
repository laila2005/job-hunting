import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function InterviewSimulator({ supabase }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchInterviewHistory();

    const channel = supabase
      .channel('realtime-interview')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interview_sessions' },
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInterviewHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (!error) setMessages(data || []);
    } catch (error) {
      console.error('Error fetching interview history:', error);
    }
  };

  const handleSendAnswer = async () => {
    if (!inputValue.trim()) return;

    setIsSending(true);
    const userText = inputValue;
    setInputValue('');

    try {
      await supabase.from('interview_sessions').insert([{ role: 'user', content: userText }]);
    } catch (error) {
      console.error('Failed to send answer:', error);
      alert(`Failed to send answer: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
          🎤 Mock Interview Simulator
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your AI Senior Engineering Manager is evaluating your backend technical knowledge. Answer the questions as if you were in a real interview.
        </p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {!isUser && msg.score !== null && msg.score !== undefined && (
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: msg.score >= 80 ? '#10b981' : msg.score >= 50 ? '#f59e0b' : '#ef4444', marginBottom: '4px', paddingLeft: '4px' }}>
                    Score: {msg.score}/100
                  </div>
                )}
                <div style={{
                  background: isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.3)',
                  border: isUser ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
          {isSending && (
            <div style={{ alignSelf: 'flex-end', color: 'var(--text-muted)', fontSize: '14px' }}>
              Submitting answer...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer();
                }
              }}
              placeholder="Type your answer here... (Use Shift+Enter for new lines)"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '15px',
                minHeight: '60px',
                resize: 'none'
              }}
            />
            <button
              onClick={handleSendAnswer}
              disabled={isSending || !inputValue.trim()}
              style={{
                padding: '0 24px',
                background: inputValue.trim() ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {isSending ? 'Grading...' : 'Submit Answer'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default InterviewSimulator;
