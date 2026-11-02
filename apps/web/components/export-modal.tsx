'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';

interface ExportModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ report, isOpen, onClose }: ExportModalProps) {
  const [activeFormat, setActiveFormat] = useState<'github' | 'jira' | 'linear' | 'json'>('github');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  // Generate GitHub Markdown
  function generateGitHubMarkdown() {
    const title = report.title || 'Untitled Defect Report';
    const severity = (report.severity || 'high').toString().toUpperCase();
    const status = (report.status || 'open').toString().toUpperCase();
    const hypothesis = report.root_cause || 'Causal relationship verified from in-browser telemetry';
    const steps = Array.isArray(report.steps) ? report.steps : [];
    const evidenceIds = Array.isArray(report.evidence_ids) ? report.evidence_ids : [];

    return `### [DEFECT REPORT] ${title}

**Severity**: \`${severity}\`  
**Status**: \`${status}\`  
**AI Hypothesis**: ${hypothesis}

---

#### 🎯 Expected Behavior
${report.expected || 'None documented'}

#### 💥 Actual Behavior
${report.actual || 'None documented'}

---

#### 📋 Steps to Reproduce
${steps.length > 0 ? steps.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n') : '1. Follow session telemetry flow'}

---

#### 🎭 Automated Playwright Reproduction Test
<details>
<summary>Click to expand Playwright TypeScript script</summary>

\`\`\`typescript
${report.playwright_script || '// No script generated'}
\`\`\`
</details>

---

#### 🔬 Verified Causal Evidence IDs
${evidenceIds.length > 0 ? evidenceIds.map((id: string) => `- \`${id}\``).join('\n') : '- None'}

*Generated automatically by [Silent QA Flight Recorder](https://silentqa.dev)*`;
  }

  // Generate Jira Markup
  function generateJiraMarkup() {
    const title = report.title || 'Untitled Defect Report';
    const severity = (report.severity || 'high').toString().toUpperCase();
    const status = (report.status || 'open').toString().toUpperCase();
    const hypothesis = report.root_cause || 'Telemetry verified';
    const steps = Array.isArray(report.steps) ? report.steps : [];
    const evidenceIds = Array.isArray(report.evidence_ids) ? report.evidence_ids : [];

    return `h2. [DEFECT REPORT] ${title}

*Severity*: *${severity}*  
*Status*: *${status}*  
*AI Hypothesis*: ${hypothesis}

{panel:title=Expected Behavior|borderColor=#16A34A|bgColor=#F0FDF4}
${report.expected || 'None documented'}
{panel}

{panel:title=Actual Behavior|borderColor=#DC2626|bgColor=#FEF2F2}
${report.actual || 'None documented'}
{panel}

h3. Steps to Reproduce
# ${steps.length > 0 ? steps.join('\n# ') : 'Follow session telemetry flow'}

h3. Playwright Reproduction Script
{code:typescript}
${report.playwright_script || '// No script'}
{code}

h3. Verified Evidence IDs
${evidenceIds.length > 0 ? evidenceIds.map((id: string) => `* {{${id}}}`).join('\n') : '* None'}`;
  }

  // Generate Linear Markdown
  function generateLinearMarkdown() {
    const title = report.title || 'Untitled Defect Report';
    const severity = (report.severity || 'high').toString().toUpperCase();
    const status = (report.status || 'open').toString().toUpperCase();
    const summary = report.root_cause || report.actual || 'Anomaly detected during testing session';
    const steps = Array.isArray(report.steps) ? report.steps : [];
    const evidenceIds = Array.isArray(report.evidence_ids) ? report.evidence_ids : [];

    return `## ${title}

> **Severity**: ${severity}  
> **Status**: ${status}  

### 🔍 Summary & Root Cause
${summary}

### 🎯 Expected
${report.expected || 'None documented'}

### 💥 Actual
${report.actual || 'None documented'}

### 🪜 Steps to Reproduce
${steps.length > 0 ? steps.map((s: string) => `- [ ] ${s}`).join('\n') : '- [ ] Follow session telemetry flow'}

### 🎭 Playwright Reproduction
\`\`\`typescript
${report.playwright_script || '// No script'}
\`\`\`

---
*Telemetry Evidence IDs*: ${evidenceIds.join(', ') || 'None'}`;
  }

  // Format resolver
  let exportContent = '';
  if (activeFormat === 'github') exportContent = generateGitHubMarkdown();
  else if (activeFormat === 'jira') exportContent = generateJiraMarkup();
  else if (activeFormat === 'linear') exportContent = generateLinearMarkdown();
  else if (activeFormat === 'json') exportContent = JSON.stringify(report, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = activeFormat === 'json' ? 'json' : 'md';
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeId = (report.id || 'report').toString().slice(0, 8);
    link.href = url;
    link.download = `defect-report-${safeId}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
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
          maxWidth: '780px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(13, 16, 25, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
              Export Defect Report
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Format and transfer verified bug telemetry directly into your team&apos;s issue tracker.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.75rem 0.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
          {(['github', 'jira', 'linear', 'json'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setActiveFormat(fmt)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: activeFormat === fmt ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeFormat === fmt ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: activeFormat === fmt ? '#F87171' : '#94A3B8',
                cursor: 'pointer',
              }}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Content Preview */}
        <div style={{ flex: 1, padding: '1rem 1.75rem', overflowY: 'auto' }}>
          <pre
            style={{
              background: '#07080A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              padding: '1.25rem',
              borderRadius: '10px',
              fontSize: '0.825rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <code>{exportContent}</code>
          </pre>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Close
          </button>

          <button
            onClick={handleDownload}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} /> Download File
          </button>

          <button
            onClick={handleCopy}
            className="btn-primary"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
