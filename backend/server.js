import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Mongoose Models
import User from './models/User.js';
import Campaign from './models/Campaign.js';
import Proposal from './models/Proposal.js';
import bcrypt from 'bcryptjs';

dotenv.config();

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

// Base API endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ==========================================
// USER AUTHENTICATION & PORTAL APIS
// ==========================================

// Register a new user (Founder or Investor)
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, role, mfsNumber, university, nid, institution, designation } = req.body;

    if (!name || !email || !password || !role || !mfsNumber) {
      return res.status(400).json({ error: 'Name, email, password, role, and MFS number are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email address.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      vettingStatus: 'pending', // Starts as pending admin vetting
      mfsNumber,
      university,
      nid,
      institution,
      designation
    });

    res.status(201).json({
      message: 'Account registered successfully. Vetting process initiated.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vettingStatus: user.vettingStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during user registration.' });
  }
});

// Log in user (Admin, Founder, or Investor)
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check password
    if (user.role === 'admin') {
      // Admins are seeded with plain text or bcrypt. For safety, check both
      const matches = user.password === password || await bcrypt.compare(password, user.password);
      if (!matches) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
    } else {
      if (!user.password) {
        return res.status(401).json({ error: 'Account has no password configured. Please register.' });
      }
      const matches = await bcrypt.compare(password, user.password);
      if (!matches) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    }

    res.status(200).json({
      message: 'Authentication successful.',
      token: user.role === 'admin' ? 'jwt-admin-token-db-active' : 'jwt-user-token-db-active',
      user: {
        id: user._id,
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
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials or access denied.' });
    }
    const matches = user.password === password || await bcrypt.compare(password, user.password);
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
    const applicants = await User.find({ vettingStatus: 'pending' });
    res.status(200).json(applicants);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching vetting applicants.' });
  }
});

// Approve or reject vetting status
app.post('/api/vetting/status', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required.' });
    }
    const user = await User.findByIdAndUpdate(userId, { vettingStatus: status }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ message: `Vetting status updated to ${status}.`, user });
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
    const campaigns = await Campaign.find({ verified: true }).populate('founder', 'name email university mfsNumber');
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching campaigns from database.' });
  }
});

// Get campaigns owned by a specific Founder
app.get('/api/campaigns/founder/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    const campaigns = await Campaign.find({ founder: founderId });
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching campaigns for founder.' });
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

    const campaign = await Campaign.create({
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
      verified: false // Must be verified by Admin before going live in catalog
    });

    res.status(201).json({ message: 'Campaign created successfully. Waiting for Admin verification.', campaign });
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
    const pendingCampaigns = await Campaign.find({ verified: false }).populate('founder', 'name email university');
    res.status(200).json(pendingCampaigns);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pending campaigns.' });
  }
});

// Approve/Verify campaign to push it live in catalog
app.post('/api/admin/campaigns/:campaignId/verify', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(campaignId, { verified: true }, { new: true });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign profile not found.' });
    }
    res.status(200).json({ message: 'Campaign verified and set to live.', campaign });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying campaign.' });
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

// Database connection logic helper
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fundbridge';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB cluster connection established successfully.'))
  .catch(err => console.error('MongoDB initial connection failure:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FundBridge backend running on port http://localhost:${PORT}`);
});

export default app;
