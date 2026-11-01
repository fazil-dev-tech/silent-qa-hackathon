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
    return `### [DEFECT REPORT] ${report.title}

**Severity**: \`${report.severity.toUpperCase()}\`  
**Status**: \`${report.status.toUpperCase()}\`  
**AI Hypothesis**: ${report.root_cause || 'Causal relationship verified from in-browser telemetry'}

---

#### 🎯 Expected Behavior
${report.expected}

#### 💥 Actual Behavior
${report.actual}

---

#### 📋 Steps to Reproduce
${report.steps?.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n')}

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
${report.evidence_ids?.map((id: string) => `- \`${id}\``).join('\n') || '- None'}

*Generated automatically by [Silent QA Flight Recorder](https://silentqa.dev)*`;
  }

  // Generate Jira Markup
  function generateJiraMarkup() {
    return `h2. [DEFECT REPORT] ${report.title}

*Severity*: *${report.severity.toUpperCase()}*  
*Status*: *${report.status.toUpperCase()}*  
*AI Hypothesis*: ${report.root_cause || 'Telemetry verified'}

{panel:title=Expected Behavior|borderColor=#16A34A|bgColor=#F0FDF4}
${report.expected}
{panel}

{panel:title=Actual Behavior|borderColor=#DC2626|bgColor=#FEF2F2}
${report.actual}
{panel}

h3. Steps to Reproduce
# ${report.steps?.join('\n# ')}

h3. Playwright Reproduction Script
{code:typescript}
${report.playwright_script || '// No script'}
{code}

h3. Verified Evidence IDs
${report.evidence_ids?.map((id: string) => `* {{${id}}}`).join('\n')}`;
  }

  // Generate Linear Markdown
  function generateLinearMarkdown() {
    return `## ${report.title}

> **Severity**: ${report.severity.toUpperCase()}  
> **Status**: ${report.status.toUpperCase()}  

### 🔍 Summary & Root Cause
${report.root_cause || report.actual}

### 🎯 Expected
${report.expected}

### 💥 Actual
${report.actual}

### 🪜 Steps to Reproduce
${report.steps?.map((s: string, idx: number) => `- [ ] ${s}`).join('\n')}

### 🎭 Playwright Reproduction
\`\`\`typescript
${report.playwright_script || '// No script'}
\`\`\`

---
*Telemetry Evidence IDs*: ${report.evidence_ids?.join(', ')}`;
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
    link.href = url;
    link.download = `defect-report-${report.id.slice(0, 8)}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(17, 24, 39, 0.65)',
        backdropFilter: 'blur(8px)',
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
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-primary)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
              Export Defect Report
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Format and transfer verified bug telemetry directly into your team&apos;s issue tracker.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.75rem 0.5rem', background: '#FAFAFA' }}>
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
                border: activeFormat === fmt ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.1)',
                background: activeFormat === fmt ? '#ffffff' : 'transparent',
                color: activeFormat === fmt ? '#DC2626' : '#6B7280',
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
              background: '#0F172A',
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
            borderTop: '1px solid rgba(17, 24, 39, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'var(--bg-primary)',
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

