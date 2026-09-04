-- ========================================================
-- FUNDBRIDGE COMPLETE SUPABASE DATABASE SCHEMA
-- ========================================================
-- Compatible with PostgreSQL and Supabase.
-- Contains 30 Verified Investors, 100 Verified Student Founders & 50 Startup Campaigns.
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
-- 7. MESSAGES TABLE
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

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
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
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE investor_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarked_founders DISABLE ROW LEVEL SECURITY;

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


-- ========================================================
-- SEED DATA (30 INVESTORS, 100 STUDENT FOUNDERS & 50 CAMPAIGNS)
-- ========================================================

-- Clean up any legacy conflicting emails before re-seeding
DELETE FROM users WHERE email IN ('admin@fundbridge.com', 'investor@firm.com', 'anika@brac.edu.bd', 'tanvir@buet.ac.bd', 'nabila@northsouth.edu', 'samiul@du.ac.bd') AND id NOT LIKE 'usr_%';

-- 1. Default Admin User
INSERT INTO users (id, name, email, password, role, vetting_status, mfs_number)
VALUES ('usr_admin_1', 'ADMIN_PRITOM', 'admin@fundbridge.com', 'admin123', 'admin', 'verified', '01799999999')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password;

-- 2. STUDENT FOUNDERS (100 Verified Student Entrepreneurs)
INSERT INTO users (id, name, email, password, role, vetting_status, university, student_id, department, mfs_number)
VALUES
  ('usr_founder_1', 'Ashraf Khan', 'ashraf.khan1@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BUET', '20100037', 'Electrical & Electronic Engineering', '01710008371'),
  ('usr_founder_2', 'Aziz Zaman', 'aziz.zaman2@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'North South University', '20100074', 'Business Administration', '01710016742'),
  ('usr_founder_3', 'Fahim Alam', 'fahim.alam3@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Dhaka University (IBA)', '20100111', 'Software Engineering', '01710025113'),
  ('usr_founder_4', 'Habib Mahmud', 'habib.mahmud4@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'SUST', '20100148', 'Mechanical Engineering', '01710033484'),
  ('usr_founder_5', 'Jasmine Begum', 'jasmine.begum5@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'IUT Gazipur', '20100185', 'Biomedical Engineering', '01710041855'),
  ('usr_founder_6', 'Laila Ali', 'laila.ali6@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'RUET', '20100222', 'Civil Engineering', '01710050226'),
  ('usr_founder_7', 'Monir Mia', 'monir.mia7@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'CUET', '20100259', 'Industrial & Production Engineering', '01710058597'),
  ('usr_founder_8', 'Nasir Bhuiyan', 'nasir.bhuiyan8@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'KUET', '20100296', 'Mechatronics & Robotics', '01710066968'),
  ('usr_founder_9', 'Parveen Chowdhury', 'parveen.chowdhury9@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'AIUB', '20100333', 'Finance & Economics', '01710075339'),
  ('usr_founder_10', 'Rashid Rahman', 'rashid.rahman10@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'MIST', '20100370', 'Marketing & E-Commerce', '01710083710'),
  ('usr_founder_11', 'Sabrina Haider', 'sabrina.haider11@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'East West University', '20100407', 'Data Science & Artificial Intelligence', '01710092081'),
  ('usr_founder_12', 'Sameer Hasan', 'sameer.hasan12@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'United International University', '20100444', 'Environmental Technology', '01710100452'),
  ('usr_founder_13', 'Shakir Sarker', 'shakir.sarker13@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Independent University Bangladesh (IUB)', '20100481', 'Biotechnology', '01710108823'),
  ('usr_founder_14', 'Sumaiya Kabir', 'sumaiya.kabir14@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Ahsanullah University of Science & Technology (AUST)', '20100518', 'Computer Science & Engineering', '01710117194'),
  ('usr_founder_15', 'Tasnim Hossain', 'tasnim.hossain15@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Jahangirnagar University', '20100555', 'Electrical & Electronic Engineering', '01710125565'),
  ('usr_founder_16', 'Zainab Sultana', 'zainab.sultana16@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Rajshahi University', '20100592', 'Business Administration', '01710133936'),
  ('usr_founder_17', 'Amina Mustafa', 'amina.mustafa17@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Chittagong University', '20100629', 'Software Engineering', '01710142307'),
  ('usr_founder_18', 'Asma Islam', 'asma.islam18@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Khulna University', '20100666', 'Mechanical Engineering', '01710150678'),
  ('usr_founder_19', 'Bilal Uddin', 'bilal.uddin19@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Daffodil International University', '20100703', 'Biomedical Engineering', '01710159049'),
  ('usr_founder_20', 'Farhana Ahmed', 'farhana.ahmed20@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20100740', 'Civil Engineering', '01710167420'),
  ('usr_founder_21', 'Hasan Khan', 'hasan.khan21@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BUET', '20100777', 'Industrial & Production Engineering', '01710175791'),
  ('usr_founder_22', 'Kamal Zaman', 'kamal.zaman22@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'North South University', '20100814', 'Mechatronics & Robotics', '01710184162'),
  ('usr_founder_23', 'Mahbub Alam', 'mahbub.alam23@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Dhaka University (IBA)', '20100851', 'Finance & Economics', '01710192533'),
  ('usr_founder_24', 'Nabil Mahmud', 'nabil.mahmud24@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'SUST', '20100888', 'Marketing & E-Commerce', '01710200904'),
  ('usr_founder_25', 'Nusrat Begum', 'nusrat.begum25@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'IUT Gazipur', '20100925', 'Data Science & Artificial Intelligence', '01710209275'),
  ('usr_founder_26', 'Rafiq Ali', 'rafiq.ali26@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'RUET', '20100962', 'Environmental Technology', '01710217646'),
  ('usr_founder_27', 'Roxana Mia', 'roxana.mia27@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'CUET', '20100999', 'Biotechnology', '01710226017'),
  ('usr_founder_28', 'Saeed Bhuiyan', 'saeed.bhuiyan28@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'KUET', '20101036', 'Computer Science & Engineering', '01710234388'),
  ('usr_founder_29', 'Samira Chowdhury', 'samira.chowdhury29@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'AIUB', '20101073', 'Electrical & Electronic Engineering', '01710242759'),
  ('usr_founder_30', 'Sharmin Rahman', 'sharmin.rahman30@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'MIST', '20101110', 'Business Administration', '01710251130'),
  ('usr_founder_31', 'Syed Haider', 'syed.haider31@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'East West University', '20101147', 'Software Engineering', '01710259501'),
  ('usr_founder_32', 'Yousuf Hasan', 'yousuf.hasan32@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'United International University', '20101184', 'Mechanical Engineering', '01710267872'),
  ('usr_founder_33', 'Zubair Sarker', 'zubair.sarker33@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Independent University Bangladesh (IUB)', '20101221', 'Biomedical Engineering', '01710276243'),
  ('usr_founder_34', 'Arman Kabir', 'arman.kabir34@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Ahsanullah University of Science & Technology (AUST)', '20101258', 'Civil Engineering', '01710284614'),
  ('usr_founder_35', 'Atiq Hossain', 'atiq.hossain35@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Jahangirnagar University', '20101295', 'Industrial & Production Engineering', '01710292985'),
  ('usr_founder_36', 'Bushra Sultana', 'bushra.sultana36@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Rajshahi University', '20101332', 'Mechatronics & Robotics', '01710301356'),
  ('usr_founder_37', 'Faruk Mustafa', 'faruk.mustafa37@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Chittagong University', '20101369', 'Finance & Economics', '01710309727'),
  ('usr_founder_38', 'Imran Islam', 'imran.islam38@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Khulna University', '20101406', 'Marketing & E-Commerce', '01710318098'),
  ('usr_founder_39', 'Khaled Uddin', 'khaled.uddin39@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Daffodil International University', '20101443', 'Data Science & Artificial Intelligence', '01710326469'),
  ('usr_founder_40', 'Mariam Ahmed', 'mariam.ahmed40@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20101480', 'Environmental Technology', '01710334840'),
  ('usr_founder_41', 'Nadia Khan', 'nadia.khan41@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BUET', '20101517', 'Biotechnology', '01710343211'),
  ('usr_founder_42', 'Omar Zaman', 'omar.zaman42@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'North South University', '20101554', 'Computer Science & Engineering', '01710351582'),
  ('usr_founder_43', 'Rahim Alam', 'rahim.alam43@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Dhaka University (IBA)', '20101591', 'Electrical & Electronic Engineering', '01710359953'),
  ('usr_founder_44', 'Saad Mahmud', 'saad.mahmud44@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'SUST', '20101628', 'Business Administration', '01710368324'),
  ('usr_founder_45', 'Salma Begum', 'salma.begum45@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'IUT Gazipur', '20101665', 'Software Engineering', '01710376695'),
  ('usr_founder_46', 'Shahid Ali', 'shahid.ali46@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'RUET', '20101702', 'Mechanical Engineering', '01710385066'),
  ('usr_founder_47', 'Sohail Mia', 'sohail.mia47@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'CUET', '20101739', 'Biomedical Engineering', '01710393437'),
  ('usr_founder_48', 'Tariq Bhuiyan', 'tariq.bhuiyan48@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'KUET', '20101776', 'Civil Engineering', '01710401808'),
  ('usr_founder_49', 'Zahid Chowdhury', 'zahid.chowdhury49@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'AIUB', '20101813', 'Industrial & Production Engineering', '01710410179'),
  ('usr_founder_50', 'Aarif Rahman', 'aarif.rahman50@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'MIST', '20101850', 'Mechatronics & Robotics', '01710418550'),
  ('usr_founder_51', 'Ashraf Haider', 'ashraf.haider51@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'East West University', '20101887', 'Finance & Economics', '01710426921'),
  ('usr_founder_52', 'Aziz Hasan', 'aziz.hasan52@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'United International University', '20101924', 'Marketing & E-Commerce', '01710435292'),
  ('usr_founder_53', 'Fahim Sarker', 'fahim.sarker53@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Independent University Bangladesh (IUB)', '20101961', 'Data Science & Artificial Intelligence', '01710443663'),
  ('usr_founder_54', 'Habib Kabir', 'habib.kabir54@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Ahsanullah University of Science & Technology (AUST)', '20101998', 'Environmental Technology', '01710452034'),
  ('usr_founder_55', 'Jasmine Hossain', 'jasmine.hossain55@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Jahangirnagar University', '20102035', 'Biotechnology', '01710460405'),
  ('usr_founder_56', 'Laila Sultana', 'laila.sultana56@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Rajshahi University', '20102072', 'Computer Science & Engineering', '01710468776'),
  ('usr_founder_57', 'Monir Mustafa', 'monir.mustafa57@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Chittagong University', '20102109', 'Electrical & Electronic Engineering', '01710477147'),
  ('usr_founder_58', 'Nasir Islam', 'nasir.islam58@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Khulna University', '20102146', 'Business Administration', '01710485518'),
  ('usr_founder_59', 'Parveen Uddin', 'parveen.uddin59@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Daffodil International University', '20102183', 'Software Engineering', '01710493889'),
  ('usr_founder_60', 'Rashid Ahmed', 'rashid.ahmed60@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20102220', 'Mechanical Engineering', '01710502260'),
  ('usr_founder_61', 'Sabrina Khan', 'sabrina.khan61@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BUET', '20102257', 'Biomedical Engineering', '01710510631'),
  ('usr_founder_62', 'Sameer Zaman', 'sameer.zaman62@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'North South University', '20102294', 'Civil Engineering', '01710519002'),
  ('usr_founder_63', 'Shakir Alam', 'shakir.alam63@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Dhaka University (IBA)', '20102331', 'Industrial & Production Engineering', '01710527373'),
  ('usr_founder_64', 'Sumaiya Mahmud', 'sumaiya.mahmud64@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'SUST', '20102368', 'Mechatronics & Robotics', '01710535744'),
  ('usr_founder_65', 'Tasnim Begum', 'tasnim.begum65@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'IUT Gazipur', '20102405', 'Finance & Economics', '01710544115'),
  ('usr_founder_66', 'Zainab Ali', 'zainab.ali66@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'RUET', '20102442', 'Marketing & E-Commerce', '01710552486'),
  ('usr_founder_67', 'Amina Mia', 'amina.mia67@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'CUET', '20102479', 'Data Science & Artificial Intelligence', '01710560857'),
  ('usr_founder_68', 'Asma Bhuiyan', 'asma.bhuiyan68@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'KUET', '20102516', 'Environmental Technology', '01710569228'),
  ('usr_founder_69', 'Bilal Chowdhury', 'bilal.chowdhury69@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'AIUB', '20102553', 'Biotechnology', '01710577599'),
  ('usr_founder_70', 'Farhana Rahman', 'farhana.rahman70@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'MIST', '20102590', 'Computer Science & Engineering', '01710585970'),
  ('usr_founder_71', 'Hasan Haider', 'hasan.haider71@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'East West University', '20102627', 'Electrical & Electronic Engineering', '01710594341'),
  ('usr_founder_72', 'Kamal Hasan', 'kamal.hasan72@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'United International University', '20102664', 'Business Administration', '01710602712'),
  ('usr_founder_73', 'Mahbub Sarker', 'mahbub.sarker73@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Independent University Bangladesh (IUB)', '20102701', 'Software Engineering', '01710611083'),
  ('usr_founder_74', 'Nabil Kabir', 'nabil.kabir74@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Ahsanullah University of Science & Technology (AUST)', '20102738', 'Mechanical Engineering', '01710619454'),
  ('usr_founder_75', 'Nusrat Hossain', 'nusrat.hossain75@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Jahangirnagar University', '20102775', 'Biomedical Engineering', '01710627825'),
  ('usr_founder_76', 'Rafiq Sultana', 'rafiq.sultana76@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Rajshahi University', '20102812', 'Civil Engineering', '01710636196'),
  ('usr_founder_77', 'Roxana Mustafa', 'roxana.mustafa77@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Chittagong University', '20102849', 'Industrial & Production Engineering', '01710644567'),
  ('usr_founder_78', 'Saeed Islam', 'saeed.islam78@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Khulna University', '20102886', 'Mechatronics & Robotics', '01710652938'),
  ('usr_founder_79', 'Samira Uddin', 'samira.uddin79@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Daffodil International University', '20102923', 'Finance & Economics', '01710661309'),
  ('usr_founder_80', 'Sharmin Ahmed', 'sharmin.ahmed80@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20102960', 'Marketing & E-Commerce', '01710669680'),
  ('usr_founder_81', 'Syed Khan', 'syed.khan81@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BUET', '20102997', 'Data Science & Artificial Intelligence', '01710678051'),
  ('usr_founder_82', 'Yousuf Zaman', 'yousuf.zaman82@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'North South University', '20103034', 'Environmental Technology', '01710686422'),
  ('usr_founder_83', 'Zubair Alam', 'zubair.alam83@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Dhaka University (IBA)', '20103071', 'Biotechnology', '01710694793'),
  ('usr_founder_84', 'Arman Mahmud', 'arman.mahmud84@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'SUST', '20103108', 'Computer Science & Engineering', '01710703164'),
  ('usr_founder_85', 'Atiq Begum', 'atiq.begum85@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'IUT Gazipur', '20103145', 'Electrical & Electronic Engineering', '01710711535'),
  ('usr_founder_86', 'Bushra Ali', 'bushra.ali86@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'RUET', '20103182', 'Business Administration', '01710719906'),
  ('usr_founder_87', 'Faruk Mia', 'faruk.mia87@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'CUET', '20103219', 'Software Engineering', '01710728277'),
  ('usr_founder_88', 'Imran Bhuiyan', 'imran.bhuiyan88@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'KUET', '20103256', 'Mechanical Engineering', '01710736648'),
  ('usr_founder_89', 'Khaled Chowdhury', 'khaled.chowdhury89@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'AIUB', '20103293', 'Biomedical Engineering', '01710745019'),
  ('usr_founder_90', 'Mariam Rahman', 'mariam.rahman90@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'MIST', '20103330', 'Civil Engineering', '01710753390'),
  ('usr_founder_91', 'Nadia Haider', 'nadia.haider91@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'East West University', '20103367', 'Industrial & Production Engineering', '01710761761'),
  ('usr_founder_92', 'Omar Hasan', 'omar.hasan92@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'United International University', '20103404', 'Mechatronics & Robotics', '01710770132'),
  ('usr_founder_93', 'Rahim Sarker', 'rahim.sarker93@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Independent University Bangladesh (IUB)', '20103441', 'Finance & Economics', '01710778503'),
  ('usr_founder_94', 'Saad Kabir', 'saad.kabir94@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Ahsanullah University of Science & Technology (AUST)', '20103478', 'Marketing & E-Commerce', '01710786874'),
  ('usr_founder_95', 'Salma Hossain', 'salma.hossain95@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Jahangirnagar University', '20103515', 'Data Science & Artificial Intelligence', '01710795245'),
  ('usr_founder_96', 'Shahid Sultana', 'shahid.sultana96@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Rajshahi University', '20103552', 'Environmental Technology', '01710803616'),
  ('usr_founder_97', 'Sohail Mustafa', 'sohail.mustafa97@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Chittagong University', '20103589', 'Biotechnology', '01710811987'),
  ('usr_founder_98', 'Tariq Islam', 'tariq.islam98@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Khulna University', '20103626', 'Computer Science & Engineering', '01710820358'),
  ('usr_founder_99', 'Zahid Uddin', 'zahid.uddin99@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'Daffodil International University', '20103663', 'Electrical & Electronic Engineering', '01710828729'),
  ('usr_founder_100', 'Aarif Ahmed', 'aarif.ahmed100@univ.edu.bd', 'founderpassword', 'founder', 'verified', 'BRAC University', '20103700', 'Business Administration', '01710837100')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, university = EXCLUDED.university, student_id = EXCLUDED.student_id, department = EXCLUDED.department, mfs_number = EXCLUDED.mfs_number;

-- 3. INVESTORS (30 Verified Alumni & Angel Partners)
INSERT INTO users (id, name, email, password, role, vetting_status, institution, bank_or_mfs, mfs_number)
VALUES
  ('usr_investor_1', 'Angel Backer Zaman', 'investor1@firm.com', 'investorpassword', 'investor', 'verified', 'Vantage Capital LLC', 'City Bank - ACC# 1000004921', '01820009182'),
  ('usr_investor_2', 'Kazi Mahmud Hassan', 'investor2@firm.com', 'investorpassword', 'investor', 'verified', 'Dhaka Angels Syndicate', 'City Bank - ACC# 1000009842', '01820018364'),
  ('usr_investor_3', 'Dr. Syeda Nigar Sultana', 'investor3@firm.com', 'investorpassword', 'investor', 'verified', 'Alumni Growth Fund BD', 'City Bank - ACC# 1000014763', '01820027546'),
  ('usr_investor_4', 'Farhan Ahmed Chowdhury', 'investor4@firm.com', 'investorpassword', 'investor', 'verified', 'Silicon Padma Capital', 'City Bank - ACC# 1000019684', '01820036728'),
  ('usr_investor_5', 'Raheed Iftekhar', 'investor5@firm.com', 'investorpassword', 'investor', 'verified', 'BRAC Alumni Angel Network', 'City Bank - ACC# 1000024605', '01820045910'),
  ('usr_investor_6', 'Rubaba Dowla', 'investor6@firm.com', 'investorpassword', 'investor', 'verified', 'Techempires Ventures', 'City Bank - ACC# 1000029526', '01820055092'),
  ('usr_investor_7', 'Taufiqur Rahman', 'investor7@firm.com', 'investorpassword', 'investor', 'verified', 'BUET Alumni Seed Fund', 'City Bank - ACC# 1000034447', '01820064274'),
  ('usr_investor_8', 'Zareen Mahmud Hosein', 'investor8@firm.com', 'investorpassword', 'investor', 'verified', 'Impact Capital Bangladesh', 'City Bank - ACC# 1000039368', '01820073456'),
  ('usr_investor_9', 'Asif Khan', 'investor9@firm.com', 'investorpassword', 'investor', 'verified', 'Edge Venture Partners', 'City Bank - ACC# 1000044289', '01820082638'),
  ('usr_investor_10', 'Sonia Bashir Kabir', 'investor10@firm.com', 'investorpassword', 'investor', 'verified', 'SBK Tech Ventures', 'City Bank - ACC# 1000049210', '01820091820'),
  ('usr_investor_11', 'Mustafizur Rahman', 'investor11@firm.com', 'investorpassword', 'investor', 'verified', 'Startups BD Angels', 'City Bank - ACC# 1000054131', '01820101002'),
  ('usr_investor_12', 'Waseem Alim', 'investor12@firm.com', 'investorpassword', 'investor', 'verified', 'Chaldal Syndicate', 'City Bank - ACC# 1000059052', '01820110184'),
  ('usr_investor_13', 'Miran Ali', 'investor13@firm.com', 'investorpassword', 'investor', 'verified', 'Beximco Innovation Lab', 'City Bank - ACC# 1000063973', '01820119366'),
  ('usr_investor_14', 'Shams Mahmud', 'investor14@firm.com', 'investorpassword', 'investor', 'verified', 'Shasha Tech Capital', 'City Bank - ACC# 1000068894', '01820128548'),
  ('usr_investor_15', 'Sadia Haque', 'investor15@firm.com', 'investorpassword', 'investor', 'verified', 'ShareTrip Alumni Syndicate', 'City Bank - ACC# 1000073815', '01820137730'),
  ('usr_investor_16', 'Fahim Mashroor', 'investor16@firm.com', 'investorpassword', 'investor', 'verified', 'Bdjobs Founders Circle', 'City Bank - ACC# 1000078736', '01820146912'),
  ('usr_investor_17', 'Syeda Kamrun Nahar', 'investor17@firm.com', 'investorpassword', 'investor', 'verified', 'Visionary Angels BD', 'City Bank - ACC# 1000083657', '01820156094'),
  ('usr_investor_18', 'Imran Fahad', 'investor18@firm.com', 'investorpassword', 'investor', 'verified', 'Inspira Advisory Capital', 'City Bank - ACC# 1000088578', '01820165276'),
  ('usr_investor_19', 'Tanveer Ali', 'investor19@firm.com', 'investorpassword', 'investor', 'verified', 'Constellation Asset Management', 'City Bank - ACC# 1000093499', '01820174458'),
  ('usr_investor_20', 'Minhaz Anwar', 'investor20@firm.com', 'investorpassword', 'investor', 'verified', 'BetterStories Angel Fund', 'City Bank - ACC# 1000098420', '01820183640'),
  ('usr_investor_21', 'Samad Miraly', 'investor21@firm.com', 'investorpassword', 'investor', 'verified', 'Vantage Capital LLC', 'City Bank - ACC# 1000103341', '01820192822'),
  ('usr_investor_22', 'Tajdin Hassan', 'investor22@firm.com', 'investorpassword', 'investor', 'verified', 'Dhaka Angels Syndicate', 'City Bank - ACC# 1000108262', '01820202004'),
  ('usr_investor_23', 'Nirjhor Rahman', 'investor23@firm.com', 'investorpassword', 'investor', 'verified', 'Alumni Growth Fund BD', 'City Bank - ACC# 1000113183', '01820211186'),
  ('usr_investor_24', 'Tina Jabeen', 'investor24@firm.com', 'investorpassword', 'investor', 'verified', 'Silicon Padma Capital', 'City Bank - ACC# 1000118104', '01820220368'),
  ('usr_investor_25', 'Adnan Imtiaz Halim', 'investor25@firm.com', 'investorpassword', 'investor', 'verified', 'BRAC Alumni Angel Network', 'City Bank - ACC# 1000123025', '01820229550'),
  ('usr_investor_26', 'Mahmudul Hasan', 'investor26@firm.com', 'investorpassword', 'investor', 'verified', 'Techempires Ventures', 'City Bank - ACC# 1000127946', '01820238732'),
  ('usr_investor_27', 'Nazim Farhan Choudhury', 'investor27@firm.com', 'investorpassword', 'investor', 'verified', 'BUET Alumni Seed Fund', 'City Bank - ACC# 1000132867', '01820247914'),
  ('usr_investor_28', 'Sajjad Hossain', 'investor28@firm.com', 'investorpassword', 'investor', 'verified', 'Impact Capital Bangladesh', 'City Bank - ACC# 1000137788', '01820257096'),
  ('usr_investor_29', 'Ayman Sadiq', 'investor29@firm.com', 'investorpassword', 'investor', 'verified', 'Edge Venture Partners', 'City Bank - ACC# 1000142709', '01820266278'),
  ('usr_investor_30', 'Habibullah N Karim', 'investor30@firm.com', 'investorpassword', 'investor', 'verified', 'SBK Tech Ventures', 'City Bank - ACC# 1000147630', '01820275460')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, institution = EXCLUDED.institution, bank_or_mfs = EXCLUDED.bank_or_mfs, mfs_number = EXCLUDED.mfs_number;

-- 4. 50 STARTUP CAMPAIGNS
INSERT INTO campaigns (id, title, founder_id, university, location, category, stage, goal, raised, equity_offer, tagline, description, verified, status, milestones)
VALUES
  ('campusbites_1', 'CampusBites', 'usr_founder_1', 'BUET', 'Dhaka, Bangladesh', 'FoodTech / SaaS', 'MVP', 435000, 174000, '5% Equity', 'Innovative Bangladeshi FoodTech / SaaS startup solving key campus and enterprise challenges.', 'CampusBites is a student-led FoodTech / SaaS startup founded at BUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('agrisensebd_2', 'AgriSense BD', 'usr_founder_2', 'North South University', 'Chittagong, Bangladesh', 'AgriTech / IoT', 'Prototype', 470000, 235000, '8% Rev. Share', 'Innovative Bangladeshi AgriTech / IoT startup solving key campus and enterprise challenges.', 'AgriSense BD is a student-led AgriTech / IoT startup founded at North South University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('skillcrafthub_3', 'SkillCraft Hub', 'usr_founder_3', 'Dhaka University (IBA)', 'Sylhet, Bangladesh', 'EdTech', 'Pilot', 505000, 303000, '10% Equity', 'Innovative Bangladeshi EdTech startup solving key campus and enterprise challenges.', 'SkillCraft Hub is a student-led EdTech startup founded at Dhaka University (IBA). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('ecopackdhaka_4', 'EcoPack Dhaka', 'usr_founder_4', 'SUST', 'Rajshahi, Bangladesh', 'CleanTech', 'Growth', 540000, 378000, '12% Rev. Share', 'Innovative Bangladeshi CleanTech startup solving key campus and enterprise challenges.', 'EcoPack Dhaka is a student-led CleanTech startup founded at SUST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('finflex_5', 'FinFlex', 'usr_founder_5', 'IUT Gazipur', 'Khulna, Bangladesh', 'FinTech', 'MVP', 575000, 460000, '15% Equity', 'Innovative Bangladeshi FinTech startup solving key campus and enterprise challenges.', 'FinFlex is a student-led FinTech startup founded at IUT Gazipur. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('healthconnect_6', 'HealthConnect', 'usr_founder_6', 'RUET', 'Gazipur, Bangladesh', 'HealthTech', 'Prototype', 610000, 183000, '7% Rev. Share', 'Innovative Bangladeshi HealthTech startup solving key campus and enterprise challenges.', 'HealthConnect is a student-led HealthTech startup founded at RUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('shuttlexpress_7', 'ShuttlExpress', 'usr_founder_7', 'CUET', 'Dhaka, Bangladesh', 'Logistics / Supply Chain', 'Pilot', 645000, 258000, '6% Equity', 'Innovative Bangladeshi Logistics / Supply Chain startup solving key campus and enterprise challenges.', 'ShuttlExpress is a student-led Logistics / Supply Chain startup founded at CUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('smartcart_8', 'SmartCart', 'usr_founder_8', 'KUET', 'Chittagong, Bangladesh', 'E-Commerce / Marketplace', 'Growth', 680000, 340000, '9% Rev. Share', 'Innovative Bangladeshi E-Commerce / Marketplace startup solving key campus and enterprise challenges.', 'SmartCart is a student-led E-Commerce / Marketplace startup founded at KUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('urbanloop_9', 'UrbanLoop', 'usr_founder_9', 'AIUB', 'Sylhet, Bangladesh', 'AI / Robotics', 'MVP', 715000, 429000, '5% Equity', 'Innovative Bangladeshi AI / Robotics startup solving key campus and enterprise challenges.', 'UrbanLoop is a student-led AI / Robotics startup founded at AIUB. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('biopolymer_10', 'BioPolymer', 'usr_founder_10', 'MIST', 'Rajshahi, Bangladesh', 'Biotech', 'Prototype', 750000, 525000, '8% Rev. Share', 'Innovative Bangladeshi Biotech startup solving key campus and enterprise challenges.', 'BioPolymer is a student-led Biotech startup founded at MIST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('bazaarmart_11', 'BazaarMart', 'usr_founder_11', 'East West University', 'Khulna, Bangladesh', 'FoodTech / SaaS', 'Pilot', 785000, 628000, '10% Equity', 'Innovative Bangladeshi FoodTech / SaaS startup solving key campus and enterprise challenges.', 'BazaarMart is a student-led FoodTech / SaaS startup founded at East West University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('microledger_12', 'MicroLedger', 'usr_founder_12', 'United International University', 'Gazipur, Bangladesh', 'AgriTech / IoT', 'Growth', 820000, 246000, '12% Rev. Share', 'Innovative Bangladeshi AgriTech / IoT startup solving key campus and enterprise challenges.', 'MicroLedger is a student-led AgriTech / IoT startup founded at United International University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('robobots_13', 'RoboBots', 'usr_founder_13', 'Independent University Bangladesh (IUB)', 'Dhaka, Bangladesh', 'EdTech', 'MVP', 855000, 342000, '15% Equity', 'Innovative Bangladeshi EdTech startup solving key campus and enterprise challenges.', 'RoboBots is a student-led EdTech startup founded at Independent University Bangladesh (IUB). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('solargrid_14', 'SolarGrid', 'usr_founder_14', 'Ahsanullah University of Science & Technology (AUST)', 'Chittagong, Bangladesh', 'CleanTech', 'Prototype', 890000, 445000, '7% Rev. Share', 'Innovative Bangladeshi CleanTech startup solving key campus and enterprise challenges.', 'SolarGrid is a student-led CleanTech startup founded at Ahsanullah University of Science & Technology (AUST). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('pulsecare_15', 'PulseCare', 'usr_founder_15', 'Jahangirnagar University', 'Sylhet, Bangladesh', 'FinTech', 'Pilot', 925000, 555000, '6% Equity', 'Innovative Bangladeshi FinTech startup solving key campus and enterprise challenges.', 'PulseCare is a student-led FinTech startup founded at Jahangirnagar University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('linkbridge_16', 'LinkBridge', 'usr_founder_16', 'Rajshahi University', 'Rajshahi, Bangladesh', 'HealthTech', 'Growth', 960000, 672000, '9% Rev. Share', 'Innovative Bangladeshi HealthTech startup solving key campus and enterprise challenges.', 'LinkBridge is a student-led HealthTech startup founded at Rajshahi University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('netflow_17', 'NetFlow', 'usr_founder_17', 'Chittagong University', 'Khulna, Bangladesh', 'Logistics / Supply Chain', 'MVP', 995000, 796000, '5% Equity', 'Innovative Bangladeshi Logistics / Supply Chain startup solving key campus and enterprise challenges.', 'NetFlow is a student-led Logistics / Supply Chain startup founded at Chittagong University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('syncnexus_18', 'SyncNexus', 'usr_founder_18', 'Khulna University', 'Gazipur, Bangladesh', 'E-Commerce / Marketplace', 'Prototype', 1030000, 309000, '8% Rev. Share', 'Innovative Bangladeshi E-Commerce / Marketplace startup solving key campus and enterprise challenges.', 'SyncNexus is a student-led E-Commerce / Marketplace startup founded at Khulna University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('flexpass_19', 'FlexPass', 'usr_founder_19', 'Daffodil International University', 'Dhaka, Bangladesh', 'AI / Robotics', 'Pilot', 1065000, 426000, '10% Equity', 'Innovative Bangladeshi AI / Robotics startup solving key campus and enterprise challenges.', 'FlexPass is a student-led AI / Robotics startup founded at Daffodil International University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('coreops_20', 'CoreOps', 'usr_founder_20', 'BRAC University', 'Chittagong, Bangladesh', 'Biotech', 'Growth', 1100000, 550000, '12% Rev. Share', 'Innovative Bangladeshi Biotech startup solving key campus and enterprise challenges.', 'CoreOps is a student-led Biotech startup founded at BRAC University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('agroyield_21', 'AgroYield', 'usr_founder_21', 'BUET', 'Sylhet, Bangladesh', 'FoodTech / SaaS', 'MVP', 1135000, 681000, '15% Equity', 'Innovative Bangladeshi FoodTech / SaaS startup solving key campus and enterprise challenges.', 'AgroYield is a student-led FoodTech / SaaS startup founded at BUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('medkiosk_22', 'MedKiosk', 'usr_founder_22', 'North South University', 'Rajshahi, Bangladesh', 'AgriTech / IoT', 'Prototype', 1170000, 819000, '7% Rev. Share', 'Innovative Bangladeshi AgriTech / IoT startup solving key campus and enterprise challenges.', 'MedKiosk is a student-led AgriTech / IoT startup founded at North South University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('edututor_23', 'EduTutor', 'usr_founder_23', 'Dhaka University (IBA)', 'Khulna, Bangladesh', 'EdTech', 'Pilot', 1205000, 964000, '6% Equity', 'Innovative Bangladeshi EdTech startup solving key campus and enterprise challenges.', 'EduTutor is a student-led EdTech startup founded at Dhaka University (IBA). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('paywallet_24', 'PayWallet', 'usr_founder_24', 'SUST', 'Gazipur, Bangladesh', 'CleanTech', 'Growth', 1240000, 372000, '9% Rev. Share', 'Innovative Bangladeshi CleanTech startup solving key campus and enterprise challenges.', 'PayWallet is a student-led CleanTech startup founded at SUST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('logilocker_25', 'LogiLocker', 'usr_founder_25', 'IUT Gazipur', 'Dhaka, Bangladesh', 'FinTech', 'MVP', 1275000, 510000, '5% Equity', 'Innovative Bangladeshi FinTech startup solving key campus and enterprise challenges.', 'LogiLocker is a student-led FinTech startup founded at IUT Gazipur. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('freshmarket_26', 'FreshMarket', 'usr_founder_26', 'RUET', 'Chittagong, Bangladesh', 'HealthTech', 'Prototype', 1310000, 655000, '8% Rev. Share', 'Innovative Bangladeshi HealthTech startup solving key campus and enterprise challenges.', 'FreshMarket is a student-led HealthTech startup founded at RUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('cleanpower_27', 'CleanPower', 'usr_founder_27', 'CUET', 'Sylhet, Bangladesh', 'Logistics / Supply Chain', 'Pilot', 1345000, 807000, '10% Equity', 'Innovative Bangladeshi Logistics / Supply Chain startup solving key campus and enterprise challenges.', 'CleanPower is a student-led Logistics / Supply Chain startup founded at CUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('aquamonitor_28', 'AquaMonitor', 'usr_founder_28', 'KUET', 'Rajshahi, Bangladesh', 'E-Commerce / Marketplace', 'Growth', 1380000, 966000, '12% Rev. Share', 'Innovative Bangladeshi E-Commerce / Marketplace startup solving key campus and enterprise challenges.', 'AquaMonitor is a student-led E-Commerce / Marketplace startup founded at KUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('terraharvest_29', 'TerraHarvest', 'usr_founder_29', 'AIUB', 'Khulna, Bangladesh', 'AI / Robotics', 'MVP', 1415000, 1132000, '15% Equity', 'Innovative Bangladeshi AI / Robotics startup solving key campus and enterprise challenges.', 'TerraHarvest is a student-led AI / Robotics startup founded at AIUB. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('visix_30', 'VisiX', 'usr_founder_30', 'MIST', 'Gazipur, Bangladesh', 'Biotech', 'Prototype', 1450000, 435000, '7% Rev. Share', 'Innovative Bangladeshi Biotech startup solving key campus and enterprise challenges.', 'VisiX is a student-led Biotech startup founded at MIST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('techspace_31', 'TechSpace', 'usr_founder_31', 'East West University', 'Dhaka, Bangladesh', 'FoodTech / SaaS', 'Pilot', 1485000, 594000, '6% Equity', 'Innovative Bangladeshi FoodTech / SaaS startup solving key campus and enterprise challenges.', 'TechSpace is a student-led FoodTech / SaaS startup founded at East West University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('greenhive_32', 'GreenHive', 'usr_founder_32', 'United International University', 'Chittagong, Bangladesh', 'AgriTech / IoT', 'Growth', 1520000, 760000, '9% Rev. Share', 'Innovative Bangladeshi AgriTech / IoT startup solving key campus and enterprise challenges.', 'GreenHive is a student-led AgriTech / IoT startup founded at United International University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('optilab_33', 'OptiLab', 'usr_founder_33', 'Independent University Bangladesh (IUB)', 'Sylhet, Bangladesh', 'EdTech', 'MVP', 1555000, 933000, '5% Equity', 'Innovative Bangladeshi EdTech startup solving key campus and enterprise challenges.', 'OptiLab is a student-led EdTech startup founded at Independent University Bangladesh (IUB). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('novastation_34', 'NovaStation', 'usr_founder_34', 'Ahsanullah University of Science & Technology (AUST)', 'Rajshahi, Bangladesh', 'CleanTech', 'Prototype', 1590000, 1113000, '8% Rev. Share', 'Innovative Bangladeshi CleanTech startup solving key campus and enterprise challenges.', 'NovaStation is a student-led CleanTech startup founded at Ahsanullah University of Science & Technology (AUST). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('apexworks_35', 'ApexWorks', 'usr_founder_35', 'Jahangirnagar University', 'Khulna, Bangladesh', 'FinTech', 'Pilot', 1625000, 1300000, '10% Equity', 'Innovative Bangladeshi FinTech startup solving key campus and enterprise challenges.', 'ApexWorks is a student-led FinTech startup founded at Jahangirnagar University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('metadrive_36', 'MetaDrive', 'usr_founder_36', 'Rajshahi University', 'Gazipur, Bangladesh', 'HealthTech', 'Growth', 1660000, 498000, '12% Rev. Share', 'Innovative Bangladeshi HealthTech startup solving key campus and enterprise challenges.', 'MetaDrive is a student-led HealthTech startup founded at Rajshahi University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('omniforce_37', 'OmniForce', 'usr_founder_37', 'Chittagong University', 'Dhaka, Bangladesh', 'Logistics / Supply Chain', 'MVP', 1695000, 678000, '15% Equity', 'Innovative Bangladeshi Logistics / Supply Chain startup solving key campus and enterprise challenges.', 'OmniForce is a student-led Logistics / Supply Chain startup founded at Chittagong University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('aurawave_38', 'AuraWave', 'usr_founder_38', 'Khulna University', 'Chittagong, Bangladesh', 'E-Commerce / Marketplace', 'Prototype', 1730000, 865000, '7% Rev. Share', 'Innovative Bangladeshi E-Commerce / Marketplace startup solving key campus and enterprise challenges.', 'AuraWave is a student-led E-Commerce / Marketplace startup founded at Khulna University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('voltbase_39', 'VoltBase', 'usr_founder_39', 'Daffodil International University', 'Sylhet, Bangladesh', 'AI / Robotics', 'Pilot', 1765000, 1059000, '6% Equity', 'Innovative Bangladeshi AI / Robotics startup solving key campus and enterprise challenges.', 'VoltBase is a student-led AI / Robotics startup founded at Daffodil International University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('zenspot_40', 'ZenSpot', 'usr_founder_40', 'BRAC University', 'Rajshahi, Bangladesh', 'Biotech', 'Growth', 1800000, 1260000, '9% Rev. Share', 'Innovative Bangladeshi Biotech startup solving key campus and enterprise challenges.', 'ZenSpot is a student-led Biotech startup founded at BRAC University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('codevault_41', 'CodeVault', 'usr_founder_41', 'BUET', 'Khulna, Bangladesh', 'FoodTech / SaaS', 'MVP', 1835000, 1468000, '5% Equity', 'Innovative Bangladeshi FoodTech / SaaS startup solving key campus and enterprise challenges.', 'CodeVault is a student-led FoodTech / SaaS startup founded at BUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('byteengine_42', 'ByteEngine', 'usr_founder_42', 'North South University', 'Gazipur, Bangladesh', 'AgriTech / IoT', 'Prototype', 1870000, 561000, '8% Rev. Share', 'Innovative Bangladeshi AgriTech / IoT startup solving key campus and enterprise challenges.', 'ByteEngine is a student-led AgriTech / IoT startup founded at North South University. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('flowsphere_43', 'FlowSphere', 'usr_founder_43', 'Dhaka University (IBA)', 'Dhaka, Bangladesh', 'EdTech', 'Pilot', 1905000, 762000, '10% Equity', 'Innovative Bangladeshi EdTech startup solving key campus and enterprise challenges.', 'FlowSphere is a student-led EdTech startup founded at Dhaka University (IBA). We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('gridtrack_44', 'GridTrack', 'usr_founder_44', 'SUST', 'Chittagong, Bangladesh', 'CleanTech', 'Growth', 1940000, 970000, '12% Rev. Share', 'Innovative Bangladeshi CleanTech startup solving key campus and enterprise challenges.', 'GridTrack is a student-led CleanTech startup founded at SUST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('khetkamar_45', 'KhetKamar', 'usr_founder_45', 'IUT Gazipur', 'Sylhet, Bangladesh', 'FinTech', 'MVP', 1975000, 1185000, '15% Equity', 'Innovative Bangladeshi FinTech startup solving key campus and enterprise challenges.', 'KhetKamar is a student-led FinTech startup founded at IUT Gazipur. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('amarshop_46', 'AmarShop', 'usr_founder_46', 'RUET', 'Rajshahi, Bangladesh', 'HealthTech', 'Prototype', 2010000, 1407000, '7% Rev. Share', 'Innovative Bangladeshi HealthTech startup solving key campus and enterprise challenges.', 'AmarShop is a student-led HealthTech startup founded at RUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('chalojaz_47', 'ChaloJaz', 'usr_founder_47', 'CUET', 'Khulna, Bangladesh', 'Logistics / Supply Chain', 'Pilot', 2045000, 1636000, '6% Equity', 'Innovative Bangladeshi Logistics / Supply Chain startup solving key campus and enterprise challenges.', 'ChaloJaz is a student-led Logistics / Supply Chain startup founded at CUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('daktarkoti_48', 'DaktarKoti', 'usr_founder_48', 'KUET', 'Gazipur, Bangladesh', 'E-Commerce / Marketplace', 'Growth', 2080000, 624000, '9% Rev. Share', 'Innovative Bangladeshi E-Commerce / Marketplace startup solving key campus and enterprise challenges.', 'DaktarKoti is a student-led E-Commerce / Marketplace startup founded at KUET. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('shebapoint_49', 'ShebaPoint', 'usr_founder_49', 'AIUB', 'Dhaka, Bangladesh', 'AI / Robotics', 'MVP', 2115000, 846000, '5% Equity', 'Innovative Bangladeshi AI / Robotics startup solving key campus and enterprise challenges.', 'ShebaPoint is a student-led AI / Robotics startup founded at AIUB. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"pending"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb),
  ('deshizone_50', 'DeshiZone', 'usr_founder_50', 'MIST', 'Chittagong, Bangladesh', 'Biotech', 'Prototype', 2150000, 1075000, '8% Rev. Share', 'Innovative Bangladeshi Biotech startup solving key campus and enterprise challenges.', 'DeshiZone is a student-led Biotech startup founded at MIST. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.', TRUE, 'verified', '[{"title":"Level 1 MVP Launch","target":"Month 1","status":"done"},{"title":"First 100 Active Users","target":"Month 3","status":"done"},{"title":"Commercial Expansion","target":"Month 6","status":"pending"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, goal = EXCLUDED.goal, raised = EXCLUDED.raised, equity_offer = EXCLUDED.equity_offer;

-- 5. Default Audit Hash Entry
INSERT INTO audit_logs (hash, category, title, status, latency)
VALUES ('0x8f2a99c4b1d09e1a', 'DISBURSEMENT', 'Escrow Tranche #1 Release', 'VERIFIED', '14ms')
ON CONFLICT DO NOTHING;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE;
INSERT INTO proposals (id, campaign_id, investor_id, amount, terms, return_structure, status)
VALUES ('test_prop_1', 'campusbites_1', 'usr_investor_1', 50000, '8% Rev Share', '8% Rev Share', 'accepted');

INSERT INTO payouts (id, founder_id, campaign_id, tranche, amount, method, account_number, status, hash)
VALUES ('test_payout_1', 'usr_founder_1', 'campusbites_1', 'MVP Launch Tranche', 20000, 'bKash', '01710000000', 'Pending Audit', '0xtest123');

-- ============================================================
-- AI Optimization Engine — new columns
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Investor-side signal, added to the existing `users` table.
-- Design note: I deliberately did NOT add a raw "net_worth" column.
-- A self-reported budget range gives the LLM the same matching signal
-- without your app claiming to hold verified financial data it has
-- no compliance infrastructure to actually protect or verify.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS investment_budget_min numeric,
  ADD COLUMN IF NOT EXISTS investment_budget_max numeric,
  ADD COLUMN IF NOT EXISTS sector_interests text[];  -- e.g. {'FinTech','AgriTech'}

-- Founder/startup-side signal, added to the existing `campaigns` table.
-- Design note: I did NOT add a separate "business_type" column — the
-- existing `category` column (already populated: 'FinTech', 'AgriTech', etc.)
-- already means the same thing. Two columns holding near-duplicate data
-- is a real schema smell; reusing `category` avoids it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

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
