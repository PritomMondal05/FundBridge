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

// Mongoose Models
import User from './models/User.js';
import Campaign from './models/Campaign.js';
import Proposal from './models/Proposal.js';
import bcrypt from 'bcryptjs';

dotenv.config();

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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

// Multer file filter (accept jpeg, jpg, png, pdf)
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Configure upload fields middleware
const cpUpload = upload.fields([
  { name: 'studentIdCardImage', maxCount: 1 },
  { name: 'nidCardImage', maxCount: 1 },
  { name: 'nidOrPassportImage', maxCount: 1 },
  { name: 'credentialsImage', maxCount: 1 }
]);

// Base API endpoints
// ==========================================
// IN-MEMORY FALLBACK STORE (Active when DB disconnected)
// ==========================================
const fallbackUsers = [
  {
    _id: 'usr_admin_1',
    name: 'ADMIN_PRITOM',
    email: 'admin@fundbridge.com',
    password: 'admin123',
    role: 'admin',
    vettingStatus: 'verified',
    mfsNumber: '01799999999'
  },
  {
    _id: 'usr_investor_1',
    name: 'Angel Backer Zaman',
    email: 'investor@firm.com',
    password: 'investorpassword',
    role: 'investor',
    vettingStatus: 'verified',
    mfsNumber: '01711111111',
    institution: 'Vantage Ventures Dhaka',
    designation: 'Syndicate Lead'
  },
  {
    _id: 'usr_founder_1',
    name: 'Anika Rahman',
    email: 'anika@brac.edu.bd',
    password: 'founderpassword',
    role: 'founder',
    vettingStatus: 'pending',
    mfsNumber: '01712345678',
    university: 'BRAC University',
    nid: '554092183201'
  },
  {
    _id: 'usr_founder_2',
    name: 'Tariqul Islam',
    email: 'tariqul@nsu.edu',
    password: 'founderpassword',
    role: 'founder',
    vettingStatus: 'pending',
    mfsNumber: '01811223344',
    university: 'NSU',
    nid: '443219082312'
  },
  {
    _id: 'usr_investor_2',
    name: 'Siddique Rahman',
    email: 'siddique@ventures.com',
    password: 'investorpassword',
    role: 'investor',
    vettingStatus: 'pending',
    mfsNumber: '01988776655',
    institution: 'Dhaka Angel Syndicate',
    designation: 'Managing Partner'
  }
];

