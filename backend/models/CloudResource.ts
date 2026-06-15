import mongoose from 'mongoose';

const cloudResourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index added
  },
  resourceId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true, // e.g., 'EC2', 'S3', 'IAM', 'RDS'
  },
  region: {
    type: String,
    default: 'us-east-1',
  },
  status: {
    type: String,
    default: 'active',
  },
  riskLevel: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low', 'Safe'],
    default: 'Safe',
  },
  monthlyCost: {
    type: Number,
    default: 0,
  },
  tags: {
    type: Map,
    of: String,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  }
}, {
  timestamps: true,
});

const CloudResource = mongoose.model('CloudResource', cloudResourceSchema);
export default CloudResource;
