import mongoose, { Document, Schema } from 'mongoose';

export interface IDistrict extends Document {
  name: string;
  code: string;
  multipleDistrict: mongoose.Types.ObjectId;
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    multipleDistrict: {
      type: Schema.Types.ObjectId,
      ref: 'MultipleDistrict',
      required: [true, 'Multiple district is required'],
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

export default mongoose.model<IDistrict>('District', DistrictSchema);
