import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole =
  | 'leo_member'
  | 'club_exco'
  | 'district_member'
  | 'district_exco'
  | 'multiple_member'
  | 'multiple_exco'
  | 'system_admin';

// Which hierarchy level a role belongs to
export const ROLE_LEVEL: Record<UserRole, 'club' | 'district' | 'multiple' | 'system'> = {
  leo_member:       'club',
  club_exco:        'club',
  district_member:  'district',
  district_exco:    'district',
  multiple_member:  'multiple',
  multiple_exco:    'multiple',
  system_admin:     'system',
};

export const CLUB_ROLES: UserRole[]     = ['leo_member', 'club_exco'];
export const DISTRICT_ROLES: UserRole[] = ['district_member', 'district_exco'];
export const MULTIPLE_ROLES: UserRole[] = ['multiple_member', 'multiple_exco'];
export const EXCO_ROLES: UserRole[]     = ['club_exco', 'district_exco', 'multiple_exco', 'system_admin'];

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  position?: string;
  // Scope refs — only one of these is set depending on role level
  club?: mongoose.Types.ObjectId;
  district?: mongoose.Types.ObjectId;
  multipleDistrict?: mongoose.Types.ObjectId;
  memberProfile?: mongoose.Types.ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['leo_member', 'club_exco', 'district_member', 'district_exco', 'multiple_member', 'multiple_exco', 'system_admin'],
      default: 'leo_member',
    },
    isActive: { type: Boolean, default: true },
    firstName: { type: String, trim: true },
    lastName:  { type: String, trim: true },
    position:  { type: String, trim: true },
    // Club-level scope
    club: { type: Schema.Types.ObjectId, ref: 'Club' },
    // District-level scope
    district: { type: Schema.Types.ObjectId, ref: 'District' },
    // Multiple-district-level scope
    multipleDistrict: { type: Schema.Types.ObjectId, ref: 'MultipleDistrict' },
    // Profile link (club members only)
    memberProfile: { type: Schema.Types.ObjectId, ref: 'MemberProfile' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Validate that the correct scope ref is set for the role
UserSchema.pre('validate', function (next) {
  const level = ROLE_LEVEL[this.role];
  if (level === 'club' && !this.club) {
    return next(new Error('Club-level roles require a club assignment'));
  }
  if (level === 'district' && !this.district) {
    return next(new Error('District-level roles require a district assignment'));
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

export default mongoose.model<IUser>('User', UserSchema);