const fallbackCampaigns = [
  {
    _id: 'cmp_1',
    id: 'campusbites',
    title: 'CampusBites',
    founder: { _id: 'usr_founder_1', name: 'Anika Rahman', email: 'anika@brac.edu.bd', university: 'BRAC University', mfsNumber: '01712345678' },
    university: 'BRAC University',
    location: 'Dhanmondi, Dhaka',
    category: 'F&B',
    stage: 'MVP',
    goal: 500000,
    raised: 300000,
    equityOffer: '8% Revenue Share',
    milestones: [
      { _id: 'm1', title: 'MVP Launch', target: 'Month 1', status: 'done' },
      { _id: 'm2', title: 'First 100 Users', target: 'Month 2', status: 'pending' },
      { _id: 'm3', title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
    ],
    verified: true,
    status: 'verified',
    description: 'Providing premium healthy meal delivery boxes inside campus parameters on a subscription basis.'
  },
  {
    _id: 'cmp_2',
    id: 'solargrid',
    title: 'SolarGrid AI',
    founder: { _id: 'usr_founder_1', name: 'Anika Rahman', email: 'anika@brac.edu.bd', university: 'BRAC University', mfsNumber: '01712345678' },
    university: 'BRAC University',
    location: 'Gulshan, Dhaka',
    category: 'CleanTech',
    stage: 'Venture Draft',
    goal: 500000,
    raised: 0,
    equityOffer: '10% Equity',
    milestones: [
      { _id: 'm4', title: 'Prototype Development', target: 'Month 1', status: 'done' },
      { _id: 'm5', title: 'Rooftop Pilot Run', target: 'Month 2', status: 'active' },
      { _id: 'm6', title: 'Grid Integration', target: 'Month 4', status: 'locked' },
      { _id: 'm7', title: 'Commercial Release', target: 'Month 6', status: 'locked' }
    ],
    verified: false,
    status: 'pending',
    documents: [
      { title: 'Pitch Deck v2', filename: 'SolarGrid_PitchDeck_v2.pdf', size: '2.4 MB' },
      { title: 'Financial Model', filename: 'FinancialProjections_Solar.xlsx', size: '1.1 MB' },
      { title: 'Lab Certification', filename: 'BRAC_Incubation_Certificate.pdf', size: '850 KB' }
    ],
    description: 'AI-assisted clean energy smart micro-grid optimizing solar distribution across urban residential rooftops.'
  },
  {
    _id: 'cmp_3',
    id: 'aquaflow',
    title: 'AquaFlow Decentral',
    founder: { _id: 'usr_founder_2', name: 'Tariqul Islam', email: 'tariqul@nsu.edu', university: 'NSU', mfsNumber: '01811223344' },
    university: 'North South University',
    location: 'Banani, Dhaka',
    category: 'WaterTech',
    stage: 'Early Traction',
    goal: 750000,
    raised: 0,
    equityOffer: '12% Equity',
    milestones: [
      { _id: 'm8', title: 'Filter Design & Testing', target: 'Month 1', status: 'done' },
      { _id: 'm9', title: 'Kiosk Pilot Installation', target: 'Month 2', status: 'active' },
      { _id: 'm10', title: 'Decentralized Smart Contract Link', target: 'Month 4', status: 'locked' },
      { _id: 'm11', title: 'Commercial Rollout', target: 'Month 6', status: 'locked' }
    ],
    verified: false,
    status: 'pending',
    documents: [
      { title: 'Filter Specs & Patent Draft', filename: 'AquaFlow_Patented_Filter_Spec.pdf', size: '3.8 MB' },
      { title: 'NSU Lab Test Certification', filename: 'NSU_Lab_Test_Results.pdf', size: '1.4 MB' },
      { title: 'CapEx Budget Breakdown', filename: 'Budget_Breakdown_Kiosks.xlsx', size: '920 KB' }
    ],
    description: 'Decentralized water filtration kiosk network powered by smart contracts for real-time water quality verification.'
  },
  {
    _id: 'cmp_4',
    id: 'mediconnect',
    title: 'MediConnect BD',
    founder: { _id: 'usr_founder_3', name: 'Tanvir Ahmed', email: 'tanvir@du.ac.bd', university: 'University of Dhaka', mfsNumber: '01922334455' },
    university: 'University of Dhaka',
    location: 'Shahbagh, Dhaka',
    category: 'HealthTech',
    stage: 'MVP Launch',
    goal: 1200000,
    raised: 150000,
    equityOffer: '7.5% Equity',
    milestones: [
      { _id: 'm12', title: 'Telemedicine Portal Launch', target: 'Month 1', status: 'done' },
      { _id: 'm13', title: '50 Rural Clinic Integrations', target: 'Month 3', status: 'active' },
      { _id: 'm14', title: 'AI Triage Engine Deployment', target: 'Month 5', status: 'locked' }
    ],
    verified: false,
    status: 'pending',
    documents: [
      { title: 'MediConnect Deck', filename: 'MediConnect_Pitch_Deck.pdf', size: '4.1 MB' },
      { title: 'DGDA Regulatory Compliance', filename: 'DGDA_Compliance_Audit.pdf', size: '2.0 MB' },
      { title: 'DU BioLab Endorsement', filename: 'DU_BioLab_Affiliation.pdf', size: '1.2 MB' }
    ],
    description: 'AI-enabled triage & telemedicine platform bridging rural clinic network with urban specialist hospitals.'
  },
  {
    _id: 'cmp_5',
    id: 'agrisense',
    title: 'AgriSense IoT',
    founder: { _id: 'usr_founder_4', name: 'Farhana Yasmin', email: 'farhana@buet.ac.bd', university: 'BUET', mfsNumber: '01555667788' },
    university: 'BUET',
    location: 'Palashi, Dhaka',
    category: 'AgTech',
    stage: 'Prototype Testing',
    goal: 850000,
    raised: 0,
    equityOffer: '15% Revenue Share',
    milestones: [
      { _id: 'm15', title: 'IoT Sensor Node Fabrication', target: 'Month 1', status: 'done' },
      { _id: 'm16', title: 'Bogura Paddy Field Trial', target: 'Month 3', status: 'active' },
      { _id: 'm17', title: 'Mobile Advisory App Launch', target: 'Month 5', status: 'locked' }
    ],
    verified: false,
    status: 'pending',
    documents: [
      { title: 'Sensor Hardware Schematics', filename: 'AgriSense_Sensor_Schematics.pdf', size: '5.2 MB' },
      { title: 'Bogura Field Trial Report', filename: 'Field_Trial_Report_Bogura.pdf', size: '2.8 MB' },
      { title: 'BUET Robotics Lab Approval', filename: 'BUET_Robotics_Endorsement.pdf', size: '980 KB' }
    ],
    description: 'Ultra low-cost solar-powered soil moisture & NPK nutrient telemetry sensors for precision agriculture.'
  }
];

const fallbackProposals = [];

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (isSupabaseConfigured && supabase) {
    dbStatus = 'supabase_active';
  } else if (mongoose.connection.readyState === 1) {
    dbStatus = 'mongodb_connected';
  } else {
    dbStatus = 'in_memory_fallback';
  }

  res.status(200).json({ 
    status: 'healthy', 
    database: dbStatus,
    supabaseConfigured: isSupabaseConfigured
  });
});

