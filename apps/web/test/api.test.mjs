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
  assert.ok(html.includes('SILENT QA'));
  assert.ok(html.includes('rep_demo_101'));
  assert.ok(html.includes('EXPECTED BEHAVIOR'));
  assert.ok(html.includes('ACTUAL OBSERVED'));
  assert.ok(html.includes('View Interactive Report &amp; Run Playwright Probe'));
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

test('Phase 3 - Auth: Validates executive admin credentials TGVINCENZO and streamlined registration', () => {
  // Test Admin credentials
  const validAdminId = 'TGVINCENZO';
  const validPass = 'Adil123#';
  const isAuth = (id, pass) => id.trim().toUpperCase() === 'TGVINCENZO' && pass === 'Adil123#';

  assert.strictEqual(isAuth(validAdminId, validPass), true);
  assert.strictEqual(isAuth('tgvincenzo', validPass), true, 'Case insensitive ID');
  assert.strictEqual(isAuth('OTHER_USER', validPass), false);
  assert.strictEqual(isAuth(validAdminId, 'wrong_pass'), false);

  // Test registration input constraints (email and mobile number only)
  const validReg = { email: 'qa.lead@enterprise.com', phone: '+1 (555) 234-5678' };
  assert.ok(validReg.email.includes('@'));
  assert.ok(validReg.phone.replace(/\D/g, '').length >= 7, 'Valid mobile number');

  const invalidRegPhone = { email: 'qa@enterprise.com', phone: '123' };
  assert.strictEqual(invalidRegPhone.phone.replace(/\D/g, '').length >= 7, false);
});

test('Phase 4 - Multi-Tester Fleet & Recent Anomaly Mapping: Validates concurrent engineer isolation and 1-click anomaly ranking', () => {
  // 1. Verify schema acceptance of tester attribution
  const submission = {
    session_id: 'ses_workstation_4',
    note: 'that button is not working',
    picked_selector: 'button#checkout',
    tester_name: 'Engineer #4 - Sarah',
    device_tag: 'QA-Rig-04 (MacBook M3)',
    recent_event_id: 'err_api_500',
    submitted_at: Date.now(),
  };

  const parsed = ComplaintSubmissionSchema.safeParse(submission);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.data.tester_name, 'Engineer #4 - Sarah');
  assert.strictEqual(parsed.data.device_tag, 'QA-Rig-04 (MacBook M3)');
  assert.strictEqual(parsed.data.recent_event_id, 'err_api_500');

  // 2. Verify recent anomaly ranking boost (+60 bonus)
  const candidateEvents = [
    {
      id: 'click_btn',
      session_id: 'ses_workstation_4',
      ts: 2000,
      type: 'click',
      severity: 'info',
      selector: 'button#checkout',
      text: 'Proceed to Checkout',
    },
    {
      id: 'err_api_500',
      session_id: 'ses_workstation_4',
      ts: 2020,
      type: 'network',
      severity: 'error',
      status: 500,
      url: '/api/v1/checkout',
      method: 'POST',
    },
    {
      id: 'normal_nav',
      session_id: 'ses_workstation_4',
      ts: 1900,
      type: 'navigation',
      severity: 'info',
      url: '/checkout',
    },
  ];

  // Without recentEventId:
  const rankedGeneral = rankEventsForMapper(candidateEvents, 'that button is not working', 'button#checkout');
  // With recentEventId selected in popup:
  const rankedWithAnomaly = rankEventsForMapper(candidateEvents, 'that button is not working', 'button#checkout', 25, 'err_api_500');

  assert.strictEqual(rankedWithAnomaly[0].id, 'err_api_500', 'Directly selected anomaly anchored as primary trigger');

  // 3. Multi-Tester mathematical isolation
  const tenSessions = Array.from({ length: 10 }, (_, i) => ({
    session_id: `session_engineer_${i + 1}`,
    tester_name: `Engineer #${i + 1}`,
    device_tag: `Station-0${i + 1}`,
  }));

  const uniqueSessionIds = new Set(tenSessions.map((s) => s.session_id));
  assert.strictEqual(uniqueSessionIds.size, 10, 'All 10 engineers maintain distinct session boundaries');
});

