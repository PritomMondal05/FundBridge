import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firstNames = [
  'Aarif', 'Amina', 'Arman', 'Ashraf', 'Asma', 'Atiq', 'Aziz', 'Bilal', 'Bushra', 'Fahim',
  'Farhana', 'Faruk', 'Habib', 'Hasan', 'Imran', 'Jasmine', 'Kamal', 'Khaled', 'Laila', 'Mahbub',
  'Mariam', 'Monir', 'Nabil', 'Nadia', 'Nasir', 'Nusrat', 'Omar', 'Parveen', 'Rafiq', 'Rahim',
  'Rashid', 'Roxana', 'Saad', 'Sabrina', 'Saeed', 'Salma', 'Sameer', 'Samira', 'Shahid', 'Shakir',
  'Sharmin', 'Sohail', 'Sumaiya', 'Syed', 'Tariq', 'Tasnim', 'Yousuf', 'Zahid', 'Zainab', 'Zubair'
];

const lastNames = [
  'Ahmed', 'Alam', 'Ali', 'Chowdhury', 'Hasan', 'Hossain', 'Islam', 'Khan', 'Mahmud', 'Mia',
  'Rahman', 'Sarker', 'Sultana', 'Uddin', 'Zaman', 'Begum', 'Bhuiyan', 'Haider', 'Kabir', 'Mustafa'
];

const universities = [
  'BRAC University', 'BUET', 'North South University', 'Dhaka University (IBA)', 'SUST',
  'IUT Gazipur', 'RUET', 'CUET', 'KUET', 'AIUB', 'MIST', 'East West University',
  'United International University', 'Independent University Bangladesh (IUB)',
  'Ahsanullah University of Science & Technology (AUST)', 'Jahangirnagar University',
  'Rajshahi University', 'Chittagong University', 'Khulna University', 'Daffodil International University'
];

const departments = [
  'Computer Science & Engineering', 'Electrical & Electronic Engineering', 'Business Administration',
  'Software Engineering', 'Mechanical Engineering', 'Biomedical Engineering', 'Civil Engineering',
  'Industrial & Production Engineering', 'Mechatronics & Robotics', 'Finance & Economics',
  'Marketing & E-Commerce', 'Data Science & Artificial Intelligence', 'Environmental Technology', 'Biotechnology'
];

const founderBios = [
  'Student founder building AI-driven web apps and digital automation for Bangladeshi university campuses.',
  'Hardware innovator researching solar IoT devices and precision agriculture tools for rural farmers.',
  'EdTech developer creating gamified skill assessment and corporate internship matching platforms.',
  'CleanTech researcher developing biodegradable jute packaging materials to replace e-commerce plastics.',
  'FinTech enthusiast designing micro-savings and MFS digital ledger tools for campus students.',
  'SaaS creator building canteen pre-ordering and digital token reservation software.',
  'HealthTech builder developing affordable tele-consultation kiosks for rural communities.',
  'LogisticTech founder building smart campus parcel lockers and intra-university delivery networks.'
];

// Generate 100 Founders
const founders = [];
for (let i = 1; i <= 100; i++) {
  const isAdib = i === 1;
  const fn = firstNames[(i * 3) % firstNames.length];
  const ln = lastNames[(i * 7) % lastNames.length];
  const name = isAdib ? 'Adib Nayem' : `${fn} ${ln}`;
  const email = isAdib ? 'adibnayem@gmail.com' : `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@univ.edu.bd`;
  const pass = isAdib ? '1234' : 'founderpassword';
  const univ = isAdib ? 'BUET' : universities[i % universities.length];
  const dept = isAdib ? 'Computer Science & Engineering' : departments[i % departments.length];
  const studentId = `${20100000 + i * 37}`;
  const mfs = `017${String(10000000 + i * 8371).substring(0, 8)}`;
  const bio = isAdib
    ? 'Founder of CampusBites researching automated food delivery logistics and student campus ecosystems.'
    : founderBios[i % founderBios.length];

  founders.push({
    _id: `usr_founder_${i}`,
    id: `usr_founder_${i}`,
    name,
    email,
    password: pass,
    role: 'founder',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    university: univ,
    studentId: studentId,
    student_id: studentId,
    department: dept,
    mfsNumber: mfs,
    mfs_number: mfs,
    bio
  });
}

