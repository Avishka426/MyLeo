import { Router } from 'express';
import {
  getNewsPosts,
  getNewsPost,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from '../controllers/newsFeedController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getNewsPosts));
router.get('/:id', asyncHandler(getNewsPost));

router.post('/', protect, authorize('club_exco'), upload.array('images', 5), asyncHandler(createNewsPost));
router.put('/:id', protect, authorize('club_exco'), asyncHandler(updateNewsPost));
router.delete('/:id', protect, authorize('club_exco', 'system_admin'), asyncHandler(deleteNewsPost));

export default router;
