import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';

// Mongoose Models
import User from './models/User.js';
import Campaign from './models/Campaign.js';
import Proposal from './models/Proposal.js';
import Payout from './models/Payout.js';
import Dispute from './models/Dispute.js';
import AuditLog from './models/AuditLog.js';
import Message from './models/Message.js';
import CampaignUpdate from './models/CampaignUpdate.js';
import Notification from './models/Notification.js';
import bcrypt from 'bcryptjs';

dotenv.config();


import aiMatchRoutes from './routes/aiMatchRoutes.js';
import { persistUserMatchingPrefs, loadInvestorRecord } from './lib/matchCatalog.js';
import { getInvestorMatches } from './services/aiMatchmakingService.js';


// Supabase Integration
import { supabase, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable socket.io integration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/ai', aiMatchRoutes);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Notice: Could not create uploads directory:', err.message);
}

// Serve uploaded documents statically
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const cpUpload = upload.fields([
  { name: 'studentIdCardImage', maxCount: 1 },
  { name: 'nidCardImage', maxCount: 1 },
  { name: 'nidOrPassportImage', maxCount: 1 },
  { name: 'credentialsImage', maxCount: 1 }
]);

// IN-MEMORY FALLBACK STORE
const fallbackUsers = [];

// Populate trimmed demo users (10 founders / 10 investors / optional admins in seed)
try {
  const seedPath = path.join(__dirname, 'seed_generated.json');
  if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedSeed = JSON.parse(rawData);
    if (Array.isArray(parsedSeed.founders)) fallbackUsers.push(...parsedSeed.founders);
    if (Array.isArray(parsedSeed.investors)) fallbackUsers.push(...parsedSeed.investors);
    if (Array.isArray(parsedSeed.admins)) fallbackUsers.push(...parsedSeed.admins);
  }
} catch (e) {
  console.warn('Seed generated JSON read warning:', e.message);
}

// Default admins (exactly 2 for local demo)
const ensureDefaultAdmins = () => {
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

const fallbackCampaigns = [];

// Populate kept demo campaigns (one per kept founder)
try {
  const seedPath = path.join(__dirname, 'seed_generated.json');
  if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedSeed = JSON.parse(rawData);
    if (Array.isArray(parsedSeed.campaigns)) fallbackCampaigns.push(...parsedSeed.campaigns);
  }
} catch (e) {
  console.warn('Seed campaigns read warning:', e.message);
}

// S3: persist investment campaigns so create/edit/milestones survive backend restarts
const S3_CAMPAIGN_STORE_PATH = path.join(__dirname, 's3_campaign_store.json');

