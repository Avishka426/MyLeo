import { Router } from 'express';
import { getClubs, getClub, createClub, updateClub, deleteClub } from '../controllers/clubController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getClubs));
router.get('/:id', asyncHandler(getClub));
router.post('/', authorize('system_admin'), asyncHandler(createClub));
router.put('/:id', authorize('club_exco', 'system_admin'), upload.single('logo'), asyncHandler(updateClub));
router.delete('/:id', authorize('system_admin'), asyncHandler(deleteClub));

export default router;
