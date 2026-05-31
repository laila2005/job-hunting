import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

const InterviewAgent = ({ job, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const model = 'gemini-2.5-flash';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start the interview
    if (job && messages.length === 0) {
      startInterview();
    }
  }, [job]);

  const startInterview = async () => {
    setIsTyping(true);
    const systemPrompt = `
      You are a Senior Engineering Manager at ${job.company}.
      You are conducting a technical interview for the position of ${job.title}.
      The candidate is Laila, a Junior Backend Engineer.
      Start the interview by introducing yourself warmly, mentioning the company (${job.company}), and asking the first technical or behavioral question.
      Keep your responses concise and conversational (like a real chat).
      Wait for her response before asking the next question. Do not ask multiple questions at once.
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: systemPrompt,
      });

      setMessages([{ role: 'agent', content: response.text }]);
    } catch (error) {
      console.error(error);
      setMessages([{ role: 'agent', content: "System Error: Unable to connect to Interview Agent." }]);
    }
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation history
      const historyStr = messages.map(m => `${m.role === 'agent' ? 'Interviewer' : 'Laila'}: ${m.content}`).join('\n');
      
      const prompt = `
        You are a Senior Engineering Manager at ${job.company} interviewing Laila for ${job.title}.
        Here is the conversation so far:
        ${historyStr}
        Laila: ${input}
        
        Respond to Laila's answer. If she did well, acknowledge it. If she struggled, give a gentle hint or explain the concept briefly.
        Then, ask the next interview question. Keep it very conversational and concise.
        Interviewer:
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      const agentMessage = { role: 'agent', content: response.text.replace('Interviewer:', '').trim() };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', content: "System Error: Connection lost." }]);
    }
    setIsTyping(false);
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Live Technical Interview</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Practicing for: {job?.title} at {job?.company}</span>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>Exit Interview</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-hover)',
            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
            padding: '12px 16px',
            borderRadius: '12px',
            maxWidth: '70%',
            lineHeight: '1.5'
          }}>
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Interviewer is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your answer..." 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
        />
        <button className="btn" onClick={handleSend} disabled={isTyping}>Send</button>
      </div>
    </div>
  );
};

export default InterviewAgent;
