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
import Message from './models/Message.js';
import CampaignUpdate from './models/CampaignUpdate.js';
import Notification from './models/Notification.js';
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
const fallbackUsers = [];

// Populate generated 30 investors and 100 student founders into fallback store
try {
  const seedPath = path.join(__dirname, 'seed_generated.json');
  if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedSeed = JSON.parse(rawData);
    if (Array.isArray(parsedSeed.founders)) fallbackUsers.push(...parsedSeed.founders);
    if (Array.isArray(parsedSeed.investors)) fallbackUsers.push(...parsedSeed.investors);
  }
} catch (e) {
  console.warn('Seed generated JSON read warning:', e.message);
}

// Add Default Admin User if missing
if (!fallbackUsers.some(u => u.email === 'admin@fundbridge.com')) {
  fallbackUsers.unshift({
    _id: 'usr_admin_1',
    id: 'usr_admin_1',
    name: 'ADMIN_PRITOM',
    email: 'admin@fundbridge.com',
    password: 'admin123',
    role: 'admin',
    vettingStatus: 'verified',
    vetting_status: 'verified',
    mfsNumber: '01799999999'
  });
}

const fallbackCampaigns = [];

// Populate 50 generated campaigns into fallback store
try {
  const seedPath = path.join(__dirname, 'seed_generated.json');
  if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedSeed = JSON.parse(rawData);
    if (Array.isArray(parsedSeed.campaigns)) fallbackCampaigns.push(...parsedSeed.campaigns);
  }
} catch (e) {
  console.warn('Seed campaigns read warning:', e.message);
const fallbackProposals = [];
const fallbackPayouts = [];
const fallbackMessages = [];
const fallbackUpdates = [];
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
  const fId = c.founder_id || c.founderId || (typeof c.founder === 'object' ? (c.founder?._id || c.founder?.id) : c.founder);
  const foundUser = fallbackUsers.find(u => u.id === fId || u._id === fId);
  const founderObj = (typeof c.founder === 'object' && c.founder?.name && c.founder?.university) ? c.founder : (foundUser ? {
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
    _id: fId || 'usr_founder_1',
    id: fId || 'usr_founder_1',
    name: 'Anika Rahman',
    email: 'anika@brac.edu.bd',
    university: c.university || 'BRAC University',
    department: 'Computer Science & Engineering',
    studentId: '20101452',
    mfsNumber: '01711223344',
    vettingStatus: 'verified'
  });

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

app.get('/api/users/founders', async (req, res) => {
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

    // Send real-time notification to Founder
    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    const targetFounderId = cmp?.founder_id || cmp?.founder?._id || cmp?.founder?.id || 'usr_founder_1';
    await createAndDispatchNotification(
      targetFounderId,
      'New Investment Proposal Received! 💰',
      `${investorName || 'An investor'} submitted a BDT ৳${Number(amount).toLocaleString()} funding proposal for your startup.`,
      'info'
    );

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
      try { await supabase.from('messages').insert([msgObj]); } catch(e){}
    }

    const targetRoom = data.roomId || data.campaignId || 'general';
    io.to(targetRoom).emit('receive_message', msgObj);
    io.emit('new_direct_message', msgObj);
  });
});

// ============================================================================
// FR-21: AI OPTIMIZATION ENGINE API
// ============================================================================
app.post('/api/ai/generate', (req, res) => {
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
      const summary = `BUSINESS SUMMARY FOR ${title || 'VENTURE'}:\n1. Core Value Proposition: Streamlined ${category || 'Tech'} operations tailored for high-growth Bangladeshi markets.\n2. Milestone Execution: Clear 3-tranche roadmap focused on MVP deployment, customer acquisition, and recurring revenue.\n3. Investor Return Alignment: High alignment with alumni networks and revenue share / milestone debt models.`;
      return res.status(200).json({ summary });
    }

    if (action === 'investor_match') {
      const recommendations = fallbackCampaigns.slice(0, 3).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        matchScore: Math.floor(88 + Math.random() * 11) + '% Match',
        reason: `Strong alignment with your preference for ${c.category} ventures originating from ${c.university}.`
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
      try { await supabase.from('messages').insert([msgObj]); } catch(e){}
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
app.put('/api/users/profile', async (req, res) => {
  try {
    const { userId, name, university, department, mfsNumber, bio, institution, passingYear } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update({
          name,
          university,
          department,
          mfs_number: mfsNumber,
          institution,
          passing_year: passingYear
        }).eq('id', userId);
      } catch (e) {}
    }

    const fu = fallbackUsers.find(u => u.id === userId || u._id === userId);
    if (fu) {
      if (name) fu.name = name;
      if (university) fu.university = university;
      if (department) fu.department = department;
      if (mfsNumber) fu.mfs_number = fu.mfsNumber = mfsNumber;
      if (bio) fu.bio = bio;
      if (institution) fu.institution = institution;
      if (passingYear) fu.passing_year = passingYear;
    }

    res.status(200).json({ message: 'Profile updated successfully.', user: fu || { id: userId, name } });
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile.' });
  }
});

// ============================================================================
// FR-5: CAMPAIGN EDIT & CANCEL APIS
// ============================================================================
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tagline, goal, equityOffer, description, category, stage } = req.body;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({
          title,
          tagline,
          goal: Number(goal),
          equity_offer: equityOffer,
          description,
          category,
          stage
        }).eq('id', id);
      } catch (e) {}
    }

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) {
      if (title) cmp.title = title;
      if (tagline) cmp.tagline = tagline;
      if (goal) cmp.goal = Number(goal);
      if (equityOffer) cmp.equity_offer = cmp.equityOffer = equityOffer;
      if (description) cmp.description = description;
      if (category) cmp.category = category;
      if (stage) cmp.stage = stage;
    }

    res.status(200).json({ message: 'Campaign updated successfully.', campaign: cmp });
  } catch (err) {
    res.status(500).json({ error: 'Error updating campaign.' });
  }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ status: 'cancelled' }).eq('id', id);
      } catch (e) {}
    }

    const cmp = fallbackCampaigns.find(c => c.id === id || c._id === id);
    if (cmp) cmp.status = 'cancelled';

    res.status(200).json({ message: 'Campaign de-listed / cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error cancelling campaign.' });
  }
});

// ============================================================================
// FR-8: PROGRESS LOGGING / ANNOUNCEMENTS APIS
// ============================================================================
app.get('/api/campaigns/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaign_updates').select('*').eq('campaign_id', id).order('created_at', { ascending: false });
      if (!error && data) return res.status(200).json(data);
    }
    const filtered = fallbackUpdates.filter(u => u.campaign_id === id);
    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching campaign updates.' });
  }
});

app.post('/api/campaigns/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;
    const { founderId, title, content, milestoneTag } = req.body;

    const newUpdate = {
      id: 'upd_' + Date.now(),
      campaign_id: id,
      founder_id: founderId || 'usr_founder_1',
      title: title || 'Milestone Progress Update',
      content: content || '',
      milestone_tag: milestoneTag || 'General Update',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('campaign_updates').insert([newUpdate]); } catch (e) {}
    }
    fallbackUpdates.unshift(newUpdate);

    res.status(201).json(newUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Error creating campaign update.' });
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
    if (prop) prop.status = 'withdrawn';
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
    if (prop) prop.status = 'withdrawn';
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
});

export default app;

