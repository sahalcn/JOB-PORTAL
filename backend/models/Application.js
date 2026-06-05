import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  seeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Applied', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Accepted'],
    default: 'Applied',
  },
  matchScore: {
    type: Number,
    default: 0, // AI matching percentage based on experience & skill similarity
  },
  assessmentScore: {
    type: Number,
    default: null, // Test score if relevant assessment was taken
  },
  resumeUrl: {
    type: String,
    required: true,
  },
  interviewDetails: {
    dateTime: { type: Date, default: null },
    mode: { type: String, enum: ['Online', 'In-Person', 'Phone'], default: 'Online' },
    link: { type: String, default: '' }, // Interview link (Zoom/Meet) or Location
    notes: { type: String, default: '' }
  }
}, {
  timestamps: true,
});

export default mongoose.model('Application', ApplicationSchema);
