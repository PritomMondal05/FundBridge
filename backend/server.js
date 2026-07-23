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
import Payout from './models/Payout.js';
import Dispute from './models/Dispute.js';
import AuditLog from './models/AuditLog.js';
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
const fallbackUsers = [
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
    _id: 'usr_investor_1',
    id: 'usr_investor_1',
    name: 'Angel Backer Zaman',
    email: 'investor@firm.com',
    password: 'investorpassword',
    role: 'investor',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    mfsNumber: '01711111111',
    institution: 'Vantage Ventures Dhaka',
    designation: 'Syndicate Lead'
  },
  {
    _id: 'usr_founder_1',
    id: 'usr_founder_1',
    name: 'Anika Rahman',
    email: 'anika@brac.edu.bd',
    password: 'founderpassword',
    role: 'founder',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    mfsNumber: '01712345678',
    university: 'BRAC University',
    nid: '554092183201'
  }
];

const fallbackCampaigns = [
  {
    _id: 'campusbites',
    id: 'campusbites',
    title: 'CampusBites',
    founder: {
      _id: 'usr_founder_1',
      id: 'usr_founder_1',
      name: 'Anika Rahman',
      email: 'anika@brac.edu.bd',
      university: 'BRAC University'
    },
    founder_id: 'usr_founder_1',
    founderId: 'usr_founder_1',
    university: 'BRAC University',
    location: 'Dhaka, Bangladesh',
    category: 'FoodTech / SaaS',
    stage: 'MVP',
    goal: 500000,
    raised: 450000,
    equityOffer: '8% Rev. Share',
    equity_offer: '8% Rev. Share',
    tagline: 'Smart Canteen Ordering & Pre-Meal Reservation App for University Campuses',
    verified: true,
    status: 'verified',
    milestones: [
      { id: 'm1', title: 'MVP Launch', target: 'Month 1', status: 'done' },
      { id: 'm2', title: 'First 100 Users', target: 'Month 2', status: 'active' },
      { id: 'm3', title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
    ],
    description: 'CampusBites eliminates long queues at university cafeterias by enabling pre-ordering via MFS.'
  }
];

const fallbackProposals = [];
const fallbackPayouts = [];

// NORMALIZATION HELPERS
const normalizeUser = (u) => {
  if (!u) return null;
  return {
    _id: u.id || u._id,
    id: u.id || u._id,
    name: u.name,
    email: u.email,
    role: u.role || 'founder',
    vettingStatus: u.vetting_status || u.vettingStatus || 'verified',
    vetting_status: u.vetting_status || u.vettingStatus || 'verified',
    mfsNumber: u.mfs_number || u.mfsNumber || '',
    mfs_number: u.mfs_number || u.mfsNumber || '',
    university: u.university || '',
    studentId: u.student_id || u.studentId || '',
    department: u.department || '',
    nid: u.nid || '',
    institution: u.institution || '',
    affiliationStatus: u.affiliation_status || u.affiliationStatus || '',
    passingYear: u.passing_year || u.passingYear || ''
  };
};

const normalizeCampaign = (c) => {
  if (!c) return null;
  return {
    _id: c.id || c._id,
    id: c.id || c._id,
    title: c.title,
    founderId: c.founder_id || c.founderId || (typeof c.founder === 'object' ? c.founder?._id : c.founder),
    founder_id: c.founder_id || c.founderId || (typeof c.founder === 'object' ? c.founder?._id : c.founder),
    founder: c.founder || { _id: c.founder_id || c.founderId, name: 'Student Founder' },
    university: c.university || '',
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
    verified: c.verified !== undefined ? c.verified : true,
    status: c.status || 'verified',
    escrowFrozen: c.escrow_frozen || c.escrowFrozen || false,
    escrow_frozen: c.escrow_frozen || c.escrowFrozen || false
  };
};

const normalizeProposal = (p) => {
  if (!p) return null;
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
    custom_notes: p.custom_notes || p.customNotes || '',
    status: p.status || 'pending',
    created_at: p.created_at || p.createdAt || new Date().toISOString()
  };
};

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
    if (isSupabaseConfigured && supabase) {
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
      const fb = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (fb) {
        user = normalizeUser(fb);
        user.password = fb.password;
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
        designation: user.passingYear
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

    if (isSupabaseConfigured && supabase) {
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

app.get('/api/admin/users/founders', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'founder');
      if (!error && data) return res.status(200).json(data.map(normalizeUser));
    }
    if (mongoose.connection.readyState === 1) {
      const founders = await User.find({ role: 'founder' });
      if (founders) return res.status(200).json(founders.map(normalizeUser));
    }
    res.status(200).json(fallbackUsers.filter(u => u.role === 'founder').map(normalizeUser));
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'founder').map(normalizeUser));
  }
});