// S3
const loadS3CampaignStore = () => {
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

// S3
const persistS3CampaignStore = () => {
  try {
    fs.writeFileSync(S3_CAMPAIGN_STORE_PATH, JSON.stringify(fallbackCampaigns, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 campaign store save warning:', e.message);
  }
};

loadS3CampaignStore(); // S3

// S3: prefer the richer campaign when seed/Supabase duplicates the same live pitch (e.g. campusbites vs campusbites_1)
const s3CampaignDedupeKey = (c) => {
  const title = String(c?.title || '').trim().toLowerCase();
  const fid = String(c?.founder_id || c?.founderId || c?.founder?._id || c?.founder?.id || '').trim();
  return `${title}::${fid || 'unknown'}`;
};
const s3CampaignRichnessScore = (c) => {
  if (!c) return -1;
  const ms = Array.isArray(c.milestones) ? c.milestones.length : 0;
  const proofs = Array.isArray(c.milestones)
    ? c.milestones.reduce((n, m) => n + (Array.isArray(m?.proofs) ? m.proofs.length : 0), 0)
    : 0;
  const id = String(c.id || c._id || '');
  // Prefer local Sprint-3 ids (…_1) and records that actually have a milestone plan
  return ms * 1000 + proofs * 10 + (id.endsWith('_1') ? 50 : 0) + (id.includes('_') ? 5 : 0);
};
const s3DedupeLiveCampaigns = (list) => {
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

// S3: login id may be a Supabase uuid while persisted rows use usr_founder_1
const S3_DEMO_FOUNDER_EMAIL = 'ashraf.khan1@univ.edu.bd';
const s3FounderOwnerKeys = async (founderId) => {
  const keys = new Set([String(founderId || '')]);
  const fb = fallbackUsers.find((u) => String(u.id || u._id) === String(founderId));
  if (fb) {
    keys.add(String(fb.id || fb._id));
    if (String(fb.email || '').toLowerCase() === S3_DEMO_FOUNDER_EMAIL) keys.add('usr_founder_1');
  }
  if (String(founderId) === 'usr_founder_1') keys.add('usr_founder_1');
  return keys;
};
const s3CampaignOwnedBy = (c, keys) => {
  const owners = [c.founder?._id, c.founder?.id, c.founder_id, c.founderId, typeof c.founder === 'string' ? c.founder : null]
    .filter(Boolean)
    .map((x) => String(x));
  return owners.some((o) => keys.has(o));
};
// S3: My Campaigns / My Relief include accepted co-founders (not only primary owner)
const s3FounderAccessKeys = async (founderId) => {
  const keys = await s3FounderOwnerKeys(founderId);
  const fb = fallbackUsers.find((u) => String(u.id || u._id) === String(founderId));
  if (fb?.email) keys.add(String(fb.email).toLowerCase());
  if (String(founderId || '').includes('@')) keys.add(String(founderId).toLowerCase());
  return keys;
};
const s3IsCoFounderOf = (obj, keys) => {
  return getCoFounders(obj).some((c) => {
    const id = String(c.id || '');
    const email = String(c.email || '').toLowerCase();
    return (id && keys.has(id)) || (email && keys.has(email));
  });
};
const s3CampaignAccessibleBy = (c, keys) => s3CampaignOwnedBy(c, keys) || s3IsCoFounderOf(c, keys);
const annotateViewerRole = (item, keys) => {
  const role = s3CampaignOwnedBy(item, keys) ? 'owner' : (s3IsCoFounderOf(item, keys) ? 'cofounder' : 'owner');
  return { ...item, viewerRole: role, viewer_role: role };
};

// S3: post-approval edit requests (max 2 working days; BD weekend Fri+Sat)
const S3_EDIT_REQUEST_STORE_PATH = path.join(__dirname, 's3_edit_requests.json');
const fallbackEditRequests = [];

// S3
const addWorkingDaysBD = (fromDate, days) => {
  const d = new Date(fromDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 5 && wd !== 6) added++; // skip Friday & Saturday
  }
  return d.toISOString();
};

// S3
const loadS3EditRequestStore = () => {
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

// S3
const persistS3EditRequestStore = () => {
  try {
    fs.writeFileSync(S3_EDIT_REQUEST_STORE_PATH, JSON.stringify(fallbackEditRequests, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 edit-request store save warning:', e.message);
  }
};

loadS3EditRequestStore(); // S3

// S3: handover responsibility requests (pending admin; then transfer founder_id)
const S3_HANDOVER_STORE_PATH = path.join(__dirname, 's3_handover_requests.json');
const fallbackHandoverRequests = [];
const loadS3HandoverStore = () => {
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
const persistS3HandoverStore = () => {
  try {
    fs.writeFileSync(S3_HANDOVER_STORE_PATH, JSON.stringify(fallbackHandoverRequests, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 handover store save warning:', e.message);
  }
};
loadS3HandoverStore(); // S3

const namesRoughlyMatch = (a, b) => {
  const na = String(a || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nb = String(b || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
};

const findPlatformUserByEmail = (email) => {
  const em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  return fallbackUsers.find((u) => String(u.email || '').toLowerCase() === em) || null;
};

// S3: designated successor must be an existing founder (optional field)
const assertSuccessorIsFounder = (successorName, successorEmail, founderId) => {
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

// S3: co-founders — up to 3 existing founders (joint partners). Legacy successor_* maps to first slot.
const MAX_COFOUNDERS = 3;
const toCoFounderEntry = (u) => ({
  id: String(u.id || u._id || ''),
  name: u.name || '',
  email: u.email || '',
  university: u.university || '',
  department: u.department || '',
  status: 'active'
});
const resolveCoFounderEntries = (rawList, founderId) => {
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
const legacyCoFoundersFromSuccessor = (obj) => {
  const email = obj?.successorEmail || obj?.successor_email;
  const name = obj?.successorName || obj?.successor_name;
  if (!email && !name) return [];
  const check = assertSuccessorIsFounder(name, email, obj.founder_id || obj.founderId);
  if (check.ok && check.successor) return [toCoFounderEntry(check.successor)];
  return [];
};
const getCoFounders = (obj) => {
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
const syncSuccessorFromCoFounders = (obj, coFounders) => {
  const list = Array.isArray(coFounders) ? coFounders.slice(0, MAX_COFOUNDERS) : [];
  obj.coFounders = list;
  obj.co_founders = list;
  const first = list[0];
  obj.successorName = obj.successor_name = first?.name || '';
  obj.successorEmail = obj.successor_email = first?.email || '';
  return obj;
};
const resolveCoFoundersFromBody = (body, founderId, existing) => {
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

// S3: co-founder applications (reason-only; primary founder accepts/rejects/removes)
const S3_COFOUNDER_APP_STORE_PATH = path.join(__dirname, 's3_cofounder_applications.json');
const fallbackCoFounderApplications = [];
const loadS3CoFounderAppStore = () => {
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
const persistS3CoFounderAppStore = () => {
  try {
    fs.writeFileSync(S3_COFOUNDER_APP_STORE_PATH, JSON.stringify(fallbackCoFounderApplications, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 co-founder application store save warning:', e.message);
  }
};
loadS3CoFounderAppStore();

const findCampaignOrRelief = (targetType, targetId) => {
  const tid = String(targetId || '');
  if (targetType === 'relief') {
    const drive = fallbackReliefDrives.find((d) => String(d.id || d._id) === tid);
    return drive ? { kind: 'relief', item: drive } : null;
  }
  const cmp = fallbackCampaigns.find((c) => String(c.id || c._id) === tid);
  return cmp ? { kind: 'investment', item: cmp } : null;
};

const fallbackProposals = [];

// S3: persist proposals so founder Investors tab survives restart
const S3_PROPOSAL_STORE_PATH = path.join(__dirname, 's3_proposals.json');
const loadS3ProposalStore = () => {
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
const persistS3ProposalStore = () => {
  try {
    fs.writeFileSync(S3_PROPOSAL_STORE_PATH, JSON.stringify(fallbackProposals, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 proposal store save warning:', e.message);
  }
};
loadS3ProposalStore(); // S3
const fallbackPayouts = [];
const fallbackMessages = [];
const fallbackUpdates = [];
const fallbackProgressTags = {}; // S3: { [campaignId]: string[] }

// S3: persist chat so two-way threads survive restart (Supabase + local file)
const S3_MESSAGE_STORE_PATH = path.join(__dirname, 's3_messages.json');
const loadS3MessageStore = () => {
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
const persistS3MessageStore = () => {
  try {
    fs.writeFileSync(S3_MESSAGE_STORE_PATH, JSON.stringify(fallbackMessages, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 message store save warning:', e.message);
  }
};
loadS3MessageStore(); // S3
const hydrateChatFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (error || !Array.isArray(data)) {
      if (error) console.warn('S3 supabase chat hydrate:', error.message);
      return;
    }
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
hydrateChatFromSupabase(); // S3

const persistChatMessageS3 = async (msgObj) => {
  if (!msgObj) return;
  if (!fallbackMessages.some((m) => m.id === msgObj.id)) fallbackMessages.push(msgObj);
  persistS3MessageStore();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('messages').insert([msgObj]);
    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
      console.warn('S3 supabase chat insert:', error.message);
    }
  }
};

// S3: founder audit log (Supabase audit_logs + file). Does not change GET /api/audit-logs
const fallbackAuditLogs = [];
const S3_AUDIT_STORE_PATH = path.join(__dirname, 's3_audit_logs.json');
const loadS3AuditStore = () => {
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
const persistS3AuditStore = () => {
  try {
    fs.writeFileSync(S3_AUDIT_STORE_PATH, JSON.stringify(fallbackAuditLogs, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 audit store save warning:', e.message);
  }
};
loadS3AuditStore(); // S3
const founderIdFromAuditId = (id) => {
  const s = String(id || '');
  const m = s.match(/^aud::(.+)::\d+$/);
  return m ? m[1] : '';
};
const hydrateAuditFromSupabase = async () => {
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
hydrateAuditFromSupabase(); // S3
const writeFounderAuditLog = async ({ founderId, category, title, status = 'RECORDED' }) => {
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
    const { error } = await supabase.from('audit_logs').insert([{
      id: row.id,
      hash: row.hash,
      category: row.category,
      title: row.title,
      status: row.status,
      latency: row.latency,
      created_at: row.created_at
    }]);
    if (error) console.warn('S3 supabase audit insert:', error.message);
  }
};

// S3: investor-scoped audit (same store, tagged — never shown as founder audit)
const writeInvestorAuditLog = async ({ investorId, category, title, status = 'RECORDED' }) => {
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
      const { error } = await supabase.from('audit_logs').insert([{
        id: row.id,
        hash: row.hash,
        category: row.category,
        title: row.title,
        status: row.status,
        latency: row.latency,
        created_at: row.created_at
      }]);
      if (error) console.warn('S3 supabase investor audit insert:', error.message);
    } catch (e) {}
  }
  return row;
};
const auditBelongsToInvestor = (r, investorId) => {
  if (!r || !investorId) return false;
  if (String(r.actor_role || '').toLowerCase() === 'founder') return false;
  if (r.founder_id && !r.investor_id && String(r.actor_role || '').toLowerCase() !== 'investor') return false;
  if (r.investor_id) return String(r.investor_id) === String(investorId);
  const fromId = founderIdFromAuditId(r.id); // same aud::userId:: pattern
  return String(fromId) === String(investorId);
};
const auditBelongsToFounder = (r, founderId) => {
  if (!r || !founderId) return false;
  if (String(r.actor_role || '').toLowerCase() === 'investor') return false;
  if (r.investor_id && !r.founder_id) return false;
  const fid = r.founder_id || founderIdFromAuditId(r.id);
  return String(fid) === String(founderId);
};

// S3: persist progress announcements so they survive server restart
const S3_UPDATE_STORE_PATH = path.join(__dirname, 's3_campaign_updates.json');
const loadS3UpdateStore = () => {
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
const persistS3UpdateStore = () => {
  try {
    fs.writeFileSync(S3_UPDATE_STORE_PATH, JSON.stringify(fallbackUpdates, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 campaign-update store save warning:', e.message);
  }
};
loadS3UpdateStore(); // S3

// S3: persist custom progress tags
const S3_PROGRESS_TAG_STORE_PATH = path.join(__dirname, 's3_progress_tags.json');
const loadS3ProgressTagStore = () => {
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
const persistS3ProgressTagStore = () => {
  try {
    fs.writeFileSync(S3_PROGRESS_TAG_STORE_PATH, JSON.stringify(fallbackProgressTags, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 progress-tag store save warning:', e.message);
  }
};
loadS3ProgressTagStore(); // S3

// S3: persist payout requests
const S3_PAYOUT_STORE_PATH = path.join(__dirname, 's3_payouts.json');
const loadS3PayoutStore = () => {
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
const persistS3PayoutStore = () => {
  try {
    fs.writeFileSync(S3_PAYOUT_STORE_PATH, JSON.stringify(fallbackPayouts, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 payout store save warning:', e.message);
  }
};
loadS3PayoutStore(); // S3

// S3: pending payout total for a founder (local + optional Supabase rows)
const s3IsPendingPayoutStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return s.includes('pending') || s === 'requested' || s.includes('awaiting');
};
const s3PendingPayoutTotal = async (founderId) => {
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

// S3: founder security deposit ledger (recorded amount; not a payment gateway)
const S3_DEPOSIT_STORE_PATH = path.join(__dirname, 's3_security_deposits.json');
const fallbackSecurityDeposits = {};
const loadS3DepositStore = () => {
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
const persistS3DepositStore = () => {
  try {
    fs.writeFileSync(S3_DEPOSIT_STORE_PATH, JSON.stringify(fallbackSecurityDeposits, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 security-deposit store save warning:', e.message);
  }
};
loadS3DepositStore(); // S3

// S3: founder wallet ledger (demo credits from accepted investments — no payment gateway)
const S3_WALLET_STORE_PATH = path.join(__dirname, 's3_founder_wallets.json');
const fallbackWallets = {};
const loadS3WalletStore = () => {
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
const persistS3WalletStore = () => {
  try {
    fs.writeFileSync(S3_WALLET_STORE_PATH, JSON.stringify(fallbackWallets, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 wallet store save warning:', e.message);
  }
};
// S3: mirror founder wallet account into Supabase when table exists
const syncFounderWalletAccountToSupabase = async (founderId) => {
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
  } catch (e) {
    /* table may not exist yet — local JSON still persists */
  }
};
loadS3WalletStore(); // S3

// S3: manual wallet top-ups (bKash/bank/other) — proof required, admin verifies
const S3_WALLET_DEPOSIT_STORE_PATH = path.join(__dirname, 's3_wallet_deposits.json');
const fallbackWalletDeposits = [];
const loadS3WalletDepositStore = () => {
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
const persistS3WalletDepositStore = () => {
  try {
    fs.writeFileSync(S3_WALLET_DEPOSIT_STORE_PATH, JSON.stringify(fallbackWalletDeposits, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 wallet deposit store save warning:', e.message);
  }
};
// S3: upsert one deposit row to Supabase (founder + investor)
const syncWalletDepositToSupabase = async (deposit) => {
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
  } catch (e) {
    /* table may not exist yet */
  }
};
const hydrateWalletDepositsFromSupabase = async () => {
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
loadS3WalletDepositStore(); // S3
hydrateWalletDepositsFromSupabase(); // S3

const ensureFounderWallet = (founderId) => {
  const id = String(founderId || '');
  if (!id) return { balance: 0, ledger: [] };
  if (!fallbackWallets[id]) fallbackWallets[id] = { balance: 0, ledger: [] };
  if (!Array.isArray(fallbackWallets[id].ledger)) fallbackWallets[id].ledger = [];
  return fallbackWallets[id];
};
const creditFounderWalletInvestment = ({
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

// S3: credit founder wallet when an investor donates to their relief campaign
const creditFounderWalletReliefDonation = ({
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

// S3: backfill wallet credits for relief donations already on file
const syncFounderWalletFromReliefDonations = async (founderId) => {
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

// S3: debit wallet for bond / self-fund (shared helper)
const debitFounderWallet = ({ founderId, amount, type, title, note, refId, campaignId }) => {
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

// S3: personal (Add Money) balance — never investment/donation credits
// Used for security deposit + founder relief donations from pocket (bKash/bank top-ups)
const founderWalletPersonalAvailable = (founderId) => {
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

// S3: debit only from personal Add Money pool (shared by security + relief self-donate)
const debitFounderWalletFromPersonal = ({ founderId, amount, type, title, note, refId, campaignId, purposeLabel }) => {
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

// S3: move funds from personal Add Money balance → security deposit bond
const debitFounderWalletForSecurityDeposit = ({ founderId, amount, depositRowId }) => {
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

// S3: credit after admin approves a manual Add Money request
const creditFounderWalletManualDeposit = ({ founderId, amount, method, depositId, reference }) => {
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
const syncFounderWalletFromAcceptedProposals = async (founderId) => {
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
  // S3: seed wallet with prior campaign raised not already covered by accepted credits
  // so Overview escrow and Wallet stay aligned (wallet no longer “starts from zero”)
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

// ============================================================================
// S3: INVESTOR WALLET (mirror of founder wallet — Add Money + outs for invest/donate)
// ============================================================================
const S3_INVESTOR_WALLET_STORE_PATH = path.join(__dirname, 's3_investor_wallets.json');
const fallbackInvestorWallets = {};
const loadS3InvestorWalletStore = () => {
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
const persistS3InvestorWalletStore = () => {
  try {
    fs.writeFileSync(S3_INVESTOR_WALLET_STORE_PATH, JSON.stringify(fallbackInvestorWallets, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 investor wallet store save warning:', e.message);
  }
};
const syncInvestorWalletAccountToSupabase = async (investorId) => {
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
loadS3InvestorWalletStore(); // S3

const ensureInvestorWallet = (investorId) => {
  const id = String(investorId || '');
  if (!id) return { balance: 0, ledger: [] };
  if (!fallbackInvestorWallets[id]) fallbackInvestorWallets[id] = { balance: 0, ledger: [] };
  if (!Array.isArray(fallbackInvestorWallets[id].ledger)) fallbackInvestorWallets[id].ledger = [];
  return fallbackInvestorWallets[id];
};
const recomputeInvestorWalletBalance = (investorId) => {
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
  // Opening credit so historical outs (pre-wallet) reconcile without a negative balance
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
const creditInvestorWalletManualDeposit = ({ investorId, amount, method, depositId, reference }) => {
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
const debitInvestorWallet = ({ investorId, amount, type, title, note, refId, campaignId, requireFunds = true }) => {
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
const syncInvestorWallet = (investorId) => {
  const iid = String(investorId || '');
  if (!iid) return ensureInvestorWallet('');
  // Accepted investments → outs
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
  // Relief donations → outs
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

const fallbackWatchlist = [];
const fallbackConnections = [];
const fallbackBookmarkedFounders = [];
const fallbackNotifications = [
  { id: 'notif_1', user_id: 'usr_founder_1', title: 'New Proposal Received', message: 'Angel Backer Zaman submitted an 8% Rev. Share proposal for CampusBites.', type: 'info', is_read: false, created_at: new Date().toISOString() },
  { id: 'notif_2', user_id: 'usr_investor_1', title: 'Vetting Verified', message: 'Your investor identity vetting has been approved by platform administration.', type: 'success', is_read: true, created_at: new Date().toISOString() }
];

// NORMALIZATION HELPERS
const normalizeUser = (u) => {
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
    bio: u.bio || '',
    investmentBudgetMin: u.investment_budget_min ?? u.investmentBudgetMin ?? null,
    investmentBudgetMax: u.investment_budget_max ?? u.investmentBudgetMax ?? null,
    investment_budget_min: u.investment_budget_min ?? u.investmentBudgetMin ?? null,
    investment_budget_max: u.investment_budget_max ?? u.investmentBudgetMax ?? null,
    sectorInterests: Array.isArray(u.sector_interests) ? u.sector_interests : (u.sectorInterests || []),
    sector_interests: Array.isArray(u.sector_interests) ? u.sector_interests : (u.sectorInterests || [])
  };
};

const normalizeCampaign = (c) => {
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
  // Always merge bio/email from platform user so watch + relief profiles stay consistent
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
    successor_email: c.successor_email || c.successorEmail || firstCf?.email || '',
    revenue_structure: c.revenue_structure || c.revenueStructure || '',
    operational_model: c.operational_model || c.operationalModel || ''
  };
};

const normalizeProposal = (p) => {
  if (!p) return null;
  // S3: recover counter fields from custom_notes sidecar when Supabase lacks columns
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
    // S3: founder negotiate counters (additive fields)
    investor_name: p.investor_name || p.investorName || '',
    founder_id: p.founder_id || p.founderId || '',
    counter_amount: counterFrom(p.counter_amount) ?? counterFrom(sidecar?.counter_amount),
    counter_terms: p.counter_terms || sidecar?.counter_terms || '',
    negotiate_message: p.negotiate_message || sidecar?.negotiate_message || '',
    negotiated_at: p.negotiated_at || sidecar?.negotiated_at || ''
  };
};

// S3: local s3_proposals wins over stale Supabase/Mongo rows (founder accept/negotiate)
const s3OverlayLocalProposals = (uniqueMap, matchFn) => {
  fallbackProposals.forEach((raw) => {
    if (typeof matchFn === 'function' && !matchFn(raw)) return;
    const n = normalizeProposal(raw);
    if (n && n.id) uniqueMap.set(n.id, n);
  });
  return uniqueMap;
};

// S3: push proposal change to investor sockets (additive; does not replace notifications)
const s3EmitProposalUpdated = (proposal) => {
  if (!proposal || typeof io === 'undefined' || !io) return;
  const n = normalizeProposal(proposal);
  if (!n) return;
  const invId = n.investor_id || n.investorId;
  if (invId) io.to(String(invId)).emit('proposal_updated', n);
  io.emit('proposal_updated', n);
};

// S3: sync negotiate/accept into Supabase (sidecar in custom_notes if columns missing)
const s3SyncProposalToSupabase = async (fp) => {
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

// Helper function to create and broadcast real-time notifications
async function createAndDispatchNotification(userId, title, message, type = 'info') {
  const notifObj = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString()
  };
  fallbackNotifications.unshift(notifObj);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('notifications').insert([notifObj]);
    } catch (e) {}
  }

  // Socket.io real-time broadcast
  if (typeof io !== 'undefined' && io) {
    io.to(userId).emit('receive_notification', notifObj);
    io.emit('new_notification_broadcast', notifObj);
  }
  return notifObj;
}

// Health Check API
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let provider = 'none';
  if (isSupabaseConfigured && supabase) {
    dbStatus = 'connected';
    provider = 'supabase';
  } else if (mongoose.connection.readyState === 1) {
    dbStatus = 'connected';
    provider = 'mongodb';
  } else {
    dbStatus = 'in_memory_fallback';
  }

  res.status(200).json({ 
    status: 'healthy', 
    database: dbStatus,
    provider,
    supabaseConfigured: isSupabaseConfigured
  });
});

// AUTHENTICATION & USER MANAGEMENT APIS
app.post('/api/users/register', cpUpload, async (req, res) => {
  try {
    const { name, email, password, role, university, studentId, department, nid, dob, affiliationStatus, institution, passingYear, nidOrPassport, bankOrMfs, credentialsLink, mfsNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;

    const newUserObj = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      vetting_status: 'pending',
      vettingStatus: 'pending',
      mfs_number: mfsNumber || '01700000000',
      mfsNumber: mfsNumber || '01700000000',
      university: university || '',
      student_id: studentId || '',
      department: department || '',
      nid: nid || '',
      institution: institution || '',
      affiliation_status: affiliationStatus || '',
      passing_year: passingYear || ''
    };

    let createdUser = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').insert([{
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          vetting_status: 'pending',
          mfs_number: mfsNumber || '01700000000',
          university: university || '',
          student_id: studentId || '',
          department: department || '',
          nid: nid || '',
          institution: institution || '',
          affiliation_status: affiliationStatus || '',
          passing_year: passingYear || ''
        }]).select().single();

        if (supaUser) createdUser = normalizeUser(supaUser);
      } catch (e) {
        console.warn('Supabase register insert warning:', e.message);
      }
    }

    if (!createdUser && mongoose.connection.readyState === 1) {
      try {
        const mongoUser = await User.create({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          mfsNumber: mfsNumber || '01700000000',
          university,
          studentId,
          department,
          nid,
          institution,
          affiliationStatus,
          passingYear
        });
        createdUser = normalizeUser(mongoUser);
      } catch (e) {
        console.warn('Mongo register warning:', e.message);
      }
    }

    const fallbackUser = normalizeUser(newUserObj);
    fallbackUsers.push(fallbackUser);

    const userToReturn = createdUser || fallbackUser;

    res.status(201).json({
      message: 'Registration successful.',
      user: userToReturn,
      token: 'jwt-auth-token-db'
    });
  } catch (err) {
    console.error('Error during register:', err);
    res.status(500).json({ error: 'Server error during user registration.' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = null;
    // Prefer local trimmed seed so each founder gets a stable usr_founder_N id
    // (Supabase still has the old 100-founder dump with mismatched ids).
    const fbLogin = fallbackUsers.find((u) => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
    if (fbLogin) {
      user = normalizeUser(fbLogin);
      user.password = fbLogin.password;
    }

    if (!user && isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
        if (supaUser) {
          user = normalizeUser(supaUser);
          user.password = supaUser.password;
        }
      } catch (e) {
        user = null;
      }
    }

    if (!user && mongoose.connection.readyState === 1) {
      try {
        const mongoUser = await User.findOne({ email: email.toLowerCase() });
        if (mongoUser) {
          user = normalizeUser(mongoUser);
          user.password = mongoUser.password;
        }
      } catch (e) {
        user = null;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    let matches = false;
    if (user.password === password) {
      matches = true;
    } else if (user.password) {
      try {
        matches = await bcrypt.compare(password, user.password);
      } catch (e) {
        matches = false;
      }
    }

    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    res.status(200).json({
      message: 'Authentication successful.',
      token: user.role === 'admin' ? 'jwt-admin-token-db-active' : 'jwt-user-token-db-active',
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vettingStatus: user.vettingStatus,
        mfsNumber: user.mfsNumber,
        university: user.university,
        nid: user.nid,
        institution: user.institution,
        designation: user.passingYear,
        investmentBudgetMin: user.investmentBudgetMin,
        investmentBudgetMax: user.investmentBudgetMax,
        sectorInterests: user.sectorInterests
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;

    const fbAdmin = fallbackUsers.find(
      (u) => String(u.email || '').toLowerCase() === String(email || '').toLowerCase() && u.role === 'admin'
    );
    if (fbAdmin) user = normalizeUser(fbAdmin);

    if (!user && isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).eq('role', 'admin').single();
        if (supaUser) user = normalizeUser(supaUser);
      } catch (e) {}
    }

    if (!user && mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email, role: 'admin' });
      } catch (e) {}
    }

    if (!user) {
      user = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'admin');
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    res.status(200).json({
      message: 'Admin authentication successful.',
      token: 'jwt-admin-token-db-active',
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during administrator login.' });
  }
});

// VETTING QUEUE & USER CONTROL APIS
app.get('/api/vetting/applicants', async (req, res) => {
  try {
    let pendingUsers = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('vetting_status', 'pending');
      if (!error && data) pendingUsers = data.map(normalizeUser);
    } else if (mongoose.connection.readyState === 1) {
      const users = await User.find({ vettingStatus: 'pending' });
      if (users) pendingUsers = users.map(normalizeUser);
    } else {
      pendingUsers = fallbackUsers.filter(u => u.role !== 'admin' && (u.vettingStatus === 'pending' || u.vetting_status === 'pending')).map(normalizeUser);
    }

    // Fallback seed if queue empty for demo testing
    if (pendingUsers.length === 0 && fallbackUsers.length > 0) {
      const demoApplicant = fallbackUsers.find(u => u.email === 'anika@brac.edu.bd') || fallbackUsers.find(u => u.role === 'founder');
      if (demoApplicant) {
        demoApplicant.vettingStatus = 'pending';
        demoApplicant.vetting_status = 'pending';
        pendingUsers.push(normalizeUser(demoApplicant));
      }
    }
    res.status(200).json(pendingUsers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching vetting applicants.' });
  }
});

app.post('/api/vetting/status', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) return res.status(400).json({ error: 'User ID and status are required.' });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update({ vetting_status: status, vetting_date: new Date().toISOString() }).eq('id', userId);
      } catch (e) {}
    }
    if (mongoose.connection.readyState === 1) {
      try {
        await User.findByIdAndUpdate(userId, { vettingStatus: status });
      } catch (e) {}
    }

    const fu = fallbackUsers.find(u => u.id === userId || u._id === userId);
    if (fu) {
      fu.vettingStatus = status;
      fu.vetting_status = status;
      fu.vettingDate = new Date().toISOString();
    }

    await createAndDispatchNotification(
      userId,
      `Trust Vetting Status Updated! 🛡️`,
      `Your FundBridge user profile vetting status has been updated to "${status.toUpperCase()}".`,
      status === 'verified' ? 'success' : 'warning'
    );

    res.status(200).json({ message: `Applicant status updated to ${status}.`, user: fu ? normalizeUser(fu) : { id: userId, vettingStatus: status } });
  } catch (err) {
    res.status(500).json({ error: 'Error updating vetting status.' });
  }
});

app.post('/api/admin/users/:userId/hold', async (req, res) => {
  try {
    const { userId } = req.params;
    const fu = fallbackUsers.find(u => u.id === userId || u._id === userId);
    let newStatus = 'hold';
    if (fu) {
      newStatus = (fu.vettingStatus === 'hold' || fu.vetting_status === 'hold') ? 'verified' : 'hold';
      fu.vettingStatus = newStatus;
      fu.vetting_status = newStatus;
    }

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('users').update({ vetting_status: newStatus }).eq('id', userId); } catch (e) {}
    }

    res.status(200).json({ message: `User hold status toggled to ${newStatus}.`, vettingStatus: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling user hold status.' });
  }
});

app.post('/api/admin/users/:userId/block', async (req, res) => {
  try {
    const { userId } = req.params;
    const fu = fallbackUsers.find(u => u.id === userId || u._id === userId);
    let newStatus = 'blocked';
    if (fu) {
      newStatus = (fu.vettingStatus === 'blocked' || fu.vetting_status === 'blocked') ? 'verified' : 'blocked';
      fu.vettingStatus = newStatus;
      fu.vetting_status = newStatus;
    }

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('users').update({ vetting_status: newStatus }).eq('id', userId); } catch (e) {}
    }

    res.status(200).json({ message: `User status set to ${newStatus}.`, user: fu ? normalizeUser(fu) : { id: userId, vettingStatus: newStatus } });
  } catch (err) {
    res.status(500).json({ error: 'Error blocking user.' });
  }
});

app.put('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const fu = fallbackUsers.find(u => u.id === userId || u._id === userId);
    if (fu) {
      Object.assign(fu, updates);
    }
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('users').update(updates).eq('id', userId); } catch (e) {}
    }
    res.status(200).json({ message: 'User profile updated by admin.', user: fu ? normalizeUser(fu) : { id: userId } });
  } catch (err) {
    res.status(500).json({ error: 'Error updating user profile.' });
  }
});

app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const idx = fallbackUsers.findIndex(u => u.id === userId || u._id === userId);
    if (idx >= 0) fallbackUsers.splice(idx, 1);

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('users').delete().eq('id', userId); } catch (e) {}
    }
    res.status(200).json({ message: 'User deleted from database.' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing user.' });
  }
});

app.get('/api/admin/users/founders', async (req, res) => {
  try {
    const local = fallbackUsers.filter((u) => u.role === 'founder').map(normalizeUser);
    if (local.length > 0) return res.status(200).json(local);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'founder');
      if (!error && data) return res.status(200).json(data.map(normalizeUser));
    }
    if (mongoose.connection.readyState === 1) {
      const founders = await User.find({ role: 'founder' });
      if (founders) return res.status(200).json(founders.map(normalizeUser));
    }
    res.status(200).json([]);
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'founder').map(normalizeUser));
  }
});

app.get('/api/users/founders', async (req, res) => {
  try {
    // Local trimmed catalog only (do not leak Supabase's old 100-founder dump)
    const local = fallbackUsers.filter((u) => u.role === 'founder').map(normalizeUser);
    if (local.length > 0) return res.status(200).json(local);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'founder');
      if (!error && data) return res.status(200).json(data.map(normalizeUser));
    }
    if (mongoose.connection.readyState === 1) {
      const founders = await User.find({ role: 'founder' });
      if (founders) return res.status(200).json(founders.map(normalizeUser));
    }
    res.status(200).json([]);
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'founder').map(normalizeUser));
  }
});

app.get('/api/admin/users/investors', async (req, res) => {
  try {
    const local = fallbackUsers.filter((u) => u.role === 'investor').map(normalizeUser);
    if (local.length > 0) return res.status(200).json(local);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'investor');
      if (!error && data) return res.status(200).json(data.map(normalizeUser));
    }
    if (mongoose.connection.readyState === 1) {
      const investors = await User.find({ role: 'investor' });
      if (investors) return res.status(200).json(investors.map(normalizeUser));
    }
    res.status(200).json([]);
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'investor').map(normalizeUser));
  }
});

// S3: investor directory for founder UI — trimmed local seed only
app.get('/api/investors/directory', async (req, res) => {
  try {
    const local = fallbackUsers.filter((u) => u.role === 'investor').map(normalizeUser);
    res.status(200).json(local);
  } catch (err) {
    res.status(200).json([]);
  }
});

// S3: one investor profile for founder detail panel (does not change normalizeUser or admin routes)
app.get('/api/investors/:investorId/profile', async (req, res) => {
  try {
    const { investorId } = req.params;
    const raw = fallbackUsers.find(
      (u) => u.role === 'investor' && String(u.id || u._id) === String(investorId)
    );
    let extra = raw || null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', investorId).maybeSingle();
        if (!error && data && (data.role === 'investor' || !data.role)) extra = { ...(raw || {}), ...data };
      } catch (e) {}
    }
    if (!extra) return res.status(404).json({ error: 'Investor not found.' });
    const catalogInvestor = await loadInvestorRecord(investorId);
    const n = normalizeUser({ ...extra, ...(catalogInvestor || {}) });

    const investorProposals = fallbackProposals.filter((p) =>
      String(p.investor_id || p.investorId || '') === String(investorId)
    );
    const portfolio = investorProposals
      .filter((p) => String(p.status || '').toLowerCase() === 'accepted')
      .map((p) => {
        const campaignId = p.campaign_id || p.campaignId;
        const campaign = fallbackCampaigns.find((c) => String(c.id || c._id) === String(campaignId));
        return {
          campaignId,
          title: campaign?.title || 'FundBridge startup investment',
          category: campaign?.category || 'Startup Venture',
          amount: Number(p.counter_amount || p.amount || 0),
          returnStructure: p.return_structure || p.returnStructure || p.terms || 'Investment terms recorded',
          status: p.status
        };
      });
    const totalDeployed = portfolio.reduce((sum, item) => sum + item.amount, 0);
    const investorActivity = fallbackAuditLogs
      .filter((row) => auditBelongsToInvestor(row, investorId))
      .filter((row) => ['PROPOSAL', 'PORTFOLIO', 'INVESTMENT'].includes(String(row.category || '').toUpperCase()))
      .slice(0, 8)
      .map((row) => ({ category: row.category, title: row.title, status: row.status, created_at: row.created_at }));

    res.status(200).json({
      profile: {
        id: n.id,
        name: n.name,
        role: n.role,
        institution: n.institution,
        affiliationStatus: n.affiliationStatus,
        passingYear: n.passingYear,
        bio: n.bio,
        sectorInterests: n.sectorInterests,
        investmentBudgetMin: n.investmentBudgetMin,
        investmentBudgetMax: n.investmentBudgetMax,
        vettingStatus: n.vettingStatus
      },
      trackRecord: {
        investmentsMade: portfolio.length,
        totalDeployed,
        proposalsSubmitted: investorProposals.length,
        verifiedPartner: n.vettingStatus === 'verified'
      },
      portfolio,
      activity: investorActivity
    });
  } catch (err) {
    res.status(404).json({ error: 'Investor not found.' });
  }
});

// Public founder profile for investor review: identity, full business history,
// computed track record, and sanitized campaign activity only.
app.get('/api/founders/:founderId/profile', async (req, res) => {
  try {
    const { founderId } = req.params;
    const raw = fallbackUsers.find(
      (u) => u.role === 'founder' && String(u.id || u._id) === String(founderId)
    );
    if (!raw) return res.status(404).json({ error: 'Founder not found.' });

    const profile = normalizeUser(raw);
    const businesses = fallbackCampaigns
      .filter((campaign) => String(campaign.founder_id || campaign.founderId || campaign.founder?._id || campaign.founder?.id) === String(founderId))
      .map((campaign) => {
        const normalized = normalizeCampaign(campaign);
        return {
          id: normalized.id,
          title: normalized.title,
          category: normalized.category,
          stage: normalized.stage,
          university: normalized.university,
          location: normalized.location,
          tagline: normalized.tagline,
          description: normalized.description,
          goal: normalized.goal,
          raised: normalized.raised,
          equityOffer: normalized.equityOffer || normalized.equity_offer,
          status: normalized.status,
          verified: normalized.verified,
          milestones: Array.isArray(normalized.milestones) ? normalized.milestones.map((milestone) => ({
            title: milestone.title || milestone.name,
            target: milestone.target || milestone.targetDate,
            status: milestone.status
          })) : []
        };
      });
    const completedMilestones = businesses.reduce(
      (sum, business) => sum + business.milestones.filter((milestone) => String(milestone.status).toLowerCase() === 'done').length,
      0
    );
    const founderActivity = fallbackAuditLogs
      .filter((row) => auditBelongsToFounder(row, founderId))
      .filter((row) => ['CAMPAIGN', 'PROGRESS', 'MILESTONE'].includes(String(row.category || '').toUpperCase()))
      .slice(0, 8)
      .map((row) => ({ category: row.category, title: row.title, status: row.status, created_at: row.created_at }));

    res.status(200).json({
      profile: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        university: profile.university,
        department: profile.department,
        studentId: profile.studentId,
        bio: profile.bio,
        vettingStatus: profile.vettingStatus
      },
      trackRecord: {
        businessesStarted: businesses.length,
        verifiedBusinesses: businesses.filter((business) => business.verified || business.status === 'verified').length,
        totalRaised: businesses.reduce((sum, business) => sum + Number(business.raised || 0), 0),
        completedMilestones
      },
      businesses,
      activity: founderActivity
    });
  } catch (err) {
    res.status(404).json({ error: 'Founder not found.' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    let fc = fallbackUsers.filter(u => u.role === 'founder').length;
    let ic = fallbackUsers.filter(u => u.role === 'investor').length;
    if (isSupabaseConfigured && supabase) {
      const { data: usersData } = await supabase.from('users').select('role');
      if (usersData) {
        fc = usersData.filter(u => u.role === 'founder').length;
        ic = usersData.filter(u => u.role === 'investor').length;
      }
    }
    res.status(200).json({ totalFounders: fc, totalInvestors: ic });
  } catch (err) {
    res.status(200).json({ totalFounders: 1, totalInvestors: 1 });
  }
});

app.get('/api/disputes', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
      if (!error && data) return res.status(200).json(data);
    }
    res.status(200).json([]);
  } catch (err) {
    res.status(200).json([]);
  }
});


// CAMPAIGN MANAGEMENT & ADMIN AUDIT APIS
app.get('/api/campaigns', async (req, res) => {
  try {
    let rawList = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*');
      if (!error && data) rawList = data.map(normalizeCampaign);
    } else if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find();
      if (campaigns) rawList = campaigns.map(normalizeCampaign);
    } else {
      rawList = fallbackCampaigns.map(normalizeCampaign);
    }
    // Filter public listing to verified campaigns only
    const verifiedPublic = rawList.filter(c => c && (c.status === 'verified' || c.verified === true));
    // S3: merge local verified campaigns (local wins) so investor MY INVESTMENTS can join local accepts
    const byId = new Map();
    verifiedPublic.forEach((c) => {
      const id = c && (c.id || c._id);
      if (id) byId.set(id, c);
    });
    fallbackCampaigns.map(normalizeCampaign).forEach((c) => {
      if (!c || !(c.status === 'verified' || c.verified === true)) return;
      const id = c.id || c._id;
      if (id) byId.set(id, c);
    });
    // S3: drop hollow seed duplicates (e.g. campusbites ৳450k with 0 milestones vs campusbites_1)
    res.status(200).json(s3DedupeLiveCampaigns(Array.from(byId.values())));
  } catch (err) {
    const verifiedPublic = fallbackCampaigns.map(normalizeCampaign).filter(c => c && (c.status === 'verified' || c.verified === true));
    res.status(200).json(s3DedupeLiveCampaigns(verifiedPublic));
  }
});

// S3: live campaigns a founder can watch (verified), including persisted local store — does not change GET /api/campaigns
app.get('/api/campaigns/watchable', async (req, res) => {
  try {
    // Local trimmed catalog only — Supabase still holds the old 50+ campaign dump
    const byId = new Map();
    for (const raw of fallbackCampaigns) {
      const c = normalizeCampaign(raw);
      if (!c) continue;
      const live = c.verified === true || ['verified', 'open', 'live'].includes(String(c.status || '').toLowerCase());
      if (!live) continue;
      const id = c.id || c._id;
      if (id) byId.set(id, c);
    }
    res.status(200).json(s3DedupeLiveCampaigns([...byId.values()]));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.get('/api/admin/campaigns/pending', async (req, res) => {
  try {
    let allCampaigns = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*');
      if (!error && data) allCampaigns = data.map(normalizeCampaign);
    } else if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find();
      if (campaigns) allCampaigns = campaigns.map(normalizeCampaign);
    } else {
      allCampaigns = fallbackCampaigns.map(normalizeCampaign);
    }

    const pending = allCampaigns.filter(c => c && (c.status === 'pending' || c.status === 'revisions' || !c.verified));
    
    // Ensure demo pending campaign exists for testing if queue is empty
    if (pending.length === 0 && fallbackCampaigns.length > 0) {
      const firstCamp = fallbackCampaigns[0];
      firstCamp.status = 'pending';
      firstCamp.verified = false;
      pending.push(normalizeCampaign(firstCamp));
    }
    
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pending campaigns.' });
  }
});

app.post('/api/admin/campaigns/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ status: 'verified', verified: true }).eq('id', id);
      } catch (e) {}
    }
    if (mongoose.connection.readyState === 1) {
      try {
        await Campaign.findOneAndUpdate({ id }, { status: 'verified', verified: true });
      } catch (e) {}
    }

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) {
      cmp.status = 'verified';
      cmp.verified = true;
    }

    const founderId = cmp?.founder_id || cmp?.founder?._id || 'usr_founder_1';
    await createAndDispatchNotification(
      founderId,
      `Startup Pitch Approved! 🚀`,
      `Your campaign "${cmp?.title || 'pitch'}" has passed Super Admin verification and is now LIVE in the public investment directory.`,
      'success'
    );

    res.status(200).json({ message: 'Campaign verified and published successfully.', campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying campaign.' });
  }
});

app.post('/api/admin/campaigns/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ status: 'rejected', verified: false }).eq('id', id);
      } catch (e) {}
    }

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) {
      cmp.status = 'rejected';
      cmp.verified = false;
      cmp.rejectionReason = reason;
    }

    const founderId = cmp?.founder_id || cmp?.founder?._id || 'usr_founder_1';
    await createAndDispatchNotification(
      founderId,
      `Campaign Audit Status: Rejected ❌`,
      `Your pitch "${cmp?.title || 'campaign'}" was not approved by Admin. Reason: ${reason || 'Compliance threshold mismatch'}.`,
      'warning'
    );

    res.status(200).json({ message: 'Campaign rejected.', campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error rejecting campaign.' });
  }
});

app.post('/api/admin/campaigns/:id/reupload', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedbackNotes } = req.body;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ status: 'revisions', verified: false }).eq('id', id);
      } catch (e) {}
    }

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) {
      cmp.status = 'revisions';
      cmp.verified = false;
      cmp.feedbackNotes = feedbackNotes;
    }

    const founderId = cmp?.founder_id || cmp?.founder?._id || 'usr_founder_1';
    await createAndDispatchNotification(
      founderId,
      `Campaign Revisions Requested 📝`,
      `Admin requested document revisions for "${cmp?.title || 'pitch'}": ${feedbackNotes || 'Please update milestone targets'}.`,
      'info'
    );

    res.status(200).json({ message: 'Revision request logged.', campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error requesting revisions.' });
  }
});

app.post('/api/admin/campaigns/:id/pause-funding', async (req, res) => {
  try {
    const { id } = req.params;
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    let newStatus = 'funding_paused';
    if (cmp) {
      newStatus = cmp.status === 'funding_paused' ? 'verified' : 'funding_paused';
      cmp.status = newStatus;
    }
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaigns').update({ status: newStatus }).eq('id', id); } catch (e) {}
    }
    res.status(200).json({ message: `Funding status toggled to ${newStatus}`, campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error pausing funding.' });
  }
});

app.post('/api/admin/campaigns/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) {
      cmp.status = 'blocked';
      cmp.verified = false;
    }
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaigns').update({ status: 'blocked', verified: false }).eq('id', id); } catch (e) {}
    }
    res.status(200).json({ message: 'Campaign blocked.', campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error blocking campaign.' });
  }
});

app.post('/api/admin/campaigns/:id/freeze-funds', async (req, res) => {
  try {
    const { id } = req.params;
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    let frozen = true;
    if (cmp) {
      frozen = !cmp.escrowFrozen;
      cmp.escrowFrozen = frozen;
      cmp.escrow_frozen = frozen;
    }
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaigns').update({ escrow_frozen: frozen }).eq('id', id); } catch (e) {}
    }
    res.status(200).json({ message: `Escrow freeze state set to ${frozen}`, campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error freezing escrow funds.' });
  }
});

app.post('/api/admin/campaigns/:id/freeze', async (req, res) => {
  try {
    const { id } = req.params;
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    let frozen = true;
    if (cmp) {
      frozen = !cmp.escrowFrozen;
      cmp.escrowFrozen = frozen;
      cmp.escrow_frozen = frozen;
    }
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaigns').update({ escrow_frozen: frozen }).eq('id', id); } catch (e) {}
    }
    res.status(200).json({ message: `Escrow freeze state set to ${frozen}`, campaign: cmp ? normalizeCampaign(cmp) : null });
  } catch (err) {
    res.status(500).json({ error: 'Error freezing escrow funds.' });
  }
});

app.get('/api/admin/escrow/pending', async (req, res) => {
  try {
    const escQueue = [];
    const pendingStatuses = new Set(['pending review', 'pending_review', 'active', 'Pending Review']);
    fallbackCampaigns.forEach(c => {
      if (Array.isArray(c.milestones)) {
        c.milestones.forEach((m, idx) => {
          const st = String(m.status || '');
          if (pendingStatuses.has(st) || pendingStatuses.has(st.toLowerCase())) {
            escQueue.push({
              kind: 'campaign', // S3
              campaignId: c.id || c._id,
              milestoneId: idx.toString(),
              title: c.title,
              founderName: c.founder?.name || 'Student Founder',
              university: c.university || 'University',
              milestoneTitle: m.title || `Tranche #${idx + 1}`,
              target: m.target || 'Current Quarter',
              amount: 150000,
              escrowStatus: m.status,
              proofCount: Array.isArray(m.proofs) ? m.proofs.length : 0 // S3
            });
          }
        });
      }
    });
    // S3: relief milestones await progress verification (no repayment / escrow release)
    fallbackReliefDrives.forEach((d) => {
      ensureReliefMilestones(d);
      if (!Array.isArray(d.milestones)) return;
      d.milestones.forEach((m, idx) => {
        const st = String(m.status || '');
        if (pendingStatuses.has(st) || pendingStatuses.has(st.toLowerCase())) {
          escQueue.push({
            kind: 'relief',
            campaignId: d.id,
            milestoneId: idx.toString(),
            title: d.title,
            founderName: 'Relief Founder',
            university: d.university || 'University',
            milestoneTitle: m.title || `Phase #${idx + 1}`,
            target: m.target || 'Current phase',
            amount: 0,
            escrowStatus: m.status,
            proofCount: Array.isArray(m.proofs) ? m.proofs.length : 0
          });
        }
      });
    });
    res.status(200).json(escQueue);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/admin/escrow/:campaignId/milestones/:milestoneId/approve', async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;
    const idx = Number(milestoneId);
    // S3: relief IDs share this admin approve path but only mark progress complete (no money release)
    if (String(campaignId || '').startsWith('relief_')) {
      const drive = fallbackReliefDrives.find((d) => d.id === campaignId || d._id === campaignId);
      if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
      ensureReliefMilestones(drive);
      if (!drive.milestones[idx]) return res.status(404).json({ error: 'Milestone not found.' });
      drive.milestones[idx].status = 'Completed';
      persistS3ReliefStore(); // S3
      return res.status(200).json({
        message: 'Relief milestone verified (progress only — no repayment).',
        kind: 'relief',
        drive
      });
    }
    const cmp = fallbackCampaigns.find(c => c.id === campaignId || c._id === campaignId);
    if (cmp && Array.isArray(cmp.milestones)) {
      if (cmp.milestones[idx]) {
        cmp.milestones[idx].status = 'Completed';
        persistS3CampaignStore(); // S3
      }
    }
    res.status(200).json({ message: 'Milestone escrow tranche approved and released.', kind: 'campaign' });
  } catch (err) {
    res.status(500).json({ error: 'Error approving milestone escrow release.' });
  }
});

app.get('/api/campaigns/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    // Prefer local trimmed store so old Supabase test campaigns (Ionize, etc.) do not leak
    // Include campaigns where this founder is an accepted co-founder
    const accessKeys = await s3FounderAccessKeys(founderId);
    const local = fallbackCampaigns
      .filter((c) => s3CampaignAccessibleBy(c, accessKeys))
      .map((c) => annotateViewerRole(normalizeCampaign(c), accessKeys));
    if (local.length > 0) return res.status(200).json(local);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*').eq('founder_id', founderId);
      if (!error && data) {
        return res.status(200).json(data.map(normalizeCampaign));
      }
    }
    if (mongoose.connection.readyState === 1) {
      try {
        const campaigns = await Campaign.find({ founder: founderId });
        if (campaigns) return res.status(200).json(campaigns.map(normalizeCampaign));
      } catch (e) {}
    }
    res.status(200).json([]);
  } catch (err) {
    res.status(200).json([]);
  }
});

// S3: founder My Campaigns (owned + co-founded). Local persist wins.
app.get('/api/founders/:founderId/campaigns', async (req, res) => {
  try {
    const { founderId } = req.params;
    const accessKeys = await s3FounderAccessKeys(founderId);
    const byId = new Map();
    const fc = fallbackCampaigns.filter((c) => s3CampaignAccessibleBy(c, accessKeys));
    for (const c of fc.map((row) => annotateViewerRole(normalizeCampaign(row), accessKeys))) {
      const id = c.id || c._id;
      if (id) byId.set(id, c);
    }
    res.status(200).json([...byId.values()]);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { id, title, founderId, university, location, category, stage, goal, durationDays, equityOffer, description, milestones, tagline, coverPhoto, pitchVideoUrl } = req.body;

    if (!title || !founderId) {
      return res.status(400).json({ error: 'Startup Title and Founder ID are required.' });
    }

    // S3: co-founders (max 3); legacy successorName/Email still accepted
    const cfCheck = resolveCoFoundersFromBody(req.body, founderId, null);
    if (!cfCheck.ok) return res.status(400).json({ error: cfCheck.error });
    const coFounders = cfCheck.coFounders;

    const campaignId = id || `cmp_${Date.now()}`;
    const parsedMilestones = milestones && milestones.length > 0 ? milestones : [
      { title: 'MVP Launch', target: 'Month 1', status: 'active' },
      { title: 'First 100 Users', target: 'Month 2', status: 'locked' },
      { title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
    ];

    const campaignData = {
      id: campaignId,
      title,
      founder_id: founderId,
      university: university || 'BRAC University',
      location: location || 'Dhaka, Bangladesh',
      category: category || 'Startup Venture',
      stage: stage || 'MVP Stage',
      goal: Number(goal) || 500000,
      durationDays: Number(durationDays) || 60,
      duration_days: Number(durationDays) || 60,
      raised: 0,
      equity_offer: equityOffer || '8% Revenue Share',
      tagline: tagline || '',
      cover_photo: coverPhoto || '',
      pitch_video_url: pitchVideoUrl || '',
      description: description || title,
      milestones: parsedMilestones,
      verified: false,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };
    syncSuccessorFromCoFounders(campaignData, coFounders);

    let resultCampaign = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaCmp } = await supabase.from('campaigns').upsert([campaignData]).select().single();
        if (supaCmp) resultCampaign = normalizeCampaign(supaCmp);
      } catch (e) {
        console.warn('Supabase campaign upsert error:', e.message);
      }
    }

    if (!resultCampaign && mongoose.connection.readyState === 1) {
      try {
        resultCampaign = await Campaign.findOneAndUpdate({ id: campaignId }, campaignData, { upsert: true, new: true });
        if (resultCampaign) resultCampaign = normalizeCampaign(resultCampaign);
      } catch (mErr) {}
    }

    const normLocal = normalizeCampaign(campaignData);
    const existingIdx = fallbackCampaigns.findIndex(c => c.id === campaignId || c._id === campaignId);
    if (existingIdx >= 0) {
      fallbackCampaigns[existingIdx] = normLocal;
    } else {
      fallbackCampaigns.unshift(normLocal);
    }
    persistS3CampaignStore(); // S3

    res.status(201).json({ message: 'Campaign submitted for Admin vetting & approval.', campaign: resultCampaign || normLocal });
  } catch (err) {
    console.error('Error in /api/campaigns:', err);
    res.status(500).json({ error: 'Server error during campaign creation.' });
  }
});

// INVESTOR PROPOSAL & PORTFOLIO APIS
app.post('/api/campaigns/:id/proposals', async (req, res) => {
  try {
    const { id } = req.params;
    const { investorId, investorName, amount, terms, customNotes } = req.body;

    if (!investorId || !amount || !terms) {
      return res.status(400).json({ error: 'Investor ID, funding amount, and terms are required.' });
    }

    const cmpEarly = fallbackCampaigns.find(c => c.id === id || c._id === id);
    const founderOwnerId = cmpEarly?.founder_id || cmpEarly?.founderId || cmpEarly?.founder?._id || cmpEarly?.founder?.id || '';
    const proposalObj = {
      id: `prop_${Date.now()}`,
      campaign_id: id,
      campaignId: id,
      investor_id: investorId,
      investorId: investorId,
      investor_name: investorName || '',
      investorName: investorName || '',
      founder_id: founderOwnerId || '',
      founderId: founderOwnerId || '',
      amount: Number(amount),
      terms,
      return_structure: terms,
      custom_notes: customNotes || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    let createdProp = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaProp, error } = await supabase.from('proposals').insert([{
          campaign_id: id,
          investor_id: investorId,
          amount: Number(amount),
          terms,
          return_structure: terms,
          custom_notes: customNotes || '',
          status: 'pending'
        }]).select().single();
        if (supaProp) createdProp = normalizeProposal(supaProp);
        if (error) console.warn('Supabase proposal insert warning:', error.message);
      } catch (e) {
        console.warn('Supabase proposal insert warning:', e.message);
      }
    }

    if (!createdProp && mongoose.connection.readyState === 1) {
      try {
        const mongoProp = await Proposal.create({
          campaign: id,
          investor: investorId,
          amount: Number(amount),
          terms,
          status: 'pending'
        });
        if (mongoProp) createdProp = normalizeProposal(mongoProp);
      } catch (e) {
        console.warn('MongoDB proposal insert warning:', e.message);
      }
    }

    const finalProp = createdProp || normalizeProposal(proposalObj);
    if (!finalProp.investor_name && investorName) finalProp.investor_name = investorName;
    if (!finalProp.founder_id && founderOwnerId) finalProp.founder_id = founderOwnerId;
    const existingIdx = fallbackProposals.findIndex(p => p.id === finalProp.id || p._id === finalProp.id);
    if (existingIdx >= 0) {
      fallbackProposals[existingIdx] = finalProp;
    } else {
      fallbackProposals.unshift(finalProp);
    }
    persistS3ProposalStore(); // S3: keep founder Investors tab after restart

    // Send real-time notification to Founder
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    const targetFounderId = finalProp.founder_id || cmp?.founder_id || cmp?.founder?._id || cmp?.founder?.id || 'usr_founder_1';
    await createAndDispatchNotification(
      targetFounderId,
      'New Investment Proposal Received! 💰',
      `${investorName || 'An investor'} submitted a BDT ৳${Number(amount).toLocaleString()} funding proposal for your startup.`,
      'info'
    );

    res.status(201).json({ message: 'Investment proposal submitted to Founder.', proposal: finalProp });
  } catch (err) {
    console.error('Error submitting proposal:', err);
    res.status(500).json({ error: 'Server error submitting backing proposal.' });
  }
});

