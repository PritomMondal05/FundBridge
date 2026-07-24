import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema);
