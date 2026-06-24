import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // MongoDB TTL index — auto-delete when expired
  },
}, {
  timestamps: true,
});

// Compound index for efficient lookup
OtpSchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
