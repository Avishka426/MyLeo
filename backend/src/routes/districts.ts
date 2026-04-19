import { Router } from 'express';
import { protect, authorize, districtScope } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import upload from '../middleware/upload';
import {
  getDistricts,
  getDistrict,
  createDistrict,
  updateDistrict,
  getDistrictClubs,
  getDistrictSummary,
} from '../controllers/districtController';

const router = Router();

// All district routes require auth
router.use(protect as any);

// List districts (scope-filtered)
router.get('/', authorize('district_exco', 'district_member', 'multiple_exco', 'multiple_member', 'system_admin'), districtScope as any, asyncHandler(getDistricts as any));

// District summary — exco only
router.get('/:id/summary', authorize('district_exco', 'multiple_exco', 'system_admin'), districtScope as any, asyncHandler(getDistrictSummary as any));

// Clubs in a district
router.get('/:id/clubs', authorize('district_exco', 'district_member', 'multiple_exco', 'multiple_member', 'system_admin'), districtScope as any, asyncHandler(getDistrictClubs as any));

// Single district
router.get('/:id', authorize('district_exco', 'district_member', 'multiple_exco', 'multiple_member', 'system_admin'), districtScope as any, asyncHandler(getDistrict as any));

// Create / update — multiple_exco or system_admin only
router.post('/', authorize('multiple_exco', 'system_admin'), asyncHandler(createDistrict as any));
router.put('/:id', authorize('district_exco', 'multiple_exco', 'system_admin'), districtScope as any, upload.single('logo'), asyncHandler(updateDistrict as any));

export default router;
