import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['done', 'active', 'pending', 'locked'],
    default: 'locked'
  }
});

const CampaignSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  founder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  university: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stage: {
    type: String,
    required: true,
    trim: true
  },
  goal: {
    type: Number,
    required: true
  },
  raised: {
    type: Number,
    default: 0
  },
  equityOffer: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  milestones: [MilestoneSchema],
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Campaign = mongoose.model('Campaign', CampaignSchema);
export default Campaign;
