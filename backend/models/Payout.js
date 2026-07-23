import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tranche: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    default: 'bKash'
  },
  accountNumber: {
    type: String
  },
  status: {
    type: String,
    default: 'Pending Audit'
  },
  hash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Payout = mongoose.model('Payout', PayoutSchema);
export default Payout;
