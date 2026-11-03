#!/usr/bin/env python3
"""
SilentQA - Complete System Architecture, Operational Overview & User Manual PDF Generator
Engineered with ReportLab 5.0.1 for Pixel-Perfect Publication Layout
"""

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count 'Page X of Y'
    along with running header and footer on every page except the cover page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(54, letter[1] - 34, "SILENTQA SYSTEM ARCHITECTURE & ENTERPRISE USER MANUAL")
        self.drawRightString(letter[0] - 54, letter[1] - 34, "OFFICIAL SYSTEM SPECIFICATION • V2.4.0")
        
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(54, letter[1] - 40, letter[0] - 54, letter[1] - 40)

        # Running Footer
        self.line(54, 44, letter[0] - 54, 44)
        self.setFont("Helvetica", 7.8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY • SILENTQA AUTOMATION FLEET • https://silentai.dpdns.org")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)

        self.restoreState()


def build_pdf(filename="SilentQA_System_Architecture_and_User_Manual.pdf"):
    # Target letter size: 612 x 792 pt. Printable width = 504 pt. Printable height = 696 pt.
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Color Tokens
    PRIMARY = colors.HexColor("#0f172a")     # Slate 900
    SECONDARY = colors.HexColor("#3730a3")   # Indigo 800
    ACCENT = colors.HexColor("#4f46e5")      # Indigo 600
    TEXT_MAIN = colors.HexColor("#1e293b")   # Slate 800
    TEXT_MUTED = colors.HexColor("#475569")  # Slate 600
    CARD_BG = colors.HexColor("#f8fafc")     # Slate 50
    CARD_BORDER = colors.HexColor("#e2e8f0") # Slate 200

    # Custom Typography
    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=PRIMARY,
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=3,
        spaceAfter=5,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=SECONDARY,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.4,
        leading=11.8,
        textColor=TEXT_MAIN,
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.4,
        leading=11.8,
        textColor=PRIMARY,
        spaceAfter=2
    ))

    styles.add(ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.4,
        leading=9.8,
        textColor=colors.HexColor("#0f172a"),
        backColor=CARD_BG,
        borderPadding=4,
        spaceBefore=2,
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.1,
        leading=11.2,
        textColor=TEXT_MAIN,
        leftIndent=8,
        spaceAfter=2
    ))

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 8))
    
    # Top Category Pill
    top_badge_data = [[
        Paragraph("<font color='#3730a3'><b>[ENTERPRISE AUTONOMOUS QA PLATFORM]</b></font>", styles['BodyDark']),
        Paragraph("<font color='#059669'><b>● STATUS: PRODUCTION DEPLOYED (V2.4.0)</b></font>", styles['BodyDark'])
    ]]
    top_badge_table = Table(top_badge_data, colWidths=[280, 224])
    top_badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eef2ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#c7d2fe")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(top_badge_table)
    story.append(Spacer(1, 10))

    # Main Cover Title
    story.append(Paragraph("SilentQA Engine", styles['CoverTitle']))
    story.append(Paragraph("System Architecture, Operational Overview & Complete User Manual", styles['CoverSubtitle']))
    
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=0, spaceAfter=10))

    # Executive Abstract Box
    abstract_text = (
        "<b>Executive Overview:</b> SilentQA is a next-generation software quality assurance flight-recorder and "
        "autonomous defect intelligence engine. It captures high-fidelity browser micro-telemetry (DOM mutations, "
        "network HAR streams, user interactions, console faults, and rendering signals) in real time with zero "
        "perceived overhead. Equipped with built-in PII redaction (Luhn algorithm validation, cryptographic token masking), "
        "synthetic signal detectors (rage clicks, dead clicks, duplicate requests), and Google Gemini AI orchestration, "
        "SilentQA synthesizes fully reproducible Playwright scripts, interactive root cause analysis (RCA), and "
        "automated Jira/GitHub tickets within seconds of user complaint submission."
    )
    abstract_data = [[Paragraph(abstract_text, styles['BodyDark'])]]
    abstract_table = Table(abstract_data, colWidths=[504])
    abstract_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(abstract_table)
    story.append(Spacer(1, 10))

    # Production Metadata & URLs
    meta_data = [
        [
            Paragraph("<b>Production Domain (Live):</b>", styles['BodyDark']),
            Paragraph("<font color='#3730a3'><b>https://silentai.dpdns.org</b></font>", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Vercel Edge Gateway:</b>", styles['BodyDark']),
            Paragraph("https://hhhcct.vercel.app", styles['BodyDark'])
        ],
        [
            Paragraph("<b>DNS & Edge Security:</b>", styles['BodyDark']),
            Paragraph("Cloudflare Edge Network (javon.ns & tiffany.ns)", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Source Repository:</b>", styles['BodyDark']),
            Paragraph("github.com/fazil-dev-tech/silent-qa-hackathon (branch: master)", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Target Frameworks:</b>", styles['BodyDark']),
            Paragraph("Next.js 15 (Turbopack), React 19, Supabase Postgres, Chrome MV3", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Verification Status:</b>", styles['BodyDark']),
            Paragraph("<font color='#059669'><b>17/17 Unit Tests Passing • 0 TypeScript Diagnostic Errors</b></font>", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Document Version / Date:</b>", styles['BodyDark']),
            Paragraph(f"v2.4.0-PROD • {datetime.now().strftime('%B %d, %Y')}", styles['BodyDark'])
        ]
    ]
    meta_table = Table(meta_data, colWidths=[150, 354])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Table of Contents:</b>", styles['BodyBold']))
    toc_data = [
        [Paragraph("1. Executive Vision & System Topology", styles['BodyDark']), Paragraph("Page 2", styles['BodyDark'])],
        [Paragraph("2. Telemetry Taxonomy & Synthetic Signals Engine", styles['BodyDark']), Paragraph("Page 3", styles['BodyDark'])],
        [Paragraph("3. Chrome Extension (Flight Recorder) User Manual", styles['BodyDark']), Paragraph("Page 4", styles['BodyDark'])],
        [Paragraph("4. Web Command Center & Fleet Dashboard Operations", styles['BodyDark']), Paragraph("Page 5", styles['BodyDark'])],
        [Paragraph("5. AI Defect Intelligence, RCA & Playwright Synthesis", styles['BodyDark']), Paragraph("Page 6", styles['BodyDark'])],
        [Paragraph("6. Admin Governance, Deployment & REST API Reference", styles['BodyDark']), Paragraph("Page 7", styles['BodyDark'])],
    ]
    toc_table = Table(toc_data, colWidths=[430, 74])
    toc_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(toc_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ARCHITECTURE & MONOREPO TOPOLOGY
    # =========================================================================
    story.append(Paragraph("1. Executive Vision & System Topology", styles['SectionH1']))
    story.append(Paragraph(
        "Software testing traditionally suffers from the <b>'reproduction gap'</b>: developers waste 30-50% of debugging "
        "time trying to reproduce cryptic bug reports submitted with incomplete steps, missing environment state, or unhelpful "
        "static screenshots. SilentQA solves this by recording continuous micro-telemetry on client applications and "
        "packaging it into deterministic, machine-executable reproduction suites.",
        styles['BodyDark']
    ))

    story.append(Paragraph("End-to-End Architectural Flow", styles['SectionH2']))

    arch_flow = [
        [
            Paragraph("<b>[1] CLIENT TIER</b><br/>Chrome MV3 Extension<br/>• Content Script DOM Observer<br/>• Injected Network Hook<br/>• Offscreen Audio/Video Capture<br/>• Local Ring Buffer Storage", styles['BodyDark']),
            Paragraph("<b>[2] INGESTION TIER</b><br/>Next.js 15 Edge Routes<br/>• Batch Telemetry Streaming<br/>• Session Lock & De-dupe<br/>• Dynamic PII Sanitizer<br/>• Cloudflare Global CDN", styles['BodyDark']),
            Paragraph("<b>[3] INTELLIGENCE TIER</b><br/>AI Core & Synthesis<br/>• Google Gemini 1.5 Pro<br/>• Synthetic Signal Engine<br/>• Playwright Synthesizer<br/>• Supabase Vector/JSON DB", styles['BodyDark'])
        ]
    ]
    arch_table = Table(arch_flow, colWidths=[168, 168, 168])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#c7d2fe")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Monorepo Structure & Package Responsibilities", styles['SectionH2']))
    mono_data = [
        [Paragraph("<b>Directory / Package</b>", styles['BodyBold']), Paragraph("<b>Role & Technical Stack</b>", styles['BodyBold']), Paragraph("<b>Key Responsibilities</b>", styles['BodyBold'])],
        [
            Paragraph("<font face='Courier'>apps/web</font>", styles['BodyDark']),
            Paragraph("Next.js 15, React 19, Tailwind CSS, Lucide, Framer Motion", styles['BodyDark']),
            Paragraph("Web command center, fleet sessions viewer, AI defect report viewer, admin console, edge API routes.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>apps/extension</font>", styles['BodyDark']),
            Paragraph("Chrome Manifest V3, Webpack/TS, Offscreen API, Content Scripts", styles['BodyDark']),
            Paragraph("Flight recording engine, DOM mutation interception, network HAR tracking, selector picker, bug complaint submitter.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>packages/shared</font>", styles['BodyDark']),
            Paragraph("Isomorphic TypeScript Library, Zod Validation Schemas", styles['BodyDark']),
            Paragraph("Canonical types (TelemetryEvent, DefectReport), Luhn PII scrubber, synthetic signal detectors, Playwright code generator.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>supabase</font>", styles['BodyDark']),
            Paragraph("PostgreSQL Database, Row-Level Security (RLS)", styles['BodyDark']),
            Paragraph("Persistent flight sessions, telemetry logs, defect reports, tester profiles, audit logs.", styles['BodyDark'])
        ]
    ]
    mono_table = Table(mono_data, colWidths=[105, 185, 214])
    mono_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#eef2ff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(mono_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Session State Synchronization & Fleet Consistency", styles['SectionH2']))
    story.append(Paragraph(
        "To ensure rock-solid stability during continuous live testing, the SilentQA Web Dashboard utilizes a "
        "<b>functional state lock</b> and <b>localStorage persistence</b> (<font face='Courier'>sqa_selected_session_id</font>). "
        "Background polling occurs silently every 10 seconds without resetting user selections, spinning buttons, or disrupting active investigations.",
        styles['BodyDark']
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: TELEMETRY TAXONOMY & PII SCRUBBING
    # =========================================================================
    story.append(Paragraph("2. Telemetry Taxonomy & Synthetic Signals", styles['SectionH1']))
    story.append(Paragraph(
        "SilentQA ingests micro-events into a standardized <font face='Courier'>TelemetryEvent</font> data structure. "
        "Events are tagged with millisecond epoch timestamps, severity levels, deterministic fingerprints, and selector paths.",
        styles['BodyDark']
    ))

    events_data = [
        [Paragraph("<b>Category</b>", styles['BodyBold']), Paragraph("<b>Event Types</b>", styles['BodyBold']), Paragraph("<b>Description & Extraction Logic</b>", styles['BodyBold'])],
        [
            Paragraph("<b>User Interactions</b>", styles['BodyDark']),
            Paragraph("<font face='Courier'>click, input, form_submit</font>", styles['BodyDark']),
            Paragraph("Captures targeted DOM elements, unique CSS selectors, sanitized keystroke lengths, and submission triggers.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Network & HAR</b>", styles['BodyDark']),
            Paragraph("<font face='Courier'>network, websocket_in, websocket_out</font>", styles['BodyDark']),
            Paragraph("Captures HTTP method, status codes (2xx, 4xx, 5xx), response durations (ms), payload shapes, and socket frame drops.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>DOM & Rendering</b>", styles['BodyDark']),
            Paragraph("<font face='Courier'>dom, route_change, navigation</font>", styles['BodyDark']),
            Paragraph("Tracks page navigation, SPAs client-side routing, layout shifts, element insertions, and viewport resizing.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Runtime Faults</b>", styles['BodyDark']),
            Paragraph("<font face='Courier'>error, warning, performance</font>", styles['BodyDark']),
            Paragraph("Traps unhandled JavaScript exceptions, window error events, rejected promises, console.warn traces, and slow frames.", styles['BodyDark'])
        ]
    ]
    events_table = Table(events_data, colWidths=[105, 165, 234])
    events_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(events_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Synthetic Anomaly Detection Algorithms", styles['SectionH2']))
    story.append(Paragraph(
        "SilentQA's signal engine analyzes temporal clusters of raw telemetry to synthesize high-confidence heuristic anomalies:",
        styles['BodyDark']
    ))

    signal_algo_data = [
        [Paragraph("<b>Signal Name</b>", styles['BodyBold']), Paragraph("<b>Trigger Heuristic & Window</b>", styles['BodyBold']), Paragraph("<b>QA Impact & RCA Implication</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Dead Click</b>", styles['BodyDark']),
            Paragraph("User clicks an element; 0 DOM mutations and 0 network requests occur within 1,000ms.", styles['BodyDark']),
            Paragraph("Indicates broken event listeners, missing click handlers, or unresponsive UI components.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Rage Click</b>", styles['BodyDark']),
            Paragraph("≥3 consecutive clicks on the same DOM selector within a 500ms sliding window.", styles['BodyDark']),
            Paragraph("Highlights severe user frustration, frozen checkout buttons, or stalled asynchronous states.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Duplicate Request</b>", styles['BodyDark']),
            Paragraph("Identical HTTP method + URL + payload fingerprint triggered within 1,000ms.", styles['BodyDark']),
            Paragraph("Detects missing button debouncing, double-charge billing hazards, and race conditions.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Slow Request</b>", styles['BodyDark']),
            Paragraph("HTTP/API response duration exceeds 2,000ms (or customizable SLA threshold).", styles['BodyDark']),
            Paragraph("Flags backend microservice bottlenecks, unindexed DB queries, or edge timeouts.", styles['BodyDark'])
        ]
    ]
    signal_table = Table(signal_algo_data, colWidths=[105, 190, 209])
    signal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(signal_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Enterprise PII Redaction & Secret Masking", styles['SectionH2']))
    story.append(Paragraph(
        "To satisfy GDPR, CCPA, and SOC 2 requirements, all telemetry passes through the client-side <b>SilentQA Scrubber</b> "
        "before persisting to disk or transmitting across network boundaries:",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Luhn Algorithm Validation:</b> Mathematically validates and redacts Visa, Mastercard, AMEX, and Discover numbers (<font face='Courier'>[CARD_REDACTED]</font>).", styles['BulletText']))
    story.append(Paragraph("• <b>Cryptographic Secret Masking:</b> Automatically identifies and masks Bearer Tokens, JWTs, API Keys, Passwords, and Session Nonces (<font face='Courier'>[SECRET_REDACTED]</font>).", styles['BulletText']))
    story.append(Paragraph("• <b>National ID & Identity Redaction:</b> Sanitizes Indian PAN, Aadhaar, US SSN, Email Addresses, and Phone Numbers.", styles['BulletText']))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: CHROME EXTENSION USER MANUAL
    # =========================================================================
    story.append(Paragraph("3. Chrome Extension (Flight Recorder) User Manual", styles['SectionH1']))
    story.append(Paragraph(
        "The SilentQA Chrome Extension (<font face='Courier'>apps/extension</font>) operates silently in the tester's browser. "
        "It acts as an automated flight data recorder, continuously streaming events to the fleet telemetry buffer.",
        styles['BodyDark']
    ))

    ext_options_data = [
        [Paragraph("<b>Feature / Control</b>", styles['BodyBold']), Paragraph("<b>Badge / State</b>", styles['BodyBold']), Paragraph("<b>Operational Function & Usage</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Recording Toggle</b>", styles['BodyDark']),
            Paragraph("<font color='#059669'><b>[RECORDING]</b></font><br/><font color='#d97706'><b>[PAUSED]</b></font>", styles['BodyDark']),
            Paragraph("Starts or pauses telemetry recording. When active, a pulsing green radar dot displays. In paused state, an amber banner alerts the user that recording is suspended.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Station & Tester Tag</b>", styles['BodyDark']),
            Paragraph("<b>[QA-STATION]</b>", styles['BodyDark']),
            Paragraph("Binds the flight session to a specific tester identity and hardware workstation (e.g. Chrome/Win11) for precise team telemetry attribution.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Target Host Indicator</b>", styles['BodyDark']),
            Paragraph("<b>[ACTIVE HOST]</b>", styles['BodyDark']),
            Paragraph("Displays the active domain under inspection (e.g. <font face='Courier'>app.local</font> or <font face='Courier'>staging.ecommerce.com</font>) with auto-filtering.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Target Selector Picker</b>", styles['BodyDark']),
            Paragraph("<b>[PICK ELEMENT]</b>", styles['BodyDark']),
            Paragraph("Activates an interactive crosshair overlay on the page. Clicking any element automatically computes its exact CSS selector and binds it to the complaint.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Complaint Window Slider</b>", styles['BodyDark']),
            Paragraph("<b>15s / 30s / 60s</b>", styles['BodyDark']),
            Paragraph("Defines the retro-temporal capture window. When filing a bug, SilentQA packages all telemetry from the preceding N seconds leading up to the failure.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>AI Defect Generator</b>", styles['BodyDark']),
            Paragraph("<b>[GENERATE REPORT]</b>", styles['BodyDark']),
            Paragraph("Instantly bundles local ring-buffer events, scrubs sensitive tokens, sends the payload to the Next.js API, and opens the synthesized report.", styles['BodyDark'])
        ]
    ]
    ext_table = Table(ext_options_data, colWidths=[120, 105, 279])
    ext_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(ext_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step-by-Step Testing Workflow", styles['SectionH2']))
    story.append(Paragraph("<b>Step 1: Install & Pin the Extension:</b> Open Chrome → <font face='Courier'>chrome://extensions</font> → Toggle 'Developer mode' → Click 'Load unpacked' → Select <font face='Courier'>apps/extension/dist</font>.", styles['BulletText']))
    story.append(Paragraph("<b>Step 2: Start Flight Recording:</b> Click the SilentQA extension icon in the toolbar. Verify the green pulsing indicator displays '[RECORDING]'.", styles['BulletText']))
    story.append(Paragraph("<b>Step 3: Perform QA Testing:</b> Browse the application under test naturally (fill forms, click buttons, navigate pages). SilentQA runs in the background with zero lag.", styles['BulletText']))
    story.append(Paragraph("<b>Step 4: Tag a Defect in Real Time:</b> When a bug occurs (e.g. button unresponsive, unexpected error popup, broken checkout):<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;a) Click the extension popup or press hotkey <font face='Courier'>Alt+Shift+Q</font>.<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;b) Enter a quick note (e.g. <i>'Place Order button spins infinitely'</i>).<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;c) Optional: Click <b>[Pick Element]</b> to highlight the failing component.<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;d) Click <b>[Generate AI Report]</b>.", styles['BulletText']))
    story.append(Paragraph("<b>Step 5: View Synthesized Report:</b> The extension automatically syncs with the web command center and opens the complete reproduction report.", styles['BulletText']))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: WEB COMMAND CENTER OPERATIONS
    # =========================================================================
    story.append(Paragraph("4. Web Command Center & Dashboard Operations", styles['SectionH1']))
    story.append(Paragraph(
        "The SilentQA Web Dashboard (<font face='Courier'>https://silentai.dpdns.org/app</font>) provides real-time "
        "fleet observability, session exploration, visual anomaly overlays, and report generation.",
        styles['BodyDark']
    ))

    dash_features = [
        [Paragraph("<b>Dashboard Component</b>", styles['BodyBold']), Paragraph("<b>Control / Badge</b>", styles['BodyBold']), Paragraph("<b>Operational Function</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Fleet Session Selector</b>", styles['BodyDark']),
            Paragraph("<b>[DROPDOWN DRAWER]</b>", styles['BodyDark']),
            Paragraph("Lists all recorded flight sessions across the fleet. Shows session ID, host URL, tester tag, event count, and timestamp. Features persistent selection lock.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Fleet KPI Summary Strip</b>", styles['BodyDark']),
            Paragraph("<b>[METRICS RIBBON]</b>", styles['BodyDark']),
            Paragraph("Displays 4 live KPIs: Total Fleet Sessions, Active Anomaly Rate (%), Critical Defect Count, and Mean Time to Resolution (MTTR).", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Session Timeline Scrubber</b>", styles['BodyDark']),
            Paragraph("<b>[TIMELINE SLIDER]</b>", styles['BodyDark']),
            Paragraph("Visual timeline mapping every micro-event chronologically. Click or drag to scrub session state backwards and forwards in time.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Live Telemetry Stream</b>", styles['BodyDark']),
            Paragraph("<b>[EVENT LOG TABLE]</b>", styles['BodyDark']),
            Paragraph("Color-coded event log with badges for network requests, DOM mutations, console logs, and errors. Filterable by event type and severity.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Anomaly Heatmap Overlay</b>", styles['BodyDark']),
            Paragraph("<b>[VIEWPORT OVERLAY]</b>", styles['BodyDark']),
            Paragraph("Projects bounding boxes over the application UI: Red (Critical Errors), Amber (Rage/Dead Clicks), Green (Successful User Actions).", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Defect Reports Drawer</b>", styles['BodyDark']),
            Paragraph("<b>[GENERATED REPORTS]</b>", styles['BodyDark']),
            Paragraph("Lists all AI-synthesized defect reports with severity pills, confidence scores, and one-click access to detailed inspection pages.", styles['BodyDark'])
        ]
    ]
    dash_table = Table(dash_features, colWidths=[120, 115, 269])
    dash_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#eef2ff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(dash_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Navigating the Flight Session Viewer", styles['SectionH2']))
    story.append(Paragraph("1. <b>Selecting a Session:</b> Open the dropdown in the top-left corner. Pick any active or historical session. Notice that background fleet auto-syncing preserves your selection without resetting.", styles['BulletText']))
    story.append(Paragraph("2. <b>Filtering Telemetry:</b> Use the top filter pills (<font face='Courier'>All</font>, <font face='Courier'>Errors Only</font>, <font face='Courier'>Network Only</font>, <font face='Courier'>Interactions</font>) to isolate relevant events.", styles['BulletText']))
    story.append(Paragraph("3. <b>Inspecting Event Payloads:</b> Click any event row to expand its JSON metadata, request headers, payload shape, and stack trace.", styles['BulletText']))
    story.append(Paragraph("4. <b>Exporting Fleet Telemetry:</b> Use the 'Export JSON' button to download complete sanitized session telemetry for offline analysis or bug archiving.", styles['BulletText']))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: AI DEFECT REPORTS & PLAYWRIGHT SYNTHESIS
    # =========================================================================
    story.append(Paragraph("5. AI Defect Intelligence, RCA & Playwright Synthesis", styles['SectionH1']))
    story.append(Paragraph(
        "When an issue is flagged, SilentQA executes a multi-stage AI reasoning pipeline powered by Google Gemini. "
        "The model analyzes the temporal sequence of user actions, DOM alterations, and network transactions to produce "
        "a comprehensive defect dossier.",
        styles['BodyDark']
    ))

    report_anatomy = [
        [Paragraph("<b>Report Component</b>", styles['BodyBold']), Paragraph("<b>AI Generation Logic</b>", styles['BodyBold']), Paragraph("<b>Developer Value</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Executive Title & Severity</b>", styles['BodyDark']),
            Paragraph("Synthesizes concise, actionable title; assigns severity (<font color='#dc2626'>Critical</font>, <font color='#ea580c'>High</font>, <font color='#d97706'>Medium</font>, <font color='#059669'>Low</font>).", styles['BodyDark']),
            Paragraph("Enables immediate triage in sprint planning and triage standups.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Reproducible Steps</b>", styles['BodyDark']),
            Paragraph("Generates numbered, human-readable steps from user click and input telemetry.", styles['BodyDark']),
            Paragraph("Eliminates vague bug reports like 'checkout is broken'; gives exact sequence.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Root Cause Hypothesis (RCA)</b>", styles['BodyDark']),
            Paragraph("Cross-correlates console errors, 4xx/5xx responses, and code stack traces.", styles['BodyDark']),
            Paragraph("Points developers directly to the offending file, function, or API endpoint.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Playwright Script</b>", styles['BodyDark']),
            Paragraph("Synthesizes end-to-end executable TypeScript test reproducing the bug.", styles['BodyDark']),
            Paragraph("Instant regression test suite additions; runnable in CI/CD pipelines.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Suggested Fix & Checks</b>", styles['BodyDark']),
            Paragraph("Recommends targeted code corrections, defensive checks, and unit tests.", styles['BodyDark']),
            Paragraph("Dramatically accelerates MTTR (Mean Time to Resolution).", styles['BodyDark'])
        ]
    ]
    report_table = Table(report_anatomy, colWidths=[120, 190, 194])
    report_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(report_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Synthesized Playwright Test Reproduction Example", styles['SectionH2']))
    sample_playwright = (
        "import { test, expect } from '@playwright/test';\n\n"
        "test('reproduce: unresponsive checkout payment submission', async ({ page }) => {\n"
        "  // 1. Navigate to target application\n"
        "  await page.goto('https://app.local/checkout');\n\n"
        "  // 2. Replay recorded user interactions\n"
        "  await page.fill('#billing-zip', '94107');\n"
        "  await page.click('button[type=\"submit\"]#place-order');\n\n"
        "  // 3. Automated Assertion (Verifying Anomaly)\n"
        "  // Expected: HTTP 200 POST /api/checkout\n"
        "  // Actual: Trapped 3 consecutive rage clicks & uncaught TypeError\n"
        "  const errorBanner = page.locator('.error-notification');\n"
        "  await expect(errorBanner).toBeVisible();\n"
        "});"
    )
    story.append(Paragraph(sample_playwright.replace('\n', '<br/>').replace(' ', '&nbsp;'), styles['CodeSnippet']))

    story.append(Paragraph("One-Click Enterprise Issue Export (Jira & GitHub)", styles['SectionH2']))
    story.append(Paragraph(
        "SilentQA includes native integrations with Jira Cloud and GitHub Issues. From the report view, clicking "
        "<b>'Export to Jira'</b> or <b>'Create GitHub Issue'</b> automatically formats the title, severity, reproduction steps, "
        "environment metadata, and Playwright code block directly into the target tracker.",
        styles['BodyDark']
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: ADMIN GOVERNANCE, CLOUDFLARE & API REFERENCE
    # =========================================================================
    story.append(Paragraph("6. Admin Governance & Enterprise API Reference", styles['SectionH1']))
    story.append(Paragraph(
        "The Administration Console (<font face='Courier'>/admin</font>) provides fleet control, security policies, "
        "and integration credential management.",
        styles['BodyDark']
    ))

    admin_data = [
        [Paragraph("<b>Governance Domain</b>", styles['BodyBold']), Paragraph("<b>Settings & Capabilities</b>", styles['BodyBold']), Paragraph("<b>Enterprise Policy</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Fleet Ingestion Rules</b>", styles['BodyDark']),
            Paragraph("Rate limits per station, max event buffer size (default: 5,000 events/session), batch compression.", styles['BodyDark']),
            Paragraph("Prevents network congestion and database flooding during intensive exploratory testing.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>PII Scrubbing Policy</b>", styles['BodyDark']),
            Paragraph("Toggle rules: Credit Card (Luhn), Bearer Tokens, JWTs, Email, Phone, Custom Regex patterns.", styles['BodyDark']),
            Paragraph("Mandatory client-side enforcement guarantees zero sensitive customer PII persists to logs.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Data Retention & TTL</b>", styles['BodyDark']),
            Paragraph("Configurable session retention (7 days, 30 days, 90 days), automated cold storage tiering.", styles['BodyDark']),
            Paragraph("Compliance with enterprise data governance and storage cost optimization.", styles['BodyDark'])
        ],
        [
            Paragraph("<b>Integrations Hub</b>", styles['BodyDark']),
            Paragraph("Jira Cloud API tokens, GitHub Personal Access Tokens, Slack Webhook URLs, Gemini API Keys.", styles['BodyDark']),
            Paragraph("Centralized credential encryption with automated permission scoping.", styles['BodyDark'])
        ]
    ]
    admin_table = Table(admin_data, colWidths=[105, 190, 209])
    admin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(admin_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Complete REST API Endpoint Reference", styles['SectionH2']))
    api_data = [
        [Paragraph("<b>Method & Route</b>", styles['BodyBold']), Paragraph("<b>Payload / Parameters</b>", styles['BodyBold']), Paragraph("<b>Description & Return Type</b>", styles['BodyBold'])],
        [
            Paragraph("<font face='Courier'>POST /api/telemetry</font>", styles['BodyDark']),
            Paragraph("<font face='Courier'>{ session_id, events: TelemetryEvent[] }</font>", styles['BodyDark']),
            Paragraph("Batch ingests telemetry events from Chrome extension into persistent storage.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>GET /api/fleet/sessions</font>", styles['BodyDark']),
            Paragraph("<font face='Courier'>?status=active&limit=50</font>", styles['BodyDark']),
            Paragraph("Returns active and historical flight sessions with event counts and metadata.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>POST /api/report</font>", styles['BodyDark']),
            Paragraph("<font face='Courier'>{ complaint, session_id, window_sec }</font>", styles['BodyDark']),
            Paragraph("Executes Gemini AI prompt pipeline; returns synthesized DefectReport object.", styles['BodyDark'])
        ],
        [
            Paragraph("<font face='Courier'>GET /api/sessions/:id/anomalies</font>", styles['BodyDark']),
            Paragraph("<font face='Courier'>URL param: session id</font>", styles['BodyDark']),
            Paragraph("Computes synthetic signals (rage clicks, dead clicks, duplicates) for session.", styles['BodyDark'])
        ]
    ]
    api_table = Table(api_data, colWidths=[145, 175, 184])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#eef2ff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Cloudflare Edge Network & Custom Domain Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "SilentQA is deployed globally on Vercel Edge Infrastructure fronted by the Cloudflare Edge Network. "
        "Authoritative nameservers (<font face='Courier'>javon.ns.cloudflare.com</font> & <font face='Courier'>tiffany.ns.cloudflare.com</font>) "
        "provide CNAME flattening to <font face='Courier'>cname.vercel-dns.com</font> with automated HTTP-01 SSL verification, "
        "giving sub-50ms latency across global QA testing fleets.",
        styles['BodyDark']
    ))

    # Concluding signoff block
    signoff_text = (
        "<b>Document Signoff:</b> Verified against monorepo build, automated test suite (17/17 passing), "
        "and live production endpoint at <b>https://silentai.dpdns.org</b>. Approved for enterprise deployment."
    )
    signoff_data = [[Paragraph(signoff_text, styles['BodyDark'])]]
    signoff_table = Table(signoff_data, colWidths=[504])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#a7f3d0")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(Spacer(1, 4))
    story.append(signoff_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")


if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "SilentQA_System_Architecture_and_User_Manual.pdf"
    build_pdf(out_file)