app.get('/api/proposals/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    let proposalsList = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('campaign_id', campaignId);
        if (!error && Array.isArray(data)) {
          proposalsList.push(...data.map(normalizeProposal));
        }
      } catch (e) {}
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const dbProps = await Proposal.find({ campaign: campaignId });
        if (dbProps && dbProps.length > 0) {
          proposalsList.push(...dbProps.map(normalizeProposal));
        }
      } catch (e) {}
    }

    const fp = fallbackProposals.filter(p => p.campaign_id === campaignId || p.campaignId === campaignId);
    proposalsList.push(...fp.map(normalizeProposal));

    const uniqueMap = new Map();
    proposalsList.forEach(p => {
      if (p && p.id) uniqueMap.set(p.id, p); // S3: last wins (local pushed last)
    });
    // S3: force local store overlay for this campaign
    s3OverlayLocalProposals(uniqueMap, (p) => p.campaign_id === campaignId || p.campaignId === campaignId);

    res.status(200).json(Array.from(uniqueMap.values()));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.get('/api/proposals/investor/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    let proposalsList = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('investor_id', investorId);
        if (!error && Array.isArray(data)) {
          proposalsList.push(...data.map(normalizeProposal));
        }
      } catch (e) {}
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const dbProps = await Proposal.find({ investor: investorId });
        if (dbProps && dbProps.length > 0) {
          proposalsList.push(...dbProps.map(normalizeProposal));
        }
      } catch (e) {}
    }

    const fp = fallbackProposals.filter(p => p.investor_id === investorId || p.investorId === investorId);
    proposalsList.push(...fp.map(normalizeProposal));

    const uniqueMap = new Map();
    proposalsList.forEach(p => {
      if (p && p.id) uniqueMap.set(p.id, p); // S3: last wins (local pushed last)
    });
    // S3: force local store overlay so founder negotiate/accept activates on investor side
    s3OverlayLocalProposals(uniqueMap, (p) => p.investor_id === investorId || p.investorId === investorId);

    // S3: attach campaign titles for investor tables (avoids hardcoded fallbacks)
    const enriched = Array.from(uniqueMap.values()).map((n) => {
      if (!n) return n;
      const camp = fallbackCampaigns.find((c) => (c.id || c._id) === n.campaign_id);
      if (camp?.title) n.campaign_title = camp.title;
      return n;
    });

    res.status(200).json(enriched);
  } catch (err) {
    res.status(200).json([]);
  }
});

// S3: all proposals on this founder’s campaigns (does not change existing campaign/investor proposal routes)
app.get('/api/proposals/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    const ownerKeys = await s3FounderOwnerKeys(founderId);
    const campIds = new Set(
      fallbackCampaigns
        .filter((c) => s3CampaignOwnedBy(c, ownerKeys))
        .map((c) => c.id || c._id)
        .filter(Boolean)
    );
    const enrich = (raw) => {
      const n = normalizeProposal(raw);
      if (!n) return null;
      const inv = fallbackUsers.find((u) => String(u.id || u._id) === String(n.investor_id));
      n.investor_name = raw.investor_name || raw.investorName || inv?.name || n.investor_name || '';
      n.maturity_period = raw.maturity_period || raw.maturityPeriod || n.maturity_period || '';
      const camp = fallbackCampaigns.find((c) => (c.id || c._id) === n.campaign_id);
      n.campaign_title = raw.campaign_title || camp?.title || n.campaign_id;
      // S3: founder negotiate / counter-offer fields
      if (raw.counter_amount != null) n.counter_amount = Number(raw.counter_amount);
      if (raw.counter_terms != null) n.counter_terms = raw.counter_terms;
      if (raw.negotiate_message != null) n.negotiate_message = raw.negotiate_message;
      if (raw.negotiated_at != null) n.negotiated_at = raw.negotiated_at;
      return n;
    };
    const uniqueMap = new Map();
    // S3: pull Supabase first, then local overlay wins
    if (isSupabaseConfigured && supabase && campIds.size > 0) {
      try {
        for (const cid of campIds) {
          const { data, error } = await supabase.from('proposals').select('*').eq('campaign_id', cid);
          if (error || !Array.isArray(data)) continue;
          data.forEach((raw) => {
            const n = enrich(raw);
            if (n && n.id && !uniqueMap.has(n.id)) uniqueMap.set(n.id, n);
          });
        }
      } catch (e) {}
    }
    fallbackProposals.forEach((p) => {
      const n = enrich(p);
      if (!n || !n.id) return;
      const ownedCamp = campIds.has(n.campaign_id);
      const ownedFounder = ownerKeys.has(String(p.founder_id || p.founderId || ''));
      if (ownedCamp || ownedFounder) uniqueMap.set(n.id, n);
    });
    res.status(200).json(Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ));
  } catch (err) {
    res.status(200).json([]);
  }
});

