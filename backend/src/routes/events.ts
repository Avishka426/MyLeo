import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import { getEvents, createEvent, deleteEvent } from '../controllers/eventController';

const router = Router();

router.use(protect as any);

router.get('/', asyncHandler(getEvents as any));
router.post('/', authorize('district_exco', 'multiple_exco', 'system_admin') as any, asyncHandler(createEvent as any));
router.delete('/:id', authorize('district_exco', 'multiple_exco', 'system_admin') as any, asyncHandler(deleteEvent as any));

export default router;
