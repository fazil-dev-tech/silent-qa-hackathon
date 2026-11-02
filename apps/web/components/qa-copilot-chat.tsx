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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '### 👋 Welcome to Silent QA Copilot!\n\nI am your autonomous **Principal QA & Software Architect**, powered by Nemotron-3 Causal AI with live Supabase database and telemetry access.\n\nI can assist you with:\n- **Defect Analysis**: Root-cause hypotheses, telemetry event correlation, and reproduction steps.\n- **General Tech & QA**: Unit/Integration/E2E testing, debouncing, idempotency, React, TypeScript, APIs, and algorithms.\n- **Code-Level Fixes**: Verified code patches to prevent race conditions and 500 exceptions.\n\nTry asking: *"Explain how the defect description was enhanced"*, *"How do I fix this in code?"*, or any general software question!',
      timestamp: Date.now(),
    },
  ]);

  function handleCopyMessage(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }

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
              background: 'rgba(13, 16, 25, 0.96)',
              backdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(220, 38, 38, 0.15)',
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
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.18) 0%, rgba(13, 16, 25, 0.98) 100%)',
                borderBottom: '1px solid rgba(220, 38, 38, 0.25)',
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
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                      Silent QA Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: '#86EFAC',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      LIVE SUPABASE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: '0.1rem 0 0' }}>
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
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
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
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
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
                    background: 'rgba(220, 38, 38, 0.2)',
                    border: '1px solid rgba(220, 38, 38, 0.35)',
                    color: '#FCA5A5',
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
                  background: 'rgba(2, 132, 199, 0.12)',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '0.45rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                  color: '#38BDF8',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                <span style={{ fontWeight: 800 }}>🎯 Active Defect:</span>
                <strong style={{ color: '#7DD3FC', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeReport.title}
                </strong>
                <span style={{ color: '#38BDF8', marginLeft: 'auto', flexShrink: 0, fontWeight: 700 }}>
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
                background: 'rgba(13, 16, 25, 0.9)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              {[
                'Explain how this defect was enhanced',
                'What is the root cause hypothesis?',
                'How do I fix this in code?',
                'Show reproduction steps',
                'Explain 85%+ quality criteria',
                'What is an idempotency key?',
                'Debouncing vs Throttling',
                'Unit vs Integration vs E2E',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(p)}
                  disabled={loading}
                  style={{
                    flexShrink: 0,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    color: '#94A3B8',
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
                background: '#07080A',
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
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: isUser ? '82%' : '96%',
                        padding: isUser ? '0.75rem 1rem' : '1rem 1.25rem',
                        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isUser
                          ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                          : 'rgba(255, 255, 255, 0.04)',
                        color: isUser ? '#FFFFFF' : '#F8FAFC',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        boxShadow: isUser
                          ? '0 4px 14px rgba(220, 38, 38, 0.35)'
                          : '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                        border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.09)',
                      }}
                    >
                      {!isUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem', paddingBottom: '0.45rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                            }}
                          >
                            <Bot size={11} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F87171' }}>
                            Silent QA Copilot
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748B', marginLeft: 'auto' }}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <RenderFormattedMessage content={m.content} isUser={isUser} />
                    </div>

                    {!isUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem', padding: '0 0.35rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                          Nemotron-3 Causal AI
                        </span>
                        <button
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          title="Copy message to clipboard"
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: copiedMessageId === m.id ? '#4ADE80' : '#94A3B8',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            padding: '0.15rem 0.45rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {copiedMessageId === m.id ? <Check size={11} color="#4ADE80" /> : <Copy size={11} />}
                          <span>{copiedMessageId === m.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                    {isUser && (
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
                    )}
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.8rem', padding: '0.5rem' }}>
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
                background: 'rgba(13, 16, 25, 0.95)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.95rem',
                  color: '#F8FAFC',
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

// High-End Cyberpunk Markdown & UI/UX Renderer for Silent QA Copilot
function RenderFormattedMessage({ content, isUser }: { content: string; isUser?: boolean }) {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>;
  }

  // Ensure unclosed code fences are safely terminated
  let normalized = content;
  const codeFenceMatches = normalized.match(/```/g);
  if (codeFenceMatches && codeFenceMatches.length % 2 !== 0) {
    normalized += '\n```';
  }

  // Split by code blocks first
  const blocks = normalized.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem', lineHeight: 1.6 }}>
      {blocks.map((block, bIdx) => {
        if (block.startsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const lang = lines[0].match(/^[a-z0-9_-]+/i) ? lines[0] : '';
          const code = lang ? lines.slice(1).join('\n') : lines.join('\n');
          return <CodeBlock key={bIdx} code={code} lang={lang} />;
        }

        // Group lines into tables and standard lines
        const rawLines = block.split('\n');
        const elements: Array<{ type: 'table'; lines: string[] } | { type: 'line'; text: string }> = [];
        let tableBuffer: string[] = [];

        const flushTable = () => {
          if (tableBuffer.length > 0) {
            elements.push({ type: 'table', lines: [...tableBuffer] });
            tableBuffer = [];
          }
        };

        for (const line of rawLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            tableBuffer.push(line);
          } else {
            flushTable();
            elements.push({ type: 'line', text: line });
          }
        }
        flushTable();

        return (
          <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
            {elements.map((el, elIdx) => {
              if (el.type === 'table') {
                return <TableBlock key={elIdx} lines={el.lines} />;
              }

              const line = el.text;
              const trimmed = line.trim();

              // Empty line
              if (!trimmed) {
                return <div key={elIdx} style={{ height: '0.35rem' }} />;
              }

              // Heading 1 (# ...)
              if (trimmed.startsWith('# ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: '#F8FAFC',
                      marginTop: '0.75rem',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderBottom: '1px solid rgba(220, 38, 38, 0.25)',
                      paddingBottom: '0.35rem',
                    }}
                  >
                    <span style={{ width: 4, height: 18, background: '#DC2626', borderRadius: 2 }} />
                    <span>{renderInline(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Heading 2 (## ...)
              if (trimmed.startsWith('## ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      marginTop: '0.65rem',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      borderLeft: '3px solid #DC2626',
                    }}
                  >
                    <span>{renderInline(trimmed.slice(3))}</span>
                  </div>
                );
              }

              // Heading 3 (### ...)
              if (trimmed.startsWith('### ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: '#38BDF8',
                      marginTop: '0.55rem',
                      marginBottom: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span style={{ width: 3, height: 14, background: '#38BDF8', borderRadius: 2 }} />
                    <span>{renderInline(trimmed.slice(4))}</span>
                  </div>
                );
              }

              // Heading 4 (#### ...)
              if (trimmed.startsWith('#### ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#FCA5A5',
                      marginTop: '0.45rem',
                      marginBottom: '0.15rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {renderInline(trimmed.slice(5))}
                  </div>
                );
              }

              // Horizontal Rule (--- or ***)
              if (trimmed === '---' || trimmed === '***') {
                return (
                  <div
                    key={elIdx}
                    style={{
                      height: 1,
                      background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.4), rgba(56, 189, 248, 0.4), transparent)',
                      margin: '0.65rem 0',
                    }}
                  />
                );
              }

              // Blockquote (> ...)
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      borderLeft: '3px solid #DC2626',
                      background: 'rgba(220, 38, 38, 0.08)',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0 8px 8px 0',
                      margin: '0.35rem 0',
                      fontSize: '0.82rem',
                      color: '#CBD5E1',
                      fontStyle: 'italic',
                    }}
                  >
                    {renderInline(trimmed.slice(2))}
                  </div>
                );
              }

              // Bullet List Item (- ... or * ...)
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      margin: '0.2rem 0',
                      paddingLeft: '0.35rem',
                    }}
                  >
                    <span style={{ color: '#F87171', fontSize: '0.75rem', lineHeight: 1.5, flexShrink: 0, marginTop: '0.1rem' }}>
                      ◆
                    </span>
                    <div style={{ flex: 1, fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.55 }}>
                      {renderInline(trimmed.slice(2))}
                    </div>
                  </div>
                );
              }

              // Numbered List Item (1. ..., 2. ...)
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div
                    key={elIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      margin: '0.22rem 0',
                      paddingLeft: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(220, 38, 38, 0.2)',
                        border: '1px solid rgba(220, 38, 38, 0.35)',
                        color: '#FCA5A5',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.05rem 0.35rem',
                        borderRadius: '4px',
                        flexShrink: 0,
                        marginTop: '0.15rem',
                      }}
                    >
                      {numMatch[1]}
                    </span>
                    <div style={{ flex: 1, fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.55 }}>
                      {renderInline(numMatch[2])}
                    </div>
                  </div>
                );
              }

              // Standard Paragraph line
              return (
                <div key={elIdx} style={{ fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.55 }}>
                  {renderInline(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Interactive High-Contrast Cyberpunk Table Renderer
function TableBlock({ lines }: { lines: string[] }) {
  const parsedRows = lines
    .map((l) => l.trim().slice(1, -1).split('|').map((c) => c.trim()))
    .filter((r) => !r.every((c) => c.match(/^:?-+:?$/))); // remove separator row

  if (parsedRows.length === 0) return null;
  const headers = parsedRows[0];
  const rows = parsedRows.slice(1);

  return (
    <div
      style={{
        overflowX: 'auto',
        margin: '0.65rem 0',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.35)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(220, 38, 38, 0.18)', borderBottom: '1px solid rgba(220, 38, 38, 0.35)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '0.45rem 0.65rem', color: '#FCA5A5', fontWeight: 800, letterSpacing: '0.02em' }}>
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{ padding: '0.4rem 0.65rem', color: '#E2E8F0', verticalAlign: 'top' }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline Markdown Parser: `code`, **bold**, *italic*
function renderInline(text: string) {
  // Regex to split by `code`, **bold**, or *italic*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+?\*\*|\*[^*]+?\*)/g);

  return (
    <>
      {tokens.map((token, idx) => {
        if (!token) return null;

        // Inline Code `...`
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          return (
            <code
              key={idx}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
                padding: '0.12rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                wordBreak: 'break-all',
              }}
            >
              {token.slice(1, -1)}
            </code>
          );
        }

        // Bold **...**
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
          return (
            <strong
              key={idx}
              style={{
                color: '#F8FAFC',
                fontWeight: 700,
              }}
            >
              {token.slice(2, -2)}
            </strong>
          );
        }

        // Italic *...*
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
          return (
            <em
              key={idx}
              style={{
                color: '#CBD5E1',
                fontStyle: 'italic',
              }}
            >
              {token.slice(1, -1)}
            </em>
          );
        }

        return <span key={idx}>{token}</span>;
      })}
    </>
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
        background: '#04060B',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.35rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.7rem',
          color: '#38BDF8',
          fontFamily: 'monospace',
          fontWeight: 700,
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
          lineHeight: 1.55,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