// S3: founder accept/decline without editing the original status handler
app.post('/api/founder/proposals/:proposalId/status', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    const campaignId = req.body.campaignId;
    const founderId = req.body.founderId;
    if (!['accepted', 'declined', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined.' });
    }
    const cmp = fallbackCampaigns.find((c) => c.id === campaignId || c._id === campaignId);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (founderId) {
      const ownerKeys = await s3FounderOwnerKeys(founderId);
      if (!s3CampaignOwnedBy(cmp, ownerKeys)) {
        return res.status(403).json({ error: 'You can only review proposals on your own campaigns.' });
      }
    }
    let fp = fallbackProposals.find((p) => p.id === proposalId || p._id === proposalId);
    // S3: hydrate from Supabase before fabricating a zero-amount stub
    if (!fp && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('proposals').select('*').eq('id', proposalId).maybeSingle();
        if (data) {
          fp = { ...data, id: data.id || proposalId };
          fallbackProposals.unshift(fp);
        }
      } catch (e) {}
    }
    if (!fp) {
      return res.status(404).json({ error: 'Proposal not found. Ask the investor to resubmit.' });
    }
    const cur = String(fp.status || 'pending').toLowerCase();
    if (!['pending', 'negotiating'].includes(cur)) {
      return res.status(400).json({ error: 'This proposal was already reviewed.' });
    }
    // S3: if founder countered, accept uses counter amount/terms
    if (status === 'accepted' && fp.counter_amount != null && Number(fp.counter_amount) > 0) {
      fp.amount = Number(fp.counter_amount);
      if (fp.counter_terms) {
        fp.terms = fp.counter_terms;
        fp.return_structure = fp.counter_terms;
      }
    }
    fp.status = status;
    await s3SyncProposalToSupabase(fp); // S3: sync status/amount/counters to Supabase
    if (status === 'accepted') {
      cmp.raised = Number(cmp.raised || 0) + Number(fp.amount || 0);
      persistS3CampaignStore(); // S3
      // S3: also bump Supabase campaign raised with real accept amount
      if (isSupabaseConfigured && supabase) {
        try {
          const cid = campaignId || cmp.id || cmp._id;
          const { data: cmpData } = await supabase.from('campaigns').select('raised').eq('id', cid).single();
          const nextRaised = Number(cmpData?.raised ?? cmp.raised ?? 0);
          // local already includes bump; prefer local raised for display consistency
          await supabase.from('campaigns').update({ raised: Number(cmp.raised || nextRaised) }).eq('id', cid);
        } catch (e) {}
      }
      // S3: credit founder wallet ledger (no payment gateway)
      const walletFounderId = String(founderId || cmp.founder_id || cmp.founderId || '');
      creditFounderWalletInvestment({
        founderId: walletFounderId,
        amount: fp.amount,
        investorId: fp.investor_id || fp.investorId,
        investorName: fp.investor_name || fp.investorName,
        campaignId: campaignId || cmp.id || cmp._id,
        campaignTitle: cmp.title,
        proposalId: proposalId
      });
      // S3: debit investor wallet (mirror of founder credit)
      const invWalletId = String(fp.investor_id || fp.investorId || '');
      if (invWalletId) {
        debitInvestorWallet({
          investorId: invWalletId,
          amount: fp.amount,
          type: 'INVESTMENT_OUT',
          title: cmp.title || campaignId,
          campaignId: campaignId || cmp.id || cmp._id,
          note: 'Accepted investment funded from investor wallet (ledger only).',
          refId: `inv_out_${proposalId}`,
          requireFunds: false
        });
      }
    }
    persistS3ProposalStore(); // S3
    const invId = fp.investor_id || fp.investorId;
    if (invId) {
      await createAndDispatchNotification(
        invId,
        `Proposal ${status.toUpperCase()}! 📄`,
        `The founder has ${status} your investment proposal of ৳ ${Number(fp.amount || 0).toLocaleString()}.`,
        status === 'accepted' ? 'success' : 'warning'
      );
    }
    s3EmitProposalUpdated(fp); // S3
    res.status(200).json({ message: `Proposal ${status}.`, proposal: normalizeProposal(fp) });
  } catch (err) {
    res.status(500).json({ error: 'Error updating proposal.' });
  }
});

// S3: founder counter-offer / negotiate (does not change original proposal status PUT)
app.post('/api/founder/proposals/:proposalId/negotiate', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { founderId, campaignId, amount, terms, message } = req.body || {};
    const cmp = fallbackCampaigns.find((c) => c.id === campaignId || c._id === campaignId);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (founderId) {
      const ownerKeys = await s3FounderOwnerKeys(founderId);
      if (!s3CampaignOwnedBy(cmp, ownerKeys)) {
        return res.status(403).json({ error: 'You can only negotiate proposals on your own campaigns.' });
      }
    }
    let fp = fallbackProposals.find((p) => p.id === proposalId || p._id === proposalId);
    if (!fp) return res.status(404).json({ error: 'Proposal not found.' });
    const cur = String(fp.status || 'pending').toLowerCase();
    if (!['pending', 'negotiating'].includes(cur)) {
      return res.status(400).json({ error: 'Only pending proposals can be negotiated.' });
    }
    const counterAmount = Number(amount);
    if (!counterAmount || counterAmount <= 0) {
      return res.status(400).json({ error: 'Counter amount must be a positive number.' });
    }
    const counterTerms = String(terms || fp.terms || fp.return_structure || '').trim();
    if (!counterTerms) {
      return res.status(400).json({ error: 'Counter terms are required.' });
    }
    fp.status = 'negotiating';
    fp.counter_amount = counterAmount;
    fp.counter_terms = counterTerms;
    fp.negotiate_message = String(message || '').trim();
    fp.negotiated_at = new Date().toISOString();
    fp.negotiated_by = String(founderId || '');
    persistS3ProposalStore(); // S3
    await s3SyncProposalToSupabase(fp); // S3: so investor GET sees counter even before local overlay
    const invId = fp.investor_id || fp.investorId;
    if (invId) {
      await createAndDispatchNotification(
        invId,
        'Founder sent a counter-offer 💬',
        `The founder proposes ৳ ${counterAmount.toLocaleString()} on terms "${counterTerms}".${fp.negotiate_message ? ' Note: ' + fp.negotiate_message : ''}`,
        'info'
      );
    }
    const n = normalizeProposal(fp);
    n.counter_amount = fp.counter_amount;
    n.counter_terms = fp.counter_terms;
    n.negotiate_message = fp.negotiate_message;
    n.negotiated_at = fp.negotiated_at;
    s3EmitProposalUpdated(fp); // S3
    res.status(200).json({ message: 'Counter-offer recorded.', proposal: n });
  } catch (err) {
    res.status(500).json({ error: 'Error negotiating proposal.' });
  }
});

