#!/usr/bin/env python3
"""
Lumina Gear E-Commerce QA Benchmark - Known Software Defects Catalog & Test Dossier
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

        # Running Header (using ASCII separators to guarantee 100% font compatibility)
        self.drawString(54, letter[1] - 32, "LUMINA GEAR E-COMMERCE QA BENCHMARK | 10 KNOWN DEFECTS CATALOG")
        self.drawRightString(letter[0] - 54, letter[1] - 32, "SILENTQA AUTONOMOUS VERIFICATION SPEC")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, letter[1] - 38, letter[0] - 54, letter[1] - 38)

        # Running Footer
        self.line(54, 40, letter[0] - 54, 40)
        self.setFont("Helvetica", 7.8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 28, "CONFIDENTIAL & TEST REFERENCE | SHOPPING BENCHMARK STORE | https://silentai.dpdns.org/shop")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 28, page_str)

        self.restoreState()


def build_pdf(filename="Shopping_Store_Known_Bugs_Catalog.pdf"):
    # Target letter size: 612 x 792 pt. Printable width = 504 pt. Printable height = 712 pt.
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Color Palette Tokens
    PRIMARY = colors.HexColor("#0f172a")       # Slate 900
    SECONDARY = colors.HexColor("#312e81")     # Indigo 900
    ACCENT = colors.HexColor("#4f46e5")        # Indigo 600
    TEXT_MAIN = colors.HexColor("#1e293b")     # Slate 800
    TEXT_MUTED = colors.HexColor("#475569")    # Slate 600
    CARD_BG = colors.HexColor("#f8fafc")       # Slate 50
    CARD_BORDER = colors.HexColor("#e2e8f0")   # Slate 200
    CODE_BG = colors.HexColor("#0f172a")       # Dark code block bg

    # Custom Typography Styles
    styles.add(ParagraphStyle(
        'CoverSuper',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=ACCENT,
        spaceAfter=6,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=TEXT_MUTED,
        spaceAfter=16
    ))

    styles.add(ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SectionH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=PRIMARY,
        spaceBefore=5,
        spaceAfter=3,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyP',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_MAIN,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        'BodyMuted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=TEXT_MUTED,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=TEXT_MAIN
    ))

    styles.add(ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=PRIMARY
    ))

    styles.add(ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.white
    ))

    styles.add(ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.2,
        textColor=colors.HexColor("#e2e8f0")
    ))

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE & EXECUTIVE OVERVIEW
    # =========================================================================
    story.append(Paragraph("SILENTQA REPRODUCIBILITY LABS | BENCHMARK STOREFRONT", styles['CoverSuper']))
    story.append(Paragraph("Lumina Gear E-Commerce Store:<br/>10 Known Software Defects Catalog & QA Dossier", styles['CoverTitle']))
    story.append(Paragraph("Comprehensive engineering reference manual, root-cause dissection, automated telemetry signatures, and deterministic Playwright test suites for testing SilentQA.", styles['CoverSub']))

    # Metadata Card
    meta_data = [
        [
            Paragraph("<b>Storefront URL:</b>", styles['TableCellBold']),
            Paragraph("https://silentai.dpdns.org/shop/ (Mirror: https://hhhcct.vercel.app/shop/)", styles['TableCell']),
            Paragraph("<b>Target Stack:</b>", styles['TableCellBold']),
            Paragraph("Vanilla HTML5 / Modern CSS3 / ES6+ JavaScript", styles['TableCell'])
        ],
        [
            Paragraph("<b>Version:</b>", styles['TableCellBold']),
            Paragraph("v1.0.0 (Production QA Build)", styles['TableCell']),
            Paragraph("<b>Defect Count:</b>", styles['TableCellBold']),
            Paragraph("10 Intentional Embedded Software Defects", styles['TableCell'])
        ],
        [
            Paragraph("<b>Verification Engine:</b>", styles['TableCellBold']),
            Paragraph("SilentQA MV3 Flight Recorder + Nemotron-3 Causal AI", styles['TableCell']),
            Paragraph("<b>Generated On:</b>", styles['TableCellBold']),
            Paragraph(datetime.now().strftime("%B %d, %Y"), styles['TableCell'])
        ]
    ]
    t_meta = Table(meta_data, colWidths=[80, 180, 80, 164])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Executive Overview
    story.append(Paragraph("Executive Summary & Testing Purpose", styles['SectionH1']))
    story.append(Paragraph(
        "Modern web e-commerce applications frequently suffer from insidious software defects that escape basic manual QA audits but severely undermine business conversions and customer trust: unthrottled API race conditions, dead navigation links that consume clicks silently, unhandled JavaScript exceptions that trap payment buttons in infinite loading spinners, negative cart quantities that corrupt fiscal balances, and silent form discards that fail without user feedback. "
        "The <b>Lumina Gear Storefront</b> was engineered to serve as a high-fidelity, real-world benchmark platform containing <b>10 distinct, mathematically modeled software defects</b>. Each defect maps directly to a primary telemetry detection mechanism within the <b>SilentQA Autonomous Telemetry Flight Recorder</b>.",
        styles['BodyP']
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Why Traditional QA Struggles with These Defect Classes", styles['SectionH2']))
    story.append(Paragraph(
        "Standard end-to-end testing frameworks rely heavily on pre-scripted assertions written by human test engineers. When unexpected defects occur in edge scenarios—such as race conditions on asynchronous state updates or dead clicks where no DOM mutation happens—traditional test suites pass falsely because no explicit assertion existed for that failure mode. "
        "SilentQA overturns this paradigm by maintaining an in-memory 50-slot cyclic ring buffer that continuously intercepts DOM mutations, network fetch streams, console logs, and user interaction trajectories. When an anomaly is encountered, SilentQA automatically determines the root cause and synthesizes a deterministic Playwright reproduction script.",
        styles['BodyP']
    ))
    story.append(Spacer(1, 10))

    # Verification Scope Summary Box
    scope_data = [
        [
            Paragraph("<b>Testing Dimensions Covered:</b>", styles['TableCellBold']),
            Paragraph("&bull; Asynchronous Race Conditions &bull; Inert / Dead Link Traps &bull; Uncaught Promise / TypeErrors &bull; Pointer Event Interception &bull; Mathematical Bounds Violations &bull; Missing DOM Node Crashes &bull; Unthrottled API Floods &bull; State Synchronization Anomalies &bull; Upstream Gateway 502 Failures &bull; Silent Form Discards", styles['TableCell'])
        ]
    ]
    t_scope = Table(scope_data, colWidths=[120, 384])
    t_scope.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, ACCENT),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_scope)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: MASTER DEFECT MATRIX & EXECUTION RUNBOOK
    # =========================================================================
    story.append(Paragraph("Master Defect Classification Matrix", styles['SectionH1']))
    story.append(Paragraph(
        "The table below enumerates all 10 software defects embedded within the Lumina Gear Storefront, their classification taxonomy, severity tier, and the corresponding SilentQA telemetry signature.",
        styles['BodyP']
    ))

    # 10 Bug Matrix Table
    matrix_data = [
        [
            Paragraph("Bug ID", styles['TableHeader']),
            Paragraph("Category", styles['TableHeader']),
            Paragraph("Severity", styles['TableHeader']),
            Paragraph("Defect Summary", styles['TableHeader']),
            Paragraph("SilentQA Telemetry Signature", styles['TableHeader'])
        ],
        [
            Paragraph("<b>BUG-001</b>", styles['TableCellBold']),
            Paragraph("RACE_CONDITION", styles['TableCell']),
            Paragraph("<font color='#ea580c'><b>HIGH</b></font>", styles['TableCell']),
            Paragraph("Double-Add Cart Race Condition on Aura Pro", styles['TableCell']),
            Paragraph("Twin POST /api/cart within 40ms; Delta Qty=+2", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-002</b>", styles['TableCellBold']),
            Paragraph("DEAD_CLICK", styles['TableCell']),
            Paragraph("<font color='#d97706'><b>MEDIUM</b></font>", styles['TableCell']),
            Paragraph("Unresponsive 'Special Deals' Navbar Link", styles['TableCell']),
            Paragraph("e.preventDefault() with zero DOM mutation & no fetch", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-003</b>", styles['TableCellBold']),
            Paragraph("RAGE_CLICK / CRASH", styles['TableCell']),
            Paragraph("<font color='#dc2626'><b>CRITICAL</b></font>", styles['TableCell']),
            Paragraph("Frozen Checkout 'Place Order' Button & Spinner", styles['TableCell']),
            Paragraph("Unhandled TypeError; button spins forever; 4+ rage clicks", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-004</b>", styles['TableCellBold']),
            Paragraph("OBSCURED_CLICK", styles['TableCell']),
            Paragraph("<font color='#d97706'><b>MEDIUM</b></font>", styles['TableCell']),
            Paragraph("Unclickable 'Apply Coupon' Button in Cart", styles['TableCell']),
            Paragraph("Transparent div (z-index: 10) steals pointer coordinates", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-005</b>", styles['TableCellBold']),
            Paragraph("MATH_ANOMALY", styles['TableCell']),
            Paragraph("<font color='#ea580c'><b>HIGH</b></font>", styles['TableCell']),
            Paragraph("Negative Cart Quantity Decrement (-1, -2)", styles['TableCell']),
            Paragraph("Cart count < 0; Subtotal corrupts into negative value", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-006</b>", styles['TableCellBold']),
            Paragraph("DOM_CRASH", styles['TableCell']),
            Paragraph("<font color='#ea580c'><b>HIGH</b></font>", styles['TableCell']),
            Paragraph("Quick View Blank Modal Crash on Apex Keyboard", styles['TableCell']),
            Paragraph("TypeError: querySelector('#modalBodyMissing') is null", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-007</b>", styles['TableCellBold']),
            Paragraph("CONSOLE_FLOOD", styles['TableCell']),
            Paragraph("<font color='#d97706'><b>MEDIUM</b></font>", styles['TableCell']),
            Paragraph("Search Input Unthrottled 500 API Flood", styles['TableCell']),
            Paragraph("Un-debounced keyup events dispatch 20+ failing fetch calls", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-008</b>", styles['TableCellBold']),
            Paragraph("STATE_DESYNC", styles['TableCell']),
            Paragraph("<font color='#d97706'><b>MEDIUM</b></font>", styles['TableCell']),
            Paragraph("Currency Switcher Price Desync (USD vs EUR)", styles['TableCell']),
            Paragraph("Card currency symbol updates; Cart internal state remains in USD", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-009</b>", styles['TableCellBold']),
            Paragraph("NETWORK_502", styles['TableCell']),
            Paragraph("<font color='#ea580c'><b>HIGH</b></font>", styles['TableCell']),
            Paragraph("Payment Gateway 502 Failure with Amex Card", styles['TableCell']),
            Paragraph("HTTP 502 Bad Gateway response from payment endpoint", styles['TableCell'])
        ],
        [
            Paragraph("<b>BUG-010</b>", styles['TableCellBold']),
            Paragraph("SILENT_DISCARD", styles['TableCell']),
            Paragraph("<font color='#d97706'><b>MEDIUM</b></font>", styles['TableCell']),
            Paragraph("Silent Form Discard on Missing Shipping Email", styles['TableCell']),
            Paragraph("Submit intercepted; step does not advance; 0 validation UI shown", styles['TableCell'])
        ]
    ]
    t_mat = Table(matrix_data, colWidths=[55, 95, 55, 145, 154])
    t_mat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_mat)
    story.append(Spacer(1, 14))

    # Built-in QA Benchmark HUD Guide
    story.append(Paragraph("Interactive QA Benchmark Floating HUD", styles['SectionH2']))
    story.append(Paragraph(
        "To accelerate testing and automated reproduction, the Lumina Gear storefront includes an interactive <b>QA Benchmark HUD</b> docked on the left viewport edge. "
        "Clicking on any bug card inside the HUD triggers two automated assistance actions:<br/>"
        "1. <b>Auto-Scroll & Focus:</b> Automatically scrolls the viewport smoothly to the exact UI element involved in the defect.<br/>"
        "2. <b>Visual Target Highlight:</b> Applies a high-visibility pulsing red/amber border (<code>.bug-highlighted</code>) and toast notification, allowing human testers and computer vision agents to immediately locate the trigger.",
        styles['BodyP']
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGES 3 - 12: DEDICATED BUG DOSSIERS (1 BUG PER PAGE)
    # =========================================================================

    def make_code_box(code_text):
        p = Paragraph(code_text.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles['CodeSnippet'])
        tb = Table([[p]], colWidths=[504])
        tb.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CODE_BG),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#334155")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return tb

    def add_bug_page(bug_id, category, severity, title, overview, steps, expected, actual, root_cause, code_snippet, telemetry_signal, pw_test):
        sev_color = "#dc2626" if severity == "CRITICAL" else ("#ea580c" if severity == "HIGH" else "#d97706")
        
        # Header Table
        hdr_data = [
            [
                Paragraph(f"<b>{bug_id} | {title}</b>", styles['SectionH1']),
                Paragraph(f"<font color='{sev_color}'><b>[{severity}]</b></font> <font color='#4f46e5'><b>[{category}]</b></font>", styles['TableCellBold'])
            ]
        ]
        t_hdr = Table(hdr_data, colWidths=[380, 124])
        t_hdr.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('PADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(t_hdr)
        story.append(HRFlowable(width="100%", thickness=1, color=CARD_BORDER, spaceBefore=2, spaceAfter=8))

        # Overview
        story.append(Paragraph(f"<b>Defect Overview & User Impact:</b> {overview}", styles['BodyP']))
        story.append(Spacer(1, 4))

        # Behavior Table
        behavior_data = [
            [
                Paragraph("<b>Reproduction Steps:</b>", styles['TableCellBold']),
                Paragraph(steps, styles['TableCell'])
            ],
            [
                Paragraph("<b>Expected Behavior:</b>", styles['TableCellBold']),
                Paragraph(expected, styles['TableCell'])
            ],
            [
                Paragraph("<b>Observed Broken State:</b>", styles['TableCellBold']),
                Paragraph(actual, styles['TableCell'])
            ],
            [
                Paragraph("<b>SilentQA Telemetry Trace:</b>", styles['TableCellBold']),
                Paragraph(telemetry_signal, styles['TableCell'])
            ]
        ]
        t_beh = Table(behavior_data, colWidths=[120, 384])
        t_beh.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
            ('GRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
            ('PADDING', (0,0), (-1,-1), 4.5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_beh)
        story.append(Spacer(1, 8))

        # Root Cause
        story.append(Paragraph(f"<b>Root Cause Analysis:</b> {root_cause}", styles['BodyMuted']))
        story.append(make_code_box(code_snippet))
        story.append(Spacer(1, 8))

        # Playwright Test
        story.append(Paragraph("<b>Synthesized Playwright Reproduction Test Spec:</b>", styles['SectionH3']))
        story.append(make_code_box(pw_test))
        story.append(PageBreak())

    # -------------------------------------------------------------------------
    # PAGE 3: BUG-001
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-001",
        category="RACE_CONDITION",
        severity="HIGH",
        title="Double-Add Cart Race Condition (Aura Pro)",
        overview="Clicking 'Add to Cart' on the flagship Aura Pro Wireless Headphones product card lacks debounce protection, firing concurrent state mutation handlers and adding 2 items instead of 1 to the cart.",
        steps="1. Open store at /shop/<br/>2. Locate the first product card ('Aura Pro Wireless ANC Headphones').<br/>3. Click the 'Add to Cart' button once with normal user speed.<br/>4. Observe the header cart badge counter and cart drawer.",
        expected="A single item is added to the cart, the cart badge increments by exactly 1, and subtotal equals $349.00.",
        actual="The lack of button debounce and async race condition triggers twin handler executions, incrementing the cart quantity to 2 and subtotal to $698.00.",
        root_cause="The click event handler does not disable the button or use a debounce lock. It dispatches an initial synchronous cart increment, followed by an unthrottled asynchronous state commit that re-increments quantity.",
        code_snippet="""// In app.js (Defective Implementation)
