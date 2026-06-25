import express from 'express';
import { getExecutiveReport, generateReport } from '../controllers/reportController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.get('/executive', protect, getExecutiveReport);
router.post('/generate', protect, generateReport);

export default router;
