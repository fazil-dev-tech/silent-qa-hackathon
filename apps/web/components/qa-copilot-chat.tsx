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
  Award,
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
        'Hello! I am your **Silent QA Copilot** — powered by OpenRouter Nemotron-3 and live Supabase PostgreSQL telemetry.\n\nAsk me about defect enhancement criteria, root cause analysis, or code fixes (e.g. *"Why is the checkout button failing with 500?"* or *"Explain how the defect description was enhanced"*).',
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
        content: 'Chat cleared. How can I assist you with your defect specifications or telemetry analysis?',
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
            border: '1px solid rgba(255, 255, 255, 0.25)',
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
              title="Active Defect Context Loaded"
            />
          )}
        </motion.button>
      )}

      {/* Slide-in Chat Drawer / Modal in Light Theme Glassmorphism */}
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
              width: isExpanded ? 'calc(100vw - 40px)' : '480px',
              maxWidth: isExpanded ? '920px' : '480px',
              height: isExpanded ? 'calc(100vh - 40px)' : '640px',
              maxHeight: 'calc(100vh - 40px)',
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(220, 38, 38, 0.2)',
              borderRadius: '20px',
              boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.18), 0 0 35px rgba(220, 38, 38, 0.08)',
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
                padding: '0.95rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(255, 241, 242, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
                borderBottom: '1px solid rgba(220, 38, 38, 0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                      Silent QA Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: '#15803D',
                        background: '#DCFCE7',
                        border: '1px solid #86EFAC',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      LIVE SUPABASE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: '0.1rem 0 0' }}>
                    Nemotron-3 Causal AI • Defect Enhancement &amp; Root Cause
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  style={{
                    background: '#F3F4F6',
                    border: 'none',
                    color: '#4B5563',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore' : 'Expand'}
                  style={{
                    background: '#F3F4F6',
                    border: 'none',
                    color: '#4B5563',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Copilot"
                  style={{
                    background: '#FEE2E2',
                    border: 'none',
                    color: '#DC2626',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
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
                  background: '#F0F9FF',
                  borderBottom: '1px solid #BAE6FD',
                  padding: '0.45rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                  color: '#0369A1',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                <span style={{ fontWeight: 800 }}>🎯 Active Defect:</span>
                <strong style={{ color: '#0C4A6E', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeReport.title}
                </strong>
                <span style={{ color: '#0284C7', marginLeft: 'auto', flexShrink: 0, fontWeight: 700 }}>
                  ({activeReport.severity?.toUpperCase()})
                </span>
              </div>
            )}

            {/* Quick Prompt Pills Bar */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                overflowX: 'auto',
                padding: '0.6rem 1rem',
                background: '#FFFFFF',
                borderBottom: '1px solid rgba(17, 24, 39, 0.06)',
                whiteSpace: 'nowrap',
              }}
            >
              {[
                'Explain how this defect was enhanced',
                'What is the root cause hypothesis?',
                'How do I fix this in code?',
                'Show reproduction steps',
                'Explain 85%+ quality criteria',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(p)}
                  disabled={loading}
                  style={{
                    flexShrink: 0,
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    color: '#374151',
                    fontSize: '0.725rem',
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
                background: '#FFF8F8',
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
                        padding: '0.85rem 1.15rem',
                        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isUser
                          ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                          : 'rgba(255, 255, 255, 0.98)',
                        color: isUser ? '#FFFFFF' : '#1F2937',
                        fontSize: '0.85rem',
                        lineHeight: 1.55,
                        boxShadow: isUser
                          ? '0 4px 14px rgba(220, 38, 38, 0.25)'
                          : '0 2px 10px rgba(0, 0, 0, 0.04)',
                        border: isUser ? 'none' : '1px solid rgba(220, 38, 38, 0.12)',
                      }}
                    >
                      <RenderFormattedMessage content={m.content} isUser={isUser} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: '#9CA3AF',
                        marginTop: '0.3rem',
                        padding: '0 0.25rem',
                      }}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.8rem', padding: '0.5rem' }}>
                  <div
                    className="animate-spin"
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid #DC2626',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Nemotron AI is analyzing Supabase telemetry and synthesizing answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                background: '#FFFFFF',
                borderTop: '1px solid rgba(220, 38, 38, 0.12)',
                display: 'flex',
                gap: '0.6rem',
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
                placeholder="Ask Copilot about any defect, button, or code fix..."
                style={{
                  flex: 1,
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '0.65rem 0.95rem',
                  color: '#111827',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputMessage.trim() ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Simple Markdown / Code renderer for Chat messages
function RenderFormattedMessage({ content, isUser }: { content: string; isUser?: boolean }) {
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

        // Bold text parser
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
        margin: '0.65rem 0',
        background: '#0F172A',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.35rem 0.75rem',
          background: '#1E293B',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.7rem',
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
            gap: '0.25rem',
            fontSize: '0.7rem',
          }}
        >
          {copied ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          padding: '0.85rem',
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.8rem',
          color: '#E2E8F0',
          overflowX: 'auto',
          lineHeight: 1.5,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
