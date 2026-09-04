import mongoose from 'mongoose';

const TrashSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  entityType: {
    type: String,
    enum: ['member', 'campaign', 'applicant', 'other'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reason: {
    type: String,
    default: 'Archived by administrator'
  },
  deletedBy: {
    type: String,
    default: 'ADMIN_SUPERVISOR'
  },
  deletedAt: {
    type: Date,
    default: Date.now
  }
});

const Trash = mongoose.model('Trash', TrashSchema);
export default Trash;
