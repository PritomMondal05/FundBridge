import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'http://localhost:5000';

async function req(method, endpoint, body) {
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// 1. Health Check
test('GET /api/health - Server health check', async () => {
  const res = await req('GET', '/api/health');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.data || res.data.status !== 'healthy') throw new Error('Expected status: healthy');
});

// 2. Pending Campaigns for Admin Audit
test('GET /api/admin/campaigns/pending - Returns pending campaigns for audit', async () => {
  const res = await req('GET', '/api/admin/campaigns/pending');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of pending campaigns');
  if (res.data.length === 0) throw new Error('Expected at least 1 pending campaign in audit queue');
  const hasCloseGptOrSpaceY = res.data.some(c => c.title === 'CloseGPT' || c.title === 'SpaceY');
  if (!hasCloseGptOrSpaceY) throw new Error('Expected CloseGPT or SpaceY to appear in pending audit queue');
  const allUnverifiedOrPending = res.data.every(c => !c.verified || c.status === 'pending' || c.status === 'revisions' || c.status === 'revision_required' || c.status === 'rejected');
  if (!allUnverifiedOrPending) throw new Error('Pending queue contains verified campaigns');
});

// 3. Public Verified Campaigns
test('GET /api/campaigns - Returns only verified live campaigns', async () => {
  const res = await req('GET', '/api/campaigns');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of campaigns');
  const allVerified = res.data.every(c => c.verified === true || c.status === 'verified');
  if (!allVerified) throw new Error('Public catalog contains unverified campaigns');
});

// 4. Admin Stats
test('GET /api/admin/stats - Returns platform stats', async () => {
  const res = await req('GET', '/api/admin/stats');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (typeof res.data !== 'object' || res.data === null) throw new Error('Expected stats object');
});

// 5. Vetting Applicants
test('GET /api/vetting/applicants - Returns vetting applicants queue', async () => {
  const res = await req('GET', '/api/vetting/applicants');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of applicants');
});

// 6. Admin Escrow Pending
test('GET /api/admin/escrow/pending - Returns pending escrow tranches', async () => {
  const res = await req('GET', '/api/admin/escrow/pending');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of pending escrow tranches');
});

// 7. Admin Trash Database
test('GET /api/admin/trash - Returns trash database items', async () => {
  const res = await req('GET', '/api/admin/trash');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of trash items');
});

// 8. Notifications
test('GET /api/notifications?userId=usr_founder_1 - Requires user and returns notifications', async () => {
  const failRes = await req('GET', '/api/notifications');
  if (failRes.status !== 400) throw new Error(`Expected 400 without userId, got ${failRes.status}`);
  const okRes = await req('GET', '/api/notifications?userId=usr_founder_1');
  if (okRes.status !== 200) throw new Error(`Expected 200 with userId, got ${okRes.status}`);
  if (!Array.isArray(okRes.data)) throw new Error('Expected array of notifications');
});

// 9. Partnerships Access Control
test('Partnerships Security - Requires actorId and denies unauthorized actor', async () => {
  const dump = await req('GET', '/api/partnerships');
  if (dump.status !== 403) throw new Error(`Expected 403 for open dump, got ${dump.status}`);
  const noActor = await req('GET', '/api/partnerships/founder/usr_founder_1');
  if (noActor.status !== 403) throw new Error(`Expected 403 without actorId, got ${noActor.status}`);
  const wrongActor = await req('GET', '/api/partnerships/founder/usr_founder_1?actorId=usr_founder_2');
  if (wrongActor.status !== 403) throw new Error(`Expected 403 for wrong actorId, got ${wrongActor.status}`);
  const okActor = await req('GET', '/api/partnerships/founder/usr_founder_1?actorId=usr_founder_1');
  if (okActor.status !== 200) throw new Error(`Expected 200 for valid actorId, got ${okActor.status}`);
});

// 10. AI Matches
test('GET /api/ai/investor-matches/usr_investor_1 - Returns AI matches', async () => {
  const res = await req('GET', '/api/ai/investor-matches/usr_investor_1');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.data || !Array.isArray(res.data.matches)) throw new Error('Expected matches array');
});

// 11. Single Campaign by ID
test('GET /api/campaigns/:id - Returns detailed campaign object', async () => {
  const listRes = await req('GET', '/api/campaigns');
  if (listRes.ok && Array.isArray(listRes.data) && listRes.data.length > 0) {
    const sampleId = listRes.data[0].id || listRes.data[0]._id;
    const singleRes = await req('GET', `/api/campaigns/${sampleId}`);
    if (singleRes.status !== 200) throw new Error(`Expected 200, got ${singleRes.status}`);
    if (!singleRes.data || (singleRes.data.id !== sampleId && singleRes.data._id !== sampleId)) {
      throw new Error('Returned campaign ID did not match requested ID');
    }
  }
});

// 12. Relief Campaigns
test('GET /api/relief-drives - Returns relief campaigns list', async () => {
  const res = await req('GET', '/api/relief-drives');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of relief drives');
});

// 13. Disputes Queue & Resolution
test('GET /api/disputes - Returns populated disputes list', async () => {
  const res = await req('GET', '/api/disputes');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of disputes');
  if (res.data.length === 0) throw new Error('Expected at least one dispute row in the queue');
  const sample = res.data[0];
  if (!sample.id || !sample.issueType || !sample.complainant || !sample.reportedUser) {
    throw new Error('Dispute fields missing camelCase/snake_case mapping');
  }
});

// 14. Dispute Dismiss Action
test('POST /api/admin/disputes/:id/dismiss - Restores status without 404', async () => {
  const res = await req('POST', '/api/admin/disputes/CMP-867/dismiss', { adminNotes: 'Automated test dismissal' });
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.data.dispute || res.data.dispute.status !== 'Dismissed') {
    throw new Error('Expected dispute status to be Dismissed');
  }
});

// 15. Vetting Applicants
test('GET /api/vetting/applicants - Returns pending applicants', async () => {
  const res = await req('GET', '/api/vetting/applicants');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of vetting applicants');
});

// 16. Platform Audit Logs
test('GET /api/audit-logs - Returns populated audit ledger', async () => {
  const res = await req('GET', '/api/audit-logs');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data)) throw new Error('Expected array of audit logs');
  if (res.data.length === 0) throw new Error('Expected non-empty audit logs array');
});

// Run all tests
console.log(`\n========================================`);
console.log(`🚀 RUNNING FUNDBRIDGE AUTOMATED TEST SUITE`);
console.log(`========================================\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const t of tests) {
  try {
    await t.fn();
    console.log(`  ✅ PASS: ${t.name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${t.name} -> ${err.message}`);
    failed++;
    failures.push({ name: t.name, error: err.message });
  }
}

console.log(`\n========================================`);
console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
