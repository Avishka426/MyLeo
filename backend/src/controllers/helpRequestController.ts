import { Request, Response, NextFunction } from 'express';
import HelpRequest from '../models/HelpRequest';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all help requests
// @route   GET /api/help-requests
// @access  Private (club_exco, system_admin)
export const getHelpRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'club_exco') {
    filter.club = req.user!.club;
  }

  if (req.query.status) filter.status = req.query.status;

  const requests = await HelpRequest.find(filter)
    .populate('assignedTo', 'email')
    .populate('club', 'name')
    .populate('convertedProject', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, data: requests });
};

// @desc    Submit help request (public)
// @route   POST /api/help-requests
// @access  Public
export const submitHelpRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { guestName, guestEmail, guestPhone, subject, message } = req.body;

  if (!guestName || !guestEmail || !subject || !message) {
    res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
    return;
  }

  const helpRequest = await HelpRequest.create({ guestName, guestEmail, guestPhone, subject, message });

  res.status(201).json({
    success: true,
    message: 'Your request has been submitted. We will get back to you soon.',
    data: { id: helpRequest._id },
  });
};

// @desc    Update help request status / assign
// @route   PUT /api/help-requests/:id
// @access  Private (club_exco, system_admin)
export const updateHelpRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
    return;
  }

  res.status(200).json({ success: true, data: helpRequest });
};

// @desc    Convert help request to project
// @route   PUT /api/help-requests/:id/convert
// @access  Private (club_exco only)
export const convertToProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const helpRequest = await HelpRequest.findById(req.params.id);

  if (!helpRequest) {
    res.status(404).json({ success: false, message: 'Help request not found' });
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
    club: req.user!.club,
    assignedTo: req.user!._id,
  });

  res.status(200).json({ success: true, data: project, message: 'Help request converted to project' });
};
