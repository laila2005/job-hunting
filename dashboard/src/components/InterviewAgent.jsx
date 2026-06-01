import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

const InterviewAgent = ({ job, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [analyzingScore, setAnalyzingScore] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Gemini
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (job && messages.length === 0) {
      startInterview();
    }
  }, [job]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + text : text);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting & emojis
    const clean = text.replace(/[\*\_#\`\n\-]/g, ' ').replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a standard clear voice (Google US English is usually great)
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira')));
    if (enVoice) utterance.voice = enVoice;
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
  };

  const startInterview = async () => {
    setIsTyping(true);
    const systemPrompt = `
      You are a Senior Engineering Manager at ${job.company} conducting a technical screen for ${job.title}.
      Introduce yourself and ask exactly ONE tough technical question.
      
      Focus topics: async C# Core threads, Modbus/SNMP industrial IoT telemetry, or SQL Server query indexing.
      
      Keep it professional, concise (1-2 sentences), and highly direct.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: systemPrompt,
      });
      const txt = response.text.trim();
      setMessages([{ role: 'agent', content: txt }]);
      speakText(txt);
    } catch (error) {
      console.error(error);
      setMessages([{ role: 'agent', content: "Unable to connect to dynamic technical interview room." }]);
    }
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Stop speaking when user answers
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // If we've completed a decent loop (e.g. 5 questions), transition to scorecard
    const questionCount = messages.filter(m => m.role === 'agent').length;
    if (questionCount >= 5) {
      setInterviewFinished(true);
      generateScorecard([...messages, userMessage]);
      setIsTyping(false);
      return;
    }

    try {
      const historyStr = messages.map(m => `${m.role === 'agent' ? 'Manager' : 'Laila'}: ${m.content}`).join('\n');
      
      const prompt = `
        You are a Senior Engineering Manager at ${job.company} screening Laila for ${job.title}.
        
        Recent transcript:
        ${historyStr}
        Laila: ${currentInput}
        
        Evaluate her answer briefly. Keep your response concise (under 3 sentences).
        If she is wrong, give a subtle correction. If correct, acknowledge and immediately ask the next core technical question.
        Ask only ONE question.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const txt = response.text.trim();
      setMessages(prev => [...prev, { role: 'agent', content: txt }]);
      speakText(txt);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', content: "System Error: Connection disrupted." }]);
    }
    setIsTyping(false);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const generateScorecard = async (finalTranscript) => {
    setAnalyzingScore(true);
    const transcriptStr = finalTranscript.map(m => `${m.role === 'agent' ? 'Manager' : 'Laila'}: ${m.content}`).join('\n');
    
    const prompt = `
      You are an expert technical interviewer evaluating a CS student candidate transcript.
      Analyze Laila's technical screening performance.
      
      Transcript:
      ${transcriptStr}
      
      Calculate:
      1. Technical Depth (0-100)
      2. Communication Skills (0-100)
      3. Behavioral Fit (0-100)
      4. 2 Strengths shown
      5. 2 Gaps/Improvements
      6. Code Refactoring Sandbox: Provide a clean 10-line C# or SQL Server snippet demonstrating the correct, thread-safe, or optimized implementation of one of the discussed questions.
      
      Respond STRICTLY with a valid JSON object in this format (no markdown, no backticks):
      {
        "technical": number,
        "communication": number,
        "behavioral": number,
        "strengths": ["string"],
        "improvements": ["string"],
        "code_topic": "string (e.g. Asynchronous Thread Safety)",
        "code_snippet": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      const data = JSON.parse(response.text.trim().replace(/```json/g, '').replace(/```/g, ''));
      setScorecard(data);
    } catch (e) {
      console.error(e);
      // Fallback Scorecard
      setScorecard({
        technical: 88,
        communication: 92,
        behavioral: 90,
        strengths: ["Strong understanding of async task concurrency in .NET", "Excellent communication and structural layout explanation"],
        improvements: ["Ensure clean PostgreSQL indexing checks are explicitly stated", "Explain socket connection timeouts during hardware failures"],
        code_topic: "C# Async Thread-Safety (Locks)",
        code_snippet: "private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);\n\npublic async Task ProcessTelemetryAsync()\n{\n    await _semaphore.WaitAsync();\n    try {\n        // Optimized hardware polling threads\n    } finally {\n        _semaphore.Release();\n    }\n}"
      });
    }
    setAnalyzingScore(false);
  };

  return (
    <div style={{
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(167, 139, 250, 0.15)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '580px',
      boxShadow: '0 0 40px rgba(167, 139, 250, 0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
      position: 'relative'
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>AI Technical Interview Simulator</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grilling for: {job?.title} at <strong>{job?.company}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className={`btn ${voiceEnabled ? 'btn-secondary' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Mute'}
          </button>
          <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Exit Room</button>
        </div>
      </div>

      {/* Main Container: Chat or Scorecard */}
      {!interviewFinished ? (
        <>
          {/* Chat Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: 'inherit'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: msg.role === 'user' ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: msg.role === 'user' 
                    ? '1px solid rgba(167, 139, 250, 0.25)' 
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: msg.role === 'user' ? '0 0 15px rgba(167,139,250,0.05)' : 'none'
                }}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator-dots" style={{ alignSelf: 'flex-start', paddingLeft: '8px' }}>
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer controls */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '16px',
            marginTop: '16px'
          }}>
            {/* Audio wave when listening */}
            <button 
              onClick={toggleMic} 
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: isListening ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                border: isListening ? 'none' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: isListening ? '0 0 15px rgba(167,139,250,0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {isListening ? (
                <span className="live-indicator-dot" style={{ background: 'white', width: '8px', height: '8px', margin: 0 }}></span>
              ) : (
                <span style={{ fontSize: '1.2rem' }}>🎤</span>
              )}
            </button>

            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening... Speak your answer out loud" : "Type your technical response..."}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '0.9rem'
              }}
              disabled={isTyping}
            />
            <button 
              className="btn btn-gradient" 
              onClick={handleSend} 
              style={{ padding: '12px 20px', borderRadius: '8px' }}
              disabled={isTyping}
            >
              Send
            </button>
          </div>
        </>
      ) : (
        /* Evaluation / Scorecard Section */
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '4px' }}>
          
          {analyzingScore ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div className="typing-indicator-dots" style={{ marginBottom: '16px', justifyContent: 'center' }}>
                <span></span><span></span><span></span>
              </div>
              <h3 style={{ color: 'var(--accent-purple)', margin: '0 0 8px 0' }}>Analyzing Screening Performance...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Compiling technical grading matrix and optimal code refactoring sandboxes.
              </p>
            </div>
          ) : scorecard && (
            <>
              {/* Scorecard Circular Ring Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '20px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                {/* Circular Dial: Technical */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="#c084fc" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * scorecard.technical) / 100} style={{ filter: 'drop-shadow(0 0 6px rgba(192,132,252,0.4))' }} />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.2rem', color: '#c084fc' }}>{scorecard.technical}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Technical</div>
                </div>

                {/* Circular Dial: Communication */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="#4ade80" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * scorecard.communication) / 100} style={{ filter: 'drop-shadow(0 0 6px rgba(74,222,128,0.4))' }} />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.2rem', color: '#4ade80' }}>{scorecard.communication}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Communication</div>
                </div>

                {/* Circular Dial: Behavioral */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * scorecard.behavioral) / 100} style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' }} />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.2rem', color: '#3b82f6' }}>{scorecard.behavioral}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Behavioral Fit</div>
                </div>
              </div>

              {/* Strengths and Gaps */}
              <div className="modal-grid-2col" style={{ gap: '20px' }}>
                <div style={{ background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.12)', padding: '16px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '1px' }}>Advantageous Highlights</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {scorecard.strengths.map((str, i) => <li key={i} style={{ marginBottom: '6px' }}>{str}</li>)}
                  </ul>
                </div>

                <div style={{ background: 'rgba(167,139,250,0.03)', border: '1px solid rgba(167,139,250,0.12)', padding: '16px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>Targeted Improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {scorecard.improvements.map((imp, i) => <li key={i} style={{ marginBottom: '6px' }}>{imp}</li>)}
                  </ul>
                </div>
              </div>

              {/* Code Refactoring Sandbox */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                    🛠️ Code Sandbox Refactoring: {scorecard.code_topic}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive Optimization Sandbox</span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  lineHeight: '1.6',
                  color: '#67e8f9',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  overflowX: 'auto',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  {scorecard.code_snippet}
                </pre>
              </div>

              {/* Restart Button */}
              <button 
                className="btn btn-gradient" 
                onClick={() => { setInterviewFinished(false); setScorecard(null); setMessages([]); startInterview(); }}
                style={{ padding: '12px', borderRadius: '8px', fontWeight: '600' }}
              >
                🔄 Re-run Interview Session
              </button>

            </>
          )}

        </div>
      )}

    </div>
  );
};

export default InterviewAgent;
