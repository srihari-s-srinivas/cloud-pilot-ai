import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, getMe, updateProfile, debugAuth } from '../controllers/authController.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

// Limiters configuration for security auditing requirements
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 login requests per 15 mins
  statusCode: 429,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit to 5 registrations per hour
  statusCode: 429,
  message: { message: 'Too many accounts created from this IP, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/debug', protect, debugAuth);
router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/profile', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
