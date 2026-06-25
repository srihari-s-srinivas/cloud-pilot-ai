import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index added
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'timeout'],
    default: 'queued',
  },
  progress: {
    type: Number,
    default: 0,
  },
  currentStep: {
    type: String,
    default: 'Initializing...',
  },
  servicesScanned: [{
    type: String,
  }],
  findingsCount: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
  },
  duration: {
    type: Number, // in seconds
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound index for user query sorting by creation time
scanSchema.index({ userId: 1, createdAt: -1 });

// TTL index to automatically delete scans after 90 days (7776000 seconds)
scanSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;