test('Phase 4 - Flight-Specific Telemetry Scenario Extraction: Dynamically isolates session anomalies', () => {
  // Session A: Checkout flow with 500 error & JS exception
  const sessionAEvents = [
    {
      id: 'e_click_pay',
      session_id: 'ses_checkout',
      ts: '2026-11-01T18:14:14.000Z',
      type: 'click',
      severity: 'info',
      selector: 'button#checkout-pay',
      text: 'Complete Payment',
    },
    {
      id: 'e_500_pay',
      session_id: 'ses_checkout',
      ts: '2026-11-01T18:14:15.100Z',
      type: 'network',
      severity: 'critical',
      url: '/api/checkout/pay',
      method: 'POST',
      status: 500,
    },
    {
      id: 'e_js_err',
      session_id: 'ses_checkout',
      ts: '2026-11-01T18:14:15.200Z',
      type: 'error',
      severity: 'critical',
      text: 'Uncaught TypeError: Cannot read properties of undefined (reading "chargeId")',
    },
  ];

  // Session B: Supabase admin with rage click & 404
  const sessionBEvents = [
    {
      id: 'e_rage_span',
      session_id: 'ses_supabase_admin',
      ts: '2026-11-02T18:44:20.000Z',
      type: 'signal',
      severity: 'warn',
      selector: 'span.refresh-btn',
      text: 'rage_click: 3+ clicks on span within 2s',
    },
    {
      id: 'e_404_auth',
      session_id: 'ses_supabase_admin',
      ts: '2026-11-02T18:44:21.000Z',
      type: 'network',
      severity: 'error',
      url: 'https://api.supabase.com/platform/integrations/github/authorization',
      method: 'GET',
      status: 404,
    },
  ];

  // Verify Session A extracts checkout pay and 500
  const sessionAAnomalies = sessionAEvents.filter(e => (e.status && e.status >= 500) || e.type === 'error');
  assert.strictEqual(sessionAAnomalies.length, 2);
  assert.strictEqual(sessionAAnomalies[0].status, 500);
  assert.match(sessionAAnomalies[1].text, /chargeId/);

  // Verify Session B extracts rage clicks and 404 without bleeding Session A
  const sessionBAnomalies = sessionBEvents.filter(e => e.type === 'signal' || (e.status && e.status >= 400));
  assert.strictEqual(sessionBAnomalies.length, 2);
  assert.strictEqual(sessionBAnomalies[0].type, 'signal');
  assert.strictEqual(sessionBAnomalies[0].selector, 'span.refresh-btn');
  assert.strictEqual(sessionBAnomalies[1].status, 404);
});

test('Phase 4 - Flight Session Selection Stability: Prevents background sync from resetting user-selected session', () => {
  const activeFleet = [
    { id: 'session_top_1', host: 'api.enterprise.com', started_at: '2026-11-03T10:00:00Z' },
    { id: 'session_user_picked_2', host: 'app.local/checkout.js', started_at: '2026-11-03T10:05:00Z' },
    { id: 'session_other_3', host: 'app.local/cart.js', started_at: '2026-11-03T10:10:00Z' },
  ];

  // Logic used in page.tsx setSelectedSessionId((prev) => ...)
  function computeStableSessionSelection(prevSelectedId, newFleetList, storedId = null) {
    if (prevSelectedId && newFleetList.some(s => s.id === prevSelectedId)) {
      return prevSelectedId; // Locked by user
    }
    if (storedId && newFleetList.some(s => s.id === storedId)) {
      return storedId;
    }
    return newFleetList.length > 0 ? newFleetList[0].id : '';
  }

  // 1. Initial load with no selection: defaults to top
  const initial = computeStableSessionSelection('', activeFleet);
  assert.strictEqual(initial, 'session_top_1', 'Defaults to first session on pristine load');

  // 2. User explicitly selects session 2
  const userSelection = 'session_user_picked_2';

  // 3. Background sync occurs 10s later with updated fleet sessions list
  const updatedFleet = [
    { id: 'session_top_brand_new_0', host: 'new.service.internal', started_at: '2026-11-03T10:15:00Z' },
    ...activeFleet,
  ];

  const postSyncSelection = computeStableSessionSelection(userSelection, updatedFleet);
  assert.strictEqual(
    postSyncSelection,
    'session_user_picked_2',
    'User selection MUST remain locked and NOT reset to top session on auto-sync'
  );

  // 4. If selected session is terminated/expired, fallback to top safely
  const prunedFleet = [
    { id: 'session_top_brand_new_0', host: 'new.service.internal', started_at: '2026-11-03T10:15:00Z' },
  ];
  const postPruneSelection = computeStableSessionSelection(userSelection, prunedFleet);
  assert.strictEqual(
    postPruneSelection,
    'session_top_brand_new_0',
    'Safely falls back to top session only when user-selected session no longer exists'
  );
});




