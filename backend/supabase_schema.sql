-- ========================================================
-- FUNDBRIDGE COMPLETE SUPABASE DATABASE SCHEMA
-- ========================================================
-- This file contains all table schemas, columns, indexes, 
-- and initial seed data for the FundBridge Web Application.
-- Compatible with PostgreSQL and Supabase.
-- ========================================================

-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. USERS TABLE (Founders, Investors, Admin)
-- ========================================================
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

-- Migrations & Safe Column Alters for Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'founder';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vetting_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfs_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id_card_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nid_card_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliation_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS passing_year TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nid_or_passport TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_or_mfs TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nid_or_passport_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_link TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vetting_date TIMESTAMP WITH TIME ZONE;

-- ========================================================
-- 2. CAMPAIGNS TABLE (Startup Pitches)
-- ========================================================
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

-- Migrations & Safe Column Alters for Campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pitch_video_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS escrow_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- ========================================================
-- 3. PROPOSALS TABLE (Investor Backing Offers)
-- ========================================================
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

-- Migrations & Safe Column Alters for Proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS return_structure TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS maturity_period TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS grace_period TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS custom_notes TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ========================================================
-- 4. PAYOUTS TABLE (Founder Wallet Disbursements)
-- ========================================================
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

-- Migrations & Safe Column Alters for Payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending Audit';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS hash TEXT NOT NULL DEFAULT '0x0000';

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

-- Migrations & Safe Column Alters for Disputes
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'High';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';

-- ========================================================
-- 6. AUDIT LOGS TABLE (Cryptographic Hash Receipts)
-- ========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'VERIFIED',
  latency TEXT DEFAULT '14ms',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- PERFORMANCE INDEXES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_campaigns_founder_id ON campaigns(founder_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_proposals_campaign_id ON proposals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_proposals_investor_id ON proposals(investor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_founder_id ON payouts(founder_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- Disable RLS for simple direct backend API connectivity
-- ========================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- SEED DATA (Default Entities for Immediate Platform Setup)
-- ========================================================

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
INSERT INTO campaigns (id, title, university, location, category, stage, goal, raised, equity_offer, tagline, description, verified, status, milestones)
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
  'verified',
  '[{"title": "MVP Launch", "target": "Month 1", "status": "done"}, {"title": "First 100 Users", "target": "Month 2", "status": "pending"}, {"title": "Revenue ৳50K", "target": "Month 4", "status": "locked"}]'::jsonb
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
VALUES ('0x8f2a99c4b1d09e1a', 'DISBURSEMENT', 'Escrow Tranche #1 Release', 'VERIFIED', '14ms')
ON CONFLICT DO NOTHING;
