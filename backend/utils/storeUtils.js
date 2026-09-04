import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { getIO } from '../config/socket.js';
import { normalizeNotificationType } from '../lib/notificationTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.join(__dirname, '..');

// ============================================================================
// 1. IN-MEMORY STORES & PATH CONSTANTS
// ============================================================================
export const fallbackUsers = [];
export const fallbackCampaigns = [];
export const fallbackProposals = [];
export const fallbackPayouts = [];
export const fallbackDisputes = [];
export const fallbackAuditLogs = [];
export const fallbackMessages = [];
export const fallbackUpdates = [];
export const fallbackProgressTags = {};
export const fallbackSecurityDeposits = {};
export const fallbackWallets = {};
export const fallbackWalletDeposits = [];
export const fallbackInvestorWallets = {};
export const fallbackTrash = [];
export const fallbackWatchlist = [];
export const fallbackConnections = [];
export const fallbackBookmarkedFounders = [];
export const fallbackReliefDrives = [];
export const fallbackReliefDonations = [];
export const fallbackEditRequests = [];
export const fallbackHandoverRequests = [];
export const fallbackCoFounderApplications = [];

export const fallbackNotifications = [
  { id: 'notif_1', user_id: 'usr_founder_1', title: 'New Proposal Received', message: 'Angel Backer Zaman submitted an 8% Rev. Share proposal for CampusBites.', type: 'info', is_read: false, created_at: new Date().toISOString() },
  { id: 'notif_2', user_id: 'usr_investor_1', title: 'Vetting Verified', message: 'Your investor identity vetting has been approved by platform administration.', type: 'success', is_read: true, created_at: new Date().toISOString() }
];

const S3_CAMPAIGN_STORE_PATH = path.join(BACKEND_DIR, 's3_campaign_store.json');
const S3_EDIT_REQUEST_STORE_PATH = path.join(BACKEND_DIR, 's3_edit_requests.json');
const S3_HANDOVER_STORE_PATH = path.join(BACKEND_DIR, 's3_handover_requests.json');
const S3_COFOUNDER_APP_STORE_PATH = path.join(BACKEND_DIR, 's3_cofounder_applications.json');
const S3_PROPOSAL_STORE_PATH = path.join(BACKEND_DIR, 's3_proposals.json');
const S3_MESSAGE_STORE_PATH = path.join(BACKEND_DIR, 's3_messages.json');
const S3_NOTIFICATION_STORE_PATH = path.join(BACKEND_DIR, 's3_notifications.json');
const S3_AUDIT_STORE_PATH = path.join(BACKEND_DIR, 's3_audit_logs.json');
const S3_UPDATE_STORE_PATH = path.join(BACKEND_DIR, 's3_campaign_updates.json');
const S3_PROGRESS_TAG_STORE_PATH = path.join(BACKEND_DIR, 's3_progress_tags.json');
const S3_PAYOUT_STORE_PATH = path.join(BACKEND_DIR, 's3_payouts.json');
const S3_DEPOSIT_STORE_PATH = path.join(BACKEND_DIR, 's3_security_deposits.json');
const S3_WALLET_STORE_PATH = path.join(BACKEND_DIR, 's3_founder_wallets.json');
const S3_WALLET_DEPOSIT_STORE_PATH = path.join(BACKEND_DIR, 's3_wallet_deposits.json');
const S3_INVESTOR_WALLET_STORE_PATH = path.join(BACKEND_DIR, 's3_investor_wallets.json');
const S3_TRASH_STORE_PATH = path.join(BACKEND_DIR, 's3_trash_store.json');
const S3_DISPUTES_STORE_PATH = path.join(BACKEND_DIR, 's3_disputes.json');
const S3_RELIEF_STORE_PATH = path.join(BACKEND_DIR, 's3_relief_store.json');
const S3_RELIEF_DONATION_STORE_PATH = path.join(BACKEND_DIR, 's3_relief_donations.json');

// ============================================================================
// 2. INITIALIZE SEED DATA & ADMINS
// ============================================================================
try {
  const seedPath = path.join(BACKEND_DIR, 'seed_generated.json');
  if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedSeed = JSON.parse(rawData);
    if (Array.isArray(parsedSeed.founders)) fallbackUsers.push(...parsedSeed.founders);
    if (Array.isArray(parsedSeed.investors)) fallbackUsers.push(...parsedSeed.investors);
    if (Array.isArray(parsedSeed.admins)) fallbackUsers.push(...parsedSeed.admins);
    if (Array.isArray(parsedSeed.campaigns)) fallbackCampaigns.push(...parsedSeed.campaigns);
  }
} catch (e) {
  console.warn('Seed generated JSON read warning:', e.message);
}

