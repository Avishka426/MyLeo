import { Router } from 'express';
import { getMembers, getMember, addMember, updateMember, deactivateMember } from '../controllers/memberController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.use(protect);
router.use(authorize('club_exco', 'system_admin'));

router.get('/', asyncHandler(getMembers));
router.get('/:id', asyncHandler(getMember));
router.post('/', asyncHandler(addMember));
router.put('/:id', upload.single('profileImage'), asyncHandler(updateMember));
router.delete('/:id', asyncHandler(deactivateMember));

export default router;
