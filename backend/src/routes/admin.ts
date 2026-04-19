import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import { createUser } from '../controllers/adminController';

const router = Router();

router.use(protect as any);
router.use(authorize('system_admin') as any);

router.post('/create-user', asyncHandler(createUser as any));

export default router;