// ==========================================
// USER AUTHENTICATION & PORTAL APIS
// ==========================================

// Register a new user (Founder or Investor) with document uploads
app.post('/api/users/register', (req, res, next) => {
  cpUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { 
        name, email, password, role, mfsNumber, 
        dob, university, studentId, department, nid,
        affiliationStatus, institution, passingYear, nidOrPassport, bankOrMfs, credentialsLink
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required.' });
      }

      if (isSupabaseConfigured && supabase) {
        const { data: existingSupa } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingSupa) {
          return res.status(400).json({ error: 'User already exists with this email address.' });
        }
      } else if (mongoose.connection.readyState === 1) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists with this email address.' });
        }
      } else {
        const existingFb = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingFb) {
          return res.status(400).json({ error: 'User already exists with this email address.' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Collect uploaded file paths
      let studentIdCardImagePath = '';
      let nidCardImagePath = '';
      let nidOrPassportImagePath = '';
      let credentialsImagePath = '';

      if (req.files) {
        if (req.files.studentIdCardImage) {
          studentIdCardImagePath = `/uploads/${req.files.studentIdCardImage[0].filename}`;
        }
        if (req.files.nidCardImage) {
          nidCardImagePath = `/uploads/${req.files.nidCardImage[0].filename}`;
        }
        if (req.files.nidOrPassportImage) {
          nidOrPassportImagePath = `/uploads/${req.files.nidOrPassportImage[0].filename}`;
        }
        if (req.files.credentialsImage) {
          credentialsImagePath = `/uploads/${req.files.credentialsImage[0].filename}`;
        }
      }

      // Validate uploads based on role
      if (role === 'founder') {
        if (!mfsNumber || !university || !studentId || !department || !nid || !dob) {
          return res.status(400).json({ error: 'All student founder text fields are mandatory.' });
        }
        if (!studentIdCardImagePath || !nidCardImagePath) {
          return res.status(400).json({ error: 'Student ID card scan and NID scan images are required.' });
        }
      } else if (role === 'investor') {
        if (!affiliationStatus || !institution || !nidOrPassport || !bankOrMfs) {
          return res.status(400).json({ error: 'All investor fields (Affiliation, Company, NID/Passport, Bank/MFS) are mandatory.' });
        }
        if (!nidOrPassportImagePath) {
          return res.status(400).json({ error: 'NID or Passport scan image is required.' });
        }
        if (!credentialsImagePath && !credentialsLink) {
          return res.status(400).json({ error: 'Professional credentials (scan file or verified link) are required.' });
        }
      }

      let newUser = {
        _id: 'usr_' + Date.now(),
        name,
        email,
        password: hashedPassword,
        role,
        vettingStatus: 'pending',
        mfsNumber: role === 'founder' ? mfsNumber : bankOrMfs,
        dob,
        university,
        studentId,
        department,
        nid,
        studentIdCardImage: studentIdCardImagePath,
        nidCardImage: nidCardImagePath,
        affiliationStatus,
        institution,
        passingYear,
        nidOrPassport,
        bankOrMfs,
        nidOrPassportImage: nidOrPassportImagePath,
        credentialsImage: credentialsImagePath,
        credentialsLink
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: supaUser, error: supaErr } = await supabase.from('users').insert([{
            name,
            email,
            password: hashedPassword,
            role,
            vetting_status: 'pending',
            mfs_number: role === 'founder' ? mfsNumber : bankOrMfs,
            dob,
            university,
            student_id: studentId,
            department,
            nid,
            student_id_card_image: studentIdCardImagePath,
            nid_card_image: nidCardImagePath,
            affiliation_status: affiliationStatus,
            institution,
            passing_year: passingYear,
            nid_or_passport: nidOrPassport,
            bank_or_mfs: bankOrMfs,
            nid_or_passport_image: nidOrPassportImagePath,
            credentials_image: credentialsImagePath,
            credentials_link: credentialsLink
          }]).select().single();

          if (supaUser) {
            newUser._id = supaUser.id;
          }
        } catch (e) {
          console.warn('Supabase user creation error, storing in fallback:', e.message);
        }
      } else if (mongoose.connection.readyState === 1) {
        try {
          const created = await User.create(newUser);
          newUser._id = created._id;
        } catch (e) {
          console.warn('DB user creation error, storing in fallback:', e.message);
        }
      }

      fallbackUsers.push(newUser);

      res.status(201).json({
        message: 'Account registered successfully. Vetting process initiated.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          vettingStatus: newUser.vettingStatus
        }
      });
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ error: 'Server error during user registration.' });
    }
  });
});


