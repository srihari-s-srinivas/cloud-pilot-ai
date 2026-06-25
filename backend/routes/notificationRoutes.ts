import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);

export default router;
