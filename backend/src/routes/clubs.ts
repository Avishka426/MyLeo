import { Router } from 'express';
import { getClubs, getClub, createClub, updateClub, deleteClub } from '../controllers/clubController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Public read access
router.get('/', asyncHandler(getClubs));
router.get('/:id', asyncHandler(getClub));

// Protected write access
router.post('/', protect, authorize('system_admin'), asyncHandler(createClub));
router.put('/:id', protect, authorize('club_exco', 'system_admin'), upload.single('logo'), asyncHandler(updateClub));
router.delete('/:id', protect, authorize('system_admin'), asyncHandler(deleteClub));

export default router;
