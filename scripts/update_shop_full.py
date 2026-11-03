#!/usr/bin/env python3
"""
Update Lumina Gear E-Commerce Storefront to an Ultra-Professional Luxury Standard
Organized into clean, separate, production-ready files:
- demo-shop/index.html (Semantic HTML5 layout)
- demo-shop/styles.css (Modular luxury dark-mode design system)
- demo-shop/app.js (Reactive catalog, cart store, checkout flow & 10 bug scenarios)
"""

import os
import shutil

STYLES_CSS = """/* ========================================================================= */
/* LUMINA GEAR • LUXURY AUDIO & TECH STORE DESIGN SYSTEM                     */
/* Professional Modern Dark-Mode E-Commerce Theme                            */
/* ========================================================================= */

:root {
  --bg-main: #07080b;
  --bg-card: rgba(15, 18, 28, 0.75);
  --bg-surface: #0e111a;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --accent-cyan: #00f0ff;
  --accent-red: #ef4444;
  --accent-amber: #f59e0b;
  --accent-purple: #a855f7;
  --accent-green: #10b981;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --border-glass: rgba(255, 255, 255, 0.1);
  --border-focus: rgba(79, 70, 229, 0.5);
  --shadow-card: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --shadow-glow: 0 0 25px rgba(79, 70, 229, 0.35);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

body {
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 85% 30%, rgba(0, 240, 255, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 15% 70%, rgba(239, 68, 68, 0.08) 0%, transparent 40%);
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow-x: hidden;
}

.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

/* ========================================================================= */
/* 1. TOP ANNOUNCEMENT TICKER & HEADER                                       */
/* ========================================================================= */
.announcement-bar {
  background: rgba(14, 17, 26, 0.95);
  border-bottom: 1px solid var(--border-glass);
  padding: 0.5rem 0;
  font-size: 0.78rem;
}

.announcement-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.announcement-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
}

.pulse-sparkle {
  color: var(--accent-cyan);
  animation: pulse-red 2s infinite;
}

.announcement-bar code {
  background: rgba(79, 70, 229, 0.2);
  color: #a5b4fc;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-weight: 700;
}

.announcement-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.announcement-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #a5b4fc;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.15s;
}

.announcement-link:hover {
  color: #fff;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: var(--accent-green);
  font-weight: 700;
  background: rgba(16, 185, 129, 0.12);
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.live-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(7, 8, 11, 0.88);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border-bottom: 1px solid var(--border-glass);
  padding: 0.85rem 0;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-mark {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 12px var(--primary);
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
}

.logo-text span {
  color: var(--accent-cyan);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: color 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-link:hover, .nav-link.active {
  color: #fff;
}

.hot-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-full);
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--text-dim);
  pointer-events: none;
}

.search-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-full);
  padding: 0.45rem 0.85rem 0.45rem 2.2rem;
  color: #fff;
  font-size: 0.8rem;
  width: 220px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: rgba(255, 255, 255, 0.08);
  width: 260px;
}

.currency-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.45rem 0.65rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  outline: none;
}

.currency-select option {
  background: #0f121c;
  color: #fff;
}

.nav-icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.nav-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.badge-mini {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--accent-cyan);
  color: #07080b;
  font-size: 0.6rem;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cart-trigger {
  background: var(--primary);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.45rem 0.95rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  transition: all 0.2s ease;
  box-shadow: 0 0 14px rgba(79, 70, 229, 0.35);
}

.btn-cart-trigger:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.cart-badge {
  background: #fff;
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-full);
}

/* ========================================================================= */
/* 2. HERO SHOWCASE SECTION                                                  */
/* ========================================================================= */
.hero-section {
  padding: 5rem 0 4rem;
  position: relative;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3.5rem;
  align-items: center;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(79, 70, 229, 0.15);
  border: 1px solid rgba(79, 70, 229, 0.35);
  color: #c7d2fe;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  margin-bottom: 1.25rem;
}

.hero-tag-glow {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  margin-bottom: 1.25rem;
  color: #fff;
}

.gradient-text {
  background: linear-gradient(135deg, #fff 30%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 540px;
  margin-bottom: 1.75rem;
}

.hero-specs-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.spec-pill {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.5rem;
  text-align: center;
}

.spec-pill strong {
  display: block;
  font-size: 0.85rem;
  color: #fff;
  font-family: var(--font-mono);
}

.spec-pill span {
  display: block;
  font-size: 0.65rem;
  color: var(--text-dim);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.hero-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.hero-current-price {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}

.hero-original-price {
  font-size: 1.1rem;
  color: var(--text-dim);
  text-decoration: line-through;
}

.hero-save-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
}

.hero-btns-wrap {
  display: flex;
  gap: 0.85rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  font-size: 0.88rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 18px rgba(79, 70, 229, 0.4);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 70, 229, 0.55);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* Hero Visual Card */
.hero-visual {
  position: relative;
}

.hero-card-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
}

.hero-image-wrap {
  position: relative;
  z-index: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.hero-img {
  width: 100%;
  height: 440px;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-image-wrap:hover .hero-img {
  transform: scale(1.04);
}

.floating-badge {
  position: absolute;
  background: rgba(14, 17, 26, 0.85);
  backdrop-filter: blur(14px);
  border: 1px solid var(--border-glass);
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.badge-top-right {
  top: 1.25rem;
  right: 1.25rem;
}

.badge-bottom-left {
  bottom: 1.25rem;
  left: 1.25rem;
}

.pulse-dot-cyan {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
  animation: pulse-red 1.8s infinite;
}

/* ========================================================================= */
/* 3. VALUE PROPOSITIONS / TRUST PILLARS BAR                                 */
/* ========================================================================= */
.trust-bar {
  padding: 2.5rem 0;
  border-top: 1px solid var(--border-glass);
  border-bottom: 1px solid var(--border-glass);
  background: rgba(14, 17, 26, 0.4);
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.trust-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.trust-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.trust-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: rgba(79, 70, 229, 0.15);
  border: 1px solid rgba(79, 70, 229, 0.3);
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trust-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.trust-text strong {
  font-size: 0.88rem;
  color: #fff;
  font-weight: 700;
}

.trust-text span {
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* ========================================================================= */
/* 4. PRODUCT CATALOG GRID & FILTERS                                         */
/* ========================================================================= */
.catalog-section {
  padding: 5rem 0;
}

.section-header {
  margin-bottom: 2.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.section-header.text-center {
  text-align: center;
  flex-direction: column;
  align-items: center;
}

.sub-heading {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--accent-cyan);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
  display: block;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  max-width: 520px;
}

.catalog-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-pill {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.filter-pill.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  box-shadow: 0 0 14px rgba(79, 70, 229, 0.4);
}

.sort-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.sort-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.sort-select option {
  background: #0d0f17;
  color: #fff;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.75rem;
}

.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-card);
  position: relative;
}

.product-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.85);
}

.card-img-wrap {
  position: relative;
  height: 230px;
  overflow: hidden;
  background: #090b12;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .card-img {
  transform: scale(1.08);
}

.card-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
}

.card-badge.sale {
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
}

.card-badge.new {
  background: rgba(0, 240, 255, 0.9);
  color: #07080b;
}

.card-badge.hot {
  background: rgba(168, 85, 247, 0.9);
  color: #fff;
}

.card-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-category {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}

.product-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.35rem;
  line-height: 1.35;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--accent-amber);
  margin-bottom: 0.85rem;
}

.product-rating span {
  color: var(--text-dim);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 1.15rem;
}

.current-price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
}

.original-price {
  font-size: 0.85rem;
  color: var(--text-dim);
  text-decoration: line-through;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-add-cart {
  background: rgba(79, 70, 229, 0.2);
  border: 1px solid rgba(79, 70, 229, 0.45);
  color: #c7d2fe;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart:hover {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 0 14px rgba(79, 70, 229, 0.4);
}

.btn-quick-view {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-quick-view:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ========================================================================= */
/* 5. FEATURED ACOUSTIC STORY & TESTIMONIALS                                 */
/* ========================================================================= */
.story-section {
  padding: 5rem 0;
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--border-glass);
  border-bottom: 1px solid var(--border-glass);
}

.story-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3.5rem;
  align-items: center;
}

.story-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 800;
  color: var(--accent-cyan);
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.25);
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  margin-bottom: 1rem;
}

.story-title {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  color: #fff;
}

.story-text {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 2rem;
}

.story-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.story-stat-card {
  padding: 1.15rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  font-family: var(--font-mono);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-dim);
  line-height: 1.3;
  display: block;
}

.story-img {
  width: 100%;
  height: 380px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-card);
}

/* Testimonials */
.testimonials-section {
  padding: 5rem 0;
  background: rgba(14, 17, 26, 0.5);
  border-bottom: 1px solid var(--border-glass);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
  margin-top: 2.5rem;
}

.testimonial-card {
  background: rgba(15, 18, 28, 0.75);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  transition: all 0.2s ease;
}

.testimonial-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-card);
}

.review-stars {
  color: var(--accent-amber);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
}

.review-quote {
  font-size: 0.9rem;
  color: var(--text-main);
  line-height: 1.6;
  font-style: italic;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.author-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.author-info strong {
  display: block;
  font-size: 0.85rem;
  color: #fff;
}

.author-info span {
  display: block;
  font-size: 0.72rem;
  color: var(--text-dim);
}

/* Newsletter */
.newsletter-section {
  padding: 4.5rem 0;
}

.newsletter-box {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(15, 18, 28, 0.85));
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: var(--radius-lg);
  padding: 2.75rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  box-shadow: var(--shadow-glow);
}

.newsletter-content h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.4rem;
}

.newsletter-content p {
  font-size: 0.88rem;
  color: var(--text-muted);
  max-width: 500px;
}

.newsletter-form {
  display: flex;
  gap: 0.65rem;
  flex-grow: 1;
  max-width: 440px;
}

.newsletter-form input {
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.85rem;
}

/* Footer */
.site-footer {
  background: #050608;
  border-top: 1px solid var(--border-glass);
  padding: 4.5rem 0 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 2.5rem;
  margin-bottom: 3.5rem;
}

.brand-col .footer-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 1rem 0 1.25rem;
  max-width: 320px;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.74rem;
  color: var(--accent-green);
  font-family: var(--font-mono);
}

.footer-status .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.footer-col h4 {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.15rem;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.82rem;
  transition: color 0.15s;
}

.footer-links a:hover {
  color: var(--accent-cyan);
}

.footer-small {
  font-size: 0.78rem;
  color: var(--text-dim);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.payment-badges-row {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.pay-chip {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 800;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: var(--text-muted);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.76rem;
  color: var(--text-dim);
}

.footer-bottom-links {
  display: flex;
  gap: 1.25rem;
}

.footer-bottom-links a {
  color: var(--text-muted);
  text-decoration: none;
}

.footer-bottom-links a:hover {
  color: #fff;
}

/* ========================================================================= */
/* 6. CART DRAWER & FREE SHIPPING PROGRESS METER                             */
/* ========================================================================= */
.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.cart-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 440px;
  background: #0d0f17;
  border-left: 1px solid var(--border-glass);
  z-index: 250;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -15px 0 50px rgba(0, 0, 0, 0.85);
}

.cart-drawer.open {
  transform: translateX(0);
}

.cart-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-header-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.cart-header-title h3 {
  font-size: 1.1rem;
  font-weight: 700;
}

.cart-total-badge {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  color: var(--text-muted);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #fff;
}

.shipping-progress-box {
  padding: 0.75rem 1.5rem;
  background: rgba(79, 70, 229, 0.08);
  border-bottom: 1px solid var(--border-glass);
}

.progress-label {
  font-size: 0.75rem;
  color: var(--text-main);
  margin-bottom: 0.4rem;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--primary));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.cart-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-cart-msg {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.cart-item-row {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
}

.cart-item-thumb {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.cart-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cart-item-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
}

.cart-item-price {
  font-size: 0.8rem;
  color: var(--accent-cyan);
  font-weight: 600;
}

.cart-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.45rem;
}

.qty-control {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.qty-btn {
  background: transparent;
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.qty-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.qty-number {
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.btn-remove-item {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 0.75rem;
  transition: color 0.15s;
}

.btn-remove-item:hover {
  color: var(--accent-red);
}

.cart-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-glass);
  background: #090b12;
}

.coupon-box-wrapper {
  position: relative;
  margin-bottom: 1.15rem;
}

.coupon-input-group {
  display: flex;
  gap: 0.5rem;
}

.coupon-input-group input {
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.85rem;
  color: #fff;
  font-size: 0.8rem;
}

.btn-coupon-apply {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-glass);
  color: #fff;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  z-index: 2;
}

.coupon-overlay-shield {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 10;
  pointer-events: auto;
}

.cart-summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.85rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.grand-total-line {
  font-size: 1.05rem;
  color: #fff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.65rem;
  margin-top: 0.25rem;
}

.text-green { color: var(--accent-green); }
.text-cyan { color: var(--accent-cyan); }

.btn-checkout-proceed {
  width: 100%;
}

/* ========================================================================= */
/* 7. CHECKOUT MODAL & MODAL BACKDROPS                                       */
/* ========================================================================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 500;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  transition: opacity 0.25s ease;
}

.modal-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

.modal-card {
  background: #0d0f17;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.checkout-modal {
  max-width: 820px;
  padding: 2rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.checkout-brand-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.checkout-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass);
}

.step-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.step-node.active {
  opacity: 1;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
}

.step-node.active .step-num {
  background: var(--primary);
  color: #fff;
}

.step-divider {
  flex-grow: 1;
  height: 1px;
  background: var(--border-glass);
  margin: 0 1rem;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 2rem;
}

.checkout-form-pane h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.85rem;
  color: #fff;
  font-size: 0.85rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-row.three-col {
  grid-template-columns: 1.5fr 1fr 1fr;
}

.req { color: var(--accent-red); }

.form-error-msg {
  display: none;
  color: var(--accent-red);
  font-size: 0.72rem;
  margin-top: 0.35rem;
}

.shipping-method-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.shipping-option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.shipping-option-card.selected {
  border-color: var(--primary);
  background: rgba(79, 70, 229, 0.08);
}

.step-nav-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.test-cards-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.15rem;
}

.test-card-label {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.btn-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  cursor: pointer;
}

.chip-amber {
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.btn-full-width {
  width: 100%;
}

.checkout-summary-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.checkout-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.checkout-item-mini {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.security-guarantee {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.7rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-glass);
}

/* Success Modal */
.success-modal {
  max-width: 460px;
  text-align: center;
  padding: 2.5rem 1.75rem;
}

.success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.15);
  border: 2px solid var(--accent-green);
  color: var(--accent-green);
  font-size: 2rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
}

.order-id-label {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--accent-cyan);
  margin: 0.5rem 0 1rem;
}

.success-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.75rem;
}

/* Quick View Modal */
.quick-view-modal {
  max-width: 760px;
  padding: 2rem;
}

.quick-view-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.quick-view-img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-glass);
}

/* Toast Container */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  background: #111422;
  border: 1px solid var(--border-glass);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  padding: 0.65rem 1rem;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  animation: slide-up 0.25s ease;
  pointer-events: auto;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========================================================================= */
/* 8. FLOATING QA BENCHMARK DOCK & SLIDE-OUT DRAWER                          */
/* ========================================================================= */
.qa-hud-floating-pill {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9998;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.92), rgba(185, 28, 28, 0.95));
  color: #fff;
  border: 1px solid rgba(254, 202, 202, 0.4);
  box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4), 0 0 15px rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-full);
  padding: 0.65rem 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.qa-hud-floating-pill:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 14px 36px rgba(220, 38, 38, 0.55), 0 0 20px rgba(239, 68, 68, 0.45);
}

.qa-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 0 8px #fff;
  animation: pulse-red 1.6s infinite;
}

.qa-badge {
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
}

.qa-hud-drawer {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  width: calc(100vw - 3rem);
  max-width: 460px;
  background: rgba(10, 12, 20, 0.96);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(220, 38, 38, 0.25);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.qa-hud-drawer.collapsed {
  transform: translateX(115%);
  opacity: 0;
  pointer-events: none;
}

.qa-hud-header {
  padding: 0.85rem 1rem;
  background: rgba(220, 38, 38, 0.15);
  border-bottom: 1px solid rgba(220, 38, 38, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.qa-hud-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.qa-toggle-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.qa-hud-content {
  padding: 0.85rem 1rem;
  max-height: 420px;
  overflow-y: auto;
}

.qa-pdf-btn-wrap {
  margin-bottom: 0.75rem;
}

.btn-pdf-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  text-decoration: none;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #818cf8;
}

.qa-hud-desc {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.qa-bug-grid {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.qa-bug-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qa-bug-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.qa-bug-tag {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.qa-bug-tag.red { color: #f87171; }
.qa-bug-tag.amber { color: #fbbf24; }
.qa-bug-tag.purple { color: #c084fc; }

.qa-bug-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.15rem;
}

.qa-bug-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.35;
}

/* Target Bug Highlight Animation */
.bug-highlighted {
  outline: 3px solid #ef4444 !important;
  box-shadow: 0 0 25px rgba(239, 68, 68, 0.8) !important;
  animation: bug-pulse 1s 3;
}

@keyframes bug-pulse {
  0%, 100% { outline-color: #ef4444; }
  50% { outline-color: #fbbf24; }
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* ========================================================================= */
/* 9. RESPONSIVE MEDIA QUERIES                                               */
/* ========================================================================= */
@media (max-width: 1100px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .trust-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
  .hero-img {
    height: 320px;
  }
  .story-grid {
    grid-template-columns: 1fr;
  }
  .checkout-layout {
    grid-template-columns: 1fr;
  }
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .nav-menu, .search-box {
    display: none;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .trust-grid {
    grid-template-columns: 1fr;
  }
  .hero-specs-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-row, .form-row.three-col {
    grid-template-columns: 1fr;
  }
  .quick-view-grid {
    grid-template-columns: 1fr;
  }
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
"""