app.put('/api/campaigns/:id/proposals/:proposalId/status', async (req, res) => {
  try {
    const { id, proposalId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').update({ status }).eq('id', proposalId);
        if (status === 'accepted') {
          const { data: cmpData } = await supabase.from('campaigns').select('raised').eq('id', id).single();
          if (cmpData) {
            await supabase.from('campaigns').update({ raised: Number(cmpData.raised || 0) + 100000 }).eq('id', id);
          }
        }
      } catch (e) {}
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await Proposal.findByIdAndUpdate(proposalId, { status });
      } catch (e) {}
    }

    const fp = fallbackProposals.find(p => p.id === proposalId || p._id === proposalId);
    if (fp) fp.status = status;

    if (status === 'accepted') {
      const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
      if (cmp) {
        cmp.raised = Number(cmp.raised || 0) + (fp ? Number(fp.amount || 0) : 100000);
        persistS3CampaignStore(); // S3
        // S3: credit wallet when legacy status route is used
        if (fp && Number(fp.amount) > 0) {
          creditFounderWalletInvestment({
            founderId: String(cmp.founder_id || cmp.founderId || 'usr_founder_1'),
            amount: fp.amount,
            investorId: fp.investor_id || fp.investorId,
            investorName: fp.investor_name || fp.investorName,
            campaignId: id,
            campaignTitle: cmp.title,
            proposalId
          });
          const invWalletId = String(fp.investor_id || fp.investorId || '');
          if (invWalletId) {
            debitInvestorWallet({
              investorId: invWalletId,
              amount: fp.amount,
              type: 'INVESTMENT_OUT',
              title: cmp.title || id,
              campaignId: id,
              note: 'Accepted investment funded from investor wallet (ledger only).',
              refId: `inv_out_${proposalId}`,
              requireFunds: false
            });
          }
        }
      }
    }
    if (fp) {
      persistS3ProposalStore(); // S3
      s3EmitProposalUpdated(fp); // S3
      await s3SyncProposalToSupabase(fp); // S3
    }

    if (fp && (fp.investorId || fp.investor_id)) {
      const targetInvId = fp.investorId || fp.investor_id;
      const type = status === 'accepted' ? 'success' : 'warning';
      await createAndDispatchNotification(
        targetInvId,
        `Proposal ${status.toUpperCase()}! 📄`,
        `The founder has ${status} your investment proposal.`,
        type
      );
    }

    res.status(200).json({ message: `Proposal status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating proposal status.' });
  }
});

app.post('/api/proposals/:proposalId/withdraw', async (req, res) => {
  try {
    const { proposalId } = req.params;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').update({ status: 'withdrawn' }).eq('id', proposalId);
      } catch (e) {}
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await Proposal.findByIdAndUpdate(proposalId, { status: 'withdrawn' });
      } catch (e) {}
    }

    const fp = fallbackProposals.find(p => p.id === proposalId || p._id === proposalId);
    if (fp) {
      fp.status = 'withdrawn';
      persistS3ProposalStore(); // S3
      s3EmitProposalUpdated(fp); // S3
    }

    res.status(200).json({ message: 'Proposal withdrawn successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error withdrawing proposal.' });
  }
});

// PAYOUTS & AUDIT LOGS APIS
app.get('/api/payouts/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    const byId = new Map();
    // S3: merge Supabase + local so wallet/UI see every pending request
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('payouts').select('*').eq('founder_id', founderId);
        if (!error && Array.isArray(data)) {
          data.forEach((p) => {
            const id = p?.id || p?._id;
            if (id) byId.set(String(id), p);
          });
        }
      } catch (e) {}
    }
    fallbackPayouts
      .filter((p) => String(p.founder_id) === String(founderId))
      .forEach((p) => {
        const id = p.id || p._id;
        if (id) byId.set(String(id), p); // local wins
      });
    const rows = [...byId.values()].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching payouts' });
  }
});

app.post('/api/payouts/request', async (req, res) => {
  try {
    const { founderId, campaignId, amount, method, accountNumber, tranche } = req.body;
    const amt = Number(amount);
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Enter a valid payout amount.' });
    }
    await syncFounderWalletFromAcceptedProposals(founderId);
    const w = ensureFounderWallet(founderId);
    const balance = Number(w.balance || 0);
    const pendingAlready = await s3PendingPayoutTotal(founderId);
    const available = Math.max(0, balance - pendingAlready);
    if (amt > available) {
      return res.status(400).json({
        error: `Not enough available to request. Available ৳ ${available.toLocaleString()} (wallet ৳ ${balance.toLocaleString()} minus pending ৳ ${pendingAlready.toLocaleString()}).`
      });
    }
    const newPayout = {
      id: 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 900),
      founder_id: founderId,
      campaign_id: campaignId || null, // SPRINT 5 (Samiul): tag which campaign this belongs to
      tranche: tranche || 'Milestone Escrow Payout',
      amount: amt,
      method: method || 'bKash Merchant',
      account_number: accountNumber || '',
      status: 'Pending Audit',
      hash: '0x' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('payouts').insert([newPayout]); } catch (e) {}
    }
    fallbackPayouts.unshift(newPayout);
    persistS3PayoutStore(); // S3
    const pendingAfter = pendingAlready + amt;
    res.status(201).json({
      ...newPayout,
      wallet_balance: balance,
      pending_payout_requests: pendingAfter,
      available_to_withdraw: Math.max(0, balance - pendingAfter)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error requesting payout' });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return res.status(200).json(data);
    }
    res.status(200).json([
      { id: '1', hash: '0x8f2a99c4b1d09e1a', category: 'DISBURSEMENT', title: 'Escrow Tranche #1 Release', status: 'VERIFIED', latency: '14ms', created_at: new Date().toISOString() }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching audit logs' });
  }
});

// S3: this founder’s action log (does not change GET /api/audit-logs)
app.get('/api/founders/:founderId/audit-logs', async (req, res) => {
  try {
    const { founderId } = req.params;
    const rows = fallbackAuditLogs.filter((r) => auditBelongsToFounder(r, founderId));
    rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(rows);
  } catch (err) {
    res.status(200).json([]);
  }
});

// S3: founder UI records its own audit (does not patch other sprints’ handlers)
app.post('/api/founders/:founderId/audit-logs', async (req, res) => {
  try {
    const { founderId } = req.params;
    const { category, title, status } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required.' });
    await writeFounderAuditLog({ founderId, category, title, status });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error writing audit log.' });
  }
});

// S3: investor-only audit trail (additive — InvestorDashboard must NOT use GET /api/audit-logs)
app.get('/api/investors/:investorId/audit-logs', async (req, res) => {
  try {
    const { investorId } = req.params;
    const rows = fallbackAuditLogs.filter((r) => auditBelongsToInvestor(r, investorId));
    rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(rows);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/investors/:investorId/audit-logs', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { category, title, status } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required.' });
    const row = await writeInvestorAuditLog({ investorId, category, title, status });
    res.status(201).json({ ok: true, log: row });
  } catch (err) {
    res.status(500).json({ error: 'Error writing investor audit log.' });
  }
});

// ============================================================================
// SPRINT 5 (Samiul): TRANSACTION TRACKING API — FR-9
// ============================================================================
// Founder's transaction tracking dashboard: merges milestones (the roadmap),
// accepted investor proposals (money coming IN), and payout requests
// (money going OUT) into one timeline per campaign.
//
// NOTE: raisedComputed is calculated fresh from accepted proposals, not read
// from campaigns.raised — that stored value can drift due to a bug in the
// proposal-accept endpoint above, which sometimes adds a flat 100000 instead
// of the real proposal amount. Computing it here guarantees accurate numbers
// regardless of whether that other bug gets fixed.
app.get('/api/transactions/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;

    if (!isSupabaseConfigured || !supabase) {
      return res.status(200).json({ campaigns: [], unattributedPayouts: [] });
    }

    // 1. This founder's own campaign(s) — exact match only, no demo hacks
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('founder_id', founderId);
    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return res.status(200).json({ campaigns: [], unattributedPayouts: [] });
    }

    const campaignIds = campaigns.map(c => c.id);

    // 2. Money IN: accepted proposals for any of this founder's campaigns
    const { data: acceptedProposals, error: propErr } = await supabase
      .from('proposals')
      .select('*')
      .in('campaign_id', campaignIds)
      .eq('status', 'accepted');
    if (propErr) throw propErr;

    // 3. Money OUT: this founder's payout / tranche requests
    const { data: payouts, error: payoutErr } = await supabase
      .from('payouts')
      .select('*')
      .eq('founder_id', founderId);
    if (payoutErr) throw payoutErr;

    // 4. Build one clean object per campaign, matching payouts by campaign_id
    const result = campaigns.map(campaign => {
      const incoming = acceptedProposals
        .filter(p => p.campaign_id === campaign.id)
        .map(p => ({
          type: 'investment_in',
          id: p.id,
          amount: Number(p.amount),
          from: p.investor_id,
          terms: p.return_structure || p.terms,
          date: p.created_at
        }));

      const outgoing = payouts
        .filter(p => p.campaign_id === campaign.id)
        .map(p => ({
          type: 'tranche_out',
          id: p.id,
          amount: Number(p.amount),
          tranche: p.tranche,
          method: p.method,
          status: p.status,
          hash: p.hash,
          date: p.created_at
        }));

      const raisedComputed = incoming.reduce((sum, t) => sum + t.amount, 0);
      const totalPaidOut = outgoing.reduce((sum, t) => sum + t.amount, 0);

      const timeline = [...incoming, ...outgoing].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return {
        campaignId: campaign.id,
        title: campaign.title,
        goal: Number(campaign.goal),
        raisedStored: Number(campaign.raised || 0),
        raisedComputed,
        totalPaidOut,
        escrowBalance: raisedComputed - totalPaidOut,
        milestones: campaign.milestones || [],
        timeline
      };
    });

    // Legacy payouts made before campaign_id existed — we can't know which
    // campaign they really belong to, so we surface them honestly instead
    // of guessing, rather than silently attaching them to the wrong one.
    const unattributedPayouts = payouts
      .filter(p => !p.campaign_id)
      .map(p => ({
        type: 'tranche_out',
        id: p.id,
        amount: Number(p.amount),
        tranche: p.tranche,
        method: p.method,
        status: p.status,
        hash: p.hash,
        date: p.created_at
      }));

    res.status(200).json({ campaigns: result, unattributedPayouts });
  } catch (err) {
    console.error('Error building founder transaction tracking:', err);
    res.status(500).json({ error: 'Error fetching transaction tracking data.' });
  }
});

// Socket connection
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', async (data) => {
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
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('messages').insert([msgObj]); } catch (e) {}
    }

    const targetRoom = data.roomId || data.campaignId || 'general';
    io.to(targetRoom).emit('receive_message', msgObj);
    io.emit('new_direct_message', msgObj);
  });
});

// ============================================================================
// FR-21: AI OPTIMIZATION ENGINE API
// ============================================================================
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { action, title, category, stage, university, targetAudience, description } = req.body;

    if (action === 'pitch_bio' || action === 'slogan') {
      const taglines = [
        `Revolutionizing ${category || 'EdTech'} through smart university ecosystem integration.`,
        `Empowering student innovators at ${university || 'top Bangladeshi universities'} with seamless scalable tech.`,
        `Next-gen ${category || 'FinTech'} platform built by student entrepreneurs for rapid market traction.`,
        `Disrupting traditional workflows with automated milestone verification and community backing.`
      ];
      const slogan = taglines[Math.floor(Math.random() * taglines.length)];
      const bio = `${title || 'Our Venture'} is an innovative ${category || 'technology'} startup developed by founders at ${university || 'BRAC University'}. Currently in ${stage || 'MVP Stage'}, our platform addresses key operational challenges for university communities in Bangladesh by introducing digital automation, scalable infrastructure, and milestone-verified growth execution.`;
      
      return res.status(200).json({ slogan, bio });
    }

    if (action === 'business_summary') {
      const summary = `BUSINESS SUMMARY FOR ${title || 'VENTURE'}:\n1. Core Value Proposition: Streamlined ${category || 'Tech'} operations tailored for high-growth Bangladeshi markets.\n2. Milestone Execution: Clear 3-tranche roadmap focused on MVP deployment, customer acquisition, and recurring revenue.\n3. Investor Return Alignment: High alignment with alumni networks and revenue share / milestone debt models.\n4. Focus prompt: ${description || targetAudience || 'General university startup growth.'}`;
      return res.status(200).json({ summary });
    }

    if (action === 'investor_match') {
      const investorId = req.body.investorId || req.body.userId;
      if (!investorId) return res.status(400).json({ error: 'investorId is required for matching.' });
      const result = await getInvestorMatches(investorId);
      const recommendations = result.matches.map((match) => ({
        id: match.campaignId,
        title: match.title,
        category: match.category,
        matchScore: `${match.matchScore}% Match`,
        reason: match.justification
      }));
      return res.status(200).json({ recommendations });
    }

    res.status(200).json({
      slogan: `Transforming ${category || 'Education'} through verified student innovation.`,
      bio: `A high-impact startup leveraging technology to build sustainable value in Bangladesh.`
    });
  } catch (err) {
    res.status(500).json({ error: 'AI generation failed.' });
  }
});

// ============================================================================
// FR-7: DIRECT REAL-TIME CHAT APIS
// ============================================================================
app.get('/api/chat/messages', async (req, res) => {
  try {
    const { senderId, receiverId, campaignId } = req.query;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        let filtered = data;
        if (campaignId) filtered = filtered.filter(m => m.campaign_id === campaignId);
        else if (senderId && receiverId) {
          filtered = filtered.filter(m => 
            (m.sender_id === senderId && m.receiver_id === receiverId) ||
            (m.sender_id === receiverId && m.receiver_id === senderId)
          );
        }
        return res.status(200).json(filtered);
      }
    }
    
    let result = fallbackMessages;
    if (campaignId) result = result.filter(m => m.campaign_id === campaignId);
    else if (senderId && receiverId) {
      result = result.filter(m => 
        (m.sender_id === senderId && m.receiver_id === receiverId) ||
        (m.sender_id === receiverId && m.receiver_id === senderId)
      );
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching messages.' });
  }
});

// S3: thread history for founder chat drawer (does not change GET /api/chat/messages)
app.get('/api/chat/thread', async (req, res) => {
  try {
    const senderId = String(req.query.senderId || '');
    const receiverId = String(req.query.receiverId || '');
    if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId are required.' });
    const inThread = (m) => {
      const s = String(m.sender_id || m.senderId || '');
      const r = String(m.receiver_id || m.receiverId || '');
      return (s === senderId && r === receiverId) || (s === receiverId && r === senderId);
    };
    const byId = new Map();
    fallbackMessages.filter(inThread).forEach((m) => {
      if (m && m.id) byId.set(m.id, m);
    });
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
        if (!error && Array.isArray(data)) {
          data.filter(inThread).forEach((m) => {
            if (m && m.id && !byId.has(m.id)) byId.set(m.id, m);
          });
        }
      } catch (e) {}
    }
    res.status(200).json([...byId.values()].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    ));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/chat/messages', async (req, res) => {
  try {
    const { senderId, receiverId, campaignId, senderName, text } = req.body;
    if (!senderId || !text) return res.status(400).json({ error: 'Sender ID and text are required.' });

    const msgObj = {
      id: 'msg_' + Date.now(),
      sender_id: senderId,
      receiver_id: receiverId || 'all',
      sender_name: senderName || 'User',
      campaign_id: campaignId || '',
      text,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('messages').insert([msgObj]); } catch (e) {}
    }
    fallbackMessages.push(msgObj);

    const targetRoom = campaignId || 'general';
    io.to(targetRoom).emit('receive_message', msgObj);
    io.emit('new_direct_message', msgObj);

    res.status(201).json(msgObj);
  } catch (err) {
    res.status(500).json({ error: 'Error sending message.' });
  }
});

// ============================================================================
// FR-3: USER PROFILE MANAGEMENT API
// ============================================================================
const findFallbackUser = (userId) => fallbackUsers.find(u => u.id === userId || u._id === userId);

app.get('/api/users/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    let found = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').select('*').eq('id', userId).single();
        if (supaUser) found = normalizeUser(supaUser);
      } catch (e) {}
    }

    const fu = findFallbackUser(userId);
    if (!found && fu) found = normalizeUser(fu);
    if (found && fu?.bio && !found.bio) found.bio = fu.bio;

    if (!found) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ user: found });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile.' });
  }
});

app.put('/api/users/profile', async (req, res) => {
  try {
    const { userId, name, university, department, mfsNumber, bio, institution, passingYear, email, studentId, investmentBudgetMin, investmentBudgetMax, sectorInterests } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    const dbUpdates = {};
    if (name !== undefined) dbUpdates.name = name;
    if (university !== undefined) dbUpdates.university = university;
    if (department !== undefined) dbUpdates.department = department;
    if (mfsNumber !== undefined) dbUpdates.mfs_number = mfsNumber;
    if (institution !== undefined) dbUpdates.institution = institution;
    if (passingYear !== undefined) dbUpdates.passing_year = passingYear;
    if (email !== undefined) dbUpdates.email = String(email).toLowerCase();
    if (studentId !== undefined) dbUpdates.student_id = studentId;
    if (bio !== undefined) dbUpdates.bio = bio;
    if (investmentBudgetMin !== undefined) dbUpdates.investment_budget_min = Number(investmentBudgetMin) || null;
    if (investmentBudgetMax !== undefined) dbUpdates.investment_budget_max = Number(investmentBudgetMax) || null;
    if (sectorInterests !== undefined) {
      dbUpdates.sector_interests = Array.isArray(sectorInterests)
        ? sectorInterests
        : String(sectorInterests).split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update(dbUpdates).eq('id', userId);
      } catch (e) {}
    }

    const fu = findFallbackUser(userId);
    if (fu) {
      if (name !== undefined) fu.name = name;
      if (university !== undefined) fu.university = university;
      if (department !== undefined) fu.department = department;
      if (mfsNumber !== undefined) fu.mfs_number = fu.mfsNumber = mfsNumber;
      if (bio !== undefined) fu.bio = bio;
      if (institution !== undefined) fu.institution = institution;
      if (passingYear !== undefined) fu.passing_year = passingYear;
      if (email !== undefined) fu.email = String(email).toLowerCase();
      if (studentId !== undefined) fu.student_id = fu.studentId = studentId;
      if (investmentBudgetMin !== undefined) fu.investment_budget_min = fu.investmentBudgetMin = Number(investmentBudgetMin) || null;
      if (investmentBudgetMax !== undefined) fu.investment_budget_max = fu.investmentBudgetMax = Number(investmentBudgetMax) || null;
      if (sectorInterests !== undefined) {
        const sectors = Array.isArray(sectorInterests)
          ? sectorInterests
          : String(sectorInterests).split(',').map((s) => s.trim()).filter(Boolean);
        fu.sector_interests = fu.sectorInterests = sectors;
      }
    }

    persistUserMatchingPrefs(userId, {
      investment_budget_min: investmentBudgetMin !== undefined ? Number(investmentBudgetMin) || null : undefined,
      investment_budget_max: investmentBudgetMax !== undefined ? Number(investmentBudgetMax) || null : undefined,
      sector_interests: sectorInterests !== undefined
        ? (Array.isArray(sectorInterests) ? sectorInterests : String(sectorInterests).split(',').map((s) => s.trim()).filter(Boolean))
        : undefined
    });

    let result = fu ? normalizeUser(fu) : null;
    if (!result && isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').select('*').eq('id', userId).single();
        if (supaUser) result = normalizeUser(supaUser);
      } catch (e) {}
    }
    if (result && fu?.bio !== undefined) result.bio = fu.bio;

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: result || { id: userId, name, email, university, department, studentId, mfsNumber, bio }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile.' });
  }
});

app.post('/api/users/profile/documents', cpUpload, async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    const studentPath = req.files?.studentIdCardImage?.[0] ? `/uploads/${req.files.studentIdCardImage[0].filename}` : '';
    const nidPath = req.files?.nidCardImage?.[0] ? `/uploads/${req.files.nidCardImage[0].filename}` : '';
    if (!studentPath && !nidPath) {
      return res.status(400).json({ error: 'Upload a Student ID or NID file.' });
    }

    const fu = findFallbackUser(userId);
    if (fu) {
      if (studentPath) fu.studentIdCardImage = fu.student_id_card_image = studentPath;
      if (nidPath) fu.nidCardImage = fu.nid_card_image = nidPath;
      fu.vettingStatus = fu.vetting_status = 'pending';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const patch = { vetting_status: 'pending' };
        if (studentPath) patch.student_id_card_image = studentPath;
        if (nidPath) patch.nid_card_image = nidPath;
        await supabase.from('users').update(patch).eq('id', userId);
      } catch (e) {}
    }

    res.status(200).json({
      message: 'Documents uploaded for admin vetting.',
      user: fu ? normalizeUser(fu) : { id: userId, studentIdCardImage: studentPath, nidCardImage: nidPath, vettingStatus: 'pending' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading documents.' });
  }
});

// S3: persist relief campaigns so My Relief survives backend/nodemon restarts
const S3_RELIEF_STORE_PATH = path.join(__dirname, 's3_relief_store.json');
const fallbackReliefDrives = [];

// S3: relief milestones track work/proofs — same shape as campaigns, no repayment/escrow release
const defaultReliefMilestones = (useOfFunds) => {
  const uses = Array.isArray(useOfFunds) ? useOfFunds.map((u) => String(u || '').trim()).filter(Boolean) : [];
  if (uses.length > 0) {
    return uses.map((u, idx) => ({
      title: u.slice(0, 120),
      target: `Phase ${idx + 1}`,
      status: idx === 0 ? 'pending' : 'locked',
      proofs: []
    }));
  }
  return [
    { title: 'Needs assessment & beneficiary list', target: 'Phase 1', status: 'pending', proofs: [] },
    { title: 'Funds deployed to beneficiaries', target: 'Phase 2', status: 'locked', proofs: [] },
    { title: 'Impact report & receipts', target: 'Phase 3', status: 'locked', proofs: [] }
  ];
};

// S3
const normalizeReliefMilestoneList = (milestones, useOfFunds) => {
  if (Array.isArray(milestones) && milestones.length > 0) {
    return milestones.map((m, idx) => ({
      title: m.title || m.name || `Milestone ${idx + 1}`,
      target: m.target || m.targetDate || `Phase ${idx + 1}`,
      status: m.status || (idx === 0 ? 'pending' : 'locked'),
      proofs: Array.isArray(m.proofs) ? m.proofs : []
    }));
  }
  return defaultReliefMilestones(useOfFunds);
};

// S3
const ensureReliefMilestones = (drive) => {
  if (!drive) return drive;
  if (!Array.isArray(drive.milestones) || drive.milestones.length === 0) {
    drive.milestones = defaultReliefMilestones(drive.useOfFunds);
  }
  return drive;
};

// S3
const loadS3ReliefStore = () => {
  try {
    if (!fs.existsSync(S3_RELIEF_STORE_PATH)) return;
    const raw = fs.readFileSync(S3_RELIEF_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      fallbackReliefDrives.length = 0;
      fallbackReliefDrives.push(...parsed);
      let backfilled = false;
      fallbackReliefDrives.forEach((d) => {
        if (!Array.isArray(d.milestones) || d.milestones.length === 0) {
          ensureReliefMilestones(d);
          backfilled = true;
        }
      });
      if (backfilled) {
        try {
          fs.writeFileSync(S3_RELIEF_STORE_PATH, JSON.stringify(fallbackReliefDrives, null, 2), 'utf8');
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('S3 relief store load warning:', e.message);
  }
};

// S3
const persistS3ReliefStore = () => {
  try {
    fs.writeFileSync(S3_RELIEF_STORE_PATH, JSON.stringify(fallbackReliefDrives, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 relief store save warning:', e.message);
  }
};

loadS3ReliefStore(); // S3

// S3: relief donations ledger (investor Add Money → credits raised; no payment gateway)
const S3_RELIEF_DONATION_STORE_PATH = path.join(__dirname, 's3_relief_donations.json');
const fallbackReliefDonations = [];
const loadS3ReliefDonationStore = () => {
  try {
    if (!fs.existsSync(S3_RELIEF_DONATION_STORE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(S3_RELIEF_DONATION_STORE_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      fallbackReliefDonations.length = 0;
      fallbackReliefDonations.push(...parsed);
    }
  } catch (e) {
    console.warn('S3 relief donation store load warning:', e.message);
  }
};
const persistS3ReliefDonationStore = () => {
  try {
    fs.writeFileSync(S3_RELIEF_DONATION_STORE_PATH, JSON.stringify(fallbackReliefDonations, null, 2), 'utf8');
  } catch (e) {
    console.warn('S3 relief donation store save warning:', e.message);
  }
};
loadS3ReliefDonationStore(); // S3

// S3: attach donation ledger rows onto a relief drive (external donors for founder UI)
const attachReliefDonations = (drive) => {
  if (!drive) return drive;
  const driveId = String(drive.id || drive._id || '');
  const fromLedger = fallbackReliefDonations.filter((row) => String(row.drive_id) === driveId);
  const embedded = Array.isArray(drive.donations) ? drive.donations : [];
  if (fromLedger.length === 0) return { ...drive, donations: embedded };
  const byId = new Map();
  embedded.forEach((d) => {
    if (d && d.id) byId.set(String(d.id), d);
  });
  fromLedger.forEach((row) => {
    byId.set(String(row.id), {
      id: row.id,
      investor_id: row.investor_id,
      investor_name: row.investor_name,
      amount: row.amount,
      method: row.method,
      created_at: row.created_at
    });
  });
  const donations = [...byId.values()].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  return { ...drive, donations };
};

// Public / browse: only admin-approved relief campaigns
app.get('/api/relief-drives', async (req, res) => {
  try {
    const list = fallbackReliefDrives
      .filter(d => d.status === 'open' || d.status === 'verified')
      .map((d) => {
        const base = attachReliefDonations(ensureReliefMilestones({ ...d }));
        const fu = fallbackUsers.find((u) => String(u.id || u._id) === String(d.founder_id || d.founderId || ''));
        return {
          ...base,
          founder: fu
            ? {
                id: fu.id || fu._id,
                name: fu.name || 'Founder',
                email: fu.email || '',
                university: fu.university || d.university || '',
                department: fu.department || '',
                bio: fu.bio || ''
              }
            : { name: 'Founder', university: d.university || '', bio: '' },
          coFounders: getCoFounders(d),
          co_founders: getCoFounders(d)
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching relief campaigns.' });
  }
});

app.get('/api/relief-drives/founder/:founderId', async (req, res) => {
  const { founderId } = req.params;
  const accessKeys = await s3FounderAccessKeys(founderId);
  const list = fallbackReliefDrives
    .filter((d) => s3CampaignAccessibleBy(d, accessKeys))
    .map((d) => annotateViewerRole(attachReliefDonations(ensureReliefMilestones({ ...d })), accessKeys));
  res.status(200).json(list);
});

// S3: founder My Relief (owned + co-founded, all statuses)
app.get('/api/founders/:founderId/relief-drives', async (req, res) => {
  const { founderId } = req.params;
  const accessKeys = await s3FounderAccessKeys(founderId);
  const list = fallbackReliefDrives
    .filter((d) => s3CampaignAccessibleBy(d, accessKeys))
    .map((d) => annotateViewerRole(attachReliefDonations(ensureReliefMilestones({ ...d })), accessKeys));
  res.status(200).json(list);
});

app.get('/api/admin/relief-drives/pending', async (req, res) => {
  const list = fallbackReliefDrives
    .filter(d => d.status === 'pending')
    .map((d) => ensureReliefMilestones({ ...d }));
  res.status(200).json(list);
});

app.post('/api/admin/relief-drives/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!['verified', 'open', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified, open, rejected, or cancelled.' });
    }
    const drive = fallbackReliefDrives.find(d => d.id === id);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    // "open" and "verified" both mean publicly visible after admin approval
    drive.status = status === 'verified' ? 'open' : status;
    drive.reviewed_at = new Date().toISOString();
    // S3: store reason when provided (AdminDashboard UI for this is a later todo)
    if (status === 'rejected' && req.body.reason !== undefined) {
      drive.rejectionReason = String(req.body.reason || '').trim();
    }
    if (status === 'open' || status === 'verified') {
      drive.rejectionReason = null;
    }
    persistS3ReliefStore(); // S3
    res.status(200).json({ message: 'Relief campaign status updated.', drive });
  } catch (err) {
    res.status(500).json({ error: 'Error updating relief campaign status.' });
  }
});

app.post('/api/relief-drives', async (req, res) => {
  try {
    const { founderId, title, university, cause, beneficiary, goal, durationDays, description, useOfFunds, proofLinks, milestones } = req.body;
    if (!founderId || !title) return res.status(400).json({ error: 'Cause title and founder ID are required.' });
    // S3: co-founders (max 3)
    const cfCheck = resolveCoFoundersFromBody(req.body, founderId, null);
    if (!cfCheck.ok) return res.status(400).json({ error: cfCheck.error });
    const now = new Date().toISOString();
    const funds = useOfFunds || [];
    const drive = {
      id: 'relief_' + Date.now(),
      founder_id: founderId,
      title,
      university: university || '',
      cause: cause || 'Community Support',
      beneficiary: beneficiary || '',
      goal: Number(goal) || 0,
      durationDays: Number(durationDays) || 60,
      duration_days: Number(durationDays) || 60,
      raised: 0,
      description: description || '',
      useOfFunds: funds,
      proofLinks: Array.isArray(proofLinks) ? proofLinks.filter(p => p && String(p.url || '').trim()) : [],
      // S3: progress milestones (no repayment)
      milestones: normalizeReliefMilestoneList(milestones, funds),
      status: 'pending',
      created_at: now,
      submitted_at: now
    };
    syncSuccessorFromCoFounders(drive, cfCheck.coFounders);
    fallbackReliefDrives.unshift(drive);
    persistS3ReliefStore(); // S3
    res.status(201).json({ message: 'Relief campaign submitted for admin approval.', drive });
  } catch (err) {
    res.status(500).json({ error: 'Error creating relief campaign.' });
  }
});

app.put('/api/relief-drives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, university, cause, beneficiary, goal, durationDays, description, useOfFunds, proofLinks, founderId, milestones, milestonesOnly } = req.body;
    const drive = fallbackReliefDrives.find(d => d.id === id);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (founderId && drive.founder_id !== founderId) {
      return res.status(403).json({ error: 'You can only edit your own relief campaigns.' });
    }

    // S3: milestone-only updates allowed on live/pending relief (work progress, not pitch re-edit)
    if (milestonesOnly === true) {
      drive.milestones = normalizeReliefMilestoneList(milestones, drive.useOfFunds);
      persistS3ReliefStore(); // S3
      return res.status(200).json({
        message: 'Relief milestones updated (progress tracking — no repayment).',
        drive
      });
    }

    // S3: pending edit, or reapply from rejected/cancelled
    if (!['pending', 'rejected', 'cancelled'].includes(drive.status)) {
      return res.status(400).json({ error: 'Only pending, rejected, or cancelled relief campaigns can be edited or reapplied.' });
    }
    if (title !== undefined) drive.title = title;
    if (university !== undefined) drive.university = university;
    if (cause !== undefined) drive.cause = cause;
    if (beneficiary !== undefined) drive.beneficiary = beneficiary;
    if (goal !== undefined) drive.goal = Number(goal) || 0;
    if (durationDays !== undefined) {
      drive.durationDays = drive.duration_days = Number(durationDays) || 60;
    }
    if (description !== undefined) drive.description = description;
    if (useOfFunds !== undefined) drive.useOfFunds = useOfFunds;
    if (proofLinks !== undefined) {
      drive.proofLinks = Array.isArray(proofLinks) ? proofLinks.filter(p => p && String(p.url || '').trim()) : [];
    }
    if (milestones !== undefined) {
      drive.milestones = normalizeReliefMilestoneList(milestones, drive.useOfFunds);
    }
    // S3: co-founders (max 3); legacy successor fields still accepted
    if (
      req.body.coFounders !== undefined ||
      req.body.co_founders !== undefined ||
      req.body.successorName !== undefined ||
      req.body.successorEmail !== undefined
    ) {
      const cfCheck = resolveCoFoundersFromBody(req.body, founderId || drive.founder_id, drive);
      if (!cfCheck.ok) return res.status(400).json({ error: cfCheck.error });
      syncSuccessorFromCoFounders(drive, cfCheck.coFounders);
    }
    // S3: editing / reapply restarts the admin approval clock (at most 3 days from submission)
    drive.status = 'pending';
    drive.submitted_at = new Date().toISOString();
    drive.reviewed_at = null;
    drive.rejectionReason = null; // S3
    ensureReliefMilestones(drive);
    persistS3ReliefStore(); // S3
    res.status(200).json({
      message: 'Relief campaign updated. Admin approval timer restarted (at most 3 days).',
      drive
    });
  } catch (err) {
    res.status(500).json({ error: 'Error updating relief campaign.' });
  }
});

app.delete('/api/relief-drives/:id', async (req, res) => {
  const { id } = req.params;
  const idx = fallbackReliefDrives.findIndex(d => d.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Relief campaign not found.' });

  // S3: hard-delete rejected (or ?hard=true) so founder can remove from My Relief
  const hard = String(req.query.hard || '').toLowerCase() === 'true'
    || String(req.query.hard || '') === '1';
  if (hard) {
    if (fallbackReliefDrives[idx].status !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected relief campaigns can be permanently deleted.' });
    }
    fallbackReliefDrives.splice(idx, 1);
    persistS3ReliefStore(); // S3
    return res.status(200).json({ message: 'Rejected relief campaign deleted.' });
  }

    fallbackReliefDrives[idx].status = 'cancelled';
    persistS3ReliefStore(); // S3
    res.status(200).json({ message: 'Relief campaign cancelled.' });
});

// ============================================================================
// FR-5: CAMPAIGN EDIT & CANCEL APIS
// ============================================================================
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tagline, goal, durationDays, equityOffer, description, category, stage, milestones, university, coverPhoto, pitchVideoUrl, successorName, successorEmail } = req.body;

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });

    // Live/verified campaigns are not freely re-edited here; pending/rejected return to audit queue
    const wasPendingLike = cmp.status === 'pending' || cmp.status === 'rejected' || cmp.status === 'revisions' || !cmp.verified;

    if (title) cmp.title = title;
    if (tagline !== undefined) cmp.tagline = tagline;
    if (goal !== undefined) cmp.goal = Number(goal);
    if (durationDays !== undefined) {
      cmp.durationDays = cmp.duration_days = Number(durationDays) || 60;
    }
    if (equityOffer) cmp.equity_offer = cmp.equityOffer = equityOffer;
    if (description !== undefined) cmp.description = description;
    if (category) cmp.category = category;
    if (stage) cmp.stage = stage;
    if (university !== undefined) cmp.university = university;
    if (coverPhoto !== undefined) cmp.cover_photo = cmp.coverPhoto = coverPhoto;
    if (pitchVideoUrl !== undefined) cmp.pitch_video_url = cmp.pitchVideoUrl = pitchVideoUrl;
    // S3: co-founders (max 3); legacy successor fields still accepted
    if (
      req.body.coFounders !== undefined ||
      req.body.co_founders !== undefined ||
      successorName !== undefined ||
      successorEmail !== undefined
    ) {
      const cfCheck = resolveCoFoundersFromBody(req.body, cmp.founder_id || cmp.founderId, cmp);
      if (!cfCheck.ok) return res.status(400).json({ error: cfCheck.error });
      syncSuccessorFromCoFounders(cmp, cfCheck.coFounders);
    }
    if (Array.isArray(milestones) && milestones.length > 0) {
      cmp.milestones = milestones.map((m, idx) => ({
        title: String(m.title || `Milestone ${idx + 1}`).trim(),
        target: String(m.target || m.targetDate || 'TBD').trim(),
        status: m.status || (idx === 0 ? 'pending' : 'locked'),
        proofs: Array.isArray(m.proofs) ? m.proofs : []
      }));
    }

    // S3: milestone-only updates should not restart admin approval
    const milestonesOnly = req.body.milestonesOnly === true
      || (Array.isArray(milestones) && !title && tagline === undefined && goal === undefined && !equityOffer && description === undefined);
    if ((wasPendingLike || req.body.resetApproval) && !milestonesOnly) {
      cmp.status = 'pending';
      cmp.verified = false;
      cmp.submitted_at = new Date().toISOString();
      cmp.rejectionReason = null; // S3: clear on reapply / pending resubmit
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({
          title: cmp.title,
          tagline: cmp.tagline,
          goal: cmp.goal,
          equity_offer: cmp.equity_offer,
          description: cmp.description,
          category: cmp.category,
          stage: cmp.stage,
          milestones: cmp.milestones,
          status: cmp.status,
          verified: cmp.verified
        }).eq('id', id);
      } catch (e) {}
    }

    persistS3CampaignStore(); // S3

    res.status(200).json({
      message: wasPendingLike && !milestonesOnly
        ? 'Campaign updated. Admin approval timer restarted (at most 3 days).'
        : 'Campaign updated successfully.',
      campaign: cmp
    });
  } catch (err) {
    res.status(500).json({ error: 'Error updating campaign.' });
  }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hard = String(req.query.hard || '').toLowerCase() === 'true'
      || String(req.query.hard || '') === '1';

    const cmpIdx = fallbackCampaigns.findIndex(c => c.id === id || c._id === id);
    const cmp = cmpIdx >= 0 ? fallbackCampaigns[cmpIdx] : null;

    // S3: permanent delete only for rejected campaigns
    if (hard) {
      if (!cmp || cmp.status !== 'rejected') {
        return res.status(400).json({ error: 'Only rejected campaigns can be permanently deleted.' });
      }
      fallbackCampaigns.splice(cmpIdx, 1);
      persistS3CampaignStore(); // S3
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('campaigns').delete().eq('id', id); } catch (e) {}
      }
      return res.status(200).json({ message: 'Rejected campaign deleted.' });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ status: 'cancelled' }).eq('id', id);
      } catch (e) {}
    }

    if (cmp) cmp.status = 'cancelled';
    persistS3CampaignStore(); // S3

    res.status(200).json({ message: 'Campaign de-listed / cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error cancelling campaign.' });
  }
});

// ============================================================================
// S3: POST-APPROVAL EDIT REQUESTS (max 2 working days)
// ============================================================================
app.get('/api/edit-requests/founder/:founderId', (req, res) => {
  const { founderId } = req.params;
  const list = fallbackEditRequests
    .filter((r) => r.founder_id === founderId)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
  res.status(200).json(list);
});

app.get('/api/admin/edit-requests/pending', (req, res) => {
  // S3
  res.status(200).json(fallbackEditRequests.filter((r) => r.status === 'pending'));
});

app.post('/api/campaigns/:id/edit-requests', async (req, res) => {
  try {
    // S3
    const { id } = req.params;
    const { founderId, reason, proposedChanges } = req.body;
    const cmp = fallbackCampaigns.find((c) => c.id === id || c._id === id);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (!(cmp.verified || cmp.status === 'verified' || cmp.status === 'open' || cmp.status === 'live')) {
      return res.status(400).json({ error: 'Special edit requests are only for approved/live campaigns. Edit pending campaigns directly.' });
    }
    if (!founderId || String(cmp.founder_id) !== String(founderId)) {
      return res.status(403).json({ error: 'You can only request edits for your own campaigns.' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A reason for the edit request is required.' });
    }
    if (fallbackEditRequests.some((r) => r.target_id === id && r.target_type === 'investment' && r.status === 'pending')) {
      return res.status(400).json({ error: 'An edit request is already pending for this campaign.' });
    }
    const now = new Date().toISOString();
    const reqObj = {
      id: 'editreq_' + Date.now(),
      target_type: 'investment',
      target_id: id,
      target_title: cmp.title || id,
      founder_id: founderId,
      reason: String(reason).trim(),
      proposedChanges: proposedChanges && typeof proposedChanges === 'object' ? proposedChanges : {},
      status: 'pending',
      submitted_at: now,
      due_at: addWorkingDaysBD(now, 2), // S3: at most 2 working days
      reviewed_at: null
    };
    fallbackEditRequests.unshift(reqObj);
    persistS3EditRequestStore(); // S3
    try {
      await createAndDispatchNotification(
        founderId,
        'Edit request submitted',
        `Your edit request for “${reqObj.target_title}” is pending admin review (at most 2 working days).`,
        'info'
      );
      await createAndDispatchNotification(
        'usr_admin_1',
        'Campaign edit request pending ✏️',
        `Founder requested edits on “${reqObj.target_title}”: ${reqObj.reason}`,
        'info'
      );
    } catch (e) {}
    res.status(201).json({
      message: 'Edit request submitted. Admin review takes at most 2 working days.',
      request: reqObj
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating edit request.' });
  }
});

app.post('/api/relief-drives/:id/edit-requests', async (req, res) => {
  try {
    // S3
    const { id } = req.params;
    const { founderId, reason, proposedChanges } = req.body;
    const drive = fallbackReliefDrives.find((d) => d.id === id);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (!['open', 'verified'].includes(String(drive.status || '').toLowerCase())) {
      return res.status(400).json({ error: 'Special edit requests are only for approved relief campaigns.' });
    }
    if (!founderId || String(drive.founder_id) !== String(founderId)) {
      return res.status(403).json({ error: 'You can only request edits for your own relief campaigns.' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A reason for the edit request is required.' });
    }
    if (fallbackEditRequests.some((r) => r.target_id === id && r.target_type === 'relief' && r.status === 'pending')) {
      return res.status(400).json({ error: 'An edit request is already pending for this relief campaign.' });
    }
    const now = new Date().toISOString();
    const reqObj = {
      id: 'editreq_' + Date.now(),
      target_type: 'relief',
      target_id: id,
      target_title: drive.title || id,
      founder_id: founderId,
      reason: String(reason).trim(),
      proposedChanges: proposedChanges && typeof proposedChanges === 'object' ? proposedChanges : {},
      status: 'pending',
      submitted_at: now,
      due_at: addWorkingDaysBD(now, 2),
      reviewed_at: null
    };
    fallbackEditRequests.unshift(reqObj);
    persistS3EditRequestStore(); // S3
    try {
      await createAndDispatchNotification(
        founderId,
        'Relief edit request submitted',
        `Your edit request for “${reqObj.target_title}” is pending admin review (at most 2 working days).`,
        'info'
      );
      await createAndDispatchNotification(
        'usr_admin_1',
        'Relief edit request pending ✏️',
        `Founder requested edits on “${reqObj.target_title}”: ${reqObj.reason}`,
        'info'
      );
    } catch (e) {}
    res.status(201).json({
      message: 'Relief edit request submitted. Admin review takes at most 2 working days.',
      request: reqObj
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating relief edit request.' });
  }
});

app.post('/api/admin/edit-requests/:id/status', async (req, res) => {
  try {
    // S3
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    const er = fallbackEditRequests.find((r) => r.id === id);
    if (!er) return res.status(404).json({ error: 'Edit request not found.' });
    if (er.status !== 'pending') return res.status(400).json({ error: 'This edit request was already reviewed.' });

    er.status = status;
    er.reviewed_at = new Date().toISOString();
    er.admin_note = String(req.body.reason || req.body.note || '').trim();

    if (status === 'approved') {
      const changes = er.proposedChanges || {};
      if (er.target_type === 'investment') {
        const cmp = fallbackCampaigns.find((c) => c.id === er.target_id || c._id === er.target_id);
        if (cmp) {
          if (changes.title !== undefined) cmp.title = changes.title;
          if (changes.tagline !== undefined) cmp.tagline = changes.tagline;
          if (changes.description !== undefined) cmp.description = changes.description;
          if (changes.goal !== undefined) cmp.goal = Number(changes.goal) || cmp.goal;
          if (changes.equityOffer !== undefined) cmp.equity_offer = cmp.equityOffer = changes.equityOffer;
          if (changes.category !== undefined) cmp.category = changes.category;
          if (changes.stage !== undefined) cmp.stage = changes.stage;
          if (changes.university !== undefined) cmp.university = changes.university;
          persistS3CampaignStore(); // S3
        }
      } else if (er.target_type === 'relief') {
        const drive = fallbackReliefDrives.find((d) => d.id === er.target_id);
        if (drive) {
          if (changes.title !== undefined) drive.title = changes.title;
          if (changes.cause !== undefined) drive.cause = changes.cause;
          if (changes.beneficiary !== undefined) drive.beneficiary = changes.beneficiary;
          if (changes.goal !== undefined) drive.goal = Number(changes.goal) || drive.goal;
          if (changes.description !== undefined) drive.description = changes.description;
          if (changes.useOfFunds !== undefined) drive.useOfFunds = changes.useOfFunds;
          if (changes.proofLinks !== undefined) drive.proofLinks = changes.proofLinks;
          if (changes.university !== undefined) drive.university = changes.university;
          persistS3ReliefStore(); // S3
        }
      }
    }

    persistS3EditRequestStore(); // S3
    try {
      if (er.founder_id) {
        await createAndDispatchNotification(
          er.founder_id,
          status === 'approved' ? 'Edit request approved ✅' : 'Edit request rejected',
          status === 'approved'
            ? `Your edits for “${er.target_title}” were applied.`
            : `Your edit request for “${er.target_title}” was rejected.${er.admin_note ? ' Note: ' + er.admin_note : ''}`,
          status === 'approved' ? 'success' : 'warning'
        );
      }
    } catch (e) {}
    res.status(200).json({ message: `Edit request ${status}.`, request: er });
  } catch (err) {
    res.status(500).json({ error: 'Error updating edit request.' });
  }
});

// S3: lookup platform user by email (for handover form — no secrets)
app.get('/api/users/lookup-by-email', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const u = findPlatformUserByEmail(email);
  if (!u) return res.status(404).json({ exists: false, error: 'No platform account found for this email.' });
  const id = u.id || u._id;
  res.status(200).json({
    exists: true,
    id,
    name: u.name || '',
    email: u.email || email,
    role: u.role || '',
    phone: u.phone || u.mfsNumber || u.mfs_number || u.contact || '',
    university: u.university || u.institution || ''
  });
});

// S3: shared create for campaign/relief handover — elect a co-founder as New founder
const createHandoverRequest = async ({ targetType, targetId, founderId, reason, successorId, successorName, successorEmail, successorContact, proofFile }) => {
  const isRelief = targetType === 'relief';
  let target = null;
  if (isRelief) {
    target = fallbackReliefDrives.find((d) => d.id === targetId || d._id === targetId);
  } else {
    target = fallbackCampaigns.find((c) => c.id === targetId || c._id === targetId);
  }
  if (!target) return { status: 404, error: `${isRelief ? 'Relief campaign' : 'Campaign'} not found.` };

  const ownerId = String(target.founder_id || target.founderId || '');
  if (!founderId || ownerId !== String(founderId)) {
    return { status: 403, error: 'You can only hand over your own campaigns.' };
  }
  const liveOk = isRelief
    ? ['open', 'verified', 'pending'].includes(String(target.status || '').toLowerCase())
    : true;
  if (!liveOk) return { status: 400, error: 'This relief campaign cannot be handed over in its current status.' };

  const why = String(reason || '').trim();
  if (!why) return { status: 400, error: 'A reason for handover is required.' };
  if (!proofFile) return { status: 400, error: 'Proof file is required (JPG, PNG, or PDF).' };

  const coFounders = getCoFounders(target);
  if (coFounders.length === 0) {
    return { status: 400, error: 'Add a co-founder first, then elect them as the new founder to hand over.' };
  }

  const sidHint = String(successorId || '').trim();
  const emailHint = String(successorEmail || '').trim().toLowerCase();
  const electedCf = coFounders.find((c) => {
    const cid = String(c.id || '');
    const cem = String(c.email || '').toLowerCase();
    return (sidHint && cid === sidHint) || (emailHint && cem === emailHint);
  });
  if (!electedCf) {
    return { status: 400, error: 'New founder must be one of the campaign’s current co-founders.' };
  }

  const successor =
    fallbackUsers.find((u) => String(u.id || u._id) === String(electedCf.id || '')) ||
    findPlatformUserByEmail(electedCf.email || emailHint);
  if (!successor) {
    return { status: 400, error: 'Selected co-founder account was not found on FundBridge.' };
  }
  if (String(successor.role || '').toLowerCase() !== 'founder') {
    return { status: 400, error: 'New founder must be a registered founder on the platform.' };
  }
  const resolvedId = String(successor.id || successor._id || '');
  if (resolvedId === String(founderId)) {
    return { status: 400, error: 'You cannot hand over a campaign to yourself.' };
  }
  if (fallbackHandoverRequests.some((r) => r.target_id === targetId && r.target_type === targetType && r.status === 'pending')) {
    return { status: 400, error: 'A handover request is already pending for this campaign.' };
  }

  const name = String(successorName || electedCf.name || successor.name || '').trim();
  const email = String(successor.email || electedCf.email || emailHint).trim().toLowerCase();
  const contact = String(successorContact || successor.mfsNumber || successor.phone || '').trim();

  const now = new Date().toISOString();
  const reqObj = {
    id: 'handover_' + Date.now(),
    target_type: targetType,
    target_id: targetId,
    target_title: target.title || targetId,
    founder_id: String(founderId),
    founder_name: (fallbackUsers.find((u) => String(u.id || u._id) === String(founderId)) || {}).name || '',
    reason: why,
    successor_name: name,
    successor_email: email,
    successor_contact: contact,
    successor_id: resolvedId,
    new_founder_id: resolvedId,
    new_founder_name: name,
    proof_path: `/uploads/${proofFile.filename}`,
    proof_original_name: proofFile.originalname || '',
    status: 'pending',
    submitted_at: now,
    due_at: addWorkingDaysBD(now, 2),
    reviewed_at: null,
    admin_note: null
  };
  fallbackHandoverRequests.unshift(reqObj);
  persistS3HandoverStore();
  return { status: 201, request: reqObj };
};

app.post('/api/campaigns/:id/handover-requests', upload.single('proofFile'), async (req, res) => {
  try {
    const result = await createHandoverRequest({
      targetType: 'investment',
      targetId: req.params.id,
      founderId: req.body.founderId,
      reason: req.body.reason,
      successorId: req.body.successorId || req.body.newFounderId,
      successorName: req.body.successorName,
      successorEmail: req.body.successorEmail,
      successorContact: req.body.successorContact,
      proofFile: req.file
    });
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.status(201).json({
      message: 'Handover request submitted. Admin must approve before ownership transfers to the new founder.',
      request: result.request
    });
  } catch (err) {
    res.status(500).json({ error: 'Error submitting handover request.' });
  }
});

app.post('/api/relief-drives/:id/handover-requests', upload.single('proofFile'), async (req, res) => {
  try {
    const result = await createHandoverRequest({
      targetType: 'relief',
      targetId: req.params.id,
      founderId: req.body.founderId,
      reason: req.body.reason,
      successorId: req.body.successorId || req.body.newFounderId,
      successorName: req.body.successorName,
      successorEmail: req.body.successorEmail,
      successorContact: req.body.successorContact,
      proofFile: req.file
    });
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.status(201).json({
      message: 'Relief handover request submitted. Admin must approve before ownership transfers to the new founder.',
      request: result.request
    });
  } catch (err) {
    res.status(500).json({ error: 'Error submitting relief handover request.' });
  }
});

app.get('/api/handover-requests/founder/:founderId', (req, res) => {
  const { founderId } = req.params;
  const list = fallbackHandoverRequests
    .filter((r) => String(r.founder_id) === String(founderId))
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
  res.status(200).json(list);
});

app.get('/api/admin/handover-requests/pending', (req, res) => {
  res.status(200).json(fallbackHandoverRequests.filter((r) => r.status === 'pending'));
});

app.post('/api/admin/handover-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    const hr = fallbackHandoverRequests.find((r) => r.id === id);
    if (!hr) return res.status(404).json({ error: 'Handover request not found.' });
    if (hr.status !== 'pending') return res.status(400).json({ error: 'This handover request was already reviewed.' });

    hr.status = status;
    hr.reviewed_at = new Date().toISOString();
    hr.admin_note = String(req.body.reason || req.body.note || '').trim();

    if (status === 'approved') {
      const successor = fallbackUsers.find((u) => String(u.id || u._id) === String(hr.successor_id || hr.new_founder_id))
        || findPlatformUserByEmail(hr.successor_email);
      if (!successor) {
        return res.status(400).json({ error: 'New founder account no longer exists; cannot approve.' });
      }
      const sid = String(successor.id || successor._id);
      const applyOwnershipTransfer = (obj) => {
        obj.founder_id = sid;
        obj.founderId = sid;
        // Remove the elected co-founder from the list; they are now the primary founder
        const remaining = getCoFounders(obj).filter((c) => {
          const cid = String(c.id || '');
          const cem = String(c.email || '').toLowerCase();
          const sem = String(successor.email || hr.successor_email || '').toLowerCase();
          return cid !== sid && (!sem || cem !== sem);
        });
        syncSuccessorFromCoFounders(obj, remaining);
        if (obj.founder && typeof obj.founder === 'object') {
          obj.founder = {
            ...obj.founder,
            _id: sid,
            id: sid,
            name: successor.name || hr.successor_name || hr.new_founder_name,
            email: successor.email || hr.successor_email,
            university: successor.university || obj.founder.university || '',
            department: successor.department || obj.founder.department || ''
          };
        } else {
          obj.founder = {
            id: sid,
            _id: sid,
            name: successor.name || hr.successor_name || hr.new_founder_name,
            email: successor.email || hr.successor_email,
            university: successor.university || '',
            department: successor.department || ''
          };
        }
      };
      if (hr.target_type === 'relief') {
        const drive = fallbackReliefDrives.find((d) => d.id === hr.target_id || d._id === hr.target_id);
        if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
        applyOwnershipTransfer(drive);
        persistS3ReliefStore();
      } else {
        const cmp = fallbackCampaigns.find((c) => c.id === hr.target_id || c._id === hr.target_id);
        if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
        applyOwnershipTransfer(cmp);
        persistS3CampaignStore();
      }
      await createAndDispatchNotification(
        sid,
        'You are now the primary founder',
        `Admin approved handover of “${hr.target_title}” to you. Ownership has transferred.`,
        'success'
      );
      await createAndDispatchNotification(
        hr.founder_id,
        'Handover approved',
        `Your handover of “${hr.target_title}” to ${hr.successor_name || hr.new_founder_name || 'the new founder'} was approved.`,
        'info'
      );
    } else {
      await createAndDispatchNotification(
        hr.founder_id,
        'Handover rejected',
        `Admin rejected handover of “${hr.target_title}”.${hr.admin_note ? ` Reason: ${hr.admin_note}` : ''}`,
        'warning'
      );
    }

    persistS3HandoverStore();
    res.status(200).json({ message: `Handover request ${status}.`, request: hr });
  } catch (err) {
    res.status(500).json({ error: 'Error updating handover request.' });
  }
});

// ============================================================================
// S3: CO-FOUNDER APPLICATIONS (reason-only; primary founder accepts / rejects / removes)
// ============================================================================
const submitCoFounderApplication = async (req, res, targetType) => {
  try {
    const { id } = req.params;
    const applicantId = String(req.body.applicantId || req.body.founderId || '').trim();
    const reason = String(req.body.reason || '').trim();
    if (!applicantId) return res.status(400).json({ error: 'Applicant founder ID is required.' });
    if (!reason) return res.status(400).json({ error: 'Please write a short reason for your co-founder application.' });
    if (reason.length > 2000) return res.status(400).json({ error: 'Reason is too long (max 2000 characters).' });

    const found = findCampaignOrRelief(targetType, id);
    if (!found) return res.status(404).json({ error: targetType === 'relief' ? 'Relief campaign not found.' : 'Campaign not found.' });
    const item = found.item;
    const ownerId = String(item.founder_id || item.founderId || '');
    if (!ownerId) return res.status(400).json({ error: 'Campaign has no primary founder.' });
    if (ownerId === applicantId) {
      return res.status(400).json({ error: 'You are already the primary founder of this campaign.' });
    }

    const applicant = fallbackUsers.find((u) => String(u.id || u._id) === applicantId);
    if (!applicant || String(applicant.role || '').toLowerCase() !== 'founder') {
      return res.status(400).json({ error: 'Only registered founders can apply as co-founders.' });
    }

    const current = getCoFounders(item);
    if (current.some((c) => String(c.id) === applicantId || String(c.email || '').toLowerCase() === String(applicant.email || '').toLowerCase())) {
      return res.status(400).json({ error: 'You are already a co-founder on this campaign.' });
    }
    if (current.length >= MAX_COFOUNDERS) {
      return res.status(400).json({ error: `This campaign already has the maximum of ${MAX_COFOUNDERS} co-founders.` });
    }

    const pendingDup = fallbackCoFounderApplications.find((a) =>
      a.status === 'pending' &&
      a.target_type === found.kind &&
      String(a.target_id) === String(id) &&
      String(a.applicant_id) === applicantId
    );
    if (pendingDup) {
      return res.status(400).json({ error: 'You already have a pending co-founder application for this campaign.' });
    }

    const app = {
      id: 'cfa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      target_type: found.kind,
      target_id: String(item.id || item._id),
      target_title: item.title || 'Campaign',
      owner_id: ownerId,
      applicant_id: applicantId,
      applicant_name: applicant.name || 'Founder',
      applicant_email: applicant.email || '',
      applicant_university: applicant.university || '',
      reason,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    fallbackCoFounderApplications.unshift(app);
    persistS3CoFounderAppStore();

    await createAndDispatchNotification(
      ownerId,
      'Co-founder application',
      `${applicant.name || 'A founder'} applied to join “${app.target_title}” as a co-founder.`,
      'info'
    );

    res.status(201).json({ message: 'Co-founder application submitted to the primary founder.', application: app });
  } catch (err) {
    console.error('Co-founder apply error:', err);
    res.status(500).json({ error: 'Error submitting co-founder application.' });
  }
};

app.post('/api/campaigns/:id/cofounder-applications', (req, res) => submitCoFounderApplication(req, res, 'investment'));
app.post('/api/relief-drives/:id/cofounder-applications', (req, res) => submitCoFounderApplication(req, res, 'relief'));

app.get('/api/cofounder-applications/owner/:founderId', (req, res) => {
  const { founderId } = req.params;
  const list = fallbackCoFounderApplications
    .filter((a) => String(a.owner_id) === String(founderId))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.status(200).json(list);
});

app.get('/api/cofounder-applications/applicant/:founderId', (req, res) => {
  const { founderId } = req.params;
  const list = fallbackCoFounderApplications
    .filter((a) => String(a.applicant_id) === String(founderId))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.status(200).json(list);
});

app.get('/api/cofounder-applications/target/:type/:id', (req, res) => {
  const type = String(req.params.type || '') === 'relief' ? 'relief' : 'investment';
  const tid = String(req.params.id || '');
  const list = fallbackCoFounderApplications.filter(
    (a) => a.target_type === type && String(a.target_id) === tid
  );
  res.status(200).json(list);
});

app.post('/api/cofounder-applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    const ownerId = String(req.body.ownerId || req.body.founderId || '').trim();
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected.' });
    }
    const app = fallbackCoFounderApplications.find((a) => a.id === id);
    if (!app) return res.status(404).json({ error: 'Co-founder application not found.' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'This application was already reviewed.' });
    if (!ownerId || String(app.owner_id) !== ownerId) {
      return res.status(403).json({ error: 'Only the primary founder can review this application.' });
    }

    const found = findCampaignOrRelief(app.target_type, app.target_id);
    if (!found) return res.status(404).json({ error: 'Campaign not found.' });
    const item = found.item;
    if (String(item.founder_id || item.founderId) !== ownerId) {
      return res.status(403).json({ error: 'Only the primary founder can review this application.' });
    }

    if (status === 'accepted') {
      const current = getCoFounders(item);
      if (current.length >= MAX_COFOUNDERS) {
        return res.status(400).json({ error: `This campaign already has the maximum of ${MAX_COFOUNDERS} co-founders.` });
      }
      if (!current.some((c) => String(c.id) === String(app.applicant_id))) {
        const applicant = fallbackUsers.find((u) => String(u.id || u._id) === String(app.applicant_id));
        if (!applicant) return res.status(400).json({ error: 'Applicant account no longer exists.' });
        current.push(toCoFounderEntry(applicant));
        syncSuccessorFromCoFounders(item, current);
        if (found.kind === 'relief') persistS3ReliefStore();
        else persistS3CampaignStore();
      }
      app.status = 'accepted';
      app.reviewed_at = new Date().toISOString();
      persistS3CoFounderAppStore();
      await createAndDispatchNotification(
        app.applicant_id,
        'Co-founder application accepted',
        `You are now a co-founder on “${app.target_title}”.`,
        'success'
      );
      return res.status(200).json({ message: 'Co-founder application accepted.', application: app, coFounders: getCoFounders(item) });
    }

    app.status = 'rejected';
    app.reviewed_at = new Date().toISOString();
    app.owner_note = String(req.body.message || req.body.reason || '').trim();
    persistS3CoFounderAppStore();
    await createAndDispatchNotification(
      app.applicant_id,
      'Co-founder application declined',
      `Your application for “${app.target_title}” was declined.${app.owner_note ? ` Message: ${app.owner_note}` : ''}`,
      'warning'
    );
    res.status(200).json({ message: 'Co-founder application rejected.', application: app });
  } catch (err) {
    console.error('Co-founder status error:', err);
    res.status(500).json({ error: 'Error updating co-founder application.' });
  }
});

app.post('/api/campaigns/:id/cofounders/:userId/remove', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const ownerId = String(req.body.ownerId || req.body.founderId || '').trim();
    const message = String(req.body.message || req.body.reason || '').trim();
    if (!ownerId) return res.status(400).json({ error: 'Primary founder ID is required.' });
    if (!message) return res.status(400).json({ error: 'Please include a short message for the removed co-founder.' });

    const cmp = fallbackCampaigns.find((c) => String(c.id || c._id) === String(id));
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (String(cmp.founder_id || cmp.founderId) !== ownerId) {
      return res.status(403).json({ error: 'Only the primary founder can remove co-founders.' });
    }
    const next = getCoFounders(cmp).filter((c) => String(c.id) !== String(userId));
    if (next.length === getCoFounders(cmp).length) {
      return res.status(404).json({ error: 'That co-founder is not on this campaign.' });
    }
    syncSuccessorFromCoFounders(cmp, next);
    persistS3CampaignStore();
    await createAndDispatchNotification(
      userId,
      'Removed as co-founder',
      `You were removed as a co-founder from “${cmp.title}”. Message from primary founder: ${message}`,
      'warning'
    );
    res.status(200).json({ message: 'Co-founder removed.', coFounders: next });
  } catch (err) {
    res.status(500).json({ error: 'Error removing co-founder.' });
  }
});

app.post('/api/relief-drives/:id/cofounders/:userId/remove', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const ownerId = String(req.body.ownerId || req.body.founderId || '').trim();
    const message = String(req.body.message || req.body.reason || '').trim();
    if (!ownerId) return res.status(400).json({ error: 'Primary founder ID is required.' });
    if (!message) return res.status(400).json({ error: 'Please include a short message for the removed co-founder.' });

    const drive = fallbackReliefDrives.find((d) => String(d.id || d._id) === String(id));
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (String(drive.founder_id || drive.founderId) !== ownerId) {
      return res.status(403).json({ error: 'Only the primary founder can remove co-founders.' });
    }
    const next = getCoFounders(drive).filter((c) => String(c.id) !== String(userId));
    if (next.length === getCoFounders(drive).length) {
      return res.status(404).json({ error: 'That co-founder is not on this campaign.' });
    }
    syncSuccessorFromCoFounders(drive, next);
    persistS3ReliefStore();
    await createAndDispatchNotification(
      userId,
      'Removed as co-founder',
      `You were removed as a co-founder from “${drive.title}”. Message from primary founder: ${message}`,
      'warning'
    );
    res.status(200).json({ message: 'Co-founder removed.', coFounders: next });
  } catch (err) {
    res.status(500).json({ error: 'Error removing co-founder.' });
  }
});

// ============================================================================
// S3: CUSTOM PROGRESS TAGS (per campaign)
// ============================================================================
app.get('/api/progress-tags/founder/:founderId', (req, res) => {
  // S3
  const { founderId } = req.params;
  const ids = fallbackCampaigns
    .filter((c) => String(c.founder_id) === String(founderId))
    .map((c) => c.id || c._id)
    .filter(Boolean);
  const out = {};
  ids.forEach((id) => {
    if (Array.isArray(fallbackProgressTags[id]) && fallbackProgressTags[id].length > 0) {
      out[id] = fallbackProgressTags[id];
    }
  });
  res.status(200).json(out);
});

app.post('/api/campaigns/:id/progress-tags', (req, res) => {
  try {
    // S3
    const { id } = req.params;
    const { founderId, tag } = req.body;
    const cmp = fallbackCampaigns.find((c) => c.id === id || c._id === id);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (!founderId || String(cmp.founder_id) !== String(founderId)) {
      return res.status(403).json({ error: 'You can only add tags to your own campaigns.' });
    }
    const t = String(tag || '').trim();
    if (!t) return res.status(400).json({ error: 'Tag name is required.' });
    if (!Array.isArray(fallbackProgressTags[id])) fallbackProgressTags[id] = [];
    if (!fallbackProgressTags[id].includes(t)) fallbackProgressTags[id].push(t);
    persistS3ProgressTagStore(); // S3
    res.status(201).json({ tags: fallbackProgressTags[id] });
  } catch (err) {
    res.status(500).json({ error: 'Error saving progress tag.' });
  }
});

// ============================================================================
// S3: FOUNDER WALLET (ledger credits from accepted investments — no payment gateway)
// ============================================================================
app.get('/api/founders/:founderId/wallet', async (req, res) => {
  try {
    const { founderId } = req.params;
    await syncFounderWalletFromAcceptedProposals(founderId);
    await syncFounderWalletFromReliefDonations(founderId); // S3: investor relief donations
    const w = ensureFounderWallet(founderId);
    const pendingPayout = await s3PendingPayoutTotal(founderId); // S3: all pending requests
    const balance = Number(w.balance || 0);
    const inflows = (w.ledger || []).filter((r) =>
      r.direction === 'in' ||
      r.type === 'INVESTMENT_IN' ||
      r.type === 'SEED_ESCROW' ||
      r.type === 'MANUAL_DEPOSIT' ||
      r.type === 'RELIEF_DONATION_IN'
    );
    // S3: escrow mirror of owned campaign raised (aligns Wallet with Overview)
    const ownerKeys = await s3FounderOwnerKeys(founderId);
    const campaignEscrow = fallbackCampaigns
      .filter((c) => s3CampaignOwnedBy(c, ownerKeys) && (c.verified === true || ['verified', 'open', 'live'].includes(String(c.status || '').toLowerCase())))
      .reduce((s, c) => s + (Number(c.raised) || 0), 0);
    const reliefEscrow = fallbackReliefDrives
      .filter((d) => ownerKeys.has(String(d.founder_id || d.founderId || '')) && ['open', 'verified'].includes(String(d.status || '').toLowerCase()))
      .reduce((s, d) => s + (Number(d.raised) || 0), 0);
    const escrowTotal = campaignEscrow + reliefEscrow;
    const personalAvailable = founderWalletPersonalAvailable(founderId); // S3
    res.status(200).json({
      balance,
      in_escrow: escrowTotal > 0 ? escrowTotal : balance,
      available_to_withdraw: Math.max(0, balance - pendingPayout),
      personal_available: personalAvailable, // S3: Add Money only — for security deposit
      available_for_security: personalAvailable, // S3
      pending_payout_requests: pendingPayout,
      investment_inflows: inflows,
      ledger: w.ledger || [],
      campaign_escrow_total: campaignEscrow,
      relief_escrow_total: reliefEscrow,
      note: 'Ledger only — no instant payment gateway. Accepted proposals, relief donations, prior escrow, and admin-verified manual top-ups credit this wallet.'
    });
  } catch (err) {
    res.status(200).json({
      balance: 0,
      in_escrow: 0,
      available_to_withdraw: 0,
      pending_payout_requests: 0,
      investment_inflows: [],
      ledger: [],
      note: 'Ledger only — no payment gateway.'
    });
  }
});

// S3: founder submits manual Add Money (bKash / bank / other) with proof for admin verify
app.get('/api/founders/:founderId/wallet/deposits', (req, res) => {
  try {
    const { founderId } = req.params;
    const rows = fallbackWalletDeposits
      .filter((d) => String(d.founder_id) === String(founderId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(rows);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/founders/:founderId/wallet/deposits', upload.single('proofFile'), async (req, res) => {
  try {
    const { founderId } = req.params;
    const amount = Number(req.body.amount);
    const method = String(req.body.method || '').toLowerCase();
    const reference = String(req.body.reference || req.body.trxId || '').trim();
    const note = String(req.body.note || '').trim();
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid amount to add.' });
    }
    if (!['bkash', 'bank', 'other'].includes(method)) {
      return res.status(400).json({ error: 'Choose bKash, Bank, or Other.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a payment proof receipt (JPG, PNG, or PDF).' });
    }
    const deposit = {
      id: `wdep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      owner_role: 'founder',
      founder_id: String(founderId),
      owner_id: String(founderId),
      amount,
      method,
      reference,
      note,
      proof_url: `/uploads/${req.file.filename}`,
      proof_filename: req.file.originalname || req.file.filename,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviewed_at: null,
      review_note: ''
    };
    fallbackWalletDeposits.unshift(deposit);
    persistS3WalletDepositStore();
    await syncWalletDepositToSupabase(deposit);
    await createAndDispatchNotification(
      'usr_admin_1',
      'Manual wallet top-up pending 💳',
      `Founder ${founderId} submitted ৳ ${amount.toLocaleString()} via ${method} for wallet credit verification.`,
      'info'
    );
    res.status(201).json({
      message: 'Add Money request submitted. Admin will verify your proof before crediting the wallet.',
      deposit
    });
  } catch (err) {
    console.error('Wallet deposit error:', err);
    res.status(500).json({ error: err.message || 'Error submitting Add Money request.' });
  }
});

