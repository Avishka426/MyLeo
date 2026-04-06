import { Router } from 'express';
import {
  getHelpRequests,
  submitHelpRequest,
  updateHelpRequest,
  convertToProject,
} from '../controllers/helpRequestController';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.post('/', asyncHandler(submitHelpRequest));
router.get('/', protect, authorize('club_exco', 'system_admin'), asyncHandler(getHelpRequests));
router.put('/:id', protect, authorize('club_exco', 'system_admin'), asyncHandler(updateHelpRequest));
router.put('/:id/convert', protect, authorize('club_exco'), asyncHandler(convertToProject));

export default router;
