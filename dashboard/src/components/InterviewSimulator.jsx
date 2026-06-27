import React, { useState, useEffect, useRef } from 'react';

const TOPICS = [
  { id: 'backend-dotnet',  label: 'Backend (.NET / C#)',    color: '#3b82f6' },
  { id: 'backend-node',    label: 'Node.js / TypeScript',   color: '#10b981' },
  { id: 'system-design',   label: 'System Design',          color: '#8b5cf6' },
  { id: 'algorithms',      label: 'Algorithms & DSA',       color: '#f59e0b' },
  { id: 'behavioral',      label: 'Behavioral / HR',        color: '#ec4899' },
];

function parseResponse(raw) {
  const body = raw.replace('[INTERVIEW_RESPONSE]', '').trim();
  const scoreMatch    = body.match(/SCORE:\s*(\d+)\/100/i);
  const feedbackMatch = body.match(/FEEDBACK:\s*([\s\S]+?)(?=QUESTION:|$)/i);
  const questionMatch = body.match(/QUESTION:\s*([\s\S]+?)$/i);
  return {
    score:    scoreMatch    ? parseInt(scoreMatch[1]) : null,
    feedback: feedbackMatch ? feedbackMatch[1].trim() : null,
    question: questionMatch ? questionMatch[1].trim() : body,
  };
}

function buildHistory(msgs) {
  const pairs = [];
  let lastQ = null;
  for (const m of msgs) {
    if (m.type === 'question') lastQ = m.text;
    else if (m.type === 'answer' && lastQ) {
      pairs.push(`Q: ${lastQ}\nA: ${m.text}`);
      lastQ = null;
    }
  }
  return pairs.join('\n\n');
}

function scoreColor(s) {
  return s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
}