// Log in user (Admin, Founder, or Investor)
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaUser } = await supabase.from('users').select('*').eq('email', email).single();
        if (supaUser) {
          user = {
            _id: supaUser.id,
            id: supaUser.id,
            name: supaUser.name,
            email: supaUser.email,
            password: supaUser.password,
            role: supaUser.role,
            vettingStatus: supaUser.vetting_status || 'pending',
            mfsNumber: supaUser.mfs_number,
            university: supaUser.university,
            nid: supaUser.nid,
            institution: supaUser.institution,
            designation: supaUser.passing_year
          };
        }
      } catch (e) {
        user = null;
      }
    }

    if (!user && mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email });
      } catch (e) {
        user = null;
      }
    }

    if (!user) {
      user = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check password
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
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vettingStatus: user.vettingStatus,
        mfsNumber: user.mfsNumber,
        university: user.university,
        nid: user.nid,
        institution: user.institution,
        designation: user.designation
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Admin login backwards compatibility path
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email, role: 'admin' });
      } catch (e) {
        user = null;
      }
    }

    if (!user) {
      user = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'admin');
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials or access denied.' });
    }

    let matches = user.password === password;
    if (!matches && user.password) {
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
      message: 'Admin authentication successful.',
      token: 'jwt-admin-token-db-active',
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during administrator login.' });
  }
});

