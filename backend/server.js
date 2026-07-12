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

// Campaign fetch API
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).populate('founder', 'name email university');
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching campaigns from database.' });
  }
});

// Mock Vetting Verification application upload endpoint
app.post('/api/vetting/apply', async (req, res) => {
  try {
    const { name, email, university, nid, mfsNumber, role, institution, designation } = req.body;
    
    if (!name || !mfsNumber) {
      return res.status(400).json({ error: 'Full Name and MFS number are required for verification registry.' });
    }

    const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}@univ.edu.bd`;
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        name,
        role: role || 'founder',
        mfsNumber,
        university,
        nid,
        institution,
        designation,
        vettingStatus: 'pending'
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: 'Identity data registered in vetting database queue.',
      status: user.vettingStatus,
      userId: user._id,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error processing verification registration.' });
  }
});

// Retrieve pending vetting applications
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
    const { userId, status } = req.body; // status: 'verified' or 'rejected'
    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required.' });
    }

    const user = await User.findByIdAndUpdate(userId, { vettingStatus: status }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: `Vetting status updated to ${status}.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Error updating vetting status.' });
  }
});

// Admin authentication API endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials or access denied.' });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    res.status(200).json({
      message: 'Admin authentication successful.',
      token: 'jwt-admin-token-db-active',
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during administrator login.' });
  }
});

// Escrow Milestone status check
app.get('/api/milestones/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findOne({ id: campaignId });
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
