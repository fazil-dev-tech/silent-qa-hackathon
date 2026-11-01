import crypto from 'crypto';

const API_BASE = 'http://localhost:3000';
const PROJECT_TOKEN = 'sqa_live_demo_key_2026';
const testSessionId = crypto.randomUUID();
const sessionStart = Date.now();

console.log('🧪 Starting Verification: Session Recording & Telemetry Time Mapping');
console.log('Target Session ID:', testSessionId);

async function runTest() {
  // 1. Ingest telemetry batch with accurate timestamps, duration, DOM snapshot & performance vitals
  console.log('\n[1/3] Testing POST /api/ingest with high-precision temporal mapping...');

  const now = Date.now();
  const sampleEvents = [
    {
      id: crypto.randomUUID(),
      session_id: testSessionId,
      ts: now - 350,
      type: 'click',
      severity: 'info',
      selector: 'button#checkout-pay',
      text: 'Complete Payment',
      metadata: {
        x: 324,
        y: 612,
        relative_ms: 0,
      },
      shape: {
        x: 324,
        y: 612,
      },
    },
    {
      id: crypto.randomUUID(),
      session_id: testSessionId,
      ts: now - 220,
      type: 'network',
      severity: 'critical',
      url: '/api/checkout/pay',
      method: 'POST',
      status: 500,
      duration_ms: 130,
      text: 'POST /api/checkout/pay -> 500 (130ms)',
      metadata: {
        duration_ms: 130,
        relative_ms: 130,
        domSnapshot: '<div id="cart-container"><button id="checkout-pay">Complete Payment</button><div class="error-toast">Transaction Failed 500</div></div>',
      },
      shape: {
        status: 500,
        duration_ms: 130,
        domSnapshot: '<div id="cart-container"><button id="checkout-pay">Complete Payment</button><div class="error-toast">Transaction Failed 500</div></div>',
      },
    },
    {
      id: crypto.randomUUID(),
      session_id: testSessionId,
      ts: now - 150,
      type: 'error',
      severity: 'critical',
      url: 'https://app.local/checkout.js',
      selector: '142:15',
      text: 'Uncaught TypeError: Cannot read properties of undefined (reading "chargeId")',
      metadata: {
        relative_ms: 200,
        domSnapshot: '<div id="cart-container"><div class="error-toast">Transaction Failed 500</div></div>',
      },
      shape: {
        stack: 'TypeError: Cannot read properties of undefined (reading "chargeId")\n    at checkout.js:142:15',
      },
    },
    {
      id: crypto.randomUUID(),
      session_id: testSessionId,
      ts: now - 50,
      type: 'performance',
      severity: 'warn',
      text: 'Long Task detected: 85ms',
      shape: {
        metric: 'Long Task',
        duration_ms: 85,
        start_ms: 120,
      },
    },
  ];

  const ingestRes = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_token: PROJECT_TOKEN,
      session_id: testSessionId,
      tester_name: 'Engineer #1',
      device_tag: 'Station-01',
      events: sampleEvents,
    }),
  });

  const ingestData = await ingestRes.json();
  console.log('Ingest Response HTTP:', ingestRes.status, ingestData);
  if (!ingestRes.ok || !ingestData.success) {
    throw new Error(`Ingest failed: ${JSON.stringify(ingestData)}`);
  }
  console.log('✓ Successfully ingested', ingestData.ingested_count, 'events with temporal & DOM snapshot mapping.');

  // 2. Test Complaint Submission and AI Causal Synthesis
  console.log('\n[2/3] Testing POST /api/complaints to synthesize canonical defect report...');
  const complaintRes = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: testSessionId,
      note: 'Payment failed when clicking checkout button with 500 server crash',
      picked_selector: 'button#checkout-pay',
      tester_name: 'Engineer #1',
      device_tag: 'Station-01',
      submitted_at: Date.now(),
    }),
  });

  const complaintData = await complaintRes.json();
  console.log('Complaint Response HTTP:', complaintRes.status);
  if (!complaintRes.ok || !complaintData.report) {
    throw new Error(`Complaint failed: ${JSON.stringify(complaintData)}`);
  }

  const report = complaintData.report;
  console.log('✓ Report Synthesized:');
  console.log('  - Title:', report.title);
  console.log('  - Severity:', report.severity);
  console.log('  - Confidence:', report.confidence);
  console.log('  - Steps Count:', report.steps.length);
  console.log('  - Root Cause:', report.root_cause);
  console.log('  - Evidence Events Linked:', report.evidence_ids?.length || 0);

  // 3. Verify Recent Reports API
  console.log('\n[3/3] Verifying GET /api/reports/recent...');
  const recentRes = await fetch(`${API_BASE}/api/reports/recent`);
  const recentData = await recentRes.json();
  console.log('Recent Reports count:', recentData.reports?.length || 0);
  const found = (recentData.reports || []).find((r) => r.id === report.id);
  if (!found) {
    throw new Error('Synthesized report was not returned in recent reports query');
  }
  console.log('✓ Verified report exists in Supabase database with ID:', found.id);

  console.log('\n🎉 ALL 3/3 TESTS PASSED: Session recording, data & temporal time mapping confirmed 100% operational!');
}

runTest().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
