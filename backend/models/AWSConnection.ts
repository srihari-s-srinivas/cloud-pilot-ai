import mongoose from 'mongoose';

const awsConnectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  accessKeyId: {
    type: String,
    required: true
  },
  secretAccessKey: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true,
    default: 'us-east-1'
  },
  selectedServices: {
    type: [String],
    default: ['EC2', 'S3', 'IAM', 'Security Groups']
  },
  status: {
    type: String,
    enum: ['Connected', 'Disconnected', 'Error'],
    default: 'Disconnected'
  },
  lastScan: {
    type: Date
  },
  accountId: {
    type: String
  }
}, {
  timestamps: true
});

const AWSConnection = mongoose.model('AWSConnection', awsConnectionSchema);

export default AWSConnection;