app.get('/api/admin/users/investors', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'investor');
      if (!error && data) return res.status(200).json(data.map(normalizeUser));
    }
    if (mongoose.connection.readyState === 1) {
      const investors = await User.find({ role: 'investor' });
      if (investors) return res.status(200).json(investors.map(normalizeUser));
    }
    res.status(200).json(fallbackUsers.filter(u => u.role === 'investor').map(normalizeUser));
  } catch (err) {
    res.status(200).json(fallbackUsers.filter(u => u.role === 'investor').map(normalizeUser));
  }
});

// CAMPAIGN MANAGEMENT APIS
app.get('/api/campaigns', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*');
      if (!error && data) {
        return res.status(200).json(data.map(normalizeCampaign));
      }
    }
    if (mongoose.connection.readyState === 1) {
      const campaigns = await Campaign.find();
      if (campaigns) return res.status(200).json(campaigns.map(normalizeCampaign));
    }
    res.status(200).json(fallbackCampaigns.map(normalizeCampaign));
  } catch (err) {
    res.status(200).json(fallbackCampaigns.map(normalizeCampaign));
  }
});

app.get('/api/campaigns/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*').or(`founder_id.eq.${founderId},founder_id.eq.usr_founder_1`);
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
    const fc = fallbackCampaigns.filter(c => c.founder?._id === founderId || c.founder?.id === founderId || c.founder_id === founderId || c.founder === founderId);
    res.status(200).json(fc.map(normalizeCampaign));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { id, title, founderId, university, location, category, stage, goal, equityOffer, description, milestones, tagline, coverPhoto, pitchVideoUrl } = req.body;

    if (!title || !founderId) {
      return res.status(400).json({ error: 'Startup Title and Founder ID are required.' });
    }

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
      raised: 0,
      equity_offer: equityOffer || '8% Revenue Share',
      tagline: tagline || '',
      cover_photo: coverPhoto || '',
      pitch_video_url: pitchVideoUrl || '',
      description: description || title,
      milestones: parsedMilestones,
      verified: true,
      status: 'verified'
    };

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

    res.status(201).json({ message: 'Campaign saved successfully.', campaign: resultCampaign || normLocal });
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

    const proposalObj = {
      id: `prop_${Date.now()}`,
      campaign_id: id,
      campaignId: id,
      investor_id: investorId,
      investorId: investorId,
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
        const { data: supaProp } = await supabase.from('proposals').insert([{
          campaign_id: id,
          investor_id: investorId,
          amount: Number(amount),
          terms,
          return_structure: terms,
          custom_notes: customNotes || '',
          status: 'pending'
        }]).select().single();
        if (supaProp) createdProp = normalizeProposal(supaProp);
      } catch (e) {
        console.warn('Supabase proposal insert warning:', e.message);
      }
    }

    fallbackProposals.unshift(normalizeProposal(proposalObj));

    res.status(201).json({ message: 'Investment proposal submitted to Founder.', proposal: createdProp || proposalObj });
  } catch (err) {
    console.error('Error submitting proposal:', err);
    res.status(500).json({ error: 'Server error submitting backing proposal.' });
  }
});

app.get('/api/proposals/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').eq('campaign_id', campaignId);
      if (!error && data) {
        return res.status(200).json(data.map(normalizeProposal));
      }
    }

    const fp = fallbackProposals.filter(p => p.campaign_id === campaignId || p.campaignId === campaignId);
    res.status(200).json(fp.map(normalizeProposal));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.get('/api/proposals/investor/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').eq('investor_id', investorId);
      if (!error && data) {
        return res.status(200).json(data.map(normalizeProposal));
      }
    }

    const fp = fallbackProposals.filter(p => p.investor_id === investorId || p.investorId === investorId);
    res.status(200).json(fp.map(normalizeProposal));
  } catch (err) {
    res.status(200).json([]);
  }
});

app.post('/api/campaigns/:id/proposals/:proposalId/status', async (req, res) => {
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

    const fp = fallbackProposals.find(p => p.id === proposalId || p._id === proposalId);
    if (fp) fp.status = status;

    res.status(200).json({ message: `Proposal status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating proposal status.' });
  }
});

// PAYOUTS & AUDIT LOGS APIS
app.get('/api/payouts/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('payouts').select('*').eq('founder_id', founderId);
      if (!error && data) return res.status(200).json(data);
    }
    res.status(200).json(fallbackPayouts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching payouts' });
  }
});

app.post('/api/payouts/request', async (req, res) => {
  try {
    const { founderId, amount, method, accountNumber, tranche } = req.body;
    const newPayout = {
      id: 'TRX-' + Math.floor(100 + Math.random() * 900),
      founder_id: founderId,
      tranche: tranche || 'Milestone Escrow Payout',
      amount: Number(amount),
      method: method || 'bKash Merchant',
      account_number: accountNumber || '',
      status: 'Pending Audit',
      hash: '0x' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('payouts').insert([newPayout]);
    }
    fallbackPayouts.unshift(newPayout);
    res.status(201).json(newPayout);
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

// Socket connection
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', {
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
