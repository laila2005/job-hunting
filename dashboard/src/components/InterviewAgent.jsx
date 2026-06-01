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
      You are conducting a strict, realistic technical screen with a candidate for the ${job.title} role.
      
      Here is the candidate's Application Quality Score data:
      Strengths: ${job.aqs_strengths ? job.aqs_strengths.join(', ') : 'Strong match'}
      Risks: ${job.aqs_risks ? job.aqs_risks.join(', ') : 'None'}

      INSTRUCTIONS:
      1. Introduce yourself briefly.
      2. Ask exactly ONE technical question per message. Wait for the candidate's answer.
      3. Specifically drill into the candidate's "Risks". If they lack cloud experience, grill them on cloud deployments.
      4. If their answer is weak, correct them gently but firmly.
      5. Keep your responses under 3 sentences. Be professional, slightly intimidating, but fair.
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
    <div className="interview-container">
      <div className="interview-header">
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Live Technical Interview</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Practicing for: {job?.title} at {job?.company}</span>
        </div>
        <button className="btn btn-secondary exit-btn" onClick={onBack}>Exit Interview</button>
      </div>

      <div className="interview-body">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-agent'}`}>
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="interview-footer">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your answer..." 
          className="interview-input"
        />
        <button className="btn send-btn" onClick={handleSend} disabled={isTyping}>Send</button>
      </div>
    </div>
  );
};

export default InterviewAgent;
