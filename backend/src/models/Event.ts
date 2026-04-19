import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  images: string[];
  eventDate: Date;
  visibility: 'own' | 'all';
  district?: mongoose.Types.ObjectId;
  multipleDistrict?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, trim: true },
    images: { type: [String], default: [] },
    eventDate: { type: Date, required: [true, 'Event date is required'] },
    visibility: { type: String, enum: ['own', 'all'], default: 'own' },
    district: { type: Schema.Types.ObjectId, ref: 'District' },
    multipleDistrict: { type: Schema.Types.ObjectId, ref: 'MultipleDistrict' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
