import { Router } from 'express';
import { getMapProjects } from '../controllers/mapController';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/projects', asyncHandler(getMapProjects));

export default router;