app.get('/api/admin/wallet-deposits/pending', (req, res) => {
  try {
    const rows = fallbackWalletDeposits
      .filter((d) => String(d.status || '').toLowerCase() === 'pending')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(rows);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/admin/wallet-deposits/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    const reviewNote = String(req.body.reviewNote || req.body.reason || '').trim();
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    const dep = fallbackWalletDeposits.find((d) => d.id === id);
    if (!dep) return res.status(404).json({ error: 'Deposit request not found.' });
    if (String(dep.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ error: 'This deposit was already reviewed.' });
    }
    dep.status = status;
    dep.reviewed_at = new Date().toISOString();
    dep.review_note = reviewNote;
    const isInvestorDep = String(dep.owner_role || '').toLowerCase() === 'investor' || !!dep.investor_id;
    if (status === 'approved') {
      if (isInvestorDep) {
        // S3: credit investor wallet (additive branch)
        creditInvestorWalletManualDeposit({
          investorId: dep.investor_id || dep.owner_id,
          amount: dep.amount,
          method: dep.method,
          depositId: dep.id,
          reference: dep.reference
        });
      } else {
        creditFounderWalletManualDeposit({
          founderId: dep.founder_id,
          amount: dep.amount,
          method: dep.method,
          depositId: dep.id,
          reference: dep.reference
        });
      }
    }
    persistS3WalletDepositStore();
    await syncWalletDepositToSupabase(dep);
    const notifyUser = isInvestorDep ? (dep.investor_id || dep.owner_id) : dep.founder_id;
    if (notifyUser) {
      await createAndDispatchNotification(
        notifyUser,
        status === 'approved' ? 'Wallet top-up approved ✅' : 'Wallet top-up rejected ❌',
        status === 'approved'
          ? `৳ ${Number(dep.amount).toLocaleString()} was credited to your wallet after proof verification.`
          : `Your Add Money request for ৳ ${Number(dep.amount).toLocaleString()} was rejected.${reviewNote ? ' Reason: ' + reviewNote : ''}`,
        status === 'approved' ? 'success' : 'warning'
      );
    }
    res.status(200).json({ message: `Deposit ${status}.`, deposit: dep });
  } catch (err) {
    res.status(500).json({ error: 'Error updating deposit status.' });
  }
});

