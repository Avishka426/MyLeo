import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import MultipleDistrict from '../models/MultipleDistrict';
import District from '../models/District';
import Club from '../models/Club';
import Project from '../models/Project';
import asyncHandler from '../utils/asyncHandler';
import { cloudinary } from '../config/cloudinary';

// GET /api/multiple-districts  (system_admin only for list)
export const getMultipleDistricts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const mds = await MultipleDistrict.find().sort({ name: 1 });
  res.json({ success: true, data: mds });
});

// GET /api/multiple-districts/:id
export const getMultipleDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  const md = await MultipleDistrict.findById(req.params.id);
  if (!md) { res.status(404).json({ success: false, message: 'Multiple district not found' }); return; }
  res.json({ success: true, data: md });
});

// POST /api/multiple-districts  (system_admin only)
export const createMultipleDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  const md = await MultipleDistrict.create(req.body);
  res.status(201).json({ success: true, data: md });
});

// PUT /api/multiple-districts/:id
export const updateMultipleDistrict = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/multiple-districts' });
    req.body.logo = result.secure_url;
  }
  const md = await MultipleDistrict.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!md) { res.status(404).json({ success: false, message: 'Multiple district not found' }); return; }
  res.json({ success: true, data: md });
});

// GET /api/multiple-districts/:id/summary
// Full hierarchy: MD → districts → clubs → project stats
export const getMultipleDistrictSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const md = await MultipleDistrict.findById(req.params.id);
  if (!md) { res.status(404).json({ success: false, message: 'Not found' }); return; }

  const districts = await District.find({ multipleDistrict: md._id });

  const districtSummaries = await Promise.all(
    districts.map(async (district) => {
      const clubs = await Club.find({ district: district._id });
      const clubIds = clubs.map((c) => c._id);
      const projects = await Project.find({ club: { $in: clubIds } }).select('status');

      const byStatus = projects.reduce((acc: Record<string, number>, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      return {
        district: { _id: district._id, name: district.name, code: district.code, status: district.status },
        summary: {
          totalClubs: clubs.length,
          totalProjects: projects.length,
          projectsByStatus: byStatus,
        },
      };
    })
  );

  // MD-level totals
  const allDistrictIds = districts.map((d) => d._id);
  const allClubs = await Club.find({ district: { $in: allDistrictIds } });
  const allClubIds = allClubs.map((c) => c._id);
  const allProjects = await Project.find({ club: { $in: allClubIds } }).select('status');

  const mdTotals = allProjects.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      multipleDistrict: { _id: md._id, name: md.name, code: md.code },
      summary: {
        totalDistricts: districts.length,
        totalClubs: allClubs.length,
        totalProjects: allProjects.length,
        projectsByStatus: mdTotals,
      },
      districts: districtSummaries,
    },
  });
});
