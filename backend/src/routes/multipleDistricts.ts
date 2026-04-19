import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import upload from '../middleware/upload';
import {
  getMultipleDistricts,
  getMultipleDistrict,
  createMultipleDistrict,
  updateMultipleDistrict,
  getMultipleDistrictSummary,
} from '../controllers/multipleDistrictController';

const router = Router();

router.use(protect as any);

router.get('/', authorize('multiple_exco', 'multiple_member', 'system_admin'), asyncHandler(getMultipleDistricts as any));
router.get('/:id/summary', authorize('multiple_exco', 'system_admin'), asyncHandler(getMultipleDistrictSummary as any));
router.get('/:id', authorize('multiple_exco', 'multiple_member', 'system_admin'), asyncHandler(getMultipleDistrict as any));
router.post('/', authorize('system_admin'), asyncHandler(createMultipleDistrict as any));
router.put('/:id', authorize('multiple_exco', 'system_admin'), upload.single('logo'), asyncHandler(updateMultipleDistrict as any));

export default router;
