import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  complainantName: {
    type: String,
    required: true
  },
  complainantRole: {
    type: String,
    required: true
  },
  reportedUser: {
    type: String,
    required: true
  },
  reportedUserId: {
    type: String
  },
  reportedRole: {
    type: String,
    required: true
  },
  campaignTitle: {
    type: String
  },
  campaignId: {
    type: String
  },
  issueType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  evidenceFile: {
    type: String
  },
  severity: {
    type: String,
    default: 'High'
  },
  status: {
    type: String,
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Dispute = mongoose.model('Dispute', DisputeSchema);
export default Dispute;
