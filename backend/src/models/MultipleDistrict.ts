import mongoose, { Document, Schema } from 'mongoose';

export interface IMultipleDistrict extends Document {
  name: string;
  code: string;
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MultipleDistrictSchema = new Schema<IMultipleDistrict>(
  {
    name: {
      type: String,
      required: [true, 'Multiple district name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: { type: String, trim: true },
    logo: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMultipleDistrict>('MultipleDistrict', MultipleDistrictSchema);
