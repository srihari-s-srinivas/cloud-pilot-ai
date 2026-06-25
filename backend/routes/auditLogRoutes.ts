import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', protect, getAuditLogs);

export default router;