const investorInstitutions = [
  'Vantage Capital LLC', 'Dhaka Angels Syndicate', 'Alumni Growth Fund BD', 'Silicon Padma Capital',
  'BRAC Alumni Angel Network', 'Techempires Ventures', 'BUET Alumni Seed Fund', 'Impact Capital Bangladesh',
  'Edge Venture Partners', 'SBK Tech Ventures', 'Startups BD Angels', 'Chaldal Syndicate',
  'Beximco Innovation Lab', 'Shasha Tech Capital', 'ShareTrip Alumni Syndicate', 'Bdjobs Founders Circle',
  'Visionary Angels BD', 'Inspira Advisory Capital', 'Constellation Asset Management', 'BetterStories Angel Fund'
];

const investorNames = [
  'Nazmus Sakib', 'Kazi Mahmud Hassan', 'Dr. Syeda Nigar Sultana', 'Farhan Ahmed Chowdhury',
  'Raheed Iftekhar', 'Rubaba Dowla', 'Taufiqur Rahman', 'Zareen Mahmud Hosein',
  'Asif Khan', 'Sonia Bashir Kabir', 'Mustafizur Rahman', 'Waseem Alim',
  'Miran Ali', 'Shams Mahmud', 'Sadia Haque', 'Fahim Mashroor',
  'Syeda Kamrun Nahar', 'Imran Fahad', 'Tanveer Ali', 'Minhaz Anwar',
  'Samad Miraly', 'Tajdin Hassan', 'Nirjhor Rahman', 'Tina Jabeen',
  'Adnan Imtiaz Halim', 'Mahmudul Hasan', 'Nazim Farhan Choudhury', 'Sajjad Hossain',
  'Ayman Sadiq', 'Habibullah N Karim'
];

// Generate 30 Investors
const investors = [];
for (let i = 1; i <= 30; i++) {
  const isNazmus = i === 1;
  const name = isNazmus ? 'Nazmus Sakib' : (investorNames[i - 1] || `Investor Partner ${i}`);
  const email = isNazmus ? 'nazmus@gmail.com' : `investor${i}@firm.com`;
  const pass = isNazmus ? '1234' : 'investorpassword';
  const inst = investorInstitutions[(i - 1) % investorInstitutions.length];
  const mfs = `018${String(20000000 + i * 9182).substring(0, 8)}`;

  investors.push({
    _id: `usr_investor_${i}`,
    id: `usr_investor_${i}`,
    name,
    email,
    password: pass,
    role: 'investor',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    institution: inst,
    bank_or_mfs: `City Bank - ACC# ${1000000000 + i * 4921}`,
    mfsNumber: mfs,
    mfs_number: mfs,
    bio: `Active venture partner backing university tech startups across Bangladesh with average ticket size ৳5L-৳25L.`
  });
}

// Generate 50 Campaigns
const categories = [
  'FoodTech / SaaS', 'AgriTech / IoT', 'EdTech', 'CleanTech', 'FinTech',
  'HealthTech', 'Logistics / Supply Chain', 'E-Commerce / Marketplace', 'AI / Robotics', 'Biotech'
];
const stages = ['MVP', 'Prototype', 'Pilot', 'Growth'];
const locations = ['Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Sylhet, Bangladesh', 'Rajshahi, Bangladesh', 'Khulna, Bangladesh', 'Gazipur, Bangladesh'];

const startupPrefixes = [
  'Campus', 'Agri', 'Skill', 'Eco', 'Fin', 'Health', 'Shuttl', 'Smart', 'Urban', 'Bio',
  'Bazaar', 'Micro', 'Robo', 'Solar', 'Pulse', 'Link', 'Net', 'Sync', 'Flex', 'Core',
  'Agro', 'Med', 'Edu', 'Pay', 'Logi', 'Fresh', 'Clean', 'Aqua', 'Terra', 'Visi',
  'Tech', 'Green', 'Opti', 'Nova', 'Apex', 'Meta', 'Omni', 'Aura', 'Volt', 'Zen',
  'Code', 'Byte', 'Flow', 'Grid', 'Khet', 'Amar', 'Chalo', 'Daktar', 'Sheba', 'Deshi'
];

