const base = 'http://localhost:5000';

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

const results = {};

results.health = await req('GET', '/api/health');
results.partnershipsDump = await req('GET', '/api/partnerships');
results.founderNoActor = await req('GET', '/api/partnerships/founder/usr_founder_1');
results.founderOk = await req('GET', '/api/partnerships/founder/usr_founder_1?actorId=usr_founder_1');
results.founderWrongActor = await req('GET', '/api/partnerships/founder/usr_founder_1?actorId=usr_founder_2');
results.investorOk = await req('GET', '/api/partnerships/investor/usr_investor_1?actorId=usr_investor_1');
results.detailWrong = await req('GET', '/api/partnerships/part_alphav_01?actorId=usr_investor_2');
results.detailOk = await req('GET', '/api/partnerships/part_alphav_01?actorId=usr_investor_1');
results.founderRelease = await req('POST', '/api/partnerships/part_alphav_01/milestones/phase_2/release', { actorId: 'usr_founder_1' });
results.notifNone = await req('GET', '/api/notifications');
results.notifFounder = await req('GET', '/api/notifications?userId=usr_founder_1');
results.aiMatch = await req('GET', '/api/ai/investor-matches/usr_investor_1');
results.whatsBurning = await req('GET', '/api/ai/whats-burning?investorId=usr_investor_1');
results.founderBio = await req('POST', '/api/ai/founder/bio/generate', { founderId: 'usr_founder_1', name: 'Ashraf Khan' });

const founderList = Array.isArray(results.founderOk.json) ? results.founderOk.json : [];
const tx = results.detailOk.json || founderList[0] || {};
const ms = (tx.milestones || []).map((m) => ({ id: m.id, status: m.status, name: m.name || m.title }));

console.log(JSON.stringify({
  health: { status: results.health.status, json: results.health.json },
  partnershipsDump: { status: results.partnershipsDump.status, error: results.partnershipsDump.json?.error },
  founderNoActor: { status: results.founderNoActor.status, error: results.founderNoActor.json?.error },
  founderOk: { status: results.founderOk.status, count: founderList.length, titles: founderList.map((p) => p.campaign_title) },
  founderWrongActor: { status: results.founderWrongActor.status, error: results.founderWrongActor.json?.error },
  investorOk: { status: results.investorOk.status, count: Array.isArray(results.investorOk.json) ? results.investorOk.json.length : 0 },
  detailWrong: { status: results.detailWrong.status, error: results.detailWrong.json?.error },
  detailOk: {
    status: results.detailOk.status,
    title: tx.campaign_title,
    progress: tx.overall_progress,
    released: tx.amount_released,
    remaining: tx.remaining_investment,
    current: tx.current_milestone?.name || tx.current_milestone?.title,
    nextFounder: tx.next_action_founder,
    nextInvestor: tx.next_action_investor,
    frozen: tx.frozen,
    milestones: ms
  },
  founderRelease: { status: results.founderRelease.status, error: results.founderRelease.json?.error },
  notifNone: { status: results.notifNone.status, error: results.notifNone.json?.error },
  notifFounder: { status: results.notifFounder.status, count: Array.isArray(results.notifFounder.json) ? results.notifFounder.json.length : 0 },
  aiMatch: { status: results.aiMatch.status, count: results.aiMatch.json?.matches?.length, source: results.aiMatch.json?.source },
  whatsBurning: { status: results.whatsBurning.status, trendStatus: results.whatsBurning.json?.status, count: results.whatsBurning.json?.trends?.length, source: results.whatsBurning.json?.source },
  founderBio: { status: results.founderBio.status, error: results.founderBio.json?.error, hasContent: Boolean(results.founderBio.json?.content) }
}, null, 2));

const checks = {
  health200: results.health.status === 200,
  dump403: results.partnershipsDump.status === 403,
  founderActorRequired: results.founderNoActor.status === 403,
  founderListOk: results.founderOk.status === 200 && founderList.length > 0,
  otherFounderDenied: results.founderWrongActor.status === 403,
  investorListOk: results.investorOk.status === 200,
  otherInvestorDetailDenied: results.detailWrong.status === 403,
  founderCannotRelease: results.founderRelease.status === 403,
  notifRequiresUser: results.notifNone.status === 400,
  aiMatchOk: results.aiMatch.status === 200 && (results.aiMatch.json?.matches?.length || 0) > 0,
  whatsBurningOk: results.whatsBurning.status === 200
};
console.log('CHECKS', checks);
const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.error('FAILED', failed);
  process.exit(1);
}
console.log('LIVE_API_VERIFY_OK');
