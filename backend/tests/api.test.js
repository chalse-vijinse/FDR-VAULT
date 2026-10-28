import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- Starting SecureFDR Automated Test Suite ---');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health check
  await test('Backend Health Check', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'UP');
  });

  // 2. Login works with valid credentials
  let adminToken = '';
  let officerToken = '';
  let instToken = '';

  await test('Login works with valid Super Admin credentials', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@securefdr.gov.in', password: 'Admin@123' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.role, 'SUPER_ADMIN');
    adminToken = res.data.token;
  });

  await test('Login works for Verification Officer', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'officer.sharma@securefdr.gov.in', password: 'Officer@123' })
    });
    assert.strictEqual(res.status, 200);
    officerToken = res.data.token;
  });

  await test('Login works for Institution Admin', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@iitdelhi.ac.in', password: 'Inst@123' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'INSTITUTION_ADMIN');
    instToken = res.data.token;
  });

  // 3. Invalid credentials rejected
  await test('Invalid credentials are rejected with 401', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@securefdr.gov.in', password: 'WrongPassword999' })
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // 4. Role restrictions: Institution Admin cannot access Super Admin endpoints
  await test('Institution Admin blocked from accessing Super Admin user management', async () => {
    const res = await request('/users', {
      headers: { Authorization: `Bearer ${instToken}` }
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.success, false);
  });

  // 5. Institution Data Isolation: Institution Admin only sees own FDR records
  await test('Institution Admin only sees own FDR records', async () => {
    const res = await request('/fdr', {
      headers: { Authorization: `Bearer ${instToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    // Verify no records from another institution are returned
    for (const item of res.data.data) {
      assert.strictEqual(item.institution_name, 'Delhi Institute of Advanced Engineering & Technology');
    }
  });

  // 6. FDR Validation: Invalid dates (maturity before issue) rejected
  await test('FDR creation rejects maturity date preceding issue date', async () => {
    const res = await request('/fdr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        record_type: 'Fixed Deposit Receipt',
        deposit_amount: 1000000,
        issue_date: '2026-05-01',
        maturity_date: '2025-05-01', // Invalid!
        deposit_holder_name: 'IIT Delhi AICTE Joint Account',
        deposit_purpose: 'New Lab Security Deposit'
      })
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  // 7. FDR Creation: Valid record created in Draft status
  let newFdrId = null;
  await test('FDR record can be created in Draft status', async () => {
    const res = await request('/fdr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        record_type: 'Fixed Deposit Receipt',
        fdr_number: `FDR-TEST-${Date.now()}`,
        bank_name: 'State Bank of India',
        deposit_amount: 1500000,
        issue_date: '2026-01-01',
        maturity_date: '2031-01-01',
        deposit_holder_name: 'IIT Delhi AICTE Joint Account',
        deposit_purpose: 'New Data Science Department Approval'
      })
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.fdrId);
    newFdrId = res.data.fdrId;
  });

  // 8. Documents require authentication
  await test('Document download requires authentication', async () => {
    const res = await request('/documents/1');
    assert.strictEqual(res.status, 401);
  });

  // 9. Unauthorized users cannot approve their own submissions
  await test('Institution Admin cannot record verification decision on FDR', async () => {
    const res = await request(`/verifications/${newFdrId}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instToken}` },
      body: JSON.stringify({
        decision: 'Verified',
        findings: 'Self approval attempt'
      })
    });
    assert.strictEqual(res.status, 403);
  });

  // 10. Dashboard statistics are calculated from database
  await test('Dashboard statistics are calculated from live database', async () => {
    const res = await request('/reports/dashboard-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.stats.totalInstitutions > 0);
    assert.ok(res.data.stats.totalFdrs > 0);
    assert.ok(Number(res.data.stats.totalDepositValue) > 0);
  });

  // 11. Audit logs are created and retrievable
  await test('Audit logs are created and retrievable by Super Admin', async () => {
    const res = await request('/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  console.log(`\n--- Test Suite Summary: ${passed}/${total} Tests Passed ---`);
  if (passed === total) {
    console.log('ALL ACCEPTANCE CRITERIA TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch(console.error);
