'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2rem 1.5rem',
        fontSize: '0.85rem',
        color: '#94A3B8',
        background: 'rgba(7, 8, 11, 0.85)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              boxShadow: '0 0 10px #DC2626',
            }}
          />
          <strong style={{ color: '#F8FAFC' }}>Silent QA</strong>
          <span style={{ color: '#64748B' }}>—</span>
          <span>Enterprise Automated Defect Description Enhancer &amp; Playwright Synthesizer.</span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600, fontSize: '0.8rem', color: '#CBD5E1' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
            PostgreSQL Partitioned
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F87171' }} />
            Nemotron-3 Causal AI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            Playwright Synthesizer
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C084FC' }} />
            Chrome MV3 In-Page
          </span>
        </div>
      </div>
    </footer>
  );
}

