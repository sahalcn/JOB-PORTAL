import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Job Seeker', 'Employer', 'Admin'],
    default: 'Job Seeker',
  },
  profile: {
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    experience: { type: Number, default: 0 }, // in years
    education: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeText: { type: String, default: '' }, // extracted text
    assessmentScores: [
      {
        skill: String,
        score: Number, // percentage out of 100
        takenAt: { type: Date, default: Date.now }
      }
    ]
  }
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
