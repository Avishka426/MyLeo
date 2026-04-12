import { Router } from 'express';
import {
  getHelpRequests,
  submitHelpRequest,
  claimHelpRequest,
  markJoint,
  requestJoin,
  reviewJoinRequest,
  convertToProject,
} from '../controllers/helpRequestController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getHelpRequests));
router.post('/', upload.array('images', 5), asyncHandler(submitHelpRequest));

router.put('/:id/claim',   protect, authorize('club_exco'), asyncHandler(claimHelpRequest));
router.put('/:id/joint',   protect, authorize('club_exco'), asyncHandler(markJoint));
router.post('/:id/join',   protect, authorize('club_exco'), asyncHandler(requestJoin));
router.put('/:id/join/:clubId', protect, authorize('club_exco'), asyncHandler(reviewJoinRequest));
router.put('/:id/convert', protect, authorize('club_exco'), asyncHandler(convertToProject));

export default router;
