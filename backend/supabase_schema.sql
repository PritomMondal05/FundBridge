-- ========================================================
-- FUNDBRIDGE SUPABASE DATABASE SCHEMA & INITIAL DATA
-- ========================================================

-- 1. Create Users Table
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

-- 2. Create Campaigns Table
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
  description TEXT NOT NULL,
  milestones JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  terms TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn off RLS (Row Level Security) for initial dev setup so direct backend API works smoothly
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;

-- SEED DATA (Default Admin User)
INSERT INTO users (name, email, password, role, vetting_status, mfs_number)
VALUES ('ADMIN_PRITOM', 'admin@fundbridge.com', 'admin123', 'admin', 'verified', '01799999999')
ON CONFLICT (email) DO NOTHING;
