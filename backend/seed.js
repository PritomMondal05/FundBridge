import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Campaign from './models/Campaign.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fundbridge';

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Cleaning existing collections...');

    await User.deleteMany({});
    await Campaign.deleteMany({});

    console.log('Creating seed Founder User account...');
    const seedFounder = await User.create({
      name: 'Pritom Mondal',
      email: 'student@univ.edu.bd',
      role: 'founder',
      vettingStatus: 'verified',
      mfsNumber: '01712345678',
      university: 'BRAC University',
      nid: '1234567890123'
    });

    console.log('Seeding Campaigns collection...');
    const seedCampaigns = [
      {
        id: 'campusbites',
        title: 'CampusBites',
        founder: seedFounder._id,
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
        founder: seedFounder._id,
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

    await Campaign.create(seedCampaigns);
    console.log('Database successfully seeded with startup profiles!');
    
  } catch (error) {
    console.error('Seeding process failure:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedDatabase();
