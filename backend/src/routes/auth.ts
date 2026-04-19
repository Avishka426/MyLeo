import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signIn, getMe, changePassword, forgotPassword, resetPassword, uploadProfileImage } from '../controllers/authController';
import { protect } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import upload from '../middleware/upload';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signin', authLimiter, asyncHandler(signIn));
router.post('/forgot-password', authLimiter, asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.get('/me', protect, asyncHandler(getMe));
router.put('/me/avatar', protect, upload.single('avatar'), uploadProfileImage);
router.put('/change-password', protect, asyncHandler(changePassword));

export default router;
