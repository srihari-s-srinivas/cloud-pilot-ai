import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  testConnection, 
  connectAWS, 
  getConnectionStatus, 
  updateScanConfig 
} from '../controllers/awsController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.use(protect);

const testConnectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour window
  max: 10,                    // max 10 test attempts per hour per IP
  message: { 
    message: 'Too many connection attempts. Please wait before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/test-connection', testConnectionLimiter, testConnection);
router.post('/connect', connectAWS);
router.get('/status', getConnectionStatus);
router.post('/scan-config', updateScanConfig);

export default router;
