import mongoose, { Document, Schema } from 'mongoose';

export interface IClub extends Document {
  name: string;
  clubCode: string;
  district: string;
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema = new Schema<IClub>(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
    },
    clubCode: {
      type: String,
      required: [true, 'Club code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IClub>('Club', ClubSchema);
