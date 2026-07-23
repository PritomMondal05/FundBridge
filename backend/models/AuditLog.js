import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'VERIFIED'
  },
  latency: {
    type: String,
    default: '14ms'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
