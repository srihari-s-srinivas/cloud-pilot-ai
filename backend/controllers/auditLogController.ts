import mongoose from 'mongoose';
import { Response } from 'express';
import AuditLog from '../models/AuditLog.ts';

/**
 * @desc    Get audit logs
 * @route   GET /api/audit-logs
 */
export const getAuditLogs = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState !== 1) {
       return res.json({
         data: [],
         total: 0,
         page,
         totalPages: 0
       });
    }

    // Do NOT auto-seed fake/fabricated logs. Let compliant user activity define the audit trail.
    const total = await AuditLog.countDocuments({ userId });
    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('[auditLogController][getAuditLogs]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