function handleAddToCart(productId) {
  if (productId === 'prod-001') {
    // Missing debounce lock! Twin execution simulates race condition
    cart.addItem(productId, 1);
    setTimeout(() => { cart.addItem(productId, 1); updateUI(); }, 40);
  } else {
    cart.addItem(productId, 1);
  }
}""",
        telemetry_signal="<b>RingBuffer:</b> Captured two POST /api/cart/add dispatches within 40ms. Delta Qty Mutation: [0 -> 1 -> 2]. Missing lock attribute 'disabled' on button#btn-add-prod-001.",
        pw_test="""test('BUG-001: Aura Pro Headphones adds exactly 1 item', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  const addBtn = page.locator('#card-prod-001 .btn-add-cart');
  await addBtn.click();
  const badge = page.locator('#cartBadge');
  await expect(badge).toHaveText('1'); // Fails: received '2'
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 4: BUG-002
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-002",
        category="DEAD_CLICK",
        severity="MEDIUM",
        title="Unresponsive 'Special Deals' Navbar Link",
        overview="Clicking the 'Special Deals' navigation link in the top desktop and mobile navbar performs no action, leaving the user with an inert click and no feedback.",
        steps="1. Open store at /shop/<br/>2. Click on 'Special Deals' in the top header navigation menu.<br/>3. Observe URL bar, scroll position, and UI feedback.",
        expected="The browser either scrolls smoothly to the Deals category filter, navigates to /deals, or displays a toast stating deals are loading.",
        actual="The anchor tag executes e.preventDefault() but contains no subsequent DOM mutations, network requests, or visual state changes.",
        root_cause="The event listener explicitly intercepts the click event and returns false without invoking a router, scroll transition, or modal dispatch.",
        code_snippet="""// In app.js (Defective Implementation)
document.getElementById('navDealsLink').addEventListener('click', (e) => {
  e.preventDefault();
  // BUG-002: Dead click - no DOM mutation, no toast, no navigation
  return false;
});""",
        telemetry_signal="<b>Causal AI:</b> Dead click detected on 'a#navDealsLink'. Click event fired at timestamp T0; 0 DOM mutations recorded in next 2500ms; 0 fetch/XHR network requests dispatched.",
        pw_test="""test('BUG-002: Special Deals navigation updates view', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  const dealsLink = page.locator('#navDealsLink');
  await dealsLink.click();
  // Expect active filter pill to switch to 'sale' or URL to change
  const salePill = page.locator('.filter-pill[data-category="sale"]');
  await expect(salePill).toHaveClass(/active/); // Fails: remains inactive
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 5: BUG-003
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-003",
        category="RAGE_CLICK / CRASH",
        severity="CRITICAL",
        title="Frozen Checkout 'Place Order' Button & Spinner",
        overview="When submitting the checkout modal, an uncaught TypeError is thrown when attempting to read an uninitialized payment gateway object. The submit button is trapped in an infinite spinning animation.",
        steps="1. Add any item to cart.<br/>2. Open cart drawer and click 'Proceed to Checkout'.<br/>3. Fill shipping details and click 'Next: Payment'.<br/>4. Click the 'Place Order' button.<br/>5. Notice button changes to 'Processing...' and freezes forever.",
        expected="A validation or transaction request completes within 2 seconds, displaying the order confirmation screen.",
        actual="Console throws 'TypeError: Cannot read properties of undefined (reading gateway_nonce)'. The spinner animates indefinitely, provoking repeated rage clicks.",
        root_cause="Payment processor mock accesses an undefined nested object property without optional chaining or a try/catch boundary, freezing state.",
        code_snippet="""// In app.js (Defective Implementation)
function processPayment(paymentDetails) {
  setButtonLoading(true);
  // BUG-003: Uncaught TypeError halts promise execution
  const nonce = window.paymentConfig.activeProvider.gateway_nonce;
  return submitGateway(nonce);
}""",
        telemetry_signal="<b>Telemetry RingBuffer:</b> Uncaught TypeError in window.onerror. Rapid click sequence (rage click: 4 clicks in 800ms) recorded on 'button#placeOrderBtn'. Button disabled state never released.",
        pw_test="""test('BUG-003: Place Order completes checkout without uncaught crash', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#openCartBtn').click();
  await page.locator('#btnProceedCheckout').click();
  await page.locator('#btnGoToPayment').click();
  await page.locator('#placeOrderBtn').click();
  await expect(page.locator('#orderSuccessModal')).toBeVisible({ timeout: 5000 });
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 6: BUG-004
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-004",
        category="OBSCURED_CLICK",
        severity="MEDIUM",
        title="Unclickable 'Apply Coupon' Button via Overlay",
        overview="In the slide-out cart drawer, clicking the 'Apply' button next to the coupon code input fails to trigger any action because a transparent overlay intercepts the pointer coordinates.",
        steps="1. Add an item to cart and open the cart drawer.<br/>2. Type 'SAVE20' into the promo code input field.<br/>3. Click the 'Apply' button.<br/>4. Observe that neither discount is applied nor an invalid code error appears.",
        expected="Clicking 'Apply' verifies the promo code, applies a discount, or displays an 'Invalid Coupon' toast message.",
        actual="The click event targets a transparent floating mask (#couponOverlayShield, z-index: 10), preventing the real button from receiving user input.",
        root_cause="A lingering CSS utility layer remains positioned over the coupon action group with pointer-events enabled, stealing hit-test dispatch.",
        code_snippet="""/* In styles.css (Defective Implementation) */
.coupon-overlay-shield {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 10; /* Steals pointer click from button at z-index: 2 */
  pointer-events: auto;
}""",
        telemetry_signal="<b>DOM Observer:</b> Hit-test interception. User click at coordinates (x: 480, y: 620) targeted '.coupon-overlay-shield' instead of underlying 'button#btnApplyCoupon'.",
        pw_test="""test('BUG-004: Coupon apply button receives click event', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#openCartBtn').click();
  await page.locator('#couponInput').fill('SAVE20');
  // Attempt to click apply button
  await page.locator('#btnApplyCoupon').click({ timeout: 2000 });
  await expect(page.locator('.toast')).toBeVisible(); // Fails: click intercepted
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 7: BUG-005
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-005",
        category="MATH_ANOMALY",
        severity="HIGH",
        title="Negative Cart Quantity Decrement (-1, -2)",
        overview="Clicking the minus [-] quantity button in the cart drawer when an item has quantity 1 decrements the item to 0, -1, -2 instead of removing it, resulting in negative fiscal balances.",
        steps="1. Add 1 item to the cart and open the cart drawer.<br/>2. In the cart item row, click the minus '[-]' button repeatedly.<br/>3. Inspect the quantity number and subtotal display.",
        expected="When quantity reaches 1, clicking minus removes the item from the cart, or the minus button becomes disabled.",
        actual="The quantity counter counts down into negative numbers ('-1', '-2', '-3'), producing a negative order subtotal (e.g. -$499.00).",
        root_cause="Missing boundary check if (item.quantity <= 1) { remove(); } in the quantity decrement calculation.",
        code_snippet="""// In app.js (Defective Implementation)
function decrementCartItem(productId) {
  const item = cart.find(p => p.id === productId);
  if (item) {
    // BUG-005: Missing lower bound check! Decrements into negative integers
    item.quantity = item.quantity - 1;
    recalculateCartTotals();
    renderCartDrawer();
  }
}""",
        telemetry_signal="<b>State Audit:</b> Mathematical boundary violation. Mutation detected: cart[prod-002].quantity changed from 1 to 0, then 0 to -1. Subtotal calculated as negative currency.",
        pw_test="""test('BUG-005: Cart item quantity cannot decrement below 1', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#openCartBtn').click();
  const minusBtn = page.locator('.cart-item-row .qty-minus-btn').first();
  await minusBtn.click();
  const qtyDisplay = page.locator('.cart-item-row .qty-number').first();
  if (await qtyDisplay.isVisible()) {
    const val = parseInt(await qtyDisplay.textContent());
    expect(val).toBeGreaterThanOrEqual(1); // Fails: value is 0 or -1
  }
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 8: BUG-006
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-006",
        category="DOM_CRASH",
        severity="HIGH",
        title="Quick View Blank Modal Crash (Apex Pro Keyboard)",
        overview="Clicking 'Quick View' on Product #3 (Apex Pro Magnetic Switch Keyboard) throws an uncaught JavaScript error and presents an empty, unpopulated dark modal.",
        steps="1. Open store at /shop/<br/>2. Scroll to Product #3 ('Apex Pro Magnetic Switch Keyboard').<br/>3. Click the 'Quick View' button.<br/>4. Observe the modal overlay that appears.",
        expected="A modal window opens smoothly displaying the keyboard photo, specs, price, and 'Add to Cart' button.",
        actual="A blank black modal container appears with no product information, and an uncaught TypeError is logged to the console.",
        root_cause="The modal population logic queries #quickViewBodyMissingContainer which does not exist in the DOM, crashing before rendering.",
        code_snippet="""// In app.js (Defective Implementation)
function openQuickView(productId) {
  if (productId === 'prod-003') {
    // BUG-006: Target selector is misspelled / non-existent
    const target = document.querySelector('#quickViewBodyMissingContainer');
    target.innerHTML = renderQuickViewHtml(productId); // Throws TypeError: null
  }
}""",
        telemetry_signal="<b>Console Watcher:</b> Uncaught TypeError: Cannot set properties of null (setting 'innerHTML') at openQuickView (app.js:312). Blank modal node displayed.",
        pw_test="""test('BUG-006: Apex Keyboard Quick View renders product title', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  const qvBtn = page.locator('#card-prod-003 .btn-quick-view');
  await qvBtn.click();
  const title = page.locator('#quickViewModal .qv-product-name');
  await expect(title).toHaveText(/Apex Pro Magnetic Switch Keyboard/); // Fails: blank
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 9: BUG-007
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-007",
        category="CONSOLE_FLOOD",
        severity="MEDIUM",
        title="Search Input Unthrottled 500 API Flood",
        overview="Typing any keyword into the top search bar dispatches unthrottled failing API requests on every individual keystroke, generating rapid 500 error logs.",
        steps="1. Click on the 'Search products...' input in the top header.<br/>2. Type a word such as 'headphones' quickly.<br/>3. Open Chrome DevTools Console.<br/>4. Observe console error count.",
        expected="Search query is debounced by 300ms, filtering the catalog smoothly without throwing unhandled network errors.",
        actual="10 consecutive failing HTTP fetch calls fire within 600ms, logging red 500 Internal Server Error traces for every letter typed.",
        root_cause="Missing debounce() wrapper around the input event listener, combined with an unhandled mock search endpoint rejecting non-cached terms.",
        code_snippet="""// In app.js (Defective Implementation)
searchInput.addEventListener('input', (e) => {
  // BUG-007: No debounce! Firing immediately on every keystroke
  simulateFailingSearchApi(e.target.value);
});""",
        telemetry_signal="<b>Network Watcher:</b> 10 GET /api/search requests fired in 450ms. 10 responses returned HTTP 500. Rate of console.error: >15 per second.",
        pw_test="""test('BUG-007: Search input limits error logs and throttles requests', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#globalSearchInput').fill('wireless audio');
  await page.waitForTimeout(500);
  expect(errors.length).toBe(0); // Fails: captures multiple 500 errors
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 10: BUG-008
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-008",
        category="STATE_DESYNC",
        severity="MEDIUM",
        title="Currency Switcher Price Desync (USD vs EUR)",
        overview="Switching the currency dropdown from USD ($) to EUR (€) updates the product cards in the grid but leaves cart items and checkout total locked in USD, causing price desynchronization.",
        steps="1. Add a product (e.g. $499 Watch) to cart.<br/>2. In the navbar, change Currency dropdown to 'EUR (€)'.<br/>3. Notice cards display €499.00.<br/>4. Open cart drawer and proceed to checkout.<br/>5. Observe checkout currency symbol.",
        expected="All monetary values throughout the storefront, active cart, and checkout flow convert simultaneously to the newly selected currency.",
        actual="Cart subtotal and checkout summaries remain permanently locked to USD ($), showing '$499.00' while the background card displays '€499.00'.",
        root_cause="The currency change listener re-renders #productCatalog but omits calling renderCartDrawer() and recalculateCheckoutTotals().",
        code_snippet="""// In app.js (Defective Implementation)
currencySelect.addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  renderProducts(); 
  // BUG-008: Missing cart update! 
  // renderCart(); recalculateCheckout(); <-- Omitted!
});""",
        telemetry_signal="<b>Telemetry State Mismatch:</b> Global state currency changed to 'EUR'. DOM inspection found '#cartSubtotal' displaying '$' prefix instead of '€'.",
        pw_test="""test('BUG-008: Currency switch updates cart drawer subtotal symbol', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#currencySelect').selectOption('EUR');
  await page.locator('#openCartBtn').click();
  const subtotal = page.locator('#cartSubtotal');
  await expect(subtotal).toContainText('€'); // Fails: displays '$'
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 11: BUG-009
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-009",
        category="NETWORK_502",
        severity="HIGH",
        title="Payment Gateway 502 Failure on Amex Card",
        overview="Attempting to complete checkout using an American Express test card simulates a 502 Bad Gateway response from the upstream banking gateway, failing the purchase.",
        steps="1. Add an item to cart and proceed to Checkout.<br/>2. In Payment step, click 'Fill Amex Card' test button.<br/>3. Click 'Place Order'.<br/>4. Observe network response in DevTools and UI feedback.",
        expected="Card payments are routed through the fallback payment cluster or display a user-friendly retry message.",
        actual="The mock payment route returns HTTP 502 Bad Gateway, throwing an alert and terminating the checkout pipeline.",
        root_cause="Mock gateway card routing simulates an upstream edge server timeout specifically for card bin 37xx (Amex).",
        code_snippet="""// In app.js (Defective Implementation)
if (cardNum.startsWith('37') || cardNum.startsWith('34')) {
  // BUG-009: Simulate upstream payment microservice gateway timeout
  simulateNetworkEvent('POST', '/api/gateway/charge', {}, 502, 600);
  throw new Error('502 Bad Gateway: Upstream processor unresponsive');
}""",
        telemetry_signal="<b>Telemetry Network Hook:</b> POST /api/gateway/charge failed with HTTP Status: 502 Bad Gateway (Duration: 620ms).",
        pw_test="""test('BUG-009: Amex payment completes with 200 OK', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#openCartBtn').click();
  await page.locator('#btnProceedCheckout').click();
  await page.locator('#btnGoToPayment').click();
  await page.locator('#btnFillAmex').click();
  await page.locator('#placeOrderBtn').click();
  await expect(page.locator('#orderSuccessModal')).toBeVisible({ timeout: 5000 });
});"""
    )

    # -------------------------------------------------------------------------
    # PAGE 12: BUG-010
    # -------------------------------------------------------------------------
    add_bug_page(
        bug_id="BUG-010",
        category="SILENT_DISCARD",
        severity="MEDIUM",
        title="Silent Form Discard on Missing Shipping Email",
        overview="When completing the Shipping Details step in checkout, leaving the Email Address field empty silently aborts the 'Next: Payment' button click with zero inline errors or toasts.",
        steps="1. Add any item to cart and proceed to Checkout.<br/>2. Fill in Name, Street, City, and Zip Code, but leave Email blank.<br/>3. Click 'Next: Payment' button.<br/>4. Observe UI response.",
        expected="An explicit red inline validation error appears beneath the Email input: 'Please enter a valid email address'.",
        actual="The modal remains on the Shipping step. No red highlights, no error labels, and no notification appear. The user is left confused as to why the button did nothing.",
        root_cause="The shipping validation routine returns false without toggling an .is-invalid CSS class or appending an error description element.",
        code_snippet="""// In app.js (Defective Implementation)
function validateShippingStep() {
  const email = document.getElementById('shipEmail').value.trim();
  if (!email) {
    // BUG-010: Silent discard - returns false without informing user!
    return false; // No error class added to #shipEmail!
  }
  return true;
}""",
        telemetry_signal="<b>DOM & User Feedback Audit:</b> Click event on 'button#btnGoToPayment' produced 0 navigation advancement and 0 error DOM elements with role='alert'.",
        pw_test="""test('BUG-010: Submitting blank shipping email shows validation error', async ({ page }) => {
  await page.goto('https://silentai.dpdns.org/shop/');
  await page.locator('#card-prod-002 .btn-add-cart').click();
  await page.locator('#openCartBtn').click();
  await page.locator('#btnProceedCheckout').click();
  await page.locator('#shipName').fill('John Tester');
  await page.locator('#shipAddress').fill('123 QA Lane');
  await page.locator('#shipEmail').fill(''); // Leave blank
  await page.locator('#btnGoToPayment').click();
  const errorMsg = page.locator('#shipEmailError');
  await expect(errorMsg).toBeVisible(); // Fails: silent discard
});"""
    )

    # =========================================================================
    # PAGE 13: SILENTQA CAUSAL AI TELEMETRY ARCHITECTURE & VERIFICATION RUNBOOK
    # =========================================================================
    story.append(Paragraph("SilentQA Autonomous Verification Architecture", styles['SectionH1']))
    story.append(Paragraph(
        "SilentQA eliminates the manual overhead of writing test automation scripts by tapping directly into runtime browser signals. "
        "The Lumina Gear storefront exercises every dimension of the SilentQA telemetry detection engine:",
        styles['BodyP']
    ))

    # Architecture Dimension Table
    arch_data = [
        [
            Paragraph("Engine Component", styles['TableHeader']),
            Paragraph("Telemetry Capture Mechanism", styles['TableHeader']),
            Paragraph("Benchmark Bugs Addressed", styles['TableHeader'])
        ],
        [
            Paragraph("<b>MV3 Flight Recorder</b>", styles['TableCellBold']),
            Paragraph("Zero-overhead In-Memory Ring Buffer (50 slots) tracking continuous DOM mutations, user micro-actions (clicks, scrolls, keydowns), and fetch/XHR network streams.", styles['TableCell']),
            Paragraph("BUG-001 (Race Condition), BUG-007 (Unthrottled Keydowns), BUG-009 (502 HTTP)", styles['TableCell'])
        ],
        [
            Paragraph("<b>Heuristic Anomaly Engine</b>", styles['TableCellBold']),
            Paragraph("Real-time behavioral detectors computing dead clicks (pointer down with zero DOM reaction), rage clicks (frequency > 3 clicks / 800ms on inert elements), and obscured pointer barriers.", styles['TableCell']),
            Paragraph("BUG-002 (Dead Click), BUG-003 (Rage Click), BUG-004 (Obscured Layer)", styles['TableCell'])
        ],
        [
            Paragraph("<b>Privacy Sanitizer</b>", styles['TableCellBold']),
            Paragraph("Automatic client-side scrubbing replacing 16-digit credit card numbers (Luhn-10 algorithm), auth tokens, and sensitive PII with cryptographic hashes before telemetry storage.", styles['TableCell']),
            Paragraph("Checkout payment flow & simulated American Express card telemetry", styles['TableCell'])
        ],
        [
            Paragraph("<b>Nemotron-3 Causal AI</b>", styles['TableCellBold']),
            Paragraph("Infers causal links between user intent (e.g. 'checkout failed') and the root event in the telemetry ring buffer, generating a minimal deterministic reproduction graph.", styles['TableCell']),
            Paragraph("BUG-005 (Math Corruption), BUG-006 (DOM Crash), BUG-010 (Silent Discard)", styles['TableCell'])
        ],
        [
            Paragraph("<b>Playwright Code Generator</b>", styles['TableCellBold']),
            Paragraph("Synthesizes self-contained, executable TypeScript/JavaScript test specs with explicit assertions, dynamic element locators, and automated retry budgets.", styles['TableCell']),
            Paragraph("Generates automated CI/CD regression test suites for all 10 bugs", styles['TableCell'])
        ]
    ]
    t_arch = Table(arch_data, colWidths=[110, 240, 154])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('PADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    story.append(Paragraph("How to Benchmark SilentQA Against This Storefront", styles['SectionH2']))
    
    runbook_text = """
    <b>Step 1: Install the Extension:</b> Open Google Chrome, navigate to <code>chrome://extensions</code>, enable Developer Mode, and click <i>Load Unpacked</i>. Select the <code>apps/extension</code> directory.<br/><br/>
    <b>Step 2: Launch the Benchmark Store:</b> Navigate to the live store at <b>https://silentai.dpdns.org/shop/</b> (or run <code>npx serve demo-shop</code> locally).<br/><br/>
    <b>Step 3: Initiate Flight Recording:</b> Click the SilentQA extension icon in the Chrome toolbar and click <b>Start Recording</b>. The recording status indicator will pulse red.<br/><br/>
    <b>Step 4: Trigger Any Bug:</b> Open the floating <b>QA Benchmark HUD</b> on the left screen edge and click any bug card, or perform the reproduction flow naturally (e.g., attempt to place an order or double-click 'Add to Cart').<br/><br/>
    <b>Step 5: Generate Playwright Spec:</b> Click <b>Stop Recording & Generate Test</b>. SilentQA will automatically correlate the telemetry trace, identify the defect, and generate a ready-to-run Playwright test file.
    """
    story.append(Paragraph(runbook_text, styles['BodyP']))

    story.append(Spacer(1, 8))
    # Sign-off card
    sign_off = [
        [
            Paragraph("<b>SilentQA Certification:</b> All 10 defects mathematically modeled and verified.", styles['TableCellBold']),
            Paragraph("<b>Official Deployment:</b> https://silentai.dpdns.org/shop/", styles['TableCell'])
        ]
    ]
    t_sign = Table(sign_off, colWidths=[280, 224])
    t_sign.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, ACCENT),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Generated {filename} successfully.")

if __name__ == "__main__":
    output_pdf = sys.argv[1] if len(sys.argv) > 1 else "Shopping_Store_Known_Bugs_Catalog.pdf"
    build_pdf(output_pdf)
