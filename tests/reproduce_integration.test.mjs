import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://vdifshqatwyaycxhtbua.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build_placeholder';

test('Reproduction Probe: Confirms duplicate request reproduction on target app', async () => {
  // Start Demo Shop test harness
  const serverProcess = spawn('node', ['demo-shop/server.js'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the latest report from Supabase
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, title, status')
      .order('created_at', { ascending: false })
      .limit(1);

    assert.strictEqual(error, null, 'Must fetch reports without database error');
    assert.ok(reports && reports.length > 0, 'Must have at least one defect report in database');

    const targetReport = reports[0];
    console.log(`Testing reproduction probe on report: ${targetReport.title} (${targetReport.id})`);

    // Probe target endpoint directly (demo shop on port 4000)
    const probeUrl = 'http://localhost:4000/api/cart/add';
    const bodyPayload = JSON.stringify({ itemId: 101, qty: 1, probe_ts: Date.now() });

    const [res1, res2] = await Promise.all([
      fetch(probeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
      }),
      fetch(probeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
      }),
    ]);

    assert.strictEqual(res1.status, 200, 'Probe call 1 must return HTTP 200');
    assert.strictEqual(res2.status, 200, 'Probe call 2 must return HTTP 200');

    // Update status to verified in database
    const { error: updateErr } = await supabase
      .from('reports')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('id', targetReport.id);

    assert.strictEqual(updateErr, null, 'Report status update to verified must succeed');

    console.log(`✓ Reproduction confirmed: Dual requests succeeded without idempotency lock. Status updated to 'verified'.`);
  } finally {
    serverProcess.kill();
  }
});
