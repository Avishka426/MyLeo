import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectLocation,
  deleteProject,
} from '../controllers/projectController';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getProjects));
router.get('/:id', asyncHandler(getProject));

router.post('/', protect, authorize('club_exco', 'leo_member'), upload.array('media', 5), asyncHandler(createProject));
router.put('/:id', protect, authorize('club_exco', 'leo_member'), asyncHandler(updateProject));
router.put('/:id/location', protect, authorize('club_exco', 'leo_member'), asyncHandler(updateProjectLocation));
router.delete('/:id', protect, authorize('club_exco', 'system_admin'), asyncHandler(deleteProject));

export default router;
