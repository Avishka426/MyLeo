import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import Event from '../models/Event';
import { ROLE_LEVEL } from '../models/User';

// GET /api/events  — returns only upcoming events scoped to the user's district or MD
export const getEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const level = ROLE_LEVEL[user.role];
  const now = new Date();

  const baseFilter: Record<string, any> = { eventDate: { $gte: now } };
  let filter: Record<string, any>;

  if (level === 'district') {
    const districtId = (user.district as any)?._id ?? user.district;
    filter = { ...baseFilter, $or: [{ visibility: 'all' }, { district: districtId }] };
  } else if (level === 'multiple') {
    const mdId = (user.multipleDistrict as any)?._id ?? user.multipleDistrict;
    filter = { ...baseFilter, $or: [{ visibility: 'all' }, { multipleDistrict: mdId }] };
  } else {
    // system_admin: sees everything
    filter = baseFilter;
  }

  const events = await Event.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('district', 'name code logo')
    .populate('multipleDistrict', 'name code logo')
    .sort({ eventDate: 1 });

  res.json({ success: true, data: events });
});

// POST /api/events  — district_exco / multiple_exco only
export const createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { title, description, eventDate, images, visibility } = req.body;

  if (!title || !eventDate) {
    res.status(400).json({ success: false, message: 'title and eventDate are required' });
    return;
  }

  const parsedDate = new Date(eventDate);
  if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
    res.status(400).json({ success: false, message: 'eventDate must be a valid future date' });
    return;
  }

  const level = ROLE_LEVEL[user.role];
  const eventData: Record<string, any> = {
    title,
    description,
    eventDate: parsedDate,
    images: images ?? [],
    visibility: visibility === 'all' ? 'all' : 'own',
    createdBy: user._id,
  };

  if (level === 'district') {
    eventData.district = (user.district as any)?._id ?? user.district;
  } else if (level === 'multiple') {
    eventData.multipleDistrict = (user.multipleDistrict as any)?._id ?? user.multipleDistrict;
  }

  const event = await Event.create(eventData);
  res.status(201).json({ success: true, data: event });
});

// DELETE /api/events/:id
export const deleteEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }

  const userId = (req.user!._id as any).toString();
  const creatorId = (event.createdBy as any).toString();
  const level = ROLE_LEVEL[req.user!.role];

  if (creatorId !== userId && level !== 'system') {
    res.status(403).json({ success: false, message: 'Not authorised to delete this event' });
    return;
  }

  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted' });
});
