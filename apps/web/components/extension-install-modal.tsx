'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Terminal,
  Cpu,
  Radio,
  FileCode,
  FolderArchive,
  ArrowRight,
  Puzzle,
} from 'lucide-react';

interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExtensionInstallModal({ isOpen, onClose }: ExtensionInstallModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function handleCopy(text: string, type: 'url' | 'path') {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(null as any), 2000);
    } else {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(null as any), 2000);
    }
  }

  function handleTriggerDownload() {
    setDownloading(true);
    // Direct browser download
    const link = document.createElement('a');
    link.href = '/api/extension/download';
    link.download = 'silent-qa-flight-recorder-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 1500);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '1.5rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            background: 'linear-gradient(145deg, #0B0E14 0%, #07090D 100%)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(220, 38, 38, 0.15)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(220, 38, 38, 0.25)',
                }}
              >
                <Puzzle size={20} color="#F87171" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
                    Silent QA Flight Recorder Extension
                  </h2>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Manifest V3
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
                  Zero-Overhead (&lt;0.15ms) In-Browser Telemetry &amp; Causal Bug Recording
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Primary Download Banner Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(13, 16, 25, 0.95) 100%)',
                border: '1px solid rgba(220, 38, 38, 0.35)',
                borderRadius: '12px',
                padding: '1.25rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(220, 38, 38, 0.25)',
                    border: '1px solid rgba(220, 38, 38, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FolderArchive size={24} color="#F87171" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                    silent-qa-flight-recorder-v1.0.0.zip
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                    Production-ready bundle • Built with Manifest V3 • 25 KB
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleTriggerDownload}
                  disabled={downloading}
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: downloading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!downloading) e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Download size={16} className={downloading ? 'animate-bounce' : ''} />
                  <span>{downloading ? 'Downloading...' : 'Download Extension (.ZIP)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <Cpu size={15} color="#38BDF8" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>OVERHEAD</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>&lt; 0.15ms Zero Scroll Jank</div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <Shield size={15} color="#4ADE80" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>PII SCRUBBING</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4ADE80' }}>Luhn Verified Modulo-10</div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <Radio size={15} color="#F87171" />
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>TELEMETRY BUFFER</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>500-Slot AES Ring Buffer</div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Installation Guide */}
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Terminal size={14} color="#DC2626" />
                <span>Browser Setup Instructions (Step-by-Step)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Step 1 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.25)',
                      border: '1px solid rgba(220, 38, 38, 0.45)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    1
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Extract the Downloaded .ZIP Archive
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      Unzip <code style={{ color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>silent-qa-flight-recorder-v1.0.0.zip</code> to a permanent directory on your PC (e.g. <code style={{ color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Documents/silent-qa-extension</code>). Ensure <code style={{ color: '#F8FAFC' }}>manifest.json</code> is located in the extracted root.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.25)',
                      border: '1px solid rgba(220, 38, 38, 0.45)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    2
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Open Extensions Page in Chrome</span>
                      <button
                        onClick={() => handleCopy('chrome://extensions', 'url')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: copiedUrl ? '#4ADE80' : '#38BDF8',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedUrl ? <Check size={11} color="#4ADE80" /> : <Copy size={11} />}
                        <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      In Google Chrome, Brave, or Microsoft Edge, enter <code style={{ color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>chrome://extensions</code> in your address bar and press Enter.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.25)',
                      border: '1px solid rgba(220, 38, 38, 0.45)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    3
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Toggle "Developer Mode" to ON
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      In the top-right corner of the Extensions dashboard, switch the <strong style={{ color: '#F8FAFC' }}>Developer mode</strong> toggle switch on. This enables the unpacked extension loader toolbar.
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.25)',
                      border: '1px solid rgba(220, 38, 38, 0.45)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    4
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Click "Load Unpacked" &amp; Select Extracted Folder
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      Click the <strong style={{ color: '#38BDF8' }}>Load unpacked</strong> button in the top-left toolbar. In the folder picker dialog, select the extracted folder where <code style={{ color: '#F8FAFC' }}>manifest.json</code> resides.
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.25)',
                      border: '1px solid rgba(220, 38, 38, 0.45)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    5
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Pin &amp; Verify Extension Uplink
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      Click Chrome's puzzle piece icon, then click the PIN icon next to <strong style={{ color: '#F87171' }}>Silent QA Flight Recorder</strong>. Click the extension badge to verify live ring buffer status and link to your workspace (<code style={{ color: '#38BDF8' }}>http://localhost:3000/api/ingest</code>).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={13} color="#4ADE80" />
              <span>Tested on Google Chrome 114+, Microsoft Edge 114+, Brave 1.50+</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.45rem 1.15rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

