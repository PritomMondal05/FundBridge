import mongoose from 'mongoose';

const CampaignUpdateSchema = new mongoose.Schema({
  campaign_id: { type: String, required: true },
  founder_id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  milestone_tag: { type: String, default: 'General Update' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('CampaignUpdate', CampaignUpdateSchema);
