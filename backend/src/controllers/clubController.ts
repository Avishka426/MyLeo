import { Request, Response, NextFunction } from 'express';
import Club from '../models/Club';
import { AuthRequest, canManageClub } from '../middleware/auth';
import auditLogger from '../utils/auditLogger';
import { cloudinary } from '../config/cloudinary';

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Private
export const getClubs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  const clubs = await Club.find({ status: 'active' }).sort({ name: 1 });
  res.status(200).json({ success: true, count: clubs.length, data: clubs });
};

// @desc    Get single club
// @route   GET /api/clubs/:id
// @access  Private
export const getClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const club = await Club.findById(req.params.id).populate('district', 'name code');
  if (!club) {
    res.status(404).json({ success: false, message: 'Club not found' });
    return;
  }
  res.status(200).json({ success: true, data: club });
};

// @desc    Create club
// @route   POST /api/clubs
// @access  Private (system_admin only)
export const createClub = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const club = await Club.create(req.body);

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'CREATE_CLUB',
    resource: 'Club',
    resourceId: club._id.toString(),
    details: { name: club.name, clubCode: club.clubCode },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: club });
};

// @desc    Update club
// @route   PUT /api/clubs/:id
// @access  Private (club_exco of that club or system_admin)
export const updateClub = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404).json({ success: false, message: 'Club not found' });
    return;
  }

  if (!canManageClub(req.user!, req.params.id)) {
    res.status(403).json({ success: false, message: 'Not authorized to update this club' });
    return;
  }

  // Handle logo upload if file provided
  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/clubs' });
    req.body.logo = result.secure_url;
  }

  club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'UPDATE_CLUB',
    resource: 'Club',
    resourceId: req.params.id,
    details: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: club });
};

// @desc    Delete club
// @route   DELETE /api/clubs/:id
// @access  Private (system_admin only)
export const deleteClub = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    res.status(404).json({ success: false, message: 'Club not found' });
    return;
  }

  await club.deleteOne();

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'DELETE_CLUB',
    resource: 'Club',
    resourceId: req.params.id,
    details: { name: club.name },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Club deleted successfully' });
};