function InterviewSimulator({ supabase }) {
  const [phase,         setPhase]         = useState('setup');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [messages,      setMessages]      = useState([]);
  const [scores,        setScores]        = useState([]);
  const [inputValue,    setInputValue]    = useState('');
  const [isWaiting,     setIsWaiting]     = useState(false);
  const messagesEndRef = useRef(null);

  const questionCount = messages.filter(m => m.type === 'question').length;
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  useEffect(() => {
    const channel = supabase
      .channel('interview-agent-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, payload => {
        const msg = payload.new;
        if (msg.sender !== 'agent') return;
        if (!msg.message?.startsWith('[INTERVIEW_RESPONSE]')) return;

        const { score, feedback, question } = parseResponse(msg.message);
        setIsWaiting(false);

        setMessages(prev => {
          const next = [...prev];
          if (score !== null && feedback) {
            next.push({ type: 'feedback', score, feedback });
          }
          if (question) {
            next.push({ type: 'question', text: question });
          }
          return next;
        });

        if (score !== null) {
          setScores(s => [...s, score]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  const startSession = async () => {
    setPhase('active');
    setIsWaiting(true);
    setMessages([]);
    setScores([]);
    await supabase.from('agent_chat').insert([{
      sender: 'user',
      message: `/interview [topic=${selectedTopic.label}]`,
    }]);
  };

  const submitAnswer = async () => {
    if (!inputValue.trim() || isWaiting) return;
    const answer = inputValue.trim();
    setInputValue('');
    setIsWaiting(true);

    const history = buildHistory(messages);
    setMessages(prev => [...prev, { type: 'answer', text: answer }]);

    await supabase.from('agent_chat').insert([{
      sender: 'user',
      message: `/interview [topic=${selectedTopic.label}]\n\nPREV:${history}\n\nANSWER:${answer}`,
    }]);
  };

  const resetSession = () => {
    setPhase('setup');
    setMessages([]);
    setScores([]);
    setInputValue('');
    setIsWaiting(false);
  };

  // ── Setup screen ──────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '32px' }}>
        <style>{`
          @keyframes iv-pulse { 0%,100%{opacity:.35} 50%{opacity:1} }
          @keyframes iv-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        `}</style>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
          Mock Interview Simulator
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6', fontSize: '14px' }}>
          An AI senior engineering manager will ask technical questions, grade your answers out of 100, and provide targeted feedback. Choose a topic to begin.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t)}
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: selectedTopic.id === t.id
                  ? `2px solid ${t.color}`
                  : '2px solid rgba(255,255,255,0.07)',
                background: selectedTopic.id === t.id
                  ? `${t.color}18`
                  : 'rgba(255,255,255,0.03)',
                color: selectedTopic.id === t.id ? t.color : 'var(--text-secondary)',
                fontWeight: selectedTopic.id === t.id ? '700' : '500',
                fontSize: '13.5px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={startSession}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '10px',
            background: selectedTopic.color,
            color: '#fff',
            fontWeight: '700',
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Start — {selectedTopic.label}
        </button>
      </div>
    );
  }

  // ── Active interview ───────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <style>{`
        @keyframes iv-pulse { 0%,100%{opacity:.35} 50%{opacity:1} }
        @keyframes iv-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: selectedTopic.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {selectedTopic.label}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
          </span>
          {avgScore !== null && (
            <span style={{ fontSize: '13px', fontWeight: '700', color: scoreColor(avgScore) }}>
              Avg score: {avgScore}/100
            </span>
          )}
        </div>
        <button
          onClick={resetSession}
          style={{
            padding: '5px 13px',
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          New Session
        </button>
      </div>

      {/* Chat panel */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, minHeight: 0 }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {messages.length === 0 && isWaiting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
              <span style={{
                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                background: selectedTopic.color,
                animation: 'iv-pulse 1.4s ease-in-out infinite',
              }} />
              Preparing your first question...
            </div>
          )}

          {messages.map((msg, idx) => {
            if (msg.type === 'question') return (
              <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '84%' }}>
                <div style={{ fontSize: '10px', color: selectedTopic.color, fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Interviewer
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${selectedTopic.color}22`,
                  borderLeft: `3px solid ${selectedTopic.color}`,
                  padding: '15px 18px',
                  borderRadius: '0 10px 10px 0',
                  color: 'var(--text-main)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14.5px',
                }}>
                  {msg.text}
                </div>
              </div>
            );

            if (msg.type === 'answer') return (
              <div key={idx} style={{ alignSelf: 'flex-end', maxWidth: '84%' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>
                  You
                </div>
                <div style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  padding: '14px 18px',
                  borderRadius: '10px 0 10px 10px',
                  color: 'var(--text-main)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14.5px',
                }}>
                  {msg.text}
                </div>
              </div>
            );

            if (msg.type === 'feedback') {
              const col = scoreColor(msg.score);
              return (
                <div key={idx} style={{
                  background: `${col}0c`,
                  border: `1px solid ${col}28`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  alignSelf: 'stretch',
                }}>
                  <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '48px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: col, lineHeight: 1 }}>{msg.score}</div>
                    <div style={{ fontSize: '10px', color: col, opacity: 0.7, fontWeight: '600', marginTop: '2px' }}>/100</div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>
                    {msg.feedback}
                  </p>
                </div>
              );
            }
            return null;
          })}

          {isWaiting && messages.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '6px 2px' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: `iv-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              disabled={isWaiting}
              placeholder={isWaiting ? 'Waiting for the interviewer...' : 'Type your answer... (Enter to submit, Shift+Enter for newline)'}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '13px 15px',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '14px',
                minHeight: '52px',
                maxHeight: '120px',
                resize: 'none',
                opacity: isWaiting ? 0.45 : 1,
                transition: 'opacity 0.2s',
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={isWaiting || !inputValue.trim()}
              style={{
                padding: '13px 20px',
                background: (!isWaiting && inputValue.trim()) ? selectedTopic.color : 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (!isWaiting && inputValue.trim()) ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
              }}
            >
              {isWaiting ? 'Grading...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewSimulator;
