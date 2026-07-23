-- ========================================================
-- FUNDBRIDGE COMPLETE SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Users Table (Founders, Investors, Admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 2. Campaigns Table (Startup Pitches)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  founder_id UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- Ensure all columns exist if the table was previously created
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pitch_video_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS escrow_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Proposals Table (Investor Backing Offers)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  return_structure TEXT,
  maturity_period TEXT,
  grace_period TEXT,
  terms TEXT NOT NULL,
  custom_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist if proposals table was previously created
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS return_structure TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS maturity_period TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS grace_period TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS custom_notes TEXT;

-- 4. Payouts Table (Founder Wallet Disbursements)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tranche TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'Pending Audit',
  hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Disputes Table (User Complaints & Holds)
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

-- 6. Audit Logs Table (Cryptographic Receipt Hashes)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'VERIFIED',
  latency TEXT DEFAULT '14ms',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for smooth API access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- SEED DATA (Default Admin, Founder, Investor, Campaigns, & Disputes)

-- 1. Default Admin User
INSERT INTO users (name, email, password, role, vetting_status, mfs_number)
VALUES ('ADMIN_PRITOM', 'admin@fundbridge.com', 'admin123', 'admin', 'verified', '01799999999')
ON CONFLICT (email) DO NOTHING;

-- 2. Default Student Founder User
INSERT INTO users (name, email, password, role, vetting_status, university, student_id, department, mfs_number)
VALUES ('Anika Rahman', 'anika@brac.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20101452', 'Computer Science & Engineering', '01711223344')
ON CONFLICT (email) DO NOTHING;

-- 3. Default Investor User
INSERT INTO users (name, email, password, role, vetting_status, institution, bank_or_mfs)
VALUES ('Vantage Ventures Dhaka', 'investor@firm.com', 'investorpassword', 'investor', 'verified', 'Vantage Capital LLC', 'City Bank - 1092837465')
ON CONFLICT (email) DO NOTHING;

-- 4. Default Seed Campaign
INSERT INTO campaigns (id, title, university, location, category, stage, goal, raised, equity_offer, tagline, description, verified, status)
VALUES (
  'campusbites',
  'CampusBites',
  'BRAC University',
  'Dhaka, Bangladesh',
  'FoodTech / SaaS',
  'MVP',
  500000,
  450000,
  '8% Rev. Share',
  'Smart Canteen Ordering & Pre-Meal Reservation App for University Campuses',
  'CampusBites eliminates long queues at university cafeterias by enabling pre-ordering via Mobile Financial Services (bKash/Nagad). Fully integrated with student ID cards.',
  TRUE,
  'verified'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Default Seed Complaint Dispute
INSERT INTO disputes (id, complainant_name, complainant_role, reported_user, reported_role, campaign_title, campaign_id, issue_type, description, severity, status)
VALUES (
  'CMP-801',
  'Vantage Ventures Dhaka',
  'investor',
  'Anika Rahman',
  'student',
  'CampusBites',
  'campusbites',
  'Late Milestone Delivery',
  'Founder has failed to submit Milestone 2 proof documents past the agreed 30-day timeline despite receiving seed funding tranche.',
  'Critical',
  'Open'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Default Audit Hash Entry
INSERT INTO audit_logs (hash, category, title, status, latency)
VALUES ('0x8f2a99c4b1d09e1a', 'DISBURSEMENT', 'Escrow Tranche #1 Release', 'VERIFIED', '14ms');


