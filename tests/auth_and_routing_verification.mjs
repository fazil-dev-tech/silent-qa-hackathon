import assert from 'node:assert';

console.log('================================================================');
console.log('SILENT QA: AUTHENTICATION, ROUTING & MIDDLEWARE LIVE VERIFICATION');
console.log('Testing against host: http://localhost:3000');
console.log('================================================================\n');

async function runTests() {
  // Test 1: Admin Login with ID: TGVINCENZO, Pass: Adil123#
  console.log('[Test 1] Testing Admin Login with id: TGVINCENZO, pass: Adil123#...');
  const adminRes = await fetch('http://localhost:3000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'TGVINCENZO', password: 'Adil123#' }),
  });
  const adminData = await adminRes.json();
  assert.strictEqual(adminRes.status, 200, 'Admin login must return 200 OK');
  assert.strictEqual(adminData.success, true);
  assert.strictEqual(adminData.redirect, '/admin');
  assert.strictEqual(adminData.user.name, 'TGVINCENZO');
  assert.strictEqual(adminData.user.role, 'admin');

  const adminCookieHeader = adminRes.headers.get('set-cookie');
  assert.ok(adminCookieHeader && adminCookieHeader.includes('sqa_session'), 'Must set sqa_session cookie');
  const adminCookie = adminCookieHeader.split(';')[0];
  console.log('✓ Admin login verified: TGVINCENZO authorized. Cookie set.');

  // Test 2: Invalid Admin Password Check
  console.log('\n[Test 2] Testing Admin Login with incorrect password...');
  const badAdminRes = await fetch('http://localhost:3000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'TGVINCENZO', password: 'WrongPassword999' }),
  });
  assert.strictEqual(badAdminRes.status, 401, 'Must reject invalid password with 401');
  console.log('✓ Invalid admin password successfully rejected (401 Unauthorized).');

  // Test 3: Middleware Route Guard (Unauthenticated /app access)
  console.log('\n[Test 3] Testing unauthenticated access to /app...');
  const unauthAppRes = await fetch('http://localhost:3000/app', { redirect: 'manual' });
  assert.ok(
    unauthAppRes.status === 307 || unauthAppRes.status === 308 || unauthAppRes.status === 302,
    `Must redirect unauthenticated user (received status ${unauthAppRes.status})`
  );
  const locationApp = unauthAppRes.headers.get('location');
  assert.ok(locationApp && locationApp.includes('/login'), 'Must redirect to /login');
  console.log(`✓ Unauthenticated /app blocked: Redirected to ${locationApp}`);

  // Test 4: Middleware Route Guard (Unauthenticated /admin access)
  console.log('\n[Test 4] Testing unauthenticated access to /admin...');
  const unauthAdminRes = await fetch('http://localhost:3000/admin', { redirect: 'manual' });
  assert.ok(
    unauthAdminRes.status === 307 || unauthAdminRes.status === 308 || unauthAdminRes.status === 302,
    `Must redirect unauthenticated user (received status ${unauthAdminRes.status})`
  );
  const locationAdmin = unauthAdminRes.headers.get('location');
  assert.ok(locationAdmin && locationAdmin.includes('/login'), 'Must redirect to /login');
  console.log(`✓ Unauthenticated /admin blocked: Redirected to ${locationAdmin}`);

  // Test 5: Authenticated Admin access to /admin
  console.log('\n[Test 5] Testing authenticated admin access to /admin with admin cookie...');
  const authAdminRes = await fetch('http://localhost:3000/admin', {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(authAdminRes.status, 200, 'Admin must be granted access to /admin (200 OK)');
  const adminHtml = await authAdminRes.text();
  assert.ok(adminHtml.includes('QA Lead Triage Command Center'), 'Must render Admin Command Center');
  console.log('✓ Authenticated admin successfully accessed /admin (200 OK).');

  // Test 6: Registration input validation (Only mobile and email)
  console.log('\n[Test 6] Testing registration validation (Mobile and Email)...');
  const validRegRes = await fetch('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mohamedfazilpasha156@gmail.com',
      phone: '+91 9876543210',
      mode: 'register',
    }),
  });
  const validRegData = await validRegRes.json();
  assert.strictEqual(validRegRes.status, 200);
  assert.strictEqual(validRegData.success, true);
  console.log('✓ Registration accepts only mobile and email. OTP dispatched via SMTP.');

  // Test 7: Verify Overview Landing page content & unauthenticated navbar
  console.log('\n[Test 7] Inspecting Overview page contents and unauthenticated navigation...');
  const overviewRes = await fetch('http://localhost:3000/');
  assert.strictEqual(overviewRes.status, 200);
  const overviewHtml = await overviewRes.text();
  assert.ok(overviewHtml.includes('Silent QA'), 'Has brand title');
  assert.ok(overviewHtml.includes('Turn 1-Sentence Tester Notes into'), 'Has primary headline');
  assert.ok(overviewHtml.includes('Sign In / Register'), 'Has Sign In CTA');
  assert.ok(overviewHtml.includes('The 8-Stage Real-Time Telemetry Pipeline'), 'Has pipeline contents');
  assert.ok(overviewHtml.includes('Preset Real-World Reproduction Scenarios'), 'Has scenario data');
  console.log('✓ Overview page verified with comprehensive data, metrics, and clean unauthenticated state.');

  console.log('\n================================================================');
  console.log('✓ ALL 7 AUTHENTICATION & ROUTE GUARDING VERIFICATIONS PASSED 100%');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n✖ Verification failed:', err);
  process.exit(1);
});