// S3: investor wallet (consistent with founder wallet cards)
app.get('/api/investors/:investorId/wallet', (req, res) => {
  try {
    const { investorId } = req.params;
    const w = syncInvestorWallet(investorId);
    const balance = Number(w.balance || 0);
    const ledger = w.ledger || [];
    const inflows = ledger.filter((r) => r.direction !== 'out');
    const outflows = ledger.filter((r) => r.direction === 'out');
    const capitalCommitted = outflows
      .filter((r) => r.type === 'INVESTMENT_OUT' || r.type === 'RELIEF_OUT')
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const pendingHeld = fallbackProposals
      .filter((p) => String(p.investor_id || p.investorId || '') === String(investorId))
      .filter((p) => ['pending', 'negotiating'].includes(String(p.status || '').toLowerCase()))
      .reduce((s, p) => {
        const amt = p.counter_amount != null && Number(p.counter_amount) > 0 ? Number(p.counter_amount) : Number(p.amount);
        return s + (Number.isFinite(amt) ? amt : 0);
      }, 0);
    res.status(200).json({
      balance,
      capital_committed: capitalCommitted,
      pending_commitments: pendingHeld,
      available_to_deploy: Math.max(0, balance),
      inflows,
      outflows,
      ledger,
      note: 'Ledger only — no instant payment gateway. Add Money (admin-verified) credits this wallet; accepted investments and relief donations debit it.'
    });
  } catch (err) {
    res.status(200).json({
      balance: 0,
      capital_committed: 0,
      pending_commitments: 0,
      available_to_deploy: 0,
      inflows: [],
      outflows: [],
      ledger: [],
      note: 'Ledger only — no payment gateway.'
    });
  }
});

