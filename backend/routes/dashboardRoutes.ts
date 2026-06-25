import express from 'express';
import {
  getSummary,
  getSecurityFindings,
  getCostOptimizations,
  getAiRecommendations,
  getScanHistory,
  getTopology,
  generateTerraform,
  getTerraformHistory
} from '../controllers/dashboardController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Requested endpoints
router.get('/dashboard/summary', getSummary);
router.get('/security/findings', getSecurityFindings);
router.get('/optimization/savings', getCostOptimizations);
router.get('/ai/recommendations', getAiRecommendations);
router.get('/scans/history', getScanHistory);
router.get('/topology', getTopology);
router.post('/terraform/generate', generateTerraform);
router.get('/terraform/history', getTerraformHistory);

export default router;
