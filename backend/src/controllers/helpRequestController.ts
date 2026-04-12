import { Request, Response, NextFunction } from 'express';
import HelpRequest from '../models/HelpRequest';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';
import { cloudinary } from '../config/cloudinary';

// @desc    Get public help request feed
// @route   GET /api/help-requests
// @access  Public
export const getHelpRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const requests = await HelpRequest.find(filter)
    .populate('claimedBy', 'name clubCode')
    .populate('joinRequests.club', 'name clubCode')
    .populate('convertedProject', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, data: requests });
};

// @desc    Submit help request (public, with optional images)
// @route   POST /api/help-requests
// @access  Public
export const submitHelpRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { guestName, guestEmail, guestPhone, subject, message } = req.body;

  if (!guestName || !guestEmail || !subject || !message) {
    res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
    return;
  }

  // Upload images to Cloudinary
  let images: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    const uploads = (req.files as Express.Multer.File[]).map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/help_requests' });
      return result.secure_url;
    });
    images = await Promise.all(uploads);
  }

  const helpRequest = await HelpRequest.create({ guestName, guestEmail, guestPhone, subject, message, images });

  res.status(201).json({
    success: true,
    message: 'Your request has been submitted and is now visible to Leo clubs.',
    data: { id: helpRequest._id },
  });
};

// @desc    Claim a help request (exclusive — only one club)
// @route   PUT /api/help-requests/:id/claim
// @access  Private (club_exco)
export const claimHelpRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  if (helpRequest.status !== 'pending') {
    res.status(400).json({ success: false, message: 'This request has already been claimed by another club' });
    return;
  }

  helpRequest.claimedBy = req.user!.club as any;
  helpRequest.claimedAt = new Date();
  helpRequest.status = 'claimed';
  await helpRequest.save();

  const populated = await HelpRequest.findById(helpRequest._id)
    .populate('claimedBy', 'name clubCode')
    .populate('joinRequests.club', 'name clubCode');

  res.status(200).json({ success: true, data: populated, message: 'You have claimed this help request.' });
};

// @desc    Mark claimed request as a joint project (other clubs can apply)
// @route   PUT /api/help-requests/:id/joint
// @access  Private (club_exco — claiming club only)
export const markJoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  if (helpRequest.claimedBy?.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Only the claiming club can mark this as a joint project' });
    return;
  }

  if (helpRequest.status !== 'claimed') {
    res.status(400).json({ success: false, message: 'Request must be claimed before marking as joint' });
    return;
  }

  helpRequest.isJoint = true;
  helpRequest.status = 'joint';
  await helpRequest.save();

  const populated = await HelpRequest.findById(helpRequest._id)
    .populate('claimedBy', 'name clubCode')
    .populate('joinRequests.club', 'name clubCode');

  res.status(200).json({ success: true, data: populated, message: 'Marked as joint project. Other clubs can now apply to join.' });
};

// @desc    Apply to join a joint help request
// @route   POST /api/help-requests/:id/join
// @access  Private (club_exco — non-claiming clubs)
export const requestJoin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  if (!helpRequest.isJoint || helpRequest.status !== 'joint') {
    res.status(400).json({ success: false, message: 'This request is not open for joining' });
    return;
  }

  const clubId = req.user!.club?.toString();

  if (helpRequest.claimedBy?.toString() === clubId) {
    res.status(400).json({ success: false, message: 'Your club already claimed this request' });
    return;
  }

  const alreadyApplied = helpRequest.joinRequests.some((jr) => jr.club.toString() === clubId);
  if (alreadyApplied) {
    res.status(400).json({ success: false, message: 'Your club has already applied to join' });
    return;
  }

  helpRequest.joinRequests.push({ club: req.user!.club as any, status: 'pending', requestedAt: new Date() });
  await helpRequest.save();

  const populated = await HelpRequest.findById(helpRequest._id)
    .populate('claimedBy', 'name clubCode')
    .populate('joinRequests.club', 'name clubCode');

  res.status(200).json({ success: true, data: populated, message: 'Join request submitted.' });
};

// @desc    Accept or reject a join request
// @route   PUT /api/help-requests/:id/join/:clubId
// @access  Private (club_exco — claiming club only)
export const reviewJoinRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { action } = req.body; // 'accept' | 'reject'

  if (!['accept', 'reject'].includes(action)) {
    res.status(400).json({ success: false, message: 'Action must be accept or reject' });
    return;
  }

  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  if (helpRequest.claimedBy?.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Only the claiming club can review join requests' });
    return;
  }

  const jr = helpRequest.joinRequests.find((j) => j.club.toString() === req.params.clubId);
  if (!jr) {
    res.status(404).json({ success: false, message: 'Join request not found' });
    return;
  }

  jr.status = action === 'accept' ? 'accepted' : 'rejected';
  await helpRequest.save();

  const populated = await HelpRequest.findById(helpRequest._id)
    .populate('claimedBy', 'name clubCode')
    .populate('joinRequests.club', 'name clubCode');

  res.status(200).json({ success: true, data: populated, message: `Join request ${jr.status}.` });
};

// @desc    Convert help request to project
// @route   PUT /api/help-requests/:id/convert
// @access  Private (club_exco — claiming club only)
export const convertToProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  if (helpRequest.claimedBy?.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Only the claiming club can convert this request' });
    return;
  }

  const { title, category, description } = req.body;
  if (!title || !category || !description) {
    res.status(400).json({ success: false, message: 'title, category, and description are required' });
    return;
  }

  const project = await Project.create({
    club: req.user!.club,
    title,
    category,
    description,
    status: 'upcoming',
    createdBy: req.user!._id,
  });

  await HelpRequest.findByIdAndUpdate(req.params.id, {
    status: 'converted_to_project',
    convertedProject: project._id,
    assignedTo: req.user!._id,
  });

  res.status(200).json({ success: true, data: project, message: 'Help request converted to project' });
};
