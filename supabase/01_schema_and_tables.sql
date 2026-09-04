-- ========================================================
-- FUNDBRIDGE SUPABASE DATABASE SCHEMA
-- File: 01_schema_and_tables.sql
-- Work: Core Database Schema, Tables, Constraints & RLS
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. USERS TABLE (Founders, Investors, Admin)
-- ========================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'founder',
  vetting_status TEXT DEFAULT 'pending',
  mfs_number TEXT,
  university TEXT,
  student_id TEXT,
  department TEXT,
  nid TEXT,
  dob TEXT,
  student_id_card_image TEXT,
  nid_card_image TEXT,
  affiliation_status TEXT,
  institution TEXT,
  passing_year TEXT,
  nid_or_passport TEXT,
  bank_or_mfs TEXT,
  nid_or_passport_image TEXT,
  credentials_image TEXT,
  credentials_link TEXT,
  vetting_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'founder';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vetting_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfs_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TEXT;

-- ========================================================
-- 2. CAMPAIGNS TABLE (Startup Pitches)
-- ========================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  founder_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  university TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL,
  goal NUMERIC NOT NULL,
  raised NUMERIC DEFAULT 0,
  equity_offer TEXT NOT NULL,
  tagline TEXT,
  cover_photo TEXT,
  pitch_video_url TEXT,
  description TEXT NOT NULL,
  milestones JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  escrow_frozen BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 3. PROPOSALS TABLE (Investor Backing Offers)
-- ========================================================
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  investor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  return_structure TEXT,
  maturity_period TEXT,
  grace_period TEXT,
  terms TEXT NOT NULL,
  custom_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 4. PAYOUTS TABLE (Founder Wallet Disbursements)
-- ========================================================
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  founder_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  tranche TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'Pending Audit',
  hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 4b. WALLET DEPOSITS (Add Money proofs — founder + investor)
-- ========================================================
CREATE TABLE IF NOT EXISTS wallet_deposits (
  id TEXT PRIMARY KEY,
  owner_role TEXT NOT NULL DEFAULT 'founder',
  founder_id TEXT,
  investor_id TEXT,
  owner_id TEXT,
  amount NUMERIC NOT NULL,
  method TEXT,
  reference TEXT,
  note TEXT,
  proof_url TEXT,
  proof_filename TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT
);

-- ========================================================
-- 4c. WALLET ACCOUNTS (ledger JSON for founder + investor)
-- ========================================================
CREATE TABLE IF NOT EXISTS wallet_accounts (
  owner_id TEXT PRIMARY KEY,
  owner_role TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  ledger JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 5. DISPUTES TABLE (User Complaints & Escrow Holds)
-- ========================================================
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  complainant_name TEXT NOT NULL,
  complainant_role TEXT NOT NULL,
  reported_user TEXT NOT NULL,
  reported_user_id TEXT,
  reported_role TEXT NOT NULL,
  campaign_title TEXT,
  campaign_id TEXT,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_file TEXT,
  severity TEXT DEFAULT 'High',
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 6. AUDIT LOGS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hash TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'VERIFIED',
  latency TEXT DEFAULT '14ms',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 7. MESSAGES TABLE (Inbox & Direct Chats)
-- ========================================================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_name TEXT,
  campaign_id TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 8. WATCHLIST & CONNECTIONS & BOOKMARKS TABLES
-- ========================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investor_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  requester_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarked_founders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  investor_id TEXT NOT NULL,
  founder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 9. NOTIFICATIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  sender_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link_url TEXT,
  event_key TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_uidx
  ON notifications (user_id, event_key)
  WHERE event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON notifications (user_id, is_read, created_at DESC);

-- ========================================================
-- 10. CAMPAIGN UPDATES TABLE (Founder Broadcasts)
-- ========================================================
CREATE TABLE IF NOT EXISTS campaign_updates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  author_id TEXT,
  author_name TEXT,
  status TEXT DEFAULT 'approved',
  review_note TEXT,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 11. RELIEF CAMPAIGNS & DONATIONS TABLES (Charity Drives)
-- ========================================================
CREATE TABLE IF NOT EXISTS relief_campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cause TEXT NOT NULL,
  founder_id TEXT,
  founder_name TEXT,
  university TEXT,
  goal NUMERIC NOT NULL,
  raised NUMERIC DEFAULT 0,
  beneficiary TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  description TEXT,
  proof_url TEXT,
  use_of_funds JSONB DEFAULT '[]'::jsonb,
  donors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relief_donations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  relief_campaign_id TEXT REFERENCES relief_campaigns(id) ON DELETE CASCADE,
  donor_id TEXT,
  donor_name TEXT,
  donor_role TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  trx_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 12. TRASH TABLE (Soft-Delete & Erase System)
-- ========================================================
CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  title TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  "deletedBy" TEXT,
  "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 13. INVESTMENT TRENDS TABLE (Curated Market Insights)
-- ========================================================
CREATE TABLE IF NOT EXISTS investment_trends (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  significance TEXT,
  investor_insight TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  relevant_sectors TEXT[]
);

-- ========================================================
-- 14. PARTNERSHIPS TABLE (Active Investment Deals & Ledgers)
-- ========================================================
CREATE TABLE IF NOT EXISTS partnerships (
  id TEXT PRIMARY KEY,
  proposal_id TEXT,
  campaign_id TEXT,
  founder_id TEXT,
  investor_id TEXT,
  total_committed NUMERIC,
  frozen BOOLEAN DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnerships_founder ON partnerships (founder_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_investor ON partnerships (investor_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_proposal ON partnerships (proposal_id);

-- ========================================================
-- 15. AI MATCHING & OPTIMIZATION COLUMNS
-- ========================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS investment_budget_min numeric,
  ADD COLUMN IF NOT EXISTS investment_budget_max numeric,
  ADD COLUMN IF NOT EXISTS sector_interests text[],
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS campaign_id TEXT;

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE investor_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarked_founders DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE relief_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE relief_donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE investment_trends DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- SAFE TYPE CONVERSION MIGRATIONS
-- ========================================================
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_investor_id_fkey;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_founder_id_fkey;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_founder_id_fkey;

ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE campaigns ALTER COLUMN founder_id TYPE TEXT USING founder_id::text;
ALTER TABLE proposals ALTER COLUMN investor_id TYPE TEXT USING investor_id::text;
ALTER TABLE payouts ALTER COLUMN founder_id TYPE TEXT USING founder_id::text;

ALTER TABLE campaigns ADD CONSTRAINT campaigns_founder_id_fkey FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE proposals ADD CONSTRAINT proposals_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payouts ADD CONSTRAINT payouts_founder_id_fkey FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE;