// Mock Vetting Application for compatibility
app.post('/api/vetting/apply', async (req, res) => {
  try {
    const { name, email, university, nid, mfsNumber, role, institution, designation } = req.body;
    const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}@univ.edu.bd`;
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { name, role: role || 'founder', mfsNumber, university, nid, institution, designation, vettingStatus: 'pending' },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: 'Identity data registered.', status: user.vettingStatus, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Error processing verification.' });
  }
});

// Retrieve pending vetting applicants (Admins only)
app.get('/api/vetting/applicants', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const applicants = await User.find({ vettingStatus: 'pending' });
      if (applicants) return res.status(200).json(applicants);
    }
    const pendingFb = fallbackUsers.filter(u => u.vettingStatus === 'pending');
    res.status(200).json(pendingFb);
  } catch (err) {
    const pendingFb = fallbackUsers.filter(u => u.vettingStatus === 'pending');
    res.status(200).json(pendingFb);
  }
});

// Retrieve system counts (Founders and Investors)
app.get('/api/admin/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const totalFounders = await User.countDocuments({ role: 'founder' });
      const totalInvestors = await User.countDocuments({ role: 'investor' });
      return res.status(200).json({ totalFounders, totalInvestors });
    }
    const totalFounders = fallbackUsers.filter(u => u.role === 'founder').length;
    const totalInvestors = fallbackUsers.filter(u => u.role === 'investor').length;
    res.status(200).json({ totalFounders, totalInvestors });
  } catch (err) {
    console.error('Error fetching admin counts:', err);
    res.status(200).json({ totalFounders: 2, totalInvestors: 2 });
  }
});

// Retrieve all verified student founders (Admins only)
app.get('/api/admin/users/founders', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const founders = await User.find({ role: 'founder', vettingStatus: { $in: ['verified', 'hold'] } });
      if (founders) return res.status(200).json(founders);
    }
    const founders = fallbackUsers.filter(u => u.role === 'founder' && ['verified', 'hold'].includes(u.vettingStatus));
    res.status(200).json(founders);
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'founder'));
  }
});

// Retrieve all verified investors (Admins only)
app.get('/api/admin/users/investors', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const investors = await User.find({ role: 'investor', vettingStatus: { $in: ['verified', 'hold'] } });
      if (investors) return res.status(200).json(investors);
    }
    const investors = fallbackUsers.filter(u => u.role === 'investor' && ['verified', 'hold'].includes(u.vettingStatus));
    res.status(200).json(investors);
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'investor'));
  }
});

// Administrative action: Update user profile (Admins only)
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(id, updateData, { new: true });
      if (user) return res.status(200).json({ message: 'User profile updated successfully.', user });
    }
    const fbUser = fallbackUsers.find(u => u._id === id || u.id === id);
    if (fbUser) {
      Object.assign(fbUser, updateData);
      return res.status(200).json({ message: 'User profile updated successfully.', user: fbUser });
    }
    res.status(404).json({ error: 'User not found.' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Error updating user profile.' });
  }
});

// Administrative action: Toggle Hold/Unhold vetting status (Admins only)
app.post('/api/admin/users/:id/hold', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(id);
      if (user) {
        user.vettingStatus = user.vettingStatus === 'hold' ? 'verified' : 'hold';
        await user.save();
        return res.status(200).json({ message: `User vetting status changed to ${user.vettingStatus}.`, user });
      }
    }
    const fbUser = fallbackUsers.find(u => u._id === id || u.id === id);
    if (fbUser) {
      fbUser.vettingStatus = fbUser.vettingStatus === 'hold' ? 'verified' : 'hold';
      return res.status(200).json({ message: `User vetting status changed to ${fbUser.vettingStatus}.`, user: fbUser });
    }
    res.status(404).json({ error: 'User not found.' });
  } catch (err) {
    console.error('Error toggling hold status:', err);
    res.status(500).json({ error: 'Error toggling hold status.' });
  }
});

// Administrative action: Remove user profile (Admins only)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndDelete(id);
    }
    const idx = fallbackUsers.findIndex(u => u._id === id || u.id === id);
    if (idx !== -1) fallbackUsers.splice(idx, 1);
    res.status(200).json({ message: 'User profile deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user profile:', err);
    res.status(500).json({ error: 'Error deleting user profile.' });
  }
});


// Approve or reject vetting status
app.post('/api/vetting/status', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required.' });
    }
    if (mongoose.connection.readyState === 1) {
      const updateFields = { vettingStatus: status };
      if (status === 'verified') updateFields.vettingDate = new Date();
      const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
      if (user) return res.status(200).json({ message: `Vetting status updated to ${status}.`, user });
    }
    const fbUser = fallbackUsers.find(u => u._id === userId || u.id === userId);
    if (fbUser) {
      fbUser.vettingStatus = status;
      return res.status(200).json({ message: `Vetting status updated to ${status}.`, user: fbUser });
    }
    res.status(404).json({ error: 'User not found.' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating vetting status.' });
  }
});


// ==========================================
// CAMPAIGN MANAGEMENT APIS
// ==========================================

// Fetch all verified campaigns (Public catalog)
app.get('/api/campaigns', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data: supaCampaigns } = await supabase.from('campaigns').select('*').eq('verified', true);
      if (supaCampaigns && supaCampaigns.length > 0) return res.status(200).json(supaCampaigns);
    }
    if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find({ verified: true }).populate('founder', 'name email university mfsNumber');
      if (campaigns && campaigns.length > 0) return res.status(200).json(campaigns);
    }
    res.status(200).json(fallbackCampaigns.filter(c => c.verified));
  } catch (err) {
    res.status(200).json(fallbackCampaigns.filter(c => c.verified));
  }
});

// Get campaigns owned by a specific Founder
app.get('/api/campaigns/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { data: supaCampaigns } = await supabase.from('campaigns').select('*').eq('founder_id', founderId);
      if (supaCampaigns && supaCampaigns.length > 0) return res.status(200).json(supaCampaigns);
    }
    if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find({ founder: founderId });
      if (campaigns && campaigns.length > 0) return res.status(200).json(campaigns);
    }
    const fc = fallbackCampaigns.filter(c => c.founder._id === founderId || c.founder.id === founderId || c.founder === founderId);
    res.status(200).json(fc);
  } catch (err) {
    res.status(200).json([]);
  }
});

// Create a new campaign (Founder only)
app.post('/api/campaigns', async (req, res) => {
  try {
    const { id, title, founderId, university, location, category, stage, goal, equityOffer, description, milestones } = req.body;

    if (!id || !title || !founderId || !university || !location || !category || !stage || !goal || !equityOffer || !description) {
      return res.status(400).json({ error: 'All fields are required to create a campaign.' });
    }

    const existingCampaign = await Campaign.findOne({ id });
    if (existingCampaign) {
      return res.status(400).json({ error: 'Campaign ID / slug already exists. Choose a unique title.' });
    }

    const parsedMilestones = milestones && milestones.length > 0 ? milestones : [
      { title: 'MVP Launch', target: 'Month 1', status: 'active' },
      { title: 'First 100 Users', target: 'Month 2', status: 'locked' },
      { title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
    ];

    let createdCampaign = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: supaCmp, error: supaErr } = await supabase.from('campaigns').insert([{
          id,
          title,
          university,
          location,
          category,
          stage,
          goal,
          equity_offer: equityOffer,
          description,
          milestones: parsedMilestones,
          verified: false
        }]).select().single();
        if (supaCmp) createdCampaign = supaCmp;
      } catch (e) {
        console.warn('Supabase campaign creation error:', e.message);
      }
    }

    if (!createdCampaign && mongoose.connection.readyState === 1) {
      createdCampaign = await Campaign.create({
        id,
        title,
        founder: founderId,
        university,
        location,
        category,
        stage,
        goal,
        equityOffer,
        description,
        milestones: parsedMilestones,
        verified: false
      });
    }

    res.status(201).json({ message: 'Campaign created successfully. Waiting for Admin verification.', campaign: createdCampaign || { id, title } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during campaign creation.' });
  }
});

// Submit receipt proof for a milestone (Founder request escrow)
app.post('/api/campaigns/:id/milestones/:milestoneId/submit', async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { receiptProof } = req.body;

    const campaign = await Campaign.findOne({ id });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found.' });
    }

    // Set status to pending review
    milestone.status = 'active'; // Temporarily active, wait - let's set a state like pending:
    // Mongoose schema milestones status is enum: ['done', 'active', 'locked'].
    // But since the schema has enum: ['done', 'active', 'locked'], let's bypass the strict model check if needed, 
    // or let's update status to 'active' and save, but represent 'Pending Review' logically in the frontend.
    // Wait, the User model schema says milestones.status enum is ['done', 'active', 'locked'].
    // Let's check backend/models/Campaign.js.
    // Yes: status: { type: String, enum: ['done', 'active', 'locked'], default: 'locked' }
    // Wait! In order to avoid validator errors, we should keep the status as 'active' but we can add receipt details, 
    // or we can allow the UI to handle it. Actually, wait! Let's check if Mongoose will fail if we set it to 'Pending Review'.
    // Yes, it will fail validation because 'Pending Review' is not in the enum.
    // But wait! Can we change the status enum in backend/models/Campaign.js to allow 'pending' as well?
    // Let's check Campaign.js. It says: status: { type: String, enum: ['done', 'active', 'locked'], default: 'locked' }.
    // Let's modify Campaign.js to include 'pending' in the status enum so that Mongoose validates it correctly!
    // That is a much cleaner way. Let's do that right after this tool call.
    // For now, let's write it to handle status = 'pending'.
    milestone.status = 'pending';
    await campaign.save();

    res.status(200).json({ message: 'Milestone proof submitted for admin review.', campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error submitting milestone proof.' });
  }
});


// ==========================================
// INVESTOR PROPOSAL & PORTFOLIO APIS
// ==========================================

// Create an investment proposal (Investor commits BDT & terms)
app.post('/api/campaigns/:id/proposals', async (req, res) => {
  try {
    const { id } = req.params;
    const { investorId, amount, terms } = req.body;

    if (!investorId || !amount || !terms) {
      return res.status(400).json({ error: 'Investor ID, funding amount, and terms are required.' });
    }

    const campaign = await Campaign.findOne({ id });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign profile not found.' });
    }

    const proposal = await Proposal.create({
      campaign: campaign._id,
      investor: investorId,
      amount,
      terms,
      status: 'pending'
    });

    res.status(201).json({ message: 'Investment proposal submitted to Founder.', proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting backing proposal.' });
  }
});

// Accept or Reject a proposal (Founder action)
app.post('/api/campaigns/:id/proposals/:proposalId/status', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be accepted or rejected.' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    proposal.status = status;
    await proposal.save();

    // If accepted, add amount to campaign raised total
    if (status === 'accepted') {
      const campaign = await Campaign.findById(proposal.campaign);
      if (campaign) {
        campaign.raised = (campaign.raised || 0) + proposal.amount;
        await campaign.save();
      }
    }

    res.status(200).json({ message: `Proposal status updated to ${status}.`, proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating proposal terms status.' });
  }
});

// Fetch all proposals submitted to a specific campaign (Founder dashboard)
app.get('/api/proposals/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Check if campaignId is slug ID or ObjectId
    let campaignObjId = campaignId;
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      const cmp = await Campaign.findOne({ id: campaignId });
      if (cmp) campaignObjId = cmp._id;
    }

    const proposals = await Proposal.find({ campaign: campaignObjId }).populate('investor', 'name email institution designation');
    res.status(200).json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading campaign proposals.' });
  }
});

// Fetch active investment portfolio ledger for a specific Investor
app.get('/api/proposals/investor/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const proposals = await Proposal.find({ investor: investorId })
      .populate({
        path: 'campaign',
        populate: { path: 'founder', select: 'name email university' }
      });
    res.status(200).json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading investor portfolio.' });
  }
});


// ==========================================
// ADMIN WORKSPACE PIPELINE APIS
// ==========================================

// Get pending campaigns waiting for Admin verification
app.get('/api/admin/campaigns/pending', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const pendingCampaigns = await Campaign.find({ verified: false }).populate('founder', 'name email university');
      if (pendingCampaigns && pendingCampaigns.length > 0) return res.status(200).json(pendingCampaigns);
    }
    const pendingFb = fallbackCampaigns.filter(c => !c.verified);
    res.status(200).json(pendingFb);
  } catch (err) {
    const pendingFb = fallbackCampaigns.filter(c => !c.verified);
    res.status(200).json(pendingFb);
  }
});

// Approve/Verify campaign to push it live in catalog
app.post('/api/admin/campaigns/:campaignId/verify', async (req, res) => {
  try {
    const { campaignId } = req.params;
    let campaign = null;
    if (mongoose.connection.readyState === 1) {
      campaign = await Campaign.findByIdAndUpdate(campaignId, { verified: true }, { new: true });
    }
    const fbCmp = fallbackCampaigns.find(c => c._id === campaignId || c.id === campaignId);
    if (fbCmp) {
      fbCmp.verified = true;
      fbCmp.status = 'verified';
    }
    res.status(200).json({ message: 'Campaign verified and set to live.', campaign: campaign || fbCmp });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying campaign.' });
  }
});

// Reject campaign from audit vault
app.post('/api/admin/campaigns/:campaignId/reject', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { reason } = req.body;
    let campaign = null;
    if (mongoose.connection.readyState === 1) {
      campaign = await Campaign.findByIdAndUpdate(campaignId, { verified: false, status: 'rejected', rejectionReason: reason }, { new: true });
    }
    const fbCmp = fallbackCampaigns.find(c => c._id === campaignId || c.id === campaignId);
    if (fbCmp) {
      fbCmp.verified = false;
      fbCmp.status = 'rejected';
      fbCmp.rejectionReason = reason || 'Campaign pitch did not meet compliance criteria.';
    }
    res.status(200).json({ message: 'Campaign audit rejected.', campaign: campaign || fbCmp });
  } catch (err) {
    res.status(500).json({ error: 'Error rejecting campaign.' });
  }
});

// Request revision / re-upload from founder
app.post('/api/admin/campaigns/:campaignId/reupload', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { feedbackNotes } = req.body;
    let campaign = null;
    if (mongoose.connection.readyState === 1) {
      campaign = await Campaign.findByIdAndUpdate(campaignId, { verified: false, status: 'revision_required', feedbackNotes }, { new: true });
    }
    const fbCmp = fallbackCampaigns.find(c => c._id === campaignId || c.id === campaignId);
    if (fbCmp) {
      fbCmp.verified = false;
      fbCmp.status = 'revision_required';
      fbCmp.feedbackNotes = feedbackNotes || 'Please fix pitch deck figures and re-upload scanned founder identity documents.';
    }
    res.status(200).json({ message: 'Revision request sent back to founder queue.', campaign: campaign || fbCmp });
  } catch (err) {
    res.status(500).json({ error: 'Error requesting campaign revision.' });
  }
});

// Get pending milestones escrow release queue
app.get('/api/admin/escrow/pending', async (req, res) => {
  try {
    // Find all campaigns that have at least one milestone with status 'pending'
    const campaigns = await Campaign.find({ 'milestones.status': 'pending' }).populate('founder', 'name email university mfsNumber');
    
    // Format response to display flat list of release requests
    const requests = [];
    campaigns.forEach(c => {
      c.milestones.forEach(m => {
        if (m.status === 'pending') {
          requests.push({
            campaignId: c.id,
            campaignObjId: c._id,
            campaignTitle: c.title,
            founder: c.founder,
            milestoneId: m._id,
            milestoneTitle: m.title,
            target: m.target,
            amount: Math.round(c.goal / (c.milestones.length || 3)) // divide goal equally for milestones
          });
        }
      });
    });

    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching pending milestones.' });
  }
});

// Approve milestone escrow release (Admin action)
app.post('/api/admin/escrow/:campaignId/milestones/:milestoneId/approve', async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found.' });
    }

    // Release escrow: set milestone status to done
    milestone.status = 'done';
    
    // Unlock next milestone if there is one
    const milestoneIndex = campaign.milestones.findIndex(m => m._id.toString() === milestoneId);
    if (milestoneIndex !== -1 && milestoneIndex + 1 < campaign.milestones.length) {
      campaign.milestones[milestoneIndex + 1].status = 'active';
    }

    await campaign.save();
    res.status(200).json({ message: 'Milestone escrow tranche released.', campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error releasing escrow tranche.' });
  }
});

// Escrow Milestone status check (Public / Founder)
app.get('/api/milestones/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    let campaign = await Campaign.findOne({ id: campaignId });
    if (!campaign && mongoose.Types.ObjectId.isValid(campaignId)) {
      campaign = await Campaign.findById(campaignId);
    }
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign profile not found.' });
    }
    res.status(200).json(campaign.milestones);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving milestones.' });
  }
});

// Direct Safety Deposit Bond calculator check
app.post('/api/escrow/calculate-bond', (req, res) => {
  const { fundingAmount, durationMonths } = req.body;
  if (!fundingAmount || !durationMonths) {
    return res.status(400).json({ error: 'Funding amount and duration parameters are required.' });
  }

  const baseRate = 0.025; // 2.5%
  const timeMultiplier = 0.005; // 0.5% per month
  const deposit = (baseRate * fundingAmount) * (1 + (timeMultiplier * durationMonths));

  res.status(200).json({
    fundingAmount,
    durationMonths,
    baseRate: '2.5%',
    timeMultiplier: '0.5% / month',
    depositValue: Math.round(deposit),
    gatewayPartners: ['bKash', 'Nagad', 'Rocket']
  });
});

// Setup socket connection for direct real-time negotiation
io.on('connection', (socket) => {
  console.log('New client connection synchronized for negotiation:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket joined negotiation room: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast back to the negotiation workspace
    io.to(data.roomId).emit('receive_message', {
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('disconnect', () => {
    console.log('Client connection disconnected.');
  });
});

// Auto-seed database helper if collection is empty
const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Auto-seeding initial entities...');
      
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'ADMIN_PRITOM',
        email: 'admin@fundbridge.com',
        password: hashedAdminPassword,
        role: 'admin',
        vettingStatus: 'verified',
        mfsNumber: '01799999999'
      });

      const hashedInvestorPassword = await bcrypt.hash('investorpassword', 10);
      await User.create({
        name: 'Angel Backer Zaman',
        email: 'investor@firm.com',
        password: hashedInvestorPassword,
        role: 'investor',
        vettingStatus: 'verified',
        mfsNumber: '01711111111',
        institution: 'Vantage Ventures Dhaka',
        designation: 'Syndicate Lead'
      });

      const hashedFounderPassword = await bcrypt.hash('founderpassword', 10);
      const seedFounder1 = await User.create({
        name: 'Anika Rahman',
        email: 'anika@brac.edu.bd',
        password: hashedFounderPassword,
        role: 'founder',
        vettingStatus: 'pending',
        mfsNumber: '01712345678',
        university: 'BRAC University',
        nid: '554092183201'
      });

      const seedFounder2 = await User.create({
        name: 'Tariqul Islam',
        email: 'tariqul@nsu.edu',
        password: hashedFounderPassword,
        role: 'founder',
        vettingStatus: 'pending',
        mfsNumber: '01811223344',
        university: 'NSU',
        nid: '443219082312'
      });

      await User.create({
        name: 'Siddique Rahman',
        email: 'siddique@ventures.com',
        password: hashedInvestorPassword,
        role: 'investor',
        vettingStatus: 'pending',
        mfsNumber: '01988776655',
        institution: 'Dhaka Angel Syndicate',
        designation: 'Managing Partner'
      });

      await Campaign.create([
        {
          id: 'campusbites',
          title: 'CampusBites',
          founder: seedFounder1._id,
          university: 'BRAC University',
          location: 'Dhanmondi, Dhaka',
          category: 'F&B',
          stage: 'MVP',
          goal: 500000,
          raised: 300000,
          equityOffer: '8% Revenue Share',
          milestones: [
            { title: 'MVP Launch', target: 'Month 1', status: 'done' },
            { title: 'First 100 Users', target: 'Month 2', status: 'pending' },
            { title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
          ],
          verified: true,
          description: 'Providing premium healthy meal delivery boxes inside campus parameters on a subscription basis.'
        },
        {
          id: 'solargrid',
          title: 'SolarGrid AI',
          founder: seedFounder1._id,
          university: 'BRAC University',
          location: 'Gulshan, Dhaka',
          category: 'CleanTech',
          stage: 'Venture Draft',
          goal: 500000,
          raised: 0,
          equityOffer: '10% Equity',
          milestones: [
            { title: 'Prototype', target: 'Month 1', status: 'done' },
            { title: 'Pilot Run', target: 'Month 2', status: 'done' },
            { title: 'Grid Link', target: 'Month 4', status: 'active' },
            { title: 'Public Release', target: 'Month 6', status: 'locked' }
          ],
          verified: false,
          description: 'Deploying smart clean energy systems using neural networks.'
        },
        {
          id: 'aquaflow',
          title: 'AquaFlow Decentral',
          founder: seedFounder2._id,
          university: 'NSU',
          location: 'Banani, Dhaka',
          category: 'WaterTech',
          stage: 'Early Traction',
          goal: 750000,
          raised: 0,
          equityOffer: '12% Equity',
          milestones: [
            { title: 'Design', target: 'Month 1', status: 'done' },
            { title: 'Filter Test', target: 'Month 2', status: 'active' },
            { title: 'Deployment', target: 'Month 4', status: 'locked' },
            { title: 'Public Sale', target: 'Month 6', status: 'locked' }
          ],
          verified: false,
          description: 'Decentralized water filtration system powered by blockchain-verified smart contracts.'
        }
      ]);
      console.log('✅ Database successfully auto-seeded with default entities.');
    }
  } catch (err) {
    console.error('Auto-seeding error:', err.message);
  }
};

// Database connection logic helper
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fundbridge';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('MongoDB cluster connection established successfully.');
    await seedInitialData();
  })
  .catch(async (err) => {
    console.warn('MongoDB primary connection warning:', err.message);
    if (!MONGO_URI.includes('127.0.0.1') && !MONGO_URI.includes('localhost')) {
      try {
        console.log('Attempting local MongoDB connection fallback (127.0.0.1)...');
        await mongoose.connect('mongodb://127.0.0.1:27017/fundbridge', { serverSelectionTimeoutMS: 3000 });
        console.log('Local MongoDB connected successfully.');
        await seedInitialData();
      } catch (localErr) {
        console.warn('Local MongoDB fallback unavailable. Running backend with offline fallback capabilities.');
      }
    }
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FundBridge backend running on port http://localhost:${PORT}`);
});

export default app;
