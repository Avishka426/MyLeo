import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';

// @desc    Get all map-visible projects with coordinates (public)
// @route   GET /api/map/projects
// @access  Public
export const getMapProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  const projects = await Project.find({
    isMapVisible: true,
    'location.coordinates': { $exists: true, $ne: [] },
  })
    .populate('club', 'name clubCode')
    .select('title category status startDate endDate location club media');

  const mapData = projects.map((p) => ({
    id: p._id,
    title: p.title,
    category: p.category,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    club: p.club,
    image: p.media?.[0] || null,
    location: {
      coordinates: p.location?.coordinates,
      address: p.location?.address,
      placeName: p.location?.placeName,
    },
  }));

  res.status(200).json({ success: true, count: mapData.length, data: mapData });
};
