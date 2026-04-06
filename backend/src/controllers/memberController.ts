import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import MemberProfile, { EXCO_POSITIONS, MemberPosition } from '../models/MemberProfile';
import { AuthRequest } from '../middleware/auth';
import auditLogger from '../utils/auditLogger';
import sendEmail from '../utils/sendEmail';
import { cloudinary } from '../config/cloudinary';

// @desc    Get all members of requester's club
// @route   GET /api/members
// @access  Private (club_exco, system_admin)
export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const clubId = req.user!.role === 'system_admin' ? req.query.club : req.user!.club;

  if (!clubId) {
    res.status(400).json({ success: false, message: 'Club ID required' });
    return;
  }

  const members = await MemberProfile.find({ club: clubId })
    .populate('user', 'email role isActive')
    .sort({ position: 1, firstName: 1 });

  res.status(200).json({ success: true, count: members.length, data: members });
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private (club_exco, system_admin)
export const getMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const member = await MemberProfile.findById(req.params.id).populate('user', 'email role isActive').populate('club', 'name');

  if (!member) {
    res.status(404).json({ success: false, message: 'Member not found' });
    return;
  }

  // club_exco can only view members of their own club
  if (req.user!.role === 'club_exco' && member.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to view this member' });
    return;
  }

  res.status(200).json({ success: true, data: member });
};

// @desc    Add member (creates User + MemberProfile)
// @route   POST /api/members
// @access  Private (club_exco, system_admin)
export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, firstName, lastName, phone, position, joinDate } = req.body;

  const clubId = req.user!.role === 'system_admin' ? req.body.club : req.user!.club;
  if (!clubId) {
    res.status(400).json({ success: false, message: 'Club ID is required' });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'Email already registered' });
    return;
  }

  const role = EXCO_POSITIONS.includes(position as MemberPosition) ? 'club_exco' : 'leo_member';

  const user = await User.create({ email, password, role, club: clubId });

  const memberProfile = await MemberProfile.create({
    user: user._id,
    club: clubId,
    firstName,
    lastName,
    phone,
    position: position || 'Member',
    joinDate: joinDate || new Date(),
  });

  await User.findByIdAndUpdate(user._id, { memberProfile: memberProfile._id });

  // Send welcome email
  await sendEmail({
    to: email,
    subject: 'Welcome to Leo Moment',
    html: `
      <h2>Welcome to Leo Moment, ${firstName}!</h2>
      <p>Your account has been created. You can sign in with the following details:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please change your password after your first sign in.</p>
      <p>Download the Leo Moment app to get started.</p>
    `,
  });

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'ADD_MEMBER',
    resource: 'MemberProfile',
    resourceId: memberProfile._id.toString(),
    details: { email, firstName, lastName, position, clubId },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, email: user.email, role: user.role },
      memberProfile,
    },
  });
};

// @desc    Update member profile
// @route   PUT /api/members/:id
// @access  Private (club_exco, system_admin)
export const updateMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let member = await MemberProfile.findById(req.params.id);

  if (!member) {
    res.status(404).json({ success: false, message: 'Member not found' });
    return;
  }

  if (req.user!.role === 'club_exco' && member.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to update this member' });
    return;
  }

  // Handle profile image upload
  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/profiles' });
    req.body.profileImage = result.secure_url;
  }

  // If position changed, update user role accordingly
  if (req.body.position) {
    const newRole = EXCO_POSITIONS.includes(req.body.position as MemberPosition) ? 'club_exco' : 'leo_member';
    await User.findByIdAndUpdate(member.user, { role: newRole });
  }

  member = await MemberProfile.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'UPDATE_MEMBER',
    resource: 'MemberProfile',
    resourceId: req.params.id,
    details: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: member });
};

// @desc    Deactivate member
// @route   DELETE /api/members/:id
// @access  Private (club_exco, system_admin)
export const deactivateMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const member = await MemberProfile.findById(req.params.id);

  if (!member) {
    res.status(404).json({ success: false, message: 'Member not found' });
    return;
  }

  if (req.user!.role === 'club_exco' && member.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await MemberProfile.findByIdAndUpdate(req.params.id, { isActive: false });
  await User.findByIdAndUpdate(member.user, { isActive: false });

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'DEACTIVATE_MEMBER',
    resource: 'MemberProfile',
    resourceId: req.params.id,
    details: { memberId: req.params.id },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Member deactivated successfully' });
};
