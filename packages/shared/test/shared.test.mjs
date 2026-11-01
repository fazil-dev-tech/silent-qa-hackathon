import test from 'node:test';
import assert from 'node:assert';
import {
  isValidLuhn,
  scrubText,
  extractBodyShape,
} from '../src/scrubber.ts';
import {
  computeFingerprint,
  detectDuplicateRequests,
  detectRageClicks,
  buildSignalSummary,
  rankEventsForMapper,
} from '../src/signals.ts';
import {
  generatePlaywrightReproductionScript,
} from '../src/playwright.ts';

test('Phase 1 - Scrubber: Validates Luhn credit card check', () => {
  assert.strictEqual(isValidLuhn('4532015112830366'), true); // Valid Visa
  assert.strictEqual(isValidLuhn('4532015112830367'), false); // Invalid check digit
  assert.strictEqual(isValidLuhn('12345'), false); // Too short
});

test('Phase 1 - Scrubber: Redacts emails, tokens, PAN, Aadhaar, and PII', () => {
  const input = 'User test.user@example.com logged in with Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThis and PAN ABCDE1234F and Aadhaar 2345 6789 0123 with card 4532015112830366';
  const scrubbed = scrubText(input);

  assert.ok(!scrubbed.includes('test.user@example.com'), 'Email redacted');
  assert.ok(scrubbed.includes('[EMAIL_REDACTED]'));
  assert.ok(!scrubbed.includes('ABCDE1234F'), 'PAN redacted');
  assert.ok(scrubbed.includes('[PAN_REDACTED]'));
  assert.ok(!scrubbed.includes('2345 6789 0123'), 'Aadhaar redacted');
  assert.ok(scrubbed.includes('[AADHAAR_REDACTED]'));
  assert.ok(!scrubbed.includes('4532015112830366'), 'Card redacted');
  assert.ok(scrubbed.includes('[CARD_REDACTED]'));
});

test('Phase 1 - Scrubber: Extracts safe body shape and masks sensitive keys', () => {
  const payload = {
    itemId: 101,
    quantity: 2,
    customer: {
      name: 'John Doe',
      password: 'superSecretPassword123!',
      apiKey: 'sqa_live_token_987654321',
    },
  };

  const shape = extractBodyShape(payload);
  assert.strictEqual(shape.itemId, 'number');
  assert.strictEqual(shape.quantity, 'number');
  assert.strictEqual(shape.customer.name, 'string');
  assert.strictEqual(shape.customer.password, '[MASKED_KEY]');
  assert.strictEqual(shape.customer.apiKey, '[MASKED_KEY]');
});

test('Phase 1 - Signals: Detects duplicate requests within 1000ms', () => {
  const events = [
    {
      id: 'evt_req_1',
      session_id: 's1',
      ts: 1000,
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      shape: { itemId: 'number', qty: 'number' },
    },
    {
      id: 'evt_req_2',
      session_id: 's1',
      ts: 1007, // 7ms later (blueprint requirement)
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      shape: { itemId: 'number', qty: 'number' },
    },
  ];

  const duplicates = detectDuplicateRequests(events, 1000);
  assert.strictEqual(duplicates.length, 1);
  assert.strictEqual(duplicates[0].first.id, 'evt_req_1');
  assert.strictEqual(duplicates[0].duplicate.id, 'evt_req_2');
});

test('Phase 1 - Signals: Detects rage clicks within 2000ms window', () => {
  const events = [
    { id: 'c1', session_id: 's1', ts: 100, type: 'click', severity: 'info', selector: 'button#submit' },
    { id: 'c2', session_id: 's1', ts: 400, type: 'click', severity: 'info', selector: 'button#submit' },
    { id: 'c3', session_id: 's1', ts: 800, type: 'click', severity: 'info', selector: 'button#submit' },
  ];

  const rage = detectRageClicks(events, 2000, 3);
  assert.strictEqual(rage.length, 1);
  assert.strictEqual(rage[0].id, 'c3');
});

test('Phase 1 - Signals: Full Cart Fixture (one click, two POSTs 7ms apart, cart count 0 to 2, no console error)', () => {
  const cartFixture = [
    {
      id: 'evt_click_0',
      session_id: 'ses_cart',
      ts: 1793520100000,
      type: 'click',
      severity: 'info',
      selector: 'button#add-to-cart',
      text: 'Add to Cart',
    },
    {
      id: 'evt_net_1',
      session_id: 'ses_cart',
      ts: 1793520100010,
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      status: 200,
      duration_ms: 65,
      shape: { itemId: 'number', qty: 'number' },
      fingerprint: computeFingerprint('POST', '/api/cart/add', { itemId: 'number', qty: 'number' }),
    },
    {
      id: 'evt_net_2',
      session_id: 'ses_cart',
      ts: 1793520100017, // 7ms apart
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      status: 200,
      duration_ms: 68,
      shape: { itemId: 'number', qty: 'number' },
      fingerprint: computeFingerprint('POST', '/api/cart/add', { itemId: 'number', qty: 'number' }),
    },
    {
      id: 'evt_dom_3',
      session_id: 'ses_cart',
      ts: 1793520100085,
      type: 'dom',
      severity: 'info',
      selector: '.cart-count',
      text: 'text_update: 2',
    },
    {
      id: 'evt_sig_4',
      session_id: 'ses_cart',
      ts: 1793520100090,
      type: 'signal',
      severity: 'warn',
      text: 'duplicate_request: POST /api/cart/add fired twice within 7ms',
    },
  ];

  // Verify duplicate request detection
  const duplicates = detectDuplicateRequests(cartFixture);
  assert.strictEqual(duplicates.length, 1);

  // Verify signal summary counts
  const summary = buildSignalSummary(cartFixture);
  assert.strictEqual(summary.duplicate_request_count, 1);
  assert.strictEqual(summary.error_count, 0, 'No console errors should exist in this bug');

  // Verify event ranking given note "problem in cart button"
  const ranked = rankEventsForMapper(cartFixture, 'problem in cart button', 'button#add-to-cart');
  assert.strictEqual(ranked[0].id, 'evt_sig_4', 'Duplicate signal ranks highest');
  assert.ok(ranked.some((e) => e.id === 'evt_net_1'));
  assert.ok(ranked.some((e) => e.id === 'evt_net_2'));
});

test('Phase 1 - Playwright: Synthesizes valid reproduction test script from evidence', () => {
  const report = {
    title: 'Cart counter increments by 2 instead of 1',
    expected: 'Cart counter should display 1',
    actual: 'Cart counter displays 2 due to duplicate POST request',
  };

  const evidence = [
    { id: 'e1', session_id: 's1', ts: 1000, type: 'click', severity: 'info', selector: 'button#add-to-cart' },
    { id: 'e2', session_id: 's1', ts: 1002, type: 'network', severity: 'info', url: 'http://localhost:4000/api/cart/add', method: 'POST' },
  ];

  const script = generatePlaywrightReproductionScript(report, evidence);
  assert.ok(script.includes("@playwright/test"));
  assert.ok(script.includes("page.locator('button#add-to-cart').click()"));
  assert.ok(script.includes("expect(requestCount).toBe(1)"));
});
