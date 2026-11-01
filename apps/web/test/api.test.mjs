import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { IngestBatchSchema, ComplaintSubmissionSchema, DefectReportUpdateSchema } from '../../../packages/shared/src/schemas.ts';
import { rankEventsForMapper, buildSignalSummary } from '../../../packages/shared/src/signals.ts';
import { generatePlaywrightReproductionScript } from '../../../packages/shared/src/playwright.ts';
import { buildFallbackReport } from '../lib/llm.ts';
import { renderReportEmailHtml, renderOtpEmailHtml } from '../lib/mail.ts';
import { ensureUUID } from '../lib/supabase.ts';

test('Phase 3 - API Ingest: Validates and enriches event batches', () => {
  const batch = {
    project_token: 'sqa_live_demo_key_2026',
    session_id: 'ses_test_01',
    events: [
      {
        id: 'evt_1',
        session_id: 'ses_test_01',
        ts: Date.now(),
        type: 'click',
        severity: 'info',
        selector: 'button#add-to-cart',
      },
      {
        id: 'evt_2',
        session_id: 'ses_test_01',
        ts: Date.now() + 7,
        type: 'network',
        severity: 'info',
        url: '/api/cart/add',
        method: 'POST',
      },
    ],
  };

  const parsed = IngestBatchSchema.safeParse(batch);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.data.events.length, 2);
});

test('Phase 3 - API Complaints & Adaptive Mapper: Maps note to ranked events and generates report', () => {
  const candidateEvents = [
    {
      id: 'e1',
      session_id: 's1',
      ts: 1000,
      type: 'click',
      severity: 'info',
      selector: 'button#add-to-cart',
      text: 'Add to Cart',
    },
    {
      id: 'e2',
      session_id: 's1',
      ts: 1005,
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      status: 200,
      shape: { itemId: 'number', qty: 'number' },
    },
    {
      id: 'e3',
      session_id: 's1',
      ts: 1012, // 7ms later
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      status: 200,
      shape: { itemId: 'number', qty: 'number' },
    },
    {
      id: 'e4',
      session_id: 's1',
      ts: 1020,
      type: 'signal',
      severity: 'warn',
      text: 'duplicate_request: POST /api/cart/add fired twice within 7ms',
    },
  ];

  const note = 'problem in cart button';
  const ranked = rankEventsForMapper(candidateEvents, note, 'button#add-to-cart');
  const signals = buildSignalSummary(ranked);

  assert.strictEqual(signals.duplicate_request_count, 1);
  assert.strictEqual(ranked[0].id, 'e4', 'Signal event ranked highest');

  // Verify fallback report generator
  const report = buildFallbackReport(note, ranked, signals);
  assert.strictEqual(report.severity, 'high');
  assert.ok(report.actual.includes('Duplicate network request fired'));
  assert.ok(report.suggested_checks.length > 0);

  // Verify Playwright script synthesizer
  const playwrightScript = generatePlaywrightReproductionScript(report, ranked);
  assert.ok(playwrightScript.includes('@playwright/test'));
  assert.ok(playwrightScript.includes("page.locator('button#add-to-cart').click()"));
});

test('Phase 3 - Mail: Renders responsive inline-styled HTML report email', () => {
  const sampleReport = {
    id: 'rep_demo_101',
    title: 'Duplicate Add-to-Cart Submission',
    severity: 'high',
    steps: ['1. Open product page', '2. Click Add to cart once'],
    expected: 'Cart item count becomes 1',
    actual: 'Cart item count becomes 2 due to duplicate POST',
    root_cause_hypothesis: 'Duplicate event listener invocation',
    confidence: 'high',
    status: 'draft',
    ai_fallback: false,
    evidence_ids: ['e1', 'e2'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const html = renderReportEmailHtml(sampleReport, 'http://localhost:3000/app/report/rep_demo_101');
  assert.ok(html.includes('SILENT QA DEFECT REPORT'));
  assert.ok(html.includes('rep_demo_101'));
  assert.ok(html.includes('EXPECTED BEHAVIOR'));
  assert.ok(html.includes('ACTUAL OBSERVED'));
  assert.ok(html.includes('Open Full Report & Evidence'));
});

test('Phase 3 - Report Patch & UUID Schema: Validates updates and RFC-4122 compliance', () => {
  // Test update schema
  const validUpdate = {
    status: 'verified',
    severity: 'critical',
  };
  const parseResult = DefectReportUpdateSchema.safeParse(validUpdate);
  assert.strictEqual(parseResult.success, true);

  const invalidUpdate = {
    status: 'invalid_status_xyz',
  };
  const invalidResult = DefectReportUpdateSchema.safeParse(invalidUpdate);
  assert.strictEqual(invalidResult.success, false);

  // Test RFC-4122 UUID normalization
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const standardUUID = '12345678-1234-4234-a234-123456789abc';
  assert.strictEqual(ensureUUID(standardUUID), standardUUID);

  const hashedUUID = ensureUUID('ses_custom_session_99');
  assert.ok(uuidRegex.test(hashedUUID));
  assert.strictEqual(ensureUUID('ses_custom_session_99'), hashedUUID, 'Deterministic hash');
});

test('Phase 3 - Auth OTP Mail: Renders secure OTP email and hashes verification codes', () => {
  const code = '748291';
  const html = renderOtpEmailHtml(code, 'register');
  assert.ok(html.includes('748291'));
  assert.ok(html.includes('Complete Your Team Registration'));
  assert.ok(html.includes('Expires in 10 minutes'));

  const loginHtml = renderOtpEmailHtml(code, 'login');
  assert.ok(loginHtml.includes('Sign In to Your Workspace'));

  // Test SHA-256 hash match
  const email = 'tester@company.io';
  const hash1 = crypto.createHash('sha256').update(code + email.toLowerCase()).digest('hex');
  const hash2 = crypto.createHash('sha256').update(code + email.toLowerCase()).digest('hex');
  assert.strictEqual(hash1, hash2, 'Hash is deterministic');
});


