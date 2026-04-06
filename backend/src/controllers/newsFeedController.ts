import { Request, Response, NextFunction } from 'express';
import NewsPost from '../models/NewsPost';
import { AuthRequest } from '../middleware/auth';
import { cloudinary } from '../config/cloudinary';

// @desc    Get all published news posts (public)
// @route   GET /api/news
// @access  Public
export const getNewsPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const filter: Record<string, unknown> = { isPublished: true };
  if (req.query.club) filter.club = req.query.club;

  const posts = await NewsPost.find(filter)
    .populate('club', 'name clubCode logo')
    .populate('author', 'email')
    .sort({ publishedAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, count: posts.length, data: posts });
};

// @desc    Get single news post (public)
// @route   GET /api/news/:id
// @access  Public
export const getNewsPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const post = await NewsPost.findById(req.params.id)
    .populate('club', 'name clubCode logo')
    .populate('author', 'email');

  if (!post || !post.isPublished) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  res.status(200).json({ success: true, data: post });
};

// @desc    Create news post
// @route   POST /api/news
// @access  Private (club_exco only)
export const createNewsPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  req.body.club = req.user!.club;
  req.body.author = req.user!._id;

  // Handle image uploads
  if (req.files && Array.isArray(req.files)) {
    const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'leo_moment/news' });
      return result.secure_url;
    });
    req.body.images = await Promise.all(uploadPromises);
  }

  const post = await NewsPost.create(req.body);

  res.status(201).json({ success: true, data: post });
};

// @desc    Update news post
// @route   PUT /api/news/:id
// @access  Private (club_exco only, own club's post)
export const updateNewsPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let post = await NewsPost.findById(req.params.id);

  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  if (post.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    return;
  }

  post = await NewsPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  res.status(200).json({ success: true, data: post });
};

// @desc    Delete news post
// @route   DELETE /api/news/:id
// @access  Private (club_exco, system_admin)
export const deleteNewsPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const post = await NewsPost.findById(req.params.id);

  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  if (req.user!.role === 'club_exco' && post.club.toString() !== req.user!.club?.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    return;
  }

  await post.deleteOne();

  res.status(200).json({ success: true, message: 'Post deleted successfully' });
};
