import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole, ROLE_LEVEL } from '../models/User';
import Club from '../models/Club';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload { id: string }

// ── Token verification ────────────────────────────────────────────────────────
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, secret) as JwtPayload;
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized, token expired or invalid' });
    return;
  }
  const user = await User.findById(decoded.id)
    .select('+password')
    .populate('club', 'name clubCode district')
    .populate('district', 'name code multipleDistrict')
    .populate('multipleDistrict', 'name code');

  if (!user || !user.isActive) {
    res.status(401).json({ success: false, message: 'Not authorized, user not found or inactive' });
    return;
  }
  req.user = user;
  next();
};

// ── Role-based gate ───────────────────────────────────────────────────────────
// Usage: authorize('club_exco', 'district_exco')
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
      return;
    }
    next();
  };
};

// ── Scope-aware district gate ─────────────────────────────────────────────────
// district_exco can only act on their own district's resources.
// multiple_exco and system_admin pass through with no restriction.
// Usage: put this after protect on district-scoped routes.
//
// Controller then reads req.scopeDistrictId to filter queries.
export const districtScope = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authorized' }); return; }

  const { role } = req.user;
  const level = ROLE_LEVEL[role];

  if (level === 'system') {
    // system_admin: unrestricted
    (req as any).scopeDistrictId = null;
    return next();
  }

  if (level === 'multiple') {
    // multiple_exco/member: can see all districts under their MD
    (req as any).scopeMultipleId = (req.user.multipleDistrict as any)?._id ?? req.user.multipleDistrict;
    (req as any).scopeDistrictId = null;
    return next();
  }

  if (level === 'district') {
    (req as any).scopeDistrictId = (req.user.district as any)?._id ?? req.user.district;
    return next();
  }

  // Club-level users can only see their own club's district
  if (level === 'club' && req.user.club) {
    const clubId = (req.user.club as any)?._id ?? req.user.club;
    const club = await Club.findById(clubId).select('district');
    (req as any).scopeDistrictId = club?.district ?? null;
    return next();
  }

  res.status(403).json({ success: false, message: 'Insufficient scope' });
};

// ── Ownership check helpers (use inside controllers) ─────────────────────────

// Returns true if the user can manage the given club
export const canManageClub = (user: IUser, clubId: string): boolean => {
  const level = ROLE_LEVEL[user.role];
  if (level === 'system') return true;
  if (level === 'multiple') return true; // multiple_exco manages all
  if (level === 'district') return true; // district_exco manages clubs in district (caller must verify district match)
  if (level === 'club') {
    const userClubId = (user.club as any)?._id?.toString() ?? user.club?.toString();
    return userClubId === clubId;
  }
  return false;
};

// Returns true if the user can manage the given district
export const canManageDistrict = (user: IUser, districtId: string): boolean => {
  const level = ROLE_LEVEL[user.role];
  if (level === 'system' || level === 'multiple') return true;
  if (level === 'district') {
    const userDistId = (user.district as any)?._id?.toString() ?? user.district?.toString();
    return userDistId === districtId;
  }
  return false;
};
