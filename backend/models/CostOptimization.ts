import mongoose from 'mongoose';

/**
 * CostOptimization model
 */
const costOptimizationSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
  },
  suggestion: {
    type: String,
    required: true,
  },
  potentialSavings: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const CostOptimization = mongoose.model('CostOptimization', costOptimizationSchema);
