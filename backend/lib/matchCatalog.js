import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.join(__dirname, '..');

dotenv.config({ path: path.join(BACKEND_DIR, '.env') });
dotenv.config({ path: path.join(BACKEND_DIR, '..', '.env') });

const SEED_PATH = path.join(BACKEND_DIR, 'seed_generated.json');
const CAMPAIGN_STORE_PATH = path.join(BACKEND_DIR, 's3_campaign_store.json');
const PROPOSALS_PATH = path.join(BACKEND_DIR, 's3_proposals.json');
const PREFS_PATH = path.join(BACKEND_DIR, 's3_user_prefs.json');

const SECTOR_POOL = [
  'FoodTech / SaaS',
  'AgriTech / IoT',
  'EdTech',
  'CleanTech',
  'FinTech',
  'HealthTech',
  'Logistics / Supply Chain',
  'E-Commerce / Marketplace',
  'AI / Robotics',
  'Biotech'
];

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function asId(value) {
  return String(value || '').trim();
}

function parseSectors(value) {
  if (Array.isArray(value)) {
    return value.map((s) => String(s || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function defaultInvestorPrefs(user) {
  const id = asId(user.id || user._id);
  const n = Number((id.match(/(\d+)$/) || [])[1] || 1);
  const primary = SECTOR_POOL[(n - 1) % SECTOR_POOL.length];
  const secondary = SECTOR_POOL[n % SECTOR_POOL.length];
  return {
    investment_budget_min: 200000 + ((n - 1) % 8) * 50000,
    investment_budget_max: 900000 + ((n - 1) % 8) * 200000,
    sector_interests: [primary, secondary]
  };
}

function deriveRevenueStructure(campaign) {
  const explicit = campaign.revenue_structure || campaign.revenueStructure;
  if (explicit) return explicit;
  const offer = String(campaign.equity_offer || campaign.equityOffer || '');
  if (/rev/i.test(offer)) return 'Revenue Share';
  if (/equity/i.test(offer)) return 'Equity';
  if (/note|convertible/i.test(offer)) return 'Convertible Note';
  if (/debt/i.test(offer)) return 'Debt';
  return offer || 'unspecified';
}

function deriveOperationalModel(campaign) {
  if (campaign.operational_model || campaign.operationalModel) {
    return campaign.operational_model || campaign.operationalModel;
  }
  const category = String(campaign.category || '').toLowerCase();
  if (category.includes('marketplace') || category.includes('e-commerce')) return 'Marketplace';
  if (category.includes('saas') || category.includes('fintech') || category.includes('edtech')) return 'B2B';
  if (category.includes('health') || category.includes('food')) return 'B2C';
  return 'B2B';
}

export function loadUserPrefs() {
  const parsed = readJson(PREFS_PATH, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function persistUserMatchingPrefs(userId, patch) {
  const id = asId(userId);
  if (!id) return;
  const prefs = loadUserPrefs();
  const next = { ...(prefs[id] || {}) };
  for (const [key, value] of Object.entries(patch || {})) {
    if (value !== undefined) next[key] = value;
  }
  next.updated_at = new Date().toISOString();
  prefs[id] = next;
  writeJson(PREFS_PATH, prefs);
}

function applyPrefs(user) {
  const id = asId(user.id || user._id);
  const saved = loadUserPrefs()[id] || {};
  const defaults = String(user.role || '').toLowerCase() === 'investor' ? defaultInvestorPrefs(user) : {};
  const sectors = parseSectors(
    saved.sector_interests ?? user.sector_interests ?? user.sectorInterests ?? defaults.sector_interests
  );
  return {
    ...user,
    id,
    _id: id,
    name: user.name || '',
    institution: user.institution || '',
    university: user.university || '',
    department: user.department || '',
    bio: user.bio || '',
    role: user.role || 'founder',
    vetting_status: user.vetting_status || user.vettingStatus || 'pending',
    investment_budget_min: Number(
      saved.investment_budget_min ?? user.investment_budget_min ?? user.investmentBudgetMin ?? defaults.investment_budget_min ?? 0
    ) || null,
    investment_budget_max: Number(
      saved.investment_budget_max ?? user.investment_budget_max ?? user.investmentBudgetMax ?? defaults.investment_budget_max ?? 0
    ) || null,
    sector_interests: sectors
  };
}

export function loadLocalUsers() {
  const seed = readJson(SEED_PATH, {});
  const users = [...(seed.founders || []), ...(seed.investors || []), ...(seed.admins || [])];
  return users.map(applyPrefs);
}

export function loadLocalCampaigns() {
  const seed = readJson(SEED_PATH, {});
  const byId = new Map();
  for (const camp of [...(seed.campaigns || []), ...readJson(CAMPAIGN_STORE_PATH, [])]) {
    if (!camp) continue;
    const id = asId(camp.id || camp._id);
    if (!id) continue;
    byId.set(id, {
      ...camp,
      id,
      title: camp.title || 'Untitled campaign',
      founder_id: camp.founder_id || camp.founderId || camp.founder?.id || camp.founder?._id || '',
      university: camp.university || '',
      location: camp.location || '',
      category: camp.category || '',
      stage: camp.stage || '',
      goal: Number(camp.goal || 0),
      raised: Number(camp.raised || 0),
      equity_offer: camp.equity_offer || camp.equityOffer || '',
      tagline: camp.tagline || '',
      description: camp.description || '',
      status: camp.status || (camp.verified ? 'verified' : 'pending'),
      verified: camp.verified === true || camp.status === 'verified',
      revenue_structure: deriveRevenueStructure(camp),
      operational_model: deriveOperationalModel(camp)
    });
  }
  return Array.from(byId.values());
}

export function loadLocalProposals() {
  return readJson(PROPOSALS_PATH, []);
}

export async function loadInvestorRecord(investorId) {
  const id = asId(investorId);
  if (!id) return null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, institution, university, department, bio, role, vetting_status, investment_budget_min, investment_budget_max, sector_interests')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return applyPrefs(data);
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return applyPrefs(data);
    } catch (e) {}
  }

  try {
    const { fallbackUsers } = await import('../utils/storeUtils.js');
    const fu = fallbackUsers.find((u) => asId(u.id || u._id) === id);
    if (fu) return applyPrefs(fu);
  } catch (e) {}

  const local = loadLocalUsers().find((u) => asId(u.id) === id && String(u.role).toLowerCase() === 'investor')
    || loadLocalUsers().find((u) => asId(u.id) === id);
  if (local) return local;

  return applyPrefs({
    id,
    name: 'Angel Investor',
    role: 'investor',
    institution: 'Angel Investor Network',
    vetting_status: 'verified'
  });
}

export async function loadVerifiedCampaigns() {
  let rows = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, founder_id, university, location, category, stage, goal, raised, equity_offer, tagline, description, status, verified, revenue_structure, operational_model');
      if (!error && Array.isArray(data) && data.length) rows = data;
    } catch (e) {}
    if (!rows.length) {
      try {
        const { data, error } = await supabase.from('campaigns').select('*');
        if (!error && Array.isArray(data) && data.length) rows = data;
      } catch (e) {}
    }
  }
  const local = loadLocalCampaigns();
  const byId = new Map();
  for (const camp of [...rows.map((c) => ({
    ...c,
    revenue_structure: deriveRevenueStructure(c),
    operational_model: deriveOperationalModel(c),
    verified: c.verified === true || c.status === 'verified'
  })), ...local]) {
    byId.set(asId(camp.id), camp);
  }
  return Array.from(byId.values()).filter((c) => c.verified === true || String(c.status).toLowerCase() === 'verified');
}

export async function loadCampaignRecord(campaignId) {
  const id = asId(campaignId);
  const local = loadLocalCampaigns().find((c) => asId(c.id) === id);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, founder_id, university, location, category, stage, goal, raised, equity_offer, tagline, description, status, verified, revenue_structure, operational_model')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return {
          ...data,
          ...local,
          ...data,
          revenue_structure: deriveRevenueStructure({ ...local, ...data }),
          operational_model: deriveOperationalModel({ ...local, ...data })
        };
      }
    } catch (e) {}
  }
  return local || null;
}

