import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import sendEmail from '../utils/sendEmail';

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

  const displayName = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : email;
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  try {
    await sendEmail({
      to: email,
      subject: `Welcome to ${process.env.APP_NAME} — Your Account is Ready`,
      html: `
        <h2>Welcome to ${process.env.APP_NAME}, ${displayName}!</h2>
        <p>Your account has been created as <strong>${roleLabel}</strong>.</p>
        <p>Sign in with the following credentials:</p>
        <table style="border-collapse:collapse;margin:12px 0;">
          <tr><td style="padding:6px 12px 6px 0;color:#666;">Email</td><td style="padding:6px 0;font-weight:700;">${email}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#666;">Password</td><td style="padding:6px 0;font-weight:700;">${password}</td></tr>
          ${position ? `<tr><td style="padding:6px 12px 6px 0;color:#666;">Position</td><td style="padding:6px 0;font-weight:700;">${position}</td></tr>` : ''}
        </table>
        <p style="color:#e74c3c;">Please change your password after your first sign in.</p>
        <p>Download the ${process.env.APP_NAME} app to get started.</p>
      `,
    });
  } catch {
    // Email failure is non-fatal — account is already created
    console.error(`[adminController] Failed to send welcome email to ${email}`);
  }

  res.status(201).json({
    success: true,
    data: { id: user._id, email: user.email, role: user.role, firstName, lastName },
  });
});
