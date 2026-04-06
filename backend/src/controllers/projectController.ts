import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';
import auditLogger from '../utils/auditLogger';
import { cloudinary } from '../config/cloudinary';

// @desc    Get all projects (public)
// @route   GET /api/projects
// @access  Public
export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const filter: Record<string, unknown> = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.club) filter.club = req.query.club;
  if (req.query.category) filter.category = req.query.category;

  const projects = await Project.find(filter)
    .populate('club', 'name clubCode')
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: projects.length, data: projects });
};

// @desc    Get single project (public)
// @route   GET /api/projects/:id
// @access  Public
export const getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const project = await Project.findById(req.params.id)
    .populate('club', 'name clubCode district')
    .populate('createdBy', 'email');

  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }

  res.status(200).json({ success: true, data: project });
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (club_exco only)
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  req.body.club = req.user!.club;
  req.body.createdBy = req.user!._id;

  // Handle media uploads
  if (req.files && Array.isArray(req.files)) {
    const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/projects' });
      return result.secure_url;
    });
    req.body.media = await Promise.all(uploadPromises);
  }

  const project = await Project.create(req.body);

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'CREATE_PROJECT',
    resource: 'Project',
    resourceId: project._id.toString(),
    details: { title: project.title, club: project.club },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: project });
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (club_exco only)
export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }

  if (project.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    return;
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'UPDATE_PROJECT',
    resource: 'Project',
    resourceId: req.params.id,
    details: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: project });
};

// @desc    Update project map location
// @route   PUT /api/projects/:id/location
// @access  Private (club_exco only)
export const updateProjectLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { longitude, latitude, address, placeName, isMapVisible } = req.body;

  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }

  if (project.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to update this project location' });
    return;
  }

  if (longitude === undefined || latitude === undefined) {
    res.status(400).json({ success: false, message: 'Longitude and latitude are required' });
    return;
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    {
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        placeName,
      },
      isMapVisible: isMapVisible !== undefined ? isMapVisible : true,
    },
    { new: true }
  );

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'UPDATE_PROJECT_LOCATION',
    resource: 'Project',
    resourceId: req.params.id,
    details: { longitude, latitude, address, placeName },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: updatedProject });
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (club_exco, system_admin)
export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }

  if (req.user!.role === 'club_exco' && project.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    return;
  }

  await project.deleteOne();

  await auditLogger({
    userId: req.user!._id.toString(),
    action: 'DELETE_PROJECT',
    resource: 'Project',
    resourceId: req.params.id,
    details: { title: project.title },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Project deleted successfully' });
};
