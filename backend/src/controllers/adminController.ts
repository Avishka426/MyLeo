import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';

// POST /api/admin/create-user  (system_admin only)
// Creates district_member, district_exco, multiple_member, multiple_exco users
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, role, district, multipleDistrict, phone, position } = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ success: false, message: 'email, password and role are required' }); return;
  }

  if (['district_member', 'district_exco'].includes(role) && !district) {
    res.status(400).json({ success: false, message: 'district is required for district roles' }); return;
  }

  if (['multiple_member', 'multiple_exco'].includes(role) && !multipleDistrict) {
    res.status(400).json({ success: false, message: 'multipleDistrict is required for multiple district roles' }); return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ success: false, message: 'Email already in use' }); return;
  }

  const user = await User.create({
    email,
    password,
    role,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    position: position || undefined,
    district: district || undefined,
    multipleDistrict: multipleDistrict || undefined,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    data: { id: user._id, email: user.email, role: user.role, firstName, lastName },
  });
});
