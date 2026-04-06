import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import sendEmail from '../utils/sendEmail';
import { AuthRequest } from '../middleware/auth';

// @desc    Sign in
// @route   POST /api/auth/signin
// @access  Public
export const signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  const user = await User.findOne({ email }).select('+password').populate('club', 'name clubCode').populate('memberProfile', 'firstName lastName position');

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ success: false, message: 'Account is inactive. Contact your administrator.' });
    return;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user._id.toString());

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      club: user.club,
      memberProfile: user.memberProfile,
    },
  });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = await User.findById(req.user!._id)
    .populate('club', 'name clubCode district logo')
    .populate('memberProfile', 'firstName lastName position profileImage');

  res.status(200).json({ success: true, data: user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Current password is incorrect' });
    return;
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Leo Moment – Password Reset',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Leo Moment account.</p>
      <p>Click the link below to reset your password (valid for 10 minutes):</p>
      <a href="${resetUrl}" style="background:#1B4F8A;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    return;
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id.toString());
  res.status(200).json({ success: true, token, message: 'Password reset successful' });
};