app.get('/api/investors/:investorId/wallet/deposits', (req, res) => {
  try {
    const { investorId } = req.params;
    const rows = fallbackWalletDeposits
      .filter((d) => String(d.investor_id || d.owner_id || '') === String(investorId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(rows);
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/investors/:investorId/wallet/deposits', upload.single('proofFile'), async (req, res) => {
  try {
    const { investorId } = req.params;
    const amount = Number(req.body.amount);
    const method = String(req.body.method || '').toLowerCase();
    const reference = String(req.body.reference || req.body.trxId || '').trim();
    const note = String(req.body.note || '').trim();
    if (!investorId) return res.status(400).json({ error: 'Investor ID is required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid amount to add.' });
    }
    if (!['bkash', 'bank', 'other', 'nagad'].includes(method)) {
      return res.status(400).json({ error: 'Choose bKash, Nagad, Bank, or Other.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a payment proof receipt (JPG, PNG, or PDF).' });
    }
    const deposit = {
      id: `wdep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      owner_role: 'investor',
      investor_id: String(investorId),
      owner_id: String(investorId),
      amount,
      method,
      reference,
      note,
      proof_url: `/uploads/${req.file.filename}`,
      proof_filename: req.file.originalname || req.file.filename,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviewed_at: null,
      review_note: ''
    };
    fallbackWalletDeposits.unshift(deposit);
    persistS3WalletDepositStore();
    await syncWalletDepositToSupabase(deposit);
    await createAndDispatchNotification(
      'usr_admin_1',
      'Investor wallet top-up pending 💳',
      `Investor ${investorId} submitted ৳ ${amount.toLocaleString()} via ${method} for wallet credit verification.`,
      'info'
    );
    res.status(201).json({
      message: 'Add Money request submitted. Admin will verify your proof before crediting the wallet.',
      deposit
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error submitting Add Money request.' });
  }
});

// ============================================================================
// S3: FOUNDER SECURITY DEPOSIT (recorded bond; no payment gateway)
// ============================================================================
app.get('/api/founders/:founderId/security-deposit', (req, res) => {
  // S3
  const founderId = req.params.founderId;
  const rec = fallbackSecurityDeposits[founderId] || { amount: 0, ledger: [] };
  res.status(200).json({
    ...rec,
    personal_available: founderWalletPersonalAvailable(founderId), // S3: Add Money only
    available_for_security: founderWalletPersonalAvailable(founderId)
  });
});

app.post('/api/founders/:founderId/security-deposit', (req, res) => {
  try {
    // S3: security deposit funded only from personal Add Money balance (not investment/donation credits)
    const { founderId } = req.params;
    const amount = Number(req.body.amount);
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid deposit amount.' });
    }
    const depRowId = 'dep_' + Date.now();
    const debit = debitFounderWalletForSecurityDeposit({
      founderId,
      amount,
      depositRowId: depRowId
    });
    if (!debit.ok) {
      return res.status(400).json({ error: debit.error });
    }
    if (!fallbackSecurityDeposits[founderId]) {
      fallbackSecurityDeposits[founderId] = { amount: 0, ledger: [] };
    }
    fallbackSecurityDeposits[founderId].amount = Number(fallbackSecurityDeposits[founderId].amount || 0) + amount;
    fallbackSecurityDeposits[founderId].ledger = [
      {
        id: depRowId,
        amount,
        method: 'Personal wallet (Add Money)',
        source: 'personal_topup',
        created_at: new Date().toISOString()
      },
      ...(fallbackSecurityDeposits[founderId].ledger || [])
    ].slice(0, 50);
    persistS3DepositStore(); // S3
    res.status(201).json({
      ...fallbackSecurityDeposits[founderId],
      wallet_balance: Number(debit.wallet?.balance || 0),
      personal_available: founderWalletPersonalAvailable(founderId),
      available_for_security: founderWalletPersonalAvailable(founderId)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error recording security deposit.' });
  }
});

// S3: founder self-funds an investment campaign from wallet (labeled — not investor money)
app.post('/api/founders/:founderId/campaigns/:campaignId/fund-from-wallet', async (req, res) => {
  try {
    const { founderId, campaignId } = req.params;
    const amount = Number(req.body.amount);
    if (!founderId || !campaignId) return res.status(400).json({ error: 'Founder and campaign are required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid amount to transfer from wallet.' });
    }
    const ownerKeys = await s3FounderOwnerKeys(founderId);
    const cmp = fallbackCampaigns.find((c) => c.id === campaignId || c._id === campaignId);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (!s3CampaignOwnedBy(cmp, ownerKeys)) {
      return res.status(403).json({ error: 'You can only fund your own campaigns.' });
    }
    const live = cmp.verified === true || ['verified', 'open', 'live'].includes(String(cmp.status || '').toLowerCase());
    if (!live) {
      return res.status(400).json({ error: 'Campaign must be live/approved before self-funding from wallet.' });
    }
    const debit = debitFounderWallet({
      founderId,
      amount,
      type: 'CAMPAIGN_SELF_FUND',
      title: cmp.title || campaignId,
      campaignId,
      note: 'Founder self-funding from wallet into campaign raised (not an investor contribution).',
      refId: `selffund_${campaignId}_${Date.now()}`
    });
    if (!debit.ok) return res.status(400).json({ error: debit.error });
    cmp.raised = Number(cmp.raised || 0) + amount;
    persistS3CampaignStore();
    res.status(201).json({
      message: 'Wallet funds added to campaign raised (founder self-funding).',
      campaign: normalizeCampaign(cmp),
      wallet_balance: Number(debit.wallet?.balance || 0)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error funding campaign from wallet.' });
  }
});

// S3: investor (or any donor) adds money to an open relief campaign (ledger)
app.post('/api/relief-drives/:id/donate', async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body.amount);
    const investorId = String(req.body.investorId || req.body.donorId || '').trim();
    const investorName = String(req.body.investorName || req.body.donorName || 'Donor').trim() || 'Donor';
    const method = String(req.body.method || 'bkash').trim().toLowerCase();
    const reference = String(req.body.reference || '').trim();
    if (!id) return res.status(400).json({ error: 'Relief campaign id is required.' });
    if (!investorId) return res.status(400).json({ error: 'Donor id is required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid donation amount.' });
    }
    const drive = fallbackReliefDrives.find((d) => d.id === id || d._id === id);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (!['open', 'verified'].includes(String(drive.status || '').toLowerCase())) {
      return res.status(400).json({ error: 'Only open/approved relief campaigns can receive donations.' });
    }
    // S3: debit donor wallet first (same model as founder spends from wallet)
    const donationId = `rldon_${Date.now()}_${Math.floor(Math.random() * 900)}`;
    const debit = debitInvestorWallet({
      investorId,
      amount,
      type: 'RELIEF_OUT',
      title: drive.title || id,
      campaignId: drive.id || drive._id,
      note: 'Relief donation from wallet.',
      refId: `relief_out_${donationId}`,
      requireFunds: true
    });
    if (!debit.ok) return res.status(400).json({ error: debit.error });
    const row = {
      id: donationId,
      drive_id: drive.id || drive._id,
      drive_title: drive.title || id,
      investor_id: investorId,
      investor_name: investorName,
      amount,
      method,
      reference,
      status: 'recorded',
      note: 'Relief donation recorded (ledger only — no payment gateway). Credits campaign raised.',
      created_at: new Date().toISOString()
    };
    drive.raised = Number(drive.raised || 0) + amount;
    if (!Array.isArray(drive.donations)) drive.donations = [];
    drive.donations.unshift({
      id: row.id,
      investor_id: investorId,
      investor_name: investorName,
      amount,
      method,
      created_at: row.created_at
    });
    fallbackReliefDonations.unshift(row);
    persistS3ReliefStore();
    persistS3ReliefDonationStore();
    // S3: connect investor donate → founder wallet + live notify (additive)
    const founderId = String(drive.founder_id || drive.founderId || '');
    let walletBalance = null;
    if (founderId) {
      const credited = creditFounderWalletReliefDonation({
        founderId,
        amount,
        investorId,
        investorName,
        driveId: drive.id || drive._id,
        driveTitle: drive.title,
        donationId: row.id
      });
      walletBalance = credited ? Number(credited.balance || 0) : null;
      await createAndDispatchNotification(
        founderId,
        'Relief donation received',
        `${investorName} donated ৳ ${amount.toLocaleString()} to “${drive.title || 'your relief campaign'}”.`,
        'success'
      );
      if (typeof io !== 'undefined' && io) {
        io.to(founderId).emit('relief_updated', {
          drive_id: drive.id || drive._id,
          raised: drive.raised,
          donation: row
        });
        io.emit('relief_updated', {
          drive_id: drive.id || drive._id,
          raised: drive.raised,
          donation: row
        });
      }
    }
    // S3: investor’s own audit trail (not founder audit)
    await writeInvestorAuditLog({
      investorId,
      category: 'RELIEF',
      title: `Donated ৳ ${amount.toLocaleString()} to ${drive.title || 'relief campaign'}`,
      status: 'RECORDED'
    });
    res.status(201).json({
      message: 'Donation recorded and added to relief raised.',
      donation: row,
      drive,
      founder_wallet_balance: walletBalance
    });
  } catch (err) {
    res.status(500).json({ error: 'Error recording relief donation.' });
  }
});

app.get('/api/relief-drives/:id/donations', (req, res) => {
  const { id } = req.params;
  const list = fallbackReliefDonations
    .filter((d) => String(d.drive_id) === String(id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.status(200).json(list);
});

app.get('/api/investors/:investorId/relief-donations', (req, res) => {
  const { investorId } = req.params;
  const list = fallbackReliefDonations
    .filter((d) => String(d.investor_id) === String(investorId))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.status(200).json(list);
});

// S3: founder self-funds a relief campaign from wallet
app.post('/api/founders/:founderId/relief-drives/:driveId/fund-from-wallet', async (req, res) => {
  try {
    const { founderId, driveId } = req.params;
    const amount = Number(req.body.amount);
    if (!founderId || !driveId) return res.status(400).json({ error: 'Founder and relief campaign are required.' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Enter a valid amount to transfer from wallet.' });
    }
    const ownerKeys = await s3FounderOwnerKeys(founderId);
    const drive = fallbackReliefDrives.find((d) => d.id === driveId || d._id === driveId);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (!ownerKeys.has(String(drive.founder_id || drive.founderId || ''))) {
      return res.status(403).json({ error: 'You can only fund your own relief campaigns.' });
    }
    const live = ['open', 'verified'].includes(String(drive.status || '').toLowerCase());
    if (!live) {
      return res.status(400).json({ error: 'Relief campaign must be open/approved before self-funding.' });
    }
    // S3: same ring-fence as security deposit — only personal Add Money (bKash/bank), not investment credits
    const debit = debitFounderWalletFromPersonal({
      founderId,
      amount,
      type: 'RELIEF_SELF_FUND',
      title: drive.title || driveId,
      campaignId: driveId,
      note: 'Founder donated from personal Add Money into relief raised (not from investment credits).',
      refId: `reliefselffund_${driveId}_${Date.now()}`,
      purposeLabel: 'Relief donation'
    });
    if (!debit.ok) return res.status(400).json({ error: debit.error });
    drive.raised = Number(drive.raised || 0) + amount;
    if (!Array.isArray(drive.donations)) drive.donations = [];
    const donationRow = {
      id: `rldon_self_${Date.now()}`,
      investor_id: founderId,
      investor_name: 'Founder (personal donation)',
      amount,
      method: 'personal_topup',
      created_at: new Date().toISOString()
    };
    drive.donations.unshift(donationRow);
    persistS3ReliefStore();
    res.status(201).json({
      message: 'Personal Add Money donated to relief campaign raised.',
      drive,
      wallet_balance: Number(debit.wallet?.balance || 0),
      personal_available: founderWalletPersonalAvailable(founderId),
      available_for_security: founderWalletPersonalAvailable(founderId)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error funding relief campaign from wallet.' });
  }
});

// ============================================================================
// FR-8: PROGRESS LOGGING / ANNOUNCEMENTS APIS
// ============================================================================
app.get('/api/campaigns/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;
    const viewer = String(req.query.viewer || 'public').toLowerCase();
    const founderId = req.query.founderId;
    if (!id) return res.status(400).json({ error: 'Campaign ID is required.' });

    // S3: hollow seed id campusbites → also load canonical campusbites_1 updates
    const updateIds = id === 'campusbites' ? ['campusbites', 'campusbites_1'] : [id];

    let list = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_updates')
          .select('*')
          .in('campaign_id', updateIds)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) list = data;
      } catch (e) {}
    }

    const local = fallbackUpdates.filter((u) => updateIds.includes(String(u.campaign_id)));
    if (list.length === 0) {
      list = local;
    } else if (local.length > 0) {
      const seen = new Set(list.map(u => u.id));
      list = [...local.filter(u => !seen.has(u.id)), ...list];
    }

    // Public viewers only see admin-approved updates. Founders see their own (all statuses).
    if (viewer === 'founder' && founderId) {
      list = list.filter(u => u.founder_id === founderId);
    } else if (viewer !== 'admin') {
      list = list.filter(u => (u.status || 'approved') === 'approved');
    }

    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching campaign updates.' });
  }
});

app.post('/api/campaigns/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;
    const { founderId, title, content, milestoneTag } = req.body;

    if (!id) return res.status(400).json({ error: 'Campaign ID is required.' });
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (!String(title || '').trim() || !String(content || '').trim()) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newUpdate = {
      id: 'upd_' + Date.now(),
      campaign_id: id,
      founder_id: founderId,
      title: String(title).trim(),
      content: String(content).trim(),
      milestone_tag: String(milestoneTag || 'General Update').trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaign_updates').insert([newUpdate]); } catch (e) {}
    }
    fallbackUpdates.unshift(newUpdate);
    persistS3UpdateStore(); // S3

    // S3: notify founder (confirmation) + admin (Content Approvals queue)
    const camp = fallbackCampaigns.find((c) => c.id === id || c._id === id);
    const campTitle = camp?.title || id;
    try {
      await createAndDispatchNotification(
        founderId,
        'Progress update submitted 📝',
        `“${newUpdate.title}” for ${campTitle} is pending admin approval.`,
        'info'
      );
      await createAndDispatchNotification(
        'usr_admin_1',
        'Progress update pending review 📝',
        `Founder submitted “${newUpdate.title}” on ${campTitle} (${newUpdate.milestone_tag || 'General'}).`,
        'info'
      );
    } catch (e) {}

    res.status(201).json(newUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Error creating campaign update.' });
  }
});

app.get('/api/admin/campaign-updates/pending', async (req, res) => {
  try {
    const list = fallbackUpdates
      .filter(u => (u.status || 'pending') === 'pending')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pending campaign updates.' });
  }
});

app.post('/api/admin/campaign-updates/:updateId/status', async (req, res) => {
  try {
    const { updateId } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    const upd = fallbackUpdates.find(u => u.id === updateId);
    if (!upd) return res.status(404).json({ error: 'Campaign update not found.' });
    upd.status = status;
    upd.reviewed_at = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaign_updates').update({ status }).eq('id', updateId);
      } catch (e) {}
    }

    persistS3UpdateStore(); // S3
    // S3: notify founder of approve/reject
    try {
      if (upd.founder_id) {
        await createAndDispatchNotification(
          upd.founder_id,
          status === 'approved' ? 'Progress update approved ✅' : 'Progress update rejected',
          status === 'approved'
            ? `Your update “${upd.title}” was approved and is now visible.`
            : `Your update “${upd.title}” was rejected.`,
          status === 'approved' ? 'success' : 'warning'
        );
      }
    } catch (e) {}
    res.status(200).json({ message: `Update ${status}.`, update: upd });
  } catch (err) {
    res.status(500).json({ error: 'Error updating campaign update status.' });
  }
});

// S3: reject a progress update with a reason (does not change POST .../status)
app.post('/api/admin/campaign-updates/:updateId/reject', async (req, res) => {
  try {
    const { updateId } = req.params;
    const reason = String(req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ error: 'A rejection reason is required.' });
    const upd = fallbackUpdates.find((u) => u.id === updateId);
    if (!upd) return res.status(404).json({ error: 'Campaign update not found.' });
    upd.status = 'rejected';
    upd.rejectionReason = reason;
    upd.rejection_reason = reason;
    upd.reviewed_at = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaign_updates').update({ status: 'rejected' }).eq('id', updateId);
      } catch (e) {}
    }
    persistS3UpdateStore(); // S3
    try {
      if (upd.founder_id) {
        await createAndDispatchNotification(
          upd.founder_id,
          'Progress update rejected',
          `Your update “${upd.title}” was rejected. Reason: ${reason}`,
          'warning'
        );
      }
    } catch (e) {}
    res.status(200).json({ message: 'Update rejected.', update: upd });
  } catch (err) {
    res.status(500).json({ error: 'Error rejecting campaign update.' });
  }
});

// Founder milestone proof upload (evidence for a specific milestone)
app.post('/api/campaigns/:id/milestones/:milestoneId/proofs', upload.single('proofFile'), async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const founderId = req.body.founderId;
    const note = String(req.body.note || '').trim();
    const idx = Number(milestoneId);

    if (!id) return res.status(400).json({ error: 'Campaign ID is required.' });
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (Number.isNaN(idx) || idx < 0) return res.status(400).json({ error: 'Invalid milestone id.' });
    if (!req.file) return res.status(400).json({ error: 'Proof file is required (PDF, JPG, or PNG).' });

    const proof = {
      id: 'proof_' + Date.now(),
      path: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      note,
      uploaded_by: founderId,
      created_at: new Date().toISOString()
    };

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (!cmp) return res.status(404).json({ error: 'Campaign not found.' });
    if (!Array.isArray(cmp.milestones) || !cmp.milestones[idx]) {
      return res.status(404).json({ error: 'Milestone not found on this campaign.' });
    }

    if (!Array.isArray(cmp.milestones[idx].proofs)) cmp.milestones[idx].proofs = [];
    cmp.milestones[idx].proofs.push(proof);
    const st = String(cmp.milestones[idx].status || '').toLowerCase();
    if (st !== 'done' && st !== 'completed') {
      cmp.milestones[idx].status = 'pending_review';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ milestones: cmp.milestones }).eq('id', id);
      } catch (e) {}
    }

    persistS3CampaignStore(); // S3

    res.status(201).json({
      message: 'Proof uploaded for milestone verification.',
      proof,
      milestoneId: idx,
      milestone: cmp.milestones[idx]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading milestone proof.' });
  }
});

// S3: relief milestone proof upload (same UX as campaigns; admin verifies work, no repayment)
app.post('/api/relief-drives/:id/milestones/:milestoneId/proofs', upload.single('proofFile'), async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const founderId = req.body.founderId;
    const note = String(req.body.note || '').trim();
    const idx = Number(milestoneId);

    if (!id) return res.status(400).json({ error: 'Relief campaign ID is required.' });
    if (!founderId) return res.status(400).json({ error: 'Founder ID is required.' });
    if (Number.isNaN(idx) || idx < 0) return res.status(400).json({ error: 'Invalid milestone id.' });
    if (!req.file) return res.status(400).json({ error: 'Proof file is required (PDF, JPG, or PNG).' });

    const drive = fallbackReliefDrives.find((d) => d.id === id || d._id === id);
    if (!drive) return res.status(404).json({ error: 'Relief campaign not found.' });
    if (drive.founder_id && String(drive.founder_id) !== String(founderId)) {
      return res.status(403).json({ error: 'You can only upload proofs for your own relief campaigns.' });
    }
    ensureReliefMilestones(drive);
    if (!drive.milestones[idx]) {
      return res.status(404).json({ error: 'Milestone not found on this relief campaign.' });
    }

    const proof = {
      id: 'proof_' + Date.now(),
      path: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      note,
      uploaded_by: founderId,
      created_at: new Date().toISOString()
    };
    if (!Array.isArray(drive.milestones[idx].proofs)) drive.milestones[idx].proofs = [];
    drive.milestones[idx].proofs.push(proof);
    const st = String(drive.milestones[idx].status || '').toLowerCase();
    if (st !== 'done' && st !== 'completed') {
      drive.milestones[idx].status = 'pending_review';
    }
    persistS3ReliefStore(); // S3

    res.status(201).json({
      message: 'Proof uploaded for relief milestone verification (progress only — no repayment).',
      proof,
      milestoneId: idx,
      milestone: drive.milestones[idx],
      drive
    });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading relief milestone proof.' });
  }
});

// ============================================================================
// FR-15: INVESTOR WATCHLIST PINS APIS
// ============================================================================
app.get('/api/investors/watchlist', async (req, res) => {
  try {
    const { userId } = req.query;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      if (!error && data) return res.status(200).json(data);
    }
    const saved = fallbackWatchlist.filter(w => w.user_id === userId);
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching watchlist.' });
  }
});

app.post('/api/investors/watchlist', async (req, res) => {
  try {
    const { userId, campaignId } = req.body;
    if (!userId || !campaignId) return res.status(400).json({ error: 'User ID and Campaign ID required.' });

    const existingIdx = fallbackWatchlist.findIndex(w => w.user_id === userId && w.campaign_id === campaignId);
    let status = 'added';

    if (existingIdx >= 0) {
      fallbackWatchlist.splice(existingIdx, 1);
      status = 'removed';
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('watchlist').delete().eq('user_id', userId).eq('campaign_id', campaignId); } catch(e){}
      }
    } else {
      const item = { id: 'w_' + Date.now(), user_id: userId, campaign_id: campaignId, created_at: new Date().toISOString() };
      fallbackWatchlist.push(item);
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('watchlist').insert([item]); } catch(e){}
      }
    }

    res.status(200).json({ status, campaignId });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling watchlist.' });
  }
});

// ============================================================================
// FR-22: AUTOMATED NOTIFICATIONS APIS
// ============================================================================
app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const filtered = data.filter(n => !userId || n.user_id === userId);
        return res.status(200).json(filtered);
      }
    }
    const list = fallbackNotifications.filter(n => !userId || n.user_id === userId);
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching notifications.' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('notifications').update({ is_read: true }).eq('id', id); } catch(e){}
    }
    const notif = fallbackNotifications.find(n => n.id === id);
    if (notif) notif.is_read = true;
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Error marking notification read.' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title) return res.status(400).json({ error: 'User ID and title required.' });

    const notif = await createAndDispatchNotification(userId, title, message || '', type || 'info');
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Error sending notification.' });
  }
});

// ============================================================================
// INVESTOR DASHBOARD SYSTEM ENDPOINTS (FR-23 to FR-28)
// ============================================================================

// PROPOSAL WITHDRAWAL
app.post('/api/proposals/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').update({ status: 'withdrawn' }).eq('id', id);
      } catch (e) {}
    }
    const prop = fallbackProposals.find(p => p.id === id || p._id === id);
    if (prop) {
      prop.status = 'withdrawn';
      persistS3ProposalStore(); // S3
      s3EmitProposalUpdated(prop); // S3
    }
    res.status(200).json({ message: 'Proposal withdrawn successfully.', proposalId: id });
  } catch (err) {
    res.status(500).json({ error: 'Error withdrawing proposal.' });
  }
});

app.delete('/api/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').update({ status: 'withdrawn' }).eq('id', id);
      } catch (e) {}
    }
    const prop = fallbackProposals.find(p => p.id === id || p._id === id);
    if (prop) {
      prop.status = 'withdrawn';
      persistS3ProposalStore(); // S3
      s3EmitProposalUpdated(prop); // S3
    }
    res.status(200).json({ message: 'Proposal withdrawn successfully.', proposalId: id });
  } catch (err) {
    res.status(500).json({ error: 'Error withdrawing proposal.' });
  }
});

// CO-INVESTOR CONNECTIONS APIS
app.get('/api/investors/connections', async (req, res) => {
  try {
    const { userId } = req.query;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('investor_connections').select('*');
      if (!error && data) {
        const filtered = data.filter(c => !userId || c.requester_id === userId || c.receiver_id === userId);
        return res.status(200).json(filtered);
      }
    }
    const list = fallbackConnections.filter(c => !userId || c.requester_id === userId || c.receiver_id === userId);
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching investor connections.' });
  }
});

app.post('/api/investors/connect', async (req, res) => {
  try {
    const { requesterId, receiverId } = req.body;
    if (!requesterId || !receiverId) return res.status(400).json({ error: 'Requester ID and Receiver ID required.' });

    const existing = fallbackConnections.find(c =>
      (c.requester_id === requesterId && c.receiver_id === receiverId) ||
      (c.requester_id === receiverId && c.receiver_id === requesterId)
    );

    if (existing) {
      return res.status(200).json({ message: 'Connection request already exists.', connection: existing });
    }

    const conn = {
      id: 'conn_' + Date.now(),
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('investor_connections').insert([conn]); } catch(e){}
    }
    fallbackConnections.push(conn);

    await createAndDispatchNotification(
      receiverId,
      'New Co-Investor Connection Request! 🤝',
      'An alumni angel investor wants to connect with your investment network.',
      'info'
    );

    res.status(201).json({ message: 'Connection request sent.', connection: conn });
  } catch (err) {
    res.status(500).json({ error: 'Error sending connection request.' });
  }
});

// BOOKMARKED FOUNDERS APIS
app.get('/api/investors/bookmarked-founders', async (req, res) => {
  try {
    const { userId } = req.query;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookmarked_founders').select('*').eq('investor_id', userId);
      if (!error && data) return res.status(200).json(data);
    }
    const list = fallbackBookmarkedFounders.filter(b => b.investor_id === userId);
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching bookmarked founders.' });
  }
});

app.post('/api/investors/bookmark-founder', async (req, res) => {
  try {
    const { investorId, founderId } = req.body;
    if (!investorId || !founderId) return res.status(400).json({ error: 'Investor ID and Founder ID required.' });

    const existingIdx = fallbackBookmarkedFounders.findIndex(b => b.investor_id === investorId && b.founder_id === founderId);
    let status = 'bookmarked';

    if (existingIdx >= 0) {
      fallbackBookmarkedFounders.splice(existingIdx, 1);
      status = 'unbookmarked';
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('bookmarked_founders').delete().eq('investor_id', investorId).eq('founder_id', founderId); } catch(e){}
      }
    } else {
      const item = { id: 'bf_' + Date.now(), investor_id: investorId, founder_id: founderId, created_at: new Date().toISOString() };
      fallbackBookmarkedFounders.push(item);
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('bookmarked_founders').insert([item]); } catch(e){}
      }
    }

    res.status(200).json({ status, founderId });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling bookmarked founder.' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // S3: retire hollow Supabase CampusBites seed (৳450k, 0 milestones) when canonical campusbites_1 exists
  (async () => {
    try {
      if (!isSupabaseConfigured || !supabase) return;
      const hasCanonical = fallbackCampaigns.some((c) => (c.id || c._id) === 'campusbites_1');
      if (!hasCanonical) return;
      await supabase
        .from('campaigns')
        .update({ verified: false, status: 'archived' })
        .eq('id', 'campusbites');
    } catch (e) {
      console.warn('S3 CampusBites seed retire warning:', e.message);
    }
  })();
});

export default app;
