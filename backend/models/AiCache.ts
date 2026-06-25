import mongoose from 'mongoose';

const aiCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  cachedRecommendations: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours TTL
  },
  dailyAiCallCount: {
    type: Number,
    default: 0,
  },
  lastAiCallDate: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const AiCache = mongoose.model('AiCache', aiCacheSchema);
export default AiCache;
