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
  dob: {
    type: String,
    trim: true
  },
  university: {
    type: String,
    trim: true
  },
  studentId: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  nid: {
    type: String,
    trim: true
  },
  studentIdCardImage: {
    type: String,
    trim: true
  },
  nidCardImage: {
    type: String,
    trim: true
  },
  // Fields specific to corporate/alumni investors
  affiliationStatus: {
    type: String,
    enum: ['Alumni Backer', 'Venture Capitalist', 'Angel Investor', 'Corporate Partner', ''],
    default: ''
  },
  institution: {
    type: String,
    trim: true
  },
  passingYear: {
    type: String,
    trim: true
  },
  nidOrPassport: {
    type: String,
    trim: true
  },
  bankOrMfs: {
    type: String,
    trim: true
  },
  nidOrPassportImage: {
    type: String,
    trim: true
  },
  credentialsImage: {
    type: String,
    trim: true
  },
  credentialsLink: {
    type: String,
    trim: true
  },
  vettingDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);
export default User;
