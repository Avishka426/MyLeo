import { Response } from 'express';
import { AuthRequest, canManageDistrict } from '../middleware/auth';
import District from '../models/District';
import Club from '../models/Club';
import Project from '../models/Project';
import asyncHandler from '../utils/asyncHandler';

// GET /api/districts
// district_exco → own district only; multiple_exco/admin → all
export const getDistricts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const scopeDistrictId = (req as any).scopeDistrictId;
  const scopeMultipleId = (req as any).scopeMultipleId;

  let filter: Record<string, any> = {};
  if (scopeDistrictId) filter._id = scopeDistrictId;
  if (scopeMultipleId) filter.multipleDistrict = scopeMultipleId;

  const districts = await District.find(filter)
    .populate('multipleDistrict', 'name code')
    .sort({ name: 1 });

  res.json({ success: true, data: districts });
});

// GET /api/districts/:id
export const getDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  const district = await District.findById(req.params.id)
    .populate('multipleDistrict', 'name code');
  if (!district) { res.status(404).json({ success: false, message: 'District not found' }); return; }

  if (!canManageDistrict(req.user!, district._id.toString())) {
    res.status(403).json({ success: false, message: 'Not authorized for this district' }); return;
  }
  res.json({ success: true, data: district });
});

// POST /api/districts  (system_admin / multiple_exco only)
export const createDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  const district = await District.create(req.body);
  res.status(201).json({ success: true, data: district });
});

// PUT /api/districts/:id
export const updateDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  const district = await District.findById(req.params.id);
  if (!district) { res.status(404).json({ success: false, message: 'District not found' }); return; }
  if (!canManageDistrict(req.user!, district._id.toString())) {
    res.status(403).json({ success: false, message: 'Not authorized' }); return;
  }
  const updated = await District.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
});

// GET /api/districts/:id/clubs
export const getDistrictClubs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const district = await District.findById(req.params.id);
  if (!district) { res.status(404).json({ success: false, message: 'District not found' }); return; }
  if (!canManageDistrict(req.user!, district._id.toString())) {
    res.status(403).json({ success: false, message: 'Not authorized' }); return;
  }
  const clubs = await Club.find({ district: req.params.id }).sort({ name: 1 });
  res.json({ success: true, data: clubs });
});

// GET /api/districts/:id/summary
// Returns per-club project stats for the district
export const getDistrictSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const district = await District.findById(req.params.id).populate('multipleDistrict', 'name code');
  if (!district) { res.status(404).json({ success: false, message: 'District not found' }); return; }
  if (!canManageDistrict(req.user!, district._id.toString())) {
    res.status(403).json({ success: false, message: 'Not authorized' }); return;
  }

  const clubs = await Club.find({ district: req.params.id });
  const clubIds = clubs.map((c) => c._id);

  // Project stats per club
  const clubSummaries = await Promise.all(
    clubs.map(async (club) => {
      const projects = await Project.find({ club: club._id }).select('status title');
      const byStatus = projects.reduce((acc: Record<string, number>, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
      return {
        club: { _id: club._id, name: club.name, clubCode: club.clubCode, status: club.status },
        projects: {
          total: projects.length,
          byStatus,
          list: projects.map((p) => ({ _id: p._id, title: p.title, status: p.status })),
        },
      };
    })
  );

  // District-level totals
  const allProjects = await Project.find({ club: { $in: clubIds } }).select('status');
  const districtTotals = allProjects.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      district: { _id: district._id, name: district.name, code: district.code },
      summary: {
        totalClubs: clubs.length,
        totalProjects: allProjects.length,
        projectsByStatus: districtTotals,
      },
      clubs: clubSummaries,
    },
  });
});