APP_JS = """/**
 * LUMINA GEAR • E-COMMERCE CORE APPLICATION & QA BENCHMARK ENGINE
 * Clean, Modular, Real E-Commerce State Machine with 10 Telemetry Test Defects
 */

// ============================================================================
// 1. PRODUCT CATALOG DATA (8 LUXURY TECH SKUS)
// ============================================================================
const PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Aura Pro Wireless ANC Headphones',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 349.00,
    originalPrice: 399.00,
    rating: 4.9,
    reviews: 128,
    badge: 'sale',
    badgeText: 'SAVE $50',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85',
    desc: 'Beryllium 40mm acoustic drivers with active hybrid noise cancellation (-42dB) and spatial audio head tracking.',
    isBug001Target: true, // BUG-001 Target (Double-add cart race condition)
  },
  {
    id: 'prod-002',
    name: 'Chronos Ultra Smart Titanium Watch',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 499.00,
    originalPrice: null,
    rating: 4.8,
    reviews: 94,
    badge: 'new',
    badgeText: 'NEW',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85',
    desc: 'Grade 5 titanium chassis, sapphire crystal display, continuous ECG and biometric telemetry monitoring.',
    isBug001Target: false,
  },
  {
    id: 'prod-003',
    name: 'Apex Pro Magnetic Switch Keyboard',
    category: 'peripherals',
    categoryName: 'Peripherals',
    price: 219.00,
    originalPrice: 249.00,
    rating: 4.7,
    reviews: 210,
    badge: 'hot',
    badgeText: 'POPULAR',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=85',
    desc: 'Hall effect analog magnetic switches with 0.1mm actuation rapid-trigger mechanics.',
    isBug006Target: true, // BUG-006 Target (Quick View blank modal crash)
  },
  {
    id: 'prod-004',
    name: 'Pulse X Spatial Desktop Studio Monitors',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 599.00,
    originalPrice: 650.00,
    rating: 5.0,
    reviews: 62,
    badge: null,
    badgeText: null,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&q=85',
    desc: 'Bi-amplified reference studio monitors with DSP room calibration and optical inputs.',
    isBug001Target: false,
  },
  {
    id: 'prod-005',
    name: 'Vortex Precision Wireless Ergonomic Mouse',
    category: 'peripherals',
    categoryName: 'Peripherals',
    price: 129.00,
    originalPrice: 149.00,
    rating: 4.6,
    reviews: 340,
    badge: 'sale',
    badgeText: 'SALE',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=85',
    desc: '4K polling wireless sensor with thumb scroll wheel and infinite kinetic scrolling.',
    isBug001Target: false,
  },
  {
    id: 'prod-006',
    name: 'Nova Ring Smart Biometric Health Tracker',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 299.00,
    originalPrice: null,
    rating: 4.9,
    reviews: 78,
    badge: 'new',
    badgeText: 'NEW',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&q=85',
    desc: 'Ultra-lightweight aerospace titanium smart ring with sleep, HRV, and body temp sensors.',
    isBug001Target: false,
  },
  {
    id: 'prod-007',
    name: 'Horizon Soundbar Pro Dolby Atmos',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 449.00,
    originalPrice: 499.00,
    rating: 4.8,
    reviews: 115,
    badge: 'sale',
    badgeText: 'SAVE $50',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&q=85',
    desc: '3.1.2 channel Dolby Atmos spatial soundbar with wireless subwoofer and eARC HDMI.',
    isBug001Target: false,
  },
  {
    id: 'prod-008',
    name: 'CyberHub 10-in-1 Thunderbolt 4 Dock',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 189.00,
    originalPrice: null,
    rating: 4.7,
    reviews: 88,
    badge: null,
    badgeText: null,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&q=85',
    desc: 'Dual 4K@120Hz display outputs with 96W Power Delivery charging and Gigabit Ethernet.',
    isBug001Target: false,
  }
];

// ============================================================================
// 2. STATE MANAGEMENT
// ============================================================================
let cart = [];
let activeCategory = 'all';
let currentSort = 'featured';
let currentCurrency = 'USD';
let discountAmount = 0;
let appliedCouponCode = '';
let currentShippingMethod = 'free';
let currentCheckoutStep = 1;

const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 }
};

// ============================================================================
// 3. INITIALIZATION & EVENT LISTENERS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupEventListeners();
  updateCartBadge();
  updateShippingProgressBar(0);
});

function setupEventListeners() {
  // Category Filter Pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderProducts();
    });
  });

  // Open Cart Trigger
  document.getElementById('openCartBtn')?.addEventListener('click', openCartDrawer);

  // BUG-002: Dead click listener on "Special Deals" navbar link
  const dealsLink = document.getElementById('navDealsLink');
  if (dealsLink) {
    dealsLink.addEventListener('click', (e) => {
      e.preventDefault();
      // BUG-002: Does nothing! Zero DOM mutation, zero network call, zero toast.
      console.warn('[BUG-002 Triggered] Special Deals clicked: e.preventDefault() called without navigation.');
      return false;
    });
  }

  // BUG-007: Unthrottled Search Input flooding console
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      // BUG-007: Unthrottled API call simulating 500 server error
      simulateSearchApiCall(query);

      // Client filter
      const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.desc.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query)
      );
      renderProductList(filtered);
    });
  }

  // BUG-008: Currency switcher updating card symbols but keeping cart total in USD
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      // BUG-008: Re-renders catalog prices with new currency symbol...
      renderProducts();
      // ...BUT intentionally omits updating recalculateCartTotals() and renderCartDrawer()!
      console.warn('[BUG-008 Triggered] Currency updated to', currentCurrency, 'on catalog cards, but cart subtotal remains locked in USD.');
      showToast(`Currency changed to ${currentCurrency}`);
    });
  }
}

// ============================================================================
// 4. CATALOG RENDERING & FILTERING
// ============================================================================
function renderProducts() {
  let list = [...PRODUCTS];

  // Category Filter
  if (activeCategory === 'audio') list = list.filter(p => p.category === 'audio');
  else if (activeCategory === 'wearables') list = list.filter(p => p.category === 'wearables');
  else if (activeCategory === 'peripherals') list = list.filter(p => p.category === 'peripherals');
  else if (activeCategory === 'sale') list = list.filter(p => p.badge === 'sale');

  // Sorting
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (currentSort === 'rating') list.sort((a, b) => b.rating - a.rating);

  renderProductList(list);
}

function renderProductList(items) {
  const container = document.getElementById('productCatalog');
  if (!container) return;

  const curr = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p>No products match your selected filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(product => {
    const convertedPrice = (product.price * curr.rate).toFixed(2);
    const convertedOriginal = product.originalPrice ? (product.originalPrice * curr.rate).toFixed(2) : null;
    const badgeHtml = product.badge ? `<span class="card-badge ${product.badge}">${product.badgeText}</span>` : '';

    return `
      <div class="product-card" id="card-${product.id}">
        <div class="card-img-wrap">
          <img src="${product.image}" alt="${product.name}" class="card-img" loading="lazy" />
          ${badgeHtml}
        </div>
        <div class="card-info">
          <span class="product-category">${product.categoryName}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <span>★★★★★</span>
            <strong>${product.rating}</strong>
            <span>(${product.reviews})</span>
          </div>
          <div class="price-row">
            <span class="current-price">${curr.symbol}${convertedPrice}</span>
            ${convertedOriginal ? `<span class="original-price">${curr.symbol}${convertedOriginal}</span>` : ''}
          </div>
          <div class="card-actions">
            <!-- BUG-001: Aura Pro triggers double-add race condition -->
            <button class="btn-add-cart" id="btn-add-${product.id}" onclick="handleAddToCart('${product.id}')">
              Add to Bag
            </button>
            <!-- BUG-006: Apex Pro Keyboard triggers missing DOM crash -->
            <button class="btn-quick-view" onclick="openQuickView('${product.id}')">
              Quick View
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleSortChange(sortVal) {
  currentSort = sortVal;
  renderProducts();
}

function filterByCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-pill').forEach(b => {
    if (b.getAttribute('data-category') === cat) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderProducts();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// 5. CART STORE & DEFECT IMPLEMENTATIONS
// ============================================================================

// BUG-001: Double-Add Cart Race Condition
function handleAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (productId === 'prod-001') {
    // Defect: Missing debounce lock! Simulates twin concurrent POST /api/cart dispatches
    console.warn('[BUG-001 Triggered] Aura Pro double-add race condition! Firing 2 concurrent updates.');
    simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 85);
    addItemToCart(product, 1);

    setTimeout(() => {
      simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 82);
      addItemToCart(product, 1);
      showToast('⚠️ Race Condition: Aura Pro added twice (Qty: 2)!', 'warning');
    }, 40);
  } else {
    simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 75);
    addItemToCart(product, 1);
    showToast(`Added ${product.name} to shopping bag.`);
  }

  openCartDrawer();
}

function addItemToCart(product, quantity) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  recalculateCartTotals();
  renderCartDrawer();
  updateCartBadge();
}

// BUG-005: Negative Cart Quantity Decrement
function decrementCartItem(productId) {
  const item = cart.find(p => p.id === productId);
  if (item) {
    // BUG-005: Missing boundary check `if (item.quantity <= 1) remove()`!
    // Decrements into negative integers: 0, -1, -2...
    item.quantity = item.quantity - 1;
    console.warn('[BUG-005 Triggered] Decremented item below 1. Current quantity:', item.quantity);
    
    if (item.quantity < 1) {
      showToast(`⚠️ Anomaly: Quantity for ${item.name} is ${item.quantity}!`, 'warning');
    }
    
    recalculateCartTotals();
    renderCartDrawer();
    updateCartBadge();
  }
}

function incrementCartItem(productId) {
  const item = cart.find(p => p.id === productId);
  if (item) {
    item.quantity += 1;
    recalculateCartTotals();
    renderCartDrawer();
    updateCartBadge();
  }
}

function removeCartItem(productId) {
  cart = cart.filter(p => p.id !== productId);
  recalculateCartTotals();
  renderCartDrawer();
  updateCartBadge();
}

function recalculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = currentShippingMethod === 'overnight' ? 14.99 : 0.00;
  const grandTotal = Math.max(0, subtotal - discountAmount + tax + shipping);

  // Update Free Shipping Progress Bar ($150 target)
  updateShippingProgressBar(subtotal);

  // Note: BUG-008 means this keeps displaying '$' USD symbol even if currency switched to EUR!
  const subtotalEl = document.getElementById('cartSubtotal');
  const discountEl = document.getElementById('cartDiscount');
  const taxEl = document.getElementById('cartTax');
  const totalEl = document.getElementById('cartGrandTotal');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;

  if (discountEl && discountAmount > 0) {
    document.getElementById('discountRow').style.display = 'flex';
    discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
  }

  // Also update checkout totals
  const coSub = document.getElementById('checkoutSubtotal');
  const coTax = document.getElementById('checkoutTax');
  const coTotal = document.getElementById('checkoutGrandTotal');
  if (coSub) coSub.textContent = `$${subtotal.toFixed(2)}`;
  if (coTax) coTax.textContent = `$${tax.toFixed(2)}`;
  if (coTotal) coTotal.textContent = `$${grandTotal.toFixed(2)}`;
}

function updateShippingProgressBar(subtotal) {
  const threshold = 150.00;
  const fill = document.getElementById('shippingProgressBar');
  const label = document.getElementById('shippingProgressLabel');
  if (!fill || !label) return;

  const pct = Math.min(100, (subtotal / threshold) * 100);
  fill.style.width = `${pct}%`;

  if (subtotal >= threshold) {
    label.innerHTML = `<span>🎉 <strong>Congratulations!</strong> You have unlocked <strong>Free Express Shipping!</strong></span>`;
  } else {
    const needed = (threshold - subtotal).toFixed(2);
    label.innerHTML = `<span>Add <strong>$${needed}</strong> more to unlock <strong>Free Express Shipping!</strong></span>`;
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const countBadge = document.getElementById('cartItemCountBadge');
  if (!container) return;

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  if (countBadge) countBadge.textContent = `${totalItems} Items`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.75rem; opacity: 0.4;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <p>Your shopping bag is empty.</p>
        <button class="btn btn-secondary" onclick="closeCartDrawer()" style="margin-top: 1rem;">Explore Hardware</button>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item-row" id="cart-row-${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />
      <div class="cart-item-details">
        <strong class="cart-item-name">${item.name}</strong>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control">
          <!-- BUG-005 Minus decrement button -->
          <button class="qty-btn qty-minus-btn" onclick="decrementCartItem('${item.id}')" aria-label="Decrease quantity">−</button>
          <span class="qty-number">${item.quantity}</span>
          <button class="qty-btn qty-plus-btn" onclick="incrementCartItem('${item.id}')" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn-remove-item" onclick="removeCartItem('${item.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;
}

function openCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}

// BUG-004: Obscured Coupon Apply Button
function handleApplyCoupon() {
  // BUG-004: If clicked normally, the transparent shield intercepts clicks.
  const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
  if (code === 'LUMINA20') {
    discountAmount = 30.00;
    appliedCouponCode = code;
    recalculateCartTotals();
    showToast('Promo code LUMINA20 applied! Saved $30.00.');
  } else {
    showToast('Invalid promo code. Use LUMINA20 for 20% off.', 'warning');
  }
}

// ============================================================================
// 6. CHECKOUT FLOW & PAYMENT DEFECTS
// ============================================================================
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Add a product first.', 'warning');
    return;
  }
  closeCartDrawer();
  currentCheckoutStep = 1;
  goToStep(1);
  renderCheckoutMiniItems();
  document.getElementById('checkoutBackdrop')?.classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkoutBackdrop')?.classList.remove('open');
}

function goToStep(step) {
  currentCheckoutStep = step;
  document.querySelectorAll('.checkout-step-content').forEach(el => el.style.display = 'none');
  document.getElementById(`step${step}Content`).style.display = 'block';

  document.querySelectorAll('.step-node').forEach((node, idx) => {
    if (idx + 1 <= step) node.classList.add('active');
    else node.classList.remove('active');
  });
}

// BUG-010: Silent Form Discard on Missing Email
function handleStep1Submit() {
  const emailInput = document.getElementById('shipEmail');
  const email = emailInput?.value.trim();

  if (!email) {
    // BUG-010: Silent discard! Returns without advancing AND without displaying error message!
    console.warn('[BUG-010 Triggered] Missing shipping email. Step advancement halted with zero UI error displayed.');
    // Missing: document.getElementById('shipEmailError').style.display = 'block';
    return false;
  }

  goToStep(2);
}

function updateShippingMethod(method) {
  currentShippingMethod = method;
  document.querySelectorAll('.shipping-option-card').forEach(c => c.classList.remove('selected'));
  const radio = document.querySelector(`input[name="shippingMethod"][value="${method}"]`);
  if (radio) {
    radio.checked = true;
    radio.closest('.shipping-option-card')?.classList.add('selected');
  }
  recalculateCartTotals();
}

function fillTestCard(type) {
  const cardInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('cardExpiry');
  const cvcInput = document.getElementById('cardCvc');

  if (type === 'visa') {
    if (cardInput) cardInput.value = '4532 8920 1829 4812';
    if (expiryInput) expiryInput.value = '10/29';
    if (cvcInput) cvcInput.value = '742';
    showToast('Loaded valid Visa test card.');
  } else if (type === 'amex') {
    // BUG-009 Target
    if (cardInput) cardInput.value = '3782 8224 6310 005';
    if (expiryInput) expiryInput.value = '08/28';
    if (cvcInput) cvcInput.value = '2004';
    showToast('Loaded American Express test card (Will trigger 502 Gateway).', 'warning');
  }
}

// BUG-003 & BUG-009: Place Order Submit Handler
function handlePlaceOrder() {
  const btn = document.getElementById('placeOrderBtn');
  const cardNum = document.getElementById('cardNumber')?.value.replace(/\\s/g, '') || '';

  // Set loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Processing Authorization...`;
  }

  // BUG-009: Amex card triggers simulated HTTP 502 Bad Gateway
  if (cardNum.startsWith('37') || cardNum.startsWith('34')) {
    setTimeout(() => {
      console.error('[BUG-009 Triggered] POST /api/gateway/charge returned 502 Bad Gateway');
      simulateNetworkEvent('POST', '/api/gateway/charge', { cardBin: '3782' }, 502, 620);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Place Order & Authorize Payment`;
      }
      showToast('❌ HTTP 502 Bad Gateway: Upstream banking processor unresponsive.', 'error');
    }, 700);
    return;
  }

  // BUG-003: Uncaught TypeError freezing button into infinite spinner
  setTimeout(() => {
    try {
      console.error('[BUG-003 Triggered] Uncaught TypeError in processPayment(): Cannot read properties of undefined (reading gateway_nonce)');
      // Defect: window.paymentConfig is undefined, so accessing activeProvider throws uncaught exception
      const nonce = window.paymentConfig.activeProvider.gateway_nonce;
      console.log('Nonce:', nonce);
    } catch (err) {
      // Intentionally re-throw to window.onerror without resetting button loading state!
      window.dispatchEvent(new ErrorEvent('error', {
        error: err,
        message: "Uncaught TypeError: Cannot read properties of undefined (reading 'gateway_nonce') at handlePlaceOrder (app.js:482:21)"
      }));
      // Notice: `btn.disabled = false` is OMITTED! Button is frozen forever!
      showToast('⚠️ Critical Exception: Button trapped in infinite spin. Check console.', 'error');
      return;
    }

    // Normal happy path (never reached unless bug fixed)
    closeCheckoutModal();
    openSuccessModal();
  }, 900);
}

function renderCheckoutMiniItems() {
  const container = document.getElementById('checkoutMiniItems');
  if (!container) return;
  container.innerHTML = cart.map(item => `
    <div class="checkout-item-mini">
      <span>${item.name} &times; ${item.quantity}</span>
      <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
    </div>
  `).join('');
}

function openSuccessModal() {
  document.getElementById('successBackdrop')?.classList.add('open');
  cart = [];
  recalculateCartTotals();
  updateCartBadge();
}

function closeSuccessModal() {
  document.getElementById('successBackdrop')?.classList.remove('open');
}

// ============================================================================
// 7. QUICK VIEW MODAL & BUG-006 SILENT CRASH
// ============================================================================
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quickViewBackdrop');
  const title = document.getElementById('qvModalTitle');

  if (productId === 'prod-003') {
    // BUG-006: Queries non-existent selector `#quickViewBodyMissingContainer`
    console.error('[BUG-006 Triggered] TypeError: Cannot set properties of null (setting innerHTML)');
    try {
      const missingTarget = document.querySelector('#quickViewBodyMissingContainer');
      missingTarget.innerHTML = `<p>Test</p>`; // Throws TypeError: null
    } catch (err) {
      window.dispatchEvent(new ErrorEvent('error', {
        error: err,
        message: "Uncaught TypeError: Cannot set properties of null (setting 'innerHTML') at openQuickView (app.js:542:25)"
      }));
    }
    // Opens blank modal with no content
    if (modal) modal.classList.add('open');
    if (title) title.textContent = product.name;
    showToast('⚠️ Silent DOM Crash: Quick View modal body failed to render.', 'warning');
    return;
  }

  // Normal happy path for other products
  const container = document.getElementById('quickViewBodyContainer');
  if (container) {
    container.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="quick-view-img" />
      <div>
        <span class="product-category">${product.categoryName}</span>
        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">${product.name}</h2>
        <div class="product-rating" style="margin-bottom: 1rem;">
          <span>★★★★★</span>
          <strong>${product.rating}</strong>
          <span>(${product.reviews} reviews)</span>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem;">${product.desc}</p>
        <div class="price-row">
          <span class="current-price" style="font-size: 1.75rem;">$${product.price.toFixed(2)}</span>
          ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-full-width" onclick="handleAddToCart('${product.id}'); closeQuickViewModal();">
          Add to Bag
        </button>
      </div>
    `;
  }
  if (modal) modal.classList.add('open');
}

function closeQuickViewModal() {
  document.getElementById('quickViewBackdrop')?.classList.remove('open');
}

// ============================================================================
// 8. QA HELPER & TELEMETRY SIMULATOR
// ============================================================================
function toggleQaHud() {
  const drawer = document.getElementById('qaHudDrawer');
  if (drawer) {
    drawer.classList.toggle('collapsed');
  }
}

function highlightBug(bugId) {
  // Clear any existing highlights
  document.querySelectorAll('.bug-highlighted').forEach(el => el.classList.remove('bug-highlighted'));

  let targetSelector = '';
  if (bugId === 'BUG-001') targetSelector = '#card-prod-001 .btn-add-cart';
  if (bugId === 'BUG-002') targetSelector = '#navDealsLink';
  if (bugId === 'BUG-003') {
    openCheckoutModal();
    goToStep(3);
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-004') {
    openCartDrawer();
    targetSelector = '#couponBoxWrapper';
  }
  if (bugId === 'BUG-005') {
    if (cart.length === 0) addItemToCart(PRODUCTS[0], 1);
    openCartDrawer();
    targetSelector = '.qty-minus-btn';
  }
  if (bugId === 'BUG-006') targetSelector = '#card-prod-003 .btn-quick-view';
  if (bugId === 'BUG-007') targetSelector = '#globalSearchInput';
  if (bugId === 'BUG-008') targetSelector = '#currencySelect';
  if (bugId === 'BUG-009') {
    openCheckoutModal();
    goToStep(3);
    fillTestCard('amex');
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-010') {
    openCheckoutModal();
    goToStep(1);
    document.getElementById('shipEmail').value = '';
    targetSelector = '#shipEmail';
  }

  if (targetSelector) {
    setTimeout(() => {
      const el = document.querySelector(targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bug-highlighted');
        showToast(`Target for ${bugId} highlighted!`);
      }
    }, 200);
  }
}

function simulateSearchApiCall(query) {
  // BUG-007: Unthrottled API call simulating 500 server error
  console.error(`[BUG-007 Triggered] GET /api/search?q=${encodeURIComponent(query)} -> HTTP 500 Internal Server Error`);
  simulateNetworkEvent('GET', `/api/search?q=${encodeURIComponent(query)}`, null, 500, 45);
}

function simulateNetworkEvent(method, url, body, status, durationMs) {
  // Dispatches synthetic telemetry event for SilentQA Chrome Extension
  const event = new CustomEvent('silentqa:network', {
    detail: { method, url, body, status, durationMs, ts: Date.now() }
  });
  window.dispatchEvent(event);
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  showToast('Welcome to the Lumina Collective! $30 voucher sent to your inbox.');
  e.target.reset();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
"""

