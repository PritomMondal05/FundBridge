import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Campaign from './models/Campaign.js';
import Proposal from './models/Proposal.js';
import bcrypt from 'bcryptjs';

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
    await Proposal.deleteMany({});

    console.log('Seeding administrative and investor users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'ADMIN_PRITOM',
      email: 'admin@fundbridge.com',
      password: hashedAdminPassword,
      role: 'admin',
      vettingStatus: 'verified',
      mfsNumber: '01799999999'
    });

    const hashedInvestorPassword = await bcrypt.hash('investorpassword', 10);
    const seedInvestor = await User.create({
      name: 'Angel Backer Zaman',
      email: 'investor@firm.com',
      password: hashedInvestorPassword,
      role: 'investor',
      vettingStatus: 'verified',
      mfsNumber: '01711111111',
      institution: 'Vantage Ventures Dhaka',
      designation: 'Syndicate Lead'
    });

    console.log('Seeding pending Vetting Applicants...');
    // Anika Rahman (ID: FB-2023-9981) - Student Founder (Pending)
    const hashedFounderPassword = await bcrypt.hash('founderpassword', 10);
    const seedFounder1 = await User.create({
      name: 'Anika Rahman',
      email: 'anika@brac.edu.bd',
      password: hashedFounderPassword,
      role: 'founder',
      vettingStatus: 'pending',
      mfsNumber: '01712345678',
      university: 'BRAC University',
      nid: '554092183201' // Govt Smart NID Card representation
    });

    // Seed another pending founder
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

    // Seed a pending investor for Vetting (Alumni Backers tab)
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

    console.log('Seeding Campaigns collection...');
    const seedCampaigns = [
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
          { title: 'First 100 Users', target: 'Month 2', status: 'pending' }, // This triggers escrow release queue
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
        verified: false, // Pending Vetting Audit
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
    ];

    await Campaign.create(seedCampaigns);
    console.log('Database successfully seeded with real database entities!');
    
  } catch (error) {
    console.error('Seeding process failure:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedDatabase();
