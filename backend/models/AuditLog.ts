import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index added
  },
  action: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  severity: {
    type: String,
    enum: ['Info', 'Warning', 'Critical'],
    default: 'Info',
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index for timeline queries
auditLogSchema.index({ userId: 1, createdAt: -1 });

// TTL index to automatically delete audit logs after 180 days (15552000 seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
