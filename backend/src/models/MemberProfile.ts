import mongoose, { Document, Schema } from 'mongoose';

export type MemberPosition =
  | 'President'
  | 'Vice President'
  | 'Secretary'
  | 'Assistant Secretary'
  | 'Treasurer'
  | 'Assistant Treasurer'
  | 'Member';

export const EXCO_POSITIONS: MemberPosition[] = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
];

export interface IMemberProfile extends Document {
  user: mongoose.Types.ObjectId;
  club: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone?: string;
  position: MemberPosition;
  joinDate: Date;
  isActive: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberProfileSchema = new Schema<IMemberProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: [
        'President',
        'Vice President',
        'Secretary',
        'Assistant Secretary',
        'Treasurer',
        'Assistant Treasurer',
        'Member',
      ],
      default: 'Member',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMemberProfile>('MemberProfile', MemberProfileSchema);
