import mongoose, { Document, Schema } from 'mongoose';

export interface IHelpRequest extends Document {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'converted_to_project';
  assignedTo?: mongoose.Types.ObjectId;
  club?: mongoose.Types.ObjectId;
  convertedProject?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    guestName: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    guestEmail: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    guestPhone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'converted_to_project'],
      default: 'pending',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
    convertedProject: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);
