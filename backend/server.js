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

// In-Memory fallback data when MongoDB is not connected
const MOCK_CAMPAIGNS = [
  {
    id: 'campusbites',
    title: 'CampusBites',
    university: 'BRAC University',
    location: 'Dhanmondi, Dhaka',
    category: 'F&B',
    stage: 'MVP',
    goal: 500000,
    raised: 300000,
    equityOffer: '8% Revenue Share',
    milestones: [
      { title: 'MVP Launch', target: 'Month 1', status: 'done' },
      { title: 'First 100 Users', target: 'Month 2', status: 'active' },
      { title: 'Revenue ৳50K', target: 'Month 4', status: 'locked' }
    ],
    verified: true,
    description: 'Providing premium healthy meal delivery boxes inside campus parameters on a subscription basis.'
  },
  {
    id: 'dhakacourier',
    title: 'DhakaCourier Express',
    university: 'NSU',
    location: 'Banani, Dhaka',
    category: 'Logistics',
    stage: 'Early Traction',
    goal: 800000,
    raised: 520000,
    equityOffer: '10% Equity',
    milestones: [
      { title: 'Hub Setup in Banani', target: 'Month 1', status: 'done' },
      { title: 'First 500 Deliveries', target: 'Month 2', status: 'done' },
      { title: 'Automated Routing App', target: 'Month 3', status: 'active' }
    ],
    verified: true,
    description: 'Hyperlocal delivery network using student electric bikes for zero-emission parcels.'
  }
];

// Base API endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Campaign fetch API
app.get('/api/campaigns', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json(MOCK_CAMPAIGNS);
    }
    const campaigns = await Campaign.find({}).populate('founder', 'name email university');
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(200).json(MOCK_CAMPAIGNS);
  }
});

// Mock Vetting Verification application upload endpoint
app.post('/api/vetting/apply', async (req, res) => {
  try {
    const { name, email, university, nid, mfsNumber, role, institution, designation } = req.body;
    
    if (!name || !mfsNumber) {
      return res.status(400).json({ error: 'Full Name and MFS number are required for verification registry.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        message: 'Identity data registered in vetting queue (offline fallback).',
        status: 'pending',
        timestamp: new Date()
      });
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

// Escrow Milestone status check
app.get('/api/milestones/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign profile not found.' });
      }
      return res.status(200).json(campaign.milestones);
    }
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
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB cluster connection established successfully.'))
    .catch(err => console.error('MongoDB initial connection failure:', err));
} else {
  console.log('⚠️ Environment MONGO_URI variable is absent. Operating with mock in-memory collections.');
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FundBridge backend running on port http://localhost:${PORT}`);
});