export const ensureDefaultAdmins = () => {
  const defaults = [
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
  for (const admin of defaults) {
    if (!fallbackUsers.some((u) => String(u.email || '').toLowerCase() === admin.email)) {
      fallbackUsers.unshift(admin);
    }
  }
};
ensureDefaultAdmins();

// ============================================================================
// 3. STORE PERSISTENCE & LOAD HELPERS
// ============================================================================
export const loadS3CampaignStore = () => {
  try {
    if (!fs.existsSync(S3_CAMPAIGN_STORE_PATH)) return;
    const raw = fs.readFileSync(S3_CAMPAIGN_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const camp of parsed) {
      if (!camp || !(camp.id || camp._id)) continue;
      const id = camp.id || camp._id;
      const idx = fallbackCampaigns.findIndex((c) => c.id === id || c._id === id);
      if (idx >= 0) fallbackCampaigns[idx] = camp;
      else fallbackCampaigns.unshift(camp);
    }
  } catch (e) {
    console.warn('S3 campaign store load warning:', e.message);
  }
};
export const persistS3CampaignStore = () => {
  try {
    fs.writeFileSync(S3_CAMPAIGN_STORE_PATH, JSON.stringify(fallbackCampaigns, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 campaign store save warning:', e.message);
  }
};
loadS3CampaignStore();

export const loadS3EditRequestStore = () => {
  try {
    if (!fs.existsSync(S3_EDIT_REQUEST_STORE_PATH)) return;
    const raw = fs.readFileSync(S3_EDIT_REQUEST_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      fallbackEditRequests.length = 0;
      fallbackEditRequests.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 edit-request store load warning:', e.message);
  }
};
export const persistS3EditRequestStore = () => {
  try {
    fs.writeFileSync(S3_EDIT_REQUEST_STORE_PATH, JSON.stringify(fallbackEditRequests, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 edit-request store save warning:', e.message);
  }
};
loadS3EditRequestStore();

export const loadS3HandoverStore = () => {
  try {
    if (!fs.existsSync(S3_HANDOVER_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_HANDOVER_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackHandoverRequests.length = 0;
      fallbackHandoverRequests.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 handover store load warning:', e.message);
  }
};
export const persistS3HandoverStore = () => {
  try {
    fs.writeFileSync(S3_HANDOVER_STORE_PATH, JSON.stringify(fallbackHandoverRequests, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 handover store save warning:', e.message);
  }
};
loadS3HandoverStore();

export const loadS3CoFounderAppStore = () => {
  try {
    if (!fs.existsSync(S3_COFOUNDER_APP_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_COFOUNDER_APP_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackCoFounderApplications.length = 0;
      fallbackCoFounderApplications.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 co-founder application store load warning:', e.message);
  }
};
export const persistS3CoFounderAppStore = () => {
  try {
    fs.writeFileSync(S3_COFOUNDER_APP_STORE_PATH, JSON.stringify(fallbackCoFounderApplications, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 co-founder application store save warning:', e.message);
  }
};
loadS3CoFounderAppStore();

export const loadS3ProposalStore = () => {
  try {
    if (!fs.existsSync(S3_PROPOSAL_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_PROPOSAL_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) {
      const byId = new Map(fallbackProposals.map((p) => [p.id || p._id, p]));
      parsed.forEach((p) => {
        const id = p && (p.id || p._id);
        if (id) byId.set(id, p);
      });
      fallbackProposals.length = 0;
      fallbackProposals.push(...byId.values());
    }
  } catch (e) {
    console.warn('S3 proposal store load warning:', e.message);
  }
};
export const persistS3ProposalStore = () => {
  try {
    fs.writeFileSync(S3_PROPOSAL_STORE_PATH, JSON.stringify(fallbackProposals, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 proposal store save warning:', e.message);
  }
};
loadS3ProposalStore();

export const loadS3MessageStore = () => {
  try {
    if (!fs.existsSync(S3_MESSAGE_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_MESSAGE_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) {
      const byId = new Map(fallbackMessages.map((m) => [m.id, m]));
      parsed.forEach((m) => {
        if (m && m.id) byId.set(m.id, m);
      });
      fallbackMessages.length = 0;
      fallbackMessages.push(...byId.values());
    }
  } catch (e) {
    console.warn('S3 message store load warning:', e.message);
  }
};
export const persistS3MessageStore = () => {
  try {
    fs.writeFileSync(S3_MESSAGE_STORE_PATH, JSON.stringify(fallbackMessages, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 message store save warning:', e.message);
  }
};
loadS3MessageStore();

export const loadS3NotificationStore = () => {
  try {
    if (!fs.existsSync(S3_NOTIFICATION_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_NOTIFICATION_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) {
      fallbackNotifications.length = 0;
      fallbackNotifications.push(...parsed);
    }
  } catch (e) {
    console.warn('Notification store load warning:', e.message);
  }
};
export const persistS3NotificationStore = () => {
  try {
    fs.writeFileSync(S3_NOTIFICATION_STORE_PATH, JSON.stringify(fallbackNotifications.slice(0, 400), null, 2), 'utf8');
  } catch (e) {
    console.warn('Notification store save warning:', e.message);
  }
};
loadS3NotificationStore();

export const hydrateChatFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (error || !Array.isArray(data)) return;
    const byId = new Map(fallbackMessages.map((m) => [m.id, m]));
    data.forEach((m) => {
      if (m && m.id) byId.set(m.id, m);
    });
    fallbackMessages.length = 0;
    fallbackMessages.push(...byId.values());
    persistS3MessageStore();
  } catch (e) {
    console.warn('S3 supabase chat hydrate warning:', e.message);
  }
};
hydrateChatFromSupabase();

export const loadS3AuditStore = () => {
  try {
    if (!fs.existsSync(S3_AUDIT_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_AUDIT_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) {
      const byId = new Map(fallbackAuditLogs.map((r) => [r.id, r]));
      parsed.forEach((r) => { if (r && r.id) byId.set(r.id, r); });
      fallbackAuditLogs.length = 0;
      fallbackAuditLogs.push(...byId.values());
    }
  } catch (e) {
    console.warn('S3 audit store load warning:', e.message);
  }
};
export const persistS3AuditStore = () => {
  try {
    fs.writeFileSync(S3_AUDIT_STORE_PATH, JSON.stringify(fallbackAuditLogs, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 audit store save warning:', e.message);
  }
};
loadS3AuditStore();

export const loadS3UpdateStore = () => {
  try {
    if (!fs.existsSync(S3_UPDATE_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_UPDATE_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackUpdates.length = 0;
      fallbackUpdates.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 campaign-update store load warning:', e.message);
  }
};
export const persistS3UpdateStore = () => {
  try {
    fs.writeFileSync(S3_UPDATE_STORE_PATH, JSON.stringify(fallbackUpdates, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 campaign-update store save warning:', e.message);
  }
};
loadS3UpdateStore();

export const loadS3ProgressTagStore = () => {
  try {
    if (!fs.existsSync(S3_PROGRESS_TAG_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_PROGRESS_TAG_STORE_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(fallbackProgressTags).forEach((k) => delete fallbackProgressTags[k]);
      Object.assign(fallbackProgressTags, parsed);
    }
  } catch (e) {
    console.warn('S3 progress-tag store load warning:', e.message);
  }
};
export const persistS3ProgressTagStore = () => {
  try {
    fs.writeFileSync(S3_PROGRESS_TAG_STORE_PATH, JSON.stringify(fallbackProgressTags, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 progress-tag store save warning:', e.message);
  }
};
loadS3ProgressTagStore();

export const loadS3PayoutStore = () => {
  try {
    if (!fs.existsSync(S3_PAYOUT_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_PAYOUT_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackPayouts.length = 0;
      fallbackPayouts.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 payout store load warning:', e.message);
  }
};
export const persistS3PayoutStore = () => {
  try {
    fs.writeFileSync(S3_PAYOUT_STORE_PATH, JSON.stringify(fallbackPayouts, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 payout store save warning:', e.message);
  }
};
loadS3PayoutStore();

export const loadS3DepositStore = () => {
  try {
    if (!fs.existsSync(S3_DEPOSIT_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_DEPOSIT_STORE_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(fallbackSecurityDeposits).forEach((k) => delete fallbackSecurityDeposits[k]);
      Object.assign(fallbackSecurityDeposits, parsed);
    }
  } catch (e) {
    console.warn('S3 security-deposit store load warning:', e.message);
  }
};
export const persistS3DepositStore = () => {
  try {
    fs.writeFileSync(S3_DEPOSIT_STORE_PATH, JSON.stringify(fallbackSecurityDeposits, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 security-deposit store save warning:', e.message);
  }
};
loadS3DepositStore();

export const loadS3WalletStore = () => {
  try {
    if (!fs.existsSync(S3_WALLET_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_WALLET_STORE_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(fallbackWallets).forEach((k) => delete fallbackWallets[k]);
      Object.assign(fallbackWallets, parsed);
    }
  } catch (e) {
    console.warn('S3 wallet store load warning:', e.message);
  }
};
export const persistS3WalletStore = () => {
  try {
    fs.writeFileSync(S3_WALLET_STORE_PATH, JSON.stringify(fallbackWallets, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 wallet store save warning:', e.message);
  }
};
loadS3WalletStore();

export const syncFounderWalletAccountToSupabase = async (founderId) => {
  if (!isSupabaseConfigured || !supabase || !founderId) return;
  try {
    const w = fallbackWallets[String(founderId)] || { balance: 0, ledger: [] };
    await supabase.from('wallet_accounts').upsert([{
      owner_id: String(founderId),
      owner_role: 'founder',
      balance: Number(w.balance || 0),
      ledger: w.ledger || [],
      updated_at: new Date().toISOString()
    }], { onConflict: 'owner_id' });
  } catch (e) {}
};

export const loadS3WalletDepositStore = () => {
  try {
    if (!fs.existsSync(S3_WALLET_DEPOSIT_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_WALLET_DEPOSIT_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackWalletDeposits.length = 0;
      fallbackWalletDeposits.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 wallet deposit store load warning:', e.message);
  }
};
export const persistS3WalletDepositStore = () => {
  try {
    fs.writeFileSync(S3_WALLET_DEPOSIT_STORE_PATH, JSON.stringify(fallbackWalletDeposits, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 wallet deposit store save warning:', e.message);
  }
};
export const syncWalletDepositToSupabase = async (deposit) => {
  if (!isSupabaseConfigured || !supabase || !deposit?.id) return;
  try {
    await supabase.from('wallet_deposits').upsert([{
      id: deposit.id,
      owner_role: deposit.owner_role || (deposit.investor_id ? 'investor' : 'founder'),
      founder_id: deposit.founder_id || null,
      investor_id: deposit.investor_id || null,
      owner_id: deposit.owner_id || deposit.investor_id || deposit.founder_id || null,
      amount: Number(deposit.amount || 0),
      method: deposit.method || null,
      reference: deposit.reference || null,
      note: deposit.note || null,
      proof_url: deposit.proof_url || null,
      proof_filename: deposit.proof_filename || null,
      status: deposit.status || 'pending',
      created_at: deposit.created_at || new Date().toISOString(),
      reviewed_at: deposit.reviewed_at || null,
      review_note: deposit.review_note || null
    }], { onConflict: 'id' });
  } catch (e) {}
};
export const hydrateWalletDepositsFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('wallet_deposits').select('*').order('created_at', { ascending: false });
    if (error || !Array.isArray(data) || data.length === 0) return;
    const byId = new Map(fallbackWalletDeposits.map((d) => [d.id, d]));
    data.forEach((d) => { if (d?.id) byId.set(d.id, { ...byId.get(d.id), ...d }); });
    fallbackWalletDeposits.length = 0;
    fallbackWalletDeposits.push(...byId.values());
    persistS3WalletDepositStore();
  } catch (e) {}
};
loadS3WalletDepositStore();
hydrateWalletDepositsFromSupabase();

export const loadS3InvestorWalletStore = () => {
  try {
    if (!fs.existsSync(S3_INVESTOR_WALLET_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_INVESTOR_WALLET_STORE_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(fallbackInvestorWallets).forEach((k) => delete fallbackInvestorWallets[k]);
      Object.assign(fallbackInvestorWallets, parsed);
    }
  } catch (e) {
    console.warn('S3 investor wallet store load warning:', e.message);
  }
};
export const persistS3InvestorWalletStore = () => {
  try {
    fs.writeFileSync(S3_INVESTOR_WALLET_STORE_PATH, JSON.stringify(fallbackInvestorWallets, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 investor wallet store save warning:', e.message);
  }
};
export const syncInvestorWalletAccountToSupabase = async (investorId) => {
  if (!isSupabaseConfigured || !supabase || !investorId) return;
  try {
    const w = fallbackInvestorWallets[String(investorId)] || { balance: 0, ledger: [] };
    await supabase.from('wallet_accounts').upsert([{
      owner_id: String(investorId),
      owner_role: 'investor',
      balance: Number(w.balance || 0),
      ledger: w.ledger || [],
      updated_at: new Date().toISOString()
    }], { onConflict: 'owner_id' });
  } catch (e) {}
};
loadS3InvestorWalletStore();

export const loadS3TrashStore = () => {
  try {
    if (!fs.existsSync(S3_TRASH_STORE_PATH)) return;
    const raw = fs.readFileSync(S3_TRASH_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      fallbackTrash.length = 0;
      fallbackTrash.push(...parsed);
    }
  } catch (e) {
    console.warn('Trash store load notice:', e.message);
  }
};
export const persistS3TrashStore = () => {
  try {
    fs.writeFileSync(S3_TRASH_STORE_PATH, JSON.stringify(fallbackTrash, null, 2), 'utf8');
  } catch (e) {
    console.warn('Trash store save notice:', e.message);
  }
};
loadS3TrashStore();

export const loadS3DisputesStore = () => {
  try {
    if (!fs.existsSync(S3_DISPUTES_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_DISPUTES_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackDisputes.length = 0;
      fallbackDisputes.push(...parsed);
    }
  } catch (e) {
    console.warn('Disputes store load notice:', e.message);
  }
};
export const persistS3DisputesStore = () => {
  try {
    fs.writeFileSync(S3_DISPUTES_STORE_PATH, JSON.stringify(fallbackDisputes, null, 2), 'utf8');
  } catch (e) {
    console.warn('Disputes store save notice:', e.message);
  }
};
loadS3DisputesStore();

export const loadS3ReliefStore = () => {
  try {
    if (!fs.existsSync(S3_RELIEF_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_RELIEF_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackReliefDrives.length = 0;
      fallbackReliefDrives.push(...parsed);
      fallbackReliefDrives.forEach((d) => {
        if (!Array.isArray(d.donors)) d.donors = [];
        if (!Array.isArray(d.milestones)) d.milestones = [];
        if (d.verified === undefined) d.verified = d.status === 'verified';
      });
    }
  } catch (e) {
    console.warn('S3 relief store load warning:', e.message);
  }
};
export const persistS3ReliefStore = () => {
  try {
    fs.writeFileSync(S3_RELIEF_STORE_PATH, JSON.stringify(fallbackReliefDrives, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 relief store save warning:', e.message);
  }
};
loadS3ReliefStore();

export const loadS3ReliefDonationStore = () => {
  try {
    if (!fs.existsSync(S3_RELIEF_DONATION_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_RELIEF_DONATION_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackReliefDonations.length = 0;
      fallbackReliefDonations.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 relief-donation store load warning:', e.message);
  }
};
export const persistS3ReliefDonationStore = () => {
  try {
    fs.writeFileSync(S3_RELIEF_DONATION_STORE_PATH, JSON.stringify(fallbackReliefDonations, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 relief-donation store save warning:', e.message);
  }
};
loadS3ReliefDonationStore();

// ============================================================================
// 4. CAMPAIGN DEDUPE & OWNER HELPERS
// ============================================================================
export const s3CampaignDedupeKey = (c) => {
  const title = String(c?.title || '').trim().toLowerCase();
  const fid = String(c?.founder_id || c?.founderId || c?.founder?._id || c?.founder?.id || '').trim();
  return `${title}::${fid || 'unknown'}`;
};

export const s3CampaignRichnessScore = (c) => {
  if (!c) return -1;
  const ms = Array.isArray(c.milestones) ? c.milestones.length : 0;
  const proofs = Array.isArray(c.milestones)
    ? c.milestones.reduce((n, m) => n + (Array.isArray(m?.proofs) ? m.proofs.length : 0), 0)
    : 0;
  const id = String(c.id || c._id || '');
  return ms * 1000 + proofs * 10 + (id.endsWith('_1') ? 50 : 0) + (id.includes('_') ? 5 : 0);
};

export const s3DedupeLiveCampaigns = (list) => {
  const byKey = new Map();
  for (const c of list || []) {
    if (!c) continue;
    const key = s3CampaignDedupeKey(c);
    const prev = byKey.get(key);
    if (!prev || s3CampaignRichnessScore(c) > s3CampaignRichnessScore(prev)) {
      byKey.set(key, c);
    }
  }
  return Array.from(byKey.values());
};

export const S3_DEMO_FOUNDER_EMAIL = 'ashraf.khan1@univ.edu.bd';

export const s3FounderOwnerKeys = async (founderId) => {
  const keys = new Set([String(founderId || '')]);
  const fb = fallbackUsers.find((u) => String(u.id || u._id) === String(founderId));
  if (fb) {
    keys.add(String(fb.id || fb._id));
    if (String(fb.email || '').toLowerCase() === S3_DEMO_FOUNDER_EMAIL) keys.add('usr_founder_1');
  }
  if (String(founderId) === 'usr_founder_1') keys.add('usr_founder_1');
  return keys;
};

export const s3CampaignOwnedBy = (c, keys) => {
  const owners = [c.founder?._id, c.founder?.id, c.founder_id, c.founderId, typeof c.founder === 'string' ? c.founder : null]
    .filter(Boolean)
    .map((x) => String(x));
  return owners.some((o) => keys.has(o));
};

export const s3FounderAccessKeys = async (founderId) => {
  const keys = await s3FounderOwnerKeys(founderId);
  const fb = fallbackUsers.find((u) => String(u.id || u._id) === String(founderId));
  if (fb?.email) keys.add(String(fb.email).toLowerCase());
  if (String(founderId || '').includes('@')) keys.add(String(founderId).toLowerCase());
  return keys;
};

export const s3IsCoFounderOf = (obj, keys) => {
  return getCoFounders(obj).some((c) => {
    const id = String(c.id || '');
    const email = String(c.email || '').toLowerCase();
    return (id && keys.has(id)) || (email && keys.has(email));
  });
};

export const s3CampaignAccessibleBy = (c, keys) => s3CampaignOwnedBy(c, keys) || s3IsCoFounderOf(c, keys);

export const annotateViewerRole = (item, keys) => {
  const role = s3CampaignOwnedBy(item, keys) ? 'owner' : (s3IsCoFounderOf(item, keys) ? 'cofounder' : 'owner');
  return { ...item, viewerRole: role, viewer_role: role };
};

export const addWorkingDaysBD = (fromDate, days) => {
  const d = new Date(fromDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 5 && wd !== 6) added++;
  }
  return d.toISOString();
};

export const namesRoughlyMatch = (a, b) => {
  const na = String(a || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nb = String(b || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
};

export const findPlatformUserByEmail = (email) => {
  const em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  return fallbackUsers.find((u) => String(u.email || '').toLowerCase() === em) || null;
};

export const assertSuccessorIsFounder = (successorName, successorEmail, founderId) => {
  const email = String(successorEmail || '').trim().toLowerCase();
  const name = String(successorName || '').trim();
  if (!email && !name) return { ok: true, successor: null };
  if (!email) return { ok: false, error: 'Successor email is required when designating a successor.' };
  const u = findPlatformUserByEmail(email);
  if (!u || String(u.role || '').toLowerCase() !== 'founder') {
    return { ok: false, error: 'Successor must be an existing FundBridge founder account.' };
  }
  const sid = String(u.id || u._id || '');
  if (sid && String(founderId) && sid === String(founderId)) {
    return { ok: false, error: 'You cannot designate yourself as successor.' };
  }
  if (name && !namesRoughlyMatch(name, u.name)) {
    return { ok: false, error: `Successor name does not match the founder registered as ${email}.` };
  }
  return { ok: true, successor: u };
};

export const MAX_COFOUNDERS = 3;

export const toCoFounderEntry = (u) => ({
  id: String(u.id || u._id || ''),
  name: u.name || '',
  email: u.email || '',
  university: u.university || '',
  department: u.department || '',
  status: 'active'
});

export const resolveCoFounderEntries = (rawList, founderId) => {
  const list = Array.isArray(rawList) ? rawList : [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    if (out.length >= MAX_COFOUNDERS) {
      return { ok: false, error: `A campaign can have at most ${MAX_COFOUNDERS} co-founders.` };
    }
    const email = String(item?.email || '').trim().toLowerCase();
    const idHint = String(item?.id || item?.user_id || item?._id || '');
    let u = email ? findPlatformUserByEmail(email) : null;
    if (!u && idHint) {
      u = fallbackUsers.find((x) => String(x.id || x._id) === idHint) || null;
    }
    if (!u || String(u.role || '').toLowerCase() !== 'founder') {
      return { ok: false, error: `Co-founder must be an existing FundBridge founder${email ? ` (${email})` : ''}.` };
    }
    const uid = String(u.id || u._id || '');
    if (uid && String(founderId) && uid === String(founderId)) {
      return { ok: false, error: 'You cannot add yourself as a co-founder.' };
    }
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    out.push(toCoFounderEntry(u));
  }
  return { ok: true, coFounders: out };
};

export const legacyCoFoundersFromSuccessor = (obj) => {
  const email = obj?.successorEmail || obj?.successor_email;
  const name = obj?.successorName || obj?.successor_name;
  if (!email && !name) return [];
  const check = assertSuccessorIsFounder(name, email, obj.founder_id || obj.founderId);
  if (check.ok && check.successor) return [toCoFounderEntry(check.successor)];
  return [];
};

export const getCoFounders = (obj) => {
  if (!obj) return [];
  const raw = obj.coFounders || obj.co_founders;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, MAX_COFOUNDERS).map((c) => ({
      id: String(c.id || c.user_id || c._id || ''),
      name: c.name || '',
      email: c.email || '',
      university: c.university || '',
      department: c.department || '',
      status: c.status || 'active'
    })).filter((c) => c.id || c.email);
  }
  return legacyCoFoundersFromSuccessor(obj);
};

export const syncSuccessorFromCoFounders = (obj, coFounders) => {
  const list = Array.isArray(coFounders) ? coFounders.slice(0, MAX_COFOUNDERS) : [];
  obj.coFounders = list;
  obj.co_founders = list;
  const first = list[0];
  obj.successorName = obj.successor_name = first?.name || '';
  obj.successorEmail = obj.successor_email = first?.email || '';
  return obj;
};

export const resolveCoFoundersFromBody = (body, founderId, existing) => {
  if (body && (body.coFounders !== undefined || body.co_founders !== undefined)) {
    return resolveCoFounderEntries(body.coFounders || body.co_founders, founderId);
  }
  if (body && (body.successorName !== undefined || body.successorEmail !== undefined)) {
    const name = body.successorName;
    const email = body.successorEmail;
    if (!String(name || '').trim() && !String(email || '').trim()) {
      return { ok: true, coFounders: [] };
    }
    return resolveCoFounderEntries([{ name, email }], founderId);
  }
  if (existing) return { ok: true, coFounders: getCoFounders(existing) };
  return { ok: true, coFounders: [] };
};

export const findCampaignOrRelief = (targetType, targetId) => {
  const tid = String(targetId || '');
  if (targetType === 'relief') {
    const drive = fallbackReliefDrives.find((d) => String(d.id || d._id) === tid);
    return drive ? { kind: 'relief', item: drive } : null;
  }
  const cmp = fallbackCampaigns.find((c) => String(c.id || c._id) === tid);
  return cmp ? { kind: 'investment', item: cmp } : null;
};

// ============================================================================
// 5. AUDIT LOG & NOTIFICATION DISPATCHERS
// ============================================================================
export const founderIdFromAuditId = (id) => {
  const s = String(id || '');
  const m = s.match(/^aud::(.+)::\d+$/);
  return m ? m[1] : '';
};

export const hydrateAuditFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return;
    const byId = new Map(fallbackAuditLogs.map((r) => [r.id, r]));
    data.forEach((r) => {
      if (!r || !r.id) return;
      const actorFromId = founderIdFromAuditId(r.id);
      const existing = byId.get(r.id) || {};
      const actor_role = existing.actor_role || r.actor_role || (
        String(actorFromId).includes('investor') ? 'investor' : (actorFromId ? 'founder' : undefined)
      );
      const founder_id = existing.founder_id || r.founder_id || (actor_role === 'founder' ? actorFromId : undefined);
      const investor_id = existing.investor_id || r.investor_id || (actor_role === 'investor' ? actorFromId : undefined);
      byId.set(r.id, { ...r, ...existing, founder_id, investor_id, actor_role });
    });
    fallbackAuditLogs.length = 0;
    fallbackAuditLogs.push(...byId.values());
    persistS3AuditStore();
  } catch (e) {
    console.warn('S3 supabase audit hydrate warning:', e.message);
  }
};
hydrateAuditFromSupabase();

export const writeFounderAuditLog = async ({ founderId, category, title, status = 'RECORDED' }) => {
  if (!founderId || !title) return;
  const created_at = new Date().toISOString();
  const payload = JSON.stringify({ founderId, category, title, status, created_at });
  const hash = '0x' + crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
  const row = {
    id: `aud::${founderId}::${Date.now()}`,
    hash,
    category: String(category || 'FOUNDER').toUpperCase(),
    title: String(title),
    status: String(status || 'RECORDED').toUpperCase(),
    latency: '<1s',
    created_at,
    founder_id: String(founderId),
    actor_role: 'founder'
  };
  fallbackAuditLogs.unshift(row);
  persistS3AuditStore();
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_logs').insert([{
        id: row.id,
        hash: row.hash,
        category: row.category,
        title: row.title,
        status: row.status,
        latency: row.latency,
        created_at: row.created_at
      }]);
    } catch (e) {}
  }
  return row;
};

export const writeInvestorAuditLog = async ({ investorId, category, title, status = 'RECORDED' }) => {
  if (!investorId || !title) return null;
  const created_at = new Date().toISOString();
  const payload = JSON.stringify({ investorId, category, title, status, created_at });
  const hash = '0x' + crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
  const row = {
    id: `aud::${investorId}::${Date.now()}`,
    hash,
    category: String(category || 'INVESTOR').toUpperCase(),
    title: String(title),
    status: String(status || 'RECORDED').toUpperCase(),
    latency: '<1s',
    created_at,
    investor_id: String(investorId),
    actor_role: 'investor'
  };
  fallbackAuditLogs.unshift(row);
  persistS3AuditStore();
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_logs').insert([{
        id: row.id,
        hash: row.hash,
        category: row.category,
        title: row.title,
        status: row.status,
        latency: row.latency,
        created_at: row.created_at
      }]);
    } catch (e) {}
  }
  return row;
};

export const auditBelongsToInvestor = (r, investorId) => {
  if (!r || !investorId) return false;
  if (String(r.actor_role || '').toLowerCase() === 'founder') return false;
  if (r.founder_id && !r.investor_id && String(r.actor_role || '').toLowerCase() !== 'investor') return false;
  if (r.investor_id) return String(r.investor_id) === String(investorId);
  const fromId = founderIdFromAuditId(r.id);
  return String(fromId) === String(investorId);
};

export const auditBelongsToFounder = (r, founderId) => {
  if (!r || !founderId) return false;
  if (String(r.actor_role || '').toLowerCase() === 'investor') return false;
  if (r.investor_id && !r.founder_id) return false;
  const fid = r.founder_id || founderIdFromAuditId(r.id);
  return String(fid) === String(founderId);
};

export const createAndDispatchNotification = async (userId, title, message, type = 'info', meta = {}) => {
  const recipientId = String(userId || '').trim();
  if (!recipientId || !title) return null;

  const eventKey = meta.eventKey ? String(meta.eventKey) : null;
  if (eventKey && fallbackNotifications.some((n) => n.event_key === eventKey && String(n.user_id) === recipientId)) {
    return fallbackNotifications.find((n) => n.event_key === eventKey && String(n.user_id) === recipientId);
  }

  const notifObj = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: recipientId,
    recipient_id: recipientId,
    sender_id: meta.senderId || null,
    type: normalizeNotificationType(type),
    title: String(title),
    message: String(message || ''),
    link_url: meta.linkUrl || null,
    event_key: eventKey,
    is_read: false,
    created_at: new Date().toISOString()
  };
  fallbackNotifications.unshift(notifObj);
  persistS3NotificationStore();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('notifications').insert([{
        id: notifObj.id,
        user_id: notifObj.user_id,
        sender_id: notifObj.sender_id,
        type: notifObj.type,
        title: notifObj.title,
        message: notifObj.message,
        link_url: notifObj.link_url,
        event_key: notifObj.event_key,
        is_read: false,
        created_at: notifObj.created_at
      }]);
    } catch (e) {}
  }

  const io = getIO();
  if (io) {
    io.to(recipientId).emit('receive_notification', notifObj);
  }
  return notifObj;
};

export const notifyCampaignBackers = async (campaignId, title, message, type, meta = {}) => {
  const cid = String(campaignId || '');
  if (!cid) return;
  const recipients = new Set();
  fallbackProposals.forEach((p) => {
    if (String(p.campaign_id || p.campaignId) !== cid) return;
    const status = String(p.status || '').toLowerCase();
    if (!['accepted', 'funded'].includes(status)) return;
    const inv = p.investor_id || p.investorId;
    if (inv) recipients.add(String(inv));
  });
  for (const investorId of recipients) {
    await createAndDispatchNotification(investorId, title, message, type, {
      ...meta,
      eventKey: meta.eventKey ? `${meta.eventKey}:${investorId}` : undefined,
      linkUrl: meta.linkUrl || 'tab:portfolio'
    });
  }
};

export const handleSocketDirectMessage = async (data, io) => {
  const msgObj = {
    id: 'msg_' + Date.now(),
    sender_id: data.senderId || data.sender,
    receiver_id: data.receiverId || 'all',
    sender_name: data.senderName || 'User',
    campaign_id: data.campaignId || '',
    text: data.text,
    created_at: new Date().toISOString()
  };
  fallbackMessages.push(msgObj);
  persistS3MessageStore();

  if (isSupabaseConfigured && supabase) {
    try { await supabase.from('messages').insert([msgObj]); } catch (e) {}
  }

  const targetRoom = data.roomId || data.campaignId || 'general';
  if (io) {
    io.to(targetRoom).emit('receive_message', msgObj);
    io.emit('new_direct_message', msgObj);
  }
};

// ============================================================================
// 6. WALLET & PAYOUT HELPERS
// ============================================================================
export const s3IsPendingPayoutStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return s.includes('pending') || s === 'requested' || s.includes('awaiting');
};

export const s3PendingPayoutTotal = async (founderId) => {
  const fid = String(founderId || '');
  const byId = new Map();
  fallbackPayouts.forEach((p) => {
    if (!p || String(p.founder_id) !== fid) return;
    const id = p.id || p._id;
    if (id) byId.set(String(id), p);
  });
  if (isSupabaseConfigured && supabase && fid) {
    try {
      const { data, error } = await supabase.from('payouts').select('*').eq('founder_id', fid);
      if (!error && Array.isArray(data)) {
        data.forEach((p) => {
          const id = p?.id || p?._id;
          if (id && !byId.has(String(id))) byId.set(String(id), p);
        });
      }
    } catch (e) {}
  }
  return [...byId.values()]
    .filter((p) => s3IsPendingPayoutStatus(p.status))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
};

export const ensureFounderWallet = (founderId) => {
  const id = String(founderId || '');
  if (!id) return { balance: 0, ledger: [] };
  if (!fallbackWallets[id]) fallbackWallets[id] = { balance: 0, ledger: [] };
  if (!Array.isArray(fallbackWallets[id].ledger)) fallbackWallets[id].ledger = [];
  return fallbackWallets[id];
};

export const creditFounderWalletInvestment = ({
  founderId,
  amount,
  investorId,
  investorName,
  campaignId,
  campaignTitle,
  proposalId
}) => {
  const fid = String(founderId || '');
  const amt = Number(amount);
  if (!fid || !Number.isFinite(amt) || amt <= 0) return null;
  const w = ensureFounderWallet(fid);
  const pid = String(proposalId || '');
  if (pid && w.ledger.some((row) => row.proposal_id === pid && row.type === 'INVESTMENT_IN')) {
    return w;
  }
  const row = {
    id: `wal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'INVESTMENT_IN',
    direction: 'in',
    amount: amt,
    investor_id: String(investorId || ''),
    investor_name: String(investorName || 'Investor'),
    campaign_id: String(campaignId || ''),
    campaign_title: String(campaignTitle || campaignId || 'Campaign'),
    proposal_id: pid,
    note: 'Accepted investment proposal credited to founder wallet (ledger only — no payment gateway).',
    created_at: new Date().toISOString()
  };
  w.ledger.unshift(row);
  w.balance = Number(w.balance || 0) + amt;
  persistS3WalletStore();
  syncFounderWalletAccountToSupabase(fid);
  return w;
};

export const creditFounderWalletReliefDonation = ({
  founderId,
  amount,
  investorId,
  investorName,
  driveId,
  driveTitle,
  donationId
}) => {
  const fid = String(founderId || '');
  const amt = Number(amount);
  if (!fid || !Number.isFinite(amt) || amt <= 0) return null;
  const w = ensureFounderWallet(fid);
  const did = String(donationId || '');
  if (did && w.ledger.some((row) => row.proposal_id === did && row.type === 'RELIEF_DONATION_IN')) {
    return w;
  }
  w.ledger.unshift({
    id: `wal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'RELIEF_DONATION_IN',
    direction: 'in',
    amount: amt,
    investor_id: String(investorId || ''),
    investor_name: String(investorName || 'Donor'),
    campaign_id: String(driveId || ''),
    campaign_title: String(driveTitle || driveId || 'Relief campaign'),
    proposal_id: did,
    note: 'Relief donation credited to founder wallet.',
    created_at: new Date().toISOString()
  });
  w.balance = Number(w.balance || 0) + amt;
  persistS3WalletStore();
  syncFounderWalletAccountToSupabase(fid);
  return w;
};

export const syncFounderWalletFromReliefDonations = async (founderId) => {
  const ownerKeys = await s3FounderOwnerKeys(founderId);
  const ownedDriveIds = new Set(
    fallbackReliefDrives
      .filter((d) => ownerKeys.has(String(d.founder_id || d.founderId || '')))
      .map((d) => String(d.id || d._id))
      .filter(Boolean)
  );
  fallbackReliefDonations.forEach((don) => {
    if (!ownedDriveIds.has(String(don.drive_id))) return;
    creditFounderWalletReliefDonation({
      founderId,
      amount: don.amount,
      investorId: don.investor_id,
      investorName: don.investor_name,
      driveId: don.drive_id,
      driveTitle: don.drive_title,
      donationId: don.id
    });
  });
};

export const debitFounderWallet = ({ founderId, amount, type, title, note, refId, campaignId }) => {
  const fid = String(founderId || '');
  const amt = Number(amount);
  if (!fid || !Number.isFinite(amt) || amt <= 0) {
    return { ok: false, error: 'Enter a valid amount.' };
  }
  const w = ensureFounderWallet(fid);
  const bal = Number(w.balance || 0);
  if (bal < amt) {
    return {
      ok: false,
      error: `Not enough money in wallet. Available ৳ ${bal.toLocaleString()}. Add Money in Wallet first.`
    };
  }
  const rid = String(refId || `ref_${Date.now()}`);
  w.ledger.unshift({
    id: `wal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: type || 'WALLET_OUT',
    direction: 'out',
    amount: amt,
    investor_id: '',
    investor_name: title || 'Wallet transfer',
    campaign_id: String(campaignId || ''),
    campaign_title: title || 'Wallet transfer',
    proposal_id: rid,
    note: note || 'Wallet debit.',
    created_at: new Date().toISOString()
  });
  w.balance = bal - amt;
  persistS3WalletStore();
  syncFounderWalletAccountToSupabase(fid);
  return { ok: true, wallet: w };
};

export const founderWalletPersonalAvailable = (founderId) => {
  const w = ensureFounderWallet(founderId);
  const ledger = Array.isArray(w.ledger) ? w.ledger : [];
  const personalIn = ledger
    .filter((r) => r.type === 'MANUAL_DEPOSIT')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const personalOut = ledger
    .filter((r) => r.type === 'SECURITY_DEPOSIT_OUT' || r.type === 'RELIEF_SELF_FUND')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const personalLeft = Math.max(0, personalIn - personalOut);
  return Math.max(0, Math.min(Number(w.balance || 0), personalLeft));
};

export const debitFounderWalletFromPersonal = ({ founderId, amount, type, title, note, refId, campaignId, purposeLabel }) => {
  const fid = String(founderId || '');
  const amt = Number(amount);
  if (!fid || !Number.isFinite(amt) || amt <= 0) {
    return { ok: false, error: 'Enter a valid amount.' };
  }
  const personalAvail = founderWalletPersonalAvailable(fid);
  if (amt > personalAvail) {
    const purpose = purposeLabel || 'This transfer';
    return {
      ok: false,
      error: `${purpose} can only use Add Money / personal top-ups (not investment or donation credits). Personal available ৳ ${personalAvail.toLocaleString()}.`
    };
  }
  return debitFounderWallet({
    founderId,
    amount,
    type,
    title,
    note,
    refId,
    campaignId
  });
};

export const debitFounderWalletForSecurityDeposit = ({ founderId, amount, depositRowId }) => {
  return debitFounderWalletFromPersonal({
    founderId,
    amount,
    type: 'SECURITY_DEPOSIT_OUT',
    title: 'Security deposit bond',
    note: 'Transferred from personal Add Money balance to security deposit (good-faith bond). Not from investment funds.',
    refId: `secdep_${depositRowId || Date.now()}`,
    purposeLabel: 'Security deposit'
  });
};

export const creditFounderWalletManualDeposit = ({ founderId, amount, method, depositId, reference }) => {
  const fid = String(founderId || '');
  const amt = Number(amount);
  if (!fid || !Number.isFinite(amt) || amt <= 0) return null;
  const w = ensureFounderWallet(fid);
  const did = String(depositId || '');
  if (did && w.ledger.some((row) => row.proposal_id === `deposit_${did}` && row.type === 'MANUAL_DEPOSIT')) {
    return w;
  }
  w.ledger.unshift({
    id: `wal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'MANUAL_DEPOSIT',
    direction: 'in',
    amount: amt,
    investor_id: '',
    investor_name: `Manual top-up (${method || 'other'})`,
    campaign_id: '',
    campaign_title: 'Wallet Add Money',
    proposal_id: did ? `deposit_${did}` : '',
    note: `Admin-verified manual deposit${reference ? ' · ref ' + reference : ''}.`,
    created_at: new Date().toISOString()
  });
  w.balance = Number(w.balance || 0) + amt;
  persistS3WalletStore();
  syncFounderWalletAccountToSupabase(fid);
  return w;
};

export const syncFounderWalletFromAcceptedProposals = async (founderId) => {
  const ownerKeys = await s3FounderOwnerKeys(founderId);
  const ownedCamps = fallbackCampaigns.filter((c) => s3CampaignOwnedBy(c, ownerKeys));
  const campIds = new Set(ownedCamps.map((c) => c.id || c._id).filter(Boolean));
  fallbackProposals.forEach((p) => {
    if (String(p.status || '').toLowerCase() !== 'accepted') return;
    const cid = p.campaign_id || p.campaignId;
    const ownedCamp = cid && campIds.has(cid);
    const ownedFounder = ownerKeys.has(String(p.founder_id || p.founderId || ''));
    if (!ownedCamp && !ownedFounder) return;
    const camp = fallbackCampaigns.find((c) => (c.id || c._id) === cid);
    creditFounderWalletInvestment({
      founderId: String(founderId),
      amount: p.amount,
      investorId: p.investor_id || p.investorId,
      investorName: p.investor_name || p.investorName,
      campaignId: cid,
      campaignTitle: p.campaign_title || camp?.title || cid,
      proposalId: p.id || p._id
    });
  });

  ownedCamps.forEach((camp) => {
    const cid = camp.id || camp._id;
    if (!cid) return;
    const raised = Number(camp.raised || 0);
    if (raised <= 0) return;
    const acceptedSum = fallbackProposals
      .filter((p) => String(p.status || '').toLowerCase() === 'accepted')
      .filter((p) => (p.campaign_id || p.campaignId) === cid)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const seedAmt = Math.max(0, raised - acceptedSum);
    if (seedAmt <= 0) return;
    const w = ensureFounderWallet(founderId);
    const seedId = `seed_escrow_${cid}`;
    if (w.ledger.some((row) => row.proposal_id === seedId && row.type === 'SEED_ESCROW')) return;
    w.ledger.unshift({
      id: `wal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'SEED_ESCROW',
      direction: 'in',
      amount: seedAmt,
      investor_id: '',
      investor_name: 'Prior escrow (campaign raised)',
      campaign_id: String(cid),
      campaign_title: String(camp.title || cid),
      proposal_id: seedId,
      note: 'Opening escrow from campaign raised before/without proposal credits (ledger only).',
      created_at: new Date().toISOString()
    });
    w.balance = Number(w.balance || 0) + seedAmt;
    persistS3WalletStore();
  });
  return ensureFounderWallet(founderId);
};

export const ensureInvestorWallet = (investorId) => {
  const id = String(investorId || '');
  if (!id) return { balance: 0, ledger: [] };
  if (!fallbackInvestorWallets[id]) fallbackInvestorWallets[id] = { balance: 0, ledger: [] };
  if (!Array.isArray(fallbackInvestorWallets[id].ledger)) fallbackInvestorWallets[id].ledger = [];
  return fallbackInvestorWallets[id];
};

export const recomputeInvestorWalletBalance = (investorId) => {
  const w = ensureInvestorWallet(investorId);
  let bal = 0;
  [...(w.ledger || [])]
    .slice()
    .reverse()
    .forEach((row) => {
      const amt = Number(row.amount) || 0;
      if (row.direction === 'out') bal -= amt;
      else bal += amt;
    });
  if (bal < 0) {
    const seedId = `seed_investor_open_${investorId}`;
    const need = Math.abs(bal);
    const existing = w.ledger.find((r) => r.proposal_id === seedId && r.type === 'SEED_OPENING');
    if (existing) {
      existing.amount = Number(existing.amount || 0) + need;
    } else {
      w.ledger.push({
        id: `iwal_${Date.now()}_seed`,
        type: 'SEED_OPENING',
        direction: 'in',
        amount: need,
        campaign_id: '',
        campaign_title: 'Opening balance',
        proposal_id: seedId,
        note: 'Opening credit so prior investments/donations reconcile (ledger only).',
        created_at: new Date(0).toISOString()
      });
    }
    bal = 0;
  }
  w.balance = Math.max(0, bal);
  persistS3InvestorWalletStore();
  syncInvestorWalletAccountToSupabase(investorId);
  return w;
};

export const creditInvestorWalletManualDeposit = ({ investorId, amount, method, depositId, reference }) => {
  const iid = String(investorId || '');
  const amt = Number(amount);
  if (!iid || !Number.isFinite(amt) || amt <= 0) return null;
  const w = ensureInvestorWallet(iid);
  const did = String(depositId || '');
  if (did && w.ledger.some((row) => row.proposal_id === `deposit_${did}` && row.type === 'MANUAL_DEPOSIT')) {
    return w;
  }
  w.ledger.unshift({
    id: `iwal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'MANUAL_DEPOSIT',
    direction: 'in',
    amount: amt,
    campaign_id: '',
    campaign_title: 'Wallet Add Money',
    proposal_id: did ? `deposit_${did}` : '',
    note: `Admin-verified manual deposit${reference ? ' · ref ' + reference : ''}.`,
    method: method || 'other',
    created_at: new Date().toISOString()
  });
  persistS3InvestorWalletStore();
  return recomputeInvestorWalletBalance(iid);
};

export const debitInvestorWallet = ({ investorId, amount, type, title, note, refId, campaignId, requireFunds = true }) => {
  const iid = String(investorId || '');
  const amt = Number(amount);
  if (!iid || !Number.isFinite(amt) || amt <= 0) {
    return { ok: false, error: 'Enter a valid amount.' };
  }
  const w = ensureInvestorWallet(iid);
  recomputeInvestorWalletBalance(iid);
  const bal = Number(w.balance || 0);
  const rid = String(refId || `ref_${Date.now()}`);
  if (w.ledger.some((row) => row.proposal_id === rid && row.direction === 'out')) {
    return { ok: true, wallet: w, duplicate: true };
  }
  if (requireFunds && bal < amt) {
    return {
      ok: false,
      error: `Not enough money in wallet. Available ৳ ${bal.toLocaleString()}. Add Money first.`
    };
  }
  w.ledger.unshift({
    id: `iwal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: type || 'WALLET_OUT',
    direction: 'out',
    amount: amt,
    campaign_id: String(campaignId || ''),
    campaign_title: title || 'Wallet transfer',
    proposal_id: rid,
    note: note || 'Wallet debit.',
    created_at: new Date().toISOString()
  });
  persistS3InvestorWalletStore();
  return { ok: true, wallet: recomputeInvestorWalletBalance(iid) };
};

export const syncInvestorWallet = (investorId) => {
  const iid = String(investorId || '');
  if (!iid) return ensureInvestorWallet('');
  fallbackProposals.forEach((p) => {
    if (String(p.investor_id || p.investorId || '') !== iid) return;
    if (String(p.status || '').toLowerCase() !== 'accepted') return;
    const pid = String(p.id || p._id || '');
    if (!pid) return;
    debitInvestorWallet({
      investorId: iid,
      amount: Number(p.counter_amount != null && Number(p.counter_amount) > 0 ? p.counter_amount : p.amount) || 0,
      type: 'INVESTMENT_OUT',
      title: p.campaign_title || p.campaign_id || 'Investment',
      campaignId: p.campaign_id || p.campaignId,
      note: 'Accepted investment funded from investor wallet (ledger only).',
      refId: `inv_out_${pid}`,
      requireFunds: false
    });
  });
  fallbackReliefDonations.forEach((d) => {
    if (String(d.investor_id || '') !== iid) return;
    debitInvestorWallet({
      investorId: iid,
      amount: d.amount,
      type: 'RELIEF_OUT',
      title: d.drive_title || d.drive_id || 'Relief',
      campaignId: d.drive_id,
      note: 'Relief donation from investor wallet (ledger only).',
      refId: `relief_out_${d.id}`,
      requireFunds: false
    });
  });
  return recomputeInvestorWalletBalance(iid);
};

// ============================================================================
// 7. ENTITY NORMALIZERS
// ============================================================================
export const normalizeUser = (u) => {
  if (!u) return null;
  const status = u.vetting_status || u.vettingStatus || (u.role === 'admin' ? 'verified' : 'pending');
  return {
    _id: u.id || u._id,
    id: u.id || u._id,
    name: u.name,
    email: u.email,
    role: u.role || 'founder',
    vettingStatus: status,
    vetting_status: status,
    mfsNumber: u.mfs_number || u.mfsNumber || '',
    mfs_number: u.mfs_number || u.mfsNumber || '',
    university: u.university || '',
    studentId: u.student_id || u.studentId || '',
    studentIdCardImage: u.student_id_card_image || u.studentIdCardImage || '',
    nidCardImage: u.nid_card_image || u.nidCardImage || '',
    department: u.department || '',
    nid: u.nid || '',
    institution: u.institution || '',
    affiliationStatus: u.affiliation_status || u.affiliationStatus || '',
    passingYear: u.passing_year || u.passingYear || '',
    bio: u.bio || ''
  };
};

export const normalizeCampaign = (c) => {
  if (!c) return null;
  const fId = c.founder_id || c.founderId || (typeof c.founder === 'object' ? (c.founder?._id || c.founder?.id) : c.founder);
  const foundUser = fallbackUsers.find(u => u.id === fId || u._id === fId);
  const status = c.status || (c.verified === true ? 'verified' : 'pending');
  const isVerified = c.verified !== undefined ? Boolean(c.verified) : (status === 'verified');
  const builtFounder = foundUser ? {
    _id: foundUser.id || foundUser._id,
    id: foundUser.id || foundUser._id,
    name: foundUser.name,
    email: foundUser.email,
    university: foundUser.university,
    department: foundUser.department,
    studentId: foundUser.studentId || foundUser.student_id,
    mfsNumber: foundUser.mfsNumber || foundUser.mfs_number,
    vettingStatus: foundUser.vettingStatus || foundUser.vetting_status || 'verified',
    bio: foundUser.bio || ''
  } : {
    _id: fId || 'unknown_founder',
    id: fId || 'unknown_founder',
    name: 'Unknown Founder',
    email: '',
    university: c.university || '',
    department: '',
    studentId: '',
    mfsNumber: '',
    vettingStatus: 'pending',
    bio: ''
  };

  const founderObj = (typeof c.founder === 'object' && c.founder?.name)
    ? {
        ...builtFounder,
        ...c.founder,
        bio: c.founder.bio || builtFounder.bio || '',
        email: c.founder.email || builtFounder.email || '',
        department: c.founder.department || builtFounder.department || '',
        id: c.founder.id || c.founder._id || builtFounder.id,
        _id: c.founder._id || c.founder.id || builtFounder._id
      }
    : builtFounder;

  const coFounders = getCoFounders(c);
  const firstCf = coFounders[0];

  return {
    _id: c.id || c._id,
    id: c.id || c._id,
    title: c.title,
    founderId: fId,
    founder_id: fId,
    founder: founderObj,
    university: c.university || founderObj.university || '',
    location: c.location || 'Dhaka, Bangladesh',
    category: c.category || 'Startup Venture',
    stage: c.stage || 'MVP Stage',
    goal: Number(c.goal || 0),
    raised: Number(c.raised || 0),
    equityOffer: c.equity_offer || c.equityOffer || '8% Revenue Share',
    equity_offer: c.equity_offer || c.equityOffer || '8% Revenue Share',
    tagline: c.tagline || '',
    coverPhoto: c.cover_photo || c.coverPhoto || '',
    pitchVideoUrl: c.pitch_video_url || c.pitchVideoUrl || '',
    description: c.description || '',
    milestones: c.milestones || [],
    verified: isVerified,
    status: status,
    escrowFrozen: c.escrow_frozen || c.escrowFrozen || false,
    escrow_frozen: c.escrow_frozen || c.escrowFrozen || false,
    coFounders,
    co_founders: coFounders,
    successorName: c.successorName || c.successor_name || firstCf?.name || '',
    successor_name: c.successor_name || c.successorName || firstCf?.name || '',
    successorEmail: c.successorEmail || c.successor_email || firstCf?.email || '',
    successor_email: c.successor_email || c.successorEmail || firstCf?.email || ''
  };
};

export const normalizeProposal = (p) => {
  if (!p) return null;
  let sidecar = null;
  const rawNotes = p.custom_notes || p.customNotes || '';
  if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawNotes);
      if (parsed && parsed._s3_negotiate) sidecar = parsed;
    } catch (e) {}
  }
  const counterFrom = (v) =>
    v !== undefined && v !== null && v !== '' ? Number(v) : null;
  return {
    _id: p.id || p._id,
    id: p.id || p._id,
    campaign_id: p.campaign_id || p.campaignId || (typeof p.campaign === 'object' ? p.campaign?.id : p.campaign),
    campaignId: p.campaign_id || p.campaignId || (typeof p.campaign === 'object' ? p.campaign?.id : p.campaign),
    investor_id: p.investor_id || p.investorId || (typeof p.investor === 'object' ? p.investor?._id : p.investor),
    investorId: p.investor_id || p.investorId || (typeof p.investor === 'object' ? p.investor?._id : p.investor),
    amount: Number(p.amount || 0),
    terms: p.terms || p.return_structure || 'Standard Terms',
    return_structure: p.return_structure || p.terms || 'Standard Terms',
    custom_notes: sidecar ? (sidecar.original_notes || '') : rawNotes,
    status: (() => {
      const base = String(p.status || 'pending').toLowerCase();
      const side = String(sidecar?.status || '').toLowerCase();
      const rank = (s) => ({ withdrawn: 4, accepted: 3, declined: 3, rejected: 3, negotiating: 2, pending: 1 }[s] || 1);
      return rank(side) > rank(base) ? side : (p.status || 'pending');
    })(),
    created_at: p.created_at || p.createdAt || new Date().toISOString(),
    investor_name: p.investor_name || p.investorName || '',
    founder_id: p.founder_id || p.founderId || '',
    counter_amount: counterFrom(p.counter_amount) ?? counterFrom(sidecar?.counter_amount),
    counter_terms: p.counter_terms || sidecar?.counter_terms || '',
    negotiate_message: p.negotiate_message || sidecar?.negotiate_message || '',
    negotiated_at: p.negotiated_at || sidecar?.negotiated_at || ''
  };
};

export const s3OverlayLocalProposals = (uniqueMap, matchFn) => {
  fallbackProposals.forEach((raw) => {
    if (typeof matchFn === 'function' && !matchFn(raw)) return;
    const n = normalizeProposal(raw);
    if (n && n.id) uniqueMap.set(n.id, n);
  });
  return uniqueMap;
};

export const s3EmitProposalUpdated = (proposal) => {
  const io = getIO();
  if (!proposal || !io) return;
  const n = normalizeProposal(proposal);
  if (!n) return;
  const invId = n.investor_id || n.investorId;
  if (invId) io.to(String(invId)).emit('proposal_updated', n);
  io.emit('proposal_updated', n);
};

export const s3SyncProposalToSupabase = async (fp) => {
  if (!isSupabaseConfigured || !supabase || !fp) return;
  const id = fp.id || fp._id;
  if (!id) return;
  const status = String(fp.status || 'pending').toLowerCase();
  const sidecar = JSON.stringify({
    _s3_negotiate: true,
    status,
    counter_amount: fp.counter_amount ?? null,
    counter_terms: fp.counter_terms || '',
    negotiate_message: fp.negotiate_message || '',
    negotiated_at: fp.negotiated_at || '',
    original_notes: typeof fp.custom_notes === 'string' && !fp.custom_notes.trim().startsWith('{')
      ? fp.custom_notes
      : ''
  });
  try {
    const full = {
      status,
      amount: Number(fp.amount || 0),
      terms: fp.terms || fp.return_structure || '',
      custom_notes: sidecar,
      counter_amount: fp.counter_amount ?? null,
      counter_terms: fp.counter_terms || null,
      negotiate_message: fp.negotiate_message || null,
      negotiated_at: fp.negotiated_at || null
    };
    const { error } = await supabase.from('proposals').update(full).eq('id', id);
    if (error) {
      await supabase.from('proposals').update({
        status: status === 'negotiating' ? 'pending' : status,
        amount: Number(fp.amount || 0),
        terms: fp.terms || fp.return_structure || '',
        custom_notes: sidecar
      }).eq('id', id);
    }
  } catch (e) {}
};

export const getReliefDonationSummary = (driveId) => {
  const fromLedger = fallbackReliefDonations.filter((row) => String(row.drive_id) === driveId);
  const total = fromLedger.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const donorsCount = fromLedger.length;
  return { total, donorsCount, donors: fromLedger.slice(0, 10) };
};

// Open disputes user freeze sync on startup
export const syncOpenComplaintsUserFreeze = async () => {
  try {
    let disputes = [...fallbackDisputes];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('disputes').select('*');
      if (Array.isArray(data)) {
        const byId = new Map(disputes.map(d => [d.id, d]));
        data.forEach(d => { if (d && d.id) byId.set(d.id, d); });
        disputes = Array.from(byId.values());
      }
    }
    const openDisputes = disputes.filter(d => d.status !== 'Dismissed' && d.status !== 'Resolved' && !String(d.status || '').toLowerCase().includes('dismiss'));
    for (const disp of openDisputes) {
      const rUser = disp.reported_user || disp.reportedUser;
      const rUserId = disp.reported_user_id || disp.reportedUserId;
      if (rUserId || rUser) {
        if (isSupabaseConfigured && supabase) {
          if (rUserId) {
            await supabase.from('users').update({ vetting_status: 'frozen' }).eq('id', rUserId);
          } else if (rUser) {
            await supabase.from('users').update({ vetting_status: 'frozen' }).eq('name', rUser);
          }
        }
        const fu = fallbackUsers.find(u => (rUserId && (u.id === rUserId || u._id === rUserId)) || (rUser && u.name === rUser));
        if (fu) {
          fu.vettingStatus = 'frozen';
          fu.vetting_status = 'frozen';
        }
      }
    }
  } catch (e) {
    console.warn('Sync open complaints freeze notice:', e.message);
  }
};
setTimeout(syncOpenComplaintsUserFreeze, 3000);
