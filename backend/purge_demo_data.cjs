/**
 * Trim local demo data to:
 * - 10 founders, 10 investors, 2 admins
 * - 10 campaigns (one per kept founder)
 * - Ashraf-owned activity only where it belongs (CampusBites, Nepal relief, his wallet)
 * - No cross-founder junk / test campaigns / orphan wallets
 *
 * Run: node purge_demo_data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const KEEP_FOUNDERS = Array.from({ length: 10 }, (_, i) => `usr_founder_${i + 1}`);
const KEEP_INVESTORS = Array.from({ length: 10 }, (_, i) => `usr_investor_${i + 1}`);
const KEEP_CAMPAIGN_IDS = new Set([
  'campusbites_1',
  'agrisensebd_2',
  'skillcrafthub_3',
  'ecopackdhaka_4',
  'finflex_5',
  'healthconnect_6',
  'shuttlexpress_7',
  'smartcart_8',
  'urbanloop_9',
  'biopolymer_10'
]);
const KEEP_USERS = new Set([...KEEP_FOUNDERS, ...KEEP_INVESTORS, 'usr_admin_1', 'usr_admin_2']);

const readJson = (file, fallback) => {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('read fail', file, e.message);
    return fallback;
  }
};

const writeJson = (file, data) => {
  const p = path.join(ROOT, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log('wrote', file);
};

// --- seed_generated.json ---
const seed = readJson('seed_generated.json', { founders: [], investors: [], campaigns: [] });
const founders = (seed.founders || []).filter((u) => KEEP_FOUNDERS.includes(String(u.id || u._id)));
const investors = (seed.investors || []).filter((u) => KEEP_INVESTORS.includes(String(u.id || u._id)));
let campaigns = (seed.campaigns || []).filter((c) => KEEP_CAMPAIGN_IDS.has(String(c.id || c._id)));

// Clean campaign ownership noise
campaigns = campaigns.map((c) => {
  const clean = { ...c };
  delete clean.coFounders;
  delete clean.co_founders;
  clean.successorName = clean.successor_name = '';
  clean.successorEmail = clean.successor_email = '';
  // Keep seed raised figures per founder only (no shared Ashraf overlay)
  return clean;
});

const admins = [
  {
    _id: 'usr_admin_1',
    id: 'usr_admin_1',
    name: 'ADMIN_PRITOM',
    email: 'admin@fundbridge.com',
    password: 'admin123',
    role: 'admin',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    mfsNumber: '01799999999'
  },
  {
    _id: 'usr_admin_2',
    id: 'usr_admin_2',
    name: 'ADMIN_SUPPORT',
    email: 'admin2@fundbridge.com',
    password: 'admin123',
    role: 'admin',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    mfsNumber: '01788888888'
  }
];

writeJson('seed_generated.json', {
  founders,
  investors,
  admins,
  campaigns,
  meta: {
    purged_at: new Date().toISOString(),
    keep_founders: KEEP_FOUNDERS.length,
    keep_investors: KEEP_INVESTORS.length,
    keep_admins: 2,
    keep_campaigns: campaigns.length,
    note: 'Isolated demo set — each founder owns exactly one startup campaign.'
  }
});

// --- s3_campaign_store.json: only the 10 clean campaigns ---
writeJson('s3_campaign_store.json', campaigns);

// --- founder wallets: only Ashraf's CampusBites / relief activity ---
const wallets = readJson('s3_founder_wallets.json', {});
const ashrafWallet = wallets.usr_founder_1 || { balance: 0, ledger: [], investment_inflows: [] };
const cleanLedger = (Array.isArray(ashrafWallet.ledger) ? ashrafWallet.ledger : []).filter((row) => {
  const cid = String(row.campaign_id || '');
  const fid = String(row.investor_id || '');
  // keep rows about Ashraf's own campaigns/relief or personal security/top-up
  if (!cid) return true;
  if (cid === 'campusbites_1' || cid.startsWith('relief_')) return true;
  if (KEEP_CAMPAIGN_IDS.has(cid) && cid !== 'campusbites_1') return false;
  if (fid && !KEEP_USERS.has(fid) && fid !== '') return false;
  return true;
});
const cleanInflows = (Array.isArray(ashrafWallet.investment_inflows) ? ashrafWallet.investment_inflows : [])
  .filter((row) => String(row.campaign_id || '') === 'campusbites_1' || !row.campaign_id);

const balFromLedger = cleanLedger.reduce((sum, row) => {
  const amt = Number(row.amount || 0);
  return String(row.direction) === 'out' ? sum - amt : sum + amt;
}, 0);

writeJson('s3_founder_wallets.json', {
  usr_founder_1: {
    balance: Math.max(0, balFromLedger),
    ledger: cleanLedger,
    investment_inflows: cleanInflows,
    note: 'Ashraf only — other founders start with empty wallets.'
  }
});

// --- investor wallets: investor 1 only ---
const invWallets = readJson('s3_investor_wallets.json', {});
writeJson('s3_investor_wallets.json', invWallets.usr_investor_1
  ? { usr_investor_1: invWallets.usr_investor_1 }
  : {});

// --- proposals: CampusBites / Ashraf / investor_1 only ---
const proposals = readJson('s3_proposals.json', []);
writeJson(
  's3_proposals.json',
  (Array.isArray(proposals) ? proposals : []).filter(
    (p) =>
      String(p.founder_id || p.founderId) === 'usr_founder_1' &&
      String(p.campaign_id || p.campaignId) === 'campusbites_1' &&
      KEEP_INVESTORS.includes(String(p.investor_id || p.investorId))
  )
);

// --- relief: Ashraf's Nepal drive only ---
const relief = readJson('s3_relief_store.json', []);
const keptRelief = (Array.isArray(relief) ? relief : []).filter(
  (d) => String(d.founder_id || d.founderId) === 'usr_founder_1'
).map((d) => {
  const clean = { ...d };
  delete clean.coFounders;
  delete clean.co_founders;
  clean.successorName = clean.successor_name = '';
  clean.successorEmail = clean.successor_email = '';
  return clean;
});
writeJson('s3_relief_store.json', keptRelief);
const reliefIds = new Set(keptRelief.map((d) => String(d.id || d._id)));

const donations = readJson('s3_relief_donations.json', []);
writeJson(
  's3_relief_donations.json',
  (Array.isArray(donations) ? donations : []).filter((d) => {
    const driveOk = reliefIds.has(String(d.drive_id || d.relief_id || d.campaign_id || d.relief_drive_id));
    if (!driveOk) return false;
    const actor = String(d.investor_id || d.donor_id || d.user_id || d.founder_id || '');
    return !actor || KEEP_USERS.has(actor);
  })
);

// --- audit logs ---
const audits = readJson('s3_audit_logs.json', []);
writeJson(
  's3_audit_logs.json',
  (Array.isArray(audits) ? audits : []).filter((a) => KEEP_USERS.has(String(a.user_id || a.founder_id || a.actor_id)))
);

// --- messages ---
const messages = readJson('s3_messages.json', []);
writeJson(
  's3_messages.json',
  (Array.isArray(messages) ? messages : []).filter((m) => {
    const s = String(m.sender_id || m.senderId || '');
    const r = String(m.receiver_id || m.receiverId || '');
    return KEEP_USERS.has(s) && KEEP_USERS.has(r);
  })
);

// --- security deposits: Ashraf only ---
const sec = readJson('s3_security_deposits.json', {});
if (Array.isArray(sec)) {
  writeJson('s3_security_deposits.json', sec.filter((d) => String(d.founder_id) === 'usr_founder_1'));
} else if (sec && typeof sec === 'object') {
  writeJson(
    's3_security_deposits.json',
    sec.usr_founder_1 ? { usr_founder_1: sec.usr_founder_1 } : {}
  );
} else {
  writeJson('s3_security_deposits.json', {});
}

// --- wallet deposits ---
const deps = readJson('s3_wallet_deposits.json', []);
writeJson(
  's3_wallet_deposits.json',
  (Array.isArray(deps) ? deps : []).filter((d) => {
    const fid = String(d.founder_id || '');
    const iid = String(d.investor_id || d.owner_id || '');
    return KEEP_USERS.has(fid) || KEEP_USERS.has(iid);
  })
);

// --- edit requests / updates / cofounder apps ---
const edits = readJson('s3_edit_requests.json', []);
writeJson(
  's3_edit_requests.json',
  (Array.isArray(edits) ? edits : []).filter((e) => String(e.founder_id || e.owner_id) === 'usr_founder_1')
);

const updates = readJson('s3_campaign_updates.json', []);
writeJson(
  's3_campaign_updates.json',
  (Array.isArray(updates) ? updates : []).filter(
    (u) => String(u.founder_id) === 'usr_founder_1' && String(u.campaign_id) === 'campusbites_1'
  )
);

// Clear cross-campaign cofounder applications (were testing noise)
writeJson('s3_cofounder_applications.json', []);

// Optional empty stores
for (const emptyFile of ['s3_handover_requests.json', 's3_progress_tags.json', 's3_payouts.json']) {
  if (fs.existsSync(path.join(ROOT, emptyFile))) {
    const cur = readJson(emptyFile, []);
    if (Array.isArray(cur)) writeJson(emptyFile, []);
  }
}

console.log('\nPurge complete.');
console.log(`Founders: ${founders.length}, Investors: ${investors.length}, Admins: 2, Campaigns: ${campaigns.length}`);
console.log('Restart the backend so in-memory stores reload from disk.');
