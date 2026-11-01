'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  Layers,
  MessageSquare,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface QACopilotChatProps {
  activeReport?: any | null;
  sessionId?: string | null;
}

export default function QACopilotChat({ activeReport, sessionId }: QACopilotChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your **Silent QA Copilot**. I have live access to your Supabase defect reports and telemetry flight recorder.\n\nAsk me about any component defect (e.g., *"What is the problem in the checkout button?"* or *"How do I fix the duplicate request in code?"*).',
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
          report_id: activeReport?.id || undefined,
          session_id: sessionId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ ${data.error || 'Failed to connect to QA Copilot engine.'}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Network error communicating with QA Copilot API: ${err?.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(promptText: string) {
    handleSendMessage(promptText);
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Chat cleared. How can I assist you with your defect reports or telemetry analysis?',
        timestamp: Date.now(),
      },
    ]);
  }

  return (
    <>
      {/* Floating Trigger Pill in Bottom Right */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 25px rgba(220, 38, 38, 0.35)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
          }}
        >
          <Sparkles size={16} />
          <span>QA Copilot</span>
          {activeReport && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 6px #4ADE80',
              }}
              title="Context loaded from active report"
            />
          )}
        </motion.button>
      )}

      {/* Slide-in Chat Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: isExpanded ? '20px' : '24px',
              right: isExpanded ? '20px' : '24px',
              width: isExpanded ? 'calc(100vw - 40px)' : '460px',
              maxWidth: isExpanded ? '900px' : '460px',
              height: isExpanded ? 'calc(100vh - 40px)' : '620px',
              maxHeight: 'calc(100vh - 40px)',
              background: '#0F172A',
              border: '1.5px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(220, 38, 38, 0.15)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                background: '#1E293B',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Bot size={17} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#F8FAFC' }}>
                      Silent QA Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: '#4ADE80',
                        background: 'rgba(74, 222, 128, 0.12)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                      }}
                    >
                      SUPABASE LIVE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    OpenRouter Nemotron-3 • Deep Causal Analysis
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '0.3rem',
                    borderRadius: '4px',
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore' : 'Expand'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '0.3rem',
                    borderRadius: '4px',
                  }}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Copilot"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '0.3rem',
                    borderRadius: '4px',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Active Context Banner */}
            {activeReport && (
              <div
                style={{
                  background: '#0B1120',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '0.4rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.725rem',
                  color: '#38BDF8',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                <span>🎯 Active Defect:</span>
                <strong style={{ color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeReport.title}
                </strong>
                <span style={{ color: '#64748B', marginLeft: 'auto', flexShrink: 0 }}>
                  ({activeReport.severity?.toUpperCase()})
                </span>
              </div>
            )}

            {/* Quick Prompt Pills Bar */}
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                padding: '0.55rem 1rem',
                background: '#131D31',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                whiteSpace: 'nowrap',
              }}
            >
              {[
                'What is the problem in the tested button?',
                'Explain root cause hypothesis',
                'How do I fix this in code?',
                'Show reproduction steps',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(p)}
                  disabled={loading}
                  style={{
                    flexShrink: 0,
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.65rem',
                    color: '#CBD5E1',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Message History Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: '#0B1120',
              }}
            >
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        padding: '0.75rem 1rem',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isUser ? '#DC2626' : '#1E293B',
                        color: isUser ? '#FFFFFF' : '#E2E8F0',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <RenderFormattedMessage content={m.content} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: '#64748B',
                        marginTop: '0.25rem',
                        padding: '0 0.25rem',
                      }}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8', fontSize: '0.8rem', padding: '0.5rem' }}>
                  <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #DC2626', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Nemotron AI is querying Supabase and synthesizing answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#1E293B',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Copilot about any button, error, or fix..."
                style={{
                  flex: 1,
                  background: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                style={{
                  background: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputMessage.trim() ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Simple Markdown / Code renderer for Chat messages
function RenderFormattedMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0].match(/^[a-z]+/i) ? lines[0] : '';
          const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

          return <CodeBlock key={index} code={code} lang={lang} />;
        }

        // Normal formatted text
        return (
          <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
            {part}
          </span>
        );
      })}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        margin: '0.5rem 0',
        background: '#040711',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.3rem 0.65rem',
          background: '#0F172A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.68rem',
          color: '#94A3B8',
          fontFamily: 'monospace',
        }}
      >
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.68rem',
          }}
        >
          {copied ? <Check size={11} color="#4ADE80" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          padding: '0.65rem',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '0.78rem',
          color: '#E2E8F0',
          overflowX: 'auto',
          lineHeight: 1.45,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
