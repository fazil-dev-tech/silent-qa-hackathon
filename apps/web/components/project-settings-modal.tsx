'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Key, Shield, Radio, Terminal, Settings } from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSettingsModal({ isOpen, onClose }: ProjectSettingsModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const projectToken = 'sqa_live_demo_key_2026';
  const projectId = '33333333-3333-3333-3333-333333333333';
  const apiEndpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/ingest` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/ingest` : 'http://localhost:3000/api/ingest');

  const extensionConfigJson = JSON.stringify(
    {
      project_token: projectToken,
      api_endpoint: apiEndpoint,
    },
    null,
    2
  );

  function copyText(text: string, type: 'key' | 'snippet') {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'rgba(13, 16, 25, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          color: '#F8FAFC',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(13, 16, 25, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="#DC2626" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Project &amp; API Key Configuration
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Project Details */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Active Project ID:
            </label>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#F8FAFC', background: 'rgba(255, 255, 255, 0.04)', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {projectId}
            </div>
          </div>

          {/* Project API Ingestion Token */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Project API Ingest Token:
              </label>
              <button
                onClick={() => copyText(projectToken, 'key')}
                className="btn-secondary"
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {copiedKey ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                <span>{copiedKey ? 'Copied Token!' : 'Copy Token'}</span>
              </button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#F87171', fontWeight: 700, background: 'rgba(220, 38, 38, 0.12)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
              {projectToken}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>
              SHA-256 hashed in database. Pass as <code style={{ color: '#F87171' }}>project_token</code> in ingestion payloads from the extension or CLI recorder.
            </p>
          </div>

          {/* System Services Status */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.75rem' }}>
              Carrier-Grade Service Connections
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94A3B8' }}>Database:</span>{' '}
                <strong style={{ color: '#34D399' }}>Supabase PostgreSQL (Live)</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>AI Reasoner:</span>{' '}
                <strong style={{ color: '#38BDF8' }}>OpenRouter Nemotron-3</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Email SMTP:</span>{' '}
                <strong style={{ color: '#34D399' }}>Gmail SSL (Port 465)</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Realtime Pub:</span>{' '}
                <strong style={{ color: '#34D399' }}>supabase_realtime Active</strong>
              </div>
            </div>
          </div>

          {/* Chrome Extension Setup Snippet */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Chrome Extension Configuration:
              </label>
              <button
                onClick={() => copyText(extensionConfigJson, 'snippet')}
                className="btn-secondary"
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {copiedSnippet ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                <span>{copiedSnippet ? 'Copied Config!' : 'Copy Config'}</span>
              </button>
            </div>
            <pre style={{ background: '#07080A', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#E2E8F0', padding: '0.85rem', borderRadius: '8px', fontSize: '0.785rem', lineHeight: 1.4 }}>
              <code>{extensionConfigJson}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255, 255, 255, 0.02)' }}>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