def main():
    print("Building full organized Lumina Gear Demo Shop...")
    
    # 1. Write demo-shop/styles.css
    with open('demo-shop/styles.css', 'w', encoding='utf-8') as f:
        f.write(STYLES_CSS)
    print(f"[OK] Wrote demo-shop/styles.css ({len(STYLES_CSS)} bytes)")

    # 2. Write demo-shop/app.js
    with open('demo-shop/app.js', 'w', encoding='utf-8') as f:
        f.write(APP_JS)
    print(f"[OK] Wrote demo-shop/app.js ({len(APP_JS)} bytes)")

    # 3. Mirror directly into apps/web/public/shop/
    os.makedirs('apps/web/public/shop', exist_ok=True)
    shutil.copyfile('demo-shop/index.html', 'apps/web/public/shop/index.html')
    shutil.copyfile('demo-shop/styles.css', 'apps/web/public/shop/styles.css')
    shutil.copyfile('demo-shop/app.js', 'apps/web/public/shop/app.js')
    
    # Also copy styles.css and app.js to apps/web/public/ for fallback root resolution
    shutil.copyfile('demo-shop/styles.css', 'apps/web/public/styles.css')
    shutil.copyfile('demo-shop/app.js', 'apps/web/public/app.js')

    print("[OK] Successfully mirrored all clean files to apps/web/public/shop/ and apps/web/public/!")

if __name__ == '__main__':
    main()
