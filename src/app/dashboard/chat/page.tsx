'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your QA Assistant powered by AI. I can help you with:\n\n• **Analyzing errors** captured by the extension\n• **Suggesting test cases** for your features\n• **Explaining technical errors** in plain language\n• **Recommending severity levels** for bugs\n• **Testing methodology** guidance\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history,
          sessionId: null,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || data.error || 'Sorry, I could not process that request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to connect to AI service. Please check your API key.', timestamp: new Date() },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const quickPrompts = [
    '🔍 What errors were captured recently?',
    '📝 Suggest test cases for a login page',
    '🎯 How should I classify bug severity?',
    '💡 Best practices for writing bug reports',
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">QA Chatbot</h1>
        <p className="page-subtitle">Your AI-powered QA assistant — ask anything about testing</p>
      </div>

      <div className="glass-card chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              <div style={{
                fontSize: '10px',
                color: msg.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)',
                marginTop: '6px'
              }}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                onClick={() => { setInput(prompt); }}
                style={{ fontSize: '12px' }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <input
            ref={inputRef}
            className="chat-input"
            placeholder="Ask me anything about QA, testing, or captured errors..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? <span className="spinner" /> : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