export async function loadCampaignsForFounder(founderId) {
  const id = asId(founderId);
  const all = await loadVerifiedCampaigns();
  const owned = all.filter((c) => asId(c.founder_id || c.founderId) === id);
  if (owned.length) return owned;
  return loadLocalCampaigns().filter((c) => asId(c.founder_id) === id);
}

export async function loadVerifiedInvestors() {
  let rows = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, institution, university, department, bio, role, vetting_status, investment_budget_min, investment_budget_max, sector_interests')
        .eq('role', 'investor');
      if (!error && Array.isArray(data) && data.length) rows = data;
    } catch (e) {}
    if (!rows.length) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'investor');
        if (!error && Array.isArray(data) && data.length) rows = data;
      } catch (e) {}
    }
  }
  const local = loadLocalUsers().filter((u) => String(u.role).toLowerCase() === 'investor');
  const byId = new Map();
  for (const user of [...rows, ...local]) {
    const enriched = applyPrefs(user);
    byId.set(asId(enriched.id), enriched);
  }
  return Array.from(byId.values()).filter((u) => {
    const status = String(u.vetting_status || u.vettingStatus || '').toLowerCase();
    return status === 'verified' || status === '';
  });
}


export function investorSkipCampaignIds(investorId) {
  const id = asId(investorId);
  const skip = new Set();
  for (const p of loadLocalProposals()) {
    const inv = asId(p.investor_id || p.investorId);
    const status = String(p.status || '').toLowerCase();
    if (inv === id && (status === 'accepted' || status === 'funded')) {
      skip.add(asId(p.campaign_id || p.campaignId));
    }
  }
  return skip;
}
