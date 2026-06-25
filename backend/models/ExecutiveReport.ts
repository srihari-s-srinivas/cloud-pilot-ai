import mongoose from 'mongoose';

const executiveReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index added
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  healthScore: Number,
  riskPosture: String,
  summary: String,
  metrics: {
    totalResources: Number,
    criticalFindings: Number,
    highFindings: Number,
    monthlySavingPotential: Number,
  },
  recommendations: [{
    title: String,
    content: String,
    priority: String,
  }],
}, {
  timestamps: true,
});

// TTL index to automatically delete executive reports after 90 days (7776000 seconds)
executiveReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const ExecutiveReport = mongoose.model('ExecutiveReport', executiveReportSchema);
export default ExecutiveReport;
