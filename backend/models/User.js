import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false // Optional for initial demo auth lines
  },
  role: {
    type: String,
    enum: ['founder', 'investor', 'admin'],
    default: 'founder'
  },
  vettingStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  mfsNumber: {
    type: String,
    required: true,
    trim: true
  },
  // Fields specific to student founders
  university: {
    type: String,
    trim: true
  },
  nid: {
    type: String,
    trim: true
  },
  // Fields specific to corporate/alumni investors
  institution: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);
export default User;
