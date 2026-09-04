import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.join(__dirname, '..');

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

export function generateFullSeedCatalog() {
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
      bio: 'Active venture partner backing university tech startups across Bangladesh with average ticket size ৳5L-৳25L.'
    });
  }

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
      mfsNumber: '01799999999',
      mfs_number: '01799999999'
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
      mfsNumber: '01788888888',
      mfs_number: '01788888888'
    }
  ];

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

  return { founders, investors, admins, campaigns };
}

export function ensureFullSeedFiles() {
  const seedPath = path.join(BACKEND_DIR, 'seed_generated.json');
  let current = null;
  try {
    if (fs.existsSync(seedPath)) {
      current = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
  } catch (e) {
    current = null;
  }

  const hasFullFounders = current && Array.isArray(current.founders) && current.founders.length >= 100;
  const hasFullInvestors = current && Array.isArray(current.investors) && current.investors.length >= 30;

  if (!hasFullFounders || !hasFullInvestors) {
    const catalog = generateFullSeedCatalog();
    fs.writeFileSync(seedPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`✅ [SeedCatalog] Regenerated seed_generated.json with ${catalog.founders.length} founders, ${catalog.investors.length} investors, and ${catalog.campaigns.length} campaigns.`);
    return catalog;
  }

  return current;
}

export async function syncCatalogToSupabase(supabase) {
  if (!supabase) return;
  try {
    const catalog = generateFullSeedCatalog();

    // Check count in Supabase
    const { count: founderCount, error: fErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'founder');

    const { count: investorCount, error: iErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'investor');

    if (fErr || iErr) {
      console.warn('Supabase check warning:', fErr?.message || iErr?.message);
      return;
    }

    if ((founderCount || 0) < 100 || (investorCount || 0) < 30) {
      console.log(`[SupabaseSync] Database has ${founderCount || 0} founders, ${investorCount || 0} investors. Syncing full dataset...`);
      
      const mapUserToDb = (u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        vetting_status: u.vetting_status || u.vettingStatus || 'verified',
        mfs_number: u.mfs_number || u.mfsNumber,
        university: u.university || null,
        student_id: u.student_id || u.studentId || null,
        department: u.department || null,
        institution: u.institution || null,
        bank_or_mfs: u.bank_or_mfs || null,
        bio: u.bio || null
      });

      const usersToSync = [
        ...catalog.admins.map(mapUserToDb),
        ...catalog.founders.map(mapUserToDb),
        ...catalog.investors.map(mapUserToDb)
      ];

      // Upsert in batches of 25
      const BATCH_SIZE = 25;
      for (let i = 0; i < usersToSync.length; i += BATCH_SIZE) {
        const batch = usersToSync.slice(i, i + BATCH_SIZE);
        const { error: upsertErr } = await supabase.from('users').upsert(batch, { onConflict: 'id' });
        if (upsertErr) {
          console.warn(`[SupabaseSync] Batch ${i} to ${i + batch.length} error:`, upsertErr.message);
        }
      }
      console.log('✅ [SupabaseSync] Finished syncing all 100 founders and 30 investors to Supabase.');
    }
  } catch (err) {
    console.warn('[SupabaseSync] Non-blocking sync error:', err.message);
  }
}