const startupSuffixes = [
  'Bites', 'Sense BD', 'Craft Hub', 'Pack Dhaka', 'Flex', 'Connect', 'Express', 'Cart', 'Loop', 'Polymer',
  'Mart', 'Ledger', 'Bots', 'Grid', 'Care', 'Bridge', 'Flow', 'Nexus', 'Pass', 'Ops',
  'Yield', 'Kiosk', 'Tutor', 'Wallet', 'Locker', 'Market', 'Power', 'Monitor', 'Harvest', 'X',
  'Space', 'Hive', 'Lab', 'Station', 'Works', 'Drive', 'Force', 'Wave', 'Base', 'Spot',
  'Vault', 'Engine', 'Sphere', 'Track', 'Kamar', 'Shop', 'Jaz', 'Koti', 'Point', 'Zone'
];

const equityOffers = ['5% Equity', '8% Rev. Share', '10% Equity', '12% Rev. Share', '15% Equity', '7% Rev. Share', '6% Equity', '9% Rev. Share'];

const campaigns = [];
for (let i = 1; i <= 50; i++) {
  const pfx = startupPrefixes[(i - 1) % startupPrefixes.length];
  const sfx = startupSuffixes[(i - 1) % startupSuffixes.length];
  const title = `${pfx}${sfx}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '') + `_${i}`;
  const founder = founders[(i - 1) % founders.length];
  const category = categories[(i - 1) % categories.length];
  const stage = stages[(i - 1) % stages.length];
  const location = locations[(i - 1) % locations.length];
  const goal = 400000 + (i * 35000);
  const raised = Math.round(goal * (0.3 + (i % 6) * 0.1));
  const equity = equityOffers[(i - 1) % equityOffers.length];

  campaigns.push({
    id: slug,
    title,
    founder_id: founder.id,
    founderId: founder.id,
    founder: {
      name: founder.name,
      university: founder.university,
      department: founder.department,
      studentId: founder.student_id,
      mfsNumber: founder.mfs_number,
      bio: founder.bio
    },
    university: founder.university,
    location,
    category,
    stage,
    goal,
    raised,
    equityOffer: equity,
    equity_offer: equity,
    tagline: `Innovative Bangladeshi ${category} startup solving key campus and enterprise challenges.`,
    description: `${title} is a student-led ${category} startup founded at ${founder.university}. We leverage modern digital architectures to streamline logistics, digital finance, and operational workflows across Bangladesh.`,
    verified: true,
    status: 'verified',
    milestones: [
      { title: 'Level 1 MVP Launch', target: 'Month 1', status: 'done' },
      { title: 'First 100 Active Users', target: 'Month 3', status: i % 2 === 0 ? 'done' : 'pending' },
      { title: 'Commercial Expansion', target: 'Month 6', status: 'pending' }
    ]
  });
}

fs.writeFileSync(path.join(__dirname, 'seed_generated.json'), JSON.stringify({ founders, investors, campaigns }, null, 2));

// Generate Standalone Seed SQL File (seed_sql.sql)
let standaloneSeedSql = `-- ========================================================\n-- 30 INVESTORS, 100 STUDENT FOUNDERS & 50 CAMPAIGNS SEED DATA\n-- ========================================================\n\n`;

standaloneSeedSql += `-- Clean up any legacy conflicting emails before re-seeding\n`;
standaloneSeedSql += `DELETE FROM users WHERE email IN ('admin@fundbridge.com', 'investor@firm.com', 'anika@brac.edu.bd', 'tanvir@buet.ac.bd', 'nabila@northsouth.edu', 'samiul@du.ac.bd') AND id NOT LIKE 'usr_%';\n\n`;

standaloneSeedSql += `-- 1. STUDENT FOUNDERS (100 Verified Student Entrepreneurs)\n`;
standaloneSeedSql += `INSERT INTO users (id, name, email, password, role, vetting_status, university, student_id, department, mfs_number)\nVALUES\n`;
const founderValues = founders.map(f => 
  `  ('${f.id}', '${f.name.replace(/'/g, "''")}', '${f.email}', '${f.password}', 'founder', 'verified', '${f.university.replace(/'/g, "''")}', '${f.student_id}', '${f.department.replace(/'/g, "''")}', '${f.mfs_number}')`
);
standaloneSeedSql += founderValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, university = EXCLUDED.university, student_id = EXCLUDED.student_id, department = EXCLUDED.department, mfs_number = EXCLUDED.mfs_number;\n\n`;

standaloneSeedSql += `-- 2. INVESTORS (30 Verified Alumni & Angel Partners)\n`;
standaloneSeedSql += `INSERT INTO users (id, name, email, password, role, vetting_status, institution, bank_or_mfs, mfs_number)\nVALUES\n`;
const investorValues = investors.map(i => 
  `  ('${i.id}', '${i.name.replace(/'/g, "''")}', '${i.email}', '${i.password}', 'investor', 'verified', '${i.institution.replace(/'/g, "''")}', '${i.bank_or_mfs.replace(/'/g, "''")}', '${i.mfs_number}')`
);
standaloneSeedSql += investorValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, institution = EXCLUDED.institution, bank_or_mfs = EXCLUDED.bank_or_mfs, mfs_number = EXCLUDED.mfs_number;\n\n`;

standaloneSeedSql += `-- 3. 50 STARTUP CAMPAIGNS\n`;
standaloneSeedSql += `INSERT INTO campaigns (id, title, founder_id, university, location, category, stage, goal, raised, equity_offer, tagline, description, verified, status, milestones)\nVALUES\n`;
const campaignValues = campaigns.map(c => 
  `  ('${c.id}', '${c.title.replace(/'/g, "''")}', '${c.founder_id}', '${c.university.replace(/'/g, "''")}', '${c.location.replace(/'/g, "''")}', '${c.category.replace(/'/g, "''")}', '${c.stage}', ${c.goal}, ${c.raised}, '${c.equity_offer}', '${c.tagline.replace(/'/g, "''")}', '${c.description.replace(/'/g, "''")}', TRUE, 'verified', '${JSON.stringify(c.milestones)}'::jsonb)`
);
standaloneSeedSql += campaignValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, goal = EXCLUDED.goal, raised = EXCLUDED.raised, equity_offer = EXCLUDED.equity_offer;\n`;

const supabaseDir = path.join(__dirname, '..', 'supabase');
if (fs.existsSync(supabaseDir)) {
  fs.writeFileSync(path.join(supabaseDir, '02_seed_initial_data.sql'), standaloneSeedSql);
}

// Complete Schema Template
let fullSchema = `-- ========================================================
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
` + founderValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, university = EXCLUDED.university, student_id = EXCLUDED.student_id, department = EXCLUDED.department, mfs_number = EXCLUDED.mfs_number;\n\n`;

fullSchema += `-- 3. INVESTORS (30 Verified Alumni & Angel Partners)\n`;
fullSchema += `INSERT INTO users (id, name, email, password, role, vetting_status, institution, bank_or_mfs, mfs_number)\nVALUES\n` + investorValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, institution = EXCLUDED.institution, bank_or_mfs = EXCLUDED.bank_or_mfs, mfs_number = EXCLUDED.mfs_number;\n\n`;

fullSchema += `-- 4. 50 STARTUP CAMPAIGNS\n`;
fullSchema += `INSERT INTO campaigns (id, title, founder_id, university, location, category, stage, goal, raised, equity_offer, tagline, description, verified, status, milestones)\nVALUES\n` + campaignValues.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, goal = EXCLUDED.goal, raised = EXCLUDED.raised, equity_offer = EXCLUDED.equity_offer;\n\n`;

fullSchema += `-- 5. Default Audit Hash Entry
INSERT INTO audit_logs (hash, category, title, status, latency)
VALUES ('0x8f2a99c4b1d09e1a', 'DISBURSEMENT', 'Escrow Tranche #1 Release', 'VERIFIED', '14ms')
ON CONFLICT DO NOTHING;
`;

console.log('Successfully updated supabase/02_seed_initial_data.sql with UPSERT ON CONFLICT DO UPDATE!');
