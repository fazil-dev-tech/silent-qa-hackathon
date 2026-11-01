import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runFleetVerification() {
  console.log('--- 1. Simulating 3 Concurrent Engineers on Distinct Workstations ---');

  const now = Date.now();
  const engineers = [
    {
      name: 'Engineer #1 - Alex',
      device: 'Station-01 (Win Chrome)',
      session_id: '11111111-1111-4111-a111-111111111111',
      selector: 'button#checkout',
      note: 'checkout button returned 500 server error',
      recent_event_id: 'evt_alex_500',
      events: [
        {
          id: 'evt_alex_click',
          session_id: '11111111-1111-4111-a111-111111111111',
          ts: now - 200,
          type: 'click',
          severity: 'info',
          selector: 'button#checkout',
          text: 'Proceed to Checkout',
        },
        {
          id: 'evt_alex_500',
          session_id: '11111111-1111-4111-a111-111111111111',
          ts: now - 150,
          type: 'network',
          severity: 'error',
          url: '/api/checkout/pay',
          method: 'POST',
          status: 500,
        },
      ],
    },
    {
      name: 'Engineer #2 - Sarah',
      device: 'Station-02 (MacBook Pro)',
      session_id: '22222222-2222-4222-a222-222222222222',
      selector: 'input#search-query',
      note: 'search input freezes when typing fast',
      recent_event_id: 'evt_sarah_input',
      events: [
        {
          id: 'evt_sarah_input',
          session_id: '22222222-2222-4222-a222-222222222222',
          ts: now - 180,
          type: 'input',
          severity: 'info',
          selector: 'input#search-query',
          text: 'input_change: silent qa',
        },
        {
          id: 'evt_sarah_dead',
          session_id: '22222222-2222-4222-a222-222222222222',
          ts: now - 120,
          type: 'signal',
          severity: 'warn',
          text: 'dead_click: Click on input#search-query produced no DOM update',
          selector: 'input#search-query',
        },
      ],
    },
    {
      name: 'Engineer #3 - David',
      device: 'Station-03 (Ubuntu Linux)',
      session_id: '33333333-3333-4333-a333-333333333333',
      selector: 'button.save-draft-btn',
      note: 'save draft button not responding to multiple clicks',
      recent_event_id: 'evt_david_rage',
      events: [
        {
          id: 'evt_david_c1',
          session_id: '33333333-3333-4333-a333-333333333333',
          ts: now - 300,
          type: 'click',
          severity: 'info',
          selector: 'button.save-draft-btn',
          text: 'Save Draft',
        },
        {
          id: 'evt_david_rage',
          session_id: '33333333-3333-4333-a333-333333333333',
          ts: now - 100,
          type: 'signal',
          severity: 'warn',
          text: 'rage_click: 3+ clicks on button.save-draft-btn within 2s',
          selector: 'button.save-draft-btn',
        },
      ],
    },
  ];

  // 1. Ingest telemetry concurrently for all 3 engineers
  console.log('Ingesting telemetry batches with tester attribution...');
  for (const eng of engineers) {
    const res = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_token: 'sqa_live_demo_key_2026',
        session_id: eng.session_id,
        tester_name: eng.name,
        device_tag: eng.device,
        events: eng.events,
      }),
    });

    assert.strictEqual(res.status, 200, `Ingest for ${eng.name} should return 200`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    console.log(`✓ ${eng.name} (${eng.device}): Ingested ${json.ingested_count} events into Supabase`);
  }

  // 2. Submit Complaints with 1-Click Anomaly Mapping
  console.log('\n--- 2. Submitting Complaints with Mapped Anomaly Events ---');
  const createdReports = [];

  for (const eng of engineers) {
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: eng.session_id,
        note: eng.note,
        picked_selector: eng.selector,
        tester_name: eng.name,
        device_tag: eng.device,
        recent_event_id: eng.recent_event_id,
        submitted_at: Date.now(),
      }),
    });

    assert.strictEqual(res.status, 200, `Complaint for ${eng.name} should return 200`);
    const json = await res.json();
    assert.ok(json.report, 'Report should be synthesized');
    assert.ok(json.report.steps[0].includes(eng.name), `Report step 0 should attribute ${eng.name}`);
    createdReports.push(json.report);
    console.log(`✓ Defect Report created for ${eng.name}:`);
    console.log(`   ID: ${json.report.id}`);
    console.log(`   Title: ${json.report.title}`);
    console.log(`   Attribution: ${json.report.steps[0]}`);
  }

  // 3. Verify Recent Reports API returns tester attribution
  console.log('\n--- 3. Verifying GET /api/reports/recent Enriches Multi-Tester Attribution ---');
  const recentRes = await fetch(`${BASE_URL}/api/reports/recent`);
  assert.strictEqual(recentRes.status, 200);
  const recentJson = await recentRes.json();
  assert.ok(Array.isArray(recentJson.reports));
  assert.ok(recentJson.reports.length >= 3);

  const topReport = recentJson.reports[0];
  assert.ok(topReport.tester_name, 'topReport should have tester_name');
  assert.ok(topReport.device_tag, 'topReport should have device_tag');
  console.log(`✓ Top recent report: "${topReport.title}"`);
  console.log(`   Tester: ${topReport.tester_name} • Workstation: ${topReport.device_tag}`);

  // 4. Verify Admin Command Center Authentication & Access
  console.log('\n--- 4. Verifying Admin Authentication with TGVINCENZO ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'TGVINCENZO', password: 'Adil123#' }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginCookie = loginRes.headers.get('set-cookie');
  assert.ok(loginCookie && loginCookie.includes('sqa_session'));
  console.log('✓ Admin login successful with TGVINCENZO / Adil123#');

  // Verify Admin Users API
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: loginCookie },
  });
  assert.strictEqual(usersRes.status, 200);
  const usersJson = await usersRes.json();
  assert.ok(Array.isArray(usersJson.users));
  // Ensure no raw emails leaked
  for (const u of usersJson.users) {
    assert.strictEqual(u.email, undefined, 'User email should not be exposed');
  }
  console.log(`✓ Admin user administration verified (${usersJson.users.length} active users, 0 emails leaked)`);

  console.log('\n======================================================');
  console.log('✓ ALL MULTI-TESTER FLEET & EXTENSION CHECKS PASSED 100%');
  console.log('======================================================');
}

runFleetVerification().catch((err) => {
  console.error('Fleet verification failed:', err);
  process.exit(1);
});

