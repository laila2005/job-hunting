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
          console.log('New chat message caught by realtime:', payload.new);
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
    const { data, error } = await supabase
      .from('agent_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching chat history:', error);
    } else {
      setMessages(data || []);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText) return;

    setInputValue('');
    setIsSending(true);

    try {
      const { error } = await supabase
        .from('agent_chat')
        .insert([{ sender: 'user', message: messageText }]);

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
      }
    } catch (err) {
      console.error('Error in handleSend:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const commandChips = [
    { label: '📊 System Status', cmd: '/status' },
    { label: '🐍 Scrape Python', cmd: '/search python' },
    { label: '🚀 Scrape .NET', cmd: '/search c#' },
    { label: '📝 Show Logs', cmd: '/logs' },
    { label: '💡 Help & Info', cmd: '/help' }
  ];

  return (
    <div className="chat-window-wrapper">
      <div className="chat-header">
        <div className="chat-agent-info">
          <div className="chat-agent-avatar">🤖</div>
          <div>
            <h3 className="chat-agent-name">Antigravity AI Commander</h3>
            <p className="chat-agent-subtitle">Autonomous Decision & Scraper Controller</p>
          </div>
        </div>
        <div className="chat-status-indicator">
          <span className="heartbeat-dot"></span>
          Agent Connected
        </div>
      </div>

      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">🛸</div>
            <h4>Secure Portal Established</h4>
            <p>Welcome, Laila. Type a message or click a command below to direct your autonomous agent.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-container ${msg.sender === 'user' ? 'bubble-right' : 'bubble-left'}`}
            >
              <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-agent'}`}>
                <div className="bubble-text">{msg.message}</div>
                <div className="bubble-timestamp">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-controls">
        <div className="command-chips-row">
          {commandChips.map((chip, idx) => (
            <button
              key={idx}
              className="chip-btn"
              onClick={() => handleSend(chip.cmd)}
              disabled={isSending}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            className="chat-text-input"
            placeholder="Type a message or slash command (e.g. /status)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
          />
          <button
            className="btn btn-gradient send-message-btn"
            onClick={() => handleSend()}
            disabled={isSending || !inputValue.trim()}
          >
            {isSending ? 'Sending...' : 'Transmit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiCommander;
