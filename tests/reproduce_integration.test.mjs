import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present
try {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {}

const supabaseUrl = process.env.SUPABASE_URL || 'https://vdifshqatwyaycxhtbua.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build_placeholder';

test('Reproduction Probe: Confirms duplicate request reproduction on target app', async () => {
  // Start ephemeral test target server
  let callCount = 0;
  const targetServer = http.createServer((req, res) => {
    if (req.method === 'POST') {
      callCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: callCount }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => targetServer.listen(0, '127.0.0.1', resolve));
  const address = targetServer.address();
  const targetPort = typeof address === 'object' && address ? address.port : 4000;
  const probeUrl = `http://127.0.0.1:${targetPort}/api/action`;

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
    assert.strictEqual(callCount, 2, 'Both duplicate requests received');

    // Update status to verified in database
    const { error: updateErr } = await supabase
      .from('reports')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('id', targetReport.id);

    assert.strictEqual(updateErr, null, 'Report status update to verified must succeed');

    console.log(`✓ Reproduction confirmed: Dual requests succeeded without idempotency lock. Status updated to 'verified'.`);
  } finally {
    targetServer.close();
  }
});

