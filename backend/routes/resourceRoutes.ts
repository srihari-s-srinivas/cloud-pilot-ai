import express from 'express';
import { getResources } from '../controllers/resourceController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', protect, getResources);

export default router;
