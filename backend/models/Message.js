import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender_id: { type: String, required: true },
  receiver_id: { type: String, required: true },
  campaign_id: { type: String, default: '' },
  sender_name: { type: String, default: 'User' },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Message', MessageSchema);
