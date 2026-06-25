import mongoose from 'mongoose';

/**
 * SecurityFinding model for storage (Phase 2 readiness)
 */
const securityFindingSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    required: true,
  },
  issue: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  category: {
    type: String,
    default: 'Security',
  },
  impact: {
    type: String,
    required: true,
  },
  recommendation: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Resolved', 'In Progress', 'False Positive'],
    default: 'Open',
  },
  lastScanned: {
    type: Date,
    default: Date.now,
  },
  aiExplanation: String,
  terraformFix: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index added
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for optimized querying/sorting together
securityFindingSchema.index({ userId: 1, severity: 1, status: 1 });

// TTL index to automatically delete security findings after 180 days (15552000 seconds)
securityFindingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

export const SecurityFinding = mongoose.model('SecurityFinding', securityFindingSchema);
