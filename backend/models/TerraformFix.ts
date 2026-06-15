import mongoose from 'mongoose';

const terraformFixSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resourceId: {
    type: String,
    required: true,
  },
  issueType: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Generated', 'Applied', 'Failed'],
    default: 'Generated',
  },
  engine: {
    type: String,
    default: 'CloudPilot-AI-v2',
  },
}, {
  timestamps: true,
});

const TerraformFix = mongoose.model('TerraformFix', terraformFixSchema);
export default TerraformFix;
