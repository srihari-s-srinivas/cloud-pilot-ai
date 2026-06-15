import express from 'express';
import { startScan, getScanStatus } from '../controllers/scanController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.post('/start', protect, startScan);
router.get('/status/:id', protect, getScanStatus);

export default router;
