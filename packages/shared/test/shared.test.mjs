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
  rankEventsForMapper,
} from '../src/signals.ts';
import {
  generatePlaywrightReproductionScript,
} from '../src/playwright.ts';

test('Scrubber: Validates Luhn credit card check', () => {
  assert.strictEqual(isValidLuhn('4532015112830366'), true); // Valid Visa format
  assert.strictEqual(isValidLuhn('4532015112830367'), false); // Invalid check digit
  assert.strictEqual(isValidLuhn('12345'), false); // Too short
});

test('Scrubber: Redacts emails, tokens, and PII', () => {
  const input = 'User test.user@example.com logged in with Bearer abc123def456 and card 4532015112830366';
  const scrubbed = scrubText(input);

  assert.ok(!scrubbed.includes('test.user@example.com'), 'Email should be redacted');
  assert.ok(scrubbed.includes('[EMAIL_REDACTED]'), 'Email replacement tag present');
  assert.ok(!scrubbed.includes('4532015112830366'), 'Card should be redacted');
  assert.ok(scrubbed.includes('[CARD_REDACTED]'), 'Card replacement tag present');
});

test('Scrubber: Extracts safe body shape without secret values', () => {
  const payload = {
    itemId: 101,
    quantity: 2,
    customer: {
      name: 'John Doe',
      password: 'superSecretPassword123!',
    },
  };

  const shape = extractBodyShape(payload);
  assert.strictEqual(shape.itemId, 'number');
  assert.strictEqual(shape.quantity, 'number');
  assert.strictEqual(shape.customer.name, 'string');
  assert.strictEqual(shape.customer.password, '[MASKED_KEY]');
});

test('Signals: Detects duplicate requests within threshold', () => {
  const events = [
    {
      id: 'e1',
      session_id: 's1',
      ts: 1000,
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      shape: { itemId: 'number', qty: 'number' },
    },
    {
      id: 'e2',
      session_id: 's1',
      ts: 1007, // 7ms later (exact demo-shop case)
      type: 'network',
      severity: 'info',
      url: '/api/cart/add',
      method: 'POST',
      shape: { itemId: 'number', qty: 'number' },
    },
  ];

  const duplicates = detectDuplicateRequests(events, 1000);
  assert.strictEqual(duplicates.length, 1);
  assert.strictEqual(duplicates[0].first.id, 'e1');
  assert.strictEqual(duplicates[0].duplicate.id, 'e2');
});

test('Signals: Ranks events prioritizing signals and keywords', () => {
  const events = [
    { id: 'e1', session_id: 's1', ts: 1000, type: 'click', severity: 'info', selector: 'div.banner' },
    { id: 'e2', session_id: 's1', ts: 1050, type: 'click', severity: 'info', selector: 'button#add-to-cart' },
    { id: 'e3', session_id: 's1', ts: 1055, type: 'signal', severity: 'warn', text: 'duplicate_request detected' },
  ];

  const ranked = rankEventsForMapper(events, 'problem in cart button', '#add-to-cart');
  assert.strictEqual(ranked[0].id, 'e3', 'Signal event should rank highest');
  assert.strictEqual(ranked[1].id, 'e2', 'Matching selector should rank second');
});

test('Playwright: Synthesizes valid reproduction test script', () => {
  const report = {
    title: 'Duplicate Add-to-cart request',
    expected: 'Cart counter increments by 1',
    actual: 'Cart counter jumps by 2',
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
